/**
 * SLATE — post is work, and the plant is real.
 *
 * A cut is made in sessions the player sits in. Visual effects are counted
 * from the script, bid on by real houses, and awarded to one of them on a
 * contract. Music is spotted cue by cue and licensed from the companies that
 * actually own recorded music, sync and master both, most favoured nations if
 * you insist on it. Stages are booked on real lots at SLATE's calibrated rate,
 * and a lot can be owned: stages, overhead, tenants and a monthly close.
 *
 * Every price here is SLATE's calibration and says so where the player sees
 * it. Nobody real is quoted, and no real song is named.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Contract, Id, MusicCue, PostTask, PostTaskKind, Project, Property, PropertyListing, StageBooking, StudioPlant, VfxBid, VfxPlan,
} from '../domain/model';
import { clamp, remap } from '../core/rng';
import { MS_DAY, MS_HOUR, addDays, addMonths, formatDate, zonedParts } from '../core/time';
import { formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import {
  HOUSE_RATE_CALIBRATION, POST_HOUSE_BY_ID, RIGHTS_HOLDER_BY_ID, STAGE_DAY_CALIBRATION, STUDIO_LOT_BY_ID,
  lotsIn, type PostHouse, type PostService, type Tier,
} from '../content/post-houses';
import { chargeProduction } from './production';
import { playerControls } from './real-people';
import { grantProfessionXp } from './professions';
import { generateProperty } from './property';
import { readiness } from './life';

// ---------------------------------------------------------------------------
// Calibration
// ---------------------------------------------------------------------------

/** Which service a post task buys from a house. */
const SERVICE_OF: Partial<Record<PostTaskKind, PostService>> = {
  assembly: 'editorial', editors_cut: 'editorial', directors_cut: 'editorial', studio_notes: 'editorial', picture_lock: 'editorial',
  vfx: 'vfx', adr: 'adr', foley: 'foley', sound_design: 'sound_design', score: 'scoring',
  mix: 'mix', color: 'color', titles: 'titles', subtitles: 'mastering', localization: 'mastering', qc: 'qc', mastering: 'mastering', delivery: 'mastering',
};

/** What a tier does to the budget line and to the delivered quality. */
const TIER_COST: Readonly<Record<Tier, number>> = { boutique: 0.75, mid: 1, major: 1.35, flagship: 1.8 };
const TIER_LIFT: Readonly<Record<Tier, number>> = { boutique: -3, mid: 0, major: 4, flagship: 8 };
const TIER_VFX_BASE: Readonly<Record<Tier, number>> = { boutique: 62, mid: 72, major: 82, flagship: 90 };
/** Shots a house turns round in a week, on SLATE's scale. */
const TIER_VFX_WEEKLY: Readonly<Record<Tier, number>> = { boutique: 18, mid: 30, major: 55, flagship: 80 };

const SHOT_WEIGHT = { simple: 0.35, medium: 1, hero: 3.5 } as const;

/** The stage of post a session can be held on, in the order they happen. */
const CUTTING_ORDER: readonly PostTaskKind[] = ['assembly', 'editors_cut', 'directors_cut', 'studio_notes', 'picture_lock'];

const MAX_CUES = 40;
/** How many times a rights holder will hear the same ask before the price stops moving. */
const MAX_MUSIC_ASKS = 4;

