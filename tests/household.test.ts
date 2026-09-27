/**
 * What living costs: rent and bills on the first, food with the day's meals,
 * paid from checking, then the card, then owed to the landlord; a day that
 * can't buy its food isn't eaten; and owing weighs on somebody.
 *
 * And the card: a statement on the 20th and a payment due on the 15th, the
 * grace period kept by paying in full, interest on a balance carried, a late
 * payment's fee and its mark on the record, and the rate the record buys.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import {
  arrearsOf, billsOf, canPay, costsAt, foodOf, inTrouble, mealOf, rentOf, spend, troubles,
} from '@/engine/systems/household';
import { aprFor, cardTerms, minimumDue, scoreIsANumberIn, scoreWord } from '@/engine/systems/credit';
import { PUBLISHED_RENTS, rentAt } from '@/engine/content/rents';
import { lookAfterRefusal } from '@/engine/systems/life';
import { saveCurrency } from '@/engine/core/money';
import { MS_DAY, MS_HOUR, instantFromZoned, startOfNextDay, zonedParts } from '@/engine/core/time';
import { deadline, latePenalty } from '@/engine/systems/taxreturn';

const accounts = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const card = (sim: Simulation) => accounts(sim).find((a) => a.kind === 'credit_card')!;
const on = (sim: Simulation, y: number, m: number, d: number, h: number) => instantFromZoned({ year: y, month: m, day: d, hour: h }, sim.zone);
/** Checking set to an amount, and savings emptied: payments draw on both. */
const setChecking = (sim: Simulation, to: number) => {
  const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings');
  if (savings && savings.balance !== 0) {
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: savings.id, amount: -savings.balance }, { accountId: sim.nominalAccount('income', 'Test').id, amount: savings.balance }] });
  }
  const c = checking(sim);
  const move = to - c.balance;
  if (move === 0) return;
  sim.post({ memo: 'test', category: 'test', postings: [{ accountId: c.id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
};

describe('the cost of living', () => {
  it('is the same sum on the creation page as in play', () => {
    const sim = quickSave();
    const costs = costsAt(sim.player.home!.cityId, 'shared', saveCurrency(sim.universe), sim.now);
    // The bills are the year's average month on the page, and this month's by the climate in play (`billsFactor`).
    expect([rentOf(sim, sim.player), foodOf(sim, sim.player), mealOf(sim, sim.player)]).toEqual([costs.rent, costs.day, costs.meal]);
    expect(Math.abs(billsOf(sim, sim.player) - costs.bills)).toBeLessThanOrEqual(costs.bills);
    // A room is the room figure, a place of your own the one-bedroom and
    // every bill: in Mosfellsbær, HMS's capital-region rent, and a room at 55%.
    const own = quickSave({ housing: 'own' }, 'own');
    const figure = rentAt(sim.player.home!.cityId, 'ISK');
    expect(figure.kind).toBe('published');
    expect(rentOf(own, own.player)).toBe(205_000_00);
    expect(rentOf(sim, sim.player)).toBe(Math.round(figure.room / 100) * 100);
    expect(figure.room).toBe(Math.round(205_000_00 * 0.55));
    expect(billsOf(own, own.player)).toBeGreaterThan(billsOf(sim, sim.player));
  });

  it('takes the rent and bills at eight on the first, after that day’s pay, and the ledger balances', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'rent');
    const first = on(sim, 2026, 2, 1, 20);
    sim.advanceTo(first - MS_HOUR);
    const before = checking(sim).balance;
    sim.advanceTo(first + MS_HOUR);
    expect(before - checking(sim).balance).toBe(rentOf(sim, sim.player) + billsOf(sim, sim.player));
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('buys the day’s food with its meals, and a day it can’t buy isn’t eaten', () => {
    const fed = quickSave({ wealth: 'comfortable' }, 'food');
    const broke = quickSave({ wealth: 'nothing' }, 'food');
    setChecking(broke, 0);
    const before = checking(fed).balance;
    const seven = startOfNextDay(fed.now, fed.zone) + 7 * MS_HOUR;
    fed.advanceTo(seven);
    broke.advanceTo(seven);
    expect(before - checking(fed).balance).toBe(foodOf(fed, fed.player));
    expect(fed.player.wellbeing.nourishment).toBeGreaterThanOrEqual(76);
    // Eaten thin: what's in the cupboard.
    expect(broke.player.wellbeing.nourishment).toBeLessThan(76);
    expect(broke.player.wellbeing.nourishment).toBeGreaterThanOrEqual(40);
    expect(broke.universe.notifications.some((n) => n.title === 'No Money For Food Today')).toBe(true);
  });

  it('weighs a card behind or suspended, and a return past its day unfiled with its penalty, where it used to say all clear', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'worry-card');
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && !a.closedAt)!;
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: card.id, amount: -100_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: 100_00 }] });
    expect(troubles(sim, sim.player).some((t) => t.kind === 'card_behind')).toBe(false);
    sim.player.credit!.missed = 1;
    expect(troubles(sim, sim.player)).toContainEqual({ kind: 'card_behind', amount: 100_00 });
    sim.player.credit!.missed = 0;
    sim.player.credit!.suspended = 'late';
    expect(troubles(sim, sim.player).some((t) => t.kind === 'card_behind')).toBe(true);

    const late = quickSave({ wealth: 'comfortable' }, 'worry-return');
    const year = zonedParts(late.now, late.zone).year - 1;
    late.player.returns = { [year]: { year, figures: { balance: 1_000_00 } } as never };
    expect(late.now).toBeLessThan(deadline(year));
    expect(troubles(late, late.player).some((t) => t.kind === 'return_late')).toBe(false);
    late.advanceTo(deadline(year) + 70 * MS_DAY);
    // Set again past the day, in place of the year's own the season made.
    late.player.returns = { [year]: { year, figures: { balance: 1_000_00 } } as never };
    const due = troubles(late, late.player).find((t) => t.kind === 'return_late')!;
    expect(due.amount).toBe(1_000_00 + latePenalty(1_000_00, deadline(year), late.now, saveCurrency(late.universe)));
    expect(due.amount).toBeGreaterThan(1_000_00);
    // A refund owed back is no trouble, and doesn't net against a balance owed.
    late.player.returns = { [year]: { year, figures: { balance: -1_000_00 } } as never };
    expect(troubles(late, late.player).some((t) => t.kind === 'return_late')).toBe(false);
    late.player.returns = { [year]: { year, figures: { balance: 1_000_00 } } as never, [year - 1]: { year: year - 1, figures: { balance: -900_00 } } as never };
    expect(troubles(late, late.player).find((t) => t.kind === 'return_late')!.amount).toBe(due.amount);
  });

  it('weighs a medical debt, a debt in collections and a tax balance owed, each alone, and not once paid', () => {
    const over = quickSave({ wealth: 'comfortable' }, 'worry-overdrawn');
    setChecking(over, -40_00);
    expect(troubles(over, over.player)).toEqual([{ kind: 'overdrawn', amount: 40_00 }]);
    for (const kind of ['medical', 'collections', 'tax'] as const) {
      const sim = quickSave({ wealth: 'comfortable' }, `worry-${kind}`);
      expect(inTrouble(sim, sim.player)).toBe(false);
      if (kind === 'tax') {
        sim.player.returns = { 2026: { year: 2026, owed: 500_00, filedAt: 1, figures: { balance: 500_00 } } as never, 2027: { year: 2027, owed: 200_00, filedAt: 1, figures: { balance: 200_00 } } as never };
        expect(troubles(sim, sim.player)).toEqual([{ kind: 'tax', amount: 700_00 }]);
      }
      else {
        const debt = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category: kind, name: 'Owed', ownerId: sim.player.id, institution: 'Them', openedAt: sim.now });
        sim.post({ memo: 'test', category: 'test', postings: [{ accountId: debt.id, amount: -100_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: 100_00 }] });
        expect(inTrouble(sim, sim.player)).toBe(true);
        expect(troubles(sim, sim.player)).toEqual([{ kind, amount: 100_00 }]);
        // Paid off, the account stands at nothing and weighs nothing.
        sim.post({ memo: 'test', category: 'test', postings: [{ accountId: debt.id, amount: 100_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -100_00 }] });
        expect(inTrouble(sim, sim.player)).toBe(false);
        continue;
      }
      expect(inTrouble(sim, sim.player)).toBe(true);
    }
  });

  it('pays from checking, then the card, then owes the landlord, and pays the landlord back when money comes', () => {
    const sim = quickSave({}, 'order');
    setChecking(sim, 100_00);
    const free = (card(sim).creditLimit ?? 0) + card(sim).balance;
    const big = 100_00 + free + 5_000_00;
    expect(spend(sim, sim.player, big, 'Rent', 'rent', true)).toBe(true);
    expect(checking(sim).balance).toBe(0);
    expect(card(sim).balance).toBe(-(card(sim).creditLimit ?? 0));
    expect(arrearsOf(sim, sim.player)).toBe(5_000_00);
    expect(inTrouble(sim, sim.player)).toBe(true);
    expect(troubles(sim, sim.player)).toEqual([{ kind: 'landlord', amount: 5_000_00 }, { kind: 'card', amount: card(sim).creditLimit ?? 0 }]);
    // Food isn't owed: not enough, and nothing is spent.
    expect(spend(sim, sim.player, 1_00, 'Groceries', 'food')).toBe(false);
    // Money comes in, and the next midnight buys the day's food and pays the
    // landlord with what's left.
    setChecking(sim, 3_000_00);
    sim.advanceTo(startOfNextDay(sim.now, sim.zone) + MS_HOUR);
    expect(arrearsOf(sim, sim.player)).toBe(5_000_00 - (3_000_00 - foodOf(sim, sim.player)));
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('weighs on somebody every day they owe', () => {
    const owing = quickSave({ wealth: 'comfortable' }, 'worry');
    const clear = quickSave({ wealth: 'comfortable' }, 'worry');
    // More than the bank and the card together, so some of it is owed.
    spend(owing, owing.player, canPay(owing, owing.player) + 1_000_00, 'Rent', 'rent', true);
    for (let d = 0; d < 5; d += 1) {
      const next = startOfNextDay(owing.now, owing.zone) + 7 * MS_HOUR;
      owing.advanceTo(next);
      clear.advanceTo(next);
    }
    expect(owing.player.wellbeing.stress).toBeGreaterThan(clear.player.wellbeing.stress + 3);
    expect(owing.player.wellbeing.morale).toBeLessThan(clear.player.wellbeing.morale - 5);
  });

  it('charges a meal, and refuses one nobody can pay for', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'meal');
    sim.player.wellbeing.nourishment = 40;
    const before = checking(sim).balance;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
    expect(before - checking(sim).balance).toBe(mealOf(sim, sim.player));
    const broke = quickSave({ wealth: 'nothing' }, 'meal-broke');
    setChecking(broke, 0);
    broke.player.wellbeing.nourishment = 40;
    expect(lookAfterRefusal(broke, 'eat')).toMatch(/afford/);
  });
});

