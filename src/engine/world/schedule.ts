/**
 * SLATE — laying a picture out in months, and pricing it by doing so.
 *
 * The budget is never entered. It is what falls out of putting the departments on a
 * calendar, and this file is the arithmetic that does it. `content/departments.ts`
 * holds the shape and the reasoning; this holds the walk.
 *
 * ## What makes this worth having rather than a multiplier
 *
 * Change any one input and the figure moves for a reason you can name:
 *
 * - hire a better team into a department and **its rate rises**, so the picture costs
 *   more and takes exactly as long
 * - take material that asks more of a department and **its months rise**, so the
 *   picture costs more *and* takes longer
 * - take material that asks nothing of a department and **it is not there at all**,
 *   which is what makes a small picture small rather than a large one with blank rows
 *
 * And because a phase is as long as its longest department rather than the sum of
 * them, there is always one department that is the reason the picture is not finished
 * — and shortening any other one saves money and no time. That is a fact about
 * schedules that nobody had to write a rule for; it falls out of the max.
 *
 * ## Dates rather than durations
 *
 * The phases are handed back as real windows against the world clock, consecutively,
 * because a delivery date the player can read is the only version of a schedule that
 * can be argued with. Months are added through the same helper the rest of the build
 * uses, so a picture that starts in January ends on a date a calendar agrees with.
 */

import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import { addMonths } from '../core/time';
import type { Demands } from '../content/material';
import type { Project } from '../domain/company';
import { TEMPERAMENT_BY_ID } from '../content/people';
import type { Department, Phase } from '../content/departments';
import {
  BEST_TEAM, LEAST_TEAM, PHASES, PHASE_SAID, departmentsIn, monthsFor, rateFor,
} from '../content/departments';

/** What one department costs and how long it is at work. */
export interface Line {
  department: Department;
  /** The level this team was hired at, which is what its rate was priced off. */
  level: number;
  /**
   * The rung its work is read at, which a temperament can move away from the rung
   * that was paid for. An exacting department delivers above its pay grade and a
   * brisk one below it, and this is the number a picture’s take reads.
   */
  reads: number;
  months: number;
  /** What one month of it costs. */
  rateCents: Money;
  /** The two multiplied, which is the only place this figure comes from. */
  costCents: Money;
}

/** One phase, laid out. */
export interface Laid {
  phase: Phase;
  label: string;
  /** Only the departments this picture actually needs. */
  lines: readonly Line[];
  /** As long as the longest department in it. */
  months: number;
  /** The sum of its departments. */
  costCents: Money;
  /** Which department is the reason it takes as long as it does. */
  bindingId?: string;
  from: Instant;
  to: Instant;
}

export interface Schedule {
  phases: readonly Laid[];
  /** Every phase's months, added, because the phases run one after another. */
  months: number;
  /** Every phase's cost, added. This is what a budget is. */
  budgetCents: Money;
  from: Instant;
  /** When it would be finished, which is the date a player actually argues with. */
  deliversAt: Instant;
}

/**
 * Who is on a department: either a bare rung, or somebody in particular.
 *
 * A bare number means "a team at that rung, with nothing remarkable about them". That
 * is what the whole game was before people existed, and it is still what an instrument
 * wants when it is isolating the rung and nothing else — `tools/slate.mjs` compares
 * five rungs on one property, and would learn less about the rung if each one also
 * arrived with a temperament attached.
 *
 * A `Hired` is a real engagement, and it carries the three multipliers a temperament
 * moves. They arrive as plain numbers rather than as the temperament itself, so this
 * file stays arithmetic: it prices what it is handed and never looks anybody up.
 */
export interface Hired {
  level: number;
  /** Multiplies what a month costs. One is somebody who keeps to a budget. */
  spends: number;
  /** Multiplies how many months it takes. One is somebody who works to a schedule. */
  takes: number;
  /** Moves the rung the craft is read at. Nought is somebody with no habits. */
  lifts: number;
}

export type Staffed = number | Hired;

export type Levels = Readonly<Record<string, Staffed>>;

/** Whichever of the two was handed in, as the fuller one. */
export const asHired = (one: Staffed | undefined): Hired => (
  typeof one === 'number' || one === undefined
    ? { level: one ?? LEAST_TEAM, spends: 1, takes: 1, lifts: 0 }
    : one
);

