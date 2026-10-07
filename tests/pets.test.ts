/**
 * A dog or a cat (`systems/pets.ts`, from 2026-10-03): adopted at a named
 * shelter's fee, licensed where the town asks, kept at the published yearly
 * cost, and on a trip looked after, or along at the hotel's and the
 * airline's own pet fees.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { inSaveMoney } from '@/engine/systems/banking';
import { LICENCE, adoptRefusal, hotelPetFee, petFlightFee, petsOf } from '@/engine/systems/pets';
import { journeysOf } from '@/engine/systems/journey';
import { contactsOf, newContact } from '@/engine/systems/people';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 50_000_00, 'USD');
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
const memos = (sim: Simulation, start: string) => sim.universe.transactions.filter((t) => t.memo.startsWith(start));

describe('a pet', () => {
  it('is adopted at the shelter’s fee where you live, licensed and kept each month', () => {
    const sim = life('us-ny-newyork', 'pet-adopt');
    expect(adoptRefusal(sim.player, 'battersea-dog')).toBe('Battersea rehomes to people living in London.');
    const r = sim.must<{ paid: number; petId: string }>({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    expect(r.paid).toBe(inSaveMoney(sim, 150_00, 'USD'));
    expect(petsOf(sim.player).map((p) => p.name)).toEqual(['Rex']);
    // From 2026-10-04 its keeping is thing by thing (tests/pet-care.test.ts), not a yearly figure a month.
    expect(memos(sim, 'Rex: food, care and the vet')).toHaveLength(0);
    expect(memos(sim, 'Rex\'s license')).toHaveLength(1);
    expect(LICENCE['us-ny-newyork']!.dog!.fee).toBe(8.5);
    sim.advanceBy(31 * MS_DAY);
    expect(memos(sim, 'Rex: food, care and the vet')).toHaveLength(0);
    // The license runs a year.
    expect(memos(sim, 'Rex\'s license')).toHaveLength(1);
  });

  it('can’t be left at home on a trip without someone: a partner, a sitter, or along', () => {
    const sim = life('us-ny-newyork', 'pet-trip');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    const day = saturday(sim, 14);
    const trip = { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1 };
    expect(sim.execute({ kind: 'travel.book', payload: trip }).error).toBe('Mog can’t be left: book a sitter through the trip, or take the cat along.');
    // Along: a hotel that takes pets, at its own fee, and Delta's $150 each way.
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'travel.book', payload: { ...trip, withPets: true } }).error).toBe('Choose a hotel that takes pets.');
    const r = sim.must<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: { ...trip, withPets: true, hotelId: 'freehand-los-angeles', room: 'Deluxe King ADA' } });
    const out = journeysOf(sim.player).find((j) => j.id === r.journeyId)!;
    const fee = hotelPetFee(sim, sim.player, 'freehand-los-angeles', out.hotel!.nights) as number;
    expect(fee).toBe(inSaveMoney(sim, 75_00, 'USD'));
    expect(petFlightFee(sim, sim.player, 'us-ny-newyork', 'us-ca-losangeles', 1)).toBe(inSaveMoney(sim, 150_00, 'USD'));
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(r.total);
    // The hotel's fee and the cabin each way are paid with the way out.
    const legs = out.legs.reduce((x, l) => x + l.fare, 0);
    expect(out.total - legs - out.hotel!.price).toBe(fee + 2 * inSaveMoney(sim, 150_00, 'USD'));
    // A partner home looks after it.
    const other = life('us-ny-newyork', 'pet-partner');
    other.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    const partner = newContact(other, other.player, 'us-ny-newyork', 'pet-partner-c', { at: other.now, how: 'school' });
    partner.livesWith = other.now;
    contactsOf(other.player).push(partner);
    expect(other.execute({ kind: 'travel.book', payload: { ...trip, day: saturday(other, 14), returnDay: saturday(other, 14) + 3 * MS_DAY } }).ok).toBe(true);
  });

  it('flies a 20 kg dog in the hold, at the carrier’s own fare in or out of its country, never in a cabin', () => {
    const sim = life('ie-lei-dublin', 'pet-ie');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'dogs-trust-ireland', name: 'Rua' } });
    // Aer Lingus and British Airways: cargo only, at the stand-ins kept for a quote on request.
    expect(petFlightFee(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london', 1)).toBe(inSaveMoney(sim, 1_500_00, 'EUR'));
    expect(petFlightFee(sim, sim.player, 'uk-eng-london', 'ie-lei-dublin', 1)).toBe(inSaveMoney(sim, 2_600_00, 'GBP'));
    // Air Canada checks it: America priced as Canada is, further abroad dearer.
    const toronto = Date.UTC(2026, 9, 10, 15);
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, toronto)).toBe(inSaveMoney(sim, 105_00, 'CAD'));
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'uk-eng-london', 1, toronto)).toBe(inSaveMoney(sim, 270_00, 'CAD'));
    // But not over the holidays.
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, Date.UTC(2026, 11, 20, 15))).toBe('Air Canada carries no pets in the hold from 18 December to 4 January.');
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, Date.UTC(2027, 0, 3, 15))).toMatch(/no pets in the hold/);
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, Date.UTC(2027, 0, 6, 15))).toBe(inSaveMoney(sim, 105_00, 'CAD'));
    // Out of America Delta's hold takes none for an ordinary passenger; from 2026-10-06 Alaska is named in its place.
    expect(petFlightFee(sim, sim.player, 'us-ny-newyork', 'us-ca-losangeles', 1)).toMatch(/^Rua: Delta checks no pets.*Alaska Airlines checks one/);
    // Aeromexico: the hold, in pesos either way.
    expect(petFlightFee(sim, sim.player, 'mx-cmx-mexicocity', 'us-ny-newyork', 1)).toBe(inSaveMoney(sim, 5_570_00, 'MXN'));
    // Each pet its own, and none without a flight.
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'dogs-trust-ireland' } });
    expect(petFlightFee(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london', 1)).toBe(2 * inSaveMoney(sim, 1_500_00, 'EUR'));
    expect(petFlightFee(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london', 0)).toBe(0);
  });

  it('flies a 4 kg cat in the cabin where the carrier takes one there, at its fare in or out of the country', () => {
    const sim = life('us-ny-newyork', 'pet-cat-fly');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'us-ny-newyork', 1, Date.UTC(2026, 11, 20, 15))).toBe(inSaveMoney(sim, 50_00, 'CAD'));
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'ie-lei-dublin', 1)).toBe(inSaveMoney(sim, 100_00, 'CAD'));
    // Britain takes no pet arriving in a cabin: it comes in the hold.
    expect(petFlightFee(sim, sim.player, 'ca-on-toronto', 'uk-eng-london', 1)).toBe(inSaveMoney(sim, 270_00, 'CAD'));
    // Aeromexico prices the cabin within Mexico in pesos and abroad in dollars.
    expect(petFlightFee(sim, sim.player, 'mx-cmx-mexicocity', 'mx-cmx-mexicocity', 1)).toBe(inSaveMoney(sim, 1_520_00, 'MXN'));
    expect(petFlightFee(sim, sim.player, 'mx-cmx-mexicocity', 'us-ny-newyork', 1)).toBe(inSaveMoney(sim, 182_00, 'USD'));
    // British Airways takes no cat in the cabin: it goes as cargo.
    expect(petFlightFee(sim, sim.player, 'uk-eng-london', 'us-ny-newyork', 1)).toBe(inSaveMoney(sim, 2_600_00, 'GBP'));
  });
});
