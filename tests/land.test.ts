/**
 * Owning land (`systems/land.ts`, docs/WORLD.md stage 4, from 2026-09-29):
 * each place's price and transfer taxes to the cent; listings, offers and a
 * seller's answers; the deposit as each place takes it, walking away, and
 * the closing; a year's holding tax, a sale after the days land takes to
 * sell, and splitting and combining where the zoning allows.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { DAYS_TO_SELL, LAND_DEAL, LAND_MARKETS } from '@/engine/content/land';
import { homeOf } from '@/engine/systems/earnings';
import { landAnswer, landBuyingOf, landFloor, landQuote, landValue, listingsFor, marketsFor, offerRefusal, parcelsOf, saleProceeds, splitRefusal, taxedValue, type Listing } from '@/engine/systems/land';

const idx = (label: RegExp) => LAND_MARKETS.findIndex((m) => label.test(m.label));
/** The first day of a figure's year, when its value is the figure itself. */
const y = (year: number) => Date.UTC(year, 0, 1);
const line = (q: { lines: { label: string; amount: number }[] }, re: RegExp) => q.lines.find((l) => re.test(l.label))!.amount;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** A current account with enough in it to buy a parcel. */
const fund = (sim: Simulation, cents: number) => { sim.universe.accounts[sim.player.primaryAccountId!]!.balance += cents; };
const save = (city: string, name: string, wealth: 'wealthy' | 'modest' = 'wealthy') => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth }, name);
const listed = (sim: Simulation) => listingsFor(sim, sim.player, homeOf(sim.player));
const memoed = (sim: Simulation, memo: string | RegExp) => sim.universe.transactions.filter((t) => (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
const debit = (t: { postings: { amount: number }[] }) => t.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0);

/** An offer at the asking price, the bank funded for it, and the closing waited out. */
function buy(sim: Simulation, pick: (l: Listing) => boolean) {
  const l = listed(sim).find(pick)!;
  fund(sim, inSave(sim, landQuote(l.market, l.acres, sim.now, l.asking).total, LAND_MARKETS[l.market]!.currency));
  const r = sim.execute<{ answer: string }>({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking } });
  expect(r.ok, r.error).toBe(true);
  expect(r.value!.answer).toBe('accepted');
  sim.advanceBy((LAND_DEAL.closingDays + 1) * MS_DAY);
  return { l, parcel: parcelsOf(sim.player).find((p) => p.listingId === l.id)! };
}

