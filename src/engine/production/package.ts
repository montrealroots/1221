
import type { Simulation } from '../core/simulation';
import type { Id } from '../domain/model';
import type { Project, ProjectPackage } from '../domain/company';
import { castsPerformers, layTheRoles } from '../world/casting';
import { wouldBe, type Greenlight } from '../world/making';

export interface PackageResult {
  ok: boolean;
  error?: string;
  projectId?: Id;
  package?: ProjectPackage;
}

function castingHasStarted(project: Project): boolean {
  if ((project.cast ?? []).length > 0) return true;
  return (project.roles ?? []).some((role) => (role.seen?.length ?? 0) > 0);
}

export function packageMatchesGreenlight(project: Project, spec: Greenlight): boolean {
  const pack = project.package;
  if (!pack) return true;
  const secondsEach = Math.max(60, Math.round(spec.secondsEach ?? pack.secondsEach));
  const hands = Math.max(1, Math.round(spec.hands ?? pack.hands));
  const from = spec.from ?? pack.from;
  const stageId = spec.stageId ?? pack.stageId;
  return spec.planId === pack.planId
    && Math.round(spec.budgetCents) === pack.budgetCents
    && Math.round(spec.shootWeeks) === pack.shootWeeks
    && secondsEach === pack.secondsEach
    && hands === pack.hands
    && from === pack.from
    && stageId === pack.stageId;
}

export function packageProject(sim: Simulation, spec: Greenlight): PackageResult {
  const project = sim.universe.projects[spec.projectId];
  if (!project) return { ok: false, error: 'There is no such project on the slate.' };
  if (project.shelvedAt) return { ok: false, error: project.title + ' is shelved.' };
  if (project.planId) return { ok: false, error: project.title + ' has already been greenlit.' };
  if (!project.development || project.development.screenplay.status !== 'locked') {
    return { ok: false, error: 'Lock the screenplay before packaging production.' };
  }
  if (project.package && castingHasStarted(project)) {
    return {
      ok: false,
      error: 'Casting has started against this package. Change the package only after those commitments are cleared.',
    };
  }

  const answer = wouldBe(sim, spec);
  if (!answer.ok) return answer;
  const prospect = answer.prospect;
  const shootPeriod = prospect.plan.periods.find((one) => one.holds === 'shooting');
  const shootWindow = shootPeriod
    ? prospect.periods.find((one) => one.id === shootPeriod.id)
    : undefined;

  const pack: ProjectPackage = {
    planId: prospect.plan.id,
    budgetCents: Math.round(spec.budgetCents),
    shootWeeks: prospect.weeks,
    secondsEach: prospect.secondsEach,
    hands: prospect.hands,
    from: prospect.from,
    periods: prospect.periods.map((one) => ({ ...one })),
    deliverBy: prospect.deliverBy,
    ...(prospect.stageId ? { stageId: prospect.stageId } : {}),
    ...(shootWindow ? {
      performerFrom: shootWindow.from,
      performerTo: shootWindow.to,
    } : {}),
    packagedAt: sim.now,
  };

  project.package = pack;
  project.parts = Array.from({ length: prospect.parts }, (_, index) => ({
    id: project.id + '-' + (index + 1),
    ordinal: index + 1,
    seconds: prospect.secondsEach,
  }));
  project.owesSeconds = prospect.secondsEach * prospect.parts;

  if (castsPerformers(prospect.plan)) {
    const priced: Project = {
      ...project,
      planId: prospect.plan.id,
      budgetCents: pack.budgetCents,
    };
    project.roles = layTheRoles(sim, priced);
  } else {
    project.roles = [];
  }
  project.stage = 'packaged';

  sim.notify({
    category: 'business',
    title: project.title + ' Is Packaged',
    body: 'The locked screenplay now has a budget, schedule and production shape. Casting can work against real role bands and real dates before the greenlight.',
    importance: 55,
    refType: 'project',
    refId: project.id,
  });

  return { ok: true, projectId: project.id, package: pack };
}

export function registerPackaging(sim: Simulation): void {
  sim.onCommand<Greenlight, PackageResult>(
    'production.package.set',
    (payload, { sim: s }) => packageProject(s, payload),
  );
}
