/**
 * Tenure in England (`TENURE` in `systems/homes.ts`, from 2026-10-03): flats
 * mostly leasehold and houses mostly freehold, at MHCLG's shares, and a
 * leaseholder's ground rent and service charge in place of the estimated
 * charge.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { isFlat } from '@/engine/content/homes';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { TENURE, listingsIn, monthOf } from '@/engine/systems/homes';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('tenure', () => {
  it('holds most English flats leasehold and most houses freehold; elsewhere none is kept', () => {
    const sim = life('uk-eng-london', 'tenure-ldn');
    const homes = listingsIn(sim, 'uk-eng-london');
    const flats = homes.filter((h) => isFlat(h.type));
    const houses = homes.filter((h) => !isFlat(h.type));
    expect(homes.every((h) => h.tenure !== undefined)).toBe(true);
    expect(flats.filter((h) => h.tenure === 'leasehold').length / flats.length).toBeGreaterThan(0.7);
    expect(houses.filter((h) => h.tenure === 'leasehold').length / Math.max(1, houses.length)).toBeLessThan(0.3);
    expect(listingsIn(life('us-ny-newyork', 'tenure-ny'), 'us-ny-newyork').every((h) => h.tenure === undefined)).toBe(true);
  });

  it('charges a leaseholder its ground rent and service charge, none on a lease from 2022', () => {
    const sim = life('uk-eng-london', 'tenure-month');
    const flat = listingsIn(sim, 'uk-eng-london').find((h) => isFlat(h.type))!;
    const lease = { ...flat, tenure: 'leasehold' as const, groundRentGbp: TENURE.groundRent.flat, serviceChargeGbp: TENURE.serviceCharge.flat };
    const free = { ...flat, tenure: 'freehold' as const };
    const m = monthOf(sim, lease, 'uk-eng-london', flat.value);
    const cents = Math.round(((160 + 2_338) / 12) * 100);
    const cur = saveCurrency(sim.universe);
    expect(m.hoa).toBe(cur === 'GBP' ? cents : exchange(cents, 'GBP', cur));
    expect(monthOf(sim, free, 'uk-eng-london', flat.value).hoa).not.toBe(m.hoa);
    const newer = listingsIn(sim, 'uk-eng-london').filter((h) => h.tenure === 'leasehold' && h.built >= TENURE.peppercornFrom);
    expect(newer.every((h) => h.groundRentGbp === 0)).toBe(true);
  });
});
