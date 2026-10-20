/**
 * Evidence for seven money rows the review of 2026-10-13 left partial (verification group g10-money): borrowing, a term
 * deposit opened and broken, unclaimed money claimed back, the debit card overdraft opt-in, a debt in collections paid,
 * and a dormant account reactivated. Each row's gaps are closed here through the command its screen sends and the clock,
 * and each consequence is read where the row says it's read, against figures worked out from the bank's own published
 * numbers, never from the helper the engine computes them with.
 *
 * - `bank.borrow`: refused for want of wages alone before the first payday ("none has been paid in this month"), and the
 *   same ask lent once the clock has paid a week's work-study; Citi's published 10.24%–18.49% priced by the record at
 *   SLATE's 780/580 line, worked here as a share of the range; past 35% of the month's wages refused with both figures;
 *   the proceeds paid into the Citi account exactly; the clock's first payment, $42.74 with $17.07 of interest, taken
 *   once across a reload; a second Citi loan refused. The quote, its refusal and Borrow It drawn and pressed.
 * - `bank.break_term`: a Citi CD broken beside a Chase primary pays into the Citi account, less Citi's 90 days'
 *   interest from the deposit (the review's defect, fixed the same day); with the Citi account closed, it goes to the
 *   primary in Citi's days; NatWest's notice closes on the clock and pays the deposit back whole, as its terms say.
 * - `bank.claim_unclaimed`: a Connecticut life's savings, untouched three years by the clock, go to "the state’s
 *   unclaimed-property office" in every word it's told (the review's defect, fixed the same day); held across a reload;
 *   Claim It Back drawn and pressed, the money back exactly once.
 * - `bank.debit_overdraft`: Chase's opt-in pressed, the clock's groceries paid into the overdraft, its $34 fee held and
 *   charged after the next business day; opted out, not bought and no fee; Wells Fargo's $10 groceries free of a fee by
 *   its small-item rule; Citi's, Capital One's and Bank of America's refusals in their words.
 * - `bank.open_term`: refused past what the account holds, and at a bank with no current account; a Citi CD put away
 *   from the Citi account on its own panel, Chase untouched, accruing at Citi's 4.25%; and MUFG's overdraft against
 *   time deposits, the one bank that lends against them, which a New Haven life can't reach.
 * - `bank.pay_collections`: an account overdrawn sixty days closed by the clock, its debt Chase's own; paid down from
 *   the panel and paid off, with card.apply, troubles and the open and switch refusals read before and after; two banks'
 *   charge-offs kept apart; a card's charge-off described as a card's; and the no-card report that climbs once it's paid.
 * - `bank.reactivate`: a Capital One checking and savings left idle while Citi was primary, dormant at 24 months by the
 *   clock, interest stopped, Move Money, cash and the ATM refused; Reactivate pressed; the interest back, reactivatedAt
 *   kept across a reload, and every refusal lifted.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, Connecticut, starting Monday 24 August 2026 at 7:30 AM, at the bank creation gives her (Chase) or the one named
 * (Citi, Wells Fargo, Capital One, Bank of America), with the family's money behind her: $92,391 in checking, $413,043
 * in savings and a 795 record. Played by the clock, with Yale's work-study paying $138 for six hours each Friday from
 * 11 September. Two lives are elsewhere, and say so where they're made: NatWest's 35 days' notice is a London life's
 * (`quickSave`), and MUFG's loan against time deposits a Tokyo life's; no New Haven bank asks notice or lends that way.
 * The screens are drawn as the player has them (react-dom/server), `useGame`'s `run` the save's own `execute`; a button
 * pressed is the component's own onClick, kept on its way through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: a balance set by a posting against a test equity line (an overdraft to start
 * from, savings emptied, money to pay a debt off with); a credit record set at a figure; and on the screens, which a
 * static render can't type into, an amount field's text set through the component's own useState in its render order.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { addMonths, formatDate, instantFromZoned, MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { bankById } from '@/engine/content/banks';
import { collectionsOf, loansOf, LOAN_DUE_KIND, termsOf } from '@/engine/systems/lending';
import { cardsOf } from '@/engine/systems/credit';
import { troubles } from '@/engine/systems/spending';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button the screens draw, with its words, whether it's grayed out, and its own onClick. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepButtons(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepButtons(await orig<Record<string, unknown>>()));

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { BankLending, TermDeposits } = await import('@/ui/bank/BankLending');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** An instant of New Haven's wall clock, by the calendar. */
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);

const student = (seed: string, bankId?: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...(bankId ? { bankId } : {}) });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const savingsOf = (sim: Simulation): Account => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings' && a.category !== 'term' && !a.closedAt)!;
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What a transaction by this memo posted to an account. */
const posted = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).flatMap((t) => t.postings.filter((p) => p.accountId === account.id).map((p) => ({ at: t.at, amount: p.amount })));

/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** A command refused, and its words. */
function refused(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string {
  const r = sim.execute({ kind, payload });
  expect(r.ok, `${kind} went through`).toBe(false);
  return r.error!;
}

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/ ([,.:;])/g, '$1');

type Button = { text: string; disabled?: boolean; onClick?: () => void };
/** A screen drawn as the player has it, the states given (TEST SETUP) in its render order, its buttons kept. */
function draw(sim: Simulation, element: ReactElement, states: unknown[] = []): { text: string; buttons: Button[]; button: (label: string) => Button } {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  h.states = [...states];
  const html = renderToStaticMarkup(element);
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const buttons = [...h.buttons];
  return {
    text: onScreen(html), buttons,
    button: (label) => { const b = buttons.find((x) => x.text === label); expect(b, `“${label}” on screen`).toBeDefined(); return b!; },
  };
}
const K = h.keep;
/**
 * TEST SETUP: what the player typed into BankLending's fields, as its own states in its render order (into, repay,
 * toCollections, limit, perUse, deposit, borrow, months); a static render can't type.
 */
const lendingStates =(set: { toCollections?: string; deposit?: string; borrow?: string; months?: string }) => {
  const order = [K, K, set.toCollections ?? K, K, K, set.deposit ?? K, set.borrow ?? K, set.months ?? K];
  let last = order.length;
  while (last > 0 && order[last - 1] === K) last -= 1;
  return order.slice(0, last);
};
const lending = (sim: Simulation, bankId: string, show: ('borrowing' | 'term' | 'switch')[], account?: Account, set: Parameters<typeof lendingStates>[0] = {}) =>
  draw(sim, createElement(BankLending, { bank: bankById(bankId)!, show, ...(account ? { account } : {}) }), lendingStates(set));
const accountLife = (sim: Simulation, bankId: string) => draw(sim, createElement(BankAccountLife, { bankId }));

