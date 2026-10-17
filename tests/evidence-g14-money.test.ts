/**
 * Evidence for five rows of keeping more than one bank that the review of 2026-10-13 left partial (verification group
 * g14-money, `systems/bankmoves.ts`, `systems/lending.ts`, `ui/bank/BankMoves.tsx`, `ui/bank/BankLending.tsx`). Each
 * row's command is sent as the screen sends it, through `sim.execute`, and each consequence is read where the row says
 * it's read, mostly through the clock; the figures are the banks' own published ones, worked here by hand.
 *
 * - `bank.open_current`: Chase, having closed her account for two of its $15 monthly fees left unpaid 60 days, refuses
 *   her for the $30 it charged off, and Citi, Wells Fargo and Bank of America turn her away on the ChexSystems report
 *   Chase made on Saturday 31 October 2026 (each bank's own draw, at SLATE's 85% while the debt is unpaid, turned her
 *   away on this life), which stands until 30 October 2031 (5 × 365 days, 29 February 2028 among them); a
 *   seventeen-year-old is refused by the four banks that open from 18 until her birthday; an F-1 student with no
 *   Social Security number is refused a branch hour while orientation's registration is coming or under way, and opens
 *   at Wells Fargo once it's over, the hour passing; an opening deposit is refused from a card, from the bank itself, of
 *   nothing, and of more than the account holds. None of them opens, applies for or sends anything. The panel shows
 *   Bank of America first with its $100 and two business days, and its Apply, pressed, sends that application.
 * - `bank.set_primary`: once Capital One is primary, the night's groceries on the debit card, $40 from its own machine
 *   (no fee, as Capital One publishes) and $100 paid to the Chase card by hand all come out of Capital One, across a
 *   reload, and Chase doesn't move; the Chase card holds the payment back its 15 days, as a payment from another bank.
 *   Refused: primary already, a savings account, a card, an account the bank closed, and Citi while it closes. The
 *   panel's Make Primary, pressed, moves it and says what stays where it was.
 * - `bank.set_order_source`: a $50 standing order on the 28th, moved to Capital One, pays from Capital One on Friday
 *   28 August at 9 AM and lands in Chase savings in Capital One's three business days, Wednesday 2 September; again on
 *   28 September, once; Capital One holds $400.00 of its $500 after the two. Closing Capital One is refused for the
 *   order and allowed once it's moved back. Refused: no such order, a savings account or a card, Citi while it closes.
 *   The panel's Pay From There, its account chosen and pressed, moves it.
 * - `bank.set_loan_repayment`: a $3,000 Citi loan over 24 months at Citi's 10.24% (its lowest, for a record past the
 *   780 SLATE lends its best rate at) is $138.77 a month: $3,000 × (0.1024 / 12) / (1 − (1 + 0.1024 / 12)^−24) is
 *   $138.767, rounded up. Moved to Chase, the first month draws $25.60 of interest and $138.77 from Chase, Citi
 *   untouched, and the second $24.63 and $138.77, once each, across reloads. Closing Citi is refused for the loan
 *   before the move and allowed after it. Refused: no such loan, one paid off, a savings account, Citi while it closes.
 *   The loan panel's Repay From There, its account chosen and pressed, moves it.
 * - `bank.close_current`: Chase is refused as her only current account, then as her primary, then overdrawn by
 *   $15.00 once its fee falls on an empty account, until it's paid in; then for a payment set for a date, then for its
 *   savings, then, holding $2,300.00 and told nowhere, asking where it goes; named, it closes, and the $2,300.00
 *   arrives at Capital One whole in Chase's three business days, once, across a reload, its statements ending at the
 *   closing. Citi, with groceries pending, closes on the day the last posts, refuses to be closed again, and on that day
 *   stays open with a Didn't Close notice, its $5 fee having overdrawn the $2.00 left in it; paid in, it closes. The
 *   panel's Close It is shut while anything uses Chase, and pressed once nothing does, sends its $2,300 on its way.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in
 * New Haven, starting Monday 24 August 2026 at 7:30 AM at Chase; for the F-1 rule the same life born in London, and for
 * the age rule one born on 1 December 2008 who chose Capital One at creation (it states no age). Everything she does
 * is a command the bank screen sends; everything that follows is the clock.
 *
 * TEST SETUP, said again where it's done: a month's wages paid into Chase before a loan, since the lender reads wages
 * paid in and a student has none on her first morning; and on the screen, the choice in a select that a static render
 * can't make (given through the component's own useState, in render order), and each Gated control's handler kept as
 * it renders so a press runs exactly what the button runs.
 *
 * Three gaps the review named that no test can close, found unreachable in this pass: Open An Account's "in a branch
 * where you live" refusal (`openRefusal`) compares `currentLocationId` with `homeOf`, which returns `currentLocationId`,
 * and nothing moves it after creation, so it never refuses; `bank.set_order_source`'s "It pays into that account."
 * can't be reached, since a standing order goes only into savings (`bank.add_standing_order`) and pays only from a
 * current account; and a standing order paying into a current account, which `linkedTo` would name for Close It, can't
 * be set up, for the same reason. All three went from the engine later on 2026-10-13, with the guide’s words for them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { bankById } from '@/engine/content/banks';
import { applicationsOf, inTransitOf, transfersOf } from '@/engine/systems/bankmoves';
import { checkingsOf, collectionsOf, LOAN_DUE_KIND } from '@/engine/systems/lending';
import { paymentsOf, STANDING_ORDER_KIND } from '@/engine/systems/payments';
import { autopaySource, cardsOf, stateOf } from '@/engine/systems/credit';
import { payeeAccount } from '@/engine/systems/cash';
import { periodsOf } from '@/engine/systems/statements';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** TEST SETUP: each Gated control as it rendered, with the handler its press runs. */
  controls: [] as { feature: string; label: string; disabled: boolean; title?: string; press: () => void }[],
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

// Without the original: it imports the looks, which import it back, and would get the original’s hooks.
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

// The real Gated renders the button; this keeps what it was given, so a press runs the button's own onClick.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const textOf = (node: unknown): string => (Array.isArray(node) ? node.map(textOf).join('') : typeof node === 'string' || typeof node === 'number' ? String(node) : '');
  const Gated = (props: Parameters<typeof real.Gated>[0]) => {
    h.controls.push({ feature: props.feature, label: textOf(props.children as ReactNode).trim(), disabled: Boolean(props.disabled), title: props.title, press: () => props.onClick?.({} as never) });
    return real.Gated(props);
  };
  return { ...real, Gated };
});

