/**
 * Your Class, on the Coursework tab, as a player reads a classmate's Run Lines Together? (from 2026-10-17, brief 14's
 * editorial review): what running their lines does where you share no open scene, in the notice's own words. Until then
 * the panel said “That helps them and moves nothing of yours.” and the notice “It helped them, and nothing of yours
 * moved.”; both say what doesn't move now, your own work. The invitation's line says how long and when, “for an hour on
 * …”, as the notice does.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { courseworkOf } from '@/engine/systems/coursework';
import { momentsOf, sharedWork } from '@/engine/systems/classmates';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { ClassMoments } = await import('@/ui/components/ClassMoments');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: [] as string[] });
/** TEST SETUP: played by somebody who looks after themselves, rested and awake through the evening. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('Your Class: a classmate’s Run Lines Together? where you share no open scene', () => {
  it('PLAYER JOURNEY: the panel says running their lines helps them but doesn’t move your own work, and the invitation says how long and when', () => {
    const sim = student('g23-probe');
    const open = () => momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.status === 'open' && m.kind === 'study' && sharedWork(sim, sim.player, m.mate).length === 0);
    while (!open() && sim.now < at(2027, 4, 1)) tended(sim, sim.now + 6 * MS_HOUR);
    const m = open();
    expect(m, 'the class brought an invitation from a classmate you share no open scene with').toBeDefined();
    h.sim = sim;
    const text = words(renderToStaticMarkup(createElement(ClassMoments)));
    const first = sim.player.school!.classmates[m!.mate]!.name.split(' ')[0]!;
    expect(text).toContain(`You share no open scene with ${first}, so you’d run their lines. That helps them, but it doesn’t move your own work.`);
    expect(text).toMatch(new RegExp(`${first} asks if you’d run lines together for an hour on [A-Z][a-z]+ \\d{1,2}, \\d{4} at 7:00 PM\\.`));
  });
});
