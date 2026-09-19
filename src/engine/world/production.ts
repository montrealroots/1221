/**
 * SLATE — the production, and the doors that shut behind you.
 *
 * The complaint this file answers was exact: *I do not have full control over the
 * production process at all.* It was accurate. Across the old pipeline the player
 * supplied nine numbers and three enum picks, and the engine decided the periods,
 * every date but one, the stage, the crew, the part count, the roles, the overrun,
 * the fee and the sale. This inverts it. Here the player chooses the format, the
 * shape, every person by name, the terms they are on, the channel and the week. The
 * engine decides only what a producer genuinely could not: what an audience does.
 *
 * ## The progressive lock, which is the actual mechanic
 *
 * Control without consequence is a form with more fields on it. What makes these
 * choices weigh anything is that they stop being changeable, in an order, and every
 * lock has a reason inside the fiction rather than outside it:
 *
 *   1. **The shape locks when the first person is engaged.** Somebody who took a
 *      share of the back end priced it against the format and the part count they
 *      were told about. If the shape could be cut afterwards, every deal would be
 *      signed against a promise the producer could withdraw, and taking points would
 *      be a mistake nobody should ever make. The lock is what makes that deal safe
 *      enough to be interesting.
 *   2. **The cast locks at the greenlight.** After the money is committed people are
 *      contracted, and letting one go is a different act from not hiring them.
 *   3. **Everything locks at the opening.** Most of the campaign is spent and the run
 *      has begun.
 *
 * Each of those refusals reads a field something else also reads. A lock that only
 * guarded itself would be ceremony.
 *
 * ## What is deliberately not here
 *
 * No stage booking, no period ladder, no overrun model, no delivery elements. Those
 * went with the old system and they come back as their own modules the day something
 * reads them. A pipeline that declares eleven stages and walks a cursor through them
 * without any of them changing an outcome is what the last one was.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import { millions, type Money } from '../core/money';
import type { Engagement, Project, Talent } from '../domain/company';
import type { Channel } from '../content/format';
import { formatById, whyNotThisChannel, whyNotThisShape } from '../content/format';
import { engineById } from '../content/concept';
import { UNFILLED_REACH, postById, postsFor } from '../content/craft';
import {
  MOST_POINTS, STANDINGS, offersFrom, standingById, upFrontCents, type DealKind,
} from '../content/talent';
import { MEN, WOMEN, patronymic } from '../content/names';
import { billingById, castingFor } from '../content/roles';
import { inherits, type Entry } from '../content/lineage';
import { MOST, UNWRITTEN, genreById, whyNotWrite, type Dial } from '../content/story';
import { carriedInto, sourceById, whyNotFrom, type Source } from '../content/source';
import {
  ancillaryById, offersOn, type Ancillary, type AncillaryDeal, type Offer,
} from '../content/ancillary';
import { reckon, type Spec } from './boxoffice';
import { bankTheGuarantee, chargeTheCampaign, chargeTheFees, returnedBy } from './takings';
import { armTheRun } from './run';
import { crowding } from './field';
import { howTheHouseDraws, whereTheHouseStands } from './charts';
import { cashAccountFor, projectsOf } from './company';
import { MS_WEEK } from './lot';

/** The three locks, in the order they shut. */
export type Lock = 'shape' | 'cast' | 'opening';

export const LOCKS: readonly Lock[] = ['shape', 'cast', 'opening'];

export const LOCK_SAID: Readonly<Record<Lock, string>> = {
  shape: 'The format, the part count and the runtime are settled.',
  cast: 'Everybody is contracted.',
  opening: 'It’s out, and the campaign is spent.',
};

export const isLocked = (project: Project, lock: Lock): boolean =>
  (project.locked ?? []).includes(lock);

const shut = (project: Project, lock: Lock): void => {
  if (!isLocked(project, lock)) project.locked = [...(project.locked ?? []), lock];
};

export const projectById = (sim: Simulation, id: Id): Project | undefined =>
  projectsOf(sim.universe).find((p) => p.id === id);

/**
 * Where this picture's story came from, where it hangs off a right at all.
 *
 * `Provenance` sat on every holding since the day holdings were added and nothing in
 * the tree ever read it — six declared words with no reader, which is THE ONE RULE
 * broken six times in one enum. Three things read it now: what a script may carry,
 * what the format can honestly be, and how much of the campaign floor is already
 * paid. This is the lookup all three go through.
 */
