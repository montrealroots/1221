/**
 * SLATE — a quartz watch's battery (the master plan's §29, from
 * 2026-10-02; the lives in `content/watchbatteries.ts`, the services in
 * `docs/research/world/research-jewelry-watches.json` and
 * `research-watch-batteries.json`).
 *
 * A quartz watch's battery runs down its maker's years after it was fitted:
 * at its purchase, then at each change. Run down, the watch has stopped,
 * and isn't put on with an outfit (`wearable` in `systems/wardrobe.ts`),
 * SLATE's reading of a stopped watch. The makers warn that a dead battery
 * left in can leak and harm the movement, but none says how soon, so it
 * doesn't. A watch whose maker gives no battery life isn't counted.
 *
 * **A change** is had where you are, by the market's published price:
 * - America: Timex's own mail-in $18 for a Timex, Tommy Hilfiger's (Movado
 *   Group's) $6 and $9.95 shipping for one of theirs, and Jewelry Repair
 *   Direct by Kay's $79 mail-in for any;
 * - Britain: Fraser Hart's 2026 list by brand, battery and reseal;
 * - Ireland: Fields' €20 for a battery;
 * - Canada: Longines' own CAD 50 for a Longines, with the sales tax;
 * - anywhere: Frederique Constant's CHF 40 for one of its own, as it lists it.
 * The watch is away a week, SLATE's estimate after Cartier's "at least one
 * week" and Weir & Sons' "not a same-day service", then back at home.
 *
 * From 2026-10-03 (`research-watches-pawn-parking.json`): Tissot's PRX
 * quartz runs on ETA's F06.115, whose maker gives 68 or 94 months on its
 * cell, the middle taken (the PRX's caliber read secondhand), and Tissot's
 * own partial service changes it: $60, £50, €55, C$75 or MX$1,300. And a
 * mechanical watch is serviced as its maker asks: Tissot every four to five
 * years, the middle, by its own complete service on a two- or three-hand
 * mechanical watch, $210, £175, €200, C$270 or MX$4,800. Not serviced by
 * then, it's taken as stopped, as a run-down battery is, SLATE's reading of
 * the maker's interval; serviced, it's away three weeks, Cartier's least
 * for a complete service, the only time published. A mechanical watch whose
 * maker's service isn't priced where you are isn't counted: Seiko's (its 4R
 * every two to three years, priced only secondhand in America), Cartier's
 * (from $430 in America, a check every six years) and Timex's.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { salesTaxRate } from '../content/tax';
import { CLOTHING_PRODUCTS } from '../content/clothingcatalog';
import { BATTERY_YEARS } from '../content/watchbatteries';
import { CITIES } from '../content/geography';
import { payFromBank } from './household';
import { homeKeyOf, itemById, reachable, type Item } from './items';

export const WATCH_AWAY_DAYS = 7;
export const WATCH_BACK_KIND = 'watch.back';

export interface BatteryService { id: string; name: string; country: string | null; brand: string | null; price: number; currency: string; taxIncluded: boolean }
export const BATTERY_SERVICES: readonly BatteryService[] = [
  { id: 'timex-mail-in', name: 'Timex, By Mail', country: 'us', brand: 'Timex', price: 18, currency: 'USD', taxIncluded: true },
  { id: 'tommy-mail-in', name: 'Tommy Hilfiger Watches, By Mail', country: 'us', brand: 'Tommy Hilfiger', price: 6 + 9.95, currency: 'USD', taxIncluded: true },
  { id: 'kay-mail-in', name: 'Jewelry Repair Direct By Kay', country: 'us', brand: null, price: 79, currency: 'USD', taxIncluded: true },
  ...([['Fossil', 35], ['Frederique Constant', 35], ['Longines', 80], ['Tommy Hilfiger', 40], ['Seiko', 35], ['Citizen', 35], ['Michael Kors', 35], ['Tissot', 45]] as const)
    .map(([brand, price]) => ({ id: `fraser-hart-${brand.toLowerCase().replace(/\s+/g, '-')}`, name: 'Fraser Hart', country: 'uk', brand, price, currency: 'GBP', taxIncluded: true })),
  { id: 'fields-dublin', name: 'Fields', country: 'ie', brand: null, price: 20, currency: 'EUR', taxIncluded: true },
  { id: 'longines-canada', name: 'Longines', country: 'ca', brand: 'Longines', price: 50, currency: 'CAD', taxIncluded: false },
  { id: 'frederique-constant', name: 'Frederique Constant', country: null, brand: 'Frederique Constant', price: 40, currency: 'CHF', taxIncluded: true },
  ...([['us', 60, 'USD', false], ['uk', 50, 'GBP', true], ['ie', 55, 'EUR', true], ['ca', 75, 'CAD', false], ['mx', 1_300, 'MXN', true]] as const)
    .map(([country, price, currency, taxIncluded]) => ({ id: `tissot-${country}`, name: 'Tissot', country, brand: 'Tissot', price, currency, taxIncluded })),
];

/** A quartz watch whose battery's life is its movement maker's, from 2026-10-03: the PRX's ETA F06.115, the middle of 68 and 94 months. */
export const EXTRA_BATTERY_YEARS: Readonly<Record<string, number>> = { 'mx-liverpool-mx-reloj-prx-para-hombre-t1374101104100': (68 + 94) / 2 / 12 };

