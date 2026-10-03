/**
 * A home improvement contract (`systems/homes.ts`, from 2026-10-03): one of
 * three bids chosen, California's capped deposit and the balance at
 * completion, and canceled within each place's cooling-off period.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { PROJECTS } from '@/engine/content/homes';
import { coolingOffUntil, inspectionFee, ownBuilt, projectBids, worksDeposit, type HomeFacts } from '@/engine/systems/homes';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const house = (sim: Simulation, cityId: string) => {
  const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_200, built: 2000, features: [], parts: { paint: 2010 }, hoaUsd: 0 };
  return ownBuilt(sim, sim.player, { cityId, facts, price: 600_000_00, closing: 0 });
};
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const paint = PROJECTS.find((p) => p.id === 'paint')!;

describe('an inspection', () => {
  it('is the town’s own fee, a flat’s or a house’s', () => {
    const sim = life('ie-lei-dublin', 'insp-dub');
    expect(inspectionFee(sim, 'ie-lei-dublin', 'condo')).toBe(saveCurrency(sim.universe) === 'EUR' ? 599_00 : exchange(599_00, 'EUR', saveCurrency(sim.universe))!);
    expect(inspectionFee(sim, 'ie-lei-dublin', 'house')).toBe(saveCurrency(sim.universe) === 'EUR' ? 749_00 : exchange(749_00, 'EUR', saveCurrency(sim.universe))!);
  });
});

describe('a home improvement contract', () => {
  it('in California takes the lesser of $1,000 and 10% down, and the rest when it’s done', () => {
    const sim = life('us-ca-losangeles', 'works-la');
    const owned = house(sim, 'us-ca-losangeles');
    const bids = projectBids(sim, owned, paint);
    const thousand = saveCurrency(sim.universe) === 'USD' ? 1_000_00 : exchange(1_000_00, 'USD', saveCurrency(sim.universe))!;
    expect(worksDeposit('us-ca-losangeles', bids[2]!, sim)).toBe(Math.min(Math.round(bids[2]! * 0.1), thousand));
    expect(worksDeposit('uk-eng-london', 5_000_00, sim)).toBe(5_000_00);
    const before = bank(sim);
    const r = sim.must<{ doneAt: number; paid: number }>({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'paint', bid: 2 } });
    expect(r.paid).toBe(worksDeposit('us-ca-losangeles', bids[2]!, sim));
    expect(owned.works[0]!.cost).toBe(bids[2]);
    expect(before - bank(sim)).toBeGreaterThanOrEqual(r.paid);
    sim.advanceTo(r.doneAt + 30 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Repaint Inside, the balance'))).toBe(true);
  });

  it('is canceled for what was paid within the cooling-off period, and stands after', () => {
    const sim = life('us-ny-newyork', 'works-ny');
    const owned = house(sim, 'us-ny-newyork');
    const r = sim.must<{ paid: number }>({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'paint' } });
    const until = owned.works[0]!.coolUntil!;
    // Three business days: never fewer than three days on, and its end a midnight.
    expect(until - sim.now).toBeGreaterThanOrEqual(3 * MS_DAY);
    expect(zonedParts(until, 'America/New_York').hour).toBe(0);
    const before = bank(sim);
    expect(sim.must<{ refunded: number }>({ kind: 'home.cancel_works', payload: { homeId: owned.id, projectId: 'paint' } }).refunded).toBe(r.paid);
    expect(bank(sim) - before).toBe(r.paid);
    expect(owned.works).toHaveLength(0);
    sim.must({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'paint' } });
    sim.advanceTo(owned.works[0]!.coolUntil! + 60_000);
    expect(sim.execute({ kind: 'home.cancel_works', payload: { homeId: owned.id, projectId: 'paint' } }).error).toMatch(/^The cooling-off period ended .*, and the contract stands\.$/);
  });

  it('cools off by each place’s law', () => {
    const at = Date.UTC(2026, 9, 5, 15);
    expect(coolingOffUntil('uk-eng-london', at)! - at).toBe(14 * MS_DAY);
    expect(coolingOffUntil('ie-lei-dublin', at)! - at).toBe(30 * MS_DAY);
    expect(coolingOffUntil('ca-on-toronto', at)! - at).toBe(10 * MS_DAY);
    expect(coolingOffUntil('ca-bc-vancouver', at)).toBeUndefined();
    // America's three business days count a Saturday, not a Sunday or a federal holiday: a Friday's contract, Columbus Day on the Monday, runs to Wednesday's end.
    expect(zonedParts(coolingOffUntil('us-ny-newyork', Date.UTC(2026, 9, 9, 16))!, 'America/New_York').day).toBe(15);
    // Monday 5 October 2026 in Mexico City: five weekdays on, the next Monday's end.
    expect(zonedParts(coolingOffUntil('mx-cmx-mexicocity', at)!, 'America/Mexico_City').day).toBe(13);
  });
});
