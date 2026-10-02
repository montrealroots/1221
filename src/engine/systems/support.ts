/**
 * SLATE — the children after their parents part, and the support one pays
 * the other (Stage 10 of `docs/BACKLOG.md`, from 2026-10-02; the formulas in
 * `content/support.ts`).
 *
 * Children stay in the home they had: with you when your partner moves out,
 * with them when you move away and they stay. Each month the parent they
 * don't live with pays the other the support the place's formula gives, on
 * last year's income, until the age the place's support runs to; the parent
 * they live with raises them alone and has the state's child benefit. In
 * Ireland no formula is published, and none is paid.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax } from '../content/tax';
import { familyPlace } from '../content/adoption';
import { CT_SCHEDULE } from '../content/ctsupport';
import { CANADA_TABLES, CA_CHILDREN, CMS, MEXICO_SHARES, NY_CSSA, SUPPORT_UNTIL, californiaK } from '../content/support';
import { contactsOf, type Contact } from './people';
import { earnedIn, incomeOf } from './marriage';
import { owe, payFromBank } from './household';
import { childrenOf, livesWithYou } from './children';

const YEAR_MS = 365.2425 * MS_DAY;
const CURRENCY: Readonly<Record<string, string>> = { 'us-ny': 'USD', 'us-ca': 'USD', 'us-ct': 'USD', uk: 'GBP', 'ca-08': 'CAD', 'ca-02': 'CAD', mx: 'MXN' };

/** The key a town's support reads: a US state, a Canadian province, or a country. */
export function supportPlace(cityId: string): string {
  const city = CITIES.get(cityId);
  if (city?.countryId === 'ca') return city.parentId;
  return familyPlace(cityId);
}

/** Between published points, straight. */
function between(points: Readonly<Record<number, number>>, x: number): number {
  const xs = Object.keys(points).map(Number).sort((a, b) => a - b);
  if (x <= xs[0]!) return points[xs[0]!]! * Math.max(0, x / xs[0]!);
  for (let i = 1; i < xs.length; i += 1) {
    if (x <= xs[i]!) { const a = xs[i - 1]!; const b = xs[i]!; return points[a]! + (points[b]! - points[a]!) * (x - a) / (b - a); }
  }
  return points[xs.at(-1)!]!;
}

/**
 * A month's support in the place's money, units, for some children, from the
 * paying parent's and the other's gross yearly incomes (in that money).
 */
export function supportMonthly(place: string, children: number, payerGross: number, otherGross: number, cityId: string, at: Instant): number | undefined {
  if (children <= 0) return 0;
  const currency = CURRENCY[place];
  if (!currency) return undefined;
  const net = (gross: number) => Math.max(0, gross - computeAnnualTax(Math.round(gross * 100), cityId, at, { currency }).total / 100);
  if (place === 'us-ny') {
    const combined = payerGross + otherGross;
    const share = combined > 0 ? payerGross / combined : 0;
    return (NY_CSSA.shares[Math.min(children, 5) - 1]! * Math.min(combined, NY_CSSA.cap) * share) / 12;
  }
  if (place === 'us-ca') {
    const payer = net(payerGross) / 12;
    const tn = payer + net(otherGross) / 12;
    return californiaK(tn) * payer * CA_CHILDREN[Math.min(children, 4) - 1]!;
  }
  if (place === 'us-ct') {
    const payer = net(payerGross) / 52;
    const combined = payer + net(otherGross) / 52;
    const row = CT_SCHEDULE.find((r) => r[0]! >= combined) ?? CT_SCHEDULE.at(-1)!;
    const share = combined > 0 ? payer / combined : 0;
    return (row[Math.min(children, 6)]! * Math.min(combined, CT_SCHEDULE.at(-1)![0]!) * share * 52) / 12;
  }
  if (place === 'uk') {
    const weekly = Math.min(payerGross / 52, CMS.top);
    const i = Math.min(children, 3) - 1;
    const due = weekly <= CMS.flatTo ? CMS.flatWeekly : CMS.first[i]! * Math.min(weekly, CMS.band) + CMS.second[i]! * Math.max(0, weekly - CMS.band);
    return (due * 52) / 12;
  }
  if (place === 'ca-08' || place === 'ca-02') {
    const t = CANADA_TABLES[place]!;
    const n = Math.min(children, 4);
    if (payerGross > 150_000) { const [base, rate] = t.over[n - 1]!; return base + rate * (payerGross - 150_000); }
    if (n === 1) return between(t.one, payerGross);
    const two = between(t.two, payerGross);
    return n === 2 ? two : two * (t.over[n - 1]![0] / t.over[1]![0]);
  }
  if (place === 'mx') return (MEXICO_SHARES[Math.min(children, 3) - 1]! * net(payerGross)) / 12;
  return undefined;
}

