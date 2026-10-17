/**
 * A genre's register on the screen (from 2026-10-16, `components/BriefPane.tsx`): the brief's The Genre Asks, the
 * forecast's and the last take's note naming the concern behind the limit, and the genre's look. Drawn with
 * react-dom/server from a save played through its commands, the game's hooks mocked as tests/defects-r8-1.test.ts mocks
 * them.
 *
 * Nordic noir's brief says Feeling Held In and Suspense Held, and that the research's claim is where it comes from;
 * social realism's says Caught Live; a steampunk brief says it's SLATE's reading of its conventions, since the research
 * found nothing on how it's played. A take held back most by composure in Nordic noir says Nordic Noir's Feeling Held In
 * asks for it, in the take's line and in Your Takes Of It.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { CONCERNS } from '@/engine/content/concerns';
import { genreState } from '@/engine/systems/engagement';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

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

const { BriefPane } = await import('@/ui/components/BriefPane');

const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const pane = (sim: Simulation, genre: string, brief?: string) => {
  h.sim = sim;
  return words(renderToStaticMarkup(createElement(BriefPane, { genre, ...(brief ? { brief } : {}), onOpen: () => undefined, practice: (id: string) => createElement('span', { 'data-practice': id }) })));
};
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

describe('a genre’s register, on the brief', () => {
  it('names each concern, what it weighs and draws on and what preparation answers it, and where it comes from', () => {
    const sim = life('genre-screens');
    const noir = pane(sim, 'nordic_noir');
    expect(noir).toContain('The Genre Asks');
    expect(noir).toContain(`${CONCERNS.restraint.label}: ${CONCERNS.restraint.words}`);
    expect(noir).toContain(`${CONCERNS.tension.label}: ${CONCERNS.tension.words}`);
    expect(noir).toContain('calls on your composure and focus');
    expect(noir).toContain('This comes from the genre’s research, mostly held with low confidence.');
    const realism = pane(sim, 'social_realism');
    expect(realism).toContain(`${CONCERNS.spontaneity.label}: ${CONCERNS.spontaneity.words}`);
    expect(realism).not.toContain(CONCERNS.restraint.label);
    expect(pane(sim, 'steampunk')).toContain('so this is estimated from its conventions');
  });

  it('says on the take’s line and in Your Takes Of It which concern asked for what held the take back', () => {
    const sim = life('genre-screens-take');
    const rest = () => Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, morale: 60, hygiene: 80, condition: 90 }); // TEST SETUP
    // TEST SETUP: far along everywhere but composure, the genre known.
    Object.assign(sim.player.craft!, Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 80])));
    Object.assign(sim.player.attrs!, { presence: 80, composure: 15, listening: 80, imagination: 80, focus: 80, adaptability: 80, discipline: 80 });
    genreState(sim.player, 'nordic_noir').familiarity = 90;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 29, hour: 13 }, 'America/New_York'));
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const press = (kind: string, payload: Record<string, unknown>) => { rest(); const r = sim.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); };
    press('brief.choose', { brief: noir.id, reading: noir.readings[0]!.id });
    for (const step of ['read', 'lines', 'rehearse', 'read', 'lines', 'rehearse']) press('brief.prepare', { brief: noir.id, step });
    // Before the take: the forecast's line already names it.
    expect(pane(sim, 'nordic_noir')).toMatch(/Your Composure holds back [A-Z][a-z]+ by [\d.]+ points: Nordic Noir’s Feeling Held In asks for it\./);
    press('practice.self_tape', { genre: 'nordic_noir', brief: noir.id });
    const after = pane(sim, 'nordic_noir');
    expect(after).toContain('The Last Take');
    expect(after.match(/Nordic Noir’s Feeling Held In asks for it/g)!.length).toBeGreaterThanOrEqual(3);
  });
});
