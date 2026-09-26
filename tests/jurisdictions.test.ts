/**
 * The labor-law pass of 2026-09-26 (`content/jurisdictions.ts`): the Canadian
 * provinces and the US states the first research didn't write out, each
 * paid, taxed, protected and insured by its own law.
 */
import { describe, expect, it } from 'vitest';
import { payrollYear } from '../src/engine/content/payroll';
import { laborAt } from '../src/engine/content/labor';
import { BENEFITS, benefitAt, type WorkRecord } from '../src/engine/content/unemployment';
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

  it('takes a state’s personal credit off its tax', () => {
    const st = STATES['US-UT']!;
    expect(st.tax!.personalCredit).toBeGreaterThan(0);
    expect(line('US', ['US', 'US-UT'], 30_000, 'Utah Income Tax')).toBeCloseTo(Math.max(0, 30_000 * st.tax!.brackets[0]![1] - st.tax!.personalCredit), 6);
  });

  it('takes Massachusetts’ paid-leave contribution from the worker', () => {
    const c = STATES['US-MA']!.leaveContribution!;
    expect(line('US', ['US', 'US-MA'], 30_000, c.name)).toBeCloseTo(30_000 * c.rate, 6);
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