describe('what land costs', () => {
  it('prices a Brooklyn lot at the FHFA’s value an acre on R2’s 2,850 sq ft, the seller paying the state’s tax and the city’s on the whole', () => {
    const i = idx(/Brooklyn/);
    const q = landQuote(i, 2_850 / 43_560, y(2022));
    expect(q.price).toBe(Math.round(15_217_700 * (2_850 / 43_560) * 100));
    expect(q.price).toBe(99_564_842);
    // The buyer pays nothing on top in New York.
    expect(q.lines).toEqual([]);
    expect(q.total).toBe(q.price);
    const sale = saleProceeds(LAND_MARKETS[i]!, q.price);
    expect(sale.taxes.map((t) => t.amount)).toEqual([Math.round(q.price * 0.004), Math.round(q.price * 0.02625)]);
    // Under $500,000 the city's is 1.425% on the whole; from $2 million the state's is 0.65% on the whole.
    expect(saleProceeds(LAND_MARKETS[i]!, 400_000_00).taxes[1]!.amount).toBe(5_700_00);
    expect(saleProceeds(LAND_MARKETS[i]!, 2_500_000_00).taxes[0]!.amount).toBe(16_250_00);
    expect(saleProceeds(LAND_MARKETS[i]!, 1_999_999_00).taxes[0]!.amount).toBe(8_000_00);
  });

  it('puts the buyer’s costs on the quote: England’s SDLT in bands, its searches and the Land Registry’s fee; Ireland’s 7.5%; Ontario’s and British Columbia’s transfer taxes', () => {
    const england = landQuote(idx(/Farmland In England/), 50, y(2026));
    expect(england.price).toBe(424_850_00);
    // Nothing to £150,000, 2% to £250,000, 5% above.
    expect(line(england, /Stamp Duty Land Tax/)).toBe(2_000_00 + 8_742_50);
    expect(line(england, /Register/)).toBe(7_00);
    expect(line(england, /Title Plan/)).toBe(3_00);
    expect(line(england, /Official Search/)).toBe(3_00);
    // Scale 1, £200,001 to £500,000: £150.
    expect(line(england, /Land Registry/)).toBe(150_00);
    expect(england.total).toBe(424_850_00 + 10_742_50 + 13_00 + 150_00);
    expect(line(landQuote(idx(/Farmland In England/), 10, y(2026)), /Stamp Duty Land Tax/)).toBe(0);
    expect(line(landQuote(idx(/Farmland In England/), 10, y(2026)), /Land Registry/)).toBe(40_00);
    const leinster = landQuote(idx(/Leinster/), 10, y(2025));
    expect(line(leinster, /Stamp Duty/)).toBe(12_452_25);
    const ontario = landQuote(idx(/Central East Ontario/), 100, y(2025));
    expect(ontario.price).toBe(1_310_000_00);
    expect(line(ontario, /Ontario Land Transfer/)).toBe(275_00 + 1_950_00 + 2_250_00 + 18_200_00);
    const bc = landQuote(idx(/South Coast/), 5, y(2025));
    expect(line(bc, /Property Transfer/)).toBe(2_000_00 + 6_460_00);
    expect(bc.total).toBe(523_000_00 + 8_460_00);
    // Upstate, the percolation test's application.
    expect(line(landQuote(idx(/Upstate/), 10, y(2026)), /Percolation/)).toBe(100_00);
    // A price named is what's taxed.
    expect(line(landQuote(idx(/Leinster/), 10, y(2025), 100_000_00), /Stamp Duty/)).toBe(7_500_00);
  });

  it('moves a value by its source’s yearly change, and holds one the source publishes none for', () => {
    const upstate = LAND_MARKETS[idx(/Upstate/)]!;
    expect(landValue(upstate, 10, y(2026))).toBe(45_000_00);
    expect(landValue(upstate, 10, y(2026) + 365.2425 * MS_DAY)).toBe(Math.round(45_000_00 * 1.047));
    const brooklyn = LAND_MARKETS[idx(/Brooklyn/)]!;
    expect(landValue(brooklyn, 0.1, y(2030))).toBe(landValue(brooklyn, 0.1, y(2022)));
  });
});

