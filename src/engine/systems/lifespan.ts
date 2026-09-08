/**
 * SLATE — the whole span.
 *
 * A life that started before the save did and runs on past whatever the
 * player is busy with. Four things live here:
 *
 *   - The family you were born into. Two people who raised you and however
 *     many brothers and sisters, generated once from the seed, aged the way
 *     a real family is aged, and living where families live.
 *   - Birthdays that happen. The number turns over, the year costs something,
 *     and the people close to you notice.
 *   - Ageing, as a ceiling rather than a cliff. What your best day looks like
 *     falls slowly and continuously, and nothing changes overnight.
 *   - The generation above you reaching its end.
 *
 * What this must never do is tell the player when they are going to die, or
 * when anybody else is. A character knows roughly how long people live where
 * they are from, the way anybody does. The date itself is not something a
 * person could know, so it is never on screen and never in a payload the
 * screen can reach.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Person, RelationshipDimensions } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import {
  MS_DAY, addDays, addYears, formatDate, nextAnniversary, zonedParts,
} from '../core/time';
import { plural } from '../core/text';
import { generatePersonName } from '../content/names';
import type { Rng } from '../core/rng';
import {
  DEFAULT_HERITAGE, HERITAGE_BY_ID, type Heritage,
} from '../content/heritage';

/** Which of the family words somebody gets. */
export type Gender = 'female' | 'male' | 'nonbinary';
import { CITIES, COUNTRIES, countryOfCity } from '../content/geography';
import {
  BIRTHDAY_LINES, FAMILY_START, MILESTONE_AGES, MILESTONE_LINES, MOURNING_DAYS,
  MOVED_AWAY, PARENTS_STILL_TOGETHER, PARENT_AGE_GAP, PARTNER_AGE_GAP, PASSING_LINES,
  SIBLING_AGE_GAP, SIBLING_WEIGHTS, type AgingBand, type GateId, type LifeStage,
  GATES, GATE_BY_ID, NO_DRINKING, agingAt, ceilingAt, expectancyIn, gateAgeIn, gateIsCountrys,
  DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG, FULLY_GROWN, adultExpectancyIn, describeHeight,
  describeWeight, heightAtAge, pensionAgeIn, stageAt, weightAtAge,
} from '../content/lifespan';
import { addMemory, createRelationship, relationshipsOf, otherParty } from './relationships';

const YEAR_MS = 365.25 * MS_DAY;

// ---------------------------------------------------------------------------
// How old, and which part of a life
// ---------------------------------------------------------------------------

/**
 * Whole years between two instants, by the calendar.
 *
 * Not by dividing milliseconds: a year is not 365.25 days long, and a life
 * measured that way is a day short every fourth year, which is exactly often
 * enough to report the wrong age on somebody's own birthday.
 */
export function yearsBetween(from: Instant, to: Instant, zone: string): number {
  const a = zonedParts(from, zone);
  const b = zonedParts(to, zone);
  let years = b.year - a.year;
  if (b.month < a.month || (b.month === a.month && b.day < a.day)) years -= 1;
  return Math.max(0, years);
}

/** How old somebody is, in whole years. The one place that works it out. */
export function ageOf(sim: Simulation, person: Person = sim.player): number {
  return yearsBetween(person.birthInstant, sim.now, sim.homeZone);
}

/** How old somebody was on a given day. */
export function ageAt(sim: Simulation, person: Person, at: Instant): number {
  return yearsBetween(person.birthInstant, at, sim.homeZone);
}

/** Whether somebody is still alive at this instant. */
export function isAlive(person: Person, now: Instant): boolean {
  return person.aliveUntil === undefined || person.aliveUntil > now;
}

/** Which part of a life this is. */
export function stageOf(sim: Simulation, person: Person = sim.player): LifeStage {
  return stageAt(ageOf(sim, person));
}

/** What a year is costing at this age. */
export function agingOf(sim: Simulation, person: Person = sim.player): AgingBand {
  return agingAt(ageOf(sim, person));
}

/** The most this body can be brought to, out of a hundred. */
export function ceilingOf(sim: Simulation, person: Person = sim.player): { fitness: number; condition: number } {
  return ceilingAt(ageOf(sim, person));
}

