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
import { addDays, formatDate, MS_DAY } from '../core/time';
import { CITIES } from '../content/geography';
import { whatIsGoing } from './audition';
import { CLAIM_DECISION, turnsOverOn, whyNot } from './rebate';

/** How long answered or expired decisions stay in the save. */
const DECISION_RETENTION_DAYS = 180;

/**
 * How hard the reimbursement asks, out of a hundred.
 *
 * Above Home's critical band, which starts at eighty-five, because of what the
 * thing is worth: played out to the money landing on a twenty million euro
 * feature the claim pays between 5.75m and 5.96m EUR, measured across three
 * seeds, against a filing fee of six thousand. The cents move with who was cast
 * and from where, so the figure is a band and not a number. It is the most
 * expensive button in the build and the only way to lose it is to not press it.
 *
 * Flat, and not a figure that climbs as the date comes nearer. A climbing one
 * was considered and refused: `openDecisions` already breaks ties on `dueAt`,
 * so proximity already decides the order, and Home already prints the date in
 * words beside the row. A ramp would have moved the colored stripe and the
 * sentence in the drill-down and nothing else, which is decoration.
 */
const CLAIM_URGENCY = 86;

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
  theClaimsStillOpen(sim);
  expireDecisions(sim);
  prune(sim);
  // And whatever is shooting on the lot goes looking for people. It rides this
  // tick rather than one of its own because it is a question asked of a table
  // that already exists — the bookings — and a second heartbeat to ask it would
  // be a second thing to keep in step with the first.
  whatIsGoing(sim);
}

/**
 * The one dated thing in the build that nobody was ever told about.
 *
 * The dates in this save come in three sorts, and until now this was the only
 * one of the middle sort. Some dates bite and announce themselves: a picture
 * past its delivery date notifies twice, once for the work that is not done and
 * once for the elements that are not filed, and an audition arrives with the
 * last day anybody is seen printed in the body of the notice. Some dates are
 * printed and toothless: a registration's `renewsAt` and a holding's
 * `expiresAt` are rendered on the Family Business screen and read by nothing in
 * the engine at all, so the day comes and goes and the world does not notice.
 *
 * And this one bit without ever announcing itself. `whyNot` shuts the door on
 * the first day of photography, and the only place the date had ever appeared
 * was a `Stat` inside a modal the player has to already know to open. A hundred
 * and five days of runway on a twenty million euro feature, seventeen or
 * eighteen notices across it — the count moves with the seed — about crew and
 * prep and stages and the VAT return, and not one word about a claim worth the
 * better part of six million euro against a filing fee of six thousand.
 *
 * ## Why this rides the world tick and not the greenlight
 *
 * A picture's runway is not known when it is greenlit. `turnsOverOn` reads the
 * base window off the plan, the reimbursement door reads `capabilitiesOf`, and
 * both can change after the greenlight — a company with nobody in the
 * accountant's post cannot claim at all, and putting somebody in it is a
 * command the player runs whenever they like. Raised once at the greenlight,
 * the prompt would never reach the player who opened the books in week three.
 * Asked every two days, it reaches them at the next look and stops the day the
 * claim is filed, the day the camera turns over, or the day the scheme ends.
 *
 * ## It is a reminder, not a decision, and it says so
 *
 * There is one action on it because the world has one side. Filing on the first
 * open day and filing on the last were played out to the money landing across
 * four budgets — 2m, 5m, 20m and 40m euro — and several seeds each, both arms
 * stepped a day at a time on the same pattern so that the filing date is the
 * only thing that differs: same rate, same certified spend, same cents paid,
 * same closing balance, difference exactly nought in every pair. Stepping the
 * two arms differently is what produces a spurious difference here, and it is
 * the instrument rather than the world. Waiting never costs anything and filing never
 * costs anything but the fee, so a second button reading "Wait" would be a
 * choice the simulation cannot price. The Decision Center is the room for a
 * dated prompt; this is the chore with the biggest number on it.
 */
function theClaimsStillOpen(sim: Simulation): void {
  // Waved away is waved away. `requireDecision` merges only into rows that are
  // still open, so without this the next tick would put the same prompt back
  // two days later under a new id, and Dismiss would be a button that undoes
  // itself. The dismissal is read off the row it is written on, which `prune`
  // keeps for as long as the date it was about is still ahead.
  const wavedAway = new Set<Id>();
  for (const decision of Object.values(sim.universe.decisions)) {
    if (decision.category !== CLAIM_DECISION || decision.dismissedAt === undefined) continue;
    if (decision.refId !== undefined) wavedAway.add(decision.refId);
  }

  for (const project of Object.values(sim.universe.projects)) {
    if (wavedAway.has(project.id)) continue;
    // A title that is only optioned has no dates at all, which is the ordinary
    // state of most of the slate. Asked first because it is the cheaper of the
    // two and because `dueAt` below wants a date that cannot be undefined —
    // widening it there is what a mutation of this line turns into a type
    // error. Not for the reason an earlier note gave: `whyNot` answers
    // 'no-dates' off the same window before it ever reaches `capabilitiesOf`,
    // so this saves a call and not the walk.
    const shuts = turnsOverOn(project);
    if (shuts === undefined || whyNot(sim, project) !== undefined) continue;
    sim.requireDecision({
      urgency: CLAIM_URGENCY,
      category: CLAIM_DECISION,
      title: `${project.title}: File The Reimbursement Claim`,
      // A quarter is the round figure and it is honest at both rates: played
      // to the money landing across three seeds, what came back was 21.4 to
      // 21.5% of the budget on a two million euro picture at the lower rate
      // and 28.8 to 29.8% on a twenty million euro one at the higher.
      detail: `The application closes on the first day of photography, ${formatDate(shuts, sim.homeZone)}, `
        + 'and it never reopens. Waiting costs nothing and forgetting costs about a quarter of the negative.',
      route: '/workspace/business',
      actions: [{
        label: 'File The Claim',
        commandKind: 'company.claim_rebate',
        payload: { projectId: project.id },
      }],
      dueAt: shuts,
      refType: 'project',
      refId: project.id,
    });
  }
}

/**
 * Decisions do not sit in the list forever, and there are two ways one ends.
 *
 * A dated thing ends on its date: the day passes, the door it was about is
 * shut, and there is nothing left to answer. An undated thing ends because
 * ninety days of being ignored is itself an answer.
 *
 * The season rule deliberately does not touch a dated row, and this is the
 * correction rather than the original. Measured, on a twenty million euro
 * feature greenlit on 9 January 2026: the row is raised 11 January, the door
 * shuts 24 April, and the old rule waved it away on 13 April — eleven days
 * before its own date, with the claim still worth about six million euro and
 * still filable.
 *
 * And it stayed quiet for the whole of the rest of the runway. An earlier note
 * here said a second row went up two days later and the list was dark for only
 * three days; that was measured on a tree without the dismissal check below,
 * and it is not what this code does. `theClaimsStillOpen` skips a picture that
 * carries a waved-away row and cannot tell the player's Dismiss from the season
 * rule's, so the auto-dismissal reads as an answer and the raiser never speaks
 * again: one id, and the list dark for all eleven remaining days. That is worse
 * than the churn, not better, and it is the reason for the exemption. A raiser
 * that put a date on a row has already chosen where the row ends.
 *
 * Which leaves an assumption worth saying out loud, because one line undoes it:
 * `dismissedAt` on a dated row means the player, and it means that only because
 * the branch above is the only other thing that could ever have written it.
 */
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
