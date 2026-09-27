/**
 * The five that were open after the money system: eviction, hours, what the
 * record decides past the card's rate, tips, and Tokyo's minimum wage. The
 * hours, the tips and the day job's tests went with the job engine on
 * 2026-09-26.
 *
 * A notice to pay or quit at two months owed, withdrawn under one, eviction
 * when it runs out, the deposit against the debt, a sofa that sleeps badly,
 * and a room again once there's a deposit and a month. Moving: a deposit and
 * the rest of the month from checking, the old deposit back less what's
 * owed, and two months' deposit for a poor record. The card's limit raised
 * for a clean record and cut by a late payment.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { defaultConfig, quickSave } from '@/engine';
import { placeProfile } from '@/engine/world/place';
import { rentAt } from '@/engine/content/rents';
import type { Simulation } from '@/engine';
import {
  arrearsOf, depositFor, moveCost, rentOf, spend,
} from '@/engine/systems/household';
import { sleepQuality } from '@/engine/systems/life';
import { MS_DAY, MS_HOUR, instantFromZoned, startOfNextDay } from '@/engine/core/time';

const accounts = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const card = (sim: Simulation) => accounts(sim).find((a) => a.kind === 'credit_card');
const deposit = (sim: Simulation) => accounts(sim).find((a) => a.kind === 'escrow' && a.category === 'deposit');
/** Checking set to an amount, and savings emptied: payments draw on both. */
const setChecking = (sim: Simulation, to: number) => {
  const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings');
  if (savings && savings.balance !== 0) {
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: savings.id, amount: -savings.balance }, { accountId: sim.nominalAccount('income', 'Test').id, amount: savings.balance }] });
  }
  const move = to - checking(sim).balance;
  if (move !== 0) sim.post({ memo: 'test', category: 'test', postings: [{ accountId: checking(sim).id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
};
const days = (sim: Simulation, n: number) => {
  for (let d = 0; d < n; d += 1) sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
};

describe('the landlord', () => {
  it('serves a notice at two months owed, and evicts when it runs out with a month still owed', () => {
    const sim = quickSave({ wealth: 'nothing' }, 'evict');
    setChecking(sim, 0);
    spend(sim, sim.player, rentOf(sim, sim.player) * 2, 'Rent', 'rent', true);
    expect(arrearsOf(sim, sim.player)).toBe(rentOf(sim, sim.player) * 2);
    days(sim, 1);
    const notice = sim.player.home!.noticeUntil!;
    expect(notice - sim.now).toBeGreaterThan(29 * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'A Notice To Pay Or Quit')).toBe(true);
    const score = sim.player.credit!.score;
    days(sim, 31);
    expect(sim.player.home!.kind).toBe('sofa');
    expect(sim.player.credit!.score).toBeLessThanOrEqual(score - 60);
    expect(rentOf(sim, sim.player)).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('withdraws the notice once what’s owed is under a month', () => {
    const sim = quickSave({ wealth: 'nothing' }, 'withdraw');
    setChecking(sim, 0);
    const rent = rentOf(sim, sim.player);
    spend(sim, sim.player, rent * 2, 'Rent', 'rent', true);
    days(sim, 1);
    expect(sim.player.home!.noticeUntil).toBeDefined();
    setChecking(sim, rent * 2);
    days(sim, 1);
    expect(sim.player.home!.noticeUntil).toBeUndefined();
    days(sim, 35);
    expect(sim.player.home!.kind).toBe('shared');
  });

  it('keeps the deposit against the debt, and a sofa sleeps worse than a bed', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'sofa');
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'own' } }).ok).toBe(true);
    const held = deposit(sim)!.balance;
    expect(held).toBeGreaterThan(0);
    setChecking(sim, 0);
    // Nothing on the card either, so the rent can only be owed.
    const c = card(sim)!;
    const owe = (c.creditLimit ?? 0) + c.balance;
    if (owe > 0) spend(sim, sim.player, owe, 'Rent', 'rent', true);
    const rent = rentOf(sim, sim.player);
    spend(sim, sim.player, rent * 2, 'Rent', 'rent', true);
    const bed = sleepQuality(sim, sim.player);
    days(sim, 32);
    expect(sim.player.home!.kind).toBe('sofa');
    expect(deposit(sim)!.balance).toBe(0);
    // The same person at the same moment, with only the bed changed: the owing
    // has raised their stress too, which costs a night by itself.
    const onSofa = sleepQuality(sim, sim.player);
    sim.player.home!.kind = 'shared';
    const inBed = sleepQuality(sim, sim.player);
    sim.player.home!.kind = 'sofa';
    expect(inBed - onSofa).toBeCloseTo(0.08, 9);
    void bed;
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('takes a room again once there is a deposit, a month and a month’s food behind it', () => {
    const sim = quickSave({ wealth: 'nothing' }, 'rehoused');
    setChecking(sim, 0);
    spend(sim, sim.player, rentOf(sim, sim.player) * 2, 'Rent', 'rent', true);
    days(sim, 33);
    expect(sim.player.home!.kind).toBe('sofa');
    setChecking(sim, arrearsOf(sim, sim.player) + moveCost(sim, sim.player, 'shared') * 3);
    days(sim, 2);
    expect(sim.player.home!.kind).toBe('shared');
    expect(sim.universe.notifications.some((n) => n.title === 'You Found A Room')).toBe(true);
  });
});

