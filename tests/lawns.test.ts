/**
 * A home's lawn (`systems/lawns.ts`, from 2026-10-02): a centimeter a week in
 * the town's growing season, a gardener by the visit, mown by hand at home,
 * and New Haven's foot and Toronto's 20 cm enforced by a notice and then the
 * city's cut.
 */
import { describe, expect, it } from 'vitest';
import { mowerCatalog } from '@/engine/systems/mowers';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, type Instant } from '@/engine/core/time';
import type { OwnedHome } from '@/engine/systems/homes';
import { INCH_L_PER_M2, LAWNS, MOWN_CM, NOTICE_DAYS, WAKE_DAYS, gardenerPrice, growing, inchOf, lawnDay, lawnOf, parched, waterRefusal, wetLawn } from '@/engine/systems/lawns';
import { weatherOn } from '@/engine/systems/weather';
import { litersUsed } from '@/engine/systems/water';
import { CITIES } from '@/engine/content/geography';
import { lookAfterRefusal } from '@/engine/systems/life';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const yard = (cityId: string, extra: Partial<OwnedHome> = {}): OwnedHome => ({ id: 'h1', cityId, facts: { features: ['yard'], address: '1 Elm Street' }, tenancies: [], ...extra }) as unknown as OwnedHome;
const on = (_town: string, zone: string, m: number, d: number) => instantFromZoned({ year: 2027, month: m, day: d, hour: 1, minute: 0 }, zone);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('growing', () => {
  it('in the town’s season, a centimeter a week; not outside it; in Dublin all year', () => {
    expect(growing('us-ny-newyork', on('ny', 'America/New_York', 1, 15))).toBe(false);
    expect(growing('us-ny-newyork', on('ny', 'America/New_York', 6, 15))).toBe(true);
    expect(growing('us-ny-newyork', on('ny', 'America/New_York', 11, 14))).toBe(true);
    expect(growing('us-ny-newyork', on('ny', 'America/New_York', 11, 15))).toBe(false);
    expect(growing('ie-lei-dublin', on('d', 'Europe/Dublin', 1, 15))).toBe(true);
    const sim = life('us-ny-newyork', 'lawn-grow');
    const h = yard('us-ny-newyork');
    for (let d = 0; d < 7; d += 1) lawnDay(sim, sim.player, h, on('ny', 'America/New_York', 6, 1 + d));
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 1, 9);
    for (let d = 0; d < 7; d += 1) lawnDay(sim, sim.player, h, on('ny', 'America/New_York', 1, 1 + d));
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 1, 9);
  });

  it('none for a home without a yard, or let to a tenant', () => {
    expect(lawnOf(yard('us-ny-newyork', { facts: { features: [], address: 'x' } } as never))).toBeUndefined();
    expect(lawnOf(yard('us-ny-newyork', { tenancies: [{ unit: 'main', status: 'let' }] } as never))).toBeUndefined();
  });
});

describe('the gardener and the city', () => {
  it('a gardener cuts it each week in the season, at LawnGuru’s weekly price', () => {
    const sim = life('us-ct-newhaven', 'lawn-gardener');
    const h = yard('us-ct-newhaven');
    lawnOf(h)!.gardener = true;
    const before = bank(sim);
    for (let d = 0; d < 14; d += 1) lawnDay(sim, sim.player, h, on('nh', 'America/New_York', 6, 1 + d) );
    expect(gardenerPrice(sim, 'us-ct-newhaven')).toBe(Math.round(52.75 * 0.8 * 100));
    expect(before - bank(sim)).toBe(2 * gardenerPrice(sim, 'us-ct-newhaven'));
    expect(h.lawn!.cm).toBeLessThan(MOWN_CM + 1);
  });

  it('Trim Gym mows May to October in Toronto, though the grass grows from late April', () => {
    const sim = life('ca-on-toronto', 'lawn-to');
    const h = yard('ca-on-toronto');
    lawnOf(h)!.gardener = true;
    const before = bank(sim);
    for (let d = 0; d < 7; d += 1) lawnDay(sim, sim.player, h, on('to', 'America/Toronto', 4, 22 + d));
    expect(bank(sim)).toBe(before);
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 1, 9);
    lawnDay(sim, sim.player, h, on('to', 'America/Toronto', 5, 1));
    expect(before - bank(sim)).toBe(gardenerPrice(sim, 'ca-on-toronto'));
  });

  it('over New Haven’s foot, a notice; ten days on, the city cuts it at the owner’s cost', () => {
    const sim = life('us-ct-newhaven', 'lawn-city');
    const h = yard('us-ct-newhaven');
    lawnOf(h)!.cm = 31;
    const t = on('nh', 'America/New_York', 6, 1);
    lawnDay(sim, sim.player, h, t);
    expect(h.lawn!.noticeAt).toBe(t);
    expect(sim.universe.notifications.some((n) => n.title === 'A Notice About The Lawn')).toBe(true);
    const before = bank(sim);
    lawnDay(sim, sim.player, h, t + (NOTICE_DAYS - 1) * MS_DAY);
    expect(h.lawn!.noticeAt).toBe(t);
    lawnDay(sim, sim.player, h, t + NOTICE_DAYS * MS_DAY);
    expect(before - bank(sim)).toBe(Math.round(LAWNS['us-ct-newhaven']!.oneOff! * 100));
    expect(h.lawn!.cm).toBe(MOWN_CM);
    expect(h.lawn!.noticeAt).toBeUndefined();
    // New York sets no height.
    const ny = yard('us-ny-newyork');
    lawnOf(ny)!.cm = 60;
    lawnDay(sim, sim.player, ny, t);
    expect(ny.lawn!.noticeAt).toBeUndefined();
  });

  it('mown by hand only at a home of yours with a lawn, with a mower to push, and not when it’s cut', () => {
    const sim = life('us-ct-newhaven', 'lawn-mow');
    expect(lookAfterRefusal(sim, 'mow')).toBe('There’s no lawn of yours here.');
    const h = yard('us-ct-newhaven');
    sim.player.homes = [h];
    sim.player.home = { kind: 'owned', cityId: 'us-ct-newhaven', homeId: 'h1' } as never;
    expect(lookAfterRefusal(sim, 'mow')).toBe('It’s cut.');
    lawnOf(h)!.cm = 12;
    // A mower to push (`systems/mowers.ts`, from 2026-10-05).
    expect(lookAfterRefusal(sim, 'mow')).toBe('You have no mower to push; one is sold on Homes.');
    const pushed = mowerCatalog(sim, sim.player).find((r) => r.product.attrs.kind !== 'robot')!;
    sim.must({ kind: 'garden.buy_mower', payload: { offerId: pushed.offer.id } });
    expect(lookAfterRefusal(sim, 'mow')).toBeUndefined();
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'mow' } });
    expect(r.ok, r.error).toBe(true);
    expect(h.lawn!.cm).toBe(MOWN_CM);
  });
});

