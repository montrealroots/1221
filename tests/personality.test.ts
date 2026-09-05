/**
 * Personality: the one thing about this character that is actually chosen.
 *
 * The craft sheet is automatic and total — the best living writer, director,
 * producer, showrunner and actor holds every trait in all five disciplines,
 * and the prodigy flag means none of them costs anything. That was the right
 * answer for craft and it left the creation screen with a trait picker that
 * did nothing: you picked four, the engine ignored them and handed you all
 * of it anyway.
 *
 * Personality is the opposite and deliberately so. Being the best there has
 * ever been at making things does not make somebody sleep well, keep a house,
 * or let a thing go. Four picks, real conflicts, and every one of them costs
 * something the life half of the game actually reads.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, quickSave } from '@/engine';
import {
  MAX_PERSONALITY_TRAITS, PERSONALITY_GROUPS, PERSONALITY_HIGHER_IS_WORSE,
  PERSONALITY_TRAITS, PERSONALITY_TRAIT_BY_ID, conflictingPersonalityTraits,
  personalityModifier, personalityTraitsIn,
} from '@/engine/content/personality-traits';
import { applyElapsedWellbeing, applySleep, personalityOf, sleepQuality } from '@/engine/systems/life';
import { createRelationship } from '@/engine/systems/relationships';

const MS_DAY = 86_400_000;

describe('the set itself', () => {
  it('is about a person, never about the job', () => {
    // Nothing here may mention the industry. That is what the craft sheet is.
    const forbidden = /\b(act(ing|or|ress)?|film|movie|camera|screen|studio|audition|casting|scene|script|director|producer|showrunner|fame|famous|press|publicity|audience|critic)\b/i;
    const offenders = PERSONALITY_TRAITS
      .filter((t) => forbidden.test(`${t.name} ${t.description} ${t.cost}`))
      .map((t) => `${t.id}: ${t.description}`);
    expect(offenders, 'these are craft traits wearing a personality label').toEqual([]);
  });

  it('states what every one of them costs', () => {
    expect(PERSONALITY_TRAITS.length).toBeGreaterThanOrEqual(30);
    for (const trait of PERSONALITY_TRAITS) {
      expect(trait.description.length, trait.id).toBeGreaterThan(30);
      expect(trait.cost.length, `${trait.id} does not say what it costs`).toBeGreaterThan(15);
      expect(PERSONALITY_GROUPS, trait.id).toContain(trait.group);
      expect(Object.keys(trait.systemMods ?? {}).length, `${trait.id} changes nothing`).toBeGreaterThan(0);
    }
    expect(new Set(PERSONALITY_TRAITS.map((t) => t.id)).size).toBe(PERSONALITY_TRAITS.length);
  });

  it('actually costs something — nothing here is pure upside', () => {
    const freebies: string[] = [];
    for (const trait of PERSONALITY_TRAITS) {
      const mods = Object.entries(trait.systemMods ?? {});
      const hasDownside = mods.some(([key, value]) =>
        PERSONALITY_HIGHER_IS_WORSE.has(key) ? value > 1 : value < 1);
      // One is allowed to be luck alone, and it says so in its own cost line.
      if (!hasDownside && !/luck/i.test(trait.cost)) freebies.push(trait.id);
    }
    expect(freebies, 'these are free upside').toEqual([]);
  });

  it('fills every group, and every group is somebody could describe', () => {
    for (const group of PERSONALITY_GROUPS) {
      expect(personalityTraitsIn(group).length, group).toBeGreaterThanOrEqual(4);
    }
  });

  it('keeps its conflicts mutual, so the picker cannot be walked around', () => {
    for (const trait of PERSONALITY_TRAITS) {
      for (const other of trait.conflictsWith ?? []) {
        expect(PERSONALITY_TRAIT_BY_ID[other], `${trait.id} conflicts with unknown ${other}`).toBeTruthy();
        // Declared on one side is enough; the helper reads both.
        expect(conflictingPersonalityTraits([other], trait.id)).toContain(other);
        expect(conflictingPersonalityTraits([trait.id], other)).toContain(trait.id);
      }
      expect(trait.conflictsWith ?? []).not.toContain(trait.id);
    }
  });

  it('multiplies its knobs, and is 1 for anybody holding nothing', () => {
    expect(personalityModifier([], 'stressGain')).toBe(1);
    expect(personalityModifier(['highly_strung'], 'stressGain')).toBeGreaterThan(1);
    expect(personalityModifier(['unshakeable'], 'stressGain')).toBeLessThan(1);
    // Two that pull the same way compound.
    expect(personalityModifier(['highly_strung', 'burns_out'], 'stressGain'))
      .toBeGreaterThan(personalityModifier(['highly_strung'], 'stressGain'));
  });
});

describe('picking them', () => {
  it('carries at most four onto the person', () => {
    const sim = createSave(1, 'pers-four', {
      ...defaultConfig(),
      personalityTraits: ['early_riser', 'loyal', 'frugal', 'curious', 'orderly', 'resilient'],
    });
    expect(sim.player.personalityTraits).toHaveLength(MAX_PERSONALITY_TRAITS);
    expect(sim.player.personalityTraits).toEqual(['early_riser', 'loyal', 'frugal', 'curious']);
  });

  it('drops anything that is not a real trait', () => {
    const sim = createSave(1, 'pers-junk', {
      ...defaultConfig(), personalityTraits: ['early_riser', 'not_a_trait', 'method_actor'],
    });
    expect(sim.player.personalityTraits).toEqual(['early_riser']);
  });

  it('leaves somebody who picked nothing with nothing', () => {
    const sim = quickSave({}, 'pers-none');
    expect(sim.player.personalityTraits).toEqual([]);
    expect(personalityOf(sim.player, 'stressGain')).toBe(1);
  });

  it('is separate from the craft sheet, which is still all of it', () => {
    const sim = createSave(1, 'pers-separate', {
      ...defaultConfig(), personalityTraits: ['night_owl', 'holds_grudges'],
    });
    expect(sim.player.personalityTraits).toEqual(['night_owl', 'holds_grudges']);
    // Craft is untouched and total.
    expect(sim.player.traits.length).toBeGreaterThan(80);
    expect(sim.player.prodigy).toBe(true);
    // And no personality trait leaked into the craft list.
    for (const id of sim.player.personalityTraits!) expect(sim.player.traits).not.toContain(id);
  });
});

describe('what they actually do', () => {
  const withTraits = (seed: string, traits: string[]) => {
    const sim = createSave(1, seed, { ...defaultConfig(), personalityTraits: traits });
    return sim;
  };

  it('makes a highly strung person accumulate stress faster than an unshakeable one', () => {
    const tense = withTraits('pers-tense', ['highly_strung']);
    const calm = withTraits('pers-calm', ['unshakeable']);
    for (const sim of [tense, calm]) {
      sim.player.wellbeing.energy = 5;
      sim.player.wellbeing.stress = 20;
      applyElapsedWellbeing(sim.player, 10);
    }
    expect(tense.player.wellbeing.stress).toBeGreaterThan(calm.player.wellbeing.stress);
  });

  it('makes a light sleeper sleep worse than somebody who sleeps anywhere', () => {
    const light = withTraits('pers-light', ['light_sleeper']);
    const heavy = withTraits('pers-heavy', ['sleeps_anywhere']);
    expect(sleepQuality(light, light.player)).toBeLessThan(sleepQuality(heavy, heavy.player));
  });

  it('gets an early riser more out of the same hours of sleep', () => {
    const early = withTraits('pers-early', ['early_riser']);
    const owl = withTraits('pers-owl', ['night_owl']);
    for (const sim of [early, owl]) {
      // From empty and a short night, so the ceiling does not hide the gap.
      sim.player.wellbeing.energy = 0;
      applySleep(sim.player, 4, 0.7);
    }
    expect(early.player.wellbeing.energy).toBeGreaterThan(owl.player.wellbeing.energy);
  });

  it('lets a loyal person’s relationships fade slower than a detached one’s', () => {
    // A new save has nobody in it yet, so the friendship is made here. What is
    // under test is the decay rule, not who the world starts you with.
    const build = (seed: string, trait: string) => {
      const sim = withTraits(seed, [trait]);
      const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
      createRelationship(sim, sim.player.id, other.id, 'friend', {
        dimensions: { familiarity: 80, affection: 80, trust: 80, respect: 80 },
      });
      return sim;
    };
    const loyal = build('pers-loyal', 'loyal');
    const detached = build('pers-detached', 'detached');
    const strength = (sim: typeof loyal) => {
      const rel = Object.values(sim.universe.relationships)[0]!;
      return Object.values(rel.dimensions).reduce((a, b) => a + b, 0);
    };
    const before = strength(loyal);
    // Ninety days. Over a year affection bottoms out for both and the
    // difference between them is no longer visible.
    for (const sim of [loyal, detached]) sim.advanceTo(sim.now + 90 * MS_DAY);
    expect(strength(detached), 'nothing faded at all').toBeLessThan(before);
    expect(strength(loyal)).toBeGreaterThan(strength(detached));
  });

  it('keeps an orderly person cleaner than a chaotic one', () => {
    // One day. Nobody showers on their own, so by the second both are on the
    // floor and the difference is no longer visible.
    const tidy = withTraits('pers-tidy', ['orderly']);
    const messy = withTraits('pers-messy', ['chaotic']);
    for (const sim of [tidy, messy]) sim.advanceTo(sim.now + MS_DAY);
    expect(tidy.player.wellbeing.hygiene).toBeGreaterThan(messy.player.wellbeing.hygiene + 10);
  });

  it('still keeps the world coherent over a year with a full set held', () => {
    const sim = withTraits('pers-year', ['highly_strung', 'night_owl', 'holds_grudges', 'burns_out']);
    sim.advanceTo(sim.now + 365 * MS_DAY);
    expect(sim.ledger.audit()).toEqual([]);
    for (const [key, value] of Object.entries(sim.player.wellbeing)) {
      expect(Number.isFinite(value), key).toBe(true);
      if (key === 'sleepDebt') continue;
      expect(value, key).toBeGreaterThanOrEqual(0);
      expect(value, key).toBeLessThanOrEqual(100);
    }
  });
});
