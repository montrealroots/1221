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

/**
 * How far an axis leans from the middle of its scale, -1 to 1.
 *
 * The sliders run 5 to 95, so 50 is the middle and 45 is the reach either way.
 * A person left at the defaults leans barely at all, which is the point: the
 * middle of every scale should be an ordinary person, not a bonus.
 */
function lean(value: number): number {
  return Math.max(-1, Math.min(1, ((value ?? 50) - 50) / 45));
}

/**
 * What somebody's disposition does to one of the knobs the life systems read.
 *
 * Four of the seven axes reach wellbeing, and each for a reason rather than
 * because a number was going spare:
 *
 * - Emotional stability is stress reactivity. Steady people take less on and
 *   shed it faster; volatile people do the opposite. This is the one the
 *   screen means by "how you hold up under pressure".
 * - Ambition costs. Driven people push through the point where somebody
 *   content would stop, and it shows up as stress.
 * - Conscientiousness is routine, and routine is what sleep is made of, so it
 *   moves both how well a night goes and how much of it comes back as energy.
 * Three, and it was seven. Openness, extraversion, agreeableness and risk
 * tolerance were about new places, other people and choices, and this build
 * has none of the three — so they were written into every save, read by
 * nothing, and asked for on a creation screen that was honest enough to say
 * so in as many words.
 *
 * Being honest about a dead word is better than hiding one and is not the same
 * as not having one. The deciding fact was that they appeared on that screen
 * and on no other: nothing in the build ever showed them back, which is the
 * test `background` survives by being printed under a person's name. So they
 * are gone, and the screen asks for three questions that all decide something
 * rather than seven of which three do.
 *
 * Openness was the last to be read at all. It scaled how fast `travelFatigue`
 * came off — a decay on a number nothing ever raised, so the one axis that was
 * wired reached nowhere. The dial went in the wellbeing sweep, the case here
 * went with it, and now the axis has followed both.
 */
export function axisModifier(person: Person, key: string): number {
  const p = person.personality;
  if (!p) return 1;
  const steady = lean(p.emotionalStability);
  const driven = lean(p.ambition);
  const ordered = lean(p.conscientiousness);

  let value = 1;
  switch (key) {
    case 'stressGain': value = 1 - steady * 0.3 + driven * 0.15; break;
    case 'stressRecovery': value = 1 + steady * 0.3; break;
    case 'sleepQuality': value = 1 + ordered * 0.1; break;
    case 'energyRecovery': value = 1 + ordered * 0.1; break;
    default: return 1;
  }
  return Math.round(Math.max(0.5, Math.min(1.6, value)) * 1000) / 1000;
}

/**
 * Everything about who somebody is, as one multiplier on a named knob.
 *
 * The traits they hold and the axes they were built on, multiplied together.
 * This is what the life systems ask, so neither half can be wired up without
 * the other coming with it.
 */
export function dispositionOf(person: Person, key: string): number {
  return traitModifier(person, key) * axisModifier(person, key);
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
