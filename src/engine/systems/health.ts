/**
 * SLATE — health cover after school, illness, and the bills it brings
 * (`content/career.ts` `UNION_HEALTH`, `content/safetynet.ts`).
 *
 * The Yale Health plan a student pays for covers the academic year, to the
 * end of July; after it an actor is covered by what they earn, what they
 * qualify for, or what they buy. SAG-AFTRA's plan looks at each twelve-month
 * base period ending a quarter: earnings under it at the year's threshold
 * give twelve months' cover from three months after, for a quarterly
 * premium. Equity-League's gives six months from two months after ten weeks
 * of Equity work in twelve. A union plan lost can be kept by COBRA, elected
 * within 60 days, back to the day it ended, for 18 months at its full cost,
 * three-quarters of it paid by New York for a year where the income is low.
 * On a low month's income, Medicaid (Medi-Cal in California) or New York's
 * Essential Plan takes them at any time; otherwise the marketplace's
 * benchmark plan, in open enrollment or within 60 days of losing cover,
 * with the credit taken on the return. A month without cover in California
 * is a month of its penalty.
 *
 * Illness comes as it does to an adult their age (`health.illness`): the
 * flu in its season, a doctor's visit, an emergency, a stay in hospital. It
 * costs the body, a stay keeps them in hospital three days, and each brings a
 * bill for what their plan leaves them, or, uninsured, the price, less a
 * hospital's charity where their income earns it. A bill is due in 30 days;
 * unpaid, it's a medical debt, which goes on the record only at $500, a year
 * past due, and outside New York and California.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { UNION_HEALTH, rateOn } from '../content/career';
import {
  BENCHMARK, BENEFIT_STATE, CARE, CHARITY, COBRA, ENROLLMENT, MEDICAL_DEBT, PLANS, POVERTY_LINE, PUBLIC_COVER, byYear,
  type BenefitState, type PlanDesign,
} from '../content/safetynet';
import { earningsOf, homeOf, quartersBefore } from './earnings';
import { payFromCurrent } from './household';

export const HEALTH_MONTH_KIND = 'health.month';
export const HEALTH_WEEK_KIND = 'health.week';
export const BILL_KIND = 'health.bill';

export type Cover = 'yale' | 'sag' | 'equity' | 'cobra' | 'medicaid' | 'essential' | 'marketplace';

export interface MedicalBill { id: string; at: Instant; what: string; amount: Money; dueAt: Instant; paid?: boolean }

export interface HealthRecord {
  marketplace?: { from: Instant; until?: Instant; state: BenefitState };
  sag?: { from: Instant; until: Instant };
  equity?: { from: Instant; until: Instant };
  /** Medicaid, Medi-Cal or the Essential Plan, and when it's next renewed. */
  program?: { kind: 'medicaid' | 'essential'; state: BenefitState; from: Instant; until?: Instant; renewAt: Instant; band: 'low' | 'high' };
  cobra?: { plan: 'sag' | 'equity'; from: Instant; until: Instant; subsidized: boolean };
  /** A union plan lost, and until when COBRA may be elected. */
  cobraOffer?: { plan: 'sag' | 'equity'; lostAt: Instant; until: Instant };
  /** The union plan that covered them last month, to see it end. */
  lastUnion?: 'sag' | 'equity';
  /** The marketplace premiums paid each month, by year, for the premium tax credit. */
  premiums: Record<string, Money[]>;
  /** Months without cover while living in California, by year, for its penalty. */
  uncoveredInCalifornia: Record<string, number>;
  /** When cover last ended, which opens 60 days to enroll. */
  lostAt?: Instant;
  /** Whether they were covered at the last month's start. */
  covered: boolean;
  /** What they've paid toward care this year, and toward its deductible. */
  spent: Record<string, Money>;
  deductible: Record<string, Money>;
  bills: MedicalBill[];
  /** In hospital until. */
  inHospitalUntil?: Instant;
  /** A medical debt past a year and reported, once. */
  reported?: boolean;
  debtSince?: Instant;
  seq?: number;
}

export function healthOf(person: Person): HealthRecord {
  person.health ??= { premiums: {}, uncoveredInCalifornia: {}, covered: true, spent: {}, deductible: {}, bills: [] };
  const h = person.health;
  h.spent ??= {};
  h.deductible ??= {};
  h.bills ??= [];
  return h;
}

