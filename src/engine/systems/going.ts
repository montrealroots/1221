/**
 * SLATE — a night out in town.
 *
 * A real venue, in the city it really stands in, on a night the season really
 * runs. What is on is SLATE's own — a made-up act, a made-up fixture, a play
 * that exists nowhere else — because there is no listings feed and no honest
 * way to know what is really on anywhere this week. You buy a seat in a band,
 * you turn up, and the night is what it was against what you like plus the
 * room around you.
 *
 * Nothing here names a real club, attaches a score to anyone real, or claims
 * an act is touring. The note on the page says so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { GoingTicket, Id, Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays, formatDate, formatTime, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { CITIES } from '../content/geography';
import { placesIn, type Place, type PlaceKind } from '../content/places';
import { costOfLiving } from '../content/tax';
import { zoneOf } from './cinema';
import {
  BAND_LABEL, BAND_SHARE, BASE_PRICE, type Band, CARD_COMBINATIONS, DOORS_OPEN_MINUTES,
  DOORS_SHUT_MINUTES, GOING_LABEL, type GoingKind, REFUNDABLE_UNTIL_MINUTES, RUNS_MINUTES,
  SPORTS, type Sport, VENUE_SEATS, actName, exhibitionName, operaName, playName, programName,
  sportsIn,
} from '../content/going';

// ---------------------------------------------------------------------------
// What is on
// ---------------------------------------------------------------------------

/** One thing on at one venue this week. SLATE's own, always. */
export interface Event {
  id: string;
  placeId: string;
  kind: GoingKind;
  card: string;
  at: Instant;
  /** How much anybody is talking about it, 0-100. Decides how full it gets. */
  buzz: number;
  /** What it actually is, 0-100. Decides what you make of it. */
  quality: number;
}

/** Which of the going-out kinds a venue can put on. */
const KIND_BY_VENUE: Readonly<Record<string, readonly GoingKind[]>> = {
  stadium: ['match', 'concert'],
  arena: ['match', 'concert'],
  concert_hall: ['classical', 'opera', 'concert'],
  theatre: ['play'],
  museum: ['exhibition'],
  club: ['club_night'],
};

const GOING_VENUE_KINDS: readonly PlaceKind[] = ['stadium', 'arena', 'concert_hall', 'theatre', 'museum', 'club'];

const WEEK_CACHE = new Map<string, Event[]>();
const CITY_WEEK_CACHE = new Map<string, Event[]>();

/** Monday of the week an instant falls in, in the city's own zone. */
function weekStart(sim: Simulation, at: Instant, cityId: string): Instant {
  const zone = zoneOf(sim, cityId);
  const parts = zonedParts(at, zone);
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const back = (weekday + 6) % 7;
  const midnight = at - ((parts.hour * 60 + parts.minute) * MS_MINUTE + parts.second * 1000);
  return addDays(midnight, -back, zone);
}

/** The card for one kind of night. */
function cardFor(sim: Simulation, kind: GoingKind, cityId: string, salt: string, inSeason: readonly Sport[] = []): string {
  const rng = sim.rng('going.card', cityId, salt);
  switch (kind) {
    case 'match': {
      // A fixture in a sport that is in season here this month, named without
      // ever naming a club. Drawing from every sport the country follows put
      // a test match at Wembley in March.
      const sport = inSeason.length > 0 ? rng.pick(inSeason) : SPORTS[0]!;
      return `${sport.label}: ${rng.pick(sport.cards)}`;
    }
    case 'concert': return actName(rng);
    case 'classical': return programName(rng);
    case 'opera': return operaName(rng);
    case 'play': return playName(rng);
    case 'exhibition': return exhibitionName(rng);
    case 'club_night': return `${actName(rng)}, late`;
    default: return actName(rng);
  }
}

/** The sports in season here this month, in a room of this kind. */
function inSeasonAt(cityId: string, month: number, venueKind: 'stadium' | 'arena'): Sport[] {
  return sportsIn(CITIES.get(cityId)?.countryId ?? '')
    .filter((sport) => sport.venueKind === venueKind && sport.months.includes(month));
}

/**
 * What is on at one venue in one week.
 *
 * Derived from the seed, the venue and the week, and cached in memory rather
 * than saved: the listing is a fact about the world, not about you.
 */
