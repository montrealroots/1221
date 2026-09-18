/**
 * SLATE — the year's judgement, and the one number it moves.
 *
 * `content/awards.ts` says what this is not: no academies, no categories, no
 * juries. This is the tick that looks at what was finished, names five, gives one
 * of them the award, and moves prestige on the people who made them.
 *
 * ## Why prestige could come back
 *
 * It was deleted for being written by many and read by none, and `docs/AWARDS.md`
 * is explicit that rebuilding the writers without the readers reproduces the
 * defect. So the readers are in the same commit as this file and there are two:
 *
 *   - **`remembersYou`** takes prestige as a fourth term, beside fame, rooms read
 *     and reliability. An office that has never met you has heard of the work.
 *   - **The sale** prices it, because a picture people will talk about is worth
 *     more to a buyer than one they will not.
 *
 * `askFor` was the third candidate the document offered and it is deliberately
 * refused. A prestige floor under the opening ask is the mechanism by which an
 * award becomes money directly, and the closest measured analogue for it — the
 * floor at the quote — came out at **×2.32 to ×3.56 of lifetime acting income**.
 * That is not a term, it is a different economy, and adding it on the strength of
 * an analogy would be the largest unmeasured change this project has ever made.
 * It stays available and it stays unbuilt, with the number written down.
 */

import type { Simulation } from '../core/simulation';
import type { Audition, Person, Project } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { instantFromZoned, zonedParts } from '../core/time';
import {
  AWARDABLE, AWARDS_MONTH, ELIGIBLE_ABOVE, FORGOTTEN_A_YEAR, IN_THE_CONVERSATION,
  NAMED_A_YEAR, NAMED_IS_WORTH, NOTICED, NOTICED_AT_LEAST, WINS_A_YEAR, WON_IS_WORTH,
} from '../content/awards';
import { castOn, whoIsInIt } from './casting';
import { howFarOff } from './audition';
import { TOO_FAR, type Reading } from '../content/audition';
import { sizeById } from '../content/casting';

export const AWARDS_KIND = 'awards.season';

/**
 * How much a picture is in the conversation, 0-100.
 *
 * Off the cast's real reads rather than what anybody believed at a casting
 * session, because a voting body has seen the picture. `castOn` weights by how
 * much of the title each person is, which is the same weighting every other cast
 * figure uses — and on a format season it reads the cast board, so a season is
 * judged on the twelve people who were on it.
 */
export function noticedOf(sim: Simulation, project: Project, draw: number): number {
  const truth = castOn(sim, project, 'truth');
  const reads = castOn(sim, project, 'reads');
  // A picture nobody is in is not in the conversation, whatever it cost.
  if (truth === undefined && reads === undefined) return 0;
  const onScreen = ((truth ?? 50) + (reads ?? 50)) / 2;
  const form = AWARDABLE[project.planId ?? ''] ?? 0;
  return clamp(Math.round(
    onScreen * NOTICED.cast + form * 100 * NOTICED.form + draw * 100 * NOTICED.draw,
  ), 0, 100);
}

/**
 * Whether a picture is the kind of thing a season looks at in the first place.
 *
 * `deliveredAt` is the only completeness test here and it is the whole of one:
 * `handOver` in `world/making.ts` refuses unless `isFinished`, then writes the date
 * on the line after — so a picture carrying a delivery date is a finished picture
 * by construction. Asking `isFinished` as well, which the first draft did, is a
 * guard a prior one settles, and it made the condition impossible to state in a
 * test without hand-building a maturity vector for a fixture.
 */
export function eligible(project: Project, from: Instant, to: Instant): boolean {
  if (project.shelvedAt !== undefined) return false;
  if ((project.budgetCents ?? 0) < ELIGIBLE_ABOVE) return false;
  if (!AWARDABLE[project.planId ?? '']) return false;
  const done = project.deliveredAt;
  return done !== undefined && done >= from && done < to;
}

