/**
 * SLATE — what a picture is made of, and why a budget is a product rather than a figure.
 *
 * `Project.budgetCents` has existed since before the first teardown and **nothing has
 * ever written to it**. It survived two deletions as a declared word with no writer,
 * which is the defect this build has a tool for. This file and `world/schedule.ts` are
 * what finally fill it, and they fill it the only way the house rule allows: as a sum
 * of things that were each computed from something.
 *
 * ## The shape
 *
 * ```
 * department cost = its monthly rate (what the team you hired costs)
 *                 × its months       (what the material demands of it)
 *
 * phase cost      = Σ of its departments' costs
 * phase months    = MAX of its departments' months
 * budget          = Σ of the phases
 * ```
 *
 * Costs add and durations do not, because departments inside a phase **work at the
 * same time**. Two consequences fall straight out and neither needed a rule of its
 * own: one department is always the reason a phase is as long as it is, and cutting a
 * department that was never the longest saves money and no time at all.
 *
 * ## Why a department earns its place
 *
 * Each one reads a demand for its **months** and a team level for its **rate**, and no
 * two read the same pair. A department that shared both with another would be the same
 * department twice with a different label — which is the version of this that looks
 * deep and is not.
 *
 * The set is small on purpose. Five that each move the schedule differently are worth
 * more than fifteen that mostly move together, and this build has deleted enough
 * elaborate content tables nothing read to be careful about it.
 */

import type { Money } from '../core/money';
import type { Demands } from './material';

/** The three phases a picture runs through, in order. */
export type Phase = 'prep' | 'shoot' | 'post';

export const PHASES: readonly Phase[] = ['prep', 'shoot', 'post'];

export const PHASE_SAID: Readonly<Record<Phase, string>> = {
  prep: 'Pre-Production',
  shoot: 'Production',
  post: 'Post-Production',
};

/** Which of a property's demands a department answers to. */
export type Demanded = keyof Demands;

export interface Department {
  id: string;
  label: string;
  phase: Phase;
  /** The demand that decides how long this department is at work. */
  reads: Demanded;
  /**
   * Months at the lowest demand, and how many more each further point of it adds.
   *
   * Two numbers rather than a table, because a department's length is a line and
   * writing it as six rows would invite six rows of drift.
   */
  months: { atLeast: number; perPoint: number };
  /**
   * What one month of this department costs at team level one, and what each further
   * level adds.
   *
   * The level is the player's decision and the demand is the material's, which is the
   * whole separation this engine exists to make legible: you choose what you spend per
   * month, the property chooses how many months you spend it for.
   */
  rate: { atLevelOne: Money; perLevel: Money };
}

/**
 * Five departments, each answering to a different demand in a different phase.
 *
 * Read down the `reads` column and no pair repeats inside a phase, which is the test
 * a department has to pass to be here at all. **Scope** reaches all three phases
 * because size is not something one department owns. **Spectacle** reaches the floor
 * and the finish and nothing before them, because you cannot prepare your way out of
 * an effect. **Period** reaches design and the floor and stops at the cut, because a
 * world that has been built is built by the time anybody edits it.
 */
export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'design',
    label: 'Design And Build',
    phase: 'prep',
    reads: 'period',
    months: { atLeast: 1, perPoint: 0.6 },
    rate: { atLevelOne: 90_000_00, perLevel: 55_000_00 },
  },
  {
    id: 'planning',
    label: 'Scheduling And Locations',
    phase: 'prep',
    reads: 'scope',
    months: { atLeast: 1, perPoint: 0.35 },
    rate: { atLevelOne: 45_000_00, perLevel: 20_000_00 },
  },
  {
    id: 'unit',
    label: 'The Unit',
    phase: 'shoot',
    reads: 'scope',
    months: { atLeast: 1, perPoint: 0.8 },
    rate: { atLevelOne: 320_000_00, perLevel: 180_000_00 },
  },
  {
    id: 'effects',
    label: 'Effects On The Floor',
    phase: 'shoot',
    reads: 'spectacle',
    months: { atLeast: 0, perPoint: 0.7 },
    rate: { atLevelOne: 140_000_00, perLevel: 110_000_00 },
  },
  {
    id: 'cutting',
    label: 'The Cutting Room',
    phase: 'post',
    reads: 'scope',
    months: { atLeast: 2, perPoint: 0.5 },
    rate: { atLevelOne: 60_000_00, perLevel: 30_000_00 },
  },
  {
    id: 'finishing',
    label: 'Finishing And Sound',
    phase: 'post',
    reads: 'spectacle',
    months: { atLeast: 1, perPoint: 0.9 },
    rate: { atLevelOne: 110_000_00, perLevel: 95_000_00 },
  },
];

export const DEPARTMENT_BY_ID: Readonly<Record<string, Department>> =
  Object.fromEntries(DEPARTMENTS.map((one) => [one.id, one]));

/** The departments working in one phase. */
export const departmentsIn = (phase: Phase): readonly Department[] =>
  DEPARTMENTS.filter((one) => one.phase === phase);

/** The lowest and highest a team can be hired at. */
export const LEAST_TEAM = 1;
export const BEST_TEAM = 5;

/**
 * How many months a department works, given what the material asks of it.
 *
 * Rounded to whole months, because the clock this feeds is monthly and a schedule that
 * ran in fractions would produce dates nobody could act on. A department whose demand
 * rounds it to nothing **does not exist on that picture** — that is what makes a small
 * film feel small rather than like a large one with empty lines on it.
 */
export function monthsFor(department: Department, demands: Demands): number {
  const asked = demands[department.reads];
  return Math.max(0, Math.round(department.months.atLeast + department.months.perPoint * asked));
}

/** What one month of a department costs, at the level it was hired at. */
export function rateFor(department: Department, level: number): Money {
  const at = Math.max(LEAST_TEAM, Math.min(BEST_TEAM, Math.round(level)));
  return department.rate.atLevelOne + department.rate.perLevel * (at - LEAST_TEAM);
}
