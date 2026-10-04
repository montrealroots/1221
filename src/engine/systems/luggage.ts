/**
 * SLATE — a suitcase, packed for going away and unpacked at home (Stage 3 of
 * `docs/BACKLOG.md`, from 2026-10-01).
 *
 * Until 2026-10-01 nothing traveled: a life on a location shoot had its
 * wardrobe and its toothbrush at home, out of reach, and every day away was
 * a day with nothing clean to wear and the morning's freshness lost. Now
 * leaving the town they live in packs a week's clothes and the bathroom's
 * things into the suitcase they carry, and coming home unpacks it: the
 * clothes to the wardrobe, the toiletries to the bathroom.
 *
 * A week's clothes is SLATE's estimate of what a person packs: seven tops,
 * three bottoms, seven of underwear and socks, a pair of shoes and a coat
 * where they have one, and whatever outfit they chose to wear; the cleanest
 * first. A carry-on is 45 liters, the 22 × 14 × 9 inches America's airlines
 * take in a cabin. Until 2026-10-02 SLATE kept nothing of what a garment
 * takes up, and a packed bag was never full; now each takes its folded
 * liters (`GARMENT_L`), and nothing goes in past the bag's. A life begins
 * with one.
 *
 * Packing is the player's from 2026-10-02: anything moved into the suitcase on
 * Belongings goes as it is, and leaving home packs a week only into an empty
 * one. Pack For Me and Unpack do the same by hand, at home.
 *
 * From later on 2026-10-02 a suitcase, a duffel or a backpack can be bought
 * where you live (`content/luggagecatalog.ts`), each holding its maker's
 * liters, at its maker's or retailer's price with the town's sales tax where
 * it's added; Take This One makes it the bag that goes away with you. The
 * first carry-on stays the one until another is chosen.
 *
 * **Several bags, packed by choice** (from 2026-10-03, the owner's expansion):
 * any of the bags owned can go (`luggage.take`), an empty one too, each
 * packed by hand on Each Thing or with Pack For Me. What happens on its own
 * is a shortcut a person sets (`automation.packForMe`): packing a week into
 * an empty suitcase on leaving home, unpacking on coming back, and repacking
 * a room on leaving it. Without it, a bag goes as it's packed, comes home
 * packed, and a room is left as it was. A save from before did all of this
 * on its own, and is given the shortcut it had.
 *
 * **Left behind**: what's still out in a room when they leave the town is
 * held where they stayed for `HELD_DAYS`, and can be collected in town
 * before then (`items.recover`); after that it's gone. No hotel's own
 * lost-property terms were read: ninety days is SLATE's reading.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Slot } from '../content/garmentcare';
import { CommandError } from '../core/simulation';
import { addItem, homeKeyOf, itemsOf, reachable, usedL, volumeOf, type Item } from './items';
import { garmentsOf } from './wardrobe';
import { suppliesOf } from './hygiene';
import type { Money } from '../core/money';
import { CITIES, COUNTRIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { LUGGAGE, type LuggagePiece } from '../content/luggagecatalog';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { HOTELS } from '../content/hotels';
import { BAG_RULES, CARRY_ON_KG, COUNTED_G, GARMENT_G, UNKNOWN_KG_PER_L, type BagRule } from '../content/baggage';
import { MS_DAY, formatDate } from '../core/time';

export const CARRY_ON = { label: 'Carry-On Suitcase', holdsL: 45 } as const;
/** How long a place holds what's left behind: SLATE's reading, no hotel's terms having been read. */
export const HELD_DAYS = 90;
export const HELD_KIND = 'items.held_ends';
/** A week's clothes, by part. SLATE's estimate. */
export const PACK: Readonly<Partial<Record<Slot, number>>> = { base: 2, top: 7, bottom: 3, underwear: 7, socks: 7, shoes: 1, outer: 1, dress: 2, suit: 1, active: 2 };

