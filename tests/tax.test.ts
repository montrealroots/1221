/**
 * Income tax and National Insurance, each rule read in its own money
 * (`content/tax.ts`).
 */
import { describe, expect, it } from 'vitest';
import { computeAnnualTax } from '@/engine/content/tax';
import { exchange } from '@/engine/content/currency';

describe('a rule in its own money', () => {
  it('taxes a Londoner’s £30,000 on the UK’s pound bands: 20% over £12,570, and 8% National Insurance between £12,570 and £50,270', () => {
    const at = Date.UTC(2026, 9, 1);
    const t = computeAnnualTax(30_000_00, 'uk-eng-london', at, { currency: 'GBP' });
    expect(t.federal).toBe(3_486_00);
    expect(t.payroll).toBe(1_394_40);
    // Above the upper limit, 2%; self-employed, Class 4's 6%.
    expect(computeAnnualTax(60_000_00, 'uk-eng-london', at, { currency: 'GBP' }).payroll).toBe(Math.round((50_270 - 12_570) * 8 + (60_000 - 50_270) * 2));
    expect(computeAnnualTax(30_000_00, 'uk-eng-london', at, { currency: 'GBP', selfEmployed: true }).payroll).toBe(1_045_80);
    // The same pounds from a save kept in dollars come to the same tax, in dollars.
    const usd = computeAnnualTax(exchange(30_000_00, 'GBP', 'USD')!, 'uk-eng-london', at, { currency: 'USD' });
    expect(Math.abs(usd.federal - exchange(3_486_00, 'GBP', 'USD')!)).toBeLessThanOrEqual(2);
  });
});

describe('Ireland and Mexico, from their 2026 tables', () => {
  it('taxes a Dubliner’s €30,000 at 20% less €4,000 of credits, with USC on the whole of it and 4.2% PRSI', () => {
    const at = Date.UTC(2026, 5, 1);
    const t = computeAnnualTax(30_000_00, 'ie-lei-dublin', at, { currency: 'EUR' });
    // 6,000 − 4,000, and USC: 0.5% of 12,012, 2% to 28,700, 3% above.
    expect(t.federal).toBe(2_000_00 + 432_82);
    expect(t.payroll).toBe(1_260_00);
    // Over €44,000 at 40%.
    expect(computeAnnualTax(60_000_00, 'ie-lei-dublin', at, { currency: 'EUR' }).federal).toBe(11_200_00 + 1_332_82);
    // On €13,000 or less, no USC, and the credits take all the tax.
    expect(computeAnnualTax(13_000_00, 'ie-lei-dublin', at, { currency: 'EUR' }).federal).toBe(0);
    // PRSI is 4.35% from 1 October 2026.
    expect(computeAnnualTax(30_000_00, 'ie-lei-dublin', Date.UTC(2026, 10, 1), { currency: 'EUR' }).payroll).toBe(1_305_00);
  });

  it('taxes MXN 200,000 on SAT’s 2026 tariff, 16,069.64 fixed and 17.92% over 175,735.67, with IMSS beside it', () => {
    const at = Date.UTC(2026, 5, 1);
    const t = computeAnnualTax(200_000_00, 'mx-cmx-mexicocity', at, { currency: 'MXN' });
    expect(Math.abs(t.federal - 20_417_81)).toBeLessThanOrEqual(1);
    // 2.375% of it, and 0.40% of what's over 3 UMA a year.
    expect(t.payroll).toBe(Math.round(200_000_00 * 0.02375 + (200_000_00 - 128_454_45) * 0.004));
  });
});
