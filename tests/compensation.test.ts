/**
 * What an airline owes for a flight three hours or more late
 * (`systems/compensation.ts`, from 2026-09-30): EU261 from Ireland, UK261
 * from Britain, Canada's APPR, Mexico's 25% past four hours, none in America,
 * each only where the airline was at fault, paid a month on.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { COMPENSATION, COMPENSATION_KIND, airlineAtFault, claimDelay, owedFor, regimeOf } from '@/engine/systems/compensation';
import { AIR } from '@/engine/content/air';

describe('the law', () => {
  it('is the flight’s by where it leaves, and Canada’s to or from Canada; America owes nothing for a delay', () => {
    expect(regimeOf('ie-lei-dublin', 'uk-eng-london')).toBe('eu261');
    expect(regimeOf('uk-eng-london', 'ie-lei-dublin')).toBe('uk261');
    expect(regimeOf('us-ny-newyork', 'ca-on-toronto')).toBe('appr');
    expect(regimeOf('mx-cmx-mexicocity', 'us-ny-newyork')).toBe('profeco');
    expect(regimeOf('us-ny-newyork', 'us-ca-losangeles')).toBeUndefined();
  });

  it('owes by distance and hours: EU261’s €250, €400 and €600, halved past 3,500 km under four hours; UK261’s pounds; the APPR’s by the hours', () => {
    expect(owedFor('eu261', 460, 200, 0)).toEqual({ amount: 250_00, currency: 'EUR' });
    expect(owedFor('eu261', 460, 170, 0)).toBeUndefined();
    expect(owedFor('eu261', 2_000, 200, 0)).toEqual({ amount: 400_00, currency: 'EUR' });
    expect(owedFor('eu261', 5_000, 200, 0)).toEqual({ amount: 300_00, currency: 'EUR' });
    expect(owedFor('eu261', 5_000, 250, 0)).toEqual({ amount: 600_00, currency: 'EUR' });
    expect(owedFor('uk261', 5_000, 200, 0)).toEqual({ amount: 260_00, currency: 'GBP' });
    expect(owedFor('appr', 500, 200, 0)).toEqual({ amount: 400_00, currency: 'CAD' });
    expect(owedFor('appr', 500, 400, 0)).toEqual({ amount: 700_00, currency: 'CAD' });
    expect(owedFor('appr', 500, 600, 0)).toEqual({ amount: 1_000_00, currency: 'CAD' });
    // Mexico: a quarter of the fare past four hours.
    expect(owedFor('profeco', 500, 250, 200_00)).toEqual({ amount: 50_00 });
    expect(owedFor('profeco', 500, 230, 200_00)).toBeUndefined();
  });

  it('weighs the airline’s fault at EUROCONTROL’s 41% and BTS’s 49.8%', () => {
    expect(COMPENSATION.airlineShare.northAmerica).toBeCloseTo(0.498, 3);
    const sim = quickSave(undefined, 'comp-share');
    const n = 400;
    const eu = Array.from({ length: n }, (_, i) => airlineAtFault(sim, sim.player, 'eu261', `k${i}`)).filter(Boolean).length / n;
    const na = Array.from({ length: n }, (_, i) => airlineAtFault(sim, sim.player, 'appr', `k${i}`)).filter(Boolean).length / n;
    expect(eu).toBeGreaterThan(0.33);
    expect(eu).toBeLessThan(0.49);
    expect(na).toBeGreaterThan(0.42);
    expect(na).toBeLessThan(0.58);
  });
});

describe('a claim', () => {
  it('is paid a month after the late arrival where the airline was at fault', () => {
    for (let n = 0; n < 20; n += 1) {
      const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true }, `comp-${n}`);
      const j = { id: `j${n}`, fromCity: 'ie-lei-dublin', toCity: 'uk-eng-london', arriveAt: sim.now + MS_DAY };
      const owed = claimDelay(sim, sim.player, j, 200, 0);
      if (owed === undefined) continue;
      const cur = saveCurrency(sim.universe);
      expect(owed).toBe(cur === 'EUR' ? 250_00 : exchange(250_00, 'EUR', cur));
      sim.advanceBy(30 * MS_DAY);
      expect(sim.universe.transactions.some((t) => t.memo.startsWith('Compensation for a late flight'))).toBe(false);
      sim.advanceBy(3 * MS_DAY);
      const paid = sim.universe.transactions.find((t) => t.memo === 'Compensation for a late flight, under EU261')!;
      expect(paid.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(owed);
      return;
    }
    throw new Error('no seed was the airline’s fault');
  });
});

describe('on a real journey', () => {
  it('claims for a flight rebooked five hours late, and not for every one', () => {
    const was = AIR.canceledShare;
    (AIR as { canceledShare: number }).canceledShare = 1;
    try {
      let claimed = 0;
      let passed = 0;
      for (let n = 0; n < 12; n += 1) {
        const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, `comp-real-${n}`);
        const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'uk-eng-london', day: sim.now + 7 * MS_DAY, slot: 2, nights: 2 } });
        expect(r.ok, r.error).toBe(true);
        sim.advanceBy(9 * MS_DAY);
        if (sim.universe.scheduled.some((i) => i.kind === COMPENSATION_KIND)) claimed += 1; else passed += 1;
      }
      expect(claimed).toBeGreaterThan(0);
      expect(passed).toBeGreaterThan(0);
    } finally {
      (AIR as { canceledShare: number }).canceledShare = was;
    }
  });
});
