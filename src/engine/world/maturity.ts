/**
 * SLATE — reading and moving the maturity vector.
 *
 * `content/maturity.ts` says what the dimensions and their ladders are. This
 * reads where a picture actually stands on them, moves it up as periods
 * finish, and knocks it back down when something goes wrong.
 *
 * ## Nothing here stores how far along anything is
 *
 * The vector stores one rung id per dimension and that is all. Every figure a
 * screen prints — how far along, what is holding it up, whether it can be
 * delivered — is recomputed from those six strings and the ladder the plan
 * names. The research is blunt about why: "how far along is this" is never a
 * field, and a stored percentage is a number that drifts from the thing it
 * claims to describe.
 *
 * ## The minimum, and only the minimum
 *
 * `doneShare` takes the lowest dimension and ignores the rest. That is not a
 * simplification, it is the point. An episode that is locked, mixed, mastered
 * and missing one contributor's consent is not five sixths finished. It is
 * worth nothing, and it stays worth nothing until somebody signs.
 */

import type { Part, Project } from '../domain/company';
import type { DimensionId } from '../content/maturity';
import {
  DIMENSIONS, bottomOf, dimensionById, rungsOf, terminalOf,
} from '../content/maturity';

/** Which ladder set a project is measured against. */
export const laddersOf = (project: Project): string => project.ladders ?? 'picture';

/**
 * The parts a project owes.
 *
 * A project with none behaves as one unnamed part of its whole runtime, so
 * everything below works on a picture that predates parts existing without a
 * special case anywhere.
 */
export function partsOf(project: Project): Part[] {
  if (project.parts?.length) return project.parts;
  return [{ id: `${project.id}-1`, ordinal: 1, seconds: project.owesSeconds ?? 1 }];
}

/** Seconds of finished screen time the whole thing owes. */
export const owedSeconds = (project: Project): number =>
  partsOf(project).reduce((n, part) => n + part.seconds, 0);

// ---------------------------------------------------------------------------
// Where one part stands
// ---------------------------------------------------------------------------

/** Where one dimension of one part stands, as a rung id. */
export function rungOfPart(project: Project, part: Part, dimension: DimensionId): string {
  return part.maturity?.[dimension] ?? bottomOf(laddersOf(project), dimension);
}

/** How far up its ladder one dimension of one part has come, as a step count. */
export function stepOfPart(project: Project, part: Part, dimension: DimensionId): number {
  const rungs = rungsOf(laddersOf(project), dimension);
  const at = rungs.findIndex((r) => r.id === rungOfPart(project, part, dimension));
  return at < 0 ? 0 : at;
}

/** That part's progress on that dimension, 0 to 1. */
export function shareOfPart(project: Project, part: Part, dimension: DimensionId): number {
  const rungs = rungsOf(laddersOf(project), dimension);
  return rungs.length > 1 ? stepOfPart(project, part, dimension) / (rungs.length - 1) : 1;
}

// ---------------------------------------------------------------------------
// Where the whole thing stands
// ---------------------------------------------------------------------------

/**
 * One dimension across every part, weighted by runtime.
 *
 * Runtime-weighted and not part-counted, because parts are not the same size
 * and the thing being sold is screen time. A forty-minute episode that is
 * locked is worth more of a season than a twenty-minute one that is, and
 * counting episodes rather than seconds would say they were equal.
 */
export function shareOf(project: Project, dimension: DimensionId): number {
  const parts = partsOf(project);
  const total = parts.reduce((n, part) => n + part.seconds, 0);
  if (total <= 0) return 0;
  const done = parts.reduce((n, part) => n + part.seconds * shareOfPart(project, part, dimension), 0);
  return done / total;
}

/**
 * How far along the whole thing is.
 *
 * The minimum across every dimension. Never the average, never the picture,
 * never a weighted blend — all three of which would say a finished, uncleared
 * episode is nearly done, and it is not.
 */
export function doneShare(project: Project): number {
  return Math.min(...DIMENSIONS.map((d) => shareOf(project, d.id)));
}

/**
 * Seconds of runtime at or beyond a rung, on one dimension.
 *
 * The measure a story reel is actually read off — "percent of runtime at or
 * beyond lit" — and it generalizes to everything else without modification.
 */
export function secondsAtOrBeyond(
  project: Project, dimension: DimensionId, rung: string,
): number {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((r) => r.id === rung);
  if (want < 0) return 0;
  return partsOf(project)
    .filter((part) => stepOfPart(project, part, dimension) >= want)
    .reduce((n, part) => n + part.seconds, 0);
}

