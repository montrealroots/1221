/**
 * Owning land (`systems/land.ts`, docs/WORLD.md stage 4, from 2026-09-29):
 * each place's price and transfer taxes to the cent, buying, a year's holding
 * tax, a sale closing after the days land takes to sell, and splitting and
 * combining where the zoning allows.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { DAYS_TO_SELL, LAND_MARKETS } from '@/engine/content/land';
import { buyLandRefusal, landQuote, landValue, marketsFor, parcelsOf, saleProceeds, splitRefusal, taxedValue } from '@/engine/systems/land';

const idx = (label: RegExp) => LAND_MARKETS.findIndex((m) => label.test(m.label));
/** The first day of a figure's year, when its value is the figure itself. */
const y = (year: number) => Date.UTC(year, 0, 1);
const line = (q: { lines: { label: string; amount: number }[] }, re: RegExp) => q.lines.find((l) => re.test(l.label))!.amount;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** A current account with enough in it to buy a parcel. */
const fund = (sim: Simulation, cents: number) => { sim.universe.accounts[sim.player.primaryAccountId!]!.balance += cents; };

describe('what land costs', () => {
  it('prices a Brooklyn lot at the FHFA’s value an acre on R2’s 2,850 sq ft, the seller paying the state’s 0.4% and the city’s 2.625% on the whole above $500,000', () => {
    const i = idx(/Brooklyn/);
    const q = landQuote(i, 2_850 / 43_560, y(2022));
    expect(q.price).toBe(Math.round(15_217_700 * (2_850 / 43_560) * 100));
    expect(q.price).toBe(99_564_842);
    // The buyer pays nothing on top in New York.
    expect(q.lines).toEqual([]);
    expect(q.total).toBe(q.price);
    const sale = saleProceeds(LAND_MARKETS[i]!, q.price);
    expect(sale.taxes.map((t) => t.amount)).toEqual([Math.round(q.price * 0.004), Math.round(q.price * 0.02625)]);
    // Under $500,000 it's 1.425% on the whole.
    expect(saleProceeds(LAND_MARKETS[i]!, 400_000_00).taxes[1]!.amount).toBe(5_700_00);
  });

  it('puts the buyer’s tax on the quote where the buyer pays: England’s SDLT in bands, Ireland’s 7.5%, Ontario’s land transfer tax, British Columbia’s', () => {
    const england = landQuote(idx(/Farmland In England/), 50, y(2026));
    expect(england.price).toBe(424_850_00);
    // Nothing to £150,000, 2% to £250,000, 5% above.
    expect(line(england, /Stamp Duty Land Tax/)).toBe(2_000_00 + 8_742_50);
    expect(line(landQuote(idx(/Farmland In England/), 10, y(2026)), /Stamp Duty Land Tax/)).toBe(0);
    const leinster = landQuote(idx(/Leinster/), 10, y(2025));
    expect(line(leinster, /Stamp Duty/)).toBe(12_452_25);
    const ontario = landQuote(idx(/Central East Ontario/), 100, y(2025));
    expect(ontario.price).toBe(1_310_000_00);
    expect(line(ontario, /Ontario Land Transfer/)).toBe(275_00 + 1_950_00 + 2_250_00 + 18_200_00);
    const bc = landQuote(idx(/South Coast/), 5, y(2025));
    expect(line(bc, /Property Transfer/)).toBe(2_000_00 + 6_460_00);
    expect(bc.total).toBe(523_000_00 + 8_460_00);
  });

  it('moves a value by its source’s yearly change, and holds one the source publishes none for', () => {
    const upstate = LAND_MARKETS[idx(/Upstate/)]!;
    expect(landValue(upstate, 10, y(2026))).toBe(45_000_00);
    expect(landValue(upstate, 10, y(2026) + 365.2425 * MS_DAY)).toBe(Math.round(45_000_00 * 1.047));
    const brooklyn = LAND_MARKETS[idx(/Brooklyn/)]!;
    expect(landValue(brooklyn, 0.1, y(2030))).toBe(landValue(brooklyn, 0.1, y(2022)));
  });

  it('sells land only where one lives, and only in the sizes offered', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'land-where');
    expect(marketsFor('us-ny-newyork').map(({ m }) => m.label)).toEqual(['A Lot In Brooklyn', 'A Lot In Queens', 'A Lot On Staten Island', 'Farmland Upstate']);
    expect(buyLandRefusal(sim.player, idx(/Leinster/), 10)).toMatch(/where you live/);
    expect(buyLandRefusal(sim.player, idx(/Upstate/), 11)).toMatch(/size/);
    expect(buyLandRefusal(sim.player, idx(/Upstate/), 10)).toBeUndefined();
    expect(marketsFor('mx-cmx-mexicocity')).toEqual([]);
  });
});

