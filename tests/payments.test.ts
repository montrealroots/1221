/**
 * How each thing is paid (`systems/payments.ts`), module 2 of
 * `docs/BANKING-FUNCTIONS.md`. Until 2026-09-26 every payment fell through
 * checking, savings, the card and then owing, and a landlord took a card.
 */
import { quickSave } from '@/engine';
import { CHECK_FEES,PAYMENT_NORMS,type CheckFees,type PaymentNorm } from '@/engine/content/payments';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,instantFromZoned } from '@/engine/core/time';
import { paymentsOf } from '@/engine/systems/payments';
import { spend } from '@/engine/systems/spending';
import { afterEach,describe,expect,it } from 'vitest';

const norms = PAYMENT_NORMS as Record<string, PaymentNorm>;
const checkFees = CHECK_FEES as Record<string, CheckFees>;
const kept = new Map<string, unknown>();
function withNorm(iso: string, norm: PaymentNorm) { if (!kept.has(iso)) kept.set(iso, norms[iso]); norms[iso] = norm; }
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

describe('rent by check', () => {

  it('isn’t offered where rent isn’t paid by check', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'pay-no-check');
    expect(sim.execute({ kind: 'bank.set_payments', payload: { rent: 'check' } }).ok).toBe(false);
  });
});

describe('bills and the day’s spending', () => {

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
