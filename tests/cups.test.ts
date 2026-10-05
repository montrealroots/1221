/**
 * A cup of something at home (`cupOf` and `drinkAtHome` in
 * `systems/kitchen.ts`, from 2026-10-05): the coffee, tea, juice and water the
 * grocers sell, used a cup at a time by published measures, until none is
 * left to make one.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CUP, CUP_ML, cupOf } from '@/engine/systems/kitchen';
import { homeKeyOf, itemsOf } from '@/engine/systems/items';

const life = () => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'cups');
const stock = (sim: ReturnType<typeof life>, id: string, label: string, key: string, unit: 'g' | 'ml' | 'ct', left: number) => {
  const item = { id, kind: id, label, quantity: 1, condition: 1, at: { kind: 'home' as const, home: homeKeyOf(sim.player.home)!, spot: 'pantry' as const }, acquiredAt: sim.now, food: { key, unit, left } };
  sim.player.items = [...(sim.player.items ?? []), item as never];
  return item;
};

describe('a cup at home', () => {
  it('takes each its published measure: ground coffee’s 55 g a liter, instant’s 1.8 g a 200 ml cup, a tea bag, tea by weight at ISO 3103, juice and water a cup', () => {
    const sim = life();
    const ground = stock(sim, 'g', 'Folgers Ground Medium Classic Roast Coffee', 'coffee', 'g', 1142);
    const instant = stock(sim, 'i', 'Tesco Classic Instant Coffee 200g', 'coffee', 'g', 200);
    const bags = stock(sim, 'b', 'Lipton Yellow Label Black Tea Bags', 'tea', 'ct', 100);
    const loose = stock(sim, 'l', 'Red Label Tea 500g', 'tea', 'g', 500);
    const juice = stock(sim, 'j', 'Tropicana Orange Juice', 'juice', 'ml', 1360);
    expect(cupOf(ground as never)).toBeCloseTo(CUP_ML * 0.055, 9);
    expect(cupOf(instant as never)).toBeCloseTo(CUP_ML * (1.8 / 200), 9);
    expect(cupOf(bags as never)).toBe(1);
    expect(cupOf(loose as never)).toBeCloseTo(CUP_ML * CUP.teaGPerMl, 9);
    for (const [item, before] of [[ground, 1142], [instant, 200], [bags, 100], [loose, 500], [juice, 1360]] as const) {
      expect(sim.must<{ ml: number }>({ kind: 'food.drink_home', payload: { itemId: item.id } }).ml).toBe(CUP_ML);
      expect(before - item.food.left).toBeCloseTo(cupOf(item as never)!, 9);
    }
  });

  it('runs out a cup at a time, and oranges by weight aren’t a drink', () => {
    const sim = life();
    const water = stock(sim, 'w', 'Spring Water', 'water', 'ml', 300);
    sim.must({ kind: 'food.drink_home', payload: { itemId: water.id } });
    expect(sim.execute({ kind: 'food.drink_home', payload: { itemId: water.id } }).error).toBe('There isn’t a cup’s worth left.');
    const last = stock(sim, 'w2', 'Spring Water', 'water', 'ml', CUP_ML);
    sim.must({ kind: 'food.drink_home', payload: { itemId: last.id } });
    expect(itemsOf(sim.player).some((i) => i.id === last.id)).toBe(false);
    const oranges = stock(sim, 'o', 'Naranja de Jugo por Kg', 'juice', 'g', 1000);
    expect(cupOf(oranges as never)).toBeUndefined();
    expect(sim.execute({ kind: 'food.drink_home', payload: { itemId: oranges.id } }).error).toBe('That isn’t a drink here.');
  });
});

describe('a drink of its own strength', () => {
  it('raises the blood alcohol by its label’s ABV where read, the glass’s 12% where not', () => {
    const glass = (abv?: number) => {
      const sim = life();
      sim.player.alcohol = undefined;
      const wine = stock(sim, 'v', 'Barefoot Cabernet Sauvignon', 'wine', 'ml', 750);
      if (abv !== undefined) (wine.food as { abv?: number }).abv = abv;
      sim.must({ kind: 'food.drink_home', payload: { itemId: wine.id } });
      return sim.player.alcohol!.peak;
    };
    const standard = glass();
    expect(glass(0.12)).toBeCloseTo(standard, 9);
    expect(glass(0.18) / standard).toBeCloseTo(0.18 / 0.12, 6);
  });
});