/**
 * How long people live where this person is from. Public knowledge, not a forecast.
 *
 * The at-birth figure, which is the one that gets published and the one a
 * person would have heard. What a grown adult should actually expect is the
 * one below, and it is the one the world uses when it decides anything.
 */
export function expectancyFor(person: Person): number {
  return expectancyIn(person.citizenshipId);
}

/** How long somebody already grown up can expect to live. */
export function adultExpectancyFor(person: Person): number {
  return adultExpectancyIn(person.citizenshipId);
}

/** The age the state expects them to stop working at. */
export function pensionAgeFor(person: Person): number {
  return pensionAgeIn(person.citizenshipId);
}

/** How many years until the pension age, or none if it has passed. */
export function yearsToPension(sim: Simulation, person: Person = sim.player): number {
  return Math.max(0, pensionAgeFor(person) - ageOf(sim, person));
}

/**
 * How a life reads from inside it.
 *
 * What a person could honestly say about their own age: how old they are,
 * which part of a life this is, and what people around here generally manage.
 * Never a date, never a countdown, and never a number attached to them.
 */
export function describeYears(sim: Simulation, person: Person = sim.player): string {
  const age = ageOf(sim, person);
  const stage = stageAt(age);
  const usual = adultExpectancyFor(person);
  const where = CITIES.get(person.homeRegionId)?.name;
  const around = where ? `Around ${where.split(',')[0]}` : 'Where you are from';
  return `${plural(age, 'year')} old. ${stage.label}: ${stage.about.toLowerCase()} `
    + `${around}, somebody who has got this far generally sees about ${usual}.`;
}


// ---------------------------------------------------------------------------
// What age lets you do
// ---------------------------------------------------------------------------

export interface GateAnswer {
  ok: boolean;
  /** The age the rule sets, or none where the thing is not allowed at all. */
  age?: number;
  /** The country whose rule was applied. */
  countryId: string;
  /** Whether that country sets its own rule, or SLATE used the world default. */
  countrys: boolean;
  /** What to say when the answer is no. Empty when it is yes. */
  reason: string;
}

/**
 * Whether somebody of this age may do this here.
 *
 * The rule is the one where you are standing, not the one on your passport,
 * because that is how it works at a counter: a twenty year old American in
 * Berlin is served, and an eighteen year old German in Chicago is not. The
 * answer always names the country whose rule it applied, so the refusal is
 * something a person could argue with rather than a locked door.
 */
export function mayI(sim: Simulation, gate: GateId, person: Person = sim.player): GateAnswer {
  const countryId = countryOfCity(person.currentLocationId)
    ?? countryOfCity(person.homeRegionId)
    ?? person.citizenshipId;
  const age = ageOf(sim, person);

  if (gate === 'drink' && NO_DRINKING.has(countryId)) {
    return {
      ok: false,
      countryId,
      countrys: true,
      reason: 'Alcohol is not sold here, to anybody, at any age.',
    };
  }

  const set = gateAgeIn(countryId, gate);
  if (age >= set) return { ok: true, age: set, countryId, countrys: gateIsCountrys(countryId, gate), reason: '' };

  const where = COUNTRIES.get(countryId)?.name ?? 'here';
  const gap = set - age;
  return {
    ok: false,
    age: set,
    countryId,
    countrys: gateIsCountrys(countryId, gate),
    reason: `${GATE_BY_ID[gate]?.refusal ?? 'Not at your age.'} `
      + `${where} sets it at ${set}, and you are ${age}. ${plural(gap, 'year')} to go.`,
  };
}

/** The same answer, thrown as a refusal a command can raise. */
export function requireAge(sim: Simulation, gate: GateId, person: Person = sim.player): void {
  const answer = mayI(sim, gate, person);
  if (!answer.ok) throw new CommandError(answer.reason);
}

/** Every gate at once, for a screen that wants to show what is open to you. */
export function gatesFor(sim: Simulation, person: Person = sim.player): { gate: GateId; label: string; answer: GateAnswer }[] {
  return GATES.map((one) => ({ gate: one.id, label: one.label, answer: mayI(sim, one.id, person) }));
}


// ---------------------------------------------------------------------------
// The size you are, on the way to the size you end up
// ---------------------------------------------------------------------------

