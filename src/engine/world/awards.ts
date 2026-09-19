/**
 * SLATE — the year, and the one night it says what it thought.
 *
 * `content/awards.ts` says what a win is worth. This is the ceremony: once a year it
 * looks back over everything that opened, decides, and then does the three things a
 * win is for — because an awards system whose only output is a notification is the
 * defect this repository has a tool for, and the old build shipped exactly that.
 *
 * ## The room does not read the takings
 *
 * Deliberately, and it is the whole reason awards are worth having beside a box
 * office. A room that rewarded the highest-grossing picture would be a second chart
 * saying the same thing twice. This one reads how it was made, how well the page
 * served its own audience, and what people said about it — so a quiet picture
 * nobody went to can win, a hit can go home with nothing, and a studio can be run
 * to chase either one.
 *
 * That is also what finally points the two halves of the script pool at two
 * different prizes. Pace and spectacle fill an opening and lose here; depth and
 * dialogue lose the opening and win.
 *
 * ## Why the ceremony is in February
 *
 * So that there is something left to lift. A win makes the windows that have not
 * opened yet open bigger — it does not make a finished picture earn retroactively,
 * which would be a number appearing in a ledger for an event that already happened.
 * A picture released in October to be seen by the room is still inside its own run
 * when the room votes, and the foreign sale and the broadcaster are both ahead of it.
 *
 * ## The draw, and why there is one
 *
 * A room that ranked strictly by a figure would make the ceremony an announcement of
 * something already knowable, and every year would go to whoever spent most on a
 * director. A fifth either way means the favorite usually wins and sometimes does
 * not, which is what a room is.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Engagement, Project } from '../domain/company';
import {
  AWARDS, CEREMONY_MONTH, CONSIDERS_MONTHS, THE_ROOM_IS_A_ROOM, standsWithTheRoom,
  type Award,
} from '../content/awards';
import { axisStands } from '../content/craft';
import { genreById, servesIts } from '../content/story';
import { A_RUN_IS, standingAfter } from '../content/talent';
import { reachOf, dialsOn } from './production';
import { projectsOf } from './company';
import { MS_WEEK } from './lot';

export const AWARDS_KIND = 'awards.year';

/** Months, roughly, as the eligibility window is stated in them. */
const A_MONTH = MS_WEEK * 4.345;

/**
 * Everything the room may consider this year.
 *
 * Anything that opened inside the window and has not been considered before. The
 * second half matters: without it a picture released in December would be eligible
 * at two consecutive ceremonies and could win the same award twice.
 */
export function eligible(sim: Simulation, at: number): readonly Project[] {
  return projectsOf(sim.universe).filter((p) => {
    const opening = p.opening;
    if (!opening) return false;
    if (opening.at > at) return false;
    // Sold, and bought. A run that belongs to somebody else is not ours to be judged
    // on, and one that was already released by another studio was judged the year it
    // came out. Selling a hit in November and losing February is the price of the cash.
    if (opening.soldAt !== undefined || opening.boughtIn) return false;
    if (at - opening.at > CONSIDERS_MONTHS * A_MONTH) return false;
    return (p.won ?? []).length === 0 || !(p.consideredAt !== undefined && p.consideredAt >= at - A_MONTH);
  });
}

/**
 * What one picture is worth to the room, before the draw.
 *
 * Reads the craft posts, how well the page served the audience its genre brought,
 * and the word of mouth the two of them produced. No figure from the ledger appears
 * anywhere in it.
 */
export function standing(project: Project): number {
  const craft = axisStands('craft', (id) => reachOf(project)[id], project.medium);
  const genre = genreById(project.genreId);
  const serves = genre ? servesIts(genre, dialsOn(project)) : 1;
  return standsWithTheRoom(craft, serves, project.opening?.wordOfMouth ?? 0);
}

/**
 * The person an award would credit on a given picture, where it credits anybody.
 *
 * One lookup for both kinds. A craft award names a post; performance names a billed
 * part; the picture itself names nobody and credits everybody above the line.
 */
export function seatFor(project: Project, award: Award): Engagement | undefined {
  if (award.postId) return project.engaged?.[award.postId];
  if (award.billingId) return project.billed?.[award.billingId];
  // The picture credits the whole company, so any one of them proves it is castable.
  return Object.values(project.engaged ?? {})[0] ?? Object.values(project.billed ?? {})[0];
}

