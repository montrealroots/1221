/**
 * SLATE — the talent layer of the production rebuild.
 *
 * A casting row needs more than a name and three audition numbers. This module
 * turns the people already living in a save into production-facing talent
 * profiles: career history, compensation, availability, acting strengths and
 * the reputation figures producers actually care about.
 *
 * It is intentionally a projection over the existing save while the production
 * rebuild is in flight. No duplicate "talent database" is persisted, so a
 * person's profile cannot drift away from the contracts, projects and career
 * state that created it.
 */

import type { Simulation } from '../core/simulation';
import { zonedParts, type Instant } from '../core/time';
import { ATTRIBUTES, overallRating, rate } from '../domain/attributes';
import type { Audition, Person } from '../domain/model';
import type { Project, Role, Seat } from '../domain/company';
import { AXES, sizeById, type AxisId } from '../content/casting';
import { CITIES } from '../content/geography';
import {
  datesFor,
  freeToWork,
  quoteOf,
  readOf,
  roleOn,
} from '../world/casting';

export type TalentSource = 'studio_project' | 'external_booking';

export interface TalentSkill {
  id: string;
  name: string;
  group: string;
  value: number;
}

export interface TalentAxis {
  id: AxisId;
  label: string;
  value: number;
}

export interface TalentEngagement {
  id: string;
  source: TalentSource;
  personId: string;
  title: string;
  projectId?: string;
  roleId?: string;
  role: string;
  sizeId: string;
  size: string;
  feeCents: number;
  from?: Instant;
  to?: Instant;
  signedAt?: Instant;
  releasedAt?: Instant;
  completed: boolean;
  active: boolean;
}

export interface TalentCompensation {
  knownCareerCents: number;
  highestFeeCents: number;
  latestFeeCents: number;
  latestFeeAt?: Instant;
}

export interface TalentProfile {
  person: Person;
  age: number;
  location: string;
  profession: Person['careerTrack'];
  actingRating: number;
  axes: TalentAxis[];
  topSkills: TalentSkill[];
  engagements: TalentEngagement[];
  credits: TalentEngagement[];
  commitments: TalentEngagement[];
  compensation: TalentCompensation;
  currentQuoteCents: Partial<Record<'lead' | 'support' | 'guest' | 'day', number>>;
}

export interface TalentSearch {
  query?: string;
  profession?: Person['careerTrack'];
  minActingRating?: number;
  minProfessionalReputation?: number;
  availableFrom?: Instant;
  availableTo?: Instant;
  limit?: number;
  sort?: 'name' | 'acting' | 'reputation' | 'demand' | 'fame';
}

export interface RoleFit {
  personId: string;
  projectId: string;
  roleId: string;
  fit: number;
  available: boolean;
  quoteCents: number;
  bandCents: number;
  axes: TalentAxis[];
}

const PRODUCTION_REACHED = new Set<Project['stage']>(['shooting', 'post', 'delivered']);

function yearsOld(person: Person, at: Instant, zone: string): number {
  const born = zonedParts(person.birthInstant, zone);
  const now = zonedParts(at, zone);
  let age = now.year - born.year;
  if (now.month < born.month || (now.month === born.month && now.day < born.day)) age -= 1;
  return Math.max(0, age);
}

function projectEngagement(
  sim: Simulation,
  person: Person,
  project: Project,
  seat: Seat,
): TalentEngagement | undefined {
  const role = roleOn(project, seat.roleId);
  if (!role) return undefined;
  const when = datesFor(project, role);
  const size = sizeById(role.size);
  const released = seat.releasedAt !== undefined;
  const completed = !released && PRODUCTION_REACHED.has(project.stage)
    && (when?.to === undefined || when.to <= sim.now);
  const active = !released && when !== undefined && when.from <= sim.now && sim.now < when.to;

  return {
    id: `project:${project.id}:${role.id}:${seat.castAt}`,
    source: 'studio_project',
    personId: person.id,
    title: project.title,
    projectId: project.id,
    roleId: role.id,
    role: role.name,
    sizeId: role.size,
    size: size?.label ?? role.size,
    feeCents: seat.feeCents,
    ...(when ? { from: when.from, to: when.to } : {}),
    signedAt: seat.castAt,
    ...(seat.releasedAt !== undefined ? { releasedAt: seat.releasedAt } : {}),
    completed,
    active,
  };
}

