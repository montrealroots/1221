/**
 * A home project's bids, lateness and overrun (`systems/worksrisk.ts`,
 * `content/worksrisk.ts`, from 2026-10-02): three bids within Checkbook's
 * spread whose cheapest averages the guide; late at each country's share by
 * a share of the job's days; over the bid at each country's share, a third of
 * those by 30% or more.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { BID_HALF, LATE_SHARE, OVERRUN_BANDS, WORKS_ODDS } from '@/engine/content/worksrisk';
import { bidsFor, lateDays, overrunOf } from '@/engine/systems/worksrisk';

const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'works-risk');
const N = 4000;

describe('the bids', () => {
  it('three, within the spread, the same all month; their cheapest averages the guide', () => {
    const b = bidsFor(sim, 'k', 10_000_00, '2027-01');
    expect(b).toHaveLength(3);
    expect(b).toEqual([...b].sort((x, y) => x - y));
    expect(bidsFor(sim, 'k', 10_000_00, '2027-01')).toEqual(b);
    expect(bidsFor(sim, 'k', 10_000_00, '2027-02')).not.toEqual(b);
    let sum = 0;
    let hi = 0;
    let lo = Infinity;
    for (let i = 0; i < N; i += 1) {
      const one = bidsFor(sim, `k${i}`, 10_000_00, '2027-01');
      sum += one[0]!;
      hi = Math.max(hi, one[2]!);
      lo = Math.min(lo, one[0]!);
    }
    expect(sum / N / 10_000_00).toBeCloseTo(1, 1.5);
    // Checkbook's high over low, about 62.5%.
    expect(hi / lo).toBeGreaterThan(1.58);
    expect(hi / lo).toBeLessThanOrEqual((1 + BID_HALF) / (1 - BID_HALF) + 1e-6);
  });
});

describe('late and over', () => {
  it('runs late at each country’s share, by two thirds of its days on average', () => {
    const share = (city: string) => { let late = 0; let days = 0; for (let i = 0; i < N; i += 1) { const d = lateDays(sim, `j${i}`, city, 30); if (d > 0) { late += 1; days += d; } } return { share: late / N, mean: days / late }; };
    const ny = share('us-ny-newyork');
    expect(ny.share).toBeCloseTo(WORKS_ODDS.us!.late, 1);
    expect(ny.mean / 30).toBeCloseTo(LATE_SHARE, 0.5);
    expect(share('uk-eng-london').share).toBeCloseTo(WORKS_ODDS.uk!.late, 1);
    // A one-day job late is a day late at least, however short the draw.
    let short = 0;
    for (let i = 0; i < N; i += 1) if (lateDays(sim, `j${i}`, 'us-ny-newyork', 1) > 0) short += 1;
    expect(short).toBe(Math.round(ny.share * N));
  });

  it('comes in over at each country’s share, a third of those by 30% or more, never past 60%', () => {
    let over = 0;
    let tail = 0;
    let most = 0;
    for (let i = 0; i < N; i += 1) {
      const o = overrunOf(sim, `j${i}`, 'us-ny-newyork', 10_000_00) / 10_000_00;
      if (o > 0) over += 1;
      if (o >= OVERRUN_BANDS.under) tail += 1;
      most = Math.max(most, o);
    }
    expect(over / N).toBeCloseTo(0.43, 1);
    expect(tail / over).toBeCloseTo(0.34, 1);
    expect(most).toBeLessThanOrEqual(OVERRUN_BANDS.top);
    let uk = 0;
    for (let i = 0; i < N; i += 1) if (overrunOf(sim, `j${i}`, 'uk-eng-london', 10_000_00) > 0) uk += 1;
    expect(uk / N).toBeCloseTo(0.55, 1);
  });
});
