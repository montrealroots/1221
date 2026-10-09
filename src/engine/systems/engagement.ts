/**
 * SLATE — genres studied and worked in (from the connected attributes of 2026-10-09).
 *
 * The character sheet says which genres somebody loves; this keeps what they've done about them, apart from that
 * (`person.engagement`): each genre's familiarity (`genre.study`: a film of the kind, or a play of it the game has)
 * and practice (work done in it: a night of a play of the kind, a self-tape in it, `practice.self_tape`).
 * Familiarity and practice speed the preparation of work in the genre (`genreSpeed`), the best of a work's genres
 * and never their sum, and a self-tape reads familiarity as its "knowing the genre". Neither caps what work can reach.
 *
 * What stops farming: each is an hour that passes, the same study or tape again the same day gives half, a work's
 * genres share one session's practice, and choosing or dropping a genre on the character sheet gives nothing: only
 * the hours do.
 *
 * Until 2026-10-10 this kept the interests too (`interest.pursue`: an hour of one rested as its kind of rest did,
 * less the more satiated, and grew one ability a little; its familiarity, sessions and satiation in
 * `engagement.byInterest`). The owner removed them that day, and migration 94 dropped their record from every save.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatTime } from '../core/time';
import { ENGAGEMENT } from '../content/engagement';
import { GENRE_DEFS, familiesOf } from '../content/genres';
import { withDemands } from '../content/demands';
import { GENRE_BY_ID } from '../content/film-genres';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../content/plays';
import { TASK_PROFILES } from '../content/tasks';
import { alreadyApplied, markApplied, repeatsToday } from './attributes';
import { conditionAt, focusAt, ordinary } from './school';
import { evaluate, recordWork, type Evaluation } from './evaluation';
import { commitmentWithin, occupiedAt } from './life';
import { inHospital } from './health';

export interface GenreState { familiarity: number; practice: number; lastAt?: number }
/** Kept apart from the character sheet's `genres`, which only `systems/enjoyment.ts` reads. */
export interface Engagement { byGenre: Record<string, GenreState> }

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r2 = (x: number) => Math.round(x * 100) / 100;

export function engagementOf(person: Person): Engagement {
  person.engagement ??= { byGenre: {} };
  return person.engagement;
}
export const genreState = (person: Person, id: string): GenreState => (engagementOf(person).byGenre[id] ??= { familiarity: 0, practice: 0 });

/** What's common to an hour away from the work: awake, free, out of hospital, and nothing on the calendar inside it. */
function hourRefusal(sim: Simulation, person: Person, minutes: number): string | undefined {
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return commitmentWithin(sim, minutes);
}

/** The plays the game has, with their kinds: a genre's studied in one of these where one is of it (no title invented). */
const PLAYS = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS];
export function playOfGenre(id: string): { title: string; by?: string } | undefined {
  const p = PLAYS.find((x) => (x.kinds ?? []).includes(id));
  return p ? { title: p.title, ...('by' in p && p.by ? { by: String(p.by) } : {}) } : undefined;
}

export function studyRefusal(sim: Simulation, person: Person, id: string): string | undefined {
  if (!GENRE_DEFS[id] || !GENRE_BY_ID[id]) return 'There’s no such genre.';
  return hourRefusal(sim, person, ENGAGEMENT.genre.minutes);
}

/** An hour and a half with a work of the genre: a play of it the game has, read, or a film of the kind. Familiarity, less the same day again. */
export function study(sim: Simulation, person: Person, id: string): { familiarity: number; with: string } {
  const n = repeatsToday(sim, person, `genre:${id}<study`);
  sim.advanceTo(sim.now + ENGAGEMENT.genre.minutes * 60_000);
  person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
  const g = genreState(person, id);
  g.familiarity = r2(g.familiarity + 100 * ENGAGEMENT.genre.study * 0.5 ** n * (1 - g.familiarity / 100));
  g.lastAt = sim.now;
  const play = playOfGenre(id);
  return { familiarity: g.familiarity, with: play ? `${play.title}${play.by ? `, by ${play.by}` : ''}` : `a film of the kind` };
}

/** Practice in a work's genres: one session's worth shared among them, so tags don't count twice. */
export function practiceGenres(sim: Simulation, person: Person, genres: readonly string[], amount = 1): void {
  for (const id of addPractice(person, genres, amount)) genreState(person, id).lastAt = sim.now;
}