/** A mechanical watch's maker's service: how often, and its complete service's price by country. */
export interface MakerService { brand: string; years: number; prices: Readonly<Record<string, readonly [number, string, boolean]>> }
export const MECHANICAL_SERVICE: readonly MakerService[] = [
  { brand: 'Tissot', years: 4.5, prices: { us: [210, 'USD', false], uk: [175, 'GBP', true], ie: [200, 'EUR', true], ca: [270, 'CAD', false], mx: [4_800, 'MXN', true] } },
];
/** Cartier's least for a complete service, three weeks, the only time published. */
export const SERVICE_AWAY_DAYS = 21;

/** A mechanical watch's maker's service, where it keeps one. */
export const makerServiceOf = (item: Item): MakerService | undefined => {
  if (!/automatic|mechanical|autom[aá]tico/i.test(item.label)) return undefined;
  const brand = brandOf(item)?.toLowerCase();
  return MECHANICAL_SERVICE.find((m) => m.brand.toLowerCase() === brand);
};
/** When a mechanical watch's service falls due, or nothing for one SLATE doesn't count. */
export const serviceDue = (item: Item): Instant | undefined => { const m = makerServiceOf(item); return m ? (item.servicedAt ?? item.acquiredAt) + m.years * 365.25 * MS_DAY : undefined; };

/** Its maker's complete service where you are, in the save's money; nothing where it isn't priced. */
export function servicePrice(sim: Simulation, person: Person, item: Item): Money | undefined {
  const m = makerServiceOf(item);
  const p = m?.prices[CITIES.get(person.currentLocationId)?.countryId ?? ''];
  if (!p) return undefined;
  const c = Math.round(p[0] * (1 + (p[2] ? 0 : salesTaxRate(person.currentLocationId, sim.now, 'goods'))) * 100);
  const cur = saveCurrency(sim.universe);
  return cur === p[1] ? c : exchange(c, p[1], cur) ?? c;
}

const brandOf = (item: Item): string | undefined => CLOTHING_PRODUCTS.find((p) => p.id === item.kind)?.brand;
export const batteryYears = (item: Item): number | undefined => BATTERY_YEARS[item.kind] ?? EXTRA_BATTERY_YEARS[item.kind];

/** When a quartz watch's battery runs down, or nothing for one whose maker gives no life. */
export function batteryRunsOut(item: Item): Instant | undefined {
  const years = batteryYears(item);
  return years === undefined ? undefined : (item.batteryAt ?? item.acquiredAt) + years * 365.25 * MS_DAY;
}

/** Whether a watch has stopped: its battery run down, or a mechanical one past its maker's service. */
export const stopped = (item: Item, at: Instant): boolean => { const out = batteryRunsOut(item); const due = serviceDue(item); return (out !== undefined && at >= out) || (due !== undefined && at >= due); };