const { BankMoves } = await import('@/ui/bank/BankMoves');
const { BankLending } = await import('@/ui/bank/BankLending');

// ---------------------------------------------------------------------------
// Lives and the screen
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const MINUTE = 60_000;
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York: a new life as a player starts one. */
const student = (seed: string, extra: Record<string, unknown> = {}) =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const acct = (sim: Simulation, id: string): Account => sim.universe.accounts[id]!;
const primaryId = (sim: Simulation) => sim.player.primaryAccountId!;
const savingsAt = (sim: Simulation, bankId: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === 'savings' && a.bankId === bankId)!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const refused = (sim: Simulation, kind: string, payload: Record<string, unknown>): string => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, `${kind} went through`).toBe(false);
  return String(answer.error);
};
/** What one account posted, in order, after a moment. */
const postingsTo = (sim: Simulation, id: string, after = -Infinity) => sim.universe.transactions
  .filter((t) => t.at > after && t.postings.some((p) => p.accountId === id))
  .map((t) => ({ memo: t.memo, category: t.category, at: t.at, amount: t.postings.filter((p) => p.accountId === id).reduce((s, p) => s + p.amount, 0) }));
/** Nothing opened, applied for or sent: the current accounts, the applications, the money on its way, the clock. */
const untouched = (sim: Simulation) => ({
  currents: checkingsOf(sim, sim.player).map((a) => a.id),
  applications: applicationsOf(sim, sim.player).length,
  transfers: transfersOf(sim, sim.player).length,
  inTransit: inTransitOf(sim, sim.player).balance,
  balances: checkingsOf(sim, sim.player).map((a) => a.balance),
  now: sim.now,
});

/** The panel as the player has it: its markup and its words. */
const render = (sim: Simulation, element: ReturnType<typeof createElement>) => {
  h.sim = sim;
  h.controls = [];
  const html = renderToStaticMarkup(element).replace(/<!-- -->/g, '');
  // Every state given was read by the component it was meant for.
  expect(h.states).toEqual([]);
  return { html, words: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
};
const moves = (sim: Simulation) => render(sim, createElement(BankMoves));
const control = (feature: string, label?: string) => {
  const found = h.controls.filter((c) => c.feature === feature && (label === undefined || c.label === label));
  expect(found, `${feature} ${label ?? ''}`).toHaveLength(1);
  return found[0]!;
};
/** A press, as only an open button can be pressed. */
const press = (c: ReturnType<typeof control>) => {
  expect(c.disabled, `${c.feature} is shut: ${c.title}`).toBe(false);
  c.press();
};
/** BankMoves' own states, in render order: the bank, the deposit's account, its amount, each close's remainder, each order's and card's source. */
const bankMovesStates = (s: { target?: string; sources?: Record<string, string> }) => {
  h.states = [s.target ?? h.keep, h.keep, h.keep, h.keep, s.sources ?? h.keep];
};

/**
 * PLAYER JOURNEY: Citi opened and funded with $1,000 from Chase, made primary once its card came, so its debit card buys
 * the nights' groceries; on Tuesday 29 September at 8 AM, the groceries of the 28th and 29th still pending, she takes all
 * but $2.00 out at the counter, makes Chase primary again, and asks Citi to close, what it holds to Chase. `before` runs
 * just before the close.
 */
function citiClosing(seed: string, before?: (sim: Simulation, chase: string, citi: string) => void) {
  const sim = student(seed);
  const chase = primaryId(sim);
  const opened = run<{ accountId: string; cardAt: number }>(sim, 'bank.open_current', { bankId: 'us-citi' });
  const citi = opened.accountId;
  const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase, toId: citi, amount: 1_000_00 });
  sim.advanceTo(Math.max(opened.cardAt, sent.arrivesAt) + MINUTE);
  run(sim, 'bank.set_primary', { accountId: citi });
  sim.advanceTo(at(2026, 9, 29, 8));
  // The nights' groceries are on Citi and still pending.
  expect(sim.universe.transactions.some((t) => t.category === 'food' && t.postsAt !== undefined && t.postsAt > sim.now && t.postings.some((p) => p.accountId === citi))).toBe(true);
  run(sim, 'cash.withdraw', { amount: acct(sim, citi).balance - 2_00, from: 'counter' });
  expect(acct(sim, citi).balance).toBe(2_00);
  run(sim, 'bank.set_primary', { accountId: chase });
  before?.(sim, chase, citi);
  const closing = run<{ closedAt: number }>(sim, 'bank.close_current', { accountId: citi, remainderTo: chase });
  return { sim, chase, citi, closingAt: closing.closedAt };
}

/** PLAYER JOURNEY: Move Money, from Chase's current account and its savings to Capital One, leaving so much in each. */
const leaveAtChase = (sim: Simulation, cap: string, checking: number, savings: number) => {
  const current = checkingsOf(sim, sim.player).find((a) => a.bankId === 'us-chase')!;
  const saved = savingsAt(sim, 'us-chase');
  run(sim, 'bank.transfer', { fromId: current.id, toId: cap, amount: current.balance - checking });
  run(sim, 'bank.transfer', { fromId: saved.id, toId: cap, amount: saved.balance - savings });
  expect([current.balance, saved.balance]).toEqual([checking, savings]);
};

/** TEST SETUP: a month's wages paid into Chase as a payday posts them, for the lender to read. */
const wages = (sim: Simulation, id: string, amount: number) =>
  sim.post({ memo: 'TEST SETUP: Wages', category: 'salary', postings: [{ accountId: id, amount }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -amount }] });

// ---------------------------------------------------------------------------
// bank.open_current
// ---------------------------------------------------------------------------

