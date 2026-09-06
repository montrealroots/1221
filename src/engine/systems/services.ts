/**
 * SLATE — Healthcare, insurance and education.
 *
 * Simulated healthcare gameplay, not medical advice: providers, appointments,
 * costs, coverage and recovery. Insurance follows the real shape of the thing:
 * quote, premium, coverage, claim, decision, payout, renewal or lapse.
 */

import { titleCaseLabel } from '../core/text';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Appointment, Course, Enrollment, HealthProvider, Id, InsuranceClaim, InsuranceLine, InsurancePolicy,
} from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addMonths, addYears, formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { createBill } from './finance';
import { KIND_PROFILE, type VehicleKind } from '../content/vehicles';
import { vehicleKind } from './vehicles';
import { generatePersonName } from '../content/names';
import { modifierFor } from '../domain/attributes';

// ---------------------------------------------------------------------------
// Healthcare
// ---------------------------------------------------------------------------

export const SPECIALTIES: { key: HealthProvider['specialty']; label: string; baseCost: number; minutes: number; leadDays: [number, number]; conditionGain: number; description: string }[] = [
  { key: 'primary', label: 'Primary Care', baseCost: 180_00, minutes: 40, leadDays: [3, 21], conditionGain: 6, description: 'Annual checks, referrals and the person who knows your history.' },
  { key: 'dentist', label: 'Dentistry', baseCost: 220_00, minutes: 50, leadDays: [7, 40], conditionGain: 4, description: 'Cleanings, fillings and the appointment everybody postpones.' },
  { key: 'optometrist', label: 'Optometry', baseCost: 160_00, minutes: 35, leadDays: [4, 25], conditionGain: 3, description: 'Eye exams and prescriptions.' },
  { key: 'chiropractor', label: 'Chiropractic', baseCost: 130_00, minutes: 30, leadDays: [1, 8], conditionGain: 5, description: 'Adjustment and manual therapy for the wear a physical shoot causes.' },
  { key: 'physical_therapy', label: 'Physical Therapy', baseCost: 210_00, minutes: 55, leadDays: [3, 14], conditionGain: 9, description: 'Structured rehabilitation after injury.' },
  { key: 'specialist', label: 'Specialist', baseCost: 420_00, minutes: 45, leadDays: [14, 70], conditionGain: 12, description: 'Referral-only, expensive and worth it when you need it.' },
  { key: 'urgent_care', label: 'Urgent Care', baseCost: 340_00, minutes: 90, leadDays: [0, 0], conditionGain: 14, description: 'Walk-in, same day, no appointment.' },
  { key: 'emergency', label: 'Emergency', baseCost: 2_800_00, minutes: 240, leadDays: [0, 0], conditionGain: 22, description: 'When it cannot wait, at a price that reflects that.' },
  { key: 'counseling', label: 'Counselling', baseCost: 240_00, minutes: 55, leadDays: [5, 30], conditionGain: 3, description: 'Talking to someone about the pressure. Moves stress more than anything else does.' },
];

export function ensureProviders(sim: Simulation, cityId: string): HealthProvider[] {
  const existing = Object.values(sim.universe.healthProviders).filter((p) => p.locationId === cityId);
  if (existing.length >= SPECIALTIES.length) return existing;

  const rng = sim.rng('providers', cityId);
  const col = costOfLiving(cityId);
  const created: HealthProvider[] = [];

  for (const spec of SPECIALTIES) {
    if (existing.some((p) => p.specialty === spec.key)) continue;
    const name = generatePersonName(rng);
    const quality = rng.int(45, 96);
    const provider: HealthProvider = {
      id: sim.nextId('provider'),
      saveId: sim.universe.meta.id,
      name: spec.key === 'urgent_care' || spec.key === 'emergency'
        ? `${CITIES.require(cityId).name} ${spec.label}`
        : `Dr. ${name.first} ${name.last}`,
      specialty: spec.key,
      locationId: cityId,
      // Most practices take the carrier the game sells; a few do not, and say so at the desk.
      acceptsInsurance: rng.chance(0.75) ? ['Northbank Health', rng.pick(['Meridian Health', 'Vantage Care'])] : ['Meridian Health', 'Vantage Care'],
      baseVisitCost: Math.round(spec.baseCost * col * remap(quality, 40, 100, 0.85, 1.35)),
      quality,
      leadTimeDays: rng.int(spec.leadDays[0], spec.leadDays[1]),
      rating: Number((3 + (quality / 100) * 2).toFixed(1)),
    };
    sim.universe.healthProviders[provider.id] = provider;
    created.push(provider);
  }
  return [...existing, ...created];
}

// ---------------------------------------------------------------------------
// Insurance products
// ---------------------------------------------------------------------------

interface InsuranceProduct {
  line: InsuranceLine;
  label: string;
  /** Monthly premium as a fraction of insured value, or a flat base. */
  basePremium: Money;
  valueRate?: number;
  deductible: Money;
  coverageLimit: Money;
  coinsurance: number;
  description: string;
}

