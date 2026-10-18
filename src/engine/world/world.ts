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

/** A decision the save doesn't hold: one never raised, or one gone 180 days after it closed (`prune`). Until 2026-10-17
 * it was "No such decision." (brief 14): the player knows a decision as a question in What Needs You. */
const NOT_THERE = 'That question isn’t in What Needs You any more.';

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
      if (!decision) throw new CommandError(NOT_THERE);
      // Once: a second press moved the day its keeping is counted from (until 2026-10-06).
      if (decision.dismissedAt !== undefined) throw new CommandError('You’ve already dismissed that question.');
      decision.dismissedAt = s.now;
      return { dismissed: true };
    },
  );

  sim.onCommand<{ decisionId: Id; actionIndex: number }, { ok: boolean; error?: string }>(
    'world.take_decision_action',
    (p, { sim: s }) => {
      const decision = s.universe.decisions[p.decisionId];
      if (!decision) throw new CommandError(NOT_THERE);
      // Once: a decision already acted on or dismissed isn't acted on again (from 2026-10-10; until then it was). A
      // decision is resolved by an answer or, past its date, by the world tick (`expireDecisions`).
      if (decision.resolvedAt !== undefined) throw new CommandError('That question is already settled: it was answered, or its date passed.');
      if (decision.dismissedAt !== undefined) throw new CommandError('You dismissed that question, so it can’t be answered from What Needs You.');
      const action = decision.actions[p.actionIndex];
      if (!action) throw new CommandError('That isn’t one of this question’s answers.');
      // The command it runs is the player's, so the guide's chapters hold it as they would given directly.
      const held = s.guardedBecause({ kind: action.commandKind, payload: action.payload });
      if (held) throw new CommandError(held);

      const result = s.execute<{ ok?: boolean; error?: string }>({
        kind: action.commandKind, payload: action.payload,
      });
      if (!result.ok) return { ok: false, error: result.error };
      // A refusal the command reports in its own answer rather than by failing.
      //
      // `CommandResult.ok` is whether the handler ran, not whether it did the
      // thing: a command can answer `{ ok: false, error }` from inside a
      // perfectly successful call. Stamping `resolvedAt` off the envelope
      // closed the row anyway, so a button that did nothing took the row off
      // Home and left the player believing it had worked. The row stays open
      // now and the reason comes back with it.
      const said = result.value;
      if (said?.ok === false) throw new CommandError(said.error ?? 'That didn’t go through, and nothing was changed.');
      decision.resolvedAt = s.now;
      return { ok: true };
    },
  );

  // --- Preferences ---------------------------------------------------------

  sim.onCommand<Partial<typeof sim.universe.preferences>, { ok: boolean }>(
    'world.set_preferences',
    (p, { sim: s }) => {
      // Only what's a preference, as one of its values (until 2026-10-06 anything given was kept). 'fast' and 'faster'
      // were taken until 2026-10-12, though no control sent either (`Preferences.timeSpeed`).
      const speeds = ['paused', 'live'] as const;
      const keys = Object.keys(p ?? {});
      // Said without the key's name from 2026-10-17 (brief 14): until then "theme isn’t a preference."
      if (keys.some((k) => k !== 'timeSpeed')) throw new CommandError('That isn’t a setting the game has.');
      if (p?.timeSpeed !== undefined && !speeds.includes(p.timeSpeed)) throw new CommandError('The clock can only be set to Play or Pause.');
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

/**
 * Decisions do not sit in the list forever: each one ends on its date, as whoever raised it chose by dating it.
 *
 * Every raiser dates its row (a year’s return, a US status’s end, an idle account’s handover to the state), and since
 * 2026-10-14 `requireDecision` takes no row without a date. Until then an undated row left a season unanswered was
 * dismissed here, a rule no raiser reached after the scope reset of 2026-10-09 and only a row a test raised by hand
 * met; the owner had it go on 2026-10-14, with the decision look’s words for it. A row an older build left undated is
 * dated as the save loads (`migrate`, `engine/index.ts`).
 */
function expireDecisions(sim: Simulation): void {
  for (const decision of Object.values(sim.universe.decisions)) {
    if (decision.resolvedAt || decision.dismissedAt) continue;
    if (decision.dueAt < sim.now) decision.resolvedAt = sim.now;
  }
}

/** Keeps the save from growing without bound over a long life. */
function prune(sim: Simulation): void {
  sim.timeline.prune(sim.now, 400);

  // Decisions the player answered, ignored or let expire stop taking up room.
  for (const [id, decision] of Object.entries(sim.universe.decisions)) {
    const closedAt = decision.resolvedAt ?? decision.dismissedAt;
    if (closedAt === undefined) continue;
    // A closed row about a date that had not arrived was kept here until the date had passed, until 2026-10-14, when
    // the owner had it go: every raiser dates its row within 180 days of raising it (a year’s return, a US status’s
    // end, an idle account’s handover to the state), so a closed row is past its date before its 180 days are, and
    // only a row a test raised by hand reached the keeping. `requireDecision` passes over a dismissed row and raises a
    // fresh one, so nothing read a dismissal off a kept row either.
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
      const aOverdue = a.dueAt < sim.now;
      const bOverdue = b.dueAt < sim.now;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      return a.dueAt - b.dueAt;
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

  return {
    player,
    city,
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
