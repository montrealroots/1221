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
 *
 * Some carry a condition from the start, drawn at a young adult's rates
 * (`health.chronic`): depression, asthma, high blood pressure, and lenses.
 * Kept up, each costs its care each month at what the plan leaves; left
 * alone, depression weighs on morale and asthma doubles the emergencies. The
 * pharmacy fills the year's prescriptions at the counter, and the dentist and
 * the optician come at their rates, each plan paying what it covers of them.
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
  BENCHMARK, BENEFIT_STATE, CARE, CONNECTICUT_ENROLLMENT, CHARITY, CHRONIC, COBRA, DENTAL_PLANS, DENTAL_VISION, ENROLLMENT, INSULIN, MEDICAL_CPI, MEDICAL_DEBT, PHARMACY, PLANS, POVERTY_LINE, PUBLIC_COVER, byYear, medicalGrowth,
  type BenefitState, type PlanDesign,
} from '../content/safetynet';
import { earningsOf, homeOf, quartersBefore } from './earnings';
import { payFromCurrent } from './household';
import { personalityOf } from './personality';
import { clamp } from '../core/rng';
import { bmiOf } from './body';
import { ONSET, onsetYearly } from '../content/body';
import { fluByWeek, weekOfYear } from './seasons';

export const HEALTH_MONTH_KIND = 'health.month';
export const HEALTH_WEEK_KIND = 'health.week';
export const BILL_KIND = 'health.bill';

export type Cover = 'yale' | 'sag' | 'equity' | 'cobra' | 'medicaid' | 'essential' | 'marketplace';
export type DentalPlan = 'ca' | 'ny' | 'yale';
export type Condition = 'depression' | 'asthma' | 'hypertension' | 'diabetes' | 'arthritis';
export const CONDITION_LABEL: Record<Condition, string> = { depression: 'Depression', asthma: 'Asthma', hypertension: 'High Blood Pressure', diabetes: 'Diabetes', arthritis: 'Arthritis' };

export interface MedicalBill {
  id: string; at: Instant; what: string; amount: Money; dueAt: Instant; paid?: boolean;
  /** A hospital's bill, which its charity may take in, and the town it was billed in; and what an application for it came to. */
  hospital?: boolean;
  cityId?: string;
  aid?: 'free' | 'discount' | 'refused' | 'screened';
}

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
  /** An injury mending, or the last one (`systems/injury.ts`). */
  injury?: import('./injury').Injury;
  /** Down with the flu until, and excused from classes for it (`school.call_in_sick`). */
  fluUntil?: Instant;
  /** The frailty band the year's odds of the end were last drawn at (`systems/birthdays.ts`). */
  endBand?: number;
  /** A medical debt past a year and reported, once. */
  reported?: boolean;
  debtSince?: Instant;
  seq?: number;
  /** Conditions carried, and whether they're kept up; whether they wear lenses, and the year of their last glasses. */
  chronic?: Partial<Record<Condition, { treated: boolean; lapsed?: boolean; typeOne?: boolean }>>;
  /** A stand-alone dental plan: which, from and until, and this year's deductible and what it's paid. */
  dental?: { plan: DentalPlan; from: Instant; until?: Instant; deductible: Record<string, Money>; paid: Record<string, Money> };
  lenses?: boolean;
  lastGlasses?: number;
  drawn?: boolean;
  /** What's been paid toward a plan's brand-drug deductible this year, and its admission copays. */
  rxDeductible?: Record<string, Money>;
  stayCopays?: Record<string, Money>;
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
  return PLANS[planKey(person, at)!];
}

/** Which plan's tables apply: the union plan COBRA keeps, the state's marketplace, the Essential Plan's band. */
export function planKey(person: Person, at: Instant): string | undefined {
  const cover = coverOn(person, at);
  const h = person.health;
  if (!cover) return undefined;
  if (cover === 'cobra') return h!.cobra!.plan;
  if (cover === 'essential') return h!.program!.state === 'ct' ? 'covered-ct' : `essential-${h!.program!.band}`;
  if (cover === 'marketplace') return `marketplace-${h!.marketplace!.state}`;
  // Medi-Cal and HUSKY D ask no copays, where New York's Medicaid asks a dollar at the pharmacy.
  if (cover === 'medicaid' && h!.program!.state !== 'ny') return 'essential-low';
  return cover;
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
  // Covered Connecticut reads the year before's poverty line, as the marketplace does.
  if (state === 'ct' && income / povertyMonth(zonedParts(at, HOME).year - 1, into) <= PUBLIC_COVER.coveredCtShare) return { kind: 'essential', band: 'low' };
  return undefined;
}

/** What each state calls its programs. */
export const PROGRAM_NAMES: Readonly<Record<BenefitState, { medicaid: string; essential: string }>> = {
  ny: { medicaid: 'Medicaid', essential: 'the Essential Plan' },
  ca: { medicaid: 'Medi-Cal', essential: 'the Essential Plan' },
  ct: { medicaid: 'HUSKY D', essential: 'Covered Connecticut' },
};

