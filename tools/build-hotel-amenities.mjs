// Builds src/engine/content/hotelamenities.ts from docs/research/world/research-hotel-amenities.json (from 2026-10-02):
// each named hotel's own gym, pool, spa, breakfast, Wi-Fi, accessible rooms, pets, early check-in and cancellation
// deadline, as its own site or, where that refused a read, a booking site gave them. A field nobody stated is null.
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/hotelamenities.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-hotel-amenities.json', 'utf8'));
const yes = (x) => (x === true ? true : x === false ? false : null);
const rows = j.map((h) => ({
  id: h.id,
  gym: yes(h.gym?.available),
  pool: h.pool?.available === true ? (h.pool.kind === 'outdoor' ? 'outdoor' : 'indoor') : h.pool?.available === false ? 'none' : null,
  spa: yes(h.spa?.available),
  breakfast: h.breakfast ? { included: yes(h.breakfast.included), price: typeof h.breakfast.pricePerPerson === 'number' ? h.breakfast.pricePerPerson : null, currency: h.breakfast.currency ?? null } : null,
  wifiFree: yes(h.wifi?.free),
  accessible: yes(h.accessible?.offered),
  pets: h.pets ? { allowed: yes(h.pets.allowed), fee: typeof h.pets.fee === 'number' ? h.pets.fee : null, per: h.pets.basis === 'per stay' ? 'stay' : h.pets.basis === 'per night' ? 'night' : null, currency: h.pets.currency ?? null } : null,
  earlyCheckIn: h.earlyCheckIn ? { offered: yes(h.earlyCheckIn.offered), fee: typeof h.earlyCheckIn.fee === 'number' ? h.earlyCheckIn.fee : null } : null,
  cancel: h.cancellation && typeof h.cancellation.hoursBeforeArrival === 'number' ? { hours: h.cancellation.hoursBeforeArrival, by: h.cancellation.byTime ?? null } : null,
  source: h.source ?? null,
}));

const body = `/**
 * SLATE — each named hotel's own amenities and terms (from 2026-10-02),
 * built by \`tools/build-hotel-amenities.mjs\` from
 * \`docs/research/world/research-hotel-amenities.json\`. Don't edit by hand;
 * rebuild it.
 *
 * Read from the hotel's own site where it answered, and a booking site's
 * listing where it didn't, as each hotel's notes in the research say. A field
 * nothing read stated is null, not taken as absent. A cancellation deadline
 * is hours before arrival, and where the hotel names an hour, that hour of
 * the day it falls on.
 */

export interface HotelAmenities {
  id: string;
  gym: boolean | null;
  pool: 'indoor' | 'outdoor' | 'none' | null;
  spa: boolean | null;
  breakfast: { included: boolean | null; price: number | null; currency: string | null } | null;
  wifiFree: boolean | null;
  accessible: boolean | null;
  pets: { allowed: boolean | null; fee: number | null; per: 'stay' | 'night' | null; currency: string | null } | null;
  earlyCheckIn: { offered: boolean | null; fee: number | null } | null;
  cancel: { hours: number; by: string | null } | null;
  source: string | null;
}

export const HOTEL_AMENITIES: readonly HotelAmenities[] = JSON.parse(${JSON.stringify(JSON.stringify(rows))});
`;
writeFileSync(OUT, body);
console.log('hotels', rows.length);
