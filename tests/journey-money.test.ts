/**
 * Journey: a student's money through a first year (from the connected world of 2026-10-09). A life made as creation
 * makes one, at Yale with Wells Fargo, run by the bank's own commands only: the school's charges come out of the current
 * account and show on its statement; savings linked behind it; a standing order and a payment set for a date, one of
 * them called off; round-ups and alerts; cash drawn and paid back in; the card on autopay, its statement day moved,
 * made the everyday card, locked and unlocked, its rewards redeemed; a term deposit opened and broken; a loan taken and paid off; an
 * overdraft arranged. Saved and loaded midway, and the year's return filed in the February. What it checks is
 * downstream: the balances move by what each command says, the ledger balances, and no law of the save breaks.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { paymentsOf } from '@/engine/systems/payments';
import { termsOf } from '@/engine/systems/lending';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12) => instantFromZoned({ year, month, day, hour }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const mine = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && a.category !== 'term');
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const ok = <T,>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
};

describe('journey: a student’s money through a first year', () => {
  it('moves the money by what each command says, and keeps the ledger and the save’s laws', () => {
    let sim = createSave(1, 'jr-money', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-wells-fargo' });
    sim.advanceTo(at(2026, 9, 1));

    // The school's charges, out of the current account, on its record.
    const school = sim.universe.transactions.filter((t) => t.category === 'school');
    expect(school.length).toBeGreaterThan(0);

    // Savings behind the current account, and money moved between them.
    const savings = mine(sim, 'savings')!;
    ok(sim, 'bank.set_payments', { linkSavings: true });
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
    const c0 = current(sim).balance;
    ok(sim, 'bank.transfer', { fromId: savings.id, toId: current(sim).id, amount: 2_000_00 });
    expect(current(sim).balance).toBe(c0 + 2_000_00);

    // A standing order on the 15th, and a payment set for a date, called off before it goes.
    ok(sim, 'bank.add_standing_order', { toId: savings.id, amount: 50_00, day: 15 });
    const set = ok<{ id: string }>(sim, 'bank.schedule_payment', { fromId: current(sim).id, toId: savings.id, amount: 25_00, at: at(2026, 9, 20) });
    const pending = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === 'bank.scheduled_payment')!;
    ok(sim, 'bank.cancel_scheduled', { id: set?.id ?? pending.id });
    ok(sim, 'bank.set_round_ups', { on: true });
    ok(sim, 'bank.set_alerts', { statements: true });

    // Cash drawn and paid back in.
    ok(sim, 'cash.withdraw', { amount: 100_00, from: 'card' });
    ok(sim, 'cash.deposit', { amount: 40_00, toId: current(sim).id, at: 'atm' });

    // The card: autopay in full, its statement day moved, locked and unlocked.
    ok(sim, 'finance.set_autopay', { mode: 'full' });
    // The day's spending on the card, so it earns.
    ok(sim, 'card.set_everyday', { accountId: mine(sim, 'credit_card')!.id });
    ok(sim, 'bank.set_payments', { everyday: 'credit' });
    expect(paymentsOf(sim.player).everyday).toBe('credit');
    ok(sim, 'card.set_statement_day', { day: 28 });
    ok(sim, 'card.lock', { which: 'credit', locked: true });
    ok(sim, 'card.lock', { which: 'credit', locked: false });

    // A term deposit opened, and a loan taken.
    ok(sim, 'bank.open_term', { amount: 5_000_00 });
    const term = termsOf(sim, sim.player).at(-1)!;
    // No loan yet: Wells Fargo lends to customers of a year (from 2026-10-10), and against wages paid in, none yet.
    expect(sim.execute({ kind: 'bank.borrow', payload: { amount: 3_000_00, months: 12 } }).error).toMatch(/customers of 12 months|wages paid in/);

    // On through the standing order's day: it went, the canceled payment didn't.
    const s0 = savings.balance;
    sim.advanceTo(at(2026, 9, 21));
    expect(savings.balance - s0).toBe(50_00);
    expect(sim.universe.transactions.some((t) => t.at > at(2026, 9, 19) && t.memo.includes('25'))).toBe(false);

    // Saved and loaded midway, as a player closes the game.
    sim = reload(sim);
    sim.advanceTo(at(2026, 12, 1));
    expect(sim.universe.transactions.some((t) => /statement/i.test(t.memo) || t.category === 'interest' || t.category === 'fee' || t.category === 'card')).toBe(true);

    // Three months of work-study pay in, the bank lends against it; the loan paid off, the term deposit broken, the
    // standing order called off.
    expect(sim.universe.transactions.some((t) => t.postings.some((p) => p.accountId === current(sim).id && p.amount > 0) && /work-study|payroll|wages|pay/i.test(t.memo))).toBe(true);
    // TEST SETUP: the account a year old, as Wells Fargo asks of a borrower; this journey runs three months.
    current(sim).openedAt -= 13 * 30.44 * 86_400_000;
    ok(sim, 'bank.borrow', { amount: 3_000_00, months: 60 });
    expect(mine(sim, 'loan')).toBeDefined();
    ok(sim, 'bank.repay_loan');
    expect(mine(sim, 'loan')).toBeUndefined();
    ok(sim, 'bank.break_term', { accountId: term.id });
    ok(sim, 'bank.cancel_standing_order', { id: paymentsOf(sim.player).standingOrders[0]!.id });
    expect(paymentsOf(sim.player).standingOrders).toEqual([]);
    // No American bank arranges an overdraft (`bank.arrange_overdraft` is Britain's and Europe's), and it says so.
    expect(sim.execute({ kind: 'bank.arrange_overdraft', payload: { limit: 500_00 } }).error).toMatch(/doesn’t arrange one/);
    ok(sim, 'card.redeem_rewards');

    // The February after: the year's return, filed.
    sim.advanceTo(at(2027, 2, 20));
    const filed = sim.execute<{ balance: number }>({ kind: 'tax.file', payload: { year: 2026 } });
    if (filed.ok && filed.value!.balance > 0) ok(sim, 'tax.pay', { year: 2026 });

    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});
