/**
 * Canada's public pensions (`systems/capensions.ts`, from 2026-09-30): the
 * CPP paid in from each check by a self-employed Canadian, and paid out from
 * 60 to 70; Old Age Security by the years in Canada; the GIS and Ontario's
 * GAINS by the last year's income.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { yearOf } from '@/engine/systems/earnings';
import { BC_SENIORS_SUPPLEMENT } from '@/engine/content/cabenefits';
import { beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { CPP, GAINS, GIS, OAS, oasRecovery, canadaPensionsOf, canadianYears, cppMonthly, cppOnCheck, oasMonthly, oasRefusal, supplements } from '@/engine/systems/capensions';

const YEAR = 365.2425 * MS_DAY;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** Years of income while living in Toronto, from 18. */
function lived(sim: Simulation, years: number, amount = 30_000_00): void {
  const born = new Date(sim.player.birthInstant).getUTCFullYear();
  for (let y = born + 18; y < born + 18 + years; y += 1) { const e = yearOf(sim.player, y); e.acting = amount; e.byResidence = { 'ca-on-toronto': amount }; }
}

describe('the CPP, paid in', () => {
  it('takes 11.9% between $3,500 and the YMPE and 8% to the YAMPE from a Canadian’s checks, and nothing from a New Yorker’s', () => {
    const sim = life('ca-on-toronto', 'cpp-in');
    expect(cppOnCheck(sim.player, 2027, 10_000_00, 'CAD')).toBe(Math.round(0.119 * 6_500 * 100));
    const second = cppOnCheck(sim.player, 2027, 70_000_00, 'CAD');
    expect(second).toBe(Math.round((0.119 * (74_600 - 3_500) + 0.08 * (80_000 - 74_600) - 0.119 * 6_500) * 100));
    // Past the YAMPE, nothing more; a new year starts again.
    expect(cppOnCheck(sim.player, 2027, 20_000_00, 'CAD')).toBe(Math.round(0.08 * (85_000 - 80_000) * 100));
    expect(cppOnCheck(sim.player, 2027, 5_000_00, 'CAD')).toBe(0);
    expect(canadaPensionsOf(sim.player).years[2027]).toBe(105_000);
    const ny = life('us-ny-newyork', 'cpp-ny');
    expect(cppOnCheck(ny.player, 2027, 10_000_00, 'USD')).toBe(0);
  });

  it('comes out of a Toronto check, booked to the CPP', () => {
    const sim = life('ca-on-toronto', 'cpp-check');
    sim.player.craft = evenCraft(80);
    beginCareer(sim, sim.player);
    const p = zonedParts(sim.now + 5 * MS_DAY, 'America/Toronto');
    const starts = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 8 }, 'America/Toronto');
    const b: Booking = { id: 'job', roleId: 'ca-theater', cityId: 'ca-on-toronto', starts, units: 3, rehearsalWeeks: 1, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'job' } }).ok).toBe(true);
    // Past the $3,500 exemption: a rehearsal week and three of performances.
    const until = b.starts + 35 * MS_DAY;
    while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * 3_600_000));
    const cpp = sim.universe.transactions.flatMap((t) => t.postings).filter((p) => p.accountId === sim.nominalAccount('expense', 'CPP Contributions').id);
    expect(cpp.length).toBeGreaterThan(0);
    expect(cpp.reduce((a, p) => a + p.amount, 0)).toBeGreaterThan(0);
  });
});

describe('the CPP, paid out', () => {
  it('replaces a quarter to a third of the average, less 0.6% a month early and more 0.7% late, to the maximum', () => {
    const sim = life('ca-on-toronto', 'cpp-out');
    expect(cppMonthly(sim.player, 65)).toBe(0);
    for (let y = 1990; y <= 2080; y += 1) canadaPensionsOf(sim.player).years[y] = 30_000;
    const at65 = cppMonthly(sim.player, 65);
    expect(at65).toBeGreaterThan((0.25 * 30_000) / 12);
    expect(at65).toBeLessThanOrEqual((CPP.enhanced * 30_000) / 12 + 1e-9);
    expect(cppMonthly(sim.player, 60) / cppMonthly(sim.player, 65)).toBeCloseTo(0.64, 2);
    expect(cppMonthly(sim.player, 70) / cppMonthly(sim.player, 65)).toBeCloseTo(1.42, 2);
    // The enhancement phased in from 2019: a year in 2021 replaces less than one in 2030.
    const one = (year: number) => { const x = life('ca-on-toronto', `cpp-phase-${year}`); canadaPensionsOf(x.player).years[year] = 30_000; return cppMonthly(x.player, 65); };
    expect(one(2021) / one(2030)).toBeCloseTo((0.25 + (1 / 3 - 0.25) * (3 / 7)) / (1 / 3), 6);
    // The dropout leaves out the seven lowest of 47 years: forty at $30,000 average $30,000.
    const d = life('ca-on-toronto', 'cpp-dropout');
    const born = new Date(d.player.birthInstant).getUTCFullYear();
    for (let y = born + 18 + 7; y <= born + 64; y += 1) canadaPensionsOf(d.player).years[y] = 30_000;
    expect(cppMonthly(d.player, 65)).toBeCloseTo((30_000 / 3) / 12, 6);
    for (let y = 1990; y <= 2080; y += 1) canadaPensionsOf(sim.player).years[y] = 200_000;
    expect(cppMonthly(sim.player, 70)).toBe(CPP.most);
  });
});

