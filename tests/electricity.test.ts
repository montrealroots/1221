/**
 * Electricity by the utility's tariff (`systems/electricity.ts`, from
 * 2026-10-02): at home every day the bill is the atlas's; a month away takes
 * the energy charges off and leaves the fixed charge; the blocks bite as the
 * tariffs say.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { billsOf } from '@/engine/systems/household';
import { KIND_SHARE, TARIFFS, countHomeDay, electricityAdjustment } from '@/engine/systems/electricity';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const month = (sim: Simulation, home: number, of: number) => { sim.player.living ??= { tidy: 80 }; delete sim.player.living.billDays; delete sim.player.living.homeDays; for (let d = 0; d < of; d += 1) countHomeDay(sim.player, d < home); };

describe('the tariff', () => {
  it('blocks bite where they’re set: LADWP’s summer tier 3, BC Hydro’s step, Toronto’s summer threshold', () => {
    const la = TARIFFS['us-ca-losangeles']!;
    // 1,100 kWh in August: 350 at 26.408, 700 at 32.267, 50 at 40.968, and the $22.70 access charge.
    expect(la.bill(1_100, 8, 31)).toBeCloseTo(22.7 + 350 * 0.26408 + 700 * 0.32267 + 50 * 0.40968, 6);
    expect(la.bill(0, 8, 31)).toBe(10);
    const bc = TARIFFS['ca-bc-vancouver']!;
    expect(bc.bill(700, 1, 30)).toBeCloseTo(0.2344 * 30 + 22.1918 * 30 * 0.1187 + (700 - 22.1918 * 30) * 0.1408, 6);
    const to = TARIFFS['ca-on-toronto']!;
    expect(to.bill(800, 7, 31) - to.bill(800, 1, 31)).toBeCloseTo(200 * 0.022 * (1 - 0.235) * 1.13, 6);
  });
});

describe('the month used', () => {
  it('home every day, nothing changes; a month away, the energy charge comes off and the fixed charge stays', () => {
    const sim = life('uk-eng-london', 'el-london');
    sim.player.home = { ...sim.player.home!, kind: 'own' } as never;
    month(sim, 31, 31);
    expect(electricityAdjustment(sim, sim.player, 10)).toBe(0);
    month(sim, 0, 31);
    const typical = (2_500 / 12) * KIND_SHARE.own!;
    expect(electricityAdjustment(sim, sim.player, 10)).toBe(inSave(sim, -typical * 0.266, 'GBP'));
    // Half the month home, half the energy.
    month(sim, 15, 30);
    expect(electricityAdjustment(sim, sim.player, 11)).toBe(inSave(sim, -typical * 0.266 / 2, 'GBP'));
  });

  it('none in Mexico City, whose typical use isn’t published', () => {
    const sim = life('mx-cmx-mexicocity', 'el-mx');
    month(sim, 0, 31);
    expect(electricityAdjustment(sim, sim.player, 5)).toBe(0);
  });

  it('counted day by day as the clock runs, cleared when the bills are paid, and in the bills', () => {
    const sim = life('us-ny-newyork', 'el-days');
    sim.advanceBy(3 * 24 * 3_600_000);
    expect(sim.player.living?.billDays ?? 0).toBeGreaterThan(0);
    expect(sim.player.living!.homeDays).toBe(sim.player.living!.billDays);
    const home = billsOf(sim, sim.player);
    sim.player.living!.homeDays = 0;
    expect(home - billsOf(sim, sim.player)).toBeGreaterThan(0);
    // Played past the 1st, the month's count starts again.
    const counted = sim.player.living!.billDays!;
    for (let d = 0; d < 32 && (sim.player.living!.billDays ?? 0) >= counted; d += 1) sim.advanceBy(24 * 3_600_000);
    expect(sim.player.living!.billDays ?? 0).toBeLessThan(counted);
  });
});
