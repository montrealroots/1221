/**
 * `systems/engagement.ts` said a self-tape read familiarity as its "knowing the genre" and that familiarity and practice
 * sped the preparation of work in the genre (`genreSpeed`). From 2026-10-12 a take of a brief reads the better of
 * familiarity and practice (`genreKnown`), and a brief's own steps read the material met before (`prepSpeed`), not the
 * genre: `genreSpeed` speeds a scene for class from a play of the kind and a part's lines. It kept `selfTapeRefusal`,
 * read by nothing once `tapeRefusal` (`systems/briefs.ts`) refused a take in its place. The refusal is gone, and what
 * the corrected prose says is held here against the commands, so a change to either has to change the other.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { briefsOf } from '@/engine/content/briefs';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { recordOf, tapeReadsOf } from '@/engine/systems/briefs';
import * as engagement from '@/engine/systems/engagement';
import { genreSpeed, genreState } from '@/engine/systems/engagement';

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = <T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<T>({ kind, payload }); };

const BRIEF = briefsOf('drama')[0]!;
const choose = (sim: Simulation) => go(sim, 'brief.choose', { brief: BRIEF.id, reading: BRIEF.readings[0]!.id });

describe('a self-tape’s refusal', () => {
  it('is the brief’s alone: engagement keeps none, and the command still refuses what it did', () => {
    expect(Object.keys(engagement)).not.toContain('selfTapeRefusal');
    const sim = student('g29-refusal');
    expect(go(sim, 'practice.self_tape', { genre: 'no-such-genre' }).error).toBe('There’s no such genre.');
    choose(sim);
    delete sim.player.craft;
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).error).toBe('Your training hasn’t begun: there’s no craft to tape yet.');
  });
});

describe('what a take reads of the genre', () => {
  it('reads the better of familiarity and practice, and the brief’s own techniques', () => {
    const sim = student('g29-known');
    choose(sim);
    for (const k of BRIEF.kinds) Object.assign(genreState(sim.player, k), { familiarity: 0, practice: 0 });
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).ok).toBe(true);
    // Worked in, never studied: a take that read familiarity alone would know nothing of it.
    const worked = Math.max(...BRIEF.kinds.map((k) => genreState(sim.player, k).practice));
    expect(worked).toBeGreaterThan(0);
    expect(BRIEF.kinds.every((k) => genreState(sim.player, k).familiarity === 0)).toBe(true);
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).ok).toBe(true);
    const second = recordOf(sim.player, BRIEF.id).takes.at(-1)!;
    expect(second.prep.genre).toBeCloseTo(worked / 100, 9);
    // Studied past what it's worked in: the take reads the familiarity instead, the better of the two and never the sum.
    genreState(sim.player, 'drama').familiarity = Math.min(100, worked + 20);
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).ok).toBe(true);
    const third = recordOf(sim.player, BRIEF.id).takes.at(-1)!;
    expect(third.prep.genre).toBeCloseTo(Math.max(genreState(sim.player, 'drama').familiarity, ...BRIEF.kinds.map((k) => genreState(sim.player, k).practice)) / 100, 9);
    expect(third.prep.genre).toBeGreaterThan(second.prep.genre!);
    // Its techniques are the brief's (`tapeReadsOf`), not the genre's camera alone (`tapeReads`).
    expect(Object.keys(sim.player.work!.at(-1)!.inputs.techniques).sort()).toEqual(Object.keys(tapeReadsOf(BRIEF)).sort());
  });
});

describe('what the genre known speeds', () => {
  it('not a brief’s steps, which read the material met before, though the genre would speed a scene of its kind', () => {
    const step = (known: boolean) => {
      const sim = student('g29-speed');
      for (const k of BRIEF.kinds) Object.assign(genreState(sim.player, k), known ? { familiarity: 100, practice: 100 } : { familiarity: 0, practice: 0 });
      const r = go<{ moved: number }>(sim, 'brief.prepare', { brief: BRIEF.id, step: 'read' });
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
      return { moved: r.value!.moved, speed: genreSpeed(sim.player, BRIEF.kinds) };
    };
    const cold = step(false);
    const known = step(true);
    expect(cold.speed).toBe(1);
    expect(known.speed).toBeCloseTo(1 + ENGAGEMENT.genreSpeed, 9);
    expect(known.moved).toBeGreaterThan(0);
    expect(known.moved).toBe(cold.moved);
  });
});
