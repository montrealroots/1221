/**
 * The overdraft's set-off, found on 2026-10-16 while SMBC's fee was being fixed (`closeForOverdraft`,
 * `systems/lending.ts`). Every life is made as the game makes one and played on the clock.
 *
 * What was wrong, and is measured here:
 *
 * - Between two accounts in a currency not the save's, each side of the set-off worked out its own figure from the
 *   dollars: ¥441 left SMBC's savings to cover ¥440. A Parisian at BNP Paribas, whose €15 a month for a customer abroad
 *   overdraws the Compte de dépôt, emptied to Chase first (it opens with its fees to graduation since the same day): on 30 December the Livret A pays in exactly the euros the
 *   current account owes, and the current account ends at nothing in both figures.
 * - BNP Paribas' notice of 31 October said the account closes on December 29 unless it's back within it; it closed
 *   nothing, and the notice that followed said "closed it" all the same. It closes now, its payments go to Chase, and
 *   the notice names what closed and what stays open. The Livret A's interest, settled first so it's set off too, was
 *   called "on closing"; it stays open, and says "before the set-off".
 * - France's letters on the overrun quoted a euro account in dollars alone ("$32.86 beyond it"); they're in euros, the
 *   dollars beside: €15 twice and 24 cents of interest is €30.24 ($32.86) on 1 October. Its offer of a loan for the
 *   overrun, made and taken until the same day, isn't made by a bank abroad, which opens nothing new for a customer
 *   abroad.
 * - A Livret A drained to €20 by a payment to Chase gives its whole, in euros, and the rest of the debt is charged off.
 * - A New Haven student with Chase savings that cover it and a Bank of America current account beside: Chase's closes,
 *   the primary and the work-study's wages move to Bank of America.
 * - A Londoner banking at Chase, overdrawn 60 days with Chase savings that cover it (TEST SETUP, $3,000 under and $5,000
 *   saved) and no other American current account: Chase takes what it's owed and keeps the current account, which the notice says. An account at HSBC UK
 *   doesn't count as somewhere to bank instead, as Yale pays only into an American one.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, loadPlacesFor } from '@/engine';
import { newLifeConfig, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { addCountryHolidays } from '@/engine/content/holidays';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';

for (const country of ['uk', 'fr']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

const life = (extra: Partial<NewSaveConfig>): NewSaveConfig => ({
  ...withFamily(newLifeConfig(), 'modest'),
  homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', ...extra,
});
const make = async (config: NewSaveConfig) => { const sim = createSave(1, 'abroad', config); await loadPlacesFor(sim.universe); return sim; };
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId === sim.player.id);
const at = (sim: Simulation, bankId: string, kind: 'checking' | 'savings') => mine(sim).find((a) => a.bankId === bankId && a.kind === kind)!;
/**
 * The Compte de dépôt's €599 sent to Chase (BNP Paribas charges nothing to send it), so its fees overdraw it as they
 * did before 2026-10-16, when it opened at nothing: it opens with what they come to until graduation now, (€2.60 + €15)
 * × 34 = €598.40, in whole euros.
 */
const emptied = (sim: Simulation, current: Account) => {
  expect(current.held).toBe(59_900);
  expect(sim.execute({ kind: 'bank.transfer', payload: { fromId: current.id, toId: at(sim, 'us-chase', 'checking').id, amount: 59_900, in: 'EUR' } }).ok).toBe(true);
  expect([current.held, current.balance]).toEqual([0, 0]);
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).map((n) => n.body);

