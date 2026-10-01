/**
 * The internet at home and the phone, billed by their providers
 * (`systems/telecom.ts`, `content/telecom.ts`, from 2026-10-01).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { INTERNET } from '@/engine/content/telecom';
import { atlasBillsOf, billsOf, telecomPartOf } from '@/engine/systems/household';
import { internetIn, internetMonth, leavingCost, telecomLines, telecomOf } from '@/engine/systems/telecom';

const life = (city: string, seed: string, kind: 'own' | 'shared' = 'own') => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.home = { ...sim.player.home!, cityId: city, kind };
  return sim;
};
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const MONTH = (365.2425 / 12) * MS_DAY;
const plan = (id: string) => INTERNET.find((p) => p.id === id)!;

describe('the internet and the phone', () => {
  it('are their providers’ bills where SLATE keeps the offers, their estimate out of the bills, and the bills’ elsewhere', () => {
    const ldn = life('uk-eng-london', 'tc-ldn');
    expect(telecomPartOf(ldn, ldn.player)).toBeGreaterThan(0);
    expect(billsOf(ldn, ldn.player)).toBe(atlasBillsOf(ldn, ldn.player) - telecomPartOf(ldn, ldn.player));
    const lines = telecomLines(ldn, ldn.player, ldn.now);
    expect(lines).toEqual([
      { memo: 'Internet, Virgin Media', amount: inSave(ldn, 23.99, 'GBP'), shared: true },
      { memo: 'Phone, giffgaff', amount: inSave(ldn, 6, 'GBP'), shared: false },
    ]);
    const edi = life('uk-sct-edinburgh', 'tc-edi');
    expect(telecomPartOf(edi, edi.player)).toBe(0);
    expect(telecomLines(edi, edi.player, edi.now)).toEqual([]);
    edi.player.home = { ...edi.player.home!, kind: 'sofa' };
    ldn.player.home = { ...ldn.player.home!, kind: 'sofa' };
    expect(telecomPartOf(ldn, ldn.player)).toBe(0);
  });

  it('are paid on the first with the rent, by name', () => {
    const sim = life('uk-eng-london', 'tc-first');
    const p = zonedParts(sim.now + 40 * MS_DAY, sim.zone);
    const before = sim.universe.transactions.length;
    sim.advanceTo(instantFromZoned({ year: p.year, month: p.month, day: 2, hour: 9 }, sim.zone));
    const memos = sim.universe.transactions.slice(before).map((t) => t.memo);
    expect(memos).toContain('Internet, Virgin Media');
    expect(memos).toContain('Phone, giffgaff');
  });

  it('cost an offer’s price for its months and its standard price after, where published', () => {
    const since = 0;
    expect(internetMonth(plan('virgin-m125'), since, 23 * MONTH)).toBe(23.99);
    expect(internetMonth(plan('virgin-m125'), since, 24 * MONTH)).toBe(62);
    expect(internetMonth(plan('virgin-ie-500'), since, 12 * MONTH)).toBe(70);
    expect(internetMonth(plan('spectrum-100-ny'), since, 30 * MONTH)).toBe(30);
  });

  it('come to a room’s half of the internet, Canada’s tax on the phone, and Mint’s year paid ahead', () => {
    const room = life('ie-lei-dublin', 'tc-room', 'shared');
    expect(telecomLines(room, room.player, room.now)[0]!.amount).toBe(inSave(room, 34.99 * 0.5, 'EUR'));
    const tor = life('ca-on-toronto', 'tc-tor');
    expect(telecomLines(tor, tor.player, tor.now)).toEqual([
      { memo: 'Internet, Bell', amount: inSave(tor, 65 * 1.13, 'CAD'), shared: true },
      { memo: 'Phone, Public Mobile', amount: inSave(tor, 22 * 1.13, 'CAD'), shared: false },
    ]);
    const ny = life('us-ny-newyork', 'tc-mint');
    expect(telecomLines(ny, ny.player, ny.now)[1]).toEqual({ memo: 'Phone, Mint Mobile, 12 months ahead', amount: inSave(ny, 180, 'USD'), shared: false });
    expect(telecomLines(ny, ny.player, ny.now + MONTH).length).toBe(1);
    expect(telecomLines(ny, ny.player, ny.now + 12 * MONTH).length).toBe(2);
  });

  it('move with you: a new town’s cheapest offer on moving in', () => {
    const sim = life('us-ny-newyork', 'tc-move');
    telecomLines(sim, sim.player, sim.now);
    expect(telecomOf(sim.player).internet!.cityId).toBe('us-ny-newyork');
    sim.player.home = { ...sim.player.home!, cityId: 'us-ca-losangeles' };
    telecomLines(sim, sim.player, sim.now + MONTH);
    expect(telecomOf(sim.player).internet).toMatchObject({ planId: internetIn('us-ca-losangeles')[0]!.id, cityId: 'us-ca-losangeles', since: sim.now + MONTH });
    // Abroad, the new country's phone.
    sim.player.home = { ...sim.player.home!, cityId: 'uk-eng-london' };
    expect(telecomLines(sim, sim.player, sim.now + 2 * MONTH).map((l) => l.memo)).toEqual(['Internet, Virgin Media', 'Phone, giffgaff']);
    // On a friend's sofa, no internet of your own; back in a home, a new account.
    sim.player.home = { ...sim.player.home!, kind: 'sofa' };
    telecomLines(sim, sim.player, sim.now + 3 * MONTH);
    expect(telecomOf(sim.player).internet).toBeUndefined();
    expect(sim.execute({ kind: 'home.internet', payload: { planId: 'bt-full-fibre-100' } }).error).toBe('There’s no home of yours to have the internet in.');
  });
});

describe('switching provider', () => {
  it('takes the other offer as a new customer, paying a contract’s months left', () => {
    const sim = life('uk-eng-london', 'tc-switch');
    telecomLines(sim, sim.player, sim.now);
    sim.player.telecom!.internet!.since = sim.now - 10 * MONTH;
    expect(leavingCost(sim, sim.player, sim.now)).toBe(inSave(sim, 23.99 * 14, 'GBP'));
    expect(sim.execute({ kind: 'home.internet', payload: { planId: 'virgin-m125' } }).error).toBe('You have it already.');
    expect(sim.execute({ kind: 'home.internet', payload: { planId: 'eir-500' } }).error).toBe('That isn’t offered where you live.');
    const before = sim.universe.transactions.length;
    const r = sim.execute<{ paid: number }>({ kind: 'home.internet', payload: { planId: 'bt-full-fibre-100' } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.universe.transactions.slice(before).some((t) => t.memo === 'Virgin Media, the contract’s months left')).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, 23.99 * 14, 'GBP'));
    expect(telecomOf(sim.player).internet).toMatchObject({ planId: 'bt-full-fibre-100', since: sim.now });
    // Past the contract, leaving costs nothing; nor does a rolling offer.
    sim.player.telecom!.internet!.since = sim.now - 25 * MONTH;
    expect(leavingCost(sim, sim.player, sim.now)).toBe(0);
    const ny = life('us-ny-newyork', 'tc-rolling');
    ny.player.telecom = { internet: { planId: 'spectrum-100-ny', since: ny.now, cityId: 'us-ny-newyork' } };
    expect(leavingCost(ny, ny.player, ny.now + MONTH)).toBe(0);
  });
});
