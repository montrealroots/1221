/**
 * Japan's and Korea's revolving courses (2026-09-28): the minimum a
 * statement asks by the bank's own table, not a typical American card's.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { minimumDue, type CardTerms } from '@/engine/systems/credit';
import { REVOLVING_COURSE } from '@/engine/content/revolving';

const tokyo = quickSave({ startLocationId: 'jp-13-tokyo', homeRegionId: 'jp-13-tokyo', wealth: 'modest' }, 'revo');
const terms = (bankId: string, score = 700) => ({
  kind: 'revolving', bankId, apr: 0.18, priced: 0.18, annualFee: 0, minimumShare: 0.02, minimumFloor: 0, lateFee: 0, returnedPaymentFee: 0,
  cashFeeShare: 0, cashFeeMin: 0, cashApr: 0, estimated: [], name: 'x', course: REVOLVING_COURSE[bankId], score,
  minimumPlusInterest: REVOLVING_COURSE[bankId]!.plusInterest === true,
} as unknown as CardTerms);
const yen = (n: number) => n * 100;

describe('a revolving course', () => {
  it('asks MUFG’s ¥5,000 for each ¥100,000 owed, interest inside it', () => {
    expect(minimumDue(tokyo, yen(80_000), terms('jp-mufg'), yen(1_000))).toBe(yen(5_000));
    expect(minimumDue(tokyo, yen(250_000), terms('jp-mufg'), yen(3_000))).toBe(yen(15_000));
    // Never more than what's owed.
    expect(minimumDue(tokyo, yen(3_000), terms('jp-mufg'), 0)).toBe(yen(3_000));
  });

  it('asks SMBC’s ¥5,000 of principal with the month’s interest on top', () => {
    expect(minimumDue(tokyo, yen(250_000), terms('jp-smbc'), yen(3_000))).toBe(yen(8_000));
  });

  it('asks a Korean card’s share by the record: a better one asks less', () => {
    expect(minimumDue(tokyo, yen(1_000_000), terms('kr-shinhan', 800), 0)).toBe(yen(100_000));
    expect(minimumDue(tokyo, yen(1_000_000), terms('kr-shinhan', 600), 0)).toBe(yen(300_000));
  });
});
