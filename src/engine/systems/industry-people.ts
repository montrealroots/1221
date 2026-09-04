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
 * Most of them are generated people. None of those is a real director, and
 * nothing in the game should ever present one as one — they have invented
 * names and no record behind them.
 *
 * Some of them are not generated. A production the world is making can reach
 * for somebody off the roster the same way the player can, because an industry
 * where only the player can hire a name is not an industry. Anybody who comes
 * in that way carries their `recordQid`, which is what every screen reads to
 * keep the two apart: their filmography and their awards are the public
 * record; the picture they took in your save is your save's, and is labelled
 * as such wherever it is shown.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Person, Project } from '../domain/model';
import type { Rng } from '../core/rng';
import { clamp } from '../core/rng';
import { MS_DAY } from '../core/time';
import { generatePersonName } from '../content/names';
import { isPeopleLoaded, peopleInRole } from '../content/people';
import { countryIdForRecord, ensureRealPerson, personForRecord } from './real-people';
import type { CraftRole } from '../content/craft-attributes';

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

/**
 * How many unfinished pictures one person can be on at once.
 *
 * A director shoots one thing at a time and preps the next; a producer can
 * genuinely have several going, which is what a producer is. Whoever is at the
 * cap is not offered the next job, which is what keeps a working pool working
 * rather than a handful of names carrying the entire country's slate.
 */
const AT_ONCE: Readonly<Record<CrewRole, number>> = {
  director: 2, showrunner: 2, writer: 3, producer: 4,
};

/**
 * Who is already carrying a full plate, counted in one pass over the slate
 * rather than once per candidate — that scan is quadratic over a long career,
 * and this runs every time the world commissions anything.
 */
function bookedSolid(sim: Simulation, role: CrewRole): Set<Id> {
  const load = new Map<Id, number>();
  const add = (id: Id | undefined) => {
    if (!id) return;
    load.set(id, (load.get(id) ?? 0) + 1);
  };
  for (const project of Object.values(sim.universe.projects)) {
    if (project.phase === 'released' || project.phase === 'library' || project.phase === 'shelved') continue;
    if (role === 'director') add(project.directorId);
    else if (role === 'showrunner') add(project.showrunnerId);
    else if (role === 'writer') for (const id of project.writerIds) add(id);
    else for (const id of project.producerIds) add(id);
  }
  const busy = new Set<Id>();
  for (const [id, count] of load) if (count >= AT_ONCE[role]) busy.add(id);
  return busy;
}

function crewPool(sim: Simulation, role: CrewRole, countryId: string, busy: Set<Id>): Person[] {
  return Object.values(sim.universe.people).filter(
    (p) => !p.isPlayer && p.industryRole === role && p.citizenshipId === countryId
      && !p.aliveUntil && !busy.has(p.id),
  );
}

/**
 * How often a production the world is making goes to somebody off the roster
 * rather than inventing a name. A real name is meant to be an event — you see
 * one on a breakdown and it means something — so it is the exception.
 *
 * There is no writers' craft on the roster, so a writer is always invented.
 */
const REAL_NAME_CHANCE: Readonly<Record<CrewRole, number>> = {
  director: 0.26, showrunner: 0.22, producer: 0.14, writer: 0,
};

/**
 * Somebody real who does this job in this country and is not already booked
 * solid, or nothing when the roster has nobody who fits.
 */
function realCrewPerson(sim: Simulation, role: CrewRole, countryId: string, rng: Rng, busy: Set<Id>): Person | undefined {
  if (role === 'writer' || !isPeopleLoaded()) return undefined;
  const craft: CraftRole = role === 'showrunner' ? 'showrunner' : role === 'director' ? 'director' : 'producer';

  const candidates = peopleInRole(craft).filter((record) => {
    if (countryIdForRecord(record) !== countryId) return false;
    const already = personForRecord(sim, record.qid);
    return !already || !busy.has(already.id);
  });
  if (candidates.length === 0) return undefined;

  // The busiest people get the most work, which is what makes them the busiest.
  const weights = candidates.map((record) => 1 + (record.creditCount || 1));
  let roll = rng.float(0, weights.reduce((a, b) => a + b, 0));
  let chosen = candidates[candidates.length - 1]!;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) { chosen = candidates[i]!; break; }
  }
  return ensureRealPerson(sim, chosen.qid);
}

/** Somebody who does this job in this country: usually one who already does. */
export function ensureCrewPerson(sim: Simulation, role: CrewRole, countryId: string, cityId: string, rng: Rng): Person {
  // Nobody with a full plate is offered the next job, real or invented. It is
  // the difference between a country with an industry and a country with four
  // people in it directing everything.
  const busy = bookedSolid(sim, role);
  const pool = crewPool(sim, role, countryId, busy);
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

  // Nobody in the pool this time. Sometimes that is because the job went to
  // somebody the player has heard of.
  if (rng.chance(REAL_NAME_CHANCE[role])) {
    const real = realCrewPerson(sim, role, countryId, rng, busy);
    if (real) return real;
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
    wellbeing: { energy: 68, stress: 52, sleepDebt: 6, morale: 66, condition: 72, fitness: 52, travelFatigue: 12, nourishment: 70, hygiene: 80 },
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
