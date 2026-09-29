/**
 * Driving (`systems/driving.ts`, docs/WORLD.md stage 3c, from 2026-09-29):
 * the road between towns, tickets and their points, a crash's injury, and a
 * drive booked as a journey.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { KM_A_YEAR } from '@/engine/content/vehiclefees';
import { ROAD, byRoad, drive, driveMinutes, drivingOf, roadKm, suspended, tollsUsd } from '@/engine/systems/driving';
import { documentsOf, licenseOf, mayDrive } from '@/engine/systems/documents';
import { healthOf } from '@/engine/systems/health';
import { journeysOf } from '@/engine/systems/journey';
import { vehiclesOf } from '@/engine/systems/vehicles';

const YEAR = 365.2425 * MS_DAY;

function driver(city: string, issuer: string, seed: string, passedYearsAgo = 10): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - passedYearsAgo * YEAR, expiresAt: sim.now + 5 * YEAR });
  return sim;
}
const pointsOf = (sim: Simulation) => drivingOf(sim.player).points.reduce((a, p) => a + p.n, 0);

describe('the road', () => {
  it('stretches the straight line by 1.20 and drives it at 56.6 mph with a quarter hour every two hours', () => {
    const km = roadKm('us-ny-newyork', 'us-dc-washington');
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(420);
    const hours = km / (56.6 * 1.609344);
    expect(driveMinutes(km)).toBe(Math.round(hours * 60 + Math.floor(hours / 2) * 15));
    expect(tollsUsd('us-ny-newyork', 'us-dc-washington')).toBe(35_88);
    expect(tollsUsd('us-dc-washington', 'us-ny-newyork')).toBe(55_67);
    expect(byRoad('ie-lei-dublin', 'uk-nir-belfast')).toBe(true);
    expect(byRoad('uk-eng-london', 'fr-idf-paris')).toBe(false);
    // North America's three are one road.
    expect(byRoad('us-ny-newyork', 'ca-on-toronto')).toBe(true);
  });
});

describe('tickets and points', () => {
  it('writes New York’s speeding tickets at 0.042 a driver a year across its miles', () => {
    const sim = driver('us-ny-newyork', 'us-ny', 'tickets-ny');
    let tickets = 0;
    const years = 2_000;
    for (let i = 0; i < years; i += 1) {
      drivingOf(sim.player).points = [];
      if (drive(sim, sim.player, 'US-NY', KM_A_YEAR['US-NY'], sim.now, `y${i}`).ticket) tickets += 1;
    }
    expect(Math.abs(tickets / years - (1 - Math.exp(-0.042)))).toBeLessThan(0.012);
  });

  it('revokes a British novice’s license at six points within two years of passing, and suspends an Irish novice’s at seven', () => {
    const gb = driver('uk-eng-london', 'gb', 'nda', 1);
    for (let i = 0; pointsOf(gb) < 6 && i < 50_000; i += 1) drive(gb, gb.player, 'GB', 100_000, gb.now, `g${i}`);
    expect(licenseOf(gb.player, gb.now)).toBeUndefined();
    expect(mayDrive(gb.player, 'uk-eng-london', gb.now).ok).toBe(false);
    const ie = driver('ie-lei-dublin', 'ie', 'novice-ie', 1);
    for (let i = 0; pointsOf(ie) < 7 && i < 50_000; i += 1) drive(ie, ie.player, 'IE', 100_000, ie.now, `i${i}`);
    expect(suspended(ie.player, ie.now)).toBe(true);
    expect(mayDrive(ie.player, 'ie-lei-dublin', ie.now).why).toMatch(/suspended/);
    expect(licenseOf(ie.player, ie.now)).toBeDefined();
  });

  it('keeps an experienced British driver’s license at six points, the line being twelve', () => {
    const gb = driver('uk-eng-london', 'gb', 'nda-old', 10);
    for (let i = 0; pointsOf(gb) < 6 && i < 50_000; i += 1) drive(gb, gb.player, 'GB', 100_000, gb.now, `o${i}`);
    expect(licenseOf(gb.player, gb.now)).toBeDefined();
    expect(suspended(gb.player, gb.now)).toBe(false);
  });
});

describe('a crash', () => {
  it('hurts a driver of thirty-five at NHTSA’s 74 a hundred million miles', () => {
    const sim = driver('us-ny-newyork', 'us-ny', 'crash');
    sim.player.birthInstant = sim.now - 35 * YEAR;
    let hurt = 0;
    const trips = 4_000;
    const miles = 100_000;
    for (let i = 0; i < trips; i += 1) {
      delete healthOf(sim.player).injury;
      if (drive(sim, sim.player, 'US-NY', miles * 1.609344, sim.now + i * 60_000, `c${i}`).hurt) hurt += 1;
    }
    const expected = 1 - Math.exp(-(miles * ROAD.injuredPer100MMiles) / 1e8);
    expect(Math.abs(hurt / trips - expected)).toBeLessThan(0.012);
  });
});

describe('a drive as a journey', () => {
  it('drives a New Yorker’s car to Washington, charging fuel, upkeep and the tolls, and the car is there after', () => {
    const sim = driver('us-ny-newyork', 'us-ny', 'drive-dc');
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-cr-v' } }).ok).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    const p = zonedParts(sim.now + 3 * MS_DAY, 'America/New_York');
    const day = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 12 }, 'America/New_York');
    const r = sim.execute<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: { toCity: 'us-dc-washington', day, slot: 2, by: `car:${v.id}`, nights: 1 } });
    expect(r.ok, r.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    const leg = j.legs[0]!;
    expect(leg.mode).toBe('drive');
    const cur = saveCurrency(sim.universe);
    const tolls = cur === 'USD' ? 35_88 : exchange(35_88, 'USD', cur)!;
    expect(leg.fare).toBeGreaterThan(tolls);
    sim.player.awakeSince = j.leaveAt - 3 * 3_600_000;
    for (let t = sim.now; t < j.arriveAt + 3_600_000;) {
      t = Math.min(j.arriveAt + 3_600_000, t + 6 * 3_600_000);
      sim.advanceTo(t);
      if (sim.now < j.leaveAt) sim.player.awakeSince = sim.now;
    }
    expect(j.status).toBe('arrived');
    expect(v.at).toBe('us-dc-washington');
    expect(sim.player.currentLocationId).toBe('us-dc-washington');
  });

  it('refuses a drive without a license, and a car without one sits idle', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'drive-no');
    for (const d of documentsOf(sim.player)) if (d.kind === 'license') d.status = 'cancelled';
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-cr-v' } }).ok).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    const r = sim.execute({ kind: 'travel.book', payload: { toCity: 'us-dc-washington', day: sim.now + 5 * MS_DAY, slot: 2, by: `car:${v.id}`, nights: 1 } });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/license/i);
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Fuel and upkeep'))).toBe(false);
  });
});