/** Whether they may enroll now, in a program or the marketplace, and in which. */
export function mayEnroll(person: Person, at: Instant, into = 'USD'): { ok: boolean; why: string; program?: 'medicaid' | 'essential' } {
  const state = BENEFIT_STATE[homeOf(person)];
  if (!state) return { ok: false, why: 'SLATE has public cover and the marketplace in New York, Los Angeles and New Haven.' };
  const h = healthOf(person);
  if (active(h.program, at) || active(h.marketplace, at)) return { ok: false, why: 'You’re enrolled.' };
  const program = programFor(person, at, into);
  if (program) return { ok: true, why: `Last month’s income qualifies you for ${PROGRAM_NAMES[state][program.kind]}, at any time and with no premium.`, program: program.kind };
  const p = zonedParts(at, HOME);
  const window = state === 'ct' ? CONNECTICUT_ENROLLMENT : ENROLLMENT;
  const open = (p.month > window.openFrom[0] || (p.month === window.openFrom[0] && p.day >= window.openFrom[1]))
    || (p.month < window.openUntil[0] || (p.month === window.openUntil[0] && p.day <= window.openUntil[1]));
  if (open) return { ok: true, why: 'Open enrollment.' };
  if (h.lostAt !== undefined && at - h.lostAt <= ENROLLMENT.specialDays * MS_DAY) return { ok: true, why: `Within ${ENROLLMENT.specialDays} days of losing cover.` };
  return { ok: false, why: `Outside open enrollment, ${window.openFrom[1]} ${MONTH_NAMES[window.openFrom[0] - 1]} to ${window.openUntil[1]} ${MONTH_NAMES[window.openUntil[0] - 1]}, and not within ${ENROLLMENT.specialDays} days of losing cover.` };
}

/** The benchmark plan's premium a month, where they live, in a year. */
export const benchmarkFor = (state: BenefitState, year: number, into: string): Money => usd(byYear(BENCHMARK[state], year), into);

/** The conditions a person carries (`health.chronic`), drawn once, at a young adult's rates. */
export function drawChronic(sim: Simulation, person: Person): void {
  const h = healthOf(person);
  if (h.drawn) return;
  h.drawn = true;
  const rng = sim.rng('health.chronic', person.id, 'carried');
  h.chronic = {};
  for (const [condition, share] of Object.entries(CHRONIC.share) as [Condition, number][]) if (rng.next() < share) h.chronic[condition] = { treated: true };
  if (h.chronic.diabetes) h.chronic.diabetes.typeOne = rng.next() < CHRONIC.typeOne;
  h.lenses = rng.next() < DENTAL_VISION.lensShare;
}

/** The health plans' month and week for them, from the first of the next month and the next Monday. */
/**
 * Whether a person is in hospital at a moment. An admission is an excused
 * absence everywhere: a production recasts or covers, an agency reschedules,
 * and the school counts it as a sick day. Until 2026-09-27 each presence
 * check read a stay as walking away, and a stay drawn on a Monday morning
 * put a student in breach before they could call in sick.
 */
export function inHospital(person: Person, at: Instant): boolean {
  return (person.health?.inHospitalUntil ?? 0) > at;
}

export function armHealth(sim: Simulation, person: Person): void {
  healthOf(person);
  drawChronic(sim, person);
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

const renewMonths = (at: Instant, state?: BenefitState) => rateOn(state === 'ct' ? PUBLIC_COVER.renewMonthsCt : PUBLIC_COVER.renewMonths, monthKey(at) + '-01');
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A month's start. At a quarter's, SAG-AFTRA's plan reads the base period
 * that ended three months before. Each month, Equity-League's reads the last
 * twelve months' weeks; a union plan just lost is offered by COBRA; a
 * program comes up for renewal; the premiums fall due; and what covers them
 * is settled, with a month uncovered in California counted.
 */
/**
 * A condition that begins in the month: each not yet carried, at its yearly
 * onset for their age, a twelfth of it, weighed by their weight's relative
 * risk (`ONSET` in `content/body.ts`). Until 2026-09-28 a life carried
 * only the conditions it was drawn with at twenty-seven, whatever it ate or
 * however long it ran.
 */
export function onsetMonth(sim: Simulation, person: Person, at: Instant): Condition | undefined {
  const h = healthOf(person);
  if (!h.drawn) return undefined;
  const age = (at - person.birthInstant) / (365.2425 * MS_DAY);
  const bmi = person.body ? bmiOf(person.body) : 22.5;
  const rng = sim.rng('health.onset', person.id, String(at));
  for (const condition of Object.keys(ONSET.yearly) as (keyof typeof ONSET.yearly)[]) {
    if (h.chronic?.[condition]) continue;
    const chance = onsetYearly(condition, age, bmi) / 12;
    if (rng.next() >= chance) continue;
    (h.chronic ??= {})[condition] = { treated: true };
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: `Diagnosed: ${CONDITION_LABEL[condition]}`, body: `A doctor found it this month. Its care begins now, at what your plan leaves; Let It Go on Papers stops it.`, importance: 75, route: '/workspace/papers' });
    return condition;
  }
  return undefined;
}

