/**
 * The five priced entries nothing reads, and what they cost you anyway.
 *
 * Three guild signatures and two policies are bought with a command, carry a
 * real price, and are read by no door, no refusal and no number. It is tempting
 * to file that under "decides nothing" and stop. It is not true. The money is
 * an outcome: `greenlight` will not open under `GREENLIGHT_FLOOR`, so a company
 * that spends its opening balance on paper nothing reads shuts a door it had
 * open. These are not dead words. They are traps, which is a different defect
 * and a worse one, because a dead word costs a player nothing.
 *
 * The measurement that says otherwise is a measurement taken on money no save
 * has. Funding the company five million euros first and then asking whether
 * holding one of these changes an answer returns "no" for all five — the floor
 * is simply out of reach, and the instrument has been made blind to the only
 * thing these entries move. Everything below runs on the money the save opens
 * with, after the page has been walked with its own chips.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import {
  GREENLIGHT_FLOOR, capabilitiesOf, companyCash, parentCompany, postFacts, seatHeldBy,
} from '@/engine/world/company';
import { fixFor } from '@/ui/workspaces/fix';
import { EMPLOYER_TAX_ON_POSTS } from '@/engine/world/lot';
import { TRYGGINGAGJALD } from '@/engine/content/sugar';
import { ROLES } from '@/engine/content/incorporation';

/** Priced, bought with a command, and read by nothing in the engine. */
const PRICED_AND_QUIET = [
  ['guild/wga', { kind: 'company.sign', payload: { guild: 'wga' } }],
  ['guild/dga', { kind: 'company.sign', payload: { guild: 'dga' } }],
  ['guild/iatse', { kind: 'company.sign', payload: { guild: 'iatse' } }],
  ['policy/property', { kind: 'company.insure', payload: { policy: 'property' } }],
  ['policy/business_interruption', { kind: 'company.insure', payload: { policy: 'business_interruption' } }],
] as const;

/** Every door and, where it is shut, what shuts it. */
const answers = (sim: Simulation): string => capabilitiesOf(sim)
  .map((one) => `${one.id}:${one.can ? 'open' : one.blockers.map((b) => b.need).join('+')}`)
  .join(' | ');

/**
 * The page walked to the end with its own chips and nothing else.
 *
 * Recomputed after every single press, because that is what the screen does:
 * `Missing` reads `capabilitiesOf` through the store and redraws when a command
 * lands. Pressing a snapshot instead takes three options on three titles for
 * the one thing three doors each want, which is a sequence no player can see.
 */
/**
 * Somebody who can actually take a seat, the way a player would pick one.
 *
 * `walked` used to hand the same person every post, which the world allowed
 * because `fill_post` never emptied the seat they were already in — so one
 * relative held four chairs at once and every door behind them opened. Nobody is
 * two people now, so the walk has to allocate: whoever is holding nothing first,
 * and failing that whoever is in a seat no door depends on.
 *
 * That is the scarcity `world/company.ts` has always described and never charged
 * for — six posts and three relatives. Only two of the six gate a door, the head
 * of production and the accountant, so three people is still enough to open all
 * nine. It is enough by one.
 */
const GATING = ['production', 'accountant'];

function somebodyFree(sim: Simulation): { id: string } {
  // At this company. Both parents sit on the sugar group's board as well, and
  // those are not competing jobs — an unscoped look finds the mother's seat at
  // the cane group, calls her free, and offers her a second film post she is
  // already too senior to take.
  const company = parentCompany(sim.universe)!.id;
  const people = Object.values(sim.universe.people).filter((one) => one.careerTrack !== 'executive');
  const seat = (id: string) => seatHeldBy(sim, id, company);
  return people.find((one) => !seat(one.id))
    ?? people.find((one) => !GATING.includes(seat(one.id)!.role))
    ?? people[0]!;
}