export const INSURANCE_PRODUCTS: readonly InsuranceProduct[] = [
  { line: 'health', label: 'Health', basePremium: 480_00, deductible: 3_500_00, coverageLimit: 1_500_000_00, coinsurance: 0.8, description: 'Covers most of a medical bill after the deductible. Expensive to hold, ruinous to lack.' },
  { line: 'dental', label: 'Dental', basePremium: 52_00, deductible: 100_00, coverageLimit: 2_500_00, coinsurance: 0.7, description: 'Cleanings covered in full, everything else partly.' },
  { line: 'vision', label: 'Vision', basePremium: 22_00, deductible: 25_00, coverageLimit: 800_00, coinsurance: 0.8, description: 'One exam a year and a contribution to frames.' },
  { line: 'auto', label: 'Auto', basePremium: 0, valueRate: 0.0038, deductible: 1_000_00, coverageLimit: 500_000_00, coinsurance: 1, description: 'Required to drive. Undisclosed modifications are grounds for denial.' },
  { line: 'renters', label: 'Renters', basePremium: 28_00, deductible: 500_00, coverageLimit: 60_000_00, coinsurance: 1, description: 'Covers your things, not the building.' },
  { line: 'homeowners', label: 'Homeowners', basePremium: 0, valueRate: 0.00055, deductible: 2_500_00, coverageLimit: 0, coinsurance: 1, description: 'Required by any lender. Covers the structure and the contents.' },
  { line: 'valuables', label: 'Valuables', basePremium: 0, valueRate: 0.0016, deductible: 500_00, coverageLimit: 0, coinsurance: 1, description: 'Scheduled cover for watches, jewellery and art. Worth having the moment a single item passes fifteen thousand.' },
  { line: 'travel', label: 'Travel', basePremium: 68_00, deductible: 250_00, coverageLimit: 50_000_00, coinsurance: 1, description: 'Cancellations, medical abroad and lost bags.' },
  { line: 'life', label: 'Life', basePremium: 74_00, deductible: 0, coverageLimit: 1_000_000_00, coinsurance: 1, description: 'For the people who depend on you.' },
  { line: 'umbrella', label: 'Umbrella Liability', basePremium: 42_00, deductible: 0, coverageLimit: 5_000_000_00, coinsurance: 1, description: 'Sits above your other policies. Cheap, and the thing that protects an estate.' },
  { line: 'business', label: 'Business', basePremium: 340_00, deductible: 5_000_00, coverageLimit: 2_000_000_00, coinsurance: 1, description: 'General liability for a company that employs people.' },
  { line: 'production', label: 'Production', basePremium: 0, valueRate: 0.019, deductible: 25_000_00, coverageLimit: 0, coinsurance: 1, description: 'Required before a completion bond. Priced on the budget.' },
  { line: 'equipment', label: 'Equipment', basePremium: 0, valueRate: 0.0085, deductible: 2_500_00, coverageLimit: 0, coinsurance: 1, description: 'Cameras, lenses and lighting against damage and theft.' },
  { line: 'marine', label: 'Marine', basePremium: 0, valueRate: 0.015, deductible: 2_500_00, coverageLimit: 0, coinsurance: 1, description: 'Hull and liability for a boat. Required by any marina worth berthing in. Undisclosed work on the boat is grounds for denial.' },
  { line: 'aviation', label: 'Aviation', basePremium: 0, valueRate: 0.012, deductible: 25_000_00, coverageLimit: 0, coinsurance: 1, description: 'Hull and liability for an aircraft, priced on the airframe and the crew. Nothing flies without it.' },
];

