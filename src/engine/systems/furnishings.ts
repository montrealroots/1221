/**
 * SLATE — IKEA's pieces for a home, each for what it does (from
 * 2026-10-02; the pieces in `content/furniturecatalog.ts`).
 *
 * A sofa, an armchair, a dining or desk chair is somewhere to sit: guests
 * are asked home only to what there are seats for (`systems/hosting.ts`). A
 * table is places to eat at: a dinner sits everyone at one. A wardrobe, a
 * PAX frame, a chest of drawers and a bookcase hold things, as many liters
 * as their outside measure, and are put things in like a bag
 * (`systems/items.ts`). Each is bought where you live at IKEA's price, with
 * the town's sales tax where it's added, and delivered at the same large-item
 * rate as a bed or a sofa (`content/furniture.ts`). A desk, a TV bench and
 * a coffee table are in the research but not sold: nothing SLATE keeps
 * would read them yet.
 *
 * A home that came furnished, a let or one owned before 2026-09-29, is taken
 * to have a three-seat sofa and a table for four with its chairs, SLATE's
 * reading of a furnished home; an empty one has only what's been bought.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { FURNITURE } from '../content/furniture';
import { FURNITURE_CATALOG, type CatalogPiece, type FurnitureKind } from '../content/furniturecatalog';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';
import { bareHome, owns } from './furniture';

/** A furnished home's: a three-seat sofa and a table for four, its chairs among the seats. SLATE's reading. */
export const FURNISHED = { seats: 3 + 4, table: 4 } as const;
/** The KIVIK three-seat a sofa bought before 2026-10-02 is. */
const KIVIK_SEATS = 3;

export const KIND_LABEL: Readonly<Record<FurnitureKind, string>> = {
  sofa: 'Sofa', armchair: 'Armchair', diningChair: 'Dining Chair', officeChair: 'Desk Chair', diningTable: 'Dining Table',
  wardrobe: 'Wardrobe', wardrobeFrame: 'Wardrobe Frame', chestOfDrawers: 'Chest Of Drawers', bookcase: 'Bookcase',
};
const STORAGE: ReadonlySet<FurnitureKind> = new Set(['wardrobe', 'wardrobeFrame', 'chestOfDrawers', 'bookcase']);

export const pieceById = (id: string): CatalogPiece | undefined => FURNITURE_CATALOG.find((p) => p.id === id);
const pieceOfItem = (kind: string): CatalogPiece | undefined => (kind.startsWith('ikea:') ? pieceById(kind.slice(5)) : undefined);

/** One piece where a town is, taxed and delivered, in the save's money. */
export function piecePrice(sim: Simulation, cityId: string, p: CatalogPiece): Money {
  const country = FURNITURE[p.country];
  const tax = p.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'furniture');
  const delivery = country?.items.sofa?.delivery ?? 0;
  return inSaveMoney(sim, Math.round((p.price * (1 + tax) + delivery) * 100), p.currency);
}

/** IKEA's pieces where they live, by kind, cheapest first. */
export function piecesCatalog(sim: Simulation, person: Person): CatalogEntry<CatalogPiece>[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const country = CITIES.get(cityId)?.countryId;
  return FURNITURE_CATALOG.filter((p) => p.country === country).map((p) => ({
    id: p.id, label: `${p.name}${p.type ? `, ${p.type}` : ''}${p.variant ? `, ${p.variant}` : ''}`, value: p,
    basis: 'Delivered, Tax In', price: piecePrice(sim, cityId, p), priceKind: 'advertised' as const,
    facets: { kind: KIND_LABEL[p.kind] },
  })).sort((a, b) => a.price! - b.price!);
}

export function pieceRefusal(person: Person, pieceId: string, quantity: number): string | undefined {
  const p = pieceById(pieceId);
  if (!p) return 'That isn’t on sale.';
  if (!person.home || person.home.kind === 'sofa') return 'You have no home of your own to put it in.';
  if (CITIES.get(person.home.cityId)?.countryId !== p.country) return 'IKEA sells that in another country.';
  if (!(Number.isInteger(quantity) && quantity >= 1 && quantity <= 12)) return 'From one to twelve.';
  return undefined;
}

/** What's at the home they live in to sit on, and places at a table. */
export function seatsAtHome(person: Person): { seats: number; table: number } {
  const home = homeKeyOf(person.home);
  if (!home || person.home!.kind === 'sofa') return { seats: 0, table: 0 };
  const furnished = !bareHome(person);
  let seats = furnished ? FURNISHED.seats : 0;
  let table = furnished ? FURNISHED.table : 0;
  if (owns(person, 'sofa')) seats += KIVIK_SEATS;
  for (const i of itemsOf(person)) {
    if (i.at.kind !== 'home' || i.at.home !== home) continue;
    const p = pieceOfItem(i.kind);
    if (!p?.seats) continue;
    if (p.kind === 'diningTable') table += p.seats * i.quantity;
    else seats += p.seats * i.quantity;
  }
  return { seats, table };
}

export function registerFurnishings(sim: Simulation): void {
  sim.onCommand<{ pieceId: string; quantity?: number }, { paid: Money }>('home.buy_piece', (p, { sim: s }) => {
    const person = s.player;
    const quantity = Number(p?.quantity ?? 1);
    const no = pieceRefusal(person, String(p?.pieceId), quantity);
    if (no) throw new CommandError(no);
    const piece = pieceById(String(p.pieceId))!;
    const paid = piecePrice(s, person.home!.cityId, piece) * quantity;
    if (!payFromBank(s, person, paid, `IKEA, ${piece.name}${quantity > 1 ? ` × ${quantity}` : ''}, delivered`, 'home')) throw new CommandError('The bank couldn’t pay for it.');
    const [w, d, h] = piece.cm;
    const volumeL = w && d && h ? (w * d * h) / 1000 : undefined;
    // Each one its own, so each can be filled; chairs come as many as were bought.
    const each = STORAGE.has(piece.kind) ? quantity : 1;
    for (let n = 0; n < each; n += 1) {
      addItem(s, person, { kind: `ikea:${piece.id}`, label: `${piece.name} ${KIND_LABEL[piece.kind]}`, quantity: STORAGE.has(piece.kind) ? 1 : quantity, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: Math.round(paid / each), bulky: true,
        ...(volumeL !== undefined ? { volumeL } : {}), ...(STORAGE.has(piece.kind) && piece.holdsL ? { holdsL: piece.holdsL } : {}) });
    }
    return { paid };
  });
}
