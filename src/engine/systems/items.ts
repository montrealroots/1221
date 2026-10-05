/**
 * SLATE — what a person owns, and where each thing is (Stage 1 of
 * `docs/BACKLOG.md`, from 2026-10-01). One record for every possession that
 * isn't a vehicle, a home or a piece of land, which keep their own.
 *
 * Owning a thing and having it to hand are two things. Each item is in one
 * place:
 * - at a home of theirs, in a spot there (the floor, a wardrobe, the fridge);
 * - on them, worn or carried;
 * - in a vehicle of theirs;
 * - inside another item, such as a suitcase;
 * - on an order, until it's delivered (`systems/orders.ts`);
 * - with a service, such as a dry cleaner or a tailor, until it's ready.
 * It can be used only where it is: an item at a home is to hand only to
 * someone at that home, one in a car only where the car is, one on an order
 * or at the cleaner's to no one. A thing never moves itself to wherever it’s
 * wanted.
 *
 * A move takes the household's belongings along (`followTheMove`). The bed
 * and the sofa are paid for as movers' work, and the rest travels in the
 * same boxes. Until 2026-10-01 the bed, sofa and gear were a timestamp each
 * that followed the person anywhere; they migrate into items here, at the
 * home they live in.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { PIECE_LABEL, type Piece } from '../content/furniture';
import { GARMENT_L } from '../content/garmentcare';
import { BUILT_IN, closetRefusal, fitRefusal, footprintOf, roomFitRefusal } from './rooms';
import { COLD_STORE } from '../content/coldstorage';
import { LIBRARY_BOOKS } from '../content/specialrooms';
import { CITIES } from '../content/geography';

/** Where a thing is. */
export type Place =
  /** At a home, in a spot there, and from 2026-10-04 in one of its rooms (`roomList`). */
  | { kind: 'home'; home: string; spot?: Spot; room?: string }
  | { kind: 'person' }
  | { kind: 'vehicle'; vehicleId: string }
  | { kind: 'inside'; itemId: string }
  | { kind: 'order'; orderId: string }
  | { kind: 'service'; serviceId: string; readyAt: Instant }
  /** Unpacked where they're staying away, in its town (from 2026-10-03, `systems/luggage.ts`); where, by name. */
  | { kind: 'stay'; cityId: string; by?: string }
  /** Left behind at a stay, held there until a day (from 2026-10-03). */
  | { kind: 'held'; cityId: string; by: string; until: Instant };

/** The spots a home keeps things in. Rooms come with Stage 12 of the backlog. */
export type Spot = 'floor' | 'wardrobe' | 'drawers' | 'fridge' | 'freezer' | 'pantry' | 'bathroom' | 'storage' | 'hamper' | 'shelves';
export const SPOT_LABEL: Readonly<Record<Spot, string>> = {
  floor: 'In The Rooms', wardrobe: 'The Wardrobe', drawers: 'The Drawers', fridge: 'The Fridge', freezer: 'The Freezer',
  pantry: 'The Pantry', bathroom: 'The Bathroom', storage: 'Storage', hamper: 'The Laundry Basket', shelves: 'The Library’s Shelves',
};

