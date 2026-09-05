/**
 * SLATE — the industry as something that happens with or without you.
 *
 * Three things live here.
 *
 * The first is memory. Everybody the player deals with privately carries an
 * ego, a loyalty, a list of grudges and a list of favours. None of it is ever
 * shown as a number. A lowball is not forgotten because the deal closed; it is
 * remembered, and acted on months later when it costs something — a script
 * that goes unread, a quote that has gone up for you and nobody else, a line
 * on a talk show that the trades pick up.
 *
 * The second is the world moving on its own. While the player writes, rival
 * companies sign the actor they were going to offer the part to, directors get
 * fired off pictures that are going badly, and audiences get tired of what they
 * have been fed too much of.
 *
 * The third is consequence. One controversial casting does not stop at the
 * budget: it puts a decision in front of the player, attaches heat to the
 * picture, costs standing at the studio, makes the reviews harder, takes money
 * off the opening, and unsettles the people already in the cast.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Disposition, Id, Person, Project, Role } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { MS_DAY, addDays } from '../core/time';
import { formatMoneyCompact, type Money } from '../core/money';
import { titleCaseLabel } from '../core/text';
import { genreName } from '../content/genres';
import { STUDIOS } from '../content/studios';
import { adjustStanding } from './studio-state';
import { systemModifier } from '../domain/attributes';

// ---------------------------------------------------------------------------
// What people privately think
// ---------------------------------------------------------------------------

/** How long a grudge stays hot enough to act on. */
const GRUDGE_DAYS = 900;
/** How long they wait before doing anything about it. */
const SLOW_BURN_DAYS = 45;
/** A person acts on how they feel at most this often. */
const ACT_EVERY_DAYS = 60;

/**
 * Somebody's private disposition, made the first time it is needed.
 *
 * Ego is not vanity: it is how much of somebody's sense of themselves is tied
 * up in being treated as what they are. It comes from what they have done and
 * how long they have been doing it, plus who they are.
 */
export function dispositionOf(sim: Simulation, person: Person): Disposition {
  if (person.disposition) return person.disposition;
  const rng = sim.rng('disposition', person.id);
  const standing = person.reputation.professionalReputation * 0.4
    + person.reputation.publicFame * 0.35 + person.reputation.prestige * 0.25;
  const ego = clamp(Math.round(30 + standing * 0.5 + rng.normal(0, 12)), 5, 98);
  person.disposition = {
    ego,
    loyalty: clamp(Math.round(50 + rng.normal(0, 8)), 20, 80),
    grudges: [],
    favours: [],
  };
  return person.disposition;
}

/** Grudges that still mean something, most recent first. */
export function liveGrudges(sim: Simulation, person: Person): Disposition['grudges'] {
  const disposition = person.disposition;
  if (!disposition) return [];
  const cutoff = sim.now - GRUDGE_DAYS * MS_DAY;
  return disposition.grudges.filter((g) => g.at >= cutoff).sort((a, b) => b.at - a.at);
}

/** How much they are carrying, 0-100. */
export function grudgeWeight(sim: Simulation, person: Person): number {
  return clamp(liveGrudges(sim, person).reduce((sum, g) => {
    const age = (sim.now - g.at) / (GRUDGE_DAYS * MS_DAY);
    return sum + g.weight * (1 - age * 0.5);
  }, 0), 0, 100);
}

/**
 * Where somebody stands with the player, 0-100, all of it together.
 *
 * Read by anything that decides whether they will work with you: an offer, an
 * approach, a script going out. Fifty is a stranger with no history.
 */
export function standingWith(sim: Simulation, person: Person): number {
  const disposition = dispositionOf(sim, person);
  const favours = disposition.favours.reduce((sum, f) => sum + f.weight * (1 - clamp((sim.now - f.at) / (GRUDGE_DAYS * MS_DAY), 0, 0.6)), 0);
  return clamp(disposition.loyalty + favours * 0.6 - grudgeWeight(sim, person) * 0.9, 0, 100);
}

/** Whether they will even read something of yours right now. */
export function willReadFor(sim: Simulation, person: Person): { ok: boolean; reason?: string } {
  const disposition = person.disposition;
  if (!disposition) return { ok: true };
  if (disposition.refusingUntil && disposition.refusingUntil > sim.now) {
    return { ok: false, reason: `${person.stageName ?? person.displayName} is not reading anything of yours at the moment.` };
  }
  return { ok: true };
}

