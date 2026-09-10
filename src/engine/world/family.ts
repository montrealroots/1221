/**
 * SLATE — the people you grew up with, made real.
 *
 * The premise has always talked about a family. The land has been the
 * family's since before the player was born, the family keeps the house up,
 * the family built the lot, and the company carries the family name. Until
 * now there was nobody in it: one person alone in a six-bedroom house on two
 * thousand acres that belonged, in the save's own words, to people who did
 * not exist.
 *
 * These are those people. A mother, a father, and — where the player had one
 * — a twin. They are ordinary: no acting traits, no prodigy, no attributes at
 * the ceiling. What they have is a name, an age, a personality, a body that
 * keeps its own hours, something they are the one who does on the land, and a
 * standing with the player that moves.
 */

import type {
  Bond, EstateRole, Id, Person, Personality, Relation, SaveUniverse,
} from '../domain/model';
import { bondKey } from '../domain/model';
import { emptyAttributeSheet } from '../domain/attributes';
import { emptySkillSheet } from '../domain/skills';
import { freshWellbeing } from '../systems/life';
import { impliedPerformerTitle } from '../core/performer';
import { clamp } from '../core/rng';
import { MS_DAY, type Instant } from '../core/time';

/** What the player says about one of their parents. */
export interface ParentConfig {
  firstName: string;
  /** How old they were when the player was born. */
  ageAtBirth: number;
  role: EstateRole;
}

/** What the player says about a twin, where they had one. */
export interface TwinConfig {
  firstName: string;
  /** A brother, a sister, or neither. */
  gender?: 'female' | 'male' | 'nonbinary';
  /**
   * Identical twins share a face, which in a game with headshots is not a
   * detail: it means the world can mistake one of them for the other.
   */
  identical: boolean;
  role: EstateRole;
}

export interface FamilyConfig {
  mother: ParentConfig;
  father: ParentConfig;
  /** Absent when the player was born alone. */
  twin?: TwinConfig;
}

/** The length of an average year in days, leap years included. */
const DAYS_IN_YEAR = 365.2425;

/** How old a parent is assumed to have been, absent an answer. */
export const DEFAULT_MOTHER_AGE = 29;
export const DEFAULT_FATHER_AGE = 31;

/** The youngest and oldest a parent can have been at the player's birth. */
export const YOUNGEST_PARENT = 15;
export const OLDEST_PARENT = 60;

/** How many days a birthday can be pushed off the child's, to avoid sharing one. */
export const BIRTHDAY_SPREAD_DAYS = 365;

/**
 * When somebody was born, given how old they were when their child was.
 *
 * Rounded up rather than to nearest: at some ages the nearest whole number of
 * days lands a few hours short of the anniversary, and a mother the player
 * said was twenty-nine would read back as twenty-eight. Rounding up costs a
 * day and cannot be wrong.
 *
 * `spread` then pushes the birthday elsewhere in the year, because subtracting
 * whole years alone would give every parent the child's own birthday, and a
 * house where three people share a candle is a bug rather than a coincidence.
 * It never reaches a full year, so the age the player gave stays true: they
 * had turned it, and had not turned the next one.
 */
export function bornBefore(childBirth: Instant, years: number, spread: number): Instant {
  const days = Math.ceil(years * DAYS_IN_YEAR) + Math.max(0, Math.min(spread, BIRTHDAY_SPREAD_DAYS - 1));
  return childBirth - days * MS_DAY;
}

/** How old somebody was on a given day, in whole years. */
export function ageOn(birth: Instant, instant: Instant): number {
  return Math.floor((instant - birth) / MS_DAY / DAYS_IN_YEAR);
}

export function defaultFamily(): FamilyConfig {
  return {
    mother: { firstName: 'Halla', ageAtBirth: DEFAULT_MOTHER_AGE, role: 'the company' },
    father: { firstName: 'Jón', ageAtBirth: DEFAULT_FATHER_AGE, role: 'the lot' },
  };
}

/**
 * A personality that is somebody's rather than nobody's.
 *
 * Drawn from the save's own stream so a family is the same family every time
 * the seed is, and kept off both extremes: a parent who is a hundred for
 * conscientiousness and nought for warmth is a character in a play, not a
 * person in a house.
 */
function personalityFrom(next: () => number): Personality {
  const dial = () => Math.round(25 + next() * 50);
  return {
    openness: dial(),
    conscientiousness: dial(),
    extraversion: dial(),
    agreeableness: dial(),
    emotionalStability: dial(),
    ambition: dial(),
    riskTolerance: dial(),
  };
}

/**
 * The sentence a person's life before this one gets.
 *
 * Everybody else's background on the character sheet is prose, so these are
 * prose. A parent's says the thing that has been true since before the player
 * could remember; a twin's cannot, because a twin was there for all of it.
 */