/** The changes on offer for a watch where you are, cheapest first, in the save's money. */
export function batteryOptions(sim: Simulation, person: Person, item: Item): { service: BatteryService; price: Money }[] {
  const city = person.currentLocationId;
  const country = CITIES.get(city)?.countryId;
  const brand = brandOf(item)?.toLowerCase();
  const cur = saveCurrency(sim.universe);
  return BATTERY_SERVICES.filter((s) => (s.country === null || s.country === country) && (s.brand === null || s.brand.toLowerCase() === brand))
    .map((service) => {
      const c = Math.round(service.price * (1 + (service.taxIncluded ? 0 : salesTaxRate(city, sim.now, 'goods'))) * 100);
      return { service, price: cur === service.currency ? c : exchange(c, service.currency, cur) ?? c };
    })
    .sort((a, b) => a.price - b.price);
}

export function batteryRefusal(sim: Simulation, person: Person, itemId: string, serviceId: string): string | undefined {
  const item = itemById(person, itemId);
  if (!item || batteryYears(item) === undefined) return 'Only a quartz watch whose maker gives its battery’s life is changed here.';
  if (!reachable(sim, person, item.at)) return `The ${item.label} isn’t to hand.`;
  if (!batteryOptions(sim, person, item).some((o) => o.service.id === serviceId)) return 'That service doesn’t change this watch’s battery here.';
  return undefined;
}

export function registerWatches(sim: Simulation): void {
  sim.onCommand<{ itemId: string; serviceId: string }, { paid: Money; back: Instant }>('watch.battery', (p, { sim: s }) => {
    const person = s.player;
    const no = batteryRefusal(s, person, String(p?.itemId), String(p?.serviceId));
    if (no) throw new CommandError(no);
    const item = itemById(person, String(p.itemId))!;
    const opt = batteryOptions(s, person, item).find((o) => o.service.id === p.serviceId)!;
    if (!payFromBank(s, person, opt.price, `${opt.service.name}: a watch battery`, 'personal')) throw new CommandError('The bank can’t pay for it.');
    const back = s.now + WATCH_AWAY_DAYS * MS_DAY;
    item.at = { kind: 'service', serviceId: `watch:${opt.service.id}`, readyAt: back };
    item.batteryAt = back;
    if (person.wornNow) person.wornNow.itemIds = person.wornNow.itemIds.filter((id) => id !== item.id);
    s.schedule({ at: back, kind: WATCH_BACK_KIND, label: 'A Watch Back', category: 'personal', priority: 30, payload: { personId: person.id, itemId: item.id } });
    return { paid: opt.price, back };
  });
  sim.onCommand<{ itemId: string }, { paid: Money; back: Instant }>('watch.service', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    if (!item || !makerServiceOf(item)) throw new CommandError('Only a mechanical watch whose maker’s service SLATE keeps is serviced here.');
    if (!reachable(s, person, item.at)) throw new CommandError(`The ${item.label} isn’t to hand.`);
    const price = servicePrice(s, person, item);
    if (price === undefined) throw new CommandError(`${makerServiceOf(item)!.brand} prices no service where you are.`);
    if (!payFromBank(s, person, price, `${makerServiceOf(item)!.brand}: a watch’s complete service`, 'personal')) throw new CommandError('The bank can’t pay for it.');
    const back = s.now + SERVICE_AWAY_DAYS * MS_DAY;
    item.at = { kind: 'service', serviceId: `watch:${makerServiceOf(item)!.brand.toLowerCase()}-service`, readyAt: back };
    item.servicedAt = back;
    if (person.wornNow) person.wornNow.itemIds = person.wornNow.itemIds.filter((id) => id !== item.id);
    s.schedule({ at: back, kind: WATCH_BACK_KIND, label: 'A Watch Back', category: 'personal', priority: 30, payload: { personId: person.id, itemId: item.id, serviced: true } });
    return { paid: price, back };
  });
  sim.onSchedule(WATCH_BACK_KIND, (entry, s) => {
    const person = s.universe.people[String(entry.payload.personId)];
    const item = person ? itemById(person, String(entry.payload.itemId)) : undefined;
    if (!person || !item || item.at.kind !== 'service' || !item.at.serviceId.startsWith('watch:')) return;
    const home = homeKeyOf(person.home);
    item.at = home ? { kind: 'home', home, spot: 'drawers' } : { kind: 'person' };
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'A Watch Back', body: `${item.label}, ${entry.payload.serviced ? 'serviced' : 'with a new battery'}, is ${home ? 'home' : 'with you'}.`, importance: 30, route: '/workspace/belongings' });
  });
}
