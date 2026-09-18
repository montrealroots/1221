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
import { PERSONALITY_HIGHER_IS_WORSE, PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';
import { SYSTEM_HIGHER_IS_WORSE, TRAITS } from '@/engine/domain/attributes';
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
    // A trait whose knob is live, which is now the only kind there is: `frugal`
    // stood here and its two knobs were savingsRate and impulsePurchaseRate, both
    // of which have gone with the other forty-five nothing read.
    const trait = PERSONALITY_TRAIT_BY_ID['even_tempered']!;
    const [key, factor] = Object.entries(trait.systemMods ?? {})[0]!;
    const person = playerWith('taste-mod', { personalityTraits: ['even_tempered'] });
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

  it('declares no knob the life systems do not read', () => {
    // This used to name the dormant six so they were not mistaken for live, on the
    // argument that a trait which says it costs something must not quietly cost
    // nothing without anybody knowing which. That was the right care and it has
    // been overtaken: dormant turned out to mean dormant for good.
    //
    // Nobody but the player holds a trait — everybody the generators write gets
    // `traits: []` — and the player is a prodigy whose sheet starts at the ceiling
    // and whom `favourableOnly` protects from anything subtracting. So a knob no
    // system reads was never going to wake up for anybody. Forty-seven of the
    // fifty-three went, and the claim here is now the stronger one: every knob
    // still declared is a knob something asks for by name.
    const declared = new Set<string>();
    for (const trait of Object.values(PERSONALITY_TRAIT_BY_ID)) {
      for (const key of Object.keys(trait.systemMods ?? {})) declared.add(key);
    }
    const life = readFileSync('src/engine/systems/life.ts', 'utf8');
    const read = new Set(
      [...life.matchAll(/personalityOf\(person, '(\w+)'\)/g)].map((m) => m[1]!),
    );
    expect([...read].sort()).toEqual(
      ['energyRecovery', 'sleepQuality', 'stressGain', 'stressRecovery'],
    );
    expect([...declared].filter((key) => !read.has(key)).sort()).toEqual([]);
    expect(declared.size, 'a trait table that promises nothing at all').toBeGreaterThan(0);
  });

  it('declares no acting-trait knob nothing reads, which is forty-four fewer', () => {
    // This named the forty-four by hand, on the argument that a knob nobody has
    // counted is just a knob. They are gone rather than counted now, and the
    // reason is the one the test above records: nobody but the player holds a
    // trait, and the player is a prodigy at the ceiling whom `favourableOnly`
    // protects from anything subtracting. A dormant knob here was never going to
    // wake up for anybody, so forty-four of the forty-six went.
    //
    // Two of the names that went were also fields on `Person.reputation` —
    // `audienceAppeal` and `professionalReputation` — which is how a wide grep
    // reads them as live and how they were nearly kept as live. A knob and a
    // field can share a name and share nothing else, and the fields are
    // untouched: they are four of the seven dials this same run of work gave a
    // second direction to.
    const declared = new Set<string>();
    for (const trait of TRAITS) {
      for (const key of Object.keys(trait.systemMods ?? {})) declared.add(key);
    }
    // Read off `modifierFor`, which is the only way an acting trait's knob is
    // ever asked for, and off the one file that asks.
    const life = readFileSync('src/engine/systems/life.ts', 'utf8');
    const read = new Set([...life.matchAll(/modifierFor\(person, '(\w+)'\)/g)].map((m) => m[1]!));
    expect([...read].sort()).toEqual(['recoveryRate', 'stressPerShootDay']);

    expect([...declared].filter((key) => !read.has(key)).sort()).toEqual([]);
    expect([...declared].sort()).toEqual(['recoveryRate', 'stressPerShootDay']);
  });

  it('leaves the two reputation fields that share a name alone', () => {
    // The trap the deleted list warned about, held as its own claim now that the
    // list is gone: `audienceAppeal` and `professionalReputation` were knobs on a
    // trait AND are fields on `Person.reputation`. The knobs went. The fields are
    // live, and they move in both directions.
    const sim = quickSave({}, 'taste-fields');
    const me = sim.universe.people[sim.universe.playerId]!;
    expect(typeof me.reputation.audienceAppeal).toBe('number');
    expect(typeof me.reputation.professionalReputation).toBe('number');
    me.reputation.audienceAppeal = 60;
    me.reputation.professionalReputation = 60;
    sim.advanceTo(sim.now + 400 * 86_400_000);
    expect(me.reputation.audienceAppeal).toBeLessThan(60);
    expect(me.reputation.professionalReputation).toBeLessThan(60);
  });

  it('guards no knob that no trait carries, which is what a deleted system leaves', () => {
    // A higher-is-worse guard flips the sign on a knob. Six of the thirteen
    // flipped the sign on knobs no trait in the game declares — `overrunOdds`,
    // `draftDays`, `coverageDays`, `decisionDays`, `dealDays`, `healthDrain` —
    // so there was nothing for any of them to flip. A rule about a word, kept
    // after the word went.
    //
    // The bar here is deliberately lower than being READ: only
    // `stressPerShootDay` of the seven is ever passed to `systemModifier`. A
    // dormant knob is dormant on purpose in this codebase, and its guard is
    // part of what it will mean when something wakes it. What cannot be
    // defended is a guard on a knob that does not exist anywhere.
    const carried = new Set<string>();
    for (const trait of TRAITS) {
      for (const key of Object.keys(trait.systemMods ?? {})) carried.add(key);
    }
    for (const trait of Object.values(PERSONALITY_TRAIT_BY_ID)) {
      for (const key of Object.keys(trait.systemMods ?? {})) carried.add(key);
    }
    const orphaned = [...SYSTEM_HIGHER_IS_WORSE].filter((key) => !carried.has(key)).sort();
    expect(orphaned, 'a guard on a knob no trait carries').toEqual([]);
    const orphanedToo = [...PERSONALITY_HIGHER_IS_WORSE].filter((key) => !carried.has(key)).sort();
    expect(orphanedToo, 'the same, one file over').toEqual([]);
    // And the guards are a real subset, not every knob relabelled — a set that
    // held everything would say nothing about direction.
    expect(SYSTEM_HIGHER_IS_WORSE.size).toBeLessThan(carried.size);
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
    for (const key of ['stressGain', 'stressRecovery', 'sleepQuality', 'energyRecovery']) {
      expect(axisModifier(person, key), key).toBe(1);
    }
  });

  it('makes emotional stability decide how stress arrives and clears', () => {
    const volatile = after({ emotionalStability: 5 }, 'axis-volatile');
    const steady = after({ emotionalStability: 95 }, 'axis-steady');
    // Stress is where the axis shows: about three and a half times as much of
    // it after a month on the volatile end.
    expect(volatile.stress).toBeGreaterThan(steady.stress);
    expect(volatile.stress / Math.max(steady.stress, 0.01)).toBeGreaterThan(2);
  });

  it('tops out morale for everybody, because a month on the estate has no teeth', () => {
    // This used to read morale to prove the axis worked, and it stopped
    // working when the family house replaced the rented flat: a better place
    // to sleep in pushes both ends to a hundred and the difference disappears
    // under the ceiling.
    //
    // Recording it rather than deleting it. The axis is fine — the stress
    // check above shows it. What this says is that nothing in a month of this
    // life is hard enough to move morale off its maximum, whoever you are,
    // which stops being true the moment there is work to be bad at.
    expect(after({ emotionalStability: 5 }, 'axis-volatile').morale).toBe(100);
    expect(after({ emotionalStability: 95 }, 'axis-steady').morale).toBe(100);
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

  it('holds three axes, and every one of them decides something', () => {
    // This block used to carry two tests pinning the opposite: that
    // extraversion, agreeableness and risk tolerance moved nothing, and that
    // openness was recorded and read by nothing at all. They were honest
    // records of four dead words, and they passed only for as long as the dead
    // words survived.
    //
    // The four are deleted. What replaces those tests is the claim that makes
    // the deletion checkable: `Personality` holds three, and moving each one
    // moves something. A fifth axis arriving with no reader fails here.
    const sim = createSave(1, 'axes-three', { ...defaultConfig() });
    const me = sim.universe.people[sim.universe.playerId]!;
    expect(Object.keys(me.personality).sort())
      .toEqual(['ambition', 'conscientiousness', 'emotionalStability']);

    // Asserted at `axisModifier`, which is the only thing that reads an axis,
    // rather than through a month of living. Ambition's term is `driven * 0.15`
    // inside `stressGain`, and a month of simulated noise swallows it — so a
    // wellbeing comparison would fail on an axis that is genuinely read, which
    // is a test measuring its own instrument rather than the claim.
    const axisPerson = (axis: string, value: number): Person => {
      const made = createSave(1, `axis-${axis}-${value}`, {
        ...defaultConfig(), personality: { ...flat, [axis]: value } as never,
      });
      return made.universe.people[made.universe.playerId]!;
    };
    for (const [axis, knob] of [
      ['emotionalStability', 'stressGain'], ['ambition', 'stressGain'],
      ['conscientiousness', 'sleepQuality'],
    ] as const) {
      expect(axisModifier(axisPerson(axis, 5), knob), `${axis} moved nothing`)
        .not.toBe(axisModifier(axisPerson(axis, 95), knob));
    }
  });

  it('makes ambition cost something, which the screen said for months that it did not', () => {
    // Every wellbeing-level test above runs an IDLE save, and on an idle save
    // ambition moves nothing: the autopilot's fixed point absorbs it, because
    // there is no work to push past the point somebody content would stop at.
    // That is why the creation screen went on saying "two of them do something
    // today" after shoots were built and ambition started biting. The same
    // idle-versus-played trap has now flipped three separate answers in this
    // project, so the axis is checked at the modifier, where it cannot hide.
    const person = (v: number): Person => {
      const sim = createSave(1, `ambition-${v}`, {
        ...defaultConfig(), personality: { ...flat, ambition: v } as never,
      });
      return sim.universe.people[sim.universe.playerId]!;
    };
    const content = axisModifier(person(5), 'stressGain');
    const driven = axisModifier(person(95), 'stressGain');
    expect(driven).toBeGreaterThan(content);
    // And it is the only knob ambition touches, so it cannot be read as a
    // second emotional stability.
    for (const key of ['stressRecovery', 'sleepQuality', 'energyRecovery']) {
      expect(axisModifier(person(5), key), key).toBe(axisModifier(person(95), key));
    }
  });


  it('asks for the three that are live and does not ask for the four that went', () => {
    const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    // Substance, not phrasing. The screen has to ask for the three that decide
    // something; how it says it is free to be edited.
    expect(source).toMatch(/Emotional Stability/);
    expect(source).toMatch(/Conscientiousness/);
    expect(source).toMatch(/Ambition/);

    // This test used to pin the screen's honesty about four axes that were
    // asked for and read by nothing — "Three of them do something today". That
    // was the right test while they existed. They are deleted, so what it pins
    // now is the stronger thing: the screen does not ask for them at all.
    //
    // Checked on the slider list rather than on the prose, because the copy
    // still names the four to say they are gone, and a source-wide search
    // would read that explanation as the offense.
    const sliders = source.slice(
      source.indexOf('const PERSONALITY_AXES'),
      source.indexOf('];', source.indexOf('const PERSONALITY_AXES')),
    );
    for (const gone of ['openness', 'extraversion', 'agreeableness', 'riskTolerance']) {
      expect(sliders, `${gone} is still on the creation screen`).not.toContain(gone);
    }
    expect(sliders).toContain('conscientiousness');

    // The old copy promised all three of these, and none was true.
    expect(source).not.toContain('They shape how people respond to you');
  });
});
