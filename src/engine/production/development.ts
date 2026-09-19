
import type { Simulation } from '../core/simulation';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type {
  DevelopmentPass,
  Project,
  ProjectAudience,
  ProjectTone,
  ScriptFocus,
  ScriptPassKind,
} from '../domain/company';
import type { Id, Person } from '../domain/model';
import { FILM_GENRES } from '../content/interests';
import { cashAccountFor } from '../world/company';

export const DEVELOPMENT_KIND = 'production.development.complete';

export const DEVELOPMENT_AUDIENCES: readonly { id: ProjectAudience; label: string }[] = [
  { id: 'general', label: 'General Audience' },
  { id: 'family', label: 'Family' },
  { id: 'young_adult', label: 'Young Adult' },
  { id: 'adult', label: 'Adult' },
];

export const DEVELOPMENT_TONES: readonly { id: ProjectTone; label: string }[] = [
  { id: 'commercial', label: 'Commercial' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'experimental', label: 'Experimental' },
];

export const DEVELOPMENT_FOCI: readonly { id: ScriptFocus; label: string }[] = [
  { id: 'story', label: 'Story' },
  { id: 'character', label: 'Character' },
  { id: 'dialogue', label: 'Dialogue' },
  { id: 'structure', label: 'Structure' },
  { id: 'pace', label: 'Pace' },
];

export interface PassSpec {
  id: ScriptPassKind;
  label: string;
  days: number;
  costCents: Money;
  reach: number;
}

export const DEVELOPMENT_PASSES: readonly PassSpec[] = [
  { id: 'outline', label: 'Outline', days: 14, costCents: 25_000_00, reach: 0.17 },
  { id: 'draft', label: 'First Draft', days: 56, costCents: 150_000_00, reach: 0.31 },
  { id: 'rewrite', label: 'Rewrite', days: 28, costCents: 75_000_00, reach: 0.17 },
  { id: 'polish', label: 'Polish', days: 14, costCents: 30_000_00, reach: 0.08 },
];

export const DEVELOPMENT_PASS_BY_ID: Readonly<Record<ScriptPassKind, PassSpec>> =
  Object.fromEntries(DEVELOPMENT_PASSES.map((one) => [one.id, one])) as Record<ScriptPassKind, PassSpec>;

export const MINIMUM_LOCK_QUALITY = 45;
export const MAX_GENRES = 3;

export interface StartDevelopment {
  projectId: Id;
  genreIds: string[];
  audience: ProjectAudience;
  tone: ProjectTone;
  targetBudgetCents?: Money;
  writerId?: Id;
}

export interface CommissionPass {
  projectId: Id;
  kind: ScriptPassKind;
  focus?: ScriptFocus;
  writerId?: Id;
}

export interface DevelopmentResult {
  ok: boolean;
  error?: string;
  projectId?: Id;
  completesAt?: Instant;
  quality?: number;
}

export interface DevelopmentReadiness {
  ready: boolean;
  blockers: string[];
}

const knownGenreIds = new Set(FILM_GENRES.map((one) => one.id));

export const developmentOf = (project: Project) => project.development;

export const pendingDevelopmentPass = (project: Project): DevelopmentPass | undefined =>
  project.development?.screenplay.passes.find((one) => one.status === 'pending');

function validWriter(sim: Simulation, id: Id | undefined): Person | undefined {
  if (!id) return undefined;
  const person = sim.universe.people[id];
  if (!person) return undefined;
  if (person.isPlayer) return person;
  return person.careerTrack === 'writer' || person.careerTrack === 'showrunner' ? person : undefined;
}

export function writerAbility(sim: Simulation, writerId: Id | undefined): number {
  const writer = validWriter(sim, writerId);
  if (!writer) return 55;
  if (writer.isPlayer && writer.prodigy) return 100;
  const rep = writer.reputation;
  return Math.max(1, Math.min(100, Math.round(
    24
      + rep.professionalReputation * 0.38
      + writer.personality.conscientiousness * 0.24
      + rep.industryDemand * 0.14,
  )));
}

function normalizeGenres(raw: readonly string[]): string[] {
  const out: string[] = [];
  for (const id of raw) {
    if (!knownGenreIds.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= MAX_GENRES) break;
  }
  return out;
}

