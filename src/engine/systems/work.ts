/**
 * SLATE — Ordinary employment.
 *
 * You do not have to become famous. You can get a job, show up, get paid, get
 * promoted and build a life. And when a shift collides with an audition, that
 * is a real choice with real consequences on both sides.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { ApplicationStage, Id, Job, JobApplication, JobOpening, PayBasis, Person } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY, MS_HOUR } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { buildFactors } from '../core/audit';
import { createBill } from './finance';
import { readiness } from './life';

export interface JobTemplate {
  title: string;
  sector: string;
  payBasis: PayBasis;
  /** National baseline pay in cents; scaled by local cost of living. */
  basePay: Money;
  hoursPerWeek: number;
  workDays: number[];
  startHour: number;
  requirements: { skill: string; min: number }[];
  minimumAge: number;
  competition: number;
  ladder: string[];
  benefits: Job['benefits'];
  description: string;
  /** How much this job helps an entertainment career, 0-1. */
  industryAdjacency: number;
}

const NO_BENEFITS: Job['benefits'] = { health: false, dental: false, vision: false, retirement: false, paidLeave: 0 };
const BASIC_BENEFITS: Job['benefits'] = { health: true, dental: true, vision: false, retirement: false, paidLeave: 10 };
const FULL_BENEFITS: Job['benefits'] = { health: true, dental: true, vision: true, retirement: true, paidLeave: 15 };

