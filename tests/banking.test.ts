/**
 * SLATE — banking, and the four things an account could not do.
 *
 * There was a banking system here once and it was cut with the American half of
 * the game: Northbank and Meridian, a Centurion and a Sapphire Reserve, credit
 * scores and certificates of deposit. What came back is not that file. It is the
 * four things a twenty-five-year measurement found an account could not do, and
 * every test here is one of them.
 *
 * The measurement, read off the ledger of a played career before any of this
 * existed: the savings account had ONE posting in a quarter of a century, its own
 * opening balance. The card carried EUR 840 from before the game started,
 * declared 22.49%, and was charged nothing. There was no way to move money
 * between two accounts the same person held. And both parents' accounts took
 * three and four hundred postings, every one of them inbound — money went in and
 * never once came out.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { isLiability, type Account } from '@/engine/core/ledger';
import {
  CARD_A_YEAR, CARD_LEAST_FLOOR, DEPOSIT_A_YEAR,
} from '@/engine/content/banking';
import {
  accountsOf, aMonthOfInterest, earnedInTheYear, leastOnTheCard, settleTheReturn,
  theMinimumGetsPaid, transfer, whyNotTransfer,
} from '@/engine/world/banking';
import { computeAnnualTax } from '@/engine/content/tax';

const MS_DAY = 86_400_000;

const mine = (sim: Simulation): Account[] => accountsOf(sim, sim.universe.playerId);

/**
 * Puts money in an account the way money gets into an account.
 *
 * Assigning a balance is what `ledger.audit()` exists to catch — a cached number
 * that no longer equals the sum of its postings — and the first draft of this file
 * did it five times and was caught five times, which is the guard working.
 */
const fund = (sim: Simulation, account: Account, cents: number): void => {
  sim.income(account.id, cents - account.balance, 'Carried From Before', 'opening');
};
const kindOf = (sim: Simulation, kind: string): Account =>
  mine(sim).find((one) => one.kind === kind)!;

