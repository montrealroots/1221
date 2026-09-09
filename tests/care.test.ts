/**
 * Care: the visit from the desk to the desk, and what follows it.
 *
 * An appointment coming round asks; left alone for an hour it is a no-show
 * with the practice's fee. Played, it is the desk (your card in network,
 * out of network, or none), the room where you say what brought you in,
 * an exam that decides fine, tests or treatment, the bill, and a
 * follow-up. Results come two days later on their own; a prescription is
 * collected at a pharmacy and taken over days; the provider remembers.
 * Simulated care, not medical advice.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { insurerByName } from '@/engine/content/insurers';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays } from '@/engine/core/time';
import type { Appointment, HealthProvider } from '@/engine/domain/model';
import { ensureProviders, activePolicy, policyFor, inNetwork } from '@/engine/systems/services';
import {
  COMPLAINT_BY_ID, LAPSE_MINUTES, RESULTS_DAYS, RX_LAPSE_DAYS, TRAVEL_MINUTES, WAIT_MINUTES, complaintsFor, doctorOf, doctorKnows, prescriptionsOf, visitCost,
} from '@/engine/systems/care';
import { factsOf } from '@/engine/systems/memory';
import { activeScene, sceneView } from '@/engine/systems/scenes';

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function aLife(seed = 'care', funding = 50_000_00): Simulation {
  const sim = quickSave({}, seed);
  if (funding > 0) sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

function balance(sim: Simulation): number {
  return sim.ledger.account(sim.player.primaryAccountId!).balance;
}

function txns(sim: Simulation, memo: RegExp, refId?: string) {
  return sim.ledger.history(sim.player.primaryAccountId!, 500).filter((t) => memo.test(t.memo) && (!refId || t.refId === refId));
}

function provider(sim: Simulation, specialty: HealthProvider['specialty'] = 'primary'): HealthProvider {
  return ensureProviders(sim, sim.player.currentLocationId).find((p) => p.specialty === specialty)!;
}

/** An appointment booked and brought to its hour. */
function due(sim: Simulation, specialty: HealthProvider['specialty'] = 'primary'): Appointment {
  const who = provider(sim, specialty);
  const at = addDays(sim.now, 2, sim.homeZone);
  const { appointmentId } = must<{ appointmentId: string }>(sim, 'health.book', { providerId: who.id, at });
  const appointment = sim.universe.appointments[appointmentId]!;
  sim.advanceTo(at + MS_MINUTE);
  return appointment;
}

function insured(sim: Simulation): void {
  const { quoteId } = must<{ quoteId: string }>(sim, 'ins.quote', { line: 'health' });
  must(sim, 'ins.purchase', { quoteId });
}

function choose(sim: Simulation, choiceId: string) {
  const scene = activeScene(sim)!;
  return must<{ status: string }>(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId });
}

function decisionFor(sim: Simulation, refId: string) {
  return Object.values(sim.universe.decisions).find((d) => d.refType === 'appointment' && d.refId === refId && !d.resolvedAt);
}

