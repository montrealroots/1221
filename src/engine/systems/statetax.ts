/**
 * SLATE — a state's own side of a year's return (from the integration pass of 2026-10-10): what it assessed, what's
 * still owed to it in its parts, every payment and how it was applied, its notices and its levy, its refund and the
 * offset it makes first, and its own payment plan. The federal side stays the return's own fields (`systems/taxreturn.ts`),
 * the IRS's alone now. Each state runs by its own rules (`content/statetax.ts`); one SLATE hasn't researched keeps its
 * balance and adds nothing.
 */
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { STATE_TAX, STATE_UNRESEARCHED, type Part, type StateCode, type StateRules } from '../content/statetax';
import { deadline, type OwedParts, type TaxReturn } from './taxreturn';
import { drawFromBank, expenseFor, inTheBank, payFromBank } from './spending';
import { payeeAccount } from './cash';

const HOME = 'America/New_York';
const MONTH = 30.4375 * MS_DAY;
const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);

export const STATE_NOTICE_KIND = 'tax.state_notice';
export const STATE_PLAN_KIND = 'tax.state_plan_payment';
export const STATE_PLAN_END_KIND = 'tax.state_plan_end';

/** A state's side of a year's return. */
export interface StateDue {
  state: string;
  /** What the return assessed for it after its withholding and credits: owed positive, due back negative. */
  balance: Money;
  filedAt?: Instant;
  /** What's owed now, in its parts, as of \`accruedAt\`; the late-payment penalty's share charged so far, and the months of simple interest. */
  owed?: Money;
  parts?: OwedParts;
  accruedAt?: Instant;
  payLateRate?: number;
  interestMonths?: number;
  /** The late-filing penalty assessed with it. */
  penalty?: Money;
  payments?: { at: Instant; amount: Money; tax: Money; penalty: Money; interest: Money; how: 'payment' | 'levy' | 'refund offset' | 'plan' }[];
  /** Its notices sent so far (then its levies). */
  collection?: number;
  refund?: Money;
  refundAt?: Instant;
  refundedAt?: Instant;
  /** A balance kept as one with the federal before the split, divided when the save was opened (\`splitReturns\`). */
  migrated?: { at: Instant; how: string };
  /** The late-filing penalty's share of the tax, which a combined cap holds the late-payment penalty under (from 2026-10-11). */
  fileLateRate?: number;
  /** The least the late-payment penalty is once it runs, in the save's currency (Colorado's $5). */
  minPenalty?: Money;
  /** Interest added to the principal at the last 1 January (Arizona's), still unpaid. */
  compounded?: Money;
  /** When its first notice came, and when a plan was first asked for it: what a raised rate reads. */
  noticedAt?: Instant;
  planAskedAt?: Instant;
  /** Assessed by the state on a return never filed (`assessStateNonFiler`, from 2026-10-11), and when their own replaced it. */
  assessedBy?: { at: Instant };
  replacedAt?: Instant;
  /** Its lien, from its notice of intent to its release or withdrawal (`fileStateLien`, from the remaining-gaps pass). */
  lien?: Lien;
  /** Oregon's penalty for three years running unfiled, as charged and as waived (`threeYearCheck`, from 2026-10-11). */
  threeYear?: { at: Instant; amount: Money; waived?: Money; waivedAt?: Instant };
  /** A non-filer's letters sent before it was assessed or filed: what Oregon's waiver schedule reads. */
  lettersSent?: number;
}

/**
 * A tax lien's record (from the remaining-gaps pass of 2026-10-11): what it is, why it was filed (`trigger`: collection
 * reached its step, or a plan asked it), what it secured, where and when it was recorded, its fees, and how it ended:
 * released after payment in full, or withdrawn as filed in error on the taxpayer's request. The IRS's notice of federal
 * tax lien is kept the same way on the return (`TaxReturn.lien`).
 */
export interface Lien {
  name: string;
  status: 'intent' | 'filed' | 'paid' | 'released' | 'disputed' | 'withdrawn' | 'dropped';
  trigger: 'collection' | 'plan';
  amount: Money;
  recordedAt: string;
  intentAt?: Instant;
  filedAt?: Instant;
  fee: Money;
  paidAt?: Instant;
  releaseDue?: Instant;
  releasedAt?: Instant;
  disputedAt?: Instant;
  decideAt?: Instant;
  withdrawnAt?: Instant;
  history: { at: Instant; what: string; amount?: Money }[];
}

/** A state's payment plan, every year owed to it together. */
export interface StatePlan {
  state: string;
  status: 'pending' | 'active' | 'missed' | 'ended' | 'paid' | 'declined';
  appliedAt: Instant;
  /** A longer arrangement (Pennsylvania's extended plan, Louisiana's formal agreement, New Mexico's 13 to 72 months), and the statement it was asked with. */
  long?: { name: string; statement?: FinancialStatement };
  /** What was paid down with the request. */
  down?: Money;
  decideAt: Instant;
  months: number;
  monthly: Money;
  fee: Money;
  covers: Money;
  nextDue?: Instant;
  endsBy?: Instant;
  why?: string;
  history: { at: Instant; what: string; amount?: Money }[];
}

export const rulesOf = (state: string): StateRules | undefined => STATE_TAX[state as StateCode];
export const stateDuesOf = (r: TaxReturn): Record<string, StateDue> => (r.stateDue ??= {});
/**
 * A state return's due date, from which its penalty, interest and collection run: the federal return's, except that a
 * 1040-NR's 15 June (`nonresidentDeadline`, for a year without wages) is the resident's date for the state, 15 April or
 * the next business day in Washington (`deadline`). Connecticut's return, resident or nonresident, is due “on or before the
 * fifteenth day of the fourth month following the close of the taxpayer's taxable year” (Conn. Gen. Stat. 12-719(a),
 * read at codes.findlaw.com on 2026-10-15), and DRS moves it past Emancipation Day as the IRS does (Form CT-1040NR/PY
 * instructions for 2017, filed by 17 April 2018; DRS's Nonresident and Part-Year Resident Tax Information page, read at
 * portal.ct.gov on 2026-10-15, gives 15 April and no other date for a nonresident alien). Until 2026-10-15 the states
 * read the federal return's own due date, which for a 1040-NR with no wages is 15 June (`nonresidentDeadline`), so such
 * a year's Connecticut penalty, interest and bill waited two months past Connecticut's date
 * (tests/scope-taxpapers.test.ts). The other states in `STATE_TAX` take the same date as SLATE's reading: their own
 * due dates weren't read on 2026-10-15, and every played life files in Connecticut alone.
 */
export const stateDueOf = (r: TaxReturn): Instant => (r.figures?.form === '1040-NR' ? Math.min(r.due, deadline(r.year)) : r.due);
export const agencyOf = (state: string): string => rulesOf(state)?.short ?? `${stateName(state)}’s revenue department`;
export const stateName = (state: string): string => ({ 'us-ct': 'Connecticut', 'us-ny': 'New York', 'us-ca': 'California', 'us-il': 'Illinois', 'us-ma': 'Massachusetts', 'us-ga': 'Georgia', 'us-co': 'Colorado', 'us-or': 'Oregon', 'us-az': 'Arizona', 'us-nc': 'North Carolina', 'us-la': 'Louisiana', 'us-nm': 'New Mexico', 'us-hi': 'Hawaii', 'us-nj': 'New Jersey', 'us-pa': 'Pennsylvania', 'us-mi': 'Michigan', 'us-oh': 'Ohio', 'us-ut': 'Utah', 'us-in': 'Indiana', 'us-dc': 'District of Columbia', 'us-ok': 'Oklahoma', 'us-pa-philadelphia': 'Philadelphia', 'us-oh-columbus': 'Columbus', 'us-or-portland': 'Portland' } as Record<string, string>)[state] ?? state;

const monthsBegun = (from: Instant, to: Instant) => Math.ceil(Math.max(0, to - from) / MONTH);

/** The late-payment rule a return's due date takes: North Carolina's changes for returns due from 1 July 2027. */
function payLateFor(rules: StateRules, due: Instant): StateRules['payLate'] {
  const f = rules.payLate.from;
  return f && due >= Date.parse(`${f.due}T00:00:00Z`) ? { once: f.once, monthly: f.monthly, cap: f.cap } : rules.payLate;
}

/**
 * The late-payment penalty's share by a moment, from the due date: once, then a share a month or part, to its cap; or
 * by its steps, the share reached by days past the due date (Illinois's, Hawaii's, from 2026-10-11).
 */
export function statePayLateRate(rules: StateRules, due: Instant, at: Instant): number {
  if (at <= due) return 0;
  const p = payLateFor(rules, due);
  if (p.steps) { const days = (at - due) / MS_DAY; return Math.min(p.cap, Math.max(0, ...p.steps.filter((s) => days > s.afterDays).map((s) => s.rate))); }
  const months = Math.min(p.months ?? Number.POSITIVE_INFINITY, monthsBegun(due, at));
  return Math.min(p.cap, p.once + p.monthly * months);
}

/**
 * The late-payment share a balance takes at a moment: none on a return filed late where the state charges only the
 * late-filing penalty then (Hawaii's), and held under a combined cap with the late-filing penalty's (Arizona's,
 * Georgia's, Louisiana's).
 */
function payLateShare(sd: StateDue, rules: StateRules, due: Instant, at: Instant): number {
  if (rules.payLate.timelyOnly && sd.filedAt !== undefined && sd.filedAt > due) return 0;
  const r = statePayLateRate(rules, due, at);
  return rules.fileLate.combine === 'combined-cap' ? Math.min(r, Math.max(0, (rules.fileLate.combinedCap ?? 1) - (sd.fileLateRate ?? 0))) : r;
}

/** The late-payment penalty a share comes to on the tax: not less than its minimum once it runs (Colorado's $5). */
const payLateAmount = (sd: StateDue, share: number, tax: Money) => (share > 0 ? Math.max(sd.minPenalty ?? 0, share * tax) : 0);

/** When a raised rate begins: so many days after the first notice, unless a plan was asked for by then where that keeps it. */
function raisedFrom(sd: StateDue, rules: StateRules): Instant | undefined {
  const r = rules.interest.raised;
  if (!r || sd.noticedAt === undefined) return undefined;
  const from = sd.noticedAt + r.afterDays * MS_DAY;
  return r.unlessPlan && sd.planAskedAt !== undefined && sd.planAskedAt <= from ? undefined : from;
}

/** The next 1 January after a moment, at midnight in New Haven. */
function nextJanuary(at: Instant): Instant {
  const y = new Date(at).getUTCFullYear();
  for (const year of [y, y + 1]) { const t = Date.parse(`${year}-01-01T05:00:00Z`); if (t > at) return t; }
  return Date.parse(`${y + 2}-01-01T05:00:00Z`);
}