/** Working days in a month, for a lot's close. */
const WORKING_DAYS = 22;

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerPost(sim: Simulation): void {
  sim.onSchedule('post.vfx_bids_in', (item) => bidsArrive(sim, item.payload.projectId as Id, item.payload.houseIds as string[]));
  sim.onSchedule('post.lots_close', () => {
    closeLots(sim);
    armLotsClose(sim);
  });

  // --- The cut --------------------------------------------------------------

  sim.onCommand<
    { projectId: Id; hours: number; focus?: 'structure' | 'performance' | 'pace' | 'ending'; remote?: boolean },
    { taskKind: PostTaskKind; dayEquivalent: number; gain: number; note: string; progress: number }
  >(
    'prod.cut_session',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const player = s.player;
      const isDirector = project.directorId === player.id;
      const isEditor = project.attachments.some((a) => a.personId === player.id && a.role === 'editor');
      if (!isDirector && !isEditor && !playerControls(s, project)) throw new CommandError('That is not your cutting room.');

      const hours = clamp(Math.round(p.hours), 1, 12);

      const tasks = project.postTaskIds.map((id) => s.universe.postTasks[id]).filter((t): t is PostTask => Boolean(t));
      if (tasks.length === 0) throw new CommandError('Post has not opened. There is nothing to cut yet.');
      const task = CUTTING_ORDER.map((kind) => tasks.find((t) => t.kind === kind))
        .find((t) => t && (t.status === 'in_progress' || t.status === 'ready'));
      if (!task) {
        const locked = tasks.find((t) => t.kind === 'picture_lock')?.status === 'complete';
        throw new CommandError(locked ? 'The picture is locked. There is nothing left to cut.' : 'Nothing in the cutting room is ready for you yet.');
      }
      if (player.wellbeing.energy < 10) throw new CommandError('You are too tired to look at a cut. Sleep first.');
      if (task.status === 'ready') {
        task.status = 'in_progress';
        task.startedAt = s.now;
        task.vendorName ??= task.houseId ? POST_HOUSE_BY_ID[task.houseId]?.name : 'In-house cutting room';
        armPostTick(s, project);
      }

      // Whose craft is on the room. A director's cut is the director's; an
      // editor's cut is the editor's; notes are the producer's.
      const skill = (id: string) => player.skills[id] ?? 20;
      const craft = task.kind === 'directors_cut'
        ? skill('post_vision') * 0.5 + skill('tone_control') * 0.3 + skill('editing') * 0.2
        : task.kind === 'studio_notes' || task.kind === 'picture_lock'
          ? skill('post_supervision') * 0.5 + skill('tone_control') * 0.3 + skill('editing') * 0.2
          : skill('editing') * 0.7 + skill('post_vision') * 0.3;
      const ready = readiness(player) / 100;
      const remote = p.remote ?? !(project.productionLocationIds.includes(player.currentLocationId));
      const remoteFactor = remote ? 0.6 : 1;
      const dayEquivalent = Number(((hours / 8) * (0.6 + (craft / 100) * 0.9) * remoteFactor).toFixed(2));
      const gain = Number((hours * (0.25 + (craft / 100) * 0.55) * ready * remoteFactor).toFixed(2));

      s.advanceTo(s.now + hours * MS_HOUR);
      task.elapsedDays = Number((task.elapsedDays + dayEquivalent).toFixed(2));
      const focus = p.focus ?? 'structure';
      const note = sessionNote(focus, craft, remote, hours);
      task.sessions ??= [];
      task.sessions.push({ at: s.now, hours, note, gain });
      task.notes.push({ at: s.now, note: `${hours}-hour session${remote ? ' over a remote link' : ''}. ${note}` });

      player.wellbeing.energy = clamp(player.wellbeing.energy - hours * 4, 0, 100);
      player.wellbeing.stress = clamp(player.wellbeing.stress + hours * 1.5, 0, 100);
      player.skills['editing'] = clamp((player.skills['editing'] ?? 0) + hours * 0.35, 0, 100);
      if (task.kind === 'directors_cut' && isDirector) {
        player.skills['post_vision'] = clamp((player.skills['post_vision'] ?? 0) + hours * 0.3, 0, 100);
        grantProfessionXp(s, player, 'director', 6);
      }
      if ((task.kind === 'studio_notes' || task.kind === 'picture_lock') && playerControls(s, project)) {
        player.skills['post_supervision'] = clamp((player.skills['post_supervision'] ?? 0) + hours * 0.3, 0, 100);
        grantProfessionXp(s, player, 'producer', 5);
      }

      s.audit({
        kind: 'prod.cut_session', subjectType: 'posttask', subjectId: task.id,
        question: 'What did that session do for the cut?',
        summary: `${hours} hours on the ${task.name.toLowerCase()}. ${note}`,
        factors: [
          { label: 'Your Craft In The Room', detail: `Reads at ${Math.round(craft)} out of 100 for this stage of the cut.`, weight: 0.5, contribution: craft / 100 * 0.5, knowable: true },
          { label: 'How You Were Today', detail: `Readiness ${Math.round(ready * 100)}%.`, weight: 0.3, contribution: ready * 0.3, knowable: true },
          { label: 'In The Room Or Not', detail: remote ? 'A remote link is not the same as the room.' : 'In the room with the editor.', weight: 0.2, contribution: remoteFactor * 0.2, knowable: true },
        ],
        score: gain,
        outcome: gain > 4 ? 'strong' : gain > 2 ? 'useful' : 'thin',
      });
      s.emit('prod.cut_session_held', { projectId: project.id, taskId: task.id, kind: task.kind, hours, gain });
      return { taskKind: task.kind, dayEquivalent, gain, note, progress: clamp(task.elapsedDays / Math.max(1, task.plannedDays), 0, 1) };
    },
  );

  // --- The houses --------------------------------------------------------------

  sim.onCommand<{ projectId: Id; taskKind: PostTaskKind; houseId: string }, { houseId: string; name: string; budgeted: Money; changed: boolean }>(
    'prod.choose_house',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project) && project.directorId !== s.player.id) throw new CommandError('That is not your picture to place.');
      const house = POST_HOUSE_BY_ID[p.houseId];
      if (!house) throw new CommandError('No such house on the record.');
      const task = project.postTaskIds.map((id) => s.universe.postTasks[id]).find((t) => t?.kind === p.taskKind);
      if (!task) throw new CommandError(p.taskKind === 'music_clearance' ? 'Music clearance is not placed with a house. License the cues.' : 'That task is not on this picture.');
      if (task.status === 'complete') throw new CommandError(`${task.name} is already delivered.`);
      const service = SERVICE_OF[task.kind];
      if (!service) throw new CommandError(`${task.name} is not placed with a house.`);
      if (!house.services.includes(service)) throw new CommandError(`${house.name} does not do ${service.replace(/_/g, ' ')}. Their record says ${house.knownFor}`);
      if (task.kind === 'vfx' && project.vfx?.awardedHouseId && project.vfx.awardedHouseId !== house.id) {
        throw new CommandError(`The effects are awarded to ${POST_HOUSE_BY_ID[project.vfx.awardedHouseId]?.name ?? 'another house'} on a contract.`);
      }
      if (task.houseId === house.id) return { houseId: house.id, name: house.name, budgeted: task.budgeted, changed: false };

      const postBudget = Math.round(project.budget * 0.30);
      const base = baseBudgetFor(task.kind, postBudget);
      task.houseId = house.id;
      task.vendorName = house.name;
      if (task.kind !== 'vfx' || !project.vfx?.awardedHouseId) task.budgeted = Math.round(base * TIER_COST[house.tier] * costOfLiving(house.cityId));
      task.notes.push({ at: s.now, note: `Placed with ${house.name} (${house.where}). ${house.knownFor}` });
      s.emit('prod.house_chosen', { projectId: project.id, taskId: task.id, kind: task.kind, houseId: house.id });
      return { houseId: house.id, name: house.name, budgeted: task.budgeted, changed: true };
    },
  );

  // --- Visual effects ---------------------------------------------------------------

  sim.onCommand<{ projectId: Id }, VfxPlan>(
    'prod.vfx_breakdown',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project) && project.directorId !== s.player.id) throw new CommandError('That is not your picture.');
      if (project.vfx) return project.vfx;
      const draft = project.currentDraftId ? s.universe.scriptDrafts[project.currentDraftId] : undefined;
      if (!draft) throw new CommandError('There is no script to count shots from.');
      project.vfx = countShots(s, project, draft.scenes, draft.pages);
      s.emit('prod.vfx_broken_down', { projectId: project.id, shots: project.vfx.shots });
      return project.vfx;
    },
  );

  sim.onCommand<{ projectId: Id; houseIds: string[] }, { requested: string[]; alreadyAsked: string[]; arriveAt: number }>(
    'prod.request_vfx_bids',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project) && project.directorId !== s.player.id) throw new CommandError('That is not your picture.');
      if (!project.vfx) throw new CommandError('Count the shots first. A house cannot bid on a picture with no breakdown.');
      if (project.vfx.awardedHouseId) throw new CommandError('The effects are already awarded.');
      const ids = [...new Set(p.houseIds)];
      if (ids.length === 0) throw new CommandError('Name at least one house.');
      if (ids.length > 5) throw new CommandError('Five houses is as many as a bid round holds.');
      for (const id of ids) {
        const house = POST_HOUSE_BY_ID[id];
        if (!house) throw new CommandError(`No house on the record called ${id}.`);
        if (!house.services.includes('vfx')) throw new CommandError(`${house.name} is not a visual effects house.`);
      }
      const pendingFor = s.timeline.pending().filter((i) => i.kind === 'post.vfx_bids_in' && i.refId === project.id).flatMap((i) => i.payload.houseIds as string[]);
      const alreadyAsked = ids.filter((id) => project.vfx!.bids.some((b) => b.houseId === id) || pendingFor.includes(id));
      const requested = ids.filter((id) => !alreadyAsked.includes(id));
      const rng = s.rng('vfx_bid_timing', project.id, requested.join(','));
      const arriveAt = addDays(s.now, rng.int(7, 14), s.homeZone);
      if (requested.length > 0) {
        s.schedule({
          at: arriveAt, kind: 'post.vfx_bids_in', label: `${project.title} — Effects Bids Due`,
          category: 'production', payload: { projectId: project.id, houseIds: requested }, priority: 44,
          refType: 'project', refId: project.id,
        });
      }
      return { requested, alreadyAsked, arriveAt };
    },
  );

  sim.onCommand<{ projectId: Id; houseId: string }, { contractId: Id; amount: Money; weeks: number; already: boolean }>(
    'prod.award_vfx',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project)) throw new CommandError('Awarding the effects is the producer’s call, and that is not your picture.');
      const plan = project.vfx;
      if (!plan) throw new CommandError('There is no effects breakdown on this picture.');
      const house = POST_HOUSE_BY_ID[p.houseId];
      if (!house) throw new CommandError('No such house.');
      const bid = plan.bids.find((b) => b.houseId === house.id);
      // A retry reads the award back rather than making a second contract.
      if (plan.awardedHouseId === house.id && plan.contractId) {
        return { contractId: plan.contractId, amount: bid?.amount ?? 0, weeks: bid?.weeks ?? 0, already: true };
      }
      if (plan.awardedHouseId) throw new CommandError(`The effects are already awarded to ${POST_HOUSE_BY_ID[plan.awardedHouseId]?.name ?? 'another house'}.`);
      if (!bid) throw new CommandError(`${house.name} has not bid. Ask them first.`);

      const task = project.postTaskIds.map((id) => s.universe.postTasks[id]).find((t) => t?.kind === 'vfx');
      const partyA = project.ownerCompanyId ?? s.player.id;
      const contract: Contract = {
        id: s.nextId('contract'),
        saveId: s.universe.meta.id,
        kind: 'vendor',
        projectId: project.id,
        partyAId: partyA,
        partyAKind: project.ownerCompanyId ? 'company' : 'person',
        partyBId: `house:${house.id}` as Id,
        partyBKind: 'company',
        title: `${house.name} — visual effects on ${project.title}`,
        compensation: bid.amount,
        paymentSchedule: [
          { label: 'On Award', amount: Math.round(bid.amount * 0.3), dueAt: s.now, paid: false },
          { label: 'On Delivery', amount: bid.amount - Math.round(bid.amount * 0.3), dueAt: addDays(s.now, bid.weeks * 7, s.homeZone), trigger: 'prod.post_task_complete', paid: false },
        ],
        bonuses: [],
        obligations: [{ label: `${plan.shots} shots delivered`, kind: 'delivery', dueAt: addDays(s.now, bid.weeks * 7, s.homeZone), satisfied: false }],
        startsAt: s.now,
        endsAt: addDays(s.now, bid.weeks * 7 + 30, s.homeZone),
        status: 'executed',
        signedAt: s.now,
        negotiationHistory: [{ at: s.now, byId: s.player.id, note: `Awarded on a bid of ${formatMoney(bid.amount)} over ${bid.weeks} weeks.`, offer: bid.amount }],
      };
      s.universe.contracts[contract.id] = contract;
      plan.awardedHouseId = house.id;
      plan.awardedAt = s.now;
      plan.contractId = contract.id;
      if (task) {
        task.houseId = house.id;
        task.vendorName = house.name;
        task.budgeted = bid.amount;
        task.plannedDays = Math.max(21, bid.weeks * 7);
        task.notes.push({ at: s.now, note: `Awarded to ${house.name}: ${plan.shots} shots, ${formatMoney(bid.amount)}, ${bid.weeks} weeks.` });
      }
      s.remember({
        category: 'project',
        title: `${project.title} awarded its effects to ${house.name}`,
        detail: `${plan.shots} shots at ${formatMoneyCompact(bid.amount)} over ${bid.weeks} weeks.`,
        refs: [{ type: 'project', id: project.id }],
        significance: 48, public: true, amount: bid.amount,
      });
      s.emit('prod.vfx_awarded', { projectId: project.id, houseId: house.id, amount: bid.amount, shots: plan.shots });
      return { contractId: contract.id, amount: bid.amount, weeks: bid.weeks, already: false };
    },
  );

  // --- Music -------------------------------------------------------------------------

  sim.onCommand<{ projectId: Id }, { cues: number; scoreMinutes: number; licensable: number }>(
    'prod.spot_score',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project) && project.directorId !== s.player.id) throw new CommandError('That is not your picture.');
      const tasks = project.postTaskIds.map((id) => s.universe.postTasks[id]);
      const editorsCut = tasks.find((t) => t?.kind === 'editors_cut');
      if (!editorsCut || editorsCut.status !== 'complete') throw new CommandError('Spotting happens on a cut. Get to an editor’s cut first.');
      project.music ??= { cues: [] };
      if (project.music.spottedAt) {
        const cues = project.music.cues;
        return { cues: cues.length, scoreMinutes: scoreMinutes(cues), licensable: cues.filter((c) => c.use !== 'score').length };
      }
      const draft = project.currentDraftId ? s.universe.scriptDrafts[project.currentDraftId] : undefined;
      project.music.cues = spotCues(s, project, draft?.scenes ?? [], draft?.pages ?? 100);
      project.music.spottedAt = s.now;
      project.music.composerId = project.attachments.find((a) => a.role === 'composer' && a.confirmed)?.personId;
      s.emit('prod.score_spotted', { projectId: project.id, cues: project.music.cues.length });
      return { cues: project.music.cues.length, scoreMinutes: scoreMinutes(project.music.cues), licensable: project.music.cues.filter((c) => c.use !== 'score').length };
    },
  );

  sim.onCommand<
    { projectId: Id; cueId: Id; publisherId: string; labelId: string; syncFee: Money; masterFee: Money; mfn?: boolean; term?: MusicCue['licence'] extends infer L ? L extends { term: infer T } ? T : never : never; territory?: 'worldwide' | 'domestic' },
    { accepted: boolean; syncFee: Money; masterFee: Money; wantedSync: Money; wantedMaster: Money; reason: string; contractId?: Id }
  >(
    'prod.license_music',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project)) throw new CommandError('Licensing is the producer’s call, and that is not your picture.');
      const cue = project.music?.cues.find((c) => c.id === p.cueId);
      if (!cue) throw new CommandError('No such cue on this picture.');
      if (cue.use === 'score') throw new CommandError('That cue is score. The composer writes it; nobody licenses it.');
      // A licence already on the record is read back, never re-rolled.
      if (cue.licence) {
        return { accepted: true, syncFee: cue.licence.syncFee, masterFee: cue.licence.masterFee, wantedSync: cue.licence.syncFee, wantedMaster: cue.licence.masterFee, reason: 'Already licensed.', contractId: cue.licence.contractId };
      }
      if (cue.status === 'dropped') throw new CommandError('That cue was dropped. Bring it back before you license it.');
      const publisher = RIGHTS_HOLDER_BY_ID[p.publisherId];
      const label = RIGHTS_HOLDER_BY_ID[p.labelId];
      if (!publisher || publisher.side !== 'publisher') throw new CommandError('Sync comes from a publisher. Name one.');
      if (!label || label.side !== 'label') throw new CommandError('The master comes from a label. Name one.');
      if (p.syncFee <= 0 || p.masterFee <= 0) throw new CommandError('Both licences have to be for money.');
      const mfn = p.mfn ?? false;
      if (mfn && p.syncFee !== p.masterFee) throw new CommandError('Most favoured nations means both sides get the same. Offer the same number to each.');
      const term = (p.term as MusicCue['licence'] extends infer L ? L extends { term: infer T } ? T : never : never) ?? 'perpetuity';
      const territory = p.territory ?? 'worldwide';

      const asks = ((cue as MusicCue & { asks?: number }).asks ?? 0);
      if (asks >= MAX_MUSIC_ASKS) throw new CommandError('They have heard from you four times on this cue. The price is what it is.');
      const wantedSync = wantedFor(s, project, cue, publisher.posture, term, territory, asks, mfn, 'sync');
      const wantedMaster = wantedFor(s, project, cue, label.posture, term, territory, asks, mfn, 'master');
      const wantedEach = mfn ? Math.max(wantedSync, wantedMaster) : undefined;
      const syncOk = p.syncFee >= (wantedEach ?? wantedSync) * 0.9;
      const masterOk = p.masterFee >= (wantedEach ?? wantedMaster) * 0.9;
      (cue as MusicCue & { asks?: number }).asks = asks + 1;

      if (!syncOk || !masterOk) {
        const who = !syncOk && !masterOk ? `${publisher.name} and ${label.name}` : !syncOk ? publisher.name : label.name;
        const reason = `${who} passed at that number. ${mfn ? `With MFN they each want ${formatMoney(wantedEach!)}.` : `The publisher wants ${formatMoney(wantedSync)} for sync; the label wants ${formatMoney(wantedMaster)} for the master.`}`;
        s.audit({
          kind: 'prod.music_licence_refused', subjectType: 'project', subjectId: project.id,
          question: `Why would they not license cue ${cue.number}?`,
          summary: reason,
          factors: [
            { label: 'Their Posture', detail: `${publisher.posture === 'major' ? 'A major publisher' : 'An independent publisher'} and ${label.posture === 'major' ? 'a major label' : 'an independent label'}.`, weight: 0.4, contribution: 0, knowable: true },
            { label: 'The Use', detail: `${useLabel(cue.use)}, ${cue.minutes.toFixed(1)} minutes, ${term.replace(/_/g, ' ')}, ${territory}.`, weight: 0.4, contribution: 0, knowable: true },
            { label: 'Your Budget', detail: 'They price against what the picture can pay.', weight: 0.2, contribution: 0, knowable: true },
          ],
          score: 0, outcome: 'refused',
        });
        return { accepted: false, syncFee: p.syncFee, masterFee: p.masterFee, wantedSync: wantedEach ?? wantedSync, wantedMaster: wantedEach ?? wantedMaster, reason };
      }

      const total = p.syncFee + p.masterFee;
      chargeProduction(s, project, total, `${project.title} — cue ${cue.number} licence (${publisher.name}, ${label.name})`);
      const contract: Contract = {
        id: s.nextId('contract'),
        saveId: s.universe.meta.id,
        kind: 'license',
        projectId: project.id,
        partyAId: project.ownerCompanyId ?? s.player.id,
        partyAKind: project.ownerCompanyId ? 'company' : 'person',
        partyBId: `rights:${publisher.id}+${label.id}` as Id,
        partyBKind: 'company',
        title: `Cue ${cue.number} — sync and master licence`,
        compensation: total,
        paymentSchedule: [{ label: 'Sync Fee', amount: p.syncFee, dueAt: s.now, paid: true, paidAt: s.now }, { label: 'Master Fee', amount: p.masterFee, dueAt: s.now, paid: true, paidAt: s.now }],
        bonuses: [],
        obligations: [],
        startsAt: s.now,
        endsAt: term === 'perpetuity' ? undefined : term === 'ten_years' ? addMonths(s.now, 120, s.homeZone) : addMonths(s.now, 18, s.homeZone),
        status: 'executed',
        signedAt: s.now,
        negotiationHistory: [{ at: s.now, byId: s.player.id, note: `${mfn ? 'MFN. ' : ''}${term.replace(/_/g, ' ')}, ${territory}.`, offer: total }],
      };
      s.universe.contracts[contract.id] = contract;
      cue.licence = { publisherId: publisher.id, labelId: label.id, syncFee: p.syncFee, masterFee: p.masterFee, mfn, term, territory, at: s.now, contractId: contract.id };
      cue.status = 'licensed';
      const clearance = project.postTaskIds.map((id) => s.universe.postTasks[id]).find((t) => t?.kind === 'music_clearance');
      if (clearance) clearance.notes.push({ at: s.now, note: `Cue ${cue.number} cleared: ${formatMoney(total)} to ${publisher.name} and ${label.name}.` });
      s.emit('prod.music_licensed', { projectId: project.id, cueId: cue.id, total });
      return { accepted: true, syncFee: p.syncFee, masterFee: p.masterFee, wantedSync, wantedMaster, reason: 'Licensed.', contractId: contract.id };
    },
  );

  sim.onCommand<{ projectId: Id; cueId: Id; restore?: boolean }, { status: MusicCue['status'] }>(
    'prod.drop_cue',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project) && project.directorId !== s.player.id) throw new CommandError('That is not your picture.');
      const cue = project.music?.cues.find((c) => c.id === p.cueId);
      if (!cue) throw new CommandError('No such cue.');
      if (cue.licence) throw new CommandError('That cue is licensed and paid for. It stays.');
      cue.status = p.restore ? 'spotted' : 'dropped';
      return { status: cue.status };
    },
  );

  sim.onCommand<{ projectId: Id; stageId: string }, { stageId: string; days: number; cost: Money; already: boolean }>(
    'prod.record_score',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project) && project.directorId !== s.player.id) throw new CommandError('That is not your picture.');
      const stage = POST_HOUSE_BY_ID[p.stageId];
      if (!stage || stage.kind !== 'scoring_stage') throw new CommandError('That is not a scoring stage.');
      const music = project.music;
      if (!music?.spottedAt) throw new CommandError('Spot the picture first. There is nothing to record until the cues exist.');
      const task = project.postTaskIds.map((id) => s.universe.postTasks[id]).find((t) => t?.kind === 'score');
      if (!task) throw new CommandError('There is no score on this picture.');
      if (task.status === 'complete') throw new CommandError('The score is delivered.');
      const minutes = scoreMinutes(music.cues);
      const days = Math.max(1, Math.ceil(minutes / 12));
      const cost = Math.round(HOUSE_RATE_CALIBRATION[stage.tier].scoringDay * days * costOfLiving(stage.cityId));
      if (music.scoringStageId === stage.id && music.recordedAt) return { stageId: stage.id, days, cost, already: true };
      if (music.recordedAt) throw new CommandError(`The score was recorded at ${POST_HOUSE_BY_ID[music.scoringStageId!]?.name ?? 'another stage'}.`);
      chargeProduction(s, project, cost, `${project.title} — scoring sessions at ${stage.name}`);
      music.scoringStageId = stage.id;
      music.recordedAt = s.now;
      task.houseId = stage.id;
      task.vendorName = `${task.vendorName && !task.vendorName.includes(stage.name) ? `${task.vendorName}, recorded at ` : ''}${stage.name}`;
      task.notes.push({ at: s.now, note: `${days} day${days === 1 ? '' : 's'} on the stage at ${stage.name}: ${minutes.toFixed(0)} minutes of score.` });
      for (const cue of music.cues) if (cue.use === 'score' && cue.status !== 'dropped') cue.status = 'recorded';
      s.emit('prod.score_recorded', { projectId: project.id, stageId: stage.id, days, cost });
      return { stageId: stage.id, days, cost, already: false };
    },
  );

  // --- Stages -----------------------------------------------------------------------

  sim.onCommand<{ projectId: Id; lotId: string; from: number; days: number; stages?: number }, { bookingId: Id; cost: Money; lotName: string; daysOnStage: number; already: boolean }>(
    'prod.book_stage',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project)) throw new CommandError('Booking stages is the producer’s call, and that is not your picture.');
      const days = clamp(Math.round(p.days), 1, 200);
      const stages = clamp(Math.round(p.stages ?? 1), 1, 12);
      if (p.from < s.now) throw new CommandError('You cannot book a stage in the past.');

      const lot = STUDIO_LOT_BY_ID[p.lotId];
      const own = s.universe.properties[p.lotId];
      const plant = own?.lot;
      if (!lot && !(own && plant)) throw new CommandError('No such lot.');
      const cityId = lot ? lot.cityId : own!.locationId;
      const name = lot ? lot.name : own!.name;
      const owned = Boolean(own && plant && ownedByPlayer(s, own));
      if (own && plant && !owned) throw new CommandError(`${own.name} is not yours to book.`);

      project.stageBookings ??= [];
      const existing = project.stageBookings.find((b) => b.lotId === p.lotId && b.from === p.from);
      if (existing) return { bookingId: existing.id, cost: existing.cost, lotName: existing.lotName, daysOnStage: existing.days, already: true };

      if (lot) {
        const free = freeStages(s, lot, p.from);
        if (stages > free) throw new CommandError(`${lot.name} has ${free} stage${free === 1 ? '' : 's'} free then, not ${stages}.`);
      } else {
        const busy = plant!.tenants.filter((t) => t.to > p.from && t.from < p.from + days * MS_DAY).reduce((sum, t) => sum + t.stages, 0);
        if (stages > plant!.stages - busy) throw new CommandError(`${name} has ${plant!.stages - busy} stage${plant!.stages - busy === 1 ? '' : 's'} free then.`);
      }
      if (project.productionLocationIds.length > 0 && !project.productionLocationIds.includes(cityId)) {
        throw new CommandError(`${name} is in ${CITIES.get(cityId)?.name ?? cityId}; the picture shoots in ${project.productionLocationIds.map((id) => CITIES.get(id)?.name ?? id).join(', ')}.`);
      }
      if (project.productionLocationIds.length === 0) project.productionLocationIds.push(cityId);

      const rate = lot ? STAGE_DAY_CALIBRATION[lot.tier] : plant!.stageDayRate;
      const cost = owned ? 0 : Math.round(rate * costOfLiving(cityId) * stages * days);
      const to = p.from + days * MS_DAY;
      const booking: StageBooking = {
        id: s.nextId('contract'),
        lotId: p.lotId, lotName: name, stages, from: p.from, to, days, cost, bookedAt: s.now,
      };
      if (cost > 0) {
        chargeProduction(s, project, cost, `${project.title} — ${stages} stage${stages === 1 ? '' : 's'} at ${name}, ${days} days`);
        const contract: Contract = {
          id: s.nextId('contract'),
          saveId: s.universe.meta.id,
          kind: 'vendor',
          projectId: project.id,
          partyAId: project.ownerCompanyId ?? s.player.id,
          partyAKind: project.ownerCompanyId ? 'company' : 'person',
          partyBId: `lot:${p.lotId}` as Id,
          partyBKind: 'company',
          title: `${name} — stage hire for ${project.title}`,
          compensation: cost,
          paymentSchedule: [{ label: 'Stage Hire', amount: cost, dueAt: s.now, paid: true, paidAt: s.now }],
          bonuses: [], obligations: [],
          startsAt: p.from, endsAt: to,
          status: 'executed', signedAt: s.now,
          negotiationHistory: [{ at: s.now, byId: s.player.id, note: `${stages} stage${stages === 1 ? '' : 's'}, ${days} days at SLATE’s calibrated rate.`, offer: cost }],
        };
        s.universe.contracts[contract.id] = contract;
        booking.contractId = contract.id;
      }
      if (owned) {
        plant!.tenants.push({ projectTitle: project.title, projectId: project.id, stages, from: p.from, to, dayRate: 0 });
      }
      project.stageBookings.push(booking);

      // The days already boarded onto a stage move onto this one.
      let daysOnStage = 0;
      for (const id of project.shootDayIds) {
        const day = s.universe.shootDays[id];
        if (!day || !day.isStage || day.callTime < p.from || day.callTime >= to || day.status !== 'scheduled') continue;
        day.lotId = p.lotId;
        day.locationName = `${name} — Stage`;
        daysOnStage++;
      }
      s.emit('prod.stage_booked', { projectId: project.id, lotId: p.lotId, stages, days, cost, owned });
      return { bookingId: booking.id, cost, lotName: name, daysOnStage, already: false };
    },
  );

  // --- Owning a lot -----------------------------------------------------------------

  sim.onCommand<{ cityId?: string }, { listingIds: Id[] }>(
    'prop.list_lots',
    (p, { sim: s }) => {
      const cityId = p.cityId ?? s.player.currentLocationId;
      const city = CITIES.get(cityId);
      if (!city) throw new CommandError('No such city.');
      const active = Object.values(s.universe.propertyListings).filter((l) => {
        const property = s.universe.properties[l.propertyId];
        return l.status === 'active' && property && property.locationId === cityId && (property.kind === 'studio_lot' || property.kind === 'sound_stage');
      });
      if (active.length > 0) return { listingIds: active.map((l) => l.id) };

      const rng = s.rng('lot_listings', cityId, Math.floor(s.now / (10 * MS_DAY)));
      const count = rng.int(2, 4);
      const ids: Id[] = [];
      for (let i = 0; i < count; i++) {
        const kind = i === 0 || rng.chance(0.45) ? 'studio_lot' : 'sound_stage';
        const property = generateProperty(s, cityId, kind, `lot-${s.now}-${i}`);
        property.lot = plantFor(property, rng.float(0.85, 1.25));
        property.name = kind === 'studio_lot' ? `${lotNameFor(rng, city.name)} Studios` : `${lotNameFor(rng, city.name)} Stage`;
        const listing: PropertyListing = {
          id: s.nextId('listing'),
          saveId: s.universe.meta.id,
          propertyId: property.id,
          askingPrice: Math.round(property.marketValue * rng.float(0.97, 1.08)),
          status: 'active',
          listedAt: s.now,
          daysOnMarket: 0,
          sellerMotivation: rng.int(30, 70),
          viewedByPlayer: false,
        };
        s.universe.propertyListings[listing.id] = listing;
        ids.push(listing.id);
      }
      s.emit('prop.lots_listed', { cityId, count });
      return { listingIds: ids };
    },
  );

  sim.onCommand<{ propertyId: Id; stageDayRate: Money }, { stageDayRate: Money; marketRate: Money }>(
    'lot.set_rate',
    (p, { sim: s }) => {
      const property = s.universe.properties[p.propertyId];
      if (!property?.lot) throw new CommandError('That is not a lot.');
      if (!ownedByPlayer(s, property)) throw new CommandError('That lot is not yours.');
      if (p.stageDayRate <= 0) throw new CommandError('A rate has to be for money.');
      property.lot.stageDayRate = Math.round(p.stageDayRate);
      return { stageDayRate: property.lot.stageDayRate, marketRate: marketStageRate(property.locationId) };
    },
  );
}