/** The practice itself, with no clock: what a night gives, and what migration 92 gives each night a credit records. */
export function addPractice(person: Person, genres: readonly string[], amount = 1): string[] {
  const known = [...new Set(genres)].filter((g) => GENRE_DEFS[g]);
  for (const id of known) {
    const g = genreState(person, id);
    g.practice = r2(g.practice + 100 * ENGAGEMENT.genre.practice * (amount / known.length) * (1 - g.practice / 100));
  }
  return known;
}

/** A credit's play, by its production's name (a summer show's is "Title, Yale Summer Cabaret 2027"): the play the game has, or none. */
export function playOfCredit(production: string): string | undefined {
  return PLAYS.find((p) => production === p.title || production.startsWith(`${p.title},`))?.title;
}

/** How much faster preparation goes in a work's genres: the best of familiarity and practice among them, never their sum. */
export function genreSpeed(person: Person, genres: readonly string[] | undefined): number {
  const e = person.engagement?.byGenre ?? {};
  const best = Math.max(0, ...(genres ?? []).map((g) => Math.max(e[g]?.familiarity ?? 0, e[g]?.practice ?? 0)));
  return 1 + ENGAGEMENT.genreSpeed * best / 100;
}

/** What a self-tape in a genre reads: the camera's own techniques, and the genre's demands (`withDemands`). */
export const tapeReads = (genre: string) => withDemands({ ...SELF_TAPE.reads }, [genre]);

/** A self-tape's techniques, as the self-tape coursework reads them, and its difficulty by that work's par (55). */
export const SELF_TAPE = { reads: { screen: 2, scene: 1 }, difficulty: 0.125, genreComplete: 0.6, minutes: 60 } as const;

export function selfTapeRefusal(sim: Simulation, person: Person, id: string): string | undefined {
  if (!GENRE_DEFS[id] || !GENRE_BY_ID[id]) return 'There’s no such genre.';
  // A craft is the School's to begin (`enroll`): a life with none (a test's or a tool's, never a new life's) is refused, where until 2026-10-10 the command threw.
  if (!person.craft) return 'Your training hasn’t begun: there’s no craft to tape yet.';
  return hourRefusal(sim, person, SELF_TAPE.minutes);
}

/** A self-tape in a genre: a scene taped at home and judged as finished work, practice in the genre and the camera. */
export function selfTape(sim: Simulation, person: Person, id: string): Evaluation {
  const focus = focusAt(sim, person, sim.now);
  const condition = conditionAt(sim, person, sim.now);
  const g = genreState(person, id);
  const day = Math.floor(sim.now / MS_DAY);
  const again = repeatsToday(sim, person, `genre:${id}<tape`);
  const e = evaluate(sim, person, {
    task: TASK_PROFILES.camera!, techniques: tapeReads(id), prep: { genre: g.familiarity / 100 }, required: { genre: SELF_TAPE.genreComplete },
    difficulty: SELF_TAPE.difficulty, condition, families: familiesOf([id]), key: `tape:${person.id}:${id}:${day}`,
  });
  sim.advanceTo(sim.now + SELF_TAPE.minutes * 60_000);
  person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
  recordWork(sim, person, e, { at: sim.now, what: `${GENRE_BY_ID[id]!.label}, Taped At Home` });
  ordinary(sim, person, 'screen', focus, 0.5, 'self-tape');
  // The same genre taped again the same day is half the practice of the one before (from 2026-10-10).
  practiceGenres(sim, person, [id], 0.5 ** again);
  return e;
}

export function registerEngagement(sim: Simulation): void {
  // Each with an optional `actionId` (from 2026-10-10): the same action sent twice is lived once.
  sim.onCommand<{ genre: string; actionId?: string }, { familiarity: number; with: string }>('genre.study', (p, { sim: s }) => {
    const id = String(p?.genre);
    const no = alreadyApplied(s.player, p?.actionId) ?? studyRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    return study(s, s.player, id);
  });
  sim.onCommand<{ genre: string; actionId?: string }, { overall: number }>('practice.self_tape', (p, { sim: s }) => {
    const id = String(p?.genre);
    const no = alreadyApplied(s.player, p?.actionId) ?? selfTapeRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    return { overall: selfTape(s, s.player, id).overall };
  });
}