export const JOB_TEMPLATES: readonly JobTemplate[] = [
  { title: 'Barista', sector: 'hospitality', payBasis: 'hourly', basePay: 18_50, hoursPerWeek: 28, workDays: [1, 2, 3, 5, 6], startHour: 6, requirements: [], minimumAge: 16, competition: 45, ladder: ['Barista', 'Shift Lead', 'Assistant Manager', 'Store Manager'], benefits: NO_BENEFITS, description: 'Early mornings, flexible enough to audition around, and everyone here is doing something else too.', industryAdjacency: 0.35 },
  { title: 'Server', sector: 'hospitality', payBasis: 'hourly', basePay: 16_00, hoursPerWeek: 30, workDays: [3, 4, 5, 6, 0], startHour: 16, requirements: [], minimumAge: 18, competition: 50, ladder: ['Server', 'Head Server', 'Floor Manager', 'General Manager'], benefits: NO_BENEFITS, description: 'Evening shifts, cash on the night, and daytime free for auditions.', industryAdjacency: 0.4 },
  { title: 'Bartender', sector: 'hospitality', payBasis: 'hourly', basePay: 21_00, hoursPerWeek: 32, workDays: [4, 5, 6, 0], startHour: 18, requirements: [{ skill: 'public_speaking', min: 15 }], minimumAge: 21, competition: 58, ladder: ['Bartender', 'Head Bartender', 'Bar Manager', 'Beverage Director'], benefits: NO_BENEFITS, description: 'Late, loud, well paid on a good night, and full of people in the business.', industryAdjacency: 0.5 },
  { title: 'Retail Associate', sector: 'retail', payBasis: 'hourly', basePay: 17_25, hoursPerWeek: 32, workDays: [1, 2, 4, 5, 6], startHour: 10, requirements: [], minimumAge: 16, competition: 40, ladder: ['Retail Associate', 'Key Holder', 'Assistant Manager', 'Store Manager'], benefits: BASIC_BENEFITS, description: 'Predictable, unglamorous and reliably there when you need it.', industryAdjacency: 0.1 },
  { title: 'Rideshare Driver', sector: 'gig', payBasis: 'hourly', basePay: 22_00, hoursPerWeek: 25, workDays: [0, 1, 2, 3, 4, 5, 6], startHour: 7, requirements: [{ skill: 'driving', min: 25 }], minimumAge: 21, competition: 20, ladder: ['Rideshare Driver'], benefits: NO_BENEFITS, description: 'Entirely your own schedule, which is worth more than the money.', industryAdjacency: 0.15 },
  { title: 'Office Administrator', sector: 'office', payBasis: 'salary', basePay: 52_000_00, hoursPerWeek: 40, workDays: [1, 2, 3, 4, 5], startHour: 9, requirements: [{ skill: 'operations', min: 20 }], minimumAge: 18, competition: 62, ladder: ['Office Administrator', 'Office Manager', 'Operations Coordinator', 'Operations Manager'], benefits: FULL_BENEFITS, description: 'Nine to five, health insurance, and no flexibility whatsoever.', industryAdjacency: 0.05 },
  { title: 'Personal Assistant', sector: 'industry', payBasis: 'salary', basePay: 58_000_00, hoursPerWeek: 55, workDays: [1, 2, 3, 4, 5, 6], startHour: 8, requirements: [{ skill: 'operations', min: 25 }, { skill: 'leadership', min: 15 }], minimumAge: 20, competition: 78, ladder: ['Personal Assistant', 'Executive Assistant', 'Chief of Staff', 'Development Executive'], benefits: BASIC_BENEFITS, description: 'Brutal hours next to someone who can make one phone call and change your life.', industryAdjacency: 0.95 },
  { title: 'Production Assistant', sector: 'industry', payBasis: 'daily', basePay: 240_00, hoursPerWeek: 60, workDays: [1, 2, 3, 4, 5], startHour: 6, requirements: [], minimumAge: 18, competition: 70, ladder: ['Production Assistant', 'Key PA', 'Second Second AD', 'Second AD', 'First AD'], benefits: NO_BENEFITS, description: 'Fourteen-hour days at the bottom of the call sheet. Everybody on set started here.', industryAdjacency: 1.0 },
  { title: 'Camera Trainee', sector: 'industry', payBasis: 'daily', basePay: 310_00, hoursPerWeek: 55, workDays: [1, 2, 3, 4, 5], startHour: 6, requirements: [{ skill: 'camera_operation', min: 20 }], minimumAge: 18, competition: 74, ladder: ['Camera Trainee', 'Second Assistant Camera', 'First Assistant Camera', 'Camera Operator', 'Director of Photography'], benefits: NO_BENEFITS, description: 'Carrying cases and learning the department from the inside.', industryAdjacency: 1.0 },
  { title: 'Script Reader', sector: 'industry', payBasis: 'per_project', basePay: 85_00, hoursPerWeek: 12, workDays: [2, 4], startHour: 10, requirements: [{ skill: 'story_structure', min: 30 }], minimumAge: 18, competition: 66, ladder: ['Script Reader', 'Story Analyst', 'Story Editor', 'Development Executive'], benefits: NO_BENEFITS, description: 'Coverage on other people’s scripts, paid badly, and the fastest way to learn structure.', industryAdjacency: 0.9 },
  { title: 'Fitness Instructor', sector: 'services', payBasis: 'hourly', basePay: 34_00, hoursPerWeek: 22, workDays: [1, 2, 3, 4, 5], startHour: 6, requirements: [{ skill: 'fitness', min: 45 }], minimumAge: 18, competition: 48, ladder: ['Fitness Instructor', 'Senior Trainer', 'Studio Lead', 'Studio Owner'], benefits: NO_BENEFITS, description: 'Good money per hour, keeps you in shape, and the clients are frequently useful.', industryAdjacency: 0.4 },
  { title: 'Tutor', sector: 'services', payBasis: 'hourly', basePay: 45_00, hoursPerWeek: 14, workDays: [2, 3, 4], startHour: 15, requirements: [{ skill: 'public_speaking', min: 25 }], minimumAge: 18, competition: 42, ladder: ['Tutor', 'Senior Tutor', 'Tutoring Coordinator'], benefits: NO_BENEFITS, description: 'Few hours, good rate, entirely on your own terms.', industryAdjacency: 0.05 },
  { title: 'Warehouse Operative', sector: 'logistics', payBasis: 'hourly', basePay: 20_50, hoursPerWeek: 40, workDays: [1, 2, 3, 4, 5], startHour: 5, requirements: [], minimumAge: 18, competition: 25, ladder: ['Warehouse Operative', 'Team Lead', 'Shift Supervisor', 'Warehouse Manager'], benefits: BASIC_BENEFITS, description: 'Physical, early and steady. Done by two in the afternoon.', industryAdjacency: 0.0 },
  { title: 'Junior Developer', sector: 'technology', payBasis: 'salary', basePay: 88_000_00, hoursPerWeek: 40, workDays: [1, 2, 3, 4, 5], startHour: 9, requirements: [{ skill: 'operations', min: 30 }], minimumAge: 20, competition: 80, ladder: ['Junior Developer', 'Developer', 'Senior Developer', 'Lead Engineer'], benefits: FULL_BENEFITS, description: 'Real money, real benefits, and almost no room for a Tuesday audition.', industryAdjacency: 0.0 },
];

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerWork(sim: Simulation): void {
  sim.onSchedule('work.shift', (item) => workShift(sim, item.payload.jobId as Id, item.durationMinutes ?? 480));

  // A job keeps producing work. Laying out one fixed batch of shifts at hire
  // and never topping it up means employment quietly stops after three months:
  // the person still has the job, and never works another day of it.
  sim.onSchedule('work.extend_rota', (item) => {
    const job = sim.universe.jobs[item.payload.jobId as Id];
    if (!job || job.endedAt) return;
    scheduleShifts(sim, job, SHIFT_HORIZON_DAYS);
    sim.schedule({
      at: addDays(sim.now, SHIFT_HORIZON_DAYS - 14, sim.homeZone),
      kind: 'work.extend_rota',
      label: `Rota — ${job.employerName}`,
      category: 'work',
      payload: { jobId: job.id },
      priority: 92,
      refType: 'job', refId: job.id,
    });
  });

  sim.onSchedule('work.interview', (item) => {
    const app = sim.universe.jobApplications[item.payload.applicationId as Id];
    if (!app || app.stage !== 'interview') return;
    decideApplication(sim, app);
  });

  sim.onSchedule('work.screening', (item) => {
    const app = sim.universe.jobApplications[item.payload.applicationId as Id];
    if (!app || app.stage !== 'submitted') return;
    screenApplication(sim, app);
  });

  sim.onSchedule('work.review', (item) => {
    const job = sim.universe.jobs[item.payload.jobId as Id];
    if (!job || job.endedAt) return;
    performanceReview(sim, job);
  });

  sim.onSchedule('work.offer_expires', (item) => {
    const app = sim.universe.jobApplications[item.payload.applicationId as Id];
    if (!app || app.stage !== 'offer') return;
    app.stage = 'withdrawn';
    app.decidedAt = sim.now;
    sim.resolveDecision('application', app.id);
    const opening = sim.universe.jobOpenings[app.openingId];
    sim.notify({
      category: 'career',
      title: `Offer withdrawn: ${opening?.title ?? 'a role'}`,
      body: `${opening?.employerName ?? 'The employer'} needed an answer and did not get one. They have gone to someone else.`,
      importance: 55,
      route: '/workspace/jobs',
    });
    sim.emit('work.offer_expired', { applicationId: app.id });
  });

  sim.onSchedule('work.refresh_openings', () => {
    refreshOpenings(sim);
    sim.schedule({
      at: addDays(sim.now, 7, sim.homeZone),
      kind: 'work.refresh_openings',
      label: 'New Job Listings',
      category: 'career',
      priority: 60,
    });
  });

  // --- Commands ------------------------------------------------------------

  sim.onCommand<{ openingId: Id }, { applicationId: Id; stage: string }>(
    'work.apply',
    (p, { sim: s }) => {
      const opening = s.universe.jobOpenings[p.openingId];
      if (!opening) throw new CommandError('That listing is no longer available.');
      if (opening.closesAt < s.now) throw new CommandError('That listing has closed.');
      const person = s.player;

      const age = zonedParts(s.now, s.homeZone).year - zonedParts(person.birthInstant, s.homeZone).year;
      if (age < opening.minimumAge) throw new CommandError(`You must be at least ${opening.minimumAge} for that role.`);

      const existing = Object.values(s.universe.jobApplications).find(
        (a) => a.openingId === p.openingId && a.personId === person.id && !['rejected', 'withdrawn'].includes(a.stage),
      );
      if (existing) throw new CommandError('You have already applied for that.');

      const app: JobApplication = {
        id: s.nextId('application'),
        saveId: s.universe.meta.id,
        personId: person.id,
        openingId: opening.id,
        stage: 'submitted',
        submittedAt: s.now,
      };
      s.universe.jobApplications[app.id] = app;

      s.schedule({
        at: addDays(s.now, s.rng('hiring', app.id).int(2, 6), s.homeZone),
        kind: 'work.screening',
        label: `${opening.employerName} — Application Review`,
        category: 'career',
        payload: { applicationId: app.id },
        priority: 55,
        refType: 'application',
        refId: app.id,
      });

      s.emit('work.applied', { applicationId: app.id, openingId: opening.id, personId: person.id });
      return { applicationId: app.id, stage: app.stage };
    },
  );

  sim.onCommand<{ applicationId: Id }, { accepted: boolean; jobId?: Id }>(
    'work.accept_offer',
    (p, { sim: s }) => {
      const app = s.universe.jobApplications[p.applicationId];
      if (!app) throw new CommandError('No such application.');
      if (app.stage !== 'offer') throw new CommandError('There is no live offer on that application.');
      const opening = s.universe.jobOpenings[app.openingId];
      if (!opening) throw new CommandError('That role no longer exists.');

      const person = s.universe.people[app.personId];
      if (!person) throw new CommandError('No such person.');
      if (person.jobId && !s.universe.jobs[person.jobId]?.endedAt) {
        throw new CommandError('You already have a job. Resign from it first.');
      }

      const job = hire(s, person, opening);
      app.stage = 'hired';
      app.decidedAt = s.now;
      s.resolveDecision('application', app.id);
      return { accepted: true, jobId: job.id };
    },
  );

  sim.onCommand<{ applicationId: Id }, { declined: boolean }>(
    'work.decline_offer',
    (p, { sim: s }) => {
      const app = s.universe.jobApplications[p.applicationId];
      if (!app) throw new CommandError('No such application.');
      app.stage = 'withdrawn';
      app.decidedAt = s.now;
      s.resolveDecision('application', app.id);
      return { declined: true };
    },
  );

  sim.onCommand<{ jobId: Id; reason?: string; noticeDays?: number }, { endsAt: number }>(
    'work.resign',
    (p, { sim: s }) => {
      const job = s.universe.jobs[p.jobId];
      if (!job || job.endedAt) throw new CommandError('You are not employed there.');
      const notice = clamp(p.noticeDays ?? 14, 0, 90);
      const endsAt = addDays(s.now, notice, s.homeZone);

      job.endedAt = endsAt;
      job.endReason = p.reason ?? 'Resigned';
      s.timeline.cancelFor('job', job.id, s.now);

      // Pay out anything accrued at the end date.
      s.schedule({
        at: endsAt,
        kind: 'finance.payday',
        label: `Final Pay — ${job.employerName}`,
        category: 'finance',
        payload: { jobId: job.id },
        priority: 10,
        refType: 'job',
        refId: job.id,
      });

      const person = s.universe.people[job.personId];
      if (person && person.jobId === job.id) person.jobId = undefined;

      s.remember({
        category: 'career',
        title: `Left ${job.employerName}`,
        detail: `${job.title} at ${job.employerName}. ${notice > 0 ? `${notice} days' notice.` : 'Effective immediately.'}`,
        refs: [{ type: 'job', id: job.id }],
        significance: 35, public: false,
      });
      s.emit('work.resigned', { jobId: job.id, personId: job.personId, endsAt, notice });
      return { endsAt };
    },
  );

  sim.onCommand<{ jobId: Id }, { promoted: boolean; newTitle?: string; newPay?: Money }>(
    'work.request_promotion',
    (p, { sim: s }) => {
      const job = s.universe.jobs[p.jobId];
      if (!job || job.endedAt) throw new CommandError('You are not employed there.');
      const nextIndex = job.level + 1;
      if (nextIndex >= job.ladder.length) throw new CommandError('You are already at the top of this ladder.');

      const monthsHeld = (s.now - job.startedAt) / (30.44 * MS_DAY);
      const rng = s.rng('promotion', job.id, Math.floor(monthsHeld));
      const { factors, score } = buildFactors([
        { label: 'Performance Rating', detail: `Your manager rates you ${Math.round(job.performance)} out of 100.`, weight: 0.42, value: job.performance / 100 },
        { label: 'Attendance', detail: `Attendance is at ${Math.round(job.attendance)}%.`, weight: 0.22, value: job.attendance / 100 },
        { label: 'Time In Role', detail: `${monthsHeld.toFixed(1)} months in the role.`, weight: 0.24, value: clamp(monthsHeld / 14, 0, 1) },
        { label: 'Openings Above You', detail: 'Whether there is anywhere to be promoted into right now.', weight: 0.12, value: rng.float(0.2, 1), knowable: false },
      ]);

      const roll = rng.next();
      const probability = clamp(score * 1.05 - 0.28, 0.02, 0.94);
      const promoted = roll < probability;

      s.audit({
        kind: 'work.promotion_decided',
        subjectType: 'job', subjectId: job.id,
        question: 'Why was I promoted, or not?',
        summary: promoted
          ? `Promoted to ${job.ladder[nextIndex]}. Your performance and time in role carried it.`
          : `Not promoted this time. ${job.performance < 65 ? 'Your performance rating is the thing holding it back.' : 'It was close, and there was nowhere to move you into.'}`,
        factors,
        seed: `promotion|${job.id}|${Math.floor(monthsHeld)}`,
        roll, probability, score,
        outcome: promoted ? 'promoted' : 'declined',
      });

      if (!promoted) {
        s.emit('work.promotion_declined', { jobId: job.id, personId: job.personId });
        return { promoted: false };
      }

      job.level = nextIndex;
      job.title = job.ladder[nextIndex] as string;
      job.payRate = applyRate(job.payRate, 1.18);
      job.performance = clamp(job.performance - 8, 0, 100);

      s.remember({
        category: 'career',
        title: `Promoted to ${job.title}`,
        detail: `${job.employerName}. New rate ${describePay(job)}.`,
        refs: [{ type: 'job', id: job.id }],
        significance: 45, public: false,
      });
      s.emit('work.promoted', { jobId: job.id, personId: job.personId, title: job.title, payRate: job.payRate });
      return { promoted: true, newTitle: job.title, newPay: job.payRate };
    },
  );

  sim.onCommand<{ jobId: Id; date: number; reason: string }, { approved: boolean }>(
    'work.request_time_off',
    (p, { sim: s }) => {
      const job = s.universe.jobs[p.jobId];
      if (!job || job.endedAt) throw new CommandError('You are not employed there.');
      const rng = s.rng('timeoff', job.id, p.date);
      const probability = clamp(0.35 + job.performance / 220 + job.attendance / 300 + (job.benefits.paidLeave > 0 ? 0.15 : 0), 0.1, 0.95);
      const approved = rng.next() < probability;
      if (approved) {
        const dayStart = instantFromZoned({ ...zonedParts(p.date, s.homeZone), hour: 0, minute: 0 }, s.homeZone);
        for (const item of s.timeline.between(dayStart, dayStart + MS_DAY)) {
          if (item.kind === 'work.shift' && item.refId === job.id) s.timeline.cancel(item.id, s.now);
        }
      }
      s.emit('work.time_off_decided', { jobId: job.id, approved, date: p.date, reason: p.reason });
      return { approved };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function describePay(job: Job): string {
  switch (job.payBasis) {
    case 'hourly': return `${formatMoney(job.payRate)}/hour`;
    case 'daily': return `${formatMoney(job.payRate)}/day`;
    case 'salary': return `${formatMoney(job.payRate)}/year`;
    case 'per_project': return `${formatMoney(job.payRate)} per assignment`;
    default: return formatMoney(job.payRate);
  }
}

/** What an advertised role would be worth over a year, before tax. */
export function annualisedOpeningPay(opening: JobOpening): Money {
  switch (opening.payBasis) {
    case 'hourly': return Math.round(opening.payRate * opening.hoursPerWeek * 52);
    case 'daily': return Math.round(opening.payRate * 250);
    case 'salary': return opening.payRate;
    case 'per_project': return Math.round(opening.payRate * 40);
    default: return opening.payRate;
  }
}

export function annualisedPay(job: Job): Money {
  switch (job.payBasis) {
    case 'hourly': return Math.round(job.payRate * job.hoursPerWeek * 52);
    case 'daily': return Math.round(job.payRate * job.workDays.length * 50);
    case 'salary': return job.payRate;
    case 'per_project': return Math.round(job.payRate * 40);
    default: return job.payRate;
  }
}

/** Creates a batch of openings appropriate to a city. */
/** Stages where the employer is still considering the person. */
const LIVE_APPLICATION_STAGES: readonly ApplicationStage[] = ['submitted', 'screening', 'interview', 'offer'];

/** How long a job offer stays open before it is withdrawn. */
const OFFER_WINDOW_DAYS = 10;

export function refreshOpenings(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const cityId = player.currentLocationId;
  const city = CITIES.require(cityId);
  const col = costOfLiving(cityId);

  // Retire stale listings — but never one somebody is still in process on. An
  // offer that cannot be accepted because the advert came down is not a
  // closing date, it is a job vanishing out from under the person who got it.
  const inProcess = new Set<Id>();
  for (const app of Object.values(sim.universe.jobApplications)) {
    if (LIVE_APPLICATION_STAGES.includes(app.stage)) inProcess.add(app.openingId);
  }
  for (const [id, opening] of Object.entries(sim.universe.jobOpenings)) {
    if (opening.closesAt < sim.now && !inProcess.has(id)) delete sim.universe.jobOpenings[id];
  }

  const rng = sim.rng('job_openings', cityId, Math.floor(sim.now / (7 * MS_DAY)));
  const count = clamp(Math.round(remap(city.jobMarketDepth, 0, 100, 3, 11)), 3, 12);

  for (let i = 0; i < count; i++) {
    const template = rng.weighted(JOB_TEMPLATES, (t) =>
      t.sector === 'industry' ? Math.max(4, city.industryPresence) : 40,
    );
    const variance = rng.float(0.92, 1.12);
    const opening: JobOpening = {
      id: sim.nextId('job'),
      saveId: sim.universe.meta.id,
      employerName: employerName(rng.int(0, 9999), template.sector),
      title: template.title,
      sector: template.sector,
      locationId: cityId,
      payBasis: template.payBasis,
      payRate: Math.round(template.basePay * col * variance),
      hoursPerWeek: template.hoursPerWeek,
      requirements: template.requirements,
      minimumAge: template.minimumAge,
      description: template.description,
      competition: clamp(Math.round(template.competition + remap(city.jobMarketDepth, 0, 100, 12, -8) + rng.int(-8, 8)), 5, 96),
      postedAt: sim.now,
      closesAt: addDays(sim.now, rng.int(9, 24), sim.homeZone),
      benefits: template.benefits,
    };
    sim.universe.jobOpenings[opening.id] = opening;
  }
  sim.emit('work.openings_refreshed', { cityId, count });
}

const EMPLOYER_PREFIX = ['Alder', 'Basin', 'Cedar', 'Dockside', 'Eastgate', 'Fairmount', 'Grove', 'Harbour', 'Ivy', 'Juniper', 'Kingfisher', 'Lantern', 'Meadow', 'Northline', 'Orchard', 'Pier', 'Quarry', 'Riverside', 'Summit', 'Tidal'];
const EMPLOYER_SUFFIX: Record<string, string[]> = {
  hospitality: ['Coffee', 'Kitchen', 'Tavern', 'Bar', 'Cafe', 'Bistro'],
  retail: ['Supply', 'Goods', 'Outfitters', 'Market', 'Shop'],
  office: ['Group', 'Associates', 'Partners', 'Consulting'],
  industry: ['Productions', 'Pictures', 'Media', 'Studios'],
  services: ['Studio', 'Wellness', 'Practice', 'Collective'],
  logistics: ['Logistics', 'Distribution', 'Freight'],
  technology: ['Systems', 'Labs', 'Software'],
  gig: ['Platform', 'Network'],
};

function employerName(seed: number, sector: string): string {
  const prefix = EMPLOYER_PREFIX[seed % EMPLOYER_PREFIX.length] as string;
  const suffixes = EMPLOYER_SUFFIX[sector] ?? ['Company'];
  const suffix = suffixes[(seed >> 3) % suffixes.length] as string;
  return `${prefix} ${suffix}`;
}

/** Scores a candidate against an opening. Deterministic and audited. */
export function scoreCandidate(sim: Simulation, person: Person, opening: JobOpening): { score: number; factors: ReturnType<typeof buildFactors>['factors'] } {
  const requirementFit = opening.requirements.length === 0
    ? 0.72
    : opening.requirements.reduce((s, r) => s + clamp((person.skills[r.skill] ?? 0) / Math.max(1, r.min), 0, 1.4), 0) / opening.requirements.length / 1.4;

  const experienceYears = Object.values(sim.universe.jobs)
    .filter((j) => j.personId === person.id)
    .reduce((s, j) => s + ((j.endedAt ?? sim.now) - j.startedAt) / (365.25 * MS_DAY), 0);

  const rng = sim.rng('candidate', person.id, opening.id);

  // How much the job actually asks for. A counter shift and a head of
  // development are not scored the same way: nobody's first job can require a
  // work history, and weighting one heavily means an ordinary person can never
  // start. The demands of the listing decide how much history matters.
  const bar = opening.requirements.length === 0
    ? 0
    : clamp(opening.requirements.reduce((s, r) => s + r.min, 0) / opening.requirements.length / 70, 0, 1);
  const historyWeight = 0.04 + bar * 0.24;

  // Meeting the stated bar makes you a real candidate, and being contested
  // matters much less once you are one.
  const meetsTheBar = opening.requirements.every((r) => (person.skills[r.skill] ?? 0) >= r.min);
  const competitionWeight = meetsTheBar ? -0.10 : -0.22;

  const { factors, score } = buildFactors([
    { label: 'Skills Against The Requirements', detail: opening.requirements.length === 0 ? 'No specific requirements listed.' : `They asked for ${opening.requirements.map((r) => `${r.skill.replace(/_/g, ' ')} ${r.min}+`).join(', ')}. ${meetsTheBar ? 'You meet it.' : 'You are short on at least one.'}`, weight: 0.34, value: requirementFit },
    { label: 'Work History', detail: bar === 0
      ? `${experienceYears.toFixed(1)} years on record, and this job does not ask for any.`
      : `${experienceYears.toFixed(1)} years of employment on record.`, weight: historyWeight, value: clamp(experienceYears / 5, 0, 1) },
    { label: 'How You Came Across', detail: 'Presentation, warmth and whether you seemed like someone they want around.', weight: 0.18, value: clamp((person.personality.extraversion * 0.5 + person.personality.agreeableness * 0.5) / 100, 0, 1) },
    { label: 'Reliability', detail: 'References, punctuality and whether you look like you will show up.', weight: 0.16, value: clamp(((person.attributes['reliability'] ?? 40) + (person.attributes['punctuality'] ?? 40)) / 200, 0, 1) },
    { label: 'Competition For The Role', detail: `${opening.competition} out of 100 for how contested this listing is.${meetsTheBar ? ' You are qualified, which takes most of the sting out of it.' : ''}`, weight: competitionWeight, value: opening.competition / 100 },
    { label: 'Other Candidates', detail: 'Who else applied, which you have no way of knowing.', weight: 0.14, value: rng.float(0, 1), knowable: false },
  ]);

  return { score: clamp(score, 0, 1.2), factors };
}

function screenApplication(sim: Simulation, app: JobApplication): void {
  const opening = sim.universe.jobOpenings[app.openingId];
  const person = sim.universe.people[app.personId];
  if (!opening || !person) { app.stage = 'rejected'; return; }

  const { score, factors } = scoreCandidate(sim, person, opening);
  app.score = Math.round(score * 100);
  const rng = sim.rng('screening', app.id);
  const probability = clamp(score * 1.25 - 0.06, 0.03, 0.92);
  const roll = rng.next();

  if (roll >= probability) {
    app.stage = 'rejected';
    app.decidedAt = sim.now;
    sim.audit({
      kind: 'work.application_screened', subjectType: 'application', subjectId: app.id,
      question: 'Why did I not get an interview?',
      summary: `${opening.employerName} did not move you to interview for ${opening.title}.`,
      factors, seed: `screening|${app.id}`, roll, probability, score,
      outcome: 'rejected',
    });
    sim.notify({ category: 'career', title: `No interview: ${opening.title}`, body: `${opening.employerName} passed on your application.`, importance: 30, route: '/workspace/jobs' });
    return;
  }

  app.stage = 'interview';
  const interviewAt = nextBusinessHour(sim, addDays(sim.now, rng.int(3, 9), sim.homeZone), 11);
  app.interviewAt = interviewAt;

  const item = sim.schedule({
    at: interviewAt,
    kind: 'work.interview',
    label: `Interview — ${opening.title} At ${opening.employerName}`,
    category: 'career',
    payload: { applicationId: app.id },
    priority: 40,
    refType: 'application',
    refId: app.id,
    requiresPlayer: person.isPlayer,
    locationId: opening.locationId,
    durationMinutes: 60,
  });
  void item;

  sim.requireDecision({
    urgency: 62, category: 'career',
    title: `Interview scheduled: ${opening.title}`,
    detail: `${opening.employerName} on ${formatDate(interviewAt, sim.homeZone)} at ${formatTime(interviewAt, sim.homeZone)}.`,
    route: '/workspace/jobs',
    dueAt: interviewAt,
    refType: 'application', refId: app.id,
  });
  sim.emit('work.interview_scheduled', { applicationId: app.id, at: interviewAt });
}

function decideApplication(sim: Simulation, app: JobApplication): void {
  const opening = sim.universe.jobOpenings[app.openingId];
  const person = sim.universe.people[app.personId];
  if (!opening || !person) { app.stage = 'rejected'; return; }

  const { score, factors } = scoreCandidate(sim, person, opening);
  const ready = readiness(person) / 100;
  const rng = sim.rng('interview', app.id);
  const interviewPerformance = clamp(score * 0.6 + ready * 0.4 + rng.float(-0.12, 0.12), 0, 1.2);

  const allFactors = [
    ...factors,
    {
      label: 'How You Were On The Day',
      detail: `You arrived at ${Math.round(ready * 100)}% readiness. Tired and stressed reads in a room.`,
      weight: 0.3, contribution: ready * 0.3, knowable: true,
    },
  ];

  const probability = clamp(interviewPerformance * 1.1 - 0.24, 0.03, 0.93);
  const roll = rng.next();
  const hired = roll < probability;

  app.score = Math.round(interviewPerformance * 100);
  app.decidedAt = sim.now;
  sim.resolveDecision('application', app.id);

  sim.audit({
    kind: 'work.interview_decided', subjectType: 'application', subjectId: app.id,
    question: 'Why did I get the job, or not?',
    summary: hired
      ? `${opening.employerName} offered you ${opening.title}.`
      : `${opening.employerName} went with someone else for ${opening.title}.`,
    factors: allFactors, seed: `interview|${app.id}`, roll, probability, score: interviewPerformance,
    outcome: hired ? 'offer' : 'rejected',
  });

  if (!hired) {
    app.stage = 'rejected';
    sim.notify({ category: 'career', title: `Not selected: ${opening.title}`, body: `${opening.employerName} has gone with another candidate.`, importance: 35, route: '/workspace/jobs' });
    sim.emit('work.application_rejected', { applicationId: app.id });
    return;
  }

  app.stage = 'offer';
  const decideBy = addDays(sim.now, OFFER_WINDOW_DAYS, sim.homeZone);
  sim.schedule({
    at: decideBy,
    kind: 'work.offer_expires',
    label: `Offer Expires — ${opening.title}`,
    category: 'career',
    payload: { applicationId: app.id },
    priority: 44,
    refType: 'application', refId: app.id,
  });
  sim.requireDecision({
    dueAt: decideBy,
    urgency: 74, category: 'career',
    title: `Job offer: ${opening.title}`,
    detail: `${opening.employerName} at ${formatMoney(opening.payRate)}${opening.payBasis === 'hourly' ? '/hour' : opening.payBasis === 'salary' ? '/year' : ''}.`,
    route: '/workspace/jobs',
    actions: [
      { label: 'Accept', commandKind: 'work.accept_offer', payload: { applicationId: app.id } },
      { label: 'Decline', commandKind: 'work.decline_offer', payload: { applicationId: app.id } },
    ],
    refType: 'application', refId: app.id,
  });
  sim.emit('work.offer_made', { applicationId: app.id, openingId: opening.id });
}

export function hire(sim: Simulation, person: Person, opening: JobOpening): Job {
  const template = JOB_TEMPLATES.find((t) => t.title === opening.title);
  const job: Job = {
    id: sim.nextId('job'),
    saveId: sim.universe.meta.id,
    personId: person.id,
    employerName: opening.employerName,
    title: opening.title,
    sector: opening.sector,
    locationId: opening.locationId,
    payBasis: opening.payBasis,
    payRate: opening.payRate,
    hoursPerWeek: opening.hoursPerWeek,
    workDays: template?.workDays ?? [1, 2, 3, 4, 5],
    startHour: template?.startHour ?? 9,
    endHour: (template?.startHour ?? 9) + Math.round(opening.hoursPerWeek / (template?.workDays.length ?? 5)),
    level: 0,
    ladder: template?.ladder ?? [opening.title],
    performance: 62,
    attendance: 100,
    benefits: opening.benefits,
    startedAt: sim.now,
    missedShifts: 0,
    accruedPay: 0,
    nextPayAt: addDays(sim.now, 14, sim.homeZone),
  };
  sim.universe.jobs[job.id] = job;
  person.jobId = job.id;
  if (person.careerTrack === 'none') person.careerTrack = 'civilian';

  scheduleShifts(sim, job, SHIFT_HORIZON_DAYS);
  sim.schedule({
    at: addDays(sim.now, SHIFT_HORIZON_DAYS - 14, sim.homeZone),
    kind: 'work.extend_rota',
    label: `Rota — ${job.employerName}`,
    category: 'work',
    payload: { jobId: job.id },
    priority: 92,
    refType: 'job', refId: job.id,
  });

  sim.schedule({
    at: job.nextPayAt,
    kind: 'finance.payday',
    label: `Payday — ${job.employerName}`,
    category: 'finance',
    payload: { jobId: job.id },
    priority: 10,
    refType: 'job', refId: job.id,
  });
  sim.schedule({
    at: addDays(sim.now, 180, sim.homeZone),
    kind: 'work.review',
    label: `Performance Review — ${job.employerName}`,
    category: 'career',
    payload: { jobId: job.id },
    priority: 50,
    refType: 'job', refId: job.id,
  });

  if (job.benefits.health) {
    sim.emit('work.benefits_available', { jobId: job.id, personId: person.id, benefits: job.benefits });
  }

  sim.remember({
    category: 'career',
    title: `Started at ${job.employerName}`,
    detail: `${job.title}, ${describePay(job)}.`,
    refs: [{ type: 'job', id: job.id }, { type: 'person', id: person.id }],
    significance: 45, public: false, amount: annualisedPay(job),
  });
  sim.emit('work.hired', { jobId: job.id, personId: person.id, employerName: job.employerName, title: job.title });
  return job;
}

/** Lays down shifts for the next N days. Re-armed as the horizon is consumed. */
/** How far ahead a rota is laid out, and how often it is extended. */
const SHIFT_HORIZON_DAYS = 90;

export function scheduleShifts(sim: Simulation, job: Job, days: number): void {
  const shiftHours = Math.max(3, Math.round(job.hoursPerWeek / Math.max(1, job.workDays.length)));
  const existing = new Set<number>();
  for (const item of sim.universe.scheduled) {
    if (item.kind === 'work.shift' && item.refId === job.id && item.status === 'pending') existing.add(item.at);
  }
  for (let d = 0; d <= days; d++) {
    const day = addDays(sim.now, d, sim.homeZone);
    const parts = zonedParts(day, sim.homeZone);
    if (!job.workDays.includes(parts.weekday)) continue;
    const at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: job.startHour }, sim.homeZone);
    if (at <= sim.now) continue;
    if (job.endedAt && at > job.endedAt) break;
    // The rota is extended before it runs out, so the windows overlap.
    if (existing.has(at)) continue;
    sim.schedule({
      at,
      kind: 'work.shift',
      label: `Work — ${job.employerName}`,
      category: 'work',
      payload: { jobId: job.id },
      priority: 45,
      refType: 'job', refId: job.id,
      requiresPlayer: true,
      locationId: job.locationId,
      durationMinutes: shiftHours * 60,
    });
  }
}

function workShift(sim: Simulation, jobId: Id, durationMinutes: number): void {
  const job = sim.universe.jobs[jobId];
  if (!job || (job.endedAt && sim.now > job.endedAt)) return;
  const person = sim.universe.people[job.personId];
  if (!person) return;

  // Was the player somewhere else? A conflict they chose not to resolve is an
  // absence, and absences have consequences.
  const elsewhere = person.currentLocationId !== job.locationId;
  const tooTired = person.wellbeing.energy < 6;

  if (elsewhere || tooTired) {
    job.missedShifts += 1;
    job.attendance = clamp(job.attendance - 6, 0, 100);
    job.performance = clamp(job.performance - 3, 0, 100);
    sim.emit('work.shift_missed', { jobId, personId: person.id, reason: elsewhere ? 'not in town' : 'exhausted' });

    if (job.missedShifts >= 3) {
      terminate(sim, job, 'Repeated absence');
      return;
    }
    sim.notify({
      category: 'work',
      title: `Missed a shift at ${job.employerName}`,
      body: elsewhere ? 'You were not in town. That is three strikes before termination.' : 'You were too exhausted to work.',
      importance: 62, route: '/workspace/jobs',
    });
    return;
  }

  const hours = durationMinutes / 60;
  const ready = readiness(person) / 100;

  // A hard day costs more when you are already worn out, but not without
  // limit: an unbounded multiplier makes a tired week compound into a spiral
  // nothing can pull you out of, which is neither realistic nor playable.
  const strain = clamp(1.45 - ready * 0.55, 0.9, 1.45);
  person.wellbeing.energy = clamp(person.wellbeing.energy - hours * 4.6 * strain, 0, 100);
  person.wellbeing.stress = clamp(person.wellbeing.stress + hours * 1.25 * strain, 0, 100);
  person.wellbeing.nourishment = clamp(person.wellbeing.nourishment - hours * 2.1, 0, 100);

  const shiftQuality = clamp(ready * 100 + (person.attributes['reliability'] ?? 50) * 0.2 - 10, 0, 100);
  job.performance = clamp(job.performance * 0.94 + shiftQuality * 0.06, 0, 100);
  job.attendance = clamp(job.attendance + 0.6, 0, 100);
  job.missedShifts = 0;

  // Accrue pay; it lands on payday, withheld.
  switch (job.payBasis) {
    case 'hourly': job.accruedPay += Math.round(job.payRate * hours); break;
    case 'daily': job.accruedPay += job.payRate; break;
    case 'salary': job.accruedPay += Math.round(job.payRate / 260); break;
    case 'per_project': job.accruedPay += job.payRate; break;
    default: job.accruedPay += Math.round(job.payRate * hours); break;
  }

  sim.emit('work.shift_worked', { jobId, personId: person.id, hours, quality: shiftQuality });
}

function performanceReview(sim: Simulation, job: Job): void {
  const rng = sim.rng('review', job.id, sim.now);
  const raise = job.performance > 72 && rng.chance(0.55);
  if (raise) {
    job.payRate = applyRate(job.payRate, 1.045);
    sim.notify({ category: 'work', title: `Raise at ${job.employerName}`, body: `Your rate is now ${describePay(job)}.`, importance: 48, route: '/workspace/jobs' });
  } else if (job.performance < 40) {
    sim.notify({ category: 'work', title: `Warning at ${job.employerName}`, body: 'Your performance is below expectations. Another review like this and the job is at risk.', importance: 72, route: '/workspace/jobs' });
    if (job.performance < 28 && rng.chance(0.4)) {
      terminate(sim, job, 'Performance');
      return;
    }
  }
  sim.schedule({
    at: addDays(sim.now, 180, sim.homeZone),
    kind: 'work.review',
    label: `Performance Review — ${job.employerName}`,
    category: 'career',
    payload: { jobId: job.id },
    priority: 50,
    refType: 'job', refId: job.id,
  });
}

export function terminate(sim: Simulation, job: Job, reason: string): void {
  // Ending a job twice must not happen: a stale scheduled item firing against
  // an old job would otherwise take the person's current job away from them.
  if (job.endedAt !== undefined) return;

  job.endedAt = sim.now;
  job.endReason = reason;
  sim.timeline.cancelFor('job', job.id, sim.now);
  const person = sim.universe.people[job.personId];
  if (person) {
    // Only clear the pointer if it is this job it points at. Somebody who has
    // already moved on keeps the job they moved on to.
    if (person.jobId === job.id) person.jobId = undefined;
    person.wellbeing.stress = clamp(person.wellbeing.stress + 18, 0, 100);
    person.wellbeing.morale = clamp(person.wellbeing.morale - 20, 0, 100);
  }
  if (job.accruedPay > 0) {
    sim.schedule({
      at: addDays(sim.now, 7, sim.homeZone),
      kind: 'finance.payday',
      label: `Final Pay — ${job.employerName}`,
      category: 'finance',
      payload: { jobId: job.id },
      priority: 10,
      refType: 'job', refId: job.id,
    });
  }
  sim.remember({
    category: 'career',
    title: `Let go from ${job.employerName}`,
    detail: `${job.title}. Reason given: ${reason}.`,
    refs: [{ type: 'job', id: job.id }],
    significance: 50, public: false,
  });
  sim.requireDecision({
    urgency: 84, category: 'career',
    title: 'You Have Lost Your Job',
    detail: `${job.employerName} has ended your employment. Reason: ${reason}. Your bills have not stopped.`,
    route: '/workspace/jobs',
    refType: 'job', refId: job.id,
  });
  sim.emit('work.terminated', { jobId: job.id, personId: job.personId, reason });
}

function nextBusinessHour(sim: Simulation, from: number, hour: number): number {
  let day = from;
  for (let i = 0; i < 10; i++) {
    const parts = zonedParts(day, sim.homeZone);
    if (parts.weekday >= 1 && parts.weekday <= 5) {
      return instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour }, sim.homeZone);
    }
    day = addDays(day, 1, sim.homeZone);
  }
  return from;
}

