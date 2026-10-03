/**
 * SLATE — a table booked ahead (the master plan's §33k, from 2026-10-03;
 * `docs/research/world/research-life-gaps.json`, each restaurant's own page
 * or its booking platform's "need to know", read that day, two read
 * secondhand as marked).
 *
 * Each of SLATE's restaurants whose terms were read books by them:
 * - Le Bernardin: a card held, $150 a person canceled inside 48 hours.
 * - n/naka: Tock, prepaid at its $395 menu, released a month ahead, parties
 *   of two to four, kept whether or not you come.
 * - Bestia and ZINC: OpenTable, no window or fee stated (ZINC's secondhand).
 * - Frank Pepe: no reservations, first come first served.
 * - Dishoom Covent Garden: any party before 6pm, six or more after.
 * - Chapter One: its diary opens two months at a time.
 * - Canoe: three months ahead, a card held, C$20 a person at lunch and C$35
 *   at dinner canceled inside 24 hours or not come.
 * - St. Lawrence: three months ahead, C$60 a guest inside 48 hours.
 * - Contramar: OpenTable, parties over seven by email.
 * - Pujol: MX$2,565 a person inside 24 hours (2022, secondhand).
 * - Quintonil: a MX$3,000 deposit a person, prepaid, not refunded
 *   (secondhand).
 * Alo releases its tables on the first Tuesday of the month and charges its
 * tasting menu a guest inside 72 hours, but SLATE keeps no price for that
 * menu, so it isn't booked here.
 *
 * Booked, a table is kept at its hour, the party's dish each ordered then at
 * the menu's price, a deposit or prepayment counting toward it. Not come,
 * the restaurant's no-show charge is taken; canceled inside its notice, its
 * late fee; otherwise nothing.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { inSaveMoney } from './banking';
import { payFromBank, spend } from './household';
import { diningQuote, restaurantById } from './dining';
import { applyLookingAfter, occupiedAt } from './life';
import { present } from './career';

export interface TablePolicy {
  walkInOnly?: true;
  /** How far ahead tables open, days; none where it isn't stated. */
  windowDays?: number;
  minParty?: number; maxParty?: number;
  /** From this local hour, the least party (Dishoom's six after six). */
  evening?: { fromHour: number; minParty: number };
  /** Charged a person when canceled inside the notice or not come; by lunch and dinner where they differ. */
  fee?: { lunch: number; dinner: number; noticeHours: number };
  /** Paid a person at booking, kept whatever happens. */
  prepaid?: number;
  currency: string;
  confirmed: boolean;
}

export const TABLE_POLICIES: Readonly<Record<string, TablePolicy>> = {
  'le-bernardin-newyork': { fee: { lunch: 150, dinner: 150, noticeHours: 48 }, currency: 'USD', confirmed: true },
  'n-naka-la': { windowDays: 31, minParty: 2, maxParty: 4, prepaid: 395, currency: 'USD', confirmed: true },
  'bestia-la': { currency: 'USD', confirmed: true },
  'zinc-newhaven': { currency: 'USD', confirmed: false },
  'frank-pepe-pizzeria-wooster-newhaven': { walkInOnly: true, currency: 'USD', confirmed: true },
  'dishoom-covent-garden-london': { evening: { fromHour: 18, minParty: 6 }, currency: 'GBP', confirmed: true },
  'chapter-one-dublin': { windowDays: 60, currency: 'EUR', confirmed: true },
  'canoe-toronto': { windowDays: 92, fee: { lunch: 20, dinner: 35, noticeHours: 24 }, currency: 'CAD', confirmed: true },
  'st-lawrence-vancouver': { windowDays: 92, fee: { lunch: 60, dinner: 60, noticeHours: 48 }, currency: 'CAD', confirmed: true },
  'contramar-cdmx': { maxParty: 7, currency: 'MXN', confirmed: true },
  'pujol-polanco-cdmx': { fee: { lunch: 2_565, dinner: 2_565, noticeHours: 24 }, currency: 'MXN', confirmed: false },
  'quintonil-polanco-cdmx': { prepaid: 3_000, currency: 'MXN', confirmed: false },
};

export interface Reservation { id: string; restaurantId: string; at: Instant; party: number; item: string; prepaid: Money }

export const RESERVATION_KIND = 'food.table';
export const reservationsOf = (person: Person): Reservation[] => (person.reservations ??= []);
const DINNER_FROM = 17;
const localHour = (cityId: string, at: Instant) => zonedParts(at, CITIES.require(cityId).timeZone).hour;

/** What a party pays a person where they cancel late or don't come, in the save's money. */
export function lateFee(sim: Simulation, restaurantId: string, at: Instant, party: number): Money {
  const p = TABLE_POLICIES[restaurantId];
  const r = restaurantById(restaurantId);
  if (!p?.fee || !r) return 0;
  const each = localHour(r.cityId, at) >= DINNER_FROM ? p.fee.dinner : p.fee.lunch;
  return inSaveMoney(sim, Math.round(each * party * 100), p.currency);
}