export interface Item {
  id: string;
  /** What it is: a catalog id (`furniture:bed`, a clothing variant's id), or `custom` for a design of their own. */
  kind: string;
  /** Title Case, as the screen names it. */
  label: string;
  quantity: number;
  /** 1 new, falling with wear. */
  condition: number;
  at: Place;
  acquiredAt: Instant;
  /** What was paid for it, in the save's money, where it was bought. */
  paid?: Money;
  /** Its chosen options (a size, a color, a fabric), where it has any. */
  spec?: Readonly<Record<string, string>>;
  /** A book's words read so far, and whether it's been read through (`systems/reading.ts`, from 2026-10-03). */
  readWords?: number;
  readThrough?: true;
  /** How much room it takes, and how much it holds where it's a container, liters. */
  volumeL?: number;
  holdsL?: number;
  /** Moved by movers or a delivery, never by hand: furniture. It goes between spots at a home, and with a move. */
  bulky?: boolean;
  /** Flat-packed until it's put together (`items.assemble`, from 2026-10-03). */
  flatPacked?: true;
  /** Booked for the council's bulky collection, then (`items.discard`, from 2026-10-03). */
  collectAt?: Instant;
  /** A garment's kind, care and wear (`systems/wardrobe.ts`). */
  garment?: import('./wardrobe').Garment;
  /** A phone: which, its color, its line, its battery and what's paid on it (`systems/phones.ts`, from 2026-10-02). */
  device?: import('./phones').Device;
  /** Food: what it is, how much is left, and when it goes off (`systems/pantry.ts`). */
  food?: import('./pantry').Food;
  /** A toiletry: its kind and how much is left (`systems/hygiene.ts`). */
  supply?: import('./hygiene').Supply;
  /** A quartz watch's battery fitted then, where it's been changed since it was bought (`systems/watches.ts`, from 2026-10-02). */
  batteryAt?: Instant;
  /** A mechanical watch's last service by its maker, from 2026-10-03 (`systems/watches.ts`). */
  servicedAt?: Instant;
  /** Words engraved on a piece, from 2026-10-03 (`systems/commissions.ts`). */
  engraved?: string;
  /** Jewelry or a watch scheduled on the home's insurance, at what was paid (`systems/valuables.ts`, from 2026-10-02). */
  scheduled?: true;
  /** Where it keeps, bought on a trip and not yet put away (from 2026-10-03): the fridge, the pantry, the wardrobe. */
  storeIn?: Spot;
  /** A bag of pet food, by species, grams left; cat litter, kilograms left (`systems/pets.ts`, from 2026-10-04). */
  petFood?: { species: 'dog' | 'cat'; leftG: number; /** Its label's energy (from 2026-10-05); Royal Canin's where none. */ kcalPerKg?: number };
  litterKg?: number;
  /** A bed's market and size (`content/beds.ts`, from 2026-10-01); an older bed is its country's usual double. */
  bed?: { country: string; size: string };
}

/** The key of a home they live in: an owned home by its id, any other by its kind, town and when it began. */
export function homeKeyOf(home: Person['home']): string | undefined {
  if (!home) return undefined;
  return home.kind === 'owned' && home.homeId ? `owned:${home.homeId}` : `${home.kind}:${home.cityId}:${home.since}`;
}

/** Their possessions, the furniture of a save from before items brought in. */
export function itemsOf(person: Person): Item[] {
  const items = (person.items ??= []);
  if (person.furniture && Object.keys(person.furniture).length) {
    const home = homeKeyOf(person.home);
    for (const [piece, at] of Object.entries(person.furniture) as [Piece, number | undefined][]) {
      if (at === undefined || !home) continue;
      items.push({ id: `furniture-${piece}-${at}`, kind: `furniture:${piece}`, label: PIECE_LABEL[piece].replace(/^An? /, ''), quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: at, bulky: true });
    }
    delete person.furniture;
  }
  return items;
}

export const itemById = (person: Person, id: string): Item | undefined => itemsOf(person).find((i) => i.id === id);

/** A new possession, where it's put. */
export function addItem(sim: Simulation, person: Person, item: Omit<Item, 'id'>): Item {
  const made: Item = { ...item, id: sim.nextId('item') };
  itemsOf(person).push(made);
  return made;
}

/** Whether a place is to hand for them now. */
export function reachable(sim: Simulation, person: Person, place: Place): boolean {
  switch (place.kind) {
    case 'person': return true;
    case 'home': return place.home === homeKeyOf(person.home) && person.home?.cityId === person.currentLocationId && !person.stay;
    case 'vehicle': {
      const v = (person.vehicles ?? []).find((x) => x.id === place.vehicleId && x.soldAt === undefined && !x.repossessed);
      return Boolean(v && (v.at ?? v.cityId) === person.currentLocationId && !(v.stolen && v.stolen.recoverAt === undefined));
    }
    case 'inside': {
      // `moveRefusal` lets nothing go inside what it holds, so a holder is never its own.
      const holder = itemById(person, place.itemId);
      return Boolean(holder && reachable(sim, person, holder.at));
    }
    case 'stay': return Boolean(person.stay) && person.currentLocationId === place.cityId;
    case 'held':
    case 'order':
    case 'service': return false;
  }
}

