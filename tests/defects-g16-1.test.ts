/**
 * A standing order and a payment set for a date (`systems/payments.ts`) between two of the holder's banks. Until
 * 2026-10-12 each posted straight from one account to the other on its day, whatever the two banks were: none of the
 * sending bank's days that Move Money takes (`sendBetweenBanks`), none of Citi's limits, and none of the refusals
 * `bank.transfer` makes of a dormant account, one closing, or one a switch left in debt. `bank.add_standing_order`
 * and `bank.schedule_payment` took a term deposit, so money went into one each month or came out of it with no
 * penalty, and `bank.set_payments` linked savings at another bank, which the link never reaches (`savingsOf` in
 * `systems/spending.ts`).
 *
 * PLAYER JOURNEYS play a life forward through the commands the screen gives; FIXTURES set a state up by hand to reach
 * one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { paymentsOf, SCHEDULED_KIND } from '@/engine/systems/payments';
import { inTransitOf } from '@/engine/systems/bankmoves';

const lifeAt = (bankId: string, seed: string) =>
  quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const refused = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, kind).toBe(false);
  return String(answer.error);
};
/** TEST SETUP: money put in an account from outside, as a deposit from family would be. */
const fund = (sim: Simulation, accountId: string, amount: number) =>
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const savingsAt = (sim: Simulation, bankId: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term' && a.bankId === bankId);
const openSavingsAt = (sim: Simulation, bankId: string): Account => savingsAt(sim, bankId) ?? sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_savings', { bankId }).accountId]!;
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).map((n) => n.body);
/** A second current account, at Capital One, funded from the first by Move Money and arrived. */
function secondBank(sim: Simulation, amount = 1_000_00): Account {
  const cap = sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId]!;
  const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: primary(sim).id, toId: cap.id, amount });
  sim.advanceTo(sent.arrivesAt + 60_000);
  expect(cap.balance).toBe(amount);
  return cap;
}

describe('PLAYER JOURNEY: a payment set for a date between two banks', () => {
  it('goes out of Chase on its day and arrives at Capital One in Chase’s days, as Move Money does', () => {
    const sim = lifeAt('us-chase', 'g16-sched-2');
    const chase = primary(sim);
    fund(sim, chase.id, 3_000_00);
    const cap = secondBank(sim);
    const at = sim.now + 5 * MS_DAY;
    run(sim, 'bank.schedule_payment', { fromId: chase.id, toId: cap.id, amount: 200_00, at });
    sim.advanceTo(at - 60_000);
    const chaseBefore = chase.balance;
    const capBefore = cap.balance;
    sim.advanceTo(at + 60_000);
    // Out of Chase on the day, in neither between: until 2026-10-12 it was in Capital One the same minute.
    expect(chaseBefore - chase.balance).toBe(200_00);
    expect(cap.balance).toBe(capBefore);
    expect(inTransitOf(sim, sim.player).balance).toBe(200_00);
    sim.advanceTo(at + 6 * MS_DAY);
    expect(cap.balance).toBe(capBefore + 200_00);
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
  });

  it('is held to Citi’s $10,000 a day out to other banks, and says so', () => {
    const sim = lifeAt('us-citi', 'g16-citi');
    const citi = primary(sim);
    expect(citi.bankId).toBe('us-citi');
    fund(sim, citi.id, 20_000_00);
    const chase = sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-chase' }).accountId]!;
    const at = sim.now + 3 * MS_DAY;
    run(sim, 'bank.schedule_payment', { fromId: citi.id, toId: chase.id, amount: 12_000_00, at });
    sim.advanceTo(at - 60_000);
    const before = citi.balance;
    sim.advanceTo(at + 60_000);
    expect(citi.balance).toBe(before);
    expect(inTransitOf(sim, sim.player).balance).toBe(0);
    expect(notices(sim, 'A Scheduled Payment Didn’t Go').join(' ')).toMatch(/a day out to other banks/);
  });
});

describe('PLAYER JOURNEY: a standing order into savings at another bank', () => {
  it('goes from the current account on its day and lands in the sending bank’s days', () => {
    const sim = lifeAt('us-chase', 'g16-so-x');
    const chase = primary(sim);
    fund(sim, chase.id, 3_000_00);
    secondBank(sim);
    const saver = openSavingsAt(sim, 'us-capital-one');
    const p = zonedParts(sim.now + 3 * MS_DAY, sim.zone);
    run(sim, 'bank.add_standing_order', { toId: saver.id, amount: 50_00, day: p.day });
    const item = sim.universe.scheduled.find((i) => i.kind === 'bank.standing_order' && i.status === 'pending')!;
    sim.advanceTo(item.at - 60_000);
    const chaseBefore = chase.balance;
    const saverBefore = saver.balance;
    sim.advanceTo(item.at + 60_000);
    expect(paymentsOf(sim.player).standingOrders[0]!.fromId).toBe(chase.id);
    expect(chaseBefore - chase.balance).toBe(50_00);
    expect(saver.balance).toBe(saverBefore);
    expect(inTransitOf(sim, sim.player).balance).toBe(50_00);
    sim.advanceTo(item.at + 6 * MS_DAY);
    expect(saver.balance).toBe(saverBefore + 50_00);
  });
});

