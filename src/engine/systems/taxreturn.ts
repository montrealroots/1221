/**
 * SLATE — the income tax return (`content/safetynet.ts` `RETURN`).
 *
 * Each February a year's return is ready for anybody the year left owing or
 * owed: its income (work-study, a scholarship's taxable part, the banks'
 * interest, unemployment, a pension), and the net investment income tax on
 * the interest over its threshold; the tax on it where they last lived, with
 * California leaving unemployment out. Acting wages with residuals, the
 * performing artist deduction and payroll tax on the wages, and the work
 * done abroad, are still on it and read nought: only the career paid any,
 * and it went in the scope reset of 2026-10-09. A home's rent and gains and
 * its itemized interest and taxes were on it too, from 2026-09-28, until the
 * connected world of that day took them off with the homes. The premium tax
 * credit on the marketplace
 * months; California's penalty on the months without cover; and against it
 * all, what was withheld. Filed, a balance is paid from the bank, or owed
 * until it is; a refund arrives 21 days on. Filed after 15 April's deadline
 * with a balance, the late penalties are added. Until 2026-09-27 what was
 * withheld from a paycheck was kept by nothing.
 *
 * A balance left owing after filing grows by the IRS's interest, 7% a year
 * compounded daily from the due date, and by the half-point a month for
 * paying late to a quarter of it; and it's collected as the IRS collects: its
 * reminders about five weeks apart (CP501, CP503, the CP504 notice of intent
 * to levy), its final notice (LT11) with 30 days to pay, and then a levy on
 * the bank accounts, again each quarter while anything is owed (`COLLECTION`).
 * Until 2026-09-28 a balance owed was never collected: played lives left
 * fourteen years of returns unpaid.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { computeAnnualTax, INCOME_TAX_RULES } from '../content/tax';
import { f1Of } from './permission';
import { residenceIn } from './residence';
import { hasSsn, SSN } from './taxid';

/** The federal standard deduction in the tax table, which a nonresident alien doesn't take (`figuresFor`). */
const US_STANDARD_DEDUCTION = INCOME_TAX_RULES.find((r) => r.jurisdictionCode === 'US')!.standardDeduction;
import { CITIES } from '../content/geography';
import { ABROAD, CALIFORNIA_MANDATE, CONNECTICUT, RECEIPTS, STATE_DEDUCTIONS, POVERTY_LINE, PREMIUM_CREDIT, ENHANCED_CREDIT, PUBLIC_COVER, RETURN, STATE_RETURN, byYear } from '../content/safetynet';
import { earningsOf, stateOf, yearOf } from './earnings';
import { drawFromBank, expenseFor, payFromBank } from './spending';
import { personalityOf } from './personality';
import { citizenOf } from './documents';
import { payeeAccount } from './cash';
import { reconsiderState, scheduleStateNonFiler, stateLateAt, stateNonFilerStep, STATE_NONFILER_KIND, STATE_NOTICE_KIND, accrueState, applyStatePayment, federalOffsetToState, fileState, owedToStates, payStateRefund, rulesOf, stateDuesOf, stateName, stateNextNotice, stateOwedOn, statePlanNewBalance, type StateDue } from './statetax';
import { YALE_DRAMA } from '../content/school';

export const TAX_SEASON_KIND = 'tax.season';
export const TAX_NOTICE_KIND = 'tax.notice';
export const TAX_SFR_KIND = 'tax.substitute';

/**
 * A return never filed that owes: the IRS files one for them, a substitute
 * for return, from what employers and banks reported (the CP2566 notice), and
 * it's theirs to replace with their own until the Notice of Deficiency's 90
 * days run out; then it's assessed, with the penalty for filing late and the
 * interest from the due date, and collected as any balance is. SLATE's
 * estimates: the year after the due date it comes, the 30 days to answer the
 * CP2566 before the 90 of the notice, and the figures SLATE's own return
 * reaches, the IRS's taking only the standard deduction. Until 2026-09-28 a
 * return never filed was never asked for: a careless life filed none in 35
 * years and nothing came of it.
 */
export const SUBSTITUTE = {
  afterDays: 365,
  answerDays: 30 + 90,
  source: 'https://www.irs.gov/individuals/understanding-your-cp2566-notice',
} as const;

/**
 * The IRS's interest and collection on a balance owed: 7% a year for
 * individuals' underpayments, compounded daily (the rate for the fourth
 * quarter of 2026, held there); reminders about five weeks apart, the final
 * notice's 30 days, and a levy on the bank accounts after it, again each
 * quarter while anything is owed (SLATE's estimate of how often; the IRS
 * levies until it's paid). A bank holds a levied account 21 days before it
 * pays the IRS; SLATE takes it on the day.
 */
export const COLLECTION = {
  interest: 0.07,
  noticeWeeks: 5,
  finalDays: 30,
  againDays: 91,
  notices: [
    { code: 'CP501', title: 'A Reminder From The IRS', words: 'you still owe it, with the interest and penalty since.' },
    { code: 'CP503', title: 'A Second Reminder From The IRS', words: 'it has not heard from you, and expects it paid.' },
    { code: 'CP504', title: 'The IRS Intends To Levy', words: 'it may take a state refund and certain federal payments without further notice.' },
    { code: 'LT11', title: 'Final Notice Of Intent To Levy', words: 'in 30 days it takes what you owe from your bank accounts.' },
  ],
  source: 'https://www.irs.gov/newsroom/interest-rates-remain-the-same-for-the-fourth-quarter-of-2026; https://www.irsproblemsolve.com/2026/03/24/cp14-cp501-cp503-cp504-lt11/',
} as const;

/**
 * What's owed on a return, in its three parts (from 2026-10-10): the unpaid tax, the penalties, and the interest. Until
 * then one sum was kept, and a payment could only be the whole of it. A save from before holds the sum: its tax is the
 * balance the penalty was a share of (`base`), and the rest is taken as interest.
 */
export interface OwedParts { tax: Money; penalty: Money; interest: Money }

export function partsOf(r: TaxReturn): OwedParts {
  if (r.parts) return r.parts;
  const owed = r.owed ?? 0;
  const tax = Math.min(owed, r.base ?? owed);
  return { tax, penalty: 0, interest: owed - tax };
}

/**
 * The parts at a moment: interest at the IRS's rate, compounded daily, on all that's owed since it was last brought up to
 * date; the failure-to-pay penalty, 0.5% a month or part since filing to 25%, on the tax still unpaid, so a part payment
 * lowers what the next months charge (IRC 6651(a)(2)).
 */
export function partsOn(r: TaxReturn, at: Instant, exact = false): OwedParts {
  const p = partsOf(r);
  if (!r.owed) return { tax: 0, penalty: 0, interest: 0 };
  // From the due date at the earliest (IRC 6601(a)): a return filed in February with a balance owes no interest on it
  // until 15 April. Until the integration pass of 2026-10-10 it ran from filing.
  const from = Math.max(r.accruedAt ?? r.filedAt ?? at, r.due);
  const days = Math.max(0, (at - from) / MS_DAY);
  const interest = p.interest + (p.tax + p.penalty + p.interest) * ((1 + COLLECTION.interest / 365) ** days - 1);
  const rate = payLateRateAt(r, at);
  const penalty = p.penalty + Math.max(0, rate - (r.payLateRate ?? 0)) * p.tax;
  if (exact) return { tax: p.tax, penalty, interest };
  // Rounded so the parts add to the whole rounded once: the cent left over is the interest's.
  const whole = Math.round(p.tax + penalty + interest);
  return { tax: p.tax, penalty: Math.round(penalty), interest: whole - p.tax - Math.round(penalty) };
}

const monthsBetween = (a: Instant, b: Instant) => Math.ceil(Math.max(0, b - a) / (30.4375 * MS_DAY));

/**
 * The failure-to-pay penalty's rate charged by a moment: half a percent a month or part since filing, to a quarter;
 * a quarter percent for the months a payment plan was in force, where the return was filed on time (IRC 6651(h), from
 * 2026-10-10: `reducedFrom`, `reducedTo`).
 */
export function payLateRateAt(r: TaxReturn, at: Instant): number {
  // From the due date at the earliest (IRC 6651(a)(2)); from filing for a return filed late, its months before filing
  // being in the penalty assessed with it (`latePenalty`). Until the integration pass of 2026-10-10 an early return's ran
  // from filing.
  const filed = Math.max(r.filedAt ?? at, r.due);
  let months = RETURN.payLateMonthly * monthsBetween(filed, at);
  if (r.reducedFrom !== undefined && at > r.reducedFrom) {
    const within = monthsBetween(r.reducedFrom, Math.min(at, r.reducedTo ?? at));
    months -= (RETURN.payLateMonthly - PLAN.reducedRate) * within;
  }
  return Math.min(RETURN.lateCap, Math.max(0, months));
}

/** What a return owes at a moment: its parts summed, rounded once. */
export function owedOn(r: TaxReturn, at: Instant): Money {
  if (!r.owed) return 0;
  const p = partsOn(r, at, true);
  return Math.round(p.tax + p.penalty + p.interest);
}

/** Brings a return's balance up to a moment. */
function accrue(r: TaxReturn, at: Instant): void {
  if (!r.owed) return;
  const months = Math.ceil(Math.max(0, at - Math.max(r.filedAt ?? at, r.due)) / (30.4375 * MS_DAY));
  r.parts = partsOn(r, at);
  r.base ??= r.parts.tax;
  r.payLateRate = Math.max(r.payLateRate ?? 0, Math.min(RETURN.lateCap, RETURN.payLateMonthly * months));
  r.owed = r.parts.tax + r.parts.penalty + r.parts.interest;
  r.accruedAt = at;
}

/** A balance owed set down: its parts, brought up to date from now. */
function setOwed(r: TaxReturn, parts: OwedParts, at: Instant): void {
  r.parts = parts;
  r.owed = parts.tax + parts.penalty + parts.interest;
  r.base = parts.tax;
  r.accruedAt = at;
  if (r.owed <= 0) { delete r.owed; delete r.parts; }
}

/**
 * A payment on a return: brought up to date, then applied to the tax, then the penalty, then the interest, the IRS's
 * order where the taxpayer names none (research-tax-switch-lending.json), and kept on the return's payments.
 */
export function applyPayment(sim: Simulation, person: Person, r: TaxReturn, amount: Money, how: 'payment' | 'levy' | 'refund offset'): OwedParts {
  accrue(r, sim.now);
  const p = { ...partsOf(r) };
  let left = amount;
  const tax = Math.min(left, p.tax); left -= tax; p.tax -= tax;
  const penalty = Math.min(left, p.penalty); left -= penalty; p.penalty -= penalty;
  const interest = Math.min(left, p.interest); left -= interest; p.interest -= interest;
  (r.payments ??= []).push({ at: sim.now, amount: amount - left, tax, penalty, interest, how });
  r.paidTax = (r.paidTax ?? 0) + tax;
  setOwed(r, p, sim.now);
  if (!r.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year) sim.timeline.cancel(one.id, sim.now);
  return { tax, penalty, interest };
}

/** The next step of the IRS's collection on a return, on the calendar. */
function nextNotice(sim: Simulation, person: Person, r: TaxReturn): void {
  const step = r.collection ?? 0;
  const wait = step < COLLECTION.notices.length ? COLLECTION.noticeWeeks * 7 : step === COLLECTION.notices.length ? COLLECTION.finalDays : COLLECTION.againDays;
  sim.schedule({ at: sim.now + wait * MS_DAY, kind: TAX_NOTICE_KIND, label: 'The IRS', category: 'system', priority: 20, payload: { personId: person.id, year: r.year } });
}
export const TAX_DUE_KIND = 'tax.due';
export const TAX_REFUND_KIND = 'tax.refund';

const HOME = 'America/New_York';
const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);

