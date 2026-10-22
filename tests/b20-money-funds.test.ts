/**
 * Brief 20's money area, B1 and B3: what limited funds do, each through the commands a player sends and the clock, in
 * twin lives alike in everything but the money where the payment is taken (docs/verification/audit-2026-10-21/criteria.md).
 *
 * - A card payment the account can't make: Capital One's card, the day's groceries on it, autopay paying the whole
 *   statement from 360 Checking. One twin moves everything in checking into 360 Performance Savings (not linked) an hour
 *   before each of two due dates and back an hour after; the other leaves it. The first due date bounces and costs the
 *   US safe harbor's late fee, off the record (a US card reports at thirty days late); the carried statement is charged
 *   interest at the next; the second due date goes on the record, the score loses its fifty, the limit is cut to 70% and
 *   the card is suspended. A card applied for at Chase the next morning is priced at the record then: dearer for the twin
 *   who missed. What mustn't move: the savings' interest, paid at each month's end on what it held at each midnight,
 *   which the hours the money spent there never cross; and the School.
 * - A bill the account can't pay: the spring term's Yale Health plan, billed on Monday 4 January 2027, from Chase Total
 *   Checking. One twin has moved checking into Chase Savings (not linked) the evening before: the plan is owed in Bills
 *   Owed, the term's notice says so, Home's troubles count it, and the next midnight pays it back out of savings
 *   (`settleArrears`, which draws savings whatever the link) before the day's worry reads it. Her twin pays it at once.
 *   The plan is paid in both by the next morning, to the cent.
 * - A purchase the account can't make: the day's groceries on Chase's debit card, the credit card locked from Your
 *   Cards in both twins, with checking emptied into savings and no overdraft opt-in: declined, not bought, with the
 *   notice, and the day starts unfed; her twin, the money left in checking, buys them.
 *
 * PLAYER JOURNEYS: new lives as creation makes them (`newLifeConfig`), Ada Cole, born in New York, a US citizen, an
 * actor at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, with the wealthy family's money, at the bank named.
 * Every figure the tests compare is read from what the clock posted; nothing is set by hand. Seeds: b20-money-card,
 * b20-money-bill, b20-money-buy, chosen for these tests and not swapped.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { cardsOf, stateOf } from '@/engine/systems/credit';
import { arrearsOf, troubles } from '@/engine/systems/spending';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12, min = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: min }, NY);
const life = (seed: string, bankId: string): Simulation => createSave(1, seed, {
  ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId,
});
const own = (sim: Simulation, kind: Account['kind'], bankId?: string): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && !a.nominal && a.category !== 'term' && (!bankId || a.bankId === bankId))!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const posted = (sim: Simulation, account: Account, memo: RegExp, since = 0) => sim.universe.transactions
  .filter((t) => t.at >= since && memo.test(t.memo) && t.postings.some((p) => p.accountId === account.id))
  .map((t) => t.postings.filter((p) => p.accountId === account.id).reduce((n, p) => n + p.amount, 0));
const titled = (sim: Simulation, title: string, since = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= since);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Everything in checking moved into savings at an hour, by Move Money, and back two hours later. */
function awayAtDueTime(sim: Simulation, y: number, m: number, d: number): void {
  sim.advanceTo(at(y, m, d, 11));
  const checking = own(sim, 'checking');
  const savings = own(sim, 'savings');
  const moved = checking.balance;
  run(sim, 'bank.transfer', { fromId: checking.id, toId: savings.id, amount: moved });
  sim.advanceTo(at(y, m, d, 13));
  run(sim, 'bank.transfer', { fromId: savings.id, toId: checking.id, amount: moved });
}