describe('an account the bank has blocked, on a payment’s day', () => {
  it('makes no standing order into dormant savings, and says why', () => {
    const sim = lifeAt('us-chase', 'g16-dormant');
    const chase = primary(sim);
    fund(sim, chase.id, 1_000_00);
    const saver = openSavingsAt(sim, 'us-chase');
    run(sim, 'bank.add_standing_order', { toId: saver.id, amount: 50_00, day: zonedParts(sim.now + 3 * MS_DAY, sim.zone).day });
    const item = sim.universe.scheduled.find((i) => i.kind === 'bank.standing_order' && i.status === 'pending')!;
    // FIXTURE: the savings untouched past Chase's months, set by hand rather than played for years.
    saver.dormant = true;
    const before = saver.balance;
    sim.advanceTo(item.at + 60_000);
    expect(saver.balance).toBe(before);
    expect(notices(sim, 'A Standing Order Didn’t Go').join(' ')).toMatch(/dormant/);
  });

  it('makes no payment set for a date out of an account a switch left in debt, or into one closing', () => {
    const sim = lifeAt('us-chase', 'g16-blocked');
    const chase = primary(sim);
    fund(sim, chase.id, 1_000_00);
    const saver = openSavingsAt(sim, 'us-chase');
    const at = sim.now + 2 * MS_DAY;
    run(sim, 'bank.schedule_payment', { fromId: chase.id, toId: saver.id, amount: 100_00, at });
    run(sim, 'bank.schedule_payment', { fromId: saver.id, toId: chase.id, amount: 1_00, at: at + MS_DAY });
    // FIXTURE: the states a switch and a restricted close leave, set by hand.
    chase.switchDebt = true;
    const before = { chase: chase.balance, saver: saver.balance };
    sim.advanceTo(at + 60_000);
    expect(saver.balance).toBe(before.saver);
    expect(notices(sim, 'A Scheduled Payment Didn’t Go').join(' ')).toMatch(/paying off what it owes/);
    delete chase.switchDebt;
    chase.closingAt = at + 30 * MS_DAY;
    sim.advanceTo(at + MS_DAY + 60_000);
    expect(saver.balance).toBe(before.saver);
    expect(notices(sim, 'A Scheduled Payment Didn’t Go').join(' ')).toMatch(/is closing/);
  });
});

describe('a term deposit', () => {
  it('takes no standing order, and no payment set for a date goes into it or out of it', () => {
    const sim = lifeAt('us-chase', 'g16-term');
    const chase = primary(sim);
    fund(sim, chase.id, 5_000_00);
    const term = sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_term', { amount: 1_000_00 }).accountId]!;
    expect(term.category).toBe('term');
    expect(refused(sim, 'bank.add_standing_order', { toId: term.id, amount: 50_00, day: 15 })).toMatch(/term deposit/);
    expect(refused(sim, 'bank.schedule_payment', { fromId: term.id, toId: chase.id, amount: 500_00, at: sim.now + 2 * MS_DAY })).toMatch(/term deposit/);
    expect(refused(sim, 'bank.schedule_payment', { fromId: chase.id, toId: term.id, amount: 500_00, at: sim.now + 2 * MS_DAY })).toMatch(/term deposit/);
    expect(paymentsOf(sim.player).standingOrders).toHaveLength(0);
  });

  it('lets nothing out on a payment a save set from it before 2026-10-12', () => {
    const sim = lifeAt('us-chase', 'g16-term-old');
    const chase = primary(sim);
    fund(sim, chase.id, 5_000_00);
    const term = sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_term', { amount: 1_000_00 }).accountId]!;
    // FIXTURE: a payment from the term deposit, as the command set one until 2026-10-12.
    sim.schedule({ at: sim.now + MS_DAY, kind: SCHEDULED_KIND, label: 'x', category: 'home', priority: 37, payload: { personId: sim.player.id, fromId: term.id, toId: chase.id, amount: 500_00 } });
    const before = term.balance;
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(term.balance).toBeGreaterThanOrEqual(before);
    expect(notices(sim, 'A Scheduled Payment Didn’t Go').join(' ')).toMatch(/term deposit/);
  });
});

describe('savings linked to the current account', () => {
  it('is refused where the only savings is at another bank, which the link doesn’t reach', () => {
    const sim = lifeAt('us-chase', 'g16-link');
    const chase = primary(sim);
    fund(sim, chase.id, 3_000_00);
    secondBank(sim);
    const away = openSavingsAt(sim, 'us-capital-one');
    // FIXTURE: Chase's own savings closed by hand, so the savings at Capital One is the only easy-access savings.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings' && a.bankId === 'us-chase') a.closedAt = sim.now;
    expect(away.closedAt).toBeUndefined();
    expect(refused(sim, 'bank.set_payments', { linkSavings: true })).toMatch(/no savings account at Chase/);
    expect(paymentsOf(sim.player).linkSavings).toBe(false);
    const own = openSavingsAt(sim, 'us-chase');
    expect(own.bankId).toBe('us-chase');
    run(sim, 'bank.set_payments', { linkSavings: true });
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
  });
});
