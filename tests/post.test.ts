/**
 * Post is work, and the plant is real.
 *
 * A cut is made in sessions; effects are counted, bid on by real houses and
 * awarded once; music is spotted and licensed from the companies that own it,
 * sync and master, MFN or not; stages are booked on real lots; a lot can be
 * owned and closes its books every month.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, PostTask, Project, Property, Role } from '@/engine/domain/model';
import { GEAR, GEAR_BY_ID } from '@/engine/content/gear';
import { HOUSE_RATE_CALIBRATION, POST_HOUSES, POST_HOUSE_BY_ID, RIGHTS_HOLDERS, STUDIO_LOTS, STUDIO_LOT_BY_ID, housesFor, lotsIn } from '@/engine/content/post-houses';
import { CITIES } from '@/engine/content/geography';
import { freeStages, marketStageRate, scoreMinutes } from '@/engine/systems/post';
import { EQUIPMENT_CATALOG } from '@/engine/systems/company';

const MS_DAY = 86_400_000;

interface Picture {
  sim: Simulation;
  projectId: Id;
  companyId: Id;
  run: <R>(kind: string, payload: Record<string, unknown>) => R;
  try: <R>(kind: string, payload: Record<string, unknown>) => { ok: boolean; error?: string; value?: R };
}

function aPicture(seed: string, options: { direct?: boolean; genres?: string[] } = {}): Picture {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown>): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown>) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 900_000_000_00 });
  run('sandbox.max_attributes', {});
  const { companyId } = run<{ companyId: Id }>('co.found', {
    structure: 'c_corp', kind: 'production', name: 'Halyard Pictures', initialCapital: 400_000_000_00,
  });
  const { projectId } = run<{ projectId: Id }>('film.create_project', {
    title: 'Slack Water', format: 'feature', genres: options.genres ?? ['thriller', 'crime'],
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

/** Shoots the picture out so post is open. */
function shotOut(picture: Picture): Picture {
  picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY });
  picture.sim.advanceTo(picture.sim.now + 31 * MS_DAY);
  picture.run('prod.start_photography', { projectId: picture.projectId });
  let guard = 0;
  while ((picture.sim.universe.projects[picture.projectId] as Project).phase === 'production' && guard++ < 40) {
    picture.sim.advanceTo(picture.sim.now + 7 * MS_DAY);
  }
  const project = picture.sim.universe.projects[picture.projectId] as Project;
  if (project.postTaskIds.length === 0) throw new Error(`post never opened (phase ${project.phase})`);
  return picture;
}

const tasksOf = (picture: Picture): PostTask[] =>
  (picture.sim.universe.projects[picture.projectId] as Project).postTaskIds.map((id) => picture.sim.universe.postTasks[id] as PostTask);

/** Advances until a task of the kind is complete, or gives up. */
function untilComplete(picture: Picture, kind: string, weeks = 60): PostTask {
  for (let i = 0; i < weeks; i++) {
    const task = tasksOf(picture).find((t) => t.kind === kind)!;
    if (task.status === 'complete') return task;
    picture.sim.advanceTo(picture.sim.now + 7 * MS_DAY);
  }
  return tasksOf(picture).find((t) => t.kind === kind)!;
}

