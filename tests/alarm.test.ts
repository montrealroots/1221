/**
 * A burglar alarm (`systems/alarm.ts`, from 2026-09-30): Ring's kit and
 * monitoring where both are priced, the insurers' discount on a renter's or an
 * owner's premium, no change to the risk (Tseloni et al.), and monitoring
 * unpaid switching it off; and Britain's own burglary rate.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { alarmRefusal, alarmed } from '@/engine/systems/alarm';
import { belongingsDay, burglaryYear, rentersPremium } from '@/engine/systems/dwelling';
import { ownBuilt, ownedMonth, type HomeFacts } from '@/engine/systems/homes';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const drain = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal) { if (a.balance > 0) a.balance = 0; if (a.kind === 'credit_card') a.creditLimit = 0; if (a.kind === 'checking') a.balance = -1_000_000_00; } };

describe('an alarm', () => {
  it('is sold where Ring’s kit and monitoring are both priced', () => {
    const mx = life('mx-cmx-mexicocity', 'alarm-mx');
    expect(alarmRefusal(mx.player)).toMatch(/America and Britain/);
    const ny = life('us-ny-newyork', 'alarm-ny-ok');
    expect(alarmRefusal(ny.player)).toBeUndefined();
  });

  it('takes the Triple-I’s 5% off a renter’s premium, and its monitoring is charged each month', () => {
    const sim = life('us-ny-newyork', 'alarm-renter');
    const before = rentersPremium(sim, sim.player);
    const r = sim.execute<{ paid: number }>({ kind: 'home.alarm', payload: { on: true } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, 199_99, 'USD'));
    expect(alarmed(sim.player)).toBe(true);
    expect(rentersPremium(sim, sim.player)).toBe(Math.round(before * 0.95));
    sim.advanceBy(32 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Alarm monitoring')).toBe(true);
    // Monitoring unpaid, the overdraft spent too, it's switched off and the discount ends.
    drain(sim);
    sim.advanceBy(32 * MS_DAY);
    expect(alarmed(sim.player)).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Your Alarm Was Switched Off')).toBe(true);
  });

  it('takes Aviva’s 12.5% off an owner’s premium in Britain, fitted in the home', () => {
    const sim = life('uk-eng-london', 'alarm-owner');
    const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_200, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(sim, sim.player, { cityId: 'uk-eng-london', facts, price: 600_000_00, closing: 0 });
    sim.player.home = { kind: 'owned', cityId: 'uk-eng-london', homeId: owned.id, since: sim.now };
    const before = ownedMonth(sim, owned).insurance;
    expect(sim.execute({ kind: 'home.alarm', payload: { on: true } }).ok).toBe(true);
    expect(owned.alarm).toBe(true);
    expect(ownedMonth(sim, owned).insurance).toBe(Math.round(before * 0.875));
  });
});

describe('the risk of a burglary', () => {
  it('is Britain’s own 1.1% a year, and America’s NCVS 8.2 in a thousand elsewhere', () => {
    expect(burglaryYear('uk-eng-london')).toBe(0.011);
    expect(burglaryYear('us-ny-newyork')).toBeCloseTo(0.0082, 10);
    expect(burglaryYear('ie-lei-dublin')).toBeCloseTo(0.0082, 10);
  });

  it('is drawn each day at the place’s rate: more burglaries in London than in Dublin, at a scale a test can see', () => {
    const count = (city: string) => {
      const sim = life(city, `burgle-${city}`);
      const before = sim.universe.notifications.filter((n) => n.title === 'Your Home Was Burgled').length;
      for (let d = 0; d < 200; d += 1) { sim.advanceBy(MS_DAY); belongingsDay(sim, sim.player, false, 30_000); }
      return sim.universe.notifications.filter((n) => n.title === 'Your Home Was Burgled').length - before;
    };
    // 1.1% and 0.82% a year, times 30,000, over 200 days: about 181 and 135.
    expect(count('uk-eng-london')).toBeGreaterThan(160);
    expect(count('ie-lei-dublin')).toBeLessThan(160);
  });
});
