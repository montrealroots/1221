/**
 * The second round of 2026-10-13, for five rows the first round left partial (batch b05): three of keeping more than
 * one bank (`systems/bankmoves.ts`) and two of Papers (`systems/documents.ts`, `systems/unemployment.ts`). The first
 * round's evidence is in tests/evidence-g14-money.test.ts and tests/evidence-g15-papers.test.ts; this file closes what
 * its check found still open, and says what can't be closed and why. Each row's command is sent as its button sends it,
 * through `sim.execute`, or its handler is reached by the clock; each figure is worked here from the rule's own numbers.
 *
 * - `bank.open_current`: a bank in London is no bank where a New Haven student lives, and the books' own Wages account
 *   is no account of hers to fund from (a life holds no other person's account to try). Bank of America's two business
 *   days of review, with the student's photo ID reported lost meanwhile, turn the application down on Wednesday 26
 *   August, and the $100 comes back to Chase on Thursday 27 August, Chase's three business days; her twin, who lost
 *   nothing, is opened on the 26th. ChexSystems by its own numbers rather than one life's draw: 80 report dates within
 *   its five years turn Citi, Wells Fargo and Bank of America away in 78% to 92% of 240 draws while the $30 Chase
 *   charged off is unpaid (SLATE's 85%), and 80 dates past the five years in none; paid, the four banks turn her away in
 *   40% to 60% of 320 (SLATE's 50%), Chase among them. Citi closes a 22-year-old's account at nothing on its 90th day
 *   (its $5 fee waived at 23 and under), and a 24-year-old's, its fee falling on it empty, is overdrawn $5.00 on 31
 *   August and closed for it on 31 October, $10 charged off and Citi's report made.
 * - `bank.set_order_source`: moved to a Capital One account never funded, the $50 order on the 28th doesn't go, from
 *   there or from Chase, and says so once; funded, it goes in September from Capital One. A standing order goes only
 *   into savings, so no current account is ever the account it pays into.
 * - `bank.close_current`: Chase is refused for the groceries still pending on it from the nights it was primary, then
 *   for $100 on its way to Capital One, then for a payment set for a date into it, each reached by play; then it closes,
 *   what it holds arriving at Capital One on Wednesday 16 September, once, across a reload, its statements ending at
 *   the closing two months on. Its last statement leaves out the remainder sent at the closing: a defect, below.
 * - `documents.report_lost`: on Passport And ID, Report Stolen… pressed on the passport's row (its own onClick) opens
 *   the confirm step on that row alone; Keep It closes it with nothing reported; Report Lost… on the license's row and
 *   Cancel It report it lost, not stolen. A British student's F-1 row has neither button, on either tab. Played to 15 June
 *   2028, a New York license issued 14 June 2020 has run out: its row reads Run Out with no Report Lost…, and with the
 *   passport reported lost Citi turns her away, where a day before, the license in force, it opened her account. The
 *   command took a report of the run-out license, which the screen never offers: a defect, below, until it read
 *   `inForce` on 2026-10-13.
 * - `benefits.claim`: a summer’s stipends, a fall of Saturday shifts, and a withdrawal on Wednesday 6 October 2027 with
 *   Saturday’s six hours owed: the School pays the $138 a minute later, the claim filed then reads Connecticut’s
 *   alternate base period and pays $93 a week, and its first Sunday, the week the $138 was paid in but nothing was
 *   worked in, pays $93 whole, as the next does. The weeks certified in hospital and laid up pay nothing, the one after
 *   whole. Until 2026-10-13 the first Sunday paid $1, $93 less two-thirds of the $138, the week read by the wages paid in
 *   it rather than the work done in it (`workDoneIn`), and this test held that $1.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven, born in New
 * York unless said (London for the F-1; 2004 for the 22-year-old), from Monday 24 August 2026 at 7:30 AM; every act a
 * command its screen sends, everything after it the clock. A life's papers are its seed's: some begin with a passport
 * and a license, some with one, some with none, so each journey's seed is one whose papers it needs, asserted.
 *
 * TEST SETUP, said again where it's done: the body kept fed, rested and awake as the clock moves (`tended`); good
 * standing before joining the Summer Cabaret, which a passive spring doesn't keep; a ChexSystems report's date moved
 * across 80 dates, each standing for another life's report, since the draw is keyed to the report; a stay in hospital
 * and a concussion on the record before a week is certified, the stay brought by no command and drawn by the clock at
 * 0.04 a year, the concussion an everyday injury the clock draws at a few in a hundred a year; and on the screen, the
 * Papers tab chosen. A static render can't keep state between renders, so each `useState` is kept here in render order
 * and a press of a button's own onClick sets it, as React would. An injury that keeps her off work is brought by play as
 * well: Work Out (`life.look_after`, exercise) draws a run's, a broken bone among them, and the benefits journey after the
 * first lays her up that way. Until 2026-10-13 this said a concussion was one no command brings, which the final checks
 * of that day found false: an elective shift ushering, taken from the School, can bring one, and a workout a broken bone.
 *
 * What can't be closed, and why: Open An Account's "in a branch where you live" (`openRefusal`) compares
 * `currentLocationId` with `homeOf`, which is `currentLocationId`; `bank.set_order_source`'s "It pays into that account."
 * and `linkedTo`'s "A standing order pays into it" name a current account as a standing order's target, which
 * `bank.add_standing_order` never makes one. Each is a line nothing can reach: an engine change, reported, not a test.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { applicationsOf, inTransitOf, transfersOf } from '@/engine/systems/bankmoves';
import { checkingsOf, collectionsOf } from '@/engine/systems/lending';
import { paymentsOf } from '@/engine/systems/payments';
import { cardsOf } from '@/engine/systems/credit';
import { accountStatement, periodsOf } from '@/engine/systems/statements';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { healthOf } from '@/engine/systems/health';
import { yearOf } from '@/engine/systems/earnings';
import { unemploymentOf } from '@/engine/systems/unemployment';
import { workDoneIn } from '@/engine/systems/school';
import { tabKey } from '@/ui/shell/sections';

type Pressable = { text: string; disabled: boolean; title?: string; onClick?: () => void };

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  toasts: [] as string[],
  buttons: [] as { text: string; disabled: boolean; title?: string; onClick?: () => void }[],
  /** Each `useState` in render order, and what a press set it to: the state a static render can't keep. */
  slot: 0,
  held: new Map<number, unknown>(),
}));