export function eventsAt(sim: Simulation, place: Place, at: Instant = sim.now): Event[] {
  return eventsIn(sim, place.cityId, at).filter((event) => event.placeId === place.id);
}

/**
 * Everything on across a city in one week.
 *
 * Generated for the whole city at once rather than a venue at a time, so no
 * act plays two rooms on the same week and no two museums hang the same
 * exhibition — which is what happened when each venue drew on its own.
 */
export function eventsIn(sim: Simulation, cityId: string, at: Instant = sim.now): Event[] {
  const monday = weekStart(sim, at, cityId);
  const key = `${sim.universe.meta.id}:${cityId}:${monday}`;
  const cached = CITY_WEEK_CACHE.get(key);
  if (cached) return cached;

  const all: Event[] = [];
  // One act, production or exhibition to a city in a week: whoever draws it
  // first keeps it, and the next venue draws again.
  const taken = new Set<string>();
  for (const place of venuesIn(sim, cityId)) {
    all.push(...weekAt(sim, place, monday, taken));
  }
  const list = all.sort((a, b) => a.at - b.at);
  CITY_WEEK_CACHE.set(key, list);
  return list;
}

function weekAt(sim: Simulation, place: Place, monday: Instant, taken: Set<string>): Event[] {
  const key = `${sim.universe.meta.id}:${place.id}:${monday}`;
  const cached = WEEK_CACHE.get(key);
  if (cached) return cached;

  const kinds = KIND_BY_VENUE[place.kind] ?? [];
  const zone = zoneOf(sim, place.cityId);
  const out: Event[] = [];

  /** Draw a card nothing else in this city is already showing this week. */
  const freshCard = (kind: GoingKind, salt: string, inSeason: readonly Sport[] = []): string => {
    let card = cardFor(sim, kind, place.cityId, salt, inSeason);
    for (let tries = 1; tries < 8 && taken.has(card); tries += 1) {
      card = cardFor(sim, kind, place.cityId, `${salt}-${tries}`, inSeason);
    }
    taken.add(card);
    return card;
  };
  // A room does one thing a night: a stadium does not host a cup tie in the
  // afternoon and a stadium tour act in the evening of the same day.
  const daysUsed = new Set<number>();

  for (const kind of kinds) {
    const rng = sim.rng('going.week', place.id, monday, kind);
    // How many nights of this kind the room gives the week.
    let nights = 0;
    if (kind === 'exhibition') nights = 4; // hangs all week; a session every couple of days
    else if (kind === 'play') nights = rng.int(3, 6);
    else if (kind === 'classical' || kind === 'opera') nights = rng.int(1, 3);
    else if (kind === 'club_night') nights = rng.int(1, 3);
    else nights = rng.int(1, 2);

    // What hangs on the wall does not change between Tuesday and Friday, and
    // neither does what is on the stage: an exhibition and a production draw
    // a title once and every performance that week shares it. A theater
    // running three different plays in five nights is a repertory company,
    // not the ordinary case.
    const runs = kind === 'exhibition' || kind === 'play' || kind === 'opera';
    const standing = runs ? freshCard(kind, `${place.id}-${monday}-${kind}`) : undefined;

    for (let n = 0; n < nights; n += 1) {
      // A match only happens if that sport is in season here this month.
      const vk = place.kind === 'arena' ? 'arena' : 'stadium';
      // Which day of the week, and the hour it starts.
      // An exhibition hangs all week, so it gets a session on several days
      // rather than one card on the Monday that is in the past by Wednesday.
      const dayOffset = kind === 'exhibition'
        ? n * 2
        : rng.int(kind === 'club_night' ? 4 : 1, 6);
      const startHour = kind === 'exhibition' ? rng.pick([10, 11, 14])
        : kind === 'club_night' ? 22
          : kind === 'match' ? rng.pick([13, 15, 17, 19, 20])
            : rng.pick([19, 19, 20]);
      // Monday is already the instant of local midnight, so the hour goes on
      // top of it and nothing needs correcting.
      // One thing a day in this room. A run is the exception in the sense that
      // it is the same show rather than a second booking, but it still only
      // plays once a night.
      if (daysUsed.has(dayOffset)) continue;
      const eventAt = monday + dayOffset * MS_DAY + startHour * MS_HOUR + rng.int(0, 5) * 5 * MS_MINUTE;

      // The season is checked against the month the fixture actually falls in
      // rather than the month the week started in, because a week that
      // straddles the end of May would otherwise put a match in June.
      const season = kind === 'match'
        ? inSeasonAt(place.cityId, zonedParts(eventAt, zone).month, vk)
        : [];
      if (kind === 'match' && season.length === 0) continue;
      daysUsed.add(dayOffset);

      out.push({
        id: `${place.id}-${monday}-${kind}-${n}`,
        placeId: place.id,
        kind,
        card: standing ?? freshCard(kind, `${place.id}-${monday}-${kind}-${n}`, season),
        at: eventAt,
        buzz: clamp(Math.round(rng.normal(kind === 'exhibition' ? 45 : 55, 20)), 4, 100),
        quality: clamp(Math.round(rng.normal(62, 16)), 8, 97),
      });
    }
  }
  const list = out.sort((a, b) => a.at - b.at);
  WEEK_CACHE.set(key, list);
  return list;
}

