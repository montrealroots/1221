/**
 * What held a life's work back, counted for life (`Journey.limits`, `countWork`, from 2026-10-12): a piece counts once
 * for each input that held it back, however many dimensions the input reached. Until round three of that day's defect
 * pass a limit was counted once per dimension, so a piece held back by listening in three dimensions counted as three,
 * and "it's held back N of your pieces" (the identity, a recommendation, a director's note) overstated it: the round's
 * verifier measured n=15 against 12 pieces on a played save. The backfill a save from before gets on opening counts the
 * same way.
 */
import { describe, expect, it } from 'vitest';
import type { Person } from '@/engine/domain/model';
import { countWork, journeyOf, limitsOnce, type Limit } from '@/engine/systems/evaluation';
import { loadSave, quickSave } from '@/engine';

const limit = (what: string, dimension: string, whole: number): Limit => ({ kind: 'ability', what, label: what, by: whole * 4, whole, dimension } as unknown as Limit);

describe('what held the work back, for life', () => {
  it('counts a piece once for an input that held back three of its dimensions, at the sum of its cost', () => {
    const person = { id: 'p' } as unknown as Person;
    const limits = [limit('listening', 'connection', 1), limit('listening', 'responsiveness', 0.5), limit('listening', 'believability', 0.25), limit('focus', 'execution', 0.4)];
    countWork(person, { at: 1, task: 'scene', overall: 60, mastery: false, what: 'A scene', limits });
    countWork(person, { at: 2, task: 'scene', overall: 61, mastery: false, what: 'Another', limits: limits.slice(0, 2) });
    const j = journeyOf(person);
    expect(j.limits!['ability:listening']!.n).toBe(2);
    expect(j.limits!['ability:listening']!.whole).toBe(3.3);
    expect(j.limits!['ability:focus']!.n).toBe(1);
    // Taken back out, as when the same work is judged again.
    countWork(person, { at: 2, task: 'scene', overall: 61, mastery: false, what: 'Another', limits: limits.slice(0, 2) }, -1);
    expect(journeyOf(person).limits!['ability:listening']!.n).toBe(1);
  });

  it('backfills a save from before the same way: each piece once', () => {
    const sim = quickSave({}, 'journey-limits');
    const p = sim.player;
    const limits = [limit('listening', 'connection', 1), limit('listening', 'responsiveness', 0.5)];
    p.work = [{ at: 1, task: 'scene', overall: 60, mastery: false, what: 'A scene', limits, dims: {}, inputs: { abilities: {} } } as never];
    journeyOf(p);
    delete p.journey!.limits;
    const again = loadSave(sim.universe);
    expect(again.player.journey!.limits!['ability:listening']!.n).toBe(1);
    expect(limitsOnce(limits).get('ability:listening')!.whole).toBe(1.5);
  });
});
