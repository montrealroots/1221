/**
 * Brief 15, the money area (`docs/verification/editorial-2026-10-19/money/`): the defects found while rewriting the
 * money screens' words, each with the case that failed before its fix, and the new words read where a player meets
 * them.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';

const run = (sim: Simulation, kind: string, payload: Record<string, unknown>) => sim.execute({ kind, payload });
const own = (sim: Simulation, kind: 'checking' | 'savings', bankId: string): Account =>
  Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === kind && a.bankId === bankId && a.category !== 'term')!;
/** Sets an account's balance to a figure, against a test account, as the other money tests set one up. */
const setTo = (sim: Simulation, account: Account, to: number) => {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
};

describe('m1: a limit Move Money gives in a refusal is the limit, to the cent', () => {
  it('Deutsche Bank savings with €1,999.50 of the month’s €2,000 left says €1,999.50, not €2,000', () => {
    const sim = quickSave({ homeRegionId: 'de-be-berlin', startLocationId: 'de-be-berlin', livesWhereBorn: true, wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'ed15-m1-de');
    const current = own(sim, 'checking', 'de-deutsche-bank');
    // A comfortable life starts with Flexgeld beside the AktivKonto, holding far more than the month's €2,000.
    const saver = own(sim, 'savings', 'de-deutsche-bank');
    expect(saver.balance).toBeGreaterThan(2_000_00);
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 50 }).ok).toBe(true);
    // Until brief 15 the figure was written in whole euros, €2,000, more than the €1,999.50 the account lets out.
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 1_999_75 }).error)
      .toBe(`You can take only €1,999.50 more out of ${saver.name} this month without notice, so nothing was moved. To take out more, you’d have to close the account, which takes three months’ notice.`);
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 1_999_50 }).ok).toBe(true);
  });

  it('RBC savings holding C$100.50 with its C$2.00 fee due says at most C$98.50, not C$99', () => {
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ca-rbc' }, 'ed15-m1-rbc');
    const saver = own(sim, 'savings', 'ca-rbc');
    const current = own(sim, 'checking', 'ca-rbc');
    // The month's free withdrawal used, so the next costs the bank's fee.
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 1_00 }).ok).toBe(true);
    setTo(sim, saver, 100_50);
    // Until brief 15 it said "at most C$99", which the same refusal turned down.
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 99_00 }).error)
      .toBe(`With the C$2.00 withdrawal fee, you can move at most C$98.50 out of ${saver.name}, so nothing was moved.`);
    expect(run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 98_50 }).ok).toBe(true);
    expect(saver.balance).toBe(0);
  });
});

describe('the month’s statement notice says how the account ended the period, and where the statement is', () => {
  const statementOf = (sim: Simulation, account: Account) => sim.universe.notifications.filter((n) => n.title === `Statement Ready: ${account.name}`).map((n) => n.body);

  it('a Chase Total Checking left overdrawn at the month’s end says it ended the month overdrawn, to the cent', () => {
    const sim = quickSave({ homeRegionId: 'us-ct-newhaven', startLocationId: 'us-ct-newhaven', wealth: 'comfortable', bankId: 'us-chase' }, 'ed15-statement-us');
    run(sim, 'bank.set_alerts', { statements: true });
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const p = new Date(sim.now);
    const monthEnd = Date.UTC(p.getUTCFullYear(), p.getUTCMonth() + 1, 1, 12);
    setTo(sim, checking, 0);
    sim.advanceTo(monthEnd - 30 * 60 * 60_000);
    setTo(sim, checking, -3_30);
    sim.advanceTo(monthEnd);
    expect(statementOf(sim, checking).at(-1)).toMatch(/^It ended the month overdrawn by \$\d+\.\d\d\. The statement is on Money, under Statements\.$/);
  });

  it('a Deutsche Bank AktivKonto, closed each quarter, says it ended the quarter, and only at the quarter’s end', () => {
    const sim = quickSave({ homeRegionId: 'de-be-berlin', startLocationId: 'de-be-berlin', livesWhereBorn: true, wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'ed15-statement-de');
    run(sim, 'bank.set_alerts', { statements: true });
    const giro = own(sim, 'checking', 'de-deutsche-bank');
    sim.advanceTo(sim.now + 100 * 24 * 60 * 60_000);
    const said = statementOf(sim, giro);
    expect(said.length).toBeGreaterThan(0);
    for (const body of said) expect(body).toMatch(/^It ended the quarter with €[\d,]+\.\d\d in it\. The statement is on Money, under Statements\.$/);
  });
});

describe('refusals no other test reads, in their new words', () => {
  const life = (seed: string) => quickSave({ homeRegionId: 'us-ct-newhaven', startLocationId: 'us-ct-newhaven', wealth: 'comfortable', bankId: 'us-chase' }, seed);

  it('closing savings with no checking account to take the money says so', () => {
    const sim = life('ed15-close-savings');
    const saver = own(sim, 'savings', 'us-chase');
    // TEST SETUP: no primary account, which no press reaches.
    delete sim.player.primaryAccountId;
    expect(run(sim, 'bank.close_savings', { accountId: saver.id }).error).toBe('You don’t have a checking account to move the money into.');
  });

  it('wages sent to a card, autopay from savings and a dated payment from a term deposit are each refused in plain words', () => {
    const sim = life('ed15-refusals');
    const saver = own(sim, 'savings', 'us-chase');
    const checking = own(sim, 'checking', 'us-chase');
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card');
    expect(card).toBeDefined();
    expect(run(sim, 'bank.redirect_deposits', { accountId: card!.id }).error).toBe('Choose one of your open checking or savings accounts for your wages.');
    expect(run(sim, 'card.set_autopay_from', { cardId: card!.id, accountId: saver.id }).error).toBe('Autopay has to pay from one of your open checking accounts.');
    const term = run(sim, 'bank.open_term', { amount: 1_000_00 });
    expect(term.ok).toBe(true);
    const termId = (term.value as { accountId: string }).accountId;
    const name = sim.universe.accounts[termId]!.name;
    expect(run(sim, 'bank.schedule_payment', { fromId: termId, toId: checking.id, amount: 10_00, at: sim.now + 86_400_000 }).error)
      .toBe(`${name} is a term deposit, locked until its end. A payment set for a date goes between your checking and easy-access savings accounts.`);
  });
});
