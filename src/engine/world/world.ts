/**
 * SLATE — The world outside the player.
 *
 * The universe keeps running whether the player is looking or not: NPCs move
 * through their own careers, projects get made by other people, the Decision
 * Center is kept honest, and the simulation budget is spent where it matters.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { DecisionItem, Id, Person, Project, SimulationTier } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, MS_DAY, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { seedIndependentProject } from '../systems/casting';
import { ATTRIBUTES, TRAITS, conflictingTraits } from '../domain/attributes';
import { SKILLS } from '../domain/skills';

/** How many people get full-detail simulation. Everything else is cheaper. */
const TIER_BUDGET: Record<SimulationTier, number> = {
  full: 1,
  active: 60,
  background: 600,
  dormant: Number.POSITIVE_INFINITY,
};

/**
 * How long a settled casting room is kept before the NPC reads in it are
 * released. Long enough that a player looking back over a season still sees who
 * was up for what; short enough that a ten-year career does not carry tens of
 * thousands of dead records.
 */
const AUDITION_RETENTION_DAYS = 540;

/** How long answered or expired decisions stay in the save. */
const DECISION_RETENTION_DAYS = 180;

/**
 * How long a finished project the player had nothing to do with keeps its cast
 * individually simulated. After this it becomes a credit list.
 */
const PROJECT_ARCHIVE_YEARS = 8;

/** How many people the world simulates at once, at any tier. */
const POPULATION_BUDGET = 1200;

