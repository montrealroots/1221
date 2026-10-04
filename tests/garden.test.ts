/**
 * A garden bed and a greenhouse grown in, an outdoor kitchen cooked in
 * (`systems/garden.ts`, `content/garden.ts`, from 2026-10-04): planted in the
 * town's frost-free months only where it would ripen before the first frost,
 * a greenhouse at any time; picked into the kitchen as the food it is, at its
 * yield for the plot; taken by the frost if left; and cooking outside only
 * with the kitchen built and the weather fit.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import type { Feature, Fixtures } from '@/engine/content/homes';
import { CROPS, PLOT_M2 } from '@/engine/content/garden';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { plantRefusal, plantingIn, ripeAt, yieldOf } from '@/engine/systems/garden';
import { stockOf } from '@/engine/systems/pantry';

const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'yard', gym: 'none' } as Fixtures;
const NY = 'us-ny-newyork';
const home = (features: Feature[], seed: string) => {
  const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 1_800, built: 2000, features: ['yard', ...features], parts: {}, hoaUsd: 0, fixtures: bare, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: NY, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = NY;
  return sim;
};
const on = (sim: ReturnType<typeof home>, month: number, day: number) => sim.advanceTo(Math.max(sim.now + 60_000, instantFromZoned({ year: 2026, month, day, hour: 10 }, 'America/New_York')));

describe('a garden bed', () => {
  it('is planted in the frost-free months, only where it ripens before the first frost', () => {
    const sim = home(['gardenBed'], 'bed-season');
    on(sim, 1, 20);
    expect(plantRefusal(sim, sim.player, 'bed', 'tomato')).toBe('It’s out of the frost-free months.');
    on(sim, 10, 1);
    expect(plantRefusal(sim, sim.player, 'bed', 'tomato')).toMatch(/^It wouldn’t ripen before the first frost/);
    const none = home([], 'bed-none');
    expect(plantRefusal(none, none.player, 'bed', 'tomato')).toBe('You have no garden bed.');
  });

  it('ripens in its days and is picked into the kitchen as the food it is, at its yield for the bed', () => {
    const sim = home(['gardenBed'], 'bed-grow');
    on(sim, 5, 1);
    const r = sim.must<{ ripeAt: number }>({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'tomato' } });
    expect(r.ripeAt).toBe(ripeAt(plantingIn(sim.player, 'bed')!));
    expect(sim.execute({ kind: 'garden.harvest', payload: { plot: 'bed' } }).error).toMatch(/^It’s ripe about/);
    sim.advanceTo(r.ripeAt + MS_DAY);
    const before = stockOf(sim, sim.player, 'tomato').reduce((n, i) => n + i.food.left, 0);
    const h = sim.must<{ food: string; amount: number }>({ kind: 'garden.harvest', payload: { plot: 'bed' } });
    expect(h).toEqual({ food: 'tomato', amount: Math.round(CROPS.tomato.kgPerM2 * PLOT_M2.bed * 1000) });
    expect(stockOf(sim, sim.player, 'tomato').reduce((n, i) => n + i.food.left, 0) - before).toBe(h.amount);
    expect(plantingIn(sim.player, 'bed')).toBeUndefined();
    expect(yieldOf('bed', 'lettuce')).toBe(Math.round((CROPS.lettuce.kgPerM2 * PLOT_M2.bed * 1000) / 227));
  });

  it('left outdoors past the first frost, the frost takes it; a greenhouse grows in January', () => {
    const sim = home(['gardenBed', 'greenhouse'], 'bed-frost');
    on(sim, 8, 1);
    sim.must({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'lettuce' } });
    sim.advanceTo(instantFromZoned({ year: 2026, month: 11, day: 25, hour: 10 }, 'America/New_York'));
    expect(plantingIn(sim.player, 'bed')).toBeUndefined();
    expect(sim.universe.notifications.some((n) => n.title === 'The Frost Took It')).toBe(true);
    on(sim, 12, 1);
    sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 10, hour: 10 }, 'America/New_York'));
    expect(plantRefusal(sim, sim.player, 'greenhouse', 'pepper')).toBeUndefined();
  });
});

describe('an outdoor kitchen', () => {
  it('is cooked in only where it’s built', () => {
    const sim = home([], 'ok-none');
    sim.player.wellbeing.nourishment = 30;
    expect(sim.execute({ kind: 'food.cook', payload: { recipeId: 'easy-overnight-oats', outside: true } }).error).toBe('You have no outdoor kitchen.');
    // Built, a wet hour refuses it as sitting out would.
    const built = home(['outdoorKitchen'], 'ok-built');
    const r = built.execute({ kind: 'food.cook', payload: { recipeId: 'easy-overnight-oats', outside: true } });
    expect(r.error).not.toBe('You have no outdoor kitchen.');
  });
});
