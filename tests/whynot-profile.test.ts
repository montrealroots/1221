/**
 * A refused control on the Player Profile says why in words on the screen, not only in a title, which a touch screen
 * and a keyboard can't reach (from 2026-10-12, the completeness critic's item 14 in
 * docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md). Until then a practice focus refused (Live With A Partner, with
 * no class to ask) was grayed out in its list with its reason nowhere, not even in a title; it's said under the focus
 * then, by the house’s WhyNot, until 2026-10-13, when that refusal went, reached by no play. Practice An Hour and Study It already said theirs under the button, and are held here
 * too.
 *
 * The screen is rendered to markup (react-dom/server) over real saves, as tests/defects-r8-1.test.ts renders it:
 * `useGame` stands in for the provider and `run` is the save's own `execute`. An exercise's practice opens on a press
 * (`useState(false)`), so React's `useState(false)` is answered `true` while `h.opened` is set, which opens every
 * exercise's practice at once (nothing else on the Profile keeps a `false` state). What the player reads is the markup
 * with every title attribute taken out, then its tags. PLAYER JOURNEYS play through the clock and the commands; TEST
 * SETUP sets a state by hand to reach one rule, and says so.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { EXERCISES, FOCUS, PRACTICE } from '@/engine/content/practice';
import { focusRefusal, practiceRefusal } from '@/engine/systems/practice';
import { studyRefusal } from '@/engine/systems/engagement';
import { FILM_GENRES } from '@/engine/content/film-genres';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, opened: false }));

// An exercise's practice shows after a press (`openUp`): answered open while `h.opened` is set.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((init: unknown) => (h.opened && init === false ? [true, () => undefined] : real.useState(init))) as typeof real.useState;
  return { ...real, useState, default: { ...real, useState } };
});

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

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

const config = () => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const pending = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.requiresPlayer);
/** TEST SETUP: a student with nothing waiting on them, as tests/defects-r8-1.test.ts makes one, rested. */
function student(seed: string): Simulation {
  const sim = createSave(1, seed, config());
  for (const item of pending(sim)) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
  return sim;
}

/** The Profile as the player has it: its markup, and its words with every title taken out before the tags. */
function drawn(sim: Simulation, opened: boolean): { html: string; text: string } {
  h.sim = sim;
  h.opened = opened;
  try {
    const html = renderToStaticMarkup(createElement(ProfileWorkspace));
    return { html, text: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
  } finally {
    h.opened = false;
  }
}
/** How many times a string is in another. */
const count = (s: string, of: string) => s.split(of).length - 1;
/** An exercise that isn't partnered or on the feet: what refuses it is the hour, not the class or the body. */
const desk = EXERCISES.find((e) => !e.partnered && !e.feet)!;
/** An exercise the player can open on the Profile, partnered or not, one per row. */
const shown = (sim: Simulation) => EXERCISES.filter((e) => drawn(sim, false).html.includes(`>${e.label}…</button>`));

describe('a practice focus, on the Player Profile', () => {
  // Until 2026-10-13 this held Live With A Partner refused with the class taken away by hand, grayed out with “It takes a
  // classmate, and you have no class to ask.” under it: a refusal no play reached, since every student keeps a class,
  // and it went that day with the Profile’s reasons under the focus (found by that day’s final defect pass).
  it('offers every focus to every opened exercise, none grayed out and none said to be refused, even with the class taken away by hand', () => {
    const sim = student('whynot-profile-live');
    const opened = shown(sim);
    expect(opened.length).toBeGreaterThan(0);
    // TEST SETUP: the class taken away by hand; no command takes a student's class away.
    sim.player.school!.classmates = [];
    for (const f of Object.keys(FOCUS)) expect(focusRefusal(f)).toBeUndefined();
    expect(focusRefusal('shouting')).toBe('There’s no such way to practice.');
    const { html, text } = drawn(sim, true);
    expect(html).not.toMatch(/<option[^>]*disabled/);
    for (const f of Object.keys(FOCUS) as (keyof typeof FOCUS)[]) {
      expect(count(html, `<option value="${f}"`)).toBe(opened.length);
      expect(text).not.toContain(`${FOCUS[f].label}: `);
    }
    expect(text).not.toContain('no class to ask');
  });
});

describe('Practice An Hour refused, on the Player Profile', () => {
  it('PLAYER JOURNEY: four hours practiced today, says so under the button, outside its title', () => {
    const sim = student('whynot-profile-hours');
    for (let i = 0; i < PRACTICE.dailyHours; i += 1) {
      const r = sim.execute({ kind: 'practice.exercise', payload: { exercise: desk.id, focus: 'steady' } });
      expect(r.ok, r.error).toBe(true);
    }
    const why = practiceRefusal(sim, sim.player, desk)!;
    expect(why).toBe(`You’ve practiced ${PRACTICE.dailyHours} hours today, and more stops helping after that. Practice again tomorrow.`);
    const { html, text } = drawn(sim, true);
    const opened = shown(sim);
    // The button is refused and keeps its title.
    expect(count(html, `title="${why}" disabled="">Practice An Hour</button>`)).toBe(opened.length);
    expect(count(text, why)).toBe(opened.length);
  });
});

describe('Study It refused, on the Player Profile', () => {
  it('PLAYER JOURNEY: half an hour before a class, says so under the button, outside its title', () => {
    const sim = createSave(1, 'whynot-profile-study', config());
    const next = pending(sim).filter((i) => i.at > sim.now + 2 * 60 * 60_000).sort((a, b) => a.at - b.at)[0]!;
    expect(next).toBeDefined();
    sim.advanceTo(next.at - 30 * 60_000);
    const genre = FILM_GENRES[0]!.id;
    const why = studyRefusal(sim, sim.player, genre)!;
    expect(why).toMatch(/starts at .*: there isn’t the time before it\.$/);
    const { html, text } = drawn(sim, false);
    expect(html).toContain(`title="${why}" disabled="">Study It</button>`);
    // One under each genre shown.
    expect(count(text, why)).toBe(count(html, '>Study It</button>'));
    // The falsifiability test: with time before it, nothing refuses it and nothing is said. TEST SETUP: the same save
    // with what waits on the player taken away by hand.
    const free = createSave(1, 'whynot-profile-study', config());
    for (const item of pending(free)) free.timeline.cancel(item.id, free.now);
    expect(studyRefusal(free, free.player, genre)).toBeUndefined();
    expect(drawn(free, false).text).not.toContain('there isn’t the time before it');
  });
});
