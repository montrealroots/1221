/**
 * Evidence for seven money rows the review of 2026-10-13 left partial (verification group g12-money): the card in the
 * hand reported, a hardship plan, a different limit, the everyday card, going over the limit, and cash paid in and
 * taken out. Each row's gaps are closed here through the command a player sends from the Bank screen, or the clock that
 * carries the card's statement, its due date and each morning's groceries, and each consequence is read where the row
 * says it is read, against figures worked out here from the rule's own numbers and the bank's published terms, never
 * asked of the helper the engine works them out with.
 *
 * - card.report: Chase's debit card reported lost is stopped for nothing (Chase lists a new one free) and the new one,
 *   with a new number, comes on the seventh business day, Wednesday 2 September. While it's stopped the meal and each
 *   morning's groceries go on the credit card and checking isn't touched, the machine refuses in the stopped card's
 *   words and the counter pays, and with the credit card locked too the meal is refused in `spendRefusal`'s. A second
 *   report is refused and sends nothing twice; the stopped card and its one replacement hold through a save and a
 *   load, and it arrives once. A rush is Chase's $15 out of checking and two business days; a Wells Fargo card is
 *   refused the rush, its fee unpublished (from the third round of 2026-10-13: for a while that day it was rushed free,
 *   its research’s day read as a rush with no fee), and comes in Wells Fargo’s five business days, Labor Day not one. Your Cards, rendered, offers both reports with the fee line, and Report It pressed stops the card.
 * - card.request_hardship: on the life's own Chase card, refused a card owing nothing and a holder whose bank could
 *   clear it; then $4,800 over forty-eight months, $100, and the card takes nothing: the meal goes to checking, and
 *   behind a locked debit card it isn't bought. Autopay set to the minimum asks the plan's $100 at the due date, not
 *   the card's $48, and it's on time: the score moves by the month paid as agreed, three. Paid short of it, the $48 by
 *   hand, it's late: autopay asks the $52 left and bounces, and the $30 safe harbor is the one fee. Paid off before the
 *   due date, the plan ends there and the card takes the day again. On a Capital One card, 28.99% with no introduction,
 *   the plan's due date leaves the card carrying and still no interest at the next statement, where its twin off a plan
 *   is charged the 28.99% compounded nightly on $4,800 and then on the $30 late fee too. The Bank's card panel says the
 *   plan, and its Ask For Help With Payments, pressed, is refused and then granted as the command is.
 * - card.request_limit: lowered to what's owed, the card has no room, and a meal behind a locked debit card and a cash
 *   advance are refused; raised a fifth, the room is the raise and both go through. Declined, with the notice and its
 *   rule, for a payment late within the year (and granted for one past it), a record under 700, nothing in the bank,
 *   and a card suspended on a plan. The record reads it at the due date: the same $2,960 owed costs a $3,750 limit
 *   ten points of utilization and a $4,500 one seven. The panel's Ask For It, pressed with a figure typed, lowers it,
 *   and is declined for a late payment with the notice.
 * - card.set_everyday: a Citi card applied for and arrived, made everyday, takes the meal and Chase none; made back,
 *   Chase takes the next morning's groceries; it holds through a reload. Somebody else's use, the day's draw, lands on
 *   the everyday card: the same day and amount on Citi made everyday, and on Chase in its twin. The panel's Make It The
 *   Everyday Card does it, and isn't offered on a card being closed.
 * - card.set_over_limit: on a $500 limit with $500 owed, a meal behind a locked debit card is refused, then bought a
 *   tenth over once opted in; the statement charges no over-limit fee, since no researched card has one; opted out, the
 *   room is the limit less what's owed again and the cycles are 0. The panel's button and line say so.
 * - cash.deposit: $40 of $100 taken out at Chase's machine paid back in: checking up by it and the wallet down, and the
 *   next morning's groceries come out of it rather than the card. Refused: more than is in hand, a term deposit, a
 *   closed savings account, a classmate's account, a Post Office at Chase, a dormant account until it's reactivated, and
 *   a machine behind a locked, stopped or not-yet-arrived debit card, where the counter takes each. The panel's Pay It
 *   In, rendered and pressed.
 * - cash.withdraw: a $300 cash advance on Chase's card for its 5%, $15; a night at its 28.49%; a $200 payment that goes
 *   to the cash first; and the statement's cash interest, compounded nightly, worked here. Refused in its own words: a
 *   dormant account, a stopped card at a machine, a new account's card not yet arrived, more than checking holds, more
 *   than the card has free, the Post Office in the US, and on a Kiwibank card in Auckland its NZ$1,000 cash limit. The
 *   wallet is spent on food only for a cash payer or behind a stopped debit card, and a card payer is told so. The
 *   panel's quote, shown before Take It Out and graying it out when refused.
 *
 * Found by the review of 2026-10-13 and by this evidence pass of the same day, failing here when written, and fixed in
 * the engine that day (each test asserts the right behavior): until then a hardship plan paid off before a statement
 * never ended, since only a due date ended one and a statement owing nothing schedules none, so the card stayed
 * suspended with nothing owed (this pass); a holder on a plan was told the card’s minimum, $48, as what the statement
 * asked and what the late due date found short, where the plan’s $100 is what’s due (this pass); and Make It The
 * Everyday Card’s command took a card being closed, which only the screen hid (the review).
 *
 * Left open, as the content's or the engine's to settle: Wells Fargo's rushDays (1) and Capital One's (3), which nothing
 * reads while card.report refuses a rush with no fee (card.report's gap). Settled later on 2026-10-13: Capital One’s
 * days are read, and its rush sent free; Wells Fargo’s went from the data in that day’s third round, its rush being a
 * credit card’s for a fee it doesn’t publish, refused in words that say so. And, outside what the rows claim once their
 * words are corrected: the statement's over-limit fee, which only a test-made product reaches, and `cashLimitShare`,
 * which no card product in any country has, so no limit sets a cash limit.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven, from Monday 24 August 2026
 * at 7:30 AM, banking at Chase as the life opens with: Chase Total Checking, Chase Savings and a Chase Freedom Unlimited
 * at a $65,217 limit, in its 0% introduction until 20 October, and a record of 795. Most begin past 9:00 AM that
 * morning, when the fall term's Yale Health plan ($1,882) comes out of checking, so no balance set before it meets it.
 * The other banks are reached as a player reaches them: Citi's and Capital One's cards through Apply For Its Card, a
 * week by the clock, and a Wells Fargo current account through Open. One LIFE FIXTURE: a Kiwibank life in Auckland
 * (`quickSave`), since no American card has a cash limit. The screens are rendered as the player has them
 * (react-dom/server), `useGame`'s `run` the save's own `execute`; a pressed button is the component's own onClick, kept
 * on its way through the JSX runtime, and what was typed into a field is given through its useState in render order.
 *
 * TEST SETUP, said again where it's done: purchases put on a card by a posting, as a month's shopping would put them;
 * a balance set by a posting against a test equity line no fee waiver counts; a payment late within the year and a
 * record's score written onto the record; an account marked dormant, as thirty months untouched at Chase would make it;
 * a classmate's account, which a New Haven world gives nobody but the player; the US's yearly rate of somebody else's
 * use set to 1, so the day's draw always meets it; hunger before a meal; and the typed figures on the screens.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { FRAUD_LAW, type FraudLaw } from '@/engine/content/security';
import { cardRoom, cardsOf, stateOf } from '@/engine/systems/credit';
import { REPLACED_KIND } from '@/engine/systems/security';
import { paymentsOf } from '@/engine/systems/payments';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
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

/** Every button a screen draws, with its words, whether it's grayed out, and its own onClick. */
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

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
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

const { BankSecurity } = await import('@/ui/bank/BankSecurity');
const { BankCard } = await import('@/ui/bank/BankCard');
const { BankCash } = await import('@/ui/bank/BankCash');

