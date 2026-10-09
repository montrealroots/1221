/**
 * History and continuity through the commands (from 2026-10-10): two takes of a self-tape on one day are two pieces of
 * work, each kept and counted, and the journey's best is the better of them (until then the second replaced the
 * first, and the best could keep a score no longer in the record); and a save and a load in the middle of a day don't
 * reset what the day has already used: the four hours of practice, and the same exercise again for half.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { journeyOf } from '@/engine/systems/evaluation';
import { developmentOf } from '@/engine/systems/attributes';
import { PRACTICE } from '@/engine/content/practice';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: nothing on the calendar in the way, and rested before each hour. */
const free = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 15, sleepDebt: 0, nourishment: 70, hygiene: 80 });
};
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

describe('two takes on one day', () => {
  it('are two pieces, each kept and counted, and the best is the better of them', () => {
    const sim = life('history-takes');
    free(sim);
    expect(sim.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } }).ok).toBe(true);
    free(sim);
    expect(sim.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } }).ok).toBe(true);
    const tapes = (sim.player.work ?? []).filter((w) => w.inputs.key.startsWith(`tape:${sim.player.id}:drama:`));
    expect(tapes).toHaveLength(2);
    expect(new Set(tapes.map((t) => t.inputs.key)).size).toBe(2);
    const camera = journeyOf(sim.player).totals.camera!;
    expect(camera.n).toBe(2);
    expect(camera.best).toBe(Math.max(...tapes.map((t) => t.overall)));
    expect(camera.sum).toBeCloseTo(tapes.reduce((s, t) => s + t.overall, 0), 1);
  });
});

describe('a save and a load in the middle of a day', () => {
  it('keep the day’s four hours of practice used, and the same exercise again for half', () => {
    // Twins of one save: one saved and loaded between every hour, one never. They come out the same to the last digit.
    const run = (reloading: boolean) => {
      let sim = life('history-limits');
      const deltas: number[] = [];
      for (let n = 0; n < PRACTICE.dailyHours; n += 1) {
        if (reloading && n > 0) sim = reload(sim);
        free(sim);
        expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: 'concentration' } }).ok).toBe(true);
        deltas.push(developmentOf(sim.player).history.filter((h) => h.source === 'practice:concentration').at(-1)!.delta);
      }
      if (reloading) sim = reload(sim);
      free(sim);
      return { deltas, fifth: sim.execute({ kind: 'practice.exercise', payload: { exercise: 'recall-drill' } }).error, counts: { ...developmentOf(sim.player).counts } };
    };
    const kept = run(true);
    const plain = run(false);
    expect(kept.deltas).toEqual(plain.deltas);
    expect(kept.counts).toEqual(plain.counts);
    // Each again the same day gives less than the one before, and the fifth hour is refused either way.
    for (let n = 1; n < kept.deltas.length; n += 1) expect(kept.deltas[n]!).toBeLessThan(kept.deltas[n - 1]!);
    expect(kept.fifth).toMatch(/practiced 4 hours today/);
    expect(plain.fifth).toBe(kept.fifth);
  });
});
