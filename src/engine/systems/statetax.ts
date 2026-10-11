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
export const stateName = (state: string): string => ({ 'us-ct': 'Connecticut', 'us-ny': 'New York', 'us-ca': 'California', 'us-il': 'Illinois', 'us-ma': 'Massachusetts', 'us-ga': 'Georgia', 'us-co': 'Colorado', 'us-or': 'Oregon', 'us-az': 'Arizona', 'us-nc': 'North Carolina', 'us-la': 'Louisiana', 'us-nm': 'New Mexico', 'us-hi': 'Hawaii' } as Record<string, string>)[state] ?? state;

const monthsBegun = (from: Instant, to: Instant) => Math.ceil(Math.max(0, to - from) / MONTH);

/** The late-payment penalty's share by a moment, from the due date: once, then a share a month or part, to its cap. */
export function statePayLateRate(rules: StateRules, due: Instant, at: Instant): number {
  if (at <= due) return 0;
  const months = Math.min(rules.payLate.months ?? Number.POSITIVE_INFINITY, monthsBegun(due, at));
  return Math.min(rules.payLate.cap, rules.payLate.once + rules.payLate.monthly * months);
}

/** What's owed to a state at a moment, in its parts: its interest and its late-payment penalty since last brought up to date. */
export function statePartsOn(sd: StateDue, due: Instant, at: Instant): OwedParts {
  if (!sd.owed || !sd.parts) return { tax: 0, penalty: 0, interest: 0 };
  const rules = rulesOf(sd.state);
  const p = sd.parts;
  if (!rules) return { ...p };
  const from = sd.accruedAt ?? at;
  const penalty = p.penalty + Math.max(0, statePayLateRate(rules, due, at) - (sd.payLateRate ?? 0)) * p.tax;
  let interest = p.interest;
  if (rules.interest.how === 'daily') {
    // From the due date at the earliest: none on a balance before it's due.
    const base = p.tax + p.interest + (rules.interest.onPenalty ? p.penalty : 0);
    interest += base * ((1 + rules.interest.yearly / 365) ** (Math.max(0, at - Math.max(from, due)) / MS_DAY) - 1);
  } else {
    // A month or part from the due date, simple, on the tax: the months begun since those already charged.
    const months = monthsBegun(due, at) - (sd.interestMonths ?? 0);
    interest += Math.max(0, months) * (rules.interest.yearly / 12) * p.tax;
  }
  const whole = Math.round(p.tax + penalty + interest);
  return { tax: p.tax, penalty: Math.round(penalty), interest: whole - p.tax - Math.round(penalty) };
}

export const stateOwedOn = (sd: StateDue, due: Instant, at: Instant): Money => {
  const p = statePartsOn(sd, due, at);
  return p.tax + p.penalty + p.interest;
};

/** Brought up to a moment: its parts, the penalty's share charged, the months of interest charged. */
export function accrueState(sd: StateDue, due: Instant, at: Instant): void {
  if (!sd.owed || !sd.parts) return;
  const rules = rulesOf(sd.state);
  sd.parts = statePartsOn(sd, due, at);
  if (rules) {
    sd.payLateRate = Math.max(sd.payLateRate ?? 0, statePayLateRate(rules, due, at));
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
  if (tax <= 0 || filedAt <= due || rules.fileLate.combine === 'none') return 0;
  const months = monthsBegun(due, filedAt);
  let fileLate = Math.min(rules.fileLate.cap, rules.fileLate.monthly * months) * tax;
  if (rules.fileLate.minimum !== undefined && filedAt - due > 60 * MS_DAY) fileLate = Math.max(fileLate, Math.min(usd(rules.fileLate.minimum, into), tax));
  const payLate = statePayLateRate(rules, due, filedAt) * tax;
  // New York's is less the late-payment penalty in the same months (not below its minimum); California's is the larger
  // of the two, not both: here what's added beside the late-payment penalty, which runs on its own schedule.
  if (rules.fileLate.combine === 'reduced-by-payment') return Math.round(Math.max(fileLate - payLate, rules.fileLate.minimum !== undefined && filedAt - due > 60 * MS_DAY ? Math.min(usd(rules.fileLate.minimum, into), tax) : 0));
  return Math.round(Math.max(0, fileLate - payLate));
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
  sd.penalty = rules ? stateFileLate(rules, balance, r.due, sim.now, cur) : 0;
  setStateOwed(sd, { tax: balance, penalty: sd.penalty, interest: 0 }, Math.min(r.due, sim.now));
  sd.payLateRate = 0;
  sd.interestMonths = 0;
  accrueState(sd, r.due, sim.now);
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
  if (owed + (rules.plan.feeAdded ? usd(rules.plan.fee, cur) : 0) > usd(rules.plan.max, cur)) return `${rules.short}’s ${rules.plan.name.toLowerCase()} is for ${formatMoney(usd(rules.plan.max, cur), cur, { cents: false })} or less; ${formatMoney(owed, cur)} is owed.`;
  if (rules.plan.notInCollection && Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) > rules.notices.length)) return `${rules.short} won’t set up a plan on an account it has levied: pay it, or ask by phone, which SLATE doesn’t model.`;
  if (!(months >= rules.plan.minMonths && months <= rules.plan.maxMonths)) return `${rules.short} sets a plan over ${rules.plan.minMonths} to ${rules.plan.maxMonths} months.`;
  return undefined;
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
  if (back > 0) sim.post({ memo: `${stateName(state)} tax refund, ${r.year}`, category: 'tax', postings: [{ accountId: payeeAccount(sim, person).id, amount: back }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -back }] });
}

