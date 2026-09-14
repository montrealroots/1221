/**
 * SLATE — somebody watches the finished work, and finds something.
 *
 * `content/trouble.ts` says what can be found. This runs the review: how
 * exposed a production is, whether a week of looking turns anything up, which
 * row it turns up, and what falls when it does.
 *
 * ## The row says what fell. The ladder says what it cost.
 *
 * `knockBackPart` returns how many rungs a part actually dropped, and that
 * number times what was standing on the rung it dropped from is the entire
 * cost of a finding. So the same withdrawn consent is free in week two and
 * ruinous in week nineteen without a single figure anywhere saying so — which
 * is the property the maturity vector was built to have and has never had,
 * because nothing ever sent a dimension down.
 *
 * ## What comes out has to go back in
 *
 * `comesApart` is the rule under the rows, and it is never a row. Take a part's
 * rights, compliance or performance away and its picture falls back to the rung
 * its own cutting room last handed it up to, because every rung above that was
 * an approval given on a version that no longer exists. Sound falls a rung and
 * conform falls to the floor behind it, because the mix and the master were
 * made against a picture that has moved. That cascade is written in the
 * engine's own prose already — a mix is made against a locked picture, so a
 * late recut throws away work that was already signed off — and nothing read
 * it until now.
 *
 * The cost lands in the second ledger. `Project.cut` goes back by the runtime
 * of every part that fell below the room's rung, so the cutting room has to
 * make those seconds again at the rate it actually runs at, with the hands it
 * actually has. A room with slack absorbs a note. A room already short of its
 * date does not.
 */

import type { Simulation } from '../core/simulation';
import type { Part, Project } from '../domain/company';
import type { Person } from '../domain/model';
import type { DimensionId } from '../content/maturity';
import { bottomOf, rungsOf, terminalOf } from '../content/maturity';
import type { Finding, Needs } from '../content/trouble';
import { FINDINGS, REVIEW_RATE, deckWeight } from '../content/trouble';
import type { Plan } from '../content/making';
import { DELIVERY } from '../content/making';
import { cuttingPeriod, ratioOf } from './inventory';
import { partsOf, rungOfPart, shareOfPart, stepOfPart } from './maturity';
import { advancePart, knockBack, knockBackPart, laddersOf } from './maturity';
import { DIMENSIONS } from '../content/maturity';
import { SOMEBODY_KNOWS, goesOffBy, theNameThatGoesOff } from './casting';

// ---------------------------------------------------------------------------
// What a plan is exposed to
// ---------------------------------------------------------------------------

/**
 * Whether the work itself takes a dimension all the way, rather than paperwork.
 *
 * All the way and not part of the way, because that is where the two forms
 * actually differ. Both a picture and a season option their material in prep,
 * so both move rights off the floor. Only the season's own periods carry rights
 * to cleared, because on that form consent is a standing relationship with
 * people who are still in the room; a picture gets there by filing a chain of
 * title, and there is no live consent in a filed document for anybody to take
 * back. The predicate reads the periods and never the plan's name.
 */
export const movedDuringTheWork = (plan: Plan, dimension: DimensionId): boolean =>
  plan.periods.some((one) => one.advances?.[dimension] === terminalOf(plan.ladders, dimension));

/** How many rungs sit above the rung the cutting room hands work up to. */
export function aboveTheRoom(plan: Plan, ladders: string): number {
  const upTo = cuttingPeriod(plan)?.converts?.upTo;
  if (!upTo) return 0;
  const rungs = rungsOf(ladders, 'picture');
  const at = rungs.findIndex((one) => one.id === upTo);
  return at < 0 ? 0 : rungs.length - 1 - at;
}

/**
 * The rows that can happen to this production at all.
 *
 * Read off what the plan does rather than which plan it is. A picture that
 * clears its rights by filing a chain of title has no live consent for anybody
 * to withdraw; a season whose consent is a standing relationship with people
 * still in the room has one every week. Nothing here asks the plan its name.
 */
/**
 * `known` is required rather than defaulted, because a default of nothing would
 * quietly drop a whole row from the deck for any caller that forgot — and a
 * finding that can never be dealt is exactly the disease this file exists
 * inside a project that has a test for.
 */
