/**
 * SLATE — travel insurance bought with a trip, and what it pays (Stage 9 of
 * `docs/BACKLOG.md`, from 2026-10-01; the terms in
 * `content/travelinsurance.ts`).
 *
 * **Bought** with a booked trip before it leaves, at the traveler's home
 * market's price, a round trip insured whole. It covers from leaving to
 * coming home, or a one-way trip's nights there.
 *
 * **Cancellation**: a trip missed or called off because the traveler is in
 * hospital or laid up hurt is paid back, what the airline and the hotel
 * didn't return, to the policy's limit, less its excess. A trip the
 * production paid for isn't the traveler's loss and isn't claimed.
 *
 * **Care away**: care had in another country is the insurer's, to its
 * medical limit, the traveler paying its excess. Without it, a visitor in
 * America pays America's own uninsured price, and from 2026-10-02 one in
 * England nothing for A&E or a GP and 150% of the tariff for a stay, less
 * what OHIP pays an Ontarian out of the country; elsewhere SLATE keeps no
 * visitor's price (from later on 2026-10-02, a hospital's own charges in
 * Ontario, British Columbia and Ireland and the IMSS's in Mexico, `VISITOR_CARE`;
 * Scotland and an Ontario doctor's visit still without one) and
 * the traveler's own cover's share holds (`careAway`, read by
 * `careFor` in `systems/health.ts`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, COUNTRIES } from '../content/geography';
import { CA_PREMIUM_WEEK, ENGLAND_VISITOR, IE_PREMIUM, MX_PREMIUM, OHIP_ABROAD, TRAVEL_POLICY, UK_PREMIUM, US_PREMIUM_SHARE, type TravelMarket, type TravelPolicyTerms } from '../content/travelinsurance';
import { homeOf } from './earnings';
import { payFromBank } from './household';
import { inHospital } from './health';
import { laidUp } from './injury';
import { IRELAND_CTA, VISITOR_CARE } from '../content/visitorcare';
import { journeysOf, partnerOf, type Journey } from './journey';

export interface TripPolicy { market: TravelMarket; premium: Money; from: Instant; to: Instant }

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

export function marketOf(person: Person): TravelMarket | undefined {
  const country = CITIES.get(homeOf(person))?.countryId;
  return country === 'us' || country === 'uk' || country === 'ie' || country === 'ca' || country === 'mx' ? country : undefined;
}

const halvesOf = (person: Person, j: Journey): Journey[] => [j, ...[partnerOf(person, j)].filter((x): x is Journey => x !== undefined && x.status === 'booked')];

/** The premium for a trip in the save's money, and its cover's span, or why it can't be had. */
export function insuranceQuote(sim: Simulation, person: Person, j: Journey, at: Instant): { premium: Money; from: Instant; to: Instant; terms: TravelPolicyTerms; market: TravelMarket } | string {
  if (j.status !== 'booked') return 'That isn’t a journey you have booked.';
  if (j.insured) return 'It’s insured already.';
  const market = marketOf(person);
  if (!market) return 'SLATE keeps no travel insurance where you live.';
  const halves = halvesOf(person, j);
  const out = halves.reduce((a, b) => (a.leaveAt <= b.leaveAt ? a : b));
  const back = halves.length > 1 ? halves.reduce((a, b) => (a.leaveAt >= b.leaveAt ? a : b)) : undefined;
  const from = out.leaveAt;
  const to = back ? back.arriveAt : out.arriveAt + Math.max(1, out.hotel?.nights ?? 1) * MS_DAY;
  const days = Math.max(1, Math.ceil((to - from) / MS_DAY));
  const terms = TRAVEL_POLICY[market];
  if (terms.maxDays && days > terms.maxDays) return `${terms.insurer} covers ${terms.maxDays} days a trip at most.`;
  const age = (at - person.birthInstant) / (365.2425 * MS_DAY);
  let premium: Money;
  if (market === 'us') {
    const cost = halves.reduce((a, h) => a + (h.paidBy === 'production' ? 0 : h.total), 0);
    if (cost <= 0) return 'There’s no cost of yours to insure: it’s priced on what you paid.';
    premium = Math.round(cost * US_PREMIUM_SHARE);
  } else if (market === 'uk') {
    const band = UK_PREMIUM.find((b) => age <= b.to);
    if (!band) return 'No price past 79 is published.';
    premium = inSave(sim, band.gbp, 'GBP');
  } else if (market === 'ie') {
    const europe = COUNTRIES.get(CITIES.get(out.toCity)?.countryId ?? '')?.continent === 'Europe';
    premium = inSave(sim, europe ? IE_PREMIUM.europe : IE_PREMIUM.elsewhere, 'EUR');
  } else if (market === 'ca') premium = inSave(sim, CA_PREMIUM_WEEK * Math.ceil(days / 7), 'CAD');
  else premium = inSave(sim, MX_PREMIUM, 'MXN');
  return { premium, from, to, terms, market };
}

/** The policy covering someone now, if any. */
export function policyNow(person: Person, at: Instant): TripPolicy | undefined {
  return journeysOf(person).find((j) => j.insured && j.status !== 'canceled' && j.status !== 'missed' && at >= j.insured.from && at <= j.insured.to)?.insured;
}

/** Ill enough that a policy pays for a trip missed or called off: in hospital, or laid up hurt. */
export const tooIllToTravel = (person: Person, at: Instant): boolean => inHospital(person, at) || laidUp(person, at);

/**
 * A trip lost to illness or injury, claimed: what wasn't returned, to the
 * cancellation limit, less the excess, paid into the bank. What was paid back.
 */
