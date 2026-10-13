/**
 * Group R1, part 1, found by the verifier of group g4 and fixed on 2026-10-12: a meal the menu offers is one the
 * command buys, for every way of paying, and a payment that comes up short balances.
 *
 * - `canPay` counted cash in hand for every payer, and `spend` draws on it only for somebody paying the day in cash,
 *   or behind a locked debit card. So at Chase in New York, with a cent in the account, $3 left on the credit card
 *   and $100 in cash, Look After Yourself offered a $7 meal. Paid by credit card, the command then failed with "A
 *   meal doesn’t balance": `spend` took the $3 the credit card paid first off what the bank came up short twice. Paid
 *   by debit card, the meal was bought by owing it in Bills Owed, with nothing owed allowed. A payment that isn't
 *   food, which cash never pays, was owed the same way.
 * - Now cash counts only where `spend` spends it. Paid by card with cash in hand, the menu and the command say the
 *   bank and the card can't pay, and what would spend the cash; so does the morning's notice when the groceries
 *   aren't bought, which said there was nothing left to pay with whatever the reason.
 * - The French debit card's ceiling branch of `spendRefusal` had no test of its own: with it gone, every test still
 *   passed.
 *
 * PLAYER JOURNEYS through Look After Yourself's own menu and command, on real saves; a property sweep of `spend`
 * against `spendRefusal`, and against what `spend` pays with owing allowed, across the ways of paying, the bank, cash
 * in hand, the credit card's room, a locked debit card, the overdraft opt-in, linked savings, the French ceiling and
 * a payment that isn't food, in New York and in Paris. A TEST SETUP sets a
 * balance against a test line, locks the debit card as the bank's app or phone line does, or spends the French card
 * toward its ceiling, as named where it's done.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Account } from '@/engine/core/ledger';
import type { Simulation } from '@/engine/core/simulation';
import { cardOf } from '@/engine/systems/credit';
import { cardCeilingRoom, overdraftHeadroom, purchaseMayOverdraw } from '@/engine/systems/lending';
import { costFor, lookAfterOptions, lookAfterRefusal } from '@/engine/systems/life';
import { walletOf } from '@/engine/systems/cash';
import { plasticOf } from '@/engine/systems/security';
import { arrearsOf, buyTheDaysFood, spend, spendRefusal } from '@/engine/systems/spending';

type Payer = 'debit' | 'credit' | 'cash';
const NYC = 'us-ny-newyork';
const PARIS = 'fr-idf-paris';
const lifeAt = (cityId: string, bankId: string, seed: string) =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'modest', bankId }, seed);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.closedAt && !a.nominal);
const savings = (sim: Simulation) => mine(sim).find((a) => a.kind === 'savings' && a.category !== 'term');
/** Test setup: an account's balance set, against a test equity line. */
function setTo(sim: Simulation, account: Account, amount: number): void {
  const diff = amount - account.balance;
  if (diff) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: diff }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -diff }] });
}
/** Test setup: the credit card with this much room left on it. */
function cardRoomTo(sim: Simulation, room: number): void {
  const card = cardOf(sim, sim.player)!;
  setTo(sim, card, -((card.creditLimit ?? 0) - room));
}
/** Test setup: nothing on the calendar in the way. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
const menuLine = (sim: Simulation, action: string) => lookAfterOptions(sim).find((o) => o.action === action)!;
/** What the player has in the bank, on the card and in hand, account by account. */
const balances = (sim: Simulation) => Object.fromEntries(mine(sim).map((a) => [a.id, a.balance]));

/**
 * The verifier's case: a Chase customer in New York, hungry, with no savings, a cent in the account, $3 left on the
 * credit card and $100 in cash, paying the day the way named. The overdraft isn't opted into for the debit card.
 */
