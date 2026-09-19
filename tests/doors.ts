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
import { LOT_NAME } from '@/engine/content/estate';

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

/**
 * Says what a television project is, so the greenlight will take it.
 *
 * A film can be made without a concept and television cannot: a series is a machine
 * that makes episodes, and `whyNotMakeAs` refuses one with nothing underneath it.
 * That refusal is the point of the engine, so it is not weakened here — instead
 * every test that needs a working television project says what the thing is, the
 * way a producer would have to.
 *
 * `case` by default because it is the one engine that can carry anything: its
 * stories arrive from outside, so it never runs out and no plan is too long for it.
 * A test about a *refusal* passes its own engine instead.
 */
export function sayWhatItIs(
  sim: Simulation, projectId: string, engineId = 'case', people = 8,
): void {
  const out = run(sim, 'company.conceive', {
    projectId, engineId, worldId: 'is-39-reykjavik', people,
  });
  expect(out.ok, `could not say what ${projectId} is: ${out.error}`).toBe(true);
}
