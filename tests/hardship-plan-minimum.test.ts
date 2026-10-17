/**
 * A hardship plan’s payment as the least a statement asks (`card.request_hardship`, from 2026-10-13). The due date has
 * judged a plan’s payment since 2026-10-10 (`autopayAsk`), but until 2026-10-13 everything else read the card’s own
 * minimum: the statement kept it (`CardState.issued`), the card’s panel showed it and said “short of the minimum”, paying
 * the minimum by hand paid it, about $48 on a $101 plan, and left the plan’s payment short at its due date, and the
 * Statements tab’s warning said what paying it would take at a rate the plan doesn’t charge. Found by the guide’s audit
 * of that day. Each figure is worked here from the plan’s rule, a forty-eighth of what’s owed, a dollar up.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM, at Chase (Total Checking, Savings and the Freedom Unlimited). The screens
 * are rendered as the player has them (react-dom/server), `useGame`’s `run` the save’s own `execute`.
 *
 * TEST SETUP, said again where it’s done: purchases put on the card, and a balance set or emptied by a posting against a
 * test equity line (the bank emptied the minute before a due date, the means to pay come since); and on the Statements
 * screen, the account and period chosen through its own useState, which a static render can’t click to.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { stateOf } from '@/engine/systems/credit';
import { cardStatement, periodsOf } from '@/engine/systems/statements';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value. */
  states: [] as unknown[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    return [h.states.shift(), set];
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

const { BankCard } = await import('@/ui/bank/BankCard');
const { BankStatements } = await import('@/ui/bank/BankStatements');

/** New Haven’s clock, worked out here: Eastern Daylight Time (UTC−4) until 1 November 2026, Eastern Standard (UTC−5) after. */
const edt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 4, minute);
const est = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 5, minute);

/** The life at 9:01 AM on its first day, past the fall term’s Yale Health plan, out of checking at 9:00. */
function settled(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.advanceTo(edt(8, 24, 9, 1));
  return sim;
}
const mine = (sim: Simulation, kind: Account['kind']): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && a.bankId === 'us-chase' && !a.closedAt && a.category !== 'term')!;
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const moved = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).flatMap((t) => t.postings.filter((p) => p.accountId === account.id).map((p) => p.amount));

