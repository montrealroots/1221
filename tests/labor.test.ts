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
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { SHIFT_KIND, callIn, hourlyWage, premiumsFor, rateAt, type JobState } from '@/engine/systems/work';
import { minimumWageAt } from '@/engine/content/wages';

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

  it('Australia’s Sunday rate by the award each line is under', () => {
    const sim = life('au-nsw-sydney');
    const sunday = local(sim, 2026, 1, 11, 10);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'school'), sunday, 7), 'Sunday Premium')).toBeCloseTo(7 * 0.25, 6);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'retail'), sunday, 7), 'Sunday Premium')).toBeCloseTo(7 * 0.5, 6);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'armed_forces'), sunday, 7), 'Sunday Premium')).toBeCloseTo(7, 6);
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
    // Office work is under VR–SA's own rate from five; construction under neither.
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'office'), evening, 7), 'Evening Premium')).toBeCloseTo(6 * 0.394, 6);
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'trades'), evening, 7), 'Evening Premium')).toBe(0);
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

  it('is granted in Japan at six months, by the table for a short week, and comes as pay in Canada', () => {
    const tokyo = life('jp-13-tokyo', { dayJob: true, wealth: 'modest' });
    expect(tokyo.execute({ kind: 'work.take_leave', payload: {} }).ok).toBe(false);
    tokyo.advanceBy(170 * MS_DAY);
    expect(tokyo.player.job!.leaveHours ?? 0).toBe(0);
    tokyo.advanceBy(30 * MS_DAY);
    // Café work is four seven-hour days, under 30 hours: 7 days at six months.
    expect(tokyo.player.job!.leaveHours).toBe(7 * 7);
    expect(tokyo.universe.notifications.some((n) => n.title === 'Paid Leave Granted')).toBe(true);
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

it('caps California’s sick pay at 40 hours a year, however much is built', () => {
  const sim = life('us-ca-losangeles', { dayJob: true, wealth: 'modest' });
  sim.player.job!.sickHours = 200;
  let paid = 0;
  for (let n = 0; n < 8; n += 1) {
    const shift = sim.timeline.pending().filter((i) => i.kind === SHIFT_KIND).sort((a, b) => a.at - b.at)[0]!;
    sim.advanceTo(shift.at);
    callIn(sim, shift);
    sim.player.job!.missed = [];
  }
  // Counted as the year's sick hours used; a payday between pays them out.
  paid = sim.player.job!.sickDays!.days;
  expect(paid).toBeCloseTo(40, 6);
  expect(sim.player.job!.sickHours).toBeGreaterThanOrEqual(160);
});

describe('the law’s extra payments, on their dates', () => {
  it('pays Mexico’s aguinaldo by 20 December, for the part of the year worked', () => {
    const sim = life('mx-cmx-mexicocity', { dayJob: true, wealth: 'comfortable' });
    sim.advanceTo(local(sim, 2026, 12, 21, 9));
    const paid = sim.universe.transactions.some((t) => t.category === 'salary' && t.postings.length > 0);
    expect(paid).toBe(true);
    expect(sim.player.job!.extrasPaid).toContain('Aguinaldo-2026-12');
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

describe('leave that lapses, and sick days that can’t be held against you', () => {
  it('loses Britain’s untaken leave at the end of the leave year, with a warning a month before', () => {
    const sim = life('uk-eng-london', { dayJob: true, wealth: 'modest' });
    sim.advanceBy(300 * MS_DAY);
    const built = sim.player.job!.leaveHours ?? 0;
    expect(built).toBeGreaterThan(0);
    // The year starts on the job's anniversary: the warning comes in its last month.
    sim.advanceBy(40 * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'Use Your Leave')).toBe(true);
    sim.advanceBy(30 * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'Leave Lost')).toBe(true);
    // What's left is only what the new year has built.
    expect(sim.player.job!.leaveHours ?? 0).toBeLessThan(built);
  });

  it('loses Ireland’s leave six months after its leave year, which starts on 1 April', () => {
    const sim = life('ie-lei-dublin', { dayJob: true, wealth: 'modest' });
    // Hired in January 2026: that leave belongs to the year from 1 April 2025.
    sim.advanceTo(local(sim, 2026, 3, 30, 9));
    expect(sim.player.job!.leaveYears!.map((one) => one.year)).toEqual(['2025-04-01']);
    sim.advanceTo(local(sim, 2026, 9, 29, 9));
    expect(sim.player.job!.leaveYears!.some((one) => one.year === '2025-04-01')).toBe(true);
    sim.advanceTo(local(sim, 2026, 10, 2, 9));
    expect(sim.player.job!.leaveYears!.some((one) => one.year === '2025-04-01')).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Leave Lost')).toBe(true);
  });

  it('pays Korea’s unused leave out a year after the year it was earned in', () => {
    const sim = life('kr-11-seoul', { dayJob: true, wealth: 'modest' });
    const hired = sim.player.job!.since;
    // The first leave year's leave, earned from the hiring, lapses two years on.
    sim.advanceTo(local(sim, 2027, 12, 20, 9));
    const firstYear = sim.player.job!.leaveYears!.find((one) => one.year === new Date(hired).toISOString().slice(0, 10))!;
    expect(firstYear.hours).toBeGreaterThan(0);
    const owed = Math.round(firstYear.hours * hourlyWage(sim, sim.player));
    sim.advanceTo(local(sim, 2028, 1, 6, 9));
    const allowance = sim.player.job!.pendingPay?.find((one) => one.name === 'Annual Leave Allowance');
    expect(allowance?.amount).toBeCloseTo(owed, -2);
    expect(sim.player.job!.leaveYears!.some((one) => one.year === new Date(hired).toISOString().slice(0, 10))).toBe(false);
  });

  it('doesn’t count a sick day the law pays toward being let go, and does count one it doesn’t', () => {
    const london = life('uk-eng-london', { dayJob: true, wealth: 'modest' });
    const shift = london.timeline.pending().filter((i) => i.kind === SHIFT_KIND).sort((a, b) => a.at - b.at)[0]!;
    london.advanceTo(shift.at);
    callIn(london, shift);
    expect(london.player.job!.missed).toEqual([]);
    const houston = life('us-tx-houston', { dayJob: true, wealth: 'modest' });
    const other = houston.timeline.pending().filter((i) => i.kind === SHIFT_KIND).sort((a, b) => a.at - b.at)[0]!;
    houston.advanceTo(other.at);
    callIn(houston, other);
    expect(houston.player.job!.missed.length).toBe(1);
  });
});

describe('Japan’s leave granted a year at a time', () => {
  it('grants full time 10 days at six months, and nothing a year on for a year under 80% attended', () => {
    const tokyo = life('jp-13-tokyo', { dayJob: true, wealth: 'modest' });
    tokyo.must({ kind: 'work.set_hours', payload: { fullTime: true } });
    tokyo.advanceBy(200 * MS_DAY);
    expect(tokyo.player.job!.leaveHours).toBe(10 * 8);
    // Away for most of the next year's shifts: under 80% attended.
    const job = tokyo.player.job!;
    job.attendance = { due: 100, worked: 70 };
    job.since = tokyo.now - 18 * 30.4375 * MS_DAY + MS_DAY;
    tokyo.advanceBy(2 * MS_DAY);
    expect(tokyo.universe.notifications.some((n) => n.title === 'No Leave Granted')).toBe(true);
    expect(job.leaveGrants).toBe(2);
  });
});

describe('youth rates that last only months, juniors’ shares, and a day in lieu', () => {
  const at = Date.UTC(2026, 6, 15);
  it('pays New Zealand’s starting-out rate to a 17-year-old in the first six months, and the adult rate after', () => {
    expect(minimumWageAt('nz-wgn-wellington', at, 'NZD', 17, 3).hourly).toBe(19_16);
    expect(minimumWageAt('nz-wgn-wellington', at, 'NZD', 17, 7).hourly).toBe(23_95);
    expect(minimumWageAt('nz-wgn-wellington', at, 'NZD', 18, 3).hourly).toBe(23_95);
  });

  it('pays France’s SMIC less a fifth under 17 and a tenth at 17, until six months in', () => {
    expect(minimumWageAt('fr-idf-paris', at, 'EUR', 16, 2).hourly).toBe(9_85);
    expect(minimumWageAt('fr-idf-paris', at, 'EUR', 17, 2).hourly).toBe(11_08);
    expect(minimumWageAt('fr-idf-paris', at, 'EUR', 17, 6).hourly).toBe(12_31);
  });

  it('pays an Australian junior the award’s share of the adult rate, and a 20-year-old the adult rate after six months', () => {
    const adult = rateAt('au-nsw-sydney', 'retail', 'AUD', at, undefined, 30, 12).hourly;
    expect(rateAt('au-nsw-sydney', 'retail', 'AUD', at, undefined, 17, 3).hourly).toBe(Math.round(adult * 0.6));
    expect(rateAt('au-nsw-sydney', 'retail', 'AUD', at, undefined, 20, 3).hourly).toBe(Math.round(adult * 0.9));
    expect(rateAt('au-nsw-sydney', 'retail', 'AUD', at, undefined, 20, 7).hourly).toBe(adult);
    const coach = rateAt('au-nsw-sydney', 'sport', 'AUD', at, undefined, 30, 12).hourly;
    expect(rateAt('au-nsw-sydney', 'sport', 'AUD', at, undefined, 18, 12).hourly).toBe(Math.round(coach * 0.75));
    // The Clerks award's 60% at 17, since 2026-09-26; and nothing for a line without junior rates, security work.
    const office = rateAt('au-nsw-sydney', 'office', 'AUD', at, undefined, 30, 12).hourly;
    expect(rateAt('au-nsw-sydney', 'office', 'AUD', at, undefined, 17, 3).hourly).toBe(Math.round(office * 0.6));
    const guard = rateAt('au-nsw-sydney', 'armed_forces', 'AUD', at, undefined, 30, 12).hourly;
    expect(rateAt('au-nsw-sydney', 'armed_forces', 'AUD', at, undefined, 17, 3).hourly).toBe(guard);
  });

  it('gives a day in lieu for a New Zealand holiday worked, on top of time and a half', () => {
    const sim = life('nz-wgn-wellington', { dayJob: true, wealth: 'modest', beforeActing: 'retail' });
    addCountryHolidays('nz', readFileSync('public/holidays/nz.tsv', 'utf8'));
    // Christmas Day 2026 is a Friday, a retail day.
    sim.advanceTo(Date.UTC(2026, 11, 24, 0));
    const shift = sim.timeline.pending().filter((i) => i.kind === SHIFT_KIND).sort((a, b) => a.at - b.at).find((i) => premiumsFor(sim, { ...sim.player.job!, week: undefined }, i.at, 1).some((e) => e.name === 'Holiday Premium'))!;
    const before = sim.player.job!.leaveHours ?? 0;
    sim.advanceTo(shift.at + 12 * MS_HOUR);
    const hours = Number(shift.payload.hours);
    expect((sim.player.job!.leaveHours ?? 0) - before).toBeCloseTo(hours + hours * 0.08, 6);
  });
});

describe('a line’s own award or agreement, and a holiday its work can’t be done on', () => {
  const flatOf = (list: { name: string; flat?: number }[], name: string) => list.find((one) => one.name === name)?.flat ?? 0;
  it('pays Australia’s awards by line, on weekdays: retail evenings, security nights, hospitality’s dollars', () => {
    const sim = life('au-nsw-sydney');
    const tuesday = (h: number) => local(sim, 2026, 1, 13, h);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'retail'), tuesday(17), 7), 'Evening Premium')).toBeCloseTo(3 * 0.25, 6);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'retail'), local(sim, 2026, 1, 10, 17), 7), 'Evening Premium')).toBe(0);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'armed_forces'), tuesday(12), 10), 'Night Premium')).toBeCloseTo(4 * 0.217, 6);
    expect(flatOf(premiumsFor(sim, job('au-nsw-sydney', 'hospitality'), tuesday(16), 7), 'Evening Loading')).toBe(4 * 2_95);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'school'), tuesday(16), 7), 'Evening Premium')).toBeCloseTo(0.1, 6);
    expect(named(premiumsFor(sim, job('au-nsw-sydney', 'hospitality'), tuesday(16), 7), 'Night Premium')).toBe(0);
  });

  it('pays Iceland’s shop and office work by VR–SA: weekday evenings and the weekend', () => {
    const sim = life('is-39-reykjavik');
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'retail'), local(sim, 2026, 1, 13, 12), 8), 'Evening Premium')).toBeCloseTo(2 * 0.383, 6);
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'retail'), local(sim, 2026, 1, 10, 10), 7), 'Saturday Premium')).toBeCloseTo(7 * 0.383, 6);
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'office'), local(sim, 2026, 1, 13, 12), 8), 'Evening Premium')).toBeCloseTo(3 * 0.394, 6);
    // Café work stays on Efling–SA's own.
    expect(named(premiumsFor(sim, job('is-39-reykjavik', 'school'), local(sim, 2026, 1, 10, 10), 7), 'Saturday Premium')).toBeCloseTo(7 * 0.45, 6);
  });

  it('keeps Berlin’s shops shut on a public holiday, paid as if worked, and its cafés open', () => {
    addCountryHolidays('de', readFileSync('public/holidays/de.tsv', 'utf8'));
    const shop = life('de-be-berlin', { dayJob: true, wealth: 'modest', beforeActing: 'retail' });
    const cafe = life('de-be-berlin', { dayJob: true, wealth: 'modest', beforeActing: 'school' });
    // German Unity Day, Saturday 3 October 2026: both lines work Saturdays.
    const unity = (sim: Simulation) => sim.timeline.pending().some((i) => i.kind === SHIFT_KIND && new Date(i.at).toISOString().startsWith('2026-10-03'));
    shop.advanceTo(Date.UTC(2026, 8, 25));
    cafe.advanceTo(Date.UTC(2026, 8, 25));
    expect(unity(shop)).toBe(false);
    expect(unity(cafe)).toBe(true);
    shop.advanceTo(Date.UTC(2026, 9, 3, 12));
    expect(shop.player.job!.unpaid.some((one) => one.kind === 'holiday' && one.hours === 7)).toBe(true);
  });
});

