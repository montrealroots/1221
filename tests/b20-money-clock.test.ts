/**
 * Brief 20's money area, D1's twelve kinds where money is most at risk, each through the commands a player sends and the
 * clock (docs/verification/audit-2026-10-21/criteria.md):
 *
 * - The clock moved an hour at a time, a day, a week or a month at once: every charge, fee, interest payment, reward and
 *   payment the same, at the same moment, none twice and none dropped. One life at Chase, its day's groceries on the
 *   Freedom Unlimited, autopay on the minimum so the card carries and is charged interest once its 0% ends, a standing
 *   order into savings on the 31st, a payment set for a date and a CD; played four ways from the same seed to the same
 *   moment.
 * - A save made and opened in the middle of a cycle: a statement cut with its due date pending, a card applied for and on
 *   its way, money sent to another bank and in transit, a standing order and a payment set for a date ahead, the month's
 *   end just run. The life played straight and the same life saved and opened at each of those moments end with the same
 *   ledger, the same record and the same calendar, to the byte.
 * - A month's end on a Saturday (31 October 2026) and on a holiday (Memorial Day, 31 May 2027): the interest, the fee and
 *   the standing order of the 31st each once in their month, none dropped in the short months between, and a card's due
 *   date on a Sunday (15 November 2026) paid that day.
 * - A balance is the sum of its postings: after half a year played with most of the bank's commands, every account's
 *   balance is what its postings add up to, counted here, and every account kept in another currency the same in its own.
 * - An account left untouched: a wealthy life's Chase Savings, never used, is said to be dormant, then the bank writes
 *   ninety days ahead with Keep The Account, then its money goes to the state's unclaimed-property office, though the bank
 *   credited interest every month (Conn. Gen. Stat. §3-57a counts what the owner does, not the bank's interest); her twin,
 *   who pressed Keep The Account on the letter, keeps it; and Claim It Back returns what went, to the cent.
 *
 * PLAYER JOURNEYS: new lives as creation makes them (`newLifeConfig`), Ada Cole, born in New York, a US citizen, an
 * actor at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, with the wealthy family's money, at the bank named.
 * Nothing is set by hand. Seeds: b20-money-jump, b20-money-reload, b20-money-weekend, b20-money-ledger (at Bank of America, which rounds up),
 * b20-money-unclaimed, chosen for these tests and not swapped.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, addMonths, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { cardsOf } from '@/engine/systems/credit';
import { breaches } from '@/engine/core/invariants';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12, min = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: min }, NY);
const life = (seed: string, bankId = 'us-capital-one'): Simulation => createSave(1, seed, {
  ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId,
});
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const own = (sim: Simulation, kind: Account['kind'], bankId?: string): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && !a.nominal && a.category !== 'term' && (!bankId || a.bankId === bankId))!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
/** Every transaction as the ledger keeps it, but for a doctor's or a pharmacy's: when, what, and each posting. */
const money = (sim: Simulation) => sim.universe.transactions.filter((t) => t.category !== 'health')
  .map((t) => `${t.at} ${t.category} ${t.memo} ${t.postings.map((p) => `${p.accountId}:${p.amount}`).join(' ')}`);
const pendingMoney = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.status === 'pending' && /^(bank|card)\./.test(i.kind)).map((i) => `${i.kind} ${i.at}`).sort();

/** The same choices made in each life, at the start. */
function setUp(sim: Simulation): void {
  run(sim, 'bank.set_payments', { everyday: 'credit' });
  run(sim, 'finance.set_autopay', { mode: 'minimum' });
  run(sim, 'bank.add_standing_order', { toId: own(sim, 'savings').id, amount: 75_00, day: 31 });
  run(sim, 'bank.schedule_payment', { fromId: own(sim, 'checking').id, toId: own(sim, 'savings').id, amount: 120_00, at: at(2026, 10, 9, 9) });
  run(sim, 'bank.open_term', { amount: 10_000_00 });
}