export function sourceOf(sim: Simulation, project: Project): Source | undefined {
  const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
  return sourceById(holding?.provenance);
}

// ---------------------------------------------------------------------------
// Who is available
// ---------------------------------------------------------------------------

/** How many candidates a post is offered. Few enough to read, enough to choose. */
export const A_SHORTLIST_IS = 5;

/** A name this country would actually form. */
function aName(t: number, u: number): string {
  const woman = t < 0.5;
  const given = woman
    ? WOMEN[Math.floor(u * WOMEN.length) % WOMEN.length]!
    : MEN[Math.floor(u * MEN.length) % MEN.length]!.name;
  const father = MEN[Math.floor(t * MEN.length) % MEN.length]!;
  return `${given} ${patronymic(father, woman ? 'dóttir' : 'son')}`;
}

/**
 * Who is up for a post, drawn once and then remembered.
 *
 * Persisted into the talent table on the first ask rather than regenerated, because
 * the whole point of a named person is that they are the same person next time — a
 * director you used and who then made two more that worked has a standing that moved,
 * and a list redrawn each time could not carry that.
 *
 * Anybody who has worked for this company before and is right for the post comes
 * first, which is the one piece of favouritism the model has and it is the true one:
 * a producer rings the people who did not let them down.
 */
export function shortlistFor(sim: Simulation, projectId: Id, postId: string): readonly Talent[] {
  if (!postById(postId)) return [];
  return drawAPool(sim, projectId, postId);
}

/**
 * The draw itself, shared by the posts and the cast.
 *
 * `key` is what makes two shortlists differ — a project and a post for a job, a
 * project and a billing for a part — and `pool` is which trade the people come
 * from. Extracted when the cast stopped being a single post called Lead, because
 * both halves want the same behavior: people who have worked here before come
 * first, and the house's recent run shifts the rungs the strangers are drawn at.
 */
export function drawAPool(sim: Simulation, key: string, pool: string): readonly Talent[] {
  const known = Object.values(sim.universe.talent ?? {}).filter((one) => one.postId === pool);
  const before = known.filter((one) => one.worked > 0).slice(0, 2);

  const want = A_SHORTLIST_IS - before.length;
  const drawn: Talent[] = [];
  const rng = sim.rng('casting', key, pool);
  // What the house has been doing lately, which is the compounding loop the build
  // did not have: every picture used to be cast out of the same pool whatever the
  // company had done. A good run puts first-call people in front of a producer who
  // could not get them last year, and a bad run takes them away again. It shifts the
  // draw rather than handing over a better list, so a hit makes the top of the pool
  // likelier and never certain.
  const house = howTheHouseDraws(whereTheHouseStands(sim).stands);
  for (let i = 0; i < want; i += 1) {
    const roll = Math.max(0, Math.min(0.999, rng.next() + house));
    // Weighted down the rungs: plenty of people are working and very few are first
    // call, which is what makes the top of the list feel like a decision rather than
    // a default.
    const standing = STANDINGS[roll < 0.42 ? 0 : roll < 0.74 ? 1 : roll < 0.92 ? 2 : 3]!;
    const made: Talent = {
      id: sim.nextId('talent'),
      saveId: sim.universe.meta.id,
      name: aName(rng.next(), rng.next()),
      postId: pool,
      standingId: standing.id,
      results: [],
      worked: 0,
    };
    sim.universe.talent[made.id] = made;
    drawn.push(made);
  }
  return [...before, ...drawn];
}

/** What the two offers from one person would be, for this much work. */
export function offersFor(talent: Talent, parts: number) {
  const standing = standingById(talent.standingId) ?? STANDINGS[1]!;
  return offersFrom(standing, parts);
}