describe('a pension fund that grows', () => {
  it('grows Australia’s super by a twelfth of its last published year on the 1st, Britain’s too, and not Ireland’s new fund', () => {
    const sydney = life('au-nsw-sydney', { dayJob: true, wealth: 'modest' });
    sydney.advanceTo(Date.UTC(2026, 4, 3));
    const returns = sydney.universe.transactions.filter((t) => t.category === 'pension_return');
    expect(returns.length).toBeGreaterThan(0);
    // Once a month, on the 1st where the life is lived.
    expect(returns.every((t) => zonedParts(t.at, sydney.homeZone).day === 1)).toBe(true);
    const fund = Object.values(sydney.universe.accounts).find((a) => a.category === 'pension')!;
    const last = returns[returns.length - 1]!;
    const index = sydney.universe.transactions.indexOf(last);
    const before = sydney.universe.transactions.slice(0, index).reduce((sum, t) => sum + t.postings.filter((p) => p.accountId === fund.id).reduce((a, p) => a + p.amount, 0), 0);
    const earned = last.postings.find((p) => p.accountId === fund.id)!.amount;
    expect(earned).toBe(Math.round(before * (1.086 ** (1 / 12) - 1)));
    const london = life('uk-eng-london', { dayJob: true, wealth: 'modest' });
    london.advanceTo(Date.UTC(2026, 4, 3));
    expect(london.universe.transactions.some((t) => t.category === 'pension_return')).toBe(true);
    const dublin = life('ie-lei-dublin', { dayJob: true, wealth: 'modest' });
    dublin.advanceTo(Date.UTC(2026, 4, 3));
    expect(Object.values(dublin.universe.accounts).some((a) => a.category === 'pension' && a.balance > 0)).toBe(true);
    expect(dublin.universe.transactions.some((t) => t.category === 'pension_return')).toBe(false);
    expect(sydney.ledger.audit()).toEqual([]);
  });
});

describe('Sundays off where the law keeps a line off them', () => {
  it('works a Berlin shop’s Sunday on a free weekday, and a café’s on the Sunday', () => {
    const shop = life('de-be-berlin', { dayJob: true, wealth: 'modest', beforeActing: 'retail' });
    const cafe = life('de-be-berlin', { dayJob: true, wealth: 'modest', beforeActing: 'school' });
    const days = (sim: Simulation) => new Set(sim.timeline.pending().filter((i) => i.kind === SHIFT_KIND).map((i) => zonedParts(i.at, sim.homeZone)).map((p) => new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()));
    expect(days(shop).has(0)).toBe(false);
    expect(days(shop).has(3)).toBe(true);
    expect(days(cafe).has(0)).toBe(true);
    // From a Saturday, the next free day is the Sunday: an extra shift skips it.
    shop.advanceTo(local(shop, 2026, 1, 10, 1));
    const { at } = shop.must<{ at: number }>({ kind: 'work.extra_shift', payload: {} });
    const p = zonedParts(at, shop.homeZone);
    expect(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()).not.toBe(0);
    expect(days(shop).has(0)).toBe(false);
  });
});