/**
 * SLATE — a car's interior done to your own design (the master plan's §38d
 * and §38g–l, from 2026-10-02; `docs/research/world/research-interiors.json`).
 *
 * You choose what's done (the seats, the headliner, the steering wheel), the
 * material, its color and the stitching, and a shop in the car's town makes
 * it. The design is kept with the car exactly as commissioned; it changes
 * nothing about how the car drives or what it's worth, as an interior
 * doesn't.
 *
 * **Custom upholstery** at a named shop in New York or Los Angeles, the only
 * towns where the research read a shop's own page. No shop there publishes a
 * full-interior price; each quotes after seeing the car. So the estimate is
 * itemized from what is published:
 * - Hours: the trade guides' 12 to 20 for two rows of seats, 2 to 6 for a
 *   headliner and 1.5 to 4 for a steering wheel, taken at their middles.
 * - The rate: $75 an hour, the median a trade survey of US shops reports
 *   most sit around.
 * - Materials at suppliers' published prices: automotive vinyl at $14.60 a
 *   yard, perforated at $19.95 (Your Auto Trim Store); leather at $4.50 a
 *   square foot (Lseat); Alcantara at $132 a yard (Upholstery Supply USA);
 *   leopard-print vinyl at $17.00 (Great Lakes Fabrics); leopard faux fur at
 *   $26.99 (Ice Fabrics), sold as fabric with no flame-retardancy claim for a
 *   car; headliner cloth at $17.55.
 * - How much each part takes is SLATE's estimate, no source publishing it:
 *   12 yards for two rows of seats, 4 for a headliner and half a yard for a
 *   wheel; a yard of 54-inch goods is 13.5 square feet of leather.
 * The car is at the shop a working day for every eight hours, SLATE's reading.
 *
 * **A Katzkin leather kit** at City Seat Covers in Long Island City, a
 * Katzkin dealer: from Katzkin's own $2,195 installed. Katzkin cuts the kit
 * in one to two weeks and fits it in a day or two, so the car goes in two
 * weeks on, for two days. Its colors and two-tones are leather only; it makes
 * no animal print.
 *
 * Not kept: door panels and carpets (no hours read), the other towns' shops
 * (none publishes a price, and none of their rates was read), and the
 * original covers coming back.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { inSaveMoney } from './banking';
import { spend } from './household';
import type { OwnedVehicle } from './vehicles';

export type Part = 'seats' | 'headliner' | 'steering';
export type Material = 'leather' | 'vinyl' | 'perforated-vinyl' | 'alcantara' | 'leopard-vinyl' | 'leopard-fur' | 'headliner-cloth';

export const PART_LABEL: Readonly<Record<Part, string>> = { seats: 'Seats, Both Rows', headliner: 'Headliner', steering: 'Steering Wheel' };
export const MATERIAL_LABEL: Readonly<Record<Material, string>> = {
  leather: 'Leather', vinyl: 'Vinyl', 'perforated-vinyl': 'Perforated Vinyl', alcantara: 'Alcantara', 'leopard-vinyl': 'Leopard-Print Vinyl', 'leopard-fur': 'Leopard Faux Fur', 'headliner-cloth': 'Headliner Cloth',
};

/** The trade guides' hours, at their middles. */
export const HOURS: Readonly<Record<Part, number>> = { seats: 16, headliner: 4, steering: 2.75 };
/** The median US shop rate a trade survey reports, an hour. */
export const SHOP_RATE_USD = 75;
/** Yards each part takes, SLATE's estimate; a yard of 54-inch goods is 13.5 square feet. */
export const YARDS: Readonly<Record<Part, number>> = { seats: 12, headliner: 4, steering: 0.5 };
export const SQFT_PER_YARD = 13.5;
/** Suppliers' prices, US dollars, a yard; leather a square foot. */
export const MATERIAL_USD: Readonly<Record<Material, { price: number; per: 'yard' | 'sqft'; supplier: string }>> = {
  leather: { price: 4.5, per: 'sqft', supplier: 'Lseat' },
  vinyl: { price: 14.6, per: 'yard', supplier: 'Your Auto Trim Store' },
  'perforated-vinyl': { price: 19.95, per: 'yard', supplier: 'Your Auto Trim Store' },
  alcantara: { price: 132, per: 'yard', supplier: 'Upholstery Supply USA' },
  'leopard-vinyl': { price: 17, per: 'yard', supplier: 'Great Lakes Fabrics' },
  'leopard-fur': { price: 26.99, per: 'yard', supplier: 'Ice Fabrics' },
  'headliner-cloth': { price: 17.55, per: 'yard', supplier: 'Automotive Interiors & Accessories' },
};
/** What each part may be done in. A headliner isn't leather. */
export const FITS: Readonly<Record<Part, readonly Material[]>> = {
  seats: ['leather', 'vinyl', 'perforated-vinyl', 'alcantara', 'leopard-vinyl', 'leopard-fur'],
  headliner: ['headliner-cloth', 'alcantara', 'leopard-fur'],
  steering: ['leather', 'alcantara', 'perforated-vinyl'],
};
export const KATZKIN_USD = 2_195;
export const KATZKIN = { waitDays: 14, shopDays: 2 } as const;

