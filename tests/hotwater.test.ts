/**
 * A home's hot water (`systems/hotwater.ts`, from 2026-10-03): its heater
 * drawn at the country's share, and an electric heater's showers past the
 * average on the electricity bill.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { COLD_MAINS_C, HEATER_SHARE, showerGasKwhDelta, showerKwh, showerKwhDelta, waterHeaterOf } from '@/engine/systems/hotwater';
import { gasAdjustment, gasUnits } from '@/engine/systems/gas';
import { countHomeDay, electricityAdjustment } from '@/engine/systems/electricity';
import { WASHING } from '@/engine/systems/water';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('the water heater', () => {
  it('is drawn at the country’s share, the same for a home each time', () => {
    const counts = { gas: 0, electric: 0, other: 0 };
    for (let i = 0; i < 600; i += 1) {
      const sim = life('us-ny-newyork', `heater-${i}`);
      const h = waterHeaterOf(sim, sim.player)!;
      expect(waterHeaterOf(sim, sim.player)).toBe(h);
      counts[h] += 1;
    }
    expect(counts.electric / 600).toBeGreaterThan(HEATER_SHARE.us!.electric - 0.06);
    expect(counts.electric / 600).toBeLessThan(HEATER_SHARE.us!.electric + 0.06);
    expect(counts.gas / 600).toBeGreaterThan(HEATER_SHARE.us!.gas - 0.06);
    expect(counts.other).toBeGreaterThan(0);
    const dublin = life('ie-lei-dublin', 'heater-ie');
    expect(waterHeaterOf(dublin, dublin.player)).toBeUndefined();
  });

  it('heats a shower: two-thirds of America’s 59.8 liters from 14.4 °C to 51.7 °C; all of Britain’s 60 to 41 °C', () => {
    expect(showerKwh('us', 1)).toBeCloseTo(59.8 * (17.8 / 26.9) * 37.3 * 0.001164, 9);
    expect(showerKwh('uk', 1)).toBeCloseTo(60 * (41 - COLD_MAINS_C[0]) * 0.001164, 9);
    expect(showerKwh('uk', 7)).toBeLessThan(showerKwh('uk', 1)!);
    expect(showerKwh('ie', 1)).toBeUndefined();
  });
});

describe('an electric heater’s showers', () => {
  function electricHome(city: string) {
    for (let i = 0; i < 200; i += 1) {
      const sim = life(city, `elec-${i}`);
      if (waterHeaterOf(sim, sim.player) === 'electric') return sim;
    }
    throw new Error('no electric heater drawn');
  }

  it('past the average are on the electricity bill; a gas heater’s aren’t', () => {
    const sim = electricHome('us-ny-newyork');
    sim.player.living ??= { tidy: 80 };
    delete sim.player.living.billDays; delete sim.player.living.homeDays;
    for (let d = 0; d < 30; d += 1) countHomeDay(sim.player, true);
    sim.player.living.showers = WASHING.us!.showersADay * 30;
    expect(showerKwhDelta(sim, sim.player, 11)).toBeCloseTo(0, 9);
    const even = electricityAdjustment(sim, sim.player, 11);
    sim.player.living.showers += 30;
    expect(showerKwhDelta(sim, sim.player, 11)).toBeCloseTo(30 * showerKwh('us', 11)!, 9);
    expect(electricityAdjustment(sim, sim.player, 11)).toBeGreaterThan(even);
    for (let i = 0; i < 200; i += 1) {
      const gas = life('us-ny-newyork', `gas-${i}`);
      if (waterHeaterOf(gas, gas.player) !== 'gas') continue;
      gas.player.living = { tidy: 80, billDays: 30, homeDays: 30, showers: 90 };
      expect(showerKwhDelta(gas, gas.player, 11)).toBe(0);
      return;
    }
    throw new Error('no gas heater drawn');
  });
});

describe('a gas heater’s showers', () => {
  function heated(city: string, heater: string) {
    for (let i = 0; i < 200; i += 1) {
      const sim = life(city, `gasheat-${i}`);
      if (waterHeaterOf(sim, sim.player) !== heater) continue;
      sim.player.home = { ...sim.player.home!, kind: 'own' } as never;
      sim.player.living = { tidy: 80, billDays: 30, homeDays: 30, showers: WASHING[city.startsWith('uk') ? 'gb' : 'us']!.showersADay * 30 };
      return sim;
    }
    throw new Error(`no ${heater} heater drawn`);
  }

  it('past the average are on the gas bill: ENERGY STAR’s 0.81 UEF in America, a combi’s 92% in London', () => {
    const ny = heated('us-ny-newyork', 'gas');
    expect(showerGasKwhDelta(ny, ny.player, 11)).toBeCloseTo(0, 9);
    const even = gasAdjustment(ny, ny.player, 11);
    ny.player.living!.showers! += 30;
    expect(showerGasKwhDelta(ny, ny.player, 11)).toBeCloseTo((30 * showerKwh('us', 11)!) / 0.81, 9);
    expect(gasAdjustment(ny, ny.player, 11)).toBeGreaterThan(even);
    // Not on the electricity bill as well.
    expect(showerKwhDelta(ny, ny.player, 11)).toBe(0);
    const ldn = heated('uk-eng-london', 'other');
    ldn.player.living!.showers! += 30;
    expect(showerGasKwhDelta(ldn, ldn.player, 11)).toBeCloseTo((30 * showerKwh('uk', 11)!) / 0.92, 9);
    expect(gasUnits('therm', 29.3071)).toBeCloseTo(1, 4);
    expect(gasUnits('ccf', 29.3071 * 1.036)).toBeCloseTo(1, 4);
    // An electric shower in London isn't the boiler's.
    const elec = heated('uk-eng-london', 'electric');
    elec.player.living!.showers! += 30;
    expect(showerGasKwhDelta(elec, elec.player, 11)).toBe(0);
  });
});
