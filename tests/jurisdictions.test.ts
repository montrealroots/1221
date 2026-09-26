/**
 * The labor-law pass of 2026-09-26 (`content/jurisdictions.ts`): the Canadian
 * provinces and the US states the first research didn't write out, each
 * paid, taxed, protected and insured by its own law.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '../src/engine';
import { CITIES, addCountryCities } from '../src/engine/content/geography';
import { MS_DAY } from '../src/engine/core/time';
import { hourlyWage, layOff, shareOfYearDue } from '../src/engine/systems/work';
import { jobFor, patternHours, patternOf } from '../src/engine/content/jobs';
import type { Extra } from '../src/engine/content/labor';
import { addCountryHolidays, hasHolidayFile } from '../src/engine/content/holidays';
import { claimFor } from '../src/engine/systems/unemployment';
import { payrollYear } from '../src/engine/content/payroll';
import { laborAt } from '../src/engine/content/labor';
import { BENEFITS, benefitAt, noBenefitAt, type WorkRecord } from '../src/engine/content/unemployment';
import { SETTLEMENTS, settleYear, usEitc, type YearFigures } from '../src/engine/content/taxreturn';
import { PROVINCES, STATES, WORLD_LAW } from '../src/engine/content/jurisdictions';

const at = Date.UTC(2026, 5, 1);
const lines = (iso: string, path: string[], gross: number) => payrollYear(iso, gross * 100, { path, at, age: 30 }).lines;
const line = (iso: string, path: string[], gross: number, name: string) => (lines(iso, path, gross).find((l) => l.name === name)?.amount ?? 0) / 100;

/** A base period for a claim on 15 April 2027: Q1 to Q4 2026, the wages of each, latest first, the calendar days of pay each covers (65, unless it's 13 weeks' 91). */
const claimAt = Date.UTC(2027, 3, 15);
const record = (latestFirst: number[], days = 65): WorkRecord =>
  latestFirst.map((gross, i) => ({ at: Date.UTC(2026, 10 - i * 3, 15), days, hours: days * 8, gross }));
const ctx = { age: 30, at: claimAt, why: 'laidOff' as const };

describe('the provinces', () => {
  it('taxes Alberta on its own brackets, after the basic amount and the contributions credited at the lowest rate', () => {
    const p = PROVINCES['CA-01']!;
    const g = 40_000;
    const cpp = (Math.min(g, 74_600) - 3_500) * 0.0595;
    const ei = g * 0.0163;
    const lowest = p.tax.brackets[0]![1];
    let expected = 0;
    for (let i = 0; i < p.tax.brackets.length; i += 1) {
      const [from, rate] = p.tax.brackets[i]!;
      const to = p.tax.brackets[i + 1]?.[0] ?? Infinity;
      if (g > from) expected += (Math.min(g, to) - from) * rate;
    }
    expected = Math.max(0, expected - (p.tax.basicPersonalAmount + cpp + ei) * lowest);
    expect(line('CA', ['CA', 'CA-01'], g, 'Alberta Income Tax')).toBeCloseTo(expected, 6);
  });

  it('charges the Northwest Territories’ payroll tax, and nowhere else’s', () => {
    expect(line('CA', ['CA', 'CA-13'], 40_000, 'Northwest Territories Payroll Tax')).toBeCloseTo(40_000 * PROVINCES['CA-13']!.tax.payrollTax!, 6);
    expect(lines('CA', ['CA', 'CA-01'], 40_000).some((l) => /Payroll Tax/.test(l.name))).toBe(false);
  });

  it('pays EI in every province the pass gave a rate', () => {
    for (const [code, p] of Object.entries(PROVINCES)) if (p.eiRate !== undefined) expect(BENEFITS[code]?.name).toBe('Employment Insurance');
  });
});