/** The reach of whoever fills each post, which is what the box office reads. */
export function reachOf(project: Project): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const post of postsFor(project.medium)) {
    const seat = project.engaged?.[post.id];
    const standing = standingById(seat?.standingId);
    out[post.id] = standing ? standing.reach : UNFILLED_REACH;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The shape
// ---------------------------------------------------------------------------

export interface Shape {
  projectId: Id;
  formatId: string;
  parts: number;
  secondsEach: number;
}

export function whyNotShape(sim: Simulation, spec: Shape): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'shape')) {
    return 'The shape is settled. Everybody engaged was priced against this much work.';
  }
  const format = formatById(spec.formatId);
  if (!format) return `There’s no format called '${spec.formatId}'.`;
  const wrong = whyNotThisShape(format, spec.parts, spec.secondsEach);
  if (wrong) return wrong;

  // What the material can honestly become. A stage play is two hours in one room and
  // does not turn into a twenty-four part serial; a licensed format is a machine for
  // making episodes and makes a poor feature. A refusal rather than a bad price,
  // because pricing it badly would let a player do it and never learn why it failed.
  const source = sourceOf(sim, project);
  if (source) {
    const unsuited = whyNotFrom(source, format.id, format.label, (id) => formatById(id)?.label ?? id);
    if (unsuited) return unsuited;
  }

  if (format.medium === 'television') {
    const engine = engineById(project.concept?.engineId);
    if (!engine) {
      return `${format.label} is television, and television needs a story engine under it. `
        + 'Conceive it first.';
    }
    if (!format.cadences.some((c) => engine.cadences.includes(c))) {
      return `${engine.label} can’t sustain ${format.label}. It carries `
        + `${engine.cadences.join(' or ')}, and this format asks for ${format.cadences.join(' or ')}.`;
    }
    if (engine.carries !== undefined && spec.parts > engine.carries) {
      return `${engine.label} carries ${engine.carries} parts and you have asked for `
        + `${spec.parts}. It would run dry before the end.`;
    }
  }
  return undefined;
}

export function setShape(sim: Simulation, spec: Shape): { ok: boolean; error?: string } {
  const no = whyNotShape(sim, spec);
  if (no) return { ok: false, error: no };
  const project = projectById(sim, spec.projectId)!;
  const format = formatById(spec.formatId)!;
  project.formatId = spec.formatId;
  project.medium = format.medium;
  project.secondsEach = spec.secondsEach;
  project.owesSeconds = spec.parts * spec.secondsEach;
  // Rebuilt rather than patched: a shape change before the lock is a different
  // production, not an edit to this one.
  project.parts = Array.from({ length: spec.parts }, (_, i) => ({
    id: sim.nextId('part'),
    ordinal: i + 1,
    seconds: spec.secondsEach,
  }));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------

/**
 * The pool actors are drawn from.
 *
 * Every billed part draws from one pool rather than each having its own, because an
 * actor is an actor — the same person can be first billed on one picture and fourth
 * on another, and a pool per slot would make those two different people.
 */
export const THE_ACTORS = 'actor';

/** Who is up for a billed part. Draws from the actors, and remembers them. */
export function castingShortlist(
  sim: Simulation,
  projectId: Id,
  billingId: string,
): readonly Talent[] {
  return drawAPool(sim, `${projectId}:${billingId}`, THE_ACTORS);
}

export interface Casting {
  projectId: Id;
  billingId: string;
  talentId: Id;
  dealKind: DealKind;
}

export function whyNotCast(sim: Simulation, spec: Casting): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'cast')) return 'Everybody is contracted. The money has gone out.';
  if (!project.formatId || !project.parts?.length) return 'Choose a format before casting anybody.';
  const billing = billingById(spec.billingId);
  if (!billing) return `There is no part called '${spec.billingId}'.`;
  const wanted = castingFor(project.medium, project.parts.length);
  if (!wanted.some((one) => one.id === spec.billingId)) {
    return `${formatById(project.formatId)?.label ?? 'This'} at this length is cast with `
      + `${wanted.length} parts, and ${billing.label.toLowerCase()} is not one of them.`;
  }
  const talent = sim.universe.talent?.[spec.talentId];
  if (!talent) return 'Nobody of that name.';
  if (talent.postId !== THE_ACTORS) return `${talent.name} does not act.`;
  const already = Object.entries(project.billed ?? {})
    .find(([id, seat]) => id !== spec.billingId && seat.talentId === spec.talentId);
  if (already) return `${talent.name} is already ${billingById(already[0])?.label.toLowerCase()}.`;
  return undefined;
}

