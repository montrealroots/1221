/**
 * bank.savings_notice, played (the integration pass of 2026-10-16, the coverage area's follow-up). Until that day no
 * life made at Yale banked in Germany, so the savings notice was reached only on lives living in Berlin, labelled
 * FIXTURE (tests/scope-money.test.ts, tests/accountlife.test.ts), and its row stood Unresolved, "genuinely unreachable in
 * a played life". The account kept at home, the owner's decision of 2026-10-16 (systems/homeaccount.ts), changed that
 * the same day: a student who lived in Berlin before Yale and kept her account at Deutsche Bank holds her savings at
 * home in its Flexgeld, and closing it past what the month lets out takes the law's three months' notice. The coverage
 * area's probe found it reached on 2026-10-16; this plays it, from creation, through the Bank screen and the clock.
 *
 * What was measured, worked by hand from the rules and not asked of the engine's helpers:
 * - Deutsche Bank lets €2,000 a month go from a savings account (its price list, `savingsMonthly` in content/cash.ts),
 *   and the modest family's savings kept at home are €6,264.00 in the Flexgeld: more than the month lets out, so
 *   Close It gives notice, and the account closes three calendar months on (`addMonths`, banking.ts bank.close_savings).
 *   Pressed on Tuesday 1 September 2026 at 9 AM in New Haven, that's Tuesday 1 December 2026 at 9 AM.
 * - On that day what the Flexgeld holds goes whole to the current account at its own bank, the AktivKonto, its interest
 *   since the quarter's close paid into it first: the AktivKonto is up by exactly what the Flexgeld held the minute
 *   before and the interest paid on closing, the Flexgeld at nothing, and no other account of hers moves. A ledger that sums is the
 *   independent check: nothing made, nothing lost.
 * - A standing order of $10 into the Flexgeld on the 15th, paid while it's open, ends with it: 15 December brings no
 *   payment into a closed account and no "Didn't Go".
 * - Change the input, the savings held: the scraping family's €64.00 is under the €2,000, so its Flexgeld closes at
 *   once into the AktivKonto, with no notice.
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeFrom`), Ada Cole, born in Berlin, a
 * German citizen in F-1 status, who lived in Berlin from June 2002 and kept her account at Deutsche Bank (Before Yale),
 * banking at Chase in New Haven, at Yale from Monday 24 August 2026. Close It is pressed on the Bank screen rendered as
 * the player has it, by its own handler. Seeds are arbitrary, none picked for what it draws.
 *
 * Found by this test's author on 2026-10-16 and fixed the same day: the Bank screen's line under Close It, and its
 * "Notice is given" line, named the primary account (Chase Total Checking) as where the money goes, where the engine moves
 * it into the account at the savings' own bank, the AktivKonto, as its notice says. Both lines name the AktivKonto now,
 * and the two assertions that read them failed before the fix.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadPlacesFor, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeFrom, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { addCountryHolidays } from '@/engine/content/holidays';
import { breaches } from '@/engine/core/invariants';
import { homeAccountRefusal } from '@/engine/systems/homeaccount';
import { SAVINGS_NOTICE_KIND } from '@/engine/systems/banking';
import { deserialise, serialise } from '@/engine/persistence/adapter';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; onClick?: () => void }[],
  toasts: [] as string[],
}));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children).trim(), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');

addCountryHolidays('de', readFileSync('public/holidays/de.tsv', 'utf8'));

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, NY);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1');

/** Ada Cole as the creation screen's draft makes her: born and raised in Berlin, her account kept at Deutsche Bank. */
const draft = (wealth: StartingWealth): NewSaveConfig => newLifeFrom({
  homeRegionId: 'de-be-berlin', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth, bankId: 'us-chase',
  priorResidence: { cityId: 'de-be-berlin', fromYear: 2002, fromMonth: 6 }, homeBankId: 'de-deutsche-bank',
} as Partial<NewSaveConfig>);
async function berliner(seed: string, wealth: StartingWealth): Promise<Simulation> {
  const config = draft(wealth);
  // Before Yale offers the account: the rule the creation screen and the save both read.
  expect(homeAccountRefusal(config, 'de-deutsche-bank')).toBeUndefined();
  const sim = createSave(1, seed, config);
  await loadPlacesFor(sim.universe);
  return sim;
}
const freeze = (sim: Simulation): string => serialise(sim.universe);
const thaw = (snap: string): Simulation => loadSave(deserialise(snap) as never);
const mine = (sim: Simulation): Account[] => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
const at_ = (sim: Simulation, bankId: string, kind: 'checking' | 'savings') => mine(sim).find((a) => a.bankId === bankId && a.kind === kind);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What each transaction with this memo put on one account, in the account's own money. */
const heldBy = (sim: Simulation, memo: RegExp, id: string) => sim.universe.transactions.filter((t) => memo.test(t.memo)).flatMap((t) => t.postings).filter((p) => p.accountId === id).map((p) => p.native ?? p.amount);
const orders = (sim: Simulation) => ((sim.player as unknown as { payments?: { standingOrders: { toId: string }[] } }).payments?.standingOrders ?? []);