/**
 * The year's judgement, in one pass.
 *
 * Everything finished in the window, ranked by how much it is in the
 * conversation, the top five named and the first of those given the award. The
 * draw is per picture and seeded on the picture, so the same year judged twice
 * comes out the same way — a season that reshuffled on every read would be a
 * season nobody could be told about.
 */
export function theSeason(
  sim: Simulation, from: Instant, to: Instant,
): { named: Project[]; won: Project[] } {
  const eligibleNow = Object.values(sim.universe.projects).filter((one) => eligible(one, from, to));
  const ranked = eligibleNow
    .map((project) => ({
      project,
      at: noticedOf(sim, project, sim.rng('awards', 'noticed', project.id).next()),
    }))
    .filter((one) => one.at >= IN_THE_CONVERSATION)
    .sort((a, b) => b.at - a.at || a.project.id.localeCompare(b.project.id));

  const named = ranked.slice(0, NAMED_A_YEAR).map((one) => one.project);
  const won = named.slice(0, WINS_A_YEAR);
  for (const project of named) {
    const isWinner = won.includes(project);
    for (const one of whoIsInIt(sim, project)) {
      if (!one.person) continue;
      // Weighted by how much of the picture they were, so a lead takes more of
      // the credit for it than a day player — which is both what happens and the
      // only way the figure stays about the work.
      lift(one.person, (isWinner ? WON_IS_WORTH : NAMED_IS_WORTH) * one.share);
    }
  }
  return { named, won };
}

/**
 * The player's own finished work, judged off what they actually played.
 *
 * THE HALF THAT REACHES AN ACTING CAREER, and without it none of the above does.
 * The season loop reads `universe.projects`, which is the family's own slate — and
 * in a played career the player acts almost entirely for other people, in
 * productions that book the lot. Those are `Booking` rows with no cast records and
 * no delivery, so a season looking only at projects can never see the work the
 * player actually did. `tools/dials.mjs` caught it: twenty-five played years and
 * `Reputation.prestige` reported "one value, 0".
 *
 * What it judges is the thing the room already recorded. A won audition carries
 * `wants` — what the part was looking for — and `played`, what the player did with
 * it. `howFarOff` is the distance between them and is the same figure the room
 * itself is decided on, so this is not a new opinion about the performance: it is
 * the one the engine already formed, read again a year later by people who have
 * now seen it.
 *
 * Weighted by the size of the part, because a season notices a lead and does not
 * notice a day player, and gated on the part being at least a supporting one for
 * the same reason.
 */
export function performancesOf(
  sim: Simulation, from: Instant, to: Instant,
): { audition: Audition; at: number }[] {
  const out: { audition: Audition; at: number }[] = [];
  for (const audition of Object.values(sim.universe.auditions)) {
    if (audition.why !== 'cast' || audition.played === undefined) continue;
    if (audition.to < from || audition.to >= to) continue;
    const size = sizeById(audition.size);
    if (!size || size.onScreen < NOTICED_AT_LEAST) continue;
    // Closer is better, so the distance is turned round. `howFarOff` runs from
    // nought — dead on what the part wanted — to the width of the range.
    const off = howFarOff(audition.played as Reading, audition.wants);
    const at = clamp(Math.round((1 - off / TOO_FAR) * 100), 0, 100);
    out.push({ audition, at });
  }
  return out.sort((a, b) => b.at - a.at);
}

/**
 * Names the performances a season noticed, and lifts whoever gave them.
 *
 * The same five-and-one shape as the pictures, judged separately, because a
 * performance and a picture are two different things to be named for and a season
 * that pooled them would have a format season competing with an afternoon in a
 * room.
 */
