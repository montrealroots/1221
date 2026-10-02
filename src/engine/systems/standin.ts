/**
 * SLATE — a car to drive while yours is in the shop (Stage 8 of
 * `docs/BACKLOG.md`, from 2026-10-01; `research-vehicle-shops.json`).
 *
 * **A dealer's loaner**, where the dealer publishes one (`loaner` in
 * `content/carshops.ts`): Toyota of Manhattan's and Toronto Honda's free,
 * A-1 Toyota's at $34.95 a day, Jemca Toyota's courtesy car free, SLATE's
 * reading of a courtesy car offered as an option. It's driven on your own
 * cover, as a loaner is, so a crash in it isn't the rental desk's excess.
 *
 * **A rental** otherwise, from the town's airport desk on its own terms:
 * Kayak's small-car day, its taxes, its minimum age and license years, its
 * deposit held until it goes back (`rentalQuote` in `systems/rentals.ts`).
 *
 * Either is had in the shop's town while the car is in, and goes back the
 * hour the car is ready. It drives Travel's By Rental like any rental, and
 * errands at AAA's average fuel a mile (`systems/trips.ts`); the car itself
 * gains no kilometers.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { CAR_SHOPS, type CarShop } from '../content/carshops';
import { mayDrive } from './documents';
import { payFromBank, inTheBank } from './household';
import { RENTAL_RETURN_KIND, holdDeposit, rentalDays, rentalQuote, rentalsOf, type Rental } from './rentals';
import type { OwnedVehicle } from './vehicles';

const shopOf = (v: OwnedVehicle): CarShop | undefined => CAR_SHOPS.find((s) => s.id === v.inShop?.shopId);
const shopTown = (v: OwnedVehicle): string => shopOf(v)?.cityId ?? v.at ?? v.cityId;

/** The car standing in for one in the shop, while it is. */
export function standInFor(person: Person, v: OwnedVehicle): Rental | undefined {
  // Out from booking until it goes back, the hour the car is ready.
  return rentalsOf(person).find((r) => r.standIn?.vehicleId === v.id && r.status === 'out');
}

export interface StandInQuote { loaner?: string; days: number; total: Money; deposit: Money; what: string }

/** What a stand-in costs now, and whose, or why there isn't one. */
export function standInQuote(sim: Simulation, person: Person, v: OwnedVehicle, at: Instant): StandInQuote | string {
  if (!v.inShop || v.inShop.until <= at) return 'It isn’t in a shop.';
  const town = shopTown(v);
  if (person.currentLocationId !== town) return `You’re not in ${CITIES.require(town).name}.`;
  if (standInFor(person, v)) return 'It has a stand-in already.';
  const shop = shopOf(v);
  const days = rentalDays(at, v.inShop.until);
  if (shop?.loaner) {
    const may = mayDrive(person, town, at);
    if (!may.ok) return may.why ?? 'You may not drive there.';
    const cents = Math.round(shop.loaner.perDayUsd * days * 100);
    const cur = saveCurrency(sim.universe);
    return { loaner: shop.id, days, total: cur === 'USD' ? cents : exchange(cents, 'USD', cur) ?? cents, deposit: 0, what: `${shop.name}’s loaner` };
  }
  const q = rentalQuote(sim, person, town, at, v.inShop.until, false);
  if (typeof q === 'string') return q;
  return { days: q.days, total: q.total, deposit: q.deposit, what: `${q.company}, ${q.airport}` };
}

export function registerStandIn(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined): void {
  sim.onCommand<{ vehicleId: string }, { rentalId: string; paid: Money; loaner: boolean }>('vehicle.stand_in', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you own.');
    const q = standInQuote(s, person, v, s.now);
    if (typeof q === 'string') throw new CommandError(q);
    // Its deposit too, or nothing: until 2026-10-02 the car went out with no deposit held.
    if (q.deposit > 0 && inTheBank(s, person) < q.total + q.deposit) throw new CommandError(`With its deposit it’s ${formatMoney(q.total + q.deposit, saveCurrency(s.universe))}, more than the bank holds.`);
    if (q.total > 0 && !payFromBank(s, person, q.total, `${q.what}, ${q.days} ${q.days === 1 ? 'day' : 'days'}, while the car is in`, 'vehicle')) throw new CommandError(`${formatMoney(q.total, saveCurrency(s.universe))} is more than the bank can cover.`);
    const town = shopTown(v);
    const r: Rental = { id: s.nextId('journey'), journeyId: '', returnJourneyId: '', cityId: town, pickupAt: s.now, returnAt: v.inShop!.until, days: q.days, paid: q.total, status: 'out', at: town, standIn: { vehicleId: v.id, ...(q.loaner ? { loaner: q.loaner } : {}) } };
    rentalsOf(person).push(r);
    if (q.deposit > 0) holdDeposit(s, person, r, q.deposit);
    s.schedule({ at: r.returnAt, kind: RENTAL_RETURN_KIND, label: 'The Stand-in Goes Back', category: 'personal', priority: 27, payload: { personId: person.id, rentalId: r.id } });
    return { rentalId: r.id, paid: q.total, loaner: Boolean(q.loaner) };
  });
}