// ---------------------------------------------------------------------------
// The cut
// ---------------------------------------------------------------------------

function sessionNote(focus: string, craft: number, remote: boolean, hours: number): string {
  const strong = craft >= 60;
  const banks: Record<string, [string, string]> = {
    structure: ['Moved a scene forward and the second act stopped sagging.', 'Shuffled the reel and could not say why it was better.'],
    performance: ['Found the take where the lead stops acting and just listens.', 'Watched every take of the argument twice and picked the first one.'],
    pace: ['Lost four minutes nobody will miss.', 'Trimmed frames off the ends of shots and made it feel rushed.'],
    ending: ['Tried the ending without the last line. It plays.', 'Tried three endings and went home with the one you started with.'],
  };
  const [good, poor] = banks[focus] ?? banks.structure!;
  const base = strong ? good : poor;
  if (remote) return `${base} Over a link, with the editor doing the driving.`;
  return hours >= 8 ? `${base} A long day in the dark.` : base;
}

/** What the sessions add at delivery: a few points at most, earned an hour at a time. */
export function sessionLift(task: PostTask): number {
  const total = (task.sessions ?? []).reduce((sum, s) => sum + s.gain, 0);
  return clamp(Math.round(total * 0.8), 0, 12);
}

/** What the house adds at delivery. */
export function houseLift(task: PostTask): number {
  const house = task.houseId ? POST_HOUSE_BY_ID[task.houseId] : undefined;
  return house ? TIER_LIFT[house.tier] : 0;
}

