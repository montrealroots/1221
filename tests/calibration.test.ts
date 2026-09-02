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

describe('the industry over many years', () => {
  it('spreads results rather than giving every film the same outcome', () => {
    const sim = quickSave({}, 'calibration-industry');
    sim.advanceTo(sim.now + 12 * 365 * 86_400_000);

    const released = Object.values(sim.universe.projects).filter((p) => (p.finalQuality ?? 0) > 0 && p.totalRevenue > 0);
    expect(released.length, 'twelve years produced no finished films').toBeGreaterThan(40);

    const multiples = released.map((p) => p.totalRevenue / Math.max(1, p.budget)).sort((a, b) => a - b);
    const at = (q: number) => multiples[Math.floor(multiples.length * q)] ?? 0;

    // Some films lose money and some make a lot. A distribution that is flat,
    // or that never loses, means the model is not doing anything.
    expect(at(0.1), 'the worst tenth of films still did not lose money').toBeLessThan(1);
    expect(at(0.9), 'the best tenth of films were not hits').toBeGreaterThan(1.2);
    expect(at(0.9) / Math.max(0.01, at(0.1)), 'results are too tightly bunched to be a distribution').toBeGreaterThan(2);

    // Quality has to matter. Better films should do better on average.
    const quality = released.map((p) => p.finalQuality ?? 0).sort((a, b) => a - b);
    const median = quality[Math.floor(quality.length / 2)] ?? 50;
    const good = released.filter((p) => (p.finalQuality ?? 0) > median);
    const poor = released.filter((p) => (p.finalQuality ?? 0) <= median);
    const mean = (xs: typeof released) => xs.reduce((s, p) => s + p.totalRevenue / Math.max(1, p.budget), 0) / Math.max(1, xs.length);
    expect(mean(good), 'better films did not earn more than worse ones').toBeGreaterThan(mean(poor));
  }, 600_000);

  it('does not let critics and audiences agree perfectly', () => {
    const sim = quickSave({}, 'calibration-reception');
    sim.advanceTo(sim.now + 8 * 365 * 86_400_000);
    const scored = Object.values(sim.universe.projects).filter((p) => p.criticScore && p.audienceScore);
    expect(scored.length).toBeGreaterThan(20);
    const disagreements = scored.filter((p) => Math.abs((p.criticScore ?? 0) - (p.audienceScore ?? 0)) > 8);
    expect(
      disagreements.length / scored.length,
      'critics and audiences agreed on almost everything, which is not how reception works',
    ).toBeGreaterThan(0.2);
  }, 600_000);
});

describe('reproducibility', () => {
  it('gives two identical seeds the same industry, and different seeds different ones', () => {
    const shape = (seed: string) => {
      const sim = quickSave({}, seed);
      sim.advanceTo(sim.now + 4 * 365 * 86_400_000);
      return Object.values(sim.universe.projects)
        .map((p) => `${p.title}|${p.phase}|${p.totalRevenue}`)
        .sort()
        .join('\n');
    };
    expect(shape('twin')).toEqual(shape('twin'));
    expect(shape('twin')).not.toEqual(shape('other'));
  }, 600_000);
});