// State kept across renders by its place in render order, set by the press of a button's own onClick.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value] = real.useState(initial);
    const i = h.slot++;
    const v = h.held.has(i) ? h.held.get(i) : value;
    const set = (next: unknown) => { h.held.set(i, typeof next === 'function' ? (next as (x: unknown) => unknown)(v) : next); };
    return [v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button the screen draws, with its words, whether it's shut, its title, and its own onClick. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children).trim(), disabled: Boolean(props.disabled), title: props.title as string | undefined, onClick: props.onClick as (() => void) | undefined });
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
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// The screen's kept tab: the store it's kept in has no server snapshot to draw from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York unless said: a new life as a player starts one. */
const student = (seed: string, extra: Record<string, unknown> = {}) =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
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
  .map((t) => ({ memo: t.memo, at: t.at, amount: t.postings.filter((p) => p.accountId === id).reduce((s, p) => s + p.amount, 0) }));
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** Nothing opened, applied for or sent: the current accounts, the applications, the money on its way. */
const untouched = (sim: Simulation) => ({
  currents: checkingsOf(sim, sim.player).map((a) => a.id),
  applications: applicationsOf(sim, sim.player).length,
  transfers: transfersOf(sim, sim.player).length,
  inTransit: inTransitOf(sim, sim.player).balance,
  balances: checkingsOf(sim, sim.player).map((a) => a.balance),
});
const kinds = (sim: Simulation) => documentsOf(sim.player).map((d) => d.kind);
const held = (sim: Simulation, kind: PersonDocument['kind']) => documentsOf(sim.player).filter((d) => d.kind === kind);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player keeps it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

const CITI_REFUSES = 'Citi asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.';

// ---------------------------------------------------------------------------
// The screen
// ---------------------------------------------------------------------------

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Papers as the player has it on a tab: its markup, its words, and every button drawn on it. */
function papers(sim: Simulation, tab: 'passport' | 'work' | 'benefits'): { html: string; text: string; buttons: Pressable[] } {
  h.sim = sim;
  h.tabs = { [tabKey('/workspace/papers')]: tab };
  h.buttons = [];
  h.slot = 0;
  const html = renderToStaticMarkup(createElement(PapersWorkspace)).replace(/<!-- -->/g, '');
  return { html, text: onScreen(html), buttons: [...h.buttons] };
}
/** A document's row on the screen, as the player reads it: the one table row that carries its number. */
function rowOf(shown: { html: string }, doc: PersonDocument): string {
  const rows = shown.html.split('</tr>').map((chunk) => chunk.slice(chunk.lastIndexOf('<tr'))).filter((row) => row.includes(doc.number));
  expect(rows, doc.name).toHaveLength(1);
  return onScreen(rows[0]!);
}
/** The buttons with these words, in the order the screen draws them. */
const named = (shown: { buttons: Pressable[] }, text: string) => shown.buttons.filter((b) => b.text === text);
/** Pressed as the player presses it: the button's own handler; what it toasts. */
function press(b: Pressable | undefined): string[] {
  expect(b, 'the button').toBeDefined();
  expect(b!.disabled, `${b!.text} is shut: ${b!.title}`).toBe(false);
  h.toasts = [];
  b!.onClick!();
  return [...h.toasts];
}

// ---------------------------------------------------------------------------
// bank.open_current
// ---------------------------------------------------------------------------

/**
 * PLAYER JOURNEY: she moves to Capital One and leaves Chase at nothing; Chase Total Checking's $15 a month falls on it
 * empty on 31 August and 30 September, and 60 days below zero the bank closes it on 31 October, charging off $30 and
 * reporting her to ChexSystems. Then every photo ID of hers reported lost, so a bank that doesn't turn her away on the
 * report refuses her for the photo ID instead, and nothing is ever opened.
 */
function reportedAndUnidentified(seed: string) {
  const sim = student(seed);
  expect(kinds(sim)).toEqual(['passport', 'license']);
  const chase = primaryId(sim);
  const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
  run(sim, 'bank.set_primary', { accountId: cap });
  for (const c of cardsOf(sim, sim.player)) run(sim, 'card.set_autopay_from', { cardId: c.id, accountId: cap });
  run(sim, 'bank.redirect_deposits', { accountId: cap });
  run(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase').id });
  run(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: acct(sim, chase).balance });
  sim.advanceTo(at(2026, 11, 2));
  expect(acct(sim, chase).closedAt).toBe(at(2026, 10, 31, 0));
  expect(collectionsOf(sim, sim.player, 'Chase')!.balance).toBe(-30_00);
  expect(sim.player.chex).toEqual({ at: at(2026, 10, 31, 0), bank: 'Chase' });
  for (const d of documentsOf(sim.player).filter((x) => x.status === 'valid')) run(sim, 'documents.report_lost', { documentId: d.id });
  return { sim, cap };
}

/**
 * Applications at each bank across report dates (TEST SETUP: the report's date, each standing for another life's report),
 * tallied by the refusal given: the ChexSystems report's sentence, or the photo ID's. Anything else fails it.
 */
function tally(sim: Simulation, banks: readonly string[], dates: readonly number[]) {
  const report = sim.player.chex!;
  const errors: { date: number; error: string }[] = [];
  for (const date of dates) {
    sim.player.chex = { at: date, bank: 'Chase' };
    for (const bankId of banks) errors.push({ date, error: refused(sim, 'bank.open_current', { bankId }) });
  }
  sim.player.chex = report;
  // A report stands five years of 365 days from its date, and each refusal on it names that day.
  const chex = errors.filter(({ date, error }) => error.endsWith(` turned you away on the ChexSystems report Chase made, which stands until ${DAY.format(date + FIVE_YEARS)}.`));
  const photoId = errors.filter(({ error }) => / asks a new customer for a photo ID in force: a passport, a license or an ID card\. Papers has each\.$/.test(error));
  // Every refusal is one of the two: nothing else stood in the way, and nothing was opened.
  expect(chex.length + photoId.length).toBe(errors.length);
  return { draws: errors.length, chex: chex.length, photoId: photoId.length };
}
const DAY = new Intl.DateTimeFormat('en-US', { timeZone: NY, month: 'long', day: 'numeric', year: 'numeric' });
const weeksBack = (from: number, n: number) => Array.from({ length: n }, (_, k) => from - k * 7 * MS_DAY);
const FIVE_YEARS = 5 * 365 * MS_DAY;

describe('bank.open_current', () => {
  it('refuses a bank in London as no bank where she lives, and a deposit from the books’ own Wages account as no account of hers; a life holds no other person’s account to try', () => {
    const sim = student('b05-where');
    const before = untouched(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'gb-barclays' })).toBe('That isn’t a bank where you live.');
    const wages = sim.nominalAccount('income', 'Wages').id;
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: wages, amount: 10_00 })).toBe('Fund it from one of your own current or savings accounts.');
    expect(untouched(sim)).toEqual(before);
    // Every account a life holds that isn't the books' own is hers: there's no one else's to send from.
    expect(Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId !== sim.player.id)).toEqual([]);
  });

  it('PLAYER JOURNEY: Bank of America’s two business days of review turn the application down on Wednesday 26 August, her photo ID reported lost meanwhile, and the $100 comes back to Chase on Thursday 27 August; her twin, who lost nothing, is opened', () => {
    let sim = student('b05-turned');
    expect(kinds(sim)).toEqual(['license']);
    const chase = primaryId(sim);
    const applied = sim.now;
    const answer = run<{ decidedAt: number; arrivesAt: number }>(sim, 'bank.open_current', { bankId: 'us-bank-of-america', fundFrom: chase, amount: 100_00 });
    // Two business days from Monday 24 August, and Chase's three for the deposit.
    expect(answer).toEqual({ decidedAt: at(2026, 8, 26, 7, 30), arrivesAt: at(2026, 8, 27, 7, 30) });
    expect(inTransitOf(sim, sim.player).balance).toBe(100_00);
    sim.advanceTo(at(2026, 8, 25, 9));
    const twin = reload(sim);
    run(sim, 'documents.report_lost', { documentId: held(sim, 'license')[0]!.id });
    sim = reload(sim);
    sim.advanceTo(at(2026, 8, 26, 7, 31));
    expect(checkingsOf(sim, sim.player).map((a) => a.bankId)).toEqual(['us-chase']);
    expect(titled(sim, 'Bank of America Turned Down Your Application').map((n) => [n.at, n.body])).toEqual([[at(2026, 8, 26, 7, 30), 'Bank of America asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each. Any opening deposit you sent comes back to the account it left.']]);
    expect(inTransitOf(sim, sim.player).balance).toBe(100_00);
    sim.advanceTo(at(2026, 8, 27, 7, 31));
    expect(postingsTo(sim, chase, applied).filter((p) => p.memo.startsWith('Returned'))).toEqual([{ memo: 'Returned: the account it was sent to isn’t open', at: at(2026, 8, 27, 7, 30), amount: 100_00 }]);
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
    expect(titled(sim, 'A Transfer Came Back').map((n) => n.body)).toEqual(['$100.00 came back to Chase Total Checking: the account it was sent to isn’t open.']);
    // The twin kept her license: opened on the 26th, the $100 landing in it on the 27th.
    twin.advanceTo(at(2026, 8, 27, 7, 31));
    const bofa = checkingsOf(twin, twin.player).find((a) => a.bankId === 'us-bank-of-america')!;
    expect([bofa.openedAt, bofa.balance]).toEqual([at(2026, 8, 26, 7, 30), 100_00]);
    expect(titled(twin, 'Bank of America Turned Down Your Application')).toEqual([]);
  });

  it('turns her away on the unpaid report at Citi, Wells Fargo and Bank of America in 78% to 92% of 240 draws across 80 report dates within its five years (SLATE’s 85%), and on none of 80 dates past them, opening nothing', () => {
    const { sim } = reportedAndUnidentified('b05-chex-paid');
    const before = untouched(sim);
    const report = sim.player.chex!.at;
    // Chase, owed the $30, refuses before any draw; the others draw.
    expect(refused(sim, 'bank.open_current', { bankId: 'us-chase' })).toBe('Chase won’t open an account for somebody who owes it a charged-off debt.');
    const banks = ['us-citi', 'us-wells-fargo', 'us-bank-of-america'] as const;
    const within = tally(sim, banks, weeksBack(report, 80));
    expect(within.draws).toBe(240);
    // 85% of 240 is 204, with a standard deviation of √(240 × 0.85 × 0.15) ≈ 5.5: three of them either side.
    expect(within.chex).toBeGreaterThanOrEqual(188);
    expect(within.chex).toBeLessThanOrEqual(220);
    // Five years of 365 days old or more, the report reads nothing: each bank's refusal is the photo ID's.
    const past = tally(sim, banks, weeksBack(sim.now - FIVE_YEARS, 80));
    expect([past.draws, past.chex, past.photoId]).toEqual([240, 0, 240]);
    // The report itself, put back: five years of 365 days from Saturday 31 October 2026, 29 February 2028 among them,
    // end on Thursday 30 October 2031, the day each refusal on it names.
    expect([sim.player.chex!.at, DAY.format(report + FIVE_YEARS)]).toEqual([report, 'October 30, 2031']);
    expect(untouched(sim)).toEqual(before);
  });

  it('paid, the report turns her away in 40% to 60% of 320 draws at the four banks (SLATE’s 50%), Chase among them now the $30 is paid, opening nothing', () => {
    const { sim, cap } = reportedAndUnidentified('b05-chex-paid');
    const settled = run<{ paid: number; left: number }>(sim, 'bank.pay_collections', { amount: 30_00 });
    // `left` is the debt's balance turned about, which at nothing is −0: added to 0, it reads as the 0 it is.
    expect([settled.paid, settled.left + 0]).toEqual([30_00, 0]);
    expect(collectionsOf(sim, sim.player, 'Chase')).toBeUndefined();
    expect(postingsTo(sim, cap).filter((p) => p.memo === 'Paid to collections: Chase').map((p) => p.amount)).toEqual([-30_00]);
    const before = untouched(sim);
    const paid = tally(sim, ['us-chase', 'us-citi', 'us-wells-fargo', 'us-bank-of-america'], weeksBack(sim.player.chex!.at, 80));
    expect(paid.draws).toBe(320);
    // 50% of 320 is 160, with a standard deviation of √(320 × 0.5 × 0.5) ≈ 8.9: 3.6 of them either side.
    expect(paid.chex).toBeGreaterThanOrEqual(128);
    expect(paid.chex).toBeLessThanOrEqual(192);
    expect(untouched(sim)).toEqual(before);
  });

  it('closes a 22-year-old’s Citi account, never funded and its $5 fee waived at 23 and under, on its 90th day at nothing; a 24-year-old’s goes $5.00 below on 31 August and is closed for it on 31 October, $10 charged off and Citi’s report made', () => {
    // Born 1 March 2004: 22.
    const young = student('b05-young', { birthYear: 2004, birthMonth: 3, birthDay: 1 });
    expect(kinds(young)).toEqual(['license']);
    const citi = run<{ accountId: string }>(young, 'bank.open_current', { bankId: 'us-citi' }).accountId;
    // At nothing from the night of 24 August; Citi's 90 days end at the midnight of 23 November.
    young.advanceTo(at(2026, 11, 22, 23));
    expect([acct(young, citi).balance, acct(young, citi).closedAt]).toEqual([0, undefined]);
    expect(postingsTo(young, citi)).toEqual([]);
    young.advanceTo(at(2026, 11, 23, 9));
    expect(acct(young, citi).closedAt).toBe(at(2026, 11, 23, 0));
    expect(titled(young, 'Citi Closed Citi Access Checking').map((n) => n.body)).toEqual(['It held nothing for 90 days, and the bank closes an account at zero that long.']);

    // Born in 2002: 24, past the waiver, with no direct deposit into it.
    const adult = student('b05-adult');
    expect(kinds(adult)).toEqual(['passport', 'license']);
    const hers = run<{ accountId: string }>(adult, 'bank.open_current', { bankId: 'us-citi' }).accountId;
    adult.advanceTo(at(2026, 11, 24, 9));
    expect(postingsTo(adult, hers)).toEqual([
      { memo: 'Monthly fee: Citi Access Checking', at: at(2026, 8, 31, 23), amount: -5_00 },
      { memo: 'Monthly fee: Citi Access Checking', at: at(2026, 9, 30, 23), amount: -5_00 },
      { memo: 'Charged off by Citi', at: at(2026, 10, 31, 0), amount: 10_00 },
    ]);
    expect(acct(adult, hers).closedAt).toBe(at(2026, 10, 31, 0));
    expect(collectionsOf(adult, adult.player, 'Citi')!.balance).toBe(-10_00);
    expect(adult.player.chex).toEqual({ at: at(2026, 10, 31, 0), bank: 'Citi' });
    expect(titled(adult, 'Citi Closed Your Account').map((n) => n.body)).toEqual(['It was overdrawn for 60 days. $10.00 it couldn’t recover went to collections and onto your record; pay it from Your Bank. Your money is at Chase now.']);
    expect(titled(adult, 'Citi Closed Citi Access Checking')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// bank.set_order_source
// ---------------------------------------------------------------------------

describe('bank.set_order_source', () => {
  it('PLAYER JOURNEY: moved to Capital One before a penny is in it, the $50 order doesn’t go on Friday 28 August, from there or from Chase, and says so once; funded, it goes on 28 September from Capital One and lands on 1 October', () => {
    let sim = student('b05-order-ui');
    expect(kinds(sim)).toEqual(['passport', 'license']);
    const chase = primaryId(sim);
    const savings = savingsAt(sim, 'us-chase').id;
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    const orderId = run<{ id: string }>(sim, 'bank.add_standing_order', { toId: savings, amount: 50_00, day: 28 }).id;
    expect(run<{ fromId: string }>(sim, 'bank.set_order_source', { orderId, accountId: cap })).toEqual({ fromId: cap });
    sim = reload(sim);
    sim.advanceTo(at(2026, 8, 28, 8, 59));
    const was = { chase: acct(sim, chase).balance, savings: acct(sim, savings).balance, cap: acct(sim, cap).balance, transit: inTransitOf(sim, sim.player).balance };
    expect(was.cap).toBe(0);
    sim.advanceTo(at(2026, 8, 28, 9, 1));
    expect({ chase: acct(sim, chase).balance, savings: acct(sim, savings).balance, cap: acct(sim, cap).balance, transit: inTransitOf(sim, sim.player).balance }).toEqual(was);
    expect(titled(sim, 'A Standing Order Didn’t Go').map((n) => [n.at, n.body])).toEqual([[at(2026, 8, 28, 9), '$50.00 to Chase Savings: It wasn’t in 360 Checking on the day, so the bank didn’t make it.']]);

    // $100 from Chase, in Chase's three business days: Wednesday 2 September.
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: 100_00 });
    expect(sent.arrivesAt).toBe(at(2026, 9, 2, 9, 1));
    sim = reload(sim);
    sim.advanceTo(at(2026, 9, 28, 9, 1));
    expect(postingsTo(sim, cap).map((p) => [p.memo, p.at, p.amount])).toEqual([['From Chase Total Checking', at(2026, 9, 2, 9, 1), 100_00], ['To Chase: Chase Savings', at(2026, 9, 28, 9), -50_00]]);
    expect(postingsTo(sim, chase, at(2026, 8, 28, 9, 2)).filter((p) => /Savings/.test(p.memo))).toEqual([]);
    // Capital One's three business days from Monday 28 September: Thursday 1 October.
    sim.advanceTo(at(2026, 10, 1, 8, 59));
    const waiting = acct(sim, savings).balance;
    sim.advanceTo(at(2026, 10, 1, 9, 1));
    expect(acct(sim, savings).balance - waiting).toBe(50_00);
    expect(titled(sim, 'A Standing Order Didn’t Go')).toHaveLength(1);
  });

  it('can’t make a current account a standing order’s target, so none is ever the account it pays into: the order takes every open current account of hers to pay from', () => {
    const sim = student('b05-order-ui');
    const chase = primaryId(sim);
    const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    for (const current of [chase, cap]) {
      expect(refused(sim, 'bank.add_standing_order', { toId: current, amount: 50_00, day: 28 })).toBe('A standing order of your own goes into one of your savings accounts.');
    }
    const orderId = run<{ id: string }>(sim, 'bank.add_standing_order', { toId: savingsAt(sim, 'us-chase').id, amount: 50_00, day: 28 }).id;
    expect(paymentsOf(sim.player).standingOrders.map((o) => acct(sim, o.toId).kind)).toEqual(['savings']);
    for (const current of [cap, chase, cap]) expect(run<{ fromId: string }>(sim, 'bank.set_order_source', { orderId, accountId: current }).fromId).toBe(current);
  });
});

// ---------------------------------------------------------------------------
// bank.close_current
// ---------------------------------------------------------------------------

/**
 * PLAYER JOURNEY: Capital One opened on the first morning, her wages, her card's autopay and the money moved to it, Chase's
 * savings closed into Chase, and $6,000 left there. Chase stays primary until Tuesday 8 September, so the nights'
 * groceries are on its debit card; that morning Capital One becomes primary and Chase is asked to close.
 */
function closingChase(seed: string) {
  const sim = student(seed);
  expect(kinds(sim)).toEqual(['passport', 'license']);
  const chase = primaryId(sim);
  const cap = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
  for (const c of cardsOf(sim, sim.player)) run(sim, 'card.set_autopay_from', { cardId: c.id, accountId: cap });
  run(sim, 'bank.redirect_deposits', { accountId: cap });
  run(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase').id });
  run(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: acct(sim, chase).balance - 6_000_00 });
  sim.advanceTo(at(2026, 9, 8, 8));
  run(sim, 'bank.set_primary', { accountId: cap });
  return { sim, chase, cap };
}

describe('bank.close_current', () => {
  it('PLAYER JOURNEY: refuses Chase for the groceries pending on it, then for $100 on its way, then for a payment set for a date into it; then it closes, what it holds arriving at Capital One on Wednesday 16 September, once, across a reload, and its statements end at the closing', () => {
    const journey = closingChase('b05-close-3');
    const { chase, cap } = journey;
    let { sim } = journey;
    // The groceries of Tuesday's midnight, on Chase's card, post two business days on, Thursday 10 September.
    expect(sim.universe.transactions.filter((t) => t.memo === 'Groceries' && t.postsAt !== undefined && t.postsAt > sim.now && t.postings.some((p) => p.accountId === chase)).map((t) => t.at)).toContain(at(2026, 9, 8, 0));
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('Card payments are still pending on it. Chase closes it once they’ve posted.');
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase, toId: cap, amount: 100_00 });
    // Chase's three business days from Tuesday 8 September: Friday 11 September.
    expect(sent.arrivesAt).toBe(at(2026, 9, 11, 8));
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('Money is on its way into or out of it. Wait until it arrives.');
    const into = run<{ id: string }>(sim, 'bank.schedule_payment', { fromId: cap, toId: chase, amount: 10_00, at: at(2026, 10, 1) }).id;
    sim = reload(sim);
    sim.advanceTo(at(2026, 9, 11, 8, 1));
    expect([transfersOf(sim, sim.player), sim.universe.transactions.filter((t) => t.postsAt !== undefined && t.postsAt > sim.now && t.postings.some((p) => p.accountId === chase))]).toEqual([[], []]);
    expect(refused(sim, 'bank.close_current', { accountId: chase, remainderTo: cap })).toBe('A payment set for a date uses it. Move it first.');
    run(sim, 'bank.cancel_scheduled', { id: into });
    const august = periodsOf(sim, acct(sim, chase)).find((p) => p.label === 'August 2026')!;
    const augustBefore = accountStatement(sim, acct(sim, chase), august);
    const holding = acct(sim, chase).balance;
    expect(holding).toBeGreaterThan(0);
    const closed = run<{ closedAt: number; arrivesAt: number }>(sim, 'bank.close_current', { accountId: chase, remainderTo: cap });
    // Chase's three business days from Friday 11 September: Wednesday 16 September.
    expect(closed).toEqual({ closedAt: at(2026, 9, 11, 8, 1), arrivesAt: at(2026, 9, 16, 8, 1) });
    expect([acct(sim, chase).balance, inTransitOf(sim, sim.player).balance]).toEqual([0, holding]);
    sim = reload(sim);
    sim.advanceTo(at(2026, 9, 16, 8));
    const capBefore = acct(sim, cap).balance;
    sim.advanceTo(at(2026, 9, 16, 8, 2));
    expect(acct(sim, cap).balance - capBefore).toBe(holding);
    sim = reload(sim);
    sim.advanceTo(at(2026, 11, 20));
    expect(postingsTo(sim, cap, at(2026, 9, 11, 8, 1)).filter((p) => p.memo === 'From Chase Total Checking').map((p) => [p.at, p.amount])).toEqual([[at(2026, 9, 16, 8, 1), holding]]);
    // Two months on: no October or November for it, only September to its closing and August, as August was.
    const periods = periodsOf(sim, acct(sim, chase));
    expect(periods.map((p) => [p.label, p.to])).toEqual([['September 2026, To Its Closing', closed.closedAt], ['August 2026', at(2026, 9, 1, 0)]]);
    expect(accountStatement(sim, acct(sim, chase), periods[1]!)).toEqual(augustBefore);
    expect(checkingsOf(sim, sim.player).map((a) => a.id)).toEqual([cap]);
  });

  it('ends Chase’s last statement at $0.00 with what it held sent to Capital One at the closing', () => {
    const { sim, chase, cap } = closingChase('b05-close-3');
    sim.advanceTo(at(2026, 9, 11, 8, 1));
    const holding = acct(sim, chase).balance;
    expect(holding).toBeGreaterThan(0);
    const closed = run<{ closedAt: number }>(sim, 'bank.close_current', { accountId: chase, remainderTo: cap });
    sim.advanceTo(at(2026, 10, 2));
    const last = accountStatement(sim, acct(sim, chase), periodsOf(sim, acct(sim, chase))[0]!);
    expect(last.period.label).toBe('September 2026, To Its Closing');
    // What the account held went out at its closing, and its last statement says so: it closes at nothing.
    expect(last.lines.at(-1)).toMatchObject({ at: closed.closedAt, memo: 'To Capital One: 360 Checking', amount: -holding, balance: 0 });
    expect(last.closing).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// documents.report_lost
// ---------------------------------------------------------------------------

/** PLAYER JOURNEY, once for the two tests that read it: a New Yorker played to noon on Tuesday 13 June 2028. */
let june2028: string | undefined;
function toJune2028(): Simulation {
  if (!june2028) {
    const sim = student('b05-runout');
    expect(kinds(sim)).toEqual(['passport', 'license']);
    expect(held(sim, 'license')[0]).toMatchObject({ issuer: 'us-ny', status: 'valid', issuedAt: Date.UTC(2020, 5, 14, 7), expiresAt: Date.UTC(2028, 5, 14, 7) });
    tended(sim, at(2028, 6, 13, 12));
    june2028 = serialise(sim.universe);
  }
  return loadSave(deserialise(june2028) as never);
}

describe('documents.report_lost', () => {
  it('PLAYER JOURNEY: Report Stolen… pressed on the passport’s row opens the confirm step on that row alone; Keep It closes it, nothing reported; Report Lost… on the license’s row, then Cancel It, reports it lost, not stolen', () => {
    const sim = student('b05-adult');
    const passport = held(sim, 'passport')[0]!;
    const license = held(sim, 'license')[0]!;
    h.held.clear();
    const first = papers(sim, 'passport');
    expect(rowOf(first, passport)).toMatch(/In Force Report Lost… Report Stolen…$/);
    expect(rowOf(first, license)).toMatch(/In Force Report Lost… Report Stolen…$/);
    // The passport's row is drawn first, in Your Passport; the license's in Your ID.
    expect(named(first, 'Report Stolen…')).toHaveLength(2);
    expect(press(named(first, 'Report Stolen…')[0])).toEqual([]);
    const asked = papers(sim, 'passport');
    expect(rowOf(asked, passport)).toMatch(/In Force Reported stolen, it’s canceled for good, even if it turns up, with any visa or authorization issued on it \(the F-1 status holds\)\. Cancel It Keep It$/);
    expect(rowOf(asked, license)).toMatch(/In Force Report Lost… Report Stolen…$/);
    expect(press(named(asked, 'Keep It')[0])).toEqual([]);
    const kept = papers(sim, 'passport');
    expect(rowOf(kept, passport)).toMatch(/In Force Report Lost… Report Stolen…$/);
    expect([passport.status, license.status]).toEqual(['valid', 'valid']);

    // The second Report Lost… is the license's.
    expect(press(named(kept, 'Report Lost…')[1])).toEqual([]);
    const confirm = papers(sim, 'passport');
    expect(rowOf(confirm, license)).toMatch(/In Force Reported lost, it’s canceled for good, even if it turns up\. Cancel It Keep It$/);
    expect(rowOf(confirm, passport)).toMatch(/In Force Report Lost… Report Stolen…$/);
    expect(press(named(confirm, 'Cancel It')[0])).toEqual(['Driving License reported lost and canceled.']);
    expect(license.status).toBe('lost');
    expect(license.stolen).toBeUndefined();
    expect(passport.status).toBe('valid');
    const after = papers(sim, 'passport');
    expect(rowOf(after, license)).toMatch(/Reported Lost File A Police Report Replace It, \$17\.50$/);
    expect(rowOf(after, license)).not.toContain('Report Lost…');
    expect(rowOf(after, passport)).toMatch(/In Force Report Lost… Report Stolen…$/);
    h.held.clear();
  });

  it('draws Report Lost… and Report Stolen… on a British student’s passport row, and on her F-1’s row neither, on Passport And ID or on Permission To Work', () => {
    const sim = student('b05-lost-uk', { homeRegionId: 'uk-eng-london' });
    expect(kinds(sim)).toEqual(['passport', 'visa']);
    const passport = held(sim, 'passport')[0]!;
    const f1 = held(sim, 'visa')[0]!;
    expect(f1).toMatchObject({ name: 'F-1 Student Visa', status: 'valid' });
    h.held.clear();
    const passportTab = papers(sim, 'passport');
    expect(rowOf(passportTab, passport)).toMatch(/In Force Report Lost… Report Stolen…$/);
    expect(rowOf(passportTab, f1)).toMatch(/F-1 Student Visa.* In Force$/);
    const work = papers(sim, 'work');
    expect(rowOf(work, f1)).toMatch(/F-1 Student Visa.* In Force$/);
    expect([named(work, 'Report Lost…'), named(work, 'Report Stolen…')]).toEqual([[], []]);
  });

  it('PLAYER JOURNEY: the New York license issued 14 June 2020 has run out by 15 June 2028: its row reads Run Out with no Report Lost…, and with the passport reported lost Citi turns her away, where a day before the run-out it opened her twin’s account', () => {
    const sim = toJune2028();
    const license = held(sim, 'license')[0]!;
    run(sim, 'documents.report_lost', { documentId: held(sim, 'passport')[0]!.id });
    // The day before: the license in force, Citi takes it.
    const twin = reload(sim);
    const opened = twin.execute<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
    expect(opened.ok, opened.error).toBe(true);
    tended(sim, at(2028, 6, 15, 12));
    expect(license).toMatchObject({ status: 'valid', expiresAt: Date.UTC(2028, 5, 14, 7) });
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi' })).toBe(CITI_REFUSES);
    h.held.clear();
    const shown = papers(sim, 'passport');
    // From 2026-10-16 the row says what replaces it after Run Out (brief 09's journeys, tests/remaining-09-journeys.test.ts):
    // until then nothing came after it, and this read the row's end there.
    expect(rowOf(shown, license)).toMatch(/June 14, 2028 Run Out Nothing in SLATE renews a license since the cars went: a passport or an ID card in force is your photo ID, under Your Passport and Your ID\.$/);
    expect([named(shown, 'Report Lost…'), named(shown, 'Report Stolen…')]).toEqual([[], []]);
  }, 60_000);

  it('refuses a report of the license run out, which the screen never offers, and leaves it as it was', () => {
    const sim = toJune2028();
    tended(sim, at(2028, 6, 15, 12));
    const license = held(sim, 'license')[0]!;
    expect(license.expiresAt!).toBeLessThan(sim.now);
    const answer = sim.execute({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    expect(answer.ok, 'a run-out license was reported lost').toBe(false);
    expect(license.status).toBe('valid');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// benefits.claim
// ---------------------------------------------------------------------------

const benefitPaid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('Unemployment insurance')).map((t) => [t.at, t.postings.find((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id)!.amount]);
/** Each Sunday's certification, at 8 PM in New Haven. */
const sunday = (month: number, day: number) => at(2027, month, day, 20);

describe('benefits.claim', () => {
  it('PLAYER JOURNEY: withdrawn on Wednesday 6 October 2027 with Saturday’s six hours owed, the $138 is paid a minute on; the claim filed then pays $93 its first Sunday, nothing worked in that week, then $93; in hospital and laid up nothing, then $93', () => {
    const sim = student('g15-claim');
    tended(sim, at(2027, 3, 20, 12));
    // TEST SETUP: good standing before joining, which the company asks and a passive spring doesn't keep.
    sim.player.school!.standing = 'good';
    run(sim, 'school.summer_cabaret', {});
    tended(sim, at(2027, 10, 6, 9));
    // The fall's Saturday shifts, six hours each, paid the Friday after at $23 an hour; Saturday 2 October's still owed.
    const fall = sim.universe.transactions.filter((t) => t.memo.startsWith('Work-study wages') && t.at > at(2027, 9, 1));
    expect(fall.map((t) => [t.at, t.postings[0]!.amount])).toEqual([10, 17, 24].map((d) => [at(2027, 9, d, 17), 138_00]).concat([[at(2027, 10, 1, 17), 138_00]]));
    expect(sim.player.school!.workStudy.owedHours).toBe(6);
    run(sim, 'school.withdraw', { confirm: true });
    sim.advanceTo(at(2027, 10, 6, 9, 5));
    expect(sim.universe.transactions.filter((t) => t.memo === 'Work-study wages, 6 hours: David Geffen School of Drama at Yale University' && t.at > at(2027, 10, 2)).map((t) => [t.at, t.category, t.postings[0]!.amount])).toEqual([[at(2027, 10, 6, 9, 1), 'salary', 138_00]]);
    // Filed in October, its basic base period, July 2026 to June 2027, holds June's $1,500 alone, under 40 times
    // Connecticut's $45 floor; the alternate, October 2026 to September 2027, holds $1,500 and $3,375: (1,500 + 3,375) / 2
    // / 26 = $93.75, $93 to the dollar (CGS 31-231a), 40 times it $3,720, and 26 weeks $2,418.
    expect(run(sim, 'benefits.claim', {})).toEqual({ weekly: 93_00, maxTotal: 2_418_00 });
    expect(unemploymentOf(sim.player).claim).toMatchObject({ state: 'ct', basePeriod: ['2026-4', '2027-1', '2027-2', '2027-3'], waited: true });
    tended(sim, sunday(10, 10) + MS_HOUR);
    // The week to Sunday 10 October holds the $138’s payment and none of its work, done on Saturday 2 October, the week
    // before: a claim week reports the earnings of the work done in it, paid then or later (Connecticut’s weekly claim),
    // so it pays $93 whole. Until 2026-10-13 it took the $138 as the week’s: $93 less two-thirds of it, $92 (CGS 31-229),
    // was $1, and this test held that.
    expect(benefitPaid(sim)).toEqual([[sunday(10, 10), 93_00]]);
    tended(sim, sunday(10, 17) + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[sunday(10, 10), 93_00], [sunday(10, 17), 93_00]]);
    // TEST SETUP: a stay in hospital over the third Sunday, which the clock draws at 0.04 a year (CARE.perYear.stay).
    healthOf(sim.player).inHospitalUntil = sunday(10, 24) + MS_HOUR;
    tended(sim, sunday(10, 24) + 2 * MS_HOUR);
    // TEST SETUP: a concussion keeping her off work over the fourth, an everyday injury the clock draws at a few a hundred.
    healthOf(sim.player).injury = { kind: 'concussion', at: sunday(10, 24) + 2 * MS_HOUR, until: sunday(10, 31) + 5 * MS_DAY, offWorkUntil: sunday(10, 31) + MS_HOUR };
    tended(sim, sunday(11, 7) + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[sunday(10, 10), 93_00], [sunday(10, 17), 93_00], [sunday(11, 7), 93_00]]);
    expect(unemploymentOf(sim.player).claim).toMatchObject({ paid: 279_00, weekly: 93_00 });
    expect(yearOf(sim.player, 2027).unemployment).toBe(279_00);
    expect(titled(sim, 'Your Waiting Week')).toEqual([]);
  }, 60_000);

  it('PLAYER JOURNEY: claiming from Wednesday 6 October 2027, Work Out at 6:26 PM on Monday 18 October breaks a bone on the run, and the Sunday after pays nothing, laid up, where a twin who stayed in is paid $93', () => {
    const sim = student('g15-claim');
    tended(sim, at(2027, 3, 20, 12));
    // TEST SETUP: good standing before joining, as in the journey above.
    sim.player.school!.standing = 'good';
    run(sim, 'school.summer_cabaret', {});
    tended(sim, at(2027, 10, 6, 9));
    run(sim, 'school.withdraw', { confirm: true });
    sim.advanceTo(at(2027, 10, 6, 9, 5));
    expect(run(sim, 'benefits.claim', {})).toEqual({ weekly: 93_00, maxTotal: 2_418_00 });
    tended(sim, at(2027, 10, 18, 18, 26));
    const twin = reload(sim);
    // An hour's run in fine weather, its injury drawn at 7.7 in a thousand hours (`INJURY.perThousandHours.run`), a broken
    // bone a tenth of those: at the hour's end, 7:26 PM, this life's draw is one (found by searching the week's minutes).
    run(sim, 'life.look_after', { action: 'exercise' });
    expect(sim.now).toBe(at(2027, 10, 18, 19, 26));
    const injury = healthOf(sim.player).injury!;
    expect(injury).toMatchObject({ kind: 'fracture', at: at(2027, 10, 18, 19, 26) });
    expect(injury.offWorkUntil!).toBeGreaterThan(sunday(10, 24));
    expect(titled(sim, 'A Broken Bone')).toHaveLength(1);
    tended(sim, sunday(10, 24) + MS_HOUR);
    tended(twin, sunday(10, 24) + MS_HOUR);
    // Before it, the same two Sundays; the third, certified laid up, nothing (CGS 31-235: able and available for work).
    expect(benefitPaid(sim)).toEqual([[sunday(10, 10), 93_00], [sunday(10, 17), 93_00]]);
    expect(benefitPaid(twin)).toEqual([[sunday(10, 10), 93_00], [sunday(10, 17), 93_00], [sunday(10, 24), 93_00]]);
    expect(healthOf(twin.player).injury).toBeUndefined();
  }, 60_000);

  it('PLAYER JOURNEY: a Connecticut week is judged on most of its days (Regs. Conn. State Agencies §31-235-12): in hospital from Saturday morning over the Sunday it’s certified is paid $93, and laid up from Monday morning to Sunday noon is paid nothing', () => {
    const sim = student('g15-claim');
    tended(sim, at(2027, 3, 20, 12));
    // TEST SETUP: good standing before joining, as in the journey above.
    sim.player.school!.standing = 'good';
    run(sim, 'school.summer_cabaret', {});
    tended(sim, at(2027, 10, 6, 9));
    run(sim, 'school.withdraw', { confirm: true });
    sim.advanceTo(at(2027, 10, 6, 9, 5));
    expect(run(sim, 'benefits.claim', {})).toEqual({ weekly: 93_00, maxTotal: 2_418_00 });
    tended(sim, at(2027, 10, 23, 9));
    // TEST SETUP: a stay in hospital from Saturday 23 October at nine to an hour past the Sunday’s certification. Each
    // day begun from Monday 18 to Saturday 23 October began able, Sunday’s in hospital: six of seven, the major portion.
    healthOf(sim.player).inHospitalUntil = sunday(10, 24) + MS_HOUR;
    tended(sim, at(2027, 10, 25, 9));
    // TEST SETUP: a concussion from Monday 25 October at nine, off work until noon on Sunday the 31st: that Sunday’s
    // certification finds her well, but only Monday’s day began able, one of seven.
    healthOf(sim.player).injury = { kind: 'concussion', at: sim.now, until: at(2027, 11, 3, 12), offWorkUntil: at(2027, 10, 31, 12) };
    tended(sim, sunday(11, 7) + MS_HOUR);
    // Break: `ableOnMost` reading only the certification’s moment, as every week was until 2026-10-13: 24 October unpaid
    // and 31 October paid.
    expect(benefitPaid(sim)).toEqual([[sunday(10, 10), 93_00], [sunday(10, 17), 93_00], [sunday(10, 24), 93_00], [sunday(11, 7), 93_00]]);
  }, 60_000);

  it('PLAYER JOURNEY: withdrawn on Saturday 2 October 2027 at five, after the six hours worked at ten, the claim’s first Sunday, the next evening, holds that work: $93 less two-thirds of $138, $1; the next Sunday $93', () => {
    const sim = student('g15-claim');
    tended(sim, at(2027, 3, 20, 12));
    // TEST SETUP: good standing before joining, as in the journey above.
    sim.player.school!.standing = 'good';
    run(sim, 'school.summer_cabaret', {});
    tended(sim, at(2027, 10, 2, 17));
    const shift = sim.universe.scheduled.find((i) => i.kind === 'school.shift' && i.at === at(2027, 10, 2, 10))!;
    expect(shift).toMatchObject({ status: 'done', payload: { hours: 6, worked: 6 } });
    run(sim, 'school.withdraw', { confirm: true });
    expect(run(sim, 'benefits.claim', {})).toEqual({ weekly: 93_00, maxTotal: 2_418_00 });
    tended(sim, at(2027, 10, 3, 21));
    // The week to Sunday 3 October at eight holds Saturday’s six hours at $23, $138: $93 less $92 (CGS 31-229).
    expect(benefitPaid(sim)).toEqual([[at(2027, 10, 3, 20), 1_00]]);
    tended(sim, sunday(10, 10) + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[at(2027, 10, 3, 20), 1_00], [sunday(10, 10), 93_00]]);
  }, 60_000);

  it('a Summer Cabaret week is counted by its days: the stipend paid on Friday 16 July 2027 for the seven days before it puts 117 of its 168 hours in the week to Sunday 18 July at eight, $261.16 and 27.9 hours of work', () => {
    const sim = student('g15-claim');
    tended(sim, at(2027, 3, 20, 12));
    // TEST SETUP: good standing before joining, as in the journey above.
    sim.player.school!.standing = 'good';
    run(sim, 'school.summer_cabaret', {});
    tended(sim, sunday(7, 18) + MS_HOUR);
    const stipends = sim.universe.transactions.filter((t) => t.memo === 'Yale Summer Cabaret stipend, the week' && t.at > sunday(7, 11) && t.at < sunday(7, 18)).map((t) => [t.at, -t.postings.find((p) => sim.universe.accounts[p.accountId]?.kind === 'income')!.amount]);
    expect(stipends).toEqual([[at(2027, 7, 16, 17), 375_00]]);
    // Sunday 11 July at eight to Friday 16 July at five: 117 hours of the stipend’s 168. A claim week reads the work done in
    // it (Connecticut’s weekly claim); a student certifying it is enrolled, so this is the figure, not a payment.
    const week = workDoneIn(sim, sim.player, sunday(7, 11), sunday(7, 18));
    expect(week.pay).toBe(Math.round((375_00 * 117) / 168));
    expect(week.pay).toBe(261_16);
    expect(week.hours).toBeCloseTo((40 * 117) / 168, 9);
  }, 60_000);
});