describe('the appointment comes round', () => {
  beforeAll(async () => { await loadAllSections(); });

  it('asks with the three ways, and left alone is a no-show the practice charges for and the doctor remembers', () => {
    const sim = aLife('care-lapse');
    const appointment = due(sim);
    const decision = decisionFor(sim, appointment.id)!;
    expect(decision.title).toMatch(/ With Dr\. /);
    expect(decision.actions.map((a) => a.label)).toEqual(['Play It Out', 'Just Go', 'Skip It']);
    for (const action of decision.actions) expect(sim.hasCommand(action.commandKind)).toBe(true);
    sim.advanceTo(sim.now + (LAPSE_MINUTES + 1) * MS_MINUTE);
    expect(appointment.status).toBe('missed');
    expect(txns(sim, /Missed appointment fee/, appointment.id).length).toBe(1);
    expect(decisionFor(sim, appointment.id)).toBeUndefined();
    const doctor = doctorOf(sim, provider(sim));
    expect(doctorKnows(sim, doctor.id)).toContain('missed');
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('skipping it is the same no-show, chosen; being in another city is one you could not help', () => {
    const skip = aLife('care-skip');
    const a = due(skip);
    must(skip, 'health.skip', { appointmentId: a.id });
    expect(a.status).toBe('missed');
    expect(skip.universe.notifications.some((n) => n.title === 'Missed Appointment' && /decided n[o’]t to go/.test(n.body))).toBe(true);

    const away = aLife('care-away');
    const who = provider(away);
    const at = addDays(away.now, 2, away.homeZone);
    const { appointmentId } = must<{ appointmentId: string }>(away, 'health.book', { providerId: who.id, at });
    away.player.currentLocationId = away.player.currentLocationId === 'uk-eng-london' ? 'us-ny-newyork' : 'uk-eng-london';
    away.advanceTo(at + MS_MINUTE);
    expect(away.universe.appointments[appointmentId]!.status).toBe('missed');
    expect(decisionFor(away, appointmentId)).toBeUndefined();
  });

  it('just going is the whole visit by the same rules: time, care, the bill, the follow-up', () => {
    const sim = aLife('care-attend');
    const appointment = due(sim);
    const before = sim.now;
    const condition = sim.player.wellbeing.condition;
    must(sim, 'health.attend', { appointmentId: appointment.id });
    expect(appointment.status).toBe('completed');
    expect(sim.now - before).toBe((TRAVEL_MINUTES + WAIT_MINUTES + appointment.durationMinutes) * MS_MINUTE);
    expect(sim.player.wellbeing.condition).toBeGreaterThan(condition);
    expect(appointment.paidAt).toBeDefined();
    expect(txns(sim, /Primary Care/, appointment.id).length).toBe(1);
    expect(appointment.followUpAt).toBeDefined();
    expect(decisionFor(sim, appointment.id)).toBeUndefined();
    expect(sim.timeline.pending().some((i) => i.kind === 'health.lapse' && i.refId === appointment.id)).toBe(false);
  });
});

describe('the visit, played', () => {
  beforeAll(async () => { await loadAllSections(); });

  it('the desk knows your card: none, in network, out of network', () => {
    const none = aLife('care-none');
    const a = due(none);
    expect(visitCost(none, a).network).toBe('none');
    expect(visitCost(none, a).outOfPocket).toBe(a.cost);

    const covered = aLife('care-insured', 200_000_00);
    insured(covered);
    const policy = activePolicy(covered, covered.player.id, 'health')!;
    // A real company that writes health cover where they live, never SLATE's own.
    expect(insurerByName(policy.carrier)?.lines).toContain('health');
    expect(policy.carrier).not.toMatch(/Northbank|Meridian|Vantage/);
    const who = ensureProviders(covered, covered.player.currentLocationId).find((p) => p.specialty !== 'dentist' && p.specialty !== 'optometrist' && inNetwork(p, policyFor(covered, p)));
    const outside = ensureProviders(covered, covered.player.currentLocationId).find((p) => p.specialty !== 'dentist' && p.specialty !== 'optometrist' && !inNetwork(p, policyFor(covered, p)));
    if (who) {
      const { appointmentId } = must<{ appointmentId: string }>(covered, 'health.book', { providerId: who.id, at: addDays(covered.now, 2, covered.homeZone) });
      const cost = visitCost(covered, covered.universe.appointments[appointmentId]!);
      expect(cost.network).toBe('in');
      expect(cost.outOfPocket).toBeLessThanOrEqual(cost.cost);
    }
    if (outside) {
      const { appointmentId } = must<{ appointmentId: string }>(covered, 'health.book', { providerId: outside.id, at: addDays(covered.now, 3, covered.homeZone) });
      const cost = visitCost(covered, covered.universe.appointments[appointmentId]!);
      expect(cost.network).toBe('out');
      expect(cost.outOfPocket).toBe(cost.cost);
    }
    expect(who || outside).toBeTruthy();
  });

  it('check in, say what brought you in, hear the verdict, pay, book the follow-up', () => {
    const sim = aLife('care-play');
    const appointment = due(sim);
    const who = provider(sim);
    const doctor = doctorOf(sim, who);
    const condition = sim.player.wellbeing.condition;
    must(sim, 'scene.start', { definitionId: 'health.visit', input: { appointmentId: appointment.id }, refType: 'appointment', refId: appointment.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('arrive');
    const desk = sceneView(sim, scene);
    expect(desk.facts!.find((f) => f.label === 'Insurance')!.value).toBe('No cover');
    expect(desk.text.length).toBeGreaterThan(10);
    const before = sim.now;
    choose(sim, 'checkin');
    expect(sim.now - before).toBe((TRAVEL_MINUTES + WAIT_MINUTES) * MS_MINUTE);
    expect(appointment.checkedInAt).toBeDefined();
    expect(decisionFor(sim, appointment.id)).toBeUndefined();
    scene = activeScene(sim)!;
    expect(scene.node).toBe('room');
    const room = sceneView(sim, scene);
    const options = complaintsFor(sim, appointment);
    expect(room.choices.map((c) => c.id)).toEqual(options.map((c) => `say:${c.id}`));
    expect(room.title).toBe(doctor.displayName);
    choose(sim, 'say:checkup');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('verdict');
    expect(appointment.complaint).toBe('checkup');
    expect(appointment.consultedAt).toBeDefined();
    expect(sim.player.wellbeing.condition).toBeGreaterThan(condition);
    const verdict = sceneView(sim, scene);
    expect(['Nothing To Worry About', 'Tests', 'Treatment']).toContain(verdict.title);
    expect(verdict.text).not.toMatch(/\{\w+\}/);
    expect(factsOf(sim, doctor.id, { kind: 'topic' }).some((f) => /Checkup/.test(f.text))).toBe(true);
    choose(sim, 'desk');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('desk');
    const deskAgain = sceneView(sim, scene);
    expect(deskAgain.choices.map((c) => c.id)).toEqual(['pay', 'bill']);
    choose(sim, 'pay');
    expect(appointment.status).toBe('completed');
    expect(appointment.paidAt).toBeDefined();
    expect(txns(sim, /Primary Care/, appointment.id).length).toBe(1);
    scene = activeScene(sim)!;
    expect(scene.node).toBe('done');
    const done = sceneView(sim, scene);
    expect(done.choices.map((c) => c.id)).toEqual(['followup', 'finish']);
    choose(sim, 'followup');
    expect(activeScene(sim)).toBeUndefined();
    const followUp = Object.values(sim.universe.appointments).find((a) => a.id !== appointment.id && a.providerId === who.id && a.status === 'scheduled');
    expect(followUp).toBeDefined();
    expect(followUp!.kind).toBe('Follow Up');
    expect(followUp!.at).toBeGreaterThanOrEqual(appointment.followUpAt!);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a second visit is greeted as one', () => {
    const sim = aLife('care-return');
    const first = due(sim);
    must(sim, 'health.attend', { appointmentId: first.id });
    const doctor = doctorOf(sim, provider(sim));
    expect(doctorKnows(sim, doctor.id)).toContain('met');
    const second = due(sim);
    must(sim, 'scene.start', { definitionId: 'health.visit', input: { appointmentId: second.id }, refType: 'appointment', refId: second.id });
    choose(sim, 'checkin');
    const room = sceneView(sim, activeScene(sim)!);
    expect(room.text.length).toBeGreaterThan(5);
    must(sim, 'scene.leave', { sceneId: activeScene(sim)!.id, revision: activeScene(sim)!.revision });
    // Left after checking in: the visit resumes in the room, not at the desk.
    must(sim, 'scene.start', { definitionId: 'health.visit', input: { appointmentId: second.id }, refType: 'appointment', refId: second.id });
    expect(activeScene(sim)!.node).toBe('room');
  });

  it('short at the desk: the bill sits and asks, and paying it later clears it', () => {
    const sim = aLife('care-bill', 0);
    const appointment = due(sim);
    const accountId = sim.player.primaryAccountId!;
    sim.expense(accountId, Math.max(0, balance(sim) - 10_00), 'Test drain', 'other');
    must(sim, 'scene.start', { definitionId: 'health.visit', input: { appointmentId: appointment.id }, refType: 'appointment', refId: appointment.id });
    choose(sim, 'checkin');
    choose(sim, 'say:checkup');
    choose(sim, 'desk');
    const desk = sceneView(sim, activeScene(sim)!);
    expect(desk.choices.find((c) => c.id === 'pay')!.disabled).toMatch(/You have/);
    choose(sim, 'bill');
    expect(appointment.status).toBe('completed');
    expect(appointment.paidAt).toBeUndefined();
    const owed = decisionFor(sim, appointment.id)!;
    expect(owed.title).toBe('Unpaid Medical Bill');
    expect(attempt(sim, 'health.pay', { appointmentId: appointment.id }).ok).toBe(true);
    expect(appointment.paidAt).toBeUndefined();
    sim.income(accountId, 100_000_00, 'Test funding', 'other');
    must(sim, 'health.pay', { appointmentId: appointment.id });
    expect(appointment.paidAt).toBeDefined();
    expect(decisionFor(sim, appointment.id)).toBeUndefined();
  });

  it('the short version is the desk, the plain reason, and the bill', () => {
    const sim = aLife('care-quick');
    const appointment = due(sim, 'dentist');
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'health.visit', input: { appointmentId: appointment.id }, refType: 'appointment', refId: appointment.id });
    expect(quick.status).toBe('completed');
    expect(appointment.status).toBe('completed');
    expect(appointment.complaint).toBe(complaintsFor(sim, appointment)[0]!.id);
    expect(appointment.paidAt).toBeDefined();
    expect(quick.lines.length).toBeGreaterThanOrEqual(3);
  });

  it('you cannot be seen before the desk opens, twice, or from another city', () => {
    const sim = aLife('care-guards');
    const who = provider(sim);
    const at = addDays(sim.now, 2, sim.homeZone);
    const { appointmentId } = must<{ appointmentId: string }>(sim, 'health.book', { providerId: who.id, at });
    expect(attempt(sim, 'health.check_in', { appointmentId }).error).toMatch(/desk opens an hour before/);
    expect(attempt(sim, 'health.consult', { appointmentId, complaint: 'checkup' }).error).toMatch(/Check in/);
    sim.advanceTo(at + MS_MINUTE);
    must(sim, 'health.check_in', { appointmentId });
    expect(attempt(sim, 'health.check_in', { appointmentId }).error).toMatch(/already checked in/);
    expect(attempt(sim, 'health.consult', { appointmentId, complaint: 'teeth' }).error).toMatch(/n[o’]t something to bring here/);
    must(sim, 'health.consult', { appointmentId, complaint: 'checkup' });
    expect(attempt(sim, 'health.consult', { appointmentId, complaint: 'checkup' }).error).toMatch(/already been seen/);
  });
});

describe('what follows the visit', () => {
  beforeAll(async () => { await loadAllSections(); });

  /** Consult until the exam orders tests or writes something, on fresh saves. */
  function visitWith(kind: 'tests' | 'rx'): { sim: Simulation; appointment: Appointment } {
    for (let i = 0; i < 12; i++) {
      const sim = aLife(`care-${kind}-${i}`);
      const appointment = due(sim, kind === 'rx' ? 'urgent_care' : 'primary');
      must(sim, 'health.check_in', { appointmentId: appointment.id });
      const complaint = complaintsFor(sim, appointment).find((c) => c.id === 'unwell') ?? complaintsFor(sim, appointment)[0]!;
      const result = must<{ tests: boolean; prescriptionId?: string }>(sim, 'health.consult', { appointmentId: appointment.id, complaint: complaint.id });
      if (kind === 'tests' && result.tests) return { sim, appointment };
      if (kind === 'rx' && result.prescriptionId) return { sim, appointment };
    }
    throw new Error(`No exam ended in ${kind}`);
  }

  it('tests come back two days later on their own, clear or with a follow-up to book', () => {
    const { sim, appointment } = visitWith('tests');
    must(sim, 'health.pay', { appointmentId: appointment.id });
    expect(appointment.resultsAt).toBe(addDays(appointment.consultedAt!, RESULTS_DAYS, sim.homeZone));
    expect(appointment.resultOutcome).toBeUndefined();
    sim.advanceTo(appointment.resultsAt! + MS_HOUR);
    expect(['clear', 'follow_up']).toContain(appointment.resultOutcome);
    expect(sim.universe.notifications.some((n) => /^Results From /.test(n.title))).toBe(true);
    if (appointment.resultOutcome === 'follow_up') {
      const ask = decisionFor(sim, appointment.id)!;
      expect(ask.actions[0]!.label).toBe('Book The Follow-Up');
      expect(ask.actions[0]!.commandKind).toBe('health.book');
    }
  });

  it('a prescription is collected at a pharmacy, taken over days, and finishes; uncollected it lapses', () => {
    const { sim, appointment } = visitWith('rx');
    must(sim, 'health.pay', { appointmentId: appointment.id });
    const rx = prescriptionsOf(sim, sim.player.id)[0]!;
    expect(rx.appointmentId).toBe(appointment.id);
    expect(rx.status).toBe('written');
    expect(rx.outOfPocket).toBe(rx.cost);
    const condition = sim.player.wellbeing.condition;
    const before = balance(sim);
    const { firstDoseAt } = must<{ firstDoseAt: number }>(sim, 'health.fill_prescription', { prescriptionId: rx.id });
    expect(rx.status).toBe('filled');
    expect(before - balance(sim)).toBe(rx.outOfPocket);
    expect(attempt(sim, 'health.fill_prescription', { prescriptionId: rx.id }).error).toMatch(/already collected/);
    sim.advanceTo(firstDoseAt + MS_MINUTE);
    expect(rx.dosesTaken).toBe(1);
    expect(sim.player.wellbeing.condition).toBeGreaterThanOrEqual(Math.min(100, condition));
    sim.advanceTo(sim.now + (rx.days + 1) * MS_DAY);
    expect(rx.status).toBe('finished');
    expect(rx.dosesTaken).toBe(rx.days * rx.dosesPerDay);
    expect(sim.universe.notifications.some((n) => n.title === `${rx.medication} Finished`)).toBe(true);

    const { sim: lapse } = visitWith('rx');
    const left = prescriptionsOf(lapse, lapse.player.id)[0]!;
    lapse.advanceTo(addDays(lapse.now, RX_LAPSE_DAYS, lapse.homeZone) + MS_HOUR);
    expect(left.status).toBe('lapsed');
    expect(attempt(lapse, 'health.fill_prescription', { prescriptionId: left.id }).error).toMatch(/sat too long/);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('every complaint the room offers fits the practice or is a check-up', () => {
    const sim = aLife('care-complaints');
    for (const specialty of ['primary', 'dentist', 'optometrist', 'chiropractor', 'counseling'] as const) {
      const who = provider(sim, specialty);
      const { appointmentId } = must<{ appointmentId: string }>(sim, 'health.book', { providerId: who.id, at: addDays(sim.now, 2, sim.homeZone) + MS_HOUR * (['primary', 'dentist', 'optometrist', 'chiropractor', 'counseling'].indexOf(specialty)) });
      const options = complaintsFor(sim, sim.universe.appointments[appointmentId]!);
      expect(options.length).toBeGreaterThan(0);
      for (const c of options) expect(c.id === 'checkup' || COMPLAINT_BY_ID[c.id]!.fit.includes(specialty)).toBe(true);
    }
  });
});