describe('the states: tax', () => {
  it('taxes Colorado at 4.4% after the standard deduction, and no longer by the approximation', () => {
    expect(line('US', ['US', 'US-CO'], 30_000, 'Colorado Income Tax')).toBeCloseTo((30_000 - 16_100) * 0.044, 6);
    expect(lines('US', ['US', 'US-CO'], 30_000).some((l) => /Approximation/.test(l.name))).toBe(false);
  });

  it('takes no state income tax in Tennessee', () => {
    expect(lines('US', ['US', 'US-TN'], 30_000).filter((l) => l.kind === 'tax').map((l) => l.name)).toEqual(['Federal Income Tax']);
  });

  it('takes Utah’s personal credit off its tax, less 1.3 cents a dollar over $18,213', () => {
    const st = STATES['US-UT']!;
    const credit = st.tax!.personalCredit - 0.013 * (30_000 - 18_213);
    expect(line('US', ['US', 'US-UT'], 30_000, 'Utah Income Tax')).toBeCloseTo(30_000 * st.tax!.brackets[0]![1] - credit, 2);
  });

  it('takes Massachusetts’ paid-leave contribution from the worker', () => {
    const c = STATES['US-MA']!.contributions![0]!;
    expect(line('US', ['US', 'US-MA'], 30_000, c.name)).toBeCloseTo(30_000 * c.rate!, 6);
  });

  it('caps Hawaii’s disability insurance at its weekly most, and charges Oregon’s by the hour', () => {
    const hi = STATES['US-HI']!.contributions!.find((c) => c.weeklyMax !== undefined)!;
    expect(line('US', ['US', 'US-HI'], 200_000, hi.name)).toBeCloseTo(hi.weeklyMax! * 52, 6);
    const or = STATES['US-OR']!.contributions!.find((c) => c.perHour !== undefined)!;
    expect(payrollYear('US', 3_000_000, { path: ['US', 'US-OR'], at, age: 30, weeklyHours: 30 }).lines.find((l) => l.name === or.name)!.amount / 100).toBeCloseTo(or.perHour! * 30 * 52, 6);
  });

  it('forgives Pennsylvania’s tax on a low income, ten points less for each $250 over $6,500', () => {
    const full = 8_000 * STATES['US-PA']!.tax!.brackets[0]![1];
    expect(line('US', ['US', 'US-PA'], 8_000, 'Pennsylvania Income Tax')).toBeCloseTo(full * 0.6, 6);
    expect(line('US', ['US', 'US-PA'], 6_000, 'Pennsylvania Income Tax')).toBe(0);
  });

  it('credits Connecticut’s personal credit as a share of the tax, and shrinks its exemption over $30,000', () => {
    // $16,000: the $15,000 exemption leaves $1,000 at 2%, and 75% of that is credited.
    expect(line('US', ['US', 'US-CT'], 16_000, 'Connecticut Income Tax')).toBeCloseTo(1_000 * 0.02 * 0.25, 6);
    // $35,000: the exemption is $10,000, leaving $25,000, and the credit 10%.
    expect(line('US', ['US', 'US-CT'], 35_000, 'Connecticut Income Tax')).toBeCloseTo((10_000 * 0.02 + 15_000 * 0.045) * 0.9, 6);
  });

  it('taxes South Carolina by its 2026 law: 1.99% after its own $15,000 deduction, phased out over $40,000', () => {
    expect(line('US', ['US', 'US-SC'], 30_000, 'South Carolina Income Tax')).toBeCloseTo(15_000 * 0.0199, 6);
    const deduction = 15_000 - Math.ceil((50_000 - 40_000) / 1_000) * 272.73;
    expect(line('US', ['US', 'US-SC'], 50_000, 'South Carolina Income Tax')).toBeCloseTo(30_000 * 0.0199 + (50_000 - deduction - 30_000) * 0.0521, 2);
  });

  it('takes a Pennsylvania town’s earned income tax and services tax, and Ohio’s city and school taxes', () => {
    const pittsburgh = lines('US', ['US', 'US-PA'], 30_000).length;
    const withTown = payrollYear('US', 3_000_000, { path: ['US', 'US-PA'], cityId: 'us-pa-pittsburgh', at, age: 30 }).lines;
    expect(withTown.length).toBeGreaterThan(pittsburgh);
    expect(withTown.find((l) => /Earned Income Tax/.test(l.name))!.amount / 100).toBeCloseTo(30_000 * 0.03, 6);
    expect(withTown.find((l) => l.name === 'Local Services Tax')!.amount / 100).toBe(52);
    const columbus = payrollYear('US', 3_000_000, { path: ['US', 'US-OH'], cityId: 'us-oh-columbus', at, age: 30 }).lines;
    expect(columbus.find((l) => l.name === 'Columbus Income Tax')!.amount / 100).toBeCloseTo(30_000 * 0.025, 6);
  });

  it('refunds Louisiana’s credit in full and holds South Carolina’s to its own tax', () => {
    const y = (path: string[], wages: number): YearFigures => ({ wages, benefits: [], age: 30, path, at, benefitMonths: 0, rent: 0, savings: 0 });
    const federal = usEitc(y(['US', 'US-LA'], 9_000), 0);
    expect(federal).toBeGreaterThan(0);
    const la = settleYear(SETTLEMENTS['US-LA']!, y(['US', 'US-LA'], 9_000), 0).credits.find((c) => c.name === 'Louisiana Earned Income Tax Credit');
    expect(la?.amount).toBeCloseTo(federal * STATES['US-LA']!.tax!.eitc!.share, 6);
    const sc = SETTLEMENTS['US-SC']!.credits!(y(['US', 'US-SC'], 9_000), { 'South Carolina Income Tax': 5 }).find((c) => c.name === 'South Carolina Earned Income Tax Credit');
    expect(sc).toEqual({ name: 'South Carolina Earned Income Tax Credit', amount: 5, refundable: false });
  });

  it('taxes unemployment benefit where the state does, and not in Alabama', () => {
    expect(SETTLEMENTS['US-CO']!.benefitLines!.test('Colorado Income Tax')).toBe(true);
    expect(SETTLEMENTS['US-AL']!.benefitLines!.test('Alabama Income Tax')).toBe(false);
  });
});

