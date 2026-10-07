/**
 * SLATE — breakfast at the hotel you're staying in (from 2026-10-02; each
 * hotel's terms in `content/hotelamenities.ts`).
 *
 * Where the room comes with breakfast (La Quinta New Haven's, Days Inn
 * Vancouver's) it's had for nothing; where the hotel publishes a price a
 * person (the Omni's $25, Premier Inn's £13.99, the Hoxton's £5, the Dean's
 * €20) it's paid at that. One a morning, before noon, SLATE's reading of when
 * hotels serve it; as long as a meal at a casual restaurant takes
 * (`DINING_MINUTES`). A hotel that publishes neither isn't sold a breakfast
 * here: its price isn't known.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { dateKey, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { DINING_MINUTES } from '../content/dining';
import { HOTEL_PARKING, type RatePlan } from '../content/staytypes';
import { amenitiesOf, depositFor, hotelById, hotelParking, namedStayQuote } from './hotels';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { applyLookingAfter } from './life';

/** Breakfast is served until noon. SLATE's reading. */
export const BREAKFAST_UNTIL = 12;

/** The named hotel they're staying in now, if any. */
const stayingAt = (person: Person): string | undefined => (person.stay?.kind === 'hotel' && person.stay.cityId === person.currentLocationId && !person.stay.out ? person.stay.hotelId : undefined);

/** A named hotel's breakfast, a person's, in the save's money: nothing where it comes with the room; undefined where not known. */
export function hotelBreakfastPrice(sim: Simulation, hotelId: string | undefined): Money | undefined {
  const b = amenitiesOf(hotelId)?.breakfast;
  if (!b) return undefined;
  if (b.included) return 0;
  return b.price !== null && b.currency ? inSaveMoney(sim, Math.round(b.price * 100), b.currency) : undefined;
}

/** A breakfast's price where they're staying, in the save's money: nothing where it comes with the room; undefined where not known. */
export const breakfastPrice = (sim: Simulation, person: Person): Money | undefined => hotelBreakfastPrice(sim, stayingAt(person));

/**
 * A named hotel's stay, its whole cost set out (the master plan's §48c, from
 * 2026-10-06; until then hotels were compared on the room, its tax and its
 * fee alone, `namedStayQuote`): the room with its tax and fee, so many of
 * them; its own parking for a car brought, or the town's where it names none,
 * as booking adds it; your breakfast each morning at its published price,
 * nothing where it comes with the room, not counted where it isn't
 * published; and the deposit it holds at arrival, a room's each, which comes
 * back at check-out and so isn't in what's paid.
 */
export interface StayTotal { room: Money; parking: Money; breakfast: Money | undefined; paid: Money; deposit: Money; estimated: boolean }

export function stayTotal(sim: Simulation, hotelId: string, roomName: string, plan: RatePlan, from: Instant, nights: number, opts: { rooms?: number; car?: boolean } = {}): StayTotal | undefined {
  const q = namedStayQuote(sim, hotelId, roomName, plan, from, nights);
  if (!q) return undefined;
  const rooms = Math.max(1, opts.rooms ?? 1);
  const town = HOTEL_PARKING[hotelById(hotelId)!.cityId];
  const parking = !opts.car ? 0 : hotelParking(sim, hotelId, nights)?.price ?? (town ? inSaveMoney(sim, Math.round(town.perNight * nights * 100), town.currency) : 0);
  const morning = hotelBreakfastPrice(sim, hotelId);
  const breakfast = morning === undefined ? undefined : morning * nights;
  const room = q.price * rooms;
  return { room, parking, breakfast, paid: room + parking + (breakfast ?? 0), deposit: depositFor(sim, hotelId, nights) * rooms, estimated: q.estimated };
}

export function breakfastRefusal(sim: Simulation, person: Person): string | undefined {
  const id = stayingAt(person);
  if (!id) return 'You aren’t staying at a hotel SLATE knows by name.';
  const h = hotelById(id)!;
  if (breakfastPrice(sim, person) === undefined) return `${h.name} doesn’t publish what its breakfast costs.`;
  const zone = CITIES.require(h.cityId).timeZone;
  if (zonedParts(sim.now, zone).hour >= BREAKFAST_UNTIL) return 'Breakfast is over for the day.';
  if (person.stay?.breakfastOn === dateKey(sim.now, zone)) return 'You’ve had breakfast today.';
  return undefined;
}

export function registerHotelBreakfast(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money }>('hotel.breakfast', (_p, { sim: s }) => {
    const person = s.player;
    const no = breakfastRefusal(s, person);
    if (no) throw new CommandError(no);
    const h = hotelById(stayingAt(person)!)!;
    const paid = breakfastPrice(s, person)!;
    if (paid > 0 && !spend(s, person, paid, `${h.name}, breakfast`, 'food')) throw new CommandError('The payment didn’t go through.');
    person.stay!.breakfastOn = dateKey(s.now, CITIES.require(h.cityId).timeZone);
    s.advanceTo(s.now + DINING_MINUTES.casual * 60_000);
    applyLookingAfter(person, 'eat', s.now);
    return { paid };
  });
}
