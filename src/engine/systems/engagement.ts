/**
 * SLATE — genres studied and worked in (from the connected attributes of 2026-10-09).
 *
 * The character sheet says which genres somebody loves; this keeps what they've done about them, apart from that
 * (`person.engagement`): each genre's familiarity (`genre.study`: a film of the kind, or a play of it the game has)
 * and practice (work done in it: a night of a play of the kind, a self-tape in it, `practice.self_tape`).
 * A take of a brief reads how well its genres are known, the better of familiarity and practice (`genreKnown` in
 * `systems/briefs.ts`), and the two speed a scene for class from a play of the kind and a part's lines in one
 * (`genreSpeed`), the best of a work's genres and never their sum. Neither caps what work can reach. This said a
 * self-tape read familiarity alone as its "knowing the genre" and the genre sped the preparation of all work in it:
 * a brief's own steps read the material met before (`prepSpeed`), not the genre (from 2026-10-12).
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
import { formatTime } from '../core/time';
import { ENGAGEMENT } from '../content/engagement';
import { GENRE_DEFS } from '../content/genres';
import { withDemands } from '../content/demands';
import { GENRE_BY_ID } from '../content/film-genres';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../content/plays';
import { alreadyApplied, markApplied, repeatsToday } from './attributes';
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

/** What a self-tape in a genre read until 2026-10-12: the camera's own techniques, and the genre's demands (`withDemands`). */
export const tapeReads = (genre: string) => withDemands({ ...SELF_TAPE.reads }, [genre]);

/** A self-tape's techniques, as the self-tape coursework reads them, its difficulty by that work's par (55), and its hour. */
export const SELF_TAPE = { reads: { screen: 2, scene: 1 }, difficulty: 0.125, genreComplete: 0.6, minutes: 60 } as const;

/**
 * A self-tape in a genre was taped here until 2026-10-12, of no scene: the camera's task, the genre's demands and its
 * familiarity. Every self-tape is of a practice brief now, prepared and chosen first (`systems/briefs.ts`, which
 * registers `practice.self_tape`), and its take reads the brief's techniques (`tapeReadsOf`). This said `SELF_TAPE`
 * and `tapeReads` were kept for what a genre asks of the camera; the game reads `SELF_TAPE.minutes` alone (from
 * 2026-10-12), a take's hour, and only tests read `tapeReads` and `SELF_TAPE`'s reads, difficulty and genreComplete:
 * engagement, genre-coverage and attributes-complete. `selfTapeRefusal` was deleted that day, read by nothing once
 * `tapeRefusal` refused a take in its place.
 */

export function registerEngagement(sim: Simulation): void {
  // Each with an optional `actionId` (from 2026-10-10): the same action sent twice is lived once.
  sim.onCommand<{ genre: string; actionId?: string }, { familiarity: number; with: string }>('genre.study', (p, { sim: s }) => {
    const id = String(p?.genre);
    const no = alreadyApplied(s.player, p?.actionId) ?? studyRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    return study(s, s.player, id);
  });
}