describe('the towns’ own taxes', () => {
  const town = (state: string, cityId: string, gross: number, extra: { settling?: boolean; weeklyHours?: number } = {}) =>
    payrollYear('US', gross * 100, { path: ['US', state], cityId, at, age: 30, ...extra }).lines;
  const amount = (list: { name: string; amount: number }[], name: string | RegExp) => (list.find((l) => (typeof name === 'string' ? l.name === name : name.test(l.name)))?.amount ?? 0) / 100;

  it('credits a Kentucky city’s tax against its county’s where the county has 30,000 people', () => {
    // Bowling Green's 2% is more than Warren County's, so the county takes nothing.
    const bg = town('US-KY', 'us-ky-bowlinggreen', 30_000);
    expect(amount(bg, 'Bowling Green Occupational License Tax')).toBeCloseTo(600, 6);
    expect(bg.some((l) => /Warren County/.test(l.name))).toBe(false);
  });

  it('tells Baltimore City from Baltimore County', () => {
    expect(town('US-MD', 'us-md-baltimore', 30_000).map((l) => l.name).filter((n) => /Local Income Tax/.test(n))).toEqual(['Baltimore City Local Income Tax']);
    expect(town('US-MD', 'us-md-towson', 30_000).map((l) => l.name).filter((n) => /Local Income Tax/.test(n))).toEqual(['Baltimore County Local Income Tax']);
  });

  it('charges Denver’s $5.75 a month, and nothing under $500 a month', () => {
    expect(amount(town('US-CO', 'us-co-denver', 30_000), /Denver/)).toBeCloseTo(5.75 * 12, 6);
    expect(amount(town('US-CO', 'us-co-denver', 5_000), /Denver/)).toBe(0);
  });

  it('takes Yonkers’s surcharge as a share of New York’s tax', () => {
    const y = town('US-NY', 'us-ny-yonkers', 30_000);
    expect(amount(y, 'Yonkers Income Tax Surcharge')).toBeCloseTo(amount(y, 'New York State Income Tax') * 0.1675, 2);
  });

  it('exempts a Pennsylvania Local Services Tax under its threshold', () => {
    expect(town('US-PA', 'us-pa-pittsburgh', 10_000).some((l) => l.name === 'Local Services Tax')).toBe(false);
    expect(amount(town('US-PA', 'us-pa-pittsburgh', 20_000), 'Local Services Tax')).toBe(52);
  });

  it('loses Oregon’s personal credit over $100,000', () => {
    const t = STATES['US-OR']!.tax!;
    const at = (g: number) => amount(town('US-OR', 'us-or-salem', g), 'Oregon Income Tax');
    const without = (g: number) => { let x = 0; const b = t.brackets; for (let i = 0; i < b.length; i += 1) { const [from, r] = b[i]!; const to = b[i + 1]?.[0] ?? Infinity; const tx = g - t.standardDeduction; if (tx > from) x += (Math.min(tx, to) - from) * r; } return x; };
    expect(at(99_000)).toBeCloseTo(without(99_000) - t.personalCredit, 2);
    expect(at(101_000)).toBeCloseTo(without(101_000), 2);
  });

  it('takes Iowa’s school surtax on the return, not from the pay', () => {
    expect(town('US-IA', 'us-ia-iowacity', 30_000).some((l) => l.name === 'School District Surtax')).toBe(false);
    const settled = town('US-IA', 'us-ia-iowacity', 30_000, { settling: true });
    expect(amount(settled, 'School District Surtax')).toBeCloseTo(amount(settled, 'Iowa Income Tax') * 0.04, 2);
  });

  it('charges Michigan’s city tax after its personal exemption', () => {
    expect(amount(town('US-MI', 'us-mi-detroit', 30_000), 'Detroit Income Tax')).toBeCloseTo((30_000 - 600) * 0.024, 2);
  });

  it('charges Portland Metro’s tax only on income over its threshold', () => {
    expect(town('US-OR', 'us-or-portland', 30_000).some((l) => /Supportive Housing/.test(l.name))).toBe(false);
    expect(amount(town('US-OR', 'us-or-portland', 200_000), /Supportive Housing/)).toBeGreaterThan(0);
  });
});