/**
 * Something happened that they did not like.
 *
 * The weight is what it was worth to them; ego multiplies it, because the same
 * offer that a working actor takes as an opening is an insult to somebody who
 * has not been asked twice in fifteen years.
 */
export function slight(
  sim: Simulation, person: Person, reason: string, weight: number,
  refs: { refType?: string; refId?: Id } = {},
): void {
  if (person.isPlayer) return;
  const disposition = dispositionOf(sim, person);
  // Somebody who takes a note badly takes a slight worse: the trait that
  // governs one governs the other, inverted.
  const temperament = 2 - clamp(systemModifier(person.traits, 'notesTolerance'), 0.5, 1.5);
  const scaled = clamp(weight * remap(disposition.ego, 0, 100, 0.55, 1.6) * temperament, 0, 60);
  disposition.grudges.push({ at: sim.now, reason, weight: scaled, ...refs });
  if (disposition.grudges.length > 24) disposition.grudges.splice(0, disposition.grudges.length - 24);
  disposition.loyalty = clamp(disposition.loyalty - scaled * 0.5, 0, 100);
  sim.emit('rel.slighted', { personId: person.id, reason, weight: scaled });
}

/** Something happened that they did like. */
export function favour(sim: Simulation, person: Person, reason: string, weight: number): void {
  if (person.isPlayer) return;
  const disposition = dispositionOf(sim, person);
  disposition.favours.push({ at: sim.now, reason, weight: clamp(weight, 0, 40) });
  if (disposition.favours.length > 24) disposition.favours.splice(0, disposition.favours.length - 24);
  disposition.loyalty = clamp(disposition.loyalty + weight * 0.6, 0, 100);
  sim.emit('rel.favoured', { personId: person.id, reason, weight });
}

/**
 * What somebody's quote does because of how you have treated them.
 *
 * Loyalty buys a discount that nobody writes down; a grudge is paid for in
 * money, if they take the job at all.
 */