/** Their items to hand now. */
export const toHand = (sim: Simulation, person: Person): Item[] => itemsOf(person).filter((i) => reachable(sim, person, i.at));

/** What a thing takes up, liters: its own figure; a garment folded (`GARMENT_L`, SLATE's estimate); a toiletry its contents (from 2026-10-02, until when a garment took up nothing). */
export function volumeOf(item: Item): number {
  if (item.volumeL !== undefined) return item.volumeL;
  if (item.garment) return GARMENT_L[item.garment.slot];
  if (item.supply) return item.supply.unit === 'ct' ? 0.05 : item.supply.left / 1000;
  // Food as water weighs, a liter a kilogram; a count a quarter of a liter each, a dish's portion the same: SLATE's estimate.
  if (item.food) return item.food.unit === 'ct' ? item.food.left * 0.25 : item.food.left / 1000;
  return 0;
}

/** How much of a container is used, liters. */
export const usedL = (person: Person, holderId: string): number => itemsOf(person).filter((i) => i.at.kind === 'inside' && i.at.itemId === holderId).reduce((sum, i) => sum + volumeOf(i) * i.quantity, 0);

/** The fridge's or freezer's liters at the home they live in, by its country (`content/coldstorage.ts`); none where the country's isn't kept. */
export function coldRoomL(person: Person, spot: 'fridge' | 'freezer'): number | undefined {
  const store = COLD_STORE[CITIES.get(person.home?.cityId ?? '')?.countryId ?? ''];
  return store ? (spot === 'fridge' ? store.fridgeL : store.freezerL) : undefined;
}

/** What's in the fridge or freezer at a home now, liters. */
export const coldUsedL = (person: Person, home: string, spot: 'fridge' | 'freezer'): number => itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === home && i.at.spot === spot).reduce((sum, i) => sum + volumeOf(i) * i.quantity, 0);

/** Why a thing can't go to a place now, or nothing where it can. */
export function moveRefusal(sim: Simulation, person: Person, item: Item, to: Place): string | undefined {
  if (!reachable(sim, person, item.at)) return `The ${item.label} isn’t to hand: ${whereWords(person, item.at)}.`;
  if (!reachable(sim, person, to)) return 'You can’t get to that place now.';
  if (item.bulky && to.kind !== 'home') return `The ${item.label} is moved by movers, not by hand.`;
  if (to.kind === 'home') {
    const spot = to.spot ?? 'floor';
    const no = spotRefusal(item, spot);
    if (no) return no;
    // The home they live in has only so much built-in storage and floor (`systems/rooms.ts`, from 2026-10-03).
    const was = item.at.kind === 'home' && item.at.home === to.home ? item.at.spot ?? 'floor' : undefined;
    if (to.home === homeKeyOf(person.home)) {
      if (BUILT_IN.has(spot) && !(was && BUILT_IN.has(was))) { const full = closetRefusal(sim, person, item); if (full) return full; }
      if (spot === 'floor' && was !== 'floor' && item.bulky) { const tight = fitRefusal(sim, person, footprintOf(item)); if (tight) return tight; }
      // Into a room by name (from 2026-10-04): what that room is for, and its own floor.
      if (to.room !== undefined) { if (spot !== 'floor') return 'A room is chosen for what stands on the floor.'; const fit = roomFitRefusal(sim, person, item, to.room); if (fit) return fit; }
      // A library's shelves, where the home has one, hold a thousand books (`content/specialrooms.ts`, from 2026-10-04).
      if (spot === 'shelves' && was !== spot) {
        const owned = (person.homes ?? []).find((h) => `owned:${h.id}` === to.home);
        if (!owned?.facts.features.includes('library')) return 'This home has no library.';
        const shelved = itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === to.home && i.at.spot === 'shelves').reduce((n, i) => n + i.quantity, 0);
        if (shelved + item.quantity > LIBRARY_BOOKS) return `The library’s shelves are full: ${LIBRARY_BOOKS} books.`;
      }
      // The fridge and freezer hold so much (from 2026-10-04).
      if ((spot === 'fridge' || spot === 'freezer') && was !== spot) {
        const holds = coldRoomL(person, spot);
        const left = holds === undefined ? Infinity : holds - coldUsedL(person, to.home, spot);
        if (volumeOf(item) * item.quantity > left + 1e-9) return `${SPOT_LABEL[spot]} is full: ${Math.max(0, Math.floor(left))} liters of its ${Math.round(holds!)} are free, and the ${item.label} needs ${Math.ceil(volumeOf(item) * item.quantity)}.`;
      }
    }
  }
  if (to.kind === 'inside') {
    if (to.itemId === item.id) return 'A thing can’t go inside itself.';
    const holder = itemById(person, to.itemId);
    if (!holder?.holdsL) return 'That doesn’t hold things.';
    if (holder.flatPacked) return `The ${holder.label} is still flat-packed: put it together first.`;
    // Nor inside something it holds.
    for (let at: Place | undefined = holder.at; at?.kind === 'inside'; at = itemById(person, at.itemId)?.at) if (at.itemId === item.id) return 'It holds that already.';
    const room = holder.holdsL - usedL(person, holder.id);
    if (volumeOf(item) * item.quantity > room + 1e-9) return `The ${holder.label} has ${Math.max(0, Math.floor(room))} liters left; the ${item.label} needs ${Math.ceil(volumeOf(item) * item.quantity)}.`;
  }
  return undefined;
}

