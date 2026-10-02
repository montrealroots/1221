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
 * take in a cabin; SLATE doesn't keep what a garment takes up, so what's
 * packed isn't held to it. A life begins with one.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Slot } from '../content/garmentcare';
import { addItem, homeKeyOf, itemsOf, type Item } from './items';
import { garmentsOf } from './wardrobe';
import { suppliesOf } from './hygiene';

export const CARRY_ON = { label: 'Carry-On Suitcase', holdsL: 45 } as const;
/** A week's clothes, by part. SLATE's estimate. */
export const PACK: Readonly<Partial<Record<Slot, number>>> = { top: 7, bottom: 3, underwear: 7, socks: 7, shoes: 1, outer: 1, dress: 2, suit: 1, active: 2 };

const isLuggage = (i: Item) => i.kind === 'luggage:carry-on';
export const suitcaseOf = (person: Person): Item | undefined => itemsOf(person).find(isLuggage);

/** A carry-on for a life that hasn't one, at home in storage. */
export function starterLuggage(sim: Simulation, person: Person): boolean {
  const home = homeKeyOf(person.home);
  if (suitcaseOf(person) || !home || person.clothesSince === undefined) return false;
  addItem(sim, person, { kind: 'luggage:carry-on', label: CARRY_ON.label, quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'storage' }, acquiredAt: sim.now, holdsL: CARRY_ON.holdsL, volumeL: CARRY_ON.holdsL });
  return true;
}

/** Packs from home: the suitcase on them, a week's clothes in it, the cleanest first, and the bathroom's things. */
export function pack(person: Person): number {
  const bag = suitcaseOf(person);
  const home = homeKeyOf(person.home);
  if (!bag || !home) return 0;
  const atHome = (i: Item) => i.at.kind === 'home' && i.at.home === home;
  bag.at = { kind: 'person' };
  const into = { kind: 'inside' as const, itemId: bag.id };
  const chosen = new Set(person.dressed ?? []);
  const ready = garmentsOf(person).filter((g) => atHome(g) && !g.garment.dirty && g.condition > 0)
    .sort((a, b) => Number(chosen.has(b.id)) - Number(chosen.has(a.id)) || a.garment.wears - b.garment.wears || a.id.localeCompare(b.id));
  const counts: Partial<Record<Slot, number>> = {};
  let packed = 0;
  for (const g of ready) {
    const slot = g.garment.slot;
    // The outfit they chose sorts first, so it's always in.
    if ((counts[slot] ?? 0) >= (PACK[slot] ?? 0)) continue;
    counts[slot] = (counts[slot] ?? 0) + 1;
    g.at = into;
    packed += 1;
  }
  // One of each of the bathroom's things that's in use.
  const kinds = new Set<string>();
  for (const s of suppliesOf(person).filter(atHome)) {
    if (kinds.has(s.supply.kind)) continue;
    kinds.add(s.supply.kind);
    s.at = into;
    packed += 1;
  }
  return packed;
}

/** Unpacks at home: the clothes to the wardrobe, the toiletries to the bathroom, the suitcase to storage. */
export function unpack(person: Person): number {
  const bag = suitcaseOf(person);
  const home = homeKeyOf(person.home);
  if (!bag || !home || bag.at.kind !== 'person') return 0;
  let out = 0;
  for (const i of itemsOf(person)) {
    if (i.at.kind !== 'inside' || i.at.itemId !== bag.id) continue;
    i.at = { kind: 'home', home, spot: i.supply ? 'bathroom' : 'wardrobe' };
    out += 1;
  }
  bag.at = { kind: 'home', home, spot: 'storage' };
  return out;
}

/**
 * After a move between towns: leaving the town they live in packs, coming
 * back to it unpacks, and between two towns away the suitcase goes with
 * them. Called wherever a person's town changes.
 */
export function traveled(person: Person, from: string): void {
  const homeCity = person.home?.cityId;
  if (!homeCity || from === person.currentLocationId) return;
  if (person.currentLocationId === homeCity) unpack(person);
  else if (from === homeCity) pack(person);
}


/** Moves a person to a town, packing or unpacking as they go. */
export function moveTo(person: Person, cityId: string): void {
  const from = person.currentLocationId;
  person.currentLocationId = cityId;
  traveled(person, from);
}