/** The height this body ends up at. The player's own choice, where they made one. */
export function adultHeightOf(person: Person): number {
  return person.adultHeightCm ?? DEFAULT_HEIGHT_CM;
}

/** The weight this body ends up at. */
export function adultWeightOf(person: Person): number {
  return person.adultWeightKg ?? DEFAULT_WEIGHT_KG;
}

/** How tall somebody is right now. A child is on the way to their adult height. */
export function heightOf(sim: Simulation, person: Person = sim.player): number {
  return heightAtAge(adultHeightOf(person), ageOf(sim, person));
}

/** What somebody weighs right now. */
export function weightOf(sim: Simulation, person: Person = sim.player): number {
  return weightAtAge(adultWeightOf(person), ageOf(sim, person));
}

/** Whether this body has finished growing. */
export function fullyGrown(sim: Simulation, person: Person = sim.player): boolean {
  return ageOf(sim, person) >= FULLY_GROWN;
}

/** The size in a sentence, and how much of it is still to come. */
export function describeSize(sim: Simulation, person: Person = sim.player): string {
  const now = `${describeHeight(heightOf(sim, person))}, ${describeWeight(weightOf(sim, person))}`;
  if (fullyGrown(sim, person)) return now;
  const left = FULLY_GROWN - ageOf(sim, person);
  return `${now}. Still growing — ${describeHeight(adultHeightOf(person))} by about ${plural(left, 'year')} from now.`;
}

// ---------------------------------------------------------------------------
// The family you were born into
// ---------------------------------------------------------------------------

export interface Family {
  parents: Person[];
  siblings: Person[];
  children: Person[];
  /** Everyone above, alive or not, in the order a person would list them. */
  all: Person[];
}

/** Who this person's family is, from the relationship records rather than a field. */
export function familyOf(sim: Simulation, personId: Id = sim.player.id): Family {
  const parents: Person[] = [];
  const siblings: Person[] = [];
  const children: Person[] = [];
  for (const rel of relationshipsOf(sim, personId)) {
    const other = sim.universe.people[otherParty(rel, personId)];
    if (!other) continue;
    // A parent record is stored from the parent's side, so which way round it
    // reads depends on which of the pair this person is.
    const asSeen = rel.aId === personId ? rel.type : (rel.reciprocalType ?? rel.type);
    if (rel.type === 'sibling') siblings.push(other);
    else if (asSeen === 'child') parents.push(other);
    else if (asSeen === 'parent') children.push(other);
  }
  const byAge = (a: Person, b: Person): number => a.birthInstant - b.birthInstant;
  parents.sort(byAge);
  siblings.sort(byAge);
  children.sort(byAge);
  return { parents, siblings, children, all: [...parents, ...siblings, ...children] };
}

const FAMILY_WORD: Readonly<Record<string, Readonly<Record<Gender, string>>>> = {
  parent: { female: 'Mother', male: 'Father', nonbinary: 'Parent' },
  sibling: { female: 'Sister', male: 'Brother', nonbinary: 'Sibling' },
  child: { female: 'Daughter', male: 'Son', nonbinary: 'Child' },
};

/**
 * What this person is to the player, in the word a person would use.
 *
 * Mother rather than Parent, sister rather than Sibling — because that is
 * what anybody calls them. Somebody whose gender the save does not carry gets
 * the word that does not assume one, rather than a guess.
 */
export function relationLabel(sim: Simulation, personId: Id, ofId: Id = sim.player.id): string {
  const family = familyOf(sim, ofId);
  const who = sim.universe.people[personId];
  const gender: Gender = who?.gender ?? 'nonbinary';
  if (family.parents.some((one) => one.id === personId)) return FAMILY_WORD.parent![gender];
  if (family.siblings.some((one) => one.id === personId)) return FAMILY_WORD.sibling![gender];
  if (family.children.some((one) => one.id === personId)) return FAMILY_WORD.child![gender];
  return 'Family';
}

/** Whether this person already has the family they were born into. */
export function hasFamily(sim: Simulation, personId: Id): boolean {
  const family = familyOf(sim, personId);
  return family.parents.length > 0 || family.siblings.length > 0;
}


