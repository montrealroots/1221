/**
 * SLATE — the played harness F2-A reads (from 2026-10-16; docs/verification/advice-2026-10-16/criteria.md): a student who
 * tapes three briefs through the game's commands, and copies of the save that each train one input for twenty days.
 * `tools/advice.ts` runs it over the seeds; `tests/advice.test.ts` plays one case through it.
 */

import { createSave, loadSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { ABILITY_DEFS, TECHNIQUES } from '../src/engine/content/abilities';
import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import { exerciseFor } from '../src/engine/content/practice';
import { forecast } from '../src/engine/systems/briefs';
import { matchedTier } from '../src/engine/systems/practice';
import { levelOf } from '../src/engine/systems/attributes';

export const SESSIONS = 20;
const NY = 'America/New_York';

/** A seeded draw, the same for a seed every run. */
export function rng(seed: string) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; }; }

export const clear = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
// TEST SETUP: rested before every command, so the day's condition is the same in every copy.
export const rest = (sim: Simulation) => { clear(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); };
export const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute({ kind, payload }); };
export const clone = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)));
const nextDay = (sim: Simulation, hour: number) => { const p = zonedParts(sim.now + MS_DAY, NY); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour }, NY); };

/** Twenty days, a session of the exercise each (or none, for the baseline), at the first free hour. */
export function live(sim: Simulation, exercise: string | undefined) {
  for (let d = 0; d < SESSIONS; d += 1) {
    sim.advanceTo(nextDay(sim, 7));
    if (!exercise) continue;
    for (const hour of [7, 8, 20, 21, 12, 17]) {
      rest(sim);
      const target = instantFromZoned({ ...zonedParts(sim.now, NY), hour, minute: 0 }, NY);
      if (target > sim.now) sim.advanceTo(target);
      const ex = exerciseFor(exercise as never)!;
      const r = go(sim, 'practice.exercise', { exercise: ex.id, tier: matchedTier(levelOf(sim, sim.player, exercise as never)), focus: 'steady' });
      if (r.ok) break;
    }
  }
  rest(sim);
}

/** The taped briefs' forecast, weighted to the latest as the advice weights its recent work. */
export const worth = (sim: Simulation, briefs: string[]) => { rest(sim); const w = briefs.map((_, i) => i + 1); return briefs.reduce((t, id, i) => t + forecast(sim, sim.player, BRIEF_BY_ID[id]!).overall * w[i]!, 0) / w.reduce((a, x) => a + x, 0); };


/** A case: the student, abilities and techniques drawn from the seed (TEST SETUP), three briefs taped through the commands. */
export function setUp(seed: string): { sim: Simulation; briefs: string[] } {
  const r = rng(seed);
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  clear(sim);
  sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 29, hour: 9 }, NY));
  Object.assign(sim.player.attrs!, Object.fromEntries(ABILITY_DEFS.filter((d) => d.id !== 'stamina').map((d) => [d.id, Math.round(30 + 45 * r())])));
  Object.assign(sim.player.craft!, Object.fromEntries(TECHNIQUES.map((s) => [s, Math.round(25 + 50 * r())])));
  const briefs: string[] = [];
  while (briefs.length < 3) { const b = BRIEFS[Math.floor(r() * BRIEFS.length)]!; if (!briefs.includes(b.id) && b.medium === 'camera') briefs.push(b.id); }
  for (const id of briefs) {
    const b = BRIEF_BY_ID[id]!;
    go(sim, 'brief.choose', { brief: id, reading: b.readings[0]!.id });
    for (let i = 0; i < 2; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: id, step });
    go(sim, 'genre.study', { genre: b.kinds[0] });
    const t = go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: id });
    if (!t.ok) throw new Error(`${seed} ${id}: ${t.error}`);
  }
  rest(sim);
  return { sim, briefs };
}

/** What twenty days of each input's exercise brought, against a baseline copy that lived the same days without them. */
export function realize(sim: Simulation, briefs: string[], inputs: Iterable<string>): Record<string, number> {
  const base = clone(sim);
  live(base, undefined);
  const baseWorth = worth(base, briefs);
  const out: Record<string, number> = {};
  for (const id of inputs) { const c = clone(sim); live(c, id); out[id] = Math.round((worth(c, briefs) - baseWorth) * 100) / 100; }
  return out;
}