export interface TaxReturn {
  year: number;
  due: Instant;
  figures: ReturnFigures;
  filedAt?: Instant;
  penalty?: Money;
  /** What's still owed after filing, if the bank couldn't pay it, as of `accruedAt`. */
  owed?: Money;
  /** The unpaid tax the late-payment penalty is a share of, the share already charged, and when the balance was last brought up to date. */
  base?: Money;
  payLateRate?: number;
  accruedAt?: Instant;
  /** How far the IRS's collection has gone: its notices sent, and a levy made. */
  collection?: number;
  /** Filed by the IRS, never by them (`SUBSTITUTE`). */
  substitute?: boolean;
  refund?: Money;
  refundAt?: Instant;
  /** The balance's parts (`partsOn`), what was paid toward the tax itself, and every payment, levy and offset with its split. */
  parts?: OwedParts;
  paidTax?: Money;
  payments?: { at: Instant; amount: Money; tax: Money; penalty: Money; interest: Money; how: 'payment' | 'levy' | 'refund offset' }[];
  /** An amended return: its form, when filed, the figures it carries, the change, when the IRS processes it, and its outcome. */
  amended?: { form: '1040-X' | '1040-X with 1040-NR'; at: Instant; figures: ReturnFigures; change: Money; processAt: Instant; processedAt?: Instant; refund?: Money; interest?: Money; irs?: Money; states?: Record<string, Money> }[];
  /** A substitute return replaced by their own after it was assessed, and when (`tax.file`, a reconsideration). */
  reconsideredAt?: Instant;
  /** The IRS's own figures on a substitute, kept beside the return's. */
  substituteFigures?: ReturnFigures;
  /** A payment plan's months at the reduced failure-to-pay rate: from, and to once it ends (`payLateRateAt`). */
  reducedFrom?: Instant;
  reducedTo?: Instant;
  /** When the IRS's refund was paid: a second item for it pays nothing. */
  refundedAt?: Instant;
  /**
   * Each state's side of the year (`systems/statetax.ts`, from the integration pass of 2026-10-10). The fields above are
   * the IRS's alone from then: `owed`, `parts`, `payments`, `collection`, `refund` and the plan's reduced rate. Until
   * then they were federal and state together, and an IRS plan, notice and levy ran on Connecticut's tax.
   */
  stateDue?: Record<string, StateDue>;
  /** A combined balance divided when the save was opened (`splitReturns`): when, and how. */
  split?: { at: Instant; how: string };
}

/**
 * An IRS payment plan (from 2026-10-10; research-switch-loans-plans.json): a short-term plan, paid in full within 180
 * days with no setup fee, for less than $100,000; or a long-term plan (the Simple Payment Plan) of monthly payments for
 * $50,000 or less, every return filed, its setup fee by how it's paid and the low-income waiver (`PLAN`). Online with
 * a Social Security number it's approved at once; without, Form 9465 by mail, answered in about thirty days. While it
 * stands, collection stops, interest goes on, and the failure-to-pay penalty halves where the return was filed on time.
 * A missed payment brings notice CP523, thirty days to catch up, then the plan ends and collection resumes. Tax added
 * later (an amended return, another year) joins the plan where it adds no more than two monthly payments; otherwise the
 * plan must be revised, for its fee. Refunds go to what's owed.
 */
export interface TaxPlan {
  kind: 'short' | 'long';
  status: 'pending' | 'active' | 'default' | 'ended' | 'paid' | 'refused';
  appliedAt: Instant;
  decideAt: Instant;
  startedAt?: Instant;
  directDebit: boolean;
  fee: Money;
  monthly?: Money;
  payBy?: Instant;
  /** What it covers when set up, and the years. */
  covers: Money;
  years: number[];
  nextDue?: Instant;
  defaultBy?: Instant;
  why?: string;
  history: { at: Instant; what: string; amount?: Money }[];
}

/**
 * The IRS's figures (research-switch-loans-plans.json, IRS.gov and IRM 5.14, July 2026): the short-term plan's 180 days
 * and $100,000; the Simple Payment Plan's $50,000; the setup fees online with direct debit $29, online without $69, and
 * the low-income $0 and $43; revision $6 online; CP523's thirty days; the quarter-percent rate under a plan; the most a
 * new balance may add before the plan must be revised. The low-income line (250% of the poverty guideline) and SLATE's
 * least monthly payment (what's owed over 72 months, the old streamlined term, so the collection deadline is never at
 * risk) are said as SLATE's.
 */
export const PLAN = {
  shortDays: 180, shortMax: 100_000_00, longMax: 50_000_00,
  fee: { onlineDebit: 29_00, online: 69_00, lowIncomeDebit: 0, lowIncome: 43_00 }, reviseFee: 6_00,
  lowIncomeShare: 2.5, leastMonths: 72, reducedRate: 0.0025, defaultDays: 30, mailDays: 30, addedPayments: 2,
  source: 'https://www.irs.gov/payments/payment-plans-installment-agreements; IRM 5.14.5 (07-21-2026); 26 CFR 300.1-300.2; IRC 6651(h); research-switch-loans-plans.json',
} as const;
export const TAX_PLAN_KIND = 'tax.plan_payment';
export const TAX_PLAN_DECIDE_KIND = 'tax.plan_decide';
export const TAX_PLAN_DEFAULT_KIND = 'tax.plan_default';

/**
 * What's owed to the IRS across every return, now: what its plan covers. From the integration pass of 2026-10-10 a
 * state's is apart (`owedToStates`); until then this was both, and an IRS plan took a state's tax in.
 */
export const owedAll = (person: Person, at: Instant): Money => Object.values(person.returns ?? {}).reduce((s, r) => s + owedOn(r, at), 0);

/** What's owed to anyone for income tax, the IRS and every state, now: what a budget sets aside. */
export const owedEverywhere = (person: Person, at: Instant): Money => owedAll(person, at) + owedToStates(person, at);

/** Why a plan can't be applied for, or nothing; and what it would be. */
export function planRefusal(sim: Simulation, person: Person, kind: 'short' | 'long'): string | undefined {
  if (person.taxPlan && ['pending', 'active', 'default'].includes(person.taxPlan.status)) return person.taxPlan.status === 'pending' ? `Your application is with the IRS, answered by ${formatDate(person.taxPlan.decideAt, HOME)}.` : 'You have a payment plan.';
  const owed = owedAll(person, sim.now);
  if (owed <= 0) return 'You owe the IRS nothing.';
  const unfiled = Object.values(person.returns ?? {}).find((r) => r.filedAt === undefined && r.due < sim.now);
  if (unfiled) return `The IRS asks every return filed first: ${unfiled.year}’s isn’t.`;
  const cur = saveCurrency(sim.universe);
  if (kind === 'short' && owed >= usd(PLAN.shortMax, cur)) return `A short-term plan is for less than ${formatMoney(usd(PLAN.shortMax, cur), cur, { cents: false })}.`;
  if (kind === 'long' && owed > usd(PLAN.longMax, cur)) return `A Simple Payment Plan is for ${formatMoney(usd(PLAN.longMax, cur), cur, { cents: false })} or less; more needs a financial statement SLATE doesn't model.`;
  return undefined;
}

/** The setup fee for a long-term plan: by direct debit or not, online or not, and low income by last year's return. */
export function planFee(sim: Simulation, person: Person, kind: 'short' | 'long', directDebit: boolean): Money {
  if (kind === 'short') return 0;
  const cur = saveCurrency(sim.universe);
  const last = Object.values(person.returns ?? {}).sort((a, b) => b.year - a.year)[0];
  const low = last ? last.figures.income <= PLAN.lowIncomeShare * usd(byYear(POVERTY_LINE, last.year), cur) : true;
  return usd(low ? (directDebit ? PLAN.fee.lowIncomeDebit : PLAN.fee.lowIncome) : directDebit ? PLAN.fee.onlineDebit : PLAN.fee.online, cur);
}

/** The least monthly payment SLATE's plan takes: what's owed over `PLAN.leastMonths`. */
export const leastMonthly = (owed: Money): Money => Math.ceil(owed / PLAN.leastMonths);

const planNote = (p: TaxPlan, at: Instant, what: string, amount?: Money) => { p.history.push({ at, what, ...(amount !== undefined ? { amount } : {}) }); if (p.history.length > 40) p.history.splice(0, p.history.length - 40); };

/** A plan begun: collection stopped, the reduced rate from today on each return filed on time, the first payment set. */
function startPlan(sim: Simulation, person: Person, p: TaxPlan): void {
  p.status = 'active';
  p.startedAt = sim.now;
  for (const r of Object.values(person.returns ?? {})) {
    if (!r.owed) continue;
    accrue(r, sim.now);
    if (r.filedAt !== undefined && r.filedAt <= r.due && !r.substitute) { r.reducedFrom = sim.now; delete r.reducedTo; }
    for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_NOTICE_KIND && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
  }
  if (p.fee > 0) payFromBank(sim, person, p.fee, 'IRS payment plan setup fee', 'tax');
  if (p.kind === 'long') {
    p.nextDue = sim.now + 30 * MS_DAY;
    sim.schedule({ at: p.nextDue, kind: TAX_PLAN_KIND, label: 'IRS Payment Plan: A Payment', category: 'personal', priority: 25, payload: { personId: person.id } });
  } else {
    p.payBy = sim.now + PLAN.shortDays * MS_DAY;
    sim.schedule({ at: p.payBy, kind: TAX_PLAN_KIND, label: 'IRS Short-Term Plan: Paid By', category: 'personal', priority: 25, payload: { personId: person.id, last: true } });
  }
  planNote(p, sim.now, p.kind === 'long' ? `Approved: ${formatMoney(p.monthly!, saveCurrency(sim.universe))} a month` : `Approved: paid in full by ${formatDate(p.payBy!, HOME)}`);
}

/** A plan ended, by default or paid off: the reduced rate stops, and anything still owed goes back to collection. */
function endPlan(sim: Simulation, person: Person, p: TaxPlan, status: 'ended' | 'paid', why: string): void {
  p.status = status;
  p.why = why;
  planNote(p, sim.now, why);
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && (one.kind === TAX_PLAN_KIND || one.kind === TAX_PLAN_DEFAULT_KIND) && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
  for (const r of Object.values(person.returns ?? {})) {
    if (r.reducedFrom !== undefined && r.reducedTo === undefined) { accrue(r, sim.now); r.reducedTo = sim.now; }
    if (status === 'ended' && r.owed) { r.collection = Math.max(r.collection ?? 0, COLLECTION.notices.length - 1); nextNotice(sim, person, r); }
  }
}

/** A plan's payment: what it takes now, applied to the oldest year first. */
function payPlan(sim: Simulation, person: Person, amount: Money): Money {
  let left = amount;
  for (const r of Object.values(person.returns ?? {}).sort((a, b) => a.year - b.year)) {
    if (left <= 0 || !r.owed) continue;
    const take = Math.min(left, owedOn(r, sim.now));
    applyPayment(sim, person, r, take, 'payment');
    left -= take;
  }
  return amount - left;
}

/**
 * New tax owed while a plan stands (an amended return's, another year's): joined to it where it adds no more than two
 * monthly payments; past that, the plan is in default until it's revised (`tax.revise_plan`).
 */