/** A screen as the player has it: its words with the tags taken out, its buttons, and a way to press one. */
function drawn(sim: Simulation, el: () => ReactElement, states: unknown[] = []) {
  h.sim = sim;
  h.buttons = [];
  h.states = [...states];
  const html = renderToStaticMarkup(el());
  h.states = [];
  const buttons = [...h.buttons];
  const text = html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
  return {
    text,
    buttons,
    count: (label: string) => buttons.filter((b) => b.text === label).length,
    button: (label: string, nth = 0) => buttons.filter((b) => b.text === label)[nth],
    press(label: string, nth = 0) {
      const b = buttons.filter((one) => one.text === label)[nth];
      expect(b, `a button “${label}”`).toBeDefined();
      expect(b!.disabled ?? false).toBe(false);
      b!.onClick!();
    },
  };
}

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------

/** A new life: Ada Cole, born in New York, an actor at Yale in New Haven from Monday 24 August 2026, 7:30 AM, at Chase. */
const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** An instant in New Haven in 2026 before 1 November, on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const edt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 4, minute);
/** The same life at 9:01 AM, past the fall term's Yale Health plan, $1,882, out of checking at 9:00. */
function settled(seed: string): Simulation {
  const sim = student(seed);
  sim.advanceTo(edt(8, 24, 9, 1));
  return sim;
}
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

const mine = (sim: Simulation, kind: Account['kind'], bankId = 'us-chase'): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && a.bankId === bankId && !a.closedAt && a.category !== 'term')!;
const checking = (sim: Simulation) => mine(sim, 'checking');
const savings = (sim: Simulation) => mine(sim, 'savings');
const chaseCard = (sim: Simulation) => mine(sim, 'credit_card');
const inHand = (sim: Simulation) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'cash' && !a.closedAt)?.balance ?? 0;

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload });
function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const eat = (sim: Simulation) => run(sim, 'life.look_after', { action: 'eat' });

/** What each transaction with a memo moved on an account, in order. */
const moved = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).flatMap((t) => t.postings.filter((p) => p.accountId === account.id).map((p) => p.amount));
const notes = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const arrivals = (sim: Simulation, account: Account) => sim.universe.scheduled
  .filter((i) => i.kind === REPLACED_KIND && i.status === 'pending' && i.payload.accountId === account.id);

