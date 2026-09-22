/**
 * The personality: seven dispositions, up to four traits, and what they do.
 *
 * The page came back whole, so these hold three things. The content is what
 * the page draws: every trait in a pair with the one it rules out, and no pick
 * the page allows that the engine would refuse. Every knob a trait can move
 * moves its dial when it changes, and the sliders the page says do nothing
 * do nothing, so neither half of what the page claims can drift. And no legal
 * pick wears a life down: not on autopilot, and not for a player who sleeps
 * the hours the game suggests, which a flat seven and a half used to fail for
 * everybody.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, migrate, quickSave, validateUniverse } from '@/engine';
import type { Person, Personality } from '@/engine/domain/model';
import {
  MAX_PERSONALITY_TRAITS, PERSONALITY_GROUPS, PERSONALITY_TRAITS, PERSONALITY_TRAIT_BY_ID,
  conflictingPersonalityTraits, personalityTraitPairs, type PersonalityKnob,
} from '@/engine/content/personality-traits';
import {
  AXIS_MAX, AXIS_MIN, cleanPersonality, cleanPersonalityTraits, defaultPersonality, personalityOf,
} from '@/engine/systems/personality';
import { applyElapsedWellbeing, applySleep, freshWellbeing, suggestedSleep } from '@/engine/systems/life';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine';

const KNOBS: readonly PersonalityKnob[] = [
  'stressGain', 'stressRecovery', 'sleepQuality', 'energyRecovery', 'hygieneDrift', 'moraleSwing',
];

/** Somebody with no lean anywhere: every axis at the middle and no traits. */
const NEUTRAL: Personality = {
  openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50,
  emotionalStability: 50, ambition: 50, riskTolerance: 50,
};

/** A bare person to put through the wellbeing model by hand. */
function person(traits: string[] = [], personality: Partial<Personality> = {}): Person {
  return {
    personality: { ...NEUTRAL, ...personality },
    personalityTraits: traits,
    wellbeing: freshWellbeing(),
  } as unknown as Person;
}

/** Every pick of four the page allows, and the one that sleeps and recovers worst. */
function worstLegalPick(): string[] {
  const ids = PERSONALITY_TRAITS.map((t) => t.id);
  let worst: string[] = [];
  let lowest = Infinity;
  const walk = (from: number, held: string[]) => {
    if (held.length === MAX_PERSONALITY_TRAITS) {
      const p = person(held);
      const score = personalityOf(p, 'sleepQuality') * personalityOf(p, 'energyRecovery')
        * personalityOf(p, 'stressRecovery') / personalityOf(p, 'stressGain');
      if (score < lowest) { lowest = score; worst = [...held]; }
      return;
    }
    for (let i = from; i < ids.length; i += 1) {
      if (conflictingPersonalityTraits(held, ids[i]!).length > 0) continue;
      held.push(ids[i]!);
      walk(i + 1, held);
      held.pop();
    }
  };
  walk(0, []);
  return worst;
}

/** Something on the calendar days away, so the suggestion gives its reason. */
function booked(sim: Simulation): Simulation {
  sim.onSchedule('test.meeting', () => undefined);
  sim.schedule({ at: sim.now + 3 * MS_DAY, kind: 'test.meeting', label: 'A Meeting', category: 'personal', requiresPlayer: true });
  return sim;
}

/** Bed at eleven, for the hours the game suggests, every night. */
function sleepAsSuggested(sim: Simulation, nights: number): { hours: number[] } {
  const hours: number[] = [];
  for (let night = 0; night < nights; night += 1) {
    const p = zonedParts(sim.now, sim.zone);
    let bed = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 23 }, sim.zone);
    if (bed <= sim.now) bed = instantFromZoned({ year: p.year, month: p.month, day: p.day + 1, hour: 23 }, sim.zone);
    sim.advanceTo(bed);
    const tonight = suggestedSleep(sim).hours;
    hours.push(tonight);
    const result = sim.execute({ kind: 'life.sleep', payload: { hours: tonight } });
    expect(result.ok, result.error).toBe(true);
  }
  return { hours };
}

