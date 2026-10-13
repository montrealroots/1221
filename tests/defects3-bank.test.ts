/**
 * Bank defects of the third round of 2026-10-13, each held here through the command a player sends or the clock that
 * carries it, and read where the player reads it, against figures worked out from the bank’s or the rule’s own words,
 * never asked of the helper the engine works them out with. Each failed before its fix, on the break named beside it.
 *
 * - A cash deposit at a machine read the primary account’s debit card, not the card of the bank taking the money
 *   (defect 56): a Wells Fargo machine took cash with the Wells Fargo card locked, and refused it for Chase’s.
 * - A loan payment returned unpaid had its fee from the primary account, at the primary bank’s rule, not from the account
 *   the loan is repaid from (defect 60).
 * - A card paid off on a hardship plan before its statement kept its missed payments for good (defect 68): Home said it
 *   was behind over $0 owed, and the money worry was felt every day.
 * - A due date that crossed a month came a minute after noon (defect 48), its schedule read where the clock keeps it.
 * - Shinhan’s three days, an emergency card sent abroad, were sent as a rush replacement for nothing (loose end L11).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM, at Chase. LIFE FIXTURES, said where they’re made: a Toronto life at RBC
 * (no New Haven bank has a returned-payment fee; Canada’s banks do), and a Seoul life at Shinhan. TEST SETUP: a balance
 * set by a posting against a test equity line, purchases put on a card, and a month’s wages paid in.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { stateOf } from '@/engine/systems/credit';
import { troubles } from '@/engine/systems/spending';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
}));

// The screens’ kept tab: the store it’s kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original’s hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { Home } = await import('@/ui/screens/Home');
const { BankSecurity } = await import('@/ui/bank/BankSecurity');

/** New Haven’s clock, worked out here: Eastern Daylight Time (UTC−4) until 1 November 2026, Eastern Standard after. */
const edt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 4, minute);
const est = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 5, minute);

const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** The same life at 9:01 AM, past the fall term’s Yale Health plan, $1,882, out of checking at 9:00. */
function settled(seed: string): Simulation {
  const sim = student(seed);
  sim.advanceTo(edt(8, 24, 9, 1));
  return sim;
}

const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation, kind: Account['kind'], bankId: string): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && a.bankId === bankId && !a.closedAt && a.category !== 'term')!;

function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const refused = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload }).error;
/** What each transaction with a memo moved on an account, in order. */
const moved = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).flatMap((t) => t.postings.filter((p) => p.accountId === account.id).map((p) => p.amount));