/**
 * Write a parent record the right way round.
 *
 * A relationship stores its pair with the lower id first, and `type` reads
 * from that side. Which of a parent and a child has the lower id depends on
 * which was created first, so the direction is set after the record exists
 * rather than assumed before it.
 */
function linkParentChild(sim: Simulation, parent: Person, child: Person, dimensions?: RelationshipDimensions): void {
  const rel = createRelationship(sim, parent.id, child.id, 'parent', {
    dimensions: dimensions ? { ...dimensions } : undefined,
    isPublic: true,
  });
  const parentIsA = rel.aId === parent.id;
  rel.type = parentIsA ? 'parent' : 'child';
  rel.reciprocalType = parentIsA ? 'child' : 'parent';
  rel.since = child.birthInstant;
}

/** A given name from this heritage, for somebody of this gender. */
export function givenNameFrom(heritage: Heritage, gender: Gender, rng: Rng): string {
  const pool = gender === 'female' ? heritage.feminine
    : gender === 'male' ? heritage.masculine
      : [...heritage.feminine, ...heritage.masculine];
  return pool.length > 0 ? rng.pick(pool) : generatePersonName(rng).first;
}

/** A family name from this heritage. */
export function familyNameFrom(heritage: Heritage, rng: Rng): string {
  return heritage.family.length > 0 ? rng.pick(heritage.family) : generatePersonName(rng).last;
}

/** The pronouns that go with a gender, where nobody has said otherwise. */
export function pronounsFor(gender: Gender): string {
  return gender === 'female' ? 'she/her' : gender === 'male' ? 'he/him' : 'they/them';
}

function relative(
  sim: Simulation, of: Person, ageYears: number, lastName: string, cityId: string, seed: string,
  heritage: Heritage, gender: Gender,
): Person {
  const rng = sim.rng('lifespan.person', of.id, seed);
  const first = givenNameFrom(heritage, gender, rng);
  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName: first,
    lastName,
    displayName: `${first} ${lastName}`,
    pronouns: pronounsFor(gender),
    heritageId: heritage.id,
    gender,
    birthInstant: sim.now - Math.round(ageYears * YEAR_MS),
    homeRegionId: cityId,
    citizenshipId: countryOfCity(cityId) ?? of.citizenshipId,
    currentLocationId: cityId,
    personality: {
      openness: rng.int(30, 80), conscientiousness: rng.int(40, 90), extraversion: rng.int(30, 85),
      agreeableness: rng.int(40, 90), emotionalStability: rng.int(40, 88),
      ambition: rng.int(25, 80), riskTolerance: rng.int(20, 70),
    },
    interests: [],
    goals: [],
    lifestyle: 'modest',
    background: '',
    attributes: {},
    traits: [],
    skills: {},
    wellbeing: {
      energy: 74, stress: 24, sleepDebt: 0, morale: 68,
      condition: clamp(Math.round(ceilingAt(ageYears).condition - rng.int(0, 10)), 20, 100),
      fitness: clamp(Math.round(ceilingAt(ageYears).fitness - rng.int(8, 30)), 10, 100),
      travelFatigue: 0, nourishment: 78, hygiene: 82,
    },
    reputation: {
      publicFame: 0, audienceAppeal: 50, professionalReputation: rng.int(35, 70),
      reliability: rng.int(50, 90), prestige: 0, industryDemand: 0, controversy: 0,
    },
    careerTrack: 'civilian',
    representation: {},
    quote: 0,
    creditIds: [],
    nominationIds: [],
    creditScore: 0,
    tier: 'background',
    greenlightAuthority: 0,
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
}

/**
 * Give somebody the family they were born into, once.
 *
 * Two people who raised them and however many brothers and sisters, aged so
 * that nobody is born before their parent and nobody is their own twin by
 * accident. Called on a new life and again on a save that predates this, and
 * it does nothing the second time.
 */
