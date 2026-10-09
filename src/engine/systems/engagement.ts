/**
 * SLATE — interests and genres pursued (from the connected attributes of
 * 2026-10-09).
 *
 * The character sheet says what somebody loves; this keeps what they've
 * done about it, apart from that (`person.engagement`):
 *
 * - each interest's familiarity, sessions, the last one and how satiated it
 *   is (`interest.pursue`): an hour of its activity (`content/engagement.ts`)
 *   rests as its kind of rest does, less the more satiated, and a quarter
 *   more for an interest loved; and it grows the ability or technique its
 *   actor's use names, a little, toward the reach, loved or not;
 * - each genre's familiarity (`genre.study`: a film of the kind, or a play of
 *   it the game has) and practice (work done in it: a night of a play of the
 *   kind, a self-tape in it). Familiarity and practice speed the preparation
 *   of work in the genre (`genreSpeed`), the best of a work's genres and
 *   never their sum, and a self-tape reads familiarity as its "knowing the
 *   genre". Neither caps what work can reach.
 *
 * What stops farming: each is an hour that passes, satiation falls only with
 * time, the same development again the same day gives half (`develop`), a
 * work's genres share one session's practice, and choosing or dropping an
 * interest on the character sheet gives nothing: only the hours do.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatTime } from '../core/time';
import { ENGAGEMENT, INTEREST_DEFS, RECOVERY, phaseOf } from '../content/engagement';
import { GENRE_DEFS, familiesOf } from '../content/genres';
import { GENRE_BY_ID, INTEREST_BY_ID } from '../content/interests';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../content/plays';
import { TASK_PROFILES } from '../content/tasks';
import { repeatsToday } from './attributes';
import { conditionAt, focusAt, ordinary } from './school';
import { evaluate, recordWork, type Evaluation } from './evaluation';
import { SPENT, occupiedAt } from './life';
import { exerts } from './body';
import { trainingRefusal } from './injury';
import { inHospital } from './health';
import { lovesInterest } from './enjoyment';

export interface InterestState { familiarity: number; sessions: number; lastAt?: number; satiation: number; satiatedAt?: number }
export interface GenreState { familiarity: number; practice: number; lastAt?: number }
/** Kept apart from the character sheet's `interests` and `genres`, which only `systems/enjoyment.ts` reads. */
export interface Engagement { byInterest: Record<string, InterestState>; byGenre: Record<string, GenreState> }

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r2 = (x: number) => Math.round(x * 100) / 100;

export function engagementOf(person: Person): Engagement {
  person.engagement ??= { byInterest: {}, byGenre: {} };
  return person.engagement;
}
export const interestState = (person: Person, id: string): InterestState => (engagementOf(person).byInterest[id] ??= { familiarity: 0, sessions: 0, satiation: 0 });
export const genreState = (person: Person, id: string): GenreState => (engagementOf(person).byGenre[id] ??= { familiarity: 0, practice: 0 });

/** Satiation now: what the last session left, halved every two days since (Galak et al. 2011). */
export function satiationNow(s: InterestState | undefined, now: number): number {
  if (!s?.satiatedAt) return s?.satiation ?? 0;
  return s.satiation * 0.5 ** ((now - s.satiatedAt) / (ENGAGEMENT.satiation.halfLifeDays * MS_DAY));
}

