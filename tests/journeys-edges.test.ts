/**
 * Journeys at their edges (the owner's expansion of 2026-10-03, §8; from
 * 2026-10-05): a business found closed on the way, a journey made with too
 * little money, and a change of town with the shopping still waiting. Each
 * is saved and loaded midway, and checked that nothing is lost, charged twice
 * or held twice.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { runErrands, waitingShopping } from '@/engine/systems/trips';
import { itemsOf } from '@/engine/systems/items';

const NY = 'us-ny-newyork';
const life = (seed: string) => quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const memos = (sim: Simulation, re: RegExp) => Object.values(sim.universe.transactions).filter((t) => re.test(t.memo)).length;
const at = (sim: Simulation, d: number, hour: number) => { const p = zonedParts(sim.now + d * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour }, sim.zone); };
const POTATOES = 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag';
const groceries = (n = 1) => Array.from({ length: n }, () => ({ kind: 'food.buy_groceries', payload: { productId: POTATOES, quantity: 1 }, leg: 'shopping' as const }));
const bags = (sim: Simulation) => itemsOf(sim.player).filter((i) => i.kind === POTATOES || i.label.includes('Russet')).length;

describe('a business found closed on the way', () => {
  it('stops the errands there, brings you home with nothing bought, and goes the next day; saved and loaded between', () => {
    let sim = life('je-closed');
    sim.advanceTo(at(sim, 1, 3));
    const before = bags(sim);
    const run = runErrands(sim, { by: 'foot', stops: groceries() });
    expect(run.done).toBe(0);
    expect(run.stopped!.error).toMatch(/closed|open/i);
    expect(sim.player.trip).toBeUndefined();
    expect(bags(sim)).toBe(before);
    sim = reload(sim);
    expect(sim.player.trip).toBeUndefined();
    sim.advanceTo(at(sim, 0, 11));
    expect(runErrands(sim, { by: 'foot', stops: groceries() })).toEqual({ done: 1 });
    expect(waitingShopping(sim.player).length + bags(sim) - before).toBeGreaterThan(0);
    expect(memos(sim, /Fresh Grocer/)).toBe(1);
  });
});

describe('a journey with too little money', () => {
  it('is refused at the till, nothing taken and nothing owed, and goes once the money’s there; saved and loaded between', () => {
    let sim = life('je-broke');
    sim.advanceTo(at(sim, 1, 11));
    const accounts = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
    const kept = new Map(accounts.map((a) => [a.id, a.balance]));
    // The bank emptied and the card at its limit.
    for (const a of accounts) a.balance = a.creditLimit ? -a.creditLimit : 0;
    const before = bags(sim);
    const tx = Object.keys(sim.universe.transactions).length;
    const run = runErrands(sim, { by: 'foot', stops: groceries() }, (kind, payload) => sim.execute({ kind, payload: kind === 'food.buy_groceries' ? { ...payload, payWith: 'debit' } : payload }));
    expect(run.done).toBe(0);
    expect(run.stopped!.error).toBeTruthy();
    expect(bags(sim) + waitingShopping(sim.player).length).toBe(before);
    expect(memos(sim, /Fresh Grocer/)).toBe(0);
    sim = reload(sim);
    expect(Object.keys(sim.universe.transactions).length).toBeGreaterThanOrEqual(tx);
    for (const a of Object.values(sim.universe.accounts)) if (kept.has(a.id)) a.balance = kept.get(a.id)!;
    expect(runErrands(sim, { by: 'foot', stops: groceries() }).done).toBe(1);
    expect(memos(sim, /Fresh Grocer/)).toBe(1);
  });
});

describe('a change of town with the shopping waiting', () => {
  it('keeps it waiting away, put away only at home, after a save and load abroad', () => {
    let sim = life('je-away');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const car = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).vehicleId;
    sim.advanceTo(at(sim, 2, 11));
    expect(runErrands(sim, { by: 'car', vehicleId: car, stops: groceries() })).toEqual({ done: 1 });
    const waiting = waitingShopping(sim.player).map((i) => i.id);
    expect(waiting.length).toBeGreaterThan(0);
    // Off to Los Angeles with it still in the car.
    const day = sim.now + 3 * MS_DAY;
    const trip = sim.must<{ arriveAt: number }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, bags: 0, nights: 2, returnDay: day + 2 * MS_DAY } });
    // Past any delay the flight meets on the way.
    sim.advanceTo(trip.arriveAt + 8 * MS_HOUR);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
    sim = reload(sim);
    expect(waitingShopping(sim.player).map((i) => i.id)).toEqual(waiting);
    expect(sim.execute({ kind: 'items.put_away', payload: {} }).ok).toBe(false);
    // Home again, it goes away once, and isn't bought twice.
    sim.advanceBy(4 * MS_DAY);
    expect(sim.player.currentLocationId).toBe(NY);
    const put = sim.execute({ kind: 'items.put_away', payload: {} });
    expect(put.ok, put.error).toBe(true);
    expect(waitingShopping(sim.player)).toHaveLength(0);
    expect(memos(sim, /Fresh Grocer/)).toBe(1);
  });
});
