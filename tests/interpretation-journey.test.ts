/**
 * PLAYER JOURNEY (from 2026-10-16): a way of playing chosen, prepared, rehearsed and taped through the commands, the
 * take's account of what the way came to against the scene and what the abilities cost, the advice read, the advised
 * input trained, and the save written and read back with every finding kept. The same student plays Nordic noir's
 * brief with the grain and social realism's against it, so the two accounts differ by the scene, not the actor.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { exerciseFor } from '@/engine/content/practice';
import { briefMaterial, readingOf, sceneOf } from '@/engine/systems/briefs';
import { replay } from '@/engine/systems/evaluation';
import { suitabilityOf } from '@/engine/systems/interpretation';
import { adviceFor } from '@/engine/systems/next-steps';
import { genreState } from '@/engine/systems/engagement';
import { matchedTier } from '@/engine/systems/practice';
import { levelOf } from '@/engine/systems/attributes';

const NY = 'America/New_York';
const clear = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
// TEST SETUP: rested before each command, so the day's condition doesn't decide what's measured.
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { clear(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); const r = sim.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); return r; };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)));

function tape(sim: Simulation, id: string, scale: 'restrained' | 'expansive') {
  const b = BRIEF_BY_ID[id]!;
  go(sim, 'brief.choose', { brief: id, reading: b.readings[0]!.id, scale });
  for (let i = 0; i < 4; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: id, step });
  go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: id });
  return sim.player.briefs![id]!.takes.at(-1)!;
}

describe('a way of playing and the advice, played', () => {
  it('PLAYER JOURNEY: with the grain and against it, said on the take, kept through a reload, and the advice moving once it’s trained', () => {
    let sim = createSave(1, 'interp-journey', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    clear(sim);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 29, hour: 9 }, NY));
    // TEST SETUP: an even student at 55, both genres known.
    Object.assign(sim.player.attrs!, Object.fromEntries(Object.keys(sim.player.attrs!).filter((k) => k !== 'stamina').map((k) => [k, 55])));
    genreState(sim.player, 'nordic_noir').familiarity = 90;
    genreState(sim.player, 'social_realism').familiarity = 90;
    const noir = BRIEF_BY_ID['brief-nordic_noir']!, realism = BRIEF_BY_ID['brief-social_realism']!;
    // The scenes say it before the choice: restrained suits Nordic noir's; expansive goes against social realism's grain.
    expect(suitabilityOf('restrained', briefMaterial(noir), sceneOf(noir, readingOf(noir, noir.readings[0]!.id))).band).toBe('suits');
    expect(suitabilityOf('expansive', briefMaterial(realism), sceneOf(realism, readingOf(realism, realism.readings[0]!.id))).s).toBeLessThan(0);
    const withIt = tape(sim, noir.id, 'restrained');
    const against = tape(sim, realism.id, 'expansive');
    expect(withIt.grain!.points).toBeGreaterThan(0);
    expect(withIt.grain!.why).toContain('Restrained, Suits The Scene');
    expect(against.grain!.points).toBeLessThan(0);
    expect(against.grain!.ability).toBeGreaterThan(0);
    // The kept result works out again the same, its grain with it.
    const kept = sim.player.work!.at(-1)!;
    expect(kept.inputs.grain).toBeDefined();
    expect(replay(kept, TASK_PROFILES[kept.task]!)!.overall).toBe(kept.overall);
    // The advice, then a reload: the same takes, the same accounts, the same advice.
    const advice = adviceFor(sim, sim.player);
    const top = advice.find((x) => x.forecast)!;
    expect(top).toBeDefined();
    sim = reload(sim);
    expect(sim.player.briefs![noir.id]!.takes.at(-1)).toEqual(withIt);
    expect(sim.player.briefs![realism.id]!.takes.at(-1)).toEqual(against);
    expect(adviceFor(sim, sim.player)).toEqual(advice);
    // Continued: the advised input trained to full (TEST SETUP, the hours a term of practice would be), and the advice
    // moves on to something else; the practice itself is played once through its command.
    go(sim, 'practice.exercise', { exercise: exerciseFor(top.target as never)!.id, tier: matchedTier(levelOf(sim, sim.player, top.target as never)), focus: 'steady' });
    sim.advanceTo(sim.now + MS_DAY);
    if (top.target in sim.player.attrs!) (sim.player.attrs as unknown as Record<string, number>)[top.target] = 100; else (sim.player.craft as unknown as Record<string, number>)[top.target] = 100;
    const after = adviceFor(sim, sim.player).find((x) => x.forecast);
    expect(after?.target).not.toBe(top.target);
  }, 120_000);
});
