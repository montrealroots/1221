/**
 * SLATE — the end of a life.
 *
 * A life used to go on for ever: nothing stopped the clock at any age, and
 * nothing marked one passing. Now each year of it has the chance of ending
 * that a real year at that age has, where they live, weighed by the shape
 * they are in, and a life that ends stops the clock for good
 * (`Simulation.advanceTo`) and shows what it came to (`ui/shell/LifeEnded`).
 *
 * The draw is made once a year, at the birthday, the way a life table counts
 * it: the chance of dying before the next one. When it says the year ends
 * the life, the day is drawn too and put on the calendar, where no screen
 * shows it, since the category is the system's. The first year is the part
 * from the first morning to the first birthday, at that share of the chance.
 *
 * What is published and what is SLATE's:
 *
 * - The chance by age is the United States' 2024 life table, both sexes
 *   (CDC NCHS, United States Life Tables, 2024), at every fifth birthday and
 *   log-linear between them. The table's 1.0 at a hundred is the open end of
 *   it, not a year; SLATE uses 0.36, the year before extended, and holds the
 *   rise at the same pace past it.
 * - Countries differ by life expectancy at birth (World Bank, 2024). A year of
 *   life expectancy is taken as a year of age, which multiplies the chance by
 *   e^0.085 per year: the Gompertz slope of the adult table. That conversion is
 *   SLATE's, and `tests/mortality.test.ts` measures what it gives back.
 * - The shape they are in is SLATE's estimate. Condition at the age's ceiling
 *   is a little better than the average of everybody that age, which
 *   includes the ill: 0.8 of the table. Worn to nothing, it is three times it,
 *   about what poor self-rated health carries in the survey studies.
 *
 * None of it is shown. Nothing on a screen says how likely the end is or when.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { ceilingAt } from '../content/lifespan';
import { clamp } from '../core/rng';

export const END_KIND = 'life.end';
const MS_YEAR = 365.2425 * 86_400_000;

/** The US 2024 life table's chance of dying within the year, at each fifth birthday. */
const US_2024: readonly (readonly [number, number])[] = [
  [5, 0.000148], [10, 0.000098], [15, 0.000359], [20, 0.000714], [25, 0.000942],
  [30, 0.001269], [35, 0.001664], [40, 0.002190], [45, 0.002786], [50, 0.003898],
  [55, 0.005652], [60, 0.008779], [65, 0.012723], [70, 0.018110], [75, 0.027586],
  [80, 0.046154], [85, 0.078467], [90, 0.138036], [95, 0.225491], [100, 0.36],
];

/** Life expectancy at birth, 2024, World Bank, by the gazetteer's country id. */
export const LIFE_EXPECTANCY: Readonly<Record<string, number>> = {
  jp: 84.04, it: 83.95, es: 83.89, kr: 83.63, au: 83.05, ie: 83.01, fr: 82.98,
  is: 82.81, ca: 82.11, nz: 82.01, uk: 81.39, de: 80.79, us: 78.89, mx: 75.26,
};
const US_EXPECTANCY = 78.89;
const GOMPERTZ = 0.085;

/** The table's chance of dying before the next birthday, at a whole age. */
export function tableChance(age: number): number {
  const a = Math.max(5, age);
  for (let i = 1; i < US_2024.length; i += 1) {
    const [x1, q1] = US_2024[i]!;
    if (a <= x1) {
      const [x0, q0] = US_2024[i - 1]!;
      return q0 * (q1 / q0) ** ((a - x0) / (x1 - x0));
    }
  }
  // Past a hundred, the rise from ninety-five to a hundred kept going.
  const pace = Math.log(0.36 / 0.225491) / 5;
  return Math.min(0.75, 0.36 * Math.exp(pace * (a - 100)));
}

/** How a country's life expectancy moves the table: one for the US, less where people live longer. */
export function countryFactor(countryId: string | undefined): number {
  const e0 = (countryId && LIFE_EXPECTANCY[countryId]) || US_EXPECTANCY;
  return Math.exp(-GOMPERTZ * (e0 - US_EXPECTANCY));
}

/**
 * How their condition, against what their age allows, moves the table: 0.8
 * at best, three at worst, and slow to leave the best: a body a tenth off it
 * is at 0.87, half worn at 1.58.
 */
export function frailty(condition: number, age: number): number {
  const allowed = ceilingAt(Math.floor(age)).condition;
  const short = 1 - clamp(condition / allowed, 0, 1);
  return 0.8 + 2.2 * short ** 1.5;
}

/** The chance a year from this age ends their life, all of it together. */
export function chanceOfEndingYear(person: Person, age: number, countryId: string | undefined): number {
  return Math.min(1, tableChance(Math.floor(age)) * countryFactor(countryId) * frailty(person.wellbeing.condition, age));
}

/**
 * Whether the stretch from one instant to the next ends their life, and
 * when: a share of the year's chance for a share of a year. The draw is keyed
 * on the person and the day it starts, so it is the same every time.
 */
export function endBetween(sim: Simulation, person: Person, from: Instant, to: Instant): Instant | undefined {
  if (to <= from) return undefined;
  const age = (from - person.birthInstant) / MS_YEAR;
  const country = CITIES.get(person.currentLocationId)?.countryId;
  const q = chanceOfEndingYear(person, age, country);
  const share = Math.min(1, (to - from) / MS_YEAR);
  const chance = 1 - (1 - q) ** share;
  const rng = sim.rng('life.end', person.id, String(from));
  if (rng.next() >= chance) return undefined;
  return from + Math.floor(rng.next() * (to - from));
}

/** Draws the stretch to the next birthday, and puts the end on the calendar if it comes in it. */
export function decideStretch(sim: Simulation, person: Person, from: Instant, to: Instant): void {
  const at = endBetween(sim, person, from, to);
  if (at === undefined) return;
  sim.schedule({
    at, kind: END_KIND, label: 'World Simulation', category: 'system', priority: 1,
    payload: { personId: person.id },
  });
}

/** Whole years between their birth and an instant, as a birthday counts them. */
export function ageOn(sim: Simulation, person: Person, at: Instant): number {
  const born = zonedParts(person.birthInstant, sim.homeZone);
  const then = zonedParts(at, sim.homeZone);
  const had = then.month > born.month || (then.month === born.month && then.day >= born.day);
  return then.year - born.year - (had ? 0 : 1);
}

export function registerMortality(sim: Simulation): void {
  sim.onSchedule(END_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    if (!person || person.id !== s.universe.playerId) return;
    s.universe.meta.endedAt = item.at;
    s.universe.meta.endedAge = ageOn(s, person, item.at);
    s.notify({
      category: 'personal',
      title: 'A Life, Ended',
      body: `${person.displayName} died at ${s.universe.meta.endedAge}.`,
      importance: 100,
    });
  });
}
