/**
 * SLATE — jet lag (from 2026-09-29): the body's clock left behind by a
 * journey across time zones, and the nights it spoils until it catches up.
 * Researched and kept in `docs/research/world/research-openitems.json`.
 *
 * On arrival the body keeps the clock it left with: the hours between the
 * two zones' clocks at that moment. It catches up at the CDC Yellow Book's
 * 2026 rates, an hour a day after flying east and an hour and a half after
 * flying west. What it spoils is sleep: in 64,847 trips by Oura ring wearers
 * (Willoughby et al., Sleep, 2025) a night's length came back within about
 * twelve minutes after two days, while eastward trips left sleep broken for
 * five or six; flown seven zones east, volunteers were sleepier in the day for
 * six days with their total sleep the same (Beaumont et al., 2004). So a night
 * with the clock hours out restores less, not fewer hours.
 *
 * SLATE's estimate, as no study gives it: a night loses 0.015 of its quality
 * for each hour the body is still out after flying east, and half that after
 * flying west, never more than 0.12. Seven zones east costs a first night
 * what a bedtime past one costs, 0.105, and nothing by the seventh.
 */

import type { Person } from '../domain/model';
import { MS_DAY, zoneOffsetMs, type Instant } from '../core/time';

export const JET_LAG = {
  /** Hours a day the body catches up: east, west. */
  eastPerDay: 1,
  westPerDay: 1.5,
  /** A night's quality lost for each hour still out: east, and west. SLATE's estimates. */
  eastLossPerHour: 0.015,
  westLossPerHour: 0.0075,
  maxLoss: 0.12,
  source: 'CDC Yellow Book 2026, “Jet Lag”; Willoughby et al., Sleep 2025; Beaumont et al. 2004',
} as const;

export interface BodyClock {
  /** Hours the body is out, positive after flying east (it must advance), negative after flying west. */
  hours: number;
  since: Instant;
}

/** How many hours the body is still out at a moment, signed as it was left. */
export function hoursOut(clock: BodyClock | undefined, at: Instant): number {
  if (!clock || clock.hours === 0) return 0;
  const days = Math.max(0, (at - clock.since) / MS_DAY);
  const rate = clock.hours > 0 ? JET_LAG.eastPerDay : JET_LAG.westPerDay;
  const left = Math.max(0, Math.abs(clock.hours) - rate * days);
  return Math.sign(clock.hours) * left;
}

/**
 * The body's clock on arriving: what was still out, and the hours the clocks
 * moved on the way, folded into one, never more than twelve either way (a
 * body twelve hours out is out by twelve whichever way it went).
 */
export function arrive(person: Person, fromZone: string, toZone: string, at: Instant): void {
  const moved = (zoneOffsetMs(at, toZone) - zoneOffsetMs(at, fromZone)) / 3_600_000;
  if (moved === 0) return;
  let hours = hoursOut(person.bodyClock, at) + moved;
  if (hours > 12) hours -= 24;
  if (hours < -12) hours += 24;
  if (hours === 0) delete person.bodyClock;
  else person.bodyClock = { hours, since: at };
}

/** What a night loses to the body's clock being out. */
export function jetLagLoss(person: Person, at: Instant): number {
  const out = hoursOut(person.bodyClock, at);
  if (out === 0) return 0;
  return Math.min(JET_LAG.maxLoss, Math.abs(out) * (out > 0 ? JET_LAG.eastLossPerHour : JET_LAG.westLossPerHour));
}
