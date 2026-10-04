/**
 * SLATE — a home's rooms (the master plan's "Still Open", from 2026-10-03):
 * how much floor there is to furnish, how much its built-in storage holds,
 * and who shares the bathroom.
 *
 * **The floor.** A home's own size, or in a flat-share your room: a double
 * bedroom's 11.5 m², the least England's Nationally Described Space Standard
 * allows (read on gov.uk, 2026-10-03), SLATE's reading of a let room. Half of
 * it can be furnished, SLATE's estimate of what leaves room to walk, open a
 * door and pull out a chair. A piece takes its footprint: an IKEA piece its
 * own published width by depth, a bed its mattress's size, a sofa bought as
 * the KIVIK its 228 by 95 cm; a TV, a console and a soundbar stand on what's
 * there. A home that comes furnished, as every rented one and an owned one
 * not bought empty does (`FURNISHED`), has its bed, its three-seat sofa and a
 * table for four with its chairs on the floor already, sized as IKEA's KIVIK
 * and SANDSBERG (109.9 by 67 cm, a chair 39.1 by 47); a let room only the bed,
 * the rest being in the shared rooms. A piece that won't fit isn't bought.
 *
 * **Built-in storage**, the wardrobe, the drawers and storage together: the
 * standard's least by bedrooms (1.0 m² for one person, 1.5 for one bedroom,
 * 2 for two, 2.5 for three, then half a square meter a bedroom to 4 at six),
 * to its least ceiling, 2.3 m, SLATE's reading everywhere. A thing doesn't
 * go in when it's full, and what's bought for it goes in the rooms instead.
 *
 * **The bathroom** in a flat-share is shared with the flatmates, one for
 * each other bedroom, a rented flat's one bathroom being SLATE's reading
 * (a drawn rental keeps no count of them). Each showers once a morning, at a
 * minute drawn between 6:30 and 8:30, SLATE's estimate of a working morning,
 * for REU2016's average shower, 7.8 minutes; a shower that would meet one of
 * theirs waits for it.
 *
 * From 2026-10-03 a partner living with you showers the same way, sharing
 * the bathroom where the home has one: an owned home's own count, a rented
 * home's one, SLATE's reading. With two or more, a partner's shower is in
 * the other and nobody waits. Until then only flatmates were in the morning.
 *
 * **Room by room** (from 2026-10-04, the owner's expansion): the home as its
 * rooms, each with a name, what it's used for, its size, whose it is and
 * what's fixed in it (`roomList`). Bedrooms are the standard's least, a
 * double's 11.5 m² for the first and a single's 7.5 for the rest, and a
 * bathroom four, SLATE's reading where the standard sets none; the living
 * room and the kitchen share the rest, three to two, all scaled to the home's
 * own floor. Each bedroom has one use: yours, then the rooms given over (a
 * theater, a studio, a soundproofed room, a library, a gym), then a lodger's,
 * then the spares, each kept spare or used for storage as chosen
 * (`home.room_use`); a storage room holds half its volume to the ceiling,
 * SLATE's estimate. Until then a lodger could be let the same spare bedroom a
 * library was in. Furniture is put in a room (`items.move` with a room): a
 * bed in a bedroom, a sofa in the living room, a dining table in the living
 * room or the kitchen, and only in the floor that room has to furnish.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_MINUTE, startOfDay, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { BED_MARKET, DEFAULT_BED_SIZE, bedSize } from '../content/beds';
import { fixturesOf, homePlace } from './dwelling';
import { livingIn } from './homes';
import { livesWithPartner } from './marriage';
import { homeKeyOf, itemsOf, volumeOf, type Item, type Spot } from './items';
import { pieceById } from './furnishings';
import { bareHome, pieceCost } from './furniture';
import { payFromBank } from './household';
import { addItem } from './items';
import { WALK_IN_L } from '../content/specialrooms';

const SQFT_M2 = 0.092903;
export const NDSS = { doubleM2: 11.5, ceilingM: 2.3, storageM2: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0] } as const;
/** What share of a floor can be furnished. SLATE's estimate. */
export const FURNISHABLE = 0.5;
/** The KIVIK three-seat's footprint, IKEA's own 228 by 95 cm. */
export const KIVIK_M2 = 2.28 * 0.95;
export const BUILT_IN: ReadonlySet<Spot> = new Set(['wardrobe', 'drawers', 'storage']);
/** A flatmate's morning shower: when it may start, from 6:30 for two hours, and REU2016's 7.8 minutes. */
export const MORNING = { fromMinute: 6 * 60 + 30, spanMinutes: 120, showerMinutes: 7.8 } as const;

