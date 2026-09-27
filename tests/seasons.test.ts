/**
 * What the weather decides (`systems/seasons.ts`): the energy on a month's
 * bills by the home's heating and cooling, and the flu's weeks by the town's
 * cold or wet ones, each keeping its year's total.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { CARE } from '@/engine/content/safetynet';
import { billsFactor, degreeDays, energyByMonth, ENERGY, fluByWeek, weekOfYear } from '@/engine/systems/seasons';
import { billsOf, costsAt } from '@/engine/systems/household';
import { illnessWeek } from '@/engine/systems/health';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const peakWeek = (xs: number[]) => xs.indexOf(Math.max(...xs));

describe('the bills', () => {
  it('swing their energy with the town’s heating and cooling, and keep the year’s total', () => {
    for (const city of ['us-ny-newyork', 'us-fl-miami', 'au-nsw-sydney', 'is-39-mosfellsbr']) {
      expect(sum(energyByMonth(city))).toBeCloseTo(1, 9);
      expect(sum(Array.from({ length: 12 }, (_, m) => billsFactor(city, m + 1)))).toBeCloseTo(12, 9);
    }
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
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 1, hour: 12 }, 'America/New_York'));
    expect(billsOf(sim, sim.player)).toBe(Math.round(flat * billsFactor('us-ny-newyork', 1)));
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 10, hour: 12 }, 'America/New_York'));
    expect(billsOf(sim, sim.player)).toBe(Math.round(flat * billsFactor('us-ny-newyork', 2)));
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