export function registerWorld(sim: Simulation): void {
  sim.onSchedule('world.tick', () => {
    runWorldTick(sim);
    sim.schedule({
      at: addDays(sim.now, 2, sim.homeZone),
      kind: 'world.tick',
      label: 'World simulation',
      category: 'system',
      priority: 96,
    });
  });

  // --- Decision Center -----------------------------------------------------

  sim.onCommand<{ decisionId: Id }, { dismissed: boolean }>(
    'world.dismiss_decision',
    (p, { sim: s }) => {
      const decision = s.universe.decisions[p.decisionId];
      if (!decision) throw new CommandError('No such decision.');
      decision.dismissedAt = s.now;
      return { dismissed: true };
    },
  );

  sim.onCommand<{ decisionId: Id; actionIndex: number }, { ok: boolean; error?: string }>(
    'world.take_decision_action',
    (p, { sim: s }) => {
      const decision = s.universe.decisions[p.decisionId];
      if (!decision) throw new CommandError('No such decision.');
      const action = decision.actions[p.actionIndex];
      if (!action) throw new CommandError('That action is not available on this item.');

      const result = s.execute({ kind: action.commandKind, payload: action.payload });
      if (!result.ok) return { ok: false, error: result.error };
      decision.resolvedAt = s.now;
      return { ok: true };
    },
  );

  // --- Preferences and sandbox --------------------------------------------

  sim.onCommand<Partial<typeof sim.universe.preferences>, { ok: boolean }>(
    'world.set_preferences',
    (p, { sim: s }) => {
      Object.assign(s.universe.preferences, p);
      return { ok: true };
    },
  );

  sim.onCommand<{ enabled: boolean }, { enabled: boolean }>(
    'sandbox.toggle',
    (p, { sim: s }) => {
      s.universe.sandbox.enabled = p.enabled;
      s.universe.sandbox.log.push({ at: s.now, action: p.enabled ? 'Sandbox enabled' : 'Sandbox disabled' });
      return { enabled: p.enabled };
    },
  );

  sim.onCommand<Record<string, never>, { applied: number }>(
    'sandbox.max_attributes',
    (_p, { sim: s }) => {
      if (!s.universe.sandbox.enabled) throw new CommandError('Sandbox is off. Turn it on first — this is not something to do by accident.');
      const player = s.player;
      for (const attribute of ATTRIBUTES) player.attributes[attribute.id] = 100;
      for (const skill of SKILLS) player.skills[skill.id] = 100;
      s.universe.sandbox.maxAttributesApplied = true;
      s.universe.sandbox.log.push({ at: s.now, action: 'Maxed all attributes and skills' });
      s.remember({
        category: 'life', title: 'Sandbox: attributes maxed',
        detail: 'All 88 attributes and every skill set to 100 through sandbox tools.',
        refs: [{ type: 'person', id: player.id }], significance: 1, public: false,
      });
      return { applied: ATTRIBUTES.length + SKILLS.length };
    },
  );

  sim.onCommand<Record<string, never>, { granted: string[]; skipped: { id: string; reason: string }[] }>(
    'sandbox.grant_all_traits',
    (_p, { sim: s }) => {
      if (!s.universe.sandbox.enabled) throw new CommandError('Sandbox is off. Turn it on first.');
      const player = s.player;
      const granted: string[] = [];
      const skipped: { id: string; reason: string }[] = [];

      // Even in sandbox, mutually exclusive traits stay mutually exclusive.
      for (const trait of TRAITS) {
        if (player.traits.includes(trait.id)) continue;
        const conflicts = conflictingTraits(player.traits, trait.id);
        if (conflicts.length > 0) {
          skipped.push({ id: trait.id, reason: `Conflicts with ${conflicts.join(', ')}.` });
          continue;
        }
        player.traits.push(trait.id);
        granted.push(trait.id);
      }
      s.universe.sandbox.allTraitsGranted = true;
      s.universe.sandbox.log.push({ at: s.now, action: `Granted ${granted.length} traits` });
      return { granted, skipped };
    },
  );

  sim.onCommand<{ amount: number }, { credited: number }>(
    'sandbox.add_funds',
    (p, { sim: s }) => {
      if (!s.universe.sandbox.enabled) throw new CommandError('Sandbox is off. Turn it on first.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to credit.');
      s.income(accountId, Math.round(p.amount), 'Sandbox funds', 'sandbox');
      s.universe.sandbox.unlimitedFunds = true;
      s.universe.sandbox.log.push({ at: s.now, action: `Added ${p.amount} cents` });
      return { credited: Math.round(p.amount) };
    },
  );

  // --- Tutorial ------------------------------------------------------------

  sim.onCommand<{ tutorialId: string }, { completed: string[] }>(
    'tutorial.complete',
    (p, { sim: s }) => {
      if (!s.universe.tutorial.completed.includes(p.tutorialId)) {
        s.universe.tutorial.completed.push(p.tutorialId);
      }
      s.universe.tutorial.active = s.universe.tutorial.active.filter((t) => t !== p.tutorialId);
      return { completed: s.universe.tutorial.completed };
    },
  );

  sim.onCommand<{ tutorialId: string }, { dismissed: string[] }>(
    'tutorial.dismiss',
    (p, { sim: s }) => {
      if (!s.universe.tutorial.dismissed.includes(p.tutorialId)) {
        s.universe.tutorial.dismissed.push(p.tutorialId);
      }
      s.universe.tutorial.active = s.universe.tutorial.active.filter((t) => t !== p.tutorialId);
      return { dismissed: s.universe.tutorial.dismissed };
    },
  );

  sim.onCommand<Record<string, never>, { reset: boolean }>(
    'tutorial.reset',
    (_p, { sim: s }) => {
      // Replaying the tutorial must never touch save data.
      s.universe.tutorial.completed = [];
      s.universe.tutorial.dismissed = [];
      s.universe.tutorial.active = [];
      return { reset: true };
    },
  );

  sim.onCommand<{ guided?: boolean; advanced?: boolean }, { guidedMode: boolean; advancedMode: boolean }>(
    'tutorial.set_mode',
    (p, { sim: s }) => {
      if (p.guided !== undefined) s.universe.tutorial.guidedMode = p.guided;
      if (p.advanced !== undefined) s.universe.tutorial.advancedMode = p.advanced;
      return { guidedMode: s.universe.tutorial.guidedMode, advancedMode: s.universe.tutorial.advancedMode };
    },
  );

  sim.onCommand<{ notificationIds?: Id[] }, { read: number }>(
    'world.mark_read',
    (p, { sim: s }) => {
      let read = 0;
      for (const notification of s.universe.notifications) {
        if (p.notificationIds && !p.notificationIds.includes(notification.id)) continue;
        if (!notification.read) { notification.read = true; read++; }
      }
      return { read };
    },
  );
}