export function deckFor(project: Project, plan: Plan, known: number): Finding[] {
  const ladders = laddersOf(project);
  const ratio = ratioOf(project) ?? 0;
  const holding = project.holdingId;
  const can = (needs?: Needs): boolean => {
    if (!needs) return true;
    if (needs.ratioAbove !== undefined && ratio < needs.ratioAbove) return false;
    if (needs.movedDuringTheWork && !movedDuringTheWork(plan, needs.movedDuringTheWork)) return false;
    if (needs.aboveTheRoom && aboveTheRoom(plan, ladders) < 1) return false;
    if (needs.onPaper && !holding) return false;
    if (needs.unfiled && project.delivered.includes(needs.unfiled)) return false;
    if (needs.aNameOnIt && known < SOMEBODY_KNOWS) return false;
    return true;
  };
  return FINDINGS.filter((one) => can(one.needs));
}

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

export interface Review {
  /** Which ladder set the work is measured against. */
  ladders: string;
  /** The rows that can happen to this production. */
  deck: readonly Finding[];
  /** How far this part has come, taken the way done is taken: the lowest of it. */
  climbed: number;
  /** How much this production has left lying around to be found, 0 to 1. */
  exposure: number;
  /** Whether a week of looking turns anything up. */
  whether: number;
  /** Which row it turns up. */
  which: number;
}

export interface Found {
  finding?: Finding;
  /** What it comes to, banded the way a producer would say it. */
  said: string;
}

/** The chance one week of looking at one part finds something. */
export const rateOf = (exposure: number): number =>
  REVIEW_RATE.clean + (REVIEW_RATE.exposed - REVIEW_RATE.clean) * Math.min(1, Math.max(0, exposure));

/**
 * What a week of somebody watching the work turns up.
 *
 * Two draws and not one, and the difference matters more than it looks. A
 * single roll that both decided whether anything was found and walked the deck
 * would correlate them perfectly: a low roll fires and lands on the heaviest
 * row, so the rare rows at the bottom of the deck could never happen at all,
 * and the whole point of the exercise would be unreachable while every test
 * still passed.
 */
export function decideReview(review: Review): Found {
  const { deck, climbed } = review;
  if (deck.length === 0) return { said: 'nothing found' };
  if (review.whether >= rateOf(review.exposure)) return { said: 'nothing found' };

  let at = review.which * deckWeight(deck);
  let finding = deck[deck.length - 1]!;
  for (const one of deck) {
    at -= one.weight;
    if (at <= 0) { finding = one; break; }
  }

  // Nothing standing on the rung means nothing to take away. A part at the
  // bottom of every ladder cannot be hurt, and that is not a special case —
  // it is the same arithmetic reading zero.
  if (climbed <= 0) return { finding, said: 'nothing found' };
  const deep = finding.down === 'floor' ? 1 : finding.down === 'room' ? 0.5 : 0.2;
  const cost = deep * climbed;
  if (cost < 0.15) return { finding, said: 'a note' };
  if (cost < 0.5) return { finding, said: 'a recut' };
  return { finding, said: 'the finish thrown away' };
}

// ---------------------------------------------------------------------------
// What falls
// ---------------------------------------------------------------------------

/**
 * How much finished work is standing on this part.
 *
 * The mean of its six and deliberately not the minimum, and the difference
 * between those two numbers is the whole idea. Done is the minimum: a part that
 * is locked, mixed, mastered and uncleared is worth nothing. What there is to
 * lose is the mean: that same part has five dimensions of finished work
 * standing on one unsigned rung, and losing it is a catastrophe precisely
 * because done was already reading zero.
 *
 * Reading the minimum here would make a production invulnerable until the
 * moment it was finished, and finished things are delivered within the week.
 */
export const climbedTo = (project: Project, part: Part): number =>
  DIMENSIONS.reduce((n, d) => n + shareOfPart(project, part, d.id), 0) / DIMENSIONS.length;

/**
 * How much a production has lying around to be found.
 *
 * Three things, all of them facts the save already holds, and all three of them
 * something a producer chose. How much material was banked against what is
 * owed, because a rig that recorded thousands of hours recorded thousands of
 * hours of people nobody logged. Whether the chain of title is whole. And
 * whether the paperwork that would have caught it has been filed.
 */
