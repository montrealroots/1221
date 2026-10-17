/**
 * The guide's money entries, their worked examples played (from 2026-10-12; `src/engine/content/guide/money.ts`).
 *
 * Each entry's example (`example.setup`, `example.steps`, `example.result`) is played on a throwaway save made here by
 * `quickSave`, never handed to the persistence adapter, through the commands its steps name. The figures it states are
 * read out of the entry's own text (`GUIDE_BY_ID`) and set against what the engine then holds, so a figure that drifts
 * from the engine fails here, and so does an engine that drifts from the figure. The life is New Haven's, at Chase, the
 * bank a US life opens at, with the means the example names: Modest, or next to nothing where it starts with no savings.
 * It isn't enrolled at Yale, whose charges and work-study wages none of the examples counts.
 *
 * What the engine can't reach by a command is marked TEST SETUP: a balance set by a posting against a nominal account
 * (one no fee waiver counts as a deposit), purchases put on a card, a stranger's use of a card given as the day's draw
 * would make it (`somebodyElse`), a medical bill paid the way the health system pays one (`payFromCurrent`), a current
 * account kept in money for the years an idle savings account takes, and a credit record set at a figure.
 *
 * Home is drawn to markup (react-dom/server) over the save, as tests/defects-g8-4.test.ts draws it: `useGame` stands in
 * for the provider.
 *
 * From 2026-10-16, A Bank At Home's too, its life made at Yale as the game makes one rather than pressed into.
 *
 * Played: all twelve entries, every clause. Until a later pass of 2026-10-12 `bank.other-banks`'s “its debit card comes
 * in 6 business days” was listed here as not run, for want of anything on the sixth business day to see: it was played
 * then, and it was false, so it was corrected (below). And `bank.upkeep`'s Reactivate, which its steps and result name,
 * was never pressed, and nothing here said so; it's played now beside Keep The Account.
 *
 * Corrected (`content/guide/money.ts`):
 * - `bank.card-offers`'s setup, which had nothing else on the card and said nothing of autopay, so the default, The Whole
 *   Statement, applied (until a later pass of 2026-10-12 this said “no autopay”). Played so, autopay paid the plan off at
 *   its first due date, with one fee, and on The Minimum alone the plan ran five statements, not the six its result says.
 * - `bank.other-banks`'s result, and its entry's Decisions And Cards, which said Bank of America's debit card came in its
 *   6 business days, a digital one meanwhile. Its card works from the day the account opens and nothing arrives after
 *   it: `cardArrival` (`systems/bankmoves.ts`) works out a day from those 6, and `openApproved` drops it for a digital
 *   card. The 6 change no outcome.
 *
 * And the examples leave a live save alone: one serialised before and after all of them are played beside it is the
 * same to the byte.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, type ReactElement } from 'react';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { whatFollows } from '@/engine/systems/homeaccount';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { addMonths, instantFromZoned, startOfDay, MS_DAY, zonedParts, type Instant } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { MONEY } from '@/engine/content/guide/money';
import { LENDING } from '@/engine/content/banks-lending';
import { FRAUD_LAW } from '@/engine/content/security';
import { businessDaysBetween } from '@/engine/content/bankdays';
import '@/ui/looks/all';
import { resolveLook } from '@/ui/looks/registry';
import { feeFor, inSaveMoney, monthEndAfter, monthStartOf, productOf, rateOf } from '@/engine/systems/banking';
import { breakQuote, END_WORDS, termEndOf } from '@/engine/systems/accountlife';
import { cardTerms, DUE_KIND, dueAt, stateOf, STATEMENT_KIND } from '@/engine/systems/credit';
import { withdrawalQuote } from '@/engine/systems/cash';
import { REPLACED_KIND, somebodyElse } from '@/engine/systems/security';
import { payFromCurrent, spend } from '@/engine/systems/spending';
import { STANDING_ORDER_KIND } from '@/engine/systems/payments';
import { closeRefusal, openingDeposit } from '@/engine/systems/bankmoves';
import { depositAccount } from '@/engine/systems/routing';
import { lendingOf, purchaseMayOverdraw } from '@/engine/systems/lending';
import { bankById } from '@/engine/content/banks';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

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

const { Home } = await import('@/ui/screens/Home');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');

/** Home as the player has it, its text with the tags taken out. */
function homeText(sim: Simulation): string {
  h.sim = sim;
  return renderToStaticMarkup(createElement(Home)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}

const NEW_HAVEN = 'us-ct-newhaven';
const HOUR = 3_600_000;

// --- the save ---------------------------------------------------------------------------------------------------------

/** A life begun in New Haven, at Chase, with the means named; on the day named, or the default's Monday 5 January 2026. */
function life(wealth: 'nothing' | 'modest', start?: { month: number; day: number }): Simulation {
  return quickSave({ homeRegionId: NEW_HAVEN, startLocationId: NEW_HAVEN, livesWhereBorn: true, wealth, ...(start ? { startMonth: start.month, startDay: start.day } : {}) });
}

const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const own = (sim: Simulation, kind: Account['kind'], bankId = 'us-chase'): Account | undefined => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && a.bankId === bankId && !a.closedAt && a.category !== 'term');

function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}

