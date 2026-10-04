/**
 * SLATE — a television of one's own (from 2026-10-04): the models sold where
 * they live (`content/tvcatalog.ts`), bought at a store's price with the
 * place's tax and brought home, kept as the home's TV with its make, model,
 * size and the power it draws on: its energy label's figure, or its maker's
 * or a retailer's where no label was read.
 *
 * Watching it draws that power for the time watched. The month's electricity
 * is a typical household's (`systems/electricity.ts`), and a typical household
 * already has a TV on, so what watching adds is the difference: the set's
 * watts against the middle of the catalog's labeled sets (`GENERIC_TV_WATTS`,
 * SLATE's estimate of a usual one), for the minutes watched. A bigger or
 * hungrier set costs more to watch than the usual one; a small one saves a
 * little. Counted whole, the minutes would have paid for the usual household's
 * TV twice.
 *
 * A TV SLATE sold before as a piece of furniture (`home.furnish`), with no
 * model, draws the middle: SLATE's estimate, never nothing.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { TV_PRODUCTS } from '../content/tvcatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';
import { livingOf } from './dwelling';
import { owns } from './furniture';

const MARKET: Readonly<Record<string, CatalogOffer['market']>> = { us: 'us', ca: 'ca', uk: 'uk', ie: 'ie', mx: 'mx' };

/** The middle on-mode power of every labeled set in the catalog, watts: what a TV with no model, and a usual household's, draws. */
export const GENERIC_TV_WATTS: number | undefined = (() => {
  const w = TV_PRODUCTS.map((p) => p.attrs.onModeWatts).filter((x): x is number => typeof x === 'number').sort((a, b) => a - b);
  return w.length ? w[w.length >> 1] : undefined;
})();

export const tvProduct = (id: string): CatalogProduct | undefined => TV_PRODUCTS.find((p) => p.id === id);
const offerById = (id: string): { product: CatalogProduct; offer: CatalogOffer } | undefined => {
  for (const product of TV_PRODUCTS) { const offer = product.offers.find((o) => o.id === id); if (offer) return { product, offer }; }
  return undefined;
};

/** A set as its seller names it: its make and the model number it's sold under there, a region's where it differs. */
export const tvName = (product: CatalogProduct, offer: CatalogOffer): string => `${product.brand} ${offer.model ?? product.model}`;

/** An offer's price where a town is: the place's sales tax on a price before it. */
export function tvPrice(sim: Simulation, cityId: string, offer: CatalogOffer): Money {
  const tax = offer.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'goods');
  return inSaveMoney(sim, Math.round(offer.price * (1 + tax) * 100), offer.currency);
}

/** The sets on sale where they live, an offer each, cheapest first. */
export function tvCatalog(sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const market = MARKET[CITIES.get(cityId)?.countryId ?? ''];
  if (!market) return [];
  return TV_PRODUCTS.flatMap((product) => product.offers.filter((o) => o.market === market).map((offer) => ({ product, offer, price: tvPrice(sim, cityId, offer) })))
    .sort((a, b) => a.price - b.price || a.product.id.localeCompare(b.product.id) || a.offer.id.localeCompare(b.offer.id));
}

export function buyTvRefusal(person: Person, offerId: string): string | undefined {
  const found = offerById(offerId);
  if (!found) return 'That isn’t on sale.';
  if (!person.home || person.home.kind === 'sofa' || person.home.cityId !== person.currentLocationId) return 'A television is bought where you live, for a home of your own.';
  if (MARKET[CITIES.get(person.home.cityId)?.countryId ?? ''] !== found.offer.market) return 'It’s sold in another country.';
  // One TV at home, as `home.furnish` keeps one of each piece.
  if (owns(person, 'tv')) return 'You have one.';
  return undefined;
}

/** The TV at home: its product where it's a model, and the watts it draws on. */
export function tvAtHome(person: Person): { label: string; watts: number | undefined; product?: CatalogProduct } | undefined {
  const home = homeKeyOf(person.home);
  const tv = itemsOf(person).find((i) => i.kind === 'furniture:tv' && i.at.kind === 'home' && i.at.home === home);
  if (!tv) return undefined;
  const product = tv.spec?.product ? tvProduct(tv.spec.product) : undefined;
  const watts = typeof product?.attrs.onModeWatts === 'number' ? product.attrs.onModeWatts : GENERIC_TV_WATTS;
  return { label: tv.label, watts, ...(product ? { product } : {}) };
}

/**
 * What watching for some minutes adds to the month's electricity, kilowatt-hours,
 * past what a usual household's TV already draws in it: the set's watts less the
 * usual one's, for the minutes. Nothing without a set at home or a figure for it.
 */
export function watchPower(person: Person, minutes: number): number {
  const tv = tvAtHome(person);
  if (!tv || tv.watts === undefined || GENERIC_TV_WATTS === undefined || minutes <= 0) return 0;
  const kwh = ((tv.watts - GENERIC_TV_WATTS) * minutes) / 60 / 1000;
  const l = livingOf(person);
  l.extraKwh = (l.extraKwh ?? 0) + kwh;
  return kwh;
}

export function registerTelevisions(sim: Simulation): void {
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('tv.buy', (p, { sim: s }) => {
    const person = s.player;
    const id = String(p?.offerId ?? '');
    const no = buyTvRefusal(person, id);
    if (no) throw new CommandError(no);
    const { product, offer } = offerById(id)!;
    const colors = product.variants.map((v) => v.attrs.color).filter((c): c is string => Boolean(c));
    if (p.color !== undefined && !colors.includes(String(p.color))) throw new CommandError('It isn’t offered in that color.');
    const color = p.color !== undefined ? String(p.color) : colors.length === 1 ? colors[0] : undefined;
    const paid = tvPrice(s, person.home!.cityId, offer);
    const label = `${tvName(product, offer)}, ${product.attrs.sizeIn}-Inch`;
    if (!payFromBank(s, person, paid, `${offer.seller}: ${label}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
    // Kept as the home's TV, what a film or television lover unwinds with (`GEAR_FOR`), its model kept. It stands
    // on the floor, moved by movers or a delivery, as a bed or a sofa is.
    const item = addItem(s, person, {
      kind: 'furniture:tv', label, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid, bulky: true,
      spec: { product: product.id, offer: offer.id, ...(color ? { color } : {}) },
    });
    return { paid, itemId: item.id };
  });
}
