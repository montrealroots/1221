/**
 * Work-study's limits (from 2026-10-10): Yale's 19 hours a week across its jobs in term and 40 out of it, checked at
 * booking and at the shift; assigned hours missed ill converted to grant aid on request in January or May; and each
 * shift's own risk to the body. FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CONVERT_KIND, SHIFT_KIND, conversionRefusal, convertibleHours, weekCap, weekHours, yearKeyOf } from '@/engine/systems/school';
import { WORK_LIMITS, WORK_STUDY } from '@/engine/content/school';
import { INJURY } from '@/engine/content/injury';
import { chanceOver } from '@/engine/systems/injury';
import { earningsOf } from '@/engine/systems/earnings';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** FIXTURE: a shift booked by hand, as the School's calendar books one. */
const shift = (sim: Simulation, when: number, hours: number, elective = true) => sim.schedule({ at: when, kind: SHIFT_KIND, label: 'Shift', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: hours * 60, payload: { personId: sim.player.id, hours, elective } });

describe('the weekly cap', () => {
  it('is 19 hours in term and 40 out of it, in a Monday-to-Sunday week, counting every Yale shift booked or worked and none called off', () => {
    const sim = student('wl-cap');
    expect(weekCap(at(2026, 10, 7))).toBe(WORK_LIMITS.weekHours);
    expect(weekCap(at(2026, 7, 7))).toBe(WORK_LIMITS.recessWeekHours);
    expect(weekCap(at(2026, 12, 28))).toBe(WORK_LIMITS.recessWeekHours);
    tended(sim, at(2026, 10, 1));
    const before = weekHours(sim, sim.player, at(2026, 10, 14));
    const one = shift(sim, at(2026, 10, 13, 19), 4);
    shift(sim, at(2026, 10, 19, 19), 4);
    expect(weekHours(sim, sim.player, at(2026, 10, 14)) - before).toBe(4);
    sim.timeline.cancel(one.id, sim.now);
    expect(weekHours(sim, sim.player, at(2026, 10, 14))).toBe(before);
  });

  it('refuses an elective shift past it at booking, and says the cap is why', () => {
    const sim = student('wl-book');
    tended(sim, at(2026, 10, 5, 8));
    // FIXTURE: the three weeks the next fortnight's evenings fall in booked to 18 hours already.
    for (const d of [6, 7, 8, 13, 14, 15, 19, 20, 21]) shift(sim, at(2026, 10, d, 19), 6);
    expect(sim.execute({ kind: 'school.take_shift', payload: {} }).error).toMatch(/cap of 19 hours a week/);
  });

  it('works a shift only to the cap on the day, and the rest isn’t held against them', () => {
    let sim = student('wl-exec', { family: undefined, wealth: 'scraping' });
    tended(sim, at(2026, 10, 5, 8));
    // FIXTURE: 18 hours worked across the week, and a 4-hour evening booked over them, as a booking before the cap would.
    for (const d of [5, 6, 7]) shift(sim, at(2026, 10, d, 10), 6);
    const over = shift(sim, at(2026, 10, 8, 19), 4);
    sim = reload(sim);
    tended(sim, at(2026, 10, 8, 18));
    const owed = sim.player.school!.workStudy.owedHours;
    tended(sim, at(2026, 10, 8, 23));
    // 18 worked, so the evening's 4 hours are worked to 19: one hour more owed.
    expect(sim.player.school!.workStudy.owedHours - owed).toBe(1);
    expect(sim.universe.scheduled.find((i) => i.id === over.id)!.status).not.toBe('missed');
    // The week's Saturday crew shift, booked before, comes to a week worked to the cap: off, and not held against them.
    tended(sim, at(2026, 10, 10, 17));
    const sat = sim.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.payload.elective === false && i.at > at(2026, 10, 10, 0) && i.at < at(2026, 10, 11, 0));
    if (sat) {
      expect(sat.status).toBe('missed');
      expect(sim.universe.notifications.some((n) => n.title === 'A Shift Over The Weekly Cap')).toBe(true);
      expect(sim.universe.notifications.some((n) => n.title === 'You Missed A Work-Study Shift')).toBe(false);
    }
  });
});

describe('hours converted to grant aid', () => {
  it('PLAYER JOURNEY: assigned hours missed ill, asked to be converted, paid in January as a taxable scholarship; refused to a student with no aid', () => {
    let sim = student('wl-convert', { family: undefined, wealth: 'scraping' });
    tended(sim, at(2026, 10, 2, 8));
    expect(conversionRefusal(sim, sim.player)).toMatch(/No hours to convert/);
    // Called in sick on a Saturday with an assigned shift.
    const sat = sim.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.status === 'pending' && i.payload.elective === false)!;
    tended(sim, sat.at - 2 * MS_HOUR);
    sim.player.wellbeing.condition = 20;
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    tended(sim, sat.at + MS_HOUR);
    const key = yearKeyOf(0);
    expect(sim.player.school!.excusedHours![key]).toBe(Number(sat.payload.hours));
    expect(convertibleHours(sim.player, key)).toBe(Number(sat.payload.hours));
    const asked = sim.must<{ at: number; hours: number }>({ kind: 'school.request_conversion', payload: {} });
    expect(new Date(asked.at).getUTCMonth()).toBe(0);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toMatch(/request is in/);
    sim = reload(sim);
    tended(sim, asked.at + MS_HOUR);
    const grant = sim.universe.transactions.find((t) => /Grant-in-aid: \d+ work-study hours converted/.test(t.memo))!;
    expect(grant.postings.find((p) => p.accountId === sim.nominalAccount('income', 'Scholarship').id)!.amount).toBe(-Number(sat.payload.hours) * WORK_STUDY.hourly);
    // On the year's return as a scholarship, which the US taxes.
    expect(earningsOf(sim.player).years[2027]!.scholarship).toBeGreaterThanOrEqual(Number(sat.payload.hours) * WORK_STUDY.hourly);
    expect(convertibleHours(sim.player, key)).toBe(0);
    expect(sim.universe.scheduled.some((i) => i.kind === CONVERT_KIND && i.status === 'pending')).toBe(false);
    // No aid, no conversion.
    const rich = student('wl-rich', { family: 'wealthy' });
    expect(conversionRefusal(rich, rich.player)).toMatch(/students on financial aid/);
  });
});

describe('a shift’s risk to the body', () => {
  it('is the shops’ for the crew, a floor’s front of house, and never a certainty', () => {
    expect(INJURY.perThousandHours.crew).toBeGreaterThan(INJURY.perThousandHours.usher);
    expect(chanceOver(INJURY.perThousandHours.crew, 6)).toBeLessThan(0.05);
    expect(chanceOver(INJURY.perThousandHours.usher, 4)).toBeGreaterThan(0);
  });
});
