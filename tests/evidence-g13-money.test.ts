/**
 * Evidence for the seven money rows the review of 2026-10-13 left partial (verification group g13-money). Each is
 * reached as a player reaches it, through the command its screen runs or through the clock, and each consequence is
 * read where the row says it is read, against figures worked out here from the bank's and the law's own numbers.
 *
 * - `finance.pay_card`: the minimum paid by hand before its due date leaves autopay asking nothing, so a bank emptied
 *   the minute before the due date bounces nothing, charges no late fee, misses nothing and reports the month (+3),
 *   across a save and a load, where its twin unpaid bounces, is late, pays the US safe harbor's $30 and isn't yet
 *   reported; paid in full, the statement keeps its grace period and the next charges no interest, where the minimum
 *   carries and the next charges the $62.47 that $2,000 builds at 18.46% a day at a time; the refusals in their own
 *   words; a payment by hand draws the savings at the primary's bank though the link is off; $540 paid by hand goes
 *   $40 to the purchases at 0% and the rest to a cash advance at 28.49% first (`allocatePayment`, reached through the
 *   command, where the review found it only called), so the next statement charges the cash nothing, where the
 *   minimum alone leaves it $3.37; paid from Capital One, Chase holds the freed credit its 15 days and Left To Spend
 *   shows it; the button as the player has it.
 * - `bank.fraud_refund`: a refund due to a card closed since lands in the current account at its bank, once, with a
 *   notice that says where (the review's stranded refund, fixed on 2026-10-13); one due to a second bank's current
 *   account closed since, in the primary account; on the open card, the card.
 * - `bank.scheduled_payment`: a payment from a current account Chase closed for sixty days overdrawn doesn't go, and
 *   says so; RBC's savings lets one withdrawal a month go free and the next costs $2.00, and a payment is held to
 *   what's left after the fee; Deutsche Bank's savings lets €2,000 a month out without notice.
 * - `card.replaced`: reported lost and then moved to a new number, the debit card arrives once (the review's double
 *   arrival, fixed on 2026-10-13), unlocked; while it's on its way the day's groceries go on the credit card, and
 *   once it's here they come out of the current account again.
 * - `card.statement`: the six-monthly review raises a clean record's limit by a fifth, $65,217 to $78,260, at the
 *   first statement 182 days on, where a holder who said never keeps it; and the yearly fee is charged once in its
 *   month though a day moved from the 1st to the 28th gives October two statements, in Dublin, where the clocks go
 *   back on 25 October and the second statement falls 27 days and an hour after the first.
 * - `credit score`: a statement day asked to move every morning moves once a cycle, so the statements, their due
 *   dates, their interest and their reports still come, and the score moves as a twin's who never moved it; a mark
 *   seven years old leaves at the month's end on the clock and gives 25 back, which a card application then reads,
 *   and the card's screen reprices; 80% of the limit used at a due date costs ten of the month's three points, 20%
 *   none; with no card open the record ages back 2 a month on the 1st to 680, and not with a payment late in the year;
 *   a Citi loan is priced by the record, 12.10% at 735 and 12.30% at 730. (The score itself is on no screen in play:
 *   creation shows the starting one, and in play the card's terms are where a player reads the record.)
 * - `statements`: the Statements screen, rendered, shows a card's kept cuts as its periods, a transition cycle's
 *   charge under one statement, the minimum and Reg Z's minimum-only warning worked by hand ($2,000: 7 years and a
 *   month, $3,507.30; $72.77 a month for three years, $2,619.72); a current account closed reads Until It Closed (To Its Closing until brief 15); and a
 *   card closed with its statements kept does too (it failed when written: until 2026-10-13 the engine called its last
 *   period So Far; fixed that day).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, from New Haven and an actor at Yale,
 * banking at Chase (Total Checking, Savings, the Freedom Unlimited at 0% until 20 October 2026 and 18.46% after, a
 * $65,217 limit), starting Monday 24 August 2026 at 7:30 AM; the same life banking at Bank of America where a row needs
 * a bank that moves an account to a new number, which Chase doesn't. Where a row is about a bank a New Haven life never
 * reaches, a `quickSave` life there, said where it's made: RBC in Toronto and Deutsche Bank in Berlin (no US bank in
 * SLATE charges for a savings withdrawal or caps one), Bank of Ireland in Dublin (no US card in SLATE has a yearly fee).
 *
 * TEST SETUP, said again where it's done: purchases put on the card against a test line; balances set against a test
 * equity line (a bank emptied the minute before a due date, Chase overdrawn); somebody else's use of a card, given as
 * the day's draw would make it; a record's score, a payment late 200 days ago and a mark seven years old, set by hand,
 * since no played life is seven years long; and on the screens, the account and period chosen, which a static render
 * can't click to.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { cardRoom, stateOf } from '@/engine/systems/credit';
import { REPLACED_KIND, somebodyElse } from '@/engine/systems/security';
import { paymentsOf } from '@/engine/systems/payments';
import { periodsOf } from '@/engine/systems/statements';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value. */
  states: [] as unknown[],
}));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return h.states.length === 0 ? [value, set] : [h.states.shift(), set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const { BankCard } = await import('@/ui/bank/BankCard');
const { BankStatements } = await import('@/ui/bank/BankStatements');

// ---------------------------------------------------------------------------
// Lives, clocks and the ledger
// ---------------------------------------------------------------------------

const NEW_HAVEN = 'us-ct-newhaven';
const HOUR = 3_600_000;
/** The life a new player lives: Ada Cole of New Haven, at Yale, banking at Chase unless a bank is named. */
const student = (seed: string, bankId?: string): Simulation => createSave(1, seed, {
  ...newLifeConfig(), homeRegionId: NEW_HAVEN, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...(bankId ? { bankId } : {}),
});
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** New Haven's clock, worked out here: Eastern Daylight Time (UTC−4) until 1 November 2026 and from 14 March 2027, Eastern Standard (UTC−5) between. */
const edt = (y: number, m: number, d: number, hour: number, min = 0) => Date.UTC(y, m - 1, d, hour + 4, min);
const est = (y: number, m: number, d: number, hour: number, min = 0) => Date.UTC(y, m - 1, d, hour + 5, min);

const own = (sim: Simulation, kind: Account['kind'], bankId = 'us-chase'): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && a.bankId === bankId && !a.nominal && a.category !== 'term')!;
const card = (sim: Simulation) => own(sim, 'credit_card');
const checking = (sim: Simulation) => own(sim, 'checking');
const savings = (sim: Simulation) => own(sim, 'savings');
const txns = (sim: Simulation, memo: string | RegExp, since = 0) => sim.universe.transactions
  .filter((t) => t.at >= since && (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
const on = (t: { postings: { accountId: string; amount: number }[] }, account: Account) => t.postings.filter((p) => p.accountId === account.id).reduce((n, p) => n + p.amount, 0);
const notes = (sim: Simulation, title: string, since = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= since);
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const refusal = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok).toBe(false);
  return answer.error;
};

