/**
 * The Full Film Test.
 *
 * One project, driven from an idea to a finished entry in the library, through
 * every stage the industry actually has: rights, writing, packaging,
 * greenlight, financing, contracts, casting, schedule, photography, post,
 * delivery, marketing, distribution, release, performance, reception, awards
 * and the final P&L.
 *
 * The thing this test exists to prove is that it is one project the whole way
 * down. Departments do not each get their own private copy of the movie: the
 * id that comes out of `film.create_project` is the id the box office reports
 * against, the id the awards nominate, and the id in the library at the end.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project } from '@/engine/domain/model';
import { PROJECT_PHASE_ORDER } from '@/engine/domain/model';
import { suggestedBudget } from '@/engine/systems/film';

const MS_DAY = 86_400_000;

function project(sim: Simulation, id: Id): Project {
  const found = sim.universe.projects[id];
  if (!found) throw new Error(`project ${id} is gone`);
  return found;
}

/** The most recent greenlight decision recorded against a project. */
function lastGreenlightAudit(sim: Simulation, projectId: Id) {
  return [...sim.universe.audits]
    .reverse()
    .find((a) => a.kind === 'film.greenlight_decided' && a.subjectId === projectId);
}

interface Made {
  sim: Simulation;
  projectId: Id;
  companyId: Id;
  budget: number;
  log: string[];
}

/** Runs the whole pipeline once and hands back what happened. */
function makeAFilm(): Made {
  const sim = quickSave({ wealth: 'inherited' }, 'full-film');
  const log: string[] = [];
  const run = <R>(kind: string, payload: Record<string, unknown>): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    log.push(kind);
    return result.value as R;
  };

  // Capital and craft, so the test is about the pipeline rather than about
  // being broke and inexperienced. Both are sandbox tools the game ships.
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 400_000_000_00 });
  run('sandbox.max_attributes', {});

  const { companyId } = run<{ companyId: Id }>('co.found', {
    structure: 'c_corp', kind: 'production', name: 'Quarry Lane Pictures',
    initialCapital: 120_000_000_00,
  });

  // --- Idea -> rights -> writing ------------------------------------------
  const { projectId } = run<{ projectId: Id }>('film.create_project', {
    title: 'The Undertow',
    format: 'feature',
    genres: ['drama', 'thriller'],
    logline: 'A salvage diver takes one last contract.',
    companyId,
  });

  run('film.acquire_rights', {
    projectId, title: 'The Undertow', sourceKind: 'book',
    acquisitionKind: 'purchase', cost: 750_000_00,
    holderId: companyId, holderKind: 'company',
  });

  run('film.write_draft', { projectId, daysSpent: 40 });
  run('film.write_draft', { projectId, daysSpent: 25 });

  // --- Package -------------------------------------------------------------
  // An unknown cannot attach a name director, so they direct it themselves.
  // Attaching yourself is not a decision anybody else gets to make.
  run('film.attach_talent', { projectId, personId: sim.player.id, role: 'director', confirmed: true });
  run('film.attach_talent', { projectId, personId: sim.player.id, role: 'producer', confirmed: true });

  // Budget at the comparable for material this good, so the greenlight is not
  // fighting a number the material cannot carry.
  const current = project(sim, projectId);
  const draftQuality = current.currentDraftId
    ? sim.universe.scriptDrafts[current.currentDraftId]?.quality ?? 60
    : 60;
  const budget = suggestedBudget('feature', current.genres, draftQuality);

  // --- Greenlight ----------------------------------------------------------
  // A greenlight is a decision, not a formality, so it can come back no. When
  // it does, the answer is to improve the package and ask again — and the roll
  // behind the decision must not quietly change when you do.
  let decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget, companyId });
  const firstRoll = lastGreenlightAudit(sim, projectId)?.roll;
  let attempts = 1;
  while (!decision.greenlit && attempts < 8) {
    run('film.write_draft', { projectId, daysSpent: 30 });
    const spare = Object.values(sim.universe.people).find(
      (p) => !p.isPlayer && p.careerTrack === 'actor'
        && !project(sim, projectId).attachments.some((a) => a.personId === p.id),
    );
    if (spare) sim.execute({ kind: 'film.attach_talent', payload: { projectId, personId: spare.id, role: 'star', confirmed: true } });
    decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget, companyId });
    attempts++;
  }
  if (!decision.greenlit) throw new Error('the package never became strong enough to greenlight');
  log.push(`greenlit after ${attempts} attempt${attempts === 1 ? '' : 's'}`);
  const finalRoll = lastGreenlightAudit(sim, projectId)?.roll;
  if (firstRoll !== undefined && finalRoll !== undefined && firstRoll !== finalRoll) {
    throw new Error(`the greenlight roll changed between attempts: ${firstRoll} then ${finalRoll}`);
  }

  // --- Financing -----------------------------------------------------------
  run('film.arrange_financing', {
    projectId,
    sources: [{ kind: 'company', amount: budget, name: 'Quarry Lane Pictures' }],
  });

  // --- Casting -------------------------------------------------------------
  const { roleId } = run<{ roleId: Id }>('cast.create_role', {
    projectId, characterName: 'Rell', billing: 'lead',
    description: 'The diver.', ageRange: [30, 50],
  });
  run('cast.open_casting', { roleId, candidateCount: 12 });
  // Casting decides on its own schedule; let it.
  sim.advanceTo(sim.now + 45 * MS_DAY);

  // --- Schedule and photography -------------------------------------------
  run('prod.build_schedule', { projectId, startAt: sim.now + 21 * MS_DAY, shootDays: 34 });
  sim.advanceTo(sim.now + 22 * MS_DAY);
  run('prod.start_photography', { projectId });

  // Shoot it out. Shoot days are scheduled items; advancing runs them.
  let guard = 0;
  while (sim.universe.projects[projectId]?.phase === 'production' && guard++ < 40) {
    sim.advanceTo(sim.now + 7 * MS_DAY);
  }

  // --- Post ----------------------------------------------------------------
  if (sim.universe.projects[projectId]?.phase !== 'post') run('prod.open_post', { projectId });
  guard = 0;
  while (!sim.universe.projects[projectId]?.finalQuality && guard++ < 120) {
    for (const task of Object.values(sim.universe.postTasks)) {
      if (task.projectId !== projectId || task.status !== 'ready') continue;
      sim.execute({ kind: 'prod.start_post_task', payload: { taskId: task.id } });
    }
    sim.advanceTo(sim.now + 7 * MS_DAY);
  }

  return { sim, projectId, companyId, budget, log };
}