function externalEngagement(sim: Simulation, person: Person, audition: Audition): TalentEngagement | undefined {
  if (!person.isPlayer || audition.why !== 'cast') return undefined;
  const size = sizeById(audition.size);
  return {
    id: `external:${audition.id}`,
    source: 'external_booking',
    personId: person.id,
    title: audition.holder,
    role: size?.label ?? 'Part',
    sizeId: audition.size,
    size: size?.label ?? audition.size,
    feeCents: audition.feeCents,
    from: audition.from,
    to: audition.to,
    signedAt: audition.decidedAt,
    completed: audition.to <= sim.now,
    active: audition.from <= sim.now && sim.now < audition.to,
  };
}

/** Every signed acting engagement we can prove from the save. */
export function talentEngagements(sim: Simulation, personId: string): TalentEngagement[] {
  const person = sim.universe.people[personId];
  if (!person) return [];

  const out: TalentEngagement[] = [];
  for (const project of Object.values(sim.universe.projects)) {
    for (const seat of project.cast ?? []) {
      if (seat.personId !== personId) continue;
      const engagement = projectEngagement(sim, person, project, seat);
      if (engagement) out.push(engagement);
    }
  }
  if (person.isPlayer) {
    for (const audition of Object.values(sim.universe.auditions)) {
      const engagement = externalEngagement(sim, person, audition);
      if (engagement) out.push(engagement);
    }
  }

  return out.sort((a, b) =>
    (b.signedAt ?? b.from ?? 0) - (a.signedAt ?? a.from ?? 0)
    || a.title.localeCompare(b.title));
}

/**
 * Credits are engagements that actually reached the work.
 *
 * A released pay-or-play seat is contract history, not a screen credit. The
 * money remains in compensation, but the title does not become filmography.
 */
export function talentCredits(sim: Simulation, personId: string): TalentEngagement[] {
  return talentEngagements(sim, personId).filter((one) => one.completed && one.releasedAt === undefined);
}

/** Work that still owns some of this person's calendar. */
export function talentCommitments(sim: Simulation, personId: string): TalentEngagement[] {
  return talentEngagements(sim, personId)
    .filter((one) => one.releasedAt === undefined && one.to !== undefined && one.to > sim.now)
    .sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
}

function compensationOf(engagements: readonly TalentEngagement[]): TalentCompensation {
  const paid = engagements.filter((one) => one.feeCents > 0);
  const latest = paid
    .slice()
    .sort((a, b) => (b.signedAt ?? b.from ?? 0) - (a.signedAt ?? a.from ?? 0))[0];

  return {
    knownCareerCents: paid.reduce((sum, one) => sum + one.feeCents, 0),
    highestFeeCents: paid.reduce((best, one) => Math.max(best, one.feeCents), 0),
    latestFeeCents: latest?.feeCents ?? 0,
    ...(latest ? { latestFeeAt: latest.signedAt ?? latest.from } : {}),
  };
}

function axesOf(person: Person): TalentAxis[] {
  const read = readOf(person);
  return AXES.map((axis) => ({
    id: axis.id,
    label: axis.label,
    value: Math.round(read[axis.id]),
  }));
}

