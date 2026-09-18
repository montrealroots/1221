/**
 * SLATE — holding the instruments to what they claim to measure.
 *
 * `tests/played.ts` is the only thing in this repo that answers "what actually
 * happens over a career", and every number quoted in a commit message or on
 * `docs/UNBITTEN.md` comes out of it. An instrument that quietly stops playing
 * the game is therefore worse than no instrument: it does not fail, it reports.
 *
 * Both of these tests exist because the failure they describe already happened.
 * `playABusiness` in its first run bound errors and omissions cover before
 * optioning any material, which the engine correctly refuses — an underwriter
 * reads the chain of title first — so it made nought pictures for twenty-five
 * years while returning a clean-looking row of zeroes, on every seed. Nothing
 * was red. The numbers were simply about a company that never traded.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { playABusiness, playACareer } from './played';
import { TOO_SPENT_TO_TRAIN, readiness } from '@/engine/systems/life';

describe('the career instrument plays a career', () => {
  it('gets asked for, reads, and wins parts', () => {
    const sim = quickSave({}, 'instrument-career');
    const out = playACareer(sim, 5);
    expect(out.asked, 'nobody asked, so this measured an empty room').toBeGreaterThan(0);
    expect(out.read, 'nothing was read for, so the player never went up').toBeGreaterThan(0);
    expect(out.cast, 'no part was ever won in five years').toBeGreaterThan(0);
  });

  it('keeps the player in a state a player would be in, and not in a ruin', () => {
    // THE THIRD TIME THIS INSTRUMENT MEASURED A WORLD NOBODY PLAYS, and the worst
    // of the three, because nothing about the numbers looked wrong.
    //
    // The loop never had the work done on the house. Over twenty-five years the
    // roof went 100 to 34 by year fifteen and 0 by year twenty-four, and
    // everything a night's sleep feeds went with it: body condition to 0, energy
    // pinned at 0 for the last seven years, stress at 90, sleep debt at 60,
    // morale at 0, readiness at 11. Energy under `TOO_SPENT_TO_TRAIN` then stops
    // the training this same loop does, so fitness ratcheted 98 at year fifteen
    // to 0 at year twenty-five — which would have read as `w.fitness` still being
    // a one-way ratchet, a claim `docs/ARREARS.md` records as built and which the
    // dial passes when the character can train. Every late-career figure this
    // file has ever produced was measured on somebody in a derelict house with
    // EUR 1.2m in the bank.
    //
    // So: fifteen years, and the end state has to be a person rather than a
    // wreck. The thresholds are deliberately loose — this is not pinning a
    // balance, it is refusing to report from a ruin.
    const sim = quickSave({}, 'instrument-upkeep');
    playACareer(sim, 15);
    const me = sim.universe.people[sim.universe.playerId]!;
    const house = Object.values(sim.universe.properties).find((one) => one.kind === 'house')!;

    expect(house.condition, 'the instrument let the roof fall in').toBeGreaterThan(50);
    expect(me.wellbeing.energy, 'nothing left in the tank, so nothing can be trained')
      .toBeGreaterThanOrEqual(TOO_SPENT_TO_TRAIN);
    expect(me.wellbeing.condition, 'a body at nought after fifteen years').toBeGreaterThan(50);
    expect(me.wellbeing.fitness, 'fitness ratcheted to the floor with nothing putting it back')
      .toBeGreaterThan(50);
    expect(readiness(me), 'readiness this low is a ruin rather than a hard career')
      .toBeGreaterThan(25);
  });

  it('can still be told to let the house go, because that is a real way to play', () => {
    // And when it is told to, the spiral is the whole of what it finds — which is
    // what makes the default worth having rather than a thumb on the scale.
    const kept = quickSave({}, 'instrument-paired');
    playACareer(kept, 15);
    const gone = quickSave({}, 'instrument-paired');
    playACareer(gone, 15, { letTheHouseGo: true });

    const readyIn = (sim: typeof kept): number => readiness(sim.universe.people[sim.universe.playerId]!);
    expect(readyIn(gone), 'letting the house go cost nothing').toBeLessThan(readyIn(kept));
  });
});

describe('the business instrument runs a business', () => {
  it('greenlights, delivers and sells rather than reporting a company that never traded', () => {
    const sim = quickSave({}, 'instrument-business');
    const out = playABusiness(sim, 10);

    expect(out.greenlit, 'nothing was greenlit, so the pipeline never opened').toBeGreaterThan(0);
    expect(out.delivered, 'nothing reached delivered, so the delivery list is unsatisfiable')
      .toBeGreaterThan(0);

    // The money has to move, in both directions. A company that only ever holds
    // what it started with is a company the loop forgot to trade.
    expect(out.endedCents, 'the company ended on exactly what it started with')
      .not.toBe(180_000_00);
  });

  it('refuses to report numbers from a world where a scheduled system stopped', () => {
    // The same guard `playACareer` carries, for the same reason: a handler that
    // throws is caught and notified, and every total still looks reasonable.
    const sim = quickSave({}, 'instrument-guard');
    expect(() => playABusiness(sim, 1)).not.toThrow();
  });
});
