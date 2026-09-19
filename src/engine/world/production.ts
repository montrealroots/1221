/**
 * SLATE — the production, and the doors that shut behind you.
 *
 * The complaint this file answers was exact: *I do not have full control over the
 * production process at all.* It was accurate. Across the whole old pipeline the
 * player supplied nine numbers and three enum picks, and the engine decided the
 * periods, every date but one, the stage, the crew, the part count, the roles, the
 * overrun, the fee and the sale. The rebuild inverts that. Here the player chooses
 * the format, the shape, every department head and the campaign, and the engine
 * decides only what a producer genuinely would not: what the audience does.
 *
 * ## The progressive lock, which is the actual mechanic
 *
 * Control without consequence is a form with more fields on it. What makes these
 * choices weigh anything is that they stop being changeable, in an order, and each
 * lock has a reason inside the fiction rather than outside it:
 *
 *   1. **The shape locks when you engage the heads.** You cannot tell a first-call
 *      director this is a twelve-part series, agree their fee, and then make three
 *      parts. Their price was quoted against the work.
 *   2. **The staffing locks at the greenlight.** After the money is committed the
 *      cast and crew are contracted, and firing one is a different kind of act
 *      than not hiring them.
 *   3. **The campaign locks at release.** Most of it is already spent by then, and
 *      the run has started.
 *
 * Every one of those refusals reads a field that something else also reads, which
 * is the test. A lock that only guarded itself would be ceremony.
 *
 * ## What is deliberately not here
 *
 * No stage booking, no period ladder, no overrun model, no delivery elements. Those
 * went with the old system and they will come back as their own modules if and when
 * something reads them. A pipeline that declares eleven stages and moves a cursor
 * through them without any of them changing an outcome is what the last one was.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import { millions, type Money } from '../core/money';
import type { Project } from '../domain/company';
import type { Channel } from '../content/format';
import { formatById, whyNotThisShape } from '../content/format';
import { engineById } from '../content/concept';
import { BAND_BY_ID, DEFAULT_BAND, DEPARTMENTS, headsCostCents } from '../content/department';
import { whyNotThisChannel } from '../content/release';
import { reckonTheRun, type Spec } from './boxoffice';
import { bankTheRun, chargeTheCampaign, chargeTheHeads } from './takings';
import { projectsOf, cashAccountFor } from './company';

/** The three locks, in the order they shut. */
export type Lock = 'shape' | 'staffing' | 'campaign';

export const LOCKS: readonly Lock[] = ['shape', 'staffing', 'campaign'];

export const LOCK_SAID: Readonly<Record<Lock, string>> = {
  shape: 'The format, the part count and the runtime are settled.',
  staffing: 'The heads are contracted.',
  campaign: 'The campaign is placed and the run has begun.',
};

const locksOf = (project: Project): readonly string[] => project.locked ?? [];

/** Whether a lock has shut on this project. */
export const isLocked = (project: Project, lock: Lock): boolean => locksOf(project).includes(lock);

const shut = (project: Project, lock: Lock): void => {
  if (!isLocked(project, lock)) project.locked = [...locksOf(project), lock];
};

/** The project with this id, on this save, or undefined. */
export function projectById(sim: Simulation, projectId: Id): Project | undefined {
  return projectsOf(sim.universe).find((p) => p.id === projectId);
}

// ---------------------------------------------------------------------------
// Choosing the shape
// ---------------------------------------------------------------------------

export interface Shape {
  projectId: Id;
  formatId: string;
  parts: number;
  /** Seconds of finished screen time per part. */
  secondsEach: number;
}

/**
 * Why this shape cannot be set on this project.
 *
 * Four refusals, and the third is the one that ties this file to the story engine
 * rather than leaving the two systems side by side. A format declares which
 * cadences it can take; an engine declares which cadences it can sustain; a
 * television project with an engine that cannot carry the format's cadence is
 * refused here with both names in the message.
 */
