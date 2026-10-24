/**
 * The current scope's money rows (2026-10-15): nine bank commands and scheduled kinds the review of 2026-10-13 left
 * unresolved, and Home's Money line. Every new life is made at the school in New Haven, at one of five American banks,
 * and since the scope reset of 2026-10-09 nothing moves a life from where it lives; no family creation offers changes
 * that. So what needs a bank outside the United States (an arranged overdraft, a cooling-off period, a switching
 * service, a French overrun, a card's money transfer, a German savings allowance) is reached by no played life. What a
 * New Haven student does meet of each row is played here; the rest is played on quick-save lives abroad, labeled
 * FIXTURE, which no life the game makes is.
 *
 * - `bank.arrange_overdraft`: at each New Haven bank the request is refused in the bank's words and nothing is set or
 *   posted, across a reload, and Chase's Overdraft panel draws no Arrange It. In London, twins at Barclays £500 under
 *   for 61 days: the one with £2,000 arranged keeps its account, the other is charged off, so the 60 days are counted
 *   past the arranged limit; Arrange It, Close The Overdraft and their refusals pressed on the panel.
 * - `bank.cancel_new`: no Cancel It for a New Haven account, the US having no cooling-off. In Toronto a new RBC card
 *   refused, Canada giving a card none (canceled, owing nothing and owing £120, in London instead, from 2026-10-15's
 *   recheck: until then in Toronto); and a new RBC chequing account, whose Cancel It is drawn, grayed with the
 *   reason under it while Close It's refusals hold, and pressed; and one charged RBC's month and canceled, the fee
 *   refunded, as Canada has it. In Berlin a Commerzbank account's month charged on canceling, and refused on the panel
 *   while it's more than the account holds; in Reykjavík a Landsbankinn account's interest, paid on canceling until the
 *   later pass of 2026-10-15, going back unpaid now, as Iceland's rule has it. From that pass: a NatWest saver's interest
 *   kept in London, a Deutsche Bank Flexgeld's quarter's interest posted back in Berlin, an RBC saver's withdrawal fee
 *   refunded in Toronto, and no Cancel It for a new Korean deposit in Seoul. From that day's recheck: the Flexgeld's
 *   interest taxed, the allowance used, and its tax posted back; a Deutsche Bank term's interest taken into a Commerzbank
 *   primary and refused until the primary holds it; an RBC account's charges refunded without its overdraft interest; and
 *   in Mexico City a Banorte saver's interest going back on the tenth business day, and a Santander account's charge
 *   refunded, unused, and refused once used. From that day's second recheck: the Commerzbank primary a cent short refused
 *   too; a second Deutsche Bank term canceled without taking back the first's interest; and in Toronto and Berlin a
 *   saver canceled at 11:30 PM on its last day and refused a minute past the midnight after.
 * - `bank.close_current`: a Commerzbank account in Berlin refused Close It while its closing fees are more than it holds.
 * - `bank.switch`: the New Haven student is told for a photo ID first, as a new bank asks, then with a passport given
 *   the steps, and Your Banks draws them. `bank.switch_complete`, `bank.cancel_switch` and `bank.stop_balance_transfer`
 *   on Britain's Current Account Switch Service, their controls pressed on the Switch Bank panel; a switch on 14 January
 *   held back the £20 of groceries still pending, as the bank does.
 * - `bank.savings_notice`: Postbank savings on notice in Berlin, and Deutsche Bank's left on notice by a switch.
 * - `bank.take_overrun_loan`: BNP Paribas' offer reached by the clock and taken on its panel, against a twin who left it.
 * - `card.money_transfer`: none on a New Haven card; NatWest's pressed in London, and a payment split by the rates.
 * - `h-money`: the "No account" fallback tested as the guard it is, and a student played across her month ends with
 *   reloads against a twin played straight: interest, income records, the worth and the line agree, counted once.
 *
 * Defects these tests showed, each failing until the engine was fixed on 2026-10-15:
 * - `bank.arrange_overdraft` with a limit of 0 on an account with nothing arranged answered as closed and changed
 *   nothing, at every New Haven bank; it's refused now, "No overdraft is arranged on it."
 * - `bank.cancel_new` asked a current account only whether anything used it, so one overdrawn closed with its debt; it
 *   asks Close It's refusals now. And Your Accounts Over Time offered savings and cards only, so that branch of the
 *   command had no control; a new current account other than the primary is offered now. And it closed a current
 *   account with no interest paid and no fees charged, where the guide said it closed as Close It does; it settles
 *   both now, and in Canada refunds the fees (Berlin, Reykjavík and Toronto, each failing without its part).
 * - In that day's later pass: `bank.cancel_new` kept a savings account's interest from it everywhere and paid a current
 *   account's everywhere; it follows each country's rule now (London, Berlin's Flexgeld, Reykjavík). It refunded a
 *   Canadian savings account's charges never (Toronto), and Korea's deposits had a cooling-off its rule doesn't give
 *   (Seoul). `bank.close_current` closed a German account overdrawn by the fees closing charged (Berlin).
 * - In that day's recheck: `bank.cancel_new` took a term's interest back out of the primary account it was taken into
 *   without asking whether the primary held it (Berlin, −€6.30); refunded Canada's overdraft interest with its charges
 *   (Toronto, C$23.76 where C$21.95 is right); counted Canada's and Mexico's periods in calendar days (Mexico City); gave
 *   a Canadian card fourteen days (London's card test, Toronto's half); and canceled a Mexican account however used.
 * - In that day's second recheck: `bank.cancel_new` found a term's taken interest by its memo, which every term at the
 *   bank shares, so canceling a new Deutsche Bank term took back an older one's (Berlin, two terms); and the period
 *   ended at the hour the account opened on its last day, not at the day's end (Toronto and Berlin).
 * - `bank.savings_notice`'s "… Closed" named the primary account wherever the money went: Deutsche Bank's AktivKonto
 *   for savings paid into the Postbank account beside it.
 * - `bank.take_overrun_loan` left the days toward closing running from the overrun's first day, so a life spending on
 *   into the account before the next midnight was closed two months after the notice though its overrun was a loan:
 *   the twin that took it, run without the fix, was closed on 7 May 2026.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`, the family chosen as creation's select chooses it),
 * Ada Cole at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, born in New York, at the bank chosen at creation.
 * FIXTURES: `quickSave` lives in London, Toronto, Berlin, Paris, Reykjavík, Seoul and Mexico City, from 5 January 2026. The bank's panels and Home are
 * the game's own, rendered with react-dom/server, their buttons pressed and fields typed through their own handlers;
 * `useGame` stands in for the provider, its `run` the save's own `execute`. Seeds are arbitrary.
 *
 * TEST SETUP, said again where it's done: a month's wages posted, which a bank arranges against; a balance set by a
 * posting against a test line (an overdraft, savings emptied, Postbank savings funded); purchases put on a card; and,
 * for the guard, a save's primary account forgotten and its accounts closed by hand. From 2026-10-15's recheck:
 * Mexico's holidays read from disk, as the app fetches them; a German year's €1,000 of interest posted, to use its
 * allowance; and a Santander charge posted by hand, which no Mexican bank here charges inside the period.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { bankById } from '@/engine/content/banks';
import { LOAN_DUE_KIND, SWITCH_KIND, SWITCH_REVIEW_KIND } from '@/engine/systems/lending';
import { yearOf, earningsOf } from '@/engine/systems/earnings';
import { netWorth } from '@/engine/systems/finance';
import { cardRoom, stateOf } from '@/engine/systems/credit';
import { photoIdOf } from '@/engine/systems/documents';
import { addCountryHolidays } from '@/engine/content/holidays';
import { readFileSync } from 'node:fs';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** Where `navigate` was sent, with its label. */
  went: [] as unknown[][],
  /** Each useState in render order: its number this render, what a press set, and what's given back next render. */
  calls: 0,
  sets: [] as { at: number; value: unknown }[],
  given: new Map<number, unknown>(),
  /** The buttons drawn, with their words, their own onClick and whether they're disabled. */
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => unknown }[],
  /** The fields drawn, by id, with their own onChange. */
  fields: [] as { id?: string; onChange?: (e: { target: { value: string; checked?: boolean } }) => unknown }[],
  answers: [] as { kind: string; ok: boolean; error?: string }[],
}));

// What a press sets is given back by the useState's place in the render, as React keeps it.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const i = h.calls++;
    const [value] = real.useState(initial);
    const now = h.given.has(i) ? h.given.get(i) : value;
    const set = (action: unknown) => { h.sets.push({ at: i, value: typeof action === 'function' ? (action as (v: unknown) => unknown)(now) : action }); };
    return [now, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children).replace(/\s+/g, ' ').trim(), disabled: Boolean(props.disabled), title: props.title as string | undefined, onClick: props.onClick as (() => unknown) | undefined });
    if ((type === 'input' || type === 'select') && props) h.fields.push({ id: props.id as string | undefined, onChange: props.onChange as never });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));

// Without the original: it imports the looks, which import it back.
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
    toast: noop,
    navigate: (...args: unknown[]) => { h.went.push(args); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { Home } = await import('@/ui/screens/Home');
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { BankLending } = await import('@/ui/bank/BankLending');
const { BankMoves } = await import('@/ui/bank/BankMoves');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');
const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');

// TEST SETUP: Mexico's holidays, which the app fetches for a save's countries when it opens (`loadPlacesFor`), read from
// disk, so a día hábil is counted as the bank counts it.
addCountryHolidays('mx', readFileSync('public/holidays/mx.tsv', 'utf8'));

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the ledger
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** An instant of New Haven's wall clock. */
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York, from the family chosen on creation, with the bank chosen there. */
const ada = (seed: string, family: StartingWealth = 'wealthy', extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...withFamily(newLifeConfig(), family), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** FIXTURE: a quick-save life banking where no new life lives. */
const abroad = (cityId: string, bankId: string, seed: string, wealth: StartingWealth = 'comfortable'): Simulation =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, wealth, bankId }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation): Account[] => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id);
const savingsAt = (sim: Simulation, bankId: string): Account | undefined => mine(sim).find((a) => !a.closedAt && a.kind === 'savings' && a.category !== 'term' && a.bankId === bankId);
const checkingAtBank = (sim: Simulation, bankId: string): Account | undefined => mine(sim).find((a) => !a.closedAt && a.kind === 'checking' && a.bankId === bankId);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What each posting with this memo put on one account. */
const postedTo = (sim: Simulation, memo: string, id: string) => sim.universe.transactions.filter((t) => t.memo === memo).flatMap((t) => t.postings).filter((p) => p.accountId === id).map((p) => p.amount);

/** What landed in `to` from `from` between banks: sent in the bank's days (“From …”) or at once (“To … at …”). */
const landed = (sim: Simulation, from: Account, to: Account) => [...postedTo(sim, `From ${from.name}`, to.id), ...postedTo(sim, `To ${to.name} at ${bankById(to.bankId!)!.name}`, to.id)];
/** A command through the engine that must go, and what it answered. */
function ok<T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
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
/** TEST SETUP: a month's wages paid into an account, which a bank arranges an overdraft against. */
const wages = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: id, amount }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -amount }] });
/** TEST SETUP: an account's balance set by a posting against a test line. */
function setTo(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}

