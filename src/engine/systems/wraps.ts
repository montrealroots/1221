/**
 * SLATE — a car wrapped in film, and its insurance cover changed (Stage 8
 * of `docs/BACKLOG.md`, from 2026-10-01; `research-vehicle-shops.json`).
 *
 * **A wrap** in the color and finish you choose, at a named shop that posts
 * its price: London Tint Studio's from £1,400 for a medium car (two to three
 * days) and Prestige Tint's from £2,000 plus VAT (two to seven), in London;
 * Los Deslumbrantes' MX$29,500 for a car to four meters and MX$34,000 to
 * five and a half (five to nine days), in Mexico City, a pickup taken as the
 * longer. The car is at the shop the longest days it says. Britain's
 * insurers are told, and SLATE takes the wrap's loading as a non-standard
 * respray's 4.52%, the nearest published (`systems/mods.ts`). The paint
 * stays under it.
 *
 * Until 2026-10-03 a wrap was the whole car, in two towns, and stayed on.
 * Now (`research-vehicles-utilities-gaps.json`) part of one is sold where
 * a shop posts it: Los Deslumbrantes' roof and hood by the car's size, in
 * Mexico City; Advanced Vehicle Guard's roof and accent panels in Toronto,
 * the middle of each range by size; Hussle Customz' accent panels (hood,
 * roof, mirrors) in Los Angeles, the middle of $600 to $1,300. New York
 * gets WRP's whole-car guide and Dublin Carwrapping.ie's, each the middle
 * of the range it posts; WRP says its figures are the market's, not its
 * menu. A pickup is the larger size, a car the smallest, as before. Where a
 * shop gives no days, a whole car takes three and a part one, SLATE's
 * estimate. A wrap comes off where a shop posts what that costs: Raccoon's
 * £500 for a small car, £700 a medium and £900 a van, in Kent, thirty miles
 * out, for London (the drive isn't kept), a day, SLATE's; the only removal
 * price any shop in SLATE's towns' reach publishes. None is sold where no
 * shop posts a price.
 *
 * **Cover** can be changed after buying, full to liability or back, where
 * liability is offered; a car with a loan or a lease keeps full cover, as
 * the lender requires.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import type { CarModel } from '../content/vehiclecatalog';
import { spend } from './household';
import { COVER_CHANGE_FEE_GB } from '../content/carcare';
import type { OwnedVehicle } from './vehicles';

export type Finish = 'gloss' | 'satin' | 'matte';
export const FINISHES: readonly Finish[] = ['gloss', 'satin', 'matte'];
export const WRAP_COLORS = ['Black', 'White', 'Gray', 'Silver', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple'] as const;

/** What's wrapped: the whole car, its roof, its hood, or accent panels (hood, roof and mirrors). */
export type WrapPart = 'full' | 'roof' | 'hood' | 'accents';
export const WRAP_PARTS: readonly WrapPart[] = ['roof', 'hood', 'accents', 'full'];
export const PART_LABEL: Readonly<Record<WrapPart, string>> = { full: 'Whole Car', roof: 'Roof', hood: 'Hood', accents: 'Accent Panels' };

const big = (m: CarModel) => m.body === 'pickup' || m.kind === 'van';
const mid = (lo: number, hi: number) => (lo + hi) / 2;

