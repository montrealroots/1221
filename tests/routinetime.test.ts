/**
 * A routine set for a time (`routine.set_time` in `systems/routines.ts`,
 * from 2026-10-02): its moment, on the days chosen in local time, stops the
 * clock as anything that wants you does, and once past sets the next.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { ROUTINE_DUE_KIND, nextRoutineAt, routineTimeRefusal, runRoutine } from '@/engine/systems/routines';

const life = () => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'routine-time');
const pending = (sim: ReturnType<typeof life>) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === ROUTINE_DUE_KIND);

describe('a routine set for a time', () => {
  it('comes at its hour on the days chosen, in local time', () => {
    const sim = life();
    const at = nextRoutineAt(sim, sim.now, { hour: 7, minute: 30, days: [1] })!;
    const p = zonedParts(at, sim.zone);
    expect([p.weekday, p.hour, p.minute]).toEqual([1, 7, 30]);
    expect(at - sim.now).toBeLessThanOrEqual(7 * MS_DAY);
    expect(nextRoutineAt(sim, at, { hour: 7, minute: 30, days: [1] })! - at).toBeGreaterThan(6 * MS_DAY);
    expect(routineTimeRefusal({ hour: 24, minute: 0, days: [1] })).toBe('Choose an hour and a minute.');
    expect(routineTimeRefusal({ hour: 7, minute: 0, days: [] })).toBe('Choose the days.');
  });

  it('stops the clock at its moment, is run there, and sets the next', () => {
    const sim = life();
    sim.player.wellbeing.hygiene = 40;
    const { routineId } = sim.must<{ routineId: string }>({ kind: 'routine.save', payload: { name: 'Morning', steps: [{ kind: 'life.look_after', payload: { action: 'wash' } }] } });
    const { next } = sim.must<{ next: number }>({ kind: 'routine.set_time', payload: { routineId, at: { hour: 7, minute: 0, days: [0, 1, 2, 3, 4, 5, 6] } } });
    expect(pending(sim).map((i) => i.at)).toEqual([next]);
    const stop = sim.advanceTo(next + 3 * 3_600_000, { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind).toBe(ROUTINE_DUE_KIND);
    expect(sim.now).toBe(next);
    sim.player.wellbeing.hygiene = 40;
    const ran = runRoutine(sim, routineId);
    expect(ran.stopped?.error).toBeUndefined();
    sim.advanceTo(next + 3 * 3_600_000, { stopOnPlayerRequired: true });
    expect(pending(sim).map((i) => i.at)).toEqual([nextRoutineAt(sim, next, { hour: 7, minute: 0, days: [0, 1, 2, 3, 4, 5, 6] })]);
    // Cleared, nothing's set; deleted, nor is anything.
    sim.must({ kind: 'routine.set_time', payload: { routineId, at: null } });
    expect(pending(sim)).toEqual([]);
    sim.must({ kind: 'routine.set_time', payload: { routineId, at: { hour: 7, minute: 0, days: [1] } } });
    sim.must({ kind: 'routine.delete', payload: { routineId } });
    expect(pending(sim)).toEqual([]);
  });
});
