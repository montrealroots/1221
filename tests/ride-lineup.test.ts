/**
 * Each market's wider lineup of bicycles, e-bikes and ATVs
 * (`content/ridelineup.ts`, from 2026-10-05): on sale beside the first
 * catalog's, an e-bike only one ridden there without a license, an ATV only
 * with its engine size read; each bought and taken on an outing like any.
 */
import { describe, expect, it } from 'vitest';
import { RIDE_LINEUP } from '@/engine/content/ridelineup';
import { modelsFor, modelById, kindOf } from '@/engine/systems/vehicles';

const CAP: Record<string, [number, number]> = { US: [750, 32], CA: [500, 32], GB: [250, 25], IE: [250, 25] };

describe('the wider ride lineup', () => {
  it('is on sale beside the first catalog’s, from many makers, each a kind the outings read', () => {
    expect(new Set(RIDE_LINEUP.map((m) => m.make)).size).toBeGreaterThanOrEqual(25);
    for (const m of RIDE_LINEUP) {
      expect(['bicycle', 'ebike', 'atv']).toContain(kindOf(m));
      expect(modelById(m.id)).toBe(m);
      if (kindOf(m) === 'atv') expect(m.cc).toBeGreaterThan(0);
    }
    expect(modelsFor('us-ny-newyork', 'bicycle').some((m) => RIDE_LINEUP.includes(m))).toBe(true);
    expect(modelsFor('us-ny-newyork', 'atv').some((m) => RIDE_LINEUP.includes(m))).toBe(true);
  });

  it('holds no e-bike over the power its place lets be ridden without a license', async () => {
    const research = [await import('../docs/research/catalog/rides-na.json'), await import('../docs/research/catalog/rides-eu.json')].flatMap((r) => (r as unknown as { models: { market: string; make: string; model: string; kind: string; motorW?: number | null }[] }).models);
    for (const m of RIDE_LINEUP.filter((x) => kindOf(x) === 'ebike')) {
      const read = research.find((r) => r.market === m.market && r.make === m.make && r.model === m.model);
      const cap = CAP[m.market];
      if (read?.motorW && cap) expect(read.motorW).toBeLessThanOrEqual(cap[0]);
    }
  });
});
