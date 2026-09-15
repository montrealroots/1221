/**
 * SLATE — the people a picture brings into existence.
 *
 * `content/crew.ts` says what posts exist and when each one starts. This fills
 * them, and filling one is how most people in this world come to exist at all:
 * a picture needs a gaffer, so there is a gaffer, and she keeps existing after
 * the picture is delivered.
 *
 * Three things here are the whole point of the rank.
 *
 * **A person exists because a production needed them.** Nobody is generated
 * into a waiting pool. The save opens with a family and nobody else, and the
 * industry is populated as a consequence of work happening, which means the
 * size and shape of the crew base is a record of what the company has made.
 *
 * **They come back.** The first pass at a post looks for somebody who has held
 * it on this company's pictures before and is free for the dates. A company
 * that keeps making pictures accumulates a crew, and the fourth picture is
 * staffed by people the third one found. That recurrence is not decoration: it
 * is the only reason the choice of who to hire has any weight.
 *
 * **They arrive when the calendar says.** Crew is a calendar rather than a
 * budget line, so each post has a start offset in weeks before the first day of
 * photography and an end offset after wrap. A unit production manager is on the
 * picture ten weeks before the camera turns over; a boom operator is on it for
 * one. Nobody is on it for the whole of it except the accountant.
 *
 * What is not here, deliberately: what anybody is paid. That is the engagement
 * and the deal, which is its own record covering cast and crew together, and
 * building half of it here would mean building it twice.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import type { Person } from '../domain/model';
import type { Project } from '../domain/company';
import { emptyAttributeSheet } from '../domain/attributes';
import { emptySkillSheet } from '../domain/skills';
import { freshWellbeing } from '../systems/life';
import { impliedPerformerTitle } from '../core/performer';
import { clamp } from '../core/rng';
import { MEN, WOMEN, patronymic } from '../content/names';
import {
  CROWD_RUNS, DEPARTMENTS, FULLY_STAFFED_AT, POSTS, type Post, postById, prepScale,
} from '../content/crew';
import { MS_WEEK } from './lot';

/**
 * The dates of one period.
 *
 * The same lookup `world/making.ts` exports, written out here rather than
 * imported, because making has to call this file at the greenlight and two
 * modules importing each other is a cycle waiting to bite.
 */
const periodOn = (project: Project, id: string): { from: Instant; to: Instant } | undefined =>
  project.periods?.find((p) => p.id === id);

export const CREW_KIND = 'project.crew';

// ---------------------------------------------------------------------------
// Which posts a picture carries
// ---------------------------------------------------------------------------

/**
 * The posts this picture can afford to carry.
 *
 * Below a post's floor the work still happens — somebody already there does it
 * wearing a second hat. That is why a small picture has a director of
 * photography and no camera operator: the DP operates, and cannot watch a
 * monitor while doing it.
 */
export function postsFor(budgetCents: Money): Post[] {
  return POSTS.filter((post) => budgetCents >= post.carriedFrom);
}

/** The smallest budget that carries anybody in this department at all. */
export function carriesFrom(departmentId: string): Money {
  const posts = POSTS.filter((one) => one.department === departmentId);
  return posts.length === 0 ? FULLY_STAFFED_AT : Math.min(...posts.map((one) => one.carriedFrom));
}

/**
 * How many people a department carries under its named posts, at this budget.
 *
 * Scaled from the department's own floor and not from nought, which is what
 * makes the head come first. A picture that has just afforded a set decorator
 * has a set decorator and nobody behind them; the crowd arrives as the money
 * climbs from there, and everything is staffed together at the top.
 *
 * Doing it this way is also what keeps this from needing a second test of the
 * same fact. A department below its own floor has no head, and the arithmetic
 * already hands back nobody, so a guard saying the same thing would be a line
 * that could never change an answer.
 */
export function crowdIn(departmentId: string, budgetCents: Money): number {
  const department = DEPARTMENTS.find((one) => one.id === departmentId);
  if (!department) return 0;
  const floor = carriesFrom(department.id);
  const span = Math.max(1, FULLY_STAFFED_AT - floor);
  const share = Math.min(1, Math.max(0, (budgetCents - floor) / span));
  return Math.round(department.crowd * share);
}