/** What's common to an hour away from the work: awake, free, out of hospital, and able if it's on your feet. */
function hourRefusal(sim: Simulation, person: Person, feet: boolean): string | undefined {
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  if (feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired for it. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  return undefined;
}

export function pursueRefusal(sim: Simulation, person: Person, id: string): string | undefined {
  const def = INTEREST_DEFS[id];
  if (!def || !INTEREST_BY_ID[id]) return 'There’s no such interest.';
  return hourRefusal(sim, person, Boolean(def.feet));
}

export interface Pursued { stress: number; morale: number; developed: number; familiarity: number; phase: string; satiation: number }

/** What an hour of an interest would rest, now: its kind's, less satiation, more loved. For its look before it's done. */
export function restOf(person: Person, id: string, now: number): { stress: number; morale: number; satiation: number; loved: boolean } {
  const def = INTEREST_DEFS[id]!;
  const sat = satiationNow(engagementOf(person).byInterest[id], now);
  const loved = lovesInterest(person, id);
  const k = (1 - sat) * (loved ? ENGAGEMENT.loved : 1);
  const r = def.recovery ? RECOVERY[def.recovery] : { stress: 0, morale: 0 };
  return { stress: r2(r.stress * k), morale: r2(r.morale * k), satiation: r2(sat), loved };
}

/** An hour of an interest: the time, the energy, the rest it is, what it grows, and its history. */
export function pursue(sim: Simulation, person: Person, id: string): Pursued {
  const def = INTEREST_DEFS[id]!;
  const focus = focusAt(sim, person, sim.now);
  const rest = restOf(person, id, sim.now);
  sim.advanceTo(sim.now + ENGAGEMENT.minutes * 60_000);
  exerts(person, def.feet ? ENGAGEMENT.met.feet : ENGAGEMENT.met.desk, ENGAGEMENT.minutes / 60);
  const w = person.wellbeing;
  w.energy = clamp(w.energy - (def.feet ? ENGAGEMENT.energy.feet : ENGAGEMENT.energy.desk), 0, 100);
  w.stress = clamp(w.stress - rest.stress, 0, 100);
  w.morale = clamp(w.morale + rest.morale, 0, 100);
  const developed = ordinary(sim, person, def.develops, focus, ENGAGEMENT.weight, `interest:${id}`);
  const s = interestState(person, id);
  s.familiarity = r2(s.familiarity + 100 * ENGAGEMENT.familiarity * (1 - s.familiarity / 100));
  s.sessions += 1;
  s.lastAt = sim.now;
  s.satiation = r2(Math.min(1, rest.satiation + ENGAGEMENT.satiation.perSession));
  s.satiatedAt = sim.now;
  return { stress: rest.stress, morale: rest.morale, developed, familiarity: s.familiarity, phase: phaseOf(s.familiarity), satiation: s.satiation };
}

/** The plays the game has, with their kinds: a genre's studied in one of these where one is of it (no title invented). */
const PLAYS = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS];
export function playOfGenre(id: string): { title: string; by?: string } | undefined {
  const p = PLAYS.find((x) => (x.kinds ?? []).includes(id));
  return p ? { title: p.title, ...('by' in p && p.by ? { by: String(p.by) } : {}) } : undefined;
}

export function studyRefusal(sim: Simulation, person: Person, id: string): string | undefined {
  if (!GENRE_DEFS[id] || !GENRE_BY_ID[id]) return 'There’s no such genre.';
  return hourRefusal(sim, person, false);
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

/** A self-tape's techniques, as the self-tape coursework reads them, and its difficulty by that work's par (55). */
export const SELF_TAPE = { reads: { screen: 2, scene: 1 }, difficulty: 0.125, genreComplete: 0.6, minutes: 60 } as const;

export function selfTapeRefusal(sim: Simulation, person: Person, id: string): string | undefined {
  if (!GENRE_DEFS[id] || !GENRE_BY_ID[id]) return 'There’s no such genre.';
  return hourRefusal(sim, person, false);
}

/** A self-tape in a genre: a scene taped at home and judged as finished work, practice in the genre and the camera. */
export function selfTape(sim: Simulation, person: Person, id: string): Evaluation {
  const focus = focusAt(sim, person, sim.now);
  const condition = conditionAt(sim, person, sim.now);
  const g = genreState(person, id);
  const day = Math.floor(sim.now / MS_DAY);
  const e = evaluate(sim, person, {
    task: TASK_PROFILES.camera!, techniques: SELF_TAPE.reads, prep: { genre: g.familiarity / 100 }, required: { genre: SELF_TAPE.genreComplete },
    difficulty: SELF_TAPE.difficulty, condition, families: familiesOf([id]), key: `tape:${person.id}:${id}:${day}`,
  });
  sim.advanceTo(sim.now + SELF_TAPE.minutes * 60_000);
  person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
  recordWork(sim, person, e, { at: sim.now, what: `${GENRE_BY_ID[id]!.label}, Taped At Home` });
  ordinary(sim, person, 'screen', focus, 0.5, 'self-tape');
  practiceGenres(sim, person, [id]);
  return e;
}

export function registerEngagement(sim: Simulation): void {
  sim.onCommand<{ interest: string }, Pursued>('interest.pursue', (p, { sim: s }) => {
    const id = String(p?.interest);
    const no = pursueRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    return pursue(s, s.player, id);
  });
  sim.onCommand<{ genre: string }, { familiarity: number; with: string }>('genre.study', (p, { sim: s }) => {
    const id = String(p?.genre);
    const no = studyRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    return study(s, s.player, id);
  });
  sim.onCommand<{ genre: string }, { overall: number }>('practice.self_tape', (p, { sim: s }) => {
    const id = String(p?.genre);
    const no = selfTapeRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    return { overall: selfTape(s, s.player, id).overall };
  });
}
