/**
 * A ferry between towns (`content/rail.ts`'s `vehicle: 'ferry'`, from
 * 2026-09-30): BC Ferries from Vancouver to Victoria, its fare with the
 * transit to and from its terminals, its sailings and punctuality, booked
 * and taken as a train is.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { railRouteById, railRoutes } from '@/engine/systems/rail';
import { boardingIdRefusal } from '@/engine/systems/identity';
import { crossesByCarFerry, journeysOf, planBy, planChauffeur, planDrive } from '@/engine/systems/journey';
import { roadKm, driveMinutes } from '@/engine/systems/driving';
import { runningCost, vehiclesOf } from '@/engine/systems/vehicles';

describe('BC Ferries', () => {
  it('joins Vancouver and Victoria both ways, at C$21 with its surcharge and the transit to its terminals', () => {
    expect(railRoutes('ca-bc-vancouver', 'ca-02-victoria').map((r) => r.id)).toEqual(['bcf-tsawwassen-swartz-bay']);
    expect(railRoutes('ca-02-victoria', 'ca-bc-vancouver').map((r) => r.id)).toEqual(['bcf-tsawwassen-swartz-bay']);
    const route = railRouteById('bcf-tsawwassen-swartz-bay')!;
    expect(route.fare.amount).toBe(22_05 + 6_70 + 3_00);
    expect(route.perDay).toBe(13);
  });

  it('is booked and sailed as a ferry leg, and lands them in Victoria', () => {
    const sim = quickSave({ startLocationId: 'ca-bc-vancouver', homeRegionId: 'ca-bc-vancouver', livesWhereBorn: true, wealth: 'wealthy' }, 'ferry-go');
    const day = sim.now + 5 * MS_DAY;
    const legs = planBy(sim, 'bcf-tsawwassen-swartz-bay', 'ca-bc-vancouver', 'ca-02-victoria', day, 3, 0);
    expect(typeof legs).not.toBe('string');
    const sail = (legs as { mode: string; fare: number }[]).find((l) => l.mode === 'ferry')!;
    const cur = saveCurrency(sim.universe);
    expect(sail.fare).toBe(cur === 'CAD' ? 31_75 : exchange(31_75, 'CAD', cur));
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'ca-02-victoria', by: 'bcf-tsawwassen-swartz-bay', day, slot: 3, nights: 2 } });
    expect(r.ok, r.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    sim.advanceTo(j.arriveAt + 6 * 3_600_000);
    expect(j.status).toBe('arrived');
    expect(sim.player.currentLocationId).toBe('ca-02-victoria');
  });
});

describe('a car on BC Ferries', () => {
  it('pays the car and its driver, C$110 with the 5% surcharge, and the 95 minutes across, driving to Victoria and back; not driving within the mainland', () => {
    const sim = quickSave({ startLocationId: 'ca-bc-vancouver', homeRegionId: 'ca-bc-vancouver', livesWhereBorn: true, wealth: 'wealthy' }, 'ferry-car');
    sim.player.documents = [...(sim.player.documents ?? []), { id: 'lic', kind: 'license', issuer: 'ca-bc', name: 'Class 5', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY }];
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'ca-honda-cr-v' } }).ok).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    const day = sim.now + 2 * MS_DAY;
    const legs = planDrive(sim, sim.player, v.id, 'ca-bc-vancouver', 'ca-02-victoria', day, 2);
    if (typeof legs === 'string') throw new Error(legs);
    const km = roadKm('ca-bc-vancouver', 'ca-02-victoria');
    const cur = saveCurrency(sim.universe);
    const ferry = cur === 'CAD' ? 115_50 : exchange(115_50, 'CAD', cur)!;
    expect(Math.abs(legs[0]!.fare - runningCost(sim, v, km) - ferry)).toBeLessThanOrEqual(1);
    expect(legs[0]!.arriveAt - legs[0]!.departAt).toBe((driveMinutes(km) + 95) * 60_000);
    expect(crossesByCarFerry('ca-02-victoria', 'ca-bc-vancouver')).toBe(true);
    expect(crossesByCarFerry('ca-bc-vancouver', 'ca-bc-vancouver')).toBe(false);
    // A car and driver bills the sailing's hours too, and pays the fare.
    const hired = planChauffeur(sim, 'ca-bc-vancouver', 'ca-02-victoria', day, 2);
    if (typeof hired === 'string') throw new Error(hired);
    expect(hired[0]!.arriveAt - hired[0]!.departAt).toBe((driveMinutes(km) + 95) * 60_000);
    expect(hired[0]!.fare).toBeGreaterThan(ferry);
  });
});

describe('SailRail', () => {
  it('joins Dublin and London through Holyhead at the Single’s €58, and from 28 September 2026 asks a passport or an Irish passport card', () => {
    expect(railRoutes('ie-lei-dublin', 'uk-eng-london').map((r) => r.id)).toContain('sailrail-dublin-london');
    const route = railRouteById('sailrail-dublin-london')!;
    expect(route.fare).toMatchObject({ amount: 58_00, currency: 'EUR' });
    expect(route.minutes).toBe(502);
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true }, 'sailrail-id');
    sim.player.documents = [];
    const sail = { fromCity: 'ie-lei-dublin', toCity: 'uk-eng-london', legs: [{ mode: 'ferry' as const }] } as never;
    expect(boardingIdRefusal(sim.player, sail, Date.UTC(2026, 8, 27))).toBeUndefined();
    expect(boardingIdRefusal(sim.player, sail, Date.UTC(2026, 8, 29))).toMatch(/Irish Sea/);
    sim.player.documents = [{ id: 'pc', kind: 'idcard', issuer: 'ie', name: 'Passport Card', number: 'P1', status: 'valid', issuedAt: Date.UTC(2026, 0, 1), expiresAt: Date.UTC(2030, 0, 1) }];
    expect(boardingIdRefusal(sim.player, sail, Date.UTC(2026, 8, 29))).toBeUndefined();
  });
});