const ageAt = (born: Instant, at: Instant) => (at - born) / YEAR_MS;

/** When you move away from a partner who stays, your children with them stay too. */
export function childrenStay(person: Person, c: Contact): void {
  for (const k of childrenOf(person)) if (k.otherParentId === c.id) k.livesWith = 'them';
}

/**
 * The month's support with each former partner you have children with: what
 * you pay them (negative) or they pay you, in the save's money.
 */
export function supportLines(sim: Simulation, person: Person, at: Instant): { contact: Contact; amount: Money }[] {
  const cur = saveCurrency(sim.universe);
  const year = new Date(at).getUTCFullYear() - 1;
  const out: { contact: Contact; amount: Money }[] = [];
  for (const c of contactsOf(person)) {
    if (c.livesWith !== undefined || person.marriage?.contactId === c.id) continue;
    const kids = childrenOf(person).filter((k) => k.otherParentId === c.id);
    if (!kids.length) continue;
    const withYou = kids.filter(livesWithYou);
    const withThem = kids.filter((k) => !livesWithYou(k));
    for (const [group, payer] of [[withThem, 'you'], [withYou, 'them']] as const) {
      const cityId = payer === 'you' ? c.cityId : person.home?.cityId ?? person.currentLocationId;
      const place = supportPlace(cityId);
      const owed = group.filter((k) => ageAt(k.born, at) < (SUPPORT_UNTIL[place] ?? 18)).length;
      if (!owed) continue;
      const currency = CURRENCY[place];
      if (!currency) continue;
      const mine = earnedIn(person, year);
      const myUnits = (cur === currency ? mine : exchange(mine, cur, currency) ?? mine) / 100;
      const i = incomeOf(sim, person, c);
      const theirs = i.employed ? (i.currency === currency ? i.annual : (exchange(Math.round(i.annual * 100), i.currency, currency) ?? 0) / 100) : 0;
      const units = supportMonthly(place, owed, payer === 'you' ? myUnits : theirs, payer === 'you' ? theirs : myUnits, cityId, at);
      if (!units) continue;
      const cents = Math.round(units * 100);
      const amount = cur === currency ? cents : exchange(cents, currency, cur) ?? cents;
      out.push({ contact: c, amount: payer === 'you' ? -amount : amount });
    }
  }
  return out;
}

/** Pays and takes the month's support. */
export function supportMonth(sim: Simulation, person: Person, at: Instant): void {
  for (const { contact, amount } of supportLines(sim, person, at)) {
    const name = contact.name.split(' ')[0];
    if (amount < 0) { if (!payFromBank(sim, person, -amount, `Child support to ${name}`, 'household')) owe(sim, person, -amount, 'Child support', 'household'); }
    else if (person.primaryAccountId) sim.post({ memo: `Child support from ${name}`, category: 'benefits', postings: [{ accountId: person.primaryAccountId, amount }, { accountId: sim.nominalAccount('income', 'Child Support').id, amount: -amount }] });
  }
}

/** Whether any support is still running, for the family's month to go on. */
export const supportRuns = (sim: Simulation, person: Person, at: Instant): boolean => supportLines(sim, person, at).length > 0;