/** TEST SETUP: an account brought to a balance, by a posting against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}
/** TEST SETUP: purchases put on a card, as a month’s shopping would put them. */
function purchases(sim: Simulation, card: Account, amount: number): void {
  sim.post({ memo: 'TEST SETUP: purchases', category: 'shopping', postings: [{ accountId: card.id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test Setup').id, amount }] });
}

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/ ([,.:;])/g, '$1');
/** A screen drawn as the player has it, the states given (TEST SETUP) in its render order. */
function draw(sim: Simulation, element: ReactElement, states: unknown[] = []): string {
  h.sim = sim;
  h.states = [...states];
  const html = renderToStaticMarkup(element);
  expect(h.states, 'every state given was taken').toHaveLength(0);
  return onScreen(html);
}

/**
 * The card owing $4,800, late at its first due date and then on a plan, as `tests/evidence2-b04.test.ts` plays it: the
 * statement of 20 September asks $4,800 and the card’s minimum, 1% of it and the month’s interest (none in the
 * introduction), never under $40: $48. Autopay, on the whole statement as the life starts, bounces on Sunday 11 October
 * at noon from a bank emptied the minute before. Then the plan: $4,830 over forty-eight months, $100.625, a dollar up,
 * $101; and the means to pay come.
 */
function lateThenPlan(seed: string): { sim: Simulation; card: Account; checking: Account } {
  const sim = settled(seed);
  const card = mine(sim, 'credit_card');
  const checking = mine(sim, 'checking');
  purchases(sim, card, 4_800_00); // TEST SETUP
  sim.advanceTo(edt(10, 11, 11, 59));
  setBalance(sim, checking, 0); // TEST SETUP: the bank emptied the minute before the due date
  setBalance(sim, mine(sim, 'savings'), 0); // TEST SETUP
  sim.advanceTo(edt(10, 11, 12, 5));
  expect(moved(sim, card, 'Late fee')).toEqual([-30_00]);
  expect(must(sim, 'card.request_hardship', {})).toEqual({ payment: 101_00 });
  setBalance(sim, checking, 1_000_00); // TEST SETUP: the means to pay the plan, come since
  sim.advanceTo(edt(10, 20, 9, 1));
  expect(card.balance).toBe(-4_830_00);
  return { sim, card, checking };
}

describe('a hardship plan’s statement', () => {
  it('keeps the plan’s $101 as its least and says it’s the plan’s, where the statement cut before the plan keeps the card’s $48, across a reload', () => {
    const { sim, card } = lateThenPlan('plan-least-kept');
    const issued = (s: Simulation) => stateOf(s.player, mine(s, 'credit_card')).issued!.slice(-2).map((x) => ({ at: x.at, minimum: x.minimum, plan: x.plan }));
    const kept = [{ at: edt(9, 20, 9), minimum: 48_00, plan: false }, { at: edt(10, 20, 9), minimum: 101_00, plan: true }];
    expect(issued(sim)).toEqual(kept);
    expect(issued(reload(sim))).toEqual(kept);
    const october = periodsOf(sim, card).find((p) => p.label === 'Statement Of October 20, 2026')!;
    expect(cardStatement(sim, card, october)).toMatchObject({ newBalance: 4_830_00, minimum: 101_00, plan: true });
  });

  it('still asks the plan’s $101 on the Statements tab once the plan has ended: paid off on 25 October, the plan ends at the 10 November due date, and the October statement reads as it asked', () => {
    const { sim, card, checking } = lateThenPlan('plan-least-ended');
    setBalance(sim, checking, 6_000_00); // TEST SETUP: the means to clear it
    sim.advanceTo(edt(10, 25, 9));
    expect(must(sim, 'finance.pay_card', { amount: 'full' })).toEqual({ paid: 4_830_00 });
    sim.advanceTo(est(11, 10, 12, 5));
    expect(stateOf(sim.player, card).hardship).toBeUndefined();
    const october = draw(sim, createElement(BankStatements), [card.id, 1]);
    expect(october).toContain('New Balance $4,830.00');
    expect(october).toContain('The least to pay is $101.00, the plan’s payment, by November 10, 2026.');
  });

  it('says on the Statements tab what the plan’s payment takes to clear it, with no interest, not what paying the card’s minimum would at its rate', () => {
    const { sim, card } = lateThenPlan('plan-least-warning');
    const october = draw(sim, createElement(BankStatements), [card.id, 1]);
    // $4,830 at $101 a month: 47.8 payments, forty-eight, four years; nothing draws interest on a plan.
    expect(Math.ceil(4_830_00 / 101_00)).toBe(48);
    expect(october).toContain('On the plan nothing draws interest and nothing new goes on the card: $101.00 a month clears the $4,830.00 in 4 years, $4,830.00 in all, so long as none is missed.');
    expect(october).not.toContain('Paying only the minimum');
    // The statement before the plan keeps the card’s warning.
    const september = draw(sim, createElement(BankStatements), [card.id, 2]);
    expect(september).toContain('Paying only the minimum, and spending nothing more');
    expect(september).not.toContain('On the plan');
  });

  it('restates a statement already cut whose due date is still to come: the plan asked on 25 September puts its $100 in the place of the 20 September statement’s $48, as its due date judges it', () => {
    const sim = settled('plan-least-restated');
    const card = mine(sim, 'credit_card');
    const checking = mine(sim, 'checking');
    purchases(sim, card, 4_800_00); // TEST SETUP
    sim.advanceTo(edt(9, 20, 9, 1));
    expect(stateOf(sim.player, card).issued!.at(-1)).toMatchObject({ minimum: 48_00, plan: false });
    sim.advanceTo(edt(9, 25, 9));
    setBalance(sim, checking, 1_000_00); // TEST SETUP: short of the $4,800, so a plan is for her
    setBalance(sim, mine(sim, 'savings'), 0); // TEST SETUP
    // $4,800 over forty-eight months: $100 exactly.
    expect(must(sim, 'card.request_hardship', {})).toEqual({ payment: 100_00 });
    expect(stateOf(sim.player, card).issued!.at(-1)).toMatchObject({ at: edt(9, 20, 9), minimum: 100_00, plan: true });
    expect(draw(sim, createElement(BankStatements), [card.id, 1])).toContain('The least to pay is $100.00, the plan’s payment, by October 11, 2026.');
    // Its due date: autopay asks the $100, not the whole statement it’s set to, and it’s on time.
    sim.advanceTo(edt(10, 11, 12, 5));
    expect(moved(sim, card, 'Paid Chase Freedom Unlimited')).toEqual([100_00]);
    expect(moved(sim, card, 'Late fee')).toEqual([]);
    expect(stateOf(sim.player, card).missed ?? 0).toBe(0);
  });
});

describe('paying the minimum by hand on a hardship plan', () => {
  it('pays the plan’s $101, and with the bank emptied after it the due date counts it on time, where the card’s own minimum, under the plan’s, would have left it short and late', () => {
    const { sim, card, checking } = lateThenPlan('plan-least-by-hand');
    expect(must(sim, 'finance.pay_card', { amount: 'minimum' })).toEqual({ paid: 101_00 });
    expect(moved(sim, card, 'Paid Chase Freedom Unlimited')).toEqual([101_00]);
    setBalance(sim, checking, 0); // TEST SETUP: the bank emptied the minute before the due date
    sim.advanceTo(est(11, 10, 11, 59));
    sim.advanceTo(est(11, 10, 12, 5));
    // Autopay asked nothing more, and the month is on time: the one late fee is October’s.
    expect(moved(sim, card, 'Paid Chase Freedom Unlimited')).toEqual([101_00]);
    expect(moved(sim, card, 'Late fee')).toEqual([-30_00]);
    expect(stateOf(sim.player, card).missed).toBe(0);
  });
});

describe('the card’s panel on a hardship plan', () => {
  it('gives the plan’s payment as what the statement asks and the late fee’s measure, and when the plan ends', () => {
    const { sim } = lateThenPlan('plan-least-panel');
    const panel = draw(sim, createElement(BankCard, { bankId: 'us-chase' }));
    expect(panel).toContain('It’s been on a payment plan since October 11, 2026. There’s no interest, and each statement asks for the plan’s $101 instead of the minimum, $101 on this one. You can’t use the card until the plan ends, at the first statement or due date after it’s paid off.');
    expect(panel).toContain('The minimum payment once the plan ends is');
    expect(panel).not.toMatch(/The minimum payment once the plan ends is [^.]*\. On this statement it’s/);
    expect(panel).toContain('Paying less than the plan’s payment by the due date costs $30 the first time, and $40 if it happens again within 6 billing periods, but never more than the plan’s payment itself.');
    expect(panel).not.toContain('short of the minimum');
    expect(panel).not.toContain('The card can’t be used until then.');
  });
});