function baseBudgetFor(kind: PostTaskKind, postBudget: Money): Money {
  const shares: Record<PostTaskKind, number> = {
    assembly: 0.04, editors_cut: 0.05, directors_cut: 0.06, studio_notes: 0.01, picture_lock: 0.01,
    vfx: 0.28, adr: 0.03, foley: 0.03, sound_design: 0.06, score: 0.08, music_clearance: 0.04,
    color: 0.05, mix: 0.07, titles: 0.02, subtitles: 0.01, localization: 0.03, qc: 0.01, mastering: 0.02, delivery: 0.01,
    // The tasks that only exist on some pipelines carry their own share.
    story_reel_lock: 0.05, layout: 0.08, animation_final: 0.30, lighting_render: 0.16,
    transcription: 0.03, archive_clearance: 0.09, legal_review: 0.03,
  };
  return Math.round(postBudget * shares[kind]);
}

function armPostTick(sim: Simulation, project: Project): void {
  if (sim.timeline.pending().some((i) => i.kind === 'prod.post_tick' && i.refId === project.id)) return;
  sim.schedule({
    at: addDays(sim.now, 7, sim.homeZone),
    kind: 'prod.post_tick',
    label: `${project.title} — Post Progress`,
    category: 'production',
    payload: { projectId: project.id },
    priority: 58,
    refType: 'project', refId: project.id,
  });
}

