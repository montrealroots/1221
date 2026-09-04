/**
 * The shoot, by the hour.
 *
 * A picture with a broken-down script is boarded scene by scene, every day
 * gets a call sheet with the real sun for the place and the date, and a day is
 * worked one hour at a time: call, blocking, setups and takes, lunch, moves,
 * the light going, overtime, wrap. What does not get shot rolls to a later day,
 * and a director who is the player decides how the day is run.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { makeRng } from '@/engine/core/rng';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project, Role, ScriptDraft, ShootDay } from '@/engine/domain/model';
import { boardScript, buildCallSheet, setupsFor } from '@/engine/systems/shoot';
import { shootingBoard } from '@/engine/systems/production';

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

interface Picture {
  sim: Simulation;
  projectId: Id;
  companyId: Id;
  run: <R>(kind: string, payload: Record<string, unknown>) => R;
  try: <R>(kind: string, payload: Record<string, unknown>) => { ok: boolean; error?: string; value?: R };
}

/** A funded picture with its parts broken down and its leads cast, ready to board. */
function aCastPicture(seed: string, options: { direct?: boolean; genres?: string[]; format?: string } = {}): Picture {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown>): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown>) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 600_000_000_00 });
  run('sandbox.max_attributes', {});
  const { companyId } = run<{ companyId: Id }>('co.found', {
    structure: 'c_corp', kind: 'production', name: 'Halyard Pictures', initialCapital: 300_000_000_00,
  });
  const { projectId } = run<{ projectId: Id }>('film.create_project', {
    title: 'Slack Water', format: options.format ?? 'feature', genres: options.genres ?? ['thriller', 'crime'],
    logline: 'A harbour pilot has one night to keep a ship off the rocks.', companyId,
  });
  run('film.acquire_rights', { projectId, title: 'Slack Water', sourceKind: 'original', acquisitionKind: 'original', cost: 0, holderId: companyId, holderKind: 'company' });
  run('film.write_draft', { projectId, daysSpent: 40 });
  if (options.direct) run('film.attach_talent', { projectId, personId: sim.player.id, role: 'director', confirmed: true });
  const project = sim.universe.projects[projectId] as Project;
  let decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget: 40_000_000_00, companyId });
  for (let i = 0; i < 8 && !decision.greenlit; i++) {
    run('film.write_draft', { projectId, daysSpent: 30 });
    decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget: 40_000_000_00, companyId });
  }
  if (!decision.greenlit) throw new Error('never greenlit');
  run('film.arrange_financing', { projectId, sources: [{ kind: 'company', amount: project.budget || 40_000_000_00, name: 'Halyard Pictures' }] });

  // The parts, from the script, and somebody in every one of them: the world's
  // own actors, put straight in so the test is about the shoot.
  run('cast.break_down_script', { projectId, includeDayPlayers: false });
  const roles = Object.values(sim.universe.roles).filter((r) => r.projectId === projectId) as Role[];
  const actors = Object.values(sim.universe.people).filter((p) => !p.isPlayer && p.careerTrack === 'actor');
  roles.forEach((role, i) => {
    const actor = actors[i % actors.length]!;
    run('cast.open_casting', { roleId: role.id, candidateCount: 0 });
    role.castPersonId = actor.id;
    role.status = 'cast';
    if (!project.castIds.includes(actor.id)) project.castIds.push(actor.id);
    actor.currentLocationId = 'us-ca-losangeles';
  });
  sim.player.currentLocationId = 'us-ca-losangeles';
  return { sim, projectId, companyId, run, try: attempt };
}

const draftOf = (picture: Picture): ScriptDraft => {
  const project = picture.sim.universe.projects[picture.projectId] as Project;
  return picture.sim.universe.scriptDrafts[project.currentDraftId!] as ScriptDraft;
};

const daysOf = (picture: Picture): ShootDay[] =>
  (picture.sim.universe.projects[picture.projectId] as Project).shootDayIds
    .map((id) => picture.sim.universe.shootDays[id] as ShootDay)
    .sort((a, b) => a.dayNumber - b.dayNumber);

