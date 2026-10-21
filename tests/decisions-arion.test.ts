/**
 * Arion's debit-card year, brief 10's section 3 (2026-10-16, "Arion: Resolve The Unknown Without Inventing A Fact"), to
 * the criteria AR0 to AR8 (docs/verification/decisions-2026-10-16/criteria.md, section 3). The checklist each was worked
 * from, written before any code changed, is docs/verification/remaining-10/arion-checklist.json, and what came of each,
 * with the research record, is arion-result.json beside it.
 *
 * What's confirmed, and what these tests take as given: Arion's 950 kr a year from 24 and nothing at 23 and under (its
 * price list and payment-account fee sheet, from 7 May 2026), paid by the account holder from the account (its general
 * terms 18.7.1.15, ch. 5), and what a close owes whatever the timing: Iceland's Act on Payment Services no. 114/2021 art.
 * 57(4) refunds a fee paid ahead in proportion and owes a regular one collected after only in proportion (Stjórnartíðindi
 * A, 15 July 2021). What isn't: whether the year is paid ahead or behind, and its day. SLATE's simulation, unverified,
 * `ARION_CARD_YEAR` (content/banks-thirteen.ts): paid ahead, on the account's first night in the life and the same date
 * each year after, in Reykjavík's calendar; a close gives the days of that card year left back, the fee × the days left
 * after the closing day ÷ the year's days, rounded half up to the whole króna once. These tests verify the lifecycle
 * against that rule as specified; they don't verify Arion's real timing, which stays open.
 *
 * Every figure is worked here by hand and written as a literal. A card year from 25 August 2026 is 365 days, and from 25
 * August 2027 366, holding 29 February 2028. Dollars are SLATE's rate, 138 kr to the dollar (content/currency.ts),
 * rounded to the cent: 950 kr is 95,000 / 138 = 688.4, $6.88.
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeFrom`), Ada Cole, raised in Reykjavík
 * from June 2010 and keeping her account at Arion (Before Yale), its Veltureikningur and Vöxtur, banking at Chase in New
 * Haven, at Yale from Monday 24 August 2026, the scraping family's. Your Banks and Your Accounts are the game's own screens,
 * rendered with react-dom/server, their buttons pressed through their own handlers. FIXTURES: quickSave lives in
 * Mosfellsbær, where an Arion account opened in the life is needed, which no played life opens; and the setting's other
 * value, `paid: 'behind'`, put in place for a test and taken back after it (TEST SETUP). OLDER SAVES are written as a build
 * before brief 10 wrote them (TEST SETUP). Seeds are arbitrary: ar10-*.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createSave, loadPlacesFor, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { addCountryHolidays } from '@/engine/content/holidays';
import { breaches } from '@/engine/core/invariants';
import { settleFees } from '@/engine/systems/banking';
import { BANKING, bankById } from '@/engine/content/banks';
import { ARION_CARD_YEAR } from '@/engine/content/banks-thirteen';
import { GUIDE_BY_ID } from '@/engine/content/guide';

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
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');

for (const country of ['us', 'is']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the ledger
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const REYKJAVIK = 'Atlantic/Reykjavik';
const at = (year: number, month: number, day: number, hour = 9, minute = 0, zone = NY) => instantFromZoned({ year, month, day, hour, minute }, zone);
const rvk = (year: number, month: number, day: number, hour = 12, minute = 0) => at(year, month, day, hour, minute, REYKJAVIK);

/** Ada Cole raised in Reykjavík, keeping her account at Arion, born in the year given. */
async function keeping(seed: string, birthYear: number): Promise<Simulation> {
  const sim = createSave(1, seed, newLifeFrom({
    homeRegionId: 'is-39-reykjavik', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'scraping', bankId: 'us-chase', birthYear,
    priorResidence: { cityId: 'is-39-reykjavik', fromYear: 2010, fromMonth: 6 }, homeBankId: 'is-arion',
  } as Partial<NewSaveConfig>));
  await loadPlacesFor(sim.universe);
  return sim;
}
/** FIXTURE: a quick-save life in Mosfellsbær, its account at the bank given, from the day given. */
const inIceland = (bankId: string, seed: string, start?: { startYear: number; startMonth: number; startDay: number }): Simulation =>
  quickSave({ startLocationId: 'is-39-mosfellsbr', homeRegionId: 'is-39-mosfellsbr', livesWhereBorn: true, wealth: 'comfortable', bankId, birthYear: 1990, ...start }, seed);