/** A Chase student who opens a Citi current account and moves $2,000 into it by Move Money, landed Thursday 27 August. */
function withCiti(seed: string): { sim: Simulation; chase: Account; citi: Account } {
  const sim = student(seed);
  const chase = primary(sim);
  expect(chase.bankId).toBe('us-chase');
  const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
  const citi = sim.universe.accounts[accountId]!;
  const sent = sim.must<{ moved: number; arrivesAt: number }>({ kind: 'bank.transfer', payload: { fromId: chase.id, toId: citi.id, amount: 2_000_00 } });
  // Chase sends to another bank in three business days: from Monday morning to Thursday morning.
  expect(sent.arrivesAt).toBe(at(2026, 8, 27, 7, 30));
  sim.advanceTo(at(2026, 8, 27, 12));
  expect(citi.balance).toBe(2_000_00);
  return { sim, chase, citi };
}

// ---------------------------------------------------------------------------
// bank.borrow
// ---------------------------------------------------------------------------

describe('bank.borrow', () => {
  // Citi's published personal loan: 10.24% to 18.49% APR, $2,000 to $50,000 (citi.com, research-tax-switch-lending.json).
  // SLATE's estimate puts the bottom of a range at a record of 780 and the top at 580, in a straight line.
  const CITI_FROM = 0.1024;
  const CITI_TO = 0.1849;
  const ASK = { amount: 2_000_00, months: 60, bankId: 'us-citi' };
  // $2,000 over 60 months at 10.24%: r = 0.1024/12, P·r/(1 − (1 + r)^−60) = $42.7307, a cent rounded up.
  const PAYMENT = 42_74;

  it('is refused for want of wages before the first payday, on the screen and by the command, and lends the same ask once the clock has paid a week’s work-study', () => {
    const before = student('g10-borrow', 'us-citi');
    const checking = primary(before);
    expect(checking.bankId).toBe('us-citi');
    expect(before.player.credit!.score).toBe(795);
    const start = checking.balance;
    const shown = lending(before, 'us-citi', ['borrowing'], checking, { borrow: '2000', months: '60' });
    expect(shown.text).toContain('10.24% to 18.49% a year, set by your credit record.');
    expect(shown.text).toContain('The bank lends against wages paid in over the last 30 days, and none has been paid in.');
    expect(shown.button('Borrow It').disabled).toBe(true);
    expect(refused(before, 'bank.borrow', ASK)).toBe('The bank lends against wages paid in over the last 30 days, and none has been paid in.');
    expect(loansOf(before, before.player)).toEqual([]);
    expect(checking.balance).toBe(start);

    // The twin, played to the Saturday after the first payday: the clock has paid six hours of work-study.
    const after = student('g10-borrow', 'us-citi');
    after.advanceTo(at(2026, 9, 12));
    const wages = after.universe.transactions.filter((t) => t.category === 'salary');
    expect(wages.map((t) => ({ memo: t.memo, amount: t.postings.find((p) => p.accountId === primary(after).id)!.amount }))).toEqual([
      { memo: 'Work-study wages, 6 hours: David Geffen School of Drama at Yale University', amount: 138_00 },
    ]);
    const c = primary(after);
    const b0 = c.balance;
    const quoted = lending(after, 'us-citi', ['borrowing'], c, { borrow: '2000', months: '60' });
    // A record of 795 is past the 780 that earns the bottom of the range.
    expect(quoted.text).toContain('10.24% a year: $43 a month for 60 months.');
    const borrow = quoted.button('Borrow It');
    expect(borrow.disabled).toBe(false);
    borrow.onClick!();
    expect(h.toasts).toEqual([`Your $2,000 loan is in ${c.name}.`]);
    const [loan] = loansOf(after, after.player);
    expect(loan).toMatchObject({ name: 'Citi Personal Loan', bankId: 'us-citi', balance: -2_000_00, apr: CITI_FROM, loanPayment: PAYMENT, loanMonths: 60, repayFromId: c.id });
    expect(c.balance - b0).toBe(2_000_00);
    expect(posted(after, c, 'Borrowed from Citi')).toEqual([{ at: at(2026, 9, 12), amount: 2_000_00 }]);
    // And the panel says what's owed and when the clock takes the next payment.
    expect(lending(after, 'us-citi', ['borrowing'], c).text).toContain('$2,000 owed at 10.24% a year, $43 a month over the 60 months it was taken for, next on October 12, 2026, from Citi Access Checking at Citi.');
  });

  it('takes the clock’s first payment, $42.74, from the Citi account with a month’s interest, $17.07, once across a reload, and holds a second Citi loan off', () => {
    const sim = student('g10-borrow-due', 'us-citi');
    sim.advanceTo(at(2026, 9, 12));
    const c = primary(sim);
    const { loanId } = sim.must<{ loanId: string }>({ kind: 'bank.borrow', payload: ASK });
    expect(sim.universe.scheduled.filter((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2026, 10, 12)]);
    expect(refused(sim, 'bank.borrow', { ...ASK, amount: 3_000_00 })).toBe('You already have a loan with Citi.');
    sim.advanceTo(at(2026, 10, 1));
    const again = reload(sim);
    again.advanceTo(at(2026, 10, 12, 13));
    const loan = again.universe.accounts[loanId]!;
    const checking = again.universe.accounts[c.id]!;
    // $2,000 × 10.24% ÷ 12 = $17.0667: a month's interest, to the cent.
    expect(posted(again, loan, 'Interest: Citi Personal Loan')).toEqual([{ at: at(2026, 10, 12), amount: -17_07 }]);
    expect(posted(again, checking, 'Payment: Citi Personal Loan')).toEqual([{ at: at(2026, 10, 12), amount: -PAYMENT }]);
    expect(loan.balance).toBe(-2_000_00 - 17_07 + PAYMENT);
    expect(notices(again, 'A Missed Loan Payment')).toEqual([]);
    expect(again.universe.scheduled.filter((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2026, 11, 12)]);
  });

  it('prices by the record on Citi’s published range, and refuses past 35% of the month’s wages with both figures said', () => {
    const sim = student('g10-borrow-record', 'us-citi');
    sim.advanceTo(at(2026, 9, 12));
    // 35% of the $138 the clock paid is $48.30. Over 12 months the payment is $176.06 (the same annuity), past it.
    expect(refused(sim, 'bank.borrow', { ...ASK, months: 12 })).toBe('A payment of $176 a month is more than the 35% of your wages a loan can take: $48 of the $138 paid in over the last 30 days.');
    expect(refused(sim, 'bank.borrow', { ...ASK, amount: 1_999_99 })).toBe('The bank lends at least $2,000.');
    // TEST SETUP: the record set at a figure, each in turn.
    sim.player.credit!.score = 579;
    expect(refused(sim, 'bank.borrow', ASK)).toBe('Your credit score is below 580, and in the game a bank doesn’t lend below that.');
    // At 580, the top of the range: 18.49% makes the payment $51.33, past the $48.30.
    sim.player.credit!.score = 580;
    expect(refused(sim, 'bank.borrow', ASK)).toBe('A payment of $51 a month is more than the 35% of your wages a loan can take: $48 of the $138 paid in over the last 30 days.');
    // At 700, two fifths of the way down the line from 780 to 580: two fifths up the range, 10.24% + 0.4 × 8.25% =
    // 13.54%, and $46.0609 a month, a cent rounded up.
    sim.player.credit!.score = 700;
    const lent = sim.must<{ apr: number; payment: number }>({ kind: 'bank.borrow', payload: ASK });
    expect(lent.apr).toBeCloseTo(CITI_FROM + (CITI_TO - CITI_FROM) * ((780 - 700) / (780 - 580)), 10);
    expect(lent.payment).toBe(46_07);
    expect(loansOf(sim, sim.player)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// bank.break_term
// ---------------------------------------------------------------------------

describe('bank.break_term', () => {
  it('breaks a Citi CD held beside a Chase primary into the Citi account, less Citi’s 90 days’ interest past what it earned, and Chase sees none of it', () => {
    const { sim, chase, citi } = withCiti('g10-break');
    // The term panel is the primary bank's (BankWorkspace): Citi made primary to put it away there, then Chase again.
    sim.must({ kind: 'bank.set_primary', payload: { accountId: citi.id } });
    const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_term', payload: { amount: 1_000_00, bankId: 'us-citi' } });
    sim.must({ kind: 'bank.set_primary', payload: { accountId: chase.id } });
    const term = sim.universe.accounts[accountId]!;
    sim.advanceTo(at(2026, 9, 6, 12));
    // Ten midnights at 4.25%: $1,000 × 4.25% × 10 ÷ 365 = $1.1644, of which whole cents $1.16.
    expect(Math.floor(term.accrued!)).toBe(1_16);
    const screen = accountLife(sim, 'us-chase');
    // Citi's CDs of a year or less: 90 days' simple interest on the principal, $1,000 × 4.25% × 90 ÷ 365 = $10.479.
    expect(screen.text).toContain('CD, $1,000.00 at 4.25%');
    expect(screen.text).toContain('Breaking it now costs $10.48.');
    expect(screen.text).toContain('The bank’s terms: The penalty is simple interest on the amount you take out: 90 days’ for a CD of 1 year or less');
    const press = screen.button('Break It Early');
    expect(press.disabled).toBe(false);
    const c0 = citi.balance;
    const p0 = chase.balance;
    const txns = sim.universe.transactions.length;
    press.onClick!();
    // The penalty past the $1.16 earned, $9.32, comes out of the deposit: $990.68 into Citi, at once.
    expect(citi.balance - c0).toBe(990_68);
    expect(chase.balance).toBe(p0);
    const broke = sim.universe.transactions.slice(txns);
    expect(broke.map((t) => t.memo)).toEqual(['CD broken early']);
    expect(broke[0]!.postings.some((p) => p.accountId === chase.id)).toBe(false);
    expect(broke[0]!.postings.find((p) => p.accountId === sim.nominalAccount('expense', 'Early Withdrawal Penalty').id)!.amount).toBe(9_32);
    expect(term.closedAt).toBe(sim.now);
    expect(accountLife(sim, 'us-chase').text).not.toContain('Broken now');
    // Once: a reload and a week more pay nothing again.
    const again = reload(sim);
    again.advanceTo(at(2026, 9, 13));
    expect(again.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === term.id) && t.at > sim.now)).toEqual([]);
  });

  it('sends the money to the Chase primary in Citi’s days once no Citi current account is kept: the next business day after a weekend and Labor Day', () => {
    const { sim, chase, citi } = withCiti('g10-break-across');
    sim.must({ kind: 'bank.set_primary', payload: { accountId: citi.id } });
    const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_term', payload: { amount: 2_000_00, bankId: 'us-citi' } });
    sim.must({ kind: 'bank.set_primary', payload: { accountId: chase.id } });
    // Everything at Citi put away, its current account closed by the player.
    sim.must({ kind: 'bank.close_current', payload: { accountId: citi.id } });
    expect(citi.closedAt).toBeDefined();
    sim.advanceTo(at(2026, 9, 6, 12));
    const p0 = chase.balance;
    const done = sim.must<{ paid: number; penalty: number }>({ kind: 'bank.break_term', payload: { accountId } });
    // $2,000 × 4.25% × 90 ÷ 365 = $20.96 penalty; ten days earned $2.32; $18.64 from the deposit: $1,981.36.
    expect(done).toEqual({ paid: 1_981_36, penalty: 20_96 });
    expect(chase.balance).toBe(p0);
    // Sunday 6 September; Monday is Labor Day: Citi sends on Tuesday 8 September.
    const coming = sim.universe.scheduled.filter((i) => i.kind === 'bank.transfer_arrives' && i.status === 'pending');
    expect(coming.map((i) => ({ at: i.at, amount: i.payload.amount, toId: i.payload.toId }))).toEqual([{ at: at(2026, 9, 8, 12), amount: 1_981_36, toId: chase.id }]);
    sim.advanceTo(at(2026, 9, 8, 13));
    expect(posted(sim, chase, 'From CD')).toEqual([{ at: at(2026, 9, 8, 12), amount: 1_981_36 }]);
  });

  it('closes NatWest’s on 35 days’ notice by the clock, the button grayed while it runs, and pays the deposit back whole (a London life: no New Haven bank asks notice)', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, bankId: 'gb-natwest', wealth: 'wealthy' }, 'g10-natwest');
    const current = primary(sim);
    const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_term', payload: { amount: 10_000_00 } });
    const term = sim.universe.accounts[accountId]!;
    const asked = sim.now;
    const first = accountLife(sim, 'gb-natwest');
    expect(first.text).toContain('Fixed-Term Savings, £10,000.00 at 4.11%');
    const give = first.button('Give 35 Days’ Notice');
    expect(give.disabled).toBe(false);
    give.onClick!();
    expect(term.breakAt).toBe(asked + 35 * MS_DAY);
    const closing = accountLife(sim, 'gb-natwest');
    expect(closing.text).toContain('It closes on February 9, 2026, on the notice you gave.');
    expect(closing.button('Give 35 Days’ Notice').disabled).toBe(true);
    expect(refused(sim, 'bank.break_term', { accountId })).toBe('It already closes on February 9, 2026, on the notice you gave.');
    sim.advanceTo(asked + 34 * MS_DAY);
    expect(term.closedAt).toBeUndefined();
    sim.advanceTo(asked + 36 * MS_DAY);
    expect(term.closedAt).toBeDefined();
    // NatWest: "a charge equal to the lower of interest earned or 90 days' interest; you never get back less than your
    // deposit." After 35 days the interest earned is the lower, so the £10,000 comes back, no more and no less.
    expect(posted(sim, current, 'Fixed-Term Savings broken early')).toEqual([{ at: term.closedAt!, amount: 10_000_00 }]);
    // The £10,000 is what arrived, the charge already taken: until the third round of 2026-10-13 the notice said “less”
    // it, which read as less than £10,000 to come (defect 57 of that round).
    expect(notices(sim, 'Your Fixed-Term Savings Closed')[0]!.body).toMatch(/^Your notice period ended: £10,000\.00 went to your checking account, after a £\d+\.\d\d penalty for closing early\.$/);
  });
});

