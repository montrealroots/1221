/**
 * Defects, group g1, part 1 (from 2026-10-12).
 *
 * day-body-tutorial-body-chapter. “How You Are” said the other dials were
 * “one press away”, and that “your own page” listed the traits you hold and
 * the conditions you carry. Your own page is `look.person`, and “A Whole
 * Life”, the guide's last chapter, opens it: until then Home's How You Are
 * panel and its line are plain text, and the only way to another dial is
 * Readiness, which names at most three. A condition can't be opened at all
 * until then, since only your own page leads to one.
 *
 * The chapter's words are in `content/tutorial.ts`, which this pass couldn't
 * edit, and this file failed until they were corrected there on 2026-10-12.
 * The first test holds the page where it is, shut until its own chapter; the
 * second passes only while the chapter neither calls the others one press
 * away nor sends the player to your own page without naming the chapter that
 * opens it. Until 2026-10-12 this said the file didn't ask for the page to
 * move, and that the second test passed once `look.person` opened in or before
 * “How You Are”, which the first test fails.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import '@/ui/looks/all';
import { resolveLook } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import { CHAPTERS, CHAPTER_BY_ID, CHAPTER_FOR, type Chapter } from '@/engine/content/tutorial';
import { READ_KIND, isOpen } from '@/engine/world/tutorial';

const HOW_YOU_ARE = CHAPTER_BY_ID['body']!;
const OWN_PAGE = CHAPTER_FOR['look.person']!;
const HOUR = 3_600_000;

/** A guided life with every chapter read up to and including `last`. */
function readThrough(last: Chapter) {
  const sim = quickSave({ tutorial: true }, 'g1-how-you-are');
  for (const chapter of CHAPTERS) {
    sim.must({ kind: READ_KIND, payload: { chapterId: chapter.id } });
    if (chapter.id === last.id) break;
  }
  return sim;
}

/** What a chapter says about your own page that the order of the guide makes untrue. */
function untrue(chapter: Chapter): string[] {
  if (CHAPTERS.indexOf(OWN_PAGE) <= CHAPTERS.indexOf(chapter)) return [];
  const text = [...chapter.body, ...chapter.names].join(' ');
  const wrong: string[] = [];
  if (/one press away/i.test(text)) wrong.push('one press away');
  if (/your own page/i.test(text) && !text.includes(OWN_PAGE.title)) wrong.push(`your own page, with no “${OWN_PAGE.title}”`);
  return wrong;
}

describe('day-body-tutorial-body-chapter: what “How You Are” says about your own page', () => {
  it('keeps your own page shut until its chapter, leaving Readiness the only way to another dial', () => {
    const before = CHAPTERS[CHAPTERS.indexOf(OWN_PAGE) - 1]!;
    expect(CHAPTERS.indexOf(OWN_PAGE)).toBeGreaterThan(CHAPTERS.indexOf(HOW_YOU_ARE));
    const sim = readThrough(before);
    expect(isOpen(sim, 'look.person')).toBe(false);
    for (const opened of ['look.dial', 'look.readiness', 'look.trait', 'look.condition']) expect(isOpen(sim, opened), opened).toBe(true);
    // Played for a waking day, so the dials have moved and Readiness has something to name.
    sim.advanceBy(14 * HOUR);
    const ready = resolveLook(sim, at('readiness', sim.universe.playerId));
    expect(ready && 'ways' in ready).toBe(true);
    const ways = (ready as { ways?: { to: { kind: string } }[] }).ways ?? [];
    expect(ways.every((w) => w.to.kind === 'dial')).toBe(true);
    // Home shows energy, stress and readiness; the six others are what “one press away” promised.
    expect(ways.length).toBeLessThanOrEqual(3);
  });

  it('says nothing the order of the guide makes untrue', () => {
    expect(untrue(HOW_YOU_ARE)).toEqual([]);
  });
});