function aCentAndCash(payer: Payer, seed: string): Simulation {
  const sim = lifeAt(NYC, 'us-chase', seed);
  clearCalendar(sim);
  sim.must({ kind: 'bank.set_payments', payload: { everyday: payer } });
  for (const a of mine(sim)) if (a.kind === 'savings') setTo(sim, a, 0);
  setTo(sim, primary(sim), 1);
  cardRoomTo(sim, 3_00);
  setTo(sim, walletOf(sim, sim.player, true)!, 100_00);
  sim.player.wellbeing.nourishment = 40;
  return sim;
}

describe('cash in hand, for somebody who pays the day by card', () => {
  for (const payer of ['credit', 'debit'] as const) {
    it(`isn’t counted for a meal paid ${payer === 'credit' ? 'by credit card' : 'by debit card'}: the menu grays it, and the command refuses it in the same words, before the hour, taking and owing nothing`, () => {
      const sim = aCentAndCash(payer, `r1-cash-${payer}`);
      const meal = costFor(sim, 'eat');
      // The case: the bank and the card short of it, cash enough, and an overdraft a debit card purchase can't use.
      expect(meal).toBeGreaterThan(3_01);
      expect(meal).toBeLessThan(100_00);
      expect(purchaseMayOverdraw(sim, sim.player)).toBe(false);
      expect(overdraftHeadroom(sim, sim.player)).toBeGreaterThan(meal);
      const words = 'The bank and the card can’t pay it. Cash in hand pays for the day where The Day’s Spending is In Cash, Then The Debit Card.';
      expect(menuLine(sim, 'eat').refused).toBe(words);
      expect(menuLine(sim, 'order').refused).toBe(words);
      const clock = sim.now;
      const before = balances(sim);
      const posted = sim.universe.transactions.length;
      const tried = sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
      expect(tried.ok).toBe(false);
      expect(tried.error).toBe(words);
      expect(sim.now).toBe(clock);
      expect(balances(sim)).toEqual(before);
      expect(sim.universe.transactions.length).toBe(posted);
      expect(arrearsOf(sim, sim.player)).toBe(0);
    });
  }

  it('is spent first by somebody paying the day in cash: the same meal is offered, and bought out of the wallet', () => {
    const sim = aCentAndCash('cash', 'r1-cash-cash');
    const meal = costFor(sim, 'eat');
    expect(lookAfterRefusal(sim, 'eat')).toBeUndefined();
    const wallet = walletOf(sim, sim.player)!;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
    expect(wallet.balance).toBe(100_00 - meal);
    expect(arrearsOf(sim, sim.player)).toBe(0);
  });

  it('isn’t counted for a payment that isn’t food: the bank overdrawn to its limit, the card full and cash in hand, it’s refused, not owed', () => {
    const sim = aCentAndCash('debit', 'r1-cash-school');
    // TEST SETUP: the account overdrawn as far as its overdraft goes, and the card full.
    setTo(sim, primary(sim), primary(sim).balance - overdraftHeadroom(sim, sim.player) - 1);
    cardRoomTo(sim, 0);
    expect(spendRefusal(sim, sim.player, 50_00, 'school')).toBe('You can’t afford it.');
    const before = balances(sim);
    expect(spend(sim, sim.player, 50_00, 'Required protective equipment for work-study', 'school')).toBe(false);
    expect(balances(sim)).toEqual(before);
    expect(arrearsOf(sim, sim.player)).toBe(0);
  });
});