/** The words a player reads: titles out, tags out, entities back, and no space before a full stop or a comma. */
const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
/** A screen as the player has it, with what a press or a field set given back. */
function drawn(sim: Simulation, element: ReactElement): string {
  h.sim = sim;
  h.calls = 0;
  h.sets = [];
  h.buttons = [];
  h.fields = [];
  return words(renderToStaticMarkup(element).replace(/<!-- -->/g, ''));
}
/** The buttons just drawn with these words. */
const buttons = (said: string) => h.buttons.filter((b) => b.text === said);
/** Pressed: its own onClick, and what it set given back on the next render. */
function press(said: string): unknown {
  const found = buttons(said);
  expect(found.length, `“${said}” is drawn (drawn: ${h.buttons.map((b) => b.text).join(' | ')})`).toBe(1);
  expect(found[0]!.disabled, `“${said}” can be pressed`).toBe(false);
  h.sets = [];
  const out = found[0]!.onClick!();
  for (const s of h.sets) h.given.set(s.at, s.value);
  return out;
}
/** Pressed: the button with these words drawn next after the one naming `after` (an account's name, say). */
function pressAfter(after: string, said: string): void {
  const i = h.buttons.findIndex((b) => b.text === after);
  expect(i, `“${after}” is drawn`).toBeGreaterThanOrEqual(0);
  const next = h.buttons.slice(i + 1).find((b) => b.text === said);
  expect(next, `“${said}” after “${after}”`).toBeDefined();
  expect(next!.disabled).toBe(false);
  h.sets = [];
  next!.onClick!();
  for (const s of h.sets) h.given.set(s.at, s.value);
}
/** The button with these words drawn next after the one naming `after`, unpressed. */
function buttonAfter(after: string, said: string) {
  const i = h.buttons.findIndex((b) => b.text === after);
  expect(i, `“${after}” is drawn`).toBeGreaterThanOrEqual(0);
  return h.buttons.slice(i + 1).find((b) => b.text === said)!;
}
/** Typed into a field, as its own onChange takes it, and given back on the next render. */
function type(id: string, value: string): void {
  const found = h.fields.filter((f) => f.id === id);
  expect(found, `field #${id}`).toHaveLength(1);
  h.sets = [];
  found[0]!.onChange!({ target: { value } });
  for (const s of h.sets) h.given.set(s.at, s.value);
}

beforeEach(() => {
  h.given = new Map();
  h.went = [];
  h.answers = [];
});

// ---------------------------------------------------------------------------
// h-money
// ---------------------------------------------------------------------------

