/**
 * The pets on the day of the flight (from 2026-10-06): the way home's papers
 * held on the day as the way out's are, the hold's temperatures read in the
 * weather (`embargoRefusal`), and a carrier chosen in place of the flag
 * carrier, Alaska's and WestJet's own fees and rules
 * (`research-pet-embargo.json`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { HOTELS } from '@/engine/content/hotels';
import { HOTEL_AMENITIES } from '@/engine/content/hotelamenities';
import { embargoRefusal, petCarrierFor, petFlightFee, petsOf, type Pet } from '@/engine/systems/pets';
import { journeysOf } from '@/engine/systems/journey';
import { weatherAt } from '@/engine/systems/weather';

const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSaveMoney(sim, 50_000_00, 'USD');
  return sim;
};
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}
const dog = (sim: Simulation): Pet => ({ id: 'd', species: 'dog', name: 'Rex', adoptedAt: sim.now - 400 * MS_DAY, from: 'x' });

/** Dublin to London with the dog and back three days on, its papers got two days before it leaves; a fresh tapeworm treatment in London where asked. */
function londonAndBack(seed: string, treatAgain: boolean) {
  const sim = life('ie-lei-dublin', seed);
  sim.must({ kind: 'pets.adopt', payload: { shelterId: 'dogs-trust-ireland', name: 'Rua' } });
  const rua = petsOf(sim.player)[0]!;
  const hotel = HOTELS.find((h) => h.cityId === 'uk-eng-london' && HOTEL_AMENITIES.find((a) => a.id === h.id)?.pets?.allowed === true)!;
  const day = saturday(sim, 28);
  sim.advanceTo(day - 2 * MS_DAY);
  sim.must({ kind: 'pets.certificate', payload: { to: 'uk' } });
  sim.must({ kind: 'pets.tapeworm', payload: { petId: rua.id } });
  const r = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'uk-eng-london', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1, withPets: true, hotelId: hotel.id, room: hotel.rooms[0]!.name } });
  const out = journeysOf(sim.player).find((j) => j.id === r.journeyId)!;
  const back = journeysOf(sim.player).find((j) => j.id === r.returnId)!;
  expect(out.pets).toEqual({});
  sim.advanceTo(out.arriveAt + 8 * MS_HOUR);
  expect(sim.player.currentLocationId).toBe('uk-eng-london');
  if (treatAgain) {
    sim.advanceTo(back.leaveAt - 2 * MS_DAY);
    sim.must({ kind: 'pets.tapeworm', payload: { petId: rua.id } });
  }
  sim.advanceTo(back.arriveAt + 8 * MS_HOUR);
  return { sim, back };
}

describe('the way home on the day', () => {
  it('holds the dog to Ireland’s tapeworm treatment 24 to 120 hours before landing: lapsed, refused at check-in; renewed in London, flown', () => {
    // Booked, the way home asked only what lasts (`lasting`); on the day the treatment from before the way out is
    // five days old and more. Until 2026-10-06 nothing looked again, and Rua flew home without it.
    const lapsed = londonAndBack('pet-day-lapsed', false);
    expect(lapsed.back.status).toBe('missed');
    expect(lapsed.back.why).toBe('The pets weren’t taken: Dublin asks more of Rua (A Tapeworm Treatment) on arriving.');
    expect(lapsed.sim.player.currentLocationId).toBe('uk-eng-london');
    expect(lapsed.sim.universe.notifications.some((n) => n.title === 'Refused At Check-In' && /Tapeworm/.test(n.body))).toBe(true);
    const renewed = londonAndBack('pet-day-renewed', true);
    expect(renewed.back.status).not.toBe('missed');
    expect(renewed.sim.player.currentLocationId).toBe('ie-lei-dublin');
  });
});

