/**
 * What the weather decides (`systems/seasons.ts`): the energy on a month's
 * bills by the home's heating and cooling, and the flu's weeks by the town's
 * cold or wet ones, each keeping its year's total.
 */
import { quickSave } from '@/engine';
import { CARE } from '@/engine/content/safetynet';
import { instantFromZoned } from '@/engine/core/time';
import { illnessWeek } from '@/engine/systems/health';
import { fluByWeek,weekOfYear } from '@/engine/systems/seasons';
import { describe,expect,it } from 'vitest';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const peakWeek = (xs: number[]) => xs.indexOf(Math.max(...xs));

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
