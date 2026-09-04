/**
 * SLATE — The people who make the world's films.
 *
 * A production the world commissioned is not made by nobody. It has a director,
 * it has producers, and if it is television it has a showrunner. This keeps a
 * working pool of them per country and reuses it hard, because that is how an
 * industry actually looks: a few hundred people who keep turning up, not a new
 * name for every title. Reuse is what lets the player recognise a name on a
 * breakdown, and what makes "the one who made that other thing" mean something.
 *
 * They are generated people. None of them is a real director, and nothing in
 * the game should ever present them as one.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Person, Project } from '../domain/model';
import type { Rng } from '../core/rng';
import { clamp } from '../core/rng';
import { MS_DAY } from '../core/time';
import { generatePersonName } from '../content/names';

export type CrewRole = 'director' | 'producer' | 'writer' | 'showrunner';

const CREW_LABEL: Readonly<Record<CrewRole, string>> = {
  director: 'director', producer: 'producer', writer: 'writer', showrunner: 'showrunner',
};

/**
 * How readily a country reuses somebody it already has. The pool grows to a
 * working size and then mostly stops growing, which is the difference between
 * an industry and a phone book.
 */
function reuseChance(poolSize: number): number {
  return Math.min(poolSize / (poolSize + 3.5), 0.93);
}

function crewPool(sim: Simulation, role: CrewRole, countryId: string): Person[] {
  return Object.values(sim.universe.people).filter(
    (p) => !p.isPlayer && p.industryRole === role && p.citizenshipId === countryId && !p.aliveUntil,
  );
}

/** Somebody who does this job in this country: usually one who already does. */
export function ensureCrewPerson(sim: Simulation, role: CrewRole, countryId: string, cityId: string, rng: Rng): Person {
  const pool = crewPool(sim, role, countryId);
  if (pool.length > 0 && rng.chance(reuseChance(pool.length))) {
    // Weighted to the ones who are working: standing is what gets you the job.
    const weights = pool.map((p) => 8 + p.reputation.professionalReputation);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng.float(0, total);
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) return pool[i]!;
    }
    return pool[pool.length - 1]!;
  }

  const name = generatePersonName(rng);
  const standing = clamp(Math.round(rng.normal(46, 17)), 8, 92);
  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName: name.first, lastName: name.last, displayName: `${name.first} ${name.last}`,
    pronouns: 'they/them',
    birthInstant: sim.now - rng.int(role === 'showrunner' ? 36 : 30, 68) * 365 * MS_DAY,
    homeRegionId: cityId, citizenshipId: countryId, currentLocationId: cityId,
    personality: {
      openness: rng.int(45, 95), conscientiousness: rng.int(40, 92), extraversion: rng.int(25, 88),
      agreeableness: rng.int(20, 85), emotionalStability: rng.int(25, 88),
      ambition: rng.int(55, 98), riskTolerance: rng.int(30, 90),
    },
    interests: [], goals: [], lifestyle: 'comfortable', background: `Works as a ${CREW_LABEL[role]}.`,
    attributes: {}, traits: [],
    skills: {},
    wellbeing: { energy: 68, stress: 52, sleepDebt: 6, morale: 66, condition: 72, fitness: 52, travelFatigue: 12, nourishment: 70 },
    reputation: {
      publicFame: clamp(Math.round(standing * 0.4 + rng.normal(0, 8)), 0, 92),
      audienceAppeal: 50, professionalReputation: standing, reliability: clamp(Math.round(rng.normal(70, 12)), 20, 99),
      prestige: clamp(Math.round(standing * 0.8 + rng.normal(0, 10)), 0, 96), industryDemand: standing, controversy: 0,
    },
    careerTrack: role === 'showrunner' ? 'showrunner' : role,
    representation: {}, quote: 0,
    creditIds: [], nominationIds: [], creditScore: 720,
    tier: 'background', industryRole: role,
    greenlightAuthority: role === 'producer' ? 25 : 0,
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
}

/**
 * Puts a crew on a production the world is making, and writes the billing so
 * it reads correctly forever — the credit is permanent even after the world
 * stops individually simulating whoever it names.
 */
export function attachWorldCrew(sim: Simulation, project: Project, countryId: string, rng: Rng): void {
  const cityId = project.productionLocationIds[0] ?? sim.player.currentLocationId;
  const television = project.format === 'series' || project.format === 'limited_series';

  const credit = (person: Person, role: string): void => {
    if (project.credits.some((c) => c.personId === person.id && c.role === role)) return;
    project.credits.push({ personId: person.id, name: person.displayName, role });
    project.attachments.push({ personId: person.id, role, attachedAt: sim.now, confirmed: true });
  };

  const director = ensureCrewPerson(sim, 'director', countryId, cityId, rng);
  project.directorId = director.id;
  credit(director, 'director');

  const writer = rng.chance(0.45)
    ? director
    : ensureCrewPerson(sim, 'writer', countryId, cityId, rng);
  if (!project.writerIds.includes(writer.id)) project.writerIds.push(writer.id);
  credit(writer, 'writer');

  const producerCount = television ? rng.int(1, 2) : rng.int(1, 3);
  for (let i = 0; i < producerCount; i++) {
    const producer = ensureCrewPerson(sim, 'producer', countryId, cityId, rng);
    if (project.producerIds.includes(producer.id)) continue;
    project.producerIds.push(producer.id);
    credit(producer, 'producer');
  }

  if (television) {
    const showrunner = rng.chance(0.4) ? writer : ensureCrewPerson(sim, 'showrunner', countryId, cityId, rng);
    project.showrunnerId = showrunner.id;
    credit(showrunner, 'showrunner');
  }
}

/** What else this person has on the record in this save, most recent first. */
export function otherWorkOf(sim: Simulation, personId: Id, exceptProjectId?: Id): Project[] {
  return Object.values(sim.universe.projects)
    .filter((p) => p.id !== exceptProjectId
      && (p.directorId === personId || p.producerIds.includes(personId) || p.showrunnerId === personId || p.writerIds.includes(personId)))
    .sort((a, b) => (b.releaseDate ?? b.createdAt) - (a.releaseDate ?? a.createdAt));
}

/** How somebody is credited on a project, in the words a billing block uses. */
export function creditRoleOf(project: Project, personId: Id): string | undefined {
  if (project.directorId === personId) return 'Director';
  if (project.showrunnerId === personId) return 'Showrunner';
  if (project.writerIds.includes(personId)) return 'Writer';
  if (project.producerIds.includes(personId)) return 'Producer';
  const credit = project.credits.find((c) => c.personId === personId);
  return credit ? credit.role : undefined;
}
