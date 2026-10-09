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
import { MS_DAY, formatTime, zonedParts } from '../core/time';
import { ENGAGEMENT, INTEREST_DEFS, RECOVERY, phaseOf, type When } from '../content/engagement';
import { CITIES } from '../content/geography';
import { sunTimes } from '../core/sun';
import { spend } from './spending';
import { inSaveMoney } from './banking';
import { GENRE_DEFS, familiesOf } from '../content/genres';
import { withDemands } from '../content/demands';
import { GENRE_BY_ID, INTEREST_BY_ID } from '../content/interests';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../content/plays';
import { TASK_PROFILES } from '../content/tasks';
import { alreadyApplied, markApplied, repeatsToday } from './attributes';
import { conditionAt, focusAt, ordinary } from './school';
import { evaluate, recordWork, type Evaluation } from './evaluation';
import { SPENT, commitmentWithin, occupiedAt } from './life';
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
function hourRefusal(sim: Simulation, person: Person, feet: boolean, minutes: number = ENGAGEMENT.minutes): string | undefined {
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  const ahead = commitmentWithin(sim, minutes);
  if (ahead) return ahead;
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
  return whenRefusal(sim, person, def.when) ?? hourRefusal(sim, person, Boolean(def.feet), minutesOf(id));
}

/** How long an hour of an interest is: its `when`'s, where a source gives one, else an hour. */
export const minutesOf = (id: string): number => INTEREST_DEFS[id]?.when?.minutes ?? ENGAGEMENT.minutes;

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Why an interest can't be had now, by the constraints its sources state (`When`, from 2026-10-10): by daylight, on
 * its days, starting within its hours and with a classmate; a ticket is paid as the hour begins (`pursue`), and refused
 * there, with nothing lived, when it can't be paid. Said with the reason.
 */
export function whenRefusal(sim: Simulation, person: Person, when: When | undefined): string | undefined {
  if (!when) return undefined;
  const city = CITIES.get(person.currentLocationId);
  const zone = city?.timeZone ?? sim.homeZone;
  const p = zonedParts(sim.now, zone);
  const day = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  if (when.daylight && city) {
    const sun = sunTimes(sim.now, city.latitude, city.longitude, zone);
    const up = sun.polar === 'day' || (sun.polar !== 'night' && sun.sunrise !== undefined && sun.sunset !== undefined && sim.now >= sun.sunrise && sim.now < sun.sunset);
    if (!up) return `Not after dark. ${when.why}`;
  }
  if (when.days && !when.days.includes(day)) return `Not on a ${WEEKDAY[day]}. ${when.why}`;
  if ((when.from !== undefined && p.hour < when.from) || (when.to !== undefined && p.hour >= when.to)) return `Not at this hour. ${when.why}`;
  if (when.partnered && !person.school?.classmates.length) return `It takes others, and you have no class to ask. ${when.why}`;
  return undefined;
}

export interface Pursued { stress: number; morale: number; developed: number; familiarity: number; phase: string; satiation: number }

/** What one session adds to satiation, by familiarity: what familiarity is for, besides being kept. */
export const satiationAdded = (familiarity: number): number => ENGAGEMENT.satiation.perSession * (1 - ENGAGEMENT.satiation.familiarityEases * familiarity / 100);

/**
 * The interest an hour of which would rest the player most now, of those they could start now (from 2026-10-10): each
 * one's own rest as `restOf` works it out (its kind, less satiation, more if loved), the stress it eases first and
 * the morale it lifts after. None where no restful one can be started.
 */
export function bestRest(sim: Simulation, person: Person): { id: string; stress: number; morale: number } | undefined {
  let best: { id: string; stress: number; morale: number } | undefined;
  for (const [id, def] of Object.entries(INTEREST_DEFS)) {
    if (!def.recovery || pursueRefusal(sim, person, id)) continue;
    const r = restOf(person, id, sim.now);
    if (!best || r.stress > best.stress || (r.stress === best.stress && r.morale > best.morale)) best = { id, stress: r.stress, morale: r.morale };
  }
  return best;
}

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
  const minutes = minutesOf(id);
  // A ticket, where it costs one (`When.costUsd`): paid before the evening, or the hour doesn't happen.
  if (def.when?.costUsd !== undefined && !spend(sim, person, inSaveMoney(sim, def.when.costUsd, 'USD'), `A ticket: ${INTEREST_BY_ID[id]!.label}`, 'entertainment')) throw new CommandError('You can’t pay for the ticket.');
  sim.advanceTo(sim.now + minutes * 60_000);
  exerts(person, def.feet ? ENGAGEMENT.met.feet : ENGAGEMENT.met.desk, minutes / 60);
  const w = person.wellbeing;
  w.energy = clamp(w.energy - (def.feet ? ENGAGEMENT.energy.feet : ENGAGEMENT.energy.desk) * minutes / 60, 0, 100);
  w.stress = clamp(w.stress - rest.stress, 0, 100);
  w.morale = clamp(w.morale + rest.morale, 0, 100);
  const developed = ordinary(sim, person, def.develops, focus, ENGAGEMENT.weight, `interest:${id}`);
  const s = interestState(person, id);
  const again = repeatsToday(sim, person, `interest:${id}<familiarity`);
  s.familiarity = r2(s.familiarity + 100 * ENGAGEMENT.familiarity * 0.5 ** again * (1 - s.familiarity / 100));
  s.sessions += 1;
  s.lastAt = sim.now;
  // A developed interest sustains itself (Hidi & Renninger 2006): each session satiates less the more familiar it is,
  // by up to half at full familiarity (`ENGAGEMENT.satiation.familiarityEases`, SLATE's number).
  s.satiation = r2(Math.min(1, rest.satiation + satiationAdded(s.familiarity)));
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
  return hourRefusal(sim, person, false, ENGAGEMENT.genre.minutes);
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
  return hourRefusal(sim, person, false);
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
  sim.onCommand<{ interest: string; actionId?: string }, Pursued>('interest.pursue', (p, { sim: s }) => {
    const id = String(p?.interest);
    const no = alreadyApplied(s.player, p?.actionId) ?? pursueRefusal(s, s.player, id);
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    return pursue(s, s.player, id);
  });
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