export interface Rooms { floorM2: number; closetL: number; flatmates: number; /** Its bathrooms: an owned home's count, else one (from 2026-10-03). */ bathrooms: number }

export type RoomKind = 'bedroom' | 'bathroom' | 'kitchen' | 'living';
export type RoomUse = 'yours' | 'homeTheater' | 'danceStudio' | 'soundproofRoom' | 'library' | 'gym' | 'lodger' | 'storage' | 'guest' | 'spare';
export interface Room { id: string; kind: RoomKind; label: string; use?: RoomUse; m2: number; access: 'yours' | 'shared'; fixtures: string[] }
export const ROOM_USE_LABEL: Readonly<Record<RoomUse, string>> = {
  yours: 'Your Bedroom', homeTheater: 'A Home Theater', danceStudio: 'A Dance Studio', soundproofRoom: 'A Soundproofed Room', library: 'A Library',
  gym: 'A Home Gym', lodger: 'A Lodger’s Room', storage: 'A Storage Room', guest: 'A Guest Room', spare: 'A Spare Room',
};
/** The standard's single bedroom; a bathroom, SLATE's reading where the standard sets none; a storage room's usable share, SLATE's estimate. */
export const SINGLE_M2 = 7.5;
export const BATHROOM_M2 = 4;
export const STORAGE_ROOM_SHARE = 0.5;
const GIVEN: readonly RoomUse[] = ['homeTheater', 'danceStudio', 'soundproofRoom', 'library'];

/** The home they live in, room by room: what each is, its use, its size, whose and what's fixed in it. */
export function roomList(sim: Simulation, person: Person): Room[] {
  const home = person.home;
  const place = homePlace(sim, person);
  if (!home || !place || home.kind === 'sofa') return [];
  const owned = livingIn(person);
  const shared = home.kind === 'shared';
  const f = owned?.facts.features ?? [];
  const beds = place.type === 'studio' ? 0 : shared ? Math.max(1, home.unit?.beds ?? 2) : owned?.facts.beds ?? home.unit?.beds ?? 1;
  const baths = Math.max(1, owned?.facts.baths ?? home.unit?.baths ?? 1);
  const floor = shared ? Math.max(NDSS.doubleM2 * 3, (home.unit?.size ?? 0) * SQFT_M2) : place.size * SQFT_M2;
  // The least each takes, then all scaled to the floor there is.
  const bedM2 = Array.from({ length: beds }, (_, n) => (n === 0 ? NDSS.doubleM2 : SINGLE_M2));
  const fixedM2 = bedM2.reduce((a, b) => a + b, 0) + baths * BATHROOM_M2;
  const rest = Math.max(floor - fixedM2, floor * 0.3);
  const scale = floor / (fixedM2 + rest);
  const rooms: Room[] = [];
  // The spare bedrooms' uses: given over by works, then a home gym, then lodgers, then each as chosen.
  const uses: RoomUse[] = ['yours', ...GIVEN.filter((u) => f.includes(u as never)), ...(owned && fixturesOf(sim, person, owned.cityId, owned.facts, owned.id).gym === 'home' ? ['gym' as const] : []), ...(owned?.lodgers ?? []).map(() => 'lodger' as const)];
  for (let n = 0; n < beds; n += 1) {
    const id = `bedroom-${n + 1}`;
    const chosen = owned?.roomUses?.[id];
    const use: RoomUse = uses[n] ?? (chosen === 'storage' || chosen === 'guest' ? chosen : 'spare');
    rooms.push({ id, kind: 'bedroom', label: n === 0 ? 'The Main Bedroom' : `Bedroom ${n + 1}`, use, m2: bedM2[n]! * scale, access: shared && n > 0 ? 'shared' : 'yours', fixtures: [] });
  }
  if (shared) for (const r of rooms.slice(1)) r.use = undefined;
  for (let n = 0; n < baths; n += 1) rooms.push({ id: `bathroom-${n + 1}`, kind: 'bathroom', label: baths === 1 ? 'The Bathroom' : `Bathroom ${n + 1}`, m2: BATHROOM_M2 * scale, access: shared ? 'shared' : 'yours', fixtures: [place.fixtures.bathtub && n === 0 ? 'A Bathtub' : 'A Shower'] });
  rooms.push({ id: 'living', kind: 'living', label: place.type === 'studio' ? 'The Main Room' : 'The Living Room', m2: rest * 0.6 * scale, access: shared ? 'shared' : 'yours', fixtures: place.fixtures.cooling !== 'none' ? ['Air Conditioning'] : [] });
  rooms.push({ id: 'kitchen', kind: 'kitchen', label: 'The Kitchen', m2: rest * 0.4 * scale, access: shared ? 'shared' : 'yours', fixtures: [...(place.fixtures.dishwasher ? ['A Dishwasher'] : []), ...(place.fixtures.laundry === 'in-unit' ? ['A Washer And Dryer'] : [])] });
  return rooms;
}

