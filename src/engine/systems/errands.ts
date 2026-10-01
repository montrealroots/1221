/**
 * SLATE — errands (Stage 7 of `docs/BACKLOG.md`, from 2026-10-01). A store
 * sells only while it's open, by its own hours where they're known
 * (`content/storehours.ts`), in the town's local time. A chain whose hours
 * weren't found is taken as open.
 */

import type { Instant } from '../core/time';
import { zonedParts } from '../core/time';
import { CITIES } from '../content/geography';
import { CHAIN_HOURS, hoursOn } from '../content/storehours';

const clock = (h: number) => `${String(Math.floor(h) % 24).padStart(2, '0')}:00`;

/** Why a chain's store in a town is shut at a moment, or nothing where it's open or its hours aren't known. */
export function closedNow(chainId: string, name: string, cityId: string, at: Instant): string | undefined {
  const week = CHAIN_HOURS[chainId];
  const city = CITIES.get(cityId);
  if (!week || !city) return undefined;
  const p = zonedParts(at, city.timeZone);
  const today = hoursOn(week, p.weekday);
  const hour = p.hour + p.minute / 60;
  if (hour >= today.open && hour < today.close) return undefined;
  return hour < today.open ? `${name} opens at ${clock(today.open)}.` : `${name} has closed for the day; it closed at ${clock(today.close)}.`;
}
