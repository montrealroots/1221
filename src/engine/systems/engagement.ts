/**
 * SLATE — genres studied and worked in (from the connected attributes of 2026-10-09).
 *
 * The character sheet says which genres somebody loves; this keeps what they've done about them, apart from that
 * (`person.engagement`): each genre's familiarity (`genre.study`: a film of the kind, or a play of it the game has)
 * and practice (work done in it: a night of a play of the kind, a self-tape in it, `practice.self_tape`).
 * A take of a brief reads how well its genres are known, the better of familiarity and practice (`genreKnown` in
 * `systems/briefs.ts`), and the two speed a scene for class from a play of the kind and a part's lines in one
 * (`genreSpeed`). Neither caps what work can reach. Until brief 21 (2026-10-22) a work's genres were read as the best
 * known of them, never their sum; from then each counts for its weight in the work (`relevantGenre`), the weights
 * summing to one, and the same reading is part of an audition's, a self-tape's, a shoot day's and a night's
 * preparation and of casting's fit (`projobs.ts`, `school.ts`). From brief 22 the weights are the material's own,
 * stated at the most precise level the game holds (`resolveGenres`, `content/genre-weights.ts`), where brief 21's
 * `genreNeeds` gave the first-listed tag half. This said a
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
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS, genresOfPlay } from '../content/plays';
import { PROJECT_GENRES, ROLE_GENRES, SCENE_GENRES, playGenresOf, type GenreWeights } from '../content/genre-weights';
import type { ProjectTemplate } from '../content/careerwork';
import { SEAGULL_2027 } from '../content/school';
import { SCENES } from '../content/coursework';
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
 * Practice in a work's genres: one session's worth shared among its requirement's genres by weight (`resolveGenres`),
 * so a tag listed twice, or a broad genre listed beside its own kind, doesn't take a share of its own, and only the
 * genres the work asks are practiced: a related genre that helps meet one (`relatedness`) earns nothing stored. Until
 * 2026-10-22 (brief 21) it was shared evenly among the tags as listed, so `['psychological_thriller', 'thriller']` gave
 * each half; brief 21 shared it by the first-listed half, and brief 22 by the work's stated weights.
 */
export function practiceGenres(sim: Simulation, person: Person, work: Work, amount = 1): void {
  for (const id of creditPractice(engagementOf(person), work, amount)) genreState(person, id).lastAt = sim.now;
}