export function ensureFamily(sim: Simulation, person: Person = sim.player): Family {
  if (hasFamily(sim, person.id)) return familyOf(sim, person.id);

  const rng = sim.rng('lifespan.family', person.id);
  const age = ageOf(sim, person);
  const home = person.homeRegionId;
  const country = countryOfCity(home);

  // Somewhere else in the same country, worked out once and only if somebody
  // actually needs one. Scanning the whole world's cities is not free, and
  // most of a family never leaves.
  let othertowns: string[] | undefined;
  const somewhereElse = (): string => {
    if (!othertowns) {
      othertowns = CITIES.all()
        .filter((one) => one.countryId === country && one.id !== home)
        .slice(0, 400)
        .map((one) => one.id);
    }
    return othertowns.length > 0 ? rng.pick(othertowns) : home;
  };
  const familyCity = rng.chance(MOVED_AWAY) ? somewhereElse() : home;

  // How much older a parent is. Most people have their children in their
  // late twenties or early thirties, so this is a curve around that rather
  // than a flat draw between the extremes.
  const gapDraw = (): number => clamp(
    Math.round(rng.normal(30, 5.5)), PARENT_AGE_GAP[0], PARENT_AGE_GAP[1],
  );
  const firstGap = gapDraw();
  const secondGap = clamp(
    firstGap + rng.int(PARTNER_AGE_GAP[0], PARTNER_AGE_GAP[1]),
    PARENT_AGE_GAP[0], PARENT_AGE_GAP[1] + 8,
  );

  // Where the names come from. The character's own heritage, and one for each
  // of the two people who raised them, so a family of two traditions names its
  // children out of both.
  const mine = HERITAGE_BY_ID[person.heritageId ?? ''] ?? HERITAGE_BY_ID[DEFAULT_HERITAGE]!;
  const theirs = (person.parentHeritageIds ?? []).map(
    (id: string) => HERITAGE_BY_ID[id] ?? mine,
  );
  const motherHeritage = theirs[0] ?? mine;
  const fatherHeritage = theirs[1] ?? mine;

  // A mother and a father, because that is what a birth takes, and the game
  // says which is which rather than listing two people called Parent.
  const parents = [
    relative(sim, person, age + firstGap, person.lastName, familyCity, 'parent-1', motherHeritage, 'female'),
    relative(sim, person, age + secondGap, person.lastName, familyCity, 'parent-2', fatherHeritage, 'male'),
  ];
  // One of them usually kept their own name, because families work both ways.
  if (rng.chance(0.55)) {
    const kept = familyNameFrom(motherHeritage, sim.rng('lifespan.maiden', person.id));
    parents[0]!.lastName = kept;
    parents[0]!.displayName = `${parents[0]!.firstName} ${kept}`;
  }

  for (const parent of parents) {
    linkParentChild(sim, parent, person, { ...FAMILY_START.parent } as RelationshipDimensions);
  }
  // The two of them, to each other, however that turned out.
  const together = rng.chance(PARENTS_STILL_TOGETHER);
  const between = createRelationship(sim, parents[0]!.id, parents[1]!.id, together ? 'spouse' : 'ex_partner', {
    isPublic: true,
  });
  between.since = person.birthInstant - Math.round(rng.int(1, 8) * YEAR_MS);
  if (!together) between.endedAt = person.birthInstant + Math.round(rng.int(1, 20) * YEAR_MS);
  // A marriage that produced you has something to remember about it, whether
  // or not it lasted.
  addMemory(sim, between, {
    kind: together ? 'married' : 'separated',
    summary: together
      ? `They married before you were born, and they are still married.`
      : `They married before you were born, and it did not last.`,
    impact: together ? 6 : -6,
    decayDays: 0,
    at: between.since,
  });

  // Brothers and sisters, spaced the way brothers and sisters are.
  const roll = rng.float(0, 1);
  let running = 0;
  let howMany = 0;
  for (const band of SIBLING_WEIGHTS) {
    running += band.weight;
    if (roll <= running) { howMany = band.count; break; }
  }
  const siblings: Person[] = [];
  const usedAges = new Set<number>([age]);
  // A brother or sister has to fit between the two ends of their parents'
  // lives: old enough that the elder parent was not a child, young enough
  // that the younger parent was not past having them.
  const youngestParent = age + Math.min(firstGap, secondGap);
  const eldestParent = age + Math.max(firstGap, secondGap);
  const oldestSibling = Math.max(0, eldestParent - PARENT_AGE_GAP[1]);
  const youngestSibling = Math.max(0, youngestParent - 45);
  for (let i = 0; i < howMany; i++) {
    let theirAge = age;
    let guard = 0;
    while (usedAges.has(theirAge) && guard++ < 20) {
      const gap = rng.int(SIBLING_AGE_GAP[0], SIBLING_AGE_GAP[1]) * (rng.chance(0.5) ? 1 : -1);
      theirAge = clamp(age + gap, youngestSibling, Math.max(youngestSibling, oldestSibling));
    }
    if (usedAges.has(theirAge)) continue;
    usedAges.add(theirAge);
    // Each of them made their own decision about staying or going.
    const theirTown = rng.chance(MOVED_AWAY) ? somewhereElse() : familyCity;
    // Brothers and sisters are named out of the same two traditions the
    // character was, so a family reads as one family.
    const from = rng.chance(0.5) ? motherHeritage : fatherHeritage;
    const theirGender: Gender = rng.chance(0.49) ? 'female' : 'male';
    const sibling = relative(
      sim, person, theirAge, person.lastName, theirTown, `sibling-${i}`, from, theirGender,
    );
    siblings.push(sibling);
    const rel = createRelationship(sim, person.id, sibling.id, 'sibling', {
      dimensions: { ...FAMILY_START.sibling } as RelationshipDimensions,
      isPublic: true,
    });
    rel.reciprocalType = 'sibling';
    rel.since = Math.max(person.birthInstant, sibling.birthInstant);
  }

  // Brothers and sisters know each other too.
  for (let i = 0; i < siblings.length; i++) {
    for (let j = i + 1; j < siblings.length; j++) {
      const rel = createRelationship(sim, siblings[i]!.id, siblings[j]!.id, 'sibling', { isPublic: true });
      rel.reciprocalType = 'sibling';
    }
  }
  // And the people who raised them raised them too.
  for (const parent of parents) {
    for (const sibling of siblings) linkParentChild(sim, parent, sibling);
  }

  for (const one of [...parents, ...siblings]) scheduleTheirEnd(sim, one);
  return familyOf(sim, person.id);
}

