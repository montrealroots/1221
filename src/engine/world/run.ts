/**
 * SLATE — a release as a thing that happens over time, rather than a payment.
 *
 * This is the file the first pass did not have, and the reason it was torn out rather
 * than extended. `content/release.ts` describes twenty weeks of run and six windows
 * that each open on a stated week; the first pass reckoned all of it and posted the
 * lot at once, on the opening day. The windows carried an opening week that nothing
 * read, which is THE ONE RULE broken by the very system built to honor it.
 *
 * So a release is scheduled. It opens, and then for something over a year a weekly
 * tick pays what that week actually brought in: the opening channel decaying along a
 * bent curve, then the foreign sale arriving at week six, the home release at
 * fourteen, a service at thirty, a broadcaster at fifty-two. Money reaches the company
 * on the dates the windows say, the back end goes out to whoever took points as each
 * receipt lands, and a picture's profitability is a thing that develops rather than a
 * thing announced.
 *
 * ## What is reckoned once, and what is not
 *
 * The total an audience will pay is reckoned **once**, at the opening, and stored.
 * Everything after that is arithmetic on it.
 *
 * That is a decision and it is worth defending, because the tempting alternative is to
 * re-reckon every week so that late changes in the world can move a run in flight. It
 * would be wrong twice over. A release already out is not affected by what a rival
 * announces in month four — the audience for it has already been reached — and a
 * figure that moved under a player who was not watching would make the receipt a lie,
 * since the receipt explains a reckoning that no longer holds. The world decides the
 * opening; the opening decides the run.
 *
 * ## Why the tick is per picture rather than one sweep
 *
 * Because a run has a start date of its own and a weekly sweep would have to hold a
 * list of what started when, which is the scheduler's job and it already does it. One
 * recurring item per release, carrying its own project, canceled when the last window
 * shuts.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import { MS_WEEK } from './lot';
import type { Channel } from '../content/format';
import { formatById } from '../content/format';
import {
  LAST_WEEK_ANYTHING_PAYS, WEEKS_OF_RUN, runFor, windowsAfter,
} from '../content/release';
import { A_RUN_IS, standingAfter, thresholdOwed, type Deal } from '../content/talent';
import { payTheThreshold, reachesUs, receive, returnedBy } from './takings';
import { projectsOf } from './company';

export const RUN_KIND = 'release.week';

/**
 * What is known the moment a thing opens, and not revised afterwards.
 *
 * Stored on the project rather than in a table of its own. A release belongs to
 * exactly one picture and outlives nothing, so a second table would be a join to
 * maintain for no gain.
 */
export interface Opening {
  /** When it opened. */
  at: number;
  channel: Channel;
  campaignCents: Money;
  /** What an audience will pay across the whole run, reckoned once, here. */
  reckonedCents: Money;
  /** What the craft produced, which is what bends the curve. */
  wordOfMouth: number;
  /**
   * What the year did to the windows that had not opened yet.
   *
   * Absent until a ceremony. A win does not make a finished picture earn
   * retroactively — it makes the part of its life still ahead of it worth more,
   * which is why the multiplier lands here rather than at the reckoning.
   */
  liftedBy?: number;
  /** Whether the people on it have had the result written onto their records. */
  settled?: boolean;
  /** How many weeks of the run have been paid so far. */
  weeksPaid: number;
}

/**
 * The deals a picture is carrying, for the people who took a share.
 *
 * Both halves. A post is a job the picture has and a billed part is a person on the
 * screen, and either of them may be on points — so a settlement that read only the
 * posts would quietly stop paying the cast the moment the cast became a list.
 */
export function dealsOn(project: {
  engaged?: Record<string, { deal: Deal }>;
  billed?: Record<string, { deal: Deal }>;
}): readonly Deal[] {
  return [
    ...Object.values(project.engaged ?? {}),
    ...Object.values(project.billed ?? {}),
  ].map((one) => one.deal);
}

/**
 * What the opening channel pays in a given week of the run.
 *
 * Week one is the opening. Past the end of the curve it pays nothing, which is what
 * lets the same function answer for week three and week ninety without a guard at
 * every call site.
 */
export function openingWeek(opening: Opening, formatId: string | undefined, week: number): Money {
  const format = formatById(formatId);
  if (!format || week < 1 || week > WEEKS_OF_RUN) return 0;
  const curve = runFor(format, opening.wordOfMouth);
  return Math.round(opening.reckonedCents * (curve[week - 1] ?? 0));
}

/**
 * What each window pays in a given week, as a share of what the channel returned.
 *
 * Spread evenly across the window's weeks rather than decaying, and that is a
 * deliberate simplification rather than an oversight: a library sale is a contract
 * paying in instalments, not an audience arriving. The decay belongs to the opening
 * and the windows are the tail of the deal rather than of the interest.
 */
export function windowsInWeek(
  opening: Opening,
  week: number,
): readonly { id: string; label: string; cents: Money }[] {
  const fromChannel = reachesUs(opening.reckonedCents, opening.channel);
  const paying: { id: string; label: string; cents: Money }[] = [];
  for (const window of windowsAfter(opening.channel)) {
    const into = week - window.opensAtWeek;
    if (into < 0 || into >= window.overWeeks) continue;
    // What the year did to it, where the year did anything. A win lifts only the
    // windows still ahead of the ceremony, which is why this multiplies here rather
    // than at the reckoning.
    const whole = Math.round(fromChannel * window.share * (opening.liftedBy ?? 1));
    paying.push({ id: window.id, label: window.label, cents: Math.round(whole / window.overWeeks) });
  }
  return paying;
}

