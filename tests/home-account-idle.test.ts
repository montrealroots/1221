/**
 * An account kept at home in a life that never touches it (from 2026-10-16, the skeptics' review of the banking change):
 * until then the current account opened at nothing, the bank's own fees took it below zero from its first month's end,
 * and sixty days later the overdraft's set-off closed the account creation had said was kept, at 21 of the 54 banks
 * offered. It opens now with what its fees come to until the class graduates in May 2029 (`feesToGraduation`), and an
 * idle life played to June 2029 keeps it, never below zero, at every bank (the census, run on 2026-10-16, kept and
 * moved). Three of them here, one for each kind of fee that took one below zero:
 *
 * - TD Canada Trust's C$17.95 a month: 1,795 × 34 = 61,030, C$611 in whole dollars. On 1 June 2029, thirty-four fees
 *   later, 61,100 - 61,030 = 70 cents left.
 * - Santander México's quiet month, MXN 11.48 in a month with under two transactions and no wages, thirty-four of them,
 *   39,032, MXN 391 in whole pesos; 68 centavos left. Until the fee was posted in pesos it was worked back from the
 *   dollars and drifted to 4¢ below zero while the bank showed 68 centavos.
 * - Resona's ¥1,320 a year on an account unused two years holding under ¥10,000: its current account charges nothing
 *   else, so it opens at nothing, and from August 2028 the fee takes no more than it holds, nothing (a Japanese ordinary
 *   deposit has no overdraft). Until then it took the account to ¥-1,320 and the set-off closed it.
 *
 * And the ledger's rule that an account's two figures agree in sign (`Ledger.nativesOf`), on a posting given its own
 * figure (TEST SETUP: a fee posted directly, as the card's foreign fee is): one that takes the last pence leaves the
 * dollars at nothing too, the difference to the fee's expense.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, loadPlacesFor } from '@/engine';
import { newLifeConfig, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { addCountryHolidays } from '@/engine/content/holidays';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';

for (const country of ['uk', 'ca', 'mx', 'jp']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

const life = (city: string, bank: string): NewSaveConfig => ({
  ...withFamily(newLifeConfig(), 'modest'),
  homeRegionId: city, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase',
  priorResidence: { cityId: city, fromYear: 2008, fromMonth: 9 }, homeBankId: bank,
});
const make = async (config: NewSaveConfig) => { const sim = createSave(1, 'idle', config); await loadPlacesFor(sim.universe); return sim; };
const current = (sim: Simulation, bankId: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.bankId === bankId && a.kind === 'checking')!;
/** Played a day at a time, the lowest it stood at a day's end kept. */
const idle = (sim: Simulation, bankId: string, to: number) => {
  const account = current(sim, bankId);
  let lowest = account.balance;
  while (sim.now < to) { sim.advanceTo(sim.now + 86_400_000); lowest = Math.min(lowest, account.balance, account.held ?? 0); }
  return { account, lowest };
};
const JUNE_2029 = Date.UTC(2029, 5, 1, 16);
const fees = (sim: Simulation, id: string, memo: string) => sim.universe.transactions.filter((t) => t.memo.startsWith(memo) && t.postings.some((p) => p.accountId === id)).length;

describe('an account kept at home in a life that never touches it', () => {
  it('keeps TD Canada Trust’s current account open through graduation on what it opened with', async () => {
    const sim = await make(life('ca-on-toronto', 'ca-td'));
    expect(current(sim, 'ca-td').held).toBe(61_100);
    const { account, lowest } = idle(sim, 'ca-td', JUNE_2029);
    expect(fees(sim, account.id, 'Monthly fee')).toBe(34);
    expect([account.held, account.closedAt, lowest >= 0]).toEqual([70, undefined, true]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('keeps Santander México’s through thirty-four quiet months, each in pesos', async () => {
    const sim = await make(life('mx-cmx-mexicocity', 'mx-santander'));
    expect(current(sim, 'mx-santander').held).toBe(39_100);
    const { account, lowest } = idle(sim, 'mx-santander', JUNE_2029);
    expect(fees(sim, account.id, 'Quiet month fee')).toBe(34);
    expect([account.held, account.closedAt, lowest >= 0, account.balance > 0]).toEqual([68, undefined, true, true]);
  }, 300_000);

  it('takes no more than Resona’s empty current account holds for its dormant fee, and keeps it', async () => {
    const sim = await make(life('jp-13-tokyo', 'jp-resona'));
    expect(current(sim, 'jp-resona').held ?? 0).toBe(0);
    const { account, lowest } = idle(sim, 'jp-resona', Date.UTC(2028, 11, 1, 16));
    expect(fees(sim, account.id, 'Dormant account fee')).toBe(0);
    expect([account.held ?? 0, account.balance, account.closedAt, lowest]).toEqual([0, 0, undefined, 0]);
  }, 300_000);
});

describe('an account’s two figures agree in sign', () => {
  it('leaves the dollars at nothing where a fee takes the last pence, the difference to the fee’s expense', async () => {
    const sim = await make(life('uk-eng-london', 'gb-hsbc'));
    const saver = Object.values(sim.universe.accounts).find((a) => a.bankId === 'gb-hsbc' && a.kind === 'savings')!;
    const fees = sim.nominalAccount('expense', 'Bank Fees');
    const before = fees.balance;
    // TEST SETUP: a fee of all it holds in pounds, posted with a dollar figure 2¢ short of its balance.
    const txn = sim.post({ memo: 'TEST SETUP', category: 'bank_fee', postings: [{ accountId: saver.id, amount: -(saver.balance - 2), native: -saver.held! }, { accountId: fees.id, amount: saver.balance - 2 }] });
    expect([saver.held, saver.balance]).toEqual([0, 0]);
    expect(fees.balance - before).toBe(-txn.postings[0]!.amount);
    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
