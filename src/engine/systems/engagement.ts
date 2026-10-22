/**
 * SLATE — genres studied and worked in (from the connected attributes of 2026-10-09).
 *
 * The character sheet says which genres somebody loves; this keeps what they've done about them, apart from that
 * (`person.engagement`): each genre's familiarity (`genre.study`: a film of the kind, or a play of it the game has)
 * and practice (work done in it: a night of a play of the kind, a self-tape in it, `practice.self_tape`).
 * A take of a brief reads how well its genres are known, the better of familiarity and practice (`genreKnown` in
 * `systems/briefs.ts`), and the two speed a scene for class from a play of the kind and a part's lines in one
 * (`genreSpeed`). Neither caps what work can reach. Until brief 21 (2026-10-22) a work's genres were read as the best
 * known of them, never their sum; from then each counts for its weight in the work (`genreNeeds`, `relevantGenre`),
 * the weights summing to one, and the same reading is part of an audition's, a self-tape's, a shoot day's and a
 * night's preparation and of casting's fit (`projobs.ts`, `school.ts`). This said a
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
  return { familiarity: g.familiarity, with: play ? `${play.title}${play.by ? `, by ${play.by}` : ''}` : `a film of its kind` };
}

/**
 * Practice in a work's genres: one session's worth shared among them by the work's weights (`genreNeeds`), so a tag
 * listed twice, or a broad genre listed beside its own kind, doesn't take a share of its own. Until 2026-10-22 (brief
 * 21) it was shared evenly among the tags as listed, so `['psychological_thriller', 'thriller']` gave each half.
 */
export function practiceGenres(sim: Simulation, person: Person, genres: readonly string[], amount = 1): void {
  for (const id of creditPractice(engagementOf(person), genres, amount)) genreState(person, id).lastAt = sim.now;
}

/** One session's practice in a work's genres, by its weights, on a record with no clock: the requirements credited. */
export function creditPractice(record: Engagement, genres: readonly string[], amount = 1): string[] {
  return genreNeeds(genres).map((need) => {
    const g = (record.byGenre[need.id] ??= { familiarity: 0, practice: 0 });
    g.practice = r2(g.practice + 100 * ENGAGEMENT.genre.practice * amount * need.weight * (1 - g.practice / 100));
    return need.id;
  });
}

/**
 * The practice itself, with no clock, shared evenly among the tags as listed: what migration 92 gives each night a
 * credit records, opening a save from before it. It keeps that even share so a save opened today is migrated as it was
 * when the migration was written; live play shares by the work's weights (`practiceGenres`).
 */
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

/**
 * How much faster preparation goes in a work's genres: by how well its genres are known, weighed (`relevantGenre`),
 * at most a sixth. Until 2026-10-22 (brief 21) it was the best-known of them, so knowing one of a work's two genres sped
 * it as much as knowing both.
 */
export function genreSpeed(person: Knower, genres: readonly string[] | undefined): number {
  return 1 + ENGAGEMENT.genreSpeed * relevantGenre(person, genres ?? []).total;
}

// ---------------------------------------------------------------------------------------------------------------------
// A work's genres, weighed (from 2026-10-22, the owner's brief 21)
// ---------------------------------------------------------------------------------------------------------------------

/** Whoever has a record of genres: a person, or the stand-in for a class whose days aren't lived (`school.ts`). */
export type Knower = { engagement?: Engagement };

/** How well a genre is known, 0 to 1: the better of its familiarity and its practice, as every reader has taken it. */
export const knownOf = (person: Knower, id: string): number => {
  const g = person.engagement?.byGenre[id];
  return Math.max(g?.familiarity ?? 0, g?.practice ?? 0) / 100;
};

/** The broad genres a genre is a kind of: its families that are genres of their own, itself left out. */
export function parentsOf(id: string): string[] {
  return (GENRE_DEFS[id]?.families ?? []).filter((f) => f !== id && GENRE_DEFS[f] !== undefined);
}

/** Every broad genre a genre is a kind of, through its parents' parents (`crime` is a kind of `drama`). */
export function ancestorsOf(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (g: string) => { for (const p of parentsOf(g)) if (!out.has(p)) { out.add(p); walk(p); } };
  walk(id);
  out.delete(id);
  return out;
}

/** One requirement of a work, after its tags are weighed: the genre, its share of the whole, and the tags it took in. */
export interface GenreNeed { id: string; weight: number; from: string[] }

/**
 * A work's genres as requirements, their weights summing to 1 (or none for a work with no genre the game knows): the
 * tags in the order listed, a repeat dropped; the first half the weight where there are two or more and the rest the
 * other half evenly (`ENGAGEMENT.weights`); then a tag that's the broad genre of another listed tag absorbed into its
 * listed kinds, its weight shared among them. More tags never add weight: it's shared, not summed.
 */
