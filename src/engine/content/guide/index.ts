/**
 * SLATE — the guide's reference, every entry in one list (from 2026-10-12; `content/guide/types.ts`).
 *
 * The entries are written by area, a file each, and joined here in the contents' order. `ENTRY_FOR` finds the entry
 * that covers a feature id, so a control that knows its feature knows its help, and `search` finds entries by their
 * names, synonyms and questions.
 */

import type { Connection, Goal, GoalId, GuideEntry } from './types';
import { START } from './start';
import { DAY } from './day';
import { BODY } from './body';
import { SCHOOL } from './school';
import { COURSEWORK } from './coursework';
import { PRODUCTIONS } from './productions';
import { CRAFT } from './craft';
import { MONEY } from './money';
import { PAPERS } from './papers';
import { TAXES } from './taxes';
import { DOCUMENTS } from './documents';

export type { Connection, ConnectionKind, Fact, Goal, GoalId, GuideEntry } from './types';

/** The contents, by what the player is trying to do, in the order a life meets them. */
export const GOALS: readonly Goal[] = [
  { id: 'start', title: 'Getting Started', lead: 'Where you are, the guide itself, and how to find anything.' },
  { id: 'day', title: 'Your Day And The Clock', lead: 'The calendar, the clock, plans of your own, what needs you, the weather.' },
  { id: 'body', title: 'Looking After Yourself', lead: 'How you are, sleep, meals and rest, and what the day leaves you.' },
  { id: 'school', title: 'Staying At School', lead: 'Your standing, classes, terms, leave, money owed the school, shifts and shows of your own.' },
  { id: 'coursework', title: 'Coursework And Partners', lead: 'Preparing scenes, table work, partners, feedback and notes, and rehearsing a problem through.' },
  { id: 'productions', title: 'Productions And Casting', lead: 'Being cast, rehearsal calls, the director’s notes, the nights, and plays to read.' },
  { id: 'craft', title: 'Your Craft', lead: 'Practice, techniques, genres, practice briefs, a piece of work explained, and your work so far.' },
  { id: 'money', title: 'Money And The Bank', lead: 'Accounts, moving money, cards, paying, borrowing, and what you’re worth.' },
  { id: 'papers', title: 'Papers', lead: 'Tax returns, health cover and the doctor, benefits, pensions, passport, ID and permission to work.' },
];

export const GUIDE: readonly GuideEntry[] = [...START, ...DAY, ...BODY, ...SCHOOL, ...COURSEWORK, ...PRODUCTIONS, ...CRAFT, ...MONEY, ...PAPERS, ...TAXES, ...DOCUMENTS];

export const GUIDE_BY_ID: Readonly<Record<string, GuideEntry>> = Object.fromEntries(GUIDE.map((e) => [e.id, e]));

/** The entry covering each feature id. */
export const ENTRY_FOR: Readonly<Record<string, GuideEntry>> = Object.fromEntries(GUIDE.flatMap((e) => e.covers.map((f) => [f, e])));

/** The entry for a feature id, or for an entry's own id. */
export const entryFor = (id: string): GuideEntry | undefined => GUIDE_BY_ID[id] ?? ENTRY_FOR[id];

export const entriesOf = (goal: GoalId): readonly GuideEntry[] => GUIDE.filter((e) => e.goal === goal);

/** The connections other entries make to this one, each with the entry it comes from: what leads here. */
export function connectionsTo(id: string): { from: GuideEntry; connection: Connection }[] {
  return GUIDE.flatMap((from) => from.connections.filter((c) => c.to === id).map((connection) => ({ from, connection })));
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Entries matching a player's words, best first: every word of the query found somewhere in the entry, ranked by where
 * (a title over a synonym over a question over the explanation), and the whole phrase found counting most.
 */
export function search(query: string, limit = 12): GuideEntry[] {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(' ').filter((w) => w.length > 1 || q.length === 1);
  const scored: { e: GuideEntry; score: number }[] = [];
  for (const e of GUIDE) {
    const fields: [string, number][] = [[norm(e.title), 8], [norm(e.synonyms.join(' | ')), 5], [norm(e.questions.join(' | ')), 3], [norm(e.short), 1], [norm(e.covers.join(' ')), 2]];
    let score = 0;
    let all = true;
    for (const w of words) {
      const hits = fields.filter(([text]) => text.includes(w));
      if (!hits.length) { all = false; break; }
      score += Math.max(...hits.map(([, weight]) => weight));
    }
    if (!all) continue;
    for (const [text, weight] of fields) if (words.length > 1 && text.includes(q)) score += weight * 2;
    scored.push({ e, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.e.title.localeCompare(b.e.title)).slice(0, limit).map((x) => x.e);
}
