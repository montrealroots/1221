/**
 * SLATE — test screenings and post-production revisions.
 *
 * A screening is information. It does not improve a picture by being watched.
 * A revision is work and can help or hurt. That distinction keeps the mechanic
 * causal: the audience tells the producer where the cut is weak, and only the
 * edit that follows changes the eventual commercial result.
 */

import type { Simulation } from '../core/simulation';
import { MS_DAY } from '../core/time';
import type { Id } from '../domain/model';
import type { Money } from '../core/money';
import type {
  PostRevision,
  Project,
  TestScreening,
  TestScreeningFocus,
} from '../domain/company';
import { cashAccountFor } from '../world/company';
import { castOn } from '../world/casting';

export const SCREENING_KIND = 'production.testing.screening.complete';
export const REVISION_KIND = 'production.testing.revision.complete';

export const SCREENING_COST_CENTS: Money = 25_000_00;
export const REVISION_COST_CENTS: Money = 120_000_00;
export const SCREENING_DAYS = 2;
export const REVISION_DAYS = 10;
export const MAX_REVISIONS = 3;

export const SCREENING_FOCI: readonly { id: TestScreeningFocus; label: string }[] = [
  { id: 'story', label: 'Story' },
  { id: 'character', label: 'Character' },
  { id: 'pace', label: 'Pace' },
  { id: 'clarity', label: 'Clarity' },
];

export interface TestingResult {
  ok: boolean;
  error?: string;
  completesAt?: number;
}

function testingOf(project: Project) {
  if (!project.testing) project.testing = { screenings: [], revisions: [] };
  return project.testing;
}

export const pendingScreening = (project: Project): TestScreening | undefined =>
  project.testing?.screenings.find((one) => one.status === 'pending');

export const pendingRevision = (project: Project): PostRevision | undefined =>
  project.testing?.revisions.find((one) => one.status === 'pending');

export function latestScreening(project: Project): TestScreening | undefined {
  return project.testing?.screenings
    .filter((one) => one.status === 'completed')
    .slice()
    .sort((a, b) => (b.completesAt - a.completesAt) || (b.sequence - a.sequence))[0];
}

/** Net effect of actual edit work, deliberately capped so re-editing cannot become a money printer. */
export function postRevisionAdjustment(project: Project): number {
  const total = (project.testing?.revisions ?? [])
    .filter((one) => one.status === 'completed')
    .reduce((sum, one) => sum + (one.effect ?? 0), 0);
  return Math.max(-12, Math.min(18, total));
}

function charge(sim: Simulation, project: Project, amount: Money, memo: string): string | undefined {
  const account = cashAccountFor(sim.universe, project.companyId);
  if (!account) return 'The company has no production account to pay post-production from.';
  sim.expense(account.id, amount, project.title + ': ' + memo, 'business',
    { refType: 'project', refId: project.id });
  return undefined;
}

