/**
 * Group g4, part 1, found in the connected-journey pass and fixed on 2026-10-12: Look After Yourself and the Sleep
 * dialog, each held to doing what it says.
 *
 * - A meal the menu offers is one the command buys. Both ask `spendRefusal`, `spend`'s own precondition; until then
 *   the menu counted an overdraft that a debit card purchase can't use at a bank without the opt-in, and the command
 *   said after the hour that the payment didn't go through.
 * - Work Out's Fitness arrow is the workout's own arithmetic: the weather as its hour ends, and the day's workouts
 *   before it. Until then it was a first workout's, in the weather as the menu opened.
 * - `LOOKING_AFTER` carries what something reads: its `does` sentences had no reader.
 * - Your own page's Readiness names what reads readiness now. It named an audition and a day's work, which went with
 *   the career on 2026-10-09.
 * - The Sleep dialog's slider reaches the half hour a suggestion can ask for. It started at 1.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Account } from '@/engine/core/ledger';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { overdraftHeadroom, purchaseMayOverdraw } from '@/engine/systems/lending';
import {
  LONGEST_NIGHT, LOOKING_AFTER, SHORTEST_SLEEP, costFor, lookAfterOptions, lookAfterRefusal, suggestedSleep, trainingAt,
} from '@/engine/systems/life';
import { walletOf } from '@/engine/systems/cash';
import { canSpend, spend } from '@/engine/systems/spending';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

const NYC = 'us-ny-newyork';
const lifeAt = (bankId: string, seed: string) =>
  quickSave({ startLocationId: NYC, homeRegionId: NYC, livesWhereBorn: true, wealth: 'modest', bankId }, seed);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.closedAt && !a.nominal);
/** Test setup: an account's balance set, against a test equity line. */
function setTo(sim: Simulation, account: Account, amount: number): void {
  const diff = amount - account.balance;
  if (diff) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: diff }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -diff }] });
}
/** Test setup: nothing on the calendar in the way. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
const eat = (sim: Simulation) => sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
const menuLine = (sim: Simulation, action: string) => lookAfterOptions(sim).find((o) => o.action === action)!;

/**
 * Test setup: a Chase customer in New York paying the day by debit card, hungry, with a cent in the account, no
 * savings, no cash and the credit card locked; the overdraft not opted into for the debit card.
 */
function downToACent(seed: string): Simulation {
  const sim = lifeAt('us-chase', seed);
  clearCalendar(sim);
  sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
  for (const a of mine(sim)) if (a.kind === 'savings' || a.kind === 'cash') setTo(sim, a, 0);
  if (mine(sim).some((a) => a.kind === 'credit_card')) sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
  setTo(sim, primary(sim), 1);
  sim.player.wellbeing.nourishment = 40;
  return sim;
}

describe('a meal the menu offers is one the command buys', () => {
  it('grays a meal the overdraft can’t pay at a bank without the opt-in, and refuses it in the same words', () => {
    const sim = downToACent('g4-meal-overdraft');
    const meal = costFor(sim, 'eat');
    // The case: an overdraft that would cover it, which a debit card purchase can't use here.
    expect(purchaseMayOverdraw(sim, sim.player)).toBe(false);
    expect(overdraftHeadroom(sim, sim.player)).toBeGreaterThan(meal);
    expect(canSpend(sim, sim.player, meal, 'food')).toBe(false);
    expect(menuLine(sim, 'eat').refused).toBe('You can’t afford it.');
    expect(menuLine(sim, 'order').refused).toBe('You can’t afford it.');
    const clock = sim.now;
    const tried = eat(sim);
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe('You can’t afford it.');
    expect(sim.now).toBe(clock);
    // Opted in, the same meal is offered, and bought into the overdraft.
    primary(sim).debitOverdraft = true;
    expect(lookAfterRefusal(sim, 'eat')).toBeUndefined();
    expect(eat(sim).ok).toBe(true);
    expect(primary(sim).balance).toBeLessThan(0);
  });

  it('grays a meal a locked debit card can’t pay for, and offers it once cash in hand covers it', () => {
    const sim = downToACent('g4-meal-locked');
    setTo(sim, primary(sim), 1_000_00);
    sim.must({ kind: 'card.lock', payload: { which: 'debit', locked: true } });
    const meal = costFor(sim, 'eat');
    const words = 'Your debit card is locked, and there isn’t enough on the credit card or in cash.';
    expect(menuLine(sim, 'eat').refused).toBe(words);
    const tried = eat(sim);
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe(words);
    // Cash in hand pays where the debit card can't.
    const wallet = walletOf(sim, sim.player, true)!;
    setTo(sim, wallet, meal);
    expect(lookAfterRefusal(sim, 'eat')).toBeUndefined();
    expect(eat(sim).ok).toBe(true);
    expect(wallet.balance).toBe(0);
  });

  it('takes nothing for a meal it refuses: a cash payer’s cash stays in hand when the locked debit card can’t pay the rest', () => {
    // Until 2026-10-12 `spend` took the cash first and only then found the locked card couldn't pay the rest.
    const sim = downToACent('g4-meal-half-cash');
    setTo(sim, primary(sim), 1_000_00);
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'cash' } });
    sim.must({ kind: 'card.lock', payload: { which: 'debit', locked: true } });
    const meal = costFor(sim, 'eat');
    const wallet = walletOf(sim, sim.player, true)!;
    setTo(sim, wallet, Math.floor(meal / 2));
    expect(lookAfterRefusal(sim, 'eat')).toMatch(/^Your debit card is locked/);
    expect(spend(sim, sim.player, meal, 'A meal', 'food')).toBe(false);
    expect(wallet.balance).toBe(Math.floor(meal / 2));
  });

  it('is what `spend` itself asks: with nothing owed allowed, it spends exactly when `canSpend` says it can', () => {
    for (const [seed, cents] of [['g4-spend-short', 1], ['g4-spend-rich', 1_000_00]] as const) {
      const sim = downToACent(seed);
      setTo(sim, primary(sim), cents);
      const meal = costFor(sim, 'eat');
      const can = canSpend(sim, sim.player, meal, 'food');
      expect(spend(sim, sim.player, meal, 'A meal', 'food')).toBe(can);
    }
  });
});

