/**
 * The four creation steps, pinned to their shape.
 *
 * The screen used to ask about a character sheet, a performer's title, a
 * family and a family business, and to state where the player was born and
 * lived rather than ask. All of that went with the revamp, and place of birth,
 * where you live and the passports you hold are questions again.
 *
 * So this holds the shape rather than the wording. What each step asks, and
 * what comes out the other end in the save.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig } from '@/engine';
import { citizenshipsOf } from '@/engine/domain/citizenship';
import { CITIES } from '@/engine/content/geography';
import { latestBirthYear } from '@/ui/creation/CharacterCreation';

const SOURCE = readFileSync(new URL('../src/ui/creation/CharacterCreation.tsx', import.meta.url), 'utf8');

/** A save built the way the screens build one, with every field set. */
function filled() {
  return createSave(1, 'creation-shape', {
    ...defaultConfig(),
    firstName: 'Sigrún', middleName: 'Erla', lastName: 'Halldórsdóttir',
    displayName: 'Siggi', pronouns: 'she/her',
    birthYear: 1998, birthMonth: 11, birthDay: 3,
    raceEthnicity: ['white', 'asian'],
    homeRegionId: 'is-1-reykjavik', livesWhereBorn: false,
    startLocationId: 'us-ny-newyork',
    citizenshipId: 'is', secondCitizenshipId: 'us',
    interests: ['film', 'television', 'cinematography'],
    genres: ['film_noir', 'western'],
    background: 'Raised by the sea.',
    wealth: 'wealthy',
  });
}

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

describe('the steps', () => {
  it('are the four that are left, in order', () => {
    expect(SOURCE).toContain("const STEPS = ['Identity', 'Who You Are', 'Starting Point', 'Review'] as const;");
  });

  it('leave no trace of the ones that went', () => {
    for (const gone of ['CareerStep', 'YourPeopleStep', 'performerTitle', 'personality', 'ESTATE_', 'studioName', 'family']) {
      expect(SOURCE, `${gone} is back in creation`).not.toContain(gone);
    }
  });
});

describe('Identity', () => {
  it('asks for the name, the pronouns, the birthday, the passports and the birthplace', () => {
    const step = stepSource('function IdentityStep', 'function PersonalStep');
    for (const id of ['first', 'last', 'display', 'pronouns', 'birth-year', 'birth-month', 'birth-day', 'citizenship', 'citizenship-second']) {
      expect(step, `Identity lost the ${id} field`).toContain(`id="${id}"`);
    }
    expect(step, 'the birthplace is no longer asked').toContain('idPrefix="born"');
    expect(step, 'the credit name is back').not.toContain('id="stage"');
  });

  it('caps the birth year so nobody starts under eighteen', () => {
    expect(latestBirthYear(2026)).toBe(2008);
    expect(latestBirthYear(2030)).toBe(2012);
  });

  it('carries every answer into the save', () => {
    const sim = filled();
    const p = sim.universe.people[sim.universe.playerId]!;
    expect(p.firstName).toBe('Sigrún');
    expect(p.lastName).toBe('Halldórsdóttir');
    expect(p.displayName).toBe('Siggi');
    expect(p.pronouns).toBe('she/her');
    expect(p.raceEthnicity).toEqual(['white', 'asian']);
    expect(citizenshipsOf(p)).toEqual(['is', 'us']);
    expect(p.homeRegionId).toBe('is-1-reykjavik');
  });
});

describe('Who You Are', () => {
  it('asks for interests, genres and a background, and nothing with a number on it', () => {
    const step = stepSource('function PersonalStep', 'function StartingPointStep');
    for (const card of ['Interests', 'Genres', 'Background']) {
      expect(step, `${card} is gone`).toContain(`<h2>${card}</h2>`);
    }
    expect(step, 'a slider is back').not.toContain('type="range"');
  });

  it('carries the interests, the genres and the background', () => {
    const p = filled().universe.people[filled().universe.playerId]!;
    expect(p.interests).toEqual(expect.arrayContaining(['film', 'television', 'cinematography']));
    expect(p.genres).toEqual(['film_noir', 'western']);
    expect(p.background).toBe('Raised by the sea.');
  });
});

describe('Starting Point', () => {
  it('asks where you live and what you start with', () => {
    const step = stepSource('function StartingPointStep', 'function ReviewStep');
    expect(step).toContain('id="live-here"');
    expect(step).toContain('idPrefix="live"');
    expect(step).toContain('id="wealth"');
  });

  it('puts the player where they said they live, on that place’s clock', () => {
    const sim = filled();
    const p = sim.universe.people[sim.universe.playerId]!;
    expect(p.currentLocationId).toBe('us-ny-newyork');
    expect(sim.universe.homeZone).toBe(CITIES.get('us-ny-newyork')!.timeZone);
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

describe('Review', () => {
  it('shows every line the three steps decided', () => {
    const step = stepSource('function ReviewStep');
    for (const line of [
      'Legal Name', 'Pronouns', 'Born', 'Place Of Birth', 'Citizenship',
      'Where You Live', 'Checking', 'Savings', 'Credit Score', 'Interests', 'Genres',
    ]) {
      expect(step, `Review stopped showing ${line}`).toContain(line);
    }
  });
});
