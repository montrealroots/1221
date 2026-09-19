/**
 * SLATE — a picture in flight, walked month by month.
 *
 * The greenlight stores one instant and `world/schedule.ts` turns it into dated
 * phases. Until now nothing read those dates: a picture was greenlit and then stayed
 * greenlit, because no clock ever looked at it again. This is the clock.
 *
 * ## Derived, never incremented
 *
 * A picture's stage is **worked out from the date**, not stepped forward a notch each
 * month. The tick applies what the calendar already implies and says so when it
 * changes; it never adds one to anything.
 *
 * That matters for a reason this build has been bitten by before. A counter advanced
 * per tick is wrong the moment a tick is missed, run twice, or replayed from a save —
 * and the ledger's own rule is the same idea about money: a balance is the sum of
 * postings rather than a figure somebody maintained. A stage that is a function of
 * `greenlitAt`, the material's demands and who was hired cannot drift from the
 * schedule that produced it, because it *is* that schedule read at a moment.
 *
 * ## One sweep rather than a tick per picture
 *
 * A recurring item per project would be the obvious shape and is the wrong one here:
 * the scheduler would carry one entry per picture in flight, all firing on the same
 * day, each doing a few milliseconds of arithmetic. A single monthly walk over
 * whatever is in flight costs the same work with one entry, and there is nothing a
 * per-picture item would buy — the phases are already dated, so nothing needs waking
 * at a particular moment.
 */

import type { Simulation } from '../core/simulation';
import type { Instant } from '../core/time';
import { addMonths } from '../core/time';
import type { Project, Stage } from '../domain/company';
import type { Phase } from '../content/departments';
import { layOut } from './schedule';
import { parentCompany, projectsOf } from './company';
import { startOfNextMonth } from '../core/time';

export const PRODUCTION_MONTH_KIND = 'production.month';

/** What stage a picture is at while a given phase is running. */
const STAGE_OF: Readonly<Record<Phase, Stage>> = {
  prep: 'prep',
  shoot: 'shooting',
  post: 'post',
};

/** Everything the company has committed to and not yet finished. */
export const inFlight = (sim: Simulation): readonly Project[] =>
  projectsOf(sim.universe).filter(
    (one) => one.greenlitAt !== undefined && one.stage !== 'delivered',
  );

/**
 * Where a picture is at a given moment, read off its own schedule.
 *
 * Returns the stage the calendar implies. A picture past the end of its last phase is
 * delivered; one somehow asked about before it was greenlit is left where it is.
 */
export function stageAt(sim: Simulation, project: Project, at: Instant): Stage | undefined {
  if (project.greenlitAt === undefined) return undefined;
  const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
  if (!holding) return undefined;

  const laid = layOut(holding.demands, project.levels ?? {}, project.greenlitAt, sim.homeZone);
  for (const phase of laid.phases) {
    if (at < phase.to) return STAGE_OF[phase.phase];
  }
  return 'delivered';
}

/** When a picture will be finished, for anything that wants to say so. */
export function deliversAt(sim: Simulation, project: Project): Instant | undefined {
  if (project.greenlitAt === undefined) return undefined;
  const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
  if (!holding) return undefined;
  return layOut(holding.demands, project.levels ?? {}, project.greenlitAt, sim.homeZone).deliversAt;
}

export interface Moved {
  project: Project;
  from: Stage;
  to: Stage;
}

/**
 * Walks everything in flight up to where the calendar says it should be.
 *
 * Exported so a test or an instrument can advance a picture without waiting on the
 * scheduler, which is the same courtesy the rest of the build extends to its ticks.
 */
export function walkTheMonth(sim: Simulation, at: Instant = sim.now): readonly Moved[] {
  const moved: Moved[] = [];
  for (const project of inFlight(sim)) {
    const should = stageAt(sim, project, at);
    if (!should || should === project.stage) continue;
    moved.push({ project, from: project.stage, to: should });
    project.stage = should;
  }
  return moved;
}

/** What to say when a picture reaches a stage. */
const SAID: Readonly<Record<Stage, string>> = {
  idea: 'is an idea again',
  optioned: 'is optioned',
  writing: 'is being written',
  draft: 'has a draft',
  packaged: 'is packaged',
  greenlit: 'is greenlit',
  prep: 'has started prep',
  shooting: 'has started shooting',
  post: 'has wrapped and gone into post',
  delivered: 'is finished',
  shelved: 'is on the shelf',
};

export function registerProduction(sim: Simulation): void {
  sim.onSchedule(PRODUCTION_MONTH_KIND, (item, s) => {
    const company = parentCompany(s.universe);
    if (company) {
      for (const { project, to } of walkTheMonth(s, item.at)) {
        // Only the moves worth interrupting somebody for. A picture crossing into
        // post is the studio's business; the fact that prep is still prep is not.
        s.notify({
          category: 'business',
          title: `${project.title} ${SAID[to]}`,
          body: to === 'delivered'
            ? `${project.title} is finished. What happens to it now is a separate decision.`
            : `${project.title} ${SAID[to]}.`,
          importance: to === 'delivered' ? 65 : 40,
        });
      }
    }
    s.schedule({
      at: startOfNextMonth(item.at, s.homeZone),
      kind: PRODUCTION_MONTH_KIND,
      label: 'What Is In Flight',
      category: 'system',
      // After the company's month and the lot's, because a picture crossing into
      // post is news about a month the money has already been accounted for.
      priority: 8,
    });
  });

  if (!sim.universe.scheduled.some((one) => one.kind === PRODUCTION_MONTH_KIND && one.status === 'pending')) {
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: PRODUCTION_MONTH_KIND,
      label: 'What Is In Flight',
      category: 'system',
      priority: 8,
    });
  }
}

/** Kept for the scheduler's month arithmetic, and for tests that step by hand. */
export const aMonthOn = (at: Instant, zone: string): Instant => addMonths(at, 1, zone);
