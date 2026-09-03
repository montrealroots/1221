/**
 * Actor, or actress.
 *
 * The word has to follow the character everywhere it is used, and the award
 * categories that are named for it have to admit the right people. Both are
 * a rule about words, so both are tested as one.
 */

import { describe, expect, it } from 'vitest';
import {
  categoryAdmits, impliedPerformerTitle, performerLabel, performerTitleOf, performerWord,
} from '@/engine/core/performer';
import { TRAITS } from '@/engine/domain/attributes';
import { careerLabel } from '@/engine/world/bootstrap';

describe('which title a person goes by', () => {
  it('reads she/her as an actress and everyone else as an actor', () => {
    expect(impliedPerformerTitle('she/her')).toBe('actress');
    expect(impliedPerformerTitle('She/Her')).toBe('actress');
    expect(impliedPerformerTitle('he/him')).toBe('actor');
    expect(impliedPerformerTitle('they/them')).toBe('actor');
    expect(impliedPerformerTitle('')).toBe('actor');
  });

  it('lets an explicit choice win over pronouns, in both directions', () => {
    expect(performerTitleOf({ pronouns: 'she/her', performerTitle: 'actor' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'he/him', performerTitle: 'actress' })).toBe('actress');
    expect(performerTitleOf({ pronouns: 'she/her' })).toBe('actress');
    expect(performerTitleOf({ pronouns: 'they/them', performerTitle: undefined })).toBe('actor');
  });

  it('spells the word as a title', () => {
    expect(performerWord('actor')).toBe('Actor');
    expect(performerWord('actress')).toBe('Actress');
  });
});

describe('labels written for an actor', () => {
  it('read as actress for an actress and are untouched for an actor', () => {
    expect(performerLabel('Method Actor', 'actress')).toBe('Method Actress');
    expect(performerLabel('Character Actor', 'actress')).toBe('Character Actress');
    expect(performerLabel('Technical Actor', 'actress')).toBe('Technical Actress');
    expect(performerLabel('Method Actor', 'actor')).toBe('Method Actor');
  });

  it('change whole words only', () => {
    expect(performerLabel('Reactor', 'actress')).toBe('Reactor');
    expect(performerLabel('Factory Floor', 'actress')).toBe('Factory Floor');
    expect(performerLabel('Director', 'actress')).toBe('Director');
  });

  it('are the same applied once or twice', () => {
    const once = performerLabel('Character Actor', 'actress');
    expect(performerLabel(once, 'actress')).toBe(once);
  });

  it('cover every trait that names the profession', () => {
    const named = TRAITS.filter((t) => /\bActor\b/.test(t.name));
    expect(named.length).toBeGreaterThan(0);
    for (const trait of named) {
      expect(performerLabel(trait.name, 'actress')).toMatch(/\bActress\b/);
      expect(performerLabel(trait.name, 'actress')).not.toMatch(/\bActor\b/);
    }
  });

  it('give the career its right word and leave the others alone', () => {
    expect(careerLabel('actor')).toBe('Actor');
    expect(careerLabel('actor', 'actress')).toBe('Actress');
    expect(careerLabel('director', 'actress')).toBe('Director');
    expect(careerLabel('writer', 'actress')).toBe('Writer');
  });
});

describe('award categories named for a title', () => {
  it('admit only that title', () => {
    expect(categoryAdmits('Best Actor', 'actor')).toBe(true);
    expect(categoryAdmits('Best Actor', 'actress')).toBe(false);
    expect(categoryAdmits('Best Actress', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Best Supporting Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Outstanding Lead Actress Drama', 'actress')).toBe(true);
    expect(categoryAdmits('Outstanding Lead Actor Comedy', 'actress')).toBe(false);
  });

  it('admit everyone when they name neither, or both', () => {
    expect(categoryAdmits('Best Performance', 'actor')).toBe(true);
    expect(categoryAdmits('Best Performance', 'actress')).toBe(true);
    expect(categoryAdmits('Best Director', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actor or Actress', 'actress')).toBe(true);
  });
});