/** Every venue in a city you could go out to. */
export function venuesIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => GOING_VENUE_KINDS.includes(place.kind));
}

/** Everything on across a city this week, soonest first. */
export function whatIsOn(sim: Simulation, cityId: string = sim.player.currentLocationId, at: Instant = sim.now): { place: Place; event: Event }[] {
  const venues = new Map(venuesIn(sim, cityId).map((place) => [place.id, place]));
  return eventsIn(sim, cityId, at)
    .filter((event) => event.at >= at - RUNS_MINUTES[event.kind] * MS_MINUTE)
    .flatMap((event) => {
      const place = venues.get(event.placeId);
      return place ? [{ place, event }] : [];
    });
}

export function eventById(sim: Simulation, cityId: string, eventId: string, at: Instant = sim.now): { place: Place; event: Event } | undefined {
  const venues = new Map(venuesIn(sim, cityId).map((place) => [place.id, place]));
  const event = eventsIn(sim, cityId, at).find((one) => one.id === eventId);
  const place = event ? venues.get(event.placeId) : undefined;
  return event && place ? { place, event } : undefined;
}

// ---------------------------------------------------------------------------
// What a seat costs, and how full it gets
// ---------------------------------------------------------------------------

/** What a room of this kind holds. */
function capacityOf(place: Place): number {
  const key = (place.kind === 'stadium' || place.kind === 'arena' || place.kind === 'concert_hall'
    || place.kind === 'theatre' || place.kind === 'museum' || place.kind === 'club') ? place.kind : 'theatre';
  return VENUE_SEATS[key];
}

/** What a seat costs here, in this band, tonight. */
export function priceOf(place: Place, kind: GoingKind, band: Band): Money {
  const raw = BASE_PRICE[kind]
    * costOfLiving(place.cityId)
    * BAND_SHARE[band]
    // A better room is a dearer ticket.
    * (0.7 + (place.quality ?? 60) / 140);
  return Math.max(500, Math.round(raw / 100) * 100);
}

/** Seats still going for one event in one band, after everybody else. */
export function seatsLeft(sim: Simulation, place: Place, event: Event, band: Band): number {
  const capacity = Math.round(capacityOf(place) * BAND_SHARE[band] / (BAND_SHARE.best + BAND_SHARE.middle + BAND_SHARE.cheap));
  const parts = zonedParts(event.at, zoneOf(sim, place.cityId));
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const weekend = weekday === 0 || weekday === 5 || weekday === 6;
  const pull = (event.buzz / 100) * (weekend ? 1.15 : 0.8) * (band === 'cheap' ? 1.1 : band === 'best' ? 0.85 : 1);
  const rng = sim.rng('going.house', place.id, event.id, band);
  const sold = Math.round(capacity * clamp(pull * rng.float(0.75, 1.15), 0, 1.05));

  const mine = Object.values(sim.universe.goingTickets)
    .filter((t) => t.eventId === event.id && t.band === band && t.status === 'booked')
    .reduce((sum, t) => sum + t.seats, 0);
  return clamp(capacity - sold - mine, 0, capacity);
}

// ---------------------------------------------------------------------------
// Your own tickets, and your own taste
// ---------------------------------------------------------------------------

export function ticketsOf(sim: Simulation, personId: Id = sim.player.id): GoingTicket[] {
  return Object.values(sim.universe.goingTickets)
    .filter((t) => t.personId === personId)
    .sort((a, b) => b.at - a.at);
}

