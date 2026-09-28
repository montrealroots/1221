/**
 * SLATE — a body's height and weight, and what a life does to the weight.
 *
 * Until 2026-09-28 SLATE kept no weight: a life ate, trained and aged with
 * nothing to show for it on the scale, and obesity and what it raises were
 * said to be unmodeled. Now every person has a height and a weight, drawn
 * from where they were born or set at creation, and the weight follows the
 * energy that goes in against the energy spent (`content/body.ts`).
 *
 * - **In:** a day's eating is their habit, what held the weight they began
 *   with at the age they began, leaned by an appetite; a meal ordered in or
 *   eaten out adds a restaurant's more; a day's work is eaten back through
 *   the hunger it made; a day they can't pay for eats less. A workout isn't
 *   eaten back: how much of exercise people eat back isn't a figure SLATE
 *   has, so it takes none, which is the most a workout can take off. Hunger in SLATE (`nourishment`) runs on the clock's own
 *   pace, so it isn't counted in calories: tried, a life stepped a day at a
 *   time lost 25 kg in two years that one stepped to each midnight didn't.
 * - **Out:** the resting rate for their weight, height and age (Mifflin–St
 *   Jeor), times a sedentary day's multiple, and on top what a workout, a
 *   swim, a performance or a day on set spends by its MET value.
 * - **Change:** as Hall's rule has it: a lasting gap moves the weight till a
 *   heavier body spends it, a kilogram for each 23.9 kcal a day, half of the
 *   way in about a year.
 *
 * The resting rate's own figure differs by sex; SLATE keeps no sex, so it
 * takes the middle of the two, its estimate.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { BMI_EDGES, BODY, BODY_BY_COUNTRY, BODY_DEFAULT, HEIGHT_SPREAD } from '../content/body';
import { personalityOf } from './personality';

const MS_YEAR = 365.2425 * MS_DAY;

export interface Body {
  heightCm: number;
  weightKg: number;
  /** The weight they began at, which Hall's extra cost of a heavier body is reckoned from. */
  startKg?: number;
  /** A day's eating by habit, kcal: what held the weight they started at, at the age they started. */
  habitKcal: number;
  /** The day so far: eaten beyond the habit, spent beyond the sedentary day, and whether it was a day they couldn't pay for. */
  intake: number;
  extra: number;
  short?: boolean;
}

const ageOf = (person: Person, at: Instant) => Math.max(18, (at - person.birthInstant) / MS_YEAR);

/** The resting energy a day, Mifflin–St Jeor, at the middle of its two sexes' constants. */
export function restingKcal(weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + BODY.sexMidpoint;
}

/** A body mass index: kilograms over meters squared. */
export const bmiOf = (body: Pick<Body, 'heightCm' | 'weightKg'>): number => body.weightKg / (body.heightCm / 100) ** 2;

/**
 * A person's body, drawn the first time it's asked for where creation set
 * none: from one side or the other of their birth country's adults, half and
 * half, a height about that side's mean and a body mass index from its bands
 * (`BODY_BY_COUNTRY`).
 */
export function bodyOf(sim: Simulation, person: Person, at = sim.now): Body {
  if (person.body) return person.body;
  const country = CITIES.get(person.homeRegionId)?.countryId ?? '';
  const norms = BODY_BY_COUNTRY[country] ?? BODY_DEFAULT;
  const rng = sim.rng('body.draw', person.id);
  const side = rng.next() < 0.5 ? 0 : 1;
  // A standard normal, near enough: six uniforms summed, centered and scaled.
  let sum = 0;
  for (let i = 0; i < 6; i += 1) sum += rng.next();
  const heightCm = Math.round((norms.height[side]! + HEIGHT_SPREAD[side]! * (sum - 3) / Math.SQRT1_2) * 10) / 10;
  const bands = norms.bands[side]!;
  let left = rng.next() * bands.reduce((a, b) => a + b, 0);
  let band = 0;
  while (band < bands.length - 1 && (left -= bands[band]!) > 0) band += 1;
  const bmi = BMI_EDGES[band]! + rng.next() * (BMI_EDGES[band + 1]! - BMI_EDGES[band]!);
  person.body = settle({ heightCm, weightKg: Math.round(bmi * (heightCm / 100) ** 2 * 10) / 10 }, person, at);
  return person.body;
}

/** What a day spends at a weight: the sedentary day's rest, Hall's added cost of a heavier body past what rest itself carries, and the day's exertion. */
function spentOn(body: Body, age: number): number {
  const beyondRest = BODY.kcalPerKgDay - 10 * BODY.sedentary;
  return restingKcal(body.weightKg, body.heightCm, age) * BODY.sedentary + beyondRest * (body.weightKg - (body.startKg ?? body.weightKg)) + body.extra;
}

/** A body from a height and a weight, its point of nourishment set so the life it starts with holds it. */
export function settle(size: { heightCm: number; weightKg: number }, person: Person, at: Instant): Body {
  const day = restingKcal(size.weightKg, size.heightCm, ageOf(person, at)) * BODY.sedentary;
  return { ...size, startKg: size.weightKg, habitKcal: day, intake: 0, extra: 0 };
}

/** A meal eaten out or ordered in: a restaurant's more than the same at home. */
export function eatsOut(person: Person): void {
  if (person.body) person.body.intake += BODY.eatenOut;
}

/** A day they couldn't pay for: it eats a broke day's share of the habit (`BODY.shortDay`). */
export function eatsShort(person: Person): void {
  if (person.body) person.body.short = true;
}

/** Hunger eaten back: what a workout's own hunger or a day's work asked for, in kcal. */
export function eatsBack(person: Person, kcal: number): void {
  if (person.body && kcal > 0) person.body.intake += kcal;
}

/**
 * What some hours of a thing spend beyond the sedentary day's own hour: its
 * MET value past it, by the weight. A day's work makes them as much hungrier,
 * so the meals that follow put it back, as people's eating follows their
 * working days; a workout's own hunger is its own (`applyLookingAfter`).
 */
export function exerts(person: Person, met: number, hours: number, hungry = false): void {
  const body = person.body;
  if (!body || hours <= 0) return;
  const kcal = Math.max(0, met - BODY.sedentary) * body.weightKg * hours;
  body.extra += kcal;
  if (hungry) eatsBack(person, kcal);
}

/** The day's weight: the gap between what went in and what was spent, into the weight at Hall's pace. */
export function bodyDay(person: Person, at: Instant): void {
  const body = person.body;
  if (!body) return;
  const eaten = body.habitKcal * personalityOf(person, 'appetite') * (body.short ? BODY.shortDay : 1) + body.intake;
  const gap = eaten - spentOn(body, ageOf(person, at));
  const perKg = BODY.kcalPerKgDay * (BODY.halfLifeDays / Math.LN2);
  body.weightKg = clamp(Math.round((body.weightKg + gap / perKg) * 1000) / 1000, 30, 250);
  body.intake = 0;
  body.extra = 0;
  delete body.short;
}

/** The body mass index's category, as the WHO names them. */
export function bmiWord(bmi: number): string {
  return bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy Weight' : bmi < 30 ? 'Overweight' : 'Obese';
}