const mine = (sim: Simulation): Account[] => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
const veltu = (sim: Simulation): Account => mine(sim).find((a) => a.bankId === 'is-arion' && a.kind === 'checking')!;
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const freeze = (sim: Simulation): string => serialise(sim.universe);
const thaw = (snap: string): Simulation => loadSave(deserialise(snap) as never);
const reload = (sim: Simulation): Simulation => thaw(freeze(sim));
/** Each posting with this memo on one account: when, in the save's money and its own. */
const dated = (sim: Simulation, memo: string, id: string) => sim.universe.transactions.filter((t) => t.memo === memo).flatMap((t) => t.postings.filter((p) => p.accountId === id).map((p) => [t.at, p.amount, p.native]));
/** Every transaction on an account from a moment, as memo, save money and own money. */
const onAccount = (sim: Simulation, id: string, from: number) => sim.universe.transactions.filter((t) => t.at >= from && t.postings.some((p) => p.accountId === id))
  .map((t) => [t.at, t.memo, t.postings.map((p) => [p.accountId, p.amount, p.native])]);
/** Every card-year posting on an account: its memo, and the account's side in the save's money and its own. */
const cardPosts = (sim: Simulation, id: string) => sim.universe.transactions.filter((t) => t.memo.startsWith('Debit card yearly fee') && t.postings.some((p) => p.accountId === id))
  .map((t) => [t.at, t.memo, ...t.postings.filter((p) => p.accountId === id).map((p) => [p.amount, p.native])[0]!]);
/** That each card-year posting is the account against Bank Fees, the two summing to nothing. */
function balancedAgainstBankFees(sim: Simulation, id: string): void {
  for (const t of sim.universe.transactions.filter((x) => x.memo.startsWith('Debit card yearly fee') && x.postings.some((p) => p.accountId === id))) {
    expect(t.postings.reduce((n, q) => n + q.amount, 0), t.memo).toBe(0);
    expect(t.postings.map((q) => sim.universe.accounts[q.accountId]!.name), t.memo).toEqual([sim.universe.accounts[id]!.name, 'Bank Fees']);
  }
}

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
/** TEST SETUP: an account's balance set by a posting against a test line, in its own money too. */
function setTo(sim: Simulation, account: Account, to: number, held: number): void {
  const by = to - account.balance;
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: by, native: held - (account.held ?? 0) }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
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

beforeEach(() => {
  h.given = new Map();
  h.answers = [];
  h.toasts = [];
});
// TEST SETUP: a test that puts the setting's other value in place takes it back here, whatever happened in it.
afterEach(() => { ARION_CARD_YEAR.paid = 'ahead'; });

/** Vöxtur, Arion's savings beside the Veltureikningur, closed, so Close It can close the current account. */
function closeVoxtur(sim: Simulation): void {
  const saver = mine(sim).find((a) => a.bankId === 'is-arion' && a.kind === 'savings' && !a.closedAt);
  if (saver) ok(sim, 'bank.close_savings', { accountId: saver.id });
  expect(mine(sim).filter((a) => a.bankId === 'is-arion' && a.kind === 'savings' && !a.closedAt)).toEqual([]);
}
/** Close It on the Veltureikningur, into Chase, by the command Your Banks sends. */
const closeVeltu = (sim: Simulation) => sim.execute({ kind: 'bank.close_current', payload: { accountId: veltu(sim).id, remainderTo: sim.player.primaryAccountId } });

const LABEL = 'The timing is estimated: Arion’s price list and terms don’t say when in the year it’s charged.';
const LAW_AHEAD = 'Under Iceland’s Act on Payment Services, art. 57, a fee paid in advance is refunded in proportion when the account closes.';

// ---------------------------------------------------------------------------
// AR1 and AR0: the first charge, and the words
// ---------------------------------------------------------------------------

