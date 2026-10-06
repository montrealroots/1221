/**
 * SLATE — a hotel booked on its own, where they are (the master plan's §48g,
 * from 2026-10-06). Until then a stay was booked only as part of a journey to
 * another town, so a night in a hotel in their own town, or a stay made where
 * they already are, couldn't be had.
 *
 * Booked for some nights from tonight, of a kind (a hotel, a budget hotel, a
 * motel, an extended stay, a hostel) or a named hotel's room, at the same
 * prices a journey's stay is (`stayPrice`, `namedStayQuote`), paid when it's
 * booked. While it lasts they stay there: in their own town they aren't at
 * home (`atHome` reads `local`), so they sleep, wash and eat as a hotel lets
 * them (`stayPlace`). It ends at the check-out hour after the last night, the
 * hotel's own or eleven, or when they check out early; the nights booked are
 * paid either way, SLATE's reading of a hotel holding a room it has given up
 * selling, no rule for shortening a stay being read.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import type { Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { STAY_CLASS_LABEL, type RatePlan, type StayClass } from '../content/staytypes';
import { stayPrice } from './stays';
import { checkOutHourOf, hotelById, namedStayQuote } from './hotels';
import { checkOutAfter, residentOf } from './journey';
import { spend } from './household';

export const LOCAL_STAY_END_KIND = 'travel.local_stay_end';
/** The most nights booked at once: a month. */
export const LOCAL_STAY_MAX_NIGHTS = 30;

export interface LocalStayChoice { nights: number; cls?: StayClass; hotelId?: string; room?: string; plan?: RatePlan }

/** The price of a stay here, from now, and what it rests on; or why it can't be booked. */
export function localStayQuote(sim: Simulation, person: Person, c: LocalStayChoice): { price: Money; basis: string; checkOutAt: Instant } | string {
  const city = person.currentLocationId;
  if (!CITIES.get(city)) return 'There’s nowhere here to stay.';
  if (!Number.isInteger(c.nights) || c.nights < 1 || c.nights > LOCAL_STAY_MAX_NIGHTS) return `A stay is a whole number of nights, from one to ${LOCAL_STAY_MAX_NIGHTS}.`;
  if (person.stay && person.stay.cityId === city) return 'You’re staying somewhere here already.';
  if (person.trip) return 'Not in the middle of an errand.';
  const plan = c.plan === 'prepaid' ? 'prepaid' : 'flexible';
  if (c.hotelId) {
    const h = hotelById(c.hotelId);
    if (!h || h.cityId !== city) return 'That hotel isn’t here.';
    const q = namedStayQuote(sim, c.hotelId, String(c.room ?? h.rooms[0]?.name ?? ''), plan, sim.now, c.nights);
    if (!q) return 'That room isn’t offered.';
    return { price: q.price, basis: q.basis, checkOutAt: checkOutAfter(city, sim.now, c.nights, checkOutHourOf(c.hotelId)) };
  }
  const cls = c.cls ?? 'hotel';
  if (cls === 'street' || cls === 'campground') return `${STAY_CLASS_LABEL[cls]} isn’t booked as a room.`;
  const q = stayPrice(sim, city, c.nights, 1, cls, plan, residentOf(person, city));
  if (!q) return `SLATE keeps no ${STAY_CLASS_LABEL[cls].toLowerCase()} prices here.`;
  return { price: q.price, basis: q.basis, checkOutAt: checkOutAfter(city, sim.now, c.nights) };
}

/** Whether they're in a hotel booked on its own where they are now. */
export const inLocalStay = (person: Person): boolean => Boolean(person.stay?.local && person.stay.cityId === person.currentLocationId);

function end(sim: Simulation, person: Person): void {
  delete person.stay;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === LOCAL_STAY_END_KIND && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
}

export function registerLocalStays(sim: Simulation): void {
  sim.onCommand<LocalStayChoice, { paid: Money; checkOutAt: Instant }>('travel.stay_here', (p, { sim: s }) => {
    const person = s.player;
    const choice: LocalStayChoice = { nights: Number(p?.nights), ...(p?.cls ? { cls: p.cls } : {}), ...(p?.hotelId ? { hotelId: String(p.hotelId) } : {}), ...(p?.room ? { room: String(p.room) } : {}), ...(p?.plan ? { plan: p.plan } : {}) };
    const q = localStayQuote(s, person, choice);
    if (typeof q === 'string') throw new CommandError(q);
    const where = choice.hotelId ? hotelById(choice.hotelId)!.name : `${STAY_CLASS_LABEL[choice.cls ?? 'hotel']} in ${CITIES.get(person.currentLocationId)?.name ?? 'town'}`;
    if (!spend(s, person, q.price, `${where}, ${choice.nights} ${choice.nights === 1 ? 'night' : 'nights'}`, 'travel')) throw new CommandError(`It comes to ${formatMoney(q.price, saveCurrency(s.universe))}, more than you can pay.`);
    person.stay = { kind: 'hotel', cityId: person.currentLocationId, local: true, until: q.checkOutAt, ...(choice.hotelId ? { hotelId: choice.hotelId } : {}) };
    s.schedule({ at: q.checkOutAt, kind: LOCAL_STAY_END_KIND, label: `Check Out: ${where}`, category: 'travel', priority: 30, payload: { personId: person.id } });
    return { paid: q.price, checkOutAt: q.checkOutAt };
  });
  sim.onCommand<Record<string, never>, { out: true }>('travel.check_out', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.stay?.local) throw new CommandError('You aren’t in a hotel booked here.');
    end(s, person);
    return { out: true };
  });
  sim.onSchedule(LOCAL_STAY_END_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person?.stay?.local) delete person.stay;
  });
}