/** TEST SETUP: purchases on the card, against a test line. */
function purchases(sim: Simulation, account: Account, amount: number, memo = 'TEST SETUP: purchases'): void {
  sim.post({ memo, category: 'shopping', postings: [{ accountId: account.id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test Setup').id, amount }] });
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP: balance', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** TEST SETUP: every current and savings account emptied. */
function emptyTheBank(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')) setBalance(sim, a, 0);
  }
}

/** A screen as the player has it: the markup, with React's text separators out. */
const render = (sim: Simulation, element: ReturnType<typeof createElement>): string => { h.sim = sim; return renderToStaticMarkup(element).replace(/<!-- -->/g, ''); };
/** What the player reads: every tag out and its entities read. */
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** The Pay Card button: its words and whether it can be pressed. */
const payButton = (html: string) => {
  const m = /<button([^>]*)>((?:Pay Card In Full|Pay What You Can) \([^)]*\))<\/button>/.exec(html);
  expect(m, 'the Pay Card button').not.toBeNull();
  return { label: m![2], disabled: /\bdisabled=""/.test(m![1]!) };
};
const cardScreen = (sim: Simulation) => render(sim, createElement(BankCard, { bankId: 'us-chase' }));

const REFUSED_MOVE = 'You’ve moved the statement day since the last statement. You can move it again once the next statement comes.';

// ---------------------------------------------------------------------------

describe('finance.pay_card', () => {
  it('paid by hand to the minimum before its due date: autopay asks nothing, so a bank emptied the minute before bounces nothing, charges no late fee and reports the month, across a save and a load; unpaid, the twin bounces, is late and pays $30', () => {
    const paid = student('g13-pay-min');
    const unpaid = student('g13-pay-min');
    for (const sim of [paid, unpaid]) {
      run(sim, 'finance.set_autopay', { mode: 'minimum' });
      purchases(sim, card(sim), 2_000_00); // TEST SETUP
      sim.advanceTo(edt(2026, 9, 20, 10));
      // The statement of 20 September: $2,000 owed, and Chase's minimum, 1% ($20) plus the month's interest ($0 in
      // the 0% introductory months), never under $40: $40.
      expect(stateOf(sim.player, card(sim)).statementBalance).toBe(2_000_00);
      expect(stateOf(sim.player, card(sim)).issued!.at(-1)!.minimum).toBe(40_00);
    }
    const before = checking(paid).balance;
    expect(run<{ paid: number }>(paid, 'finance.pay_card', { amount: 'minimum' })).toEqual({ paid: 40_00 });
    expect(checking(paid).balance).toBe(before - 40_00);
    expect(card(paid).balance).toBe(-1_960_00);
    expect(stateOf(paid.player, card(paid)).paidSinceStatement).toBe(40_00);

    const again = reload(paid);
    for (const sim of [again, unpaid]) {
      expect(sim.player.credit!.score).toBe(795);
      sim.advanceTo(edt(2026, 10, 13, 11, 59));
      emptyTheBank(sim); // TEST SETUP: only what was paid by hand stands between the card and a late fee
      // The due date, a day each month keeping Chase's 21 days after a statement on the 20th: the 13th at noon (the 11th,
      // 21 days on, until brief 21, 2026-10-22).
      sim.advanceTo(edt(2026, 10, 13, 13));
    }
    // Paid by hand: nothing asked, nothing bounced, nothing late, and the month paid as agreed, +3.
    expect(stateOf(again.player, card(again)).paidSinceStatement).toBe(40_00);
    expect(card(again).balance).toBe(-1_960_00);
    expect(txns(again, 'Late fee')).toEqual([]);
    expect(notes(again, 'A Card Payment Bounced')).toEqual([]);
    expect(notes(again, 'A Late Card Payment')).toEqual([]);
    expect(stateOf(again.player, card(again)).missed).toBe(0);
    expect(again.player.credit!.score).toBe(798);
    // Unpaid: autopay asks $40 of an empty bank; the US safe harbor's first late fee, $30, under Chase's $40, is the
    // one fee for it (Reg Z §1026.52(b)(2)(ii)); a first miss isn't reported until it's thirty days past due. Until
    // 2026-10-16 (brief 09's banking follow-up) this asserted the engine's straight apostrophe in "couldn't" (\').
    expect(notes(unpaid, 'A Card Payment Bounced').map((n) => n.body)).toEqual(['The Chase Freedom Unlimited’s autopay of $40.00 didn’t go through, because Chase Total Checking couldn’t cover it. The payment is late now, and its late fee is the only fee you’re charged for it. Move money into Chase Total Checking, then pay the card on Money, under Cards.']);
    expect(txns(unpaid, 'Late fee').map((t) => on(t, card(unpaid)))).toEqual([-30_00]);
    expect(txns(unpaid, 'Returned payment fee')).toEqual([]);
    expect(notes(unpaid, 'A Late Card Payment').map((n) => n.body)).toEqual(['The minimum payment on the Chase Freedom Unlimited, $40.00, was due October 13, 2026, and nothing was paid. That costs a $30.00 late fee. If the payment is still short at the next due date, thirty days late, it goes on your credit record and Chase suspends the card. Pay the card on Money, under Cards.']);
    expect(stateOf(unpaid.player, card(unpaid)).missed).toBe(1);
    expect(unpaid.player.credit!.score).toBe(795);
  });

  it('paid in full by hand, the statement keeps its grace period and the next charges no interest; with the minimum alone it carries, and the next charges the $62.47 that $2,000 built a day at a time at 18.46%', () => {
    const full = student('g13-pay-full');
    const minimum = student('g13-pay-full');
    for (const sim of [full, minimum]) {
      run(sim, 'finance.set_autopay', { mode: 'minimum' });
      sim.advanceTo(edt(2026, 10, 20, 10)); // past the statement of 20 October, the 0% months over
      purchases(sim, card(sim), 2_000_00); // TEST SETUP
      sim.advanceTo(est(2026, 11, 20, 10));
      expect(stateOf(sim.player, card(sim)).statementBalance).toBe(2_000_00);
    }
    const since = full.now;
    expect(run<{ paid: number }>(full, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 2_000_00 });
    for (const sim of [full, minimum]) sim.advanceTo(est(2026, 12, 13, 13)); // the due date (the 11th until brief 21, 2026-10-22)
    expect(stateOf(full.player, card(full)).carrying).toBe(false);
    expect(stateOf(minimum.player, card(minimum)).carrying).toBe(true);
    for (const sim of [full, minimum]) sim.advanceTo(est(2026, 12, 20, 10)); // the next statement
    expect(txns(full, 'Interest', since).filter((t) => on(t, card(full)) !== 0)).toEqual([]);
    expect(card(full).balance).toBe(0);
    // $2,000 from the midnight of 21 October to that of 13 December, 54 days, and $1,960 for the 7 after autopay's $40,
    // each day's interest at 18.46%/365 on what's owed with the interest before it: $62.506, charged on the statement.
    // Until brief 21 (2026-10-22) the due date was 11 December: 52 days and 9, $62.465, $62.47.
    const charged = txns(minimum, 'Interest', since).map((t) => -on(t, card(minimum)));
    expect(charged).toEqual([6_251]);
  });

  it('is refused in its own words: nothing owed, nothing to pay, nothing in the bank, no card; and a refusal moves nothing', () => {
    const sim = student('g13-pay-refused');
    const plastic = card(sim);
    expect(refusal(sim, 'finance.pay_card', { amount: 'full' })).toBe('You don’t owe anything on it.');
    expect(refusal(sim, 'finance.pay_card', { amount: 'minimum' })).toBe('You don’t owe anything on it.');
    expect(refusal(sim, 'finance.pay_card', { amount: 0 })).toBe('Enter an amount to pay.');
    purchases(sim, plastic, 500_00); // TEST SETUP
    expect(refusal(sim, 'finance.pay_card', { amount: -5_00 })).toBe('Enter an amount to pay.');
    // Bought since the last statement, nothing is yet due: the minimum is the statement's, and it asks nothing.
    expect(refusal(sim, 'finance.pay_card', { amount: 'minimum' })).toBe('Enter an amount to pay.');
    expect(refusal(sim, 'finance.pay_card', { amount: 'full', accountId: checking(sim).id })).toBe('You don’t have a card.');
    emptyTheBank(sim); // TEST SETUP
    expect(refusal(sim, 'finance.pay_card', { amount: 'full' })).toBe('Your bank accounts have nothing available to pay it with, so nothing was paid.');
    expect(plastic.balance).toBe(-500_00);
    expect(stateOf(sim.player, plastic).paidSinceStatement).toBe(0);
    expect(txns(sim, /^Paid /)).toEqual([]);
  });

  it('paid by hand, it draws the savings at the primary account’s bank though the link is off, and from the card’s own bank holds nothing back', () => {
    const sim = student('g13-pay-savings');
    expect(paymentsOf(sim.player).linkSavings).toBe(false);
    purchases(sim, card(sim), 2_000_00); // TEST SETUP
    setBalance(sim, checking(sim), 100_00); // TEST SETUP
    const saved = savings(sim).balance;
    expect(run<{ paid: number }>(sim, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 2_000_00 });
    const [payment] = txns(sim, 'Paid Chase Freedom Unlimited');
    expect([on(payment!, card(sim)), on(payment!, checking(sim)), on(payment!, savings(sim))]).toEqual([2_000_00, -100_00, -1_900_00]);
    expect(savings(sim).balance).toBe(saved - 1_900_00);
    expect(stateOf(sim.player, card(sim)).paymentHolds).toBeUndefined();
    expect(cardRoom(sim.player, card(sim))).toBe(65_217_00);
  });

  it('paid by hand, a US card takes the minimum to the cheapest balance and the rest to the dearest: $540 clears a cash advance at 28.49%, and the next statement charges it no interest; the $40 minimum alone leaves it to draw', () => {
    const most = student('g13-pay-alloc');
    const least = student('g13-pay-alloc');
    for (const sim of [most, least]) {
      // Cash from the card, through the command the Cash panel runs: $200, and Chase's fee, 5% or $10, $10.
      expect(run(sim, 'cash.withdraw', { amount: 200_00, from: 'card' })).toEqual({ fee: 10_00 });
      purchases(sim, card(sim), 1_000_00); // TEST SETUP
      sim.advanceTo(edt(2026, 9, 20, 10));
      // The cash drew 28.49% from its first midnight, a day at a time, no grace: $200 for 27 midnights, $4.26.
      expect(stateOf(sim.player, card(sim)).cashOwed).toBe(204_26);
      expect(stateOf(sim.player, card(sim)).issued!.at(-1)!.minimum).toBe(40_00);
    }
    expect(run(most, 'finance.pay_card', { amount: 540_00 })).toEqual({ paid: 540_00 });
    expect(run(least, 'finance.pay_card', { amount: 'minimum' })).toEqual({ paid: 40_00 });
    // The $40 minimum to the purchases at 0% (Reg Z §1026.53), the $500 over it to the cash first.
    expect(stateOf(most.player, card(most)).cashOwed).toBe(0);
    expect(stateOf(least.player, card(least)).cashOwed).toBe(204_26);
    for (const sim of [most, least]) sim.advanceTo(edt(2026, 10, 20, 10));
    // Autopay took the rest of each statement on 13 October; until then the cash left drew: $204.26 for 23 midnights,
    // $3.70 (on 11 October, 21 midnights and $3.37, until brief 21, 2026-10-22, when the due date became Chase's 13th).
    expect(txns(most, 'Cash advance interest', edt(2026, 9, 21, 0))).toEqual([]);
    expect(txns(least, 'Cash advance interest', edt(2026, 9, 21, 0)).map((t) => -on(t, card(least)))).toEqual([3_70]);
  });

  it('paid from Capital One, made primary, the credit it frees is held for Chase’s 15 days, across a save and a load, and Left To Spend says so; then given back', () => {
    const sim = student('g13-pay-hold');
    const capitalOne = sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId]!;
    const moved = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: checking(sim).id, toId: capitalOne.id, amount: 3_000_00 });
    sim.advanceTo(moved.arrivesAt + HOUR);
    expect(capitalOne.balance).toBe(3_000_00);
    run(sim, 'bank.set_primary', { accountId: capitalOne.id });
    purchases(sim, card(sim), 2_000_00); // TEST SETUP
    const paidAt = sim.now;
    expect(run<{ paid: number }>(sim, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 2_000_00 });
    expect(capitalOne.balance).toBe(1_000_00);
    expect(card(sim).balance).toBe(0);
    expect(stateOf(sim.player, card(sim)).paymentHolds).toEqual([{ amount: 2_000_00, until: paidAt + 15 * MS_DAY }]);
    expect(cardRoom(sim.player, card(sim))).toBe(63_217_00);
    const screen = words(cardScreen(sim));
    expect(screen).toContain('Left To Spend $63,217 Of a $65,217 limit');
    // Fifteen days on, on New Haven's calendar (EDT, UTC−4), written out here.
    const until = new Date(paidAt + 15 * MS_DAY - 4 * HOUR);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    expect(screen).toContain(`$2,000 of the credit your payment freed up is on hold until ${months[until.getUTCMonth()]} ${until.getUTCDate()}, 2026, while the payment clears from another bank. After you make a payment, it can take Chase up to 15 days`);

    // Capital One's own debit card is still on its way, so the days' groceries meanwhile go on this card: Left To
    // Spend is the limit less what's owed, less the $2,000 held while it's held.
    const again = reload(sim);
    again.advanceTo(paidAt + 14 * MS_DAY);
    expect(card(again).balance).toBeLessThan(0);
    expect(cardRoom(again.player, card(again))).toBe(65_217_00 + card(again).balance - 2_000_00);
    again.advanceTo(paidAt + 16 * MS_DAY);
    expect(stateOf(again.player, card(again)).paymentHolds).toBeUndefined();
    expect(cardRoom(again.player, card(again))).toBe(65_217_00 + card(again).balance);
  });

  it('on the bank’s screen: the button says what can be paid, pays it, and can’t be pressed with nothing to pay', () => {
    const sim = student('g13-pay-screen');
    expect(payButton(cardScreen(sim))).toEqual({ label: 'Pay Card In Full ($0)', disabled: true });
    purchases(sim, card(sim), 2_000_00); // TEST SETUP
    expect(payButton(cardScreen(sim))).toEqual({ label: 'Pay Card In Full ($2,000)', disabled: false });
    expect(words(cardScreen(sim))).toContain('Owed $2,000');
    setBalance(sim, checking(sim), 100_00); // TEST SETUP
    setBalance(sim, savings(sim), 0); // TEST SETUP
    expect(payButton(cardScreen(sim))).toEqual({ label: 'Pay What You Can ($100)', disabled: false });
    // What the button runs (BankCard.tsx: finance.pay_card, the whole of it, this card).
    expect(run<{ paid: number }>(sim, 'finance.pay_card', { amount: 'full', accountId: card(sim).id })).toEqual({ paid: 100_00 });
    expect(words(cardScreen(sim))).toContain('Owed $1,900');
    expect(payButton(cardScreen(sim))).toEqual({ label: 'Pay What You Can ($0)', disabled: true });
  });
});