/** TEST SETUP: an account brought to a balance, by a posting against a nominal account no waiver counts as a deposit. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}

/** TEST SETUP: purchases on a card. */
function purchases(sim: Simulation, card: Account, amount: number): void {
  sim.post({ memo: 'TEST SETUP: purchases', category: 'shopping', postings: [{ accountId: card.id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test Setup').id, amount }] });
}

/** The postings on an account since a moment whose memo matches. */
const postings = (sim: Simulation, account: Account, memo: RegExp, since: Instant) => sim.universe.transactions
  .filter((t) => t.at >= since && memo.test(t.memo))
  .flatMap((t) => t.postings.filter((p) => p.accountId === account.id).map((p) => ({ at: t.at, amount: p.amount })));

const notes = (sim: Simulation, title: RegExp, since: Instant) => sim.universe.notifications.filter((n) => n.at >= since && title.test(n.title));
const at = (sim: Simulation, year: number, month: number, day: number, hour = 12) => instantFromZoned({ year, month, day, hour }, sim.homeZone);
const usDays = (sim: Simulation, from: Instant, to: Instant) => businessDaysBetween(from, to, 'us', sim.homeZone, 'us-ct');

// --- the text ---------------------------------------------------------------------------------------------------------

const example = (id: string) => {
  const entry = GUIDE_BY_ID[id];
  expect(entry, id).toBeDefined();
  return entry!.example;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function grab(text: string, before: string, inner: string, after: string): string {
  const m = text.match(new RegExp(escape(before) + inner + escape(after)));
  expect(m, `“${before}…${after}” in: ${text}`).not.toBeNull();
  return m![1]!;
}
/** A sum the text states between two phrases, in cents. */
const sum = (text: string, before: string, after: string) => Math.round(Number(grab(text, before, String.raw`\$(\d[\d,]*(?:\.\d\d)?)`, after).replace(/,/g, '')) * 100);
/** Pounds the text states between two phrases, "£2.10" or "70p", in pence. */
const pence = (text: string, before: string, after: string) => { const v = grab(text, before, String.raw`(£\d+\.\d\d|\d+p)`, after); return v.startsWith('£') ? Math.round(Number(v.slice(1)) * 100) : Number(v.slice(0, -1)); };
/** A rate the text states, as a fraction. */
const rate = (text: string, before: string, after: string) => Number(grab(text, before, String.raw`(\d+(?:\.\d+)?)%`, after)) / 100;
/** A count the text states. */
const count = (text: string, before: string, after: string) => Number(grab(text, before, String.raw`(\d+)`, after));

// --- the examples -----------------------------------------------------------------------------------------------------

const PLAYS: Record<string, () => void> = {
  // From 2026-10-13: NatWest's own example (natwest.com, Round Ups: "£2.30 gives 70p; ×3 gives £2.10"), played.
  'bank.round-ups': () => {
    const { setup, steps, result } = example('bank.round-ups');
    expect(setup).toBe('A life in London at NatWest, with savings there and money in the current account.');
    const sim = quickSave({ homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', livesWhereBorn: true, wealth: 'comfortable', bankId: 'gb-natwest' }, 'guide-round-ups');
    const current = primary(sim);
    const savings = own(sim, 'savings', 'gb-natwest')!;
    expect(current.bankId).toBe('gb-natwest');
    expect(savings).toBeDefined();
    expect(current.balance).toBeGreaterThan(100_00);
    // The labels the steps name are the panel's (`ui/bank/RoundUps.tsx`): its Multiplier and its On/Off button.
    const panel = readFileSync('src/ui/bank/RoundUps.tsx', 'utf8');
    expect(panel).toContain("select('Multiplier', 'multiplier'");
    expect(panel).toContain("Round-Ups: {on ? 'On' : 'Off'}");
    const factor = count(steps[0]!, 'choose a Multiplier of ×', ' and press Round-Ups: Off to turn them on.');
    must(sim, 'bank.set_round_ups', { on: true, multiplier: factor });
    must(sim, 'bank.set_payments', { everyday: 'debit' });
    const price = pence(steps[1]!, 'A purchase of ', ' is paid by debit card.');
    // TEST SETUP: a purchase of a set amount on the debit card, as the day's groceries are made.
    const before = sim.player.roundUps!.pending;
    expect(spend(sim, sim.player, price, 'A purchase', 'food')).toBe(true);
    const counted = sim.player.roundUps!.pending - before;
    expect(counted).toBe(pence(result, 'The purchase counts ', ': its change of'));
    expect(counted).toBe(pence(result, 'its change of ', ', three times') * factor);
    expect(steps[2]).toBe('The day ends.');
    const night = at(sim, 2026, 1, 6, 0);
    sim.advanceTo(night + 60_000);
    const moved = postings(sim, savings, /^Round-ups$/, night - HOUR);
    expect(moved).toEqual([{ at: night, amount: pence(result, 'At the start of the next day ', ' moves from the current account') }]);
    expect(postings(sim, current, /^Round-ups$/, night - HOUR)).toEqual([{ at: night, amount: -moved[0]!.amount }]);
    h.sim = sim;
    const shown = renderToStaticMarkup(createElement(BankAccountLife, { bankId: 'gb-natwest' })).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const said = grab(result, 'the panel says “', '(Last moved to savings: £\\d+\\.\\d\\d)', '”');
    expect(shown).toContain(said);
  },
  'money.affairs': () => {
    const { setup, result } = example('money.affairs');
    const sim = life('modest');
    const checking = primary(sim);
    const savings = own(sim, 'savings')!;
    const card = own(sim, 'credit_card')!;
    expect(checking.bankId).toBe('us-chase');
    const started = { checking: sum(setup, '', ` in ${checking.name}`), owed: sum(setup, 'and ', ` owed on the ${card.name}`) };
    expect(checking.balance).toBe(started.checking);
    expect(savings.balance).toBe(sum(setup, '', ` in ${savings.name}`));
    expect(-card.balance).toBe(started.owed);
    expect(card.creditLimit).toBe(sum(setup, 'against a ', ' limit'));

    // The Money line, as Home draws it. Until a later pass of 2026-10-12 it was rebuilt here from Home's template, which
    // a change to Home wouldn't have failed.
    expect(homeText(sim)).toContain(grab(result, 'The line reads “', '(.+?)', '”'));

    // Owed: the card in its introduction, charged nothing today, its own rate after.
    const owedLook = () => resolveLook(sim, { kind: 'debt', id: sim.player.id }) as { summary: string; body: ReactElement };
    const html = renderToStaticMarkup(owedLook().body);
    expect(html).toContain('They’re charged no interest today.');
    const terms = cardTerms(sim, card, sim.player.credit!.score);
    expect(terms.apr).toBeCloseTo(rate(result, 'card is at ', ' until'), 6);
    expect(terms.standardApr).toBeCloseTo(rate(result, 'then ', ':'), 6);
    expect(html).toContain(`then ${(terms.standardApr! * 100).toFixed(2)}%.`);
    expect(Number(html.match(/You’re using (\d+)%/)![1])).toBe(count(result, 'Credit Used is ', '%'));

    // Credit Used past the line the text names costs the record at the month's report, by the points a tenth the entry's
    // Credit Used reads, rounded to whole points; at the line it costs nothing. Lives alike to the first due date but for
    // what the card owes once autopay has paid the statement. The rounding leaves 30% to 32.5% costing nothing, so a line
    // a point or two off would pass at the line and well past it: 1%, 2% and 3% past it are where it shows. Until a later
    // pass of 2026-10-12 nothing here read the line, and 50% passed.
    const line = rate(result, 'under the ', ' where your score');
    const tenth = count(GUIDE_BY_ID['money.affairs']!.reads.find((r) => r.label === 'Credit Used')!.value, 'takes ', ' points');
    const reported = (used: number) => {
      const one = life('modest');
      const c = own(one, 'credit_card')!;
      must(one, 'finance.set_autopay', { mode: 'full', accountId: c.id });
      const next = (kind: string) => one.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at)[0]!;
      one.advanceTo(next(STATEMENT_KIND).at + HOUR);
      const spent = Math.round(c.creditLimit! * used);
      if (spent > 0) purchases(one, c, spent); // TEST SETUP: after the statement, so its autopay leaves them owed
      one.advanceTo(next(DUE_KIND).at + HOUR);
      expect(c.balance + spent).toBe(0);
      return one.player.credit!.score;
    };
    const clear = reported(0);
    for (const past of [0, 0.01, 0.02, 0.03, 0.1]) expect(clear - reported(line + past), `${Math.round((line + past) * 100)}% used`).toBe(Math.round(past * 10 * tenth));

    // A year of its interest from the day the introduction ends, as Owed says it then, on the same sum owed. Until a
    // later pass of 2026-10-12 this was the text's own sum worked again here, which couldn't disagree with it.
    sim.advanceTo(terms.introUntil! + 36 * HOUR);
    setBalance(sim, card, -started.owed); // TEST SETUP: the sum the setup owes, carried to then
    setBalance(sim, checking, started.checking); // TEST SETUP: kept in money, so the card is all that's owed
    const after = owedLook();
    expect(after.summary).toContain(`all of it on the ${card.name}`);
    const yearly = Math.round(Number(renderToStaticMarkup(after.body).match(/would cost about \$([\d,]+\.\d\d) a year/)![1]!.replace(/,/g, '')) * 100);
    expect(Math.abs(yearly - sum(result, 'about ', ' a year'))).toBeLessThanOrEqual(50);
  },

  'bank.accounts': () => {
    const { setup, steps, result } = example('bank.accounts');
    const sim = life('nothing');
    const checking = primary(sim);
    expect(own(sim, 'savings')).toBeUndefined();
    setBalance(sim, checking, sum(setup, 'with ', ` in ${checking.name}`)); // TEST SETUP
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open_savings');
    const savings = sim.universe.accounts[accountId]!;
    expect(steps[0]).toContain(savings.name);
    const moved = sum(steps[1]!, 'move ', ' from');
    must(sim, 'bank.transfer', { fromId: checking.id, toId: savings.id, amount: moved });
    expect(checking.balance).toBe(sum(result, 'with about ', ' and nothing paid in'));

    // To the month's end: savings never under the waiver's balance, so no fee; under a cent of interest, so none paid.
    const since = sim.now;
    const end = monthEndAfter(sim, sim.now);
    sim.advanceTo(end - HOUR);
    expect(savings.lowest).toBeGreaterThanOrEqual(sum(result, 'never ends a day under ', ', so'));
    expect(feeFor(sim, savings, monthStartOf(sim, sim.now))).toEqual({ fee: 0, waivedBy: 'balance' });
    expect(inSaveMoney(sim, productOf(savings)!.monthlyFee!, 'USD')).toBe(sum(result, 'so its ', ' fee is waived'));
    expect(rateOf(sim, savings)).toBeCloseTo(rate(result, 'at ', ' its'), 8);
    sim.advanceTo(end + HOUR);
    expect(postings(sim, savings, /fee/i, since)).toEqual([]);
    expect(postings(sim, savings, /Interest/, since)).toEqual([]);
    expect(result).toContain('less than a cent');
    expect(savings.accrued).toBeGreaterThan(0);
    expect(savings.accrued).toBeLessThan(1);
    expect(savings.balance).toBe(moved);

    // The current account met none of its waivers, and its fee came off at 11 PM on the month's last day.
    expect(postings(sim, checking, /Monthly fee/, since)).toEqual([{ at: end, amount: -sum(result, 'so its ', ' fee is charged') }]);
    const p = zonedParts(end, sim.homeZone);
    expect([p.hour, p.day]).toEqual([23, new Date(Date.UTC(p.year, p.month, 0)).getUTCDate()]);
  },

  'bank.transfer': () => {
    const { setup, steps, result } = example('bank.transfer');
    // From the first of the month, so savings has held its sum all month.
    const sim = life('nothing', { month: 2, day: 1 });
    const cur = saveCurrency(sim.universe);
    const checking = primary(sim);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open_savings');
    const savings = sim.universe.accounts[accountId]!;
    setBalance(sim, savings, sum(setup, 'has held ', ' all month')); // TEST SETUP
    sim.advanceTo(at(sim, 2026, 2, 10));
    setBalance(sim, checking, sum(setup, 'holds ', ',')); // TEST SETUP
    const moved = must<{ moved: number; arrivesAt?: number }>(sim, 'bank.transfer', { fromId: checking.id, toId: savings.id, amount: count(steps[1]!, 'Type ', ' and press') * 100 });
    expect(moved.arrivesAt).toBeUndefined();
    // The message, as the bank screen words it (`ui/workspaces/BankWorkspace.tsx`).
    expect(result).toContain(`“Moved ${formatMoney(moved.moved, cur, { cents: false })}.”`);
    expect(checking.balance).toBe(sum(result, 'Checking holds ', ' and savings'));
    expect(savings.balance).toBe(sum(result, 'and savings ', ' at once'));

    // This month's fee comes off for the days at $100, and leaves $345.
    const since = sim.now;
    const end = monthEndAfter(sim, sim.now);
    sim.advanceTo(end + HOUR);
    expect(postings(sim, savings, /Monthly fee/, since)).toEqual([{ at: end, amount: -sum(result, 'this month’s ', ' fee is still') }]);
    expect(savings.balance).toBe(sum(result, 'leaving ', '.'));
    expect(savings.balance).toBeGreaterThan(sum(result, 'That’s over ', ', so'));

    // Left there, next month's is waived.
    const next = monthEndAfter(sim, sim.now);
    sim.advanceTo(next + HOUR);
    expect(postings(sim, savings, /Monthly fee/, end + HOUR)).toEqual([]);
    expect(savings.balance).toBe(sum(result, 'leaving ', '.'));
  },

  'bank.term': () => {
    const { setup, steps, result } = example('bank.term');
    const opened = (sim: Simulation) => {
      const checking = primary(sim);
      const { accountId } = must<{ accountId: string }>(sim, 'bank.open_term', { amount: count(steps[0]!, 'Type ', ' and press') * 100 });
      const term = sim.universe.accounts[accountId]!;
      expect(term.balance).toBe(sum(setup, 'puts ', ' into'));
      expect(term.maturesAt).toBe(addMonths(term.openedAt, count(setup, ', ', ' months at'), sim.homeZone));
      expect(term.fixedRate).toBeCloseTo(rate(setup, 'months at ', '.'), 8);
      return { checking, term };
    };

    // Broken after sixty days: the penalty is capped at what it has earned, and the deposit comes back whole.
    const sim = life('modest');
    const { checking, term } = opened(sim);
    sim.advanceTo(sim.now + count(result, 'After ', ' days') * MS_DAY);
    const earned = Math.floor(term.accrued ?? 0);
    expect(earned).toBe(sum(result, 'it has earned ', '. A'));
    expect(breakQuote(sim, term)).toMatchObject({ penalty: sum(result, 'so the penalty is the ', ' and'), estimate: false });
    const before = checking.balance;
    must(sim, 'bank.break_term', { accountId: term.id });
    expect(checking.balance - before).toBe(sum(result, 'and ', ' goes back'));
    expect(term.closedAt).toBe(sim.now);

    // Uncapped, the band's days of interest: what the quote is once the interest earned passes it.
    const kept = life('modest');
    const whole = opened(kept).term;
    kept.advanceTo(at(kept, 2026, 7, 25));
    const days = count(result, 'penalty is ', ' days’ interest');
    expect(breakQuote(kept, whole).penalty).toBe(sum(result, 'days’ interest, ', ', but never'));
    expect(Math.round((whole.balance * whole.fixedRate! * days) / 365)).toBe(breakQuote(kept, whole).penalty);

    // Left to its end: about the interest said, and then it renews for the same term at the bank's rate.
    // It ends at the midnight that opens its maturity day (from 2026-10-13: until then at the one after that day, which
    // it earned too).
    const end = startOfDay(whole.maturesAt!, kept.homeZone);
    kept.advanceTo(end + 2 * MS_DAY);
    const reinvested = postings(kept, whole, /reinvested/, end);
    expect(reinvested).toHaveLength(1);
    expect(reinvested[0]!.at).toBe(end);
    expect(Math.abs(reinvested[0]!.amount - sum(result, 'would have earned about ', ', and then'))).toBeLessThanOrEqual(Math.round((1_000_00 * whole.fixedRate!) / 365));
    expect(result).toContain(END_WORDS[termEndOf(whole)]);
    expect(whole.closedAt).toBeUndefined();
    expect(whole.renewedAt).toBe(reinvested[0]!.at);
    expect(whole.maturesAt).toBe(addMonths(whole.renewedAt!, count(setup, ', ', ' months at'), kept.homeZone));
    expect(whole.fixedRate).toBe(LENDING['us-chase']!.term!.rate);
  },

  'bank.upkeep': () => {
    const { setup, steps, result } = example('bank.upkeep');
    // Reactivate, as the button beside a dormant account names the command it runs (`ui/bank/BankAccountLife.tsx`).
    const reactivate = readFileSync('src/ui/bank/BankAccountLife.tsx', 'utf8').match(/run\('bank\.reactivate'[^>]*>([^<]+)<\/Gated>/)![1]!;
    expect(steps[1]).toContain(`with ${reactivate} beside it`);
    expect(result).toContain(`or ${reactivate} counts as using it`);
    const play = (press: 'nothing' | 'keep' | 'reactivate', months = 40) => {
      const sim = life('modest');
      const checking = primary(sim);
      const savings = own(sim, 'savings')!;
      expect(savings.balance).toBe(sum(setup, 'leaves ', ` in ${savings.name}`));
      const opened = savings.openedAt;
      const seen: { inactive?: Instant; dormant?: Instant; warned?: Instant; gone?: Instant; kept?: Instant; reactivated?: Instant; inactiveAgain?: Instant } = {};
      const base = monthStartOf(sim, opened);
      for (let k = 1; k <= months; k += 1) {
        // The first of each month, after the bank has looked.
        const first = addMonths(base, k, sim.homeZone);
        sim.advanceTo(first + 6 * HOUR);
        setBalance(sim, checking, 3_000_00); // TEST SETUP: the current account kept in money, as an income would keep it.
        if (savings.inactive && seen.inactive === undefined) seen.inactive = first;
        if (savings.inactive && seen.reactivated !== undefined && seen.inactiveAgain === undefined) seen.inactiveAgain = first;
        if (savings.dormant && seen.dormant === undefined) {
          seen.dormant = first;
          if (press === 'reactivate') {
            must(sim, 'bank.reactivate', { accountId: savings.id });
            seen.reactivated = sim.now;
            expect([savings.dormant, savings.inactive]).toEqual([undefined, undefined]);
          }
        }
        if (savings.escheatWarned !== undefined && seen.warned === undefined) {
          seen.warned = savings.escheatWarned;
          if (press === 'keep') {
            const asked = Object.values(sim.universe.decisions).find((d) => d.refType === 'unclaimed-notice' && d.refId === savings.id)!;
            const press = asked.actions.find((a) => a.label === 'Keep The Account')!;
            expect(steps[2]).toContain(press.label);
            must(sim, press.commandKind, press.payload);
            seen.kept = sim.now;
            expect(asked.resolvedAt).toBe(sim.now);
            expect([savings.dormant, savings.inactive, savings.escheatWarned]).toEqual([undefined, undefined, undefined]);
          }
        }
        if (savings.closedAt !== undefined && seen.gone === undefined) seen.gone = savings.closedAt;
      }
      const interest = postings(sim, savings, /^Interest/, opened).reduce((s, p) => s + p.amount, 0);
      return { sim, checking, savings, seen, opened, interest };
    };

    // Months untouched as the bank counts them, 30.44 days each (`idleAccounts`, `systems/accountlife.ts`).
    const months = (from: Instant, n: number) => from + n * 30.44 * MS_DAY;
    const ignored = play('nothing');
    const { opened, seen } = ignored;
    const inactiveAfter = count(steps[0]!, 'At ', ' months');
    const dormantAfter = count(steps[1]!, 'At ', ', Chase');
    const years = count(steps[2]!, 'days of ', ' years');
    const window = count(steps[2]!, 'within ', ' days of');
    // Inactive on the first first-of-the-month past its months untouched, dormant on the first past its own, each with the
    // bank's look on the first.
    expect(seen.inactive).toBeGreaterThanOrEqual(months(opened, inactiveAfter));
    expect(seen.inactive).toBeLessThan(months(opened, inactiveAfter) + 32 * MS_DAY);
    expect(seen.dormant).toBeGreaterThanOrEqual(months(opened, dormantAfter));
    expect(seen.dormant).toBeLessThan(months(opened, dormantAfter) + 32 * MS_DAY);
    expect(notes(ignored.sim, /Is Dormant$/, opened).map((n) => n.at)).toEqual([seen.dormant]);
    // The letter on a first of the month inside the window before the years, the money gone on the first after them.
    const due = opened + years * 365.25 * MS_DAY;
    expect(seen.warned).toBeGreaterThanOrEqual(due - window * MS_DAY);
    expect(seen.warned).toBeLessThan(due);
    expect(zonedParts(seen.warned!, ignored.sim.homeZone).day).toBe(1);
    expect(seen.gone).toBeGreaterThanOrEqual(due);
    expect(seen.gone).toBeLessThan(due + 32 * MS_DAY);
    expect(zonedParts(seen.gone!, ignored.sim.homeZone).day).toBe(1);
    // Its balance and the interest it built, to the state's office; claimed back whole into the primary account.
    const held = ignored.sim.player.unclaimed ?? [];
    expect(held).toHaveLength(1);
    expect(ignored.interest).toBeGreaterThan(0);
    expect(held[0]!.amount).toBe(sum(result, 'years its ', ' and the interest') + ignored.interest);
    expect(result).toContain('unclaimed-property office');
    expect(held[0]!.to).toMatch(/unclaimed-property office/);
    const before = ignored.checking.balance;
    must(ignored.sim, 'bank.claim_unclaimed');
    expect(ignored.checking.balance - before).toBe(held[0]!.amount);
    expect(ignored.sim.player.unclaimed).toEqual([]);

    // Kept: its months start again from the day it's kept, and nothing goes to the state.
    const kept = play('keep');
    expect(kept.seen.kept).toBeDefined();
    expect(kept.seen.gone).toBeUndefined();
    expect(kept.savings.closedAt).toBeUndefined();
    expect(kept.savings.reactivatedAt).toBe(kept.seen.kept);
    expect(kept.savings.inactive).toBe(false);
    expect(kept.sim.player.unclaimed ?? []).toEqual([]);

    // Reactivated on the first of the month it's found dormant: its months start again from that day, so it goes inactive
    // again its months later, and isn't written about or handed over at the years that took the ignored one's. Until a
    // later pass of 2026-10-12 Reactivate wasn't pressed here.
    const woken = play('reactivate', 60);
    expect(woken.seen.reactivated).toBe(woken.seen.dormant! + 6 * HOUR);
    expect(woken.savings.reactivatedAt).toBe(woken.seen.reactivated);
    expect(woken.seen.inactiveAgain).toBeGreaterThanOrEqual(months(woken.seen.reactivated!, inactiveAfter));
    expect(woken.seen.inactiveAgain).toBeLessThan(months(woken.seen.reactivated!, inactiveAfter) + 32 * MS_DAY);
    expect(woken.seen.inactiveAgain).toBeGreaterThan(due);
    expect([woken.seen.warned, woken.seen.gone, woken.savings.closedAt]).toEqual([undefined, undefined, undefined]);
    expect(woken.sim.player.unclaimed ?? []).toEqual([]);
  },

  'bank.payments': () => {
    const { setup, steps, result } = example('bank.payments');
    const sim = life('nothing');
    const checking = primary(sim);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open_savings');
    const savings = sim.universe.accounts[accountId]!;
    expect(setup).toContain(savings.name);
    const amount = count(steps[0]!, 'type ', ' and') * 100;
    expect(amount).toBe(sum(setup, 'sets up a ', ' standing order'));
    const day = count(steps[0]!, ' and ', ', and press');
    must(sim, 'bank.add_standing_order', { toId: savings.id, amount, day });
    const p = zonedParts(sim.now, sim.zone);
    const due = addMonths(instantFromZoned({ year: p.year, month: p.month, day, hour: 9 }, sim.zone), 1, sim.zone);

    // Short For A Payment: at the first of the day's checks inside its days before, with the account short for the order.
    // The check is daily, so that's within the window's first day. Until a later pass of 2026-10-12 only the far side was
    // held, and “up to 30 days before” passed.
    const since = sim.now;
    sim.advanceTo(due - HOUR);
    const warned = notes(sim, /^Short For A Payment/, since);
    expect(warned).toHaveLength(1);
    const ahead = count(result, 'up to ', ' days before');
    expect(warned[0]!.at).toBeGreaterThanOrEqual(due - ahead * MS_DAY);
    expect(warned[0]!.at).toBeLessThan(due - (ahead - 1) * MS_DAY);
    setBalance(sim, checking, sum(setup, 'holds ', ' that morning')); // TEST SETUP: what the account holds that morning

    // At 9 AM the order doesn't go, none of it, and it's set for the same day next month.
    sim.advanceTo(due + HOUR);
    expect(postings(sim, savings, /Standing order/, since)).toEqual([]);
    expect(checking.balance).toBe(sum(setup, 'holds ', ' that morning'));
    const didnt = notes(sim, /^A Standing Order Didn’t Go$/, due);
    expect(didnt.map((n) => n.at)).toEqual([due]);
    expect(result).toContain(`“${didnt[0]!.title}”`);
    const again = sim.universe.scheduled.filter((i) => i.kind === STANDING_ORDER_KIND && i.status === 'pending');
    expect(again.map((i) => i.at)).toEqual([addMonths(due, 1, sim.zone)]);
  },

  'bank.cash': () => {
    const { setup, result } = example('bank.cash');
    const amount = sum(setup, 'needs ', ' in cash');
    // Another bank's machine: Chase's fee and the owner's, out of checking.
    const elsewhere = life('modest');
    const other = withdrawalQuote(elsewhere, elsewhere.player, amount, 'other_atm');
    expect(other.fee).toBe(sum(result, 'would cost ', ' to Chase'));
    expect(other.ownerCharge).toBe(sum(result, 'to Chase and ', ' to its owner'));
    const before = primary(elsewhere).balance;
    must(elsewhere, 'cash.withdraw', { amount, from: 'other_atm' });
    expect(before - primary(elsewhere).balance).toBe(sum(result, 'owner, ', ' out of checking'));

    // Chase's own: free, the sum out and the sum in hand.
    const sim = life('modest');
    const checking = primary(sim);
    expect(withdrawalQuote(sim, sim.player, amount, 'atm').fee).toBe(0);
    expect(result).toContain('own is free');
    // A cash advance on the card, quoted: its fee at once and its cash rate.
    const card = own(sim, 'credit_card')!;
    expect(withdrawalQuote(sim, sim.player, amount, 'card').fee).toBe(sum(result, 'would cost ', ' at once'));
    expect(cardTerms(sim, card, sim.player.credit!.score).cashApr).toBeCloseTo(rate(result, 'at once and ', ' a year'), 6);
    const start = checking.balance;
    must(sim, 'cash.withdraw', { amount, from: 'atm' });
    const wallet = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'cash')!;
    expect(start - checking.balance).toBe(sum(result, 'free: ', ' out'));
    expect(wallet.balance).toBe(sum(result, 'out, ', ' in your hand'));
  },

  'bank.card': () => {
    const { setup, steps, result } = example('bank.card');
    const sim = life('modest');
    const record = sim.player.credit!;
    expect(record.score).toBe(count(setup, 'score of ', ','));
    expect(own(sim, 'credit_card')!.name).toBe(grab(setup, 'holding the ', '(.+?)', ', applies'));

    // Applying: the inquiry off the record at once, approved over the line. Until a later pass of 2026-10-12 the drop and
    // the line were each set against the constant the text is written from, which couldn't fail.
    const before = record.score;
    const appliedAt = sim.now;
    const applied = must<{ approved: boolean; limit: number }>(sim, 'card.apply', { bankId: 'us-wells-fargo' });
    const drop = count(result, 'drops ', ' points');
    expect(before - record.score).toBe(drop);
    expect(record.score).toBe(count(result, 'points to ', ','));
    expect(applied).toEqual({ approved: true, limit: sum(result, 'with a ', ' limit') });
    // The line: approved with the record at it once the inquiry is off, declined a point under it.
    const line = count(result, 'over the ', ' a bank');
    for (const [stands, approved] of [[line - 1, false], [line, true]] as const) {
      const other = life('modest');
      other.player.credit!.score = stands + drop; // TEST SETUP: a record at a figure
      expect(must<{ approved: boolean }>(other, 'card.apply', { bankId: 'us-wells-fargo' }).approved, `a record of ${stands} after applying`).toBe(approved);
    }

    // A week later it arrives, at the rate the record buys, 0% for its introductory months. Until a later pass of
    // 2026-10-12 the week wasn't read: the play went a week on and looked, and a month passed.
    const later = { day: MS_DAY, week: 7 * MS_DAY }[grab(steps[1]!, 'A ', '(\\w+)', ' later it arrives')];
    expect(later).toBeDefined();
    sim.advanceTo(appliedAt + later! - HOUR);
    expect(own(sim, 'credit_card', 'us-wells-fargo')).toBeUndefined();
    sim.advanceTo(appliedAt + later! + HOUR);
    const card = own(sim, 'credit_card', 'us-wells-fargo')!;
    expect(card.openedAt).toBe(appliedAt + later!);
    expect(card.name).toBe(grab(setup, 'applies for the ', '(.+?)', '.'));
    must(sim, 'card.set_everyday', { accountId: card.id });
    expect(card.creditLimit).toBe(sum(result, 'with a ', ' limit'));
    expect(card.apr).toBeCloseTo(rate(result, ' limit at ', ', '), 6);
    const terms = cardTerms(sim, card, record.score);
    expect(terms.apr).toBeCloseTo(rate(result, ', and ', ' on purchases'), 6);
    expect(terms.introUntil).toBe(addMonths(card.openedAt, count(result, 'its first ', ' months'), sim.homeZone));
    expect(stateOf(sim.player, card).autopay).toBe('full');

    // Its first statement asks $300: the floor over the share, no interest in the introduction, due its days later.
    purchases(sim, card, sum(steps[2]!, 'asks for ', ',')); // TEST SETUP
    const statement = sim.universe.scheduled.find((i) => i.kind === 'card.statement' && i.status === 'pending' && i.payload.accountId === card.id)!;
    sim.advanceTo(statement.at + HOUR);
    const state = stateOf(sim.player, card);
    expect(state.statementBalance).toBe(sum(steps[2]!, 'asks for ', ','));
    expect(state.statementInterest ?? 0).toBe(0);
    expect(Math.round(state.statementBalance * terms.minimumShare)).toBe(sum(result, `of ${formatMoney(state.statementBalance, 'USD', { cents: false })} is `, ','));
    expect(terms.minimumFloor).toBe(sum(result, 'floor is ', '.'));
    expect(state.issued!.at(-1)!.minimum).toBe(sum(result, 'minimum payment is ', ':'));
    const due = sim.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === card.id)!;
    expect(due.at).toBe(dueAt(sim.zone, statement.at, count(result, 'due ', ' days later')));

    // Autopay takes the whole statement on the due date, and the month is on the record paid on time.
    sim.advanceTo(due.at - HOUR);
    const score = record.score;
    const since = sim.now;
    sim.advanceTo(due.at + HOUR);
    expect(postings(sim, card, /^Paid /, since).map((p) => p.amount)).toEqual([sum(result, 'pays the whole ', ' and the month')]);
    expect(card.balance).toBe(0);
    expect(notes(sim, /Late|Bounced/, since)).toEqual([]);
    expect(stateOf(sim.player, card).missed ?? 0).toBe(0);
    expect(record.score).toBeGreaterThan(score);
  },

  'bank.card-offers': () => {
    const { setup, steps, result } = example('bank.card-offers');
    const owe = sum(setup, 'You owe ', ' for purchases');
    const months = count(steps[0]!, 'choose ', ' months');
    const pastIntro = (sim: Simulation) => {
      const card = own(sim, 'credit_card')!;
      expect(setup).toContain(card.name);
      const terms = cardTerms(sim, card, sim.player.credit!.score);
      sim.advanceTo(terms.introUntil! + 36 * HOUR);
      const now = cardTerms(sim, card, sim.player.credit!.score);
      expect(now.standardApr).toBeUndefined();
      expect(now.apr).toBeCloseTo(rate(setup, 'months, at ', '.'), 6);
      expect(card.balance).toBe(0);
      purchases(sim, card, owe); // TEST SETUP
      return card;
    };

    // The plan: each statement asks its month and its fee beside the rest's minimum, for its months.
    const sim = life('modest');
    const card = pastIntro(sim);
    expect(setup).toContain('The Day’s Spending is On The Credit Card, and Autopay is on The Minimum.');
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    must(sim, 'finance.set_autopay', { mode: 'minimum', accountId: card.id });
    const { plan } = must<{ plan: { monthly: number; fee: number; monthsLeft: number } }>(sim, 'card.plan', { amount: count(steps[0]!, 'Type ', ' in Amount') * 100, months });
    expect(plan.monthly).toBe(sum(result, 'asks for ', ' of the plan'));
    expect(plan.fee).toBe(sum(result, 'and its ', ' fee'));
    const since = sim.now;
    const asked: number[] = [];
    for (let k = 0; k <= months; k += 1) {
      const next = sim.universe.scheduled.filter((i) => i.kind === 'card.statement' && i.status === 'pending' && i.payload.accountId === card.id).sort((a, b) => a.at - b.at)[0]!;
      sim.advanceTo(next.at + HOUR);
      asked.push(stateOf(sim.player, card).statementPlanDue ?? 0);
    }
    const each = sum(result, 'fee, ', ' on top');
    expect(asked).toEqual([...Array<number>(count(result, 'for ', ' statements')).fill(each), 0]);
    const fees = postings(sim, card, /^Plan fee$/, since);
    expect(fees).toHaveLength(count(result, 'for ', ' statements'));
    expect(-fees.reduce((s, p) => s + p.amount, 0)).toBe(sum(result, 'statements: ', ' in fees'));
    expect(notes(sim, /Late|Bounced/, since)).toEqual([]);

    // The same sum paid down by the same amount a month instead, its interest about what the text says.
    const alone = life('modest');
    const bare = pastIntro(alone);
    must(alone, 'finance.set_autopay', { mode: 'minimum', accountId: bare.id });
    const from = alone.now;
    for (let k = 0; k < 12 && bare.balance < 0; k += 1) {
      const next = alone.universe.scheduled.filter((i) => i.kind === 'card.statement' && i.status === 'pending' && i.payload.accountId === bare.id).sort((a, b) => a.at - b.at)[0]!;
      alone.advanceTo(next.at + HOUR);
      if (bare.balance < 0) must(alone, 'finance.pay_card', { amount: Math.min(plan.monthly, -bare.balance), accountId: bare.id });
    }
    expect(bare.balance).toBe(0);
    const interest = -postings(alone, bare, /^Interest$/, from).reduce((s, p) => s + p.amount, 0);
    const said = sum(result, 'would cost about ', ' in interest');
    expect(Math.abs(interest - said) / said).toBeLessThan(0.05);
  },

  'bank.card-security': () => {
    const { setup, steps, result } = example('bank.card-security');
    const sim = life('modest');
    const checking = primary(sim);
    const law = FRAUD_LAW.US!;
    const spent = sum(setup, 'spends ', ', the US average');
    expect(inSaveMoney(sim, law.avgLoss!, 'USD')).toBe(spent);
    must(sim, 'bank.set_alerts', { largePayment: sum(setup, 'set at ', '.') });
    const plastic = () => checking.plastic!;

    // TEST SETUP: the stranger's use, given as the day's draw would make it.
    const since = sim.now;
    const balance = checking.balance;
    somebodyElse(sim, sim.player, { which: 'debit', account: checking, amount: spent, stopped: false });
    expect(checking.balance).toBe(balance - spent);
    expect(notes(sim, /^A Large Payment$/, since).map((n) => n.at)).toEqual([since]);
    expect(steps[0]).toContain('“A Large Payment”');
    const last4 = plastic().last4;

    // Reported the next morning: the law's first tier, the rest refunded in its days, the card stopped and replaced free.
    sim.advanceTo(at(sim, 2026, 1, 6, 8));
    const reported = sim.now;
    const answer = must<{ carried: number; refundAt: number }>(sim, 'card.dispute', { index: 0 });
    expect(answer.carried).toBe(sum(result, 'leaves you to pay at most ', ', and'));
    expect(usDays(sim, reported, answer.refundAt)).toBe(count(result, 'within ', ' business days. The'));
    expect(plastic().stopped).toBe('fraud');
    expect(usDays(sim, reported, plastic().replacementAt!)).toBe(count(result, 'arrives in ', ' business days'));
    const arrives = plastic().replacementAt!;
    sim.advanceTo(Math.max(answer.refundAt, arrives) + HOUR);
    expect(postings(sim, checking, /^Refund/, reported)).toEqual([{ at: answer.refundAt, amount: sum(result, ', and ', ' comes back') }]);
    expect(postings(sim, checking, /Replacement card fee/, since)).toEqual([]);
    expect(result).toContain('free');
    expect(plastic().stopped).toBeUndefined();
    expect(plastic().last4).not.toBe(last4);
  },

  'bank.borrowing': () => {
    const { setup, steps, result } = example('bank.borrowing');
    const bill = sum(setup, 'when a ', ' medical bill');
    const holds = sum(setup, 'holds ', ' when');
    const terms = lendingOf(bankById('us-chase'));
    const od = terms.overdraft?.kind === 'per_item' ? terms.overdraft : undefined;
    expect(od?.debitCard).toBe('opt_in');
    const billed = (wealth: 'nothing' | 'modest') => {
      const sim = life(wealth);
      const checking = primary(sim);
      setBalance(sim, checking, holds); // TEST SETUP
      // Not opted in: a debit card purchase wouldn't be paid into the overdraft, and a bill still is.
      expect(purchaseMayOverdraw(sim, sim.player)).toBe(false);
      // TEST SETUP: the bill, paid as the health system pays one (`payFromCurrent`): a bill may run into the overdraft.
      expect(payFromCurrent(sim, sim.player, bill, 'A medical bill', 'health')).toBe(true);
      expect(checking.balance).toBe(-sum(steps[0]!, 'account is at −', '.'));
      expect(od!.graceUpTo).toBe(sum(result, 'past the ', ' Chase allows'));
      expect(checking.pendingItems).toEqual([{ day: '2026-01-05', count: 1 }]);
      return { sim, checking };
    };

    // Brought back to the grace's line by the end of the next business day: the fee is let go.
    const back = billed('modest');
    back.sim.advanceTo(at(back.sim, 2026, 1, 6));
    must(back.sim, 'bank.transfer', { fromId: own(back.sim, 'savings')!.id, toId: back.checking.id, amount: bill - holds - sum(result, 'past the ', ' Chase allows') });
    expect(back.checking.balance).toBe(-sum(steps[1]!, 'brings it back to −', ' or better'));
    back.sim.advanceTo(at(back.sim, 2026, 1, 9));
    expect(postings(back.sim, back.checking, /Overdraft fee/, 0)).toEqual([]);
    expect(back.checking.pendingItems).toBeUndefined();

    // Left there: the fee comes off once the next business day is over.
    const left = billed('modest');
    left.sim.advanceTo(at(left.sim, 2026, 1, 9));
    expect(postings(left.sim, left.checking, /Overdraft fee/, 0)).toEqual([{ at: at(left.sim, 2026, 1, 7, 0), amount: -sum(result, 'so a ', ' fee is put on hold') }]);

    // And below zero for the days the bank lets it run, the account is closed.
    const closed = billed('nothing');
    const days = count(result, 'and ', ' days below zero');
    closed.sim.advanceTo(closed.sim.now + (days - 1) * MS_DAY);
    expect(closed.checking.closedAt).toBeUndefined();
    closed.sim.advanceTo(closed.sim.now + 2 * MS_DAY);
    expect(closed.checking.closedAt).toBeDefined();
  },

  'bank.other-banks': () => {
    const { setup, steps, result } = example('bank.other-banks');
    const sim = life('modest');
    const chase = primary(sim);
    setBalance(sim, chase, sum(setup, 'with ', ` in ${chase.name}`)); // TEST SETUP
    const boaBank = bankById('us-bank-of-america')!;
    expect(openingDeposit(sim, boaBank)).toBe(sum(setup, 'asks for ', '.'));
    const sent = count(steps[0]!, 'Amount ', ',') * 100;

    // Applied: the deposit leaves Chase now, the bank decides in its days, the deposit lands in Chase's.
    const applied = sim.now;
    const before = chase.balance;
    const answer = must<{ decidedAt: number; arrivesAt: number }>(sim, 'bank.open_current', { bankId: boaBank.id, fundFrom: chase.id, amount: sent });
    expect(before - chase.balance).toBe(sum(result, 'The ', ' leaves Chase now'));
    expect(usDays(sim, applied, answer.decidedAt)).toBe(count(result, 'decides in ', ','));
    expect(usDays(sim, applied, answer.arrivesAt)).toBe(count(result, 'arrives in Chase’s ', ' business days'));
    sim.advanceTo(answer.decidedAt + HOUR);
    const boa = own(sim, 'checking', boaBank.id)!;
    expect(boa.name).toBe(boaBank.current.name);
    expect(steps[1]).toContain(boa.name);
    expect(boa.balance).toBe(0);
    // Its digital debit card works from the day it opens, and nothing arrives after it. Until a later pass of 2026-10-12
    // the text gave it Bank of America's 6 business days, and this held only that a card, if there was one, wasn't stopped.
    expect(result).toContain('its digital debit card works from the day it opens');
    expect(GUIDE_BY_ID['bank.other-banks']!.costs.find((c) => c.label === 'Decisions And Cards')?.value).toContain('its digital debit card works from the day the account opens');
    expect(boa.plastic).toBeDefined();
    const plastic = { ...boa.plastic! };
    expect([plastic.stopped, plastic.locked, plastic.replacementAt, plastic.issued]).toEqual([undefined, undefined, undefined, 1]);
    expect(sim.universe.scheduled.filter((i) => i.kind === REPLACED_KIND && i.payload.accountId === boa.id)).toEqual([]);
    sim.advanceTo(answer.arrivesAt + HOUR);
    expect(boa.balance).toBe(sent);

    // Wages to it and primary: Yale's payroll pays there from its days on. Its machine takes the card.
    must(sim, 'bank.set_primary', { accountId: boa.id });
    expect(withdrawalQuote(sim, sim.player, 20_00, 'atm').refused).toBeUndefined();
    expect(boa.plastic).toEqual(plastic);
    must(sim, 'bank.redirect_deposits', { accountId: boa.id });
    const asked = sim.now;
    const lead = count(result, 'pays into it after ', ' days') * MS_DAY;
    expect(depositAccount(sim, sim.player, asked + lead - HOUR, 'yale-payroll')?.id).toBe(chase.id);
    expect(depositAccount(sim, sim.player, asked + lead, 'yale-payroll')?.id).toBe(boa.id);

    // Chase closes once nothing pays from it or into it and no savings sits beside it.
    const card = own(sim, 'credit_card')!;
    expect(closeRefusal(sim, sim.player, chase)).toMatch(/autopay pays from it/);
    must(sim, 'card.set_autopay_from', { cardId: card.id, accountId: boa.id });
    expect(closeRefusal(sim, sim.player, chase)).toMatch(/paid into it/);
    sim.advanceTo(sim.universe.people[sim.player.id]!.payments!.depositChange!.at + HOUR);
    depositAccount(sim, sim.player);
    const savings = own(sim, 'savings')!;
    expect(closeRefusal(sim, sim.player, chase)).toBe(`${savings.name} is still open at the same bank. Close that first.`);
    must(sim, 'bank.close_savings', { accountId: savings.id });
    expect(closeRefusal(sim, sim.player, chase)).toBeUndefined();
    const held = chase.balance;
    const closing = sim.now;
    const closed = must<{ arrivesAt?: number }>(sim, 'bank.close_current', { accountId: chase.id, remainderTo: boa.id });
    expect(chase.closedAt).toBe(closing);
    expect(usDays(sim, closing, closed.arrivesAt!)).toBe(count(result, 'sent across in ', ' business days'));
    const boaBefore = boa.balance;
    sim.advanceTo(closed.arrivesAt! + HOUR);
    expect(postings(sim, boa, /^From /, closing).map((p) => p.amount)).toEqual([held]);
    expect(boa.balance).toBeGreaterThan(boaBefore);
  },
  // From 2026-10-16: made, not pressed. The life is made as the game makes one, at Yale, which no other example here is.
  'bank.home-account': () => {
    const result = GUIDE_BY_ID['bank.home-account']!.example.result;
    const config = { ...withFamily(newLifeConfig(), 'modest'), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: 'gb-barclays' };
    const sim = createSave(1, 'guide-home-account', config);
    const mine = Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId === sim.player.id);
    const saver = mine.find((a) => a.bankId === 'gb-barclays' && a.kind === 'savings')!;
    const chase = mine.find((a) => a.bankId === 'us-chase' && a.kind === 'checking')!;
    expect(result).toContain(`${saver.name} opens with ${formatMoney(saver.held!, 'GBP')}, worth ${formatMoney(saver.balance, 'USD')}`);
    expect(result).toContain(`${chase.name} with ${formatMoney(chase.balance, 'USD')}`);
    expect(result).toContain(`together ${formatMoney(saver.balance + chase.balance, 'USD', { cents: false })}`);
    expect(whatFollows(config, 'gb-barclays')[0]).toContain(`it gives ${count(result, 'with ', ' days’ notice')} days’ notice`);
  },
};

describe('the money entries’ worked examples, played', () => {
  it('has a play for every money entry, and no other', () => {
    expect(Object.keys(PLAYS).sort()).toEqual(MONEY.map((e) => e.id).sort());
  });

  for (const [id, play] of Object.entries(PLAYS)) it(`${id}: ${GUIDE_BY_ID[id]?.title ?? id}`, play, 60_000);

  it('leaves a live save byte for byte as it was, every example played beside it', () => {
    const live = quickSave({ tutorial: true }, 'guide-examples-live', 2);
    live.advanceTo(live.now + 30 * HOUR);
    const before = serialise(live.universe);
    for (const play of Object.values(PLAYS)) play();
    expect(serialise(live.universe)).toBe(before);
  }, 120_000);
});