/** Spare bedrooms free for something new: a lodger or a room given over, which take one kept for storage or guests first. */
export const spareRooms = (sim: Simulation, person: Person): Room[] => roomList(sim, person).filter((r) => r.kind === 'bedroom' && (r.use === 'spare' || r.use === 'storage' || r.use === 'guest'));

/** A bed kept for guests, apart from the one slept in, which the bed's wear and the night read (from 2026-10-04). */
export const GUEST_BED = 'furniture:guestbed';
const isBedItem = (i: Item): boolean => i.kind === 'furniture:bed' || i.kind === GUEST_BED || /bed/i.test(pieceById(i.kind.slice(5))?.type ?? '');

/**
 * The guest room of the home they own and live in, made up: a spare bedroom kept for guests with a bed in it (from
 * 2026-10-04). A friend from another town asked home comes and stays the night in it (`declines` in
 * `systems/people.ts`), where without it they'd say they live elsewhere. One room sleeps one friend, so a gathering of
 * several isn't put up.
 */
export function guestRoom(sim: Simulation, person: Person): Room | undefined {
  const home = homeKeyOf(person.home);
  return roomList(sim, person).find((r) => r.use === 'guest' && itemsOf(person).some((i) => i.at.kind === 'home' && i.at.home === home && i.at.room === r.id && isBedItem(i)));
}

/** What a storage room adds to the built-in storage, liters. */
export const storageRoomsL = (sim: Simulation, person: Person): number => roomList(sim, person).filter((r) => r.use === 'storage').reduce((n, r) => n + r.m2 * NDSS.ceilingM * STORAGE_ROOM_SHARE * 1_000, 0);