/** Test setup: a fit-enough body with the energy for three workouts, and nothing on the calendar. */
function readyToTrain(sim: Simulation): void {
  clearCalendar(sim);
  Object.assign(sim.player.wellbeing, { energy: 100, stress: 20, sleepDebt: 0, nourishment: 80, morale: 60, hygiene: 90, fitness: 40 });
}
/** One workout: the menu's Fitness arrow, then what the command built. */
function workout(sim: Simulation): { shown: number; built: number; why: string } {
  const line = menuLine(sim, 'exercise');
  const arrow = line.changes.find((c) => c.dial === 'fitness')!;
  const before = sim.player.wellbeing.fitness;
  sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
  return { shown: arrow.to - arrow.from, built: sim.player.wellbeing.fitness - before, why: line.why };
}

describe('Work Out’s Fitness arrow', () => {
  it('is what each of three workouts in a row builds, the second and third included', () => {
    const sim = quickSave({}, 'g4-three-workouts');
    readyToTrain(sim);
    const three = [workout(sim), workout(sim), workout(sim)];
    // What's left between them is the hour itself, lived before the workout pays out: a little readiness.
    for (const one of three) expect(Math.abs(one.shown - one.built)).toBeLessThan(0.03);
    expect(three[1]!.why).toMatch(/workout 2 today, so it builds 50% of a first/);
    expect(three[2]!.why).toMatch(/workout 3 today, so it builds 25% of a first/);
    expect(three[0]!.why).not.toMatch(/today, so/);
  });

  it('reads the weather as the hour ends, where the workout does, and says whether it’ll be a run', () => {
    const sim = quickSave({}, 'g4-weather-turns');
    const end = (t: number) => t + LOOKING_AFTER.exercise.minutes * MS_MINUTE;
    // The first half hour in the week ahead where the weather now and at the hour's end make different workouts.
    let turn: number | undefined;
    for (let t = sim.now; t < sim.now + 7 * 24 * MS_HOUR && turn === undefined; t += 30 * MS_MINUTE) {
      if (trainingAt(sim, sim.player, t).where !== trainingAt(sim, sim.player, end(t)).where) turn = t;
    }
    expect(turn).toBeDefined();
    sim.advanceTo(turn!);
    readyToTrain(sim);
    const ends = trainingAt(sim, sim.player, end(sim.now)).where;
    expect(trainingAt(sim, sim.player).where).not.toBe(ends);
    const one = workout(sim);
    expect(Math.abs(one.shown - one.built)).toBeLessThan(0.03);
    expect(one.why).toMatch(ends === 'run' ? /^A run in fine weather:/ : /^Indoors, the weather being no good for a run:/);
    const last = sim.player.development!.history.filter((h) => h.id === 'stamina').at(-1)!;
    expect(last.source).toBe(ends === 'run' ? 'workout:run' : 'workout');
  });
});

describe('the Look After Yourself table', () => {
  it('carries a label and a time, each of them read, and no sentence nothing reads', () => {
    for (const one of Object.values(LOOKING_AFTER)) expect(Object.keys(one).sort()).toEqual(['label', 'minutes']);
  });
});

describe('Readiness on your own page', () => {
  it('names what reads it now, and not the career that went', () => {
    const sim = quickSave({}, 'g4-readiness-way');
    const found = resolveLook(sim, at('person', sim.universe.playerId)) as Looked;
    const way = found.ways!.find((w) => w.label === 'Readiness')!;
    expect(way.detail).not.toMatch(/audition|day’s work/);
    expect(way.detail).toMatch(/a rehearsal, an hour of practice or a workout builds/);
    expect(way.detail).toMatch(/your work goes when it’s judged/);
  });
});

describe('the Sleep dialog', () => {
  const DIALOG = readFileSync(fileURLToPath(new URL('../src/ui/shell/TimeControls.tsx', import.meta.url)), 'utf8');

  it('lets the slider reach the half hour a suggestion can ask for, and the command sleeps it', () => {
    const sim = quickSave({}, 'g4-sleep-floor');
    clearCalendar(sim);
    sim.onSchedule('test.commitment', () => undefined);
    sim.schedule({ at: sim.now + 2 * MS_HOUR, kind: 'test.commitment', label: 'A Test Call', category: 'school', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id } });
    expect(suggestedSleep(sim).hours).toBe(SHORTEST_SLEEP);
    const slider = /<input\s+id="sleep-hours"[^>]*/.exec(DIALOG)![0];
    expect(slider).toContain('min={SHORTEST_SLEEP}');
    expect(slider).toContain('max={LONGEST_NIGHT}');
    const from = sim.now;
    const slept = sim.must<{ wokeAt: number }>({ kind: 'life.sleep', payload: { hours: SHORTEST_SLEEP } });
    expect(slept.wokeAt - from).toBe(SHORTEST_SLEEP * MS_HOUR);
    expect(LONGEST_NIGHT).toBeGreaterThan(SHORTEST_SLEEP);
  });
});
