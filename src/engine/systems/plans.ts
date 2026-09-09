/**
 * SLATE — things you planned to do.
 *
 * A bill comes due whether you like it or not; a flight leaves without you.
 * A plan is different: it is yours. You put it on the calendar, you can move
 * it or drop it, and when the time comes it asks whether you want to play it
 * out, get it done, or let it go. What happened is recorded as exactly one of
 * planned, attended, skipped, missed or canceled.
 *
 * A plan can carry a scene. Attending opens that scene; getting it done runs
 * the same scene summarized, by the same rules; the scene finishing is what
 * marks the plan attended — not the click that opened it.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_MINUTE, formatDuration, formatTime } from '../core/time';
import type { Id, PersonalPlan } from '../domain/model';
import { CITIES } from '../content/geography';
import { placesIn } from '../content/places';
import { activeScene, sceneDefinition, type SceneInput } from './scenes';

export const MAX_PLAN_MINUTES = 12 * 60;
export const MIN_PLAN_MINUTES = 5;
/** How long after a plan's window closes before it is counted missed. */
export const LAPSE_GRACE_MINUTES = 60;
/** How early a plan can be started. */
export const EARLY_MINUTES = 60;

export function plansOf(sim: Simulation, personId: Id = sim.player.id): PersonalPlan[] {
  return Object.values(sim.universe.plans)
    .filter((p) => p.personId === personId)
    .sort((a, b) => a.at - b.at);
}

export function planFor(sim: Simulation, scheduledItemId: Id): PersonalPlan | undefined {
  return Object.values(sim.universe.plans).find((p) => p.scheduledItemId === scheduledItemId);
}

function requirePlan(sim: Simulation, planId: Id): PersonalPlan {
  const plan = sim.universe.plans[planId];
  if (!plan || plan.personId !== sim.player.id) throw new CommandError('No such plan.');
  return plan;
}

function cityOfPlace(sim: Simulation, placeId: string | undefined): string {
  if (!placeId) return sim.player.currentLocationId;
  const here = placesIn(sim.player.currentLocationId).find((p) => p.id === placeId);
  if (here) return here.cityId;
  const prefix = placeId.split(':')[0] ?? '';
  return CITIES.get(prefix) ? prefix : sim.player.currentLocationId;
}

function armReminder(sim: Simulation, plan: PersonalPlan): void {
  if (plan.reminderItemId) {
    sim.timeline.cancel(plan.reminderItemId, sim.now);
    plan.reminderItemId = undefined;
  }
  if (!plan.reminderMinutes) return;
  const at = plan.at - plan.reminderMinutes * MS_MINUTE;
  if (at <= sim.now) return;
  plan.reminderItemId = sim.schedule({
    at, kind: 'plan.reminder', label: `Reminder: ${plan.title}`, category: 'system', priority: 60,
    payload: { planId: plan.id }, refType: 'plan', refId: plan.id,
  }).id;
}

function armLapse(sim: Simulation, plan: PersonalPlan): void {
  sim.timeline.cancelFor('plan-lapse', plan.id, sim.now);
  sim.schedule({
    at: plan.at + (plan.durationMinutes + LAPSE_GRACE_MINUTES) * MS_MINUTE,
    kind: 'plan.lapse', label: `${plan.title} Window`, category: 'system', priority: 130,
    payload: { planId: plan.id }, refType: 'plan-lapse', refId: plan.id,
  });
}

function settle(sim: Simulation, plan: PersonalPlan, status: PersonalPlan['status'], sceneId?: Id): void {
  plan.status = status;
  plan.resolvedAt = sim.now;
  if (sceneId) plan.sceneId = sceneId;
  sim.resolveDecision('plan', plan.id);
  sim.timeline.cancelFor('plan-lapse', plan.id, sim.now);
  if (plan.reminderItemId) sim.timeline.cancel(plan.reminderItemId, sim.now);
  sim.emit('plan.settled', { planId: plan.id, status });
}