/** Where a piece of furniture may stand: a bed in a bedroom, a sofa in a living room, a table in a living room or kitchen; anything else in any room but a bathroom. */
export function roomFitRefusal(sim: Simulation, person: Person, item: Item, roomId: string): string | undefined {
  const room = roomList(sim, person).find((r) => r.id === roomId);
  if (!room) return 'There’s no such room here.';
  if (room.access === 'shared' && room.kind === 'bedroom') return 'That’s a flatmate’s room.';
  if (room.use === 'lodger') return 'That’s the lodger’s room.';
  const kind = item.kind;
  const isBed = isBedItem(item);
  const isSofa = kind === 'furniture:sofa' || /sofa/i.test(pieceById(kind.slice(5))?.type ?? '');
  const isTable = kind === 'furniture:table' || /table/i.test(pieceById(kind.slice(5))?.type ?? '');
  if (isBed && room.kind !== 'bedroom') return 'A bed goes in a bedroom.';
  if (isSofa && room.kind !== 'living' && room.kind !== 'bedroom') return 'A sofa goes in a living room or a bedroom.';
  if (isTable && room.kind === 'bathroom') return 'A table doesn’t go in a bathroom.';
  if (room.kind === 'bathroom') return 'Furniture doesn’t go in a bathroom.';
  const home = homeKeyOf(person.home);
  const taken = itemsOf(person).filter((i) => i.id !== item.id && i.at.kind === 'home' && i.at.home === home && i.at.room === roomId).reduce((n, i) => n + footprintOf(i), 0);
  const room2 = room.m2 * FURNISHABLE;
  if (taken + footprintOf(item) > room2 + 1e-9) return `It won’t fit in ${room.label.replace(/^The /, 'the ')}: ${taken.toFixed(1)} of its ${room2.toFixed(1)} m² that can be furnished is taken, and it needs ${footprintOf(item).toFixed(1)}.`;
  return undefined;
}

/** The home they live in as rooms: the floor, built-in storage by its bedrooms, and who shares the bathroom. */
export function roomsOf(sim: Simulation, person: Person): Rooms | undefined {
  const home = person.home;
  const place = homePlace(sim, person);
  if (!home || !place || home.kind === 'sofa') return undefined;
  const owned = livingIn(person);
  const bedrooms = place.type === 'studio' ? 0 : owned?.facts.beds ?? home.unit?.beds ?? 1;
  if (home.kind === 'shared') {
    return { floorM2: NDSS.doubleM2, closetL: NDSS.storageM2[0]! * NDSS.ceilingM * 1_000, flatmates: Math.max(0, (home.unit?.beds ?? 2) - 1), bathrooms: home.unit?.baths ?? 1 };
  }
  const storage = NDSS.storageM2[Math.min(NDSS.storageM2.length - 1, Math.max(1, bedrooms))]!;
  // A walk-in closet built adds its hanging (`content/specialrooms.ts`, from 2026-10-04), and a spare room used for storage its share.
  const walkIn = owned?.facts.features.includes('walkInCloset') ? WALK_IN_L : 0;
  return { floorM2: place.size * SQFT_M2, closetL: storage * NDSS.ceilingM * 1_000 + walkIn + storageRoomsL(sim, person), flatmates: 0, bathrooms: owned?.facts.baths ?? home.unit?.baths ?? 1 };
}

/** A piece's footprint, m². */
export function footprintOf(item: Item): number {
  if (item.kind === 'furniture:bed' || item.kind === GUEST_BED) {
    const country = item.bed?.country ?? 'us';
    const s = bedSize(BED_MARKET[country] ?? 'na', item.bed?.size ?? DEFAULT_BED_SIZE[country] ?? 'queen');
    return s ? (s.widthCm * s.lengthCm) / 10_000 : 0;
  }
  if (item.kind === 'furniture:sofa') return KIVIK_M2;
  if (item.kind.startsWith('ikea:')) {
    const [w, d] = pieceById(item.kind.slice(5))?.cm ?? [];
    return w && d ? ((w * d) / 10_000) * item.quantity : 0;
  }
  return 0;
}

/** SANDSBERG's table for four and its four chairs, m². */
export const TABLE_SET_M2 = 1.099 * 0.67 + 4 * 0.391 * 0.47;

