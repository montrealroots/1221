/**
 * SLATE — Pre-production, principal photography and post.
 *
 * Clicking "shoot" does not complete a film. A schedule is built, days are
 * placed on the calendar, and each day is worked: cast have to be available and
 * in the right city, pages get covered or they do not, incidents cost money and
 * time, and what does not get shot rolls over.
 *
 * Post is a dependency graph. You cannot colour a picture that is not locked.
 */

import { shootDayWeather } from './weather';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, PostTask, PostTaskKind, Project, ShootDay } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, formatDate, instantFromZoned, zonedParts, MS_DAY, MS_HOUR } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { costOfLiving, filmIncentive } from '../content/tax';
import { advancePhase, computeFinalQuality, phaseIndex } from './film';
import { readiness } from './life';
import { systemModifier } from '../domain/attributes';

// ---------------------------------------------------------------------------
// Post-production dependency graph
// ---------------------------------------------------------------------------

interface PostSpec {
  kind: PostTaskKind;
  name: string;
  dependsOn: PostTaskKind[];
  budgetShare: number;
  days: number;
  /** How much this task contributes to the finished film. */
  qualityWeight: number;
}

export const POST_TASKS: readonly PostSpec[] = [
  { kind: 'assembly', name: 'Assembly cut', dependsOn: [], budgetShare: 0.04, days: 21, qualityWeight: 0.6 },
  { kind: 'editors_cut', name: "Editor's cut", dependsOn: ['assembly'], budgetShare: 0.05, days: 28, qualityWeight: 1.0 },
  { kind: 'directors_cut', name: "Director's cut", dependsOn: ['editors_cut'], budgetShare: 0.06, days: 42, qualityWeight: 1.4 },
  { kind: 'studio_notes', name: 'Studio and producer notes', dependsOn: ['directors_cut'], budgetShare: 0.01, days: 18, qualityWeight: 0.5 },
  { kind: 'picture_lock', name: 'Picture lock', dependsOn: ['studio_notes'], budgetShare: 0.01, days: 10, qualityWeight: 0.4 },
  // Everything below needs a locked picture, which is the point of the gate.
  { kind: 'vfx', name: 'Visual effects', dependsOn: ['picture_lock'], budgetShare: 0.28, days: 120, qualityWeight: 1.2 },
  { kind: 'adr', name: 'ADR', dependsOn: ['picture_lock'], budgetShare: 0.03, days: 20, qualityWeight: 0.5 },
  { kind: 'foley', name: 'Foley', dependsOn: ['picture_lock'], budgetShare: 0.03, days: 25, qualityWeight: 0.5 },
  { kind: 'sound_design', name: 'Sound design', dependsOn: ['picture_lock'], budgetShare: 0.06, days: 40, qualityWeight: 0.9 },
  { kind: 'score', name: 'Score', dependsOn: ['picture_lock'], budgetShare: 0.08, days: 50, qualityWeight: 1.1 },
  { kind: 'music_clearance', name: 'Music clearance', dependsOn: ['picture_lock'], budgetShare: 0.04, days: 45, qualityWeight: 0.2 },
  { kind: 'color', name: 'Colour grade', dependsOn: ['picture_lock', 'vfx'], budgetShare: 0.05, days: 25, qualityWeight: 0.9 },
  { kind: 'mix', name: 'Final mix', dependsOn: ['adr', 'foley', 'sound_design', 'score', 'music_clearance'], budgetShare: 0.07, days: 22, qualityWeight: 1.0 },
  { kind: 'titles', name: 'Titles and credits', dependsOn: ['picture_lock'], budgetShare: 0.02, days: 18, qualityWeight: 0.3 },
  { kind: 'subtitles', name: 'Subtitles and captions', dependsOn: ['mix'], budgetShare: 0.01, days: 12, qualityWeight: 0.1 },
  { kind: 'localization', name: 'Localisation', dependsOn: ['mix'], budgetShare: 0.03, days: 30, qualityWeight: 0.2 },
  { kind: 'qc', name: 'Quality control', dependsOn: ['color', 'mix', 'titles'], budgetShare: 0.01, days: 10, qualityWeight: 0.3 },
  { kind: 'mastering', name: 'Mastering', dependsOn: ['qc'], budgetShare: 0.02, days: 12, qualityWeight: 0.3 },
  { kind: 'delivery', name: 'Delivery', dependsOn: ['mastering', 'subtitles'], budgetShare: 0.01, days: 8, qualityWeight: 0.2 },
];

export const POST_SPEC_BY_KIND: Readonly<Record<string, PostSpec>> =
  Object.fromEntries(POST_TASKS.map((t) => [t.kind, t]));

