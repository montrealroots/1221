/**
 * The people you grew up with.
 *
 * The save has always talked about a family — the land is the family's, the
 * house is the family's, the company carries the family name — while the
 * house held exactly one person. These are the tests that say it holds four.
 *
 * What matters here is not that the records exist. It is that they are
 * ordinary people rather than spare players: their own birthdays, their own
 * word for themselves, no acting ability, and a standing with the player that
 * is a fact about the pair rather than a number on one of them.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { FamilyConfig } from '@/engine/world/family';
import {
  BIRTHDAY_SPREAD_DAYS, OLDEST_PARENT, YOUNGEST_PARENT,
  ageOn, bondBetween, bornBefore, familyOf, relationWord,
} from '@/engine/world/family';
import { bondKey } from '@/engine/domain/model';
import { ATTRIBUTES, emptyAttributeSheet, rate } from '@/engine/domain/attributes';
import { SKILLS, emptySkillSheet, level } from '@/engine/domain/skills';
import type { Person, SaveUniverse } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';

const YEAR_DAYS = 365.2425;

const withTwin = (over: Partial<FamilyConfig['twin']> = {}): FamilyConfig => ({
  mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' },
  father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' },
  twin: { firstName: 'Katla', gender: 'female', identical: true, role: 'the house', ...over },
});

const kin = (u: SaveUniverse): Person[] =>
  Object.values(u.people).filter((person) => !person.isPlayer);

const named = (u: SaveUniverse, first: string): Person =>
  Object.values(u.people).find((person) => person.firstName === first)!;

describe('the family at boot', () => {
  it('puts a mother and a father in the house', () => {
    const { universe } = quickSave({}, 'family-parents');
    const player = universe.people[universe.playerId]!;
    const relatives = kin(universe);

    expect(relatives).toHaveLength(2);
    expect(relatives.map((person) => person.lastName)).toEqual([player.lastName, player.lastName]);
    expect(new Set(relatives.map((person) => person.gender))).toEqual(new Set(['female', 'male']));
  });

  it('says who each of them is to the other', () => {
    const { universe } = quickSave({}, 'family-relations');
    const player = universe.people[universe.playerId]!;

    const mine = familyOf(universe, player.id);
    expect(mine.map((entry) => entry.kind).sort()).toEqual(['father', 'mother']);

    // And from their side, not only from the player's.
    for (const { person } of mine) {
      expect(familyOf(universe, person.id).map((entry) => entry.kind)).toEqual(['child']);
      expect(familyOf(universe, person.id)[0]!.person.id).toBe(player.id);
    }
  });

  it('houses them together, with the parents as the heads of it', () => {
    const { universe } = quickSave({}, 'family-household');
    const player = universe.people[universe.playerId]!;
    const household = universe.households[player.householdId!]!;

    expect(household.memberIds).toHaveLength(3);
    expect(household.memberIds).toContain(player.id);
    expect(household.headIds).toHaveLength(2);
    expect(household.headIds).not.toContain(player.id);

    // Everybody under one roof, on the family land, because that is the premise.
    for (const person of kin(universe)) {
      expect(person.householdId).toBe(player.householdId);
      expect(person.residenceId).toBe(player.residenceId);
      expect(person.currentLocationId).toBe(player.currentLocationId);
    }
  });

  it('gives each of them a standing with the player, and one with each other', () => {
    const { universe } = quickSave({}, 'family-bonds');
    const player = universe.people[universe.playerId]!;
    const [a, b] = kin(universe);

    expect(Object.keys(universe.bonds)).toHaveLength(3);
    for (const other of [a!, b!]) {
      const bond = bondBetween(universe, player.id, other.id)!;
      expect(bond).toBeDefined();
      expect(bond.closeness).toBeGreaterThan(50);
      // Close, and nobody is at a hundred with anybody.
      expect(bond.closeness).toBeLessThan(100);
    }
    expect(bondBetween(universe, a!.id, b!.id)).toBeDefined();
  });

  it('keys a standing the same whichever of the two is named first', () => {
    const { universe } = quickSave({}, 'family-bond-key');
    const player = universe.people[universe.playerId]!;
    const mother = kin(universe)[0]!;

    expect(bondBetween(universe, player.id, mother.id))
      .toBe(bondBetween(universe, mother.id, player.id));
    expect(bondKey(player.id, mother.id)).toBe(bondKey(mother.id, player.id));
  });
});

describe('what kind of people they are', () => {
  it('makes them ordinary, not spare players', () => {
    const { universe } = quickSave({}, 'family-ordinary');
    for (const person of kin(universe)) {
      expect(person.isPlayer).toBe(false);
      expect(person.traits).toEqual([]);
      expect(person.reputation.publicFame).toBe(0);
      // Nothing reads a mother's acting technique, so hers sits on the floor
      // of the scale — untrained, which is a real answer, rather than absent.
      // Nobody in the family acts, so every rating reads as the floor — and
      // that is a real answer, untrained, rather than an absent one.
      for (const a of ATTRIBUTES) expect(rate(person.attributes, a.id)).toBe(emptyAttributeSheet().base);
      for (const k of SKILLS) expect(level(person.skills, k.id)).toBe(emptySkillSheet().base);
    }
  });

  it('gives each of them a personality that is somebody rather than nobody', () => {
    const { universe } = quickSave({}, 'family-personality');
    for (const person of kin(universe)) {
      for (const dial of Object.values(person.personality)) {
        expect(dial).toBeGreaterThanOrEqual(25);
        expect(dial).toBeLessThanOrEqual(75);
      }
    }
    const [a, b] = kin(universe);
    expect(a!.personality).not.toEqual(b!.personality);
  });

  it('calls each of them by the word their own pronouns imply', () => {
    const { universe } = quickSave({ family: withTwin({ gender: 'male' }) }, 'family-title');
    expect(named(universe, 'Halla').performerTitle).toBe('actress');
    expect(named(universe, 'Jón').performerTitle).toBe('actor');
    // A twin brother is not billed the way an actress sister would be.
    expect(named(universe, 'Katla').performerTitle).toBe('actor');
  });

  it('writes each of them a background in sentences, like everybody else', () => {
    const { universe } = quickSave({}, 'family-background');
    for (const person of kin(universe)) {
      expect(person.background.length).toBeGreaterThan(20);
      expect(person.background.endsWith('.')).toBe(true);
    }
  });

  it('says what each of them is the one who does on the land', () => {
    const { universe } = quickSave({}, 'family-roles');
    for (const person of kin(universe)) {
      expect(person.estateRole).toBeDefined();
    }
  });

  it('gives them their own birthdays instead of the player’s', () => {
    // Whole years back would land every parent on the player's own birthday,
    // so this reads the actual date rather than the distance to it. Ten seeds,
    // because one family sharing no candle could be luck.
    const dayOfYear = (instant: number): string => new Date(instant).toISOString().slice(5, 10);
    let sharedACandle = 0;

    for (let seed = 0; seed < 10; seed += 1) {
      const { universe } = quickSave({ family: withTwin() }, `family-birthdays-${seed}`);
      const player = universe.people[universe.playerId]!;
      const mine = dayOfYear(player.birthInstant);

      for (const person of kin(universe)) {
        if (person.firstName === 'Katla') {
          // Except the twin, whose whole point is that it is the same day.
          expect(dayOfYear(person.birthInstant)).toBe(mine);
          continue;
        }
        if (dayOfYear(person.birthInstant) === mine) sharedACandle += 1;
      }
    }
    expect(sharedACandle).toBe(0);
  });

  it('is exactly the stated age at every age and every spread', () => {
    // The one arithmetic that can be a day out and look right. A parent the
    // player said was twenty-nine must read back as twenty-nine on the day
    // their child was born — not twenty-eight — and must not have reached
    // thirty however far their own birthday is pushed around the year.
    const childBirth = Date.UTC(2001, 5, 14, 9, 30);

    for (let years = YOUNGEST_PARENT; years <= OLDEST_PARENT; years += 1) {
      for (let spread = 0; spread < BIRTHDAY_SPREAD_DAYS; spread += 1) {
        const age = ageOn(bornBefore(childBirth, years, spread), childBirth);
        expect({ years, spread, age }).toEqual({ years, spread, age: years });
      }
    }
  });

  it('holds the age even when handed a spread outside the year', () => {
    // The spread is drawn inside the year, so this is the guard rather than
    // the path. A caller who hands it a full year, or a negative one, still
    // gets somebody the stated age rather than somebody a year out.
    const childBirth = Date.UTC(2001, 5, 14, 9, 30);
    for (const spread of [-1, -400, BIRTHDAY_SPREAD_DAYS, 1000]) {
      expect(ageOn(bornBefore(childBirth, 29, spread), childBirth)).toBe(29);
    }
  });

  it('never lands a parent on the child’s own day of the year', () => {
    const childBirth = Date.UTC(2001, 5, 14, 9, 30);
    const dayOfYear = (instant: number): string => new Date(instant).toISOString().slice(5, 10);

    for (let spread = 0; spread < BIRTHDAY_SPREAD_DAYS; spread += 1) {
      expect(dayOfYear(bornBefore(childBirth, 29, spread))).not.toBe(dayOfYear(childBirth));
    }
  });

  it('makes a parent as old as the player said they were', () => {
    const { universe } = quickSave({
      family: {
        mother: { firstName: 'Halla', ageAtBirth: 22, role: 'the house' },
        father: { firstName: 'Jón', ageAtBirth: 44, role: 'the company' },
      },
    }, 'family-ages');
    const player = universe.people[universe.playerId]!;
    const ageAtBirth = (person: Person): number =>
      (player.birthInstant - person.birthInstant) / MS_DAY / YEAR_DAYS;

    // They had turned that age at the birth, and had not turned the next one.
    expect(Math.floor(ageAtBirth(named(universe, 'Halla')))).toBe(22);
    expect(Math.floor(ageAtBirth(named(universe, 'Jón'))).toString()).toBe('44');
  });

  it('refuses an age nobody could have been a parent at', () => {
    const { universe } = quickSave({
      family: {
        mother: { firstName: 'Halla', ageAtBirth: 3, role: 'the house' },
        father: { firstName: 'Jón', ageAtBirth: 900, role: 'the company' },
      },
    }, 'family-impossible-ages');
    const player = universe.people[universe.playerId]!;
    const ageAtBirth = (person: Person): number =>
      Math.floor((player.birthInstant - person.birthInstant) / MS_DAY / YEAR_DAYS);

    expect(ageAtBirth(named(universe, 'Halla'))).toBe(YOUNGEST_PARENT);
    expect(ageAtBirth(named(universe, 'Jón'))).toBe(OLDEST_PARENT);
  });
});

describe('a twin', () => {
  it('is born the same moment you are, which is what makes them one', () => {
    const { universe } = quickSave({ family: withTwin() }, 'twin-born');
    const player = universe.people[universe.playerId]!;
    expect(named(universe, 'Katla').birthInstant).toBe(player.birthInstant);
  });

  it('is a twin to you and a child to them', () => {
    const { universe } = quickSave({ family: withTwin() }, 'twin-relations');
    const player = universe.people[universe.playerId]!;
    const twin = named(universe, 'Katla');

    expect(familyOf(universe, player.id).map((entry) => entry.kind).sort())
      .toEqual(['father', 'mother', 'twin']);
    expect(familyOf(universe, twin.id).map((entry) => entry.kind).sort())
      .toEqual(['father', 'mother', 'twin']);
    expect(familyOf(universe, named(universe, 'Halla').id).map((entry) => entry.kind))
      .toEqual(['child', 'child']);
  });

  it('starts closer to you than either parent does', () => {
    const { universe } = quickSave({ family: withTwin() }, 'twin-closeness');
    const player = universe.people[universe.playerId]!;
    const toTwin = bondBetween(universe, player.id, named(universe, 'Katla').id)!;
    const toMother = bondBetween(universe, player.id, named(universe, 'Halla').id)!;

    expect(toTwin.closeness).toBeGreaterThan(toMother.closeness);
    expect(Object.keys(universe.bonds)).toHaveLength(6);
  });

  it('shares your face when they are identical, and not when they are not', () => {
    const same = quickSave({ family: withTwin({ identical: true }) }, 'twin-identical').universe;
    const other = quickSave({ family: withTwin({ identical: false }) }, 'twin-fraternal').universe;

    expect(named(same, 'Katla').portrait).toBe(same.people[same.playerId]!.portrait);
    expect(named(other, 'Katla').portrait).toBeUndefined();
  });

  it('is somebody the house counts', () => {
    const { universe } = quickSave({ family: withTwin() }, 'twin-household');
    const player = universe.people[universe.playerId]!;
    const household = universe.households[player.householdId!]!;

    expect(household.memberIds).toHaveLength(4);
    expect(household.memberIds).toContain(named(universe, 'Katla').id);
    // Still the parents who run it.
    expect(household.headIds).toHaveLength(2);
  });

  it('is nobody at all when the player was born alone', () => {
    const { universe } = quickSave({}, 'twin-absent');
    expect(kin(universe)).toHaveLength(2);
    expect(familyOf(universe, universe.playerId).some((entry) => entry.kind === 'twin')).toBe(false);
  });
});

describe('the words for it', () => {
  it('says brother or sister where it knows, and twin where it does not', () => {
    expect(relationWord('twin', 'female')).toBe('Twin Sister');
    expect(relationWord('twin', 'male')).toBe('Twin Brother');
    expect(relationWord('twin', 'nonbinary')).toBe('Twin');
    expect(relationWord('twin')).toBe('Twin');
  });

  it('never says sibling, because the world says twin', () => {
    for (const gender of ['female', 'male', 'nonbinary', undefined] as const) {
      expect(relationWord('twin', gender).toLowerCase()).not.toContain('sibling');
    }
  });

  it('names a parent and a child the way a person would', () => {
    expect(relationWord('mother')).toBe('Mother');
    expect(relationWord('father')).toBe('Father');
    expect(relationWord('child', 'female')).toBe('Daughter');
    expect(relationWord('child', 'male')).toBe('Son');
    expect(relationWord('child')).toBe('Child');
  });
});

describe('the same seed makes the same family', () => {
  it('twice over, down to the personalities', () => {
    const first = quickSave({ family: withTwin() }, 'family-repeat').universe;
    const second = quickSave({ family: withTwin() }, 'family-repeat').universe;

    const shape = (u: SaveUniverse): unknown => kin(u)
      .map((person) => [person.firstName, person.birthInstant, person.personality]);
    expect(shape(first)).toEqual(shape(second));
  });

  it('and a different seed makes a different one', () => {
    const first = quickSave({}, 'family-seed-a').universe;
    const second = quickSave({}, 'family-seed-b').universe;
    expect(kin(first).map((p) => p.personality)).not.toEqual(kin(second).map((p) => p.personality));
  });
});