export function castThem(sim: Simulation, spec: Casting): { ok: boolean; error?: string } {
  const no = whyNotCast(sim, spec);
  if (no) return { ok: false, error: no };
  const project = projectById(sim, spec.projectId)!;
  const talent = sim.universe.talent[spec.talentId]!;
  const deal = offersFor(talent, project.parts!.length)[spec.dealKind];
  project.billed = {
    ...(project.billed ?? {}),
    [spec.billingId]: { talentId: talent.id, name: talent.name, standingId: talent.standingId, deal },
  };
  shut(project, 'shape');
  return { ok: true };
}

/** The reach of whoever is in each billed part, which the draw reads. */
export function castReachOf(project: Project): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const one of castingFor(project.medium, project.parts?.length ?? 1)) {
    out[one.id] = standingById(project.billed?.[one.id]?.standingId)?.reach ?? 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Writing it
// ---------------------------------------------------------------------------

export interface Writing {
  projectId: Id;
  genreId: string;
  /** The six dials, by id from `content/story.ts`. */
  dials: Readonly<Record<string, number>>;
}

/**
 * Why this script cannot be set.
 *
 * Behind the shape lock with everything else, and for the same reason: a writer who
 * took a share of the back end read this page before they signed. Rewriting it
 * afterwards would make every deal a promise the producer could withdraw.
 */
export function whyNotWriteIt(sim: Simulation, spec: Writing): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'shape')) {
    return 'The script is settled. Everybody engaged read this page before they signed.';
  }
  if (!genreById(spec.genreId)) return `There’s no genre called '${spec.genreId}'.`;
  return whyNotWrite(spec.dials as Partial<Record<Dial, number>>, carriedInto(sourceOf(sim, project)));
}

export function writeIt(sim: Simulation, spec: Writing): { ok: boolean; error?: string } {
  const no = whyNotWriteIt(sim, spec);
  if (no) return { ok: false, error: no };
  const project = projectById(sim, spec.projectId)!;
  project.genreId = spec.genreId;
  project.dials = { ...spec.dials };
  return { ok: true };
}

/** What the writer set, with an even spread where nobody set anything. */
export const dialsOn = (project: Project): Readonly<Record<string, number>> =>
  project.dials ?? UNWRITTEN;

// ---------------------------------------------------------------------------
// Engaging a person
// ---------------------------------------------------------------------------

export interface Engaging {
  projectId: Id;
  postId: string;
  talentId: Id;
  /** Fee or points. The decision this whole file is arranged around. */
  dealKind: DealKind;
}

export function whyNotEngage(sim: Simulation, spec: Engaging): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'cast')) return 'Everybody is contracted. The money has gone out.';
  if (!project.formatId || !project.parts?.length) return 'Choose a format before engaging anybody.';
  const post = postById(spec.postId);
  if (!post) return `There’s no post called '${spec.postId}'.`;
  const talent = sim.universe.talent?.[spec.talentId];
  if (!talent) return 'Nobody of that name.';
  if (talent.postId !== spec.postId) return `${talent.name} doesn’t do that job.`;
  if (spec.dealKind !== 'fee' && !post.aboveTheLine) {
    return `A ${post.title.toLowerCase()} is paid a fee. Only people an audience has `
      + 'heard of are offered a share of the back end or a bonus on a threshold.';
  }
  if (spec.dealKind === 'points') {
    const already = Object.values(project.engaged ?? {}).reduce((sum, one) => sum + one.deal.points, 0);
    const standing = standingById(talent.standingId);
    if (standing && already + standing.wantsPoints > MOST_POINTS) {
      return `That would give away ${Math.round(already + standing.wantsPoints)}% of the picture, `
        + `and nothing may go past ${MOST_POINTS}%.`;
    }
  }
  return undefined;
}

export function engage(sim: Simulation, spec: Engaging): { ok: boolean; error?: string } {
  const no = whyNotEngage(sim, spec);
  if (no) return { ok: false, error: no };
  const project = projectById(sim, spec.projectId)!;
  const talent = sim.universe.talent[spec.talentId]!;
  const deal = offersFor(talent, project.parts!.length)[spec.dealKind];
  const seat: Engagement = {
    talentId: talent.id, name: talent.name, standingId: talent.standingId, deal,
  };
  project.engaged = { ...(project.engaged ?? {}), [spec.postId]: seat };
  // The lock is here rather than in a command of its own, deliberately. A lock a
  // player has to remember to set records carelessness rather than commitment, and
  // the fiction is that engaging somebody *is* what settles what they signed for.
  shut(project, 'shape');
  return { ok: true };
}

