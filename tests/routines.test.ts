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
});