export interface WrapShop { id: string; name: string; cityId: string; currency: string; parts: Partial<Record<WrapPart, (m: CarModel) => number>>; days?: number; removal?: (m: CarModel) => number; source: string }
export const WRAP_SHOPS: readonly WrapShop[] = [
  { id: 'london-tint-studio', name: 'London Tint Studio', cityId: 'uk-eng-london', currency: 'GBP', parts: { full: () => 1_400 }, days: 3, source: 'https://www.londontintstudio.co.uk/wrapping/' },
  { id: 'prestige-tint', name: 'Prestige Tint', cityId: 'uk-eng-london', currency: 'GBP', parts: { full: () => 2_000 * 1.2 }, days: 7, source: 'https://prestigetint.co.uk/car-vinyl-wrapping/' },
  { id: 'raccoon', name: 'Raccoon, Edenbridge', cityId: 'uk-eng-london', currency: 'GBP', parts: {}, removal: (m) => (m.kind === 'van' ? 900 : big(m) ? 700 : 500), source: 'https://www.raccoon.co.uk/blog/removing-a-vehicle-wrap' },
  {
    id: 'los-deslumbrantes', name: 'Los Deslumbrantes', cityId: 'mx-cmx-mexicocity', currency: 'MXN', days: 9, source: 'https://www.losdeslumbrantes.com.mx/wrapping-car-wrap-car-vinil-automotriz',
    parts: { full: (m) => (big(m) ? 34_000 : 29_500), roof: (m) => (big(m) ? 7_900 : 5_900), hood: (m) => (big(m) ? 9_500 : 5_490) },
  },
  {
    id: 'advanced-vehicle-guard', name: 'Advanced Vehicle Guard', cityId: 'ca-on-toronto', currency: 'CAD', source: 'https://advancedvehicleguard.com/blog/vinyl-wrap-cost-toronto-2026',
    parts: { roof: (m) => (big(m) ? mid(500, 800) : mid(350, 550)), accents: (m) => (big(m) ? mid(900, 1_600) : mid(600, 1_200)) },
  },
  { id: 'hussle-customz', name: 'Hussle Customz', cityId: 'us-ca-losangeles', currency: 'USD', parts: { accents: () => mid(600, 1_300) }, source: 'https://husslecustomz.com/blog/car-wrap-cost-los-angeles/' },
  { id: 'wrp', name: 'WRP (We Reject Paint)', cityId: 'us-ny-newyork', currency: 'USD', parts: { full: (m) => (big(m) ? mid(3_500, 5_000) : mid(2_200, 3_200)) }, source: 'https://werejectpaint.com/blog-post/nyc-vinyl-wrap-cost-guide' },
  { id: 'carwrapping-ie', name: 'Carwrapping.ie', cityId: 'ie-lei-dublin', currency: 'EUR', parts: { full: () => mid(1_000, 1_400) }, source: 'https://carwrapping.ie/car-wrap-cost-ireland/' },
];
/** A shop's days where it gives none: three for a whole car, one for part of one or to take one off; SLATE's estimate. */
export const WRAP_DAYS = { full: 3, part: 1, removal: 1 } as const;

export interface Wrap { color: string; finish: Finish; shopId: string; at: Instant; /** Part of the car, from 2026-10-03; absent, the whole of it. */ part?: Exclude<WrapPart, 'full'> }

export const wrapShopById = (id: string) => WRAP_SHOPS.find((s) => s.id === id);
export const wrapShopsIn = (cityId: string) => WRAP_SHOPS.filter((s) => s.cityId === cityId);

const inSave = (sim: Simulation, units: number, currency: string): Money => {
  const c = Math.round(units * 100);
  const cur = saveCurrency(sim.universe);
  return cur === currency ? c : exchange(c, currency, cur) ?? c;
};

/** A shop's price to wrap a part of a car, or the whole of it; nothing where it posts none. */
export function wrapCost(sim: Simulation, shop: WrapShop, m: CarModel, part: WrapPart = 'full'): Money | undefined {
  const price = shop.parts[part];
  return price ? inSave(sim, price(m), shop.currency) : undefined;
}

/** A shop's price to take a wrap off, or nothing where it posts none. */
export const removalCost = (sim: Simulation, shop: WrapShop, m: CarModel): Money | undefined => (shop.removal ? inSave(sim, shop.removal(m), shop.currency) : undefined);

/** The days a car is in for it. */
export const wrapDays = (shop: WrapShop, part: WrapPart | 'removal'): number => (part === 'removal' ? WRAP_DAYS.removal : shop.days ?? (part === 'full' ? WRAP_DAYS.full : WRAP_DAYS.part));

export function wrapRefusal(person: Person, v: OwnedVehicle | undefined, shopId: string, color: string, finish: string, at: Instant, part: WrapPart = 'full'): string | undefined {
  if (!v) return 'That isn’t a car you own.';
  const shop = wrapShopById(shopId);
  if (!shop) return 'There’s no such shop.';
  if (!shop.parts[part]) return `${shop.name} posts no price for wrapping the ${PART_LABEL[part].toLowerCase()}.`;
  if ((v.at ?? v.cityId) !== shop.cityId) return 'The car isn’t in the shop’s town.';
  if (person.currentLocationId !== shop.cityId) return 'You’re not in the shop’s town.';
  if (!(WRAP_COLORS as readonly string[]).includes(color)) return 'Choose a color the film comes in.';
  if (!(FINISHES as readonly string[]).includes(finish)) return 'Choose gloss, satin or matte.';
  if (v.inShop && v.inShop.until > at) return 'It’s in a shop already.';
  return undefined;
}

