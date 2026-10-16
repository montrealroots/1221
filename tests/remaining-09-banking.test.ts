/**
 * The banking area of brief 09 (2026-10-16, "Complete The Remaining Banking Behavior"): Germany's month's fee on a close,
 * which the last pass left to the owner (docs/verification/remaining/banking-result.json, banking.1.pro-rata), and what
 * it found and left in a home bank's own close. The checklist each was worked from, written before any code changed, is
 * docs/verification/remaining-09/banking-checklist.json, and what came of each is banking-result.json beside it.
 *
 * What these tests hold, and what was wrong until that day:
 * - A German current account closed, or canceled in its cooling-off period, was charged the whole month's fee on any day
 *   of it. BGB § 675h(3) owes a regular fee “nur anteilig bis zum Zeitpunkt der Beendigung des Vertrags”
 *   (gesetze-im-internet.de, read 2026-10-16), and § 357b(2) a cancellation Wertersatz for the service given up to it.
 *   The months of the quarter already ended are owed whole, as they were; the closing month only for the days of it the
 *   account was open, through the closing day, of its days, rounded half up to the cent in the bank's own money: SLATE's
 *   reading, since none of the five German price lists read that day says how a bank counts it. Nothing is paid ahead at
 *   a German bank in SLATE, each month's fee accruing at its end, so nothing is refunded.
 * - Closed after 11 PM on a month's last day, the month was charged twice: the month's end had put it with the quarter's,
 *   and closing added it again.
 * - Nothing said what closing would charge before Close It or Cancel It was pressed, unless it refused for it. A line
 *   under each says it now, from the engine's own figures.
 * - Deutsche Bank charged the month an account opened in, which its price list leaves free (“Die Kontoführung im
 *   Eröffnungsmonat ist kostenfrei”, Stand 1 October 2026).
 * - A home bank's own close, tried again each day on an account left overdrawn, charged a German account's month again
 *   each morning (`homeCloses`). No German bank closes a home account, so a GUARD on a bank given such a rule.
 *
 * Every figure is worked here by hand from the bank's monthly price and the calendar, written as a literal: the share is
 * fee × days ÷ the month's days, rounded half up. Where the account is kept in euros in a dollar save, the dollars are
 * SLATE's rate, €1 = $1 / 0.92, rounded to the cent. What an account held is read from it as play left it.
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeFrom`), Ada Cole, born in Berlin, a German
 * citizen in F-1 status, who lived in Berlin from June 2002 and kept her account at Deutsche Bank (Before Yale), its
 * AktivKonto and Flexgeld, banking at Chase in New Haven, at Yale from Monday 24 August 2026, the scraping family's, whose
 * Flexgeld (€64) closes at once. Your Banks and Your Accounts Over Time are the game's own screens, rendered with
 * react-dom/server, their buttons pressed through their own handlers. FIXTURES: quickSave lives in Berlin from Monday 5
 * January 2026, which no life the game makes is, where an account is opened in the month a test needs: no played life
 * opens a German account, its home account having been opened before Yale. Seeds are arbitrary: rb9-*.
 *
 * TEST SETUP, said again where it's done: Germany's and America's holiday files read from disk, as the app fetches them;
 * a balance set by a posting against a test line; Deutsche Bank given Barclays' kind of rule, closing a home account on
 * 60 days' notice, which it doesn't have.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createSave, loadPlacesFor, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { addCountryHolidays } from '@/engine/content/holidays';
import { addHomeTerms, homeTerms, resetHomeTerms } from '@/engine/content/homeaccounts';
import { breaches } from '@/engine/core/invariants';
import { HOME_CLOSES_KIND } from '@/engine/systems/abroad';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  calls: 0,
  sets: [] as { at: number; value: unknown }[],
  given: new Map<number, unknown>(),
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => unknown }[],
  answers: [] as { kind: string; ok: boolean; error?: string }[],
  toasts: [] as string[],
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
    toast: (text: string) => { h.toasts.push(text); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { BankMoves } = await import('@/ui/bank/BankMoves');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');

for (const country of ['us', 'de']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the ledger
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const BERLIN = 'Europe/Berlin';
const at = (year: number, month: number, day: number, hour = 9, minute = 0, zone = NY) => instantFromZoned({ year, month, day, hour, minute }, zone);
const berlin = (year: number, month: number, day: number, hour = 12, minute = 0) => at(year, month, day, hour, minute, BERLIN);

/** Ada Cole as the creation screen's draft makes her: raised in Berlin, her account kept at Deutsche Bank. */
async function berliner(seed: string): Promise<Simulation> {
  const sim = createSave(1, seed, newLifeFrom({
    homeRegionId: 'de-be-berlin', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'scraping', bankId: 'us-chase',
    priorResidence: { cityId: 'de-be-berlin', fromYear: 2002, fromMonth: 6 }, homeBankId: 'de-deutsche-bank',
  } as Partial<NewSaveConfig>));
  await loadPlacesFor(sim.universe);
  return sim;
}
/** FIXTURE: a quick-save life in Berlin, banking at a German bank, which no new life is. */
const inBerlin = (bankId: string, seed: string): Simulation =>
  quickSave({ startLocationId: 'de-be-berlin', homeRegionId: 'de-be-berlin', livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const freeze = (sim: Simulation): string => serialise(sim.universe);
const thaw = (snap: string): Simulation => loadSave(deserialise(snap) as never);
const reload = (sim: Simulation): Simulation => thaw(freeze(sim));
const mine = (sim: Simulation): Account[] => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
const konto = (sim: Simulation): Account => mine(sim).find((a) => a.bankId === 'de-deutsche-bank' && a.kind === 'checking')!;
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What each posting with this memo put on one account, in the account's own money where it keeps one. */
const heldBy = (sim: Simulation, memo: string, id: string) => sim.universe.transactions.filter((t) => t.memo === memo).flatMap((t) => t.postings).filter((p) => p.accountId === id).map((p) => p.native ?? p.amount);
/** The same, in the save's money. */
const postedTo = (sim: Simulation, memo: string, id: string) => sim.universe.transactions.filter((t) => t.memo === memo).flatMap((t) => t.postings).filter((p) => p.accountId === id).map((p) => p.amount);
/** Every transaction on an account from a moment, as memo, save money and own money. */
const onAccount = (sim: Simulation, id: string, from: number) => sim.universe.transactions.filter((t) => t.at >= from && t.postings.some((p) => p.accountId === id))
  .map((t) => [t.at, t.memo, t.postings.map((p) => [p.accountId, p.amount, p.native])]);
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function ok<T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
}
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, `${kind} went through`).toBe(false);
  return answer.error ?? '';
}
/** TEST SETUP: an account's balance set by a posting against a test line, in its own money too where it keeps one. */
function setTo(sim: Simulation, account: Account, to: number, held?: number): void {
  const by = to - account.balance;
  const ownBy = held !== undefined ? held - (account.held ?? 0) : undefined;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: by, ...(ownBy !== undefined ? { native: ownBy } : {}) }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}