// ---------------------------------------------------------------------------
// The world tick
// ---------------------------------------------------------------------------

/**
 * Background simulation. This is deliberately cheap: important people get real
 * processing, everybody else gets a coarse update, and the dormant majority is
 * not touched at all until something makes them relevant.
 */
function runWorldTick(sim: Simulation): void {
  retier(sim);
  driftNpcCareers(sim);
  expireDecisions(sim);
  keepIndustryAlive(sim);
  prune(sim);
}

/** Decides who deserves detailed simulation right now. */
function retier(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;

  const known = new Set<Id>();
  for (const rel of Object.values(sim.universe.relationships)) {
    if (rel.endedAt) continue;
    if (rel.aId === player.id) known.add(rel.bId);
    if (rel.bId === player.id) known.add(rel.aId);
  }
  for (const project of Object.values(sim.universe.projects)) {
    if (!['preproduction', 'production', 'post', 'marketing', 'distribution'].includes(project.phase)) continue;
    const involves = project.createdById === player.id || project.castIds.includes(player.id)
      || project.writerIds.includes(player.id) || project.directorId === player.id;
    if (!involves) continue;
    for (const id of [...project.castIds, ...project.writerIds, ...project.producerIds, project.directorId]) {
      if (id) known.add(id);
    }
  }
  for (const employee of Object.values(sim.universe.employees)) {
    if (employee.departedAt) continue;
    const company = sim.universe.companies[employee.companyId];
    if (company?.ownerships.some((o) => o.holderId === player.id)) known.add(employee.personId);
  }

  let activeCount = 0;
  const contenders: Person[] = [];
  for (const person of Object.values(sim.universe.people)) {
    if (person.isPlayer) { person.tier = 'full'; continue; }
    if (known.has(person.id) && activeCount < TIER_BUDGET.active) {
      person.tier = 'active';
      activeCount++;
      continue;
    }
    person.tier = 'dormant';
    // Notable people are candidates for background simulation, but the budget
    // is a budget: an industry that has been running for a decade generates
    // thousands of plausible names, and simulating all of them every tick is
    // how a long save grinds to a halt.
    if (person.reputation.publicFame > 25 || person.careerTrack === 'executive' || person.industryRole) {
      contenders.push(person);
    }
  }

  if (contenders.length > TIER_BUDGET.background) {
    // Rank by how likely the player is to run into them: who is famous, who
    // people are hiring, and who has actually worked.
    contenders.sort((a, b) => (
      (b.reputation.publicFame + b.reputation.industryDemand + b.creditIds.length * 4)
      - (a.reputation.publicFame + a.reputation.industryDemand + a.creditIds.length * 4)
    ));
    contenders.length = TIER_BUDGET.background;
  }
  for (const person of contenders) person.tier = 'background';
}