describe('arion.AR1: Arion’s debit card, its first year charged on the first night', () => {
  it('PLAYER JOURNEY: a Reykjavík-raised student of 26 keeping Arion is charged 950 kr exactly at midnight in New Haven on 25 August 2026, 04:00 in Reykjavík, $6.88 at SLATE’s rate; her account’s panel says the 950 kr from 24 as Arion’s and when it’s charged as SLATE’s simulation, unverified; one of 20 is charged nothing, her year begun with nothing paid', async () => {
    const sim = await keeping('ar10-first', 2000);
    const arion = veltu(sim);
    const before = arion.held!;
    sim.advanceTo(at(2026, 8, 25, 9));
    // 00:00 in New Haven (EDT) is 04:00 UTC, and Reykjavík keeps UTC all year.
    expect(at(2026, 8, 25, 0)).toBe(rvk(2026, 8, 25, 4));
    expect(cardPosts(sim, arion.id)).toEqual([[at(2026, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00]]);
    expect(arion.held).toBe(before - 950_00);
    expect([arion.cardFeeAt, arion.cardFeePaid, arion.cardYearRule]).toEqual([at(2026, 8, 25, 0), 950_00, 'ahead']);
    balancedAgainstBankFees(sim, arion.id);
    // Its panel: the confirmed amount and age apart, then the card year, the close, a short account, and the label.
    expect(drawn(sim, createElement(BankWorkspace))).toContain(`Its debit card costs 950 kr a year from age 24, and nothing at 23 and under. The current card year runs from August 25, 2026 to August 24, 2027, and you paid 950 kr for it in advance. The next year’s fee is charged on August 25, 2027. Closing the account refunds the days left in the year. The bank counts the card year’s days by the date in Reykjavík. If the account can’t cover the fee, the bank charges it anyway and the account goes overdrawn by the difference. ${LABEL}`);
    expect(breaches(sim.universe)).toEqual([]);
    const young = await keeping('ar10-young', 2006);
    young.advanceTo(at(2026, 8, 25, 9));
    const hers = veltu(young);
    expect(cardPosts(young, hers.id)).toEqual([]);
    expect([hers.cardFeeAt, hers.cardFeePaid, hers.cardYearRule]).toEqual([at(2026, 8, 25, 0), 0, 'ahead']);
    expect(drawn(young, createElement(BankWorkspace))).toContain('The current card year runs from August 25, 2026 to August 24, 2027, and nothing was charged for it. The next year’s fee is charged on August 25, 2027.');
  }, 300_000);

  it('FIXTURE, Mosfellsbær: an Arion account a life opens is charged its first night, 6 January 2026, and renewed on 6 January 2027, where until brief 10 it waited a year for its first', () => {
    const sim = inIceland('is-arion', 'ar10-opened');
    const account = primary(sim);
    expect([account.name, sim.universe.meta.currency, sim.homeZone]).toEqual(['Veltureikningur', 'ISK', REYKJAVIK]);
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: 20_000_000_00 }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -20_000_000_00 }] });
    sim.advanceTo(rvk(2027, 1, 7));
    // A save kept in krónur: the posting's figure is the krónur, with no second one.
    expect(dated(sim, 'Debit card yearly fee', account.id)).toEqual([[rvk(2026, 1, 6, 0), -950_00, undefined], [rvk(2027, 1, 6, 0), -950_00, undefined]]);
  }, 300_000);

  it('GUARD: every bank with a yearly card fee says how its card year runs (`Bank.card.year`): Arion’s as SLATE’s simulation, and Berliner Sparkasse’s from its price list, unchanged', () => {
    const yearly = BANKING.flatMap((c) => c.banks).filter((b) => b.card?.yearly !== undefined);
    expect(yearly.map((b) => [b.id, b.card!.year])).toEqual([
      ['is-arion', { paid: 'ahead', length: 'anniversary', zone: REYKJAVIK, place: 'Reykjavík', simulated: 'Arion’s price list and terms don’t say when in the year it’s charged', law: 'Iceland’s Act on Payment Services, art. 57' }],
      ['de-berliner-sparkasse', { paid: 'ahead', length: 365 }],
    ]);
    expect(bankById('is-arion')!.card!.year).toBe(ARION_CARD_YEAR);
  });

  it('the guide’s A Bank At Home says Arion’s 950 kr from 24 as its price list’s, and the year paid ahead as SLATE’s simulation, unverified', () => {
    // Two lines from 2026-10-20 (brief 16): the charge with its estimate, then the close. Until then one line of five
    // sentences, the close between the charge and the estimate.
    expect(GUIDE_BY_ID['bank.home-account']!.later).toContain(`Arion’s debit card costs 950 kr a year from age 24, and nothing at 23 and under, as its price list says. It’s charged in advance, on the first night and on that date each year after, by Reykjavík’s calendar. ${LABEL}`);
    expect(GUIDE_BY_ID['bank.home-account']!.later).toContain('If you close an Arion account, the days of its card year left are refunded in proportion, as Iceland’s Act on Payment Services, art. 57, has it. The account’s panel and the line under Close It say so first.');
  });
});

