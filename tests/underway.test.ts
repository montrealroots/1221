/**
 * Everything under way, in one list (`systems/underway.ts`, from 2026-10-02):
 * an order, a car on order, an appointment and a journey, soonest first, and
 * each gone once it's done.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { optionsFor } from '@/engine/systems/caroptions';
import { book } from '@/engine/systems/appointments';
import { underWay } from '@/engine/systems/underway';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { sizeFor } from '@/engine/systems/tailoring';

describe('under way', () => {
  it('lists an order, a car on order and an appointment, soonest first, and drops each when it’s done', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'underway');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'online', size: sizeFor(sim, sim.player, tee.sizes), color: tee.colors[0] } });
    const pack = optionsFor('us-ford-f-series').find((o) => o.category === 'package' && o.price > 0)!;
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-ford-f-series', options: [pack.key] } });
    book(sim, sim.player, 'A doctor’s visit');
    const list = underWay(sim, sim.player);
    expect(list.map((u) => u.kind).sort()).toEqual(['appointment', 'car', 'order']);
    expect(list.map((u) => u.until)).toEqual([...list.map((u) => u.until)].sort((a, b) => a - b));
    for (let i = 0; i < 400 && underWay(sim, sim.player).some((u) => u.kind === 'order'); i += 1) sim.advanceTo(sim.now + 6 * 3_600_000);
    expect(underWay(sim, sim.player).some((u) => u.kind === 'order')).toBe(false);
    expect(underWay(sim, sim.player).some((u) => u.kind === 'car')).toBe(true);
  });
});