describe('the registries', () => {
  it('put every house, holder and lot on the map, with a place in words', () => {
    for (const house of POST_HOUSES) {
      expect(CITIES.get(house.cityId), `${house.name} at ${house.cityId}`).toBeDefined();
      expect(house.where.length).toBeGreaterThan(2);
      expect(house.knownFor.length).toBeGreaterThan(10);
      expect(house.services.length).toBeGreaterThan(0);
    }
    for (const holder of RIGHTS_HOLDERS) expect(CITIES.get(holder.cityId), holder.name).toBeDefined();
    for (const lot of STUDIO_LOTS) {
      expect(CITIES.get(lot.cityId), lot.name).toBeDefined();
      expect(lot.stagesApprox).toBeGreaterThan(0);
      expect(lot.where.length).toBeGreaterThan(2);
    }
    expect(new Set(POST_HOUSES.map((h) => h.id)).size).toBe(POST_HOUSES.length);
    expect(new Set(STUDIO_LOTS.map((l) => l.id)).size).toBe(STUDIO_LOTS.length);
    expect(new Set(RIGHTS_HOLDERS.map((r) => r.id)).size).toBe(RIGHTS_HOLDERS.length);
  });

  it('knows the famous ones and what they are for', () => {
    expect(POST_HOUSE_BY_ID['ilm']?.founded).toBe(1975);
    expect(POST_HOUSE_BY_ID['weta']?.cityId).toBe('nz-wgn-wellington');
    expect(POST_HOUSE_BY_ID['skywalker']?.services).toContain('mix');
    expect(POST_HOUSE_BY_ID['abbey-road']?.kind).toBe('scoring_stage');
    expect(housesFor('vfx').length).toBeGreaterThan(15);
    expect(housesFor('color').map((h) => h.id)).toContain('company3');
    expect(STUDIO_LOT_BY_ID['pinewood']?.founded).toBe(1936);
    expect(lotsIn('uk-eng-london').length).toBeGreaterThanOrEqual(5);
    expect(lotsIn('us-ca-losangeles').length).toBeGreaterThanOrEqual(5);
    expect(RIGHTS_HOLDERS.filter((r) => r.side === 'label').map((r) => r.id)).toEqual(expect.arrayContaining(['umg', 'sony-music', 'wmg']));
    expect(RIGHTS_HOLDERS.filter((r) => r.side === 'publisher').map((r) => r.id)).toEqual(expect.arrayContaining(['umpg', 'sony-publishing', 'warner-chappell']));
  });

  it('prices by tier and says the numbers are calibration', () => {
    expect(HOUSE_RATE_CALIBRATION.flagship.vfxShot).toBeGreaterThan(HOUSE_RATE_CALIBRATION.boutique.vfxShot);
    expect(marketStageRate('uk-eng-london')).toBeGreaterThan(0);
    const sim = quickSave({ wealth: 'inherited' }, 'lots-free');
    const free = freeStages(sim, STUDIO_LOT_BY_ID['pinewood']!, sim.now);
    expect(free).toBeGreaterThanOrEqual(1);
    expect(free).toBeLessThan(STUDIO_LOT_BY_ID['pinewood']!.stagesApprox);
    expect(freeStages(sim, STUDIO_LOT_BY_ID['pinewood']!, sim.now)).toBe(free);
  });

  it('is real kit from real makers, and will not sell what is only rented', () => {
    expect(GEAR.length).toBeGreaterThan(40);
    expect(new Set(GEAR.map((g) => g.id)).size).toBe(GEAR.length);
    expect(GEAR_BY_ID['alexa-35']?.maker).toBe('ARRI');
    expect(GEAR_BY_ID['dxl2']?.rentalOnly).toBe(true);
    expect(EQUIPMENT_CATALOG.length).toBe(GEAR.length);
    const sim = quickSave({ wealth: 'inherited' }, 'gear-1');
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    sim.execute({ kind: 'sandbox.add_funds', payload: { amount: 50_000_000_00 } });
    const founded = sim.execute<{ companyId: Id }>({ kind: 'co.found', payload: { structure: 'llc', kind: 'production', name: 'Kit Co', initialCapital: 20_000_000_00 } });
    const companyId = founded.value!.companyId;
    const buyRental = sim.execute({ kind: 'co.acquire_equipment', payload: { companyId, gearId: 'dxl2', acquire: 'purchase' } });
    expect(buyRental.ok).toBe(false);
    expect(buyRental.error).toMatch(/does not sell/i);
    const rent = sim.execute<{ cost: number }>({ kind: 'co.acquire_equipment', payload: { companyId, gearId: 'dxl2', acquire: 'rental', days: 10 } });
    expect(rent.ok).toBe(true);
    expect(rent.value!.cost).toBe(GEAR_BY_ID['dxl2']!.dailyRentalCalibration * 10);
    const buy = sim.execute<{ cost: number }>({ kind: 'co.acquire_equipment', payload: { companyId, templateName: 'ALEXA 35', acquire: 'purchase' } });
    expect(buy.ok).toBe(true);
    expect(buy.value!.cost).toBe(GEAR_BY_ID['alexa-35']!.purchaseCalibration);
  });
});