describe('the card', () => {
  it('states on the 20th and takes the minimum on the 15th, and a carried balance draws the month’s interest', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'card');
    expect(sim.player.credit!.autopay).toBe('full');
    // Autopay on the minimum: autopay asks for the whole of what it's set to,
    // and a current account short of it sends the payment back (`systems/credit.ts`).
    expect(sim.execute({ kind: 'finance.set_autopay', payload: { mode: 'minimum' } }).ok).toBe(true);
    // Spend on the card, then leave checking with enough for the minimum only.
    spend(sim, sim.player, checking(sim).balance + 10_000_00, 'Rent', 'rent', true);
    setChecking(sim, 0);
    sim.advanceTo(on(sim, 2026, 1, 20, 10));
    const statement = sim.player.credit!.statementBalance;
    expect(statement).toBe(-card(sim).balance);
    const minimum = minimumDue(sim, statement);
    // Just enough in checking for the minimum, on the morning it's due.
    sim.advanceTo(on(sim, 2026, 2, 15, 11));
    setChecking(sim, minimum);
    const score = sim.player.credit!.score;
    sim.advanceTo(on(sim, 2026, 2, 15, 13));
    expect(sim.player.credit!.paidSinceStatement).toBe(minimum);
    expect(sim.player.credit!.carrying).toBe(true);
    expect(sim.player.credit!.score).toBeGreaterThan(score - 20);
    // Carried, so the next statement charges a month at the card's rate.
    const owed = -card(sim).balance;
    // The bank's own card's rate (`cardTerms`); it was the American estimate for every card until 2026-09-26.
    const apr = cardTerms(sim, card(sim), sim.player.credit!.score).apr;
    // Groceries go on the card too once checking is empty, so the interest is
    // read off its own line, on the balance the statement found.
    const beforeStatement = () => -card(sim).balance;
    sim.advanceTo(on(sim, 2026, 2, 20, 9) - 1);
    const carried = beforeStatement();
    sim.advanceTo(on(sim, 2026, 2, 20, 10));
    const interest = sim.universe.transactions.filter((t) => t.memo === 'Interest').at(-1)!;
    // Built day by day and compounded (`card.interest`). The first statement wasn't paid in full, so the grace
    // period is lost back to the day the spending went on: from early January to the February statement.
    const charged = -interest.postings.find((p) => p.accountId === card(sim).id)!.amount;
    expect(charged).toBeGreaterThan(Math.round(carried * apr * 25 / 365));
    expect(charged).toBeLessThan(Math.round(carried * apr * 50 / 365) * 1.1);
    expect(carried).toBeGreaterThanOrEqual(owed);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('keeps its grace period paid in full, and costs a fee and the record when a payment is late', () => {
    const full = quickSave({ wealth: 'comfortable' }, 'card-full');
    // Switched to the minimum and back: the command does both.
    expect(full.execute({ kind: 'finance.set_autopay', payload: { mode: 'minimum' } }).ok).toBe(true);
    expect(full.player.credit!.autopay).toBe('minimum');
    expect(full.execute({ kind: 'finance.set_autopay', payload: { mode: 'full' } }).ok).toBe(true);
    spend(full, full.player, 1_000_00, 'Groceries', 'food');
    full.advanceTo(on(full, 2026, 2, 21, 10));
    expect(card(full).balance).toBeGreaterThan(-1_000_00 - 1);
    expect(full.player.credit!.carrying).toBe(false);

    const late = quickSave({ wealth: 'modest' }, 'card-late');
    late.advanceTo(on(late, 2026, 1, 20, 10));
    setChecking(late, 0);
    const score = late.player.credit!.score;
    const before = card(late).balance;
    late.advanceTo(on(late, 2026, 2, 15, 13));
    expect(late.player.credit!.late).toHaveLength(1);
    expect(late.player.credit!.score).toBeLessThanOrEqual(score - 50);
    expect(card(late).balance).toBeLessThan(before);
    expect(late.universe.notifications.some((n) => n.title === 'A Late Card Payment')).toBe(true);
  });

  it('is priced by the record, and paid by hand when the player wants', () => {
    expect(aprFor(812)).toBeLessThan(aprFor(700));
    expect(aprFor(700)).toBeLessThan(aprFor(520));
    const sim = quickSave({}, 'pay-by-hand');
    const owed = -card(sim).balance;
    expect(owed).toBeGreaterThan(0);
    const paid = sim.execute<{ paid: number }>({ kind: 'finance.pay_card', payload: { amount: 'full' } });
    expect(paid.value?.paid).toBe(owed);
    expect(card(sim).balance).toBe(0);
    expect(sim.execute({ kind: 'finance.pay_card', payload: { amount: 'full' } }).ok).toBe(false);
  });

  it('is kept on the US scale, said as a number only where lenders use one', () => {
    expect(scoreIsANumberIn(defaultConfig().startLocationId)).toBe(false);
    expect(scoreWord(610)).toBe('Fair');
    expect(scoreIsANumberIn('us-ny-newyork')).toBe(true);
    const sim = quickSave();
    expect(sim.player.credit!.score).toBe(610);
  });
});