describe('h-money', () => {
  /** Money's head, from its name to its tabs: Home's Your Affairs line said its worth until 2026-10-23 (brief 23). */
  const money = (sim: Simulation) => {
    const text = drawn(sim, createElement(BankWorkspace));
    const i = text.indexOf(' ‹ ');
    expect(i).toBeGreaterThanOrEqual(0);
    return text.slice(0, i).replace(/ ([.,])/g, '$1').trim();
  };

  // Renamed on 2026-10-23 (brief 23): until then “… draws “No account: $0.00.” and a “Your Bank” button that still opens
  // the bank”, Home's Money line, which went from Home that day.
  it('GUARD: a save whose primary account is gone, which no played life reaches, draws Money’s empty state, and Home with nothing of money to put right', () => {
    const sim = ada('scope-money-guard', 'nothing');
    // FIXTURE: the primary account forgotten by hand. tests/evidence3-home.test.ts plays why no life gets here: the bank
    // refuses to close a life's only current account, and a charge-off leaves the checking named.
    delete sim.player.primaryAccountId;
    for (const a of mine(sim)) if (!a.closedAt) a.closedAt = sim.now;
    expect(drawn(sim, createElement(BankWorkspace)).trim()).toBe('No Bank None of your money is at a bank the game covers, so there’s nothing to show here.');
    expect(drawn(sim, createElement(Home))).not.toContain('Open Money');
  });

  it('PLAYER JOURNEY: a Comfortable student played to 2 October 2026, reloaded a minute either side of each month’s end, keeps the same postings as her twin played straight: the savings’ interest posted once a month, the year’s interest income their sum, the month’s income that and her work-study pay, and Money’s worth the ledger’s own', () => {
    const straight = ada('scope-money-agree', 'comfortable');
    let kept = ada('scope-money-agree', 'comfortable');
    straight.advanceTo(at(2026, 10, 2, 12));
    // Played to a minute before and a minute after the month's end (23:00 on its last day, `monthEndAfter`), and opened
    // from its save at each.
    for (const [m, d] of [[8, 31], [9, 30]] as const) {
      kept.advanceTo(at(2026, m, d, 22, 59));
      kept = reload(kept);
      kept.advanceTo(at(2026, m, d, 23, 1));
      kept = reload(kept);
    }
    kept.advanceTo(at(2026, 10, 2, 12));
    const ledger = (sim: Simulation) => sim.universe.transactions.map((t) => `${t.at} ${t.memo} ${t.postings.map((p) => `${p.accountId}:${p.amount}`).join(',')}`);
    expect(ledger(kept)).toEqual(ledger(straight));
    for (const sim of [straight, kept]) {
      const savings = savingsAt(sim, 'us-chase')!;
      const interest = sim.universe.transactions.filter((t) => t.category === 'interest');
      // Once a month, at the month's end, on the savings account: August's and September's, not a third.
      expect(interest.map((t) => t.at)).toEqual([at(2026, 8, 31, 23), at(2026, 9, 30, 23)]);
      const paid = interest.map((t) => t.postings.find((p) => p.accountId === savings.id)!.amount);
      // Worked by hand from Chase Savings' 0.01% (content/banks) on the $45,652.00 it opened with, a day's interest built at
      // each day's end, on the balance then, and paid in whole cents at the month's end, the fraction carried:
      // August, the day-ends of the 24th to the 30th (the 31st's comes after 23:00), 7 × 4,565,200¢ × 0.0001 / 365 =
      // 8.755¢, 8¢ paid and 0.755¢ carried; September, 30 day-ends on 4,565,208¢, 30 × 1.25074¢ = 37.522¢, with the
      // 0.755¢ 38.277¢, 38¢ paid.
      expect(sim.universe.transactions.find((t) => t.memo === 'Opening balance: Chase Savings')!.postings.find((p) => p.accountId === savings.id)!.amount).toBe(45_652_00);
      expect(paid).toEqual([8, 38]);
      // The year's return and the month's income read each payment once.
      expect(yearOf(sim.player, 2026).interest).toBe(paid[0]! + paid[1]!);
      const months = earningsOf(sim.player).months;
      const kinds = earningsOf(sim.player).kinds!;
      expect([kinds['2026-08']!.unearned, kinds['2026-09']!.unearned]).toEqual(paid);
      // September's work-study pay is the other income: what was paid into her accounts for hours worked, added up here.
      const ids = new Set(mine(sim).map((a) => a.id));
      const septemberPay = sim.universe.transactions.filter((t) => / hours/.test(t.memo) && t.at >= at(2026, 9, 1, 0) && t.at < at(2026, 10, 1, 0))
        .flatMap((t) => t.postings).filter((p) => ids.has(p.accountId) && p.amount > 0).reduce((n, p) => n + p.amount, 0);
      // Worked by hand: three Fridays' pay in September, the 11th, 18th and 25th, each for the Saturday's six assigned
      // hours at Yale's $23.00, $138.00 each, $414.00, nothing withheld.
      expect(sim.universe.transactions.filter((t) => / hours/.test(t.memo) && t.at >= at(2026, 9, 1, 0) && t.at < at(2026, 10, 1, 0)).map((t) => zonedParts(t.at, NY).day)).toEqual([11, 18, 25]);
      expect(septemberPay).toBe(414_00);
      expect(kinds['2026-09']!.workStudy).toBe(septemberPay);
      expect([months['2026-08'], months['2026-09']]).toEqual([paid[0], paid[1]! + septemberPay]);
      // The worth at the head of Money (Home's line until 2026-10-23, brief 23) is what the accounts hold, added up here.
      const held = mine(sim).filter((a) => !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((n, a) => n + a.balance, 0);
      const owed = mine(sim).filter((a) => !a.closedAt && a.kind === 'credit_card').reduce((n, a) => n + Math.max(0, -a.balance), 0);
      expect(netWorth(sim, sim.player.id).total).toBe(held - owed);
      const c = primary(sim);
      const usd = (n: number) => `${n < 0 ? '−' : ''}$${(Math.abs(n) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      const whole = (n: number) => `$${Math.round(n / 100).toLocaleString('en-US')}`;
      expect(money(sim)).toContain(`Worth ${whole(held - owed)}${owed > 0 ? `, after ${whole(owed)} owed` : ''}.`);
      expect(drawn(sim, createElement(BankWorkspace))).toContain(`Chase Total Checking Chase ${c.number} How This Works Balance ${c.balance < 0 ? usd(c.balance) : whole(c.balance)} `);
    }
  }, 60_000);
});

// ---------------------------------------------------------------------------
// bank.arrange_overdraft
// ---------------------------------------------------------------------------

describe('bank.arrange_overdraft', () => {
  it('PLAYER JOURNEY: at each New Haven bank the request is refused in the bank’s words, a close of nothing is refused, and nothing is set or posted, across a reload; Chase’s Overdraft panel draws no Arrange It', () => {
    // LENDING (content/banks-lending.ts): Chase, Bank of America and Wells Fargo charge by the item; Citi and Capital One
    // have no overdraft terms.
    const said: Record<string, string> = {
      'us-chase': 'Chase doesn’t arrange overdrafts. It handles them its own way, as the Overdraft panel says.',
      'us-bank-of-america': 'Bank of America doesn’t arrange overdrafts. It handles them its own way, as the Overdraft panel says.',
      'us-wells-fargo': 'Wells Fargo doesn’t arrange overdrafts. It handles them its own way, as the Overdraft panel says.',
      'us-citi': 'No overdraft terms were found for Citi.',
      'us-capital-one': 'No overdraft terms were found for Capital One.',
    };
    for (const [bankId, words] of Object.entries(said)) {
      let sim = ada(`scope-od-${bankId}`, 'scraping', { bankId });
      expect(primary(sim).bankId).toBe(bankId);
      const before = sim.universe.transactions.length;
      expect(refusal(sim, 'bank.arrange_overdraft', { limit: 100_00 })).toBe(words);
      // Until 2026-10-15 a limit of 0 answered { limit: 0 } here, closing an overdraft nobody had.
      expect(refusal(sim, 'bank.arrange_overdraft', { limit: 0 })).toBe('No overdraft is arranged on it.');
      for (const one of [sim, sim = reload(sim)]) {
        expect(one.universe.transactions.length).toBe(before);
        expect(primary(one).overdraftLimit).toBeUndefined();
        expect(primary(one).overdraftSince).toBeUndefined();
      }
    }
    const sim = ada('scope-od-us-chase', 'scraping', { bankId: 'us-chase' });
    const text = drawn(sim, createElement(BankLending, { bank: bankById('us-chase')!, show: ['borrowing'] }));
    expect(text).toContain('Chase pays what the account can’t cover without an arrangement, and charges $34.00 for each item that overdraws it');
    expect(buttons('Arrange It')).toEqual([]);
    expect(buttons('Close The Overdraft')).toEqual([]);
    expect(h.fields.filter((f) => f.id === 'od-limit')).toEqual([]);
  });

  it('FIXTURE, London: twins £500 overdrawn at Barclays for 61 days, one with £2,000 arranged: the other’s account is charged off and closed at 60, the arranged one stays open with no day counted against it', () => {
    const twin = (arranged: boolean) => {
      const sim = abroad('uk-eng-london', 'gb-barclays', 'scope-od-left');
      wages(sim, primary(sim).id, 2_000_00); // TEST SETUP
      if (arranged) expect(ok(sim, 'bank.arrange_overdraft', { limit: 2_000_00 })).toEqual({ limit: 2_000_00, rate: 0.35 });
      // TEST SETUP: savings emptied, so nothing is set off, and the current account £500 under.
      for (const a of mine(sim)) if (a.kind === 'savings' && !a.closedAt) setTo(sim, a, 0);
      setTo(sim, primary(sim), -500_00);
      return sim;
    };
    const plain = twin(false);
    const covered = twin(true);
    const barclays = primary(plain).id;
    const start = plain.now;
    for (const sim of [plain, covered]) sim.advanceTo(start + 61 * MS_DAY);
    // Past no limit for 60 days (ESTIMATE.closeAfterDays, SLATE's estimate): closed, and what it owed in collections.
    expect(plain.universe.accounts[barclays]!.closedAt).toBeDefined();
    expect(titled(plain, 'Barclays Closed Your Account')).toHaveLength(1);
    expect(mine(plain).some((a) => a.category === 'collections' && a.balance < 0)).toBe(true);
    // Within £2,000 arranged, never past it: no day counted, nothing closed, nothing owed elsewhere.
    const kept = primary(covered);
    expect(kept.id).toBe(barclays);
    expect(kept.balance).toBeLessThan(0);
    expect(kept.balance).toBeGreaterThanOrEqual(-2_000_00);
    expect(kept.closedAt).toBeUndefined();
    expect(kept.negativeSince).toBeUndefined();
    expect(titled(covered, 'Barclays Closed Your Account')).toEqual([]);
    expect(mine(covered).some((a) => a.category === 'collections')).toBe(false);
  }, 60_000);

  it('FIXTURE, London: Arrange It pressed with £1,000 typed on Barclays’ panel; lowered to £100 while £300 under, refused; Close The Overdraft refused until it’s paid back, then closed, across a reload', () => {
    let sim = abroad('uk-eng-london', 'gb-barclays', 'scope-od-panel');
    wages(sim, primary(sim).id, 2_000_00); // TEST SETUP
    const barclays = bankById('gb-barclays')!;
    const panel = () => drawn(sim, createElement(BankLending, { bank: barclays, show: ['borrowing'] }));
    // A month of wages paid in, £2,000, is what SLATE's estimate lets it arrange; Barclays' rate is 35%.
    expect(panel()).toContain('You don’t have one arranged. 35% a year on what’s used. The first £15 is free.');
    expect(panel()).toContain('It would arrange up to £2,000 at 35%');
    type('od-limit', '1000');
    panel();
    press('Arrange It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.arrange_overdraft', ok: true });
    sim = reload(sim);
    expect(primary(sim)).toMatchObject({ overdraftLimit: 1_000_00, overdraftRate: 0.35 });
    expect(panel()).toContain('Arranged to £1,000 at 35% a year.');
    // Move Money of all it holds into savings, and TEST SETUP: £300 spent into the overdraft (Move Money won't overdraw).
    const savings = savingsAt(sim, 'gb-barclays')!;
    ok(sim, 'bank.transfer', { fromId: primary(sim).id, toId: savings.id, amount: primary(sim).balance });
    setTo(sim, primary(sim), -300_00);
    expect(refusal(sim, 'bank.arrange_overdraft', { limit: 100_00 })).toBe('You’re overdrawn by more than that already.');
    panel();
    press('Close The Overdraft');
    expect(h.answers.at(-1)).toEqual({ kind: 'bank.arrange_overdraft', ok: false, error: 'Pay the overdraft back before closing it.' });
    expect(primary(sim).overdraftLimit).toBe(1_000_00);
    ok(sim, 'bank.transfer', { fromId: savings.id, toId: primary(sim).id, amount: 300_00 });
    panel();
    press('Close The Overdraft');
    expect(h.answers.at(-1)).toMatchObject({ ok: true });
    sim = reload(sim);
    expect(primary(sim).overdraftLimit).toBeUndefined();
    expect(panel()).toContain('You don’t have one arranged.');
    expect(buttons('Close The Overdraft')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// bank.cancel_new
// ---------------------------------------------------------------------------

describe('bank.cancel_new', () => {
  it('PLAYER JOURNEY: a New Haven savings account opened that morning can’t be canceled new: the US gives no cooling-off period, the panel draws no Cancel It, and the command is refused with the account left open', () => {
    let sim = ada('scope-cancel-us', 'modest');
    const old = savingsAt(sim, 'us-chase')!;
    ok(sim, 'bank.close_savings', { accountId: old.id });
    const opened = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', {}).accountId]!;
    expect(opened.openedAt).toBe(sim.now);
    drawn(sim, createElement(BankAccountLife, { bankId: 'us-chase' }));
    expect(buttons('Cancel It')).toEqual([]);
    expect(refusal(sim, 'bank.cancel_new', { accountId: opened.id })).toBe('Its cooling-off period has passed, or there isn’t one here for it.');
    sim = reload(sim);
    expect(sim.universe.accounts[opened.id]!.closedAt).toBeUndefined();
  });

  /**
   * Until 2026-10-15's recheck this was played in Toronto, where a Canadian card had fourteen days to cancel it in.
   * Canada's regulation prescribes none for a card (SOR/2021-181, `inCoolingOff`), so an RBC card now shows no Cancel It
   * and is refused; the card's branch is played in London, where a regulated credit agreement can be withdrawn from in
   * fourteen days (Consumer Credit Act 1974 s.66A).
   */
  it('FIXTURE, London: a Barclays card applied for and canceled the day it comes, owing nothing, closes; its twin with £120 spent on it is closing, with no room, the £120 still owed; in Toronto an RBC card has no Cancel It, Canada giving a card no cooling-off', () => {
    const played = (spent: number) => {
      const sim = abroad('uk-eng-london', 'gb-natwest', 'scope-cancel-card');
      const applied = ok<{ approved: boolean }>(sim, 'card.apply', { bankId: 'gb-barclays' });
      expect(applied.approved).toBe(true);
      sim.advanceTo(sim.player.credit!.applied!.arrivesAt + MS_HOUR);
      const card = mine(sim).find((a) => a.kind === 'credit_card' && a.bankId === 'gb-barclays' && !a.closedAt)!;
      // TEST SETUP: purchases put on it.
      if (spent) sim.post({ memo: 'Purchases', category: 'shopping', postings: [{ accountId: card.id, amount: -spent }, { accountId: sim.nominalAccount('expense', 'Shopping').id, amount: spent }] });
      const text = drawn(sim, createElement(BankAccountLife, { bankId: 'gb-natwest' }));
      expect(text).toContain(`${card.name} is new enough to cancel, until`);
      expect(text).toContain('with anything spent still to repay.');
      pressAfter(card.name, 'Cancel It');
      expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
      return { sim, card: sim.universe.accounts[card.id]! };
    };
    const clean = played(0);
    expect(clean.card.closedAt).toBe(clean.sim.now);
    const owing = played(120_00);
    expect(owing.card.closedAt).toBeUndefined();
    expect(owing.sim.player.credit!.cards![owing.card.id]!.closing).toBe(owing.sim.now);
    expect(owing.card.balance).toBe(-120_00);
    expect(cardRoom(owing.sim.player, owing.card)).toBe(0);

    const ca = abroad('ca-on-toronto', 'ca-td', 'scope-cancel-card-ca');
    expect(ok<{ approved: boolean }>(ca, 'card.apply', { bankId: 'ca-rbc' }).approved).toBe(true);
    ca.advanceTo(ca.player.credit!.applied!.arrivesAt + MS_HOUR);
    const rbcCard = mine(ca).find((a) => a.kind === 'credit_card' && a.bankId === 'ca-rbc' && !a.closedAt)!;
    expect(drawn(ca, createElement(BankAccountLife, { bankId: 'ca-td' }))).not.toContain(`${rbcCard.name} is new enough to cancel`);
    expect(refusal(ca, 'bank.cancel_new', { accountId: rbcCard.id })).toBe('Its cooling-off period has passed, or there isn’t one here for it.');
    expect(rbcCard.closedAt).toBeUndefined();
  });

  it('FIXTURE, Toronto: an RBC chequing account opened beside TD shows Cancel It; refused while a payment set for a date uses it and while it’s overdrawn, then canceled, its C$50 sent to TD in RBC’s days, across a reload', () => {
    let sim = abroad('ca-on-toronto', 'ca-td', 'scope-cancel-current');
    const rbc = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-rbc' }).accountId]!;
    const td = primary(sim);
    expect(rbc.openedAt).toBe(sim.now);
    // Until 2026-10-15 the panel offered savings and cards only, so this branch of the command had no control.
    const text = drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }));
    expect(text).toContain(`${rbc.name} is new enough to cancel, until`);
    expect(text).toContain('its money back with its interest, and its fees refunded.');
    expect(buttonAfter(rbc.name, 'Cancel It').disabled).toBe(false);
    const set = ok<{ id: string }>(sim, 'bank.schedule_payment', { fromId: rbc.id, toId: td.id, amount: 10_00, at: sim.now + 5 * MS_DAY });
    expect(refusal(sim, 'bank.cancel_new', { accountId: rbc.id })).toBe('A payment set for a date uses it. Move that to another account first.');
    // The panel while it's refused: the reason said under it, and Cancel It grayed with the same words.
    const held = drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }));
    expect(held).toContain(`${rbc.name} is new enough to cancel, until`);
    expect(held).toContain('its money back with its interest, and its fees refunded. A payment set for a date uses it. Move that to another account first.');
    expect([buttonAfter(rbc.name, 'Cancel It').disabled, buttonAfter(rbc.name, 'Cancel It').title]).toEqual([true, 'A payment set for a date uses it. Move that to another account first.']);
    ok(sim, 'bank.cancel_scheduled', { id: set.id });
    // TEST SETUP: RBC's account C$20 under. Until 2026-10-15 it was canceled so, and closed with its C$20 owed.
    setTo(sim, rbc, -20_00);
    expect(refusal(sim, 'bank.cancel_new', { accountId: rbc.id })).toBe('It’s overdrawn by C$20.00, and the bank only closes it once that’s paid off. Move money into it first.');
    expect(rbc.closedAt).toBeUndefined();
    expect(drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }))).toContain('its fees refunded. It’s overdrawn by C$20.00, and the bank only closes it once that’s paid off. Move money into it first.');
    expect([buttonAfter(rbc.name, 'Cancel It').disabled, buttonAfter(rbc.name, 'Cancel It').title]).toEqual([true, 'It’s overdrawn by C$20.00, and the bank only closes it once that’s paid off. Move money into it first.']);
    setTo(sim, rbc, 50_00); // TEST SETUP
    const tdBefore = td.balance;
    drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }));
    pressAfter(rbc.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(rbc.closedAt).toBe(sim.now);
    expect(rbc.balance).toBe(0);
    sim = reload(sim);
    // Out of RBC now, into TD when RBC's transfer lands, and never twice.
    expect(primary(sim).balance).toBe(tdBefore);
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(postedTo(sim, `From ${rbc.name}`, td.id)).toEqual([50_00]);
    expect(mine(sim).filter((a) => a.category === 'in_transit').reduce((n, a) => n + a.balance, 0)).toBe(0);
  });

  /**
   * From 2026-10-15 a current account canceled is settled as Close It settles one (`closeNow`): its interest paid, its
   * fees charged, and in Canada its fees refunded (SOR/2021-181 s.5(2)). Until then it closed with neither.
   */
  it('FIXTURE, Toronto: an RBC chequing account opened on 26 January with C$50, charged RBC’s C$16.95 at January’s end under its C$4,000 waiver, canceled on 2 February: the C$16.95 refunded, as Canada has it, and C$50 sent to TD', () => {
    const sim = abroad('ca-on-toronto', 'ca-td', 'scope-cancel-fees');
    const td = primary(sim);
    sim.advanceTo(at(2026, 1, 26, 12));
    const rbc = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-rbc' }).accountId]!;
    setTo(sim, rbc, 50_00); // TEST SETUP
    sim.advanceTo(at(2026, 2, 2, 12));
    // RBC Signature No Limit Banking: C$16.95 a month, waived only at C$4,000 or more (content/banks).
    expect(postedTo(sim, `Monthly fee: ${rbc.name}`, rbc.id)).toEqual([-16_95]);
    expect(rbc.balance).toBe(33_05);
    drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }));
    pressAfter(rbc.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Fees refunded: ${rbc.name}, canceled`, rbc.id)).toEqual([16_95]);
    expect([rbc.closedAt, rbc.balance]).toEqual([sim.now, 0]);
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(landed(sim, rbc, td)).toEqual([50_00]);
  });

  /**
   * Until 2026-10-16 this was “… with €3 in it is refused for its €4.90 month on the panel; with €100, Cancel It charges
   * the €4.90, as Germany lets the bank, and sends €95.10 on”: canceling charged the whole month on the day the account
   * opened. That day the share became the days to the cancellation (Wertersatz for the service given up to it, BGB §
   * 357b(2), as § 675h(3) has a close; `closingFeesDue`), one day of January's 31, so €3 covers it, and the refusal is
   * played with 10 cents in it. The renamed title is in docs/verification/pipeline/inputs/renames.json.
   */
  it('FIXTURE, Berlin: a Commerzbank GiroKonto opened beside Deutsche Bank with 10 cents in it is refused for the 16 cents its €4.90 month comes to on its first day, on the panel, which says the figure; with €100, Cancel It charges the 16 cents, as Germany lets the bank, and sends €99.84 on', () => {
    const sim = abroad('de-be-berlin', 'de-deutsche-bank', 'scope-cancel-de');
    const db = primary(sim);
    const giro = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-commerzbank' }).accountId]!;
    setTo(sim, giro, 10); // TEST SETUP
    // Commerzbank's GiroKonto: €4.90 a month, free only at €50,000; Germany's fees are settled at closing (`settleFees`),
    // this month's to the day: opened and canceled on Monday 5 January, one day of 31, 490 / 31 = 15.8, 16 cents.
    const words = 'Its fees, €0.16, are more than it holds. Move €0.06 into it first.';
    const said = 'Canceling it now charges €0.16 in fees: €0.16 of January’s €4.90 fee, for the one day of its 31 the account has been open. Under German law, a month’s fee is charged only up to the day an account closes.';
    const text = drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }));
    expect(text).toContain(`${giro.name} is new enough to cancel, until`);
    // Until 2026-10-15's later pass this said “with its interest”: Germany's rule returns it (`KEEPS_INTEREST`).
    expect(text).toContain(`its money back without the interest it earned, less the fees it owes. ${said} ${words}`);
    expect([buttonAfter(giro.name, 'Cancel It').disabled, buttonAfter(giro.name, 'Cancel It').title]).toEqual([true, words]);
    expect(refusal(sim, 'bank.cancel_new', { accountId: giro.id })).toBe(words);
    expect([giro.closedAt, giro.balance]).toEqual([undefined, 10]);
    setTo(sim, giro, 100_00); // TEST SETUP
    drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }));
    pressAfter(giro.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Closing fees: ${giro.name}`, giro.id)).toEqual([-16]);
    expect([giro.closedAt, giro.balance]).toEqual([sim.now, 0]);
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(landed(sim, giro, db)).toEqual([99_84]);
  });

  /**
   * Until 2026-10-15's later pass this account was paid its interest on canceling, 106.84 kr, and 1,000,106.84 kr went
   * to Arion. Iceland carries the EU's rule, which returns what each side received (Directive 2002/65/EC art. 7(5),
   * `KEEPS_INTEREST`), so the interest built goes with the cancellation.
   */
  it('FIXTURE, Reykjavík: a Landsbankinn Einkareikningur at 0.50% holding 1,000,000 kr for ten days’ ends, 136.98 kr built, canceled: the interest goes back unpaid, as Iceland’s rule returns it, and 1,000,000 kr is sent to Arion', () => {
    const sim = abroad('is-39-reykjavik', 'is-arion', 'scope-cancel-is');
    const arion = primary(sim);
    const giro = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'is-landsbankinn' }).accountId]!;
    setTo(sim, giro, 1_000_000_00); // TEST SETUP
    sim.advanceTo(sim.now + 10 * MS_DAY);
    // Ten day-ends at 1,000,000 kr and 0.50%: 1,000,000 × 0.005 × 10 / 365 = 136.986 kr, in whole hundredths 136.98 kr.
    expect(Math.floor(giro.accrued ?? 0)).toBe(136_98);
    const text = drawn(sim, createElement(BankAccountLife, { bankId: 'is-arion' }));
    expect(text).toContain(`${giro.name} is new enough to cancel, until`);
    expect(text).toContain('its money back without the interest it earned, less the fees it owes.');
    pressAfter(giro.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Interest: ${giro.name}, on canceling`, giro.id)).toEqual([]);
    expect([giro.closedAt, giro.balance, giro.accrued]).toEqual([sim.now, 0, 0]);
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(landed(sim, giro, arion)).toEqual([1_000_000_00]);
  });

  // Renamed on 2026-10-22 (brief 21): until then “FIXTURE, London: a NatWest Flexible Saver at 1.25% holding £10,000 for ten days’ ends, canceled: its interest kept, as Britain’s rule leaves it, £3.42, and £10,003.42 into the NatWest current account”, the 1.25% AER run as the nominal rate.
  it('FIXTURE, London: a NatWest Flexible Saver at 1.25% AER holding £10,000 for ten days’ ends, canceled: its interest kept, as Britain’s rule leaves it, £3.40, and £10,003.40 into the NatWest current account', () => {
    const sim = abroad('uk-eng-london', 'gb-natwest', 'scope-cancel-gb-interest');
    const current = primary(sim);
    for (const a of mine(sim)) if (!a.closedAt && a.kind === 'savings' && a.category !== 'term') ok(sim, 'bank.close_savings', { accountId: a.id });
    const saver = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', {}).accountId]!;
    expect(saver.bankId).toBe('gb-natwest');
    setTo(sim, saver, 10_000_00); // TEST SETUP
    sim.advanceTo(sim.now + 10 * MS_DAY);
    // Ten day-ends at £10,000 and NatWest’s 1.25% AER, credited monthly, so the nominal 12 × (1.0125^(1/12) − 1) =
    // 1.2429%: 10,000 × 0.012429 × 10 / 365 = £3.4052, in whole pence £3.40; Britain takes no tax from interest at the
    // bank. Until brief 21 (2026-10-22) the 1.25% ran as nominal: £3.4246, £3.42.
    const text = drawn(sim, createElement(BankAccountLife, { bankId: 'gb-natwest' }));
    expect(text).toMatch(new RegExp(`${saver.name} is new enough to cancel, until [A-Za-z]+ \\d+, 2026, its money back with its interest\\. Cancel It`));
    const before = current.balance;
    pressAfter(saver.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Interest: ${saver.name}, on canceling`, saver.id)).toEqual([3_40]);
    expect(current.balance - before).toBe(10_003_40);
    expect([saver.closedAt, saver.balance]).toEqual([sim.now, 0]);
  });

  /**
   * Until 2026-10-15's recheck this was played with the year's €1,000 allowance untouched, so no tax was kept on the
   * €1.50 and the tax half of the reversal ran on nothing, though the title said it went back with its tax.
   */
  it('FIXTURE, Berlin: a Deutsche Bank Flexgeld opened on 20 March with €10,000, the year’s €1,000 allowance already used, and canceled on 2 April: the €1.50 paid at March’s end, €0.40 of it kept as tax, goes back with its tax, off the year’s income, as Germany returns what each side received, and €10,000.00 comes back', () => {
    const sim = abroad('de-be-berlin', 'de-deutsche-bank', 'scope-cancel-de-interest');
    const current = primary(sim);
    // TEST SETUP: the Flexgeld the life starts with emptied, so it closes at once rather than on Germany's notice.
    for (const a of mine(sim)) if (!a.closedAt && a.kind === 'savings' && a.category !== 'term') { setTo(sim, a, 0); ok(sim, 'bank.close_savings', { accountId: a.id }); }
    // TEST SETUP: €1,000 of interest paid into the current account in January, the whole of the year's Sparer-Pauschbetrag.
    sim.post({ memo: 'TEST SETUP: interest earlier in the year', category: 'interest', postings: [{ accountId: current.id, amount: 1_000_00 }, { accountId: sim.nominalAccount('income', 'Interest').id, amount: -1_000_00 }] });
    sim.advanceTo(at(2026, 3, 20, 12));
    const flex = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', {}).accountId]!;
    expect(flex.bankId).toBe('de-deutsche-bank');
    setTo(sim, flex, 10_000_00); // TEST SETUP
    const interestBefore = yearOf(sim.player, 2026).interest ?? 0;
    sim.advanceTo(at(2026, 4, 2, 12));
    // Eleven day-ends at €10,000 and 0.50%, 20 to 30 March: 10,000 × 0.005 × 11 / 365 = €1.5068, in whole cents €1.50,
    // paid at March’s end, as a German bank pays at the quarter’s; the 31st’s is built after the payment that midnight.
    // With the allowance used, all of it is taxed at 25% and 5.5% on that, 26.375%: €1.50 × 0.26375 = €0.3956, €0.40,
    // so €1.10 is paid in.
    const tax = sim.nominalAccount('expense', 'Tax On Interest').id;
    expect(postedTo(sim, `Interest: ${flex.name}`, flex.id)).toEqual([1_10]);
    expect(postedTo(sim, `Interest: ${flex.name}`, tax)).toEqual([40]);
    expect((yearOf(sim.player, 2026).interest ?? 0) - interestBefore).toBe(1_50);
    expect(drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }))).toContain(`${flex.name} is new enough to cancel, until`);
    expect(drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }))).toContain('its money back without the interest it earned. Cancel It');
    pressAfter(flex.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    // The €1.10 out of it, the €0.40 of tax back off the tax line, and the €1.50 off the interest earned.
    expect(postedTo(sim, `Interest returned: ${flex.name}, canceled`, flex.id)).toEqual([-1_10]);
    expect(postedTo(sim, `Interest returned: ${flex.name}, canceled`, tax)).toEqual([-40]);
    expect(postedTo(sim, `Interest returned: ${flex.name}, canceled`, sim.nominalAccount('income', 'Interest').id)).toEqual([1_50]);
    expect(postedTo(sim, `${flex.name} canceled`, current.id)).toEqual([10_000_00]);
    expect((yearOf(sim.player, 2026).interest ?? 0) - interestBefore).toBe(0);
    expect([flex.closedAt, flex.balance, flex.accrued]).toEqual([sim.now, 0, 0]);
  });

  /**
   * From 2026-10-15's recheck. A term's interest taken during the term went into the primary account, and canceling
   * took it back out of there, but only what was paid into the term itself was counted toward the refusal, so nothing
   * stopped it: the Commerzbank account was left at −€6.30.
   */
  it('FIXTURE, Berlin: a Deutsche Bank FestzinsSparen of €10,000 at 2.30% opened beside a Commerzbank primary, its €6.30 taken after ten days and the primary emptied: Cancel It refused on the panel for the €6.30 going back out of the primary, then with €6.30 paid in, canceled, the primary left at €0.00', () => {
    const sim = abroad('de-be-berlin', 'de-commerzbank', 'scope-cancel-de-term');
    const giro = primary(sim);
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(sim, db, 10_000_00); // TEST SETUP
    const term = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    expect([term.name, term.fixedRate, db.balance]).toEqual(['FestzinsSparen', 0.023, 0]);
    sim.advanceTo(sim.now + 10 * MS_DAY);
    // Ten day-ends at €10,000 and 2.30%: 10,000 × 0.023 × 10 / 365 = €6.3014, €6.30 in whole cents, under the year's
    // €1,000 allowance, so no tax is kept; Deutsche Bank lets it be taken during the term, into the primary account.
    const before = giro.balance;
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: term.id })).toEqual({ paid: 6_30 });
    expect(giro.balance - before).toBe(6_30);
    setTo(sim, giro, 0); // TEST SETUP: the primary spent to nothing.
    const words = `Canceling takes back the €6.30 of interest it paid into ${giro.name}, which holds less than that. Move €6.30 into ${giro.name} first.`;
    expect(drawn(sim, createElement(BankAccountLife, { bankId: 'de-commerzbank' }))).toContain(`${term.name} is new enough to cancel, until`);
    // Its row in the cancel list: the last button naming it, the term's own row (Take Interest, Break It Early) above.
    const cancelOf = () => h.buttons.slice(h.buttons.map((b) => b.text).lastIndexOf(term.name) + 1).find((b) => b.text === 'Cancel It')!;
    expect([cancelOf().disabled, cancelOf().title]).toEqual([true, words]);
    expect(refusal(sim, 'bank.cancel_new', { accountId: term.id })).toBe(words);
    expect([term.closedAt, giro.balance]).toEqual([undefined, 0]);
    // A cent short is still refused (from 2026-10-15's second recheck: until then only 0 and €6.30 were tried, and the
    // refusal's threshold was untested).
    setTo(sim, giro, 6_29); // TEST SETUP
    expect(refusal(sim, 'bank.cancel_new', { accountId: term.id })).toBe(`Canceling takes back the €6.30 of interest it paid into ${giro.name}, which holds less than that. Move €0.01 into ${giro.name} first.`);
    expect(term.closedAt).toBeUndefined();
    setTo(sim, giro, 6_30); // TEST SETUP
    drawn(sim, createElement(BankAccountLife, { bankId: 'de-commerzbank' }));
    expect(cancelOf().disabled).toBe(false);
    cancelOf().onClick!();
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Interest returned: ${term.name}, canceled`, giro.id)).toEqual([-6_30]);
    expect([giro.balance, term.closedAt, term.balance]).toEqual([0, sim.now, 0]);
    // The deposit whole into the Deutsche Bank account beside it, at its own bank.
    expect(postedTo(sim, `${term.name} canceled`, db.id)).toEqual([10_000_00]);
  });

  /**
   * From 2026-10-15's second recheck. Every term at a bank has the same name, and a term's taken interest was found by
   * its memo alone, so canceling the new term took back the €6.93 the older one had paid.
   */
  it('FIXTURE, Berlin: two Deutsche Bank FestzinsSparen of €10,000, the second opened fifteen days after the first, the first’s €10.08 taken the day after: the second canceled on the panel gives back its €10,000 and takes none of the first’s interest back, the year’s interest left €10.08 up and the first still open', () => {
    const sim = abroad('de-be-berlin', 'de-deutsche-bank', 'scope-cancel-de-twoterms');
    const giro = primary(sim);
    setTo(sim, giro, 20_000_00); // TEST SETUP
    const older = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    // Fifteen days on, past the older one's fourteen, so only the newer has a Cancel It.
    sim.advanceTo(sim.now + 15 * MS_DAY);
    setTo(sim, giro, 10_000_00); // TEST SETUP: what the fortnight spent made up.
    const newer = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    expect([older.name, newer.name, older.fixedRate]).toEqual(['FestzinsSparen', 'FestzinsSparen', 0.023]);
    sim.advanceTo(sim.now + MS_DAY);
    const interestBefore = yearOf(sim.player, 2026).interest ?? 0;
    // Sixteen day-ends at €10,000 and 2.30%: 10,000 × 0.023 × 16 / 365 = €10.0822, €10.08, under the €1,000 allowance.
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: older.id })).toEqual({ paid: 10_08 });
    expect((yearOf(sim.player, 2026).interest ?? 0) - interestBefore).toBe(10_08);
    const before = giro.balance;
    drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }));
    // The newer term's Cancel It: the button after the last one naming it, the terms' own rows drawn above.
    const last = h.buttons.map((b) => b.text).lastIndexOf(newer.name);
    const cancel = h.buttons.slice(last + 1).find((b) => b.text === 'Cancel It')!;
    expect(h.buttons.filter((b) => b.text === 'Cancel It')).toHaveLength(1);
    expect(cancel.disabled).toBe(false);
    cancel.onClick!();
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect([newer.closedAt, older.closedAt]).toEqual([sim.now, undefined]);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Interest returned'))).toEqual([]);
    expect(giro.balance - before).toBe(10_000_00);
    expect((yearOf(sim.player, 2026).interest ?? 0) - interestBefore).toBe(10_08);
  });

  /**
   * From 2026-10-15's second recheck. The period ended at the hour the account opened on its last day, though each rule
   * counts whole days and the panel names the day: an RBC account “until January 23” was refused at 11:30 AM on the 23rd.
   * Twins: one pressed at 11:30 PM on the last day, the other a minute past the midnight after.
   */
  it('FIXTURE, Toronto and Berlin: a savings account opened on Monday 5 January can be canceled at 11:30 PM on the last day the panel names, Friday 23 January in Toronto (fourteen business days) and Monday 19 January in Berlin (fourteen days), and is refused at 12:01 AM the day after', () => {
    const lives = [
      { city: 'ca-on-toronto', home: 'ca-td', bank: 'ca-rbc', zone: 'America/Toronto', last: 23, until: 'January 23, 2026' },
      { city: 'de-be-berlin', home: 'de-commerzbank', bank: 'de-deutsche-bank', zone: 'Europe/Berlin', last: 19, until: 'January 19, 2026' },
    ];
    for (const life of lives) {
      const played = (late: boolean) => {
        const sim = abroad(life.city, life.home, `scope-cancel-lastday-${life.bank}-${late}`);
        ok(sim, 'bank.open_current', { bankId: life.bank });
        const saver = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: life.bank }).accountId]!;
        expect(zonedParts(saver.openedAt, life.zone)).toMatchObject({ year: 2026, month: 1, day: 5 });
        setTo(sim, saver, 100_00); // TEST SETUP
        const when = late ? instantFromZoned({ year: 2026, month: 1, day: life.last + 1, hour: 0, minute: 1 }, life.zone) : instantFromZoned({ year: 2026, month: 1, day: life.last, hour: 23, minute: 30 }, life.zone);
        sim.advanceTo(when);
        return { sim, saver };
      };
      const inTime = played(false);
      // Toronto: 6 to 9, 12 to 16 and 19 to 23 January, Ontario keeping no holiday between. Berlin: 5 + 14 = the 19th.
      expect(drawn(inTime.sim, createElement(BankAccountLife, { bankId: life.home }))).toContain(`${inTime.saver.name} is new enough to cancel, until ${life.until},`);
      pressAfter(inTime.saver.name, 'Cancel It');
      expect(h.answers.at(-1), life.city).toMatchObject({ kind: 'bank.cancel_new', ok: true });
      expect(inTime.saver.closedAt).toBe(inTime.sim.now);

      const tooLate = played(true);
      expect(drawn(tooLate.sim, createElement(BankAccountLife, { bankId: life.home }))).not.toContain(`${tooLate.saver.name} is new enough to cancel`);
      expect(refusal(tooLate.sim, 'bank.cancel_new', { accountId: tooLate.saver.id })).toBe('Its cooling-off period has passed, or there isn’t one here for it.');
      expect(tooLate.saver.closedAt).toBeUndefined();
    }
  });

  /**
   * From 2026-10-15's recheck. Overdraft interest is posted as a bank fee, and until then Canada's refund took it with
   * the charges, C$23.76 here, all against Bank Fees; the regulation refunds charges “other than interest charges”
   * (SOR/2021-181 s.5(2)(b)).
   */
  it('FIXTURE, Toronto: an RBC chequing account opened on 26 January beside TD with C$1,000 arranged, C$500 under until February, canceled on 2 February: RBC’s C$16.95 month and C$5.00 overdraft fee refunded against Bank Fees, C$21.95, and the overdraft interest kept', () => {
    const sim = abroad('ca-on-toronto', 'ca-td', 'scope-cancel-ca-odint');
    sim.advanceTo(at(2026, 1, 26, 12));
    const rbc = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-rbc' }).accountId]!;
    wages(sim, rbc.id, 3_000_00); // TEST SETUP
    ok(sim, 'bank.arrange_overdraft', { limit: 1_000_00, accountId: rbc.id });
    setTo(sim, rbc, -500_00); // TEST SETUP
    sim.advanceTo(at(2026, 2, 2, 12));
    const fees = sim.nominalAccount('expense', 'Bank Fees').id;
    const odInterest = sim.nominalAccount('expense', 'Overdraft Interest').id;
    // RBC: C$16.95 a month under its C$4,000 waiver, overdraft protection C$5 a month, at 22% (content/banks-lending).
    // The interest: five day-ends at C$500 under, 26 to 30 January, and the 31st's at C$516.95, the month's fee charged
    // before that midnight: (5 × 500 + 516.95) × 0.22 / 365 = C$1.8184, C$1.81 charged on 1 February.
    expect(postedTo(sim, `Monthly fee: ${rbc.name}`, rbc.id)).toEqual([-16_95]);
    expect(postedTo(sim, 'Overdraft fee', rbc.id)).toEqual([-5_00]);
    expect(postedTo(sim, 'Overdraft interest', rbc.id)).toEqual([-1_81]);
    setTo(sim, rbc, 100_00); // TEST SETUP: back in credit.
    drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }));
    pressAfter(rbc.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    // 16.95 + 5.00 = C$21.95 back, against the line each was charged to; the interest isn't a charge the rule refunds.
    expect(postedTo(sim, `Fees refunded: ${rbc.name}, canceled`, rbc.id)).toEqual([21_95]);
    expect(postedTo(sim, `Fees refunded: ${rbc.name}, canceled`, fees)).toEqual([-21_95]);
    expect(postedTo(sim, `Fees refunded: ${rbc.name}, canceled`, odInterest)).toEqual([]);
  });

  it('FIXTURE, Mexico City: a Banorte Inversión Enlace at 0.31% opened on 26 January beside Banorte’s current account with MXN 1,000,000, paid January’s interest, and canceled on 10 February, the tenth día hábil with the 2 February holiday: the interest goes back, as Mexico returns things to how they were, and MXN 1,000,000.00 into the current account', () => {
    const sim = abroad('mx-cmx-mexicocity', 'mx-bbva', 'scope-cancel-mx-interest');
    const mx = (month: number, day: number, hour = 12) => instantFromZoned({ year: 2026, month, day, hour, minute: 0 }, 'America/Mexico_City');
    sim.advanceTo(mx(1, 26));
    const enlace = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'mx-banorte' }).accountId]!;
    const saver = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'mx-banorte' }).accountId]!;
    setTo(sim, saver, 1_000_000_00); // TEST SETUP
    sim.advanceTo(mx(2, 10, 9));
    // Ten business days after the 26th, the 2 February holiday (Día de la Constitución) not among them: 27, 28, 29, 30
    // January and 3, 4, 5, 6, 9 and 10 February. Until 2026-10-15's recheck ten calendar days ended it on 5 February.
    const text = drawn(sim, createElement(BankAccountLife, { bankId: 'mx-bbva' }));
    expect(text).toContain(`${saver.name} is new enough to cancel, until February 10, 2026, its money back without the interest it earned, and its fees refunded.`);
    // Five day-ends in January, 26 to 30, at MXN 1,000,000 and Banorte's 0.31% GAT, credited monthly, so the nominal
    // 12 × (1.0031^(1/12) − 1) = 0.30956%: 1,000,000 × 0.0030956 × 5 / 365 = MXN 42.4055, MXN 42.40 paid at January's
    // end; Mexico's bank takes no tax off it here (its rate is 0). Until brief 21 (2026-10-22) the 0.31% ran as nominal:
    // MXN 42.4658, 42.46.
    expect(postedTo(sim, `Interest: ${saver.name}`, saver.id)).toEqual([42_40]);
    const before = enlace.balance;
    pressAfter(saver.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Interest returned: ${saver.name}, canceled`, saver.id)).toEqual([-42_40]);
    expect(enlace.balance - before).toBe(1_000_000_00);
    expect([saver.closedAt, saver.balance, saver.accrued]).toEqual([sim.now, 0, 0]);
  });

  it('FIXTURE, Mexico City: a Santander Débito LikeU opened beside BBVA, charged MXN 11.48 and canceled unused: the charge refunded, as Mexico lets no Comisión be charged; its twin that sent MXN 100 out has been used, so the panel draws no Cancel It and the command is refused', () => {
    const played = (used: boolean) => {
      const sim = abroad('mx-cmx-mexicocity', 'mx-bbva', 'scope-cancel-mx-fees');
      const bbva = primary(sim);
      const likeU = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'mx-santander' }).accountId]!;
      setTo(sim, likeU, 500_00); // TEST SETUP
      // TEST SETUP: Santander's MXN 11.48 quiet-month fee posted by hand. SLATE charges it only for a month the account
      // was open all of (`monthlyCharges`), which no account inside its ten business days has been, and no other Mexican
      // bank here charges a fee an unused account would meet; so the refund is reached by no charge the game makes.
      sim.post({ memo: 'Quiet month fee', category: 'bank_fee', postings: [{ accountId: likeU.id, amount: -11_48 }, { accountId: sim.nominalAccount('expense', 'Bank Fees').id, amount: 11_48 }] });
      if (used) ok(sim, 'bank.transfer', { fromId: likeU.id, toId: bbva.id, amount: 100_00 });
      return { sim, likeU, bbva };
    };
    const unused = played(false);
    const text = drawn(unused.sim, createElement(BankAccountLife, { bankId: 'mx-bbva' }));
    expect(text).toContain(`${unused.likeU.name} is new enough to cancel, until`);
    expect(text).toContain('its money back without the interest it earned, and its fees refunded.');
    pressAfter(unused.likeU.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(unused.sim, `Fees refunded: ${unused.likeU.name}, canceled`, unused.likeU.id)).toEqual([11_48]);
    expect([unused.likeU.closedAt, unused.likeU.balance]).toEqual([unused.sim.now, 0]);
    unused.sim.advanceTo(unused.sim.now + 7 * MS_DAY);
    expect(landed(unused.sim, unused.likeU, unused.bbva)).toEqual([500_00]);

    const usedOne = played(true);
    expect(drawn(usedOne.sim, createElement(BankAccountLife, { bankId: 'mx-bbva' }))).not.toContain(`${usedOne.likeU.name} is new enough to cancel`);
    expect(refusal(usedOne.sim, 'bank.cancel_new', { accountId: usedOne.likeU.id })).toBe('Its cooling-off period has passed, or there isn’t one here for it.');
    expect(usedOne.likeU.closedAt).toBeUndefined();
  });

  it('FIXTURE, Toronto: an RBC savings account opened beside RBC chequing, C$500 in and C$100 out twice, the second charged RBC’s C$2.00, canceled that day: the C$2.00 refunded, as Canada refunds a deposit account’s charges, and C$300.00 into the chequing account', () => {
    const sim = abroad('ca-on-toronto', 'ca-td', 'scope-cancel-ca-savings-fee');
    const rbc = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-rbc' }).accountId]!;
    setTo(sim, rbc, 1_000_00); // TEST SETUP
    const saver = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'ca-rbc' }).accountId]!;
    ok(sim, 'bank.transfer', { fromId: rbc.id, toId: saver.id, amount: 500_00 });
    ok(sim, 'bank.transfer', { fromId: saver.id, toId: rbc.id, amount: 100_00 });
    ok(sim, 'bank.transfer', { fromId: saver.id, toId: rbc.id, amount: 100_00 });
    // RBC’s eSavings: one withdrawal free a month, C$2.00 each after (content/accountlife.ts, from RBC’s disclosure booklet).
    expect(postedTo(sim, `Savings withdrawal fee: ${saver.name}`, saver.id)).toEqual([-2_00]);
    expect(saver.balance).toBe(298_00);
    const text = drawn(sim, createElement(BankAccountLife, { bankId: 'ca-td' }));
    expect(text).toContain(`${saver.name} is new enough to cancel, until`);
    expect(text).toContain('its money back with its interest, and its fees refunded.');
    const before = rbc.balance;
    pressAfter(saver.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, `Fees refunded: ${saver.name}, canceled`, saver.id)).toEqual([2_00]);
    expect(rbc.balance - before).toBe(300_00);
    expect([saver.closedAt, saver.balance]).toEqual([sim.now, 0]);
  });

  it('FIXTURE, Seoul: a Shinhan current account and savings account opened that morning beside KB can’t be canceled new: Korea’s rule gives deposits no withdrawal, the panel draws no Cancel It, and the command is refused with both left open', () => {
    const sim = abroad('kr-11-seoul', 'kr-kb-kookmin', 'scope-cancel-kr');
    const shinhan = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'kr-shinhan' }).accountId]!;
    const saver = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'kr-shinhan' }).accountId]!;
    expect([shinhan.openedAt, saver.openedAt]).toEqual([sim.now, sim.now]);
    expect(drawn(sim, createElement(BankAccountLife, { bankId: 'kr-kb-kookmin' }))).not.toContain('is new enough to cancel');
    expect(buttons('Cancel It')).toEqual([]);
    for (const a of [shinhan, saver]) {
      expect(refusal(sim, 'bank.cancel_new', { accountId: a.id })).toBe('Its cooling-off period has passed, or there isn’t one here for it.');
      expect(a.closedAt).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// bank.close_current, on a German account's closing fees
// ---------------------------------------------------------------------------

describe('bank.close_current', () => {
  /**
   * Until 2026-10-16 this was “… with €3 in it is refused Close It for its €4.90 month on Your Banks, as Cancel It is;
   * with €100, Close It charges the €4.90 and sends €95.10 on”: Close It charged the whole month on the day the account
   * opened. That day the share became the days to the close (BGB § 675h(3), `closingFeesDue`), one day of January's 31,
   * so €3 covers it, and the refusal is played with 10 cents in it. The renamed title is in
   * docs/verification/pipeline/inputs/renames.json.
   */
  it('FIXTURE, Berlin: a Commerzbank GiroKonto beside Deutsche Bank with 10 cents in it is refused Close It on Your Banks for the 16 cents its €4.90 month comes to on its first day, as Cancel It is, the figure said under it; with €100, Close It charges the 16 cents and sends €99.84 on', () => {
    const sim = abroad('de-be-berlin', 'de-deutsche-bank', 'scope-close-de-fees');
    const db = primary(sim);
    const giro = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-commerzbank' }).accountId]!;
    setTo(sim, giro, 10); // TEST SETUP
    // Commerzbank's GiroKonto: €4.90 a month, charged at closing (`settleFees`) to the day: one day of January's 31,
    // 490 / 31 = 15.8, 16 cents; 16 − 10 = 6 cents short. Until 2026-10-15 Close It closed such an account overdrawn, its
    // debt closed with it.
    const words = 'Its fees, €0.16, are more than it holds. Move €0.06 into it first.';
    const text = drawn(sim, createElement(BankMoves));
    expect(buttons('Close It').map((b) => [b.disabled, b.title])).toEqual([[true, words]]);
    expect(text).toContain(`You can’t close it yet. ${words} Closing it now charges €0.16 in fees: €0.16 of January’s €4.90 fee, for the one day of its 31 the account has been open.`);
    expect(refusal(sim, 'bank.close_current', { accountId: giro.id, remainderTo: db.id })).toBe(words);
    expect([giro.closedAt, giro.balance]).toEqual([undefined, 10]);
    setTo(sim, giro, 100_00); // TEST SETUP
    drawn(sim, createElement(BankMoves));
    press('Close It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.close_current', ok: true });
    expect(postedTo(sim, `Closing fees: ${giro.name}`, giro.id)).toEqual([-16]);
    expect([giro.closedAt, giro.balance]).toEqual([sim.now, 0]);
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(landed(sim, giro, db)).toEqual([99_84]);
  });
});

// ---------------------------------------------------------------------------
// bank.switch, bank.switch_complete, bank.cancel_switch, bank.stop_balance_transfer
// ---------------------------------------------------------------------------

/** London's wall clock, for the British switch's dates. */
const LONDON = 'Europe/London';
const inLondon = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, LONDON);
const pendingKinds = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.status === 'pending' && (i.kind === SWITCH_KIND || i.kind === SWITCH_REVIEW_KIND)).map((i) => i.kind);

describe('bank.switch', () => {
  it('PLAYER JOURNEY: in New Haven a switch to Citi is refused first for a photo ID, as Citi’s opening asks one, and with a passport applied for and come, with the steps to take; nothing is set, across a reload; Your Banks draws those steps, and the Switch Bank panel isn’t drawn at all', () => {
    let sim = ada('scope-switch-us', 'modest');
    // This student holds no photo ID in force: a new bank asks for one (31 CFR 1020.220), the switch's first look as an
    // opening's is.
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    expect(refusal(sim, 'bank.switch', { bankId: 'us-citi' })).toBe('Citi needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    const passport = ok<{ readyAt: number }>(sim, 'documents.apply_passport', {});
    sim.advanceTo(passport.readyAt + MS_HOUR);
    expect(photoIdOf(sim.player, sim.now)).toBeDefined();
    const before = sim.universe.scheduled.length;
    expect(refusal(sim, 'bank.switch', { bankId: 'us-citi' })).toBe('There’s no switching service here: open an account at Citi, have your wages paid into it, move your standing orders and autopay, move the money across, then close the old account. Each step is on this screen.');
    for (const one of [sim, sim = reload(sim)]) {
      expect(one.universe.scheduled.length).toBe(before);
      expect(pendingKinds(one)).toEqual([]);
      expect(primary(one).bankId).toBe('us-chase');
    }
    expect(drawn(sim, createElement(BankMoves))).toContain('There’s no switching service here. To move banks, open the new account, have your wages paid into it, move each standing order and autopay, move the money across, and then close the old account. The new account starts empty, with its own history.');
    expect(drawn(sim, createElement(BankLending, { bank: bankById('us-chase')!, show: ['switch'] }))).not.toContain('Switch Bank');
    expect(buttons('Switch')).toEqual([]);
  });
});

describe('bank.switch_complete', () => {
  it('FIXTURE, London: Barclays to HSBC on Wednesday 14 January 2026, across a reload: the savings moved to the penny with its closing interest, the current account less the £20 of groceries still pending, held back until they post and then closed with the rest sent across, the standing order into savings re-pointed and paid there on the 15th', () => {
    let sim = abroad('uk-eng-london', 'gb-barclays', 'scope-switch-done');
    const oldCurrent = primary(sim).id;
    const oldSavings = savingsAt(sim, 'gb-barclays')!.id;
    ok(sim, 'bank.add_standing_order', { toId: oldSavings, amount: 25_00, day: 15 });
    const set = ok<{ at: number }>(sim, 'bank.switch', { bankId: 'gb-hsbc' });
    // Seven working days from Monday 5 January (SWITCHING.GB, the Current Account Switch Service's), at nine.
    expect(set.at).toBe(inLondon(2026, 1, 14, 9));
    sim = reload(sim);
    sim.advanceTo(set.at - 60_000);
    const held = { current: sim.universe.accounts[oldCurrent]!.balance, savings: sim.universe.accounts[oldSavings]!.balance };
    // The day's £10 of groceries on the debit card, the 13th's and the 14th's, each pending two days at Barclays.
    expect(sim.universe.transactions.filter((t) => t.memo === 'Groceries' && t.postsAt !== undefined && t.postsAt > set.at).map((t) => [t.postsAt, t.postings.find((p) => p.accountId === oldCurrent)!.amount]))
      .toEqual([[inLondon(2026, 1, 15, 0), -10_00], [inLondon(2026, 1, 16, 0), -10_00]]);
    sim.advanceTo(set.at + 60_000);
    sim = reload(sim);
    // What closing paid on the savings, read from the ledger: its interest, less any fee.
    const onClosing = (id: string) => sim.universe.transactions.filter((t) => t.at === set.at && t.memo !== 'Moved to HSBC UK').flatMap((t) => t.postings).filter((p) => p.accountId === id).reduce((n, p) => n + p.amount, 0);
    const current = checkingAtBank(sim, 'gb-hsbc')!;
    const savings = savingsAt(sim, 'gb-hsbc')!;
    expect(primary(sim).id).toBe(current.id);
    expect(onClosing(oldSavings)).toBeGreaterThan(0);
    expect(savings.balance).toBe(held.savings + onClosing(oldSavings));
    expect(sim.universe.accounts[oldSavings]!).toMatchObject({ closedAt: set.at, balance: 0 });
    // The current account's money less the £20 pending goes across; Barclays keeps the £20 until they post.
    expect(postedTo(sim, 'Moved to HSBC UK', current.id)).toEqual([held.current - 20_00]);
    const old = sim.universe.accounts[oldCurrent]!;
    expect(old.balance).toBe(20_00);
    expect(old.closedAt).toBeUndefined();
    // A day after the last of them posts, the 16th: the 17th.
    expect(old.closingAt).toBe(inLondon(2026, 1, 17, 0));
    const pounds = (n: number) => `£${(n / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    expect(titled(sim, 'Switched To HSBC UK, Some Held Back').map((n) => n.body)).toEqual([`Your payments are at HSBC UK now, with ${pounds(held.current - 20_00)}. Barclays holds back £20.00 for card payments still pending, and closes Barclays Bank Account once they post, about January 17, 2026, sending what’s left across.`]);
    expect(sim.player.payments!.switches!.at(-1)).toMatchObject({ fromBank: 'Barclays', toBank: 'HSBC UK', outcome: 'held' });
    expect(sim.player.payments!.standingOrders.map((o) => o.toId)).toEqual([savings.id]);
    const before = savings.balance;
    sim.advanceTo(inLondon(2026, 1, 15, 18));
    expect(sim.universe.accounts[savings.id]!.balance - before).toBe(25_00);
    sim.advanceTo(inLondon(2026, 1, 17, 12));
    expect(sim.universe.accounts[oldCurrent]!).toMatchObject({ closedAt: inLondon(2026, 1, 17, 0), balance: 0 });
  });
});

