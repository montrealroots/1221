/**
 * SLATE — a dog or a cat of one's own (from 2026-10-03;
 * `docs/research/world/research-pets-property.json`, each shelter's, city's,
 * charity's and airline's own page unless marked).
 *
 * **Adopted** at a named shelter where you live, at its own fee: the ASPCA's
 * $150 in New York, LA Animal Services' $102 for a dog and $25 for a cat,
 * New Haven's shelter's $90 (read secondhand), Battersea's £230 and £100,
 * Dogs Trust Ireland's €275, the Toronto Humane Society's C$550 and C$225, the
 * BC SPCA's C$500 and C$300, and Mexico City's Brigada de Vigilancia Animal,
 * free (read secondhand). A shelter's animal comes spayed or neutered.
 *
 * **Licensed** where the town asks it, each year at the altered animal's
 * fee: New York's $8.50 for a dog, Los Angeles's $20, Connecticut's $7 and
 * the clerk's $1, Dublin's €20, Toronto's C$25 for a dog and C$15 for a cat,
 * Vancouver's C$68 (read secondhand). Britain asks only a microchip.
 *
 * **Kept** at the published yearly cost, a twelfth a month: the ASPCA's
 * $1,391 for a dog and $1,149 for a cat in America; the PDSA's least for a
 * medium dog, £83 a month, in Britain; Dogs Trust Ireland's €1,600 a year;
 * the middle of Rover's Canadian ranges, C$2,492.50 and C$1,665. A cat in
 * Britain or Ireland, and either in Mexico, has no yearly figure read, and
 * costs nothing more.
 *
 * **Away**, a pet needs someone: a partner living there, a sitter booked
 * through the trip, or the pet along. Along, a named hotel must take pets,
 * at its own fee, and a flight takes it in the cabin at the airline's: Delta's
 * $150 each way in America, Air Canada's C$55 (the middle of its C$50 to
 * C$60), Aeroméxico's MX$1,520 (read secondhand); Aer Lingus and British
 * Airways take none in the cabin. A job's trip is the production's, and
 * isn't held up.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { contactsOf } from './people';
import { sitterThrough } from './away';
import { HOTEL_AMENITIES } from '../content/hotelamenities';

export type Species = 'dog' | 'cat';
export interface Pet { id: string; species: Species; name: string; adoptedAt: Instant; from: string; licensedUntil?: Instant }
export interface Shelter { id: string; cityId: string; name: string; species: Species; fee: number; currency: string; confirmed: boolean }

export const SHELTERS: readonly Shelter[] = [
  { id: 'aspca-dog', cityId: 'us-ny-newyork', name: 'The ASPCA Adoption Center', species: 'dog', fee: 150, currency: 'USD', confirmed: true },
  { id: 'aspca-cat', cityId: 'us-ny-newyork', name: 'The ASPCA Adoption Center', species: 'cat', fee: 150, currency: 'USD', confirmed: true },
  { id: 'la-animal-services-dog', cityId: 'us-ca-losangeles', name: 'LA Animal Services', species: 'dog', fee: 102, currency: 'USD', confirmed: true },
  { id: 'la-animal-services-cat', cityId: 'us-ca-losangeles', name: 'LA Animal Services', species: 'cat', fee: 25, currency: 'USD', confirmed: true },
  { id: 'new-haven-shelter-dog', cityId: 'us-ct-newhaven', name: 'The New Haven Animal Shelter', species: 'dog', fee: 90, currency: 'USD', confirmed: false },
  { id: 'new-haven-shelter-cat', cityId: 'us-ct-newhaven', name: 'The New Haven Animal Shelter', species: 'cat', fee: 90, currency: 'USD', confirmed: false },
  { id: 'battersea-dog', cityId: 'uk-eng-london', name: 'Battersea', species: 'dog', fee: 230, currency: 'GBP', confirmed: true },
  { id: 'battersea-cat', cityId: 'uk-eng-london', name: 'Battersea', species: 'cat', fee: 100, currency: 'GBP', confirmed: true },
  { id: 'dogs-trust-ireland', cityId: 'ie-lei-dublin', name: 'Dogs Trust Ireland', species: 'dog', fee: 275, currency: 'EUR', confirmed: true },
  { id: 'toronto-humane-dog', cityId: 'ca-on-toronto', name: 'The Toronto Humane Society', species: 'dog', fee: 550, currency: 'CAD', confirmed: true },
  { id: 'toronto-humane-cat', cityId: 'ca-on-toronto', name: 'The Toronto Humane Society', species: 'cat', fee: 225, currency: 'CAD', confirmed: true },
  { id: 'bc-spca-dog', cityId: 'ca-bc-vancouver', name: 'The BC SPCA', species: 'dog', fee: 500, currency: 'CAD', confirmed: true },
  { id: 'bc-spca-cat', cityId: 'ca-bc-vancouver', name: 'The BC SPCA', species: 'cat', fee: 300, currency: 'CAD', confirmed: true },
  { id: 'brigada-dog', cityId: 'mx-cmx-mexicocity', name: 'La Brigada De Vigilancia Animal', species: 'dog', fee: 0, currency: 'MXN', confirmed: false },
  { id: 'brigada-cat', cityId: 'mx-cmx-mexicocity', name: 'La Brigada De Vigilancia Animal', species: 'cat', fee: 0, currency: 'MXN', confirmed: false },
];

/** A year's license for an altered animal, by town and species, where one is asked. */
export const LICENCE: Readonly<Record<string, Partial<Record<Species, { fee: number; currency: string }>>>> = {
  'us-ny-newyork': { dog: { fee: 8.5, currency: 'USD' } },
  'us-ca-losangeles': { dog: { fee: 20, currency: 'USD' } },
  'us-ct-newhaven': { dog: { fee: 8, currency: 'USD' } },
  'ie-lei-dublin': { dog: { fee: 20, currency: 'EUR' } },
  'ca-on-toronto': { dog: { fee: 25, currency: 'CAD' }, cat: { fee: 15, currency: 'CAD' } },
  'ca-bc-vancouver': { dog: { fee: 68, currency: 'CAD' } },
};

