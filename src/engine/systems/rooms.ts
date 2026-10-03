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
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_MINUTE, startOfDay, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { BED_MARKET, DEFAULT_BED_SIZE, bedSize } from '../content/beds';
import { homePlace } from './dwelling';
import { livingIn } from './homes';
import { homeKeyOf, itemsOf, volumeOf, type Item, type Spot } from './items';
import { pieceById } from './furnishings';
import { bareHome } from './furniture';

const SQFT_M2 = 0.092903;
export const NDSS = { doubleM2: 11.5, ceilingM: 2.3, storageM2: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0] } as const;
/** What share of a floor can be furnished. SLATE's estimate. */
export const FURNISHABLE = 0.5;
/** The KIVIK three-seat's footprint, IKEA's own 228 by 95 cm. */
export const KIVIK_M2 = 2.28 * 0.95;
export const BUILT_IN: ReadonlySet<Spot> = new Set(['wardrobe', 'drawers', 'storage']);
/** A flatmate's morning shower: when it may start, from 6:30 for two hours, and REU2016's 7.8 minutes. */
export const MORNING = { fromMinute: 6 * 60 + 30, spanMinutes: 120, showerMinutes: 7.8 } as const;

export interface Rooms { bedrooms: number; floorM2: number; closetL: number; flatmates: number }

/** The home they live in as rooms: bedrooms, their floor, built-in storage and who shares the bathroom. */
export function roomsOf(sim: Simulation, person: Person): Rooms | undefined {
  const home = person.home;
  const place = homePlace(sim, person);
  if (!home || !place || home.kind === 'sofa') return undefined;
  const owned = livingIn(person);
  const bedrooms = place.type === 'studio' ? 0 : owned?.facts.beds ?? home.unit?.beds ?? 1;
  if (home.kind === 'shared') {
    return { bedrooms: 1, floorM2: NDSS.doubleM2, closetL: NDSS.storageM2[0]! * NDSS.ceilingM * 1_000, flatmates: Math.max(0, (home.unit?.beds ?? 2) - 1) };
  }
  const storage = NDSS.storageM2[Math.min(NDSS.storageM2.length - 1, Math.max(1, bedrooms))]!;
  return { bedrooms, floorM2: place.size * SQFT_M2, closetL: storage * NDSS.ceilingM * 1_000, flatmates: 0 };
}

/** A piece's footprint, m². */
export function footprintOf(item: Item): number {
  if (item.kind === 'furniture:bed') {
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
  const slots = Array.from({ length: rooms.flatmates }, (_, n) => {
    const from = day + (MORNING.fromMinute + sim.rng('rooms.shower', person.id, String(day), String(n)).next() * MORNING.spanMinutes) * MS_MINUTE;
    return [from, from + MORNING.showerMinutes * MS_MINUTE] as const;
  }).sort((a, b) => a[0] - b[0]);
  let t = at;
  for (const [from, to] of slots) if (from < t + minutes * MS_MINUTE && to > t) t = to;
  return Math.ceil((t - at) / MS_MINUTE);
}