const isLuggage = (i: Item) => i.kind.startsWith('luggage:');
/** The bag that goes away: the one chosen, or the first owned. */
export const suitcaseOf = (person: Person): Item | undefined => itemsOf(person).find((i) => i.id === person.luggageId && isLuggage(i)) ?? itemsOf(person).find(isLuggage);
export const bagsOf = (person: Person): Item[] => itemsOf(person).filter(isLuggage);
/** The bags that go away: the ones chosen, or the one suitcase where none are. */
export function bagsGoing(person: Person): Item[] {
  const chosen = person.goingBags ? bagsOf(person).filter((b) => person.goingBags!.includes(b.id)) : [];
  if (chosen.length) return chosen;
  const one = suitcaseOf(person);
  return one ? [one] : [];
}

export const luggageById = (id: string): LuggagePiece | undefined => LUGGAGE.find((x) => x.id === id);

/** A bag's price where a town is, taxed where its tax is added, in the save's money. */
export function luggagePrice(sim: Simulation, cityId: string, p: LuggagePiece): Money {
  const tax = p.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'goods');
  return inSaveMoney(sim, Math.round(p.price * (1 + tax) * 100), p.currency);
}

/** The bags on sale where they live, cheapest first. */
export function luggageCatalog(sim: Simulation, person: Person): { piece: LuggagePiece; price: Money }[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const country = CITIES.get(cityId)?.countryId;
  return LUGGAGE.filter((x) => x.country === country).map((piece) => ({ piece, price: luggagePrice(sim, cityId, piece) })).sort((a, b) => a.price - b.price);
}

export function buyLuggageRefusal(person: Person, id: string): string | undefined {
  const p = luggageById(id);
  if (!p) return 'That isn’t on sale.';
  if (!person.home || person.home.cityId !== person.currentLocationId) return 'A bag is bought where you live, and kept at home.';
  if (CITIES.get(person.home.cityId)?.countryId !== p.country) return 'It’s sold in another country.';
  return undefined;
}

/** A carry-on for a life that hasn't one, at home in storage. */
export function starterLuggage(sim: Simulation, person: Person): boolean {
  const home = homeKeyOf(person.home);
  if (suitcaseOf(person) || !home || person.clothesSince === undefined) return false;
  addItem(sim, person, { kind: 'luggage:carry-on', label: CARRY_ON.label, quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'storage' }, acquiredAt: sim.now, holdsL: CARRY_ON.holdsL, volumeL: CARRY_ON.holdsL });
  return true;
}

/**
 * A bag bigger than a cabin takes (from 2026-10-03): a medium or a large
 * suitcase, or one whose outside measure is past the 45 liters of the
 * 22 × 14 × 9 inches America's airlines take in a cabin. It flies checked.
 */
export function checkedSize(bag: Item): boolean {
  const piece = luggageById(bag.kind.slice('luggage:'.length));
  if (piece) return piece.type === 'medium' || piece.type === 'large' || (piece.outsideL ?? 0) > CARRY_ON.holdsL;
  return (bag.volumeL ?? 0) > CARRY_ON.holdsL;
}

/** Why a flight can't be booked with no bag checked, or nothing: the suitcase going is bigger than a cabin takes. */
export function cabinBagRefusal(person: Person, bags: number): string | undefined {
  const bag = suitcaseOf(person);
  if (bags > 0 || !bag || !checkedSize(bag)) return undefined;
  return `Your ${bag.label} is bigger than a cabin takes: it goes as a checked bag.`;
}

/** What's in the suitcase now. */
export const packedIn = (person: Person, bag: Item): Item[] => itemsOf(person).filter((i) => i.at.kind === 'inside' && i.at.itemId === bag.id);

/**
 * Leaving home: the suitcase goes with them. What they packed themselves goes
 * as they packed it (from 2026-10-02; until then leaving repacked over it).
 * An empty suitcase is packed for them: a week's clothes, the cleanest
 * first, and the bathroom's things, as far as the suitcase holds.
 */
export function pack(person: Person): number {
  const bags = bagsGoing(person);
  const home = homeKeyOf(person.home);
  if (!bags.length || !home) return 0;
  for (const b of bags) b.at = { kind: 'person' };
  // A week packed into an empty suitcase only where that's the shortcut chosen.
  if (!person.automation?.packForMe || bags.some((b) => packedIn(person, b).length > 0)) return 0;
  return packAWeek(person, bags[0]!, home);
}