/** Sets up the standing bills a household has regardless of anything else. */
export function createLivingBills(sim: Simulation, personId: Id, cityId: string, hasHome: boolean): void {
  const col = costOfLiving(cityId);
  const person = sim.universe.people[personId];
  const account = person?.primaryAccountId;
  const firstOfMonth = nextMonthStart(sim);

  const standing: { name: string; category: string; base: Money }[] = [
    { name: 'Phone Plan', category: 'utilities', base: 68_00 },
    { name: 'Internet', category: 'utilities', base: 78_00 },
    { name: 'Streaming Subscriptions', category: 'subscriptions', base: 46_00 },
  ];
  if (hasHome) {
    standing.push({ name: 'Electricity', category: 'utilities', base: 130_00 });
    standing.push({ name: 'Water And Refuse', category: 'utilities', base: 82_00 });
  }

  for (const s of standing) {
    createBill(sim, {
      payerId: personId,
      name: s.name,
      category: s.category,
      amount: Math.round(s.base * col),
      frequency: 'monthly',
      firstDueAt: firstOfMonth,
      autopayAccountId: account,
    });
  }
}

export function nextMonthStart(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.homeZone);
  const month = p.month === 12 ? 1 : p.month + 1;
  const year = p.month === 12 ? p.year + 1 : p.year;
  return instantFromZoned({ year, month, day: 1, hour: 9 }, sim.homeZone);
}

export const SHIFT_HOUR_MS = MS_HOUR;
