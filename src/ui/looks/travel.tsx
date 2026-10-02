/**
 * SLATE — a journey booked, and a hotel at the far end of one.
 *
 * Two kinds. A `journey` is one way of a trip as `systems/journey.ts` keeps
 * it: its legs, each at the local time where it happens, what was paid, how
 * it stands, the hotel or let at the far end and the travel insurance on it.
 * A round trip is two journeys sharing a trip, and each opens onto the other.
 *
 * A `hotel` is one of the real hotels in `content/hotels.ts`, read from its
 * own terms: the hours it checks in and out, the fee it adds a night, the
 * deposit it holds, the parking it names and, where it publishes one, the
 * price of a later check-out. A night’s rate is its own booking engine’s
 * through `namedStayQuote`, taxes and fee in, and says so when it is the mean
 * of the nights that were read rather than the night itself.
 *
 * The floors are the two towns, the day it leaves and its calendar entry.
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate, formatDateTime } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { HOTELS, type Hotel } from '@/engine/content/hotels';
import { LATE_CHECKOUT } from '@/engine/content/latecheckout';
import { STAY_CLASS_LABEL } from '@/engine/content/staytypes';
import { TRAVEL_POLICY } from '@/engine/content/travelinsurance';
import { inSaveMoney } from '@/engine/systems/banking';
import { depositFor, hotelById, hotelParking, hotelsIn, namedStayQuote } from '@/engine/systems/hotels';
import { LEAVE_KIND, type Journey, type JourneyLeg } from '@/engine/systems/journey';
import { airportByCode } from '@/engine/systems/airports';
import { railRouteById } from '@/engine/systems/rail';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at } from './subject';
import { spokenList, nameable } from './words';

const owner = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];
const journeysHeld = (person: Person): Journey[] => person.journeys ?? [];



/** A town’s name, or an airport’s, or the code where neither is known. */
const placeName = (id: string): string => CITIES.get(id)?.name ?? airportByCode(id)?.name ?? id;

const STATUS_WORDS: Readonly<Record<Journey['status'], string>> = {
  booked: 'booked and not yet left',
  underway: 'underway now',
  arrived: 'done: you got there',
  missed: 'missed',
  canceled: 'canceled',
};

const LEG_WORDS: Readonly<Record<JourneyLeg['mode'], string>> = {
  ground: 'a taxi', 'check-in': 'check-in', flight: 'a flight', fly: 'a flight of your own', train: 'a train',
  bus: 'a coach', ferry: 'a ferry', drive: 'a drive', arrival: 'off the aircraft and through',
};

/** How it goes, said plainly. */
function byWords(j: Journey): string {
  if (!j.by) return 'by air';
  if (j.by.startsWith('car:')) return 'in your own car';
  if (j.by === 'rental') return 'in a rental car';
  if (j.by === 'jet') return 'by chartered jet';
  if (j.by === 'chauffeur') return 'by car and driver';
  if (j.by === 'fly') return 'in a plane of your own';
  return `on ${railRouteById(j.by)?.service ?? 'the train'}`;
}

const zoneOf = (id: string, fallback: string): string => CITIES.get(id)?.timeZone ?? fallback;

/** The hour on a clock, from a 24-hour figure: 19 is 7 PM. */
const clockHour = (h: number): string => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

// ---------------------------------------------------------------------------
// A journey
// ---------------------------------------------------------------------------

interface Trip { j: Journey; person: Person; partner: Journey | undefined }