/** TEST SETUP: an account brought to a balance, by a posting against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}
/** TEST SETUP: purchases put on a card, as a month’s shopping would put them. */
function purchases(sim: Simulation, card: Account, amount: number): void {
  sim.post({ memo: 'TEST SETUP: purchases', category: 'shopping', postings: [{ accountId: card.id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test Setup').id, amount }] });
}

/** What the player reads on a screen: its markup with every tag taken out, and its entities read. */
function onScreen(sim: Simulation, element: Parameters<typeof renderToStaticMarkup>[0]): string {
  h.sim = sim;
  return renderToStaticMarkup(element).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// cash.deposit (defect 56)
// ---------------------------------------------------------------------------

describe('cash.deposit at a machine reads the card of the bank taking the money', () => {
  /*
   * Break tried: `cash.deposit` reading the primary’s card again (`const card = person.primaryAccountId ? …plastic`).
   * The Wells Fargo machine then took the $10 behind its locked card, and refused it behind Chase’s.
   */
  it('PLAYER JOURNEY: a Wells Fargo account beside Chase: its machine refuses cash behind its own locked card and takes it behind Chase’s; Chase’s machine refuses it into Chase Savings behind Chase’s', () => {
    const sim = settled('d3-deposit-bank');
    const chase = primary(sim);
    expect(chase.bankId).toBe('us-chase');
    must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' });
    const opened = must<{ accountId: string; cardAt: number }>(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: chase.id, amount: 100_00 });
    sim.advanceTo(opened.cardAt + 60_000);
    const wf = sim.universe.accounts[opened.accountId]!;
    expect(sim.player.primaryAccountId).toBe(chase.id);
    expect(wf.plastic?.stopped).toBeUndefined();
    const atm = (to: Account) => sim.execute({ kind: 'cash.deposit', payload: { amount: 10_00, toId: to.id, at: 'atm' } });

    must(sim, 'card.lock', { which: 'debit', locked: true, accountId: wf.id });
    expect(atm(wf).error).toBe('Your debit card is locked; the counter can still take it.');
    const w0 = wf.balance;
    must(sim, 'cash.deposit', { amount: 10_00, toId: wf.id, at: 'counter' });
    expect(wf.balance).toBe(w0 + 10_00);

    must(sim, 'card.lock', { which: 'debit', locked: false, accountId: wf.id });
    must(sim, 'card.lock', { which: 'debit', locked: true, accountId: chase.id });
    expect(chase.plastic!.locked).toBe(true);
    expect(atm(wf).ok).toBe(true);
    expect(wf.balance).toBe(w0 + 20_00);
    // Savings at Chase reads the card of the Chase account beside it.
    expect(atm(mine(sim, 'savings', 'us-chase')).error).toBe('Your debit card is locked; the counter can still take it.');
  });
});

// ---------------------------------------------------------------------------
// A returned loan payment’s fee (defect 60)
// ---------------------------------------------------------------------------

describe('a loan payment returned unpaid is charged where it was drawn', () => {
  /*
   * LIFE FIXTURE: a Toronto life at RBC, the primary, with a TD account beside it the loan is repaid from. Canada’s
   * banks charge at most $10 for a payment returned unpaid, none under $10 short (canada.ca, from 12 March 2026). The
   * loan is Citi’s, which lends to new customers (citi.com: $2,000 to $30,000 for a new customer).
   * Break tried: `LOAN_DUE` calling `chargeReturned(s, person, bank.short)` without the account: RBC’s $10 then came out
   * of RBC, and TD’s nothing.
   */
  it('LIFE FIXTURE (Toronto): a Citi loan repaid from TD, TD empty at the due date: TD’s $10 from TD, nothing from RBC, the primary', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ca-rbc' }, 'd3-returned');
    const rbc = primary(sim);
    expect(rbc.bankId).toBe('ca-rbc');
    const td = sim.universe.accounts[must<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-td', fundFrom: rbc.id, amount: 100_00 }).accountId]!;
    expect(td.bankId).toBe('ca-td');
    // TEST SETUP: a month’s wages paid in, as a payday posts them: a bank lends against wages (`loanOffer`).
    sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: rbc.id, amount: 5_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -5_000_00 }] });
    const loan = must<{ loanId: string }>(sim, 'bank.borrow', { amount: 5_000_00, months: 24, bankId: 'us-citi', intoId: rbc.id, repayFromId: td.id });
    const due = sim.universe.scheduled.find((i) => i.kind === 'bank.loan_due' && i.status === 'pending' && i.payload.accountId === loan.loanId)!;
    expect(due).toBeDefined();
    sim.advanceTo(due.at - 60_000);
    setBalance(sim, td, 0); // TEST SETUP: TD emptied the minute before
    const r0 = rbc.balance;
    sim.advanceTo(due.at + 60_000);
    expect(moved(sim, td, 'Returned payment fee')).toEqual([-10_00]);
    expect(moved(sim, rbc, 'Returned payment fee')).toEqual([]);
    expect(moved(sim, rbc, `Payment: ${sim.universe.accounts[loan.loanId]!.name}`)).toEqual([]);
    expect(rbc.balance).toBe(r0);
  });
});

// ---------------------------------------------------------------------------
// card.request_hardship, paid off before its statement (defect 68)
// ---------------------------------------------------------------------------

