/**
 * The six creation steps, pinned to their final shape.
 *
 * Each of these pages settled after a long run of changes, and most of what
 * settled was a decision to stop asking something. Where you live, where you
 * were born, what passport you hold and what you are good at are all facts
 * now, not questions, and the way they went wrong before was quietly: a
 * picker left on a page, a default pointing at the wrong country, a locked
 * field that still had an editable twin somewhere.
 *
 * So this holds the shape rather than the wording. What the step asks, what it
 * only reports, and what comes out the other end in the save.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig } from '@/engine';
import { ESTATE_ACRES, ESTATE_CITY_ID, ESTATE_COUNTRY_ID, studioName } from '@/engine/content/estate';
import { ATTRIBUTES, ALL_TRAITS } from '@/engine/domain/attributes';
import { CEILING } from '@/engine/content/prodigy';
import { citizenshipsOf } from '@/engine/domain/citizenship';
import { CITIES } from '@/engine/content/geography';
import { familyIssues, latestBirthYear, settledTitle } from '@/ui/creation/CharacterCreation';
import type { NewSaveConfig } from '@/engine/world/bootstrap';
import type { EstateRole } from '@/engine/domain/model';

const SOURCE = readFileSync(new URL('../src/ui/creation/CharacterCreation.tsx', import.meta.url), 'utf8');

/** A save built the way the screens build one, with every field set. */
function filled() {
  return createSave(1, 'creation-shape', {
    ...defaultConfig(),
    firstName: 'Sigrún', middleName: 'Erla', lastName: 'Halldórsdóttir',
    displayName: 'Siggi', pronouns: 'she/her',
    birthYear: 1998, birthMonth: 11, birthDay: 3,
    raceEthnicity: ['white', 'asian'],
    personality: {
      openness: 11, conscientiousness: 22, extraversion: 33, agreeableness: 44,
      emotionalStability: 55, ambition: 66, riskTolerance: 77,
    },
    personalityTraits: ['night_owl'],
    interests: ['film', 'television', 'cinematography'],
    genres: ['film_noir', 'western'],
    lifestyle: 'lavish', background: 'Raised on the lot.',
    wealth: 'wealthy',
  });
}

describe('Identity', () => {
  it('asks for the name, the pronouns, the birthday and nothing else', () => {
    // The four it still asks.
    for (const id of ['first', 'last', 'display', 'stage', 'pronouns', 'birth-year', 'birth-month', 'birth-day']) {
      expect(SOURCE, `Identity lost the ${id} field`).toContain(`id="${id}"`);
    }
    // The two it stopped asking, and now states.
    for (const id of ['citizenship', 'birthplace']) {
      const field = SOURCE.slice(SOURCE.indexOf(`id="${id}"`));
      expect(field.slice(0, 220), `${id} is editable again`).toMatch(/readOnly/);
    }
    // And the one that is gone entirely.
    expect(SOURCE, 'the second citizenship field is back').not.toContain('citizenship-second');
  });

  it('settles the title from the pronouns, and only they/them opens the choice', () => {
    expect(settledTitle('he/him')).toBe('actor');
    expect(settledTitle('she/her')).toBe('actress');
    expect(settledTitle('they/them')).toBeUndefined();
    // Case and spacing do not get to change the answer.
    expect(settledTitle('  He/Him ')).toBe('actor');
    expect(settledTitle('She/Her')).toBe('actress');
  });

  it('caps the birth year so nobody starts under eighteen', () => {
    expect(latestBirthYear(2026)).toBe(2008);
    expect(latestBirthYear(2030)).toBe(2012);
  });

  it('carries every answer into the save, including the ones only shown', () => {
    const sim = filled();
    const p = sim.universe.people[sim.universe.playerId]!;
    expect(p.firstName).toBe('Sigrún');
    expect(p.lastName).toBe('Halldórsdóttir');
    expect(p.displayName).toBe('Siggi');
    expect(p.pronouns).toBe('she/her');
    expect(p.performerTitle).toBe('actress');
    expect(p.raceEthnicity).toEqual(['white', 'asian']);
    // Stated, not asked: one passport, born on the land, living on it.
    expect(citizenshipsOf(p)).toEqual([ESTATE_COUNTRY_ID]);
    expect(p.homeRegionId).toBe(ESTATE_CITY_ID);
    expect(p.currentLocationId).toBe(ESTATE_CITY_ID);
    expect(sim.universe.homeZone).toBe(CITIES.get(ESTATE_CITY_ID)!.timeZone);
  });
});

