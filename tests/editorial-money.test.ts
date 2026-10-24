/**
 * Brief 15, the money area (`docs/verification/editorial-2026-10-19/money/`): the defects found while rewriting the
 * money screens' words, each with the case that failed before its fix, and the new words read where a player meets
 * them.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY } from '@/engine/core/time';
import { CARDS, type CardProduct } from '@/engine/content/cards';
import { cardsOf, stateOf, STATEMENT_KIND } from '@/engine/systems/credit';
import { idleAccounts } from '@/engine/systems/accountlife';
import { homeAccountRefusal } from '@/engine/systems/homeaccount';

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
    const sim = quickSave({ homeRegionId: 'de-be-berlin', startLocationId: 'de-be-berlin', wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'ed15-m1-de');
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
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', wealth: 'comfortable', bankId: 'ca-rbc' }, 'ed15-m1-rbc');
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
    const sim = quickSave({ homeRegionId: 'de-be-berlin', startLocationId: 'de-be-berlin', wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'ed15-statement-de');
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

describe('the card’s notices and refusals, in their new words', () => {
  const ny = (seed: string) => quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, seed);
  const cardOf = (sim: Simulation) => cardsOf(sim, sim.player)[0]!;
  const bodies = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).map((n) => n.body);

  it('a balance moved onto a new card names both cards, the fee, the rate and when it ends', () => {
    const sim = ny('ed15-moved');
    const old = cardOf(sim);
    setTo(sim, old, -800_00);
    sim.must({ kind: 'bank.set_primary', payload: { accountId: sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } }).accountId } });
    sim.advanceBy(10 * MS_DAY);
    expect(run(sim, 'card.apply', { transfer: true }).ok).toBe(true);
    sim.advanceBy(8 * MS_DAY);
    // The old card's balance when the new one arrives: the $800.00 and the groceries on it since.
    expect(bodies(sim, 'Your Balance Moved')).toEqual([expect.stringMatching(/^\$[\d,]+\.\d\d moved from the Chase Freedom Unlimited onto your Citi Double Cash Card, for a \$\d+\.\d\d fee\. It’s charged 0% until \w+ \d+, \d{4}, then \d+(\.\d+)?%\. The old card is closed\.$/)]);
  });

  it('a card paid off while suspended says it works again, by name', () => {
    const sim = ny('ed15-works');
    const card = cardOf(sim);
    Object.assign(stateOf(sim.player, card), { suspended: 'late', missed: 2 });
    setTo(sim, card, 0);
    sim.advanceTo(sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === sim.player.id)!.at + 60_000);
    expect(bodies(sim, 'Your Card Works Again')).toEqual(['The Chase Freedom Unlimited is paid off, and Chase has lifted the suspension.']);
  });

  it('a card application turned down for an empty bank, and under 21, says why and what applying cost', () => {
    const sim = ny('ed15-declined');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings')) setTo(sim, a, 0);
    const applied = run(sim, 'card.apply', { bankId: 'us-citi' });
    expect(applied.value).toMatchObject({ approved: false });
    expect(bodies(sim, 'Card Application Declined').at(-1)).toMatch(/^Citi turned down your application because (applicants under 21 need income or money of their own, and you have none in the bank|you have no money in the bank to repay it from)\. Applying still took a few points off your credit score\.$/);
  });

  it('a money transfer with no checking account to take it is refused, and nothing moves', () => {
    const sim = ny('ed15-money-transfer');
    const card = cardOf(sim);
    const kept = (CARDS as Record<string, CardProduct>)[card.bankId!]!;
    // TEST SETUP: Chase's card offering a money transfer for 3%, as three cards in the research do, and no primary account.
    (CARDS as Record<string, CardProduct>)[card.bankId!] = { ...kept, moneyTransferFee: 0.03 };
    try {
      delete sim.player.primaryAccountId;
      const before = card.balance;
      expect(run(sim, 'card.money_transfer', { amount: 100_00, accountId: card.id }).error).toBe('You need a checking account for the money to go into.');
      expect(card.balance).toBe(before);
    } finally { (CARDS as Record<string, CardProduct>)[card.bankId!] = kept; }
  });

  it('a card charged off says how long it stays on the record, paid or not, and where to pay the debt', () => {
    const sim = quickSave({ homeRegionId: 'us-ct-newhaven', startLocationId: 'us-ct-newhaven', wealth: 'comfortable', bankId: 'us-chase' }, 'ed15-chargeoff');
    const { accountId } = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
    const card = cardOf(sim);
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId } });
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    sim.advanceTo(sim.now + 220 * MS_DAY);
    expect(card.closedAt).toBeDefined();
    expect(bodies(sim, 'Your Card Was Charged Off')).toEqual([expect.stringMatching(/^The \$[\d,]+\.\d\d you owed on the Chase Freedom Unlimited went to collections, and the card is closed\. The charge-off stays on your credit record for seven years, paid or not, and no bank approves a card while the debt is unpaid\. You can pay it on Money, under Borrowing\.$/)]);
  }, 120_000);
});

describe('borrowing’s refusals, in their new words', () => {
  it('an overdraft asked for under the score floor says the score the game arranges one from', () => {
    const sim = quickSave({ startLocationId: 'fr-idf-paris', homeRegionId: 'fr-idf-paris', bankId: 'fr-societe-generale' }, 'ed15-od-score');
    sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: sim.player.primaryAccountId!, amount: 2_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -2_000_00 }] });
    // TEST SETUP: a score under the floor, as a charged-off debt leaves one.
    sim.player.credit!.score = 500;
    expect(run(sim, 'bank.arrange_overdraft', { limit: 500_00 }).error).toBe('Your credit score is below 580, and in the game a bank doesn’t arrange an overdraft below that.');
  });

  it('an overdraft or a loan on an account that isn’t one of your checking accounts is refused in plain words', () => {
    // A New York student at Citi, past her first wages, as tests/evidence-g10-money.test.ts quotes a Citi loan.
    const sim = createSave(1, 'ed15-od-account', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-citi' });
    sim.advanceTo(Date.UTC(2026, 8, 12, 16));
    const saver = own(sim, 'savings', 'us-citi');
    expect(run(sim, 'bank.arrange_overdraft', { limit: 100_00, accountId: saver.id }).error).toBe('That isn’t one of your open checking accounts.');
    expect(run(sim, 'bank.borrow', { amount: 2_000_00, months: 60, bankId: 'us-citi', intoId: saver.id, repayFromId: saver.id }).error).toBe('The loan has to be paid into, and repaid from, one of your open checking accounts.');
  });
});

describe('accounts over time, cards and cash: refusals and notices in their new words', () => {
  const ny = (seed: string) => quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, seed);

  it('a new account that is the primary one can’t be canceled, and says to make another primary', () => {
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', wealth: 'comfortable', bankId: 'ca-td' }, 'ed15-cancel-primary');
    const rbc = sim.universe.accounts[sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'ca-rbc' } }).accountId]!;
    sim.must({ kind: 'bank.set_primary', payload: { accountId: rbc.id } });
    expect(run(sim, 'bank.cancel_new', { accountId: rbc.id }).error).toBe('You can’t cancel your primary account. Make another account primary first.');
  });

  it('savings left unused nearly three years: the bank’s letter says the years in words, and where the money would go', () => {
    const sim = ny('ed15-escheat');
    const saver = own(sim, 'savings', 'us-chase');
    setTo(sim, saver, 500_00);
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - (3 * 365.25 - 80) * MS_DAY : sim.now));
    const notice = Object.values(sim.universe.decisions).find((d) => d.refType === 'unclaimed-notice' && d.refId === saver.id)!;
    expect(notice.detail).toMatch(/^\$500\.00 in Chase Savings hasn’t been used for nearly three years\. Unless you tell the bank to keep the account by \w+ \d+, \d{4}, it goes to the state’s unclaimed-property office as unclaimed money\.$/);
  });

  it('a card locked, or cash taken out, with no checking account says so', () => {
    const sim = ny('ed15-no-checking');
    // TEST SETUP: no primary account, which no press reaches.
    delete sim.player.primaryAccountId;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'checking') a.closedAt = sim.now;
    expect(run(sim, 'card.lock', { which: 'debit', locked: true }).error).toBe('You don’t have a checking account.');
    expect(run(sim, 'cash.withdraw', { amount: 20_00, from: 'atm' }).error).toBe('You need a checking account to take cash out of.');
    expect(run(sim, 'card.report', { which: 'debit', why: 'lost' }).error).toBe('You don’t have a checking account.');
    expect(run(sim, 'bank.new_number', {}).error).toBe('You don’t have a checking account.');
  });

  it('a life outside Yale is asked where it lived before it came here, not before “this life”', () => {
    const config = { ...newLifeConfig(), school: undefined, priorResidence: undefined };
    expect(homeAccountRefusal(config, undefined)).toBe('You haven’t said where you lived before you came here.');
  });
});