describe('the clock moved in steps of any size', () => {
  it('posts the same charges, fees, interest, rewards and payments at the same moments, an hour, a day, a week or a month at a time', () => {
    const end = at(2026, 12, 2, 0);
    const lives = { hour: life('b20-money-jump', 'us-chase'), day: life('b20-money-jump', 'us-chase'), week: life('b20-money-jump', 'us-chase'), month: life('b20-money-jump', 'us-chase') };
    for (const sim of Object.values(lives)) setUp(sim);
    const step = (sim: Simulation, by: (now: number) => number) => { while (sim.now < end) sim.advanceTo(Math.min(end, by(sim.now))); };
    step(lives.hour, (now) => now + MS_HOUR);
    step(lives.day, (now) => now + MS_DAY);
    step(lives.week, (now) => now + 7 * MS_DAY);
    step(lives.month, (now) => addMonths(now, 1, NY));
    const kept = money(lives.month);
    // What the life did: the card charged interest once its introductory 0% ended, at the 20 November statement, autopay
    // paid the 11 October and 10 November due dates (11 December's is past the end), the order
    // went on 31 August, 30 September, 31 October and 30 November, the payment set for 9 October once, and interest
    // came to savings at each month's end.
    const memos = (re: RegExp) => kept.filter((l) => re.test(l)).length;
    expect(memos(/ interest Interest /)).toBe(1);
    expect(memos(/ card-payment Paid Chase Freedom Unlimited /)).toBe(2);
    expect(memos(/ transfer Standing order to Chase Savings /)).toBe(4);
    expect(memos(/ transfer Scheduled payment to Chase Savings /)).toBe(1);
    expect(memos(/ interest Interest: Chase Savings /)).toBe(4);
    // The card's 1.5% on the groceries, built at each statement and kept for redeeming.
    expect(lives.month.player.credit!.rewards).toBeGreaterThan(0);
    for (const sim of [lives.hour, lives.day, lives.week]) {
      expect(money(sim)).toEqual(kept);
      expect(JSON.stringify(sim.player.credit)).toBe(JSON.stringify(lives.month.player.credit));
      expect(pendingMoney(sim)).toEqual(pendingMoney(lives.month));
    }
  });
});

describe('a save made and opened mid-cycle', () => {
  it('ends with the same ledger, record and calendar as the life played straight, saved at a statement cut, a card on its way, money in transit and the month’s end', () => {
    const straight = life('b20-money-reload', 'us-chase');
    let saved = life('b20-money-reload', 'us-chase');
    for (const sim of [straight, saved]) {
      run(sim, 'bank.set_payments', { everyday: 'credit' });
      run(sim, 'bank.add_standing_order', { toId: own(sim, 'savings').id, amount: 40_00, day: 2 });
    }
    // Each moment: the life played straight does what the saved life does, and the saved one is saved and opened there.
    const both = (moment: number, act?: (sim: Simulation) => void) => {
      straight.advanceTo(moment);
      saved.advanceTo(moment);
      if (act) { act(straight); act(saved); }
      saved = reload(saved);
    };
    // A second bank, Capital One, opened online, and money sent to it from Chase: in transit for Chase's days.
    both(at(2026, 8, 27, 10), (sim) => run(sim, 'bank.open_current', { bankId: 'us-capital-one' }));
    both(at(2026, 9, 18, 15), (sim) => run(sim, 'bank.transfer', { fromId: own(sim, 'checking', 'us-chase').id, toId: own(sim, 'checking', 'us-capital-one').id, amount: 1_000_00 }));
    expect(saved.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'bank.transfer_arrives')).toBe(true);
    // The statement cut, its due date pending; a card applied for at Citi, on its way.
    both(at(2026, 9, 20, 10), (sim) => run(sim, 'card.apply', { bankId: 'us-citi' }));
    expect(saved.player.credit!.applied).toBeDefined();
    // A payment set for a date ahead, then the month's end just run, and a minute into the 1st.
    both(at(2026, 9, 25, 9), (sim) => run(sim, 'bank.schedule_payment', { fromId: own(sim, 'checking', 'us-chase').id, toId: own(sim, 'savings').id, amount: 33_00, at: at(2026, 10, 7, 9) }));
    both(at(2026, 9, 30, 23, 1));
    both(at(2026, 10, 1, 0, 1));
    both(at(2026, 10, 11, 11));
    both(at(2026, 10, 11, 13));
    for (const sim of [straight, saved]) sim.advanceTo(at(2027, 1, 3));
    // What happened, happened once in each.
    const count = (sim: Simulation, re: RegExp) => sim.universe.transactions.filter((t) => re.test(t.memo)).length;
    expect(count(saved, /^From Chase Total Checking$/)).toBe(1);
    expect(count(saved, /^Scheduled payment to Chase Savings$/)).toBe(1);
    expect(count(saved, /^Standing order to Chase Savings$/)).toBe(5);
    expect(cardsOf(saved, saved.player).map((c) => c.bankId).sort()).toEqual(['us-chase', 'us-citi']);
    // And the two are the same to the byte.
    expect(JSON.stringify(saved.universe.transactions)).toBe(JSON.stringify(straight.universe.transactions));
    expect(JSON.stringify(saved.universe.accounts)).toBe(JSON.stringify(straight.universe.accounts));
    expect(JSON.stringify(saved.player.credit)).toBe(JSON.stringify(straight.player.credit));
    expect(JSON.stringify(saved.player.payments)).toBe(JSON.stringify(straight.player.payments));
    expect(pendingMoney(saved)).toEqual(pendingMoney(straight));
  });
});

