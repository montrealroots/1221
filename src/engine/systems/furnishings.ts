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
 *
 * From 2026-10-03 (`research-home-garden-furniture.json`): putting a piece
 * together yourself takes Taskrabbit's own hours for it, the middle of each
 * range (a PAX module 1 to 4 hours, a BILLY or KALLAX half an hour to an
 * hour, a MALM bed 1 to 2.5, a STORKLINTA, ÅHEIM or BRIMNES 1 to 2, a BESTÅ
 * 45 minutes to 2 hours); others an hour, as before. And in Britain and
 * Ireland a piece is sold back to IKEA for credit at its own tiers: 45% of
 * what was paid as new, 35% very good, 25% well used, and 15% more for an
 * IKEA Family member, which is free, so SLATE takes them as one; the
 * tier is read from the piece's condition, SLATE's reading of its
 * scratches. Only what IKEA takes: chests of drawers, bookcases, dining
 * tables and chairs, put together; no sofa, armchair, wardrobe or bed. The
 * credit is IKEA's refund card, spent on the next piece; America and
 * Canada publish no tiers, and Mexico no buyback.
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
import { fitRefusal } from './rooms';
import { occupiedAt } from './life';
import { formatTime, type Instant } from '../core/time';

/** A furnished home's: a three-seat sofa and a table for four, its chairs among the seats. SLATE's reading. */
export const FURNISHED = { seats: 3 + 4, table: 4 } as const;
/** The KIVIK three-seat a sofa bought before 2026-10-02 is. */
const KIVIK_SEATS = 3;

export const KIND_LABEL: Readonly<Record<FurnitureKind, string>> = {
  sofa: 'Sofa', armchair: 'Armchair', diningChair: 'Dining Chair', officeChair: 'Desk Chair', diningTable: 'Dining Table',
  wardrobe: 'Wardrobe', wardrobeFrame: 'Wardrobe Frame', chestOfDrawers: 'Chest Of Drawers', bookcase: 'Bookcase',
};
const STORAGE: ReadonlySet<FurnitureKind> = new Set(['wardrobe', 'wardrobeFrame', 'chestOfDrawers', 'bookcase']);

/** Another maker's name before a piece's own; IKEA's pieces go by their own names. */
const makerOf = (p: CatalogPiece): string => (p.brand === 'IKEA' ? '' : `${p.brand} `);

export const pieceById = (id: string): CatalogPiece | undefined => FURNITURE_CATALOG.find((p) => p.id === id);
/** Whether a thing is a catalog piece: IKEA's (`ikea:`), or from 2026-10-05 another maker's (`furn:`). */
export const isPieceKind = (kind: string): boolean => kind.startsWith('ikea:') || kind.startsWith('furn:');
const pieceOfItem = (kind: string): CatalogPiece | undefined => (isPieceKind(kind) ? pieceById(kind.slice(5)) : undefined);

/** One piece where a town is, taxed and delivered, in the save's money. */
export function piecePrice(sim: Simulation, cityId: string, p: CatalogPiece): Money {
  const country = FURNITURE[p.country];
  const tax = p.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'furniture');
  // Its retailer's own fee, or IKEA's large-item rate for IKEA's.
  const delivery = p.delivery ?? country?.items.sofa?.delivery ?? 0;
  return inSaveMoney(sim, Math.round((p.price * (1 + tax) + delivery) * 100), p.currency);
}

/** The pieces where they live, IKEA's and other makers', by kind and maker, cheapest first. */
export function piecesCatalog(sim: Simulation, person: Person): CatalogEntry<CatalogPiece>[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const country = CITIES.get(cityId)?.countryId;
  return FURNITURE_CATALOG.filter((p) => p.country === country).map((p) => ({
    id: p.id, label: `${makerOf(p)}${p.name}${p.type ? `, ${p.type}` : ''}${p.variant ? `, ${p.variant}` : ''}`, value: p,
    basis: 'Delivered, Tax In', price: piecePrice(sim, cityId, p), priceKind: 'advertised' as const,
    facets: { kind: KIND_LABEL[p.kind], brand: p.brand },
  })).sort((a, b) => a.price! - b.price!);
}

