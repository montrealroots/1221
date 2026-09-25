/**
 * Calibration of the one random source.
 *
 * Every draw in the game comes from a seeded generator, owned by a decider;
 * the weather is the one left. These hold the generator itself: that it
 * spreads evenly, that its normal distribution centers where it says, that a
 * seed always gives the same stream, and that two identical seeds give the
 * same world two years on.
 *
 * It was written for the systems that decided things, who got hired, who got
 * the part, what got greenlit and what a film earned, and said it checked
 * that each moved the right way when its inputs improved. Those systems went
 * with the gut. `tests/deciders.test.ts` is where a decider is held to its
 * inputs now.
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
