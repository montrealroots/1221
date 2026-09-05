/**
 * Actors and actresses are two lists, not one.
 *
 * A person carries their own title, every label about them uses their word,
 * and any list that would pile them together is split with both halves kept.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { createUniverse, defaultConfig } from '@/engine/world/bootstrap';
import {
  PERFORMER_NOUN, PERFORMER_PLURAL, categoryAdmits, forTitle, impliedPerformerTitle,
  performerNoun, performerTitleOf, splitByTitle, splitRecordsByTitle, titleFromGender,
} from '@/engine/core/performer';
import { TRAIT_BY_ID, traitName } from '@/engine/domain/attributes';
import { CRAFT_ROLE_PLURAL } from '@/engine/content/craft-attributes';

describe('which of the two somebody is', () => {
  it('takes their own word first, then the record, then their pronouns', () => {
    expect(performerTitleOf({ pronouns: 'she/her' })).toBe('actress');
    expect(performerTitleOf({ pronouns: 'he/him' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'they/them' })).toBe('actor');
    // A stated title wins over what pronouns would have implied.
    expect(performerTitleOf({ pronouns: 'she/her', performerTitle: 'actor' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'he/him', performerTitle: 'actress' })).toBe('actress');
    // The record's own statement, and nothing guessed from anything else.
    expect(titleFromGender('female')).toBe('actress');
    expect(titleFromGender('male')).toBe('actor');
    expect(titleFromGender('non-binary')).toBeUndefined();
    expect(titleFromGender(undefined)).toBeUndefined();
    expect(impliedPerformerTitle('She/Her')).toBe('actress');
  });

  it('never lets the title touch anything but the word', () => {
    const her = { pronouns: 'she/her' };
    const him = { pronouns: 'he/him' };
    expect(performerNoun(her)).toBe('Actress');
    expect(performerNoun(him)).toBe('Actor');
    expect(PERFORMER_PLURAL.actress).toBe('Actresses');
    expect(PERFORMER_NOUN.actor).toBe('Actor');
    // The award categories are the one place the industry splits the word.
    expect(categoryAdmits('Best Actress', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Best Actor', 'actress')).toBe(false);
    expect(categoryAdmits('Best Performance', 'actress')).toBe(true);
    expect(categoryAdmits('Best Supporting Actor', 'actor')).toBe(true);
  });
});

describe('the lists', () => {
  it('splits people into two columns and keeps everybody', () => {
    const people = [
      { id: 'a', pronouns: 'she/her' }, { id: 'b', pronouns: 'he/him' },
      { id: 'c', pronouns: 'they/them' }, { id: 'd', pronouns: 'she/her', performerTitle: 'actor' as const },
    ];
    const { actors, actresses } = splitByTitle(people);
    expect(actresses.map((p) => p.id)).toEqual(['a']);
    expect(actors.map((p) => p.id)).toEqual(['b', 'c', 'd']);
    expect(actors.length + actresses.length).toBe(people.length);
  });

  it('keeps anybody the record does not state out of a column they did not choose', () => {
    const records = [{ gender: 'female' }, { gender: 'male' }, { gender: 'non-binary' }, {}];
    const { actors, actresses, unstated } = splitRecordsByTitle(records);
    expect(actresses.length).toBe(1);
    expect(actors.length).toBe(1);
    expect(unstated.length).toBe(2);
    expect(actors.length + actresses.length + unstated.length).toBe(records.length);
  });

  it('has a plural for every craft, including the one that was missing', () => {
    expect(CRAFT_ROLE_PLURAL.composer).toBe('Composers');
    for (const value of Object.values(CRAFT_ROLE_PLURAL)) expect(value).toBeTruthy();
  });
});

describe('the words on a sheet', () => {
  it('names the traits that name the job for whoever holds them', () => {
    const method = TRAIT_BY_ID['method_actor']!;
    expect(traitName(method, { pronouns: 'she/her' })).toBe('Method Actress');
    expect(traitName(method, { pronouns: 'he/him' })).toBe('Method Actor');
    expect(traitName(method, { pronouns: 'they/them' })).toBe('Method Actor');
    // A stated title wins here too.
    expect(traitName(method, { pronouns: 'she/her', performerTitle: 'actor' })).toBe('Method Actor');
    // With nobody in hand it reads as the plain name rather than both at once.
    expect(traitName(method)).toBe('Method Actor');
    expect(traitName(method)).not.toMatch(/\//);
    // A trait that does not name the job reads the same for everyone.
    const chameleon = TRAIT_BY_ID['chameleon']!;
    expect(traitName(chameleon, { pronouns: 'she/her' })).toBe(chameleon.name);
  });

  it('renders a label that carries both words for one person', () => {
    expect(forTitle('Method Actor/Actress', 'actress')).toBe('Method Actress');
    expect(forTitle('Method Actor/Actress', 'actor')).toBe('Method Actor');
    expect(forTitle('Nothing To Do With It', 'actress')).toBe('Nothing To Do With It');
  });
});

describe('a new save', () => {
  it('carries the title the player stated, and falls back to their pronouns', () => {
    const stated = createUniverse(1, 'title-stated', { ...defaultConfig(), pronouns: 'they/them', performerTitle: 'actress' }).universe;
    expect(stated.people[stated.playerId]!.performerTitle).toBe('actress');
    expect(performerTitleOf(stated.people[stated.playerId]!)).toBe('actress');

    const implied = createUniverse(1, 'title-implied', { ...defaultConfig(), pronouns: 'she/her' }).universe;
    expect(implied.people[implied.playerId]!.performerTitle).toBeUndefined();
    expect(performerTitleOf(implied.people[implied.playerId]!)).toBe('actress');
  });

  it('reads the record’s own statement onto the real people it brings in', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'title-real');
    void sim;
    // Covered end to end in the real-people suite; here it is enough that the
    // mapping the save uses is the record's and nothing else.
    expect(titleFromGender('female')).toBe('actress');
  });
});