/**
 * What's owed to a state at a moment, in its parts: its interest and its late-payment penalty since last brought up to
 * date; and for Arizona's, the interest added to the principal by then.
 */
function stateAccrual(sd: StateDue, due: Instant, at: Instant): { parts: OwedParts; compounded: Money } {
  if (!sd.owed || !sd.parts) return { parts: { tax: 0, penalty: 0, interest: 0 }, compounded: 0 };
  const rules = rulesOf(sd.state);
  const p = sd.parts;
  if (!rules) return { parts: { ...p }, compounded: sd.compounded ?? 0 };
  const from = sd.accruedAt ?? at;
  const penalty = p.penalty + Math.max(0, payLateAmount(sd, payLateShare(sd, rules, due, at), p.tax) - payLateAmount(sd, sd.payLateRate ?? 0, p.tax));
  let interest = p.interest;
  let compounded = Math.min(sd.compounded ?? 0, p.interest);
  const start = Math.max(from, due);
  const i = { ...rules.interest, onPenalty: rules.interest.onPenalty || (rules.interest.onPenaltyFromStep !== undefined && (sd.collection ?? 0) >= rules.interest.onPenaltyFromStep) };
  if (i.how === 'daily') {
    // From the due date at the earliest: none on a balance before it's due.
    const base = p.tax + p.interest + (i.onPenalty ? p.penalty : 0);
    interest += base * ((1 + i.yearly / 365) ** (Math.max(0, at - start) / MS_DAY) - 1);
  } else if (i.how === 'daily-simple') {
    // Simple, by the day, at the raised rate from when it's raised (Colorado's, Oregon's, from 2026-10-11).
    const base = p.tax + (i.onPenalty ? p.penalty : 0);
    const raised = raisedFrom(sd, rules);
    const days = (a: Instant, b: Instant) => Math.max(0, b - a) / MS_DAY;
    if (i.byYear) {
      // A rate for each calendar year, the year's own where it changes (Indiana's, from 2026-10-11).
      for (let a = start; a < at;) { const b = Math.min(at, nextJanuary(a)); interest += base * (i.byYear[new Date(a + 5 * 3_600_000).getUTCFullYear()] ?? i.yearly) * days(a, b) / 365; a = b; }
    } else if (raised === undefined || raised >= at) interest += base * i.yearly * days(start, at) / 365;
    else if (raised <= start) interest += base * i.raised!.yearly * days(start, at) / 365;
    else interest += base * (i.yearly * days(start, raised) + i.raised!.yearly * days(raised, at)) / 365;
  } else if (i.how === 'yearly') {
    // Simple through the year, the year's unpaid interest added to the principal each 1 January (Arizona's, from 2026-10-11).
    for (let a = start; a < at;) {
      const jan = nextJanuary(a);
      const b = Math.min(at, jan);
      interest += (p.tax + compounded + (i.onPenalty ? p.penalty : 0)) * i.yearly * (b - a) / MS_DAY / 365;
      if (b === jan) compounded = interest;
      a = b;
    }
  } else {
    // A month or part from the due date, simple, on the tax (and the penalties, Hawaii's): the months begun since those
    // already charged. Each month's to the cent (SLATE's reading of “per month”, from 2026-10-15), so what's charged
    // doesn't hang on how often it was brought up to date, and the whole's rounding below leaves it whole. Until then it
    // ran in fractions of a cent and the whole was rounded, so the interest took a cent of the penalty's rounding:
    // Connecticut's bill on $585.33 was $649.72, its interest $5.86, where 1% of the tax is $5.85 and the bill $649.71
    // (Conn. Gen. Stat. 12-735), and three months read at once from the bill were $17.57 (tests/scope-taxpapers.test.ts).
    const months = monthsBegun(due, at) - (sd.interestMonths ?? 0);
    interest += Math.max(0, months) * Math.round((i.yearly / 12) * (p.tax + (i.onPenalty ? p.penalty : 0)));
  }
  const whole = Math.round(p.tax + penalty + interest);
  return { parts: { tax: p.tax, penalty: Math.round(penalty), interest: whole - p.tax - Math.round(penalty) }, compounded: Math.round(Math.min(compounded, interest)) };
}

/** What's owed to a state at a moment, in its parts. */
export function statePartsOn(sd: StateDue, due: Instant, at: Instant): OwedParts {
  return stateAccrual(sd, due, at).parts;
}

export const stateOwedOn = (sd: StateDue, due: Instant, at: Instant): Money => {
  const p = statePartsOn(sd, due, at);
  return p.tax + p.penalty + p.interest;
};

/** Brought up to a moment: its parts, the penalty's share charged, the months of interest charged. */
export function accrueState(sd: StateDue, due: Instant, at: Instant): void {
  if (!sd.owed || !sd.parts) return;
  const rules = rulesOf(sd.state);
  const now = stateAccrual(sd, due, at);
  sd.parts = now.parts;
  if (rules?.interest.how === 'yearly') sd.compounded = now.compounded;
  if (rules) {
    sd.payLateRate = Math.max(sd.payLateRate ?? 0, payLateShare(sd, rules, due, at));
    if (rules.interest.how === 'monthly-simple') sd.interestMonths = Math.max(sd.interestMonths ?? 0, monthsBegun(due, at));
  }
  sd.owed = sd.parts.tax + sd.parts.penalty + sd.parts.interest;
  sd.accruedAt = at;
}

function setStateOwed(sd: StateDue, parts: OwedParts, at: Instant): void {
  sd.parts = parts;
  sd.owed = parts.tax + parts.penalty + parts.interest;
  sd.accruedAt = at;
  if (sd.owed <= 0) { delete sd.owed; delete sd.parts; }
}

/** The late-filing penalty a state assesses on a return filed late with tax unpaid, beside the late-payment penalty. */
export function stateFileLate(rules: StateRules, tax: Money, due: Instant, filedAt: Instant, into: string): Money {
  const f = rules.fileLate;
  if (tax <= 0 || filedAt <= due || f.combine === 'none') return 0;
  const months = monthsBegun(due, filedAt);
  // Only past so many months late, counted from the due date all the same (Oregon's three, Louisiana's six).
  if (f.afterMonths !== undefined && months <= f.afterMonths) return 0;
  let fileLate = (f.once ?? Math.min(f.cap, f.monthly * months)) * tax;
  if (f.capMoney !== undefined) fileLate = Math.min(fileLate, usd(f.capMoney, into));
  if (f.monthlyFlat) fileLate = Math.max(fileLate, Math.min(usd(f.monthlyFlat.cap, into), usd(f.monthlyFlat.amount, into) * months));
  if (f.floor !== undefined) fileLate = Math.max(fileLate, usd(f.floor, into));
  if (f.minimum !== undefined && filedAt - due > 60 * MS_DAY) fileLate = Math.max(fileLate, Math.min(usd(f.minimum, into), tax));
  const payLate = (rules.payLate.timelyOnly ? 0 : statePayLateRate(rules, due, filedAt)) * tax;
  // New York's is less the late-payment penalty in the same months (not below its minimum); California's is the larger
  // of the two, not both: here what's added beside the late-payment penalty, which runs on its own schedule. Added to it
  // whole (Massachusetts's, North Carolina's), or the two held together under a cap (Arizona's), from 2026-10-11.
  if (f.combine === 'reduced-by-payment') return Math.round(Math.max(fileLate - payLate, f.minimum !== undefined && filedAt - due > 60 * MS_DAY ? Math.min(usd(f.minimum, into), tax) : 0));
  if (f.combine === 'added') return Math.round(fileLate);
  if (f.combine === 'combined-cap') return Math.round(Math.max(0, Math.min(fileLate, (f.combinedCap ?? 1) * tax - payLate)));
  return Math.round(Math.max(0, fileLate - payLate));
}

/** Its late penalties together on a balance filed at a moment: what filing then would add (`latePenaltyAll`). */
export function stateLateAt(rules: StateRules, tax: Money, due: Instant, at: Instant, into: string): Money {
  if (tax <= 0) return 0;
  const fileLate = stateFileLate(rules, tax, due, at, into);
  const sd: StateDue = { state: '', balance: tax, filedAt: at, fileLateRate: fileLate / tax, ...(rules.payLate.minimum ? { minPenalty: usd(rules.payLate.minimum, into) } : {}) };
  return fileLate + Math.round(payLateAmount(sd, payLateShare(sd, rules, due, at), tax));
}

/** A balance set owing from the due date, its late-filing penalty in it, and brought up to now. */
function setFromDue(sim: Simulation, sd: StateDue, rules: StateRules | undefined, r: TaxReturn, tax: Money, penalty: Money, fileLate: Money): void {
  const cur = saveCurrency(sim.universe);
  sd.penalty = penalty;
  if (rules?.fileLate.combine === 'combined-cap' && tax > 0) sd.fileLateRate = fileLate / tax;
  if (rules?.payLate.minimum) sd.minPenalty = usd(rules.payLate.minimum, cur);
  setStateOwed(sd, { tax, penalty, interest: 0 }, Math.min(stateDueOf(r), sim.now));
  sd.payLateRate = 0;
  sd.interestMonths = 0;
  delete sd.compounded;
  accrueState(sd, stateDueOf(r), sim.now);
}

/**
 * A state's side filed: its balance assessed, the late-filing penalty and the interest and late-payment penalty from the
 * due date where it's late, then paid from the bank if it can be, or owed and its collection begun. A refund is set for
 * its day. Returns what was asked and whether it was paid.
 */
