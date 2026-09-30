/**
 * Winter tires (`systems/tires.ts`, from 2026-09-30): sold in America and
 * Canada, 5% fewer crash injuries in Quebec's season, Ontario's discount and
 * switchovers, and worn out after 40,000 winter miles.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { crashChance } from '@/engine/systems/driving';
import { WINTER_TIRES, inWinterSeason, tireFactor, tiresMonth, tiresRefusal } from '@/engine/systems/tires';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const buy = (sim: Simulation, modelId: string) => { const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId } }); expect(r.ok, r.error).toBe(true); return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!; };

describe('the season', () => {
  it('is Quebec’s 15 December to 15 March', () => {
    expect(inWinterSeason(Date.UTC(2027, 0, 10, 17), 'us-ny-newyork')).toBe(true);
    expect(inWinterSeason(Date.UTC(2026, 11, 16, 17), 'us-ny-newyork')).toBe(true);
    expect(inWinterSeason(Date.UTC(2026, 11, 10, 17), 'us-ny-newyork')).toBe(false);
    expect(inWinterSeason(Date.UTC(2027, 2, 20, 17), 'us-ny-newyork')).toBe(false);
  });
});

describe('a set', () => {
  it('is sold in America and Canada at Discount Tire’s middle, for a car', () => {
    const sim = life('us-ny-newyork', 'tires-ny');
    const v = buy(sim, 'us-toyota-camry');
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.winter_tires', payload: { vehicleId: v.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, 1_200_00, 'USD'));
    expect(tiresRefusal(v)).toMatch(/has a set/);
    const gb = life('uk-eng-london', 'tires-gb');
    expect(tiresRefusal(buy(gb, 'gb-honda-cb125f'))).toMatch(/for a car/);
    // A car kept in Britain, where no price was read.
    expect(tiresRefusal({ ...v, winterTires: undefined, jurisdiction: 'GB' } as OwnedVehicle)).toMatch(/America and Canada/);
  });

  it('cuts a crash’s chance by 5% in the season only', () => {
    const v = { winterTires: { boughtAt: 0, km: 0 }, cityId: 'us-ny-newyork' } as OwnedVehicle;
    expect(tireFactor(v, Date.UTC(2027, 0, 10, 17))).toBe(0.95);
    expect(tireFactor(v, Date.UTC(2027, 6, 10, 17))).toBe(1);
    expect(tireFactor({ cityId: 'us-ny-newyork' } as OwnedVehicle, Date.UTC(2027, 0, 10, 17))).toBe(1);
    const sim = life('us-ny-newyork', 'tires-crash');
    const at = Date.UTC(2027, 0, 10, 17);
    expect(crashChance(sim.player, 100, at, 'car', 0.95) / crashChance(sim.player, 100, at)).toBeCloseTo(0.95, 5);
  });

  it('takes Ontario’s 3.5% off the car’s insurance, is swapped in November and April, and wears out after 40,000 winter miles', () => {
    const sim = life('ca-on-toronto', 'tires-on');
    const v = buy(sim, 'ca-toyota-rav4');
    const month = (memo: RegExp) => sim.universe.transactions.filter((t) => memo.test(t.memo)).map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount ?? 0);
    sim.advanceBy(31 * MS_DAY);
    const before = month(/^Car insurance/).at(-1)!;
    expect(sim.execute({ kind: 'vehicle.winter_tires', payload: { vehicleId: v.id } }).ok).toBe(true);
    sim.advanceBy(31 * MS_DAY);
    expect(month(/^Car insurance/).at(-1)).toBe(Math.round(before * (1 - WINTER_TIRES.ontarioDiscount)));
    // A November month charges the switchover.
    for (let n = 0; n < 13 && zonedParts(sim.now, 'America/Toronto').month !== 12; n += 1) sim.advanceBy(31 * MS_DAY);
    expect(month(/^Winter tires swapped/).length).toBeGreaterThan(0);
    // Summer kilometers aren't winter wear.
    const worn = v.winterTires!.km;
    tiresMonth(sim, sim.player, v, 5_000, Date.UTC(2027, 6, 10, 17));
    expect(v.winterTires!.km).toBe(worn);
    v.winterTires!.km = WINTER_TIRES.wearKm - 1;
    tiresMonth(sim, sim.player, v, 10, Date.UTC(2027, 0, 10, 17));
    expect(v.winterTires).toBeUndefined();
  });
});