// ---------------------------------------------------------------------------
// Birthdays
// ---------------------------------------------------------------------------

/** Put the next birthday on the calendar, if one is not there already. */
export function scheduleBirthday(sim: Simulation, person: Person): void {
  const already = sim.timeline.between(sim.now, addYears(sim.now, 2, sim.homeZone))
    .some((item) => item.kind === 'life.birthday' && (item.payload as { personId?: Id })?.personId === person.id);
  if (already) return;
  const born = zonedParts(person.birthInstant, sim.homeZone);
  sim.schedule({
    at: nextAnniversary(born.month, born.day, addDays(sim.now, 1, sim.homeZone), sim.homeZone),
    kind: 'life.birthday',
    label: person.isPlayer ? 'Your Birthday' : `${person.displayName}'s Birthday`,
    category: 'family',
    payload: { personId: person.id },
    priority: 70,
    refType: 'person', refId: person.id,
  });
}

/**
 * What a birthday costs.
 *
 * The ceiling comes down and the current values are pulled under it. Nothing
 * else changes: a birthday is not an illness, and a body that was in good
 * order the day before is in good order the day after, just with slightly
 * less room at the top than it had.
 */
export function applyYear(sim: Simulation, person: Person): { fitness: number; condition: number } {
  const ceiling = ceilingOf(sim, person);
  person.wellbeing.fitness = clamp(Math.min(person.wellbeing.fitness, ceiling.fitness), 0, 100);
  person.wellbeing.condition = clamp(Math.min(person.wellbeing.condition, ceiling.condition), 0, 100);
  return ceiling;
}

// ---------------------------------------------------------------------------
// The end, for the people above you
// ---------------------------------------------------------------------------

/**
 * When somebody's life ends.
 *
 * Drawn once, from the seed, off how long people live where they are from,
 * with a spread wide enough that the table is a band rather than a date. It
 * is written onto the schedule and never onto anything the screen can read:
 * the player finds out the way anybody finds out, on the day.
 *
 * The player is deliberately not given one here. A life the player is living
 * ends when the game is built to end it, and until then a save does not carry
 * a countdown the player could stumble into.
 */
