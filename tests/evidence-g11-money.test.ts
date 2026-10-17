/**
 * Evidence for seven money rows the review of 2026-10-13 left partial (verification group g11-money): paying a loan
 * off, the bank's alerts, how the day is paid and what savings covers, round-ups, taking a term deposit's interest,
 * closing a card and locking one. The gaps it named are closed here where the engine as it stands can close them,
 * through the command the screen sends or the clock that reads it, and each consequence is read where the row says it
 * is read, against figures worked out from the bank's or the law's own numbers, never from the helper the engine
 * computes them with.
 *
 * - `bank.repay_loan`: a $3,000 Citi loan at Citi's lowest published rate, 10.24% (a record of 780 or more), taken on
 *   2 September and paid off from the Personal Loan panel 20 days on, in a 30-day month: refused first in the bank's
 *   words while the account can't cover it, then $3,000 and 20 days' interest, $16.83, from Citi Access Checking, the
 *   next payment called off, and Citi lending again where it had said a loan was held; with nothing borrowed, refused
 *   in its own words. Taken on 24 August instead, a 31-day month, 20 days on charges 20 days’ interest; until
 *   2026-10-13 it charged 19 (a defect, fixed that day).
 * - `bank.set_alerts`: twin lives at Chase given the same stranger's $855.06 on the debit card, one with A Payment Over
 *   typed as 100 and Save Alerts pressed on the Alerts form: told at once, it carries Regulation E's $500 reported
 *   four business days on, and the twin, learning of it from the statement, $50; refunded $355.06 and $805.06. The
 *   school's $1,882.00 and the dental plan's $312.72 told at the day's end, a $300 transfer and $10 of groceries not,
 *   once across a reload, and nothing once the line is turned off; the words name the plans as they’re called, which
 *   until 2026-10-13 they lowercased (a defect, fixed that day).
 *   Statement Ready pressed On and Off on the form, a statement with a payment due told whatever it is, and Short For A
 *   Payment pressed Off (what it silences is tests/account-alerts.test.ts's, through the command).
 * - `bank.set_payments`: a Citi loan repaid from Chase with Citi made primary, the wages sent to Citi and the Chase
 *   current account emptied into Chase Savings: its monthly payment of $264.09 taken by the clock from Chase Savings
 *   with the link pressed On on How You Pay, and missed onto the record with it Off; The Day's Spending changed on How
 *   You Pay, the night's groceries going where it says; and the link refused once Chase Savings is closed through
 *   Close Savings, and On again once it's reopened.
 * - `bank.set_round_ups`: Round-Ups pressed On and Off on the Bank of America panel, a frugal student's $4.29 meal
 *   moving $0.71 into savings at Monday's end, across a reload, and nothing once it's Off; a day ending short of what
 *   was counted moving nothing and dropping it; Wells Fargo's flat $1 for each of two meals moved into Way2Save Savings
 *   at the next business day's start, and the panel saying what SLATE leaves out of Wells Fargo's words.
 * - `bank.take_term_interest`: a Chase CD of $10,000 at 3.5%: refused with nothing earned, the panel's button disabled;
 *   182 days in, $174.52 taken from the panel, the break penalty falling from $172.60 (180 days' interest) to nothing,
 *   and the renewal at the midnight that opens its maturity day reinvesting only the 30 days after, $28.76 (until a fix
 *   of 2026-10-13 it ended a day later and earned that day too, 31 days and $29.72, which this file first held); and
 *   AIB's taken less Ireland's 33% DIRT.
 * - `card.close`: twin lives holding Chase's card and Citi's, Citi owing half its $5,000: Chase's closed at once from the
 *   panel, owing nothing, and Citi's due date moving the record a point down where the twin's moves 1.5 up; a closing
 *   card owing $400 refused a second close, kept from the day's groceries, paid in full from the panel and closed at
 *   its statement, across a reload; and AIB's €30 yearly fee charged on December's statement to the card left open and
 *   not to the one closing.
 * - `card.lock`: both Chase cards locked from Your Cards when the US rate is set to certain, and nobody else's use
 *   drawn on them, until they're unlocked; a meal paid by debit card while the credit card is locked and The Day's
 *   Spending is on it, on the card once unlocked, and refused when the bank is empty; both locks kept across a reload,
 *   the ATM refused and the counter paying; and a debit card reported lost refused a lock, locked once the new one comes.
 *
 * Defects these tests showed, each failing when written, until the engine was fixed on 2026-10-13:
 * - `bank.repay_loan` counted the interest to date as 30 days less the days to the next payment (lending.ts, the
 *   command), so 20 days into a 31-day month it charged 19 days’ interest, and 20 days into February it would have
 *   charged 22.
 * - `A Large Payment` lowercased the whole of what was paid (statements.ts, the day’s rollover), so Yale’s plans read
 *   “yale delta dental basic” and “yale health plan”.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven from Monday 24 August 2026 at 7:30 AM,
 * with the bank chosen at creation (Chase, Citi, Bank of America or Wells Fargo, each a New Haven bank) and, for the
 * round-ups at Bank of America, the Frugal trait, so a $5.00 meal costs $4.29. Two rows reach places a New Haven life
 * doesn't, on quick-save lives in Dublin at AIB, and say so: Ireland's tax taken off interest, and a card with a yearly
 * fee. The bank's panels (Personal Loan, Alerts, How You Pay, Your Accounts Over Time, the card, Your Cards) are
 * rendered as the player has them with react-dom/server, their buttons pressed by their own onClick and The Day's
 * Spending changed by its own onChange.
 *
 * TEST SETUP, said again where it's done: a month's wages posted, which a bank lends against; a balance set or drained
 * by a posting against a test line; purchases put on a card; the US rate of somebody else's use set to certain for the
 * night it's wanted (and nothing stopped), as `tests/security.test.ts` does; notices marked read, as the player reads
 * them; and on the Alerts form the amounts typed, given through the form's own useState in render order, which a
 * static render can't type into.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { bankById } from '@/engine/content/banks';
import { FRAUD_LAW, type FraudLaw } from '@/engine/content/security';
import { LOAN_DUE_KIND } from '@/engine/systems/lending';
import { DUE_KIND, STATEMENT_KIND, cardRoom, cardOf, cardsOf, stateOf } from '@/engine/systems/credit';
import { alertsOf } from '@/engine/systems/statements';
import { paymentsOf } from '@/engine/systems/payments';
import { yearOf } from '@/engine/systems/earnings';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; says: string; disabled?: boolean; onClick?: () => void }[],
  selects: [] as { id?: string; onChange?: (e: { target: { value: string } }) => void }[],
  answers: [] as { kind: string; ok: boolean; error?: string }[],
  toasts: [] as string[],
  /** The screen's useState calls in render order, and what the player typed into one, by its place in that order. */
  calls: 0,
  typed: {} as Record<number, unknown>,
}));