/** NPC careers move on their own, slowly, so the world is not static. */
function driftNpcCareers(sim: Simulation): void {
  const rng = sim.rng('world_drift', Math.floor(sim.now / (2 * MS_DAY)));
  const candidates = Object.values(sim.universe.people).filter(
    (p) => !p.isPlayer && (p.tier === 'active' || p.tier === 'background'),
  );

  // Only a sample moves each tick. Simulating everyone every time is waste.
  const sampleSize = Math.min(candidates.length, 40);
  for (let i = 0; i < sampleSize; i++) {
    const person = candidates[rng.int(0, candidates.length - 1)];
    if (!person) continue;

    // Demand decays without work and rises after it.
    const recentCredits = person.creditIds.length;
    const target = clamp(recentCredits * 6 + person.reputation.professionalReputation * 0.4, 0, 100);
    person.reputation.industryDemand = clamp(
      person.reputation.industryDemand + (target - person.reputation.industryDemand) * 0.05 + rng.normal(0, 1.2),
      0, 100,
    );
    person.reputation.publicFame = clamp(person.reputation.publicFame * 0.998 + rng.normal(0, 0.35), 0, 100);
    person.reputation.controversy = clamp(person.reputation.controversy * 0.985, 0, 100);

    if (person.tier === 'active') {
      // Working actors improve at what they do.
      const key = person.careerTrack === 'actor' ? 'take_consistency' : undefined;
      if (key) person.attributes[key] = clamp((person.attributes[key] ?? 40) + rng.float(0, 0.25), 0, 100);
      person.wellbeing.energy = clamp(person.wellbeing.energy + rng.float(-4, 8), 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress + rng.float(-5, 4), 0, 100);
    }
  }
}

/** Decisions do not sit in the list forever. */
function expireDecisions(sim: Simulation): void {
  for (const decision of Object.values(sim.universe.decisions)) {
    if (decision.resolvedAt || decision.dismissedAt) continue;
    if (decision.dueAt && decision.dueAt < sim.now) {
      decision.resolvedAt = sim.now;
      continue;
    }
    // Anything untouched for a season stops nagging.
    if (sim.now - decision.createdAt > 90 * MS_DAY) decision.dismissedAt = sim.now;
  }
}

/** The industry keeps making things without the player. */
function keepIndustryAlive(sim: Simulation): void {
  const casting = Object.values(sim.universe.roles).filter((r) => r.status === 'casting').length;
  if (casting >= 8) return;
  const rng = sim.rng('industry_alive', Math.floor(sim.now / (2 * MS_DAY)));
  if (rng.chance(0.55)) seedIndependentProject(sim, rng.int(0, 99999));
}