function normalizeTargetBudget(raw: Money | undefined): Money | undefined {
  if (raw === undefined) return undefined;
  const value = Math.round(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function startDevelopment(sim: Simulation, spec: StartDevelopment): DevelopmentResult {
  const project = sim.universe.projects[spec.projectId];
  if (!project) return { ok: false, error: 'There is no such project on the slate.' };
  if (project.shelvedAt) return { ok: false, error: project.title + ' is shelved.' };
  if (project.planId) return { ok: false, error: project.title + ' is already being made.' };
  if (project.development) return { ok: false, error: project.title + ' is already in development.' };

  const genres = normalizeGenres(spec.genreIds ?? []);
  if (genres.length === 0) return { ok: false, error: 'Development needs at least one genre.' };
  if (!DEVELOPMENT_AUDIENCES.some((one) => one.id === spec.audience)) {
    return { ok: false, error: 'That audience is not available on this development slate.' };
  }
  if (!DEVELOPMENT_TONES.some((one) => one.id === spec.tone)) {
    return { ok: false, error: 'That tone is not available on this development slate.' };
  }
  if (spec.writerId && !validWriter(sim, spec.writerId)) {
    return { ok: false, error: 'That person is not available here as a writer.' };
  }

  const targetBudgetCents = normalizeTargetBudget(spec.targetBudgetCents);
  project.development = {
    version: 1,
    startedAt: sim.now,
    genreIds: genres,
    audience: spec.audience,
    tone: spec.tone,
    ...(targetBudgetCents !== undefined ? { targetBudgetCents } : {}),
    screenplay: {
      status: 'concept',
      quality: 0,
      draft: 0,
      ...(spec.writerId ? { writerId: spec.writerId } : {}),
      passes: [],
    },
  };
  project.stage = 'writing';

  sim.notify({
    category: 'business',
    title: project.title + ' Is In Development',
    body: 'The creative brief is set. The screenplay is still a concept, and no production dates exist yet.',
    importance: 40,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, projectId: project.id, quality: 0 };
}

function canCommission(project: Project, kind: ScriptPassKind): string | undefined {
  const development = project.development;
  if (!development) return 'Start development first.';
  if (development.screenplay.status === 'locked') return 'The screenplay is locked.';
  if (pendingDevelopmentPass(project)) return 'A development pass is already underway.';

  const completed = development.screenplay.passes.filter((one) => one.status === 'completed');
  const hasOutline = completed.some((one) => one.kind === 'outline');
  const hasDraft = development.screenplay.draft > 0;

  if (kind === 'outline' && (completed.length > 0 || development.screenplay.quality > 0)) {
    return 'The outline has already moved on.';
  }
  if (kind === 'draft' && !hasOutline) return 'Outline it before commissioning the first draft.';
  if ((kind === 'rewrite' || kind === 'polish') && !hasDraft) {
    return 'There has to be a draft before it can be rewritten.';
  }
  return undefined;
}

function chargeDevelopment(sim: Simulation, project: Project, pass: PassSpec): string | undefined {
  const account = cashAccountFor(sim.universe, project.companyId);
  if (!account) return 'The company has no production account to pay development from.';
  sim.expense(
    account.id,
    pass.costCents,
    project.title + ': ' + pass.label,
    'business',
    { refType: 'project', refId: project.id },
  );
  project.spentCents += pass.costCents;
  return undefined;
}

export function commissionDevelopmentPass(sim: Simulation, spec: CommissionPass): DevelopmentResult {
  const project = sim.universe.projects[spec.projectId];
  if (!project) return { ok: false, error: 'There is no such project on the slate.' };
  const pass = DEVELOPMENT_PASS_BY_ID[spec.kind];
  if (!pass) return { ok: false, error: 'There is no such development pass.' };

  const no = canCommission(project, pass.id);
  if (no) return { ok: false, error: no };

  const development = project.development!;
  const writerId = spec.writerId ?? development.screenplay.writerId;
  if (writerId && !validWriter(sim, writerId)) {
    return { ok: false, error: 'That person is not available here as a writer.' };
  }
  const paid = chargeDevelopment(sim, project, pass);
  if (paid) return { ok: false, error: paid };

  const focus = DEVELOPMENT_FOCI.some((one) => one.id === spec.focus)
    ? spec.focus!
    : 'story';
  const sequence = development.screenplay.passes.length + 1;
  const completesAt = sim.now + pass.days * MS_DAY;
  const row: DevelopmentPass = {
    sequence,
    kind: pass.id,
    focus,
    startedAt: sim.now,
    completesAt,
    costCents: pass.costCents,
    ...(writerId ? { writerId } : {}),
    status: 'pending',
    qualityBefore: development.screenplay.quality,
  };
  development.screenplay.passes.push(row);
  if (writerId) development.screenplay.writerId = writerId;
  development.screenplay.status = pass.id === 'outline'
    ? 'outlining'
    : pass.id === 'draft'
      ? 'drafting'
      : pass.id === 'rewrite'
        ? 'rewriting'
        : 'polishing';

  sim.schedule({
    at: completesAt,
    kind: DEVELOPMENT_KIND,
    label: project.title + ': ' + pass.label,
    category: 'business',
    payload: { projectId: project.id, sequence },
  });
  return { ok: true, projectId: project.id, completesAt, quality: development.screenplay.quality };
}

function passGain(
  before: number,
  pass: PassSpec,
  ability: number,
  roll: number,
  focus: ScriptFocus,
  tone: ProjectTone,
): number {
  const remaining = Math.max(0, 100 - before);
  const craft = 0.72 + ability / 250;
  const variance = 0.88 + roll * 0.24;
  const focusFit =
    (tone === 'commercial' && (focus === 'pace' || focus === 'structure'))
    || (tone === 'prestige' && (focus === 'character' || focus === 'dialogue'))
    || (tone === 'experimental' && focus === 'structure')
      ? 1.08
      : 1;
  return Math.max(1, Math.round(remaining * pass.reach * craft * variance * focusFit));
}

function completePass(sim: Simulation, projectId: Id, sequence: number): void {
  const project = sim.universe.projects[projectId];
  const development = project?.development;
  if (!project || !development || project.shelvedAt) return;
  const row = development.screenplay.passes.find((one) => one.sequence === sequence);
  if (!row || row.status !== 'pending') return;
  const pass = DEVELOPMENT_PASS_BY_ID[row.kind];
  if (!pass) return;

  const ability = writerAbility(sim, row.writerId ?? development.screenplay.writerId);
  const roll = sim.rng(
    'production',
    'development',
    project.id,
    String(row.sequence),
    row.kind,
    row.focus,
  ).next();
  const after = Math.min(
    100,
    row.qualityBefore + passGain(row.qualityBefore, pass, ability, roll, row.focus, development.tone),
  );

  row.status = 'completed';
  row.qualityAfter = after;
  development.screenplay.quality = after;
  if (row.kind === 'draft' || row.kind === 'rewrite') development.screenplay.draft += 1;
  development.screenplay.status = 'draft';
  project.stage = 'draft';

  sim.notify({
    category: 'business',
    title: project.title + ': ' + pass.label + ' Is In',
    body: 'The screenplay is at ' + after + '/100 after this pass. '
      + formatMoney(pass.costCents, { cents: false }) + ' was committed when the work began.',
    importance: after >= MINIMUM_LOCK_QUALITY ? 50 : 35,
    refType: 'project',
    refId: project.id,
  });
}

export function developmentReadiness(project: Project): DevelopmentReadiness {
  const development = project.development;
  if (!development) {
    return project.productionVersion === 2
      ? { ready: false, blockers: ['a development brief and screenplay'] }
      : { ready: true, blockers: [] };
  }

  const blockers: string[] = [];
  if (development.genreIds.length === 0) blockers.push('a genre');
  if (pendingDevelopmentPass(project)) blockers.push('the current development pass to finish');
  if (development.screenplay.draft < 1) blockers.push('a completed first draft');
  if (development.screenplay.quality < MINIMUM_LOCK_QUALITY) {
    blockers.push('a screenplay at ' + MINIMUM_LOCK_QUALITY + '/100 or better');
  }
  if (development.screenplay.status !== 'locked') blockers.push('a locked screenplay');
  return { ready: blockers.length === 0, blockers };
}

export function lockScreenplay(sim: Simulation, projectId: Id): DevelopmentResult {
  const project = sim.universe.projects[projectId];
  if (!project) return { ok: false, error: 'There is no such project on the slate.' };
  const development = project.development;
  if (!development) return { ok: false, error: 'Start development before locking a screenplay.' };
  if (development.screenplay.status === 'locked') {
    return { ok: true, projectId, quality: development.screenplay.quality };
  }
  if (pendingDevelopmentPass(project)) return { ok: false, error: 'A development pass is still underway.' };
  if (development.screenplay.draft < 1) return { ok: false, error: 'There is no completed draft to lock.' };
  if (development.screenplay.quality < MINIMUM_LOCK_QUALITY) {
    return {
      ok: false,
      error: 'The screenplay is ' + development.screenplay.quality + '/100. It needs to reach '
        + MINIMUM_LOCK_QUALITY + '/100 before the company can lock it.',
    };
  }

  development.screenplay.status = 'locked';
  development.screenplay.lockedAt = sim.now;
  project.stage = 'packaged';

  sim.notify({
    category: 'business',
    title: project.title + ': Screenplay Locked',
    body: 'The script is locked at ' + development.screenplay.quality
      + '/100. Production can now price and schedule the version everybody has agreed to make.',
    importance: 55,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, projectId, quality: development.screenplay.quality };
}

export function registerDevelopment(sim: Simulation): void {
  sim.onSchedule(DEVELOPMENT_KIND, (item, s) => {
    const payload = item.payload as { projectId?: Id; sequence?: number };
    if (!payload.projectId || typeof payload.sequence !== 'number') return;
    completePass(s, payload.projectId, payload.sequence);
  });

  sim.onCommand<StartDevelopment, DevelopmentResult>(
    'production.development.start',
    (payload, { sim: s }) => startDevelopment(s, payload),
  );
  sim.onCommand<CommissionPass, DevelopmentResult>(
    'production.development.pass',
    (payload, { sim: s }) => commissionDevelopmentPass(s, payload),
  );
  sim.onCommand<{ projectId: Id }, DevelopmentResult>(
    'production.development.lock',
    (payload, { sim: s }) => lockScreenplay(s, payload.projectId),
  );
}
