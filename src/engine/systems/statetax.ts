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
import type { OwedParts, TaxReturn } from './taxreturn';
import { drawFromBank, expenseFor, payFromBank } from './spending';
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
}

/** A state's payment plan, every year owed to it together. */
export interface StatePlan {
  state: string;
  status: 'pending' | 'active' | 'missed' | 'ended' | 'paid';
  appliedAt: Instant;
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
export const agencyOf = (state: string): string => rulesOf(state)?.short ?? `${stateName(state)}’s revenue department`;
export const stateName = (state: string): string => ({ 'us-ct': 'Connecticut', 'us-ny': 'New York', 'us-ca': 'California', 'us-il': 'Illinois', 'us-ma': 'Massachusetts', 'us-ga': 'Georgia', 'us-co': 'Colorado', 'us-or': 'Oregon', 'us-az': 'Arizona', 'us-nc': 'North Carolina', 'us-la': 'Louisiana', 'us-nm': 'New Mexico', 'us-hi': 'Hawaii', 'us-nj': 'New Jersey', 'us-pa': 'Pennsylvania', 'us-mi': 'Michigan', 'us-oh': 'Ohio', 'us-ut': 'Utah' } as Record<string, string>)[state] ?? state;

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
    if (raised === undefined || raised >= at) interest += base * i.yearly * days(start, at) / 365;
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
    // already charged.
    const months = monthsBegun(due, at) - (sd.interestMonths ?? 0);
    interest += Math.max(0, months) * (i.yearly / 12) * (p.tax + (i.onPenalty ? p.penalty : 0));
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
  setStateOwed(sd, { tax, penalty, interest: 0 }, Math.min(r.due, sim.now));
  sd.payLateRate = 0;
  sd.interestMonths = 0;
  delete sd.compounded;
  accrueState(sd, r.due, sim.now);
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
  const fileLate = rules ? stateFileLate(rules, balance, r.due, sim.now, cur) : 0;
  setFromDue(sim, sd, rules, r, balance, fileLate, fileLate);
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
  if (c.share !== undefined) return Math.round(c.share * (c.of === 'tax' ? sd.parts?.tax ?? 0 : owed));
  if (c.under && owed < usd(c.under.below, cur)) return usd(c.under.flat, cur);
  return c.flat !== undefined ? usd(c.flat, cur) : 0;
}

/** A payment on a state's balance, in the state's order (Connecticut's penalty first, by statute), kept with its split. */
export function applyStatePayment(sim: Simulation, person: Person, r: TaxReturn, state: string, amount: Money, how: 'payment' | 'levy' | 'refund offset' | 'plan'): OwedParts {
  const sd = stateDuesOf(r)[state];
  if (!sd?.owed) return { tax: 0, penalty: 0, interest: 0 };
  accrueState(sd, r.due, sim.now);
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
  if (!sd.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year && one.payload.state === state) sim.timeline.cancel(one.id, sim.now);
  return took;
}

/** A state's next notice, or levy, on the calendar. */
export function stateNextNotice(sim: Simulation, person: Person, r: TaxReturn, state: string): void {
  const rules = rulesOf(state);
  const sd = stateDuesOf(r)[state];
  if (!rules || !sd?.owed) return;
  if (sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === STATE_NOTICE_KIND && i.payload.personId === person.id && i.payload.year === r.year && i.payload.state === state)) return;
  const step = sd.collection ?? 0;
  const days = step < rules.notices.length ? rules.notices[step]!.days : step === rules.notices.length ? rules.levy.afterDays : rules.levy.againDays;
  sim.schedule({ at: sim.now + days * MS_DAY, kind: STATE_NOTICE_KIND, label: rules.short, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state } });
}

/** Everything owed to a state, every year, now. */
export function owedToState(person: Person, state: string, at: Instant): Money {
  return Object.values(person.returns ?? {}).reduce((s, r) => { const sd = r.stateDue?.[state]; return s + (sd ? stateOwedOn(sd, r.due, at) : 0); }, 0);
}

/** Everything owed to any state, now. */
export function owedToStates(person: Person, at: Instant): Money {
  return Object.values(person.returns ?? {}).reduce((s, r) => s + Object.values(r.stateDue ?? {}).reduce((t, sd) => t + stateOwedOn(sd, r.due, at), 0), 0);
}

