/**
 * US Social Security's retirement benefit (`systems/socialsecurity.ts`):
 * the best 35 years of US wages to the taxable maximum, indexed, averaged a
 * month, SSA's 2026 formula, and claimed from 62 to 70.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { recordWages } from '@/engine/systems/earnings';
import { claimFactor, socialSecurityOf, socialSecurityRefusal } from '@/engine/systems/socialsecurity';

function worker(seed: string, perYear: number, years = 35, where = 'us-ny-newyork') {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, seed);
  const cur = saveCurrency(sim.universe);
  const d = (x: number) => (cur === 'USD' ? x : exchange(x, 'USD', cur)!);
  for (let i = 0; i < years; i += 1) recordWages(sim.player, Date.UTC(2030 + i, 5, 1), 'America/New_York', { gross: d(perYear * 100), where });
  return { sim, cur };
}

describe('Social Security', () => {
  it('pays 90% and 32% across the 2026 bend points of 35 years’ average: $50,000 a year is $2,079.00 a month at 67', () => {
    const { sim, cur } = worker('ss-50k', 50_000);
    const r = socialSecurityOf(sim.player, cur);
    expect(r.credits).toBe(140);
    expect(r.aime).toBe(Math.floor((50_000 * 35) / 420));
    expect(r.pia).toBeCloseTo(0.9 * 1_286 + 0.32 * (4_166 - 1_286), 1);
  });

  it('counts a year only to its taxable maximum, and not wages earned abroad', () => {
    const rich = worker('ss-rich', 400_000);
    expect(socialSecurityOf(rich.sim.player, rich.cur).aime).toBe(Math.floor((184_500 * 35) / 420));
    const abroad = worker('ss-london', 50_000, 35, 'uk-eng-london');
    expect(socialSecurityOf(abroad.sim.player, abroad.cur).credits).toBe(0);
  });

  it('keeps 70% claimed at 62 and 124% at 70, and asks forty credits', () => {
    expect(claimFactor(-60)).toBeCloseTo(0.7, 10);
    expect(claimFactor(36)).toBeCloseTo(1.24, 10);
    expect(claimFactor(0)).toBe(1);
    const short = worker('ss-short', 50_000, 9);
    short.sim.universe.now = short.sim.player.birthInstant + 67.1 * 365.2425 * MS_DAY;
    expect(socialSecurityRefusal(short.sim, short.sim.player)).toMatch(/forty credits to qualify/);
  });

  it('is paid monthly once claimed at full retirement age', () => {
    const { sim } = worker('ss-claim', 50_000);
    // Sixty-seven today, the record behind them.
    sim.player.birthInstant = sim.now - 67.05 * 365.2425 * MS_DAY;
    const a = sim.execute<{ monthly: number; factor: number }>({ kind: 'pension.social_security', payload: {} });
    expect(a.ok, a.error).toBe(true);
    expect(a.value!.factor).toBe(1);
    sim.advanceBy(32 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Social Security, the month').length).toBe(1);
  });
});
