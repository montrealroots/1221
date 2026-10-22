/**
 * Brief 20, the craft area's advice (docs/verification/audit-2026-10-21/areas/craft): what the Player Profile's What To
 * Work On Next (`adviceFor`, `systems/next-steps.ts`, the card `ProfileWorkspace` draws) tells the player follows from
 * the state, and acting on it moves what it says it will.
 *
 * Played through the commands: a brief chosen, prepared and taped on three days, then the advice read; one twin practises
 * the exercise it names, an hour a day for three days, and the other spends the same hours doing nothing the advice names.
 * TEST SETUP: the clock's commitments cleared and the day held rested before each command (`clearDay`, `rest`), as
 * tests/b20-craft-bite.test.ts does; every input is the game's.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { exerciseFor } from '@/engine/content/practice';
import { levelOf } from '@/engine/systems/attributes';
import { adviceFor } from '@/engine/systems/next-steps';
import { serialise } from '@/engine/persistence/adapter';
import { at, clearDay, run, student } from './fakes/craft-life';

const B = BRIEF_BY_ID['brief-absurdist']!;
const rest = (sim: Simulation) => { clearDay(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); };
const go = <V = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return run<V>(sim, kind, payload); };

/** Three days of a brief: chosen, prepared, and taped each afternoon. */
function worked(seed: string): Simulation {
  const sim = student(seed);
  go(sim, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id });
  for (let d = 0; d < 3; d += 1) {
    rest(sim); sim.advanceTo(at(2026, 8, 25 + d, 13));
    for (const step of ['read', 'lines', 'rehearse']) if (!sim.execute({ kind: 'brief.prepare', payload: { brief: B.id, step } }).error) rest(sim);
    rest(sim); sim.advanceTo(at(2026, 8, 25 + d, 16));
    go(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
  }
  return sim;
}

describe('What To Work On Next: follows the state, and acting on it moves what it says', () => {
  it('names an input the recent work read, with room to grow and its exercise; reading it changes nothing', () => {
    const sim = worked('b20c-advice');
    const before = serialise(sim.universe);
    const first = adviceFor(sim, sim.player).find((r) => r.forecast)!;
    expect(serialise(sim.universe)).toBe(before);
    expect(first).toBeDefined();
    expect(first.exercise).toBe(exerciseFor(first.target as never)!.id);
    // Its level now is where the forecast starts, and it's short of full.
    expect(first.forecast!.from).toBeCloseTo(levelOf(sim, sim.player, first.target as never), 6);
    expect(first.forecast!.to).toBeGreaterThan(first.forecast!.from);
    expect(first.forecast!.pieces).toBeGreaterThan(0);
    expect(first.points).toBeGreaterThan(0);
    console.log('FIGURES advice first', first.target, first.forecast!.from.toFixed(2), first.forecast!.to.toFixed(2), first.points);
  });

  it('practised as it says, the input rises, the advice reads it from there, and the same take comes out better', () => {
    const doer = worked('b20c-advice'), idle = worked('b20c-advice');
    const first = adviceFor(doer, doer.player).find((r) => r.forecast)!;
    const id = first.target as never;
    const level0 = levelOf(doer, doer.player, id);
    for (let d = 0; d < 3; d += 1) {
      for (const sim of [doer, idle]) { rest(sim); sim.advanceTo(at(2026, 8, 28, 10) + d * MS_DAY); rest(sim); }
      run(doer, 'practice.exercise', { exercise: first.exercise });
      idle.advanceTo(idle.now + 60 * 60_000);
    }
    const level1 = levelOf(doer, doer.player, id);
    expect(level1).toBeGreaterThan(level0);
    expect(levelOf(idle, idle.player, id)).toBe(level0);
    // The advice follows: its forecast for the input starts where it now stands.
    const again = adviceFor(doer, doer.player).find((r) => r.target === first.target);
    expect(again?.forecast).toBeDefined();
    expect(again!.forecast!.from).toBeCloseTo(level1, 6);
    // And the take it was about, taped again at one instant with its preparation as it stands, comes out better.
    const tape = (sim: Simulation) => { rest(sim); sim.advanceTo(at(2026, 9, 1, 16)); rest(sim); return run<{ overall: number }>(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id }).overall; };
    const a = tape(doer), b = tape(idle);
    console.log('FIGURES advice acted', first.target, level0.toFixed(2), level1.toFixed(2), a, b, again?.forecast?.from.toFixed(2));
    expect(a).toBeGreaterThan(b);
  });
});
