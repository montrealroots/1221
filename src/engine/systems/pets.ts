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
import { CABIN_MAX_KG, PET_FLIGHT, PET_KG, type PetFare } from '../content/petair';
import { LITTERS, LITTER_KG_A_WEEK, PET_FOODS, RATION_G, VET_YEAR, WALK, type PetMarket } from '../content/petcare';
import { homeKeyOf, itemsOf, type Item } from './items';
import { placeOrder } from './orders';
import { payFromBank, petArrives } from './household';
import { exerts } from './body';
import { isOn } from './automation';

export type Species = 'dog' | 'cat';
export interface Pet {
  id: string; species: Species; name: string; adoptedAt: Instant; from: string; licensedUntil?: Instant;
  /** The day it was last fed and, a dog, walked (from 2026-10-04); days running without; its vaccines good until; a walker booked. */
  fedOn?: string; walkedOn?: string; hungryDays?: number; unwalkedDays?: number; vetUntil?: Instant; walker?: true;
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
export function petFlightFee(sim: Simulation, person: Person, fromCityId: string, toCityId: string, flights: number, at: Instant = sim.now): Money | string {
  const pets = petsOf(person);
  if (pets.length === 0 || flights === 0) return 0;
  const from = CITIES.get(fromCityId);
  const rule = PET_FLIGHT[from?.countryId ?? ''];
  if (!rule) return 'SLATE keeps no airline’s pet rules here.';
  const to = CITIES.get(toCityId)?.countryId ?? '';
  const domestic = (rule.domesticTo ?? [from!.countryId]).includes(to);
  const fare = (f: PetFare): Money => inSaveMoney(sim, Math.round((domestic ? f.domestic : f.abroad) * 100), domestic ? f.currency : f.abroadCurrency ?? f.currency);
  let total = 0;
  for (const pet of pets) {
    if (rule.cabin && PET_KG[pet.species] <= CABIN_MAX_KG) { total += fare(rule.cabin); continue; }
    const hold = rule.hold;
    if ('refused' in hold) return `${pet.name}: ${hold.refused}`;
    if (hold.closed && inClosed(at, from!.timeZone, hold.closed)) return `${rule.carrier} carries no pets in the hold from ${hold.closed.from[1]} December to ${hold.closed.to[1]} January.`;
    total += fare(hold);
  }
  return total;
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
export function petShop(sim: Simulation, person: Person): { id: string; label: string; kind: 'food' | 'litter'; species?: Species; kg: number; price: Money; retailer: string }[] {
  const m = marketOf(person);
  if (!m) return [];
  const foods = PET_FOODS.filter((f) => f.market === m).map((f) => ({ id: f.id, label: `${f.brand} ${f.product}, ${f.kg} Kilograms`, kind: 'food' as const, species: f.species, kg: f.kg, price: inSaveMoney(sim, Math.round(f.price * 100), f.currency), retailer: f.retailer }));
  const litters = LITTERS.filter((l) => l.market === m).map((l) => ({ id: l.id, label: `${l.product}, ${l.kg} Kilograms`, kind: 'litter' as const, kg: l.kg, price: inSaveMoney(sim, Math.round(l.price * 100), l.currency), retailer: l.retailer }));
  return [...foods, ...litters].sort((a, b) => a.price / a.kg - b.price / b.kg);
}

/** The food to hand at home for a species, the bags with the least left first. */
const foodFor = (person: Person, species: Species): Item[] => itemsOf(person).filter((i) => i.petFood?.species === species && i.petFood.leftG > 0 && i.at.kind === 'home' && i.at.home === homeKeyOf(person.home)).sort((a, b) => a.petFood!.leftG - b.petFood!.leftG);
const litterAtHome = (person: Person): Item[] => itemsOf(person).filter((i) => (i.litterKg ?? 0) > 0 && i.at.kind === 'home' && i.at.home === homeKeyOf(person.home));
export const foodLeftG = (person: Person, species: Species): number => foodFor(person, species).reduce((n, i) => n + i.petFood!.leftG, 0);
export const litterLeftKg = (person: Person): number => litterAtHome(person).reduce((n, i) => n + (i.litterKg ?? 0), 0);

/** Feeds each pet not yet fed today a day's ration from what's at home; the names fed, and those there wasn't enough for. */
export function feedPets(sim: Simulation, person: Person): { fed: string[]; short: string[] } {
  const today = dayKey(sim, sim.now);
  const fed: string[] = [];
  const short: string[] = [];
  for (const pet of petsOf(person)) {
    if (pet.fedOn === today) continue;
    let need = RATION_G[pet.species];
    if (foodLeftG(person, pet.species) < need) { short.push(pet.name); continue; }
    for (const bag of foodFor(person, pet.species)) {
      const take = Math.min(need, bag.petFood!.leftG);
      bag.petFood!.leftG -= take;
      need -= take;
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
      if (mine) sim.notify({ category: 'home', title: `${pet.name} Went Unfed`, body: `${pet.name} wasn’t fed yesterday${(pet.hungryDays ?? 0) > 1 ? `, ${pet.hungryDays} days running` : ''}.${foodLeftG(person, pet.species) < RATION_G[pet.species] ? ' There’s no food for it at home.' : ''}`, importance: 55, route: '/workspace/belongings' });
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
      ...(item.kind === 'food' ? { petFood: { species: item.species!, leftG: item.kg * 1_000 } } : { litterKg: item.kg }),
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
    const pet: Pet = { id: s.nextId('pet'), species: shelter.species, name: String(p?.name ?? '').trim() || (shelter.species === 'dog' ? 'Your Dog' : 'Your Cat'), adoptedAt: s.now, from: shelter.id, vetUntil: s.now + 365 * MS_DAY, fedOn: dayKey(s, s.now), ...(shelter.species === 'dog' ? { walkedOn: dayKey(s, s.now) } : {}) };
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
