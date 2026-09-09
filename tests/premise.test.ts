/**
 * What SLATE is, held in place.
 *
 * SLATE is an actor and actress simulator. That is the premise, and it is the
 * most important fact about the game, so it is not left to a heading on a
 * screen: every save states it, every save carries the two titles it is about,
 * and every save records that they stand equal. These tests are what stops any
 * of that quietly going away.
 *
 * The two words are one craft under two names, and the test that matters most
 * is the one that proves neither of them is the default: two saves built
 * identically apart from the title come out the same in every respect except
 * the words used about the person.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, loadSave, migrate, quickSave, validateUniverse } from '@/engine';
import { PREMISE_STATEMENT, SAVE_SCHEMA_VERSION, type SaveUniverse } from '@/engine/domain/model';
import {
  PERFORMER_NOUN, PERFORMER_PLURAL, PERFORMER_TITLES,
  categoryAdmits, forTitle, impliedPerformerTitle, performerNoun, performerTitleOf, splitByTitle,
} from '@/engine/core/performer';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { GuardError, inspectPayload } from '../base44/shared/guard.js';

describe('every save says what game it is', () => {
  it('writes the premise into a brand new universe', () => {
    const sim = quickSave({}, 'premise-new');
    const premise = sim.universe.premise;

    expect(premise).toBeDefined();
    expect(premise.kind).toBe('actor-actress-simulator');
    expect(premise.statement).toBe(PREMISE_STATEMENT);
    expect(premise.statement).toMatch(/actor and actress simulator/i);
    expect(premise.equalStanding).toBe(true);
    expect([...premise.titles].sort()).toEqual(['actor', 'actress']);
    expect(premise.recordedAt).toBe(sim.universe.meta.createdAt);
  });

  it('agrees with the person it is about, in all three places it is written', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-agree');
    const player = sim.player;

    expect(player.performerTitle).toBe('actress');
    expect(sim.universe.premise.playerTitle).toBe('actress');
    expect(sim.universe.meta.performerTitle).toBe('actress');
    expect(sim.universe.meta.careerLabel).toBe('Actress');
  });

  it('records whether the player said it or their pronouns did', () => {
    const stated = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'premise-stated');
    expect(stated.universe.premise.playerTitle).toBe('actress');
    expect(stated.universe.premise.playerTitleSource).toBe('stated');

    const implied = quickSave({ pronouns: 'she/her' }, 'premise-implied');
    expect(implied.universe.premise.playerTitle).toBe('actress');
    expect(implied.universe.premise.playerTitleSource).toBe('implied');
  });

  it('survives a save and load round trip', () => {
    const sim = quickSave({ performerTitle: 'actress' }, 'premise-round-trip');
    sim.advanceTo(sim.now + 30 * 86_400_000);

    const reloaded = loadSave(deserialise(serialise(sim.universe)));
    expect(reloaded.universe.premise).toEqual(sim.universe.premise);
    expect(reloaded.player.performerTitle).toBe('actress');
    expect(validateUniverse(reloaded.universe).errors).toEqual([]);
  });
});

describe('actor and actress are equals', () => {
  it('gives the two titles the same game, and only different words', () => {
    const shared = { ...defaultConfig(), firstName: 'Robin', lastName: 'Vale', pronouns: 'they/them' };
    const asActor = createSave(1, 'equal-seed', { ...shared, performerTitle: 'actor' });
    const asActress = createSave(1, 'equal-seed', { ...shared, performerTitle: 'actress' });

    // The word differs.
    expect(asActor.universe.meta.careerLabel).toBe('Actor');
    expect(asActress.universe.meta.careerLabel).toBe('Actress');
    expect(asActor.universe.premise.playerTitle).not.toBe(asActress.universe.premise.playerTitle);

    // Nothing else does. Not the money, not the body, not the home, not the
    // clock, not a single number anywhere in the save.
    const strip = (u: SaveUniverse) => JSON.stringify({
      now: u.now,
      wellbeing: u.people[u.playerId]?.wellbeing,
      attributes: u.people[u.playerId]?.attributes,
      skills: u.people[u.playerId]?.skills,
      balances: Object.values(u.accounts).map((a) => a.balance).sort(),
      properties: Object.values(u.properties).map((p) => [p.marketValue, p.condition, p.bedrooms]),
      scheduled: u.scheduled.map((s) => [s.kind, s.at]),
    });
    expect(strip(asActor.universe)).toEqual(strip(asActress.universe));
  });

  it('holds neither title as the default in the vocabulary itself', () => {
    expect([...PERFORMER_TITLES].sort()).toEqual(['actor', 'actress']);
    for (const title of PERFORMER_TITLES) {
      expect(PERFORMER_NOUN[title]).toBeTruthy();
      expect(PERFORMER_PLURAL[title]).toBeTruthy();
      // Each word is its own; neither is built out of the other.
      expect(PERFORMER_NOUN[title].toLowerCase()).toBe(title);
    }
  });

  it('calls each person by their own word', () => {
    const actor = { pronouns: 'he/him', performerTitle: 'actor' as const };
    const actress = { pronouns: 'she/her', performerTitle: 'actress' as const };

    expect(performerNoun(actor)).toBe('Actor');
    expect(performerNoun(actress)).toBe('Actress');
    expect(forTitle('Method Actor/Actress', 'actress')).toBe('Method Actress');
    expect(forTitle('Method Actor/Actress', 'actor')).toBe('Method Actor');
  });

  it('splits a room into two columns and loses nobody', () => {
    const people = [
      { id: 'a', pronouns: 'she/her', performerTitle: 'actress' as const },
      { id: 'b', pronouns: 'he/him', performerTitle: 'actor' as const },
      { id: 'c', pronouns: 'they/them', performerTitle: 'actress' as const },
    ];
    const { actors, actresses } = splitByTitle(people);
    expect(actors).toHaveLength(1);
    expect(actresses).toHaveLength(2);
    expect(actors.length + actresses.length).toBe(people.length);
  });

  it('opens a category named for one title to that title only, and an unnamed one to both', () => {
    expect(categoryAdmits('Best Actress', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Best Actor', 'actor')).toBe(true);
    expect(categoryAdmits('Best Actor', 'actress')).toBe(false);
    for (const title of PERFORMER_TITLES) {
      expect(categoryAdmits('Best Performance', title)).toBe(true);
    }
  });

  it('reads a title off pronouns without ever reading a name', () => {
    expect(impliedPerformerTitle('she/her')).toBe('actress');
    expect(impliedPerformerTitle('he/him')).toBe('actor');
    expect(impliedPerformerTitle('they/them')).toBe('actor');
    // A stated title always wins over what pronouns would have said.
    expect(performerTitleOf({ pronouns: 'she/her', performerTitle: 'actor' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'he/him', performerTitle: 'actress' })).toBe('actress');
  });
});

describe('a save that has lost the premise', () => {
  it('is brought forward rather than refused', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-migrate');
    const universe = deserialise(serialise(sim.universe));

    // A save from before the premise existed.
    delete (universe as Partial<SaveUniverse>).premise;
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;

    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.steps.join(' ')).toMatch(/actor and actress simulator/i);
    expect(universe.premise.kind).toBe('actor-actress-simulator');
    expect(universe.premise.playerTitle).toBe('actress');
    expect(validateUniverse(universe).errors).toEqual([]);
  });

  it('has an untitled person settled from their pronouns', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-untitled');
    const universe = deserialise(serialise(sim.universe));

    delete (universe.people[universe.playerId] as { performerTitle?: unknown }).performerTitle;
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;

    migrate(universe);
    expect(universe.people[universe.playerId]?.performerTitle).toBe('actress');
    expect(validateUniverse(universe).errors).toEqual([]);
  });

  it('fails validation while it is still missing', () => {
    const sim = quickSave({}, 'premise-invalid');
    const universe = deserialise(serialise(sim.universe));
    delete (universe as Partial<SaveUniverse>).premise;

    const report = validateUniverse(universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/premise is missing/i);
  });

  it('fails validation when it claims to be a different game', () => {
    const sim = quickSave({}, 'premise-wrong-game');
    sim.universe.premise.kind = 'life-simulator' as 'actor-actress-simulator';

    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/which SLATE is not/i);
  });

  it('fails validation when the two titles stop being equals', () => {
    const sim = quickSave({}, 'premise-unequal');
    sim.universe.premise.equalStanding = false as true;

    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/equals/i);
  });

  it('fails validation when the premise and the person disagree', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-disagree');
    sim.universe.premise.playerTitle = 'actor';

    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/premise says the player is an actor/i);
  });
});

describe('the server will not store a save that is not this game', () => {
  const payloadOf = (mutate: (u: SaveUniverse) => void) => {
    const sim = quickSave({}, 'guard-premise');
    const universe = deserialise(serialise(sim.universe));
    mutate(universe);
    return serialise(universe);
  };

  it('accepts one that says what it is', () => {
    const accepted = inspectPayload(payloadOf(() => {}), 1);
    expect(accepted.premise.kind).toBe('actor-actress-simulator');
    expect(accepted.premise.playerTitle).toMatch(/^(actor|actress)$/);
  });

  it('refuses one with no premise at all', () => {
    expect(() => inspectPayload(payloadOf((u) => { delete (u as Partial<SaveUniverse>).premise; }), 1))
      .toThrow(/does not say what game it is/i);
  });

  it('refuses one that claims to be a different game', () => {
    expect(() => inspectPayload(payloadOf((u) => { u.premise.kind = 'farming-simulator' as 'actor-actress-simulator'; }), 1))
      .toThrow(GuardError);
    expect(() => inspectPayload(payloadOf((u) => { u.premise.kind = 'farming-simulator' as 'actor-actress-simulator'; }), 1))
      .toThrow(/actor and actress simulators/i);
  });

  it('refuses one that has demoted a title', () => {
    expect(() => inspectPayload(payloadOf((u) => { u.premise.equalStanding = false as true; }), 1))
      .toThrow(/equals/i);
  });

  it('refuses one whose player is neither', () => {
    expect(() => inspectPayload(payloadOf((u) => { u.premise.playerTitle = 'extra' as 'actor'; }), 1))
      .toThrow(/neither actor nor actress/i);
  });
});
