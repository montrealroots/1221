/**
 * SLATE — errands (Stage 7 of `docs/BACKLOG.md`, from 2026-10-01). A store
 * sells only while it's open, by its own hours where they're known
 * (`content/storehours.ts`), in the town's local time. A chain whose hours
 * weren't found is taken as open. A garage's hours (`content/carshops.ts`)
 * are read the same way, from later on 2026-10-01, with its days shut.
 */

import type { Instant } from '../core/time';
import { zonedParts } from '../core/time';
import { CITIES } from '../content/geography';
import { CHAIN_HOURS, hoursOn, type Week } from '../content/storehours';
import { easter, nth } from '../content/usholidays';

const clock = (h: number) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

/** Why a place with these hours in a town is shut at a moment, or nothing where it's open. */
export function shutAt(week: Week, name: string, cityId: string, at: Instant): string | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const p = zonedParts(at, city.timeZone);
  const today = hoursOn(week, p.weekday);
  if (today.open === today.close) return `${name} is closed today.`;
  const hour = p.hour + p.minute / 60;
  if (hour >= today.open && hour < today.close) return undefined;
  return hour < today.open ? `${name} opens at ${clock(today.open)}.` : `${name} has closed for the day; it closed at ${clock(today.close)}.`;
}

/**
 * The days a chain's store may not open by law (from 2026-10-02). In England a
 * shop over 280 square meters may not open on Christmas Day (the Christmas Day
 * (Trading) Act 2004) or on Easter Day (the Sunday Trading Act 1994, Schedule
 * 1), which every English store SLATE has is, Tesco's and Sainsbury's. In Ontario retail closes on New
 * Year's Day, Good Friday, Easter Sunday, Canada Day (the Monday when July 1 is
 * a Sunday), the first Monday of September, Thanksgiving and Christmas Day (ontario.ca's Retail
 * Business Holidays page); Toronto, exempt from the Act, closes on the same
 * seven by its own bylaw (toronto.ca's Holiday Shopping page), Family Day and
 * Victoria Day left to the store since April 2026. A grocery store is no small
 * shop the laws exempt.
 */
export function shutByLaw(cityId: string, at: Instant): string | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const p = zonedParts(at, city.timeZone);
  const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  const shift = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);
  const y = p.year;
  if (cityId.startsWith('uk-eng-')) {
    if (today === `${y}-12-25`) return 'A large shop in England may not open on Christmas Day.';
    if (today === easter(y)) return 'A large shop in England may not open on Easter Day.';
  }
  if (cityId.startsWith('ca-on-')) {
    const july1 = `${y}-07-01`;
    const canada = new Date(Date.parse(july1)).getUTCDay() === 0 ? shift(july1, 1) : july1;
    const days = [`${y}-01-01`, shift(easter(y), -2), easter(y), canada, nth(y, 9, 1, 1), nth(y, 10, 1, 2), `${y}-12-25`];
    if (days.includes(today)) return 'Stores in Ontario close today, a retail holiday.';
  }
  return undefined;
}

/** Why a chain's store in a town is shut at a moment, or nothing where it's open or its hours aren't known. */
export function closedNow(chainId: string, name: string, cityId: string, at: Instant): string | undefined {
  const law = shutByLaw(cityId, at);
  if (law) return `${name} is closed today. ${law}`;
  const week = CHAIN_HOURS[chainId];
  return week ? shutAt(week, name, cityId, at) : undefined;
}

/** Whether a chain's store is shut the whole of a day: by law, no chain's week in SLATE keeping a day shut. A free day's shopping waits for another. */
export const shutAllDay = (cityId: string, at: Instant): boolean => shutByLaw(cityId, at) !== undefined;
