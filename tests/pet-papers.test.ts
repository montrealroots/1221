/**
 * A pet's papers got and checked (`pets.chip`, `pets.certificate`,
 * `pets.tapeworm`, `pets.import_form`, `arrivalFee`, from 2026-10-04): each at
 * a vet where they live at its price, a pet adopted where the law asks a chip
 * coming chipped, and a trip abroad made with them, paying the fee on arrival.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { salesTaxRate } from '@/engine/content/tax';
import { HOTELS } from '@/engine/content/hotels';
import { HOTEL_AMENITIES } from '@/engine/content/hotelamenities';
import { arrivalFee, certificatePrice, chipPrice, entryMissing, hotelPetFee, petFlightFee, petsOf, vetPrice } from '@/engine/systems/pets';
import { journeysOf } from '@/engine/systems/journey';

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

describe('a pet’s papers', () => {
  it('chips at the town’s named clinic with its tax, once, and certifies all the pets at the vet’s visit and APHIS’s endorsement', () => {
    const sim = life('us-ny-newyork', 'papers-ny');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    const [rex, mog] = petsOf(sim.player);
    expect(rex!.chippedAt).toBeUndefined();
    expect(chipPrice(sim, sim.player)).toBe(Math.round(inSaveMoney(sim, 41_00, 'USD') * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods'))));
    sim.must({ kind: 'pets.chip', payload: { petId: rex!.id } });
    expect(rex!.chippedAt).toBe(sim.now);
    expect(sim.execute({ kind: 'pets.chip', payload: { petId: rex!.id } }).error).toBe('Rex is chipped already.');
    // New York keeps no vet's own certificate: the vet's visit a pet, and APHIS's $101 once.
    const visits = (vetPrice(sim, sim.player, rex!) as number) + (vetPrice(sim, sim.player, mog!) as number);
    expect(certificatePrice(sim, sim.player)).toBe(visits + inSaveMoney(sim, 101_00, 'USD'));
    const r = sim.must<{ paid: number }>({ kind: 'pets.certificate', payload: { to: 'uk' } });
    expect(r.paid).toBe(visits + inSaveMoney(sim, 101_00, 'USD'));
    expect(rex!.certificate).toEqual({ to: 'uk', at: sim.now });
    expect(mog!.certificate).toEqual({ to: 'uk', at: sim.now });
    // The tapeworm treatment and the CDC's form are a dog's.
    expect(sim.execute({ kind: 'pets.tapeworm', payload: { petId: mog!.id } }).error).toBe('That isn’t a dog of yours.');
    sim.must({ kind: 'pets.tapeworm', payload: { petId: rex!.id } });
    expect(rex!.tapewormAt).toBe(sim.now);
    sim.must({ kind: 'pets.import_form', payload: { petId: rex!.id } });
    expect(rex!.importFormAt).toBe(sim.now);
  });

  it('comes chipped from a shelter where the law asks it, and London’s certificate is its vet’s, the first and each more', () => {
    const sim = life('uk-eng-london', 'papers-ldn');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'battersea-dog', name: 'Rex' } });
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'battersea-cat', name: 'Mog' } });
    expect(petsOf(sim.player).every((p) => p.chippedAt === sim.now || p.chippedAt !== undefined)).toBe(true);
    expect(chipPrice(sim, sim.player)).toBe('SLATE keeps no microchip price here.');
    expect(certificatePrice(sim, sim.player)).toBe(inSaveMoney(sim, (232 + 75) * 100, 'GBP'));
    // A New York shelter's dog comes without one.
    const ny = life('us-ny-newyork', 'papers-ny2');
    ny.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog' } });
    expect(petsOf(ny.player)[0]!.chippedAt).toBeUndefined();
  });

  it('charges Heathrow on arriving with the pets, and Canada’s inspection but from America', () => {
    const sim = life('ie-lei-dublin', 'papers-arrive');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'dogs-trust-ireland', name: 'Rua' } });
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'dogs-trust-ireland', name: 'Bran' } });
    expect(arrivalFee(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london')).toBe(inSaveMoney(sim, (213 + 55) * 100, 'GBP'));
    expect(arrivalFee(sim, sim.player, 'uk-eng-london', 'ie-lei-dublin')).toBe(0);
    expect(arrivalFee(sim, sim.player, 'uk-eng-london', 'ca-on-toronto')).toBe(inSaveMoney(sim, Math.round((36.95 + 6.16) * 100), 'CAD'));
    expect(arrivalFee(sim, sim.player, 'us-ny-newyork', 'ca-on-toronto')).toBe(0);
    expect(arrivalFee(sim, sim.player, 'ca-bc-vancouver', 'ca-on-toronto')).toBe(0);
  });
});

describe('a trip to London with the dog', () => {
  it('is refused until its papers are good on arrival, then booked with the hold, Heathrow and the hotel paid', () => {
    const sim = life('ie-lei-dublin', 'papers-trip');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'dogs-trust-ireland', name: 'Rua' } });
    const rua = petsOf(sim.player)[0]!;
    // Chipped by Irish law, vaccinated at the shelter: 21 days must pass, and the papers come near the day.
    expect(rua.chippedAt).toBeDefined();
    const hotel = HOTELS.find((h) => h.cityId === 'uk-eng-london' && HOTEL_AMENITIES.find((a) => a.id === h.id)?.pets?.allowed === true);
    expect(hotel).toBeDefined();
    const day = saturday(sim, 28);
    const trip = { toCity: 'uk-eng-london', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1, withPets: true, hotelId: hotel!.id, room: hotel!.rooms[0]!.name };
    expect(sim.execute({ kind: 'travel.book', payload: trip }).error).toBe('London asks more of Rua (A Health Certificate, A Tapeworm Treatment) on arriving.');
    // Two days before: the certificate and the treatment, then booked.
    sim.advanceTo(day - 2 * MS_DAY);
    sim.must({ kind: 'pets.certificate', payload: { to: 'uk' } });
    sim.must({ kind: 'pets.tapeworm', payload: { petId: rua.id } });
    // An Irish vet's is the EU pet passport.
    expect(rua.certificate?.passport).toBe(true);
    expect(entryMissing(rua, 'ie', 'uk', day + 3 * 3_600_000)).toEqual([]);
    const r = sim.execute<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: trip });
    expect(r.ok, r.error).toBe(true);
    // The way out carries the pets' share: the hold each way, Heathrow's fee on arriving, and the hotel's.
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    const legs = out.legs.reduce((x, l) => x + l.fare, 0);
    const pets = (petFlightFee(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london', 1) as number) + (petFlightFee(sim, sim.player, 'uk-eng-london', 'ie-lei-dublin', 1) as number) + inSaveMoney(sim, 213_00, 'GBP') + (hotelPetFee(sim, sim.player, hotel!.id, out.hotel!.nights) as number);
    expect(out.total - legs - out.hotel!.price).toBe(pets);
  });
});