describe('boarding the script', () => {
  it('needs more setups for more pages, more complexity and more coverage', () => {
    expect(setupsFor(2, 2, 'standard')).toBeGreaterThan(setupsFor(1, 2, 'standard'));
    expect(setupsFor(2, 5, 'standard')).toBeGreaterThan(setupsFor(2, 1, 'standard'));
    expect(setupsFor(2, 3, 'thorough')).toBeGreaterThan(setupsFor(2, 3, 'standard'));
    expect(setupsFor(2, 3, 'lean')).toBeLessThan(setupsFor(2, 3, 'standard'));
    expect(setupsFor(0.1, 1, 'lean')).toBeGreaterThanOrEqual(1);
  });

  it('puts every scene on exactly one day and groups interiors, day exteriors and nights', () => {
    const picture = aCastPicture('board-1');
    const draft = draftOf(picture);
    expect(draft.scenes.length).toBeGreaterThan(20);
    const days = boardScript(draft, new Map(), { pagesPerDay: 2.6, setupsPerDay: 16, rng: makeRng('board') });
    const boarded = days.flatMap((d) => d.scenes.map((s) => s.sceneNumber));
    expect(new Set(boarded).size).toBe(boarded.length);
    expect(boarded.length).toBe(draft.scenes.length);
    for (const day of days) {
      // One kind of day at a time: nobody shoots a night exterior at noon.
      expect(new Set(day.scenes.map((s) => `${s.interior}|${s.timeOfDay === 'night'}`)).size).toBe(1);
      expect(day.plannedPages).toBeLessThanOrEqual(2.6 * 1.15 + Math.max(...day.scenes.map((s) => s.pages)));
    }
    // Interiors come first: the sets are built and the weather cannot touch them.
    const firstExterior = days.findIndex((d) => !d.isStage);
    if (firstExterior > 0) expect(days.slice(0, firstExterior).every((d) => d.isStage)).toBe(true);
  });

  it('puts the cast on the days their characters are in', () => {
    const picture = aCastPicture('board-2');
    const draft = draftOf(picture);
    const roles = Object.values(picture.sim.universe.roles).filter((r) => r.projectId === picture.projectId) as Role[];
    const byCharacter = new Map(roles.map((r) => [r.characterName, r.castPersonId as Id]));
    const days = boardScript(draft, byCharacter, { pagesPerDay: 2.6, setupsPerDay: 16, rng: makeRng('board') });
    for (const day of days) {
      for (const scene of day.scenes) {
        const source = draft.scenes.find((s) => s.number === scene.sceneNumber)!;
        const expected = source.characters.map((c) => byCharacter.get(c)).filter(Boolean);
        expect(scene.castIds.sort()).toEqual([...new Set(expected)].sort());
      }
    }
  });
});

describe('the call sheet', () => {
  it('carries the real sun for the place and the date, and a later call for nights', () => {
    const picture = aCastPicture('sheet-1');
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY, locationId: 'uk-eng-london' });
    const days = daysOf(picture);
    expect(days.length).toBeGreaterThan(10);
    for (const day of days) {
      expect(day.callSheet).toBeDefined();
      const sheet = day.callSheet!;
      expect(sheet.daylightMinutes).toBeGreaterThan(6 * 60);
      expect(sheet.daylightMinutes).toBeLessThan(18 * 60);
      expect(sheet.firstShot).toBeGreaterThan(sheet.crewCall);
      expect(sheet.lunch - sheet.crewCall).toBe(6 * MS_HOUR);
      expect(sheet.wrapTarget - sheet.crewCall).toBe(12 * MS_HOUR);
      expect(sheet.castCalls.length).toBe(day.requiredCastIds.length);
      const night = day.scenes.every((s) => s.timeOfDay === 'night');
      const hour = new Date(sheet.crewCall).toLocaleString('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hour12: false });
      expect(Number(hour)).toBe(night ? 17 : 6);
      if (!day.isStage) expect(sheet.forecast).not.toMatch(/stage/i);
    }
  });

  it('is a rebuild, not a re-roll: the same day gets the same sheet', () => {
    const picture = aCastPicture('sheet-2');
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    const day = daysOf(picture)[0]!;
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const again = buildCallSheet(picture.sim, day, project, 'standard');
    expect(again).toEqual(day.callSheet);
  });
});

