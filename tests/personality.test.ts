/**
 * The personality: seven dispositions, up to four traits, and what they do.
 *
 * The page came back whole, so these hold three things. The content is what
 * the page draws: every trait in a pair with the one it rules out, and no pick
 * the page allows that the engine would refuse. Every knob a trait can move
 * moves its dial when it changes, and the sliders the page says do nothing
 * do nothing, so neither half of what the page claims can drift. And no legal
 * single trait or disposition wears a life down, on autopilot or for a
 * player who sleeps the hours the game suggests, at twenty-five or at sixty.
 * Seven and a half hours, plus a little for any debt, used to be the
 * suggestion, and it failed everybody.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, migrate, quickSave, validateUniverse } from '@/engine';
import type { Person, Personality } from '@/engine/domain/model';
import {
  MAX_PERSONALITY_TRAITS, PERSONALITY_GROUPS, PERSONALITY_TRAITS, PERSONALITY_TRAIT_BY_ID,
  conflictingPersonalityTraits, personalityTraitPairs, type PersonalityKnob,
} from '@/engine/content/personality-traits';
import {
  AXIS_MAX, AXIS_MIN, KNOB_LIMITS, cleanPersonality, cleanPersonalityTraits, defaultPersonality, personalityOf,
} from '@/engine/systems/personality';
import {
  applyElapsedWellbeing, applySleep, freshWellbeing, suggestedSleep, unattendedNight,
} from '@/engine/systems/life';
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

type Case = { name: string; traits: string[]; personality?: Partial<Personality> };

/**
 * Of every pick of four the page allows, the one that moves a knob furthest
 * down or up. For sleep, down counts what a night puts back as well.
 */
