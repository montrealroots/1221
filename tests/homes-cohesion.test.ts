/**
 * The homes and the rest of a life as one world: an empty home of theirs is
 * where a move, an eviction or a relocation goes before a rented room or a
 * sofa; rent paid ahead comes back on leaving; a former landlord's debt is
 * not the new one's to evict over; the place stands still while they're
 * away; and what's owed on a home is owed in net worth.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { arrearsOf, rentOf } from '@/engine/systems/household';
import { listingsIn, livingIn, type OwnedHome } from '@/engine/systems/homes';
import { livingOf } from '@/engine/systems/dwelling';
import { netWorth } from '@/engine/systems/finance';

function save(seed: string, city = 'us-ny-newyork'): Simulation {
  return quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'inherited' }, seed);
}

/** An empty home of theirs in a town, bought outright on the day. */
function ownEmpty(sim: Simulation, cityId: string): OwnedHome {
  const listing = listingsIn(sim, cityId).find((h) => h.type === 'condo')!;
  const owned: OwnedHome = {
    id: 'home-1', listingId: listing.id, cityId, facts: structuredClone({ ...listing }), boughtAt: sim.now, price: listing.value, closing: 0,
    investment: true, improvements: [], works: [], owed: [], billedThrough: '2099-01', occupied: [], tenancies: [], claims: [], depreciated: 0,
  };
  sim.player.homes = [owned];
  sim.player.homesOwned = 1;
  return owned;
}

describe('an empty home of theirs', () => {
  it('is where they go from a friend’s sofa after an eviction, the same day', () => {
    const sim = save('evict-own');
    const owned = ownEmpty(sim, 'us-ny-newyork');
    sim.player.home!.noticeUntil = sim.now;
    const arrears = Object.values(sim.universe.accounts).find((a) => a.category === 'deposit')!;
    // Two months owed, and the notice out.
    sim.post({ memo: 'owed', category: 'test', postings: [{ accountId: sim.nominalAccount('expense', 'Rent').id, amount: rentOf(sim, sim.player) * 3 }, { accountId: sim.openAccount({ id: 'arr', kind: 'loan', name: 'Rent And Bills Owed', ownerId: sim.player.id, openedAt: sim.now, category: 'arrears', apr: 0 }).id, amount: -rentOf(sim, sim.player) * 3 }] });
    expect(arrears).toBeDefined();
    const empty = () => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && a.balance > 0) sim.post({ memo: 'gone', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] }); };
    empty();
    sim.advanceBy(2 * MS_DAY);
    expect(sim.player.home?.kind).toBe('owned');
    expect(livingIn(sim.player)?.id).toBe(owned.id);
  });
});

describe('leaving a landlord', () => {
  it('brings back rent paid ahead', () => {
    const sim = save('ahead');
    const checking = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    sim.must({ kind: 'home.pay_landlord', payload: { amount: 50_000 } });
    expect(sim.player.payments?.rentCredit).toBe(50_000);
    const before = checking();
    sim.must({ kind: 'home.move', payload: { kind: sim.player.home?.kind === 'own' ? 'shared' : 'own' } });
    expect(sim.player.payments?.rentCredit ?? 0).toBe(0);
    // The move's own costs came out too; the credit came back against them.
    expect(checking()).toBeGreaterThan(before - 50_000 - 1_000_000);
    const back = Object.values(sim.universe.transactions).some((t) => t.memo === 'Rent paid ahead, back');
    expect(back).toBe(true);
  });

  it('leaves a former landlord’s debt out of the new landlord’s notice', () => {
    const sim = save('old-debt');
    const rent = rentOf(sim, sim.player);
    sim.post({ memo: 'owed', category: 'test', postings: [{ accountId: sim.nominalAccount('expense', 'Rent').id, amount: rent * 10 }, { accountId: sim.openAccount({ id: 'arr', kind: 'loan', name: 'Rent And Bills Owed', ownerId: sim.player.id, openedAt: sim.now, category: 'arrears', apr: 0 }).id, amount: -rent * 10 }] });
    sim.player.payments = { ...(sim.player.payments ?? {}), rent: 'manual' } as typeof sim.player.payments;
    sim.must({ kind: 'home.move', payload: { kind: sim.player.home?.kind === 'own' ? 'shared' : 'own' } });
    expect(arrearsOf(sim, sim.player)).toBeGreaterThan(0);
    sim.advanceBy(2 * MS_DAY);
    expect(sim.player.home?.noticeUntil).toBeUndefined();
  });
});

describe('away from home', () => {
  it('leaves the place as it was', () => {
    const sim = save('away');
    sim.player.living = { clean: 14, dirty: 0, drying: [], tidy: 80 };
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.advanceBy(3 * MS_DAY);
    expect(livingOf(sim.player).tidy).toBe(80);
  });
});

describe('net worth', () => {
  it('counts what’s owed on a home as owed', () => {
    const sim = save('owed-worth');
    const owned = ownEmpty(sim, 'us-ny-newyork');
    const before = netWorth(sim, sim.player.id).total;
    owned.owed.push({ kind: 'repair', dueAt: sim.now, amount: 5_000_00, what: 'A Floor Buckled' });
    expect(before - netWorth(sim, sim.player.id).total).toBe(5_000_00);
  });
});
