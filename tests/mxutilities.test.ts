/**
 * Mexico City's water and LP gas, and the water and gas cut off
 * (`systems/water.ts`, `systems/gas.ts`, `systems/utilities.ts`, from
 * 2026-10-03; `research-utilities-mx-outages.json`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { GAS_TARIFFS } from '@/engine/systems/gas';
import { WATER_TARIFFS, sacmexBimester } from '@/engine/systems/water';
import { GAS_RISK, WATER_RISK, cutNow, supplyCut } from '@/engine/systems/utilities';
import { lookAfterRefusal } from '@/engine/systems/life';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('Mexico City', () => {
  it('bills water by SACMEX’s Alta blocks for two months, half a month', () => {
    // Up to 15,000 liters, the minimum; above an edge, its rate on the liters past it.
    expect(sacmexBimester(10_000)).toBeCloseTo(265.25, 6);
    expect(sacmexBimester(15_000)).toBeCloseTo(265.25, 6);
    expect(sacmexBimester(20_000)).toBeCloseTo(265.25 + 5 * 29.86, 6);
    expect(sacmexBimester(25_000)).toBeCloseTo(414.49 + 5 * 33.38, 6);
    expect(sacmexBimester(130_000)).toBeCloseTo(6_011.31 + 10 * 123.79, 6);
    const t = WATER_TARIFFS['mx-cmx-mexicocity']!;
    expect(t.perPersonLiters).toBe(366);
    expect(t.bill(12_500, 1, 31, false)).toBeCloseTo(sacmexBimester(25_000) / 2, 6);
  });

  it('buys LP gas at the CNE’s cap, a household’s ENIGH month of it', () => {
    const g = GAS_TARIFFS['mx-cmx-mexicocity']!;
    expect(g.unit).toBe('kg');
    expect(g.typical).toBeCloseTo(29.44, 2);
    expect(g.bill(20, 1, 31)).toBeCloseTo(402, 6);
  });
});

describe('the water and gas cut off', () => {
  it('are drawn where a utility publishes its share, and shut the shower, the bath and the sink', () => {
    expect(WATER_RISK['uk-eng-london']!.perYear).toBeCloseTo(0.0222, 4);
    expect(GAS_RISK['uk-eng-london']!.meanHours).toBe(12.3);
    const ny = life('us-ny-newyork', 'cut-ny');
    expect(supplyCut(ny, ny.player, 'water', ny.now, 1)).toBeUndefined();
    const sim = life('uk-eng-london', 'cut-ldn');
    const cut = supplyCut(sim, sim.player, 'water', sim.now, 1)!;
    expect(cut.by).toBe('Thames Water');
    expect(cut.until - cut.from).toBeGreaterThanOrEqual(3 * 3_600_000);
    expect(cut.from - sim.now).toBeLessThan(MS_DAY);
    // Dublin's are twelve hours or twenty-four.
    const dub = life('ie-lei-dublin', 'cut-dub');
    const hours = new Set(Array.from({ length: 40 }, (_, d) => supplyCut(dub, dub.player, 'water', dub.now + d * MS_DAY, 1)!).map((c) => (c.until - c.from) / 3_600_000));
    expect([...hours].sort()).toEqual([12, 24]);
    // Any time of the day.
    expect(new Set(Array.from({ length: 10 }, (_, d) => supplyCut(dub, dub.player, 'water', dub.now + d * MS_DAY, 1)!.from - (dub.now + d * MS_DAY))).size).toBeGreaterThan(1);
    // Off now, nobody washes at home.
    sim.player.wellbeing.hygiene = 10;
    sim.player.currentLocationId = sim.player.home!.cityId;
    expect(lookAfterRefusal(sim, 'wash')).toBeUndefined();
    sim.player.supplyCuts = { water: { from: sim.now - 60_000, until: sim.now + 3 * 3_600_000, by: 'Thames Water' } };
    expect(cutNow(sim.player, 'water', sim.now)).toBeDefined();
    expect(lookAfterRefusal(sim, 'wash')).toMatch(/^Thames Water’s water is off at home until /);
    sim.player.supplyCuts.water!.until = sim.now;
    expect(lookAfterRefusal(sim, 'wash')).toBeUndefined();
    // One to come isn't off yet.
    sim.player.supplyCuts.water = { from: sim.now + 60_000, until: sim.now + 3 * 3_600_000, by: 'Thames Water' };
    expect(cutNow(sim.player, 'water', sim.now)).toBeUndefined();
    // The gas off: no bath where the water isn't heated by electricity.
    const gas = (s: typeof sim) => { s.player.wellbeing.hygiene = 10; s.player.supplyCuts = { gas: { from: s.now - 60_000, until: s.now + 3_600_000, by: 'Cadent' } }; return lookAfterRefusal(s, 'bathe'); };
    const boiler = life('uk-eng-london', 'cut-bath-4');
    expect(gas(boiler)).toMatch(/^There’s no hot water for a bath: Cadent’s gas is off until /);
    // An electric shower still runs.
    expect(lookAfterRefusal(boiler, 'wash')).toBeUndefined();
  });
});
