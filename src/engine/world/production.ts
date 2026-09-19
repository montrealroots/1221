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
import { POSTS, UNFILLED_REACH, postById } from '../content/craft';
import {
  MOST_POINTS, STANDINGS, offersFrom, standingById, upFrontCents, type DealKind,
} from '../content/talent';
import { MEN, WOMEN, patronymic } from '../content/names';
import { inherits, type Entry } from '../content/lineage';
import { UNWRITTEN, genreById, whyNotWrite, type Dial } from '../content/story';
import { carriedInto, sourceById, whyNotFrom, type Source } from '../content/source';
import { reckon, type Spec } from './boxoffice';
import { chargeTheCampaign, chargeTheFees, returnedBy } from './takings';
import { armTheRun } from './run';
import { crowding } from './field';
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
  const post = postById(postId);
  if (!post) return [];
  const known = Object.values(sim.universe.talent ?? {})
    .filter((one) => one.postId === postId);
  const before = known.filter((one) => one.worked > 0).slice(0, 2);

  const want = A_SHORTLIST_IS - before.length;
  const drawn: Talent[] = [];
  const rng = sim.rng('casting', projectId, postId);
  for (let i = 0; i < want; i += 1) {
    const roll = rng.next();
    // Weighted down the rungs: plenty of people are working and very few are first
    // call, which is what makes the top of the list feel like a decision rather than
    // a default.
    const standing = STANDINGS[roll < 0.42 ? 0 : roll < 0.74 ? 1 : roll < 0.92 ? 2 : 3]!;
    const made: Talent = {
      id: sim.nextId('talent'),
      saveId: sim.universe.meta.id,
      name: aName(rng.next(), rng.next()),
      postId,
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
  for (const post of POSTS) {
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
  if (spec.dealKind === 'points' && !post.aboveTheLine) {
    return `A ${post.title.toLowerCase()} is paid a fee. Only people an audience has `
      + 'heard of are offered a share of the back end.';
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
export const feesOn = (project: Project): Money =>
  upFrontCents(Object.values(project.engaged ?? {}).map((one) => one.deal));

/** What share of the back end has been given away. */
export const pointsGiven = (project: Project): number =>
  Object.values(project.engaged ?? {}).reduce((sum, one) => sum + one.deal.points, 0);

// ---------------------------------------------------------------------------
// The greenlight
// ---------------------------------------------------------------------------

export function whyNotCommit(sim: Simulation, projectId: Id): string | undefined {
  const project = projectById(sim, projectId);
  if (!project) return 'No such project.';
  if (project.stage === 'greenlit' || project.stage === 'delivered') return 'The money is already committed.';
  if (project.shelvedAt) return 'Take it off the shelf first.';
  if (!project.formatId || !project.parts?.length) return 'No format has been chosen for it yet.';
  const cash = cashAccountFor(sim.universe, project.companyId);
  if (!cash) return 'The company has no cash account.';
  const owed = feesOn(project);
  if (cash.balance < owed) {
    return `The fees come to ${millions(owed)} and the company has ${millions(cash.balance)}. `
      + 'One of them would have to take points instead.';
  }
  return undefined;
}

export function commit(sim: Simulation, projectId: Id): { ok: boolean; error?: string; cents: Money } {
  const no = whyNotCommit(sim, projectId);
  if (no) return { ok: false, error: no, cents: 0 };
  const project = projectById(sim, projectId)!;
  const cents = feesOn(project);
  const paid = chargeTheFees(sim, project.companyId, project.id, cents);
  if (!paid.ok) return { ok: false, error: paid.error, cents: 0 };
  project.stage = 'greenlit';
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
    genre: genreById(project.genreId),
    dials: dialsOn(project) as Partial<Record<Dial, number>>,
    source: sourceOf(sim, project),
    engine: engineById(project.concept?.engineId),
    month: new Date(spec.at).getUTCMonth(),
    crowding: crowding(sim, spec.at, spec.channel, project.title),
    entry: entryFor(sim, project),
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
  sim.onCommand<{ projectId: Id }, Done>('production.commit', (p) => commit(sim, p.projectId));
  sim.onCommand<Opening, Opened>('production.open', (p) => open(sim, p));
  sim.onCommand<{ projectId: Id; off?: boolean }, Done>(
    'production.shelve', (p) => shelve(sim, p.projectId, p.off === true),
  );
  sim.onCommand<{ projectId: Id; title: string }, Done>(
    'production.follow_up', (p) => followUp(sim, p.projectId, p.title),
  );
}
