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
import { holidayOff, hourlyWage, layOff, leaveLoadingFor, movableDue, redundancyPay, rotaOf, shareOfYearDue } from '../src/engine/systems/work';
import { holidaysInYear } from '../src/engine/content/holidays';
import { jobFor, patternHours, patternOf } from '../src/engine/content/jobs';
import type { Extra } from '../src/engine/content/labor';
import { addCountryHolidays, hasHolidayFile } from '../src/engine/content/holidays';
import { claimFor } from '../src/engine/systems/unemployment';
import { japanStandard, payrollYear } from '../src/engine/content/payroll';
import { employerNoticeDays, laborAt, layoffChanceADay, redundancyWeeks } from '../src/engine/content/labor';
import { juniorShare } from '../src/engine/content/wages';
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

  it('reads Puerto Rico’s weekly benefit off its regulation’s table, stepped down to what the base period reaches', () => {
    // Reglamento 9056: $75 to $97.50 in the best quarter is $60 a week; $4,846.01 and over is $240, with $7,480 in the base period.
    expect(BENEFITS.PR!.basis(record([90, 90, 90, 20]), ctx)).toBe(60);
    expect(BENEFITS.PR!.basis(record([5_000, 5_000, 5_000, 5_000]), ctx)).toBe(240);
    // The same best quarter with too little in the rest: a lower line, $280 plus $40 for each dollar over $60.
    const short = BENEFITS.PR!.basis(record([5_000, 100, 0, 0]), ctx);
    expect(short).toBe(60 + Math.floor((5_100 - 280) / 40));
    expect(BENEFITS.PR!.qualifies(record([5_000, 0, 0, 0]), ctx)).toMatch(/two quarters/);
  });

  it('pays Hong Kong’s CSSA as long as they’re out of work, and nothing over its asset limit', () => {
    expect(BENEFITS.HK!.weeks).toBeUndefined();
    expect(BENEFITS.HK!.amount(BENEFITS.HK!.basis(monthly(10_000), ctx), 1, { ...pay, savings: w('HK').assetLimit! + 1 })).toBe(0);
  });

  it('says where the benefit exists and SLATE couldn’t size it', () => {
    expect(noBenefitAt(['TM'])).toMatchObject({ name: 'Turkmenistan', unsized: true });
    expect(noBenefitAt(['KG'])).toBeUndefined();
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


describe('the fixes: what the finishing pass left', () => {
  const monthly = (gross: number, months = 12): WorkRecord =>
    Array.from({ length: months }, (_, i) => ({ at: claimAt - (i + 0.5) * 30.4375 * MS_DAY, days: 30.4375, hours: 160, gross }));

  it('pays Kyrgyzstan 300 som a month, more for a longer insurance record', () => {
    expect(BENEFITS.KG!.basis(monthly(20_000, 13), ctx)).toBeCloseTo((300 * 12) / 52, 6);
    expect(BENEFITS.KG!.basis(monthly(20_000, 30), ctx)).toBeCloseTo((330 * 12) / 52, 6);
    expect(BENEFITS.KG!.qualifies(monthly(20_000, 11), ctx)).toMatch(/12 months/);
  });

  it('holds a Swiss claim off 31 days for quitting, the start of SECO’s severe band', () => {
    expect(BENEFITS.CH!.quit).toEqual({ weeks: 31 / 7 });
    expect(BENEFITS.CH!.source).toMatch(/D75/);
  });

  it('pays North Macedonia’s leave allowance of 40% of the average net wage after six months', () => {
    expect(WORLD_LAW.MK!.law!.extras).toEqual([expect.objectContaining({ kind: 'fixed', amount: 19_116, minWeeks: 26 })]);
  });

  it('dates a bonus by the government’s listed Eid where the calendar has none (Bangladesh’s)', () => {
    addCountryCities('bd', readFileSync('public/geo/bd.tsv', 'utf8'));
    const dhaka = CITIES.all().find((c) => c.countryId === 'bd' && c.name === 'Dhaka')!;
    const before = { name: 'Eid al-Fitr', days: 7, dates: ['2026-03-21'] };
    expect(movableDue(before, dhaka.id, { year: 2026, month: 3, day: 14 })).toBe(true);
    expect(movableDue(before, dhaka.id, { year: 2026, month: 3, day: 15 })).toBe(false);
    expect(movableDue(before, dhaka.id, { year: 2027, month: 3, day: 3 })).toBe(false);
  });

  it('takes the Kentucky cities the first research missed, and Brandenburg’s exemption', () => {
    const ky = (cityId: string, gross: number) => payrollYear('US', gross * 100, { path: ['US', 'US-KY'], cityId, at, age: 30 }).lines;
    expect(ky('us-ky-henderson', 30_000).find((l) => l.name === 'Henderson Occupational License Tax')!.amount / 100).toBeCloseTo(30_000 * 0.0165, 6);
    expect(ky('us-ky-brandenburg', 18_000).some((l) => /Brandenburg/.test(l.name))).toBe(false);
    expect(ky('us-ky-brandenburg', 30_000).find((l) => /Brandenburg/.test(l.name))!.amount / 100).toBeCloseTo(30_000 * 0.00333, 6);
  });
});


describe('the open items, closed', () => {
  it('pays Sweden’s and Denmark’s holiday pay as the share of the year’s pay the law gives, and Norway’s a little under the wage', () => {
    const se = laborAt(['SE'])!.leave!;
    expect(se.loading).toBeCloseTo(0.12 / se.accrual - 1, 9);
    const dk = laborAt(['DK'])!.leave!;
    expect(dk.loading).toBeCloseTo(0.125 / dk.accrual - 1, 9);
    const no = laborAt(['NO'])!.leave!;
    expect(no.loading).toBeLessThan(0);
    expect(no.loading).toBeCloseTo(0.102 / no.accrual - 1, 9);
  });

  it('pays Belgium’s blue-collar lines their fund’s holiday pay, and the rest the white-collar double pécule', () => {
    const be = laborAt(['BE'])!;
    expect(leaveLoadingFor(be, 'hospitality')).toBeCloseTo(0.1661 / be.leave!.accrual - 1, 3);
    expect(leaveLoadingFor(be, 'retail')).toBeCloseTo(0.92, 9);
  });

  it('charges Ohio’s $332 once taxable income passes $26,050, then 2.75% of the excess', () => {
    const oh = (g: number) => payrollYear('US', g * 100, { path: ['US', 'US-OH'], at, age: 30 }).lines.find((l) => l.name === 'Ohio Income Tax')?.amount ?? 0;
    // The exemption is $2,400 up to $40,000 of income.
    expect(oh(28_000) / 100).toBe(0);
    expect(oh(30_000) / 100).toBeCloseTo(332 + (30_000 - 2_400 - 26_050) * 0.0275, 2);
  });

  it('forgives Kentucky’s tax by its 2026 poverty line, $15,960, ten points less at each band', () => {
    const ky = (g: number) => payrollYear('US', g * 100, { path: ['US', 'US-KY'], at, age: 30 }).lines.find((l) => l.name === 'Kentucky Income Tax')?.amount ?? 0;
    expect(ky(15_900)).toBe(0);
    expect(ky(16_400) / 100).toBeCloseTo((16_400 - 3_360) * 0.035 * 0.1, 2);
  });

  it('frees Mexico’s aguinaldo from income tax to 30 UMA', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'mx-a');
    sim.advanceTo(Date.UTC(2026, 11, 20, 23));
    const aguinaldo = (sim.player.job!.pendingPay ?? []).filter((one) => one.name === 'Aguinaldo');
    expect(aguinaldo.some((one) => one.taxFree)).toBe(true);
  });

  it('frees Mexico’s prima vacacional from income tax, paid apart from the leave', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'mx-b');
    sim.advanceTo(Date.UTC(2027, 1, 15));
    sim.must({ kind: 'work.take_leave', payload: {} });
    sim.advanceBy(20 * MS_DAY);
    expect(sim.player.job!.loadingFree?.amount ?? 0).toBeGreaterThan(0);
  });

  it('pays the Philippines’ thirteenth month free of tax, to PHP 90,000', () => {
    addCountryCities('ph', readFileSync('public/geo/ph.tsv', 'utf8'));
    const manila = CITIES.all().find((c) => c.countryId === 'ph' && c.name === 'Manila')!;
    const sim = quickSave({ startLocationId: manila.id, homeRegionId: manila.id, livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'ph-x');
    sim.advanceTo(Date.UTC(2026, 11, 24, 23));
    const thirteenth = (sim.player.job!.pendingPay ?? []).filter((one) => one.name === '13th-month pay');
    expect(thirteenth.length).toBeGreaterThan(0);
    expect(thirteenth.every((one) => one.taxFree)).toBe(true);
  });
});