/** Who the room actually gives it to, once the draw has had its say. */
export function whoWins(
  sim: Simulation,
  award: Award,
  year: number,
  among: readonly Project[],
): Project | undefined {
  // An award that credits anybody needs somebody there to credit. A picture where
  // the office filled the chair is not in the running, which is the cost of never
  // choosing. Performance reads a billed part rather than a post, because the cast
  // stopped being a job called Lead and became a list.
  const running = among.filter((p) => seatFor(p, award) !== undefined);
  if (running.length === 0) return undefined;

  let best: Project | undefined;
  let bestAt = -Infinity;
  for (const one of running) {
    const rng = sim.rng('awards', year, award.id, one.id);
    const at = standing(one) + (rng.next() * 2 - 1) * THE_ROOM_IS_A_ROOM;
    if (at > bestAt) { bestAt = at; best = one; }
  }
  return best;
}

export interface Given {
  awardId: string;
  label: string;
  projectId: Id;
  title: string;
  /** Who it credits, where it credits anybody. */
  toName?: string;
}

/**
 * Holds the ceremony, and makes the wins do their three things.
 *
 * Exported so the instrument can hold one without waiting a year of world time, the
 * same way the run can be paid a week at a time.
 */
export function holdTheCeremony(sim: Simulation, at = sim.now): readonly Given[] {
  const year = new Date(at).getUTCFullYear();
  const among = eligible(sim, at);
  if (among.length === 0) return [];
  const given: Given[] = [];

  for (const award of AWARDS) {
    const won = whoWins(sim, award, year, among);
    if (!won) continue;

    won.won = [...(won.won ?? []), award.id];
    won.consideredAt = at;

    // One: the part of its life still ahead of it is worth more.
    if (won.opening) won.opening.liftedBy = (won.opening.liftedBy ?? 1) * award.liftsWindows;

    // Two: everybody it credits gets the credit, which moves a standing. The picture
    // credits everybody above the line, a craft award credits its own post.
    const credits = (award.postId || award.billingId)
      ? [seatFor(won, award)].filter((one) => one !== undefined)
      : [...Object.values(won.engaged ?? {}), ...Object.values(won.billed ?? {})];
    for (const seat of credits) {
      const talent = sim.universe.talent?.[seat!.talentId];
      if (!talent) continue;
      talent.results = [true, ...(talent.results ?? [])].slice(0, A_RUN_IS * 3);
      talent.standingId = standingAfter(talent.standingId, talent.results);
    }

    given.push({
      awardId: award.id,
      label: award.label,
      projectId: won.id,
      title: won.title,
      toName: (award.postId || award.billingId) ? seatFor(won, award)?.name : undefined,
    });
  }

  for (const one of given) {
    sim.notify({
      category: 'business',
      title: `${one.label}: ${one.title}`,
      body: one.toName
        ? `${one.toName} took ${one.label.toLowerCase()} for ${one.title}.`
        : `${one.title} took ${one.label.toLowerCase()}. What is left of its run is worth more.`,
      importance: 70,
    });
  }
  return given;
}

/** When the next ceremony falls, from an instant. */
export function nextCeremony(at: number): number {
  const now = new Date(at);
  const year = now.getUTCMonth() > CEREMONY_MONTH ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  return Date.UTC(year, CEREMONY_MONTH, 18, 20, 0);
}

export function registerAwards(sim: Simulation): void {
  sim.onSchedule(AWARDS_KIND, (item, s) => {
    holdTheCeremony(s, item.at);
    s.schedule({
      at: nextCeremony(item.at + A_MONTH),
      kind: AWARDS_KIND,
      label: 'The Year’s Awards',
      category: 'system',
      priority: 30,
    });
  });
}

/** Arms the first ceremony on a save that has none. */
export function armTheCeremony(sim: Simulation): void {
  const already = sim.timeline.pending().some((one) => one.kind === AWARDS_KIND);
  if (already) return;
  sim.schedule({
    at: nextCeremony(sim.now),
    kind: AWARDS_KIND,
    label: 'The Year’s Awards',
    category: 'system',
    priority: 30,
  });
}
