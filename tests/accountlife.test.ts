/**
 * An account's life (`systems/accountlife.ts`): module 7 of
 * `docs/BANKING-FUNCTIONS.md`. Each claim against the bank's own terms in
 * `content/accountlife.ts`.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY } from '@/engine/core/time';
import { bankById } from '@/engine/content/banks';
import { ACCOUNT_LIFE } from '@/engine/content/accountlife';
import { CASH } from '@/engine/content/cash';
import { bankAccountsOf } from '@/engine/systems/banking';
import { termsOf } from '@/engine/systems/lending';
import { spend } from '@/engine/systems/household';
import { breakQuote, idleAccounts, inCoolingOff, roundUpOf, termEndOf } from '@/engine/systems/accountlife';
import { yearOf } from '@/engine/systems/earnings';

const lifeIn = (cityId: string, bankId: string, seed = 'life') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const savings = (sim: Simulation) => bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings');
const give = (sim: Simulation, account: Account, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId: account.id, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const run = (sim: Simulation, kind: string, payload: Record<string, unknown>) => sim.execute({ kind, payload });
function openTerm(sim: Simulation, amount: number): Account {
  give(sim, current(sim), amount);
  sim.must({ kind: 'bank.open_term', payload: { amount } });
  return termsOf(sim, sim.player).at(-1)!;
}

describe('the research', () => {
  it('names only banks SLATE has, and a default among each bank’s choices', () => {
    for (const table of [ACCOUNT_LIFE, CASH]) expect(Object.keys(table).filter((id) => !bankById(id))).toEqual([]);
    for (const rules of Object.values(ACCOUNT_LIFE)) if (rules.atEnd) expect(rules.endChoices).toContain(rules.atEnd);
    // Chase's CDs renew unless told otherwise, whatever its single-maturity ones do.
    expect(ACCOUNT_LIFE['us-chase']!.atEnd).toBe('renews');
  });
});

describe('a term deposit’s end', () => {
  it('renews at Chase for the same term, with ten days to take it whole', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'life-renew');
    const term = openTerm(sim, 10_000_00);
    const months = Math.round((term.maturesAt! - term.openedAt) / (30.44 * MS_DAY));
    const opened = term.openedAt;
    sim.advanceTo(term.maturesAt! + MS_DAY);
    expect(term.closedAt).toBeUndefined();
    expect(term.balance).toBeGreaterThan(10_000_00);
    expect(term.openedAt).toBe(opened);
    expect(Math.round((term.maturesAt! - term.renewedAt!) / (30.44 * MS_DAY))).toBe(months);
    expect(term.graceUntil! - term.renewedAt!).toBe(10 * MS_DAY);
    expect(breakQuote(sim, term).penalty).toBe(0);
    // Past the grace, 180 days’ interest for a term of six months to two years, never more than this term has earned.
    sim.advanceTo(term.graceUntil! + MS_DAY);
    expect(breakQuote(sim, term)).toMatchObject({ penalty: Math.min(Math.round(term.balance * term.fixedRate! * 180 / 365), Math.floor(term.accrued!)), estimate: false });
    expect(breakQuote(sim, term).penalty).toBe(Math.floor(term.accrued!));
    // And again, for the same term, not the time since it first opened.
    sim.advanceTo(term.maturesAt! + MS_DAY);
    expect(Math.round((term.maturesAt! - term.renewedAt!) / (30.44 * MS_DAY))).toBe(months);
  });

  it('pays out instead when the holder says so, and moves into savings where that’s the bank’s way', () => {
    const us = lifeIn('us-ny-newyork', 'us-chase', 'life-payout');
    const cd = openTerm(us, 10_000_00);
    expect(run(us, 'bank.set_term_end', { accountId: cd.id, atEnd: 'savings' }).ok).toBe(false);
    us.must({ kind: 'bank.set_term_end', payload: { accountId: cd.id, atEnd: 'paid_out' } });
    expect(termEndOf(cd)).toBe('paid_out');
    us.advanceTo(cd.maturesAt! + MS_DAY);
    expect(cd.closedAt).toBeDefined();

    const au = lifeIn('au-nsw-sydney', 'au-commbank', 'life-holding');
    const td = openTerm(au, 10_000_00);
    const saver = savings(au);
    const before = saver?.balance ?? 0;
    au.advanceTo(td.maturesAt! + MS_DAY);
    expect(td.closedAt).toBeDefined();
    expect(au.universe.transactions.some((t) => t.memo === `${td.name} paid out`)).toBe(false);
    const into = savings(au)!;
    expect(into.bankId).toBe('au-commbank');
    // Principal and a year’s interest, more or less whatever else moved.
    expect(into.balance - before).toBeGreaterThan(10_000_00 * 1.04);
  });

  it('keeps Deutsche Bank’s three months’ notice to change it, and writes in time for it', () => {
    const sim = lifeIn('de-be-berlin', 'de-deutsche-bank', 'life-notice');
    const term = openTerm(sim, 20_000_00);
    sim.advanceTo(term.maturesAt! - 100 * MS_DAY);
    expect(term.maturityNoticed).toBe(true);
    sim.advanceTo(term.maturesAt! - 89 * MS_DAY);
    expect(run(sim, 'bank.set_term_end', { accountId: term.id, atEnd: 'paid_out' }).ok).toBe(false);
    expect(termEndOf(term)).toBe('renews');
  });
});

describe('breaking a term deposit early', () => {
  it('is refused where the bank doesn’t allow it, except in the country’s cooling-off period', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-rbc', 'life-gic');
    const term = openTerm(sim, 5_000_00);
    expect(breakQuote(sim, term)).toEqual({ penalty: 0, estimate: false });
    sim.advanceBy(20 * MS_DAY);
    expect(breakQuote(sim, term).refused).toBeDefined();
    expect(run(sim, 'bank.break_term', { accountId: term.id }).ok).toBe(false);
  });

  it('is refused once an Irish deposit has renewed: renewing doesn’t make it new again', () => {
    const sim = lifeIn('ie-lei-dublin', 'ie-aib', 'life-renewed');
    const term = openTerm(sim, 5_000_00);
    sim.advanceTo(term.maturesAt! + MS_DAY);
    expect(term.closedAt).toBeUndefined();
    expect(breakQuote(sim, term).refused).toBeDefined();
  });

  it('forfeits the interest so far where the bank words its penalty another way, SLATE’s estimate', () => {
    const sim = lifeIn('fr-idf-paris', 'fr-bnp-paribas', 'life-cat');
    const term = openTerm(sim, 10_000_00);
    sim.advanceBy(60 * MS_DAY);
    const earned = Math.floor(term.accrued!);
    expect(earned).toBeGreaterThan(0);
    expect(breakQuote(sim, term)).toMatchObject({ penalty: earned, estimate: true });
    const before = current(sim).balance;
    sim.must({ kind: 'bank.break_term', payload: { accountId: term.id } });
    expect(term.closedAt).toBeDefined();
    expect(current(sim).balance - before).toBe(10_000_00);
  });

  it('takes a penalty bigger than the interest from the deposit itself where the bank doesn’t cap it, as Citi doesn’t', () => {
    const sim = lifeIn('us-ny-newyork', 'us-citi', 'life-principal');
    const term = openTerm(sim, 10_000_00);
    sim.advanceBy(30 * MS_DAY);
    const quote = breakQuote(sim, term);
    const earned = Math.floor(term.accrued!);
    expect(quote.penalty).toBeGreaterThan(earned);
    const before = current(sim).balance;
    sim.must({ kind: 'bank.break_term', payload: { accountId: term.id } });
    expect(current(sim).balance - before).toBe(10_000_00 - (quote.penalty - earned));
  });

  it('asks a week’s interest at least in a Chase CD’s first week, past its cap', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'life-week');
    const term = openTerm(sim, 10_000_00);
    sim.advanceBy(3 * MS_DAY);
    const week = Math.round(10_000_00 * term.fixedRate! * 7 / 365);
    expect(Math.floor(term.accrued!)).toBeLessThan(week);
    expect(breakQuote(sim, term).penalty).toBe(week);
    sim.advanceBy(10 * MS_DAY);
    expect(breakQuote(sim, term).penalty).toBe(Math.floor(term.accrued!));
    // Past the first week, with the interest taken out, the cap leaves nothing.
    sim.must({ kind: 'bank.take_term_interest', payload: { accountId: term.id } });
    expect(breakQuote(sim, term).penalty).toBe(0);
  });

  it('lets Chase’s interest be taken during the term, where the bank allows it', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'life-take');
    const term = openTerm(sim, 10_000_00);
    sim.advanceBy(60 * MS_DAY);
    const earned = Math.floor(term.accrued!);
    const before = current(sim).balance;
    const recorded = (yearOf(sim.player, 2026).interest ?? 0);
    sim.must({ kind: 'bank.take_term_interest', payload: { accountId: term.id } });
    expect(current(sim).balance - before).toBe(earned);
    // On the year's return, with what the savings paid.
    expect(yearOf(sim.player, 2026).interest).toBe(recorded + earned);
    expect(term.accrued!).toBeLessThan(1);
    const fr = lifeIn('fr-idf-paris', 'fr-bnp-paribas', 'life-take-fr');
    const cat = openTerm(fr, 10_000_00);
    fr.advanceBy(60 * MS_DAY);
    expect(run(fr, 'bank.take_term_interest', { accountId: cat.id }).ok).toBe(false);
  });
});

describe('savings', () => {
  it('charges RBC’s fee for each withdrawal past its free one a month', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-rbc', 'life-withdraw');
    let saver = savings(sim);
    if (!saver) saver = sim.universe.accounts[sim.must<{ accountId: string }>({ kind: 'bank.open_savings', payload: {} }).accountId]!;
    give(sim, saver, 1_000_00);
    const move = () => run(sim, 'bank.transfer', { fromId: saver.id, toId: current(sim).id, amount: 10_00 });
    const fees = () => sim.universe.transactions.filter((t) => t.memo.startsWith('Savings withdrawal fee')).length;
    const already = sim.universe.transactions.filter((t) => t.category === 'transfer' && t.postings.some((q) => q.accountId === saver.id && q.amount < 0)).length;
    for (let i = already; i < 1; i += 1) expect(move().ok).toBe(true);
    expect(fees()).toBe(0);
    const before = saver.balance;
    expect(move().ok).toBe(true);
    expect(fees()).toBe(1);
    expect(before - saver.balance).toBe(10_00 + ACCOUNT_LIFE['ca-rbc']!.withdrawalFee!);
  });

  it('rounds Bank of America’s debit purchases up into savings at the day’s end, and not Chase’s', () => {
    expect(roundUpOf(12_34)).toBe(66);
    expect(roundUpOf(12_00)).toBe(0);
    const sim = lifeIn('us-ny-newyork', 'us-bank-of-america', 'life-round');
    give(sim, current(sim), 1_000_00);
    sim.must({ kind: 'bank.set_round_ups', payload: { on: true } });
    const saver = savings(sim)!;
    const before = saver.balance;
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
    spend(sim, sim.player, 12_34, 'Groceries', 'food');
    expect(sim.player.roundUps!.pending).toBe(66);
    sim.advanceBy(MS_DAY);
    expect(sim.player.roundUps!.pending).toBe(0);
    expect(sim.universe.transactions.some((t) => t.memo === 'Round-ups' && t.postings.some((q) => q.accountId === saver.id && q.amount === 66))).toBe(true);
    expect(saver.balance).toBeGreaterThanOrEqual(before + 66);
    expect(run(lifeIn('us-ny-newyork', 'us-chase', 'life-round-chase'), 'bank.set_round_ups', { on: true }).ok).toBe(false);
  });
});

describe('an idle account', () => {
  it('goes dormant after TD’s twelve months, is blocked, and wakes when reactivated', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-td', 'life-dormant');
    let saver = savings(sim);
    if (!saver) saver = sim.universe.accounts[sim.must<{ accountId: string }>({ kind: 'bank.open_savings', payload: {} }).accountId]!;
    give(sim, saver, 100_00);
    const long = sim.now - 13 * 30.44 * MS_DAY;
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? long : sim.now));
    expect(saver.dormant).toBe(true);
    expect(current(sim).dormant).toBeUndefined();
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current(sim).id, amount: 10_00 }).ok).toBe(false);
    sim.must({ kind: 'bank.reactivate', payload: { accountId: saver.id } });
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? long : sim.now));
    expect(saver.dormant).toBeUndefined();
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current(sim).id, amount: 10_00 }).ok).toBe(true);
  });

  it('earns nothing while dormant where the bank says so', () => {
    const sim = lifeIn('us-ny-newyork', 'us-bank-of-america', 'life-stop');
    const saver = savings(sim)!;
    give(sim, saver, 100_000_00);
    saver.accrued = 0;
    saver.dormant = true;
    sim.advanceBy(MS_DAY);
    expect(saver.accrued ?? 0).toBe(0);
    delete saver.dormant;
    sim.advanceBy(MS_DAY);
    expect(saver.accrued!).toBeGreaterThan(0);
  });

  it('goes to the state after the country’s years, and comes back when claimed', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'life-unclaimed');
    const saver = savings(sim)!;
    give(sim, saver, 500_00);
    const held = saver.balance;
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - 2.9 * 365.25 * MS_DAY : sim.now));
    expect(saver.closedAt).toBeUndefined();
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - 3.1 * 365.25 * MS_DAY : sim.now));
    expect(saver.closedAt).toBeDefined();
    expect(sim.player.unclaimed).toEqual([expect.objectContaining({ amount: held })]);
    const before = current(sim).balance;
    sim.must({ kind: 'bank.claim_unclaimed', payload: {} });
    expect(current(sim).balance - before).toBe(held);
    expect(sim.player.unclaimed).toEqual([]);
    expect(run(sim, 'bank.claim_unclaimed', {}).ok).toBe(false);
  });

  it('stays with a German bank however long it sits, Germany having no scheme', () => {
    const sim = lifeIn('de-be-berlin', 'de-deutsche-bank', 'life-de');
    const saver = savings(sim)!;
    give(sim, saver, 500_00);
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - 40 * 365.25 * MS_DAY : sim.now));
    expect(saver.closedAt).toBeUndefined();
  });
});

describe('changing one’s mind', () => {
  it('cancels a new savings account whole in Canada’s fourteen days, not after, and never a British fixed deposit', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-td', 'life-cool');
    for (const a of bankAccountsOf(sim, sim.player)) if (a.kind === 'savings') sim.must({ kind: 'bank.close_savings', payload: { accountId: a.id } });
    const opened = sim.universe.accounts[sim.must<{ accountId: string }>({ kind: 'bank.open_savings', payload: {} }).accountId]!;
    give(sim, opened, 300_00);
    const before = current(sim).balance;
    sim.must({ kind: 'bank.cancel_new', payload: { accountId: opened.id } });
    expect(opened.closedAt).toBeDefined();
    expect(current(sim).balance - before).toBe(300_00);
    const late = sim.universe.accounts[sim.must<{ accountId: string }>({ kind: 'bank.open_savings', payload: {} }).accountId]!;
    sim.advanceBy(15 * MS_DAY);
    expect(run(sim, 'bank.cancel_new', { accountId: late.id }).ok).toBe(false);

    const gb = lifeIn('uk-eng-london', 'gb-natwest', 'life-cool-gb');
    const fixed = openTerm(gb, 5_000_00);
    expect(inCoolingOff(gb, fixed)).toBe(false);
    expect(inCoolingOff(gb, current(gb))).toBe(true);
  });
});