export function exposureOf(project: Project, sim: Simulation): number {
  const ratio = ratioOf(project) ?? 1;
  // A picture shot to a plan sits near nothing. A fixed rig in the thousands
  // sits at the top, and the curve between them is logarithmic because the
  // ratios themselves span four orders of magnitude.
  const material = Math.min(1, Math.log10(Math.max(1, ratio)) / 3.5);
  const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
  const paper = holding && !holding.chainComplete ? 0.3 : 0;
  const filed = DELIVERY
    .filter((one) => one.by === 'business' && one.moves)
    .filter((one) => !project.delivered.includes(one.id)).length;
  return Math.min(1, material * 0.6 + paper + filed * 0.1);
}

/** The rung a finding sends a dimension to, on the ladder this form uses. */
export function landsOn(
  project: Project, part: Part, finding: Finding, plan: Plan,
): string | undefined {
  const ladders = laddersOf(project);
  const rungs = rungsOf(ladders, finding.dimension);
  const was = stepOfPart(project, part, finding.dimension);
  if (finding.down === 'floor') return bottomOf(ladders, finding.dimension);
  if (finding.down === 'room') return theRoomsRung(project, plan) ?? rungs[Math.max(0, was - 1)]?.id;
  const to = Math.max(0, was - finding.down);
  if (finding.dimension !== 'picture') return rungs[to]?.id;
  // Nothing sends a cut below the last thing the cutting room handed up. A
  // note from a broadcaster is a note about the version they were shown, and
  // the version under it still exists.
  const floor = theRoomsStep(project, plan);
  return rungs[Math.max(floor, to)]?.id;
}

/** The rung the cutting room hands work up to, where a plan has a room. */
const theRoomsRung = (project: Project, plan: Plan): string | undefined => {
  const upTo = cuttingPeriod(plan)?.converts?.upTo;
  if (!upTo) return undefined;
  return rungsOf(laddersOf(project), 'picture').some((one) => one.id === upTo) ? upTo : undefined;
};

/** Where that rung sits on the ladder, as a step. */
function theRoomsStep(project: Project, plan: Plan): number {
  const upTo = theRoomsRung(project, plan);
  if (!upTo) return 0;
  const at = rungsOf(laddersOf(project), 'picture').findIndex((one) => one.id === upTo);
  return at < 0 ? 0 : at;
}

/**
 * Everything standing on the rung that just went, taken down with it.
 *
 * A rule and never a row, and the reason a compliance ladder three rungs deep
 * can destroy a season: the ruin is carried by the picture, never by the
 * compliance rung. Take a part's consent away and the cut it was in is not a
 * cut any more, so it goes back to the room; the mix was made against that cut
 * and the master was made against that mix, so they go with it.
 */
export function comesApart(
  project: Project, part: Part, hit: DimensionId, plan: Plan, rungsLost: number,
): { fell: number; picture: number } {
  if (hit === 'conform' || rungsLost <= 0) return { fell: 0, picture: 0 };
  let fell = 0;
  let picture = 0;
  const ladders = laddersOf(project);
  if (hit !== 'picture') {
    // The picture falls as far as the thing that fell, and no further. A note
    // about one frame is a trim; a withdrawn signature takes the episode all
    // the way back to the assembly, because the person has to come out of it.
    const rungs = rungsOf(ladders, 'picture');
    const was = stepOfPart(project, part, 'picture');
    const to = Math.max(theRoomsStep(project, plan), was - rungsLost);
    const rung = rungs[to]?.id;
    if (rung) picture = knockBackPart(project, part, 'picture', rung).fell;
    fell += picture;
  }
  // The mix keeps its track lay and loses its mix, because the dialogue edit
  // survives a trim and the balance does not.
  const sound = rungsOf(ladders, 'sound');
  const soundAt = stepOfPart(project, part, 'sound');
  if (soundAt > 1) fell += knockBackPart(project, part, 'sound', sound[1]!.id).fell;
  // The master is void outright. A master made against a picture that has moved
  // is not a master with a fault in it, it is a file of the wrong thing.
  fell += knockBackPart(project, part, 'conform', bottomOf(ladders, 'conform')).fell;
  return { fell, picture };
}

/**
 * Strikes off the delivery list anything the vector no longer supports.
 *
 * Running the machinery backward rather than building a second set of it. An
 * element that says it moved a dimension to a rung, on a production whose
 * dimension now sits below that rung, was filed against work that is not there
 * any more — so it comes off the list, `heldUpBy` re-arms, and the money goes
 * back to being held by the code that already holds it.
 *
 * It never touches `settled`. Settling posts an expense, and a period that
 * settled twice is a picture spending its budget twice, which this engine has
 * already been bitten by once.
 */
