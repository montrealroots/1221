/**
 * Care: the visit, from the desk to the desk.
 *
 * The services system owns the mechanics (providers, what a visit costs,
 * what it does for you, what insurance pays). This system owns the asking
 * and the visit itself: an appointment coming round asks on Home; you play
 * it, just go, or skip it; left alone for an hour it is a no-show with the
 * practice's fee. Played, it is the desk (your card in network, out of
 * network, or no card), the wait, the room where you say what brought you
 * in, an exam that ends in a verdict (fine, tests, treatment), a
 * prescription collected at a pharmacy and taken over days, results that
 * arrive on their own two days later, the bill at the desk, and a
 * follow-up you can book before you leave. The provider is a person who
 * remembers you.
 *
 * Simulated care, not medical advice. Every name of a medication is
 * SLATE's own.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { clamp, remap } from '../core/rng';
import { MS_HOUR, MS_MINUTE, addDays, formatDate, formatTime } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { Appointment, HealthProvider, Id, Person, Prescription } from '../domain/model';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import type { DialogueTone } from '../dialogue/schema';
import { makeBackgroundPerson, peopleOf } from './people';
import { rememberFact, factsOf } from './memory';
import { activeScene } from './scenes';
import {
  SPECIALTIES, applyCare, chargeVisit, completeAppointment, inNetwork, missAppointment, nextOpening, policyFor, splitCost,
} from './services';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minutes after the appointment time before it counts as a no-show. */
export const LAPSE_MINUTES = 60;
/** How early you can check in. */
export const EARLY_MINUTES = 60;
export const TRAVEL_MINUTES = 20;
export const WAIT_MINUTES = 15;
/** Days tests take to come back. */
export const RESULTS_DAYS = 2;
/** Days a prescription can sit uncollected. */
export const RX_LAPSE_DAYS = 14;
export const NOT_HERE = 'You are not in the city the practice is in.';

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export function appointmentOf(sim: Simulation, id: Id): Appointment {
  const appointment = sim.universe.appointments[id];
  if (!appointment) throw new CommandError('There is no appointment like that.');
  return appointment;
}

export function providerOf(sim: Simulation, appointment: Appointment): HealthProvider {
  const provider = sim.universe.healthProviders[appointment.providerId];
  if (!provider) throw new CommandError('That practice is gone.');
  return provider;
}

/** The person behind the practice: the doctor, dentist, therapist, or the one on duty. */
export function doctorOf(sim: Simulation, provider: HealthProvider): Person {
  if (provider.personId && sim.universe.people[provider.personId]) return sim.universe.people[provider.personId]!;
  const existing = peopleOf(sim, `doctor:${provider.id}`)[0];
  if (existing) { provider.personId = existing.id; return existing; }
  const rng = sim.rng('doctor', provider.id);
  const named = /^Dr\. (\S+) (.+)$/.exec(provider.name);
  const person = makeBackgroundPerson(sim, {
    rng, archetype: `doctor:${provider.id}`, industryRole: 'clinician', cityId: provider.locationId,
    background: `${SPECIALTIES.find((s) => s.key === provider.specialty)?.label ?? 'Care'} at ${provider.name}.`,
    interests: ['medicine', rng.pick(['cycling', 'gardening', 'chess', 'sailing', 'baking'])],
    skills: { medicine: provider.quality },
    age: [32, 66],
    personality: { conscientiousness: rng.int(70, 96), agreeableness: rng.int(40, 88), extraversion: rng.int(30, 75) },
    lifestyle: 'comfortable',
  });
  if (named) {
    person.firstName = named[1]!;
    person.lastName = named[2]!;
    person.displayName = `${named[1]} ${named[2]}`;
  }
  provider.personId = person.id;
  return person;
}

export function doctorTone(person: Person): DialogueTone {
  return person.personality.agreeableness >= 60 ? 'warm' : 'firm';
}

/** What the doctor knows about you, as the library names it. */
export function doctorKnows(sim: Simulation, doctorId: Id): string[] {
  const facts = factsOf(sim, doctorId, { aboutId: sim.player.id });
  const known: string[] = [];
  if (facts.some((f) => f.kind === 'meeting')) known.push('met');
  if (facts.some((f) => f.kind === 'event' && /did not come/.test(f.text))) known.push('missed');
  return known;
}