/** A part of what's owed to a state, paid now, the oldest year first. Returns what was applied. */
function payStateOldest(sim: Simulation, person: Person, state: string, amount: Money, how: 'payment' | 'plan' | 'refund offset'): Money {
  let left = amount;
  for (const r of Object.values(person.returns ?? {}).sort((a, b) => a.year - b.year)) {
    const sd = r.stateDue?.[state];
    if (left <= 0 || !sd?.owed) continue;
    const take = Math.min(left, stateOwedOn(sd, r.due, sim.now));
    applyStatePayment(sim, person, r, state, take, how);
    left -= take;
  }
  return amount - left;
}

// --- Plans.

export const statePlansOf = (person: Person): Record<string, StatePlan> => (person.statePlans ??= {});
const note = (p: StatePlan, at: Instant, what: string, amount?: Money) => { p.history.push({ at, what, ...(amount !== undefined ? { amount } : {}) }); if (p.history.length > 40) p.history.splice(0, p.history.length - 40); };

/** Why a state's plan can't be asked for, or nothing. */
export function statePlanRefusal(sim: Simulation, person: Person, state: string, months: number): string | undefined {
  const rules = rulesOf(state);
  if (!rules) return STATE_UNRESEARCHED;
  const plan = person.statePlans?.[state];
  if (plan && ['pending', 'active', 'missed'].includes(plan.status)) return `You have a plan with ${rules.short}.`;
  const owed = owedToState(person, state, sim.now);
  if (owed <= 0) return `You owe ${rules.short} nothing.`;
  const cur = saveCurrency(sim.universe);
  const unfiled = Object.values(person.returns ?? {}).find((r) => r.filedAt === undefined && r.due < sim.now);
  if (unfiled) return `${rules.short} asks every return filed first: ${unfiled.year}’s isn’t.`;
  const max = rules.plan.max;
  if (max !== undefined && owed + (rules.plan.feeAdded ? statePlanFee(person, rules, cur) : 0) > usd(max, cur)) return `${rules.short}’s ${rules.plan.name.toLowerCase()} is for ${formatMoney(usd(max, cur), cur, { cents: false })} or less; ${formatMoney(owed, cur)} is owed.${rules.plan.beyond ? ` ${rules.plan.beyond}` : ''}`;
  if (rules.plan.min !== undefined && owed <= usd(rules.plan.min, cur)) return `${rules.short} sets a plan on more than ${formatMoney(usd(rules.plan.min, cur), cur, { cents: false })}: pay it.`;
  if (rules.plan.notInCollection && Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) > rules.notices.length)) return `${rules.short} won’t set up a plan on an account it has levied: pay it, or ask by phone, which SLATE doesn’t model.`;
  const after = rules.plan.afterStep;
  if (after && !Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) >= after.step && r.stateDue?.[state]?.owed)) return `${rules.short} offers no plan of its own: ${after.who} does, once the debt is sent there.`;
  if (!(months >= rules.plan.minMonths && months <= rules.plan.maxMonths)) return `${rules.short} sets a plan over ${rules.plan.minMonths} to ${rules.plan.maxMonths} months.`;
  if (rules.plan.minMonthly !== undefined && Math.ceil(owed / months) < usd(rules.plan.minMonthly, cur) && months > 1) return `${rules.short} asks at least ${formatMoney(usd(rules.plan.minMonthly, cur), cur, { cents: false })} a month: fewer months.`;
  return undefined;
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
  // California adds its fee to the balance: owed on the latest year, as a fee, not tax.
  if (p.fee > 0 && rules.plan.feeAdded) {
    const r = Object.values(person.returns ?? {}).filter((x) => x.stateDue?.[p.state]?.owed).sort((a, b) => b.year - a.year)[0];
    const sd = r?.stateDue?.[p.state];
    if (r && sd) { accrueState(sd, r.due, sim.now); setStateOwed(sd, { ...sd.parts!, penalty: sd.parts!.penalty + p.fee }, sim.now); note(p, sim.now, 'The setup fee, added to the balance', p.fee); }
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
  if (cure.kind === 'none') { endStatePlan(sim, person, p, 'ended', `Ended: a payment missed (SLATE’s reading: ${rules.short}’s rule on a missed payment wasn’t found)`); notifyPlayer(sim, person, `${rules.short} Ended Your Plan`, `The bank couldn’t pay ${formatMoney(due, cur)}. Collection resumes on what’s owed to it.`); return; }
  p.status = 'missed';
  p.endsBy = cure.kind === 'next-due' ? sim.now + 30 * MS_DAY : sim.now + cure.days * MS_DAY;
  note(p, sim.now, cure.kind === 'next-due' ? 'A payment missed: made up by the next due date, or it’s a default' : 'A payment missed: Intent To Terminate', due);
  sim.schedule({ at: p.endsBy, kind: STATE_PLAN_END_KIND, label: `${rules.short}: Your Plan`, category: 'personal', priority: 25, payload: { personId: person.id, state: p.state } });
  notifyPlayer(sim, person, cure.kind === 'next-due' ? `${rules.short}: A Plan Payment Missed` : `${rules.short}: Intent To Terminate Your Plan`, `The bank couldn’t pay ${formatMoney(due, cur)}. Catch up by ${formatDate(p.endsBy, HOME)}, on Papers, or the plan ends and collection resumes.`);
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
    notifyPlayer(sim, person, `Your ${stateName(state)} Refund Went To What You Owe It`, `${formatMoney(offset, saveCurrency(sim.universe))} of your ${r.year} ${stateName(state)} refund paid your balance with ${agencyOf(state)}.`);
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
    notifyPlayer(sim, person, `Your ${stateName(state)} Refund Went To ${stateName(other)}`, `${formatMoney(take, saveCurrency(sim.universe))} of your ${r.year} ${stateName(state)} refund paid your past-due income tax with ${agencyOf(other)}, under the two states’ refund offset agreement.`);
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
  notifyPlayer(sim, person, `Your ${year} Federal Refund Went To ${stateName(state)}`, `${formatMoney(take, saveCurrency(sim.universe))} of it paid your past-due income tax with ${agencyOf(state)}, as the Treasury Offset Program does.`);
  return take;
}