describe('the hold’s temperatures', () => {
  it('reads Air Canada’s 29.5°C at the destination only in its windows, Alaska’s 85°F and 45°F at both ends, and a cat in the cabin never', () => {
    const sim = life('ca-on-toronto', 'pet-day-heat');
    sim.player.pets = [dog(sim)];
    // Las Vegas in July in the afternoon: America's window, and its heat.
    const july = Date.UTC(2026, 6, 15, 23);
    const t = weatherAt(sim, 'us-nv-lasvegas', july)!.temperatureC;
    expect(t).toBeGreaterThan(29.5);
    expect(embargoRefusal(sim, sim.player, 'ca-on-toronto', 'us-nv-lasvegas', july - 5 * MS_HOUR, july)).toBe(`Air Canada won’t fly Rex in the hold: it’s ${t}°C in Las Vegas, over the 29.5°C it flies pets in.`);
    // Britain is in none of its windows: no temperature is read there, whatever July brings.
    const london = Date.UTC(2026, 6, 15, 14);
    expect(embargoRefusal(sim, sim.player, 'ca-on-toronto', 'uk-eng-london', london - 7 * MS_HOUR, london)).toBeUndefined();
    // Alaska, New York's January morning under its 45°F, read at the end it leaves from.
    const ny = life('us-ny-newyork', 'pet-day-cold');
    ny.player.pets = [dog(ny)];
    const jan = Date.UTC(2027, 0, 12, 12);
    const cold = weatherAt(ny, 'us-ny-newyork', jan)!.temperatureC;
    expect(cold).toBeLessThan((45 - 32) * 5 / 9);
    expect(embargoRefusal(ny, ny.player, 'us-ny-newyork', 'us-ca-losangeles', jan, jan + 6 * MS_HOUR, 'alaska')).toMatch(/^Alaska Airlines won’t fly Rex in the hold: it’s -?\d+°C in New York, under the 7\.2°C/);
    // A cat flies in Alaska's cabin, and no temperature is read.
    ny.player.pets = [{ ...dog(ny), species: 'cat', name: 'Mog' }];
    expect(embargoRefusal(ny, ny.player, 'us-ny-newyork', 'us-ca-losangeles', jan, jan + 6 * MS_HOUR, 'alaska')).toBeUndefined();
    // Delta keeps none, as it takes no dog in the hold at all.
    expect(embargoRefusal(ny, ny.player, 'us-ny-newyork', 'us-ca-losangeles', jan, jan + 6 * MS_HOUR)).toBeUndefined();
  });

  it('turns a dog booked on Alaska back at the airport on a cold New York morning, and the fare is gone', () => {
    const sim = life('us-ny-newyork', 'pet-day-alaska');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    const day = saturday(sim, 7);
    const trip = { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1, withPets: true, hotelId: 'freehand-los-angeles', room: 'Deluxe King ADA' };
    // Delta's hold takes none; Alaska's does, at $200 each way.
    expect(sim.execute({ kind: 'travel.book', payload: trip }).error).toMatch(/^Rex: Delta checks no pets/);
    const r = sim.must<{ journeyId: string }>({ kind: 'travel.book', payload: { ...trip, petCarrier: 'alaska' } });
    expect(petFlightFee(sim, sim.player, 'us-ny-newyork', 'us-ca-losangeles', 1, sim.now, 'alaska')).toBe(inSaveMoney(sim, 200_00, 'USD'));
    const out = journeysOf(sim.player).find((j) => j.id === r.journeyId)!;
    expect(out.pets).toEqual({ carrier: 'alaska' });
    const t = weatherAt(sim, 'us-ny-newyork', out.leaveAt)!.temperatureC;
    // A January morning in New York, under Alaska's 45°F.
    expect(t).toBeLessThan((45 - 32) * 5 / 9);
    sim.advanceTo(out.leaveAt + MS_HOUR);
    expect(out.status).toBe('missed');
    expect(out.why).toMatch(/^The pets weren’t taken: Alaska Airlines won’t fly Rex in the hold/);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
  });
});

describe('a carrier chosen in place of the flag carrier', () => {
  it('prices WestJet’s hold as Canada within Canada and America, closes its summer towns, and isn’t kept across the Atlantic', () => {
    const sim = life('ca-on-toronto', 'pet-day-westjet');
    sim.player.pets = [dog(sim)];
    const may = Date.UTC(2026, 4, 2, 15);
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, may, 'westjet')).toBe(inSaveMoney(sim, 100_00, 'CAD'));
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'ca-bc-vancouver', 1, may, 'westjet')).toBe(inSaveMoney(sim, 100_00, 'CAD'));
    // Las Vegas, one of its sixteen, from 15 May to 31 October; not before.
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-nv-lasvegas', 1, may, 'westjet')).toBe(inSaveMoney(sim, 100_00, 'CAD'));
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-nv-lasvegas', 1, Date.UTC(2026, 4, 20, 15), 'westjet')).toBe('WestJet checks no pets to or from Las Vegas from 15 May to 31 October.');
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, Date.UTC(2026, 11, 20, 15), 'westjet')).toBe('WestJet carries no pets in the hold from 18 December to 4 January.');
    expect(petCarrierFor('ca-on-toronto', 'uk-eng-london', 'westjet')).toBe('SLATE keeps WestJet’s pets between Canada and America only.');
    expect(petCarrierFor('us-ny-newyork', 'ca-on-toronto', 'alaska')).toBe('SLATE keeps Alaska Airlines’s pets within America only.');
    // A cat in WestJet's cabin, CAD 50.
    sim.player.pets = [{ ...dog(sim), species: 'cat', name: 'Mog' }];
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, may, 'westjet')).toBe(inSaveMoney(sim, 50_00, 'CAD'));
  });
});
