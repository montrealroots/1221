/**
 * The guide covers the whole game, in order, and holds it shut until read.
 *
 * Two halves. The coverage matrix: every command the engine registers, every
 * kind of look and every control the screens gate belongs to exactly one
 * chapter, and every chapter opens something that exists. And the lock: a
 * guided life refuses what its chapters haven't opened, reads them only in
 * order, and opens each part as its chapter is read.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import '@/ui/looks/all';
import { lookKinds } from '@/ui/looks/registry';
import { CHAPTERS } from '@/engine/content/tutorial';
import { READ_KIND, guideFinished, isOpen, nextChapter } from '@/engine/world/tutorial';

const UI = fileURLToPath(new URL('../src/ui/', import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Every feature id a screen asks the guide about. */
function featuresOnScreen(): Set<string> {
  const found = new Set<string>();
  for (const file of sources(UI)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/feature="([^"]+)"/g)) found.add(m[1]!);
    for (const m of text.matchAll(/useFeature\('([^']+)'\)/g)) found.add(m[1]!);
  }
  return found;
}

const opened = CHAPTERS.flatMap((c) => c.opens);

describe('the coverage matrix', () => {
  it('gives every chapter an id of its own, a title, words and something to open', () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    for (const chapter of CHAPTERS) {
      expect(chapter.body.length, chapter.id).toBeGreaterThan(0);
      expect(chapter.opens.length, chapter.id).toBeGreaterThan(0);
      expect(chapter.names.length, chapter.id).toBeGreaterThan(0);
    }
  });

  it('opens each part of the game in one chapter only', () => {
    const twice = opened.filter((feature, i) => opened.indexOf(feature) !== i);
    expect(twice).toEqual([]);
  });

  it('covers every command the engine registers', () => {
    const commands = quickSave().commandKinds().filter((kind) => kind !== READ_KIND);
    expect(commands.filter((kind) => !opened.includes(kind))).toEqual([]);
  });

  it('covers every kind of look', () => {
    expect(lookKinds().filter((kind) => !opened.includes(`look.${kind}`))).toEqual([]);
  });

  it('covers every control the screens gate, and gates every control it names', () => {
    const onScreen = featuresOnScreen();
    // Named on a screen and owned by no chapter would be a lock nothing opens.
    expect([...onScreen].filter((feature) => !opened.includes(feature))).toEqual([]);
    // A ui feature no screen asks about is a word with nothing that reads it.
    expect(opened.filter((f) => f.startsWith('ui.') && !onScreen.has(f))).toEqual([]);
    // And every id is a real command, a real look or a screen's control.
    const commands = quickSave().commandKinds();
    const looks = lookKinds().map((kind) => `look.${kind}`);
    expect(opened.filter((f) => !commands.includes(f) && !looks.includes(f) && !f.startsWith('ui.'))).toEqual([]);
  });

  it('is the table the coverage matrix prints, row for row', () => {
    const doc = readFileSync(fileURLToPath(new URL('../docs/COVERAGE-MATRIX.md', import.meta.url)), 'utf8');
    const rows = [...doc.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \|$/gm)].map((m) => ({
      title: m[2]!.trim(), opens: [...m[3]!.matchAll(/`([^`]+)`/g)].map((o) => o[1]),
    }));
    expect(rows).toEqual(CHAPTERS.map((c) => ({ title: c.title, opens: [...c.opens] })));
  });

  it('gives every command a button that asks the guide first', () => {
    const onScreen = featuresOnScreen();
    const commands = quickSave().commandKinds().filter((kind) => kind !== READ_KIND && kind !== 'world.set_preferences');
    expect(commands.filter((kind) => !onScreen.has(kind))).toEqual([]);
  });
});

describe('a guided life', () => {
  const guidedLife = (seed = 'guide') => quickSave({ tutorial: true }, seed);

  it('starts paused, with everything shut and the first chapter next', () => {
    const sim = guidedLife();
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(nextChapter(sim)?.id).toBe(CHAPTERS[0]!.id);
    for (const feature of opened) expect(isOpen(sim, feature), feature).toBe(false);
  });

  it('refuses a command until its chapter is read, and names the chapter', () => {
    const sim = guidedLife();
    const refused = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('“Sleep”');
    expect(refused.error).toContain(`“${CHAPTERS[0]!.title}”`);
    const started = sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } });
    expect(started.ok).toBe(false);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
  });

  it('always lets the clock be paused', () => {
    const sim = guidedLife();
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } }).ok).toBe(true);
  });

  it('reads the chapters in order and no other way', () => {
    const sim = guidedLife();
    const skipped = sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[2]!.id } });
    expect(skipped.ok).toBe(false);
    expect(skipped.error).toContain(`“${CHAPTERS[0]!.title}”`);
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).ok).toBe(true);
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).ok).toBe(false);
    expect(nextChapter(sim)?.id).toBe(CHAPTERS[1]!.id);
  });

  it('opens exactly what a chapter names when it is read, and nothing after it', () => {
    const sim = guidedLife();
    for (const [i, chapter] of CHAPTERS.entries()) {
      sim.must({ kind: READ_KIND, payload: { chapterId: chapter.id } });
      for (const feature of chapter.opens) expect(isOpen(sim, feature), feature).toBe(true);
      for (const later of CHAPTERS.slice(i + 1)) {
        for (const feature of later.opens) expect(isOpen(sim, feature), `${feature} after ${chapter.id}`).toBe(false);
      }
    }
    expect(guideFinished(sim)).toBe(true);
    expect(nextChapter(sim)).toBeUndefined();
    // With nothing next, a chapter read again is still refused, and the
    // record keeps each chapter once.
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).ok).toBe(false);
    expect(sim.universe.tutorial!.read).toEqual(CHAPTERS.map((c) => c.id));
  });

  it('lets the clock run once "The Clock" is read, and sleep once "Sleep" is', () => {
    const sim = guidedLife();
    const readTo = (id: string) => {
      for (const chapter of CHAPTERS) {
        if (sim.universe.tutorial!.read.includes(chapter.id)) continue;
        sim.must({ kind: READ_KIND, payload: { chapterId: chapter.id } });
        if (chapter.id === id) return;
      }
    };
    readTo('clock');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(false);
    readTo('sleep');
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
  });

  it('keeps what was read through a save', () => {
    const sim = guidedLife();
    sim.must({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } });
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(back.universe.tutorial?.read).toEqual([CHAPTERS[0]!.id]);
    expect(isOpen(back, CHAPTERS[0]!.opens[0]!)).toBe(true);
    expect(isOpen(back, CHAPTERS[1]!.opens[0]!)).toBe(false);
    expect(back.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(false);
  });

  it('leaves a life without the guide wholly open', () => {
    const sim = quickSave({}, 'unguided');
    expect(sim.universe.tutorial).toBeUndefined();
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    for (const feature of opened) expect(isOpen(sim, feature), feature).toBe(true);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).ok).toBe(false);
  });

  it('lets the world run its own commands while the clock moves, guide or none', () => {
    // Rent the clock runs over while nobody's there is charged by the world,
    // not refused for a chapter the player hasn't read.
    const sim = quickSave({ tutorial: true }, 'guide-world');
    const before = sim.universe.transactions.length;
    sim.advanceBy(40 * 24 * 3_600_000);
    expect(Object.values(sim.universe.notifications ?? {}).filter((n) => (n as { title: string }).title === 'Something Didn’t Go Through')).toEqual([]);
    expect(sim.universe.transactions.length).toBeGreaterThan(before);
  });
});