// ---------------------------------------------------------------------------
// Visual effects
// ---------------------------------------------------------------------------

const HEAVY_GENRES = new Set(['science fiction', 'fantasy', 'superhero', 'action', 'animation', 'adventure', 'disaster']);

/** Counts the shots a script asks for. Every picture has some; cleanup alone is dozens. */
function countShots(sim: Simulation, project: Project, scenes: { pages: number; kind: string; needs: string[] }[], pages: number): VfxPlan {
  let simple = pages * 0.5;
  let medium = 0;
  let hero = 0;
  for (const scene of scenes) {
    const needs = new Set(scene.needs);
    if (needs.has('vfx')) { medium += scene.pages * 4; simple += scene.pages * 3; }
    if (needs.has('creature')) hero += scene.pages * 3;
    if (scene.kind === 'set_piece') { hero += scene.pages * 1.2; medium += scene.pages * 2.5; }
    if (needs.has('crowd')) simple += scene.pages * 2;
    if (needs.has('water')) medium += scene.pages * 2;
    if (needs.has('weapons')) simple += scene.pages * 1;
    if (needs.has('practical_effects')) simple += scene.pages * 1;
  }
  const heavy = project.genres.some((g) => HEAVY_GENRES.has(g)) ? 1.5 : 1;
  const mix = { simple: Math.max(20, Math.round(simple * heavy)), medium: Math.round(medium * heavy), hero: Math.round(hero * heavy) };
  void sim;
  return { shots: mix.simple + mix.medium + mix.hero, mix, bids: [], brokenDownAt: sim.now };
}