describe('a day on the floor', () => {
  it('runs hour by hour from call to wrap and pays for it', () => {
    const picture = aCastPicture('day-1');
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    picture.sim.advanceTo(picture.sim.now + 31 * MS_DAY);
    picture.run('prod.start_photography', { projectId: picture.projectId });
    picture.sim.advanceTo(picture.sim.now + 3 * MS_DAY);

    const shot = daysOf(picture).filter((d) => d.status === 'complete' || d.status === 'incomplete');
    expect(shot.length).toBeGreaterThan(0);
    for (const day of shot) {
      const hours = day.hours ?? [];
      expect(hours[0]?.kind).toBe('call');
      expect(hours[1]?.kind).toBe('blocking');
      expect(hours[hours.length - 1]?.kind).toBe('wrap');
      // The clock only ever goes forward.
      for (let i = 1; i < hours.length; i++) expect(hours[i]!.at).toBeGreaterThanOrEqual(hours[i - 1]!.at);
      const worked = (day.actualWrapTime! - day.callSheet!.crewCall) / MS_HOUR;
      expect(worked).toBeGreaterThanOrEqual(3);
      expect(worked).toBeLessThanOrEqual(16);
      // Lunch by the sixth hour, or a penalty on the record.
      const lunchAt = hours.find((h) => h.kind === 'lunch');
      if (lunchAt) expect((lunchAt.at - day.callSheet!.crewCall) / MS_HOUR).toBeLessThanOrEqual(7);
      else expect(day.incidents.some((i) => i.kind === 'meal_penalty') || worked <= 7, 'no lunch, no penalty, and a day longer than six hours').toBe(true);
      // What was shot has takes and a quality; what was not has neither.
      for (const scene of day.scenes) {
        if (scene.shot) {
          expect(scene.takes).toBeGreaterThan(0);
          expect(scene.quality).toBeGreaterThanOrEqual(0);
          expect(scene.quality).toBeLessThanOrEqual(100);
        }
      }
      expect(day.actualCost).toBeGreaterThanOrEqual(day.dailyBudget);
      if (day.overtimeMinutes > 0) expect(day.actualCost).toBeGreaterThan(day.dailyBudget);
      expect(day.completedPages).toBeLessThanOrEqual(day.plannedPages + 0.01);
    }
    const board = shootingBoard(picture.sim, picture.projectId);
    expect(board.hoursWorked).toBeGreaterThan(0);
    expect(board.spent).toBeGreaterThan(0);
  });

  it('rolls what it did not shoot onto a later day rather than losing it', () => {
    const picture = aCastPicture('day-2');
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    const before = daysOf(picture);
    const allScenes = before.flatMap((d) => d.scenes.map((s) => s.sceneNumber));
    picture.sim.advanceTo(picture.sim.now + 31 * MS_DAY);
    picture.run('prod.start_photography', { projectId: picture.projectId });
    let guard = 0;
    while ((picture.sim.universe.projects[picture.projectId] as Project).phase === 'production' && guard++ < 40) {
      picture.sim.advanceTo(picture.sim.now + 7 * MS_DAY);
    }
    const after = daysOf(picture);
    const rolled = after.flatMap((d) => d.incidents.filter((i) => i.kind === 'rollover'));
    const cut = after.flatMap((d) => d.incidents.filter((i) => i.kind === 'scene_cut'));
    // Every scene that started on the board is either shot somewhere or cut on the record.
    const shotNumbers = new Set(after.flatMap((d) => d.scenes.filter((s) => s.shot).map((s) => s.sceneNumber)));
    const cutNumbers = new Set(cut.flatMap((i) => i.description.match(/\d+[A-Z]?/g) ?? []));
    for (const number of allScenes) {
      expect(shotNumbers.has(number) || cutNumbers.has(number), `scene ${number}`).toBe(true);
    }
    // A rollover moves the scene; it does not copy it.
    const onScheduledDays = after.filter((d) => d.status === 'scheduled').flatMap((d) => d.scenes.map((s) => s.sceneNumber));
    expect(onScheduledDays.length).toBe(0);
    if (rolled.length > 0) {
      expect(after.some((d) => d.dayNumber > (picture.sim.universe.projects[picture.projectId] as Project).scheduledShootDays) || rolled.length > 0).toBe(true);
    }
    // The picture wrapped with footage.
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    expect(project.completedShootDays).toBeGreaterThan(0);
    expect(project.phase).not.toBe('production');
  });

  it('is the same day twice from the same save', () => {
    const one = aCastPicture('day-same');
    const two = aCastPicture('day-same');
    for (const picture of [one, two]) {
      picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
      picture.sim.advanceTo(picture.sim.now + 31 * MS_DAY);
      picture.run('prod.start_photography', { projectId: picture.projectId });
      picture.sim.advanceTo(picture.sim.now + 2 * MS_DAY);
    }
    const a = daysOf(one)[0]!;
    const b = daysOf(two)[0]!;
    expect(a.hours).toEqual(b.hours);
    expect(a.actualCost).toBe(b.actualCost);
    expect(a.footageQuality).toBe(b.footageQuality);
  });
});

