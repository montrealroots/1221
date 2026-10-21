/**
 * The defects brief 19's merges left on the built app's screens, each held here by a test that fails with its fix taken
 * out (the app part, `docs/verification/career-2026-10-20/app/`, 2026-10-21):
 *
 * 1. The clock's stop with a third button: at 390 wide, the stop at a meeting with his office (How This Works, Stand
 *    Here, Ask To Move and Go) ran a few pixels past the dialog's right edge, because a dialog's footer never wrapped its
 *    buttons. The walk measured it on the built app (`app/walk-*.txt`); this holds the rule that fixed it.
 * 2. The calendar's legend had no row for the career's category, so a career item was drawn with no color and called
 *    "Career" only by its category's own name. Every category the calendar can hold has its row now.
 * 4. Found by the walk: the showcase's two scenes each draw a How You'll Play It chooser on the School's Coursework tab,
 *    and both named their radio groups alike, so Tab stopped only in the first and the second's choices were reached
 *    only by the arrow keys running on from the first. Each chooser's groups are its own now. (The third defect, a
 *    classmate called Jordan beside the agent's notices, is the walk's `jordan.ts` and REPORT.md's to answer.)
 *
 * PLAYER JOURNEY: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, a first-year at Yale from
 * Monday August 24, 2026, played by the clock and the commands a player sends: headshots and a résumé, then a
 * submission to the first open call posted to her; and played to the last term, where the showcase's scenes are chosen.
 * TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves (`tended`), as the work loop's
 * journeys keep it; and, on the way to the last term, the coursework prepared each midnight, as the showcase journey's.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CALENDAR_LEGEND, LEGEND_BY_CATEGORY, entriesBetween } from '@/engine/world/calendar';
import { stopChoices } from '@/engine/world/clock';
import { MEETING_KIND } from '@/engine/systems/proagent';
import { REPLY_KIND, projectOf } from '@/engine/systems/projobs';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'coursework' }));

// The screens' kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key.startsWith('tab:') ? h.tab : initial) as T, () => undefined] as const };
});

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, zone);
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** The screen at a route and tab, as its markup. */
const drawn = (sim: Simulation, route: string, tab = 'overview'): string => { h.sim = sim; h.tab = tab; return renderToStaticMarkup(createElement(WorkspaceRouter, { route })).replace(/<!-- -->/g, ''); };

describe('1. a dialog’s footer wraps its buttons', () => {
  it('lets the stop’s buttons go to a second line where they don’t fit, as a button asks of its slot, so Ask To Move can’t run past the dialog’s edge at 390', () => {
    const css = readFileSync('src/styles/app.css', 'utf8');
    const rule = (selector: string) => new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    // The premise: a button keeps its width and never shrinks (`flex: none`), so a row of them that doesn't fit has to wrap.
    expect(rule('.btn')).toMatch(/flex:\s*none/);
    expect(rule('.modal-foot')).toMatch(/display:\s*flex/);
    expect(rule('.modal-foot')).toMatch(/flex-wrap:\s*wrap/);
    // The stop at a meeting is the one with a third button beside Stand Here and Go.
    expect(stopChoices(MEETING_KIND).map((c) => c.label)).toEqual(['Ask To Move']);
  });
});

describe('2. the calendar’s legend has a row for the career', () => {
  it('gives every category the calendar can hold a row of its own, with a color no other row has', () => {
    const declared = /export type CalendarCategory = ([^;]+);/.exec(readFileSync('src/engine/world/calendar.ts', 'utf8'))![1]!.match(/'([a-z]+)'/g)!.map((x) => x.slice(1, -1));
    expect(declared).toContain('career');
    for (const category of declared) expect(LEGEND_BY_CATEGORY[category], category).toBeDefined();
    expect(new Set(CALENDAR_LEGEND.map((e) => e.colour)).size).toBe(CALENDAR_LEGEND.length);
    expect(LEGEND_BY_CATEGORY.career!.label).toBe('Career');
  });

  it('PLAYER JOURNEY: a first-year’s submission to an open call puts the casting office’s answer on the calendar, drawn in the Career color and named Career in the legend', () => {
    const sim = createSave(1, 'app-legend', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    // A Saturday morning at ten, the first one with no call: headshots and a résumé by their own commands.
    tended(sim, at(2026, 8, 29, 10));
    sim.must({ kind: 'pro.headshots', payload: {} });
    sim.must({ kind: 'pro.update_resume', payload: {} });
    // The Mondays' postings, a week at a time, until an open call she can submit to is up.
    let open;
    for (let k = 0; k < 30 && !open; k += 1) {
      open = sim.player.pro!.opportunities.find((o) => o.status === 'open' && o.via === 'open' && sim.now < o.submitBy && sim.execute({ kind: 'pro.submit', payload: { opportunityId: o.id } }).ok);
      if (!open) tended(sim, sim.now + 7 * MS_DAY);
    }
    expect(open, 'an open call within thirty weeks').toBeDefined();
    const answer = sim.universe.scheduled.find((i) => i.kind === REPLY_KIND && i.status === 'pending' && i.refId === open!.id)!;
    expect(answer.label).toBe(`Casting Answers: ${projectOf(open!).role.part}`);
    const entry = entriesBetween(sim, answer.at - 1, answer.at + 1).find((e) => e.id === answer.id)!;
    expect(entry.category).toBe('career');
    const career = LEGEND_BY_CATEGORY[entry.category]!;
    expect(career.label).toBe('Career');
    // The Calendar screen, on the answer's month: its pill drawn in the career's color, and the legend's row with what it holds.
    const html = drawn(sim, '/workspace/calendar');
    expect(html).toContain(`title="${career.description}"`);
    expect(html).toMatch(new RegExp(`<span class="cal-swatch" style="background:${career.colour}"></span>Career</span>`));
    expect(html).toContain(`--event-colour:${career.colour}`);
  });
});

describe('4. each How You’ll Play It chooser has radio groups of its own', () => {
  it('PLAYER JOURNEY: the last term’s showcase scenes, chosen, draw two choosers on Coursework whose groups share no name, so Tab stops in each', () => {
    // A life played to its last term's first day, the clock six hours at a time, as the showcase journey plays it.
    // TEST SETUP, the showcase journey's: every open piece of coursework prepared each midnight.
    const sim = createSave(1, 'showcase-final', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
      for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    });
    tended(sim, at(2029, 1, 8, 12));
    const sc = sim.player.pro!.showcase!;
    const scenes = [...new Map(sc.options!.map((o) => [o.scene, o])).values()].slice(0, 2);
    sim.must({ kind: 'school.choose_showcase', payload: { options: scenes.map((o) => `${o.scene}:${o.role}`) } });
    const html = drawn(sim, '/workspace/school', 'coursework');
    // Each chooser's table, and the names of the radio groups in it.
    const tables = [...html.matchAll(/<table>([\s\S]*?)<\/table>/g)].map((m) => [...new Set([...m[1]!.matchAll(/type="radio" name="([^"]+)"/g)].map((x) => x[1]!))]).filter((names) => names.length);
    expect(tables.length).toBeGreaterThanOrEqual(2);
    for (const names of tables) expect(names.map((n) => n.replace(/^.*axis-/, '')).sort()).toEqual(['pace', 'scale', 'structure']);
    const all = tables.flat();
    expect(new Set(all).size).toBe(all.length);
  });
});