/** Tasks that cannot begin because something upstream is unfinished. */
export function blockedReasons(sim: Simulation, taskId: Id): string[] {
  const task = sim.universe.postTasks[taskId];
  if (!task) return [];
  const siblings = Object.values(sim.universe.postTasks).filter((t) => t.projectId === task.projectId);
  const reasons: string[] = [];
  for (const dep of task.dependsOn) {
    const upstream = siblings.find((t) => t.kind === dep);
    if (upstream && upstream.status !== 'complete') {
      reasons.push(`${POST_SPEC_BY_KIND[dep]?.name ?? dep} is not finished.`);
    }
  }
  return reasons;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerProduction(sim: Simulation): void {
  sim.onSchedule('prod.shoot_day', (item) => shootDay(sim, item.payload.shootDayId as Id));
  sim.onSchedule('prod.post_tick', (item) => advancePost(sim, item.payload.projectId as Id));
  sim.onSchedule('prod.wrap', (item) => wrapProduction(sim, item.payload.projectId as Id));
  sim.onSchedule('prod.incentive_payout', (item) => payIncentive(sim, item.payload.projectId as Id));

  // --- Pre-production ------------------------------------------------------

  sim.onCommand<{ projectId: Id; startAt: number; shootDays?: number; locationId?: string; sixDayWeek?: boolean }, { scheduledDays: number; wrapsAt: number; dailyBudget: Money }>(
    'prod.build_schedule',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!project.greenlitAt) throw new CommandError(`${project.title} is not greenlit. There is nothing to schedule.`);
      if (project.shootDayIds.length > 0) throw new CommandError('That project already has a shooting schedule.');
      if (p.startAt <= s.now) throw new CommandError('Principal photography has to start in the future.');

      // You cannot shoot without money in the production account.
      const funded = project.financingIds.reduce((sum, id) => sum + (s.ledger.tryAccount(id)?.balance ?? 0), 0);
      if (funded < project.budget * 0.35) {
        throw new CommandError(
          `Only ${formatMoneyCompact(funded)} is in the production account against a ${formatMoneyCompact(project.budget)} budget. Close the financing gap before you board a schedule.`,
        );
      }

      const draft = project.currentDraftId ? s.universe.scriptDrafts[project.currentDraftId] : undefined;
      const pages = draft?.pages ?? 100;
      const locationId = p.locationId ?? project.productionLocationIds[0] ?? 'us-ca-losangeles';
      if (!project.productionLocationIds.includes(locationId)) project.productionLocationIds.push(locationId);

      // Pace: a first AD who knows what they are doing gets more pages a day.
      const director = project.directorId ? s.universe.people[project.directorId] : undefined;
      const efficiency = director
        ? remap((director.skills['shot_efficiency'] ?? 25) + (director.skills['coverage_planning'] ?? 25), 0, 200, 0.7, 1.35)
        : 0.85;
      const pagesPerDay = clamp(2.4 * efficiency, 1.1, 5.5);
      const dayCount = p.shootDays ?? Math.max(6, Math.ceil(pages / pagesPerDay));

      const roles = Object.values(s.universe.roles).filter((r) => r.projectId === project.id);
      const castIds = roles.filter((r) => r.castPersonId).map((r) => r.castPersonId as Id);
      const openLeads = roles.filter((r) => r.billing === 'lead' && r.status !== 'cast');
      if (openLeads.length > 0) {
        throw new CommandError(
          `${openLeads.length} lead role${openLeads.length === 1 ? ' is' : 's are'} still uncast. You cannot board a schedule without your leads.`,
        );
      }

      // 70% of budget is above and below the line spend across shooting days.
      const productionBudget = Math.round(project.budget * 0.62);
      const dailyBudget = Math.round(productionBudget / dayCount);

      const workDays = p.sixDayWeek ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
      let cursor = p.startAt;
      let placed = 0;
      let guard = 0;

      while (placed < dayCount && guard++ < dayCount * 4 + 60) {
        const parts = zonedParts(cursor, s.homeZone);
        if (!workDays.includes(parts.weekday)) {
          cursor = addDays(cursor, 1, s.homeZone);
          continue;
        }
        placed++;
        const callTime = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: 6 }, s.homeZone);
        const scenes = buildSceneList(s, project, placed, pagesPerDay, castIds);

        const day: ShootDay = {
          id: s.nextId('shootday'),
          saveId: s.universe.meta.id,
          projectId: project.id,
          dayNumber: placed,
          date: callTime,
          callTime,
          wrapTargetTime: callTime + 12 * MS_HOUR,
          locationId,
          locationName: placed % 3 === 0 ? 'Stage 4' : `${CITIES.require(locationId).name} location`,
          isStage: placed % 3 === 0,
          scenes,
          plannedPages: scenes.reduce((sum, sc) => sum + sc.pages, 0),
          completedPages: 0,
          requiredCastIds: [...new Set(scenes.flatMap((sc) => sc.castIds))],
          crewCount: clamp(Math.round(remap(project.budget, 1_000_000_00, 200_000_000_00, 22, 260)), 12, 400),
          dailyBudget,
          actualCost: 0,
          status: 'scheduled',
          incidents: [],
          overtimeMinutes: 0,
        };
        s.universe.shootDays[day.id] = day;
        project.shootDayIds.push(day.id);

        const item = s.schedule({
          at: callTime,
          kind: 'prod.shoot_day',
          label: `${project.title} — Day ${placed} of ${dayCount}`,
          category: 'production',
          payload: { shootDayId: day.id },
          priority: 18,
          refType: 'project', refId: project.id,
          requiresPlayer: castIds.includes(s.player.id) || project.directorId === s.player.id,
          locationId,
          durationMinutes: 720,
        });
        day.scheduledItemId = item.id;

        cursor = addDays(cursor, 1, s.homeZone);
      }

      project.scheduledShootDays = placed;
      project.productionStartAt = p.startAt;
      project.productionEndAt = cursor;
      advancePhase(s, project, 'preproduction');

      s.schedule({
        at: addDays(cursor, 2, s.homeZone),
        kind: 'prod.wrap',
        label: `${project.title} — wrap`,
        category: 'production',
        payload: { projectId: project.id },
        priority: 20,
        refType: 'project', refId: project.id,
      });

      s.remember({
        category: 'project',
        title: `${project.title} boarded a schedule`,
        detail: `${placed} shooting days in ${CITIES.require(locationId).name}, starting ${formatDate(p.startAt, s.homeZone)}. ${formatMoney(dailyBudget)} a day.`,
        refs: [{ type: 'project', id: project.id }],
        significance: 55, public: false,
      });
      s.emit('prod.schedule_built', { projectId: project.id, days: placed, locationId, dailyBudget });
      return { scheduledDays: placed, wrapsAt: cursor, dailyBudget };
    },
  );

  sim.onCommand<{ projectId: Id }, { started: boolean }>(
    'prod.start_photography',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (project.shootDayIds.length === 0) throw new CommandError('There is no schedule to start.');
      advancePhase(s, project, 'production');
      s.emit('prod.photography_started', { projectId: project.id });
      return { started: true };
    },
  );

  // --- Post ---------------------------------------------------------------

  sim.onCommand<{ projectId: Id }, { taskCount: number }>(
    'prod.open_post',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (project.postTaskIds.length > 0) throw new CommandError('Post is already open on that project.');
      if (project.completedShootDays === 0) throw new CommandError('You cannot cut a film that has not been shot.');
      openPost(s, project.id);
      return { taskCount: project.postTaskIds.length };
    },
  );

  sim.onCommand<{ taskId: Id; vendorName?: string; extraBudget?: Money }, { started: boolean; blockedBy?: string[] }>(
    'prod.start_post_task',
    (p, { sim: s }) => {
      const task = s.universe.postTasks[p.taskId];
      if (!task) throw new CommandError('No such post task.');
      if (task.status === 'complete') throw new CommandError(`${task.name} is already finished.`);
      if (task.status === 'in_progress') throw new CommandError(`${task.name} is already under way.`);

      const blocked = blockedReasons(s, task.id);
      if (blocked.length > 0) {
        throw new CommandError(`${task.name} cannot start yet. ${blocked.join(' ')}`);
      }

      task.status = 'in_progress';
      task.startedAt = s.now;
      task.vendorName = p.vendorName ?? defaultVendor(task.kind);
      if (p.extraBudget) task.budgeted += p.extraBudget;

      const project = s.universe.projects[task.projectId];
      if (project && !s.timeline.pending().some((i) => i.kind === 'prod.post_tick' && i.refId === project.id)) {
        s.schedule({
          at: addDays(s.now, 7, s.homeZone),
          kind: 'prod.post_tick',
          label: `${project.title} — post progress`,
          category: 'production',
          payload: { projectId: project.id },
          priority: 58,
          refType: 'project', refId: project.id,
        });
      }
      s.emit('prod.post_task_started', { taskId: task.id, projectId: task.projectId, kind: task.kind });
      return { started: true };
    },
  );

  sim.onCommand<{ projectId: Id; audienceSize?: number }, { score: number; notes: string[] }>(
    'prod.test_screening',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const lockTask = Object.values(s.universe.postTasks).find((t) => t.projectId === project.id && t.kind === 'directors_cut');
      if (!lockTask || lockTask.status !== 'complete') {
        throw new CommandError('You need a director’s cut before you can put it in front of an audience.');
      }

      const rng = s.rng('test_screening', project.id, s.now);
      const quality = computeFinalQuality(s, project);
      const audience = p.audienceSize ?? 300;

      const accountId = project.financingIds[0];
      const cost = Math.round(48_000_00 * costOfLiving(project.productionLocationIds[0] ?? 'us-ca-losangeles'));
      if (accountId && s.ledger.availableFunds(accountId) >= cost) {
        s.expense(accountId, cost, `${project.title} — test screening`, 'production', { refType: 'project', refId: project.id });
        project.spent += cost;
      }

      // Test audiences are noisy and skew positive on spectacle.
      const spectacle = project.genres.some((g) => ['action', 'adventure', 'science fiction', 'fantasy'].includes(g)) ? 6 : 0;
      const score = clamp(Math.round(quality + spectacle + rng.normal(0, 7)), 0, 100);

      const notes: string[] = [];
      if (score < 55) notes.push('The third act is losing people.');
      if (score < 45) notes.push('Audiences do not like the ending as it stands.');
      if (quality < 60) notes.push('The lead is not landing with the under-35 group.');
      if (project.genres.includes('comedy') && score < 65) notes.push('Not enough laughs in the middle forty minutes.');
      if (score >= 75) notes.push('Strong recommend scores. Do not touch it.');
      if (notes.length === 0) notes.push('Solid across the board with no clear weak spot.');

      s.audit({
        kind: 'prod.test_screening', subjectType: 'project', subjectId: project.id,
        question: 'What did the test audience say?',
        summary: `${score} out of 100 with ${audience} recruited viewers.`,
        factors: [
          { label: 'The Cut As It Stands', detail: `Assembled quality reads ${quality} out of 100.`, weight: 0.8, contribution: quality * 0.8, knowable: true },
          { label: 'Audience Composition', detail: 'Who the recruiters actually put in the room.', weight: 0.2, contribution: 0, knowable: false },
        ],
        score,
        outcome: score >= 70 ? 'strong' : score >= 55 ? 'mixed' : 'weak',
      });

      if (score < 58) {
        s.requireDecision({
          urgency: 76, category: 'business',
          title: `${project.title} tested at ${score}`,
          detail: `${notes.join(' ')} Reshoots would cost time and money and might fix it.`,
          route: '/workspace/projects',
          actions: [{ label: 'Order Reshoots', commandKind: 'prod.order_reshoots', payload: { projectId: project.id, days: 4 } }],
          refType: 'project', refId: project.id,
        });
      }
      advancePhase(s, project, 'testing');
      s.emit('prod.tested', { projectId: project.id, score, notes });
      return { score, notes };
    },
  );

  sim.onCommand<{ projectId: Id; days: number }, { cost: Money; newQuality: number }>(
    'prod.order_reshoots',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const days = clamp(Math.round(p.days), 1, 30);

      const accountId = project.financingIds[0];
      const dailyRate = Math.round(project.budget * 0.62 / Math.max(1, project.scheduledShootDays) * 1.35);
      const cost = dailyRate * days;
      if (!accountId || s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`Reshoots at ${formatMoney(dailyRate)} a day for ${days} days come to ${formatMoney(cost)}, which the production account cannot cover.`);
      }
      s.expense(accountId, cost, `${project.title} — additional photography`, 'production', { refType: 'project', refId: project.id });
      project.spent += cost;

      // Reshoots reopen picture lock, which pushes everything downstream.
      const tasks = Object.values(s.universe.postTasks).filter((t) => t.projectId === project.id);
      const reopened: string[] = [];
      for (const task of tasks) {
        if (['picture_lock', 'color', 'mix', 'qc', 'mastering', 'delivery'].includes(task.kind) && task.status === 'complete') {
          task.status = 'ready';
          task.completedAt = undefined;
          task.elapsedDays = Math.round(task.plannedDays * 0.4);
          task.notes.push({ at: s.now, note: 'Reopened for additional photography.' });
          reopened.push(task.name);
        }
      }

      const rng = s.rng('reshoots', project.id, days);
      const editorial = tasks.find((t) => t.kind === 'directors_cut');
      if (editorial) {
        editorial.quality = clamp(editorial.quality + rng.float(3, 12) * remap(days, 1, 12, 0.6, 1.4), 0, 100);
        editorial.notes.push({ at: s.now, note: `${days} days of additional photography incorporated.` });
      }

      const newQuality = computeFinalQuality(s, project);
      s.remember({
        category: 'project',
        title: `Reshoots on ${project.title}`,
        detail: `${days} days at ${formatMoney(cost)}.${reopened.length > 0 ? ` Reopened ${reopened.join(', ')}.` : ''}`,
        refs: [{ type: 'project', id: project.id }],
        significance: 40, public: false, amount: cost,
      });
      s.emit('prod.reshoots_ordered', { projectId: project.id, days, cost, reopened });
      return { cost, newQuality };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