const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
const HOME = 'America/New_York';
const firstOf = (year: number, month: number, zone = HOME) => instantFromZoned({ ...normalDate(year, month, 1), hour: 0 }, zone);
const monthKey = (at: Instant) => { const p = zonedParts(at, HOME); return `${p.year}-${String(p.month).padStart(2, '0')}`; };
const lastMonthKey = (at: Instant) => { const p = zonedParts(at, HOME); const d = normalDate(p.year, p.month - 1, 1); return `${d.year}-${String(d.month).padStart(2, '0')}`; };
const inCalifornia = (cityId: string) => CITIES.get(cityId)?.parentId === 'us-ca';
const active = (r: { from: Instant; until?: Instant } | undefined, at: Instant) => r !== undefined && at >= r.from && (r.until === undefined || at < r.until);

/** Until when the Yale Health plan covers them: while at school, and to 31 July of the year school ended. */
export function yaleUntil(person: Person): Instant | undefined {
  const school = person.school;
  if (!school) return undefined;
  if (school.standing !== 'graduated' && school.standing !== 'dismissed') return Number.POSITIVE_INFINITY;
  const since = person.career?.since;
  if (since === undefined) return Number.POSITIVE_INFINITY;
  const p = zonedParts(since, HOME);
  return firstOf(p.month >= 8 ? p.year + 1 : p.year, 8);
}

/** What covers them at a moment, first match. */
export function coverOn(person: Person, at: Instant): Cover | undefined {
  const h = person.health;
  if (at < (yaleUntil(person) ?? 0)) return 'yale';
  if (active(h?.sag, at)) return 'sag';
  if (active(h?.equity, at)) return 'equity';
  if (active(h?.cobra, at)) return 'cobra';
  if (active(h?.program, at)) return h!.program!.kind;
  if (active(h?.marketplace, at)) return 'marketplace';
  return undefined;
}

/** The plan design that covers them, for what care leaves them. */
export function planOf(person: Person, at: Instant): PlanDesign | undefined {
  const cover = coverOn(person, at);
  const h = person.health;
  if (!cover) return undefined;
  if (cover === 'cobra') return PLANS[h!.cobra!.plan];
  if (cover === 'essential') return PLANS[`essential-${h!.program!.band}`];
  if (cover === 'marketplace') return PLANS[`marketplace-${h!.marketplace!.state}`];
  return PLANS[cover];
}

/** The poverty line a month, in a year. */
const povertyMonth = (year: number, into: string) => usd(byYear(POVERTY_LINE, year), into) / 12;

/** What program last month's income qualifies them for where they live: Medicaid, the Essential Plan, or none. */
export function programFor(person: Person, at: Instant, into = 'USD'): { kind: 'medicaid' | 'essential'; band: 'low' | 'high' } | undefined {
  const state = BENEFIT_STATE[homeOf(person)];
  if (!state) return undefined;
  const income = earningsOf(person).months[lastMonthKey(at)] ?? 0;
  const ratio = income / povertyMonth(zonedParts(at, HOME).year, into);
  if (ratio <= PUBLIC_COVER.medicaidShare) return { kind: 'medicaid', band: 'low' };
  if (state === 'ny' && ratio <= PUBLIC_COVER.essentialShare) return { kind: 'essential', band: ratio <= PUBLIC_COVER.essentialCopaysFrom ? 'low' : 'high' };
  return undefined;
}

