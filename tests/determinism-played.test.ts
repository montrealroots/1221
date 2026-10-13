/**
 * A played sequence replays byte for byte (from 2026-10-12).
 *
 * The determinism check until then compared counts and net worth on an idle thirty days, which the house standard
 * says measures nothing ("never an idle save"). This plays a sequence that reaches the new systems (a brief chosen,
 * prepared, worked through and taped with a classmate reading; time run through classes, a showing and their draws)
 * twice from the same seed, once straight through and once saved and reloaded halfway, and the saves must be the same
 * to the byte.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEFS } from '@/engine/content/briefs';
import { problemsOf, optionsOf } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';

const b = BRIEFS.find((x) => x.medium === 'camera' && x.beats.length >= 3)!;

function step(sim: Simulation, n: number): void {
  // TEST SETUP: a rested day before each action, so the action is what's measured, not the body.
  Object.assign(sim.player.wellbeing, { energy: 92, stress: 12, sleepDebt: 0, nourishment: 80, hygiene: 80 });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer && item.at <= sim.now + 3 * MS_HOUR) sim.timeline.cancel(item.id, sim.now);
  const k = `brief:${b.id}`;
  if (n === 0) sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } });
  if (n === 1) sim.execute({ kind: 'brief.reader', payload: { brief: b.id, mate: 0 } });
  if (n >= 2 && n <= 5) sim.execute({ kind: 'brief.prepare', payload: { brief: b.id, step: ['read', 'lines', 'lines', 'rehearse'][n - 2] } });
  if (n === 6) { const p = problemsOf(workPiece(sim, sim.player, k)!)[0]; if (p) sim.execute({ kind: 'work.identify', payload: { piece: k, problem: p.id } }); }
  if (n === 7) { const book = sim.player.briefs?.[b.id]?.book; const o = book?.problem ? optionsOf(workPiece(sim, sim.player, k)!, book.problem)[0] : undefined; if (o) sim.execute({ kind: 'work.try', payload: { piece: k, adjustment: o.adjustment, ...(o.option ? { option: o.option } : {}) } }); }
  if (n === 8) sim.execute({ kind: 'work.settle', payload: { piece: k, keep: true } });
  if (n === 9) sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
  sim.advanceTo(sim.now + 2 * MS_DAY);
}

function played(seed: string, reloadAt?: number): string {
  let sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (let n = 0; n < 12; n += 1) {
    if (n === reloadAt) sim = loadSave(deserialise(serialise(sim.universe)) as never);
    step(sim, n);
  }
  return serialise(sim.universe);
}

describe('a played sequence, twice', () => {
  it('is the same to the byte, straight through and reloaded halfway', () => {
    const a = played('determinism-played');
    const b2 = played('determinism-played');
    expect(b2).toBe(a);
    const reloaded = played('determinism-played', 6);
    expect(reloaded).toBe(a);
    // And a different seed is a different life: the check isn't of a constant.
    expect(played('determinism-other')).not.toBe(a);
  }, 120_000);
});