// ---------------------------------------------------------------------------
// AR3, AR4 and AR6: a close, its refund, and nothing twice
// ---------------------------------------------------------------------------

describe('arion.AR3: a close gives back the card year’s days left', () => {
  it('PLAYER JOURNEY: on Wednesday 14 October 2026 Your Banks says closing the Veltureikningur refunds 817 kr ($5.92) of the card’s 950 kr, the 314 of its 365 days left, with Iceland’s Act and the label; Close It pressed posts it once against Bank Fees; a second press is refused, and a reload run past 25 August 2027 charges the closed account nothing and gives nothing back again', async () => {
    const sim = await keeping('ar10-close', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2026, 10, 14, 9));
    closeVoxtur(sim);
    sim.advanceTo(sim.now + 60_000);
    // From 25 August: 7 + 30 + 14 = 51 days used to the 14th, 314 left: 95,000 × 314 / 365 = 81,726.0, 817 kr to the
    // whole króna; 81,700 / 138 = 592.0, $5.92.
    expect(drawn(sim, createElement(BankMoves))).toContain(`Closing it now refunds 817 kr ($5.92) of the 950 kr you paid in advance for its debit card’s year: the 314 days of its 365 still to run. ${LAW_AHEAD} ${LABEL}`);
    const held = arion.held!;
    press('Close It');
    expect(h.answers.at(-1)).toMatchObject({ kind: 'bank.close_current', ok: true });
    const closedAt = sim.now;
    expect(cardPosts(sim, arion.id)).toEqual([[at(2026, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00], [closedAt, 'Debit card yearly fee refunded: Veltureikningur', 5_92, 817_00]]);
    balancedAgainstBankFees(sim, arion.id);
    // Everything that left it at the close is what it held and the refund: it holds nothing, closed, its fees ended.
    const left = sim.universe.transactions.filter((t) => t.at === closedAt).flatMap((t) => t.postings).filter((q) => q.accountId === arion.id).reduce((n, q) => n + (q.native ?? 0), 0);
    expect([left, arion.held, arion.closedAt, arion.feesEndedAt, arion.cardFeePaid]).toEqual([-held, 0, closedAt, closedAt, 0]);
    expect(refusal(sim, 'bank.close_current', { accountId: arion.id, remainderTo: primary(sim).id })).toBe('Only one of your own checking accounts can be closed here.');
    const back = reload(sim);
    back.advanceTo(at(2027, 9, 1, 9));
    expect(cardPosts(back, arion.id)).toEqual(cardPosts(sim, arion.id));
    expect(onAccount(back, arion.id, closedAt + 1)).toEqual([]);
    expect(breaches(back.universe)).toEqual([]);
  }, 300_000);

  it('GUARD: a second settling of a Veltureikningur’s fees gives nothing of the card’s year back again (FIXTURE: only a home bank’s close tried again settles twice, and Arion closes no home account)', () => {
    const sim = inIceland('is-arion', 'ar10-twice');
    const account = primary(sim);
    sim.advanceTo(rvk(2026, 3, 1));
    // From 6 January, 31 − 5 + 28 + 1 = 55 days used to 1 March, 310 left: 95,000 × 310 / 365 = 80,684.9, 807 kr.
    settleFees(sim, account);
    settleFees(sim, account);
    expect(dated(sim, 'Debit card yearly fee refunded: Veltureikningur', account.id)).toEqual([[rvk(2026, 3, 1), 807_00, undefined]]);
    expect([account.cardFeePaid, account.feesEndedAt]).toEqual([0, rvk(2026, 3, 1)]);
    // And its fees ended, no year is charged after: 6 January 2027 passes with nothing.
    sim.advanceTo(rvk(2027, 1, 7));
    expect(dated(sim, 'Debit card yearly fee', account.id)).toEqual([[rvk(2026, 1, 6, 0), -950_00, undefined]]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// AR2, AR6 and AR7: the renewal, once, and the calendar's edges
// ---------------------------------------------------------------------------

describe('arion.AR2: the card year renewed once a year, on its date in Reykjavík', () => {
  it('PLAYER JOURNEY: kept, the year is renewed at midnight in New Haven on 25 August 2027 and on 25 August 2028, not on 24 August 2028, where the 365-day year until brief 10 fell across 29 February; the same whether the clock jumps from 20 August 2028 or runs a day at a time with a reload on the 24th, and a minute at a time across the night and reloaded in it', async () => {
    const sim = await keeping('ar10-renew', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2028, 8, 20, 9));
    const snap = freeze(sim);
    const jump = thaw(snap);
    jump.advanceTo(at(2028, 9, 1, 9));
    let steps = thaw(snap);
    for (let t = at(2028, 8, 21, 9); t <= at(2028, 9, 1, 9); t += MS_DAY) {
      steps.advanceTo(t);
      if (t === at(2028, 8, 24, 9)) steps = reload(steps);
    }
    let minutes = thaw(snap);
    minutes.advanceTo(at(2028, 8, 24, 23, 57));
    for (let t = at(2028, 8, 24, 23, 58); t <= at(2028, 8, 25, 0, 3); t += 60_000) {
      minutes.advanceTo(t);
      if (t === at(2028, 8, 25, 0, 0)) minutes = reload(minutes);
    }
    minutes.advanceTo(at(2028, 9, 1, 9));
    const year = (d: number) => [d, 'Debit card yearly fee', -6_88, -950_00];
    expect(cardPosts(jump, arion.id)).toEqual([year(at(2026, 8, 25, 0)), year(at(2027, 8, 25, 0)), year(at(2028, 8, 25, 0))]);
    expect(onAccount(steps, arion.id, at(2028, 8, 20, 9))).toEqual(onAccount(jump, arion.id, at(2028, 8, 20, 9)));
    expect(onAccount(minutes, arion.id, at(2028, 8, 20, 9))).toEqual(onAccount(jump, arion.id, at(2028, 8, 20, 9)));
    // The year from 25 August 2027 held 29 February 2028: 366 days, and the next began on its date.
    expect(drawn(jump, createElement(BankWorkspace))).toContain('The current card year runs from August 25, 2028 to August 24, 2029, and you paid 950 kr for it in advance. The next year’s fee is charged on August 25, 2029.');
    balancedAgainstBankFees(jump, arion.id);
    expect(breaches(jump.universe)).toEqual([]);
  }, 600_000);

  it('PLAYER JOURNEY: closed on Tuesday 29 February 2028, the Veltureikningur refunds 459 kr of the year from 25 August 2027, which holds 29 February: 189 days used, 177 of its 366 left', async () => {
    const sim = await keeping('ar10-leap', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2028, 2, 29, 9));
    closeVoxtur(sim);
    sim.advanceTo(sim.now + 60_000);
    // 7 + 30 + 31 + 30 + 31 + 31 + 29 = 189 days used, 25 August to 29 February; 366 − 189 = 177 left:
    // 95,000 × 177 / 366 = 45,942.6, 459 kr; 45,900 / 138 = 332.6, $3.33.
    expect(drawn(sim, createElement(BankMoves))).toContain(`Closing it now refunds 459 kr ($3.33) of the 950 kr you paid in advance for its debit card’s year: the 177 days of its 366 still to run. ${LAW_AHEAD}`);
    expect(closeVeltu(sim).ok).toBe(true);
    expect(cardPosts(sim, arion.id).at(-1)).toEqual([sim.now, 'Debit card yearly fee refunded: Veltureikningur', 3_33, 459_00]);
    balancedAgainstBankFees(sim, arion.id);
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);

  it('FIXTURE, Mosfellsbær: an Arion account opened on Monday 28 February 2028 is charged on its first night, 29 February, and renewed on 28 February 2029, the month’s last day in a year without a 29th, not on 1 March', () => {
    const sim = inIceland('is-landsbankinn', 'ar10-feb29', { startYear: 2028, startMonth: 2, startDay: 28 });
    const opened = ok<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'is-arion' });
    const account = sim.universe.accounts[opened.accountId]!;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: 100_000_00 }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -100_000_00 }] });
    sim.advanceTo(rvk(2029, 3, 2));
    expect(dated(sim, 'Debit card yearly fee', account.id)).toEqual([[rvk(2028, 2, 29, 0), -950_00, undefined], [rvk(2029, 2, 28, 0), -950_00, undefined]]);
  }, 300_000);
});