describe('bank.fraud_refund', () => {
  /** TEST SETUP: somebody else's $300 on the card, as the day's draw would make it; then reported through the command. */
  const usedAndReported = (sim: Simulation) => {
    somebodyElse(sim, sim.player, { which: 'credit', account: card(sim), amount: 300_00, stopped: false });
    expect(card(sim).balance).toBe(-300_00);
    const answer = run<{ carried: number; refundAt: number }>(sim, 'card.dispute', { index: 0 });
    // Reg Z §1026.12(b): a card's holder carries $50 at most. Ten business days in Connecticut from Monday 24 August,
    // Labor Day not one of them: Tuesday 8 September, at the hour it was reported.
    expect(answer).toEqual({ carried: 50_00, refundAt: edt(2026, 9, 8, 7, 30) });
    return answer.refundAt;
  };

  it('due to a card closed since, goes once into the current account at its bank, across a save and a load, and the notice says where', () => {
    const sim = student('g13-refund-closed');
    const refundAt = usedAndReported(sim);
    expect(run<{ paid: number }>(sim, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 300_00 });
    expect(run(sim, 'card.close', {})).toEqual({ closing: true });
    const closed = card(sim);
    expect(closed.closedAt).toBe(sim.now);
    const again = reload(sim);
    again.advanceTo(refundAt + 3 * MS_DAY);
    const plastic = again.universe.accounts[closed.id]!;
    const refunds = txns(again, 'Refund: a payment you didn’t make');
    expect(refunds.map((t) => [t.at, on(t, checking(again)), on(t, plastic)])).toEqual([[refundAt, 250_00, 0]]);
    expect(plastic.balance).toBe(0);
    expect(notes(again, 'Refunded').map((n) => n.body)).toEqual(['$250.00 back for the payment you didn’t make, into your Chase Total Checking, since the Chase Freedom Unlimited is closed. The law leaves you to pay $50.00 of it.']);
    expect(refusal(again, 'card.refund_credit', { accountId: closed.id })).toBe('The card holds no credit to send back.');
  });

  it('due to a second bank’s current account closed since, goes into the primary account, and says so', () => {
    const sim = student('g13-refund-debit');
    const opened = run<{ accountId: string; arrivesAt: number }>(sim, 'bank.open_current', { bankId: 'us-capital-one', fundFrom: checking(sim).id, amount: 500_00 });
    sim.advanceTo(opened.arrivesAt + HOUR);
    const capitalOne = sim.universe.accounts[opened.accountId]!;
    expect(capitalOne.balance).toBe(500_00);
    // TEST SETUP: somebody else's $300 on its debit card, as the day's draw would make it.
    somebodyElse(sim, sim.player, { which: 'debit', account: capitalOne, amount: 300_00, stopped: false });
    const { carried, refundAt } = run<{ carried: number; refundAt: number }>(sim, 'card.dispute', { index: 0 });
    // Regulation E: reported within two business days of learning of it, $50 at most.
    expect(carried).toBe(50_00);
    // The closing the review found nothing refuses with a refund pending: the $200 left goes back to Chase.
    run(sim, 'bank.close_current', { accountId: capitalOne.id, remainderTo: checking(sim).id });
    expect(capitalOne.closedAt).toBe(sim.now);
    sim.advanceTo(refundAt + HOUR);
    expect(txns(sim, 'Refund: a payment you didn’t make').map((t) => [t.at, on(t, checking(sim)), on(t, capitalOne)])).toEqual([[refundAt, 250_00, 0]]);
    expect(capitalOne.balance).toBe(0);
    expect(notes(sim, 'Refunded').map((n) => n.body)).toEqual(['$250.00 back for the payment you didn’t make, into your Chase Total Checking, since the 360 Checking is closed. The law leaves you to pay $50.00 of it.']);
  });

  it('due to the open card it was used on, goes onto the card, which then owes the $50 the law leaves, and its statement asks that', () => {
    const sim = student('g13-refund-open');
    const refundAt = usedAndReported(sim);
    sim.advanceTo(refundAt + HOUR);
    expect(txns(sim, 'Refund: a payment you didn’t make').map((t) => on(t, card(sim)))).toEqual([250_00]);
    expect(card(sim).balance).toBe(-50_00);
    expect(notes(sim, 'Refunded').map((n) => n.body)).toEqual(['$250.00 back for the payment you didn’t make. The law leaves you to pay $50.00 of it.']);
    sim.advanceTo(edt(2026, 9, 20, 10));
    expect(stateOf(sim.player, card(sim)).statementBalance).toBe(50_00);
  });
});