/** A year's keeping, by country and species. */
export const KEEPING: Readonly<Record<string, Partial<Record<Species, { perYear: number; currency: string }>>>> = {
  us: { dog: { perYear: 1_391, currency: 'USD' }, cat: { perYear: 1_149, currency: 'USD' } },
  uk: { dog: { perYear: 83 * 12, currency: 'GBP' } },
  ie: { dog: { perYear: 1_600, currency: 'EUR' } },
  ca: { dog: { perYear: (965 + 4_020) / 2, currency: 'CAD' }, cat: { perYear: (930 + 2_400) / 2, currency: 'CAD' } },
};

/** A pet in the cabin, one way, by the country flown from; null where the airline takes none. */
export const CABIN_FEE: Readonly<Record<string, { fee: number; currency: string } | null>> = {
  us: { fee: 150, currency: 'USD' },
  ca: { fee: 55, currency: 'CAD' },
  mx: { fee: 1_520, currency: 'MXN' },
  ie: null,
  uk: null,
};

export const PET_MONTH_KIND = 'pets.month';
export const petsOf = (person: Person): Pet[] => (person.pets ??= []);
export const sheltersIn = (cityId: string): Shelter[] => SHELTERS.filter((s) => s.cityId === cityId);

export function adoptRefusal(person: Person, shelterId: string): string | undefined {
  const s = SHELTERS.find((x) => x.id === shelterId);
  if (!s) return 'There’s no such shelter.';
  if (!person.home || person.home.kind === 'sofa') return 'A pet needs a home of your own.';
  if (person.home.cityId !== s.cityId || person.currentLocationId !== s.cityId) return `${s.name} rehomes to people living in ${CITIES.require(s.cityId).name}.`;
  return undefined;
}

/** A pet's month: its keeping, and its license when due. */
function petMonth(sim: Simulation, person: Person, pet: Pet): void {
  const country = CITIES.get(person.home?.cityId ?? '')?.countryId ?? '';
  const keep = KEEPING[country]?.[pet.species];
  if (keep) spend(sim, person, inSaveMoney(sim, Math.round((keep.perYear / 12) * 100), keep.currency), `${pet.name}: food, care and the vet`, 'personal', true);
  const lic = LICENCE[person.home?.cityId ?? '']?.[pet.species];
  if (lic && (pet.licensedUntil ?? 0) <= sim.now) {
    spend(sim, person, inSaveMoney(sim, Math.round(lic.fee * 100), lic.currency), `${pet.name}'s license`, 'personal', true);
    pet.licensedUntil = sim.now + 365 * MS_DAY;
  }
}

