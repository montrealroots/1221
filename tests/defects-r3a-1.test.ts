/**
 * Group R3a, found by the verifier of group R1 and fixed on 2026-10-12: a meal whose hour crosses midnight is one the
 * command buys when the menu offers it.
 *
 * - `life.look_after` lived a meal's hour first and paid for it after. The day's groceries are bought at midnight
 *   (`buyTheDaysFood`), so a meal ordered at 11:40 PM met them inside its hour: at Chase in New York, with a dollar more
 *   than the day's groceries and less than the groceries and the meal together, the menu offered the meal, the
 *   groceries spent the money at midnight, and the command said "The payment didn’t go through." The time went back,
 *   and they stayed hungry. It was so for every way of paying.
 * - Now the meal is paid for when it's ordered, as one is bought, before its hour is lived: the meal is had, and the
 *   day's groceries are what can't be paid for, which says so in the morning's notice.
 *
 * PLAYER JOURNEYS through Look After Yourself's own menu and command, on a real save played up to 11:40 PM. A TEST
 * SETUP sets a balance against a test line and clears the calendar, as named where it's done.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Account } from '@/engine/core/ledger';
import type { Simulation } from '@/engine/core/simulation';
import { formatTime } from '@/engine/core/time';
import { cardOf } from '@/engine/systems/credit';
import { walletOf } from '@/engine/systems/cash';
import { costFor, lookAfterOptions, minutesFor, startOfLocalDay, type LookAfter } from '@/engine/systems/life';
import { arrearsOf, foodOf } from '@/engine/systems/spending';

type Payer = 'debit' | 'credit' | 'cash';
const NYC = 'us-ny-newyork';
const MEMO: Record<'eat' | 'order', string> = { eat: 'A meal', order: 'A meal delivered' };

/** Test setup: an account's balance set, against a test equity line. */
function setTo(sim: Simulation, account: Account, amount: number): void {
  const diff = amount - account.balance;
  if (diff) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: diff }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -diff }] });
}
/** Test setup: nothing on the calendar in the way. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}

/**
 * A Chase customer in New York at 11:40 PM, hungry, paying the day the way named, with no savings, the credit card
 * full and the overdraft not opted into for the debit card, and `money` (from the meal's price and the day's groceries)
 * in the account, or in the wallet for somebody paying the day in cash. The groceries for the next day are bought at
 * the midnight 20 minutes on.
 */
function atTwentyToMidnight(payer: Payer, seed: string, money: (meal: number, day: number) => number, action: 'eat' | 'order') {
  const sim = quickSave({ startLocationId: NYC, homeRegionId: NYC, livesWhereBorn: true, wealth: 'modest', bankId: 'us-chase' }, seed);
  clearCalendar(sim);
  sim.must({ kind: 'bank.set_payments', payload: { everyday: payer } });
  const midnight = startOfLocalDay(sim, sim.now + 24 * 3_600_000);
  sim.advanceTo(midnight - 20 * 60_000);
  clearCalendar(sim);
  const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.closedAt && !a.nominal);
  for (const a of mine) if (a.kind === 'savings') setTo(sim, a, 0);
  const card = cardOf(sim, sim.player)!;
  setTo(sim, card, -(card.creditLimit ?? 0));
  const meal = costFor(sim, action);
  const day = foodOf(sim, sim.player);
  const has = money(meal, day);
  const wallet = walletOf(sim, sim.player, true)!;
  const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
  setTo(sim, wallet, payer === 'cash' ? has : 0);
  setTo(sim, current, payer === 'cash' ? 0 : has);
  sim.player.wellbeing.nourishment = 40;
  return { sim, midnight, meal, day, has, paysFrom: payer === 'cash' ? wallet : current };
}

const groceriesAt = (sim: Simulation, at: number) => sim.universe.transactions.filter((t) => t.memo === 'Groceries' && t.at === at);
const noFood = (sim: Simulation, since: number) => sim.universe.notifications.filter((n) => n.title === 'No Money For Food Today' && n.at >= since);

describe('a meal whose hour crosses midnight, with money for it or the day’s groceries but not both', () => {
  for (const action of ['eat', 'order'] as const satisfies readonly LookAfter[])
    for (const payer of ['debit', 'credit', 'cash'] as const) {
      it(`is offered and bought at 11:40 PM, ${action === 'eat' ? 'eaten' : 'ordered in'} and paid ${payer === 'cash' ? 'in cash' : `by ${payer} card`}: paid for as it’s ordered, and the groceries are what go without`, () => {
        const { sim, midnight, meal, day, has, paysFrom } = atTwentyToMidnight(payer, `r3a-midnight-${action}-${payer}`, (m, d) => Math.max(m, d) + 1_00, action);
        const clock = sim.now;
        // The case: 11:40 PM, an hour that runs past midnight, and enough for either but not both.
        expect(formatTime(clock, sim.homeZone)).toBe('11:40 PM');
        expect(clock + minutesFor(sim, action) * 60_000).toBeGreaterThan(midnight);
        expect(has).toBeGreaterThanOrEqual(meal);
        expect(has).toBeGreaterThanOrEqual(day);
        expect(has).toBeLessThan(meal + day);
        // The menu offers it, and the command buys it.
        expect(lookAfterOptions(sim).find((o) => o.action === action)!.refused).toBeUndefined();
        const tried = sim.execute<{ doneAt: number; changed: { nourishment?: number } }>({ kind: 'life.look_after', payload: { action } });
        expect(tried.error).toBeUndefined();
        expect(tried.ok).toBe(true);
        expect(sim.now).toBe(clock + minutesFor(sim, action) * 60_000);
        expect(tried.value!.changed.nourishment).toBeGreaterThan(0);
        // Paid for at 11:40 PM, when it was ordered, out of the way the day is paid.
        const bought = sim.universe.transactions.filter((t) => t.memo === MEMO[action] && t.at >= clock);
        expect(bought.map((t) => t.at)).toEqual([clock]);
        expect(bought[0]!.postings.find((p) => p.accountId === paysFrom.id)?.amount).toBe(-meal);
        // The groceries weren't bought at midnight, and the morning's notice says so; nothing is owed.
        expect(groceriesAt(sim, midnight)).toEqual([]);
        expect(sim.player.fedOn).not.toBe(midnight);
        expect(noFood(sim, midnight)).toHaveLength(1);
        expect(paysFrom.balance).toBe(has - meal);
        expect(arrearsOf(sim, sim.player)).toBe(0);
      });
    }

  it('buys both, the meal at 11:40 PM and the groceries at midnight, where there’s money for both', () => {
    for (const payer of ['debit', 'credit', 'cash'] as const) {
      const { sim, midnight, paysFrom } = atTwentyToMidnight(payer, `r3a-midnight-both-${payer}`, (m, d) => m + d, 'eat');
      const clock = sim.now;
      expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
      expect(sim.universe.transactions.filter((t) => t.memo === 'A meal' && t.at >= clock).map((t) => t.at)).toEqual([clock]);
      expect(groceriesAt(sim, midnight)).toHaveLength(1);
      expect(sim.player.fedOn).toBe(midnight);
      expect(noFood(sim, midnight)).toEqual([]);
      expect(paysFrom.balance).toBe(0);
      expect(arrearsOf(sim, sim.player)).toBe(0);
    }
  });
});