/**
 * How many people are on the picture, named and unnamed together.
 *
 * The number the payroll would show, which is not the number of posts and never
 * was. Twenty-four named people is what a picture engages by name; what it
 * employs is that plus everybody under them, and the gap between the two is the
 * difference between a department head count and a crew.
 */
export function headcountOf(budgetCents: Money): number {
  const named = postsFor(budgetCents).length;
  const behind = DEPARTMENTS.reduce((n, department) => n + crowdIn(department.id, budgetCents), 0);
  return named + behind;
}

/**
 * The working days an ordinary crew engagement runs to.
 *
 * Counted on the crowd rather than on the named posts, because the crowd is
 * where the fiftieth person is. A five-day week, the shoot, and a week either
 * side of it.
 */
export function crewDaysOf(shootWeeks: number): number {
  return Math.round((shootWeeks + CROWD_RUNS * 2) * 5);
}

/** When a post comes on, which is never before somebody said yes to the picture. */
export function startFor(project: Project, post: Post, notBefore: Instant): Instant {
  const shoot = periodOn(project, 'shooting');
  if (!shoot) return notBefore;
  const scale = prepScale(((shoot.to - shoot.from) / MS_WEEK) || 6);
  const wanted = shoot.from - Math.round(post.startsAt * scale * MS_WEEK);
  return Math.max(notBefore, wanted);
}

/** When they finish, which is after wrap for most and long after it for the money. */
export function endFor(project: Project, post: Post): Instant | undefined {
  const shoot = periodOn(project, 'shooting');
  if (!shoot) return undefined;
  const scale = prepScale(((shoot.to - shoot.from) / MS_WEEK) || 6);
  return shoot.to + Math.round(post.endsAt * scale * MS_WEEK);
}

// ---------------------------------------------------------------------------
// Who gets the job
// ---------------------------------------------------------------------------

export interface Hiring {
  /** How many people have held this post on this company's pictures before. */
  returning: number;
  /** What the picture costs, which sets how deep a pool it can reach into. */
  negativeCents: Money;
  /** Whether the post runs a department. */
  head: boolean;
}

/**
 * Whether a post goes to somebody already known, and how good they are.
 *
 * Two real forces and a draw. A crew that has worked together gets rehired, and
 * more so the more often it has happened — but a head is rehired harder than
 * anybody, because a production designer who knows how the company works is
 * worth more than a better stranger. And money reaches further: a quarter of a
 * million euros gets who is available, forty million gets who is wanted.
 */
export function decideHire(hiring: Hiring, roll: number): { returning: boolean; standing: number } {
  const keeps = 0.25
    + Math.min(0.45, hiring.returning * 0.18)
    + (hiring.head ? 0.2 : 0);
  const millions = hiring.negativeCents / 100 / 1_000_000;
  const reach = 22 * Math.min(1, millions / 40);
  const standing = clamp(
    Math.round(30 + reach + (hiring.head ? 22 : 0) + (roll - 0.5) * 16),
    1, 100,
  );
  return { returning: hiring.returning > 0 && roll < keeps, standing };
}

/** How a standing reads, for a screen and for the decider sweep. */
export function standingReads(standing: number): string {
  if (standing < 38) return 'unproven';
  if (standing < 56) return 'solid';
  if (standing < 74) return 'sought after';
  return 'the best in the country';
}

// ---------------------------------------------------------------------------
// Making a person
// ---------------------------------------------------------------------------

/**
 * Somebody new, named the way somebody from here is named.
 *
 * Their acting sheet is empty and stays empty. Nothing reads a gaffer's
 * technique, and filling in eighty-eight numbers to say nothing would put the
 * whole attribute sheet in the save for every person a picture ever hired.
 */