export function healthMonth(sim: Simulation, person: Person, at: Instant): void {
  const h = healthOf(person);
  onsetMonth(sim, person, at);
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
    // Unpaid, the plan ends, as COBRA and the marketplace do; until 2026-09-27 it kept covering.
    if (active(h.sag, at) && !payFromCurrent(sim, person, usd(rateOn(UNION_HEALTH.sagPremium, `${p.year}-${String(p.month).padStart(2, '0')}-01`), cur), 'SAG-AFTRA Health Plan premium', 'health')) h.sag!.until = at;
  }
  const yearAgo = at - 365 * MS_DAY;
  const weeks = record.equityWeeks.filter((key) => instantFromZoned({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), day: Number(key.slice(8, 10)), hour: 12 }, HOME) >= yearAgo).length;
  if (weeks >= UNION_HEALTH.equityWeeks && !(h.equity && h.equity.until > firstOf(p.year, p.month + 2))) {
    const from = firstOf(p.year, p.month + 2);
    h.equity = { from: h.equity && h.equity.until >= from ? h.equity.from : from, until: firstOf(p.year, p.month + 2 + UNION_HEALTH.equityMonths) };
  }
  // Equity-League's $300 a quarter, a third of it each month covered.
  if (active(h.equity, at) && !payFromCurrent(sim, person, usd(Math.round(UNION_HEALTH.equityPremium / 3), cur), 'Equity-League Health premium', 'health')) h.equity!.until = at;
  // A union plan just ended: COBRA may keep it.
  const union = active(h.sag, at) ? 'sag' : active(h.equity, at) ? 'equity' : undefined;
  if (h.lastUnion && !union && !active(h.cobra, at)) {
    h.cobraOffer = { plan: h.lastUnion, lostAt: at, until: at + COBRA.electDays * MS_DAY };
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'You Can Keep Your Plan By COBRA', body: `Your ${PLANS[h.lastUnion]!.label} ended. Elect COBRA by ${formatDate(h.cobraOffer.until, HOME)} and it covers you from the day it ended, for up to ${COBRA.months} months, at ${formatMoney(usd(COBRA.premium[h.lastUnion], cur), cur)} a month.`, importance: 80, route: '/workspace/papers' });
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
        prog.renewAt = firstOf(p.year, p.month + renewMonths(at, prog.state));
      } else {
        prog.until = at;
        if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'Your Public Cover Ended At Renewal', body: !worksEnough ? `Medicaid now asks for ${PUBLIC_COVER.workHours} hours’ work or ${formatMoney(usd(PUBLIC_COVER.workEarnings, cur), cur)} of earnings a month, and last month had neither.` : 'Last month’s income is over what it allows.', importance: 80, route: '/workspace/papers' });
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
  // A dental plan of their own: its month's premium, and it ends with what it's bought beside.
  const dental = h.dental;
  if (dental && active(dental, at)) {
    if (dentalPlanFor(person, at) !== dental.plan) dental.until = at;
    else if (!DENTAL_PLANS[dental.plan].yearly && !payFromCurrent(sim, person, usd(DENTAL_PLANS[dental.plan].premium, cur), `${DENTAL_PLANS[dental.plan].label} premium`, 'health')) dental.until = at;
  }
  keepUp(sim, person, at);
  const cover = coverOn(person, at);
  if (!cover && inCalifornia(home)) h.uncoveredInCalifornia[p.year] = (h.uncoveredInCalifornia[p.year] ?? 0) + 1;
  if (h.covered && !cover) {
    h.lostAt = at;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'Your Health Cover Ended', body: `Nothing covers you from ${formatDate(at, HOME)}. You have ${ENROLLMENT.specialDays} days to enroll in the marketplace${inCalifornia(home) ? ', and every month uncovered in California costs its penalty on your return' : ''}.`, importance: 80, route: '/workspace/papers' });
  }
  h.covered = cover !== undefined;
  // A medical debt a year past due, $500 or more, goes on the record, outside the states that bar it.
  const debt = medicalDebtOf(sim, person);
  if (debt && -debt.balance >= usd(MEDICAL_DEBT.reportAt, cur) && h.debtSince !== undefined && at - h.debtSince >= MEDICAL_DEBT.reportAfterDays * MS_DAY
    && !MEDICAL_DEBT.barredIn.includes(CITIES.get(home)?.parentId ?? '') && !h.reported && person.credit) {
    h.reported = true;
    person.credit.score = Math.max(300, person.credit.score - MEDICAL_DEBT.recordHit);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'A Medical Debt Is On Your Record', body: 'Unpaid a year and over $500, it’s reported now.', importance: 80, route: '/workspace/papers' });
  }
}

