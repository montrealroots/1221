/**
 * What the weather decides (`systems/seasons.ts`): the energy on a month's
 * bills by the home's heating and cooling, and the flu's weeks by the town's
 * cold or wet ones, each keeping its year's total.
 */
import { describe, expect, it } from 'vitest';
import { homePlace, machineUsd } from '@/engine/systems/dwelling';
import { quickSave } from '@/engine';
import { instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { CARE } from '@/engine/content/safetynet';
import { billsFactor, degreeDays, energyByMonth, energyScale, energyYear, ENERGY, fluByWeek, weekOfYear } from '@/engine/systems/seasons';
import { CITIES } from '@/engine/content/geography';
import { atTown, billsOf, costsAt, telecomPartOf } from '@/engine/systems/household';
import { ENERGY_ABROAD_USD, ENERGY_PRICES_SINCE } from '@/engine/content/energy-world';
import { illnessWeek } from '@/engine/systems/health';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const peakWeek = (xs: number[]) => xs.indexOf(Math.max(...xs));

describe('the bills', () => {
  it('swing their energy with the town’s heating and cooling, keep the year’s total, and in the US take the state’s', () => {
    for (const city of ['us-ny-newyork', 'us-fl-miami', 'au-nsw-sydney', 'is-39-mosfellsbr']) {
      expect(sum(energyByMonth(city))).toBeCloseTo(1, 9);
      expect(sum(Array.from({ length: 12 }, (_, m) => billsFactor(city, m + 1)))).toBeCloseTo(12, 9);
    }
    expect(energyScale('au-nsw-sydney')).toBe(1);
    // A year's energy in the US is the state's spending against the nation's, the town's cost of living taken off,
    // at the last full year's prices (from 2026-10-02, `ENERGY_PRICES_SINCE`).
    const ny = CITIES.require('us-ny-newyork');
    expect(energyScale('us-ny-newyork')).toBeCloseTo((2_319 / 1_884) * (100 / ny.costOfLivingIndex) * ENERGY_PRICES_SINCE.us!, 9);
    // Abroad, a province's or a country's own survey, the same way: Ontario's, and Mexico's.
    const tor = CITIES.require('ca-on-toronto');
    expect(energyScale('ca-on-toronto')).toBeCloseTo((ENERGY_ABROAD_USD['ca-08']! / 1_884) * (100 / tor.costOfLivingIndex) * ENERGY_PRICES_SINCE['ca-08']!, 9);
    const mex = CITIES.require('mx-cmx-mexicocity');
    expect(energyScale('mx-cmx-mexicocity')).toBeCloseTo((ENERGY_ABROAD_USD.mx! / 1_884) * (100 / mex.costOfLivingIndex), 9);
    const perCol = (id: string) => energyScale(id) * CITIES.require(id).costOfLivingIndex;
    expect(perCol('us-ct-newhaven')).toBeGreaterThan(perCol('us-fl-miami'));
    // And the year's bills, which creation shows, carry it.
    const flat = (id: string) => atTown(id, 180, 'USD');
    expect(costsAt('us-ny-newyork', 'own', 'USD', Date.UTC(2026, 9, 1)).bills).toBe(Math.round(flat('us-ny-newyork') * energyYear('us-ny-newyork') / 100) * 100);
    expect(costsAt('au-nsw-sydney', 'own', 'USD', Date.UTC(2026, 9, 1)).bills).toBe(flat('au-nsw-sydney'));
    // New York heats in January and cools in July, more than it does either in May.
    expect(billsFactor('us-ny-newyork', 1)).toBeGreaterThan(billsFactor('us-ny-newyork', 5));
    expect(billsFactor('us-ny-newyork', 7)).toBeGreaterThan(billsFactor('us-ny-newyork', 5));
    // Miami never heats, and cools most in its summer; Sydney heats in July, the south's winter.
    expect(sum(degreeDays('us-fl-miami').hdd)).toBe(0);
    expect(billsFactor('us-fl-miami', 8)).toBeGreaterThan(billsFactor('us-fl-miami', 1));
    expect(degreeDays('au-nsw-sydney').hdd[6]).toBeGreaterThan(degreeDays('au-nsw-sydney').hdd[0]!);
    // Only the energy part moves: the rest of a month's bills holds.
    for (const city of ['us-ny-newyork', 'is-39-mosfellsbr']) for (let m = 1; m <= 12; m += 1) expect(billsFactor(city, m)).toBeGreaterThan(1 - ENERGY.share);
  });

  it('are paid on the 1st for the month just gone, at the home', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true });
    const flat = costsAt('us-ny-newyork', sim.player.home!.kind, saveCurrency(sim.universe), sim.now).bills;
    // The home's air conditioning decides the cooling in them, and its own machines' loads are added (`systems/dwelling.ts`).
    const cooling = homePlace(sim, sim.player)!.fixtures.cooling;
    const machines = () => atTown('us-ny-newyork', machineUsd(sim.player), saveCurrency(sim.universe));
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 1, hour: 12 }, 'America/New_York'));
    // Less the phone and internet, billed by their providers from 2026-10-01 (`telecomPartOf`).
    expect(billsOf(sim, sim.player)).toBe(Math.round(flat * billsFactor('us-ny-newyork', 1, cooling)) + machines() - telecomPartOf(sim, sim.player));
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 10, hour: 12 }, 'America/New_York'));
    expect(billsOf(sim, sim.player)).toBe(Math.round(flat * billsFactor('us-ny-newyork', 2, cooling)) + machines() - telecomPartOf(sim, sim.player));
  });
});

