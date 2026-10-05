/**
 * Makers' own mattresses beside IKEA's (`content/mattresscatalog.ts`,
 * `mattressesIn`, `bedQuote` in `systems/furniture.ts`, from 2026-10-05): each
 * in its market's own sizes, on IKEA's frame of that size, by its maker's
 * delivery or, where none is stated, IKEA's bed delivery again.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { BRANDED_MATTRESSES } from '@/engine/content/mattresscatalog';
import { BED_PARTS, BED_SIZES } from '@/engine/content/beds';
import { bedQuote, bedsIn, mattressFeeUsd, mattressRefusal, mattressesIn } from '@/engine/systems/furniture';
import { FURNITURE } from '@/engine/content/furniture';
import { salesTaxRate } from '@/engine/content/tax';
import { inSaveMoney } from '@/engine/systems/banking';
import type { BedPart } from '@/engine/content/beds';
import type { Simulation } from '@/engine/core/simulation';

/** What a frame and a mattress come to in New York, delivered: IKEA's bed delivery, and the mattress's own on top where it's a maker's. */
const expected = (sim: Simulation, frame: BedPart, mattress: BedPart & { delivery?: number | null }): number => {
  const c = FURNITURE.us!;
  const units = frame.price + mattress.price;
  const tax = Math.round(units * 100 * (c.taxAdded ? salesTaxRate('us-ny-newyork', sim.now, 'furniture') : 0));
  const delivery = c.items.bed!.delivery + ('brand' in mattress ? mattress.delivery ?? c.items.bed!.delivery : 0);
  return inSaveMoney(sim, Math.round((units + delivery) * 100) + tax, c.currency) + inSaveMoney(sim, Math.round(mattressFeeUsd('us-ny-newyork', sim.now) * 100), 'USD');
};
/** A mattress's own delivery: a maker's fee, 0 free, null not stated; IKEA's has none of its own. */
const deliveryOf = (m: BedPart): number | null | undefined => (m as BedPart & { delivery?: number | null }).delivery;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a maker’s own mattress', () => {
  it('is sold beside IKEA’s, only in sizes its market’s frames take', () => {
    for (const [market, list] of Object.entries(BRANDED_MATTRESSES)) {
      const sizes = BED_SIZES[market === 'uk' || market === 'ie' ? 'uk' : market === 'mx' ? 'mx' : 'na'].map((s) => s.key);
      for (const m of list) expect(sizes).toContain(m.size);
    }
    expect(mattressesIn('us').length).toBe(BED_PARTS.us!.mattresses.length + BRANDED_MATTRESSES.us!.length);
    expect(new Set(BRANDED_MATTRESSES.us!.map((m) => m.brand)).size).toBeGreaterThan(10);
  });

  it('goes on IKEA’s frame of its size, by its maker’s delivery, or IKEA’s again where its maker states none', () => {
    const sim = life('us-ny-newyork', 'mattress-branded');
    const combos = bedsIn('us-ny-newyork');
    const free = combos.find((b) => 'brand' in b.mattress && deliveryOf(b.mattress) === 0);
    const ikea = combos.find((b) => !('brand' in b.mattress) && free && b.frame.id === free.frame.id && b.mattress.size === free.mattress.size);
    expect(free).toBeDefined();
    const q = bedQuote(sim, 'us-ny-newyork', free!.frame.id, free!.mattress.id);
    expect(typeof q).not.toBe('string');
    if (ikea) {
      const qi = bedQuote(sim, 'us-ny-newyork', ikea.frame.id, ikea.mattress.id) as Exclude<typeof q, string>;
      // The same frame and delivery; the difference is the mattresses' prices and their tax.
      const k = (q as Exclude<typeof q, string>).amount - qi.amount;
      const units = free!.mattress.price - ikea.mattress.price;
      expect(Math.sign(k)).toBe(Math.sign(units));
    }
    const unstated = combos.find((b) => 'brand' in b.mattress && deliveryOf(b.mattress) === null);
    if (unstated) {
      const withIt = bedQuote(sim, 'us-ny-newyork', unstated.frame.id, unstated.mattress.id);
      expect(typeof withIt).not.toBe('string');
    }
    // A mattress of another size doesn't fit the frame.
    const other = mattressesIn('us').find((m) => m.size !== free!.frame.size)!;
    expect(bedQuote(sim, 'us-ny-newyork', free!.frame.id, other.id)).toMatch(/doesn’t fit a .* frame\.$/);
  });

  it('quotes each to the cent: a free delivery adds nothing, an unstated one IKEA’s again', () => {
    const sim = life('us-ny-newyork', 'mattress-exact');
    const combos = bedsIn('us-ny-newyork');
    const free = combos.find((b) => 'brand' in b.mattress && deliveryOf(b.mattress) === 0)!;
    const unstated = combos.find((b) => 'brand' in b.mattress && deliveryOf(b.mattress) === null)!;
    expect(unstated).toBeDefined();
    for (const b of [free, unstated]) expect((bedQuote(sim, 'us-ny-newyork', b.frame.id, b.mattress.id) as { amount: number }).amount).toBe(expected(sim, b.frame, b.mattress));
  });

  it('makes a bed of a size only makers sell here able to take a new mattress', () => {
    const sim = life('us-ny-newyork', 'mattress-king');
    const king = bedsIn('us-ny-newyork').find((b) => b.frame.id === 'us-tarva-king')!;
    sim.must({ kind: 'home.furnish', payload: { piece: 'bed', frameId: king.frame.id, mattressId: king.mattress.id } });
    expect(mattressRefusal(sim.player, 'us-ny-newyork')).toBeUndefined();
  });
});
