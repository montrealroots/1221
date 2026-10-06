/**
 * A complete day at home (the owner's audit of 2026-10-06, §5), the steps the
 * connected day doesn't take: a shower of a chosen length, its soap and water
 * used by the minute and a towel taken; dressed from what's to hand; out on
 * foot to the shops for a recipe's groceries and back; cooked from what was
 * bought and eaten; the dishes done the home's own way; unwound; asleep; and
 * saved and loaded midway, every law of the world holding.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { livingOf } from '@/engine/systems/dwelling';
import { garmentsOf, wearable } from '@/engine/systems/wardrobe';
import { itemsOf } from '@/engine/systems/items';
import { runErrands } from '@/engine/systems/trips';
import { SHOWER_AROUND } from '@/engine/systems/life';
import { SHOWER_MINUTES } from '@/engine/systems/water';

const NY = 'America/New_York';
const at = (h: number, d = 13) => instantFromZoned({ year: 2026, month: 1, day: d, hour: h, minute: 0 }, NY);
const must = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => { const r = sim.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); return r; };
const left = (sim: Simulation, kind: string) => itemsOf(sim.player).filter((i) => i.supply?.kind === kind).reduce((n, i) => n + (i.supply?.left ?? 0), 0);
const towelWears = (sim: Simulation) => garmentsOf(sim.player).filter((g) => g.garment.slot === 'towel').reduce((n, g) => n + g.garment.wears, 0);

describe('a complete day at home', () => {
  it('showers for the minutes chosen, dresses, walks to the shops, cooks, eats, does the dishes the home’s way, unwinds and sleeps', () => {
    let sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'day-at-home');
    sim.advanceTo(at(7));
    sim.player.wellbeing.hygiene = 30;

    // A twelve-minute shower: twelve minutes under the water and the drying around it, its soap and shampoo, a towel's wear,
    // and twelve minutes' share of New York's average shower toward the month's water.
    const soap = left(sim, 'body-wash') + left(sim, 'bar-soap');
    const towels = towelWears(sim);
    const showers = livingOf(sim.player).showers ?? 0;
    const t0 = sim.now;
    must(sim, 'life.look_after', { action: 'wash', minutes: 12 });
    expect(sim.now - t0).toBeGreaterThanOrEqual((SHOWER_AROUND + 12) * 60_000);
    expect(sim.player.wellbeing.hygiene).toBeGreaterThan(30);
    expect(left(sim, 'body-wash') + left(sim, 'bar-soap')).toBeLessThan(soap);
    expect(towelWears(sim)).toBe(towels + 1);
    expect((livingOf(sim.player).showers ?? 0) - showers).toBeCloseTo(12 / SHOWER_MINUTES.us!, 9);

    // Dressed from what's to hand and clean.
    const pick = (slot: string) => garmentsOf(sim.player).find((g) => g.garment.slot === slot && wearable(sim, sim.player, g))!.id;
    const outfit = ['top', 'bottom', 'underwear', 'socks', 'shoes'].map(pick);
    must(sim, 'clothes.change', { itemIds: outfit });

    // Out on foot to the shops and back, with a recipe's groceries.
    sim.advanceTo(at(10));
    const home = sim.player.currentLocationId;
    const food = itemsOf(sim.player).filter((i) => i.food).length;
    const run = runErrands(sim, { by: 'foot', stops: [
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag', quantity: 1 }, leg: 'shopping' },
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts', quantity: 1 }, leg: 'shopping' },
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-bowl-basket-grape-tomatoes-pint', quantity: 2 }, leg: 'shopping' },
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz', quantity: 1 }, leg: 'shopping' },
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag', quantity: 1 }, leg: 'shopping' },
    ] });
    expect(run, JSON.stringify(run)).toEqual({ done: 5 });
    expect(sim.player.currentLocationId).toBe(home);
    must(sim, 'items.put_away');
    expect(itemsOf(sim.player).filter((i) => i.food).length).toBeGreaterThan(food);

    // Saved and loaded midway: what was bought and what's worn come back as they were.
    const bought = itemsOf(sim.player).filter((i) => i.food).length;
    sim = loadSave(deserialise(serialise(sim.universe)));
    expect(itemsOf(sim.player).filter((i) => i.food).length).toBe(bought);
    expect(sim.player.wornNow!.itemIds).toEqual(outfit);

    // Cooked from what was bought, and eaten.
    sim.advanceTo(at(13));
    sim.player.wellbeing.nourishment = 40;
    must(sim, 'food.cook', { recipeId: 'chicken-and-tomato-jacket-potato', servings: 1 });
    expect(itemsOf(sim.player).filter((i) => i.food).length).toBeLessThan(bought + 1);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(40);

    // Unwound at home: the stress comes down.
    sim.advanceTo(at(19));
    sim.player.wellbeing.stress = 60;
    must(sim, 'life.look_after', { action: 'unwind' });
    expect(sim.player.wellbeing.stress).toBeLessThan(60);

    // Asleep, and the next day's dishes done the home's own way: the dishwasher where it has one, the sink by hand where not.
    sim.advanceTo(at(23));
    must(sim, 'life.sleep', { hours: 8 });
    sim.advanceTo(at(9, 14));
    const l = livingOf(sim.player);
    if ((l.dishes ?? 0) > 0) {
      must(sim, 'life.look_after', { action: 'washup' });
      expect(livingOf(sim.player).dishes ?? 0).toBe(0);
    } else expect(l.loads?.dishwasher ?? 0).toBeGreaterThan(0);
    expect(sim.player.wellbeing.energy).toBeGreaterThan(0);
    expect(sim.now).toBeGreaterThan(at(23) + 8 * MS_HOUR - 1);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});