/** The floor the furniture in the rooms takes, m²: what they've put there, and what a furnished home comes with, less the piece of it one of their own replaces. */
export const furnishedM2 = (person: Person, replacing?: 'bed' | 'sofa'): number => {
  const home = homeKeyOf(person.home);
  const placed = itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === home && (i.at.spot ?? 'floor') === 'floor');
  let m2 = placed.reduce((n, i) => n + footprintOf(i), 0);
  if (!person.home || person.home.kind === 'sofa' || bareHome(person)) return m2;
  const country = CITIES.get(person.home.cityId)?.countryId ?? 'us';
  const usual = bedSize(BED_MARKET[country] ?? 'na', DEFAULT_BED_SIZE[country] ?? 'queen');
  if (usual && replacing !== 'bed' && !placed.some((i) => i.kind === 'furniture:bed')) m2 += (usual.widthCm * usual.lengthCm) / 10_000;
  if (person.home.kind === 'shared') return m2;
  if (replacing !== 'sofa' && !placed.some((i) => i.kind === 'furniture:sofa')) m2 += KIVIK_M2;
  return m2 + TABLE_SET_M2;
};

/** Why a piece of some footprint won't fit in the rooms, or nothing. */
export function fitRefusal(sim: Simulation, person: Person, addM2: number, replacing?: 'bed' | 'sofa'): string | undefined {
  const rooms = roomsOf(sim, person);
  if (!rooms || addM2 <= 0) return undefined;
  const room = rooms.floorM2 * FURNISHABLE;
  const taken = furnishedM2(person, replacing);
  if (taken + addM2 > room + 1e-9) return `It won’t fit: ${taken.toFixed(1)} of the ${room.toFixed(1)} m² that can be furnished is taken, and it needs ${addM2.toFixed(1)}.`;
  return undefined;
}

/** How much of the built-in storage is used, liters. */
export const closetUsedL = (person: Person): number => {
  const home = homeKeyOf(person.home);
  return itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === home && BUILT_IN.has(i.at.spot ?? 'floor')).reduce((n, i) => n + volumeOf(i) * i.quantity, 0);
};

/** Why something won't go in the built-in storage, or nothing. */
export function closetRefusal(sim: Simulation, person: Person, item: Item): string | undefined {
  const rooms = roomsOf(sim, person);
  if (!rooms) return undefined;
  const left = rooms.closetL - closetUsedL(person);
  const needs = volumeOf(item) * item.quantity;
  if (needs > left + 1e-9) return `The built-in storage has ${Math.max(0, Math.floor(left))} liters left; the ${item.label} needs ${Math.ceil(needs)}.`;
  return undefined;
}

/** Something just put in the built-in storage that overfills it goes in the rooms instead. The item, for chaining. */
export function overflow(sim: Simulation, person: Person, item: Item): Item {
  const rooms = roomsOf(sim, person);
  if (rooms && item.at.kind === 'home' && item.at.home === homeKeyOf(person.home) && BUILT_IN.has(item.at.spot ?? 'floor') && closetUsedL(person) > rooms.closetL + 1e-9) item.at = { ...item.at, spot: 'floor' };
  return item;
}

/** Minutes until the shared bathroom is free for a shower of some minutes from a moment. */
export function bathroomWait(sim: Simulation, person: Person, at: Instant, minutes: number): number {
  const rooms = roomsOf(sim, person);
  if (!rooms || person.home?.cityId !== person.currentLocationId) return 0;
  const zone = CITIES.require(person.home.cityId).timeZone;
  const day = startOfDay(at, zone);
  // Who else showers in the morning: the flatmates, and a partner living there. With more than one bathroom, a shower waits
  // only while every one is taken (from 2026-10-03).
  const others = rooms.flatmates + (livesWithPartner(person) ? 1 : 0);
  const slots = Array.from({ length: others }, (_, n) => {
    const from = day + (MORNING.fromMinute + sim.rng('rooms.shower', person.id, String(day), String(n)).next() * MORNING.spanMinutes) * MS_MINUTE;
    return [from, from + MORNING.showerMinutes * MS_MINUTE] as const;
  }).sort((a, b) => a[0] - b[0]);
  if (rooms.bathrooms < 2) {
    let t = at;
    for (const [from, to] of slots) if (from < t + minutes * MS_MINUTE && to > t) t = to;
    return Math.ceil((t - at) / MS_MINUTE);
  }
  // Minute by minute, the first start at which fewer showers than bathrooms run through the shower.
  const busy = (t: number) => { for (let m = 0; m < minutes; m += 1) { const u = t + m * MS_MINUTE; if (slots.filter(([from, to]) => from <= u && to > u).length >= rooms.bathrooms) return true; } return false; };
  let wait = 0;
  while (wait < 240 && busy(at + wait * MS_MINUTE)) wait += 1;
  return wait;
}