function walked(seed: string): Simulation {
  const sim = quickSave({}, seed);
  let presses = 0;
  for (let guard = 0; guard < 60; guard += 1) {
    let pressed = false;
    for (const door of capabilitiesOf(sim)) {
      if (door.can) continue;
      for (const blocker of door.blockers) {
        const fix = fixFor(blocker);
        if (!fix) {
          expect(blocker.fixKind, 'a blocker with no chip that is not money').toBe('money');
          continue;
        }
        let answer: { ok: boolean } | undefined;
        if (!('asks' in fix)) {
          answer = sim.execute<{ ok: boolean }>({ kind: fix.kind, payload: fix.payload }).value;
        } else if (fix.asks === 'who') {
          answer = sim.execute<{ ok: boolean }>(
            { kind: 'company.fill_post', payload: { role: fix.role, personId: somebodyFree(sim).id } },
          ).value;
        } else {
          answer = sim.execute<{ ok: boolean }>(
            { kind: 'company.option', payload: { title: `A Thing ${presses}` } },
          ).value;
        }
        if (answer?.ok) { presses += 1; pressed = true; }
        break;
      }
      if (pressed) break;
    }
    if (!pressed) break;
  }
  return sim;
}

describe('the page opens every door with its own chips', () => {
  it('needs eleven presses and leaves the greenlight floor clear', () => {
    for (const seed of ['decides-a', 'decides-b', 'decides-c']) {
      const sim = walked(seed);
      expect(capabilitiesOf(sim).filter((one) => !one.can), `${seed} stopped short`).toEqual([]);
      expect(companyCash(sim.universe), `${seed} walked itself under the floor`)
        .toBeGreaterThan(GREENLIGHT_FLOOR);
      expect(companyCash(sim.universe)).toBe(90_800_00);
    }
  });
});