export function pieceRefusal(person: Person, pieceId: string, quantity: number, sim?: Simulation): string | undefined {
  const p = pieceById(pieceId);
  if (!p) return 'That isn’t on sale.';
  if (!person.home || person.home.kind === 'sofa') return 'You have no home of your own to put it in.';
  if (CITIES.get(person.home.cityId)?.countryId !== p.country) return `${p.retailer} sells that in another country.`;
  if (!(Number.isInteger(quantity) && quantity >= 1 && quantity <= 12)) return 'From one to twelve.';
  // It has to fit in the rooms (`systems/rooms.ts`, from 2026-10-03).
  const [w, d] = p.cm;
  if (sim && w && d) return fitRefusal(sim, person, ((w * d) / 10_000) * quantity);
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
    // Flat-packed, it seats nobody yet.
    if (!p?.seats || i.flatPacked) continue;
    if (p.kind === 'diningTable') table += p.seats * i.quantity;
    else seats += p.seats * i.quantity;
  }
  return { seats, table };
}

/**
 * Putting it together (from 2026-10-03; `research-furniture.json`, IKEA's own
 * assembly pages read 2026-09-29). An IKEA piece comes flat-packed, and
 * seats nobody and holds nothing until it's put together: by IKEA's service
 * when it's bought, or by you, an hour a piece, SLATE's estimate, nobody
 * publishing a piece's time. The service's price where IKEA gives one: in
 * Mexico 2.5% of a sofa's price and 9% of anything else's; elsewhere only a
 * least, taken as each piece's: from $52 in America (Taskrabbit's minimum),
 * C$45 in Canada and £33 in Britain; in Ireland Creative Fitting's €40
 * call-out, once, its rate a piece unpublished and not added.
 */
export const ASSEMBLY: Readonly<Record<string, { currency: string; perPiece?: number; callOut?: number; share?: { sofa: number; other: number } }>> = {
  us: { currency: 'USD', perPiece: 52 },
  ca: { currency: 'CAD', perPiece: 45 },
  uk: { currency: 'GBP', perPiece: 33 },
  ie: { currency: 'EUR', callOut: 40 },
  mx: { currency: 'MXN', share: { sofa: 0.025, other: 0.09 } },
};
/** Minutes to put a piece together yourself where Taskrabbit gives none. SLATE's estimate. */
export const ASSEMBLE_MINUTES = 60;
/** Taskrabbit's hours for a range, the middle, in minutes, by the name it's sold under. */
export const ASSEMBLY_HOURS: readonly (readonly [RegExp, number])[] = [
  [/^PAX/i, 150], [/^(BILLY|KALLAX)/i, 45], [/^MALM.*bed/i, 105], [/^(STORKLINTA|ÅHEIM|AHEIM|BRIMNES)/i, 90], [/^BEST[ÅA]/i, 82.5],
];
export const assemblyMinutes = (label: string): number => ASSEMBLY_HOURS.find(([re]) => re.test(label))?.[1] ?? ASSEMBLE_MINUTES;

/** IKEA's buyback where it publishes tiers: its shares of the price paid, and the Family member's 15% more. */
export const BUYBACK = { asNew: 0.45, veryGood: 0.35, wellUsed: 0.25, family: 1.15, countries: ['uk', 'ie'] as readonly string[], kinds: new Set<FurnitureKind>(['chestOfDrawers', 'bookcase', 'diningTable', 'diningChair']) };
export const buybackShare = (condition: number): number => (condition >= 0.95 ? BUYBACK.asNew : condition >= 0.6 ? BUYBACK.veryGood : BUYBACK.wellUsed) * BUYBACK.family;

/** Why IKEA won't take a piece back here, or nothing. */
export function buybackRefusal(person: Person, itemId: string): string | undefined {
  const item = itemsOf(person).find((i) => i.id === itemId);
  const piece = item ? pieceOfItem(item.kind) : undefined;
  if (!item || !piece || piece.brand !== 'IKEA') return 'Only an IKEA piece goes back to IKEA.';
  if (!BUYBACK.countries.includes(CITIES.get(person.currentLocationId)?.countryId ?? '')) return 'IKEA publishes its buyback terms only in Britain and Ireland.';
  if (!BUYBACK.kinds.has(piece.kind)) return 'IKEA doesn’t take that back: no sofa, armchair, wardrobe or bed.';
  if (item.flatPacked) return 'IKEA takes a piece back put together.';
  if (!(item.at.kind === 'home' && item.at.home === homeKeyOf(person.home) && person.home?.cityId === person.currentLocationId)) return 'It goes back from home.';
  if (itemsOf(person).some((i) => i.at.kind === 'inside' && i.at.itemId === item.id)) return 'Empty it first.';
  return undefined;
}