function bidFor(sim: Simulation, project: Project, house: PostHouse, plan: VfxPlan): VfxBid {
  const rng = sim.rng('vfx_bid', project.id, house.id);
  const rate = HOUSE_RATE_CALIBRATION[house.tier].vfxShot;
  const weighted = plan.mix.simple * SHOT_WEIGHT.simple + plan.mix.medium * SHOT_WEIGHT.medium + plan.mix.hero * SHOT_WEIGHT.hero;
  const load = rng.float(0.92, 1.22);
  const amount = Math.round(weighted * rate * load * costOfLiving(house.cityId));
  const weeks = clamp(Math.round(plan.shots / TIER_VFX_WEEKLY[house.tier]) + 6, 8, 60);
  const overloaded = weeks > 40;
  const expectedQuality = clamp(Math.round(TIER_VFX_BASE[house.tier] + rng.normal(0, 3) - (overloaded ? 3 : 0) + (plan.mix.hero > 40 && house.services.includes('creature') ? 2 : 0)), 40, 98);
  const notes = [
    `${house.name} can start in ${rng.int(2, 6)} weeks and wants the hero work through ${house.where}.`,
    `${house.name} bid the whole show; they would split the cleanup to ${house.alsoIn?.[0] ?? 'a second facility'} to hold the schedule.`,
    `${house.name} priced the ${plan.mix.hero} hero shots as the risk and the rest as volume.`,
    `${house.name} asked for the previs early. Their number assumes it.`,
    `${house.name}’s number is ${load > 1.1 ? 'high; they are busy' : 'keen; they want the credit'}.`,
  ];
  return { houseId: house.id, amount, weeks, expectedQuality, note: notes[rng.int(0, notes.length - 1)]!, at: sim.now };
}

