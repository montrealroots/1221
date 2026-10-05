/**
 * Each market's wider lineup of motorhomes and campervans
 * (`content/rvlineup.ts`, from 2026-10-05): on sale beside the first
 * catalog's, each within the place's car license by its gross weight as its
 * maker states it, slept in at a campground, its economy its maker's or the
 * first catalog's estimate for its kind.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { RV_LINEUP } from '@/engine/content/rvlineup';
import { kindOf, modelById, modelsFor, sleepsIn } from '@/engine/systems/vehicles';

type Read = { models: { market: string; make: string; model: string; grossKg: number | null }[] };
const research: Read = { models: readdirSync('docs/research/catalog').filter((f) => /^rv-.*.json$/.test(f)).flatMap((f) => (JSON.parse(readFileSync(`docs/research/catalog/${f}`, 'utf8')) as Read).models) };
const CAP: Record<string, number> = { GB: 3500, IE: 3500, US: 26000 * 0.45359237, CA: 11000 };

describe('the wider motorhome lineup', () => {
  it('is on sale beside the first catalog’s, from many makers, each slept in', () => {
    expect(new Set(RV_LINEUP.map((m) => m.make)).size).toBeGreaterThanOrEqual(25);
    for (const m of RV_LINEUP) { expect(modelById(m.id)).toBe(m); expect(sleepsIn(m)).toBe(true); expect(m.per100km).toBeGreaterThan(0); }
    expect(modelsFor('uk-eng-london', 'motorhome').some((m) => RV_LINEUP.includes(m))).toBe(true);
  });

  it('holds only what the place’s car license drives, by its gross weight as read', () => {
    for (const m of RV_LINEUP) {
      const read = research.models.find((r) => r.market === m.market && r.make === m.make && r.model === m.model)!;
      expect(read.grossKg).toBeGreaterThan(0);
      expect(read.grossKg!).toBeLessThanOrEqual(CAP[m.market]! + 0.5);
    }
    // Heavier ones were read, and left out.
    expect(research.models.some((r) => r.grossKg && r.grossKg > CAP[r.market]!)).toBe(true);
    expect(RV_LINEUP.every((m) => ['motorhome', 'campervan'].includes(kindOf(m)))).toBe(true);
  });
});
