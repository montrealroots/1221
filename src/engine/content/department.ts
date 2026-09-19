/**
 * SLATE — the departments, and the one thing that stops a dropdown being decoration.
 *
 * The deleted crew system had fourteen departments and twenty-four named posts, with
 * head flags, start weeks, union locals and budget floors. It also had no command,
 * so the engine drew the person and the player never chose. Worse, `somebodyNew`
 * said it in its own docstring: *nothing reads a gaffer's technique.* Fourteen
 * departments of declared words with nothing reading them, which is THE ONE RULE
 * broken fourteen times in one file.
 *
 * This is the smaller version that bites. Seven departments, not fourteen, and each
 * one earns its row by moving a named axis of the finished thing. The test applied
 * to every candidate was: if I staff this department with the worst person available
 * instead of the best, does a number the player sees change? Seven passed. The other
 * seven — transport, catering, locations, publicity, construction, medical, security
 * — did not, and they are not here. They can come back the day something reads them.
 *
 * ## The axes, and why there are only three
 *
 * A department moves one of three things, and three is the number because that is
 * how many the release actually reads:
 *
 *   - **craft** — how good the thing is, which becomes critical standing and word
 *     of mouth, which bends the run.
 *   - **draw** — how many people turn up at all, which is the height of the run.
 *   - **thrift** — how much of the budget survives contact with the schedule.
 *
 * A department that moved a fourth axis nothing reads would be back to the gaffer's
 * technique. So the axes came first and the departments were chosen to cover them.
 *
 * ## Why the head's standing is a band and not a number
 *
 * Because the player is choosing a person from a list, and a list of people with
 * scores on them is a spreadsheet. Four bands, named, with the price attached, is a
 * decision somebody can make without arithmetic — and the bands are far enough apart
 * that picking the cheap one is a real choice rather than an obvious mistake.
 */

/** What a department moves. Three, because three is what the release reads. */
export type Axis = 'craft' | 'draw' | 'thrift';

export const AXIS_SAID: Readonly<Record<Axis, string>> = {
  craft: 'how good it turns out',
  draw: 'how many people come',
  thrift: 'how much of the budget survives',
};

/**
 * What a department head costs and what they are worth, as four bands.
 *
 * `worth` is the multiplier on the department's `weight` when this band fills the
 * post. It runs below one at the bottom, which matters: a cheap head is not a
 * smaller benefit, it is an active drag, and a production staffed entirely at the
 * bottom finishes worse than one with the posts left to the engine's own pick.
 */
export interface Band {
  id: string;
  label: string;
  /** Multiplier on the department's weight. Below one at the bottom, on purpose. */
  worth: number;
  /** What this band is paid, per part, in cents. */
  perPartCents: number;
}

export const BANDS: readonly Band[] = [
  { id: 'starting', label: 'Starting Out', worth: 0.72, perPartCents: 4_000_00 },
  { id: 'working', label: 'Working', worth: 1.0, perPartCents: 11_000_00 },
  { id: 'sought', label: 'Sought After', worth: 1.28, perPartCents: 26_000_00 },
  { id: 'first', label: 'First Call', worth: 1.55, perPartCents: 58_000_00 },
];

export const BAND_BY_ID: Readonly<Record<string, Band>> = Object.fromEntries(
  BANDS.map((b) => [b.id, b]),
);

export const bandById = (id: string | undefined): Band | undefined =>
  (id === undefined ? undefined : BAND_BY_ID[id]);

/** The band the engine fills an unstaffed post with, so an unmade choice is not a hole. */
export const DEFAULT_BAND = 'working';

export interface Department {
  /** Stable id. Saved on the project. */
  id: string;
  /** What the department is called. */
  label: string;
  /** What the person filling it is called. */
  post: string;
  /** Which axis this department moves. */
  axis: Axis;
  /**
   * How much of that axis it accounts for, against the other departments on it.
   *
   * Relative rather than absolute: the axis is a weighted mean of the bands filling
   * every department on it, so these are shares and their scale does not matter.
   */
  weight: number;
  /** What this post is for, said to the person choosing. */
  what: string;
}