describe('the content', () => {
  it('is the thirty-five traits in six groups the page draws', () => {
    expect(PERSONALITY_TRAITS).toHaveLength(35);
    expect(new Set(PERSONALITY_TRAITS.map((t) => t.id)).size).toBe(35);
    expect(new Set(PERSONALITY_TRAITS.map((t) => t.name)).size).toBe(35);
    expect(PERSONALITY_GROUPS).toEqual(['Temperament', 'Habits', 'Body', 'Money', 'People', 'Mind']);
    for (const group of PERSONALITY_GROUPS) {
      expect(PERSONALITY_TRAITS.filter((t) => t.group === group).length, group).toBeGreaterThanOrEqual(4);
    }
  });

  it('writes every conflict both ways, against a trait that exists', () => {
    for (const trait of PERSONALITY_TRAITS) {
      for (const other of trait.conflictsWith ?? []) {
        expect(PERSONALITY_TRAIT_BY_ID[other], `${trait.id} rules out ${other}, which is not a trait`).toBeDefined();
        expect(PERSONALITY_TRAIT_BY_ID[other]!.conflictsWith, `${other} does not rule out ${trait.id}`).toContain(trait.id);
      }
    }
  });

  it('draws every trait exactly once, beside the one it rules out where there is one', () => {
    const drawn = PERSONALITY_GROUPS.flatMap((group) => personalityTraitPairs(group).flat().map((t) => t.id));
    expect([...drawn].sort()).toEqual(PERSONALITY_TRAITS.map((t) => t.id).sort());
    for (const group of PERSONALITY_GROUPS) {
      for (const pair of personalityTraitPairs(group)) {
        if (pair.length === 2) expect(pair[0]!.conflictsWith).toContain(pair[1]!.id);
      }
    }
  });

  it('has a description and a stated cost for every trait', () => {
    for (const trait of PERSONALITY_TRAITS) {
      expect(trait.description.length, trait.id).toBeGreaterThan(20);
      expect(trait.cost.length, trait.id).toBeGreaterThan(10);
    }
  });
});

describe('what the engine will hold', () => {
  it('keeps at most four traits, each once, never two that rule each other out', () => {
    expect(cleanPersonalityTraits(['early_riser', 'night_owl', 'orderly'])).toEqual(['early_riser', 'orderly']);
    expect(cleanPersonalityTraits(['frugal', 'frugal', 'nonsense', 'loyal'])).toEqual(['frugal', 'loyal']);
    expect(cleanPersonalityTraits(['frugal', 'loyal', 'curious', 'orderly', 'resilient', 'guarded']))
      .toEqual(['frugal', 'loyal', 'curious', 'orderly']);
    expect(cleanPersonalityTraits(undefined)).toEqual([]);
  });

  it('keeps every axis a whole number on the slider, and fills one that is missing', () => {
    const clean = cleanPersonality({ openness: 150, ambition: -3, agreeableness: 41.6, riskTolerance: Number.NaN });
    expect(clean.openness).toBe(AXIS_MAX);
    expect(clean.ambition).toBe(AXIS_MIN);
    expect(clean.agreeableness).toBe(42);
    expect(clean.riskTolerance).toBe(defaultPersonality().riskTolerance);
    expect(clean.emotionalStability).toBe(defaultPersonality().emotionalStability);
  });

  it('makes the same person from the engine that the page would', () => {
    const sim = createSave(1, 'personality-clean', {
      ...defaultConfig(),
      personality: { ...defaultPersonality(), openness: 300 },
      personalityTraits: ['light_sleeper', 'sleeps_anywhere', 'orderly', 'orderly', 'loyal', 'curious', 'spender'],
    });
    expect(sim.player.personality.openness).toBe(AXIS_MAX);
    expect(sim.player.personalityTraits).toEqual(['light_sleeper', 'orderly', 'loyal', 'curious']);
  });
});