/**
 * A month's care for the conditions kept up: therapy twice and a generic for
 * depression, a brand inhaler and the odd visit for asthma, a generic for high
 * blood pressure; for diabetes insulin, or a generic for type 2, and a visit a
 * quarter; for arthritis a generic and the odd visit; all at what the plan
 * leaves, paid then. What the bank can't
 * cover this month goes without, and the condition is left alone till next.
 */
export function keepUp(sim: Simulation, person: Person, at: Instant): Money {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  let total = 0;
  for (const [condition, state] of Object.entries(h.chronic ?? {}) as [Condition, { treated: boolean; lapsed?: boolean; typeOne?: boolean }][]) {
    if (!state.treated) continue;
    let cost = 0;
    if (condition === 'depression') {
      const plan = planOf(person, at);
      const session = plan ? usd(plan.visit, cur) : usd(grown(CITIES.get(homeOf(person))?.parentId === 'us-ny' ? CHRONIC.therapy['us-ny'] : CHRONIC.therapy.other, 'therapy', at), cur);
      cost += CHRONIC.therapyPerMonth * session + rxShareOf(person, false, at, cur);
    } else if (condition === 'asthma') {
      cost += rxShareOf(person, true, at, cur);
      if (sim.rng('health.chronic', person.id, `asthma-${at}`).next() < 2 / 12) cost += shareOf(person, 'visit', at, cur);
    } else if (condition === 'diabetes') {
      cost += state.typeOne ? insulinShareOf(person, at, cur) + monitorShareOf(person, at, cur) : rxShareOf(person, false, at, cur);
      if (zonedParts(at, HOME).month % 3 === 1) cost += shareOf(person, 'visit', at, cur);
    } else if (condition === 'arthritis') {
      cost += rxShareOf(person, false, at, cur);
      if (sim.rng('health.chronic', person.id, `arthritis-${at}`).next() < 2 / 12) cost += shareOf(person, 'visit', at, cur);
    } else cost += rxShareOf(person, false, at, cur);
    state.lapsed = cost > 0 && !payFromCurrent(sim, person, cost, `Care for ${CONDITION_LABEL[condition].toLowerCase()}`, 'health');
    if (!state.lapsed) total += cost;
  }
  return total;
}

/** Their medical debt, if any: what bills they couldn't pay. */
export function medicalDebtOf(sim: Simulation, person: Person) {
  return Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.category === 'medical' && !a.closedAt);
}

export type Care = 'visit' | 'urgent' | 'emergency' | 'stay' | 'rx-generic' | 'rx-brand' | 'cleaning' | 'filling' | 'exam' | 'glasses';
const MEDICAL: readonly Care[] = ['visit', 'urgent', 'emergency', 'stay'];

/** The last twelve months' income against the year's poverty line, which a hospital's charity reads. */
export function incomeRatio(person: Person, at: Instant, into = 'USD'): number {
  const months = earningsOf(person).months;
  const since = at - 365 * MS_DAY;
  const income = Object.entries(months).filter(([k]) => firstOf(Number(k.slice(0, 4)), Number(k.slice(5, 7))) >= since).reduce((s, [, v]) => s + v, 0);
  return income / usd(byYear(POVERTY_LINE, zonedParts(at, HOME).year), into);
}

/**
 * What a piece of care leaves them to pay. Covered: the plan's copay, or for
 * a stay the deductible still owed and the plan's share of the rest, to what
 * remains of the year's out-of-pocket most. Uninsured: the price the
 * uninsured are billed, less a hospital's charity for an emergency or a stay,
 * by the last year's income against the poverty line.
 */