export function quoteMultiplierFor(sim: Simulation, person: Person): number {
  const standing = standingWith(sim, person);
  return clamp(remap(standing, 0, 100, 1.35, 0.86), 0.86, 1.5);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerReactive(sim: Simulation): void {
  sim.onSchedule('react.tick', () => {
    runReactiveTick(sim);
    armReactive(sim);
  });

  // --- What gets remembered -------------------------------------------------

  // An offer under what somebody is worth is an offer they remember.
  sim.onEvent('cast.real_offer_declined', 'react.lowball', (event, { sim: s }) => {
    const payload = event.payload as { personId?: Id; amount?: number; wanted?: number };
    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    if (!person || !payload.amount || !payload.wanted) return;
    const short = 1 - payload.amount / Math.max(1, payload.wanted);
    if (short > 0.35) {
      slight(s, person, `Offered ${formatMoneyCompact(payload.amount)} against a quote of ${formatMoneyCompact(payload.wanted)}.`, short * 22, { refType: 'person', refId: person.id });
    }
  });

  sim.onEvent('cast.offer_declined', 'react.declined', (event, { sim: s }) => {
    const payload = event.payload as { personId?: Id; roleId?: Id; amount?: number };
    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    const role = payload.roleId ? s.universe.roles[payload.roleId] : undefined;
    if (!person || !role) return;
    const wanted = person.quote > 0 ? person.quote : role.payHigh;
    if (payload.amount && wanted > 0 && payload.amount < wanted * 0.6) {
      slight(s, person, `A part they were worth more than, offered at ${formatMoneyCompact(payload.amount)}.`, 8, { refType: 'role', refId: role.id });
    }
  });

  // Being cast, paid properly, and credited is remembered too.
  sim.onEvent('cast.role_filled', 'react.hired', (event, { sim: s }) => {
    const payload = event.payload as { personId?: Id; roleId?: Id; fee?: number };
    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    const role = payload.roleId ? s.universe.roles[payload.roleId] : undefined;
    if (!person || !role) return;
    const project = s.universe.projects[role.projectId];
    if (!project || project.createdById !== s.player.id) return;
    const generous = payload.fee !== undefined && person.quote > 0 && payload.fee >= person.quote * 1.1;
    favour(s, person, generous ? `Paid above the quote for ${role.characterName}.` : `Cast as ${role.characterName}.`, generous ? 14 : 7);
  });

  // Somebody dropped from a part they had takes it personally.
  sim.onEvent('cast.recast', 'react.recast', (event, { sim: s }) => {
    const payload = event.payload as { personId?: Id; roleId?: Id; reason?: string };
    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    if (!person) return;
    slight(s, person, payload.reason ?? 'Recast after being cast.', 26, { refType: 'role', refId: payload.roleId });
  });

  // --- What you do about it -------------------------------------------------

  sim.onCommand<{ projectId: Id; personId?: Id; spend?: Money }, { heat: number; note: string; cost: Money }>(
    'pr.statement',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if ((project.controversy ?? 0) <= 0) throw new CommandError('There is nothing to answer.');
      const rng = s.rng('pr_statement', project.id, String(s.now));
      const spend = clamp(Math.round(p.spend ?? Math.max(40_000_00, project.budget * 0.004)), 10_000_00, 5_000_000_00);
      const accountId = project.financingIds[0]
        ?? (project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId]?.cashAccountId : undefined)
        ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay a crisis firm from.');
      if (s.ledger.availableFunds(accountId) < spend) throw new CommandError(`A firm that can do anything about this costs about ${formatMoneyCompact(spend)}.`);
      s.expense(accountId, spend, `${project.title} — crisis communications`, 'marketing', { refType: 'project', refId: project.id });

      // A statement can work, and it can make it worse. What it cannot do is
      // nothing: this is now a thing the picture said as well as did.
      const craft = clamp(s.player.skills['marketing_strategy'] ?? s.player.skills['negotiation'] ?? 30, 0, 100);
      const roll = rng.float(0, 1);
      const worked = roll < clamp(0.35 + craft / 250 + (spend / Math.max(1, project.budget)) * 8, 0.15, 0.85);
      const delta = worked ? -Math.round((project.controversy ?? 0) * rng.float(0.3, 0.55)) : Math.round(rng.float(3, 9));
      const heat = addControversy(s, project, delta, worked
        ? 'A statement, and a firm who knew what to do with it.'
        : 'A statement that gave everybody something new to quote.');
      s.audit({
        kind: 'pr.statement', subjectType: 'project', subjectId: project.id,
        question: 'Did getting ahead of it help?',
        summary: worked ? 'It took the temperature down.' : 'It kept the story alive for another week.',
        factors: [
          { label: 'What You Spent', detail: `${formatMoneyCompact(spend)} on people who do this for a living.`, weight: 0.4, contribution: spend / Math.max(1, project.budget), knowable: true },
          { label: 'Your Own Hand', detail: `Marketing sense reads ${Math.round(craft)} out of 100.`, weight: 0.3, contribution: craft / 100, knowable: true },
          { label: 'How It Landed', detail: 'Which nobody controls.', weight: 0.3, contribution: roll, knowable: false },
        ],
        score: heat,
        outcome: worked ? 'cooled' : 'worse',
      });
      s.resolveDecision('project', project.id, 'business');
      s.emit('pr.statement_made', { projectId: project.id, worked, heat, spend });
      return { heat, note: worked ? 'It took the temperature down.' : 'It kept the story alive.', cost: spend };
    },
  );

  sim.onCommand<{ projectId: Id }, { heat: number; note: string }>(
    'pr.ride_it_out',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      s.resolveDecision('project', project.id, 'business');
      s.remember({
        category: 'project',
        title: `${project.title}: said nothing`,
        detail: 'The decision was to let it pass. Sometimes it does.',
        refs: [{ type: 'project', id: project.id }],
        significance: 20, public: false,
      });
      s.emit('pr.rode_it_out', { projectId: project.id, heat: project.controversy ?? 0 });
      return { heat: project.controversy ?? 0, note: 'Nothing said. It will do what it does.' };
    },
  );

  // --- The cascade ----------------------------------------------------------

  sim.onEvent('cast.role_filled', 'react.controversy_cascade', (event, { sim: s }) => {
    const payload = event.payload as { personId?: Id; roleId?: Id };
    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    const role = payload.roleId ? s.universe.roles[payload.roleId] : undefined;
    if (!person || !role) return;
    const project = s.universe.projects[role.projectId];
    if (!project) return;
    if (person.reputation.controversy < 45) return;
    if (project.createdById !== s.player.id && !project.ownerCompanyId) return;
    castingCascade(s, project, person, role);
  });
}