export interface UpholsteryShop { id: string; name: string; address: string; cityId: string; katzkin?: boolean; source: string }
export const UPHOLSTERERS: readonly UpholsteryShop[] = [
  { id: 'city-seat-covers-lic', name: 'City Seat Covers', address: '41-24 38th Street, Long Island City, NY 11101', cityId: 'us-ny-newyork', katzkin: true, source: 'https://www.cityseatcovers.com/' },
  { id: 'ivan-car-upholstery-bronx', name: 'Ivan Car Upholstery', address: 'The Bronx, NY 10461', cityId: 'us-ny-newyork', source: 'https://www.ivancarupholsteryllc.com/' },
  { id: 'los-angeles-upholstery-pico', name: 'Los Angeles Upholstery', address: '3268 W Pico Blvd, Los Angeles, CA 90019', cityId: 'us-ca-losangeles', source: 'https://losangelesupholstery.com/headliner-repair/' },
  { id: 'advance-auto-upholstery-van-nuys', name: 'Advance Auto Upholstery', address: '7008 Van Nuys Boulevard, Van Nuys, CA 91405', cityId: 'us-ca-losangeles', source: 'https://aaupholstery.net/' },
];

/** A design as commissioned: what was done, in what, its colors, and where and when; kept with the car. */
export interface Interior {
  parts: { part: Part; material: Material; color: string; stitching: string }[];
  kit?: 'katzkin';
  shopId: string;
  at: Instant;
  paid: Money;
}

export interface Line { label: string; amount: Money }

