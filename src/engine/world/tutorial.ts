/**
 * SLATE — the guide, as the engine keeps it.
 *
 * The chapters are in `content/tutorial.ts`. This is what holds a life to
 * them: which have been read (`universe.tutorial`), which comes next, and
 * whether a part of the game is open yet. A command whose chapter hasn't
 * been read is refused here, whatever screen sent it, so a button that
 * slipped its lock still can't do the thing; the screens ask `isOpen` too,
 * to show the lock before anybody presses.
 *
 * Chapters are read in order. The next one is the only one that can be, and
 * reading it opens what it names.
 *
 * A save with no `tutorial` has everything open: one begun before the guide
 * existed, or made by a test or a tool.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { CHAPTERS, CHAPTER_BY_ID, CHAPTER_FOR, type Chapter } from '../content/tutorial';

export const READ_KIND = 'tutorial.read';

/** Whether this life is being guided at all. */
export function guided(sim: Simulation): boolean {
  return sim.universe.tutorial !== undefined;
}

/** The chapters read, in order. Every chapter, on a save with no guide. */
export function chaptersRead(sim: Simulation): readonly string[] {
  return sim.universe.tutorial?.read ?? CHAPTERS.map((c) => c.id);
}

/** The next chapter to read, or undefined when every one has been. */
export function nextChapter(sim: Simulation): Chapter | undefined {
  const read = new Set(chaptersRead(sim));
  return CHAPTERS.find((c) => !read.has(c.id));
}

/** Whether the guide is done with: every chapter read, or no guide. */
export function guideFinished(sim: Simulation): boolean {
  return nextChapter(sim) === undefined;
}

/** Whether a part of the game is open: its chapter read, or no chapter owns it. */
export function isOpen(sim: Simulation, feature: string): boolean {
  const chapter = CHAPTER_FOR[feature];
  if (!chapter) return true;
  return chaptersRead(sim).includes(chapter.id);
}

/** The chapter that opens a feature, if one does. */
export function chapterFor(feature: string): Chapter | undefined {
  return CHAPTER_FOR[feature];
}

/**
 * What a locked part of the game says: the chapter that opens it, and, when
 * that isn't the next one, the one to read first.
 */
export function lockedBecause(sim: Simulation, feature: string): string | undefined {
  if (isOpen(sim, feature)) return undefined;
  const chapter = CHAPTER_FOR[feature]!;
  const next = nextChapter(sim);
  const order = next && next.id !== chapter.id ? ` The next chapter is “${next.title}”.` : '';
  return `Read “${chapter.title}” in the guide first.${order}`;
}

/**
 * The feature a command needs open. Pausing needs nothing: the world pauses
 * itself when it stops at something, and a player can always stop the clock.
 */
function featureOf(kind: string, payload: Record<string, unknown>): string {
  if (kind === 'world.set_preferences' && payload.timeSpeed === 'paused') return '';
  return kind;
}

export function registerTutorial(sim: Simulation): void {
  sim.onCommand<{ chapterId: string }, { read: string; next?: string }>(READ_KIND, (p, { sim: s }) => {
    const state = s.universe.tutorial;
    if (!state) throw new CommandError('This life has no guide to read through; everything is open.');
    const chapter = CHAPTER_BY_ID[p.chapterId];
    if (!chapter) throw new CommandError('There’s no such chapter.');
    if (state.read.includes(chapter.id)) throw new CommandError(`You’ve already read “${chapter.title}”.`);
    const next = nextChapter(s);
    if (next && next.id !== chapter.id) throw new CommandError(`Read “${next.title}” first; the chapters go in order.`);
    state.read.push(chapter.id);
    return { read: chapter.id, next: nextChapter(s)?.id };
  });

  sim.guardCommands((command) => {
    if (!guided(sim)) return undefined;
    const feature = featureOf(command.kind, command.payload);
    return lockedBecause(sim, feature);
  });
}