describe('the cut', () => {
  it('moves the cut along by the hour and shows up in the delivered quality', () => {
    const picture = shotOut(aPicture('cut-1', { direct: true }));
    const before = picture.sim.now;
    const first = picture.run<{ taskKind: string; dayEquivalent: number; gain: number; progress: number }>('prod.cut_session', { projectId: picture.projectId, hours: 6, focus: 'structure' });
    expect(first.taskKind).toBe('assembly');
    expect(first.dayEquivalent).toBeGreaterThan(0);
    expect(first.gain).toBeGreaterThan(0);
    expect(picture.sim.now - before).toBe(6 * 3_600_000);
    const assembly = tasksOf(picture).find((t) => t.kind === 'assembly')!;
    expect(assembly.status).toBe('in_progress');
    expect(assembly.sessions?.length).toBe(1);
    expect(picture.sim.player.wellbeing.energy).toBeLessThan(100);

    const late = picture.try('prod.cut_session', { projectId: picture.projectId, hours: 6 });
    expect(late.ok).toBe(true);
    const tooMany = picture.try('prod.cut_session', { projectId: picture.projectId, hours: 40 });
    expect(tooMany.ok).toBe(true); // clamped to twelve, not refused
  });

  it('refuses a cutting room that is not yours, and a locked picture', () => {
    const picture = shotOut(aPicture('cut-2'));
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const was = project.createdById;
    project.createdById = 'somebody-else' as Id;
    const owner = project.ownerCompanyId;
    project.ownerCompanyId = undefined;
    const refused = picture.try('prod.cut_session', { projectId: picture.projectId, hours: 4 });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/not your cutting room/i);
    project.createdById = was;
    project.ownerCompanyId = owner;

    untilComplete(picture, 'picture_lock', 80);
    const locked = picture.try('prod.cut_session', { projectId: picture.projectId, hours: 4 });
    expect(locked.ok).toBe(false);
    expect(locked.error).toMatch(/locked/i);
  });
});

describe('the houses', () => {
  it('places a task with a real house that does that work, and prices it by tier', () => {
    const picture = shotOut(aPicture('house-1'));
    const wrong = picture.try('prod.choose_house', { projectId: picture.projectId, taskKind: 'color', houseId: 'abbey-road' });
    expect(wrong.ok).toBe(false);
    expect(wrong.error).toMatch(/does not do/i);
    const colorBefore = tasksOf(picture).find((t) => t.kind === 'color')!.budgeted;
    const c3 = picture.run<{ budgeted: number; changed: boolean }>('prod.choose_house', { projectId: picture.projectId, taskKind: 'color', houseId: 'company3' });
    expect(c3.changed).toBe(true);
    expect(c3.budgeted).toBeGreaterThan(colorBefore);
    const again = picture.run<{ changed: boolean }>('prod.choose_house', { projectId: picture.projectId, taskKind: 'color', houseId: 'company3' });
    expect(again.changed).toBe(false);
    const task = tasksOf(picture).find((t) => t.kind === 'color')!;
    expect(task.houseId).toBe('company3');
    expect(task.vendorName).toBe('Company 3');
    picture.run('prod.choose_house', { projectId: picture.projectId, taskKind: 'mix', houseId: 'skywalker' });
    expect(tasksOf(picture).find((t) => t.kind === 'mix')!.vendorName).toBe('Skywalker Sound');
  });
});