function topSkillsOf(person: Person, count = 8): TalentSkill[] {
  return ATTRIBUTES
    .map((attribute) => ({
      id: attribute.id,
      name: attribute.name,
      group: attribute.group,
      value: Math.round(rate(person.attributes, attribute.id)),
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, Math.max(0, count));
}

/** The production-facing profile behind an actor or actress name. */
export function talentProfile(sim: Simulation, personId: string): TalentProfile | undefined {
  const person = sim.universe.people[personId];
  if (!person) return undefined;
  const engagements = talentEngagements(sim, personId);
  const city = CITIES.get(person.currentLocationId) ?? CITIES.get(person.homeRegionId);

  return {
    person,
    age: yearsOld(person, sim.now, sim.homeZone),
    location: city?.name ?? 'Unknown',
    profession: person.careerTrack,
    actingRating: Math.round(overallRating(person.attributes)),
    axes: axesOf(person),
    topSkills: topSkillsOf(person),
    engagements,
    credits: engagements.filter((one) => one.completed && one.releasedAt === undefined),
    commitments: engagements
      .filter((one) => one.releasedAt === undefined && one.to !== undefined && one.to > sim.now)
      .sort((a, b) => (a.from ?? 0) - (b.from ?? 0)),
    compensation: compensationOf(engagements),
    currentQuoteCents: {
      lead: quoteOf(person, 'lead', sim.now),
      support: quoteOf(person, 'support', sim.now),
      guest: quoteOf(person, 'guest', sim.now),
      day: quoteOf(person, 'day', sim.now),
    },
  };
}

/** Whether a person belongs in the production-facing talent directory. */
export function isTalent(sim: Simulation, personId: string): boolean {
  const person = sim.universe.people[personId];
  if (!person) return false;
  return person.careerTrack === 'actor'
    || person.isPlayer
    || talentEngagements(sim, personId).length > 0;
}

/**
 * Searchable talent database for production UI.
 *
 * It searches the people already in the universe rather than fabricating names
 * on render. New performers enter the directory when the casting engine
 * actually discovers or creates them, so closing and reopening a screen cannot
 * reshuffle the market.
 */
export function searchTalent(sim: Simulation, search: TalentSearch = {}): TalentProfile[] {
  const needle = search.query?.trim().toLocaleLowerCase() ?? '';
  const from = search.availableFrom;
  const to = search.availableTo;
  const profiles = Object.values(sim.universe.people)
    .filter((person) => isTalent(sim, person.id))
    .filter((person) => search.profession === undefined || person.careerTrack === search.profession)
    .map((person) => talentProfile(sim, person.id)!)
    .filter((profile) => {
      if (needle) {
        const name = `${profile.person.displayName} ${profile.person.stageName ?? ''}`.toLocaleLowerCase();
        if (!name.includes(needle)) return false;
      }
      if (search.minActingRating !== undefined && profile.actingRating < search.minActingRating) return false;
      if (
        search.minProfessionalReputation !== undefined
        && profile.person.reputation.professionalReputation < search.minProfessionalReputation
      ) return false;
      if (from !== undefined && to !== undefined && !freeToWork(sim, profile.person.id, from, to)) return false;
      return true;
    });

  const sort = search.sort ?? 'reputation';
  profiles.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.person.displayName.localeCompare(b.person.displayName);
      case 'acting':
        return b.actingRating - a.actingRating || a.person.displayName.localeCompare(b.person.displayName);
      case 'demand':
        return b.person.reputation.industryDemand - a.person.reputation.industryDemand
          || a.person.displayName.localeCompare(b.person.displayName);
      case 'fame':
        return b.person.reputation.publicFame - a.person.reputation.publicFame
          || a.person.displayName.localeCompare(b.person.displayName);
      case 'reputation':
      default:
        return b.person.reputation.professionalReputation - a.person.reputation.professionalReputation
          || b.actingRating - a.actingRating
          || a.person.displayName.localeCompare(b.person.displayName);
    }
  });

  return profiles.slice(0, Math.max(1, search.limit ?? 100));
}

/**
 * Production-side comparison for a specific role.
 *
 * The score is not a hiring decision. It is the role's own axis weights applied
 * to this person's acting read, so the UI can explain why the same actor can be
 * excellent for one part and ordinary for another. Availability remains a
 * separate hard fact and compensation remains a separate negotiation fact.
 */
export function talentFitForRole(
  sim: Simulation,
  projectId: string,
  roleId: string,
  personId: string,
): RoleFit | undefined {
  const project = sim.universe.projects[projectId];
  const person = sim.universe.people[personId];
  const role = project ? roleOn(project, roleId) : undefined;
  if (!project || !person || !role) return undefined;

  const read = readOf(person);
  const axes = axesOf(person);
  let weight = 0;
  let weighted = 0;
  for (const axis of AXES) {
    const wants = role.wants?.[axis.id] ?? 1;
    weight += wants;
    weighted += read[axis.id] * wants;
  }

  const when = datesFor(project, role);
  return {
    personId,
    projectId,
    roleId,
    fit: Math.round(weight > 0 ? weighted / weight : 0),
    available: when ? freeToWork(sim, person.id, when.from, when.to) : true,
    quoteCents: quoteOf(person, role.size, sim.now),
    bandCents: role.bandCents,
    axes,
  };
}

/** Convenience for casting screens that already hold a project and role. */
export function talentForRole(
  sim: Simulation,
  project: Project,
  role: Role,
  query = '',
  limit = 40,
): Array<{ profile: TalentProfile; fit: RoleFit }> {
  return searchTalent(sim, {
    query,
    profession: 'actor',
    limit,
    sort: 'reputation',
  })
    .map((profile) => ({
      profile,
      fit: talentFitForRole(sim, project.id, role.id, profile.person.id)!,
    }))
    .sort((a, b) =>
      Number(b.fit.available) - Number(a.fit.available)
      || b.fit.fit - a.fit.fit
      || b.profile.person.reputation.professionalReputation - a.profile.person.reputation.professionalReputation
      || a.profile.person.displayName.localeCompare(b.profile.person.displayName));
}