describe('a card paid off before its statement owes no missed payment', () => {
  /*
   * The life’s Chase card owing $4,800, its statement of 20 September asking it all; the bank emptied the minute before
   * the due date of Sunday 11 October at noon, so it’s late once ($48 the minimum, the safe harbor’s $30 fee), and then
   * on a hardship plan. Paid off, $4,830, before the 20 October statement, that statement owes nothing.
   * Break tried: the statement’s nothing-owed branch without `credit.missed = 0`: the card stayed a payment behind,
   * troubles() held card_behind at $0, and Home said “Your card is a payment behind, owing $0.”
   */
  it('PLAYER JOURNEY: late once, on a plan, paid off: the 20 October statement owes nothing, the miss is behind it, and Home says nothing of the card', () => {
    const sim = settled('d3-paid-off');
    const card = mine(sim, 'credit_card', 'us-chase');
    const checking = primary(sim);
    purchases(sim, card, 4_800_00); // TEST SETUP
    sim.advanceTo(edt(9, 20, 9, 1));
    expect(stateOf(sim.player, card).statementBalance).toBe(4_800_00);
    sim.advanceTo(edt(10, 11, 11, 59));
    setBalance(sim, checking, 0); // TEST SETUP: the bank emptied the minute before the due date
    setBalance(sim, mine(sim, 'savings', 'us-chase'), 0); // TEST SETUP
    sim.advanceTo(edt(10, 11, 12, 5));
    expect(moved(sim, card, 'Late fee')).toEqual([-30_00]);
    expect(stateOf(sim.player, card).missed).toBe(1);
    expect(must(sim, 'card.request_hardship', {})).toEqual({ payment: 101_00 });
    expect(troubles(sim, sim.player).filter((t) => t.kind === 'card_behind')).toEqual([{ kind: 'card_behind', amount: 4_830_00, accountId: card.id }]);

    setBalance(sim, checking, 5_000_00); // TEST SETUP: the means to pay it all, come since
    expect(must(sim, 'finance.pay_card', { amount: 4_830_00 })).toEqual({ paid: 4_830_00 });
    expect(card.balance).toBe(0);
    sim.advanceTo(edt(10, 20, 9, 1));
    const state = stateOf(sim.player, card);
    expect([state.statementAt, state.statementBalance]).toEqual([edt(10, 20, 9, 0), 0]);
    expect(state.missed).toBe(0);
    expect(state.hardship).toBeUndefined();
    expect(state.suspended).toBeUndefined();
    expect(troubles(sim, sim.player).filter((t) => t.kind === 'card_behind')).toEqual([]);
    const home = onScreen(sim, createElement(Home));
    expect(home).not.toMatch(/payments? behind|is suspended, owing/);
  });
});

// ---------------------------------------------------------------------------
// A due date across a month’s end (defect 48)
// ---------------------------------------------------------------------------

describe('a card’s due date across a month’s end comes at noon', () => {
  /*
   * Chase’s 21 days from the 20 October statement: Tuesday 10 November, at noon, Eastern Standard Time.
   * Break tried: `dueAt` passing the 41st of October to `instantFromZoned` again: it came at 12:01.
   */
  it('PLAYER JOURNEY: owing at the 20 October statement, the payment is due on the calendar at 12:00 on 10 November', () => {
    const sim = settled('d3-due-noon');
    const card = mine(sim, 'credit_card', 'us-chase');
    sim.advanceTo(edt(10, 1, 9, 0));
    purchases(sim, card, 200_00); // TEST SETUP
    sim.advanceTo(edt(10, 20, 9, 1));
    const due = sim.universe.scheduled.filter((i) => i.kind === 'card.due' && i.status === 'pending' && i.payload.accountId === card.id).map((i) => i.at);
    expect(due).toEqual([est(11, 10, 12, 0)]);
  });
});

// ---------------------------------------------------------------------------
// card.report: Shinhan’s emergency card abroad is no rush (loose end L11)
// ---------------------------------------------------------------------------

describe('card.report rushes only what the bank’s own words make a rush', () => {
  /*
   * LIFE FIXTURE: a Seoul life at Shinhan. Its research’s three days are “an emergency replacement card (credit cards
   * only, no ATM or online use)” sent to a customer abroad, not a rush replacement, and Shinhan names no other.
   * Break tried: Shinhan’s `rushDays: 3` put back: the rush was sent free in three business days.
   */
  it('LIFE FIXTURE (Seoul): Shinhan’s card can’t be rushed, in the words for a bank with none, and Your Cards draws no rush', () => {
    const sim = quickSave({ startLocationId: 'kr-11-seoul', homeRegionId: 'kr-11-seoul', livesWhereBorn: true, wealth: 'comfortable', bankId: 'kr-shinhan' }, 'd3-shinhan');
    const checking = primary(sim);
    expect(checking.bankId).toBe('kr-shinhan');
    expect(refused(sim, 'card.report', { which: 'debit', why: 'lost', rush: true })).toBe(`${checking.institution} has no rush replacement SLATE knows of.`);
    expect(checking.plastic?.stopped).toBeUndefined();
    expect(onScreen(sim, createElement(BankSecurity, { bankId: 'kr-shinhan' }))).not.toContain('Rush The New One');
  });
});
