/**
 * The heat index (`heatIndexC` in `systems/weather.ts`, from 2026-10-01): the
 * National Weather Service's equation, and what reads it, a run's and sitting
 * out's "too hot" (`FINE` in `systems/dwelling.ts`). Until then the humidity
 * the weather drew was only shown.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { heatIndexC, weatherAt } from '@/engine/systems/weather';
import { FINE, fineWeatherRefusal, trainingAt } from '@/engine/systems/dwelling';

const c = (f: number) => ((f - 32) * 5) / 9;

describe('the heat index', () => {
  it('matches the National Weather Service’s chart', () => {
    // 90°F at 50% is 95°F; 96°F at 65% is 121°F; 80°F at 40% is 80°F.
    expect(Math.abs(heatIndexC(c(90), 50) - c(95))).toBeLessThan(0.6);
    expect(Math.abs(heatIndexC(c(96), 65) - c(121))).toBeLessThan(0.6);
    expect(Math.abs(heatIndexC(c(80), 40) - c(80))).toBeLessThan(0.6);
    // Very dry air takes some off, very humid air at 80 to 87°F adds some.
    // 100°F at 10%: the regression's 94.753°F less the dry air's 0.630; 84°F at 95%: 100.282°F and 0.600 more.
    expect(heatIndexC(c(100), 10)).toBeCloseTo(c(94.753 - 0.63), 2);
    expect(heatIndexC(c(84), 95)).toBeCloseTo(c(100.282 + 0.6), 2);
    // Under 80°F, Steadman's simple form: 70°F at 50% is 69.05°F, not the regression's 76.9.
    expect(heatIndexC(c(70), 50)).toBeCloseTo(c(69.05), 2);
  });

  it('keeps a run and sitting out in on a humid afternoon under 32 °C', () => {
    const sim = quickSave({ startLocationId: 'us-tx-houston', homeRegionId: 'us-tx-houston', livesWhereBorn: true }, 'heat-index');
    // The first afternoon in Houston's summer that's under the line on temperature and over it humid.
    let found = false;
    for (let d = 150; d < 260 && !found; d += 1) {
      const at = Date.UTC(2026, 0, 1) + d * 86_400_000 + 20 * 3_600_000;
      const w = weatherAt(sim, 'us-tx-houston', at);
      if (!w || w.wetNow || w.temperatureC > FINE.highC || heatIndexC(w.temperatureC, w.humidity) <= FINE.highC) continue;
      sim.advanceTo(at);
      sim.player.currentLocationId = 'us-tx-houston';
      expect(fineWeatherRefusal(sim, sim.player, 'sit out', 1, 45)).toMatch(/too hot/);
      expect(trainingAt(sim, sim.player).where).not.toBe('run');
      found = true;
    }
    expect(found).toBe(true);
  });
});
