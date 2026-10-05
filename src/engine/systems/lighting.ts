/**
 * SLATE — a home's lights (from 2026-10-05): its sockets, the bulb in each,
 * the hours they burn, the bulbs that burn out and the ones bought to replace
 * them, and the lamps that bring sockets of their own.
 *
 * A home has the household average of sockets for its market
 * (`content/lighting.ts`), its share of them in a shared home, each with the
 * bulb the typical home is taken to have: the median draw of the rated
 * general LEDs on sale there for its socket, at ENERGY STAR's least rated
 * life, their ages spread through that life so they go one at a time. The
 * hours a socket is lit come from the survey's share of the typical month's
 * electricity spread over those bulbs, and move with the hours somebody is
 * home and up after dark that day: a London December lights them longer than
 * its June, and a life out every evening less. What they draw goes on the
 * month's electricity past the typical household's lighting (`lightKwh`).
 *
 * A bulb that reaches its rated hours goes out and stays out until one is
 * fitted: from the spares bought (`lighting.buy_bulbs`), or, with the
 * restocking shortcut on, a pack of the cheapest that fits bought on a free
 * day. A lamp (`lighting.buy_lamp`) brings its own sockets, empty unless it
 * comes with its bulbs, and takes nothing over its stated watts; one with an
 * LED built in has none to change. Fitting a kind of bulb (`lighting.fit`)
 * puts it in the dark sockets first, then the ones drawing most.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { MS_HOUR, startOfDay } from '../core/time';
import { sunTimes } from '../core/sun';
import { CITIES } from '../content/geography';
import { LIGHTING_NORM, WAKING_HOURS } from '../content/lighting';
import { LIGHTING_PRODUCTS } from '../content/lightingcatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { buyDevice, deviceCatalog, devicePrice, deviceRefusal, marketWhere, offerIn } from './devices';
import { addItem, homeKeyOf, itemsOf, type Item } from './items';
import { payFromBank } from './household';
import { someoneHome } from './away';
import { KIND_SHARE, TARIFFS } from './electricity';
import { livingOf } from './dwelling';

export interface Socket {
  /** The socket's fitting: an Edison screw, a bayonet, a GU10 spot, a small screw. */
  socket: string;
  /** What its bulb draws; none while it's dark or empty. */
  watts?: number;
  /** The bulb's rated hours and the hours it has burned. */
  life: number;
  hours: number;
  /** The bulb's product, or 'typical' for the one the home came with. */
  bulb?: string;
  /** The lamp it belongs to, an item; none for the home's own. */
  lamp?: string;
  /** The most the lamp takes. */
  maxWatts?: number;
  /** An LED built into the lamp: nothing to change, and SLATE never burns it out, no maker's life being read. */
  built?: true;
}
export interface Lights { home: string; sockets: Socket[] }

export const BULBS = LIGHTING_PRODUCTS.filter((p) => p.category === 'bulb');
export const LAMPS = LIGHTING_PRODUCTS.filter((p) => p.category === 'lamp');
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const median = (xs: number[]): number | undefined => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : undefined; };

/** The typical home's bulb in a market's socket: the median draw of the rated plain LEDs giving 700 to 900 lumens there, at its median rated life. */
export function typicalBulb(market: string, socket: string): { watts: number; life: number } | undefined {
  const like = (m: string | undefined, s: string | undefined) => BULBS.filter((p) => (m === undefined || p.offers.some((o) => o.market === m)) && (s === undefined || p.attrs.socket === s)
    && p.attrs.wattsBasis === 'read' && !p.attrs.smart && (num(p.attrs.lumens) ?? 0) >= 700 && (num(p.attrs.lumens) ?? 0) <= 900);
  const set = [like(market, socket), like(market, undefined), like(undefined, socket), like(undefined, undefined)].find((x) => x.length > 0);
  const watts = set && median(set.map((p) => Number(p.attrs.watts)));
  const life = set && median(set.map((p) => Number(p.attrs.lifeHours)));
  return watts !== undefined && life !== undefined ? { watts, life } : undefined;
}

