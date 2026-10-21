/**
 * TEST SETUP for the pay's tests (`tests/propay.test.ts`, `tests/propay-screen.test.ts`, brief 19): stand-ins for what the
 * work system and the agent's system write, which were built apart from the pay and meet it only through the core's
 * data and `schedulePay` (the coordinator wires their acceptance to it). An engagement, its opportunity and its promised
 * payments as the work system writes them on accepting an offer (`booked`); an agreement as the agent's system writes
 * one signed (`signed`); a graduate made through the School's own Commencement handler with the last term put on the
 * clock, as tests/pro-core.test.ts makes one (`graduate`); the body kept fed and rested as the clock moves (`tended`).
 */
import { expect } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, addDays, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '@/engine/systems/school';
import { AGREEMENT, AGREEMENT_TERMS, RATES, projectById } from '@/engine/content/careerwork';
import { ensurePro, type Agreement, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { paydayAfter } from '@/engine/systems/propay';

export const zone = 'America/New_York';
export const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
export const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
/** Rested, fed, steady and awake each time the clock moves, six hours at a time. */
export const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
export const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/**
 * A graduate of the class of 2029, made by the School's own handlers: the last term's state and its evaluation put on
 * the clock, Commencement brought forward to 3 September 2026, and the clock run through it.
 */
export function graduate(seed: string): Simulation {
  const sim = student(seed);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/** An agreement as the agent's system writes one when it's signed, for its year. */
export function signed(sim: Simulation, signedAt: number): Agreement {
  const a: Agreement = { id: sim.nextId('pro'), agentId: 'thomas-ashgrove', offeredAt: signedAt - 3 * MS_DAY, standsUntil: signedAt + 11 * MS_DAY, status: 'accepted', terms: [...AGREEMENT_TERMS], signedAt, endsAt: signedAt + AGREEMENT.termDays * MS_DAY };
  ensurePro(sim, sim.player).agreements.push(a);
  return a;
}

/**
 * An engagement as the work system writes one on accepting an offer: its opportunity booked, its days of work (ten to
 * six), and its pay promised now, a payment for each week's work due the Thursday after it (`paydayAfter`). A run's pay
 * is a weekly salary, a shoot's a day rate for each day; a student film's is deferred.
 */
export function booked(sim: Simulation, o: { project: string; days: number[]; amount: number; per: 'day' | 'week'; via?: 'agent' | 'open'; agreementId?: string; offerAt?: number }): Engagement {
  const pro = ensurePro(sim, sim.player);
  const template = projectById(o.project)!;
  const oppId = sim.nextId('pro');
  const eId = sim.nextId('pro');
  const days = o.days.map((d) => ({ from: d + MS_HOUR, to: d + 9 * MS_HOUR, label: template.schedule.kind === 'run' ? 'Rehearsal' : 'Shoot' }));
  const weeks = new Map<number, number[]>();
  for (const d of days) { const due = paydayAfter(d.from); weeks.set(due, [...(weeks.get(due) ?? []), d.from]); }
  const deferred = RATES[template.pay].deferred === true;
  const pay = [...weeks.entries()].map(([due, list], n) => ({
    id: sim.nextId('pro'), key: `${eId}:${n + 1}`, promised: deferred ? 0 : o.per === 'week' ? o.amount : o.amount * list.length, currency: 'USD', promisedAt: sim.now, due, ...(deferred ? { deferred: true as const } : {}),
  }));
  const opp: Opportunity = { id: oppId, projectId: o.project, via: o.via ?? 'open', ...(o.via === 'agent' ? { agentId: 'thomas-ashgrove' } : {}), status: 'booked', postedAt: sim.now - 10 * MS_DAY, submitBy: sim.now - 5 * MS_DAY, offer: { at: o.offerAt ?? sim.now - MS_DAY, until: sim.now + 6 * MS_DAY, rate: template.pay, amount: o.amount, per: o.per, units: o.per === 'week' ? pay.length : days.length }, resolvedAt: sim.now, engagementId: eId, history: [], counts: {} };
  const e: Engagement = { id: eId, opportunityId: oppId, projectId: o.project, role: template.role.part, status: 'booked', days, ...(o.agreementId ? { agreementId: o.agreementId } : {}), pay, history: [], counts: {} };
  pro.opportunities.push(opp);
  pro.engagements.push(e);
  return e;
}
/** Six days a week, Monday to Saturday, for so many weeks from a Monday. */
export const runDays = (monday: number, weeks: number) => Array.from({ length: weeks * 6 }, (_, i) => addDays(monday, Math.floor(i / 6) * 7 + (i % 6), zone));