export function upcomingTickets(sim: Simulation, personId: Id = sim.player.id): GoingTicket[] {
  return ticketsOf(sim, personId).filter((t) => t.status === 'booked').sort((a, b) => a.at - b.at);
}

/**
 * What you like, which is not what is good.
 *
 * Half is who you are — an open person for the opera, an outgoing one for the
 * club — and half is the particular person this save made.
 */
export function tasteFor(sim: Simulation, kind: GoingKind, person: Person = sim.player): number {
  const p = person.personality;
  const base: Record<GoingKind, number> = {
    match: p.extraversion * 0.4 + 35,
    concert: p.extraversion * 0.4 + p.openness * 0.2 + 30,
    classical: p.openness * 0.6 + 20,
    opera: p.openness * 0.7 + 12,
    play: p.openness * 0.5 + 25,
    exhibition: p.openness * 0.6 + 22,
    club_night: p.extraversion * 0.6 + p.riskTolerance * 0.2 + 18,
  };
  const own = sim.rng('going.taste', person.id, kind).int(-15, 15);
  return clamp(Math.round(50 + ((base[kind] ?? 45) + own - 48) * 1.6), 0, 100);
}

function houseNote(sim: Simulation, place: Place, event: Event, seatsBought: number): string {
  const rng = sim.rng('going.room', place.id, event.id, seatsBought);
  const across = ['best', 'middle', 'cheap'] as const;
  const left = across.reduce((sum, band) => sum + seatsLeft(sim, place, event, band), 0) + seatsBought;
  const cap = capacityOf(place);
  const full = clamp(1 - left / cap, 0, 1);
  const how = full > 0.9 ? 'A full house, and the doors held for the stragglers.'
    : full > 0.6 ? 'Most of the seats gone.'
      : full > 0.3 ? 'A respectable crowd.'
        : full > 0.1 ? 'Thin, and you could hear the room.' : 'Barely anybody, which changes a night.';
  const thing = event.kind === 'match'
    ? rng.pick(['It went the way the crowd wanted, just.', 'A dull nil until the last ten minutes.', 'Somebody behind you narrated the whole thing.', 'The away end never stopped singing.'])
    : event.kind === 'club_night'
      ? rng.pick(['The floor filled after one.', 'The sound was too loud and then exactly right.', 'You left before the lights came up.'])
      : rng.pick(['A cough in the quiet part, and everybody heard it.', 'The person next to you knew every word.', 'Nobody moved until it was properly over.', 'A standing ovation that half the room meant.']);
  return `${how} ${thing}`;
}

function verdictNote(verdict: number, kind: GoingKind, rng: { pick<T>(items: readonly T[]): T }): string {
  const label = GOING_LABEL[kind].toLowerCase().replace(/^an? /, '');
  if (verdict >= 82) return rng.pick(['You’ll be talking about that for a week.', 'Worth the whole evening and the ticket twice over.', 'One of those nights you leave the house for.']);
  if (verdict >= 62) return rng.pick(['Good. You’d go again.', 'It did what it came to do, and did it well.', 'A proper night out.']);
  if (verdict >= 42) return rng.pick(['Fine. You have had better and worse.', 'You checked your phone once, near the end.', `A ${label} that neither surprised nor disappointed.`]);
  if (verdict >= 22) return rng.pick(['Not your thing, and you knew it early.', 'You stayed out of politeness.', 'A long way to come for that.']);
  return rng.pick(['You wished you had stayed in.', 'That’s an evening you aren’t getting back.', 'Nothing in it worked for you.']);
}

/** A ticket in a sentence. */
export function describeTicket(sim: Simulation, ticket: GoingTicket): string {
  if (ticket.status === 'refunded') return 'Given back before the night.';
  if (ticket.status === 'missed') return 'You never turned up, and the seat sat empty.';
  const zone = zoneOf(sim, ticket.cityId);
  if (ticket.went) {
    return `${BAND_LABEL[ticket.band as Band] ?? ticket.band} at ${ticket.placeName}, `
      + `${formatDate(ticket.went.at, zone)}, for ${formatMoney(ticket.paid)}.`;
  }
  return `${formatDate(ticket.at, zone)} at ${formatTime(ticket.at, zone)}, ${BAND_LABEL[ticket.band as Band] ?? ticket.band}.`;
}

