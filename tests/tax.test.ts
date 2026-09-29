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