describe('a save from before any of it', () => {
  it('is given a home and a credit record on the way in, with its rent and statement on the calendar', () => {
    const made = createSave(1, 'before-home', { ...defaultConfig() });
    const old = JSON.parse(JSON.stringify(made.universe));
    old.meta.schemaVersion = 88;
    for (const person of Object.values(old.people) as Record<string, unknown>[]) { delete person.home; delete person.credit; }
    old.scheduled = old.scheduled.filter((i: { kind: string }) => !['home.rent', 'card.statement'].includes(i.kind));
    const steps = migrate(old).steps;
    expect(steps.some((s) => s.startsWith('Gave the character a room'))).toBe(true);
    expect(steps.some((s) => s.startsWith('Opened a credit record'))).toBe(true);
    const sim = loadSave(old);
    expect(sim.timeline.pending().filter((i) => i.kind === 'home.rent')).toHaveLength(1);
    expect(sim.timeline.pending().filter((i) => i.kind === 'card.statement')).toHaveLength(1);
    expect(zonedParts(sim.timeline.pending().find((i) => i.kind === 'home.rent')!.at, sim.zone)).toMatchObject({ day: 1, hour: 20 });
    void MS_DAY;
  });
});

describe('rent', () => {
  it('is published where it is, scaled to it elsewhere in the country, and the atlas’s estimate where nothing is', () => {
    // Reykjavík's two-room flat, from Iceland's housing agency.
    expect(rentAt('is-39-reykjavik', 'ISK')).toMatchObject({ oneBed: 250_000_00, kind: 'published' });
    // Kópavogur has no figure of its own: the atlas's rent, scaled by how far
    // it was off in Reykjavík and Mosfellsbær.
    const kopavogur = rentAt('is-39-kopavogur', 'ISK');
    expect(kopavogur.kind).toBe('calibrated');
    expect(kopavogur.oneBed).toBeGreaterThan(150_000_00);
    expect(kopavogur.oneBed).toBeLessThan(300_000_00);
    // New York's room is SpareRoom's, not 55% of the one-bedroom.
    expect(rentAt('us-ny-newyork', 'USD')).toMatchObject({ oneBed: 2_655_00, room: 1_515_00 });
    // Every published figure says what it measures, when, and where from.
    for (const one of PUBLISHED_RENTS) {
      expect(one.source, one.cityId).toMatch(/^https:\/\//);
      expect(one.measure.length, one.cityId).toBeGreaterThan(10);
    }
  });
});
