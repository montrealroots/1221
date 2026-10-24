/**
 * Money's remaining paths (from 2026-10-10): a switch declined at the new bank's first look, held back on pending
 * card payments, its balance transfer stopped, a partial switch, and an old account left in debt and closed once
 * repaid; Capital One's loans as Discover's; an IRS payment plan applied for, paid, missed and caught up, added to and
 * revised; a refund taken for another year; and a care log that keeps what a claim still needs. PLAYER JOURNEYS play
 * through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { SWITCH_KIND, loanOffer } from '@/engine/systems/lending';
import { hold } from '@/engine/systems/pending';
import { documentsOf } from '@/engine/systems/documents';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { PLAN, TAX_NOTICE_KIND, leastMonthly, owedAll, partsOn, returnsOf } from '@/engine/systems/taxreturn';
import { CARE_LOG, careFor, healthOf, repriceCare } from '@/engine/systems/health';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const lifeIn = (cityId: string, extra: Record<string, unknown>, seed: string) => quickSave({ startLocationId: cityId, homeRegionId: cityId, ...extra }, seed);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const fund = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** FIXTURE: every account of the player's with money in it emptied, by a posting, so the ledger still balances. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const switches = (sim: Simulation) => sim.player.payments?.switches ?? [];

describe('a switch’s stages', () => {
  it('is declined at the new bank’s first look when its opening rules no longer pass, and nothing moves', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' }, 'fp-declined');
    const barclays = primary(sim).id;
    sim.must({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } });
    // FIXTURE: every photo ID lost the same evening, as a wallet stolen leaves it.
    for (const d of documentsOf(sim.player)) if (d.kind === 'passport' || d.kind === 'license' || d.kind === 'idcard') d.status = 'cancelled';
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(sim.universe.scheduled.some((i) => i.kind === SWITCH_KIND && i.status === 'pending')).toBe(false);
    expect(switches(sim).at(-1)).toMatchObject({ outcome: 'declined', toBank: 'HSBC UK' });
    expect(titled(sim, 'HSBC UK Declined The Switch')).toHaveLength(1);
    sim.advanceTo(sim.now + 14 * MS_DAY);
    expect(primary(sim).id).toBe(barclays);
  });

  it('holds back what covers card payments pending on the day, and sends the rest once they post', () => {
    let sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' }, 'fp-held');
    const barclays = primary(sim);
    fund(sim, barclays.id, 1_000_00);
    const due = sim.must<{ at: number }>({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } }).at;
    sim = reload(sim);
    sim.advanceTo(due - 2 * MS_HOUR);
    // FIXTURE: a card payment made just before the switch date, still pending on it.
    const old = sim.universe.accounts[barclays.id]!;
    const txn = sim.post({ memo: 'Card payment', category: 'food', postings: [{ accountId: old.id, amount: -40_00 }, { accountId: sim.nominalAccount('expense', 'Food').id, amount: 40_00 }] });
    hold(sim, txn as never, old);
    sim.advanceTo(due + MS_HOUR);
    expect(primary(sim).bankId).toBe('gb-hsbc');
    expect(old.closedAt).toBeUndefined();
    expect(old.closingAt).toBeDefined();
    expect(switches(sim).at(-1)!.outcome).toBe('held');
    sim.advanceTo(old.closingAt! + MS_HOUR);
    expect(old.closedAt).toBeDefined();
  });

  it('PLAYER JOURNEY: past its window, the balance transfer alone is stopped: payments move and the old account keeps its money, open', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' }, 'fp-keep');
    const barclays = primary(sim);
    fund(sim, barclays.id, 500_00);
    const set = sim.must<{ at: number; cancellableUntil: number }>({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } });
    sim.advanceTo(set.cancellableUntil + MS_HOUR);
    expect(sim.execute({ kind: 'bank.cancel_switch', payload: { confirm: true } }).error).toMatch(/You can still stop its balance transfer/);
    expect(sim.execute({ kind: 'bank.stop_balance_transfer', payload: {} }).error).toMatch(/Confirm/);
    sim.must({ kind: 'bank.stop_balance_transfer', payload: { confirm: true } });
    sim.advanceTo(set.at - MS_HOUR);
    const held = barclays.balance;
    sim.advanceTo(set.at + MS_HOUR);
    expect(primary(sim).bankId).toBe('gb-hsbc');
    expect(barclays.closedAt).toBeUndefined();
    expect(barclays.balance).toBe(held);
    expect(switches(sim).at(-1)!.outcome).toBe('balance-kept');
  });

  it('a partial switch takes its twenty working days, can’t be called off, and keeps the old account', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' }, 'fp-partial');
    const barclays = primary(sim);
    const set = sim.must<{ at: number; cancellableUntil?: number }>({ kind: 'bank.switch', payload: { bankId: 'gb-natwest', partial: true } });
    expect(set.cancellableUntil).toBeUndefined();
    expect(set.at - sim.now).toBeGreaterThan(25 * MS_DAY);
    sim.advanceTo(set.at + MS_HOUR);
    expect(primary(sim).bankId).toBe('gb-natwest');
    expect(barclays.closedAt).toBeUndefined();
    expect(switches(sim).at(-1)!.outcome).toBe('partial');
  });

  it('an old account in debt on the day is blocked to all but repayment, and closes itself once repaid', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' }, 'fp-debt');
    const barclays = primary(sim);
    const due = sim.must<{ at: number }>({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } }).at;
    // FIXTURE: overdrawn before the switch date.
    fund(sim, barclays.id, -barclays.balance - 150_00);
    sim.advanceTo(due + MS_HOUR);
    expect(barclays.switchDebt).toBe(true);
    expect(sim.execute({ kind: 'bank.transfer', payload: { fromId: barclays.id, toId: primary(sim).id, amount: 1 } }).error).toMatch(/blocked/);
    fund(sim, primary(sim).id, 400_00);
    sim.must({ kind: 'bank.transfer', payload: { fromId: primary(sim).id, toId: barclays.id, amount: 200_00 } });
    sim.advanceTo(sim.now + 9 * MS_DAY);
    expect(barclays.closedAt).toBeDefined();
  });
});

describe('Capital One’s loans, as Discover Personal Loans', () => {
  it('lends as Discover: not for education, only with a Social Security number and $25,000 of income', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-capital-one', wealth: 'comfortable' }, 'fp-discover');
    // FIXTURE: a month's wages of $3,000, a year of $36,000.
    sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: primary(sim).id, amount: 3_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -3_000_00 }] });
    const offer = loanOffer(sim, sim.player, 5_000_00, 36, 'us-capital-one');
    expect('apr' in offer).toBe(true);
    expect((offer as { terms: { lender?: string; rateSource?: string } }).terms).toMatchObject({ lender: 'Discover Personal Loans', rateSource: 'third-party' });
    expect(loanOffer(sim, sim.player, 5_000_00, 36, 'us-capital-one', 'education')).toMatchObject({ refused: expect.stringMatching(/post-secondary education/) });
    expect(loanOffer(sim, sim.player, 2_000_00, 36, 'us-capital-one')).toMatchObject({ refused: expect.stringMatching(/2,500/) });
    expect(loanOffer(sim, sim.player, 5_000_00, 24, 'us-capital-one')).toMatchObject({ refused: expect.stringMatching(/36 to 84 months/) });
  });
});

/** A 2026 return filed on time with nothing in the bank, so its balance is owed. */
function owingOnTime(seed: string): Simulation {
  const sim = lifeIn('us-ny-newyork', { wealth: 'wealthy' }, seed);
  recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
  play(sim, at(2027, 2, 1, 12));
  empty(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  return sim;
}

describe('an IRS payment plan', () => {
  it('PLAYER JOURNEY: a monthly plan approved online, the penalty halved, collection stopped, payments taken, one missed and caught up', () => {
    let sim = owingOnTime('fp-plan');
    const r = () => returnsOf(sim.player)['2026']!;
    const owed = owedAll(sim.player, sim.now);
    expect(sim.execute({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: leastMonthly(owed) - 1 } }).error).toMatch(/lowest monthly payment/);
    fund(sim, primary(sim).id, 100_00);
    const applied = sim.must<{ decideAt: number; fee: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 1_000_00 } });
    sim.advanceTo(applied.decideAt + MS_HOUR);
    const plan = () => sim.player.taxPlan!;
    expect(plan().status).toBe('active');
    expect(r().reducedFrom).toBeDefined();
    expect(sim.universe.scheduled.some((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending')).toBe(false);
    // Two months on the plan: the penalty's increase is the quarter rate on the tax.
    const before = partsOn(r(), sim.now);
    fund(sim, primary(sim).id, 3_000_00);
    sim = reload(sim);
    sim.advanceTo(sim.now + 61 * MS_DAY);
    expect(plan().history.filter((h) => h.what === 'A payment')).toHaveLength(2);
    const now = partsOn(r(), sim.now);
    expect(now.penalty - before.penalty).toBeLessThanOrEqual(Math.round(0.0025 * 3 * before.tax) + 1);
    // A payment missed: CP523, and caught up.
    empty(sim);
    sim.advanceTo(sim.now + 31 * MS_DAY);
    expect(plan().status).toBe('default');
    expect(titled(sim, 'Notice CP523: A Payment Missed')).toHaveLength(1);
    fund(sim, primary(sim).id, 2_000_00);
    sim.must({ kind: 'tax.catch_up_plan', payload: {} });
    expect(plan().status).toBe('active');
    // Every payment a posting: the ledger balances.
    expect(sim.ledger.audit()).toEqual([]);
  }, 60_000);

  it('ends after CP523’s thirty days uncaught, and collection resumes', () => {
    const sim = owingOnTime('fp-plan-end');
    fund(sim, primary(sim).id, 100_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 1_000_00 } });
    sim.advanceTo(applied.decideAt + MS_HOUR);
    empty(sim);
    sim.advanceTo(sim.now + 31 * MS_DAY);
    sim.advanceTo(sim.now + 31 * MS_DAY);
    expect(sim.player.taxPlan!.status).toBe('ended');
    expect(sim.universe.scheduled.some((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending')).toBe(true);
    expect(returnsOf(sim.player)['2026']!.reducedTo).toBeDefined();
  }, 60_000);

  it('an amended return’s tax joins a plan where it adds two payments or less; past that, CP523 until it’s revised for its fee', () => {
    const sim = owingOnTime('fp-plan-amend');
    fund(sim, primary(sim).id, 100_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 500_00 } });
    sim.advanceTo(applied.decideAt + MS_HOUR);
    // FIXTURE: a corrected W-2 with $20,000 more of wages, well past two payments of tax.
    yearOf(sim.player, 2026).acting += 20_000_00;
    const amended = sim.must<{ processAt: number }>({ kind: 'tax.amend', payload: { year: 2026 } });
    fund(sim, primary(sim).id, 10_000_00);
    sim.advanceTo(amended.processAt + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('default');
    expect(titled(sim, 'Notice CP523: Your Payment Plan')).toHaveLength(1);
    const revised = sim.must<{ monthly: number; fee: number }>({ kind: 'tax.revise_plan', payload: { monthly: 1_500_00 } });
    expect(revised.fee).toBe(PLAN.reviseFee);
    expect(sim.player.taxPlan!.status).toBe('active');
  }, 60_000);

  it('a short-term plan has no fee and is paid in full by its 180 days', () => {
    const sim = owingOnTime('fp-short');
    const applied = sim.must<{ decideAt: number; fee: number }>({ kind: 'tax.apply_plan', payload: { kind: 'short' } });
    expect(applied.fee).toBe(0);
    sim.advanceTo(applied.decideAt + MS_HOUR);
    fund(sim, primary(sim).id, 20_000_00);
    sim.advanceTo(sim.player.taxPlan!.payBy! + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('paid');
    expect(owedAll(sim.player, sim.now)).toBe(0);
  }, 60_000);

  it('a refund goes to what’s owed on another year first', () => {
    const sim = owingOnTime('fp-offset');
    // FIXTURE: a 2027 return due back $2,000, filed.
    returnsOf(sim.player)['2027'] = { year: 2027, due: at(2028, 4, 15), figures: { ...returnsOf(sim.player)['2026']!.figures, balance: -2_000_00 }, filedAt: sim.now, refund: 2_000_00, refundAt: sim.now + MS_HOUR };
    const owed = owedAll(sim.player, sim.now);
    sim.schedule({ at: sim.now + MS_HOUR, kind: 'tax.refund', label: 'Refund', category: 'system', priority: 20, payload: { personId: sim.player.id, year: 2027 } });
    sim.advanceTo(sim.now + 2 * MS_HOUR);
    expect(owedAll(sim.player, sim.now)).toBeLessThan(owed - 1_900_00);
    expect(titled(sim, 'Your 2027 Refund Went To 2026')).toHaveLength(1);
  }, 60_000);
});

describe('the care log', () => {
  it('keeps every event a cover change can reach and any whose bill is open, lets the rest go, and bills a change once', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable' }, 'fp-carelog');
    const h = healthOf(sim.player);
    // FIXTURE: an old bill, open and unpaid, from long before the log's reach.
    const old = careFor(sim, sim.player, { care: 'urgent', what: 'Urgent care' }, sim.now)!;
    old.inDebt = true;
    for (let i = 0; i < 90; i += 1) { sim.advanceTo(sim.now + 7 * MS_DAY); careFor(sim, sim.player, { care: 'visit', what: 'A visit' }, sim.now); }
    expect(h.careLog!.some((e) => e.billId === old.id)).toBe(true);
    expect(h.careLog!.every((e) => e.billId === old.id || e.at >= sim.now - CARE_LOG.keepDays * MS_DAY)).toBe(true);
    // Ninety weekly visits, and the log holds only the 400 days' and the open bill's: the rest went. Until 2026-10-22 they
    // were counted by year in `careArchive`, which nothing read (brief 20's papers area).
    expect(h.careLog!.length).toBeLessThan(91);
    expect((h as unknown as Record<string, unknown>).careArchive).toBeUndefined();
    // FIXTURE: the last visit charged as if a cover that's since gone paid it all. Repriced, it's billed the difference
    // once; repriced again over the same days, nothing more is billed or credited.
    const last = h.careLog!.at(-1)!;
    const was = last.share;
    expect(was).toBeGreaterThan(0);
    last.share = 0;
    const bills = h.bills.length;
    expect(repriceCare(sim, sim.player, last.at - MS_HOUR, sim.now, 'A cover canceled')).toBe(was);
    expect(h.bills.length).toBe(bills + 1);
    expect(repriceCare(sim, sim.player, last.at - MS_HOUR, sim.now, 'A cover canceled')).toBe(0);
    expect(h.bills.length).toBe(bills + 1);
    expect(last.adjusted).toHaveLength(1);
  });
});
