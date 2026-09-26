/**
 * Losing a job for no fault of one's own (`content/labor.ts`,
 * `systems/work.ts`): the notice the law has an employer give, worked out on
 * the rota, and the redundancy pay it owes on the way out.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { LABOR, employerNoticeDays, laborAt, layoffChanceADay, redundancyWeeks } from '@/engine/content/labor';
import { jobFor, patternHours, patternOf } from '@/engine/content/jobs';
import { MS_DAY } from '@/engine/core/time';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { SHIFT_KIND, averageWeek, layOff, payslipAt, redundancyPay } from '@/engine/systems/work';
import { EMPLOYERS } from '@/engine/content/employers';
import { claimFor } from '@/engine/systems/unemployment';
import { netWorth } from '@/engine/systems/finance';
import { BENEFITS, baseQuarters, eiHoursNeeded, eiWeeks, japanDaily, japanDismissedDays } from '@/engine/content/unemployment';

const life = (cityId: string, seed = 'out-of-work') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, dayJob: true, wealth: 'modest' }, seed);
const law = (...path: string[]) => laborAt(path);

describe('the notice an employer gives', () => {
  it('grows with the years in Britain, Ireland, Ontario and Germany', () => {
    expect(employerNoticeDays(law('GB'), 0.5, 30)).toBe(0);
    expect(employerNoticeDays(law('GB'), 13, 30)).toBe(7);
    expect(employerNoticeDays(law('GB'), 36, 30)).toBe(21);
    expect(employerNoticeDays(law('GB'), 200, 60)).toBe(84);
    expect(employerNoticeDays(law('IE'), 30, 30)).toBe(14);
    expect(employerNoticeDays(law('CA', 'CA-08'), 72, 30)).toBe(42);
    expect(employerNoticeDays(law('CA', 'CA-10'), 72, 30)).toBe(28);
    expect(employerNoticeDays(law('DE'), 3, 30)).toBe(14);
    expect(employerNoticeDays(law('DE'), 130, 30)).toBe(120);
  });

  it('adds Australia’s week for a worker over 45 with two years, and none at will in the US', () => {
    expect(employerNoticeDays(law('AU'), 30, 40)).toBe(14);
    expect(employerNoticeDays(law('AU'), 30, 50)).toBe(21);
    expect(employerNoticeDays(law('AU'), 20, 50)).toBe(14);
    expect(employerNoticeDays(law('US', 'US-TX'), 120, 50)).toBe(0);
    expect(employerNoticeDays(law('JP'), 0.2, 30)).toBe(0);
    expect(employerNoticeDays(law('JP'), 1, 30)).toBe(30);
  });
});

describe('redundancy pay, in weeks', () => {
  it('counts Britain’s whole years by the age in each, from two years', () => {
    expect(redundancyWeeks(LABOR.GB!.redundancy, 23, 30)).toBe(0);
    expect(redundancyWeeks(LABOR.GB!.redundancy, 38, 30)).toBe(3);
    // At 42, the last year at 41 is a week and a half, the two before a week.
    expect(redundancyWeeks(LABOR.GB!.redundancy, 36, 42)).toBe(3.5);
    // Under 22, half a week.
    expect(redundancyWeeks(LABOR.GB!.redundancy, 36, 21)).toBe(1.5);
    // Twenty years at most: thirty years' work at 35 counts ages 15 to 34.
    expect(redundancyWeeks(LABOR.GB!.redundancy, 30 * 12, 35)).toBe(7 * 0.5 + 13);
    // The most there is, 30 weeks: twenty years all from 41, £22,530 at the cap.
    expect(redundancyWeeks(LABOR.GB!.redundancy, 30 * 12, 61) * 751).toBe(22_530);
  });

  it('pays Ireland two weeks a year and one more, Spain 20 days a year to a year’s pay', () => {
    expect(redundancyWeeks(LABOR.IE!.redundancy, 30, 30)).toBeCloseTo(6, 9);
    expect(redundancyWeeks(LABOR.IE!.redundancy, 20, 30)).toBe(0);
    expect(redundancyWeeks(LABOR.ES!.redundancy, 36, 30)).toBeCloseTo(60 / 7, 9);
    expect(redundancyWeeks(LABOR.ES!.redundancy, 30 * 12, 50)).toBeCloseTo(365 / 7, 9);
  });

  it('reads Australia’s table, France’s third after ten years, and Mexico’s three months', () => {
    expect(redundancyWeeks(LABOR.AU!.redundancy, 11, 30)).toBe(0);
    expect(redundancyWeeks(LABOR.AU!.redundancy, 30, 30)).toBe(6);
    expect(redundancyWeeks(LABOR.AU!.redundancy, 130, 30)).toBe(12);
    expect(redundancyWeeks(LABOR.FR!.redundancy, 7, 30)).toBe(0);
    expect(redundancyWeeks(LABOR.FR!.redundancy, 144, 40)).toBeCloseTo(10 * 52 / 48 + 2 * 52 / 36, 9);
    expect(redundancyWeeks(LABOR.MX!.redundancy, 0, 30)).toBeCloseTo(90 / 7, 9);
    expect(redundancyWeeks(law('CA', 'CA-08')!.redundancy, 72, 30)).toBeCloseTo(6, 9);
    expect(redundancyWeeks(law('CA', 'CA-08')!.redundancy, 50, 30)).toBe(0);
    expect(redundancyWeeks(law('CA', 'CA-08')!.redundancy, 50 * 12, 30)).toBe(26);
  });
});

describe('being laid off', () => {
  it('works Ireland’s notice, then pays its redundancy tax-free and goes looking', () => {
    const sim = life('ie-lei-dublin');
    sim.advanceBy(40 * MS_DAY);
    const state = sim.player.job!;
    // Two and a half years with the employer, for a notice and pay to test.
    state.since = sim.now - 30 * 30.4375 * MS_DAY;
    const first = state.employerId;
    const week = averageWeek(sim, sim.player);
    const lastDay = layOff(sim, sim.player)!;
    expect(lastDay - sim.now).toBe(14 * MS_DAY);
    expect(sim.timeline.pending().some((i) => i.kind === SHIFT_KIND && i.at < lastDay)).toBe(true);
    expect(sim.timeline.pending().some((i) => i.kind === SHIFT_KIND && i.at >= lastDay)).toBe(false);
    expect(() => sim.must({ kind: 'work.quit', payload: {} })).toThrow(/already ends/);
    sim.advanceTo(lastDay + MS_DAY);
    const job = sim.player.job!;
    expect(job.lookingUntil).toBeGreaterThan(sim.now);
    expect(job.letGoBy).toBe(first);
    const owed = job.pendingPay?.find((one) => one.name === 'Redundancy Pay') ?? job.lastSlip?.grossLines?.find((one) => one.name === 'Redundancy Pay');
    expect(owed?.amount).toBeGreaterThan(0);
    expect(owed!.amount / 6).toBeGreaterThan(week * 0.5);
    // On the payday, the payslip is worked on the pay without it.
    sim.advanceBy(35 * MS_DAY);
    const slip = sim.player.job!.lastSlip!;
    const paidAt = slip.grossLines!.find((one) => one.name === 'Redundancy Pay')!.amount;
    const age = Math.floor((slip.at - sim.player.birthInstant) / (365.2425 * MS_DAY));
    const weeklyHours = patternHours(patternOf(jobFor(job.jobId), job.fullTime));
    const without = payslipAt(job.cityId, slip.gross - paidAt, 'EUR', slip.at, { age, lastYear: 0, weeklyHours });
    expect(slip.lines).toEqual(without.lines);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('ends at once in Texas, with nothing owed, and finds work elsewhere in three weeks', () => {
    const sim = life('us-tx-houston');
    const first = sim.player.job!.employerId;
    expect(layOff(sim, sim.player)).toBe(sim.now);
    expect(sim.timeline.pending().some((i) => i.kind === SHIFT_KIND)).toBe(false);
    expect(sim.player.job!.pendingPay?.some((one) => one.name === 'Redundancy Pay') ?? false).toBe(false);
    sim.advanceBy(22 * MS_DAY);
    expect(sim.player.job!.lookingUntil).toBeUndefined();
    expect(sim.player.job!.employerId).not.toBe(first);
  });
});

describe('what each country pays out of work', () => {
  const at = Date.UTC(2026, 8, 25);
  /** A steady record: a payday every week for so many weeks before `at`, of so many hours at so much. */
  const steady = (weeks: number, hours: number, gross: number) =>
    Array.from({ length: weeks }, (_, i) => ({ at: at - i * 7 * MS_DAY, days: 7, hours, gross })).reverse();
  const ctx = (age: number, why: 'laidOff' | 'cause' | 'quit' = 'laidOff') => ({ age, at, why });

  it('works Japan’s allowance by the ministry’s own formula and examples', () => {
    expect(japanDaily(6_000, 35)).toBe(4_683);
    expect(japanDaily(9_000, 35)).toBe(6_013);
    expect(japanDaily(3_000, 35)).toBe(2_562);
    expect(japanDaily(20_000, 29)).toBe(7_450);
    expect(japanDaily(15_000, 50)).toBe(7_500);
    expect(japanDismissedDays(40, 2)).toBe(150);
    expect(japanDismissedDays(40, 0.5)).toBe(90);
    expect(japanDismissedDays(50, 12)).toBe(270);
  });

  it('reads Canada’s table of weeks by hours and the region’s unemployment', () => {
    expect(eiWeeks(700, 5)).toBe(14);
    expect(eiWeeks(699, 5)).toBe(0);
    expect(eiWeeks(420, 13.5)).toBe(26);
    expect(eiWeeks(1_820, 5)).toBe(36);
    expect(eiWeeks(2_000, 20)).toBe(45);
    expect(eiHoursNeeded(5)).toBe(700);
    expect(eiHoursNeeded(8)).toBe(630);
    expect(eiHoursNeeded(14)).toBe(420);
    // Two weeks more for each point of unemployment, row by row.
    for (let hours = 700; hours <= 1_300; hours += 35) expect(eiWeeks(hours, 7) - eiWeeks(hours, 6)).toBe(2);
  });

  it('runs Germany’s by the months insured, and takes 60% of the net', () => {
    const de = BENEFITS.DE!;
    expect(de.qualifies(steady(40, 30, 450), ctx(30))).toMatch(/12 months/);
    const year = steady(60, 30, 450);
    expect(de.qualifies(year, ctx(30))).toBeUndefined();
    expect(de.weeks!(year, ctx(30), 0)).toBeCloseTo(6 * 52 / 12, 6);
    expect(de.weeks!(steady(105, 30, 450), ctx(30), 0)).toBeCloseTo(12 * 52 / 12, 6);
    const basis = de.basis(year, ctx(30));
    expect(basis).toBeLessThan(450 * 0.6);
    expect(basis).toBeGreaterThan(450 * 0.6 * 0.6);
  });

  it('pays Spain 70% then 60% of the base, between its floor and ceiling', () => {
    const es = BENEFITS.ES!;
    const record = steady(60, 30, 400);
    expect(es.qualifies(steady(40, 30, 400), ctx(30))).toMatch(/360 days/);
    const basis = es.basis(record, ctx(30));
    expect(basis).toBeCloseTo(400, 6);
    expect(es.amount(basis, 1, { age: 30, savings: 0, share: 1 })).toBeCloseTo(280, 6);
    expect(es.amount(basis, 27, { age: 30, savings: 0, share: 1 })).toBeCloseTo(240, 6);
    expect(es.amount(2_000, 1, { age: 30, savings: 0, share: 1 })).toBeCloseTo(1_225 * 12 / 52, 6);
    // 420 days contributed: 120 days.
    expect(es.weeks!(record, ctx(30), basis)).toBeCloseTo(120 / 7, 6);
  });

  it('pays France the greater of its two formulas, never over 75%', () => {
    const fr = BENEFITS.FR!;
    // A daily wage of €60: 57% is 34.20, 40.4% plus 13.18 is 37.42.
    expect(fr.amount(60 * 7, 1, { age: 30, savings: 0, share: 1 }) / 7).toBeCloseTo(37.42, 6);
    // A low wage is held to 75% of it.
    expect(fr.amount(35 * 7, 1, { age: 30, savings: 0, share: 1 }) / 7).toBeCloseTo(26.25, 6);
    expect(fr.weeks!(steady(40, 30, 400), ctx(30), 0)).toBeCloseTo(280 * 0.75 / 7, 6);
  });

  it('takes Iceland’s rights a twelfth a month, and its income-linked weeks', () => {
    const is = BENEFITS.IS!;
    const record = steady(35, 40, 150_000);
    expect(is.qualifies(steady(26, 40, 150_000), ctx(30))).toMatch(/7 months/);
    const share = is.share!(record, ctx(30));
    expect(share).toBeCloseTo(245 / 30.4375 / 12, 6);
    const basis = is.basis(record, ctx(30));
    expect(is.amount(basis, 1, { age: 30, savings: 0, share })).toBeCloseTo(383_870 * 12 / 52 * share, 4);
    expect(is.amount(basis, 3, { age: 30, savings: 0, share })).toBeCloseTo(Math.min(0.7 * basis, 605_159) * 12 / 52 * share, 4);
  });

  it('pays a US state from its quarters, and Britain Universal Credit before two years of National Insurance', () => {
    const tx = BENEFITS['US-TX']!;
    const record = steady(40, 30, 450);
    const [high] = baseQuarters(record, at);
    expect(tx.basis(record, ctx(30))).toBe(Math.floor(Math.min(605, Math.max(75, high! / 25))));
    const gb = BENEFITS.GB!;
    expect(gb.qualifies(record, ctx(30))).toMatch(/National Insurance/);
    expect(gb.fallback!.name).toBe('Universal Credit');
  });
});