/** Why a trip can't leave them, or nothing: a partner home, a sitter through it, or the pets along. */
export function petCareRefusal(person: Person, from: Instant, to: Instant, along: boolean): string | undefined {
  const pets = petsOf(person);
  if (pets.length === 0 || along) return undefined;
  if (contactsOf(person).some((c) => c.livesWith !== undefined)) return undefined;
  if (sitterThrough(person, from, to)) return undefined;
  const who = pets.length === 1 ? pets[0]!.name : 'Your pets';
  return `${who} can’t be left: book a sitter through the trip, or take ${pets.length === 1 ? (pets[0]!.species === 'dog' ? 'the dog' : 'the cat') : 'them'} along.`;
}

/** A named hotel's own fee for the pets for some nights, or why it won't have them; nothing where there are none or no named hotel. */
export function hotelPetFee(sim: Simulation, person: Person, hotelId: string | undefined, nights: number): Money | string {
  const pets = petsOf(person);
  if (pets.length === 0 || nights <= 0) return 0;
  if (!hotelId) return 'Choose a hotel that takes pets.';
  const rule = HOTEL_AMENITIES.find((a) => a.id === hotelId)?.pets;
  if (!rule || rule.allowed !== true) return 'That hotel takes no pets, or doesn’t say it does.';
  if (!rule.fee || !rule.currency) return 0;
  return inSaveMoney(sim, Math.round(rule.fee * (rule.per === 'night' ? nights : 1) * 100), rule.currency) * pets.length;
}

/** The cabin fee for the pets on a flight out of a country, or why they can't fly; nothing where there are none. */
export function cabinFeeFor(sim: Simulation, person: Person, fromCityId: string, flights: number): Money | string {
  const pets = petsOf(person);
  if (pets.length === 0 || flights === 0) return 0;
  const country = CITIES.get(fromCityId)?.countryId ?? '';
  const fee = CABIN_FEE[country];
  if (fee === null) return 'Its airlines take no pet in the cabin.';
  if (!fee) return 'SLATE keeps no airline’s pet fee here.';
  return inSaveMoney(sim, Math.round(fee.fee * 100), fee.currency) * pets.length;
}

export function registerPets(sim: Simulation): void {
  sim.onCommand<{ shelterId: string; name?: string }, { paid: Money; petId: string }>('pets.adopt', (p, { sim: s }) => {
    const person = s.player;
    const no = adoptRefusal(person, String(p?.shelterId));
    if (no) throw new CommandError(no);
    const shelter = SHELTERS.find((x) => x.id === p.shelterId)!;
    const paid = inSaveMoney(s, Math.round(shelter.fee * 100), shelter.currency);
    if (paid > 0 && !spend(s, person, paid, `${shelter.name}, an adoption`, 'personal')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(s.universe))}, more than you can pay.`);
    const pet: Pet = { id: s.nextId('pet'), species: shelter.species, name: String(p?.name ?? '').trim() || (shelter.species === 'dog' ? 'Your Dog' : 'Your Cat'), adoptedAt: s.now, from: shelter.id };
    petsOf(person).push(pet);
    petMonth(s, person, pet);
    s.schedule({ at: s.now + 30 * MS_DAY, kind: PET_MONTH_KIND, label: `${pet.name}'s Month`, category: 'home', priority: 30, payload: { personId: person.id, petId: pet.id } });
    return { paid, petId: pet.id };
  });
  sim.onSchedule(PET_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const pet = person ? petsOf(person).find((x) => x.id === item.payload.petId) : undefined;
    if (!person || !pet) return;
    petMonth(s, person, pet);
    s.schedule({ at: item.at + 30 * MS_DAY, kind: PET_MONTH_KIND, label: `${pet.name}'s Month`, category: 'home', priority: 30, payload: { personId: person.id, petId: pet.id } });
  });
}
