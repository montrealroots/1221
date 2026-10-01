// Builds src/engine/content/hotels.ts (Stage 6 of docs/BACKLOG.md, from
// 2026-10-01) from docs/research/world/research-hotels.json (the properties,
// their rooms, policies and fees) and research-hotel-rates.json (the nightly
// rates their own booking engines quoted for three nights).
//
// The rates file in the repository is the public rates only, reduced from
// what the engines returned: a member's, a resident's or another qualified
// rate is left out, and for each room on each night the cheapest refundable
// rate and the cheapest that isn't are kept. `--reduce <raw.json>` makes it
// from the agent's raw capture.
import { readFileSync, writeFileSync } from 'node:fs';

const RATES = 'docs/research/world/research-hotel-rates.json';
const QUALIFIED = /member|resident|aaa|aarp|senior|govern|military|employee|corporate|teacher|student|first responder|healthcare|loyal/i;
const PREPAID = /non-?refundable|no refund|not refundable|prepaid|pay now/i;

if (process.argv[2] === '--reduce') {
  const raw = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const keep = new Map();
  for (const r of raw.rates) {
    if (typeof r.price !== 'number' || r.price <= 0) continue;
    if (QUALIFIED.test(`${r.rateName} ${r.notes ?? ''}`)) continue;
    const plan = PREPAID.test(`${r.cancellation ?? ''} ${r.rateName}`) ? 'prepaid' : 'flexible';
    const key = `${r.hotelId}|${r.roomType}|${r.checkIn}|${plan}`;
    const had = keep.get(key);
    if (!had || r.price < had.price) keep.set(key, { hotelId: r.hotelId, roomType: r.roomType, bed: r.bed ?? null, checkIn: r.checkIn, plan, rateName: r.rateName, price: r.price, currency: r.currency, priceBasis: r.priceBasis, taxesAndFees: r.taxesAndFees ?? null, cancellation: r.cancellation ?? null, url: r.url, readAt: r.readAt });
  }
  const out = { meta: { ...raw.meta, reduced: 'Public rates only: member, resident and other qualified rates left out; for each room on each night, the cheapest refundable and the cheapest non-refundable rate kept. The full capture is in the session scratchpad of 2026-10-01.' }, rates: [...keep.values()], blocked: raw.blocked };
  writeFileSync(RATES, JSON.stringify(out, null, 1));
  console.log('reduced', raw.rates.length, '->', out.rates.length);
  process.exit(0);
}

const hotels = JSON.parse(readFileSync('docs/research/world/research-hotels.json', 'utf8')).hotels;
const rates = JSON.parse(readFileSync(RATES, 'utf8')).rates;
const out = [];
for (const h of hotels) {
  const mine = rates.filter((r) => r.hotelId === h.id);
  if (mine.length === 0) continue;
  const rooms = new Map();
  for (const r of mine) {
    const room = rooms.get(r.roomType) ?? { name: r.roomType, bed: r.bed, currency: r.currency, basis: r.priceBasis, rates: { flexible: {}, prepaid: {} } };
    room.rates[r.plan][r.checkIn] = r.price;
    rooms.set(r.roomType, room);
  }
  const fee = h.fees?.resortOrDestinationFeePerNight;
  out.push({
    id: h.id, name: h.name, brand: h.brand ?? null, cityId: h.city, address: h.address ?? null,
    checkIn: h.checkIn ?? null, checkOut: h.checkOut ?? null, minAge: h.policies?.minCheckInAge ?? null,
    fee: fee && typeof fee.amount === 'number' ? { amount: fee.amount, currency: fee.currency, name: fee.name ?? 'Resort fee', taxIncluded: fee.taxIncluded === true } : null,
    rooms: [...rooms.values()],
    url: h.url ?? null,
  });
}

const body = `/**
 * SLATE — named hotels (Stage 6 of \`docs/BACKLOG.md\`), built by
 * \`tools/build-hotels.mjs\` from \`docs/research/world/research-hotels.json\`
 * and \`research-hotel-rates.json\`. Don't edit by hand; rebuild it.
 *
 * Each room's rates are its hotel's own booking engine's for one night, one
 * adult, on the nights it was read (2026-11-10, 2026-12-15 and 2027-02-10),
 * a refundable rate and a non-refundable one where it offered each, in the
 * hotel's money, before tax or tax in as \`basis\` says. A hotel whose
 * engine refused an automated read (Marriott's, Hilton's, Hyatt's) has none
 * and isn't here.
 */

export interface HotelRoom {
  name: string; bed: string | null; currency: string; basis: 'before-tax' | 'tax-inclusive';
  /** The night's rate by the date it was read, on each plan. */
  rates: { flexible: Readonly<Record<string, number>>; prepaid: Readonly<Record<string, number>> };
}

export interface Hotel {
  id: string; name: string; brand: string | null; cityId: string; address: string | null;
  checkIn: string | null; checkOut: string | null; minAge: number | null;
  /** A resort, destination or facility fee a night, where it charges one. */
  fee: { amount: number; currency: string; name: string; taxIncluded: boolean } | null;
  rooms: readonly HotelRoom[];
  url: string | null;
}

export const HOTELS: readonly Hotel[] = JSON.parse(${JSON.stringify(JSON.stringify(out))});
`;
writeFileSync('src/engine/content/hotels.ts', body);
console.log('hotels', out.length, 'rooms', out.reduce((s, h) => s + h.rooms.length, 0));