/** Keeps the save from growing without bound over a long life. */
function prune(sim: Simulation): void {
  sim.timeline.prune(sim.now, 400);

  // Auditions are the fastest-growing record in the universe: every open role
  // draws a room full of NPCs. The player's own auditions are career history
  // and are kept; a stranger's read for a part that was cast two years ago is
  // not, and the audit record already preserves what the player was told about
  // it. Rooms are only cleared once the role itself is settled.
  const auditionCutoff = sim.now - AUDITION_RETENTION_DAYS * MS_DAY;
  for (const role of Object.values(sim.universe.roles)) {
    if (role.status !== 'cast' && role.status !== 'closed') continue;
    if (role.auditionIds.length === 0) continue;
    const kept: Id[] = [];
    for (const id of role.auditionIds) {
      const audition = sim.universe.auditions[id];
      if (!audition) continue;
      const settled = audition.decidedAt !== undefined && audition.decidedAt < auditionCutoff;
      if (audition.isPlayer || audition.personId === role.castPersonId || !settled) {
        kept.push(id);
        continue;
      }
      delete sim.universe.auditions[id];
    }
    role.auditionIds = kept;
  }

  // Decisions the player answered, ignored or let expire stop taking up room.
  for (const [id, decision] of Object.entries(sim.universe.decisions)) {
    const closedAt = decision.resolvedAt ?? decision.dismissedAt;
    if (closedAt !== undefined && sim.now - closedAt > DECISION_RETENTION_DAYS * MS_DAY) {
      delete sim.universe.decisions[id];
    }
  }

  // Expired listings nobody is looking at.
  for (const [id, listing] of Object.entries(sim.universe.vehicleListings)) {
    if (listing.status !== 'active' && sim.now - listing.listedAt > 90 * MS_DAY) delete sim.universe.vehicleListings[id];
  }
  for (const [id, opening] of Object.entries(sim.universe.jobOpenings)) {
    if (opening.closesAt < sim.now - 30 * MS_DAY) delete sim.universe.jobOpenings[id];
  }
  // Social posts stop being interesting once they stop earning.
  const posts = Object.entries(sim.universe.socialPosts);
  if (posts.length > 900) {
    const old = posts
      .filter(([, p]) => p.decayDaysRemaining <= 0 && sim.now - p.postedAt > 400 * MS_DAY)
      .sort((a, b) => a[1].postedAt - b[1].postedAt)
      .slice(0, posts.length - 900);
    for (const [id] of old) delete sim.universe.socialPosts[id];
  }
  // Dormant NPCs with no ties to anything are released.
  //
  // A project that finished a decade ago and never involved the player stops
  // holding its cast in the simulation. The credit itself is permanent — it was
  // written onto the project when they were cast — so the billing block still
  // reads correctly; what is released is the individual simulation of a day
  // player nobody has thought about since. Without this, every film ever made
  // pins its whole cast forever and the population of a long save only grows.
  const archiveCutoff = sim.now - PROJECT_ARCHIVE_YEARS * 365 * MS_DAY;
  const archived: Project[] = [];
  const referenced = new Set<Id>([sim.universe.playerId]);
  for (const rel of Object.values(sim.universe.relationships)) { referenced.add(rel.aId); referenced.add(rel.bId); }
  for (const project of Object.values(sim.universe.projects)) {
    if (isArchivable(sim, project, archiveCutoff)) {
      archived.push(project);
      continue;
    }
    for (const id of [...project.castIds, ...project.writerIds, ...project.producerIds, project.directorId, project.createdById]) {
      if (id) referenced.add(id);
    }
  }
  // An archived project still pins whoever ran it, so the film has an author.
  for (const project of archived) {
    for (const id of [project.directorId, project.createdById, project.showrunnerId]) {
      if (id) referenced.add(id);
    }
  }
  for (const employee of Object.values(sim.universe.employees)) referenced.add(employee.personId);
  for (const agent of Object.values(sim.universe.realEstateAgents)) referenced.add(agent.personId);
  for (const provider of Object.values(sim.universe.healthProviders)) if (provider.personId) referenced.add(provider.personId);
  for (const nomination of Object.values(sim.universe.awardNominations)) if (nomination.personId) referenced.add(nomination.personId);

  const people = Object.values(sim.universe.people);
  if (people.length > POPULATION_BUDGET) {
    const droppable = people
      .filter((p) => p.tier === 'dormant' && !referenced.has(p.id))
      .slice(0, people.length - POPULATION_BUDGET);
    if (droppable.length > 0) {
      const dropped = new Set(droppable.map((p) => p.id));
      for (const person of droppable) delete sim.universe.people[person.id];
      // Unlink them from the archived work so nothing points at a person who
      // is no longer there. `credits` keeps the names.
      for (const project of archived) {
        project.castIds = project.castIds.filter((id) => !dropped.has(id));
        project.writerIds = project.writerIds.filter((id) => !dropped.has(id));
        project.producerIds = project.producerIds.filter((id) => !dropped.has(id));
        project.attachments = project.attachments.filter((a) => !dropped.has(a.personId));
      }
    }
  }
}

/**
 * Whether a project has been finished and forgotten for long enough that the
 * world no longer needs to simulate the people in it. Anything the player
 * touched is never archived: their own history stays fully alive.
 */