export function theSeasonForPerformances(
  sim: Simulation, from: Instant, to: Instant,
): { named: Audition[]; won: Audition[] } {
  const me = sim.universe.people[sim.universe.playerId];
  if (!me) return { named: [], won: [] };
  const ranked = performancesOf(sim, from, to)
    .filter((one) => one.at >= IN_THE_CONVERSATION);
  const named = ranked.slice(0, NAMED_A_YEAR).map((one) => one.audition);
  const won = named.slice(0, WINS_A_YEAR);
  for (const audition of named) {
    const size = sizeById(audition.size);
    lift(me, (won.includes(audition) ? WON_IS_WORTH : NAMED_IS_WORTH) * (size?.onScreen ?? 1));
  }
  return { named, won };
}

/**
 * Moves prestige a share of the distance left, rather than by a flat amount.
 *
 * The same shape `remembersYou` uses for the same reason: a flat addition
 * saturates, and a career of nothing but wins should approach being the most
 * respected person in the business without any single award taking it there.
 */
function lift(person: Person, by: number): void {
  const headroom = 100 - person.reputation.prestige;
  person.reputation.prestige = clamp(person.reputation.prestige + headroom * by, 0, 100);
}

/** What a year takes off prestige nobody added to, over some number of days. */
export function forgottenPrestige(person: Person, days: number, aYear: number): void {
  person.reputation.prestige = clamp(
    person.reputation.prestige - (FORGOTTEN_A_YEAR / aYear) * days, 0, 100,
  );
}

function nextSeason(sim: Simulation, after: Instant): Instant {
  const zone = sim.homeZone;
  const here = zonedParts(after, zone);
  const year = here.month < AWARDS_MONTH ? here.year : here.year + 1;
  return instantFromZoned({ year, month: AWARDS_MONTH, day: 15, hour: 20, minute: 0 }, zone);
}

export function registerAwards(sim: Simulation): void {
  sim.onSchedule(AWARDS_KIND, () => {
    const zone = sim.homeZone;
    const year = zonedParts(sim.now, zone).year - 1;
    const from = instantFromZoned({ year, month: 1, day: 1, hour: 0, minute: 0 }, zone);
    const to = instantFromZoned({ year: year + 1, month: 1, day: 1, hour: 0, minute: 0 }, zone);
    const { named, won } = theSeason(sim, from, to);
    const mine = theSeasonForPerformances(sim, from, to);
    if (mine.named.length > 0) {
      const top = mine.won[0] ?? mine.named[0]!;
      sim.notify({
        category: 'personal',
        title: mine.won.length > 0 ? 'The Year Names You' : 'Named For The Year',
        body: `For ${top.holder}. ${mine.won.length > 0
          ? 'Offices that have never met you have heard about it, and it’s worth something at a '
            + 'sale for as long as it is remembered.'
          : 'Four of the five named don’t win, and being named is the part that reaches an office.'}`,
        importance: 75,
      });
    }

    // Said only where the family's own work is in it, because a season that
    // named five pictures nobody in this save made is not news to anybody here.
    const ours = named.filter((one) => sim.universe.projects[one.id] !== undefined);
    if (ours.length > 0) {
      const winner = won[0];
      sim.notify({
        category: 'business',
        title: winner && ours.includes(winner)
          ? `${winner.title} Wins The Year`
          : `${ours.length === 1 ? ours[0]!.title : `${ours.length} Of Ours`} Named For The Year`,
        body: winner && ours.includes(winner)
          ? `Out of everything finished in ${year}. It’s worth more to everybody who was in it `
            + 'than the money was, and it fades if nothing follows it.'
          : `Named out of everything finished in ${year}. Four of the five named don’t win, so `
            + `this is worth having on its own. ${winner ? `${winner.title} took it.` : ''}`,
        importance: 70,
      });
    }

    sim.schedule({
      at: nextSeason(sim, sim.now),
      kind: AWARDS_KIND,
      label: 'The Year’s Awards',
      category: 'system',
      priority: 6,
    });
  });

  if (!sim.universe.scheduled.some((i) => i.kind === AWARDS_KIND && i.status === 'pending')) {
    sim.schedule({
      at: nextSeason(sim, sim.now),
      kind: AWARDS_KIND,
      label: 'The Year’s Awards',
      category: 'system',
      priority: 6,
    });
  }
}
