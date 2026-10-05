/**
 * Repainting a home of one's own by hand (`systems/paint.ts`,
 * `content/paintcatalog.ts`, from 2026-10-05): paint bought by the can, Paint
 * A Room taking two coats of the next room's walls from it, and the home's
 * paint new once every room is done.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { COATS, COVERAGE_M2_L, CEILING_M, DOOR_M2, PAINT_PRODUCTS, litersFor, nextRoom, paintCatalog, paintRefusal, paintSessionRefusal, paintedRooms, wallsM2 } from '@/engine/systems/paint';
import { lookAfterRefusal } from '@/engine/systems/life';
import { livingIn } from '@/engine/systems/homes';

/** A life in a home they own, in New York. */
const owner = (seed: string) => {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const h = { id: 'h1', cityId: 'us-ny-newyork', tenancies: [], works: [], facts: { features: [], address: '1 Elm St', size: 1_200, beds: 2, baths: 1, type: 'house', parts: { paint: 2010 }, built: 1990 } } as never;
  sim.player.homes = [h];
  sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', homeId: 'h1' } as never;
  return sim;
};

describe('a repaint by hand', () => {
  it('takes two coats on a room’s walls: its square floor’s perimeter under a 2.4 m ceiling, less a door', () => {
    expect(wallsM2({ m2: 16 })).toBeCloseTo(16 * CEILING_M - DOOR_M2, 9);
    expect(litersFor({ m2: 16 })).toBeCloseTo((wallsM2({ m2: 16 }) * COATS) / COVERAGE_M2_L, 9);
    expect(COVERAGE_M2_L).toBeCloseTo((375 * 0.09290304) / 3.785411784, 9);
  });

  it('needs the paint for the next room, sold where they live, and is done a room a session', () => {
    const sim = owner('paint-rooms');
    expect(livingIn(sim.player)).toBeDefined();
    const rooms = paintedRooms(sim, sim.player);
    expect(rooms.length).toBeGreaterThan(0);
    expect(lookAfterRefusal(sim, 'paint')).toMatch(/liters for two coats/);
    const shop = paintCatalog(sim, sim.player);
    expect(shop.every((r) => r.offer.market === 'us')).toBe(true);
    expect(paintRefusal(sim.player, PAINT_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!.id)).toBe('It’s sold in another country.');
    // Enough cans for the whole home.
    const can = shop.find((r) => Number(r.product.attrs.liters) < litersFor(nextRoom(sim, sim.player)!))!;
    // One can short of the room: not begun.
    sim.must({ kind: 'home.buy_paint', payload: { offerId: can.offer.id } });
    expect(lookAfterRefusal(sim, 'paint')).toMatch(/liters for two coats/);
    const need = rooms.reduce((n, r) => n + litersFor(r, typeof can.product.attrs.coverage === 'number' ? can.product.attrs.coverage : COVERAGE_M2_L), 0);
    for (let got = 0; got < need; got += Number(can.product.attrs.liters)) sim.must({ kind: 'home.buy_paint', payload: { offerId: can.offer.id } });
    const home = livingIn(sim.player)!;
    expect(home.painting!.liters).toBeGreaterThanOrEqual(need);
    const first = nextRoom(sim, sim.player)!;
    const before = home.painting!.liters;
    sim.must({ kind: 'life.look_after', payload: { action: 'paint' } });
    expect(home.painting!.done).toContain(first.id);
    expect(before - home.painting!.liters).toBeCloseTo(litersFor(first, home.painting!.coverage), 9);
    expect(home.facts.parts.paint).toBe(2010);
    for (let n = 1; n < rooms.length; n += 1) {
      for (let h = 0; h < 48 && lookAfterRefusal(sim, 'paint'); h += 1) sim.universe.now += 3_600_000;
      sim.must({ kind: 'life.look_after', payload: { action: 'paint' } });
    }
    expect(home.facts.parts.paint).toBeGreaterThan(2010);
    expect(home.painting!.done).toEqual([]);
    // A new repaint starts over, with what was left over in hand.
    expect(paintSessionRefusal(sim, sim.player) ?? '').not.toBe('Every room is done.');
  });
});
