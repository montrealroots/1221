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
 * stays under it. Taking one off isn't priced anywhere read, and isn't
 * offered; nor is a wrap where no shop posts a price.
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

export interface WrapShop { id: string; name: string; cityId: string; currency: string; price: (m: CarModel) => number; days: number; source: string }
export const WRAP_SHOPS: readonly WrapShop[] = [
  { id: 'london-tint-studio', name: 'London Tint Studio', cityId: 'uk-eng-london', currency: 'GBP', price: () => 1_400, days: 3, source: 'https://www.londontintstudio.co.uk/wrapping/' },
  { id: 'prestige-tint', name: 'Prestige Tint', cityId: 'uk-eng-london', currency: 'GBP', price: () => 2_000 * 1.2, days: 7, source: 'https://prestigetint.co.uk/car-vinyl-wrapping/' },
  { id: 'los-deslumbrantes', name: 'Los Deslumbrantes', cityId: 'mx-cmx-mexicocity', currency: 'MXN', price: (m) => (/pickup|f-series|silverado|sierra|ram|np300/i.test(`${m.model} ${m.id}`) ? 34_000 : 29_500), days: 9, source: 'https://www.losdeslumbrantes.com.mx/wrapping-car-wrap-car-vinil-automotriz' },
];

export interface Wrap { color: string; finish: Finish; shopId: string; at: Instant }

export const wrapShopById = (id: string) => WRAP_SHOPS.find((s) => s.id === id);
export const wrapShopsIn = (cityId: string) => WRAP_SHOPS.filter((s) => s.cityId === cityId);

export function wrapCost(sim: Simulation, shop: WrapShop, m: CarModel): Money {
  const c = Math.round(shop.price(m) * 100);
  const cur = saveCurrency(sim.universe);
  return cur === shop.currency ? c : exchange(c, shop.currency, cur) ?? c;
}

export function wrapRefusal(person: Person, v: OwnedVehicle | undefined, shopId: string, color: string, finish: string, at: Instant): string | undefined {
  if (!v) return 'That isn’t a car you own.';
  const shop = wrapShopById(shopId);
  if (!shop) return 'There’s no such shop.';
  if ((v.at ?? v.cityId) !== shop.cityId) return 'The car isn’t in the shop’s town.';
  if (person.currentLocationId !== shop.cityId) return 'You’re not in the shop’s town.';
  if (!(WRAP_COLORS as readonly string[]).includes(color)) return 'Choose a color the film comes in.';
  if (!(FINISHES as readonly string[]).includes(finish)) return 'Choose gloss, satin or matte.';
  if (v.inShop && v.inShop.until > at) return 'It’s in a shop already.';
  return undefined;
}

export function coverRefusal(v: OwnedVehicle | undefined, coverage: string, liabilityOffered: boolean): string | undefined {
  if (!v) return 'That isn’t a car you own.';
  if (coverage !== 'full' && coverage !== 'liability') return 'Full cover or liability.';
  if (coverage === v.coverage) return 'It has that cover already.';
  if (coverage === 'liability' && (v.loan || v.lease)) return 'The lender requires full cover while it’s owed.';
  if (coverage === 'liability' && !liabilityOffered) return 'Liability alone isn’t offered for it here.';
  return undefined;
}

export function registerWraps(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, model: (v: OwnedVehicle) => CarModel, liability: (v: OwnedVehicle) => boolean): void {
  sim.onCommand<{ vehicleId: string; shopId: string; color: string; finish: Finish }, { paid: Money; readyAt: Instant }>('vehicle.wrap', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const no = wrapRefusal(person, v, String(p?.shopId), String(p?.color), String(p?.finish), s.now);
    if (no) throw new CommandError(no);
    const shop = wrapShopById(String(p.shopId))!;
    const m = model(v!);
    const paid = wrapCost(s, shop, m);
    if (!spend(s, person, paid, `${shop.name}, a ${p.finish} ${String(p.color).toLowerCase()} wrap`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    const readyAt = s.now + shop.days * MS_DAY;
    v!.wrap = { color: String(p.color), finish: p.finish, shopId: shop.id, at: s.now };
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
