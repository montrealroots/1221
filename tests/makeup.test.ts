/**
 * Makeup and hair styling at home (`makeUp` in `systems/hygiene.ts`, from
 * 2026-10-05): worn as often as chosen with the morning's wash, each kind at
 * the SCCS's grams a day from what's to hand, nothing worn on the days
 * between, and bought again as it runs out.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { COSMETIC_G_A_DAY, TOILETRIES } from '@/engine/content/hygiene';
import { makeUp, restock } from '@/engine/systems/hygiene';
import { homeKeyOf, itemsOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const kit = (sim: ReturnType<typeof life>, kind: string, left: number) => {
  const item = { id: `c-${kind}`, kind: `t-${kind}`, label: kind, quantity: 1, condition: 1, at: { kind: 'home' as const, home: homeKeyOf(sim.player.home)!, spot: 'bathroom' as const }, acquiredAt: sim.now, supply: { kind, unit: 'g' as const, left } };
  sim.player.items = [...(sim.player.items ?? []), item as never];
  return item;
};

describe('makeup and hair styling at home', () => {
  it('take the SCCS’s grams a day of each kind worn, on its days only', () => {
    expect(COSMETIC_G_A_DAY).toMatchObject({ foundation: 0.51, lipstick: 0.057, mascara: 0.025, 'hair-styling': 4 });
    const sim = life('ca-bc-vancouver', 'makeup');
    sim.must({ kind: 'hygiene.makeup_every', payload: { every: 'alternate', kinds: ['mascara', 'lipstick', 'not-a-kind'] } });
    expect(sim.player.makeup).toEqual({ every: 'alternate', kinds: ['lipstick', 'mascara'] });
    sim.must({ kind: 'hygiene.style_every', payload: { every: 'daily' } });
    const mascara = kit(sim, 'mascara', 9);
    const lipstick = kit(sim, 'lipstick', 4);
    const gel = kit(sim, 'hair-styling', 150);
    expect(makeUp(sim, sim.player).sort()).toEqual(['hair-styling', 'lipstick', 'mascara']);
    expect(9 - mascara.supply.left).toBeCloseTo(0.025, 9);
    expect(4 - lipstick.supply.left).toBeCloseTo(0.057, 9);
    expect(150 - gel.supply.left).toBeCloseTo(4, 9);
    // The next day, styling only: makeup is every other day.
    sim.universe.now += MS_DAY;
    expect(makeUp(sim, sim.player)).toEqual(['hair-styling']);
    sim.universe.now += MS_DAY;
    expect(makeUp(sim, sim.player).length).toBe(3);
    expect(sim.execute({ kind: 'hygiene.makeup_every', payload: { every: 'daily', kinds: [] } }).error).toBe('Choose what you wear.');
    sim.must({ kind: 'hygiene.makeup_every', payload: { every: null } });
    expect(sim.player.makeup).toBeUndefined();
  });

  it('buys again what runs out, where a chain here sells it', () => {
    const sim = life('ca-bc-vancouver', 'makeup-buy');
    expect(TOILETRIES.some((t) => t.kind === 'mascara' && t.market === 'CA')).toBe(true);
    sim.must({ kind: 'hygiene.makeup_every', payload: { every: 'daily', kinds: ['mascara'] } });
    expect(itemsOf(sim.player).some((i) => i.supply?.kind === 'mascara')).toBe(false);
    restock(sim, sim.player);
    expect(itemsOf(sim.player).some((i) => i.supply?.kind === 'mascara')).toBe(true);
  });
});
