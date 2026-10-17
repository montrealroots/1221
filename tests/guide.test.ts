/**
 * The guide's reference covers the game, links only to what exists, and runs nothing (from 2026-10-12;
 * `src/engine/content/guide/`).
 *
 * The registry's checks:
 * - every feature id (each command the engine registers, each look, each screen's `ui.*` control) belongs to exactly
 *   one entry, and no entry covers an id that's gone;
 * - every connection, every related entry and every place an entry sends the player resolves: an entry that exists, a
 *   screen the router has, a tab that screen has;
 * - every gated control on a screen has its entry one press away on the same screen, through How This Works;
 * - an entry names no removed feature or label;
 * - search finds each entry by its own name and its words;
 * - the help's own code calls no command and no clock.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quickSave } from '@/engine';
import '@/ui/looks/all';
import { lookKinds } from '@/ui/looks/registry';
import { CHAPTERS } from '@/engine/content/tutorial';
import { GOALS, GUIDE, GUIDE_BY_ID, ENTRY_FOR, SEARCH_EXAMPLES, connectionsTo, entriesOf, entryFor, search } from '@/engine/content/guide';
import { serialise } from '@/engine/persistence/adapter';
import { chapterFor, chaptersRead, isOpen, lockedBecause, nextChapter } from '@/engine/world/tutorial';
import { resolveLook, seedsFor, trailTo } from '@/ui/looks/registry';
import { SECTIONS } from '@/ui/shell/sections';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const UI = join(SRC, 'ui');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** The routes a screen exists for: Home, and the workspace router's. */
function routes(): Set<string> {
  const router = readFileSync(join(UI, 'workspaces', 'WorkspaceRouter.tsx'), 'utf8');
  return new Set(['/home', ...[...router.matchAll(/'(\/workspace\/[a-z-]+)'\s*:/g)].map((m) => m[1]!)]);
}

const commands = quickSave().commandKinds();
const looks = lookKinds().map((k) => `look.${k}`);
const chapterIds = CHAPTERS.flatMap((c) => c.opens);
const everyFeature = [...new Set([...commands, ...looks, ...chapterIds])];