describe('what’s listed, and a seller’s answer', () => {
  it('lists a few of each market’s sizes a month where one lives, asking from 5% under the value to 15% over, the same all month and new the next', () => {
    const sim = save('us-ny-newyork', 'land-list');
    expect(marketsFor('us-ny-newyork').map(({ m }) => m.label)).toEqual(['A Lot In Brooklyn', 'A Lot In Queens', 'A Lot On Staten Island', 'Farmland Upstate']);
    const now = listed(sim);
    expect(now).toHaveLength(4 * LAND_DEAL.listingsAMonth);
    for (const l of now) {
      const m = LAND_MARKETS[l.market]!;
      expect(m.sizes).toContain(l.acres);
      const d = new Date(sim.now);
      const value = landValue(m, l.acres, Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      expect(l.asking).toBeGreaterThanOrEqual(Math.floor(value * 0.95 / 100_00) * 100_00);
      expect(l.asking).toBeLessThanOrEqual(Math.ceil(value * 1.15 / 100_00) * 100_00);
      expect(l.listedAt).toBeLessThanOrEqual(sim.now);
    }
    expect(listingsFor(sim, sim.player, 'us-ny-newyork', sim.now + 60_000)).toEqual(now);
    const next = listingsFor(sim, sim.player, 'us-ny-newyork', sim.now + 40 * MS_DAY);
    expect(next.map((l) => l.asking)).not.toEqual(now.map((l) => l.asking));
    expect(listingsFor(sim, sim.player, 'mx-cmx-mexicocity')).toEqual([]);
  });

  it('accepts the asking price, counters a little under the least a seller takes, turns down less, and takes less the longer land has sat', () => {
    const sim = save('us-ny-newyork', 'land-answer');
    const fresh: Listing = { id: 'x', market: 0, acres: 0.1, asking: 1_000_000_00, listedAt: sim.now };
    expect(landAnswer(sim, sim.player, fresh, 1_000_000_00, 0)).toEqual({ answer: 'accepted' });
    expect(landAnswer(sim, sim.player, fresh, 870_000_00, 0)).toEqual({ answer: 'countered', price: 935_000_00 });
    expect(landAnswer(sim, sim.player, fresh, 840_000_00, 0)).toEqual({ answer: 'rejected' });
    expect(landFloor(fresh, sim.now)).toBe(0.9);
    expect(landFloor(fresh, sim.now + 365.2425 / 4 * MS_DAY)).toBeCloseTo(0.86, 10);
    expect(landFloor(fresh, sim.now + 2 * 365.2425 * MS_DAY)).toBeCloseTo(0.82, 10);
  });

  it('refuses an offer on land not listed where one lives, with no price, or without the money in the bank', () => {
    const sim = save('us-ny-newyork', 'land-refuse', 'modest');
    const brooklyn = listed(sim).find((l) => LAND_MARKETS[l.market]!.label === 'A Lot In Brooklyn')!;
    expect(offerRefusal(sim, sim.player, brooklyn.id, brooklyn.asking)).toMatch(/seller asks to see/);
    expect(offerRefusal(sim, sim.player, brooklyn.id, 0)).toMatch(/names a price/);
    expect(offerRefusal(sim, sim.player, `${idx(/Leinster/)}.2026-09.0`, 1_000_00)).toMatch(/isn’t listed/);
    const r = sim.execute({ kind: 'land.offer', payload: { listingId: brooklyn.id, price: brooklyn.asking } });
    expect(r.ok).toBe(false);
    expect(parcelsOf(sim.player)).toEqual([]);
  });
});

describe('the deal', () => {
  it('holds America’s 1% earnest money from acceptance, gives it back to a buyer who walks away in time, and keeps it after', () => {
    const sim = save('us-ny-newyork', 'land-walk');
    const l = listed(sim).find((x) => LAND_MARKETS[x.market]!.label === 'A Lot In Queens')!;
    fund(sim, inSave(sim, 2 * l.asking, 'USD'));
    const deposit = inSave(sim, Math.round(l.asking * 0.01), 'USD');
    expect(sim.execute({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking } }).ok).toBe(true);
    const deal = landBuyingOf(sim.player).deal!;
    expect(deal.deposit).toBe(Math.round(l.asking * 0.01));
    expect(sim.universe.accounts[deal.escrowAccountId!]!.balance).toBe(deposit);
    // Taken, it's no longer listed, and a second offer waits for this one.
    expect(listed(sim).some((x) => x.id === l.id)).toBe(false);
    const other = listed(sim)[0]!;
    expect(offerRefusal(sim, sim.player, other.id, other.asking)).toMatch(/accepted already/);
    sim.advanceBy(10 * MS_DAY);
    const w = sim.execute<{ depositBack: boolean }>({ kind: 'land.withdraw', payload: {} });
    expect(w.value!.depositBack).toBe(true);
    expect(debit(memoed(sim, 'Land deposit back')[0]!)).toBe(deposit);
    expect(landBuyingOf(sim.player).deal).toBeUndefined();

    const again = listed(sim).find((x) => LAND_MARKETS[x.market]!.label === 'A Lot In Queens')!;
    expect(sim.execute({ kind: 'land.offer', payload: { listingId: again.id, price: again.asking } }).ok).toBe(true);
    sim.advanceBy((LAND_DEAL.diligenceDays + 1) * MS_DAY);
    const late = sim.execute<{ depositBack: boolean }>({ kind: 'land.withdraw', payload: {} });
    expect(late.value!.depositBack).toBe(false);
    expect(debit(memoed(sim, 'Land deposit kept by the seller')[0]!)).toBe(inSave(sim, Math.round(again.asking * 0.01), 'USD'));
    // Walked away, nothing closes.
    sim.advanceBy(LAND_DEAL.closingDays * MS_DAY);
    expect(parcelsOf(sim.player)).toEqual([]);
  });

  it('closes on the forty-fifth day, the rest paid, and taxes a Queens lot a year at the Class 1 rate; sold, it closes 125 days after it’s listed, the seller’s taxes taken', () => {
    const sim = save('us-ny-newyork', 'land-ny');
    const { l, parcel: p } = buy(sim, (x) => LAND_MARKETS[x.market]!.label === 'A Lot In Queens');
    expect(p).toBeDefined();
    expect(p.paid).toBe(l.asking);
    const bought = memoed(sim, /^A Lot In Queens, .* bought/)[0]!;
    // The whole price is the expense: the earnest money from escrow and the rest from the bank.
    expect(debit(bought)).toBe(inSave(sim, l.asking, 'USD'));

    sim.advanceBy(366 * MS_DAY);
    const tax = memoed(sim, 'Property tax, A Lot In Queens')[0]!;
    expect(debit(tax)).toBe(inSave(sim, Math.round(landValue(LAND_MARKETS[l.market]!, l.acres, sim.now) * 0.19843 * 0.06), 'USD'));

    const s = sim.execute<{ closesAt: number }>({ kind: 'land.sell', payload: { parcelId: p.id } });
    expect(s.ok, s.error).toBe(true);
    expect(s.value!.closesAt).toBe(sim.now + DAYS_TO_SELL * MS_DAY);
    expect(sim.execute({ kind: 'land.sell', payload: { parcelId: p.id } }).ok).toBe(false);
    const value = landValue(LAND_MARKETS[l.market]!, l.acres, sim.now);
    sim.advanceBy((DAYS_TO_SELL + 1) * MS_DAY);
    const sold = memoed(sim, /^Sold: A Lot In Queens/)[0]!;
    expect(debit(sold)).toBe(inSave(sim, saleProceeds(LAND_MARKETS[l.market]!, value).net, 'USD'));
    expect(p.soldAt).toBeDefined();
    // Sold, it's taxed no more.
    const taxes = memoed(sim, 'Property tax, A Lot In Queens').length;
    sim.advanceBy(366 * MS_DAY);
    expect(memoed(sim, 'Property tax, A Lot In Queens')).toHaveLength(taxes);
  });

  it('takes England’s 10% only on exchange, the searches on acceptance, and the SDLT and Land Registry fee at completion', () => {
    const sim = save('uk-eng-london', 'land-gb');
    const l = listed(sim).find((x) => LAND_MARKETS[x.market]!.label === 'Farmland In England')!;
    const q = landQuote(l.market, l.acres, sim.now, l.asking);
    fund(sim, inSave(sim, q.total, 'GBP'));
    expect(sim.execute({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking } }).ok).toBe(true);
    // Subject to contract: nothing held yet.
    expect(landBuyingOf(sim.player).deal!.escrowAccountId).toBeUndefined();
    expect(debit(memoed(sim, 'Searches on Farmland In England')[0]!)).toBe(inSave(sim, 13_00, 'GBP'));
    sim.advanceBy((LAND_DEAL.diligenceDays + 1) * MS_DAY);
    const deal = landBuyingOf(sim.player).deal!;
    expect(sim.universe.accounts[deal.escrowAccountId!]!.balance).toBe(inSave(sim, Math.round(l.asking * 0.1), 'GBP'));
    sim.advanceBy(LAND_DEAL.closingDays * MS_DAY);
    expect(parcelsOf(sim.player)[0]!.listingId).toBe(l.id);
    const bought = memoed(sim, /^Farmland In England, .* bought/)[0]!;
    // The expense is everything but the searches, paid when they were ordered.
    expect(bought.postings.find((x) => x.amount > 0)!.amount).toBe(inSave(sim, q.total - 13_00, 'GBP'));
  });

  it('keeps the deposit and ends the deal when the bank can’t pay the rest at the closing', () => {
    const sim = save('us-ny-newyork', 'land-short');
    const l = listed(sim).find((x) => LAND_MARKETS[x.market]!.label === 'A Lot In Brooklyn')!;
    fund(sim, inSave(sim, l.asking, 'USD'));
    expect(sim.execute({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking } }).ok).toBe(true);
    const escrow = landBuyingOf(sim.player).deal!.escrowAccountId!;
    sim.advanceBy(LAND_DEAL.diligenceDays * MS_DAY + MS_DAY);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = 0;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') a.balance = 0;
    sim.advanceBy(LAND_DEAL.closingDays * MS_DAY);
    expect(parcelsOf(sim.player)).toEqual([]);
    expect(landBuyingOf(sim.player).deal).toBeUndefined();
    expect(sim.universe.accounts[escrow]!.balance).toBe(0);
    expect(memoed(sim, 'Land deposit kept by the seller')).toHaveLength(1);
  });

  it('accepts the counter’s price while it stands', () => {
    const sim = save('us-ny-newyork', 'land-counter');
    const l = listed(sim).find((x) => LAND_MARKETS[x.market]!.label === 'A Lot In Queens')!;
    fund(sim, inSave(sim, 2 * l.asking, 'USD'));
    const floor = landFloor(l, sim.now);
    const low = Math.round(l.asking * (floor - 0.02) / 100_00) * 100_00;
    const r = sim.execute<{ answer: string; price: number }>({ kind: 'land.offer', payload: { listingId: l.id, price: low } });
    expect(r.value!.answer).toBe('countered');
    expect(landBuyingOf(sim.player).counter!.price).toBe(r.value!.price);
    const yes = sim.execute<{ answer: string }>({ kind: 'land.offer', payload: { listingId: l.id, price: r.value!.price } });
    expect(yes.value!.answer).toBe('accepted');
    expect(landBuyingOf(sim.player).deal!.price).toBe(r.value!.price);
    // Taken, the counter is spent.
    expect(landBuyingOf(sim.player).counter).toBeUndefined();
  });
});

