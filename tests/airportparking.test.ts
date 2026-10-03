/**
 * Leaving one's own car at the airport on a round trip (`byCar` and
 * `parkingFee` in `systems/airportground.ts`, from 2026-10-02): no fare to
 * the airport, and the car park's own tariff paid on the way home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { AIRPORT_PARKING, parkingUnits } from '@/engine/content/airportparking';
import { byCarRefusal, parkingFee } from '@/engine/systems/airportground';
import { journeysOf, planBy } from '@/engine/systems/journey';
import { vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { documentsOf } from '@/engine/systems/documents';
import { inSaveMoney } from '@/engine/systems/banking';

const lot = (iata: string) => AIRPORT_PARKING.find((p) => p.iata === iata)!;

describe('a car park’s tariff', () => {
  it('charges its first period, each one after or part of one, and a week’s rate where less', () => {
    // JFK's Lot 9: $55 the first day, $27.50 each 12 hours after.
    expect(parkingUnits(lot('JFK'), 72)).toBe(55 + 4 * 27.5);
    expect(parkingUnits(lot('JFK'), 25)).toBe(55 + 27.5);
    // Heathrow's Long Stay: £46.80, then £37.40 a day.
    expect(parkingUnits(lot('LHR'), 72)).toBeCloseTo(46.8 + 2 * 37.4, 6);
    // Bradley's Lot 4: $42 a week, $7 a day past it.
    expect(parkingUnits(lot('BDL'), 9 * 24)).toBe(42 + 14);
    expect(parkingUnits(lot('BDL'), 6.5 * 24)).toBe(42);
  });
});

describe('a round trip by one’s own car', () => {
  it('leaves the car at LAX and pays its parking on the way home', () => {
    const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'airport-park');
    const p = sim.player;
    vehiclesOf(p).push({ id: 'car-1', modelId: 'us-toyota-camry', jurisdiction: 'US-CA', cityId: 'us-ca-losangeles', coverage: 'liability', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 30_000_00, registrationDue: sim.now + 365 * MS_DAY } as OwnedVehicle);
    documentsOf(p).push({ id: 'dl', kind: 'license', issuer: 'us-ca', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3e11 });
    const day = sim.now + 10 * MS_DAY;
    let booked: { journeyId: string; returnId?: string } | undefined;
    for (let slot = 0; slot < 12 && !booked; slot += 1) {
      const out = planBy(sim, undefined, 'us-ca-losangeles', 'us-ny-newyork', day, slot, 0);
      const back = planBy(sim, undefined, 'us-ny-newyork', 'us-ca-losangeles', day + 3 * MS_DAY, slot, 0, 'economy', 'us-ny-newyork');
      if (typeof out === 'string' || typeof back === 'string' || out[0]?.to !== 'LAX' || back[back.length - 1]?.from !== 'LAX') continue;
      // Awake to leave: a flight out between nine and six, and home in the afternoon, after a jet-lagged morning.
      const leaves = zonedParts(out[0]!.departAt, 'America/Los_Angeles').hour;
      const returns = zonedParts(back[0]!.departAt, 'America/New_York').hour;
      if (leaves < 9 || leaves >= 18 || returns < 13 || returns >= 18) continue;
      expect(byCarRefusal(sim, p, 'us-ca-losangeles', out, undefined, 'car-1')).toBe('A car is left at the airport on a round trip, to drive home in.');
      expect(byCarRefusal(sim, p, 'us-ca-losangeles', out, back, 'car-x')).toBe('That isn’t a car of yours to drive.');
      const r = sim.execute<{ journeyId: string; returnId?: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot, returnDay: day + 3 * MS_DAY, returnSlot: slot, ground: 'car', carId: 'car-1' } });
      if (r.ok) booked = r.value!;
    }
    expect(booked?.returnId).toBeDefined();
    const out = journeysOf(p).find((j) => j.id === booked!.journeyId)!;
    const back = journeysOf(p).find((j) => j.id === booked!.returnId)!;
    expect(out.parked).toEqual({ vehicleId: 'car-1', iata: 'LAX' });
    expect(out.legs[0]!.fare).toBe(0);
    expect(back.legs[back.legs.length - 1]!.fare).toBe(0);
    const owed = parkingFee(sim, 'LAX', out.legs[0]!.arriveAt, back.legs[back.legs.length - 1]!.departAt);
    // LAX's Budget Parking, $20 a day, for the three days and more it stood.
    expect(owed).toBeGreaterThanOrEqual(inSaveMoney(sim, 60_00, 'USD'));
    sim.advanceTo(back.arriveAt + 60_000);
    const paid = Object.values(sim.universe.transactions).filter((t) => t.memo === 'Airport parking, LAX');
    expect(paid).toHaveLength(1);
  });
});