export function whyNotShape(sim: Simulation, spec: Shape): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'shape')) {
    return 'The shape is settled. The heads were engaged against this many parts at this length.';
  }
  const format = formatById(spec.formatId);
  if (!format) return `There is no format called '${spec.formatId}'.`;

  const wrong = whyNotThisShape(format, spec.parts, spec.secondsEach);
  if (wrong) return wrong;

  if (format.medium === 'television') {
    const engine = engineById(project.concept?.engineId);
    if (!engine) {
      return `${format.label} is television, and television needs a story engine under it. `
        + 'Conceive it first.';
    }
    const canTake = format.cadences.filter((c) => engine.cadences.includes(c));
    if (canTake.length === 0) {
      return `${engine.label} cannot sustain ${format.label}. It carries `
        + `${engine.cadences.join(' or ')}, and this format asks for ${format.cadences.join(' or ')}.`;
    }
    if (engine.carries !== undefined && spec.parts > engine.carries) {
      return `${engine.label} carries ${engine.carries} parts and you have asked for ${spec.parts}. `
        + 'It would run dry before the end.';
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
  // The parts array is the thing the cutting room and the schedule read, and it
  // is rebuilt rather than patched: a shape change before the lock is a different
  // production, not an edit to this one.
  project.parts = Array.from({ length: spec.parts }, (_, i) => ({
    id: sim.nextId('part'),
    ordinal: i + 1,
    seconds: spec.secondsEach,
  }));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Staffing
// ---------------------------------------------------------------------------

export interface Staffing {
  projectId: Id;
  /** Department id to band id. Departments left out keep whatever they had. */
  posts: Readonly<Record<string, string>>;
}

export function whyNotStaff(sim: Simulation, spec: Staffing): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (isLocked(project, 'staffing')) {
    return 'The heads are contracted. Past the greenlight they cannot simply be changed.';
  }
  if (!project.formatId) return 'Choose a format before engaging anybody.';
  for (const [deptId, bandId] of Object.entries(spec.posts)) {
    if (!DEPARTMENTS.some((d) => d.id === deptId)) return `There is no department called '${deptId}'.`;
    if (!BAND_BY_ID[bandId]) return `There is no standing called '${bandId}'.`;
  }
  return undefined;
}

/**
 * Engages heads, and shuts the shape behind them.
 *
 * The lock is here rather than in its own command on purpose. A lock the player
 * has to remember to set is a lock that records carelessness rather than
 * commitment, and the fiction is that engaging somebody *is* the act that settles
 * what they were engaged for.
 */
export function staff(sim: Simulation, spec: Staffing): { ok: boolean; error?: string } {
  const no = whyNotStaff(sim, spec);
  if (no) return { ok: false, error: no };
  const project = projectById(sim, spec.projectId)!;
  project.staffing = { ...(project.staffing ?? {}), ...spec.posts };
  shut(project, 'shape');
  return { ok: true };
}

/** What every post stands at, with the engine's own pick where nobody chose. */
export function staffingOf(project: Project): Readonly<Record<string, string>> {
  const chosen = project.staffing ?? {};
  const full: Record<string, string> = {};
  for (const dept of DEPARTMENTS) full[dept.id] = chosen[dept.id] ?? DEFAULT_BAND;
  return full;
}

// ---------------------------------------------------------------------------
// The greenlight
// ---------------------------------------------------------------------------

export function whyNotCommit(sim: Simulation, projectId: Id): string | undefined {
  const project = projectById(sim, projectId);
  if (!project) return 'No such project.';
  if (project.stage === 'greenlit' || project.stage === 'delivered') return 'It is already committed.';
  if (project.shelvedAt) return 'It is shelved. Take it off the shelf first.';
  if (!project.formatId) return 'It has no format.';
  if (!project.parts || project.parts.length === 0) return 'It has no parts.';
  const cash = cashAccountFor(sim.universe, project.companyId);
  if (!cash) return 'The company has no cash account.';
  const owed = headsCostCents(staffingOf(project), project.parts.length);
  if (cash.balance < owed) {
    return `The heads want ${millions(owed)} and the company has `
      + `${millions(cash.balance)}.`;
  }
  return undefined;
}

/**
 * Commits the money and shuts the staffing.
 *
 * The heads are paid here rather than at release, because that is when the money
 * actually leaves — and because a model where crew are paid out of the takings
 * would make a failure free, which is the single most important thing a studio
 * simulation has to get right.
 */
export function commit(sim: Simulation, projectId: Id): { ok: boolean; error?: string; cents: Money } {
  const no = whyNotCommit(sim, projectId);
  if (no) return { ok: false, error: no, cents: 0 };
  const project = projectById(sim, projectId)!;
  const cents = headsCostCents(staffingOf(project), project.parts!.length);
  const paid = chargeTheHeads(sim, project.companyId, project.id, cents);
  if (!paid.ok) return { ok: false, error: paid.error, cents: 0 };
  project.stage = 'greenlit';
  project.spentCents += cents;
  shut(project, 'shape');
  shut(project, 'staffing');
  return { ok: true, cents };
}

// ---------------------------------------------------------------------------
// The release
// ---------------------------------------------------------------------------

export interface Releasing {
  projectId: Id;
  channel: Channel;
  campaignCents: Money;
  /**
   * How much else is opening against it, 0 to 1.
   *
   * Supplied by the caller rather than drawn here, because the field is a fact
   * about the world on a date and this function is about one picture. The text
   * simulation computes it from what else released that month.
   */
  field?: number;
}

export function whyNotRelease(sim: Simulation, spec: Releasing): string | undefined {
  const project = projectById(sim, spec.projectId);
  if (!project) return 'No such project.';
  if (project.stage !== 'greenlit') return 'It has not been committed yet.';
  if (isLocked(project, 'campaign')) return 'It has already been released.';
  const format = formatById(project.formatId);
  if (!format) return 'It has no format.';
  const wrongChannel = whyNotThisChannel(format, spec.channel);
  if (wrongChannel) return wrongChannel;
  if (spec.campaignCents < 0) return 'A campaign cannot cost less than nothing.';
  const cash = cashAccountFor(sim.universe, project.companyId);
  if (!cash) return 'The company has no cash account.';
  if (cash.balance < spec.campaignCents) {
    return `That campaign costs ${millions(spec.campaignCents)} and the company has `
      + `${millions(cash.balance)}.`;
  }
  return undefined;
}

export interface Released {
  ok: boolean;
  error?: string;
  /** What reached the company, in cents. */
  cents: Money;
  /** The run, receipt and all, for the report. */
  run?: ReturnType<typeof reckonTheRun>;
}

/**
 * Releases it: charges the campaign, reckons the run, banks every window.
 *
 * The order is the order money actually moves, and it matters that the campaign is
 * charged first. A company that cannot afford the campaign never finds out what the
 * picture would have taken, which is the correct and unpleasant shape of the thing.
 */
export function release(sim: Simulation, spec: Releasing): Released {
  const no = whyNotRelease(sim, spec);
  if (no) return { ok: false, error: no, cents: 0 };
  const project = projectById(sim, spec.projectId)!;
  const format = formatById(project.formatId)!;

  const charged = chargeTheCampaign(sim, project.companyId, project.id, spec.campaignCents);
  if (!charged.ok) return { ok: false, error: charged.error, cents: 0 };

  const month = new Date(sim.now).getUTCMonth();
  const reckoning: Spec = {
    format,
    parts: project.parts!.length,
    secondsEach: project.secondsEach ?? format.secondsEach.least,
    spentCents: project.spentCents,
    campaignCents: spec.campaignCents,
    staffing: staffingOf(project),
    engine: engineById(project.concept?.engineId),
    month,
    field: spec.field ?? 0,
  };
  const run = reckonTheRun(reckoning, spec.channel);

  const banked = bankTheRun(sim, project.companyId, project.id, run);
  if (!banked.ok) return { ok: false, error: banked.error, cents: 0 };

  project.stage = 'delivered';
  project.channel = spec.channel;
  project.campaignCents = spec.campaignCents;
  project.releasedAt = sim.now;
  shut(project, 'campaign');
  return { ok: true, cents: banked.cents, run };
}

// ---------------------------------------------------------------------------
// Shelving, which nothing used to write
// ---------------------------------------------------------------------------

/**
 * Takes a project off the slate, or puts it back.
 *
 * `Project.shelvedAt` was read by six things and written by nothing in the whole
 * of `src/`. A guard no input can trip is the defect class the gate already fails
 * on, and it stayed that way because the command was never built rather than
 * because anybody decided a picture could not be shelved.
 */
export function shelve(sim: Simulation, projectId: Id, off: boolean): { ok: boolean; error?: string } {
  const project = projectById(sim, projectId);
  if (!project) return { ok: false, error: 'No such project.' };
  if (project.stage === 'delivered') return { ok: false, error: 'It is already out.' };
  if (off) {
    if (!project.shelvedAt) return { ok: false, error: 'It is not shelved.' };
    delete project.shelvedAt;
    if (project.stage === 'shelved') project.stage = project.formatId ? 'packaged' : 'idea';
    return { ok: true };
  }
  if (project.shelvedAt) return { ok: false, error: 'It is already shelved.' };
  project.shelvedAt = sim.now;
  project.stage = 'shelved';
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

type Done = { ok: boolean; error?: string };

export function registerProduction(sim: Simulation): void {
  sim.onCommand<Shape, Done>('production.shape', (payload) => setShape(sim, payload));
  sim.onCommand<Staffing, Done>('production.staff', (payload) => staff(sim, payload));
  sim.onCommand<{ projectId: Id }, Done>('production.commit', (payload) => commit(sim, payload.projectId));
  sim.onCommand<Releasing, Released>('production.release', (payload) => release(sim, payload));
  sim.onCommand<{ projectId: Id; off?: boolean }, Done>(
    'production.shelve',
    (payload) => shelve(sim, payload.projectId, payload.off === true),
  );
}
