/**
 * SLATE — a person's age, as a birthday counts it.
 *
 * Taken out of `systems/mortality.ts` in the scope reset of 2026-10-09, when the end of a life went and the banks'
 * age limits (a card free under 25, an account for the young) still needed the count.
 */
import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';

/**
 * The day in a year the law counts as a birthday (from 2026-10-06, `docs/research/world/research-leap-day-birthday.json`):
 * the day born, and for the 29th of February in a year without one, the 1st of March in the United Kingdom (Scotland's
 * Age of Legal Capacity Act 1991 s.6(2) says so; England's practice, as the Electoral Commission applies it, is the
 * same) and the 28th elsewhere: British Columbia's Interpretation Act s.25(3) says so, New York's and California's laws
 * on counting a year point to it, and Ireland, Canada, Mexico and Connecticut leave it unsettled, where it's SLATE's reading.
 */
export function birthdayIn(year: number, born: { month: number; day: number }, countryId: string | undefined): { month: number; day: number } {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (born.month !== 2 || born.day !== 29 || leap) return born;
  return countryId === 'uk' ? { month: 3, day: 1 } : { month: 2, day: 28 };
}

/**
 * Their age at an instant: the years since they were born, the year's birthday counted on the day the law counts it
 * where they are (`birthdayIn`). Until 2026-10-06 a 29th-of-February birthday was counted on the 1st of March
 * everywhere, while the birthday on the calendar said it was the 28th, and for that day the two disagreed.
 */
export function ageOn(sim: Simulation, person: Person, at: Instant): number {
  const born = zonedParts(person.birthInstant, sim.homeZone);
  const then = zonedParts(at, sim.homeZone);
  const day = birthdayIn(then.year, born, CITIES.get(person.currentLocationId)?.countryId);
  const had = then.month > day.month || (then.month === day.month && then.day >= day.day);
  return then.year - born.year - (had ? 0 : 1);
}