const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
function drawn(sim: Simulation, element: ReactElement): string {
  h.sim = sim;
  h.calls = 0;
  h.sets = [];
  h.buttons = [];
  return words(renderToStaticMarkup(element).replace(/<!-- -->/g, ''));
}
const buttons = (said: string) => h.buttons.filter((b) => b.text === said);
function press(said: string): void {
  const found = buttons(said);
  expect(found.length, `“${said}” is drawn (drawn: ${h.buttons.map((b) => b.text).join(' | ')})`).toBe(1);
  expect(found[0]!.disabled, `“${said}” can be pressed`).toBe(false);
  h.sets = [];
  found[0]!.onClick!();
  for (const s of h.sets) h.given.set(s.at, s.value);
}
/** Pressed: the button with these words drawn next after the one naming `after` (an account's name). */
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

beforeEach(() => {
  h.given = new Map();
  h.answers = [];
  h.toasts = [];
});

/** The Berlin-raised student on 1 October 2026, her Flexgeld closed (€64, under the month's €2,000: at once). */
async function readyToClose(seed: string): Promise<Simulation> {
  const sim = await berliner(seed);
  sim.advanceTo(at(2026, 10, 1, 9));
  const flex = mine(sim).find((a) => a.bankId === 'de-deutsche-bank' && a.kind === 'savings')!;
  ok(sim, 'bank.close_savings', { accountId: flex.id });
  expect(flex.closedAt).toBe(sim.now);
  // The quarter's closing on 30 September at 11 PM took August's and September's €6.90: the quarter starts again at nothing.
  expect(heldBy(sim, 'Quarterly closing, fees: AktivKonto', konto(sim).id)).toEqual([-13_80]);
  expect([konto(sim).feesDue, konto(sim).feesDueHeld]).toEqual([0, 0]);
  return sim;
}
/** Close It on the AktivKonto, into Chase, by the command Your Banks sends. */
const closeKonto = (sim: Simulation) => sim.execute({ kind: 'bank.close_current', payload: { accountId: konto(sim).id, remainderTo: sim.player.primaryAccountId } });

