/**
 * Locks, lights and timers against a burglary (`systems/homesecurity.ts`,
 * from 2026-09-30): each priced at a named retailer where the home is, and
 * cutting the risk by the protection factors Tseloni et al. measured,
 * relative to a home with door locks only.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { belongingsDay } from '@/engine/systems/dwelling';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { PROTECTION, devicesOf, securityFactor, securityRefusal } from '@/engine/systems/homesecurity';

/** A life renting a flat of its own. */
const life = (city: string, seed: string) => { const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed); sim.player.home = { ...sim.player.home!, kind: 'own' }; return sim; };
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const buy = (sim: Simulation, device: string) => sim.execute<{ paid: number }>({ kind: 'home.security', payload: { device } });

function house(city: string, seed: string): Simulation {
  const sim = life(city, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_200, lot: 5_000, built: 2000, features: [], parts: {}, hoaUsd: 0 };
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts, price: 600_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  return sim;
}

describe('security devices', () => {
  it('fits a rented flat’s four windows with locks at The Home Depot’s price and New York’s sales tax, and cuts the risk to 2.8 in 12.54 of it', () => {
    const sim = life('us-ny-newyork', 'sec-flat');
    expect(sim.player.home!.kind).toBe('own');
    expect(securityFactor(sim.player)).toBe(1);
    const r = buy(sim, 'windows');
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, Math.round(4 * 2_93 * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods'))), 'USD'));
    expect(securityFactor(sim.player)).toBeCloseTo(2.8 / 12.54, 10);
    expect(buy(sim, 'windows').error).toMatch(/has them/);
    // No outside light on a flat; timers without an outside light are a set the study didn't measure, and add nothing.
    expect(securityRefusal(sim.player, 'lights')).toMatch(/house, not a flat/);
    expect(buy(sim, 'timers').ok).toBe(true);
    expect(securityFactor(sim.player)).toBeCloseTo(2.8 / 12.54, 10);
  });

  it('reaches the WIDE combination on a house, a lock on each bedroom’s window and three more, at Screwfix’s prices with VAT in', () => {
    const sim = house('uk-eng-london', 'sec-house');
    const r = buy(sim, 'windows');
    expect(r.value!.paid).toBe(inSave(sim, 6 * 6_99, 'GBP'));
    // Outside lights without window locks count only as the door locks the study measured.
    const lit = house('uk-eng-london', 'sec-lit');
    expect(buy(lit, 'lights').ok).toBe(true);
    expect(securityFactor(lit.player)).toBe(1);
    expect(buy(sim, 'lights').ok).toBe(true);
    expect(securityFactor(sim.player)).toBeCloseTo(2.8 / 34.41, 10);
    expect(buy(sim, 'timers').value!.paid).toBe(inSave(sim, 2 * 7_99, 'GBP'));
    expect(securityFactor(sim.player)).toBeCloseTo(PROTECTION.doors / PROTECTION.timers, 10);
  });

  it('leaves a rented home’s locks behind on moving out, and a shared home’s are the landlord’s', () => {
    const sim = life('us-ny-newyork', 'sec-move');
    expect(buy(sim, 'windows').ok).toBe(true);
    sim.player.home = { kind: 'own', cityId: 'us-ny-newyork', since: sim.now };
    expect(devicesOf(sim.player)).toHaveLength(0);
    sim.player.home = { kind: 'shared', cityId: 'us-ny-newyork', since: sim.now };
    expect(securityRefusal(sim.player, 'windows')).toMatch(/landlord/);
  });

  it('is drawn into each day’s burglary: window locks see far fewer', () => {
    const count = (locked: boolean) => {
      const sim = life('us-ny-newyork', 'sec-burgle');
      if (locked) expect(buy(sim, 'windows').ok).toBe(true);
      const before = sim.universe.notifications.filter((n) => n.title === 'Your Home Was Burgled').length;
      for (let d = 0; d < 200; d += 1) { sim.advanceBy(MS_DAY); belongingsDay(sim, sim.player, false, 30_000); }
      return sim.universe.notifications.filter((n) => n.title === 'Your Home Was Burgled').length - before;
    };
    // 0.82% a year times 30,000 over 200 days, about 135; locked, a little over a fifth of it.
    expect(count(false)).toBeGreaterThan(110);
    expect(count(true)).toBeLessThan(50);
  });
});
