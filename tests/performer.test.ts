/**
 * Actor, or actress.
 *
 * They are kept apart, the way the business keeps them apart. Every label
 * about a person uses their word, the data carries both forms for the labels
 * that name the job, and no screen makes one a subheading of the other.
 */

import { describe, expect, it } from 'vitest';
import {
  PERFORMER_NOUN, categoryAdmits, impliedPerformerTitle, performerTitleOf,
} from '@/engine/core/performer';
import { TRAITS, traitName } from '@/engine/domain/attributes';
import { careerLabel } from '@/engine/world/bootstrap';

describe('what the player reads', () => {
  it('carries both forms in the data for every label that names the job', () => {
    const named = TRAITS.filter((t) => /\bAct(or|ress)\b/.test(t.name));
    expect(named.length).toBeGreaterThan(0);
    for (const trait of named) {
      expect(trait.nameByTitle, `${trait.id} names the job but has only one form`).toBeDefined();
      expect(trait.nameByTitle!.actor).toMatch(/\bActor\b/);
      expect(trait.nameByTitle!.actress).toMatch(/\bActress\b/);
    }
  });

  it('renders one word, for one person, never both at once', () => {
    for (const trait of TRAITS) {
      expect(trait.name, trait.id).not.toMatch(/\//);
      const her = traitName(trait, { pronouns: 'she/her' });
      const him = traitName(trait, { pronouns: 'he/him' });
      expect(her, trait.id).not.toMatch(/\//);
      expect(him, trait.id).not.toMatch(/\//);
      if (trait.nameByTitle) {
        expect(her).not.toBe(him);
        expect(her).toMatch(/Actress/);
        expect(him).toMatch(/Actor/);
      }
    }
  });

  it('labels the career with one word, and leaves the other crafts alone', () => {
    expect(careerLabel('actor')).toBe(PERFORMER_NOUN.actor);
    expect(careerLabel('actor')).not.toMatch(/\//);
    expect(careerLabel('director')).toBe('Director');
    expect(careerLabel('writer')).toBe('Writer');
  });
});

describe('which award category a person is routed to', () => {
  it('reads she/her as an actress and everyone else as an actor', () => {
    expect(impliedPerformerTitle('she/her')).toBe('actress');
    expect(impliedPerformerTitle('She/Her')).toBe('actress');
    expect(impliedPerformerTitle('he/him')).toBe('actor');
    expect(impliedPerformerTitle('they/them')).toBe('actor');
    expect(impliedPerformerTitle('')).toBe('actor');
  });

  it('lets an explicit title win over pronouns, in both directions', () => {
    expect(performerTitleOf({ pronouns: 'she/her', performerTitle: 'actor' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'he/him', performerTitle: 'actress' })).toBe('actress');
    expect(performerTitleOf({ pronouns: 'she/her' })).toBe('actress');
    expect(performerTitleOf({ pronouns: 'they/them', performerTitle: undefined })).toBe('actor');
  });

  it('admits only the title a category names', () => {
    expect(categoryAdmits('Best Actor', 'actor')).toBe(true);
    expect(categoryAdmits('Best Actor', 'actress')).toBe(false);
    expect(categoryAdmits('Best Actress', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Best Supporting Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Outstanding Lead Actress Drama', 'actress')).toBe(true);
    expect(categoryAdmits('Outstanding Lead Actor Comedy', 'actress')).toBe(false);
  });

  it('admits everyone when a category names neither, or both', () => {
    expect(categoryAdmits('Best Performance', 'actor')).toBe(true);
    expect(categoryAdmits('Best Performance', 'actress')).toBe(true);
    expect(categoryAdmits('Best Director', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actor or Actress', 'actress')).toBe(true);
  });
});