describe('visual effects', () => {
  it('counts shots from the script, more for a heavier picture', () => {
    const thriller = aPicture('vfx-count-a');
    const fantasy = aPicture('vfx-count-b', { genres: ['fantasy', 'adventure'] });
    const a = thriller.run<{ shots: number; mix: { simple: number } }>('prod.vfx_breakdown', { projectId: thriller.projectId });
    const b = fantasy.run<{ shots: number }>('prod.vfx_breakdown', { projectId: fantasy.projectId });
    expect(a.shots).toBeGreaterThanOrEqual(20);
    expect(b.shots).toBeGreaterThan(a.shots);
    const again = thriller.run<{ shots: number }>('prod.vfx_breakdown', { projectId: thriller.projectId });
    expect(again.shots).toBe(a.shots);
  });

  it('takes bids from real houses, in their own time, and awards exactly once', () => {
    const picture = shotOut(aPicture('vfx-bids', { genres: ['science fiction', 'action'] }));
    picture.run('prod.vfx_breakdown', { projectId: picture.projectId });
    const early = picture.try('prod.award_vfx', { projectId: picture.projectId, houseId: 'ilm' });
    expect(early.ok).toBe(false);
    expect(early.error).toMatch(/not bid/i);

    const asked = picture.run<{ requested: string[]; alreadyAsked: string[]; arriveAt: number }>('prod.request_vfx_bids', { projectId: picture.projectId, houseIds: ['ilm', 'weta', 'ilp'] });
    expect(asked.requested).toEqual(['ilm', 'weta', 'ilp']);
    const twice = picture.run<{ requested: string[]; alreadyAsked: string[] }>('prod.request_vfx_bids', { projectId: picture.projectId, houseIds: ['ilm', 'rodeo'] });
    expect(twice.alreadyAsked).toEqual(['ilm']);
    expect(twice.requested).toEqual(['rodeo']);
    const notAHouse = picture.try('prod.request_vfx_bids', { projectId: picture.projectId, houseIds: ['abbey-road'] });
    expect(notAHouse.ok).toBe(false);

    const project = picture.sim.universe.projects[picture.projectId] as Project;
    expect(project.vfx!.bids.length).toBe(0);
    picture.sim.advanceTo(asked.arriveAt + 15 * MS_DAY);
    expect(project.vfx!.bids.length).toBe(4);
    const ilm = project.vfx!.bids.find((b) => b.houseId === 'ilm')!;
    const ilp = project.vfx!.bids.find((b) => b.houseId === 'ilp')!;
    expect(ilm.amount).toBeGreaterThan(ilp.amount);
    expect(ilm.expectedQuality).toBeGreaterThan(ilp.expectedQuality);
    expect(ilm.weeks).toBeGreaterThanOrEqual(8);
    expect(picture.sim.universe.notifications.some((n) => /Effects bids in/.test(n.title))).toBe(true);

    const contractsBefore = Object.keys(picture.sim.universe.contracts).length;
    const award = picture.run<{ contractId: Id; amount: number; already: boolean }>('prod.award_vfx', { projectId: picture.projectId, houseId: 'weta' });
    expect(award.already).toBe(false);
    const retry = picture.run<{ contractId: Id; already: boolean }>('prod.award_vfx', { projectId: picture.projectId, houseId: 'weta' });
    expect(retry.already).toBe(true);
    expect(retry.contractId).toBe(award.contractId);
    expect(Object.keys(picture.sim.universe.contracts).length).toBe(contractsBefore + 1);
    const other = picture.try('prod.award_vfx', { projectId: picture.projectId, houseId: 'ilm' });
    expect(other.ok).toBe(false);
    expect(other.error).toMatch(/already awarded/i);
    const task = tasksOf(picture).find((t) => t.kind === 'vfx')!;
    expect(task.houseId).toBe('weta');
    expect(task.budgeted).toBe(award.amount);
    expect(validateUniverse(picture.sim.universe).errors).toEqual([]);
  });
});

