/**
 * The Look After Yourself menu's order (`lookAfterOptions` in
 * `systems/life.ts`, from the connected world of 2026-10-09): what's costing
 * the body every hour first, then by the readiness given back, then what gives
 * back next to nothing, then what can't be done; each with its time, its cost
 * and what it would do, the preview the command's own arithmetic; and nothing
 * done until it's chosen.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { LOOKING_AFTER, lookAfterOptions, readiness, type LookAfter } from '@/engine/systems/life';

/** Test setup: the dials set to a state, nothing on the calendar in the way. */
function at(seed: string, dials: Partial<Simulation['player']['wellbeing']>): Simulation {
  const sim = quickSave({}, seed);
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 80 }, dials);
  return sim;
}
const order = (sim: Simulation) => lookAfterOptions(sim).map((o) => o.action);

describe('the order', () => {
  it('puts a meal first for somebody hungry, a shower first for somebody grimy, unwinding first for somebody overwrought', () => {
    const hungry = at('lay-hungry', { nourishment: 10 });
    expect(order(hungry)[0]).toBe('eat');
    expect(lookAfterOptions(hungry)[0]!.urgent).toBe(true);
    expect(lookAfterOptions(hungry)[0]!.why).toMatch(/Hungry at 10/);
    expect(order(at('lay-grimy', { hygiene: 30 }))[0]).toBe('wash');
    expect(order(at('lay-stressed', { stress: 90 }))[0]).toBe('unwind');
  });

  it('moves with the dials: the same life, fed and then hungry, reorders', () => {
    const sim = at('lay-move', { nourishment: 85, stress: 60 });
    const fed = order(sim);
    expect(fed.indexOf('unwind')).toBeLessThan(fed.indexOf('eat'));
    sim.player.wellbeing.nourishment = 15;
    const hungry = order(sim);
    expect(hungry.indexOf('eat')).toBeLessThan(hungry.indexOf('unwind'));
  });

  it('puts what can’t be done last, with the command’s own refusal', () => {
    const full = at('lay-full', { nourishment: 95 });
    const options = lookAfterOptions(full);
    const eat = options.find((o) => o.action === 'eat')!;
    expect(eat.refused).toBe('You aren’t hungry.');
    expect(full.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).error).toBe(eat.refused);
    const firstRefused = options.findIndex((o) => o.refused);
    expect(options.slice(firstRefused).every((o) => o.refused)).toBe(true);
  });

  it('is stable: two asks of the same state give the same order, and a tie keeps the menu’s own order', () => {
    const sim = at('lay-stable', {});
    expect(order(sim)).toEqual(order(sim));
    const fixed = Object.keys(LOOKING_AFTER) as LookAfter[];
    const options = lookAfterOptions(sim);
    for (let i = 1; i < options.length; i += 1) {
      const [a, b] = [options[i - 1]!, options[i]!];
      if (a.urgent === b.urgent && !!a.refused === !!b.refused && a.gain === b.gain) expect(fixed.indexOf(a.action)).toBeLessThan(fixed.indexOf(b.action));
    }
  });
});

describe('what each says it will do', () => {
  it('shows the time, the cost and the dials, and the meal does what it said', () => {
    const sim = at('lay-preview', { nourishment: 30 });
    const eat = lookAfterOptions(sim).find((o) => o.action === 'eat')!;
    expect(eat.minutes).toBe(LOOKING_AFTER.eat.minutes);
    expect(eat.cost).toBeGreaterThan(0);
    const fed = eat.changes.find((c) => c.dial === 'nourishment')!;
    expect(fed.from).toBe(30);
    expect(fed.to).toBe(80);
    expect(eat.gain).toBeGreaterThan(0);
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(r.ok, r.error).toBe(true);
    // The meal put back what it said, less the forty minutes' hunger it took.
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(fed.to - 3);
    expect(sim.player.wellbeing.nourishment).toBeLessThanOrEqual(fed.to);
  });

  it('does nothing by asking: no time passes, no money moves, no dial changes', () => {
    const sim = at('lay-asks', { nourishment: 10, hygiene: 20, stress: 90 });
    const now = sim.now;
    const dials = { ...sim.player.wellbeing };
    const postings = sim.universe.transactions.length;
    const body = JSON.stringify(sim.player.body);
    const before = readiness(sim.player);
    lookAfterOptions(sim);
    expect(sim.now).toBe(now);
    expect(sim.player.wellbeing).toEqual(dials);
    expect(sim.universe.transactions.length).toBe(postings);
    expect(JSON.stringify(sim.player.body)).toBe(body);
    expect(readiness(sim.player)).toBe(before);
  });
});