describe('Who You Are', () => {
  it('keeps all seven axes, and stores them exactly as set', () => {
    const p = filled().universe.people[filled().universe.playerId]!;
    expect(Object.keys(p.personality).sort()).toEqual([
      'agreeableness', 'ambition', 'conscientiousness', 'emotionalStability',
      'extraversion', 'openness', 'riskTolerance',
    ]);
    expect(p.personality.openness).toBe(11);
    expect(p.personality.riskTolerance).toBe(77);
  });

  it('carries the traits, the interests, the genres and the rest', () => {
    const p = filled().universe.people[filled().universe.playerId]!;
    expect(p.personalityTraits).toContain('night_owl');
    expect(p.interests).toEqual(expect.arrayContaining(['film', 'television', 'cinematography']));
    expect(p.genres).toEqual(['film_noir', 'western']);
    expect(p.lifestyle).toBe('lavish');
    expect(p.background).toBe('Raised on the lot.');
  });
});

/** A step's own source, and never an empty string: a slice that missed its
 *  anchor makes every "this is not there any more" assertion pass on nothing. */
function stepSource(from: string, to?: string): string {
  const start = SOURCE.indexOf(from);
  expect(start, `no ${from} in the source`).toBeGreaterThan(-1);
  const end = to ? SOURCE.indexOf(to, start) : SOURCE.length;
  expect(end, `no ${to} after ${from}`).toBeGreaterThan(start);
  const slice = SOURCE.slice(start, end);
  expect(slice.length, `${from} sliced to nothing`).toBeGreaterThan(200);
  return slice;
}

describe('My Skills', () => {
  it('hands over every skill at the ceiling and every trait at once', () => {
    const p = filled().universe.people[filled().universe.playerId]!;
    expect(Object.keys(p.attributes)).toHaveLength(ATTRIBUTES.length);
    expect(ATTRIBUTES.filter((a) => p.attributes[a.id] !== CEILING)).toEqual([]);
    expect(p.traits).toHaveLength(ALL_TRAITS.length);
    for (const trait of ALL_TRAITS) expect(p.traits, trait.name).toContain(trait.id);
  });

  it('asks nothing and offers the three sheets', () => {
    const step = stepSource('function CareerStep', 'function StartingPointStep');
    expect(step, 'My Skills is asking something again').not.toMatch(/<input|<select/);
    for (const sheet of ['Every Acting Skill', 'Every Acting Trait', 'Mastery Of Every Genre']) {
      expect(step, `the ${sheet} sheet is gone`).toContain(sheet);
    }
    // The card describing a rebuild that is not happening any more.
    expect(step, 'the Under Construction card is back').not.toContain('Under Construction');
  });
});