export function shareOf(person: Person, care: Care, at: Instant, into = 'USD'): Money {
  if (care === 'rx-generic' || care === 'rx-brand') return rxShareOf(person, care === 'rx-brand', at, into);
  if (!MEDICAL.includes(care)) return teethAndEyesShareOf(person, care as 'cleaning' | 'filling' | 'exam' | 'glasses', at, into);
  const price = usd(grown(CARE.price[care as 'visit' | 'urgent' | 'emergency' | 'stay'], care as 'visit', at), into);
  const year = zonedParts(at, HOME).year;
  const plan = planOf(person, at);
  const h = healthOf(person);
  const hospital = care === 'emergency' || care === 'stay';
  const state = CITIES.get(homeOf(person))?.parentId;
  // The last year's income against the poverty line, which a hospital's charity reads.
  const ratio = () => incomeRatio(person, at, into);
  // Connecticut's hospital charity, for a patient paying for themselves, as a hospital screens one.
  const ct = CHARITY.connecticut;
  const helped = (owed: Money): Money => {
    if (!hospital || state !== 'us-ct') return owed;
    const r = ratio();
    return r <= ct.freeTo ? 0 : r <= ct.discountTo ? Math.round(owed * (1 - ct.discount)) : owed;
  };
  if (!plan) {
    if (!hospital) return Math.round(price * CARE.uninsuredMarkup);
    if (state === 'us-ny' && ratio() < CHARITY.newYorkFreeBelow) return 0;
    if (state === 'us-ca' && ratio() < CHARITY.californiaDiscountBelow) return price;
    return helped(Math.round(price * CARE.uninsuredMarkup));
  }
  let share: number;
  if (care === 'stay' && plan.stayCopay !== undefined) {
    // What's left of the deductible, then an admission's copay, to the plan's cap on them in a year.
    const toDeductible = Math.min(price, Math.max(0, usd(plan.deductible, into) - (h.deductible[year] ?? 0)));
    h.deductible[year] = (h.deductible[year] ?? 0) + toDeductible;
    h.stayCopays ??= {};
    const left = plan.stayCopayCap === undefined ? Number.POSITIVE_INFINITY : Math.max(0, usd(plan.stayCopayCap, into) - (h.stayCopays[year] ?? 0));
    const copay = Math.min(usd(plan.stayCopay, into), left);
    h.stayCopays[year] = (h.stayCopays[year] ?? 0) + copay;
    share = toDeductible + copay;
  } else if (care === 'stay') {
    const left = Math.max(0, usd(plan.deductible, into) - (h.deductible[year] ?? 0));
    const toDeductible = Math.min(price, left);
    share = toDeductible + Math.round((price - toDeductible) * plan.stayShare);
    h.deductible[year] = (h.deductible[year] ?? 0) + toDeductible;
  } else share = usd(plan[care as 'visit' | 'urgent' | 'emergency'], into);
  const cap = usd(plan.outOfPocket, into);
  return Math.max(0, Math.min(share, cap - (h.spent[year] ?? 0)));
}

/** A prescription at the counter: the plan's copay, the greater of its dollar and its share, after a brand's deductible; uninsured, the cash price. */
export function rxShareOf(person: Person, brand: boolean, at: Instant, into = 'USD', cash?: Money): Money {
  const price = cash ?? usd(grown(brand ? PHARMACY.price.brand : PHARMACY.price.generic, 'rx', at), into);
  const key = planKey(person, at);
  const plan = key ? PHARMACY.plans[key] : undefined;
  if (!plan) return price;
  const year = zonedParts(at, HOME).year;
  const h = healthOf(person);
  const [fixed, share] = brand ? plan.brand : plan.generic;
  const copay = Math.max(usd(fixed, into), Math.round(share * price));
  let owed = Math.min(price, copay);
  // A brand pays what's left of the year's drug deductible first, and the copay on top.
  if (brand && plan.brandDeductible > 0) {
    h.rxDeductible ??= {};
    const left = Math.max(0, usd(plan.brandDeductible, into) - (h.rxDeductible[year] ?? 0));
    const toDeductible = Math.min(price, left);
    h.rxDeductible[year] = (h.rxDeductible[year] ?? 0) + toDeductible;
    owed = Math.min(price, toDeductible + copay);
  }
  const design = planOf(person, at);
  // A plan with no most in a year (Medicaid, the Essential Plan) charges its copay every time; until 2026-09-27 it charged nothing, and New York Medicaid's $1 was never taken.
  return design && design.outOfPocket > 0 ? Math.max(0, Math.min(owed, usd(design.outOfPocket, into) - (h.spent[year] ?? 0))) : owed;
}

/**
 * Insulin a month: nothing on a plan New York regulates from 2025; otherwise
 * the plan's brand copay, or the price uninsured, and never more than the
 * makers' $35.
 */
export function insulinShareOf(person: Person, at: Instant, into = 'USD'): Money {
  const key = planKey(person, at);
  if (key && INSULIN.newYorkPlans.includes(key) && dayKeyOf(at) >= INSULIN.newYorkFrom) return 0;
  const cap = key && INSULIN.connecticutPlans.includes(key) && dayKeyOf(at) >= INSULIN.connecticutFrom ? INSULIN.connecticutCap : INSULIN.cashCap;
  return Math.min(rxShareOf(person, true, at, into), usd(cap, into));
}

/** A type 1 diabetic's monitor a month: the plan's brand copay on its price, or the maker's program, whichever is less. */
export function monitorShareOf(person: Person, at: Instant, into = 'USD'): Money {
  const m = INSULIN.monitor;
  return Math.min(rxShareOf(person, true, at, into, usd(m.price, into)), usd(m.program, into));
}

/** A price as it stood in the year it's paid, grown from the year it was measured. */
export function grown(cents: Money, item: keyof typeof MEDICAL_CPI.base, at: Instant): Money {
  const [year, series] = MEDICAL_CPI.base[item];
  return Math.round(cents * medicalGrowth(year, zonedParts(at, HOME).year, series));
}

