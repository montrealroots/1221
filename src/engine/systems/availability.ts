/**
 * SLATE — the people you know have jobs of their own (the master plan's
 * §52.7, from 2026-10-02; `docs/research/world/research-access-availability.json`).
 *
 * Whether each person you know works is drawn once, at their country's employment rate
 * for their age (decider `social.availability`): for 25 to 54, America's
 * 80.7% (BLS, September 2026) and Canada's 83.8% (August 2026); otherwise
 * America's 59.2% of everyone over 16, Canada's 60.8% over 15 and Mexico's
 * 57.5% (INEGI, derived); Britain's 75.1% and Ireland's 74.3% are for 16 or
 * 15 to 64, so anyone older there is taken as not working, no rate past 64
 * having been read. Of those who work, BLS's 85% keep a daytime schedule;
 * on a given weekday 81% of the employed work, on a weekend day 30% (ATUS
 * 2025), each day drawn. A daytime worker working that day is at work from
 * nine to five, SLATE's reading of a day shift, and says no to anything then.
 */

import type { Simulation } from '../core/simulation';
import { MS_DAY, dateKey, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import type { Contact } from './people';

/** Employed, by country: the prime-age rate where published, and the rate for everyone of working age. */
export const EMPLOYED: Readonly<Record<string, { prime?: number; all: number; upTo?: number }>> = {
  us: { prime: 0.807, all: 0.592 },
  ca: { prime: 0.838, all: 0.608 },
  mx: { all: 0.575 },
  uk: { all: 0.751, upTo: 64 },
  ie: { all: 0.743, upTo: 64 },
};
export const DAYTIME = 0.85;
export const WORKS_ON = { weekday: 0.81, weekend: 0.3 } as const;
export const SHIFT = { from: 9, to: 17 } as const;

const YEAR_MS = 365.2425 * MS_DAY;

/** Whether they have a job, drawn once; and whether it's by day. */
export function works(sim: Simulation, c: Contact, at: Instant): { employed: boolean; daytime: boolean } {
  const rate = EMPLOYED[CITIES.get(c.cityId)?.countryId ?? ''];
  const age = (at - c.born) / YEAR_MS;
  if (!rate || (rate.upTo !== undefined && age > rate.upTo + 1)) return { employed: false, daytime: false };
  const share = age >= 25 && age < 55 && rate.prime !== undefined ? rate.prime : rate.all;
  const rng = sim.rng('social.availability', c.id);
  const employed = rng.next() < share;
  return { employed, daytime: employed && rng.next() < DAYTIME };
}

/** Whether they're at work during so many minutes from a moment: a day worker's shift, on a day they work. */
export function atWork(sim: Simulation, c: Contact, at: Instant, minutes: number): boolean {
  if (!works(sim, c, at).daytime) return false;
  const zone = CITIES.require(c.cityId).timeZone;
  const p = zonedParts(at, zone);
  const start = p.hour + p.minute / 60;
  const end = start + minutes / 60;
  if (end <= SHIFT.from || start >= SHIFT.to) return false;
  const weekend = p.weekday === 0 || p.weekday === 6;
  return sim.rng('social.availability', c.id, dateKey(at, zone)).next() < (weekend ? WORKS_ON.weekend : WORKS_ON.weekday);
}

/** Their reason, where they're at work then. */
export const atWorkReason = (c: Contact): string => `${c.name.split(' ')[0]} is at work then.`;
