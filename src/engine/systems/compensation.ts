/**
 * SLATE — what an airline owes for a flight three hours or more late
 * (docs/WORLD.md, stage 2e), from 2026-09-30, researched in
 * `docs/research/world/research-travel-2.json` and `research-travel-3.json`.
 *
 * The law is the flight's, by where it leaves from, and Canada's for a
 * flight to or from Canada:
 * - EU261 from Ireland (Your Europe, checked 2026-09-21): €250 to 1,500 km,
 *   €400 to 3,500 km, €600 past it, half of that past 3,500 km when it's
 *   three to four hours late.
 * - UK261 from Britain (the CAA): £220, £350 and £520, and £260 past 3,500 km
 *   three to four hours late.
 * - Canada's APPR, a large carrier (the CTA, 2026-02-26): C$400 three to six
 *   hours late, C$700 to nine, C$1,000 past it.
 * - Mexico's Ley de Aviación Civil art. 47 Bis (Profeco): past four hours, at
 *   least 25% of the fare.
 * - America: none for a delay. The DOT's refund is for a flight declined,
 *   and SLATE's traveler takes the rebooking.
 * Each is owed only for what's within the airline's control, which SLATE
 * draws at the published share: in Europe EUROCONTROL's airline causes, 41%
 * of the delay that isn't carried from an earlier flight (August 2026); in
 * North America BTS's air carrier delay, 31.1% of delays, over the 62.5% that
 * isn't a late-arriving aircraft, 49.8% (August 2025 to July 2026), which
 * SLATE takes for Canada and Mexico too, the CTA publishing no share. A
 * claim is answered in the thirty days the APPR gives an airline, taken for
 * every law.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { isoOfCity } from './documents';

export const COMPENSATION_KIND = 'travel.compensation';

export type Regime = 'eu261' | 'uk261' | 'appr' | 'profeco';

export const COMPENSATION = {
  eu261: { bands: [[1_500, 250], [3_500, 400], [Infinity, 600]] as readonly (readonly [number, number])[], currency: 'EUR', halfPastKm: 3_500, halfUnderHours: 4 },
  uk261: { bands: [[1_500, 220], [3_500, 350], [Infinity, 520]] as readonly (readonly [number, number])[], currency: 'GBP', halfPastKm: 3_500, halfUnderHours: 4 },
  appr: { byHours: [[6, 400], [9, 700], [Infinity, 1_000]] as readonly (readonly [number, number])[], currency: 'CAD' },
  profeco: { pastHours: 4, share: 0.25 },
  /** The share of a long delay within the airline's control. */
  airlineShare: { europe: 0.41, northAmerica: 31.1 / (100 - 37.5) },
  answerDays: 30,
} as const;

/** The law a journey's flight falls under, or none. */
export function regimeOf(fromCity: string, toCity: string): Regime | undefined {
  const from = isoOfCity(fromCity);
  const to = isoOfCity(toCity);
  if (from === 'CA' || to === 'CA') return 'appr';
  if (from === 'IE') return 'eu261';
  if (from === 'GB') return 'uk261';
  if (from === 'MX') return 'profeco';
  return undefined;
}

/** What the law owes for a flight so late, in its money's cents, before the airline's fault is weighed; or nothing. */
export function owedFor(regime: Regime, km: number, lateMinutes: number, fareCents: Money): { amount: Money; currency?: string } | undefined {
  const hours = lateMinutes / 60;
  if (regime === 'profeco') return hours > COMPENSATION.profeco.pastHours ? { amount: Math.round(fareCents * COMPENSATION.profeco.share) } : undefined;
  if (hours < 3) return undefined;
  if (regime === 'appr') return { amount: COMPENSATION.appr.byHours.find(([upTo]) => hours < upTo)![1] * 100, currency: COMPENSATION.appr.currency };
  const law = COMPENSATION[regime];
  const full = law.bands.find(([upTo]) => km <= upTo)![1];
  const half = km > law.halfPastKm && hours < law.halfUnderHours;
  return { amount: (half ? full / 2 : full) * 100, currency: law.currency };
}

/** Whether a long delay was the airline's to answer for, at the published share (decider `travel.compensation`). */
export function airlineAtFault(sim: Simulation, person: Person, regime: Regime, key: string): boolean {
  const share = regime === 'eu261' || regime === 'uk261' ? COMPENSATION.airlineShare.europe : COMPENSATION.airlineShare.northAmerica;
  return sim.rng('travel.compensation', person.id, key).next() < share;
}

/**
 * A flight's arrival so late the law owes for it: the claim, answered a month
 * on, where the airline was at fault. Returns what's owed in the save's money.
 */
export function claimDelay(sim: Simulation, person: Person, j: { id: string; fromCity: string; toCity: string; arriveAt: Instant }, lateMinutes: number, fareCents: Money): Money | undefined {
  const regime = regimeOf(j.fromCity, j.toCity);
  if (!regime) return undefined;
  const km = distanceKm(CITIES.require(j.fromCity), CITIES.require(j.toCity));
  const owed = owedFor(regime, km, lateMinutes, fareCents);
  if (!owed || !airlineAtFault(sim, person, regime, j.id)) return undefined;
  const cur = saveCurrency(sim.universe);
  const amount = owed.currency && owed.currency !== cur ? exchange(owed.amount, owed.currency, cur) ?? owed.amount : owed.amount;
  sim.schedule({ at: j.arriveAt + lateMinutes * 60_000 + COMPENSATION.answerDays * MS_DAY, kind: COMPENSATION_KIND, label: 'Compensation For A Late Flight', category: 'personal', priority: 30, payload: { personId: person.id, amount, regime } });
  return amount;
}

export function registerCompensation(sim: Simulation): void {
  sim.onSchedule(COMPENSATION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person?.primaryAccountId) return;
    const amount = Number(item.payload.amount);
    const law = ({ eu261: 'EU261', uk261: 'UK261', appr: 'the APPR', profeco: 'Mexico’s aviation law' } as const)[item.payload.regime as Regime];
    s.post({ memo: `Compensation for a late flight, under ${law}`, category: 'travel', postings: [{ accountId: person.primaryAccountId, amount }, { accountId: s.nominalAccount('income', 'Airline Compensation').id, amount: -amount }] });
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Compensation Paid', body: `The airline paid ${formatMoney(amount, saveCurrency(s.universe))} for your late flight, under ${law}.`, importance: 45 });
  });
}
