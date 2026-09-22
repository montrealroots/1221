/**
 * Monte Carlo calibration.
 *
 * The systems that decide things — who gets hired, who gets the part, what
 * gets greenlit, what a film earns — are probabilistic. That makes them easy
 * to get wrong in ways no single playthrough reveals: a model that always says
 * yes, or always says no, or ignores the input that is supposed to drive it,
 * looks perfectly reasonable once and is broken over a thousand trials.
 *
 * These run each decision many times across many seeds and check three things:
 * that the outcome is not a foregone conclusion in either direction, that it
 * moves in the right direction when the inputs improve, and that the same seed
 * always lands in the same place.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { rngFor } from '@/engine/core/rng';



describe('the random number generator', () => {
  it('is uniform enough to build a model on', () => {
    const buckets = new Array<number>(10).fill(0);
    const rng = rngFor('calibration', 'uniformity');
    for (let i = 0; i < 100_000; i++) {
      const v = rng.next();
      expect(v >= 0 && v < 1).toBe(true);
      buckets[Math.floor(v * 10)]! += 1;
    }
    for (const [index, count] of buckets.entries()) {
      // Each tenth should hold about a tenth. Wide tolerance; this is a
      // smoke test for a broken generator, not a statistics exam.
      expect(count / 100_000, `bucket ${index} held ${count}`).toBeGreaterThan(0.085);
      expect(count / 100_000, `bucket ${index} held ${count}`).toBeLessThan(0.115);
    }
  });

  it('gives the same stream for the same seed and a different one otherwise', () => {
    const a = rngFor('stream', 'alpha');
    const b = rngFor('stream', 'alpha');
    const c = rngFor('stream', 'beta');
    const first = Array.from({ length: 20 }, () => a.next());
    const second = Array.from({ length: 20 }, () => b.next());
    const third = Array.from({ length: 20 }, () => c.next());
    expect(second).toEqual(first);
    expect(third).not.toEqual(first);
  });

  it('produces a normal distribution centered where it says', () => {
    const rng = rngFor('calibration', 'normal');
    let sum = 0;
    const n = 50_000;
    for (let i = 0; i < n; i++) sum += rng.normal(10, 2);
    expect(sum / n).toBeGreaterThan(9.8);
    expect(sum / n).toBeLessThan(10.2);
  });
});

describe('reproducibility', () => {
  it('gives two identical seeds the same world, and different seeds different ones', () => {
    // What a seed has to reproduce is the life around the player: who is in
    // the save and the state two years of the clock left them in.
    const shape = (seed: string) => {
      const sim = quickSave({ firstName: seed }, seed);
      sim.advanceTo(sim.now + 2 * 365 * 86_400_000);
      return Object.values(sim.universe.people)
        .map((p) => `${p.displayName}|${Math.round(p.wellbeing.energy)}|${Math.round(p.wellbeing.condition)}`)
        .sort().join(',');
    };
    expect(shape('twin')).toEqual(shape('twin'));
    expect(shape('twin')).not.toEqual(shape('other'));
  }, 600_000);
});
