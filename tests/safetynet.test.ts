/**
 * What the business added after its first portion (`systems/career.ts`,
 * `systems/health.ts`, `systems/unemployment.ts`, `systems/taxreturn.ts`):
 * Off-Broadway and series regulars, overtime, managers, residuals, health
 * cover, unemployment insurance and the tax return, against the published
 * figures in `content/career.ts` and `content/safetynet.ts`.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { computeAnnualTax } from '@/engine/content/tax';
import { AGENCIES, MANAGEMENT, MANAGERS, OVERTIME, RESIDUALS, UNION_HEALTH, rateOn } from '@/engine/content/career';
import { BENCHMARK, CALIFORNIA_MANDATE, NEW_YORK_UI, RETURN, byYear, CONNECTICUT_UI, INSULIN, PLANS } from '@/engine/content/safetynet';
import {
  RESIDUAL_KIND, afterlife, beginCareer, careerOf, managerOffersFor, mealPenalty, overtimeFor, paycheck, residualAmount, roleById, weekOfAuditions, workDays,
  type Booking,
} from '@/engine/systems/career';
import { earningsOf, recordBenefit, recordWages, yearOf } from '@/engine/systems/earnings';
import { coverOn, healthMonth, healthOf, mayEnroll, yaleUntil, programFor, benchmarkFor, planKey, shareOf, insulinShareOf } from '@/engine/systems/health';
import { basePeriodFor, monetary, unemploymentOf, weekBenefit, type Claim } from '@/engine/systems/unemployment';
import { applicablePercent, deadline, figuresFor, latePenalty, returnsOf } from '@/engine/systems/taxreturn';
import type { Simulation } from '@/engine/core/simulation';
import type { Craft } from '@/engine/systems/school';
import { hoursOf } from '@/engine/systems/career';

const hoursOfDay = (sim: Simulation, n: number) => hoursOf(sim, sim.player, `spread-${n}`);

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, zone = NY) => instantFromZoned({ year, month, day, hour }, zone);
const craft = (level: number): Craft => ({ acting: level, voice: level, speech: level, body: level, text: level, singing: level, screen: level });
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };

function pro(seed: string, city = 'us-ny-newyork', level = 75): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = craft(level);
  beginCareer(sim, sim.player);
  return sim;
}
function booking(sim: Simulation, roleId: string, units: number, starts = sim.now + 7 * MS_DAY, rehearsalWeeks = 0): Booking {
  const b: Booking = { id: `t${careerOf(sim.player).bookings.length}`, roleId, cityId: 'us-ny-newyork', starts, units, rehearsalWeeks, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, weeksPaid: 0 };
  careerOf(sim.player).bookings.push(b);
  return b;
}
const claimOf = (state: 'ny' | 'ca' | 'ct', weekly: number): Claim => ({ state, filedAt: 0, endsAt: 1e15, weekly, maxTotal: 1e12, paid: 0, weeksPaid: 0, waited: true, basePeriod: [] });

describe('new parts', () => {
  it('pay Off-Broadway’s minimums from the audition notices, and a series regular by the episode', () => {
    expect(rateOn(roleById('offb-commercial').steps, '2027-01-01')).toBe(868_00);
    expect(rateOn(roleById('offb-nonprofit').steps, '2026-01-01')).toBe(1_076_00);
    expect(rateOn(roleById('offb-nonprofit').steps, '2027-01-01')).toBe(1_129_00);
    expect(rateOn(roleById('series-hour').steps, '2026-07-01')).toBe(5_361_00);
    expect(rateOn(roleById('series-half').steps, '2029-07-01')).toBe(4_870_00);
  });

  it('put a series regular’s season in its workweeks, Monday to Friday, and pay it by the episode over them', () => {
    const sim = pro('series');
    const b = booking(sim, 'series-hour', 13, at(2026, 10, 5, 8));
    const days = workDays(b);
    expect(days).toHaveLength(16 * 5);
    expect(new Set(days.map((d) => new Date(d.at - 5 * MS_HOUR).getUTCDay()))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 15, 18));
    const pay = sim.universe.transactions.filter((t) => t.memo.startsWith('Series Regular'))[0]!;
    const scale = Math.round((5_361_00 * 13 * 5) / 80);
    // The Thursday pays the week to the Saturday before: the first five days, and their overtime.
    const overtime = careerOf(sim.player).days.slice(0, 5).reduce((s, d, n) => s + overtimeFor(roleById('series-hour'), 5_361_00, 1_283_00, d.hours, '2026-10-05') + mealPenalty(sim, sim.player, `${b.id}-${n + 1}`), 0);
    // Unrepresented: scale, with no agency's 10% on it.
    expect(-pay.postings.find((q) => q.amount < 0)!.amount).toBe(scale + overtime);
  });
});

describe('overtime', () => {
  it('pays a day player’s ninth and tenth hours at time and a half and the rest at double, on the day over eight', () => {
    const costar = roleById('costar');
    const hourly = 1_283_00 / 8;
    expect(overtimeFor(costar, 1_283_00, 1_283_00, 8, '2026-10-01')).toBe(0);
    expect(overtimeFor(costar, 1_283_00, 1_283_00, 10, '2026-10-01')).toBe(Math.round(hourly * 3));
    expect(overtimeFor(costar, 1_283_00, 1_283_00, 12, '2026-10-01')).toBe(Math.round(hourly * 7));
    // The base is capped at twice the day minimum.
    expect(overtimeFor(costar, 5_000_00, 1_283_00, 9, '2026-10-01')).toBe(Math.round(((2 * 1_283_00) / 8) * 1.5));
  });

  it('pays a weekly performer double past ten hours on the week over 44, and above the money break at its rate', () => {
    const film = roleById('film-weekly');
    // A studio film's weekly scale, $4,456, is under the break.
    expect(overtimeFor(film, 891_20, 1_283_00, 12, '2026-10-01')).toBe(Math.round(2 * ((2 * 891_20 * 5) / 44)));
    // A guest star's major role, $1,411 a day, is a $7,056 week: over the break, at $236 an hour.
    expect(overtimeFor(roleById('guest-hour'), 1_411_25, 1_283_00, 11, '2026-10-01')).toBe(OVERTIME.moneyBreak[0]![2]);
    expect(overtimeFor(roleById('guest-hour'), 1_411_25, 1_283_00, 11, '2028-08-01')).toBe(OVERTIME.moneyBreak[1]![2]);
    // A series regular's week is five-sixths of an hour episode's fee, under the break.
    expect(overtimeFor(roleById('series-hour'), 5_361_00, 1_283_00, 12, '2026-10-01')).toBe(Math.round(2 * ((2 * 5_361_00 * 5) / 6 / 44)));
    expect(overtimeFor(roleById('series-half'), 4_456_00, 1_283_00, 12, '2026-10-01')).toBe(Math.round(2 * ((2 * 4_456_00) / 44)));
    // A stage part has none.
    expect(overtimeFor(roleById('lort-b'), 1_213_00, 1_283_00, 14, '2026-10-01')).toBe(0);
  });

  it('logs a rehearsal day at eight hours and a performance at three', () => {
    const sim = pro('stage-hours');
    const b = booking(sim, 'lort-b', 1, at(2026, 10, 5, 8), 1);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 14, 23));
    expect(careerOf(sim.player).days.map((d) => d.hours)).toEqual([8, 8, 8, 8, 8, 8, 3, 3]);
  });

  it('draws each shooting day at ten to twelve hours', () => {
    const sim = pro('hours');
    const b = booking(sim, 'costar', 2, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 7, 12));
    const days = careerOf(sim.player).days;
    expect(days).toHaveLength(2);
    const spread = new Set(Array.from({ length: 40 }, (_, n) => hoursOfDay(sim, n)));
    expect(spread).toEqual(new Set([10, 11, 12]));
    for (const d of days) expect(d.hours).toBeGreaterThanOrEqual(OVERTIME.dayHours[0]);
    for (const d of days) expect(d.hours).toBeLessThanOrEqual(OVERTIME.dayHours[1]);
  });
});

describe('managers', () => {
  it('offer only where their bar is cleared, and are signed only on a standing offer', () => {
    const sim = pro('mgr');
    expect(managerOffersFor(sim, sim.player, 60, 'x')).toEqual([]);
    let seen = 0;
    for (let n = 0; n < 30; n += 1) {
      const got = managerOffersFor(sim, sim.player, 70.5, `k${n}`);
      for (const id of got) expect(MANAGERS.find((m) => m.id === id)!.bar).toBeLessThanOrEqual(70.5);
      seen += got.length;
    }
    expect(seen).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'career.sign_manager', payload: { managerId: '3arts' } }).ok).toBe(false);
    careerOf(sim.player).managerOffers.push({ managerId: '3arts', until: sim.now + MS_DAY });
    expect(sim.execute({ kind: 'career.sign_manager', payload: { managerId: '3arts' } }).ok).toBe(true);
    expect(careerOf(sim.player)).toMatchObject({ managerId: '3arts', managerOffers: [] });
  });

  it('take 10% beside an agent and 15% without one', () => {
    const role = roleById('lort-b');
    const args = { scale: 1_000_00, role, rehearsal: false, before: 0, cityId: 'us-ny-newyork', at: at(2026, 10, 1) };
    expect(paycheck({ ...args, represented: true, managed: true })).toMatchObject({ agent: 100_00, manager: 100_00, commission: 200_00 });
    expect(paycheck({ ...args, represented: false, managed: true })).toMatchObject({ agent: 0, manager: 150_00 });
    expect(paycheck({ ...args, represented: true, managed: false }).manager).toBe(0);
  });

  it('can be left after the first year, not before', () => {
    const sim = pro('mgr-leave');
    const career = careerOf(sim.player);
    career.managerId = 'e360';
    career.managerSince = sim.now - 100 * MS_DAY;
    expect(sim.execute({ kind: 'career.leave_manager', payload: {} }).ok).toBe(false);
    career.managerSince = sim.now - MANAGEMENT.minimumDays * MS_DAY;
    expect(sim.execute({ kind: 'career.leave_manager', payload: {} }).ok).toBe(true);
    expect(career.managerId).toBeUndefined();
  });

  it('add auditions a week, and find an unrepresented client agencies', () => {
    const sim = pro('mgr-work');
    let without = 0;
    let withOne = 0;
    for (let w = 0; w < 100; w += 1) {
      without += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 0, false).length;
      withOne += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 0, true).length;
    }
    expect(without).toBe(0);
    expect(withOne / 100).toBeGreaterThan(MANAGEMENT.auditionsPerWeek * 0.7);
    expect(withOne / 100).toBeLessThan(MANAGEMENT.auditionsPerWeek * 1.3);
    let found = 0;
    for (const seed of ['f1', 'f2', 'f3']) {
      const life = pro(seed, 'us-ny-newyork', 90);
      careerOf(life.player).managerId = 'brillstein';
      careerOf(life.player).managerSince = life.now;
      play(life, life.now + 200 * MS_DAY);
      found += careerOf(life.player).offers.length + (careerOf(life.player).agencyId ? 1 : 0);
    }
    expect(found).toBeGreaterThan(0);
    expect(AGENCIES.length).toBeGreaterThan(0);
  }, 120_000);
});

describe('residuals', () => {
  it('pay a network rerun what was paid, to the ceiling; syndication a share of the minimum by the run', () => {
    const sim = pro('res');
    const base = { id: 'r', bookingId: 'b', roleId: 'guest-hour', kind: 'network' as const, perEpisode: 11_290_00, episodes: 1, days: 8, airsAt: 0, paid: 0, payments: 0 };
    expect(residualAmount(base, 'rerun', 2, sim.now, NY, 'USD')).toBe(RESIDUALS.networkCeiling.hour);
    expect(residualAmount({ ...base, perEpisode: 2_000_00 }, 'rerun', 2, sim.now, NY, 'USD')).toBe(2_000_00);
    expect(residualAmount(base, 'syndication', 2, sim.now, NY, 'USD')).toBe(Math.round(11_290_00 * 0.4));
    expect(residualAmount(base, 'syndication', 13, sim.now, NY, 'USD')).toBe(Math.round(11_290_00 * 0.05));
    expect(residualAmount({ ...base, episodes: 13 }, 'syndication', 3, sim.now, NY, 'USD')).toBe(Math.round(11_290_00 * 0.3) * 13);
  });

  it('pay streaming each year by its share and the service’s size, to the ceiling, and a hit its bonus', () => {
    const r = { id: 'r', bookingId: 'b', roleId: 'series-hour', kind: 'svod' as const, size: 'large' as const, perEpisode: 5_361_00, episodes: 13, days: 80, airsAt: 0, paid: 0, payments: 0 };
    const when = at(2026, 10, 1);
    expect(residualAmount(r, 'svod', 1, when, NY, 'USD')).toBe(Math.round(4_562_00 * 0.45 * 1.5) * 13);
    expect(residualAmount({ ...r, size: 'small' }, 'svod', 2, when, NY, 'USD')).toBe(Math.round(4_562_00 * 0.40 * 0.65) * 13);
    expect(residualAmount(r, 'svod', 20, when, NY, 'USD')).toBe(Math.round(4_562_00 * 0.015 * 1.5) * 13);
    expect(residualAmount(r, 'bonus', 1, when, NY, 'USD')).toBe(Math.round(residualAmount(r, 'svod', 1, when, NY, 'USD') * 1.1 * 0.75));
  });

  it('share a film’s television and streaming money by the cast’s units', () => {
    const sim = pro('film');
    const r = { id: 'r', bookingId: 'b', roleId: 'film-low', kind: 'film' as const, perEpisode: 834_00 * 5, episodes: 1, days: 5, airsAt: 0, paid: 0, payments: 0 };
    // A week: one time unit and one salary unit, of 40, of 3.6% of a quarter of a $1.35 million budget.
    expect(residualAmount(r, 'film', 1, sim.now, NY, 'USD')).toBe(Math.round((1_350_000_00 * 0.25 * 0.036 * 2) / 40));
    expect(residualAmount(r, 'film', 2, sim.now, NY, 'USD')).toBe(Math.round((1_350_000_00 * 0.125 * 0.036 * 2) / 40));
  });

  it('are scheduled when a job’s done, and paid as wages with tax withheld and no commission', () => {
    const sim = pro('paid-res');
    const b = { ...booking(sim, 'guest-hour', 8), status: 'worked' as const, worked: 8 };
    let r = afterlife(sim, sim.player, b, sim.now)!;
    for (let n = 0; r.kind !== 'svod' && n < 30; n += 1) r = afterlife(sim, sim.player, { ...b, id: `x${n}` }, sim.now)!;
    expect(r.kind).toBe('svod');
    const first = pending(sim, RESIDUAL_KIND).find((i) => i.payload.residualId === r.id && i.payload.stream === 'svod')!;
    expect(first.at).toBeGreaterThan(r.airsAt + 90 * MS_DAY);
    play(sim, first.at + MS_HOUR);
    expect(r.payments).toBe(1);
    const pay = sim.universe.transactions.find((t) => t.memo.startsWith('Residuals'))!;
    expect(pay.category).toBe('salary');
    expect(yearOf(sim.player, zonedParts(first.at, NY).year).residuals).toBe(r.paid);
    expect(pending(sim, RESIDUAL_KIND).some((i) => i.payload.residualId === r.id && i.payload.n === 2)).toBe(true);
  });
});

describe('health cover', () => {
  it('Yale’s runs to the end of July after school ends', () => {
    const sim = pro('yale');
    sim.player.school = { standing: 'graduated' } as never;
    careerOf(sim.player).since = at(2029, 5, 28);
    expect(yaleUntil(sim.player)).toBe(at(2029, 8, 1, 0));
    expect(coverOn(sim.player, at(2029, 7, 31))).toBe('yale');
    expect(coverOn(sim.player, at(2029, 8, 2))).toBeUndefined();
  });

  it('SAG-AFTRA’s: a base period’s earnings at the threshold give a year from three months after, for its premium', () => {
    const sim = pro('sag-health');
    const person = sim.player;
    for (const q of ['2025-4', '2026-1', '2026-2', '2026-3']) earningsOf(person).quarters[q] = { wages: 7_100_00, sag: 7_100_00 };
    healthMonth(sim, person, at(2027, 1, 1, 1));
    expect(healthOf(person).sag).toEqual({ from: at(2027, 1, 1, 1), until: at(2028, 1, 1, 0) });
    expect(sim.universe.transactions.some((t) => t.memo === 'SAG-AFTRA Health Plan premium')).toBe(true);
    // On the ledger's line for care, not food's.
    expect(sim.nominalAccount('expense', 'Medical Care').balance).toBeGreaterThan(0);
    // A premium the bank can't pay ends the plan, as COBRA's would.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === person.id && a.balance > 0 && a.kind !== 'escrow') a.balance = 0;
    sim.universe.accounts[person.primaryAccountId!]!.balance = -100_000_00;
    healthMonth(sim, person, at(2027, 4, 1, 1));
    expect(healthOf(person).sag!.until).toBe(at(2027, 4, 1, 1));
    // And Equity-League's.
    healthOf(person).equity = { from: at(2027, 1, 1, 0), until: at(2027, 12, 1, 0) };
    healthMonth(sim, person, at(2027, 5, 1, 1));
    expect(healthOf(person).equity!.until).toBe(at(2027, 5, 1, 1));
    const short = pro('sag-short');
    for (const q of ['2025-4', '2026-1', '2026-2', '2026-3']) earningsOf(short.player).quarters[q] = { wages: 6_000_00, sag: 6_000_00 };
    healthMonth(short, short.player, at(2027, 1, 1, 1));
    expect(healthOf(short.player).sag).toBeUndefined();
    expect(byYear(UNION_HEALTH.sagThreshold, 2026)).toBe(28_090_00);
  });

  it('Equity-League’s: ten weeks in a year give six months from two months after', () => {
    const sim = pro('eq-health');
    const weeks = earningsOf(sim.player).equityWeeks;
    for (let n = 0; n < 10; n += 1) weeks.push(`2026-0${Math.floor(n / 4) + 7}-${String(1 + (n % 4) * 7).padStart(2, '0')}`);
    healthMonth(sim, sim.player, at(2026, 10, 1, 1));
    expect(healthOf(sim.player).equity).toEqual({ from: at(2026, 12, 1, 0), until: at(2027, 6, 1, 0) });
    weeks.pop();
    const fewer = pro('eq-fewer');
    earningsOf(fewer.player).equityWeeks.push(...weeks);
    healthMonth(fewer, fewer.player, at(2026, 10, 1, 1));
    expect(healthOf(fewer.player).equity).toBeUndefined();
  });

  it('the marketplace: in open enrollment or 60 days from losing cover, the benchmark each month, ending on leaving the state', () => {
    const sim = pro('market');
    const person = sim.player;
    // A month's income over what the programs allow: the marketplace, in its windows.
    for (const m of ['2025-12', '2026-04', '2026-05', '2026-06', '2026-10', '2026-12']) earningsOf(person).months[m] = 5_000_00;
    expect(mayEnroll(person, at(2026, 6, 1)).ok).toBe(false);
    expect(mayEnroll(person, at(2026, 11, 2)).ok).toBe(true);
    expect(mayEnroll(person, at(2027, 1, 10)).ok).toBe(true);
    healthOf(person).lostAt = at(2026, 5, 1);
    expect(mayEnroll(person, at(2026, 6, 20)).ok).toBe(true);
    expect(mayEnroll(person, at(2026, 7, 5)).ok).toBe(false);
    healthOf(person).lostAt = sim.now;
    expect(sim.execute({ kind: 'health.enroll', payload: {} }).ok).toBe(true);
    const from = healthOf(person).marketplace!.from;
    healthMonth(sim, person, from + MS_HOUR);
    expect(healthOf(person).premiums[zonedParts(from, NY).year]).toEqual([byYear(BENCHMARK.ny, zonedParts(from, NY).year)]);
    expect(coverOn(person, from + MS_HOUR)).toBe('marketplace');
    // Moving home out of the state ends a state's plan.
    person.currentLocationId = 'us-ct-newhaven';
    person.home = { ...person.home!, cityId: 'us-ct-newhaven' };
    healthMonth(sim, person, from + 32 * MS_DAY);
    expect(healthOf(person).marketplace!.until).toBeDefined();
  });

  it('counts months without cover in California, and not in New York', () => {
    const la = pro('uncovered-la', 'us-ca-losangeles');
    healthMonth(la, la.player, at(2027, 3, 1, 1));
    healthMonth(la, la.player, at(2027, 4, 1, 1));
    expect(healthOf(la.player).uncoveredInCalifornia[2027]).toBe(2);
    const ny = pro('uncovered-ny');
    healthMonth(ny, ny.player, at(2027, 3, 1, 1));
    expect(healthOf(ny.player).uncoveredInCalifornia[2027]).toBeUndefined();
  });
});

describe('Connecticut', () => {
  it('pays unemployment on 40 times the benefit, the two best quarters over 26, from its floor to $721, with no waiting week', () => {
    // ($4,000 + $3,908) / 2 / 26 = $152.07: $152, and $6,080 of base-period wages asked.
    expect(monetary('ct', [4_000_00, 3_908_00, 0, 0], 'USD', 2026)).toMatchObject({ ok: true, weekly: 152_00, maxTotal: 152_00 * 26 });
    // Under 40 times the floor, nothing: $1,500 against 40 times $44.
    expect(monetary('ct', [1_000_00, 500_00, 0, 0], 'USD', 2026).ok).toBe(false);
    // The floor, $44 in 2026 and $45 in 2027, and the frozen maximum.
    expect(monetary('ct', [1_000_00, 800_00, 0, 0], 'USD', 2026)).toMatchObject({ ok: true, weekly: 44_00 });
    expect(monetary('ct', [1_000_00, 800_00, 0, 0], 'USD', 2027)).toMatchObject({ ok: true, weekly: 45_00 });
    expect(monetary('ct', [50_000_00, 50_000_00, 0, 0], 'USD', 2027).weekly).toBe(CONNECTICUT_UI.maximum);
    // A week with work: the benefit less two-thirds of the pay, and nothing at one and a half times it.
    const ct = claimOf('ct', 300_00);
    expect(weekBenefit(ct, 5, 0)).toBe(300_00);
    expect(weekBenefit(ct, 5, 150_00)).toBe(200_00);
    expect(weekBenefit(ct, 5, 100_40)).toBe(300_00 - 67_00);
    expect(weekBenefit(ct, 5, 449_00)).toBe(0);
    expect(weekBenefit(ct, 5, 450_00)).toBe(0);
    // Filed from New Haven, the first week is paid.
    const sim = pro('ct-claim', 'us-ct-newhaven');
    for (const q of ['2025-1', '2025-2', '2025-3', '2025-4']) earningsOf(sim.player).quarters[q] = { wages: 8_000_00, sag: 0 };
    sim.must({ kind: 'benefits.claim', payload: {} });
    expect(unemploymentOf(sim.player).claim).toMatchObject({ state: 'ct', waited: true, weekly: 307_00 });
    play(sim, sim.now + 8 * MS_DAY);
    expect(unemploymentOf(sim.player).claim!.paid).toBe(307_00);
  });

  it('covers a low month by HUSKY D, to 175% of last year’s poverty line by Covered Connecticut, and above it by Access Health CT', () => {
    const sim = pro('ct-cover', 'us-ct-newhaven');
    const p = sim.player;
    earningsOf(p).months['2026-05'] = 1_500_00;
    expect(programFor(p, at(2026, 6, 2))).toEqual({ kind: 'medicaid', band: 'low' });
    earningsOf(p).months['2026-05'] = 2_250_00;
    expect(programFor(p, at(2026, 6, 2))).toEqual({ kind: 'essential', band: 'low' });
    earningsOf(p).months['2026-05'] = 2_300_00;
    expect(programFor(p, at(2026, 6, 2))).toBeUndefined();
    earningsOf(p).months['2026-09'] = 5_000_00;
    expect(mayEnroll(p, at(2026, 10, 25)).ok).toBe(true);
    expect(mayEnroll(p, at(2026, 10, 20)).why).toMatch(/23 October to 15 January/);
    expect(benchmarkFor('ct', 2026, 'USD')).toBe(706_00);
    expect(benchmarkFor('ct', 2027, 'USD')).toBe(786_00);
    // Enrolled in Covered Connecticut, care costs nothing and renews every six months from 2027.
    // Last month's income, the month before the save's start.
    earningsOf(p).months['2025-12'] = 2_250_00;
    expect(zonedParts(sim.now, NY)).toMatchObject({ year: 2026, month: 1 });
    sim.must({ kind: 'health.enroll', payload: {} });
    const h = healthOf(p);
    expect(h.program).toMatchObject({ kind: 'essential', state: 'ct' });
    expect(planKey(p, h.program!.from + MS_HOUR)).toBe('covered-ct');
    expect(shareOf(p, 'stay', h.program!.from + MS_HOUR)).toBe(0);
    // HUSKY D renews every six months from January 2027, where New York's wait until March.
    h.program = { ...h.program!, kind: 'medicaid', renewAt: at(2027, 1, 1, 0) };
    earningsOf(p).months['2026-12'] = 1_000_00;
    healthMonth(sim, p, at(2027, 1, 1, 1));
    expect(h.program.renewAt).toBe(at(2027, 7, 1, 0));
    // HUSKY D asks no copay at the pharmacy, where New York's Medicaid asks a dollar.
    h.program = { ...h.program!, kind: 'medicaid' };
    expect(planKey(p, h.program.from + MS_HOUR)).toBe('essential-low');
    // The marketplace plan: the deductible, then $1,500 for the stay; insulin at Connecticut's $25.
    delete h.program;
    h.marketplace = { from: at(2027, 1, 1, 0), state: 'ct' };
    expect(planKey(p, at(2027, 2, 1))).toBe('marketplace-ct');
    expect(shareOf(p, 'stay', at(2027, 2, 1))).toBe(PLANS['marketplace-ct']!.deductible + 1_500_00);
    expect(insulinShareOf(p, at(2027, 2, 2))).toBeLessThanOrEqual(INSULIN.connecticutCap);
  });
});

describe('unemployment', () => {
  it('New York: two quarters, $3,500 in one, one and a half times; the high quarter over 26 or 25, $143 to $869', () => {
    expect(monetary('ny', [10_000_00, 5_000_00, 3_000_00, 2_000_00])).toMatchObject({ ok: true, weekly: 384_00 });
    expect(monetary('ny', [3_500_00, 2_000_00, 1_000_00, 500_00])).toMatchObject({ ok: true, weekly: 140_00 });
    expect(monetary('ny', [40_000_00, 20_000_00, 20_000_00, 10_000_00]).weekly).toBe(NEW_YORK_UI.maximum);
    expect(monetary('ny', [9_000_00, 0, 0, 0]).ok).toBe(false);
    expect(monetary('ny', [3_400_00, 3_000_00, 0, 0]).ok).toBe(false);
    expect(monetary('ny', [10_000_00, 3_000_00, 0, 0]).ok).toBe(false);
    // Two quarters over $4,000: the two highest averaged.
    expect(monetary('ny', [10_000_00, 6_000_00, 0, 0]).weekly).toBe(307_00);
  });

  it('California: $1,300 in a quarter, or $900 and one and a quarter times; $40 to $450; at most half the base period', () => {
    expect(monetary('ca', [5_200_00, 0, 0, 0])).toMatchObject({ ok: true, weekly: 200_00, maxTotal: 2_600_00 });
    expect(monetary('ca', [20_000_00, 20_000_00, 20_000_00, 20_000_00])).toMatchObject({ weekly: 450_00, maxTotal: 450_00 * 26 });
    expect(monetary('ca', [1_000_00, 300_00, 0, 0]).ok).toBe(true);
    expect(monetary('ca', [1_000_00, 0, 0, 0]).ok).toBe(false);
  });

  it('pays a week with work by New York’s hours, or nothing at the maximum; California less its earnings past the disregard', () => {
    const ny = claimOf('ny', 400_00);
    expect([0, 12, 18, 25, 31].map((h) => weekBenefit(ny, h, 100_00))).toEqual([400_00, 300_00, 200_00, 100_00, 0]);
    expect(weekBenefit(ny, 10, 869_00)).toBe(0);
    const ca = claimOf('ca', 400_00);
    expect(weekBenefit(ca, 0, 0)).toBe(400_00);
    expect(weekBenefit(ca, 8, 80_00)).toBe(400_00 - (80_00 - 25_00));
    expect(weekBenefit(ca, 8, 400_00)).toBe(400_00 - (400_00 - 100_00));
    expect(weekBenefit(ca, 8, 2_000_00)).toBe(0);
  });

  it('is claimed where they live, on the base period, with an unpaid waiting week, and paid as income', () => {
    const sim = pro('claim');
    const person = sim.player;
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(false);
    for (const q of ['2025-1', '2025-2', '2025-3', '2025-4']) earningsOf(person).quarters[q] = { wages: 10_000_00, sag: 0 };
    expect(basePeriodFor(person, 'ny', sim.now).quarters).toEqual(['2024-4', '2025-1', '2025-2', '2025-3']);
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(true);
    expect(unemploymentOf(person).claim!.weekly).toBe(384_00);
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(false);
    play(sim, sim.now + 8 * MS_DAY);
    expect(unemploymentOf(person).claim).toMatchObject({ waited: true, paid: 0 });
    play(sim, sim.now + 14 * MS_DAY);
    expect(unemploymentOf(person).claim!.paid).toBe(2 * 384_00);
    expect(yearOf(person, 2026).unemployment).toBe(2 * 384_00);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Unemployment insurance')).every((t) => t.category === 'benefit')).toBe(true);
    // Out of the state, the claim goes on as an interstate claim; abroad, a week pays nothing.
    person.currentLocationId = 'us-ct-newhaven';
    play(sim, sim.now + 7 * MS_DAY);
    expect(unemploymentOf(person).claim!.paid).toBe(3 * 384_00);
    person.currentLocationId = 'ca-on-toronto';
    play(sim, sim.now + 7 * MS_DAY);
    expect(unemploymentOf(person).claim!.paid).toBe(3 * 384_00);
    // The week is certified on the home state's Sunday evening, wherever they are.
    person.currentLocationId = 'us-ca-losangeles';
    play(sim, sim.now + 7 * MS_DAY);
    const week = sim.universe.scheduled.find((i) => i.kind === 'benefits.week' && i.status === 'pending')!;
    expect(zonedParts(week.at, 'America/New_York').hour).toBe(20);
  });

  it('isn’t filed while on a job, or outside New York, California and Connecticut', () => {
    const sim = pro('on-job');
    for (const q of ['2025-1', '2025-2', '2025-3', '2025-4']) earningsOf(sim.player).quarters[q] = { wages: 10_000_00, sag: 0 };
    const b = booking(sim, 'lort-b', 3, sim.now - MS_DAY, 2);
    b.status = 'accepted';
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(false);
    // A refused command puts back a copy of the world, so the booking is looked up again.
    careerOf(sim.player).bookings.find((one) => one.id === b.id)!.status = 'worked';
    // Filed where they live: standing in New Haven with a New York home, it's New York's.
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(true);
    delete unemploymentOf(sim.player).claim;
    sim.player.home!.cityId = 'us-tx-houston';
    sim.player.currentLocationId = 'us-ny-newyork';
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(false);
  });
});

describe('the tax return', () => {
  it('is due 15 April, or the next business day with Emancipation Day observed', () => {
    const day = (y: number) => zonedParts(deadline(y), NY);
    expect([2026, 2027, 2028, 2029, 2030].map((y) => `${day(y).month}/${day(y).day}`)).toEqual(['4/15', '4/18', '4/17', '4/15', '4/15']);
  });

  it('keeps a student’s work-study out of the quarters unemployment reads', () => {
    const sim = pro('ws');
    recordWages(sim.player, at(2026, 6, 1), NY, { gross: 3_000_00, workStudy: true });
    expect(earningsOf(sim.player).quarters).toEqual({});
    expect(yearOf(sim.player, 2026).workStudy).toBe(3_000_00);
  });

  it('works out the year: income tax where they lived, payroll on the acting wages, less what was withheld', () => {
    const sim = pro('figures');
    const person = sim.player;
    recordWages(person, at(2026, 5, 1), NY, { gross: 40_000_00, withheld: 6_000_00, sag: true, employer: 'a' });
    recordWages(person, at(2026, 6, 1), NY, { gross: 3_000_00, workStudy: true });
    const f = figuresFor(person, 2026);
    const all = computeAnnualTax(43_000_00, 'us-ny-newyork', at(2026, 12, 31, 12));
    expect(f.incomeTax).toBe(all.federal + all.regional + all.local);
    expect(f.payroll).toBe(computeAnnualTax(40_000_00, 'us-ny-newyork', at(2026, 12, 31, 12)).payroll);
    expect(f.balance).toBe(f.incomeTax + f.payroll - 6_000_00);
  });

  it('leaves unemployment out of California’s tax, and counts it in New York’s', () => {
    const la = pro('ui-ca', 'us-ca-losangeles');
    recordWages(la.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 30_000_00 });
    recordBenefit(la.player, at(2026, 8, 1), 'America/Los_Angeles', 5_000_00);
    const withUi = figuresFor(la.player, 2026);
    const t = computeAnnualTax(35_000_00, 'us-ca-losangeles', at(2026, 12, 31, 12));
    const state = computeAnnualTax(30_000_00, 'us-ca-losangeles', at(2026, 12, 31, 12)).regional;
    expect(withUi.incomeTax).toBe(t.federal + state + t.local);
  });

  it('takes a qualifying performing artist’s commission and dues off income', () => {
    const sim = pro('qpa');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 8_000_00, commission: 800_00, dues: 200_00, employer: 'a' });
    recordWages(sim.player, at(2026, 6, 1), NY, { gross: 6_000_00, commission: 600_00, dues: 150_00, employer: 'b' });
    expect(figuresFor(sim.player, 2026).deduction).toBe(1_750_00);
    // One employer, however much it cost: none.
    const one = pro('qpa-one');
    recordWages(one.player, at(2026, 5, 1), NY, { gross: 14_000_00, commission: 1_400_00, dues: 400_00, employer: 'a' });
    expect(figuresFor(one.player, 2026).deduction).toBe(0);
    // Two, with the costs at a tenth or under: none.
    const cheap = pro('qpa-cheap');
    recordWages(cheap.player, at(2026, 5, 1), NY, { gross: 7_000_00, commission: 700_00, employer: 'a' });
    recordWages(cheap.player, at(2026, 6, 1), NY, { gross: 7_000_00, commission: 700_00, employer: 'b' });
    expect(figuresFor(cheap.player, 2026).deduction).toBe(0);
  });

  it('gives back the premium tax credit, and adds California’s penalty for months without cover', () => {
    const sim = pro('credit');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    healthOf(sim.player).premiums[2026] = [940_00, 940_00];
    const pct = applicablePercent(2026, 40_000_00 / 15_650_00)!;
    expect(figuresFor(sim.player, 2026).credit).toBe(2 * Math.round(940_00 - (pct * 40_000_00) / 12));
    expect(applicablePercent(2026, 4.2)).toBeUndefined();
    expect(applicablePercent(2026, 3.5)).toBe(0.0996);
    const la = pro('mandate', 'us-ca-losangeles');
    recordWages(la.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 60_000_00 });
    healthOf(la.player).uncoveredInCalifornia[2026] = 3;
    expect(figuresFor(la.player, 2026).mandate).toBe(3 * Math.round(Math.max(CALIFORNIA_MANDATE.flat, 0.025 * 60_000_00) / 12));
    // A high income's 2.5% is capped at the average bronze plan.
    const rich = pro('mandate-rich', 'us-ca-losangeles');
    recordWages(rich.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 300_000_00 });
    healthOf(rich.player).uncoveredInCalifornia[2026] = 2;
    expect(figuresFor(rich.player, 2026).mandate).toBe(2 * CALIFORNIA_MANDATE.bronzeMonth);
  });

  it('adds the late penalties to a balance filed late, and at least $525 past 60 days', () => {
    const due = deadline(2026);
    expect(latePenalty(10_000_00, due, due - 1)).toBe(0);
    expect(latePenalty(10_000_00, due, due + 10 * MS_DAY)).toBe(Math.round(10_000_00 * 0.05));
    expect(latePenalty(1_000_00, due, due + 70 * MS_DAY)).toBe(Math.round(1_000_00 * 0.005 * 3) + RETURN.lateMinimum);
    expect(latePenalty(100_00, due, due + 70 * MS_DAY)).toBe(Math.round(100_00 * 0.005 * 3) + 100_00);
    expect(latePenalty(-500_00, due, due + 400 * MS_DAY)).toBe(0);
  });

  it('is ready in February, filed for a refund 21 days on, or a balance from the bank, or owed', () => {
    const sim = pro('file');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00, withheld: 20_000_00 });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.balance).toBeLessThan(0);
    expect(Object.values(sim.universe.decisions).some((d) => d.refType === 'return' && d.actions[0]?.commandKind === 'tax.file')).toBe(true);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    expect(r.refundAt! - sim.now).toBe(RETURN.refundDays * MS_DAY);
    play(sim, r.refundAt! + MS_HOUR);
    expect(sim.universe.transactions.find((t) => t.memo === 'Tax refund, 2026')!.postings[0]!.amount).toBe(-r.figures.balance);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(false);

    const owe = pro('owe');
    recordWages(owe.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(owe, at(2027, 2, 1, 12));
    for (const a of Object.values(owe.universe.accounts)) if (a.ownerId === owe.player.id && a.balance > 0) a.balance = 0;
    expect(owe.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    const o = returnsOf(owe.player)['2026']!;
    expect(o.owed).toBe(o.figures.balance);
    expect(owe.execute({ kind: 'tax.pay', payload: { year: 2026 } }).ok).toBe(false);
  }, 60_000);
});
