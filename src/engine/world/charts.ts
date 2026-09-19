/**
 * SLATE — what the year's pictures came to, in order, and what the order buys.
 *
 * A chart is the easiest screen in a studio game to build and the easiest to build
 * pointlessly. Rank the library by takings, print ten rows, and nothing reads the
 * order — which makes it a receipt for decisions already taken.
 *
 * So the order has a reader before it has a screen. **Where the house stands is what
 * a shortlist reads.** A studio with a good year draws better people: the rungs in
 * `shortlistFor` are weighted by it, so a run of hits puts first-call directors in
 * front of the player who could not get them the year before, and a run of failures
 * takes them away again. That is the compounding loop a studio game needs and the
 * one thing the build did not have — every picture was cast out of the same pool
 * whatever the company had done.
 *
 * ## Two columns that disagree
 *
 * The chart reads the ledger. The room in `world/awards.ts` never does. So a house
 * can stand well on one and badly on the other, and where it stands overall is both
 * — takings and trophies, weighted, because a studio nobody respects and a studio
 * nobody watches are different problems and both of them cost you a cast.
 *
 * ## Why the window is rolling rather than calendar
 *
 * A calendar year would make January a cliff: everything the house did last year
 * stops counting on one night. A rolling window means standing decays the way an
 * actual reputation does, and a picture that opened in November is still carrying
 * the house in March.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import type { Project } from '../domain/company';
import { AWARD_BY_ID } from '../content/awards';
import { projectsOf } from './company';
import { receivedBy, costOf } from './takings';
import { MS_WEEK } from './lot';

/** How far back the house's standing looks. */
export const REMEMBERS_WEEKS = 52 * 3;

/** How many rows a chart shows. */
export const A_CHART_IS = 10;

export interface Placing {
  /** Where it sits, counting from one. */
  at: number;
  projectId: Id;
  title: string;
  /** What reached the company across its whole life so far. */
  tookCents: Money;
  /** What it cost, both sides off the ledger. */
  costCents: Money;
  /** What it returned against that. One washed its face. */
  returned: number;
  /** Which awards it took. */
  won: readonly string[];
  /** When it opened. */
  at_: number;
}

/**
 * The house's own pictures, best first.
 *
 * Ranked by what reached the company rather than by what an audience paid, because
 * the gross is a figure the company never touched and a chart of other people's
 * money is a chart of nothing.
 */
export function theChart(sim: Simulation, since = 0, upTo = A_CHART_IS): readonly Placing[] {
  const out: Placing[] = [];
  for (const project of projectsOf(sim.universe)) {
    const opening = project.opening;
    if (!opening || opening.at < since) continue;
    const tookCents = receivedBy(sim, project.id);
    const costCents = costOf(sim, project.id);
    out.push({
      at: 0,
      projectId: project.id,
      title: project.title,
      tookCents,
      costCents,
      returned: costCents > 0 ? tookCents / costCents : 0,
      won: project.won ?? [],
      at_: opening.at,
    });
  }
  return out
    .sort((a, b) => b.tookCents - a.tookCents)
    .slice(0, upTo)
    .map((one, i) => ({ ...one, at: i + 1 }));
}

/** The same order, by what each returned rather than by what it took. */
export function byWhatItReturned(sim: Simulation, since = 0, upTo = A_CHART_IS): readonly Placing[] {
  return [...theChart(sim, since, Number.MAX_SAFE_INTEGER)]
    .sort((a, b) => b.returned - a.returned)
    .slice(0, upTo)
    .map((one, i) => ({ ...one, at: i + 1 }));
}

export interface House {
  /** How the recent pictures did on the ledger, 0 upward, 1 being ordinary. */
  onTheLedger: number;
  /** What the rooms thought, 0 upward. */
  inTheRoom: number;
  /** The two together, which is what a shortlist reads. */
  stands: number;
  /** How many pictures the window holds. */
  pictures: number;
}

/** What an ordinary house looks like, so standing has something to be measured against. */
export const ORDINARY = 1;

/**
 * How much of the house's standing is money and how much is respect.
 *
 * Weighted towards the ledger, because a studio people will work for is first a
 * studio that finishes pictures and pays for them. Respect moves it and does not
 * decide it.
 */
export const HOUSE_WEIGHS = { ledger: 0.68, room: 0.32 };

/**
 * Where the house stands, read off everything inside the window.
 *
 * A new company with nothing released stands at exactly ordinary. That is the right
 * answer: an unknown studio is neither a draw nor a warning, and starting anybody
 * below ordinary would make the first picture harder than every one after it for a
 * reason no player could act on.
 */
export function whereTheHouseStands(sim: Simulation, at = sim.now): House {
  const since = at - REMEMBERS_WEEKS * MS_WEEK;
  const recent = projectsOf(sim.universe).filter((p) => p.opening && p.opening.at >= since);
  if (recent.length === 0) {
    return { onTheLedger: ORDINARY, inTheRoom: ORDINARY, stands: ORDINARY, pictures: 0 };
  }

  let returned = 0;
  let lifted = 0;
  for (const project of recent) {
    const cost = costOf(sim, project.id);
    returned += cost > 0 ? Math.min(3, receivedBy(sim, project.id) / cost) : 0;
    for (const id of project.won ?? []) lifted += (AWARD_BY_ID[id]?.liftsWindows ?? 1) - 1;
  }
  const onTheLedger = returned / recent.length;
  // Capped, because a house that swept one year should not be able to hire the whole
  // business on the strength of it for the next three.
  const inTheRoom = Math.min(2, ORDINARY + lifted / recent.length);
  return {
    onTheLedger,
    inTheRoom,
    stands: onTheLedger * HOUSE_WEIGHS.ledger + inTheRoom * HOUSE_WEIGHS.room,
    pictures: recent.length,
  };
}

/**
 * What a house of this standing does to the rungs a shortlist is drawn at.
 *
 * Returned as a shift on the draw rather than as a better list, so a good year makes
 * the top of the pool likelier and never certain. Clamped hard: the whole business
 * does not become available because of one hit, and one failure does not empty the
 * room.
 */
export const MOST_A_HOUSE_MOVES = 0.22;

export function howTheHouseDraws(stands: number): number {
  return Math.max(-MOST_A_HOUSE_MOVES, Math.min(MOST_A_HOUSE_MOVES, (stands - ORDINARY) * 0.3));
}

/** What to call where a house stands, on a screen. */
export function saidOfTheHouse(house: House): string {
  if (house.pictures === 0) return 'Nobody has an opinion yet.';
  if (house.stands >= 1.6) return 'People are taking the calls.';
  if (house.stands >= 1.15) return 'A good run, and it is being noticed.';
  if (house.stands >= 0.85) return 'An ordinary house, doing ordinary business.';
  if (house.stands >= 0.5) return 'The last few have not landed, and it shows.';
  return 'Agents are slow returning calls.';
}

/** Everything a screen wants about one picture's place in the library. */
export function placeOf(sim: Simulation, project: Project): Placing | undefined {
  return theChart(sim, 0, Number.MAX_SAFE_INTEGER).find((one) => one.projectId === project.id);
}
