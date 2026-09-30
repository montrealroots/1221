/**
 * A loan on land (`systems/landloan.ts`, from 2026-09-30): Farm Credit's terms
 * on America's farmland, the lender's 65% at the closing, the monthly
 * payment, the debt in net worth, and a sale paying it off first.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { LAND_DEAL, LAND_MARKETS } from '@/engine/content/land';
import { landQuote, listingsFor, offerRefusal, parcelsOf } from '@/engine/systems/land';
import { homeOf } from '@/engine/systems/earnings';
import { LAND_LOAN, financeable } from '@/engine/systems/landloan';
import { netWorth } from '@/engine/systems/finance';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);

describe('a land loan', () => {
  it('is kept on America’s farmland only', () => {
    expect(financeable(LAND_MARKETS.findIndex((m) => m.place === 'ny-state'))).toBe(true);
    expect(financeable(LAND_MARKETS.findIndex((m) => m.place === 'nyc'))).toBe(false);
    expect(financeable(LAND_MARKETS.findIndex((m) => m.place === 'england'))).toBe(false);
    const sim = save('uk-eng-london', 'landloan-gb');
    const l = listingsFor(sim, sim.player, homeOf(sim.player)).find((x) => LAND_MARKETS[x.market]!.kind === 'acreage')!;
    expect(sim.execute({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking, financed: true } }).error).toMatch(/America’s farmland/);
  });

  it('lends 65% at the closing, is paid monthly, counts among the debts, and is paid off from a sale', () => {
    const sim = save('us-ny-newyork', 'landloan-ny');
    const l = listingsFor(sim, sim.player, homeOf(sim.player)).find((x) => financeable(x.market))!;
    // A buyer who can show only what the loan doesn't lend, and the closing's costs.
    const total = inSave(sim, landQuote(l.market, l.acres, sim.now, l.asking).total, 'USD');
    const own = total - Math.round(inSave(sim, l.asking, 'USD') * (1 - LAND_LOAN.down));
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = own + 1_000_00;
    expect(offerRefusal(sim, sim.player, l.id, l.asking, false)).toMatch(/the price/);
    expect(offerRefusal(sim, sim.player, l.id, l.asking, true)).toBeUndefined();
    // A month and a half of rent and bills before the closing.
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 50_000_00;
    const r = sim.execute<{ answer: string }>({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking, financed: true } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.answer).toBe('accepted');
    sim.advanceBy((LAND_DEAL.closingDays + 1) * MS_DAY);
    const parcel = parcelsOf(sim.player).find((p) => p.listingId === l.id)!;
    const lent = Math.round(inSave(sim, l.asking, 'USD') * (1 - LAND_LOAN.down));
    expect(parcel.loan!.owed).toBe(lent);
    const worth = netWorth(sim, sim.player.id);
    expect(worth.liabilities).toBeGreaterThanOrEqual(lent);
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Land loan payment'))).toBe(true);
    expect(parcel.loan!.owed).toBeLessThan(lent);
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Land loan payment'))).toHaveLength(2);
    // Sold, the loan goes first.
    expect(sim.execute({ kind: 'land.sell', payload: { parcelId: parcel.id } }).ok).toBe(true);
    sim.advanceBy(200 * MS_DAY);
    expect(parcel.soldAt).toBeDefined();
    expect(parcel.loan).toBeUndefined();
    const sale = sim.universe.transactions.find((t) => t.memo.startsWith('Sold: '))!;
    expect(sale.postings.find((p) => p.accountId === sim.nominalAccount('liability_other', 'Land Loans').id)!.amount).toBeGreaterThan(0);
  });
});