/** What everybody engaged is owed at the greenlight. */
export const dealsOnIt = (project: Project) => [
  ...Object.values(project.engaged ?? {}),
  ...Object.values(project.billed ?? {}),
];

export const feesOn = (project: Project): Money =>
  upFrontCents(dealsOnIt(project).map((one) => one.deal));

/** What share of the back end has been given away. */
export const pointsGiven = (project: Project): number =>
  dealsOnIt(project).reduce((sum, one) => sum + one.deal.points, 0);

// ---------------------------------------------------------------------------
// Selling what is not the picture
// ---------------------------------------------------------------------------

export interface Selling {
  projectId: Id;
  ancillaryId: string;
  /** A guarantee now, or a share of what arrives. */
  kind: AncillaryDeal;
}

/**
 * Why nobody will do this deal.
 *
 * The genre refusal is the interesting one. A partner who would back anything is
 * not a partner, so a romance cannot sell action figures — and that is a fact about
 * romances rather than a penalty on one.
 */
export function whyNotSell(sim: Simulation, spec: Selling): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'opening')) return 'This one opened already. The deals are done.';
  const ancillary = ancillaryById(spec.ancillaryId);
  if (!ancillary) return `Nobody sells anything called '${spec.ancillaryId}'.`;
  if (!project.genreId) return 'Write it before anybody will talk about the merchandise.';
  if (!ancillary.suits.includes(project.genreId)) {
    const genre = genreById(project.genreId);
    return `Nobody is buying ${ancillary.label.toLowerCase()} off ${genre?.label ?? 'that'}. `
      + `What sells: ${ancillary.suits.join(', ')}.`;
  }
  if (project.ancillaries?.[spec.ancillaryId]) return 'That one is already sold.';
  return undefined;
}

/** What both partners would offer on this picture as it stands. */
export function offersOnIt(project: Project, ancillary: Ancillary) {
  const budget = project.budgetCents ?? project.spentCents;
  return offersOn(ancillary, budget, dialsOn(project)[ancillary.reads] ?? 0, MOST);
}

export function sell(sim: Simulation, spec: Selling): { ok: boolean; error?: string; cents: Money } {
  const no = whyNotSell(sim, spec);
  if (no) return { ok: false, error: no, cents: 0 };
  const project = projectById(sim, spec.projectId)!;
  const ancillary = ancillaryById(spec.ancillaryId)!;
  const offer = offersOnIt(project, ancillary)[spec.kind];

  if (offer.guaranteeCents > 0) {
    const banked = bankTheGuarantee(
      sim, project.companyId, project.id, ancillary.id, ancillary.label, offer.guaranteeCents,
    );
    if (!banked.ok) return { ok: false, error: banked.error, cents: 0 };
  }
  project.ancillaries = { ...(project.ancillaries ?? {}), [spec.ancillaryId]: offer };
  return { ok: true, cents: offer.guaranteeCents };
}

/** Every share deal a picture is carrying, for the run to take out of each receipt. */
export const soldOn = (project: Project): readonly Offer[] =>
  Object.values(project.ancillaries ?? {});

// ---------------------------------------------------------------------------
// The greenlight
// ---------------------------------------------------------------------------

export function whyNotCommit(sim: Simulation, projectId: Id, budgetCents = 0): string | undefined {
  const project = projectById(sim, projectId);
  if (!project) return 'No such project.';
  if (project.stage === 'greenlit' || project.stage === 'delivered') return 'The money is already committed.';
  if (project.shelvedAt) return 'Take it off the shelf first.';
  if (!project.formatId || !project.parts?.length) return 'No format has been chosen for it yet.';
  if (budgetCents < 0) return 'A picture cannot cost less than nothing to make.';
  const cash = cashAccountFor(sim.universe, project.companyId);
  if (!cash) return 'The company has no cash account.';
  const owed = feesOn(project) + budgetCents;
  if (cash.balance < owed) {
    return `Committing costs ${millions(owed)} and the company has ${millions(cash.balance)}. `
      + 'One of them would have to take points instead, or it has to be made for less.';
  }
  return undefined;
}