/** Whether they may enroll now, in a program or the marketplace, and in which. */
export function mayEnroll(person: Person, at: Instant, into = 'USD'): { ok: boolean; why: string; program?: 'medicaid' | 'essential' } {
  const state = BENEFIT_STATE[homeOf(person)];
  if (!state) return { ok: false, why: 'SLATE has public cover and the marketplace in New York and Los Angeles.' };
  const h = healthOf(person);
  if (active(h.program, at) || active(h.marketplace, at)) return { ok: false, why: 'You’re enrolled.' };
  const program = programFor(person, at, into);
  if (program) return { ok: true, why: `Last month’s income qualifies you for ${program.kind === 'medicaid' ? (state === 'ca' ? 'Medi-Cal' : 'Medicaid') : 'the Essential Plan'}, at any time and with no premium.`, program: program.kind };
  const p = zonedParts(at, HOME);
  const open = (p.month > ENROLLMENT.openFrom[0] || (p.month === ENROLLMENT.openFrom[0] && p.day >= ENROLLMENT.openFrom[1]))
    || (p.month < ENROLLMENT.openUntil[0] || (p.month === ENROLLMENT.openUntil[0] && p.day <= ENROLLMENT.openUntil[1]));
  if (open) return { ok: true, why: 'Open enrollment.' };
  if (h.lostAt !== undefined && at - h.lostAt <= ENROLLMENT.specialDays * MS_DAY) return { ok: true, why: `Within ${ENROLLMENT.specialDays} days of losing cover.` };
  return { ok: false, why: `Outside open enrollment, 1 November to 15 January, and not within ${ENROLLMENT.specialDays} days of losing cover.` };
}

/** The benchmark plan's premium a month, where they live, in a year. */
export const benchmarkFor = (state: BenefitState, year: number, into: string): Money => usd(byYear(BENCHMARK[state], year), into);

