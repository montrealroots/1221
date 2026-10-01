/**
 * A dating app (`systems/dating.ts`, from 2026-10-01): its monthly price
 * where it was read, matches each month in your town, free fewer than
 * paid, met online and free to be asked out.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { contactsOf, asksOutRefusal } from '@/engine/systems/people';
import { appPrice } from '@/engine/systems/dating';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const online = (sim: Simulation) => contactsOf(sim.player).filter((c) => c.met.how === 'online');

describe('a dating app', () => {
  it('costs its read monthly price where it’s sold, and nothing on its free plan', () => {
    const ny = life('us-ny-newyork', 'da-price');
    expect(appPrice(ny, ny.player, 'Tinder Plus')).toBe(inSave(ny, 24.99, 'USD'));
    expect(appPrice(ny, ny.player, 'Hinge+')).toBe(inSave(ny, 29.99, 'USD'));
    expect(appPrice(ny, ny.player, 'Tinder')).toBe(0);
    const du = life('ie-lei-dublin', 'da-ie');
    expect(appPrice(du, du.player, 'Tinder Plus')).toBeUndefined();
    expect(du.execute({ kind: 'dating.app', payload: { label: 'Tinder Plus' } }).error).toMatch(/isn’t sold/);
  });

  it('brings matches each month in your town, more on a paid plan, free to be asked out, until you leave it', () => {
    const months = (label: string) => {
      const sim = life('us-ny-newyork', 'da-match');
      expect(sim.execute({ kind: 'dating.app', payload: { label } }).ok).toBe(true);
      sim.advanceBy(3 * 31 * MS_DAY);
      return sim;
    };
    const free = months('Tinder');
    const paid = months('Tinder Plus');
    expect(online(free)).toHaveLength(3);
    expect(online(paid)).toHaveLength(6);
    const m = online(paid)[0]!;
    expect(m.cityId).toBe('us-ny-newyork');
    expect(asksOutRefusal(paid.player, { ...m, hours: 50 })).toBeUndefined();
    // The first month on joining, and one each month after.
    expect(paid.universe.transactions.filter((t) => t.memo === 'Tinder Plus, the month')).toHaveLength(4);
    expect(paid.execute({ kind: 'dating.app', payload: {} }).ok).toBe(true);
    paid.advanceBy(62 * MS_DAY);
    expect(online(paid)).toHaveLength(6);
  });

  it('switched, runs the new app’s month only', () => {
    const sim = life('us-ny-newyork', 'da-switch');
    expect(sim.execute({ kind: 'dating.app', payload: { label: 'Tinder' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'dating.app', payload: { label: 'Hinge' } }).ok).toBe(true);
    sim.advanceBy(32 * MS_DAY);
    expect(online(sim)).toHaveLength(1);
    expect(online(sim)[0]!.met.what).toBe('Hinge');
  });
});