// --- A return never filed (from 2026-10-11). Until then only the IRS acted on one, with its substitute return; a state
// owed on a return never filed waited for it forever.

export const STATE_NONFILER_KIND = 'tax.state_nonfiler';

/** A state's letters on a return never filed that owes it, on the calendar from its due date (`StateRules.nonFiler`). */
export function scheduleStateNonFiler(sim: Simulation, person: Person, r: TaxReturn, owed: Record<string, Money>): void {
  for (const [state, tax] of Object.entries(owed)) {
    const rules = rulesOf(state);
    if (!rules || tax <= 0 || r.stateDue?.[state]?.filedAt !== undefined) continue;
    if (sim.universe.scheduled.some((i) => i.kind === STATE_NONFILER_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year && i.payload.state === state)) continue;
    sim.schedule({ at: Math.max(sim.now + MS_DAY, r.due + rules.nonFiler.firstDays * MS_DAY), kind: STATE_NONFILER_KIND, label: `${rules.short} On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, state, step: 0 } });
  }
}

/** A non-filer's letter sent, or, past the last, the state's assessment (`assessStateNonFiler`). */
export function stateNonFilerStep(sim: Simulation, person: Person, r: TaxReturn, state: string, step: number, tax: Money): void {
  const rules = rulesOf(state);
  if (!rules || tax <= 0 || r.stateDue?.[state]?.filedAt !== undefined) return;
  const letters = rules.nonFiler.letters;
  if (step < letters.length) {
    const l = letters[step]!;
    notifyPlayer(sim, person, l.title, `${l.code}: your ${r.year} ${stateName(state)} return; ${l.words}`);
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
  const fileLate = stateFileLate(rules, tax, r.due, sim.now, cur);
  const adds = (rules.nonFiler.adds ?? []).reduce((sum, a) => {
    let x = a.share !== undefined ? a.share * tax : 0;
    if (a.atLeast !== undefined) x = Math.max(x, usd(a.atLeast, cur));
    if (a.atMost !== undefined) x = Math.min(x, usd(a.atMost, cur));
    return sum + Math.round(x + (a.flat !== undefined ? usd(a.flat, cur) : 0));
  }, 0);
  setFromDue(sim, sd, rules, r, tax, fileLate + adds, fileLate);
  // A floor on the whole penalty (Connecticut's $50 on a return DRS made).
  const floor = Math.max(0, ...(rules.nonFiler.adds ?? []).map((a) => (a.minPenalty !== undefined ? usd(a.minPenalty, cur) : 0)));
  if (sd.parts && sd.parts.penalty < floor) setStateOwed(sd, { ...sd.parts, penalty: floor }, sim.now);
  sd.collection = 0;
  stateNextNotice(sim, person, r, state);
  statePlanNewBalance(sim, person, state, sd.owed ?? 0);
  const named = (rules.nonFiler.adds ?? []).map((a) => a.label);
  notifyPlayer(sim, person, `${rules.short} Assessed Your ${r.year} Return`, `With no return from you, ${rules.short} assessed ${formatMoney(sd.owed ?? 0, cur)}: the tax from what was reported, its late penalties and interest from the due date${named.length ? `, and ${named.join(' and ')}` : ''}. File your own to replace it.`);
}

/**
 * Their own return in place of a state's assessment: the tax becomes their return's, less what's been paid toward it;
 * the penalties and interest charged fall in proportion, SLATE's reading, as the IRS's reconsideration does here; and
 * anything paid past it comes back.
 */
export function reconsiderState(sim: Simulation, person: Person, r: TaxReturn, state: string, own: Money): void {
  const sd = r.stateDue?.[state];
  if (!sd?.assessedBy || sd.replacedAt !== undefined) return;
  accrueState(sd, r.due, sim.now);
  const paidTax = (sd.payments ?? []).reduce((s, x) => s + x.tax, 0);
  const ratio = sd.balance > 0 ? Math.max(0, own) / sd.balance : 1;
  const p = sd.parts ?? { tax: 0, penalty: 0, interest: 0 };
  setStateOwed(sd, { tax: Math.max(0, own - paidTax), penalty: Math.round(p.penalty * ratio), interest: Math.round(p.interest * ratio) }, sim.now);
  const over = paidTax - Math.max(0, own) + Math.max(0, -own);
  if (over > 0) sim.post({ memo: `${stateName(state)} tax refund, ${r.year}: its assessment replaced by your return`, category: 'tax', postings: [{ accountId: payeeAccount(sim, person).id, amount: over }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -over }] });
  sd.balance = own;
  sd.replacedAt = sim.now;
  if (!sd.owed) for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === STATE_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year && one.payload.state === state) sim.timeline.cancel(one.id, sim.now);
  notifyPlayer(sim, person, `Your ${r.year} Return Replaces ${stateName(state)}’s Assessment`, `${agencyOf(state)} took your own return: ${formatMoney(Math.max(0, own), saveCurrency(sim.universe))} of tax for the year. ${sd.owed ? `${formatMoney(sd.owed, saveCurrency(sim.universe))} is still owed, the penalties and interest in proportion.` : over > 0 ? `${formatMoney(over, saveCurrency(sim.universe))} paid past it comes back.` : 'Nothing more is owed.'}`);
}

// --- How a state's rules read on the screen.

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

/** Its late-payment penalty, in words. */
export function payLateWords(rules: StateRules): string {
  const p = rules.payLate;
  const how = p.steps ? p.steps.map((s) => (s.afterDays > 0 ? `${pct(s.rate)} past ${s.afterDays} days` : `${pct(s.rate)} once late`)).join(', then ') : p.monthly ? `${p.once ? `${pct(p.once)} once, then ` : ''}${pct(p.monthly)} a month, to ${pct(p.cap)}` : `${pct(p.once)} once, past the due date`;
  return `${how}${p.minimum ? `, at least $${p.minimum / 100}` : ''}${p.timelyOnly ? ', on a return filed on time' : ''}${p.from ? `; from returns due ${p.from.due}, ${p.from.once ? `${pct(p.from.once)} once` : `${pct(p.from.monthly)} a month to ${pct(p.from.cap)}`}` : ''}`;
}

/** Its interest, in words. */
export function interestWords(rules: StateRules): string {
  const i = rules.interest;
  const how = { daily: 'compounded daily', 'daily-simple': 'simple, by the day', 'monthly-simple': 'a month or part, simple', yearly: 'added to the principal each January' }[i.how];
  return `${pct(i.yearly)} a year, ${how}${i.onPenalty ? ', on penalties too' : ''}${i.raised ? `; ${pct(i.raised.yearly)} from ${i.raised.afterDays} days after its first notice${i.raised.unlessPlan ? ' unless a plan was asked for' : ''}` : ''}`;
}

/** The order a part payment goes in, in words. */
export function orderWords(rules: StateRules): string {
  const said = rules.order.join(', then the ');
  return rules.orderAssumed ? `${rules.short} doesn’t publish the order a part goes in: SLATE puts it to the ${said}.` : `By its rule a part goes to the ${said}.`;
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
    accrueState(sd, r.due, s.now);
    const cur = saveCurrency(s.universe);
    const step = sd.collection ?? 0;
    if (step === 0) sd.noticedAt ??= s.now;
    // What collection adds at this step: Colorado's 15%, Georgia's 20% with the execution, Illinois's fee (from 2026-10-11).
    const charged = (rules.charges ?? []).filter((c) => c.step === step).map((c) => ({ c, amount: chargeOf(c, sd, cur) })).filter((x) => x.amount > 0);
    for (const { amount } of charged) setStateOwed(sd, { ...sd.parts!, penalty: sd.parts!.penalty + amount }, s.now);
    const added = charged.map(({ c, amount }) => ` ${c.label}, ${formatMoney(amount, cur)}, is added.`).join('');
    if (step < rules.notices.length) {
      const n = rules.notices[step]!;
      sd.collection = step + 1;
      notifyPlayer(s, person, n.title, `${n.code}: ${formatMoney(sd.owed!, cur)} on your ${r.year} ${stateName(state)} return; ${n.words}${added}`);
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
    notifyPlayer(s, person, rules.levy.title, `${formatMoney(taken, cur)} taken from your bank accounts for your ${r.year} ${stateName(state)} return${first ? `, with its ${formatMoney(first, cur)} collection fee` : ''}${each ? `, with its ${formatMoney(each, cur)} levy fee` : ''}${added}${sd.owed ? `; ${formatMoney(sd.owed, cur)} is still owed` : '. The year is paid'}.`);
    if (sd.owed) stateNextNotice(s, person, r, state);
  });

  sim.onCommand<{ state: string; year: number; amount?: Money }, { paid: Money; owed: Money; tax: Money; penalty: Money; interest: Money }>('tax.pay_state', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const r = person.returns?.[String(p?.year)];
    const sd = r?.stateDue?.[state];
    if (!r || !sd?.owed) throw new CommandError(`You owe ${agencyOf(state)} nothing on that year.`);
    const cur = saveCurrency(s.universe);
    const total = stateOwedOn(sd, r.due, s.now);
    const amount = p.amount === undefined ? total : Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Pay something.');
    if (amount > total) throw new CommandError(`${formatMoney(total, cur)} is owed to ${agencyOf(state)}; pay that or less.`);
    if (!payFromBank(s, person, amount, `${stateName(state)} income tax owed, ${r.year}${amount < total ? ', in part' : ''}`, 'tax')) throw new CommandError(`${formatMoney(amount, cur)} is more than the bank can cover.`);
    const split = applyStatePayment(s, person, r, state, amount, 'payment');
    return { paid: amount, owed: sd.owed ?? 0, ...split };
  });

  sim.onCommand<{ state: string; months: number }, { decideAt: Instant; monthly: Money; fee: Money }>('tax.apply_state_plan', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const months = Math.round(Number(p?.months));
    const no = statePlanRefusal(s, person, state, months);
    if (no) throw new CommandError(no);
    const rules = rulesOf(state)!;
    const cur = saveCurrency(s.universe);
    const fee = statePlanFee(person, rules, cur);
    const owed = owedToState(person, state, s.now) + (rules.plan.feeAdded ? fee : 0);
    // Asked for: what Colorado's lower rate reads (`raisedFrom`).
    for (const r of Object.values(person.returns ?? {})) { const sd = r.stateDue?.[state]; if (sd?.owed) sd.planAskedAt ??= s.now; }
    const monthly = Math.ceil(owed / months);
    const plan: StatePlan = { state, status: 'pending', appliedAt: s.now, decideAt: s.now + Math.max(1, rules.plan.decideDays * MS_DAY), months, monthly, fee, covers: owed, history: [] };
    note(plan, s.now, `Asked for online${rules.plan.decideAssumed ? ' (how long it takes isn’t published: SLATE decides it at once)' : ''}`);
    statePlansOf(person)[state] = plan;
    s.schedule({ at: plan.decideAt, kind: STATE_PLAN_KIND, label: `${rules.short} On Your Plan`, category: 'personal', priority: 25, payload: { personId: person.id, state, decide: true } });
    return { decideAt: plan.decideAt, monthly, fee };
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
      startStatePlan(s, person, p);
      notifyPlayer(s, person, `${rules.short} Approved Your Plan`, `${formatMoney(p.monthly, cur)} a month for ${p.months} months, from ${formatDate(p.nextDue!, HOME)}. Interest${rules.payLate.monthly ? ' and the late-payment penalty go' : ' goes'} on; collection has stopped.`);
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
    notifyPlayer(s, person, `${rulesOf(state)!.short} Ended Your Plan`, 'It wasn’t caught up in time. Collection resumes on what’s owed.');
  });

  sim.onCommand<{ state: string }, { paid: Money }>('tax.catch_up_state_plan', (p, { sim: s }) => {
    const person = s.player;
    const state = String(p?.state);
    const plan = person.statePlans?.[state];
    if (!plan || plan.status !== 'missed') throw new CommandError('That plan isn’t behind.');
    const rules = rulesOf(state)!;
    const due = Math.min(owedToState(person, state, s.now), plan.monthly);
    if (!payFromBank(s, person, due, `${rules.short} payment plan, caught up`, 'tax')) throw new CommandError(`${formatMoney(due, saveCurrency(s.universe))} is more than the bank can cover.`);
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
