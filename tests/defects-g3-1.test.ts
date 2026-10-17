/**
 * Four things the Player Profile and a brief's pane drew but didn't do, until 2026-10-12:
 *
 * - The traits under "Chosen at the start." were drawn with Open, in a panel with no LookRegion, so Open drew them as
 *   plain names and none of them opened, whatever chapter was read.
 * - Study It and Study The Genre said nothing, and the work studied (`study`'s `with`) was read by nothing.
 * - A brief's What To Work On passed over a preparation only, so a day's condition could be named the weakness, with a
 *   brief suggested for it at 0% of the work and practice offered for it. `tools/brief-journeys.ts` copied the filter.
 * - How the reader plays a brief leaned the take and wasn't on the screen, and `READER_PLAYS`' labels were read by
 *   nothing.
 *
 * The screens are rendered to markup (react-dom/server) over real saves. `useGame` stands in for the provider, which
 * needs a browser: `run` is the save's own `execute`, and a toast is kept for the test to read. Gated is the real one,
 * with its onClick kept so the test can press it.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { CHAPTERS } from '@/engine/content/tutorial';
import { evenCraft } from '@/engine/systems/school';
import { abilityFull, levelOf } from '@/engine/systems/attributes';
import { ABILITY_DEFS, MASTERED, type AbilityId } from '@/engine/content/abilities';
import { recommendations } from '@/engine/systems/experience';
import { exerciseFor } from '@/engine/content/practice';
import { matchedTier } from '@/engine/systems/practice';
import { BRIEFS, BRIEF_BY_ID } from '@/engine/content/briefs';
import { FILM_GENRES } from '@/engine/content/film-genres';
import { playOfGenre } from '@/engine/systems/engagement';
import { READER_PLAYS } from '@/engine/systems/briefs';
import { DIMENSION_LABEL } from '@/engine/content/tasks';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  toasts: [] as { message: string; tone?: string }[],
  clicks: [] as { feature: string; onClick?: (e?: unknown) => void }[],
}));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string, tone?: string) => { h.toasts.push({ message, ...(tone ? { tone } : {}) }); },
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, onClick: props.onClick as ((e?: unknown) => void) | undefined }); return ce(real.Gated, props); } };
});

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { BriefPane, readerPlaysWords } = await import('@/ui/components/BriefPane');

function student(seed: string, traits: string[] = [], tutorial = false): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: traits, ...(tutorial ? { tutorial: true } : {}) });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute({ kind, payload }); };
/** A take of a brief through the commands: its first reading chosen, prepared six rounds, its genre studied, taped. */
function taped(sim: Simulation, id: string) {
  const b = BRIEF_BY_ID[id]!;
  expect(go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }).ok).toBe(true);
  for (let i = 0; i < 6; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
  for (let i = 0; i < 3; i += 1) go(sim, 'genre.study', { genre: b.kinds[0] });
  expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
}
const profile = (sim: Simulation) => { h.sim = sim; h.clicks = []; h.toasts = []; return renderToStaticMarkup(createElement(ProfileWorkspace)); };
const pane = (sim: Simulation, genre: string, brief?: string) => {
  h.sim = sim; h.clicks = []; h.toasts = [];
  return renderToStaticMarkup(createElement(BriefPane, { genre, ...(brief ? { brief } : {}), onOpen: () => undefined, practice: (id: string) => createElement('span', { 'data-practice': id }) }));
};
const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);
const recsOf = (sim: Simulation) => recommendations((id) => levelOf(sim, sim.player, id as never), (id) => (isAbility(id) ? abilityFull(sim, sim.player, id as AbilityId) : MASTERED), sim.player.work ?? [], (id) => exerciseFor(id as never), matchedTier);
const TRAIT_OPENS = /<button[^>]*class="link"[^>]*>Even Tempered<\/button>/;

describe('the traits on the Player Profile', () => {
  it('open, as the guide says each trait does, once How You Are is read, and not before', () => {
    // A life with no guide has everything open.
    expect(profile(student('g3-traits', ['even_tempered']))).toMatch(TRAIT_OPENS);
    // A guided life: a plain name until the chapter that opens a trait is read, a way in after.
    const sim = student('g3-traits-guided', ['even_tempered'], true);
    const body = CHAPTERS.findIndex((c) => c.opens.includes('look.trait'));
    expect(CHAPTERS[body]!.id).toBe('body');
    for (const c of CHAPTERS.slice(0, body)) expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: c.id } }).ok).toBe(true);
    const before = profile(sim);
    expect(before).toContain('Even Tempered');
    expect(before).not.toMatch(TRAIT_OPENS);
    expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: 'body' } }).ok).toBe(true);
    expect(profile(sim)).toMatch(TRAIT_OPENS);
  });
});