function backgroundFor(role: EstateRole, twin: boolean): string {
  if (twin) {
    switch (role) {
      case 'the house': return 'Born the same morning you were, and the one who keeps the house running now.';
      case 'the lot': return 'Born the same morning you were, and grew up on the lot rather than in the house.';
      case 'the company': return 'Born the same morning you were, and took the company on before you did.';
      default: return 'Born the same morning you were, in the same room, on the same land.';
    }
  }
  switch (role) {
    case 'the house': return 'Has kept the house since before you were born, and knows every draft in it.';
    case 'the lot': return 'Built the lot out of a hay barn and has run it ever since.';
    case 'the company': return 'Runs the company that carries the family name, and did long before you came home.';
    default: return 'Grew up on this land, left it once, and came back.';
  }
}

/** An ordinary person in the house: everything a person has, none of it exceptional. */
function makeRelative(spec: {
  id: Id;
  saveId: Id;
  firstName: string;
  lastName: string;
  birthInstant: Instant;
  gender?: Person['gender'];
  role: EstateRole;
  background: string;
  like: Person;
  next: () => number;
  portrait?: string;
}): Person {
  const { id, saveId, firstName, lastName, birthInstant, gender, role, like, next, portrait } = spec;
  return {
    id,
    saveId,
    isPlayer: false,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    pronouns: gender === 'female' ? 'she/her' : gender === 'male' ? 'he/him' : 'they/them',
    // A required word, not a claim. Nobody in this house is billed anywhere,
    // and nothing calls a mother an actress — but the field has to hold
    // something, and the something it holds is what their own pronouns imply.
    // Copying the player's would bill an identical twin sister as an actor.
    performerTitle: impliedPerformerTitle(
      gender === 'female' ? 'she/her' : gender === 'male' ? 'he/him' : 'they/them',
    ),
    birthInstant,
    ...(gender ? { gender } : {}),
    ...(portrait ? { portrait } : {}),
    // They are from here and they live here, which is the whole premise.
    homeRegionId: like.homeRegionId,
    citizenshipId: like.citizenshipId,
    currentLocationId: like.currentLocationId,
    residenceId: like.residenceId,
    householdId: like.householdId,
    personality: personalityFrom(next),
    interests: [],
    goals: [],
    lifestyle: like.lifestyle,
    background: spec.background,
    // Ordinary. Nothing reads a mother's acting technique, and pretending to
    // model one would put eighty-eight numbers in the save to say nothing.
    attributes: emptyAttributeSheet(),
    traits: [],
    skills: emptySkillSheet(),
    wellbeing: freshWellbeing(),
    reputation: {
      publicFame: 0, audienceAppeal: 50, professionalReputation: 0,
      reliability: 55, prestige: 0, industryDemand: 0, controversy: 0,
    },
    careerTrack: like.careerTrack,
    creditScore: like.creditScore,
    estateRole: role,
    createdAt: like.createdAt,
  };
}

/**
 * One bond, at the closeness people who live together start with.
 *
 * Its id is the pair itself, because that is what a bond is: two people have
 * exactly one, for as long as both of them exist, and there is nothing else it
 * could be called. Every other record in the save is filed under its own id,
 * and this way that stays true of these too.
 */
function makeBond(saveId: Id, a: Id, b: Id, closeness: number, now: Instant): Bond {
  const pair: [Id, Id] = a < b ? [a, b] : [b, a];
  return {
    id: bondKey(a, b), saveId, betweenIds: pair,
    closeness: clamp(closeness, 0, 100),
    // No `lastTogetherAt`. Nothing has happened yet, and the field means the
    // last time the two of them set time aside for each other rather than the
    // last time they were in the same room. On the first morning of a save
    // that is nothing, and saying "you saw them today, on purpose" would be
    // the save inventing an afternoon neither of them had.
    formedAt: now,
  };
}

/**
 * Builds the family into a universe that already has its player.
 *
 * Everybody lands in the same household, the same house and the same town,
 * because that is what living on the family land means. The starting
 * closeness is high and not full: people who have shared a house all their
 * lives are close, and nobody is at a hundred with anybody.
 */
