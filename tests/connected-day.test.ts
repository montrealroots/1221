/**
 * The connected day (the master plan's §62, from 2026-10-02): one day of a
 * life lived through the same commands the screens run, each system reading
 * what the one before it left, and the save taken and loaded in the middle.
 *
 * Wake, shower, change, drive to the shops on what's in the tank, buy the
 * week's food, fill up on the way home, cook for the servings chosen and eat,
 * save and load, eat the leftovers, and be put to bed; the next morning's
 * outfit is what the day put on.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { levelOf } from '@/engine/systems/fueltank';
import { runErrands } from '@/engine/systems/trips';
import { garmentsOf, wearable } from '@/engine/systems/wardrobe';
import { mealsReady } from '@/engine/systems/pantry';

const NY = 'America/New_York';
// The cupboard's first and the fridge's last, so nothing cold is out past USDA's two hours.
const P = {
  potatoes: 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag',
  onions: 'thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag',
  tomatoes: 'thefreshgrocer-bowl-basket-grape-tomatoes-pint',
  yogurt: 'thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz',
  chicken: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts',
};
const RECIPE = 'chicken-and-tomato-jacket-potato';
const at = (h: number, d = 13) => instantFromZoned({ year: 2026, month: 1, day: d, hour: h, minute: 0 }, NY);
const must = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => { const r = sim.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); return r; };

describe('a connected day', () => {
  it('runs wake to bed through the real commands, each reading the last, and survives a save in the middle', () => {
    let sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'connected-day');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const car = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).value!.vehicleId;
    // Morning, with the larder bare and the tank low.
    sim.advanceTo(at(8));
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.food);
    vehiclesOf(sim.player).find((v) => v.id === car)!.fuelLevel = 0.3;
    sim.player.wellbeing.hygiene = 40;

    // The shower: the hygiene back, and its soap and shampoo used.
    must(sim, 'life.look_after', { action: 'wash' });
    expect(sim.player.wellbeing.hygiene).toBeGreaterThan(40);

    // Dressed: a change into clean clothes to hand, each a wear, and what's on now.
    const pick = (slot: string) => garmentsOf(sim.player).find((g) => g.garment.slot === slot && wearable(sim, sim.player, g))!.id;
    const outfit = ['top', 'bottom', 'underwear', 'socks', 'shoes'].map(pick);
    must(sim, 'clothes.change', { itemIds: outfit });
    expect(sim.player.wornNow!.itemIds).toEqual(outfit);

    // To the shops on what's in the tank, a fuel stop on the way back.
    sim.advanceTo(at(10));
    const v = vehiclesOf(sim.player).find((x) => x.id === car)!;
    const run = runErrands(sim, { by: 'car', vehicleId: car, stops: [
      ...Object.values(P).map((productId) => ({ kind: 'food.buy_groceries', payload: { productId, quantity: productId === P.chicken ? 2 : productId === P.tomatoes ? 4 : 1 }, leg: 'shopping' as const })),
      { kind: 'errand.fuel', payload: {}, leg: 'errand' as const },
    ] });
    expect(run, JSON.stringify(run)).toEqual({ done: 6 });
    expect(levelOf(v)).toBeGreaterThan(0.9);
    expect(sim.universe.transactions.some((t) => /^Fuel at /.test(t.memo))).toBe(true);
    expect(sim.universe.notifications.some((n) => n.title === 'Shopping Left Out Too Long')).toBe(false);
    // Home, the shopping is in the car until it's brought in: put away where each keeps, inside USDA's two hours.
    expect(sim.universe.notifications.at(-1)?.title).toBe('The Shopping Is Still Out');
    must(sim, 'items.put_away');

    // Lunch, once home: cooked for two from what was bought, one eaten and one kept.
    sim.advanceTo(Math.max(sim.now, at(14)));
    sim.player.wellbeing.nourishment = 40;
    must(sim, 'food.cook', { recipeId: RECIPE, servings: 2 });
    expect(mealsReady(sim, sim.player).map((m) => m.food.left)).toEqual([1]);

    // Saved and loaded: the tank, what's worn and the leftovers come back as they were.
    const level = levelOf(v);
    sim = loadSave(deserialise(serialise(sim.universe)));
    expect(levelOf(vehiclesOf(sim.player).find((x) => x.id === car)!)).toBe(level);
    expect(sim.player.wornNow!.itemIds).toEqual(outfit);
    expect(mealsReady(sim, sim.player).map((m) => m.food.left)).toEqual([1]);

    // Supper: Look After Yourself eats the leftovers before it spends a cent.
    sim.advanceTo(at(19));
    sim.player.wellbeing.nourishment = 40;
    const meals = sim.universe.transactions.filter((t) => t.memo === 'A meal').length;
    must(sim, 'life.look_after', { action: 'eat' });
    expect(mealsReady(sim, sim.player)).toHaveLength(0);
    expect(sim.universe.transactions.filter((t) => t.memo === 'A meal').length).toBe(meals);

    // Bed, and the next day dresses them in what's to hand and clean.
    sim.advanceTo(at(23));
    must(sim, 'life.sleep', { hours: 8 });
    sim.advanceTo(at(12, 14) + MS_HOUR);
    expect(sim.player.wornNow!.since).toBeGreaterThan(at(23));
  });
});