describe('the morning’s groceries, not bought', () => {
  const said = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title === 'No Money For Food Today').at(-1)?.body;

  it('say why: the cash a card payer’s day doesn’t spend, a locked debit card, or nothing left at all', () => {
    // Paid by debit card, the bank and the card short and the cash in hand unspent.
    const unspent = aCentAndCash('debit', 'r1-groceries-cash');
    cardRoomTo(unspent, 0);
    expect(buyTheDaysFood(unspent, unspent.player)).toBe(false);
    expect(said(unspent)).toMatch(/^A day’s groceries cost \$\d+\.\d\d\. The bank and the card can’t pay it\. Cash in hand pays for the day where The Day’s Spending is In Cash, Then The Debit Card\. It’s what’s in the cupboard today/);
    expect(walletOf(unspent, unspent.player)!.balance).toBe(100_00);
    expect(arrearsOf(unspent, unspent.player)).toBe(0);
    // The debit card locked with plenty behind it.
    const locked = aCentAndCash('debit', 'r1-groceries-locked');
    setTo(locked, primary(locked), 1_000_00);
    setTo(locked, walletOf(locked, locked.player)!, 0);
    cardRoomTo(locked, 0);
    plasticOf(locked, primary(locked), 'debit').locked = true;
    expect(buyTheDaysFood(locked, locked.player)).toBe(false);
    expect(said(locked)).toMatch(/\. Your debit card is locked, and there isn’t enough on the credit card or in cash\. It’s what’s/);
    // Nothing anywhere.
    const broke = aCentAndCash('debit', 'r1-groceries-broke');
    setTo(broke, walletOf(broke, broke.player)!, 0);
    cardRoomTo(broke, 0);
    expect(buyTheDaysFood(broke, broke.player)).toBe(false);
    expect(said(broke)).toMatch(/, and there’s nothing left to pay with\. It’s what’s in the cupboard today, and not enough of it\.$/);
  });
});

describe('a payment the bank comes up short on', () => {
  it('balances with the credit card paid first: what’s owed is what the bank and the card together couldn’t pay', () => {
    const sim = aCentAndCash('credit', 'r1-owed');
    const meal = costFor(sim, 'eat');
    const card = cardOf(sim, sim.player)!;
    const cardBefore = card.balance;
    // With owing allowed, the card's $3 first, the account's cent, and the rest owed. Until 2026-10-12 the $3 came
    // off what was owed a second time, and the transaction didn't balance.
    expect(spend(sim, sim.player, meal, 'A meal', 'food', true)).toBe(true);
    expect(cardBefore - card.balance).toBe(3_00);
    expect(primary(sim).balance).toBe(0);
    expect(arrearsOf(sim, sim.player)).toBe(meal - 3_00 - 1);
    expect(walletOf(sim, sim.player)!.balance).toBe(100_00);
  });
});

/**
 * Test setup: a Paris life at BNP Paribas paying the day the way named, its debit card spent to within `ceiling` of
 * its ceiling this month, with plenty in the bank, no cash and `room` on the credit card.
 */
function nearTheCeiling(payer: Payer, ceiling: number, room: number, seed: string): Simulation {
  const sim = lifeAt(PARIS, 'fr-bnp-paribas', seed);
  clearCalendar(sim);
  sim.must({ kind: 'bank.set_payments', payload: { everyday: payer } });
  // TEST SETUP: the month's shopping on the debit card, up to `ceiling` short of its ceiling.
  const spent = cardCeilingRoom(sim, sim.player)! - ceiling;
  sim.post({ memo: 'Groceries', category: 'food', postings: [{ accountId: primary(sim).id, amount: -spent }, { accountId: sim.nominalAccount('expense', 'Food').id, amount: spent }] });
  setTo(sim, primary(sim), 10_000_00);
  setTo(sim, walletOf(sim, sim.player, true)!, 0);
  cardRoomTo(sim, room);
  sim.player.wellbeing.nourishment = 40;
  return sim;
}

