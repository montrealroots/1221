/**
 * Shaving at home (`shave` in `systems/hygiene.ts`, from 2026-10-03): with
 * the shower on its days, RIVM's 2 g of cream and 5 minutes, a razor's share
 * of the shaves its maker gives.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { SHAVE, razorShaves, restock, shaveDue, shaveReady, suppliesOf } from '@/engine/systems/hygiene';
import { minutesFor } from '@/engine/systems/life';
import { addItem, homeKeyOf } from '@/engine/systems/items';
import type { Simulation } from '@/engine/core/simulation';

const life = () => quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'shave');
const kit = (sim: Simulation) => {
  const home = homeKeyOf(sim.player.home)!;
  const at = { kind: 'home' as const, home, spot: 'bathroom' as const };
  const razor = addItem(sim, sim.player, { kind: 'supervalu-ie-gillette-mach3', label: 'Gillette Mach3 Disposable Razor (3 Piece)', quantity: 1, condition: 1, at, acquiredAt: sim.now, supply: { kind: 'razor', unit: 'ct', left: 3 } });
  const cream = addItem(sim, sim.player, { kind: 'supervalu-ie-gillette-foam', label: 'Gillette Series Sensitive Shaving Foam (250 ml)', quantity: 1, condition: 1, at, acquiredAt: sim.now, supply: { kind: 'shaving-cream', unit: 'ml', left: 250 } });
  return { razor, cream };
};

describe('a shave', () => {
  it('is a razor’s share of its maker’s shaves', () => {
    expect(razorShaves('Gillette Mach3 Disposable Razor (3 Piece)')).toBe(15);
    expect(razorShaves('Gillette Fusion5 ProGlide')).toBe(20);
    expect(razorShaves('Schick Hydro 5')).toBe(18);
    expect(razorShaves('Harry’s 3-Blade Disposable Razors')).toBe(7);
    expect(razorShaves('Sainsbury’s Smooth 2 Blade Disposable Razors (10)')).toBe(7.5);
  });

  it('comes with the shower on its days, with its cream and its five minutes', () => {
    const sim = life();
    sim.player.suppliesSince ??= sim.now;
    const { razor, cream } = kit(sim);
    sim.player.wellbeing.hygiene = 20;
    const plain = minutesFor(sim, 'wash');
    expect(sim.execute({ kind: 'hygiene.shave_every', payload: { every: 'alternate' } }).ok).toBe(true);
    expect(minutesFor(sim, 'wash')).toBe(plain + SHAVE.minutes);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    const r = suppliesOf(sim.player).find((i) => i.id === razor.id)!;
    expect(r.supply.left).toBeCloseTo(3 - 1 / 15, 9);
    expect(suppliesOf(sim.player).find((i) => i.id === cream.id)!.supply.left).toBe(250 - SHAVE.creamG);
    // Every other day: not again tomorrow, the day after.
    expect(shaveDue(sim.player, sim.now + MS_DAY)).toBe(false);
    expect(shaveDue(sim.player, sim.now + 2 * MS_DAY)).toBe(true);
    expect(shaveReady(sim, sim.player)).toBe(false);
  });

  it('isn’t had without a razor and the cream, nor by someone who doesn’t shave', () => {
    const sim = life();
    sim.player.suppliesSince ??= sim.now;
    sim.player.wellbeing.hygiene = 20;
    expect(sim.execute({ kind: 'hygiene.shave_every', payload: { every: 'daily' } }).ok).toBe(true);
    const plain = minutesFor(sim, 'wash');
    kit(sim);
    expect(minutesFor(sim, 'wash')).toBe(plain + SHAVE.minutes);
    expect(sim.execute({ kind: 'hygiene.shave_every', payload: { every: null } }).ok).toBe(true);
    expect(sim.player.shaves).toBeUndefined();
    expect(minutesFor(sim, 'wash')).toBe(plain);
    expect(sim.execute({ kind: 'hygiene.shave_every', payload: { every: 'hourly' } }).error).toBe('Choose how often.');
  });

  it('brings razors and cream home with the day’s top-up, for someone who shaves', () => {
    const sim = life();
    sim.player.suppliesSince ??= sim.now;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 13, hour: 12 }, 'Europe/Dublin'));
    const kinds = () => new Set(suppliesOf(sim.player).map((i) => i.supply.kind));
    restock(sim, sim.player);
    expect(kinds().has('razor')).toBe(false);
    sim.player.shaves = 'weekly';
    restock(sim, sim.player);
    expect(kinds().has('razor')).toBe(true);
    expect(kinds().has('shaving-cream')).toBe(true);
  });
});
