/**
 * Farmland let to a farmer (`systems/landlease.ts`, from 2026-09-30): each
 * place's published cash rent or rent-to-value ratio, paid a year ahead,
 * taxed as each country taxes rent, and the land the farmer's while let.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { LAND_MARKETS } from '@/engine/content/land';
import { landValue, type Parcel } from '@/engine/systems/land';
import { leaseRefusal, yearRent } from '@/engine/systems/landlease';
import { trailFor } from '@/engine/systems/outings';
import { yearOf } from '@/engine/systems/earnings';
import { zonedParts } from '@/engine/core/time';

const at = Date.UTC(2026, 9, 1);
const market = (place: string) => LAND_MARKETS.findIndex((m) => m.place === place && m.kind === 'acreage');
const lot = LAND_MARKETS.findIndex((m) => m.kind === 'lot');
const parcel = (place: string, acres: number, id = 'farm'): Parcel => ({ id, market: market(place), acres, boughtAt: at, paid: 0 });
const life = (city: string, seed: string, land: Parcel[]) => { const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed); sim.player.land = land; return sim; };
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const rentPaid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('A year’s farm rent'));
const taxOn = (sim: Simulation) => sim.universe.transactions.flatMap((t) => t.postings).filter((p) => p.accountId === sim.nominalAccount('expense', 'Tax On Farm Rent').id).reduce((a, p) => a + p.amount, 0);

describe('the rent', () => {
  it('is New York’s $83.50 an acre, England’s £230 a hectare, and Ontario’s 2.35% of the value; a lot isn’t let', () => {
    expect(yearRent(parcel('ny-state', 10), at)).toBe(835_00);
    expect(yearRent(parcel('england', 40), at)).toBe(Math.round((230 / 2.4710538) * 40 * 100));
    const on = parcel('ontario', 40);
    expect(yearRent(on, at)).toBe(Math.round(landValue(LAND_MARKETS[on.market]!, 40, at) * 0.0235));
    expect(yearRent({ ...parcel('ny-state', 1), market: lot }, at)).toBeUndefined();
  });
});

describe('a lease', () => {
  it('pays a year ahead and each year after, until it’s ended at a year’s end', () => {
    const sim = life('us-ny-newyork', 'farm-ny', [parcel('ny-state', 10)]);
    const r = sim.execute<{ rent: number }>({ kind: 'land.lease_out', payload: { parcelId: 'farm' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.rent).toBe(inSave(sim, 835_00, 'USD'));
    expect(leaseRefusal(sim.player, sim.player.land![0], sim.now)).toMatch(/let already/);
    sim.advanceBy(366 * MS_DAY);
    expect(rentPaid(sim)).toHaveLength(2);
    expect(sim.execute({ kind: 'land.end_lease', payload: { parcelId: 'farm' } }).ok).toBe(true);
    sim.advanceBy(366 * MS_DAY);
    expect(rentPaid(sim)).toHaveLength(2);
    expect(sim.player.land![0]!.lease).toBeUndefined();
  });

  it('taxes England’s rent past HMRC’s £1,000 allowance, and Ontario’s whole, over a year’s earnings', () => {
    // Earnings past the personal allowance, so the rent is taxed at the margin.
    const earning = (sim: Simulation) => { yearOf(sim.player, zonedParts(sim.now, sim.zone).year).acting = inSave(sim, 60_000_00, 'USD'); return sim; };
    const small = earning(life('uk-eng-london', 'farm-gb-small', [parcel('england', 10)]));
    expect(small.execute({ kind: 'land.lease_out', payload: { parcelId: 'farm' } }).ok).toBe(true);
    expect(taxOn(small)).toBe(0);
    const big = earning(life('uk-eng-london', 'farm-gb-big', [parcel('england', 40)]));
    expect(big.execute({ kind: 'land.lease_out', payload: { parcelId: 'farm' } }).ok).toBe(true);
    expect(taxOn(big)).toBeGreaterThan(0);
    const on = earning(life('ca-on-toronto', 'farm-on', [parcel('ontario', 10)]));
    expect(on.execute({ kind: 'land.lease_out', payload: { parcelId: 'farm' } }).ok).toBe(true);
    expect(taxOn(on)).toBeGreaterThan(0);
  });

  it('keeps the land the farmer’s: not split, not ridden', () => {
    const sim = life('us-ny-newyork', 'farm-use', [parcel('ny-state', 40)]);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-fourtrax-rancher' } }).ok).toBe(true);
    expect(trailFor(sim.player)).toBeDefined();
    expect(sim.execute({ kind: 'land.lease_out', payload: { parcelId: 'farm' } }).ok).toBe(true);
    expect(trailFor(sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'land.split', payload: { parcelId: 'farm' } }).error).toMatch(/let to a farmer/);
    sim.player.land!.push(parcel('ny-state', 40, 'farm-2'));
    expect(sim.execute({ kind: 'land.combine', payload: { a: 'farm', b: 'farm-2' } }).error).toMatch(/isn’t joined/);
    // Nor let while it’s for sale, or while a house is built on it.
    const other = sim.player.land![1]!;
    other.selling = { closesAt: sim.now + 30 * MS_DAY };
    expect(leaseRefusal(sim.player, other, sim.now)).toMatch(/for sale/);
    delete other.selling;
    sim.player.building = { parcelId: other.id } as never;
    expect(leaseRefusal(sim.player, other, sim.now)).toMatch(/built/);
  });
});