/** Whether a thing goes in a spot at home: furniture in the rooms or storage, and only food in the fridge, freezer or pantry. */
export function spotRefusal(item: Item, spot: Spot): string | undefined {
  if (item.bulky && spot !== 'floor' && spot !== 'storage') return `The ${item.label} stands in a room, or in storage.`;
  const food = item.food !== undefined;
  if ((spot === 'fridge' || spot === 'freezer' || spot === 'pantry') && !food) return `${SPOT_LABEL[spot]} is for food.`;
  if (spot === 'shelves' && !item.kind.startsWith('book:')) return `${SPOT_LABEL[spot]} are for books.`;
  return undefined;
}

/** Words for where a place is. */
export function whereWords(person: Person, place: Place): string {
  switch (place.kind) {
    case 'person': return 'on you';
    case 'home': return place.home === homeKeyOf(person.home) ? `at home${place.spot && place.spot !== 'floor' ? `, ${SPOT_LABEL[place.spot].toLowerCase()}` : ''}` : 'at another home of yours';
    case 'vehicle': return 'in a vehicle';
    case 'inside': return `in the ${itemById(person, place.itemId)?.label ?? 'bag'}`;
    case 'order': return 'on its way';
    case 'service': return 'with a service';
    case 'stay': return place.by ? `unpacked in your room at ${place.by}` : 'unpacked where you’re staying';
    case 'held': return `left at ${place.by}`;
  }
}

/** The home being left: its key, a save's furniture from before items settled into it first. */
export function leavingHome(person: Person): string | undefined {
  itemsOf(person);
  return homeKeyOf(person.home);
}

/** A move's belongings: what was at the home they left goes to the one they live in now. */
export function followTheMove(person: Person, fromKey: string | undefined): void {
  const to = homeKeyOf(person.home);
  if (!fromKey || !to) return;
  for (const item of itemsOf(person)) if (item.at.kind === 'home' && item.at.home === fromKey) item.at = { ...item.at, home: to };
}

/** Whether they have a piece of furniture at the home they live in. */
export const hasAtHome = (person: Person, kind: string): boolean => {
  const home = homeKeyOf(person.home);
  return Boolean(home) && itemsOf(person).some((i) => i.kind === kind && i.at.kind === 'home' && i.at.home === home);
};

export function registerItems(sim: Simulation): void {
  sim.onCommand<{ itemId: string; to: Place }, { at: Place }>('items.move', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    if (!item) throw new CommandError('That isn’t something you own.');
    const to = p?.to;
    if (!to || typeof to !== 'object') throw new CommandError('Where to?');
    const no = moveRefusal(s, person, item, to);
    if (no) throw new CommandError(no);
    item.at = to.kind === 'home' ? { kind: 'home', home: to.home, spot: to.spot ?? 'floor', ...(to.room !== undefined && (to.spot ?? 'floor') === 'floor' ? { room: String(to.room) } : {}) } : to;
    return { at: item.at };
  });
}