describe('the full film', () => {
  let made: Made;
  beforeAll(() => { made = makeAFilm(); }, 300_000);

  it('finishes the picture and gives it a quality', () => {
    const project = made.sim.universe.projects[made.projectId] as Project;
    expect(project, 'the project vanished').toBeDefined();
    expect(project.finalQuality, 'post never delivered a finished film').toBeGreaterThan(0);
    expect(project.pictureLockedAt, 'picture was never locked').toBeDefined();
  });

  it('never made a second copy of the same movie', () => {
    const named = Object.values(made.sim.universe.projects).filter((p) => p.title === 'The Undertow');
    expect(named.map((p) => p.id)).toEqual([made.projectId]);

    // Everything downstream points at that one id.
    const sim = made.sim;
    for (const role of Object.values(sim.universe.roles)) {
      if (role.projectId !== made.projectId) continue;
      expect(sim.universe.projects[role.projectId]).toBeDefined();
    }
    for (const task of Object.values(sim.universe.postTasks)) {
      if (task.projectId !== made.projectId) continue;
      expect(sim.universe.projects[task.projectId]).toBeDefined();
    }
  });

  it('moved through the phases in order and never went backwards', () => {
    const project = made.sim.universe.projects[made.projectId] as Project;
    const seen = project.phaseHistory
      .map((h) => PROJECT_PHASE_ORDER.indexOf(h.phase))
      .filter((i) => i >= 0);
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]! >= seen[i - 1]!, `phase order: ${JSON.stringify(project.phaseHistory.map((h) => h.phase))}`).toBe(true);
    }
    for (let i = 1; i < project.phaseHistory.length; i++) {
      expect(project.phaseHistory[i]!.enteredAt >= project.phaseHistory[i - 1]!.enteredAt).toBe(true);
    }
  });

  it('respected post dependencies: nothing finished before what it needed', () => {
    const sim = made.sim;
    const tasks = Object.values(sim.universe.postTasks).filter((t) => t.projectId === made.projectId);
    expect(tasks.length, 'post never opened').toBeGreaterThan(0);
    for (const task of tasks) {
      if (task.status !== 'complete' || task.completedAt === undefined) continue;
      for (const dep of task.dependsOn) {
        const upstream = tasks.find((t) => t.kind === dep);
        if (!upstream) continue;
        expect(upstream.status, `${task.name} completed while ${upstream.name} had not`).toBe('complete');
        expect(
          (upstream.completedAt ?? Number.POSITIVE_INFINITY) <= task.completedAt,
          `${task.name} finished before ${upstream.name} did`,
        ).toBe(true);
      }
    }
  });

  it('charged the production to the production, and the books still balance', () => {
    const sim = made.sim;
    const project = sim.universe.projects[made.projectId] as Project;
    expect(project.spent, 'a shoot that cost nothing did not happen').toBeGreaterThan(0);
    expect(sim.ledger.audit()).toEqual([]);
    let total = 0;
    for (const txn of sim.universe.transactions) for (const p of txn.postings) total += p.amount;
    expect(total).toBe(0);
  });

  it('will not distribute what the rights do not cover', () => {
    const sim = made.sim;
    const rightsId = (sim.universe.projects[made.projectId] as Project).rightsId as Id;
    expect(sim.universe.rights[rightsId], 'the film has no chain of title').toBeDefined();

    const held = [...sim.universe.rights[rightsId]!.scope.media];
    sim.universe.rights[rightsId]!.scope.media = held.filter((m) => m !== 'theatrical');

    const refused = sim.execute({
      kind: 'rel.set_distribution',
      payload: { projectId: made.projectId, strategy: 'wide_theatrical', openingDate: sim.now + 120 * MS_DAY },
    });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/theatrical/);

    // A rolled-back command restores the universe from a snapshot, so every
    // record in it is a new object. Re-read before writing, or the restore is
    // written to a copy nothing points at any more.
    sim.universe.rights[rightsId]!.scope.media = held;
    expect(sim.universe.rights[rightsId]!.scope.media).toContain('theatrical');
  });

  it('opens, earns, and does not hand the studio the gross', () => {
    const sim = made.sim;
    const openingDate = sim.now + 150 * MS_DAY;

    const campaign = sim.execute({
      kind: 'rel.plan_campaign',
      payload: {
        projectId: made.projectId, budget: 18_000_000_00,
        positioning: 'A thriller for adults.', targetAudience: 'Adults 25-54', openingDate,
      },
    });
    expect(campaign.ok, campaign.error).toBe(true);

    const dist = sim.execute<{ releaseId: Id; theaterCount: number }>({
      kind: 'rel.set_distribution',
      payload: {
        projectId: made.projectId, strategy: 'wide_theatrical',
        distributorName: 'Quarry Lane Pictures', openingDate,
      },
    });
    expect(dist.ok, dist.error).toBe(true);
    expect(dist.value?.theaterCount).toBeGreaterThan(0);

    // Run the release out.
    sim.advanceTo(openingDate + 200 * MS_DAY);

    const project = sim.universe.projects[made.projectId] as Project;
    const release = sim.universe.releases[dist.value?.releaseId as Id];
    expect(release, 'no release record').toBeDefined();
    expect(project.boxOfficeDomestic, 'the film never opened').toBeGreaterThan(0);

    // The studio's share of a theatrical gross is not the gross. Exhibitors
    // keep roughly half, and a distribution fee comes off what is left.
    const gross = project.boxOfficeDomestic + project.boxOfficeInternational;
    expect(release!.netToDistributor, 'the distributor never settled').toBeGreaterThan(0);
    expect(release!.netToDistributor, 'the distributor was handed the whole gross').toBeLessThan(gross);
    expect(
      release!.netToDistributor / gross,
      `distributor kept ${(release!.netToDistributor / gross * 100).toFixed(0)}% of the gross`,
    ).toBeLessThan(0.75);
    expect(release!.exhibitorShare, 'exhibitors kept nothing').toBeGreaterThan(0);
  });

  it('is reviewed, and the reviews are about this film', () => {
    const sim = made.sim;
    const reviews = Object.values(sim.universe.reviews).filter((r) => r.projectId === made.projectId);
    expect(reviews.length, 'nobody reviewed it').toBeGreaterThan(0);
    const project = sim.universe.projects[made.projectId] as Project;
    expect(project.criticScore).toBeGreaterThan(0);
    expect(project.criticScore).toBeLessThanOrEqual(100);
  });

  it('is eligible for awards only on the strength of its release date', () => {
    const sim = made.sim;
    const project = sim.universe.projects[made.projectId] as Project;
    expect(project.releaseDate, 'a released film with no release date').toBeDefined();

    // Campaigning for an edition whose window has closed must be refused.
    const stale = Object.values(sim.universe.awardEditions)
      .filter((e) => e.eligibilityEnd < (project.releaseDate as number))
      .sort((a, b) => b.eligibilityEnd - a.eligibilityEnd)[0];
    if (stale) {
      const result = sim.execute({
        kind: 'award.campaign',
        payload: { projectId: made.projectId, bodyId: stale.bodyId, categories: ['Best Picture'], spend: 100_00 },
      });
      expect(result.ok).toBe(false);
    }
  });

  it('lands in the library with a P&L that adds up', () => {
    const sim = made.sim;
    sim.advanceTo(sim.now + 400 * MS_DAY);
    const project = sim.universe.projects[made.projectId] as Project;

    expect(project.totalCost, 'the film cost nothing').toBeGreaterThan(0);
    expect(project.totalRevenue, 'the film earned nothing').toBeGreaterThan(0);

    // Whatever the result, the books still reconcile and the world is sound.
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });
});
