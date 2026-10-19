/**
 * Table Work's select on a text not read far enough (from 2026-10-16). It's drawn grayed, with the reason under its
 * heading. Until then it took an answer the command then refused (`school.choose`: "Read it first: table work is done on
 * a text you know."), said only in a toast after the choice. The built app's acceptance run found it on brief 10's tested
 * commit, on a life whose first open work was a play not yet read (tools/acceptance-ui.mjs, "coursework: table work
 * answered from its select"). One rule now (`tableWorkRefusal`), read by the command and by the select.
 *
 * Played through `school.prepare` and `school.choose`, the Coursework pane drawn as the player has it. TEST SETUP: the
 * work written onto the coursework, as tests/defects-g8-9.test.ts does; a life made without the guide, so the feature's
 * chapter doesn't gray the select first; the clock's own commitments cleared and the day kept rested.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf, questionsFor, tableWorkRefusal, type Assignment } from '@/engine/systems/coursework';

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
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
const { CourseworkPane } = await import('@/ui/components/CourseworkPane');

const UNREAD = 'Read the text first. You can answer the Table Work questions once you know it.';
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), tutorial: false, homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = <T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<T>({ kind, payload }); };
const today = (sim: Simulation) => new Intl.DateTimeFormat('en-CA', { timeZone: sim.homeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(sim.now));

/** TEST SETUP: Table Work on The Cherry Orchard's fourth act, nothing of it read yet. */
function tableWork(sim: Simulation): Assignment {
  const cw = courseworkOf(sim, sim.player)!;
  const a: Assignment = {
    id: `tw-unread-${cw.assignments.length}`, course: 'DRAM 163b', template: 'table-work', term: 1, setOn: today(sim), dueOn: '2026-12-01', sceneId: 'cherry-orchard-4', role: 0,
    prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 0])) as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  cw.assignments.push(a);
  return a;
}

/** Each of the work's Table Work selects as the pane draws it: whether it's grayed, and its card's words. */
function drawn(sim: Simulation, a: Assignment): { grayed: boolean[]; text: string } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(CourseworkPane)).replace(/<!-- -->/g, '');
  const grayed = questionsFor(a).map(({ q }) => {
    const tag = new RegExp(`<select id="${a.id}-${q.id}"[^>]*>`).exec(html)?.[0];
    expect(tag, `the select for ${q.id}`).toBeDefined();
    return /\sdisabled=""/.test(tag!);
  });
  return { grayed, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}

describe('Table Work on a text not yet read', () => {
  it('PLAYER JOURNEY: Table Work on The Cherry Orchard not yet read draws its select grayed, the reason under its heading, and school.choose refuses in the same words; Read The Play pressed through school.prepare until the play is read to 30%, the select opens, the reason goes, and an answer is taken', () => {
    const sim = life('table-work-unread');
    const a = tableWork(sim);
    const qs = questionsFor(a);
    expect(qs.length).toBeGreaterThan(0);
    const { q, options } = qs[0]!;
    expect(tableWorkRefusal(a)).toBe(UNREAD);
    let view = drawn(sim, a);
    expect(view.grayed.every(Boolean)).toBe(true);
    expect(view.text).toContain(`Not now: ${UNREAD}`);
    const refused = go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options[0]!.id });
    expect(refused.ok).toBe(false);
    expect(refused.error).toBe(UNREAD);
    expect(a.answers[q.id]).toBeUndefined();
    // Read, as a player reads it, until the play is known well enough.
    for (let n = 0; n < 6 && a.prep.familiarity < 0.3; n += 1) expect(go(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' }).ok).toBe(true);
    expect(a.prep.familiarity).toBeGreaterThanOrEqual(0.3);
    expect(tableWorkRefusal(a)).toBeUndefined();
    view = drawn(sim, a);
    expect(view.grayed.some(Boolean)).toBe(false);
    expect(view.text).not.toContain(UNREAD);
    expect(go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options[0]!.id }).ok).toBe(true);
    expect(a.answers[q.id]).toBe(options[0]!.id);
  });
});
