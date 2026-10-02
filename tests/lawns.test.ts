/**
 * A home's lawn (`systems/lawns.ts`, from 2026-10-02): a centimeter a week in
 * the town's growing season, a gardener by the visit, mown by hand at home,
 * and New Haven's foot and Toronto's 20 cm enforced by a notice and then the
 * city's cut.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import type { OwnedHome } from '@/engine/systems/homes';
import { LAWNS, MOWN_CM, NOTICE_DAYS, gardenerPrice, growing, lawnDay, lawnOf } from '@/engine/systems/lawns';
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

  it('mown by hand only at a home of yours with a lawn, and not when it’s cut', () => {
    const sim = life('us-ct-newhaven', 'lawn-mow');
    expect(lookAfterRefusal(sim, 'mow')).toBe('There’s no lawn of yours here.');
    const h = yard('us-ct-newhaven');
    sim.player.homes = [h];
    sim.player.home = { kind: 'owned', cityId: 'us-ct-newhaven', homeId: 'h1' } as never;
    expect(lookAfterRefusal(sim, 'mow')).toBe('It’s cut.');
    lawnOf(h)!.cm = 12;
    expect(lookAfterRefusal(sim, 'mow')).toBeUndefined();
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'mow' } });
    expect(r.ok, r.error).toBe(true);
    expect(h.lawn!.cm).toBe(MOWN_CM);
  });
});