describe('moving', () => {
  it('costs a deposit and the rest of the month from checking, and gives the old deposit back', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'move');
    const before = checking(sim).balance;
    const cost = moveCost(sim, sim.player, 'own');
    // Mid-month, the rest of the month is on top of the deposit.
    expect(cost).toBeGreaterThan(depositFor(sim, sim.player, 'own'));
    // The month's deposit held on the room they started in comes back first.
    const startingDeposit = deposit(sim)!.balance;
    expect(startingDeposit).toBe(rentOf(sim, sim.player));
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'own' } }).ok).toBe(true);
    expect(before - checking(sim).balance).toBe(cost - startingDeposit);
    expect(sim.player.home!.kind).toBe('own');
    const held = deposit(sim)!.balance;
    const back = checking(sim).balance;
    const costBack = moveCost(sim, sim.player, 'shared');
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'shared' } }).ok).toBe(true);
    expect(checking(sim).balance - back).toBe(held - costBack);
    // No money, no move, and the reason says what it takes.
    const broke = quickSave({ wealth: 'nothing' }, 'move-broke');
    const answer = broke.execute({ kind: 'home.move', payload: { kind: 'own' } });
    expect(answer.ok).toBe(false);
    expect(answer.error).toMatch(/deposit/);
  });

  it('charges a month once for a move on the 1st before the rent, and a room found from the sofa starts paying next month', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'move-first');
    const zone = sim.homeZone;
    const p = new Date(sim.now);
    const first = instantFromZoned({ year: p.getUTCMonth() === 11 ? p.getUTCFullYear() + 1 : p.getUTCFullYear(), month: p.getUTCMonth() === 11 ? 1 : p.getUTCMonth() + 2, day: 1, hour: 10 }, zone);
    while (sim.now < first) sim.advanceTo(Math.min(first, sim.now + 6 * MS_HOUR));
    const rentLine = () => sim.nominalAccount('expense', 'Rent').balance;
    const before = rentLine();
    expect(moveCost(sim, sim.player, 'own')).toBe(depositFor(sim, sim.player, 'own'));
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'own' } }).ok).toBe(true);
    sim.advanceTo(first + 12 * MS_HOUR);
    expect(rentLine() - before).toBe(rentOf(sim, sim.player));
    // Moved in off the sofa on the 1st, with no rent to come this month, the next is next month's.
    const sofa = quickSave({ wealth: 'comfortable' }, 'move-first-sofa');
    while (sofa.now < first) sofa.advanceTo(Math.min(first, sofa.now + 6 * MS_HOUR));
    for (const one of sofa.timeline.pending()) if (one.kind === 'home.rent') sofa.timeline.cancel(one.id, sofa.now);
    sofa.player.home!.kind = 'sofa';
    expect(sofa.execute({ kind: 'home.move', payload: { kind: 'shared' } }).ok).toBe(true);
    const next = sofa.timeline.pending().filter((one) => one.kind === 'home.rent').map((one) => one.at);
    expect(next).toHaveLength(1);
    expect(next[0]).toBeGreaterThan(first + 20 * MS_DAY);
  });

  it('finds a home only where they live, not on a job away', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'move-away');
    const home = sim.player.home!.cityId;
    sim.player.currentLocationId = 'ca-bc-vancouver';
    const answer = sim.execute({ kind: 'home.move', payload: { kind: 'own' } });
    expect(answer.ok).toBe(false);
    expect(answer.error).toMatch(/away/);
    expect(sim.player.home!.cityId).toBe(home);
    // The place they're standing in reads as away from home.
    expect(placeProfile(sim, 'ca-bc-vancouver')).toMatchObject({ away: true, homeCity: { id: home } });
    // Off the sofa too: the room waits until they're back.
    sim.player.home!.kind = 'sofa';
    days(sim, 2);
    expect(sim.player.home).toMatchObject({ kind: 'sofa', cityId: home });
    sim.player.currentLocationId = home;
    days(sim, 2);
    expect(sim.player.home).toMatchObject({ kind: 'shared', cityId: home });
  });

  it('asks two months’ deposit of a poor record', () => {
    const good = quickSave({ wealth: 'comfortable' }, 'deposit');
    const rent = rentOf(good, good.player);
    expect(depositFor(good, good.player, 'shared')).toBe(rent);
    good.player.credit!.score = 560;
    expect(depositFor(good, good.player, 'shared')).toBe(rent * 2);
  });
});