export function newLiability(sim: Simulation, person: Person, added: Money): void {
  const p = person.taxPlan;
  if (!p || p.status !== 'active' || p.kind !== 'long' || !p.monthly) return;
  if (added <= PLAN.addedPayments * p.monthly) { planNote(p, sim.now, 'New tax joined the plan', added); return; }
  p.status = 'default';
  p.defaultBy = sim.now + PLAN.defaultDays * MS_DAY;
  planNote(p, sim.now, 'New tax beyond what the plan takes: CP523', added);
  sim.schedule({ at: p.defaultBy, kind: TAX_PLAN_DEFAULT_KIND, label: 'IRS: Notice Of Intent To End The Plan', category: 'personal', priority: 25, payload: { personId: person.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title: 'Notice CP523: Your Payment Plan', body: `New tax of ${formatMoney(added, saveCurrency(sim.universe))} is more than the plan’s two payments take in. Revise the plan by ${formatDate(p.defaultBy, HOME)}, or it ends and collection resumes.`, importance: 90, route: '/workspace/papers' });
}

export interface ReturnFigures {
  /** The form: a nonresident alien's 1040-NR, with its Form 8843, from 2026-10-10 (`nonresidentFor`); absent, the 1040. */
  form?: '1040-NR';
  cityId: string;
  acting: Money;
  workStudy: Money;
  unemployment: Money;
  /** A scholarship's taxable part. */
  scholarship?: Money;
  /** Interest the banks paid. */
  interest?: Money;
  /** A pension paid. */
  pension?: Money;
  /** On a return filed before 2026-10-09: rent less its costs and depreciation, a loss only as far as it was allowed; a home sale's gain taxed as income, and a long-term one; what was kept free. */
  rental?: Money;
  gainShort?: Money;
  gainLong?: Money;
  gainExcluded?: Money;
  /** Itemized deductions, where they beat the standard one, on a return filed before 2026-10-09; the net investment income tax, and a long-term gain's before then. */
  itemized?: Money;
  gainTax?: Money;
  income: Money;
  deduction: Money;
  incomeTax: Money;
  /** Of it, the federal tax, and each state's and town's, with the credit a home state gives for another's. */
  federal: Money;
  /** The US credit for another country's tax, and what Canada gives back under its treaty threshold. */
  foreignCredit: Money;
  foreignRefund: Money;
  states: { state: string; tax: Money; credit: Money }[];
  local: Money;
  payroll: Money;
  credit: Money;
  /** Connecticut's 2026 Temporary Premium Assistance (`ENHANCED_CREDIT`), settled with the return. */
  stateAssistance?: Money;
  mandate: Money;
  withheld: Money;
  /** Positive owed, negative due back. */
  balance: Money;
  /**
   * The balance by who it's owed to or due back from (from the integration pass of 2026-10-10): the IRS's (federal tax,
   * payroll tax, the premium credit, less federal withholding) and each state's (its tax less the credit it gives, New
   * York City's tax with New York's, California's mandate with California's, Connecticut's assistance with
   * Connecticut's, less its withholding). They sum to `balance`. `derived` where the withholding was divided after the
   * fact (`withholdingSplit`).
   */
  owedTo?: { irs: Money; states: Record<string, Money>; derived?: boolean };
}

export function returnsOf(person: Person): Record<string, TaxReturn> {
  person.returns ??= {};
  return person.returns;
}

/** A year's deadline: 15 April, or the next business day, with Emancipation Day observed. */
export function deadline(year: number): Instant {
  const filing = year + 1;
  const dow = (d: number) => new Date(Date.UTC(filing, 3, d)).getUTCDay();
  const emancipation = dow(16) === 6 ? 15 : dow(16) === 0 ? 17 : 16;
  let day = 15;
  while (dow(day) === 0 || dow(day) === 6 || day === emancipation) day += 1;
  return instantFromZoned({ year: filing, month: 4, day, hour: 23, minute: 59 }, HOME);
}

/** The enhanced credits' applicable percentage at a share of the poverty line (2021–2025), which Connecticut's assistance reads. */
export function enhancedPercent(ratio: number): number {
  let low = 1;
  for (const [upTo, from, to] of ENHANCED_CREDIT.bands) {
    if (ratio <= upTo) return from + ((to - from) * (Math.max(ratio, low) - low)) / (upTo - low);
    low = upTo;
  }
  return ENHANCED_CREDIT.above;
}

/** The applicable percentage of income at a share of the poverty line, in a year (later years hold). */
export function applicablePercent(year: number, ratio: number): number | undefined {
  // Over 400% of the poverty line there's none: the last band ends there.
  if (ratio < 1) return undefined;
  const bands = PREMIUM_CREDIT.bands[Math.min(2027, Math.max(2026, year))]!;
  let low = 1;
  for (const [upTo, from, to] of bands) {
    if (ratio <= upTo) return from + ((to - from) * (ratio - low)) / (upTo - low);
    low = upTo;
  }
  return undefined;
}

/**
 * Connecticut's tax on a year's income (`CONNECTICUT`): nothing at $15,000
 * or less; else the exemption, the rates, the add-back past $56,500, and the
 * personal credit's share off.
 */
export function connecticutTax(income: Money, into = 'USD'): Money {
  const $ = (c: Money) => usd(c, into);
  const c = CONNECTICUT;
  // Nothing at $15,000 or less: the exemption covers it all.
  const over = Math.max(0, income - $(c.exemptionFrom));
  const exemption = Math.max(0, $(c.exemption) - Math.ceil(over / $(1_000_00)) * $(1_000_00));
  const taxable = Math.max(0, income - exemption);
  let tax = 0;
  for (const [n, [from, rate]] of c.brackets.entries()) {
    const to = c.brackets[n + 1]?.[0];
    if (taxable <= $(from)) break;
    tax += (Math.min(taxable, to === undefined ? taxable : $(to)) - $(from)) * rate;
  }
  const addBack = income <= $(c.addBackFrom) ? 0 : Math.min($(c.addBackMax), Math.ceil((income - $(c.addBackFrom)) / $(5_000_00)) * $(c.addBackStep));
  const credit = c.credit.find(([upTo]) => income <= $(upTo))?.[1] ?? 0;
  return Math.round((tax + addBack) * (1 - credit));
}

/** A year's return, worked out. */
/** Tax over bands, each band's upper edge and its rate. */
export function banded(income: Money, bands: readonly (readonly [number, number])[]): Money {
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of bands) {
    if (income <= from) break;
    tax += (Math.min(income, upTo) - from) * rate;
    from = upTo;
  }
  return Math.round(tax);
}

/**
 * Canada's tax under a section 216.1 election, in dollars of the save: the
 * federal brackets on the net of the Canadian gross; each province's tax on
 * the whole net, with Ontario's surtax on its own, taken in the share of the
 * gross earned there (Form T2203); the 48% federal surtax on the share no
 * province takes; and the basic personal amounts' credits only where
 * Canadian income is 90% of the year's.
 */
export function canadaElected(gross: Money, commission: Money, world: Money, into: string, byRegion: Readonly<Record<string, Money>> = {}): Money {
  const c = ABROAD.canada;
  const toCad = (m: Money) => exchange(m, into, 'CAD') ?? m;
  const net = Math.max(0, toCad(gross - commission));
  const mostly = gross >= c.residentShare * world;
  const basic = Math.max(0, banded(net, c.brackets) - (mostly ? Math.round(c.basicPersonal * c.brackets[0]![1]) : 0));
  let provincial = 0;
  let placed = 0;
  for (const [region, earned] of Object.entries(byRegion)) {
    const p = c.provinces[region];
    if (!p || gross <= 0) continue;
    const share = earned / gross;
    placed += share;
    const own = Math.max(0, banded(net, p.brackets) - (mostly ? Math.round(p.basicPersonal * p.brackets[0]![1]) : 0));
    const surtax = (p.surtax ?? []).reduce((sum, [over, rate]) => sum + Math.max(0, own - over) * rate, 0);
    provincial += (own + surtax) * share;
  }
  const cad = Math.round(basic + provincial + basic * c.surtax * Math.max(0, 1 - placed));
  return exchange(cad, 'CAD', into) ?? cad;
}

/**
 * Who of the non-resident keeps the UK's personal allowance: a British or EEA
 * citizen (gov.uk, "Tax on your UK income if you live abroad"). A US citizen
 * doesn't, since the UK-US treaty grants none (HMRC RFIG30570, July 2026).
 */
