/**
 * Each market's lineup beyond its best-sellers (`docs/research/catalog/cars-*.json`,
 * from 2026-10-05): a car read without its official economy takes the median
 * of SLATE's rated cars of its fuel, said to be SLATE's estimate, so it can be
 * filled and charged; and a model the EV or pickup catalog already holds isn't
 * added twice.
 */
import { describe, expect, it } from 'vitest';
import { CAR_MODELS as CATALOG } from '@/engine/content/vehiclecatalog';
import { EV_MODELS } from '@/engine/content/evcatalog';
import { CAR_MODELS } from '@/engine/systems/vehicles';
import { capacityOf } from '@/engine/systems/fueltank';

describe('a car from the rest of the lineup', () => {
  it('takes its fuel’s rated median where its own economy wasn’t read, and so has a tank or battery', () => {
    const unrated = CATALOG.filter((m) => m.rank === null && m.per100km === null && !m.kwhPer100km);
    expect(unrated.length).toBeGreaterThan(0);
    for (const m of unrated.slice(0, 50)) {
      const r = CAR_MODELS.find((x) => x.id === m.id)!;
      expect(r.economyBasis).toMatch(/^SLATE’s estimate/);
      expect(capacityOf(r)).toBeDefined();
    }
    // A rated car keeps its own figure.
    const own = CAR_MODELS.find((m) => m.per100km !== null && !/estimate/.test(m.economyBasis))!;
    expect(CATALOG.find((m) => m.id === own.id)!.per100km).toBe(own.per100km);
  });

  it('isn’t added again where the EV catalog holds it', () => {
    const evIds = new Set(EV_MODELS.map((m) => m.id));
    expect(CATALOG.some((m) => evIds.has(m.id))).toBe(false);
    expect(new Set(CATALOG.map((m) => m.make)).size).toBeGreaterThan(50);
  });
});