describe('the open items, closed: benefits and an employer’s own', () => {
  const monthly = (gross: number, months = 12): WorkRecord =>
    Array.from({ length: months }, (_, i) => ({ at: claimAt - (i + 0.5) * 30.4375 * MS_DAY, days: 30.4375, hours: 160, gross }));

  it('asks the Virgin Islands’ $858 in the best quarter, and half again it in the base period or 39 weekly benefits', () => {
    expect(BENEFITS.VI!.qualifies(record([800, 800, 800, 800]), ctx)).toMatch(/858/);
    expect(BENEFITS.VI!.qualifies(record([1_000, 500, 0, 0]), ctx)).toBeUndefined();
    // $3,000 in one quarter alone: short of 1.5 times it, and of 39 weeks of $187.50.
    expect(BENEFITS.VI!.qualifies(record([3_000, 100, 0, 0]), ctx)).toMatch(/858/);
    // At the $648 cap the alternative counts: $26,000 is short of 1.5 times $20,000 but past 39 times $648.
    expect(BENEFITS.VI!.qualifies(record([20_000, 6_000, 0, 0]), ctx)).toBeUndefined();
  });

  it('pays Bosnia 40% of the average net wage, for longer the longer the record', () => {
    expect(BENEFITS.BA!.basis(monthly(1_500, 12), ctx)).toBeCloseTo((689.2 * 12) / 52, 6);
    expect(BENEFITS.BA!.weeks!(monthly(1_500, 12), ctx, 0)).toBeCloseTo(3 * 52 / 12, 6);
  });

  it('dates Bangladesh’s bonus after 2026 by the expected Eid, and says it’s expected', () => {
    const extra = WORLD_LAW.BD!.law!.extras!.find((one) => one.name === 'Eid-ul-Fitr Bonus')! as Extract<Extra, { kind: 'month' }>;
    expect(extra.beforeHoliday!.dates).toContain('2027-03-10');
    expect(extra.source).toMatch(/expected, subject to moon sighting/);
  });

  it('pays Lidl Serbia’s leave supplement in June, where it’s the employer', () => {
    addCountryCities('rs', readFileSync('public/geo/rs.tsv', 'utf8'));
    const belgrade = CITIES.all().find((c) => c.countryId === 'rs' && c.name === 'Belgrade')!;
    const sim = quickSave({ startLocationId: belgrade.id, homeRegionId: belgrade.id, livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994, beforeActing: 'retail' }, 'rs-lidl');
    if (sim.player.job!.employerId !== 'rs-retail-lidl-srbija') {
      sim.must({ kind: 'work.apply', payload: { employerId: 'rs-retail-lidl-srbija' } });
    }
    sim.advanceTo(Date.UTC(2027, 5, 15, 23));
    expect(sim.player.job!.employerId).toBe('rs-retail-lidl-srbija');
    expect(sim.player.job!.extrasPaid).toContain('Annual Leave Supplement-2027-6');
  });
});