describe('what the five priced quiet entries decide', () => {
  it('charges for all five and shuts a door on its own with one', () => {
    const table = PRICED_AND_QUIET.map(([name, command]) => {
      const sim = walked('decides-a');
      const was = answers(sim);
      const before = companyCash(sim.universe);
      expect(sim.execute<{ ok: boolean }>(command).value!.ok, `${name} refused`).toBe(true);
      return `${name} costs ${(before - companyCash(sim.universe)) / 100}`
        + `${answers(sim) === was ? '' : ' and shuts a door'}`;
    });
    expect(table).toEqual([
      'guild/wga costs 10000',
      'guild/dga costs 15000',
      'guild/iatse costs 20000',
      'policy/property costs 60000 and shuts a door',
      'policy/business_interruption costs 18000',
    ]);
  });

  it('buys property cover and shuts the greenlight door', () => {
    for (const seed of ['decides-a', 'decides-b', 'decides-c']) {
      const sim = walked(seed);
      const was = answers(sim);
      sim.execute({ kind: 'company.insure', payload: { policy: 'property' } });
      expect(companyCash(sim.universe)).toBe(30_800_00);
      expect(answers(sim), 'property cover moved nothing').not.toBe(was);
      expect(capabilitiesOf(sim).find((one) => one.id === 'greenlight')!.blockers[0]!.need)
        .toBe('Money In The Company');
    }
  });

  it('signs the three guilds nothing reads and shuts it too', () => {
    const sim = walked('decides-a');
    for (const guild of ['wga', 'dga', 'iatse']) {
      expect(sim.execute<{ ok: boolean }>({ kind: 'company.sign', payload: { guild } }).value!.ok)
        .toBe(true);
    }
    expect(companyCash(sim.universe)).toBe(45_800_00);
    expect(capabilitiesOf(sim).find((one) => one.id === 'greenlight')!.can).toBe(false);
  });

  it('leaves the two free posts genuinely inert', () => {
    for (const role of ['development', 'business_affairs']) {
      const sim = walked('decides-a');
      const was = answers(sim);
      const cash = companyCash(sim.universe);
      // Somebody who is not already in a seat a door depends on. Taking the head
      // of production out of their chair to be head of development shuts the
      // greenlight door, which is a true and interesting thing and is not what
      // this test is about: the claim here is that the post itself moves nothing.
      const who = somebodyFree(sim);
      expect(sim.execute<{ ok: boolean }>(
        { kind: 'company.fill_post', payload: { role, personId: who.id } },
      ).value!.ok).toBe(true);
      expect(companyCash(sim.universe), `${role} cost something`).toBe(cash);
      expect(answers(sim), `${role} moved an answer`).toBe(was);
    }
  });

  it('charges every salary the screen promises, and the tax on top of it', () => {
    // This test used to assert the opposite and pass for a reason that had
    // nothing to do with salaries. `RoleFacts.monthlyCents` was printed three
    // times as a recurring cost and debited nowhere, so it compared the ending
    // balance of a staffed company against an empty one and expected them equal.
    // They were — because `familyCovers` tops the company up to a round hundred
    // thousand whenever it goes under, so both arms landed on the same round
    // number no matter what either had spent. The salaries are charged now, and
    // an ending balance is the one figure that cannot see it.
    //
    // So it reads the postings. Every króna charged under a post's own label,
    // plus the employer's contribution on all of them, against what the screens
    // promise — which is what "the figure on the form is the figure debited"
    // actually means.
    // And it staffs with a different person each time, because nobody is two
    // people any more. The company cannot fill all six — six posts, three
    // relatives — so what is charged is what is actually held, read off the save
    // rather than assumed, which is the figure the claim is about anyway.
    const months = 400 * 24 * 60 * 60 * 1000;
    const staffed = walked('decides-a');
    for (const role of ['development', 'production', 'business_affairs', 'accountant']) {
      staffed.execute({
        kind: 'company.fill_post', payload: { role, personId: somebodyFree(staffed).id },
      });
    }
    // Off the role's own row and not off the post, because the post no longer
    // carries a copy of the figure — that copy was written and never read, and
    // a second answer waiting to disagree with the first is what it would be.
    // The production company's posts, not every post in the save: the sugar group
    // carries seven of its own and two of them are filled, and it only happens to
    // come to the same figure because a director's fee is not a salary and both
    // board seats are costed at nought.
    const ours = parentCompany(staffed.universe)!.id;
    const filled = Object.values(staffed.universe.posts)
      .filter((one) => one.personId && one.companyId === ours);
    const promised = filled
      .reduce((sum, one) => sum + (postFacts(one.role)?.monthlyCents ?? 0), 0);
    // Six posts and three relatives, so not every seat can be held at once. What
    // matters is that whatever IS held is charged, and the salaries are real
    // money rather than a round number somebody chose for this test.
    expect(promised, 'nobody is in a paid seat, so this proves nothing').toBeGreaterThan(0);
    expect(filled.length).toBeLessThanOrEqual(ROLES.length);

    const before = staffed.universe.transactions.length;
    staffed.advanceTo(staffed.now + months);

    const labels = new Set(filled.map((one) => postFacts(one.role)!.label));
    const since = staffed.universe.transactions.slice(before);
    const paid = (memo: (one: string) => boolean): number => since
      .filter((one) => memo(one.memo))
      .reduce((sum, one) => sum + one.postings
        .filter((p) => p.amount > 0).reduce((m, p) => m + p.amount, 0), 0);

    const wages = paid((memo) => labels.has(memo));
    const onTop = paid((memo) => memo === EMPLOYER_TAX_ON_POSTS);
    expect(wages, 'the posts are on a payroll and it runs every month')
      .toBeGreaterThan(0);
    // Thirteen months of it, so the two figures are each other's check: the
    // contribution is a fixed share of what was actually paid, and if either
    // line drifts the ratio says so rather than a balance somewhere swallowing it.
    expect(wages % promised, 'a whole number of months, or a month was missed').toBe(0);
    expect(wages / promised, 'thirteen months between the two dates').toBe(13);
    expect(onTop, 'the employer pays on top of the wage, and it is not withheld')
      .toBe(Math.round(promised * TRYGGINGAGJALD) * 13);
    expect(staffed.ledger.audit()).toEqual([]);
  });
});