describe('bank.scheduled_payment', () => {
  it('from a current account Chase closed for sixty days overdrawn doesn’t go, and says so: nothing leaves it, nothing is in transit; the twin never overdrawn sends it', () => {
    const closing = student('g13-sched-closed');
    const kept = student('g13-sched-closed');
    const at = est(2026, 11, 2, 10);
    for (const sim of [closing, kept]) {
      // Funded from Chase, since Capital One closes an account not funded within 60 days.
      const capitalOne = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one', fundFrom: checking(sim).id, amount: 100_00 }).accountId;
      run(sim, 'bank.schedule_payment', { fromId: checking(sim).id, toId: capitalOne, amount: 500_00, at });
    }
    const chase = checking(closing);
    const chaseSavings = savings(closing);
    setBalance(closing, chaseSavings, 0); // TEST SETUP: nothing at Chase to set off against what's owed
    setBalance(closing, chase, -5_000_00); // TEST SETUP: overdrawn, as a bill it couldn't cover would leave it
    closing.advanceTo(edt(2026, 10, 30, 12));
    expect(chase.closedAt).toBeDefined();
    expect(notes(closing, 'Chase Closed Your Account')).toHaveLength(1);
    const again = reload(closing);
    again.advanceTo(at + 3 * MS_DAY);
    const closedChase = again.universe.accounts[chase.id]!;
    // A send between banks goes out under "To Capital One: 360 Checking" (in transit) or "To 360 Checking at Capital One".
    const sent = (sim: Simulation) => txns(sim, /^To (Capital One: 360 Checking|360 Checking at Capital One)$/, at - HOUR);
    expect(notes(again, 'A Scheduled Payment Didn’t Go').map((n) => n.body)).toEqual(['Your $500.00 payment to 360 Checking didn’t go through, because Chase Total Checking is closed.']);
    expect(again.universe.transactions.filter((t) => t.at > closedChase.closedAt! && on(t, closedChase) !== 0)).toEqual([]);
    expect(sent(again)).toEqual([]);
    // The twin: $500 out of Chase on the day, into Capital One in Chase's days.
    kept.advanceTo(at - HOUR);
    const keptCapitalOne = own(kept, 'checking', 'us-capital-one');
    const held = keptCapitalOne.balance;
    kept.advanceTo(at + 7 * MS_DAY);
    expect(sent(kept).map((t) => [t.at, on(t, checking(kept))])).toEqual([[at, -500_00]]);
    expect(keptCapitalOne.closedAt).toBeUndefined();
    expect(keptCapitalOne.balance - held).toBe(500_00);
    expect(notes(kept, 'A Scheduled Payment Didn’t Go')).toEqual([]);
  });

  it('from RBC savings (a Toronto life: no US bank in SLATE charges for a savings withdrawal): the month’s first goes free, the next costs $2.00, and one past what the savings lets out after the fee isn’t made', () => {
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ca-rbc' }, 'g13-rbc');
    const saver = own(sim, 'savings', 'ca-rbc');
    const current = own(sim, 'checking', 'ca-rbc');
    expect(saver.name).toBe('RBC High Interest eSavings');
    const start = saver.balance;
    const day = (d: number) => est(2026, 1, d, 10);
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 100_00, at: day(7) });
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 100_00, at: day(8) });
    sim.advanceTo(day(8) + HOUR);
    const fees = txns(sim, 'Savings withdrawal fee: RBC High Interest eSavings');
    expect(fees.map((t) => [t.at, on(t, saver)])).toEqual([[day(8), -2_00]]);
    expect(txns(sim, 'Scheduled payment to RBC Signature No Limit Banking').map((t) => [on(t, saver), on(t, current)])).toEqual([[-100_00, 100_00], [-100_00, 100_00]]);
    expect(saver.balance).toBe(start - 202_00);
    // All of it, less nothing for the fee: not made. All of it less the $2.00: made, and the fee with it.
    const all = saver.balance;
    expect(all).toBe(62_341_00);
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 62_341_00, at: day(9) });
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 62_339_00, at: day(10) });
    sim.advanceTo(day(10) + HOUR);
    expect(notes(sim, 'A Scheduled Payment Didn’t Go').map((n) => n.body)).toEqual(['Your C$62,341.00 payment to RBC Signature No Limit Banking didn’t go through: there wasn’t enough available in RBC High Interest eSavings that day. You can set it up again under How You Pay.']);
    expect(txns(sim, 'Savings withdrawal fee: RBC High Interest eSavings').map((t) => t.at)).toEqual([day(8), day(10)]);
    expect(saver.balance).toBe(0);
  });

  it('from Deutsche Bank savings (a Berlin life: German law’s allowance), €2,000 a month goes without notice and no more', () => {
    const sim = quickSave({ homeRegionId: 'de-be-berlin', startLocationId: 'de-be-berlin', livesWhereBorn: true, wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'g13-de');
    const current = own(sim, 'checking', 'de-deutsche-bank');
    const saver = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings' && a.bankId === 'de-deutsche-bank' && a.category !== 'term')
      ?? sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_savings', {}).accountId]!;
    run(sim, 'bank.transfer', { fromId: current.id, toId: saver.id, amount: 5_000_00 });
    const held = saver.balance;
    const day = (d: number) => Date.UTC(2026, 0, d, 9); // 10 AM in Berlin, on Central European Time (UTC+1)
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 2_500_00, at: day(7) });
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 2_000_00, at: day(8) });
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: current.id, amount: 1_00, at: day(9) });
    sim.advanceTo(day(9) + HOUR);
    expect(saver.balance).toBe(held - 2_000_00);
    expect(txns(sim, /^Scheduled payment to /).map((t) => [t.at, on(t, saver), on(t, current)])).toEqual([[day(8), -2_000_00, 2_000_00]]);
    expect(notes(sim, 'A Scheduled Payment Didn’t Go').map((n) => n.body)).toEqual([
      `Your €2,500.00 payment to ${current.name} didn’t go through: there wasn’t enough available in ${saver.name} that day. You can set it up again under How You Pay.`,
      `Your €1.00 payment to ${current.name} didn’t go through: there wasn’t enough available in ${saver.name} that day. You can set it up again under How You Pay.`,
    ]);
  });
});

