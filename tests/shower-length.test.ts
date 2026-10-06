/**
 * A shower as long as it's taken (`hygiene.shower_minutes`, `countWash` in
 * `systems/water.ts`, from 2026-10-06): it counts as its share of the
 * country's average shower, REU2016's 7.8 minutes in America, so its water and
 * the heating of it are metered by the minute, and it takes that long.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { livingOf } from '@/engine/systems/dwelling';
import { SHOWER_AROUND, minutesFor } from '@/engine/systems/life';
import { SHOWER_MINUTES, WASHING, litersUsed } from '@/engine/systems/water';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true }, seed);
const dirty = (sim: ReturnType<typeof life>) => { sim.player.wellbeing.hygiene = 10; };

describe('a shower as long as it’s taken', () => {
  it('counts as its share of America’s 7.8-minute shower, and takes its minutes', () => {
    const sim = life('us-ny-newyork', 'shower-long');
    dirty(sim);
    const before = livingOf(sim.player).showers ?? 0;
    const t = sim.now;
    const took = minutesFor(sim, 'wash', 16);
    sim.must({ kind: 'life.look_after', payload: { action: 'wash', minutes: 16 } });
    expect((livingOf(sim.player).showers ?? 0) - before).toBeCloseTo(16 / SHOWER_MINUTES.us!, 9);
    expect(took).toBeGreaterThanOrEqual(SHOWER_AROUND + 16);
    expect(sim.now - t).toBe(took * 60_000);
  });

  it('keeps a habit, used where none is given, and refuses a length that isn’t one', () => {
    const sim = life('us-ny-newyork', 'shower-habit');
    sim.must({ kind: 'hygiene.shower_minutes', payload: { minutes: 4 } });
    expect(sim.player.showerMinutes).toBe(4);
    dirty(sim);
    const before = livingOf(sim.player).showers ?? 0;
    sim.must({ kind: 'life.look_after', payload: { action: 'wash' } });
    expect((livingOf(sim.player).showers ?? 0) - before).toBeCloseTo(4 / 7.8, 9);
    expect(sim.execute({ kind: 'hygiene.shower_minutes', payload: { minutes: 0 } }).error).toBe('A shower is a whole number of minutes, from one to sixty.');
    dirty(sim);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash', minutes: 90 } }).error).toBe('A shower is a whole number of minutes, from one to sixty.');
    sim.must({ kind: 'hygiene.shower_minutes', payload: { minutes: null } });
    expect(sim.player.showerMinutes).toBeUndefined();
  });

  it('runs Mexico’s NOM-008 10 liters a minute for its minutes, against America’s average shower stood in', () => {
    const sim = life('mx-cmx-mexicocity', 'shower-mx');
    expect(WASHING.mx!.showerL / SHOWER_MINUTES.mx!).toBe(10);
    dirty(sim);
    const before = livingOf(sim.player).showers ?? 0;
    sim.must({ kind: 'life.look_after', payload: { action: 'wash', minutes: 20 } });
    const counted = (livingOf(sim.player).showers ?? 0) - before;
    expect(counted * WASHING.mx!.showerL).toBeCloseTo(200, 9);
    const l = livingOf(sim.player);
    const base = { ...l, billDays: 30, homeDays: 30, showers: 0, baths: 0 };
    const p = { ...sim.player, living: base };
    const more = { ...sim.player, living: { ...base, showers: 2 } };
    expect(litersUsed(more, 'mx-cmx-mexicocity', 6) - litersUsed(p, 'mx-cmx-mexicocity', 6)).toBeCloseTo(2 * 78, 9);
  });

  it('is one shower where no average one was read, as in Dublin, whose homes pay no water charge', () => {
    const sim = life('ie-lei-dublin', 'shower-ie');
    dirty(sim);
    const before = livingOf(sim.player).showers ?? 0;
    sim.must({ kind: 'life.look_after', payload: { action: 'wash', minutes: 20 } });
    expect((livingOf(sim.player).showers ?? 0) - before).toBe(1);
  });
});