describe('bank.cancel_switch', () => {
  it('FIXTURE, London: Call Off The Switch…, then Call It Off, pressed on the panel: the switch and its review canceled, its history “called off”, and on its date nothing moves; a partial switch is refused, having no right to call off', () => {
    let sim = abroad('uk-eng-london', 'gb-barclays', 'scope-switch-cancel');
    const barclays = bankById('gb-barclays')!;
    const savings = savingsAt(sim, 'gb-barclays')!;
    ok(sim, 'bank.add_standing_order', { toId: savings.id, amount: 25_00, day: 15 });
    // A date three weeks out, Monday 26 January, so there's a window: seven working days before it, Thursday 15 January.
    const set = ok<{ at: number; cancellableUntil: number }>(sim, 'bank.switch', { bankId: 'gb-hsbc', on: '2026-01-26' });
    expect(set).toEqual({ at: inLondon(2026, 1, 26, 9), cancellableUntil: inLondon(2026, 1, 15, 9) });
    expect(pendingKinds(sim).sort()).toEqual([SWITCH_KIND, SWITCH_REVIEW_KIND].sort());
    const panel = () => drawn(sim, createElement(BankLending, { bank: barclays, show: ['switch'] }));
    expect(panel()).toContain('Switching to HSBC UK on January 26, 2026. It can be called off until January 15, 2026: your accounts, wages and payments stay where they are, and nothing has moved yet.');
    press('Call Off The Switch…');
    panel();
    press('Call It Off');
    expect(h.answers.at(-1)).toEqual({ kind: 'bank.cancel_switch', ok: true, error: undefined });
    expect(pendingKinds(sim)).toEqual([]);
    expect(sim.player.payments!.switches!.at(-1)).toMatchObject({ toBank: 'HSBC UK', outcome: 'canceled' });
    sim = reload(sim);
    expect(panel()).toContain('HSBC UK, called off.');
    const held = savingsAt(sim, 'gb-barclays')!.balance;
    const from = sim.now;
    sim.advanceTo(set.at + MS_DAY);
    expect(primary(sim).bankId).toBe('gb-barclays');
    expect(mine(sim).filter((a) => a.bankId === 'gb-hsbc')).toEqual([]);
    expect(savingsAt(sim, 'gb-barclays')!.id).toBe(savings.id);
    expect(sim.player.payments!.standingOrders.map((o) => o.toId)).toEqual([savings.id]);
    // The order still pays into Barclays: the £25 of Thursday 15 January, and nothing else, no month's end between.
    const into = sim.universe.transactions.filter((t) => t.at > from).flatMap((t) => t.postings.filter((q) => q.accountId === savings.id).map((q) => [zonedParts(t.at, LONDON).day, q.amount]));
    expect(into).toEqual([[15, 25_00]]);
    expect(savingsAt(sim, 'gb-barclays')!.balance - held).toBe(25_00);
    const partial = abroad('uk-eng-london', 'gb-barclays', 'scope-switch-partial');
    ok(partial, 'bank.switch', { bankId: 'gb-natwest', partial: true });
    expect(refusal(partial, 'bank.cancel_switch', { confirm: true })).toBe('This country’s switching service doesn’t let you call a switch off. It goes ahead on its date.');
  });
});