describe('card.replaced', () => {
  it('reported lost and then moved to a new number, the debit card arrives once, unlocked, across a save and a load', () => {
    const sim = student('g13-replaced', 'us-bank-of-america');
    const current = own(sim, 'checking', 'us-bank-of-america');
    run(sim, 'card.lock', { which: 'debit', locked: true });
    run(sim, 'card.report', { which: 'debit', why: 'lost' });
    const last4 = current.plastic!.last4;
    run(sim, 'bank.new_number', {});
    expect(sim.universe.scheduled.filter((i) => i.kind === REPLACED_KIND && i.status === 'pending' && i.payload.accountId === current.id)).toHaveLength(2);
    expect(refusal(sim, 'card.report', { which: 'debit', why: 'lost' })).toBe('That card is already stopped, and a new one is on its way.');
    const again = reload(sim);
    const arrives = Math.max(...again.universe.scheduled.filter((i) => i.kind === REPLACED_KIND && i.status === 'pending').map((i) => i.at));
    again.advanceTo(arrives + 2 * MS_DAY);
    const plastic = again.universe.accounts[current.id]!.plastic!;
    // The next number along, 3,571 on for a second card: one card, one new number.
    const next = String((Number(last4) + 3_571) % 10_000).padStart(4, '0');
    expect(plastic).toMatchObject({ last4: next, issued: 2 });
    expect(plastic.stopped).toBeUndefined();
    expect(plastic.locked).toBeUndefined();
    expect(plastic.replacementAt).toBeUndefined();
    expect(notes(again, 'Your New Card Arrived').map((n) => n.body)).toEqual([`The new card ends in ${next}, and you can use it now.`]);
    expect(run(again, 'card.lock', { which: 'debit', locked: true })).toEqual({ locked: true });
  });

  it('while it’s on its way the day’s groceries go on the credit card, and once it arrives they come out of the current account again', () => {
    const sim = student('g13-groceries');
    const { arrivesAt } = run<{ arrivesAt: number }>(sim, 'card.report', { which: 'debit', why: 'stolen' });
    const groceries = (from: number, to: number) => txns(sim, 'Groceries', from).filter((t) => t.at < to);
    sim.advanceTo(edt(2026, 8, 25, 1));
    const stopped = groceries(edt(2026, 8, 25, 0), edt(2026, 8, 25, 1));
    expect(stopped).toHaveLength(1);
    expect(on(stopped[0]!, checking(sim))).toBe(0);
    expect(on(stopped[0]!, card(sim))).toBeLessThan(0);
    sim.advanceTo(arrivesAt + MS_DAY);
    const after = groceries(arrivesAt, sim.now);
    expect(after).toHaveLength(1);
    expect(on(after[0]!, card(sim))).toBe(0);
    expect(on(after[0]!, checking(sim))).toBe(on(stopped[0]!, card(sim)));
    expect(notes(sim, 'Your New Card Arrived')).toHaveLength(1);
  });
});