describe('Old Age Security, the GIS and GAINS', () => {
  it('pays OAS in fortieths of forty years in Canada after 18, ten at least, and more from 75', () => {
    const sim = life('ca-on-toronto', 'oas');
    lived(sim, 9);
    expect(oasMonthly(sim.player, 66)).toBe(0);
    lived(sim, 20);
    expect(canadianYears(sim.player)).toBe(20);
    expect(oasMonthly(sim.player, 66)).toBeCloseTo(OAS.monthly / 2, 6);
    lived(sim, 45);
    expect(oasMonthly(sim.player, 66)).toBeCloseTo(OAS.monthly, 6);
    expect(oasMonthly(sim.player, 76)).toBeCloseTo(OAS.at75, 6);
    expect(oasRefusal(sim, sim.player)).toMatch(/from 65/);
    // Living abroad, only after twenty years.
    const away = life('us-ny-newyork', 'oas-away');
    lived(away, 15);
    expect(oasMonthly(away.player, 66)).toBe(0);
    lived(away, 25);
    expect(oasMonthly(away.player, 66)).toBeCloseTo((OAS.monthly * 25) / 40, 6);
  });

  it('gives the GIS less half of income past the earnings exemption, and GAINS in Ontario to $4,416', () => {
    const sim = life('ca-on-toronto', 'gis');
    const noIncome = supplements(sim, sim.player, 0);
    expect(noIncome.gis).toBeCloseTo(GIS.monthly, 6);
    expect(noIncome.gains).toBeCloseTo(GAINS.monthly, 6);
    // $15,000 earned last year: $5,000 exempt, half the next $10,000, so $5,000 counts.
    yearOf(sim.player, new Date(sim.now).getUTCFullYear() - 1).acting = inSave(sim, 15_000_00, 'CAD');
    const earned = supplements(sim, sim.player, 0);
    // And from later on 2026-09-30 the top-up's 25 cents a dollar over $2,048.
    expect(earned.gis).toBeCloseTo(GIS.monthly - (0.5 * 5_000 + 0.25 * (5_000 - 2_048)) / 12, 1);
    expect(earned.gains).toBe(0);
    // A CPP pension counts whole.
    expect(supplements(sim, sim.player, 100).gis).toBeCloseTo(GIS.monthly - (0.5 * (5_000 + 1_200) + 0.25 * (6_200 - 2_048)) / 12, 1);
    const van = life('ca-bc-vancouver', 'gis-bc');
    // No GAINS in British Columbia, but its Senior's Supplement, $99.30 at the top of its table, less further down it.
    expect(supplements(van, van.player, 0).gains).toBe(99.3);
    yearOf(van.player, new Date(van.now).getUTCFullYear() - 1).acting = inSave(van, 7_000_00, 'CAD');
    const row = BC_SENIORS_SUPPLEMENT.find(([from, to]) => 1_000 >= from && 1_000 <= to)![2];
    expect(supplements(van, van.player, 0).gains).toBe(row);
    expect(row).toBeLessThan(99.3);
  });

  it('is claimed at 65 and paid monthly', () => {
    const sim = life('ca-on-toronto', 'oas-claim');
    (sim.player as { birthInstant: number }).birthInstant = sim.now - 66 * YEAR;
    lived(sim, 45);
    for (let y = 1950; y <= 2030; y += 1) canadaPensionsOf(sim.player).years[y] = 30_000;
    expect(sim.execute({ kind: 'pension.ca_oas', payload: {} }).ok).toBe(true);
    sim.advanceBy(31 * MS_DAY);
    // With no income last year: all of OAS, a year deferred at 66 (7.2% more), the GIS and GAINS.
    const month = sim.universe.transactions.find((t) => t.memo === 'Canada’s pensions, the month')!;
    const paid = month.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0);
    expect(Math.abs(paid - inSave(sim, Math.round((OAS.monthly * 1.072 + GIS.monthly + GAINS.monthly) * 100), 'CAD'))).toBeLessThanOrEqual(1);
    expect(sim.execute({ kind: 'pension.cpp', payload: {} }).ok).toBe(true);
  });

  it('pays 0.6% more a month for OAS deferred past 65, and takes back 15% of last year’s income over $95,323', () => {
    const sim = life('ca-on-toronto', 'oas-defer');
    (sim.player as { birthInstant: number }).birthInstant = sim.now - 67 * YEAR;
    lived(sim, 45);
    expect(sim.execute({ kind: 'pension.ca_oas', payload: {} }).ok).toBe(true);
    expect(canadaPensionsOf(sim.player).oasFactor).toBeCloseTo(1 + 0.006 * 24, 6);
    expect(oasRecovery(sim, sim.player, 0)).toBe(0);
    yearOf(sim.player, new Date(sim.now).getUTCFullYear() - 1).acting = inSave(sim, 170_000_00, 'CAD');
    const oasYear = OAS.monthly * 1.144 * 12;
    expect(oasRecovery(sim, sim.player, 0)).toBeCloseTo((0.15 * (170_000 + oasYear - 95_323)) / 12, 0);
    // High earners: the recovery takes it all, and the month pays nothing of OAS.
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Canada’s pensions, the month')).toBe(false);
  });
});