describe('what it does', () => {
  it('leaves nobody in particular exactly as they were', () => {
    for (const knob of KNOBS) expect(personalityOf(person(), knob), knob).toBe(1);
  });

  it('reads every knob a trait can declare, where the life system bites', () => {
    const declared = new Set(PERSONALITY_TRAITS.flatMap((t) => Object.keys(t.systemMods ?? {})));
    expect([...declared].sort()).toEqual([...KNOBS].sort());
  });

  it('makes a light sleeper need longer in bed than somebody who sleeps anywhere', () => {
    const light = booked(quickSave({ personalityTraits: ['light_sleeper'] }, 'p-light'));
    const anywhere = quickSave({ personalityTraits: ['sleeps_anywhere'] }, 'p-anywhere');
    const plain = quickSave({}, 'p-plain');
    expect(suggestedSleep(light).hours).toBeGreaterThan(suggestedSleep(plain).hours);
    expect(suggestedSleep(plain).hours).toBeGreaterThan(suggestedSleep(anywhere).hours);
    expect(suggestedSleep(light).reason).toMatch(/don’t sleep deeply/);
  });

  it('makes a night put back more for a homebody than for somebody restless', () => {
    const home = person(['homebody']);
    const restless = person(['restless']);
    for (const p of [home, restless]) { p.wellbeing.energy = 20; applySleep(p, 7, 0.8); }
    expect(home.wellbeing.energy).toBeGreaterThan(restless.wellbeing.energy);
  });

  it('makes running on empty cost the highly strung more stress than the unshakeable', () => {
    const strung = person(['highly_strung']);
    const calm = person(['unshakeable']);
    for (const p of [strung, calm]) { p.wellbeing.energy = 5; p.wellbeing.stress = 20; applyElapsedWellbeing(p, 6); }
    expect(strung.wellbeing.stress).toBeGreaterThan(calm.wellbeing.stress);
  });

  it('clears stress faster in somebody resilient than in somebody who burns out', () => {
    const resilient = person(['resilient']);
    const burns = person(['burns_out']);
    for (const p of [resilient, burns]) { p.wellbeing.stress = 60; applyElapsedWellbeing(p, 8); }
    expect(resilient.wellbeing.stress).toBeLessThan(burns.wellbeing.stress);
  });

  it('keeps somebody orderly cleaner for longer than somebody chaotic', () => {
    const orderly = person(['orderly']);
    const chaotic = person(['chaotic']);
    for (const p of [orderly, chaotic]) applyElapsedWellbeing(p, 10);
    expect(orderly.wellbeing.hygiene).toBeGreaterThan(chaotic.wellbeing.hygiene);
  });

  it('swings the self-critical further than the self-assured, both ways', () => {
    const harsh = person(['self_critical']);
    const sure = person(['self_assured']);
    for (const p of [harsh, sure]) { p.wellbeing.morale = 50; applySleep(p, 4, 0.8); }
    expect(harsh.wellbeing.morale).toBeLessThan(sure.wellbeing.morale);
    for (const p of [harsh, sure]) { p.wellbeing.morale = 50; applySleep(p, 10, 0.9); }
    expect(harsh.wellbeing.morale).toBeGreaterThan(sure.wellbeing.morale);
  });

  it('lets the three dispositions the page names move what it says they move', () => {
    const volatile = person([], { emotionalStability: 5 });
    const steady = person([], { emotionalStability: 95 });
    expect(personalityOf(volatile, 'stressGain')).toBeGreaterThan(personalityOf(steady, 'stressGain'));
    expect(personalityOf(volatile, 'stressRecovery')).toBeLessThan(personalityOf(steady, 'stressRecovery'));
    expect(personalityOf(person([], { ambition: 95 }), 'stressGain'))
      .toBeGreaterThan(personalityOf(person([], { ambition: 5 }), 'stressGain'));
    expect(personalityOf(person([], { conscientiousness: 95 }), 'sleepQuality'))
      .toBeGreaterThan(personalityOf(person([], { conscientiousness: 5 }), 'sleepQuality'));
  });

  it('lets the four it says do nothing do nothing, and the money traits too', () => {
    for (const axis of ['openness', 'extraversion', 'agreeableness', 'riskTolerance'] as const) {
      for (const knob of KNOBS) {
        expect(personalityOf(person([], { [axis]: 5 }), knob), `${axis} moves ${knob}`)
          .toBe(personalityOf(person([], { [axis]: 95 }), knob));
      }
    }
    for (const id of ['frugal', 'spender', 'generous', 'keeps_accounts']) {
      for (const knob of KNOBS) expect(personalityOf(person([id]), knob), `${id} moves ${knob}`).toBe(1);
    }
  });

  it('stops four traits pulling the same way at what the worst single one does', () => {
    const worst = person(worstLegalPick(), { conscientiousness: 5 });
    expect(personalityOf(worst, 'sleepQuality')).toBeGreaterThanOrEqual(0.8);
    expect(personalityOf(worst, 'energyRecovery')).toBeGreaterThanOrEqual(0.85);
  });
});

