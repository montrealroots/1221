/**
 * A lodger in a spare bedroom (`systems/lodgers.ts`, docs/WORLD.md stage 6d,
 * from 2026-09-30): each town's room rent paid monthly, at most two and no
 * more than the spare bedrooms, America's rent on the return, Britain's
 * £7,500 and Ireland's €14,000 free of tax, and a lodger leaving with the
 * owner.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { yearOf } from '@/engine/systems/earnings';
import { lodgerRefusal, lodgersIn, roomRent } from '@/engine/systems/lodgers';
import { zonedParts } from '@/engine/core/time';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const facts = (beds: number): HomeFacts => ({ type: 'house', address: 'Test House', beds, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 });
/** A home of their own, lived in. */
function home(city: string, name: string, beds = 3) {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts: facts(beds), price: 500_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  return { sim, owned };
}
const paid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('A lodger’s rent'));
const tax = (sim: Simulation) => paid(sim).reduce((a, t) => a + (t.postings.find((x) => x.accountId === sim.nominalAccount('expense', 'Tax On A Lodger’s Rent').id)?.amount ?? 0), 0);

describe('a lodger', () => {
  it('pays New York’s room rent of $1,515 on moving in and each month, recorded as rent on the return', () => {
    const { sim, owned } = home('us-ny-newyork', 'lodger-ny');
    expect(roomRent(sim, 'us-ny-newyork')).toBe(inSave(sim, 1_515_00, 'USD'));
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    sim.advanceBy(65 * MS_DAY);
    expect(paid(sim)).toHaveLength(3);
    expect(tax(sim)).toBe(0);
    const year = zonedParts(sim.now, sim.zone).year;
    const recorded = (yearOf(sim.player, year).rentalRent ?? 0) + (yearOf(sim.player, year - 1).rentalRent ?? 0);
    expect(recorded).toBe(3 * inSave(sim, 1_515_00, 'USD'));
  });

  it('takes two at most, and no more than the spare bedrooms; none where the home is let or not lived in, or no rent is published', () => {
    const { sim, owned } = home('us-ny-newyork', 'lodger-cap', 5);
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    expect(lodgerRefusal(sim, sim.player, owned)).toMatch(/Two lodgers/);
    const two = home('us-ny-newyork', 'lodger-two', 2);
    expect(two.sim.execute({ kind: 'home.take_lodger', payload: { homeId: two.owned.id } }).ok).toBe(true);
    expect(lodgerRefusal(two.sim, two.sim.player, two.owned)).toMatch(/Every spare bedroom/);
    const one = home('us-ny-newyork', 'lodger-one', 1);
    expect(lodgerRefusal(one.sim, one.sim.player, one.owned)).toMatch(/no spare bedroom/);
    const nh = home('us-ct-newhaven', 'lodger-nh');
    expect(lodgerRefusal(nh.sim, nh.sim.player, nh.owned)).toMatch(/No room’s rent/);
    const away = home('us-ny-newyork', 'lodger-away');
    delete away.sim.player.home;
    expect(lodgerRefusal(away.sim, away.sim.player, away.owned)).toMatch(/you live in/);
  });

  it('leaves London’s first £7,500 of a year free of tax and taxes what’s past it', () => {
    const { sim, owned } = home('uk-eng-london', 'lodger-uk', 4);
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    sim.advanceBy(9 * 30 * MS_DAY);
    const free = inSave(sim, 7_500_00, 'GBP');
    const years = Object.values(sim.player.earnings!.years);
    for (const y of years) expect(y.lodgerTaxed ?? 0).toBe(Math.max(0, (y.lodgerRent ?? 0) - free));
    expect(years.some((y) => (y.lodgerTaxed ?? 0) > 0)).toBe(true);
    // What's past the scheme is income, and here it falls within the personal allowance: taxable, and no tax.
  });

  it('taxes all of Dublin’s year once it passes €14,000', () => {
    const { sim, owned } = home('ie-lei-dublin', 'lodger-ie', 4);
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    sim.advanceBy(9 * 30 * MS_DAY);
    const years = Object.values(sim.player.earnings!.years);
    for (const y of years) {
      const free = inSave(sim, 14_000_00, 'EUR');
      expect(y.lodgerTaxed ?? 0).toBe((y.lodgerRent ?? 0) > free ? y.lodgerRent : 0);
    }
    expect(years.some((y) => (y.lodgerTaxed ?? 0) > 0)).toBe(true);
    expect(tax(sim)).toBeGreaterThan(0);
  });

  it('goes when let go, and leaves with the owner', () => {
    const { sim, owned } = home('us-ny-newyork', 'lodger-go');
    expect(sim.execute({ kind: 'home.take_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'home.end_lodger', payload: { homeId: owned.id } }).ok).toBe(true);
    sim.advanceBy(65 * MS_DAY);
    expect(paid(sim)).toHaveLength(1);
    // Taken again the same month, one month's rent a month, not two.
    const again = home('us-ny-newyork', 'lodger-again');
    expect(again.sim.execute({ kind: 'home.take_lodger', payload: { homeId: again.owned.id } }).ok).toBe(true);
    expect(again.sim.execute({ kind: 'home.end_lodger', payload: { homeId: again.owned.id } }).ok).toBe(true);
    expect(again.sim.execute({ kind: 'home.take_lodger', payload: { homeId: again.owned.id } }).ok).toBe(true);
    again.sim.advanceBy(35 * MS_DAY);
    expect(paid(again.sim)).toHaveLength(3);
    const moved = home('us-ny-newyork', 'lodger-moved');
    expect(moved.sim.execute({ kind: 'home.take_lodger', payload: { homeId: moved.owned.id } }).ok).toBe(true);
    delete moved.sim.player.home;
    moved.sim.advanceBy(35 * MS_DAY);
    expect(lodgersIn(moved.owned)).toHaveLength(0);
    expect(paid(moved.sim)).toHaveLength(1);
  });
});