/**
 * The seven, and what each one is for.
 *
 * The director carries the most weight on craft by a distance, which is the one
 * place this file takes a position: a production is not a democracy of departments,
 * and a model where the sound designer and the director move the same amount would
 * be false to the thing it is modeling.
 */
export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'director',
    label: 'Direction',
    post: 'Director',
    axis: 'craft',
    weight: 40,
    what: 'Decides what it is. Everything below reads their taste, and a production '
      + 'survives a weak anything else more easily than a weak one of these.',
  },
  {
    id: 'writer',
    label: 'Writing',
    post: 'Writer',
    axis: 'craft',
    weight: 26,
    what: 'Whether there is anything underneath. The one department whose failure '
      + 'cannot be fixed later by spending more.',
  },
  {
    id: 'photography',
    label: 'Photography',
    post: 'Director of Photography',
    axis: 'craft',
    weight: 18,
    what: 'What it looks like, and how many hours a day the unit needs to get it.',
  },
  {
    id: 'cutting',
    label: 'The Cutting Room',
    post: 'Editor',
    axis: 'craft',
    weight: 16,
    what: 'What it turns out to have been. Recovers more bad days than anybody '
      + 'admits, and cannot recover all of them.',
  },
  {
    id: 'casting',
    label: 'Casting',
    post: 'Casting Director',
    axis: 'draw',
    weight: 62,
    what: 'Who is in it, which is most of the reason anybody turns up at all.',
  },
  {
    id: 'music',
    label: 'Music',
    post: 'Composer',
    axis: 'draw',
    weight: 38,
    what: 'What it feels like from outside — the trailer, the theme, the thing '
      + 'people have heard before they have seen anything.',
  },
  {
    id: 'production',
    label: 'Production',
    post: 'Line Producer',
    axis: 'thrift',
    weight: 100,
    what: 'Whether the schedule and the budget describe the same picture. The only '
      + 'post whose whole job is that the others can do theirs.',
  },
];

export const DEPARTMENT_BY_ID: Readonly<Record<string, Department>> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d]),
);

export const departmentById = (id: string | undefined): Department | undefined =>
  (id === undefined ? undefined : DEPARTMENT_BY_ID[id]);

/** The departments that move a given axis. */
export const departmentsOn = (axis: Axis): readonly Department[] =>
  DEPARTMENTS.filter((d) => d.axis === axis);

/**
 * How an axis stands, given who fills each post on it.
 *
 * A weighted mean of the filling bands' `worth`, so it lands near 1 for a normally
 * staffed production, under it for a cheaply staffed one and over it for an
 * expensive one. Posts with nobody in them count as `DEFAULT_BAND` rather than as
 * zero, because an unfilled post means the engine picked, not that nobody turned up.
 *
 * Returns a plain multiplier, which is what every reader downstream wants.
 */
export function axisStands(axis: Axis, staffing: Readonly<Record<string, string>>): number {
  const on = departmentsOn(axis);
  let weighted = 0;
  let total = 0;
  for (const dept of on) {
    const band = bandById(staffing[dept.id]) ?? BAND_BY_ID[DEFAULT_BAND]!;
    weighted += band.worth * dept.weight;
    total += dept.weight;
  }
  return total > 0 ? weighted / total : 1;
}

/**
 * What the heads cost, all in, for a production of this many parts.
 *
 * Per part rather than per week, because the thing being bought is the work on the
 * parts and a department head on a twelve-part series is doing twelve parts of work
 * whatever the schedule says.
 */
export function headsCostCents(staffing: Readonly<Record<string, string>>, parts: number): number {
  let cents = 0;
  for (const dept of DEPARTMENTS) {
    const band = bandById(staffing[dept.id]) ?? BAND_BY_ID[DEFAULT_BAND]!;
    cents += band.perPartCents * parts;
  }
  return cents;
}