const dayKeyOf = (at: Instant) => { const p = zonedParts(at, HOME); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** The stand-alone dental plan they may buy: Yale's while at school, Covered California's beside its plan, New York's where they live. */
export function dentalPlanFor(person: Person, at: Instant): DentalPlan | undefined {
  const cover = coverOn(person, at);
  if (cover === 'yale') return 'yale';
  const key = planKey(person, at);
  if (key === 'marketplace-ca') return 'ca';
  if (BENEFIT_STATE[homeOf(person)] === 'ny') return 'ny';
  return undefined;
}

/** The dentist and the optician: what the plan pays of each, where it has them, or a stand-alone dental plan; otherwise the price. */
export function teethAndEyesShareOf(person: Person, care: 'cleaning' | 'filling' | 'exam' | 'glasses', at: Instant, into = 'USD'): Money {
  const price = usd(grown(DENTAL_VISION.price[care], care === 'cleaning' || care === 'filling' ? 'dental' : 'vision', at), into);
  const key = planKey(person, at);
  const plan = key ? DENTAL_VISION.plans[key] : undefined;
  const dental = person.health?.dental;
  // A dental plan of their own pays where the health plan pays nothing.
  if ((care === 'cleaning' || care === 'filling') && dental && active(dental, at) && !(plan && plan[care] > 0)) {
    const d = DENTAL_PLANS[dental.plan];
    const year = zonedParts(at, HOME).year;
    if (care === 'cleaning') return Math.round(price * (1 - d.preventive));
    const toDeductible = Math.min(price, Math.max(0, usd(d.deductible, into) - (dental.deductible[year] ?? 0)));
    dental.deductible[year] = (dental.deductible[year] ?? 0) + toDeductible;
    const pays = Math.min(Math.round((price - toDeductible) * d.basic), Math.max(0, usd(d.max, into) - (dental.paid[year] ?? 0)));
    dental.paid[year] = (dental.paid[year] ?? 0) + pays;
    return price - pays;
  }
  if (!plan) return price;
  if (care === 'exam') return plan.exam === undefined ? price : Math.min(price, usd(plan.exam, into));
  return Math.round(price * (1 - plan[care]));
}

/**
 * How much likelier than a rested, easy body this one is to catch the flu:
 * a sleep debt and stress each raise it (`CARE.catching`). Until 2026-09-27
 * the chance was the same whatever state the body was in.
 */
export function catching(person: Person): number {
  const c = CARE.catching;
  const w = person.wellbeing;
  const debt = clamp((w.sleepDebt - c.debtFrom) / (c.debtTo - c.debtFrom), 0, 1);
  return (1 + debt * (c.sleepMost - 1)) * (1 + (clamp(w.stress, 0, 100) / 100) * (c.stressMost - 1));
}

/** A week's health (`health.illness`): the flu in its season, a doctor's visit, an emergency, a stay. */
export function illnessWeek(sim: Simulation, person: Person, at: Instant): { care: Care; what: string; flu?: boolean }[] {
  const rng = sim.rng('health.illness', person.id, String(at));
  const p = zonedParts(at, HOME);
  const out: { care: Care; what: string; flu?: boolean }[] = [];
  const weekly = (perYear: number) => 1 - Math.exp(-perYear / 52);
  if (rng.next() < weekly(CARE.perYear.stay)) out.push({ care: 'stay', what: 'A stay in hospital' });
  // Asthma left alone doubles the emergencies.
  const asthma = person.health?.chronic?.asthma;
  const diabetes = person.health?.chronic?.diabetes;
  // Type 1 diabetes without insulin brings the emergency room four times as often.
  const emergencies = CARE.perYear.emergency * (asthma && (!asthma.treated || asthma.lapsed) ? CHRONIC.untreated.asthmaEmergencies : 1)
    * (diabetes?.typeOne && (!diabetes.treated || diabetes.lapsed) ? CHRONIC.untreated.diabetesEmergencies : 1);
  if (rng.next() < weekly(emergencies)) out.push({ care: 'emergency', what: 'The emergency room' });
  if (rng.next() < weekly(CARE.perYear.visit)) out.push({ care: 'visit', what: 'A doctor’s visit' });
  // The week's share of a year's flu where they are, by the town's cold or wet weeks (`systems/seasons.ts`).
  const here = CITIES.get(person.currentLocationId) ? person.currentLocationId : homeOf(person);
  const local = zonedParts(at, CITIES.require(here).timeZone);
  const share = fluByWeek(here)[weekOfYear(local.month, local.day)]!;
  if (rng.next() < (1 - (1 - CARE.flu) ** share) * catching(person)) {
    out.push(rng.next() < CARE.fluSeesClinician ? { care: 'urgent', what: 'The flu, at urgent care', flu: true } : { care: 'visit', what: 'The flu', flu: true });
  }
  // The pharmacy, the dentist, the optician.
  if (rng.next() < weekly(PHARMACY.perYear)) out.push(rng.next() < PHARMACY.generic ? { care: 'rx-generic', what: 'A prescription, a generic' } : { care: 'rx-brand', what: 'A prescription, a brand' });
  if (rng.next() < 1 - (1 - DENTAL_VISION.dentistShare) ** (1 / 52)) {
    out.push({ care: 'cleaning', what: 'The dentist, a cleaning' });
    if (rng.next() < DENTAL_VISION.fillingShare) out.push({ care: 'filling', what: 'The dentist, a filling' });
  }
  if (person.health?.lenses && rng.next() < 1 - (1 - DENTAL_VISION.examShare) ** (1 / 52)) {
    out.push({ care: 'exam', what: 'An eye exam' });
    if (p.year - (person.health.lastGlasses ?? 0) >= DENTAL_VISION.glassesEvery) out.push({ care: 'glasses', what: 'New glasses' });
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
    // A resilient body loses less to it.
    const takes = personalityOf(person, 'illnessToll');
    w.condition = Math.max(0, w.condition - toll.condition * takes);
    w.energy = Math.max(0, w.energy - toll.energy * takes);
  }
  if (event.care === 'stay') h.inHospitalUntil = at + CARE.stayDays * MS_DAY;
  if (event.flu) h.fluUntil = at + CARE.fluDays * MS_DAY;
  // A flu that isn't seen costs nothing.
  if (event.flu && event.care === 'visit') return undefined;
  const amount = shareOf(person, event.care, at, cur);
  const year = zonedParts(at, HOME).year;
  if (event.care === 'glasses') h.lastGlasses = year;
  if (planOf(person, at) && (MEDICAL.includes(event.care) || event.care.startsWith('rx'))) h.spent[year] = (h.spent[year] ?? 0) + amount;
  // A prescription is paid at the counter, or not filled.
  if (event.care.startsWith('rx')) {
    if (amount > 0 && !payFromCurrent(sim, person, amount, `Pharmacy: ${event.what.toLowerCase()}`, 'health')) return undefined;
    h.seq = (h.seq ?? 0) + 1;
    const paid: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount, dueAt: at, paid: true };
    h.bills.push(paid);
    h.bills = h.bills.slice(-40);
    return undefined;
  }
  if (!MEDICAL.includes(event.care)) {
    if (amount <= 0) return undefined;
    h.seq = (h.seq ?? 0) + 1;
    const bill: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY };
    h.bills.push(bill);
    h.bills = h.bills.slice(-40);
    sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Bill Due: ${event.what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
    return bill;
  }
  if (person.id === sim.universe.playerId && MEDICAL.includes(event.care)) {
    sim.notify({ category: 'health', title: event.care === 'stay' ? 'In Hospital' : event.flu ? 'You Have The Flu' : event.care === 'emergency' ? 'The Emergency Room' : 'A Doctor’s Visit', body: `${event.what}${event.care === 'stay' ? `, ${CARE.stayDays} days` : ''}. ${amount > 0 ? `Your share is ${formatMoney(amount, cur)}, due in ${MEDICAL_DEBT.dueDays} days.` : 'Nothing to pay.'}`, importance: event.care === 'stay' ? 85 : 60, route: '/workspace/papers' });
  }
  if (amount <= 0) return undefined;
  h.seq = (h.seq ?? 0) + 1;
  const hospital = event.care === 'emergency' || event.care === 'stay';
  // An uninsured Connecticut patient's was screened for the charity at billing (`shareOf`).
  const screened = hospital && !planOf(person, at) && CITIES.get(homeOf(person))?.parentId === 'us-ct';
  const bill: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY, ...(hospital ? { hospital: true, cityId: homeOf(person) } : {}), ...(screened ? { aid: 'screened' as const } : {}) };
  h.bills.push(bill);
  h.bills = h.bills.slice(-40);
  sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Medical Bill Due: ${event.what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
  return bill;
}

