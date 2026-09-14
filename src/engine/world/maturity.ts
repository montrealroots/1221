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

import type { Project } from '../domain/company';
import type { DimensionId } from '../content/maturity';
import {
  DIMENSIONS, bottomOf, dimensionById, rungsOf, terminalOf,
} from '../content/maturity';

/** Which ladder set a project is measured against. */
export const laddersOf = (project: Project): string => project.ladders ?? 'picture';

/** Where one dimension stands, as a rung id. */
export function rungOf(project: Project, dimension: DimensionId): string {
  return project.maturity?.[dimension] ?? bottomOf(laddersOf(project), dimension);
}

/** How far up its ladder one dimension has come, as a step count. */
export function stepOf(project: Project, dimension: DimensionId): number {
  const rungs = rungsOf(laddersOf(project), dimension);
  const at = rungs.findIndex((r) => r.id === rungOf(project, dimension));
  return at < 0 ? 0 : at;
}

/** That dimension's progress, 0 to 1. */
export function shareOf(project: Project, dimension: DimensionId): number {
  const rungs = rungsOf(laddersOf(project), dimension);
  return rungs.length > 1 ? stepOf(project, dimension) / (rungs.length - 1) : 1;
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

/** Whether every dimension has reached the end of its ladder. */
export function isFinished(project: Project): boolean {
  const ladders = laddersOf(project);
  return DIMENSIONS.every((d) => rungOf(project, d.id) === terminalOf(ladders, d.id));
}

/** The dimensions that are not yet finished, worst first. */
export function holdingItUp(project: Project): DimensionId[] {
  return DIMENSIONS
    .map((d) => d.id)
    .filter((id) => shareOf(project, id) < 1)
    .sort((a, b) => shareOf(project, a) - shareOf(project, b));
}

/**
 * Moves one dimension to a named rung.
 *
 * Refuses to move it backward. Going down is a regression and has its own
 * function, because a regression is an event somebody should be told about and
 * a promotion is routine.
 */
export function advance(project: Project, dimension: DimensionId, to: string): boolean {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((r) => r.id === to);
  if (want < 0 || want <= stepOf(project, dimension)) return false;
  project.maturity = { ...(project.maturity ?? {}), [dimension]: to };
  return true;
}

/**
 * Sends one dimension back down, and says what it cost.
 *
 * The reason this is a ladder. A withdrawn consent does not pause a season, it
 * un-finishes it: rights drops to the bottom, and because picture was built on
 * top of the thing that has to come out, picture drops too. Everything below
 * the knock stays where it is, which is why a regression is cheap early and
 * ruinous late.
 */
export function knockBack(
  project: Project, dimension: DimensionId, to: string,
): { fell: number } {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((r) => r.id === to);
  const was = stepOf(project, dimension);
  if (want < 0 || want >= was) return { fell: 0 };
  project.maturity = { ...(project.maturity ?? {}), [dimension]: to };
  return { fell: was - want };
}

/** Where a picture stands on its dimensions, in a sentence. */
export function whereTheWorkStands(project: Project): string {
  if (isFinished(project)) return 'Every part of it is finished.';
  const worst = holdingItUp(project);
  const first = worst[0];
  if (first === undefined) return 'Every part of it is finished.';
  const dimension = dimensionById(first)!;
  const rungs = rungsOf(laddersOf(project), first);
  const at = rungs[stepOf(project, first)]!;
  const share = Math.round(doneShare(project) * 100);
  return `${share}/100 finished, held there by ${dimension.label.toLowerCase()}: ${at.label.toLowerCase()}. `
    + `${dimension.holdsUp}`;
}
