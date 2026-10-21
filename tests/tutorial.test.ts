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
import { stopCommands } from '@/engine/world/clock';
import { PROJECTS } from '@/engine/content/careerwork';

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
    // A destination's screen is gated by its feature, on the rail and in WorkspaceRouter (from 2026-10-12).
    if (file.endsWith('destinations.ts')) for (const m of text.matchAll(/feature: '([^']+)'/g)) found.add(m[1]!);
    // A stop's choices beyond Go and Stand Here are its kind's own (`stopChoices`, `world/clock.ts`, from 2026-10-20, brief
    // 19's D1), and the stop draws each as a button gated by its command (`DueNow`): Skip It was `feature="calendar.skip"`
    // there until then. Counted only while the stop draws them that way.
    if (file.endsWith('TimeControls.tsx') && text.includes('<Gated key={choice.command} feature={choice.command}')) for (const c of stopCommands()) found.add(c);
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

/**
 * The work the game has, as a chapter would name it (from 2026-10-21, the owner's brief 19, D9): the School's own paid
 * work, and the professional work `content/careerwork.ts` holds, each kind by the words a chapter would use for it.
 * Every kind of work a chapter offers must be one of these; anything else is a job the game doesn't have.
 */
const WORK_THE_GAME_HAS: readonly RegExp[] = [
  /\bwork-study\b/i, /\bshifts?\b/i, /\b(?:Summer )?Cabaret\b/i,
  ...PROJECTS.flatMap((t) => ({
    'off-broadway': [/\bOff-Broadway\b/i], lort: [/\bregional theat(?:er|re)\b/i, /\bEquity open call\b/i, /\bruns?\b/i], 'network-drama': [/\bnetwork (?:television )?drama\b/i, /\bco-star\b/i],
    'low-budget': [/\blow-budget\b/i, /\bfeature film\b/i], 'ultra-low-budget': [/\bultra-low-budget\b/i], 'student-film': [/\bstudent films?\b/i], 'non-union-short': [/\bshort films?\b/i, /\bnon-union short\b/i],
  } as Record<string, RegExp[]>)[t.kind] ?? []),
  /\broles?\b/i, /\bparts?\b/i, /\bshoot(?: days?)?\b/i, /\bwork days?\b/i, /\bperformances?\b/i, /\bauditions?\b/i, /\bself-tapes?\b/i,
];
/** Words a chapter would use to promise work the game doesn't have: a job of no kind, and the kinds of work it has none of. */
const WORK_IT_HASNT = /\bbetween jobs\b|\b(?:take|find|get|start|land|book) a job\b|\bday jobs?\b|\bcommercials?\b|\bvoice-?over jobs?\b|\bBroadway show\b|\bnational tours?\b|\bseries regular\b|\bbackground work\b|\bwaiting tables\b|\bbartending\b|\btemp work\b/i;
/** A sentence that offers the player work: an action of taking or seeking it. */
const OFFERS_WORK = /\b(?:take|find|get|start|land|book|submit (?:yourself )?for|audition for|accept|be seen for|work on|work as)\b/i;

/** The chapters' sentences that offer work the game doesn't have, with the chapter that says each. */
function jobsOffered(chapters: readonly { id: string; body: readonly string[]; more?: readonly string[] }[]): string[] {
  return chapters.flatMap((c) => [...c.body, ...(c.more ?? [])].flatMap((p) => p.split(/(?<=[.!?])\s+/))
    .filter((sentence) => WORK_IT_HASNT.test(sentence) || (OFFERS_WORK.test(sentence) && /\bjobs?\b/i.test(sentence) && !WORK_THE_GAME_HAS.some((w) => w.test(sentence))))
    .map((sentence) => `${c.id}: ${sentence.slice(0, 80)}`));
}

describe('what the chapters offer', () => {
  // GUARD: jobs went in the scope reset of 2026-10-09; a chapter that opened “Between jobs” offered a player something
  // the game no longer had, until brief 12 (2026-10-17). Until 2026-10-21 this guarded a game with no work: any chapter
  // speaking of being between jobs or taking one failed it. From then (the owner's brief 19, D9) the game has work, the
  // School's and the fictional professional work of `content/careerwork.ts`, so it guards what's true now: a chapter
  // may offer only work the game has. "Between jobs" and "take, find, get or start a job" still fail it, as before, and so
  // do the kinds of work the game has none of (a day job, commercials, voice-over jobs, a Broadway show, a national tour,
  // a series regular, background work), and a sentence offering a job that names none of the work the game has. A
  // technique's name (voice-over work, among the special skills) isn't a job offered.
  it('GUARD: offers only work the game has: no chapter promises a job of a kind the game doesn’t offer', () => {
    // Its details too, behind The Details from 2026-10-17 (brief 14).
    expect(jobsOffered(CHAPTERS)).toEqual([]);
  });

  it('GUARD: still fails on a chapter that promises a job the game doesn’t offer, as the old guard did and more', () => {
    const promise = (line: string) => jobsOffered([{ id: 'fixture', body: [line] }]);
    // What the old guard caught, still caught.
    expect(promise('Between jobs, you can rest.')).toHaveLength(1);
    expect(promise('Find a job to pay the rent.')).toHaveLength(1);
    expect(promise('Take a job at the café.')).toHaveLength(1);
    // "A job" is never the game's word, even beside work it has: the game offers roles, not jobs.
    expect(promise('Land a job in a student film.')).toHaveLength(1);
    // Kinds of work the game has none of.
    expect(promise('Book a commercial on the Opportunities tab.')).toHaveLength(1);
    expect(promise('An agent can get you a series regular role.')).toHaveLength(1);
    expect(promise('Audition for a national tour.')).toHaveLength(1);
    expect(promise('A day job keeps you going between roles.')).toHaveLength(1);
    expect(promise('Accept any job you’re offered.')).toHaveLength(1);
    // The work the game has, offered in its own words, passes.
    expect(promise('Press Submit Yourself to be seen for a student film.')).toEqual([]);
    expect(promise('Accepting books the work days on your calendar.')).toEqual([]);
    expect(promise('Take a shift on the School’s Shifts And Pay tab.')).toEqual([]);
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
