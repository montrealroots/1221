/**
 * Plans: the commitments that are yours to move.
 *
 * A plan goes on the calendar with a reminder and a window. It refuses a
 * clash and a time that has gone. It can be moved, dropped or skipped, and
 * each of those is recorded as what it was. When it comes due it asks —
 * with actions the engine actually handles — and it is the scene finishing
 * that marks it attended, not the click that opened it. Left alone, it is
 * missed.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { activeScene } from '@/engine/systems/scenes';
import { EARLY_MINUTES, LAPSE_GRACE_MINUTES, attendable, plansOf } from '@/engine/systems/plans';
import { workoutsOf } from '@/engine/systems/fitness';

const MS_MINUTE = 60_000;
const GOLDS = 'gym-la-golds-venice';

function aLife(seed = 'plans'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 50_000_00, 'Test funding', 'other');
  return sim;
}

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function gymPlan(sim: Simulation, inHours = 3, extra: Record<string, unknown> = {}) {
  return must<{ planId: string; scheduledItemId: string }>(sim, 'plan.create', {
    title: 'Gym', at: sim.now + inHours * 60 * MS_MINUTE, durationMinutes: 90,
    placeId: GOLDS, sceneDefinitionId: 'fitness.gym', sceneInput: { placeId: GOLDS }, reminderMinutes: 30, ...extra,
  });
}

describe('making a plan', () => {
  it('puts it on the calendar with a reminder and a window', () => {
    const sim = aLife();
    const { planId, scheduledItemId } = gymPlan(sim);
    const plan = sim.universe.plans[planId]!;
    expect(plan.status).toBe('planned');
    expect(plan.locationId).toBe(sim.player.currentLocationId);
    const kinds = sim.universe.scheduled.filter((i) => i.status === 'pending' && (i.refId === planId || i.payload['planId'] === planId)).map((i) => i.kind).sort();
    expect(kinds).toEqual(['plan.lapse', 'plan.personal', 'plan.reminder']);
    const item = sim.timeline.get(scheduledItemId)!;
    expect(item.requiresPlayer).toBe(true);
    expect(item.category).toBe('personal');
    expect(item.durationMinutes).toBe(90);
    expect(plansOf(sim)).toHaveLength(1);
  });

  it('refuses a clash, the past, nonsense lengths and a scene that does not exist', () => {
    const sim = aLife();
    gymPlan(sim);
    const clash = attempt(sim, 'plan.create', { title: 'Coffee', at: sim.now + 3.5 * 60 * MS_MINUTE, durationMinutes: 30 });
    expect(clash.ok).toBe(false);
    expect(clash.error).toMatch(/Gym/);
    expect(attempt(sim, 'plan.create', { title: 'Yesterday', at: sim.now - MS_MINUTE, durationMinutes: 30 }).ok).toBe(false);
    expect(attempt(sim, 'plan.create', { title: 'Blink', at: sim.now + MS_DAY, durationMinutes: 1 }).ok).toBe(false);
    expect(attempt(sim, 'plan.create', { title: '', at: sim.now + MS_DAY, durationMinutes: 30 }).ok).toBe(false);
    expect(attempt(sim, 'plan.create', { title: 'Nope', at: sim.now + MS_DAY, durationMinutes: 30, sceneDefinitionId: 'no.such' }).ok).toBe(false);
  });

  it('can be moved, and the reminder moves with it', () => {
    const sim = aLife();
    const { planId } = gymPlan(sim);
    const plan = sim.universe.plans[planId]!;
    const firstReminder = plan.reminderItemId!;
    const later = sim.now + 6 * 60 * MS_MINUTE;
    must(sim, 'plan.reschedule', { planId, at: later });
    expect(plan.at).toBe(later);
    expect(sim.timeline.get(plan.scheduledItemId)!.at).toBe(later);
    expect(sim.timeline.get(firstReminder)!.status).toBe('cancelled');
    expect(sim.timeline.get(plan.reminderItemId!)!.at).toBe(later - 30 * MS_MINUTE);
    expect(attempt(sim, 'plan.reschedule', { planId, at: sim.now - 1 }).ok).toBe(false);
  });

  it('cancel and skip are different outcomes', () => {
    const sim = aLife();
    const a = gymPlan(sim, 3).planId;
    const b = must<{ planId: string }>(sim, 'plan.create', { title: 'Read', at: sim.now + 8 * 60 * MS_MINUTE, durationMinutes: 60 }).planId;
    must(sim, 'plan.cancel', { planId: a });
    must(sim, 'plan.skip', { planId: b });
    expect(sim.universe.plans[a]!.status).toBe('cancelled');
    expect(sim.universe.plans[b]!.status).toBe('skipped');
    expect(sim.timeline.get(sim.universe.plans[a]!.scheduledItemId)!.status).toBe('cancelled');
    expect(attempt(sim, 'plan.cancel', { planId: a }).ok).toBe(false);
  });
});

describe('when the time comes', () => {
  it('asks, with actions the engine handles, and is missed if nobody answers', () => {
    const sim = aLife();
    const { planId } = gymPlan(sim, 2);
    const plan = sim.universe.plans[planId]!;
    sim.advanceTo(plan.at);
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'plan' && d.refId === planId && !d.resolvedAt);
    expect(decision).toBeDefined();
    expect(decision!.actions.map((a) => a.label)).toEqual(['Play It Out', 'Just Do It', 'Skip It']);
    const commands = new Set(sim.commandKinds());
    for (const action of decision!.actions) expect(commands.has(action.commandKind), action.commandKind).toBe(true);
    expect(sim.universe.notifications.some((n) => n.refId === planId)).toBe(true);

    sim.advanceTo(plan.at + (plan.durationMinutes + LAPSE_GRACE_MINUTES + 1) * MS_MINUTE);
    expect(plan.status).toBe('missed');
    expect(Object.values(sim.universe.decisions).find((d) => d.refId === planId)!.resolvedAt).toBeDefined();
  });

  it('will not be started long before its time, and says when it is', () => {
    const sim = aLife();
    const { planId } = gymPlan(sim, 5);
    const early = attendable(sim, sim.universe.plans[planId]!);
    expect(early.ok).toBe(false);
    expect(early.reason).toMatch(/planned for/);
    sim.advanceTo(sim.universe.plans[planId]!.at - (EARLY_MINUTES - 5) * MS_MINUTE);
    expect(attendable(sim, sim.universe.plans[planId]!).ok).toBe(true);
  });

  it('playing it out opens the scene, and the scene finishing is what marks it attended', () => {
    const sim = aLife();
    const { planId } = gymPlan(sim, 2);
    const plan = sim.universe.plans[planId]!;
    sim.advanceTo(plan.at);
    const decision = Object.values(sim.universe.decisions).find((d) => d.refId === planId)!;
    const opened = sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: decision.id, actionIndex: 0 } });
    expect(opened.ok, opened.error).toBe(true);
    const scene = activeScene(sim)!;
    expect(scene.definitionId).toBe('fitness.gym');
    expect(scene.refType).toBe('plan');
    expect(scene.refId).toBe(planId);
    expect(plan.status).toBe('planned');

    must(sim, 'scene.skip', { sceneId: scene.id, revision: scene.revision });
    expect(plan.status).toBe('attended');
    expect(plan.sceneId).toBe(scene.id);
    expect(workoutsOf(sim, sim.player.id)).toHaveLength(1);
  });

  it('getting it done runs the summary once, and never twice', () => {
    const sim = aLife();
    const { planId } = gymPlan(sim, 2);
    sim.advanceTo(sim.universe.plans[planId]!.at);
    const command = { kind: 'plan.attend', payload: { planId, mode: 'summary' }, idempotencyKey: 'attend:1' };
    expect(sim.execute(command).ok).toBe(true);
    expect(sim.execute(command).replayed).toBe(true);
    expect(attempt(sim, 'plan.attend', { planId, mode: 'summary' }).ok).toBe(false);
    expect(sim.universe.plans[planId]!.status).toBe('attended');
    expect(workoutsOf(sim, sim.player.id)).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('walking out of the scene before anything happened leaves the plan standing', () => {
    const sim = aLife();
    const { planId } = gymPlan(sim, 2);
    sim.advanceTo(sim.universe.plans[planId]!.at);
    must(sim, 'plan.attend', { planId, mode: 'play' });
    const scene = activeScene(sim)!;
    must(sim, 'scene.leave', { sceneId: scene.id, revision: scene.revision });
    expect(sim.universe.plans[planId]!.status).toBe('planned');
    expect(attendable(sim, sim.universe.plans[planId]!).ok).toBe(true);
  });
});