/** A week's clothes and the bathroom's things into the bag, the cleanest first, while there's room. */
function packAWeek(person: Person, bag: Item, home: string): number {
  const atHome = (i: Item) => i.at.kind === 'home' && i.at.home === home;
  const into = { kind: 'inside' as const, itemId: bag.id };
  let room = (bag.holdsL ?? 0) - usedL(person, bag.id);
  const fits = (i: Item) => { const v = volumeOf(i) * i.quantity; if (v > room + 1e-9) return false; room -= v; return true; };
  const chosen = new Set(person.dressed ?? []);
  const ready = garmentsOf(person).filter((g) => atHome(g) && !g.garment.dirty && g.condition > 0)
    .sort((a, b) => Number(chosen.has(b.id)) - Number(chosen.has(a.id)) || a.garment.wears - b.garment.wears || a.id.localeCompare(b.id));
  const counts: Partial<Record<Slot, number>> = {};
  let packed = 0;
  for (const g of ready) {
    const slot = g.garment.slot;
    // The outfit they chose sorts first, so it's always in.
    if ((counts[slot] ?? 0) >= (PACK[slot] ?? 0) || !fits(g)) continue;
    counts[slot] = (counts[slot] ?? 0) + 1;
    g.at = into;
    packed += 1;
  }
  // One of each of the bathroom's things that's in use.
  const kinds = new Set<string>();
  for (const s of suppliesOf(person).filter(atHome)) {
    if (kinds.has(s.supply.kind) || !fits(s)) continue;
    kinds.add(s.supply.kind);
    s.at = into;
    packed += 1;
  }
  return packed;
}

/**
 * Home with the bags: each set down in storage, and unpacked (the clothes to
 * the wardrobe, the toiletries to the bathroom) where that's the shortcut
 * chosen, or when Unpack is pressed (`force`, for one bag or all).
 */
export function unpack(person: Person, force = false, only?: string): number {
  const home = homeKeyOf(person.home);
  if (!home) return 0;
  const bags = bagsOf(person).filter((b) => (only ? b.id === only : force ? b.at.kind === 'person' || (b.at.kind === 'home' && b.at.home === home) : b.at.kind === 'person'));
  let out = 0;
  for (const bag of bags) {
    if (force || person.automation?.packForMe) {
      for (const i of packedIn(person, bag)) {
        i.at = { kind: 'home', home, spot: i.supply ? 'bathroom' : 'wardrobe' };
        out += 1;
      }
    }
    bag.at = { kind: 'home', home, spot: 'storage' };
  }
  return out;
}

/**
 * After a move between towns: leaving the town they live in packs, coming
 * back to it unpacks, and between two towns away the suitcase goes with
 * them. Called wherever a person's town changes.
 */
export function traveled(sim: Simulation, person: Person, from: string): void {
  const homeCity = person.home?.cityId;
  if (from === person.currentLocationId) return;
  repackStay(sim, person, from);
  if (!homeCity) return;
  if (person.currentLocationId === homeCity) unpack(person);
  else if (from === homeCity) pack(person);
}


/** Moves a person to a town, packing or unpacking as they go. */
export function moveTo(sim: Simulation, person: Person, cityId: string): void {
  const from = person.currentLocationId;
  person.currentLocationId = cityId;
  traveled(sim, person, from);
}

/**
 * Unpacked where they're staying, from 2026-10-03: the suitcase's things go
 * into the room, to hand there as in the bag. Leaving the town packs them
 * back while the suitcase holds them; what no longer fits, bought on the way,
 * is left behind, as it would be, and gone from what they own.
 */
export function unpackAtStay(person: Person, only?: string): number {
  const cityId = person.currentLocationId;
  if (!person.stay) return 0;
  const by = stayName(person);
  let out = 0;
  for (const bag of bagsGoing(person).filter((b) => (only ? b.id === only : true))) for (const i of packedIn(person, bag)) { i.at = { kind: 'stay', cityId, ...(by ? { by } : {}) }; out += 1; }
  return out;
}

/** Where they're staying, by name: a named hotel, or the kind of place. */
export function stayName(person: Person): string | undefined {
  const s = person.stay;
  if (!s) return undefined;
  if (s.hotelId) return HOTELS.find((h) => h.id === s.hotelId)?.name ?? 'the hotel';
  return s.kind === 'hotel' ? 'the hotel' : s.kind === 'sofa' ? 'a friend’s place' : s.kind === 'own' ? 'your place here' : 'the place you rented';
}