describe('directing the day', () => {
  it('lets the director set coverage, the hours and what to drop, before the day and not after', () => {
    const picture = aCastPicture('direct-1', { direct: true });
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    const day = daysOf(picture).find((d) => d.scenes.length >= 2)!;
    const standard = day.scenes.reduce((sum, s) => sum + (s.setups ?? 0), 0);

    const thorough = picture.run<{ setups: number }>('prod.direct_day', { shootDayId: day.id, coverage: 'thorough', pushPastTwelve: true });
    expect(thorough.setups).toBeGreaterThan(standard);
    expect(day.plan?.coverage).toBe('thorough');
    expect(day.plan?.pushPastTwelve).toBe(true);
    expect(day.callSheet?.coverage).toBe('thorough');

    const lean = picture.run<{ setups: number }>('prod.direct_day', { shootDayId: day.id, coverage: 'lean', dropSceneNumbers: [day.scenes[0]!.sceneNumber] });
    expect(lean.setups).toBeLessThan(standard);
    expect(day.plan?.dropScenes).toEqual([day.scenes[0]!.sceneNumber]);

    const bad = picture.try('prod.direct_day', { shootDayId: day.id, dropSceneNumbers: ['999Z'] });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/not on the sheet/i);
    const all = picture.try('prod.direct_day', { shootDayId: day.id, dropSceneNumbers: day.scenes.map((s) => s.sceneNumber) });
    expect(all.ok).toBe(false);

    picture.sim.advanceTo(day.callTime + MS_DAY);
    expect(['complete', 'incomplete']).toContain(day.status);
    // The dropped scene was not shot on that day and went somewhere else.
    const dropped = day.scenes.find((s) => s.sceneNumber === day.plan!.dropScenes[0])!;
    expect(dropped.shot).toBe(false);
    expect(day.incidents.some((i) => i.kind === 'rollover' && i.description.includes(dropped.sceneNumber))).toBe(true);
    const late = picture.try('prod.direct_day', { shootDayId: day.id, coverage: 'lean' });
    expect(late.ok).toBe(false);
    expect(late.error).toMatch(/already been shot/i);
  });

  it('refuses a day on somebody else\'s picture', () => {
    const picture = aCastPicture('direct-2');
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    const day = daysOf(picture)[0]!;
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const wasCreatedBy = project.createdById;
    const wasOwned = project.ownerCompanyId;
    project.createdById = 'somebody-else' as Id;
    project.ownerCompanyId = undefined;
    const result = picture.try('prod.direct_day', { shootDayId: day.id, coverage: 'lean' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not your day/i);
    project.createdById = wasCreatedBy;
    project.ownerCompanyId = wasOwned;
  });

  it('sends the call sheet the evening before and asks the director-player how to run it', () => {
    const picture = aCastPicture('direct-3', { direct: true });
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    const day = daysOf(picture)[0]!;
    picture.sim.advanceTo(day.callTime - 2 * MS_HOUR);
    const notice = picture.sim.universe.notifications.find((n) => n.title.startsWith('Call Sheet:') && n.refId === day.id);
    expect(notice).toBeDefined();
    expect(notice!.body).toMatch(/Crew call/);
    const decision = Object.values(picture.sim.universe.decisions).find((d) => d.refType === 'shootday' && d.refId === day.id);
    expect(decision).toBeDefined();
    expect(decision!.resolvedAt).toBeUndefined();
  });

  it('pays overtime at penalty rate when the director pushes past twelve', () => {
    const cheap = aCastPicture('direct-4', { direct: true });
    const pushed = aCastPicture('direct-4', { direct: true });
    for (const picture of [cheap, pushed]) {
      picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
    }
    const a = daysOf(cheap)[0]!;
    const b = daysOf(pushed)[0]!;
    pushed.run('prod.direct_day', { shootDayId: b.id, coverage: 'thorough', pushPastTwelve: true });
    cheap.run('prod.direct_day', { shootDayId: a.id, coverage: 'lean', pushPastTwelve: false });
    for (const picture of [cheap, pushed]) picture.sim.advanceTo(daysOf(picture)[0]!.callTime + MS_DAY);
    const hoursA = (a.actualWrapTime! - a.callSheet!.crewCall) / MS_HOUR;
    const hoursB = (b.actualWrapTime! - b.callSheet!.crewCall) / MS_HOUR;
    expect(hoursA).toBeLessThanOrEqual(12.5);
    expect(hoursB).toBeGreaterThanOrEqual(hoursA);
    if (b.overtimeMinutes > 0) {
      expect(b.actualCost).toBeGreaterThan(b.dailyBudget);
      expect(b.incidents.some((i) => i.kind === 'overtime')).toBe(true);
    }
  });
});

describe('the old path still runs', () => {
  it('shoots a draft with no breakdown the way it always did', () => {
    const picture = aCastPicture('legacy-1');
    const draft = draftOf(picture);
    draft.scenes = [];
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY, shootDays: 12 });
    const days = daysOf(picture);
    expect(days.length).toBe(12);
    expect(days.every((d) => d.callSheet === undefined)).toBe(true);
    picture.sim.advanceTo(picture.sim.now + 31 * MS_DAY);
    picture.run('prod.start_photography', { projectId: picture.projectId });
    picture.sim.advanceTo(picture.sim.now + 3 * MS_DAY);
    const shot = daysOf(picture).filter((d) => d.status === 'complete' || d.status === 'incomplete');
    expect(shot.length).toBeGreaterThan(0);
    expect(shot.every((d) => d.hours === undefined)).toBe(true);
    expect(shot.every((d) => d.actualCost > 0)).toBe(true);
  });
});
