/**
 * SLATE — the internet at home and the phone, billed by their providers
 * (Stage 11 of `docs/BACKLOG.md`, from 2026-10-01; the offers in
 * `content/telecom.ts`).
 *
 * In a town whose offers SLATE keeps, a home's internet is an account with a
 * named provider, opened at the cheapest offer on moving in, and the phone
 * one with the country's cheapest plan. Each is paid with the rent and the
 * bills on the 1st: the internet at its offer for its months and its
 * standard price after, where published, shared as the bills are (a room in
 * a shared flat half of it, as the flat's bills are split, 90 of 180); the
 * phone at its price, or a year at once on a prepay. Their part of the
 * month's bills, which SLATE's atlas estimated before, comes out of the
 * bills there, so nothing is paid twice (`TELECOM_OF_BILLS`). Switch
 * Provider takes the other offer, as a new customer, paying what's left of
 * a contract's months. Elsewhere the bills still carry them.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { INTERNET, MOBILE, PHONE_TAX, type InternetPlan, type MobilePlan } from '../content/telecom';
import { ENERGY } from './seasons';

const MONTH_MS = (365.2425 / 12) * MS_DAY;

/**
 * The phone and internet's share of SLATE's bills: the part that isn't
 * energy (`ENERGY.share` in `systems/seasons.ts`) is the phone, the internet
 * and getting about, and Mexico's households spend 4.8% of what they spend
 * on communications against 19.5% on transport and communications together
 * (INEGI, ENIGH 2024, published July 2025), so communications are that
 * part's 4.8/19.5.
 */
export const TELECOM_OF_BILLS = (1 - ENERGY.share) * (4.8 / 19.5);

export interface Telecom {
  internet?: { planId: string; since: Instant; cityId: string };
  mobile?: { planId: string; since: Instant; paidUntil?: Instant };
}

export const telecomOf = (person: Person): Telecom => (person.telecom ??= {});

/** A town's internet offers, the cheapest first. */
export const internetIn = (cityId: string): InternetPlan[] => INTERNET.filter((p) => p.cityId === cityId).sort((a, b) => a.monthly - b.monthly);
const planById = (id: string | undefined): InternetPlan | undefined => INTERNET.find((p) => p.id === id);

/** Whether a town's internet and phone are billed by their providers, out of the bills. */
export const billedApart = (cityId: string): boolean => INTERNET.some((p) => p.cityId === cityId);

/** The phone plan for where someone lives. */
export const mobileIn = (cityId: string): MobilePlan | undefined => MOBILE.find((m) => m.country === CITIES.get(cityId)?.countryId);

/** An offer's month, in its money: its price for its months, its standard price after where published. */
export function internetMonth(plan: InternetPlan, since: Instant, at: Instant): number {
  // A standard price is only ever published with the offer's months.
  return plan.after !== undefined && at - since >= plan.months! * MONTH_MS ? plan.after : plan.monthly;
}

/** A home's share of its internet: a flat's own, or half of a shared flat's, as its bills are split. */
export const internetShare = (kind: string | undefined): number => (kind === 'own' || kind === 'owned' ? 1 : kind === 'shared' ? 0.5 : 0);

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** What leaving an offer now costs: a contract's months left, at its price. */
export function leavingCost(sim: Simulation, person: Person, at: Instant): Money {
  const now = telecomOf(person).internet;
  const plan = planById(now?.planId);
  if (!now || !plan) return 0;
  // A rolling offer has no months to owe.
  const left = Math.ceil((plan.contract ?? 0) - (at - now.since) / MONTH_MS);
  return left > 0 ? inSave(sim, internetMonth(plan, now.since, at) * left * internetShare(person.home?.kind), plan.currency) : 0;
}

export function switchRefusal(person: Person, planId: string): string | undefined {
  const home = person.home;
  if (!home || internetShare(home.kind) === 0) return 'There’s no home of yours to have the internet in.';
  const plan = planById(planId);
  if (!plan || plan.cityId !== home.cityId) return 'That isn’t offered where you live.';
  if (telecomOf(person).internet?.planId === planId) return 'You have it already.';
  return undefined;
}

/**
 * The month's internet and phone, as lines to pay with the bills: a home's
 * account opened at the cheapest offer where there's none or it was in
 * another town, the phone's on the country's plan. `shared` lines are split
 * with a partner as the bills are.
 */
export function telecomLines(sim: Simulation, person: Person, at: Instant): { memo: string; amount: Money; shared: boolean }[] {
  const home = person.home;
  if (!home || !billedApart(home.cityId)) return [];
  const t = telecomOf(person);
  const lines: { memo: string; amount: Money; shared: boolean }[] = [];
  const share = internetShare(home.kind);
  if (share > 0) {
    if (!t.internet || t.internet.cityId !== home.cityId) t.internet = { planId: internetIn(home.cityId)[0]!.id, since: at, cityId: home.cityId };
    const plan = planById(t.internet.planId)!;
    lines.push({ memo: `Internet, ${plan.provider}`, amount: inSave(sim, internetMonth(plan, t.internet.since, at) * share, plan.currency), shared: true });
  } else delete t.internet;
  const mobile = mobileIn(home.cityId);
  if (mobile) {
    if (t.mobile?.planId !== mobile.id) t.mobile = { planId: mobile.id, since: at };
    const tax = PHONE_TAX[CITIES.get(home.cityId)?.parentId ?? ''] ?? 1;
    const months = mobile.prepayMonths ?? 1;
    if ((t.mobile.paidUntil ?? 0) <= at) {
      lines.push({ memo: `Phone, ${mobile.provider}${months > 1 ? `, ${months} months ahead` : ''}`, amount: inSave(sim, mobile.monthly * months * tax, mobile.currency), shared: false });
      t.mobile.paidUntil = at + months * MONTH_MS - MS_DAY;
    }
  }
  return lines;
}

export function registerTelecom(sim: Simulation, pay: (sim: Simulation, person: Person, amount: Money, memo: string) => boolean): void {
  sim.onCommand<{ planId: string }, { paid: Money }>('home.internet', (p, { sim: s }) => {
    const person = s.player;
    const no = switchRefusal(person, String(p?.planId));
    if (no) throw new CommandError(no);
    const paid = leavingCost(s, person, s.now);
    const old = planById(telecomOf(person).internet?.planId);
    if (paid > 0 && !pay(s, person, paid, `${old?.provider ?? 'The old provider'}, the contract’s months left`)) throw new CommandError(`${formatMoney(paid, saveCurrency(s.universe))} is more than the bank can cover.`);
    telecomOf(person).internet = { planId: String(p.planId), since: s.now, cityId: person.home!.cityId };
    return { paid };
  });
}