/** What's out in the room back into the bags going, as far as they hold. What didn't fit. */
export function repackRoom(person: Person, cityId: string): Item[] {
  const there = itemsOf(person).filter((i) => i.at.kind === 'stay' && i.at.cityId === cityId);
  const bags = bagsGoing(person).filter((b) => b.at.kind === 'person');
  const left: Item[] = [];
  for (const i of there) {
    const v = volumeOf(i) * i.quantity;
    const bag = bags.find((b) => (b.holdsL ?? 0) - usedL(person, b.id) >= v - 1e-9);
    if (bag) i.at = { kind: 'inside', itemId: bag.id }; else left.push(i);
  }
  return left;
}

/**
 * Leaving a town: what's out in the room is repacked where that's the
 * shortcut chosen, as far as the bags hold. What's still out is left behind,
 * held where they stayed until `HELD_DAYS` have passed. What was left.
 */
export function repackStay(sim: Simulation, person: Person, cityId: string): Item[] {
  const out = itemsOf(person).filter((i) => i.at.kind === 'stay' && i.at.cityId === cityId);
  if (out.length === 0) return [];
  const left = person.automation?.packForMe ? repackRoom(person, cityId) : out;
  if (!left.length) return [];
  const by = (left[0]!.at.kind === 'stay' && left[0]!.at.by) || 'where you stayed';
  const until = sim.now + HELD_DAYS * MS_DAY;
  for (const i of left) i.at = { kind: 'held', cityId, by, until };
  sim.schedule({ at: until, kind: HELD_KIND, label: 'What Was Left Behind', category: 'system', priority: 20, payload: { personId: person.id, cityId, until } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'Left Behind', body: `${left.length} ${left.length === 1 ? 'thing was' : 'things were'} left at ${by} in ${CITIES.get(cityId)?.name ?? 'town'}: ${left.slice(0, 3).map((i) => i.label).join(', ')}${left.length > 3 ? ' and more' : ''}. Held until ${formatDate(until, sim.zone)}, to collect in person.`, importance: 45, route: '/workspace/belongings' });
  return left;
}

/** A thing's weight, grams: a garment's by its part, a liquid's by its milliliters, food by what's left, anything else by what it takes up (`content/baggage.ts`). */
export function weightG(item: Item): number {
  if (item.garment) return GARMENT_G[item.garment.slot] * item.quantity;
  if (item.supply) return (item.supply.unit === 'ct' ? COUNTED_G.toiletry : item.supply.left) * item.quantity;
  if (item.food) return (item.food.unit === 'ct' ? item.food.left * COUNTED_G.food : item.food.left) * item.quantity;
  return volumeOf(item) * item.quantity * UNKNOWN_KG_PER_L * 1000;
}

/** A bag's weight packed, kilograms: its own, its maker's where kept, and everything in it. */
export function bagKg(person: Person, bag: Item): number {
  const own = luggageById(bag.kind.slice('luggage:'.length))?.kg ?? CARRY_ON_KG;
  return own + packedIn(person, bag).reduce((sum, i) => sum + weightG(i), 0) / 1000;
}

/** The airline's rule for a flight's checked bags: its departure country's flag carrier, at home or abroad. */
export function bagRuleFor(fromCity: string, toCity: string): BagRule | undefined {
  const from = CITIES.get(fromCity)?.countryId ?? '';
  const to = CITIES.get(toCity)?.countryId ?? '';
  const rules = BAG_RULES[from];
  if (!rules) return undefined;
  // Ireland's short-haul rule holds within Europe; everyone else's at home.
  const near = from === to || (from === 'ie' && COUNTRIES.get(to)?.continent === COUNTRIES.get(from)?.continent);
  return near ? rules.domestic : rules.abroad;
}

/** What a checked bag of a weight costs past its allowance, in the rule's money, and whether it's over the most it takes. */
export function overweight(rule: BagRule, kg: number): { fee: number; over: boolean } {
  if (kg <= rule.allowanceKg + 1e-9) return { fee: 0, over: false };
  if (kg > rule.maxKg + 1e-9) return { fee: 0, over: true };
  if (rule.perKg !== undefined) return { fee: Math.ceil(kg - rule.allowanceKg) * rule.perKg, over: false };
  return { fee: rule.bands.find((b) => kg <= b.toKg + 1e-9)?.fee ?? 0, over: false };
}