export function commissionScreening(sim: Simulation, projectId: Id): TestingResult {
  const project = sim.universe.projects[projectId];
  if (!project) return { ok: false, error: 'There is no such project.' };
  if (project.stage !== 'post') {
    return { ok: false, error: 'A test screening needs a cut in post-production.' };
  }
  if (pendingScreening(project) || pendingRevision(project)) {
    return { ok: false, error: 'Post-production already has work underway.' };
  }

  const payment = charge(sim, project, SCREENING_COST_CENTS, 'Test Screening');
  if (payment) return { ok: false, error: payment };
  const state = testingOf(project);
  const sequence = state.screenings.length + 1;
  const completesAt = sim.now + SCREENING_DAYS * MS_DAY;
  state.screenings.push({
    sequence,
    requestedAt: sim.now,
    completesAt,
    costCents: SCREENING_COST_CENTS,
    status: 'pending',
  });
  sim.schedule({
    at: completesAt,
    kind: SCREENING_KIND,
    label: project.title + ': Test Screening',
    category: 'business',
    payload: { projectId, sequence },
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, completesAt };
}

function noise(center: number, roll: number, width = 10): number {
  return Math.max(0, Math.min(100, Math.round(center + (roll - 0.5) * width * 2)));
}

function completeScreening(sim: Simulation, projectId: Id, sequence: number): void {
  const project = sim.universe.projects[projectId];
  if (!project || project.stage !== 'post') return;
  const row = project.testing?.screenings.find((one) => one.sequence === sequence);
  if (!row || row.status !== 'pending') return;

  const script = project.development?.screenplay.quality ?? 50;
  const truth = castOn(sim, project, 'truth') ?? 50;
  const reads = castOn(sim, project, 'reads') ?? 50;
  const edit = postRevisionAdjustment(project);
  const rng = sim.rng('production', 'test-screening', project.id, String(sequence));

  row.story = noise(script + edit * 0.7, rng.next(), 8);
  row.character = noise(script * 0.35 + truth * 0.65 + edit * 0.5, rng.next(), 9);
  row.pace = noise(48 + script * 0.38 + edit, rng.next(), 11);
  row.clarity = noise(script * 0.72 + reads * 0.18 + 8 + edit * 0.8, rng.next(), 8);
  row.audienceScore = Math.round(
    row.story * 0.32 + row.character * 0.28 + row.pace * 0.2 + row.clarity * 0.2,
  );
  row.status = 'completed';

  sim.notify({
    category: 'business',
    title: project.title + ': Test Screening Results',
    body: 'The audience came back at ' + row.audienceScore + '/100. '
      + 'Story ' + row.story + ', character ' + row.character
      + ', pace ' + row.pace + ', clarity ' + row.clarity + '.',
    importance: 48,
    refType: 'project',
    refId: project.id,
  });
}

function focusScore(screening: TestScreening, focus: TestScreeningFocus): number {
  return screening[focus] ?? screening.audienceScore ?? 50;
}

export function commissionRevision(
  sim: Simulation,
  projectId: Id,
  focus: TestScreeningFocus,
): TestingResult {
  const project = sim.universe.projects[projectId];
  if (!project) return { ok: false, error: 'There is no such project.' };
  if (project.stage !== 'post') return { ok: false, error: 'A re-edit belongs in post-production.' };
  if (!SCREENING_FOCI.some((one) => one.id === focus)) {
    return { ok: false, error: 'That is not a re-edit focus.' };
  }
  if (pendingScreening(project) || pendingRevision(project)) {
    return { ok: false, error: 'Post-production already has work underway.' };
  }
  const state = testingOf(project);
  if (state.revisions.length >= MAX_REVISIONS) {
    return { ok: false, error: 'This cut has already used every re-edit pass the schedule allows.' };
  }
  const screening = latestScreening(project);
  if (!screening) return { ok: false, error: 'Screen the current cut before ordering a re-edit.' };
  const lastRevision = state.revisions
    .filter((one) => one.status === 'completed')
    .slice()
    .sort((a, b) => b.completesAt - a.completesAt)[0];
  if (lastRevision && screening.completesAt <= lastRevision.completesAt) {
    return { ok: false, error: 'Screen the new cut before ordering another re-edit.' };
  }

  const payment = charge(sim, project, REVISION_COST_CENTS, 'Re-Edit — ' + focus);
  if (payment) return { ok: false, error: payment };

  const sequence = state.revisions.length + 1;
  const completesAt = sim.now + REVISION_DAYS * MS_DAY;
  state.revisions.push({
    sequence,
    focus,
    startedAt: sim.now,
    completesAt,
    costCents: REVISION_COST_CENTS,
    status: 'pending',
  });
  sim.schedule({
    at: completesAt,
    kind: REVISION_KIND,
    label: project.title + ': Re-Edit',
    category: 'business',
    payload: { projectId, sequence },
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, completesAt };
}

function completeRevision(sim: Simulation, projectId: Id, sequence: number): void {
  const project = sim.universe.projects[projectId];
  if (!project || project.stage !== 'post') return;
  const row = project.testing?.revisions.find((one) => one.sequence === sequence);
  if (!row || row.status !== 'pending') return;
  const screening = latestScreening(project);
  if (!screening) return;

  const at = focusScore(screening, row.focus);
  const roll = sim.rng('production', 're-edit', project.id, String(sequence), row.focus).next();
  const headroom = 100 - at;
  const craft = (headroom - 25) * 0.08 + (roll - 0.5) * 2.5;
  row.effect = Math.max(-4, Math.min(7, Math.round(craft)));
  row.status = 'completed';

  sim.notify({
    category: 'business',
    title: project.title + ': Re-Edit Complete',
    body: row.focus + ' was the focus. The cut moved '
      + (row.effect >= 0 ? '+' : '') + row.effect
      + ' points in the post-production adjustment used by the commercial model.',
    importance: row.effect >= 0 ? 42 : 55,
    refType: 'project',
    refId: project.id,
  });
}

export function registerTesting(sim: Simulation): void {
  sim.onSchedule(SCREENING_KIND, (item, s) => {
    const projectId = String(item.payload?.projectId ?? '');
    const sequence = Number(item.payload?.sequence ?? 0);
    if (!projectId || !Number.isFinite(sequence)) return;
    completeScreening(s, projectId, sequence);
  });
  sim.onSchedule(REVISION_KIND, (item, s) => {
    const projectId = String(item.payload?.projectId ?? '');
    const sequence = Number(item.payload?.sequence ?? 0);
    if (!projectId || !Number.isFinite(sequence)) return;
    completeRevision(s, projectId, sequence);
  });
  sim.onCommand<{ projectId: Id }, TestingResult>(
    'production.testing.screen',
    (payload, { sim: s }) => commissionScreening(s, payload.projectId),
  );
  sim.onCommand<{ projectId: Id; focus: TestScreeningFocus }, TestingResult>(
    'production.testing.revise',
    (payload, { sim: s }) => commissionRevision(s, payload.projectId, payload.focus),
  );
}
