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
  about: string;
}

const AGING: readonly AgingBand[] = [
  { from: 0, fitness: 0, condition: 0, recovery: 0, about: 'Growing, and none of it costs anything yet.' },
  { from: 20, fitness: 0.12, condition: 0.05, recovery: 0.001, about: 'The body is at its best and stays there.' },
  { from: 30, fitness: 0.35, condition: 0.18, recovery: 0.003, about: 'Recovery takes a day longer than it used to.' },
  { from: 40, fitness: 0.62, condition: 0.34, recovery: 0.005, about: 'You feel a bad night the next morning now.' },
  { from: 50, fitness: 0.95, condition: 0.55, recovery: 0.008, about: 'Keeping the ceiling up is work now, and the work doesn’t stop.' },
  { from: 60, fitness: 1.35, condition: 0.85, recovery: 0.012, about: 'What you don’t use, you lose faster than you gain it.' },
  { from: 70, fitness: 1.80, condition: 1.25, recovery: 0.016, about: 'A week off costs a month back.' },
  { from: 80, fitness: 2.30, condition: 1.75, recovery: 0.021, about: 'Every year is a year now, and it shows.' },
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