function pickFor(knob: PersonalityKnob, way: 'down' | 'up'): string[] {
  const ids = PERSONALITY_TRAITS.map((t) => t.id);
  const score = (held: string[]) => {
    const p = person(held);
    const value = knob === 'sleepQuality'
      ? personalityOf(p, 'sleepQuality') * personalityOf(p, 'energyRecovery')
      : personalityOf(p, knob);
    return way === 'down' ? value : -value;
  };
  let chosen: string[] = [];
  let lowest = Infinity;
  const walk = (from: number, held: string[]) => {
    if (held.length === MAX_PERSONALITY_TRAITS) {
      const value = score(held);
      if (value < lowest) { lowest = value; chosen = [...held]; }
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
  return chosen;
}

/** A save for a case, born in a given year. */
function build(c: Case, birthYear: number, seed: string): Simulation {
  return quickSave({
    personality: { ...defaultPersonality(), ...c.personality }, personalityTraits: c.traits, birthYear,
  }, seed);
}

/** Something on the calendar days away, so the suggestion gives its reason. */
function booked(sim: Simulation): Simulation {
  sim.onSchedule('test.meeting', () => undefined);
  sim.schedule({ at: sim.now + 3 * MS_DAY, kind: 'test.meeting', label: 'A Meeting', category: 'personal', requiresPlayer: true });
  return sim;
}

/** To bed at the same hour every night, for the hours the game suggests. */
function sleepAsSuggested(sim: Simulation, nights: number, bedtime = 23): { hours: number[] } {
  const hours: number[] = [];
  for (let night = 0; night < nights; night += 1) {
    const p = zonedParts(sim.now, sim.zone);
    let bed = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: bedtime }, sim.zone);
    while (bed <= sim.now) bed += MS_DAY;
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

  it('draws every trait exactly once, and every pair it draws is two that rule each other out', () => {
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

  it('makes running on empty cost the detached less stress than nobody in particular', () => {
    // Detached moves stress gain and nothing else, so this is that knob alone.
    const detached = person(['detached']);
    const plain = person();
    for (const p of [detached, plain]) { p.wellbeing.energy = 5; p.wellbeing.stress = 20; applyElapsedWellbeing(p, 6); }
    expect(detached.wellbeing.stress).toBeLessThan(plain.wellbeing.stress);
  });

  it('makes hunger cost the self-critical more mood than the self-assured', () => {
    const harsh = person(['self_critical']);
    const sure = person(['self_assured']);
    for (const p of [harsh, sure]) { p.wellbeing.nourishment = 10; p.wellbeing.morale = 60; applyElapsedWellbeing(p, 6); }
    expect(harsh.wellbeing.morale).toBeLessThan(sure.wellbeing.morale);
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

  it('keeps every knob inside its limits, whatever is held', () => {
    const worstSliders = { emotionalStability: 5, ambition: 95, conscientiousness: 5 };
    const bestSliders = { emotionalStability: 95, ambition: 5, conscientiousness: 95 };
    for (const knob of KNOBS) {
      const [low, high] = KNOB_LIMITS[knob];
      const down = person(pickFor(knob, 'down'), knob === 'stressGain' ? bestSliders : worstSliders);
      const up = person(pickFor(knob, 'up'), knob === 'stressGain' ? worstSliders : bestSliders);
      expect(personalityOf(down, knob), `${knob} past its floor`).toBeGreaterThan(low);
      expect(personalityOf(up, knob), `${knob} past its ceiling`).toBeLessThan(high);
    }
  });

  it('lets a slider lean even when the traits have already gone as far as they can', () => {
    const sleepless = pickFor('sleepQuality', 'down');
    expect(personalityOf(person(sleepless, { conscientiousness: 95 }), 'sleepQuality'))
      .toBeGreaterThan(personalityOf(person(sleepless, { conscientiousness: 5 }), 'sleepQuality'));
    const strung = pickFor('stressGain', 'up');
    expect(personalityOf(person(strung, { ambition: 95 }), 'stressGain'))
      .toBeGreaterThan(personalityOf(person(strung, { ambition: 5 }), 'stressGain'));
    const slow = pickFor('stressRecovery', 'down');
    expect(personalityOf(person(slow, { emotionalStability: 95 }), 'stressRecovery'))
      .toBeGreaterThan(personalityOf(person(slow, { emotionalStability: 5 }), 'stressRecovery'));
  });

  it('charges running on empty for the hours spent there, not the whole stretch', () => {
    const late = person();
    const already = person();
    late.wellbeing.energy = 40;
    already.wellbeing.energy = 10;
    for (const p of [late, already]) { p.wellbeing.stress = 20; applyElapsedWellbeing(p, 12); }
    // Both end the stretch empty. Only one spent all of it there.
    expect(late.wellbeing.energy).toBeLessThan(15);
    expect(late.wellbeing.stress).toBeLessThan(already.wellbeing.stress);
  });
});

describe('a night nobody planned', () => {
  it('is a sound sleeper’s night for anybody who sleeps well', () => {
    for (const traits of [[], ['sleeps_anywhere'], ['early_riser', 'homebody']]) {
      const { sound, hours } = unattendedNight(person(traits));
      expect(hours, traits.join('+') || 'nobody in particular').toBe(sound);
    }
  });

  it('runs longer for somebody who sleeps or recovers badly, and not past ten hours', () => {
    for (const traits of [['light_sleeper'], ['restless'], ['night_owl']]) {
      const { sound, hours } = unattendedNight(person(traits));
      expect(hours, traits.join('+')).toBeGreaterThan(sound);
    }
    const worst = unattendedNight(person(pickFor('sleepQuality', 'down'), { conscientiousness: 5 }));
    expect(worst.hours).toBeLessThanOrEqual(10);
  });
});

describe('the sleep the game suggests, and why', () => {
  /** Tonight's suggestion for somebody, at an hour, calm and owing nothing unless told. */
  function tonight(opts: {
    traits?: string[]; personality?: Partial<Personality>; birthYear?: number;
    hour?: number; stress?: number; debt?: number;
  } = {}) {
    const sim = quickSave({
      personality: { ...defaultPersonality(), ...opts.personality },
      personalityTraits: opts.traits ?? [],
      ...(opts.birthYear ? { birthYear: opts.birthYear } : {}),
    }, 'p-tonight');
    const p = zonedParts(sim.now, sim.zone);
    let at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: opts.hour ?? 23 }, sim.zone);
    if (at <= sim.now) at += MS_DAY;
    sim.advanceTo(at);
    booked(sim);
    sim.player.wellbeing.stress = opts.stress ?? 0;
    sim.player.wellbeing.sleepDebt = opts.debt ?? 0;
    return suggestedSleep(sim);
  }

  it('tells a calm person eight hours and calls it a normal night', () => {
    expect(tonight()).toEqual({ hours: 8, reason: 'A normal night.' });
  });

  it('says whichever thing stretched the night', () => {
    expect(tonight({ stress: 60 }).reason).toBe('Stress is costing you sleep, so a normal night takes longer.');
    expect(tonight({ traits: ['light_sleeper'] }).reason).toBe('You don’t sleep deeply, so a normal night takes longer.');
    expect(tonight({ traits: ['restless'] }).reason).toBe('A night puts back less for you than for most, so it takes longer.');
    expect(tonight({ hour: 2 }).reason).toBe('It’s late, and a night that starts now is a worse one, so it takes longer.');
    expect(tonight({ birthYear: 1955 }).reason).toBe('A night puts back less than it used to, so it takes longer.');
    expect(tonight({ debt: 12 }).reason).toBe('You’re carrying real sleep debt.');
    for (const one of [{ stress: 60 }, { traits: ['light_sleeper'] }, { hour: 2 }, { birthYear: 1955 }]) {
      expect(tonight(one).hours, JSON.stringify(one)).toBeGreaterThan(8);
    }
  });

  it('calls a short night a normal one when that is all somebody needs', () => {
    const good = tonight({ traits: ['sleeps_anywhere', 'early_riser'] });
    expect(good.hours).toBeLessThan(8);
    expect(good.reason).toBe('A normal night.');
  });

  it('never asks past the dial, and says so when the dial is not enough', () => {
    const hopeless = tonight({
      traits: pickFor('sleepQuality', 'down'), birthYear: 1945, hour: 2,
      personality: { emotionalStability: 5, ambition: 95, conscientiousness: 5 },
    });
    expect(hopeless.hours).toBe(14);
    expect(hopeless.reason).toMatch(/not even fourteen hours makes up a whole day/);
  });
});

describe('no single trait or disposition wears a life down', () => {
  const BAD = { emotionalStability: 5, ambition: 95, conscientiousness: 5 };
  const singles: Case[] = [
    { name: 'nobody in particular', traits: [] },
    ...PERSONALITY_TRAITS.filter((t) => t.systemMods).map((t) => ({ name: t.id, traits: [t.id] })),
    ...(['emotionalStability', 'ambition', 'conscientiousness'] as const).flatMap((axis) => [
      { name: `${axis} at 5`, traits: [], personality: { [axis]: 5 } },
      { name: `${axis} at 95`, traits: [], personality: { [axis]: 95 } },
    ]),
  ];
  const worst: Case[] = (['sleepQuality', 'stressGain', 'moraleSwing'] as const).map((knob) => ({
    name: `the worst four for ${knob}, and the worst sliders`, traits: pickFor(knob, knob === 'sleepQuality' ? 'down' : 'up'), personality: BAD,
  }));

  it('left on autopilot for a year, at twenty-five and at sixty', () => {
    for (const birthYear of [2001, 1966]) {
      for (const c of singles) {
        const sim = build(c, birthYear, 'p-year');
        let lowest = 100;
        for (let day = 0; day < 365; day += 1) {
          sim.advanceTo(sim.now + MS_DAY);
          lowest = Math.min(lowest, sim.player.wellbeing.condition);
        }
        expect(lowest, `${c.name}, born ${birthYear}, wore down on autopilot`).toBeGreaterThan(65);
        expect(sim.player.wellbeing.morale, `${c.name}, born ${birthYear}, ended flat`).toBeGreaterThan(80);
        expect(sim.player.wellbeing.stress, `${c.name}, born ${birthYear}, ended stretched`).toBeLessThan(25);
      }
    }
  });

  it('sleeping the hours the game suggests for two months, at eleven and at one, at twenty-five and at sixty', () => {
    for (const birthYear of [2001, 1966]) {
      for (const bedtime of [23, 1]) {
        for (const c of singles) {
          const sim = build(c, birthYear, 'p-nights');
          const { hours } = sleepAsSuggested(sim, 60, bedtime);
          const w = sim.player.wellbeing;
          const who = `${c.name}, born ${birthYear}, to bed at ${bedtime}`;
          expect(w.condition, `${who} wore down on the suggested hours`).toBeGreaterThan(80);
          expect(w.stress, `${who} is stretched on the suggested hours`).toBeLessThan(25);
          expect(Math.max(...hours), `${who} was told to sleep past the dial`).toBeLessThanOrEqual(14);
        }
      }
    }
  });

  it('holds even the worst four with the worst sliders on the suggested hours, at sixty', () => {
    for (const c of worst) {
      const sim = build(c, 1966, 'p-worst');
      sleepAsSuggested(sim, 60, 23);
      expect(sim.player.wellbeing.condition, c.name).toBeGreaterThan(80);
      expect(sim.player.wellbeing.stress, c.name).toBeLessThan(25);
    }
  });

  it('keeps the worst four with the worst sliders on their feet on autopilot, at twenty-five', () => {
    // At sixty the same people left alone for a year keep their condition and
    // end flat: the costs of those traits are mood as well as sleep, and a
    // life nobody tends pays them. Sleeping the suggested hours holds them.
    for (const c of worst) {
      const sim = build(c, 2001, 'p-worst-year');
      let lowest = 100;
      for (let day = 0; day < 365; day += 1) {
        sim.advanceTo(sim.now + MS_DAY);
        lowest = Math.min(lowest, sim.player.wellbeing.condition);
      }
      expect(lowest, c.name).toBeGreaterThan(65);
      expect(sim.player.wellbeing.stress, c.name).toBeLessThan(25);
    }
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