function buildSceneList(
  sim: Simulation, project: Project, dayNumber: number, pagesPerDay: number, castIds: Id[],
): ShootDay['scenes'] {
  const rng = sim.rng('scenes', project.id, dayNumber);
  const sceneCount = rng.int(2, 6);
  const scenes: ShootDay['scenes'] = [];
  let remaining = pagesPerDay;

  for (let i = 0; i < sceneCount && remaining > 0.2; i++) {
    const pages = Number(Math.min(remaining, rng.float(0.3, 2.2)).toFixed(1));
    remaining -= pages;
    const inScene = castIds.length > 0
      ? rng.shuffle(castIds).slice(0, rng.int(1, Math.min(4, castIds.length)))
      : [];
    scenes.push({
      sceneNumber: `${dayNumber}${String.fromCharCode(65 + i)}`,
      pages,
      description: rng.pick([
        'Interior, day. Dialogue.',
        'Exterior, night. Movement.',
        'Interior, night. Two-hander.',
        'Exterior, day. Wide coverage.',
        'Interior, day. Ensemble.',
        'Exterior, dusk. Action beat.',
      ]),
      castIds: inScene,
      shot: false,
    });
  }
  return scenes;
}

function shootDay(sim: Simulation, shootDayId: Id): void {
  const day = sim.universe.shootDays[shootDayId];
  if (!day || day.status !== 'scheduled') return;
  const project = sim.universe.projects[day.projectId];
  if (!project) return;

  if (phaseIndex(project.phase) < phaseIndex('production')) {
    advancePhase(sim, project, 'production');
  }

  day.status = 'shooting';
  const rng = sim.rng('shoot_day', day.id);

  // Availability. If a required actor is not in the city, the day is affected.
  const missing = day.requiredCastIds.filter((id) => {
    const person = sim.universe.people[id];
    return person && person.currentLocationId !== day.locationId;
  });

  if (missing.length > 0 && missing.length === day.requiredCastIds.length) {
    day.status = 'incomplete';
    const lostCost = Math.round(day.dailyBudget * 0.55);
    day.actualCost = lostCost;
    day.incidents.push({
      at: sim.now, kind: 'cast_unavailable',
      description: `${missing.map((id) => sim.universe.people[id]?.displayName ?? 'A cast member').join(', ')} not on location. Day lost.`,
      costDelta: lostCost, timeDeltaMinutes: 0,
    });
    chargeProduction(sim, project, lostCost, `${project.title} — Day ${day.dayNumber} (lost)`);
    sim.notify({
      category: 'production',
      title: `Lost a day on ${project.title}`,
      body: `Day ${day.dayNumber} could not be shot. ${formatMoney(lostCost)} spent for nothing.`,
      importance: 78, route: '/workspace/projects',
    });
    sim.emit('prod.day_lost', { projectId: project.id, shootDayId: day.id, reason: 'cast_unavailable' });
    return;
  }

  // How well the day goes.
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const directorFactor = director
    ? remap((director.skills['shot_efficiency'] ?? 25), 0, 100, 0.72, 1.28) * (director.isPlayer ? remap(readiness(director), 0, 100, 0.75, 1.12) : 1)
    : 0.85;

  const castPresent = day.requiredCastIds.filter((id) => !missing.includes(id));
  const castFactor = castPresent.length > 0
    ? castPresent.reduce((s, id) => {
        const person = sim.universe.people[id];
        if (!person) return s + 0.9;
        const consistency = (person.attributes['take_consistency'] ?? 45) / 100;
        const professionalism = (person.attributes['punctuality'] ?? 55) / 100;
        const ready = person.isPlayer ? readiness(person) / 100 : 0.85;
        const friction = systemModifier(person.traits, 'crewFriction');
        return s + (0.5 + consistency * 0.25 + professionalism * 0.15 + ready * 0.2) / friction;
      }, 0) / castPresent.length
    : 0.9;

  // Not a coin flip: the weather that day, at that location.
  const sky = shootDayWeather(sim, day.locationId, sim.now, day.isStage);
  const weatherPenalty = sky.factor;
  const efficiency = clamp(directorFactor * castFactor * weatherPenalty * rng.float(0.82, 1.14), 0.25, 1.5);

  day.completedPages = Number(Math.min(day.plannedPages, day.plannedPages * efficiency).toFixed(1));
  for (const scene of day.scenes) {
    scene.shot = day.completedPages >= day.plannedPages * 0.9 || rng.chance(efficiency);
  }

  // Overtime when the day runs long, which it usually does.
  const overrun = efficiency < 1 ? Math.round((1 - efficiency) * 220) : 0;
  day.overtimeMinutes = overrun;
  day.actualWrapTime = day.wrapTargetTime + overrun * 60_000;

  let cost = day.dailyBudget;
  if (overrun > 0) {
    const overtimeCost = Math.round(day.dailyBudget * (overrun / 720) * 1.6);
    cost += overtimeCost;
    day.incidents.push({
      at: sim.now, kind: 'overtime',
      description: `Ran ${Math.round(overrun / 60)} hours over. Crew on penalty rate.`,
      costDelta: overtimeCost, timeDeltaMinutes: overrun,
    });
  }

  if (missing.length > 0) {
    day.incidents.push({
      at: sim.now, kind: 'partial_cast',
      description: `${missing.length} cast member${missing.length === 1 ? '' : 's'} unavailable. Scenes rescheduled.`,
      costDelta: 0, timeDeltaMinutes: 60,
    });
  }
  if (weatherPenalty < 1) {
    day.incidents.push({
      at: sim.now, kind: 'weather',
      description: sky.note ?? 'Weather stopped exterior work.',
      costDelta: 0, timeDeltaMinutes: Math.round((1 - weatherPenalty) * 300),
    });
  }

  // Occasional real incidents.
  if (rng.chance(0.06)) {
    const incidentCost = Math.round(day.dailyBudget * rng.float(0.1, 0.6));
    const kinds = [
      'Camera package failure. Replacement couriered in.',
      'Location permit challenged. Company moved.',
      'Minor injury on set. Work stopped for the safety meeting.',
      'Equipment truck delayed. Late start.',
    ];
    cost += incidentCost;
    day.incidents.push({ at: sim.now, kind: 'incident', description: rng.pick(kinds), costDelta: incidentCost, timeDeltaMinutes: rng.int(45, 180) });
  }

  day.actualCost = cost;
  day.footageQuality = clamp(Math.round(
    (project.scriptQuality * 0.3 + (director ? (director.skills['visual_language'] ?? 25) : 30) * 0.3 + castFactor * 100 * 0.25) * efficiency + rng.normal(0, 6),
  ), 0, 100);
  day.status = day.completedPages >= day.plannedPages * 0.85 ? 'complete' : 'incomplete';

  chargeProduction(sim, project, cost, `${project.title} — Day ${day.dayNumber}`);
  project.completedShootDays += 1;

  // Everyone on set pays for it physically.
  for (const id of castPresent) {
    const person = sim.universe.people[id];
    if (!person) continue;
    const stress = systemModifier(person.traits, 'stressPerShootDay');
    person.wellbeing.energy = clamp(person.wellbeing.energy - 34 * stress, 0, 100);
    person.wellbeing.stress = clamp(person.wellbeing.stress + 7 * stress, 0, 100);
    person.wellbeing.sleepDebt = Math.min(60, person.wellbeing.sleepDebt + 1.6);
    if (person.isPlayer) {
      person.attributes['long_day_endurance'] = clamp((person.attributes['long_day_endurance'] ?? 40) + 0.35, 0, 100);
      person.attributes['take_consistency'] = clamp((person.attributes['take_consistency'] ?? 40) + 0.25, 0, 100);
      person.attributes['set_etiquette'] = clamp((person.attributes['set_etiquette'] ?? 40) + 0.2, 0, 100);
    }
  }
  if (director?.isPlayer) {
    director.wellbeing.energy = clamp(director.wellbeing.energy - 40, 0, 100);
    director.wellbeing.stress = clamp(director.wellbeing.stress + 9, 0, 100);
    director.skills['set_authority'] = clamp((director.skills['set_authority'] ?? 25) + 0.4, 0, 100);
  }

  // Budget alarm.
  const spentSoFar = project.shootDayIds.reduce((s, id) => s + (sim.universe.shootDays[id]?.actualCost ?? 0), 0);
  const expectedByNow = day.dailyBudget * day.dayNumber;
  if (spentSoFar > expectedByNow * 1.12 && day.dayNumber % 5 === 0) {
    sim.requireDecision({
      urgency: 72, category: 'business',
      title: `${project.title} is running over`,
      detail: `${formatMoneyCompact(spentSoFar)} spent against ${formatMoneyCompact(expectedByNow)} planned by day ${day.dayNumber}. The contingency is being consumed.`,
      route: '/workspace/projects',
      refType: 'project', refId: project.id,
    });
  }

  sim.emit('prod.day_shot', {
    projectId: project.id, shootDayId: day.id, dayNumber: day.dayNumber,
    pages: day.completedPages, cost, quality: day.footageQuality, overtimeMinutes: overrun,
  });
}