function somebodyNew(sim: Simulation, standing: number, next: () => number): Person {
  const player = sim.universe.people[sim.universe.playerId]!;
  const woman = next() < 0.5;
  const given = woman
    ? WOMEN[Math.floor(next() * WOMEN.length)] ?? 'Anna'
    : MEN[Math.floor(next() * MEN.length)]?.name ?? 'Jón';
  const father = MEN[Math.floor(next() * MEN.length)] ?? MEN[0]!;
  const pronouns = woman ? 'she/her' : 'he/him';
  const dial = () => Math.round(25 + next() * 50);
  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName: given,
    lastName: patronymic(father, woman ? 'dóttir' : 'son'),
    displayName: `${given} ${patronymic(father, woman ? 'dóttir' : 'son')}`,
    pronouns,
    // A required word, not a claim. Nobody on a crew is billed as either, and
    // nothing calls a key grip an actress — but the field has to hold
    // something, and what it holds is what their own pronouns imply.
    // both-titles: the word itself, which is what this comment is about.
    performerTitle: impliedPerformerTitle(pronouns),
    birthInstant: sim.now - Math.round((24 + next() * 34) * 365.25 * 24 * 60 * 60 * 1000),
    gender: woman ? 'female' : 'male',
    homeRegionId: player.homeRegionId,
    citizenshipId: player.citizenshipId,
    currentLocationId: player.currentLocationId,
    personality: {
      openness: dial(), conscientiousness: dial(), extraversion: dial(),
      agreeableness: dial(), emotionalStability: dial(), ambition: dial(),
      riskTolerance: dial(),
    },
    interests: [],
    goals: [],
    lifestyle: 'modest',
    background: 'Crew. Came up through a department and stayed in it.',
    attributes: emptyAttributeSheet(),
    traits: [],
    skills: emptySkillSheet(),
    wellbeing: freshWellbeing(),
    reputation: {
      publicFame: 0,
      audienceAppeal: 50,
      // What the industry thinks of their work is the one thing about a crew
      // member that anybody reads, so it is the one thing the hire decides.
      professionalReputation: standing,
      reliability: clamp(Math.round(standing * 0.6 + 30), 1, 100),
      prestige: 0,
      industryDemand: 0,
      controversy: 0,
    },
    careerTrack: 'crew',
    creditScore: 600,
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
}

// ---------------------------------------------------------------------------
// Filling a post
// ---------------------------------------------------------------------------

/** Everybody this company has ever had in a given post, most recent first. */
export function heldBefore(sim: Simulation, companyId: Id, postId: string): Id[] {
  const seen: { id: Id; at: Instant }[] = [];
  for (const project of Object.values(sim.universe.projects)) {
    if (project.companyId !== companyId) continue;
    for (const seat of project.crew ?? []) {
      if (seat.postId === postId) seen.push({ id: seat.personId, at: seat.from });
    }
  }
  return [...new Set(seen.sort((a, b) => b.at - a.at).map((s) => s.id))];
}

/** Whether somebody is already committed across a span. */
export function freeAcross(sim: Simulation, personId: Id, from: Instant, to: Instant): boolean {
  for (const project of Object.values(sim.universe.projects)) {
    for (const seat of project.crew ?? []) {
      if (seat.personId !== personId) continue;
      if (seat.from < to && from < seat.to) return false;
    }
  }
  return true;
}

/**
 * Puts somebody in one post.
 *
 * Looks for a returning hand first, because that is what a production does, and
 * invents one only when there is nobody to come back.
 */
export function fillPost(sim: Simulation, project: Project, post: Post): Id | undefined {
  if (!project.crew) project.crew = [];
  if (project.crew.some((seat) => seat.postId === post.id)) return undefined;
  const from = startFor(project, post, sim.now);
  const to = endFor(project, post);
  if (to === undefined) return undefined;

  const known = heldBefore(sim, project.companyId, post.id)
    .filter((id) => sim.universe.people[id] && freeAcross(sim, id, from, to));
  const roll = sim.rng('crew', 'hire', project.id, post.id).next();
  const answer = decideHire(
    { returning: known.length, negativeCents: project.budgetCents ?? 0, head: post.head },
    roll,
  );

  // One generator, drawn from repeatedly. `sim.rng` builds a fresh stream every
  // call, so passing it as a closure handed back the same first number forever
  // and every person came out named Sveinn Sveinsson.
  const making = sim.rng('crew', 'make', project.id, post.id);
  const personId = answer.returning && known[0]
    ? known[0]
    : somebodyNew(sim, answer.standing, () => making.next()).id;

  project.crew.push({ postId: post.id, personId, from, to });
  return personId;
}

