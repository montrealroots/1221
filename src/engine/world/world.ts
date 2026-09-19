/**
 * SLATE — The world outside the player.
 *
 * What is left of it. The industry, the NPC careers and the people who filled
 * them out are gone; what remains is the part every save still needs — the
 * Decision Center, the notification list, the preferences, and the tick that
 * keeps a long save from growing without bound.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { DecisionItem, Id } from '../domain/model';
import { addDays, MS_DAY } from '../core/time';
import { CITIES } from '../content/geography';

/** How long answered or expired decisions stay in the save. */
const DECISION_RETENTION_DAYS = 180;

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
      if (!action) throw new CommandError('That action isn’t available on this item.');

      const result = s.execute<{ ok?: boolean; error?: string }>({
        kind: action.commandKind, payload: action.payload,
      });
      if (!result.ok) return { ok: false, error: result.error };
      // A refusal the command reports in its own answer rather than by failing.
      //
      // `CommandResult.ok` is whether the handler ran, not whether it did the
      // thing: `company.claim_rebate` answers `{ ok: false, error }` when the
      // door has shut, and the envelope around that is a perfectly successful
      // call. Stamping `resolvedAt` off the envelope closed the row anyway, so
      // the reimbursement row could be pressed in the two days between the
      // camera turning over and the tick that expires it, vanish off Home, and
      // leave the player believing they had filed a claim that on a twenty
      // million euro feature pays close to six million. The row stays open now and
      // the reason comes back with it.
      const said = result.value;
      if (said?.ok === false) throw new CommandError(said.error ?? 'That couldn’t be done.');
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

function runWorldTick(sim: Simulation): void {
  expireDecisions(sim);
  prune(sim);
}

function expireDecisions(sim: Simulation): void {
  for (const decision of Object.values(sim.universe.decisions)) {
    if (decision.resolvedAt || decision.dismissedAt) continue;
    if (decision.dueAt !== undefined) {
      if (decision.dueAt < sim.now) decision.resolvedAt = sim.now;
      continue;
    }
    // Anything undated and untouched for a season stops nagging.
    if (sim.now - decision.createdAt > 90 * MS_DAY) decision.dismissedAt = sim.now;
  }
}

/** Keeps the save from growing without bound over a long life. */
function prune(sim: Simulation): void {
  sim.timeline.prune(sim.now, 400);

  // Decisions the player answered, ignored or let expire stop taking up room.
  for (const [id, decision] of Object.entries(sim.universe.decisions)) {
    const closedAt = decision.resolvedAt ?? decision.dismissedAt;
    if (closedAt === undefined) continue;
    // A closed row about a date that has not arrived yet is still load-bearing.
    // `theClaimsStillOpen` reads a dismissal off the row to know it was told to
    // stop asking, and a runway runs to 294 days on a forty-week feature and
    // 308 on a format season — both past this retention, so dropping the row
    // on the calendar alone would put a waved-away prompt back on the list
    // months later with nothing to show for the wave.
    if (decision.dueAt !== undefined && decision.dueAt > sim.now) continue;
    if (sim.now - closedAt > DECISION_RETENTION_DAYS * MS_DAY) {
      delete sim.universe.decisions[id];
    }
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

/** Simulation cost report, for tests and the developer console. */
export function simulationLoad(sim: Simulation) {
  return {
    people: Object.keys(sim.universe.people).length,
    pendingEvents: sim.timeline.pending().length,
    totalScheduled: sim.universe.scheduled.length,
    transactions: sim.universe.transactions.length,
    estimatedBytes: estimateSize(sim),
  };
}

function estimateSize(sim: Simulation): number {
  // Cheap proxy rather than a full serialise, which would be slow on a tick.
  const u = sim.universe;
  return (
    Object.keys(u.people).length * 1400 +
    u.transactions.length * 260 +
    u.scheduled.length * 320
  );
}
