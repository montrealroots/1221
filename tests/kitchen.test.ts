/**
 * The kitchen, which was not one.
 *
 * Every recipe in the game named ingredients no shop sold any more, so
 * nothing could be cooked at all: the promise in the contract — "I can
 * actually put recipes together at home" — was false in the plainest way.
 * These hold the fix. The book is real and buyable, a dish needs the kit it
 * really needs, the machine you bought does something the fitted one does
 * not, and what you cooked feeds whoever else is in the house.
 */

import { describe, expect, it } from 'vitest';
import { CATALOG, RECIPES, shoppableItems } from '@/engine/content/catalog';
import { EQUIPMENT, FITTED_KITCHEN, equipmentFrom } from '@/engine/content/kitchen';
import { kitchenOf, missingEquipment, othersAtHome } from '@/engine/systems/life';
import { createAsset } from '@/engine/systems/commerce';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';

function stock(sim: Simulation, catalogId: string, quantity = 4): void {
  const item = CATALOG.require(catalogId);
  sim.universe.pantry[`pantry_${catalogId}`] = {
    id: `pantry_${catalogId}` as Id,
    saveId: sim.universe.meta.id,
    householdId: (sim.player.householdId ?? sim.player.id) as Id,
    propertyId: (sim.player.residenceId ?? sim.player.id) as Id,
    catalogId,
    name: item.name,
    storage: 'pantry',
    quantity,
    unit: item.unit ?? 'Pack',
    unitCost: item.basePrice,
    purchasedAt: sim.now,
    expiresAt: sim.now + 30 * 86_400_000,
  };
}

function stockFor(sim: Simulation, recipeId: string): void {
  for (const ing of RECIPES.require(recipeId).ingredients) stock(sim, ing.catalogId);
}

describe('the recipe book is a book you can cook from', () => {
  it('names only ingredients a shop actually sells', () => {
    const shoppable = new Set(shoppableItems().map((i) => i.id));
    const dead: string[] = [];
    for (const recipe of RECIPES.all()) {
      for (const ing of recipe.ingredients) {
        if (!shoppable.has(ing.catalogId)) dead.push(`${recipe.name} needs ${ing.catalogId}`);
      }
    }
    expect(dead, 'these recipes name things nobody sells').toEqual([]);
    expect(RECIPES.all().length).toBeGreaterThanOrEqual(60);
  });

  it('asks only for kit that exists, and mostly for kit any home has', () => {
    for (const recipe of RECIPES.all()) {
      for (const kind of recipe.equipment) {
        expect(EQUIPMENT as readonly string[], `${recipe.name} asks for ${kind}`).toContain(kind);
      }
    }
    const fittedOnly = RECIPES.all().filter((r) => r.equipment.every((k) => (FITTED_KITCHEN as readonly string[]).includes(k)));
    expect(fittedOnly.length, 'nothing can be cooked in a plain kitchen').toBeGreaterThan(30);
  });

  it('covers the whole day', () => {
    const meals = new Set(RECIPES.all().map((r) => r.meal));
    for (const meal of ['breakfast', 'lunch', 'dinner', 'snack', 'drink']) expect(meals).toContain(meal);
  });

  it('reads a machine by the name the maker put on it', () => {
    expect(equipmentFrom('Vitamix A3500 Ascent Blender', 'appliance')).toContain('blender');
    expect(equipmentFrom('KitchenAid Artisan Stand Mixer', 'appliance')).toContain('mixer');
    expect(equipmentFrom('Wolf Dual Fuel Range', 'appliance')).toEqual(expect.arrayContaining(['hob', 'oven']));
    expect(equipmentFrom('Sub-Zero Classic Side By Side Refrigerator', 'appliance')).toContain('fridge');
    // A sofa is not a kitchen appliance, whatever its name.
    expect(equipmentFrom('Designer Sectional', 'furniture')).toEqual([]);
  });
});