export function genreNeeds(genres: readonly string[]): GenreNeed[] {
  const tags = [...new Set(genres)].filter((g) => GENRE_DEFS[g]);
  if (!tags.length) return [];
  const first = tags.length > 1 ? ENGAGEMENT.weights.primary : 1;
  const weight = new Map(tags.map((g, i) => [g, i === 0 ? first : (1 - first) / (tags.length - 1)]));
  const from = new Map(tags.map((g) => [g, [g]]));
  const kindsListed = (g: string) => tags.filter((t) => t !== g && ancestorsOf(t).has(g));
  // A broad genre with a kind of its own listed is absorbed, its weight and name passed to the kinds that aren't
  // themselves absorbed (the narrowest listed).
  const absorbed = new Set(tags.filter((g) => kindsListed(g).length > 0));
  for (const g of tags) {
    if (!absorbed.has(g)) continue;
    const into = kindsListed(g).filter((t) => !absorbed.has(t));
    for (const t of into) {
      weight.set(t, weight.get(t)! + weight.get(g)! / into.length);
      from.get(t)!.push(g);
    }
  }
  return tags.filter((g) => !absorbed.has(g)).map((g) => ({ id: g, weight: weight.get(g)!, from: from.get(g)! }));
}

/**
 * What knowing `known` is worth toward the requirement `need`, 0 to 1 (`ENGAGEMENT.related`): itself 1; a kind of it
 * most; its broad genre half; anything else nothing, two kinds of one broad genre included. The owner's briefs 01, 05
 * and 21 ask that mastery of an unrelated genre give no bonus, and `drama` is a family of most genres: crediting two of
 * its kinds to each other, as a first draft of 2026-10-22 did (0.375), credited social realism to a Nordic noir and
 * nearly every drama to every other, a near-universal bonus. Only a genre's own line counts, and a broad genre carries
 * to its kinds only by being known itself.
 */
export function relatedness(known: string, need: string): number {
  if (known === need) return 1;
  const r = ENGAGEMENT.related;
  if (ancestorsOf(known).has(need)) return r.kindToParent;
  if (ancestorsOf(need).has(known)) return r.parentToKind;
  return 0;
}

/** How a work's genres are known: the whole, 0 to 1, and each requirement's weight, credit and the genre that gave it. */
export interface GenreReading { total: number; needs: { id: string; weight: number; credit: number; by?: string }[] }

/**
 * How well a person knows a work's genres, 0 to 1: each requirement (`genreNeeds`) credited the best of the genres
 * they know, each by how well it's known and how related it is (`relatedness`), and the credits weighed. It never
 * falls as any genre's knowledge rises, never passes 1 however many tags a work carries, and a genre unrelated to the
 * work's adds nothing. What a person loves isn't read: preference is enjoyment's, not expertise.
 */
export function relevantGenre(person: Knower, genres: readonly string[]): GenreReading {
  const byGenre = person.engagement?.byGenre ?? {};
  const known = Object.keys(byGenre).filter((g) => knownOf(person, g) > 0);
  const needs = genreNeeds(genres).map((n) => {
    let credit = 0;
    let by: string | undefined;
    for (const g of known) {
      const c = relatedness(g, n.id) * knownOf(person, g);
      if (c > credit) { credit = c; by = g; }
    }
    return { id: n.id, weight: n.weight, credit, ...(by ? { by } : {}) };
  });
  return { total: Math.min(1, needs.reduce((a, n) => a + n.weight * n.credit, 0)), needs };
}

/** A self-tape’s hour: a take of a brief (`systems/briefs.ts`). */
export const SELF_TAPE = { minutes: 60 } as const;

/**
 * A self-tape in a genre was taped here until 2026-10-12, of no scene: the camera's task, the genre's demands and its
 * familiarity. Every self-tape is of a practice brief now, prepared and chosen first (`systems/briefs.ts`, which
 * registers `practice.self_tape`), and its take reads the brief's techniques (`tapeReadsOf`). This said `SELF_TAPE`
 * and `tapeReads` were kept for what a genre asks of the camera; the game read `SELF_TAPE.minutes` alone from
 * 2026-10-12, a take's hour, and only tests read `tapeReads` (what that tape read: the camera’s own techniques and
 * the genre’s demands, `withDemands`) and `SELF_TAPE`’s reads, difficulty and genreComplete. Those went on 2026-10-13,
 * read by nothing in the game. `selfTapeRefusal` was deleted on 2026-10-12, read by nothing once `tapeRefusal` refused
 * a take in its place.
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