export function populateFamily(
  universe: SaveUniverse,
  family: FamilyConfig,
  nextId: (namespace: 'person') => Id,
  next: () => number,
): { motherId: Id; fatherId: Id; twinId?: Id } {
  const player = universe.people[universe.playerId]!;
  const now = universe.now;
  const saveId = universe.meta.id;
  const surname = player.lastName;

  /** A birthday of their own, the stated number of years before the player's. */
  const born = (years: number): Instant =>
    bornBefore(player.birthInstant, years, Math.floor(next() * BIRTHDAY_SPREAD_DAYS));

  const motherId = nextId('person');
  const mother = makeRelative({
    id: motherId, saveId, firstName: family.mother.firstName.trim() || 'Mother',
    lastName: surname, birthInstant: born(clampAge(family.mother.ageAtBirth, DEFAULT_MOTHER_AGE)),
    gender: 'female', role: family.mother.role, background: backgroundFor(family.mother.role, false),
    like: player, next,
  });

  const fatherId = nextId('person');
  const father = makeRelative({
    id: fatherId, saveId, firstName: family.father.firstName.trim() || 'Father',
    lastName: surname, birthInstant: born(clampAge(family.father.ageAtBirth, DEFAULT_FATHER_AGE)),
    gender: 'male', role: family.father.role, background: backgroundFor(family.father.role, false),
    like: player, next,
  });

  let twin: Person | undefined;
  if (family.twin) {
    const twinId = nextId('person');
    twin = makeRelative({
      id: twinId, saveId, firstName: family.twin.firstName.trim() || 'Twin',
      lastName: surname,
      // The same moment, which is what makes them a twin rather than a sibling.
      birthInstant: player.birthInstant,
      gender: family.twin.gender, role: family.twin.role, background: backgroundFor(family.twin.role, true),
      like: player, next,
      // An identical twin has the player's face. The world can mistake them.
      portrait: family.twin.identical ? player.portrait : undefined,
    });
  }

  // Who is who to whom, written from each person's own side.
  const parents: Relation[] = [{ kind: 'mother', toId: motherId }, { kind: 'father', toId: fatherId }];
  player.relations = [...parents, ...(twin ? [{ kind: 'twin' as const, toId: twin.id }] : [])];
  mother.relations = [{ kind: 'child', toId: player.id }, ...(twin ? [{ kind: 'child' as const, toId: twin.id }] : [])];
  father.relations = [...mother.relations];
  if (twin) twin.relations = [...parents, { kind: 'twin', toId: player.id }];

  for (const person of [mother, father, ...(twin ? [twin] : [])]) {
    universe.people[person.id] = person;
  }

  // The household is everybody under the roof, and the parents are its heads.
  const household = player.householdId ? universe.households[player.householdId] : undefined;
  if (household) {
    household.memberIds = [player.id, motherId, fatherId, ...(twin ? [twin.id] : [])];
    household.headIds = [motherId, fatherId];
  }

  // A twin has been beside you since before either of you could talk, which
  // is a different thing from a parent and starts higher.
  const bonds: Bond[] = [
    makeBond(saveId, player.id, motherId, 72, now),
    makeBond(saveId, player.id, fatherId, 70, now),
    makeBond(saveId, motherId, fatherId, 78, now),
  ];
  if (twin) {
    bonds.push(
      makeBond(saveId, player.id, twin.id, 85, now),
      makeBond(saveId, motherId, twin.id, 72, now),
      makeBond(saveId, fatherId, twin.id, 70, now),
    );
  }
  for (const bond of bonds) universe.bonds[bond.id] = bond;

  return { motherId, fatherId, twinId: twin?.id };
}

/** An age that is possible for somebody to have been a parent at. */
function clampAge(age: number, fallback: number): number {
  return Number.isFinite(age) ? clamp(Math.round(age), YOUNGEST_PARENT, OLDEST_PARENT) : fallback;
}

// ---------------------------------------------------------------------------
// Reading it back
// ---------------------------------------------------------------------------

/** The bond between two people, where there is one. */
export function bondBetween(universe: SaveUniverse, a: Id, b: Id): Bond | undefined {
  return universe.bonds[bondKey(a, b)];
}

/** Everybody this person is related to, with what they are to them. */
export function familyOf(universe: SaveUniverse, personId: Id): { person: Person; kind: Relation['kind'] }[] {
  const person = universe.people[personId];
  if (!person?.relations) return [];
  return person.relations
    .map((relation) => ({ person: universe.people[relation.toId], kind: relation.kind }))
    .filter((entry): entry is { person: Person; kind: Relation['kind'] } => entry.person !== undefined);
}

/**
 * What one person is to another, read from the first one's side.
 *
 * Undefined where they are not related, which is most people. Lives here
 * rather than in a screen because being somebody's mother is a fact about the
 * save, and two screens were about to work it out for themselves.
 */
export function relationFrom(universe: SaveUniverse, fromId: Id, toId: Id): string | undefined {
  const found = universe.people[fromId]?.relations?.find((relation) => relation.toId === toId);
  return found ? relationWord(found.kind, universe.people[toId]?.gender) : undefined;
}

/** What one person is to another, in the word the world uses. */
export function relationWord(kind: Relation['kind'], gender?: Person['gender']): string {
  switch (kind) {
    case 'mother': return 'Mother';
    case 'father': return 'Father';
    case 'twin': return gender === 'female' ? 'Twin Sister' : gender === 'male' ? 'Twin Brother' : 'Twin';
    case 'child': return gender === 'female' ? 'Daughter' : gender === 'male' ? 'Son' : 'Child';
  }
}