describe('the flu', () => {
  it('comes in the town’s cold weeks, the south’s in its winter, and a year’s chance stays the same', () => {
    for (const city of ['us-ny-newyork', 'us-fl-miami', 'au-nsw-sydney', 'us-ca-losangeles']) {
      const w = fluByWeek(city);
      expect(w).toHaveLength(52);
      expect(sum(w)).toBeCloseTo(1, 9);
      // Across the weeks, the chance of none is the year's 1 − 8.9%.
      expect(w.reduce((none, share) => none * (1 - CARE.flu) ** share, 1)).toBeCloseTo(1 - CARE.flu, 9);
    }
    const ny = peakWeek(fluByWeek('us-ny-newyork'));
    expect(ny === 51 || ny < 9).toBe(true);
    const syd = peakWeek(fluByWeek('au-nsw-sydney'));
    expect(syd).toBeGreaterThanOrEqual(weekOfYear(5, 15));
    expect(syd).toBeLessThanOrEqual(weekOfYear(9, 1));
    // New York's July carries next to none.
    expect(fluByWeek('us-ny-newyork')[weekOfYear(7, 20)]).toBeLessThan(0.002);
    // Drawn week by week, New York's Januaries bring it and its Julys don't; Sydney's the other way round.
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'flu-weeks');
    const count = (city: string, month: number) => { sim.player.currentLocationId = city; let n = 0; for (let y = 0; y < 400; y += 1) for (const d of [1, 8, 15, 22]) if (illnessWeek(sim, sim.player, instantFromZoned({ year: 2027 + y, month, day: d, hour: 9 }, 'UTC')).some((e) => e.flu)) n += 1; return n; };
    const season = (city: string, months: number[]) => months.reduce((n, m) => n + count(city, m), 0);
    expect(season('us-ny-newyork', [12, 1, 2])).toBeGreaterThan(3 * (season('us-ny-newyork', [6, 7, 8]) + 1));
    expect(season('au-nsw-sydney', [6, 7, 8])).toBeGreaterThan(3 * (season('au-nsw-sydney', [12, 1, 2]) + 1));
    // Miami, warm all year, keeps some in its wet summer too.
    expect(fluByWeek('us-fl-miami')[weekOfYear(7, 20)]).toBeGreaterThan(0.005);
  });
});