/** The words a control's children make. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));

// What was typed into a form: a static render can't type, so a field's own useState is given the typed value.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    const at = h.calls;
    h.calls += 1;
    return at in h.typed ? [h.typed[at], set] : [value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// Every select a screen draws, with its own onChange, so it can be changed as the player changes it.
const keepSelects = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'select' && props) h.selects.push({ id: props.id as string | undefined, onChange: props.onChange as ((e: { target: { value: string } }) => void) | undefined });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepSelects(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepSelects(await orig<Record<string, unknown>>()));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => {
      const answer = h.sim.execute({ kind, payload });
      h.answers.push({ kind, ok: answer.ok, error: answer.error });
      return answer;
    },
    toast: (message: string) => { h.toasts.push(message); },
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its feature, words and onClick kept so a test can press it as the player would.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, says: textOf(props.children).replace(/\s+/g, ' ').trim(), disabled: Boolean((props as { disabled?: boolean }).disabled), onClick: props.onClick as (() => void) | undefined });
      return ce(real.Gated, props);
    },
  };
});

const { BankLending } = await import('@/ui/bank/BankLending');
const { BankStatements } = await import('@/ui/bank/BankStatements');
const { BankPayments } = await import('@/ui/bank/BankPayments');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');
const { BankCard } = await import('@/ui/bank/BankCard');
const { BankSecurity } = await import('@/ui/bank/BankSecurity');

// ---------------------------------------------------------------------------
// Lives, the clock, the ledger and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 0, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** A new life at Yale with the bank chosen at creation. */
const student = (seed: string, bankId: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId, ...extra });
/** A quick-save life in Dublin at AIB: where a New Haven life doesn't reach. */
const dubliner = (seed: string): Simulation =>
  quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ie-aib' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const account = (sim: Simulation, id: string): Account => sim.universe.accounts[id]!;
const savingsAt = (sim: Simulation, bankId: string): Account => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term' && a.bankId === bankId)!;
const cardAt = (sim: Simulation, bankId: string): Account => cardsOf(sim, sim.player).find((c) => c.bankId === bankId)!;
const walletOf = (sim: Simulation): Account | undefined => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'cash');

