/**
 * Cooking stopped partway, the master plan's §33e (`systems/kitchen.ts`, from
 * 2026-10-06): a power cut at home or something that stops the clock for them
 * stops a recipe where it is, the food left part-done, finished later for the
 * minutes left, or thrown away past USDA's two hours. Until then cooking was
 * one stretch of the clock and nothing stopped it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { cookRefusal, cookingLeft, resumeRefusal } from '@/engine/systems/kitchen';
import { COLD_CHAIN_HOURS } from '@/engine/systems/trips';
import { cutStopsCooking, powerDay } from '@/engine/systems/utilities';
import { foodOf, mealsReady } from '@/engine/systems/pantry';
import { leftPartway } from '@/engine/systems/underway';
import { ROUTINE_DUE_KIND } from '@/engine/systems/routines';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const buy = (sim: Simulation, productId: string, quantity = 1) => sim.must({ kind: 'food.buy_groceries', payload: { productId, quantity } });
const RECIPE = 'chicken-and-tomato-jacket-potato';
function stockUp(sim: Simulation) {
  buy(sim, 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag'); buy(sim, 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts', 2);
  buy(sim, 'thefreshgrocer-bowl-basket-grape-tomatoes-pint', 4); buy(sim, 'thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz'); buy(sim, 'thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag');
}
const yogurt = (sim: Simulation) => foodOf(sim.player).find((i) => i.kind === 'thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz')!.food.left;

describe('cooking stopped partway', () => {
  it('stops at a power cut at home, keeps the food part-done, and finishes the minutes left once the power is back', () => {
    const sim = life('us-ny-newyork', 'cook-cut');
    stockUp(sim);
    sim.player.wellbeing.nourishment = 40;
    const start = sim.now;
    sim.player.powerCut = { from: start + 10 * 60_000, until: start + 70 * 60_000, by: 'Con Edison' };
    const r = sim.must<{ left: number; stopped?: string }>({ kind: 'food.cook', payload: { recipeId: RECIPE } });
    expect(r).toEqual({ left: 0, stopped: 'The power went off' });
    expect(sim.now - start).toBe(10 * 60_000);
    // The ingredients went in when it was started; nothing was eaten.
    expect(yogurt(sim)).toBe(907 - 150);
    expect(mealsReady(sim, sim.player)).toEqual([]);
    expect(sim.player.wellbeing.nourishment).toBeLessThanOrEqual(40);
    expect(cookingLeft(sim, sim.player)).toMatchObject({ recipeId: RECIPE, minutes: 30, minutesDone: 10 });
    // One thing on the go at a time, and it's listed to be picked up.
    expect(cookRefusal(sim, sim.player, RECIPE)).toMatch(/partway: finish it first/);
    expect(leftPartway(sim.player, sim.now)[0]).toMatchObject({ kind: 'cooking', resume: { command: 'food.resume_cooking' } });
    expect(resumeRefusal(sim, sim.player)).toMatch(/The power’s off until/);
    sim.advanceTo(start + 70 * 60_000);
    const back = sim.now;
    const done = sim.must<{ left: number; stopped?: string }>({ kind: 'food.resume_cooking', payload: {} });
    expect(done).toEqual({ left: 3 });
    expect(sim.now - back).toBe(20 * 60_000);
    expect(sim.player.cooking).toBeUndefined();
    expect(mealsReady(sim, sim.player)[0]!.food).toMatchObject({ key: 'dish', left: 3 });
  });

  it('runs straight through where the cut is after it ends, or in a town that cooks on gas', () => {
    const sim = life('us-ny-newyork', 'cook-cut-late');
    stockUp(sim);
    sim.player.powerCut = { from: sim.now + 45 * 60_000, until: sim.now + 90 * 60_000, by: 'Con Edison' };
    expect(sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: RECIPE } })).toEqual({ left: 3 });
    // ENIGH 2024: nearly all of Mexico City cooks on gas; no other town's fuel was read.
    expect(cutStopsCooking('mx-cmx-mexicocity')).toBe(false);
    expect(cutStopsCooking('us-ny-newyork')).toBe(true);
  });

  it('stops for something that stops the clock for them, and goes in the bin past USDA’s two hours', () => {
    const sim = life('us-ny-newyork', 'cook-stop');
    stockUp(sim);
    sim.schedule({ at: sim.now + 15 * 60_000, kind: ROUTINE_DUE_KIND, label: 'Your Evening', category: 'personal', stopsClock: true, payload: { routineId: 'none' } });
    const r = sim.must<{ left: number; stopped?: string }>({ kind: 'food.cook', payload: { recipeId: RECIPE } });
    expect(r).toEqual({ left: 0, stopped: 'Your Evening' });
    expect(COLD_CHAIN_HOURS).toBe(2);
    // Just within USDA's two hours it can still be finished; past them, not.
    sim.advanceBy(COLD_CHAIN_HOURS * 3_600_000 - 60_000);
    expect(cookingLeft(sim, sim.player)).toBeDefined();
    sim.advanceBy(2 * 60_000);
    expect(cookingLeft(sim, sim.player)).toBeUndefined();
    expect(leftPartway(sim.player, sim.now)).toEqual([]);
    expect(sim.execute({ kind: 'food.resume_cooking', payload: {} })).toMatchObject({ ok: false, error: `It was left more than ${COLD_CHAIN_HOURS} hours, USDA's limit.` });
    // The day's turn throws it away, and a new recipe can be started.
    sim.advanceBy(MS_DAY);
    expect(sim.player.cooking).toBeUndefined();
  });

  it('is a cut with its minute of the day, told when it comes', () => {
    const sim = life('us-ny-newyork', 'cut-time');
    sim.player.home = { ...sim.player.home!, cityId: 'ie-lei-dublin' };
    let day = 1;
    while (powerDay(sim, sim.player, sim.now + day * MS_DAY) === undefined) day += 1;
    const cut = sim.player.powerCut!;
    expect(cut.by).toBe('ESB Networks');
    expect(cut.from).toBeGreaterThanOrEqual(sim.now + day * MS_DAY);
    expect(cut.from).toBeLessThan(sim.now + (day + 1) * MS_DAY);
    // Told as it comes, once.
    const told = () => sim.universe.notifications.filter((n) => n.title === 'A Power Cut').length;
    const before = told();
    sim.player.powerCut = { from: sim.now + 10 * 60_000, until: sim.now + 40 * 60_000, by: 'ESB Networks' };
    sim.advanceBy(5 * 60_000);
    expect(told()).toBe(before);
    sim.advanceBy(10 * 60_000);
    expect(told()).toBe(before + 1);
    sim.advanceBy(10 * 60_000);
    expect(told()).toBe(before + 1);
  });
});
