/**
 * The whole span.
 *
 * What a test can hold about a life running end to end: an age counted by the
 * calendar rather than by dividing milliseconds, a family you were born into
 * that shares your name and contains nobody impossible, a body whose ceiling
 * falls as a curve and never climbs back, an age gate that answers with the
 * rule of the country you are standing in, a birthday that arrives once a
 * year, an end that comes for the generation above you and only ever once —
 * and, the one that matters most, a game that never hands the player a date
 * their character could not possibly know.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ageAt, ageOf, adultExpectancyFor, ceilingOf, describeYears, ensureFamily, expectancyFor,
  familyOf, gatesFor, hasFamily, isAlive, mayI, pensionAgeFor, relationLabel, stageOf,
  describeSize, fullyGrown, heightOf, weightOf, yearsBetween, yearsToPension,
} from '@/engine/systems/lifespan';
import {
  AGE_GATE_NOTE, AGING, COUNTRY_GATES, DEFAULT_GATES, LIFESPAN_NOTE, LIFE_EXPECTANCY, LIFE_STAGES,
  FULLY_GROWN, GROWTH_NOTE, NO_DRINKING, PENSION_AGE, adultExpectancyIn, ceilingAt, describeHeight,
  describeWeight, expectancyIn, recoveryFactorAt, stageAt,
} from '@/engine/content/lifespan';
import { COUNTRIES } from '@/engine/content/geography';
import { HERITAGES, HERITAGE_BY_ID, HERITAGE_NOTE } from '@/engine/content/heritage';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';

const YEAR = 365.25 * MS_DAY;

function aLife(seed = 'span', age?: number): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, seed);
  if (age !== undefined) sim.player.birthInstant = sim.now - Math.round((age + 0.4) * YEAR);
  sim.income(sim.player.primaryAccountId!, 500_000_00, 'Test funding', 'other');
  return sim;
}

function standingIn(sim: Simulation, cityId: string): Simulation {
  sim.player.currentLocationId = cityId;
  return sim;
}

// ---------------------------------------------------------------------------

describe('how old somebody is', () => {
  it('counts by the calendar, so a leap year does not lose a day', () => {
    const sim = aLife('calendar');
    // Four years to the day is four years, every time, which dividing by
    // 365.25 days is not.
    for (let year = 1; year <= 12; year++) {
      const born = sim.player.birthInstant;
      const anniversary = new Date(born);
      anniversary.setUTCFullYear(anniversary.getUTCFullYear() + year);
      expect(yearsBetween(born, anniversary.getTime(), 'UTC')).toBe(year);
      expect(yearsBetween(born, anniversary.getTime() - MS_DAY, 'UTC')).toBe(year - 1);
    }
  });

  it('never reports a negative age', () => {
    const sim = aLife('unborn');
    expect(yearsBetween(sim.now + 10 * YEAR, sim.now, sim.homeZone)).toBe(0);
  });

  it('names the part of a life the way people name it', () => {
    for (const [age, label] of [[4, 'Childhood'], [15, 'Adolescence'], [22, 'Young Adult'],
      [35, 'Adulthood'], [50, 'Middle Age'], [66, 'Later Life'], [88, 'Old Age']] as const) {
      expect(stageAt(age).label).toBe(label);
    }
    const sim = aLife('stage', 41);
    expect(stageOf(sim).label).toBe('Adulthood');
    expect(describeYears(sim)).toContain('41 years old');
  });
});

describe('what the published figures say and do not say', () => {
  it('carries a life expectancy every country in it actually has', () => {
    const known = new Set(COUNTRIES.all().map((one) => one.id));
    for (const one of LIFE_EXPECTANCY) {
      expect(known.has(one.countryId), one.countryId).toBe(true);
      expect(one.years).toBeGreaterThanOrEqual(45);
      expect(one.years).toBeLessThanOrEqual(90);
    }
    expect(LIFE_EXPECTANCY.length).toBeGreaterThan(120);
  });

  it('does not treat life expectancy at birth as the age adults die at', () => {
    // The whole point of the correction: several countries honestly set a
    // pension age above their own at-birth figure, because the figure is
    // dragged down by children who never reach five.
    expect(expectancyIn('ng')).toBeLessThan(PENSION_AGE.ng!);
    expect(adultExpectancyIn('ng')).toBeGreaterThan(PENSION_AGE.ng!);
    for (const [countryId, age] of Object.entries(PENSION_AGE)) {
      expect(adultExpectancyIn(countryId), countryId).toBeGreaterThan(age);
    }
    // Somewhere with almost no child mortality needs no correction at all.
    expect(adultExpectancyIn('jp')).toBe(expectancyIn('jp'));
  });

  it('says which half of all of it is real', () => {
    expect(LIFESPAN_NOTE).toMatch(/published/);
    expect(LIFESPAN_NOTE).toMatch(/SLATE/);
    expect(LIFESPAN_NOTE).toMatch(/no table/i);
    expect(AGE_GATE_NOTE).toMatch(/not legal advice/);
  });

  it('gives a person the figures of the country they are from', () => {
    const sim = aLife('figures');
    expect(expectancyFor(sim.player)).toBe(expectancyIn('us'));
    expect(adultExpectancyFor(sim.player)).toBe(adultExpectancyIn('us'));
    expect(pensionAgeFor(sim.player)).toBe(PENSION_AGE.us);
    expect(yearsToPension(sim)).toBe(PENSION_AGE.us! - ageOf(sim));
  });
});

describe('what a year costs', () => {
  it('falls as a curve and never climbs back', () => {
    let fitness = 100;
    let condition = 100;
    for (let age = 0; age <= 100; age++) {
      const ceiling = ceilingAt(age);
      expect(ceiling.fitness, `${age}`).toBeLessThanOrEqual(fitness);
      expect(ceiling.condition, `${age}`).toBeLessThanOrEqual(condition);
      // No cliff: nobody wakes up three points worse for having had a birthday.
      expect(fitness - ceiling.fitness).toBeLessThan(3);
      fitness = ceiling.fitness;
      condition = ceiling.condition;
    }
  });

  it('costs a young body almost nothing and an old one a great deal', () => {
    expect(ceilingAt(25).fitness).toBeGreaterThan(96);
    expect(ceilingAt(45).fitness).toBeLessThan(ceilingAt(25).fitness);
    expect(ceilingAt(80).fitness).toBeLessThan(60);
    expect(AGING[0]!.fitness).toBe(0);
  });

  it('takes back the night that used to fix everything', () => {
    expect(recoveryFactorAt(20)).toBeGreaterThan(0.97);
    expect(recoveryFactorAt(60)).toBeLessThan(recoveryFactorAt(30));
    expect(recoveryFactorAt(85)).toBeLessThan(recoveryFactorAt(60));
    expect(recoveryFactorAt(100)).toBeGreaterThan(0.5);
  });

  it('holds a body under what a body that age can reach, every day', () => {
    const sim = aLife('ceiling', 70);
    sim.player.wellbeing.fitness = 100;
    sim.player.wellbeing.condition = 100;
    sim.advanceTo(sim.now + 3 * MS_DAY);
    const ceiling = ceilingOf(sim);
    expect(ceiling.fitness).toBeLessThan(70);
    expect(sim.player.wellbeing.fitness).toBeLessThanOrEqual(ceiling.fitness);
    expect(sim.player.wellbeing.condition).toBeLessThanOrEqual(ceiling.condition);
  });
});

describe('the family you were born into', () => {
  it('gives a life two people who raised it and your own last name', () => {
    const sim = aLife('family');
    const family = familyOf(sim);
    expect(family.parents.length).toBe(2);
    expect(family.parents.some((one) => one.lastName === sim.player.lastName)).toBe(true);
    for (const sibling of family.siblings) {
      expect(sibling.lastName).toBe(sim.player.lastName);
    }
  });

  it('contains nobody who could not exist', () => {
    for (let i = 0; i < 12; i++) {
      const sim = aLife(`shapes-${i}`);
      const family = familyOf(sim);
      const mine = ageOf(sim);
      for (const parent of family.parents) {
        const gap = ageOf(sim, parent) - mine;
        expect(gap, parent.displayName).toBeGreaterThanOrEqual(18);
        expect(gap, parent.displayName).toBeLessThanOrEqual(52);
      }
      for (const sibling of family.siblings) {
        for (const parent of family.parents) {
          const atTheirBirth = ageOf(sim, parent) - ageOf(sim, sibling);
          // A brother or sister nobody could have had: a parent who was a
          // child at the time, or one well past having them.
          expect(atTheirBirth, `${parent.displayName} / ${sibling.displayName}`).toBeGreaterThanOrEqual(18);
          expect(atTheirBirth, `${parent.displayName} / ${sibling.displayName}`).toBeLessThanOrEqual(52);
        }
      }
      // Nobody is accidentally your twin.
      const ages = family.siblings.map((one) => ageOf(sim, one));
      expect(new Set([...ages, mine]).size).toBe(ages.length + 1);
    }
  });

  it('builds the family once, however many times it is asked to', () => {
    const sim = aLife('once');
    const before = Object.keys(sim.universe.people).length;
    ensureFamily(sim);
    ensureFamily(sim);
    expect(Object.keys(sim.universe.people).length).toBe(before);
    expect(hasFamily(sim, sim.player.id)).toBe(true);
  });

  it('says in one word what somebody is to you', () => {
    const sim = aLife('labels');
    const family = familyOf(sim);
    expect(['Mother', 'Father']).toContain(relationLabel(sim, family.parents[0]!.id));
    if (family.siblings[0]) expect(['Sister', 'Brother']).toContain(relationLabel(sim, family.siblings[0].id));
  });

  it('still lets a life be married and have children of its own', () => {
    const sim = aLife('married');
    // Somebody to marry, met the way anybody is met.
    const them = Object.values(sim.universe.people).find(
      (one: Person) => !one.isPlayer && !familyOf(sim).all.some((f) => f.id === one.id),
    )!;
    const met = sim.execute<{ relationshipId: string }>({ kind: 'rel.meet', payload: { personId: them.id, type: 'dating' } });
    expect(met.ok, met.error).toBe(true);
    // Years of it, rather than a first date: the commands below both weigh
    // how strong the relationship actually is, and they are right to.
    const rel = sim.universe.relationships[met.value!.relationshipId]!;
    Object.assign(rel.dimensions, {
      familiarity: 95, affection: 92, trust: 90, respect: 88, compatibility: 86, commitment: 90, conflict: 4,
    });
    const proposed = sim.execute({ kind: 'rel.propose', payload: { relationshipId: met.value!.relationshipId } });
    expect(proposed.ok, proposed.error).toBe(true);
    const child = sim.execute<{ childId: string }>({
      kind: 'rel.have_child', payload: { partnerRelationshipId: met.value!.relationshipId, method: 'birth' },
    });
    expect(child.ok, child.error).toBe(true);
    expect(familyOf(sim).children.length).toBe(1);
  });
});

describe('where a name comes from', () => {
  it('names a family out of the traditions it came from', () => {
    const sim = quickSave(
      { heritageId: 'korean', parentHeritageIds: ['korean', 'korean'], firstName: 'Test', lastName: 'Park' },
      'korean-family',
    );
    const family = familyOf(sim);
    expect(family.parents.length).toBe(2);
    for (const one of family.all) {
      const from = HERITAGE_BY_ID[one.heritageId!]!;
      expect(from.id).toBe('korean');
      expect([...from.feminine, ...from.masculine]).toContain(one.firstName);
    }
  });

  it('names a family of two traditions out of both of them', () => {
    const sim = quickSave(
      { heritageId: 'northindian', parentHeritageIds: ['northindian', 'irish'], firstName: 'Test', lastName: 'Sharma' },
      'two-traditions',
    );
    const family = familyOf(sim);
    const used = new Set(family.all.map((one) => one.heritageId));
    expect(used.has('northindian') || used.has('irish')).toBe(true);
    for (const one of family.all) expect(['northindian', 'irish']).toContain(one.heritageId);
  });

  it('says which of them is a mother and which a father', () => {
    const sim = aLife('genders');
    const family = familyOf(sim);
    const words = family.parents.map((one) => relationLabel(sim, one.id));
    expect(words).toContain('Mother');
    expect(words).toContain('Father');
    for (const one of family.all) {
      expect(one.gender, one.displayName).toBeDefined();
      expect(['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'])
        .toContain(relationLabel(sim, one.id));
    }
  });

  it('carries names and nothing else on a heritage', () => {
    expect(HERITAGE_NOTE).toMatch(/naming tradition/);
    expect(HERITAGE_NOTE).toMatch(/no attribute/);
    for (const one of HERITAGES) {
      // Anything numeric on a heritage would be an advantage or a penalty
      // attached to where somebody is from, which this must never be.
      for (const value of Object.values(one)) {
        expect(typeof value === 'string' || Array.isArray(value), one.label).toBe(true);
      }
      expect(new Set(one.family).size).toBe(one.family.length);
    }
    expect(HERITAGES.length).toBeGreaterThan(40);
  });
});

describe('the size you end up', () => {
  it('takes the height and weight the player set, and nobody else gets one', () => {
    const sim = quickSave({ adultHeightCm: 193, adultWeightKg: 90 }, 'size');
    expect(sim.player.adultHeightCm).toBe(193);
    expect(sim.player.adultWeightKg).toBe(90);
    expect(heightOf(sim)).toBe(193);
    expect(weightOf(sim)).toBe(90);
    for (const person of Object.values(sim.universe.people)) {
      if (!person.isPlayer) expect(person.adultHeightCm, person.displayName).toBeUndefined();
    }
  });

  it('grows a child to exactly the size they were set, and no further', () => {
    const sim = quickSave({ adultHeightCm: 188, adultWeightKg: 84 }, 'growing');
    let last = 0;
    for (let age = 0; age <= 30; age++) {
      sim.player.birthInstant = sim.now - Math.round((age + 0.2) * YEAR);
      const tall = heightOf(sim);
      expect(tall, `${age}`).toBeGreaterThanOrEqual(last);
      last = tall;
      if (age >= FULLY_GROWN) {
        expect(tall).toBe(188);
        expect(weightOf(sim)).toBe(84);
        expect(fullyGrown(sim)).toBe(true);
      } else {
        expect(tall).toBeLessThan(188);
        expect(fullyGrown(sim)).toBe(false);
        expect(describeSize(sim)).toMatch(/Still growing/);
      }
    }
  });

  it('says a size in both the ways people say it', () => {
    expect(describeHeight(183)).toBe('183 cm (6 ft 0 in)');
    expect(describeWeight(80)).toMatch(/80 kg \(17\d lb\)/);
  });

  it('keeps to one growth curve and says that is what it is doing', () => {
    expect(GROWTH_NOTE).toMatch(/one curve/);
    expect(GROWTH_NOTE).toMatch(/pronoun/);
    expect(GROWTH_NOTE).toMatch(/no part of it is medical/);
  });
});

describe('what age lets you do', () => {
  it('applies the rule of the country you are standing in, not the one you are from', () => {
    const nineteen = () => aLife('gates', 19);
    expect(mayI(standingIn(nineteen(), 'us-ca-losangeles'), 'drink').ok).toBe(false);
    expect(mayI(standingIn(nineteen(), 'de-be-berlin'), 'drink').ok).toBe(true);
    expect(mayI(standingIn(nineteen(), 'jp-13-tokyo'), 'drink').ok).toBe(false);
    // And the same person can drive in all three.
    for (const city of ['us-ca-losangeles', 'de-be-berlin', 'jp-13-tokyo']) {
      expect(mayI(standingIn(nineteen(), city), 'drive').ok, city).toBe(true);
    }
  });

  it('says no in words somebody could argue with', () => {
    const sim = standingIn(aLife('refusal', 19), 'us-ca-losangeles');
    const answer = mayI(sim, 'drink');
    expect(answer.ok).toBe(false);
    expect(answer.reason).toContain('United States');
    expect(answer.reason).toContain('21');
    expect(answer.reason).toContain('19');
    expect(answer.countryId).toBe('us');
    expect(answer.countrys).toBe(true);
  });

  it('says a prohibition is a prohibition rather than quoting an age', () => {
    const sim = standingIn(aLife('dry', 40), 'sa-10-riyadh');
    const answer = mayI(sim, 'drink');
    expect(answer.ok).toBe(false);
    expect(answer.age).toBeUndefined();
    expect(answer.reason).toMatch(/at any age/);
    expect(NO_DRINKING.has('sa')).toBe(true);
  });

  it('lists only the countries whose rule differs from the world default', () => {
    for (const [countryId, gates] of Object.entries(COUNTRY_GATES)) {
      for (const [gate, age] of Object.entries(gates)) {
        expect(age, `${countryId} ${gate}`).not.toBe(DEFAULT_GATES[gate as keyof typeof DEFAULT_GATES]);
      }
    }
  });

  it('shuts the doors a child cannot walk through, and opens them later', () => {
    // Actually twelve when the save was made, rather than a grown character
    // whose birthday was moved: papers and everything else are issued at
    // creation, off the age the character really was.
    const child = standingIn(
      quickSave({ wealth: 'wealthy', birthYear: 2014 }, 'child-start'), 'us-ca-losangeles',
    );
    expect(ageOf(child)).toBeLessThan(13);
    for (const kind of ['veh.purchase', 'prop.rent', 'doc.apply_license', 'bank.open']) {
      const res = child.execute({ kind, payload: {} });
      expect(res.ok, kind).toBe(false);
      // Either the national gate or, for a license, the actual office's own
      // rule, which knows more than the national one does.
      expect(res.error, kind).toMatch(/not old enough|no lender|nobody will|licenses drivers from/i);
    }
    // The same commands stop refusing on age once the age is there. They may
    // still refuse for their own reasons, which is a different sentence.
    const grown = standingIn(aLife('grown', 34), 'us-ca-losangeles');
    for (const kind of ['veh.purchase', 'prop.rent', 'doc.apply_license', 'bank.open']) {
      const res = grown.execute({ kind, payload: {} });
      expect(res.error ?? '', kind).not.toMatch(/not old enough|licenses drivers from/i);
    }
  });

  it('puts an age on a bar door and not on a cafe one', () => {
    const sim = standingIn(aLife('bar', 16), 'us-ca-losangeles');
    const answer = mayI(sim, 'drink');
    expect(answer.ok).toBe(false);
    expect(gatesFor(sim).find((one) => one.gate === 'drink')?.answer.ok).toBe(false);
    expect(gatesFor(sim).find((one) => one.gate === 'work')?.answer.ok).toBe(true);
  });
});

describe('the years going past', () => {
  it('has a birthday once a year, every year, with the right number on it', () => {
    const sim = aLife('birthdays');
    const start = ageOf(sim);
    for (let year = 1; year <= 12; year++) sim.advanceTo(sim.now + Math.round(YEAR));
    const turned = Object.values(sim.universe.history ?? {})
      .filter((one) => /^Turned /.test(one.title ?? ''))
      .map((one) => Number(one.title!.split(' ')[1]));
    expect(turned.length).toBe(12);
    expect(new Set(turned).size).toBe(12);
    expect(Math.min(...turned)).toBe(start + 1);
    expect(Math.max(...turned)).toBe(ageOf(sim));
  });

  it('ends the generation above you, once each, and says what they were to you', () => {
    const sim = aLife('passing');
    const family = familyOf(sim);
    for (const one of [...family.parents, ...family.siblings]) {
      expect(one.aliveUntil, one.displayName).toBeDefined();
    }
    for (let decade = 1; decade <= 7; decade++) sim.advanceTo(sim.now + Math.round(10 * YEAR));
    const gone = [...family.parents, ...family.siblings].filter((one) => !isAlive(one, sim.now));
    expect(gone.length).toBeGreaterThan(0);

    const deaths = Object.values(sim.universe.history ?? {}).filter((one) => / Died$/.test(one.title ?? ''));
    for (const death of deaths) {
      expect(death.detail).toMatch(/Your (mother|father|sister|brother)/);
    }
    // Nobody is buried twice, however far the world runs on.
    const names = deaths.map((one) => one.title);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('what a character could not know', () => {
  it('never gives the player a last day of their own', () => {
    const sim = aLife('mortal');
    expect(sim.player.aliveUntil).toBeUndefined();
    for (let decade = 1; decade <= 4; decade++) sim.advanceTo(sim.now + Math.round(10 * YEAR));
    expect(sim.player.aliveUntil).toBeUndefined();
  });

  it('puts no date on anything the player reads', () => {
    const sim = aLife('opaque');
    const read = [
      describeYears(sim),
      stageOf(sim).about,
      ...gatesFor(sim).map((one) => one.answer.reason),
      ...LIFE_STAGES.map((one) => one.about),
    ].join(' ');
    expect(read).not.toMatch(/\b(19|20|21)\d\d\b/);
  });

  it('never names on the calendar who a scheduled day is going to take', () => {
    const sim = aLife('calendar-quiet');
    const family = familyOf(sim);
    const ahead = sim.timeline.between(sim.now, sim.now + 80 * 365 * MS_DAY)
      .filter((item) => item.kind === 'life.passing');
    expect(ahead.length).toBeGreaterThan(0);
    for (const item of ahead) {
      for (const one of [...family.parents, ...family.siblings]) {
        expect(item.label).not.toContain(one.displayName);
        expect(item.label).not.toContain(one.firstName);
      }
    }
  });

  it('reports somebody who has died with an age, never a cause it invented', () => {
    const sim = aLife('obituary');
    const family = familyOf(sim);
    for (let decade = 1; decade <= 7; decade++) sim.advanceTo(sim.now + Math.round(10 * YEAR));
    const gone = [...family.parents, ...family.siblings].find((one) => !isAlive(one, sim.now));
    if (!gone) return;
    expect(ageAt(sim, gone, gone.aliveUntil!)).toBeGreaterThan(40);
    const death = Object.values(sim.universe.history ?? {}).find((one) => one.title === `${gone.displayName} Died`);
    if (death) expect(death.detail).not.toMatch(/cancer|heart attack|accident|crash|murder/i);
  });
});