describe('the registry', () => {
  it('gives every entry an id of its own, a goal that exists, and every part said', () => {
    expect(new Set(GUIDE.map((e) => e.id)).size).toBe(GUIDE.length);
    const goals = new Set(GOALS.map((g) => g.id));
    for (const e of GUIDE) {
      expect(goals.has(e.goal), e.id).toBe(true);
      expect(e.title.trim(), e.id).not.toBe('');
      expect(e.short.length, `${e.id} short`).toBeGreaterThan(80);
      expect(e.steps.length, `${e.id} steps`).toBeGreaterThan(0);
      expect(e.synonyms.length + e.questions.length, `${e.id} words`).toBeGreaterThan(2);
      expect(e.costs.length, `${e.id} costs`).toBeGreaterThan(0);
      expect(e.reads.length, `${e.id} reads`).toBeGreaterThan(0);
      expect(e.now.length, `${e.id} now`).toBeGreaterThan(0);
      expect(e.interpret.length, `${e.id} interpret`).toBeGreaterThan(0);
      expect(e.example.steps.length, `${e.id} example`).toBeGreaterThan(0);
      expect(e.example.result.length, `${e.id} example result`).toBeGreaterThan(20);
    }
  });

  it('covers every feature id exactly once', () => {
    const covered = GUIDE.flatMap((e) => e.covers);
    expect(covered.filter((f, i) => covered.indexOf(f) !== i), 'covered twice').toEqual([]);
    expect(everyFeature.filter((f) => !ENTRY_FOR[f]), 'covered by no entry').toEqual([]);
  });

  it('covers nothing that isn’t in the game', () => {
    const real = new Set(everyFeature);
    expect(GUIDE.flatMap((e) => e.covers.filter((f) => !real.has(f)).map((f) => `${e.id}: ${f}`))).toEqual([]);
  });

  it('links only to entries that exist, never to itself, and connects every entry', () => {
    const bad: string[] = [];
    for (const e of GUIDE) {
      for (const c of e.connections) {
        if (!GUIDE_BY_ID[c.to]) bad.push(`${e.id} → ${c.to}`);
        if (c.to === e.id) bad.push(`${e.id} → itself`);
        if (c.why.trim().length < 15) bad.push(`${e.id} → ${c.to}: no reason`);
      }
      for (const r of e.related) if (!GUIDE_BY_ID[r] || r === e.id) bad.push(`${e.id} related ${r}`);
    }
    expect(bad).toEqual([]);
    // No entry stands alone: each connects out, or something connects to it.
    const into = new Set(GUIDE.flatMap((e) => e.connections.map((c) => c.to)));
    expect(GUIDE.filter((e) => !e.connections.length && !into.has(e.id)).map((e) => e.id)).toEqual([]);
  });

  it('sends the player only to a screen and a tab that exist', () => {
    const real = routes();
    const bad: string[] = [];
    for (const e of GUIDE) {
      if (!real.has(e.where.route)) bad.push(`${e.id}: ${e.where.route}`);
      if (e.where.tab && !(SECTIONS[e.where.route] ?? []).some((s) => s.id === e.where.tab)) bad.push(`${e.id}: ${e.where.route} tab ${e.where.tab}`);
    }
    expect(bad).toEqual([]);
  });

  it('names no feature or label the game no longer has', () => {
    // Each was in the game once and isn't now: a guide that still says it sends the player looking for nothing.
    const gone = [/wheelchair/i, /Pay What’s Owed/, /\baudition(s|’s)? (booking|roll)/i, /\bshowcase\b/i, /\bagent\b/i, /\bmanager\b/i, /\bthe industry\b/i, /\bPress \/ anywhere to find one/];
    const hits: string[] = [];
    for (const e of GUIDE) {
      const text = JSON.stringify(e);
      for (const g of gone) if (g.test(text)) hits.push(`${e.id}: ${g}`);
    }
    for (const c of CHAPTERS) {
      const text = JSON.stringify(c);
      for (const g of gone) if (g.test(text)) hits.push(`chapter ${c.id}: ${g}`);
    }
    expect(hits).toEqual([]);
  });

  it('puts every gated control’s entry one press away on its own screen', () => {
    const missing: string[] = [];
    for (const file of sources(UI)) {
      const text = readFileSync(file, 'utf8');
      const features = [...text.matchAll(/feature="([^"]+)"/g), ...text.matchAll(/useFeature\('([^']+)'\)/g)].map((m) => m[1]!);
      if (!features.length) continue;
      const helps = new Set([...text.matchAll(/help="([^"]+)"/g)].map((m) => entryFor(m[1]!)?.id).filter(Boolean));
      for (const f of new Set(features)) {
        const e = ENTRY_FOR[f];
        if (e && !helps.has(e.id)) missing.push(`${file.slice(SRC.length)}: ${f} (${e.id})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('finds each entry by its title, and by each of its words for itself', () => {
    const misses: string[] = [];
    for (const e of GUIDE) {
      if (!search(e.title).slice(0, 3).some((x) => x.id === e.id)) misses.push(`${e.id}: title`);
      for (const s of e.synonyms) if (!search(s).some((x) => x.id === e.id)) misses.push(`${e.id}: ${s}`);
    }
    expect(misses).toEqual([]);
  });

  // From 2026-10-17 (brief 14): until then the empty search suggested “why is my rehearsal refused”, which found nothing.
  it('suggests only searches that find an entry', () => {
    expect(SEARCH_EXAMPLES.length).toBeGreaterThan(0);
    expect(SEARCH_EXAMPLES.filter((q) => search(q).length === 0)).toEqual([]);
  });

  it('answers nothing for nothing, and is the same for the same words', () => {
    expect(search('')).toEqual([]);
    expect(search('   ')).toEqual([]);
    expect(search('zzqx nothing like it')).toEqual([]);
    expect(search('sleep').map((e) => e.id)).toEqual(search('Sleep').map((e) => e.id));
  });
});

// These read the source and the engine’s readers. The dialog itself, drawn and pressed through How This Works, its
// links, Back, a search, Show Me Where and Close, with the live clock’s hold, is `tests/help-mechanics.test.ts` (from
// 2026-10-13: until then nothing in the gate drew it, and a write by another route than these calls passed here).
describe('reading help', () => {
  it('runs no command and moves no clock: the reference’s own code calls neither', () => {
    for (const file of ['ui/guide/Help.tsx', 'ui/guide/HowItWorks.tsx', 'ui/guide/help-context.ts']) {
      const text = readFileSync(join(SRC, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(text, file).not.toMatch(/\brun\(|\.execute\(|\.must\(|advanceTo\(|advanceBy\(|advance\(/);
    }
  });

  // From 2026-10-12: `content/guide/types.ts` said reading the reference was tested to leave a save byte for byte as
  // it was, and nothing tested it. Everything the dialog reads to draw an entry, its locks, the chapters and the looks a
  // name opens into, read against a guided life, and the save the same to the byte.
  it('leaves a save byte for byte as it was: every entry, its lock, search, links and the looks read against a live life', () => {
    const sim = quickSave({ tutorial: true });
    sim.advanceTo(sim.now + 30 * 3_600_000);
    const before = serialise(sim.universe);
    for (const g of GOALS) entriesOf(g.id);
    for (const e of GUIDE) {
      entryFor(e.id); connectionsTo(e.id);
      for (const f of e.covers) { isOpen(sim, f); lockedBecause(sim, f); chapterFor(f); }
      search(e.title); search(e.questions[0] ?? e.title);
    }
    chaptersRead(sim); nextChapter(sim);
    for (const kind of lookKinds()) for (const id of seedsFor(kind, sim)) { resolveLook(sim, { kind, id }); trailTo(sim, { kind, id }); }
    expect(serialise(sim.universe)).toBe(before);
  });

  it('is plain words: no entry holds a function the dialog could call', () => {
    const callable = (x: unknown): boolean => typeof x === 'function' || (x !== null && typeof x === 'object' && Object.values(x).some(callable));
    expect(GUIDE.filter((e) => callable(e)).map((e) => e.id)).toEqual([]);
  });
});