/**
 * At the airline's counter: the bags checked weighed, the heaviest first. A
 * bag past the most the airline takes has its heaviest things taken out until
 * it's under, left with the airport and held as anything left behind is; one
 * past its allowance pays its band. The fees, in the save's money, and what
 * came out.
 */
export function weighIn(sim: Simulation, person: Person, fromCity: string, toCity: string, checked: number): { fees: Money; taken: Item[]; rule?: BagRule } {
  const rule = bagRuleFor(fromCity, toCity);
  if (!rule || checked <= 0) return { fees: 0, taken: [] };
  const going = bagsGoing(person).sort((a, b) => Number(checkedSize(b)) - Number(checkedSize(a)) || bagKg(person, b) - bagKg(person, a)).slice(0, checked);
  let fees = 0;
  const taken: Item[] = [];
  for (const bag of going) {
    while (overweight(rule, bagKg(person, bag)).over) {
      const heaviest = packedIn(person, bag).sort((a, b) => weightG(b) - weightG(a))[0];
      if (!heaviest) break;
      heaviest.at = { kind: 'held', cityId: fromCity, by: 'the airport', until: sim.now + HELD_DAYS * MS_DAY };
      taken.push(heaviest);
    }
    fees += overweight(rule, bagKg(person, bag)).fee;
  }
  if (taken.length) sim.schedule({ at: sim.now + HELD_DAYS * MS_DAY, kind: HELD_KIND, label: 'What Was Left Behind', category: 'system', priority: 20, payload: { personId: person.id, cityId: fromCity, until: sim.now + HELD_DAYS * MS_DAY } });
  return { fees: fees > 0 ? inSaveMoney(sim, Math.round(fees * 100), rule.currency) : 0, taken, rule };
}

/** What's held for them in a town: what isn't collected is gone on its day (`HELD_KIND`). */
export const heldIn = (person: Person, cityId: string): Item[] => itemsOf(person).filter((i) => i.at.kind === 'held' && i.at.cityId === cityId);

/** Why the suitcase can't be packed or unpacked here now, or nothing: at home, with it to hand. */
export function luggageRefusal(sim: Simulation, person: Person): string | undefined {
  const bag = suitcaseOf(person);
  if (!bag) return 'You have no suitcase.';
  if (!homeKeyOf(person.home) || person.home!.cityId !== person.currentLocationId || person.stay) return 'You pack and unpack at home.';
  if (!reachable(sim, person, bag.at)) return 'The suitcase isn’t to hand.';
  return undefined;
}