describe('Study It and Study The Genre', () => {
  const withOf = (g: string) => { const w = playOfGenre(g); return w ? `${w.title}${w.by ? `, by ${w.by}` : ''}` : 'a film of the kind'; };
  const familiarity = (sim: Simulation, g: string) => sim.player.engagement?.byGenre[g]?.familiarity ?? 0;

  it('on the Profile, say the work studied and the familiarity it came to', () => {
    const sim = student('g3-study-profile');
    profile(sim);
    const g = FILM_GENRES[0]!.id;
    const press = h.clicks.find((c) => c.feature === 'genre.study')!;
    press.onClick!();
    expect(familiarity(sim, g)).toBeGreaterThan(0);
    expect(h.toasts).toEqual([{ message: expect.stringContaining(withOf(g)), tone: 'positive' }]);
    expect(h.toasts[0]!.message).toContain(`Familiarity ${familiarity(sim, g).toFixed(1)}`);
  });

  it('in a brief’s pane, say it too: a play of the kind where the game has one, a film where it hasn’t', () => {
    const withPlay = FILM_GENRES.find((g) => playOfGenre(g.id) && BRIEFS.some((b) => b.kinds[0] === g.id))!.id;
    const withFilm = FILM_GENRES.find((g) => !playOfGenre(g.id) && BRIEFS.some((b) => b.kinds[0] === g.id))!.id;
    const said: string[] = [];
    for (const g of [withPlay, withFilm]) {
      const sim = student(`g3-study-pane-${g}`);
      pane(sim, g);
      const press = h.clicks.find((c) => c.feature === 'genre.study')!;
      press.onClick!();
      expect(h.toasts).toHaveLength(1);
      expect(h.toasts[0]!.tone).toBe('positive');
      expect(h.toasts[0]!.message).toContain(withOf(g));
      expect(h.toasts[0]!.message).toContain(`Familiarity ${familiarity(sim, g).toFixed(1)}`);
      said.push(h.toasts[0]!.message);
    }
    // The work studied is the genre's own: a play for one, a film of the kind for the other.
    expect(said[0]).not.toContain('a film of the kind');
    expect(said[1]).toContain('a film of the kind');
  });
});

describe('a brief’s What To Work On', () => {
  it('names an ability or technique, never a day’s condition, and suggests no brief at 0% of the work for one', () => {
    const sim = student('g3-condition');
    // TEST SETUP: every ability full and every technique mastered but a body far from fit, so the stamina draining
    // through a take is the only thing that costs it past its preparation.
    const p = sim.player;
    p.craft = evenCraft(MASTERED);
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
    p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
    p.wellbeing.fitness = 10;
    taped(sim, 'brief-drama');
    // What the pane took until 2026-10-12: a day's condition, the first recommendation past a preparation.
    expect(recsOf(sim).find((r) => !r.target.startsWith('prep:'))?.target).toMatch(/^condition:/);
    const html = pane(sim, 'drama', 'brief-drama');
    expect(html).not.toContain('data-practice="condition:');
    expect(html).not.toContain('>What To Work On<');
    expect(html).not.toContain('(0% of what its tape is judged on)');
  });

  it('still names an ability or technique that cost the work, with its practice', () => {
    const sim = student('g3-ability');
    taped(sim, 'brief-drama');
    const top = recsOf(sim).find((r) => !r.target.includes(':'))!;
    expect(top).toBeDefined();
    const html = pane(sim, 'drama', 'brief-drama');
    expect(html).toContain('>What To Work On<');
    expect(html).toContain(`data-practice="${top.target}"`);
  });

  it('is the same weakness the journeys tool suggests a brief for', () => {
    // The tool plays a career when it's imported, so its filter is read from its source and run on each kind of target.
    const src = readFileSync('tools/brief-journeys.ts', 'utf8');
    const body = src.slice(src.indexOf('function weakness()'), src.indexOf('function nextBrief()'));
    const expr = /\.find\(\(x\) => (.+?)\);\r?\n/.exec(body)?.[1];
    expect(expr).toBeDefined();
    const keeps = new Function('x', `return ${expr};`) as (x: { target: string }) => boolean;
    for (const target of ['condition:stamina', 'condition:fatigue', 'fit:fit', 'prep:genre']) expect(keeps({ target }), target).toBe(false);
    for (const target of ['presence', 'stamina', 'emotion', 'scene']) expect(keeps({ target }), target).toBe(true);
  });
});

describe('how the reader plays a brief', () => {
  it('is in The Scene before the take: how they play it and what playing against it asks, and nothing for a voice brief', () => {
    const sim = student('g3-reader');
    const kinds = Object.keys(READER_PLAYS) as (keyof typeof READER_PLAYS)[];
    const shown = new Set<string>();
    for (const kind of kinds) {
      const b = BRIEFS.find((x) => x.medium !== 'voice' && (x.readerPlays ?? 'steady') === kind);
      if (!b) continue;
      const words = readerPlaysWords(b)!;
      expect(words.startsWith(`${READER_PLAYS[kind].label}:`)).toBe(true);
      for (const d of Object.keys(READER_PLAYS[kind].lean) as (keyof typeof DIMENSION_LABEL)[]) expect(words).toContain(DIMENSION_LABEL[d].toLowerCase());
      for (const x of Object.values(READER_PLAYS[kind].inputs).flat()) expect(words).toContain(ABILITY_DEFS.find((a) => a.id === x!.ability)!.label.toLowerCase());
      const html = pane(sim, b.kinds[0]!, b.id);
      expect(html).toContain('>How They Play It<');
      expect(html).toContain(words);
      shown.add(words);
    }
    // Steady and at least one way that leans the take, each said its own way.
    expect(shown.size).toBeGreaterThanOrEqual(2);
    const voice = BRIEFS.find((x) => x.medium === 'voice');
    if (voice) {
      expect(readerPlaysWords(voice)).toBeUndefined();
      expect(pane(sim, voice.kinds[0]!, voice.id)).not.toContain('How They Play It');
    }
  });
});