/** How old somebody is right now, in years. */
export { ageOf } from './lifespan';

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerGoingSystem(sim: Simulation): void {
  /** A seat, in a band, for something that is actually on. */
  sim.onCommand<
    { placeId: string; eventId: string; band?: Band; seats?: number },
    { ticketId: Id; paid: Money; card: string }
  >(
    'going.book',
    (p, { sim: s }) => {
      const cityId = s.player.currentLocationId;
      const found = eventById(s, cityId, p.eventId);
      if (!found) throw new CommandError('That isn’t on there.');
      const { place, event } = found;
      if (place.id !== p.placeId) throw new CommandError('That isn’t on at that venue.');
      if (event.at < s.now) throw new CommandError('That has started. Pick a later one.');
      if (event.at > s.now + 21 * MS_DAY) throw new CommandError('They aren’t selling that far ahead.');

      const band = (p.band ?? 'middle');
      if (!BAND_SHARE[band]) throw new CommandError('There’s no such seat.');
      const seats = clamp(Math.round(p.seats ?? 1), 1, 8);
      const left = seatsLeft(s, place, event, band);
      if (left < seats) {
        throw new CommandError(left === 0
          ? 'Those seats are gone. There may be another band, or another night.'
          : `They have ${plural(left, 'seat')} left in that part of the house, and you asked for ${seats}.`);
      }

      const paid = priceOf(place, event.kind, band) * seats;
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay for a ticket from.');
      if (s.ledger.availableFunds(accountId) < paid) {
        throw new CommandError(`That is ${formatMoney(paid)} and you don’t have it.`);
      }

      const already = Object.values(s.universe.goingTickets).find(
        (t) => t.personId === s.player.id && t.eventId === event.id && t.status === 'booked',
      );
      if (already) throw new CommandError('You already have a seat for that one.');

      s.expense(accountId, paid, `${GOING_LABEL[event.kind]} — ${event.card}`, 'leisure', { refType: 'place', refId: place.id });

      const ticket: GoingTicket = {
        id: s.nextId('seat'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        placeId: place.id,
        placeName: place.name,
        cityId,
        eventId: event.id,
        kind: event.kind,
        card: event.card,
        band,
        at: event.at,
        seats,
        paid,
        bookedAt: s.now,
        status: 'booked',
      };
      s.universe.goingTickets[ticket.id] = ticket;

      s.schedule({
        at: event.at,
        kind: 'going.showtime',
        label: `${event.card} — ${place.name}`,
        category: 'personal',
        payload: { ticketId: ticket.id },
        priority: 40,
        requiresPlayer: true,
        refType: 'place', refId: place.id,
      });
      s.schedule({
        at: event.at + DOORS_SHUT_MINUTES * MS_MINUTE,
        kind: 'going.doors',
        label: `Doors Shut — ${event.card}`,
        category: 'personal',
        payload: { ticketId: ticket.id },
        priority: 20,
      });
      s.emit('going.booked', { ticketId: ticket.id, placeId: place.id, paid });
      return { ticketId: ticket.id, paid, card: event.card };
    },
  );

  /** Going. The hours are real, and the night is what it was against your taste. */
  sim.onCommand<{ ticketId: Id }, { verdict: number; note: string; house: string }>(
    'going.attend',
    (p, { sim: s }) => {
      const ticket = s.universe.goingTickets[p.ticketId];
      if (!ticket) throw new CommandError('No such ticket.');
      if (ticket.status === 'went') throw new CommandError('You have already been to that one.');
      if (ticket.status !== 'booked') throw new CommandError('That ticket isn’t good for anything now.');
      if (s.now < ticket.at - DOORS_OPEN_MINUTES * MS_MINUTE) {
        const zone = zoneOf(s, ticket.cityId);
        throw new CommandError(`That’s at ${formatTime(ticket.at, zone)} on ${formatDate(ticket.at, zone)}. They aren’t open yet.`);
      }
      if (s.now > ticket.at + DOORS_SHUT_MINUTES * MS_MINUTE) {
        ticket.status = 'missed';
        throw new CommandError('That started, and they have shut the doors.');
      }
      if (s.player.currentLocationId !== ticket.cityId) {
        throw new CommandError(`It’s in ${CITIES.get(ticket.cityId)?.name ?? 'another city'} and you aren’t.`);
      }
      if (s.player.wellbeing.energy < 8) throw new CommandError('You’d sleep through it. Go home.');

      const found = eventById(s, ticket.cityId, ticket.eventId, ticket.at);
      const kind = ticket.kind as GoingKind;
      const quality = found?.event.quality ?? 60;
      const taste = tasteFor(s, kind);
      const rng = s.rng('going.verdict', ticket.id);
      const verdict = clamp(Math.round(quality * 0.6 + taste * 0.32 + rng.int(-6, 6)), 1, 100);

      const place = found?.place ?? venuesIn(s, ticket.cityId).find((one) => one.id === ticket.placeId);
      const house = place && found ? houseNote(s, place, found.event, ticket.seats) : 'A room with something on in it.';
      const note = verdictNote(verdict, kind, rng);

      const minutes = RUNS_MINUTES[kind] + 15;
      s.advanceTo(Math.max(s.now, ticket.at) + minutes * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - minutes / 20, 0, 100);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress - (verdict >= 50 ? 10 : 3), 0, 100);
      s.player.wellbeing.morale = clamp(s.player.wellbeing.morale + (verdict - 45) / 7, 0, 100);
      s.player.currentPlaceId = ticket.placeId;

      ticket.status = 'went';
      ticket.went = { at: s.now, verdict, note, house };
      s.remember({
        category: 'life',
        title: `${GOING_LABEL[kind]}: ${ticket.card}`,
        detail: `${ticket.placeName}, ${BAND_LABEL[ticket.band as Band] ?? ticket.band}. ${note} ${house}`,
        refs: [{ type: 'place', id: ticket.placeId }],
        significance: verdict >= 82 || verdict <= 20 ? 4 : 2,
        public: false,
      });
      s.emit('going.attended', { ticketId: ticket.id, verdict });
      return { verdict, note, house };
    },
  );

  /** Changing your mind, which the box office allows up to a point. */
  sim.onCommand<{ ticketId: Id }, { refund: Money }>(
    'going.cancel',
    (p, { sim: s }) => {
      const ticket = s.universe.goingTickets[p.ticketId];
      if (!ticket) throw new CommandError('No such ticket.');
      if (ticket.status !== 'booked') throw new CommandError('There’s nothing to give back.');
      if (s.now > ticket.at - REFUNDABLE_UNTIL_MINUTES * MS_MINUTE) {
        throw new CommandError(`They won’t refund inside ${plural(REFUNDABLE_UNTIL_MINUTES / 60, 'hour')} of the start.`);
      }
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account for the refund to go to.');
      s.income(accountId, ticket.paid, `Refund — ${ticket.card}`, 'refund', { refType: 'place', refId: ticket.placeId });
      ticket.status = 'refunded';
      s.emit('going.cancelled', { ticketId: ticket.id, refund: ticket.paid });
      return { refund: ticket.paid };
    },
  );

  sim.onSchedule('going.showtime', (item, s) => {
    const ticket = s.universe.goingTickets[(item.payload as { ticketId: Id }).ticketId];
    if (!ticket || ticket.status !== 'booked') return;
    s.notify({
      title: `${ticket.card} Is About To Start`,
      body: `${ticket.placeName}. ${BAND_LABEL[ticket.band as Band] ?? ticket.band}.`,
      category: 'personal',
      importance: 48,
      route: '/workspace/goingout',
      refType: 'place', refId: ticket.placeId,
    });
  });

  /** The night starts without you, and a seat nobody sat in stays empty. */
  sim.onSchedule('going.doors', (item, s) => {
    const ticket = s.universe.goingTickets[(item.payload as { ticketId: Id }).ticketId];
    if (!ticket || ticket.status !== 'booked') return;
    ticket.status = 'missed';
    s.notify({
      title: `You Missed ${ticket.card}`,
      body: `${ticket.placeName}. ${formatMoney(ticket.paid)}, and the seat sat empty.`,
      category: 'personal',
      importance: 30,
      route: '/workspace/goingout',
      refType: 'place', refId: ticket.placeId,
    });
    s.emit('going.missed', { ticketId: ticket.id });
  });
}

export { CARD_COMBINATIONS, GOING_LABEL, BAND_LABEL };