describe('a month’s end on a weekend or a holiday', () => {
  it('pays the interest and the standing order of the 31st once in each month, on Saturday 31 October and on Memorial Day, none dropped in the short months, and a Sunday due date’s autopay that day', () => {
    const sim = life('b20-money-weekend');
    run(sim, 'bank.set_payments', { everyday: 'credit' });
    run(sim, 'bank.add_standing_order', { toId: own(sim, 'savings').id, amount: 25_00, day: 31 });
    sim.advanceTo(at(2027, 6, 2));
    const savings = own(sim, 'savings');
    const on = (re: RegExp) => sim.universe.transactions.filter((t) => re.test(t.memo) && t.postings.some((p) => p.accountId === savings.id)).map((t) => t.at);
    const orders = on(/^Standing order to /);
    expect(orders).toEqual([
      at(2026, 8, 31, 9), at(2026, 9, 30, 9), at(2026, 10, 31, 9), at(2026, 11, 30, 9), at(2026, 12, 31, 9),
      at(2027, 1, 31, 9), at(2027, 2, 28, 9), at(2027, 3, 31, 9), at(2027, 4, 30, 9), at(2027, 5, 31, 9),
    ]);
    const interest = on(/^Interest: 360 Performance Savings$/);
    expect(interest).toEqual([
      at(2026, 8, 31, 23), at(2026, 9, 30, 23), at(2026, 10, 31, 23), at(2026, 11, 30, 23), at(2026, 12, 31, 23),
      at(2027, 1, 31, 23), at(2027, 2, 28, 23), at(2027, 3, 31, 23), at(2027, 4, 30, 23), at(2027, 5, 31, 23),
    ]);
    // The card's due date of 15 November, a Sunday: autopay paid it at noon that day, once.
    const card = cardsOf(sim, sim.player)[0]!;
    const paid = sim.universe.transactions.filter((t) => t.memo === `Paid ${card.name}` && t.at >= at(2026, 11, 14) && t.at < at(2026, 11, 17)).map((t) => t.at);
    expect(paid).toEqual([at(2026, 11, 15)]);
    expect(sim.player.credit!.late).toEqual([]);
  });
});

