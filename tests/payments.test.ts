/**
 * How each thing is paid (`systems/payments.ts`), module 2 of
 * `docs/BANKING-FUNCTIONS.md`. Until 2026-09-26 every payment fell through
 * checking, savings, the card and then owing, and a landlord took a card.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { PAYMENT_NORMS, CHECK_FEES, type PaymentNorm, type CheckFees } from '@/engine/content/payments';
import { paymentsOf } from '@/engine/systems/payments';
import { arrearsOf, spend } from '@/engine/systems/household';
import { exchange } from '@/engine/content/currency';

const norms = PAYMENT_NORMS as Record<string, PaymentNorm>;
const checkFees = CHECK_FEES as Record<string, CheckFees>;
const kept = new Map<string, unknown>();
function withNorm(iso: string, norm: PaymentNorm) { if (!kept.has(iso)) kept.set(iso, norms[iso]); norms[iso] = norm; }
function withFees(id: string, fees: CheckFees) { if (!kept.has(`fees:${id}`)) kept.set(`fees:${id}`, checkFees[id]); checkFees[id] = fees; }
afterEach(() => {
  for (const [k, v] of kept) {
    if (k.startsWith('fees:')) { const id = k.slice(5); if (v) checkFees[id] = v as CheckFees; else delete checkFees[id]; }
    else if (v) norms[k] = v as PaymentNorm; else delete norms[k];
  }
  kept.clear();
});

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'pay') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, ...extra }, seed);
const accountOf = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && a.category !== 'term');
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const setCurrent = (sim: Simulation, to: number) => {
  const move = to - current(sim).balance;
  if (move !== 0) sim.post({ memo: 'test', category: 'test', postings: [{ accountId: current(sim).id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
};
const run = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer;
};
const firstOf = (sim: Simulation, month: number, hour = 21) => instantFromZoned({ year: 2026, month, day: 1, hour }, sim.zone);
const US_CHECKS: PaymentNorm = { rent: ['check', 'online_portal'], rentMost: 'check', bills: ['online_portal'], billsMost: 'online_portal', source: 'test' };

describe('a new life', () => {
  it('pays the country’s usual way, on the debit card, with savings not linked, as a bank opens it', () => {
    withNorm('US', US_CHECKS);
    const sim = lifeIn('us-ny-newyork', {}, 'pay-new');
    expect(paymentsOf(sim.player)).toMatchObject({ rent: 'check', bills: 'auto', everyday: 'debit', linkSavings: false });
    const is = lifeIn('is-39-mosfellsbr', {}, 'pay-new-is');
    expect(paymentsOf(is.player).rent).toBe('auto');
  });

  it('keeps a save from before running as it ran: everything from the bank, savings swept', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'pay-old');
    delete sim.player.payments;
    expect(paymentsOf(sim.player)).toMatchObject({ rent: 'auto', linkSavings: true });
  });
});

describe('rent from the bank', () => {
  it('goes back unpaid when the current account can’t cover it, with the bank’s fee, and never goes on the card', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-bounce');
    setCurrent(sim, 1_000_00);
    const card = accountOf(sim, 'credit_card')!;
    sim.advanceTo(firstOf(sim, 2));
    // The day's groceries may go on the card; the rent never does.
    const rentOnCard = sim.universe.transactions.filter((t) => t.category === 'rent' && t.postings.some((p) => p.accountId === card.id));
    expect(rentOnCard).toEqual([]);
    expect(arrearsOf(sim, sim.player)).toBeGreaterThan(0);
    expect(sim.universe.transactions.some((t) => t.memo === 'Rent, unpaid')).toBe(true);
  });

  it('draws on savings only where it’s linked to the current account', () => {
    const linked = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-linked');
    run(linked, 'bank.set_payments', { linkSavings: true });
    setCurrent(linked, 1_000_00);
    const savings = accountOf(linked, 'savings')!;
    const before = savings.balance;
    linked.advanceTo(firstOf(linked, 2));
    expect(savings.balance).toBeLessThan(before);
    expect(linked.universe.transactions.some((t) => t.memo === 'Rent, unpaid')).toBe(false);
  });
});

describe('rent by hand', () => {
  it('is owed on the 1st unless paid ahead, isn’t taken for them, and paying ahead goes against the next', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-manual');
    run(sim, 'bank.set_payments', { rent: 'manual' });
    sim.advanceTo(firstOf(sim, 2));
    const owed = arrearsOf(sim, sim.player);
    expect(owed).toBeGreaterThan(0);
    // Not paid back for them the next day.
    sim.advanceBy(2 * MS_DAY);
    expect(arrearsOf(sim, sim.player)).toBe(owed);
    // Paid, and a month ahead.
    const rent = sim.universe.transactions.filter((t) => t.memo === 'Rent, unpaid').at(-1)!.postings.find((p) => p.amount > 0)!.amount;
    // Enough to pay it, a month ahead, and the bills to come.
    setCurrent(sim, owed + rent + 1_000_000_00);
    run(sim, 'home.pay_landlord', { amount: owed + rent });
    expect(arrearsOf(sim, sim.player)).toBe(0);
    expect(paymentsOf(sim.player).rentCredit).toBe(rent);
    sim.advanceTo(firstOf(sim, 3));
    expect(arrearsOf(sim, sim.player)).toBe(0);
    expect(paymentsOf(sim.player).rentCredit).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('rent paid ahead', () => {
  it('goes against the next rent however it’s paid, a direct debit and a check alike', () => {
    for (const how of ['auto', 'check'] as const) {
      withNorm('US', US_CHECKS);
      const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, `ahead-${how}`);
      run(sim, 'bank.set_payments', { rent: how });
      setCurrent(sim, 1_000_000_00);
      run(sim, 'home.pay_landlord', { amount: 500_00 });
      expect(paymentsOf(sim.player).rentCredit).toBe(500_00);
      const rentLine = () => sim.nominalAccount('expense', 'Rent').balance;
      const before = rentLine();
      const fromBank = () => sim.universe.transactions.filter((t) => t.category === 'rent' && t.memo !== 'Rent, paid ahead').flatMap((t) => t.postings).filter((p) => p.accountId === current(sim).id).reduce((a, p) => a - p.amount, 0);
      const bankBefore = fromBank();
      sim.advanceTo(firstOf(sim, 2) + 5 * MS_DAY);
      expect(paymentsOf(sim.player).rentCredit).toBe(0);
      const rent = rentLine() - before;
      expect(rent).toBeGreaterThan(500_00);
      // The bank paid the month less what was paid ahead.
      expect(fromBank() - bankBefore).toBe(rent - 500_00);
    }
    // A whole month paid ahead of a check writes no check that month.
    withNorm('US', US_CHECKS);
    const whole = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, 'ahead-whole');
    run(whole, 'bank.set_payments', { rent: 'check' });
    setCurrent(whole, 1_000_000_00);
    run(whole, 'home.pay_landlord', { amount: 20_000_00 });
    whole.advanceTo(firstOf(whole, 2) + MS_DAY);
    expect(whole.universe.scheduled.filter((i) => i.kind === 'bank.check_clears' && i.label.startsWith('Rent'))).toHaveLength(0);
  });
});

describe('rent by check', () => {
  it('is cashed days after the 1st, bounces with a fee where the account can’t cover it, and is owed', () => {
    withNorm('US', US_CHECKS);
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, 'pay-check');
    sim.advanceTo(firstOf(sim, 2));
    expect(paymentsOf(sim.player).checks).toHaveLength(1);
    const check = paymentsOf(sim.player).checks[0]!;
    expect(check.clearsAt).toBeGreaterThan(sim.now);
    setCurrent(sim, 0);
    sim.advanceTo(check.clearsAt + 60_000);
    expect(paymentsOf(sim.player).checks).toHaveLength(0);
    expect(arrearsOf(sim, sim.player)).toBe(check.amount);
    expect(sim.universe.notifications.some((n) => n.title === 'A Check Bounced')).toBe(true);
  });

  it('can be stopped before it’s cashed, for the bank’s fee, and is owed', () => {
    withNorm('US', US_CHECKS);
    withFees('us-chase', { stopPayment: 30_00, source: 'test' });
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, 'pay-stop');
    sim.advanceTo(firstOf(sim, 2));
    const check = paymentsOf(sim.player).checks[0]!;
    const before = current(sim).balance;
    run(sim, 'bank.stop_check', { id: check.id });
    expect(before - current(sim).balance).toBe(30_00);
    expect(arrearsOf(sim, sim.player)).toBe(check.amount);
    sim.advanceTo(check.clearsAt + 60_000);
    // The rent never came out of the account.
    const paid = sim.universe.transactions.filter((t) => t.category === 'rent' && t.memo === 'Rent' && t.postings.some((p) => p.accountId === current(sim).id));
    expect(paid).toEqual([]);
    expect(sim.universe.notifications.some((n) => n.title === 'Check Stopped')).toBe(true);
  });

  it('charges the stop in the save’s money, and buys the checkbook once, where the first isn’t free', () => {
    withNorm('US', US_CHECKS);
    withFees('us-chase', { stopPayment: 30_00, checkbook: 20_00, source: 'test' });
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, 'pay-book');
    const books = () => sim.universe.transactions.filter((t) => t.memo === 'Checks ordered').length;
    const had = books();
    run(sim, 'bank.set_payments', { rent: 'auto' });
    run(sim, 'bank.set_payments', { rent: 'check' });
    run(sim, 'bank.set_payments', { rent: 'auto' });
    run(sim, 'bank.set_payments', { rent: 'check' });
    expect(books() - had).toBeLessThanOrEqual(1);
    expect(paymentsOf(sim.player).checkbookBought).toBe(true);
    // A bank in another money: its fee is converted.
    withFees('ca-rbc', { stopPayment: 12_50, source: 'test' });
    current(sim).bankId = 'ca-rbc';
    sim.advanceTo(firstOf(sim, 2));
    const check = paymentsOf(sim.player).checks[0]!;
    const answer = run(sim, 'bank.stop_check', { id: check.id });
    expect((answer.value as { fee: number }).fee).toBe(exchange(12_50, 'CAD', 'USD'));
  });

  it('isn’t offered where rent isn’t paid by check', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'pay-no-check');
    expect(sim.execute({ kind: 'bank.set_payments', payload: { rent: 'check' } }).ok).toBe(false);
  });
});

describe('bills and the day’s spending', () => {
  it('puts the bills on the card where that’s the choice', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-bills-card');
    run(sim, 'bank.set_payments', { bills: 'card' });
    sim.advanceTo(firstOf(sim, 2));
    const bills = sim.universe.transactions.find((t) => t.category === 'bills' && t.memo === 'Bills')!;
    expect(bills.postings.some((p) => p.accountId === accountOf(sim, 'credit_card')!.id)).toBe(true);
  });

  it('owes the bills where the card has no room for them, and doesn’t take the card past its limit', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-bills-full');
    run(sim, 'bank.set_payments', { bills: 'card' });
    const card = accountOf(sim, 'credit_card')!;
    // The card run up to within a little of its limit.
    const room = (card.creditLimit ?? 0) + card.balance - 1_00;
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: card.id, amount: -room }, { accountId: sim.nominalAccount('income', 'Test').id, amount: room }] });
    sim.advanceTo(firstOf(sim, 2) - 3_600_000);
    const before = card.balance;
    sim.advanceTo(firstOf(sim, 2));
    expect(sim.universe.transactions.some((t) => t.memo === 'Bills, unpaid')).toBe(true);
    expect(-card.balance).toBeLessThanOrEqual(card.creditLimit ?? 0);
    expect(card.balance).toBeGreaterThanOrEqual(before - 1_00);
  });

  it('puts the groceries on the credit card first where that’s the choice', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-everyday');
    run(sim, 'bank.set_payments', { everyday: 'credit' });
    const card = accountOf(sim, 'credit_card')!;
    const before = { card: card.balance, current: current(sim).balance };
    spend(sim, sim.player, 2_000_00, 'Groceries', 'food');
    expect(card.balance).toBe(before.card - 2_000_00);
    expect(current(sim).balance).toBe(before.current);
  });
});

describe('standing orders and payments set for a date', () => {
  it('moves the amount into savings on its day each month, skips a month it can’t, and stops when canceled', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-so');
    const savings = accountOf(sim, 'savings')!;
    run(sim, 'bank.add_standing_order', { toId: savings.id, amount: 5_000_00, day: 10 });
    const moved = () => sim.universe.transactions.filter((t) => t.memo.startsWith('Standing order')).length;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 11, hour: 12 }, sim.zone));
    expect(moved()).toBe(1);
    setCurrent(sim, 0);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 11, hour: 12 }, sim.zone));
    expect(moved()).toBe(1);
    expect(sim.universe.notifications.some((n) => n.title === 'A Standing Order Didn’t Go')).toBe(true);
    run(sim, 'bank.cancel_standing_order', { id: paymentsOf(sim.player).standingOrders[0]!.id });
    setCurrent(sim, 1_000_000_00);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 3, day: 11, hour: 12 }, sim.zone));
    expect(moved()).toBe(1);
  });

  it('moves with the accounts when the bank is switched', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, 'pay-switch');
    const oldSavings = accountOf(sim, 'savings')!;
    run(sim, 'bank.add_standing_order', { toId: oldSavings.id, amount: 100_00, day: 20 });
    const at = sim.now + 5 * MS_DAY;
    run(sim, 'bank.schedule_payment', { fromId: current(sim).id, toId: oldSavings.id, amount: 50_00, at });
    run(sim, 'bank.switch', { bankId: 'us-citi' });
    const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === 'savings' && a.bankId === 'us-citi')!;
    expect(paymentsOf(sim.player).standingOrders[0]!.toId).toBe(savings.id);
    const before = savings.balance;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 21, hour: 12 }, sim.zone));
    expect(savings.balance - before).toBeGreaterThanOrEqual(150_00);
    expect(sim.universe.notifications.some((n) => n.title === 'A Standing Order Didn’t Go')).toBe(false);
  });

  it('pays on the day set, and not once canceled', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'pay-sched');
    const savings = accountOf(sim, 'savings')!;
    const at = sim.now + 5 * MS_DAY;
    const one = run(sim, 'bank.schedule_payment', { fromId: current(sim).id, toId: savings.id, amount: 1_000_00, at }).value as { id: string };
    const two = run(sim, 'bank.schedule_payment', { fromId: current(sim).id, toId: savings.id, amount: 2_000_00, at }).value as { id: string };
    run(sim, 'bank.cancel_scheduled', { id: two.id });
    const before = savings.balance;
    sim.advanceTo(at + 60_000);
    expect(savings.balance - before).toBe(1_000_00);
    expect(one.id).toBeTruthy();
    expect(sim.execute({ kind: 'bank.schedule_payment', payload: { fromId: current(sim).id, toId: savings.id, amount: 1_00, at: sim.now - 1 } }).ok).toBe(false);
    // One the account can't cover on the day isn't made.
    const later = sim.now + 3 * MS_DAY;
    run(sim, 'bank.schedule_payment', { fromId: current(sim).id, toId: savings.id, amount: current(sim).balance + 1_000_000_00, at: later });
    const held = savings.balance;
    sim.advanceTo(later + 60_000);
    expect(savings.balance).toBe(held);
    expect(sim.universe.notifications.some((n) => n.title === 'A Scheduled Payment Didn’t Go')).toBe(true);
  });
});

describe('a SEPA direct debit taken back', () => {
  it('comes back within eight weeks and is owed again, not after, and not outside SEPA’s refund', () => {
    const sim = lifeIn('de-be-berlin', { wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'pay-sepa');
    sim.advanceTo(firstOf(sim, 2));
    const bills = sim.universe.transactions.find((t) => t.category === 'bills' && t.memo === 'Bills')!;
    const before = current(sim).balance;
    run(sim, 'bank.reclaim_debit', { transactionId: bills.id });
    expect(current(sim).balance).toBeGreaterThan(before);
    expect(arrearsOf(sim, sim.player)).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'bank.reclaim_debit', payload: { transactionId: bills.id } }).ok).toBe(false);
    sim.advanceTo(firstOf(sim, 5));
    const old = sim.universe.transactions.find((t) => t.category === 'bills' && t.memo === 'Bills' && t.at < firstOf(sim, 4) && !t.reversedBy && t.id !== bills.id)!;
    expect(sim.execute({ kind: 'bank.reclaim_debit', payload: { transactionId: old.id } }).ok).toBe(false);
    const gb = lifeIn('uk-eng-london', { wealth: 'comfortable' }, 'pay-gb');
    gb.advanceTo(firstOf(gb, 2));
    const gbBills = gb.universe.transactions.find((t) => t.category === 'bills' && t.memo === 'Bills')!;
    expect(gb.execute({ kind: 'bank.reclaim_debit', payload: { transactionId: gbBills.id } }).ok).toBe(false);
  });
});
