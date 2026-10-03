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
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Slot } from '../content/garmentcare';
import { CommandError } from '../core/simulation';
import { addItem, homeKeyOf, itemsOf, reachable, usedL, volumeOf, type Item } from './items';
import { garmentsOf } from './wardrobe';
import { suppliesOf } from './hygiene';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { LUGGAGE, type LuggagePiece } from '../content/luggagecatalog';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';

export const CARRY_ON = { label: 'Carry-On Suitcase', holdsL: 45 } as const;
/** A week's clothes, by part. SLATE's estimate. */
export const PACK: Readonly<Partial<Record<Slot, number>>> = { base: 2, top: 7, bottom: 3, underwear: 7, socks: 7, shoes: 1, outer: 1, dress: 2, suit: 1, active: 2 };

const isLuggage = (i: Item) => i.kind.startsWith('luggage:');
/** The bag that goes away: the one chosen, or the first owned. */
export const suitcaseOf = (person: Person): Item | undefined => itemsOf(person).find((i) => i.id === person.luggageId && isLuggage(i)) ?? itemsOf(person).find(isLuggage);
export const bagsOf = (person: Person): Item[] => itemsOf(person).filter(isLuggage);

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
  const bag = suitcaseOf(person);
  const home = homeKeyOf(person.home);
  if (!bag || !home) return 0;
  bag.at = { kind: 'person' };
  if (packedIn(person, bag).length > 0) return 0;
  return packAWeek(person, bag, home);
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

/** Unpacks at home: the clothes to the wardrobe, the toiletries to the bathroom, the suitcase to storage. Coming home does it; so does Unpack. */
export function unpack(person: Person, force = false): number {
  const bag = suitcaseOf(person);
  const home = homeKeyOf(person.home);
  if (!bag || !home || (!force && bag.at.kind !== 'person')) return 0;
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

/** Why the suitcase can't be packed or unpacked here now, or nothing: at home, with it to hand. */
export function luggageRefusal(sim: Simulation, person: Person): string | undefined {
  const bag = suitcaseOf(person);
  if (!bag) return 'You have no suitcase.';
  if (!homeKeyOf(person.home) || person.home!.cityId !== person.currentLocationId || person.stay) return 'You pack and unpack at home.';
  if (!reachable(sim, person, bag.at)) return 'The suitcase isn’t to hand.';
  return undefined;
}

export function registerLuggage(sim: Simulation): void {
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
  sim.onCommand<Record<string, never>, { unpacked: number }>('luggage.unpack', (_p, { sim: s }) => {
    const person = s.player;
    const no = luggageRefusal(s, person);
    if (no) throw new CommandError(no);
    const out = unpack(person, true);
    if (out === 0) throw new CommandError('The suitcase is empty.');
    return { unpacked: out };
  });
}
