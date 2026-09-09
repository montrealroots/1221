/**
 * SLATE — what a person cares about, and what the game can ask about it.
 *
 * The personality traits, the interests and the genres are three lists on a
 * character sheet. This is the door every system goes through to read them, so
 * that when there is something to read them for, there is one place it happens
 * and one set of rules about what the answers mean.
 *
 * Two things are true here and both matter.
 *
 * The personality traits already pay out: each carries `systemMods`, and the
 * life systems multiply through `traitModifier` for stress, recovery and sleep.
 * That is live today.
 *
 * The interests and the genres do not pay out yet. There is one person in this
 * build, and the questions these lists answer — what two people have in common,
 * whether somebody would take this job for the love of it — need somebody else
 * to ask about. So `sharedGround` and `affinity` are written, tested and ready,
 * and they will start meaning something the moment the world has other people
 * in it again. What they must never become is a stat: an interest says what
 * somebody cares about, not how good they are at it.
 */

import type { Person } from '../domain/model';
import { GENRE_BY_ID, INTEREST_BY_ID } from '../content/interests';
import { PERSONALITY_TRAIT_BY_ID, personalityModifier } from '../content/personality-traits';

/** The three lists, with anything the game does not recognize dropped. */
export interface Taste {
  traits: readonly string[];
  interests: readonly string[];
  genres: readonly string[];
}

function known(ids: readonly string[] | undefined, table: Readonly<Record<string, unknown>>): string[] {
  return [...new Set((ids ?? []).filter((id) => table[id] !== undefined))];
}

/**
 * A person's taste, cleaned.
 *
 * Anything not on a list this build ships is dropped rather than carried: a
 * save written by a build that had a genre this one does not should not make
 * that genre reappear in an answer.
 */
export function tasteOf(person: Person): Taste {
  return {
    traits: known(person.personalityTraits, PERSONALITY_TRAIT_BY_ID),
    interests: known(person.interests, INTEREST_BY_ID),
    genres: known(person.genres, GENRE_BY_ID),
  };
}

/** Whether this person holds a personality trait. */
export function holdsTrait(person: Person, id: string): boolean {
  return tasteOf(person).traits.includes(id);
}

/** Whether this person is into something. */
export function caresAbout(person: Person, id: string): boolean {
  return tasteOf(person).interests.includes(id);
}

/** Whether this person loves a genre. */
export function lovesGenre(person: Person, id: string): boolean {
  return tasteOf(person).genres.includes(id);
}

/**
 * What a person's traits do to one of the knobs the systems read.
 *
 * A multiplier, 1 when nothing they hold touches that knob. This is the only
 * way a trait is allowed to reach a number: a system asks for a named knob and
 * gets a factor, so adding a trait can never reach into a system directly.
 */
export function traitModifier(person: Person, key: string): number {
  return personalityModifier(tasteOf(person).traits, key);
}

/** What two people both care about. */
export interface SharedGround {
  interests: readonly string[];
  genres: readonly string[];
  traits: readonly string[];
}

export function sharedGround(a: Person, b: Person): SharedGround {
  const one = tasteOf(a);
  const two = tasteOf(b);
  const both = (x: readonly string[], y: readonly string[]) => x.filter((id) => y.includes(id));
  return {
    interests: both(one.interests, two.interests),
    genres: both(one.genres, two.genres),
    traits: both(one.traits, two.traits),
  };
}

/**
 * How much two people have in common, 0 to 1.
 *
 * Jaccard over the interests and the genres together: what they share divided
 * by everything either of them holds. Two people who like everything are not
 * more alike than two who like the same four things, which is the whole reason
 * to divide by the union rather than count the overlap.
 *
 * Personality is deliberately not in it. Sharing Quick Tempered does not make
 * two people get on, and it is at least as likely to do the opposite.
 */
export function affinity(a: Person, b: Person): number {
  const one = tasteOf(a);
  const two = tasteOf(b);
  const mine = new Set([...one.interests, ...one.genres]);
  const theirs = new Set([...two.interests, ...two.genres]);
  if (mine.size === 0 || theirs.size === 0) return 0;
  const union = new Set([...mine, ...theirs]);
  let shared = 0;
  for (const id of mine) if (theirs.has(id)) shared++;
  return Math.round((shared / union.size) * 1000) / 1000;
}

/** Anything on a person's three lists that this build does not recognize. */
export function unknownTaste(person: Person): string[] {
  const strange = (ids: readonly string[] | undefined, table: Readonly<Record<string, unknown>>) =>
    (ids ?? []).filter((id) => table[id] === undefined);
  return [
    ...strange(person.personalityTraits, PERSONALITY_TRAIT_BY_ID),
    ...strange(person.interests, INTEREST_BY_ID),
    ...strange(person.genres, GENRE_BY_ID),
  ];
}