describe('bank.open_current', () => {
  it('refuses Chase for the $30 it charged off and three banks on its ChexSystems report, opening, applying for and sending nothing, and the panel says so with Apply shut', () => {
    let sim = student('g14-chex');
    const chase = primaryId(sim);
    expect(acct(sim, chase).bankId).toBe('us-chase');
    // She moves to Capital One and leaves Chase at nothing: the primary, the card's autopay, her wages, the savings and the money.
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    run(sim, 'bank.set_primary', { accountId: cap });
    const cards = cardsOf(sim, sim.player);
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) run(sim, 'card.set_autopay_from', { cardId: c.id, accountId: cap });
    run(sim, 'bank.redirect_deposits', { accountId: cap });
    run(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase').id });
    run(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: acct(sim, chase).balance });
    expect(acct(sim, chase).balance).toBe(0);
    // Chase Total Checking's $15 a month, waived only with $500 of deposits, $1,500 in it or $5,000 across Chase: none.
    sim.advanceTo(at(2026, 9, 1));
    expect(acct(sim, chase).balance).toBe(-15_00);
    // Again on 30 September; 60 days below zero from the 1st of September's midnight, the bank closes it on 31 October.
    sim.advanceTo(at(2026, 10, 30, 23));
    expect(acct(sim, chase).closedAt).toBeUndefined();
    sim.advanceTo(at(2026, 11, 2));
    expect(acct(sim, chase).closedAt).toBe(at(2026, 10, 31, 0));
    const debt = collectionsOf(sim, sim.player, 'Chase')!;
    expect([debt.name, debt.balance]).toEqual(['Owed To Chase, In Collections', -30_00]);
    expect(sim.player.chex).toEqual({ at: at(2026, 10, 31, 0), bank: 'Chase' });
    sim = reload(sim);
    const before = untouched(sim);
    expect(before.currents).toEqual([cap]);

    expect(refused(sim, 'bank.open_current', { bankId: 'us-chase' })).toBe('Chase won’t open an account for you while you owe it a debt it has charged off.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi' })).toBe('Citi won’t open an account for you because of the ChexSystems report Chase filed, which stays on your record until October 30, 2031.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: cap, amount: 25_00 })).toBe('Wells Fargo won’t open an account for you because of the ChexSystems report Chase filed, which stays on your record until October 30, 2031.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-bank-of-america', fundFrom: cap, amount: 100_00 })).toBe('Bank of America won’t open an account for you because of the ChexSystems report Chase filed, which stays on your record until October 30, 2031.');
    expect(untouched(sim)).toEqual(before);

    // The panel offers Chase first (no account there now), says why not, and leaves Apply shut.
    const { words } = moves(sim);
    expect(words).toContain('Chase won’t open an account for you while you owe it a debt it has charged off.');
    const apply = control('bank.open_current', 'Apply');
    expect([apply.disabled, apply.title]).toEqual([true, 'Chase won’t open an account for you while you owe it a debt it has charged off.']);
    // TEST SETUP: Citi chosen in the Bank select.
    bankMovesStates({ target: 'us-citi' });
    moves(sim);
    expect(control('bank.open_current', 'Apply').title).toBe('Citi won’t open an account for you because of the ChexSystems report Chase filed, which stays on your record until October 30, 2031.');
  });

  it('refuses a seventeen-year-old at the four banks that open from 18, in their words, and opens Citi on her eighteenth birthday', () => {
    // Born 1 December 2008, she chose Capital One at creation, which states no age; she holds a photo ID.
    let sim = student('g14-young', { birthYear: 2008, birthMonth: 12, birthDay: 1, bankId: 'us-capital-one' });
    const cap = primaryId(sim);
    expect(acct(sim, cap).bankId).toBe('us-capital-one');
    const before = untouched(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-chase' })).toBe('Chase only opens an account in your own name from age 18.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi' })).toBe('Citi only opens an account in your own name from age 18.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: cap, amount: 25_00 })).toBe('Wells Fargo only opens an account in your own name from age 18.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-bank-of-america', fundFrom: cap, amount: 100_00 })).toBe('Bank of America only opens an account in your own name from age 18.');
    expect(untouched(sim)).toEqual(before);
    sim = reload(sim);
    // The evening before her birthday, still 17.
    sim.advanceTo(at(2026, 11, 30, 22));
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi' })).toBe('Citi only opens an account in your own name from age 18.');
    sim.advanceTo(at(2026, 12, 1, 9));
    const citi = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId;
    expect(acct(sim, citi).bankId).toBe('us-citi');
    expect(checkingsOf(sim, sim.player).map((a) => a.bankId)).toEqual(['us-capital-one', 'us-citi']);
  });

  it('keeps an F-1 student’s branch hour off orientation’s registration, before it and during it, and opens Wells Fargo after it, the hour passing; a citizen opens online at once', () => {
    // Born in London: on an F-1, with no Social Security number, so Wells Fargo opens in a branch.
    const sim = student('g14-f1', { homeRegionId: 'uk-eng-london' });
    const chase = primaryId(sim);
    sim.advanceTo(at(2026, 8, 24, 9, 15));
    let before = untouched(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: chase, amount: 25_00 })).toBe('Registration And Your Account starts at 10:00 AM: there isn’t the time before it.');
    expect(untouched(sim)).toEqual(before);
    sim.advanceTo(at(2026, 8, 24, 10, 30));
    before = untouched(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: chase, amount: 25_00 })).toBe('You’re at Registration And Your Account until 12:00 PM.');
    expect(untouched(sim)).toEqual(before);
    sim.advanceTo(at(2026, 8, 24, 12, 5));
    const chaseBefore = acct(sim, chase).balance;
    const wells = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: chase, amount: 25_00 }).accountId;
    // An hour at the branch, and the account opened at its end with its $25 sent from Chase.
    expect(sim.now).toBe(at(2026, 8, 24, 13, 5));
    expect(acct(sim, wells).openedAt).toBe(at(2026, 8, 24, 13, 5));
    expect(acct(sim, chase).balance).toBe(chaseBefore - 25_00);
    expect(inTransitOf(sim, sim.player).balance).toBe(25_00);

    // A citizen, born in New York, holds a number and applies online at the same 9:15: nothing refuses, no time passes.
    const citizen = student('g14-citizen');
    citizen.advanceTo(at(2026, 8, 24, 9, 15));
    run(citizen, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: primaryId(citizen), amount: 25_00 });
    expect(citizen.now).toBe(at(2026, 8, 24, 9, 15));
  });

  it('refuses an opening deposit from a card, from an account at the bank itself, of nothing or less, and of more than the account holds, each in its own words, nothing moved', () => {
    const sim = student('g14-fund');
    const chase = primaryId(sim);
    const card = cardsOf(sim, sim.player)[0]!;
    let before = untouched(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: card.id, amount: 10_00 })).toBe('Pay the opening deposit from one of your own current or savings accounts.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: 'account_nobody', amount: 10_00 })).toBe('Pay the opening deposit from one of your own current or savings accounts.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: chase, amount: 0 })).toBe('Enter how much to pay in.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', amount: -5_00 })).toBe('Enter how much to pay in.');
    const held = acct(sim, chase).balance;
    expect(held).toBe(92_391_00);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: chase, amount: held + 1 })).toBe('Chase Total Checking only has $92,391 in it.');
    expect(untouched(sim)).toEqual(before);
    expect(card.balance).toBe(0);

    // Capital One opened with its savings beside it, the current account never funded: the bank closes it at 60 days,
    // and its savings stays. An opening deposit from that savings is from Capital One itself.
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    const capSavings = run<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'us-capital-one' }).accountId;
    sim.advanceTo(sim.now + 61 * MS_DAY);
    expect(acct(sim, cap).closedAt).toBeDefined();
    expect(sim.universe.notifications.filter((n) => n.title === 'Capital One Closed 360 Checking')).toHaveLength(1);
    expect(acct(sim, capSavings).closedAt).toBeUndefined();
    before = untouched(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-capital-one', fundFrom: capSavings, amount: 10_00 })).toBe('That account is already at Capital One. Pay the deposit from an account at another bank.');
    expect(untouched(sim)).toEqual(before);
  });

  it('shows Bank of America first with its $100 and two business days; Apply, pressed, sends that application, the panel then offers Wells Fargo, and the account opens with the $100', () => {
    let sim = student('g14-apply');
    const chase = primaryId(sim);
    const chaseBefore = acct(sim, chase).balance;
    const first = moves(sim);
    expect(first.words).toContain('Open An Account At Another Bank');
    expect(first.words).toContain('There’s no switching service here. To move banks, open the new account, have your wages paid into it, move each standing order and autopay, move the money across, and then close the old account. The new account starts empty, with its own history.');
    const options = [...first.html.matchAll(/<option value="(us-[a-z-]+)"/g)].map((m) => m[1]);
    expect(options).toEqual(['us-bank-of-america', 'us-wells-fargo', 'us-citi', 'us-capital-one']);
    expect(first.words).toContain('It decides an application in 2 business days, the top of the range it gives. It asks for an opening deposit of $100, sent from another of your accounts.');
    expect(first.words).toContain('Opening Deposit From');
    press(control('bank.open_current', 'Apply'));

    // The application, under review until Wednesday 26 August; the $100 out of Chase and on its way.
    expect(applicationsOf(sim, sim.player)).toEqual([expect.objectContaining({ bankId: 'us-bank-of-america', at: at(2026, 8, 26, 7, 30) })]);
    expect(acct(sim, chase).balance).toBe(chaseBefore - 100_00);
    expect(inTransitOf(sim, sim.player).balance).toBe(100_00);
    const next = moves(sim);
    expect(next.words).toContain('Bank of America decides by August 26, 2026');
    expect([...next.html.matchAll(/<option value="(us-[a-z-]+)"/g)].map((m) => m[1])).toEqual(['us-wells-fargo', 'us-citi', 'us-capital-one']);
    expect(next.words).toContain('It opens the account as soon as you apply. It asks for an opening deposit of $25, sent from another of your accounts.');

    sim = reload(sim);
    sim.advanceTo(at(2026, 8, 26, 8));
    const bofa = checkingsOf(sim, sim.player).find((a) => a.bankId === 'us-bank-of-america')!;
    expect(bofa.balance).toBe(0);
    // Chase's three business days for the deposit: Thursday 27 August.
    sim.advanceTo(at(2026, 8, 27, 7, 31));
    expect(acct(sim, bofa.id).balance).toBe(100_00);
    expect(acct(sim, bofa.id).awaitingFunds).toBeUndefined();
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
    expect(sim.universe.notifications.filter((n) => n.title === 'Bank of America Opened Your Account')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// bank.set_primary
// ---------------------------------------------------------------------------

describe('bank.set_primary', () => {
  it('moves the night’s groceries, $40 from a machine and $100 paid to the Chase card by hand to Capital One once it’s primary, across a reload, and leaves Chase as it was', () => {
    let sim = student('g14-primary');
    const chase = primaryId(sim);
    const opened = run<{ accountId: string; cardAt: number }>(sim, 'bank.open_current', { bankId: 'us-capital-one' });
    const cap = opened.accountId;
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: 1_000_00 });
    // Capital One's card, in its 7 business days, on Wednesday 2 September.
    expect(opened.cardAt).toBe(at(2026, 9, 2, 7, 30));
    sim.advanceTo(Math.max(opened.cardAt, sent.arrivesAt) + MINUTE);
    // Until now the nights' groceries were Chase's.
    expect(postingsTo(sim, chase, at(2026, 9, 1, 23)).map((p) => p.category)).toEqual(['food']);
    const set = run<{ unchanged: string[] }>(sim, 'bank.set_primary', { accountId: cap });
    expect(set.unchanged).toEqual(['Your wages and other payments are paid into it', 'Your everyday card’s autopay pays from it']);
    sim = reload(sim);
    expect(primaryId(sim)).toBe(cap);
    const chaseHeld = acct(sim, chase).balance;
    const capHeld = acct(sim, cap).balance;
    expect(capHeld).toBe(1_000_00);
    // What was set up stays where it was: wages into Chase, the card's autopay from Chase.
    const card = cardsOf(sim, sim.player).find((c) => c.bankId === 'us-chase')!;
    expect(payeeAccount(sim, sim.player).id).toBe(chase);
    expect(autopaySource(sim, sim.player, card)?.id).toBe(chase);

    // The next midnight's groceries, on Capital One's debit card.
    const night = sim.now;
    sim.advanceTo(at(2026, 9, 3, 7));
    const groceries = postingsTo(sim, cap, night);
    expect(groceries.map((p) => p.category)).toEqual(['food']);
    expect(acct(sim, cap).balance).toBe(capHeld + groceries[0]!.amount);
    expect(postingsTo(sim, chase, night)).toEqual([]);

    // $40 from Capital One's own machine, free as Capital One publishes; then $100 to the Chase card by hand.
    const capBefore = acct(sim, cap).balance;
    const cardBefore = card.balance;
    expect(run<{ fee: number }>(sim, 'cash.withdraw', { amount: 40_00, from: 'atm' }).fee).toBe(0);
    expect(acct(sim, cap).balance).toBe(capBefore - 40_00);
    expect(run<{ paid: number }>(sim, 'finance.pay_card', { amount: 100_00, accountId: card.id }).paid).toBe(100_00);
    expect(acct(sim, cap).balance).toBe(capBefore - 140_00);
    expect(acct(sim, card.id).balance).toBe(cardBefore + 100_00);
    expect(acct(sim, chase).balance).toBe(chaseHeld);
    // Paid from another bank than the card's, Chase holds the credit back its "up to 15 days".
    expect(stateOf(sim.player, acct(sim, card.id)).paymentHolds).toEqual([{ amount: 100_00, until: sim.now + 15 * MS_DAY }]);
  });

  it('refuses one primary already, a savings account, a card, an account the bank closed and Citi while it closes, leaving the primary where it was', () => {
    const { sim, chase, citi } = citiClosing('g14-citi-primary');
    expect(primaryId(sim)).toBe(chase);
    expect(refused(sim, 'bank.set_primary', { accountId: citi })).toBe('Citi Access Checking is closing, so it can’t be your primary account.');
    expect(refused(sim, 'bank.set_primary', { accountId: chase })).toBe('Chase Total Checking is already your primary account.');
    expect(refused(sim, 'bank.set_primary', { accountId: savingsAt(sim, 'us-chase').id })).toBe('Only an open current account of yours can be primary.');
    expect(refused(sim, 'bank.set_primary', { accountId: cardsOf(sim, sim.player)[0]!.id })).toBe('Only an open current account of yours can be primary.');
    expect(primaryId(sim)).toBe(chase);

    // Capital One, never funded, closed by the bank at its 60 days.
    const other = student('g14-unfunded');
    const cap = run<{ accountId: string }>(other, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    other.advanceTo(other.now + 61 * MS_DAY);
    expect(acct(other, cap).closedAt).toBeDefined();
    expect(refused(other, 'bank.set_primary', { accountId: cap })).toBe('Only an open current account of yours can be primary.');
    expect(acct(other, primaryId(other)).bankId).toBe('us-chase');
  });

  it('shows Chase as Primary and Make Primary on Capital One; pressed, Capital One is primary and Chase’s line says what stays on it', () => {
    const sim = student('g14-primary-ui');
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    const first = moves(sim);
    expect(first.words).toMatch(/Chase Total Checking at Chase, \$[\d,]+\. This is your primary account\./);
    expect(first.words).toContain('360 Checking at Capital One, $0. It’s waiting for its first deposit, due by October 23, 2026. Its debit card arrives September 2, 2026.');
    expect(first.words).toContain('Your primary account is the one money comes from unless you say otherwise: your debit card’s everyday purchases come from it; cash from a machine comes out of it; bills you pay by hand come from it; a new standing order or autopay starts from it. Making another account primary doesn’t move anything already set up.');
    press(control('bank.set_primary', 'Make Primary'));
    expect(primaryId(sim)).toBe(cap);
    const after = moves(sim);
    expect(after.words).toContain('360 Checking at Capital One, $0. This is your primary account. It’s waiting for its first deposit');
    expect(after.words).toContain('You can’t close it yet. Your wages and other payments are paid into it. Your everyday card’s autopay pays from it. Move them first.');
    // Make Primary is now Chase's, the only one not primary.
    expect(control('bank.set_primary', 'Make Primary').disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bank.set_order_source
// ---------------------------------------------------------------------------

describe('bank.set_order_source', () => {
  it('pays the $50 order from Capital One on the 28th once moved, into Chase savings in Capital One’s three business days, once a month across reloads; closing Capital One is refused for it until it moves back', () => {
    let sim = student('g14-order');
    const chase = primaryId(sim);
    const savings = savingsAt(sim, 'us-chase').id;
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    run(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: 500_00 });
    const orderId = run<{ id: string }>(sim, 'bank.add_standing_order', { toId: savings, amount: 50_00, day: 28 }).id;
    expect(run<{ fromId: string }>(sim, 'bank.set_order_source', { orderId, accountId: cap }).fromId).toBe(cap);
    sim = reload(sim);
    expect(paymentsOf(sim.player).standingOrders.find((o) => o.id === orderId)!.fromId).toBe(cap);
    const day = sim.universe.scheduled.find((i) => i.kind === STANDING_ORDER_KIND && i.status === 'pending' && i.payload.orderId === orderId)!.at;
    expect(day).toBe(at(2026, 8, 28, 9));

    sim.advanceTo(day - MINUTE);
    const was = { chase: acct(sim, chase).balance, cap: acct(sim, cap).balance, savings: acct(sim, savings).balance, transit: inTransitOf(sim, sim.player).balance };
    expect(was.cap).toBe(500_00);
    sim.advanceTo(day + MINUTE);
    expect(acct(sim, cap).balance).toBe(was.cap - 50_00);
    expect(acct(sim, chase).balance).toBe(was.chase);
    expect(acct(sim, savings).balance).toBe(was.savings);
    expect(inTransitOf(sim, sim.player).balance).toBe(was.transit + 50_00);
    expect(postingsTo(sim, cap, day - MINUTE)).toEqual([{ memo: 'To Chase: Chase Savings', category: 'transfer', at: day, amount: -50_00 }]);
    // Capital One's three business days from Friday 28 August: Wednesday 2 September at 9 AM.
    sim.advanceTo(at(2026, 9, 2, 8, 59));
    const waiting = acct(sim, savings).balance;
    sim.advanceTo(at(2026, 9, 2, 9, 1));
    expect(acct(sim, savings).balance).toBe(waiting + 50_00);
    expect(inTransitOf(sim, sim.player).balance).toBe(was.transit);

    sim = reload(sim);
    sim.advanceTo(at(2026, 9, 28, 9, 1));
    // Two months, two payments from Capital One, none from Chase: $400.00 left of its $500.
    expect(postingsTo(sim, cap).filter((p) => p.memo === 'To Chase: Chase Savings').map((p) => p.amount)).toEqual([-50_00, -50_00]);
    expect(postingsTo(sim, chase).some((p) => p.memo.startsWith('To Chase') || p.memo.startsWith('Standing order'))).toBe(false);
    expect(acct(sim, cap).balance).toBe(400_00);

    // Once September's $50 has landed (Thursday 1 October), the order alone keeps Capital One open; moved back to
    // Chase, it doesn't.
    sim.advanceTo(at(2026, 10, 1, 9, 1));
    expect(transfersOf(sim, sim.player)).toEqual([]);
    expect(refused(sim, 'bank.close_current', { accountId: cap, remainderTo: chase })).toBe('A standing order pays from it on the 28th. Move it first.');
    run(sim, 'bank.set_order_source', { orderId, accountId: chase });
    run(sim, 'bank.close_current', { accountId: cap, remainderTo: chase });
    expect(acct(sim, cap).closedAt).toBe(sim.now);
  });

  it('refuses an order it doesn’t know, a savings account or a card to pay from, and Citi while it closes, leaving the order where it was', () => {
    let orderId = '';
    const { sim, chase, citi } = citiClosing('g14-citi-order', (s) => {
      orderId = run<{ id: string }>(s, 'bank.add_standing_order', { toId: savingsAt(s, 'us-chase').id, amount: 50_00, day: 28 }).id;
    });
    const fromNow = () => paymentsOf(sim.player).standingOrders.find((o) => o.id === orderId)!.fromId;
    expect(fromNow()).toBe(chase);
    expect(refused(sim, 'bank.set_order_source', { orderId, accountId: citi })).toBe('Citi Access Checking is closing, so a standing order can’t pay from it.');
    expect(refused(sim, 'bank.set_order_source', { orderId: 'sched_nobody', accountId: chase })).toBe('That standing order no longer exists.');
    expect(refused(sim, 'bank.set_order_source', { orderId, accountId: savingsAt(sim, 'us-chase').id })).toBe('A standing order pays from an open current account of yours.');
    expect(refused(sim, 'bank.set_order_source', { orderId, accountId: cardsOf(sim, sim.player)[0]!.id })).toBe('A standing order pays from an open current account of yours.');
    expect(fromNow()).toBe(chase);
  });

  it('lists the order with Pay From There shut until another account is chosen; chosen and pressed, it moves the order, and the panel shows it paying from Capital One', () => {
    const sim = student('g14-order-ui');
    const chase = primaryId(sim);
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    const orderId = run<{ id: string }>(sim, 'bank.add_standing_order', { toId: savingsAt(sim, 'us-chase').id, amount: 50_00, day: 28 }).id;
    const selected = (html: string) => new RegExp(`<select id="order-from-${orderId}"[^>]*>(.*?)</select>`).exec(html)![1]!.match(/<option value="([^"]+)" selected=""/)?.[1];
    const first = moves(sim);
    expect(first.words).toContain('What Pays From Where');
    expect(first.words).toContain('Standing Order Of $50 On The 28th, Into Chase Savings');
    expect(selected(first.html)).toBe(chase);
    expect(control('bank.set_order_source', 'Pay From This Account').disabled).toBe(true);
    // TEST SETUP: Capital One chosen in the order's select.
    bankMovesStates({ sources: { [orderId]: cap } });
    moves(sim);
    press(control('bank.set_order_source', 'Pay From This Account'));
    expect(paymentsOf(sim.player).standingOrders[0]!.fromId).toBe(cap);
    expect(selected(moves(sim).html)).toBe(cap);
  });
});

// ---------------------------------------------------------------------------
// bank.set_loan_repayment
// ---------------------------------------------------------------------------

describe('bank.set_loan_repayment', () => {
  it('draws the month’s $138.77 from Chase once the Citi loan is moved there, Citi untouched, once a month across reloads; Citi, refused for the loan before, then closes', () => {
    let sim = student('g14-loan');
    const chase = primaryId(sim);
    const citi = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId;
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase, toId: citi, amount: 100_00 });
    sim.advanceTo(sent.arrivesAt + MINUTE);
    // TEST SETUP: a month's wages paid in, for the lender to read.
    wages(sim, chase, 5_000_00);
    const loan = run<{ loanId: string; apr: number; payment: number }>(sim, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'us-citi', intoId: chase, repayFromId: citi });
    expect([loan.apr, loan.payment]).toEqual([0.1024, 138_77]);
    expect(refused(sim, 'bank.close_current', { accountId: citi, remainderTo: chase })).toBe('Citi Personal Loan’s payments come from it. Move it first.');
    expect(run<{ repayFromId: string }>(sim, 'bank.set_loan_repayment', { loanId: loan.loanId, accountId: chase }).repayFromId).toBe(chase);
    sim = reload(sim);
    expect(acct(sim, loan.loanId).repayFromId).toBe(chase);

    const due = sim.universe.scheduled.find((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending' && i.refId === loan.loanId)!.at;
    expect(due).toBe(at(2026, 9, 27, 7, 31));
    sim.advanceTo(due - MINUTE);
    const was = { chase: acct(sim, chase).balance, citi: acct(sim, citi).balance };
    sim.advanceTo(due + MINUTE);
    // $3,000 × 10.24% / 12 = $25.60 of interest, then the $138.77 from Chase.
    expect(postingsTo(sim, loan.loanId, due - MINUTE).map((p) => [p.memo, p.amount])).toEqual([['Interest: Citi Personal Loan', -25_60], ['Payment: Citi Personal Loan', 138_77]]);
    expect(acct(sim, chase).balance).toBe(was.chase - 138_77);
    expect(acct(sim, citi).balance).toBe(was.citi);
    expect(acct(sim, loan.loanId).balance).toBe(-3_000_00 - 25_60 + 138_77);

    // The loan keeps Chase open now: with Citi primary, Chase's close names it among what still uses it.
    run(sim, 'bank.set_primary', { accountId: citi });
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: citi })).toBe('Your wages and other payments are paid into it. Your everyday card’s autopay pays from it. Citi Personal Loan’s payments come from it. Move them first.');
    run(sim, 'bank.set_primary', { accountId: chase });
    // Nothing of the loan keeps Citi open now: it closes, what it holds to Chase.
    run(sim, 'bank.close_current', { accountId: citi, remainderTo: chase });
    expect(acct(sim, citi).closedAt).toBe(sim.now);
    sim = reload(sim);
    const second = sim.universe.scheduled.find((i) => i.kind === LOAN_DUE_KIND && i.status === 'pending' && i.refId === loan.loanId)!.at;
    sim.advanceTo(second - MINUTE);
    const chaseThen = acct(sim, chase).balance;
    sim.advanceTo(second + MINUTE);
    // $2,886.83 × 10.24% / 12 = $24.63, rounded; one more $138.77 from Chase.
    expect(postingsTo(sim, loan.loanId, second - MINUTE).map((p) => [p.memo, p.amount])).toEqual([['Interest: Citi Personal Loan', -24_63], ['Payment: Citi Personal Loan', 138_77]]);
    expect(acct(sim, chase).balance).toBe(chaseThen - 138_77);
    expect(postingsTo(sim, chase).filter((p) => p.memo === 'Payment: Citi Personal Loan')).toHaveLength(2);
    expect(acct(sim, loan.loanId).balance).toBe(-3_000_00 - 25_60 + 138_77 - 24_63 + 138_77);
  });

  it('refuses a loan it doesn’t know, a savings account, Citi while it closes, and a loan paid off, leaving the repayment where it was', () => {
    let loanId = '';
    const { sim, chase, citi } = citiClosing('g14-citi-loan', (s, c) => {
      // TEST SETUP: a month's wages paid in, for the lender to read.
      wages(s, c, 5_000_00);
      loanId = run<{ loanId: string }>(s, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'us-citi', intoId: c, repayFromId: c }).loanId;
    });
    expect(refused(sim, 'bank.set_loan_repayment', { loanId, accountId: citi })).toBe('Citi Access Checking is closing.');
    expect(refused(sim, 'bank.set_loan_repayment', { loanId: 'account_nobody', accountId: chase })).toBe('That isn’t an open loan of yours.');
    expect(refused(sim, 'bank.set_loan_repayment', { loanId, accountId: savingsAt(sim, 'us-chase').id })).toBe('A loan is repaid from an open current account of yours.');
    expect(acct(sim, loanId).repayFromId).toBe(chase);
    run(sim, 'bank.repay_loan', { loanId });
    expect(acct(sim, loanId).closedAt).toBe(sim.now);
    expect(refused(sim, 'bank.set_loan_repayment', { loanId, accountId: chase })).toBe('That isn’t an open loan of yours.');
  });

  it('shows the loan repaid from Citi; Repay From There, Chase chosen and pressed, moves it, and the panel says Chase', () => {
    const sim = student('g14-loan-ui');
    const chase = primaryId(sim);
    const citi = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId;
    // TEST SETUP: a month's wages paid in, for the lender to read.
    wages(sim, chase, 5_000_00);
    const loanId = run<{ loanId: string }>(sim, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'us-citi', intoId: chase, repayFromId: citi }).loanId;
    const panel = () => render(sim, createElement(BankLending, { bank: bankById('us-citi')!, account: acct(sim, citi), show: ['borrowing'] }));
    const first = panel();
    expect(first.words).toContain('$3,000 owed at 10.24% a year, $139 a month over the 24 months it was taken for, next on September 24, 2026 , from Citi Access Checking at Citi. A change of primary account doesn’t move it.');
    expect(control('bank.set_loan_repayment', 'Repay From There').disabled).toBe(true);
    // TEST SETUP: Chase chosen in Repaid From (BankLending's second state).
    h.states = [h.keep, chase];
    panel();
    press(control('bank.set_loan_repayment', 'Repay From There'));
    expect(acct(sim, loanId).repayFromId).toBe(chase);
    expect(panel().words).toContain('from Chase Total Checking at Chase. A change of primary account doesn’t move it.');
  });
});