/** One department's line, or nothing where the picture does not need it. */
function lineFor(department: Department, demands: Demands, levels: Levels): Line | undefined {
  const asked = monthsFor(department, demands);
  if (asked <= 0) return undefined;
  const hired = asHired(levels[department.id]);

  // The material asks for the months and whoever answers moves them. Rounded to a
  // whole month and never below one, because half a month of a department is not
  // something a call sheet can say, and a department on the picture for no time at
  // all is a department that is not on it.
  const months = Math.max(1, Math.round(asked * hired.takes));
  const rateCents = Math.round(rateFor(department, hired.level) * hired.spends);

  // The rung the work is read at, which is not always the rung that was paid for.
  const reads = Math.max(LEAST_TEAM, Math.min(BEST_TEAM, hired.level + hired.lifts));

  return {
    department, level: hired.level, reads, months, rateCents, costCents: rateCents * months,
  };
}

/**
 * Lays a picture out from what it asks for and who was hired to answer.
 *
 * Pure. It reads no simulation and writes nothing, which is what lets the same
 * function price a prospect the player is only considering and the picture they
 * actually commit to — and is why the figure on the screen before the decision and
 * the figure charged after it can never be two different answers.
 */
export function layOut(demands: Demands, levels: Levels, from: Instant, zone: string): Schedule {
  const phases: Laid[] = [];
  let at = from;
  let months = 0;
  let budgetCents = 0;

  for (const phase of PHASES) {
    const lines = departmentsIn(phase)
      .map((one) => lineFor(one, demands, levels))
      .filter((one): one is Line => one !== undefined);

    // A phase with nothing in it is not a phase. A picture that asks nothing of prep
    // starts shooting, rather than waiting a month for an empty room.
    if (lines.length === 0) continue;

    const phaseMonths = lines.reduce((most, one) => Math.max(most, one.months), 0);
    const binding = lines.find((one) => one.months === phaseMonths);
    const costCents = lines.reduce((sum, one) => sum + one.costCents, 0);
    const to = addMonths(at, phaseMonths, zone);

    phases.push({
      phase,
      label: PHASE_SAID[phase],
      lines,
      months: phaseMonths,
      costCents,
      bindingId: binding?.department.id,
      from: at,
      to,
    });

    at = to;
    months += phaseMonths;
    budgetCents += costCents;
  }

  return { phases, months, budgetCents, from, deliversAt: at };
}

/**
 * Who is on each department, in the shape this file prices.
 *
 * The join between a person and the arithmetic. Everything above knows nothing about
 * temperaments and should not — it prices what it is handed — so the three
 * multipliers are looked up here and passed across as plain numbers.
 */
export function staffingOf(project: Project): Levels {
  const out: Record<string, Hired> = {};
  for (const [departmentId, one] of Object.entries(project.hires ?? {})) {
    const temperament = TEMPERAMENT_BY_ID[one.temperamentId];
    out[departmentId] = {
      level: one.standing,
      spends: temperament?.spends ?? 1,
      takes: temperament?.takes ?? 1,
      lifts: temperament?.lifts ?? 0,
    };
  }
  return out;
}

/**
 * Re-dates every engagement on a picture from the schedule it now has.
 *
 * The windows are derived rather than typed, because a department's months depend on
 * who is in the *other* departments: a phase is as long as its longest line, so
 * hiring an exacting designer moves the shooting unit's start date. Storing the dates
 * somebody was hired for and never revisiting them would have given two answers to
 * when a person is busy, and the wrong one would have been the stored one.
 */
export function restamp(
  project: Project, demands: Demands, from: Instant, zone: string,
): void {
  if (!project.hires) return;
  const laid = layOut(demands, staffingOf(project), from, zone);
  for (const phase of laid.phases) {
    for (const line of phase.lines) {
      const one = project.hires[line.department.id];
      if (!one) continue;
      one.from = phase.from;
      // The line's own months, not the phase's. A department that finishes before the
      // phase does is free before the phase is, which is part of what makes a short
      // line worth hiring.
      one.to = addMonths(phase.from, line.months, zone);
    }
  }
}

/**
 * The one department holding a picture up, across the whole schedule.
 *
 * The longest single department in the longest phase. Worth naming on a screen,
 * because "what is this waiting on" has an answer and a player who cannot see it will
 * spend money shortening something that was never the problem.
 */
export function whatHoldsItUp(schedule: Schedule): Line | undefined {
  let worst: Line | undefined;
  for (const phase of schedule.phases) {
    for (const line of phase.lines) {
      if (!worst || line.months > worst.months) worst = line;
    }
  }
  return worst;
}
