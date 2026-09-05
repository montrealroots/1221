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
import { scoreCandidate } from '@/engine/systems/work';
import { rngFor } from '@/engine/core/rng';
import type { JobOpening, Person } from '@/engine/domain/model';

const TRIALS = 400;

/** Share of trials that came out true. */
function rate(trials: number, run: (i: number) => boolean): number {
  let hits = 0;
  for (let i = 0; i < trials; i++) if (run(i)) hits++;
  return hits / trials;
}

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

  it('produces a normal distribution centred where it says', () => {
    const rng = rngFor('calibration', 'normal');
    let sum = 0;
    const n = 50_000;
    for (let i = 0; i < n; i++) sum += rng.normal(10, 2);
    expect(sum / n).toBeGreaterThan(9.8);
    expect(sum / n).toBeLessThan(10.2);
  });
});

describe('hiring', () => {
  const sim = quickSave({}, 'calibration-hiring');

  /** A candidate with every relevant dial set to one level. */
  const candidate = (level: number): Person => {
    const base = sim.player;
    return {
      ...base,
      id: `cand-${level}`,
      skills: Object.fromEntries(Object.keys(base.skills).map((k) => [k, level])),
      attributes: Object.fromEntries(Object.keys(base.attributes).map((k) => [k, level])),
      personality: { ...base.personality, extraversion: level, agreeableness: level },
    } as Person;
  };

  const opening = (competition: number): JobOpening => ({
    ...(Object.values(sim.universe.jobOpenings)[0] as JobOpening),
    id: `open-${competition}`,
    competition,
    requirements: [{ skill: 'operations', min: 40 }],
  });

  it('rates a stronger candidate above a weaker one, every time', () => {
    let previous = -1;
    for (const level of [10, 30, 50, 70, 90]) {
      const { score } = scoreCandidate(sim, candidate(level), opening(50));
      expect(score, `a candidate at ${level} did not out-score the one below`).toBeGreaterThan(previous);
      previous = score;
    }
  });

  it('makes a contested listing harder than an uncontested one', () => {
    // One listing against another is mostly noise: who else applied is an
    // unknowable factor worth more than the competition gap. Averaging over
    // many listings is what shows whether competition is doing anything.
    const meanScore = (competition: number) => {
      let total = 0;
      for (let i = 0; i < 200; i++) {
        total += scoreCandidate(sim, candidate(60), { ...opening(competition), id: `o-${competition}-${i}` }).score;
      }
      return total / 200;
    };
    expect(meanScore(90)).toBeLessThan(meanScore(10));
  });

  it('never becomes a foregone conclusion in either direction', () => {
    // Across many openings, a mid-level candidate sometimes wins and
    // sometimes does not. A model that is always one or the other is broken.
    const passRate = rate(TRIALS, (i) => {
      const person = candidate(55);
      const listing = opening(40 + (i % 40));
      const { score } = scoreCandidate(sim, { ...person, id: `c${i}` } as Person, { ...listing, id: `o${i}` });
      const probability = Math.min(0.92, Math.max(0.03, score * 1.25 - 0.06));
      return rngFor('calibration', 'hire', String(i)).next() < probability;
    });
    expect(passRate, `a mid-level candidate passed ${(passRate * 100).toFixed(0)}% of screens`).toBeGreaterThan(0.1);
    expect(passRate, `a mid-level candidate passed ${(passRate * 100).toFixed(0)}% of screens`).toBeLessThan(0.9);
  });

  it('gives a beginner a real chance at work that asks for nothing', () => {
    const beginner = candidate(8);
    const entryLevel = { ...opening(45), requirements: [] };
    const { score } = scoreCandidate(sim, beginner, entryLevel);
    const probability = Math.min(0.92, Math.max(0.03, score * 1.25 - 0.06));
    // Not a certainty, but not the 3% floor either: an ordinary person has to
    // be able to get an ordinary job.
    expect(probability, `a beginner's chance at entry-level work was ${(probability * 100).toFixed(0)}%`).toBeGreaterThan(0.2);
  });
});

describe('reproducibility', () => {
  it('gives two identical seeds the same world, and different seeds different ones', () => {
    // The film industry is gone, so what a seed has to reproduce now is the
    // life around the player: who they meet, what is for sale, what it costs.
    const shape = (seed: string) => {
      const sim = quickSave({}, seed);
      sim.advanceTo(sim.now + 2 * 365 * 86_400_000);
      return [
        Object.values(sim.universe.people).map((p) => p.displayName).sort().join(','),
        Object.values(sim.universe.propertyListings).map((l) => `${l.propertyId}|${l.askingPrice}`).sort().join(','),
        Object.values(sim.universe.jobOpenings).map((o) => `${o.title}|${o.payRate}`).sort().join(','),
      ].join('\n');
    };
    expect(shape('twin')).toEqual(shape('twin'));
    expect(shape('twin')).not.toEqual(shape('other'));
  }, 600_000);
});
