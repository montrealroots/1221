/**
 * SLATE — a home project's bids, its overrun and its lateness (Stage 12 of
 * `docs/BACKLOG.md`, from 2026-10-02; the figures and their sources in
 * `content/worksrisk.ts`).
 *
 * The contract is the cheapest of three bids for the job, drawn where their
 * cheapest averages the guides' figure, so a job costs what the guides say on
 * average and a given one more or less. On its last day it may run late, by a
 * share of its days, once; and finished, it may come in over the bid, the
 * difference billed then. Until 2026-10-02 every job cost the guide's figure
 * to the cent and finished the day it was due.
 */

import type { Simulation } from '../core/simulation';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { BIDS, BID_HALF, LATE_SHARE, OVERRUN_BANDS, WORKS_ODDS, type WorksOdds } from '../content/worksrisk';

const oddsIn = (cityId: string): WorksOdds => WORKS_ODDS[CITIES.require(cityId).countryId] ?? WORKS_ODDS.us!;

/** The bids for a job this month, cheapest first; the same all month (decider `works.risk`). */
export function bidsFor(sim: Simulation, key: string, guide: Money, month: string): Money[] {
  const middle = guide / (1 - BID_HALF / 2);
  const r = sim.rng('works.risk', key, `bids-${month}`);
  return Array.from({ length: BIDS.count }, () => Math.round(middle * (1 - BID_HALF + 2 * BID_HALF * r.next()))).sort((a, b) => a - b);
}

/** The days a job runs late, or none (decider `works.risk`). */
export function lateDays(sim: Simulation, key: string, cityId: string, days: number): number {
  const r = sim.rng('works.risk', key, 'late');
  if (r.next() >= oddsIn(cityId).late) return 0;
  return Math.max(1, Math.round(-Math.log(1 - r.next()) * LATE_SHARE * days));
}

/** What a finished job comes in over its bid, or nothing (decider `works.risk`). */
export function overrunOf(sim: Simulation, key: string, cityId: string, bid: Money): Money {
  const odds = oddsIn(cityId);
  const r = sim.rng('works.risk', key, 'over');
  if (r.next() >= odds.over) return 0;
  const tail = r.next() < odds.tail;
  const share = tail ? OVERRUN_BANDS.under + (OVERRUN_BANDS.top - OVERRUN_BANDS.under) * r.next() : OVERRUN_BANDS.under * r.next();
  return Math.round(bid * share);
}