export function claimCancellation(sim: Simulation, person: Person, j: Journey, lost: Money, at: Instant): Money {
  const policy = j.insured;
  if (!policy || lost <= 0 || !tooIllToTravel(person, at)) return 0;
  const terms = TRAVEL_POLICY[policy.market];
  if (terms.cancellation === undefined) return 0;
  const paid = Math.max(0, Math.min(lost, inSave(sim, terms.cancellation, terms.currency)) - inSave(sim, terms.excess, terms.currency));
  if (paid <= 0) return 0;
  sim.post({ memo: `${terms.insurer}, a trip lost to illness or injury, claimed`, category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: paid }, { accountId: sim.nominalAccount('income', 'Insurance Paid').id, amount: -paid }] });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'The Travel Insurer Paid', body: `${terms.insurer} paid back ${formatMoney(paid, saveCurrency(sim.universe))} of the trip you couldn’t take.`, importance: 55 });
  return paid;
}

/**
 * What a piece of care had away from home costs, given what the traveler's
 * own cover would leave: the insurer's to its limit, the excess yours; or,
 * uninsured in America as a visitor, America's uninsured price less OHIP's
 * day rate for an Ontarian. Nothing changes at home.
 */
export function careAway(sim: Simulation, person: Person, care: 'visit' | 'urgent' | 'emergency' | 'stay', homeShare: Money, usUninsured: Money, stayDays: number, ohip: boolean, at: Instant): Money {
  const here = CITIES.get(person.currentLocationId)?.countryId;
  const home = CITIES.get(homeOf(person))?.countryId;
  if (!here || !home || here === home) return homeShare;
  // The price a visitor is charged where they are, where SLATE keeps one: America's, or England's (`ENGLAND_VISITOR`).
  const england = here === 'uk' && CITIES.get(person.currentLocationId)?.parentId === 'uk-eng';
  // Elsewhere, a hospital's own charges for patients from abroad, and the IMSS's in Mexico (`VISITOR_CARE`, from later on 2026-10-02).
  const prices = here === 'ie' && home === 'uk' ? IRELAND_CTA : VISITOR_CARE[CITIES.get(person.currentLocationId)?.parentId ?? ''] ?? VISITOR_CARE[here];
  const unit = !prices ? undefined : care === 'stay' ? prices.stayDay * stayDays : care === 'emergency' ? prices.emergency : care === 'urgent' ? prices.urgent : prices.visit;
  const local = here === 'us' ? usUninsured
    : england ? (home === 'ie' || care !== 'stay' ? 0 : inSave(sim, ENGLAND_VISITOR.stayGbp * ENGLAND_VISITOR.markup, 'GBP'))
    : unit !== undefined ? inSave(sim, unit, prices!.currency)
    : undefined;
  let owed = homeShare;
  if (local !== undefined) {
    const days = care === 'stay' ? stayDays : 1;
    const back = ohip && CITIES.get(homeOf(person))?.parentId === 'ca-08' ? inSave(sim, (care === 'stay' ? OHIP_ABROAD.inpatient : OHIP_ABROAD.outpatient) * days, 'CAD') : 0;
    owed = Math.max(0, local - back);
  }
  const policy = policyNow(person, at);
  if (!policy) return owed;
  const terms = TRAVEL_POLICY[policy.market];
  const limit = inSave(sim, terms.medical, terms.currency);
  return Math.min(owed, inSave(sim, terms.excess, terms.currency)) + Math.max(0, owed - limit);
}
/**
 * A policy carried to a later homecoming, a stay made longer (from 2026-10-06; until then the stay ran past its cover
 * and the way home was uninsured): what more it costs, by how each market prices it. America's is a share of what was
 * paid, so of what the longer stay adds; Canada's is by the week, so the weeks added; Britain's, Ireland's and
 * Mexico's are a single trip's price whatever its days, so nothing more, inside the policy's longest trip.
 */
export function coverLonger(sim: Simulation, policy: TripPolicy, to: Instant, extra: Money): Money | string {
  const terms = TRAVEL_POLICY[policy.market];
  const days = Math.max(1, Math.ceil((to - policy.from) / MS_DAY));
  if (terms.maxDays && days > terms.maxDays) return `${terms.insurer} covers ${terms.maxDays} days a trip at most.`;
  if (policy.market === 'us') return Math.max(0, Math.round(extra * US_PREMIUM_SHARE));
  if (policy.market === 'ca') return inSave(sim, CA_PREMIUM_WEEK * (Math.ceil(days / 7) - Math.ceil(Math.max(1, Math.ceil((policy.to - policy.from) / MS_DAY)) / 7)), 'CAD');
  return 0;
}

export function registerTravelInsurance(sim: Simulation): void {
  sim.onCommand<{ journeyId: string }, { premium: Money }>('travel.insure', (p, { sim: s }) => {
    const person = s.player;
    const j = journeysOf(person).find((x) => x.id === p?.journeyId);
    if (!j) throw new CommandError('That isn’t a journey you have booked.');
    const q = insuranceQuote(s, person, j, s.now);
    if (typeof q === 'string') throw new CommandError(q);
    if (!payFromBank(s, person, q.premium, `${q.terms.insurer}, travel insurance`, 'travel')) throw new CommandError(`${formatMoney(q.premium, saveCurrency(s.universe))} is more than the bank can cover.`);
    const policy: TripPolicy = { market: q.market, premium: q.premium, from: q.from, to: q.to };
    for (const h of halvesOf(person, j)) h.insured = policy;
    return { premium: q.premium };
  });
}
