/**
 * SLATE — a later check-out, bought from a hotel that publishes its price
 * (Stage 6 of `docs/BACKLOG.md`, from 2026-10-02; the terms and their
 * sources in `content/latecheckout.ts`).
 *
 * On the morning of check-out, once there, the stay's last check-out moves to
 * the hotel's later hour at its price: a flat fee, a share of the night's own
 * rate, or so much an hour past the usual hour. The Hoxton's Flexy Time makes
 * it free when the stay was booked at least 72 hours before arriving.
 *
 * **What it changes.** Once checked out, until leaving town that day, the
 * room is gone: no shower and no bath there (`roomGone`). Until 2026-10-02 a
 * guest checked out and on a flight that evening kept the room's shower all
 * afternoon.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_HOUR, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { LATE_CHECKOUT } from '../content/latecheckout';
import { payFromBank } from './household';
import { hotelById, namedStayQuote } from './hotels';
import { CHECKOUT_KIND, journeysOf } from './journey';

/** The stay's pending check-out, if it has one. */
function pendingCheckOut(sim: Simulation, journeyId: string) {
  return sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === CHECKOUT_KIND && i.payload.journeyId === journeyId);
}

/** What checking out later costs and until when, or why it can't be had. */
export function lateQuote(sim: Simulation, person: Person, journeyId: string): { until: Instant; price: Money; basis: string } | string {
  const j = journeysOf(person).find((x) => x.id === journeyId);
  const named = j?.hotel?.named;
  if (!j || !named || j.status !== 'arrived') return 'That isn’t a hotel you’re staying in.';
  const terms = LATE_CHECKOUT[named.hotelId];
  const hotel = hotelById(named.hotelId)!;
  if (!terms) return `${hotel.name} publishes no price for a later check-out; ask at the desk.`;
  if (person.currentLocationId !== j.toCity) return 'A later check-out is asked for there.';
  if (j.hotel!.lateUntil) return 'You’re checking out late already.';
  const item = pendingCheckOut(sim, j.id);
  const zone = CITIES.require(j.toCity).timeZone;
  if (!item) return 'You’ve checked out.';
  const day = zonedParts(item.at, zone);
  const today = zonedParts(sim.now, zone);
  if (day.year !== today.year || day.month !== today.month || day.day !== today.day) return 'A later check-out is asked for on the morning you leave.';
  const until = instantFromZoned({ year: day.year, month: day.month, day: day.day, hour: terms.until, minute: 0 }, zone);
  const into = saveCurrency(sim.universe);
  const inSave = (units: number, currency: string): Money => { const c = Math.round(units * 100); return currency === into ? c : exchange(c, currency, into) ?? c; };
  if (terms.freeBookedAhead && j.arriveAt - j.bookedAt >= terms.freeBookedAhead * MS_HOUR) return { until, price: 0, basis: `${hotel.name}: free, booked direct ${terms.freeBookedAhead} hours ahead.` };
  const fee = terms.fee;
  if (fee.kind === 'flat') return { until, price: inSave(fee.amount, fee.currency), basis: `${hotel.name}: ${fee.amount} ${fee.currency}.` };
  if (fee.kind === 'hourly') {
    const hours = Math.ceil((until - item.at) / MS_HOUR);
    return { until, price: inSave(fee.amount * hours, fee.currency), basis: `${hotel.name}: ${fee.amount} ${fee.currency} an hour, ${hours} hours.` };
  }
  const night = namedStayQuote(sim, named.hotelId, named.room, j.hotel!.plan ?? 'flexible', item.at - 24 * MS_HOUR, 1);
  if (!night) return `${hotel.name} has no rate for the night to take half of.`;
  return { until, price: Math.round(night.price * fee.share), basis: `${hotel.name}: ${Math.round(fee.share * 100)}% of the night’s rate.` };
}

/** Checks out later, paid; the check-out moved to the hotel's later hour. */
export function checkOutLate(sim: Simulation, person: Person, journeyId: string): { until: Instant; price: Money } {
  const q = lateQuote(sim, person, journeyId);
  if (typeof q === 'string') throw new CommandError(q);
  const j = journeysOf(person).find((x) => x.id === journeyId)!;
  if (q.price > 0 && !payFromBank(sim, person, q.price, `${hotelById(j.hotel!.named!.hotelId)!.name}, a late check-out`, 'travel')) throw new CommandError('The payment didn’t go through.');
  const item = pendingCheckOut(sim, journeyId)!;
  sim.timeline.cancel(item.id, sim.now);
  sim.schedule({ at: q.until, kind: CHECKOUT_KIND, label: 'Hotel Check-Out', category: 'personal', priority: 26, payload: item.payload });
  j.hotel!.lateUntil = q.until;
  return { until: q.until, price: q.price };
}

/** Checked out of a hotel or a let and still in its town, the day they leave: the room is gone. */
export const roomGone = (person: Person): boolean => person.stay?.out === true && person.stay.cityId === person.currentLocationId;

export function registerLateCheckOut(sim: Simulation): void {
  sim.onCommand<{ journeyId: string }, { until: Instant; price: Money }>('travel.late_checkout', (p, { sim: s }) => {
    const r = checkOutLate(s, s.player, String(p?.journeyId));
    s.notify({ category: 'personal', title: 'A Late Check-Out', body: `The room is yours until later today${r.price ? `, ${formatMoney(r.price, saveCurrency(s.universe))}` : ''}.`, importance: 40 });
    return r;
  });
}
