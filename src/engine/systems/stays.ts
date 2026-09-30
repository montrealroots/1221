/**
 * SLATE — a hotel booked for a journey's nights (docs/WORLD.md, stage 2).
 * From 2026-09-29.
 *
 * A night is the town's published average daily rate and the taxes a guest
 * pays on it (`content/stays.ts`); where a town has no published average,
 * the US government's lodging per diem for it, a ceiling set from its
 * hotels' rates, and said so. A town neither covers borrows the rate of the
 * nearest one in its country that has one, within reach, and says so; past
 * that, SLATE doesn't have its hotels, and a journey there needs a home of
 * one's own to stay in.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { PER_DIEM, STAYS, type StayRate } from '../content/stays';
import { PREPAID_OFF, STAY_CLASS_LABEL, STAY_OPTIONS, type RatePlan, type StayClass } from '../content/staytypes';

/** How far a town may borrow a nearby town's hotel rate: SLATE's estimate, a metropolitan area's reach. */
export const BORROW_WITHIN_KM = 60;

export interface NightRate { perNight: number; currency: string; basis: string; rate: StayRate; from: string }

/** A town's night in a mid-market hotel, before tax, and whose figure it is. */
export function nightRateFor(cityId: string): NightRate | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const pick = (id: string): NightRate | undefined => {
    const rate = STAYS[id];
    if (!rate) return undefined;
    if (rate.adr !== null) return { perNight: rate.adr, currency: rate.currency, basis: `${rate.basis}, ${rate.year} (average daily rate)`, rate, from: id };
    const diem = PER_DIEM[id];
    return diem ? { perNight: diem.usd, currency: 'USD', basis: `No published average: the US government’s lodging per diem, ${diem.effective}, a ceiling set from its hotels’ rates`, rate, from: id } : undefined;
  };
  const own = pick(cityId);
  if (own) return own;
  const near = Object.keys(STAYS).map((id) => ({ id, c: CITIES.get(id) })).filter((x) => x.c && x.c.countryId === city.countryId)
    .map((x) => ({ id: x.id, km: distanceKm(city, x.c!) })).filter((x) => x.km <= BORROW_WITHIN_KM).sort((a, b) => a.km - b.km)[0];
  const borrowed = near ? pick(near.id) : undefined;
  return borrowed ? { ...borrowed, basis: `${borrowed.basis}, ${CITIES.require(near!.id).name}’s, ${Math.round(near!.km)} km away` } : undefined;
}

/** The kinds of stay a town offers, its hotel first where it has one (`content/staytypes.ts`, from 2026-10-01). */
export function stayClassesIn(cityId: string): StayClass[] {
  return [...(nightRateFor(cityId) ? ['hotel' as const] : []), ...(STAY_OPTIONS[cityId] ?? []).map((o) => o.cls)];
}

/**
 * A stay's price in the save's currency: the nights at the rate of the kind
 * of stay, a hostel's by the bed, and the town's taxes on top; paid ahead, the
 * prepaid rate's discount off the room.
 */
export function stayPrice(sim: Simulation, cityId: string, nights: number, guests = 1, cls: StayClass = 'hotel', plan: RatePlan = 'flexible'): { price: Money; basis: string } | undefined {
  if (nights <= 0) return undefined;
  const hotel = nightRateFor(cityId);
  const option = cls === 'hotel' ? undefined : STAY_OPTIONS[cityId]?.find((o) => o.cls === cls);
  if (cls === 'hotel' ? !hotel : !option) return undefined;
  const taxes = option ? STAYS[cityId]! : hotel!.rate;
  const room = (option ? option.perNight * (option.per === 'bed' ? guests : 1) : hotel!.perNight) * (plan === 'prepaid' ? 1 - PREPAID_OFF : 1);
  const local = nights * (room * (1 + taxes.onTop) + taxes.perRoomNight + taxes.perPersonNight * guests);
  const cents = Math.round(local * 100);
  const currency = option?.currency ?? hotel!.currency;
  const into = saveCurrency(sim.universe);
  const price = currency === into ? cents : exchange(cents, currency, into) ?? cents;
  const basis = option ? `${STAY_CLASS_LABEL[cls]}: ${option.basis}` : hotel!.basis;
  return { price, basis: `${basis}${plan === 'prepaid' ? `, prepaid at ${Math.round(PREPAID_OFF * 1000) / 10}% off and not refunded` : ''}. ${taxes.taxNote}` };
}

/** Whether a person has a place of their own in a town: they need no hotel there. */
export function ownPlaceIn(person: Person, cityId: string): boolean {
  return person.home?.cityId === cityId || (person.homes ?? []).some((h) => h.cityId === cityId && !h.tenancies.some((t) => t.unit === 'main' && t.status === 'let') && !h.selling);
}