function scheduleTheirEnd(sim: Simulation, person: Person): void {
  if (person.isPlayer || person.aliveUntil !== undefined) return;
  const rng = sim.rng('lifespan.end', person.id);
  // The adult figure, not the at-birth one. Somebody standing in front of you
  // has already survived the part that makes the published number low.
  const usual = adultExpectancyFor(person);
  // A band, not a number: some people go early and a good many go late.
  const endsAt = clamp(Math.round(rng.normal(usual + 2, 11)), 45, 104);
  const at = person.birthInstant + Math.round(endsAt * YEAR_MS);
  // Somebody already past it lives a little longer rather than dying on load.
  const when = at > sim.now ? at : addYears(sim.now, rng.int(1, 6), sim.homeZone);
  person.aliveUntil = when;
  sim.schedule({
    at: when,
    kind: 'life.passing',
    // The calendar shows a label, so it says nothing about what the day is.
    label: 'A Quiet Day',
    category: 'system',
    payload: { personId: person.id },
    priority: 40,
    requiresPlayer: false,
  });
}

/** How somebody who has died is described, without inventing a cause. */
export function describePassing(sim: Simulation, person: Person): string {
  if (person.aliveUntil === undefined) return '';
  const age = ageAt(sim, person, person.aliveUntil);
  return `${person.displayName}, ${age}. ${formatDate(person.aliveUntil, sim.homeZone)}.`;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export function registerLifespan(sim: Simulation): void {
  sim.onSchedule('life.birthday', (item, s) => {
    const person = s.universe.people[(item.payload as { personId: Id }).personId];
    if (!person || !isAlive(person, s.now)) return;

    const age = ageOf(s, person);
    applyYear(s, person);
    scheduleBirthday(s, person);
    if (!person.isPlayer) return;

    const milestone = MILESTONE_AGES.includes(age);
    const rng = s.rng('lifespan.birthday', person.id, age);
    const line = milestone ? rng.pick(MILESTONE_LINES) : rng.pick(BIRTHDAY_LINES);
    const stage = stageAt(age);
    s.notify({
      title: `You Are ${age}`,
      body: `${stage.label}. ${line}`,
      category: 'family',
      importance: milestone ? 62 : 34,
      route: '/workspace/character',
      refType: 'person', refId: person.id,
    });
    s.remember({
      category: 'life',
      title: `Turned ${age}`,
      detail: line,
      refs: [{ type: 'person', id: person.id }],
      significance: milestone ? 6 : 2,
      public: milestone,
    });
    s.emit('life.birthday', { personId: person.id, age, milestone });
  });

  sim.onSchedule('life.passing', (item, s) => {
    const person = s.universe.people[(item.payload as { personId: Id }).personId];
    if (!person || person.isPlayer) return;
    // Somebody whose day was moved on is not buried twice.
    if (person.aliveUntil !== undefined && person.aliveUntil > s.now) return;
    person.aliveUntil = Math.min(person.aliveUntil ?? s.now, s.now);
    person.tier = 'dormant';

    const rel = relationshipsOf(s, s.player.id).find((one) => otherParty(one, s.player.id) === person.id);
    if (!rel) { s.emit('life.passed', { personId: person.id }); return; }
    const how = s.rng('lifespan.passing', person.id).pick(PASSING_LINES);
    const age = ageOf(s, person);
    const what = relationLabel(s, person.id).toLowerCase();

    rel.endedAt = s.now;
    rel.endReason = 'died';
    s.notify({
      title: `${person.displayName} Has Died`,
      body: `Your ${what}, ${age}. ${how}`,
      category: 'family',
      importance: 92,
      route: '/workspace/relationships',
      refType: 'person', refId: person.id,
    });
    s.remember({
      category: 'family',
      title: `${person.displayName} died`,
      detail: `Your ${what}, ${age}. ${how}`,
      refs: [{ type: 'person', id: person.id }],
      significance: 9,
      public: false,
    });
    s.player.wellbeing.morale = clamp(s.player.wellbeing.morale - 22, 0, 100);
    s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + 18, 0, 100);
    s.emit('life.passed', { personId: person.id, age, mourningUntil: addDays(s.now, MOURNING_DAYS, s.homeZone) });
  });
}

export { AGING, LIFE_STAGES } from '../content/lifespan';