/** The health plans' month and week for them, from the first of the next month and the next Monday. */
export function armHealth(sim: Simulation, person: Person): void {
  healthOf(person);
  const p = zonedParts(sim.now, HOME);
  if (!sim.universe.scheduled.some((i) => i.kind === HEALTH_MONTH_KIND && i.status === 'pending' && i.payload.personId === person.id)) {
    sim.schedule({ at: firstOf(p.year, p.month + 1) + 30 * 60_000, kind: HEALTH_MONTH_KIND, label: 'Health Cover', category: 'system', priority: 6, payload: { personId: person.id } });
  }
  if (!sim.universe.scheduled.some((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === person.id)) {
    sim.schedule({ at: nextMonday(sim.now), kind: HEALTH_WEEK_KIND, label: 'Health', category: 'system', priority: 6, payload: { personId: person.id } });
  }
}

function nextMonday(from: Instant): Instant {
  const p = zonedParts(from, HOME);
  for (let n = 1; n <= 7; n += 1) {
    const d = normalDate(p.year, p.month, p.day + n);
    if (new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() === 1) return instantFromZoned({ ...d, hour: 9 }, HOME);
  }
  return from + 7 * MS_DAY;
}

/** Months from one moment to another, counting each month's first it passes. */
const monthsBetween = (from: Instant, to: Instant) => {
  const a = zonedParts(from, HOME);
  const b = zonedParts(to, HOME);
  return Math.max(1, (b.year - a.year) * 12 + (b.month - a.month) + 1);
};

/** The hours worked and wages earned last month, for the work requirement. */
function lastMonthWork(person: Person, at: Instant): { hours: number; earnings: Money } {
  const key = lastMonthKey(at);
  const hours = (person.career?.days ?? []).filter((d) => monthKey(d.at) === key).reduce((s, d) => s + d.hours, 0);
  return { hours, earnings: earningsOf(person).months[key] ?? 0 };
}

const renewMonths = (at: Instant) => rateOn(PUBLIC_COVER.renewMonths, monthKey(at) + '-01');

/**
 * A month's start. At a quarter's, SAG-AFTRA's plan reads the base period
 * that ended three months before. Each month, Equity-League's reads the last
 * twelve months' weeks; a union plan just lost is offered by COBRA; a
 * program comes up for renewal; the premiums fall due; and what covers them
 * is settled, with a month uncovered in California counted.
 */
export function healthMonth(sim: Simulation, person: Person, at: Instant): void {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  const p = zonedParts(at, HOME);
  const record = earningsOf(person);
  const home = homeOf(person);
  if (p.month % 3 === 1) {
    const q = (p.month + 2) / 3;
    const prev = q === 1 ? { y: p.year - 1, q: 4 } : { y: p.year, q: q - 1 };
    const base = quartersBefore(prev.y, prev.q, 4);
    const earned = base.reduce((sum, key) => sum + (record.quarters[key]?.sag ?? 0), 0);
    const baseEnds = Number(base[3]!.slice(0, 4));
    if (earned >= usd(rateOn(UNION_HEALTH.sagThreshold, `${baseEnds}-12-31`), cur)) {
      const until = firstOf(p.year + 1, p.month);
      h.sag = h.sag && h.sag.until >= at ? { from: h.sag.from, until } : { from: at, until };
    }
    if (active(h.sag, at)) payFromCurrent(sim, person, usd(rateOn(UNION_HEALTH.sagPremium, `${p.year}-${String(p.month).padStart(2, '0')}-01`), cur), 'SAG-AFTRA Health Plan premium', 'health');
  }
  const yearAgo = at - 365 * MS_DAY;
  const weeks = record.equityWeeks.filter((key) => instantFromZoned({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), day: Number(key.slice(8, 10)), hour: 12 }, HOME) >= yearAgo).length;
  if (weeks >= UNION_HEALTH.equityWeeks && !(h.equity && h.equity.until > firstOf(p.year, p.month + 2))) {
    const from = firstOf(p.year, p.month + 2);
    h.equity = { from: h.equity && h.equity.until >= from ? h.equity.from : from, until: firstOf(p.year, p.month + 2 + UNION_HEALTH.equityMonths) };
  }
  // Equity-League's $300 a quarter, a third of it each month covered.
  if (active(h.equity, at)) payFromCurrent(sim, person, usd(Math.round(UNION_HEALTH.equityPremium / 3), cur), 'Equity-League Health premium', 'health');
  // A union plan just ended: COBRA may keep it.
  const union = active(h.sag, at) ? 'sag' : active(h.equity, at) ? 'equity' : undefined;
  if (h.lastUnion && !union && !active(h.cobra, at)) {
    h.cobraOffer = { plan: h.lastUnion, lostAt: at, until: at + COBRA.electDays * MS_DAY };
    if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: 'You Can Keep Your Plan By COBRA', body: `Your ${PLANS[h.lastUnion]!.label} ended. Elect COBRA by ${formatDate(h.cobraOffer.until, HOME)} and it covers you from the day it ended, for up to ${COBRA.months} months, at ${formatMoney(usd(COBRA.premium[h.lastUnion], cur), cur)} a month.`, importance: 80, route: '/workspace/papers' });
  }
  h.lastUnion = union;
  if (active(h.cobra, at)) {
    const c = h.cobra!;
    const share = c.subsidized && at < c.from + COBRA.newYorkMonths * 30.4375 * MS_DAY ? 1 - COBRA.newYorkShare : 1;
    if (!payFromCurrent(sim, person, Math.round(usd(COBRA.premium[c.plan], cur) * share), 'COBRA premium', 'health')) c.until = at;
  }
  // A program's renewal: its income test, and from 2027 Medicaid's work.
  const prog = h.program;
  if (prog && active(prog, at)) {
    if (BENEFIT_STATE[home] !== prog.state) prog.until = at;
    else if (at >= prog.renewAt) {
      const still = programFor(person, at, cur);
      const work = lastMonthWork(person, at);
      const worksEnough = prog.kind !== 'medicaid' || monthKey(at) < PUBLIC_COVER.workFrom.slice(0, 7) || work.hours >= PUBLIC_COVER.workHours || work.earnings >= usd(PUBLIC_COVER.workEarnings, cur);
      if (still?.kind === prog.kind && worksEnough) {
        prog.band = still.band;
        prog.renewAt = firstOf(p.year, p.month + renewMonths(at));
      } else {
        prog.until = at;
        if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: 'Your Public Cover Ended At Renewal', body: !worksEnough ? `Medicaid now asks for ${PUBLIC_COVER.workHours} hours’ work or ${formatMoney(usd(PUBLIC_COVER.workEarnings, cur), cur)} of earnings a month, and last month had neither.` : 'Last month’s income is over what it allows.', importance: 80, route: '/workspace/papers' });
      }
    }
  }
  // The marketplace: a plan is the state's, and ends on leaving it.
  const m = h.marketplace;
  if (m && (m.until === undefined || at < m.until)) {
    if (BENEFIT_STATE[home] !== m.state) m.until = at;
    else if (at >= m.from) {
      const premium = benchmarkFor(m.state, p.year, cur);
      if (payFromCurrent(sim, person, premium, 'Marketplace health plan premium', 'health')) (h.premiums[p.year] ??= []).push(premium);
      else m.until = at;
    }
  }
  const cover = coverOn(person, at);
  if (!cover && inCalifornia(home)) h.uncoveredInCalifornia[p.year] = (h.uncoveredInCalifornia[p.year] ?? 0) + 1;
  if (h.covered && !cover) {
    h.lostAt = at;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: 'Your Health Cover Ended', body: `Nothing covers you from ${formatDate(at, HOME)}. You have ${ENROLLMENT.specialDays} days to enroll in the marketplace${inCalifornia(home) ? ', and every month uncovered in California costs its penalty on your return' : ''}.`, importance: 80, route: '/workspace/papers' });
  }
  h.covered = cover !== undefined;
  // A medical debt a year past due, $500 or more, goes on the record, outside the states that bar it.
  const debt = medicalDebtOf(sim, person);
  if (debt && -debt.balance >= usd(MEDICAL_DEBT.reportAt, cur) && h.debtSince !== undefined && at - h.debtSince >= MEDICAL_DEBT.reportAfterDays * MS_DAY
    && !MEDICAL_DEBT.barredIn.includes(CITIES.get(home)?.parentId ?? '') && !h.reported && person.credit) {
    h.reported = true;
    person.credit.score = Math.max(300, person.credit.score - MEDICAL_DEBT.recordHit);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: 'A Medical Debt Is On Your Record', body: 'Unpaid a year and over $500, it’s reported now.', importance: 80, route: '/workspace/papers' });
  }
}