/** The hours a typical home's socket is lit a day: the lighting share of the town's typical month, or its market's towns' mean, over its sockets' typical draw. */
export function typicalSocketHours(market: string, cityId?: string): number | undefined {
  const norm = LIGHTING_NORM[market];
  const bulb = norm && typicalBulb(market, norm.socket);
  if (!norm || !bulb) return undefined;
  const own = cityId ? TARIFFS[cityId] : undefined;
  const towns = own ? [own.typicalKwh] : Object.entries(TARIFFS).filter(([city]) => marketWhere(city) === market).map(([, t]) => t.typicalKwh);
  // Mexico's towns have no tariff kept: America's hours, SLATE's assumption.
  const monthly = towns.length ? towns.reduce((a, b) => a + b, 0) / towns.length : undefined;
  if (monthly === undefined) return market === 'us' ? undefined : typicalSocketHours('us');
  return (monthly * 12 / 365 * norm.share) / (norm.lamps * bulb.watts / 1000);
}

const isDark = (at: number, lat: number, lon: number, zone: string): boolean => {
  const sun = sunTimes(at, lat, lon, zone as never);
  return sun.polar === 'night' || (sun.polar !== 'day' && (sun.sunrise === undefined || sun.sunset === undefined || at < sun.sunrise || at >= sun.sunset));
};

/** A town's waking hours in the dark on a day. */
function darkWakingHours(cityId: string, dayStart: number): number[] {
  const c = CITIES.require(cityId);
  const hours: number[] = [];
  for (let h = WAKING_HOURS[0]; h < WAKING_HOURS[1]; h += 1) if (isDark(dayStart + (h + 0.5) * MS_HOUR, c.latitude, c.longitude, c.timeZone)) hours.push(h);
  return hours;
}

const yearMean = new Map<string, number>();
/** A town's waking hours in the dark through a year, a day's mean: twelve mid-month days of the year. */
export function meanDarkHours(cityId: string, at: number): number {
  const c = CITIES.require(cityId);
  const year = new Date(at).getUTCFullYear();
  const key = `${cityId}:${year}`;
  let mean = yearMean.get(key);
  if (mean === undefined) {
    let sum = 0;
    for (let m = 0; m < 12; m += 1) sum += darkWakingHours(cityId, startOfDay(Date.UTC(year, m, 15, 12), c.timeZone)).length;
    mean = sum / 12;
    yearMean.set(key, mean);
  }
  return mean;
}

/** The hours somebody is home and up in the dark on the day starting then. */
export function litHours(sim: Simulation, person: Person, dayStart: number): number {
  if (!person.home) return 0;
  return darkWakingHours(person.home.cityId, dayStart).filter((h) => someoneHome(sim, person, dayStart + h * MS_HOUR, dayStart + (h + 1) * MS_HOUR)).length;
}

/** How many sockets a home of theirs has: the market's household average, its share in a shared home. */
export function homeSockets(person: Person): number {
  const market = person.home ? marketWhere(person.home.cityId) : undefined;
  const norm = market ? LIGHTING_NORM[market] : undefined;
  const share = person.home ? KIND_SHARE[person.home.kind] : undefined;
  return norm && share !== undefined ? Math.round(norm.lamps * share) : 0;
}

/** Their home's lights, fitted as the typical home's the first day they have one and again in a new home, the lamps they keep carried over. */
export function lightsOf(person: Person): Lights | undefined {
  const key = homeKeyOf(person.home);
  const market = person.home ? marketWhere(person.home.cityId) : undefined;
  if (!key || !market || person.home!.kind === 'sofa') return undefined;
  const living = livingOf(person);
  const now = living.lights;
  if (now?.home === key) return now;
  const norm = LIGHTING_NORM[market]!;
  const bulb = typicalBulb(market, norm.socket);
  if (!bulb) return undefined;
  const n = homeSockets(person);
  const lamps = new Set(itemsOf(person).filter((i) => i.kind === 'furniture:lamp' && i.at.kind === 'home' && i.at.home === key).map((i) => i.id));
  const sockets: Socket[] = [
    ...Array.from({ length: n }, (_, k) => ({ socket: norm.socket, watts: bulb.watts, life: bulb.life, hours: Math.floor((bulb.life * k) / n), bulb: 'typical' })),
    ...(now?.sockets ?? []).filter((s) => s.lamp && lamps.has(s.lamp)),
  ];
  return (living.lights = { home: key, sockets });
}