/** A command through the engine that must go, and what it answered. */
function ok<T = Record<string, never>>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
}
/** A command through the engine that must be refused, and its words. */
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, `${kind} went through`).toBe(false);
  return answer.error ?? '';
}
/** TEST SETUP: a month's wages paid into an account, which a bank lends against. */
const wages = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: id, amount }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -amount }] });
/** TEST SETUP: an account's balance set by a posting against a test line. */
function setTo(sim: Simulation, id: string, to: number): void {
  const by = to - account(sim, id).balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** TEST SETUP: purchases put on a card. */
const owe = (sim: Simulation, cardId: string, amount: number) => sim.post({ memo: 'Purchases', category: 'shopping', postings: [{ accountId: cardId, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Shopping').id, amount }] });
/** The transactions with a memo, and what each posted to an account. */
const posted = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo);
const on = (txn: { postings: { accountId: string; amount: number }[] }, id: string) => txn.postings.filter((p) => p.accountId === id).reduce((sum, p) => sum + p.amount, 0);
const told = (sim: Simulation, title: string | RegExp) => sim.universe.notifications.filter((n) => (typeof title === 'string' ? n.title === title : title.test(n.title)));

/** A panel as the player has it, its controls kept, with what was typed into its fields given where named. */
function shown(sim: Simulation, element: ReactElement, typed: Record<number, unknown> = {}): string {
  h.sim = sim;
  h.clicks = [];
  h.selects = [];
  h.calls = 0;
  h.typed = typed;
  try {
    return renderToStaticMarkup(element).replace(/<!-- -->/g, '');
  } finally {
    h.typed = {};
  }
}
/** A panel's words, as read: tags gone, and no space left before a comma or a stop where an element ended. */
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.])/g, '$1');
/** Presses a button the panel just drew, by its feature and words (the nth of them where it drew several). */
function press(feature: string, says: string, nth = 0): void {
  const found = h.clicks.filter((c) => c.feature === feature && c.says === says);
  expect(found.length, `${feature} “${says}” is drawn (drawn: ${h.clicks.map((c) => c.says).join(' | ')})`).toBeGreaterThan(nth);
  expect(found[nth]!.disabled, `${feature} “${says}” can be pressed`).toBe(false);
  found[nth]!.onClick!();
}
/** Changes a select the panel just drew, as the player picks an option. */
function pick(id: string, value: string): void {
  const found = h.selects.filter((s) => s.id === id);
  expect(found).toHaveLength(1);
  found[0]!.onChange!({ target: { value } });
}

const laws = FRAUD_LAW as Record<string, FraudLaw>;
const kept = new Map<string, FraudLaw>();
/** TEST SETUP: a country's yearly rate of somebody else's use set, as `tests/security.test.ts` sets it. */
function withLaw(iso: string, change: Partial<FraudLaw>): void { if (!kept.has(iso)) kept.set(iso, laws[iso]!); laws[iso] = { ...laws[iso]!, ...change }; }
afterEach(() => { for (const [k, v] of kept) laws[k] = v; kept.clear(); });

// ---------------------------------------------------------------------------
// bank.repay_loan
// ---------------------------------------------------------------------------

describe('bank.repay_loan', () => {
  it('pays a Citi loan off from the Personal Loan panel 20 days into a 30-day month: refused first where the account can’t cover it, then $3,000 and 20 days’ interest from Citi Access Checking, the next payment called off, and Citi lending again', () => {
    let sim = student('g11-loan', 'us-citi');
    const citi = bankById('us-citi')!;
    expect(refusal(sim, 'bank.repay_loan')).toBe('You don’t have a loan to pay off.');
    sim.advanceTo(at(2026, 9, 2, 9));
    const checking = primary(sim);
    expect(checking.name).toBe('Citi Access Checking');
    wages(sim, checking.id, 4_000_00); // TEST SETUP
    const borrowed = ok<{ apr: number; payment: number; loanId: string }>(sim, 'bank.borrow', { amount: 3_000_00, months: 12 });
    // Citi's lowest published rate, 10.24%, for a record of 780 or more (the student's is 795). Twelve equal payments
    // of $3,000 at 10.24%/12 a month: 3,000 × r / (1 − (1 + r)^−12) = $264.09, rounded up.
    expect(borrowed.apr).toBe(0.1024);
    expect(borrowed.payment).toBe(264_09);
    const loanId = borrowed.loanId;
    const nextDue = () => sim.universe.scheduled.find((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending' && i.refId === loanId);
    expect(nextDue()!.at).toBe(at(2026, 10, 2, 9));
    // One loan at a bank: Citi won't lend again while this one is held.
    expect(refusal(sim, 'bank.borrow', { amount: 2_000_00, months: 12 })).toBe('You already have a loan with Citi.');

    sim.advanceTo(at(2026, 9, 22, 9));
    sim = reload(sim);
    const panel = () => words(shown(sim, createElement(BankLending, { bank: citi, show: ['borrowing'] })));
    expect(panel()).toContain('$3,000 owed at 10.24% a year, $264 a month over the 12 months it was taken for, next on October 2, 2026, from Citi Access Checking at Citi.');

    // 20 days from 2 September at 10.24% on $3,000: 3,000 × 0.1024 × 20 / 365 = $16.83, so $3,016.83 in all.
    const interest = 16_83;
    const payoff = 3_000_00 + interest;
    // TEST SETUP: Citi Access Checking down to $1,000; savings isn't linked to it, so the bank can't cover the payoff.
    setTo(sim, checking.id, 1_000_00);
    press('bank.repay_loan', 'Pay It Off');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.repay_loan', ok: false, error: 'Paying it off takes $3,017, and the bank can’t cover it all.' });
    expect(account(sim, loanId).closedAt).toBeUndefined();
    expect(account(sim, loanId).balance).toBe(-3_000_00);
    expect(posted(sim, 'Interest: Citi Personal Loan')).toEqual([]);
    expect(nextDue()).toBeDefined();

    // Moved in from Citi Savings, as Move Money moves it; then paid off.
    ok(sim, 'bank.transfer', { fromId: savingsAt(sim, 'us-citi').id, toId: checking.id, amount: 5_000_00 });
    const before = account(sim, checking.id).balance;
    expect(before).toBe(6_000_00);
    panel();
    h.toasts = [];
    press('bank.repay_loan', 'Pay It Off');
    expect(h.toasts).toEqual(['Paid off.']);
    expect(before - account(sim, checking.id).balance).toBe(payoff);
    const charged = posted(sim, 'Interest: Citi Personal Loan');
    expect(charged).toHaveLength(1);
    expect(charged[0]!.category).toBe('loan_interest');
    expect(on(charged[0]!, loanId)).toBe(-interest);
    const paid = posted(sim, 'Paid off Citi Personal Loan');
    expect(paid).toHaveLength(1);
    expect(on(paid[0]!, loanId)).toBe(payoff);
    expect(on(paid[0]!, checking.id)).toBe(-payoff);
    expect(account(sim, loanId).balance).toBe(0);
    expect(account(sim, loanId).closedAt).toBe(sim.now);
    expect(nextDue()).toBeUndefined();

    // The panel offers a loan again, and Citi lends.
    expect(panel()).not.toContain('owed at');
    expect(panel()).toContain('10.24% to 18.49% a year, by your record.');
    const again = ok<{ loanId: string }>(sim, 'bank.borrow', { amount: 2_000_00, months: 12 });
    expect(again.loanId).not.toBe(loanId);

    // Across a reload and past the date the old loan's payment was due: nothing more is taken for it.
    const paidAt = sim.now;
    sim = reload(sim);
    sim.advanceTo(at(2026, 10, 2, 12));
    expect(sim.universe.transactions.filter((t) => t.at > paidAt && t.postings.some((p) => p.accountId === loanId))).toEqual([]);
    expect(account(sim, loanId).balance).toBe(0);
  });

  it('charges 20 days’ interest 20 days into a loan taken on 24 August, a 31-day month', () => {
    const sim = student('g11-loan-31', 'us-citi');
    wages(sim, primary(sim).id, 4_000_00); // TEST SETUP
    const { loanId } = ok<{ loanId: string }>(sim, 'bank.borrow', { amount: 3_000_00, months: 12 });
    const due = sim.universe.scheduled.find((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending' && i.refId === loanId)!;
    expect(due.at - sim.now).toBe(31 * MS_DAY);
    sim.advanceTo(sim.now + 20 * MS_DAY);
    const { paid } = ok<{ paid: number }>(sim, 'bank.repay_loan', { loanId });
    // 3,000 × 0.1024 × 20 / 365 = $16.83. Until 2026-10-13 the command counted 30 days less the 11 to the payment, 19,
    // and asked $15.99; fixed that day.
    expect(paid).toBe(3_016_83);
  });
});

// ---------------------------------------------------------------------------
// bank.set_alerts
// ---------------------------------------------------------------------------

/**
 * The Alerts form's two fields, by their place among the statements screen's useState calls in render order: the
 * account, the period, the statement's look, The Year's year, then these. The rendered fields' values check the place.
 */
const LOW = 4;
const LARGE = 5;

describe('bank.set_alerts', () => {
  it('leaves Regulation E’s $500 of a stranger’s $855.06 caught by A Payment Over, typed on the Alerts form, and reported four business days on, and $50 to a twin who learned of it from the statement', () => {
    const alerted = student('g11-c', 'us-chase');
    const quiet = student('g11-c', 'us-chase');
    // The Alerts form as the player fills it (TEST SETUP: the typing): A Payment Over typed as 100, the low line left
    // empty, and Save Alerts pressed.
    const html = shown(alerted, createElement(BankStatements), { [LOW]: '', [LARGE]: '100' });
    expect(html).toMatch(/id="alert-large"[^>]*value="100"/);
    expect(html).toMatch(/id="alert-low"[^>]*value=""/);
    h.toasts = [];
    press('bank.set_alerts', 'Save Alerts');
    expect(h.toasts).toEqual(['Alerts saved.']);
    expect(alertsOf(alerted.player).largePayment).toBe(100_00);
    expect(alertsOf(alerted.player).lowBalance).toBeUndefined();
    expect(alertsOf(quiet.player).largePayment).toBeUndefined();

    // TEST SETUP: the US rate set to certain for the night, nothing stopped, so the day's draw comes for both alike.
    withLaw('US', { fraudRate: 1, preventedShare: 0 });
    for (const sim of [alerted, quiet]) sim.advanceTo(at(2026, 8, 25, 0, 1));
    withLaw('US', { fraudRate: 0 });
    const a = alerted.player.fraud![0]!;
    const b = quiet.player.fraud![0]!;
    for (const one of [a, b]) expect(one).toMatchObject({ which: 'debit', amount: 855_06, at: at(2026, 8, 25), accountId: primary(alerted).id });
    // Caught by the alert the moment it's taken; otherwise seen on the statement, at the bank's month's end.
    expect(a.learnedAt).toBe(at(2026, 8, 25));
    expect(b.learnedAt).toBe(at(2026, 9, 1));
    const last4 = primary(alerted).plastic!.last4;
    const ofIt = (sim: Simulation) => told(sim, 'A Large Payment').filter((n) => n.body.includes('debit card ending'));
    expect(ofIt(alerted).map((n) => n.body)).toEqual([`$855.06 on your debit card ending ${last4}. If it wasn’t you, report it.`]);
    expect(told(quiet, 'A Large Payment')).toEqual([]);

    // Reported on Monday 31 August, four business days after Tuesday's use: past the two that keep it to $50 for the
    // one told at once, inside them for the one who learns of it on 1 September.
    for (const sim of [alerted, quiet]) sim.advanceTo(at(2026, 8, 31, 9));
    expect(ofIt(alerted)).toHaveLength(1);
    const A = ok<{ carried: number; refundAt: number }>(alerted, 'card.dispute', { index: 0 });
    const B = ok<{ carried: number; refundAt: number }>(quiet, 'card.dispute', { index: 0 });
    expect(A.carried).toBe(500_00);
    expect(B.carried).toBe(50_00);
    for (const [sim, back] of [[alerted, 355_06], [quiet, 805_06]] as const) {
      sim.advanceTo(Math.max(A.refundAt, B.refundAt) + MS_HOUR);
      const refunds = posted(sim, 'Refund: a payment you didn’t make');
      expect(refunds).toHaveLength(1);
      expect(on(refunds[0]!, primary(sim).id)).toBe(back);
    }
  });

  it('tells of the school’s $1,882.00 and the dental plan’s $312.72 at the day’s end, not of a $300 transfer or $10 of groceries, once across a reload, and nothing once the line is turned off', () => {
    let sim = student('g11-large', 'us-chase');
    const checking = primary(sim).id;
    ok(sim, 'bank.set_alerts', { largePayment: 100_00 });
    // Yale's student dental plan for the year, $312.72, now; the fall term's Yale Health plan, $1,882.00, at 9 AM.
    ok(sim, 'health.dental', { on: true });
    sim.advanceTo(at(2026, 8, 24, 23));
    expect(posted(sim, 'Yale Health plan, the fall term of 2026').map((t) => on(t, checking))).toEqual([-1_882_00]);
    // Told at the day's end, not as it's paid.
    expect(told(sim, 'A Large Payment')).toEqual([]);
    ok(sim, 'bank.transfer', { fromId: checking, toId: savingsAt(sim, 'us-chase').id, amount: 300_00 });
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    const bodies = () => told(sim, 'A Large Payment').map((n) => n.body).sort();
    expect(bodies()).toHaveLength(2);
    expect(bodies()[0]).toMatch(/^\$1,882\.00 for yale health plan, the fall term of 2026, from Chase Total Checking\.$/i);
    expect(bodies()[1]).toMatch(/^\$312\.72 for yale delta dental basic, the year, from Chase Total Checking\.$/i);
    // A night's groceries are $10.00, under the line; across a reload nothing already told is told again.
    expect(posted(sim, 'Groceries').filter((t) => t.at === at(2026, 8, 25)).map((t) => on(t, checking))).toEqual([-10_00]);
    sim = reload(sim);
    sim.advanceTo(at(2026, 8, 27, 0, 1));
    expect(bodies()).toHaveLength(2);

    // Turned off (the field left empty sends null): the same two payments go untold.
    const off = student('g11-large', 'us-chase');
    ok(off, 'bank.set_alerts', { largePayment: 100_00 });
    ok(off, 'bank.set_alerts', { largePayment: null });
    expect(alertsOf(off.player).largePayment).toBeUndefined();
    ok(off, 'health.dental', { on: true });
    off.advanceTo(at(2026, 8, 25, 0, 1));
    expect(posted(off, 'Yale Health plan, the fall term of 2026')).toHaveLength(1);
    expect(told(off, 'A Large Payment')).toEqual([]);
  });

  it('names Yale’s plans as they’re called in A Large Payment', () => {
    const sim = student('g11-large-words', 'us-chase');
    ok(sim, 'bank.set_alerts', { largePayment: 100_00 });
    ok(sim, 'health.dental', { on: true });
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    expect(told(sim, 'A Large Payment').map((n) => n.body).sort()).toEqual([
      '$1,882.00 for Yale Health plan, the fall term of 2026, from Chase Total Checking.',
      '$312.72 for Yale Delta Dental Basic, the year, from Chase Total Checking.',
    ]);
  });

  it('tells of a statement ready only while Statement Ready is pressed On on the Alerts form, and of a card’s statement with a payment due whatever it is', () => {
    const asked = student('g11-statements', 'us-chase');
    const quiet = student('g11-statements', 'us-chase');
    const form = (sim: Simulation) => words(shown(sim, createElement(BankStatements)));
    expect(form(asked)).toContain('Statement Ready: Off');
    press('bank.set_alerts', 'Statement Ready: Off');
    expect(alertsOf(asked.player).statements).toBe(true);
    expect(form(asked)).toContain('Statement Ready: On');
    // Short For A Payment, pressed Off on the same form (what it silences: tests/account-alerts.test.ts).
    press('bank.set_alerts', 'Short For A Payment: On');
    expect(alertsOf(asked.player).upcoming).toBe(false);
    expect(form(asked)).toContain('Short For A Payment: Off');
    // TEST SETUP: $400 of purchases on the quiet twin's card, which its statement on 20 September asks it to pay.
    owe(quiet, cardAt(quiet, 'us-chase').id, 400_00);

    // The month's end, at 11 PM on 31 August: the current account's statement, at what it closed on.
    for (const sim of [asked, quiet]) sim.advanceTo(at(2026, 8, 31, 23, 1));
    const closedOn = primary(asked).balance;
    expect(told(asked, 'Statement Ready: Chase Total Checking').map((n) => n.body)).toEqual([`${formatMoney(closedOn, 'USD')} at the close.`]);
    expect(told(quiet, 'Statement Ready: Chase Total Checking')).toEqual([]);
    // The card's statement on 20 September: owing nothing, told only where it's asked; owing, told anyway.
    for (const sim of [asked, quiet]) sim.advanceTo(at(2026, 9, 20, 9, 1));
    expect(told(asked, 'Statement Ready: Chase Freedom Unlimited').map((n) => n.body)).toEqual(['The card owes nothing this month.']);
    expect(told(quiet, 'Statement Ready: Chase Freedom Unlimited').map((n) => n.body)).toEqual([expect.stringMatching(/^\$400\.00 to pay, at least \$\d+\.\d\d\.$/)]);
    expect(told(quiet, 'Statement Ready: Chase Total Checking')).toEqual([]);

    // TEST SETUP: the notices read, as the player reads them. Then Statement Ready pressed Off, and October's end and
    // statement tell nothing.
    for (const n of asked.universe.notifications) n.read = true;
    form(asked);
    press('bank.set_alerts', 'Statement Ready: On');
    expect(alertsOf(asked.player).statements).toBe(false);
    asked.advanceTo(at(2026, 10, 21, 9));
    expect(told(asked, /^Statement Ready/)).toHaveLength(2);
    expect(told(asked, /^Statement Ready/).every((n) => n.read)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bank.set_payments
// ---------------------------------------------------------------------------

describe('bank.set_payments', () => {
  /**
   * The r3b route on a New Haven life: Chase Savings as a new life has it, a current account opened at Citi, a Citi loan
   * paid into Citi and repaid from the Chase current account, Citi made primary, and the Chase current account emptied
   * into Chase Savings with Move Money, the wages sent to Citi; the link pressed On on How You Pay where asked.
   */
  function citiLoanRepaidFromChase(seed: string, link: boolean) {
    const sim = student(seed, 'us-chase');
    const chase = primary(sim).id;
    const chaseSavings = savingsAt(sim, 'us-chase').id;
    const citi = ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId;
    wages(sim, chase, 5_000_00); // TEST SETUP
    const { loanId, payment } = ok<{ loanId: string; payment: number }>(sim, 'bank.borrow', { amount: 3_000_00, months: 12, bankId: 'us-citi', intoId: citi, repayFromId: chase });
    ok(sim, 'bank.set_primary', { accountId: citi });
    // The work-study wages sent to Citi too, from Yale payroll's next cycle, a week on; until then they'd go into Chase.
    ok(sim, 'bank.redirect_deposits', { accountId: citi });
    ok(sim, 'bank.transfer', { fromId: chase, toId: chaseSavings, amount: account(sim, chase).balance });
    expect(account(sim, chase).balance).toBe(0);
    if (link) {
      shown(sim, createElement(BankPayments));
      press('bank.set_payments', 'Savings Covers The Current Account: Off');
      expect(paymentsOf(sim.player).linkSavings).toBe(true);
    }
    const due = sim.universe.scheduled.find((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending' && i.refId === loanId)!.at;
    return { sim: reload(sim), chase, chaseSavings, citi, loanId, payment, due };
  }

  it('takes a Citi loan’s monthly payment from Chase Savings when it falls due, with the link pressed On, and misses it onto the record with the link Off', () => {
    const linked = citiLoanRepaidFromChase('g11-pay-3', true);
    const unlinked = citiLoanRepaidFromChase('g11-pay-3', false);
    expect(linked.payment).toBe(264_09);
    for (const r of [linked, unlinked]) {
      expect(r.due).toBe(at(2026, 9, 24, 7, 30));
      expect(paymentsOf(r.sim.player).linkSavings).toBe(r === linked);
    }
    const lates = (r: typeof linked) => r.sim.player.credit!.late.length;
    const [lateOn, lateOff] = [lates(linked), lates(unlinked)];
    // A minute before it falls due, the Chase current account still holds nothing: the wages went to Citi.
    for (const r of [linked, unlinked]) r.sim.advanceTo(r.due - 60_000);
    for (const r of [linked, unlinked]) expect(account(r.sim, r.chase).balance).toBe(0);
    const savedOn = account(linked.sim, linked.chaseSavings).balance;
    for (const r of [linked, unlinked]) r.sim.advanceTo(r.due + MS_HOUR);

    // A month's interest, 3,000 × 0.1024 / 12 = $25.60, then the payment.
    for (const r of [linked, unlinked]) expect(posted(r.sim, 'Interest: Citi Personal Loan').map((t) => on(t, r.loanId))).toEqual([-25_60]);
    const payments = posted(linked.sim, 'Payment: Citi Personal Loan');
    expect(payments).toHaveLength(1);
    expect(on(payments[0]!, linked.loanId)).toBe(264_09);
    expect(on(payments[0]!, linked.chaseSavings)).toBe(-264_09);
    expect(on(payments[0]!, linked.chase)).toBe(0);
    expect(savedOn - account(linked.sim, linked.chaseSavings).balance).toBe(264_09);
    expect(account(linked.sim, linked.loanId).balance).toBe(-(3_000_00 + 25_60 - 264_09));
    expect(lates(linked)).toBe(lateOn);
    expect(told(linked.sim, 'A Missed Loan Payment')).toEqual([]);

    // Off: Chase Savings isn't drawn on, the payment is missed and goes on the record. No US bank here lists a fee for
    // a payment returned unpaid, and none is charged.
    expect(posted(unlinked.sim, 'Payment: Citi Personal Loan')).toEqual([]);
    expect(account(unlinked.sim, unlinked.loanId).balance).toBe(-(3_000_00 + 25_60));
    expect(lates(unlinked)).toBe(lateOff + 1);
    expect(told(unlinked.sim, 'A Missed Loan Payment').map((n) => n.body)).toEqual(['$264.09 was due and $0.00 was there to pay it. It’s on your record, and what’s left is still owed.']);
    expect(posted(unlinked.sim, 'Returned payment fee')).toEqual([]);
  });

  it('puts the night’s groceries where The Day’s Spending, changed on How You Pay, says: on the credit card, then in cash, then on the debit card', () => {
    const sim = student('g11-everyday', 'us-chase');
    const checking = primary(sim).id;
    const card = cardAt(sim, 'us-chase').id;
    const groceriesAt = (day: number) => posted(sim, 'Groceries').filter((t) => t.at === at(2026, 8, day));
    expect(paymentsOf(sim.player).everyday).toBe('debit');
    shown(sim, createElement(BankPayments));
    pick('pay-everyday', 'credit');
    expect(paymentsOf(sim.player).everyday).toBe('credit');
    expect(shown(sim, createElement(BankPayments))).toContain('<option value="credit" selected="">On The Credit Card</option>');
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    expect(groceriesAt(25).map((t) => [on(t, card), on(t, checking)])).toEqual([[-10_00, 0]]);

    // Cash from the bank's own ATM, then In Cash, Then The Debit Card.
    ok(sim, 'cash.withdraw', { amount: 40_00, from: 'atm' });
    const wallet = walletOf(sim)!.id;
    shown(sim, createElement(BankPayments));
    pick('pay-everyday', 'cash');
    sim.advanceTo(at(2026, 8, 26, 0, 1));
    expect(groceriesAt(26).map((t) => [on(t, wallet), on(t, card), on(t, checking)])).toEqual([[-10_00, 0, 0]]);

    shown(sim, createElement(BankPayments));
    pick('pay-everyday', 'debit');
    sim.advanceTo(at(2026, 8, 27, 0, 1));
    expect(groceriesAt(27).map((t) => [on(t, checking), on(t, card), on(t, wallet)])).toEqual([[-10_00, 0, 0]]);
  });

  it('is refused On once Chase Savings is closed through Close Savings, in the bank’s words, isn’t drawn on How You Pay, and goes On once savings is opened there again', () => {
    const sim = student('g11-nolink', 'us-chase');
    ok(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase').id });
    expect(refusal(sim, 'bank.set_payments', { linkSavings: true })).toBe('There’s no savings account at Chase to cover the current account.');
    expect(paymentsOf(sim.player).linkSavings).toBe(false);
    expect(words(shown(sim, createElement(BankPayments)))).not.toContain('Savings Covers The Current Account');
    ok(sim, 'bank.open_savings', { bankId: 'us-chase' });
    shown(sim, createElement(BankPayments));
    press('bank.set_payments', 'Savings Covers The Current Account: Off');
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bank.set_round_ups
// ---------------------------------------------------------------------------

/** Each round-up transfer: when, how much, from where to where. */
const moves = (sim: Simulation) => posted(sim, 'Round-ups').map((t) => ({ at: t.at, amount: t.postings.find((p) => p.amount > 0)!.amount, from: t.postings.find((p) => p.amount < 0)!.accountId, to: t.postings.find((p) => p.amount > 0)!.accountId }));
const meal = (sim: Simulation, since: number) => posted(sim, 'A meal').filter((t) => t.at >= since).map((t) => -on(t, primary(sim).id));

describe('bank.set_round_ups', () => {
  it('is pressed On and Off on the Bank of America panel: a frugal student’s $4.29 meal moves $0.71 into Advantage Savings at Monday’s end, across a reload, and nothing once it’s Off', () => {
    let sim = student('g11-ru-boa', 'us-bank-of-america', { personalityTraits: ['frugal'] });
    const panel = () => words(shown(sim, createElement(BankAccountLife, { bankId: 'us-bank-of-america' })));
    const checking = primary(sim).id;
    const savings = savingsAt(sim, 'us-bank-of-america').id;
    expect(panel()).toContain('Round-Ups: Off');
    press('bank.set_round_ups', 'Round-Ups: Off');
    expect(sim.player.roundUps).toMatchObject({ on: true, pending: 0, bankId: 'us-bank-of-america' });
    sim = reload(sim);
    expect(panel()).toContain('Round-Ups: On');

    const start = sim.now;
    ok(sim, 'life.look_after', { action: 'eat' });
    // A $5.00 meal at a frugal student's price, $4.29; to the next whole dollar, $0.71.
    expect(meal(sim, start)).toEqual([4_29]);
    expect(sim.player.roundUps!.pending).toBe(71);
    expect(panel()).toContain('Counted, not yet moved: $0.71.');
    const saved = account(sim, savings).balance;
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    expect(moves(sim)).toEqual([{ at: at(2026, 8, 25), amount: 71, from: checking, to: savings }]);
    expect(account(sim, savings).balance - saved).toBe(71);
    expect(panel()).toContain('Last moved: $0.71 into savings, August 25, 2026.');

    // Off: what Tuesday's first moment counted ($8.59 of groceries, $0.41) is dropped, and nothing counts after.
    press('bank.set_round_ups', 'Round-Ups: On');
    expect(sim.player.roundUps).toMatchObject({ on: false, pending: 0, last: { notMoved: 41, why: 'round-ups were turned off' } });
    expect(panel()).toContain('Round-Ups: Off');
    sim.advanceTo(at(2026, 8, 25, 12));
    const later = sim.now;
    ok(sim, 'life.look_after', { action: 'eat' });
    expect(meal(sim, later)).toEqual([4_29]);
    expect(sim.player.roundUps!.pending).toBe(0);
    sim.advanceTo(at(2026, 8, 27, 0, 1));
    expect(moves(sim)).toHaveLength(1);
  });

  it('moves nothing at Bank of America on a day the checking account ends short of what was counted, and drops it rather than move it later', () => {
    const sim = student('g11-ru-short', 'us-bank-of-america', { personalityTraits: ['frugal'] });
    const checking = primary(sim).id;
    ok(sim, 'bank.set_round_ups', { on: true });
    ok(sim, 'life.look_after', { action: 'eat' });
    expect(sim.player.roundUps!.pending).toBe(71);
    sim.advanceTo(at(2026, 8, 24, 23));
    setTo(sim, checking, 50); // TEST SETUP: $0.50 left at the day's end, under the $0.71 counted
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    expect(moves(sim)).toEqual([]);
    expect(sim.player.roundUps!.last).toEqual({ at: at(2026, 8, 25), notMoved: 71, why: 'the account couldn’t cover it' });
    // Dropped, not carried: what waits is only what the new day counted. Tuesday's groceries at its first moment, $8.59,
    // took the $0.50 left by debit card and put the rest on the credit card; the debit card's $0.50 rounds up $0.50.
    expect(sim.player.roundUps!.pending).toBe(50);
    expect(account(sim, checking).balance).toBe(0);
    setTo(sim, checking, 1_000_00); // TEST SETUP: money back in
    // Tuesday's end moves Tuesday's $0.50, and the $0.71 dropped on Monday's never.
    sim.advanceTo(at(2026, 8, 26, 0, 1));
    expect(moves(sim).map((m) => [m.at, m.amount])).toEqual([[at(2026, 8, 26), 50]]);
  });

  it('moves Wells Fargo’s flat $1 for each of two meals into Way2Save Savings at the next business day’s start, once across a reload, and says what SLATE leaves out of its words', () => {
    let sim = student('g11-ru-wf', 'us-wells-fargo');
    const savings = savingsAt(sim, 'us-wells-fargo');
    expect(savings.name).toBe('Way2Save Savings');
    ok(sim, 'bank.set_round_ups', { on: true });
    const start = sim.now;
    ok(sim, 'life.look_after', { action: 'eat' });
    sim.advanceTo(at(2026, 8, 24, 13, 30));
    ok(sim, 'life.look_after', { action: 'eat' });
    // Two $5.00 meals: whole dollars, which a round-up wouldn't move; Wells Fargo's is $1 a purchase whatever it is.
    expect(meal(sim, start)).toEqual([5_00, 5_00]);
    expect(sim.player.roundUps!.pending).toBe(2_00);
    sim = reload(sim);
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    expect(moves(sim)).toEqual([{ at: at(2026, 8, 25), amount: 2_00, from: primary(sim).id, to: savings.id }]);
    const text = words(shown(sim, createElement(BankAccountLife, { bankId: 'us-wells-fargo' })));
    expect(text).toContain('Last moved: $2.00 into savings, August 25, 2026.');
    expect(text).toContain('Not in SLATE: Online Bill Pay payments count at Wells Fargo too; bills in the game aren’t paid through Bill Pay.');
    expect(text).toContain('A day Overdraft Protection was used, Wells Fargo makes no transfer: the game doesn’t look for it, and moves it if the account covers it.');
    // Tuesday's groceries, bought at its first moment, are Tuesday's: $1 moved at Wednesday's start, and Monday's not again.
    sim.advanceTo(at(2026, 8, 26, 0, 1));
    expect(moves(sim).map((m) => [m.at, m.amount])).toEqual([[at(2026, 8, 25), 2_00], [at(2026, 8, 26), 1_00]]);
  });
});

// ---------------------------------------------------------------------------
// bank.take_term_interest
// ---------------------------------------------------------------------------

describe('bank.take_term_interest', () => {
  it('takes a Chase CD’s $174.52 from the panel 30 days before its end: refused with nothing earned, the penalty falling from $172.60 to nothing, and the renewal reinvesting only what the 30 days after earned', () => {
    let sim = student('g11-cd', 'us-chase');
    const checking = primary(sim).id;
    const { accountId, maturesAt } = ok<{ accountId: string; maturesAt: number }>(sim, 'bank.open_term', { amount: 10_000_00 });
    // Chase's 7-month CD at 3.5%.
    expect(maturesAt).toBe(at(2027, 3, 24, 7, 30));
    expect(account(sim, accountId).fixedRate).toBe(0.035);
    const panel = () => words(shown(sim, createElement(BankAccountLife, { bankId: 'us-chase' })));
    const take = () => h.clicks.find((c) => c.feature === 'bank.take_term_interest')!;
    expect(refusal(sim, 'bank.take_term_interest', { accountId })).toBe('It hasn’t earned anything to take yet.');
    panel();
    expect(take()).toMatchObject({ says: 'Take The Interest So Far ($0.00)', disabled: true });

    sim.advanceTo(maturesAt - 30 * MS_DAY);
    sim = reload(sim);
    // 182 day-ends at 3.5% on $10,000: 182 × 10,000 × 0.035 / 365 = $174.5205. Broken now, Chase asks 180 days'
    // interest on a term of 6 to 24 months, 10,000 × 0.035 × 180 / 365 = $172.60, capped at what's earned.
    expect(panel()).toContain('Broken now it costs $172.60.');
    const before = account(sim, checking).balance;
    const year = yearOf(sim.player, 2027).interest ?? 0;
    press('bank.take_term_interest', 'Take The Interest So Far ($174.52)');
    expect(account(sim, checking).balance - before).toBe(174_52);
    const taken = posted(sim, 'Interest: CD');
    expect(taken).toHaveLength(1);
    expect(on(taken[0]!, checking)).toBe(174_52);
    // The US takes no tax off interest at the bank: nothing withheld.
    expect(taken[0]!.postings.filter((p) => p.amount > 0)).toHaveLength(1);
    expect(yearOf(sim.player, 2027).interest).toBe(year + 174_52);
    expect(account(sim, accountId).accrued).toBeLessThan(1);
    expect(panel()).toContain('Broken now it comes out whole.');
    expect(take()).toMatchObject({ says: 'Take The Interest So Far ($0.00)', disabled: true });

    // The renewal, at the midnight that opens 24 March, reinvests what was left, 0.0548¢, and what the 30 day-ends
    // after earned (22 February's to 23 March's): 30 × 10,000 × 0.035 / 365 = $28.7671, $28.7676 with what was left,
    // $28.76; not the term's 212 day-ends, $203.28, which a renewal that worked the interest out again from the rate
    // and the days would pay. Until 2026-10-13 this was $29.72: the deposit ended at the midnight after its maturity
    // day and earned that day too, 213 day-ends for a 212-day term, which this test held as the engine had it.
    sim.advanceTo(maturesAt + MS_DAY);
    const reinvested = posted(sim, 'Interest: CD, reinvested');
    expect(reinvested.map((t) => on(t, accountId))).toEqual([28_76]);
    expect(reinvested[0]!.at).toBe(at(2027, 3, 24, 0));
    expect(account(sim, accountId).balance).toBe(10_028_76);
  });

  it('takes AIB’s term interest less Ireland’s 33% DIRT: a quick-save life in Dublin, since a New Haven bank takes no tax off interest', () => {
    const sim = dubliner('g11-dirt');
    const checking = primary(sim).id;
    const { accountId } = ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00 });
    expect(account(sim, accountId).fixedRate).toBe(0.02);
    sim.advanceTo(sim.now + 100 * MS_DAY);
    // 100 day-ends at 2% on €10,000: €54.79; DIRT at 33%, €18.08; €36.71 paid.
    const before = account(sim, checking).balance;
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId }).paid).toBe(36_71);
    expect(account(sim, checking).balance - before).toBe(36_71);
    const taken = posted(sim, 'Interest: Fixed Term Deposit');
    expect(taken).toHaveLength(1);
    expect(on(taken[0]!, sim.nominalAccount('income', 'Interest').id)).toBe(-54_79);
    expect(on(taken[0]!, sim.nominalAccount('expense', 'Tax On Interest').id)).toBe(18_08);
  });
});

// ---------------------------------------------------------------------------
// card.close
// ---------------------------------------------------------------------------

describe('card.close', () => {
  it('leaves Citi’s $2,500 of $5,000 alone in what’s used once Chase’s card is closed from the panel, owing nothing: Citi’s due date moves the record a point down, where beside Chase’s it moves 1.5 up', () => {
    const lives = [student('g11-util', 'us-chase'), student('g11-util', 'us-chase')] as const;
    for (const sim of lives) ok(sim, 'card.apply', { bankId: 'us-citi' });
    for (const sim of lives) sim.advanceTo(at(2026, 9, 1, 9));
    const [closing, keeping] = lives;
    const citi = cardAt(closing, 'us-citi').id;
    const chase = cardAt(closing, 'us-chase').id;
    for (const sim of lives) {
      expect(account(sim, citi).creditLimit).toBe(5_000_00);
      expect(account(sim, chase).creditLimit).toBe(65_217_00);
      ok(sim, 'finance.set_autopay', { mode: 'minimum', accountId: citi });
      owe(sim, citi, 2_500_00); // TEST SETUP: half of Citi's limit on it
    }
    shown(closing, createElement(BankCard, { bankId: 'us-chase' }));
    // The everyday card's panel is drawn first: Chase's. Owing nothing, it closes at once, and the everyday place passes.
    press('card.close', 'Close The Card');
    expect(account(closing, chase).closedAt).toBe(closing.now);
    expect(account(closing, citi).closedAt).toBeUndefined();
    expect(cardOf(closing, closing.player)!.id).toBe(citi);
    expect(cardsOf(closing, closing.player).map((c) => c.id)).toEqual([citi]);
    expect(cardsOf(keeping, keeping.player).map((c) => c.id)).toEqual([chase, citi]);

    // Citi's statement on 20 September asks $2,500; its due date reports the month, paid on time by autopay's minimum.
    for (const sim of lives) sim.advanceTo(at(2026, 9, 20, 9, 1));
    for (const sim of lives) expect(stateOf(sim.player, account(sim, citi)).statementBalance).toBe(2_500_00);
    const due = closing.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === citi)!.at;
    expect(keeping.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === citi)!.at).toBe(due);
    for (const sim of lives) sim.advanceTo(due - 60_000);
    const before = lives.map((sim) => sim.player.credit!.score);
    for (const sim of lives) sim.advanceTo(due + 60_000);
    // What's owed after the minimum, a little under $2,500: of Citi's $5,000 alone it's over 49% used, 19 points past
    // the 30% the record allows, at 20 for each 100 past it, 3.8, which rounds to 4: 3 on time less 4. Beside Chase's
    // $65,217 it's under 4% of $70,217: 3 on time, shared between the two cards, 1.5.
    const owed = -account(closing, citi).balance;
    expect(owed).toBeGreaterThan(2_450_00);
    expect(owed).toBeLessThan(2_500_00);
    expect(closing.player.credit!.score - before[0]!).toBe(-1);
    expect(keeping.player.credit!.score - before[1]!).toBe(1.5);
  });

  it('takes nothing new on a closing Chase card that owes $400: a second close refused, the night’s groceries kept off it, paid in full from the panel, and closed at its statement, across a reload', () => {
    let sim = student('g11-closing', 'us-chase');
    const card = cardAt(sim, 'us-chase').id;
    const checking = primary(sim).id;
    owe(sim, card, 400_00); // TEST SETUP: $400 of purchases on it
    ok(sim, 'bank.set_payments', { everyday: 'credit' });
    const panel = () => words(shown(sim, createElement(BankCard, { bankId: 'us-chase' })));
    panel();
    press('card.close', 'Close The Card');
    expect(account(sim, card).closedAt).toBeUndefined();
    expect(stateOf(sim.player, account(sim, card)).closing).toBe(sim.now);
    expect(cardRoom(sim.player, account(sim, card))).toBe(0);
    const text = panel();
    expect(text).toContain('Closed to anything new. What’s owed is paid down as before, and then the account closes.');
    expect(text).toContain('Left To Spend $0 Of a $65,217 limit');
    expect(h.clicks.filter((c) => c.feature === 'card.close')).toEqual([]);
    expect(refusal(sim, 'card.close', { accountId: card })).toBe('It’s already being closed.');

    sim = reload(sim);
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    // The Day's Spending is on the card, and the card takes nothing new: the groceries come from the checking account.
    const groceries = posted(sim, 'Groceries').filter((t) => t.at === at(2026, 8, 25));
    expect(groceries.map((t) => [on(t, checking), on(t, card)])).toEqual([[-10_00, 0]]);
    expect(account(sim, card).balance).toBe(-400_00);

    const before = account(sim, checking).balance;
    panel();
    press('finance.pay_card', 'Pay Card In Full ($400)');
    expect(account(sim, card).balance).toBe(0);
    expect(before - account(sim, checking).balance).toBe(400_00);
    // Closed at its statement, not before.
    expect(account(sim, card).closedAt).toBeUndefined();
    const statement = sim.universe.scheduled.find((i) => i.kind === STATEMENT_KIND && i.status === 'pending' && i.payload.accountId === card)!.at;
    expect(statement).toBe(at(2026, 9, 20, 9));
    sim.advanceTo(statement + 60_000);
    expect(account(sim, card).closedAt).toBe(statement);
    expect(told(sim, 'Card Closed').map((n) => n.body)).toEqual(['The Chase Freedom Unlimited is paid off and closed.']);
    expect(cardsOf(sim, sim.player)).toEqual([]);
    expect(panel()).not.toContain('Chase Freedom Unlimited');
  });

  it('charges no yearly fee on a closing card: AIB’s €30 on December’s statement, the month it was opened, to the card left open and not to the one closing (a quick-save life in Dublin, since no New Haven card has a yearly fee)', () => {
    const lives = [dubliner('g11-fee'), dubliner('g11-fee')] as const;
    const card = cardsOf(lives[0], lives[0].player)[0]!.id;
    for (const sim of lives) {
      expect(account(sim, card).name).toBe('AIB Click Visa Card');
      expect(new Date(account(sim, card).openedAt).getUTCMonth()).toBe(11);
      owe(sim, card, 1_000_00); // TEST SETUP: €1,000 of purchases on it
      ok(sim, 'finance.set_autopay', { mode: 'minimum' });
    }
    const [closing, keeping] = lives;
    ok(closing, 'card.close', { accountId: card });
    expect(account(closing, card).closedAt).toBeUndefined();
    for (const sim of lives) sim.advanceTo(instantFromZoned({ year: 2026, month: 12, day: 21, hour: 9 }, 'Europe/Dublin'));
    const fees = (sim: Simulation) => posted(sim, 'Yearly fee: AIB Click Visa Card').map((t) => ({ month: new Date(t.at).getUTCMonth(), amount: on(t, card) }));
    expect(fees(keeping)).toEqual([{ month: 11, amount: -30_00 }]);
    expect(fees(closing)).toEqual([]);
    // Still owing, still closing, and still open until it's paid.
    expect(account(closing, card).balance).toBeLessThan(0);
    expect(account(closing, card).closedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// card.lock
// ---------------------------------------------------------------------------

describe('card.lock', () => {
  it('spares both Chase cards locked from Your Cards when the US rate is set to certain, and a stranger’s use comes the night after they’re unlocked', () => {
    const sim = student('g11-a', 'us-chase');
    const panel = () => words(shown(sim, createElement(BankSecurity, { bankId: 'us-chase' })));
    panel();
    // The debit card's first, then the credit card's.
    press('card.lock', 'Lock It');
    panel();
    press('card.lock', 'Lock It');
    const text = panel();
    expect(h.clicks.filter((c) => c.feature === 'card.lock').map((c) => c.says)).toEqual(['Unlock It', 'Unlock It']);
    expect(text.split('Locked: nothing new goes on it.')).toHaveLength(3);
    expect(primary(sim).plastic!.locked).toBe(true);
    expect(cardAt(sim, 'us-chase').plastic!.locked).toBe(true);

    withLaw('US', { fraudRate: 1, preventedShare: 0 }); // TEST SETUP: a use drawn every night
    sim.advanceTo(at(2026, 8, 25, 0, 1));
    expect(sim.player.fraud ?? []).toEqual([]);
    expect(told(sim, 'Your Bank Stopped A Payment')).toEqual([]);
    panel();
    press('card.lock', 'Unlock It');
    panel();
    press('card.lock', 'Unlock It');
    sim.advanceTo(at(2026, 8, 26, 0, 1));
    withLaw('US', { fraudRate: 0 });
    expect(sim.player.fraud).toHaveLength(1);
    expect(sim.player.fraud![0]!.at).toBe(at(2026, 8, 26));
  });

  it('pays a meal by debit card while the credit card is locked and The Day’s Spending is on it, on the card once unlocked, and refuses it when the bank is empty', () => {
    const sim = student('g11-lock-meal', 'us-chase');
    const checking = primary(sim).id;
    const card = cardAt(sim, 'us-chase').id;
    ok(sim, 'bank.set_payments', { everyday: 'credit' });
    ok(sim, 'card.lock', { which: 'credit', locked: true });
    const meals = () => posted(sim, 'A meal').map((t) => [on(t, checking), on(t, card)]);
    ok(sim, 'life.look_after', { action: 'eat' });
    expect(meals()).toEqual([[-5_00, 0]]);
    sim.advanceTo(at(2026, 8, 24, 13, 30));
    ok(sim, 'card.lock', { which: 'credit', locked: false });
    ok(sim, 'life.look_after', { action: 'eat' });
    expect(meals()).toEqual([[-5_00, 0], [0, -5_00]]);
    sim.advanceTo(at(2026, 8, 24, 19, 30));
    ok(sim, 'card.lock', { which: 'credit', locked: true });
    setTo(sim, checking, 0); // TEST SETUP: the checking account emptied
    expect(refusal(sim, 'life.look_after', { action: 'eat' })).toBe('You can’t afford it.');
    expect(meals()).toHaveLength(2);
    expect(account(sim, card).balance).toBe(-5_00);
    // Unlocked, the same meal goes on the card.
    ok(sim, 'card.lock', { which: 'credit', locked: false });
    ok(sim, 'life.look_after', { action: 'eat' });
    expect(meals()).toEqual([[-5_00, 0], [0, -5_00], [0, -5_00]]);
  });

  it('keeps both locks across a save and reload: no room on the credit card, the ATM refused and the counter paying, until they’re unlocked', () => {
    let sim = student('g11-lock-save', 'us-chase');
    ok(sim, 'card.lock', { which: 'debit', locked: true });
    ok(sim, 'card.lock', { which: 'credit', locked: true });
    sim = reload(sim);
    const card = cardAt(sim, 'us-chase');
    expect(primary(sim).plastic!.locked).toBe(true);
    expect(card.plastic!.locked).toBe(true);
    expect(cardRoom(sim.player, card)).toBe(0);
    expect(refusal(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' })).toBe('Your debit card is locked.');
    ok(sim, 'cash.withdraw', { amount: 20_00, from: 'counter' });
    expect(walletOf(sim)!.balance).toBe(20_00);
    ok(sim, 'card.lock', { which: 'debit', locked: false });
    ok(sim, 'card.lock', { which: 'credit', locked: false });
    expect(cardRoom(sim.player, card)).toBe(65_217_00);
    ok(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' });
    expect(walletOf(sim)!.balance).toBe(40_00);
  });

  it('refuses to lock a debit card reported lost, in its words, draws no lock for it, and locks the new one once it comes', () => {
    const sim = student('g11-lock-lost', 'us-chase');
    const { arrivesAt } = ok<{ arrivesAt: number }>(sim, 'card.report', { which: 'debit', why: 'lost' });
    expect(refusal(sim, 'card.lock', { which: 'debit', locked: true })).toBe('That card is stopped; a new one is on its way.');
    const text = words(shown(sim, createElement(BankSecurity, { bankId: 'us-chase' })));
    expect(text).toContain('Lost: stopped. A new one arrives');
    // Only the credit card's lock is drawn.
    expect(h.clicks.filter((c) => c.feature === 'card.lock').map((c) => c.says)).toEqual(['Lock It']);
    sim.advanceTo(arrivesAt + MS_HOUR);
    expect(primary(sim).plastic!.stopped).toBeUndefined();
    expect(ok<{ locked: boolean }>(sim, 'card.lock', { which: 'debit', locked: true }).locked).toBe(true);
    expect(refusal(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' })).toBe('Your debit card is locked.');
  });
});