describe('card.statement', () => {
  it('raises a clean record’s limit by a fifth at the first statement 182 days on, and says so; a holder who said never keeps it', () => {
    const raised = student('g13-raise');
    const never = student('g13-raise');
    run(never, 'card.set_auto_raise', { on: false });
    for (const sim of [raised, never]) {
      expect(card(sim).creditLimit).toBe(65_217_00);
      // The statement of 20 February is 180 days after the review that opened the record, short of 182.
      sim.advanceTo(est(2027, 2, 20, 10));
      expect(card(sim).creditLimit).toBe(65_217_00);
    }
    const again = reload(raised);
    for (const sim of [again, never]) sim.advanceTo(edt(2027, 3, 20, 10));
    // $65,217 and a fifth, $78,260.40, to the dollar.
    expect(card(again).creditLimit).toBe(78_260_00);
    expect(cardRoom(again.player, card(again))).toBe(78_260_00);
    expect(notes(again, 'Your Card Limit Went Up').map((n) => n.body)).toEqual(['The Chase Freedom Unlimited’s limit is $78,260.00 now, because your credit score is 700 or more, you haven’t paid late in the past year, and your income or savings cover the payments on it.']); // Until 2026-10-16 (brief 09's banking follow-up) this asserted 'It\'s …', with the notice's straight apostrophe; until 2026-10-21 (brief 20's D2) it said nothing of the income or savings, which the review didn't read. A wealthy start's savings cover the new limit.
    expect(card(never).creditLimit).toBe(65_217_00);
    expect(notes(never, 'Your Card Limit Went Up')).toEqual([]);
  });

  it('charges the yearly fee once in its month, though a day moved from the 1st to the 28th gives October two statements (Dublin, Bank of Ireland: no US card in SLATE has a yearly fee)', () => {
    // The life starts 20 November 2025; its card opened 400 days before, 16 October 2024, so October is its month.
    const sim = quickSave({ homeRegionId: 'ie-lei-dublin', startLocationId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ie-bank-of-ireland', startYear: 2025, startMonth: 11, startDay: 20 }, 'g13-dublin');
    const plastic = own(sim, 'credit_card', 'ie-bank-of-ireland');
    expect(plastic.name).toBe('Bank of Ireland Classic Credit Card');
    run(sim, 'card.set_statement_day', { day: 1 });
    sim.advanceTo(Date.UTC(2026, 9, 1, 12));
    run(sim, 'card.set_statement_day', { day: 28 });
    const again = reload(sim);
    again.advanceTo(Date.UTC(2026, 10, 2, 12));
    // 9 AM on 1 October, Irish Summer Time (08:00 UTC); 9 AM on 28 October, after the clocks went back (09:00 UTC).
    const cuts = stateOf(again.player, again.universe.accounts[plastic.id]!).cuts!.filter((c) => c >= Date.UTC(2026, 9, 1));
    expect(cuts).toEqual([Date.UTC(2026, 9, 1, 8), Date.UTC(2026, 9, 28, 9)]);
    const fees = txns(again, 'Yearly fee: Bank of Ireland Classic Credit Card');
    expect(fees.map((t) => [t.at, on(t, again.universe.accounts[plastic.id]!)])).toEqual([[Date.UTC(2026, 9, 1, 8), -30_00]]);
  });
});

describe('credit score', () => {
  // Until 2026-10-13 the title said the score "moves as a twin's": the mover had 3 statements to the twin's 4, and the
  // two scores are equal at day 125, when each has passed 3 due dates, not at every day (found by that day's check).
  it('asked to move the statement day every morning, it moves once a cycle: the statements, their due dates, their interest and their reports still come, and at day 125 the score has gained nothing on a twin’s who never moved it', () => {
    const mover = student('g13-farm');
    const still = student('g13-farm');
    for (const sim of [mover, still]) {
      run(sim, 'finance.set_autopay', { mode: 'minimum' });
      purchases(sim, card(sim), 500_00); // TEST SETUP
    }
    const moved: number[] = [];
    for (let d = 0; d < 125; d += 1) {
      const answer = mover.execute({ kind: 'card.set_statement_day', payload: { day: ((d + 3) % 28) + 1 } });
      if (answer.ok) moved.push(d); else expect(answer.error).toBe(REFUSED_MOVE);
      mover.advanceBy(MS_DAY);
    }
    still.advanceBy(125 * MS_DAY);
    // Moved on 24 August to the 4th; on 5 September, after it, to the 16th, a full 27 days on from the 4th; on
    // 17 October to the 2nd, 27 days on from the 16th falling in November; on 3 December to the 21st.
    expect(moved).toEqual([0, 12, 54, 101]);
    const cutsOf = (sim: Simulation) => stateOf(sim.player, card(sim)).cuts!;
    expect(cutsOf(mover)).toEqual([edt(2026, 9, 4, 9), edt(2026, 10, 16, 9), est(2026, 12, 2, 9)]);
    expect(cutsOf(still)).toEqual([edt(2026, 9, 20, 9), edt(2026, 10, 20, 9), est(2026, 11, 20, 9), est(2026, 12, 20, 9)]);
    // Interest: none in the 0% months; on 2 December, $460 for the 20 midnights to 9 November, the due date that keeps
    // Chase's 21 days after the 16th, and $420 for the 23 after it, a day at a time at 18.46%: $9.64.
    expect(txns(mover, 'Interest').map((t) => [t.at, -on(t, card(mover))])).toEqual([[est(2026, 12, 2, 9), 964]]);
    // The twin, due the 13th: $460 for 24 midnights and $420 for 7, $7.13 on 20 November; $427.13 for 23 and $387.13 for
    // 7, $6.39. Until brief 21 (2026-10-22) a due date was 21 days on, 6 November for the mover and the 10th and 11th for
    // the twin: $9.58, $7.06 and $6.34.
    expect(txns(still, 'Interest').map((t) => [t.at, -on(t, card(still))])).toEqual([[est(2026, 11, 20, 9), 7_13], [est(2026, 12, 20, 9), 6_39]]);
    // Three due dates passed for each, each paid as agreed: 795 and three times 3.
    expect(mover.player.credit!.score).toBe(804);
    expect(still.player.credit!.score).toBe(804);
  });

  it('a mark seven years old leaves the record at the month’s end on the clock and gives 25 back, which an application then reads and the card’s screen reprices; one not yet seven years old waits for its own month’s end', () => {
    const year = 365.2425 * MS_DAY;
    const leaving = student('g13-mark');
    const staying = student('g13-mark');
    // TEST SETUP: a record of 600 with a 100-point mark on it from seven years ago, less a day and less thirty days.
    leaving.player.credit!.score = 600;
    leaving.player.credit!.marks = [{ at: leaving.now - 7 * year + MS_DAY, points: 100, country: 'us' }];
    staying.player.credit!.score = 600;
    staying.player.credit!.marks = [{ at: staying.now - 7 * year + 30 * MS_DAY, points: 100, country: 'us' }];
    // Chase prices within 18.24% and 27.74% between a record of 800 and one of 580: 600 is 200/220 up it, 26.88%.
    expect(words(cardScreen(leaving))).toContain('With your record today, a new card would get 26.88%.');
    const again = reload(leaving);
    for (const sim of [again, staying]) sim.advanceTo(edt(2026, 9, 1, 8)); // past the month's end, 31 August at 11 PM
    expect(again.player.credit!.marks).toEqual([]);
    expect(again.player.credit!.score).toBe(625);
    expect(staying.player.credit!.marks).toHaveLength(1);
    expect(staying.player.credit!.score).toBe(600);
    // 625 is 175/220 up the range: 25.80%.
    expect(words(cardScreen(again))).toContain('With your record today, a new card would get 25.8%.');
    // Citi's card, each applying: five points for the inquiry, and approved from 620.
    expect(run(again, 'card.apply', { bankId: 'us-citi' })).toEqual({ approved: true, limit: 1_000_00 });
    expect(notes(again, 'Card Approved').map((n) => n.body)).toEqual(['Citi approved a card with a $1,000.00 limit. It arrives in a week.']);
    expect(run(staying, 'card.apply', { bankId: 'us-citi' })).toEqual({ approved: false });
    expect(notes(staying, 'Card Application Declined').map((n) => n.body)).toEqual(['Citi turned down your application because your credit score is below 620, the lowest it approves. Applying still took a few points off your credit score.']);
    // The waiting mark goes at the end of September: 595, +3 for September's statement owing nothing, +25.
    staying.advanceTo(edt(2026, 10, 1, 8));
    expect(staying.player.credit!.marks).toEqual([]);
    expect(staying.player.credit!.score).toBe(623);
  });

  it('reads what’s used of the limit at the due date: 80% of it costs ten points of the month’s three, 20% costs none', () => {
    const heavy = student('g13-used');
    const light = student('g13-used');
    run(heavy, 'finance.set_autopay', { mode: 'minimum' });
    run(light, 'finance.set_autopay', { mode: 'minimum' });
    purchases(heavy, card(heavy), 52_173_60); // TEST SETUP: 80% of the $65,217 limit
    purchases(light, card(light), 13_043_40); // TEST SETUP: 20% of it
    for (const sim of [heavy, light]) sim.advanceTo(edt(2026, 10, 13, 13)); // past the first due date (the 11th until brief 21, 2026-10-22)
    // Autopay's minimum, 1%, leaves $51,651.86 owed, 79.2% of the limit: 49.2 points over 30%, a point a 5%, 10 off the
    // month's 3. The light twin's $12,912.97 is 19.8%, under 30%: the month's 3 whole.
    expect(card(heavy).balance).toBe(-51_651_86);
    expect(heavy.player.credit!.score).toBe(788);
    expect(card(light).balance).toBe(-12_912_97);
    expect(light.player.credit!.score).toBe(798);
  });

  it('with no card open, the record ages back 2 a month on the 1st, to 680 and no further, and not at all with a payment late in the year', () => {
    const clean = student('g13-no-card');
    const late = student('g13-no-card');
    for (const sim of [clean, late]) {
      expect(run(sim, 'card.close', {})).toEqual({ closing: true }); // owing nothing, it closes at once
      sim.player.credit!.score = 676; // TEST SETUP: the record, as the input
    }
    late.player.credit!.late = [late.now - 200 * MS_DAY]; // TEST SETUP: a payment late 200 days ago
    const again = reload(clean);
    for (const sim of [again, late]) sim.advanceTo(edt(2026, 9, 1, 8));
    expect([again.player.credit!.score, late.player.credit!.score]).toEqual([678, 676]);
    for (const sim of [again, late]) sim.advanceTo(est(2026, 11, 1, 8));
    expect([again.player.credit!.score, late.player.credit!.score]).toEqual([680, 676]);
  });

  it('prices a Citi loan by the record: 12.10% at 735, and 12.30% once a card application has taken its five points', () => {
    const plain = student('g13-loan');
    const applied = student('g13-loan');
    for (const sim of [plain, applied]) {
      sim.advanceBy(30 * MS_DAY); // a month of work-study wages paid in, which the bank lends against
      sim.player.credit!.score = 735; // TEST SETUP: the record, as the input
    }
    run(applied, 'card.apply', { bankId: 'us-bank-of-america' });
    expect(applied.player.credit!.score).toBe(730);
    // Citi's 10.24% to 18.49%, the bottom at 780 and the top at 580: 735 is 45/200 up it, 730 is 50/200.
    // $2,000 over 24 months: r = APR/12, r·P/(1−(1+r)^−24), rounded up to the cent.
    expect(run(plain, 'bank.borrow', { amount: 2_000_00, months: 24, bankId: 'us-citi' })).toMatchObject({ apr: 0.121, payment: 94_25 });
    expect(run(applied, 'bank.borrow', { amount: 2_000_00, months: 24, bankId: 'us-citi' })).toMatchObject({ apr: 0.123, payment: 94_43 });
  });
});

describe('statements', () => {
  /** The Statements screen, with the account and the period chosen (TEST SETUP: the selects' state). */
  const statementsScreen = (sim: Simulation, accountId: string, period: number) => { h.states = [accountId, period]; return render(sim, createElement(BankStatements)); };
  const options = (html: string, id: string) => {
    const select = new RegExp(`<select id="${id}"[^>]*>(.*?)</select>`).exec(html)![1]!;
    return [...select.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1]!.replace(/&#x27;/g, '\''));
  };

  it('shows a card’s kept cuts as its periods, a transition cycle’s charge under one statement, the minimum and the minimum-only warning, as the player has it', () => {
    const sim = student('g13-statements');
    run(sim, 'finance.set_autopay', { mode: 'minimum' });
    sim.advanceTo(edt(2026, 10, 20, 10));
    purchases(sim, card(sim), 2_000_00); // TEST SETUP
    sim.advanceTo(est(2026, 11, 20, 10));
    run(sim, 'card.set_statement_day', { day: 5 });
    sim.advanceTo(est(2026, 12, 1, 10));
    purchases(sim, card(sim), 100_00, 'TEST SETUP: in the transition'); // TEST SETUP
    sim.advanceTo(est(2027, 1, 5, 10));
    const id = card(sim).id;
    const first = statementsScreen(sim, id, 0);
    expect(options(first, 'statement-period').slice(0, 4)).toEqual([
      'Statement Of February 5, 2027, So Far', 'Statement Of January 5, 2027', 'Statement Of November 20, 2026', 'Statement Of October 20, 2026',
    ]);
    // The transition charge, under the statement of 5 January and no other.
    const shown = periodsOf(sim, card(sim)).map((_, i) => words(statementsScreen(sim, id, i)));
    expect(shown.map((one) => one.includes('TEST SETUP: in the transition'))).toEqual(shown.map((_, i) => i === 1));
    // The statement of 20 November: $2,000 spent, Chase's $40 minimum due the 13th (21 days on, the 11th, until brief 21,
    // 2026-10-22), and Reg Z's warning, worked by hand
    // at 18.46% with 1% plus the month's interest never under $40: 85 months and $3,507.30; $72.77 a month for three years.
    const november = shown[2]!;
    expect(november).toContain('Brought Forward $0.00');
    expect(november).toContain('Spending $2,000.00');
    expect(november).toContain('New Balance $2,000.00');
    expect(november).toContain('The minimum payment is $40.00, due December 13, 2026. Pay the whole $2,000.00, and none of it is charged interest.');
    expect(november).toContain('Paying only the minimum, and spending nothing more, takes 7 years and a month and $3,507.30 in all. $72.77 a month pays it off in three years, $2,619.72 in all.');
    expect(november).toContain('TEST SETUP: purchases');
    expect(november).toContain('Charged / Paid Owed After');
    expect(november).not.toContain('Rebuilt:');
    // Before the first statement kept, 20 September 2026, the card's months are drawn back to its opening, and said so.
    const august = periodsOf(sim, card(sim)).findIndex((p) => p.label === 'Statement Of August 20, 2026 (Rebuilt)');
    expect(august).toBeGreaterThan(4);
    expect(shown[august]).toContain('Rebuilt: this statement is from before the game kept card statements');
  });

  it('ends a current account’s last period at its closing, and says so', () => {
    const sim = student('g13-closed-current');
    const opened = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    sim.advanceBy(2 * MS_DAY);
    run(sim, 'bank.close_current', { accountId: opened });
    const closedAt = sim.universe.accounts[opened]!.closedAt!;
    expect(periodsOf(sim, sim.universe.accounts[opened]!)[0]!.to).toBe(closedAt);
    const html = statementsScreen(sim, opened, 0);
    expect(options(html, 'statement-account').at(-1)).toMatch(/^360 Checking ···\d{4}, Capital One \(Closed\)$/);
    expect(options(html, 'statement-period')).toEqual(['August 2026, Until It Closed']);
  });

  it('ends a closed card’s last period at its closing, as the row says a closed account’s does, not So Far', () => {
    const sim = student('g13-closed-card');
    sim.advanceTo(edt(2026, 9, 20, 10)); // a statement cut and kept
    run(sim, 'card.close', {});
    const plastic = card(sim);
    expect(plastic.closedAt).toBe(sim.now);
    sim.advanceTo(edt(2026, 10, 25, 10));
    const [last] = periodsOf(sim, plastic);
    expect(last!.to).toBe(plastic.closedAt);
    expect(last!.label).toMatch(/, Until It Closed$/);
    expect(options(statementsScreen(sim, plastic.id, 0), 'statement-period')[0]).not.toMatch(/So Far/);
  });
});