/** Why a wrap can't come off at a shop now, or nothing. */
export function unwrapRefusal(person: Person, v: OwnedVehicle | undefined, shopId: string, at: Instant): string | undefined {
  if (!v) return 'That isn’t a car you own.';
  if (!v.wrap) return 'It isn’t wrapped.';
  const shop = wrapShopById(shopId);
  if (!shop?.removal) return 'That shop posts no price for taking a wrap off.';
  if ((v.at ?? v.cityId) !== shop.cityId) return 'It isn’t in the shop’s town.';
  if (person.currentLocationId !== shop.cityId) return 'You’re not in the shop’s town.';
  if (v.inShop && v.inShop.until > at) return 'It’s in a shop already.';
  return undefined;
}

export function coverRefusal(v: OwnedVehicle | undefined, coverage: string, liabilityOffered: boolean): string | undefined {
  if (!v) return 'That isn’t a car you own.';
  if (coverage !== 'full' && coverage !== 'liability') return 'Full cover or liability.';
  if (coverage === v.coverage) return 'It has that cover already.';
  if (coverage === 'liability' && (v.loan || v.lease)) return 'Its lender requires full cover while it’s owed.';
  if (coverage === 'liability' && !liabilityOffered) return 'Liability alone isn’t offered for it here.';
  return undefined;
}

export function registerWraps(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, model: (v: OwnedVehicle) => CarModel, liability: (v: OwnedVehicle) => boolean): void {
  sim.onCommand<{ vehicleId: string; shopId: string; color: string; finish: Finish; part?: WrapPart }, { paid: Money; readyAt: Instant }>('vehicle.wrap', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const part: WrapPart = (WRAP_PARTS as readonly string[]).includes(String(p?.part)) ? p.part! : 'full';
    const no = wrapRefusal(person, v, String(p?.shopId), String(p?.color), String(p?.finish), s.now, part);
    if (no) throw new CommandError(no);
    const shop = wrapShopById(String(p.shopId))!;
    const m = model(v!);
    const paid = wrapCost(s, shop, m, part)!;
    if (!spend(s, person, paid, `${shop.name}, a ${p.finish} ${String(p.color).toLowerCase()} wrap${part === 'full' ? '' : `, ${PART_LABEL[part].toLowerCase()}`}`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    const readyAt = s.now + wrapDays(shop, part) * MS_DAY;
    v!.wrap = { color: String(p.color), finish: p.finish, shopId: shop.id, at: s.now, ...(part === 'full' ? {} : { part }) };
    v!.inShop = { shopId: shop.id, until: readyAt, name: shop.name };
    return { paid, readyAt };
  });

  sim.onCommand<{ vehicleId: string; shopId: string }, { paid: Money; readyAt: Instant }>('vehicle.unwrap', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const no = unwrapRefusal(person, v, String(p?.shopId), s.now);
    if (no) throw new CommandError(no);
    const shop = wrapShopById(String(p.shopId))!;
    const paid = removalCost(s, shop, model(v!))!;
    if (!spend(s, person, paid, `${shop.name}, a wrap taken off`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    const readyAt = s.now + wrapDays(shop, 'removal') * MS_DAY;
    delete v!.wrap;
    v!.inShop = { shopId: shop.id, until: readyAt, name: shop.name };
    return { paid, readyAt };
  });

  sim.onCommand<{ vehicleId: string; coverage: 'full' | 'liability' }, { coverage: 'full' | 'liability' }>('vehicle.coverage', (p, { sim: s }) => {
    const v = find(s.player, String(p?.vehicleId));
    const no = coverRefusal(v, String(p?.coverage), v ? liability(v) : false);
    if (no) throw new CommandError(no);
    // Britain's insurers charge to change cover mid-term; Direct Line's fee (`COVER_CHANGE_FEE_GB`, from later on 2026-10-01).
    if (v!.jurisdiction === 'GB') {
      const cur = saveCurrency(s.universe);
      const fee = cur === 'GBP' ? Math.round(COVER_CHANGE_FEE_GB * 100) : exchange(Math.round(COVER_CHANGE_FEE_GB * 100), 'GBP', cur) ?? 0;
      if (!spend(s, s.player, fee, 'The insurer’s fee to change cover', 'vehicle')) throw new CommandError('The payment didn’t go through.');
    }
    v!.coverage = p.coverage;
    return { coverage: p.coverage };
  });
}