describe('a French debit card past its ceiling', () => {
  const words = 'Your debit card is past its payment ceiling, and there isn’t enough on the credit card.';

  it('grays a meal the credit card can’t take, though the bank holds plenty, and the command refuses it in the same words', () => {
    const sim = nearTheCeiling('debit', 0, 1_00, 'r1-ceiling-short');
    expect(cardCeilingRoom(sim, sim.player)).toBe(0);
    expect(menuLine(sim, 'eat').refused).toBe(words);
    const clock = sim.now;
    const before = balances(sim);
    const tried = sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(tried.error).toBe(words);
    expect(sim.now).toBe(clock);
    expect(balances(sim)).toEqual(before);
  });

  it('offers it where the credit card has the room, and the credit card pays it', () => {
    const sim = nearTheCeiling('debit', 0, 100_00, 'r1-ceiling-card');
    const meal = costFor(sim, 'eat');
    const card = cardOf(sim, sim.player)!;
    const cardBefore = card.balance;
    expect(lookAfterRefusal(sim, 'eat')).toBeUndefined();
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
    expect(cardBefore - card.balance).toBe(meal);
  });

  it('counts what a credit card payer’s card takes first, and a cash payer’s cash, before the ceiling', () => {
    // Credit first: the card's part first, so the debit card's is under the ceiling.
    const credit = nearTheCeiling('credit', 1_00, 0, 'r1-ceiling-credit');
    const meal = costFor(credit, 'eat');
    cardRoomTo(credit, meal - 1_00);
    expect(lookAfterRefusal(credit, 'eat')).toBeUndefined();
    cardRoomTo(credit, meal - 1_00 - 1);
    expect(lookAfterRefusal(credit, 'eat')).toBe(words);
    // Cash first: what's left after it.
    const cash = nearTheCeiling('cash', 1_00, 0, 'r1-ceiling-cash');
    setTo(cash, walletOf(cash, cash.player)!, meal - 1_00);
    expect(lookAfterRefusal(cash, 'eat')).toBeUndefined();
    setTo(cash, walletOf(cash, cash.player)!, meal - 1_00 - 1);
    expect(lookAfterRefusal(cash, 'eat')).toBe(words);
  });
});

/** One combination of the sweep. */
interface Case {
  where: 'us' | 'fr';
  payer: Payer;
  /** In the account: overdrawn to the limit, a cent, half the price, or plenty. */
  bank: 'overdrawn' | 'cent' | 'half' | 'plenty';
  cash: 'none' | 'half' | 'all';
  card: 'full' | 'half' | 'plenty';
  linked: boolean;
  locked: boolean;
  /** At Chase, the debit card's overdraft opt-in; in Paris, the ceiling's room left. */
  optIn?: boolean;
  ceiling?: 'none' | 'half' | 'plenty';
  category: 'food' | 'school';
}

/**
 * Every combination for food. For a payment that isn't food, which neither cash nor the debit card's lock or ceiling
 * touches, every combination of the bank, the card, the cash and the savings link, paid the day by debit card or in
 * cash, at each bank.
 */
function cases(): Case[] {
  const out: Case[] = [];
  for (const where of ['us', 'fr'] as const)
    for (const payer of ['debit', 'credit', 'cash'] as const)
      for (const bank of ['overdrawn', 'cent', 'half', 'plenty'] as const)
        for (const cash of ['none', 'half', 'all'] as const)
          for (const card of ['full', 'half', 'plenty'] as const)
            for (const linked of [false, true]) {
              const base = { where, payer, bank, cash, card, linked };
              if (payer !== 'credit') out.push({ ...base, locked: false, optIn: false, ceiling: 'none', category: 'school' });
              for (const locked of [false, true]) {
                if (where === 'us') for (const optIn of [false, true]) out.push({ ...base, locked, optIn, category: 'food' });
                else for (const ceiling of ['none', 'half', 'plenty'] as const) out.push({ ...base, locked, ceiling, category: 'food' });
              }
            }
  return out;
}

const PRICE = 20_00;
const level = (what: 'none' | 'half' | 'all' | 'full' | 'plenty', price: number) =>
  what === 'none' || what === 'full' ? 0 : what === 'half' ? Math.floor(price / 2) : what === 'all' ? price : 100 * price;

/** A saved life at each bank, to open a fresh copy of for each combination. */
const BASES = { us: JSON.stringify(lifeAt(NYC, 'us-chase', 'r1-sweep-us').universe), fr: JSON.stringify(lifeAt(PARIS, 'fr-bnp-paribas', 'r1-sweep-fr').universe) };