/**
 * Commits the money and shuts the cast.
 *
 * Two figures leave here and they are different kinds of money. The **fees** are
 * what the people cost. The **budget** is what the picture costs — the unit, the
 * stages, the build, the days — and until this took it, nothing in the build ever
 * charged it. `budgetCents` sat on a project with no writer while the box office
 * read `spentCents` to decide what the money on the screen bought, so a player could
 * declare an eighty million pound picture and pay for seven department heads.
 *
 * Both go out at the greenlight, before a frame exists, which is the single most
 * important thing a studio simulation has to get right: a failure has to cost
 * everything it cost.
 */
export function commit(
  sim: Simulation,
  projectId: Id,
  budgetCents = 0,
): { ok: boolean; error?: string; cents: Money } {
  const no = whyNotCommit(sim, projectId, budgetCents);
  if (no) return { ok: false, error: no, cents: 0 };
  const project = projectById(sim, projectId)!;
  const cents = feesOn(project) + budgetCents;
  const paid = chargeTheFees(sim, project.companyId, project.id, cents);
  if (!paid.ok) return { ok: false, error: paid.error, cents: 0 };
  project.stage = 'greenlit';
  project.budgetCents = budgetCents;
  project.spentCents += cents;
  shut(project, 'shape');
  shut(project, 'cast');
  for (const seat of Object.values(project.engaged ?? {})) {
    const talent = sim.universe.talent[seat.talentId];
    if (talent) talent.worked += 1;
  }
  return { ok: true, cents };
}

// ---------------------------------------------------------------------------
// Letting it out
// ---------------------------------------------------------------------------

export interface Opening {
  projectId: Id;
  channel: Channel;
  /** When it opens. The decision the calendar exists to make interesting. */
  at: number;
  campaignCents: Money;
}

export function whyNotOpen(sim: Simulation, spec: Opening): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (project.stage !== 'greenlit') return 'Nobody has committed the money yet.';
  if (isLocked(project, 'opening')) return 'This one opened already.';
  const format = formatById(project.formatId);
  if (!format) return 'Choose a format first.';
  const wrong = whyNotThisChannel(format, spec.channel);
  if (wrong) return wrong;
  if (spec.at < sim.now) return 'A release can’t open in a week that has gone.';
  if (spec.campaignCents < 0) return 'A campaign can’t cost less than nothing.';
  const cash = cashAccountFor(sim.universe, project.companyId);
  if (!cash) return 'The company has no cash account.';
  if (cash.balance < spec.campaignCents) {
    return `That campaign costs ${millions(spec.campaignCents)} and the company has `
      + `${millions(cash.balance)}.`;
  }
  return undefined;
}

/** Where this picture sits in its line, for the box office to read. */
export function entryFor(sim: Simulation, project: Project): Entry | undefined {
  const format = formatById(project.formatId);
  if (!format || !project.lineageId || (project.ordinal ?? 1) <= 1) return undefined;
  const before = projectsOf(sim.universe)
    .filter((p) => p.lineageId === project.lineageId && (p.ordinal ?? 1) < (project.ordinal ?? 1))
    .sort((a, b) => (b.ordinal ?? 0) - (a.ordinal ?? 0))[0];
  if (!before?.opening) return undefined;
  return {
    ordinal: project.ordinal ?? 1,
    lastReturned: returnedBy(sim, before.id),
    gapYears: Math.max(0, (sim.now - before.opening.at) / (MS_WEEK * 52)),
    carriesForward: format.carriesForward,
  };
}

/**
 * Where this picture sits in a shared world, where it is in one.
 *
 * The same shape as the line entry and read off a different set of pictures: every
 * title carrying the badge rather than every chapter of one story. A picture can be
 * in both, and the two are counted separately because they are separately true.
 */
export function worldEntryFor(sim: Simulation, project: Project): Entry | undefined {
  const format = formatById(project.formatId);
  if (!format || !project.universeId) return undefined;
  const others = projectsOf(sim.universe)
    .filter((p) => p.universeId === project.universeId && p.id !== project.id && p.opening)
    .sort((a, b) => (b.opening!.at) - (a.opening!.at));
  if (others.length === 0) return undefined;
  const last = others[0]!;
  return {
    ordinal: others.length + 1,
    lastReturned: returnedBy(sim, last.id),
    gapYears: Math.max(0, (sim.now - last.opening!.at) / (MS_WEEK * 52)),
    carriesForward: format.carriesForward,
  };
}