export function takeItBack(project: Project): string[] {
  const ladders = laddersOf(project);
  const struck: string[] = [];
  for (const element of DELIVERY) {
    if (!element.moves || !project.delivered.includes(element.id)) continue;
    const rungs = rungsOf(ladders, element.moves.dimension);
    const wanted = rungs.findIndex((one) => one.id === element.moves!.to);
    if (wanted < 0) continue;
    const lowest = Math.min(...partsOf(project).map((p) => stepOfPart(project, p, element.moves!.dimension)));
    if (lowest >= wanted) continue;
    project.delivered = project.delivered.filter((id) => id !== element.id);
    struck.push(element.label);
  }
  return struck;
}

/**
 * Hands the cutting room back the seconds it has to make again.
 *
 * Clamped at what the thing owes, because a room that overshot its own target
 * has banked nothing it can spend: seconds cut twice are not seconds in credit.
 * Without the clamp the only seasons that ever reach a quiet week nineteen —
 * the well-staffed ones, which finish early — would be exactly the ones whose
 * overshoot pays for their own recut, and a note would cost them nothing.
 */
export function backToTheRoom(
  project: Project, plan: Plan, part: Part, rungsLost: number,
): number {
  if (rungsLost <= 0) return 0;
  const above = aboveTheRoom(plan, laddersOf(project));
  if (above <= 0) return 0;
  // A rung of the ladder is a rung of the work. A note that costs one approval
  // out of four costs a quarter of the episode again; a consent that takes it
  // all the way back to the assembly costs the whole of it.
  const owes = part.seconds * Math.min(1, rungsLost / above);
  part.recut = (part.recut ?? 0) + owes;
  return owes;
}

/** Seconds the cutting room owes across every part, on top of what it never cut. */
export const owedAgain = (project: Project): number =>
  partsOf(project).reduce((n, part) => n + (part.recut ?? 0), 0);

/** Where a part stands on one dimension, named the way a screen would name it. */
export const rungReads = (project: Project, part: Part, dimension: DimensionId): string =>
  rungsOf(laddersOf(project), dimension)
    .find((one) => one.id === rungOfPart(project, part, dimension))?.label ?? 'nothing';

/** Puts a whole-scope finding onto every part, which is what whole means. */
export function knockEverything(
  project: Project, finding: Finding, to: string, plan: Plan,
): number {
  let fell = knockBack(project, finding.dimension, to).fell;
  for (const part of partsOf(project)) {
    const apart = comesApart(project, part, finding.dimension, plan, 99);
    fell += apart.fell;
    backToTheRoom(project, plan, part, apart.picture);
  }
  return fell;
}

/** Used by the repair: whether the room has finished a part to the plan's target. */
export function outOfTheRoom(project: Project, part: Part, plan: Plan): boolean {
  const period = cuttingPeriod(plan);
  const target = period?.advances?.picture;
  if (!target) return true;
  const rungs = rungsOf(laddersOf(project), 'picture');
  const want = rungs.findIndex((one) => one.id === target);
  return want < 0 || stepOfPart(project, part, 'picture') >= want;
}

/** Re-applies one period's advances to one part, and says whether anything moved. */
export function putBack(
  project: Project, part: Part, advances: Partial<Record<DimensionId, string>>,
): boolean {
  let moved = false;
  for (const [dimension, rung] of Object.entries(advances)) {
    if (advancePart(project, part, dimension as DimensionId, rung as string)) moved = true;
  }
  return moved;
}

/**
 * Puts the attention on the person it is attention about.
 *
 * The finding takes the picture down a rung because the scenes built around
 * that face are the scenes it was sold on. This is the other half, and it is
 * the half that outlives the picture: the person carries it, every buyer of
 * everything they are in reads it, and the next production office passes on
 * them without ever saying why.
 *
 * It is the only writer of `controversy` in the build, which had been a number
 * seeded to zero on every person in every save and moved by nothing at all.
 */
export function somebodyGoesOff(sim: Simulation, project: Project): Person | undefined {
  const person = theNameThatGoesOff(sim, project);
  if (!person) return undefined;
  const was = person.reputation.controversy;
  person.reputation.controversy = Math.min(100, was + goesOffBy(person.reputation.publicFame));
  return person;
}