describe('the open items, closed: local taxes', () => {
  const town = (state: string, cityId: string, gross: number) => payrollYear('US', gross * 100, { path: ['US', state], cityId, at, age: 30 }).lines;
  const amount = (list: { name: string; amount: number }[], name: RegExp) => (list.find((l) => name.test(l.name))?.amount ?? 0) / 100;

  it('charges Maryland’s county tax on Maryland taxable income, by Anne Arundel’s brackets', () => {
    const md = STATES['US-MD']!.tax!;
    const taxable = 60_000 - md.standardDeduction - md.personalExemption;
    expect(amount(town('US-MD', 'us-md-annapolis', 60_000), /Anne Arundel/)).toBeCloseTo(50_000 * 0.027 + (taxable - 50_000) * 0.0294, 2);
    expect(amount(town('US-MD', 'us-md-baltimore', 30_000), /Baltimore City/)).toBeCloseTo((30_000 - md.standardDeduction - md.personalExemption) * 0.032, 2);
  });

  it('charges Indiana’s county tax after the exemption', () => {
    const t = STATES['US-IN']!.tax!;
    expect(amount(town('US-IN', 'us-in-indianapolis', 30_000), /Marion County/)).toBeCloseTo((30_000 - t.standardDeduction - t.personalExemption) * 0.0202, 2);
  });

  it('takes Middletown’s 1% beside Louisville Metro’s, and exempts Irvington’s under $25,000', () => {
    expect(amount(town('US-KY', 'us-ky-middletown', 30_000), /Middletown/)).toBeCloseTo(300, 6);
    expect(amount(town('US-KY', 'us-ky-irvington', 20_000), /Irvington/)).toBe(0);
    expect(amount(town('US-KY', 'us-ky-irvington', 30_000), /Irvington/)).toBeCloseTo(75, 6);
  });

  it('stops Portland Metro’s tax at Metro’s own boundary', () => {
    expect(town('US-OR', 'us-or-canby', 200_000).some((l) => /Supportive Housing/.test(l.name))).toBe(false);
    expect(town('US-OR', 'us-or-gresham', 200_000).some((l) => /Supportive Housing/.test(l.name))).toBe(true);
  });
});


