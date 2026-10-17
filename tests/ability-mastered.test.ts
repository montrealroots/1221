/**
 * An ability marked Mastered on the Player Profile (from 2026-10-16, at the owner's word: "now add a mastered badge for
 * the attributes"). Until then an ability's row said only its two figures, Now and Full, side by side, where the
 * Techniques panel said Mastered of a technique at `MASTERED`. An ability is marked at its full, by the game's own rule
 * (`atFull`), which the advice reads too. Reaching full by practice sets it exactly (`abilityGain`), so the mark comes
 * with the session that reaches it. Stamina, the one ability that fades, loses its mark when its fitness falls.
 *
 * Played through `practice.exercise`, the Player Profile drawn as the player has it. TEST SETUP, said where it's done:
 * an ability set a little under its full, as years of play would leave it (`tools/mastery.ts` plays them); stamina's
 * fitness set to its full and under it; the clock's own commitments cleared and the day kept rested.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { exerciseFor } from '@/engine/content/practice';
import { abilityFull, abilityOf, attributesOf } from '@/engine/systems/attributes';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
function rest(sim: Simulation) {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
}

/** An ability's first cell on the Player Profile as the page draws it: its words, and its chip's title where it has one. */
function rowOf(sim: Simulation, label: string): { text: string; chip: string | undefined } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(ProfileWorkspace)).replace(/<!-- -->/g, '');
  const cells = [...html.matchAll(/<tr><td class="nowrap">(.*?)<\/td>/g)].map((m) => m[1]!).filter((c) => c.replace(/<[^>]+>/g, '').replace(/\s*Mastered$/, '') === label);
  expect(cells, `${label}'s row on the Player Profile`).toHaveLength(1);
  return { text: cells[0]!.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), chip: /<span class="chip chip-positive" title="([^"]*)">Mastered<\/span>/.exec(cells[0]!)?.[1] };
}

describe('an ability marked Mastered, on the Player Profile', () => {
  it('PLAYER JOURNEY: presence a tenth under its full has no mark; one session of its exercise, through practice.exercise, carries it to its full exactly, and its row says Mastered, where Focus, under its full, says nothing', () => {
    const sim = life('ability-mastered');
    const p = sim.player;
    const full = abilityFull(sim, p, 'presence');
    // TEST SETUP: presence a tenth under its full, and focus well under its own.
    (attributesOf(sim, p) as unknown as Record<string, number>).presence = full - 0.1;
    (attributesOf(sim, p) as unknown as Record<string, number>).focus = 60;
    expect(abilityOf(sim, p, 'presence')).toBeLessThan(full);
    expect(rowOf(sim, 'Presence')).toEqual({ text: 'Presence', chip: undefined });
    rest(sim);
    const r = sim.execute<{ gained: number; level: number }>({ kind: 'practice.exercise', payload: { exercise: exerciseFor('presence')!.id } });
    expect(r.ok, r.error).toBe(true);
    expect(abilityOf(sim, p, 'presence')).toBe(full);
    expect(rowOf(sim, 'Presence')).toEqual({ text: 'Presence Mastered', chip: `At its full, ${full.toFixed(1)}: no work asks more of it` });
    expect(rowOf(sim, 'Focus')).toEqual({ text: 'Focus', chip: undefined });
  });

  it('stamina is marked at full fitness for its age and loses the mark when its fitness falls a tenth: it’s the one ability that fades', () => {
    const sim = life('ability-mastered-stamina');
    const p = sim.player;
    const full = abilityFull(sim, p, 'stamina');
    // TEST SETUP: fitness at its full, then a tenth under it.
    p.wellbeing.fitness = full;
    expect(rowOf(sim, 'Stamina')).toEqual({ text: 'Stamina Mastered', chip: `At full fitness for your age, ${full.toFixed(1)}: it falls again without workouts` });
    p.wellbeing.fitness = full - 0.1;
    expect(rowOf(sim, 'Stamina')).toEqual({ text: 'Stamina', chip: undefined });
  });
});