describe('music', () => {
  it('spots cues from the cut and licenses them from the people who own them, sync and master', () => {
    const picture = shotOut(aPicture('music-1'));
    const early = picture.try('prod.spot_score', { projectId: picture.projectId });
    expect(early.ok).toBe(false);
    untilComplete(picture, 'editors_cut', 40);
    const spotted = picture.run<{ cues: number; scoreMinutes: number; licensable: number }>('prod.spot_score', { projectId: picture.projectId });
    expect(spotted.cues).toBeGreaterThan(5);
    expect(spotted.scoreMinutes).toBeGreaterThan(5);
    expect(spotted.licensable).toBeGreaterThanOrEqual(2);
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    // A refused command restores the universe, so a cue is re-read, not held.
    const cueId = project.music!.cues.find((c) => c.use === 'needle_drop' || c.use === 'end_credits')!.id;
    const cueOf = () => project.music!.cues.find((c) => c.id === cueId)!;
    const cue = cueOf();
    expect(project.music!.cues.every((c) => !/[A-Z][a-z]+ [A-Z][a-z]+ - /.test(c.description))).toBe(true);

    const score = project.music!.cues.find((c) => c.use === 'score')!;
    const wrong = picture.try('prod.license_music', { projectId: picture.projectId, cueId: score.id, publisherId: 'umpg', labelId: 'umg', syncFee: 100_00, masterFee: 100_00 });
    expect(wrong.ok).toBe(false);
    const sides = picture.try('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'umg', labelId: 'umpg', syncFee: 100_00, masterFee: 100_00 });
    expect(sides.ok).toBe(false);
    expect(sides.error).toMatch(/publisher/i);

    const low = picture.run<{ accepted: boolean; wantedSync: number; wantedMaster: number }>('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'umpg', labelId: 'umg', syncFee: 100_00, masterFee: 100_00 });
    expect(low.accepted).toBe(false);
    expect(low.wantedSync).toBeGreaterThan(100_00);
    const spentBefore = project.spent;
    const yes = picture.run<{ accepted: boolean; contractId?: Id }>('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'umpg', labelId: 'umg', syncFee: Math.round(low.wantedSync * 1.05), masterFee: Math.round(low.wantedMaster * 1.05) });
    expect(yes.accepted).toBe(true);
    expect(yes.contractId).toBeDefined();
    expect(project.spent).toBeGreaterThan(spentBefore);
    expect(cueOf().status).toBe('licensed');
    // A retry reads the licence back; it never pays twice.
    const spentAfter = project.spent;
    const again = picture.run<{ accepted: boolean; contractId?: Id }>('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'umpg', labelId: 'umg', syncFee: 1, masterFee: 1 });
    expect(again.accepted).toBe(true);
    expect(again.contractId).toBe(yes.contractId);
    expect(project.spent).toBe(spentAfter);
    const drop = picture.try('prod.drop_cue', { projectId: picture.projectId, cueId });
    expect(drop.ok).toBe(false);
  });

  it('holds both sides to the same number under most favoured nations', () => {
    const picture = shotOut(aPicture('music-mfn'));
    untilComplete(picture, 'editors_cut', 40);
    picture.run('prod.spot_score', { projectId: picture.projectId });
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const cueId = project.music!.cues.find((c) => c.use === 'end_credits')!.id;
    const cueOf = () => project.music!.cues.find((c) => c.id === cueId)!;
    const cue = cueOf();
    const uneven = picture.try('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'kobalt', labelId: 'beggars', syncFee: 10_000_00, masterFee: 12_000_00, mfn: true });
    expect(uneven.ok).toBe(false);
    expect(uneven.error).toMatch(/same/i);
    const ask = picture.run<{ accepted: boolean; wantedSync: number; wantedMaster: number }>('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'kobalt', labelId: 'beggars', syncFee: 1_000_00, masterFee: 1_000_00, mfn: true });
    expect(ask.accepted).toBe(false);
    expect(ask.wantedSync).toBe(ask.wantedMaster);
    const yes = picture.run<{ accepted: boolean }>('prod.license_music', { projectId: picture.projectId, cueId: cue.id, publisherId: 'kobalt', labelId: 'beggars', syncFee: ask.wantedSync, masterFee: ask.wantedSync, mfn: true });
    expect(yes.accepted).toBe(true);
    expect(cueOf().licence?.mfn).toBe(true);
    expect(cueOf().licence?.syncFee).toBe(cueOf().licence?.masterFee);
  });

  it('records the score on a real stage, once', () => {
    const picture = shotOut(aPicture('music-stage'));
    untilComplete(picture, 'editors_cut', 40);
    picture.run('prod.spot_score', { projectId: picture.projectId });
    const notAStage = picture.try('prod.record_score', { projectId: picture.projectId, stageId: 'ilm' });
    expect(notAStage.ok).toBe(false);
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const spent = project.spent;
    const booked = picture.run<{ days: number; cost: number; already: boolean }>('prod.record_score', { projectId: picture.projectId, stageId: 'abbey-road' });
    expect(booked.already).toBe(false);
    expect(booked.days).toBe(Math.max(1, Math.ceil(scoreMinutes(project.music!.cues) / 12)));
    expect(project.spent - spent).toBe(booked.cost);
    const again = picture.run<{ already: boolean }>('prod.record_score', { projectId: picture.projectId, stageId: 'abbey-road' });
    expect(again.already).toBe(true);
    expect(project.spent - spent).toBe(booked.cost);
    const elsewhere = picture.try('prod.record_score', { projectId: picture.projectId, stageId: 'air' });
    expect(elsewhere.ok).toBe(false);
    expect(project.music!.cues.filter((c) => c.use === 'score').every((c) => c.status === 'recorded')).toBe(true);
  });
});

describe('stages and lots', () => {
  it('books stages on a real lot in the right city, at the calibrated rate, once', () => {
    const picture = aPicture('stage-1');
    picture.run('prod.build_schedule', { projectId: picture.projectId, startAt: picture.sim.now + 30 * MS_DAY, locationId: 'us-ca-losangeles' });
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const wrongCity = picture.try('prod.book_stage', { projectId: picture.projectId, lotId: 'pinewood', from: picture.sim.now + 30 * MS_DAY, days: 10 });
    expect(wrongCity.ok).toBe(false);
    expect(wrongCity.error).toMatch(/shoots in/i);
    const tooMany = picture.try('prod.book_stage', { projectId: picture.projectId, lotId: 'paramount', from: picture.sim.now + 30 * MS_DAY, days: 10, stages: 40 });
    expect(tooMany.ok).toBe(false);
    expect(tooMany.error).toMatch(/free/i);
    const spent = project.spent;
    const from = picture.sim.now + 30 * MS_DAY;
    const booked = picture.run<{ cost: number; daysOnStage: number; already: boolean; lotName: string }>('prod.book_stage', { projectId: picture.projectId, lotId: 'paramount', from, days: 20 });
    expect(booked.already).toBe(false);
    expect(booked.lotName).toBe('Paramount Pictures Studios');
    expect(booked.cost).toBeGreaterThan(0);
    expect(project.spent - spent).toBe(booked.cost);
    const again = picture.run<{ cost: number; already: boolean }>('prod.book_stage', { projectId: picture.projectId, lotId: 'paramount', from, days: 20 });
    expect(again.already).toBe(true);
    expect(project.spent - spent).toBe(booked.cost);
    const onStage = project.shootDayIds.map((id) => picture.sim.universe.shootDays[id]!).filter((d) => d.lotId === 'paramount');
    expect(onStage.length).toBe(booked.daysOnStage);
    if (onStage.length > 0) expect(onStage[0]!.locationName).toContain('Paramount');
  });

  it('lists lots for sale, and a lot you own closes its books every month', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'own-lot');
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    sim.execute({ kind: 'sandbox.add_funds', payload: { amount: 2_000_000_000_00 } });
    sim.player.currentLocationId = 'us-ca-losangeles';
    const listed = sim.execute<{ listingIds: Id[] }>({ kind: 'prop.list_lots', payload: {} });
    expect(listed.ok, listed.error).toBe(true);
    expect(listed.value!.listingIds.length).toBeGreaterThanOrEqual(2);
    const again = sim.execute<{ listingIds: Id[] }>({ kind: 'prop.list_lots', payload: {} });
    expect(again.value!.listingIds).toEqual(listed.value!.listingIds);

    const listing = sim.universe.propertyListings[listed.value!.listingIds[0]!]!;
    const property = sim.universe.properties[listing.propertyId] as Property;
    expect(['studio_lot', 'sound_stage']).toContain(property.kind);
    expect(property.lot).toBeDefined();
    expect(property.lot!.stages).toBeGreaterThanOrEqual(1);
    expect(property.lot!.monthlyOverhead).toBeGreaterThan(0);

    // Buy it the way anything is bought: an offer, a counter if there is one,
    // the inspection, and the closing.
    const offer = sim.execute<{ offerId: Id }>({ kind: 'prop.make_offer', payload: { listingId: listing.id, amount: listing.askingPrice, financingKind: 'cash' } });
    expect(offer.ok, offer.error).toBe(true);
    const offerId = offer.value!.offerId;
    for (let day = 0; day < 90 && !property.ownerId; day++) {
      sim.advanceTo(sim.now + MS_DAY);
      const current = sim.universe.propertyOffers[offerId]!;
      if (current.status === 'countered') sim.execute({ kind: 'prop.respond_to_counter', payload: { offerId, accept: true } });
      const pending = Object.values(sim.universe.decisions).find((d) => d.refType === 'offer' && d.refId === offerId && !d.resolvedAt && !d.dismissedAt && /Inspection/.test(d.title));
      if (pending) sim.execute({ kind: 'prop.inspection_decision', payload: { offerId, proceed: true } });
    }
    expect(property.ownerId, `the lot never closed (${sim.universe.propertyOffers[offerId]?.status})`).toBe(sim.player.id);

    // Rent is set by you; the market is what the real lots in town charge.
    const rate = sim.execute<{ stageDayRate: number; marketRate: number }>({ kind: 'lot.set_rate', payload: { propertyId: property.id, stageDayRate: Math.round(marketStageRate('us-ca-losangeles') * 0.8) } });
    expect(rate.ok).toBe(true);
    expect(rate.value!.marketRate).toBe(marketStageRate('us-ca-losangeles'));

    sim.advanceTo(sim.now + 100 * MS_DAY);
    const plant = property.lot!;
    expect(plant.lastClosedAt).toBeDefined();
    expect(plant.lifetimeOverhead).toBeGreaterThan(0);
    expect(sim.universe.notifications.some((n) => n.title.includes('month closed'))).toBe(true);
    expect(plant.occupancy).toBeGreaterThanOrEqual(0);
    expect(plant.occupancy).toBeLessThanOrEqual(1);
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });
});

describe('the sandbox stages a picture', () => {
  it('walks a demo picture through the same commands into post, and refuses with the sandbox off', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'stage-demo');
    const off = sim.execute({ kind: 'sandbox.stage_picture', payload: { to: 'post' } });
    expect(off.ok).toBe(false);
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    const staged = sim.execute<{ projectId: Id; phase: string; days: number }>({ kind: 'sandbox.stage_picture', payload: { to: 'post' } });
    expect(staged.ok, staged.error).toBe(true);
    const project = sim.universe.projects[staged.value!.projectId] as Project;
    expect(project.postTaskIds.length).toBeGreaterThan(0);
    expect(project.shootDayIds.length).toBeGreaterThan(5);
    expect(project.completedShootDays).toBeGreaterThan(0);
    expect(sim.universe.shootDays[project.shootDayIds[0]!]?.callSheet).toBeDefined();
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    const boarded = sim.execute<{ projectId: Id; phase: string }>({ kind: 'sandbox.stage_picture', payload: { to: 'boarded', title: 'Second Unit' } });
    expect(boarded.ok, boarded.error).toBe(true);
    expect(sim.universe.projects[boarded.value!.projectId]?.phase).toBe('preproduction');
  });
});
