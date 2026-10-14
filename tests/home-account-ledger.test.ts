/**
 * An account kept in another currency (module 1 of the home account, 2026-10-16, `core/ledger.ts`): beside its balance
 * in the save's cents it keeps `held`, the bank's own figure, the sum of its postings' `native`.
 *
 * TEST SETUP: no command opens such an account yet (eligibility and creation are module 3), so each one here is opened
 * directly with `sim.openAccount`, at HSBC UK in pounds, in a Yale save kept in dollars.
 *
 * Every expected figure is worked by hand from `content/currency.ts`'s rates, 0.79 pounds to the dollar, each exchange
 * rounded once (`exchange`): £10,000 is 1,000,000p / 0.79 = 1,265,822.78, so 1,265,823¢; £1,000 is 126,582.28, so
 * 126,582¢, and back, 126,582 × 0.79 = 99,999.78, so 100,000p.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { saveCurrency } from '@/engine/core/money';
import { MS_DAY } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { deserialise, serialise } from '@/engine/persistence/adapter';

/** TEST SETUP: a pound account at HSBC UK, opened by hand; nothing in play makes one yet. */
function inPounds(sim: Simulation, extra: Partial<Account> = {}): Account {
  return sim.openAccount({
    id: sim.nextId('account'), kind: 'checking', name: 'HSBC Bank Account', ownerId: sim.player.id,
    institution: 'HSBC UK', bankId: 'gb-hsbc', currency: 'GBP', openedAt: sim.now, ...extra,
  });
}
/** A Yale student's save, kept in dollars. */
const yale = () => quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'comfortable' }, 'home-account-ledger');
const usd = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const outside = (sim: Simulation) => sim.nominalAccount('equity', 'Opening Balances').id;
const move = (sim: Simulation, account: Account, amount: number, native?: number) => sim.post({
  memo: 'test', category: 'transfer',
  postings: [{ accountId: account.id, amount, ...(native === undefined ? {} : { native }) }, { accountId: outside(sim), amount: -amount }],
});
const nativeOf = (sim: Simulation, accountId: string) => sim.universe.transactions.at(-1)!.postings.find((p) => p.accountId === accountId)!.native;