function chargeProduction(sim: Simulation, project: Project, amount: Money, memo: string): void {
  const accountId = project.financingIds.find((id) => (sim.ledger.tryAccount(id)?.balance ?? 0) > 0) ?? project.financingIds[0];
  if (!accountId) return;
  const available = sim.ledger.availableFunds(accountId);
  const charged = Math.min(amount, available);
  if (charged > 0) {
    sim.expense(accountId, charged, memo, 'production', { refType: 'project', refId: project.id });
    project.spent += charged;
  }
  if (charged < amount) {
    sim.requireDecision({
      urgency: 94, category: 'business',
      title: `${project.title} has run out of money`,
      detail: `${formatMoney(amount - charged)} of today's costs could not be paid. Production stops until the shortfall is funded.`,
      route: '/workspace/projects',
      refType: 'project', refId: project.id,
    });
  }
}

function wrapProduction(sim: Simulation, projectId: Id): void {
  const project = sim.universe.projects[projectId];
  if (!project) return;
  const days = project.shootDayIds.map((id) => sim.universe.shootDays[id]).filter(Boolean) as ShootDay[];
  const shot = days.filter((d) => d.status === 'complete' || d.status === 'incomplete');
  if (shot.length === 0) return;

  const totalCost = days.reduce((s, d) => s + d.actualCost, 0);
  const overBudget = totalCost - days.reduce((s, d) => s + d.dailyBudget, 0);

  sim.remember({
    category: 'project',
    title: `${project.title} wrapped`,
    detail: `${shot.length} days shot. ${formatMoneyCompact(totalCost)} spent${overBudget > 0 ? `, ${formatMoneyCompact(overBudget)} over` : ', on budget'}.`,
    refs: [{ type: 'project', id: project.id }],
    significance: 68, public: true, amount: totalCost,
  });
  sim.notify({
    category: 'production', title: `${project.title} has wrapped`,
    body: `${shot.length} shooting days complete. Post can open.`,
    importance: 76, route: '/workspace/projects',
  });

  openPost(sim, project.id);
  scheduleIncentive(sim, project);
  sim.emit('prod.wrapped', { projectId: project.id, days: shot.length, totalCost, overBudget });
}