describe('a deposit earns and a current account does not', () => {
  it('pays a twelfth of the year on what is sitting in savings', () => {
    const sim = quickSave({}, 'bank-deposit');
    const savings = kindOf(sim, 'savings');
    fund(sim, savings, 100_000_00);
    // Posted rather than assigned, which is the rule this file is written to: a
    // balance is still the sum of its postings afterwards.
    const before = sim.universe.transactions.length;
    const { earned } = aMonthOfInterest(sim);
    expect(earned).toBe(Math.round(100_000_00 * (DEPOSIT_A_YEAR / 12)));
    expect(savings.balance).toBe(100_000_00 + earned);
    expect(sim.universe.transactions.length).toBeGreaterThan(before);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('pays nothing on the account the money moves through', () => {
    // And that is the design rather than an omission. A transaction account
    // paying a rate would make "leave it or move it" into no decision, and it
    // would be false besides — it is the whole reason deposit accounts exist.
    const sim = quickSave({}, 'bank-current');
    const checking = kindOf(sim, 'checking');
    fund(sim, checking, 100_000_00);
    aMonthOfInterest(sim);
    expect(checking.balance).toBe(100_000_00);
  });

  it('is worth having over a career, and not worth being handed', () => {
    // The size of the prize, because a rate nobody can feel is a rate that only
    // moves a number. Five hundred thousand left on deposit for ten years.
    const sim = quickSave({}, 'bank-ten-years');
    const savings = kindOf(sim, 'savings');
    fund(sim, savings, 500_000_00);
    for (let month = 0; month < 120; month += 1) aMonthOfInterest(sim);
    expect(savings.balance).toBeGreaterThan(600_000_00);
    expect(savings.balance, 'a rate this size is a different game').toBeLessThan(800_000_00);
  });
});

describe('the card is charged, which it never was', () => {
  it('charges the rate written on the account against what is owed', () => {
    const sim = quickSave({}, 'bank-card');
    const card = kindOf(sim, 'credit_card');
    const owed = -card.balance;
    expect(owed, 'a save is supposed to open carrying something on the card').toBeGreaterThan(0);
    expect(card.apr).toBe(CARD_A_YEAR);

    const { charged } = aMonthOfInterest(sim);
    expect(charged).toBe(Math.round(owed * (CARD_A_YEAR / 12)));
    // More owed, not less money: the charge is against the liability and never
    // touches a cash account, which is the whole trouble with a card.
    expect(card.balance).toBe(-(owed + charged));
    expect(kindOf(sim, 'checking').balance, 'the charge came out of the wrong place')
      .toBe(mine(sim).find((one) => one.kind === 'checking')!.balance);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('charges nothing on a card with nothing on it', () => {
    const sim = quickSave({}, 'bank-clear');
    const card = kindOf(sim, 'credit_card');
    transfer(sim, kindOf(sim, 'checking').id, card.id, -card.balance);
    expect(card.balance).toBe(0);
    expect(aMonthOfInterest(sim).charged).toBe(0);
  });

  it('is a cost somebody can get out of rather than a trap they cannot', () => {
    // THE FIRST VERSION OF THIS WAS A TRAP AND THE MEASUREMENT SAID SO. A save
    // opens carrying EUR 840 at 22.49%, nobody chose that balance, and with
    // nothing paying it down the card reached MINUS EUR 216,487 over twenty-five
    // played years — a quarter of everything the career earned, taken silently
    // from an opening condition the player was handed. A mechanism escapable only
    // by knowing it is there is a tax on not having read the source.
    //
    // So the autopilot finds the minimum, the way it already eats and sleeps for
    // somebody who has not said otherwise. Measured after: the card clears in
    // fifty-four months and costs EUR 496 in interest on EUR 840 of debt, which is
    // what a card actually does to somebody who pays the minimum.
    const sim = quickSave({}, 'bank-minimum');
    const card = kindOf(sim, 'credit_card');
    fund(sim, kindOf(sim, 'checking'), 50_000_00);
    const owed = -card.balance;
    let months = 0;
    let interest = 0;
    while (card.balance < 0 && months < 600) {
      interest += aMonthOfInterest(sim).charged;
      theMinimumGetsPaid(sim);
      months += 1;
    }
    expect(card.balance, 'the card never cleared').toBe(0);
    expect(months, 'the minimum cleared it too fast to be a minimum').toBeGreaterThan(24);
    expect(months, 'the minimum never gets anywhere').toBeLessThan(120);
    expect(interest, 'it cost nothing, so the rate decides nothing').toBeGreaterThan(owed / 4);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('pays nothing at all for somebody with nothing to pay it with', () => {
    // Which is what being short actually does: the card goes on compounding.
    const sim = quickSave({}, 'bank-broke');
    for (const one of mine(sim)) if (!isLiability(one.kind)) fund(sim, one, 0);
    expect(theMinimumGetsPaid(sim)).toBe(0);
    const card = kindOf(sim, 'credit_card');
    const owed = -card.balance;
    aMonthOfInterest(sim);
    expect(-card.balance).toBeGreaterThan(owed);
  });

  it('says what a person in this position would be asked for', () => {
    const sim = quickSave({}, 'bank-least');
    const card = kindOf(sim, 'credit_card');
    // `leastOnTheCard` is pure — it reads a balance and returns a figure, so it
    // is asked directly rather than through a save. Three percent of what is owed,
    // the floor under it, and the whole of a balance smaller than the floor.
    expect(leastOnTheCard({ ...card, balance: -1_000_000_00 })).toBe(Math.round(1_000_000_00 * 0.03));
    expect(leastOnTheCard({ ...card, balance: -50_000 })).toBe(CARD_LEAST_FLOOR);
    expect(leastOnTheCard({ ...card, balance: -1_000 })).toBe(1_000);
    expect(leastOnTheCard({ ...card, balance: 0 })).toBe(0);
  });
});

describe('money can be moved between two accounts one person holds', () => {
  it('moves it as one transaction with two sides', () => {
    const sim = quickSave({}, 'bank-move');
    const checking = kindOf(sim, 'checking');
    const savings = kindOf(sim, 'savings');
    fund(sim, checking, 10_000_00);
    const was = savings.balance;

    expect(transfer(sim, checking.id, savings.id, 4_000_00).ok).toBe(true);
    expect(checking.balance).toBe(6_000_00);
    expect(savings.balance).toBe(was + 4_000_00);
    // One transaction, because a transfer is a single fact and the ledger must
    // not be able to hold half of it.
    const last = sim.universe.transactions[sim.universe.transactions.length - 1]!;
    expect(last.postings).toHaveLength(2);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('is how a card gets cleared faster than the minimum', () => {
    const sim = quickSave({}, 'bank-clear-fast');
    const checking = kindOf(sim, 'checking');
    const card = kindOf(sim, 'credit_card');
    fund(sim, checking, 10_000_00);
    const owed = -card.balance;
    expect(transfer(sim, checking.id, card.id, owed).ok).toBe(true);
    expect(card.balance).toBe(0);
    expect(aMonthOfInterest(sim).charged, 'a cleared card still charged').toBe(0);
  });

  it('refuses everything it should, and says why', () => {
    const sim = quickSave({}, 'bank-refuse');
    const checking = kindOf(sim, 'checking');
    const savings = kindOf(sim, 'savings');
    const card = kindOf(sim, 'credit_card');
    fund(sim, checking, 1_000_00);

    expect(whyNotTransfer(sim, checking.id, checking.id, 100)).toContain('same account');
    expect(whyNotTransfer(sim, 'nope', savings.id, 100)).toContain('no such account');
    expect(whyNotTransfer(sim, checking.id, 'nope', 100)).toContain('no such account');
    expect(whyNotTransfer(sim, checking.id, savings.id, 0)).toContain('how much');
    expect(whyNotTransfer(sim, checking.id, savings.id, 2_000_00)).toContain('there’s');
    // Out of a card is a cash advance, which is a different product at a
    // different rate and is not modeled, so it is not offered.
    expect(whyNotTransfer(sim, card.id, checking.id, 100)).toContain('out of a card');
    // And into one only as far as what is owed.
    expect(whyNotTransfer(sim, checking.id, card.id, 1_000_00)).toContain('is owed');
    // Somebody else's pocket is not yours to move money into.
    const parent = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    const theirs = accountsOf(sim, parent.id)[0];
    if (theirs) {
      expect(whyNotTransfer(sim, checking.id, theirs.id, 100)).toContain('accounts you hold');
    }
  });
});

describe('income tax falls due, which it never did', () => {
  it('counts what came in from somewhere else and not what was moved about', () => {
    // THE RULE, AND THE FIRST VERSION GOT IT WRONG IN A WAY THAT LOOKED RIGHT.
    // The draft counted money arriving from an income nominal, which catches an
    // acting fee and misses a board draw entirely — `payTheBoard` is a transfer
    // between two real accounts. Measured: the parents took EUR 26.6m in board
    // pay across twenty-five years and the first version assessed them for
    // thirteen euros.
    const sim = quickSave({}, 'bank-earned');
    const me = sim.universe.people[sim.universe.playerId]!;
    const checking = kindOf(sim, 'checking');
    const savings = kindOf(sim, 'savings');
    const year = new Date(sim.now).getUTCFullYear();

    const before = earnedInTheYear(sim, me.id, year);
    sim.income(checking.id, 100_000_00, 'A Part', 'production');
    expect(earnedInTheYear(sim, me.id, year)).toBe(before + 100_000_00);

    // Moving it about is not earning it again.
    transfer(sim, checking.id, savings.id, 50_000_00);
    expect(earnedInTheYear(sim, me.id, year), 'a transfer read as income').toBe(before + 100_000_00);
  });

  it('charges the engine’s own table rather than a rate of its own', () => {
    const sim = quickSave({}, 'bank-return');
    const me = sim.universe.people[sim.universe.playerId]!;
    const checking = kindOf(sim, 'checking');
    fund(sim, checking, 1_000_000_00);
    const year = new Date(sim.now).getUTCFullYear();
    sim.income(checking.id, 200_000_00, 'A Part', 'production');

    const gross = earnedInTheYear(sim, me.id, year);
    const expected = computeAnnualTax(gross, me.currentLocationId, sim.now).total;
    expect(expected, 'the tax table returned nothing for the place the player lives')
      .toBeGreaterThan(0);
    expect(settleTheReturn(sim, me, year)).toBe(expected);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('charges nobody for a year they earned nothing in', () => {
    const sim = quickSave({}, 'bank-nothing');
    const me = sim.universe.people[sim.universe.playerId]!;
    expect(settleTheReturn(sim, me, 1900)).toBe(0);
  });

  it('bills the parents on their board pay, which is the outflow they never had', () => {
    // The parents' accounts used to be one-way: three and four hundred postings
    // across a career and every one inbound. A board draw is employment income
    // and is taxed like it.
    const sim = quickSave({}, 'bank-parents');
    sim.advanceTo(sim.now + 400 * MS_DAY);
    const player = sim.universe.people[sim.universe.playerId]!;
    const parents = (player.relations ?? [])
      .filter((one) => one.kind === 'mother' || one.kind === 'father')
      .map((one) => sim.universe.people[one.toId])
      .filter((one): one is NonNullable<typeof one> => one !== undefined);
    expect(parents.length, 'no parents to bill').toBeGreaterThan(0);

    const year = new Date(sim.now).getUTCFullYear() - 1;
    let billed = 0;
    for (const parent of parents) {
      const drew = earnedInTheYear(sim, parent.id, year);
      expect(drew, `${parent.firstName} drew nothing in ${year}`).toBeGreaterThan(0);
      billed += settleTheReturn(sim, parent, year);
    }
    expect(billed, 'the board pays no tax on what it draws').toBeGreaterThan(0);
    expect(sim.ledger.audit()).toEqual([]);
  });
});