export function fileState(sim: Simulation, person: Person, r: TaxReturn, state: string, balance: Money): { total: Money; paid: boolean } {
  const cur = saveCurrency(sim.universe);
  const sd = (stateDuesOf(r)[state] ??= { state, balance });
  sd.balance = balance;
  sd.filedAt = sim.now;
  const rules = rulesOf(state);
  if (balance < 0) {
    sd.refund = -balance;
    sd.refundAt = sim.now + (rules?.refundDays ?? 21) * MS_DAY;
    sim.schedule({ at: sd.refundAt, kind: 'tax.refund', label: `${stateName(state)} Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state } });
    return { total: balance, paid: true };
  }
  if (balance === 0) return { total: 0, paid: true };
  const fileLate = rules ? stateFileLate(rules, balance, stateDueOf(r), sim.now, cur) : 0;
  setFromDue(sim, sd, rules, r, balance, fileLate, fileLate);
  chargeThreeYear(sim, r, state, balance);
  const total = sd.owed ?? 0;
  if (payFromBank(sim, person, total, `${stateName(state)} income tax, ${r.year}${total > balance ? ', with penalty and interest' : ''}`, 'tax')) {
    sd.payments = [{ at: sim.now, amount: total, ...partsSplit(sd.parts!), how: 'payment' }];
    delete sd.owed; delete sd.parts;
    return { total, paid: true };
  }
  sd.collection = 0;
  stateNextNotice(sim, person, r, state);
  // A state plan in force takes a new balance in, or defaults on it (\`statePlanNewBalance\`).
  statePlanNewBalance(sim, person, state, total);
  return { total, paid: false };
}

const partsSplit = (p: OwedParts) => ({ tax: p.tax, penalty: p.penalty, interest: p.interest });

/** A collection charge on a balance: a share of the tax or of all owed, or an amount, the smaller one below a balance. */
function chargeOf(c: NonNullable<StateRules['charges']>[number], sd: StateDue, cur: string): Money {
  const owed = sd.owed ?? 0;
  if (c.share !== undefined) {
    let x = c.share * (c.of === 'tax' ? sd.parts?.tax ?? 0 : owed);
    if (c.atLeast !== undefined) x = Math.max(x, usd(c.atLeast, cur));
    if (c.atMost !== undefined) x = Math.min(x, usd(c.atMost, cur));
    return Math.round(x);
  }
  if (c.under && owed < usd(c.under.below, cur)) return usd(c.under.flat, cur);
  return c.flat !== undefined ? usd(c.flat, cur) : 0;
}

/** A payment on a state's balance, in the state's order (Connecticut's penalty first, by statute), kept with its split. */
export function applyStatePayment(sim: Simulation, person: Person, r: TaxReturn, state: string, amount: Money, how: 'payment' | 'levy' | 'refund offset' | 'plan'): OwedParts {
  const sd = stateDuesOf(r)[state];
  if (!sd?.owed) return { tax: 0, penalty: 0, interest: 0 };
  accrueState(sd, stateDueOf(r), sim.now);
  const p = { ...sd.parts! };
  const rules = rulesOf(state);
  const order: readonly Part[] = rules?.order ?? ['tax', 'penalty', 'interest'];
  let left = amount;
  const took: OwedParts = { tax: 0, penalty: 0, interest: 0 };
  for (const part of order) { const t = Math.min(left, p[part]); left -= t; p[part] -= t; took[part] = t; }
  (sd.payments ??= []).push({ at: sim.now, amount: amount - left, ...took, how });
  setStateOwed(sd, p, sim.now);
  // Interest paid off comes out of what was added to the principal first.
  if (sd.compounded !== undefined) sd.compounded = Math.min(sd.compounded, sd.parts?.interest ?? 0);
  // Paid in full: its lien released after the state's days, or on request where the taxpayer must ask (from 2026-10-11).
  if (!sd.owed) stateLienPaid(sim, person, r, state);
  if (!sd.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year && one.payload.state === state) sim.timeline.cancel(one.id, sim.now);
  // Everything owed to the state paid outside its plan ends the plan paid. Until 2026-10-11 the plan stayed in force
  // with nothing owed until its next payment came round (tests/liens-and-arrangements.test.ts). A plan's own payment
  // ends it where it's taken.
  const plan = person.statePlans?.[state];
  if (how !== 'plan' && plan && ['pending', 'active', 'missed'].includes(plan.status) && owedToState(person, state, sim.now) <= 0) endStatePlan(sim, person, plan, 'paid', 'Paid off');
  return took;
}

/**
 * A state's next notice, or levy, on the calendar, counted from the state's due date (`stateDueOf`) where that's still to
 * come (a return filed before it, or a plan ended before it): Connecticut collects a tax “due and unpaid” (Conn. Gen. Stat. 12-734) on its failure to be paid “within
 * thirty days from its due date” (12-35(a)), both read at codes.findlaw.com on 2026-10-15. Until 2026-10-15 it was
 * counted from filing, so a student who filed her 2027 return unpaid on 1 February 2028 had DRS’s bill on 2 March, and
 * its notice of intent to levy and its lien on 1 April, seventeen days before the tax was due
 * (tests/scope-taxpapers.test.ts).
 */
export function stateNextNotice(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const rules = rulesOf(state);
  const sd = stateDuesOf(r)[state];
  if (!rules || !sd?.owed) return;
  if (sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === STATE_NOTICE_KIND && i.payload.personId === person.id && i.payload.year === r.year && i.payload.state === state)) return;
  const step = sd.collection ?? 0;
  const days = step < rules.notices.length ? rules.notices[step]!.days : step === rules.notices.length ? rules.levy.afterDays : rules.levy.againDays;
  const from = Math.max(sim.now, stateDueOf(r));
  sim.schedule({ at: from + days * MS_DAY, kind: STATE_NOTICE_KIND, label: rules.short, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state } });
}

/**
 * What a state's collection does next on a year it's owed, and when, as its schedule has it (from 2026-10-20, brief 17,
 * section 8: until then Papers gave the latest notice and nothing of what came next or by when): its next notice, or a
 * levy on the bank accounts once the notices are spent. Nothing while a payment plan of its own holds collection, as
 * `STATE_NOTICE_KIND`'s handler holds it, or with nothing on the schedule.
 */
export function nextStateStep(sim: Simulation, person: Person, r: TaxReturn, state: string): { at: Instant; notice?: { code: string; title: string } } | undefined {
  const rules = rulesOf(state);
  const sd = r.stateDue?.[state];
  if (!rules || !sd?.owed) return undefined;
  const plan = person.statePlans?.[state];
  if (plan && ['pending', 'active', 'missed'].includes(plan.status)) return undefined;
  const item = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === STATE_NOTICE_KIND && i.payload.personId === person.id && i.payload.year === r.year && i.payload.state === state);
  if (!item) return undefined;
  const n = rules.notices[sd.collection ?? 0];
  return { at: item.at, ...(n ? { notice: { code: n.code, title: n.title } } : {}) };
}

/** Everything owed to a state, every year, now. */
export function owedToState(person: Person, state: string, at: Instant): Money {
  return Object.values(person.returns ?? {}).reduce((s, r) => { const sd = r.stateDue?.[state]; return s + (sd ? stateOwedOn(sd, stateDueOf(r), at) : 0); }, 0);
}

/** Everything owed to any state, now. */
export function owedToStates(person: Person, at: Instant): Money {
  return Object.values(person.returns ?? {}).reduce((s, r) => s + Object.values(r.stateDue ?? {}).reduce((t, sd) => t + stateOwedOn(sd, stateDueOf(r), at), 0), 0);
}

/** A part of what's owed to a state, paid now, the oldest year first. Returns what was applied. */
function payStateOldest(sim: Simulation, person: Person, state: string, amount: Money, how: 'payment' | 'plan' | 'refund offset'): Money {
  let left = amount;
  for (const r of Object.values(person.returns ?? {}).sort((a, b) => a.year - b.year)) {
    const sd = r.stateDue?.[state];
    if (left <= 0 || !sd?.owed) continue;
    const take = Math.min(left, stateOwedOn(sd, stateDueOf(r), sim.now));
    applyStatePayment(sim, person, r, state, take, how);
    left -= take;
  }
  return amount - left;
}

// --- Plans.

export const statePlansOf = (person: Person): Record<string, StatePlan> => (person.statePlans ??= {});
const note = (p: StatePlan, at: Instant, what: string, amount?: Money) => { p.history.push({ at, what, ...(amount !== undefined ? { amount } : {}) }); if (p.history.length > 40) p.history.splice(0, p.history.length - 40); };

/** Why a state's plan can't be asked for, or nothing. */
export function statePlanRefusal(sim: Simulation, person: Person, state: string, months: number, opts: { long?: boolean; down?: Money } = {}): string | undefined {
  const rules = rulesOf(state);
  if (!rules) return STATE_UNRESEARCHED;
  const long = rules.plan.long;
  const plan = person.statePlans?.[state];
  const live = Boolean(plan && ['pending', 'active', 'missed'].includes(plan.status));
  if (opts.long && !long) return `${rules.short} offers nothing longer than its ${rules.plan.name.toLowerCase()}.`;
  // Pennsylvania's extended plan is the way to add to a plan in force (from 2026-10-11).
  const replacing = Boolean(opts.long && long?.alreadyOnPlan && live && plan!.status === 'active' && !plan!.long);
  if (live && !replacing) return `You already have a plan with ${rules.short}.${long?.alreadyOnPlan && plan!.status === 'active' && !plan!.long ? ` To add to it, apply for its ${long.name.toLowerCase()}.` : ''}`;
  const owed = owedToState(person, state, sim.now);
  if (owed <= 0) return `You owe ${rules.short} nothing.`;
  const cur = saveCurrency(sim.universe);
  const unfiled = Object.values(person.returns ?? {}).find((r) => r.filedAt === undefined && stateDueOf(r) < sim.now);
  if (unfiled) return `${rules.short} needs every return filed first, and your ${unfiled.year} return isn’t. File it first.`;
  const money = (x: Money) => formatMoney(x, cur, { cents: false });
  const max = rules.plan.max;
  const overMax = max !== undefined && owed + (rules.plan.feeAdded ? statePlanFee(person, rules, cur) : 0) > usd(max, cur);
  if (overMax && !opts.long) return `${rules.short}’s ${rules.plan.name.toLowerCase()} is for ${money(usd(max!, cur))} or less, and you owe ${formatMoney(owed, cur)}.${long ? ` Apply for its ${long.name.toLowerCase()} instead.` : rules.plan.beyond ? ` ${rules.plan.beyond}` : ''}`;
  if (rules.plan.min !== undefined && owed <= usd(rules.plan.min, cur)) return `${rules.short} sets up a plan only for more than ${money(usd(rules.plan.min, cur))}, so pay this balance instead.`;
  // A year levied and still owed: from 2026-10-15. Until then a year the levy had paid off kept every later plan from
  // the state, so a student whose 2026 Connecticut $3.35 was taken by levy in 2027 was refused a plan on her 2027
  // return's $585.33 in 2028 (tests/scope-taxpapers.test.ts).
  if (rules.plan.notInCollection && Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) > rules.notices.length && r.stateDue?.[state]?.owed)) return `${rules.short} won’t set up a plan on an account it has levied. Pay the balance instead. It also takes requests by phone, which the game doesn’t offer.`;
  const after = rules.plan.afterStep;
  if (after && !Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) >= after.step && r.stateDue?.[state]?.owed)) return `${rules.short} offers no plan of its own. ${after.who} does, once the debt is sent there.`;
  // The longest by what's owed (Indiana's tiers, from 2026-10-11).
  const most = rules.plan.tiers?.find((t) => t.upTo === undefined || owed <= usd(t.upTo, cur))?.maxMonths ?? rules.plan.maxMonths;
  if (opts.long) {
    if (!(months > most || overMax || replacing)) return `Its ${rules.plan.name.toLowerCase()} covers this. The ${long!.name.toLowerCase()} is only for more than ${most} months${long!.over ? ` or over ${money(usd(long!.over, cur))}` : ''}${long!.alreadyOnPlan ? ', or to add to a plan in force' : ''}.`;
    if (months > long!.maxMonths) return `${rules.short}’s ${long!.name.toLowerCase()} runs for at most ${long!.maxMonths} months${long!.maxAssumed ? ' (estimated, as its longest term isn’t published)' : ''}.`;
  } else if (!(months >= rules.plan.minMonths && months <= most)) {
    return `${rules.short} sets up a plan over ${rules.plan.minMonths} to ${most} months${rules.plan.tiers ? ` for ${formatMoney(owed, cur)}` : ''}.${long && months > most ? ` For longer, apply for its ${long.name.toLowerCase()}.` : ''}`;
  }
  if (rules.plan.minMonthly !== undefined && Math.ceil(owed / months) < usd(rules.plan.minMonthly, cur) && months > 1) return `${rules.short} asks for at least ${money(usd(rules.plan.minMonthly, cur))} a month, so choose fewer months.`;
  // A down payment: the District's required, Louisiana's offered, Pennsylvania's and New Mexico's any amount (from 2026-10-11).
  const down = Math.round(opts.down ?? 0);
  const dp = rules.plan.downPayment;
  if (down < 0 || down >= owed) return 'A down payment must be more than nothing and less than what you owe.';
  if (down > 0 && !dp) return `${rules.short}’s plan doesn’t take a down payment.`;
  if (dp?.required && down < downOf(dp, owed)) return `${rules.short} asks for ${Math.round((dp.share ?? 0) * 100)}% down, ${formatMoney(downOf(dp, owed), cur)}. ${dp.why}`;
  if (down > 0 && inTheBank(sim, person) < down) return `Your bank can’t cover the ${formatMoney(down, cur)} down payment.`;
  return undefined;
}

/** A plan's down payment as a share of what's owed. */
const downOf = (dp: NonNullable<StateRules['plan']['downPayment']>, owed: Money) => Math.round((dp.share ?? 0) * owed);

/**
 * A financial statement, as a longer arrangement asks (Pennsylvania's REV-488, Louisiana's R-20223), filled from the
 * player's own records (from 2026-10-11): the last ninety days' money into and out of their own accounts, by the month,
 * leaving out moves between them, tax paid, and a test's setup; what's left each month; and what the bank holds.
 */
export interface FinancialStatement { at: Instant; income: Money; expenses: Money; net: Money; cash: Money }
export function financialStatement(sim: Simulation, person: Person): FinancialStatement {
  const from = sim.now - 90 * MS_DAY;
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && (a.kind === 'checking' || a.kind === 'savings')).map((a) => a.id));
  let income = 0;
  let out = 0;
  for (const t of sim.universe.transactions) {
    // Opening balances aren't income: until 2026-10-11 they were, and a new wealthy life's statement showed $168,478 a
    // month earned (tests/liens-and-arrangements.test.ts).
    if (t.at < from || t.category === 'tax' || t.category === 'test' || t.category === 'opening') continue;
    const own = t.postings.filter((p) => mine.has(p.accountId)).reduce((s, p) => s + p.amount, 0);
    if (t.postings.every((p) => mine.has(p.accountId))) continue;
    if (own > 0) income += own; else out -= own;
  }
  const m = (x: Money) => Math.round(x / 3);
  return { at: sim.now, income: m(income), expenses: m(out), net: m(income) - m(out), cash: inTheBank(sim, person) };
}

/** A plan's fee, in the save's currency: none where the year's income is low enough to waive it (Louisiana's, from 2026-10-11). */
export function statePlanFee(person: Person, rules: StateRules, cur: string): Money {
  const w = rules.plan.feeWaivedAtMost;
  const latest = Object.values(person.returns ?? {}).filter((r) => r.filedAt !== undefined).sort((a, b) => b.year - a.year)[0];
  if (w !== undefined && latest && latest.figures.income <= usd(w, cur)) return 0;
  return usd(rules.plan.fee, cur);
}

function startStatePlan(sim: Simulation, person: Person, p: StatePlan): void {
  const rules = rulesOf(p.state)!;
  p.status = 'active';
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_NOTICE_KIND && one.payload.personId === person.id && one.payload.state === p.state) sim.timeline.cancel(one.id, sim.now);
  // A lien's notice of intent comes to nothing under a plan (California's: filing against a plan in good standing is an
  // error); and the lien a plan asks is filed with it (New Mexico's longer agreement, Hawaii's and the District's over
  // twelve months, the District's over $25,000), from 2026-10-11.
  const lp = rules.lien?.plan;
  const asks = rules.lien && ((p.long && rules.plan.long?.lien) || (lp && ((lp.monthsOver !== undefined && p.months > lp.monthsOver) || (lp.over !== undefined && p.covers > usd(lp.over, saveCurrency(sim.universe))))));
  for (const r of Object.values(person.returns ?? {})) {
    const sd = r.stateDue?.[p.state];
    if (sd?.lien?.status === 'intent') { sd.lien.status = 'dropped'; lienNote(sd.lien, sim.now, 'Not filed: a plan was set up first'); cancelLienItems(sim, person, r.year, p.state); }
    if (asks && sd?.owed) fileStateLien(sim, person, r, p.state, 'plan');
  }
  // California adds its fee to the balance: owed on the latest year, as a fee, not tax.
  if (p.fee > 0 && rules.plan.feeAdded) {
    const r = Object.values(person.returns ?? {}).filter((x) => x.stateDue?.[p.state]?.owed).sort((a, b) => b.year - a.year)[0];
    const sd = r?.stateDue?.[p.state];
    if (r && sd) { accrueState(sd, stateDueOf(r), sim.now); setStateOwed(sd, { ...sd.parts!, penalty: sd.parts!.penalty + p.fee }, sim.now); note(p, sim.now, 'The setup fee, added to the balance', p.fee); }
  }
  p.nextDue = sim.now + 30 * MS_DAY;
  sim.schedule({ at: p.nextDue, kind: STATE_PLAN_KIND, label: `${rules.short}: A Plan Payment`, category: 'personal', priority: 25, payload: { personId: person.id, state: p.state } });
  note(p, sim.now, `Approved: ${formatMoney(p.monthly, saveCurrency(sim.universe))} a month for ${p.months} months`);
}

function endStatePlan(sim: Simulation, person: Person, p: StatePlan, status: 'ended' | 'paid', why: string): void {
  p.status = status;
  p.why = why;
  note(p, sim.now, why);
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && (one.kind === STATE_PLAN_KIND || one.kind === STATE_PLAN_END_KIND) && one.payload.personId === person.id && one.payload.state === p.state) sim.timeline.cancel(one.id, sim.now);
  if (status === 'ended') for (const r of Object.values(person.returns ?? {})) {
    const sd = r.stateDue?.[p.state];
    if (!sd?.owed) continue;
    // Collection resumes at its last notice before a levy.
    const rules = rulesOf(p.state)!;
    sd.collection = Math.max(sd.collection ?? 0, rules.notices.length - 1);
    stateNextNotice(sim, person, r, p.state);
  }
}

/** A plan's payment missed: by the state's rule, cured by the next due date, a notice and its days, or ended now. */
function missStatePlan(sim: Simulation, person: Person, p: StatePlan, due: Money): void {
  const rules = rulesOf(p.state)!;
  const cur = saveCurrency(sim.universe);
  const cure = rules.plan.cure;
  // Where the state publishes that a missed payment ends the plan (`cureAssumed: false`: Arizona, Louisiana, New Mexico,
  // the District), it says so; until 2026-10-20 (brief 16's papers editor) every state with no cure was said not to
  // publish its rule.
  if (cure.kind === 'none') {
    const why = rules.plan.cureAssumed ? `${rules.short}’s rule on a missed payment isn’t published, so the game ends the plan` : `${rules.short} ends a plan when a payment is missed`;
    const said = rules.plan.cureAssumed ? `${rules.short} doesn’t publish what happens after a missed payment, so in the game the plan ends.` : `${rules.short} ends a plan when a payment is missed.`;
    endStatePlan(sim, person, p, 'ended', `Ended: a payment missed (${why})`);
    notifyPlayer(sim, person, `${rules.short} Ended Your Plan`, `Your bank couldn’t pay the plan’s ${formatMoney(due, cur)}. ${said} Collection resumes on what you owe it.`);
    return;
  }
  p.status = 'missed';
  p.endsBy = cure.kind === 'next-due' ? sim.now + 30 * MS_DAY : sim.now + cure.days * MS_DAY;
  note(p, sim.now, cure.kind === 'next-due' ? 'A payment missed: made up by the next due date, or it’s a default' : 'A payment missed: Intent To Terminate', due);
  sim.schedule({ at: p.endsBy, kind: STATE_PLAN_END_KIND, label: `${rules.short}: Your Plan`, category: 'personal', priority: 25, payload: { personId: person.id, state: p.state } });
  notifyPlayer(sim, person, cure.kind === 'next-due' ? `${rules.short}: A Plan Payment Missed` : `${rules.short}: Intent To Terminate Your Plan`, `Your bank couldn’t pay the plan’s ${formatMoney(due, cur)}. Catch up by ${formatDate(p.endsBy, HOME)} on Papers, under Tax Returns, or the plan ends and collection resumes.`);
}

/** A new balance with a state while its plan stands: California's terms make it a default; elsewhere it joins (SLATE's). */
export function statePlanNewBalance(sim: Simulation, person: Person, state: string, added: Money): void {
  const p = person.statePlans?.[state];
  if (!p || p.status !== 'active') return;
  const rules = rulesOf(state)!;
  if (rules.plan.newBalance === 'joins') { p.covers += added; note(p, sim.now, 'A new balance joined the plan', added); return; }
  missStatePlan(sim, person, p, added);
}

const notifyPlayer = (sim: Simulation, person: Person, title: string, body: string) => { if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title, body, importance: 85, route: '/workspace/papers' }); };

/** Refunds a state's return brings: offset first to what's owed to the same state for another year (each state's law). */
export function payStateRefund(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const sd = r.stateDue?.[state];
  if (!sd?.refund || sd.refundedAt !== undefined) return;
  sd.refundedAt = sim.now;
  let back = sd.refund;
  const offset = Math.min(back, owedToState(person, state, sim.now));
  if (offset > 0) {
    sim.post({ memo: `${stateName(state)} refund, ${r.year}, applied to what’s owed to it`, category: 'tax', postings: [{ accountId: sim.nominalAccount('expense', expenseFor('tax')).id, amount: offset }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -offset }] });
    payStateOldest(sim, person, state, offset, 'refund offset');
    back -= offset;
    notifyPlayer(sim, person, `Your ${stateName(state)} Refund Went To What You Owe It`, `${formatMoney(offset, saveCurrency(sim.universe))} of your ${r.year} ${stateName(state)} refund paid what you owed ${agencyOf(state)}.`);
  }
  // Then a partner state's past-due income tax, by their refund offset agreement (from 2026-10-11): until then a refund
  // from one state never paid what another was collecting.
  for (const other of rulesOf(state)?.offsetsFor ?? []) {
    if (back <= 0) break;
    const take = Math.min(back, pastDueTo(person, other) ? owedToState(person, other, sim.now) : 0);
    if (take <= 0) continue;
    sim.post({ memo: `${stateName(state)} refund, ${r.year}, sent to ${agencyOf(other)}`, category: 'tax', postings: [{ accountId: sim.nominalAccount('expense', expenseFor('tax')).id, amount: take }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -take }] });
    payStateOldest(sim, person, other, take, 'refund offset');
    back -= take;
    notifyPlayer(sim, person, `Your ${stateName(state)} Refund Went To ${stateName(other)}`, `${formatMoney(take, saveCurrency(sim.universe))} of your ${r.year} ${stateName(state)} refund paid past-due income tax you owed ${agencyOf(other)}, under the two states’ refund offset agreement.`);
  }
  if (back > 0) sim.post({ memo: `${stateName(state)} tax refund, ${r.year}`, category: 'tax', postings: [{ accountId: payeeAccount(sim, person).id, amount: back }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -back }] });
}

/**
 * A federal refund's share the IRS sends to a state for its past-due income tax (IRC 6402(e)): after every federal
 * balance, only the state on the return's address, only a debt it has sent a notice for. Returns what it took.
 */
/** Whether a state is owed income tax it has sent a notice for: what an offset takes, by the IRS's or a partner state's. */
const pastDueTo = (person: Person, state: string): boolean => Boolean(rulesOf(state)) && Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) >= 1 && r.stateDue?.[state]?.owed);

export function federalOffsetToState(sim: Simulation, person: Person, state: string, amount: Money, year: number): Money {
  if (amount <= 0 || !pastDueTo(person, state)) return 0;
  const take = Math.min(amount, owedToState(person, state, sim.now));
  if (take <= 0) return 0;
  sim.post({ memo: `Federal refund, ${year}, sent to ${agencyOf(state)}`, category: 'tax', postings: [{ accountId: sim.nominalAccount('expense', expenseFor('tax')).id, amount: take }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -take }] });
  payStateOldest(sim, person, state, take, 'refund offset');
  notifyPlayer(sim, person, `Your ${year} Federal Refund Went To ${stateName(state)}`, `${formatMoney(take, saveCurrency(sim.universe))} of it paid past-due income tax you owed ${agencyOf(state)}, through the Treasury Offset Program.`);
  return take;
}

// --- Liens (from the remaining-gaps pass of 2026-10-11; research-state-tax-liens-a.json, -b.json). Until then no
// authority in SLATE filed one.

export const STATE_LIEN_KIND = 'tax.state_lien';

const lienNote = (l: Lien, at: Instant, what: string, amount?: Money) => { l.history.push({ at, what, ...(amount !== undefined ? { amount } : {}) }); if (l.history.length > 20) l.history.splice(0, l.history.length - 20); };
const livePlan = (person: Person, state: string) => { const p = person.statePlans?.[state]; return Boolean(p && ['pending', 'active', 'missed'].includes(p.status)); };
const cancelLienItems = (sim: Simulation, person: Person, year: number, state: string) => { for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_LIEN_KIND && one.payload.personId === person.id && one.payload.year === year && one.payload.state === state) sim.timeline.cancel(one.id, sim.now); };

/** The collection step a state files its lien at: filed now, or its notice of intent sent first (California's 30 days). */
function stateLienStep(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const rules = rulesOf(state)!;
  const lr = rules.lien!;
  const sd = r.stateDue![state]!;
  if (!sd.owed || livePlan(person, state)) return;
  if (!lr.intent) { fileStateLien(sim, person, r, state, 'collection'); return; }
  const cur = saveCurrency(sim.universe);
  sd.lien = { name: lr.name, status: 'intent', trigger: 'collection', amount: sd.owed, recordedAt: lr.recordedAt, intentAt: sim.now, fee: 0, history: [] };
  lienNote(sd.lien, sim.now, `${lr.intent.title}: filed in ${lr.intent.days} days unless it’s paid or a plan is set up`, sd.owed);
  sim.schedule({ at: sim.now + lr.intent.days * MS_DAY, kind: STATE_LIEN_KIND, label: lr.name, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state, action: 'file' } });
  notifyPlayer(sim, person, lr.intent.title, `You owe ${formatMoney(sd.owed, cur)} on your ${r.year} ${stateName(state)} return. ${rules.short} will file a ${lr.name} with ${lr.recordedAt} in ${lr.intent.days} days unless you pay it or set up a payment plan, both on Papers, under Tax Returns.`);
}

/** Its release, in words: after payment in full, by its days, or on request. */
export function lienReleaseWords(lr: NonNullable<StateRules['lien']>): string {
  if (lr.releaseOnRequest) return `once it’s paid and you ask: ${lr.releaseOnRequest}${lr.releaseFee ? `, for a release fee` : ''}`;
  if (!lr.releaseDays) return 'as soon as it’s paid in full';
  return `within ${lr.releaseDays} days of payment in full${lr.releaseAssumed ? ' (estimated, as the state’s time isn’t published)' : ''}${lr.releaseFee ? ', once its release fee is paid' : ''}`;
}

/** A lien filed and recorded: its recording fee owed where the state charges one, its effect said in the state's words. */
export function fileStateLien(sim: Simulation, person: Person, r: TaxReturn, state: string, trigger: Lien['trigger']): void {
  const rules = rulesOf(state)!;
  const lr = rules.lien!;
  const sd = r.stateDue![state]!;
  const cur = saveCurrency(sim.universe);
  if (sd.lien && sd.lien.status !== 'intent' && sd.lien.status !== 'dropped') return;
  const fee = lr.fee ? usd(lr.fee, cur) : 0;
  if (fee && sd.parts) { accrueState(sd, stateDueOf(r), sim.now); setStateOwed(sd, { ...sd.parts, penalty: sd.parts.penalty + fee }, sim.now); }
  const l: Lien = sd.lien?.status === 'intent' ? sd.lien : { name: lr.name, status: 'filed', trigger, amount: 0, recordedAt: lr.recordedAt, fee: 0, history: [] };
  Object.assign(l, { status: 'filed', trigger, amount: sd.owed ?? 0, recordedAt: lr.recordedAt, filedAt: sim.now, fee });
  sd.lien = l;
  lienNote(l, sim.now, `Filed with ${lr.recordedAt}${trigger === 'plan' ? ', as the plan requires' : ''}${fee ? `, its ${formatMoney(fee, cur)} recording fee added to what you owe` : ''}`, l.amount);
  // Filed by collection, it ends on where to pay, as the state's other notices do (from 2026-10-20, brief 17: until then it
  // ended on how it's released, with no next step); filed for a plan, the plan pays it.
  notifyPlayer(sim, person, `A ${lr.name} Is Filed`, `${rules.short} filed a ${lr.name} for ${formatMoney(l.amount, cur)} on your ${r.year} ${stateName(state)} return with ${lr.recordedAt}${trigger === 'plan' ? ', as its payment plan requires' : ''}.${fee ? ` Its ${formatMoney(fee, cur)} recording fee was added to what you owe.` : ''} It’s a public record. ${lr.effect} It’s released ${lienReleaseWords(lr)}.${trigger === 'plan' ? '' : ' You can pay it on Papers, under Tax Returns.'}`);
}

/** Paid in full: its lien released after the state's days, or held for the request the state asks; one not yet filed, dropped. */
export function stateLienPaid(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const sd = r.stateDue?.[state];
  const l = sd?.lien;
  const lr = rulesOf(state)?.lien;
  if (!l || !lr) return;
  if (l.status === 'intent') { l.status = 'dropped'; lienNote(l, sim.now, 'Not filed: paid first'); cancelLienItems(sim, person, r.year, state); return; }
  if (l.status !== 'filed') return;
  l.status = 'paid';
  l.paidAt = sim.now;
  lienNote(l, sim.now, 'Paid in full');
  if (lr.releaseOnRequest || lr.releaseFee) { notifyPlayer(sim, person, `Ask For Your ${l.name}’s Release`, `Your ${r.year} ${stateName(state)} balance is paid. The ${l.name} is released ${lienReleaseWords(lr)}. Ask for its release on Papers, under Tax Returns.`); return; }
  releaseLater(sim, person, r, state);
}

function releaseLater(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const sd = r.stateDue![state]!;
  const l = sd.lien!;
  const lr = rulesOf(state)!.lien!;
  l.releaseDue = sim.now + lr.releaseDays * MS_DAY;
  if (!lr.releaseDays) { releaseStateLien(sim, person, r, state); return; }
  lienNote(l, sim.now, `To be released by ${formatDate(l.releaseDue, HOME)}`);
  sim.schedule({ at: l.releaseDue, kind: STATE_LIEN_KIND, label: l.name, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state, action: 'release' } });
}

function releaseStateLien(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const l = r.stateDue![state]!.lien!;
  if (l.status === 'released' || l.status === 'withdrawn') return;
  l.status = 'released';
  l.releasedAt = sim.now;
  lienNote(l, sim.now, `Released with ${l.recordedAt}`);
  notifyPlayer(sim, person, `Your ${l.name} Is Released`, `${agencyOf(state)} released the ${l.name} on your ${r.year} ${stateName(state)} return. The release is recorded with ${l.recordedAt}.`);
}

/** Why its release can't be asked for now, or nothing: paid in full, where the state releases on request or on its fee. */
export function lienReleaseRefusal(sim: Simulation, person: Person, r: TaxReturn | undefined, state: string): string | undefined {
  const l = r?.stateDue?.[state]?.lien;
  const lr = rulesOf(state)?.lien;
  if (!l || !lr) return 'There’s no lien on that year.';
  if (l.status === 'released' || l.status === 'withdrawn') return 'The lien has already been released.';
  if (l.status !== 'paid') return 'You can ask for its release once what it was filed for is paid in full.';
  if (!(lr.releaseOnRequest || lr.releaseFee)) return `There’s nothing to ask: it’s released on its own, ${lienReleaseWords(lr)}.`;
  if (l.releaseDue !== undefined) return `You’ve already asked. It’s to be released by ${formatDate(l.releaseDue, HOME)}.`;
  const fee = lr.releaseFee ? usd(lr.releaseFee, saveCurrency(sim.universe)) : 0;
  if (fee && inTheBank(sim, person) < fee) return `Your bank can’t cover its ${formatMoney(fee, saveCurrency(sim.universe))} release fee.`;
  return undefined;
}

/**
 * Whether a lien was filed in error: the assessment it secured, replaced by their own return, came to no more than they'd
 * paid toward the year when it was filed. Withdrawn on request, its fees back (California's reading of an error; the
 * others' process where published, SLATE's 30 days where not).
 */
export function lienInError(r: TaxReturn, state: string): boolean {
  const sd = r.stateDue?.[state];
  const l = sd?.lien;
  if (!sd || !l || l.filedAt === undefined || sd.replacedAt === undefined) return false;
  const paidBefore = (sd.payments ?? []).filter((p) => p.at < l.filedAt!).reduce((s, p) => s + p.tax, 0);
  return Math.max(0, sd.balance) <= paidBefore;
}

export function lienDisputeRefusal(r: TaxReturn | undefined, state: string): string | undefined {
  const l = r?.stateDue?.[state]?.lien;
  if (!l || !['filed', 'paid', 'released'].includes(l.status)) return l?.status === 'disputed' ? `You’ve already asked. A decision is due by ${formatDate(l.decideAt!, HOME)}.` : l?.status === 'withdrawn' ? 'The lien has already been withdrawn.' : 'There’s no lien on that year to dispute.';
  if (!lienInError(r!, state)) return 'It was filed for tax you owed, so it wasn’t filed in error. It’s released once that’s paid, not withdrawn.';
  return undefined;
}

// --- A return never filed (from 2026-10-11). Until then only the IRS acted on one, with its substitute return; a state
// owed on a return never filed waited for it forever.

export const STATE_NONFILER_KIND = 'tax.state_nonfiler';
export const THREE_YEAR_KIND = 'tax.three_year';

/**
 * At a year's extended due date: whether it and the two before it all owed the state tax with no return of their own, and
 * if so each of the three charged the state's share of its net tax, a year's penalties together held to its tax (ORS
 * 305.992(2)). Charged once a year; charged now where the state's side exists, else when it's assessed or filed.
 */
export function threeYearCheck(sim: Simulation, person: Person, state: string, year: number, owedOf: (r: TaxReturn) => Money): void {
  const rules = rulesOf(state);
  const ty = rules?.threeYear;
  if (!ty) return;
  const run = [year - 2, year - 1, year].map((y) => person.returns?.[String(y)]);
  // Tax to file for, and no return of their own: a state's assessment isn't one; their own replacing it is.
  const own = (sd: StateDue | undefined) => Boolean(sd && sd.filedAt !== undefined && (!sd.assessedBy || sd.replacedAt !== undefined));
  const unfiled = (r: TaxReturn | undefined) => Boolean(r && owedOf(r) > 0 && !own(r.stateDue?.[state]));
  if (!run.every(unfiled)) return;
  for (const r of run) {
    (r!.threeYearFor ??= {})[state] = true;
    chargeThreeYear(sim, r!, state, owedOf(r!));
  }
  notifyPlayer(sim, person, `${rules!.short}: Three Years Unfiled`, `You filed no ${stateName(state)} return for ${year - 2}, ${year - 1} or ${year} by ${year}’s extended due date, so ${Math.round(ty.share * 100)}% of each year’s tax is added as a penalty (ORS 305.992). Each year’s penalties are capped at its tax. File the returns, then ask for a waiver on Papers, under Tax Returns. It waives ${Math.round(ty.waiver.beforeNotice * 100)}% if you file before any notice, ${Math.round(ty.waiver.afterDemand * 100)}% after a demand, and ${Math.round(ty.waiver.afterAssessment * 100)}% after an assessment.`);
}

/** The penalty charged on a year's side, once: its share of the net tax, held so the year's penalties stay within its tax. */
export function chargeThreeYear(sim: Simulation, r: TaxReturn, state: string, tax: Money): void {
  const ty = rulesOf(state)?.threeYear;
  const sd = r.stateDue?.[state];
  if (!ty || !r.threeYearFor?.[state] || !sd || sd.threeYear || !sd.parts) return;
  accrueState(sd, stateDueOf(r), sim.now);
  // Every penalty the year has had, paid or not, against its tax.
  const had = sd.parts.penalty + (sd.payments ?? []).reduce((s, p) => s + p.penalty, 0);
  const amount = Math.min(Math.round(ty.share * tax), Math.max(0, tax - had));
  sd.threeYear = { at: sim.now, amount };
  if (amount) setStateOwed(sd, { ...sd.parts, penalty: sd.parts.penalty + amount }, sim.now);
}

/** Why the three-year penalty's waiver can't be asked now, or nothing. */
export function waiverRefusal(sim: Simulation, r: TaxReturn | undefined, state: string): string | undefined {
  const ty = rulesOf(state)?.threeYear;
  const sd = r?.stateDue?.[state];
  if (!ty || !sd?.threeYear?.amount) return 'There’s no three-year penalty on that year.';
  if (sd.threeYear.waived !== undefined) return 'Its waiver has already been decided.';
  if (sd.assessedBy && sd.replacedAt === undefined) return 'File your own return for the year first.';
  const paidAt = sd.owed ? undefined : (sd.payments ?? []).at(-1)?.at;
  if (paidAt !== undefined && sim.now > paidAt + ty.windowDays * MS_DAY) return 'You have to ask for a waiver before paying in full or within a year after, and that year has passed.';
  return undefined;
}

/** The waiver's share by when their own return came: before any notice, after a demand, after an assessment. */
export function waiverShare(r: TaxReturn, state: string): number {
  const ty = rulesOf(state)!.threeYear!;
  const sd = r.stateDue![state]!;
  if (sd.assessedBy) return ty.waiver.afterAssessment;
  if ((r.lettersSent?.[state] ?? 0) > 0) return ty.waiver.afterDemand;
  return ty.waiver.beforeNotice;
}

/** A state's letters on a return never filed that owes it, on the calendar from its due date (`StateRules.nonFiler`). */
export function scheduleStateNonFiler(sim: Simulation, person: Person, r: TaxReturn, owed: Record<string, Money>): void {
  for (const [state, tax] of Object.entries(owed)) {
    const rules = rulesOf(state);
    if (!rules || tax <= 0 || r.stateDue?.[state]?.filedAt !== undefined) continue;
    if (sim.universe.scheduled.some((i) => i.kind === STATE_NONFILER_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year && i.payload.state === state)) continue;
    sim.schedule({ at: Math.max(sim.now + MS_DAY, stateDueOf(r) + rules.nonFiler.firstDays * MS_DAY), kind: STATE_NONFILER_KIND, label: `${rules.short} On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state, step: 0 } });
  }
}

