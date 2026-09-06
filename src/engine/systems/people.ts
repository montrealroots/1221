/**
 * The people a place makes.
 *
 * A gym has trainers, a dealership has somebody on the floor, a surgery has
 * a receptionist: background people who exist because the player walked in,
 * are made once, keyed to the place, and stay. They are made by a command,
 * never by a view, so a screen that is only looked at never changes the
 * world.
 */

import type { Simulation } from '../core/simulation';
import type { Rng } from '../core/rng';
import { MS_DAY } from '../core/time';
import type { Person } from '../domain/model';
import { countryOfCity } from '../domain/citizenship';
import { generatePersonName } from '../content/names';

export interface BackgroundPersonSpec {
  /** Where the seed comes from; the same key and index always make the same person. */
  rng: Rng;
  /** `trainer:<placeId>`, `sales:<placeId>` — the group they are found by. */
  archetype: string;
  industryRole: string;
  cityId: string;
  /** One line on what they do, shown in a dossier. */
  background: string;
  interests: string[];
  skills: Record<string, number>;
  age?: [number, number];
  personality?: Partial<Person['personality']>;
  lifestyle?: Person['lifestyle'];
}

/** Everyone made for a place, by the archetype they were made under. */
export function peopleOf(sim: Simulation, archetype: string): Person[] {
  return Object.values(sim.universe.people).filter((p) => p.archetype === archetype);
}

/** Make one background person and put them in the world. */
export function makeBackgroundPerson(sim: Simulation, spec: BackgroundPersonSpec): Person {
  const { rng } = spec;
  const name = generatePersonName(rng);
  const [youngest, oldest] = spec.age ?? [26, 52];
  const age = rng.int(youngest, oldest);
  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName: name.first,
    lastName: name.last,
    displayName: `${name.first} ${name.last}`,
    pronouns: rng.pick(['she/her', 'he/him', 'they/them']),
    birthInstant: sim.now - Math.round(age * 365.25 * MS_DAY),
    homeRegionId: spec.cityId,
    citizenshipId: countryOfCity(spec.cityId) ?? 'us',
    currentLocationId: spec.cityId,
    personality: {
      openness: rng.int(35, 80), conscientiousness: rng.int(50, 90), extraversion: rng.int(45, 90),
      agreeableness: rng.int(40, 85), emotionalStability: rng.int(45, 90), ambition: rng.int(35, 85), riskTolerance: rng.int(25, 70),
      ...spec.personality,
    },
    interests: spec.interests,
    goals: [],
    lifestyle: spec.lifestyle ?? 'modest',
    background: spec.background,
    attributes: {},
    traits: [],
    skills: spec.skills,
    wellbeing: { energy: 80, stress: 20, sleepDebt: 0, morale: 70, condition: 85, fitness: rng.int(40, 80), travelFatigue: 0, nourishment: 80, hygiene: 85 },
    reputation: { publicFame: 0, audienceAppeal: 50, professionalReputation: rng.int(40, 80), reliability: rng.int(55, 95), prestige: 0, industryDemand: 0, controversy: 0 },
    careerTrack: 'civilian',
    representation: {},
    quote: 0,
    creditIds: [],
    nominationIds: [],
    creditScore: 0,
    tier: 'background',
    archetype: spec.archetype,
    industryRole: spec.industryRole,
    greenlightAuthority: 0,
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
}
