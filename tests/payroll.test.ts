/**
 * A payslip, as each country works it out (`content/payroll.ts`).
 *
 * Each expectation is worked by hand from the country's own 2026 rules, the
 * research's worked examples among them: Iceland's 73,198 kr a month on a
 * 481,932 kr wage, France's roughly 20.8% at the SMIC, no Japanese income
 * tax to ¥1.78 million, Australia's low income tax offset.
 */

import { describe, expect, it } from 'vitest';
import { japanStandard, payrollYear } from '@/engine/content/payroll';

const at = Date.UTC(2026, 8, 25);
const year = (iso: string, gross: number, path: string[], extra: Record<string, number> = {}) =>
  payrollYear(iso, Math.round(gross * 100), { path, age: 30, at, weeklyHours: 30, ...extra });
const line = (slip: ReturnType<typeof year>, name: string) => (slip.lines.find((l) => l.name === name)?.amount ?? 0) / 100;
const taken = (slip: ReturnType<typeof year>) => slip.lines.reduce((sum, l) => sum + l.amount, 0) / 100;

describe('each country’s payslip', () => {
  it('Iceland: 4% pension before tax, the brackets less the personal credit, union dues', () => {
    const slip = year('IS', 481_932 * 12, ['IS', 'IS-39']);
    // 481,932 less 4% is 462,655; 31.49% of it is 145,690, less 72,492.
    expect(line(slip, 'Staðgreiðsla') / 12).toBeCloseTo(73_198, -1);
    expect(line(slip, 'Lífeyrissjóður')).toBeCloseTo(481_932 * 12 * 0.04, 0);
    expect(slip.employerPension / 100).toBeCloseTo(481_932 * 12 * 0.115, 0);
  });

  it('Britain: the personal allowance, National Insurance over £12,570, the pension before tax', () => {
    const slip = year('GB', 25_000, ['GB', 'GB-ENG']);
    const pension = (25_000 - 6_240) * 0.05;
    expect(line(slip, 'Workplace Pension')).toBeCloseTo(pension, 2);
    expect(line(slip, 'Income Tax')).toBeCloseTo((25_000 - pension - 12_570) * 0.20, 2);
    expect(line(slip, 'National Insurance')).toBeCloseTo((25_000 - 12_570) * 0.08, 2);
    // Nothing into a pension under 22, or under the £10,000 trigger.
    expect(line(year('GB', 25_000, ['GB', 'GB-ENG'], { age: 21 }), 'Workplace Pension')).toBe(0);
    expect(line(year('GB', 9_900, ['GB', 'GB-ENG']), 'Workplace Pension')).toBe(0);
    // Scotland's starter rate is lower.
    expect(line(year('GB', 25_000, ['GB', 'GB-SCT']), 'Income Tax')).toBeLessThan(line(slip, 'Income Tax'));
  });

  it('Australia: $18,200 tax-free, the low income tax offset, the Medicare Levy, and super on top', () => {
    const slip = year('AU', 50_000, ['AU', 'AU-02']);
    // 15% of 26,800 and 30% of 5,000 is 5,520, less an offset of 250.
    expect(line(slip, 'PAYG Withholding')).toBeCloseTo(5_270, 2);
    expect(line(slip, 'Medicare Levy')).toBeCloseTo(1_000, 2);
    expect(slip.employerPension / 100).toBeCloseTo(6_000, 2);
    // Under $37,500 the whole $700 offset: 15% of 11,800 is 1,770.
    expect(line(year('AU', 30_000, ['AU', 'AU-02']), 'PAYG Withholding')).toBeCloseTo(1_070, 2);
  });

  it('France: about a fifth off at the SMIC, and nothing withheld under the grid’s first band', () => {
    const slip = year('FR', 12.31 * 1_820, ['FR', 'FR-11']);
    expect(taken(slip) / (12.31 * 1_820)).toBeCloseTo(0.208, 2);
    expect(line(slip, 'Prélèvement à la source')).toBe(0);
  });

  it('Japan: no income tax up to ¥1.78 million, and no resident tax in a first year', () => {
    const slip = year('JP', 1_780_000, ['JP', 'JP-40']);
    expect(line(slip, '所得税 (Income Tax)')).toBe(0);
    expect(line(slip, '住民税 (Resident Tax)')).toBe(0);
    expect(line(year('JP', 2_500_000, ['JP', 'JP-40'], { lastYear: 2_500_000 }), '住民税 (Resident Tax)')).toBeGreaterThan(0);
  });

  it('Mexico: nothing withheld from the general minimum wage, and the employment subsidy below 11,492.66 a month', () => {
    expect(line(year('MX', 315.04 * 365, ['MX', 'MX-09']), 'ISR')).toBe(0);
    const low = year('MX', 11_000 * 12, ['MX', 'MX-09']);
    expect(line(low, 'ISR')).toBeLessThan(line(year('MX', 11_600 * 12, ['MX', 'MX-09']), 'ISR') - 535.65 * 12 + 1_000);
    expect(low.employerPension).toBeGreaterThan(0);
  });

  it('Spain: no IRPF up to €15,876; Social Security at 6.5%', () => {
    const slip = year('ES', 15_000, ['ES', 'ES-29']);
    expect(line(slip, 'IRPF')).toBe(0);
    expect(line(year('ES', 15_870, ['ES', 'ES-29']), 'IRPF')).toBe(0);
    // Just over the limit, no more than 43% of what the pay is over it: 624 over, 268.32.
    expect(line(year('ES', 16_500, ['ES', 'ES-29']), 'IRPF')).toBeCloseTo(624 * 0.43, 2);
    expect(line(year('ES', 24_000, ['ES', 'ES-29']), 'IRPF')).toBeGreaterThan(0);
    expect(line(slip, 'Seguridad Social')).toBeCloseTo(15_000 * 0.065, 2);
  });

  it('Germany: a minijob pays only the pension top-up; a full wage the four insurances and Lohnsteuer', () => {
    const mini = year('DE', 600 * 12, ['DE', 'DE-16']);
    expect(mini.lines.map((l) => l.name)).toEqual(['Rentenversicherung (Minijob Top-Up)']);
    const full = year('DE', 30_000, ['DE', 'DE-16']);
    expect(line(full, 'Rentenversicherung')).toBeCloseTo(30_000 * 0.093, 2);
    expect(line(full, 'Lohnsteuer')).toBeGreaterThan(2_000);
    expect(line(full, 'Lohnsteuer')).toBeLessThan(2_500);
  });

  it('the United States: federal and FICA everywhere, and the state and city where they tax', () => {
    const nyc = year('US', 35_360, ['US', 'US-NY', 'US-NY-newyork']);
    const houston = year('US', 35_360, ['US', 'US-TX', 'US-TX-houston']);
    expect(line(houston, 'Social Security')).toBeCloseTo(35_360 * 0.062, 2);
    expect(line(houston, 'Federal Income Tax')).toBeCloseTo(12_400 * 0.10 + (35_360 - 16_100 - 12_400) * 0.12, 2);
    expect(houston.lines.some((l) => /State|City/.test(l.name))).toBe(false);
    expect(line(nyc, 'New York City Income Tax')).toBeGreaterThan(0);
    expect(line(nyc, 'New York Disability Benefits')).toBeCloseTo(31.2, 2);
  });

  it('Canada: the pension plan over $3,500, Quebec’s own plan, and Ontario’s health premium', () => {
    const toronto = year('CA', 36_600, ['CA', 'CA-08']);
    expect(line(toronto, 'Canada Pension Plan')).toBeCloseTo((36_600 - 3_500) * 0.0595, 2);
    expect(line(toronto, 'Ontario Health Premium')).toBeCloseTo(450, 2);
    expect(line(year('CA', 30_000, ['CA', 'CA-08']), 'Ontario Health Premium')).toBeCloseTo(300, 2);
    const montreal = year('CA', 36_600, ['CA', 'CA-10']);
    expect(line(montreal, 'Quebec Pension Plan')).toBeCloseTo((36_600 - 3_500) * 0.063, 2);
    expect(line(montreal, 'Quebec Parental Insurance Plan')).toBeGreaterThan(0);
  });

  it('Ireland: the credits, USC only over €13,000, PRSI only over €352 a week', () => {
    expect(line(year('IE', 12_900, ['IE', 'IE-L']), 'USC')).toBe(0);
    expect(line(year('IE', 352 * 52, ['IE', 'IE-L']), 'PRSI')).toBe(0);
    const slip = year('IE', 30_000, ['IE', 'IE-L']);
    expect(line(slip, 'PAYE')).toBeCloseTo(30_000 * 0.20 - 4_000, 2);
    expect(line(slip, 'My Future Fund')).toBeCloseTo(450, 2);
  });

  it('New Zealand and Korea: every line, and a pension on top in New Zealand', () => {
    const nz = year('NZ', 49_816, ['NZ', 'NZ-E7']);
    expect(line(nz, 'KiwiSaver')).toBeCloseTo(49_816 * 0.035, 2);
    expect(line(nz, 'ACC Earners’ Levy')).toBeCloseTo(49_816 * 0.0175, 2);
    const kr = year('KR', 25_882_560, ['KR', 'KR-11']);
    expect(line(kr, '지방소득세 (Local Income Tax)')).toBeCloseTo(line(kr, '근로소득세 (Income Tax)') * 0.1, 0);
  });

  it('works a country outside the thirteen from the world research, and marks one with none', () => {
    // Italy: the employee's contributions and IRPEF from its own scale.
    const italy = payrollYear('IT', 20_000_00, { path: ['IT'], age: 30, at });
    expect(italy.estimate).toBeUndefined();
    expect(italy.lines.some((l) => l.name === 'Income Tax' && l.amount > 0)).toBe(true);
    expect(italy.lines.every((l) => l.source.length > 0)).toBe(true);
    // North Korea: nothing found, so SLATE's approximation, and it says so.
    const none = payrollYear('KP', 20_000_00, { path: ['KP'], age: 30, at });
    expect(none.estimate).toBe(true);
  });
});