/** TEST SETUP: an account brought to a balance, by a posting against a test equity line no fee waiver counts as a deposit. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}
/** TEST SETUP: purchases put on a card, as a month's shopping would put them. */
function purchases(sim: Simulation, card: Account, amount: number): void {
  sim.post({ memo: 'TEST SETUP: purchases', category: 'shopping', postings: [{ accountId: card.id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test Setup').id, amount }] });
}
/** TEST SETUP: hungry, so a meal is wanted (a meal is refused at 90 nourishment and over). */
function hungry(sim: Simulation): void {
  sim.player.wellbeing.nourishment = 40;
}

/**
 * A meal: $4 at New Haven's cost of living, 127, is $5.08, $5 to the dollar, and Connecticut doesn't tax groceries; a
 * day's groceries, $8 so, $10.16, are $10. SLATE's estimates of the American average, priced where she is.
 */
const MEAL = 5_00;
const GROCERIES = 10_00;
/** The life's own card: Chase Freedom Unlimited, at the wealthy family's limit. */
const LIMIT = 65_217_00;

const laws = FRAUD_LAW as Record<string, FraudLaw>;
const kept = new Map<string, FraudLaw>();
/** TEST SETUP: a country's fraud law changed for a test, put back after it. */
function withLaw(iso: string, change: Partial<FraudLaw>) { if (!kept.has(iso)) kept.set(iso, laws[iso]!); laws[iso] = { ...laws[iso]!, ...change }; }
afterEach(() => { for (const [k, v] of kept) laws[k] = v; kept.clear(); });

// ---------------------------------------------------------------------------
// card.report
// ---------------------------------------------------------------------------

describe('card.report', () => {
  it('stops a lost Chase debit card for no fee: the meal and each morning’s groceries go on the credit card, the machine refuses and the counter pays, and a new number comes on the seventh business day', () => {
    const sim = settled('g12-report');
    must(sim, 'bank.set_payments', { everyday: 'debit' });
    const account = checking(sim);
    const card = chaseCard(sim);
    expect(card.balance).toBe(0);
    const before = account.balance;
    const answer = must<{ arrivesAt: number; fee: number }>(sim, 'card.report', { which: 'debit', why: 'lost' });
    // Chase lists a new debit card free. Seven business days from Monday 24 August: Tuesday 25 to Wednesday 2 September.
    expect(answer.fee).toBe(0);
    expect(account.balance).toBe(before);
    expect(moved(sim, account, 'Replacement card fee')).toEqual([]);
    expect(answer.arrivesAt).toBe(edt(9, 2, 9, 1));
    expect(account.plastic!.stopped).toBe('lost');
    const old = account.plastic!.last4;
    // Reported again: refused, and nothing sent twice. A reason that isn't one of the three: refused.
    expect(run(sim, 'card.report', { which: 'debit', why: 'stolen' }).error).toBe('That card is already stopped, and a new one is on its way.');
    expect(arrivals(sim, account)).toHaveLength(1);
    expect(run(sim, 'card.report', { which: 'credit', why: 'bent' }).error).toBe('Choose why: lost, stolen or damaged.');

    // The credit card locked as well, and no cash: the meal isn't bought, and says why.
    must(sim, 'card.lock', { which: 'credit', locked: true });
    expect(eat(sim).error).toBe('Your debit card is stopped, and there isn’t enough on the credit card or in cash.');
    must(sim, 'card.lock', { which: 'credit', locked: false });
    // Unlocked: the meal goes on the credit card, and checking isn't touched.
    must(sim, 'life.look_after', { action: 'eat' });
    expect(account.balance).toBe(before);
    expect(card.balance).toBe(-MEAL);

    // A machine needs the debit card; the counter doesn't.
    expect(run(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' }).error).toBe('Your debit card is stopped. You can still take cash out at the counter.');
    expect(inHand(sim)).toBe(0);
    expect(must(sim, 'cash.withdraw', { amount: 20_00, from: 'counter' })).toEqual({ fee: 0 });
    expect(account.balance).toBe(before - 20_00);
    expect(inHand(sim)).toBe(20_00);

    // By the clock to a minute before it comes: nine midnights' groceries, 25 August to 2 September, each on the credit card.
    sim.advanceTo(answer.arrivesAt - 60_000);
    expect(account.plastic!.stopped).toBe('lost');
    expect(moved(sim, card, 'Groceries')).toEqual(Array(9).fill(-GROCERIES));
    expect(moved(sim, account, 'Groceries')).toEqual([]);
    expect(card.balance).toBe(-MEAL - 9 * GROCERIES);

    sim.advanceTo(answer.arrivesAt + 60_000);
    expect(account.plastic!.stopped).toBeUndefined();
    expect(account.plastic!.last4).not.toBe(old);
    expect(account.plastic!.issued).toBe(2);
    expect(notes(sim, 'Your New Card Arrived').map((n) => n.body)).toEqual([`The new card ends in ${account.plastic!.last4}, and you can use it now.`]);
    // The next midnight's groceries draw on checking again, and the credit card takes nothing more.
    sim.advanceTo(edt(9, 3, 0, 1));
    expect(moved(sim, account, 'Groceries')).toEqual([-GROCERIES]);
    expect(card.balance).toBe(-MEAL - 9 * GROCERIES);
    expect(must(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' })).toEqual({ fee: 0 });
  });

  it('keeps a stopped card and its one replacement through a save and a load, and the new card arrives once', () => {
    const sim = settled('g12-report-load');
    const answer = must<{ arrivesAt: number; fee: number }>(sim, 'card.report', { which: 'debit', why: 'damaged' });
    const old = checking(sim).plastic!.last4;
    const loaded = reload(sim);
    const account = checking(loaded);
    expect(account.plastic).toMatchObject({ stopped: 'damaged', replacementAt: answer.arrivesAt, last4: old });
    expect(arrivals(loaded, account)).toHaveLength(1);
    expect(run(loaded, 'cash.withdraw', { amount: 20_00, from: 'atm' }).error).toBe('Your debit card is stopped. You can still take cash out at the counter.');
    expect(run(loaded, 'card.report', { which: 'debit', why: 'lost' }).error).toBe('That card is already stopped, and a new one is on its way.');
    loaded.advanceTo(answer.arrivesAt + 60_000);
    expect(account.plastic!.stopped).toBeUndefined();
    expect(account.plastic!.issued).toBe(2);
    expect(account.plastic!.last4).not.toBe(old);
    // Loaded again after it came: no second card.
    const again = reload(loaded);
    again.advanceBy(2 * MS_DAY);
    expect(checking(again).plastic!.issued).toBe(2);
    expect(notes(again, 'Your New Card Arrived')).toHaveLength(1);
    expect(must(again, 'cash.withdraw', { amount: 20_00, from: 'atm' })).toEqual({ fee: 0 });
  });

  it('rushes Chase’s for $15 out of checking in two business days, and refuses a Wells Fargo card’s rush, whose fee Wells Fargo doesn’t publish, where unrushed it takes five', () => {
    const sim = settled('g12-report-rush');
    const account = checking(sim);
    // A Wells Fargo current account opened beside it, its first card to come by the clock.
    const opened = must<{ accountId: string; cardAt: number }>(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: account.id, amount: 100_00 });
    const before = account.balance;
    const rush = must<{ arrivesAt: number; fee: number }>(sim, 'card.report', { which: 'debit', why: 'stolen', rush: true });
    // Chase's $15 rush, in its two business days: Tuesday 25 and Wednesday 26 August.
    expect(rush).toEqual({ fee: 15_00, arrivesAt: edt(8, 26, 9, 1) });
    expect(account.balance).toBe(before - 15_00);
    expect(moved(sim, account, 'Rush replacement card fee')).toEqual([-15_00]);
    sim.advanceTo(rush.arrivesAt + 60_000);
    expect(account.plastic!.stopped).toBeUndefined();

    // Thursday 3 September at 9 AM, past the Wells Fargo card's arrival.
    sim.advanceTo(edt(9, 3, 9, 0));
    expect(opened.cardAt).toBeLessThan(sim.now);
    const wf = sim.universe.accounts[opened.accountId]!;
    expect(wf.plastic!.stopped).toBeUndefined();
    // Until 2026-10-13 this held the rush refused, “Wells Fargo has no rush replacement SLATE knows of.”, though its
    // terms list a day’s rush: `card.report` read a rush fee alone. Later that day it held it rushed on a twin, in that
    // one business day, Friday 4 September, for nothing; until the third round of that day, which read Wells Fargo’s rush
    // as its own page gives it: a credit card’s, “in as little as 24 hours (additional fees may apply)”, its card
    // agreement naming a Rush Plastic Fee with no amount. Refused on a twin now, in words that say so, and nothing stopped.
    const twin = reload(sim);
    const twinWf = twin.universe.accounts[wf.id]!;
    expect(twin.execute({ kind: 'card.report', payload: { which: 'debit', why: 'lost', rush: true, accountId: wf.id } }).error).toBe('Wells Fargo doesn’t publish what it charges to rush a card, so the game can’t send a rushed one.');
    expect(twinWf.plastic!.stopped).toBeUndefined();
    expect(twinWf.balance).toBe(wf.balance);
    const plain = must<{ arrivesAt: number; fee: number }>(sim, 'card.report', { which: 'debit', why: 'lost', accountId: wf.id });
    // Wells Fargo lists no fee; its five business days from Thursday 3 September skip the weekend and Labor Day,
    // Monday 7: Friday 4, then Tuesday 8 to Friday 11.
    expect(plain).toEqual({ fee: 0, arrivesAt: edt(9, 11, 9, 0) });
    expect(wf.plastic!.stopped).toBe('lost');
  });

  it('is offered on Your Cards with Chase’s fee line, and Report It pressed stops the debit card and says when the new one comes', () => {
    const sim = settled('g12-report-screen');
    const account = checking(sim);
    const before = drawn(sim, () => createElement(BankSecurity, { bankId: 'us-chase' }));
    expect(before.text).toContain('Debit card ending');
    expect(before.text).toContain('A new card is free. A rushed one costs $15.00 more.');
    expect(before.count('Report It')).toBe(2);
    expect(before.count('Report It And Rush The New One')).toBe(2);
    // The first is the debit card's, with Lost chosen as the screen starts.
    before.press('Report It');
    expect(account.plastic!.stopped).toBe('lost');
    const after = drawn(sim, () => createElement(BankSecurity, { bankId: 'us-chase' }));
    expect(after.text).toContain('Lost: stopped. A new one arrives September 2, 2026.');
    expect(after.count('Report It')).toBe(1);
    expect(after.count('Report It And Rush The New One')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// card.request_hardship
// ---------------------------------------------------------------------------

/** The life's Chase card owing $4,800, with $3,000 in checking and nothing in savings: a plan at $100. */
function onAPlan(seed: string): Simulation {
  const sim = settled(seed);
  purchases(sim, chaseCard(sim), 4_800_00); // TEST SETUP
  setBalance(sim, checking(sim), 3_000_00); // TEST SETUP
  setBalance(sim, savings(sim), 0); // TEST SETUP
  expect(must(sim, 'card.request_hardship', {})).toEqual({ payment: 100_00 });
  return sim;
}

describe('card.request_hardship', () => {
  it('is refused a card owing nothing and a holder whose bank could clear it, then sets a forty-eighth of what’s owed, and the card takes nothing: the meal goes to checking, and behind a locked debit card isn’t bought', () => {
    const sim = settled('g12-plan');
    const card = chaseCard(sim);
    expect(run(sim, 'card.request_hardship', {}).error).toBe('You don’t owe anything on the card.');
    purchases(sim, card, 4_800_00); // TEST SETUP
    expect(run(sim, 'card.request_hardship', {}).error).toBe('You could pay it off today. A hardship plan is for when you can’t.');
    expect(stateOf(sim.player, card).hardship).toBeUndefined();
    setBalance(sim, checking(sim), 3_000_00); // TEST SETUP
    setBalance(sim, savings(sim), 0); // TEST SETUP
    // $4,800 over forty-eight months.
    expect(must(sim, 'card.request_hardship', {})).toEqual({ payment: 100_00 });
    expect(run(sim, 'card.request_hardship', {}).error).toBe('You’re already on a payment plan.');
    expect(cardRoom(sim.player, card)).toBe(0);
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    must(sim, 'card.lock', { which: 'debit', locked: true });
    expect(eat(sim).error).toBe('Your debit card is locked, and there isn’t enough on the credit card or in cash.');
    must(sim, 'card.lock', { which: 'debit', locked: false });
    must(sim, 'life.look_after', { action: 'eat' });
    expect(card.balance).toBe(-4_800_00);
    expect(checking(sim).balance).toBe(3_000_00 - MEAL);
  });

  it('has autopay on the minimum ask the plan’s $100 at the due date rather than the card’s $48, on time, and the score moves by a month paid as agreed', () => {
    const sim = onAPlan('g12-plan-due');
    const card = chaseCard(sim);
    must(sim, 'finance.set_autopay', { mode: 'minimum' });
    // The wealthy family's record.
    expect(sim.player.credit!.score).toBe(795);
    sim.advanceTo(edt(9, 20, 9, 1));
    // Chase's minimum on it: 1% of $4,800 and the month's interest, none in the introduction, never under $40: $48.
    expect(stateOf(sim.player, card).statementBalance).toBe(4_800_00);
    expect(sim.player.credit!.score).toBe(795);
    // Due 21 days after the statement, Chase's grace: Sunday 11 October at noon.
    sim.advanceTo(edt(10, 11, 11, 59));
    expect(moved(sim, card, 'Paid Chase Freedom Unlimited')).toEqual([]);
    sim.advanceTo(edt(10, 11, 12, 1));
    expect(moved(sim, card, 'Paid Chase Freedom Unlimited')).toEqual([100_00]);
    expect(card.balance).toBe(-4_700_00);
    expect(moved(sim, card, 'Late fee')).toEqual([]);
    const state = stateOf(sim.player, card);
    expect(state.missed).toBe(0);
    expect(state.carrying).toBe(true);
    expect(state.hardship).toEqual({ payment: 100_00, since: edt(8, 24, 9, 1) });
    // On time, three; $4,700 of $65,217 used is 7%, under the 30% past which the record docks it.
    expect(sim.player.credit!.score).toBe(798);
    expect(cardRoom(sim.player, card)).toBe(0);
  });

  /** On a plan, the card's $48 minimum paid by hand after the statement, and nothing in checking for autopay's rest. */
  function shortOfThePlan(seed: string): { sim: Simulation; card: Account; statement: string } {
    const sim = onAPlan(seed);
    sim.advanceTo(edt(9, 20, 9, 1));
    const statement = notes(sim, 'Statement Ready: Chase Freedom Unlimited').at(-1)!.body;
    // The card’s $48 typed in. Until 2026-10-13 paying “the minimum” paid it, the card’s own on a plan; from that day it
    // pays the plan’s payment (`tests/hardship-plan-minimum.test.ts`), so the card’s is paid as an amount here.
    expect(must(sim, 'finance.pay_card', { amount: 48_00 })).toEqual({ paid: 48_00 });
    sim.advanceTo(edt(10, 11, 11, 59));
    setBalance(sim, checking(sim), 0); // TEST SETUP: nothing in checking for autopay's rest, a minute before it asks
    sim.advanceTo(edt(10, 11, 12, 1));
    return { sim, card: chaseCard(sim), statement };
  }

  it('is late when less than the plan’s $100 is paid, though the card’s $48 minimum was: autopay asks the $52 left, bounces, and the $30 safe harbor fee is the one fee', () => {
    const { sim, card } = shortOfThePlan('g12-plan-short');
    expect(notes(sim, 'A Card Payment Bounced').map((n) => n.body)).toEqual(['Autopay asked for $52.00, and the current account couldn’t cover it. The payment is late now, and the late fee is the only fee charged for it.']); // Until 2026-10-16 (brief 09's banking follow-up) this asserted the notice's straight apostrophe (\').
    // A US card's first late fee, the $30 safe harbor, under the $100 due; no returned payment's fee beside it.
    expect(moved(sim, card, 'Late fee')).toEqual([-30_00]);
    expect(moved(sim, card, 'Returned payment fee')).toEqual([]);
    expect(stateOf(sim.player, card).missed).toBe(1);
    // Not yet thirty days late, so not on the record: the score doesn't take the month paid as agreed, nor lose for it.
    expect(sim.player.credit!.late).toEqual([]);
    expect(sim.player.credit!.score).toBe(795);
  });

  it('names the plan’s $100 as what the statement asks and what the due date found short, where only the card’s $48 minimum was paid', () => {
    const { sim, statement } = shortOfThePlan('g12-plan-said');
    const late = notes(sim, 'A Late Card Payment').at(-1)!;
    // The statement asks the plan’s $100, and $48 is short of that, not of $48 (until 2026-10-13 both said the card’s
    // $48; fixed that day).
    expect(statement).toContain('$100.00');
    expect(statement).not.toContain('at least $48.00');
    expect(late.body).toContain('was $100.00, and only $48.00 was paid');
  });

  it('ends at the due date once the card is paid off before it: the suspension lifts and the card takes the day again', () => {
    const sim = onAPlan('g12-plan-cleared');
    const card = chaseCard(sim);
    sim.advanceTo(edt(9, 20, 9, 1));
    setBalance(sim, checking(sim), 6_000_00); // TEST SETUP: the means to clear it, come since
    expect(must(sim, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 4_800_00 });
    expect(card.balance).toBe(0);
    expect(cardRoom(sim.player, card)).toBe(0);
    sim.advanceTo(edt(10, 11, 12, 1));
    const state = stateOf(sim.player, card);
    expect(state.hardship).toBeUndefined();
    expect(state.suspended).toBeUndefined();
    expect(cardRoom(sim.player, card)).toBe(LIMIT);
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    expect(card.balance).toBe(-MEAL);
  });

  it('ends once the card is paid off before its statement too, with no due date to wait for, and the card isn’t left suspended owing nothing', () => {
    const sim = onAPlan('g12-plan-early');
    const card = chaseCard(sim);
    setBalance(sim, checking(sim), 6_000_00); // TEST SETUP: the means to clear it, come since
    expect(must(sim, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 4_800_00 });
    // Two statements owing nothing, 20 September and 20 October.
    sim.advanceTo(edt(10, 20, 9, 1));
    expect(card.balance).toBe(0);
    const state = stateOf(sim.player, card);
    expect(state.hardship).toBeUndefined();
    expect(state.suspended).toBeUndefined();
    expect(cardRoom(sim.player, card)).toBe(LIMIT);
  });

  it('freezes a Capital One card’s 28.99% on a plan: no interest at the statement after a due date the plan’s payment met, where its twin off a plan is charged it nightly', () => {
    const twin = (): { sim: Simulation; card: Account } => {
      const sim = settled('g12-plan-freeze');
      expect(must(sim, 'card.apply', { bankId: 'us-capital-one' })).toEqual({ approved: true, limit: 5_000_00 });
      // A week, by the clock: Monday 31 August.
      sim.advanceTo(edt(8, 31, 9, 2));
      const card = mine(sim, 'credit_card', 'us-capital-one');
      purchases(sim, card, 4_800_00); // TEST SETUP
      setBalance(sim, checking(sim), 3_000_00); // TEST SETUP
      setBalance(sim, savings(sim), 0); // TEST SETUP
      return { sim, card };
    };
    const planned = twin();
    const off = twin();
    expect(must(planned.sim, 'card.request_hardship', { accountId: planned.card.id })).toEqual({ payment: 100_00 });
    for (const { sim } of [planned, off]) sim.advanceTo(edt(10, 20, 9, 1));

    // Capital One gives no grace days: due the 15th of the month after the statement, Thursday 15 October.
    expect(moved(planned.sim, planned.card, 'Paid Platinum from Capital One')).toEqual([100_00]);
    expect(stateOf(planned.sim.player, planned.card).carrying).toBe(true);
    expect(moved(planned.sim, planned.card, 'Interest')).toEqual([]);
    expect(planned.card.balance).toBe(-4_700_00);

    // Off a plan, autopay's $4,800 bounced, late for the $30 safe harbor; 28.99% a year, each night on the night
    // before's: 45 nights, 1 September to 15 October, on $4,800, then 5 on $4,830.
    expect(moved(off.sim, off.card, 'Late fee')).toEqual([-30_00]);
    let accrued = 0;
    for (let night = 0; night < 45; night += 1) accrued += (4_800_00 + accrued) * 0.2899 / 365;
    for (let night = 0; night < 5; night += 1) accrued += (4_830_00 + accrued) * 0.2899 / 365;
    const charged = moved(off.sim, off.card, 'Interest');
    expect(charged).toHaveLength(1);
    expect(Math.abs(-charged[0]! - accrued)).toBeLessThanOrEqual(1);
    expect(-charged[0]!).toBeGreaterThan(194_00);
  });

  it('is said on the card’s panel: the line, nothing left to spend, and Ask For Help With Payments gone once pressed and granted', () => {
    const sim = settled('g12-plan-screen');
    const card = chaseCard(sim);
    purchases(sim, card, 4_800_00); // TEST SETUP
    const asked = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    // Pressed while the bank could clear it: refused, and nothing changes.
    asked.press('Ask For Help With Payments');
    expect(stateOf(sim.player, card).hardship).toBeUndefined();
    setBalance(sim, checking(sim), 3_000_00); // TEST SETUP
    setBalance(sim, savings(sim), 0); // TEST SETUP
    drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' })).press('Ask For Help With Payments');
    expect(stateOf(sim.player, card).hardship?.payment).toBe(100_00);
    const on = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    // Until 2026-10-13 this held “… and $100 a month until it’s cleared. The card can’t be used until then.”; a plan ends,
    // and the card works again, only at the first statement or due date after it’s paid off.
    expect(on.text).toContain('It’s been on a payment plan since August 24, 2026. There’s no interest, and each statement asks for the plan’s $100 instead of the minimum. You can’t use the card until the plan ends, at the first statement or due date after it’s paid off.');
    expect(on.text).toContain('Left To Spend $0 Of a $65,217 limit');
    expect(on.count('Ask For Help With Payments')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// card.request_limit
// ---------------------------------------------------------------------------

describe('card.request_limit', () => {
  it('lowers to what’s owed when asked for less, and the card then takes nothing; raised a fifth, the room is the raise, and a meal and a cash advance go on it', () => {
    const sim = settled('g12-limit');
    const card = chaseCard(sim);
    purchases(sim, card, 500_00); // TEST SETUP
    expect(run(sim, 'card.request_limit', { limit: 0 }).error).toBe('Enter the limit you want.');
    expect(must(sim, 'card.request_limit', { limit: 1_00 })).toEqual({ limit: 500_00, granted: true });
    expect(card.creditLimit).toBe(500_00);
    expect(run(sim, 'card.request_limit', { limit: 500_00 }).error).toBe('Enter the limit you want.');
    expect(cardRoom(sim.player, card)).toBe(0);
    must(sim, 'card.lock', { which: 'debit', locked: true });
    expect(eat(sim).error).toBe('Your debit card is locked, and there isn’t enough on the credit card or in cash.');
    // $20 in cash costs Chase's least fee, $10.
    expect(run(sim, 'cash.withdraw', { amount: 20_00, from: 'card' }).error).toBe('The card has $0.00 of its limit left, and this needs $30.00 with its fee.');

    // A record of 795, nothing late, $3,000 and more in the bank: a fifth more than $500, though $1,000 was asked.
    expect(must(sim, 'card.request_limit', { limit: 1_000_00 })).toEqual({ limit: 600_00, granted: true });
    expect(cardRoom(sim.player, card)).toBe(100_00);
    must(sim, 'life.look_after', { action: 'eat' });
    expect(card.balance).toBe(-500_00 - MEAL);
    expect(must(sim, 'cash.withdraw', { amount: 20_00, from: 'card' })).toEqual({ fee: 10_00 });
    expect(card.balance).toBe(-500_00 - MEAL - 30_00);
    expect(notes(sim, 'Limit Increase Declined')).toHaveLength(0);
  });

  it('keeps the limit and says the rule for a payment late within the year, a record under 700, nothing in the bank and a card suspended on a plan, and raises it for a payment late more than a year ago', () => {
    const sim = settled('g12-limit-declined');
    const card = chaseCard(sim);
    /** Asked for more, a minute on, and declined: the limit kept, and the notice brought up to now with the rule. */
    const declined = (limit: number, kept: string) => {
      sim.advanceBy(60_000);
      expect(must(sim, 'card.request_limit', { limit })).toEqual({ limit: card.creditLimit, granted: false });
      const notice = notes(sim, 'Limit Increase Declined').at(-1)!;
      expect(notice.at).toBe(sim.now);
      expect(notice.body).toBe(`The bank kept your limit at ${kept}. It raises a limit only with a credit score of 700 or more, no late payment in the last year, and money in the bank to repay it.`);
    };
    expect(must(sim, 'card.request_limit', { limit: 5_000_00 })).toEqual({ limit: 5_000_00, granted: true });

    sim.player.credit!.late = [sim.now - 30 * MS_DAY]; // TEST SETUP: a payment late a month ago
    declined(6_000_00, '$5,000.00');
    expect(card.creditLimit).toBe(5_000_00);
    sim.player.credit!.late = [sim.now - 366 * MS_DAY]; // TEST SETUP: late a year and a day ago
    expect(must(sim, 'card.request_limit', { limit: 6_000_00 })).toEqual({ limit: 6_000_00, granted: true });

    sim.player.credit!.score = 699; // TEST SETUP
    declined(7_200_00, '$6,000.00');
    sim.player.credit!.score = 795; // TEST SETUP

    setBalance(sim, checking(sim), 0); // TEST SETUP
    setBalance(sim, savings(sim), 0); // TEST SETUP
    declined(7_200_00, '$6,000.00');

    // $100 in the bank and $500 owed: a plan, and the card suspended by it.
    setBalance(sim, checking(sim), 100_00); // TEST SETUP
    purchases(sim, card, 500_00); // TEST SETUP
    must(sim, 'card.request_hardship', {});
    declined(7_200_00, '$6,000.00');
    expect(card.creditLimit).toBe(6_000_00);
    // Said word for word while unread, a notice is brought up to now rather than said again: two, not four.
    expect(notes(sim, 'Limit Increase Declined')).toHaveLength(2);
  });

  it('is read by the record at the due date: the same $2,960 owed costs a $3,750 limit ten points of utilization and a raised $4,500 one seven', () => {
    const owing = () => {
      const sim = settled('g12-limit-used');
      purchases(sim, chaseCard(sim), 3_000_00); // TEST SETUP
      expect(must(sim, 'card.request_limit', { limit: 3_750_00 })).toEqual({ limit: 3_750_00, granted: true });
      must(sim, 'finance.set_autopay', { mode: 'minimum' });
      return sim;
    };
    const lowered = owing();
    const raised = owing();
    expect(must(raised, 'card.request_limit', { limit: 4_500_00 })).toEqual({ limit: 4_500_00, granted: true });
    for (const sim of [lowered, raised]) sim.advanceTo(edt(10, 11, 12, 1));
    // Chase's minimum on $3,000, 1% under its $40 floor: $40, paid by autopay on time, three points; $2,960 left.
    for (const sim of [lowered, raised]) {
      expect(moved(sim, chaseCard(sim), 'Paid Chase Freedom Unlimited')).toEqual([40_00]);
      expect(chaseCard(sim).balance).toBe(-2_960_00);
    }
    // Utilization past 30% docks twenty points a whole: 2,960/3,750 is 78.9%, ten; 2,960/4,500 is 65.8%, seven.
    expect(lowered.player.credit!.score).toBe(795 + 3 - 10);
    expect(raised.player.credit!.score).toBe(795 + 3 - 7);
  });

  it('is asked from the card’s panel: the figure typed and Ask For It pressed lowers it, the panel shows the room, and a raise declined leaves the notice', () => {
    const sim = settled('g12-limit-screen');
    const card = chaseCard(sim);
    purchases(sim, card, 500_00); // TEST SETUP
    // TEST SETUP: $1 typed into A Different Limit (the first useState of the card's panel).
    drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }), ['1', h.keep]).press('Ask For This Limit');
    expect(card.creditLimit).toBe(500_00);
    const lowered = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    expect(lowered.text).toContain('New Limit (USD), Now $500');
    expect(lowered.text).toContain('Left To Spend $0 Of a $500 limit');
    expect(lowered.button('Ask For This Limit')!.disabled).toBe(true);
    sim.player.credit!.late = [sim.now - 30 * MS_DAY]; // TEST SETUP: a payment late a month ago
    drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }), ['1000', h.keep]).press('Ask For This Limit');
    expect(card.creditLimit).toBe(500_00);
    expect(notes(sim, 'Limit Increase Declined').map((n) => n.body)).toEqual(['The bank kept your limit at $500.00. It raises a limit only with a credit score of 700 or more, no late payment in the last year, and money in the bank to repay it.']);
  });
});

// ---------------------------------------------------------------------------
// card.set_everyday
// ---------------------------------------------------------------------------

/** The life with Citi's card beside Chase's, applied for through Apply For Its Card and come a week later. */
function twoCards(seed: string): { sim: Simulation; chase: Account; citi: Account } {
  const sim = settled(seed);
  expect(must(sim, 'card.apply', { bankId: 'us-citi' })).toEqual({ approved: true, limit: 5_000_00 });
  sim.advanceTo(edt(8, 31, 9, 2));
  return { sim, chase: chaseCard(sim), citi: mine(sim, 'credit_card', 'us-citi') };
}

describe('card.set_everyday', () => {
  it('puts the meal on the card made everyday and none on the other, and the next morning’s groceries back on Chase once it’s made so, through a reload', () => {
    const { sim, chase, citi } = twoCards('g12-everyday');
    // Citi's arrived beside the everyday card, which stays Chase's.
    expect(cardsOf(sim, sim.player).map((c) => c.id)).toEqual([chase.id, citi.id]);
    expect(notes(sim, 'Your New Card Arrived').map((n) => n.body)).toContain(`Your ${citi.name} has arrived, with a $5,000.00 limit.`);
    expect(run(sim, 'card.set_everyday', { accountId: 'account_none' }).error).toBe('You don’t hold that card.');
    expect(run(sim, 'card.set_everyday', {}).error).toBe('You don’t hold that card.');
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    expect(chase.balance).toBe(0);
    expect(must(sim, 'card.set_everyday', { accountId: citi.id })).toEqual({ everyday: citi.id });
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    expect(citi.balance).toBe(-MEAL);
    expect(chase.balance).toBe(0);

    const loaded = reload(sim);
    expect(cardsOf(loaded, loaded.player)[0]!.id).toBe(citi.id);
    expect(must(loaded, 'card.set_everyday', { accountId: chase.id })).toEqual({ everyday: chase.id });
    loaded.advanceTo(edt(9, 1, 0, 1));
    const [c, ci] = [loaded.universe.accounts[chase.id]!, loaded.universe.accounts[citi.id]!];
    expect(moved(loaded, c, 'Groceries')).toEqual([-GROCERIES]);
    expect(c.balance).toBe(-GROCERIES);
    expect(ci.balance).toBe(-MEAL);
  });

  it('meets somebody else’s use on the everyday card: the same day’s draw lands on Citi made everyday, and on Chase in the twin left so', () => {
    const onCiti = twoCards('g12-everyday-fraud');
    const onChase = twoCards('g12-everyday-fraud');
    must(onCiti.sim, 'card.set_everyday', { accountId: onCiti.citi.id });
    // The debit card locked in both, so the day's draw meets the credit card or nothing.
    for (const { sim } of [onCiti, onChase]) must(sim, 'card.lock', { which: 'debit', locked: true });
    withLaw('US', { fraudRate: 1 }); // TEST SETUP: the day's draw always meets somebody else's use
    for (const { sim } of [onCiti, onChase]) {
      for (let day = 0; day < 20 && !(sim.player.fraud ?? []).length; day += 1) sim.advanceBy(MS_DAY);
    }
    const [a, b] = [onCiti.sim.player.fraud ?? [], onChase.sim.player.fraud ?? []];
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0]!.accountId).toBe(onCiti.citi.id);
    expect(b[0]!.accountId).toBe(onChase.chase.id);
    expect(a[0]!.at).toBe(b[0]!.at);
    expect(a[0]!.amount).toBe(b[0]!.amount);
    expect(moved(onCiti.sim, onCiti.citi, 'Card purchase')).toEqual([-a[0]!.amount]);
    expect(moved(onCiti.sim, onCiti.chase, 'Card purchase')).toEqual([]);
    expect(moved(onChase.sim, onChase.chase, 'Card purchase')).toEqual([-b[0]!.amount]);
    expect(moved(onChase.sim, onChase.citi, 'Card purchase')).toEqual([]);
  });

  it('refuses to make a card being closed the everyday card, as the screen never offers it', () => {
    const { sim, chase, citi } = twoCards('g12-everyday-closing');
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    must(sim, 'card.set_everyday', { accountId: citi.id });
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    must(sim, 'card.set_everyday', { accountId: chase.id });
    expect(must(sim, 'card.close', { accountId: citi.id })).toEqual({ closing: true });
    // Owing $5, it's closing, not closed, and takes nothing new.
    expect(citi.closedAt).toBeUndefined();
    expect(cardRoom(sim.player, citi)).toBe(0);
    const asked = run(sim, 'card.set_everyday', { accountId: citi.id });
    expect(asked.ok).toBe(false);
    expect(asked.error).toBe('That card is being closed, so nothing new can go on it.');
    expect(cardsOf(sim, sim.player)[0]!.id).toBe(chase.id);
  });

  it('is offered on the card that isn’t everyday and not on one being closed, and Make It The Everyday Card pressed swaps the two panels’ words', () => {
    const { sim, chase, citi } = twoCards('g12-everyday-screen');
    const before = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    expect(before.text).toContain('This is your everyday card: the day’s spending goes on it.');
    expect(before.text).toContain('The day’s spending goes on your everyday card, not this one, unless you make this the everyday card.');
    expect(before.text).toContain(`The everyday card, ···${chase.last4}`);
    expect(before.count('Make It The Everyday Card')).toBe(1);
    before.press('Make It The Everyday Card');
    expect(cardsOf(sim, sim.player)[0]!.id).toBe(citi.id);
    const after = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    expect(after.text).toContain(`The everyday card, ···${citi.last4}`);
    expect(after.text).not.toContain(`The everyday card, ···${chase.last4}`);
    expect(after.count('Make It The Everyday Card')).toBe(1);
    // A meal on Citi, Chase made everyday again by its own button, and Citi closed owing the $5: not offered.
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    after.press('Make It The Everyday Card');
    expect(cardsOf(sim, sim.player)[0]!.id).toBe(chase.id);
    must(sim, 'card.close', { accountId: citi.id });
    const closing = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    expect(closing.text).toContain('It’s closed to new spending. You keep paying off what’s owed as before, and then the account closes.');
    expect(closing.count('Make It The Everyday Card')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// card.set_over_limit
// ---------------------------------------------------------------------------

describe('card.set_over_limit', () => {
  it('lets a meal go a tenth over a $500 limit once opted in, charges no fee for it at the statement, and opted out leaves the limit less what’s owed', () => {
    const sim = settled('g12-over');
    const card = chaseCard(sim);
    purchases(sim, card, 500_00); // TEST SETUP
    // The limit brought to what's owed by the command itself.
    expect(must(sim, 'card.request_limit', { limit: 1_00 })).toEqual({ limit: 500_00, granted: true });
    must(sim, 'card.lock', { which: 'debit', locked: true });
    expect(eat(sim).error).toBe('Your debit card is locked, and there isn’t enough on the credit card or in cash.');
    expect(must(sim, 'card.set_over_limit', { on: true })).toEqual({ on: true });
    // A tenth of $500.
    expect(cardRoom(sim.player, card)).toBe(50_00);
    must(sim, 'life.look_after', { action: 'eat' });
    expect(card.balance).toBe(-500_00 - MEAL);
    must(sim, 'card.lock', { which: 'debit', locked: false });

    sim.advanceTo(edt(9, 20, 9, 1));
    expect(stateOf(sim.player, card).statementBalance).toBe(500_00 + MEAL);
    expect(moved(sim, card, 'Over-limit fee')).toEqual([]);
    expect(card.balance).toBe(-500_00 - MEAL);

    expect(must(sim, 'card.set_over_limit', { on: false })).toEqual({ on: false });
    expect(cardRoom(sim.player, card)).toBe(0);
    // Until 2026-10-13 this asked that a count of over-limit fees in a row went to 0 here; it was never counted, with no
    // fee on any card, so it only ever went from nothing to 0, and it went with the fee.
    must(sim, 'card.lock', { which: 'debit', locked: true });
    hungry(sim); // TEST SETUP
    expect(eat(sim).error).toBe('Your debit card is locked, and there isn’t enough on the credit card or in cash.');
  });

  it('is the panel’s Going Over The Limit, pressed from Declined to Allowed, with the line that this card charges nothing for it', () => {
    const sim = settled('g12-over-screen');
    const card = chaseCard(sim);
    purchases(sim, card, 500_00); // TEST SETUP
    must(sim, 'card.request_limit', { limit: 1_00 });
    const before = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    expect(before.text).toContain('Left To Spend $0 Of a $500 limit');
    before.press('Going Over The Limit: Declined');
    expect(stateOf(sim.player, card).overLimitOptIn).toBe(true);
    const after = drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' }));
    expect(after.count('Going Over The Limit: Allowed')).toBe(1);
    expect(after.text).toContain('You’ve opted in to going over the limit: a purchase can take it up to a tenth over, and this card charges nothing for it.');
    expect(after.text).toContain('Left To Spend $50 Of a $500 limit');
  });
});

// ---------------------------------------------------------------------------
// cash.deposit
// ---------------------------------------------------------------------------

describe('cash.deposit', () => {
  it('pays $40 of $100 back in at Chase’s machine, checking up and the wallet down by it, and the next morning’s groceries come out of it, not the card', () => {
    const sim = settled('g12-deposit');
    const account = checking(sim);
    const card = chaseCard(sim);
    expect(paymentsOf(sim.player).everyday).toBe('debit');
    expect(must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' })).toEqual({ fee: 0 });
    setBalance(sim, account, 0); // TEST SETUP: checking emptied after the cash came out
    // Nothing in checking: the meal goes on the card.
    must(sim, 'life.look_after', { action: 'eat' });
    expect(card.balance).toBe(-MEAL);
    expect(inHand(sim)).toBe(100_00);
    expect(must(sim, 'cash.deposit', { amount: 40_00, toId: account.id, at: 'atm' })).toEqual({ paid: 40_00 });
    expect(account.balance).toBe(40_00);
    expect(inHand(sim)).toBe(60_00);
    expect(run(sim, 'cash.deposit', { amount: 60_01, toId: account.id, at: 'counter' }).error).toBe('You have only $60.00 in cash, so nothing was paid in.');
    const sv = savings(sim);
    const kept = sv.balance;
    expect(must(sim, 'cash.deposit', { amount: 25_00, toId: sv.id, at: 'counter' })).toEqual({ paid: 25_00 });
    expect(sv.balance).toBe(kept + 25_00);
    expect(inHand(sim)).toBe(35_00);
    sim.advanceTo(edt(8, 25, 0, 1));
    expect(moved(sim, account, 'Groceries')).toEqual([-GROCERIES]);
    expect(moved(sim, card, 'Groceries')).toEqual([]);
    expect(account.balance).toBe(40_00 - GROCERIES);
    expect(card.balance).toBe(-MEAL);
  });

  it('takes cash only into the holder’s own open current or savings account: a term deposit, a closed savings account, a classmate’s account and Chase’s Post Office are refused', () => {
    const sim = settled('g12-deposit-where');
    must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' });
    const term = must<{ accountId: string }>(sim, 'bank.open_term', { amount: 1_000_00 });
    const into = (toId: string, at = 'counter') => run(sim, 'cash.deposit', { amount: 40_00, toId, at });
    expect(into(term.accountId).error).toBe('Cash goes into your current account or savings.');
    const classmate = Object.keys(sim.universe.people).find((id) => id !== sim.player.id)!;
    // TEST SETUP: a classmate's account, which a New Haven world gives nobody but the player.
    const theirs = sim.openAccount({ id: sim.nextId('account'), kind: 'checking', name: 'A Classmate’s Checking', ownerId: classmate, openedAt: sim.now });
    expect(into(theirs.id).error).toBe('Cash goes into your current account or savings.');
    expect(into(checking(sim).id, 'post_office').error).toBe('Chase’s customers can’t pay cash in at the Post Office.');
    const sv = savings(sim);
    must(sim, 'bank.close_savings', { accountId: sv.id });
    expect(sv.closedAt).toBeDefined();
    expect(into(sv.id).error).toBe('Cash goes into your current account or savings.');
    expect(inHand(sim)).toBe(100_00);
    expect(theirs.balance).toBe(0);
  });

  it('refuses cash into a dormant account until it’s reactivated, as Move Money into it is, and takes it after', () => {
    const sim = settled('g12-deposit-dormant');
    must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' });
    const sv = savings(sim);
    const kept = sv.balance;
    sv.dormant = true; // TEST SETUP: dormant, as thirty months untouched at Chase would make it
    expect(run(sim, 'cash.deposit', { amount: 40_00, toId: sv.id, at: 'counter' }).error).toBe('Chase Savings is dormant. Reactivate it first, under Your Accounts Over Time.');
    expect(run(sim, 'bank.transfer', { fromId: checking(sim).id, toId: sv.id, amount: 40_00 }).error).toBe('Chase Savings is dormant. Reactivate it first, under Your Accounts Over Time.');
    expect(sv.balance).toBe(kept);
    expect(inHand(sim)).toBe(100_00);
    must(sim, 'bank.reactivate', { accountId: sv.id });
    expect(must(sim, 'cash.deposit', { amount: 40_00, toId: sv.id, at: 'counter' })).toEqual({ paid: 40_00 });
    expect(sv.balance).toBe(kept + 40_00);
    expect(sv.dormant).toBeUndefined();
    expect(inHand(sim)).toBe(60_00);
  });

  it('takes nothing at a machine behind a locked, stopped or not-yet-arrived debit card, where the counter takes each, and the machine again once the card comes', () => {
    const sim = settled('g12-deposit-card');
    const account = checking(sim);
    must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' });
    const atm = (toId = account.id) => run(sim, 'cash.deposit', { amount: 10_00, toId, at: 'atm' });
    const counter = (toId = account.id) => must(sim, 'cash.deposit', { amount: 10_00, toId, at: 'counter' });
    must(sim, 'card.lock', { which: 'debit', locked: true });
    expect(atm().error).toBe('Your debit card is locked. You can still pay cash in at the counter.');
    counter();
    must(sim, 'card.lock', { which: 'debit', locked: false });
    must(sim, 'card.report', { which: 'debit', why: 'lost' });
    expect(atm().error).toBe('Your debit card is stopped. You can still pay cash in at the counter.');
    counter();
    // A Wells Fargo account opened and made primary: its first card is on its way.
    const opened = must<{ accountId: string; cardAt: number }>(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: account.id, amount: 100_00 });
    must(sim, 'bank.set_primary', { accountId: opened.accountId });
    expect(atm(opened.accountId).error).toBe('Your debit card hasn’t arrived yet. You can still pay cash in at the counter.');
    counter(opened.accountId);
    expect(inHand(sim)).toBe(70_00);
    sim.advanceTo(opened.cardAt + 60_000);
    const wf = sim.universe.accounts[opened.accountId]!;
    const before = wf.balance;
    expect(must(sim, 'cash.deposit', { amount: 10_00, toId: wf.id, at: 'atm' })).toEqual({ paid: 10_00 });
    expect(wf.balance).toBe(before + 10_00);
  });

  it('is Pay It In on the cash panel once there’s cash in hand, into checking or savings, and pressed pays the typed figure in', () => {
    const sim = settled('g12-deposit-screen');
    const account = checking(sim);
    const empty = drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' }));
    expect(empty.text).toContain('You have $0.00 in cash.');
    expect(empty.count('Pay It In')).toBe(0);
    must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' });
    const held = drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' }));
    expect(held.text).toContain('You have $100.00 in cash.');
    expect(held.text).toContain('Chase Total Checking');
    expect(held.text).toContain('Chase Savings');
    expect(held.text).toContain('An ATM');
    expect(held.text).not.toContain('The Post Office');
    expect(held.button('Pay It In')!.disabled).toBe(true);
    const before = account.balance;
    // TEST SETUP: $40 typed into Pay In (the third useState), the rest as the panel starts: into checking, at the counter.
    drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' }), [h.keep, h.keep, '40', h.keep, h.keep]).press('Pay It In');
    expect(account.balance).toBe(before + 40_00);
    expect(inHand(sim)).toBe(60_00);
  });
});

// ---------------------------------------------------------------------------
// cash.withdraw
// ---------------------------------------------------------------------------

describe('cash.withdraw', () => {
  it('takes a $300 cash advance on Chase’s card for its 5%, draws 28.49% from the first night with no grace, puts a $200 payment to the cash first, and charges the cash interest at the statement', () => {
    const sim = settled('g12-advance');
    const card = chaseCard(sim);
    purchases(sim, card, 1_000_00); // TEST SETUP
    // 5% of $300, over Chase's $10 least.
    expect(must(sim, 'cash.withdraw', { amount: 300_00, from: 'card' })).toEqual({ fee: 15_00 });
    expect(card.balance).toBe(-1_315_00);
    expect(inHand(sim)).toBe(300_00);
    expect(stateOf(sim.player, card).cashOwed).toBe(300_00);
    sim.advanceTo(edt(8, 25, 0, 1));
    // A night at 28.49% a year on $300; the purchases draw nothing in the card's 0% introduction.
    const night = 0.2849 / 365;
    expect(stateOf(sim.player, card).cashAccrued).toBeCloseTo(300_00 * night, 6);
    expect(stateOf(sim.player, card).accrued ?? 0).toBe(0);
    // Paid by hand, before any statement: all of it to the dearest balance, the cash.
    expect(must(sim, 'finance.pay_card', { amount: 200_00 })).toEqual({ paid: 200_00 });
    expect(stateOf(sim.player, card).cashOwed).toBe(100_00);
    sim.advanceTo(edt(9, 20, 9, 1));
    // Then 26 nights on $100, 26 August to 20 September, each on the night before's interest too.
    let accrued = 300_00 * night;
    for (let n = 0; n < 26; n += 1) accrued += (100_00 + accrued) * night;
    const charged = moved(sim, card, 'Cash advance interest');
    expect(charged).toHaveLength(1);
    expect(Math.abs(-charged[0]! - accrued)).toBeLessThanOrEqual(1);
    expect(stateOf(sim.player, card).cashOwed).toBe(100_00 - charged[0]!);
  });

  it('refuses in its own words a dormant account, a stopped card at a machine, more than checking holds, more than the card has free, the Post Office in the US, and a bad request', () => {
    const sim = settled('g12-withdraw-refused');
    const account = checking(sim);
    const card = chaseCard(sim);
    const out = (amount: number, from: string) => run(sim, 'cash.withdraw', { amount, from });
    expect(out(0, 'atm').error).toBe('Enter an amount.');
    expect(out(20_00, 'bank').error).toBe('Choose where to take it from: your bank’s ATM, another bank’s, the counter, the Post Office or the card.');
    expect(out(20_00, 'post_office').error).toBe('Chase’s customers can’t use the Post Office for cash.');
    setBalance(sim, account, 250_00); // TEST SETUP
    expect(out(300_00, 'counter').error).toBe('Chase Total Checking has only $250.00.');
    account.dormant = true; // TEST SETUP: dormant, as thirty months untouched at Chase would make it
    expect(out(20_00, 'atm').error).toBe('Chase Total Checking is dormant. Reactivate it first, under Your Accounts Over Time.');
    expect(out(20_00, 'counter').error).toBe('Chase Total Checking is dormant. Reactivate it first, under Your Accounts Over Time.');
    must(sim, 'bank.reactivate', { accountId: account.id });
    must(sim, 'card.report', { which: 'debit', why: 'stolen' });
    expect(out(20_00, 'atm').error).toBe('Your debit card is stopped. You can still take cash out at the counter.');
    expect(out(20_00, 'other_atm').error).toBe('Your debit card is stopped. You can still take cash out at the counter.');
    expect(inHand(sim)).toBe(0);
    expect(account.balance).toBe(250_00);
    expect(must(sim, 'cash.withdraw', { amount: 20_00, from: 'counter' })).toEqual({ fee: 0 });
    expect(account.balance).toBe(230_00);
    // $1,000 owed on a limit brought to $1,100: $100 free, and $100 in cash takes $110 with Chase's least fee.
    purchases(sim, card, 1_000_00); // TEST SETUP
    must(sim, 'card.request_limit', { limit: 1_100_00 });
    expect(out(100_00, 'card').error).toBe('The card has $100.00 of its limit left, and this needs $110.00 with its fee.');
    expect(must(sim, 'cash.withdraw', { amount: 90_00, from: 'card' })).toEqual({ fee: 10_00 });
    expect(cardRoom(sim.player, card)).toBe(0);
    expect(inHand(sim)).toBe(110_00);
  });

  it('refuses the machine until a new account’s first card arrives and the counter until its opening deposit does', () => {
    const sim = settled('g12-withdraw-new');
    const opened = must<{ accountId: string; arrivesAt: number; cardAt: number }>(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: checking(sim).id, amount: 100_00 });
    must(sim, 'bank.set_primary', { accountId: opened.accountId });
    const wf = sim.universe.accounts[opened.accountId]!;
    expect(run(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' }).error).toBe('Your debit card hasn’t arrived yet. You can still take cash out at the counter.');
    expect(run(sim, 'cash.withdraw', { amount: 20_00, from: 'counter' }).error).toBe(`${wf.name} has nothing in it.`);
    sim.advanceTo(opened.arrivesAt + 60_000);
    expect(wf.balance).toBe(100_00);
    expect(must(sim, 'cash.withdraw', { amount: 20_00, from: 'counter' })).toEqual({ fee: 0 });
    expect(run(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' }).error).toBe('Your debit card hasn’t arrived yet. You can still take cash out at the counter.');
    sim.advanceTo(opened.cardAt + 60_000);
    expect(must(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' })).toEqual({ fee: 0 });
    expect(wf.balance).toBe(60_00);
    expect(inHand(sim)).toBe(40_00);
  });

  it('is spent on food only by somebody paying the day in cash or behind a stopped debit card, and a card payer with cash is told so', () => {
    const sim = settled('g12-withdraw-wallet');
    const account = checking(sim);
    must(sim, 'cash.withdraw', { amount: 100_00, from: 'atm' });
    must(sim, 'bank.set_payments', { everyday: 'cash' });
    const before = account.balance;
    must(sim, 'life.look_after', { action: 'eat' });
    expect(inHand(sim)).toBe(100_00 - MEAL);
    expect(account.balance).toBe(before);
    // Paid by debit card, the morning's groceries come out of checking and the cash isn't touched.
    must(sim, 'bank.set_payments', { everyday: 'debit' });
    sim.advanceTo(edt(8, 25, 0, 1));
    expect(moved(sim, account, 'Groceries')).toEqual([-GROCERIES]);
    expect(inHand(sim)).toBe(100_00 - MEAL);
    // Nothing in checking and the credit card locked: the cash is there, and the words say what would spend it.
    setBalance(sim, account, 0); // TEST SETUP
    must(sim, 'card.lock', { which: 'credit', locked: true });
    hungry(sim); // TEST SETUP
    expect(eat(sim).error).toBe('The bank and the card can’t pay it. Cash in hand pays for the day where The Day’s Spending is In Cash, Then The Debit Card.');
    expect(inHand(sim)).toBe(100_00 - MEAL);
    // Behind a stopped debit card, anybody's meal comes out of the cash.
    must(sim, 'card.report', { which: 'debit', why: 'lost' });
    must(sim, 'life.look_after', { action: 'eat' });
    expect(inHand(sim)).toBe(100_00 - 2 * MEAL);
    expect(account.balance).toBe(0);
  });

  it('stops at a Kiwibank card’s NZ$1,000 cash limit, the only kind of cash limit a card in SLATE has', () => {
    // LIFE FIXTURE: Auckland at Kiwibank, since none of the American cards a New Haven life holds has a cash limit.
    const sim = quickSave({ startLocationId: 'nz-akl-auckland', homeRegionId: 'nz-akl-auckland', livesWhereBorn: true, wealth: 'comfortable', bankId: 'nz-kiwibank' }, 'g12-cash-limit');
    expect(run(sim, 'cash.withdraw', { amount: 1_000_01, from: 'card' }).error).toBe('The card lets you take NZ$1,000.00 out as cash, and NZ$0.00 is out already.');
    must(sim, 'cash.withdraw', { amount: 600_00, from: 'card' });
    expect(run(sim, 'cash.withdraw', { amount: 400_01, from: 'card' }).error).toBe('The card lets you take NZ$1,000.00 out as cash, and NZ$600.00 is out already.');
    must(sim, 'cash.withdraw', { amount: 400_00, from: 'card' });
    expect(stateOf(sim.player, cardsOf(sim, sim.player)[0]!).cashOwed).toBe(1_000_00);
  });

  it('shows the quote before Take It Out, grays it out where refused, and pressed takes the advance', () => {
    const sim = settled('g12-withdraw-screen');
    const card = chaseCard(sim);
    // TEST SETUP: $300 typed into Take Out, and A Cash Advance On The Card chosen (the first two useStates).
    const advance = drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' }), ['300', 'card']);
    expect(advance.text).toContain('It costs $15.00. A cash advance is charged 28.49% a year from today, with no interest-free period.');
    advance.press('Take It Out');
    expect(stateOf(sim.player, card).cashOwed).toBe(300_00);
    expect(card.balance).toBe(-315_00);
    must(sim, 'card.report', { which: 'debit', why: 'stolen' });
    const machine = drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' }), ['20', 'atm']);
    expect(machine.text).toContain('Your debit card is stopped. You can still take cash out at the counter.');
    expect(machine.button('Take It Out')!.disabled).toBe(true);
    const counter = drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' }), ['20', 'counter']);
    expect(counter.text).toContain('It’s free.');
    expect(counter.button('Take It Out')!.disabled).toBe(false);
  });
});
