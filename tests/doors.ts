/**
 * Opening the doors, the way a player has to.
 *
 * The Family Business screen lists the nine things a production company has to
 * be able to do and says which are shut. `company.greenlight` refuses through a
 * shut one, so any test that wants a picture made has to open the greenlight
 * door first — hold material, put somebody in the head of production post, bind
 * the production package, and have money behind it.
 *
 * This does that with the game's own commands rather than by writing the
 * records, so the setup is a path a player could walk and the test fails if
 * that path ever stops working.
 */

import { expect } from 'vitest';
import type { Simulation } from '@/engine';
import { capabilitiesOf, parentCompany, seatHeldBy, whyNotTakeIt } from '@/engine/world/company';
import { MS_WEEK } from '@/engine/world/lot';
import { LOT_NAME } from '@/engine/content/estate';
import { stillMissing } from '@/engine/world/making';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

/**
 * Somebody who will actually take the seat being offered.
 *
 * Both helpers below used to reach for the same relative, which worked because
 * `company.fill_post` never emptied the chair somebody was already in — so one
 * person held the head of production and the accountant at once and both doors
 * opened. Nobody is two people now, and nobody has to say yes, so the path a
 * player walks has to allocate: whoever holds nothing at this company, and
 * failing that whoever the world says would still agree to move.
 *
 * Which is the scarcity `world/company.ts` has always described — six posts and
 * three relatives — and it is why these two functions are separate. Only the
 * head of production and the accountant gate a door, so three people is enough
 * to open all nine, by one.
 */
const GATING = ['production', 'accountant'];

function willTake(sim: Simulation, role: 'production' | 'accountant'): string {
  const company = parentCompany(sim.universe)!.id;
  const people = Object.values(sim.universe.people)
    .filter((one) => one.careerTrack !== 'executive' && !whyNotTakeIt(sim, one.id, role));
  const seat = (id: string) => seatHeldBy(sim, id, company);
  // Never somebody already in a seat a door depends on. The first version of
  // this fell back to whoever would agree, which was the player — who by then
  // was the head of production, so seating them as the accountant emptied the
  // chair the greenlight door reads and shut it again.
  return (people.find((one) => !seat(one.id))
    ?? people.find((one) => !GATING.includes(seat(one.id)!.role))
    ?? people[0]!).id;
}

/**
 * Opens the greenlight door, and says so if it could not.
 *
 * Everything here is a real command. A silent failure would leave the door shut
 * and every test after it failing on the greenlight instead of on the thing it
 * was written to check, so each step is asserted.
 */
export function openTheDoors(sim: Simulation, title = 'Something To Make'): void {
  // Idempotent: a test that makes two pictures calls this twice, and the post
  // is already filled the second time.
  if (capabilitiesOf(sim).find((one) => one.id === 'greenlight')?.can) return;

  // Somebody to run production. The family is who there is.
  expect(run(sim, 'company.fill_post', { role: 'production', personId: willTake(sim, 'production') }).ok,
    'could not fill the head of production post').toBe(true);


  // Something to make.
  expect(run(sim, 'company.option', { title, hold: 'option', months: 18 }).ok,
    'could not option any material').toBe(true);

  // A payroll, because a crew is on one from the first week of prep.
  expect(run(sim, 'company.register', { registry: 'is_employer' }).ok,
    'could not register as an employer').toBe(true);

  // And cover. Nobody lets a foot of film be shot uninsured, and a location and
  // a hire company each ask for a different one of these.
  // Errors and omissions is not a greenlight blocker — a picture can start
  // without it — but the certificate is on the delivery list and cannot be
  // filed for cover the company never bought, so a test that delivers needs it.
  for (const policy of ['general_liability', 'workers_comp', 'production_package', 'errors_omissions']) {
    expect(run(sim, 'company.insure', { policy }).ok, `could not bind ${policy}`).toBe(true);
  }

  const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight')!;
  expect(door.can, `the greenlight door is still shut: ${door.blockers.map((b) => b.need).join(', ')}`)
    .toBe(true);
}

/**
 * Opens the reimbursement door, which is a different door from the greenlight.
 *
 * A company can make a picture without being able to claim anything back: the
 * registers are there from the first day and the accountant is not. Somebody
 * has to be in the post, because the claim is audited and an audit needs books
 * a person kept from the beginning.
 */
export function openTheBooks(sim: Simulation): void {
  if (capabilitiesOf(sim).find((one) => one.id === 'claim_rebate')?.can) return;
  expect(run(sim, 'company.fill_post', { role: 'accountant', personId: willTake(sim, 'accountant') }).ok,
    'could not put anybody in as the production accountant').toBe(true);
  const door = capabilitiesOf(sim).find((one) => one.id === 'claim_rebate')!;
  expect(door.can, `the reimbursement door is still shut: ${door.blockers.map((b) => b.need).join(', ')}`)
    .toBe(true);
}

/**
 * Runs a picture out to delivered, the way a producer actually gets one there.
 *
 * A week at a time, filing whatever paperwork the list is waiting on, until it
 * is over or the patience runs out. Not one pass and a hand-over, because
 * finished work comes apart now: a review can send an episode back down the
 * ladder in the last week before delivery, and what happens next is that
 * somebody re-cuts it and files the certificate again. A test that advanced
 * once and handed over once would be testing a world where nothing ever goes
 * wrong, which is exactly the world this engine stopped being.
 */
export function deliverIt(sim: Simulation, projectId: string, weeks = 400): boolean {
  for (let i = 0; i < weeks; i += 1) {
    const project = sim.universe.projects[projectId];
    if (!project || project.stage === 'delivered') return true;
    for (const element of stillMissing(project).filter((one) => one.by === 'business')) {
      run(sim, 'company.deliver', { projectId, elementId: element.id });
    }
    if (sim.universe.projects[projectId]?.stage === 'delivered') return true;
    sim.advanceTo(sim.now + MS_WEEK);
  }
  return sim.universe.projects[projectId]?.stage === 'delivered';
}

/**
 * Puts enough in the company's account that a deal can be paid out of it.
 *
 * Everybody except the player is an abstraction the picture pays for out of the
 * budget as the periods run, so seating them moves no cash at all. The player
 * holds a real account, so their fee is the one cast payment that actually has
 * to be handed over on the day — and a company on its first morning holds about
 * a hundred and seventeen thousand against a lead band of eight hundred and
 * seventy-eight thousand on a twenty million euro feature. It goes under, which
 * is allowed and is said out loud; what this exists for is the other half of
 * that test, where the same deal is closed by a company that can pay and
 * nothing is said.
 *
 * Posted as a letting rather than as money from the family, because the family
 * putting money in is a thing the game counts and spends standing on. The lot
 * earning it is not: measured over ten years across three seeds, the cash the
 * lot's lettings pile up between month-ends peaks between 1.86 and 2.2 million,
 * so this is a reachable balance rather than an invented one.
 */
export function theyCanAffordIt(sim: Simulation, cents = 2_000_000_00): void {
  const company = parentCompany(sim.universe);
  const account = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company?.id && one.kind === 'company_cash' && !one.closedAt);
  if (!account) return;
  sim.income(account.id, cents, `${LOT_NAME}: Eldey Pictures`, 'business');
}
