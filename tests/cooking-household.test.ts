/**
 * Cooking's time and company (`systems/kitchen.ts` and `systems/hosting.ts`,
 * from 2026-10-03): a recipe that would run into something due isn't
 * started; a partner at home eats with you; a dinner for friends is cooked
 * from a recipe where the kitchen has it for everyone.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { HALL } from '@/engine/content/people';
import { cookingClash, dinersOf, recipeById } from '@/engine/systems/kitchen';
import { MONTH_MEALS, childrenOf, raisingMonth } from '@/engine/systems/children';
import { CHILD_FOOD_SHARE } from '@/engine/content/children';
import { billShare } from '@/engine/systems/marriage';
import { STAY_DAY_KIND } from '@/engine/systems/houseguests';
import { foodOf as householdFoodOf } from '@/engine/systems/household';
import { livingIn, moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { lodgersIn } from '@/engine/systems/lodgers';
import { HOST_KIND } from '@/engine/systems/hosting';
import { foodOf } from '@/engine/systems/pantry';
import { contactsOf, newContact } from '@/engine/systems/people';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const buy = (sim: Simulation, productId: string, quantity = 1) => sim.must({ kind: 'food.buy_groceries', payload: { productId, quantity } });
const P = {
  potatoes: 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag',
  chicken: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts',
  tomatoes: 'thefreshgrocer-bowl-basket-grape-tomatoes-pint',
  yogurt: 'thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz',
  onions: 'thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag',
};
const RECIPE = 'chicken-and-tomato-jacket-potato';
const stockUp = (sim: Simulation) => { buy(sim, P.potatoes); buy(sim, P.chicken, 2); buy(sim, P.tomatoes, 4); buy(sim, P.yogurt); buy(sim, P.onions); };
const friend = (sim: Simulation, seed: string) => { const c = newContact(sim, sim.player, sim.player.home!.cityId, seed, { at: sim.now, how: 'school' }); c.hours = HALL.friend; contactsOf(sim.player).push(c); return c; };
const evening = (sim: Simulation) => { const p = zonedParts(sim.now + 2 * MS_DAY, 'America/New_York'); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 19, minute: 0 }, 'America/New_York'); };
const dishes = (sim: Simulation) => foodOf(sim.player).filter((i) => i.food.key === 'dish').reduce((n, i) => n + i.food.left, 0);

describe('cooking', () => {
  it('isn’t started when it would run into something due', () => {
    const sim = life('us-ny-newyork', 'cook-clash');
    stockUp(sim);
    sim.schedule({ at: sim.now + 10 * 60_000, kind: HOST_KIND, label: 'A Fitting', category: 'work', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: 'nobody' } });
    expect(cookingClash(sim, RECIPE)).toMatch(/^A Fitting is at .+, and there isn’t time to cook it\.$/);
    expect(sim.execute({ kind: 'food.cook', payload: { recipeId: RECIPE } }).error).toMatch(/A Fitting/);
  });

  it('feeds a partner living with you a serving, the meal’s time counting to the two of you', () => {
    const sim = life('us-ny-newyork', 'cook-partner');
    stockUp(sim);
    const partner = friend(sim, 'partner');
    partner.livesWith = sim.now;
    const hours = partner.hours;
    const r = sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: RECIPE } });
    expect(r.left).toBe(recipeById(RECIPE)!.servings - 2);
    expect(partner.hours).toBeCloseTo(hours + (recipeById(RECIPE)!.minutes ?? 30) / 60, 9);
  });
});

describe('whom a meal serves', () => {
  const YEAR = 365.2425 * MS_DAY;

  it('is chosen: the partner left out, a child served, its meal out of the USDA’s 18% food share of its raising', () => {
    const sim = life('us-ny-newyork', 'serve-child');
    stockUp(sim);
    const partner = friend(sim, 'serve-partner');
    partner.livesWith = sim.now;
    childrenOf(sim.player).push({ id: 'kid', name: 'Kid Doe', born: sim.now - 6 * YEAR }, { id: 'baby', name: 'Baby Doe', born: sim.now - 0.5 * YEAR });
    const ids = dinersOf(sim, sim.player).map((d) => d.id);
    expect(ids).toContain(partner.id);
    expect(ids).toContain('kid');
    // Under one, SLATE's estimate, a baby isn't served a dish.
    expect(ids).not.toContain('baby');
    expect(sim.execute({ kind: 'food.cook', payload: { recipeId: RECIPE, servings: 1, serve: ['kid'] } }).error).toBe('That takes 2 servings, one for you.');
    expect(sim.execute({ kind: 'food.cook', payload: { recipeId: RECIPE, serve: ['lodger:0'] } }).error).toBe('They aren’t here to eat.');
    const before = raisingMonth(sim, sim.player, sim.now);
    const r = sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: RECIPE, serve: ['kid'] } });
    // The partner, not chosen, isn't served.
    expect(r.left).toBe(recipeById(RECIPE)!.servings - 2);
    expect(childrenOf(sim.player)[0]!.served).toBe(1);
    // Two children's months, the six-year-old's and the baby's, the same a year.
    const month = before / billShare(sim, sim.player) / 2;
    expect(before - raisingMonth(sim, sim.player, sim.now)).toBeCloseTo(month * CHILD_FOOD_SHARE.us! / MONTH_MEALS * billShare(sim, sim.player), 0);
  });

  it('serves no child in London, where no food share of raising one is published', () => {
    const sim = life('uk-eng-london', 'serve-ldn');
    childrenOf(sim.player).push({ id: 'kid', name: 'Kid Doe', born: sim.now - 6 * YEAR });
    expect(dinersOf(sim, sim.player).some((d) => d.who === 'child')).toBe(false);
  });

  it('takes a third off a staying friend’s day of food for each meal served them', () => {
    const sim = life('us-ny-newyork', 'serve-guest');
    stockUp(sim);
    const g = friend(sim, 'serve-guest-f');
    g.stay = { from: sim.now - 60_000, nights: 3, roomId: 'guest' };
    sim.must({ kind: 'food.cook', payload: { recipeId: RECIPE, serve: [g.id] } });
    expect(g.stay.served).toBe(1);
    const day = householdFoodOf(sim, sim.player);
    sim.schedule({ at: sim.now + 60_000, kind: STAY_DAY_KIND, label: 'Staying', category: 'relationship', payload: { personId: sim.player.id, contactId: g.id, day: 1 } });
    sim.advanceTo(sim.now + 120_000);
    const paid = sim.universe.transactions.filter((t) => t.memo.startsWith('Food for ')).at(-1)!;
    expect(Math.abs(paid.postings[0]!.amount)).toBe(Math.round(day * 2 / 3));
    expect(g.stay?.served).toBeUndefined();
  });

  it('serves a lodger in the home you own a serving of it', () => {
    const sim = life('us-ny-newyork', 'serve-lodger');
    const facts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 1_800, built: 2000, features: ['yard'], parts: {}, hoaUsd: 0, fixtures: { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'central', outdoor: 'yard', gym: 'none' }, lot: 12_000 } as unknown as HomeFacts;
    moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts, price: 900_000_00, closing: 0 }));
    sim.player.currentLocationId = 'us-ny-newyork';
    stockUp(sim);
    lodgersIn(livingIn(sim.player)!).push({ since: sim.now });
    expect(dinersOf(sim, sim.player).map((d) => d.id)).toContain('lodger:0');
    expect(sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: RECIPE, serve: ['lodger:0'] } }).left).toBe(recipeById(RECIPE)!.servings - 2);
  });
});

describe('a dinner at yours', () => {
  it('is cooked from the recipe chosen, out of the kitchen, and no meal’s money spent', () => {
    const sim = life('us-ny-newyork', 'host-cook');
    stockUp(sim);
    const a = friend(sim, 'host-a');
    // Tonight, before raw chicken's day or two in the fridge (FoodKeeper) is out.
    const p = zonedParts(sim.now, 'America/New_York');
    const seven = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 19, minute: 0 }, 'America/New_York');
    const at = seven > sim.now ? seven : seven + MS_DAY;
    const chicken = () => foodOf(sim.player).filter((i) => i.food.key === 'chicken').reduce((n, i) => n + i.food.left, 0);
    const before = chicken();
    const r = sim.must<{ coming: string[] }>({ kind: 'social.host', payload: { contactIds: [a.id], at, what: 'dinner', recipeId: RECIPE } });
    expect(r.coming).toEqual([a.id]);
    sim.advanceTo(at + 3 * 60 * 60_000);
    expect(chicken()).toBeLessThan(before);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Dinner at home for'))).toBe(false);
    expect(a.memory.some((m) => m.what.includes(recipeById(RECIPE)!.name))).toBe(true);
    expect(dishes(sim)).toBeGreaterThanOrEqual(0);
  });

  it('is bought at a meal’s price when the kitchen hasn’t the recipe on the night', () => {
    const sim = life('us-ny-newyork', 'host-nocook');
    const a = friend(sim, 'host-b');
    const at = evening(sim);
    sim.must({ kind: 'social.host', payload: { contactIds: [a.id], at, what: 'dinner', recipeId: RECIPE } });
    sim.advanceTo(at + 3 * 60 * 60_000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Dinner at home for 2')).toBe(true);
    expect(sim.execute({ kind: 'social.host', payload: { contactIds: [a.id], at: at + MS_DAY, what: 'dinner', recipeId: 'no-such' } }).error).toBe('No such recipe.');
  });
});