/** What making a room up for guests costs: nothing where a bed stands in it, else the place's usual bed delivered there. */
export function guestBedCost(sim: Simulation, person: Person, roomId: string): Money | undefined {
  const home = homeKeyOf(person.home);
  if (itemsOf(person).some((i) => i.at.kind === 'home' && i.at.home === home && i.at.room === roomId && isBedItem(i))) return 0;
  return person.home ? pieceCost(sim, person.home.cityId, 'bed')?.amount : undefined;
}

/** The place's usual bed, as a guest's: its country's commonest size. */
const guestBedOf = (person: Person): { country: string; size: string } | undefined => {
  const country = CITIES.get(person.home?.cityId ?? '')?.countryId ?? '';
  return BED_MARKET[country] && DEFAULT_BED_SIZE[country] ? { country, size: DEFAULT_BED_SIZE[country]! } : undefined;
};

export function registerRooms(sim: Simulation): void {
  // A spare bedroom kept spare or used for storage (from 2026-10-04), or kept for guests with a bed delivered for it.
  sim.onCommand<{ roomId: string; use: 'storage' | 'spare' | 'guest' }, { use: 'storage' | 'spare' | 'guest'; paid: Money }>('home.room_use', (p, { sim: s }) => {
    const person = s.player;
    const owned = livingIn(person);
    if (!owned) throw new CommandError('A room’s use is chosen in a home you own and live in.');
    const room = roomList(s, person).find((r) => r.id === p?.roomId);
    if (!room || room.kind !== 'bedroom' || (room.use !== 'spare' && room.use !== 'storage' && room.use !== 'guest')) throw new CommandError('That isn’t a spare bedroom.');
    const use = p.use === 'storage' || p.use === 'guest' ? p.use : 'spare';
    // A refusal below puts the room back as it was: a command refused leaves the world as it found it (`execute`).
    owned.roomUses = { ...(owned.roomUses ?? {}), [room.id]: use };
    // Kept spare or for guests again only where what's stored still fits the closets without it.
    const rooms = roomsOf(s, person);
    if (use !== 'storage' && rooms && closetUsedL(person) > rooms.closetL + 1e-9) throw new CommandError('What’s stored wouldn’t fit the closets without it: move some of it out first.');
    // Made up for guests, a bed for it where none stands there: the place's usual one, delivered, as `home.furnish` prices it.
    let paid: Money = 0;
    if (use === 'guest') {
      const cost = guestBedCost(s, person, room.id);
      const bed = guestBedOf(person);
      if (cost === undefined || (cost > 0 && !bed)) throw new CommandError('SLATE keeps no price for a bed where you live yet.');
      if (cost > 0) {
        const item = { kind: GUEST_BED, label: 'A Guest Bed', quantity: 1, condition: 1, at: { kind: 'home' as const, home: homeKeyOf(person.home)!, spot: 'floor' as const }, acquiredAt: s.now, paid: cost, bulky: true, bed: bed! };
        const tight = roomFitRefusal(s, person, { ...item, id: 'guest-bed' } as Item, room.id);
        if (tight) throw new CommandError(tight);
        if (!payFromBank(s, person, cost, `A bed for the guest room, ${owned.facts.address}`, 'home')) throw new CommandError('The bank couldn’t pay for a bed for it.');
        addItem(s, person, { ...item, at: { ...item.at, room: room.id } });
        paid = cost;
      }
    }
    return { use, paid };
  });
}
