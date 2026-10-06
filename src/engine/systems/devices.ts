/**
 * SLATE — a device of one's own, sold by make and model (from 2026-10-05):
 * what televisions and speakers share. The models sold where they live, each
 * at its seller's price with the place's tax on a price before it; bought
 * where they live for a home of their own, in a color it's offered in; and
 * kept as the home's piece (`furniture:tv`, `furniture:speaker`), so what
 * already reads the piece reads it, with its product, offer and color kept.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { addItem, homeKeyOf, type Item } from './items';

const MARKET: Readonly<Record<string, string>> = { us: 'us', ca: 'ca', uk: 'uk', ie: 'ie', mx: 'mx' };

export const marketWhere = (cityId: string): string | undefined => MARKET[CITIES.get(cityId)?.countryId ?? ''];

export function offerIn(products: readonly CatalogProduct[], id: string): { product: CatalogProduct; offer: CatalogOffer } | undefined {
  for (const product of products) { const offer = product.offers.find((o) => o.id === id); if (offer) return { product, offer }; }
  return undefined;
}

/** An offer's price where a town is: the place's sales tax on a price before it. */
export function devicePrice(sim: Simulation, cityId: string, offer: CatalogOffer): Money {
  const tax = offer.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'goods');
  return inSaveMoney(sim, Math.round(offer.price * (1 + tax) * 100), offer.currency);
}

/** The models on sale where they live, an offer each, cheapest first. */
export function deviceCatalog(sim: Simulation, person: Person, products: readonly CatalogProduct[]): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const market = marketWhere(cityId);
  if (!market) return [];
  return products.flatMap((product) => product.offers.filter((o) => o.market === market).map((offer) => ({ product, offer, price: devicePrice(sim, cityId, offer) })))
    .sort((a, b) => a.price - b.price || a.product.id.localeCompare(b.product.id));
}

export function deviceRefusal(person: Person, products: readonly CatalogProduct[], offerId: string, noun: string): string | undefined {
  const found = offerIn(products, offerId);
  if (!found) return 'That isn’t on sale.';
  if (!person.home || person.home.kind === 'sofa' || person.home.cityId !== person.currentLocationId) return `${noun} is bought where you live, for a home of your own.`;
  if (marketWhere(person.home.cityId) !== found.offer.market) return 'It’s sold in another country.';
  return undefined;
}

/** What's kept of a product with the thing bought (`Item.made`, from 2026-10-05). */
export const madeOf = (p: CatalogProduct): NonNullable<Item['made']> => ({ brand: p.brand, model: p.model, category: p.category, attrs: p.attrs });

/**
 * The product an owned thing is: its catalog entry where it's still listed, else what was kept of it when it
 * was bought, so a listing taken out never takes the thing's use with it; nothing for a thing bought before
 * products were kept with it whose listing is gone.
 */
export function ownedProduct(item: Item, products: readonly CatalogProduct[]): CatalogProduct | undefined {
  const listed = products.find((p) => p.id === item.spec?.product);
  if (listed) return listed;
  const m = item.made;
  return m ? { id: item.spec?.product ?? item.kind, category: m.category, brand: m.brand, family: null, model: m.model, attrs: m.attrs, variants: [], offers: [], url: null, status: 'secondhand' } : undefined;
}

/** The colors a product is offered in. */
export const colorsOfProduct = (product: CatalogProduct): string[] => product.variants.map((v) => v.attrs.color).filter((c): c is string => Boolean(c));

/** Buys an offer: paid from the bank, kept at home as the piece, its product, offer and chosen color kept. */
export function buyDevice(sim: Simulation, person: Person, products: readonly CatalogProduct[], offerId: string, color: unknown, piece: string, noun: string, label: (product: CatalogProduct, offer: CatalogOffer) => string): { paid: Money; item: Item } {
  const no = deviceRefusal(person, products, offerId, noun);
  if (no) throw new CommandError(no);
  const { product, offer } = offerIn(products, offerId)!;
  const colors = colorsOfProduct(product);
  if (color !== undefined && !colors.includes(String(color))) throw new CommandError('It isn’t offered in that color.');
  const chosen = color !== undefined ? String(color) : colors.length === 1 ? colors[0] : undefined;
  const paid = devicePrice(sim, person.home!.cityId, offer);
  const name = `${label(product, offer)}${chosen ? `, ${chosen}` : ''}`;
  if (!payFromBank(sim, person, paid, `${offer.seller}: ${name}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
  const item = addItem(sim, person, { kind: `furniture:${piece}`, label: name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: sim.now, paid, bulky: true, spec: { product: product.id, offer: offer.id, ...(chosen ? { color: chosen } : {}) }, made: madeOf(product) });
  return { paid, item };
}