describe('bank.stop_balance_transfer', () => {
  it('FIXTURE, London: past its window, Stop The Balance Transfer…, then Keep The Balance There, pressed: on 14 January the payment set for a date moves to HSBC and Barclays keeps its money, open; again refused as stopped; a partial switch has no such step; past close of business on the 13th it’s refused', () => {
    let sim = abroad('uk-eng-london', 'gb-barclays', 'scope-switch-keep');
    const barclays = bankById('gb-barclays')!;
    const old = primary(sim);
    const set = ok<{ at: number; cancellableUntil: number }>(sim, 'bank.switch', { bankId: 'gb-hsbc' });
    const later = ok<{ id: string }>(sim, 'bank.schedule_payment', { fromId: old.id, toId: savingsAt(sim, 'gb-barclays')!.id, amount: 10_00, at: inLondon(2026, 1, 20, 9) });
    sim.advanceTo(inLondon(2026, 1, 12, 12));
    const panel = () => drawn(sim, createElement(BankLending, { bank: barclays, show: ['switch'] }));
    expect(panel()).toContain('It’s past January 5, 2026, its last day to be called off, and under way.');
    press('Stop The Balance Transfer…');
    panel();
    press('Keep The Balance There');
    expect(h.answers.at(-1)).toEqual({ kind: 'bank.stop_balance_transfer', ok: true, error: undefined });
    expect(panel()).toContain('Its balance transfer is stopped: your payments move, and the balance stays in the old account, which stays open.');
    expect(refusal(sim, 'bank.stop_balance_transfer', { confirm: true })).toBe('Its balance transfer is already stopped.');
    sim = reload(sim);
    sim.advanceTo(set.at - 60_000);
    const keeps = sim.universe.accounts[old.id]!.balance;
    sim.advanceTo(set.at + 60_000);
    const hsbc = checkingAtBank(sim, 'gb-hsbc')!;
    expect(primary(sim).id).toBe(hsbc.id);
    expect(sim.universe.accounts[old.id]!.closedAt).toBeUndefined();
    expect(sim.universe.accounts[old.id]!.balance).toBe(keeps);
    expect(hsbc.balance).toBe(0);
    expect(sim.universe.scheduled.find((i) => i.id === later.id)!.payload.fromId).toBe(hsbc.id);
    expect(sim.player.payments!.switches!.at(-1)).toMatchObject({ outcome: 'balance-kept', toBank: 'HSBC UK' });

    const partial = abroad('uk-eng-london', 'gb-barclays', 'scope-switch-keep-partial');
    ok(partial, 'bank.switch', { bankId: 'gb-natwest', partial: true });
    expect(refusal(partial, 'bank.stop_balance_transfer', { confirm: true })).toBe('This country’s switching service has no such step.');
    const late = abroad('uk-eng-london', 'gb-barclays', 'scope-switch-keep-late');
    ok(late, 'bank.switch', { bankId: 'gb-hsbc' });
    late.advanceTo(inLondon(2026, 1, 13, 17, 1));
    expect(refusal(late, 'bank.stop_balance_transfer', { confirm: true })).toBe('The transfer could be stopped until close of business January 13, 2026.');
    expect(late.universe.scheduled.find((i) => i.kind === SWITCH_KIND && i.status === 'pending')!.payload.keepBalance).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// bank.savings_notice
// ---------------------------------------------------------------------------

describe('bank.savings_notice', () => {
  it('FIXTURE, Berlin: €3,000 in Postbank savings beside a Postbank current account, past Postbank’s €2,000 a month, closes on three months’ notice across a reload: the money in the Postbank account, the notice naming it, the standing order into it gone', () => {
    let sim = abroad('de-be-berlin', 'de-deutsche-bank', 'scope-notice');
    const giro = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-postbank' }).accountId]!;
    const saver = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'de-postbank' }).accountId]!;
    setTo(sim, saver, 3_000_00); // TEST SETUP
    ok(sim, 'bank.add_standing_order', { toId: saver.id, amount: 50_00, day: 20 });
    // Postbank lets €2,000 a month out of savings without notice (CASH['de-postbank'].savingsMonthly, its price list);
    // past it, the law's three months' notice.
    const given = ok<{ closed: string; on: number }>(sim, 'bank.close_savings', { accountId: saver.id });
    expect(given.on).toBe(instantFromZoned({ ...zonedParts(sim.now, 'Europe/Berlin'), month: zonedParts(sim.now, 'Europe/Berlin').month + 3 }, 'Europe/Berlin'));
    sim = reload(sim);
    sim.advanceTo(given.on - 60_000);
    const held = sim.universe.accounts[saver.id]!.balance;
    const giroBefore = sim.universe.accounts[giro.id]!.balance;
    sim.advanceTo(given.on + 60_000);
    const closed = sim.universe.accounts[saver.id]!;
    expect(closed.closedAt).toBe(given.on);
    expect(closed.balance).toBe(0);
    // Its interest paid on closing, read from the ledger, and all of it into the Postbank current account beside it.
    const interest = postedTo(sim, `Interest: ${saver.name}, on closing`, saver.id).reduce((n, a) => n + a, 0);
    expect(postedTo(sim, `Closed ${saver.name}`, giro.id)).toEqual([held + interest]);
    expect(sim.universe.accounts[giro.id]!.balance - giroBefore).toBe(held + interest);
    expect(titled(sim, `${saver.name} Closed`).map((n) => n.body)).toEqual([`Its notice period ended, and what it held is now in your ${giro.name} at Postbank.`]);
    expect(sim.player.payments!.standingOrders).toEqual([]);
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === 'bank.standing_order')).toEqual([]);
  }, 60_000);
  it('FIXTURE, Berlin: a switch from Deutsche Bank to Commerzbank leaves the €42,000 Flexgeld, past the €2,000 a month, on notice; three months on it closes, its money and interest sent to the Commerzbank account at once, as Deutsche Bank sends, the notice naming it', () => {
    let sim = abroad('de-be-berlin', 'de-deutsche-bank', 'scope-notice-switch');
    const flexgeld = savingsAt(sim, 'de-deutsche-bank')!;
    const set = ok<{ at: number }>(sim, 'bank.switch', { bankId: 'de-commerzbank' });
    sim.advanceTo(set.at + 60_000);
    const giro = checkingAtBank(sim, 'de-commerzbank')!;
    expect(primary(sim).id).toBe(giro.id);
    // The switch moved the current account and left the savings, giving notice on it (`completeSwitch`).
    expect(sim.universe.accounts[flexgeld.id]!.closedAt).toBeUndefined();
    const notice = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === 'bank.savings_notice' && i.payload.accountId === flexgeld.id)!;
    expect(notice.at).toBe(instantFromZoned({ ...zonedParts(set.at, 'Europe/Berlin'), month: zonedParts(set.at, 'Europe/Berlin').month + 3 }, 'Europe/Berlin'));
    sim = reload(sim);
    sim.advanceTo(notice.at - 60_000);
    const held = sim.universe.accounts[flexgeld.id]!.balance;
    sim.advanceTo(notice.at + 60_000);
    expect(sim.universe.accounts[flexgeld.id]!).toMatchObject({ closedAt: notice.at, balance: 0 });
    const interest = postedTo(sim, `Interest: ${flexgeld.name}, on closing`, flexgeld.id).reduce((n, a) => n + a, 0);
    expect(interest).toBeGreaterThan(0);
    const sent = sim.universe.transactions.filter((t) => t.at === notice.at && t.memo === `To ${giro.name} at Commerzbank`).flatMap((t) => t.postings).filter((q) => q.accountId === giro.id).map((q) => q.amount);
    expect(sent).toEqual([held + interest]);
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === 'bank.transfer_arrives')).toEqual([]);
    expect(titled(sim, `${flexgeld.name} Closed`).map((n) => n.body)).toEqual([`Its notice period ended, and what it held is now in your ${giro.name} at Commerzbank.`]);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// bank.take_overrun_loan
