/**
 * The in-world material's words, on the screens that show them (from 2026-10-17, the owner's brief 14, its material area:
 * docs/verification/language-2026-10-17/material/). A practice brief's scene, its reasons for what it asks and each
 * reading's words reach the brief's pane whole. A class scene's summary and every answer's reason reach the table work
 * once the scene is shown, and a reason the text cuts against is the feedback note's own words. Neither screen prints a
 * piece of an assembled sentence: no doubled stop, no space before a stop, no leaked value.
 *
 * The briefs' and the scenes' words were reviewed for the brief and rewritten where they read as the game describing
 * itself; this holds each one to the screen it was written for, so a rewrite that the pane drops or garbles fails here.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { BRIEFS } from '@/engine/content/briefs';
import { SCENES, templateFor } from '@/engine/content/coursework';
import { courseworkOf, noteText, questionsFor, setWork, show } from '@/engine/systems/coursework';
import { scenesFor } from '@/engine/systems/learning';

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
const { CourseworkPane } = await import('@/ui/components/CourseworkPane');

const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/<\/?(?:strong|span|em|b|i)(?:\s[^>]*)?>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** What an assembled sentence must never print. */
const FAULTS = [/\.\s*\./, /\s[.,;:]/, /\bundefined\b/, /\bNaN\b/, /\[object Object\]/, /,\s*\./];
const sound = (text: string) => FAULTS.filter((f) => f.test(text)).map(String);

describe('a practice brief’s words, on its pane', () => {
  const sim = life('material-words-briefs');
  it('shows every brief’s scene, its reasons and its readings whole, each sentence sound', () => {
    h.sim = sim;
    for (const b of BRIEFS) {
      const text = words(renderToStaticMarkup(createElement(BriefPane, { genre: b.kinds[0]!, brief: b.id, onOpen: () => undefined, practice: (id: string) => createElement('span', { 'data-practice': id }) })));
      for (const k of ['logline', 'circumstances', 'relationship', 'you', 'reader', 'objective', 'obstacle'] as const) expect(text, `${b.id}: ${k}`).toContain(b[k]);
      for (const beat of b.beats) expect(text, `${b.id}: a beat`).toContain(beat.what);
      expect(text, `${b.id}: why.beats`).toContain(b.why.beats!);
      for (const f of ['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const) if (b[f] > 0 && b.why[f]) expect(text, `${b.id}: why.${f}`).toContain(`. ${b.why[f]}`);
      if (b.why.language) expect(text, `${b.id}: why.language`).toContain(`: ${b.why.language}`);
      if (b.why.techniques && b.techniques) expect(text, `${b.id}: why.techniques`).toContain(`. ${b.why.techniques}`);
      if (b.why.allows && b.allows) expect(text, `${b.id}: why.allows`).toContain(`. ${b.why.allows}`);
      for (const r of b.readings) expect(text, `${b.id}/${r.id}`).toContain(`${r.label}. ${r.reading} It rests on: ${r.rests} Fully prepared`);
      const own = [b.logline, b.circumstances, b.relationship, b.you, b.reader, b.objective, b.obstacle, ...b.beats.map((x) => x.what), ...Object.values(b.why), ...b.readings.flatMap((r) => [r.reading, r.rests])];
      for (const s of own) expect(sound(` ${s} `), `${b.id}: ${s}`).toEqual([]);
      for (const s of own) expect(/[.?!”’)]$/.test(s!), `${b.id}, a whole sentence: ${s}`).toBe(true);
    }
  });

  // The allows notes were rewritten on 2026-10-17 to say which way the scene can be played ("It can only be played
  // set"), where they had said only that "the structure is set"; a note that names a choice the brief doesn't allow
  // would tell the player the opposite of the rule, so each one is held to the brief's own `allows`.
  it('names in an allows note the very choice the brief allows', () => {
    const noted = BRIEFS.filter((b) => b.allows && b.why.allows);
    expect(noted.length).toBeGreaterThan(0);
    for (const b of noted) {
      const allowed = Object.values(b.allows!).flat() as string[];
      const named = [...b.why.allows!.matchAll(/only be played (\w+)/g)].map((m) => m[1]);
      expect(named, `${b.id}: ${b.why.allows}`).toEqual(allowed);
    }
  });
});

describe('a class scene’s words, at the table and in the note', () => {
  it('shows every scene’s summary and each answer’s reason once it’s shown, and a cut-against reason is the note’s', () => {
    const sim = life('material-words-scenes');
    h.sim = sim;
    const t = templateFor('DRAM 103a/b', 'fall')!;
    expect(scenesFor(t, 'DRAM 103a/b', [], 1).length).toBeGreaterThan(0);
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 })!;
    for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
    for (const d of ['familiarity', 'memorization', 'rehearsal', 'partner'] as const) a.prep[d] = 0.95;
    show(sim, sim.player, a, '2026-10-01', sim.now);
    // TEST SETUP: the shown piece kept open on the pane, so its table work is drawn with each answer's reason.
    a.status = 'open';
    for (const s of SCENES) {
      for (const role of [0, 1] as const) {
        a.sceneId = s.id;
        a.role = role;
        const qs = questionsFor(a);
        const most = Math.max(...qs.map(({ options }) => options.length));
        for (let k = 0; k < most; k += 1) {
          for (const { q, options } of qs) a.answers[q.id] = options[Math.min(k, options.length - 1)]!.id;
          const text = words(renderToStaticMarkup(createElement(CourseworkPane)));
          expect(text, `${s.id}: summary`).toContain(`${s.where}: you play ${s.roles[role].name}`);
          expect(text, `${s.id}: summary`).toContain(s.summary);
          for (const { options } of qs) {
            const o = options[Math.min(k, options.length - 1)]!;
            expect(text, `${s.id}/${o.id}: its words`).toContain(o.text);
            if (o.why) expect(text, `${s.id}/${o.id}: its reason`).toContain(`${o.supported ? 'What it rests on' : 'What cuts against it'}: ${o.why}`);
          }
        }
        for (const { q, options } of qs) for (const o of options.filter((x) => !x.supported)) {
          a.answers[q.id] = o.id;
          expect(noteText(a, { kind: 'choice', question: q.id }), `${s.id}/${o.id}: the note`).toBe(`${q.label}: ${o.why} As ${s.roles[role].name} in ${s.play}.`);
        }
      }
      const own = [s.summary, ...(s.facts ?? []), ...[s.circumstances, s.relationship, ...s.roles.flatMap((r) => [r.objective, r.obstacle, r.tactic])].flat().flatMap((o) => [o.text, o.why ?? ''])].filter(Boolean);
      for (const x of own) expect(sound(` ${x} `), `${s.id}: ${x}`).toEqual([]);
      for (const o of [s.circumstances, s.relationship, ...s.roles.flatMap((r) => [r.objective, r.obstacle, r.tactic])].flat()) if (o.why) expect(/[.?!”’)]$/.test(o.why), `${s.id}/${o.id}, a whole sentence: ${o.why}`).toBe(true);
    }
    expect(courseworkOf(sim, sim.player)).toBeDefined();
  });
});