/** Whether every part has reached the end of every ladder. */
export function isFinished(project: Project): boolean {
  const ladders = laddersOf(project);
  return partsOf(project).every((part) => DIMENSIONS
    .every((d) => rungOfPart(project, part, d.id) === terminalOf(ladders, d.id)));
}

/**
 * Where a dimension stands across the whole thing, as one rung id.
 *
 * The lowest rung any part is on, because that is what the thing as a whole
 * has actually reached. A season whose first episode is locked and whose
 * eighth is a stringout has not reached lock.
 */
export function rungOf(project: Project, dimension: DimensionId): string {
  const rungs = rungsOf(laddersOf(project), dimension);
  const lowest = Math.min(...partsOf(project).map((part) => stepOfPart(project, part, dimension)));
  return rungs[lowest]?.id ?? rungs[0]!.id;
}

/** The dimensions that are not yet finished, worst first. */
export function holdingItUp(project: Project): DimensionId[] {
  return DIMENSIONS
    .map((d) => d.id)
    .filter((id) => shareOf(project, id) < 1)
    .sort((a, b) => shareOf(project, a) - shareOf(project, b));
}

/** The parts that are not finished, least finished first. */
export function partsOutstanding(project: Project): Part[] {
  const worst = (part: Part): number =>
    Math.min(...DIMENSIONS.map((d) => shareOfPart(project, part, d.id)));
  return partsOf(project).filter((part) => worst(part) < 1).sort((a, b) => worst(a) - worst(b));
}

// ---------------------------------------------------------------------------
// Moving it
// ---------------------------------------------------------------------------

/** Writes a rung onto one part, without asking whether it should. */
function put(project: Project, part: Part, dimension: DimensionId, to: string): void {
  const next = { ...(part.maturity ?? {}), [dimension]: to };
  part.maturity = next;
  if (!project.parts) project.parts = [part];
}

/**
 * Moves one dimension of one part to a named rung.
 *
 * Refuses to move it backward. Going down is a regression and has its own
 * function, because a regression is an event somebody should be told about and
 * a promotion is routine.
 */
export function advancePart(
  project: Project, part: Part, dimension: DimensionId, to: string,
): boolean {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((r) => r.id === to);
  if (want < 0 || want <= stepOfPart(project, part, dimension)) return false;
  put(project, part, dimension, to);
  return true;
}

/** Moves one dimension on every part. */
export function advance(project: Project, dimension: DimensionId, to: string): boolean {
  let moved = false;
  for (const part of partsOf(project)) {
    if (advancePart(project, part, dimension, to)) moved = true;
  }
  return moved;
}

/**
 * Sends one dimension back down, across every part, and says how far it fell.
 *
 * The reason this is a ladder. A withdrawn consent does not pause a season, it
 * un-finishes it, and because the thing that has to come out was cut into an
 * episode, everything built on top of it falls with it. A regression is cheap
 * early and ruinous late, and that is entirely a function of how far up the
 * ladder the work had got.
 */
export function knockBack(
  project: Project, dimension: DimensionId, to: string,
): { fell: number } {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((r) => r.id === to);
  if (want < 0) return { fell: 0 };
  let fell = 0;
  for (const part of partsOf(project)) {
    const was = stepOfPart(project, part, dimension);
    if (want >= was) continue;
    put(project, part, dimension, to);
    fell = Math.max(fell, was - want);
  }
  return { fell };
}

/** Sends one named part back down, which is how a single episode gets pulled. */
export function knockBackPart(
  project: Project, part: Part, dimension: DimensionId, to: string,
): { fell: number } {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((r) => r.id === to);
  const was = stepOfPart(project, part, dimension);
  if (want < 0 || want >= was) return { fell: 0 };
  put(project, part, dimension, to);
  return { fell: was - want };
}

// ---------------------------------------------------------------------------
// Saying it
// ---------------------------------------------------------------------------

const asClock = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${String(minutes % 60).padStart(2, '0')}m` : `${minutes}m`;
};

/** Where a picture stands on its dimensions, in a sentence. */
export function whereTheWorkStands(project: Project): string {
  const owed = owedSeconds(project);
  const parts = partsOf(project);
  const owes = parts.length > 1
    ? `${parts.length} parts, ${asClock(owed)} in all`
    : asClock(owed);
  if (isFinished(project)) return `Every part of it is finished. ${owes}.`;
  const first = holdingItUp(project)[0];
  if (first === undefined) return `Every part of it is finished. ${owes}.`;
  const dimension = dimensionById(first)!;
  const share = Math.round(doneShare(project) * 100);
  const at = Math.round(shareOf(project, first) * 100);
  return `${share}/100 finished across ${owes}, held there by ${dimension.label.toLowerCase()} at ${at}/100. `
    + `${dimension.holdsUp}`;
}