describe('limited funds: a card payment the account can’t make', () => {
  it('bounces and is late, then goes on the record, cuts the limit and suspends the card, and a card applied for after is priced dearer; the savings’ interest and the School don’t move', () => {
    const paid = life('b20-money-card', 'us-capital-one');
    const short = life('b20-money-card', 'us-capital-one');
    for (const sim of [paid, short]) run(sim, 'bank.set_payments', { everyday: 'credit' });
    const card = (sim: Simulation) => cardsOf(sim, sim.player).find((c) => c.bankId === 'us-capital-one')!;
    const limit = card(paid).creditLimit!;

    // The first statement, on 20 September, asks the month's groceries; both twins' are the same.
    paid.advanceTo(at(2026, 9, 21)); short.advanceTo(at(2026, 9, 21));
    expect(stateOf(paid.player, card(paid)).statementBalance).toBeGreaterThan(0);
    expect(stateOf(short.player, card(short)).statementBalance).toBe(stateOf(paid.player, card(paid)).statementBalance);

    // Its due date, 15 October at noon: one twin's checking is in savings from eleven to one.
    awayAtDueTime(short, 2026, 10, 15);
    paid.advanceTo(at(2026, 10, 15, 13));
    expect(titled(short, 'A Card Payment Bounced', at(2026, 10, 15))).toHaveLength(1);
    expect(titled(short, 'A Late Card Payment', at(2026, 10, 15))).toHaveLength(1);
    expect(titled(paid, 'A Late Card Payment')).toHaveLength(0);
    // The US safe harbor's first fee, never more than the minimum it was late on (Reg Z §1026.52(b)): $25, the
    // estimated minimum of a card whose own wasn't found, where Capital One's $40 and the harbor's $30 are both more.
    expect(posted(short, card(short), /^Late fee$/)).toEqual([-25_00]);
    expect(posted(paid, card(paid), /^Late fee$/)).toEqual([]);
    // Thirty days late isn't yet: off the record, the limit and the score where they were.
    expect(short.player.credit!.late).toEqual([]);
    expect(card(short).creditLimit).toBe(limit);

    // The next statement charges the carried one's interest at 28.99%, and the twin who paid in full nothing.
    paid.advanceTo(at(2026, 10, 21)); short.advanceTo(at(2026, 10, 21));
    const interest = posted(short, card(short), /^Interest$/, at(2026, 10, 20, 0));
    expect(interest).toHaveLength(1);
    expect(-interest[0]!).toBeGreaterThan(0);
    expect(posted(paid, card(paid), /^Interest$/)).toEqual([]);

    // The second due date, 15 November, a Sunday: missed again, sixty days on, it's on the record.
    const before = { paid: paid.player.credit!.score, short: short.player.credit!.score };
    awayAtDueTime(short, 2026, 11, 15);
    paid.advanceTo(at(2026, 11, 15, 13));
    expect(short.player.credit!.late).toHaveLength(1);
    expect(paid.player.credit!.late).toEqual([]);
    expect(short.player.credit!.score).toBeLessThanOrEqual(before.short - 50);
    expect(paid.player.credit!.score).toBeGreaterThan(before.paid);
    // The lender cuts the line to 70%, rounded to the dollar, and suspends the card.
    expect(card(short).creditLimit).toBe(Math.round(limit * 0.7 / 100) * 100);
    expect(card(paid).creditLimit).toBe(limit);
    expect(stateOf(short.player, card(short)).suspended).toBe('late');
    expect(titled(short, 'Your Card Is Suspended')).toHaveLength(1);

    // A card applied for at Chase the next morning, priced when it arrives a week on: the record decides its rate.
    for (const sim of [paid, short]) {
      sim.advanceTo(at(2026, 11, 16, 10));
      expect(run<{ approved: boolean }>(sim, 'card.apply', { bankId: 'us-chase' }).approved).toBe(true);
      sim.advanceTo(at(2026, 11, 24));
    }
    const chase = { paid: own(paid, 'credit_card', 'us-chase'), short: own(short, 'credit_card', 'us-chase') };
    expect(chase.short.apr!).toBeGreaterThan(chase.paid.apr!);
    // Chase prices within 18.24%–27.74% from a record of 800 down to 580 (`priceWithin`): worked here from each score.
    const priced = (score: number) => Math.round((0.1824 + (0.2774 - 0.1824) * Math.min(1, Math.max(0, (800 - score) / 220))) * 10_000) / 10_000;
    expect(chase.paid.apr).toBe(priced(paid.player.credit!.score));
    expect(chase.short.apr).toBe(priced(short.player.credit!.score));

    // What mustn't move: 360 Performance Savings paid the same interest at each month's end to both, since the money
    // was there only between two midnights; and the School's record is the same.
    paid.advanceTo(at(2026, 12, 1)); short.advanceTo(at(2026, 12, 1));
    const saved = (sim: Simulation) => posted(sim, own(sim, 'savings'), /^Interest: /);
    expect(saved(short)).toHaveLength(4);
    expect(saved(short)).toEqual(saved(paid));
    expect(JSON.stringify(short.player.school?.tally)).toBe(JSON.stringify(paid.player.school?.tally));
  });
});