/** The Bank screen as the player has it: its words, and the Gated buttons it drew. */
function bank(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(BankWorkspace as FunctionComponent)));
}
function press(feature: string, label: string): string[] {
  const b = h.clicks.filter((c) => c.feature === feature && c.label === label);
  expect(b, `one ${feature} ${label}`).toHaveLength(1);
  h.toasts = [];
  b[0]!.onClick!();
  return h.toasts;
}

/** A Berlin-raised student on 1 September 2026, her $10 standing order into the Flexgeld set, and Close It pressed. */
async function noticeGiven(seed: string) {
  const sim = await berliner(seed, 'modest');
  const flex = at_(sim, 'de-deutsche-bank', 'savings')!;
  const konto = at_(sim, 'de-deutsche-bank', 'checking')!;
  // The modest family's savings kept at home: €6,264.00, past the €2,000 the month lets out.
  expect([flex.name, flex.held, konto.name]).toEqual(['Flexgeld', 626_400, 'AktivKonto']);
  sim.advanceTo(at(2026, 9, 1, 9));
  expect(sim.execute({ kind: 'bank.add_standing_order', payload: { toId: flex.id, amount: 10_00, day: 15 } }).ok).toBe(true);
  expect(orders(sim).filter((o) => o.toId === flex.id)).toHaveLength(1);
  const before = bank(sim);
  expect(before).toContain('It holds more than the');
  expect(before).toContain('you can take out this month without notice, so closing it gives three months’ notice, as the law requires. The money moves to AktivKonto then.');
  expect(press('bank.close_savings', 'Close It')).toEqual(['Notice given. It closes December 1, 2026.']);
  return { sim, flex: flex.id, konto: konto.id };
}