/** A fresh copy of the life at the combination's bank, set up as it says against a price: `PRICE`, or a meal's. */
function setUp(c: Case, priceOf: (sim: Simulation) => number = () => PRICE): { sim: Simulation; price: number } {
  const sim = loadSave(JSON.parse(BASES[c.where]));
  const price = priceOf(sim);
  const current = primary(sim);
  if (c.where === 'fr') {
    // TEST SETUP: the debit card's month spent toward its ceiling.
    const spent = cardCeilingRoom(sim, sim.player)! - level(c.ceiling!, price);
    if (spent > 0) sim.post({ memo: 'Groceries', category: 'food', postings: [{ accountId: current.id, amount: -spent }, { accountId: sim.nominalAccount('expense', 'Food').id, amount: spent }] });
  } else current.debitOverdraft = c.optIn;
  setTo(sim, savings(sim)!, c.linked ? price : 0);
  sim.must({ kind: 'bank.set_payments', payload: { everyday: c.payer, linkSavings: c.linked } });
  setTo(sim, current, 0);
  if (c.bank === 'overdrawn') setTo(sim, current, -overdraftHeadroom(sim, sim.player));
  else setTo(sim, current, c.bank === 'cent' ? 1 : level(c.bank, price));
  setTo(sim, walletOf(sim, sim.player, true)!, level(c.cash, price));
  cardRoomTo(sim, level(c.card, price));
  // TEST SETUP: the debit card locked, as the bank's app or its phone line locks it.
  if (c.locked) plasticOf(sim, current, 'debit').locked = true;
  return { sim, price };
}

describe('`spendRefusal`, against what `spend` does', () => {
  it('says why exactly when `spend` can’t pay, and `spend` takes nothing then and owes nothing otherwise, for every way of paying, in New York and Paris', () => {
    const all = cases();
    const disagreed: string[] = [];
    let refused = 0;
    for (const c of all) {
      const { sim } = setUp(c);
      const why = spendRefusal(sim, sim.player, PRICE, c.category);
      if (why !== undefined) refused += 1;
      // What `spend` can pay, apart from asking `spendRefusal`: on a second copy, with owing allowed, whether all of
      // it went without anything owed.
      const { sim: other } = setUp(c);
      let paid: boolean | string;
      try {
        paid = spend(other, other.player, PRICE, 'Test', c.category, true) && arrearsOf(other, other.player) === 0;
      } catch (e) {
        paid = (e as Error).message;
      }
      // And with nothing owed allowed, as the game asks: all or nothing.
      const before = balances(sim);
      let went: boolean | string;
      try {
        went = spend(sim, sim.player, PRICE, 'Test', c.category);
      } catch (e) {
        went = (e as Error).message;
      }
      const wrong = paid !== (why === undefined)
        || went !== paid
        || (went === false && JSON.stringify(balances(sim)) !== JSON.stringify(before))
        || arrearsOf(sim, sim.player) !== 0;
      if (wrong) disagreed.push(`${JSON.stringify(c)}: ${why ?? 'offered'} / can pay ${String(paid)} / ${String(went)}`);
    }
    expect({ disagreed: disagreed.length, first: disagreed.slice(0, 5) }).toEqual({ disagreed: 0, first: [] });
    // Both outcomes are reached, often.
    expect(refused).toBeGreaterThan(all.length / 10);
    expect(all.length - refused).toBeGreaterThan(all.length / 10);
  }, 120_000);

  it('is what the menu says and what the command does, for a meal, for every way of paying, in New York and Paris', () => {
    const disagreed: string[] = [];
    for (const c of cases()) {
      if (c.category !== 'food' || c.linked || c.bank === 'plenty') continue;
      const { sim } = setUp(c, (s) => costFor(s, 'eat'));
      clearCalendar(sim);
      sim.player.wellbeing.nourishment = 40;
      const offered = menuLine(sim, 'eat').refused;
      const tried = sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
      // Bought means paid for: a meal owed in Bills Owed wasn't.
      const agree = (offered === undefined ? tried.ok : !tried.ok && tried.error === offered) && arrearsOf(sim, sim.player) === 0;
      if (!agree) disagreed.push(`${JSON.stringify(c)}: ${offered ?? 'offered'} / ${tried.ok ? 'bought' : tried.error}`);
    }
    expect({ disagreed: disagreed.length, first: disagreed.slice(0, 5) }).toEqual({ disagreed: 0, first: [] });
  }, 120_000);
});
