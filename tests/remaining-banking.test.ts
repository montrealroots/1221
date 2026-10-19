/**
 * The banking area of the integration and acceptance pass (2026-10-16): the two defects the current scope left open, a
 * bank's own close and a term's interest taken before 2026-10-15, and what the owner's section 7 ("Finish Money And
 * Banking") found in money a New Haven student plays. The checklist each was worked from, written before any code
 * changed, is docs/verification/remaining/banking-checklist.json, and what came of each is banking-result.json beside it.
 *
 * What these tests hold, and what was wrong until that day:
 * - A bank's own close settled after it closed (`closedByBank`): a German account's fees would have closed it below zero
 *   with nothing pursuing the debt, and interest settled would have stayed in a closed account. It works out what closing
 *   settles first now: owed more than it holds, it isn't closed, and the fees post at their closing and the overdraft is
 *   pursued as any is; what it leaves goes to the primary account. Neither is reached in play, since only Citi and
 *   Capital One close an account at zero or unfunded and neither builds interest or charges fees at closing: GUARD.
 * - The overdraft's set-off (`closeForOverdraft`) closed a German account with its quarter's fees and the overdraft
 *   interest built since the 1st unsettled, and nothing charges a closed account: Deutsche Bank charged off €101.97 on 7
 *   March 2026 and dropped €20.70 of fees and 22 cents of interest. Every close dropped the interest built since the 1st:
 *   Close It, Cancel It, a switch, a home bank's own close. Each charges it now, and Close It's refusal counts it.
 * - A standing order from an account the bank closed of its own accord failed every month for good, and said so every
 *   month: it ends with the account now, said once in the closing notice.
 * - A term's interest taken during its term by a build before 2026-10-15's second recheck carries nothing against the
 *   term, so canceling the term didn't find it. It's found once now, when such a save is opened, by replaying the term's
 *   own accrual (`findTermInterest`).
 * - A payment to Yale reached savings only where savings was linked, and a Comfortable student with $45,652.00 in Chase
 *   Savings was told “Your bank can’t cover it.” for $20,000.00 owed, with nothing to do next. Yale takes a payment “from a
 *   U.S. checking or savings account” (Student Accounts, read 2026-10-16), and so does SLATE now, and a refusal says what
 *   the bank can pay and what to do.
 * - The panel that opens an account at another bank said nothing of its monthly fee before Apply. It says it, from the
 *   product the fee is charged by.
 * And what was found to hold, played: money between banks in transit, spendable only where it lands, once across a reload;
 * Move Money pressed and its button grayed, so one press is one transfer; and after a bank closes an account, nothing
 * more posts to it, no statement, no alert, no order.
 *
 * Every figure is worked here from the rule's own numbers, never asked of the engine's helper: as a literal where the
 * figures are fixed, and from the balance the account stood at where it's kept in another currency, its dollars set by
 * SLATE's rate.
 *
 * PLAYER JOURNEYS: new lives made as the creation screen makes them (`createSave` with `newLifeConfig`, the family given by
 * `withFamily`), Ada Cole at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, born in New York, at Chase unless
 * said; one with an account kept at home in Paris from before Yale, as creation's Before Yale keeps it. FIXTURES: quickSave
 * lives in Berlin from Monday 5 January 2026 at 7:30 AM, which no life the game makes is: no New Haven life reaches a German
 * bank, and only abroad does a bank build overdraft interest, charge fees at closing, or let a term's interest be taken in a
 * cooling-off period. Screens are the game's own, rendered with react-dom/server, their fields typed and their buttons
 * pressed through their own handlers; `useGame` stands in for the provider. Seeds are arbitrary.
 *
 * TEST SETUP, said again where it's done: a balance set by a posting against a test line; a German year's €1,000 of
 * interest posted to use its allowance; a bank given a zero-close rule it doesn't have; interest built set on an account
 * that pays none; a save rewritten as an older build wrote it; a Yale account charged as a seventh term charges it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createSave, loadPlacesFor, loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account, LedgerTransaction } from '@/engine/core/ledger';
import { newLifeConfig, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { OPENING } from '@/engine/content/bankopening';
import { addCountryHolidays } from '@/engine/content/holidays';
import { breaches } from '@/engine/core/invariants';
import { yearOf } from '@/engine/systems/earnings';
import { accountOwed, yaleAccount } from '@/engine/systems/leave';
import { inTransitOf } from '@/engine/systems/bankmoves';
import { paymentsOf } from '@/engine/systems/payments';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  calls: 0,
  sets: [] as { at: number; value: unknown }[],
  given: new Map<number, unknown>(),
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => unknown }[],
  fields: [] as { id?: string; onChange?: (e: { target: { value: string; checked?: boolean } }) => unknown }[],
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
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');

for (const country of ['us', 'fr', 'de']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the ledger
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const BERLIN = 'Europe/Berlin';
const at = (year: number, month: number, day: number, hour = 12, minute = 0, zone = NY) => instantFromZoned({ year, month, day, hour, minute }, zone);
const berlin = (year: number, month: number, day: number, hour = 12, minute = 0) => at(year, month, day, hour, minute, BERLIN);
/** Ada Cole at Yale, born in New York, from the family chosen on creation. */
const ada = (seed: string, family: StartingWealth = 'modest', extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...withFamily(newLifeConfig(), family), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** FIXTURE: a quick-save life in Berlin, banking at a German bank, which no new life is. */
const inBerlin = (bankId: string, seed: string): Simulation =>
  quickSave({ startLocationId: 'de-be-berlin', homeRegionId: 'de-be-berlin', livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation): Account[] => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
const byName = (sim: Simulation, name: string): Account => mine(sim).find((a) => a.name === name)!;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What each posting with this memo put on one account. */
const postedTo = (sim: Simulation, memo: string, id: string) => sim.universe.transactions.filter((t) => t.memo === memo).flatMap((t) => t.postings).filter((p) => p.accountId === id).map((p) => p.amount);
const line = (sim: Simulation, kind: 'income' | 'expense', name: string) => Object.values(sim.universe.accounts).find((a) => a.nominal && a.kind === kind && a.name === name)!;
/** Every transaction that touched an account at or after a moment. */
const touched = (sim: Simulation, id: string, from: number) => sim.universe.transactions.filter((t) => t.at >= from && t.postings.some((q) => q.accountId === id));

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
/** TEST SETUP: an account's balance set by a posting against a test line. */
function setTo(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** A passport applied for and come, as a new bank asks for a photo ID in force. */
function passport(sim: Simulation): void {
  const p = ok<{ readyAt: number }>(sim, 'documents.apply_passport');
  sim.advanceTo(p.readyAt + MS_HOUR);
}

const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
function drawn(sim: Simulation, element: ReactElement): string {
  h.sim = sim;
  h.calls = 0;
  h.sets = [];
  h.buttons = [];
  h.fields = [];
  return words(renderToStaticMarkup(element).replace(/<!-- -->/g, ''));
}
function type(id: string, value: string): void {
  const found = h.fields.filter((f) => f.id === id);
  expect(found, `field #${id}`).toHaveLength(1);
  h.sets = [];
  found[0]!.onChange!({ target: { value } });
  for (const s of h.sets) h.given.set(s.at, s.value);
}
function press(said: string): void {
  const found = h.buttons.filter((b) => b.text === said);
  expect(found.length, `“${said}” is drawn (drawn: ${h.buttons.map((b) => b.text).join(' | ')})`).toBe(1);
  expect(found[0]!.disabled, `“${said}” can be pressed`).toBe(false);
  h.sets = [];
  found[0]!.onClick!();
  for (const s of h.sets) h.given.set(s.at, s.value);
}

beforeEach(() => {
  h.given = new Map();
  h.answers = [];
  h.toasts = [];
});

// ---------------------------------------------------------------------------
// banking.1: a bank's own close
// ---------------------------------------------------------------------------

describe('banking.1: a bank’s own close settles what it owes and leaves nothing in it', () => {
  const opening = OPENING as Record<string, (typeof OPENING)[string]>;
  const kept = opening['de-deutsche-bank'];
  afterEach(() => { if (kept) opening['de-deutsche-bank'] = kept; else delete opening['de-deutsche-bank']; });

  /**
   * Until 2026-10-16's brief 09 this was “… they post at the quarter’s closing, €20.70, and nothing is dropped”: January,
   * the month the AktivKonto opened, was charged. Deutsche Bank's price list leaves it free (read that day), so the
   * quarter's closing takes February's and March's, €13.80, and closing on 5 February would have charged February's to
   * the day. The renamed title is in docs/verification/pipeline/inputs/renames.json.
   */
  it('GUARD: a Deutsche Bank AktivKonto left at zero beside a Commerzbank primary, its bank given a rule to close one at zero thirty days (TEST SETUP: no German bank has one), isn’t closed while its fees would take it below zero; they post at the quarter’s closing, €13.80, January free as the month it opened, and nothing is dropped', () => {
    // Why play can't reach it: only Citi and Capital One close an account at zero or unfunded (`OPENING`), and neither
    // charges fees at closing. TEST SETUP: Deutsche Bank given Citi's kind of rule, at thirty days.
    opening['de-deutsche-bank'] = { closesAtZeroAfterDays: 30, source: 'TEST SETUP' };
    const sim = inBerlin('de-commerzbank', 'rb-zero-de');
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    expect([db.name, db.balance]).toEqual(['AktivKonto', 0]);
    // At zero from the first day's end, 6 January; thirty days on is 5 February. January, the month it opened, is free
    // (Deutsche Bank's price list), so nothing waits for the quarter's closing (AGB-Banken no. 7), and February's €6.90
    // to the day is this month's: on the 5th, 690 × 5 / 28 = 123.2, €1.23, with nothing to take it from. Until 2026-10-16
    // January's €6.90 was kept, and February's whole.
    sim.advanceTo(berlin(2026, 2, 6, 12));
    expect(db.closedAt).toBeUndefined();
    expect(db.feesDue).toBe(0);
    expect(sim.universe.notifications.filter((n) => n.title.endsWith('Closed AktivKonto'))).toEqual([]);
    // The quarter's closing on 31 March takes February's and March's €6.90: €13.80, the debt the bank holds.
    sim.advanceTo(berlin(2026, 4, 1, 12));
    expect(postedTo(sim, 'Quarterly closing, fees: AktivKonto', db.id)).toEqual([-13_80]);
    expect(db.closedAt).toBeUndefined();
    expect(db.balance).toBe(-13_80);
    expect(db.negativeSince).toBe(berlin(2026, 4, 1, 0));
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  it('GUARD: Citi closes an Access Checking account left at zero ninety days, and the interest it settles on closing (TEST SETUP: $2.50 built, which Citi Access Checking doesn’t pay) goes to Chase, the primary, by Citi’s own payment, nothing left in the closed account', () => {
    // Born 2004, so 22: Citi waives its $5 for an owner under 24, and the account stays at zero. Why play can't reach it:
    // Citi Access Checking pays no interest (`content/banks.ts`), so nothing is ever built on it.
    const sim = ada('rb-citi-zero', 'modest', { birthYear: 2004 });
    passport(sim);
    const chase = primary(sim);
    const citi = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId]!;
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(citi.zeroSince).toBeDefined();
    // Ninety days at zero from its first day's end, 6 October: Monday 4 January 2027 at midnight. Set after December's
    // end, which would have paid it into the account.
    expect(citi.zeroSince).toBe(at(2026, 10, 6, 0));
    sim.advanceTo(at(2027, 1, 2, 12));
    expect(citi.closedAt).toBeUndefined();
    citi.accrued = 250.4; // TEST SETUP
    sim.advanceTo(at(2027, 1, 5, 12));
    expect([citi.closedAt, citi.balance]).toEqual([at(2027, 1, 4, 0), 0]);
    // $2.50 paid on closing (no US tax is taken at the bank), and the whole of it sent to Chase by Citi's own payment,
    // the same business day before its 12:30 PM cut-off: landed at 5 PM.
    expect(postedTo(sim, 'Interest: Citi Access Checking, on closing', citi.id)).toEqual([2_50]);
    expect(postedTo(sim, 'From Citi Access Checking', chase.id)).toEqual([2_50]);
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
    expect(titled(sim, 'Citi Closed Citi Access Checking').map((n) => n.body)).toEqual(['It sat at a zero balance for 90 days, so the bank closed it. Its $2.50 of interest is on its way to Chase Total Checking and arrives January 4, 2027.']);
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  /**
   * Until 2026-10-16's brief 09 this was “… charges off on 7 March what it’s owed to the day, €122.89: €101.97 overdrawn,
   * 22 cents of interest built since 1 March, and €20.70 of fees, …”: January, the month the AktivKonto opened, was
   * charged, and March whole. That day January became free (Deutsche Bank's price list) and the closing month's fee due
   * only to the day (BGB § 675h(3), `closingFeesDue`). The renamed title is in docs/verification/pipeline/inputs/renames.json.
   */
  it('FIXTURE, Berlin: Deutsche Bank’s own close of an AktivKonto €100 under from 5 January charges off on 7 March what it’s owed to the day, €110.65: €101.97 overdrawn, 22 cents of interest built since 1 March, and €8.46 of fees, February’s €6.90 and March’s to the 7th, nothing left on the closed account', () => {
    const sim = inBerlin('de-commerzbank', 'rb-setoff-de');
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(sim, db, -100_00); // TEST SETUP
    sim.advanceTo(berlin(2026, 3, 8, 12));
    // Its Dispo is 11.60% and past it 13.05%; with none arranged, all of it is past it, a day's end at a time:
    // €100: 10,000 × 0.1305 / 365 = 3.575342¢ a day; 27 day ends, 6 January to 1 February, 96.534¢, 96¢ charged on the 1st.
    // €100.96: 10,096 × 0.1305 / 365 = 3.609666¢; 0.534 + 28 × that, 2 February to 1 March, 101.605¢, 101¢ on the 1st.
    // €101.97: 10,197 × 0.1305 / 365 = 3.645777¢; 0.605 + 6 × that, 2 to 7 March, 22.480¢, 22¢ on the close.
    expect(postedTo(sim, 'Overdraft interest', db.id)).toEqual([-96, -101]);
    expect(postedTo(sim, 'Overdraft interest, on closing', db.id)).toEqual([-22]);
    // February's €6.90, kept for the quarter's closing (January, the month it opened, free), and March's to the day it
    // closed, the 7th: 690 × 7 / 31 = 155.8, €1.56; €8.46 charged on the close. €101.97 + €0.22 + €8.46 = €110.65.
    expect(postedTo(sim, 'Closing fees: AktivKonto', db.id)).toEqual([-8_46]);
    const debt = byName(sim, 'Owed To Deutsche Bank, In Collections');
    expect(postedTo(sim, 'Charged off by Deutsche Bank', db.id)).toEqual([110_65]);
    expect(debt.balance).toBe(-110_65);
    expect([db.closedAt, db.balance, db.feesDue, Math.floor(db.odAccrued ?? 0)]).toEqual([berlin(2026, 3, 7, 0), 0, 0, 0]);
    expect(titled(sim, 'Deutsche Bank Closed Your Account').map((n) => n.body)).toEqual(['It was overdrawn for 60 days. €110.65 it couldn’t recover went to collections and onto your credit record. You can pay it on Money, under Borrowing. Your money is at Commerzbank now.']);
    // Nothing more on the closed account, its month's end or its quarter's.
    sim.advanceTo(berlin(2026, 4, 2, 12));
    expect(touched(sim, db.id, berlin(2026, 3, 7, 1))).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
    // Its twin, played a day at a time and reloaded at each month's start, comes to the same postings on the account.
    let twin = inBerlin('de-commerzbank', 'rb-setoff-de');
    const twinDb = twin.universe.accounts[ok<{ accountId: string }>(twin, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(twin, twinDb, -100_00); // TEST SETUP
    for (let day = berlin(2026, 1, 6, 12); day <= berlin(2026, 3, 8, 12); day += MS_DAY) {
      twin.advanceTo(day);
      if (new Date(day).getUTCDate() === 1) twin = reload(twin);
    }
    const memos = (x: Simulation) => x.universe.transactions.filter((t) => t.postings.some((q) => q.accountId === db.id)).map((t) => [t.memo, t.postings.find((q) => q.accountId === db.id)!.amount]);
    expect(memos(twin)).toEqual(memos(sim));
    expect(byName(twin, 'Owed To Deutsche Bank, In Collections').balance).toBe(-110_65);
  }, 60_000);

  /**
   * Until 2026-10-16's brief 09 this was “… is refused Close It for its 53 cents of overdraft interest and €6.90 month,
   * “Pay in €7.43 first”; with €7.43 paid in, it closes and charges both, …”: the month it opened was charged whole.
   * Deutsche Bank's price list leaves that month free (read that day), so only the interest is owed; the interest and the
   * fees named together are tests/remaining-09-banking.test.ts's. The renamed title is in
   * docs/verification/pipeline/inputs/renames.json.
   */
  it('FIXTURE, Berlin: an AktivKonto €100 under from 5 January, paid back to nothing on 20 January, is refused Close It for its 53 cents of overdraft interest, “Pay in €0.53 first”, no fee owed for the month it opened; with 53 cents paid in, it closes and charges the interest, nothing left; a reload doesn’t charge it again', () => {
    const sim = inBerlin('de-commerzbank', 'rb-close-od');
    const giro = primary(sim);
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(sim, db, -100_00); // TEST SETUP
    sim.advanceTo(berlin(2026, 1, 20, 12));
    ok(sim, 'bank.transfer', { fromId: giro.id, toId: db.id, amount: 100_00 });
    expect(db.balance).toBe(0);
    // Fifteen day ends overdrawn, 6 to 20 January, at 3.575342¢ (13.05% on €100): 53.630¢, 53 cents.
    // January, the month it opened, is free (Deutsche Bank's price list; until 2026-10-16 €6.90, “Pay in €7.43 first”).
    const words = 'Its overdraft interest, €0.53, is more than it holds. Move €0.53 into it first.';
    expect(refusal(sim, 'bank.close_current', { accountId: db.id, remainderTo: giro.id })).toBe(words);
    expect(db.closedAt).toBeUndefined();
    ok(sim, 'bank.transfer', { fromId: giro.id, toId: db.id, amount: 53 });
    ok(sim, 'bank.close_current', { accountId: db.id, remainderTo: giro.id });
    expect(postedTo(sim, 'Overdraft interest, on closing', db.id)).toEqual([-53]);
    expect(postedTo(sim, 'Closing fees: AktivKonto', db.id)).toEqual([]);
    expect([db.closedAt, db.balance]).toEqual([sim.now, 0]);
    const again = reload(sim);
    again.advanceTo(berlin(2026, 2, 2, 12));
    const after = again.universe.accounts[db.id]!;
    expect(postedTo(again, 'Overdraft interest, on closing', db.id)).toEqual([-53]);
    expect(postedTo(again, 'Overdraft interest', db.id)).toEqual([]);
    expect(after.balance).toBe(0);
    expect(breaches(again.universe)).toEqual([]);
  }, 60_000);

  /**
   * Until 2026-10-16's brief 09 this was “… on 7 March Deutsche Bank takes the €122.89 it’s owed from the Flexgeld, …”:
   * the fees were January's, February's and March's whole, where January, the month it opened, is free and March is owed to
   * the 7th (the test above). The renamed title is in docs/verification/pipeline/inputs/renames.json.
   */
  it('FIXTURE, Berlin: the same AktivKonto with €500 in a Flexgeld beside it, and a standing order of €10 from it into the Flexgeld: on 7 March Deutsche Bank takes the €110.65 it’s owed from the Flexgeld, closes the AktivKonto and ends the order with it, said once; the Flexgeld stays open with its 41 cents of interest settled first', () => {
    const sim = inBerlin('de-commerzbank', 'rb-setoff-covered');
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    const flex = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'de-deutsche-bank' }).accountId]!;
    expect(flex.name).toBe('Flexgeld');
    setTo(sim, db, -100_00); // TEST SETUP
    setTo(sim, flex, 500_00); // TEST SETUP
    const order = ok<{ id: string }>(sim, 'bank.add_standing_order', { toId: flex.id, amount: 10_00, day: 20 });
    ok(sim, 'bank.set_order_source', { orderId: order.id, accountId: db.id });
    sim.advanceTo(berlin(2026, 3, 21, 12));
    // What the AktivKonto owed, as the charge-off above works it: €101.97, 22 cents of interest, €8.46 of fees.
    expect(postedTo(sim, 'Overdraft interest, on closing', db.id)).toEqual([-22]);
    expect(postedTo(sim, 'Closing fees: AktivKonto', db.id)).toEqual([-8_46]);
    expect(postedTo(sim, 'Set off against the overdraft', flex.id)).toEqual([-110_65]);
    // The Flexgeld's 0.50% on €500, 0.684932¢ a day's end from 6 January, 60 or 61 of them by the set-off: 41 cents,
    // under the allowance, settled before it, as Germany pays at the quarter's end.
    expect(postedTo(sim, 'Interest: Flexgeld, before the set-off', flex.id)).toEqual([41]);
    expect([db.closedAt, db.balance, flex.closedAt, flex.balance]).toEqual([berlin(2026, 3, 7, 0), 0, undefined, 500_00 + 41 - 110_65]);
    expect(titled(sim, 'Deutsche Bank Closed An Account').map((n) => n.body)).toEqual(['Deutsche Bank closed AktivKonto. It had been below zero for 60 days, so the bank took what it was owed from your other money there. Flexgeld stays open. Its standing order of €10.00 into Flexgeld on the 20th stopped when it closed. You can set up a new one from another account under How You Pay, on the Payments And Cash tab.']);
    // It failed on 20 January and 20 February, said once and brought up to the later day; not on 20 March.
    expect(titled(sim, 'A Standing Order Didn’t Go').map((n) => n.at)).toEqual([berlin(2026, 2, 20, 9)]);
    expect(paymentsOf(sim.player).standingOrders).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  it('FIXTURE, Berlin: a standing order of €10 from Commerzbank into a Deutsche Bank Flexgeld, the Flexgeld drained by the set-off and closed with the AktivKonto when Deutsche Bank charges it off on 7 March: the order ends with them, said once, and no “Didn’t Go” follows on 20 March', () => {
    const sim = inBerlin('de-commerzbank', 'rb-order-into');
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    const flex = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(sim, db, -100_00); // TEST SETUP
    ok(sim, 'bank.add_standing_order', { toId: flex.id, amount: 10_00, day: 20 });
    sim.advanceTo(berlin(2026, 3, 21, 12));
    // It went from Commerzbank on 20 January and 20 February, SEPA landing at once: €20 in the Flexgeld, all of it set off.
    expect(postedTo(sim, 'To Flexgeld at Deutsche Bank', flex.id)).toEqual([10_00, 10_00]);
    expect([db.closedAt, flex.closedAt, flex.balance]).toEqual([berlin(2026, 3, 7, 0), berlin(2026, 3, 7, 0), 0]);
    const closed = titled(sim, 'Deutsche Bank Closed Your Account');
    expect(closed).toHaveLength(1);
    expect(closed[0]!.body.endsWith('Your money is at Commerzbank now. Its standing order of €10.00 into Flexgeld on the 20th stopped when it closed. You can set up a new one from another account under How You Pay, on the Payments And Cash tab.')).toBe(true);
    expect(titled(sim, 'A Standing Order Didn’t Go')).toEqual([]);
    expect(paymentsOf(sim.player).standingOrders).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  it('FIXTURE, Berlin: a Deutsche Bank life with no other German bank, its AktivKonto €100 under and its Flexgeld empty, is charged off on 7 March and banked again elsewhere: the closing fees charged once, and nothing of them carried to the new bank as an overdraft', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-rebank-de');
    const db = primary(sim);
    const flex = mine(sim).find((a) => a.kind === 'savings' && a.bankId === 'de-deutsche-bank')!;
    setTo(sim, flex, 0); // TEST SETUP
    setTo(sim, db, -100_00); // TEST SETUP
    sim.advanceTo(berlin(2026, 3, 8, 12));
    expect(db.closedAt).toBeDefined();
    expect(postedTo(sim, 'Closing fees: AktivKonto', db.id)).toHaveLength(1);
    const now = primary(sim);
    expect(now.bankId).not.toBe('de-deutsche-bank');
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Moved to') && t.postings.some((q) => q.accountId === db.id && q.amount > 0))).toEqual([]);
    expect(touched(sim, now.id, now.openedAt).filter((t) => t.postings.some((q) => q.accountId === now.id && q.amount < 0) && t.at === now.openedAt)).toEqual([]);
    expect(byName(sim, 'Owed To Deutsche Bank, In Collections').balance).toBe(-postedTo(sim, 'Charged off by Deutsche Bank', db.id)[0]!);
    expect([db.balance, db.feesDue]).toEqual([0, 0]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  /**
   * Until 2026-10-16's brief 09 this was “… is refused Cancel It in its fourteen days for its 25 cents of overdraft interest
   * and €6.90 month; with €7.15 paid in, canceled, both charged”: the month it opened was charged whole, which Deutsche
   * Bank's price list leaves free (read that day). The renamed title is in docs/verification/pipeline/inputs/renames.json.
   */
  it('FIXTURE, Berlin: an AktivKonto opened on 5 January, €100 under that day and paid back on the 12th, is refused Cancel It in its fourteen days for its 25 cents of overdraft interest, no fee owed for the month it opened; with 25 cents paid in, canceled, the interest charged', () => {
    const sim = inBerlin('de-commerzbank', 'rb-cancel-od');
    const giro = primary(sim);
    const db = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'de-deutsche-bank' }).accountId]!;
    setTo(sim, db, -100_00); // TEST SETUP
    sim.advanceTo(berlin(2026, 1, 12, 12));
    ok(sim, 'bank.transfer', { fromId: giro.id, toId: db.id, amount: 100_00 });
    // Seven day ends, 6 to 12 January, at 3.575342¢: 25.027¢, 25 cents.
    // January free, the month it opened (until 2026-10-16 €6.90, “Pay in €7.15 first”).
    expect(refusal(sim, 'bank.cancel_new', { accountId: db.id })).toBe('Its overdraft interest, €0.25, is more than it holds. Move €0.25 into it first.');
    ok(sim, 'bank.transfer', { fromId: giro.id, toId: db.id, amount: 25 });
    ok(sim, 'bank.cancel_new', { accountId: db.id });
    expect(postedTo(sim, 'Overdraft interest, on closing', db.id)).toEqual([-25]);
    expect(postedTo(sim, 'Closing fees: AktivKonto', db.id)).toEqual([]);
    expect([db.closedAt, db.balance]).toEqual([sim.now, 0]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  it('PLAYER JOURNEY (TEST SETUP: Barclays overdrawn by a posting, $300 under from 1 to 15 October, which its card could do only were it primary): Barclays’ own close on 23 October, on its notice, charges the overdraft interest built, $3.77, past its £15 free', async () => {
    const sim = ada('rb-barclays-od', 'modest', { homeRegionId: 'uk-eng-london', priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: 'gb-barclays', bankId: 'us-chase' } as Partial<NewSaveConfig>);
    await loadPlacesFor(sim.universe);
    const current = mine(sim).find((a) => a.bankId === 'gb-barclays' && a.kind === 'checking')!;
    const saver = mine(sim).find((a) => a.bankId === 'gb-barclays' && a.kind === 'savings')!;
    // A standing order of $100 from Chase into the Barclays saver on the 28th, paid abroad each month until the close.
    ok(sim, 'bank.add_standing_order', { toId: saver.id, amount: 100_00, day: 28 });
    sim.advanceTo(at(2026, 10, 1, 12));
    const kept = current.balance;
    setTo(sim, current, -300_00); // TEST SETUP
    sim.advanceTo(at(2026, 10, 15, 12));
    setTo(sim, current, kept); // TEST SETUP: put back.
    // Barclays: 35.0% a year, none on the first £15, $18.99 at SLATE's rate (1,500 / 0.79). Fourteen day ends, 2 to 15
    // October, on $300 less $18.99: 28,101 × 0.35 / 365 = 26.946¢ a day, 377.247¢, $3.77, charged on the close.
    sim.advanceTo(at(2026, 10, 23, 12));
    expect(current.closedAt).toBeDefined();
    expect(postedTo(sim, 'Overdraft interest, on closing', current.id)).toEqual([-3_77]);
    expect(current.balance).toBe(0);
    // The order into the saver ends with it, said in the notice; none follows on 28 October.
    expect(titled(sim, 'Barclays Closed Your Account')[0]!.body.endsWith(`Its standing order of $100.00 into ${saver.name} on the 28th stopped when it closed. You can set up a new one from another account under How You Pay, on the Payments And Cash tab.`)).toBe(true);
    sim.advanceTo(at(2026, 10, 29, 12));
    expect(paymentsOf(sim.player).standingOrders).toEqual([]);
    expect(titled(sim, 'A Standing Order Didn’t Go')).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('PLAYER JOURNEY: a student with an account kept at BNP Paribas from Paris, emptied to Chase and taken below zero by its fees at August’s end, its Livret A closed into it on 10 September and Close It pressed: the overdraft interest built since 1 September is charged on closing, worked from the rate and the days, never dropped', async () => {
    const sim = ada('rb-paris-od', 'modest', { homeRegionId: 'fr-idf-paris', priorResidence: { cityId: 'fr-idf-paris', fromYear: 2002, fromMonth: 6 }, homeBankId: 'fr-bnp-paribas', bankId: 'us-chase' } as Partial<NewSaveConfig>);
    await loadPlacesFor(sim.universe);
    const chase = primary(sim);
    const current = mine(sim).find((a) => a.bankId === 'fr-bnp-paribas' && a.kind === 'checking')!;
    const livret = mine(sim).find((a) => a.bankId === 'fr-bnp-paribas' && a.kind === 'savings')!;
    // Emptied to Chase, as tests/home-account-setoff.test.ts empties it (BNP Paribas charges nothing to send it).
    ok(sim, 'bank.transfer', { fromId: current.id, toId: chase.id, amount: current.held, in: 'EUR' });
    expect(current.balance).toBe(0);
    // August's end charges its fees for a customer abroad, and the account is below zero from then.
    sim.advanceTo(at(2026, 8, 31, 23, 30));
    const under = -current.balance;
    expect(under).toBeGreaterThan(0);
    // BNP Paribas' rate on an overdraft is 18.40%: a day's end overdrawn builds the debt × 0.184 / 365, charged on the 1st
    // in whole cents. A day's is under a cent here, so the 1st charges nothing and the balance stands still.
    const daily = (under * 0.184) / 365;
    expect(daily).toBeLessThan(1);
    sim.advanceTo(at(2026, 9, 10, 12));
    expect(postedTo(sim, 'Overdraft interest', current.id)).toEqual([]);
    expect(current.balance).toBe(-under);
    ok(sim, 'bank.close_savings', { accountId: livret.id });
    expect(current.balance).toBeGreaterThan(0);
    ok(sim, 'bank.close_current', { accountId: current.id, remainderTo: chase.id });
    // Ten day ends overdrawn, 1 to 10 September.
    expect(Math.floor(10 * daily)).toBeGreaterThan(0);
    expect(postedTo(sim, 'Overdraft interest, on closing', current.id)).toEqual([-Math.floor(10 * daily)]);
    expect([current.closedAt, current.balance]).toEqual([sim.now, 0]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// banking.1: after a bank closes an account, nothing recurs on it
// ---------------------------------------------------------------------------

describe('banking.1: an account a bank closed stops', () => {
  it('PLAYER JOURNEY: a student of 24 opens Citi Access Checking and Capital One 360 Checking and funds neither, her standing order of $50 into Chase Savings set to pay from 360 Checking; Capital One closes it unfunded on 5 December and the order ends with it, said once; Citi charges off its two $5 months on 31 December and ends the $20 order from it; to April nothing more posts to either, no statement, no alert, no order, across a reload', () => {
    let sim = ada('rb-closed-stops', 'modest');
    passport(sim);
    const citi = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId]!;
    const capone = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId]!;
    const savings = byName(sim, 'Chase Savings');
    const order = ok<{ id: string }>(sim, 'bank.add_standing_order', { toId: savings.id, amount: 50_00, day: 15 });
    ok(sim, 'bank.set_order_source', { orderId: order.id, accountId: capone.id });
    const fromCiti = ok<{ id: string }>(sim, 'bank.add_standing_order', { toId: savings.id, amount: 20_00, day: 20 });
    ok(sim, 'bank.set_order_source', { orderId: fromCiti.id, accountId: citi.id });
    // Capital One closes an account not funded in 60 days of opening (its disclosure of 20 May 2026).
    sim.advanceTo(capone.fundBy! + 2 * MS_DAY);
    expect(capone.closedAt).toBeDefined();
    const closedBy = titled(sim, 'Capital One Closed 360 Checking');
    expect(closedBy.map((n) => n.body)).toEqual(['The bank closed it because no money was paid into it within 60 days of opening. Its standing order of $50.00 into Chase Savings on the 15th stopped when it closed. You can set up a new one from another account under How You Pay, on the Payments And Cash tab.']);
    expect(paymentsOf(sim.player).standingOrders.map((o) => o.id)).toEqual([fromCiti.id]);
    // Citi's $5 a month, for an owner of 24 with no direct deposit, on 31 October and 30 November, takes it to −$10, and
    // sixty days below zero, from 1 November, close it on 31 December.
    sim = reload(sim);
    sim.advanceTo(at(2027, 1, 2, 12));
    const citiNow = sim.universe.accounts[citi.id]!;
    expect(citiNow.closedAt).toBeDefined();
    expect(postedTo(sim, 'Charged off by Citi', citi.id)).toEqual([10_00]);
    expect(titled(sim, 'Citi Closed Your Account').map((n) => n.body)).toEqual(['It was overdrawn for 60 days. $10.00 it couldn’t recover went to collections and onto your credit record. You can pay it on Money, under Borrowing. Your money is at Chase now. Its standing order of $20.00 into Chase Savings on the 20th stopped when it closed. You can set up a new one from another account under How You Pay, on the Payments And Cash tab.']);
    expect(paymentsOf(sim.player).standingOrders).toEqual([]);
    const quiet = Math.max(citiNow.closedAt!, sim.universe.accounts[capone.id]!.closedAt!) + 1;
    sim.advanceTo(at(2027, 4, 2, 12));
    for (const id of [citi.id, capone.id]) {
      expect(touched(sim, id, quiet)).toEqual([]);
      expect(sim.universe.accounts[id]!.balance).toBe(0);
    }
    const after = sim.universe.notifications.filter((n) => (n.at ?? 0) > quiet);
    expect(after.filter((n) => /Citi Access Checking|360 Checking/.test(`${n.title} ${n.body}`))).toEqual([]);
    // Before the close it failed on 15 October and 15 November, the account empty, and said so (the same words unread are
    // brought up to the later day, not said twice); after it, never.
    expect(titled(sim, 'A Standing Order Didn’t Go').map((n) => [n.at, n.body])).toEqual([
      [at(2026, 11, 15, 9), 'Your $50.00 standing order to Chase Savings didn’t go through. There wasn’t enough available in 360 Checking that day. Move money into it before the order’s next date.'],
      [at(2026, 12, 20, 9), 'Your $20.00 standing order to Chase Savings didn’t go through. There wasn’t enough available in Citi Access Checking that day. Move money into it before the order’s next date.'],
    ]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// banking.2: a term's interest taken before 2026-10-15, in a save an older build wrote
// ---------------------------------------------------------------------------

/**
 * TEST SETUP: the save as a build before 2026-10-15's second recheck wrote it. That build's Take Interest posted the
 * primary's net, the Interest line's gross and any tax, and nothing against the term (git show
 * a4d05745^:src/engine/systems/accountlife.ts, `bank.take_term_interest`), and it kept no `opened`.
 */
function asOlderBuild(sim: Simulation): Record<string, unknown> {
  const older = JSON.parse(serialise(sim.universe)) as { opened?: string[]; transactions: LedgerTransaction[]; accounts: Record<string, Account> };
  const terms = new Set(Object.values(older.accounts).filter((a) => a.category === 'term').map((a) => a.id));
  for (const t of older.transactions) if (t.category === 'interest' && t.memo.startsWith('Interest: ')) t.postings = t.postings.filter((q) => !(q.amount === 0 && terms.has(q.accountId)));
  // From later on 2026-10-16 a third step is named beside these, the judge area's `cutIntoUnits` (src/engine/index.ts).
  // From brief 10 that day a fourth, the Arion area's `cardYears`, and a fifth, the stamina area's `timeTheCalls`: until then each list below ended at `cutIntoUnits`.
  // From later still a sixth, `briefsMastered`, for the genre row's Mastered: until then each ended at `timeTheCalls`.
  // From 2026-10-17 a seventh, `writtenUnplayed` (brief 13's journeys): until then each ended at `briefsMastered`.
  expect(older.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed']);
  delete older.opened;
  return older as unknown as Record<string, unknown>;
}

describe('banking.2: a term’s interest taken before 2026-10-15 is found in an older save', () => {
  it('OLDER SAVE (TEST SETUP), Berlin: a Deutsche Bank FestzinsSparen of €10,000 at 2.30% opened on 5 January, its €3.15 and €1.89 taken on the 10th and 13th with the year’s allowance used, canceled on the 15th: both go back with their tax, €3.71 out of the AktivKonto and €5.04 off the year’s interest, once', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-older-term');
    const giro = primary(sim);
    // TEST SETUP: €1,000 of interest in January, the whole Sparer-Pauschbetrag, so each take is taxed at 25% and 5.5% on
    // that, 26.375%.
    sim.post({ memo: 'TEST SETUP: interest earlier in the year', category: 'interest', postings: [{ accountId: giro.id, amount: 1_000_00 }, { accountId: sim.nominalAccount('income', 'Interest').id, amount: -1_000_00 }] });
    setTo(sim, giro, 20_000_00); // TEST SETUP: the deposit, and the fortnight's spending beside it.
    const term = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    expect([term.name, term.fixedRate, term.balance]).toEqual(['FestzinsSparen', 0.023, 10_000_00]);
    // €10,000 at 2.30% builds 1,000,000 × 0.023 / 365 = 63.0137¢ a day's end. Five, 6 to 10 January: 315.07¢, €3.15,
    // taxed round(315 × 0.26375) = 83¢, €2.32 paid. Three more, 11 to 13 January: 0.07 + 189.04 = 189.11¢, €1.89, taxed
    // round(189 × 0.26375) = 50¢, €1.39 paid.
    sim.advanceTo(berlin(2026, 1, 10, 12));
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: term.id })).toEqual({ paid: 2_32 });
    sim.advanceTo(berlin(2026, 1, 13, 12));
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: term.id })).toEqual({ paid: 1_39 });
    sim.advanceTo(berlin(2026, 1, 15, 12));
    const written = asOlderBuild(sim) as { transactions: LedgerTransaction[]; accounts: Record<string, Account> };
    const balances = Object.fromEntries(Object.values(written.accounts).map((a) => [a.id, a.balance]));
    const count = written.transactions.length;
    const older = loadSave(written as never);
    expect(older.universe.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed']);
    // Opening it posts nothing and changes no balance or transaction: the step only finds.
    expect(older.universe.transactions).toHaveLength(count);
    expect(Object.fromEntries(Object.values(older.universe.accounts).filter((a) => a.id in balances).map((a) => [a.id, a.balance]))).toEqual(balances);
    expect(older.universe.transactions.filter((x) => x.memo === 'Interest: FestzinsSparen').map((x) => x.postings.length)).toEqual([3, 3]);
    const t = older.universe.accounts[term.id]!;
    const takes = older.universe.transactions.filter((x) => x.memo === 'Interest: FestzinsSparen');
    expect(takes).toHaveLength(2);
    expect(t.untaggedTakes).toEqual(takes.map((x) => x.id));
    const g = older.universe.accounts[giro.id]!;
    const interestBefore = yearOf(older.player, 2026).interest ?? 0;
    const giroBefore = g.balance;
    ok(older, 'bank.cancel_new', { accountId: term.id });
    const income = line(older, 'income', 'Interest').id;
    const tax = line(older, 'expense', 'Tax On Interest').id;
    expect(postedTo(older, 'Interest returned: FestzinsSparen, canceled', giro.id)).toEqual([-2_32, -1_39]);
    expect(postedTo(older, 'Interest returned: FestzinsSparen, canceled', income)).toEqual([3_15, 1_89]);
    expect(postedTo(older, 'Interest returned: FestzinsSparen, canceled', tax)).toEqual([-83, -50]);
    expect((yearOf(older.player, 2026).interest ?? 0) - interestBefore).toBe(-5_04);
    // The deposit whole, into the AktivKonto at its own bank, less the €3.71 going back.
    expect(g.balance - giroBefore).toBe(10_000_00 - 3_71);
    expect([t.closedAt, t.balance]).toEqual([older.now, 0]);
    // Once: canceled again, refused; reloaded, the same postings, nothing found or returned again.
    expect(refusal(older, 'bank.cancel_new', { accountId: term.id })).toBe('That isn’t one of your accounts.');
    const again = reload(older);
    expect(again.universe.transactions.filter((x) => x.memo === 'Interest returned: FestzinsSparen, canceled')).toHaveLength(2);
    expect(breaches(again.universe)).toEqual([]);
  }, 60_000);

  it('OLDER SAVE (TEST SETUP), Berlin: the AktivKonto spent to €3.70 since, canceling is refused for the €3.71 going back out of it, “Pay in €0.01 first”, as a term this build tagged is', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-older-refused');
    const giro = primary(sim);
    sim.post({ memo: 'TEST SETUP: interest earlier in the year', category: 'interest', postings: [{ accountId: giro.id, amount: 1_000_00 }, { accountId: sim.nominalAccount('income', 'Interest').id, amount: -1_000_00 }] });
    setTo(sim, giro, 20_000_00); // TEST SETUP
    const term = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    sim.advanceTo(berlin(2026, 1, 10, 12));
    ok(sim, 'bank.take_term_interest', { accountId: term.id });
    sim.advanceTo(berlin(2026, 1, 13, 12));
    ok(sim, 'bank.take_term_interest', { accountId: term.id });
    const older = loadSave(asOlderBuild(sim) as never);
    setTo(older, older.universe.accounts[giro.id]!, 3_70); // TEST SETUP: spent since.
    expect(refusal(older, 'bank.cancel_new', { accountId: term.id })).toBe('Canceling takes back the €3.71 of interest it paid into AktivKonto, which holds less than that. Move €0.01 into AktivKonto first.');
    expect(older.universe.accounts[term.id]!.closedAt).toBeUndefined();
  }, 60_000);

  it('OLDER SAVE (TEST SETUP), Berlin: two FestzinsSparen of €10,000, the older opened 5 January and taken on the 10th, the newer opened the 8th and taken on the 13th, each €3.15 under the same name: each is found to its own term, the newer canceled gives back the €3.15 it paid and no more, then the older its own', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-older-twins');
    const giro = primary(sim);
    setTo(sim, giro, 30_000_00); // TEST SETUP: two deposits, and the days' spending beside them.
    const olderTerm = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    sim.advanceTo(berlin(2026, 1, 8, 9));
    const newerTerm = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    // Each has five day ends behind its take, 6 to 10 January and 9 to 13 January: 315.07¢, €3.15, under the allowance.
    sim.advanceTo(berlin(2026, 1, 10, 12));
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: olderTerm.id })).toEqual({ paid: 3_15 });
    sim.advanceTo(berlin(2026, 1, 13, 12));
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: newerTerm.id })).toEqual({ paid: 3_15 });
    sim.advanceTo(berlin(2026, 1, 15, 12));
    const older = loadSave(asOlderBuild(sim) as never);
    const [first, second] = older.universe.transactions.filter((x) => x.memo === 'Interest: FestzinsSparen');
    expect([first!.at, second!.at]).toEqual([berlin(2026, 1, 10, 12), berlin(2026, 1, 13, 12)]);
    expect(older.universe.accounts[olderTerm.id]!.untaggedTakes).toEqual([first!.id]);
    expect(older.universe.accounts[newerTerm.id]!.untaggedTakes).toEqual([second!.id]);
    const interestBefore = yearOf(older.player, 2026).interest ?? 0;
    ok(older, 'bank.cancel_new', { accountId: newerTerm.id });
    expect(postedTo(older, 'Interest returned: FestzinsSparen, canceled', giro.id)).toEqual([-3_15]);
    expect((yearOf(older.player, 2026).interest ?? 0) - interestBefore).toBe(-3_15);
    expect(older.universe.accounts[olderTerm.id]!.closedAt).toBeUndefined();
    ok(older, 'bank.cancel_new', { accountId: olderTerm.id });
    expect(postedTo(older, 'Interest returned: FestzinsSparen, canceled', giro.id)).toEqual([-3_15, -3_15]);
    expect((yearOf(older.player, 2026).interest ?? 0) - interestBefore).toBe(-6_30);
    expect(breaches(older.universe)).toEqual([]);
  }, 60_000);

  it('OLDER SAVE (TEST SETUP), Berlin: two FestzinsSparen opened together and taken together on 10 January, €3.15 each: each term is given one of the two, never both the same', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-older-together');
    const giro = primary(sim);
    setTo(sim, giro, 30_000_00); // TEST SETUP
    const a = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    const b = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    sim.advanceTo(berlin(2026, 1, 10, 12));
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: a.id })).toEqual({ paid: 3_15 });
    expect(ok<{ paid: number }>(sim, 'bank.take_term_interest', { accountId: b.id })).toEqual({ paid: 3_15 });
    const older = loadSave(asOlderBuild(sim) as never);
    const [first, second] = older.universe.transactions.filter((x) => x.memo === 'Interest: FestzinsSparen');
    expect(older.universe.accounts[a.id]!.untaggedTakes).toEqual([first!.id]);
    expect(older.universe.accounts[b.id]!.untaggedTakes).toEqual([second!.id]);
    ok(older, 'bank.cancel_new', { accountId: a.id });
    ok(older, 'bank.cancel_new', { accountId: b.id });
    expect(postedTo(older, 'Interest returned: FestzinsSparen, canceled', giro.id)).toEqual([-3_15, -3_15]);
    expect(breaches(older.universe)).toEqual([]);
  }, 60_000);

  it('OLDER SAVE (TEST SETUP), Berlin: a term whose records the replay can’t reproduce (its interest built set a cent off) has nothing found, and canceling it leaves the interest paid, as the build that paid it did', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-older-nofit');
    const giro = primary(sim);
    setTo(sim, giro, 10_000_00); // TEST SETUP
    const term = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    sim.advanceTo(berlin(2026, 1, 10, 12));
    ok(sim, 'bank.take_term_interest', { accountId: term.id });
    const written = asOlderBuild(sim) as { accounts: Record<string, Account> };
    written.accounts[term.id]!.accrued = (written.accounts[term.id]!.accrued ?? 0) + 1; // TEST SETUP
    const older = loadSave(written as never);
    expect(older.universe.accounts[term.id]!.untaggedTakes).toBeUndefined();
    const interestBefore = yearOf(older.player, 2026).interest ?? 0;
    ok(older, 'bank.cancel_new', { accountId: term.id });
    expect(older.universe.transactions.filter((x) => x.memo.startsWith('Interest returned'))).toEqual([]);
    expect(yearOf(older.player, 2026).interest ?? 0).toBe(interestBefore);
    expect(breaches(older.universe)).toEqual([]);
  }, 60_000);

  it('the four saves older builds wrote (2026-10-10 and 2026-10-11, tests/fixtures), migrated and opened as a slot opens them, take the step once and name it; New Haven lives, they hold no term deposit, so nothing is found', () => {
    for (const name of ['old-tax-plan-ff837dfa', 'old-leave-ff837dfa', 'old-nonfiler-086d00ca', 'old-state-plan-086d00ca']) {
      const u = deserialise(gunzipSync(readFileSync(`tests/fixtures/${name}.json.gz`)).toString('utf8'));
      expect(u.opened, name).toBeUndefined();
      migrate(u);
      const sim = loadSave(u as never);
      expect(sim.universe.opened, name).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed']);
      expect(Object.values(sim.universe.accounts).filter((a) => a.category === 'term'), name).toEqual([]);
      expect(Object.values(sim.universe.accounts).filter((a) => a.untaggedTakes !== undefined), name).toEqual([]);
      expect(reload(sim).universe.opened, name).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed']);
    }
  }, 120_000);

  it('a save this build began names the step and finds nothing: a take is tagged, and opening it, once or twice, adds no record', () => {
    const sim = inBerlin('de-deutsche-bank', 'rb-current-term');
    setTo(sim, primary(sim), 10_000_00); // TEST SETUP
    const term = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'de-deutsche-bank' }).accountId]!;
    sim.advanceTo(berlin(2026, 1, 10, 12));
    ok(sim, 'bank.take_term_interest', { accountId: term.id });
    expect(sim.universe.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed']);
    const once = reload(sim);
    const twice = reload(once);
    for (const s of [once, twice]) {
      expect(s.universe.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed']);
      expect(s.universe.accounts[term.id]!.untaggedTakes).toBeUndefined();
    }
  }, 60_000);
});

// ---------------------------------------------------------------------------
// banking.s7.school: a payment to Yale
// ---------------------------------------------------------------------------

describe('banking.s7.school: a payment to Yale comes from the current account and the savings beside it', () => {
  it('PLAYER JOURNEY: a Comfortable student owing $20,000.00 on her Yale account (TEST SETUP, as a seventh term bills it) pays it from $19,565.00 in Chase Total Checking and $435.00 of Chase Savings; owing $70,000.00 more she is told the $45,217.00 left in savings is what the bank can pay, and what to do, pays that, and a reload changes nothing', () => {
    // TEST SETUP: a charge on the Yale account, as a term past the sixth makes one (`billUnsupportedTerm`), which a played
    // life reaches only after three years (tests/scope-school.test.ts plays a repeated year to its bill).
    const charge = (s: Simulation, amount: number) => s.post({ memo: 'TEST SETUP: a term billed', category: 'school', postings: [{ accountId: s.nominalAccount('expense', 'School').id, amount }, { accountId: yaleAccount(s, s.player)!.id, amount: -amount }] });
    let sim = ada('rb-yale-pay', 'comfortable');
    const checking = primary(sim);
    const savings = byName(sim, 'Chase Savings');
    expect([checking.balance, savings.balance, sim.player.payments?.linkSavings]).toEqual([19_565_00, 45_652_00, false]);
    charge(sim, 20_000_00);
    expect(ok<{ owed: number }>(sim, 'school.pay_balance', {})).toEqual({ owed: 0, held: false });
    expect([checking.balance, savings.balance]).toEqual([0, 45_652_00 - 435_00]);
    expect(accountOwed(sim, sim.player)).toBe(0);
    // $45,217.00 left in savings and nothing in checking: $70,000.00 owed is more.
    charge(sim, 70_000_00);
    expect(refusal(sim, 'school.pay_balance', {})).toBe('Your current account and the savings beside it can cover only $45,217.00 of it now. Pay that or less, or move money into your current account first.');
    expect(accountOwed(sim, sim.player)).toBe(70_000_00);
    expect(ok<{ owed: number }>(sim, 'school.pay_balance', { amount: 45_217_00 })).toEqual({ owed: 24_783_00, held: false });
    expect(savings.balance).toBe(0);
    expect(refusal(sim, 'school.pay_balance', { amount: 1_00 })).toBe('Your current account and the savings beside it can’t cover any of it. Move money into your current account first.');
    sim = reload(sim);
    expect(accountOwed(sim, sim.player)).toBe(24_783_00);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Payment: Yale Student Account').map((t) => t.postings.find((q) => q.accountId === yaleAccount(sim, sim.player)!.id)!.amount)).toEqual([20_000_00, 45_217_00]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 60_000);

  it('PLAYER JOURNEY: a Comfortable student on a personal leave from 20 January 2027, her Chase Total Checking down to $100.00 (TEST SETUP), buys Affiliate cover, $8,950.00, from it and Chase Savings beside it', () => {
    const sim = ada('rb-yale-affiliate', 'comfortable');
    // TEST SETUP: played by somebody who looks after themselves, the dials set each six hours, as tests/leave.test.ts does.
    const tended = (until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
    tended(at(2027, 1, 12, 12));
    const asked = ok<{ decideAt: number }>(sim, 'school.request_leave', { kind: 'personal', reason: 'family' });
    tended(asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    const checking = primary(sim);
    const savings = byName(sim, 'Chase Savings');
    setTo(sim, checking, 100_00); // TEST SETUP
    const before = savings.balance;
    // Two terms at $5,416, less the spring's $1,882 student fee paid (tests/evidence-g25-school.test.ts works it).
    expect(ok<{ cost: number }>(sim, 'school.buy_affiliate', { confirm: true }).cost).toBe(8_950_00);
    expect([checking.balance, before - savings.balance]).toEqual([0, 8_850_00]);
    expect(sim.player.school!.leave!.affiliate).toMatchObject({ by: 'self', cost: 8_950_00 });
    expect(breaches(sim.universe)).toEqual([]);
  }, 180_000);
});

// ---------------------------------------------------------------------------
// banking.s7: opening, money between banks, and one press
// ---------------------------------------------------------------------------

describe('banking.s7: what a New Haven student meets opening and moving money', () => {
  it('PLAYER JOURNEY: the panel that opens an account at another bank says Citi Access Checking’s $5.00 a month and how Citi waives it before Apply, and that Capital One’s 360 Checking has none', () => {
    const sim = ada('rb-open-fee', 'modest');
    passport(sim);
    drawn(sim, createElement(BankMoves));
    type('open-at', 'us-citi');
    const citi = drawn(sim, createElement(BankMoves));
    expect(citi).toContain('Its Citi Access Checking costs $5.00 a month, waived in any month you have $250.00 of electronic deposits (wages, benefits or a tax refund) paid in, or while you’re under 24.');
    type('open-at', 'us-capital-one');
    expect(drawn(sim, createElement(BankMoves))).toContain('Its 360 Checking has no monthly fee.');
  });

  it('PLAYER JOURNEY: $100 moved from Chase to a Citi account on Monday 5 October leaves Chase at once and is in neither account until it lands on Thursday 8 October, three business days on; Citi refuses to send it back meanwhile; reloaded in between, it lands once', () => {
    let sim = ada('rb-transit', 'modest');
    passport(sim);
    const chase = primary(sim);
    const citi = sim.universe.accounts[ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId]!;
    sim.advanceTo(at(2026, 10, 5, 14));
    const before = chase.balance;
    // Chase sends to another bank in 3 business days: Tuesday, Wednesday, Thursday 8 October.
    const sent = ok<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: chase.id, toId: citi.id, amount: 100_00 });
    expect(sent.arrivesAt).toBe(at(2026, 10, 8, 14));
    expect([chase.balance - before, citi.balance, inTransitOf(sim, sim.player).balance]).toEqual([-100_00, 0, 100_00]);
    expect(refusal(sim, 'bank.transfer', { fromId: citi.id, toId: chase.id, amount: 50_00 })).toBe('Citi Access Checking has nothing available, so nothing was moved.');
    sim = reload(sim);
    sim.advanceTo(sent.arrivesAt + MS_HOUR);
    expect([sim.universe.accounts[citi.id]!.balance, inTransitOf(sim, sim.player).balance]).toEqual([100_00, 0]);
    expect(postedTo(sim, 'From Chase Total Checking', citi.id)).toEqual([100_00]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('PLAYER JOURNEY: Move Money with $25 typed, pressed once, moves $25 to Chase Savings, clears the field and grays Move It, so the press can’t be made again with the same amount', () => {
    const sim = ada('rb-one-press', 'modest');
    const chase = primary(sim);
    const savings = byName(sim, 'Chase Savings');
    drawn(sim, createElement(BankWorkspace));
    type('move-from', chase.id);
    type('move-to', savings.id);
    type('move-amount', '25');
    drawn(sim, createElement(BankWorkspace));
    const before = savings.balance;
    press('Move It');
    expect(h.answers.filter((a) => a.kind === 'bank.transfer')).toEqual([{ kind: 'bank.transfer', ok: true, error: undefined }]);
    expect(savings.balance - before).toBe(25_00);
    // The message names where it went (from brief 15, 2026-10-19: until then “Moved $25.”).
    expect(h.toasts).toEqual(['Moved $25 to Chase Savings.']);
    drawn(sim, createElement(BankWorkspace));
    const move = h.buttons.filter((b) => b.text === 'Move It');
    expect(move.map((b) => b.disabled)).toEqual([true]);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Moved to Chase Savings')).toHaveLength(1);
  });
});