// ---------------------------------------------------------------------------

describe('bank.take_overrun_loan', () => {
  it('FIXTURE, Paris: €2,000 overdrawn at BNP Paribas, the loan offered by the clock three months on; Take The Loan pressed on its panel pays the overrun into the account, its €179.78 a month due a month on, and the days counted toward closing start again: a month later the account is open, where its twin that left the offer is closed and charged off', () => {
    const played = (take: boolean) => {
      let sim = abroad('fr-idf-paris', 'fr-bnp-paribas', 'scope-overrun', 'modest');
      const current = primary(sim);
      // TEST SETUP: savings emptied, so nothing is set off, and the account €2,000 under, with nothing arranged.
      for (const a of mine(sim)) if (a.kind === 'savings' && !a.closedAt) setTo(sim, a, 0);
      setTo(sim, current, -2_000_00);
      expect(current.overdraftLimit).toBeUndefined();
      const start = sim.now;
      while (!sim.universe.accounts[current.id]!.creditOffered && sim.now < start + 100 * MS_DAY) sim.advanceTo(sim.now + MS_HOUR);
      sim = reload(sim);
      const account = sim.universe.accounts[current.id]!;
      const offer = account.creditOffered!;
      // French law's three months past the limit (FRANCE.offerAfterDays), for all of the overrun, over 12 months at
      // BNP's rate, the Banque de France's average for consumer credit (LENDING['fr-bnp-paribas'].loan).
      expect(offer).toEqual({ amount: -account.balance, apr: 0.0607, months: 12 });
      expect(titled(sim, 'BNP Paribas Gave Notice To Close')).toHaveLength(1);
      if (!take) return { sim, current: account, start };
      const text = drawn(sim, createElement(BankLending, { bank: bankById('fr-bnp-paribas')!, show: ['borrowing'] }));
      expect(text).toContain(`A Loan For The Overrun €${Math.round(offer.amount / 100).toLocaleString('en-US')} over 12 months at 6.07%`);
      press('Take The Loan');
      // 2,087.96 × r / (1 − (1 + r)^−12), r = 6.07% / 12: €179.77 and a fraction, rounded up.
      expect(offer.amount).toBe(2_087_96);
      expect(h.answers.at(-1)).toEqual({ kind: 'bank.take_overrun_loan', ok: true, error: undefined });
      const loan = mine(sim).find((a) => a.kind === 'loan' && a.bankId === 'fr-bnp-paribas' && !a.closedAt)!;
      expect(loan).toMatchObject({ balance: -2_087_96, apr: 0.0607, loanPayment: 179_78, loanMonths: 12 });
      expect(account.balance).toBe(0);
      expect(account.creditOffered).toBeUndefined();
      const due = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === LOAN_DUE_KIND && i.refId === loan.id).map((i) => i.at);
      const p = zonedParts(sim.now, 'Europe/Paris');
      expect(due).toEqual([instantFromZoned({ ...p, month: p.month + 1 }, 'Europe/Paris')]);
      // Back within the limit, the count toward closing ends (from 2026-10-15: until then it ran on from the overrun's
      // first day, and the account was closed two months after the notice though the overrun was a loan).
      expect(account.negativeSince).toBeUndefined();
      expect(drawn(sim, createElement(BankLending, { bank: bankById('fr-bnp-paribas')!, show: ['borrowing'] }))).not.toContain('A Loan For The Overrun');
      // The life spends on into the account the same day (Tuesday 7 April), with nothing arranged, so the midnight after
      // finds it below zero again, and the days toward closing start from that midnight. This is the case the fix
      // changes: a midnight that finds the account within its limit clears the days anyway (`leftOverdrawn`). Without
      // the fix, run on 2026-10-15, the days ran on from the overrun's first and this twin was closed at midnight on
      // 7 May, inside the 125 days below; with it, 120 days from 8 April is 6 August.
      expect(zonedParts(sim.now, 'Europe/Paris')).toMatchObject({ year: 2026, month: 4, day: 7 });
      const midnight = instantFromZoned({ year: 2026, month: 4, day: 8, hour: 0, minute: 0 }, 'Europe/Paris');
      sim.advanceTo(midnight + MS_HOUR);
      expect(account.balance).toBeLessThan(0);
      expect(account.negativeSince).toBe(midnight);
      return { sim, current: account, start, midnight };
    };
    const left = played(false);
    const taken = played(true);
    // 60 days overdrawn and France's 60 days' notice (ESTIMATE.closeAfterDays, FRANCE.closingNoticeDays): 120 days on.
    for (const one of [left, taken]) one.sim.advanceTo(one.start + 125 * MS_DAY);
    expect(left.sim.universe.accounts[left.current.id]!.closedAt).toBeDefined();
    expect(titled(left.sim, 'BNP Paribas Closed Your Account')).toHaveLength(1);
    expect(taken.sim.universe.accounts[taken.current.id]!.closedAt).toBeUndefined();
    // Overdrawn all along since, counted from the 8 April midnight.
    expect([taken.current.balance < 0, taken.current.negativeSince]).toEqual([true, taken.midnight]);
    expect(titled(taken.sim, 'BNP Paribas Closed Your Account')).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// card.money_transfer
// ---------------------------------------------------------------------------

describe('card.money_transfer', () => {
  it('PLAYER JOURNEY: a New Haven student’s Chase card offers no money transfer: The Card’s Offers draws no Move It, and the command is refused in its words with nothing moved', () => {
    const sim = ada('scope-mt-us', 'modest');
    const card = mine(sim).find((a) => a.kind === 'credit_card' && !a.closedAt)!;
    expect(card.bankId).toBe('us-chase');
    drawn(sim, createElement(BankCardOffers, { bankId: 'us-chase' }));
    expect(h.buttons.filter((b) => b.text.startsWith('Transfer It'))).toEqual([]);
    const before = sim.universe.transactions.length;
    expect(refusal(sim, 'card.money_transfer', { amount: 100_00, accountId: card.id })).toBe(`The ${card.name} doesn’t offer money transfers.`);
    expect(sim.universe.transactions.length).toBe(before);
  });

  it('FIXTURE, London: Move It (3% Fee) pressed with £500 typed on NatWest’s card: £500 into the current account, £515 on the card as a money transfer at 12.9%; refused for nothing and past the card’s room; across a reload, a £300 payment goes to the dearer purchases first and £100 to the transfer', () => {
    let sim = abroad('uk-eng-london', 'gb-natwest', 'scope-mt');
    const card = mine(sim).find((a) => a.kind === 'credit_card' && a.bankId === 'gb-natwest')!;
    const current = primary(sim);
    const before = { current: current.balance, card: card.balance };
    drawn(sim, createElement(BankCardOffers, { bankId: 'gb-natwest' }));
    type(`card-money-transfer-${card.id}`, '500');
    drawn(sim, createElement(BankCardOffers, { bankId: 'gb-natwest' }));
    // NatWest's summary box: a money transfer for 3%, at 12.9% (CARDS['gb-natwest']).
    press('Transfer It (3% Fee)');
    expect(h.answers.at(-1)).toEqual({ kind: 'card.money_transfer', ok: true, error: undefined });
    expect(current.balance - before.current).toBe(500_00);
    expect(card.balance - before.card).toBe(-515_00);
    expect(postedTo(sim, 'Money transfer fee', card.id)).toEqual([-15_00]);
    expect(refusal(sim, 'card.money_transfer', { amount: 0, accountId: card.id })).toBe('Enter an amount.');
    // The card's room is its limit less what it owes; all of it, with 3% on top, is more than the room.
    const room = card.creditLimit! + card.balance;
    expect(refusal(sim, 'card.money_transfer', { amount: room, accountId: card.id })).toBe(`The card has £${(room / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })} of its limit left, and this needs £${((room + Math.round(room * 0.03)) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })} with its fee.`);
    sim = reload(sim);
    expect(stateOf(sim.player, sim.universe.accounts[card.id]!).transfers).toEqual([{ kind: 'money', owed: 515_00, accrued: 0, apr: 0.129 }]);
    // TEST SETUP: £200 of purchases put on the card. NatWest prices purchases 12.9% to 18.9% by the record, and this
    // record (748) is short of the best, so purchases cost more than the transfer's 12.9%.
    const kept = sim.universe.accounts[card.id]!;
    sim.post({ memo: 'Purchases', category: 'shopping', postings: [{ accountId: kept.id, amount: -200_00 }, { accountId: sim.nominalAccount('expense', 'Shopping').id, amount: 200_00 }] });
    expect(sim.player.credit!.score).toBeLessThan(780);
    // Outside the US the whole payment goes to the dearest balance first (allocatePayment, systems/cash.ts).
    expect(ok<{ paid: number }>(sim, 'finance.pay_card', { amount: 300_00, accountId: kept.id }).paid).toBe(300_00);
    sim = reload(sim);
    expect(stateOf(sim.player, sim.universe.accounts[card.id]!).transfers!.map((t) => t.owed)).toEqual([415_00]);
  });
});
