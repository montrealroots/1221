/**
 * A grayed control on the School screen says why in words (from 2026-10-12): Call In Sick, Read It and Research It said
 * it only in their tooltips, which a phone never shows and a keyboard never reaches (the completeness critic of
 * 2026-10-12, docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md, item 14). Each now has a `WhyNot` line.
 *
 * The screen is rendered to markup (react-dom/server) over real saves, as tests/defects-g8-2.test.ts renders it:
 * `useGame` stands in for the provider and `run` is the save's own `execute`. Each reason is looked for in the text with
 * every title attribute taken out first, so a tooltip can't pass for it. PLAYER JOURNEYS play through commands; TEST
 * SETUP marks state set by hand.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { ESTIMATE, sickRefusal } from '@/engine/systems/school';
import { readRefusal, researchRefusal } from '@/engine/systems/playreading';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { lockedBecause } from '@/engine/world/tutorial';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
}));

// The School screen's kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

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

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Played by somebody who looks after themselves, as tests/defects-g8-2.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

/** The School screen at a tab: its markup, and the words a player sees, with every tooltip taken out before the tags. */
function drawn(sim: Simulation, tab: string): { html: string; shown: string } {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(SchoolWorkspace)).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
/** The buttons of that label, grayed with that reason as their tooltip. */
const grayed = (html: string, label: string, why: string) => [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].filter((m) => m[2] === label && m[1]!.includes('disabled=""') && m[1]!.includes(`title="${why}"`));
const times = (text: string, words: string) => text.split(words).length - 1;

describe('Call In Sick, grayed, says why under the week’s head', () => {
  it('PLAYER JOURNEY: well on a class-day morning, and then called in sick, each in words, not only in the tooltip', () => {
    const sim = student('whynot-school-sick');
    tended(sim, at(2026, 9, 8, 7));
    const well = 'You’re well enough to go. Staying away would count as an unexcused absence.';
    expect(sickRefusal(sim, sim.player)).toBe(well);
    const before = drawn(sim, 'classes');
    expect(grayed(before.html, 'Call In Sick', well)).toHaveLength(1);
    expect(before.shown).toContain(well);

    // TEST SETUP: unwell, as an illness would leave them, below the condition calling in sick excuses.
    sim.player.wellbeing.condition = ESTIMATE.sickBelow - 10;
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    const again = 'You’ve called in sick today already.';
    expect(sickRefusal(sim, sim.player)).toBe(again);
    const after = drawn(sim, 'classes');
    expect(grayed(after.html, 'Call In Sick', again)).toHaveLength(1);
    expect(after.shown).toContain(again);
    expect(after.shown).not.toContain(well);
  }, 60_000);
});

describe('Read It and Research It, grayed, say why above the plays', () => {
  it('PLAYER JOURNEY: before the tour every Read It is grayed, and the reason is said once in words', () => {
    const sim = student('whynot-school-read');
    const why = 'You don’t know where the library is yet. The building tour in Orientation shows you.';
    expect(CONTEMPORARY_PLAYS.map((p) => readRefusal(sim, sim.player, p.id))).toEqual(CONTEMPORARY_PLAYS.map(() => why));
    const { html, shown } = drawn(sim, 'coursework');
    expect(grayed(html, 'Read It', why)).toHaveLength(CONTEMPORARY_PLAYS.length);
    expect(times(shown, why)).toBe(1);
  }, 60_000);

  it('PLAYER JOURNEY: two plays read, a class-day morning has the hour for another read but not for research, and says which, once', () => {
    const sim = student('whynot-school-research');
    tended(sim, at(2026, 9, 5, 18));
    for (const playId of ['the-children', 'fleabag']) sim.must({ kind: 'plays.read', payload: { playId } });
    tended(sim, at(2026, 9, 8, 7, 45));
    const why = researchRefusal(sim, sim.player, 'the-children');
    expect(why).toMatch(/^Classes starts at .*: there isn’t the time before it\.$/);
    expect(researchRefusal(sim, sim.player, 'fleabag')).toBe(why);
    expect(readRefusal(sim, sim.player, 'the-children')).toBeUndefined();
    const { html, shown } = drawn(sim, 'coursework');
    expect(grayed(html, 'Research It', why!)).toHaveLength(2);
    expect(grayed(html, 'Read It Again', why!)).toHaveLength(0);
    expect(times(shown, `Research It: ${why}`)).toBe(1);
    expect(shown).not.toContain(`Not now: ${why}`);
  }, 60_000);

  // The chapter that opens Read It opens the School too, so this screen is reached by its address: the rail doesn't list
  // it yet, and nothing stops the route. Research It shows only after a read, so it's never locked here.
  it('PLAYER JOURNEY: in a life begun with the guide, its chapter unread, Read It says what to read, as its tooltip does', () => {
    const sim = createSave(1, 'whynot-school-guided', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial: true });
    tended(sim, at(2026, 9, 5, 18));
    expect(readRefusal(sim, sim.player, 'sweat')).toBeUndefined();
    const why = lockedBecause(sim, 'plays.read')!;
    expect(why).toMatch(/^Read “.*” in the guide first\./);
    const { html, shown } = drawn(sim, 'coursework');
    expect(grayed(html, 'Read It', why)).toHaveLength(CONTEMPORARY_PLAYS.length);
    expect(times(shown, why)).toBe(1);
  }, 60_000);
});