export function openPost(sim: Simulation, projectId: Id): void {
  const project = sim.universe.projects[projectId];
  if (!project || project.postTaskIds.length > 0) return;

  const postBudget = Math.round(project.budget * 0.30);
  for (const spec of POST_TASKS) {
    const task: PostTask = {
      id: sim.nextId('posttask'),
      saveId: sim.universe.meta.id,
      projectId: project.id,
      kind: spec.kind,
      name: spec.name,
      dependsOn: spec.dependsOn,
      status: spec.dependsOn.length === 0 ? 'ready' : 'blocked',
      budgeted: Math.round(postBudget * spec.budgetShare),
      spent: 0,
      plannedDays: spec.days,
      elapsedDays: 0,
      quality: 0,
      notes: [],
    };
    sim.universe.postTasks[task.id] = task;
    project.postTaskIds.push(task.id);
  }

  advancePhase(sim, project, 'post');
  sim.schedule({
    at: addDays(sim.now, 7, sim.homeZone),
    kind: 'prod.post_tick',
    label: `${project.title} — post progress`,
    category: 'production',
    payload: { projectId: project.id },
    priority: 58,
    refType: 'project', refId: project.id,
  });
  sim.emit('prod.post_opened', { projectId: project.id, tasks: project.postTaskIds.length });
}