/** A non-filer's letter sent, or, past the last, the state's assessment (`assessStateNonFiler`). */
export function stateNonFilerStep(sim: Simulation, person: Person, r: TaxReturn, state: string, step: number, tax: Money): void {
  const rules = rulesOf(state);
  if (!rules || tax <= 0 || r.stateDue?.[state]?.filedAt !== undefined) return;
  const letters = rules.nonFiler.letters;
  if (step < letters.length) {
    const l = letters[step]!;
    (r.lettersSent ??= {})[state] = step + 1;
    // The letter's code, the return it's about, then what it says, one sentence (from 2026-10-20, brief 17: until then
    // "Failure To File Notice: your 2026 Connecticut return. You didn’t file, …", the first a fragment).
    notifyPlayer(sim, person, l.title, `${l.code}, on your ${r.year} ${stateName(state)} return: ${l.words}`);
    sim.schedule({ at: sim.now + l.days * MS_DAY, kind: STATE_NONFILER_KIND, label: `${rules.short} On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state, step: step + 1 } });
    return;
  }
  assessStateNonFiler(sim, person, r, state, tax);
}

/**
 * The state's assessment of a return never filed: its tax as figured from what was reported, which SLATE takes as the
 * return's own figure for the state, with what its withholding paid credited (Connecticut's estimate may leave the
 * withholding out, which SLATE doesn't); the late-filing penalty as filed now, what a non-filer's assessment adds, and
 * the late-payment penalty and interest from the due date; then collected as any balance is.
 */
export function assessStateNonFiler(sim: Simulation, person: Person, r: TaxReturn, state: string, tax: Money): void {
  const rules = rulesOf(state)!;
  const cur = saveCurrency(sim.universe);
  const sd = (stateDuesOf(r)[state] ??= { state, balance: tax });
  sd.balance = tax;
  sd.filedAt = sim.now;
  sd.assessedBy = { at: sim.now };
  const fileLate = stateFileLate(rules, tax, stateDueOf(r), sim.now, cur);
  const adds = (rules.nonFiler.adds ?? []).reduce((sum, a) => {
    let x = a.share !== undefined ? a.share * tax : 0;
    if (a.atLeast !== undefined) x = Math.max(x, usd(a.atLeast, cur));
    if (a.atMost !== undefined) x = Math.min(x, usd(a.atMost, cur));
    return sum + Math.round(x + (a.flat !== undefined ? usd(a.flat, cur) : 0));
  }, 0);
  setFromDue(sim, sd, rules, r, tax, fileLate + adds, fileLate);
  chargeThreeYear(sim, r, state, tax);
  // A floor on the whole penalty (Connecticut's $50 on a return DRS made).
  const floor = Math.max(0, ...(rules.nonFiler.adds ?? []).map((a) => (a.minPenalty !== undefined ? usd(a.minPenalty, cur) : 0)));
  if (sd.parts && sd.parts.penalty < floor) setStateOwed(sd, { ...sd.parts, penalty: floor }, sim.now);
  sd.collection = 0;
  stateNextNotice(sim, person, r, state);
  statePlanNewBalance(sim, person, state, sd.owed ?? 0);
  // What the assessment adds, said in the sentence's own case, and where to file in its place (from 2026-10-20, brief 17:
  // until then "…, and The Penalty For A Return DRS Made, 10% Or $50, The Greater. File your own return on Papers to
  // replace it.").
  const named = (rules.nonFiler.adds ?? []).map((a) => a.words);
  notifyPlayer(sim, person, `${rules.short} Assessed Your ${r.year} Return`, `You didn’t file, so ${rules.short} assessed ${formatMoney(sd.owed ?? 0, cur)}: the tax from what was reported, plus its late penalties and interest from the due date${named.length ? `, and ${named.join(' and ')}` : ''}. File your own return on Papers, under Tax Returns, to replace it.`);
}

/**
 * Their own return in place of a state's assessment: the tax becomes their return's, less what's been paid toward it;
 * the penalties and interest charged fall in proportion, SLATE's reading, as the IRS's reconsideration does here; and
 * anything paid past it comes back.
 */
export function reconsiderState(sim: Simulation, person: Person, r: TaxReturn, state: string, own: Money): void {
  const sd = r.stateDue?.[state];
  if (!sd?.assessedBy || sd.replacedAt !== undefined) return;
  accrueState(sd, stateDueOf(r), sim.now);
  const paidTax = (sd.payments ?? []).reduce((s, x) => s + x.tax, 0);
  const ratio = sd.balance > 0 ? Math.max(0, own) / sd.balance : 1;
  const p = sd.parts ?? { tax: 0, penalty: 0, interest: 0 };
  setStateOwed(sd, { tax: Math.max(0, own - paidTax), penalty: Math.round(p.penalty * ratio), interest: Math.round(p.interest * ratio) }, sim.now);
  const over = paidTax - Math.max(0, own) + Math.max(0, -own);
  if (over > 0) sim.post({ memo: `${stateName(state)} tax refund, ${r.year}: its assessment replaced by your return`, category: 'tax', postings: [{ accountId: payeeAccount(sim, person).id, amount: over }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -over }] });
  sd.balance = own;
  sd.replacedAt = sim.now;
  if (!sd.owed) stateLienPaid(sim, person, r, state);
  if (!sd.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year && one.payload.state === state) sim.timeline.cancel(one.id, sim.now);
  notifyPlayer(sim, person, `Your ${r.year} Return Replaces ${stateName(state)}’s Assessment`, `${agencyOf(state)} accepted your own return: ${formatMoney(Math.max(0, own), saveCurrency(sim.universe))} of tax for the year. ${sd.owed ? `You still owe ${formatMoney(sd.owed, saveCurrency(sim.universe))}, with the penalties and interest reduced in proportion.` : over > 0 ? `The ${formatMoney(over, saveCurrency(sim.universe))} you paid beyond it comes back to you.` : 'Nothing more is owed.'}`);
}

// --- How a state's rules read on the screen.

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

/** Its late-payment penalty, in words. */
export function payLateWords(rules: StateRules): string {
  const p = rules.payLate;
  const how = p.steps ? p.steps.map((s) => (s.afterDays > 0 ? `${pct(s.rate)} after ${s.afterDays} days` : `${pct(s.rate)} once late`)).join(', then ') : p.monthly ? `${p.once ? `${pct(p.once)} once, then ` : ''}${pct(p.monthly)} a month, up to ${pct(p.cap)}` : `${pct(p.once)} once, after the due date`;
  return `${how}${p.minimum ? `, at least $${p.minimum / 100}` : ''}${p.timelyOnly ? ', on a return filed on time' : ''}${p.from ? `; for returns due from ${p.from.due}, ${p.from.once ? `${pct(p.from.once)} once` : `${pct(p.from.monthly)} a month, up to ${pct(p.from.cap)}`}` : ''}`;
}

/** Its interest, in words. */
export function interestWords(rules: StateRules): string {
  const i = rules.interest;
  const how = { daily: 'compounded daily', 'daily-simple': 'simple, by the day', 'monthly-simple': 'simple, for each month or part of one', yearly: 'added to what you owe each January' }[i.how];
  return `${pct(i.yearly)} a year, ${how}${i.onPenalty ? ', on penalties too' : ''}${i.raised ? `; ${pct(i.raised.yearly)} from ${i.raised.afterDays} days after its first notice${i.raised.unlessPlan ? ' unless a plan was asked for' : ''}` : ''}`;
}

/** The order a part payment goes in, in words. */
export function orderWords(rules: StateRules): string {
  const said = rules.order.join(', then the ');
  return rules.orderAssumed ? `${rules.short} doesn’t publish the order a partial payment goes in, so in the game it goes to the ${said}.` : `By its rule, a partial payment goes to the ${said}.`;
}

export function registerStateTax(sim: Simulation): void {
  sim.onSchedule(STATE_NOTICE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? person.returns?.[String(item.payload.year)] : undefined;
    const state = String(item.payload.state);
    const sd = r?.stateDue?.[state];
    const rules = rulesOf(state);
    if (!person || !r || !sd?.owed || !rules) return;
    // A plan pending or in force stops collection.
    const plan = person.statePlans?.[state];
    if (plan && ['pending', 'active', 'missed'].includes(plan.status)) return;
    accrueState(sd, stateDueOf(r), s.now);
    const cur = saveCurrency(s.universe);
    const step = sd.collection ?? 0;
    if (step === 0) sd.noticedAt ??= s.now;
    // What collection adds at this step: Colorado's 15%, Georgia's 20% with the execution, Illinois's fee (from 2026-10-11).
    const charged = (rules.charges ?? []).filter((c) => c.step === step).map((c) => ({ c, amount: chargeOf(c, sd, cur) })).filter((x) => x.amount > 0);
    for (const { amount } of charged) setStateOwed(sd, { ...sd.parts!, penalty: sd.parts!.penalty + amount }, s.now);
    const added = charged.map(({ c, amount }) => ` ${c.words.charAt(0).toUpperCase()}${c.words.slice(1)}, ${formatMoney(amount, cur)}, is added.`).join('');
    // The step its lien is filed at, or its notice of intent sent (from 2026-10-11).
    if (rules.lien?.atStep === step && !sd.lien) stateLienStep(s, person, r, state);
    if (step < rules.notices.length) {
      const n = rules.notices[step]!;
      sd.collection = step + 1;
      notifyPlayer(s, person, n.title, `${n.code}: you owe ${formatMoney(sd.owed!, cur)} on your ${r.year} ${stateName(state)} return. ${n.words.charAt(0).toUpperCase()}${n.words.slice(1)}${added} You can pay it on Papers, under Tax Returns.`);
      stateNextNotice(s, person, r, state);
      return;
    }
    // The levy: what the bank accounts hold, to what's owed, and California's collection fee with it; Hawaii's on each.
    const first = rules.levy.fee && step === rules.notices.length ? usd(rules.levy.fee, cur) : 0;
    const each = rules.levy.feeEach ? usd(rules.levy.feeEach, cur) : 0;
    if (first + each) setStateOwed(sd, { ...sd.parts!, penalty: sd.parts!.penalty + first + each }, s.now);
    const bank = drawFromBank(s, person, sd.owed!, false, true);
    const taken = sd.owed! - bank.short;
    if (taken > 0) {
      s.post({ memo: `${rules.short} levy, ${r.year} return`, category: 'tax', postings: [{ accountId: s.nominalAccount('expense', expenseFor('tax')).id, amount: taken }, ...bank.postings] });
      applyStatePayment(s, person, r, state, taken, 'levy');
    }
    sd.collection = step + 1;
    notifyPlayer(s, person, rules.levy.title, `${rules.short} took ${formatMoney(taken, cur)} from your bank accounts for your ${r.year} ${stateName(state)} return${first ? `, with its ${formatMoney(first, cur)} collection fee` : ''}${each ? `, with its ${formatMoney(each, cur)} levy fee` : ''}.${added}${sd.owed ? ` You still owe ${formatMoney(sd.owed, cur)}.` : ' The year is paid.'}`);
    if (sd.owed) stateNextNotice(s, person, r, state);
  });

  sim.onCommand<{ state: string; year: number; amount?: Money }, { paid: Money; owed: Money; tax: Money; penalty: Money; interest: Money }>('tax.pay_state', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const r = person.returns?.[String(p?.year)];
    const sd = r?.stateDue?.[state];
    if (!r || !sd?.owed) throw new CommandError(`You owe ${agencyOf(state)} nothing on that year.`);
    const cur = saveCurrency(s.universe);
    const total = stateOwedOn(sd, stateDueOf(r), s.now);
    const amount = p.amount === undefined ? total : Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Enter an amount above zero.');
    if (amount > total) throw new CommandError(`You owe ${agencyOf(state)} ${formatMoney(total, cur)}. Pay that amount or less.`);
    if (!payFromBank(s, person, amount, `${stateName(state)} income tax owed, ${r.year}${amount < total ? ', in part' : ''}`, 'tax')) throw new CommandError(`Your bank can’t cover ${formatMoney(amount, cur)}, so nothing was paid.`);
    const split = applyStatePayment(s, person, r, state, amount, 'payment');
    return { paid: amount, owed: sd.owed ?? 0, ...split };
  });

  sim.onCommand<{ state: string; months: number; long?: boolean; down?: Money }, { decideAt: Instant; monthly: Money; fee: Money; down: Money }>('tax.apply_state_plan', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const months = Math.round(Number(p?.months));
    const opts = { long: p?.long === true, down: Math.round(Number(p?.down ?? 0)) };
    const no = statePlanRefusal(s, person, state, months, opts);
    if (no) throw new CommandError(no);
    const rules = rulesOf(state)!;
    const cur = saveCurrency(s.universe);
    const fee = statePlanFee(person, rules, cur);
    // A plan in force replaced by Pennsylvania's extended one: its payments stop, the new one covers everything.
    const old = person.statePlans?.[state];
    if (old && old.status === 'active') {
      old.status = 'ended';
      old.why = `Replaced by its ${rules.plan.long!.name.toLowerCase()}`;
      note(old, s.now, old.why);
      for (const one of s.universe.scheduled) if (one.status === 'pending' && (one.kind === STATE_PLAN_KIND || one.kind === STATE_PLAN_END_KIND) && one.payload.personId === person.id && one.payload.state === state) s.timeline.cancel(one.id, s.now);
    }
    // Paid down first, from the bank, to the oldest year.
    if (opts.down > 0) {
      if (!payFromBank(s, person, opts.down, `${rules.short}, paid down with a plan request`, 'tax')) throw new CommandError(`Your bank can’t cover the ${formatMoney(opts.down, cur)} down payment, so nothing was paid.`);
      payStateOldest(s, person, state, opts.down, 'payment');
    }
    const owed = owedToState(person, state, s.now) + (rules.plan.feeAdded ? fee : 0);
    // Asked for: what Colorado's lower rate reads (`raisedFrom`).
    for (const r of Object.values(person.returns ?? {})) { const sd = r.stateDue?.[state]; if (sd?.owed) sd.planAskedAt ??= s.now; }
    const monthly = Math.ceil(owed / months);
    const long = opts.long ? rules.plan.long! : undefined;
    const decideDays = long ? long.decideDays : rules.plan.decideDays;
    const plan: StatePlan = { state, status: 'pending', appliedAt: s.now, decideAt: s.now + Math.max(1, decideDays * MS_DAY), months, monthly, fee, covers: owed, history: [], ...(opts.down ? { down: opts.down } : {}),
      ...(long ? { long: { name: long.name, ...(long.statement ? { statement: financialStatement(s, person) } : {}) } } : {}) };
    if (opts.down) note(plan, s.now, 'Paid down with the request', opts.down);
    note(plan, s.now, long ? `${long.name} asked for${long.statement ? `, with ${long.statement}` : ''}${(long.decideAssumed ? ' (how long a decision takes isn’t published, so it’s estimated)' : '')}` : `Asked for online${rules.plan.decideAssumed ? ' (how long a decision takes isn’t published, so in the game it’s decided at once)' : ''}`);
    statePlansOf(person)[state] = plan;
    s.schedule({ at: plan.decideAt, kind: STATE_PLAN_KIND, label: `${rules.short} On Your Plan`, category: 'personal', priority: 25, payload: { personId: person.id, state, decide: true } });
    return { decideAt: plan.decideAt, monthly, fee, down: opts.down };
  });

  // A lien's steps on the calendar: filed after its notice of intent, released after payment, a dispute decided.
  sim.onSchedule(STATE_LIEN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person?.returns?.[String(item.payload.year)];
    const state = String(item.payload.state);
    const sd = r?.stateDue?.[state];
    const l = sd?.lien;
    if (!person || !r || !sd || !l) return;
    if (item.payload.action === 'file') {
      if (l.status !== 'intent') return;
      if (!sd.owed || livePlan(person, state)) { l.status = 'dropped'; lienNote(l, s.now, 'Not filed: paid or under a plan'); return; }
      fileStateLien(s, person, r, state, 'collection');
      return;
    }
    if (item.payload.action === 'release') { if (l.status === 'paid') releaseStateLien(s, person, r, state); return; }
    if (item.payload.action === 'decide' && l.status === 'disputed') {
      // Withdrawn as filed in error, its fees taken off or refunded.
      const cur = saveCurrency(s.universe);
      l.status = 'withdrawn';
      l.withdrawnAt = s.now;
      const fee = l.fee;
      if (fee) {
        if (sd.owed && sd.parts && sd.parts.penalty >= fee) setStateOwed(sd, { ...sd.parts, penalty: sd.parts.penalty - fee }, s.now);
        else s.post({ memo: `${agencyOf(state)}: a lien’s fee back, filed in error`, category: 'tax', postings: [{ accountId: payeeAccount(s, person).id, amount: fee }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -fee }] });
      }
      lienNote(l, s.now, `Withdrawn as filed in error${fee ? `, its ${formatMoney(fee, cur)} fee back` : ''}`);
      notifyPlayer(s, person, `Your ${l.name} Is Withdrawn`, `${agencyOf(state)} withdrew the ${l.name} on your ${r.year} ${stateName(state)} return, because it was filed in error${fee ? `, and refunded its ${formatMoney(fee, cur)} fee` : ''}.`);
    }
  });

  sim.onCommand<{ state: string; year: number }, { waived: Money }>('tax.request_waiver', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const r = person.returns?.[String(p?.year)];
    const no = waiverRefusal(s, r, state);
    if (no) throw new CommandError(no);
    const sd = r!.stateDue![state]!;
    const share = waiverShare(r!, state);
    const waived = Math.round(sd.threeYear!.amount * share);
    sd.threeYear!.waived = waived;
    sd.threeYear!.waivedAt = s.now;
    const cur = saveCurrency(s.universe);
    // What of it is still owed comes off the penalty; what was paid toward it already, a payment goes to the penalty
    // first in Oregon, is an overpayment now: credited to the year's interest and tax still owed, and the rest refunded
    // (SLATE's reading of ORS 314.415's credits and refunds; the waiver's rule says nothing of a part already paid). From
    // 2026-10-16: until then the part paid was dropped, so a year paid down to $10.00 of penalty and waived $125.00 lost
    // $115.00 (tests/remaining-tax.test.ts).
    let off = 0;
    if (sd.owed && sd.parts) { accrueState(sd, stateDueOf(r!), s.now); off = Math.min(waived, sd.parts.penalty); setStateOwed(sd, { ...sd.parts, penalty: sd.parts.penalty - off }, s.now); }
    const paid = waived - off;
    const credited = paid > 0 && sd.owed ? applyStatePayment(s, person, r!, state, Math.min(paid, stateOwedOn(sd, stateDueOf(r!), s.now)), 'refund offset') : undefined;
    const creditedTotal = credited ? credited.tax + credited.penalty + credited.interest : 0;
    const back = paid - creditedTotal;
    if (back > 0) s.post({ memo: `${agencyOf(state)}: a penalty waived and refunded`, category: 'tax', postings: [{ accountId: payeeAccount(s, person).id, amount: back }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -back }] });
    notifyPlayer(s, person, `${rulesOf(state)!.short} Waived Part Of Your Penalty`, `${formatMoney(waived, cur)} of the three-year penalty on your ${r!.year} return is waived: ${Math.round(share * 100)}%, by its schedule.${creditedTotal > 0 ? ` The ${formatMoney(creditedTotal, cur)} you’d paid toward it goes to what you still owe on the year.` : ''}${back > 0 ? ` The ${formatMoney(back, cur)} you’d paid toward it comes back to you.` : ''}`);
    return { waived };
  });

  sim.onCommand<{ state: string; year: number }, { releaseDue?: Instant }>('tax.lien_release', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const r = person.returns?.[String(p?.year)];
    const no = lienReleaseRefusal(s, person, r, state);
    if (no) throw new CommandError(no);
    const lr = rulesOf(state)!.lien!;
    const cur = saveCurrency(s.universe);
    const l = r!.stateDue![state]!.lien!;
    const fee = lr.releaseFee ? usd(lr.releaseFee, cur) : 0;
    if (fee) {
      if (!payFromBank(s, person, fee, `${agencyOf(state)}: a lien’s release fee`, 'tax')) throw new CommandError(`Your bank can’t cover its ${formatMoney(fee, cur)} release fee, so nothing was paid.`);
      lienNote(l, s.now, 'The release fee paid', fee);
    }
    lienNote(l, s.now, 'Its release asked for');
    releaseLater(s, person, r!, state);
    return { ...(l.releaseDue !== undefined ? { releaseDue: l.releaseDue } : {}) };
  });

  sim.onCommand<{ state: string; year: number }, { decideAt: Instant }>('tax.lien_dispute', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const r = person.returns?.[String(p?.year)];
    const no = lienDisputeRefusal(r, state);
    if (no) throw new CommandError(no);
    const lr = rulesOf(state)!.lien!;
    const l = r!.stateDue![state]!.lien!;
    l.status = 'disputed';
    l.disputedAt = s.now;
    l.decideAt = s.now + lr.error.days * MS_DAY;
    lienNote(l, s.now, `Asked to be withdrawn as filed in error: ${lr.error.how}`);
    s.schedule({ at: l.decideAt, kind: STATE_LIEN_KIND, label: l.name, category: 'system', priority: 20, payload: { personId: person.id, year: r!.year, state, action: 'decide' } });
    return { decideAt: l.decideAt };
  });

  sim.onSchedule(STATE_PLAN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const state = String(item.payload.state);
    const p = person?.statePlans?.[state];
    if (!person || !p) return;
    const rules = rulesOf(state)!;
    const cur = saveCurrency(s.universe);
    if (item.payload.decide === true) {
      if (p.status !== 'pending') return;
      // A longer arrangement decided on its statement: approved where the monthly payment fits what it leaves each month,
      // SLATE's rule where the state publishes none (from 2026-10-11).
      const st = p.long?.statement;
      if (st && p.monthly > Math.max(0, st.net)) {
        p.status = 'declined';
        p.why = `Declined: ${formatMoney(p.monthly, cur)} a month is more than the ${formatMoney(Math.max(0, st.net), cur)} your financial statement leaves over each month`;
        note(p, s.now, p.why);
        for (const r of Object.values(person.returns ?? {})) if (r.stateDue?.[state]?.owed) stateNextNotice(s, person, r, state);
        notifyPlayer(s, person, `${rules.short} Declined Your ${p.long!.name}`, `${p.why}. A plan could fit with a longer term, a smaller balance, or some of it paid first. Collection continues in the meantime.`);
        return;
      }
      startStatePlan(s, person, p);
      notifyPlayer(s, person, `${rules.short} Approved Your Plan`, `${formatMoney(p.monthly, cur)} a month for ${p.months} months, from ${formatDate(p.nextDue!, HOME)}. Collection has stopped, but interest${rules.payLate.monthly ? ' and the late-payment penalty keep' : ' keeps'} adding up.`);
      return;
    }
    if (p.status !== 'active') return;
    const owed = owedToState(person, state, s.now);
    if (owed <= 0) { endStatePlan(s, person, p, 'paid', 'Paid off'); return; }
    const due = Math.min(owed, p.monthly);
    if (!payFromBank(s, person, due, `${rules.short} payment plan`, 'tax')) { missStatePlan(s, person, p, due); return; }
    payStateOldest(s, person, state, due, 'plan');
    note(p, s.now, 'A payment', due);
    if (owedToState(person, state, s.now) <= 0) { endStatePlan(s, person, p, 'paid', 'Paid off'); return; }
    p.nextDue = s.now + 30 * MS_DAY;
    s.schedule({ at: p.nextDue, kind: STATE_PLAN_KIND, label: `${rules.short}: A Plan Payment`, category: 'personal', priority: 25, payload: { personId: person.id, state } });
  });

  sim.onSchedule(STATE_PLAN_END_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const state = String(item.payload.state);
    const p = person?.statePlans?.[state];
    if (!person || !p || p.status !== 'missed') return;
    endStatePlan(s, person, p, 'ended', 'Ended: not caught up');
    notifyPlayer(s, person, `${rulesOf(state)!.short} Ended Your Plan`, 'You didn’t make up the missed payment in time. Collection resumes on what you owe.');
  });

  sim.onCommand<{ state: string }, { paid: Money }>('tax.catch_up_state_plan', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const plan = person.statePlans?.[state];
    if (!plan || plan.status !== 'missed') throw new CommandError('That plan isn’t behind, so there’s nothing to catch up.');
    const rules = rulesOf(state)!;
    const due = Math.min(owedToState(person, state, s.now), plan.monthly);
    if (!payFromBank(s, person, due, `${rules.short} payment plan, caught up`, 'tax')) throw new CommandError(`Your bank can’t cover ${formatMoney(due, saveCurrency(s.universe))}, so nothing was paid.`);
    payStateOldest(s, person, state, due, 'plan');
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_PLAN_END_KIND && one.payload.personId === person.id && one.payload.state === state) s.timeline.cancel(one.id, s.now);
    plan.status = 'active';
    delete plan.endsBy;
    note(plan, s.now, 'Caught up', due);
    if (owedToState(person, state, s.now) <= 0) { endStatePlan(s, person, plan, 'paid', 'Paid off'); return { paid: due }; }
    if (!s.universe.scheduled.some((i) => i.status === 'pending' && i.kind === STATE_PLAN_KIND && i.payload.personId === person.id && i.payload.state === state)) { plan.nextDue = s.now + 30 * MS_DAY; s.schedule({ at: plan.nextDue, kind: STATE_PLAN_KIND, label: `${rules.short}: A Plan Payment`, category: 'personal', priority: 25, payload: { personId: person.id, state } }); }
    return { paid: due };
  });
}