// ---------------------------------------------------------------------------
// bank.close_current
// ---------------------------------------------------------------------------

describe('bank.close_current', () => {
  it('refuses Chase as her only current account, then as her primary, then overdrawn by $15.00 once its fee falls on it empty, until she pays it in', () => {
    const sim = student('g14-close-only');
    const chase = primaryId(sim);
    expect(refused(sim, 'bank.close_current', { accountId: chase })).toBe('It’s your only current account. Open another one first: you always need a current account to be paid into.');
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('It’s your primary account. Make another account primary first.');
    run(sim, 'bank.set_primary', { accountId: cap });
    for (const c of cardsOf(sim, sim.player)) run(sim, 'card.set_autopay_from', { cardId: c.id, accountId: cap });
    run(sim, 'bank.redirect_deposits', { accountId: cap });
    run(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase').id });
    run(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: acct(sim, chase).balance });
    sim.advanceTo(at(2026, 9, 1));
    // Chase Total Checking's $15 on 31 August, on an account at nothing.
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('It’s overdrawn by $15.00. The bank only closes it once that’s paid off.');
    expect(acct(sim, chase).closedAt).toBeUndefined();
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: cap, toId: chase, amount: 15_00 });
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('It’s overdrawn by $15.00. The bank only closes it once that’s paid off.');
    // Wages reach Capital One from 7 September (the change's 14 days), and the $15 has landed by then.
    sim.advanceTo(Math.max(sent.arrivesAt, at(2026, 9, 7, 8)) + MINUTE);
    expect(acct(sim, chase).balance).toBe(0);
    const closed = run<{ closedAt: number; arrivesAt?: number }>(sim, 'bank.close_current', { accountId: chase });
    expect(closed).toEqual({ closedAt: sim.now });
    expect(acct(sim, chase).closedAt).toBe(sim.now);
  });

  it('names a payment set for a date and then the savings beside it; holding $2,300.00 and told nowhere, it asks where; named, the $2,300.00 arrives at Capital One whole in Chase’s three business days, once, across a reload', () => {
    let sim = student('g14-remainder');
    const chase = primaryId(sim);
    const savings = savingsAt(sim, 'us-chase').id;
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    run(sim, 'bank.set_primary', { accountId: cap });
    for (const c of cardsOf(sim, sim.player)) run(sim, 'card.set_autopay_from', { cardId: c.id, accountId: cap });
    run(sim, 'bank.redirect_deposits', { accountId: cap });
    leaveAtChase(sim, cap, 2_000_00, 300_00);
    const scheduled = run<{ id: string }>(sim, 'bank.schedule_payment', { fromId: chase, toId: savings, amount: 10_00, at: at(2026, 10, 1) }).id;
    sim.advanceTo(at(2026, 9, 7, 12));
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('A payment set for a date uses it. Move it first.');
    run(sim, 'bank.cancel_scheduled', { id: scheduled });
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('Chase Savings is still open at the same bank. Close that first.');
    // The savings' $300.00 into the current account beside it: $2,300.00, untouched since 24 August by any fee (its
    // $1,500 and $300 floors kept) or interest (Chase Total Checking pays none, and $300 at 0.01% earns no cent).
    run(sim, 'bank.close_savings', { accountId: savings });

    const held = acct(sim, chase).balance;
    expect(held).toBe(2_300_00);
    expect(refused(sim, 'bank.close_current', { accountId: chase })).toBe('Choose which of your accounts the $2,300.00 goes to.');
    expect(acct(sim, chase).closedAt).toBeUndefined();

    const closedAt = sim.now;
    const closed = run<{ closedAt: number; arrivesAt: number }>(sim, 'bank.close_current', { accountId: chase, remainderTo: cap });
    expect(closed.closedAt).toBe(closedAt);
    // Chase's three business days from Monday 7 September, Labor Day, which isn't one: Thursday 10 September at noon.
    expect(closed.arrivesAt).toBe(at(2026, 9, 10, 12));
    expect(acct(sim, chase).balance).toBe(0);
    expect(inTransitOf(sim, sim.player).balance).toBe(held);
    sim = reload(sim);
    sim.advanceTo(closed.arrivesAt - MINUTE);
    const capBefore = acct(sim, cap).balance;
    expect(postingsTo(sim, cap, closedAt).filter((p) => p.memo === 'From Chase Total Checking')).toEqual([]);
    sim.advanceTo(closed.arrivesAt + MINUTE);
    expect(acct(sim, cap).balance).toBe(capBefore + held);
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
    sim = reload(sim);
    sim.advanceTo(closed.arrivesAt + 3 * MS_DAY);
    expect(postingsTo(sim, cap, closedAt).filter((p) => p.memo === 'From Chase Total Checking').map((p) => p.amount)).toEqual([held]);
    // Its history kept, its statements ending at its closing.
    expect(postingsTo(sim, chase).length).toBeGreaterThan(3);
    const last = periodsOf(sim, acct(sim, chase))[0]!; // newest first
    expect([last.to, last.label]).toEqual([closedAt, 'September 2026, To Its Closing']);
    expect(checkingsOf(sim, sim.player).map((a) => a.id)).toEqual([cap]);
  });

  it('keeps Citi open while its groceries are pending, refuses a second close, and on its date leaves it open with a Didn’t Close notice, its $5 fee having overdrawn the $2.00 in it; paid in, it closes', () => {
    const journey = citiClosing('g14-citi-close');
    const { chase, citi, closingAt } = journey;
    let { sim } = journey;
    // The 29th's groceries post two business days on, Thursday 1 October at midnight; it closes a minute after.
    expect(closingAt).toBe(at(2026, 10, 1, 0, 1));
    expect(acct(sim, citi).closingAt).toBe(closingAt);
    expect(acct(sim, citi).closedAt).toBeUndefined();
    expect(refused(sim, 'bank.close_current', { accountId: citi, remainderTo: chase })).toBe('Citi Access Checking is already closing on October 1, 2026.');
    sim = reload(sim);
    // Citi Access Checking's $5 a month on 30 September: no direct deposit into it, and she is 24, past its 23-and-under.
    sim.advanceTo(closingAt - MINUTE);
    expect(acct(sim, citi).balance).toBe(2_00 - 5_00);
    sim.advanceTo(closingAt + MINUTE);
    expect(acct(sim, citi).closedAt).toBeUndefined();
    expect(acct(sim, citi).closingAt).toBeUndefined();
    expect(sim.universe.notifications.filter((n) => n.title === 'Citi Access Checking Didn’t Close').map((n) => n.body)).toEqual(['Payments that posted in the meantime left it overdrawn, so it’s still open. Pay in what’s owed, then close it again.']);
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
    sim = reload(sim);
    sim.advanceTo(closingAt + MS_DAY);
    expect(sim.universe.notifications.filter((n) => n.title === 'Citi Access Checking Didn’t Close')).toHaveLength(1);

    // Paid in: $10 from Chase, in Chase's days; then asked again, it closes, the $7.00 left in it to Chase.
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase, toId: citi, amount: 10_00 });
    sim.advanceTo(sent.arrivesAt + MINUTE);
    expect(acct(sim, citi).balance).toBe(7_00);
    const closed = run<{ closedAt: number; arrivesAt: number }>(sim, 'bank.close_current', { accountId: citi, remainderTo: chase });
    expect(closed.closedAt).toBe(sim.now);
    sim.advanceTo(closed.arrivesAt - MINUTE);
    const chaseBefore = acct(sim, chase).balance;
    sim.advanceTo(closed.arrivesAt + MINUTE);
    expect(acct(sim, chase).balance - chaseBefore).toBe(7_00);
  });

  it('shows what keeps Chase open under it with Close It shut; once they’re moved, Close It, pressed, sends its $2,300.00 to Capital One, and the panel shows it on its way', () => {
    const sim = student('g14-close-ui');
    const chase = primaryId(sim);
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    leaveAtChase(sim, cap, 2_000_00, 300_00);
    run(sim, 'bank.set_primary', { accountId: cap });
    sim.advanceTo(at(2026, 8, 27, 8));
    const shut = 'Your wages and other payments are paid into it. Your everyday card’s autopay pays from it. Move them first.';
    expect(moves(sim).words).toContain(`You can’t close it yet. ${shut}`);
    expect(control('bank.close_current', 'Close It')).toMatchObject({ disabled: true, title: shut });

    for (const c of cardsOf(sim, sim.player)) run(sim, 'card.set_autopay_from', { cardId: c.id, accountId: cap });
    run(sim, 'bank.redirect_deposits', { accountId: cap });
    run(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase').id });
    // The change of wages reaches its last payer 14 days on, Thursday 10 September.
    sim.advanceTo(at(2026, 9, 10, 12));
    expect(acct(sim, chase).balance).toBe(2_300_00);
    const open = moves(sim);
    expect(open.words).toContain('Send What It Holds To');
    expect(new RegExp(`<select id="close-into-${chase}"[^>]*>.*?<option value="${cap}" selected=""`).test(open.html)).toBe(true);
    press(control('bank.close_current', 'Close It'));
    expect(acct(sim, chase).closedAt).toBe(sim.now);
    // Chase's three business days from Thursday 10 September: Tuesday 15 September at noon.
    expect(transfersOf(sim, sim.player)).toEqual([expect.objectContaining({ fromId: chase, toId: cap, amount: 2_300_00, at: at(2026, 9, 15, 12) })]);
    const after = moves(sim);
    expect(after.words).not.toContain('Chase Total Checking at Chase');
    expect(after.words).toContain('$2,300 from Chase Total Checking to 360 Checking, arriving September 15, 2026.');
  });
});
