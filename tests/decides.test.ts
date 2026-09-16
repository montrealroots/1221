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
import { GREENLIGHT_FLOOR, capabilitiesOf, companyCash } from '@/engine/world/company';
import { fixFor } from '@/ui/workspaces/fix';

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
function walked(seed: string): Simulation {
  const sim = quickSave({}, seed);
  const who = Object.values(sim.universe.people)[0]!;
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
            { kind: 'company.fill_post', payload: { role: fix.role, personId: who.id } },
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
      const who = Object.values(sim.universe.people)[0]!;
      expect(sim.execute<{ ok: boolean }>(
        { kind: 'company.fill_post', payload: { role, personId: who.id } },
      ).value!.ok).toBe(true);
      expect(companyCash(sim.universe), `${role} cost something`).toBe(cash);
      expect(answers(sim), `${role} moved an answer`).toBe(was);
    }
  });

  it('never charges the salary the screen promises for any of them', () => {
    // `RoleFacts.monthlyCents` is written onto the post and printed three times
    // as a recurring cost: on the fill form, in the hire notification, and on
    // the post's own page. Nothing debits it. Paired, because the company does
    // have running costs — the lot's overhead alone takes it from €90,800 to
    // €18,161.29 over the same thirteen months — and an absolute figure would
    // be measuring those instead.
    const months = 400 * 24 * 60 * 60 * 1000;
    const empty = walked('decides-a');
    empty.advanceTo(empty.now + months);

    const staffed = walked('decides-a');
    const who = Object.values(staffed.universe.people)[0]!;
    for (const role of ['development', 'production', 'business_affairs', 'accountant']) {
      staffed.execute({ kind: 'company.fill_post', payload: { role, personId: who.id } });
    }
    const promised = Object.values(staffed.universe.posts)
      .filter((one) => one.personId)
      .reduce((sum, one) => sum + one.monthlyCents, 0);
    expect(promised, 'the posts promise nothing, so there is nothing to charge')
      .toBe(45_000_00);
    staffed.advanceTo(staffed.now + months);

    expect(companyCash(staffed.universe), 'a salary was charged, so this test is stale')
      .toBe(companyCash(empty.universe));
  });
});
