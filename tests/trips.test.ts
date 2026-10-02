/**
 * A trip out on errands (`systems/trips.ts`, `content/errandtrips.ts`, from
 * 2026-10-01): legs of the published average trip at the town's traffic or
 * at a walk, stops that are the screens' own commands, the meter for a
 * stop's time, fuel paid at a named station, errand kilometers taken out of
 * the month's driving, somebody along, and a shut shop ending the trip
 * home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, monthKm, vehiclesOf } from '@/engine/systems/vehicles';
import { burnOf, capacityOf, levelOf } from '@/engine/systems/fueltank';
import { specOf } from '@/engine/systems/caroptions';
import { addItem } from '@/engine/systems/items';
import { COLD_CHAIN_HOURS, driverCost, driverIn, leg, meterCost, runErrands, tripRefusal } from '@/engine/systems/trips';
import { metAtWork } from '@/engine/systems/people';
import { salonsIn } from '@/engine/systems/hygiene';
import { arrange } from '@/engine/systems/catalog';
import { groceryCatalog } from '@/engine/systems/kitchen';

const MI = 1.609344;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const at = (_city: string, zone: string, d: number, h: number) => instantFromZoned({ year: 2026, month: 1, day: d, hour: h, minute: 0 }, zone);
const usd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
const licensed = (sim: Simulation, issuer: string) => documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
const withCar = (sim: Simulation) => { licensed(sim, 'us-ny'); const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }); expect(r.ok, r.error).toBe(true); return vehiclesOf(sim.player)[0]!; };
const salonStop = (city: string) => { const s = salonsIn(city).find((x) => x.services.some((v) => v.price !== null && v.minutes))!; const v = s.services.find((x) => x.price !== null && x.minutes)!; return { kind: 'hygiene.groom', payload: { salonId: s.id, service: v.service }, leg: 'errand' as const, minutes: v.minutes! }; };

describe('a leg', () => {
  it('is the published average trip, at the town’s traffic or at a walk', () => {
    expect(leg('us-ny-newyork', 'car', 'shopping')).toEqual({ km: 5.8 * MI, minutes: 5.8 * MI * 3.1 });
    expect(leg('us-ny-newyork', 'car', 'errand').km).toBeCloseTo(8.7 * MI, 9);
    expect(leg('uk-eng-london', 'car', 'shopping').km).toBeCloseTo((620 / 167) * MI, 9);
    expect(leg('ie-lei-dublin', 'car', 'errand').km).toBeCloseTo((620 / 167) * MI, 9);
    const walk = leg('us-ca-losangeles', 'foot', 'shopping');
    expect(walk.km).toBeCloseTo((230 / 267) * MI, 9);
    expect(walk.minutes).toBeCloseTo((230 / 267) / 3 * 60, 9);
    // New Haven, not in TomTom's index, at Los Angeles's free flow.
    expect(leg('us-ct-newhaven', 'car', 'shopping').minutes).toBeCloseTo(5.8 * MI * 58 / 60, 9);
  });

  it('parks at the town’s meter for the minutes a stop took, and Vancouver’s, unpublished, isn’t charged', () => {
    const sim = life('us-ny-newyork', 'tr-meter');
    expect(meterCost(sim, 'us-ny-newyork', 45)).toBe(usd(sim, Math.round(5 * 45 / 60 * 100)));
    expect(meterCost(sim, 'ca-bc-vancouver', 45)).toBe(0);
  });
});

describe('the shopping on a trip', () => {
  const chicken = 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts';
  const potatoes = 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag';
  it('rides in the car until the trip is home, then goes where it keeps', () => {
    const sim = life('us-ny-newyork', 'tr-carry');
    const v = withCar(sim);
    sim.advanceTo(at('us-ny-newyork', 'America/New_York', 13, 11));
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'shopping', by: 'car', vehicleId: v.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'food.buy_groceries', payload: { productId: chicken, quantity: 1 } }).ok).toBe(true);
    const item = sim.player.items!.find((i) => i.kind === chicken)!;
    expect(item.at).toEqual({ kind: 'vehicle', vehicleId: v.id });
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'home' } }).ok).toBe(true);
    expect(item.at).toMatchObject({ kind: 'home', spot: 'fridge' });
  });

  it('fits in the car’s cargo space, the maker’s liters, or isn’t bought', () => {
    const sim = life('us-ny-newyork', 'tr-trunk');
    const v = withCar(sim);
    sim.advanceTo(at('us-ny-newyork', 'America/New_York', 13, 11));
    const holds = specOf(v.modelId)!.cargoL!;
    expect(holds).toBeGreaterThan(100);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'shopping', by: 'car', vehicleId: v.id } }).ok).toBe(true);
    // A box already in it, all but a liter.
    addItem(sim, sim.player, { kind: 'test:box', label: 'Box', quantity: 1, condition: 1, at: { kind: 'vehicle', vehicleId: v.id }, acquiredAt: sim.now, volumeL: holds - 1 });
    const cash = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'food.buy_groceries', payload: { productId: potatoes, quantity: 1 } }).error).toBe(`It won’t fit in the car: 1 liters of its ${holds} are left.`);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(cash);
  });

  it('carried on foot; chilled food out past USDA’s two hours is thrown out at home, the cupboard’s isn’t', () => {
    const sim = life('us-ny-newyork', 'tr-spoil');
    sim.advanceTo(at('us-ny-newyork', 'America/New_York', 13, 11));
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'shopping', by: 'foot' } }).ok).toBe(true);
    for (const productId of [chicken, potatoes]) expect(sim.execute({ kind: 'food.buy_groceries', payload: { productId, quantity: 1 } }).ok).toBe(true);
    expect(sim.player.items!.find((i) => i.kind === chicken)!.at).toEqual({ kind: 'person' });
    sim.advanceBy(COLD_CHAIN_HOURS * 3_600_000);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'home' } }).ok).toBe(true);
    expect(sim.player.items!.some((i) => i.kind === chicken)).toBe(false);
    expect(sim.player.items!.find((i) => i.kind === potatoes)!.at).toMatchObject({ kind: 'home', spot: 'pantry' });
    expect(sim.universe.notifications.at(-1)!.title).toBe('Shopping Left Out Too Long');
  });
});

describe('a trip', () => {
  it('on foot walks each leg and home, and buys at each stop', () => {
    const sim = life('ca-on-toronto', 'tr-foot');
    sim.advanceTo(at('ca-on-toronto', 'America/Toronto', 13, 10));
    const g = arrange(groceryCatalog(sim, 'ca-on-toronto'))[0]!;
    const before = sim.now;
    const r = runErrands(sim, { by: 'foot', stops: [{ kind: 'food.buy_groceries', payload: { productId: g.id, quantity: 1 }, leg: 'shopping' }] });
    expect(r).toEqual({ done: 1 });
    expect(sim.now - before).toBe(2 * Math.round(leg('ca-on-toronto', 'foot', 'shopping').minutes * 60_000));
    expect(sim.player.items!.some((i) => i.food && i.label.length > 0)).toBe(true);
    expect(sim.player.trip).toBeUndefined();
  });

  it('by car pays the meter for the stop’s time, the trip’s fuel at a named station, and takes its kilometers off the month', () => {
    const sim = life('us-ny-newyork', 'tr-car');
    const v = withCar(sim);
    sim.advanceTo(at('us-ny-newyork', 'America/New_York', 13, 11));
    const stop = salonStop('us-ny-newyork');
    const r = runErrands(sim, { by: 'car', vehicleId: v.id, stops: [{ kind: stop.kind, payload: stop.payload, leg: stop.leg }] });
    expect(r, JSON.stringify(r)).toEqual({ done: 1 });
    // What a transaction took out of the person's own accounts.
    const out = (memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => t.postings.filter((q) => { const acc = sim.universe.accounts[q.accountId]; return acc?.ownerId === sim.player.id && !acc.nominal; }).reduce((a, q) => a - q.amount, 0));
    expect(out('Parking, Manhattan south of 96th Street')).toEqual([meterCost(sim, 'us-ny-newyork', stop.minutes)]);
    const km = leg('us-ny-newyork', 'car', 'errand').km + leg('us-ny-newyork', 'car', 'shopping').km;
    // The fuel came out of the tank (`systems/fueltank.ts`, from 2026-10-02): nothing paid at a station, the tank down by the legs.
    expect(out('Fuel at BP, 255 E 125th St')).toEqual([]);
    expect(levelOf(v)).toBeCloseTo(1 - burnOf(modelById(v.modelId)!, leg('us-ny-newyork', 'car', 'errand').km + leg('us-ny-newyork', 'car', 'shopping').km, v)! / capacityOf(modelById(v.modelId)!)!.size, 9);
    expect(v.errandKm).toBeCloseTo(km, 9);
    // The month's driving is the rest of the place's average: the errands' and its together make the month.
    const kmBefore = v.km!;
    sim.advanceBy(31 * MS_DAY);
    expect(v.km! - kmBefore).toBeCloseTo(monthKm(v) - km, 6);
    expect(v.errandKm).toBe(0);
  });

  it('takes somebody along, whose hours together it adds', () => {
    const sim = life('ca-on-toronto', 'tr-along');
    sim.advanceTo(at('ca-on-toronto', 'America/Toronto', 13, 10));
    const c = metAtWork(sim, sim.player, 'ca-on-toronto', 'b1', 'A Job');
    const g = arrange(groceryCatalog(sim, 'ca-on-toronto'))[0]!;
    runErrands(sim, { by: 'foot', passengerId: c.id, stops: [{ kind: 'food.buy_groceries', payload: { productId: g.id, quantity: 1 }, leg: 'shopping' }] });
    expect(c.hours).toBeCloseTo(2 * leg('ca-on-toronto', 'foot', 'shopping').minutes / 60, 9);
    expect(c.memory[0]!.what).toMatch(/^Came along on your errands/);
  });

  it('stops at a shop that’s shut when you get there, and still comes home', () => {
    const sim = life('ca-on-toronto', 'tr-shut');
    // Giant Tiger shuts at 21:00; a walk there from 20:50 arrives after.
    sim.advanceTo(at('ca-on-toronto', 'America/Toronto', 13, 20) + 50 * 60_000);
    const g = groceryCatalog(sim, 'ca-on-toronto').find((e) => e.value.chain === 'gianttiger')!;
    const r = runErrands(sim, { by: 'foot', stops: [{ kind: 'food.buy_groceries', payload: { productId: g.id, quantity: 1 }, leg: 'shopping' }, { kind: 'clothes.collect', payload: {}, leg: 'errand' }] });
    expect(r.done).toBe(0);
    expect(r.stopped!.error).toMatch(/Giant Tiger has closed/);
    expect(sim.player.trip).toBeUndefined();
  });

  it('isn’t set out on in a car that’s elsewhere or broken down, nor with a rival', () => {
    const sim = life('us-ny-newyork', 'tr-refuse');
    const v = withCar(sim);
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toBeUndefined();
    v.fault = { at: sim.now, severe: true, usd: 1_000 };
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toMatch(/broken down/);
    delete v.fault;
    v.at = 'us-ct-newhaven';
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toBe('The car is in New Haven.');
    const rival = metAtWork(sim, sim.player, 'us-ny-newyork', 'b2', 'A Job');
    rival.rival = true;
    expect(tripRefusal(sim, sim.player, 'foot', undefined, rival.id)).toMatch(/would rather not/);
    const away = metAtWork(sim, sim.player, 'uk-eng-london', 'b3', 'A Job');
    expect(tripRefusal(sim, sim.player, 'foot', undefined, away.id)).toBe(`${away.name.split(' ')[0]} lives in London.`);
    // Without a license that lets them drive here, the car stays put.
    delete v.at;
    sim.player.documents = [];
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toBeDefined();
  });

  it('carries the road’s risks on every leg: over the limit, one is stopped sooner or later', () => {
    const sim = life('us-ny-newyork', 'tr-road');
    const v = withCar(sim);
    let stopped = false;
    for (let n = 0; n < 400 && !stopped; n += 1) {
      sim.player.alcohol = { bac: 0.2, at: sim.now, peak: 0.2, peakAt: sim.now };
      sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: v.id } });
      stopped = sim.universe.notifications.some((x) => x.title === 'Stopped Over The Limit');
    }
    expect(stopped).toBe(true);
  });
});

describe('a driver hired for the car', () => {
  it('drives it on a suspended license, paid by the hour at least its minimum, and a trip by yourself is refused', () => {
    const sim = life('us-ny-newyork', 'trip-driver');
    const v = withCar(sim);
    sim.player.driving = { points: [], suspendedUntil: sim.now + 365 * MS_DAY };
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toBeDefined();
    expect(tripRefusal(sim, sim.player, 'car', v.id, undefined, true)).toBeUndefined();
    const before = sim.universe.transactions.length;
    const km = v.km ?? 0;
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: v.id, driven: true } }).ok).toBe(true);
    expect(sim.player.trip?.driver?.id).toBe('dryver-ny');
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'home' } }).ok).toBe(true);
    expect(v.km).toBeGreaterThan(km);
    const paid = sim.universe.transactions.slice(before).find((t) => t.memo === 'Dryver, driving your car')!;
    // Two hours at least, at $55.
    expect(paid.postings.find((q) => q.amount > 0)!.amount).toBe(usd(sim, 110_00));
  });

  it('costs Vancouver’s by the kilometer with its GST, and isn’t had where nobody publishes a price', () => {
    const van = life('ca-bc-vancouver', 'trip-driver-van');
    const cad = (n: number) => { const c = Math.round(n * 100); const cur = saveCurrency(van.universe); return cur === 'CAD' ? c : exchange(c, 'CAD', cur)!; };
    expect(driverCost(van, driverIn('ca-bc-vancouver')!, 30, 10)).toBe(cad((30 + 2.5 * 10) * 1.05));
    expect(driverCost(van, driverIn('ca-on-toronto')!, 30, 10)).toBe(cad(60 * 3 * 1.13));
    expect(driverCost(van, driverIn('ca-on-toronto')!, 240, 10)).toBe(cad(60 * 4 * 1.13));
    const nh = life('us-ct-newhaven', 'trip-driver-nh');
    const car = withCar(nh);
    expect(tripRefusal(nh, nh.player, 'car', car.id, undefined, true)).toBe('Nobody here drives your own car for a published price.');
  });
});

describe('a driver hired, drunk', () => {
  const legs = (driven: boolean) => {
    const sim = life('us-ny-newyork', 'trip-driver-drunk');
    const v = withCar(sim);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: v.id, ...(driven ? { driven: true } : {}) } }).ok).toBe(true);
    for (let i = 0; i < 300; i += 1) {
      sim.player.alcohol = { bac: 0.2, at: sim.now, peak: 0.2, peakAt: sim.now };
      sim.execute({ kind: 'errand.go', payload: { to: 'errand' } });
    }
    return sim.player.driving?.suspendedUntil;
  };
  it('is never stopped over the limit, where driving yourself is', () => {
    expect(legs(false)).toBeDefined();
    expect(legs(true)).toBeUndefined();
  }, 120_000);
});
