/**
 * The engine behind the personality traits, the interests and the genres.
 *
 * Three lists on a character sheet, and one door every system reads them
 * through. The personality traits pay out today, in the life systems. The
 * interests and the genres do not pay out yet — there is one person in this
 * build and the questions they answer need somebody else to ask about — so
 * what is held here is that the answers are correct and that nothing has
 * quietly turned an interest into a stat.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, quickSave, validateUniverse } from '@/engine';
import {
  affinity, axisModifier, caresAbout, holdsTrait, lovesGenre, sharedGround, tasteOf,
  traitModifier, unknownTaste,
} from '@/engine/core/taste';
import { PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';
import type { Person } from '@/engine/domain/model';

function playerWith(seed: string, config: Partial<Parameters<typeof createSave>[2]>): Person {
  const sim = createSave(1, seed, { ...defaultConfig(), ...config });
  return sim.universe.people[sim.universe.playerId]!;
}

describe('reading a person’s taste', () => {
  it('answers what they hold', () => {
    const person = playerWith('taste-holds', {
      personalityTraits: ['early_riser', 'frugal'],
      interests: ['cinematography', 'film'],
      genres: ['film_noir', 'western'],
    });
    expect(holdsTrait(person, 'early_riser')).toBe(true);
    expect(holdsTrait(person, 'night_owl')).toBe(false);
    expect(caresAbout(person, 'cinematography')).toBe(true);
    expect(caresAbout(person, 'cooking')).toBe(false);
    expect(lovesGenre(person, 'film_noir')).toBe(true);
    expect(lovesGenre(person, 'zombie')).toBe(false);
  });

  it('drops anything this build has never heard of', () => {
    const person = playerWith('taste-strange', { interests: ['film'], genres: ['western'] });
    const row = person as unknown as Record<string, unknown>;
    row.interests = ['film', 'juggling'];
    row.genres = ['western', 'sword_and_bagpipes'];
    row.personalityTraits = ['frugal', 'telepathic'];

    const taste = tasteOf(person);
    expect(taste.interests).toEqual(['film']);
    expect(taste.genres).toEqual(['western']);
    expect(taste.traits).toEqual(['frugal']);
    expect(unknownTaste(person).sort()).toEqual(['juggling', 'sword_and_bagpipes', 'telepathic']);
  });

  it('says so on load rather than letting it go unnoticed', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'taste-warn');
    const player = sim.universe.people[sim.universe.playerId]!;
    (player as unknown as Record<string, unknown>).genres = ['western', 'sword_and_bagpipes'];

    const report = validateUniverse(sim.universe);
    // Sound, but not silent.
    expect(report.ok).toBe(true);
    expect(report.warnings.join(' ')).toMatch(/doesn’t know/);
    expect(report.warnings.join(' ')).toMatch(/sword_and_bagpipes/);
  });
});

describe('what the personality traits actually do', () => {
  it('multiplies the knob a trait names, and leaves the rest at one', () => {
    const frugal = PERSONALITY_TRAIT_BY_ID['frugal']!;
    const [key, factor] = Object.entries(frugal.systemMods ?? {})[0]!;
    const person = playerWith('taste-mod', { personalityTraits: ['frugal'] });
    expect(traitModifier(person, key)).toBeCloseTo(factor, 5);
    expect(traitModifier(person, 'a_knob_no_trait_touches')).toBe(1);
  });

  it('compounds two traits on the same knob', () => {
    const plain = playerWith('taste-none', { personalityTraits: [] });
    const one = playerWith('taste-one', { personalityTraits: ['early_riser'] });
    const two = playerWith('taste-two', { personalityTraits: ['early_riser', 'highly_strung'] });
    expect(traitModifier(plain, 'stressGain')).toBe(1);
    // Whatever the numbers are, holding more of them cannot be a no-op.
    expect(traitModifier(two, 'stressGain')).not.toBe(traitModifier(one, 'stressGain'));
  });

  it('is what the life systems read, so a trait changes a week of living', () => {
    const week = 7 * 86_400_000;
    const after = (traits: string[], seed: string) => {
      const sim = createSave(1, seed, { ...defaultConfig(), personalityTraits: traits });
      sim.advanceTo(sim.now + week);
      return sim.universe.people[sim.universe.playerId]!.wellbeing;
    };
    // sleepQuality is the knob that pays out today: it reaches morale through
    // how well the nights go.
    const anywhere = after(['sleeps_anywhere'], 'taste-anywhere');
    const plain = after([], 'taste-plain');
    const light = after(['light_sleeper'], 'taste-light');
    expect(anywhere.morale).toBeGreaterThan(plain.morale);
    expect(light.morale).toBeLessThan(plain.morale);
  });

  it('names the knobs nothing reads yet, so they are not mistaken for live', () => {
    // Every knob a trait declares, against the ones the life systems ask for.
    // The rest are dormant: the systems that read them went with the cut-down,
    // and a trait that says it costs something must not quietly cost nothing
    // without anybody knowing which.
    const declared = new Set<string>();
    for (const trait of Object.values(PERSONALITY_TRAIT_BY_ID)) {
      for (const key of Object.keys(trait.systemMods ?? {})) declared.add(key);
    }
    const life = readFileSync('src/engine/systems/life.ts', 'utf8');
    const read = new Set(
      [...life.matchAll(/personalityOf\(person, '(\w+)'\)/g)].map((m) => m[1]!),
    );
    expect([...read].sort()).toEqual(
      ['energyRecovery', 'sleepQuality', 'stressGain', 'stressRecovery', 'travelFatigue'],
    );
    const dormant = [...declared].filter((key) => !read.has(key)).sort();
    expect(dormant).toEqual([
      'hygieneDrift', 'injuryRisk', 'moraleSwing', 'relationshipDecay', 'spendImpulse', 'trainingGain',
    ]);
  });
});

describe('what two people have in common', () => {
  const a = playerWith('taste-a', {
    interests: ['cinematography', 'film', 'music'],
    genres: ['film_noir', 'western'],
    personalityTraits: ['frugal'],
  });
  const b = playerWith('taste-b', {
    interests: ['cinematography', 'cooking'],
    genres: ['film_noir', 'zombie'],
    personalityTraits: ['frugal'],
  });

  it('names the ground rather than only scoring it', () => {
    const ground = sharedGround(a, b);
    expect(ground.interests).toEqual(['cinematography']);
    expect(ground.genres).toEqual(['film_noir']);
    expect(ground.traits).toEqual(['frugal']);
  });

  it('scores by what they share over everything either holds', () => {
    // Shared: cinematography, film_noir. Union: cinematography, film, music,
    // film_noir, western, cooking, zombie — seven.
    expect(affinity(a, b)).toBeCloseTo(2 / 7, 3);
    expect(affinity(a, a)).toBe(1);
  });

  it('does not make two people who like everything count as close', () => {
    const everything = playerWith('taste-all', {
      interests: ['film', 'music', 'cooking', 'cars', 'art'],
      genres: ['western', 'zombie', 'horror', 'comedy'],
    });
    const narrow = playerWith('taste-narrow', { interests: ['film'], genres: ['western'] });
    const alsoNarrow = playerWith('taste-narrow-2', { interests: ['film'], genres: ['western'] });
    expect(affinity(narrow, alsoNarrow)).toBe(1);
    expect(affinity(everything, narrow)).toBeLessThan(affinity(narrow, alsoNarrow));
  });

  it('is zero when somebody has said nothing, rather than guessing', () => {
    const silent = playerWith('taste-silent', { interests: [], genres: [] });
    expect(affinity(silent, a)).toBe(0);
    expect(affinity(a, silent)).toBe(0);
  });

  it('leaves personality out of it', () => {
    // Sharing Quick Tempered is not a reason two people get on.
    const one = playerWith('taste-t1', { interests: [], genres: [], personalityTraits: ['quick_tempered'] });
    const two = playerWith('taste-t2', { interests: [], genres: [], personalityTraits: ['quick_tempered'] });
    expect(affinity(one, two)).toBe(0);
    expect(sharedGround(one, two).traits).toEqual(['quick_tempered']);
  });
});

describe('what the personality axes actually do', () => {
  const month = 30 * 86_400_000;
  const flat = {
    openness: 50, conscientiousness: 50, extraversion: 50,
    agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50,
  };
  const after = (over: Record<string, number>, seed: string) => {
    const sim = createSave(1, seed, {
      ...defaultConfig(), personality: { ...flat, ...over } as never,
    });
    sim.advanceTo(sim.now + month);
    return sim.universe.people[sim.universe.playerId]!.wellbeing;
  };

  it('leaves the middle of every scale at no modifier', () => {
    const sim = createSave(1, 'axis-mid', { ...defaultConfig(), personality: flat as never });
    const person = sim.universe.people[sim.universe.playerId]!;
    for (const key of ['stressGain', 'stressRecovery', 'sleepQuality', 'energyRecovery', 'travelFatigue']) {
      expect(axisModifier(person, key), key).toBe(1);
    }
  });

  it('makes emotional stability decide how stress arrives and clears', () => {
    const volatile = after({ emotionalStability: 5 }, 'axis-volatile');
    const steady = after({ emotionalStability: 95 }, 'axis-steady');
    expect(volatile.stress).toBeGreaterThan(steady.stress);
    expect(volatile.morale).toBeLessThan(steady.morale);
  });

  it('makes conscientiousness decide how the nights go', () => {
    const loose = after({ conscientiousness: 5 }, 'axis-loose');
    const meticulous = after({ conscientiousness: 95 }, 'axis-meticulous');
    expect(loose.morale).toBeLessThan(meticulous.morale);
  });

  it('keeps the swing from one slider inside something a month can survive', () => {
    // A whole slider is a real difference, not a death sentence. If one axis
    // can halve a month of morale on its own, the model is doing too much.
    const worst = after({ conscientiousness: 5 }, 'axis-worst');
    const best = after({ conscientiousness: 95 }, 'axis-best');
    expect(best.morale - worst.morale).toBeLessThan(45);
    expect(worst.morale).toBeGreaterThan(50);
  });

  it('moves nothing for the axes that need people or decisions', () => {
    const mid = after({}, 'axis-mid-run');
    for (const [axis, seed] of [
      ['extraversion', 'axis-extra'], ['agreeableness', 'axis-agree'], ['riskTolerance', 'axis-risk'],
    ] as const) {
      const low = after({ [axis]: 5 }, seed);
      expect(low.stress, axis).toBe(mid.stress);
      expect(low.morale, axis).toBe(mid.morale);
    }
  });

  it('says on the screen which ones are live, rather than implying all of them', () => {
    const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(source).toContain('Emotional Stability and Conscientiousness are the two that');
    // The old copy promised all three of these, and none was true.
    expect(source).not.toContain('They shape how people respond to you');
  });
});