export function registerLuggage(sim: Simulation): void {
  // A bag going away, or staying home: any number, an empty one too.
  sim.onCommand<{ itemId: string; going: boolean }, { going: string[] }>('luggage.take', (p, { sim: s }) => {
    const person = s.player;
    const bag = bagsOf(person).find((i) => i.id === p?.itemId);
    if (!bag) throw new CommandError('That isn’t a bag of yours.');
    if (person.home?.cityId !== person.currentLocationId) throw new CommandError('Which bags go is chosen at home.');
    const now = bagsGoing(person).map((b) => b.id);
    const next = p.going ? [...new Set([...now, bag.id])] : now.filter((id) => id !== bag.id);
    if (!next.length) throw new CommandError('At least one bag goes.');
    person.goingBags = next;
    if (!next.includes(person.luggageId ?? '')) person.luggageId = next[0];
    return { going: next };
  });

  // What was left behind, collected in the town it was left in, while it's held.
  sim.onCommand<{ cityId?: string }, { collected: number }>('items.recover', (p, { sim: s }) => {
    const person = s.player;
    const cityId = String(p?.cityId ?? person.currentLocationId);
    if (cityId !== person.currentLocationId) throw new CommandError(`It’s collected in ${CITIES.get(cityId)?.name ?? 'its town'}.`);
    const held = heldIn(person, cityId);
    if (!held.length) throw new CommandError('No one here is holding anything of yours.');
    for (const i of held) i.at = { kind: 'person' };
    return { collected: held.length };
  });

  // The holding over: what wasn't collected is gone.
  sim.onSchedule(HELD_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const gone = itemsOf(person).filter((i) => i.at.kind === 'held' && i.at.cityId === item.payload.cityId && i.at.until <= s.now);
    if (!gone.length) return;
    person.items = itemsOf(person).filter((i) => !gone.includes(i));
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Not Collected', body: `${gone.length} ${gone.length === 1 ? 'thing' : 'things'} left in ${CITIES.get(String(item.payload.cityId))?.name ?? 'town'} weren’t collected in time, and are gone.`, importance: 30, route: '/workspace/belongings' });
  });

  // Repacked by hand, away: what's out in the room back into the bags as far as they hold.
  sim.onCommand<Record<string, never>, { packed: number; left: number }>('luggage.repack', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.stay || person.currentLocationId === person.home?.cityId) throw new CommandError('You repack where you’re staying.');
    const out = itemsOf(person).filter((i) => i.at.kind === 'stay' && i.at.cityId === person.currentLocationId);
    if (!out.length) throw new CommandError('The room is packed away already.');
    const left = repackRoom(person, person.currentLocationId);
    if (left.length === out.length) throw new CommandError('The bags are full.');
    return { packed: out.length - left.length, left: left.length };
  });

  sim.onCommand<{ pieceId: string }, { paid: Money; itemId: string }>('luggage.buy', (p, { sim: s }) => {
    const person = s.player;
    const no = buyLuggageRefusal(person, String(p?.pieceId));
    if (no) throw new CommandError(no);
    const piece = luggageById(String(p.pieceId))!;
    const paid = luggagePrice(s, person.home!.cityId, piece);
    if (!payFromBank(s, person, paid, `${piece.brand} ${piece.model}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
    const item = addItem(s, person, { kind: `luggage:${piece.id}`, label: `${piece.brand} ${piece.model}`, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'storage' }, acquiredAt: s.now, paid, holdsL: piece.liters, volumeL: piece.outsideL ?? piece.liters });
    return { paid, itemId: item.id };
  });
  sim.onCommand<{ itemId: string }, { chosen: string }>('luggage.choose', (p, { sim: s }) => {
    const person = s.player;
    const bag = bagsOf(person).find((i) => i.id === p?.itemId);
    if (!bag) throw new CommandError('That isn’t a bag of yours.');
    const now = suitcaseOf(person);
    if (now && now.id !== bag.id && packedIn(person, now).length > 0) throw new CommandError('Unpack the one you have first.');
    person.luggageId = bag.id;
    return { chosen: bag.label };
  });

  // Pack For Me: a week's clothes and the bathroom's things, as far as it holds, on top of what's in it.
  sim.onCommand<Record<string, never>, { packed: number; usedL: number }>('luggage.pack', (_p, { sim: s }) => {
    const person = s.player;
    const no = luggageRefusal(s, person);
    if (no) throw new CommandError(no);
    const bag = suitcaseOf(person)!;
    const packed = packAWeek(person, bag, homeKeyOf(person.home)!);
    if (packed === 0) throw new CommandError('It’s full, or what’s left at home isn’t clean.');
    return { packed, usedL: usedL(person, bag.id) };
  });
  sim.onCommand<{ itemId?: string }, { unpacked: number }>('luggage.unpack', (p, { sim: s }) => {
    const person = s.player;
    const only = p?.itemId ? String(p.itemId) : undefined;
    if (only && !bagsOf(person).some((b) => b.id === only)) throw new CommandError('That isn’t a bag of yours.');
    // Away, into the room where they're staying (from 2026-10-03).
    if (person.stay && person.currentLocationId !== person.home?.cityId) {
      if (!bagsGoing(person).some((b) => reachable(s, person, b.at))) throw new CommandError('The suitcase isn’t to hand.');
      const n = unpackAtStay(person, only);
      if (n === 0) throw new CommandError('The suitcase is empty.');
      return { unpacked: n };
    }
    const no = luggageRefusal(s, person);
    if (no) throw new CommandError(no);
    const out = unpack(person, true, only);
    if (out === 0) throw new CommandError('The suitcase is empty.');
    return { unpacked: out };
  });
}