/** The day's lights: each lit socket burns its share of the hours, onto the month's electricity, and a bulb past its life goes out. */
export function lightingDay(sim: Simulation, person: Person): number {
  const lights = lightsOf(person);
  const market = person.home ? marketWhere(person.home.cityId) : undefined;
  const typical = market ? typicalSocketHours(market, person.home?.cityId) : undefined;
  if (!lights || typical === undefined) return 0;
  const dayStart = startOfDay(sim.now, CITIES.require(person.home!.cityId).timeZone);
  const mean = meanDarkHours(person.home!.cityId, sim.now);
  const hours = mean > 0 ? typical * litHours(sim, person, dayStart) / mean : 0;
  let kwh = 0;
  for (const s of lights.sockets) {
    if (s.watts === undefined) continue;
    kwh += (s.watts * hours) / 1000;
    if (s.built) continue;
    s.hours += hours;
    if (s.hours >= s.life) delete s.watts;
  }
  const l = person.living!;
  l.lightKwh = (l.lightKwh ?? 0) + kwh;
  return kwh;
}

/** The typical household's lighting over some days at home, kilowatt-hours: what the typical month already holds. */
export function typicalLightKwh(person: Person, days: number): number {
  const market = person.home ? marketWhere(person.home.cityId) : undefined;
  const norm = market ? LIGHTING_NORM[market] : undefined;
  const t = person.home ? TARIFFS[person.home.cityId] : undefined;
  const share = person.home ? KIND_SHARE[person.home.kind] : undefined;
  if (!norm || !t || share === undefined) return 0;
  return t.typicalKwh * 12 / 365 * norm.share * share * days;
}

/** The sockets dark for want of a bulb. */
export const darkSockets = (person: Person): Socket[] => (lightsOf(person)?.sockets ?? []).filter((s) => s.watts === undefined && !s.built);

/** The spare bulbs at home, by product. */
export function spareBulbs(person: Person): { item: Item; product: CatalogProduct }[] {
  const home = homeKeyOf(person.home);
  return itemsOf(person).filter((i) => i.kind.startsWith('bulb:') && i.at.kind === 'home' && i.at.home === home && i.quantity > 0)
    .map((item) => ({ item, product: BULBS.find((p) => p.id === item.kind.slice(5))! })).filter((x) => x.product);
}

export const bulbCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, BULBS);
export const lampCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, LAMPS);
export const bulbRefusal = (person: Person, offerId: string): string | undefined => deviceRefusal(person, BULBS, offerId, 'A bulb') ?? (lightsOf(person) ? undefined : 'Your home’s lights aren’t yours to change.');
export const lampRefusal = (person: Person, offerId: string): string | undefined => deviceRefusal(person, LAMPS, offerId, 'A lamp') ?? (lightsOf(person) ? undefined : 'Your home’s lights aren’t yours to change.');