function bidsArrive(sim: Simulation, projectId: Id, houseIds: string[]): void {
  const project = sim.universe.projects[projectId];
  const plan = project?.vfx;
  if (!project || !plan || plan.awardedHouseId) return;
  const arrived: VfxBid[] = [];
  for (const id of houseIds) {
    const house = POST_HOUSE_BY_ID[id];
    if (!house || plan.bids.some((b) => b.houseId === id)) continue;
    const bid = bidFor(sim, project, house, plan);
    plan.bids.push(bid);
    arrived.push(bid);
  }
  if (arrived.length === 0) return;
  const lines = arrived.map((b) => `${POST_HOUSE_BY_ID[b.houseId]!.name}: ${formatMoneyCompact(b.amount)}, ${b.weeks} weeks.`).join(' ');
  sim.notify({
    category: 'production',
    title: `Effects bids in on ${project.title}`,
    body: `${arrived.length} bid${arrived.length === 1 ? '' : 's'} for ${plan.shots} shots. ${lines}`,
    importance: 64, route: '/workspace/projects', refType: 'project', refId: project.id,
  });
  sim.requireDecision({
    urgency: 60, category: 'business',
    title: `Award the effects on ${project.title}`,
    detail: `${lines} SLATE’s calibrated rates, not real quotes. Award one, or ask more houses.`,
    route: '/workspace/projects',
    refType: 'project', refId: project.id,
  });
  sim.emit('prod.vfx_bids_in', { projectId: project.id, houses: arrived.map((b) => b.houseId) });
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------

function useLabel(use: MusicCue['use']): string {
  return { score: 'Score', source: 'Source music', needle_drop: 'Needle drop', title: 'Main Title', end_credits: 'End credits' }[use];
}

function spotCues(sim: Simulation, project: Project, scenes: { number: string; pages: number; kind: string; purpose: string; setting: string }[], pages: number): MusicCue[] {
  const rng = sim.rng('spotting', project.id);
  const cues: MusicCue[] = [];
  let n = 0;
  // One slot is kept for the end credits, which every picture has.
  const add = (use: MusicCue['use'], minutes: number, description: string) => {
    if (cues.length >= MAX_CUES - 1 && use !== 'end_credits') return;
    n++;
    cues.push({ id: sim.nextId('contract'), number: n, description, use, minutes: Number(minutes.toFixed(1)), status: 'spotted' });
  };
  add('title', 1.8, 'Over the main titles. Sets the picture’s temperature before anyone speaks.');
  let dialogueCount = 0;
  for (const scene of scenes) {
    switch (scene.kind) {
      case 'set_piece': add('score', scene.pages * 0.9 + 0.5, `Scene ${scene.number}, the set piece at ${scene.setting}. Propulsion.`); break;
      case 'action': add('score', scene.pages * 0.8, `Scene ${scene.number}, action at ${scene.setting}.`); break;
      case 'reveal': add('score', scene.pages * 0.7 + 0.3, `Scene ${scene.number}, the reveal. Held, then released.`); break;
      case 'intimate': add('score', scene.pages * 0.6, `Scene ${scene.number}, ${scene.purpose.toLowerCase()}. Restraint.`); break;
      case 'montage': add('needle_drop', 2.5, `Scene ${scene.number}, the montage. A song the audience walks out humming.`); break;
      case 'transition': add('source', 0.8, `Scene ${scene.number}, source music at ${scene.setting}. Something playing in the room.`); break;
      case 'crowd': if (rng.chance(0.5)) add('source', 1.2, `Scene ${scene.number}, the crowd at ${scene.setting}. Whatever is playing there.`); break;
      case 'dialogue':
        dialogueCount++;
        if (dialogueCount % 4 === 0) add('score', 1.2, `Scene ${scene.number}, under the dialogue. Barely there.`);
        break;
      default: break;
    }
  }
  if (scenes.length === 0) {
    const count = Math.max(6, Math.round(pages / 9));
    for (let i = 0; i < count; i++) add(i % 5 === 3 ? 'needle_drop' : 'score', rng.float(0.8, 3), `Cue ${i + 1}. ${i % 5 === 3 ? 'A song.' : 'Score.'}`);
  }
  add('end_credits', 4.5, 'End credits. The last thing they hear.');
  return cues;
}

export function scoreMinutes(cues: MusicCue[]): number {
  return Number(cues.filter((c) => c.use === 'score' && c.status !== 'dropped').reduce((sum, c) => sum + c.minutes, 0).toFixed(1));
}

/**
 * What a rights holder wants for a cue, in cents. SLATE's calibration: the
 * use, the term, the territory, the holder's posture, and what the picture can
 * evidently pay. Asking again raises it; they know you want it.
 */
function wantedFor(
  sim: Simulation, project: Project, cue: MusicCue, posture: 'major' | 'independent',
  term: string, territory: string, asks: number, mfn: boolean, side: 'sync' | 'master',
): Money {
  const rng = sim.rng('music_wanted', project.id, cue.id, side);
  const base = { needle_drop: 60_000_00, title: 90_000_00, end_credits: 70_000_00, source: 15_000_00, score: 0 }[cue.use];
  const postureFactor = posture === 'major' ? 1.5 : 0.9;
  const budgetFactor = clamp(Math.pow(Math.max(1, project.budget) / 30_000_000_00, 0.35), 0.45, 3);
  const termFactor = term === 'perpetuity' ? 1 : term === 'ten_years' ? 0.7 : 0.25;
  const territoryFactor = territory === 'worldwide' ? 1 : 0.6;
  const mfnFactor = mfn ? 1.05 : 1;
  const askFactor = 1 + asks * 0.05;
  return Math.round(base * postureFactor * budgetFactor * termFactor * territoryFactor * mfnFactor * askFactor * rng.float(0.85, 1.2));
}

// ---------------------------------------------------------------------------
// Stages and lots
// ---------------------------------------------------------------------------

/** How many stages a real lot has free in a given month, on SLATE's calibration of how busy it is. */
export function freeStages(sim: Simulation, lot: { id: string; stagesApprox: number; tier: Tier }, at: number): number {
  const parts = zonedParts(at, sim.homeZone);
  const rng = sim.rng('lot_occupancy', lot.id, parts.year, parts.month);
  const occupancy = rng.float(lot.tier === 'flagship' ? 0.7 : 0.55, 0.92);
  return Math.max(1, Math.round(lot.stagesApprox * (1 - occupancy)));
}

export function marketStageRate(cityId: string): Money {
  const lots = lotsIn(cityId);
  const tier: Tier = lots.length > 0 ? lots[0]!.tier : 'mid';
  return Math.round(STAGE_DAY_CALIBRATION[tier] * costOfLiving(cityId));
}

function ownedByPlayer(sim: Simulation, property: Property): boolean {
  if (!property.ownerId) return false;
  if (property.ownerId === sim.player.id) return true;
  const company = sim.universe.companies[property.ownerId];
  return Boolean(company && company.ownerships.some((o) => o.holderId === sim.player.id));
}

function lotNameFor(rng: { pick: <T>(items: readonly T[]) => T }, city: string): string {
  const stems = ['Harbourside', 'Northgate', 'Ironworks', 'Millbank', 'Eastfield', 'Quarry Lane', 'Riverside', 'Foundry', 'Airfield', 'Westway'];
  return rng.pick([`${rng.pick(stems)}`, `${city} ${rng.pick(['East', 'North', 'South', 'West'])}`]);
}

/** The plant on a generated lot: stages from the floor area, rates from the city. */
function plantFor(property: Property, rateFactor: number): StudioPlant {
  const col = costOfLiving(property.locationId);
  const stages = property.kind === 'sound_stage' ? 1 : clamp(Math.round(property.interiorSqft / 22_000), 2, 30);
  const facilities: StudioPlant['facilities'] = property.features.flatMap((f) => {
    const lower = f.toLowerCase();
    if (lower.includes('backlot')) return ['backlot'] as const;
    if (lower.includes('post')) return ['post'] as const;
    if (lower.includes('mill')) return ['workshops'] as const;
    return [];
  });
  return {
    stages,
    largestStageSqft: Math.round((property.interiorSqft / stages) * 1.4),
    stageDayRate: Math.round(STAGE_DAY_CALIBRATION.mid * col * rateFactor),
    monthlyOverhead: Math.round((stages * 18_000_00 + property.interiorSqft * 0.35 * 100) * col),
    facilities: [...new Set([...facilities, 'offices' as const])],
    tenants: [],
    lifetimeIncome: 0,
    lifetimeOverhead: 0,
    occupancy: 0,
  };
}

/** For saves that owned a lot before lots were a business. */
export function plantForLegacyProperty(property: Property): StudioPlant {
  return plantFor(property, 1);
}

function armLotsClose(sim: Simulation): void {
  if (sim.timeline.pending().some((i) => i.kind === 'post.lots_close')) return;
  sim.schedule({ at: addMonths(sim.now, 1, sim.homeZone), kind: 'post.lots_close', label: 'Studio Lots — Month Close', category: 'system', priority: 90 });
}

/** Called once at the start of a save and by migration, so every save has the close on its calendar. */
export function ensureLotsClose(sim: Simulation): void {
  armLotsClose(sim);
}

/**
 * The monthly close on every lot the player owns: overhead out, tenants in
 * and out, income in. World productions in the city rent stages when the rate
 * is competitive and there is room; commercials and pilots fill some of the
 * rest, because that is what lots actually live on.
 */
function closeLots(sim: Simulation): void {
  const lots = Object.values(sim.universe.properties).filter((p) => p.lot && ownedByPlayer(sim, p));
  for (const property of lots) {
    const plant = property.lot!;
    const rng = sim.rng('lot_close', property.id, Math.floor(sim.now / (28 * MS_DAY)));
    const accountId = property.ownerId === sim.player.id ? sim.player.primaryAccountId : sim.universe.companies[property.ownerId!]?.cashAccountId;

    // Out with the finished, in with the new.
    plant.tenants = plant.tenants.filter((t) => t.to > sim.now - 31 * MS_DAY);
    const busyNow = plant.tenants.filter((t) => t.to > sim.now).reduce((sum, t) => sum + t.stages, 0);
    let free = plant.stages - busyNow;
    const market = marketStageRate(property.locationId);
    const priceEdge = clamp(market / Math.max(1, plant.stageDayRate), 0.4, 2.2);

    const city = CITIES.get(property.locationId);
    const candidates = Object.values(sim.universe.projects).filter((p) =>
      !playerControls(sim, p) && (p.phase === 'preproduction' || p.phase === 'production')
      && p.productionLocationIds.includes(property.locationId)
      && !plant.tenants.some((t) => t.projectId === p.id));
    for (const candidate of candidates) {
      if (free <= 0) break;
      const chance = clamp(0.35 * Math.pow(priceEdge, 1.5) * (plant.facilities.includes('backlot') ? 1.15 : 1), 0.05, 0.85);
      if (!rng.chance(chance)) continue;
      const stages = clamp(rng.int(1, 3), 1, free);
      const days = rng.int(20, 60);
      plant.tenants.push({ projectTitle: candidate.title, projectId: candidate.id, stages, from: sim.now, to: sim.now + days * MS_DAY, dayRate: plant.stageDayRate });
      free -= stages;
    }
    const industry = (city?.industryPresence ?? 40) / 100;
    const smallJobs = Math.round(free * industry * clamp(priceEdge, 0.5, 1.5) * rng.float(0.2, 0.7));
    for (let i = 0; i < smallJobs && free > 0; i++) {
      const kind = rng.pick(['A commercial', 'A music video', 'A series pilot', 'A photo shoot', 'A streaming special']);
      const days = rng.int(2, 12);
      plant.tenants.push({ projectTitle: kind, stages: 1, from: sim.now, to: sim.now + days * MS_DAY, dayRate: plant.stageDayRate });
      free -= 1;
    }

    // The month's money: what the tenants owe for the days inside it.
    const monthStart = sim.now - 30 * MS_DAY;
    let income = 0;
    let stageDays = 0;
    for (const tenant of plant.tenants) {
      const overlap = Math.max(0, Math.min(tenant.to, sim.now) - Math.max(tenant.from, monthStart));
      const days = Math.min(WORKING_DAYS, Math.round(overlap / MS_DAY * (WORKING_DAYS / 30)));
      stageDays += days * tenant.stages;
      income += days * tenant.stages * tenant.dayRate;
    }
    plant.occupancy = Number(clamp(stageDays / Math.max(1, plant.stages * WORKING_DAYS), 0, 1).toFixed(2));

    if (accountId) {
      if (income > 0) {
        sim.income(accountId, income, `${property.name} — stage hire`, 'rental', { refType: 'property', refId: property.id });
        plant.lifetimeIncome += income;
      }
      const available = sim.ledger.availableFunds(accountId);
      const overhead = Math.min(plant.monthlyOverhead, available);
      if (overhead > 0) {
        sim.expense(accountId, overhead, `${property.name} — lot overhead`, 'property', { refType: 'property', refId: property.id });
        plant.lifetimeOverhead += overhead;
      }
      if (overhead < plant.monthlyOverhead) {
        property.condition = clamp(property.condition - 4, 0, 100);
        sim.requireDecision({
          urgency: 72, category: 'property',
          title: `${property.name} cannot pay its overhead`,
          detail: `${formatMoney(plant.monthlyOverhead - overhead)} short this month. The stages are going unmaintained.`,
          route: '/workspace/property', refType: 'property', refId: property.id,
        });
      }
    }
    plant.lastClosedAt = sim.now;
    sim.notify({
      category: 'property',
      title: `${property.name}: month closed`,
      body: `${Math.round(plant.occupancy * 100)}% of stage days let. ${formatMoneyCompact(income)} in, ${formatMoneyCompact(plant.monthlyOverhead)} out.${plant.tenants.filter((t) => t.to > sim.now).length > 0 ? ` On the lot: ${plant.tenants.filter((t) => t.to > sim.now).map((t) => t.projectTitle).slice(0, 4).join(', ')}.` : ''}`,
      importance: 48, route: '/workspace/property', refType: 'property', refId: property.id,
    });
    sim.emit('lot.month_closed', { propertyId: property.id, income, overhead: plant.monthlyOverhead, occupancy: plant.occupancy });
  }
}

/** For the UI: everything post on a picture, in one read. */
export function postDossier(sim: Simulation, projectId: Id) {
  const project = sim.universe.projects[projectId];
  if (!project) return undefined;
  const tasks = project.postTaskIds.map((id) => sim.universe.postTasks[id]).filter((t): t is PostTask => Boolean(t));
  return {
    cutting: CUTTING_ORDER.map((kind) => tasks.find((t) => t.kind === kind)).filter((t): t is PostTask => Boolean(t)),
    vfx: project.vfx,
    music: project.music,
    bookings: project.stageBookings ?? [],
    houseFor: (kind: PostTaskKind) => {
      const task = tasks.find((t) => t.kind === kind);
      return task?.houseId ? POST_HOUSE_BY_ID[task.houseId] : undefined;
    },
    lotFree: (lotId: string, at: number) => {
      const lot = STUDIO_LOT_BY_ID[lotId];
      return lot ? freeStages(sim, lot, at) : 0;
    },
  };
}

void formatDate; void remap;
