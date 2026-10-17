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

/**
 * The contents, by what the player is trying to do, in the order a life meets them. Each lead names what its entries
 * cover, in their order (from 2026-10-17: until then Staying At School's offered "shows of your own", which are
 * Productions And Casting's, and Your Day And The Clock's left moving time on out).
 */
export const GOALS: readonly Goal[] = [
  { id: 'start', title: 'Getting Started', lead: 'Home, how the guide and this help work, and finding your way around.' },
  { id: 'day', title: 'Your Day And The Clock', lead: 'What’s coming, the clock, moving time on, what needs you, your own plans and the weather.' },
  { id: 'body', title: 'Looking After Yourself', lead: 'How you are, sleep, and eating, washing, working out and unwinding.' },
  { id: 'school', title: 'Staying At School', lead: 'Your standing and classes, calling in sick, orientation, leave, repeating a year, what you owe the school and work-study.' },
  { id: 'coursework', title: 'Coursework And Partners', lead: 'Preparing the work your classes set, table work, how you’ll play a scene, feedback, rehearsing with a partner and working a problem through.' },
  { id: 'productions', title: 'Productions And Casting', lead: 'Being cast, learning a part, the director’s notes, the nights, the Cabaret and plays to read.' },
  { id: 'craft', title: 'Your Craft', lead: 'Your Player Profile, practice, genres, practice briefs, a piece of work explained and your work so far.' },
  { id: 'money', title: 'Money And The Bank', lead: 'Your accounts, moving money, cards, paying, borrowing, other banks and what you’re worth.' },
  { id: 'papers', title: 'Papers', lead: 'Health cover and the doctor, benefits and pensions, tax returns, your passport and ID, and permission to work.' },
];

/**
 * The searches the help's empty search suggests (from 2026-10-17): each finds an entry, which `tests/guide.test.ts`
 * holds. Until then it suggested “why is my rehearsal refused”, which found nothing.
 */
export const SEARCH_EXAMPLES: readonly string[] = ['clock stopped', 'how do I pay my card'];

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