export interface Joining {
  projectId: Id;
  /** The world it joins. Any name; the first picture to use one founds it. */
  universeId: string;
}

/**
 * Why this cannot join that world.
 *
 * Behind the shape lock, because what a picture is part of is a thing the people
 * signing on to it were told. And refused outright for a format that carries almost
 * nothing forward — a shared world made of things nobody remembers the name of is a
 * badge on an empty box.
 */
export function whyNotJoin(sim: Simulation, spec: Joining): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'shape')) return 'The shape is settled, and so is what it belongs to.';
  if (!spec.universeId.trim()) return 'A world needs a name.';
  const format = formatById(project.formatId);
  if (!format) return 'Choose a format first.';
  if (format.carriesForward <= 0.1) {
    return `${format.label} carries almost nothing forward, so a shared world built `
      + 'on it would be a badge and nothing else.';
  }
  return undefined;
}

export function join(sim: Simulation, spec: Joining): { ok: boolean; error?: string } {
  const no = whyNotJoin(sim, spec);
  if (no) return { ok: false, error: no };
  projectById(sim, spec.projectId)!.universeId = spec.universeId.trim().slice(0, 60);
  return { ok: true };
}

export interface Opened {
  ok: boolean;
  error?: string;
  reckonedCents: Money;
  wordOfMouth: number;
  receipt: readonly string[];
}

/**
 * Opens it: charges the campaign, reckons the run once, and arms the weekly tick.
 *
 * The order is the order money actually moves, and the campaign going first matters —
 * a company that cannot afford it never finds out what the picture would have taken,
 * which is the correct and unpleasant shape of the thing.
 */
export function open(sim: Simulation, spec: Opening): Opened {
  const nothing = { reckonedCents: 0, wordOfMouth: 0, receipt: [] as readonly string[] };
  const no = whyNotOpen(sim, spec);
  if (no) return { ok: false, error: no, ...nothing };
  const project = projectById(sim, spec.projectId)!;
  const format = formatById(project.formatId)!;

  const charged = chargeTheCampaign(sim, project.companyId, project.id, spec.campaignCents);
  if (!charged.ok) return { ok: false, error: charged.error, ...nothing };

  const spec2: Spec = {
    format,
    parts: project.parts!.length,
    secondsEach: project.secondsEach ?? format.secondsEach.least,
    spentCents: project.spentCents + spec.campaignCents,
    campaignCents: spec.campaignCents,
    reach: reachOf(project),
    castReach: castReachOf(project),
    genre: genreById(project.genreId),
    dials: dialsOn(project) as Partial<Record<Dial, number>>,
    source: sourceOf(sim, project),
    engine: engineById(project.concept?.engineId),
    month: new Date(spec.at).getUTCMonth(),
    crowding: crowding(sim, spec.at, spec.channel, project.title),
    entry: entryFor(sim, project),
    inAWorld: worldEntryFor(sim, project),
  };
  const reckoning = reckon(spec2);

  project.opening = {
    at: spec.at,
    channel: spec.channel,
    campaignCents: spec.campaignCents,
    reckonedCents: reckoning.cents,
    wordOfMouth: reckoning.wordOfMouth,
    weeksPaid: 0,
  };
  project.stage = 'delivered';
  project.releasedAt = spec.at;
  shut(project, 'opening');
  armTheRun(sim, project.id, project.title);

  return {
    ok: true,
    reckonedCents: reckoning.cents,
    wordOfMouth: reckoning.wordOfMouth,
    receipt: reckoning.said.map((n) => `${n.by}: ${n.why}`),
  };
}

// ---------------------------------------------------------------------------
// Shelving, and following up
// ---------------------------------------------------------------------------

/**
 * Takes a picture off the slate, or puts it back.
 *
 * `shelvedAt` was read by six things and written by nothing in the whole of `src/`,
 * which is a guard no input could trip. It stayed that way because the command was
 * never built, not because anybody decided a picture could not be shelved.
 */