// ---------------------------------------------------------------------------
// bank.claim_unclaimed
// ---------------------------------------------------------------------------

describe('bank.claim_unclaimed', () => {
  it('hands a Connecticut life’s untouched savings to “the state’s unclaimed-property office” in every word it’s told, keeps it across a reload, and Claim It Back brings it back once', () => {
    const sim = student('g10-unclaimed');
    const checking = primary(sim);
    const savings = savingsOf(sim);
    for (let m = 1; m <= 38 && !savings.closedAt; m += 1) sim.advanceTo(addMonths(savings.openedAt, m, sim.homeZone));
    // Three years of 365.25 days from Monday 24 August 2026 run out on 24 August 2029; the bank looks on the first.
    expect(savings.closedAt).toBe(at(2029, 9, 1, 0));
    const handOver = sim.universe.transactions.findIndex((t) => t.memo === 'Unclaimed, to the state’s unclaimed-property office');
    expect(handOver).toBeGreaterThan(0);
    // What it held: every posting to it before, summed.
    const held = sim.universe.transactions.slice(0, handOver).flatMap((t) => t.postings).filter((p) => p.accountId === savings.id).reduce((s, p) => s + p.amount, 0);
    expect(held).toBeGreaterThan(413_043_00);
    expect(sim.player.unclaimed).toEqual([{ amount: held, to: 'the state’s unclaimed-property office', at: at(2029, 9, 1, 0) }]);
    const letter = Object.values(sim.universe.decisions).find((d) => d.refType === 'unclaimed-notice' && d.refId === savings.id)!;
    expect(letter.detail).toContain('it goes to the state’s unclaimed-property office as unclaimed money.');
    const whole = `$${Math.round(held / 100).toLocaleString('en-US')}`;
    expect(notices(sim, 'Unclaimed Money').map((n) => n.body)).toEqual([`${whole} left unused in Chase Savings for three years went to the state’s unclaimed-property office. It can be claimed back from that office.`]);
    for (const words of [letter.detail, notices(sim, 'Unclaimed Money')[0]!.body]) expect(words).not.toMatch(/New York|Comptroller|yes, from/);

    const again = reload(sim);
    expect(again.player.unclaimed).toEqual(sim.player.unclaimed);
    const bank = again.universe.accounts[checking.id]!;
    const liability = again.nominalAccount('liability_other', 'Unclaimed Money');
    expect(liability.balance).toBe(held);
    const screen = accountLife(again, 'us-chase');
    expect(screen.text).toContain(`${whole} went to the state’s unclaimed-property office after years unused. It can be claimed back from that office.`);
    expect(screen.text).not.toMatch(/New York|Comptroller|yes, from/);
    // The rules shown are Connecticut’s, by its statute, which gives the three years taken: until the third round of
    // 2026-10-13 they were New York’s research, a law firm’s note on its Comptroller (defect 58 of that round).
    expect(screen.text).toContain('The country’s rules: each state’s own law: in Connecticut a deposit untouched three years is presumed abandoned (Conn. Gen. Stat. §3-57a) and can be claimed back from the State Treasurer at any time (§3-70a; cga.ct.gov, October 13, 2026); the game uses the three years for every state.'); // the day as the game writes one from 2026-10-17 (brief 14's data pass)
    expect(screen.text).not.toContain('cullenllp');
    const b0 = bank.balance;
    screen.button('Claim It Back').onClick!();
    expect(bank.balance - b0).toBe(held);
    expect(posted(again, bank, 'Unclaimed money returned from the state’s unclaimed-property office')).toEqual([{ at: again.now, amount: held }]);
    expect(liability.balance).toBe(0);
    expect(again.player.unclaimed).toEqual([]);
    const after = accountLife(again, 'us-chase');
    expect(after.text).not.toContain('went to the state’s unclaimed-property office');
    expect(after.buttons.some((b) => b.text === 'Claim It Back')).toBe(false);
    expect(refused(again, 'bank.claim_unclaimed')).toBe('No money of yours is held as unclaimed.');
    // Once: a reload and a day more bring nothing back again.
    const third = reload(again);
    third.advanceBy(MS_DAY);
    expect(posted(third, third.universe.accounts[checking.id]!, 'Unclaimed money returned from the state’s unclaimed-property office')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// bank.debit_overdraft
// ---------------------------------------------------------------------------

describe('bank.debit_overdraft', () => {
  /** A student whose credit card is locked by its own command, so the day's groceries have only the debit card. */
  function lockedOut(seed: string, bankId: string, overdrawn: number): { sim: Simulation; checking: Account } {
    const sim = student(seed, bankId);
    sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
    const checking = primary(sim);
    setBalance(sim, checking, overdrawn); // TEST SETUP: the current account overdrawn by the figure given, on the first morning.
    return { sim, checking };
  }
  const fees = (sim: Simulation, account: Account) => posted(sim, account, 'Overdraft fee');

  it('at Chase: opted in by its button, the clock’s groceries go into the overdraft, and the $34 fee is held and charged after the next business day; opted out, nothing is bought and nothing charged', () => {
    const { sim, checking } = lockedOut('g10-optin', 'us-chase', -45_00);
    const asked = lending(sim, 'us-chase', ['borrowing'], checking);
    expect(asked.text).toContain('You haven’t opted in, so an everyday debit card purchase the account can’t cover goes on the card, or is declined, and costs no fee. Other payments, like autopay and standing orders, go into the overdraft either way. The law requires a US bank to ask you first.');
    asked.button('Opt In To Debit Card Overdrafts').onClick!();
    expect(checking.debitOverdraft).toBe(true);
    expect(lending(sim, 'us-chase', ['borrowing'], checking).text).toContain('You’ve opted in: an everyday debit card purchase the account can’t cover is paid into the overdraft, with its fee.');
    // The answer is kept across a reload.
    const opted = reload(sim);
    const c = opted.universe.accounts[checking.id]!;
    expect(c.debitOverdraft).toBe(true);

    // Tuesday's groceries at midnight: $10.00, past Chase's $5 small-item line and taking it past its $50 grace.
    opted.advanceTo(at(2026, 8, 25));
    expect(posted(opted, c, 'Groceries')).toEqual([{ at: at(2026, 8, 25, 0), amount: -10_00 }]);
    expect(c.balance).toBe(-55_00);
    expect(c.pendingItems).toEqual([{ day: '2026-08-25', count: 1 }]);
    expect(fees(opted, c)).toEqual([]);
    expect(lending(opted, 'us-chase', ['borrowing'], c).text).toContain('1 overdraft fee is on hold, $34.00. It’s charged after the end of August 26, 2026, unless the account is back to −$50.00 or better by then.');
    // Wednesday is the next business day: still held through it, charged once it has ended.
    opted.advanceTo(at(2026, 8, 26));
    expect(fees(opted, c)).toEqual([]);
    opted.advanceTo(at(2026, 8, 27));
    expect(fees(opted, c)).toEqual([{ at: at(2026, 8, 27, 0), amount: -34_00 }]);
    expect(c.balance).toBe(-45_00 - 3 * 10_00 - 34_00);

    // The twin who didn't opt in: the groceries aren't bought, and nothing is charged.
    const { sim: out, checking: o } = lockedOut('g10-optin', 'us-chase', -45_00);
    out.advanceTo(at(2026, 8, 27));
    expect(o.balance).toBe(-45_00);
    expect(posted(out, o, 'Groceries')).toEqual([]);
    expect(o.pendingItems).toBeUndefined();
    expect(fees(out, o)).toEqual([]);
    // In `spendRefusal`'s words: with no opt-in the overdraft isn't counted, and the locked card has no room.
    expect(notices(out, 'No Money For Food Today').map((n) => n.body)).toContain('A day’s groceries cost $10.00, and there’s nothing left to pay with. You’re eating what’s left in the cupboard today, and it isn’t enough.');
  });

  it('at Wells Fargo: opted in, the $10.00 groceries overdraw the account with no fee, as it charges none on an item of $10 or less; opted out, they aren’t bought', () => {
    const { sim, checking } = lockedOut('g10-optin-wf', 'us-wells-fargo', -5_00);
    expect(sim.must({ kind: 'bank.debit_overdraft', payload: { on: true } })).toEqual({ on: true });
    sim.advanceTo(at(2026, 8, 28));
    expect(posted(sim, checking, 'Groceries').map((p) => p.amount)).toEqual([-10_00, -10_00, -10_00, -10_00]);
    expect(checking.balance).toBe(-45_00);
    expect(checking.pendingItems).toBeUndefined();
    expect(fees(sim, checking)).toEqual([]);
    const { sim: out, checking: o } = lockedOut('g10-optin-wf', 'us-wells-fargo', -5_00);
    out.advanceTo(at(2026, 8, 28));
    expect(o.balance).toBe(-5_00);
    expect(posted(out, o, 'Groceries')).toEqual([]);
  });

  it('is refused where the bank doesn’t ask, at Citi and Capital One, and at Bank of America, which never pays a debit purchase into an overdraft, in their words and on its screen', () => {
    for (const bankId of ['us-citi', 'us-capital-one']) {
      const sim = student(`g10-optin-${bankId}`, bankId);
      expect(refused(sim, 'bank.debit_overdraft', { on: true }), bankId).toBe('Your bank doesn’t offer this choice.');
      expect(primary(sim).debitOverdraft).toBeUndefined();
    }
    const boa = student('g10-optin-boa', 'us-bank-of-america');
    expect(refused(boa, 'bank.debit_overdraft', { on: true })).toBe('Bank of America never pays a debit card purchase into an overdraft.');
    expect(primary(boa).debitOverdraft).toBeUndefined();
    const screen = lending(boa, 'us-bank-of-america', ['borrowing'], primary(boa));
    expect(screen.text).toContain('Bank of America never pays an everyday debit card purchase into an overdraft: one it can’t pay goes on the card, or is declined.');
    expect(screen.buttons.some((b) => /Debit Card Overdrafts/.test(b.text))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bank.open_term
// ---------------------------------------------------------------------------

describe('bank.open_term', () => {
  it('is refused past what the account holds, at a bank with no current account there, and for nothing, and opens nothing', () => {
    const sim = student('g10-term-no');
    const checking = primary(sim);
    const start = checking.balance;
    expect(start).toBe(92_391_00);
    expect(refused(sim, 'bank.open_term', { amount: 100_000_00 })).toBe('Chase Total Checking has only $92,391.00 available, so no term deposit was opened.');
    expect(refused(sim, 'bank.open_term', { amount: 1_000_00, bankId: 'us-wells-fargo' })).toBe('A term deposit at Wells Fargo is paid for from your checking account there. Open a checking account at Wells Fargo first.');
    expect(refused(sim, 'bank.open_term', { amount: 0 })).toBe('Enter how much to put away.');
    expect(termsOf(sim, sim.player)).toEqual([]);
    expect(checking.balance).toBe(start);
  });

  it('puts a Citi CD away from the Citi account on its own panel, Chase untouched, at Citi’s 4.25% for twelve months, and it accrues by the day across a reload', () => {
    const { sim, chase, citi } = withCiti('g10-term-citi');
    sim.must({ kind: 'bank.set_primary', payload: { accountId: citi.id } });
    const panel = lending(sim, 'us-citi', ['term', 'switch'], undefined, { deposit: '1000' });
    expect(panel.text).toContain('Locked for 12 months at a fixed 4.25%. At its end it renews for the same term at the bank’s rate on the day, unless you choose another way the bank allows.');
    const c0 = citi.balance;
    const p0 = chase.balance;
    panel.button('Put It Away').onClick!();
    expect(h.toasts).toEqual([`Your CD is open, locked until ${formatDate(termsOf(sim, sim.player)[0]!.maturesAt!, sim.zone)}.`]);
    const [term] = termsOf(sim, sim.player);
    // Citi 12-month CD, 4.25% (fortune.com, 24 September 2026), maturing a year to the hour.
    expect(term).toMatchObject({ name: 'CD', bankId: 'us-citi', institution: 'Citi', balance: 1_000_00, fixedRate: 0.0425, maturesAt: at(2027, 8, 27) });
    expect(citi.balance - c0).toBe(-1_000_00);
    expect(chase.balance).toBe(p0);
    expect(lending(sim, 'us-citi', ['term', 'switch']).text).toContain('$1,000 at 4.25%, ends August 27, 2027.');
    sim.must({ kind: 'bank.set_primary', payload: { accountId: chase.id } });
    // A day at 4.25% on $1,000 is $1,000 × 4.25% ÷ 365 = 11.6438 cents.
    sim.advanceTo(at(2026, 9, 6));
    expect(term!.accrued).toBeCloseTo(10 * (1_000_00 * 0.0425) / 365, 6);
    const again = reload(sim);
    again.advanceTo(at(2026, 9, 7));
    expect(again.universe.accounts[term!.id]!.accrued).toBeCloseTo(11 * (1_000_00 * 0.0425) / 365, 6);
  });

  it('draws Citi’s CD panel beside Chase’s with Chase still primary, and Put It Away on it funds the CD from the Citi account, Chase untouched', () => {
    // Until 2026-10-13 only the primary's bank's panel was drawn, so the test above made Citi primary first, where
    // funding from the term's own bank and funding from the primary are the same account.
    const { sim, chase, citi } = withCiti('g10-term-beside');
    expect(sim.player.primaryAccountId).toBe(chase.id);
    const chaseBank = bankById('us-chase')!;
    const both = draw(sim, createElement(TermDeposits, { primaryBank: chaseBank }));
    // The primary's first, then Citi's, named for its bank.
    expect(both.text).toContain('7 months at 3.5%');
    expect(both.text).toContain('Citi, 12 months at 4.25%');
    expect(both.text.indexOf('7 months at 3.5%')).toBeLessThan(both.text.indexOf('Citi, 12 months at 4.25%'));
    expect(both.buttons.filter((b) => b.text === 'Put It Away')).toHaveLength(2);
    // $1,000 typed on Citi's panel: Chase's panel's states as they start, however many it and what it draws take, then
    // Citi's.
    h.sim = sim;
    h.states = Array<unknown>(100).fill(K);
    renderToStaticMarkup(createElement(BankLending, { bank: chaseBank, show: ['term'] }));
    const chaseStates = 100 - h.states.length;
    h.states = [];
    expect(chaseStates).toBeGreaterThanOrEqual(9);
    const typed = draw(sim, createElement(TermDeposits, { primaryBank: chaseBank }), [...Array<unknown>(chaseStates).fill(K), ...lendingStates({ deposit: '1000' })]);
    const [onChase, onCiti] = typed.buttons.filter((b) => b.text === 'Put It Away');
    expect(onChase!.disabled).toBe(true);
    expect(onCiti!.disabled).toBe(false);
    const c0 = citi.balance;
    const p0 = chase.balance;
    onCiti!.onClick!();
    expect(h.toasts).toEqual([`Your CD is open, locked until ${formatDate(termsOf(sim, sim.player)[0]!.maturesAt!, sim.zone)}.`]);
    expect(termsOf(sim, sim.player)).toEqual([expect.objectContaining({ name: 'CD', bankId: 'us-citi', balance: 1_000_00, fixedRate: 0.0425 })]);
    expect(citi.balance - c0).toBe(-1_000_00);
    expect(chase.balance).toBe(p0);
    expect(sim.player.primaryAccountId).toBe(chase.id);
  });

  it('lets MUFG’s overdraft run to 90% of a ¥1,000,000 time deposit and no further: a meal that would pass ¥900,000 overdrawn is refused, one that reaches it is bought', () => {
    const tokyo = (seed: string) => {
      const sim = quickSave({ startLocationId: 'jp-13-tokyo', homeRegionId: 'jp-13-tokyo', livesWhereBorn: true, bankId: 'jp-mufg', wealth: 'wealthy' }, seed);
      sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
      sim.must({ kind: 'bank.open_term', payload: { amount: 1_000_000_00 } });
      return { sim, checking: primary(sim) };
    };
    // The meal's price, read where there's room to spare. TEST SETUP: the account overdrawn ¥500,000.
    const roomy = tokyo('g10-mufg-90');
    setBalance(roomy.sim, roomy.checking, -500_000_00);
    roomy.sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    const price = -posted(roomy.sim, roomy.checking, 'A meal')[0]!.amount;
    expect(price).toBeGreaterThan(0);
    // TEST SETUP, on the same seed: overdrawn so the meal takes it to ¥900,000, 90% of ¥1,000,000, to the yen; then a
    // yen past it.
    const to = tokyo('g10-mufg-90');
    setBalance(to.sim, to.checking, -(900_000_00 - price));
    to.sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(to.checking.balance).toBe(-900_000_00);
    const past = tokyo('g10-mufg-90');
    setBalance(past.sim, past.checking, -(900_000_00 - price + 1_00));
    expect(refused(past.sim, 'life.look_after', { action: 'eat' })).toBe('You can’t afford it.');
    expect(past.checking.balance).toBe(-(900_000_00 - price + 1_00));
    expect(posted(past.sim, past.checking, 'A meal')).toEqual([]);
  });

  // Its title named the 90% until 2026-10-13, which its bound didn't test; the test before this one does.
  it('lends against it at MUFG at the deposit’s 0.50% and 0.50% more, so the clock’s groceries go into the overdraft; without one they aren’t bought (a Tokyo life: no New Haven bank lends this way)', () => {
    const play = (withTerm: boolean) => {
      const sim = quickSave({ startLocationId: 'jp-13-tokyo', homeRegionId: 'jp-13-tokyo', livesWhereBorn: true, bankId: 'jp-mufg', wealth: 'wealthy' }, 'g10-mufg');
      sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
      if (withTerm) sim.must({ kind: 'bank.open_term', payload: { amount: 1_000_000_00 } });
      const checking = primary(sim);
      setBalance(sim, checking, 0); // TEST SETUP: the ordinary account emptied, after the deposit was put away from it.
      sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 6, hour: 12 }, 'Asia/Tokyo'));
      return { sim, checking };
    };
    const { sim, checking } = play(true);
    expect(posted(sim, checking, 'Groceries')).toHaveLength(1);
    expect(checking.balance).toBeLessThan(0);
    // 900,000 yen of room, and what's used accrues at the deposit's 0.50% and the bank's 0.50% more.
    expect(-checking.balance).toBeLessThan(900_000_00);
    expect(checking.odAccrued).toBeCloseTo((-checking.balance * (0.005 + 0.005)) / 365, 6);
    const { sim: without, checking: bare } = play(false);
    expect(posted(without, bare, 'Groceries')).toEqual([]);
    expect(bare.balance).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// bank.pay_collections
// ---------------------------------------------------------------------------

describe('bank.pay_collections', () => {
  /** What the person's accounts at a bank held between them before a transaction: every posting to them before it, summed. */
  const heldBefore = (sim: Simulation, accounts: Account[], memo: string) => {
    const index = sim.universe.transactions.findIndex((t) => t.memo === memo);
    expect(index, memo).toBeGreaterThan(0);
    const ids = new Set(accounts.map((a) => a.id));
    return sim.universe.transactions.slice(0, index).flatMap((t) => t.postings).filter((p) => ids.has(p.accountId)).reduce((s, p) => s + p.amount, 0);
  };
  const applied = (sim: Simulation) => {
    const r = sim.must<{ approved: boolean }>({ kind: 'card.apply', payload: {} });
    return { approved: r.approved, said: sim.universe.notifications.at(-1)!.body };
  };

  it('closes an account overdrawn for sixty days by the clock into a debt Chase’s own, and the panel’s Pay It and the command pay it down and off, with card.apply, troubles and the open and switch refusals read before and after', () => {
    const sim = student('g10-collect');
    const chase = primary(sim);
    const savings = savingsOf(sim);
    // TEST SETUP: savings emptied, and the current account $1,500 overdrawn. A smaller overdraft doesn't last: at −$300
    // the $138 of work-study each Friday had it back above zero on 13 October, inside the sixty days. Done after the
    // term's Yale Health plan is paid at nine that first morning: until 2026-10-13 a plan the bank couldn't cover was
    // dropped, and since then it's owed and taken from the next money, which here would be the wages this test counts.
    sim.advanceTo(at(2026, 8, 24, 9, 1));
    setBalance(sim, savings, 0);
    setBalance(sim, chase, -1_500_00);
    expect(refused(sim, 'bank.pay_collections', { amount: 100_00 })).toBe('You don’t owe anything in collections.');
    sim.advanceTo(at(2026, 10, 24));
    const debt = collectionsOf(sim, sim.player)!;
    expect(debt).toMatchObject({ name: 'Owed To Chase, In Collections', institution: 'Chase' });
    // What Chase's two accounts were short between them on the day, and nothing more.
    const owed = -heldBefore(sim, [chase, savings], 'Charged off by Chase');
    expect(debt.balance).toBe(-owed);
    expect([chase.closedAt, savings.closedAt]).toEqual([at(2026, 10, 24, 0), at(2026, 10, 24, 0)]);
    expect(notices(sim, 'Chase Closed Your Account')[0]!.body).toContain(`It was overdrawn for 60 days. $${(owed / 100).toFixed(2)} it couldn’t recover went to collections`);
    const moved = primary(sim);
    expect(moved.bankId).not.toBe('us-chase');
    expect(moved.balance).toBe(0);
    // Owed and unpaid: nothing to pay it with yet, every reader holds it.
    expect(refused(sim, 'bank.pay_collections', { amount: 100_00 })).toBe('Advantage Plus Banking has nothing available to pay it with, so nothing was paid.');
    expect(troubles(sim, sim.player).filter((t) => t.kind === 'collections')).toEqual([{ kind: 'collections', amount: owed }]);
    expect(applied(sim)).toMatchObject({ approved: false, said: expect.stringMatching(/ turned down your application because you have a debt in collections\. You can pay it on Money, under Borrowing\. Applying still took a few points off your credit score\.$/) });
    expect(refused(sim, 'bank.open_current', { bankId: 'us-chase' })).toBe('Chase won’t open an account for you while you owe it a debt it has charged off.');
    expect(refused(sim, 'bank.switch', { bankId: 'us-chase' })).toBe('Chase won’t open an account for you while you owe it a debt it has charged off.');

    // Friday's wages land in the new account; on Saturday, $100 from the panel.
    sim.advanceTo(at(2026, 11, 7));
    const bankOf = bankById(moved.bankId!)!;
    const panel = lending(sim, bankOf.id, ['borrowing'], moved, { toCollections: '100' });
    expect(panel.text).toContain(`In Collections $${Math.round(owed / 100)} owed`);
    expect(panel.text).toContain('Chase closed your account after it was overdrawn for 60 days, and charged off what it couldn’t recover. How long a bank lets an overdraft run is estimated. The charge-off stays on your credit record for seven years, paid or not. While the debt is unpaid, no bank approves a card, and Chase won’t open an account for you.');
    const b0 = moved.balance;
    expect(b0).toBeGreaterThanOrEqual(100_00);
    panel.button('Pay It').onClick!();
    expect(h.toasts).toEqual([expect.stringMatching(/^Paid \$[\d,]+ toward the debt\.$/)]);
    expect(moved.balance - b0).toBe(-100_00);
    expect(debt.balance).toBe(-(owed - 100_00));
    expect(debt.closedAt).toBeUndefined();
    expect(troubles(sim, sim.player).filter((t) => t.kind === 'collections')).toEqual([{ kind: 'collections', amount: owed - 100_00 }]);

    // The rest. TEST SETUP: what the weeks of wages it would take bring, put in at once.
    setBalance(sim, moved, owed);
    const rest = sim.must<{ paid: number; left: number }>({ kind: 'bank.pay_collections', payload: { amount: owed } });
    expect(rest.paid).toBe(owed - 100_00);
    // Nothing left: −0 as the command returns it (`left: -debt.balance`), which no screen shows.
    expect(rest.left).toBeCloseTo(0, 10);
    expect(debt.closedAt).toBe(sim.now);
    expect(moved.balance).toBe(100_00);
    expect(troubles(sim, sim.player).some((t) => t.kind === 'collections')).toBe(false);
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-chase' } }).error ?? '').not.toMatch(/charged-off debt/);
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'us-chase' } }).error ?? '').not.toMatch(/charged-off debt/);
    expect(applied(sim).said).not.toMatch(/debt in collections/);
    expect(lending(sim, bankOf.id, ['borrowing'], moved).text).not.toContain('In Collections');
    const again = reload(sim);
    expect(refused(again, 'bank.pay_collections', { amount: 100_00 })).toBe('You don’t owe anything in collections.');
  });

  it('keeps two banks’ charge-offs apart, each owed to its own bank and refused by its own name, and the life moves to a bank it owes nothing', () => {
    const sim = student('g10-collect-two');
    const chase = primary(sim);
    const savings = savingsOf(sim);
    const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
    const citi = sim.universe.accounts[accountId]!;
    // TEST SETUP: both current accounts overdrawn, Chase's savings emptied.
    setBalance(sim, savings, 0);
    setBalance(sim, chase, -1_500_00);
    setBalance(sim, citi, -400_00);
    sim.advanceTo(at(2026, 10, 24));
    const toChase = collectionsOf(sim, sim.player, 'Chase')!;
    const toCiti = collectionsOf(sim, sim.player, 'Citi')!;
    expect(toChase.name).toBe('Owed To Chase, In Collections');
    expect(toCiti.name).toBe('Owed To Citi, In Collections');
    expect(toChase.id).not.toBe(toCiti.id);
    expect(toChase.balance).toBe(heldBefore(sim, [chase, savings], 'Charged off by Chase'));
    expect(toCiti.balance).toBe(heldBefore(sim, [citi], 'Charged off by Citi'));
    expect(refused(sim, 'bank.open_current', { bankId: 'us-chase' })).toBe('Chase won’t open an account for you while you owe it a debt it has charged off.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi' })).toBe('Citi won’t open an account for you while you owe it a debt it has charged off.');
    expect(['us-chase', 'us-citi']).not.toContain(primary(sim).bankId);
  });

  it('describes a card charged off as a card, not an account overdrawn; paid off, the no-card report climbs again a year on, and left unpaid it doesn’t', () => {
    /** Autopay from an empty Citi account, the day on the card: six due dates missed by the clock. */
    const play = () => {
      const sim = student('g10-chargeoff');
      const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
      const card = cardsOf(sim, sim.player)[0]!;
      sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId } });
      sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
      sim.advanceTo(at(2027, 3, 14));
      expect(card.closedAt).toBeDefined();
      expect(notices(sim, 'Your Card Was Charged Off')).toHaveLength(1);
      return sim;
    };
    const paid = play();
    const unpaid = play();
    const chase = primary(paid);
    const card = Object.values(paid.universe.accounts).find((a) => a.kind === 'credit_card' && a.ownerId === paid.player.id)!;
    expect(card.closedAt).toBeDefined();
    // Citi's empty account ran below zero on its own fee, $5 a month (citi.com; waived to 23 and under, and Ada is 24):
    // August's and September's, and sixty days later Citi charged it off first. The card's debt is Chase's.
    const toCiti = collectionsOf(paid, paid.player, 'Citi')!;
    const toChase = collectionsOf(paid, paid.player, 'Chase')!;
    expect(toCiti.balance).toBe(-2 * 5_00);
    expect(toChase.balance).toBe(heldBefore(paid, [card], 'Charged off: Chase Freedom Unlimited'));
    const first = lending(paid, 'us-chase', ['borrowing'], chase, { toCollections: String(-toCiti.balance / 100) });
    expect(first.text).toContain('Citi closed your account after it was overdrawn for 60 days');
    first.button('Pay It').onClick!();
    expect(toCiti.closedAt).toBe(paid.now);
    const second = lending(paid, 'us-chase', ['borrowing'], chase, { toCollections: (-toChase.balance / 100).toFixed(2) });
    // The In Collections panel's own words, from its title to its field.
    const words = second.text.slice(second.text.indexOf('In Collections'), second.text.indexOf('Pay Toward It'));
    expect(words).toBe(`In Collections $${Math.round(-toChase.balance / 100).toLocaleString('en-US')} owed How This Works Chase closed your card after six payments in a row were missed, and charged off what was owed on it. The charge-off stays on your credit record for seven years, paid or not. While the debt is unpaid, no bank approves a card, and Chase won’t open an account for you. `);
    expect(words).not.toContain('overdrawn');
    second.button('Pay It').onClick!();
    expect(toChase.closedAt).toBe(paid.now);
    expect(lending(paid, 'us-chase', ['borrowing'], chase).text).not.toContain('In Collections');

    // A record with no card open climbs two points a month once nothing is in collections and no payment was late
    // in a year (SLATE's estimate, NO_CARD); the card's last late payment was 13 March 2027.
    const score = (sim: Simulation) => sim.player.credit!.score;
    expect(score(paid)).toBe(score(unpaid));
    paid.advanceTo(at(2028, 3, 2));
    unpaid.advanceTo(at(2028, 3, 2));
    expect(score(paid)).toBe(score(unpaid));
    paid.advanceTo(at(2028, 5, 2));
    unpaid.advanceTo(at(2028, 5, 2));
    expect(score(paid) - score(unpaid)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// bank.reactivate
// ---------------------------------------------------------------------------

describe('bank.reactivate', () => {
  it('wakes Capital One accounts left idle 24 months while Citi was primary: dormant by the clock, interest stopped and every way in refused; Reactivate restarts the interest, survives a reload and lifts each refusal', () => {
    const sim = student('g10-dormant', 'us-capital-one');
    const capital = primary(sim);
    const savings = savingsOf(sim);
    expect(savings.name).toBe('360 Performance Savings');
    // Citi made the everyday bank: $40,000 moved there by Move Money, made primary, wages and the card's autopay with it.
    const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
    const citi = sim.universe.accounts[accountId]!;
    const sent = sim.must<{ arrivesAt: number }>({ kind: 'bank.transfer', payload: { fromId: capital.id, toId: citi.id, amount: 40_000_00 } });
    sim.advanceTo(sent.arrivesAt + 60_000);
    sim.must({ kind: 'bank.set_primary', payload: { accountId: citi.id } });
    sim.must({ kind: 'bank.redirect_deposits', payload: { accountId: citi.id } });
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: cardsOf(sim, sim.player)[0]!.id, accountId: citi.id } });
    const since = sim.now;
    for (let m = 1; m <= 24; m += 1) sim.advanceTo(addMonths(since, m, sim.homeZone));
    // Untouched since Monday 24 August 2026 (the savings) and Thursday 27 August (the checking, its money moved out): 24
    // months of 30.44 days run out on 25 and 28 August 2028, and the bank looks on the first of the month.
    expect(sim.now).toBe(at(2028, 8, 27, 7, 31));
    expect([capital.dormant, savings.dormant]).toEqual([undefined, undefined]);
    sim.advanceTo(at(2028, 9, 1));
    expect([capital.dormant, savings.dormant]).toEqual([true, true]);
    for (const name of ['360 Checking', '360 Performance Savings']) {
      expect(notices(sim, `${name} Is Dormant`).map((n) => ({ at: n.at, body: n.body }))).toEqual([{ at: at(2028, 9, 1, 0), body: 'It hasn’t been used for 24 months, so Capital One has blocked it. Reactivate it on Money, under Your Accounts Over Time, to use it again.' }]);
    }
    // Capital One stops the interest on an account it holds dormant.
    const stopped = savings.accrued;
    sim.advanceTo(at(2028, 9, 2));
    expect(savings.accrued).toBe(stopped);
    // Every way in refused: Move Money out, cash in, and the ATM once 360 Checking is primary again.
    expect(refused(sim, 'bank.transfer', { fromId: savings.id, toId: capital.id, amount: 100_00 })).toBe('360 Performance Savings is dormant, so nothing was moved. Reactivate it under Your Accounts Over Time, then try again.');
    sim.must({ kind: 'cash.withdraw', payload: { amount: 200_00, from: 'atm' } });
    expect(refused(sim, 'cash.deposit', { amount: 100_00, toId: savings.id, at: 'counter' })).toBe('360 Performance Savings is dormant, so nothing was paid in. Reactivate it under Your Accounts Over Time, then try again.');
    sim.must({ kind: 'bank.set_primary', payload: { accountId: capital.id } });
    expect(refused(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' })).toBe('360 Checking is dormant. Reactivate it under Your Accounts Over Time to take cash out of it.');
    expect(refused(sim, 'bank.reactivate', { accountId: citi.id })).toBe('That account isn’t dormant.');

    // Your Accounts Over Time, as the player has it: a line and a Reactivate for each.
    const screen = accountLife(sim, 'us-capital-one');
    expect(screen.text).toContain('360 Checking is dormant: the bank has blocked it until you reactivate it.');
    expect(screen.text).toContain('360 Performance Savings is dormant: the bank has blocked it until you reactivate it.');
    expect(screen.text).toContain('The bank’s terms: An account goes dormant after 24 months with no transactions.');
    const presses = screen.buttons.filter((b) => b.text === 'Reactivate');
    expect(presses).toHaveLength(2);
    for (const press of presses) press.onClick!();
    for (const account of [capital, savings]) {
      expect([account.dormant, account.inactive, account.reactivatedAt]).toEqual([undefined, undefined, at(2028, 9, 2)]);
    }
    expect(accountLife(sim, 'us-capital-one').text).not.toContain('is dormant');
    expect(refused(sim, 'bank.reactivate', { accountId: savings.id })).toBe('That account isn’t dormant.');

    // Kept across a reload, and read by the clock: a day's interest at Capital One's published 3.00%, and no dormancy
    // at the next first of the month, though nothing has touched the savings since 2026.
    const again = reload(sim);
    const s = again.universe.accounts[savings.id]!;
    expect(s.reactivatedAt).toBe(at(2028, 9, 2));
    const before = s.accrued!;
    again.advanceTo(at(2028, 9, 3));
    expect(s.accrued! - before).toBeCloseTo((s.balance * 0.03) / 365, 6);
    again.advanceTo(at(2028, 10, 1));
    expect(s.dormant).toBeUndefined();
    expect(notices(again, '360 Performance Savings Is Dormant')).toHaveLength(1);
    // And each way in works.
    const c = again.universe.accounts[capital.id]!;
    expect(again.execute({ kind: 'cash.withdraw', payload: { amount: 100_00, from: 'atm' } }).ok).toBe(true);
    expect(again.execute({ kind: 'cash.deposit', payload: { amount: 100_00, toId: s.id, at: 'counter' } }).ok).toBe(true);
    const c0 = c.balance;
    expect(again.must({ kind: 'bank.transfer', payload: { fromId: s.id, toId: c.id, amount: 100_00 } })).toEqual({ moved: 100_00 });
    expect(c.balance - c0).toBe(100_00);
  });
});