// ---------------------------------------------------------------------------
// banking.1.pro-rata
// ---------------------------------------------------------------------------

describe('banking.1.pro-rata: a German account’s month’s fee on a close, to the day', () => {
  it('PLAYER JOURNEY: on Wednesday 14 October 2026 Your Banks tells the Berlin-raised student that closing her AktivKonto charges its fees to the day, €3.12 ($3.39), October’s €6.90 for 14 of its 31 days; Close It pressed charges that once against Bank Fees and sends the rest to Chase, and a second press and a reload charge nothing more', async () => {
    const sim = await readyToClose('rb9-journey');
    sim.advanceTo(at(2026, 10, 14, 9));
    const k = konto(sim);
    const chase = primary(sim);
    expect([chase.name, k.feesDue]).toEqual(['Chase Total Checking', 0]);
    // 690 × 14 / 31 = 311.6, €3.12; in dollars 312 / 0.92 = 339.1, $3.39. Until 2026-10-16 the whole €6.90.
    const said = 'Closing it now charges its fees to the day, €3.12 ($3.39): October’s €6.90 for the 14 days of its 31 it’s been open, €3.12. German law charges a month’s fee only to the day an account closes.';
    expect(drawn(sim, createElement(BankMoves))).toContain(said);
    expect(buttons('Close It').map((b) => b.disabled)).toEqual([false]);
    const held = k.held!;
    press('Close It');
    const closedAt = sim.now;
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.close_current', ok: true });
    expect(heldBy(sim, 'Closing fees: AktivKonto', k.id)).toEqual([-3_12]);
    expect(postedTo(sim, 'Closing fees: AktivKonto', k.id)).toEqual([-3_39]);
    const closing = sim.universe.transactions.find((t) => t.memo === 'Closing fees: AktivKonto')!;
    expect(closing.postings.reduce((n, p) => n + p.amount, 0)).toBe(0);
    expect(closing.postings.map((p) => sim.universe.accounts[p.accountId]!.name)).toEqual(['AktivKonto', 'Bank Fees']);
    // What it held less the €3.12 goes to Chase by Deutsche Bank's own payment abroad: everything that left it at the
    // close, the fees with it, is what it held, and it holds nothing, closed.
    expect([k.closedAt, k.held, k.balance]).toEqual([closedAt, 0, 0]);
    const left = sim.universe.transactions.filter((t) => t.at === closedAt).flatMap((t) => t.postings).filter((p) => p.accountId === k.id).reduce((n, p) => n + (p.native ?? 0), 0);
    expect(left).toBe(-held);
    // Pressed again: the account is gone from Your Banks, and the command refuses with nothing posted.
    drawn(sim, createElement(BankMoves));
    expect(buttons('Close It')).toEqual([]);
    const count = sim.universe.transactions.length;
    expect(refusal(sim, 'bank.close_current', { accountId: k.id, remainderTo: chase.id })).toBe('Only a current account of yours can be closed here.');
    expect(sim.universe.transactions.length).toBe(count);
    // Reloaded, and on past October's end and the quarter's: nothing more on the closed account.
    const back = reload(sim);
    back.advanceTo(at(2027, 1, 2, 9));
    expect(heldBy(back, 'Closing fees: AktivKonto', k.id)).toEqual([-3_12]);
    expect(onAccount(back, k.id, closedAt + 1)).toEqual([]);
    expect(breaches(back.universe)).toEqual([]);
  }, 300_000);

  it('PLAYER JOURNEY: at the month’s edges: 31 October 2026 at 11:30 PM, after October’s end, €6.90 once (until 2026-10-16 €13.80); 1 March 2027 €14.02, January’s and February’s kept and one day of March’s; 31 March at 10 PM €20.70; at 11:30 PM, after the quarter’s closing took its €20.70, nothing at closing, and the screen says why', async () => {
    const sim = await readyToClose('rb9-edges');
    const snap = freeze(sim);
    // October's end, at 11 PM on the 31st, put October's €6.90 with the quarter's; closing at 11:30 PM adds no more.
    const oct = thaw(snap);
    oct.advanceTo(at(2026, 10, 31, 23, 30));
    expect(konto(oct).feesDueHeld).toBe(6_90);
    // €6.90 is $7.50 (690 / 0.92).
    expect(drawn(oct, createElement(BankMoves))).toContain('Closing it now charges €6.90 ($7.50), the €6.90 kept for the quarter’s closing: October’s was counted at the month’s end.');
    expect(closeKonto(oct).ok).toBe(true);
    expect(heldBy(oct, 'Closing fees: AktivKonto', konto(oct).id)).toEqual([-6_90]);

    const spring = thaw(snap);
    spring.advanceTo(at(2027, 3, 1, 8));
    const snap2 = freeze(spring);
    // 1 March 2027 at 9 AM: January's and February's €6.90 kept, €13.80, and 690 × 1 / 31 = 22.3, €0.22: €14.02.
    const first = thaw(snap2);
    first.advanceTo(at(2027, 3, 1, 9));
    expect(konto(first).feesDueHeld).toBe(13_80);
    expect(drawn(first, createElement(BankMoves))).toContain('€14.02');
    expect(closeKonto(first).ok).toBe(true);
    expect(heldBy(first, 'Closing fees: AktivKonto', konto(first).id)).toEqual([-14_02]);
    // 31 March at 10 PM, before the quarter's closing at 11: €13.80 and March whole, 690 × 31 / 31: €20.70.
    const late = thaw(snap2);
    late.advanceTo(at(2027, 3, 31, 22));
    expect(closeKonto(late).ok).toBe(true);
    expect(heldBy(late, 'Closing fees: AktivKonto', konto(late).id)).toEqual([-20_70]);
    expect(heldBy(late, 'Quarterly closing, fees: AktivKonto', konto(late).id)).toEqual([-13_80, -20_70]);
    // 31 March at 11:30 PM: the quarter's closing has posted the €20.70; closing charges nothing, and says so first.
    const after = thaw(snap2);
    after.advanceTo(at(2027, 3, 31, 23, 30));
    expect(heldBy(after, 'Quarterly closing, fees: AktivKonto', konto(after).id)).toEqual([-13_80, -20_70, -20_70]);
    expect(drawn(after, createElement(BankMoves))).toContain('Closing it now charges no fees: March’s was counted at the month’s end.');
    expect(closeKonto(after).ok).toBe(true);
    expect(heldBy(after, 'Closing fees: AktivKonto', konto(after).id)).toEqual([]);
    for (const s of [oct, first, late, after]) expect(breaches(s.universe)).toEqual([]);
  }, 600_000);

  it('PLAYER JOURNEY: February in a leap year: closed on 15 February 2027, €10.60, January’s €6.90 and 15 of 28 days, €3.70; on 15 February 2028, €10.47, 15 of 29, €3.57; on 29 February 2028, €13.80, the month whole; and the 2027 close comes to the same postings whether the clock jumps from 1 February or runs a day at a time with a reload on the 8th', async () => {
    const sim = await readyToClose('rb9-leap');
    sim.advanceTo(at(2027, 2, 1, 9));
    const snap = freeze(sim);
    // 690 × 15 / 28 = 369.6, €3.70.
    const jump = thaw(snap);
    jump.advanceTo(at(2027, 2, 15, 9));
    expect(drawn(jump, createElement(BankMoves))).toContain('Closing it now charges its fees to the day, €10.60 ($11.52): €6.90 kept for the quarter’s closing, and February’s €6.90 for the 15 days of its 28 it’s been open, €3.70.');
    expect(closeKonto(jump).ok).toBe(true);
    expect(heldBy(jump, 'Closing fees: AktivKonto', konto(jump).id)).toEqual([-10_60]);
    // Its twin, a day at a time from 2 February, reloaded on the 8th: the same postings on the AktivKonto, to the cent.
    let steps = thaw(snap);
    for (let t = at(2027, 2, 2, 9); t <= at(2027, 2, 15, 9); t += MS_DAY) {
      steps.advanceTo(t);
      if (t === at(2027, 2, 8, 9)) steps = reload(steps);
    }
    expect(closeKonto(steps).ok).toBe(true);
    expect(onAccount(steps, konto(steps).id, at(2027, 2, 1, 9))).toEqual(onAccount(jump, konto(jump).id, at(2027, 2, 1, 9)));

    const leap = thaw(snap);
    leap.advanceTo(at(2028, 2, 1, 9));
    const snap28 = freeze(leap);
    // 690 × 15 / 29 = 356.9, €3.57; with January's €6.90, €10.47.
    const mid = thaw(snap28);
    mid.advanceTo(at(2028, 2, 15, 9));
    expect(closeKonto(mid).ok).toBe(true);
    expect(heldBy(mid, 'Closing fees: AktivKonto', konto(mid).id)).toEqual([-10_47]);
    // The 29th, 9 AM: the whole of February, 690 × 29 / 29; with January's, €13.80.
    const leapDay = thaw(snap28);
    leapDay.advanceTo(at(2028, 2, 29, 9));
    expect(closeKonto(leapDay).ok).toBe(true);
    expect(heldBy(leapDay, 'Closing fees: AktivKonto', konto(leapDay).id)).toEqual([-13_80]);
    for (const s of [jump, steps, mid, leapDay]) expect(breaches(s.universe)).toEqual([]);
  }, 900_000);

  it('PLAYER JOURNEY: moved down to €1.00, the AktivKonto is refused Close It on Your Banks for its fees to the day, with what to pay in; $50 moved in from Chase, it closes on the day it’s pressed for that day’s share, once', async () => {
    const sim = await readyToClose('rb9-short');
    sim.advanceTo(at(2026, 10, 14, 9));
    const k = konto(sim);
    const chase = primary(sim);
    // Deutsche Bank's payment abroad: 0.15% of it, at least €10, and €1.55 beside (its price list, as content/homeaccounts
    // reads it): under €6,666.67 that's €11.55, so sending what it holds less €12.55 leaves €1.00.
    const out = ok<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: k.id, toId: chase.id, amount: k.held! - 12_55, in: 'EUR' });
    expect(k.held).toBe(1_00);
    sim.advanceTo(Math.max(out.arrivesAt + MS_HOUR, at(2026, 10, 20, 9)));
    expect(sim.now).toBe(at(2026, 10, 20, 9));
    // 20 October: 690 × 20 / 31 = 445.2, €4.45, $4.84 (445 / 0.92 = 483.7); short by that less what it holds in dollars.
    const words = `Its fees, $4.84, are more than it holds. Pay in ${usd(4_84 - k.balance)} first.`;
    const text = drawn(sim, createElement(BankMoves));
    expect(buttons('Close It').map((b) => [b.disabled, b.title])).toEqual([[true, words]]);
    expect(text).toContain(`To close it: ${words} Closing it now charges its fees to the day, €4.45 ($4.84): October’s €6.90 for the 20 days of its 31 it’s been open, €4.45.`);
    expect(refusal(sim, 'bank.close_current', { accountId: k.id, remainderTo: chase.id })).toBe(words);
    expect([k.closedAt, heldBy(sim, 'Closing fees: AktivKonto', k.id)]).toEqual([undefined, []]);
    // $50 from Chase, a payment abroad, lands in Deutsche Bank's days; pressed on Monday 26 October.
    const into = ok<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase.id, toId: k.id, amount: 50_00 });
    sim.advanceTo(Math.max(into.arrivesAt + MS_HOUR, at(2026, 10, 26, 9)));
    expect(sim.now).toBe(at(2026, 10, 26, 9));
    expect(k.held!).toBeGreaterThan(5_79);
    drawn(sim, createElement(BankMoves));
    press('Close It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.close_current', ok: true });
    // 690 × 26 / 31 = 578.7, €5.79: the day it closed, not the day it was first refused.
    expect(heldBy(sim, 'Closing fees: AktivKonto', k.id)).toEqual([-5_79]);
    expect(refusal(sim, 'bank.close_current', { accountId: k.id, remainderTo: chase.id })).toBe('Only a current account of yours can be closed here.');
    expect(heldBy(reload(sim), 'Closing fees: AktivKonto', k.id)).toEqual([-5_79]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('FIXTURE, Berlin: a Commerzbank GiroKonto opened on Monday 5 January beside Deutsche Bank, €100 under that day and paid back on the 16th: Your Accounts Over Time says canceling charges €1.90 of fees, 12 of January’s 31 days of its €4.90, and refuses it for those and 43 cents of overdraft interest, “Pay in €2.33 first”; paid in, canceled, both charged, once', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb9-cancel');
    const db = primary(sim);
    const giro = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-commerzbank' }).accountId]!;
    setTo(sim, giro, -100_00); // TEST SETUP
    sim.advanceTo(berlin(2026, 1, 16, 12));
    ok(sim, 'bank.transfer', { fromId: db.id, toId: giro.id, amount: 100_00 });
    expect(giro.balance).toBe(0);
    // Commerzbank charges 14.40% past its Dispo, and none is arranged: 10,000 × 0.144 / 365 = 3.945205¢ a day's end,
    // eleven of them, 6 to 16 January: 43.4¢, 43 cents. Its fee: 490 × 12 / 31 (5 to 16 January) = 189.7, €1.90.
    const words = 'Its overdraft interest, €0.43, and its fees, €1.90, are more than it holds. Pay in €2.33 first.';
    const said = 'Canceling it now charges its fees to the day, €1.90: January’s €4.90 for the 12 days of its 31 it’s been open, €1.90. German law charges a month’s fee only to the day an account closes.';
    expect(drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }))).toContain(`less the fees it owes. ${said} ${words}`);
    expect(refusal(sim, 'bank.cancel_new', { accountId: giro.id })).toBe(words);
    ok(sim, 'bank.transfer', { fromId: db.id, toId: giro.id, amount: 2_33 });
    drawn(sim, createElement(BankAccountLife, { bankId: 'de-deutsche-bank' }));
    pressAfter(giro.name, 'Cancel It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.cancel_new', ok: true });
    expect(postedTo(sim, 'Overdraft interest, on closing', giro.id)).toEqual([-43]);
    expect(postedTo(sim, 'Closing fees: GiroKonto', giro.id)).toEqual([-1_90]);
    expect([giro.closedAt, giro.balance]).toEqual([sim.now, 0]);
    expect(refusal(sim, 'bank.cancel_new', { accountId: giro.id })).toBe('That isn’t one of your accounts.');
    expect(postedTo(reload(sim), 'Closing fees: GiroKonto', giro.id)).toEqual([-1_90]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// banking.1.pro-rata.opening-month
// ---------------------------------------------------------------------------

describe('banking.1.pro-rata.opening-month: Deutsche Bank’s month of opening, free', () => {
  it('FIXTURE, Berlin: an AktivKonto opened beside Commerzbank on Monday 5 January is told on Your Banks that closing charges nothing, January being the month it opened; closed on 31 January at 10 PM nothing is charged; its twin kept is charged nothing at January’s end, and closed on 10 February €2.46, 10 of February’s 28 days', () => {
    const sim = inBerlin('de-commerzbank', 'rb9-opening');
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(sim, db, 100_00); // TEST SETUP
    expect(drawn(sim, createElement(BankMoves))).toContain('Closing it now charges no fees: January’s is free, the month it opened.');
    const snap = freeze(sim);
    const late = thaw(snap);
    late.advanceTo(berlin(2026, 1, 31, 22));
    expect(late.execute({ kind: 'bank.close_current', payload: { accountId: db.id, remainderTo: primary(late).id } }).ok).toBe(true);
    expect(postedTo(late, 'Closing fees: AktivKonto', db.id)).toEqual([]);
    const kept = thaw(snap);
    kept.advanceTo(berlin(2026, 2, 1, 12));
    // January's end charged nothing: until 2026-10-16 it kept €6.90 for the quarter's closing.
    expect(kept.universe.accounts[db.id]!.feesDue).toBe(0);
    kept.advanceTo(berlin(2026, 2, 10, 12));
    // 690 × 10 / 28 = 246.4, €2.46.
    expect(kept.execute({ kind: 'bank.close_current', payload: { accountId: db.id, remainderTo: primary(kept).id } }).ok).toBe(true);
    expect(postedTo(kept, 'Closing fees: AktivKonto', db.id)).toEqual([-2_46]);
    // And a twin left open: February's end keeps February's €6.90.
    const open = thaw(snap);
    open.advanceTo(berlin(2026, 3, 1, 12));
    expect(open.universe.accounts[db.id]!.feesDue).toBe(6_90);
    for (const s of [late, kept, open]) expect(breaches(s.universe)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// banking.3: a home bank's own close, tried again each day
// ---------------------------------------------------------------------------

describe('banking.3: a home bank’s own close settles the fees once', () => {
  afterEach(() => resetHomeTerms('de-deutsche-bank'));

  it('GUARD: Deutsche Bank given Barclays’ kind of rule (TEST SETUP: it closes no home account), its close on 23 October 2026 finding the AktivKonto overdrawn charges €5.12, 23 of October’s 31 days, once; the daily tries after and the months’ ends charge no more fees; paid off, it closes, and the quarter’s closing finds nothing', async () => {
    // Why play can't reach it: only Barclays closes a home account (docs/research/banking/home-accounts.json), and
    // Barclays charges no monthly fee and closes monthly. TEST SETUP: Deutsche Bank's terms given a 60 days' notice.
    addHomeTerms({ ...homeTerms('de-deutsche-bank')!, nonResident: 'closes', closeNoticeDays: 60 });
    const sim = await readyToClose('rb9-homecloses');
    // The notice from the first morning, Monday 24 August at 7:30 AM: 60 days on is Friday 23 October.
    expect(sim.universe.scheduled.filter((i) => i.kind === HOME_CLOSES_KIND).map((i) => i.at)).toEqual([at(2026, 10, 23, 7, 30)]);
    sim.advanceTo(at(2026, 10, 20, 9));
    const k = konto(sim);
    setTo(sim, k, -50_00, -46_00); // TEST SETUP: overdrawn
    // Through 1 December, short of the sixty days below zero that would have the bank charge it off (from 20 October).
    sim.advanceTo(at(2026, 12, 1, 9));
    // 690 × 23 / 31 = 511.9, €5.12, on the day of the close; until 2026-10-16 €6.90 again every morning after it.
    expect(heldBy(sim, 'Closing fees: AktivKonto', k.id)).toEqual([-5_12]);
    // In dollars the €5.12 charged, converted: 512 / 0.92 = 556.5, $5.57; not October's $7.50 cut to the day, 750 × 23 /
    // 31 = 556.5, $5.56, which would leave the two figures of one charge a cent apart.
    expect(postedTo(sim, 'Closing fees: AktivKonto', k.id)).toEqual([-5_57]);
    expect(titled(sim, 'Deutsche Bank Didn’t Close Your Account')).toHaveLength(1);
    expect(k.closedAt).toBeUndefined();
    expect(k.feesEndedAt).toBe(at(2026, 10, 23, 7, 30));
    // Still tried each day, and October's end and November's added nothing toward the quarter's closing.
    expect(sim.universe.scheduled.filter((i) => i.kind === HOME_CLOSES_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2026, 12, 2, 7, 30)]);
    expect([k.feesDue, k.feesDueHeld]).toEqual([0, 0]);
    const back = reload(sim);
    const k2 = konto(back);
    setTo(back, k2, 10_00, 9_20); // TEST SETUP: paid off
    back.advanceTo(at(2026, 12, 2, 9));
    expect(k2.closedAt).toBe(at(2026, 12, 2, 7, 30));
    back.advanceTo(at(2027, 1, 2, 9));
    expect(heldBy(back, 'Closing fees: AktivKonto', k2.id)).toEqual([-5_12]);
    expect(heldBy(back, 'Quarterly closing, fees: AktivKonto', k2.id)).toEqual([-13_80]);
    expect(titled(back, 'Deutsche Bank Closed Your Account')).toHaveLength(1);
    expect(breaches(back.universe)).toEqual([]);
  }, 300_000);
});