describe('Starting Point', () => {
  it('reports the land and asks only about money', () => {
    const step = stepSource('function StartingPointStep', 'function ReviewStep');
    for (const card of ['Home Base', 'The Land', 'What Is Yours']) {
      expect(step, `${card} is gone`).toContain(card);
    }
    // Everything it used to ask.
    expect(step, 'the city picker is back').not.toMatch(/LocationPicker/);
    expect(step, 'the housing options are back').not.toMatch(/HOUSING|roommates|A Friend’s Couch/);
    // The one control left.
    expect(step).toContain('id="wealth"');
  });

  it('puts everybody on the family land, with the company named off the surname', () => {
    const sim = filled();
    const p = sim.universe.people[sim.universe.playerId]!;
    expect(p.currentLocationId).toBe(ESTATE_CITY_ID);
    expect(studioName(p.lastName)).toBe('Halldórsdóttir Pictures');
    expect(ESTATE_ACRES).toBe(2_000);
  });

  it('opens the accounts the money answer promises, and balances them', () => {
    const sim = filled();
    const accounts = Object.values(sim.universe.accounts);
    const checking = accounts.find((a) => a.kind === 'checking')!;
    const savings = accounts.find((a) => a.kind === 'savings')!;
    expect(checking.balance).toBeGreaterThan(0);
    expect(savings.balance).toBeGreaterThan(0);
    // Double entry: every cent came from somewhere.
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    expect(total, 'the opening balances do not balance').toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('Your People', () => {
  it('asks for each of the three things about a parent, and nothing else', () => {
    const step = stepSource('function ParentCard', 'function Choice');
    for (const field of ['-name', '-age']) {
      expect(step, `the parent card lost the ${field} field`).toContain(`id={\`\${idPrefix}${field}\`}`);
    }
    expect(step, 'the parent card asks what they do').toContain('What They Do On The Land');
    // A parent is not a performer and is never asked to be one.
    expect(step, 'a parent is asked to be billed').not.toMatch(/actor|actress|billed/i);
    expect(step, 'a parent is asked for a skill').not.toMatch(/attribute|trait|skill/i);
  });

  it('offers every role the engine has a word for, and no role it does not', () => {
    const roles: EstateRole[] = ['the house', 'the lot', 'the company', 'nothing in particular'];
    const step = stepSource('const ESTATE_ROLES', 'const TWIN_GENDERS');
    for (const role of roles) {
      expect(step, `no way to pick ${role}`).toContain(`'${role}'`);
    }
  });

  it('lets a twin be a brother, a sister, or neither', () => {
    const step = stepSource('const TWIN_GENDERS', 'The step where the house');
    expect(step).toContain("id: 'female'");
    expect(step).toContain("id: 'male'");
    expect(step).toContain("id: 'nonbinary'");
    // Never the word the game does not use for one.
    expect(step, 'a twin is called a sibling').not.toMatch(/sibling/i);
  });

  it('carries what was picked all the way into the save', () => {
    const sim = createSave(1, 'creation-family', {
      ...defaultConfig(),
      firstName: 'Sigrún', lastName: 'Halldórsdóttir',
      birthYear: 1998, birthMonth: 11, birthDay: 3,
      family: {
        mother: { firstName: 'Bryndís', ageAtBirth: 27, role: 'the company' },
        father: { firstName: 'Ólafur', ageAtBirth: 34, role: 'the lot' },
        twin: { firstName: 'Katla', gender: 'female', identical: true, role: 'the house' },
      },
    });
    const people = Object.values(sim.universe.people);
    const by = (first: string) => people.find((one) => one.firstName === first)!;

    expect(people).toHaveLength(4);
    expect(by('Bryndís').estateRole).toBe('the company');
    expect(by('Ólafur').estateRole).toBe('the lot');
    expect(by('Katla').estateRole).toBe('the house');
    // The family name is the one the player gave, for all of them.
    for (const person of people) expect(person.lastName).toBe('Halldórsdóttir');
  });

  it('refuses a family the player has left half-said', () => {
    const base = defaultConfig();
    const complain = (family: NewSaveConfig['family']): string[] =>
      familyIssues({ ...base, firstName: 'Sigrún', family });

    expect(complain(base.family)).toEqual([]);
    expect(complain({ ...base.family, mother: { ...base.family.mother, firstName: '  ' } }))
      .toContain('Your mother needs a first name.');
    expect(complain({ ...base.family, father: { ...base.family.father, ageAtBirth: 4 } })
      .join(' ')).toMatch(/between 15 and 60/);
    expect(complain({ ...base.family, twin: { firstName: '', gender: 'female', identical: false, role: 'the house' } }))
      .toContain('Your twin needs a first name, or you were born alone.');
  });

  it('refuses two people in one house with one name', () => {
    const base = defaultConfig();
    const clash = familyIssues({
      ...base,
      firstName: 'Katla',
      family: {
        ...base.family,
        twin: { firstName: 'katla', gender: 'female', identical: true, role: 'the house' },
      },
    });
    // Said in the name the player typed, not the one the comparison lowercased.
    expect(clash).toContain('You and your twin can’t both be called Katla.');
  });
});

describe('Review', () => {
  it('shows the people as well as the person', () => {
    const step = stepSource('function ReviewStep');
    for (const line of ['Your Mother', 'Your Father', 'Your People']) {
      expect(step, `Review stopped showing ${line}`).toContain(line);
    }
  });

  it('shows every line the five steps decided', () => {
    const step = stepSource('function ReviewStep');
    for (const line of [
      'Legal Name', 'Pronouns', 'Billed As', 'Born', 'Place Of Birth',
      'Home Base', 'The Land', 'The Company', 'Checking', 'Savings', 'Credit Score',
    ]) {
      expect(step, `Review stopped showing ${line}`).toContain(line);
    }
    // The two it used to show and cannot any more.
    expect(step, 'Review shows a housing rung again').not.toMatch(/HOUSING\.find/);
    expect(step, 'Review shows a chosen city again').not.toMatch(/label="City"/);
  });
});