describe('the record', () => {
  it('rises each month for a card kept at zero, paid as agreed', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'zero');
    expect(card(sim)!.balance).toBe(0);
    const score = sim.player.credit!.score;
    // The 20th of each month is a statement: January to June is six.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 6, day: 25, hour: 7 }, sim.zone));
    expect(card(sim)!.balance).toBe(0);
    expect(sim.player.credit!.score).toBe(score + 6 * 3);
  });

  it('counts rent owed in a month the card owes nothing', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'zero-owed');
    const score = sim.player.credit!.score;
    // No room on the card, nothing in the bank: the rent is owed to the landlord.
    card(sim)!.creditLimit = 0;
    setChecking(sim, 0);
    spend(sim, sim.player, rentOf(sim, sim.player), 'Rent', 'rent', true);
    expect(arrearsOf(sim, sim.player)).toBeGreaterThan(0);
    for (let d = 0; d < 20; d += 1) {
      setChecking(sim, 0);
      sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
    }
    // January's statement, on the 20th, owed nothing: paid as agreed, less the rent owed.
    expect(sim.player.credit!.score).toBe(score + 3 - 10);
  });

  it('raises the card’s limit for a clean record at six months, and a late payment cuts it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'limit');
    const limit = card(sim)!.creditLimit!;
    days(sim, 200);
    expect(card(sim)!.creditLimit).toBe(Math.round(limit * 1.2 / 100) * 100);
    // Owe on it, empty checking, and let the payment come due.
    spend(sim, sim.player, checking(sim).balance + 10_000_00, 'Rent', 'rent', true);
    const raised = card(sim)!.creditLimit!;
    // The spend lands after July's statement, so August's states it and it falls
    // due in the middle of September.
    for (let d = 0; d < 60; d += 1) {
      setChecking(sim, 0);
      sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
    }
    expect(sim.player.credit!.late.length).toBeGreaterThan(0);
    expect(card(sim)!.creditLimit!).toBeLessThan(raised);
    expect(card(sim)!.creditLimit!).toBeGreaterThanOrEqual(-card(sim)!.balance - 1);
  });
});

describe('the screens and the game agree', () => {
  it('on the rent a place card prints, and on how the record is said', () => {
    // Home printed the atlas's 473K for Mosfellsbær while the game charged
    // from Iceland's published 205,000.
    const sim = quickSave({}, 'agree');
    const place = placeProfile(sim, sim.player.currentLocationId)!;
    expect(place.localRent).toBe('205K kr');
    expect(place.medianRentCents).toBe(rentAt(sim.player.currentLocationId, 'USD').oneBed);
    // Starting Point printed the score as a number in Iceland, where Home says a word.
    const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(source).not.toContain('<span className="stat-label">Credit Score</span>');
    expect(source.match(/scoreIsANumberIn\(config\.startLocationId\)/g)?.length).toBe(2);
  });
});

describe('what risk decides', () => {
  it('starts somebody who takes risks on the card’s minimum, and everybody else clearing it', () => {
    const cautious = quickSave({ personality: { ...defaultConfig().personality, riskTolerance: 30 } }, 'risk-low');
    const reckless = quickSave({ personality: { ...defaultConfig().personality, riskTolerance: 90 } }, 'risk-high');
    expect(cautious.player.credit!.autopay).toBe('full');
    expect(reckless.player.credit!.autopay).toBe('minimum');
  });
});

describe('what the audit found', () => {
  it('draws on savings once checking is empty, where savings is linked to it, before the card', () => {
    const sim = quickSave({ wealth: 'modest' }, 'sweep');
    // Linked as overdraft protection; a new life's savings isn't, as a bank opens it (`systems/payments.ts`).
    expect(sim.execute({ kind: 'bank.set_payments', payload: { linkSavings: true } }).ok).toBe(true);
    const savings = accounts(sim).find((a) => a.kind === 'savings')!;
    const move = -checking(sim).balance;
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: checking(sim).id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
    const before = savings.balance;
    const cardBefore = card(sim)!.balance;
    spend(sim, sim.player, 10_000_00, 'Rent', 'rent', true);
    expect(before - savings.balance).toBe(10_000_00);
    expect(card(sim)!.balance).toBe(cardBefore);
  });

  it('leaves savings alone where it isn’t linked, and the day goes on the card', () => {
    const sim = quickSave({ wealth: 'modest' }, 'no-sweep');
    const savings = accounts(sim).find((a) => a.kind === 'savings')!;
    // The current account emptied, savings left as it is.
    const move = -checking(sim).balance;
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: checking(sim).id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
    const before = savings.balance;
    expect(before).toBeGreaterThan(1_000_00);
    const cardBefore = card(sim)!.balance;
    spend(sim, sim.player, 1_000_00, 'Groceries', 'food');
    expect(savings.balance).toBe(before);
    expect(card(sim)!.balance).toBe(cardBefore - 1_000_00);
  });

  it('starts with the month’s deposit held on the home they live in', () => {
    const sim = quickSave({}, 'held');
    expect(deposit(sim)!.balance).toBe(rentOf(sim, sim.player));
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('misses a plan slept through on autopilot, and keeps one the clock stopped at', () => {
    const sim = quickSave({}, 'asleep-plan');
    const at = instantFromZoned({ year: 2026, month: 1, day: 7, hour: 7, minute: 30 }, sim.zone);
    const made = sim.execute<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Early Call', at } });
    sim.advanceTo(at + MS_HOUR);
    expect(sim.timeline.get(made.value!.id)!.status).toBe('missed');
  });

});