describe('a balance is the sum of its postings', () => {
  it('holds for every account after half a year played with the bank’s commands, counted here posting by posting', () => {
    const sim = life('b20-money-ledger', 'us-bank-of-america');
    run(sim, 'bank.set_payments', { everyday: 'credit', linkSavings: true });
    run(sim, 'bank.set_round_ups', { on: true });
    run(sim, 'bank.add_standing_order', { toId: own(sim, 'savings').id, amount: 50_00, day: 15 });
    run(sim, 'cash.withdraw', { amount: 200_00, from: 'atm' });
    run(sim, 'cash.withdraw', { amount: 100_00, from: 'card' });
    run(sim, 'bank.open_term', { amount: 5_000_00 });
    sim.advanceTo(at(2026, 9, 3));
    run(sim, 'bank.open_current', { bankId: 'us-capital-one' });
    run(sim, 'bank.transfer', { fromId: own(sim, 'checking', 'us-bank-of-america').id, toId: own(sim, 'checking', 'us-capital-one').id, amount: 2_500_00 });
    run(sim, 'cash.deposit', { amount: 60_00, toId: own(sim, 'checking', 'us-bank-of-america').id, at: 'counter' });
    sim.advanceTo(at(2026, 10, 2));
    run(sim, 'finance.pay_card', { amount: 'full' });
    run(sim, 'card.apply', { bankId: 'us-citi' });
    run(sim, 'bank.break_term', { accountId: Object.values(sim.universe.accounts).find((a) => a.category === 'term' && !a.closedAt)!.id });
    sim.advanceTo(at(2027, 2, 24));
    const sums = new Map<string, number>();
    for (const t of sim.universe.transactions) for (const p of t.postings) sums.set(p.accountId, (sums.get(p.accountId) ?? 0) + p.amount);
    const theirs = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id);
    expect(theirs.length).toBeGreaterThanOrEqual(8);
    for (const a of Object.values(sim.universe.accounts)) expect([a.name, a.balance]).toEqual([a.name, sums.get(a.id) ?? 0]);
    // Every transaction balances, and the save keeps its laws.
    for (const t of sim.universe.transactions) expect(t.postings.reduce((n, p) => n + p.amount, 0)).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('an account left untouched', () => {
  it('is said dormant, written about ninety days ahead with Keep The Account, and handed to the state though the bank paid it interest each month; the twin who pressed Keep The Account keeps it; Claim It Back returns it', () => {
    const left = life('b20-money-unclaimed', 'us-chase');
    const kept = life('b20-money-unclaimed', 'us-chase');
    const savings = (sim: Simulation) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings')!;
    const letterOf = (sim: Simulation) => Object.values(sim.universe.decisions).find((d) => d.refType === 'unclaimed-notice' && d.refId === savings(sim).id);
    for (let m = 1; m <= 34; m += 1) for (const sim of [left, kept]) sim.advanceTo(addMonths(at(2026, 8, 24), m, NY));
    // Dormant at Chase's thirty months, said on the 1st it's found (`idleAccounts`): 1 March 2029.
    for (const sim of [left, kept]) expect(sim.universe.notifications.filter((n) => n.title === 'Chase Savings Is Dormant').map((n) => n.at)).toEqual([at(2029, 3, 1, 0)]);
    // The letter: on 1 June 2029, ninety days or more before the three years run out on 24 August, with its date and
    // Keep The Account.
    const letter = letterOf(kept)!;
    expect(letter.createdAt).toBe(at(2029, 6, 1, 0));
    expect(letter.dueAt - at(2029, 6, 1, 0)).toBeGreaterThanOrEqual(80 * MS_DAY);
    expect(letter.actions.map((a) => a.label)).toEqual(['Keep The Account']);
    // The twin presses it.
    const action = letter.actions[0]!;
    run(kept, action.commandKind, action.payload);
    for (const sim of [left, kept]) sim.advanceTo(at(2029, 9, 2));
    // The bank credited interest every month; interest isn't the owner's doing, so it went regardless.
    const interest = left.universe.transactions.filter((t) => t.memo === 'Interest: Chase Savings' && t.postings.some((p) => p.accountId === savings(left).id));
    expect(interest.length).toBeGreaterThanOrEqual(36);
    const handed = left.universe.transactions.filter((t) => t.memo === 'Unclaimed, to the state’s unclaimed-property office');
    expect(handed.map((t) => t.at)).toEqual([at(2029, 9, 1, 0)]);
    expect(savings(left).closedAt).toBe(at(2029, 9, 1, 0));
    const amount = left.player.unclaimed![0]!.amount;
    expect(amount).toBeGreaterThan(413_043_00);
    // The twin who kept it: open, untouched, nothing handed over.
    expect(savings(kept).closedAt).toBeUndefined();
    expect(kept.universe.transactions.filter((t) => t.memo.startsWith('Unclaimed, to '))).toEqual([]);
    expect(kept.player.unclaimed ?? []).toEqual([]);
    // Claimed back: into the primary account, exactly what went.
    const checking = own(left, 'checking');
    const before = checking.balance;
    expect(run<{ claimed: number }>(left, 'bank.claim_unclaimed').claimed).toBe(amount);
    expect(checking.balance - before).toBe(amount);
    expect(left.player.unclaimed).toEqual([]);
  });
});
