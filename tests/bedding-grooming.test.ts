/**
 * Bedding on the bed (`systems/bedding.ts`) and grooming at home
 * (`systems/homegrooming.ts`), from 2026-10-06: a duvet set bought at IKEA's
 * price for the bed's size, a night on it each sleep at home, due its wash at
 * the Sleep Foundation's seven and washed with the next load; clippers bought
 * where a kit was priced, a haircut at home that counts as one, and nails due
 * by their published growth.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { BEDDING_NIGHTS } from '@/engine/content/bedding';
import { NAILS } from '@/engine/content/homegrooming';
import { beddingDue, beddingNight, beddingOf, beddingOffers, onTheBed } from '@/engine/systems/bedding';
import { doLaundry } from '@/engine/systems/dwelling';
import { bedAtHome } from '@/engine/systems/furniture';
import { hasClippers, nailsDue } from '@/engine/systems/homegrooming';
import { inSaveMoney } from '@/engine/systems/banking';
import { addItem, homeKeyOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** A bed of the size given put in the home, as a bed bought is. */
const withBed = (city: string, seed: string, country: string, size: string) => {
  const sim = life(city, seed);
  addItem(sim, sim.player, { kind: 'furniture:bed', label: 'A Bed', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' }, acquiredAt: sim.now, bed: { country, size } });
  return sim;
};

describe('bedding', () => {
  it('is bought for the bed’s size, slept on a night a day, due at seven, and washed with a load', () => {
    const sim = withBed('us-ny-newyork', 'bedding', 'us', 'queen');
    const bed = bedAtHome(sim.player)!;
    expect(bed).toBeDefined();
    const offer = beddingOffers(sim, sim.player)[0]!;
    expect(offer.set.sizes).toContain(bed.size);
    sim.must({ kind: 'home.buy_bedding', payload: { setId: offer.set.id } });
    expect(beddingOf(sim.player)).toHaveLength(1);
    const set = onTheBed(sim.player)!;
    // A nap the same day isn't another night.
    expect(beddingNight(sim.player, 'd0')).toBe(true);
    expect(beddingNight(sim.player, 'd0')).toBe(false);
    for (let d = 1; d < BEDDING_NIGHTS; d += 1) beddingNight(sim.player, `d${d}`);
    expect(set.bedding.dirty).toBe(true);
    expect(beddingDue(sim.player)).toBe(true);
    expect(onTheBed(sim.player)).toBeUndefined();
    expect(doLaundry(sim, sim.player, sim.now)).toBe(true);
    expect(set.bedding.dirty).toBeUndefined();
    expect(set.bedding.nights).toBe(0);
  });

  it('counts the nights a life sleeps at home', () => {
    const sim = withBed('us-ny-newyork', 'bedding-nights', 'us', 'queen');
    sim.must({ kind: 'home.buy_bedding', payload: { setId: beddingOffers(sim, sim.player)[0]!.set.id } });
    sim.advanceBy(3 * MS_DAY);
    expect(beddingOf(sim.player)[0]!.bedding.nights).toBeGreaterThan(0);
  });

  it('isn’t sold in Dublin, where no IKEA price was read', () => {
    const sim = withBed('ie-lei-dublin', 'bedding-ie', 'ie', 'double');
    expect(beddingOffers(sim, sim.player)).toEqual([]);
    expect(sim.execute({ kind: 'home.buy_bedding', payload: { setId: 'uk-solfibbla-single' } }).error).toMatch(/^SLATE has no published price here for a set to fit a .+ bed\.$/);
  });
});

describe('grooming at home', () => {
  it('cuts your hair with clippers bought at Walmart’s $19.99, a haircut as a barber’s counts', () => {
    const sim = life('us-ny-newyork', 'clippers');
    expect(sim.execute({ kind: 'hygiene.cut_hair', payload: {} }).error).toBe('You need clippers of your own.');
    expect(sim.must<{ paid: number }>({ kind: 'hygiene.buy_clippers', payload: {} }).paid).toBe(inSaveMoney(sim, 1_999, 'USD'));
    expect(hasClippers(sim.player)).toBe(true);
    sim.player.groomedAt = sim.now - 60 * MS_DAY;
    sim.player.wellbeing.morale = 50;
    sim.must({ kind: 'hygiene.cut_hair', payload: {} });
    expect(sim.player.groomedAt).toBe(sim.now);
    expect(sim.player.wellbeing.morale).toBeGreaterThan(50);
  });

  it('sells no clippers in Mexico City, where no kit was priced', () => {
    const sim = life('mx-cmx-mexicocity', 'clippers-mx');
    expect(sim.execute({ kind: 'hygiene.buy_clippers', payload: {} }).error).toBe('SLATE has no published price for a clipper kit here.');
  });

  it('has nails due by their growth to what a trim takes off', () => {
    const sim = life('us-ny-newyork', 'nails');
    const month = (365.2425 / 12) * MS_DAY;
    const r = sim.must<{ due: number }>({ kind: 'hygiene.trim_nails', payload: { which: 'fingers' } });
    expect(r.due).toBeCloseTo(sim.now + (NAILS.trimMm.fingers / 3.47) * month, -1);
    expect(nailsDue(sim.player, 'toes')).toBeCloseTo(sim.player.createdAt + (NAILS.trimMm.toes / 1.62) * month, -1);
  });
});
