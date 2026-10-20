/**
 * The Coursework tab's first view, read where the player meets it (from 2026-10-20, the owner's brief 17, section 8: "The
 * first view should answer: what happened or matters now; what the player can do"). The first week leads the tab while a
 * session is still to come or to catch up, and goes below the work once all five are done: until then a second-year
 * student's tab opened on five sessions done two years before, ahead of Due Soonest (the workload save, walked at 1440 on
 * `bbb82253`).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { ORIENTATION, courseworkOf } from '@/engine/systems/coursework';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { CourseworkPane } = await import('@/ui/components/CourseworkPane');

const ZONE = 'America/New_York';
const at = (month: number, day: number, hour: number) => instantFromZoned({ year: 2026, month, day, hour, minute: 0 }, ZONE);
const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function drawn(sim: Simulation): string {
  h.sim = sim;
  return textOf(renderToStaticMarkup(createElement(CourseworkPane)).replace(/<!-- -->/g, ''));
}

describe('the Coursework tab’s first view', () => {
  it('opens on the first week while a session is to come, and keeps it, below the work, once all five are done', () => {
    const sim = life('ed17-first-week');
    sim.advanceTo(at(8, 24, 8));
    expect(ORIENTATION.some((o) => courseworkOf(sim, sim.player)!.orientation.done[o.task] === undefined)).toBe(true);
    const before = drawn(sim);
    const week = before.indexOf('Your first week, August 24 to 28.');
    expect(week).toBeGreaterThanOrEqual(0);
    expect(week).toBeLessThan(before.indexOf('Work Set'));
    // The week played: all five sessions attended, as the clock brings them.
    sim.advanceTo(at(8, 29, 12));
    expect(ORIENTATION.every((o) => courseworkOf(sim, sim.player)!.orientation.done[o.task] !== undefined)).toBe(true);
    const after = drawn(sim);
    // Due Soonest and the pieces set at the week's last session first, each card under its course's code; the week after.
    expect(after.indexOf('Due Soonest')).toBe(0);
    const done = after.indexOf('Your first week, August 24 to 28.');
    expect(done, 'still on the tab').toBeGreaterThan(after.lastIndexOf('DRAM '));
    expect(after.lastIndexOf('DRAM ')).toBeGreaterThan(0);
  }, 120_000);
});
