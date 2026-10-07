/**
 * Routines (`systems/routines.ts`, from 2026-10-01): a named list of
 * everyday steps saved and run in order, each the same command with the
 * same checks, stopping at the first that can't be done and keeping what
 * was done before it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { routineRefusal, routinesOf, runRoutine, stepLabel } from '@/engine/systems/routines';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const shower = { kind: 'life.look_after', payload: { action: 'wash' } };
const breakfast = { kind: 'life.look_after', payload: { action: 'eat' } };

describe('a routine', () => {
  it('is saved from everyday steps, twelve at most, with a name', () => {
    expect(routineRefusal('', [shower])).toBe('Give it a name.');
    expect(routineRefusal('Morning', [])).toBe('Add a step.');
    expect(routineRefusal('Morning', Array.from({ length: 13 }, () => shower))).toBe('Twelve steps at most.');
    expect(routineRefusal('Morning', [{ kind: 'home.sell', payload: {} }])).toBe('A routine is made of everyday things.');
    expect(routineRefusal('Morning', [{ kind: 'life.look_after', payload: { action: 'fly' } }])).toBe('That isn’t something you can do for yourself.');
    const sim = life('routine-save');
    expect(sim.execute({ kind: 'routine.save', payload: { name: 'Morning', steps: [{ kind: 'home.sell', payload: {} }] } }).error).toBe('A routine is made of everyday things.');
    sim.must({ kind: 'routine.save', payload: { name: 'Morning', steps: [shower, breakfast] } });
    const r = routinesOf(sim.player)[0]!;
    expect(r.steps.map((s) => stepLabel(sim.player, s))).toEqual(['Shower', 'Eat A Meal']);
    sim.must({ kind: 'routine.delete', payload: { routineId: r.id } });
    expect(routinesOf(sim.player)).toHaveLength(0);
  });

  it('runs each step in order, with its time and its effects', () => {
    const sim = life('routine-run');
    sim.player.wellbeing.hygiene = 40;
    sim.player.wellbeing.nourishment = 40;
    sim.must({ kind: 'routine.save', payload: { name: 'Morning', steps: [shower, breakfast] } });
    const start = sim.now;
    const run = runRoutine(sim, routinesOf(sim.player)[0]!.id);
    expect(run).toEqual({ done: 2 });
    // Showered, then a little of it gone over breakfast.
    expect(sim.player.wellbeing.hygiene).toBeGreaterThan(95);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(40);
    expect(sim.now).toBeGreaterThan(start);
  });

  it('stops at the first step that can’t be done, says why, and keeps what was done', () => {
    const sim = life('routine-stop');
    sim.player.wellbeing.hygiene = 40;
    sim.player.wellbeing.nourishment = 95;
    sim.must({ kind: 'routine.save', payload: { name: 'Morning', steps: [shower, breakfast, shower] } });
    const run = runRoutine(sim, routinesOf(sim.player)[0]!.id);
    expect(run.done).toBe(1);
    expect(run.stopped).toMatchObject({ step: 1, error: 'You aren’t hungry.' });
    expect(sim.player.wellbeing.hygiene).toBeGreaterThan(95);
  });

  // From 2026-10-06: a cook step carries its servings, checked when saved.
  it('cooks a recipe for the servings its step carries, checked against the recipe’s range', () => {
    const recipeId = 'chicken-and-tomato-jacket-potato';
    const cook = (servings?: number) => ({ kind: 'food.cook', payload: servings === undefined ? { recipeId } : { recipeId, servings } });
    expect(routineRefusal('Supper', [cook(0)])).toMatch(/cooks from 1 to 12 servings/);
    expect(routineRefusal('Supper', [cook(13)])).toMatch(/cooks from 1 to 12 servings/);
    expect(routineRefusal('Supper', [cook(2)])).toBeUndefined();
    expect(routineRefusal('Supper', [{ kind: 'food.cook', payload: { recipeId: 'no-such' } }])).toBe('There’s no such recipe.');
    const sim = life('routine-servings');
    expect(sim.execute({ kind: 'routine.save', payload: { name: 'Supper', steps: [cook(13)] } }).ok).toBe(false);
    const buy = (productId: string, quantity = 1) => sim.must({ kind: 'food.buy_groceries', payload: { productId, quantity } });
    buy('thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag'); buy('thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts', 2);
    buy('thefreshgrocer-bowl-basket-grape-tomatoes-pint', 4); buy('thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz'); buy('thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag');
    sim.player.wellbeing.nourishment = 40;
    sim.must({ kind: 'routine.save', payload: { name: 'Supper', steps: [cook(2)] } });
    const r = routinesOf(sim.player)[0]!;
    expect(stepLabel(sim.player, r.steps[0]!)).toMatch(/, 2 Servings$/);
    const results: unknown[] = [];
    expect(runRoutine(sim, r.id, (kind, payload) => { const x = sim.execute({ kind, payload }); results.push(x.value); return x; })).toEqual({ done: 1 });
    // Two of the recipe's four: one eaten, one left, where a step without servings leaves three.
    expect(results[0]).toEqual({ left: 1 });
  });
});