describe('the job engine’s own open items', () => {
  it('fixes Japan’s standard monthly remuneration at hiring, and again each September from April to June’s pay', () => {
    const sim = quickSave({ startLocationId: 'jp-13-tokyo', homeRegionId: 'jp-13-tokyo', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'jp-grade');
    sim.advanceTo(Date.UTC(2026, 3, 1));
    const hired = sim.player.job!.jpGrade!;
    expect(hired.monthly).toBeGreaterThan(0);
    sim.advanceTo(Date.UTC(2026, 9, 1));
    const september = sim.player.job!.jpGrade!;
    expect(september.year).toBe(2026);
    const spring = (sim.player.earnings!.paydays).filter((one) => { const m = new Date(one.at).getUTCMonth(); return new Date(one.at).getUTCFullYear() === 2026 && m >= 3 && m <= 5; });
    const average = spring.reduce((sum, one) => sum + one.gross, 0) / spring.length / 100;
    expect(september.monthly).toBe(japanStandard(average));
  });
});


describe('the job engine’s older open items', () => {
  const y = (path: string[], wages: number, extra: Partial<YearFigures> = {}): YearFigures => ({ wages, benefits: [], age: 30, path, at, benefitMonths: 0, rent: 0, savings: 0, ...extra });
  const credit = (code: string, fig: YearFigures, name: string) => SETTLEMENTS[code]!.credits!(fig, {}).find((c) => c.name === name)?.amount ?? 0;

  it('lets Germany’s cafés, bars, care, security and events work Sundays, and keeps shops, offices, building sites and delivery off', () => {
    const de = laborAt(['DE'])!;
    expect(de.sundayOff!.lines).toEqual(['retail', 'office', 'trades', 'between']);
    expect(de.holidayOff!.lines).toEqual(['retail', 'office', 'trades', 'between']);
  });

  it('gives Iceland’s older workers the agreements’ longer notice', () => {
    const is = laborAt(['IS']);
    expect(employerNoticeDays(is, 130, 54)).toBe(90);
    expect(employerNoticeDays(is, 130, 56)).toBe(120);
    expect(employerNoticeDays(is, 130, 64)).toBe(180);
    expect(employerNoticeDays(is, 100, 64)).toBe(90);
  });

  it('holds Mexico’s seniority premium to twice the minimum wage a day, and not the three months’ pay', () => {
    const r = laborAt(['MX'])!.redundancy!;
    const week = 10_000;
    const weeks = redundancyWeeks(r, 24, 30);
    expect(redundancyPay(r, 24, 30, week, (x) => x)).toBe(Math.round(week * r.plus! + r.yearWeekCap! * (weeks - r.plus!)));
  });

  it('frees Spain’s and Australia’s redundancy pay from tax as their laws do, and Korea’s severance', () => {
    expect(laborAt(['ES'])!.redundancy!.taxFree).toBe(true);
    expect(laborAt(['AU'])!.redundancy!).toMatchObject({ taxFreeBase: 13_598, taxFreePerYear: 6_801 });
    expect(laborAt(['KR'])!.severance!.taxFree).toBe(true);
  });

  it('lets France’s and Spain’s untaken leave lapse as their laws do', () => {
    expect(laborAt(['FR'])!.leave!.expiry).toMatchObject({ yearStart: '06-01', graceMonths: 11, action: 'lose' });
    expect(laborAt(['ES'])!.leave!.expiry).toMatchObject({ yearStart: '01-01', graceMonths: 0, action: 'lose' });
  });

  it('pays Australia’s café and office juniors their awards’ shares, and a bar’s the adult rate', () => {
    expect(juniorShare('AU', 'school', 17).share).toBe(0.6);
    expect(juniorShare('AU', 'office', 19).share).toBe(0.8);
    expect(juniorShare('AU', 'hospitality', 17).share).toBe(1);
  });

  it('falls to Ireland’s Jobseeker’s Allowance, less its means on savings', () => {
    const ja = BENEFITS.IE!.fallback!;
    expect(ja.amount(0, 1, { age: 30, savings: 10_000, share: 1 })).toBe(254);
    expect(ja.amount(0, 1, { age: 22, savings: 0, share: 1 })).toBeCloseTo(163.7, 6);
    // €35,000: ten at €1 and five at €2.
    expect(ja.amount(0, 1, { age: 30, savings: 35_000, share: 1 })).toBe(254 - 10 - 10);
  });

  it('waits out Australia’s income maintenance period alongside the liquid assets wait', () => {
    const wait = BENEFITS.AU!.wait!;
    expect(wait({ savings: 0, paidOutWeeks: 6 })).toBe(6 * 7 + 7);
    expect(wait({ savings: 9_000, paidOutWeeks: 2 })).toBe(8 * 7 + 7);
  });

  it('bars a third quit in five years in Japan three months, not one', () => {
    expect(BENEFITS.JP!.repeatQuit).toEqual({ after: 2, withinYears: 5, weeks: 3 * 52 / 12 });
  });

  it('works Britain’s New Style JSA test at each tax year’s own lower earnings limit', () => {
    const at2027 = Date.UTC(2027, 5, 1);
    // 2024/25 and 2025/26: 50 times £123 and £125.
    const week = (start: number, gross: number) => Array.from({ length: 50 }, (_, i) => ({ at: Date.UTC(start, 3, 10) + i * 7 * MS_DAY, days: 7, hours: 20, gross }));
    const record2 = [...week(2024, 123), ...week(2025, 125)];
    expect(BENEFITS.GB!.qualifies(record2, { age: 30, at: at2027, why: 'laidOff' })).toBeUndefined();
    const short = [...week(2024, 123), ...week(2025, 124)];
    expect(BENEFITS.GB!.qualifies(short, { age: 30, at: at2027, why: 'laidOff' })).toMatch(/National Insurance/);
  });

  it('takes tax from Canada’s, Spain’s, France’s, New Zealand’s and Iceland’s benefit as it’s paid, and taxes Iceland’s at the assessment', () => {
    for (const iso of ['ES', 'FR', 'NZ', 'IS']) expect(BENEFITS[iso]!.withheld).toBe(true);
    expect(BENEFITS['CA-08']!.withheld).toBe(true);
    expect(SETTLEMENTS.IS!.benefitLines!.test('Staðgreiðsla')).toBe(true);
    expect(SETTLEMENTS.IE!.untaxed).toContain('Jobseeker’s Allowance');
  });

  it('works Canada’s EI at the city’s own region: Ottawa’s 7.4% asks fewer hours than Toronto’s 6.8%', () => {
    const toronto = benefitAt(['CA', 'CA-08'], 'ca-on-toronto')!;
    const ottawa = benefitAt(['CA', 'CA-08'], 'ca-08-ottawa')!;
    const hours = (b: typeof toronto, h: number) => b.qualifies([{ at: claimAt - 30 * MS_DAY, days: 300, hours: h, gross: 20_000 }], ctx);
    expect(hours(toronto, 640)).toMatch(/665/);
    expect(hours(ottawa, 640)).toBeUndefined();
  });

  it('adds New York City’s own earned income credit for a city resident', () => {
    const fig = y(['US', 'US-NY', 'US-NY-brooklyn'], 9_000);
    const federal = usEitc(fig, 0);
    expect(credit('US-NY', fig, 'New York City Earned Income Credit')).toBeCloseTo(federal * 0.25, 6);
    expect(credit('US-NY', y(['US', 'US-NY', 'US-NY-albany'], 9_000), 'New York City Earned Income Credit')).toBe(0);
  });

  it('pays Washington’s Working Families Tax Credit apart, after its application', () => {
    const later = SETTLEMENTS['US-WA']!.later!;
    expect(later.amount(y(['US', 'US-WA'], 9_000))).toBe(335);
    expect(later.amount(y(['US', 'US-WA'], 18_000))).toBeCloseTo(Math.max(50, 335 - 0.134 * (18_000 - 16_604)), 6);
    expect(later.amount(y(['US', 'US-WA'], 9_000, { age: 22 }))).toBe(0);
  });

  it('gives a Quebec worker the Canada Workers Benefit at Quebec’s figures, and British Columbia’s renter a renter’s credit', () => {
    expect(credit('CA-10', y(['CA', 'CA-10'], 12_000), 'Canada Workers Benefit')).toBeCloseTo(Math.min(3_812.06, 0.373 * 9_600), 6);
    expect(credit('CA-02', y(['CA', 'CA-02'], 30_000, { rent: 9_000 }), 'BC Renter’s Tax Credit')).toBe(400);
    expect(credit('CA-02', y(['CA', 'CA-02'], 30_000), 'BC Renter’s Tax Credit')).toBe(0);
    expect(credit('CA-02', y(['CA', 'CA-02'], 18_000), 'BC Sales Tax Credit')).toBeCloseTo(75 - 0.02 * 3_000, 6);
  });

  it('cuts jobs in eight more countries as their own statistics count, and Britain’s rate where none is published', () => {
    const month = (chance: number) => 1 - (1 - chance) ** 30.4375;
    expect(month(layoffChanceADay('CA', 'office'))).toBeCloseTo(0.0075, 6);
    expect(month(layoffChanceADay('ES', 'trades'))).toBeCloseTo(0.0069, 6);
    expect(layoffChanceADay('MX', 'office')).toBe(layoffChanceADay('GB', 'office'));
  });
});


describe('the job engine’s older open items, played', () => {
  const life = (cityId: string, seed: string, extra: Record<string, unknown> = {}) =>
    quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994, ...extra }, seed);

  it('has a Japanese employer book the days of five a worker hasn’t taken, in the grant’s last month', () => {
    const sim = life('jp-13-tokyo', 'jp-five', { beforeActing: 'office' });
    sim.must({ kind: 'work.set_hours', payload: { fullTime: true } });
    sim.advanceTo(Date.UTC(2027, 7, 1));
    const g = sim.player.job!.lastGrant;
    expect(g).toBeDefined();
    expect(g!.days).toBeGreaterThanOrEqual(10);
    sim.advanceTo(g!.at + 12 * 30.4375 * MS_DAY - MS_DAY);
    expect(sim.player.job!.lastGrant!.takenHours).toBeGreaterThanOrEqual(5 * g!.dayHours - 1e-6);
  });

  it('pays an Irish worker a fifth of a week for a public holiday on a day off', () => {
    addCountryHolidays('ie', readFileSync('public/holidays/ie.tsv', 'utf8'));
    const sim = life('ie-lei-dublin', 'ie-hol');
    const job = sim.player.job!;
    const rota = rotaOf(job);
    // The first public holiday after the save starts that falls on a day off the rota.
    const holiday = holidaysInYear('ie', 2026).map((one) => one.date).filter((date) => Date.parse(`${date}T00:00:00Z`) > sim.now + 40 * MS_DAY)
      .find((date) => !rota.days.includes(new Date(`${date}T00:00:00Z`).getUTCDay()))!;
    expect(holiday).toBeDefined();
    const [yy, mm, dd] = holiday.split('-').map(Number) as [number, number, number];
    sim.advanceTo(Date.UTC(yy, mm - 1, dd, 23));
    const due = (job.pendingPay ?? []).find((one) => one.name === 'Public Holiday') ?? job.lastSlip?.grossLines?.find((one) => one.name === 'Public Holiday');
    expect(due).toBeDefined();
    expect(due!.amount).toBeCloseTo(patternHours(rota) * hourlyWage(sim, sim.player) * 0.2, -1);
  });

  it('takes tax from Toronto’s EI as it’s paid, and the return counts the benefit before it', () => {
    const sim = life('ca-on-toronto', 'ca-with');
    sim.advanceTo(Date.UTC(2027, 3, 1));
    const last = layOff(sim, sim.player)!;
    sim.advanceTo(last + MS_DAY);
    sim.must({ kind: 'work.claim', payload: {} });
    sim.advanceTo(last + 80 * MS_DAY);
    const paid = sim.universe.transactions.filter((t) => t.category === 'benefit');
    expect(paid.length).toBeGreaterThan(0);
    const withheld = sim.nominalAccount('expense', 'Tax Withheld').id;
    expect(paid.every((t) => t.postings.some((p) => p.accountId === withheld && p.amount > 0))).toBe(true);
  });

  it('pays the Canada Workers Benefit’s advances after a return that gave it, and takes them off the next', () => {
    const sim = life('ca-on-toronto', 'ca-adv');
    sim.advanceTo(Date.UTC(2027, 5, 1));
    const a = sim.player.earnings!.cwbAdvance;
    expect(a?.forYear).toBe(2027);
    sim.advanceTo(Date.UTC(2027, 9, 15));
    expect(sim.player.earnings!.cwbAdvance!.paid).toBeCloseTo(Math.round(a!.total / 3) * 2, -1);
  });

  it('bars a third quit in five years in Japan three months', () => {
    const sim = life('jp-13-tokyo', 'jp-quit3');
    sim.advanceTo(Date.UTC(2027, 3, 1));
    sim.player.earnings!.quitClaims = [Date.UTC(2025, 0, 1), Date.UTC(2026, 0, 1)];
    sim.must({ kind: 'work.quit', payload: {} });
    sim.advanceBy(40 * MS_DAY);
    const offer = claimFor(sim, sim.player);
    expect('refused' in offer ? offer.refused : offer.barWeeks).toBeCloseTo(3 * 52 / 12, 6);
  });

  it('counts the weeks of leave and redundancy pay paid out on leaving in Australia', () => {
    const sim = life('au-nsw-sydney', 'au-imp');
    sim.advanceTo(Date.UTC(2027, 3, 1));
    const last = layOff(sim, sim.player)!;
    sim.advanceTo(last + MS_DAY);
    expect(sim.player.earnings!.paidOutWeeks ?? 0).toBeGreaterThan(0);
  });
});


describe('Iceland’s Commerce Day', () => {
  it('keeps a Reykjavík shop worker off on Commerce Day, paid, and not on other holidays', () => {
    addCountryHolidays('is', readFileSync('public/holidays/is.tsv', 'utf8'));
    const sim = quickSave({ startLocationId: 'is-39-reykjavik', homeRegionId: 'is-39-reykjavik', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994, beforeActing: 'retail' }, 'is-cd');
    const job = sim.player.job!;
    expect(job.jobId).toBe('retail');
    expect(holidayOff(job, Date.UTC(2026, 7, 3, 12), 'Atlantic/Reykjavik')).toBe(true);
    expect(holidayOff(job, Date.UTC(2026, 5, 17, 12), 'Atlantic/Reykjavik')).toBe(false);
    const cafe = quickSave({ startLocationId: 'is-39-reykjavik', homeRegionId: 'is-39-reykjavik', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994, beforeActing: 'school' }, 'is-cd2');
    expect(holidayOff(cafe.player.job!, Date.UTC(2026, 7, 3, 12), 'Atlantic/Reykjavik')).toBe(false);
  });
});