describe('no legal pick wears a life down', () => {
  const cases: { name: string; traits: string[]; personality?: Partial<Personality> }[] = [
    { name: 'nobody in particular', traits: [] },
    ...PERSONALITY_TRAITS.filter((t) => t.systemMods).map((t) => ({ name: t.id, traits: [t.id] })),
    { name: 'the worst pick, at its worst', traits: worstLegalPick(), personality: { emotionalStability: 5, ambition: 95, conscientiousness: 5 } },
  ];

  it('left on autopilot for a year', () => {
    for (const c of cases) {
      const sim = quickSave({ personality: { ...defaultPersonality(), ...c.personality }, personalityTraits: c.traits }, 'p-year');
      let lowest = 100;
      for (let day = 0; day < 365; day += 1) {
        sim.advanceTo(sim.now + MS_DAY);
        lowest = Math.min(lowest, sim.player.wellbeing.condition);
      }
      expect(lowest, `${c.name} wore down on autopilot`).toBeGreaterThan(60);
      expect(sim.player.wellbeing.morale, `${c.name} ended flat`).toBeGreaterThan(50);
      expect(sim.player.wellbeing.energy, `${c.name} ended empty`).toBeGreaterThan(10);
    }
  });

  it('sleeping the hours the game suggests, every night for two months', () => {
    for (const c of cases) {
      const sim = quickSave({ personality: { ...defaultPersonality(), ...c.personality }, personalityTraits: c.traits }, 'p-nights');
      const { hours } = sleepAsSuggested(sim, 60);
      const w = sim.player.wellbeing;
      expect(w.condition, `${c.name} wore down on the suggested hours`).toBeGreaterThan(80);
      expect(w.stress, `${c.name} is stretched on the suggested hours`).toBeLessThan(30);
      expect(Math.max(...hours), `${c.name} was told to sleep past the dial`).toBeLessThanOrEqual(12);
    }
  });

  it('tells a calm person eight hours and calls it a normal night', () => {
    const sim = quickSave({}, 'p-normal');
    const p = zonedParts(sim.now, sim.zone);
    sim.advanceTo(instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 23 }, sim.zone));
    booked(sim);
    sim.player.wellbeing.stress = 0;
    sim.player.wellbeing.sleepDebt = 0;
    expect(suggestedSleep(sim)).toEqual({ hours: 8, reason: 'A normal night.' });
  });
});

describe('an older save', () => {
  it('keeps the personality a save from before 80 was made with', () => {
    const sim = quickSave({}, 'p-79');
    const universe = sim.universe;
    universe.meta.schemaVersion = 79;
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    const theirs = { ...NEUTRAL, openness: 88, ambition: 12 };
    row.personality = theirs;
    row.personalityTraits = ['night_owl', 'guarded'];

    const result = migrate(universe);

    expect(result.migrated).toBe(true);
    expect(row.personality).toEqual(theirs);
    expect(row.personalityTraits).toEqual(['night_owl', 'guarded']);
    expect(result.steps.join(' ')).not.toMatch(/personality/);
    expect(validateUniverse(universe).ok).toBe(true);
  });

  it('gives a save written under 80 to 82 the one creation starts on, with no traits', () => {
    const sim = quickSave({ personalityTraits: ['early_riser'] }, 'p-82');
    const universe = sim.universe;
    universe.meta.schemaVersion = 82;
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    delete row.personality;
    delete row.personalityTraits;

    const result = migrate(universe);

    expect(row.personality).toEqual(defaultPersonality());
    expect(row.personalityTraits).toEqual([]);
    expect(result.steps.join(' ')).toMatch(/Gave 1 person a personality this build can read/);
    expect(validateUniverse(universe).ok).toBe(true);
  });

  it('tidies a pick the page would not have allowed', () => {
    const sim = quickSave({}, 'p-tidy');
    sim.universe.meta.schemaVersion = 82;
    const row = sim.universe.people[sim.universe.playerId] as unknown as Record<string, unknown>;
    row.personalityTraits = ['early_riser', 'night_owl', 'gone_trait', 'orderly'];
    migrate(sim.universe);
    expect(row.personalityTraits).toEqual(['early_riser', 'orderly']);
  });
});