export interface Complaint {
  id: string;
  label: string;
  detail: string;
  /** Specialties where this is the natural thing to say. */
  fit: HealthProvider['specialty'][];
}

const COMPLAINTS: readonly Complaint[] = [
  { id: 'checkup', label: 'A Checkup', detail: 'Nothing wrong. Making sure.', fit: ['primary', 'dentist', 'optometrist'] },
  { id: 'pain', label: 'Something Hurts', detail: 'A back, a shoulder, a knee. It has been a week.', fit: ['chiropractor', 'physical_therapy', 'primary', 'urgent_care', 'emergency', 'specialist'] },
  { id: 'injury', label: 'Something From Training', detail: 'It went in the gym and it has not come back.', fit: ['physical_therapy', 'chiropractor', 'urgent_care', 'primary'] },
  { id: 'sleep', label: 'I Cannot Sleep', detail: 'Weeks of it. It is starting to show.', fit: ['primary', 'counseling'] },
  { id: 'stress', label: 'The Pressure', detail: 'Everything at once, all the time.', fit: ['counseling', 'primary'] },
  { id: 'unwell', label: 'I Feel Unwell', detail: 'Since Tuesday. Hot, then cold.', fit: ['primary', 'urgent_care', 'emergency'] },
  { id: 'teeth', label: 'My Teeth', detail: 'One of them, mostly.', fit: ['dentist'] },
  { id: 'eyes', label: 'My Eyes', detail: 'The far things have gone soft.', fit: ['optometrist'] },
];

export const COMPLAINT_BY_ID: Readonly<Record<string, Complaint>> = Object.fromEntries(COMPLAINTS.map((c) => [c.id, c]));

/** What you could say brought you in, for this practice and how you are. */
export function complaintsFor(sim: Simulation, appointment: Appointment): Complaint[] {
  const provider = providerOf(sim, appointment);
  const me = sim.player;
  const sore = (me.training?.soreness ?? 0) > 0 || Boolean(me.training?.current?.injured);
  const out = COMPLAINTS.filter((c) => {
    if (c.id === 'injury' && !sore) return false;
    if (c.id === 'sleep' && me.wellbeing.sleepDebt < 15) return false;
    if (c.id === 'stress' && me.wellbeing.stress < 35) return false;
    return c.fit.includes(provider.specialty) || (c.id === 'checkup' && provider.specialty !== 'emergency');
  });
  return out.length > 0 ? out : [COMPLAINTS[0]!];
}

export interface VisitCost {
  cost: Money;
  covered: Money;
  outOfPocket: Money;
  network: 'in' | 'out' | 'none';
  carrier?: string;
}

/** What the desk will say the visit costs, from the card you hold today. */
export function visitCost(sim: Simulation, appointment: Appointment): VisitCost {
  const provider = providerOf(sim, appointment);
  const policy = policyFor(sim, provider);
  const network: VisitCost['network'] = !policy ? 'none' : inNetwork(provider, policy) ? 'in' : 'out';
  const { covered, outOfPocket } = splitCost(appointment.cost, network === 'in' ? policy : undefined);
  return { cost: appointment.cost, covered, outOfPocket, network, carrier: policy?.carrier };
}

/** Whether the visit can start now: yours, scheduled, the time has come, you are there. */
export function attendable(sim: Simulation, appointment: Appointment): { ok: boolean; reason?: string } {
  if (appointment.personId !== sim.player.id) return { ok: false, reason: 'That is not your appointment.' };
  if (appointment.status !== 'scheduled') return { ok: false, reason: `That appointment is ${appointment.status}.` };
  if (sim.player.currentLocationId !== appointment.locationId) return { ok: false, reason: NOT_HERE };
  if (sim.now < appointment.at - EARLY_MINUTES * MS_MINUTE) return { ok: false, reason: `It is at ${formatTime(appointment.at, sim.zone)}; the desk opens an hour before.` };
  return { ok: true };
}

export function prescriptionsOf(sim: Simulation, personId: Id): Prescription[] {
  return Object.values(sim.universe.prescriptions ?? {}).filter((rx) => rx.personId === personId).sort((a, b) => b.writtenAt - a.writtenAt);
}