/** An itemized estimate for a design at a shop, in the save's money; or why it can't be done there. */
export function interiorQuote(sim: Simulation, shopId: string, design: Interior['parts'], kit = false): { lines: Line[]; total: Money; days: number } | string {
  const shop = UPHOLSTERERS.find((s) => s.id === shopId);
  if (!shop) return 'There’s no such shop.';
  if (design.length === 0) return 'Choose what’s to be done.';
  if (new Set(design.map((d) => d.part)).size !== design.length) return 'Each part once.';
  if (kit) {
    if (!shop.katzkin) return `${shop.name} doesn’t fit Katzkin.`;
    if (design.some((d) => d.material !== 'leather' || d.part !== 'seats')) return 'A Katzkin kit is leather seats only.';
    return { lines: [{ label: 'A Katzkin Leather Kit, Fitted', amount: inSaveMoney(sim, KATZKIN_USD * 100, 'USD') }], total: inSaveMoney(sim, KATZKIN_USD * 100, 'USD'), days: KATZKIN.waitDays + KATZKIN.shopDays };
  }
  const lines: Line[] = [];
  let hours = 0;
  for (const d of design) {
    if (!FITS[d.part].includes(d.material)) return `A ${PART_LABEL[d.part].toLowerCase()} isn’t done in ${MATERIAL_LABEL[d.material].toLowerCase()}.`;
    const m = MATERIAL_USD[d.material];
    const qty = m.per === 'sqft' ? YARDS[d.part] * SQFT_PER_YARD : YARDS[d.part];
    lines.push({ label: `${PART_LABEL[d.part]}: ${MATERIAL_LABEL[d.material]}, ${qty} ${m.per === 'sqft' ? 'Square Feet' : 'Yards'} From ${m.supplier}`, amount: inSaveMoney(sim, Math.round(qty * m.price * 100), 'USD') });
    lines.push({ label: `${PART_LABEL[d.part]}: ${HOURS[d.part]} Hours At $${SHOP_RATE_USD}`, amount: inSaveMoney(sim, Math.round(HOURS[d.part] * SHOP_RATE_USD * 100), 'USD') });
    hours += HOURS[d.part];
  }
  return { lines, total: lines.reduce((a, l) => a + l.amount, 0), days: Math.ceil((Math.ceil(hours / 8) * 7) / 5) };
}

export const INTERIOR_FIT_KIND = 'vehicle.interior_fit';

export function registerInteriors(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined): void {
  sim.onCommand<{ vehicleId: string; shopId: string; design: Interior['parts']; kit?: boolean }, { paid: Money; readyAt: Instant }>('vehicle.interior', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you own.');
    const shop = UPHOLSTERERS.find((x) => x.id === p?.shopId);
    if (!shop) throw new CommandError('There’s no such shop.');
    if ((v.at ?? v.cityId) !== shop.cityId) throw new CommandError('The car isn’t in the shop’s town.');
    if (person.currentLocationId !== shop.cityId) throw new CommandError('You’re not in the shop’s town.');
    if (v.inShop && v.inShop.until > s.now) throw new CommandError('It’s in a shop already.');
    if (v.lease) throw new CommandError('It’s the lessor’s car: its interior isn’t yours to change.');
    const design = Array.isArray(p?.design) ? p.design.map((d) => ({ part: d.part, material: d.material, color: String(d.color ?? '').trim(), stitching: String(d.stitching ?? '').trim() })) : [];
    if (design.some((d) => !d.color)) throw new CommandError('Choose a color for each part.');
    const q = interiorQuote(s, shop.id, design, p?.kit === true);
    if (typeof q === 'string') throw new CommandError(q);
    if (!spend(s, person, q.total, `${shop.name}, the car’s interior`, 'vehicle')) throw new CommandError(`It comes to ${formatMoney(q.total, saveCurrency(s.universe))}, more than you can pay.`);
    const interior: Interior = { parts: design, ...(p?.kit ? { kit: 'katzkin' as const } : {}), shopId: shop.id, at: s.now, paid: q.total };
    const readyAt = s.now + q.days * MS_DAY;
    if (p?.kit) {
      // The kit is cut first; the car goes in when it comes.
      s.schedule({ at: s.now + KATZKIN.waitDays * MS_DAY, kind: INTERIOR_FIT_KIND, label: `${shop.name}: The Kit Is In`, category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id, until: readyAt } });
      v.interiorOrdered = interior;
    } else {
      v.interior = interior;
      v.inShop = { shopId: shop.id, until: readyAt, name: shop.name };
    }
    return { paid: q.total, readyAt };
  });

  sim.onSchedule(INTERIOR_FIT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? find(person, String(item.payload.vehicleId)) : undefined;
    if (!person || !v?.interiorOrdered) return;
    const shop = UPHOLSTERERS.find((x) => x.id === v.interiorOrdered!.shopId)!;
    v.inShop = { shopId: shop.id, until: Number(item.payload.until), name: shop.name };
    v.interior = v.interiorOrdered;
    delete v.interiorOrdered;
  });
}
