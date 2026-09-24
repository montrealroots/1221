/**
 * The five creation steps, pinned to their shape.
 *
 * The screen used to ask about a character sheet, a family and a family
 * business, and to state where the player was born and lived rather than ask.
 * All of that went with the revamp, and place of birth and where you live are
 * questions again. Citizenship is not: the place of birth decides it. The
 * performer's title went with the revamp and came back: the pronouns settle
 * it, and under they/them the player picks. The personality came back too, as
 * its own step, Dispositions & Traits, ahead of Interests & Background.
 *
 * So this holds the shape rather than the wording. What each step asks, and
 * what comes out the other end in the save.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, refreshMeta } from '@/engine';
import { CITIES } from '@/engine/content/geography';
import { blockedTraitReason, latestBirthYear } from '@/ui/creation/CharacterCreation';
import { settledTitle } from '@/engine/core/performer';
import { BEFORE_ACTING, DEFAULT_BEFORE_ACTING } from '@/engine/content/backgrounds';
import { ceilingAt } from '@/engine/content/lifespan';
import { EVERYDAY_FITNESS, mendsTo, readiness } from '@/engine/systems/life';
import { MS_HOUR, startOfNextDay } from '@/engine/core/time';

const SOURCE = readFileSync(new URL('../src/ui/creation/CharacterCreation.tsx', import.meta.url), 'utf8');

/** A save built the way the screens build one, with every field set. */
function filled() {
  return createSave(1, 'creation-shape', {
    ...defaultConfig(),
    firstName: 'Sigrún', middleName: 'Erla', lastName: 'Halldórsdóttir',
    displayName: 'Siggi', pronouns: 'she/her', performerTitle: 'actress',
    personality: {
      openness: 80, conscientiousness: 30, extraversion: 20, agreeableness: 65,
      emotionalStability: 90, ambition: 40, riskTolerance: 10,
    },
    personalityTraits: ['early_riser', 'orderly'],
    birthYear: 1998, birthMonth: 11, birthDay: 3,
    raceEthnicity: ['white', 'asian'],
    homeRegionId: 'is-1-reykjavik', livesWhereBorn: false,
    startLocationId: 'us-ny-newyork',
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
  it('are the five there are, Dispositions & Traits before Interests & Background', () => {
    expect(SOURCE).toContain("const STEPS = ['Identity', 'Dispositions & Traits', 'Interests & Background', 'Starting Point', 'Review'] as const;");
  });

  it('leave no trace of the ones that went', () => {
    for (const gone of ['CareerStep', 'YourPeopleStep', 'ESTATE_', 'studioName', 'family']) {
      expect(SOURCE, `${gone} is back in creation`).not.toContain(gone);
    }
  });
});

describe('Identity', () => {
  it('asks for the name, the pronouns, the birthday and the birthplace', () => {
    const step = stepSource('function IdentityStep', 'function PersonalityStep');
    for (const id of ['first', 'last', 'display', 'pronouns', 'birth-year', 'birth-month', 'birth-day']) {
      expect(step, `Identity lost the ${id} field`).toContain(`id="${id}"`);
    }
    expect(step, 'the birthplace is no longer asked').toContain('idPrefix="born"');
    expect(step, 'the credit name is back').not.toContain('id="stage"');
  });

  it('bills them as an actor or an actress, and will not go on until it is settled', () => {
    const step = stepSource('function IdentityStep', 'function PersonalityStep');
    expect(step, 'Billed As is gone').toContain('<span className="label" id="billed-as">Billed As</span>');
    // Settled by the pronouns, it is said back. Left open, both words are
    // offered. In that order: the settled branch is the one that shows the
    // word, and the open one is the one with the buttons.
    expect(step, 'the settled and open branches are the wrong way round').toMatch(
      /\{settled \? \([\s\S]*?className="settled-title"[\s\S]*?\) : \([\s\S]*?aria-label="Billed As"/,
    );
    // A pick made under they/them must not survive a change to he/him.
    expect(step, 'the title does not move with the pronouns')
      .toContain('performerTitle: settledTitle(pronouns)');
    expect(stepSource('function validate'), 'Continue opens with no title')
      .toContain('Choose whether you’re billed as an actor or an actress.');
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

  it('carries every answer into the save', () => {
    const sim = filled();
    const p = sim.universe.people[sim.universe.playerId]!;
    expect(p.firstName).toBe('Sigrún');
    expect(p.lastName).toBe('Halldórsdóttir');
    expect(p.displayName).toBe('Siggi');
    expect(p.pronouns).toBe('she/her');
    expect(p.performerTitle).toBe('actress');
    expect(p.raceEthnicity).toEqual(['white', 'asian']);
    // Born in Reykjavík and living in New York: a citizen of Iceland.
    expect(p.citizenshipId).toBe('is');
    expect(p.homeRegionId).toBe('is-1-reykjavik');
  });
});

describe('Dispositions & Traits', () => {
  it('asks for all seven dispositions and up to four traits', () => {
    const step = stepSource('function PersonalityStep', 'function PersonalStep');
    // One slider per row of the table, drawn by the step.
    for (const axis of [
      'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalStability', 'ambition', 'riskTolerance',
    ]) {
      expect(SOURCE, `the ${axis} slider is gone`).toContain(`{ key: '${axis}',`);
    }
    expect(step, 'the sliders are not drawn from the table').toContain('PERSONALITY_AXES.map((axis) =>');
    expect(step, 'the sliders are gone').toContain('type="range"');
    for (const card of ['Dispositions', 'Traits']) {
      expect(step, `${card} is gone`).toContain(`<h2>${card}</h2>`);
    }
    expect(step, 'the traits are no longer drawn in their pairs').toContain('personalityTraitPairs(group)');
    // A trait that can't be picked says why, on the trait, and can't be pressed.
    expect(step, 'a blocked trait no longer says why').toContain('{why && <div className="trait-why">{why}</div>}');
    expect(step, 'a blocked trait can be pressed').toContain('disabled={why !== undefined}');
    expect(step, 'the fifth trait gets through').toContain('if (now.length >= MAX_PERSONALITY_TRAITS) return c;');
  });

  it('says why a trait can’t be picked, and says nothing when it can', () => {
    expect(blockedTraitReason(['early_riser'], 'night_owl')).toBe('Can’t be held with Early Riser.');
    expect(blockedTraitReason(['even_tempered', 'unshakeable'], 'quick_tempered'))
      .toBe('Can’t be held with Even Tempered or Unshakeable.');
    const four = ['frugal', 'loyal', 'curious', 'orderly'];
    expect(blockedTraitReason(four, 'resilient')).toBe('You already hold four traits.');
    // A clash is the thing to fix first, so it is the thing said.
    expect(blockedTraitReason(four, 'chaotic')).toBe('Can’t be held with Orderly.');
    // Held, it can be put down. Free, it can be picked.
    expect(blockedTraitReason(four, 'loyal')).toBeUndefined();
    expect(blockedTraitReason(['frugal'], 'loyal')).toBeUndefined();
  });

  it('carries every disposition and trait into the save', () => {
    const p = filled().universe.people[filled().universe.playerId]!;
    expect(p.personality).toEqual({
      openness: 80, conscientiousness: 30, extraversion: 20, agreeableness: 65,
      emotionalStability: 90, ambition: 40, riskTolerance: 10,
    });
    expect(p.personalityTraits).toEqual(['early_riser', 'orderly']);
  });
});

describe('the title', () => {
  const titleOf = (pronouns: string, performerTitle?: 'actor' | 'actress') => {
    const sim = createSave(2, `title-${pronouns}-${performerTitle ?? 'none'}`, { ...defaultConfig(), pronouns, performerTitle });
    return sim.universe.people[sim.universe.playerId]!.performerTitle;
  };

  it('keeps a pick made under they/them, either way', () => {
    expect(titleOf('they/them', 'actress')).toBe('actress');
    expect(titleOf('they/them', 'actor')).toBe('actor');
  });

  it('lets the pronouns decide a save the engine was handed with no title', () => {
    expect(titleOf('she/her')).toBe('actress');
    expect(titleOf('he/him')).toBe('actor');
    // The screen never sends this. The engine still has to make a person.
    expect(titleOf('they/them')).toBe('actor');
  });

  it('names the slot by the title it stored, which the pronouns cannot supply', () => {
    const sim = createSave(1, 'title-slot', { ...defaultConfig(), pronouns: 'they/them', performerTitle: 'actress' });
    expect(sim.universe.meta.careerLabel).toBe('Actress');
    // The summary is rewritten every time the save is, and it writes the same.
    sim.universe.meta.careerLabel = '';
    refreshMeta(sim);
    expect(sim.universe.meta.careerLabel).toBe('Actress');
  });
});

describe('Interests & Background', () => {
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
  it('shows every line the four steps before it decided', () => {
    const step = stepSource('function ReviewStep');
    for (const line of [
      'Legal Name', 'Pronouns', 'Billed As', 'Born', 'Place Of Birth', 'Citizenship', 'Dispositions &amp; Traits',
      'Where You Live', 'Checking', 'Savings', 'Credit Score', 'Interests', 'Genres', 'Background',
    ]) {
      expect(step, `Review stopped showing ${line}`).toContain(line);
    }
    // Every disposition, and every trait held, not only the card's heading.
    expect(step, 'Review stopped listing the dispositions')
      .toContain('<Line key={axis.key} label={axis.label} value={outOf(config.personality[axis.key])} />');
    expect(step, 'Review stopped listing the traits').toContain('config.personalityTraits.map((id) =>');
  });
});

describe('what you did before acting', () => {
  const made = (beforeActing: string, birthYear = 2001) =>
    createSave(1, `before-${beforeActing}-${birthYear}`, { ...defaultConfig(), beforeActing, birthYear });
  const playerOf = (sim: ReturnType<typeof createSave>) => sim.universe.people[sim.universe.playerId]!;

  it('starts every answer at its own fitness, keeps the answer, and a default save where it was', () => {
    for (const one of BEFORE_ACTING) {
      const player = playerOf(made(one.id));
      expect(player.beforeActing).toBe(one.id);
      expect(player.wellbeing.fitness, one.id).toBe(one.fitness);
    }
    // Fifty is what every character started at before the question was asked.
    expect(defaultConfig().beforeActing).toBe(DEFAULT_BEFORE_ACTING);
    expect(playerOf(createSave(1, 'before-default', defaultConfig())).wellbeing.fitness).toBe(50);
  });

  it('never starts somebody fitter than the age allows, and an answer the list lacks is the default', () => {
    const old = playerOf(made('sport', 1944));
    expect(old.wellbeing.fitness).toBeLessThan(80);
    expect(old.wellbeing.fitness).toBeCloseTo(ceilingAt(81.5).fitness, 0);
    const junk = playerOf(made('astronaut'));
    expect(junk.beforeActing).toBe(DEFAULT_BEFORE_ACTING);
    expect(junk.wellbeing.fitness).toBe(50);
  });

  it('an athlete left alone keeps the fitter body for months, and it fades to an everyday life’s', () => {
    const athlete = made('sport');
    const clerk = made('office');
    const days = (sim: ReturnType<typeof createSave>, n: number) => {
      for (let d = 0; d < n; d++) sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
    };
    days(athlete, 120);
    days(clerk, 120);
    const a = playerOf(athlete);
    const c = playerOf(clerk);
    expect(a.wellbeing.fitness).toBeCloseTo(80 - 120 * 0.18, 5);
    expect(c.wellbeing.fitness).toBe(EVERYDAY_FITNESS);
    expect(mendsTo(a, athlete.now)).toBeGreaterThan(mendsTo(c, clerk.now) + 5);
    expect(a.wellbeing.condition).toBeGreaterThan(c.wellbeing.condition + 5);
    expect(readiness(a)).toBeGreaterThan(readiness(c));
    // A year on, nothing kept it up, and both have what an everyday life keeps.
    days(athlete, 245);
    days(clerk, 245);
    expect(a.wellbeing.fitness).toBe(EVERYDAY_FITNESS);
    expect(c.wellbeing.fitness).toBe(EVERYDAY_FITNESS);
  });

  it('asks the question on the step, says what it does, and keeps the player’s own words beside it', () => {
    expect(SOURCE, 'the step stopped asking').toContain('id="before-acting"');
    expect(SOURCE, 'the step stopped saying what it does').toContain('Fitness On The First Morning');
    expect(SOURCE, 'the step lost the player’s own words').toContain('id="background"');
    expect(SOURCE, 'the step still says it carries nothing').not.toContain('It carries no attribute and no');
  });
});