function isArchivable(sim: Simulation, project: Project, cutoff: Instant): boolean {
  if (project.phase !== 'library' && project.phase !== 'shelved') return false;
  const playerId = sim.universe.playerId;
  if (
    project.createdById === playerId
    || project.directorId === playerId
    || project.showrunnerId === playerId
    || project.castIds.includes(playerId)
    || project.writerIds.includes(playerId)
    || project.producerIds.includes(playerId)
  ) return false;
  if (project.ownerCompanyId) {
    const company = sim.universe.companies[project.ownerCompanyId];
    if (company?.ownerships.some((o) => o.holderId === playerId)) return false;
  }
  const concluded = project.releaseDate
    ?? project.phaseHistory[project.phaseHistory.length - 1]?.enteredAt
    ?? project.createdAt;
  return concluded < cutoff;
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

/** The Decision Center: what genuinely needs the player's attention. */
export function openDecisions(sim: Simulation): DecisionItem[] {
  return Object.values(sim.universe.decisions)
    .filter((d) => !d.resolvedAt && !d.dismissedAt)
    .sort((a, b) => {
      // Overdue first, then urgency, then soonest due.
      const aOverdue = a.dueAt !== undefined && a.dueAt < sim.now;
      const bOverdue = b.dueAt !== undefined && b.dueAt < sim.now;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      return (a.dueAt ?? Number.POSITIVE_INFINITY) - (b.dueAt ?? Number.POSITIVE_INFINITY);
    });
}

export function unreadNotifications(sim: Simulation) {
  return sim.universe.notifications
    .filter((n) => !n.read)
    .sort((a, b) => b.importance - a.importance || b.at - a.at);
}

/** Who the player knows, ranked by how much the relationship matters now. */
export function socialCircle(sim: Simulation) {
  const playerId = sim.universe.playerId;
  return Object.values(sim.universe.relationships)
    .filter((r) => !r.endedAt && (r.aId === playerId || r.bId === playerId))
    .map((rel) => {
      const otherId = rel.aId === playerId ? rel.bId : rel.aId;
      return { rel, person: sim.universe.people[otherId] };
    })
    .filter((entry): entry is { rel: typeof entry.rel; person: Person } => Boolean(entry.person))
    .sort((a, b) => b.rel.dimensions.familiarity - a.rel.dimensions.familiarity);
}

/** A one-line read on where the player's life currently stands. */
export function lifeSnapshot(sim: Simulation) {
  const player = sim.player;
  const city = CITIES.get(player.currentLocationId);
  const job = player.jobId ? sim.universe.jobs[player.jobId] : undefined;
  const home = player.residenceId ? sim.universe.properties[player.residenceId] : undefined;

  return {
    player,
    city,
    job,
    home,
    householdSize: player.householdId
      ? (sim.universe.households[player.householdId]?.memberIds.length ?? 1)
      : 1,
    activeProjects: Object.values(sim.universe.projects).filter(
      (p) => ['development', 'packaging', 'preproduction', 'production', 'post'].includes(p.phase)
        && (p.createdById === player.id || p.castIds.includes(player.id) || p.directorId === player.id || p.writerIds.includes(player.id)),
    ).length,
    openDecisions: openDecisions(sim).length,
    unread: unreadNotifications(sim).length,
  };
}

/** Simulation cost report, for the performance panel and tests. */
export function simulationLoad(sim: Simulation) {
  const tiers: Record<SimulationTier, number> = { full: 0, active: 0, background: 0, dormant: 0 };
  for (const person of Object.values(sim.universe.people)) tiers[person.tier]++;
  return {
    people: Object.keys(sim.universe.people).length,
    tiers,
    pendingEvents: sim.timeline.pending().length,
    totalScheduled: sim.universe.scheduled.length,
    transactions: sim.universe.transactions.length,
    history: sim.universe.history.length,
    audits: sim.universe.audits.length,
    projects: Object.keys(sim.universe.projects).length,
    estimatedBytes: estimateSize(sim),
  };
}

function estimateSize(sim: Simulation): number {
  // Cheap proxy rather than a full serialise, which would be slow on a tick.
  const u = sim.universe;
  return (
    Object.keys(u.people).length * 1400 +
    u.transactions.length * 260 +
    u.scheduled.length * 320 +
    u.history.length * 280 +
    u.audits.length * 620 +
    Object.keys(u.socialPosts).length * 420 +
    Object.keys(u.projects).length * 2200
  );
}

export { remap };