const UK_ALLOWED = new Set(['uk', 'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'is', 'li', 'no']);
export const ukAllowed = (citizenshipId: string | undefined): boolean => UK_ALLOWED.has(citizenshipId ?? '');

/**
 * The UK's tax on a UK tax year's gross: the bands on it all for a US
 * citizen, who has no personal allowance; for a British or EEA one the
 * allowance first, £1 less for each £2 of income over £100,000, gone at
 * £125,140 (gov.uk, 2026–27). Until 2026-09-28 every player was taxed as a US
 * citizen.
 */
export function ukTaxOn(gross: Money, into: string, allowed = false): Money {
  const toGbp = (m: Money) => exchange(m, into, 'GBP') ?? m;
  const gbp = toGbp(gross);
  const allowance = allowed ? Math.max(0, ABROAD.uk.allowance - Math.max(0, gbp - ABROAD.uk.taperFrom) / 2) : 0;
  const tax = banded(Math.max(0, gbp - allowance), ABROAD.uk.bands);
  return exchange(tax, 'GBP', into) ?? tax;
}

/**
 * The 3.8% net investment income tax, on investment income over $200,000 of income (IRC §1411). A home's rent and
 * gains, its mortgage interest, taxes and insurance itemized, the passive loss allowance and the 2025 act's cap on
 * state and local taxes were on the return too, from 2026-09-28, until the homes went in the scope reset of
 * 2026-10-09; nothing puts them on a year now. A return filed before keeps its lines.
 */
export const NIIT = { rate: 0.038, from: 200_000_00 } as const;

/**
 * A nonresident alien for the year's US tax (from 2026-10-10; research-student-status.json): a student on an F-1 is an
 * exempt individual, whose days don't count toward the substantial presence test, for any part of five calendar years
 * (IRC 7701(b)(5)(E)), so for the whole of SLATE's three. Until then every foreign student filed as a resident, taking
 * the resident's standard deduction and paying on the banks' interest. A green card isn't modeled, so no student here
 * is a resident alien by it.
 */
export function nonresidentFor(person: Person, year: number): boolean {
  if (citizenOf(person, 'US') || person.citizenshipId === undefined) return false;
  // A green card makes them a resident alien for tax (the green-card test, IRC 7701(b)(1)(A)(i)), from 2026-10-10.
  if (residenceIn(person, 'US', instantFromZoned({ year, month: 12, day: 31, hour: 12 }, HOME))?.route === 'us-green-card') return false;
  const f1 = f1Of(person);
  if (!f1) return false;
  const first = zonedParts(f1.issuedAt ?? f1.appliedAt ?? instantFromZoned({ year, month: 1, day: 1, hour: 12 }, HOME), HOME).year;
  return year - first < 5;
}

/**
 * The part of a year's Social Security benefit that's taxable (IRC 86, filing singly): none while provisional income,
 * the other income and half the benefit, is $25,000 or less; then half of what it's over, to half the benefit; past
 * $34,000, 85% of what it's over, with the lesser of half the benefit and $4,500, to 85% of the benefit. The two
 * thresholds aren't indexed. From 2026-10-10: until then the whole benefit was taxed.
 */
export function taxableSocialSecurity(benefit: Money, other: Money, into = 'USD'): Money {
  if (benefit <= 0) return 0;
  const b1 = usd(25_000_00, into);
  const b2 = usd(34_000_00, into);
  const provisional = other + benefit / 2;
  if (provisional <= b1) return 0;
  if (provisional <= b2) return Math.round(Math.min(benefit / 2, (provisional - b1) / 2));
  return Math.round(Math.min(0.85 * benefit, 0.85 * (provisional - b2) + Math.min(benefit / 2, usd(4_500_00, into))));
}

/** The nonresident's due date: 15 April with wages withheld on, 15 June without (Form 1040-NR instructions). */
export function nonresidentDeadline(year: number, wages: boolean): Instant {
  return wages ? deadline(year) : instantFromZoned({ year: year + 1, month: 6, day: 15, hour: 23, minute: 59 }, HOME);
}

export function figuresFor(person: Person, year: number, into = 'USD', filedAt?: Instant): ReturnFigures {
  const y = yearOf(person, year);
  const cityId = y.residence ?? person.currentLocationId;
  const at = instantFromZoned({ year, month: 12, day: 31, hour: 12 }, HOME);
  // A nonresident's return is on income connected with the US: the wages, the taxable scholarship, unemployment. The
  // banks' deposit interest isn't (IRC 871(i)), and nor would a foreign pension be.
  const nra = nonresidentFor(person, year);
  const ss = y.socialSecurity ?? 0;
  const otherIncome = y.acting + y.workStudy + y.unemployment + (y.scholarship ?? 0) + (nra ? 0 : (y.interest ?? 0) + (y.pension ?? 0) - ss);
  const income = otherIncome + (nra ? 0 : taxableSocialSecurity(ss, otherIncome, into));
  const employers = Object.values(y.employers).filter((pay) => pay >= usd(RETURN.performingArtistEmployerPay, into)).length;
  // Of the rest of the work's costs, the ones there's a receipt for.
  const kept = Math.min(1, RECEIPTS.kept * personalityOf(person, 'receipts'));
  const expenses = y.commission + y.dues + Math.round((y.jobCosts ?? 0) * kept);
  const performer = income <= usd(RETURN.performingArtistIncome, into) && employers >= RETURN.performingArtistEmployers && expenses > RETURN.performingArtistShare * y.acting;
  const deduction = performer ? expenses : 0;
  const taxed = Math.max(0, income - deduction);
  // Work abroad: Canada's comes back under CAD 15,000 in the year, and over it a 216.1 return filed by 30 April gives back what's past its graduated tax; the UK's is settled after its own year. The US credits what stands, to its own tax on that income.
  let foreignIncome = 0;
  let foreignTax = 0;
  let foreignRefund = 0;
  const elect = instantFromZoned({ year: year + 1, month: ABROAD.canada.electBy.month, day: ABROAD.canada.electBy.day, hour: 23 }, HOME);
  for (const [country, f] of Object.entries(y.foreign)) {
    foreignIncome += f.gross;
    let back = 0;
    if (country === 'ca') {
      if (f.gross <= (exchange(ABROAD.canada.treatyCad, 'CAD', into) ?? ABROAD.canada.treatyCad)) back = f.withheld;
      else if (filedAt === undefined || filedAt <= elect) {
        const commission = y.acting > 0 ? Math.round(y.commission * (f.gross / y.acting)) : 0;
        // Where in Canada it was earned, by province.
        const byRegion: Record<string, Money> = {};
        for (const [city, earned] of Object.entries(y.foreignWhere ?? {})) {
          const place = CITIES.get(city);
          if (place?.countryId === 'ca') byRegion[place.parentId] = (byRegion[place.parentId] ?? 0) + earned;
        }
        back = Math.max(0, f.withheld - canadaElected(f.gross, commission, income, into, byRegion));
      }
    }
    foreignRefund += back;
    foreignTax += f.withheld - back;
  }
  // Each state: what came while living there, and wages for work done there, over all of it.
  const states = new Map<string, { city: string; resident: Money; source: Money }>();
  const entry = (state: string, city: string) => { if (!states.has(state)) states.set(state, { city, resident: 0, source: 0 }); return states.get(state)!; };
  for (const [city, amount] of Object.entries(y.byResidence)) entry(stateOf(city), city).resident += amount;
  for (const [key, amount] of Object.entries(y.elsewhere)) { const city = key.split('>')[1]!; entry(stateOf(city), city).source += amount; }
  const lastState = stateOf(cityId);
  const stateTaxed = taxed;
  // California doesn't tax unemployment, which goes to where they lived at the year's end.
  const benefitOut = (state: string) => (state === 'us-ca' && lastState === 'us-ca' ? y.unemployment : 0);
  // New York and California let the job's costs be itemized above 2% of income, where that beats the standard deduction.
  const itemized = Math.max(0, expenses - STATE_DEDUCTIONS.floor * income);
  const extra = (state: string) => Math.max(0, itemized - usd(STATE_DEDUCTIONS.standard[state] ?? Number.POSITIVE_INFINITY, into));
  const full = (state: string) => {
    const base = Math.max(0, stateTaxed - benefitOut(state));
    // Connecticut's own schedule; SLATE's tax table carries none for it.
    if (state === 'us-ct') return connecticutTax(base, into);
    return computeAnnualTax(base, states.get(state)!.city, at, { deductions: extra(state), currency: into }).regional;
  };
  const taxes = new Map<string, number>();
  for (const [state, part] of states) {
    const own = Math.max(0, part.resident + part.source - benefitOut(state));
    let tax = stateTaxed > 0 ? Math.round(full(state) * Math.min(1, own / Math.max(1, stateTaxed - benefitOut(state)))) : 0;
    // Georgia leaves a nonresident's small wages alone.
    if (state === 'us-ga' && part.resident === 0 && part.source <= Math.min(usd(STATE_RETURN.georgiaExempt, into), STATE_RETURN.georgiaExemptShare * y.acting)) tax = 0;
    taxes.set(state, tax);
  }
  // The home state credits another's tax on the same wages, to its own tax on them.
  const credits = new Map<string, number>();
  for (const [key, amount] of Object.entries(y.elsewhere)) {
    const [lived, city] = key.split('>') as [string, string];
    const worked = stateOf(city);
    if (!states.has(lived) || !taxes.get(worked)) continue;
    const part = states.get(worked)!;
    const theirs = taxes.get(worked)! * (amount / Math.max(1, part.resident + part.source));
    const ours = stateTaxed > 0 ? full(lived) * (amount / stateTaxed) : 0;
    credits.set(lived, (credits.get(lived) ?? 0) + Math.round(Math.min(theirs, ours)));
  }
  const stateLines = [...states.keys()].map((state) => ({ state, tax: taxes.get(state) ?? 0, credit: Math.min(taxes.get(state) ?? 0, credits.get(state) ?? 0) }));
  // A city's own tax, New York City's, only on what came while living in it.
  const local = taxed > 0 ? Object.entries(y.byResidence).reduce((sum, [city, amount]) => sum + Math.round(computeAnnualTax(taxed, city, at, { currency: into }).local * (amount / taxed)), 0) : 0;
  const stateAndLocal = stateLines.reduce((sum, l) => sum + l.tax - l.credit, 0) + local;
  // Federal, at the standard deduction: itemizing was a home's interest and taxes, which went on 2026-10-09.
  // Filed singly. A joint return for the married (`systems/marriage.ts`, from 2026-10-01) went with the marriages in the
  // scope reset of 2026-10-09.
  // A nonresident takes no standard deduction (Form 1040-NR; India's students excepted by treaty, whose citizens aren't
  // among SLATE's birthplaces): the rule's deduction is added back so its graduated rates fall on the whole.
  const federalBefore = computeAnnualTax(taxed + (nra ? usd(US_STANDARD_DEDUCTION, into) : 0), cityId, at, { currency: into }).federal;
  // 3.8% on investment income, the banks' interest, over $200,000 of income.
  const gainTax = nra ? 0 : Math.round(NIIT.rate * Math.min(y.interest ?? 0, Math.max(0, taxed - usd(NIIT.from, into))));
  const foreignCredit = taxed > 0 ? Math.min(foreignTax, Math.round(federalBefore * Math.min(1, foreignIncome / taxed))) : 0;
  // The Child Tax Credit and the adoption credit came off it (`systems/children.ts`, `systems/adoption.ts`) until the
  // children went in the scope reset of 2026-10-09.
  const federal = federalBefore - foreignCredit + gainTax;
  const incomeTax = federal + stateAndLocal;
  // Payroll tax is on the acting wages alone: a student's work-study and a benefit carry none.
  // None for a nonresident alien on an F-1 (IRC 3121(b)(19)), from 2026-10-10.
  const payroll = nra ? 0 : computeAnnualTax(y.acting, cityId, at, { currency: into }).payroll;
  const premiums = person.health?.premiums[year] ?? [];
  // The poverty line the year's cover reads is the year before's; a person Medicaid or the Essential Plan would take gets no credit.
  const ratio = income / usd(byYear(POVERTY_LINE, year - 1), into);
  const program = ratio <= PUBLIC_COVER.medicaidShare || (lastState === 'us-ny' && ratio <= PUBLIC_COVER.essentialShare);
  const pct = program ? undefined : applicablePercent(year, ratio);
  // A nonresident alien isn't an applicable taxpayer for the premium tax credit, which the 1040-NR doesn't carry.
  const credit = pct === undefined || nra ? 0 : premiums.reduce((sum, premium) => sum + Math.max(0, Math.round(premium - (pct * income) / 12)), 0);
  // Connecticut's 2026 assistance: what the expired enhanced credits would have added, in full or half by income.
  const ct = ENHANCED_CREDIT.connecticut;
  const share = lastState === 'us-ct' && year === ct.year && !program ? (ratio > ct.full[0] && ratio <= ct.full[1] ? 1 : ratio > ct.half[0] && ratio <= ct.half[1] ? 0.5 : 0) : 0;
  const enhanced = share ? premiums.reduce((sum, premium) => sum + Math.max(0, Math.round(premium - (enhancedPercent(ratio) * income) / 12)), 0) : 0;
  const stateAssistance = Math.round(Math.max(0, enhanced - credit) * share);
  const months = person.health?.uncoveredInCalifornia[year] ?? 0;
  const mandate = months * Math.round(Math.min(usd(CALIFORNIA_MANDATE.bronzeMonth, into), Math.max(usd(CALIFORNIA_MANDATE.flat, into), CALIFORNIA_MANDATE.share * income) / 12));
  const figures: ReturnFigures = {
    ...(nra ? { form: '1040-NR' as const } : {}),
    cityId, acting: y.acting, workStudy: y.workStudy, unemployment: y.unemployment, scholarship: y.scholarship ?? 0, interest: y.interest ?? 0, pension: y.pension ?? 0,
    gainTax, income, deduction,
    incomeTax, federal, foreignCredit, foreignRefund, states: stateLines, local, payroll, credit, ...(stateAssistance ? { stateAssistance } : {}), mandate, withheld: y.withheld,
    balance: incomeTax + payroll + mandate - y.withheld - credit - stateAssistance,
  };
  // The city tax by the state that collects it: New York City's with New York's (Tax Law 1312(a)).
  const localBy: Record<string, Money> = {};
  if (taxed > 0) for (const [city, amount] of Object.entries(y.byResidence)) { const l = Math.round(computeAnnualTax(taxed, city, at, { currency: into }).local * (amount / taxed)); if (l) localBy[stateOf(city)] = (localBy[stateOf(city)] ?? 0) + l; }
  figures.owedTo = owedToFrom(person, year, figures, into, localBy);
  return figures;
}

/**
 * What a year's withholding was, by authority: as kept (`withheldBy`), or, for a year paid before it was kept, divided
 * from the calculation that withheld it: the Summer Cabaret's state share is what its paychecks' tax table gives the
 * state on the season's stipend, the rest the IRS's (every other withholding in SLATE is federal: Form 1042-S's on a
 * scholarship). Never more than was withheld in all.
 */
export function withholdingSplit(person: Person, year: number, into = 'USD'): { by: Record<string, Money>; derived: boolean } {
  const y = yearOf(person, year);
  if (y.withheldBy) {
    const by = { ...y.withheldBy };
    const kept = Object.values(by).reduce((s, v) => s + v, 0);
    // Anything withheld before the split was kept, in a year that has both, is the IRS's.
    if (kept !== y.withheld) by.us = (by.us ?? 0) + y.withheld - kept;
    return { by, derived: false };
  }
  const cabaret = y.employers['yale-summer-cabaret'] ?? 0;
  if (!cabaret || !y.withheld) return { by: y.withheld ? { us: y.withheld } : {}, derived: false };
  const t = computeAnnualTax(cabaret, YALE_DRAMA.cityId, instantFromZoned({ year, month: 7, day: 1, hour: 12 }, HOME), { currency: into });
  const state = Math.min(y.withheld, Math.max(0, Math.round(t.regional + t.local)));
  return { by: { us: y.withheld - state, ...(state ? { [stateOf(YALE_DRAMA.cityId)]: state } : {}) }, derived: true };
}

/** A year's balance by authority (`ReturnFigures.owedTo`), from its own lines; they sum to the balance. */
export function owedToFrom(person: Person, year: number, f: ReturnFigures, into = 'USD', localBy?: Record<string, Money>): NonNullable<ReturnFigures['owedTo']> {
  const w = withholdingSplit(person, year, into);
  const states: Record<string, Money> = {};
  const add = (s: string, v: Money) => { if (v) states[s] = (states[s] ?? 0) + v; };
  for (const l of f.states) add(l.state, l.tax - l.credit);
  // A return from before the city tax was kept by state reads it as its residence's state's.
  if (localBy) for (const [s, v] of Object.entries(localBy)) add(s, v);
  else if (f.local) add(stateOf(f.cityId), f.local);
  if (f.mandate) add('us-ca', f.mandate);
  if (f.stateAssistance) add('us-ct', -f.stateAssistance);
  for (const [s, v] of Object.entries(w.by)) if (s !== 'us') add(s, -v);
  for (const s of Object.keys(states)) if (states[s] === 0) delete states[s];
  const stateTotal = Object.values(states).reduce((a, b) => a + b, 0);
  // The IRS's is the rest, so the two sum to the balance to the cent whatever rounding the city tax took.
  return { irs: f.balance - stateTotal, states, ...(w.derived ? { derived: true } : {}) };
}

/** A filed return's split: its own, or worked out from its lines. */
export const owedToOf = (person: Person, r: TaxReturn): NonNullable<ReturnFigures['owedTo']> => r.figures.owedTo ?? owedToFrom(person, r.year, r.figures);

/** The late penalties on a balance filed at a moment: 4.5% a month or part for filing and 0.5% for paying, each to 25%, and the minimum past 60 days. */
export function latePenalty(balance: Money, due: Instant, filedAt: Instant, into = 'USD'): Money {
  if (balance <= 0 || filedAt <= due) return 0;
  const months = Math.ceil((filedAt - due) / (30.4375 * MS_DAY));
  // Paying late runs to a quarter of the balance; filing late is 5% a month to five months, less the paying-late half-point it runs beside, so 22.5% (IRC §6651(a), (c)).
  const payLate = Math.min(RETURN.lateCap, RETURN.payLateMonthly * months) * balance;
  let fileLate = Math.min(5, months) * (RETURN.lateMonthly - RETURN.payLateMonthly) * balance;
  if (filedAt - due > RETURN.lateMinimumAfterDays * MS_DAY) fileLate = Math.max(fileLate, Math.min(usd(RETURN.lateMinimum, into), balance));
  return Math.round(payLate + fileLate);
}

/**
 * What filing an unfiled return late would add now, by authority (from the integration pass of 2026-10-10): the IRS's
 * late penalties on its part, and each state's own on its part. Until then the IRS's ran on the whole balance.
 */
export function latePenaltyAll(person: Person, r: TaxReturn, at: Instant, into = 'USD'): Money {
  const to = owedToOf(person, r);
  let total = latePenalty(to.irs, r.due, at, into);
  for (const [state, tax] of Object.entries(to.states)) {
    const rules = rulesOf(state);
    if (!rules || tax <= 0) continue;
    total += stateLateAt(rules, tax, r.due, at, into);
  }
  return total;
}

/** Each February, from the one after the business began. */
/** A balance owed with no collection on the calendar, as a save from before 2026-09-28 holds one: it begins now. */
export function armCollection(sim: Simulation, person: Person): void {
  for (const r of Object.values(person.returns ?? {})) {
    // Owing, unfiled and past due, with nothing coming of it: the IRS's substitute return, on the calendar.
    if (r.filedAt === undefined && r.figures.balance > 0 && r.due < sim.now && !sim.universe.scheduled.some((i) => i.kind === TAX_SFR_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year)) {
      sim.schedule({ at: Math.max(sim.now + MS_DAY, r.due + SUBSTITUTE.afterDays * MS_DAY), kind: TAX_SFR_KIND, label: `The IRS On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, step: 'proposed' } });
    }
    if (r.filedAt === undefined && r.due < sim.now) scheduleStateNonFiler(sim, person, r, owedToOf(person, r).states);
    for (const [state, sd] of Object.entries(r.stateDue ?? {})) if (sd.owed && !person.statePlans?.[state] && !sim.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year && i.payload.state === state)) stateNextNotice(sim, person, r, state);
    if (!r.owed || sim.universe.scheduled.some((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year)) continue;
    r.accruedAt ??= sim.now;
    nextNotice(sim, person, r);
  }
}

/** Whether a year asks a US return of them: a citizen, or anyone with wages or benefit earned in the US. */
export function owesUsReturn(person: Person, year: number): boolean {
  if (citizenOf(person, 'US') || person.citizenshipId === undefined) return true;
  // A student on an F-1 files Form 8843 for each year present (from 2026-10-10).
  if (nonresidentFor(person, year) && earningsOf(person).years[year] !== undefined) return true;
  const y = earningsOf(person).years[year];
  if (!y) return false;
  if (y.bySource === undefined) return y.acting + y.workStudy + y.unemployment > 0;
  return (y.bySource.us ?? 0) + y.workStudy + y.unemployment > 0;
}

export function armTaxes(sim: Simulation, person: Person): void {
  splitReturns(sim, person);
  armCollection(sim, person);
  if (sim.universe.scheduled.some((i) => i.kind === TAX_SEASON_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  const p = zonedParts(sim.now, HOME);
  const next = instantFromZoned({ year: p.month >= 2 ? p.year + 1 : p.year, month: 2, day: 1, hour: 9 }, HOME);
  sim.schedule({ at: next, kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
}

/**
 * The UK's years settled with its return, due 31 January after the April
 * the year ended: under the treaty's $20,000 all that was withheld comes
 * back; over it, the tax on the whole, less what was withheld, is paid or
 * refunded. What changes goes into the calendar year's foreign tax, for
 * the US credit.
 */
export function settleUkYears(sim: Simulation, person: Person, calendarYear: number): void {
  const r = earningsOf(person);
  const cur = saveCurrency(sim.universe);
  const account = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  for (const [key, gross] of Object.entries(r.ukYears ?? {})) {
    // The year from April key to April key + 1 files by 31 January key + 2.
    if (Number(key) + 2 > calendarYear || r.ukSettled?.includes(key)) continue;
    const withheld = r.ukWithheld?.[key] ?? 0;
    const tax = gross <= usd(ABROAD.uk.treatyUsd, cur) ? 0 : ukTaxOn(gross, cur, ukAllowed(person.citizenshipId));
    const change = tax - withheld;
    // With no account to pay or refund through it waits for the next year's;
    // until 2026-09-27 it was marked settled and never paid.
    if (change !== 0 && !account) continue;
    (r.ukSettled ??= []).push(key);
    if (change === 0 || !account) continue;
    const uk = (yearOf(person, calendarYear).foreign.uk ??= { gross: 0, withheld: 0 });
    uk.withheld += change;
    const memo = change < 0 ? `HMRC refund, UK tax year ${key}–${String(Number(key) + 1).slice(2)}` : `HMRC, UK tax year ${key}–${String(Number(key) + 1).slice(2)}`;
    sim.post({ memo, category: 'tax', postings: [{ accountId: account.id, amount: -change }, { accountId: sim.nominalAccount(change < 0 ? 'income' : 'expense', change < 0 ? 'Tax Refund' : 'Foreign Tax Withheld').id, amount: change }] });
    if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title: change < 0 ? 'The UK Gave Tax Back' : 'The UK Took Its Balance', body: `Your ${key}–${String(Number(key) + 1).slice(2)} UK tax year: ${formatMoney(Math.abs(change), cur)} ${change < 0 ? 'back' : 'paid'}, ${tax === 0 ? 'the treaty leaving it untaxed' : `on ${formatMoney(tax, cur)} of UK tax`}.`, importance: 70, route: '/workspace/papers' });
  }
}

export function registerTaxReturn(sim: Simulation): void {
  sim.onSchedule(TAX_SEASON_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: instantFromZoned({ year: p.year + 1, month: 2, day: 1, hour: 9 }, HOME), kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
    const year = p.year - 1;
    const cur = saveCurrency(s.universe);
    // A UK tax year whose return fell due yesterday, 31 January, is settled first, into this year's foreign tax.
    settleUkYears(s, person, p.year);
    // The US taxes a citizen on everything, and anyone else on what they earned
    // in the US: someone who isn't a citizen and earned nothing there that year
    // has no US return. Until 2026-09-29 a British actor working in London was
    // given one on their pounds.
    if (!owesUsReturn(person, year)) return;
    const figures = figuresFor(person, year, cur);
    // Nothing owed and nothing due back: no return to file. A nonresident student files Form 8843 every year, income or
    // none (from 2026-10-10), so theirs is always ready.
    const nra = figures.form === '1040-NR';
    if (!nra && figures.balance === 0 && figures.income === 0 && figures.foreignRefund === 0) return;
    const due = nra ? nonresidentDeadline(year, figures.workStudy + figures.acting > 0) : deadline(year);
    returnsOf(person)[year] = { year, due, figures };
    s.schedule({ at: due, kind: TAX_DUE_KIND, label: `Tax Return Due: ${year}`, category: 'personal', priority: 25, payload: { personId: person.id, year } });
    if (person.id !== s.universe.playerId) return;
    s.requireDecision({
      urgency: 70, category: 'taxes', title: `Your ${year} Tax Return`,
      detail: `${nra ? (figures.income > 0 ? 'Form 1040-NR, with Form 8843. ' : 'Form 8843, which every F-1 student files; no income to report. ') : ''}${figures.balance > 0 ? `You owe ${formatMoney(figures.balance, cur)}` : figures.balance < 0 ? `${formatMoney(-figures.balance, cur)} comes back to you` : 'Nothing owed or due back'} on ${formatMoney(figures.income, cur)} of income. File by ${formatDate(due, HOME)}.`,
      route: '/workspace/papers', dueAt: due, refType: 'return', refId: String(year),
      actions: [{ label: 'File It', commandKind: 'tax.file', payload: { year } }],
    });
  });

  sim.onSchedule(TAX_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r || r.filedAt !== undefined) return;
    // Owing the IRS and unfiled, the IRS files it for them in a year (`SUBSTITUTE`): on its own part, from the integration
    // pass of 2026-10-10.
    if (owedToOf(person, r).irs > 0) s.schedule({ at: r.due + SUBSTITUTE.afterDays * MS_DAY, kind: TAX_SFR_KIND, label: `The IRS On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, step: 'proposed' } });
    // And each state owed acts on its own (`scheduleStateNonFiler`, from 2026-10-11): until then only the IRS did.
    scheduleStateNonFiler(s, person, r, owedToOf(person, r).states);
    if (person.id !== s.universe.playerId) return;
    s.notify({ category: 'tax', title: `Your ${r.year} Return Is Late`, body: r.figures.balance > 0 ? `Each month late adds 5% of what you owe, to a quarter of it; past 60 days, at least ${formatMoney(usd(RETURN.lateMinimum, saveCurrency(s.universe)), saveCurrency(s.universe))}.` : 'A refund waits for the return; there’s no penalty on one.', importance: 80, route: '/workspace/papers' });
  });

  sim.onSchedule(TAX_SFR_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r || r.filedAt !== undefined) return;
    const cur = saveCurrency(s.universe);
    const late = Math.max(0, (s.now - r.due) / MS_DAY);
    // The IRS's figures claim no credit a return of their own would: the foreign tax credit (Form 1116) and the premium tax
    // credit (Form 8962), from 2026-10-10. Until then the substitute was their own return's figures to the cent, and
    // replacing it changed nothing.
    const sfr = sfrFigures(r.figures);
    r.substituteFigures = sfr;
    // The IRS's own part of it: a state's tax isn't the IRS's to assess (from the integration pass of 2026-10-10).
    const federalPart = Math.max(0, owedToOf(person, r).irs + (sfr.balance - r.figures.balance));
    const penalty = latePenalty(federalPart, r.due, s.now, cur);
    const interest = Math.round(federalPart * ((1 + COLLECTION.interest / 365) ** late - 1));
    const total = federalPart + penalty + interest;
    if (item.payload.step === 'proposed') {
      if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `The IRS Figured Your ${r.year} Return`, body: `Notice CP2566: with no return from you, the IRS worked out ${formatMoney(total, cur)} from what your employers and banks reported, with the penalty for filing late and the interest. File your own within ${SUBSTITUTE.answerDays} days to replace it.`, importance: 90, route: '/workspace/papers' });
      s.schedule({ at: s.now + SUBSTITUTE.answerDays * MS_DAY, kind: TAX_SFR_KIND, label: `The IRS On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, step: 'assessed' } });
      return;
    }
    // Unanswered: assessed as the IRS figured it, and collected.
    r.filedAt = s.now;
    r.penalty = penalty;
    r.substitute = true;
    setOwed(r, { tax: federalPart, penalty, interest }, s.now);
    r.collection = 0;
    // Its File It lapsed on the due date (`expireDecisions`); the Taxes screen's is gone once it's filed.
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `The IRS Assessed Your ${r.year} Return`, body: `${formatMoney(total, cur)} is owed as the IRS figured it, and its collection begins.`, importance: 90, route: '/workspace/papers' });
    nextNotice(s, person, r);
  });

  // A state's letter on a return never filed, or its assessment (`stateNonFilerStep`, from 2026-10-11).
  sim.onSchedule(STATE_NONFILER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r || (r.filedAt !== undefined && !r.substitute)) return;
    const state = String(item.payload.state);
    stateNonFilerStep(s, person, r, state, Number(item.payload.step), owedToOf(person, r).states[state] ?? 0);
  });

  sim.onSchedule(TAX_NOTICE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r?.owed) return;
    // A payment plan in force or being decided stops collection (from 2026-10-10).
    if (person.taxPlan && ['pending', 'active', 'default'].includes(person.taxPlan.status)) return;
    accrue(r, s.now);
    const cur = saveCurrency(s.universe);
    const step = r.collection ?? 0;
    if (step < COLLECTION.notices.length) {
      const n = COLLECTION.notices[step]!;
      r.collection = step + 1;
      if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: n.title, body: `Notice ${n.code}: ${formatMoney(r.owed, cur)} on your ${r.year} return; ${n.words}`, importance: step >= 2 ? 90 : 75, route: '/workspace/papers' });
      nextNotice(s, person, r);
      return;
    }
    // The levy: what the bank accounts hold, to what's owed.
    const bank = drawFromBank(s, person, r.owed, false, true);
    const taken = r.owed - bank.short;
    if (taken > 0) {
      s.post({ memo: `IRS levy, ${r.year} return`, category: 'tax', postings: [{ accountId: s.nominalAccount('expense', expenseFor('tax')).id, amount: taken }, ...bank.postings] });
      applyPayment(s, person, r, taken, 'levy');
    }
    r.collection = step + 1;
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: 'The IRS Levied Your Accounts', body: `${formatMoney(taken, cur)} taken from your bank accounts for your ${r.year} return${(r.owed ?? 0) > 0 ? `; ${formatMoney(r.owed!, cur)} is still owed, and it levies again while it is` : ', which is now paid'}.`, importance: 95, route: '/workspace/papers' });
    if ((r.owed ?? 0) > 0) nextNotice(s, person, r);
  });

  sim.onSchedule(TAX_REFUND_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person) return;
    const account = payeeAccount(s, person);
    // Canada's refund of its withholding, under the treaty, beside the IRS's.
    const canada = item.payload.foreign === true ? r?.figures.foreignRefund ?? 0 : 0;
    if (canada) { s.post({ memo: `Canada Revenue Agency refund, ${r!.year}`, category: 'tax', postings: [{ accountId: account.id, amount: canada }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -canada }] }); return; }
    // A state's own refund, by the state (`payStateRefund`, from the integration pass of 2026-10-10).
    if (r && typeof item.payload.state === 'string') { payStateRefund(s, person, r, item.payload.state); return; }
    if (!r?.refund || r.refundedAt !== undefined) return;
    r.refundedAt = s.now;
    // Owed on another year, the IRS keeps what covers it (IRC 6402(a), from 2026-10-10; a plan's payments are still due).
    let back = r.refund;
    for (const other of Object.values(person.returns ?? {}).sort((a, b) => a.year - b.year)) {
      if (back <= 0 || !other.owed || other === r) continue;
      const take = Math.min(back, owedOn(other, s.now));
      s.post({ memo: `Tax refund, ${r.year}, applied to ${other.year}`, category: 'tax', postings: [{ accountId: s.nominalAccount('expense', expenseFor('tax')).id, amount: take }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -take }] });
      applyPayment(s, person, other, take, 'refund offset');
      back -= take;
      if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `Your ${r.year} Refund Went To ${other.year}`, body: `${formatMoney(take, saveCurrency(s.universe))} of it paid what you owe on ${other.year}.`, importance: 70, route: '/workspace/papers' });
    }
    // Then to the state on the return's address for its past-due income tax (IRC 6402(e)).
    back -= federalOffsetToState(s, person, stateOf(r.figures.cityId), back, r.year);
    if (back > 0) s.post({ memo: `Federal tax refund, ${r.year}`, category: 'tax', postings: [{ accountId: account.id, amount: back }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -back }] });
  });

  sim.onCommand<{ kind: 'short' | 'long'; monthly?: Money; directDebit?: boolean }, { status: string; decideAt: Instant; fee: Money }>('tax.apply_plan', (p, { sim: s }) => {
    const person = s.player;
    const kind = p?.kind === 'short' ? 'short' : 'long';
    const no = planRefusal(s, person, kind);
    if (no) throw new CommandError(no);
    const owed = owedAll(person, s.now);
    const cur = saveCurrency(s.universe);
    const directDebit = kind === 'long' ? p?.directDebit !== false : false;
    const monthly = kind === 'long' ? Math.round(Number(p?.monthly ?? leastMonthly(owed))) : undefined;
    if (monthly !== undefined && monthly < leastMonthly(owed)) throw new CommandError(`The least a month is ${formatMoney(leastMonthly(owed), cur)}, what’s owed over ${PLAN.leastMonths} months.`);
    const fee = planFee(s, person, kind, directDebit);
    // Online with a Social Security number, decided at once; without one, Form 9465 by mail.
    const online = hasSsn(person);
    const decideAt = online ? s.now + 60_000 : s.now + PLAN.mailDays * MS_DAY;
    const plan: TaxPlan = { kind, status: 'pending', appliedAt: s.now, decideAt, directDebit, fee, ...(monthly !== undefined ? { monthly } : {}), covers: owed, years: Object.values(person.returns ?? {}).filter((r) => r.owed).map((r) => r.year), history: [] };
    planNote(plan, s.now, online ? 'Applied online' : 'Form 9465 mailed: no Social Security number for the online application');
    person.taxPlan = plan;
    s.schedule({ at: decideAt, kind: TAX_PLAN_DECIDE_KIND, label: 'The IRS On Your Payment Plan', category: 'personal', priority: 25, payload: { personId: person.id } });
    return { status: plan.status, decideAt, fee };
  });

  sim.onSchedule(TAX_PLAN_DECIDE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const p = person?.taxPlan;
    if (!person || !p || p.status !== 'pending') return;
    // Decided on the day: a new unfiled return or a balance past its limit is refused, as the IRS would.
    p.status = 'refused';
    const no = planRefusal(s, person, p.kind);
    p.status = 'pending';
    if (no && !/payment plan|application/.test(no)) { p.status = 'refused'; p.why = no; planNote(p, s.now, `Refused: ${no}`); if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: 'The IRS Refused A Payment Plan', body: no, importance: 85, route: '/workspace/papers' }); return; }
    startPlan(s, person, p);
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: 'Your IRS Payment Plan Is Approved', body: p.kind === 'long' ? `${formatMoney(p.monthly!, saveCurrency(s.universe))} a month${p.directDebit ? ' by direct debit' : ''}, from ${formatDate(p.nextDue!, HOME)}. Interest goes on; ${Object.values(person.returns ?? {}).some((r) => r.reducedFrom === p.startedAt) ? 'the late-payment penalty halves while it stands' : 'the penalty stays at its full rate, since the return wasn’t filed on time'}. Collection has stopped.` : `Pay what’s owed by ${formatDate(p.payBy!, HOME)}; there’s no setup fee. Interest and the penalty go on.`, importance: 80, route: '/workspace/papers' });
  });

  sim.onSchedule(TAX_PLAN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const p = person?.taxPlan;
    if (!person || !p || p.status !== 'active') return;
    const cur = saveCurrency(s.universe);
    const owed = owedAll(person, s.now);
    if (owed <= 0) { endPlan(s, person, p, 'paid', 'Paid off'); return; }
    const due = p.kind === 'short' ? owed : Math.min(owed, p.monthly!);
    if (payFromBank(s, person, due, `IRS payment plan${p.kind === 'short' ? ', paid in full' : ''}`, 'tax')) {
      const paid = payPlan(s, person, due);
      planNote(p, s.now, 'A payment', paid);
      if (owedAll(person, s.now) <= 0) { endPlan(s, person, p, 'paid', 'Paid off'); return; }
      if (p.kind === 'long') { p.nextDue = s.now + 30 * MS_DAY; s.schedule({ at: p.nextDue, kind: TAX_PLAN_KIND, label: 'IRS Payment Plan: A Payment', category: 'personal', priority: 25, payload: { personId: person.id } }); return; }
    }
    // Missed: notice CP523, thirty days to catch up.
    p.status = 'default';
    p.defaultBy = s.now + PLAN.defaultDays * MS_DAY;
    planNote(p, s.now, 'A payment missed: CP523', due);
    s.schedule({ at: p.defaultBy, kind: TAX_PLAN_DEFAULT_KIND, label: 'IRS: Notice Of Intent To End The Plan', category: 'personal', priority: 25, payload: { personId: person.id } });
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: 'Notice CP523: A Payment Missed', body: `The bank couldn’t pay ${formatMoney(due, cur)}. Catch up by ${formatDate(p.defaultBy, HOME)}, on Papers, or the plan ends and collection resumes.`, importance: 90, route: '/workspace/papers' });
  });

  sim.onSchedule(TAX_PLAN_DEFAULT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const p = person?.taxPlan;
    if (!person || !p || p.status !== 'default') return;
    endPlan(s, person, p, 'ended', 'Ended: not caught up after CP523');
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: 'Your IRS Payment Plan Has Ended', body: 'It wasn’t caught up in its thirty days. Collection resumes on what’s owed: the final notice before a levy comes next.', importance: 95, route: '/workspace/papers' });
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('tax.catch_up_plan', (_p, { sim: s }) => {
    const person = s.player;
    const p = person.taxPlan;
    if (!p || p.status !== 'default') throw new CommandError('Your plan isn’t behind.');
    const due = Math.min(owedAll(person, s.now), p.kind === 'short' ? owedAll(person, s.now) : p.monthly!);
    if (!payFromBank(s, person, due, 'IRS payment plan, caught up', 'tax')) throw new CommandError(`${formatMoney(due, saveCurrency(s.universe))} is more than the bank can cover.`);
    payPlan(s, person, due);
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_PLAN_DEFAULT_KIND && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
    p.status = 'active';
    delete p.defaultBy;
    planNote(p, s.now, 'Caught up', due);
    if (owedAll(person, s.now) <= 0) { endPlan(s, person, p, 'paid', 'Paid off'); return { paid: due }; }
    if (p.kind === 'long' && !s.universe.scheduled.some((i) => i.status === 'pending' && i.kind === TAX_PLAN_KIND && i.payload.personId === person.id)) { p.nextDue = s.now + 30 * MS_DAY; s.schedule({ at: p.nextDue, kind: TAX_PLAN_KIND, label: 'IRS Payment Plan: A Payment', category: 'personal', priority: 25, payload: { personId: person.id } }); }
    return { paid: due };
  });

  sim.onCommand<{ monthly?: Money }, { monthly: Money; fee: Money }>('tax.revise_plan', (p, { sim: s }) => {
    const person = s.player;
    const plan = person.taxPlan;
    if (!plan || (plan.status !== 'active' && plan.status !== 'default') || plan.kind !== 'long') throw new CommandError('Only a monthly plan in force is revised.');
    const owed = owedAll(person, s.now);
    const cur = saveCurrency(s.universe);
    const monthly = Math.round(Number(p?.monthly ?? leastMonthly(owed)));
    if (monthly < leastMonthly(owed)) throw new CommandError(`The least a month is ${formatMoney(leastMonthly(owed), cur)}.`);
    if (owed > usd(PLAN.longMax, cur)) throw new CommandError(`More than ${formatMoney(usd(PLAN.longMax, cur), cur, { cents: false })} is owed now: a revision needs a financial statement SLATE doesn't model.`);
    const fee = usd(PLAN.reviseFee, cur);
    if (!payFromBank(s, person, fee, 'IRS payment plan revision fee', 'tax')) throw new CommandError(`The ${formatMoney(fee, cur)} fee is more than the bank can cover.`);
    plan.monthly = monthly;
    plan.covers = owed;
    if (plan.status === 'default') { plan.status = 'active'; delete plan.defaultBy; for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_PLAN_DEFAULT_KIND && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now); }
    planNote(plan, s.now, `Revised: ${formatMoney(monthly, cur)} a month`, fee);
    if (!s.universe.scheduled.some((i) => i.status === 'pending' && i.kind === TAX_PLAN_KIND && i.payload.personId === person.id)) { plan.nextDue = s.now + 30 * MS_DAY; s.schedule({ at: plan.nextDue, kind: TAX_PLAN_KIND, label: 'IRS Payment Plan: A Payment', category: 'personal', priority: 25, payload: { personId: person.id } }); }
    return { monthly, fee };
  });

  sim.onCommand<{ year: number }, { balance: Money; penalty: Money; paid: boolean }>('tax.file', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    if (!r) throw new CommandError('There’s no return for that year.');
    if (r.filedAt !== undefined && !r.substitute) throw new CommandError('You’ve filed it. A change is an amended return.');
    const cur = saveCurrency(s.universe);
    if (r.substitute) return reconsider(s, person, r);
    // Filed before the IRS assessed its substitute: the CP2566's proposal is replaced, and nothing of it is assessed; a
    // state's letters stop too.
    for (const one of s.universe.scheduled) if (one.status === 'pending' && (one.kind === TAX_SFR_KIND || one.kind === STATE_NONFILER_KIND) && one.payload.personId === person.id && one.payload.year === r.year) s.timeline.cancel(one.id, s.now);
    r.figures = figuresFor(person, r.year, cur, s.now);
    r.filedAt = s.now;
    r.penalty = latePenalty(r.figures.balance, r.due, s.now, cur);
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'return' && d.refId === String(r.year) && !d.resolvedAt) d.resolvedAt = s.now;
    if (r.figures.foreignRefund > 0) s.schedule({ at: s.now + RETURN.refundDays * MS_DAY, kind: TAX_REFUND_KIND, label: `Canada’s Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, foreign: true } });
    // Each state's side first, by its own rules (`fileState`, from the integration pass of 2026-10-10); then the IRS's,
    // which is what follows here. Until then one balance went to the IRS and its rules ran on all of it.
    const split = owedToOf(person, r);
    const stateTotal = Object.values(split.states).reduce((a, b) => a + b, 0);
    let statesPaid = true;
    // A state that assessed it already takes their own return in its place (`reconsiderState`, from 2026-10-11).
    for (const [state, amount] of Object.entries(split.states)) {
      if (r.stateDue?.[state]?.assessedBy) { reconsiderState(s, person, r, state, amount); statesPaid = !r.stateDue[state]!.owed && statesPaid; continue; }
      statesPaid = fileState(s, person, r, state, amount).paid && statesPaid;
    }
    const irs = split.irs;
    r.penalty = latePenalty(irs, r.due, s.now, cur);
    if (irs < 0) {
      r.refund = -irs;
      // A nonresident with no Social Security number files with a W-7 for an ITIN, and the return waits for it: seven
      // weeks more before the refund (`systems/taxid.ts`, from 2026-10-10).
      const itin = r.figures.form === '1040-NR' && !hasSsn(person) ? SSN.itinWeeks * 7 : 0;
      r.refundAt = s.now + (RETURN.refundDays + itin) * MS_DAY;
      s.schedule({ at: r.refundAt, kind: TAX_REFUND_KIND, label: `Tax Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year } });
      return { balance: r.figures.balance, penalty: 0, paid: statesPaid };
    }
    // Interest runs from the due date on a balance filed late.
    const late = Math.max(0, (s.now - r.due) / MS_DAY);
    const interest = irs > 0 ? Math.round(irs * ((1 + COLLECTION.interest / 365) ** late - 1)) : 0;
    const total = Math.max(0, irs) + r.penalty + interest;
    const paid = total <= 0 || payFromBank(s, person, total, `Federal income tax, ${r.year}${r.penalty || interest ? ', with late penalties and interest' : ''}`, 'tax');
    if (!paid) {
      setOwed(r, { tax: irs, penalty: r.penalty, interest }, s.now);
      // Under a payment plan, another year's balance joins it or puts it in default (`newLiability`, from 2026-10-10).
      if (person.taxPlan?.status === 'active') { if (r.filedAt <= r.due) r.reducedFrom = s.now; newLiability(s, person, total); }
      else { r.collection = 0; nextNotice(s, person, r); }
    }
    else if (total > 0) r.paidTax = irs;
    void stateTotal;
    return { balance: r.figures.balance, penalty: r.penalty, paid: paid && statesPaid };
  });

  /**
   * A payment on a balance owed, the whole or a part (from 2026-10-10: until then the whole or nothing): applied to the
   * tax, then the penalty, then the interest (`applyPayment`), which keeps the next months' penalty on the tax left.
   */
  sim.onCommand<{ year: number; amount?: Money }, { paid: Money; owed: Money; tax: Money; penalty: Money; interest: Money }>('tax.pay', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    if (!r?.owed) throw new CommandError('That year is paid.');
    const cur = saveCurrency(s.universe);
    const total = owedOn(r, s.now);
    const amount = p.amount === undefined ? total : Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Pay something.');
    if (amount > total) throw new CommandError(`${formatMoney(total, cur)} is owed; pay that or less.`);
    if (!payFromBank(s, person, amount, `Income tax owed, ${r.year}${amount < total ? ', in part' : ''}`, 'tax')) throw new CommandError(`${formatMoney(amount, cur)} is more than the bank can cover.`);
    const split = applyPayment(s, person, r, amount, 'payment');
    return { paid: amount, owed: r.owed ?? 0, ...split };
  });

  /**
   * An amended return (from 2026-10-10): Form 1040-X, with a 1040-NR behind it for a nonresident, within three years of
   * filing or two of paying; the IRS takes eight to twelve weeks, sixteen at most (SLATE takes ten). More owed is added
   * with interest from the due date; less comes off what's owed, and the rest back with the IRS's interest on it.
   */
  sim.onCommand<{ year: number }, { change: Money; processAt: Instant; form: string }>('tax.amend', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    const no = amendRefusal(s, r);
    if (no) throw new CommandError(no);
    const figures = figuresFor(person, r!.year, saveCurrency(s.universe), s.now);
    const change = figures.balance - r!.figures.balance;
    // Each authority's change (from the integration pass of 2026-10-10): the 1040-X's and each state's amended return's.
    const was = owedToOf(person, r!);
    const now = figures.owedTo!;
    const byState = [...new Set([...Object.keys(was.states), ...Object.keys(now.states)])].map((st) => [st, (now.states[st] ?? 0) - (was.states[st] ?? 0)] as const).filter(([, d]) => d !== 0);
    if (change === 0 && now.irs === was.irs && !byState.length) throw new CommandError('Your return as filed matches what’s on record: there’s nothing to amend.');
    const form = figures.form === '1040-NR' ? '1040-X with 1040-NR' as const : '1040-X' as const;
    const processAt = s.now + AMEND.weeks * 7 * MS_DAY;
    (r!.amended ??= []).push({ form, at: s.now, figures, change, processAt, irs: now.irs - was.irs, ...(byState.length ? { states: Object.fromEntries(byState) } : {}) });
    s.schedule({ at: processAt, kind: TAX_AMEND_KIND, label: `Your Amended ${r!.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r!.year } });
    return { change, processAt, form };
  });

  sim.onSchedule(TAX_AMEND_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    const a = r?.amended?.find((x) => x.processedAt === undefined);
    if (!person || !r || !a) return;
    a.processedAt = s.now;
    const cur = saveCurrency(s.universe);
    r.figures = a.figures;
    // Each state's change, by the state (from the integration pass of 2026-10-10): more owed added with its interest
    // and late-payment penalty from the due date; less off what's owed to it, and the rest refunded.
    for (const [state, d] of Object.entries(a.states ?? {})) amendState(s, person, r, state, d);
    // The IRS's change: a return amended before the split carries none, and its whole change is the IRS's as it was.
    const federal = a.irs ?? a.change;
    if (federal === 0) { if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `Your Amended ${r.year} Return Is Processed`, body: `The federal tax didn’t change; each state’s is on Papers.`, importance: 70, route: '/workspace/papers' }); return; }
    a.change = federal;
    if (a.change > 0) {
      const days = Math.max(0, (s.now - r.due) / MS_DAY);
      const interest = Math.round(a.change * ((1 + COLLECTION.interest / 365) ** days - 1));
      accrue(r, s.now);
      const p = partsOf(r);
      const had = !!r.owed;
      setOwed(r, { tax: p.tax + a.change, penalty: p.penalty, interest: p.interest + interest }, s.now);
      a.interest = interest;
      // Under a payment plan, the new tax joins it or puts it in default (`newLiability`); otherwise collection.
      if (person.taxPlan?.status === 'active') { if (r.filedAt !== undefined && r.filedAt <= r.due && !r.substitute) r.reducedFrom ??= s.now; newLiability(s, person, a.change + interest); }
      else if (!had) { r.collection = 0; nextNotice(s, person, r); }
      if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `Your Amended ${r.year} Return Is Processed`, body: `Form ${a.form}: ${formatMoney(a.change, cur)} more tax, with ${formatMoney(interest, cur)} of interest from the due date. ${formatMoney(r.owed ?? 0, cur)} is owed on the year.`, importance: 85, route: '/workspace/papers' });
      return;
    }
    let back = -a.change;
    const offset = Math.min(back, r.owed ? owedOn(r, s.now) : 0);
    if (offset > 0) { applyPayment(s, person, r, offset, 'refund offset'); back -= offset; }
    const interest = back > 0 ? Math.round(back * ((1 + COLLECTION.interest / 365) ** (Math.max(0, s.now - Math.max(r.due, r.filedAt ?? r.due)) / MS_DAY) - 1)) : 0;
    a.refund = back;
    a.interest = interest;
    if (back + interest > 0) s.post({ memo: `Tax refund, amended ${r.year} return${interest ? ', with interest' : ''}`, category: 'tax', postings: [{ accountId: payeeAccount(s, person).id, amount: back + interest }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -back }, ...(interest ? [{ accountId: s.nominalAccount('income', 'Interest').id, amount: -interest }] : [])] });
    if (interest) yearOf(person, zonedParts(s.now, HOME).year).interest = (yearOf(person, zonedParts(s.now, HOME).year).interest ?? 0) + interest;
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `Your Amended ${r.year} Return Is Processed`, body: `Form ${a.form}: ${formatMoney(-a.change, cur)} less tax.${offset > 0 ? ` ${formatMoney(offset, cur)} of it went to what was owed on the year.` : ''}${back > 0 ? ` ${formatMoney(back + interest, cur)} is refunded, ${formatMoney(interest, cur)} of it the IRS’s interest, which is taxable.` : ''}`, importance: 85, route: '/workspace/papers' });
  });
}

/** How long an amended return takes: eight to twelve weeks, up to sixteen (IRS); SLATE takes ten. Three years to file one. */
export const AMEND = { weeks: 10, years: 3, paidYears: 2, source: 'https://www.irs.gov/filing/wheres-my-amended-return; IRC 6511(a)' } as const;
export const TAX_AMEND_KIND = 'tax.amended';

/** Why a year's return can't be amended now, or nothing. */
export function amendRefusal(sim: Simulation, r: TaxReturn | undefined): string | undefined {
  if (!r) return 'There’s no return for that year.';
  if (r.filedAt === undefined) return 'It isn’t filed: file it.';
  if (r.substitute) return 'The IRS filed this one: file your own to replace it.';
  if (r.amended?.some((a) => a.processedAt === undefined)) return 'An amended return for the year is with the IRS.';
  const paid = r.payments?.at(-1)?.at ?? r.filedAt;
  const by = Math.max(r.filedAt + AMEND.years * 365.25 * MS_DAY, paid + AMEND.paidYears * 365.25 * MS_DAY);
  if (sim.now > by) return `The time to amend it ran out on ${formatDate(by, HOME)}.`;
  return undefined;
}

/** The IRS's substitute figures: their own return's, without the credits only their own return claims. */
export function sfrFigures(f: ReturnFigures): ReturnFigures {
  const unclaimed = f.foreignCredit + Math.max(0, f.credit);
  return { ...f, foreignCredit: 0, credit: Math.min(0, f.credit), balance: f.balance + unclaimed };
}

/**
 * Their own return in place of an assessed substitute, a reconsideration (from 2026-10-10): the tax becomes what their
 * return says, less what's been paid toward it; the penalty and interest charged on the substitute fall in proportion;
 * and anything paid past it comes back. Before 2026-10-10 an assessed substitute couldn't be answered at all.
 */
function reconsider(sim: Simulation, person: Person, r: TaxReturn): { balance: Money; penalty: Money; paid: boolean } {
  const cur = saveCurrency(sim.universe);
  accrue(r, sim.now);
  const own = figuresFor(person, r.year, cur, sim.now);
  // The IRS reconsiders its own part (from the integration pass of 2026-10-10); each state's is filed now, for the first time.
  for (const [state, amount] of Object.entries(own.owedTo!.states)) {
    if (r.stateDue?.[state]?.assessedBy) reconsiderState(sim, person, r, state, amount);
    else if (!r.stateDue?.[state]?.filedAt) fileState(sim, person, r, state, amount);
  }
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_NONFILER_KIND && one.payload.personId === person.id && one.payload.year === r.year) sim.timeline.cancel(one.id, sim.now);
  const ownIrs = own.owedTo!.irs;
  const was = r.substituteFigures ? Math.max(0, owedToOf(person, r).irs + (r.substituteFigures.balance - r.figures.balance)) : owedToOf(person, r).irs;
  const paidTax = r.paidTax ?? 0;
  const p = partsOf(r);
  const ratio = was > 0 ? Math.max(0, ownIrs) / was : 1;
  const tax = Math.max(0, ownIrs - paidTax);
  setOwed(r, { tax, penalty: Math.round(p.penalty * ratio), interest: Math.round(p.interest * ratio) }, sim.now);
  r.penalty = Math.round((r.penalty ?? 0) * ratio);
  const over = paidTax - Math.max(0, ownIrs);
  if (over > 0) sim.post({ memo: `Tax refund, ${r.year}: the IRS’s return replaced by yours`, category: 'tax', postings: [{ accountId: payeeAccount(sim, person).id, amount: over }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -over }] });
  r.figures = own;
  r.substitute = false;
  r.reconsideredAt = sim.now;
  if (!r.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year) sim.timeline.cancel(one.id, sim.now);
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'return' && d.refId === String(r.year) && !d.resolvedAt) d.resolvedAt = sim.now;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title: `Your ${r.year} Return Replaces The IRS’s`, body: `The IRS reconsidered its assessment on your own return: ${formatMoney(ownIrs, cur)} of federal tax for the year against its ${formatMoney(was, cur)}. ${r.owed ? `${formatMoney(r.owed, cur)} is still owed, the penalty and interest in proportion.` : over > 0 ? `${formatMoney(over, cur)} you paid past it comes back.` : 'Nothing more is owed.'}`, importance: 85, route: '/workspace/papers' });
  return { balance: own.balance, penalty: r.penalty ?? 0, paid: !r.owed };
}

/** A state's change on an amended return, processed: more owed added from the due date, less taken off and refunded. */
function amendState(sim: Simulation, person: Person, r: TaxReturn, state: string, change: Money): void {
  const sd = (stateDuesOf(r)[state] ??= { state, balance: 0 });
  const cur = saveCurrency(sim.universe);
  sd.balance += change;
  if (change > 0) {
    // As if it had been on the return: its tax from the due date, with what the state charges since.
    const added: StateDue = { state, balance: change, parts: { tax: change, penalty: 0, interest: 0 }, owed: change, accruedAt: r.due, payLateRate: 0, interestMonths: 0 };
    accrueState(added, r.due, sim.now);
    if (sd.owed) { accrueState(sd, r.due, sim.now); sd.parts = { tax: sd.parts!.tax + added.parts!.tax, penalty: sd.parts!.penalty + added.parts!.penalty, interest: sd.parts!.interest + added.parts!.interest }; sd.owed = sd.parts.tax + sd.parts.penalty + sd.parts.interest; }
    else { Object.assign(sd, { parts: added.parts, owed: added.owed, accruedAt: sim.now, payLateRate: added.payLateRate, interestMonths: added.interestMonths }); sd.collection = 0; stateNextNotice(sim, person, r, state); }
    statePlanNewBalance(sim, person, state, added.owed!);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title: `${stateName(state)} Processed Your Amended ${r.year} Return`, body: `${formatMoney(change, cur)} more ${stateName(state)} tax, with what it charges from the due date: ${formatMoney(added.owed!, cur)} in all.`, importance: 80, route: '/workspace/papers' });
    return;
  }
  let back = -change;
  const offset = Math.min(back, sd.owed ? stateOwedOn(sd, r.due, sim.now) : 0);
  if (offset > 0) { applyStatePayment(sim, person, r, state, offset, 'refund offset'); back -= offset; }
  if (back > 0) sim.post({ memo: `${stateName(state)} tax refund, amended ${r.year} return`, category: 'tax', postings: [{ accountId: payeeAccount(sim, person).id, amount: back }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -back }] });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title: `${stateName(state)} Processed Your Amended ${r.year} Return`, body: `${formatMoney(-change, cur)} less ${stateName(state)} tax.${offset > 0 ? ` ${formatMoney(offset, cur)} went to what was owed to it.` : ''}${back > 0 ? ` ${formatMoney(back, cur)} is refunded.` : ''}`, importance: 80, route: '/workspace/papers' });
}

/**
 * A save from before the split, opened (from the integration pass of 2026-10-10): each return's one balance divided
 * between the IRS and the states, without losing a cent, inventing debt, or charging twice.
 * - Its split is worked out from its own lines (`owedToFrom`), the withholding divided by the calculation that made it.
 * - What was still owed, in its parts, is divided between the authorities owed in proportion to each one's balance on
 *   the return: the payments made against the one balance weren't kept by authority, so this is SLATE's division, said
 *   on the return (`split`). The sum is the old balance to the cent; the IRS keeps its collection where it was; each
 *   state's begins now, at its first notice.
 * - A refund not yet paid is divided the same way among the authorities due back, each paid on its day by its own.
 * - An IRS plan covering the year covers its federal part only from now, said in the plan's history.
 * Run once: a return with `split` or a state side is left alone.
 */
export function splitReturns(sim: Simulation, person: Person): void {
  let moved = 0;
  for (const r of Object.values(person.returns ?? {})) {
    // A return figured since the split carries its own (`owedTo`): only one from before is divided.
    if (r.split || r.stateDue || r.filedAt === undefined || r.figures.owedTo) continue;
    const to = owedToOf(person, r);
    const statesOwed = Object.entries(to.states).filter(([, v]) => v > 0);
    const statesDue = Object.entries(to.states).filter(([, v]) => v < 0);
    if (!statesOwed.length && !statesDue.length) continue;
    r.figures.owedTo = to;
    const how = `Kept as one balance before ${formatDate(sim.now, HOME)}; divided ${to.derived ? 'with the withholding worked out from the paychecks’ tax table, and ' : ''}in proportion to each authority’s part of the return`;
    r.split = { at: sim.now, how };
    const sides = stateDuesOf(r);
    for (const [state, v] of Object.entries(to.states)) sides[state] = { state, balance: v, filedAt: r.filedAt, migrated: { at: sim.now, how } };
    // Owed: the parts divided among the authorities owed, by their balances on the return.
    if (r.owed && statesOwed.length) {
      accrue(r, sim.now);
      const p = partsOf(r);
      const weights: [string, number][] = [['irs', Math.max(0, to.irs)], ...statesOwed];
      const total = weights.reduce((s, [, w]) => s + w, 0);
      const shares = (amount: Money) => { const out: Record<string, Money> = {}; let left = amount; weights.forEach(([k, w], i) => { const v = i === weights.length - 1 ? left : Math.round(amount * (w / Math.max(1, total))); out[k] = v; left -= v; }); return out; };
      const tax = shares(p.tax), penalty = shares(p.penalty), interest = shares(p.interest);
      for (const [state] of statesOwed) {
        const sd = sides[state]!;
        sd.parts = { tax: tax[state]!, penalty: penalty[state]!, interest: interest[state]! };
        sd.owed = sd.parts.tax + sd.parts.penalty + sd.parts.interest;
        if (!sd.owed) { delete sd.owed; delete sd.parts; continue; }
        // What the state charges runs from here on, not again on what was charged.
        sd.accruedAt = sim.now;
        const rules = rulesOf(state);
        sd.payLateRate = rules ? Math.min(rules.payLate.cap, rules.payLate.once + rules.payLate.monthly * Math.min(rules.payLate.months ?? Infinity, Math.ceil(Math.max(0, sim.now - r.due) / (30.4375 * MS_DAY)))) : 0;
        sd.interestMonths = Math.ceil(Math.max(0, sim.now - r.due) / (30.4375 * MS_DAY));
        sd.collection = 0;
        stateNextNotice(sim, person, r, state);
        moved += sd.owed;
      }
      setOwed(r, { tax: tax.irs!, penalty: penalty.irs!, interest: interest.irs! }, sim.now);
      r.base = r.parts?.tax ?? 0;
      if (!r.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year) sim.timeline.cancel(one.id, sim.now);
    }
    // A refund not yet paid: divided among those due back, each paid on its day by its own.
    if (r.refund && r.refundedAt === undefined && r.refundAt !== undefined && r.refundAt > sim.now && statesDue.length) {
      const weights: [string, number][] = [['irs', Math.max(0, -to.irs)], ...statesDue.map(([k, v]) => [k, -v] as [string, number])];
      const total = weights.reduce((s, [, w]) => s + w, 0);
      let left = r.refund;
      weights.forEach(([k, w], i) => {
        const v = i === weights.length - 1 ? left : Math.round(r.refund! * (w / Math.max(1, total)));
        left -= v;
        if (k === 'irs') return;
        sides[k]!.refund = v;
        sides[k]!.refundAt = r.refundAt;
        sim.schedule({ at: r.refundAt!, kind: TAX_REFUND_KIND, label: `${stateName(k)} Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state: k } });
      });
      r.refund = r.refund - Object.values(sides).reduce((s, sd) => s + (sd.refund ?? 0), 0);
    }
  }
  if (moved > 0 && person.taxPlan && ['pending', 'active', 'default'].includes(person.taxPlan.status)) {
    const p = person.taxPlan;
    p.covers = owedAll(person, sim.now);
    planNote(p, sim.now, 'A state’s tax taken out: an IRS plan covers federal tax only', moved);
  }
}
