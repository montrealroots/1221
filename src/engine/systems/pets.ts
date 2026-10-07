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
 * **Kept** thing by thing (from 2026-10-04, `content/petcare.ts`; until then
 * at a yearly figure a twelfth a month, the ASPCA's, the PDSA's, Dogs Trust
 * Ireland's and Rover's, and a cat in Britain, Ireland or Mexico, with none
 * read, cost nothing): its dry food bought at a named retailer's price and
 * fed a day's ration from the bag (`pets.feed`, or the Feed The Pets
 * shortcut); a cat's litter used by the week; a dog walked an hour a day by
 * you (`pets.walk`) or a walker at the town's rate (`pets.walker`); and a
 * yearly visit with its vaccines at the town's named vet (`pets.vet`), a
 * shelter's animal coming vaccinated. A day unfed or unwalked is said, and
 * counted. Away, a sitter feeds and walks it.
 *
 * **Away**, a pet needs someone: a partner living there, a sitter booked
 * through the trip, or the pet along. Along, a named hotel must take pets,
 * at its own fee, and a flight takes it in the cabin at the airline's: Delta's
 * $150 each way in America, Air Canada's C$55 (the middle of its C$50 to
 * C$60), Aeroméxico's MX$1,520 (read secondhand); Aer Lingus and British
 * Airways take none in the cabin. A job's trip is the production's, and
 * isn't held up.
 *
 * **On the day** (from 2026-10-06): a journey booked with the pets along
 * keeps them (`Journey.pets`), and at the airport each way their papers are
 * read again on landing, the way home's certificate and a dog's tapeworm
 * treatment with them, which booking looks past; and in the hold, the
 * carrier's temperatures (`embargoRefusal`). Short of either, the airline
 * won't take them, and the journey is refused at check-in as for a
 * passenger's papers. A carrier other than the flag carrier is chosen with
 * `petCarrier` (`petCarrierFor`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { CITIES, type City } from '../content/geography';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { contactsOf } from './people';
import { sitterThrough } from './away';
import { HOTEL_AMENITIES } from '../content/hotelamenities';
import { CABIN_MAX_KG, OTHER_PET_CARRIERS, PET_FLIGHT, PET_KG, type PetFare, type PetFlightRule } from '../content/petair';
import { weatherAt } from './weather';
import { PAPER_LABEL, PET_ENTRY, type EntryRule, type Paper } from '../content/petentry';
import { ARRIVAL_FEE, CERTIFICATE_FEE, CHIP_LAW, CHIP_PRICE, ENDORSEMENT } from '../content/petpapers';
import { KCAL_A_DAY, LITTERS, LITTER_KG_A_WEEK, PET_FOODS, RATION_KCAL_PER_KG, VET_YEAR, WALK, type PetMarket } from '../content/petcare';
import { homeKeyOf, itemsOf, type Item } from './items';
import { placeOrder } from './orders';
import { payFromBank, petArrives } from './household';
import { exerts } from './body';
import { isOn } from './automation';
import { countWash } from './water';
import { salesTaxRate } from '../content/tax';

export type Species = 'dog' | 'cat';
export interface Pet {
  id: string; species: Species; name: string; adoptedAt: Instant; from: string; licensedUntil?: Instant;
  /** The day it was last fed and, a dog, walked (from 2026-10-04); days running without; its vaccines good until; a walker booked. */
  fedOn?: string; walkedOn?: string; hungryDays?: number; unwalkedDays?: number; vetUntil?: Instant; walker?: true;
  /** A dog's last bath (from 2026-10-04), at home or at a groomer; until one, since it came. */
  groomedAt?: Instant;
  /** Its papers for going abroad (from 2026-10-04, `content/petentry.ts`): when chipped and last vaccinated against rabies, its health certificate and for where, its tapeworm treatment, the CDC's form. */
  chippedAt?: Instant; rabiesAt?: Instant; certificate?: { to: string; at: Instant; passport?: true }; tapewormAt?: Instant; importFormAt?: Instant;
}
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

/** A dog walker's half hour in each town (Rover, read secondhand; Dublin the middle of Pawshake's named walkers' €10 to €20). */
export const WALKER_30: Readonly<Record<string, { fee: number; currency: string }>> = {
  'us-ny-newyork': { fee: 24.42, currency: 'USD' }, 'us-ca-losangeles': { fee: 21.09, currency: 'USD' }, 'us-ct-newhaven': { fee: 22.2, currency: 'USD' },
  'uk-eng-london': { fee: 14.19, currency: 'GBP' }, 'ie-lei-dublin': { fee: 15, currency: 'EUR' },
};


/**
 * A dog's bath (from 2026-10-04): the ASPCA's at least once every three
 * months. A cat is brushed and bathed only when it needs it, so none is due.
 * Each town's named groomer, a medium dog's bath at its own list's price
 * (`research-pet-care.json`, read 2026-10-03; New Haven's secondhand from its
 * booking page's summary, Mexico City's the basic package). Toronto's is before
 * Ontario's HST, the others as listed. A bath at home is SLATE's estimate: half
 * an hour, and a bath's water.
 */
export const GROOM_EVERY_DAYS = 90;
export const HOME_BATH_MINUTES = 30;
export const GROOMERS: Readonly<Record<string, { name: string; bath: number; currency: string; plusTax?: true }>> = {
  'us-ny-newyork': { name: 'Urban Woof NYC', bath: 90, currency: 'USD' },
  'us-ca-losangeles': { name: 'Mobile Dog Grooming LA', bath: 85, currency: 'USD' },
  'us-ct-newhaven': { name: 'Pawtero', bath: 69, currency: 'USD' },
  'uk-eng-london': { name: 'Dogtown', bath: 53, currency: 'GBP' },
  'ie-lei-dublin': { name: 'Glamour Dogs', bath: 45, currency: 'EUR' },
  'ca-on-toronto': { name: 'K9+', bath: 105, currency: 'CAD', plusTax: true },
  'ca-bc-vancouver': { name: 'Woof & Meow Spa', bath: 95, currency: 'CAD' },
  'mx-cmx-mexicocity': { name: 'Barbacan', bath: 295, currency: 'MXN' },
};

/** When a dog's next bath is due: three months from its last, or from when it came. */
export const groomDue = (pet: Pet): Instant => (pet.groomedAt ?? pet.adoptedAt) + GROOM_EVERY_DAYS * MS_DAY;

/** The groomer's bath where they live, in the save's money, or why there isn't one. */
export function groomerPrice(sim: Simulation, person: Person): Money | string {
  const g = GROOMERS[person.home?.cityId ?? ''];
  if (!g) return 'SLATE keeps no groomer where you live.';
  return Math.round(inSaveMoney(sim, Math.round(g.bath * 100), g.currency) * (g.plusTax ? 1 + salesTaxRate(person.home!.cityId, sim.now, 'goods') : 1));
}

/** Whether a shelter's animal comes chipped, where the law asks it of its species (`CHIP_LAW`). */
const chippedByLaw = (shelter: Shelter): boolean => { const c = CITIES.get(shelter.cityId); return Boolean(c && (CHIP_LAW[c.parentId] ?? CHIP_LAW[c.countryId])?.includes(shelter.species)); };

/** When it was last vaccinated against rabies: its own record, or a year before its vaccines run out (a shelter's and the yearly visit's include it). */
export const rabiesOf = (pet: Pet): Instant | undefined => pet.rabiesAt ?? (pet.vetUntil !== undefined ? pet.vetUntil - 365 * MS_DAY : undefined);

/** The rule a country holds a pet coming from another to: its own, its rule for that country, or nothing where it asks nothing. */
export function entryRule(fromCountry: string, toCountry: string): Omit<EntryRule, 'from'> | undefined {
  if (fromCountry === toCountry) return undefined;
  const rule = PET_ENTRY[toCountry];
  if (!rule || rule.freeFrom?.includes(fromCountry)) return undefined;
  return rule.from?.[fromCountry] ?? rule;
}

/**
 * What a pet lacks to come into a country from another, arriving then: each
 * paper the place asks of its species, held and good on the day (from
 * 2026-10-04). Empty where it has them all, or nothing is asked.
 */
export function entryMissing(pet: Pet, fromCountry: string, toCountry: string, arriveAt: Instant, opts: { lasting?: boolean } = {}): Paper[] {
  const rule = entryRule(fromCountry, toCountry);
  if (!rule) return [];
  const rabies = rabiesOf(pet);
  const good: Record<Paper, () => boolean> = {
    microchip: () => pet.chippedAt !== undefined && pet.chippedAt <= arriveAt,
    // Good a year from the dose, and only after the place's own wait; Britain's chip before it.
    rabies: () => rabies !== undefined && rabies <= arriveAt - (rule.rabiesDays ?? 0) * MS_DAY && arriveAt < rabies + 365 * MS_DAY && (!rule.rabiesDays || (pet.chippedAt !== undefined && pet.chippedAt <= rabies)),
    // An EU pet passport is good into Ireland and Britain as long as it's held; a certificate for its own country, its own days.
    certificate: () => (pet.certificate?.passport === true && PASSPORT_GOOD_INTO.includes(toCountry)) || (pet.certificate?.to === toCountry && pet.certificate.at <= arriveAt && arriveAt - pet.certificate.at <= (rule.certificateDays ?? 10) * MS_DAY),
    tapeworm: () => pet.tapewormAt !== undefined && arriveAt - pet.tapewormAt >= (rule.tapewormHours?.[0] ?? 0) * 3_600_000 && arriveAt - pet.tapewormAt <= (rule.tapewormHours?.[1] ?? 0) * 3_600_000,
    importForm: () => pet.importFormAt !== undefined && pet.importFormAt <= arriveAt && arriveAt - pet.importFormAt <= (rule.formDays ?? 0) * MS_DAY,
  };
  // Looking ahead to a way home, only what lasts: a certificate or a tapeworm treatment is got near the day, at a vet where they are.
  const near = (paper: Paper) => opts.lasting && (paper === 'tapeworm' || (paper === 'certificate' && pet.certificate?.passport !== true));
  return rule.needs[pet.species].filter((paper) => !near(paper) && !good[paper]());
}

/** Where an EU pet passport, issued in Ireland, takes a pet in without another certificate. */
const PASSPORT_GOOD_INTO: readonly string[] = ['ie', 'uk'];
/** Where a vet issues an EU pet passport rather than a certificate for one trip. */
const ISSUES_PASSPORTS: readonly string[] = ['ie'];

/** Why the pets can't come into a country on a trip, naming each one's missing papers; nothing where they can. */
export function entryRefusal(person: Person, fromCityId: string, toCityId: string, arriveAt: Instant, opts: { lasting?: boolean } = {}): string | undefined {
  const from = CITIES.get(fromCityId)?.countryId ?? '';
  const to = CITIES.get(toCityId);
  const short = petsOf(person).map((pet) => ({ pet, missing: entryMissing(pet, from, to?.countryId ?? '', arriveAt, opts) })).filter((x) => x.missing.length > 0);
  if (short.length === 0) return undefined;
  return `${to?.name ?? 'There'} asks more of ${short.map((x) => `${x.pet.name} (${x.missing.map((m) => PAPER_LABEL[m]).join(', ')})`).join(' and ')} on arriving.`;
}

/** A microchip where they live, in the save's money, or why there's none (`content/petpapers.ts`). */
export function chipPrice(sim: Simulation, person: Person): Money | string {
  const c = CHIP_PRICE[person.currentLocationId];
  if (!c) return 'SLATE keeps no microchip price here.';
  return Math.round(inSaveMoney(sim, Math.round(c.price * 100), c.currency) * (c.plusTax ? 1 + salesTaxRate(person.currentLocationId, sim.now, 'goods') : 1));
}

/**
 * A health certificate for all the pets where they live: the vet's own, the
 * first and each more, or the town's vet visit a pet where no vet's is kept;
 * and the government's endorsement, once or a form each. Or why there's none.
 */
export function certificatePrice(sim: Simulation, person: Person): Money | string {
  const pets = petsOf(person);
  if (pets.length === 0) return 'There are no pets of yours.';
  const town = person.currentLocationId;
  const own = CERTIFICATE_FEE[town];
  let vet = 0;
  if (own) vet = inSaveMoney(sim, Math.round((own.first + own.more * (pets.length - 1)) * 100), own.currency);
  else for (const pet of pets) { const v = vetPrice(sim, person, pet); if (typeof v === 'string') return v; vet += v; }
  const e = ENDORSEMENT[CITIES.get(town)?.countryId ?? ''];
  const endorse = e ? inSaveMoney(sim, Math.round(e.fee * 100), e.currency) * (e.each ? pets.length : 1) : 0;
  return vet + endorse;
}

/** A fee on arriving in a town with the pets, from another country: Heathrow's for pets in the hold, Canada's inspection but from America. Nothing elsewhere. */
export function arrivalFee(sim: Simulation, person: Person, fromCityId: string, toCityId: string): Money {
  const n = petsOf(person).length;
  const from = CITIES.get(fromCityId)?.countryId ?? '';
  const to = CITIES.get(toCityId);
  if (n === 0 || !to || from === to.countryId) return 0;
  const fee = ARRIVAL_FEE[toCityId] ?? ARRIVAL_FEE[to.countryId];
  if (!fee || fee.notFrom?.includes(from)) return 0;
  return inSaveMoney(sim, Math.round((fee.first + fee.more * (n - 1)) * 100), fee.currency);
}

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

/** A pet's month: its license when due. Its food, litter, walks and the vet are each their own (from 2026-10-04). */
function petMonth(sim: Simulation, person: Person, pet: Pet): void {
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

/**
 * The pets' way on a flight out of a town, each way, by the departure
 * country's carrier (`content/petair.ts`, from 2026-10-04; until then one
 * cabin fee a country, charged for a 20 kg dog no cabin takes): a pet light
 * enough in the cabin where the carrier takes one there, otherwise the hold,
 * checked or as cargo, at its own fare, inside or outside the country; or why
 * it can't fly. Nothing where there are no pets or no flight.
 */
/**
 * The carrier a pet flies with between two towns: the departure country's
 * flag carrier, or one chosen in its place where it's offered between the two
 * countries (`OTHER_PET_CARRIERS`, from 2026-10-06). Or why it can't be.
 */
export function petCarrierFor(fromCityId: string, toCityId: string, chosen?: string): PetFlightRule | string {
  const from = CITIES.get(fromCityId)?.countryId ?? '';
  const to = CITIES.get(toCityId)?.countryId ?? '';
  if (chosen) {
    const other = OTHER_PET_CARRIERS[chosen];
    if (!other) return 'SLATE keeps no such airline’s pet rules.';
    if (!other.flies.includes(from) || !other.flies.includes(to)) return `SLATE keeps ${other.carrier}’s pets ${other.flies.length === 1 ? 'within' : 'between'} ${other.flies.map((c) => theCountryName(c)).join(' and ')} only.`;
    return other;
  }
  return PET_FLIGHT[from] ?? 'SLATE keeps no airline’s pet rules here.';
}
const theCountryName = (iso: string): string => ({ us: 'America', ca: 'Canada', mx: 'Mexico', uk: 'Britain', ie: 'Ireland' } as Record<string, string>)[iso] ?? iso.toUpperCase();

/** The pets that fly in the hold with a carrier between two countries: those it won't or can't take in the cabin. */
function inTheHold(person: Person, rule: PetFlightRule, from: string, to: string): Pet[] {
  // Britain takes no pet arriving in a cabin, so it comes in the hold (`content/petentry.ts`).
  const cabinIn = !(entryRule(from, to)?.noCabin);
  return petsOf(person).filter((pet) => !(rule.cabin && cabinIn && PET_KG[pet.species] <= CABIN_MAX_KG));
}

export function petFlightFee(sim: Simulation, person: Person, fromCityId: string, toCityId: string, flights: number, at: Instant = sim.now, chosen?: string): Money | string {
  const pets = petsOf(person);
  if (pets.length === 0 || flights === 0) return 0;
  const from = CITIES.get(fromCityId);
  const rule = petCarrierFor(fromCityId, toCityId, chosen);
  if (typeof rule === 'string') return rule;
  const to = CITIES.get(toCityId)?.countryId ?? '';
  // Domestic where both ends are among its own (Air Canada and WestJet price America as Canada).
  const own = rule.domesticTo ?? [from!.countryId];
  const domestic = own.includes(to) && own.includes(from!.countryId);
  const fare = (f: PetFare): Money => inSaveMoney(sim, Math.round((domestic ? f.domestic : f.abroad) * 100), domestic ? f.currency : f.abroadCurrency ?? f.currency);
  const held = new Set(inTheHold(person, rule, from!.countryId, to).map((p) => p.id));
  let total = 0;
  for (const pet of pets) {
    if (!held.has(pet.id)) { total += fare(rule.cabin!); continue; }
    const hold = rule.hold;
    if ('refused' in hold) return `${pet.name}: ${hold.refused}`;
    if (hold.closed && inClosed(at, from!.timeZone, hold.closed)) return `${rule.carrier} carries no pets in the hold from ${hold.closed.from[1]} December to ${hold.closed.to[1]} January.`;
    // WestJet's summer towns, known when it's booked (from 2026-10-06).
    const s = rule.summer;
    if (s && (s.cities.includes(fromCityId) || s.cities.includes(toCityId)) && inStretch(at, from!.timeZone, s.from, s.until)) return `${rule.carrier} checks no pets to or from ${CITIES.get(s.cities.includes(toCityId) ? toCityId : fromCityId)?.name} from ${dayOfYear(s.from)} to ${dayOfYear(s.until)}.`;
    total += fare(hold);
  }
  return total;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayOfYear = ([m, d]: [number, number]): string => `${d} ${MONTH_NAMES[m - 1]}`;

/** Whether a day falls between two months and days of its year, in a zone. */
function inStretch(at: Instant, zone: string, from: [number, number], until: [number, number]): boolean {
  const [, m, d] = new Date(at).toLocaleDateString('en-CA', { timeZone: zone }).split('-').map(Number) as [number, number, number];
  const key = m * 100 + d;
  return key >= from[0] * 100 + from[1] && key <= until[0] * 100 + until[1];
}

/**
 * Why the carrier won't fly a pet in its hold on the day, by its temperatures
 * (from 2026-10-06, `content/petair.ts`): read in the weather SLATE draws at
 * the hour it leaves and the hour it lands. Nothing where it flies, or no pet
 * is in the hold, or the carrier keeps no figure SLATE read.
 */
export function embargoRefusal(sim: Simulation, person: Person, fromCityId: string, toCityId: string, leaveAt: Instant, arriveAt: Instant, chosen?: string): string | undefined {
  const rule = petCarrierFor(fromCityId, toCityId, chosen);
  if (typeof rule === 'string' || !rule.embargo) return undefined;
  const from = CITIES.get(fromCityId);
  const to = CITIES.get(toCityId);
  if (!from || !to) return undefined;
  const held = inTheHold(person, rule, from.countryId, to.countryId);
  if (held.length === 0) return undefined;
  const e = rule.embargo;
  if (e.windows && !e.windows.some((w) => w.to.includes(to.countryId) && inStretch(arriveAt, to.timeZone, w.from, w.until))) return undefined;
  const ends: [City, Instant][] = e.where === 'both' ? [[from, leaveAt], [to, arriveAt]] : [[to, arriveAt]];
  for (const [city, at] of ends) {
    const t = weatherAt(sim, city.id, at)?.temperatureC;
    if (t === undefined) continue;
    const hot = e.maxC !== undefined && t > e.maxC;
    const cold = e.minC !== undefined && t < e.minC;
    if (hot || cold) return `${rule.carrier} won’t fly ${held.map((p) => p.name).join(' and ')} in the hold: it’s ${t}°C in ${city.name}, ${hot ? 'over' : 'under'} the ${Math.round((hot ? e.maxC! : e.minC!) * 10) / 10}°C it flies pets in.`;
  }
  return undefined;
}

/** Whether a day falls in a closed stretch running from one month and day across the new year to another. */
function inClosed(at: Instant, zone: string, closed: { from: [number, number]; to: [number, number] }): boolean {
  const [, m, d] = new Date(at).toLocaleDateString('en-CA', { timeZone: zone }).split('-').map(Number) as [number, number, number];
  const key = m * 100 + d;
  return key >= closed.from[0] * 100 + closed.from[1] || key <= closed.to[0] * 100 + closed.to[1];
}

const dayKey = (sim: Simulation, at: Instant): string => new Date(at).toLocaleDateString('en-CA', { timeZone: sim.homeZone });
const marketOf = (person: Person): PetMarket | undefined => { const c = CITIES.get(person.home?.cityId ?? '')?.countryId; return c === 'us' || c === 'uk' || c === 'ie' || c === 'ca' || c === 'mx' ? c : undefined; };

/** Food and litter on sale where they live: dry foods for the species they keep, and litter where there's a cat, cheapest first a kilogram. */
export function petShop(sim: Simulation, person: Person): { id: string; label: string; kind: 'food' | 'litter'; species?: Species; kg: number; kcalPerKg?: number; price: Money; retailer: string }[] {
  const m = marketOf(person);
  if (!m) return [];
  const foods = PET_FOODS.filter((f) => f.market === m).map((f) => ({ id: f.id, label: `${f.brand} ${f.product}, ${f.kg} Kilograms`, kind: 'food' as const, species: f.species, kg: f.kg, kcalPerKg: f.kcalPerKg ?? undefined, price: inSaveMoney(sim, Math.round(f.price * 100), f.currency), retailer: f.retailer }));
  const litters = LITTERS.filter((l) => l.market === m).map((l) => ({ id: l.id, label: `${l.product}, ${l.kg} Kilograms`, kind: 'litter' as const, kg: l.kg, price: inSaveMoney(sim, Math.round(l.price * 100), l.currency), retailer: l.retailer }));
  return [...foods, ...litters].sort((a, b) => a.price / a.kg - b.price / b.kg);
}

/** The food to hand at home for a species, the bags with the least left first. */
const foodFor = (person: Person, species: Species): Item[] => itemsOf(person).filter((i) => i.petFood?.species === species && i.petFood.leftG > 0 && i.at.kind === 'home' && i.at.home === homeKeyOf(person.home)).sort((a, b) => a.petFood!.leftG - b.petFood!.leftG);
const litterAtHome = (person: Person): Item[] => itemsOf(person).filter((i) => (i.litterKg ?? 0) > 0 && i.at.kind === 'home' && i.at.home === homeKeyOf(person.home));
export const foodLeftG = (person: Person, species: Species): number => foodFor(person, species).reduce((n, i) => n + i.petFood!.leftG, 0);
/** A bag's energy, kcal a kilogram: its label's, or Royal Canin's where its own wasn't read. */
export const kcalPerKgOf = (i: Item): number => i.petFood!.kcalPerKg ?? RATION_KCAL_PER_KG[i.petFood!.species];
/** The kcal of food at home for a species. */
export const foodLeftKcal = (person: Person, species: Species): number => foodFor(person, species).reduce((n, i) => n + (i.petFood!.leftG * kcalPerKgOf(i)) / 1000, 0);
export const litterLeftKg = (person: Person): number => litterAtHome(person).reduce((n, i) => n + (i.litterKg ?? 0), 0);

/** Feeds each pet not yet fed today a day's energy from what's at home, each bag at its own kcal (from 2026-10-05; until then by Royal Canin's grams whatever the food); the names fed, and those there wasn't enough for. */
export function feedPets(sim: Simulation, person: Person): { fed: string[]; short: string[] } {
  const today = dayKey(sim, sim.now);
  const fed: string[] = [];
  const short: string[] = [];
  for (const pet of petsOf(person)) {
    if (pet.fedOn === today) continue;
    let need = KCAL_A_DAY[pet.species];
    if (foodLeftKcal(person, pet.species) < need - 1e-6) { short.push(pet.name); continue; }
    for (const bag of foodFor(person, pet.species)) {
      const kcal = kcalPerKgOf(bag);
      const take = Math.min((need / kcal) * 1000, bag.petFood!.leftG);
      bag.petFood!.leftG -= take;
      need -= (take * kcal) / 1000;
      if (bag.petFood!.leftG <= 1e-6) person.items = itemsOf(person).filter((i) => i.id !== bag.id);
      if (need <= 1e-6) break;
    }
    pet.fedOn = today;
    pet.hungryDays = 0;
    fed.push(pet.name);
  }
  return { fed, short };
}

/** The yearly visit's price at the town's vet, in the save's money, or why there's none. */
export function vetPrice(sim: Simulation, person: Person, pet: Pet): Money | string {
  const v = VET_YEAR[person.currentLocationId];
  if (!v) return 'No vet’s prices are kept for this town.';
  return inSaveMoney(sim, Math.round(v[pet.species] * 100), v.currency);
}

/** A walker's day for a dog: two half hours at the town's rate, in the save's money, or why there's none. */
export function walkerDay(sim: Simulation, person: Person): Money | string {
  const w = WALKER_30[person.home?.cityId ?? ''];
  if (!w) return 'No walker’s rate is kept for this town.';
  return inSaveMoney(sim, Math.round(w.fee * 2 * 100), w.currency);
}

/** A pet's day, at the turn of it: fed or hungry, a dog walked or not, a cat's litter used, the vet when due; a sitter's care while away. */
function petDay(sim: Simulation, person: Person): void {
  const mine = person.id === sim.universe.playerId;
  const yesterday = dayKey(sim, sim.now - MS_DAY);
  const away = person.currentLocationId !== person.home?.cityId;
  const sat = away && Boolean(sitterThrough(person, sim.now - MS_DAY, sim.now));
  // The shortcut feeds them on the same rules as Feed Them; a sitter feeds them while away.
  if (!away && isOn(person, 'feedPets')) feedPets(sim, person);
  for (const pet of petsOf(person)) {
    if (sat) { pet.fedOn = yesterday; if (pet.species === 'dog') pet.walkedOn = yesterday; }
    if (pet.fedOn !== yesterday && pet.fedOn !== dayKey(sim, sim.now)) {
      pet.hungryDays = (pet.hungryDays ?? 0) + 1;
      if (mine) sim.notify({ category: 'home', title: `${pet.name} Went Unfed`, body: `${pet.name} wasn’t fed yesterday${(pet.hungryDays ?? 0) > 1 ? `, ${pet.hungryDays} days running` : ''}.${foodLeftKcal(person, pet.species) < KCAL_A_DAY[pet.species] ? ' There’s no food for it at home.' : ''}`, importance: 55, route: '/workspace/belongings' });
    }
    if (pet.species === 'dog') {
      // A walker booked walks it, at the town's rate, while they're home; a sitter while they're away.
      if (pet.walker && !away) {
        const fee = walkerDay(sim, person);
        if (typeof fee === 'number' && spend(sim, person, fee, `A dog walker for ${pet.name}`, 'personal', true)) pet.walkedOn = yesterday;
      }
      if (pet.walkedOn !== yesterday && pet.walkedOn !== dayKey(sim, sim.now)) {
        pet.unwalkedDays = (pet.unwalkedDays ?? 0) + 1;
        if (mine) sim.notify({ category: 'home', title: `${pet.name} Wasn’t Walked`, body: `${pet.name} had no walk yesterday; the PDSA asks an hour a day at the least.`, importance: 40, route: '/workspace/belongings' });
      } else pet.unwalkedDays = 0;
    }
    // A dog's bath come due: said the day it is (from 2026-10-04).
    if (pet.species === 'dog' && mine && dayKey(sim, groomDue(pet)) === yesterday) sim.notify({ category: 'home', title: `${pet.name} Is Due A Bath`, body: `Three months since ${pet.name}’s last bath, the ASPCA’s longest: bathe it at home or take it to the groomer, from Your Pets on Belongings.`, importance: 35, route: '/workspace/belongings' });
    if (pet.species === 'cat' && !away) {
      const before = litterLeftKg(person);
      let use = LITTER_KG_A_WEEK / 7;
      for (const bag of litterAtHome(person)) { const take = Math.min(use, bag.litterKg!); bag.litterKg! -= take; use -= take; if (use <= 1e-9) break; }
      person.items = itemsOf(person).filter((i) => i.litterKg === undefined || i.litterKg > 1e-6);
      if (before > 0 && litterLeftKg(person) <= 1e-6 && mine) sim.notify({ category: 'home', title: 'Out Of Cat Litter', body: `The litter’s run out: ${pet.name}’s tray needs more.`, importance: 40, route: '/workspace/belongings' });
    }
    if (pet.vetUntil !== undefined && pet.vetUntil <= sim.now && pet.vetUntil > sim.now - MS_DAY && mine) sim.notify({ category: 'home', title: `${pet.name} Is Due At The Vet`, body: `${pet.name}’s yearly visit and vaccines are due.`, importance: 40, route: '/workspace/belongings' });
  }
}

export function registerPets(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'pets.day', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) if (petsOf(person).length) petDay(s, person);
  });

  // Food or litter ordered from the retailer, at its price, delivered home in two days, SLATE's estimate.
  sim.onCommand<{ productId: string; quantity?: number }, { paid: Money; orderId: string }>('pets.buy', (p, { sim: s }) => {
    const person = s.player;
    const item = petShop(s, person).find((x) => x.id === p?.productId);
    if (!item) throw new CommandError('That isn’t sold where you live.');
    const home = homeKeyOf(person.home);
    if (!home) throw new CommandError('It’s delivered to a home of yours.');
    const n = Math.max(1, Math.min(10, Math.floor(Number(p.quantity) || 1)));
    const paid = item.price * n;
    if (!payFromBank(s, person, paid, `${item.label}, from ${item.retailer}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
    const order = placeOrder(s, person, { from: item.retailer, arrivesAt: s.now + 2 * MS_DAY, to: { kind: 'home', home, spot: item.kind === 'food' ? 'pantry' : 'storage' }, paid }, Array.from({ length: n }, () => ({
      kind: `pet:${item.id}`, label: item.label, quantity: 1, condition: 1,
      ...(item.kind === 'food' ? { petFood: { species: item.species!, leftG: item.kg * 1_000, ...(item.kcalPerKg ? { kcalPerKg: item.kcalPerKg } : {}) } } : { litterKg: item.kg }),
    })));
    return { paid, orderId: order.id };
  });

  sim.onCommand<Record<string, never>, { fed: string[] }>('pets.feed', (_p, { sim: s }) => {
    const person = s.player;
    if (!petsOf(person).length) throw new CommandError('You have no pets.');
    if (person.currentLocationId !== person.home?.cityId) throw new CommandError('They’re fed at home.');
    const r = feedPets(s, person);
    if (!r.fed.length) throw new CommandError(r.short.length ? `There’s not a day’s food at home for ${r.short.join(' or ')}.` : 'They’re fed for today.');
    return { fed: r.fed };
  });

  sim.onCommand<{ petId: string }, { minutes: number }>('pets.walk', (p, { sim: s }) => {
    const person = s.player;
    const pet = petsOf(person).find((x) => x.id === p?.petId);
    if (!pet || pet.species !== 'dog') throw new CommandError('That isn’t a dog of yours.');
    if (person.currentLocationId !== person.home?.cityId) throw new CommandError('It’s walked at home.');
    if (pet.walkedOn === dayKey(s, s.now)) throw new CommandError(`${pet.name}’s been walked today.`);
    s.advanceTo(s.now + WALK.minutes * 60_000);
    exerts(person, WALK.met, WALK.minutes / 60);
    pet.walkedOn = dayKey(s, s.now);
    pet.unwalkedDays = 0;
    return { minutes: WALK.minutes };
  });

  sim.onCommand<{ petId: string; on: boolean }, { on: boolean }>('pets.walker', (p, { sim: s }) => {
    const pet = petsOf(s.player).find((x) => x.id === p?.petId);
    if (!pet || pet.species !== 'dog') throw new CommandError('That isn’t a dog of yours.');
    const fee = walkerDay(s, s.player);
    if (p.on && typeof fee === 'string') throw new CommandError(fee);
    if (p.on) pet.walker = true; else delete pet.walker;
    return { on: Boolean(p.on) };
  });

  // A pet's papers for going abroad (from 2026-10-04): each at a vet where they are, an hour, as the vet's visit is.
  sim.onCommand<{ petId: string }, { paid: Money }>('pets.chip', (p, { sim: s }) => {
    const person = s.player;
    const pet = petsOf(person).find((x) => x.id === p?.petId);
    if (!pet) throw new CommandError('That isn’t a pet of yours.');
    if (pet.chippedAt !== undefined) throw new CommandError(`${pet.name} is chipped already.`);
    const price = chipPrice(s, person);
    if (typeof price === 'string') throw new CommandError(price);
    if (!spend(s, person, price, `${CHIP_PRICE[person.currentLocationId]!.clinic}, ${pet.name}’s microchip`, 'personal')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + 60 * 60_000);
    pet.chippedAt = s.now;
    return { paid: price };
  });
  sim.onCommand<{ to: string }, { paid: Money }>('pets.certificate', (p, { sim: s }) => {
    const person = s.player;
    const to = String(p?.to ?? '');
    if (!PET_ENTRY[to]) throw new CommandError('SLATE keeps no rules for taking a pet there.');
    const price = certificatePrice(s, person);
    if (typeof price === 'string') throw new CommandError(price);
    if (!spend(s, person, price, 'A health certificate for the pets', 'personal')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + 60 * 60_000);
    // An Irish vet issues the EU pet passport, good into Ireland and Britain while it's held.
    const passport = ISSUES_PASSPORTS.includes(CITIES.get(person.currentLocationId)?.countryId ?? '');
    for (const pet of petsOf(person)) pet.certificate = { to, at: s.now, ...(passport ? { passport: true as const } : {}) };
    return { paid: price };
  });
  sim.onCommand<{ petId: string }, { paid: Money }>('pets.tapeworm', (p, { sim: s }) => {
    const person = s.player;
    const pet = petsOf(person).find((x) => x.id === p?.petId);
    if (!pet || pet.species !== 'dog') throw new CommandError('That isn’t a dog of yours.');
    const price = vetPrice(s, person, pet);
    if (typeof price === 'string') throw new CommandError(price);
    if (!spend(s, person, price, `${pet.name}’s tapeworm treatment`, 'personal')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + 60 * 60_000);
    pet.tapewormAt = s.now;
    return { paid: price };
  });
  sim.onCommand<{ petId: string }, { at: Instant }>('pets.import_form', (p, { sim: s }) => {
    const pet = petsOf(s.player).find((x) => x.id === p?.petId);
    if (!pet || pet.species !== 'dog') throw new CommandError('The CDC’s form is for a dog.');
    pet.importFormAt = s.now;
    return { at: s.now };
  });

  sim.onCommand<{ petId: string; at: 'home' | 'groomer' }, { paid: Money; due: Instant }>('pets.groom', (p, { sim: s }) => {
    const person = s.player;
    const pet = petsOf(person).find((x) => x.id === p?.petId);
    if (!pet || pet.species !== 'dog') throw new CommandError('That isn’t a dog of yours.');
    if (person.currentLocationId !== person.home?.cityId) throw new CommandError(p.at === 'groomer' ? 'Its groomer is where you live.' : 'It’s bathed at home.');
    let paid = 0;
    if (p.at === 'groomer') {
      const price = groomerPrice(s, person);
      if (typeof price === 'string') throw new CommandError(price);
      if (!spend(s, person, price, `${GROOMERS[person.home!.cityId]!.name}, ${pet.name}’s bath`, 'personal')) throw new CommandError('The payment didn’t go through.');
      paid = price;
    } else {
      countWash(person, true);
      s.advanceTo(s.now + HOME_BATH_MINUTES * 60_000);
    }
    pet.groomedAt = s.now;
    return { paid, due: groomDue(pet) };
  });

  sim.onCommand<{ petId: string }, { paid: Money; until: Instant }>('pets.vet', (p, { sim: s }) => {
    const person = s.player;
    const pet = petsOf(person).find((x) => x.id === p?.petId);
    if (!pet) throw new CommandError('That isn’t a pet of yours.');
    if (person.currentLocationId !== person.home?.cityId) throw new CommandError('Its vet is where you live.');
    const price = vetPrice(s, person, pet);
    if (typeof price === 'string') throw new CommandError(price);
    const v = VET_YEAR[person.currentLocationId]!;
    if (!spend(s, person, price, `${v.clinic}, ${pet.name}’s yearly visit and vaccines`, 'personal')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + 60 * 60_000);
    pet.vetUntil = s.now + 365 * MS_DAY;
    // Its rabies vaccination with the rest, the day it's given (from 2026-10-04).
    pet.rabiesAt = s.now;
    return { paid: price, until: pet.vetUntil };
  });

  sim.onCommand<{ shelterId: string; name?: string }, { paid: Money; petId: string }>('pets.adopt', (p, { sim: s }) => {
    const person = s.player;
    const no = adoptRefusal(person, String(p?.shelterId));
    if (no) throw new CommandError(no);
    const shelter = SHELTERS.find((x) => x.id === p.shelterId)!;
    const paid = inSaveMoney(s, Math.round(shelter.fee * 100), shelter.currency);
    if (paid > 0 && !spend(s, person, paid, `${shelter.name}, an adoption`, 'personal')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(s.universe))}, more than you can pay.`);
    // A shelter's animal comes vaccinated, for a year.
    const pet: Pet = { id: s.nextId('pet'), species: shelter.species, name: String(p?.name ?? '').trim() || (shelter.species === 'dog' ? 'Your Dog' : 'Your Cat'), adoptedAt: s.now, from: shelter.id, vetUntil: s.now + 365 * MS_DAY, rabiesAt: s.now, ...(chippedByLaw(shelter) ? { chippedAt: s.now } : {}), fedOn: dayKey(s, s.now), ...(shelter.species === 'dog' ? { walkedOn: dayKey(s, s.now) } : {}) };
    petsOf(person).push(pet);
    // A rented home's pet deposit, where coming adds one (`petArrives`, from 2026-10-04).
    petArrives(s, person);
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