/** Their medical debt, if any: what bills they couldn't pay. */
export function medicalDebtOf(sim: Simulation, person: Person) {
  return Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.category === 'medical' && !a.closedAt);
}

export type Care = 'visit' | 'urgent' | 'emergency' | 'stay';

/**
 * What a piece of care leaves them to pay. Covered: the plan's copay, or for
 * a stay the deductible still owed and the plan's share of the rest, to what
 * remains of the year's out-of-pocket most. Uninsured: the price the
 * uninsured are billed, less a hospital's charity for an emergency or a stay,
 * by the last year's income against the poverty line.
 */
export function shareOf(person: Person, care: Care, at: Instant, into = 'USD'): Money {
  const price = usd(CARE.price[care], into);
  const year = zonedParts(at, HOME).year;
  const plan = planOf(person, at);
  const h = healthOf(person);
  if (!plan) {
    const hospital = care === 'emergency' || care === 'stay';
    if (!hospital) return Math.round(price * CARE.uninsuredMarkup);
    const months = earningsOf(person).months;
    const since = at - 365 * MS_DAY;
    const income = Object.entries(months).filter(([k]) => firstOf(Number(k.slice(0, 4)), Number(k.slice(5, 7))) >= since).reduce((s, [, v]) => s + v, 0);
    const ratio = income / usd(byYear(POVERTY_LINE, year), into);
    const state = CITIES.get(homeOf(person))?.parentId;
    if (state === 'us-ny' && ratio < CHARITY.newYorkFreeBelow) return 0;
    if (state === 'us-ca' && ratio < CHARITY.californiaDiscountBelow) return price;
    return Math.round(price * CARE.uninsuredMarkup);
  }
  let share: number;
  if (care === 'stay') {
    const left = Math.max(0, usd(plan.deductible, into) - (h.deductible[year] ?? 0));
    const toDeductible = Math.min(price, left);
    share = toDeductible + Math.round((price - toDeductible) * plan.stayShare);
    h.deductible[year] = (h.deductible[year] ?? 0) + toDeductible;
  } else share = usd(plan[care], into);
  const cap = usd(plan.outOfPocket, into);
  return Math.max(0, Math.min(share, cap - (h.spent[year] ?? 0)));
}

