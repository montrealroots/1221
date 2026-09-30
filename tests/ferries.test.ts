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
import { journeysOf, planBy } from '@/engine/systems/journey';

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