export function reserveRefusal(sim: Simulation, restaurantId: string, at: Instant, party: number, item: string): string | undefined {
  const r = restaurantById(restaurantId);
  const p = TABLE_POLICIES[restaurantId];
  if (!r) return 'No such restaurant.';
  if (!p) return `${r.name}’s booking terms aren’t kept; you’re seated as you come.`;
  if (p.walkInOnly) return `${r.name} takes no reservations: it’s first come, first served.`;
  if (!Number.isInteger(party) || party < (p.minParty ?? 1)) return `A table for ${p.minParty ?? 1} at the least.`;
  if (p.maxParty !== undefined && party > p.maxParty) return `${r.name} books ${p.maxParty} at the most.`;
  if (party > 6 && !p.maxParty) return 'Six at the most, online.';
  if (at <= sim.now + MS_HOUR) return 'Choose a time at least an hour from now.';
  if (p.windowDays !== undefined && at > sim.now + p.windowDays * MS_DAY) return `${r.name}’s tables open ${p.windowDays} days ahead.`;
  if (p.evening && localHour(r.cityId, at) >= p.evening.fromHour && party < p.evening.minParty) return `After ${p.evening.fromHour}:00 ${r.name} books parties of ${p.evening.minParty} or more.`;
  if (!r.menu.some((m) => m.item === item && m.price !== null)) return 'Choose a dish SLATE knows the price of.';
  return undefined;
}

export function registerReservations(sim: Simulation): void {
  sim.onCommand<{ restaurantId: string; at: number; party: number; item: string }, { id: string; prepaid: Money }>('food.reserve', (pl, { sim: s }) => {
    const person = s.player;
    const id = String(pl?.restaurantId);
    const at = Number(pl?.at);
    const party = Number(pl?.party ?? 1);
    const item = String(pl?.item);
    const no = reserveRefusal(s, id, at, party, item);
    if (no) throw new CommandError(no);
    const r = restaurantById(id)!;
    const p = TABLE_POLICIES[id]!;
    const prepaid = p.prepaid ? inSaveMoney(s, Math.round(p.prepaid * party * 100), p.currency) : 0;
    if (prepaid > 0 && !payFromBank(s, person, prepaid, `${r.name}, paid ahead`, 'food')) throw new CommandError(`${formatMoney(prepaid, saveCurrency(s.universe))} is more than the bank can cover.`);
    const res: Reservation = { id: `table-${s.now}-${reservationsOf(person).length}`, restaurantId: id, at, party, item, prepaid };
    reservationsOf(person).push(res);
    const minutes = diningQuote(s, r, [item], 'in')?.minutes ?? 90;
    s.schedule({ at, kind: RESERVATION_KIND, label: `A Table At ${r.name}`, category: 'personal', priority: 35, requiresPlayer: true, durationMinutes: minutes, locationId: r.cityId, payload: { personId: person.id, reservationId: res.id } });
    return { id: res.id, prepaid };
  });
  sim.onCommand<{ reservationId: string }, { fee: Money }>('food.cancel_table', (pl, { sim: s }) => {
    const person = s.player;
    const res = reservationsOf(person).find((x) => x.id === pl?.reservationId);
    if (!res) throw new CommandError('No such booking.');
    const p = TABLE_POLICIES[res.restaurantId];
    const late = p?.fee && res.at - s.now < p.fee.noticeHours * MS_HOUR;
    const fee = late ? lateFee(s, res.restaurantId, res.at, res.party) : 0;
    if (fee > 0) spend(s, person, fee, `${restaurantById(res.restaurantId)!.name}, canceled late`, 'food', true);
    person.reservations = reservationsOf(person).filter((x) => x.id !== res.id);
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === RESERVATION_KIND && one.payload.reservationId === res.id) s.timeline.cancel(one.id, s.now);
    return { fee };
  });
  sim.onSchedule(RESERVATION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const res = person ? reservationsOf(person).find((x) => x.id === item.payload.reservationId) : undefined;
    if (!person || !res) return;
    person.reservations = reservationsOf(person).filter((x) => x.id !== res.id);
    const r = restaurantById(res.restaurantId)!;
    const busy = occupiedAt(s, item.at);
    const there = present(person, item.at, r.cityId) && (!busy || busy.kind === RESERVATION_KIND);
    const mine = person.id === s.universe.playerId;
    if (!there) {
      const fee = lateFee(s, res.restaurantId, res.at, res.party);
      if (fee > 0) spend(s, person, fee, `${r.name}, not come`, 'food', true);
      if (mine) s.notify({ category: 'personal', title: 'A Table Missed', body: `Your table at ${r.name} for ${formatDate(res.at, s.zone)} went unused${fee > 0 ? `: its no-show charge, ${formatMoney(fee, saveCurrency(s.universe))}` : ''}${res.prepaid > 0 ? ', and what was paid ahead is kept' : ''}.`, importance: 50, route: '/workspace/food' });
      return;
    }
    // The party's dish each, less what was paid ahead.
    const q = diningQuote(s, r, Array.from({ length: res.party }, () => res.item), 'in');
    const owed = Math.max(0, (q?.total ?? 0) - res.prepaid);
    if (owed > 0) spend(s, person, owed, `${r.name}, a table for ${res.party}`, 'food', true);
    applyLookingAfter(person, 'eat', item.at);
  });
}
