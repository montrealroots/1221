/**
 * Brief 20's money area, C3: promises the guide's money entries make between two entries that no test held, each through
 * the commands a player sends and the clock (docs/verification/audit-2026-10-21/effects/money.json, `promises`).
 *
 * - Round-ups (`bank.round-ups` > `bank.payments`): what the debit card pays rounds up, and at Citi what Citi's own
 *   credit card pays too. Until 2026-10-21 the connection said only the debit card's purchases round up, which Citi's
 *   Spend & Save contradicts (`roundsUpCard`); the guide's words were corrected, and this holds what they say now: a frugal
 *   student at Citi with the day on Citi's card has its groceries' change moved into Citi Savings, and her twin at Bank of
 *   America with the day on its card has none counted, Keep the Change being the debit card's alone.
 * - A move keeps an account in use (`bank.transfer` > `bank.upkeep`): a dollar moved out of Chase Savings at twenty months
 *   keeps it from Chase's thirty months of dormancy, where its twin's goes dormant; the dormant account refuses Move
 *   Money until it's reactivated, then takes it.
 * - Overdrawn worries her (`bank.borrowing` > `body.how`): the day's groceries paid into Chase's overdraft for a student who
 *   opted in, her checking moved into savings: each midnight it lasts counts it among her troubles, and her stress is up
 *   and her morale down against her twin's, whose checking has money in it.
 * - Worth (`bank.term` > `money.affairs`, `bank.cash` > `money.affairs`): a CD and cash in hand count in worth from the
 *   moment they're made, so opening the one and taking the other out moves worth only by the machine's fee.
 * - Short For A Payment watches a payment set for a date (`bank.upkeep` > `bank.payments`): the first midnight within three
 *   days of a payment the account can't make, once.
 *
 * PLAYER JOURNEYS: new lives as creation makes them (`newLifeConfig`), Ada Cole, born in New York, a US citizen, an
 * actor at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, with the wealthy family's money, at the bank named;
 * the round-ups' lives frugal, as creation's Personality step lets a player choose, so a purchase isn't whole dollars.
 * Nothing is set by hand. Seeds: b20-money-roundups, b20-money-idle, b20-money-overdrawn, b20-money-worth,
 * b20-money-short.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { addMonths, instantFromZoned } from '@/engine/core/time';
import { troubles } from '@/engine/systems/spending';
import { netWorth } from '@/engine/systems/finance';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12, min = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: min }, NY);
const life = (seed: string, bankId: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, {
  ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId, ...extra,
});
const own = (sim: Simulation, kind: Account['kind']): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && !a.nominal && a.category !== 'term')!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};

describe('round-ups and how the day is paid', () => {
  it('rounds up the groceries Citi’s own credit card pays, and moves the change into Citi Savings; Bank of America’s card counts nothing', () => {
    const citi = life('b20-money-roundups', 'us-citi', { personalityTraits: ['frugal'] });
    const boa = life('b20-money-roundups', 'us-bank-of-america', { personalityTraits: ['frugal'] });
    run(citi, 'bank.set_round_ups', { on: true, every: 'day', minimum: 50 });
    run(boa, 'bank.set_round_ups', { on: true });
    for (const sim of [citi, boa]) run(sim, 'bank.set_payments', { everyday: 'credit' });
    for (const sim of [citi, boa]) sim.advanceTo(at(2026, 8, 25, 0, 1));
    const groceries = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Groceries' && t.at === at(2026, 8, 25, 0));
    // Both days went on the credit card, at a frugal student's price, not whole dollars.
    for (const sim of [citi, boa]) {
      const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card')!;
      expect(groceries(sim).flatMap((t) => t.postings.filter((p) => p.accountId === card.id))).toHaveLength(1);
    }
    const price = -groceries(citi)[0]!.postings.find((p) => p.amount < 0)!.amount;
    expect(price % 100).not.toBe(0);
    // Citi counted its card's purchase: the change to the next dollar.
    expect(citi.player.roundUps!.pending).toBe(100 - (price % 100));
    expect(boa.player.roundUps!.pending).toBe(0);
    // And moves it on its day, from checking into Citi Savings.
    citi.advanceTo(at(2026, 8, 26, 0, 1));
    const moved = citi.universe.transactions.filter((t) => /round-up/i.test(t.memo) && t.postings.some((p) => p.accountId === own(citi, 'savings').id && p.amount > 0));
    expect(moved.length).toBeGreaterThanOrEqual(1);
    expect(moved[0]!.postings.find((p) => p.accountId === own(citi, 'savings').id)!.amount).toBe(100 - (price % 100));
  });
});

describe('a move keeps an account in use', () => {
  it('keeps Chase Savings from going dormant after a dollar moved out of it at twenty months, where its twin’s goes dormant at thirty and refuses Move Money until it’s reactivated', () => {
    const used = life('b20-money-idle', 'us-chase');
    const idle = life('b20-money-idle', 'us-chase');
    const start = at(2026, 8, 24, 7, 30);
    for (let m = 1; m <= 20; m += 1) for (const sim of [used, idle]) sim.advanceTo(addMonths(start, m, NY));
    run(used, 'bank.transfer', { fromId: own(used, 'savings').id, toId: own(used, 'checking').id, amount: 1_00 });
    for (let m = 21; m <= 31; m += 1) for (const sim of [used, idle]) sim.advanceTo(addMonths(start, m, NY));
    expect(own(idle, 'savings').dormant).toBe(true);
    expect(own(used, 'savings').dormant).toBeFalsy();
    const refused = idle.execute({ kind: 'bank.transfer', payload: { fromId: own(idle, 'savings').id, toId: own(idle, 'checking').id, amount: 1_00 } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toBe('Chase Savings is dormant, so nothing was moved. Reactivate it under Your Accounts Over Time, then try again.');
    run(idle, 'bank.reactivate', { accountId: own(idle, 'savings').id });
    run(idle, 'bank.transfer', { fromId: own(idle, 'savings').id, toId: own(idle, 'checking').id, amount: 1_00 });
  });
});

describe('overdrawn worries her', () => {
  it('counts the day’s groceries paid into Chase’s overdraft among her troubles each midnight it lasts, her stress up and morale down against her twin with money in checking', () => {
    const over = life('b20-money-overdrawn', 'us-chase');
    const twin = life('b20-money-overdrawn', 'us-chase');
    for (const sim of [over, twin]) {
      run(sim, 'card.lock', { which: 'credit', locked: true });
      run(sim, 'bank.debit_overdraft', { on: true });
      sim.advanceTo(at(2026, 9, 9, 20));
    }
    run(over, 'bank.transfer', { fromId: own(over, 'checking').id, toId: own(over, 'savings').id, amount: own(over, 'checking').balance });
    for (const sim of [over, twin]) sim.advanceTo(at(2026, 9, 10, 0, 1));
    // The groceries went into the overdraft at the midnight, before the day's worry read her troubles.
    expect(own(over, 'checking').balance).toBeLessThan(0);
    expect(troubles(over, over.player).map((t) => t.kind)).toEqual(['overdrawn']);
    expect(troubles(twin, twin.player)).toEqual([]);
    // Each midnight it lasts, the worry: stress up and morale down against her twin's (`WORRY_STRESS`, `WORRY_MORALE`).
    for (const day of [10, 11]) {
      for (const sim of [over, twin]) sim.advanceTo(at(2026, 9, day, 0, 1));
      expect(own(over, 'checking').balance).toBeLessThan(0);
      expect(over.player.wellbeing.stress - twin.player.wellbeing.stress).toBeGreaterThan(3);
      expect(over.player.wellbeing.morale).toBeLessThan(twin.player.wellbeing.morale);
    }
  });
});

describe('what counts in worth', () => {
  it('counts a CD from the day it opens and cash in hand from the moment it’s taken out, so worth moves only by the machine’s fee', () => {
    const sim = life('b20-money-worth', 'us-chase');
    const worth = () => netWorth(sim, sim.player.id);
    const w0 = worth();
    run(sim, 'bank.open_term', { amount: 5_000_00 });
    expect(worth().total).toBe(w0.total);
    expect(worth().cash).toBe(w0.cash);
    const fee = run<{ fee: number }>(sim, 'cash.withdraw', { amount: 200_00, from: 'other_atm' }).fee;
    const owner = sim.universe.transactions.filter((t) => t.memo === 'The machine owner’s fee').reduce((n, t) => n + t.postings.filter((p) => p.amount > 0).reduce((m, p) => m + p.amount, 0), 0);
    expect(worth().total).toBe(w0.total - fee - owner);
    expect(own(sim, 'cash').balance).toBe(200_00);
  });
});

describe('Short For A Payment and a payment set for a date', () => {
  it('says within three days of it, once, that checking can’t make a payment set for a date; the payment then doesn’t go', () => {
    const sim = life('b20-money-short', 'us-capital-one');
    run(sim, 'bank.set_payments', { everyday: 'credit' });
    run(sim, 'bank.schedule_payment', { fromId: own(sim, 'checking').id, toId: own(sim, 'savings').id, amount: 500_00, at: at(2026, 9, 18, 9) });
    sim.advanceTo(at(2026, 9, 14, 12));
    run(sim, 'bank.transfer', { fromId: own(sim, 'checking').id, toId: own(sim, 'savings').id, amount: own(sim, 'checking').balance });
    const since = sim.now;
    sim.advanceTo(at(2026, 9, 18, 10));
    const said = sim.universe.notifications.filter((n) => n.at >= since && n.title === 'Short For A Payment: 360 Checking');
    // The first midnight the payment, at 9 AM on the 18th, is within three days: the 16th's.
    expect(said.map((n) => n.at)).toEqual([at(2026, 9, 16, 0)]);
    expect(said[0]!.body).toBe('Payment To 360 Performance Savings, $500.00, comes from 360 Checking at Capital One on September 18, 2026, and it has nothing available. Move money into it, or cancel the payment.');
    expect(sim.universe.notifications.filter((n) => n.at >= since && n.title === 'A Scheduled Payment Didn’t Go')).toHaveLength(1);
  });
});