describe('a claim', () => {
  it('pays Houston’s benefit weekly in arrears after the waiting week, and settles the days owed on going back', () => {
    const sim = life('us-tx-houston');
    sim.advanceBy(300 * MS_DAY);
    const last = layOff(sim, sim.player)!;
    sim.advanceTo(last + MS_DAY);
    const offer = claimFor(sim, sim.player);
    expect('refused' in offer).toBe(false);
    const { paysFrom, weekly } = sim.must<{ paysFrom: number; weekly: number }>({ kind: 'work.claim', payload: {} });
    expect(paysFrom - sim.now).toBe(7 * MS_DAY);
    const bank = () => sim.universe.transactions.filter((t) => t.category === 'benefit').reduce((sum, t) => sum + (t.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount ?? 0), 0);
    sim.advanceTo(paysFrom + 7 * MS_DAY + MS_DAY);
    expect(bank()).toBe(weekly);
    sim.advanceBy(40 * MS_DAY);
    // Back in work, the claim is gone, with the days to the new start paid.
    expect(sim.player.earnings?.claim).toBeUndefined();
    const back = sim.player.job!.since;
    expect(bank()).toBeCloseTo(weekly * ((back - paysFrom) / (7 * MS_DAY)), -2);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('refuses a claim to somebody who quit where the law bars it, and to somebody in work', () => {
    const sim = life('us-tx-houston');
    sim.advanceBy(300 * MS_DAY);
    expect(() => sim.must({ kind: 'work.claim', payload: {} })).toThrow(/in work/);
    sim.must({ kind: 'work.quit', payload: {} });
    expect(() => sim.must({ kind: 'work.claim', payload: {} })).toThrow(/quit/);
  });
});

describe('who qualifies, and what quitting costs', () => {
  const at = Date.UTC(2026, 8, 25);
  const steady = (weeks: number, hours: number, gross: number) =>
    Array.from({ length: weeks }, (_, i) => ({ at: at - i * 7 * MS_DAY, days: 7, hours, gross })).reverse();
  const ctx = (age: number, why: 'laidOff' | 'cause' | 'quit' = 'laidOff') => ({ age, at, why });

  it('tests a US base period by each state’s own rule', () => {
    // $300 a week: about $3,900 a quarter.
    expect(BENEFITS['US-NY']!.qualifies(steady(60, 25, 300), ctx(30))).toBeUndefined();
    expect(BENEFITS['US-NY']!.qualifies(steady(60, 25, 200), ctx(30))).toMatch(/\$3,500/);
    // Only the last quarter or two on record, none of it in the base period yet.
    expect(BENEFITS['US-NY']!.qualifies(steady(12, 25, 300), ctx(30))).toMatch(/two quarters/);
    expect(BENEFITS['US-WA']!.qualifies(steady(60, 12, 300), ctx(30))).toMatch(/680 hours/);
    expect(BENEFITS['US-WA']!.qualifies(steady(60, 20, 300), ctx(30))).toBeUndefined();
    expect(BENEFITS['US-IL']!.qualifies(steady(60, 25, 300), ctx(30))).toBeUndefined();
    expect(BENEFITS['US-CA']!.qualifies(steady(60, 5, 60), ctx(30))).toMatch(/\$1,300/);
  });

  it('takes Universal Credit down for savings over £6,000, and to nothing over £16,000', () => {
    const uc = BENEFITS.GB!.fallback!;
    const week = (savings: number) => uc.amount(0, 1, { age: 30, savings, share: 1 });
    expect(week(5_000)).toBeCloseTo(424.90 * 12 / 52, 6);
    expect(week(6_001)).toBeCloseTo((424.90 - 4.35) * 12 / 52, 6);
    expect(week(7_000)).toBeCloseTo((424.90 - 4 * 4.35) * 12 / 52, 6);
    expect(week(16_001)).toBe(0);
    expect(uc.amount(0, 1, { age: 24, savings: 0, share: 1 })).toBeCloseTo(338.58 * 12 / 52, 6);
  });

  it('asks Britain’s National Insurance of the two tax years before last', () => {
    const jsa = BENEFITS.GB!;
    const years = Array.from({ length: 156 }, (_, i) => ({ at: at - i * 7 * MS_DAY - 500 * MS_DAY, days: 7, hours: 20, gross: 250 }));
    expect(jsa.qualifies(years, ctx(30))).toBeUndefined();
    expect(jsa.qualifies(steady(60, 20, 250), ctx(30))).toMatch(/2023\/24/);
  });

  it('cuts a worker who quit in Germany for twelve weeks, and a quarter off the weeks', () => {
    expect(BENEFITS.DE!.quit).toEqual({ weeks: 12, cut: 0.25 });
  });

  it('cuts jobs as often as the BLS and the ONS count', () => {
    const monthOf = (daily: number) => 1 - (1 - daily) ** 30.4375;
    expect(monthOf(layoffChanceADay('US', 'hospitality'))).toBeCloseTo(15.2 / 1_200, 9);
    expect(monthOf(layoffChanceADay('US', 'retail'))).toBeCloseTo(11.5 / 1_200, 9);
    expect(monthOf(layoffChanceADay('US', 'office'))).toBeCloseTo(13.1 / 1_200, 9);
    expect(monthOf(layoffChanceADay('GB', 'office'))).toBeCloseTo(0.0013, 9);
    expect(layoffChanceADay('DE', 'office')).toBe(layoffChanceADay('GB', 'office'));
  });
});

describe('a claim after quitting', () => {
  it('waits out Germany’s twelve weeks and pays a quarter fewer weeks', () => {
    const sim = life('de-be-berlin');
    sim.advanceBy(420 * MS_DAY);
    sim.must({ kind: 'work.quit', payload: {} });
    sim.advanceBy(40 * MS_DAY);
    const offer = claimFor(sim, sim.player);
    expect('refused' in offer).toBe(false);
    if ('refused' in offer) return;
    expect(offer.barWeeks).toBe(12);
    const { paysFrom, until } = sim.must<{ paysFrom: number; until: number }>({ kind: 'work.claim', payload: {} });
    expect(paysFrom - sim.now).toBe(12 * 7 * MS_DAY);
    expect((until - paysFrom) / (7 * MS_DAY)).toBeCloseTo(6 * 52 / 12 * 0.75, 6);
    expect(sim.player.job?.lookingUntil).toBeGreaterThan(sim.now);
  });
});

describe('the rules the first tests left loose', () => {
  const at = Date.UTC(2026, 8, 25);
  const ctx = (age: number, why: 'laidOff' | 'cause' | 'quit' = 'laidOff') => ({ age, at, why });
  /** Weekly paydays, oldest first, with a gross for each. */
  const weeksOf = (grosses: number[], hours = 30) =>
    grosses.map((gross, i) => ({ at: at - (grosses.length - 1 - i) * 7 * MS_DAY, days: 7, hours, gross }));

  it('holds a week’s pay to the law’s cap for redundancy pay', () => {
    const toSave = (units: number) => units * 100;
    // Three whole years at 30 in Britain: three weeks, at most £751 each.
    expect(redundancyPay(LABOR.GB!.redundancy!, 38, 30, 500_00, toSave)).toBe(3 * 500_00);
    expect(redundancyPay(LABOR.GB!.redundancy!, 38, 30, 900_00, toSave)).toBe(3 * 751_00);
  });

  it('takes Canada’s average from the best 21 weeks, and holds it to $729', () => {
    const ei = BENEFITS['CA-08']!;
    // 21 weeks at $600 and 20 at $300: the best 21 are the $600s.
    const record = weeksOf([...Array(20).fill(300), ...Array(21).fill(600)]);
    expect(ei.basis(record, ctx(30))).toBeCloseTo(600 * 0.55, 6);
    expect(ei.basis(weeksOf(Array(41).fill(2_000)), ctx(30))).toBe(729);
  });

  it('gives Japan’s 90 days to somebody who quit, where a dismissal at 40 gets more', () => {
    const jp = BENEFITS.JP!;
    const two = weeksOf(Array(110).fill(60_000));
    expect(jp.weeks!(two, ctx(40, 'quit'), 0)).toBeCloseTo(90 / 7, 6);
    expect(jp.weeks!(two, ctx(40, 'laidOff'), 0)).toBeCloseTo(150 / 7, 6);
  });

  it('runs Germany’s longer only from the age the table names', () => {
    const de = BENEFITS.DE!;
    const three = weeksOf(Array(160).fill(450));
    expect(de.weeks!(three, ctx(40), 0)).toBeCloseTo(12 * 52 / 12, 6);
    expect(de.weeks!(three, ctx(55), 0)).toBeCloseTo(18 * 52 / 12, 6);
  });

  it('asks 50 times Britain’s limit in each of the two years, not only in one', () => {
    const jsa = BENEFITS.GB!;
    // 2023/24 at £250 a week, 2024/25 at £100 a week: the second is under 50 times £123.
    const paid = (from: number, to: number, gross: number) => {
      const out = [];
      for (let t = from; t < to; t += 7 * MS_DAY) out.push({ at: t, days: 7, hours: 20, gross });
      return out;
    };
    const record = [...paid(Date.UTC(2023, 3, 10), Date.UTC(2024, 3, 1), 250), ...paid(Date.UTC(2024, 3, 10), Date.UTC(2024, 5, 1), 100)];
    expect(jsa.qualifies(record, ctx(30))).toMatch(/National Insurance/);
    const both = [...paid(Date.UTC(2023, 3, 10), Date.UTC(2024, 3, 1), 250), ...paid(Date.UTC(2024, 3, 10), Date.UTC(2025, 3, 1), 250)];
    expect(jsa.qualifies(both, ctx(30))).toBeUndefined();
  });
});

describe('how the job ended', () => {
  it('owes no redundancy pay to somebody who quits, however long they worked', () => {
    const sim = life('ie-lei-dublin');
    sim.advanceBy(40 * MS_DAY);
    sim.player.job!.since = sim.now - 30 * 30.4375 * MS_DAY;
    const { leavingAt } = sim.must<{ leavingAt: number }>({ kind: 'work.quit', payload: {} });
    sim.advanceTo(leavingAt + MS_DAY);
    const job = sim.player.job;
    const owed = job?.pendingPay?.some((one) => one.name === 'Redundancy Pay') || job?.lastSlip?.grossLines?.some((one) => one.name === 'Redundancy Pay');
    expect(owed ?? false).toBe(false);
  });

  it('lets somebody go for cause who misses shifts in a layoff’s notice, with no redundancy pay', () => {
    const sim = life('ie-lei-dublin');
    sim.advanceBy(40 * MS_DAY);
    sim.player.job!.since = sim.now - 30 * 30.4375 * MS_DAY;
    const lastDay = layOff(sim, sim.player)!;
    // Away from town for the notice, so its shifts are missed; a sick day
    // here would be paid, and a paid one isn't held against anybody.
    const home = sim.player.currentLocationId;
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceTo(lastDay - MS_DAY);
    sim.player.currentLocationId = home;
    expect(sim.player.earnings?.lastLeft?.why).toBe('cause');
    expect(sim.player.job!.pendingPay?.some((one) => one.name === 'Redundancy Pay') ?? false).toBe(false);
  });

  it('keeps a layoff a layoff when the search is given up, and waits for a new job that starts later', () => {
    const sim = life('us-tx-houston');
    sim.advanceBy(300 * MS_DAY);
    layOff(sim, sim.player);
    sim.must({ kind: 'work.quit', payload: {} });
    expect(sim.player.earnings?.lastLeft?.why).toBe('laidOff');

    // In Seoul a worker's notice is a month, so a job applied for late in a
    // layoff's month starts more than three weeks after the last day.
    const seoul = life('kr-11-seoul');
    seoul.advanceBy(40 * MS_DAY);
    seoul.player.job!.since = seoul.now - 4 * 30.4375 * MS_DAY;
    const lastDay = layOff(seoul, seoul.player)!;
    seoul.advanceTo(lastDay - 5 * MS_DAY);
    const current = seoul.player.job!.employerId;
    const other = Object.values(EMPLOYERS.KR!).flatMap((line) => line.employers).find((one) => one.id !== current)!;
    const { startsAt } = seoul.must<{ startsAt: number }>({ kind: 'work.apply', payload: { employerId: other.id } });
    expect(startsAt - lastDay).toBeGreaterThan(21 * MS_DAY);
    seoul.advanceTo(lastDay + MS_DAY);
    expect(seoul.player.job!.lookingUntil).toBeGreaterThanOrEqual(startsAt);
  });
});

describe('Korea’s benefit days', () => {
  it('runs by the years insured, and longer from 50', () => {
    const at = Date.UTC(2026, 8, 25);
    const years = (n: number) => Array.from({ length: Math.round(n * 52) }, (_, i) => ({ at: at - i * 7 * MS_DAY, days: 7, hours: 30, gross: 400_000 })).reverse();
    const kr = BENEFITS.KR!;
    expect(kr.weeks!(years(0.5), { age: 30, at, why: 'laidOff' }, 0)).toBeCloseTo(120 / 7, 6);
    expect(kr.weeks!(years(2), { age: 30, at, why: 'laidOff' }, 0)).toBeCloseTo(150 / 7, 6);
    expect(kr.weeks!(years(2), { age: 55, at, why: 'laidOff' }, 0)).toBeCloseTo(180 / 7, 6);
  });
});

describe('Australia’s waits, and Mexico’s severance free of tax to 90 UMA a year', () => {
  it('waits a week for each $500 of savings over $5,000, then the ordinary week, and four weeks for quitting alongside', () => {
    const au = BENEFITS.AU!;
    expect(au.wait!({ savings: 7_300 })).toBe(4 * 7 + 7);
    expect(au.wait!({ savings: 5_400 })).toBe(7);
    expect(au.wait!({ savings: 50_000 })).toBe(13 * 7 + 7);
    expect(au.concurrentBar).toBe(true);
    expect(au.amount(0, 1, { age: 30, savings: 0, share: 1 })).toBeCloseTo(824.90 / 2, 6);
    expect(au.amount(0, 1, { age: 20, savings: 0, share: 1 })).toBeCloseTo(677.20 / 2, 6);
    expect(au.amount(0, 1, { age: 30, savings: 700_000, share: 1 })).toBe(0);
    // Quitting: four weeks from the day the job ended, alongside the other waits.
    const sim = life('au-nsw-sydney');
    sim.advanceBy(300 * MS_DAY);
    sim.must({ kind: 'work.quit', payload: {} });
    sim.advanceBy(8 * MS_DAY);
    const offer = claimFor(sim, sim.player);
    const savings = netWorth(sim, sim.player.id).cash / 100;
    expect('refused' in offer ? offer.refused : offer.waitDays).toBe(Math.max(au.wait!({ savings }), 28));
  });

  it('pays a Mexico City layoff’s severance free of ISR to 90 UMA a year, and taxes the rest', () => {
    const sim = life('mx-cmx-mexicocity');
    // A year and a month worked: one year counts, its month under six.
    sim.advanceBy(400 * MS_DAY);
    layOff(sim, sim.player);
    const pay = sim.player.job!.pendingPay!.filter((one) => one.name === 'Redundancy Pay');
    const free = Math.round(90 * 117.31 * 100);
    expect(pay.find((one) => one.taxFree)?.amount).toBe(exchange(free, 'MXN', saveCurrency(sim.universe)) ?? free);
    expect(pay.some((one) => !one.taxFree && one.amount > 0)).toBe(true);
  });
});