/**
 * Why a hospital bill can't be put in for Yale New Haven's financial
 * assistance, or nothing where it can: a Connecticut hospital's, not yet
 * due or applied for. Its policy helps an insured patient with what
 * insurance leaves as it helps the uninsured, on the same incomes, but only
 * on an application (`CHARITY.connecticut`); the uninsured's is applied
 * at billing.
 */
export function aidRefusal(bill: MedicalBill, at: Instant): string | undefined {
  if (!bill.hospital || CITIES.get(bill.cityId ?? '')?.parentId !== 'us-ct') return 'Only a Connecticut hospital’s bill.';
  if (bill.paid || at >= bill.dueAt) return 'It’s settled or past due.';
  if (bill.aid === 'screened') return 'The hospital’s charity is off it already.';
  if (bill.aid) return 'You’ve applied for it.';
  return undefined;
}

/** A bill for care that isn't one of the kinds `careFor` draws (an injury's): due in 30 days, a debt unpaid. */
export function billCare(sim: Simulation, person: Person, what: string, amount: Money, at: Instant): MedicalBill {
  const h = healthOf(person);
  h.seq = (h.seq ?? 0) + 1;
  const bill: MedicalBill = { id: `m${h.seq}`, at, what, amount, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY };
  h.bills.push(bill);
  h.bills = h.bills.slice(-40);
  sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Medical Bill Due: ${what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
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
    // Depression left alone weighs on morale.
    const depression = healthOf(person).chronic?.depression;
    if (depression && (!depression.treated || depression.lapsed)) person.wellbeing.morale = Math.max(0, person.wellbeing.morale - CHRONIC.untreated.moraleAWeek);
    // Diabetes left alone wears the body down; arthritis tires it.
    const { diabetes, arthritis } = healthOf(person).chronic ?? {};
    if (diabetes && (!diabetes.treated || diabetes.lapsed)) person.wellbeing.condition = Math.max(0, person.wellbeing.condition - CHRONIC.untreated.diabetesConditionAWeek);
    if (arthritis && (!arthritis.treated || arthritis.lapsed)) person.wellbeing.energy = Math.max(0, person.wellbeing.energy - CHRONIC.untreated.arthritisEnergyAWeek);
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
    if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'A Medical Bill Went Unpaid', body: `${formatMoney(bill.amount, saveCurrency(s.universe))} for ${bill.what.toLowerCase()} is a medical debt now.`, importance: 75, route: '/workspace/papers' });
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
      h.program = { kind: may.program, state, from, band, renewAt: firstOf(p.year, p.month + 1 + renewMonths(s.now, state)) };
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

  sim.onCommand<{ condition: Condition; on: boolean }, { treated: boolean }>('health.treat', (p, { sim: s }) => {
    const state = healthOf(s.player).chronic?.[p.condition];
    if (!state) throw new CommandError('You don’t have that.');
    state.treated = p.on === true;
    state.lapsed = false;
    return { treated: state.treated };
  });

  sim.onCommand<{ on: boolean }, { plan?: DentalPlan; until?: Instant }>('health.dental', (p, { sim: s }) => {
    const person = s.player;
    const h = healthOf(person);
    const cur = saveCurrency(s.universe);
    const now = h.dental && active(h.dental, s.now) ? h.dental : undefined;
    if (p.on !== true) {
      if (!now) throw new CommandError('You have no dental plan.');
      if (DENTAL_PLANS[now.plan].yearly) throw new CommandError('Yale’s dental plan can’t be canceled once paid.');
      const d = zonedParts(s.now, HOME);
      now.until = firstOf(d.year, d.month + 1);
      return { until: now.until };
    }
    if (now) throw new CommandError('You have a dental plan.');
    const plan = dentalPlanFor(person, s.now);
    if (!plan) throw new CommandError(BENEFIT_STATE[homeOf(person)] === 'ca' ? 'Covered California sells dental only beside its own health plan.' : 'SLATE sells a dental plan of your own in New York, beside a Covered California plan, and at Yale.');
    const d = DENTAL_PLANS[plan];
    const from = s.now;
    let until: Instant | undefined;
    if (d.yearly) {
      // Yale's runs to the next 30 September, paid for the year at once.
      const t = zonedParts(s.now, HOME);
      until = firstOf(t.month >= 10 ? t.year + 1 : t.year, 10);
      if (!payFromCurrent(s, person, usd(d.premium, cur), `${d.label}, the year`, 'health')) throw new CommandError(`The year is ${formatMoney(usd(d.premium, cur), cur)}, which the bank can’t cover.`);
    }
    h.dental = { plan, from, ...(until ? { until } : {}), deductible: {}, paid: {} };
    armHealth(s, person);
    return { plan, ...(until ? { until } : {}) };
  });

  sim.onCommand<{ billId: string }, { aid: 'free' | 'discount' | 'refused'; amount: Money }>('health.apply_aid', (p, { sim: s }) => {
    const person = s.player;
    const bill = healthOf(person).bills.find((b) => b.id === p.billId);
    if (!bill) throw new CommandError('There’s no such bill.');
    const no = aidRefusal(bill, s.now);
    if (no) throw new CommandError(no);
    const r = incomeRatio(person, s.now, saveCurrency(s.universe));
    const ct = CHARITY.connecticut;
    bill.aid = r <= ct.freeTo ? 'free' : r <= ct.discountTo ? 'discount' : 'refused';
    if (bill.aid === 'free') { bill.amount = 0; bill.paid = true; }
    if (bill.aid === 'discount') bill.amount = Math.round(bill.amount * (1 - ct.discount));
    return { aid: bill.aid, amount: bill.amount };
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
