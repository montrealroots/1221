/**
 * SLATE — repainting a home of one's own by hand (from 2026-10-05): the paint
 * bought by the can where they live (`content/paintcatalog.ts`), kept at the
 * home, and Paint A Room, one room a session, until every room's walls are
 * done and the home's paint is new (`parts.paint`, which its wear and value
 * read), as the decorator's Repaint Inside does for its price.
 *
 * - A room's walls: its floor taken as square, its perimeter times a 2.4 m
 *   ceiling (Hunker's perimeter-times-height rule; the square and the 8-foot
 *   ceiling, 2.44 m, are SLATE's reading), less a door's 21 sq ft.
 * - Two coats (Bob Vila), at the paint's own coverage where its maker states
 *   one, and otherwise Benjamin Moore's middle, 375 sq ft a gallon a coat.
 * - A session is five hours, the middle of Angi's two to eight a room.
 *
 * A room isn't begun without the paint it needs; the paint left is kept for
 * the next. A home's rooms are its bedrooms, bathrooms, living room and
 * kitchen (`roomList`), not a backyard cottage, which is its own building.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { formatMoney, saveCurrency } from '../core/money';
import { CITIES } from '../content/geography';
import { zonedParts } from '../core/time';
import { PAINT_PRODUCTS } from '../content/paintcatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { deviceCatalog, devicePrice, marketWhere, offerIn } from './devices';
import { payFromBank } from './household';
import { livingIn, type OwnedHome } from './homes';
import { roomList, type Room } from './rooms';

export { PAINT_PRODUCTS };
const SQFT_M2 = 0.09290304;
const GALLON_L = 3.785411784;
export const CEILING_M = 2.4;
export const DOOR_M2 = 21 * SQFT_M2;
export const COATS = 2;
/** Benjamin Moore's middle, 375 sq ft a gallon a coat, in m² a liter. */
export const COVERAGE_M2_L = (375 * SQFT_M2) / GALLON_L;
export const PAINT_SESSION_MINUTES = 5 * 60;

/** A home's paint in hand and the rooms done since the repaint began. */
export interface Painting { liters: number; coverage: number; done: string[] }

/** A room's walls, m²: its floor's square's perimeter times the ceiling, less a door. */
export const wallsM2 = (room: Pick<Room, 'm2'>): number => Math.max(0, 4 * Math.sqrt(room.m2) * CEILING_M - DOOR_M2);
/** The liters two coats of a room's walls take at a coverage. */
export const litersFor = (room: Pick<Room, 'm2'>, coverage = COVERAGE_M2_L): number => (wallsM2(room) * COATS) / coverage;

/** The rooms a repaint covers: the home's own, not a backyard cottage. */
export const paintedRooms = (sim: Simulation, person: Person): Room[] => roomList(sim, person).filter((r) => r.kind !== 'cottage');

export const paintCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, PAINT_PRODUCTS);

/** The home they live in and own, where a repaint can be done. */
const ownHome = (person: Person): OwnedHome | undefined => { const h = livingIn(person); return h && person.home?.cityId === person.currentLocationId ? h : undefined; };

export function paintRefusal(person: Person, offerId: string): string | undefined {
  const found = offerIn(PAINT_PRODUCTS, offerId);
  if (!found) return 'That isn’t on sale.';
  const home = ownHome(person);
  if (!home) return 'Paint is bought for a home you own and live in, where you are.';
  if (marketWhere(home.cityId) !== found.offer.market) return 'It’s sold in another country.';
  return undefined;
}

/** A can bought and its liters put by for the repaint, at its own coverage or the middle where its maker states none. */
export function buyPaint(sim: Simulation, person: Person, offerId: string): Money {
  const no = paintRefusal(person, offerId);
  if (no) throw new CommandError(no);
  const home = ownHome(person)!;
  const { product, offer } = offerIn(PAINT_PRODUCTS, offerId)!;
  const price = devicePrice(sim, home.cityId, offer);
  if (!payFromBank(sim, person, price, `${offer.seller}: ${product.brand} ${product.model}`, 'home')) throw new CommandError(`${formatMoney(price, saveCurrency(sim.universe))} is more than the bank can cover.`);
  const was = home.painting ?? { liters: 0, coverage: COVERAGE_M2_L, done: [] };
  const liters = Number(product.attrs.liters);
  const coverage = typeof product.attrs.coverage === 'number' ? product.attrs.coverage : COVERAGE_M2_L;
  // Mixed with what's in hand, the coverage is the liters' own average.
  home.painting = { liters: was.liters + liters, coverage: (was.liters * was.coverage + liters * coverage) / (was.liters + liters), done: was.done };
  return price;
}

/** The next room a session paints, and why one can't be begun now. */
export function nextRoom(sim: Simulation, person: Person): Room | undefined {
  const home = ownHome(person);
  return home ? paintedRooms(sim, person).find((r) => !(home.painting?.done ?? []).includes(r.id)) : undefined;
}
export function paintSessionRefusal(sim: Simulation, person: Person): string | undefined {
  const home = ownHome(person);
  if (!home) return 'You paint a home you own and live in, while you’re there.';
  const room = nextRoom(sim, person);
  if (!room) return 'Every room is done.';
  const p = home.painting;
  const need = litersFor(room, p?.coverage);
  if (!p || p.liters < need) return `${room.label} takes about ${Math.ceil(need * 10) / 10} liters for two coats; you have ${Math.floor((p?.liters ?? 0) * 10) / 10}.`;
  return undefined;
}

/** A session: the next room painted with its liters, and the home's paint new once every room is. */
export function paintRoom(sim: Simulation, person: Person): Room {
  const no = paintSessionRefusal(sim, person);
  if (no) throw new CommandError(no);
  const home = ownHome(person)!;
  const room = nextRoom(sim, person)!;
  const p = home.painting!;
  p.liters -= litersFor(room, p.coverage);
  p.done = [...p.done, room.id];
  if (paintedRooms(sim, person).every((r) => p.done.includes(r.id))) {
    home.facts.parts.paint = zonedParts(sim.now, CITIES.require(home.cityId).timeZone).year;
    // The paint left over is kept; the next repaint starts over.
    home.painting = { liters: p.liters, coverage: p.coverage, done: [] };
  }
  return room;
}

export function registerPaint(sim: Simulation): void {
  sim.onCommand<{ offerId: string }, { paid: Money }>('home.buy_paint', (p, { sim: s }) => ({ paid: buyPaint(s, s.player, String(p?.offerId ?? '')) }));
}