describe('Japan’s standard monthly remuneration', () => {
  it('charges the premiums on the grade a month’s pay falls in, not the pay', () => {
    expect(japanStandard(212_000)).toBe(220_000);
    expect(japanStandard(209_999)).toBe(200_000);
    expect(japanStandard(2_000_000)).toBe(1_390_000);
    const at = Date.UTC(2026, 5, 1);
    const year = payrollYear('JP', 212_000 * 12 * 100, { path: ['JP'], at, age: 30, weeklyHours: 40 });
    const line = (name: string) => year.lines.find((l) => l.name.startsWith(name))!.amount / 100;
    expect(line('厚生年金')).toBeCloseTo(220_000 * 0.0915 * 12, 2);
    expect(line('健康保険')).toBeCloseTo(220_000 * (0.04925 + 0.00115) * 12, 2);
    // The pension's grades stop at ¥650,000; health's run on.
    const high = payrollYear('JP', 900_000 * 12 * 100, { path: ['JP'], at, age: 30, weeklyHours: 40 });
    expect(high.lines.find((l) => l.name.startsWith('厚生年金'))!.amount / 100).toBeCloseTo(650_000 * 0.0915 * 12, 2);
    expect(high.lines.find((l) => l.name.startsWith('健康保険'))!.amount / 100).toBeCloseTo(880_000 * (0.04925 + 0.00115) * 12, 2);
  });
});