/** Everybody on a picture, in the order they came on. */
export function crewOf(sim: Simulation, project: Project): { post: Post; person: Person; from: Instant; to: Instant }[] {
  const out: { post: Post; person: Person; from: Instant; to: Instant }[] = [];
  for (const seat of project.crew ?? []) {
    const post = postById(seat.postId);
    const person = sim.universe.people[seat.personId];
    if (post && person) out.push({ post, person, from: seat.from, to: seat.to });
  }
  return out.sort((a, b) => a.from - b.from || Number(b.post.head) - Number(a.post.head));
}

/** Who is on the picture on a given day. */
export function onItAt(sim: Simulation, project: Project, at: Instant): { post: Post; person: Person }[] {
  return crewOf(sim, project)
    .filter((seat) => seat.from <= at && at <= seat.to)
    .map(({ post, person }) => ({ post, person }));
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

/**
 * Arms the crew calendar for a greenlit picture.
 *
 * One tick per distinct start date rather than one per post, because eight
 * arrivals is what a pre-production actually has and twenty-four scheduled
 * items would be the same information spread thinner.
 */
export function armTheCrew(sim: Simulation, project: Project): void {
  const carried = postsFor(project.budgetCents ?? 0);
  const when = new Map<Instant, Post[]>();
  for (const post of carried) {
    const at = startFor(project, post, sim.now);
    const list = when.get(at) ?? [];
    list.push(post);
    when.set(at, list);
  }
  for (const [at, posts] of [...when].sort((a, b) => a[0] - b[0])) {
    sim.schedule({
      at,
      kind: CREW_KIND,
      label: `${project.title}: ${posts.length === 1 ? posts[0]!.label : 'The Crew Comes On'}`,
      category: 'business',
      priority: 55,
      payload: { projectId: project.id, postIds: posts.map((p) => p.id) },
      refType: 'project',
      refId: project.id,
    });
  }
}

export function registerCrew(sim: Simulation): void {
  sim.onSchedule(CREW_KIND, (item) => {
    const projectId = String(item.payload?.projectId ?? '');
    const project = sim.universe.projects[projectId];
    if (!project || project.shelvedAt) return;
    const postIds = Array.isArray(item.payload?.postIds) ? item.payload.postIds as string[] : [];
    const came: string[] = [];
    for (const postId of postIds) {
      const post = postById(postId);
      if (!post) continue;
      const personId = fillPost(sim, project, post);
      const person = personId ? sim.universe.people[personId] : undefined;
      if (post && person) came.push(`${person.displayName} (${post.label})`);
    }
    if (came.length === 0) return;
    sim.notify({
      category: 'business',
      title: `${project.title}: ${came.length === 1 ? 'Somebody Comes On' : 'The Crew Comes On'}`,
      body: `${came.join(', ')}.`,
      importance: 45,
      refType: 'project',
      refId: project.id,
    });
  });
}

/** What the crew amounts to, in a sentence. */
export function whereTheCrewStands(sim: Simulation, project: Project): string {
  const carried = postsFor(project.budgetCents ?? 0).length;
  const filled = (project.crew ?? []).length;
  if (filled === 0) {
    return `Nobody is on ${project.title} yet. It carries ${carried} posts once it starts hiring.`;
  }
  const back = (project.crew ?? []).filter((seat) => {
    const others = heldBefore(sim, project.companyId, seat.postId);
    return others.indexOf(seat.personId) > 0 || others.length > 1;
  }).length;
  return `${filled} of ${carried} posts filled on ${project.title}`
    + `${back > 0 ? `, ${back} of them by people who have worked for the company before` : ''}.`;
}