describe('the states: law', () => {
  it('pays overtime after 12 hours a day in Colorado', () => {
    expect(laborAt(['US', 'US-CO'])?.overtime).toMatchObject({ day: 12, week: 40 });
  });

  it('keeps the federal 40-hour week where a state’s own is longer (Minnesota’s 48)', () => {
    expect(laborAt(['US', 'US-MN'])?.overtime?.week).toBe(40);
  });

  it('gives New Mexico’s sick leave', () => {
    expect(laborAt(['US', 'US-NM'])?.sick?.maxHoursAYear).toBe(64);
  });
});

describe('the states: unemployment', () => {
  it('pays the two highest quarters times the factor, within the bounds', () => {
    const ui = STATES['US-CO']!.ui!;
    const r = record([6_000, 5_000, 4_000, 1_000]);
    expect(BENEFITS['US-CO']!.basis(r, ctx)).toBe(Math.floor((6_000 + 5_000) * ui.factor));
  });

  it('pays on all four quarters in Arkansas', () => {
    const ui = STATES['US-AR']!.ui!;
    expect(ui.top).toBe(4);
    expect(BENEFITS['US-AR']!.basis(record([9_000, 9_000, 9_000, 9_000]), ctx)).toBe(Math.floor(Math.max(ui.min, 36_000 * ui.factor)));
  });

  it('adds half the third quarter in North Dakota', () => {
    const ui = STATES['US-ND']!.ui!;
    expect(BENEFITS['US-ND']!.basis(record([6_000, 8_000, 4_000, 1_000]), ctx)).toBe(Math.floor((8_000 + 6_000 + 2_000) * ui.factor));
  });

  it('pays Ohio half the average week worked', () => {
    expect(BENEFITS['US-OH']!.basis(record([6_500, 6_500, 6_500, 6_500], 91), ctx)).toBe(Math.floor(Math.max(STATES['US-OH']!.ui!.min, (26_000 / 52) * 0.5)));
  });

  it('pays Montana the better of the two quarters and 1% of the base period', () => {
    const ui = STATES['US-MT']!.ui!;
    const r = record([12_000, 12_000, 12_000, 12_000]);
    expect(BENEFITS['US-MT']!.basis(r, ctx)).toBe(Math.floor(Math.max(24_000 * ui.factor, 48_000 * 0.01, ui.min)));
  });

  it('refuses Indiana without $2,500 in the base period’s last two quarters, and takes it with', () => {
    expect(BENEFITS['US-IN']!.qualifies(record([1_000, 1_000, 6_000, 6_000]), ctx)).toMatch(/last two quarters/);
    expect(BENEFITS['US-IN']!.qualifies(record([1_500, 1_500, 3_000, 3_000]), ctx)).toBeUndefined();
  });

  it('takes Rhode Island’s alternative base period where the best quarter falls short', () => {
    // One big quarter: short of 1.5 times it, but over the alternative's $19,200.
    expect(BENEFITS['US-RI']!.qualifies(record([12_000, 100, 100, 0]), ctx)).toMatch(/best quarter/);
    expect(BENEFITS['US-RI']!.qualifies(record([19_000, 100, 100, 0]), ctx)).toBeUndefined();
    const ri = STATES['US-RI']!.ui!.qualify;
    expect(ri.alternativeBaseMin).toBe(19_200);
  });

  it('weeks are capped at a share of the base period over the weekly amount', () => {
    const r = record([6_000, 5_000, 4_000, 1_000]);
    const basis = BENEFITS['US-CO']!.basis(r, ctx);
    expect(BENEFITS['US-CO']!.weeks!(r, ctx, basis)).toBeCloseTo(Math.min(26, (16_000 * STATES['US-CO']!.ui!.share!) / basis), 6);
  });
});