/** A pack of bulbs bought and put away. */
export function buyBulbs(sim: Simulation, person: Person, offerId: string): { paid: Money; item: Item } {
  const no = bulbRefusal(person, offerId);
  if (no) throw new CommandError(no);
  const { product, offer } = offerIn(BULBS, offerId)!;
  const paid = devicePrice(sim, person.home!.cityId, offer);
  if (!payFromBank(sim, person, paid, `${offer.seller}: ${product.model}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
  const item = addItem(sim, person, { kind: `bulb:${product.id}`, label: `${product.brand} ${product.model}`, quantity: Number(product.attrs.pack) || 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'storage' }, acquiredAt: sim.now, paid });
  return { paid, item };
}

/** Why a kind of bulb can't go in now: none spare, or no socket it fits. */
export function fitRefusal(person: Person, productId: string): string | undefined {
  const spare = spareBulbs(person).find((x) => x.product.id === productId);
  if (!spare) return 'You have none of those spare.';
  const lights = lightsOf(person);
  const watts = Number(spare.product.attrs.watts);
  if (!lights?.sockets.some((s) => !s.built && s.socket === spare.product.attrs.socket && (s.maxWatts === undefined || watts <= s.maxWatts) && s.bulb !== productId)) return 'No socket here takes it.';
  return undefined;
}

/** Fits spare bulbs of a kind: into the dark sockets that take it first, then the ones drawing most; how many went in. */
export function fitBulbs(person: Person, productId: string, onlyDark = false): number {
  const no = fitRefusal(person, productId);
  if (no) throw new CommandError(no);
  const spare = spareBulbs(person).find((x) => x.product.id === productId)!;
  const watts = Number(spare.product.attrs.watts);
  const into = lightsOf(person)!.sockets.filter((s) => !s.built && s.socket === spare.product.attrs.socket && (s.maxWatts === undefined || watts <= s.maxWatts) && s.bulb !== productId && (!onlyDark || s.watts === undefined))
    .sort((a, b) => (a.watts === undefined ? -1 : 0) - (b.watts === undefined ? -1 : 0) || (b.watts ?? 0) - (a.watts ?? 0));
  let fitted = 0;
  for (const s of into) {
    if (spare.item.quantity <= 0) break;
    Object.assign(s, { watts, life: Number(spare.product.attrs.lifeHours), hours: 0, bulb: productId });
    spare.item.quantity -= 1;
    fitted += 1;
  }
  if (spare.item.quantity <= 0) person.items = itemsOf(person).filter((i) => i !== spare.item);
  return fitted;
}

/** On a free day with the shortcut on: the dark sockets filled from the spares, and where none fits, a pack of the cheapest that does bought. */
export function replaceBulbs(sim: Simulation, person: Person): number {
  let fitted = 0;
  for (const socket of [...new Set(darkSockets(person).map((s) => s.socket))]) {
    for (const spare of spareBulbs(person).filter((x) => x.product.attrs.socket === socket)) if (!fitRefusal(person, spare.product.id)) fitted += fitBulbs(person, spare.product.id, true);
    if (!darkSockets(person).some((s) => s.socket === socket)) continue;
    const cheapest = bulbCatalog(sim, person).find((r) => r.product.attrs.socket === socket && !r.product.attrs.smart && !bulbRefusal(person, r.offer.id));
    if (!cheapest) continue;
    try { buyBulbs(sim, person, cheapest.offer.id); } catch { continue; }
    fitted += fitBulbs(person, cheapest.product.id, true);
  }
  return fitted;
}

/** A lamp bought and brought home, with its sockets: its bulbs in where it comes with them, the typical one for its socket. */
export function buyLamp(sim: Simulation, person: Person, offerId: string, color: unknown): { paid: Money; item: Item } {
  const no = lampRefusal(person, offerId);
  if (no) throw new CommandError(no);
  const lights = lightsOf(person)!;
  const { paid, item } = buyDevice(sim, person, LAMPS, offerId, color, 'lamp', 'A lamp', (product) => `${product.brand} ${product.model}`);
  const product = LAMPS.find((p) => p.id === item.spec?.product)!;
  const a = product.attrs;
  const market = marketWhere(person.home!.cityId)!;
  if (a.integrated) lights.sockets.push({ socket: 'led', watts: num(a.ledWatts) ?? typicalBulb(market, 'edison')!.watts, life: 0, hours: 0, lamp: item.id, built: true });
  else {
    const socket = typeof a.socket === 'string' ? a.socket : LIGHTING_NORM[market]!.socket;
    const typical = typicalBulb(market, socket);
    const maxWatts = num(a.maxWatts);
    for (let n = 0; n < (num(a.bulbs) ?? 1); n += 1) {
      lights.sockets.push(a.bulbIncluded && typical
        ? { socket, watts: typical.watts, life: typical.life, hours: 0, bulb: 'typical', lamp: item.id, ...(maxWatts ? { maxWatts } : {}) }
        : { socket, life: 0, hours: 0, lamp: item.id, ...(maxWatts ? { maxWatts } : {}) });
    }
  }
  return { paid, item };
}

export function registerLighting(sim: Simulation): void {
  sim.onCommand<{ offerId: string }, { paid: Money; itemId: string }>('lighting.buy_bulbs', (p, { sim: s }) => {
    const { paid, item } = buyBulbs(s, s.player, String(p?.offerId ?? ''));
    return { paid, itemId: item.id };
  });
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('lighting.buy_lamp', (p, { sim: s }) => {
    const { paid, item } = buyLamp(s, s.player, String(p?.offerId ?? ''), p?.color);
    return { paid, itemId: item.id };
  });
  sim.onCommand<{ productId: string }, { fitted: number }>('lighting.fit', (p, { sim: s }) => ({ fitted: fitBulbs(s.player, String(p?.productId ?? '')) }));
}