/** A week's health (`health.illness`): the flu in its season, a doctor's visit, an emergency, a stay. */
export function illnessWeek(sim: Simulation, person: Person, at: Instant): { care: Care; what: string; flu?: boolean }[] {
  const rng = sim.rng('health.illness', person.id, String(at));
  const p = zonedParts(at, HOME);
  const out: { care: Care; what: string; flu?: boolean }[] = [];
  const weekly = (perYear: number) => 1 - Math.exp(-perYear / 52);
  if (rng.next() < weekly(CARE.perYear.stay)) out.push({ care: 'stay', what: 'A stay in hospital' });
  if (rng.next() < weekly(CARE.perYear.emergency)) out.push({ care: 'emergency', what: 'The emergency room' });
  if (rng.next() < weekly(CARE.perYear.visit)) out.push({ care: 'visit', what: 'A doctor’s visit' });
  const season = p.month >= 10 || p.month <= 3;
  if (season && rng.next() < 1 - (1 - CARE.flu) ** (1 / CARE.fluSeasonWeeks)) {
    out.push(rng.next() < CARE.fluSeesClinician ? { care: 'urgent', what: 'The flu, at urgent care', flu: true } : { care: 'visit', what: 'The flu', flu: true });
  }
  return out;
}

/** An illness or a piece of care: what it takes from the body, a stay's days, and the bill. */
export function careFor(sim: Simulation, person: Person, event: { care: Care; what: string; flu?: boolean }, at: Instant): MedicalBill | undefined {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  const w = person.wellbeing;
  const toll = event.flu ? CARE.toll.flu : event.care === 'stay' ? CARE.toll.stay : event.care === 'emergency' ? CARE.toll.emergency : undefined;
  if (toll) {
    w.condition = Math.max(0, w.condition - toll.condition);
    w.energy = Math.max(0, w.energy - toll.energy);
  }
  if (event.care === 'stay') h.inHospitalUntil = at + CARE.stayDays * MS_DAY;
  // A flu that isn't seen costs nothing.
  if (event.flu && event.care === 'visit') return undefined;
  const amount = shareOf(person, event.care, at, cur);
  const year = zonedParts(at, HOME).year;
  if (planOf(person, at)) h.spent[year] = (h.spent[year] ?? 0) + amount;
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'money', title: event.care === 'stay' ? 'In Hospital' : event.flu ? 'You Have The Flu' : event.care === 'emergency' ? 'The Emergency Room' : 'A Doctor’s Visit', body: `${event.what}${event.care === 'stay' ? `, ${CARE.stayDays} days` : ''}. ${amount > 0 ? `Your share is ${formatMoney(amount, cur)}, due in ${MEDICAL_DEBT.dueDays} days.` : 'Nothing to pay.'}`, importance: event.care === 'stay' ? 85 : 60, route: '/workspace/papers' });
  }
  if (amount <= 0) return undefined;
  h.seq = (h.seq ?? 0) + 1;
  const bill: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY };
  h.bills.push(bill);
  h.bills = h.bills.slice(-40);
  sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Medical Bill Due: ${event.what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
  return bill;
}