describe('the world', () => {
  const monthly = (gross: number, months = 12): WorkRecord =>
    Array.from({ length: months }, (_, i) => ({ at: claimAt - (i + 0.5) * 30.4375 * 86_400_000, days: 30.4375, hours: 160, gross }));

  it('pays a territory that applies France’s law France’s benefit, and its law', () => {
    expect(benefitAt(['GP'])).toBe(BENEFITS.FR);
    expect(laborAt(['GP'])?.overtime).toEqual(laborAt(['FR'])?.overtime);
  });

  it('owes the Gulf’s end-of-service gratuity on any leaving', () => {
    expect(laborAt(['AE'])?.severance?.daysAYear).toBeGreaterThan(0);
  });

  it('works Austria’s benefit on the net week, not the gross', () => {
    const b = WORLD_LAW.AT!.benefit!;
    const week = (3_000 * 12) / 52;
    const basis = BENEFITS.AT!.basis(monthly(3_000), ctx);
    expect(b.ofNet).toBe(true);
    expect(basis).toBeGreaterThan(0);
    // Austria takes a fifth or more of €3,000 a month in tax and insurance.
    expect(basis).toBeLessThan(0.85 * week * b.rate!);
  });

  it('holds Belgium’s benefit within its bounds', () => {
    const b = WORLD_LAW.BE!.benefit!;
    expect(BENEFITS.BE!.basis(monthly(20_000), ctx)).toBe(b.max);
    expect(BENEFITS.BE!.basis(monthly(100), ctx)).toBe(b.min);
  });

  it('pays Greece’s flat week', () => {
    expect(BENEFITS.GR!.basis(monthly(100), ctx)).toBe(WORLD_LAW.GR!.benefit!.flat);
  });

  it('refuses China’s benefit short of the months it asks, and pays with them', () => {
    const b = WORLD_LAW.CN!.benefit!;
    expect(BENEFITS.CN!.qualifies(monthly(5_000, b.qualifyMonths - 1), ctx)).toMatch(/needs/);
    expect(BENEFITS.CN!.qualifies(monthly(5_000, b.qualifyMonths), ctx)).toBeUndefined();
  });

  it('never asks for more months than its window holds', () => {
    for (const w of Object.values(WORLD_LAW)) if (w.benefit) expect(w.benefit.withinMonths).toBeGreaterThanOrEqual(w.benefit.qualifyMonths);
  });

  it('keeps the thirteen’s own benefits over the pass’s', () => {
    expect(BENEFITS.FR!.name).toBe('Allocation d’aide au retour à l’emploi');
    expect(BENEFITS.JP!.name).toBe('基本手当');
  });
});
describe('the finishing pass', () => {
  const life = (cityId: string, seed: string) =>
    quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, seed);
  const worldTown = (country: string, name: string) => {
    addCountryCities(country, readFileSync(`public/geo/${country}.tsv`, 'utf8'));
    return CITIES.all().find((c) => c.countryId === country && c.name === name)!;
  };

  it('holds a Colorado quitter off for its ten weeks, where most states pay nothing', () => {
    expect(BENEFITS['US-CO']!.quit).toEqual({ weeks: 10 });
    expect(BENEFITS['US-TN']!.quit).toBe('none');
    const sim = life('us-co-denver', 'co-quit');
    sim.advanceTo(Date.UTC(2027, 3, 1));
    sim.must({ kind: 'work.quit', payload: {} });
    sim.advanceBy(40 * MS_DAY);
    const offer = claimFor(sim, sim.player);
    expect('refused' in offer ? offer.refused : offer.barWeeks).toBe(10);
  });

  it('pays a Thai worker who resigned 30% for 90 days, not nothing', () => {
    const bangkok = worldTown('th', 'Bangkok');
    const laidOff = life(bangkok.id, 'th-a');
    laidOff.advanceTo(Date.UTC(2027, 3, 1));
    const last = layOff(laidOff, laidOff.player)!;
    laidOff.advanceTo(last + MS_DAY);
    const full = claimFor(laidOff, laidOff.player);
    const quit = life(bangkok.id, 'th-a');
    quit.advanceTo(Date.UTC(2027, 3, 1));
    quit.must({ kind: 'work.quit', payload: {} });
    quit.advanceBy(40 * MS_DAY);
    const offer = claimFor(quit, quit.player);
    if ('refused' in offer || 'refused' in full) throw new Error('refused');
    expect(offer.weeks).toBeCloseTo(13, 6);
    expect(offer.basis / full.basis).toBeCloseTo(0.3, 1);
  });

  it('says a country has no benefit where the law has none, and whose word that is', () => {
    const nairobi = worldTown('ke', 'Nairobi');
    const sim = life(nairobi.id, 'ke');
    sim.advanceTo(Date.UTC(2027, 3, 1));
    const last = layOff(sim, sim.player)!;
    sim.advanceTo(last + MS_DAY);
    const offer = claimFor(sim, sim.player);
    expect('refused' in offer && offer.refused).toMatch(/^Kenya has no unemployment benefit \(.+\)\.$/);
    expect(noBenefitAt(['GP'])).toBeUndefined();
  });
});