describe('the set-off against an overdraft', () => {
  it('writes BNP Paribas’ letters in euros, sets the Livret A off in euros exactly, closes the Compte de dépôt as its notice said, and keeps the Livret A', async () => {
    const sim = await make(life({ homeRegionId: 'fr-idf-paris', priorResidence: { cityId: 'fr-idf-paris', fromYear: 2002, fromMonth: 6 }, homeBankId: 'fr-bnp-paribas' }));
    const current = at(sim, 'fr-bnp-paribas', 'checking');
    const livret = at(sim, 'fr-bnp-paribas', 'savings');
    emptied(sim, current);
    sim.advanceTo(Date.UTC(2026, 11, 29, 12));
    // France's letters in euros, the dollars beside: €15 twice and 24 cents of interest by 1 October.
    expect(titled(sim, 'BNP Paribas Wrote About Your Overrun')).toEqual(['Your account has been past its overdraft limit for a month, by €30.24 ($32.86). The bank charges 18.40% a year on what’s overdrawn, as well as its monthly charges. French law has the bank tell you after a month.']);
    // No loan for the overrun from a bank abroad, which opens nothing new for a customer abroad: until 2026-10-16 it
    // offered one, and lent it.
    expect(titled(sim, 'BNP Paribas Offered A Loan For The Overrun')).toEqual([]);
    expect(current.creditOffered).toBeUndefined();
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: { accountId: current.id } }).error).toBe('Your bank has offered no loan for an overrun.');
    // TEST SETUP: an offer made before 2026-10-16, kept in an older save, is refused in the bank's words.
    current.creditOffered = { amount: 4_970, apr: 0.0607, months: 12 };
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: { accountId: current.id } }).error).toBe('No way to open anything new at BNP Paribas from America was found, so the game assumes there’s none.');
    delete current.creditOffered;
    expect(titled(sim, 'BNP Paribas Gave Notice To Close')).toEqual(['Your account has been past its overdraft limit for 60 days, so it closes in two months, on December 29, 2026, unless it’s back within the limit by then.']); // Until 2026-10-16 (brief 09's banking follow-up) this asserted the notice's straight apostrophe (\').
    const owedHeld = -current.held!;
    expect(owedHeld).toBeGreaterThan(0);
    const owedThen = -current.balance;
    sim.advanceTo(Date.UTC(2027, 0, 2, 12));
    const setOff = sim.universe.transactions.filter((t) => t.memo === 'Set off against the overdraft');
    expect(setOff).toHaveLength(1);
    // The overdraft interest built since 1 December is charged before the set-off, and set off with the rest (from
    // 2026-10-16: until then the set-off took the debt as it stood on the 29th, €61.42, and the interest was dropped with
    // the account). Twenty-nine day ends, 2 to 30 December, on the debt at 18.40%, with less than a cent carried from
    // November: 29 × owed × 0.184 / 365, in whole cents.
    const interest = sim.universe.transactions.filter((t) => t.memo === 'Overdraft interest, on closing').map((t) => t.postings.find((p) => p.accountId === current.id)!);
    expect(interest).toHaveLength(1);
    const built = (29 * owedThen * 0.184) / 365;
    expect(-interest[0]!.amount).toBeGreaterThanOrEqual(Math.floor(built));
    expect(-interest[0]!.amount).toBeLessThanOrEqual(Math.floor(built + 1));
    const settled = -interest[0]!.native!;
    expect(settled).toBeGreaterThan(0);
    expect(setOff[0]!.postings.map((p) => [p.accountId, p.native])).toEqual([[livret.id, -(owedHeld + settled)], [current.id, owedHeld + settled]]);
    expect([current.balance, current.held, current.closedAt !== undefined]).toEqual([0, 0, true]);
    expect(livret.closedAt).toBeUndefined();
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Interest: Livret A,')).map((t) => t.memo)).toEqual(['Interest: Livret A, before the set-off']);
    expect(titled(sim, 'BNP Paribas Closed An Account')).toEqual(['BNP Paribas closed Compte de dépôt. It had been below zero for 60 days, so the bank took what it was owed from your other money there. Livret A stays open.']);
    expect(sim.player.primaryAccountId).toBe(at(sim, 'us-chase', 'checking').id);
    expect(breaches(sim.universe)).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);

  it('sets off the whole of a Livret A that holds less than is owed, in euros, and charges the rest off', async () => {
    const sim = await make(life({ homeRegionId: 'fr-idf-paris', priorResidence: { cityId: 'fr-idf-paris', fromYear: 2002, fromMonth: 6 }, homeBankId: 'fr-bnp-paribas' }));
    const current = at(sim, 'fr-bnp-paribas', 'checking');
    const livret = at(sim, 'fr-bnp-paribas', 'savings');
    // All but €20 sent to Chase (BNP Paribas charges nothing to send it); its fee overdraws the current account by more.
    emptied(sim, current);
    sim.execute({ kind: 'bank.transfer', payload: { fromId: livret.id, toId: at(sim, 'us-chase', 'checking').id, amount: livret.held! - 2_000, in: 'EUR' } });
    expect(livret.held).toBe(2_000);
    sim.advanceTo(Date.UTC(2027, 0, 2, 12));
    const setOff = sim.universe.transactions.find((t) => t.memo === 'Set off against the overdraft')!;
    const held = setOff.postings.find((p) => p.accountId === livret.id)!.native!;
    // The whole of the Livret A, its €20 and the interest settled before it, and nothing past it.
    expect(held).toBeLessThan(-2_000);
    expect([livret.balance, livret.held]).toEqual([0, 0]);
    expect(setOff.postings.find((p) => p.accountId === current.id)!.native).toBe(-held);
    expect(sim.universe.transactions.some((t) => t.memo === 'Charged off by BNP Paribas')).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('closes Chase’s current account where the savings cover it and Bank of America has another, moving the primary and the wages there', async () => {
    const sim = await make(life({}));
    const chase = at(sim, 'us-chase', 'checking');
    // Without an account kept at home, the family's savings opened at Chase.
    const savings = at(sim, 'us-chase', 'savings');
    const opened = sim.execute<{ accountId?: string; arrivesAt?: number }>({ kind: 'bank.open_current', payload: { bankId: 'us-bank-of-america', fundFrom: chase.id, amount: 10_000 } });
    expect(opened.ok, opened.error).toBe(true);
    sim.advanceTo(sim.now + 7 * 86_400_000);
    const bofa = at(sim, 'us-bank-of-america', 'checking');
    expect(bofa).toBeDefined();
    // TEST SETUP: Chase's current account $3,000 below zero and $5,000 in its savings, as in the case below.
    const test = sim.nominalAccount('expense', 'Test').id;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: chase.id, amount: -(chase.balance + 300_000) }, { accountId: test, amount: chase.balance + 300_000 }] });
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: savings.id, amount: 500_000 }, { accountId: test, amount: -500_000 }] });
    expect(sim.player.primaryAccountId).toBe(chase.id);
    // The wages are paid into Chase's current account by name, set at the first deposit routed.
    expect(sim.player.payments?.depositTo).toBe(chase.id);
    sim.advanceTo(sim.now + 75 * 86_400_000);
    expect(chase.closedAt).toBeDefined();
    expect(sim.player.payments?.depositTo).toBe(bofa.id);
    expect(savings.closedAt).toBeUndefined();
    expect(sim.player.primaryAccountId).toBe(bofa.id);
    const closedAt = chase.closedAt!;
    expect(sim.universe.transactions.filter((t) => t.at > closedAt && t.memo.startsWith('Work-study wages')).every((t) => t.postings.some((p) => p.accountId === bofa.id))).toBe(true);
    expect(sim.universe.transactions.some((t) => t.at > closedAt && t.memo.startsWith('Work-study wages'))).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('keeps Chase’s current account open where its savings cover it and the only other is kept at home abroad', async () => {
    const sim = await make(life({ priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: 'gb-hsbc' }));
    const chase = at(sim, 'us-chase', 'checking');
    const { accountId } = sim.execute<{ accountId: string }>({ kind: 'bank.open_savings', payload: { bankId: 'us-chase' } }).value!;
    const savings = sim.universe.accounts[accountId]!;
    // TEST SETUP: after the term's scholarship, Chase's current account $3,000 below zero, more than the work-study
    // brings back in sixty days, and $5,000 in its savings to cover it.
    sim.advanceTo(sim.now + 2 * 86_400_000);
    const test = sim.nominalAccount('expense', 'Test').id;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: chase.id, amount: -(chase.balance + 300_000) }, { accountId: test, amount: chase.balance + 300_000 }] });
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: savings.id, amount: 500_000 }, { accountId: test, amount: -500_000 }] });
    sim.advanceTo(sim.now + 75 * 86_400_000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Set off against the overdraft')).toBe(true);
    expect(chase.closedAt).toBeUndefined();
    expect(sim.player.primaryAccountId).toBe(chase.id);
    expect(titled(sim, 'Chase Took What It Was Owed')).toEqual([`${chase.name} had been below zero for 60 days, so the bank took what it was owed from your other money there. ${chase.name} and ${savings.name} stay open.`]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});
