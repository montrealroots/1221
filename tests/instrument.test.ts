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

describe('the career instrument plays a career', () => {
  it('gets asked for, reads, and wins parts', () => {
    const sim = quickSave({}, 'instrument-career');
    const out = playACareer(sim, 5);
    expect(out.asked, 'nobody asked, so this measured an empty room').toBeGreaterThan(0);
    expect(out.read, 'nothing was read for, so the player never went up').toBeGreaterThan(0);
    expect(out.cast, 'no part was ever won in five years').toBeGreaterThan(0);
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