/** Whether a plan can be started now, and why not. */
export function attendable(sim: Simulation, plan: PersonalPlan): { ok: boolean; reason?: string } {
  if (plan.status !== 'planned') return { ok: false, reason: `That plan is ${plan.status}.` };
  if (sim.now < plan.at - EARLY_MINUTES * MS_MINUTE) {
    return { ok: false, reason: `That’s planned for ${formatTime(plan.at, sim.zone)}. Move it if you want it now.` };
  }
  if (plan.locationId !== sim.player.currentLocationId) {
    return { ok: false, reason: `That’s in ${CITIES.get(plan.locationId)?.name ?? 'another city'}, and you aren’t there.` };
  }
  return { ok: true };
}

export function registerPlans(sim: Simulation): void {
  // --- When the time comes ---------------------------------------------------
  sim.onSchedule('plan.personal', (item) => {
    const plan = sim.universe.plans[item.payload['planId'] as Id];
    if (!plan || plan.status !== 'planned') return;
    // Started early and still going: there is nothing to ask.
    const scene = activeScene(sim);
    if (scene && scene.refType === 'plan' && scene.refId === plan.id) return;
    const def = plan.sceneDefinitionId ? sceneDefinition(plan.sceneDefinitionId) : undefined;
    const actions: { label: string; commandKind: string; payload: Record<string, unknown> }[] = [];
    if (def) {
      actions.push({ label: 'Play It Out', commandKind: 'plan.attend', payload: { planId: plan.id, mode: 'play' } });
      if (def.summarise) actions.push({ label: 'Just Do It', commandKind: 'plan.attend', payload: { planId: plan.id, mode: 'summary' } });
    } else {
      actions.push({ label: 'Done', commandKind: 'plan.attend', payload: { planId: plan.id, mode: 'summary' } });
    }
    actions.push({ label: 'Skip It', commandKind: 'plan.skip', payload: { planId: plan.id } });
    const where = plan.placeId ? placesIn(plan.locationId).find((p) => p.id === plan.placeId)?.name : undefined;
    sim.requireDecision({
      urgency: 60, category: 'personal',
      title: `Time For ${plan.title}`,
      detail: `${formatDuration(plan.durationMinutes * MS_MINUTE)}${where ? ` at ${where}` : ''}. It’s on your calendar for now.`,
      route: '/workspace/calendar',
      actions,
      dueAt: plan.at + plan.durationMinutes * MS_MINUTE,
      refType: 'plan', refId: plan.id,
    });
    sim.notify({
      category: 'personal', title: plan.title,
      body: `Planned for ${formatTime(plan.at, sim.zone)}${where ? ` at ${where}` : ''}.`,
      importance: 40, route: '/workspace/calendar', refType: 'plan', refId: plan.id,
    });
  });

  sim.onSchedule('plan.reminder', (item) => {
    const plan = sim.universe.plans[item.payload['planId'] as Id];
    if (!plan || plan.status !== 'planned') return;
    sim.notify({
      category: 'personal', title: `Coming Up: ${plan.title}`,
      body: `${formatDuration(plan.at - sim.now)} from now, at ${formatTime(plan.at, sim.zone)}.`,
      importance: 30, route: '/workspace/calendar', refType: 'plan', refId: plan.id,
    });
  });

  sim.onSchedule('plan.lapse', (item) => {
    const plan = sim.universe.plans[item.payload['planId'] as Id];
    if (!plan || plan.status !== 'planned') return;
    // Still being played: the window waits. The scene finishing settles it.
    const scene = activeScene(sim);
    if (scene && scene.refType === 'plan' && scene.refId === plan.id) {
      sim.schedule({
        at: sim.now + LAPSE_GRACE_MINUTES * MS_MINUTE,
        kind: 'plan.lapse', label: `${plan.title} Window`, category: 'system', priority: 130,
        payload: { planId: plan.id }, refType: 'plan-lapse', refId: plan.id,
      });
      return;
    }
    settle(sim, plan, 'missed');
    sim.notify({
      category: 'personal', title: `Missed: ${plan.title}`,
      body: 'The time came and went.',
      importance: 25, route: '/workspace/calendar', refType: 'plan', refId: plan.id,
    });
  });

  // --- The scene it opened finishing is what marks it attended ---------------
  sim.onEvent('scene.completed', 'plan.attended', (event, { sim: s }) => {
    const { sceneId } = event.payload as { sceneId: Id };
    const session = s.universe.scenes.sessions[sceneId];
    if (!session || session.refType !== 'plan' || !session.refId) return;
    const plan = s.universe.plans[session.refId];
    if (!plan || plan.status !== 'planned') return;
    settle(s, plan, 'attended', sceneId);
  });

  sim.onEvent('scene.abandoned', 'plan.left', (event, { sim: s }) => {
    const { sceneId, committed } = event.payload as { sceneId: Id; committed: number };
    const session = s.universe.scenes.sessions[sceneId];
    if (!session || session.refType !== 'plan' || !session.refId) return;
    const plan = s.universe.plans[session.refId];
    if (!plan || plan.status !== 'planned') return;
    // Walking out after doing part of it counts; walking out before anything
    // happened leaves the plan standing until its window closes.
    if (committed > 0) settle(s, plan, 'attended', sceneId);
  });

  // --- Commands ---------------------------------------------------------------
  sim.onCommand<
    { title: string; at: number; durationMinutes: number; placeId?: string; sceneDefinitionId?: string; sceneInput?: SceneInput; participantIds?: Id[]; reminderMinutes?: number },
    { planId: Id; scheduledItemId: Id }
  >(
    'plan.create',
    (p, { sim: s }) => {
      const title = typeof p.title === 'string' ? p.title.trim().slice(0, 80) : '';
      if (!title) throw new CommandError('Give the plan a name.');
      if (!Number.isFinite(p.at) || p.at < s.now) throw new CommandError('Plan something in the future.');
      const minutes = p.durationMinutes;
      if (!Number.isInteger(minutes) || minutes < MIN_PLAN_MINUTES || minutes > MAX_PLAN_MINUTES) {
        throw new CommandError(`Between ${MIN_PLAN_MINUTES} minutes and ${MAX_PLAN_MINUTES / 60} hours.`);
      }
      if (p.sceneDefinitionId) {
        const def = sceneDefinition(p.sceneDefinitionId);
        if (!def) throw new CommandError('That kind of plan isn’t available.');
      }
      const clash = s.timeline.conflicts(p.at, minutes)[0];
      if (clash) throw new CommandError(`That runs into "${clash.label}" at ${formatTime(clash.at, s.zone)}. Pick another time.`);
      const participantIds = (p.participantIds ?? []).filter((id) => s.universe.people[id]);
      const locationId = cityOfPlace(s, p.placeId);
      const id = s.nextId('plan');
      const item = s.schedule({
        at: p.at, kind: 'plan.personal', label: title, category: 'personal', priority: 50,
        payload: { planId: id }, requiresPlayer: true, locationId, durationMinutes: minutes,
        refType: 'plan', refId: id,
      });
      const plan: PersonalPlan = {
        id, saveId: s.universe.meta.id, personId: s.player.id,
        title, at: p.at, durationMinutes: minutes, locationId, placeId: p.placeId,
        sceneDefinitionId: p.sceneDefinitionId,
        sceneInput: p.sceneInput ? Object.fromEntries(Object.entries(p.sceneInput).map(([k, v]) => [k, v as string | number | boolean | null])) : undefined,
        participantIds, status: 'planned', scheduledItemId: item.id,
        reminderMinutes: p.reminderMinutes, createdAt: s.now,
      };
      s.universe.plans[id] = plan;
      armReminder(s, plan);
      armLapse(s, plan);
      s.emit('plan.created', { planId: id, at: p.at });
      return { planId: id, scheduledItemId: item.id };
    },
  );

  sim.onCommand<{ planId: Id; at: number; durationMinutes?: number }, { at: number }>(
    'plan.reschedule',
    (p, { sim: s }) => {
      const plan = requirePlan(s, p.planId);
      if (plan.status !== 'planned') throw new CommandError(`That plan is ${plan.status}; it can’t be moved.`);
      if (!Number.isFinite(p.at) || p.at < s.now) throw new CommandError('Move it somewhere in the future.');
      const minutes = p.durationMinutes ?? plan.durationMinutes;
      if (!Number.isInteger(minutes) || minutes < MIN_PLAN_MINUTES || minutes > MAX_PLAN_MINUTES) throw new CommandError('That isn’t a sensible length.');
      const clash = s.timeline.conflicts(p.at, minutes, plan.scheduledItemId)[0];
      if (clash) throw new CommandError(`That runs into "${clash.label}" at ${formatTime(clash.at, s.zone)}.`);
      const item = s.timeline.get(plan.scheduledItemId);
      if (!item || item.status !== 'pending') {
        // The item already fired (it was due); a fresh one carries the new time.
        const fresh = s.schedule({
          at: p.at, kind: 'plan.personal', label: plan.title, category: 'personal', priority: 50,
          payload: { planId: plan.id }, requiresPlayer: true, locationId: plan.locationId, durationMinutes: minutes,
          refType: 'plan', refId: plan.id,
        });
        plan.scheduledItemId = fresh.id;
      } else {
        s.timeline.reschedule(item.id, p.at);
        item.durationMinutes = minutes;
      }
      plan.at = p.at;
      plan.durationMinutes = minutes;
      s.resolveDecision('plan', plan.id);
      armReminder(s, plan);
      armLapse(s, plan);
      return { at: plan.at };
    },
  );

  sim.onCommand<{ planId: Id }, { status: PersonalPlan['status'] }>(
    'plan.cancel',
    (p, { sim: s }) => {
      const plan = requirePlan(s, p.planId);
      if (plan.status !== 'planned') throw new CommandError(`That plan is already ${plan.status}.`);
      s.timeline.cancel(plan.scheduledItemId, s.now);
      settle(s, plan, 'cancelled');
      return { status: plan.status };
    },
  );

  sim.onCommand<{ planId: Id }, { status: PersonalPlan['status'] }>(
    'plan.skip',
    (p, { sim: s }) => {
      const plan = requirePlan(s, p.planId);
      if (plan.status !== 'planned') throw new CommandError(`That plan is already ${plan.status}.`);
      s.timeline.cancel(plan.scheduledItemId, s.now);
      settle(s, plan, 'skipped');
      return { status: plan.status };
    },
  );

  sim.onCommand<{ planId: Id; mode: 'play' | 'summary' }, { status: PersonalPlan['status']; sceneId?: Id }>(
    'plan.attend',
    (p, { sim: s }) => {
      const plan = requirePlan(s, p.planId);
      const check = attendable(s, plan);
      if (!check.ok) throw new CommandError(check.reason ?? 'Not now.');
      if (!plan.sceneDefinitionId) {
        s.timeline.cancel(plan.scheduledItemId, s.now);
        settle(s, plan, 'attended');
        return { status: plan.status };
      }
      const input: SceneInput = { ...(plan.sceneInput ?? {}) };
      if (plan.placeId && input['placeId'] === undefined) input['placeId'] = plan.placeId;
      if (p.mode === 'summary') {
        const { sceneId } = s.must<{ sceneId: Id }>({
          kind: 'scene.quick', payload: { definitionId: plan.sceneDefinitionId, input, refType: 'plan', refId: plan.id },
        });
        // scene.completed settles it; if the scene finished without that
        // event reaching a plan (it always should), settle here as well.
        if (plan.status === 'planned') settle(s, plan, 'attended', sceneId);
        return { status: plan.status, sceneId };
      }
      const { sceneId } = s.must<{ sceneId: Id }>({
        kind: 'scene.start', payload: { definitionId: plan.sceneDefinitionId, input, refType: 'plan', refId: plan.id },
      });
      s.resolveDecision('plan', plan.id);
      return { status: plan.status, sceneId };
    },
  );
}