describe('owning it', () => {
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

  it('splits a New Haven quarter acre while each half keeps RS-2’s 4,000 sq ft, and combines the halves again', () => {
    const sim = save('us-ct-newhaven', 'land-ct');
    for (let n = 0; n < 12 && !listed(sim).some((l) => l.acres === 0.25); n++) sim.advanceBy(31 * MS_DAY);
    const { parcel: whole } = buy(sim, (l) => l.acres === 0.25);
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
    const before = memoed(sim, 'Property tax, A Lot In New Haven').length;
    sim.advanceBy(366 * MS_DAY);
    expect(memoed(sim, 'Property tax, A Lot In New Haven')).toHaveLength(before + 1);
  });

  it('refuses splitting a lot already at its minimum, a London plot, or acreage under two acres', () => {
    const base = { id: 'x', boughtAt: 0, paid: 1 };
    expect(splitRefusal({ ...base, market: idx(/Brooklyn/), acres: 2_850 / 43_560 })).toMatch(/R2 minimum/);
    expect(splitRefusal({ ...base, market: idx(/Hackney/), acres: 200 / 4_046.8564224 })).toMatch(/planning permission/);
    expect(splitRefusal({ ...base, market: idx(/Upstate/), acres: 1.5 })).toMatch(/acre SLATE keeps/);
    expect(splitRefusal({ ...base, market: idx(/Upstate/), acres: 10 })).toBeUndefined();
  });
});