/** One session's practice in a work's genres, by its requirement's weights, on a record with no clock: the genres credited. */
export function creditPractice(record: Engagement, work: Work, amount = 1): string[] {
  return requirementOf(work).needs.map((need) => {
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
 * How much faster preparation goes in a work's genres: by how well its requirement is met (`relevantGenre`), at most a
 * sixth. Until 2026-10-22 (brief 21) it was the best-known of its tags, so knowing one of a work's two genres sped it as
 * much as knowing both.
 */
export function genreSpeed(person: Knower, work: Work | undefined): number {
  return 1 + ENGAGEMENT.genreSpeed * relevantGenre(person, work ?? []).total;
}

// ---------------------------------------------------------------------------------------------------------------------
// A work's genres: what it asks, and how well it's known (from 2026-10-22, the owner's briefs 21 and 22)
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

/** The levels a requirement can be stated at, the most precise first where a reader passes several. */
export type GenreLevel = 'scene' | 'part' | 'role' | 'play' | 'project' | 'brief' | 'tags';

/** One level's statement of a work's genres: its weights where they're written, its tags where they're not. */
export interface GenreSource { level: GenreLevel; weights?: GenreWeights; tags?: readonly string[] }

/** One requirement of a work: the genre, its share of the whole, and the genres it took in (a broad genre folded in). */
export interface GenreNeed { id: string; weight: number; from: string[] }

/**
 * A work's genres resolved, one set for every reading: its needs, their weights summing to 1, sorted by genre; the level
 * they came from; whether written there (`stated`), read evenly from its tags (`even`, the neutral fallback) or none
 * found (`none`); and each level skipped for invalid weights, with why.
 */
export interface GenreRequirement {
  needs: GenreNeed[];
  level?: GenreLevel;
  how: 'stated' | 'even' | 'none';
  skipped: { level: GenreLevel; why: string }[];
}

/** What a reader can be given for a work: its resolved requirement, or tags alone, read evenly (an older record). */
export type Work = GenreRequirement | readonly string[];

/** Why a set of weights can't be read, or nothing: a genre the game doesn't have, a weight that isn't a number or is below 0, or none above 0. */
export function weightsProblem(weights: GenreWeights): string | undefined {
  const entries = Object.entries(weights);
  for (const [g, w] of entries) {
    if (!GENRE_DEFS[g]) return `${g} isn't a genre the game has`;
    if (typeof w !== 'number' || !Number.isFinite(w)) return `${g}'s weight isn't a number`;
    if (w < 0) return `${g}'s weight is below 0`;
  }
  return entries.some(([, w]) => w > 0) ? undefined : 'no genre weighs above 0';
}

/**
 * A work's requirement from its levels, the most precise first (from 2026-10-22, the owner's brief 22): the first level
 * that states valid weights gives the whole set, and none is merged with another; a level whose weights are invalid
 * (`weightsProblem`) is skipped, said in `skipped`, and its tags read instead where it has any; a level with tags and no
 * weights reads them evenly, the neutral fallback for older content; a level with neither passes to the next. Then:
 *
 * - **normalized and bounded:** each weight a share of their sum, nonnegative, at most 1, summing to 1, a genre at 0
 *   dropped; a tag listed twice is one genre;
 * - **overlap folded:** a broad genre listed beside one of its own kinds, at any depth, is the same demand said twice,
 *   so its weight passes to the narrowest listed kinds, evenly, and one expertise is never counted twice;
 * - **order-free:** the genres are sorted and summed by id, so listing them in another order changes nothing, to the
 *   bit.
 *
 * Until brief 22 there was one level, a work's tags, and the first listed carried half the weight where there were two
 * or more (`ENGAGEMENT.weights.primary`, brief 21's `genreNeeds`), so the order a list was written in decided what a
 * work asked.
 */
export function resolveGenres(...sources: (GenreSource | undefined)[]): GenreRequirement {
  const skipped: GenreRequirement['skipped'] = [];
  for (const source of sources) {
    if (!source) continue;
    if (source.weights) {
      const problem = weightsProblem(source.weights);
      if (!problem) return folded(Object.entries(source.weights), source.level, 'stated', skipped);
      skipped.push({ level: source.level, why: problem });
    }
    const tags = [...new Set(source.tags ?? [])].filter((g) => GENRE_DEFS[g]);
    if (tags.length) return folded(tags.map((g) => [g, 1]), source.level, 'even', skipped);
  }
  return { needs: [], how: 'none', skipped };
}

function folded(pairs: [string, number][], level: GenreLevel, how: 'stated' | 'even', skipped: GenreRequirement['skipped']): GenreRequirement {
  const kept = pairs.filter(([, w]) => w > 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const sum = kept.reduce((a, [, w]) => a + w, 0);
  const weight = new Map(kept.map(([g, w]) => [g, w / sum]));
  const ids = kept.map(([g]) => g);
  const from = new Map(ids.map((g) => [g, [g]]));
  const kindsListed = (g: string) => ids.filter((t) => t !== g && ancestorsOf(t).has(g));
  // A broad genre with a kind of its own listed is folded in, its weight and name passed to the kinds that aren't
  // themselves folded (the narrowest listed).
  const absorbed = new Set(ids.filter((g) => kindsListed(g).length > 0));
  for (const g of ids) {
    if (!absorbed.has(g)) continue;
    const into = kindsListed(g).filter((t) => !absorbed.has(t));
    for (const t of into) {
      weight.set(t, weight.get(t)! + weight.get(g)! / into.length);
      from.get(t)!.push(g);
    }
  }
  return { needs: ids.filter((g) => !absorbed.has(g)).map((g) => ({ id: g, weight: weight.get(g)!, from: from.get(g)! })), level, how, skipped };
}

/** A reader's work as a requirement: tags alone read evenly, at no level of their own (`tags`). */
export const requirementOf = (work: Work): GenreRequirement => ('needs' in work ? work : resolveGenres({ level: 'tags', tags: work }));

/**
 * What knowing `known` is worth toward the requirement `need`, 0 to 1 (`ENGAGEMENT.related`), across one direct link
 * only (from 2026-10-22, the owner's brief 22, approving "partial transfer between a broad genre and its direct
 * subgenres"): itself 1; a direct kind of it toward its broad genre `kindToParent`; a broad genre toward its direct
 * kind `parentToKind`; anything else nothing: two kinds of one broad genre, a genre two links away, an unrelated one.
 * Until brief 22 the links were read through any depth (`ancestorsOf`), so the 12 kinds of a broad genre that is itself
 * a kind (Nordic noir of crime, crime of drama) counted toward drama at 0.75, two links away.
 */
export function relatedness(known: string, need: string): number {
  if (known === need) return 1;
  const r = ENGAGEMENT.related;
  if (parentsOf(known).includes(need)) return r.kindToParent;
  if (parentsOf(need).includes(known)) return r.parentToKind;
  return 0;
}

/** How a work's genres are known: the whole, 0 to 1, the requirement read, and each need's weight, the genre's own knowledge, the best related credit, the two together, and the related genre that gave it. */
export interface GenreReading {
  total: number;
  requirement: GenreRequirement;
  needs: { id: string; weight: number; own: number; related: number; credit: number; by?: string }[];
}

/**
 * How well a person knows a work's genres, 0 to 1: each need met by the genre's own knowledge and the best credit a
 * directly related genre gives (`relatedness`), together as `1 − (1 − own) × (1 − related)`, and the needs weighed.
 * Exact knowledge counts in full and always adds, so studying a work's own genre is never wasted on a broad genre
 * already known; a related genre helps up to its link's share and no further; the best related genre counts once, never
 * summed with another; nothing passes 1, nothing falls as any genre's knowledge rises, and an unrelated genre adds
 * nothing. Until 2026-10-22 (brief 21) each need took the better of the two alone, so studying the genre itself added
 * nothing until it passed what a related genre gave. What a person loves isn't read: preference is enjoyment's.
 */
export function relevantGenre(person: Knower, work: Work): GenreReading {
  const requirement = requirementOf(work);
  const byGenre = person.engagement?.byGenre ?? {};
  const known = Object.keys(byGenre).filter((g) => knownOf(person, g) > 0).sort();
  const needs = requirement.needs.map((n) => {
    const own = knownOf(person, n.id);
    let related = 0;
    let by: string | undefined;
    for (const g of known) {
      if (g === n.id) continue;
      const c = relatedness(g, n.id) * knownOf(person, g);
      if (c > related) { related = c; by = g; }
    }
    const credit = 1 - (1 - own) * (1 - related);
    return { id: n.id, weight: n.weight, own, related, credit, ...(by ? { by } : {}) };
  });
  return { total: Math.min(1, needs.reduce((a, n) => a + n.weight * n.credit, 0)), requirement, needs };
}

// ---------------------------------------------------------------------------------------------------------------------
// Each material's requirement, read from what it states (`content/genre-weights.ts`)
// ---------------------------------------------------------------------------------------------------------------------

/** A professional role's: its own where `ROLE_GENRES` gives one, else its project's, else the project's tags evenly. */
export const requirementOfRole = ({ id, project, genres }: Pick<ProjectTemplate, 'id' | 'project' | 'genres'>): GenreRequirement =>
  resolveGenres({ level: 'role', weights: ROLE_GENRES[id]?.weights }, { level: 'project', weights: PROJECT_GENRES[project]?.weights, tags: genres });

/** A play's, or a part's in it: the part's own where the play gives one, else the play's, else its tags evenly. */
export function requirementOfPlay(title: string | undefined, part?: string, tags?: readonly string[]): GenreRequirement {
  const stated = playGenresOf(title);
  return resolveGenres(part ? { level: 'part', weights: stated?.parts?.[part]?.weights } : undefined, { level: 'play', weights: stated?.weights, tags: tags ?? genresOfPlay(title) });
}

/**
 * A School holder's (a casting, an understudy, the Rep's or the Cabaret's): its part's in its play (`requirementOfPlay`),
 * the Rep's 2026–27 Seagull by its own name. What `genresOfHolder` gave as tags until 2026-10-22 (brief 22).
 */
export function requirementOfHolder(h: { play?: string; kind?: string; production?: string; role?: string } | undefined): GenreRequirement {
  if (h?.play) return requirementOfPlay(h.play, h.role);
  return (h?.kind === 'role' || h?.kind === 'understudy') && h.production === SEAGULL_2027.name ? requirementOfPlay('The Seagull', h.role, SEAGULL_2027.kinds) : resolveGenres();
}

/** A practice brief's: its one genre (every brief is written for one, `Brief.kinds`). */
export const requirementOfBrief = (b: { kinds: readonly string[] }): GenreRequirement => resolveGenres({ level: 'brief', tags: b.kinds });

/**
 * A class scene's: its own where `SCENE_GENRES` gives one, else its play's, else its filed genre (`Scene.genre`), which
 * is coarser than a play's kinds and so read only where the play names none.
 */
export function requirementOfScene(sceneId: string | undefined): GenreRequirement {
  const scene = sceneId ? SCENE_BY_ID.get(sceneId) : undefined;
  if (!scene) return resolveGenres();
  const stated = playGenresOf(scene.play);
  return resolveGenres({ level: 'scene', weights: SCENE_GENRES[scene.id]?.weights }, { level: 'play', weights: stated?.weights, tags: genresOfPlay(scene.play) }, { level: 'scene', tags: [scene.genre] });
}
const SCENE_BY_ID = new Map(SCENES.map((x) => [x.id, x]));

/**
 * A requirement in words, as a casting notice or the showcase's note says it (from 2026-10-22, the owner's brief 22):
 * "Domestic Drama"; two or more within a tenth of each other "Tragedy and Drama, about evenly"; otherwise the heaviest
 * first, "Mostly Farce, with some Romantic Comedy". Never a weight or a share.
 */
export function requirementWords(req: GenreRequirement): string | undefined {
  const label = (id: string) => GENRE_BY_ID[id]?.label ?? id;
  const needs = [...req.needs].sort((a, b) => b.weight - a.weight || (a.id < b.id ? -1 : 1));
  if (!needs.length) return undefined;
  if (needs.length === 1) return label(needs[0]!.id);
  const list = (ids: string[]) => (ids.length === 1 ? ids[0]! : `${ids.slice(0, -1).join(', ')} and ${ids.at(-1)}`);
  if (needs[0]!.weight - needs.at(-1)!.weight <= 0.1) return `${list(needs.map((n) => label(n.id)))}, about evenly`;
  return `Mostly ${label(needs[0]!.id)}, with some ${list(needs.slice(1).map((n) => label(n.id)))}`;
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
