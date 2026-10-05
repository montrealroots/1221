/**
 * A lawn mower of one's own (`systems/mowers.ts`, `content/gardencatalog.ts`,
 * from 2026-10-05): sold where they live, needed to mow by hand, a corded
 * one's watts and a battery's charge on the electricity, and a robot rated
 * for the lawn keeping it through the season.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, startOfDay } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { GARDEN_PRODUCTS, handMower, lawnM2, mowKwh, mowerCatalog, mowerRefusal, robotFor } from '@/engine/systems/mowers';
import { MOWN_CM, lawnDay, lawnOf } from '@/engine/systems/lawns';
import { lookAfterRefusal } from '@/engine/systems/life';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const yard = (city: string, lot: number, size: number) => ({ id: 'h1', cityId: city, tenancies: [], facts: { features: ['yard'], address: '1 Elm St', lot, size } }) as never;
const owning = (city: string, seed: string, lot = 6_000, size = 1_800) => {
  const sim = life(city, seed);
  const h = yard(city, lot, size);
  sim.player.homes = [h];
  sim.player.home = { kind: 'owned', cityId: city, homeId: 'h1' } as never;
  return { sim, h: h as { lawn?: { cm: number } } & Parameters<typeof lawnOf>[0] };
};

describe('a lawn mower', () => {
  it('is sold where you live, cheapest first, from many makers', () => {
    expect(new Set(GARDEN_PRODUCTS.map((p) => p.brand)).size).toBeGreaterThanOrEqual(50);
    const { sim } = owning('us-ct-newhaven', 'mow-shop');
    const shop = mowerCatalog(sim, sim.player);
    expect(shop.length).toBeGreaterThan(0);
    expect(shop.every((r) => r.offer.market === 'us')).toBe(true);
    expect(shop.map((r) => r.price)).toEqual([...shop.map((r) => r.price)].sort((a, b) => a - b));
    const abroad = GARDEN_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(mowerRefusal(sim.player, abroad.id)).toBe('It’s sold in another country.');
  });

  it('is needed to mow by hand, and a corded one’s watts go on the electricity', () => {
    const { sim, h } = owning('us-ct-newhaven', 'mow-corded');
    lawnOf(h)!.cm = 12;
    expect(lookAfterRefusal(sim, 'mow')).toMatch(/no mower/);
    const corded = mowerCatalog(sim, sim.player).find((r) => r.product.attrs.kind === 'corded' && typeof r.product.attrs.watts === 'number')!;
    sim.must({ kind: 'garden.buy_mower', payload: { offerId: corded.offer.id } });
    expect(handMower(sim.player)!.product.id).toBe(corded.product.id);
    const was = sim.player.living?.extraKwh ?? 0;
    sim.must({ kind: 'life.look_after', payload: { action: 'mow' } });
    expect(h.lawn!.cm).toBe(MOWN_CM);
    expect(mowKwh(corded.product)).toBeCloseTo(Number(corded.product.attrs.watts) * 1.9 / 1000, 9);
    expect((sim.player.living?.extraKwh ?? 0) - was).toBeCloseTo(mowKwh(corded.product), 9);
  });

  it('draws a battery’s full charge, and a reel nothing', () => {
    const battery = GARDEN_PRODUCTS.find((p) => p.attrs.kind === 'battery' && typeof p.attrs.volts === 'number' && typeof p.attrs.ampHours === 'number')!;
    expect(mowKwh(battery)).toBeCloseTo(Number(battery.attrs.volts) * Number(battery.attrs.ampHours) / 1000, 9);
    expect(mowKwh(GARDEN_PRODUCTS.find((p) => p.attrs.kind === 'reel')!)).toBe(0);
  });

  it('as a robot keeps a lawn it’s rated for through the season, and not a bigger one', () => {
    const city = 'us-ny-newyork';
    const robot = mowerCatalog(life(city, 'x'), life(city, 'y').player).find((r) => r.product.attrs.kind === 'robot');
    expect(robot).toBeDefined();
    const any = robot!;
    const rated = Number(any.product.attrs.robotM2);
    // A lawn just inside its rating, in square feet: the lot less the house.
    const fits = owning(city, 'mow-robot', 1_000 + Math.floor(rated / 0.09290304) - 10, 1_000);
    expect(lawnM2(fits.h)!).toBeLessThanOrEqual(rated);
    fits.sim.must({ kind: 'garden.buy_mower', payload: { offerId: any.offer.id } });
    expect(robotFor(fits.sim.player, fits.h)?.id).toBe(any.product.id);
    const june = startOfDay(Date.UTC(2027, 5, 15, 12), CITIES.require(city).timeZone);
    lawnOf(fits.h)!.cm = 9;
    lawnDay(fits.sim, fits.sim.player, fits.h, june);
    expect(fits.h.lawn!.cm).toBe(MOWN_CM);
    // A robot doesn't push: mowing by hand still wants a mower.
    expect(handMower(fits.sim.player)).toBeUndefined();
    // Too big a lawn for it: it grows.
    const big = owning(city, 'mow-robot-big', 1_000 + Math.ceil(rated / 0.09290304) + 5_000, 1_000);
    big.sim.must({ kind: 'garden.buy_mower', payload: { offerId: any.offer.id } });
    expect(robotFor(big.sim.player, big.h)).toBeUndefined();
    lawnOf(big.h)!.cm = 9;
    lawnDay(big.sim, big.sim.player, big.h, june + MS_DAY);
    expect(big.h.lawn!.cm).toBeGreaterThan(9);
  });
});
