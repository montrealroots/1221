/**
 * SLATE — The world outside the player.
 *
 * The universe keeps running whether the player is looking or not: NPCs move
 * through their own careers, projects get made by other people, the Decision
 * Center is kept honest, and the simulation budget is spent where it matters.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { DecisionItem, Id, Person, SimulationTier } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, MS_DAY } from '../core/time';
import { CITIES } from '../content/geography';

/** How many people get full-detail simulation. Everything else is cheaper. */
const TIER_BUDGET: Record<SimulationTier, number> = {
  full: 1,
  active: 60,
  background: 600,
  dormant: Number.POSITIVE_INFINITY,
};


/** How long answered or expired decisions stay in the save. */
const DECISION_RETENTION_DAYS = 180;


/** How many people the world simulates at once, at any tier. */
const POPULATION_BUDGET = 1200;

export function registerWorld(sim: Simulation): void {
  sim.onSchedule('world.tick', () => {
    runWorldTick(sim);
    sim.schedule({
      at: addDays(sim.now, 2, sim.homeZone),
      kind: 'world.tick',
      label: 'World Simulation',
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

  // --- Preferences ---------------------------------------------------------

  sim.onCommand<Partial<typeof sim.universe.preferences>, { ok: boolean }>(
    'world.set_preferences',
    (p, { sim: s }) => {
      Object.assign(s.universe.preferences, p);
      return { ok: true };
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

/**
 * The industry keeps making things without the player, and it does it on its
 * own clock: what gets commissioned, where, and in what genre is decided by
 * systems/zeitgeist so that no two years look the same. Nothing is made here.
 */

/** Keeps the save from growing without bound over a long life. */
function prune(sim: Simulation): void {
  sim.timeline.prune(sim.now, 400);


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
  // Anybody the player actually knows, or who holds a job in the world the
  // player deals with, is pinned. The rest are the individual simulation of
  // somebody nobody has thought about in years, and letting them go is what
  // keeps a long save from growing without limit.
  const referenced = new Set<Id>([sim.universe.playerId]);
  for (const rel of Object.values(sim.universe.relationships)) { referenced.add(rel.aId); referenced.add(rel.bId); }
  for (const household of Object.values(sim.universe.households)) {
    for (const id of household.memberIds) referenced.add(id);
  }
  for (const agent of Object.values(sim.universe.realEstateAgents)) referenced.add(agent.personId);
  for (const provider of Object.values(sim.universe.healthProviders)) if (provider.personId) referenced.add(provider.personId);

  const people = Object.values(sim.universe.people);
  if (people.length > POPULATION_BUDGET) {
    const droppable = people
      .filter((p) => p.tier === 'dormant' && !referenced.has(p.id))
      .slice(0, people.length - POPULATION_BUDGET);
    for (const person of droppable) delete sim.universe.people[person.id];
  }
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
  const home = player.residenceId ? sim.universe.properties[player.residenceId] : undefined;

  return {
    player,
    city,
    home,
    householdSize: player.householdId
      ? (sim.universe.households[player.householdId]?.memberIds.length ?? 1)
      : 1,
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
    Object.keys(u.socialPosts).length * 420
  );
}

export { remap };
