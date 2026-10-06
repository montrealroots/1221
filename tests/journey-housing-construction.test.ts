/**
 * The housing and construction journey (the owner's audit of 2026-10-06, §5):
 * a lot in Queens found and offered on, closed, a house built on it with its
 * permits and fees, work stopped on a bill the bank couldn't pay and started
 * again when it was paid, finished, moved into, saved and loaded, then works
 * begun on the house and refused where they don't belong (a pool on a flat);
 * every law of the world holding at each turn. The money comes into the bank
 * by a posting, never by setting a balance.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { breaches } from '@/engine/core/invariants';
import { LAND_DEAL, LAND_MARKETS } from '@/engine/content/land';
import { homeOf } from '@/engine/systems/earnings';
import { listingsFor, parcelsOf } from '@/engine/systems/land';
import { buildQuote, type BuildQuote } from '@/engine/systems/construction';
import { homesOf } from '@/engine/systems/homes';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** Money in, as a gift posted against the opening balances, so the ledger still sums. */
const gift = (sim: Simulation, cents: number) => sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -cents }] });
/** All their spendable money out, as a posting, to leave a bill unpaid. */
const spendAll = (sim: Simulation) => {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.balance <= 0 || a.kind === 'escrow') continue;
    sim.post({ memo: 'Moved to a relative', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
  }
};
const lawful = (sim: Simulation) => expect(breaches(sim.universe)).toEqual([]);

describe('a house built on land bought for it', () => {
  it('finds a lot, buys it, builds through a stopped bill, moves in, and does works only where they belong', () => {
    let sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-build');

    // Found and bought: the Queens lot listed, offered on at its asking, closed.
    const l = listingsFor(sim, sim.player, homeOf(sim.player)).find((x) => LAND_MARKETS[x.market]!.label === 'A Lot In Queens')!;
    expect(l).toBeDefined();
    gift(sim, inSave(sim, 2 * l.asking, 'USD'));
    const offer = sim.execute<{ answer: string }>({ kind: 'land.offer', payload: { listingId: l.id, price: l.asking } });
    expect(offer.ok, offer.error).toBe(true);
    expect(offer.value!.answer).toBe('accepted');
    sim.advanceBy((LAND_DEAL.closingDays + 1) * MS_DAY);
    const parcel = parcelsOf(sim.player).find((p) => p.listingId === l.id)!;
    expect(parcel).toBeDefined();
    lawful(sim);

    // Built on: its permits and fees at the start.
    const q = buildQuote(parcel, 'ne-owner', true) as BuildQuote;
    gift(sim, inSave(sim, q.feesTotal, 'USD'));
    const started = sim.execute<{ fees: number; finishesBy: number }>({ kind: 'build.start', payload: { parcelId: parcel.id, designId: 'ne-owner' } });
    expect(started.ok, started.error).toBe(true);
    expect(started.value!.fees).toBe(inSave(sim, q.feesTotal, 'USD'));
    // A second start on the same lot is refused while it's being built.
    expect(sim.execute({ kind: 'build.start', payload: { parcelId: parcel.id, designId: 'ne-owner' } }).ok).toBe(false);

    // Interrupted: the money gone, the first stage's bill unpaid, the work stopped, and nothing moving while it is.
    sim.advanceBy((q.permitDays + 1) * MS_DAY);
    spendAll(sim);
    for (let d = 0; d < 120 && sim.player.building!.stoppedAt === undefined; d += 1) sim.advanceBy(MS_DAY);
    expect(sim.player.building!.stoppedAt).toBeDefined();
    const stage = sim.player.building!.stage;
    sim.advanceBy(30 * MS_DAY);
    expect(sim.player.building!.stage).toBe(stage);
    lawful(sim);

    // Paid, it starts again, and is finished: the contract and enough over it for the months of living and the reinspections.
    gift(sim, inSave(sim, 2 * q.contract, 'USD'));
    const paid = sim.execute<{ paid: number }>({ kind: 'build.pay', payload: {} });
    expect(paid.ok, paid.error).toBe(true);
    // Paid once: a second Pay The Contractor has nothing to pay.
    expect(sim.execute({ kind: 'build.pay', payload: {} }).ok).toBe(false);
    for (let d = 0; d < 720 && sim.player.building; d += 1) sim.advanceBy(MS_DAY);
    expect(sim.player.building).toBeUndefined();
    const house = homesOf(sim.player).find((h) => h.facts.address === 'Your House In Queens')!;
    expect(house).toBeDefined();
    expect(parcel.builtOn).toBe(house.id);
    lawful(sim);

    // Moved in, saved and loaded: it's still theirs, and they still live there.
    const moved = sim.execute({ kind: 'home.move_in', payload: { homeId: house.id } });
    expect(moved.ok, moved.error).toBe(true);
    sim = loadSave(deserialise(serialise(sim.universe)));
    const again = homesOf(sim.player).find((h) => h.id === house.id)!;
    expect(again).toBeDefined();
    expect(sim.player.home?.kind).toBe('owned');
    expect(sim.player.home && 'homeId' in sim.player.home ? sim.player.home.homeId : undefined).toBe(house.id);

    // A pool belongs to a house with a yard: refused here unless this house has one, and never on a flat.
    const pool = sim.execute({ kind: 'home.renovate', payload: { homeId: house.id, projectId: 'pool' } });
    if (!again.facts.features.includes('yard')) expect(pool.ok).toBe(false);
    lawful(sim);
  }, 180_000);

  it('refuses a pool on a flat, however much money there is', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-pool-flat');
    // A flat of their own, bought outright.
    gift(sim, 5_000_000_00);
    const flat = { id: 'flat1', cityId: 'us-ny-newyork', facts: { type: 'apartment', address: 'A Flat In Manhattan', beds: 2, baths: 1, size: 900, built: 1990, features: [], parts: {}, hoaUsd: 900, fixtures: { bathtub: true, dishwasher: true, laundry: 'building', cooling: 'units', outdoor: 'none', gym: 'none' } } };
    const owned = (sim.player.homes ??= []);
    owned.push({ ...flat, price: 1_000_000_00, closing: 0, boughtAt: sim.now, works: [], tenancies: [] } as never);
    const r = sim.execute({ kind: 'home.renovate', payload: { homeId: 'flat1', projectId: 'pool' } });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});