describe('the finishing pass: benefits', () => {
  const monthly = (gross: number, months = 12, hours = 160): WorkRecord =>
    Array.from({ length: months }, (_, i) => ({ at: claimAt - (i + 0.5) * 30.4375 * MS_DAY, days: 30.4375, hours, gross }));
  const pay = { age: 30, savings: 0, share: 1 };
  const w = (iso: string) => WORLD_LAW[iso]!.benefit!;

  it('pays Italy 75% to the reference and 25% above it, 3% less a month from the sixth, for half the weeks worked', () => {
    const b = w('IT');
    const basis = BENEFITS.IT!.basis(monthly(2_000, 12), ctx);
    const week = (2_000 * 12) / 365.25 * 7;
    expect(basis).toBeCloseTo(Math.min(b.max!, b.threshold! * 0.75 + (week - b.threshold!) * 0.25), 6);
    expect(BENEFITS.IT!.amount(basis, b.decline!.fromWeek - 1, pay)).toBeCloseTo(basis, 6);
    expect(BENEFITS.IT!.amount(basis, b.decline!.fromWeek, pay)).toBeCloseTo(basis * 0.97, 6);
    expect(BENEFITS.IT!.weeks!(monthly(2_000, 12), ctx, basis)).toBeCloseTo((365.25 / 7) * 0.5, 1);
  });

  it('pays Colombia a falling share of the minimum wage, month by month', () => {
    const b = w('CO');
    const basis = BENEFITS.CO!.basis(monthly(2_000_000, 12), ctx);
    expect(BENEFITS.CO!.amount(basis, 1, pay)).toBeCloseTo(b.flats![0]![1], 6);
    expect(BENEFITS.CO!.amount(basis, b.flats![1]![0], pay)).toBeCloseTo(b.flats![1]![1], 6);
    expect(b.flats![1]![1]).toBeLessThan(b.flats![0]![1]);
  });

  it('caps Singapore’s support at the past week’s pay', () => {
    const low = BENEFITS.SG!.basis(monthly(600, 12), ctx);
    expect(BENEFITS.SG!.amount(low, 1, pay)).toBeCloseTo(low, 6);
    const high = BENEFITS.SG!.basis(monthly(5_000, 12), ctx);
    expect(BENEFITS.SG!.amount(high, 1, pay)).toBeCloseTo(w('SG').flats![0]![1], 6);
  });

  it('asks Morocco’s 780 days in 36 months and 260 in the last 12', () => {
    const recent = monthly(3_000, 30);
    expect(BENEFITS.MA!.qualifies(recent, ctx)).toBeUndefined();
    const old = recent.map((one) => ({ ...one, at: one.at - 12 * 30.4375 * MS_DAY }));
    expect(BENEFITS.MA!.qualifies([...old, ...monthly(3_000, 6)], ctx)).toMatch(/10 months of work in the last 12/);
  });

  it('asks Norway’s income: 1.5 G in a year, or 3 G in three', () => {
    const q = w('NO').qualifyIncome!;
    expect(BENEFITS.NO!.qualifies(monthly(q[0]!.amount / 12 + 1, 12), ctx)).toBeUndefined();
    expect(BENEFITS.NO!.qualifies(monthly(q[0]!.amount / 12 - 100, 12), ctx)).toMatch(/needs earnings/);
  });

  it('works Kazakhstan’s payment and its months by the months insured', () => {
    const b = w('KZ');
    const short = BENEFITS.KZ!.basis(monthly(200_000, 8), ctx);
    const long = BENEFITS.KZ!.basis(monthly(200_000, 30), ctx);
    expect(long).toBeGreaterThan(short);
    expect(BENEFITS.KZ!.weeks!(monthly(200_000, 30), ctx, long)).toBeCloseTo(b.weeksByMonths!.filter(([m]) => m <= 30).at(-1)![1], 6);
  });

  it('averages the minimum wage into Algeria’s reference wage', () => {
    const b = w('DZ');
    const week = (40_000 * 12) / 365.25 * 7;
    expect(BENEFITS.DZ!.basis(monthly(40_000, 12), ctx)).toBeCloseTo(Math.min(b.max!, (week + b.withMinimum!) / 2), 6);
  });

  it('slides Puerto Rico’s fraction between the Labor Department’s anchors, SLATE’s estimate', () => {
    expect(BENEFITS.PR!.basis(record([660, 600, 600, 600]), ctx)).toBe(60);
    // Halfway between the anchors, halfway between 1/11 and 1/26.
    expect(BENEFITS.PR!.basis(record([3_450, 3_000, 3_000, 3_000]), ctx)).toBeCloseTo(3_450 * (1 / 11 + 1 / 26) / 2, 6);
    expect(BENEFITS.PR!.basis(record([6_240, 6_000, 6_000, 6_000]), ctx)).toBe(240);
    expect(w('PR').source).toMatch(/SLATE’s estimate/);
  });

  it('pays Hong Kong’s CSSA as long as they’re out of work, and nothing over its asset limit', () => {
    expect(BENEFITS.HK!.weeks).toBeUndefined();
    expect(BENEFITS.HK!.amount(BENEFITS.HK!.basis(monthly(10_000), ctx), 1, { ...pay, savings: w('HK').assetLimit! + 1 })).toBe(0);
  });

  it('says where the benefit exists and SLATE couldn’t size it', () => {
    expect(noBenefitAt(['KG'])).toMatchObject({ name: 'Kyrgyzstan', unsized: true });
  });
});

