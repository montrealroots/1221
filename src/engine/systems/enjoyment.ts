/**
 * SLATE — doing what you love.
 *
 * The one place the engine reads what somebody loves, and the owner's rule for
 * it, set on 2026-09-24: a preference may change how much somebody gets out of
 * doing a thing, never how good they are at it. So what this decides is mood
 * and stress, and nothing else.
 *
 * Until 2026-10-10 what somebody loved was two lists on the character sheet,
 * their interests and their genres. The interests (cooking, theater, a stage's
 * crafts, travel and some sixty more) lifted an hour of looking after
 * yourself, a rehearsal among crafts they loved, a play read, a piece of
 * coursework in a craft; and from 2026-10-09 each was also an hour of its own
 * (`interest.pursue`). The owner removed the interests that day, and the
 * question at creation with them: they duplicated Unwind as rest, grew
 * abilities by a slower road than practice, and carried the weakest research.
 * With them went every list that existed only to be matched against them: the
 * look-after menu's loves, the crafts at a stage, a rehearsal and a genre
 * (`CRAFTS_AT`, `GENRE_CRAFTS`), a play read's, a template's (`Template.crafts`),
 * and what creation said they moved (`interestsRead`). Migration 94 dropped
 * them from every save.
 *
 * What stays is the genres: a rehearsal or a night of a play whose kind they
 * love lifts the mood and eases the stress (`lovedInWork`, by `genresOfPlay`),
 * the performance no better for it. And three dispositions, under the same
 * rule since 2026-09-27: extraversion how a house or a class watching is taken
 * (`takeTheHouse`, at every performance's nerves), openness new work (a
 * festival's new play, a Cabaret piece), and agreeableness the company of a
 * rehearsal. None of them makes anybody better at anything.
 */

import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../content/plays';

/**
 * The genres something in a student's life reads: the kinds of the plays the game has, which a rehearsal and a night
 * of them read. Creation marks the rest as said back only (from 2026-10-09; it named the interests too until
 * 2026-10-10, as `interestsRead`).
 */
export function genresRead(): Set<string> {
  return new Set([...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].flatMap((p) => p.kinds ?? []));
}

/**
 * A day's work as enjoyment sees it: the play's kinds, whether it's new work, or a rehearsal. Until 2026-10-10 it
 * carried a medium, a role and a set of crafts too, read only against the interests; until 2026-10-13 it declared a day
 * away from home too, which openness took as it takes new work and which no call set.
 */
export interface WorkDay {
  /** A play's kinds of story (`genresOfPlay`). */
  genres?: readonly string[];
  /** New work: a festival's new play or a Cabaret piece, taken by openness. */
  novel?: boolean;
  rehearsal?: boolean;
}

/** What of somebody's a day's work is: the first of the play's kinds they love, once however many they love. */
export function lovedInWork(person: Pick<Person, 'genres'>, day: WorkDay): string[] {
  const kind = (day.genres ?? []).find((g) => (person.genres ?? []).includes(g));
  return kind ? [kind] : [];
}

/** What a loved thing about a day's work gives the mood and takes off the stress: SLATE's estimate. */
export const LOVED_WORK = { mood: 1.5, relief: 1.5 } as const;

/**
 * How somebody's disposition takes the work, SLATE's estimate: a house or a class watching is up to 4 points of
 * stress more for the most introverted and 4 less for the most extraverted; new work up to 2 of morale either way by
 * openness (`away`, named for the day away it took too until 2026-10-13, which no call set); a day of rehearsal up to
 * 2 either way by agreeableness. Fifty is neither.
 */
export const DISPOSED = { room: 4, away: 2, rehearsal: 2 } as const;

const lean = (axis: number | undefined) => ((axis ?? 50) - 50) / 50;

/** A day's work, enjoyed or not: a play of a kind they love, new work by openness, and a rehearsal by agreeableness. */
export function enjoyWork(person: Person, day: WorkDay): void {
  const w = person.wellbeing;
  const loved = lovedInWork(person, day).length;
  let mood = loved * LOVED_WORK.mood;
  if (day.novel) mood += DISPOSED.away * lean(person.personality?.openness);
  if (day.rehearsal) mood += DISPOSED.rehearsal * lean(person.personality?.agreeableness);
  w.morale = clamp(w.morale + mood, 0, 100);
  w.stress = clamp(w.stress - loved * LOVED_WORK.relief, 0, 100);
}

/**
 * What a turn at school does to the mood and the stress, SLATE's estimate: being let go or replaced a blow, a
 * dismissal the worst of them and the degree the best. Morale moves by the temperament's swing, stress by how it
 * gains. Until 2026-09-27 none of them moved anything.
 */
export const TURNS = {
  booked: { morale: 6, stress: -2 },
  signed: { morale: 8, stress: -3 },
  pickedUp: { morale: 6, stress: -2 },
  graduated: { morale: 12, stress: -6 },
  concern: { morale: -3, stress: 3 },
  recast: { morale: -5, stress: 3 },
  canceled: { morale: -6, stress: 3 },
  warning: { morale: -6, stress: 6 },
  dropped: { morale: -8, stress: 6 },
  replaced: { morale: -10, stress: 8 },
  dismissed: { morale: -20, stress: 15 },
} as const;

/** A turn, felt. */
export function feel(person: Person, turn: keyof typeof TURNS): void {
  const w = person.wellbeing;
  const { morale, stress } = TURNS[turn];
  w.morale = clamp(w.morale + morale * personalityOf(person, 'moraleSwing'), 0, 100);
  w.stress = clamp(w.stress + (stress > 0 ? stress * personalityOf(person, 'stressGain') : stress), 0, 100);
}

/**
 * A house, or a class, watching: taken as the disposition takes it, up to 4 of stress either way by extraversion
 * (`DISPOSED.room`). Read at every performance's nerves (`nerves` in `systems/attributes.ts`), from 2026-10-09.
 */
export function takeTheHouse(person: Person): void {
  const w = person.wellbeing;
  w.stress = clamp(w.stress - DISPOSED.room * lean(person.personality?.extraversion), 0, 100);
}