export interface WeekPaid {
  week: number;
  /** What an audience paid at the opening channel this week. */
  grossCents: Money;
  /** What reached the company, before the back end. */
  toUsCents: Money;
  /** What went out to the people carrying points. */
  pointsCents: Money;
  /** Which windows paid, and what each brought. */
  windows: readonly { id: string; label: string; cents: Money }[];
}

/**
 * Pays one week of one release.
 *
 * Exported so the instrument can drive a run without the scheduler, which matters:
 * measuring on a played career is the rule, and a career that has to advance a year of
 * world time to see a release finish is a career nobody measures.
 */
export function payAWeek(sim: Simulation, projectId: Id, week: number): WeekPaid | undefined {
  const project = projectsOf(sim.universe).find((p) => p.id === projectId);
  const opening = project?.opening;
  if (!project || !opening) return undefined;

  const deals = dealsOn(project);
  // And whatever was sold off the picture before it opened, which comes out of the
  // same receipts the back end does.
  const offers = Object.values(project.ancillaries ?? {});
  let pointsCents = 0;

  const grossCents = openingWeek(opening, project.formatId, week);
  let toUsCents = 0;
  if (grossCents > 0) {
    const got = receive(
      sim, project.companyId, project.id, opening.channel, 'Rental',
      reachesUs(grossCents, opening.channel), deals, `${project.id}:rental:${week}`, offers,
    );
    toUsCents = got.grossToUsCents;
    pointsCents += got.pointsPaidCents;
  }

  const windows = windowsInWeek(opening, week);
  for (const window of windows) {
    const got = receive(
      sim, project.companyId, project.id, window.id, window.label,
      window.cents, deals, `${project.id}:${window.id}:${week}`, offers,
    );
    pointsCents += got.pointsPaidCents;
  }

  opening.weeksPaid = Math.max(opening.weeksPaid, week);
  return { week, grossCents, toUsCents, pointsCents, windows };
}

/**
 * Arms the weekly tick for a release that has just opened.
 *
 * Recurs weekly until the last window shuts. The handler cancels itself rather than
 * the schedule carrying an end date, because the end is a property of the content
 * tables and would otherwise be written down twice.
 */
export function armTheRun(sim: Simulation, projectId: Id, title: string): void {
  sim.schedule({
    at: sim.now + MS_WEEK,
    kind: RUN_KIND,
    label: `${title}, Week By Week`,
    category: 'system',
    priority: 40,
    refType: 'project',
    refId: projectId,
    recurrence: { unit: 'week', interval: 1 },
    payload: { projectId },
  });
}

/**
 * Writes the result onto everybody who was on it, once the last window has shut.
 *
 * The missing half of `content/talent.ts`. `standingAfter` decides where a career
 * goes on three results in a row and had nowhere to read them from: the results
 * array existed on every person and nothing ever appended to it, so a standing could
 * never move and the whole table was a price list.
 *
 * It waits for the last window rather than settling at the opening, and that is the
 * point. A picture that opened badly and was carried by the foreign sale returned its
 * cost, and the people on it are owed the credit for the year it actually had — not
 * for the weekend.
 */
export function settleTheTalent(sim: Simulation, projectId: Id): void {
  const project = projectsOf(sim.universe).find((p) => p.id === projectId);
  if (!project?.opening || project.opening.settled) return;
  const returned = returnedBy(sim, projectId);

  // The bonus nobody budgets for. It falls due only where the picture ran away, so
  // it costs nothing on most of them and a great deal on the one that worked — which
  // is the point of having agreed it instead of a fee.
  const owed = thresholdOwed(dealsOn(project), returned);
  if (owed > 0) payTheThreshold(sim, project.companyId, project.id, owed);

  const won = returned >= 1;
  // Posts and cast alike. A result belongs to everybody who was on it.
  const everybody = [
    ...Object.values(project.engaged ?? {}),
    ...Object.values(project.billed ?? {}),
  ];
  for (const seat of everybody) {
    const talent = sim.universe.talent?.[seat.talentId];
    if (!talent) continue;
    talent.results = [won, ...(talent.results ?? [])].slice(0, A_RUN_IS * 3);
    talent.standingId = standingAfter(talent.standingId, talent.results);
  }
  project.opening.settled = true;
}

export function registerTheRun(sim: Simulation): void {
  sim.onSchedule(RUN_KIND, (item, s) => {
    const projectId = String(item.payload.projectId ?? '');
    const project = projectsOf(s.universe).find((p) => p.id === projectId);
    const opening = project?.opening;
    if (!project || !opening) return;
    const week = opening.weeksPaid + 1;
    payAWeek(s, projectId, week);
    // Past the last window there is nothing left to pay, and an item that fires
    // forever to do nothing is the shape of a save that grows without bound.
    if (week >= LAST_WEEK_ANYTHING_PAYS) {
      settleTheTalent(s, projectId);
      s.timeline.cancel(item.id, s.now);
    }
  });
}

/** How far through its life a release is, for a screen. */
export function howFarThrough(opening: Opening): number {
  return Math.min(1, opening.weeksPaid / LAST_WEEK_ANYTHING_PAYS);
}