defineLook<Trip>('journey', {
  gone: 'That journey is off the books, and no seat is waiting for you at the airport.',
  resolve: (sim, id) => {
    const person = owner(sim);
    if (!person) return undefined;
    const j = journeysHeld(person).find((x) => x.id === id);
    if (!j) return undefined;
    const partner = j.tripId ? journeysHeld(person).find((x) => x.tripId === j.tripId && x.id !== j.id) : undefined;
    return { j, person, partner };
  },
  seeds: (sim) => {
    const person = owner(sim);
    return person ? journeysHeld(person).map((j) => j.id) : [];
  },
  look: ({ j, person, partner }, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: number) => formatMoney(c, cur);
    const from = placeName(j.fromCity);
    const to = placeName(j.toCity);
    const fromZone = zoneOf(j.fromCity, sim.zone);
    const toZone = zoneOf(j.toCity, sim.zone);
    const arrives = j.arriveAt + (j.lateMinutes ?? 0) * 60_000;
    const ways: Way[] = [];
    const add = (way: Way) => { if (lookExists(sim, way.to)) ways.push(way); };

    const entry = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === LEAVE_KIND && i.payload.journeyId === j.id);
    if (entry) add({ to: at('entry', entry.id), label: entry.label, detail: 'Its place on your calendar, and what else is on that day' });
    add({ to: at('day', dateKey(j.leaveAt, sim.homeZone)), label: formatDate(j.leaveAt, fromZone), detail: 'The day it leaves, and everything else on it' });
    add({ to: at('place', j.toCity), label: to, detail: 'Where it takes you, and what living there costs' });
    add({ to: at('place', j.fromCity), label: from, detail: 'Where it leaves from' });
    const named = j.hotel?.named;
    if (named) {
      const h = hotelById(named.hotelId);
      if (h) add({ to: at('hotel', h.id), label: h.name, detail: `Where you sleep there, in the ${named.room.toLowerCase()}, and its terms` });
    }
    if (partner) {
      add({
        to: at('journey', partner.id),
        label: partner.leaveAt > j.leaveAt ? 'The Way Home' : 'The Way Out',
        detail: `${placeName(partner.fromCity)} to ${placeName(partner.toCity)}, ${formatDate(partner.leaveAt, zoneOf(partner.fromCity, sim.zone))}`,
      });
    }
    const pays = person.primaryAccountId ? sim.ledger.tryAccount(person.primaryAccountId) : undefined;
    if (pays && j.paidBy !== 'production') add({ to: at('account', pays.id), label: pays.name, detail: 'The account it was paid from, and anything refunded goes back to' });

    const legs = j.legs.map((l) => LEG_WORDS[l.mode]);
    const stay = j.hotel
      ? `${j.hotel.nights} ${j.hotel.nights === 1 ? 'night' : 'nights'} ${named ? `at ${hotelById(named.hotelId)?.name ?? 'a hotel'}` : `in ${(STAY_CLASS_LABEL[j.hotel.cls ?? 'hotel'] ?? 'a hotel').toLowerCase()}`}, ${money(j.hotel.price)}${j.hotel.plan === 'prepaid' ? ' paid ahead and not refunded' : ''}, checking out on ${formatDateTime(j.hotel.lateUntil ?? j.hotel.checkOutAt, toZone)}`
      : j.let
        ? `${j.let.nights} ${j.let.nights === 1 ? 'night' : 'nights'} in a holiday let, ${money(j.let.price)}, ${money(j.let.fee)} of it the service fee`
        : undefined;
    const policy = j.insured ? TRAVEL_POLICY[j.insured.market] : undefined;
    const cover = j.insured && policy
      ? `It’s insured with ${policy.insurer} for ${money(j.insured.premium)}: medical to ${formatMoney(Math.round(policy.medical * 100), policy.currency, { cents: false })}${policy.cancellation ? `, cancellation to ${formatMoney(Math.round(policy.cancellation * 100), policy.currency, { cents: false })}` : ', and no cancellation cover'}${policy.excess ? `, with a ${formatMoney(Math.round(policy.excess * 100), policy.currency, { cents: false })} excess` : ''}.`
      : j.status === 'booked' ? 'It isn’t insured.' : '';

    const summary = j.status === 'booked'
      ? `You leave ${from} on ${formatDateTime(j.leaveAt, fromZone)} and reach ${to} on ${formatDateTime(arrives, toZone)}, ${byWords(j)}.`
      : j.status === 'underway'
        ? `You’re on the way to ${to} now, ${byWords(j)}, due there on ${formatDateTime(arrives, toZone)}.`
        : j.status === 'arrived'
          ? `You reached ${to} on ${formatDateTime(arrives, toZone)}${j.lateMinutes ? `, ${j.lateMinutes} minutes late` : ''}.`
          : `It was ${STATUS_WORDS[j.status]}${j.why ? `: ${j.why.replace(/\.$/, '')}` : ''}.`;

    return {
      name: `${nameable(from) ? from : 'Here'} To ${nameable(to) ? to : 'There'}`,
      kind: partner ? (partner.leaveAt > j.leaveAt ? 'The Way Out' : 'The Way Home') : 'A Journey',
      parent: at('person', person.id),
      summary,
      body: (
        <>
          <p className="small">
            It goes by {spokenList(legs.filter((w, i) => legs.indexOf(w) === i))}, and it’s {STATUS_WORDS[j.status]}{j.rebooked ? ', put on a later flight when the first was canceled' : ''}.
            {stay ? ` At the far end, ${stay}.` : ''} {cover}
          </p>
          <div className="col gap-1 small">
            {j.legs.map((l, i) => (
              <div key={i} className="row-between">
                <span>{`${placeName(l.from)} to ${placeName(l.to)}`}</span>
                <span className="mono dim">{`${formatDateTime(l.departAt, i === 0 ? fromZone : zoneOf(l.from, toZone))}${l.fare > 0 ? `, ${money(l.fare)}` : ''}`}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-3">
            <Stat label="Paid" value={<span className="mono">{money(j.total)}</span>} note={j.paidBy === 'production' ? 'The production paid the fares' : 'Fares and the stay, together'} />
            <Stat label="Legs" value={String(j.legs.length)} note={`${j.bags} checked ${j.bags === 1 ? 'bag' : 'bags'}`} />
            <Stat label="Nights" value={String(j.hotel?.nights ?? j.let?.nights ?? 0)} note={j.hotel ? 'In a hotel' : j.let ? 'In a holiday let' : 'None booked there'} />
          </div>
        </>
      ),
      ways,
      provenance: 'Every time is the local time where it happens, and every fare is the figure its leg was booked at.',
    };
  },
});

// ---------------------------------------------------------------------------
// A hotel
// ---------------------------------------------------------------------------

defineLook<Hotel>('hotel', {
  gone: 'There’s no hotel by that name in any town SLATE keeps.',
  resolve: (_sim, id) => hotelById(id),
  seeds: (sim) => {
    const person = owner(sim);
    const towns = person ? [person.currentLocationId, person.home?.cityId ?? ''] : [];
    const local = towns.flatMap((t) => hotelsIn(t).map((h) => h.id));
    const stayed = person ? journeysHeld(person).map((j) => j.hotel?.named?.hotelId).filter((id): id is string => !!id) : [];
    const ids = [...new Set([...local, ...stayed])];
    return ids.length ? ids : HOTELS.slice(0, 1).map((h) => h.id);
  },
  look: (h, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: number) => formatMoney(c, cur, { cents: false });
    const town = placeName(h.cityId);
    const ways: Way[] = [];
    const add = (way: Way) => { if (lookExists(sim, way.to)) ways.push(way); };
    add({ to: at('place', h.cityId), label: town, detail: 'The town it stands in, and what living there costs' });
    const person = owner(sim);
    for (const j of person ? journeysHeld(person) : []) {
      if (j.hotel?.named?.hotelId !== h.id) continue;
      add({ to: at('journey', j.id), label: `${placeName(j.fromCity)} To ${town}`, detail: `A journey with ${j.hotel.nights} ${j.hotel.nights === 1 ? 'night' : 'nights'} here, ${formatDate(j.arriveAt, zoneOf(j.toCity, sim.zone))}` });
    }

    // Tonight’s rate in every room it sells, cheapest first, on its refundable rate or, failing that, paid ahead.
    const nights = h.rooms
      .map((r) => ({ room: r, q: namedStayQuote(sim, h.id, r.name, 'flexible', sim.now, 1) ?? namedStayQuote(sim, h.id, r.name, 'prepaid', sim.now, 1) }))
      .filter((x): x is { room: typeof x.room; q: NonNullable<typeof x.q> } => x.q !== undefined)
      .sort((a, b) => a.q.price - b.q.price);
    const cheapest = nights[0];
    const deposit = depositFor(sim, h.id, 1);
    const parking = hotelParking(sim, h.id, 1);
    const late = LATE_CHECKOUT[h.id];
    const fee = h.fee ? inSaveMoney(sim, Math.round(h.fee.amount * 100), h.fee.currency) : 0;
    const lateWords = !late
      ? 'It publishes no price for a later check-out; that’s asked at the desk.'
      : late.fee.kind === 'flat'
        ? `A later check-out, until ${clockHour(late.until)}, is ${money(inSaveMoney(sim, Math.round(late.fee.amount * 100), late.fee.currency))}.`
        : late.fee.kind === 'hourly'
          ? `A later check-out, until ${clockHour(late.until)}, is ${money(inSaveMoney(sim, Math.round(late.fee.amount * 100), late.fee.currency))} an hour${late.freeBookedAhead ? `, free when booked direct ${late.freeBookedAhead} hours ahead` : ''}.`
          : `A later check-out, until ${clockHour(late.until)}, is ${Math.round(late.fee.share * 100)}% of the night’s rate.`;

    return {
      name: nameable(h.name) ? h.name : `A Hotel In ${town}`,
      kind: 'Somewhere To Stay',
      parent: lookExists(sim, at('place', h.cityId)) ? at('place', h.cityId) : undefined,
      summary: cheapest
        ? `You’d pay from ${money(cheapest.q.price)} a night here, taxes and fees in, for the ${cheapest.room.name.toLowerCase()}.`
        : `It sells no room SLATE has a rate for, so you can’t book a night here yet.`,
      body: (
        <>
          <p className="small">
            {h.address ? `It’s at ${h.address}, in ${town}` : `It’s in ${town}`}{h.brand && !h.name.includes(h.brand) ? `, run by ${h.brand}. ` : '. '}
            {h.checkIn || h.checkOut ? `Check-in is from ${h.checkIn ?? 'the usual hour'} and check-out by ${h.checkOut ?? 'eleven'}. ` : ''}
            {h.minAge !== null ? `Guests must be ${h.minAge} or older. ` : ''}
            {h.fee ? `It adds a ${h.fee.name.toLowerCase()} of ${money(fee)} a night${h.fee.taxIncluded ? '' : ', taxed'}. ` : ''}
            {h.deposit ? `It holds a deposit of ${money(deposit)} ${h.deposit.per === 'night' ? 'a night' : 'for the stay'} from arrival, returned at check-out. ` : 'It holds no deposit. '}
            {parking ? `${parking.basis.replace(/, [\d.]+ [A-Z]{3} a night$/, '')}, ${money(parking.price)} a night. ` : 'It names no parking. '}
            {lateWords}
          </p>
          {nights.length > 1 && (
            <div className="col gap-1 small">
              {nights.map(({ room, q }) => (
                <div key={room.name} className="row-between">
                  <span>{room.name}{room.bed ? `, ${room.bed}` : ''}</span>
                  <span className="mono dim">{`${money(q.price)}${q.estimated ? ', an estimate' : ''}`}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-3">
            <Stat label="A Night From" value={<span className="mono">{cheapest ? money(cheapest.q.price) : 'No Rate'}</span>} note={cheapest?.q.estimated ? 'The mean of the nights read, an estimate' : 'Tonight, at its own rate'} />
            <Stat label="Deposit" value={<span className="mono">{money(deposit)}</span>} note={h.deposit ? (h.deposit.per === 'night' ? 'A night, held' : 'The stay, held') : 'None held'} />
            <Stat label="Parking" value={<span className="mono">{parking ? money(parking.price) : 'None'}</span>} note={parking ? 'A night' : 'None named'} />
          </div>
        </>
      ),
      ways,
      provenance: 'Its rates are its own booking engine’s, read on the nights given, and its terms its own.',
    };
  },
});