describe('the finishing pass: extra pay', () => {
  const life = (country: string, name: string, seed: string) => {
    addCountryCities(country, readFileSync(`public/geo/${country}.tsv`, 'utf8'));
    if (hasHolidayFile(country)) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));
    const city = CITIES.all().find((c) => c.countryId === country && c.name === name)!;
    return quickSave({ startLocationId: city.id, homeRegionId: city.id, livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, seed);
  };

  it('pays Peru’s gratificación and 9% more on it the same day, each on the record', () => {
    const sim = life('pe', 'Lima', 'pe-x');
    sim.advanceTo(Date.UTC(2026, 6, 15, 23));
    const pending = sim.player.job!.pendingPay ?? [];
    const grat = pending.find((one) => one.name === 'Gratificación por Fiestas Patrias')!;
    const bonus = pending.find((one) => one.name === 'Bonificación extraordinaria')!;
    expect(bonus.amount / grat.amount).toBeCloseTo(0.09, 2);
    expect(sim.player.job!.extrasPaid).toEqual(expect.arrayContaining(['Gratificación por Fiestas Patrias-2026-7', 'Bonificación extraordinaria-2026-7']));
  });

  it('pays Greece’s Easter bonus four days before Easter, which moves', () => {
    const sim = life('gr', 'Athens', 'gr-x');
    sim.advanceTo(Date.UTC(2027, 3, 27, 12));
    expect(sim.player.job!.extrasPaid ?? []).not.toContain('Easter bonus-2027-4');
    sim.advanceTo(Date.UTC(2027, 3, 29, 12));
    expect(sim.player.job!.extrasPaid).toContain('Easter bonus-2027-4');
  });

  it('pays both of Malta’s statutory bonuses a year, June’s and December’s', () => {
    const sim = life('mt', 'Valletta', 'mt-x');
    sim.advanceTo(Date.UTC(2027, 0, 5));
    expect(sim.player.job!.extrasPaid).toEqual(expect.arrayContaining(['Statutory bonus-2026-6', 'Statutory bonus-2026-12']));
  });

  it('raises Egypt’s wage 3% after a year with the employer', () => {
    const sim = life('eg', 'Cairo', 'eg-x');
    const start = hourlyWage(sim, sim.player);
    sim.advanceBy(370 * MS_DAY);
    expect(hourlyWage(sim, sim.player) / start).toBeCloseTo(1.03, 3);
  });

  it('pays Puerto Rico’s Christmas bonus only after 1,350 hours, and no more than $600', () => {
    const extra = WORLD_LAW.PR!.law!.extras!.find((one) => one.kind === 'shareOfYear') as Extract<Extra, { kind: 'shareOfYear' }>;
    const now = Date.UTC(2027, 11, 15);
    const weeks = (hours: number, gross: number) => Array.from({ length: 50 }, (_, i) => ({ at: now - (i + 1) * 7 * MS_DAY, hours, gross }));
    expect(shareOfYearDue(extra, weeks(20, 50_000), now, 60_000)).toBe(0);
    expect(shareOfYearDue(extra, weeks(30, 50_000), now, 60_000)).toBeCloseTo(50 * 50_000 * 0.02, 6);
    expect(shareOfYearDue(extra, weeks(40, 100_000), now, 60_000)).toBe(60_000);
  });

  it('earns Greece’s Easter bonus over January to April, not the half year', () => {
    const sim = life('gr', 'Athens', 'gr-e');
    const job = sim.player.job!;
    const easter = Date.UTC(2026, 3, 8, 12);
    sim.advanceTo(easter);
    const bonus = (job.pendingPay ?? []).find((one) => one.name === 'Easter bonus')!;
    // The bonus falls due four days before Easter (8 April 2026), on the 4th.
    const due = Date.UTC(2026, 3, 4);
    const period = 4 * 30.4375 * MS_DAY;
    const earned = Math.min(1, (due - Math.max(due - period, job.since)) / period);
    const halfMonth = patternHours(patternOf(jobFor(job.jobId), job.fullTime)) * hourlyWage(sim, sim.player) * (52 / 12) * 0.5;
    expect(bonus.amount / (halfMonth * earned)).toBeCloseTo(1, 1);
  });

  it('adds Senegal’s seniority premium after two years with the employer', () => {
    const sim = life('sn', 'Dakar', 'sn-x');
    const start = hourlyWage(sim, sim.player);
    sim.advanceBy(740 * MS_DAY);
    expect(hourlyWage(sim, sim.player)).toBeGreaterThan(start);
  });

  it('loads Brazil’s leave by a third, and pays Slovakia’s Sunday premium on the minimum wage', () => {
    expect(laborAt(['BR'])?.leave?.loading).toBeCloseTo(1 / 3, 3);
    expect(laborAt(['SK'])?.windows?.find((one) => one.name === 'Sunday Premium')?.flat).toBeCloseTo(5.26, 2);
  });
});