describe('cooking uses the kitchen you actually have', () => {
  it('gives a home its fitted kitchen and nothing more', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'kitchen-fitted');
    const kit = kitchenOf(sim, sim.player.id);
    for (const kind of FITTED_KITCHEN) expect(kit.has(kind), `no ${kind} in a fitted kitchen`).toBe(true);
    expect(kit.has('blender'), 'a flat came with a blender').toBe(false);
  });

  it('refuses a dish you have nothing to cook it with, and says what is missing', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'kitchen-refuse');
    stockFor(sim, 'smoothie');
    const missing = missingEquipment(sim, sim.player.id, 'smoothie');
    expect(missing.length, 'a smoothie needs a blender').toBeGreaterThan(0);
    const refused = sim.execute({ kind: 'life.cook', payload: { recipeId: 'smoothie' } });
    expect(refused.ok).toBe(false);
    expect(String(refused.error)).toContain('Blender');
  });

  it('lets you cook it once you have bought the machine', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'kitchen-buy');
    stockFor(sim, 'smoothie');
    const blender = shoppableItems().find((i) => equipmentFrom(i.name, i.category).includes('blender'));
    expect(blender, 'no blender in the catalog').toBeDefined();
    createAsset(sim, {
      ownerId: sim.player.id, catalogItem: blender!,
      purchasePrice: blender!.basePrice, acquiredVia: 'purchase',
    });
    expect(missingEquipment(sim, sim.player.id, 'smoothie')).toEqual([]);
    const done = sim.execute({ kind: 'life.cook', payload: { recipeId: 'smoothie' } });
    expect(done.ok, String(done.error)).toBe(true);
  });

  it('makes the better machine worth owning', () => {
    const plain = quickSave({ wealth: 'comfortable' }, 'kitchen-plain');
    stockFor(plain, 'roast_chicken');
    const before = plain.player.wellbeing.nourishment;
    const plainResult = plain.execute<{ nourishment: number }>({ kind: 'life.cook', payload: { recipeId: 'roast_chicken' } });
    expect(plainResult.ok, String(plainResult.error)).toBe(true);
    void before;

    const fancy = quickSave({ wealth: 'comfortable' }, 'kitchen-plain');
    stockFor(fancy, 'roast_chicken');
    const oven = shoppableItems()
      .filter((i) => equipmentFrom(i.name, i.category).includes('oven'))
      .sort((a, b) => b.quality - a.quality)[0];
    expect(oven, 'no oven in the catalog').toBeDefined();
    createAsset(fancy, {
      ownerId: fancy.player.id, catalogItem: oven!,
      purchasePrice: oven!.basePrice, acquiredVia: 'purchase',
    });
    const fancyResult = fancy.execute<{ nourishment: number }>({ kind: 'life.cook', payload: { recipeId: 'roast_chicken' } });
    expect(fancyResult.ok, String(fancyResult.error)).toBe(true);
    expect(
      fancyResult.value!.nourishment,
      'a nine thousand dollar oven cooked no better than the one in the flat',
    ).toBeGreaterThan(plainResult.value!.nourishment);
  });

  it('still refuses when the food is not there', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'kitchen-empty');
    const refused = sim.execute({ kind: 'life.cook', payload: { recipeId: 'roast_chicken' } });
    expect(refused.ok).toBe(false);
    expect(String(refused.error)).toMatch(/missing/i);
  });
});

describe('what you cooked feeds whoever is there', () => {
  it('feeds somebody else in the house and they remember it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'kitchen-feed');
    stockFor(sim, 'beef_ragu');

    // Somebody else living at the same address.
    const other = Object.values(sim.universe.people).find((p) => p.id !== sim.player.id);
    expect(other, 'nobody else in the world').toBeDefined();
    other!.residenceId = sim.player.residenceId;
    other!.wellbeing.nourishment = 20;

    const result = sim.execute<{ fed: Id[] }>({
      kind: 'life.cook',
      payload: { recipeId: 'beef_ragu', forPeopleIds: [other!.id] },
    });
    expect(result.ok, String(result.error)).toBe(true);
    expect(result.value!.fed, 'nobody else got any').toContain(other!.id);
    expect(other!.wellbeing.nourishment, 'they were not fed').toBeGreaterThan(20);
    const facts = other!.facts ?? [];
    expect(facts.some((f) => /cooked/i.test(f.text)), 'they do not remember being cooked for').toBe(true);
  });

  it('never feeds more people than the dish serves', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'kitchen-servings');
    stockFor(sim, 'omelette');
    const guests = Object.values(sim.universe.people).filter((p) => p.id !== sim.player.id).slice(0, 5);
    for (const guest of guests) guest.residenceId = sim.player.residenceId;
    const result = sim.execute<{ fed: Id[]; servings: number }>({
      kind: 'life.cook', payload: { recipeId: 'omelette' },
    });
    expect(result.ok, String(result.error)).toBe(true);
    // An omelette serves one. There is nothing left for anybody else.
    expect(result.value!.fed.length).toBeLessThanOrEqual(result.value!.servings - 1);
  });

  it('knows who is at home to be fed', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'kitchen-home');
    const before = othersAtHome(sim, sim.player.id).length;
    const other = Object.values(sim.universe.people).find((p) => p.id !== sim.player.id)!;
    other.residenceId = sim.player.residenceId;
    expect(othersAtHome(sim, sim.player.id).length).toBe(before + 1);
  });
});