function advancePost(sim: Simulation, projectId: Id): void {
  const project = sim.universe.projects[projectId];
  if (!project) return;
  const tasks = project.postTaskIds.map((id) => sim.universe.postTasks[id]).filter(Boolean) as PostTask[];
  if (tasks.length === 0) return;

  // Unblock anything whose dependencies are now satisfied.
  for (const task of tasks) {
    if (task.status !== 'blocked') continue;
    if (task.dependsOn.every((dep) => tasks.find((t) => t.kind === dep)?.status === 'complete')) {
      task.status = 'ready';
    }
  }

  // Vendors work in parallel, but only a handful of workstreams at once.
  const running = tasks.filter((t) => t.status === 'in_progress');
  const ready = tasks.filter((t) => t.status === 'ready');
  const capacity = Math.max(0, 4 - running.length);
  for (const task of ready.slice(0, capacity)) {
    task.status = 'in_progress';
    task.startedAt = sim.now;
    task.vendorName ??= defaultVendor(task.kind);
  }

  const accountId = project.financingIds.find((id) => (sim.ledger.tryAccount(id)?.balance ?? 0) > 0) ?? project.financingIds[0];

  for (const task of tasks.filter((t) => t.status === 'in_progress')) {
    task.elapsedDays += 7;

    const progress = clamp(task.elapsedDays / Math.max(1, task.plannedDays), 0, 1);
    const due = Math.round(task.budgeted * progress) - task.spent;
    if (due > 0 && accountId) {
      if (sim.ledger.availableFunds(accountId) >= due) {
        sim.expense(accountId, due, `${project.title} — ${task.name}`, 'production', { refType: 'project', refId: project.id });
        task.spent += due;
        project.spent += due;
      } else {
        task.notes.push({ at: sim.now, note: 'Vendor paused: invoice unpaid.' });
        continue;
      }
    }

    if (task.elapsedDays >= task.plannedDays) {
      const spec = POST_SPEC_BY_KIND[task.kind];
      const rng = sim.rng('post_quality', task.id);
      const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
      const craft = director
        ? (director.skills['post_vision'] ?? 25) * 0.4 + (director.skills['tone_control'] ?? 25) * 0.3 + project.scriptQuality * 0.3
        : project.scriptQuality * 0.6 + 25;
      const funding = clamp(task.spent / Math.max(1, task.budgeted), 0.4, 1.2);

      task.quality = clamp(Math.round(craft * funding + rng.normal(0, 8)), 0, 100);
      task.status = 'complete';
      task.completedAt = sim.now;
      task.notes.push({ at: sim.now, note: `Delivered by ${task.vendorName}. Quality ${task.quality}.` });

      if (task.kind === 'picture_lock') {
        project.pictureLockedAt = sim.now;
        sim.notify({
          category: 'production', title: `${project.title} is locked`,
          body: 'Picture lock reached. Sound, score, visual effects and colour can now proceed.',
          importance: 68, route: '/workspace/projects',
        });
      }
      void spec;
      sim.emit('prod.post_task_complete', { projectId: project.id, taskId: task.id, kind: task.kind, quality: task.quality });
    }
  }

  const allComplete = tasks.every((t) => t.status === 'complete');
  if (allComplete) {
    project.finalQuality = computeFinalQuality(sim, project);
    project.totalCost = project.spent;
    advancePhase(sim, project, 'marketing');
    sim.remember({
      category: 'project',
      title: `${project.title} is finished`,
      detail: `Delivered at ${formatMoneyCompact(project.spent)}. Final quality ${project.finalQuality} out of 100.`,
      refs: [{ type: 'project', id: project.id }],
      significance: 80, public: false, amount: project.spent,
    });
    sim.notify({
      category: 'production', title: `${project.title} is delivered`,
      body: 'Post is complete. Marketing and distribution can begin.',
      importance: 82, route: '/workspace/projects',
    });
    sim.emit('prod.delivered', { projectId: project.id, quality: project.finalQuality, cost: project.spent });
    return;
  }

  sim.schedule({
    at: addDays(sim.now, 7, sim.homeZone),
    kind: 'prod.post_tick',
    label: `${project.title} — post progress`,
    category: 'production',
    payload: { projectId: project.id },
    priority: 58,
    refType: 'project', refId: project.id,
  });
}