export function registerHealth(sim: Simulation): void {
  sim.onSchedule(HEALTH_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    healthMonth(s, person, item.at);
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: firstOf(p.year, p.month + 1) + 30 * 60_000, kind: HEALTH_MONTH_KIND, label: 'Health Cover', category: 'system', priority: 6, payload: { personId: person.id } });
  });

  sim.onSchedule(HEALTH_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    for (const event of illnessWeek(s, person, item.at)) careFor(s, person, event, item.at);
    s.schedule({ at: nextMonday(item.at), kind: HEALTH_WEEK_KIND, label: 'Health', category: 'system', priority: 6, payload: { personId: person.id } });
  });

  sim.onSchedule(BILL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const bill = person ? healthOf(person).bills.find((b) => b.id === item.payload.billId) : undefined;
    if (!person || !bill || bill.paid) return;
    bill.paid = true;
    if (payFromCurrent(s, person, bill.amount, `Medical bill: ${bill.what}`, 'health')) return;
    // Unpaid, a debt.
    const h = healthOf(person);
    const debt = medicalDebtOf(s, person) ?? s.openAccount({ id: s.nextId('account'), kind: 'loan', category: 'medical', name: 'Owed For Medical Care', ownerId: person.id, institution: 'Your Providers', openedAt: s.now });
    s.post({ memo: `Medical bill unpaid: ${bill.what}`, category: 'health', postings: [{ accountId: debt.id, amount: -bill.amount }, { accountId: s.nominalAccount('expense', 'Medical Care').id, amount: bill.amount }] });
    h.debtSince ??= s.now;
    if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'A Medical Bill Went Unpaid', body: `${formatMoney(bill.amount, saveCurrency(s.universe))} for ${bill.what.toLowerCase()} is a medical debt now.`, importance: 75, route: '/workspace/papers' });
  });

  sim.onCommand<Record<string, never>, { from: Instant; kind: string }>('health.enroll', (_p, { sim: s }) => {
    const person = s.player;
    const cur = saveCurrency(s.universe);
    const may = mayEnroll(person, s.now, cur);
    if (!may.ok) throw new CommandError(may.why);
    const state = BENEFIT_STATE[homeOf(person)]!;
    const p = zonedParts(s.now, HOME);
    const from = firstOf(p.year, p.month + 1);
    const h = healthOf(person);
    if (may.program) {
      const band = programFor(person, s.now, cur)!.band;
      h.program = { kind: may.program, state, from, band, renewAt: firstOf(p.year, p.month + 1 + renewMonths(s.now)) };
    } else h.marketplace = { from, state };
    armHealth(s, person);
    return { from, kind: may.program ?? 'marketplace' };
  });

  sim.onCommand<Record<string, never>, { until: Instant }>('health.drop', (_p, { sim: s }) => {
    const h = healthOf(s.player);
    const p = zonedParts(s.now, HOME);
    const until = firstOf(p.year, p.month + 1);
    const plan = [h.marketplace, h.cobra, h.program].find((r) => r && (r.until === undefined || r.until > s.now));
    if (!plan) throw new CommandError('You have no plan of your own to drop.');
    plan.until = until;
    return { until };
  });

  sim.onCommand<Record<string, never>, { from: Instant; months: number }>('health.elect_cobra', (_p, { sim: s }) => {
    const person = s.player;
    const h = healthOf(person);
    const offer = h.cobraOffer;
    if (!offer || s.now > offer.until) throw new CommandError('You have no COBRA to elect.');
    const cur = saveCurrency(s.universe);
    const lastMonth = earningsOf(person).months[lastMonthKey(s.now)] ?? 0;
    const subsidized = BENEFIT_STATE[homeOf(person)] === 'ny' && lastMonth <= usd(COBRA.newYorkIncome, cur);
    // Back to the day it ended: the months since are due now.
    const months = monthsBetween(offer.lostAt, s.now);
    const owed = Math.round(usd(COBRA.premium[offer.plan], cur) * (subsidized ? 1 - COBRA.newYorkShare : 1) * months);
    if (!payFromCurrent(s, person, owed, `COBRA premiums, ${months} ${months === 1 ? 'month' : 'months'}`, 'health')) throw new CommandError(`COBRA’s first ${months} ${months === 1 ? 'month' : 'months'} come to ${formatMoney(owed, cur)}, which the bank can’t cover.`);
    const end = zonedParts(offer.lostAt, HOME);
    h.cobra = { plan: offer.plan, from: offer.lostAt, until: firstOf(end.year, end.month + COBRA.months), subsidized };
    delete h.cobraOffer;
    return { from: offer.lostAt, months };
  });

  sim.onCommand<{ amount: Money }, { paid: Money }>('health.pay_bill', (p, { sim: s }) => {
    const person = s.player;
    const debt = medicalDebtOf(s, person);
    if (!debt || debt.balance >= 0) throw new CommandError('You owe nothing for care.');
    const amount = Math.min(Math.round(Number(p.amount)), -debt.balance);
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!current || current.balance < amount) throw new CommandError('Your current account can’t cover it.');
    s.post({ memo: 'Paid toward medical debt', category: 'health', postings: [{ accountId: current.id, amount: -amount }, { accountId: debt.id, amount }] });
    if (debt.balance >= 0) delete healthOf(person).debtSince;
    return { paid: amount };
  });
}

/** A cover's name, for the screens. */
export const COVER_LABEL: Record<Cover, string> = {
  yale: 'Yale Health', sag: 'SAG-AFTRA Health Plan', equity: 'Equity-League Health', cobra: 'COBRA',
  medicaid: 'Medicaid', essential: 'Essential Plan', marketplace: 'Marketplace Plan',
};