export function shelve(sim: Simulation, projectId: Id, off: boolean): { ok: boolean; error?: string } {
  const project = projectById(sim, projectId);
  if (!project) return { ok: false, error: 'No such project.' };
  if (project.opening) return { ok: false, error: 'This one opened already.' };
  if (off) {
    if (!project.shelvedAt) return { ok: false, error: 'There’s nothing shelved to bring back.' };
    delete project.shelvedAt;
    project.stage = project.formatId ? 'packaged' : 'idea';
    return { ok: true };
  }
  if (project.shelvedAt) return { ok: false, error: 'The shelf has it already.' };
  project.shelvedAt = sim.now;
  project.stage = 'shelved';
  return { ok: true };
}

export function whyNotFollowUp(sim: Simulation, projectId: Id): string | undefined {
  const project = projectById(sim, projectId);
  if (!project) return 'No such project.';
  if (!project.opening) return 'There’s nothing to follow yet: it hasn’t come out.';
  const format = formatById(project.formatId);
  if (!format) return 'Choose a format first.';
  if (format.carriesForward <= 0.1) {
    return `${format.label} carries almost nothing forward. A follow-up would be starting `
      + 'from nothing with a familiar title on it.';
  }
  return undefined;
}

/**
 * Starts the next one in the line.
 *
 * Deliberately allowed when the line is past its best rather than refused. A player
 * has to be able to make a fourth one that should not exist, because discovering
 * where inheritance stops outrunning fatigue is the whole of the mechanic and a
 * refusal would teach it for free.
 */
export function followUp(
  sim: Simulation,
  projectId: Id,
  title: string,
): { ok: boolean; error?: string; projectId?: Id; inherits?: number } {
  const no = whyNotFollowUp(sim, projectId);
  if (no) return { ok: false, error: no };
  const from = projectById(sim, projectId)!;
  const lineageId = from.lineageId ?? from.id;
  if (!from.lineageId) { from.lineageId = lineageId; from.ordinal = 1; }
  const ordinal = projectsOf(sim.universe)
    .filter((p) => p.lineageId === lineageId)
    .reduce((most, p) => Math.max(most, p.ordinal ?? 1), 0) + 1;

  const made: Project = {
    id: sim.nextId('project'),
    saveId: sim.universe.meta.id,
    companyId: from.companyId,
    title,
    medium: from.medium,
    stage: 'idea',
    startedAt: sim.now,
    spentCents: 0,
    delivered: [],
    concept: from.concept,
    holdingId: from.holdingId,
    lineageId,
    ordinal,
  };
  sim.universe.projects[made.id] = made;

  const format = formatById(from.formatId)!;
  const would = inherits({
    ordinal,
    lastReturned: returnedBy(sim, from.id),
    gapYears: Math.max(0, (sim.now - from.opening!.at) / (MS_WEEK * 52)),
    carriesForward: format.carriesForward,
  });
  return { ok: true, projectId: made.id, inherits: would };
}

// ---------------------------------------------------------------------------

type Done = { ok: boolean; error?: string };

export function registerProduction(sim: Simulation): void {
  sim.onCommand<Shape, Done>('production.shape', (p) => setShape(sim, p));
  sim.onCommand<Writing, Done>('production.write', (p) => writeIt(sim, p));
  sim.onCommand<Engaging, Done>('production.engage', (p) => engage(sim, p));
  sim.onCommand<Selling, Done>('production.sell', (p) => sell(sim, p));
  sim.onCommand<Joining, Done>('production.join', (p) => join(sim, p));
  sim.onCommand<Casting, Done>('production.cast', (p) => castThem(sim, p));
  sim.onCommand<{ projectId: Id; budgetCents?: number }, Done>(
    'production.commit', (p) => commit(sim, p.projectId, Math.max(0, Math.round(p.budgetCents ?? 0))),
  );
  sim.onCommand<Opening, Opened>('production.open', (p) => open(sim, p));
  sim.onCommand<{ projectId: Id; off?: boolean }, Done>(
    'production.shelve', (p) => shelve(sim, p.projectId, p.off === true),
  );
  sim.onCommand<{ projectId: Id; title: string }, Done>(
    'production.follow_up', (p) => followUp(sim, p.projectId, p.title),
  );
}
