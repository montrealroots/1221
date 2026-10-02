/**
 * Eating out at real restaurants (`systems/dining.ts`, `content/dining.ts`,
 * `food.dine` in `systems/life.ts`, from 2026-10-01): the menu's price, the
 * town's tax on a meal, the custom's tip at a table and none at a counter,
 * a delivery's app fees, a price not known never charged as nothing, and
 * the meal eaten.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { diningQuote, diningRefusal, mealTaxRate, menuCatalog, restaurantById } from '@/engine/systems/dining';
import { arrange } from '@/engine/systems/catalog';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const katz = restaurantById('katzs-delicatessen-newyork')!;

describe('a meal out', () => {
  it('is the menu’s price with the town’s tax on a meal, and the custom’s tip at a table', () => {
    const sim = life('us-ny-newyork', 'dine-ny');
    const q = diningQuote(sim, katz, ['Katz\'s Pastrami'], 'in')!;
    expect(q.food).toBe(30.95);
    expect(q.tax).toBeCloseTo(30.95 * 0.08875, 2);
    expect(q.tip).toBeCloseTo(30.95 * 0.175, 2);
    expect(q.total).toBe(Math.round((30.95 * (1 + 0.08875 + 0.175)) * 100));
    // Delivered, America's delivery tip, 12.5%.
    expect(diningQuote(sim, restaurantById('shake-shack-madison-ave-newyork')!, ['ShackBurger'], 'delivery')!.tip).toBeCloseTo(10.39 * 0.125, 2);
    // Taken away, no tip.
    expect(diningQuote(sim, katz, ['Katz\'s Pastrami'], 'takeout')!.tip).toBe(0);
    // At a counter nobody tips.
    const greggs = restaurantById('greggs-eastcheap-london')!;
    expect(diningQuote(sim, greggs, ['Sausage Roll'], 'in')!.tip).toBe(0);
  });

  it('is taxed as each place taxes a restaurant meal', () => {
    const sim = life('us-ny-newyork', 'dine-tax');
    expect(mealTaxRate('us-ct-newhaven', sim.now, restaurantById('frank-pepe-pizzeria-wooster-newhaven')!)).toBe(0.0735);
    expect(mealTaxRate('ca-bc-vancouver', sim.now, restaurantById('aw-granville-nelson-vancouver')!)).toBe(0.05);
    expect(mealTaxRate('uk-eng-london', sim.now, restaurantById('greggs-eastcheap-london')!)).toBe(0);
    expect(mealTaxRate('us-ny-newyork', sim.now, katz)).toBe(0.08875);
  });

  it('delivered, carries the app’s fees: Uber Eats’ 12% in London between its floor and cap, and a small order’s', () => {
    const sim = life('uk-eng-london', 'dine-ldn');
    const greggs = restaurantById('greggs-eastcheap-london')!;
    const one = diningQuote(sim, greggs, ['Sausage Roll'], 'delivery')!;
    // £2.50 delivery (an estimate), the service fee's 99p floor, and 99p under £10.
    expect(one.fees).toBeCloseTo(2.5 + 0.99 + 0.99, 2);
    expect(one.estimated).toBe(true);
    expect(one.minutes).toBe(55);
  });

  it('isn’t sold where the price isn’t known, nor in another town, nor delivered where the place doesn’t', () => {
    const sim = life('us-ct-newhaven', 'dine-no');
    const louis = restaurantById('louis-lunch-newhaven')!;
    expect(diningQuote(sim, louis, ['The Original Burger'], 'in')).toBeUndefined();
    expect(diningRefusal(sim, sim.player, louis.id, ['The Original Burger'], 'in')).toMatch(/doesn’t know the price/);
    expect(diningRefusal(sim, sim.player, katz.id, ['Frankfurter'], 'in')).toMatch(/another town/);
    const ny = life('us-ny-newyork', 'dine-nodel');
    expect(diningRefusal(ny, ny.player, katz.id, ['Frankfurter'], 'delivery')).toMatch(/doesn’t deliver/);
    expect(diningRefusal(ny, ny.player, katz.id, [], 'in')).toBe('Choose something from the menu.');
    expect(diningRefusal(ny, ny.player, katz.id, ['A Whole Cow'], 'in')).toBe('That isn’t on its menu.');
    // A catalog lists the unknown price last, never as nothing.
    const list = arrange(menuCatalog(sim, 'us-ct-newhaven'));
    expect(list.at(-1)!.price).toBeNull();
  });

  it('is paid, takes its time, and feeds them', () => {
    const sim = life('us-ny-newyork', 'dine-eat');
    sim.player.wellbeing.nourishment = 40;
    const before = bank(sim);
    const start = sim.now;
    const r = sim.must<{ paid: number }>({ kind: 'food.dine', payload: { restaurantId: katz.id, items: ['Katz\'s Pastrami', 'Matzo Ball Soup'], how: 'in' } });
    expect(before - bank(sim)).toBe(r.paid);
    expect(sim.now - start).toBe(50 * 60_000);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(40);
    sim.player.wellbeing.nourishment = 95;
    expect(sim.execute({ kind: 'food.dine', payload: { restaurantId: katz.id, items: ['Frankfurter'], how: 'in' } }).error).toBe('You aren’t hungry.');
  });
});
