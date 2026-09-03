/**
 * Actor/Actress.
 *
 * Every label the player reads carries both words, so one page serves
 * everyone. The award categories are the exception the industry insists on,
 * and those have to admit the right people.
 */

import { describe, expect, it } from 'vitest';
import { categoryAdmits, impliedPerformerTitle, performerTitleOf } from '@/engine/core/performer';
import { TRAITS } from '@/engine/domain/attributes';
import { careerLabel } from '@/engine/world/bootstrap';

describe('what the player reads', () => {
  it('names the profession with both words, everywhere it is named', () => {
    const named = TRAITS.filter((t) => /\bAct(or|ress)\b/.test(t.name));
    expect(named.length).toBeGreaterThan(0);
    for (const trait of named) {
      expect(trait.name, trait.id).toMatch(/\bActor\/Actress\b/);
    }
  });

  it('labels the career the same way, and leaves the others alone', () => {
    expect(careerLabel('actor')).toBe('Actor/Actress');
    expect(careerLabel('director')).toBe('Director');
    expect(careerLabel('writer')).toBe('Writer');
  });

  it('never splits the profession into one word', () => {
    for (const trait of TRAITS) {
      expect(trait.name, trait.id).not.toMatch(/\bActor\b(?!\/)/);
      expect(trait.name, trait.id).not.toMatch(/(?<!\/)\bActress\b/);
    }
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
