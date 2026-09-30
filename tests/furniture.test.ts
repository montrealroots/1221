/**
 * Furniture of one's own (`systems/furniture.ts`, docs/WORLD.md stage 6c,
 * from 2026-09-29): IKEA's prices delivered and taxed, a home bought or built
 * empty, the floor a night's sleep without a bed, half the relief unwinding
 * without a sofa, and the pieces moving with their owner.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { applyLookingAfter, sleepQuality } from '@/engine/systems/life';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { onTheFloor, pieceCost, unwindComfort } from '@/engine/systems/furniture';

const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 };
/** A home of their own, built empty, lived in. */
function empty(sim: Simulation, city: string) {
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts: { ...facts }, price: 400_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  return owned;
}

describe('what a piece costs', () => {
  it('prices IKEA’s bed and sofa at their regular prices, delivered, with America’s sales tax on top and Britain’s VAT inside', () => {
    const ny = save('us-ny-newyork', 'furn-price');
    const rate = salesTaxRate('us-ny-newyork', ny.now, 'furniture');
    expect(rate).toBeGreaterThan(0);
    expect(pieceCost(ny, 'us-ny-newyork', 'bed')).toEqual({ amount: inSave(ny, (648 + 29) * 100 + Math.round(64_800 * rate), 'USD'), tax: inSave(ny, Math.round(64_800 * rate), 'USD') });
    expect(pieceCost(ny, 'uk-eng-london', 'sofa')!.amount).toBe(inSave(ny, 524_00, 'GBP'));
    expect(pieceCost(ny, 'uk-eng-london', 'sofa')!.tax).toBe(0);
    expect(pieceCost(ny, 'fr-idf-paris', 'bed')).toBeUndefined();
  });
});

describe('an empty home', () => {
  it('comes empty when bought or built, and a home owned before is furnished', () => {
    const sim = save('us-ny-newyork', 'furn-bare');
    const owned = empty(sim, 'us-ny-newyork');
    expect(owned.bare).toBe(true);
    expect(onTheFloor(sim.player)).toBe(true);
    delete owned.bare;
    expect(onTheFloor(sim.player)).toBe(false);
  });

  it('sleeps worse on the floor with no bed, by a sofa night’s 0.08, until a bed is bought', () => {
    const sim = save('us-ny-newyork', 'furn-sleep');
    const owned = empty(sim, 'us-ny-newyork');
    const floor = sleepQuality(sim, sim.player);
    delete owned.bare;
    const furnished = sleepQuality(sim, sim.player);
    owned.bare = true;
    expect(furnished - floor).toBeCloseTo(0.08, 6);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 10_000_00;
    const r = sim.execute<{ paid: number }>({ kind: 'home.furnish', payload: { piece: 'bed' } });
    expect(r.ok, r.error).toBe(true);
    expect(onTheFloor(sim.player)).toBe(false);
    expect(sleepQuality(sim, sim.player)).toBeCloseTo(furnished, 6);
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).error).toMatch(/You have one/);
  });

  it('takes half the stress off unwinding with no sofa, and all of it with one', () => {
    const sim = save('uk-eng-london', 'furn-sofa');
    empty(sim, 'uk-eng-london');
    expect(unwindComfort(sim.player)).toBe(0.5);
    const w = sim.player.wellbeing;
    w.stress = 60;
    applyLookingAfter(sim.player, 'unwind', sim.now, 1, unwindComfort(sim.player));
    const half = 60 - w.stress;
    w.stress = 60;
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 1_000_00, 'GBP');
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'sofa' } }).ok).toBe(true);
    applyLookingAfter(sim.player, 'unwind', sim.now, 1, unwindComfort(sim.player));
    expect(60 - w.stress).toBeCloseTo(half * 2, 6);
  });

  it('keeps a bed bought in one home for the next', () => {
    const sim = save('us-ny-newyork', 'furn-move');
    empty(sim, 'us-ny-newyork');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 10_000_00;
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).ok).toBe(true);
    empty(sim, 'us-ny-newyork');
    expect(onTheFloor(sim.player)).toBe(false);
  });
});
