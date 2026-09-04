/**
 * A picture is made the way pictures of its kind are made.
 *
 * A cartoon is never boarded for principal photography: its cast record in a
 * booth, the film is cut as a story reel and built in blocks, and its post has
 * layout, animation, lighting and a render in it. A documentary sits people
 * down, goes out with a camera, spends days in an archive, and gets its
 * footage cleared and read by lawyers before anybody sees it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, PostTask, Project, Role, ShootDay, ShootDayKind } from '@/engine/domain/model';
import { DAY_KIND_LABEL, DAY_KIND_NOTE, PIPELINES, pipelineFor, pipelineKindFor } from '@/engine/content/pipelines';
import { postGraphFor } from '@/engine/systems/production';

const MS_DAY = 86_400_000;

interface Made {
  sim: Simulation;
  projectId: Id;
  run: <R>(kind: string, payload?: Record<string, unknown>) => R;
  try: <R>(kind: string, payload?: Record<string, unknown>) => { ok: boolean; error?: string; value?: R };
}

function aPicture(seed: string, options: { genres: string[]; format?: string; logline?: string }): Made {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown> = {}) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 900_000_000_00 });
  run('sandbox.max_attributes', {});
  const { companyId } = run<{ companyId: Id }>('co.found', { structure: 'c_corp', kind: 'production', name: 'Halyard Pictures', initialCapital: 400_000_000_00 });
  const { projectId } = run<{ projectId: Id }>('film.create_project', {
    format: options.format ?? 'feature', genres: options.genres,
    logline: options.logline ?? 'A story that has to be told somehow.', companyId,
  });
  const project = sim.universe.projects[projectId] as Project;
  run('film.acquire_rights', { projectId, title: project.title, sourceKind: 'original', acquisitionKind: 'original', cost: 0, holderId: companyId, holderKind: 'company' });
  run('film.write_draft', { projectId, daysSpent: 40 });
  run('film.attach_talent', { projectId, personId: sim.player.id, role: 'director', confirmed: true });
  let decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget: 40_000_000_00, companyId });
  for (let i = 0; i < 8 && !decision.greenlit; i++) {
    run('film.write_draft', { projectId, daysSpent: 30 });
    decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget: 40_000_000_00, companyId });
  }
  if (!decision.greenlit) throw new Error('never greenlit');
  run('film.arrange_financing', { projectId, sources: [{ kind: 'company', amount: project.budget || 40_000_000_00, name: 'Halyard Pictures' }] });
  run('cast.break_down_script', { projectId, includeDayPlayers: false });
  const roles = Object.values(sim.universe.roles).filter((r) => r.projectId === projectId) as Role[];
  const actors = Object.values(sim.universe.people).filter((p) => !p.isPlayer && p.careerTrack === 'actor');
  roles.forEach((role, i) => {
    const actor = actors[i % actors.length]!;
    run('cast.open_casting', { roleId: role.id, candidateCount: 0 });
    role.castPersonId = actor.id;
    role.status = 'cast';
    if (!project.castIds.includes(actor.id)) project.castIds.push(actor.id);
    actor.currentLocationId = sim.player.currentLocationId;
  });
  return { sim, projectId, run, try: attempt };
}

const daysOf = (made: Made): ShootDay[] =>
  (made.sim.universe.projects[made.projectId] as Project).shootDayIds.map((id) => made.sim.universe.shootDays[id] as ShootDay);
const tasksOf = (made: Made): PostTask[] =>
  (made.sim.universe.projects[made.projectId] as Project).postTaskIds.map((id) => made.sim.universe.postTasks[id] as PostTask);

describe('which pipeline a picture runs on', () => {
  it('reads the format and the genres', () => {
    expect(pipelineKindFor({ format: 'feature', genres: ['thriller'] })).toBe('live_action');
    expect(pipelineKindFor({ format: 'feature', genres: ['animation', 'family'] })).toBe('animation');
    expect(pipelineKindFor({ format: 'feature', genres: ['animation'], logline: 'Built in stop motion over four years.' })).toBe('stop_motion');
    expect(pipelineKindFor({ format: 'documentary', genres: ['documentary'] })).toBe('documentary');
    expect(pipelineKindFor({ format: 'series', genres: ['reality'] })).toBe('unscripted');
    // A thriller about wildlife is still a thriller.
    expect(pipelineKindFor({ format: 'feature', genres: ['thriller', 'nature'] })).toBe('live_action');
  });

  it('gives every pipeline its own words, days and post graph', () => {
    for (const pipeline of Object.values(PIPELINES)) {
      expect(pipeline.label.length).toBeGreaterThan(3);
      expect(pipeline.how.length).toBeGreaterThan(40);
      expect(pipeline.dayKinds.length).toBeGreaterThan(0);
      expect(pipeline.post.length).toBeGreaterThan(6);
      // Every dependency named is a task the pipeline actually has.
      const kinds = new Set(pipeline.post.map((entry) => entry.kind));
      for (const entry of pipeline.post) {
        for (const dep of entry.after) expect(kinds.has(dep), `${pipeline.kind}: ${entry.kind} waits on ${dep}, which it does not have`).toBe(true);
      }
      // And the first task waits for nothing, or nothing can start.
      expect(pipeline.post.some((entry) => entry.after.length === 0)).toBe(true);
    }
    for (const kind of Object.keys(DAY_KIND_LABEL) as ShootDayKind[]) {
      expect(DAY_KIND_NOTE[kind].length).toBeGreaterThan(20);
    }
    // The graphs actually differ.
    const live = new Set(PIPELINES.live_action.post.map((p) => p.kind));
    const animated = new Set(PIPELINES.animation.post.map((p) => p.kind));
    const doc = new Set(PIPELINES.documentary.post.map((p) => p.kind));
    expect(animated.has('animation_final')).toBe(true);
    expect(live.has('animation_final')).toBe(false);
    expect(doc.has('archive_clearance')).toBe(true);
    expect(doc.has('vfx')).toBe(false);
  });
});

describe('an animated feature', () => {
  it('records its cast in a booth and builds the film in blocks, never photographing anything', () => {
    const made = aPicture('animated', { genres: ['animation', 'family'] });
    const project = made.sim.universe.projects[made.projectId] as Project;
    expect(pipelineFor(project).kind).toBe('animation');
    // Cast on the voice, not the camera.
    const role = Object.values(made.sim.universe.roles).find((r) => r.projectId === made.projectId)!;
    expect(role.requirements.map((r) => r.attributeId)).toContain('voice_over');
    expect(role.requirements.map((r) => r.attributeId)).not.toContain('camera_awareness');

    made.run('prod.build_schedule', { projectId: made.projectId, startAt: made.sim.now + 21 * MS_DAY });
    const days = daysOf(made);
    expect(days.length).toBeGreaterThan(10);
    const kinds = new Set(days.map((d) => d.kind));
    expect(kinds.has('voice_session')).toBe(true);
    expect(kinds.has('animation_block')).toBe(true);
    expect(kinds.has('photography')).toBe(false);
    expect(days.every((d) => d.callSheet !== undefined)).toBe(true);
    // A recording session has somebody in it; an animation block does not.
    expect(days.filter((d) => d.kind === 'voice_session').every((d) => d.requiredCastIds.length > 0)).toBe(true);
    expect(days.filter((d) => d.kind === 'animation_block').every((d) => d.requiredCastIds.length === 0)).toBe(true);
  });

  it('runs a session by the voice and a block by the crew, and finishes with an animation post graph', () => {
    const made = aPicture('animated-run', { genres: ['animation', 'adventure'] });
    made.run('prod.build_schedule', { projectId: made.projectId, startAt: made.sim.now + 21 * MS_DAY });
    made.sim.advanceTo(made.sim.now + 22 * MS_DAY);
    made.run('prod.start_photography', { projectId: made.projectId });
    let guard = 0;
    while ((made.sim.universe.projects[made.projectId] as Project).phase === 'production' && guard++ < 80) {
      made.sim.advanceTo(made.sim.now + 7 * MS_DAY);
    }
    const worked = daysOf(made).filter((d) => d.status === 'complete' || d.status === 'incomplete');
    expect(worked.length).toBeGreaterThan(5);
    const session = worked.find((d) => d.kind === 'voice_session')!;
    expect(session.output?.unit).toBe('lines');
    expect(session.output!.done).toBeGreaterThan(0);
    expect(session.hours?.some((h) => /booth/i.test(h.note))).toBe(true);
    expect(session.hours?.some((h) => /setup/i.test(h.note))).toBe(false);
    const block = worked.find((d) => d.kind === 'animation_block')!;
    expect(block.output?.unit).toBe('shots');
    expect(block.footageQuality).toBeGreaterThan(0);

    const project = made.sim.universe.projects[made.projectId] as Project;
    expect(project.postTaskIds.length).toBeGreaterThan(6);
    const kinds = tasksOf(made).map((t) => t.kind);
    expect(kinds).toContain('story_reel_lock');
    expect(kinds).toContain('animation_final');
    expect(kinds).toContain('lighting_render');
    expect(kinds).not.toContain('assembly');
    expect(made.sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(made.sim.universe).errors).toEqual([]);
  });
});

describe('a documentary', () => {
  it('has interviews, days out and archive days, and its post has clearance and lawyers in it', () => {
    const made = aPicture('doc', { genres: ['documentary'], format: 'documentary' });
    const project = made.sim.universe.projects[made.projectId] as Project;
    expect(pipelineFor(project).kind).toBe('documentary');
    made.run('prod.build_schedule', { projectId: made.projectId, startAt: made.sim.now + 21 * MS_DAY });
    const kinds = new Set(daysOf(made).map((d) => d.kind));
    expect(kinds.has('interview')).toBe(true);
    expect(kinds.has('verite')).toBe(true);
    expect(kinds.has('archive')).toBe(true);

    made.sim.advanceTo(made.sim.now + 22 * MS_DAY);
    made.run('prod.start_photography', { projectId: made.projectId });
    let guard = 0;
    while ((made.sim.universe.projects[made.projectId] as Project).phase === 'production' && guard++ < 80) {
      made.sim.advanceTo(made.sim.now + 7 * MS_DAY);
    }
    const worked = daysOf(made).filter((d) => d.status === 'complete' || d.status === 'incomplete');
    expect(worked.length).toBeGreaterThan(4);
    expect(worked.every((d) => d.output?.unit === 'minutes')).toBe(true);
    const interview = worked.find((d) => d.kind === 'interview')!;
    expect(interview.hours?.some((h) => /chair|cameras/i.test(h.note))).toBe(true);

    const postKinds = tasksOf(made).map((t) => t.kind);
    expect(postKinds).toContain('transcription');
    expect(postKinds).toContain('archive_clearance');
    expect(postKinds).toContain('legal_review');
    expect(postKinds).not.toContain('vfx');
    // Nothing locks before the lawyers have read it.
    const lock = tasksOf(made).find((t) => t.kind === 'picture_lock')!;
    expect(lock.dependsOn).toContain('legal_review');
    expect(validateUniverse(made.sim.universe).errors).toEqual([]);
  });
});

describe('the graph a project gets', () => {
  it('comes from its own pipeline and every dependency exists in it', () => {
    for (const [genres, format] of [[['thriller'], 'feature'], [['animation'], 'feature'], [['documentary'], 'documentary'], [['reality'], 'series']] as [string[], string][]) {
      const graph = postGraphFor({ format, genres, logline: '' } as unknown as Project);
      const kinds = new Set(graph.map((g) => g.kind));
      for (const spec of graph) {
        for (const dep of spec.dependsOn) expect(kinds.has(dep), `${genres[0]}: ${spec.kind} → ${dep}`).toBe(true);
        expect(spec.name.length).toBeGreaterThan(2);
        expect(spec.days).toBeGreaterThan(0);
      }
    }
  });
});