describe('bank.savings_notice: a Berlin-raised student’s savings kept at Deutsche Bank, closed past the month’s €2,000', () => {
  it('PLAYER JOURNEY: Close It pressed on 1 September 2026 gives three months’ notice; on 1 December 2026 the Flexgeld closes whole into her AktivKonto, its interest paid first, the order into it ended, said once, across a reload', async () => {
    const { sim, flex, konto } = await noticeGiven('isn-journey');
    const pending = sim.universe.scheduled.filter((i) => i.kind === SAVINGS_NOTICE_KIND && i.status === 'pending');
    expect(pending.map((i) => [i.at, i.payload.accountId])).toEqual([[at(2026, 12, 1, 9), flex]]);
    // Pressed again, refused in its words; the screen says the notice and its day, and draws no Close It.
    expect(sim.execute({ kind: 'bank.close_savings', payload: { accountId: flex } }).error).toBe('Notice is given: Flexgeld closes on December 1, 2026.');
    expect(bank(sim)).toContain('You’ve given notice. It closes December 1, 2026, and what it holds moves to AktivKonto then.');
    expect(h.clicks.filter((c) => c.feature === 'bank.close_savings')).toEqual([]);

    // Reloaded in October; the minute before its day it's open, with what it holds.
    sim.advanceTo(at(2026, 10, 2, 9));
    const back = thaw(freeze(sim));
    back.advanceTo(at(2026, 12, 1, 8, 59));
    const f = back.universe.accounts[flex]!;
    const k = back.universe.accounts[konto]!;
    expect(f.closedAt).toBeUndefined();
    const held = { flex: f.held!, konto: k.held!, others: mine(back).filter((a) => a.id !== flex && a.id !== konto).map((a) => [a.id, a.balance]) };
    expect(held.flex).toBeGreaterThan(626_400);
    const transactions = back.universe.transactions.length;

    back.advanceTo(at(2026, 12, 1, 9, 1));
    expect(f.closedAt).toBe(at(2026, 12, 1, 9));
    expect([f.balance, f.held]).toEqual([0, 0]);
    // The interest since the quarter's close paid into it first, then the whole moved to the AktivKonto.
    const paid = heldBy(back, /^Interest: Flexgeld, on closing$/, flex);
    expect(paid).toHaveLength(1);
    expect(paid[0]!).toBeGreaterThan(0);
    expect(heldBy(back, /^Closed Flexgeld$/, konto)).toEqual([held.flex + paid[0]!]);
    expect(k.held).toBe(held.konto + held.flex + paid[0]!);
    // Nothing else of hers moved at the close.
    expect(back.universe.transactions.slice(transactions).map((t) => t.memo)).toEqual(['Interest: Flexgeld, on closing', 'Closed Flexgeld']);
    expect(mine(back).filter((a) => a.id !== flex && a.id !== konto).map((a) => [a.id, a.balance])).toEqual(held.others);
    expect(titled(back, 'Flexgeld Closed').map((n) => [n.at, n.body])).toEqual([[at(2026, 12, 1, 9), 'The notice ran out, and what it held is in your AktivKonto at Deutsche Bank.']]);
    // The order into it ended with it: 15 December pays nothing into a closed account, and says nothing failed.
    expect(orders(back).filter((o) => o.toId === flex)).toEqual([]);
    back.advanceTo(at(2026, 12, 20, 9));
    expect(back.universe.transactions.filter((t) => t.at > at(2026, 12, 1, 9, 1) && t.postings.some((p) => p.accountId === flex))).toEqual([]);
    expect(back.universe.notifications.filter((n) => n.at > at(2026, 12, 1, 9, 1) && /Didn’t Go|Didn't Go/.test(n.title))).toEqual([]);
    expect(titled(back, 'Flexgeld Closed')).toHaveLength(1);
    expect(breaches(back.universe)).toEqual([]);
  }, 300_000);

  it('the same close, on the same day, for the same sums, whether the clock jumps from the notice to 20 December at once or a day at a time with a reload between', async () => {
    const { sim, flex } = await noticeGiven('isn-steps');
    const snap = freeze(sim);
    const jump = thaw(snap);
    jump.advanceTo(at(2026, 12, 20, 9));
    let steps = thaw(snap);
    for (let t = at(2026, 9, 2, 9); t <= at(2026, 12, 20, 9); t += MS_DAY) {
      steps.advanceTo(t);
      if (t === at(2026, 11, 30, 9)) steps = thaw(freeze(steps));
    }
    const ofFlex = (s: Simulation) => s.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === flex)).map((t) => [t.at, t.memo, t.postings.map((p) => [p.accountId, p.amount, p.native])]);
    expect(ofFlex(steps)).toEqual(ofFlex(jump));
    expect(steps.universe.accounts[flex]!.closedAt).toBe(at(2026, 12, 1, 9));
    expect(titled(steps, 'Flexgeld Closed').map((n) => [n.at, n.body])).toEqual(titled(jump, 'Flexgeld Closed').map((n) => [n.at, n.body]));
    expect(titled(steps, 'Flexgeld Closed')).toHaveLength(1);
  }, 300_000);

  // Change the input, the savings held: under the €2,000 the month lets out, no notice.
  it('PLAYER JOURNEY: the scraping family’s student, her Flexgeld at €64.00, presses Close It on 1 September 2026 and it closes at once into the AktivKonto, with no notice and nothing on the clock', async () => {
    const sim = await berliner('isn-twin', 'scraping');
    const flex = at_(sim, 'de-deutsche-bank', 'savings')!;
    const konto = at_(sim, 'de-deutsche-bank', 'checking')!;
    expect(flex.held).toBe(6_400);
    sim.advanceTo(at(2026, 9, 1, 9));
    const kontoBefore = konto.held!;
    const flexBefore = flex.held!;
    bank(sim);
    expect(press('bank.close_savings', 'Close It')).toEqual([]);
    expect(flex.closedAt).toBe(at(2026, 9, 1, 9));
    expect(sim.universe.scheduled.filter((i) => i.kind === SAVINGS_NOTICE_KIND && i.status === 'pending')).toEqual([]);
    const paid = heldBy(sim, /^Interest: Flexgeld, on closing$/, flex.id).reduce((n, x) => n + x, 0);
    expect(konto.held).toBe(kontoBefore + flexBefore + paid);
    expect(titled(sim, 'Flexgeld Closed')).toEqual([]);
  }, 300_000);
});