/**
 * Casting somebody the public has a problem with.
 *
 * One decision, and then it runs through everything: the picture carries heat,
 * the studio thinks less of you for it, the reviews come in harder, the
 * opening is smaller, and the people already in the cast have opinions.
 */
export function castingCascade(sim: Simulation, project: Project, person: Person, role: Role): void {
  const heat = clamp(Math.round(person.reputation.controversy * 0.55 * (role.billing === 'lead' ? 1.3 : role.billing === 'supporting' ? 1 : 0.6)), 0, 100);
  if (heat < 8) return;
  addControversy(sim, project, heat, `${person.stageName ?? person.displayName} cast as ${role.characterName}.`, person.id);

  // 1. The player hears about it, and can do something or nothing.
  sim.requireDecision({
    urgency: 78, category: 'business',
    title: `${person.stageName ?? person.displayName} is a problem for ${project.title}`,
    detail: `Casting them has put ${project.title} in a conversation it was not in yesterday. `
      + `You can get ahead of it, let it pass, or recast — which costs money and time and makes an enemy.`,
    route: '/workspace/projects',
    actions: [
      { label: 'Get Ahead Of It', commandKind: 'pr.statement', payload: { projectId: project.id, personId: person.id } },
      { label: 'Say Nothing', commandKind: 'pr.ride_it_out', payload: { projectId: project.id } },
    ],
    dueAt: addDays(sim.now, 10, sim.homeZone),
    refType: 'project', refId: project.id,
  });

  // 2. The studio that set it up notices.
  if (project.studioId && STUDIOS.get(project.studioId)) {
    adjustStanding(sim, 'studio', project.studioId, -heat / 14, `${project.title}: the casting of ${person.stageName ?? person.displayName} became a story.`);
  }

  // 3. The people already in it have their own reasons for being there.
  for (const id of project.castIds) {
    if (id === person.id) continue;
    const other = sim.universe.people[id];
    if (!other || other.isPlayer) continue;
    const disposition = dispositionOf(sim, other);
    if (disposition.ego > 60 || other.reputation.publicFame > 55) {
      slight(sim, other, `Being on ${project.title} with ${person.stageName ?? person.displayName}.`, heat / 6, { refType: 'project', refId: project.id });
    }
  }

  sim.notify({
    category: 'business',
    title: `${project.title} is carrying heat`,
    body: `${person.stageName ?? person.displayName} brings an audience and an argument. Expect it in the reviews and at the box office.`,
    importance: 72, route: '/workspace/projects', refType: 'project', refId: project.id,
  });
  sim.emit('react.cascade', { projectId: project.id, personId: person.id, heat });
}

/** Puts heat on a picture and keeps the reason. */
export function addControversy(sim: Simulation, project: Project, delta: number, note: string, personId?: Id): number {
  project.controversy = clamp(Math.round((project.controversy ?? 0) + delta), 0, 100);
  project.controversyLog ??= [];
  project.controversyLog.push({ at: sim.now, delta, note, personId });
  if (project.controversyLog.length > 20) project.controversyLog.splice(0, project.controversyLog.length - 20);
  return project.controversy;
}

// ---------------------------------------------------------------------------
// The world, moving on its own
// ---------------------------------------------------------------------------

const REACT_TICK_DAYS = 3;

function armReactive(sim: Simulation): void {
  if (sim.timeline.pending().some((i) => i.kind === 'react.tick')) return;
  sim.schedule({
    at: addDays(sim.now, REACT_TICK_DAYS, sim.homeZone),
    kind: 'react.tick',
    label: 'The Industry',
    category: 'system',
    priority: 95,
  });
}

export function ensureReactive(sim: Simulation): void {
  armReactive(sim);
}

function runReactiveTick(sim: Simulation): void {
  rivalsMove(sim);
  peopleAct(sim);
  decayHeat(sim);
}

const RIVAL_LINES = [
  'closed a deal overnight.',
  'had been circling for a month and moved first.',
  'offered pay-or-play, which you did not.',
  'got there through the agency, before it was even out.',
  'made it a straight offer with no reading.',
];

/**
 * Somebody else signs the person you were going to offer it to.
 *
 * A shortlist is not a hold. While a part sits open, the rest of the business
 * is making offers, and the person at the top of your list has other calls.
 */