/** Whether a prescription can be collected now: written, not lapsed, you are in a city. */
export function fillable(sim: Simulation, rx: Prescription): { ok: boolean; reason?: string } {
  if (rx.personId !== sim.player.id) return { ok: false, reason: 'That is not your prescription.' };
  if (rx.status === 'filled' || rx.status === 'finished') return { ok: false, reason: 'You have already collected it.' };
  if (rx.status === 'lapsed') return { ok: false, reason: 'It sat too long at the pharmacy; ask for another.' };
  if (!CITIES.get(sim.player.currentLocationId)) return { ok: false, reason: 'You are between places.' };
  return { ok: true };
}

export function visitWindow(sim: Simulation, appointment: Appointment): string {
  return `${formatDate(appointment.at, sim.homeZone)} at ${formatTime(appointment.at, sim.homeZone)}`;
}

// ---------------------------------------------------------------------------
// The exam: what the complaint and the practice make of it
// ---------------------------------------------------------------------------

export type Verdict = 'fine' | 'tests' | 'treat';

interface ExamOutcome {
  verdict: Verdict;
  fit: number;
  prescription?: { medication: string; purpose: string; days: number; dosesPerDay: number; baseCost: Money };
  tests: boolean;
  followUpDays: number;
}

function examine(sim: Simulation, appointment: Appointment, complaintId: string): ExamOutcome {
  const provider = providerOf(sim, appointment);
  const complaint = COMPLAINT_BY_ID[complaintId] ?? COMPLAINTS[0]!;
  const rng = sim.rng('exam', appointment.id, complaintId);
  const fit = complaint.fit.includes(provider.specialty) ? 1.2 : 0.8;
  const testChance: Record<string, number> = { checkup: 0.25, pain: 0.5, injury: 0.55, sleep: 0.15, stress: 0.1, unwell: 0.5, teeth: 0.2, eyes: 0 };
  const rxChance: Record<string, number> = { checkup: 0.12, pain: 0.6, injury: 0.55, sleep: 0.5, stress: 0.35, unwell: 0.65, teeth: 0.3, eyes: 0.5 };
  const rxFor: Record<string, ExamOutcome['prescription']> = {
    checkup: { medication: 'Vitamin D Course', purpose: 'checkup', days: 30, dosesPerDay: 1, baseCost: 24_00 },
    pain: { medication: 'Anti-Inflammatory Course', purpose: 'pain', days: 10, dosesPerDay: 2, baseCost: 38_00 },
    injury: { medication: 'Anti-Inflammatory Course', purpose: 'injury', days: 14, dosesPerDay: 2, baseCost: 42_00 },
    sleep: { medication: 'Sleep Aid, Short Course', purpose: 'sleep', days: 7, dosesPerDay: 1, baseCost: 56_00 },
    stress: { medication: 'Something Mild For The Evenings', purpose: 'stress', days: 21, dosesPerDay: 1, baseCost: 64_00 },
    unwell: { medication: 'Antibiotic Course', purpose: 'unwell', days: 7, dosesPerDay: 3, baseCost: 48_00 },
    teeth: { medication: 'Antibiotic Course', purpose: 'teeth', days: 5, dosesPerDay: 3, baseCost: 44_00 },
    eyes: { medication: 'Corrective Lenses', purpose: 'eyes', days: 1, dosesPerDay: 1, baseCost: 260_00 },
  };
  const tests = provider.specialty !== 'counseling' && rng.chance(testChance[complaint.id] ?? 0.2);
  const prescription = rng.chance(rxChance[complaint.id] ?? 0.2) ? rxFor[complaint.id] : undefined;
  const followUp: Partial<Record<HealthProvider['specialty'], number>> = {
    primary: 365, dentist: 180, optometrist: 365, chiropractor: 21, physical_therapy: 14, specialist: 28, counseling: 14, urgent_care: 0, emergency: 7,
  };
  const followUpDays = complaint.id === 'checkup' ? (followUp[provider.specialty] ?? 0) : Math.min(followUp[provider.specialty] ?? 0, 28) || (tests ? 14 : 0);
  return { verdict: tests ? 'tests' : prescription ? 'treat' : 'fine', fit, prescription, tests, followUpDays };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function cancelKind(sim: Simulation, kind: string, refId: Id): void {
  for (const item of sim.timeline.pending()) if (item.kind === kind && item.refId === refId) sim.timeline.cancel(item.id, sim.now);
}

function sceneOn(sim: Simulation, refType: string, refId: Id): boolean {
  const scene = activeScene(sim);
  return Boolean(scene && scene.refType === refType && scene.refId === refId);
}

function rxStore(sim: Simulation): Record<Id, Prescription> {
  sim.universe.prescriptions ??= {};
  return sim.universe.prescriptions;
}

export function registerCare(sim: Simulation): void {
  // --- The appointment comes round ------------------------------------------------

  sim.onEvent('health.appointment_due', 'care.due', (event, { sim: s }) => {
    const { appointmentId } = event.payload as { appointmentId: Id };
    const appointment = s.universe.appointments[appointmentId];
    if (!appointment || appointment.status !== 'scheduled' || appointment.personId !== s.player.id) return;
    if (sceneOn(s, 'appointment', appointment.id)) return;
    const provider = providerOf(s, appointment);
    if (s.player.currentLocationId !== appointment.locationId) {
      missAppointment(s, appointment, `You were not in ${CITIES.require(appointment.locationId).name} for ${appointment.kind}.`);
      return;
    }
    const cost = visitCost(s, appointment);
    s.requireDecision({
      urgency: 60, category: 'health',
      title: `${appointment.kind} With ${provider.name}`,
      detail: `${formatMoney(cost.outOfPocket)} out of pocket${cost.network === 'out' ? '; they do not take your card' : cost.network === 'none' ? '; you have no cover' : ''}. Not going costs ${formatMoney(Math.round(appointment.cost * 0.4))}.`,
      route: '/workspace/health',
      actions: [
        { label: 'Play It Out', commandKind: 'scene.start', payload: { definitionId: 'health.visit', input: { appointmentId: appointment.id }, refType: 'appointment', refId: appointment.id } },
        { label: 'Just Go', commandKind: 'health.attend', payload: { appointmentId: appointment.id } },
        { label: 'Skip It', commandKind: 'health.skip', payload: { appointmentId: appointment.id } },
      ],
      dueAt: s.now + LAPSE_MINUTES * MS_MINUTE,
      refType: 'appointment', refId: appointment.id,
    });
    s.schedule({
      at: s.now + LAPSE_MINUTES * MS_MINUTE, kind: 'health.lapse', label: `${appointment.kind} Lapses`, category: 'system',
      payload: { appointmentId: appointment.id }, priority: 80, refType: 'appointment', refId: appointment.id,
    });
  });

  sim.onSchedule('health.lapse', (item) => {
    const appointment = sim.universe.appointments[item.payload['appointmentId'] as Id];
    if (!appointment || appointment.status !== 'scheduled' || appointment.checkedInAt) return;
    if (sceneOn(sim, 'appointment', appointment.id)) {
      sim.schedule({ at: sim.now + LAPSE_MINUTES * MS_MINUTE, kind: 'health.lapse', label: item.label, category: 'system', payload: { appointmentId: appointment.id }, priority: 80, refType: 'appointment', refId: appointment.id });
      return;
    }
    const provider = providerOf(sim, appointment);
    const doctor = doctorOf(sim, provider);
    rememberFact(sim, doctor.id, { kind: 'event', aboutId: sim.player.id, text: `Booked ${appointment.kind} and did not come.`, weight: 35, sourceKind: 'care', refType: 'appointment', refId: appointment.id, expiresAt: addDays(sim.now, 180, sim.homeZone) });
    missAppointment(sim, appointment, 'You never went.');
  });

  sim.onCommand<{ appointmentId: Id }, { skipped: boolean; fee: Money }>(
    'health.skip',
    (p, { sim: s }) => {
      const appointment = appointmentOf(s, p.appointmentId);
      if (appointment.status !== 'scheduled') throw new CommandError('That appointment is not open.');
      cancelKind(s, 'health.lapse', appointment.id);
      missAppointment(s, appointment, 'You decided not to go.');
      return { skipped: true, fee: Math.round(appointment.cost * 0.4) };
    },
  );

  sim.onCommand<{ appointmentId: Id }, { completed: boolean }>(
    'health.attend',
    (p, { sim: s }) => {
      const appointment = appointmentOf(s, p.appointmentId);
      const can = attendable(s, appointment);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      const provider = providerOf(s, appointment);
      const doctor = doctorOf(s, provider);
      cancelKind(s, 'health.lapse', appointment.id);
      s.advanceTo(s.now + (TRAVEL_MINUTES + WAIT_MINUTES + appointment.durationMinutes) * MS_MINUTE);
      appointment.complaint ??= complaintsFor(s, appointment)[0]!.id;
      rememberFact(s, doctor.id, { kind: 'meeting', aboutId: s.player.id, text: `Saw ${s.player.firstName} for ${appointment.kind.toLowerCase()}.`, weight: 25, sourceKind: 'care', refType: 'appointment', refId: appointment.id, expiresAt: addDays(s.now, 365, s.homeZone) });
      completeAppointment(s, appointment.id);
      return { completed: appointment.status === 'completed' };
    },
  );

  // --- The visit, played -------------------------------------------------------------

  sim.onCommand<{ appointmentId: Id }, { minutes: number; cost: VisitCost; doctorId: Id }>(
    'health.check_in',
    (p, { sim: s }) => {
      const appointment = appointmentOf(s, p.appointmentId);
      const can = attendable(s, appointment);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      if (appointment.checkedInAt) throw new CommandError('You have already checked in.');
      const provider = providerOf(s, appointment);
      const doctor = doctorOf(s, provider);
      cancelKind(s, 'health.lapse', appointment.id);
      s.resolveDecision('appointment', appointment.id);
      s.advanceTo(s.now + (TRAVEL_MINUTES + WAIT_MINUTES) * MS_MINUTE);
      appointment.checkedInAt = s.now;
      const cost = visitCost(s, appointment);
      appointment.insuranceCovered = cost.covered;
      appointment.outOfPocket = cost.outOfPocket;
      return { minutes: TRAVEL_MINUTES + WAIT_MINUTES, cost, doctorId: doctor.id };
    },
  );

  sim.onCommand<{ appointmentId: Id; complaint: string }, { verdict: Verdict; gain: number; tests: boolean; prescriptionId?: Id; followUpDays: number; resultsAt?: number }>(
    'health.consult',
    (p, { sim: s }) => {
      const appointment = appointmentOf(s, p.appointmentId);
      if (appointment.status !== 'scheduled' || !appointment.checkedInAt) throw new CommandError('Check in at the desk first.');
      if (appointment.consultedAt) throw new CommandError('You have already been seen.');
      if (!complaintsFor(s, appointment).some((c) => c.id === p.complaint)) throw new CommandError('That is not something to bring here.');
      const provider = providerOf(s, appointment);
      const doctor = doctorOf(s, provider);
      const complaint = COMPLAINT_BY_ID[p.complaint]!;
      s.advanceTo(s.now + appointment.durationMinutes * MS_MINUTE);
      const exam = examine(s, appointment, complaint.id);
      appointment.complaint = complaint.id;
      appointment.consultedAt = s.now;
      const gain = applyCare(s, appointment, exam.fit);
      appointment.followUpDays = exam.followUpDays;
      if (exam.followUpDays > 0) appointment.followUpAt = addDays(s.now, exam.followUpDays, s.homeZone);
      let prescriptionId: Id | undefined;
      if (exam.prescription) {
        const policy = policyFor(s, provider);
        const cost = Math.round(exam.prescription.baseCost * costOfLiving(provider.locationId));
        const { covered, outOfPocket } = splitCost(cost, inNetwork(provider, policy) ? policy : undefined);
        const rx: Prescription = {
          id: s.nextId('rx'), saveId: s.universe.meta.id, personId: s.player.id, appointmentId: appointment.id, providerId: provider.id,
          medication: exam.prescription.medication, purpose: exam.prescription.purpose, days: exam.prescription.days, dosesPerDay: exam.prescription.dosesPerDay,
          cost, insuranceCovered: covered, outOfPocket, writtenAt: s.now, dosesTaken: 0, status: 'written',
        };
        rxStore(s)[rx.id] = rx;
        appointment.prescriptionId = rx.id;
        prescriptionId = rx.id;
        s.schedule({ at: addDays(s.now, RX_LAPSE_DAYS, s.homeZone), kind: 'health.rx_lapse', label: `${rx.medication} Uncollected`, category: 'system', payload: { prescriptionId: rx.id }, priority: 85, refType: 'prescription', refId: rx.id });
      }
      let resultsAt: number | undefined;
      if (exam.tests) {
        appointment.testsOrderedAt = s.now;
        resultsAt = addDays(s.now, RESULTS_DAYS, s.homeZone);
        appointment.resultsAt = resultsAt;
        s.schedule({ at: resultsAt, kind: 'health.results', label: `Results From ${provider.name}`, category: 'health', payload: { appointmentId: appointment.id }, priority: 55, refType: 'appointment', refId: appointment.id });
      }
      appointment.outcome = exam.verdict === 'fine'
        ? `${complaint.label}: nothing of concern.`
        : exam.verdict === 'tests'
          ? `${complaint.label}: tests ordered${exam.prescription ? ` and ${exam.prescription.medication.toLowerCase()} written` : ''}.`
          : `${complaint.label}: ${exam.prescription?.medication ?? 'treatment'} written.`;
      rememberFact(s, doctor.id, { kind: 'meeting', aboutId: s.player.id, text: `Saw ${s.player.firstName} about ${complaint.label.toLowerCase()}.`, weight: 25, sourceKind: 'care', refType: 'appointment', refId: appointment.id, expiresAt: addDays(s.now, 365, s.homeZone) });
      rememberFact(s, doctor.id, { kind: 'topic', aboutId: s.player.id, text: `${complaint.label}.`, weight: 20, sourceKind: 'care', expiresAt: addDays(s.now, 365, s.homeZone) });
      s.emit('health.consulted', { appointmentId: appointment.id, complaint: complaint.id, verdict: exam.verdict, tests: exam.tests, prescriptionId });
      return { verdict: exam.verdict, gain: Math.round(gain), tests: exam.tests, prescriptionId, followUpDays: exam.followUpDays, resultsAt };
    },
  );

  sim.onCommand<{ appointmentId: Id; bill?: boolean }, { paid: boolean; owed: Money }>(
    'health.pay',
    (p, { sim: s }) => {
      const appointment = appointmentOf(s, p.appointmentId);
      if (appointment.personId !== s.player.id) throw new CommandError('That is not your bill.');
      if (appointment.status === 'scheduled') {
        if (!appointment.consultedAt) throw new CommandError('You have not been seen yet.');
        appointment.status = 'completed';
        if (appointment.scheduledItemId) s.timeline.cancel(appointment.scheduledItemId, s.now);
        s.emit('health.appointment_completed', { appointmentId: appointment.id, providerId: appointment.providerId, conditionGain: appointment.conditionGain ?? 0 });
      }
      if (appointment.paidAt) return { paid: true, owed: 0 };
      if (p.bill) {
        const provider = providerOf(s, appointment);
        s.requireDecision({
          urgency: 55, category: 'health', title: 'Unpaid Medical Bill',
          detail: `${formatMoney(appointment.outOfPocket)} is owed to ${provider.name}. They will send it on.`,
          route: '/workspace/health',
          actions: [{ label: 'Pay It', commandKind: 'health.pay', payload: { appointmentId: appointment.id } }],
          refType: 'appointment', refId: appointment.id,
        });
        return { paid: false, owed: appointment.outOfPocket };
      }
      const { paid } = chargeVisit(s, appointment);
      if (paid) s.resolveDecision('appointment', appointment.id);
      return { paid, owed: paid ? 0 : appointment.outOfPocket };
    },
  );

  // --- Results, prescriptions, doses ------------------------------------------------------

  sim.onSchedule('health.results', (item) => {
    const appointment = sim.universe.appointments[item.payload['appointmentId'] as Id];
    if (!appointment || appointment.resultOutcome) return;
    const provider = providerOf(sim, appointment);
    const rng = sim.rng('results', appointment.id);
    const worry = appointment.complaint === 'unwell' || appointment.complaint === 'pain' || appointment.complaint === 'injury' ? 0.4 : 0.22;
    const followUp = rng.chance(worry * remap(provider.quality, 40, 100, 1.2, 0.8));
    appointment.resultOutcome = followUp ? 'follow_up' : 'clear';
    appointment.outcome = `${appointment.outcome ?? ''} Results: ${followUp ? 'something to look at again' : 'clear'}.`.trim();
    if (followUp) {
      const at = nextOpening(sim, provider);
      sim.requireDecision({
        urgency: 62, category: 'health',
        title: `Results From ${provider.name}`,
        detail: 'Something in the tests they want to look at again. Not an emergency; not nothing.',
        route: '/workspace/health',
        actions: [{ label: 'Book The Follow-Up', commandKind: 'health.book', payload: { providerId: provider.id, at, kind: 'Follow Up' } }],
        refType: 'appointment', refId: appointment.id,
      });
    }
    sim.notify({
      category: 'health', title: `Results From ${provider.name}`,
      body: followUp ? 'They want to see you again about the tests. Book it from Health.' : 'All clear. Nothing to do.',
      importance: followUp ? 60 : 30, route: '/workspace/health', refType: 'appointment', refId: appointment.id,
    });
    sim.emit('health.results', { appointmentId: appointment.id, outcome: appointment.resultOutcome });
  });

  sim.onCommand<{ prescriptionId: Id }, { cost: Money; outOfPocket: Money; firstDoseAt: number }>(
    'health.fill_prescription',
    (p, { sim: s }) => {
      const rx = rxStore(s)[p.prescriptionId];
      if (!rx) throw new CommandError('There is no prescription like that.');
      const can = fillable(s, rx);
      if (!can.ok) throw new CommandError(can.reason ?? 'That cannot be collected.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < rx.outOfPocket) throw new CommandError(`${rx.medication} is ${formatMoney(rx.outOfPocket)} at the counter. You have ${formatMoney(s.ledger.availableFunds(accountId))}.`);
      s.advanceTo(s.now + 25 * MS_MINUTE);
      if (rx.outOfPocket > 0) s.expense(accountId, rx.outOfPocket, `${rx.medication} — pharmacy`, 'health', { refType: 'prescription', refId: rx.id });
      rx.filledAt = s.now;
      rx.status = 'filled';
      cancelKind(s, 'health.rx_lapse', rx.id);
      const firstDoseAt = s.now + MS_HOUR;
      rx.nextDoseAt = firstDoseAt;
      s.schedule({ at: firstDoseAt, kind: 'health.dose', label: `${rx.medication}`, category: 'system', payload: { prescriptionId: rx.id }, priority: 90, refType: 'prescription', refId: rx.id });
      s.emit('health.prescription_filled', { prescriptionId: rx.id, cost: rx.cost, outOfPocket: rx.outOfPocket });
      return { cost: rx.cost, outOfPocket: rx.outOfPocket, firstDoseAt };
    },
  );

  sim.onSchedule('health.dose', (item) => {
    const rx = rxStore(sim)[item.payload['prescriptionId'] as Id];
    if (!rx || rx.status !== 'filled') return;
    const person = sim.universe.people[rx.personId];
    if (!person) return;
    rx.dosesTaken += 1;
    const perDose = rx.purpose === 'eyes' ? 4 : 0.6;
    person.wellbeing.condition = clamp(person.wellbeing.condition + perDose, 0, 100);
    if (rx.purpose === 'sleep') person.wellbeing.sleepDebt = clamp(person.wellbeing.sleepDebt - 6, 0, 100);
    if (rx.purpose === 'stress') person.wellbeing.stress = clamp(person.wellbeing.stress - 1.5, 0, 100);
    const total = rx.days * rx.dosesPerDay;
    if (rx.dosesTaken >= total) {
      rx.status = 'finished';
      rx.nextDoseAt = undefined;
      sim.notify({ category: 'health', title: `${rx.medication} Finished`, body: `${total} doses over ${rx.days} day${rx.days === 1 ? '' : 's'}, as written.`, importance: 20, route: '/workspace/health', refType: 'prescription', refId: rx.id });
      sim.emit('health.prescription_finished', { prescriptionId: rx.id });
      return;
    }
    rx.nextDoseAt = sim.now + Math.round((24 / rx.dosesPerDay) * MS_HOUR);
    sim.schedule({ at: rx.nextDoseAt, kind: 'health.dose', label: rx.medication, category: 'system', payload: { prescriptionId: rx.id }, priority: 90, refType: 'prescription', refId: rx.id });
  });

  sim.onSchedule('health.rx_lapse', (item) => {
    const rx = rxStore(sim)[item.payload['prescriptionId'] as Id];
    if (!rx || rx.status !== 'written') return;
    rx.status = 'lapsed';
    sim.notify({ category: 'health', title: `${rx.medication} Not Collected`, body: `It sat at the pharmacy for ${RX_LAPSE_DAYS} days. If you still need it, that is another visit.`, importance: 35, route: '/workspace/health', refType: 'prescription', refId: rx.id });
    sim.emit('health.prescription_lapsed', { prescriptionId: rx.id });
  });
}