/** Which line covers a vehicle of this kind, and the reason a wrong line is refused. */
export function vehicleLineFor(kind: VehicleKind): InsuranceLine {
  return KIND_PROFILE[kind].insuranceLine;
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export function ensureCourses(sim: Simulation, cityId: string): Course[] {
  const existing = Object.values(sim.universe.courses).filter((c) => c.locationId === cityId);
  if (existing.length >= 12) return existing;

  const rng = sim.rng('courses', cityId);
  const col = costOfLiving(cityId);
  const templates: Omit<Course, 'id' | 'saveId' | 'locationId' | 'costPerSession' | 'instructorQuality'>[] = [
    { name: 'Scene Study', provider: 'The Hallward Studio', category: 'acting', improves: [{ key: 'emotional_truth', kind: 'attribute', gain: 1.4 }, { key: 'subtext', kind: 'attribute', gain: 1.2 }, { key: 'active_listening', kind: 'attribute', gain: 1.0 }], sessionsTotal: 12, sessionMinutes: 180, days: [2], hour: 19, minimumLevel: 0 },
    { name: 'On-Camera Technique', provider: 'The Hallward Studio', category: 'acting', improves: [{ key: 'camera_awareness', kind: 'attribute', gain: 1.8 }, { key: 'close_up_work', kind: 'attribute', gain: 1.4 }, { key: 'stillness', kind: 'attribute', gain: 1.0 }], sessionsTotal: 8, sessionMinutes: 150, days: [4], hour: 18, minimumLevel: 0 },
    { name: 'Audition Intensive', provider: 'Cold Read Workshop', category: 'acting', improves: [{ key: 'audition_technique', kind: 'attribute', gain: 2.2 }, { key: 'cold_reading', kind: 'attribute', gain: 1.6 }, { key: 'self_tape_craft', kind: 'attribute', gain: 1.8 }], sessionsTotal: 6, sessionMinutes: 210, days: [6], hour: 10, minimumLevel: 0 },
    { name: 'Dialect Coaching', provider: 'Private Coach', category: 'acting', improves: [{ key: 'dialect_acquisition', kind: 'attribute', gain: 2.4 }, { key: 'accent_retention', kind: 'attribute', gain: 1.8 }], sessionsTotal: 10, sessionMinutes: 60, days: [1, 3], hour: 11, minimumLevel: 0 },
    { name: 'Improvisation', provider: 'The Long Form', category: 'acting', improves: [{ key: 'improvisation', kind: 'attribute', gain: 2.0 }, { key: 'comedy_timing', kind: 'attribute', gain: 1.4 }, { key: 'active_listening', kind: 'attribute', gain: 1.2 }], sessionsTotal: 10, sessionMinutes: 150, days: [3], hour: 20, minimumLevel: 0 },
    { name: 'Screenwriting Fundamentals', provider: 'Northline Workshop', category: 'writing', improves: [{ key: 'story_structure', kind: 'skill', gain: 1.9 }, { key: 'dialogue', kind: 'skill', gain: 1.4 }, { key: 'character_writing', kind: 'skill', gain: 1.3 }], sessionsTotal: 12, sessionMinutes: 180, days: [1], hour: 19, minimumLevel: 0 },
    { name: 'The Writers Room', provider: 'Northline Workshop', category: 'writing', improves: [{ key: 'episode_breaking', kind: 'skill', gain: 2.0 }, { key: 'room_leadership', kind: 'skill', gain: 1.5 }, { key: 'rewriting', kind: 'skill', gain: 1.4 }], sessionsTotal: 8, sessionMinutes: 240, days: [5], hour: 14, minimumLevel: 25 },
    { name: 'Directing the Actor', provider: 'Frame Society', category: 'directing', improves: [{ key: 'actor_direction', kind: 'skill', gain: 2.1 }, { key: 'tone_control', kind: 'skill', gain: 1.3 }], sessionsTotal: 8, sessionMinutes: 210, days: [0], hour: 13, minimumLevel: 15 },
    { name: 'Visual Storytelling', provider: 'Frame Society', category: 'directing', improves: [{ key: 'visual_language', kind: 'skill', gain: 1.9 }, { key: 'coverage_planning', kind: 'skill', gain: 1.7 }, { key: 'cinematography', kind: 'skill', gain: 1.2 }], sessionsTotal: 10, sessionMinutes: 180, days: [2], hour: 18, minimumLevel: 0 },
    { name: 'Line Producing', provider: 'Below the Line', category: 'production', improves: [{ key: 'budgeting', kind: 'skill', gain: 2.2 }, { key: 'scheduling', kind: 'skill', gain: 2.0 }, { key: 'vendor_management', kind: 'skill', gain: 1.4 }], sessionsTotal: 8, sessionMinutes: 180, days: [4], hour: 18, minimumLevel: 10 },
    { name: 'Deal Making', provider: 'Blackwell Seminars', category: 'business', improves: [{ key: 'negotiation', kind: 'skill', gain: 2.0 }, { key: 'deal_structuring', kind: 'skill', gain: 1.8 }, { key: 'rights_management', kind: 'skill', gain: 1.2 }], sessionsTotal: 6, sessionMinutes: 180, days: [3], hour: 8, minimumLevel: 20 },
    { name: 'Stunt Fundamentals', provider: 'Halton Action', category: 'stunt', improves: [{ key: 'screen_fighting', kind: 'attribute', gain: 2.2 }, { key: 'stunt_aptitude', kind: 'attribute', gain: 1.8 }, { key: 'coordination', kind: 'attribute', gain: 1.4 }], sessionsTotal: 12, sessionMinutes: 120, days: [1, 4], hour: 7, minimumLevel: 0 },
    { name: 'Strength and Conditioning', provider: 'Meridian Performance', category: 'fitness', improves: [{ key: 'fitness', kind: 'skill', gain: 2.4 }, { key: 'stamina', kind: 'attribute', gain: 1.6 }, { key: 'injury_resilience', kind: 'attribute', gain: 1.0 }], sessionsTotal: 24, sessionMinutes: 60, days: [1, 3, 5], hour: 7, minimumLevel: 0 },
    { name: 'Voice and Speech', provider: 'The Hallward Studio', category: 'acting', improves: [{ key: 'projection', kind: 'attribute', gain: 1.8 }, { key: 'diction', kind: 'attribute', gain: 1.6 }, { key: 'breath_control', kind: 'attribute', gain: 1.4 }], sessionsTotal: 10, sessionMinutes: 90, days: [2, 4], hour: 9, minimumLevel: 0 },
    { name: 'Media Training', provider: 'Vantage Publicity', category: 'business', improves: [{ key: 'interview_poise', kind: 'attribute', gain: 2.4 }, { key: 'press_discipline', kind: 'attribute', gain: 2.0 }, { key: 'red_carpet_presence', kind: 'attribute', gain: 1.4 }], sessionsTotal: 4, sessionMinutes: 180, days: [5], hour: 10, minimumLevel: 30 },
  ];

  const created: Course[] = [];
  for (const template of templates) {
    if (existing.some((c) => c.name === template.name)) continue;
    const quality = rng.int(52, 96);
    const course: Course = {
      ...template,
      id: sim.nextId('course'),
      saveId: sim.universe.meta.id,
      locationId: cityId,
      instructorQuality: quality,
      costPerSession: Math.round(
        (template.category === 'fitness' ? 55_00 : template.category === 'business' ? 320_00 : 95_00)
        * col * remap(quality, 50, 100, 0.8, 1.6),
      ),
    };
    sim.universe.courses[course.id] = course;
    created.push(course);
  }
  return [...existing, ...created];
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerServices(sim: Simulation): void {
  // An appointment coming round is the care system's to ask about: play it,
  // just go, or skip it. Nothing is attended by the clock alone.
  sim.onSchedule('health.appointment', (item) => {
    sim.emit('health.appointment_due', { appointmentId: item.payload.appointmentId, itemId: item.id });
  });
  sim.onSchedule('ins.renewal', (item) => renewPolicy(sim, item.payload.policyId as Id));
  sim.onSchedule('edu.session', (item) => attendSession(sim, item.payload.enrollmentId as Id));

  // --- Healthcare ----------------------------------------------------------

  sim.onCommand<{ providerId: Id; kind?: string; at?: number }, { appointmentId: Id; at: number; estimatedCost: Money }>(
    'health.book',
    (p, { sim: s }) => {
      const provider = s.universe.healthProviders[p.providerId];
      if (!provider) throw new CommandError('No such provider.');
      const player = s.player;
      if (provider.locationId !== player.currentLocationId) {
        throw new CommandError(`${provider.name} practises in ${CITIES.require(provider.locationId).name}. You are not there.`);
      }

      const spec = SPECIALTIES.find((sp) => sp.key === provider.specialty);
      const at = p.at ?? nextOpening(s, provider);
      const conflicts = s.timeline.conflicts(at, spec?.minutes ?? 45);
      if (conflicts.length > 0) {
        throw new CommandError(`That slot collides with "${conflicts[0]?.label}". Pick another time.`);
      }

      const policy = policyFor(s, provider);
      const { covered, outOfPocket } = splitCost(provider.baseVisitCost, inNetwork(provider, policy) ? policy : undefined);

      const appointment: Appointment = {
        id: s.nextId('appt'),
        saveId: s.universe.meta.id,
        personId: player.id,
        providerId: provider.id,
        kind: p.kind ?? spec?.label ?? 'Appointment',
        at,
        durationMinutes: spec?.minutes ?? 45,
        locationId: provider.locationId,
        status: 'scheduled',
        cost: provider.baseVisitCost,
        insuranceCovered: covered,
        outOfPocket,
        policyId: policy?.id,
      };
      s.universe.appointments[appointment.id] = appointment;

      const item = s.schedule({
        at,
        kind: 'health.appointment',
        label: `${appointment.kind} — ${provider.name}`,
        category: 'health',
        payload: { appointmentId: appointment.id },
        priority: 42,
        refType: 'appointment', refId: appointment.id,
        requiresPlayer: true,
        locationId: provider.locationId,
        durationMinutes: appointment.durationMinutes,
      });
      appointment.scheduledItemId = item.id;

      s.emit('health.appointment_booked', { appointmentId: appointment.id, providerId: provider.id, at });
      return { appointmentId: appointment.id, at, estimatedCost: outOfPocket };
    },
  );

  sim.onCommand<{ appointmentId: Id }, { cancelled: boolean; fee: Money }>(
    'health.cancel',
    (p, { sim: s }) => {
      const appointment = s.universe.appointments[p.appointmentId];
      if (!appointment || appointment.status !== 'scheduled') throw new CommandError('That appointment cannot be cancelled.');
      const lateFee = appointment.at - s.now < 24 * MS_DAY / 24 ? Math.round(appointment.cost * 0.35) : 0;
      appointment.status = 'cancelled';
      if (appointment.scheduledItemId) s.timeline.cancel(appointment.scheduledItemId, s.now);
      if (lateFee > 0) {
        const accountId = s.player.primaryAccountId;
        if (accountId && s.ledger.availableFunds(accountId) >= lateFee) {
          s.expense(accountId, lateFee, 'Late cancellation fee', 'health', { refType: 'appointment', refId: appointment.id });
        }
      }
      return { cancelled: true, fee: lateFee };
    },
  );

  // Moving an appointment moves its calendar item with it: one owner, one
  // fact, checked for a clash the same way booking is.
  sim.onCommand<{ appointmentId: Id; at: number }, { at: number }>(
    'health.reschedule',
    (p, { sim: s }) => {
      const appointment = s.universe.appointments[p.appointmentId];
      if (!appointment || appointment.status !== 'scheduled') throw new CommandError('That appointment cannot be moved.');
      if (!Number.isFinite(p.at) || p.at <= s.now) throw new CommandError('Move it somewhere in the future.');
      const clash = s.timeline.conflicts(p.at, appointment.durationMinutes, appointment.scheduledItemId)[0];
      if (clash) throw new CommandError(`That slot collides with "${clash.label}". Pick another time.`);
      appointment.at = p.at;
      if (appointment.scheduledItemId) {
        const item = s.timeline.get(appointment.scheduledItemId);
        if (item && item.status === 'pending') s.timeline.reschedule(item.id, p.at);
      }
      s.resolveDecision('appointment', appointment.id);
      return { at: appointment.at };
    },
  );

  // --- Insurance -----------------------------------------------------------

  sim.onCommand<{ line: InsuranceLine; coveredRefs?: { type: string; id: Id }[]; holderId?: Id }, { premium: Money; deductible: Money; coverageLimit: Money; quoteId: Id }>(
    'ins.quote',
    (p, { sim: s }) => {
      const holderId = p.holderId ?? s.player.id;
      // A boat is not covered by a motor policy, nor a jet by a marine one:
      // the line has to be the kind's own, or the quote is refused here
      // rather than at the claim.
      for (const ref of p.coveredRefs ?? []) {
        if (ref.type !== 'vehicle') continue;
        const vehicle = s.universe.vehicles[ref.id];
        if (!vehicle) continue;
        const wanted = vehicleLineFor(vehicleKind(vehicle));
        if (p.line === 'auto' || p.line === 'marine' || p.line === 'aviation') {
          if (p.line !== wanted) throw new CommandError(`A ${KIND_PROFILE[vehicleKind(vehicle)].label.toLowerCase()} is covered by ${wanted} insurance, not ${p.line}.`);
        }
      }
      const quote = buildQuote(s, holderId, p.line, p.coveredRefs ?? []);
      const policy: InsurancePolicy = {
        id: s.nextId('policy'),
        saveId: s.universe.meta.id,
        holderId,
        holderKind: s.universe.companies[holderId] ? 'company' : 'person',
        line: p.line,
        carrier: quote.carrier,
        policyNumber: `${p.line.toUpperCase().slice(0, 3)}-${s.counter('policy').toString().padStart(6, '0')}`,
        monthlyPremium: quote.premium,
        deductible: quote.deductible,
        coverageLimit: quote.coverageLimit,
        coinsurance: quote.coinsurance,
        coveredRefs: p.coveredRefs ?? [],
        startsAt: s.now,
        endsAt: addYears(s.now, 1, s.homeZone),
        status: 'quoted',
        claimIds: [],
        quotedAt: s.now,
      };
      s.universe.insurancePolicies[policy.id] = policy;
      return { premium: quote.premium, deductible: quote.deductible, coverageLimit: quote.coverageLimit, quoteId: policy.id };
    },
  );

  sim.onCommand<{ quoteId: Id; accountId?: Id }, { policyId: Id; monthlyPremium: Money }>(
    'ins.purchase',
    (p, { sim: s }) => {
      const policy = s.universe.insurancePolicies[p.quoteId];
      if (!policy) throw new CommandError('No such quote.');
      if (policy.status !== 'quoted') throw new CommandError('That quote has already been acted on.');
      if (s.now - policy.quotedAt > 30 * MS_DAY) throw new CommandError('That quote has expired. Get a new one.');

      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < policy.monthlyPremium) {
        throw new CommandError(`The first premium is ${formatMoney(policy.monthlyPremium)}.`);
      }

      policy.status = 'active';
      s.expense(accountId, policy.monthlyPremium, `${policy.carrier} — ${policy.line} insurance`, 'insurance', { refType: 'policy', refId: policy.id });

      createBill(s, {
        payerId: policy.holderId,
        name: `${policy.carrier} ${titleCaseLabel(policy.line)} Insurance`,
        category: 'insurance',
        amount: policy.monthlyPremium,
        frequency: 'monthly',
        firstDueAt: addMonths(s.now, 1, s.homeZone),
        autopayAccountId: accountId,
        refType: 'policy', refId: policy.id,
        endsAt: policy.endsAt,
      });

      // Link the policy to what it covers.
      for (const ref of policy.coveredRefs) {
        if (ref.type === 'vehicle') { const v = s.universe.vehicles[ref.id]; if (v) v.insurancePolicyId = policy.id; }
        if (ref.type === 'property') { const pr = s.universe.properties[ref.id]; if (pr) pr.insurancePolicyId = policy.id; }
        if (ref.type === 'asset') { const a = s.universe.assets[ref.id]; if (a) { a.insurancePolicyId = policy.id; s.resolveDecision('asset', a.id, 'insurance'); } }
      }

      s.schedule({
        at: policy.endsAt, kind: 'ins.renewal',
        label: `${titleCaseLabel(policy.line)} Insurance Renewal`,
        category: 'finance', payload: { policyId: policy.id }, priority: 64,
        refType: 'policy', refId: policy.id,
      });

      s.emit('ins.policy_purchased', { policyId: policy.id, line: policy.line, premium: policy.monthlyPremium });
      return { policyId: policy.id, monthlyPremium: policy.monthlyPremium };
    },
  );

  sim.onCommand<{ policyId: Id; description: string; claimedAmount: Money; incidentAt?: number; refType?: string; refId?: Id }, { claimId: Id; status: string; approvedAmount?: Money }>(
    'ins.file_claim',
    (p, { sim: s }) => {
      const policy = s.universe.insurancePolicies[p.policyId];
      if (!policy) throw new CommandError('No such policy.');
      if (policy.status !== 'active') throw new CommandError('That policy is not active.');

      const claim: InsuranceClaim = {
        id: s.nextId('claim'),
        saveId: s.universe.meta.id,
        policyId: policy.id,
        claimantId: policy.holderId,
        incidentAt: p.incidentAt ?? s.now,
        filedAt: s.now,
        description: p.description,
        claimedAmount: p.claimedAmount,
        status: 'reviewing',
      };
      s.universe.insuranceClaims[claim.id] = claim;
      policy.claimIds.push(claim.id);

      // Undisclosed modifications are exactly the thing that gets a claim denied.
      let denialReason: string | undefined;
      if ((policy.line === 'auto' || policy.line === 'marine' || policy.line === 'aviation') && p.refType === 'vehicle' && p.refId) {
        const vehicle = s.universe.vehicles[p.refId];
        const undisclosed = vehicle?.currentConfiguration.modificationIds
          .map((id) => s.universe.vehicleModifications[id])
          .filter((m) => m && !m.removedAt && !m.insuranceDisclosed) ?? [];
        if (undisclosed.length > 0) {
          denialReason = `Undisclosed modifications on the vehicle: ${undisclosed.map((m) => m?.name).join(', ')}.`;
        }
      }

      if (denialReason) {
        claim.status = 'denied';
        claim.deniedReason = denialReason;
        s.emit('ins.claim_denied', { claimId: claim.id, reason: denialReason });
        s.notify({ category: 'insurance', title: 'Claim Denied', body: denialReason, importance: 78, route: '/workspace/insurance' });
        return { claimId: claim.id, status: claim.status };
      }

      const eligible = Math.max(0, Math.min(p.claimedAmount, policy.coverageLimit || p.claimedAmount) - policy.deductible);
      const approved = applyRate(eligible, policy.coinsurance);
      claim.status = approved >= p.claimedAmount - policy.deductible ? 'approved' : 'partially_approved';
      claim.approvedAmount = approved;

      const accountId = s.universe.people[policy.holderId]?.primaryAccountId;
      if (accountId && approved > 0) {
        s.income(accountId, approved, `Insurance payout — ${policy.carrier}`, 'insurance', { refType: 'claim', refId: claim.id });
        claim.status = 'paid';
        claim.paidAt = s.now;
      }

      // Claims raise premiums.
      claim.premiumImpact = 0.12;
      policy.monthlyPremium = applyRate(policy.monthlyPremium, 1.12);
      for (const bill of Object.values(s.universe.bills)) {
        if (bill.refType === 'policy' && bill.refId === policy.id) bill.amount = policy.monthlyPremium;
      }

      s.emit('ins.claim_settled', { claimId: claim.id, approved, deductible: policy.deductible });
      return { claimId: claim.id, status: claim.status, approvedAmount: approved };
    },
  );

  // --- Education -----------------------------------------------------------

  sim.onCommand<{ courseId: Id; accountId?: Id }, { enrollmentId: Id; totalCost: Money; firstSessionAt: number }>(
    'edu.enroll',
    (p, { sim: s }) => {
      const course = s.universe.courses[p.courseId];
      if (!course) throw new CommandError('No such course.');
      const player = s.player;
      if (course.locationId !== player.currentLocationId) {
        throw new CommandError(`${course.name} runs in ${CITIES.require(course.locationId).name}. You are not there.`);
      }
      const already = Object.values(s.universe.enrollments).find((e) => e.personId === player.id && e.courseId === course.id && e.status === 'active');
      if (already) throw new CommandError('You are already enrolled in that.');

      // Some courses expect a baseline before they will take you.
      if (course.minimumLevel > 0) {
        const relevant = course.improves[0];
        const level = relevant ? (relevant.kind === 'attribute' ? player.attributes[relevant.key] : player.skills[relevant.key]) ?? 0 : 0;
        if (level < course.minimumLevel) {
          throw new CommandError(`${course.name} expects a working level of at least ${course.minimumLevel}. You are at ${Math.round(level)}.`);
        }
      }

      const totalCost = course.costPerSession * course.sessionsTotal;
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < course.costPerSession) {
        throw new CommandError(`Sessions are ${formatMoney(course.costPerSession)} each.`);
      }

      const enrollment: Enrollment = {
        id: s.nextId('course'),
        saveId: s.universe.meta.id,
        personId: player.id,
        courseId: course.id,
        sessionsAttended: 0,
        sessionsMissed: 0,
        startedAt: s.now,
        status: 'active',
        totalPaid: 0,
        gains: {},
      };
      s.universe.enrollments[enrollment.id] = enrollment;

      const firstSessionAt = scheduleNextSession(s, enrollment, course);
      s.emit('edu.enrolled', { enrollmentId: enrollment.id, courseId: course.id, totalCost });
      return { enrollmentId: enrollment.id, totalCost, firstSessionAt };
    },
  );

  sim.onCommand<{ enrollmentId: Id }, { dropped: boolean }>(
    'edu.drop',
    (p, { sim: s }) => {
      const enrollment = s.universe.enrollments[p.enrollmentId];
      if (!enrollment || enrollment.status !== 'active') throw new CommandError('You are not enrolled in that.');
      enrollment.status = 'dropped';
      s.timeline.cancelFor('enrollment', enrollment.id, s.now);
      return { dropped: true };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function nextOpening(sim: Simulation, provider: HealthProvider): number {
  const target = addDays(sim.now, provider.leadTimeDays, sim.homeZone);
  const parts = zonedParts(target, sim.homeZone);
  // Practices work weekdays; push a weekend booking to Monday.
  const shift = parts.weekday === 0 ? 1 : parts.weekday === 6 ? 2 : 0;
  const day = shift > 0 ? addDays(target, shift, sim.homeZone) : target;
  const dayParts = zonedParts(day, sim.homeZone);
  return instantFromZoned({ year: dayParts.year, month: dayParts.month, day: dayParts.day, hour: 9 + (sim.counter('appt_slot') % 7) }, sim.homeZone);
}

export function activePolicy(sim: Simulation, holderId: Id, line: InsuranceLine): InsurancePolicy | undefined {
  return Object.values(sim.universe.insurancePolicies).find(
    (p) => p.holderId === holderId && p.line === line && p.status === 'active' && p.endsAt > sim.now,
  );
}

/** The policy that would pay for this provider's line of work, if you hold one. */
export function policyFor(sim: Simulation, provider: HealthProvider): InsurancePolicy | undefined {
  return activePolicy(sim, sim.player.id, provider.specialty === 'dentist' ? 'dental' : provider.specialty === 'optometrist' ? 'vision' : 'health');
}

/** Whether the practice takes the carrier on your card. */
export function inNetwork(provider: HealthProvider, policy: InsurancePolicy | undefined): boolean {
  return Boolean(policy && provider.acceptsInsurance.includes(policy.carrier));
}

export function splitCost(cost: Money, policy: InsurancePolicy | undefined): { covered: Money; outOfPocket: Money } {
  if (!policy) return { covered: 0, outOfPocket: cost };
  const afterDeductible = Math.max(0, cost - policy.deductible);
  const covered = Math.min(applyRate(afterDeductible, policy.coinsurance), policy.coverageLimit || afterDeductible);
  return { covered, outOfPocket: cost - covered };
}

export function buildQuote(
  sim: Simulation, holderId: Id, line: InsuranceLine, coveredRefs: { type: string; id: Id }[],
): { premium: Money; deductible: Money; coverageLimit: Money; coinsurance: number; carrier: string } {
  const product = INSURANCE_PRODUCTS.find((p) => p.line === line);
  if (!product) throw new CommandError(`No insurance product for ${line}.`);

  const person = sim.universe.people[holderId];
  const cityId = person?.currentLocationId ?? 'us-ca-losangeles';
  const col = costOfLiving(cityId);

  let insuredValue = 0;
  for (const ref of coveredRefs) {
    if (ref.type === 'vehicle') insuredValue += sim.universe.vehicles[ref.id]?.currentValue ?? 0;
    if (ref.type === 'property') insuredValue += sim.universe.properties[ref.id]?.marketValue ?? 0;
    if (ref.type === 'asset') insuredValue += sim.universe.assets[ref.id]?.currentValue ?? 0;
  }

  let premium = product.basePremium > 0
    ? Math.round(product.basePremium * col)
    : Math.round(insuredValue * (product.valueRate ?? 0.001) / 12);

  // Risk factors that a real underwriter would price.
  if (line === 'auto' && person) {
    const drivingSkill = person.skills['driving'] ?? 30;
    premium = applyRate(premium, remap(drivingSkill, 0, 100, 1.35, 0.78));
    const modified = coveredRefs.some((r) => (sim.universe.vehicles[r.id]?.currentConfiguration.modificationIds.length ?? 0) > 0);
    if (modified) premium = applyRate(premium, 1.22);
    // A motorcycle is priced harder than a car of the same value: it falls over.
    if (coveredRefs.some((r) => { const v = sim.universe.vehicles[r.id]; return v && vehicleKind(v) === 'motorcycle'; })) premium = applyRate(premium, 1.4);
  }
  if ((line === 'marine' || line === 'aviation') && person) {
    const modified = coveredRefs.some((r) => (sim.universe.vehicles[r.id]?.currentConfiguration.modificationIds.length ?? 0) > 0);
    if (modified) premium = applyRate(premium, 1.12);
    // An older hull or airframe costs more to insure than a new one.
    const oldest = Math.min(...coveredRefs.map((r) => sim.universe.vehicles[r.id]?.year ?? 9999));
    const age = Number.isFinite(oldest) && oldest < 9999 ? Math.max(0, zonedParts(sim.now, sim.homeZone).year - oldest) : 0;
    premium = applyRate(premium, 1 + Math.min(0.5, age * 0.03));
  }
  if (line === 'health' && person) {
    const age = zonedParts(sim.now, sim.homeZone).year - zonedParts(person.birthInstant, sim.homeZone).year;
    premium = applyRate(premium, remap(age, 20, 65, 0.72, 2.1));
    premium = applyRate(premium, modifierFor(person, 'injuryRisk'));
  }
  if (line === 'production') {
    premium = Math.round(insuredValue * (product.valueRate ?? 0.019));
  }

  const priorClaims = Object.values(sim.universe.insuranceClaims).filter(
    (c) => c.claimantId === holderId && c.status !== 'denied' && sim.now - c.filedAt < 3 * 365 * MS_DAY,
  ).length;
  premium = applyRate(premium, 1 + priorClaims * 0.09);

  return {
    premium: Math.max(8_00, premium),
    deductible: product.deductible,
    coverageLimit: product.coverageLimit > 0 ? product.coverageLimit : Math.round(insuredValue * 1.1),
    coinsurance: product.coinsurance,
    carrier: line === 'production' || line === 'equipment' ? 'Gable Underwriting' : line === 'health' || line === 'dental' || line === 'vision' ? 'Northbank Health' : line === 'marine' ? 'Northbank Marine' : line === 'aviation' ? 'Gable Aviation' : 'Northbank Insurance',
  };
}

/** A no-show, from wherever you were: the practice charges for it. */
export function missAppointment(sim: Simulation, appointment: Appointment, why: string): void {
  if (appointment.status !== 'scheduled') return;
  const person = sim.universe.people[appointment.personId];
  appointment.status = 'missed';
  if (appointment.scheduledItemId) sim.timeline.cancel(appointment.scheduledItemId, sim.now);
  sim.resolveDecision('appointment', appointment.id);
  const fee = Math.round(appointment.cost * 0.4);
  const accountId = person?.primaryAccountId;
  if (accountId && sim.ledger.availableFunds(accountId) >= fee) {
    sim.expense(accountId, fee, 'Missed appointment fee', 'health', { refType: 'appointment', refId: appointment.id });
  }
  sim.notify({
    category: 'health', title: 'Missed Appointment',
    body: `${why} Practices charge for a no-show: ${formatMoney(fee)}.`,
    importance: 55, route: '/workspace/health', refType: 'appointment', refId: appointment.id,
  });
  sim.emit('health.appointment_missed', { appointmentId: appointment.id, fee });
}

/** The bill at the desk: paid if the money is there, otherwise it sits as an unpaid bill that asks. */
export function chargeVisit(sim: Simulation, appointment: Appointment): { paid: boolean } {
  const provider = sim.universe.healthProviders[appointment.providerId];
  const person = sim.universe.people[appointment.personId];
  const accountId = person?.primaryAccountId;
  if (appointment.paidAt) return { paid: true };
  if (!accountId || appointment.outOfPocket <= 0) { appointment.paidAt = sim.now; return { paid: true }; }
  if (sim.ledger.availableFunds(accountId) >= appointment.outOfPocket) {
    sim.expense(accountId, appointment.outOfPocket, `${appointment.kind} — ${provider?.name ?? 'provider'}`, 'health', { refType: 'appointment', refId: appointment.id });
    appointment.paidAt = sim.now;
    return { paid: true };
  }
  sim.requireDecision({
    urgency: 70, category: 'health',
    title: 'Unpaid Medical Bill',
    detail: `${formatMoney(appointment.outOfPocket)} is owed to ${provider?.name ?? 'the practice'}.`,
    route: '/workspace/health',
    actions: [{ label: 'Pay It', commandKind: 'health.pay', payload: { appointmentId: appointment.id } }],
    refType: 'appointment', refId: appointment.id,
  });
  return { paid: false };
}

/** What the visit does for you: the same rule whether played or just done. */
export function applyCare(sim: Simulation, appointment: Appointment, fit = 1): number {
  const provider = sim.universe.healthProviders[appointment.providerId];
  const person = sim.universe.people[appointment.personId];
  if (!provider || !person) return 0;
  const spec = SPECIALTIES.find((sp) => sp.key === provider.specialty);
  const gain = (spec?.conditionGain ?? 5) * remap(provider.quality, 40, 100, 0.7, 1.4) * fit;
  person.wellbeing.condition = clamp(person.wellbeing.condition + gain, 0, 100);
  if (provider.specialty === 'counseling') {
    person.wellbeing.stress = clamp(person.wellbeing.stress - 18 * fit, 0, 100);
    person.wellbeing.morale = clamp(person.wellbeing.morale + 8 * fit, 0, 100);
  }
  if (provider.specialty === 'physical_therapy' || provider.specialty === 'chiropractor') {
    person.attributes['injury_resilience'] = clamp((person.attributes['injury_resilience'] ?? 40) + 1.2 * fit, 0, 100);
  }
  appointment.conditionGain = Math.round((appointment.conditionGain ?? 0) + gain);
  return gain;
}

/**
 * Just going: the whole visit by the same rules as the played one, with the
 * plain reason for being there and no conversation. Used by the short
 * version and by anything that needs an appointment attended in one step.
 */
export function completeAppointment(sim: Simulation, appointmentId: Id): void {
  const appointment = sim.universe.appointments[appointmentId];
  if (!appointment || appointment.status !== 'scheduled') return;
  const provider = sim.universe.healthProviders[appointment.providerId];
  const person = sim.universe.people[appointment.personId];
  if (!provider || !person) return;
  if (person.currentLocationId !== appointment.locationId) {
    missAppointment(sim, appointment, `You were not in ${CITIES.require(appointment.locationId).name} for ${appointment.kind}.`);
    return;
  }
  const spec = SPECIALTIES.find((sp) => sp.key === provider.specialty);
  appointment.checkedInAt ??= sim.now;
  appointment.consultedAt ??= sim.now;
  const gain = applyCare(sim, appointment);
  appointment.status = 'completed';
  appointment.outcome ??= provider.specialty === 'primary' ? 'Routine check. Nothing of concern.' : `${spec?.label ?? 'Visit'} complete.`;
  if (provider.specialty === 'primary') appointment.followUpAt ??= addYears(sim.now, 1, sim.homeZone);
  if (appointment.scheduledItemId) sim.timeline.cancel(appointment.scheduledItemId, sim.now);
  sim.resolveDecision('appointment', appointment.id);
  const { paid } = chargeVisit(sim, appointment);
  if (provider.specialty === 'primary') {
    sim.notify({
      category: 'health', title: 'Checkup Complete',
      body: `${provider.name} suggests coming back in a year. ${paid ? `${formatMoney(appointment.outOfPocket)} out of pocket.` : `${formatMoney(appointment.outOfPocket)} still owed.`}`,
      importance: 30, route: '/workspace/health', refType: 'appointment', refId: appointment.id,
    });
  }
  sim.emit('health.appointment_completed', { appointmentId: appointment.id, providerId: provider.id, conditionGain: gain });
}

function renewPolicy(sim: Simulation, policyId: Id): void {
  const policy = sim.universe.insurancePolicies[policyId];
  if (!policy || policy.status !== 'active') return;

  const quote = buildQuote(sim, policy.holderId, policy.line, policy.coveredRefs);
  const oldPremium = policy.monthlyPremium;
  policy.monthlyPremium = quote.premium;
  policy.endsAt = addYears(sim.now, 1, sim.homeZone);

  for (const bill of Object.values(sim.universe.bills)) {
    if (bill.refType === 'policy' && bill.refId === policy.id) {
      bill.amount = policy.monthlyPremium;
      bill.endsAt = policy.endsAt;
      bill.active = true;
    }
  }

  sim.schedule({
    at: policy.endsAt, kind: 'ins.renewal',
    label: `${titleCaseLabel(policy.line)} Insurance Renewal`,
    category: 'finance', payload: { policyId: policy.id }, priority: 64,
    refType: 'policy', refId: policy.id,
  });

  if (Math.abs(policy.monthlyPremium - oldPremium) > oldPremium * 0.1) {
    sim.notify({
      category: 'insurance',
      title: `${policy.line} Premium Changed`,
      body: `${formatMoney(oldPremium)} to ${formatMoney(policy.monthlyPremium)} a month at renewal.`,
      importance: 45, route: '/workspace/insurance',
    });
  }
  sim.emit('ins.renewed', { policyId: policy.id, premium: policy.monthlyPremium, previousPremium: oldPremium });
}

function scheduleNextSession(sim: Simulation, enrollment: Enrollment, course: Course): number {
  let day = addDays(sim.now, 1, sim.homeZone);
  for (let i = 0; i < 14; i++) {
    const parts = zonedParts(day, sim.homeZone);
    if (course.days.includes(parts.weekday)) {
      const at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: course.hour }, sim.homeZone);
      if (at > sim.now) {
        sim.schedule({
          at,
          kind: 'edu.session',
          label: `${course.name} — Session ${enrollment.sessionsAttended + 1}`,
          category: 'education',
          payload: { enrollmentId: enrollment.id },
          priority: 52,
          refType: 'enrollment', refId: enrollment.id,
          requiresPlayer: true,
          locationId: course.locationId,
          durationMinutes: course.sessionMinutes,
        });
        return at;
      }
    }
    day = addDays(day, 1, sim.homeZone);
  }
  return sim.now;
}

function attendSession(sim: Simulation, enrollmentId: Id): void {
  const enrollment = sim.universe.enrollments[enrollmentId];
  if (!enrollment || enrollment.status !== 'active') return;
  const course = sim.universe.courses[enrollment.courseId];
  const person = sim.universe.people[enrollment.personId];
  if (!course || !person) return;

  const present = person.currentLocationId === course.locationId && person.wellbeing.energy > 12;
  if (!present) {
    enrollment.sessionsMissed += 1;
    if (enrollment.sessionsAttended + enrollment.sessionsMissed < course.sessionsTotal) {
      scheduleNextSession(sim, enrollment, course);
    }
    return;
  }

  const accountId = person.primaryAccountId;
  if (accountId && sim.ledger.availableFunds(accountId) >= course.costPerSession) {
    sim.expense(accountId, course.costPerSession, `${course.name} — session`, 'education', { refType: 'enrollment', refId: enrollment.id });
    enrollment.totalPaid += course.costPerSession;
  } else {
    enrollment.status = 'dropped';
    sim.notify({ category: 'education', title: `Dropped From ${course.name}`, body: 'The session fee could not be paid.', importance: 50, route: '/workspace/education' });
    return;
  }

  const trainingGain = modifierFor(person, 'trainingGain');
  const focus = clamp(person.wellbeing.energy / 100 * 0.5 + (1 - person.wellbeing.stress / 100) * 0.5, 0.3, 1.1);
  const instructorFactor = remap(course.instructorQuality, 40, 100, 0.7, 1.4);

  for (const improvement of course.improves) {
    const sheet = improvement.kind === 'attribute' ? person.attributes : person.skills;
    const current = sheet[improvement.key] ?? 0;
    const headroom = remap(current, 0, 100, 1.0, 0.15);
    const gain = improvement.gain * trainingGain * focus * instructorFactor * headroom;
    sheet[improvement.key] = clamp(current + gain, 0, 100);
    enrollment.gains[improvement.key] = (enrollment.gains[improvement.key] ?? 0) + gain;
  }

  person.wellbeing.energy = clamp(person.wellbeing.energy - course.sessionMinutes / 22, 0, 100);
  enrollment.sessionsAttended += 1;

  if (enrollment.sessionsAttended >= course.sessionsTotal) {
    enrollment.status = 'completed';
    enrollment.completedAt = sim.now;
    sim.remember({
      category: 'education',
      title: `Completed ${course.name}`,
      detail: `${course.provider}. ${Object.entries(enrollment.gains).map(([k, v]) => `${k.replace(/_/g, ' ')} +${v.toFixed(1)}`).join(', ')}.`,
      refs: [{ type: 'course', id: course.id }],
      significance: 35, public: false, amount: enrollment.totalPaid,
    });
    sim.emit('edu.completed', { enrollmentId: enrollment.id, courseId: course.id, gains: enrollment.gains });
  } else {
    scheduleNextSession(sim, enrollment, course);
  }
}

/** Human summary of a policy for the insurance workspace. */
export function describeCoverage(policy: InsurancePolicy): string {
  return `${formatMoney(policy.monthlyPremium)} a month. ${formatMoney(policy.deductible)} deductible, then ${Math.round(policy.coinsurance * 100)}% covered up to ${formatMoney(policy.coverageLimit)}. Renews ${formatDate(policy.endsAt, 'UTC')}.`;
}

export function upcomingAppointments(sim: Simulation, personId: Id): Appointment[] {
  return Object.values(sim.universe.appointments)
    .filter((a) => a.personId === personId && a.status === 'scheduled' && a.at >= sim.now)
    .sort((a, b) => a.at - b.at);
}

export function formatAppointment(sim: Simulation, appointment: Appointment): string {
  const provider = sim.universe.healthProviders[appointment.providerId];
  return `${appointment.kind} with ${provider?.name ?? 'a provider'} on ${formatDate(appointment.at, sim.homeZone)} at ${formatTime(appointment.at, sim.homeZone)}`;
}