describe('owning it', () => {
  it('buys a Queens lot, pays a year’s tax at the city’s Class 1 rate on its 6% ratio, and sells it 125 days after it’s listed, the seller’s taxes taken', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'land-ny');
    const i = idx(/Queens/);
    const acres = 2_850 / 43_560;
    const q = landQuote(i, acres, sim.now);
    fund(sim, inSave(sim, q.total, 'USD'));
    const r = sim.execute<{ parcelId: string; paid: number }>({ kind: 'land.buy', payload: { market: i, acres } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, q.total, 'USD'));
    const p = parcelsOf(sim.player)[0]!;
    expect(p.paid).toBe(q.price);

    sim.advanceBy(366 * MS_DAY);
    const tax = sim.universe.transactions.find((t) => t.memo === 'Property tax, A Lot In Queens')!;
    expect(tax).toBeDefined();
    expect(tax.postings.find((x) => x.amount > 0)!.amount).toBe(inSave(sim, Math.round(q.price * 0.19843 * 0.06), 'USD'));

    const s = sim.execute<{ closesAt: number }>({ kind: 'land.sell', payload: { parcelId: p.id } });
    expect(s.ok, s.error).toBe(true);
    expect(s.value!.closesAt).toBe(sim.now + DAYS_TO_SELL * MS_DAY);
    expect(sim.execute({ kind: 'land.sell', payload: { parcelId: p.id } }).ok).toBe(false);
    sim.advanceBy((DAYS_TO_SELL + 1) * MS_DAY);
    const sold = sim.universe.transactions.find((t) => t.memo.startsWith('Sold: A Lot In Queens'))!;
    const net = saleProceeds(LAND_MARKETS[i]!, q.price).net;
    expect(sold.postings.find((x) => x.amount > 0)!.amount).toBe(inSave(sim, net, 'USD'));
    expect(p.soldAt).toBeDefined();
    // Sold, it's taxed no more.
    const taxes = sim.universe.transactions.filter((t) => t.memo === 'Property tax, A Lot In Queens').length;
    sim.advanceBy(366 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Property tax, A Lot In Queens').length).toBe(taxes);
  });

  it('taxes a Los Angeles lot on its price paid, never on more than it’s worth', () => {
    const i = idx(/Los Angeles/);
    const at = Date.UTC(2026, 8, 29);
    const p = { id: 'x', market: i, acres: 5_000 / 43_560, boughtAt: at, paid: 400_000_00 };
    expect(taxedValue(p, at + 400 * MS_DAY)).toBe(Math.round(400_000_00 * 1.02));
    expect(taxedValue({ ...p, paid: 900_000_000_00 }, at)).toBe(landValue(LAND_MARKETS[i]!, p.acres, at));
    // Elsewhere the tax is on the value.
    const q = { ...p, market: idx(/Queens/), acres: 2_850 / 43_560 };
    expect(taxedValue(q, at)).toBe(landValue(LAND_MARKETS[q.market]!, q.acres, at));
  });

  it('refuses buying what the bank can’t pay', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'modest' }, 'land-poor');
    const r = sim.execute({ kind: 'land.buy', payload: { market: idx(/Brooklyn/), acres: 2_850 / 43_560 } });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/more than the bank/);
    expect(parcelsOf(sim.player)).toEqual([]);
  });

  it('splits a New Haven quarter acre while each half keeps RS-2’s 4,000 sq ft, and combines the halves again', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, 'land-ct');
    const i = idx(/New Haven/);
    fund(sim, inSave(sim, landQuote(i, 0.25, sim.now).total, 'USD'));
    expect(sim.execute({ kind: 'land.buy', payload: { market: i, acres: 0.25 } }).ok).toBe(true);
    const whole = parcelsOf(sim.player)[0]!;
    const paid = whole.paid;
    const split = sim.execute<{ parts: string[] }>({ kind: 'land.split', payload: { parcelId: whole.id } });
    expect(split.ok, split.error).toBe(true);
    const [a, b] = split.value!.parts.map((id) => parcelsOf(sim.player).find((p) => p.id === id)!);
    expect(a!.acres).toBe(0.125);
    expect(b!.acres).toBe(0.125);
    expect(a!.paid + b!.paid).toBe(paid);
    // An eighth of an acre is 5,445 sq ft; halved again it's under the minimum.
    expect(splitRefusal(a!)).toMatch(/RS-2 minimum, 4,000 sq ft/);
    const c = sim.execute({ kind: 'land.combine', payload: { a: a!.id, b: b!.id } });
    expect(c.ok, c.error).toBe(true);
    expect(parcelsOf(sim.player).filter((p) => p.soldAt === undefined).map((p) => p.acres)).toEqual([0.25]);
    expect(sim.execute({ kind: 'land.combine', payload: { a: a!.id, b: a!.id } }).error).toMatch(/Two parcels you own/);
    // One parcel, one tax bill: the half combined away is taxed no more.
    fund(sim, 1_000_000_00);
    sim.advanceBy(366 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Property tax, A Lot In New Haven')).toHaveLength(1);
  });

  it('refuses splitting a lot already at its minimum, a London plot, or acreage under two acres', () => {
    const base = { id: 'x', boughtAt: 0, paid: 1 };
    expect(splitRefusal({ ...base, market: idx(/Brooklyn/), acres: 2_850 / 43_560 })).toMatch(/R2 minimum/);
    expect(splitRefusal({ ...base, market: idx(/Hackney/), acres: 200 / 4_046.8564224 })).toMatch(/planning permission/);
    expect(splitRefusal({ ...base, market: idx(/Upstate/), acres: 1.5 })).toMatch(/acre SLATE keeps/);
    expect(splitRefusal({ ...base, market: idx(/Upstate/), acres: 10 })).toBeUndefined();
  });
});
