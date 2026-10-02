/**
 * What a person owns beyond the bank, in their net worth (`systems/finance.ts`,
 * from 2026-09-29): a car at what it'd sell for and its loan among the debts,
 * land at its value, and a house going up at what its stages have cost.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { LAND_MARKETS } from '@/engine/content/land';
import { netWorth } from '@/engine/systems/finance';
import { valueOf, vehiclesOf } from '@/engine/systems/vehicles';
import { landValue, parcelsOf, type Parcel } from '@/engine/systems/land';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

describe('net worth beyond the bank', () => {
  it('counts a financed car at its value and its loan as owed', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'worth-car');
    sim.player.credit = { ...(sim.player.credit ?? {}), score: 720 } as typeof sim.player.credit;
    const before = netWorth(sim, sim.player.id);
    expect(before.vehicles).toBe(0);
    const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-cr-v', financed: true, months: 60 } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    const w = netWorth(sim, sim.player.id);
    expect(w.vehicles).toBe(inSave(sim, valueOf(v, sim.now), 'USD'));
    expect(w.liabilities - before.liabilities).toBe(v.loan!.owed);
    // Bought with the loan: worth falls by the taxes and fees paid and nothing like the car's price.
    expect(before.total - w.total).toBeLessThan(inSave(sim, 5_000_00, 'USD'));
  });

  it('counts land at its value, and a house going up on it at its stages paid', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'worth-land');
    const market = LAND_MARKETS.findIndex((m) => m.label === 'A Lot In Queens');
    const p: Parcel = { id: 'parcel_1', market, acres: 2_850 / 43_560, boughtAt: sim.now, paid: 380_000_00 };
    parcelsOf(sim.player).push(p);
    const land = inSave(sim, landValue(LAND_MARKETS[market]!, p.acres, sim.now), 'USD');
    expect(netWorth(sim, sim.player.id).land).toBe(land);
    sim.player.building = { parcelId: p.id, place: 'nyc', cityId: 'us-ny-newyork', designId: 'ne-owner', live: true, startedAt: sim.now, contract: 300_000_00, fees: 0, spared: 0, amounts: [10_000_00, 20_000_00, 30_000_00], days: [1, 1, 1], stage: 2, log: [] };
    expect(netWorth(sim, sim.player.id).land).toBe(land + inSave(sim, 30_000_00, 'USD'));
    p.soldAt = sim.now + MS_DAY;
    delete sim.player.building;
    expect(netWorth(sim, sim.player.id).land).toBe(0);
  });
});
