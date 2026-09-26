/**
 * Work outside the thirteen (`content/work-world.ts`): each country's own
 * minimum wage, payday, simplified payslip and statutory leave, and its
 * employers by name.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES, addCountryCities } from '@/engine/content/geography';
import { minimumWageAt } from '@/engine/content/wages';
import { payCycleFor } from '@/engine/content/jobs';
import { laborAt } from '@/engine/content/labor';
import { WORLD_WORK } from '@/engine/content/work-world';
import { EMPLOYERS } from '@/engine/content/employers';
import { MS_DAY } from '@/engine/core/time';
import { payrollYear } from '@/engine/content/payroll';
import { employerById, rateAt } from '@/engine/systems/work';

const town = (country: string, name: string) => {
  addCountryCities(country, readFileSync(`public/geo/${country}.tsv`, 'utf8'));
  return CITIES.all().find((c) => c.countryId === country && c.name === name)!;
};

describe('the rest of the world', () => {
  it('pays Poland’s own minimum, with its source, where it was the cost-of-living estimate', () => {
    const warsaw = town('pl', 'Warsaw');
    const floor = minimumWageAt(warsaw.id, Date.UTC(2026, 8, 25), 'PLN');
    expect(floor).toMatchObject({ hourly: 31_40, currency: 'PLN', kind: 'statutory' });
    expect(floor.source).toBe(WORLD_WORK.PL!.minimum!.source);
  });

  it('keeps the estimate where a minimum is only nominal', () => {
    const tbilisi = town('ge', 'Tbilisi');
    expect(WORLD_WORK.GE?.minimum).toBeUndefined();
    expect(minimumWageAt(tbilisi.id, Date.UTC(2026, 8, 25), 'GEL').kind).toBe('estimate');
  });

  it('pays weekly where the country does, and builds its statutory leave', () => {
    expect(payCycleFor('JM')).toEqual({ kind: 'weekly', weekday: 5 });
    const law = laborAt(['PL'])!;
    const weeks = WORLD_WORK.PL!.leaveDays!.days / 5;
    expect(law.leave!.accrual).toBeCloseTo(weeks / (52 - weeks), 9);
    expect(law.sick).toBeUndefined();
  });

  it('takes Brazil’s INSS as the scale it is, not every band on the whole wage', () => {
    const at = Date.UTC(2026, 8, 25);
    const inss = (g: number) => payrollYear('BR', g * 100, { path: ['BR'], age: 30, at }).lines.find((l) => l.name === 'INSS')!.amount / 100;
    // At the minimum wage, all of it in the first band at 7.5%.
    expect(inss(1_621 * 12)).toBeCloseTo(1_621 * 12 * 0.075, 1);
    // At R$3,000 a month: 7.5% to 1,621.01, 9% to 2,902.85, and 12% on the rest.
    expect(inss(3_000 * 12)).toBeCloseTo((1_621.01 * 0.075 + (2_902.85 - 1_621.01) * 0.09 + (3_000 - 2_902.85) * 0.12) * 12, 0);
  });

  it('works for a real employer there, paid and taxed by the country’s own figures', () => {
    const warsaw = town('pl', 'Warsaw');
    const sim = quickSave({ startLocationId: warsaw.id, homeRegionId: warsaw.id, livesWhereBorn: true, dayJob: true, wealth: 'modest', beforeActing: 'retail' }, 'warsaw');
    const job = sim.player.job!;
    expect(EMPLOYERS.PL!.retail!.employers.map((e) => e.id)).toContain(job.employerId);
    expect(employerById(job.cityId, job.employerId)?.name).toBeDefined();
    sim.advanceBy(40 * MS_DAY);
    const slip = job.lastSlip!;
    expect(slip.estimate).toBeUndefined();
    expect(slip.lines.some((l) => l.name === 'Income Tax')).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('a published rate where the law sets no floor', () => {
  it('pays Helsinki’s S Group its agreement rate, not SLATE’s cost-of-living estimate', () => {
    const helsinki = town('fi', 'Helsinki');
    const at = Date.UTC(2026, 8, 26);
    expect(minimumWageAt(helsinki.id, at, 'EUR').kind).toBe('estimate');
    const rate = rateAt(helsinki.id, 'retail', 'EUR', at, 'fi-retail-s-group-prisma-s-market-alepa', 30, 12);
    expect(rate.basis).toBe('employer');
    expect(rate.hourly).toBe(EMPLOYERS.FI!.retail!.employers.find((e) => e.id === 'fi-retail-s-group-prisma-s-market-alepa')!.hourlyFrom);
  });
});