/**
 * A federal refund's share the IRS sends to a state for its past-due income tax (IRC 6402(e)): after every federal
 * balance, only the state on the return's address, only a debt it has sent a notice for. Returns what it took.
 */
export function federalOffsetToState(sim: Simulation, person: Person, state: string, amount: Money, year: number): Money {
  if (amount <= 0 || !rulesOf(state)) return 0;
  const pastDue = Object.values(person.returns ?? {}).some((r) => (r.stateDue?.[state]?.collection ?? 0) >= 1 && r.stateDue?.[state]?.owed);
  if (!pastDue) return 0;
  const take = Math.min(amount, owedToState(person, state, sim.now));
  if (take <= 0) return 0;
  sim.post({ memo: `Federal refund, ${year}, sent to ${agencyOf(state)}`, category: 'tax', postings: [{ accountId: sim.nominalAccount('expense', expenseFor('tax')).id, amount: take }, { accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -take }] });
  payStateOldest(sim, person, state, take, 'refund offset');
  notifyPlayer(sim, person, `Your ${year} Federal Refund Went To ${stateName(state)}`, `${formatMoney(take, saveCurrency(sim.universe))} of it paid your past-due income tax with ${agencyOf(state)}, as the Treasury Offset Program does.`);
  return take;
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
    if (step < rules.notices.length) {
      const n = rules.notices[step]!;
      sd.collection = step + 1;
      notifyPlayer(s, person, n.title, `${n.code}: ${formatMoney(sd.owed, cur)} on your ${r.year} ${stateName(state)} return; ${n.words}`);
      stateNextNotice(s, person, r, state);
      return;
    }
    // The levy: what the bank accounts hold, to what's owed, and California's collection fee with it.
    const fee = rules.levy.fee ? usd(rules.levy.fee, cur) : 0;
    if (fee && (sd.collection ?? 0) === rules.notices.length) setStateOwed(sd, { ...sd.parts!, penalty: sd.parts!.penalty + fee }, s.now);
    const bank = drawFromBank(s, person, sd.owed!, false, true);
    const taken = sd.owed! - bank.short;
    if (taken > 0) {
      s.post({ memo: `${rules.short} levy, ${r.year} return`, category: 'tax', postings: [{ accountId: s.nominalAccount('expense', expenseFor('tax')).id, amount: taken }, ...bank.postings] });
      applyStatePayment(s, person, r, state, taken, 'levy');
    }
    sd.collection = step + 1;
    notifyPlayer(s, person, rules.levy.title, `${formatMoney(taken, cur)} taken from your bank accounts for your ${r.year} ${stateName(state)} return${fee && step === rules.notices.length ? `, with its ${formatMoney(fee, cur)} collection fee` : ''}${sd.owed ? `; ${formatMoney(sd.owed, cur)} is still owed` : '. The year is paid'}.`);
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
    const fee = usd(rules.plan.fee, cur);
    const owed = owedToState(person, state, s.now) + (rules.plan.feeAdded ? fee : 0);
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