describe('limited funds: a bill the account can’t pay', () => {
  it('owes the spring term’s Yale Health plan where checking can’t pay it, says so, Home counts it owed until the next midnight pays it back from savings; her twin pays it at once', () => {
    const paid = life('b20-money-bill', 'us-chase');
    const short = life('b20-money-bill', 'us-chase');
    for (const sim of [paid, short]) run(sim, 'bank.set_payments', { everyday: 'credit' });
    for (const sim of [paid, short]) sim.advanceTo(at(2027, 1, 3, 20));
    const checking = own(short, 'checking');
    run(short, 'bank.transfer', { fromId: checking.id, toId: own(short, 'savings').id, amount: checking.balance });

    for (const sim of [paid, short]) sim.advanceTo(at(2027, 1, 4, 12));
    const plan = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Health plan, the spring term of 2027'));
    // Her twin: paid from checking, once, $1,882.
    expect(plan(paid).map((t) => t.postings.find((p) => p.accountId === own(paid, 'checking').id)?.amount)).toEqual([-1_882_00]);
    // She: nothing from checking; owed, and the term's notice says it's owed and comes out of the bank.
    expect(plan(short).map((t) => t.memo)).toEqual(['Yale Health plan, the spring term of 2027, unpaid']);
    expect(arrearsOf(short, short.player)).toBe(1_882_00);
    expect(arrearsOf(paid, paid.player)).toBe(0);
    expect(titled(short, 'Spring Term 2027 Begins').at(-1)?.body ?? titled(short, 'Spring 2027 Begins').at(-1)?.body ?? short.universe.notifications.filter((n) => n.at >= at(2027, 1, 4) && /Begins$/.test(n.title)).at(-1)?.body)
      .toContain('Your bank couldn’t cover the plan, so it’s owed: it comes out of your bank the first day there’s money for it.');
    // Owed weighs on her where Home and the day's worry read it (`troubles`), and not on her twin.
    expect(troubles(short, short.player).filter((t) => t.kind === 'owed')).toEqual([{ kind: 'owed', amount: 1_882_00 }]);
    expect(troubles(paid, paid.player)).toEqual([]);

    // The next midnight: paid back from Chase Savings, whatever the link, before the day's worry is read, so nothing
    // more weighs on her than on her twin.
    for (const sim of [paid, short]) sim.advanceTo(at(2027, 1, 5, 0, 1));
    expect(arrearsOf(short, short.player)).toBe(0);
    expect(posted(short, own(short, 'savings'), /^Paid back what was owed$/)).toEqual([-1_882_00]);
    expect(troubles(short, short.player)).toEqual([]);
    // Between them, the bank paid the plan once each, to the cent.
    const out = (sim: Simulation) => -sum(sim.universe.transactions.filter((t) => /Yale Health plan, the spring term of 2027|Paid back what was owed/.test(t.memo))
      .flatMap((t) => t.postings).filter((p) => p.accountId === own(sim, 'checking').id || p.accountId === own(sim, 'savings').id).map((p) => p.amount));
    expect(out(short)).toBe(1_882_00);
    expect(out(paid)).toBe(1_882_00);
  });
});

describe('limited funds: a purchase the account can’t make', () => {
  it('declines the day’s groceries on Chase’s debit card with checking empty and no overdraft opt-in, and the day starts unfed; the twin buys them', () => {
    const paid = life('b20-money-buy', 'us-chase');
    const short = life('b20-money-buy', 'us-chase');
    // Both lock the credit card from Your Cards, so it doesn't take what the bank comes up short on (`spend`).
    for (const sim of [paid, short]) run(sim, 'card.lock', { which: 'credit', locked: true });
    for (const sim of [paid, short]) sim.advanceTo(at(2026, 9, 9, 20));
    const checking = own(short, 'checking');
    run(short, 'bank.transfer', { fromId: checking.id, toId: own(short, 'savings').id, amount: checking.balance });
    for (const sim of [paid, short]) sim.advanceTo(at(2026, 9, 10, 0, 5));
    const groceries = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Groceries' && t.at >= at(2026, 9, 10, 0));
    expect(groceries(paid)).toHaveLength(1);
    expect(groceries(short)).toHaveLength(0);
    expect(titled(short, 'No Money For Food Today', at(2026, 9, 10, 0))).toHaveLength(1);
    expect(titled(paid, 'No Money For Food Today')).toHaveLength(0);
    // Nothing went into an overdraft and nothing was charged for it: Chase pays a debit purchase there only for somebody
    // who opted in (Regulation E).
    expect(own(short, 'checking').balance).toBe(0);
    expect(posted(short, own(short, 'checking'), /Overdraft/)).toEqual([]);
    // Fed against unfed: the day's groceries are what the morning's meals eat (`fedOn`).
    expect(paid.player.fedOn).toBe(at(2026, 9, 10, 0));
    expect(short.player.fedOn).not.toBe(at(2026, 9, 10, 0));
  });
});