/** IKEA putting so many of a piece together, in the save's money; nothing where it isn't offered. */
export function assemblyFee(sim: Simulation, p: CatalogPiece, quantity: number): Money | undefined {
  // IKEA's service puts IKEA's together; another maker's comes as its maker sends it.
  const a = p.brand === 'IKEA' ? ASSEMBLY[p.country] : undefined;
  if (!a) return undefined;
  if (a.share) return inSaveMoney(sim, Math.round(p.price * (p.kind === 'sofa' ? a.share.sofa : a.share.other) * quantity * 100), a.currency);
  if (a.callOut !== undefined) return inSaveMoney(sim, a.callOut * 100, a.currency);
  return inSaveMoney(sim, Math.round(a.perPiece! * quantity * 100), a.currency);
}

/** Whether a thing of theirs can be put together now, and why not. */
export function assembleRefusal(person: Person, itemId: string): string | undefined {
  const item = itemsOf(person).find((i) => i.id === itemId);
  if (!item) return 'That isn’t yours.';
  if (!item.flatPacked) return 'It’s put together.';
  if (!(item.at.kind === 'home' && item.at.home === homeKeyOf(person.home) && person.home?.cityId === person.currentLocationId)) return 'It’s put together where it is, at home.';
  return undefined;
}

export function registerFurnishings(sim: Simulation): void {
  sim.onCommand<{ pieceId: string; quantity?: number; assembly?: boolean }, { paid: Money }>('home.buy_piece', (p, { sim: s }) => {
    const person = s.player;
    const quantity = Number(p?.quantity ?? 1);
    const no = pieceRefusal(person, String(p?.pieceId), quantity, s);
    if (no) throw new CommandError(no);
    const piece = pieceById(String(p.pieceId))!;
    const fee = p.assembly ? assemblyFee(s, piece, quantity) : 0;
    if (fee === undefined) throw new CommandError(piece.brand === 'IKEA' ? 'IKEA doesn’t put it together there.' : `${piece.retailer} doesn’t put it together.`);
    const total = piecePrice(s, person.home!.cityId, piece) * quantity + fee;
    // IKEA's refund card first, where there's credit on it (from 2026-10-03).
    const credit = Math.min(total, person.ikeaCredit ?? 0);
    if (credit > 0) person.ikeaCredit = (person.ikeaCredit ?? 0) - credit;
    const paid = total - credit;
    // Each piece keeps its price as new, however it was paid, as IKEA's buyback tiers are of it (from 2026-10-06; until
    // then what the card paid was taken off, and a piece bought on credit went back for less, or nothing).
    if (paid > 0 && !payFromBank(s, person, paid, `${piece.retailer}, ${piece.brand === 'IKEA' ? '' : `${piece.brand} `}${piece.name}${quantity > 1 ? ` × ${quantity}` : ''}, delivered${fee ? ' and put together' : ''}`, 'home')) throw new CommandError('The bank couldn’t pay for it.');
    const [w, d, h] = piece.cm;
    const volumeL = w && d && h ? (w * d * h) / 1000 : undefined;
    // Each one its own, so each can be filled; chairs come as many as were bought.
    const each = STORAGE.has(piece.kind) ? quantity : 1;
    for (let n = 0; n < each; n += 1) {
      addItem(s, person, { kind: `${piece.brand === 'IKEA' ? 'ikea' : 'furn'}:${piece.id}`, label: `${makerOf(piece)}${piece.name} ${KIND_LABEL[piece.kind]}`, quantity: STORAGE.has(piece.kind) ? 1 : quantity, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: Math.round(total / each), bulky: true,
        ...(volumeL !== undefined ? { volumeL } : {}), ...(STORAGE.has(piece.kind) && piece.holdsL ? { holdsL: piece.holdsL } : {}), ...(fee || !piece.flatPack ? {} : { flatPacked: true as const }) });
    }
    return { paid };
  });
  sim.onCommand<{ itemId: string }, { credit: Money }>('home.sell_back', (p, { sim: s }) => {
    const person = s.player;
    const no = buybackRefusal(person, String(p?.itemId));
    if (no) throw new CommandError(no);
    const item = itemsOf(person).find((i) => i.id === p.itemId)!;
    const credit = Math.round((item.paid ?? 0) * buybackShare(item.condition));
    person.items = itemsOf(person).filter((i) => i !== item);
    person.ikeaCredit = (person.ikeaCredit ?? 0) + credit;
    return { credit };
  });
  sim.onCommand<{ itemId: string }, { doneAt: Instant }>('items.assemble', (p, { sim: s }) => {
    const person = s.player;
    const no = assembleRefusal(person, String(p?.itemId));
    if (no) throw new CommandError(no);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    const item = itemsOf(person).find((i) => i.id === p.itemId)!;
    s.advanceTo(s.now + assemblyMinutes(item.label) * 60_000);
    delete item.flatPacked;
    return { doneAt: s.now };
  });
}
