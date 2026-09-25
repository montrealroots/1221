/**
 * What the law where they work adds to a shift and a job (`content/labor.ts`,
 * `systems/work.ts`): premiums, overtime, leave, sick pay, the extra payments
 * on their dates, Korea's weekly rest day and severance, notice on quitting,
 * and moving to another employer.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { addCountryHolidays } from '@/engine/content/holidays';
import { EMPLOYERS } from '@/engine/content/employers';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { SHIFT_KIND, callIn, hourlyWage, premiumsFor, type JobState } from '@/engine/systems/work';

const life = (cityId: string, extra: Record<string, unknown> = {}, seed = 'labor') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, ...extra }, seed);
const job = (cityId: string, jobId: string): JobState => ({ jobId, cityId, since: Date.UTC(2026, 0, 1), unpaid: [], missed: [], rotaThrough: 0 });
const local = (sim: Simulation, y: number, m: number, d: number, h: number) => instantFromZoned({ year: y, month: m, day: d, hour: h }, sim.homeZone);
const named = (list: { name: string; hours: number }[], name: string) => list.find((one) => one.name === name)?.hours ?? 0;
const nextShift = (sim: Simulation) => sim.timeline.pending().filter((i) => i.kind === SHIFT_KIND).sort((a, b) => a.at - b.at)[0]!;
const grossLine = (sim: Simulation, name: string) => sim.player.job!.lastSlip?.grossLines?.find((one) => one.name === name)?.amount ?? 0;

describe('premiums for when a shift falls', () => {
  it('Mexico’s Sunday Premium, and a public holiday worked at three times', () => {
    const sim = life('mx-cmx-mexicocity');
    addCountryHolidays('mx', readFileSync('public/holidays/mx.tsv', 'utf8'));
    const state = job('mx-cmx-mexicocity', 'retail');
    // Sunday 11 January 2026.
    expect(named(premiumsFor(sim, state, local(sim, 2026, 1, 11, 10), 7), 'Sunday Premium')).toBeCloseTo(7 * 0.25, 6);
    // Constitution Day, the first Monday of February.
    expect(named(premiumsFor(sim, state, local(sim, 2026, 2, 2, 10), 7), 'Holiday Premium')).toBeCloseTo(7 * 2, 6);
    // A Tuesday is ordinary.
    expect(premiumsFor(sim, state, local(sim, 2026, 2, 3, 10), 7)).toEqual([]);
  });

  it('France’s holiday premium only on 1 May, the one day the law names', () => {
    const sim = life('fr-idf-paris');
    addCountryHolidays('fr', readFileSync('public/holidays/fr.tsv', 'utf8'));
    const state = job('fr-idf-paris', 'retail');
    expect(named(premiumsFor(sim, state, local(sim, 2026, 5, 1, 10), 7), 'Holiday Premium')).toBeCloseTo(7, 6);
    expect(named(premiumsFor(sim, state, local(sim, 2026, 7, 14, 10), 7), 'Holiday Premium')).toBe(0);
  });

  it('Japan’s night premium from ten, only for the hours in it', () => {
    const sim = life('jp-13-tokyo');
    // Bar work from 16:00 for seven hours runs an hour past ten.
    expect(named(premiumsFor(sim, job('jp-13-tokyo', 'hospitality'), local(sim, 2026, 1, 13, 16), 7), 'Night Premium')).toBeCloseTo(0.25, 6);
    expect(named(premiumsFor(sim, job('jp-13-tokyo', 'office'), local(sim, 2026, 1, 13, 9), 8), 'Night Premium')).toBe(0);
  });

  it('Iceland’s agreement premiums only for the lines its tables cover', () => {
    const sim = life('is-39-reykjavik');
    // From four for seven hours: six of them after five.
    const evening = local(sim, 2026, 1, 13, 16);
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'hospitality'), evening, 7), 'Evening Premium')).toBeCloseTo(6 * 0.33, 6);
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'office'), evening, 7), 'Evening Premium')).toBe(0);
  });
});

describe('overtime', () => {
  it('pays time and a half past 40 hours in the US, week by week', () => {
    const sim = life('us-tx-houston');
    const state = job('us-tx-houston', 'office');
    let overtime = 0;
    for (let day = 12; day <= 17; day += 1) overtime += named(premiumsFor(sim, state, local(sim, 2026, 1, day, 9), 8), 'Overtime');
    // Six eight-hour days is 48: eight of them past 40, half again.
    expect(overtime).toBeCloseTo(8 * 0.5, 6);
    // A new week starts clean.
    expect(named(premiumsFor(sim, state, local(sim, 2026, 1, 19, 9), 8), 'Overtime')).toBe(0);
  });

  it('pays California and British Columbia by the day too, and Mexico triple past nine hours of it', () => {
    const la = life('us-ca-losangeles');
    expect(named(premiumsFor(la, job('us-ca-losangeles', 'armed_forces'), local(la, 2026, 1, 13, 12), 10), 'Overtime')).toBeCloseTo(2 * 0.5, 6);
    const houston = life('us-tx-houston');
    expect(named(premiumsFor(houston, job('us-tx-houston', 'armed_forces'), local(houston, 2026, 1, 13, 12), 10), 'Overtime')).toBe(0);
    const mx = life('mx-cmx-mexicocity');
    const state = job('mx-cmx-mexicocity', 'trades');
    let overtime = 0;
    for (let day = 12; day <= 17; day += 1) overtime += named(premiumsFor(mx, state, local(mx, 2026, 1, day, 9), 10), 'Overtime');
    // 60 hours: 12 past 48, nine at double and three at triple.
    expect(overtime).toBeCloseTo(9 * 1 + 3 * 2, 6);
  });
});

describe('paid leave', () => {
  it('builds with the hours in Britain, is booked a shift at a time, and paid on payday', () => {
    const sim = life('uk-eng-london', { dayJob: true, wealth: 'modest' });
    sim.advanceBy(60 * MS_DAY);
    const built = sim.player.job!.leaveHours ?? 0;
    expect(built).toBeGreaterThan(0);
    const worked = sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.worked === true).reduce((sum, i) => sum + Number(i.payload.hours), 0);
    expect(built).toBeCloseTo(worked * 0.1207, 6);
    const shift = nextShift(sim);
    const booked = sim.must<{ at: number; hours: number }>({ kind: 'work.take_leave', payload: {} });
    expect(booked.at).toBe(shift.at);
    expect(sim.player.job!.leaveHours).toBeCloseTo(built - booked.hours, 6);
    sim.advanceBy(40 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.category === 'salary')).toBe(true);
    expect(sim.universe.scheduled.find((i) => i.id === shift.id)?.status).toBe('cancelled');
  });

  it('can’t be taken in Japan before six months, and comes as pay in Canada', () => {
    const tokyo = life('jp-13-tokyo', { dayJob: true, wealth: 'modest' });
    tokyo.player.job!.leaveHours = 100;
    expect(tokyo.execute({ kind: 'work.take_leave', payload: {} }).ok).toBe(false);
    tokyo.player.job!.since -= 200 * MS_DAY;
    expect(tokyo.execute({ kind: 'work.take_leave', payload: {} }).ok).toBe(true);
    const toronto = life('ca-on-toronto', { dayJob: true, wealth: 'modest' });
    expect(toronto.execute({ kind: 'work.take_leave', payload: {} }).ok).toBe(false);
    toronto.advanceBy(40 * MS_DAY);
    const worked = toronto.player.job!.lastSlip!.grossLines!;
    const before = worked.filter((one) => one.name !== 'Vacation Pay').reduce((sum, one) => sum + one.amount, 0);
    expect(grossLine(toronto, 'Vacation Pay')).toBe(Math.round(before * 0.04));
  });
});

describe('a day called in sick', () => {
  const callInNext = (sim: Simulation) => {
    const shift = nextShift(sim);
    sim.advanceTo(shift.at);
    callIn(sim, shift);
    return shift;
  };

  it('pays Britain’s SSP from the first day, at 80% up to £24.65 a day', () => {
    const sim = life('uk-eng-london', { dayJob: true, wealth: 'modest' });
    const shift = callInNext(sim);
    const entry = sim.player.job!.unpaid.find((one) => one.kind === 'sick')!;
    expect(entry.hours).toBe(Number(shift.payload.hours));
    expect(entry.share).toBe(0.8);
    expect(entry.capDay).toBe(Math.round((123.25 / 5) * 100));
  });

  it('pays nothing for France’s three waiting days, and nothing in Texas', () => {
    const paris = life('fr-idf-paris', { dayJob: true, wealth: 'modest' });
    callInNext(paris);
    expect(paris.player.job!.unpaid.some((one) => one.kind === 'sick')).toBe(false);
    const houston = life('us-tx-houston', { dayJob: true, wealth: 'modest' });
    callInNext(houston);
    expect(houston.player.job!.unpaid.some((one) => one.kind === 'sick')).toBe(false);
  });

  it('pays New York’s from the hours built, an hour for every thirty worked', () => {
    const sim = life('us-ny-newyork', { dayJob: true, wealth: 'modest' });
    sim.advanceBy(30 * MS_DAY);
    const shift = nextShift(sim);
    sim.advanceTo(shift.at);
    const built = sim.player.job!.sickHours ?? 0;
    expect(built).toBeGreaterThan(0);
    callIn(sim, shift);
    const entry = sim.player.job!.unpaid.find((one) => one.kind === 'sick')!;
    expect(entry.hours).toBeCloseTo(Math.min(built, Number(shift.payload.hours)), 6);
    expect(sim.player.job!.sickHours).toBeCloseTo(built - entry.hours, 6);
  });
});

describe('the law’s extra payments, on their dates', () => {
  it('pays Mexico’s aguinaldo by 20 December, for the part of the year worked', () => {
    const sim = life('mx-cmx-mexicocity', { dayJob: true, wealth: 'comfortable' });
    sim.advanceTo(local(sim, 2026, 12, 21, 9));
    const paid = sim.universe.transactions.some((t) => t.category === 'salary' && t.postings.length > 0);
    expect(paid).toBe(true);
    expect(sim.player.job!.extrasPaid).toContain('Aguinaldo-2026');
  });

  it('pays Iceland’s desemberuppbót on 15 December, by the job’s share of full time', () => {
    const sim = life('is-39-reykjavik', { dayJob: true, wealth: 'comfortable' });
    sim.advanceTo(local(sim, 2026, 12, 15, 9));
    const due = sim.player.job!.pendingPay!.find((one) => one.name === 'Desemberuppbót')!;
    // Café work is 28 hours a week, 70% of full time, and the year is nearly worked.
    expect(due.amount).toBeGreaterThan(114_000_00 * 0.7 * 0.9);
    expect(due.amount).toBeLessThanOrEqual(114_000_00 * 0.7);
  });
});

describe('Korea', () => {
  it('pays the weekly rest day for a week of 15 hours or more, every shift worked', () => {
    const sim = life('kr-11-seoul', { dayJob: true, wealth: 'modest' });
    sim.advanceBy(21 * MS_DAY);
    const rest = sim.player.job!.unpaid.filter((one) => one.kind === 'rest');
    const paid = sim.player.job!.lastSlip?.grossLines?.some((one) => one.name === 'Weekly Rest Day') ?? false;
    expect(rest.length > 0 || paid).toBe(true);
  });
});

describe('leaving', () => {
  it('works Germany’s two weeks of notice in probation, and pays out the leave not taken', () => {
    const sim = life('de-be-berlin', { dayJob: true, wealth: 'modest' });
    sim.advanceBy(30 * MS_DAY);
    const leave = sim.player.job!.leaveHours ?? 0;
    expect(leave).toBeGreaterThan(0);
    const { leavingAt } = sim.must<{ leavingAt: number }>({ kind: 'work.quit', payload: {} });
    expect(leavingAt - sim.now).toBe(14 * MS_DAY);
    expect(sim.timeline.pending().some((i) => i.kind === SHIFT_KIND && i.at < leavingAt)).toBe(true);
    expect(sim.timeline.pending().some((i) => i.kind === SHIFT_KIND && i.at >= leavingAt)).toBe(false);
    const built = sim.player.job!.leaveHours ?? 0;
    const rate = hourlyWage(sim, sim.player);
    sim.advanceTo(leavingAt + MS_DAY);
    const owed = sim.player.job?.pendingPay?.find((one) => one.name === 'Leave Not Taken')?.amount
      ?? sim.player.job?.lastSlip?.grossLines?.find((one) => one.name === 'Leave Not Taken')?.amount;
    // What was built by the last day, at the rate: at least what it was on quitting.
    expect(owed).toBeGreaterThanOrEqual(Math.round(built * rate));
  });

  it('leaves at once in the US, with no notice owed', () => {
    const sim = life('us-tx-houston', { dayJob: true, wealth: 'modest' });
    const { leavingAt } = sim.must<{ leavingAt: number }>({ kind: 'work.quit', payload: {} });
    expect(leavingAt).toBe(sim.now);
    expect(sim.timeline.pending().some((i) => i.kind === SHIFT_KIND)).toBe(false);
  });

  it('moves to another employer when the notice runs out, or in three weeks', () => {
    const sim = life('uk-eng-london', { dayJob: true, wealth: 'modest' });
    const first = sim.player.job!.employerId;
    const other = EMPLOYERS.GB!.retail!.employers.find((one) => one.id !== first)!;
    const { startsAt } = sim.must<{ startsAt: number }>({ kind: 'work.apply', payload: { employerId: other.id } });
    expect(startsAt - sim.now).toBe(21 * MS_DAY);
    expect(sim.player.job!.employerId).toBe(first);
    sim.advanceTo(startsAt + MS_HOUR * 25);
    expect(sim.player.job!.employerId).toBe(other.id);
    expect(sim.player.job!.jobId).toBe('retail');
    expect(hourlyWage(sim, sim.player)).toBeGreaterThan(0);
  });
});
