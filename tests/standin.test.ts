/**
 * A car to drive while yours is in the shop (`systems/standin.ts`, from
 * 2026-10-01): a dealer's loaner where one is published, a rental otherwise.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { crashBill, rentalsOf } from '@/engine/systems/rentals';
import { standInFor, standInQuote } from '@/engine/systems/standin';
import { tripRefusal } from '@/engine/systems/trips';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, usd: number) => { const c = Math.round(usd * 100); return saveCurrency(sim.universe) === 'USD' ? c : exchange(c, 'USD', saveCurrency(sim.universe))!; };

/** A Camry broken down and booked into a New York garage on a Tuesday morning. */
function inTheShop(seed: string, shopId: string) {
  const sim = life(seed);
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
  expect(r.ok, r.error).toBe(true);
  const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
  sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 13, hour: 10, minute: 0 }, 'America/New_York'));
  v.fault = { at: sim.now, severe: true, usd: 1_500 };
  const rep = sim.execute({ kind: 'vehicle.repair', payload: { vehicleId: v.id, shopId } });
  expect(rep.ok, rep.error).toBe(true);
  // A dealer books ahead: the car goes in at its appointment (from 2026-10-03).
  if (v.booked) sim.advanceTo(v.booked.at + 60_000);
  return { sim, v };
}

describe('a stand-in', () => {
  it('is the dealer’s loaner, free where it publishes one, until the car is ready, and drives the errands', () => {
    const { sim, v } = inTheShop('si-loaner', 'toyota-of-manhattan');
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toMatch(/Toyota of Manhattan until/);
    const q = standInQuote(sim, sim.player, v, sim.now);
    expect(q).toMatchObject({ loaner: 'toyota-of-manhattan', total: 0, deposit: 0 });
    const before = sim.universe.transactions.length;
    const r = sim.execute<{ loaner: boolean }>({ kind: 'vehicle.stand_in', payload: { vehicleId: v.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.loaner).toBe(true);
    expect(sim.universe.transactions.length).toBe(before);
    expect(standInFor(sim.player, v)?.returnAt).toBe(v.inShop!.until);
    expect(sim.execute({ kind: 'vehicle.stand_in', payload: { vehicleId: v.id } }).error).toBe('It has a stand-in already.');
    // Crashed, it's your own cover's, not a desk's excess.
    expect(crashBill(standInFor(sim.player, v)!).amount).toBe(0);
    // Errands go in it, at AAA's fuel, and the Camry gains nothing.
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toBeUndefined();
    const km = v.km ?? 0;
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: v.id } }).ok).toBe(true);
    expect(sim.player.trip?.standInId).toBe(standInFor(sim.player, v)!.id);
    expect(sim.player.trip!.fuel).toBeGreaterThan(0);
    expect(v.km ?? 0).toBe(km);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'home' } }).ok).toBe(true);
    // And goes back when the car is ready.
    sim.advanceTo(v.inShop!.until + 60_000);
    expect(rentalsOf(sim.player).find((x) => x.standIn)!.status).toBe('returned');
    expect(standInFor(sim.player, v)).toBeUndefined();
  });

  it('is charged at A-1 Toyota’s $34.95 a day', () => {
    const sim = life('si-a1');
    const v = { id: 'x', inShop: { shopId: 'a1-toyota', until: sim.now + 2.5 * MS_DAY } } as never;
    sim.player.currentLocationId = 'us-ct-newhaven';
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ct', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    expect(standInQuote(sim, sim.player, v, sim.now)).toMatchObject({ loaner: 'a1-toyota', days: 3, total: inSave(sim, 34.95 * 3) });
  });

  it('is a rental on the airport desk’s terms where the garage lends none, its deposit held to the end', () => {
    const { sim, v } = inTheShop('si-rental', 'midas-w53');
    const q = standInQuote(sim, sim.player, v, sim.now);
    if (typeof q === 'string') throw new Error(q);
    expect(q.loaner).toBeUndefined();
    expect(q.what).toMatch(/JFK/);
    expect(q.total).toBeGreaterThan(0);
    const cash = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'vehicle.stand_in', payload: { vehicleId: v.id } }).ok).toBe(true);
    const r = standInFor(sim.player, v)!;
    expect(r.paid).toBe(q.total);
    expect(crashBill(r).amount).toBeGreaterThan(0);
    expect(cash - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(q.total + q.deposit);
    sim.advanceTo(r.returnAt + 60_000);
    expect(q.deposit).toBeGreaterThan(0);
    expect(sim.universe.accounts[r.escrowAccountId!]!.balance).toBe(0);
  });

  it('isn’t had, nor paid for, when the bank covers the days but not the deposit', () => {
    const { sim, v } = inTheShop('si-deposit', 'midas-w53');
    const q = standInQuote(sim, sim.player, v, sim.now);
    if (typeof q === 'string') throw new Error(q);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') a.balance = 0;
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    checking.balance = q.total + q.deposit - 1;
    expect(sim.execute({ kind: 'vehicle.stand_in', payload: { vehicleId: v.id } }).error).toMatch(/With its deposit/);
    expect(checking.balance).toBe(q.total + q.deposit - 1);
    expect(standInFor(sim.player, v)).toBeUndefined();
  });

  it('isn’t had for a car that isn’t in, or away from its town, or without a license', () => {
    const { sim, v } = inTheShop('si-no', 'toyota-of-manhattan');
    expect(standInQuote(sim, sim.player, { ...v, inShop: undefined }, sim.now)).toBe('It isn’t in a shop.');
    expect(standInQuote(sim, sim.player, v, v.inShop!.until)).toBe('It isn’t in a shop.');
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(standInQuote(sim, sim.player, v, sim.now)).toBe('You’re not in New York.');
    sim.player.currentLocationId = 'us-ny-newyork';
    documentsOf(sim.player).splice(0);
    expect(typeof standInQuote(sim, sim.player, v, sim.now)).toBe('string');
  });
});