describe('arion.AR7: the close’s days by Reykjavík’s calendar', () => {
  it('PLAYER JOURNEY: closed at 9 PM in New Haven on New Year’s Eve 2026, already 2 AM on 1 January 2027 in Reykjavík, the Veltureikningur refunds 612 kr, 130 days used by Reykjavík’s date, not the 614 kr New Haven’s would give; closed at 9 PM on 24 August 2027, already the year’s date in Reykjavík, it gives nothing back and is charged no new year', async () => {
    const sim = await keeping('ar10-turn', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2026, 12, 31, 20, 58));
    closeVoxtur(sim);
    sim.advanceTo(at(2026, 12, 31, 21, 0));
    expect(at(2026, 12, 31, 21, 0)).toBe(rvk(2027, 1, 1, 2, 0));
    const eve = freeze(sim);
    // 7 + 30 + 31 + 30 + 31 + 1 = 130 days used, 235 left: 95,000 × 235 / 365 = 61,164.4, 612 kr; 61,200 / 138 = 443.5,
    // $4.43. By New Haven's date, 31 December: 129 used, 236 left, 61,424.7, 614 kr.
    expect(drawn(sim, createElement(BankMoves))).toContain('Closing it now refunds 612 kr ($4.43) of the 950 kr you paid in advance for its debit card’s year: the 235 days of its 365 still to run.');
    expect(closeVeltu(sim).ok).toBe(true);
    expect(cardPosts(sim, arion.id).at(-1)).toEqual([at(2026, 12, 31, 21, 0), 'Debit card yearly fee refunded: Veltureikningur', 4_43, 612_00]);
    // Kept instead to the eve of the year's date: 9 PM in New Haven on 24 August 2027 is 1 AM on the 25th in Reykjavík,
    // the year from 25 August 2026 used up there, and New Haven's midnight, when SLATE opens the next, not yet come.
    const kept = thaw(eve);
    kept.advanceTo(at(2027, 8, 24, 21, 0));
    expect(drawn(kept, createElement(BankMoves))).not.toContain('its debit card’s');
    expect(closeVeltu(kept).ok).toBe(true);
    kept.advanceTo(at(2027, 9, 1, 9));
    expect(cardPosts(kept, arion.id)).toEqual([[at(2026, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00]]);
    expect(breaches(kept.universe)).toEqual([]);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// AR5: an account that can't cover the year
// ---------------------------------------------------------------------------

describe('arion.AR5: an account that can’t cover the year’s fee', () => {
  it('PLAYER JOURNEY: with 300 kr left on the eve of 25 August 2027 (TEST SETUP), the year’s 950 kr is taken all the same, −650 kr, as the panel says; Close It is refused while it’s below zero; with 1,000 kr paid in (TEST SETUP) it closes on 27 August and refunds 942 kr, 363 of the year’s 366 days', async () => {
    const sim = await keeping('ar10-short', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2027, 8, 24, 9));
    // 300 kr: 30,000 / 138 = 217.4, $2.17.
    setTo(sim, arion, 2_17, 300_00); // TEST SETUP
    sim.advanceTo(at(2027, 8, 25, 9));
    expect(cardPosts(sim, arion.id).at(-1)).toEqual([at(2027, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00]);
    expect([arion.held, arion.balance]).toEqual([-650_00, -4_71]);
    expect(drawn(sim, createElement(BankWorkspace))).toContain('If the account can’t cover the fee, the bank charges it anyway and the account goes overdrawn by the difference.');
    expect(refusal(sim, 'bank.close_current', { accountId: arion.id, remainderTo: primary(sim).id })).toBe('It’s overdrawn by $4.71, and the bank only closes it once that’s paid off. Move money into it first.');
    sim.advanceTo(at(2027, 8, 26, 9));
    setTo(sim, arion, arion.balance + 7_25, arion.held! + 1_000_00); // TEST SETUP: 100,000 / 138 = 724.6, $7.25.
    closeVoxtur(sim);
    sim.advanceTo(at(2027, 8, 27, 9));
    // 25 to 27 August, 3 days used, 363 left: 95,000 × 363 / 366 = 94,221.3, 942 kr; 94,200 / 138 = 682.6, $6.83.
    expect(closeVeltu(sim).ok).toBe(true);
    expect(cardPosts(sim, arion.id).at(-1)).toEqual([at(2027, 8, 27, 9), 'Debit card yearly fee refunded: Veltureikningur', 6_83, 942_00]);
    balancedAgainstBankFees(sim, arion.id);
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// AR0: the setting's other value, and a year settled by the rule it opened under
// ---------------------------------------------------------------------------

describe('arion.AR0: the setting, `ARION_CARD_YEAR.paid`, replaced by its other value', () => {
  it('FIXTURE (TEST SETUP: paid behind): the Reykjavík-raised student’s account opens with two years’ fees, 1,900 kr, nothing is charged on her first night, a close on 14 October 2026 charges 133 kr, the 51 days used of 365, said first with the Act’s rule, and kept, the year is charged at its end, 25 August 2027, once', async () => {
    ARION_CARD_YEAR.paid = 'behind'; // TEST SETUP
    const sim = await keeping('ar10-behind', 2000);
    const arion = veltu(sim);
    // To graduation in May 2029, charged at each year's end: August 2027 and August 2028.
    expect(arion.held).toBe(1_900_00);
    sim.advanceTo(at(2026, 10, 14, 9));
    expect(cardPosts(sim, arion.id)).toEqual([]);
    expect([arion.cardFeeAt, arion.cardFeePaid, arion.cardYearRule]).toEqual([at(2026, 8, 25, 0), 0, 'behind']);
    const snap = freeze(sim);
    closeVoxtur(sim);
    sim.advanceTo(sim.now + 60_000);
    // 95,000 × 51 / 365 = 13,274.0, 133 kr; 13,300 / 138 = 96.4, $0.96.
    expect(drawn(sim, createElement(BankMoves))).toContain(`Closing it now charges 133 kr ($0.96) of its debit card’s 950 kr yearly fee, which is charged at the end of the year: the 51 days of its 365 used so far. Under Iceland’s Act on Payment Services, art. 57, a regular fee is owed only in proportion to the time before the account closes. ${LABEL}`);
    expect(closeVeltu(sim).ok).toBe(true);
    expect(cardPosts(sim, arion.id)).toEqual([[sim.now, 'Debit card yearly fee to the closing day: Veltureikningur', -96, -133_00]]);
    balancedAgainstBankFees(sim, arion.id);
    const kept = thaw(snap);
    kept.advanceTo(at(2027, 9, 1, 9));
    expect(cardPosts(kept, arion.id)).toEqual([[at(2027, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00]]);
    expect(breaches(kept.universe)).toEqual([]);
  }, 600_000);

  it('FIXTURE (TEST SETUP: the setting changed to behind on 1 September 2026): the year she was charged ahead on 25 August 2026 is still given back on a close, 817 kr on 14 October, and kept, is charged nothing at its end; the next year, opened behind, is charged at its end, 25 August 2028: each year paid once', async () => {
    const sim = await keeping('ar10-switch', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2026, 9, 1, 9));
    ARION_CARD_YEAR.paid = 'behind'; // TEST SETUP
    sim.advanceTo(at(2026, 10, 14, 9));
    const snap = freeze(sim);
    closeVoxtur(sim);
    expect(closeVeltu(sim).ok).toBe(true);
    expect(cardPosts(sim, arion.id).at(-1)).toEqual([sim.now, 'Debit card yearly fee refunded: Veltureikningur', 5_92, 817_00]);
    const kept = thaw(snap);
    kept.advanceTo(at(2027, 9, 1, 9));
    expect([kept.universe.accounts[arion.id]!.cardYearRule, kept.universe.accounts[arion.id]!.cardFeeAt]).toEqual(['behind', at(2027, 8, 25, 0)]);
    kept.advanceTo(at(2028, 9, 1, 9));
    expect(cardPosts(kept, arion.id)).toEqual([[at(2026, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00], [at(2028, 8, 25, 0), 'Debit card yearly fee', -6_88, -950_00]]);
    expect(breaches(kept.universe)).toEqual([]);
  }, 600_000);

  it('GUARD (TEST SETUP: paid behind): a second settling of a Veltureikningur’s fees charges nothing of the card’s year again', () => {
    ARION_CARD_YEAR.paid = 'behind'; // TEST SETUP
    const sim = inIceland('is-arion', 'ar10-behind-twice');
    const account = primary(sim);
    sim.advanceTo(rvk(2026, 3, 1));
    // From 6 January, 55 days used to 1 March: 95,000 × 55 / 365 = 14,315.1, 143 kr.
    settleFees(sim, account);
    settleFees(sim, account);
    expect(dated(sim, 'Debit card yearly fee to the closing day: Veltureikningur', account.id)).toEqual([[rvk(2026, 3, 1), -143_00, undefined]]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// AR7: a save from before brief 10
// ---------------------------------------------------------------------------

/** TEST SETUP: the save as a build before brief 10 wrote it: no card year's rule, no record of what Arion's year paid, and no `cardYears` step named. */
function asOlderBuild(sim: Simulation): Record<string, unknown> {
  const older = JSON.parse(serialise(sim.universe)) as { opened?: string[]; accounts: Record<string, Account> };
  // The stamina area's `timeTheCalls` follows `cardYears` from brief 10's integration (2026-10-16), and a build before
  // brief 10 named neither, so both come off: until then the list ended at `cardYears` and only that came off. From later
  // that day `briefsMastered` follows them (the genre row's Mastered), and comes off too.
  // From 2026-10-17 `writtenUnplayed` (brief 13's journeys) follows, and comes off too.
  // From 2026-10-20 `nameTheCover` (brief 19's D6, the understudy's part) follows, and comes off too.
  expect(older.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed', 'nameTheCover']);
  older.opened = older.opened!.filter((x) => x !== 'cardYears' && x !== 'timeTheCalls' && x !== 'briefsMastered' && x !== 'writtenUnplayed' && x !== 'nameTheCover');
  for (const a of Object.values(older.accounts)) {
    if (a.bankId !== 'is-arion') continue;
    delete a.cardYearRule;
    delete a.cardFeePaid;
    // Before its first night an older build hadn't charged it either.
    if (!sim.universe.transactions.some((t) => t.memo === 'Debit card yearly fee' && t.postings.some((p) => p.accountId === a.id))) delete a.cardFeeAt;
  }
  return older as unknown as Record<string, unknown>;
}

describe('arion.AR7: a save from before brief 10 opens with its card year as it was charged', () => {
  it('OLDER SAVE (TEST SETUP): the Reykjavík-raised student’s save of 1 September 2026, charged 950 kr on her first night by a build that kept no record of the year, opens with nothing posted and that year paid ahead with what the charge took; Close It on 14 October then refunds 817 kr, and reopened, the step doesn’t run again', async () => {
    const sim = await keeping('ar10-older', 2000);
    const arion = veltu(sim);
    sim.advanceTo(at(2026, 9, 1, 9));
    const written = asOlderBuild(sim) as { transactions: unknown[]; accounts: Record<string, Account> };
    const balances = Object.fromEntries(Object.values(written.accounts).map((a) => [a.id, [a.balance, a.held]]));
    const count = written.transactions.length;
    const older = loadSave(written as never);
    expect(older.universe.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed', 'nameTheCover']);
    expect(older.universe.transactions).toHaveLength(count);
    expect(Object.fromEntries(Object.values(older.universe.accounts).filter((a) => a.id in balances).map((a) => [a.id, [a.balance, a.held]]))).toEqual(balances);
    const a = older.universe.accounts[arion.id]!;
    expect([a.cardFeeAt, a.cardFeePaid, a.cardYearRule]).toEqual([at(2026, 8, 25, 0), 950_00, 'ahead']);
    older.advanceTo(at(2026, 10, 14, 9));
    closeVoxtur(older);
    expect(closeVeltu(older).ok).toBe(true);
    expect(cardPosts(older, arion.id).at(-1)).toEqual([older.now, 'Debit card yearly fee refunded: Veltureikningur', 5_92, 817_00]);
    const again = reload(older);
    expect(again.universe.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls', 'briefsMastered', 'writtenUnplayed', 'nameTheCover']);
    expect(again.universe.transactions).toHaveLength(older.universe.transactions.length);
  }, 300_000);

  it('OLDER SAVE (TEST SETUP), Mosfellsbær: an Arion account an older build opened on 5 January 2026 and hadn’t charged yet opens with the year from its opening taken as settled, nothing charged for it; its next charge is on the opening’s date, 5 January 2027', () => {
    const sim = inIceland('is-arion', 'ar10-older-opened');
    const account = primary(sim);
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: 20_000_000_00 }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -20_000_000_00 }] });
    const older = loadSave(asOlderBuild(sim) as never);
    const a = older.universe.accounts[account.id]!;
    expect([a.cardFeeAt, a.cardFeePaid, a.cardYearRule]).toEqual([account.openedAt, 0, 'ahead']);
    older.advanceTo(rvk(2027, 1, 7));
    expect(dated(older, 'Debit card yearly fee', account.id)).toEqual([[rvk(2027, 1, 5, 0), -950_00, undefined]]);
  }, 300_000);
});
