/**
 * SLATE — what a birthday takes.
 *
 * Age is what your best day looks like, not how you happen to feel this
 * morning. Every year off a ceiling rather than off the current value, and a
 * share of each night's rest that a body of that age no longer banks. Two
 * functions leave this file, `ceilingAt` and `recoveryFactorAt`, and
 * `src/engine/systems/life.ts` is the only thing that reads either.
 *
 * All of it is SLATE's own calibration. No published table says what a year
 * costs a particular person, and nothing here tells the player when they are
 * going to die.
 *
 * This file used to carry an almanac as well — life expectancy and the state
 * pension age by country, the seven named parts of a life, the family
 * somebody is born into, the ages a country sets for driving and drinking and
 * marrying, and a maturation curve. None of it was read by anything. The
 * authored bands, tables and prose are kept whole in
 * `docs/research/LIFESPAN.md`, which is where to look before writing any of
 * it again.
 */

/**
 * What a birthday takes, by decade.
 *
 * No band here is a cliff. A year in your twenties costs almost nothing and a
 * year in your eighties costs a great deal, and in between it is a curve. The
 * numbers are per birthday, applied once, and they move the ceiling rather
 * than the current value.
 */
interface AgingBand {
  /** The decade this band starts at. */
  from: number;
  /** Points off the fitness ceiling per year. */
  fitness: number;
  /** Points off the condition ceiling per year. */
  condition: number;
  /** Share of a night's recovery lost per year, as a fraction. */
  recovery: number;
  /** What a year in the band is like, said on the fitness dial's look beside the ceiling (`ageWords`). */
  about: string;
}

/**
 * Each band's `about` says what its figures do (from 2026-10-17, brief 14). Until then some said what no figure here
 * does: "Recovery takes a day longer than it used to", "A week off costs a month back", and "What you don't use, you
 * lose faster than you gain it", where fitness is lost at the same rate at every age (`FITNESS.perDay`, `systems/life.ts`).
 */
const AGING: readonly AgingBand[] = [
  { from: 0, fitness: 0, condition: 0, recovery: 0, about: 'Still growing. Age takes nothing yet.' },
  { from: 20, fitness: 0.12, condition: 0.05, recovery: 0.001, about: 'The body is near its best, and age takes very little from it.' },
  { from: 30, fitness: 0.35, condition: 0.18, recovery: 0.003, about: 'Age starts to lower what training can reach, a little each year, and a night puts back slightly less.' },
  { from: 40, fitness: 0.62, condition: 0.34, recovery: 0.005, about: 'What training can reach falls faster than in the thirties, and nights mend less than they did.' },
  { from: 50, fitness: 0.95, condition: 0.55, recovery: 0.008, about: 'Staying fit takes steady work now, as each year lowers what training can reach a little more.' },
  { from: 60, fitness: 1.35, condition: 0.85, recovery: 0.012, about: 'A night’s rest puts back noticeably less, and what training can reach falls faster than in the fifties.' },
  { from: 70, fitness: 1.80, condition: 1.25, recovery: 0.016, about: 'A year now takes more from the body than a whole decade did in the twenties.' },
  { from: 80, fitness: 2.30, condition: 1.75, recovery: 0.021, about: 'Each year takes the most it ever has, from fitness, condition and rest alike.' },
];

/** The band a given age falls in. */
function agingAt(age: number): AgingBand {
  let found = AGING[0]!;
  for (const band of AGING) if (age >= band.from) found = band;
  return found;
}

/**
 * How much of a night's rest a body of this age actually banks.
 *
 * One at twenty, and falling from there. This is the part of aging anybody
 * would recognize before they recognized anything else: the night that used
 * to fix everything stops fixing everything.
 */
export function recoveryFactorAt(age: number): number {
  let lost = 0;
  for (let year = 1; year <= age; year++) lost += agingAt(year).recovery;
  return Math.max(0.55, Math.round((1 - lost) * 1000) / 1000);
}

/** What a year at this age is like, in the band's words. Until 2026-09-27 nothing read them. */
export function ageWords(age: number): string {
  return agingAt(Math.max(0, Math.floor(age))).about;
}

/** The most a body of this age can be brought to, out of a hundred. */
export function ceilingAt(age: number): { fitness: number; condition: number } {
  let fitness = 100;
  let condition = 100;
  for (let year = 1; year <= age; year++) {
    const band = agingAt(year);
    fitness -= band.fitness;
    condition -= band.condition;
  }
  return {
    fitness: Math.max(18, Math.round(fitness * 10) / 10),
    condition: Math.max(30, Math.round(condition * 10) / 10),
  };
}