describe('an account in another currency keeps its own exact figure', () => {
  it('fills in what a posting is in pounds when its caller doesn’t say, rounded once', () => {
    const sim = yale();
    expect(saveCurrency(sim.universe)).toBe('USD');
    const gbp = inPounds(sim);
    // $123.45 × 0.79 = 9,752.55p, so 9,753p.
    move(sim, gbp, 12_345);
    expect(nativeOf(sim, gbp.id)).toBe(9_753);
    expect(gbp.held).toBe(9_753);
    expect(gbp.balance).toBe(12_345);
    // The other side, in the save's money, carries none.
    expect(sim.universe.transactions.at(-1)!.postings.find((p) => p.accountId !== gbp.id)!.native).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('takes a caller’s exact figure over the conversion', () => {
    const sim = yale();
    const gbp = inPounds(sim);
    // At SLATE's rate $100 would be 7,900p; a bank's own worse rate gave 7,800p, and that is what it holds.
    move(sim, gbp, 10_000, 7_800);
    expect(gbp.held).toBe(7_800);
    expect(gbp.balance).toBe(10_000);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('empties both figures exactly when what it holds is taken out: £10,000 in, £1,000 out, the rest closed', () => {
    const sim = yale();
    const gbp = inPounds(sim);
    move(sim, gbp, 1_265_823, 1_000_000);
    expect(gbp.held).toBe(1_000_000);
    // £1,000 out, in the save's money; 126,582 × 0.79 = 99,999.78, so 100,000p.
    sim.post({ memo: 'test', category: 'transfer', postings: [{ accountId: gbp.id, amount: -126_582 }, { accountId: usd(sim).id, amount: 126_582 }] });
    expect(gbp.held).toBe(900_000);
    expect(gbp.balance).toBe(1_139_241);
    // The rest. Here the conversion would have come out the same, 1,139,241 × 0.79 = 900,000.39, so 900,000p: a cent is
    // finer than a penny, so pence typed, turned into cents and back come home exact. The design's £8,999.99 for this
    // sequence was wrong (rechecked 2026-10-16); the two cases below are where the figures part.
    sim.post({ memo: 'test', category: 'transfer', postings: [{ accountId: gbp.id, amount: -gbp.balance }, { accountId: usd(sim).id, amount: 1_139_241 }] });
    expect(nativeOf(sim, gbp.id)).toBe(-900_000);
    expect(gbp.held).toBe(0);
    expect(gbp.balance).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('empties both figures when small conversions have drifted: five 1¢ postings hold 5p, and 5¢ is 4p', () => {
    const sim = yale();
    const gbp = inPounds(sim);
    // 1 × 0.79 = 0.79, so 1p each time.
    for (let i = 0; i < 5; i += 1) move(sim, gbp, 1);
    expect(gbp.held).toBe(5);
    expect(gbp.balance).toBe(5);
    // Converted, the 5¢ would be 3.95, so 4p, and 1p would stay at the bank.
    move(sim, gbp, -5);
    expect(nativeOf(sim, gbp.id)).toBe(-5);
    expect(gbp.held).toBe(0);
    expect(gbp.balance).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('empties both figures when the money came in at a bank’s own rate: £10,000 bought for $12,700', () => {
    const sim = yale();
    const gbp = inPounds(sim);
    move(sim, gbp, 1_270_000, 1_000_000);
    // £1,000 out: 126,582 × 0.79 = 99,999.78, so 100,000p.
    move(sim, gbp, -126_582);
    expect(gbp.held).toBe(900_000);
    expect(gbp.balance).toBe(1_143_418);
    // Converted, the rest would be 1,143,418 × 0.79 = 903,300.22, so 903,300p: £33.00 more than the bank holds.
    move(sim, gbp, -1_143_418);
    expect(nativeOf(sim, gbp.id)).toBe(-900_000);
    expect(gbp.held).toBe(0);
    expect(gbp.balance).toBe(0);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('refuses a figure in another currency on an account kept in the save’s, and leaves nothing moved', () => {
    const sim = yale();
    const was = usd(sim).balance;
    expect(() => sim.post({ memo: 'test', category: 'transfer', postings: [{ accountId: usd(sim).id, amount: 500, native: 395 }, { accountId: outside(sim), amount: -500 }] }))
      .toThrow(/kept in the save’s/);
    expect(usd(sim).balance).toBe(was);
  });

  it('is caught by the audit and the save’s laws when its figure is tampered with, or a dollar posting carries one', () => {
    const sim = yale();
    const gbp = inPounds(sim);
    move(sim, gbp, 12_345);
    gbp.held = (gbp.held ?? 0) + 1;
    expect(sim.ledger.audit().some((p) => /holds 9754 GBP != posted total 9753/.test(p))).toBe(true);
    expect(breaches(sim.universe).map((b) => b.law)).toContain('held not the sum of its postings');
    gbp.held = 9_753;
    expect(breaches(sim.universe)).toEqual([]);

    const dollars = sim.universe.transactions.find((t) => t.postings.some((p) => p.accountId === usd(sim).id))!;
    dollars.postings.find((p) => p.accountId === usd(sim).id)!.native = 1;
    expect(sim.ledger.audit().some((p) => /a figure in another currency, and it’s kept in the save’s/.test(p))).toBe(true);
    expect(breaches(sim.universe).map((b) => b.law)).toContain('figure in another currency on an account kept in the save’s');
  });

  it('keeps its figure and its postings’ through a save and a load', () => {
    const sim = yale();
    const gbp = inPounds(sim);
    move(sim, gbp, 1_265_823, 1_000_000);
    move(sim, gbp, -126_582);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    const back = again.universe.accounts[gbp.id]!;
    expect(back.currency).toBe('GBP');
    expect(back.held).toBe(900_000);
    expect(again.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === gbp.id)).map((t) => t.postings.find((p) => p.accountId === gbp.id)!.native))
      .toEqual([1_000_000, -100_000]);
    expect(again.ledger.audit()).toEqual([]);
    expect(breaches(again.universe)).toEqual([]);
    // And posts on after the load as before it.
    again.post({ memo: 'test', category: 'transfer', postings: [{ accountId: gbp.id, amount: -back.balance }, { accountId: again.universe.accounts[again.player.primaryAccountId!]!.id, amount: back.balance }] });
    expect(back.held).toBe(0);
  });
});

describe('an account brought into the save', () => {
  it('counts as used when it was last used before the save, not when it opened', () => {
    const sim = yale();
    // Opened five years before the save, nothing posted since: HSBC UK calls an account inactive at 24 months untouched.
    const opened = sim.now - 5 * 365 * MS_DAY;
    const kept = inPounds(sim, { openedAt: opened, lastUsedBefore: sim.now });
    const bare = inPounds(sim, { openedAt: opened, name: 'HSBC Savings' });
    sim.advanceTo(sim.now + 40 * MS_DAY);
    expect(bare.inactive).toBe(true);
    expect(kept.inactive).toBe(false);
  });
});
