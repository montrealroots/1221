/**
 * The connected day (the master plan's §62, from 2026-10-02): one day of a
 * life lived through the same commands the screens run, each system reading
 * what the one before it left, and the save taken and loaded in the middle.
 *
 * Wake, shower, change, drive to the shops on what's in the tank, buy the
 * week's food, fill up on the way home, cook for the servings chosen and eat,
 * save and load, eat the leftovers, and be put to bed; the next morning's
 * outfit is what the day put on. From 2026-10-06 the shower's towel and
 * products are checked, a late-afternoon run makes them hungry for supper, and the
 * next day washes up the night's dishes by hand (§33i); until then the
 * hygiene, the hunger, the tank and the larder were set by hand. From later
 * on 2026-10-06 a second save is taken midway through the morning, before
 * the shops; until then the only one was after lunch.
 */
import { describe, expect, it } from 'vitest';
import { breaches } from '@/engine/core/invariants';
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
import { USE, suppliesOf } from '@/engine/systems/hygiene';
import { WASH_UP, livingOf } from '@/engine/systems/dwelling';
import { faultsOf, machinesDay } from '@/engine/systems/appliancefaults';

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
    // Morning, with the larder bare and the tank down from the week's driving. Until 2026-10-06 the test set all three
    // (the food thrown out, the tank to 0.3, hygiene to 40); a life starts with no food, a week's everyday driving
    // leaves the tank part empty, and a night's sleep leaves them short of clean, so now the day plays to each.
    sim.advanceTo(at(8));
    expect((sim.player.items ?? []).filter((i) => i.food)).toEqual([]);
    expect(levelOf(vehiclesOf(sim.player).find((v) => v.id === car)!)).toBeLessThan(0.9);

    // The shower: the hygiene back, one of their towels a use toward its wash, and its body wash and shampoo used.
    const hygiene = sim.player.wellbeing.hygiene!;
    const towelWears = () => garmentsOf(sim.player).filter((g) => g.garment.slot === 'towel').reduce((n, g) => n + g.garment.wears, 0);
    const left = (kind: string) => suppliesOf(sim.player).filter((s) => s.supply.kind === kind).reduce((n, s) => n + s.supply.left, 0);
    const [wears, bodyWash, shampoo] = [towelWears(), left('body-wash'), left('shampoo')];
    must(sim, 'life.look_after', { action: 'wash' });
    expect(sim.player.wellbeing.hygiene).toBeGreaterThan(hygiene);
    expect(towelWears()).toBe(wears + 1);
    expect(bodyWash - left('body-wash')).toBeCloseTo(USE.bodyWashG, 6);
    expect(shampoo - left('shampoo')).toBeCloseTo(USE.shampooG, 6);

    // Dressed: a change into clean clothes to hand, each a wear, and what's on now.
    const pick = (slot: string) => garmentsOf(sim.player).find((g) => g.garment.slot === slot && wearable(sim, sim.player, g))!.id;
    const outfit = ['top', 'bottom', 'underwear', 'socks', 'shoes'].map(pick);
    must(sim, 'clothes.change', { itemIds: outfit });
    expect(sim.player.wornNow!.itemIds).toEqual(outfit);

    // Saved and loaded midway through the morning, showered and dressed and not yet out (from 2026-10-06; until then
    // the only save was after lunch): the hygiene, the towel's use, the supplies and what's worn come back as they were.
    sim.advanceTo(at(9));
    const morning = { hygiene: sim.player.wellbeing.hygiene, towel: towelWears(), bodyWash: left('body-wash'), tx: sim.universe.transactions.length };
    sim = loadSave(deserialise(serialise(sim.universe)));
    expect({ hygiene: sim.player.wellbeing.hygiene, towel: towelWears(), bodyWash: left('body-wash'), tx: sim.universe.transactions.length }).toEqual(morning);
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
    must(sim, 'food.cook', { recipeId: RECIPE, servings: 2 });
    expect(mealsReady(sim, sim.player).map((m) => m.food.left)).toEqual([1]);

    // Saved and loaded: the tank, what's worn and the leftovers come back as they were.
    const level = levelOf(v);
    sim = loadSave(deserialise(serialise(sim.universe)));
    expect(levelOf(vehiclesOf(sim.player).find((x) => x.id === car)!)).toBe(level);
    expect(sim.player.wornNow!.itemIds).toEqual(outfit);
    expect(mealsReady(sim, sim.player).map((m) => m.food.left)).toEqual([1]);

    // Supper: Look After Yourself eats the leftovers before it spends a cent.
    // A run in the late afternoon works up the appetite lunch left them without (until 2026-10-06, set to 40 by hand).
    sim.advanceTo(at(17));
    must(sim, 'life.look_after', { action: 'exercise' });
    sim.advanceTo(at(20));
    expect(sim.player.wellbeing.nourishment).toBeLessThan(90);
    const meals = sim.universe.transactions.filter((t) => t.memo === 'A meal').length;
    must(sim, 'life.look_after', { action: 'eat' });
    expect(mealsReady(sim, sim.player)).toHaveLength(0);
    expect(sim.universe.transactions.filter((t) => t.memo === 'A meal').length).toBe(meals);

    // The machines break in the evening, the dishwasher with them, so tonight the dishes go in the sink. Kept by hand:
    // no command breaks a machine, and a box of tablets lasts past a day, so the day's own fault roll is made with its
    // odds at one, as the faults' own tests do (`machinesDay`). The landlord's technician comes in the morning.
    sim.advanceTo(at(22));
    machinesDay(sim, sim.player, 1);
    expect(faultsOf(sim.player).dishwasher).toBeDefined();

    // Bed, and the next day dresses them in what's to hand and clean.
    sim.advanceTo(at(23));
    must(sim, 'life.sleep', { hours: 8 });
    sim.advanceTo(at(12, 14) + MS_HOUR);
    expect(sim.player.wornNow!.since).toBeGreaterThan(at(23));

    // The wash-up (§33i, from 2026-10-06): the night's dishes in the sink, washed by hand with a sinkful of dish soap.
    expect(livingOf(sim.player).dishes).toBe(1);
    const soap = left('dish-soap');
    const before = sim.now;
    must(sim, 'life.look_after', { action: 'washup' });
    expect(livingOf(sim.player).dishes).toBeUndefined();
    expect(soap - left('dish-soap')).toBeGreaterThan(0);
    expect(sim.now - before).toBe(Math.round(WASH_UP.minutesADay) * 60_000);
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});