function defaultVendor(kind: PostTaskKind): string {
  const vendors: Partial<Record<PostTaskKind, string>> = {
    vfx: 'Longshore Visual', sound_design: 'Harbour Post', mix: 'Harbour Post',
    color: 'Cobalt Grade', score: 'Ardent Music', foley: 'Harbour Post',
    adr: 'Harbour Post', localization: 'Meridian Localisation', qc: 'Keystone QC',
    mastering: 'Keystone QC', delivery: 'Keystone QC',
  };
  return vendors[kind] ?? 'In-house';
}

function scheduleIncentive(sim: Simulation, project: Project): void {
  const locationId = project.productionLocationIds[0];
  if (!locationId) return;
  const incentive = filmIncentive(locationId, sim.now);
  if (!incentive || project.spent < incentive.minimumSpend) return;

  sim.schedule({
    at: addDays(sim.now, 210, sim.homeZone),
    kind: 'prod.incentive_payout',
    label: `${incentive.label} — ${project.title}`,
    category: 'finance',
    payload: { projectId: project.id },
    priority: 50,
    refType: 'project', refId: project.id,
  });
}

function payIncentive(sim: Simulation, projectId: Id): void {
  const project = sim.universe.projects[projectId];
  if (!project) return;
  const locationId = project.productionLocationIds[0];
  if (!locationId) return;
  const incentive = filmIncentive(locationId, sim.now);
  if (!incentive) return;

  const qualified = Math.round(project.spent * 0.62);
  if (qualified < incentive.minimumSpend) return;
  let amount = applyRate(qualified, incentive.rate + incentive.localHireUplift);
  if (incentive.perProjectCap > 0) amount = Math.min(amount, incentive.perProjectCap);

  const accountId = project.financingIds[0]
    ?? (project.ownerCompanyId ? sim.universe.companies[project.ownerCompanyId]?.cashAccountId : undefined)
    ?? sim.universe.people[project.createdById]?.primaryAccountId;
  if (!accountId) return;

  sim.income(accountId, amount, incentive.label, 'production', { refType: 'project', refId: project.id });
  project.totalCost = Math.max(0, project.totalCost - amount);

  sim.notify({
    category: 'business',
    title: `${incentive.label} received`,
    body: `${formatMoneyCompact(amount)} back on ${project.title} for qualified spend in ${CITIES.require(locationId).name}.`,
    importance: 60, route: '/workspace/projects',
  });
  sim.emit('prod.incentive_paid', { projectId: project.id, amount, jurisdiction: incentive.jurisdictionCode });
}

