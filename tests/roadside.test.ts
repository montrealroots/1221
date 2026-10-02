/**
 * Breakdown cover, a tow, and a car that breaks down on the road
 * (`systems/roadside.ts`, `content/roadside.ts`, from 2026-10-02): the clubs
 * where you live at their dues, renewed or lapsed; a tow covered to the
 * tier's kilometers, its longer one, its calls a year; the market's tow
 * without; and a journey's fault, towed the rest of the way.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { inSaveMoney } from '@/engine/systems/banking';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { duesOf, joinRefusal, onTheRoad, tierById, tiersFor, tow, towPrice } from '@/engine/systems/roadside';
import type { Journey } from '@/engine/systems/journey';

const MI = 1.609344;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal).reduce((t, a) => t + a.balance, 0);
const join = (sim: Simulation, tierId: string) => { const r = sim.execute<{ paid: number }>({ kind: 'roadside.join', payload: { tierId } }); expect(r.ok, r.error).toBe(true); return r.value!.paid; };

describe('the clubs', () => {
  it('are the ones where you live, cheapest a year first, at their dues and joining fee', () => {
    const sim = life('us-ny-newyork', 'rs-ny');
    expect(tiersFor(sim, sim.player).map((t) => t.id)).toEqual(['aaa-ne-basic', 'aaa-ne-premier']);
    const before = bank(sim);
    expect(join(sim, 'aaa-ne-basic')).toBe(inSaveMoney(sim, 430, 'USD') + inSaveMoney(sim, 1500, 'USD'));
    expect(bank(sim)).toBe(before - inSaveMoney(sim, 1930, 'USD'));
    expect(joinRefusal(sim, sim.player, 'aaa-ne-premier')).toBe('You’re a member of AAA Northeast already.');
    expect(joinRefusal(sim, sim.player, 'bcaa-basic')).toBeDefined();
    const toronto = life('ca-on-toronto', 'rs-to');
    expect(tiersFor(toronto, toronto.player).map((t) => t.id)).toEqual(['caa-sco-basic', 'caa-sco-plus', 'caa-sco-premier']);
    const mx = life('mx-cmx-mexicocity', 'rs-mx');
    expect(tiersFor(mx, mx.player)).toEqual([]);
  });

  it('take the month’s dues on renewal, lapse when they can’t, and take nothing after leaving', () => {
    const sim = life('us-ny-newyork', 'rs-renew');
    join(sim, 'aaa-ne-basic');
    const first = sim.player.roadside!.renewAt;
    const before = bank(sim);
    sim.advanceTo(first + 3_600_000);
    expect(sim.player.roadside!.renewAt).toBeGreaterThan(first);
    expect(bank(sim)).toBeLessThanOrEqual(before - inSaveMoney(sim, 430, 'USD'));
    sim.must({ kind: 'roadside.leave', payload: {} });
    expect(sim.player.roadside).toBeUndefined();
    expect(sim.universe.scheduled.some((one) => one.status === 'pending' && one.kind === 'roadside.renew')).toBe(false);
    // A renewal the bank can't pay: the cover lapses.
    join(sim, 'aaa-ne-basic');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal) { if (a.balance > 0) a.balance = 0; if (a.kind === 'credit_card') a.creditLimit = 0; if (a.kind === 'checking') a.balance = -1_000_000_00; }
    sim.advanceTo(sim.player.roadside!.renewAt + 3_600_000);
    expect(sim.player.roadside).toBeUndefined();
  });

  it('add tax where the club’s dues are before it', () => {
    const sim = life('ca-bc-vancouver', 'rs-bc');
    const d = duesOf(sim, sim.player, tierById('bcaa-basic')!);
    expect(d.period).toBe('year');
    expect(d.each).toBeGreaterThan(inSaveMoney(sim, 9700, 'CAD'));
  });
});

describe('a tow', () => {
  it('without cover is the market’s price', () => {
    const sim = life('us-ny-newyork', 'rs-price');
    expect(towPrice(sim, 'US-NY', 'us-ny-newyork', 10 * MI, false)).toBe(inSaveMoney(sim, Math.round((67.5 + 37.5) * 100), 'USD'));
    expect(towPrice(sim, 'CA-BC', 'ca-bc-vancouver', 16, true)).toBe(inSaveMoney(sim, Math.round((79.78 + 10 * 2.41) * 100), 'CAD'));
    expect(towPrice(sim, 'GB', 'uk-eng-london', 300, true)).toBe(inSaveMoney(sim, 19200, 'GBP'));
    expect(towPrice(sim, 'MX-CMX', 'mx-cmx-mexicocity', 5, false)).toBe(inSaveMoney(sim, 165000, 'MXN'));
    expect(towPrice(sim, 'MX-CMX', 'mx-cmx-mexicocity', 100.4, true)).toBe(inSaveMoney(sim, Math.round((528.69 + 100 * 18.82) * 100), 'MXN'));
  });

  it('with cover is free to the tier’s kilometers, the longer one once a year, the rest by the kilometer, for its calls', () => {
    const sim = life('us-ny-newyork', 'rs-cover');
    join(sim, 'aaa-ne-premier');
    const m = sim.player.roadside!;
    expect(tow(sim, sim.player, 'US-NY', 'us-ny-newyork', 50, false, 'test').paid).toBe(0);
    expect(m.used).toBe(1);
    // Past 100 miles: the year's 200-mile tow, once.
    expect(tow(sim, sim.player, 'US-NY', 'us-ny-newyork', 250, true, 'test').paid).toBe(0);
    expect(m.longUsed).toBe(1);
    const over = tow(sim, sim.player, 'US-NY', 'us-ny-newyork', 250, true, 'test');
    expect(over.paid).toBe(inSaveMoney(sim, Math.round((250 - 100 * MI) * (3.75 / MI) * 100), 'USD'));
    expect(over.covered).toBe(true);
    // A fourth call, then none left: the market's tow.
    tow(sim, sim.player, 'US-NY', 'us-ny-newyork', 5, false, 'test');
    const none = tow(sim, sim.player, 'US-NY', 'us-ny-newyork', 5, false, 'test');
    expect(none.covered).toBe(false);
    expect(none.paid).toBe(towPrice(sim, 'US-NY', 'us-ny-newyork', 5, false));
    // A new membership year, the calls afresh.
    sim.universe.now = m.yearFrom + 366 * MS_DAY;
    expect(tow(sim, sim.player, 'US-NY', 'us-ny-newyork', 5, false, 'test').covered).toBe(true);
    expect(m.used).toBe(1);
  });

  it('comes out where the club does: AAA in Canada, not the British clubs abroad', () => {
    const sim = life('us-ny-newyork', 'rs-where');
    join(sim, 'aaa-ne-premier');
    expect(tow(sim, sim.player, 'CA-ON', 'ca-on-toronto', 20, false, 'test').covered).toBe(true);
    expect(tow(sim, sim.player, 'IE', 'ie-lei-dublin', 20, false, 'test').covered).toBe(false);
  });

  it('to the garage is the town’s errand away, once', () => {
    const sim = life('us-ny-newyork', 'rs-garage');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    v.fault = { at: sim.now, severe: true, usd: 1164, towed: true };
    const before = bank(sim);
    const rep = sim.execute<{ paid: number }>({ kind: 'vehicle.repair', payload: { vehicleId: v.id, shopId: 'midas-w53' } });
    expect(rep.ok, rep.error).toBe(true);
    // Towed already, on the road: the repair alone.
    expect(before - bank(sim)).toBe(rep.value!.paid);
    expect(rep.value!.paid).toBe(inSaveMoney(sim, 116_400, 'USD'));
  });
});

describe('on the road', () => {
  it('a severe fault stops the car and it’s towed the rest of the way; a light one goes on', () => {
    const sim = life('us-ny-newyork', 'rs-road');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const car = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    let severe: Journey | undefined;
    let light = false;
    for (let i = 0; i < 300 && !(severe && light); i += 1) {
      delete car.fault;
      const j = { id: `j-${i}`, fromCity: 'us-ny-newyork', toCity: 'us-ct-newhaven', leaveAt: sim.now, arriveAt: sim.now + 3 * 3_600_000 } as Journey;
      const before = bank(sim);
      expect(onTheRoad(sim, sim.player, car, j, 250, 1)).toBe(true);
      if (car.fault!.severe) { severe = j; expect(car.fault!.towed).toBe(true); expect(bank(sim)).toBeLessThan(before); }
      else { light = true; expect(car.fault!.towed).toBeUndefined(); expect(bank(sim)).toBe(before); }
    }
    expect(severe && light).toBeTruthy();
    // A car with a fault already draws none, and at the real odds a short drive mostly brings nothing.
    expect(onTheRoad(sim, sim.player, car, { id: 'x', fromCity: 'us-ny-newyork', toCity: 'us-ct-newhaven', leaveAt: sim.now, arriveAt: sim.now } as Journey, 250, 1)).toBe(false);
    delete car.fault;
    let none = 0;
    for (let i = 0; i < 100; i += 1) { if (!onTheRoad(sim, sim.player, car, { id: `k-${i}`, fromCity: 'us-ny-newyork', toCity: 'us-ct-newhaven', leaveAt: sim.now, arriveAt: sim.now } as Journey, 250)) none += 1; delete car.fault; }
    expect(none).toBeGreaterThan(90);
  });
});