describe('water (from 2026-10-06)', () => {
  const LA = 'America/Los_Angeles';
  const lot = (extra: string[] = []) => yard('us-ca-losangeles', { facts: { features: ['yard', ...extra], address: '1 Elm Street', lot: 6_000, size: 1_500 } } as never);
  /** The first of n days in a row without rain in Los Angeles's growing season, so a test can be dry on purpose. */
  const dryRun = (sim: Simulation, n: number): Instant => {
    for (let start = 0; start < 120; start += 1) {
      const first = on('la', LA, 5, 1) + start * MS_DAY;
      if (Array.from({ length: n }, (_, d) => weatherOn(sim, CITIES.require('us-ca-losangeles'), first + d * MS_DAY).precipitation === 'none').every(Boolean)) return first;
    }
    throw new Error('no dry run found');
  };
  const live = (sim: Simulation, h: OwnedHome) => { sim.player.homes = [h]; sim.player.home = { kind: 'owned', cityId: 'us-ca-losangeles', homeId: 'h1' } as never; sim.player.currentLocationId = 'us-ca-losangeles'; };

  it('a week without rain or a watering and it stops growing; watered, it grows again only after ten days', () => {
    const sim = life('us-ca-losangeles', 'lawn-dry');
    const h = lot();
    const t0 = dryRun(sim, 24);
    for (let d = 0; d <= 10; d += 1) lawnDay(sim, sim.player, h, t0 + d * MS_DAY);
    // Seven days grew (the first among them), then it was a week dry.
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 1, 9);
    expect(parched(h.lawn!, t0 + 10 * MS_DAY)).toBe(true);
    // Watered on day 10 and again on day 16: no growth until day 20.
    wetLawn(h.lawn!, t0 + 10 * MS_DAY + 1);
    for (let d = 11; d <= 19; d += 1) { if (d === 16) wetLawn(h.lawn!, t0 + d * MS_DAY - 1); lawnDay(sim, sim.player, h, t0 + d * MS_DAY); }
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 1, 9);
    expect(h.lawn!.wakesAt).toBe(t0 + 10 * MS_DAY + 1 + WAKE_DAYS * MS_DAY);
    lawnDay(sim, sim.player, h, t0 + 21 * MS_DAY);
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 1 + 1 / 7, 9);
  });

  it('Water The Lawn pours an inch over the lawn onto the month’s water, at the home lived in', () => {
    const sim = life('us-ca-losangeles', 'lawn-water');
    expect(waterRefusal(sim.player)).toBe('There’s no lawn of yours here.');
    const h = lot();
    live(sim, h);
    const before = litersUsed(sim.player, 'us-ca-losangeles', 7);
    const r = sim.execute({ kind: 'home.water_lawn', payload: {} });
    expect(r.ok, r.error).toBe(true);
    const inch = (6_000 - 1_500) * 0.09290304 * INCH_L_PER_M2;
    expect(inchOf(h)).toBeCloseTo(inch, 6);
    expect(litersUsed(sim.player, 'us-ca-losangeles', 7) - before).toBeCloseTo(inch, 6);
    expect(h.lawn!.wetAt).toBe(sim.now);
    // No lot kept, no size to pour over.
    h.facts.lot = undefined;
    expect(waterRefusal(sim.player)).toBe('SLATE doesn’t know how big the lawn is.');
  });

  it('sprinklers give the week’s inch on the day it would go dry, and it keeps growing', () => {
    const sim = life('us-ca-losangeles', 'lawn-sprinklers');
    const h = lot(['irrigation']);
    live(sim, h);
    const t0 = dryRun(sim, 15);
    for (let d = 0; d < 14; d += 1) lawnDay(sim, sim.player, h, t0 + d * MS_DAY);
    expect(h.lawn!.cm).toBeCloseTo(MOWN_CM + 2, 9);
    expect(sim.player.living!.lawnL).toBeCloseTo(inchOf(h)!, 6);
    // Without them, the same fortnight grows a week's worth.
    const bare = lot();
    for (let d = 0; d < 14; d += 1) lawnDay(sim, sim.player, bare, t0 + d * MS_DAY);
    expect(bare.lawn!.cm).toBeCloseTo(MOWN_CM + 1, 9);
  });
});