function rivalsMove(sim: Simulation): void {
  const rng = sim.rng('rivals', Math.floor(sim.now / (REACT_TICK_DAYS * MS_DAY)));
  const roles = Object.values(sim.universe.roles).filter((role) => {
    if (role.status !== 'casting' && role.status !== 'open') return false;
    const project = sim.universe.projects[role.projectId];
    return Boolean(project) && (project!.createdById === sim.player.id || Boolean(project!.ownerCompanyId));
  });

  for (const role of roles.slice(0, 6)) {
    const project = sim.universe.projects[role.projectId]!;
    const shortlist = role.shortlistIds ?? [];
    const target = shortlist.map((id) => sim.universe.people[id]).find((p): p is Person => Boolean(p) && !p!.isPlayer);
    if (!target) continue;
    // The more in demand they are, the likelier somebody else moves.
    const chance = clamp(target.reputation.industryDemand / 420 + (role.status === 'open' ? 0.02 : 0), 0.01, 0.2);
    if (!rng.chance(chance)) continue;

    const studios = STUDIOS.all().filter((s) => s.id !== project.studioId);
    const rival = studios[rng.int(0, Math.max(0, studios.length - 1))];
    if (!rival) continue;
    role.shortlistIds = shortlist.filter((id) => id !== target.id);
    target.reputation.industryDemand = clamp(target.reputation.industryDemand + 2, 0, 100);
    sim.remember({
      category: 'career',
      title: `${target.stageName ?? target.displayName} went elsewhere`,
      detail: `${rival.shortName ?? rival.name} ${rng.pick(RIVAL_LINES)} They are off ${project.title}.`,
      refs: [{ type: 'project', id: project.id }, { type: 'person', id: target.id }],
      significance: 30, public: false,
    });
    sim.notify({
      category: 'career',
      title: `You lost ${target.stageName ?? target.displayName}`,
      body: `${rival.shortName ?? rival.name} ${rng.pick(RIVAL_LINES)} ${role.characterName} is still open.`,
      importance: 58, route: '/workspace/projects', refType: 'role', refId: role.id,
    });
    sim.emit('react.rival_signed', { roleId: role.id, personId: target.id, studioId: rival.id });
  }
}

const TRASH_TALK = [
  'said on a podcast that they had "a producer who thought a quote was an opening bid".',
  'told an interviewer the worst offer they ever got, without a name on it, and everybody worked it out.',
  'was asked about you by name and said "no comment", at length.',
  'described a meeting that everybody recognised, and did not soften it.',
  'told a room at a festival what happened, and the room repeated it.',
];

/**
 * People do something about how they feel — later, and where it costs you.
 *
 * Nobody acts the day it happens. A grudge sits for weeks, and then turns up
 * as a refusal, a price, or a story somebody tells.
 */
function peopleAct(sim: Simulation): void {
  const rng = sim.rng('grudges', Math.floor(sim.now / (REACT_TICK_DAYS * MS_DAY)));
  const carrying = Object.values(sim.universe.people).filter((person) => {
    if (person.isPlayer || !person.disposition) return false;
    const disposition = person.disposition;
    if (disposition.lastActedAt && sim.now - disposition.lastActedAt < ACT_EVERY_DAYS * MS_DAY) return false;
    return liveGrudges(sim, person).some((g) => !g.actedOnAt && sim.now - g.at > SLOW_BURN_DAYS * MS_DAY);
  });

  for (const person of carrying.slice(0, 4)) {
    const disposition = person.disposition!;
    const weight = grudgeWeight(sim, person);
    if (weight < 8) continue;
    const grudge = liveGrudges(sim, person).find((g) => !g.actedOnAt)!;
    grudge.actedOnAt = sim.now;
    disposition.lastActedAt = sim.now;

    // What they do about it depends on how much they are carrying and on how
    // public a person they are.
    const loud = person.reputation.publicFame > 45;
    const roll = rng.float(0, 1);
    if (weight > 26 && roll < 0.4) {
      const days = Math.round(remap(weight, 8, 60, 120, 480));
      disposition.refusingUntil = sim.now + days * MS_DAY;
      sim.notify({
        category: 'career',
        title: `${person.stageName ?? person.displayName} will not read for you`,
        body: `Word came back through the agency: nothing of yours, for now. ${grudge.reason}`,
        importance: 62, route: '/workspace/casting', refType: 'person', refId: person.id,
      });
      sim.emit('react.refusal', { personId: person.id, untilAt: disposition.refusingUntil });
    } else if (loud && roll < 0.75) {
      const player = sim.player;
      player.reputation.controversy = clamp(player.reputation.controversy + clamp(weight / 5, 1, 8), 0, 100);
      sim.remember({
        category: 'career',
        title: `${person.stageName ?? person.displayName} said something`,
        detail: `${person.stageName ?? person.displayName} ${rng.pick(TRASH_TALK)} It got back to you, as it was always going to.`,
        refs: [{ type: 'person', id: person.id }],
        significance: 42, public: true,
      });
      sim.notify({
        category: 'career',
        title: `${person.stageName ?? person.displayName} talked`,
        body: `${person.stageName ?? person.displayName} ${rng.pick(TRASH_TALK)}`,
        importance: 60, route: '/workspace/social', refType: 'person', refId: person.id,
      });
      sim.emit('react.trash_talk', { personId: person.id, weight });
    } else {
      // The quietest option, and the most expensive: the number goes up.
      const before = person.quote;
      person.quote = Math.round(person.quote * clamp(1 + weight / 120, 1.02, 1.35));
      sim.emit('react.quote_raised', { personId: person.id, from: before, to: person.quote });
    }
  }

  // Time takes the edge off, if nothing new happens.
  for (const person of Object.values(sim.universe.people)) {
    const disposition = person.disposition;
    if (!disposition) continue;
    if (disposition.refusingUntil && disposition.refusingUntil <= sim.now) disposition.refusingUntil = undefined;
    disposition.loyalty = clamp(disposition.loyalty + (50 - disposition.loyalty) * 0.01, 0, 100);
  }
}

