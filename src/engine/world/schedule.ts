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
import type { Department, Phase } from '../content/departments';
import {
  LEAST_TEAM, PHASES, PHASE_SAID, departmentsIn, monthsFor, rateFor,
} from '../content/departments';

/** What one department costs and how long it is at work. */
export interface Line {
  department: Department;
  /** The level this team was hired at. */
  level: number;
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

/** What level a department was hired at, by department id. Absent means the floor. */
export type Levels = Readonly<Record<string, number>>;

/** One department's line, or nothing where the picture does not need it. */
function lineFor(department: Department, demands: Demands, levels: Levels): Line | undefined {
  const months = monthsFor(department, demands);
  if (months <= 0) return undefined;
  const level = levels[department.id] ?? LEAST_TEAM;
  const rateCents = rateFor(department, level);
  return { department, level, months, rateCents, costCents: rateCents * months };
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
