/**
 * A French overrun at a second bank, and a loan's repayment through a completed switch (group g18, from 2026-10-12).
 *
 * Since 2026-10-10 a person may keep a current account at more than one bank, and hold a personal loan at each. Until
 * 2026-10-12 two things hadn't followed. A French bank's loan for an overrun was offered on whichever current account
 * ran past its overdraft, but Take The Loan only read the primary account's offer, so a second bank's was refused ("Your
 * bank has offered no loan for an overrun."), and a loan held at any bank stopped the offer and refused the loan. And a
 * switch that completed moved every payment instruction off the old account except a loan's repayment, which then fell
 * to the current account at the lender's bank in place of the account that took over.
 *
 * PLAYER JOURNEYS play through the commands the screen gives; a FIXTURE sets a state by hand, and says so. The bank
 * screen's panel is rendered as the player has it, and its button pressed as the player presses it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { bankById } from '@/engine/content/banks';
import { checkingsOf, loanOf, repaymentAccount } from '@/engine/systems/lending';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; onClick?: () => void }[],
}));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, onClick: props.onClick as (() => void) | undefined }); return ce(real.Gated, props); } };
});

const { BankLending } = await import('@/ui/bank/BankLending');

const lifeIn = (cityId: string, bankId: string, seed: string) => quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
/** FIXTURE: a month's wages paid in, as a payday posts them. */
const wages = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: id, amount }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -amount }] });
/** FIXTURE: an account set to a balance by hand, as spending past its overdraft would leave it. */
const setBalance = (sim: Simulation, id: string, to: number) => {
  const a = sim.universe.accounts[id]!;
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount: to - a.balance }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: a.balance - to }] });
};

/** A Paris life banking with BNP Paribas, a current account opened at LCL, and LCL's run €2,000 past its overdraft. */
function overrunAtLcl(seed: string, before?: (sim: Simulation) => void): { sim: Simulation; bnp: string; lcl: string } {
  const sim = lifeIn('fr-idf-paris', 'fr-bnp-paribas', seed);
  const bnp = primary(sim).id;
  const lcl = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'fr-lcl' }).accountId;
  // FIXTURE: the primary kept well in funds, so only LCL's account runs past its overdraft.
  wages(sim, bnp, 20_000_00);
  before?.(sim);
  setBalance(sim, lcl, -((sim.universe.accounts[lcl]!.overdraftLimit ?? 0) + 2_000_00));
  sim.advanceBy(100 * MS_DAY);
  return { sim, bnp, lcl };
}

describe('PLAYER JOURNEY: a French overrun at the second bank', () => {
  it('is offered on LCL’s account, and taking it opens the loan at LCL and pays it into that account', () => {
    const { sim, bnp, lcl } = overrunAtLcl('g18-overrun');
    const account = sim.universe.accounts[lcl]!;
    expect(primary(sim).id).toBe(bnp);
    expect(primary(sim).creditOffered).toBeUndefined();
    expect(account.creditOffered).toBeDefined();
    const offered = account.creditOffered!.amount;
    const [lclBefore, bnpBefore] = [account.balance, primary(sim).balance];
    const r = run<{ apr: number; payment: number }>(sim, 'bank.take_overrun_loan', { accountId: lcl });
    expect(r.payment).toBeGreaterThan(0);
    const loan = loanOf(sim, sim.player, 'fr-lcl')!;
    expect(loan.balance).toBe(-offered);
    expect(loan.institution).toBe(bankById('fr-lcl')!.name);
    expect(account.balance).toBe(lclBefore + offered);
    expect(primary(sim).balance).toBe(bnpBefore);
    expect(repaymentAccount(sim, sim.player, loan)!.id).toBe(lcl);
    expect(loanOf(sim, sim.player, 'fr-bnp-paribas')).toBeUndefined();
    expect(account.creditOffered).toBeUndefined();
    // The primary's own offer is still what no account names: there's none.
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: {} }).error).toBe('Your bank has offered no loan for an overrun.');
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: { accountId: 'nope' } }).error).toBe('That isn’t an open current account of yours.');
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);

  it('is offered and taken at LCL while a loan is held at BNP Paribas, a loan at each bank as lending allows', () => {
    const { sim, lcl } = overrunAtLcl('g18-two-loans', (s) => {
      run(s, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'fr-bnp-paribas' });
    });
    expect(loanOf(sim, sim.player, 'fr-bnp-paribas')).toBeDefined();
    expect(sim.universe.accounts[lcl]!.creditOffered).toBeDefined();
    run(sim, 'bank.take_overrun_loan', { accountId: lcl });
    expect(loanOf(sim, sim.player, 'fr-lcl')).toBeDefined();
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);

  it('is refused where a loan is already held at that bank', () => {
    const { sim, lcl } = overrunAtLcl('g18-same-bank');
    expect(sim.universe.accounts[lcl]!.creditOffered).toBeDefined();
    // A personal loan taken at LCL after the offer was made, on the month's wages.
    wages(sim, primary(sim).id, 5_000_00);
    run(sim, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'fr-lcl' });
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: { accountId: lcl } }).error).toBe('You already have a loan with the bank.');
  }, 120_000);

  it('is taken from the bank screen’s Take The Loan, on the account the screen shows', () => {
    const { sim, lcl } = overrunAtLcl('g18-screen');
    h.sim = sim;
    h.clicks = [];
    const html = renderToStaticMarkup(createElement(BankLending, { bank: bankById('fr-lcl')!, show: ['borrowing'], account: sim.universe.accounts[lcl]! }));
    expect(html).toContain('A Loan For The Overrun');
    const take = h.clicks.find((c) => c.feature === 'bank.take_overrun_loan')!;
    expect(take).toBeDefined();
    take.onClick!();
    expect(loanOf(sim, sim.player, 'fr-lcl')).toBeDefined();
    expect(sim.universe.accounts[lcl]!.creditOffered).toBeUndefined();
  }, 120_000);
});

describe('PLAYER JOURNEY: a loan’s repayment through a completed switch', () => {
  it('moves to the new bank’s account with the wages and the autopay, not to the current account at the lender', () => {
    const sim = lifeIn('uk-eng-london', 'gb-barclays', 'g18-switch');
    const barclays = primary(sim).id;
    const hsbc = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'gb-hsbc' }).accountId;
    wages(sim, barclays, 5_000_00);
    // Borrowed at HSBC, repaid from Barclays, as agreed.
    const { loanId } = run<{ loanId: string }>(sim, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'gb-hsbc', intoId: barclays, repayFromId: barclays });
    const loan = sim.universe.accounts[loanId]!;
    expect(repaymentAccount(sim, sim.player, loan)!.id).toBe(barclays);
    const { at } = run<{ at: number }>(sim, 'bank.switch', { bankId: 'gb-natwest' });
    // Past the day, and past any card payment still pending that held Barclays open.
    sim.advanceTo(at + 10 * MS_DAY);
    const natwest = primary(sim);
    expect(natwest.bankId).toBe('gb-natwest');
    expect(sim.universe.accounts[barclays]!.closedAt).toBeDefined();
    expect(checkingsOf(sim, sim.player).map((a) => a.id)).toContain(hsbc);
    expect(loan.repayFromId).toBe(natwest.id);
    expect(repaymentAccount(sim, sim.player, loan)!.id).toBe(natwest.id);
  }, 120_000);
});