/**
 * What the audience is tired of.
 *
 * Nothing to do with quality: it is volume. Nine superhero pictures in a year
 * and the tenth opens into a room that has seen this. It is measured off what
 * the world actually released, in the eighteen months behind now, and it
 * recovers on its own the moment the pile-on stops.
 */
export function audienceFatigue(sim: Simulation, genres: readonly string[]): number {
  if (genres.length === 0) return 0;
  const window = sim.now - 540 * MS_DAY;
  const counts = new Map<string, number>();
  for (const project of Object.values(sim.universe.projects)) {
    if (!project.releaseDate || project.releaseDate < window || project.releaseDate > sim.now) continue;
    for (const genre of project.genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  // A dozen of one thing in eighteen months is a glut; three is a season.
  const worst = Math.max(...genres.map((g) => counts.get(g) ?? 0));
  return clamp(Math.round(remap(worst, 3, 16, 0, 100)), 0, 100);
}

/** What fatigue does to an opening, as a multiplier. */
export function fatigueFactor(fatigue: number): number {
  return clamp(1 - Math.pow(clamp(fatigue, 0, 100) / 100, 1.3) * 0.28, 0.72, 1);
}

/** Heat on a picture cools if nothing keeps it alight. */
function decayHeat(sim: Simulation): void {
  for (const project of Object.values(sim.universe.projects)) {
    if (!project.controversy) continue;
    if (project.phase === 'released' || project.phase === 'library') continue;
    project.controversy = clamp(Math.round(project.controversy * 0.97), 0, 100);
  }
}

/** What heat does to a picture's opening, as a multiplier. */
export function controversyFactor(project: Project): number {
  const heat = project.controversy ?? 0;
  if (heat <= 0) return 1;
  // A row sells a few tickets and loses more of them. A whisper of it is worth
  // something; anything the audience has an opinion about is not.
  return clamp(1 + heat / 400 - Math.pow(heat / 100, 1.4) * 0.55, 0.62, 1.01);
}

/** What heat does to how a picture is reviewed, in points. */
export function controversyReviewPenalty(project: Project): number {
  const heat = project.controversy ?? 0;
  if (heat <= 0) return 0;
  return -clamp(heat / 9, 0, 11);
}

/** For the UI: everything a picture is carrying, in words. */
export function heatSummary(project: Project): { heat: number; note: string; log: NonNullable<Project['controversyLog']> } {
  const heat = project.controversy ?? 0;
  return {
    heat,
    note: heat === 0 ? 'Nothing attached to it.'
      : heat < 20 ? 'A conversation, not a problem.'
        : heat < 45 ? 'It is in the coverage, and it will be in the reviews.'
          : heat < 70 ? 'This is what the picture is about now, whether you like it or not.'
            : 'The film is the story about the film.',
    log: project.controversyLog ?? [],
  };
}

void titleCaseLabel; void genreName;