/** Post board state for the workspace UI. */
export function postBoard(sim: Simulation, projectId: Id) {
  const project = sim.universe.projects[projectId];
  if (!project) return [];
  return project.postTaskIds
    .map((id) => sim.universe.postTasks[id])
    .filter(Boolean)
    .map((task) => ({
      task: task as PostTask,
      blockedBy: blockedReasons(sim, (task as PostTask).id),
      progress: clamp((task as PostTask).elapsedDays / Math.max(1, (task as PostTask).plannedDays), 0, 1),
    }));
}

/** Shooting-schedule state for the workspace UI. */
export function shootingBoard(sim: Simulation, projectId: Id) {
  const project = sim.universe.projects[projectId];
  if (!project) return { days: [], shot: 0, planned: 0, spent: 0, budgeted: 0 };
  const days = project.shootDayIds.map((id) => sim.universe.shootDays[id]).filter(Boolean) as ShootDay[];
  return {
    days,
    shot: days.filter((d) => d.status === 'complete' || d.status === 'incomplete').length,
    planned: days.length,
    spent: days.reduce((s, d) => s + d.actualCost, 0),
    budgeted: days.reduce((s, d) => s + d.dailyBudget, 0),
  };
}

export const PRODUCTION_DAY_MS = MS_DAY;
