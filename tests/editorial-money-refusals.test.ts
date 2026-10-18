/**
 * A refusal for money that isn't there, in one shape (from 2026-10-17, brief 14's editorial review): what can't pay, the
 * amount, and, once a command has been pressed, what didn't happen. Until then Papers said “Your bank can’t cover $…, so
 * nothing was charged.”, health “It costs …, more than your bank can cover.” (and once with no amount at all), Money “…
 * only has $… in it.” with the cents dropped, and a medical bill “… holds … of the …: move money into it first”.
 *
 * Each case here is a variant no other test reached: England's prescription prepayment, a monthly dental plan's first
 * month, a medical debt part covered, a cash withdrawal pushed over by its fees, and a state plan's down payment, which
 * is a reason said before anything is pressed, so it names the amount and not what didn't happen. The others are held
 * where they were already tested (tests/defects-g8-5.test.ts, tests/evidence-g03-life.test.ts, tests/language-money.test.ts,
 * tests/remaining-banking.test.ts, tests/evidence-g12-money.test.ts and the rest that name the refusal).
 *
 * TEST SETUP is said where it's done: money taken out of or put into an account by a posting, as months of spending or a
 * gift would leave it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney } from '@/engine/core/money';
import { MS_DAY } from '@/engine/core/time';
import { billCare, medicalDebtOf } from '@/engine/systems/health';
import { overdraftRoom } from '@/engine/systems/lending';
import { withdrawalQuote } from '@/engine/systems/cash';
import { fileState, statePlanRefusal } from '@/engine/systems/statetax';
import type { TaxReturn } from '@/engine/systems/taxreturn';
import { DENTAL_PLANS, NHS } from '@/engine/content/safetynet';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'comfortable' }, seed);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const posted = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount(amount > 0 ? 'income' : 'expense', 'Test').id, amount: -amount }] });

/** TEST SETUP: savings emptied and the current account drawn to its overdraft's limit, so nothing more can be paid. */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === 'savings' && a.balance > 0) posted(sim, a.id, -a.balance);
  }
  const c = current(sim);
  const move = -overdraftRoom(sim, sim.player, c) - c.balance;
  if (move !== 0) posted(sim, c.id, move);
}

describe('a refusal for money that isn’t there: what can’t pay, the amount, and what didn’t happen', () => {
  it('England’s prescription prepayment and a monthly dental plan: the bank, the price, and nothing charged', () => {
    // LOCATION FIXTURE: a life in London, where the prepayment certificate is England's.
    const london = life('uk-eng-london', 'ed-prepay');
    broke(london);
    const before = london.universe.transactions.length;
    expect(london.execute({ kind: 'health.prepay', payload: { months: 3 } }).error).toBe(`Your bank can’t cover ${formatMoney(Math.round(NHS.prepayment.months3 * 100), 'GBP')}, so nothing was charged.`);
    expect(london.universe.transactions.length).toBe(before);
    // LOCATION FIXTURE: a life in New York, whose own dental plan is paid a month at a time.
    const ny = life('us-ny-newyork', 'ed-dental');
    broke(ny);
    expect(ny.execute({ kind: 'health.dental', payload: { on: true } }).error).toBe(`Your bank can’t cover ${formatMoney(DENTAL_PLANS.ny.premium, 'USD')} for the first month, so nothing was charged.`);
  });

  it('a medical debt part covered: the account, what it has of what’s asked, nothing paid, and where to move money', () => {
    const sim = life('us-ny-newyork', 'ed-debt');
    broke(sim);
    billCare(sim, sim.player, 'A care bill', 900_00, sim.now);
    sim.advanceTo(sim.now + 31 * MS_DAY);
    expect(-medicalDebtOf(sim, sim.player)!.balance).toBe(900_00);
    // TEST SETUP: $50.00 in the current account.
    posted(sim, current(sim).id, 50_00 - current(sim).balance);
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 100_00 } }).error).toBe(`${current(sim).name} has only $50.00 of the $100.00, so nothing was paid. Move money into it first, on your bank’s Move Money.`);
    expect(-medicalDebtOf(sim, sim.player)!.balance).toBe(900_00);
  });

  it('a withdrawal its fees push over: what the account has, and what the cash and its fees come to', () => {
    const sim = life('us-ny-newyork', 'ed-cash');
    const quote = (amount: number) => withdrawalQuote(sim, sim.player, amount, 'other_atm');
    const fees = (q: ReturnType<typeof quote>) => q.fee + (q.ownerCharge ?? 0);
    const free = quote(20_00);
    expect(free.refused).toBeUndefined();
    expect(fees(free)).toBeGreaterThan(0);
    // TEST SETUP: enough for the cash, not for the cash and its fees.
    posted(sim, current(sim).id, 20_00 + 1 - current(sim).balance);
    // The fees are the bank's and the machine owner's, as the quote that went through counted them.
    expect(quote(20_00).refused).toBe(`${current(sim).name} has only $20.01, and $20.00 in cash with its fees comes to ${formatMoney(20_00 + fees(free), 'USD')}.`);
    // With nothing in it, it says so, and no sum.
    posted(sim, current(sim).id, -current(sim).balance);
    expect(quote(20_00).refused).toBe(`${current(sim).name} has nothing in it.`);
  });

  it('a state plan’s down payment, said before it’s asked for: the amount, and no word of a charge, since nothing was tried', () => {
    const sim = life('us-dc-washington', 'ed-dc-down');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) posted(sim, a.id, -a.balance);
    // FIXTURE: a 2001 District return filed with $5,000.00 owed, as `fileState` files one.
    const r = { year: 2001, due: sim.now - MS_DAY, filedAt: sim.now, figures: { income: 50_000_00, balance: 5_000_00 } } as unknown as TaxReturn;
    (sim.player.returns ??= {})['2001'] = r;
    fileState(sim, sim.player, r, 'us-dc', 5_000_00);
    const owed = r.stateDue!['us-dc']!.owed!;
    const down = Math.round(owed * 0.1);
    const words = `Your bank can’t cover the ${formatMoney(down, 'USD')} down payment.`;
    expect(statePlanRefusal(sim, sim.player, 'us-dc', 18, { down })).toBe(words);
    expect(sim.execute({ kind: 'tax.apply_state_plan', payload: { state: 'us-dc', months: 18, down } }).error).toBe(words);
  });
});
