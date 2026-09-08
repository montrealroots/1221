/**
 * SLATE — going to the pictures.
 *
 * A real chain, in a country it really trades in, with the real certificate
 * of that country on the poster. A program that follows the release rhythm
 * the business actually runs to. A ticket for a named seat at a named time,
 * at a price that is the city's, the format's and the hour's. And the room:
 * who else is in it, and whether one of them spends two hours on their phone.
 *
 * What is on the screen is SLATE's own and says so. Nothing here claims to
 * know what is playing anywhere this weekend.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { CinemaTicket, Id, Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import {
  MS_DAY, MS_HOUR, MS_MINUTE, addDays, formatDate, formatTime, zonedParts,
} from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { CITIES } from '../content/geography';
import { placesIn, type Place } from '../content/places';
import { costOfLiving } from '../content/tax';
import {
  BASE_TICKET, CHAIN_BY_ID, type Certificate, type ChainTier, type CinemaChain, type FilmGenre,
  GENRES, GENRE_LABEL, MATINEE_BEFORE_HOUR, MATINEE_DISCOUNT, SCREEN_LABEL, SCREEN_PREMIUM,
  SCREEN_SEATS, SNACK_LABEL, SNACK_PRICES, type Screen, TIER_PREMIUM, TRAILERS_MINUTES,
  chainsInCountry, ratingSystemFor, seasonFor, titleFor,
} from '../content/cinemas';

// ---------------------------------------------------------------------------
// What is on
// ---------------------------------------------------------------------------

/** One picture on at one cinema this week. SLATE's own, always. */
export interface Showing {
  id: string;
  title: string;
  genre: FilmGenre;
  certificate: Certificate;
  runtimeMinutes: number;
  /** Which week of its run this is. A first week is a busy week. */
  weekOfRun: number;
  /** How much anybody is talking about it, 0-100. Decides how full the room is. */
  buzz: number;
  /** What it actually is, 0-100. Decides what you think of it. */
  quality: number;
  franchise: boolean;
}

/**
 * The clock a cinema keeps.
 *
 * A cinema runs on the time where it stands, not on the time where you live.
 * A Tokyo house opens its doors at seven in Tokyo whether or not the player's
 * home zone says it is the middle of the night.
 */
export function zoneOf(sim: Simulation, cityId: string): string {
  return CITIES.get(cityId)?.timeZone ?? sim.zone;
}

/** Monday of the week an instant falls in, in the zone the city keeps. */
export function weekStartOf(sim: Simulation, at: Instant, cityId?: string): Instant {
  const zone = cityId ? zoneOf(sim, cityId) : sim.zone;
  const parts = zonedParts(at, zone);
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const back = (weekday + 6) % 7;
  const midnight = at - ((parts.hour * 60 + parts.minute) * MS_MINUTE + parts.second * 1000);
  return addDays(midnight, -back, zone);
}

/**
 * The age a certificate usually lands on, by kind of picture.
 *
 * A program is weighted towards the certificate the genre really tends to
 * get, in whatever the country's own system calls it, rather than dealt at
 * random. A horror film with a certificate that lets a nine year old in on
 * their own is not a thing that happens.
 */
const CERTIFICATE_LEAN: Readonly<Record<FilmGenre, number>> = {
  animation: 0,
  documentary: 4,
  musical: 3,
  romance: 11,
  comedy: 11,
  science_fiction: 12,
  action: 13,
  drama: 13,
  thriller: 15,
  horror: 17,
};

const PROGRAMME_CACHE = new Map<string, Showing[]>();

/**
 * What is playing in a city this week.
 *
 * Derived from the save's seed, the city and the week, and cached in memory
 * rather than saved: the program is a fact about the world, not about you,
 * so it costs a save nothing and comes back the same every time.
 */
export function programmeIn(sim: Simulation, cityId: string, at: Instant = sim.now): Showing[] {
  const monday = weekStartOf(sim, at, cityId);
  const key = `${sim.universe.meta.id}:${cityId}:${monday}`;
  const cached = PROGRAMME_CACHE.get(key);
  if (cached) return cached;

  const city = CITIES.get(cityId);
  const out: Showing[] = [];
  if (!city) return out;

  const system = ratingSystemFor(city.countryId);
  const taken = new Set<string>();
  // A picture opens on a Friday and runs for a few weeks, so the program in
  // any given week is this week's openings plus what is left of the last ones.
  const zone = zoneOf(sim, cityId);
  for (let back = 0; back < 8; back += 1) {
    const openedMonday = addDays(monday, -7 * back, zone);
    const parts = zonedParts(openedMonday, zone);
    const season = seasonFor(parts.month);
    const rng = sim.rng('cine.week', cityId, openedMonday);
    const opening = Math.max(1, Math.round(rng.int(2, 4) * season.weight));

    for (let n = 0; n < opening; n += 1) {
      const genre = rng.chance(0.55) ? rng.pick(season.favours) : rng.pick(GENRES);
      const franchise = rng.chance(genre === 'action' || genre === 'science_fiction' ? 0.4 : 0.12);
      const openingBuzz = clamp(Math.round(rng.normal(franchise ? 74 : 52, 18) * season.weight), 5, 100);
      // A picture leaves the schedule once nobody is going any more.
      const buzz = clamp(Math.round(openingBuzz * (0.74 ** back)), 0, 100);
      if (buzz < 8) continue;

      // What a picture is classified as follows what kind of picture it is:
      // nobody gives a horror film a certificate that lets children in on
      // their own, and nobody keeps children out of an animation.
      const wants = CERTIFICATE_LEAN[genre];
      const certificate = rng.weighted(system.certificates, (one) => {
        const distance = Math.abs(one.advisoryAge - wants);
        return 1 / (1 + distance * distance * 0.9);
      });

      let title = titleFor(rng, genre, franchise);
      for (let tries = 0; tries < 8 && taken.has(title); tries += 1) title = titleFor(rng, genre, franchise);
      if (taken.has(title)) continue;
      taken.add(title);

      out.push({
        id: `show-${cityId}-${openedMonday}-${n}`,
        title,
        genre,
        certificate,
        runtimeMinutes: genre === 'animation'
          ? clamp(Math.round(rng.normal(96, 8)), 78, 118)
          : genre === 'documentary'
            ? clamp(Math.round(rng.normal(94, 12)), 72, 128)
            : clamp(Math.round(rng.normal(franchise ? 132 : 108, 16)), 82, 190),
        weekOfRun: back + 1,
        buzz,
        quality: clamp(Math.round(rng.normal(franchise ? 54 : 60, 17)), 8, 97),
        franchise,
      });
    }
  }

  const list = out.sort((a, b) => b.buzz - a.buzz).slice(0, 16);
  PROGRAMME_CACHE.set(key, list);
  return list;
}

export function showingById(sim: Simulation, cityId: string, showingId: string, at: Instant = sim.now): Showing | undefined {
  return programmeIn(sim, cityId, at).find((one) => one.id === showingId);
}

// ---------------------------------------------------------------------------
// The buildings
// ---------------------------------------------------------------------------

/** Every cinema in a city, real ones and SLATE's own. */
export function cinemasIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'cinema');
}

/**
 * Which real chain runs a cinema.
 *
 * A real landmark cinema is nobody's branch — the TCL Chinese and the BFI are
 * themselves — so those come back without a chain and are priced as what they
 * are. Everything else is dealt out of the chains that really trade in that
 * country, deterministically from the branch's own id.
 */
export function chainOf(sim: Simulation, place: Place): CinemaChain | undefined {
  if (place.real) return undefined;
  const city = CITIES.get(place.cityId);
  if (!city) return undefined;
  const options = chainsInCountry(city.countryId);
  if (options.length === 0) return undefined;
  return sim.rng('cine.chain', place.id).pick(options);
}

/** What kind of house it is, chain or not. */
export function tierOf(sim: Simulation, place: Place): ChainTier {
  const chain = chainOf(sim, place);
  if (chain) return chain.tier;
  // A landmark cinema is itself rather than anybody's branch: an expensive one
  // is a premium house, a cheap one with a good name is an art house.
  return place.price >= 3 ? 'premium' : 'arthouse';
}

/** The formats this branch actually has. */
export function screensAt(sim: Simulation, place: Place): Screen[] {
  const chain = chainOf(sim, place);
  if (chain) {
    // Not every branch of a chain has every format.
    const rng = sim.rng('cine.screens', place.id);
    const kept = chain.screens.filter((_screen, index) => index === 0 || rng.chance(0.62));
    return kept.length > 0 ? kept : ['standard'];
  }
  return place.quality >= 80 ? ['standard', 'screening_room'] : ['standard'];
}

/** How the cinema is named in a sentence: the branch, and whose it is. */
export function describeCinema(sim: Simulation, place: Place): string {
  const chain = chainOf(sim, place);
  const system = ratingSystemFor(CITIES.get(place.cityId)?.countryId ?? '');
  return chain
    ? `A ${chain.name} house. ${chain.about} Certificates by ${system.body}.`
    : `${place.about} Certificates by ${system.body}.`;
}

// ---------------------------------------------------------------------------
// Times and seats
// ---------------------------------------------------------------------------

/** The hours a cinema starts a picture. Earlier on a weekend. */
const START_HOURS: readonly number[] = [11, 13, 15, 17, 19, 20, 21, 22];

/** Every showtime for one picture at one cinema on one day. */
export function showtimesFor(sim: Simulation, place: Place, showing: Showing, day: Instant): Instant[] {
  const parts = zonedParts(day, zoneOf(sim, place.cityId));
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const midnight = day - ((parts.hour * 60 + parts.minute) * MS_MINUTE + parts.second * 1000);
  const rng = sim.rng('cine.times', place.id, showing.id, parts.day, parts.month, parts.year);

  // A picture everybody wants gets more of the day than one nobody is asking for.
  const wanted = clamp(Math.round(showing.buzz / 22), 1, 5);
  const weekend = weekday === 0 || weekday === 5 || weekday === 6;
  const count = clamp(wanted + (weekend ? 1 : 0), 1, START_HOURS.length);
  const hours = rng.shuffle([...START_HOURS]).slice(0, count).sort((a, b) => a - b);
  return hours.map((hour) => midnight + hour * MS_HOUR + rng.int(0, 5) * 5 * MS_MINUTE);
}

/** Which screen a given showtime is in. A big picture gets the big room. */
export function screenFor(sim: Simulation, place: Place, showing: Showing, at: Instant): Screen {
  const available = screensAt(sim, place);
  const rng = sim.rng('cine.screen', place.id, showing.id, at);
  return rng.weighted(available, (screen) => {
    if (screen === 'standard') return 3;
    // The premium rooms go to the pictures that fill them.
    return clamp(showing.buzz / 30, 0.15, 3.5);
  });
}

/** What a seat costs here, at this hour, in this room. */
export function ticketPrice(sim: Simulation, place: Place, screen: Screen, at: Instant): Money {
  const parts = zonedParts(at, zoneOf(sim, place.cityId));
  const matinee = parts.hour < MATINEE_BEFORE_HOUR;
  const raw = BASE_TICKET
    * costOfLiving(place.cityId)
    * TIER_PREMIUM[tierOf(sim, place)]
    * SCREEN_PREMIUM[screen]
    * (matinee ? MATINEE_DISCOUNT : 1);
  return Math.max(400, Math.round(raw / 50) * 50);
}

/** What the concession stand asks here. */
export function snackPrice(place: Place, size: keyof typeof SNACK_PRICES): Money {
  if (size === 'nothing') return 0;
  return Math.round((SNACK_PRICES[size] * costOfLiving(place.cityId)) / 50) * 50;
}

/** Seats still going for one showtime, after everybody else in the city. */
export function seatsLeft(sim: Simulation, place: Place, showing: Showing, at: Instant): number {
  const screen = screenFor(sim, place, showing, at);
  const capacity = SCREEN_SEATS[screen];
  const parts = zonedParts(at, zoneOf(sim, place.cityId));
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const weekend = weekday === 0 || weekday === 5 || weekday === 6;
  const evening = parts.hour >= 18 && parts.hour <= 21;

  // How full it gets: what people are saying about it, how long it has been
  // on, and whether it is a Friday night or a Tuesday lunchtime.
  const pull = (showing.buzz / 100)
    * (0.55 ** (showing.weekOfRun - 1) + 0.25)
    * (weekend ? 1.25 : 0.72)
    * (evening ? 1.3 : 0.6);
  const rng = sim.rng('cine.house', place.id, showing.id, at);
  const sold = Math.round(capacity * clamp(pull * rng.float(0.8, 1.2), 0, 1.05));

  const mine = Object.values(sim.universe.cinemaTickets)
    .filter((ticket) => ticket.placeId === place.id && ticket.showingId === showing.id
      && ticket.at === at && ticket.status === 'booked')
    .reduce((sum, ticket) => sum + ticket.seats, 0);
  return clamp(capacity - sold - mine, 0, capacity);
}

// ---------------------------------------------------------------------------
// Your own tickets, and your own taste
// ---------------------------------------------------------------------------

export function ticketsOf(sim: Simulation, personId: Id = sim.player.id): CinemaTicket[] {
  return Object.values(sim.universe.cinemaTickets)
    .filter((ticket) => ticket.personId === personId)
    .sort((a, b) => b.at - a.at);
}

/** Tickets for something that has not happened yet. */
export function upcomingTickets(sim: Simulation, personId: Id = sim.player.id): CinemaTicket[] {
  return ticketsOf(sim, personId)
    .filter((ticket) => ticket.status === 'booked')
    .sort((a, b) => a.at - b.at);
}

/**
 * What you like, which is not what is good.
 *
 * Half of it is who you are — an open person sits through the documentary,
 * somebody who likes a risk sits through the horror — and half of it is the
 * particular person this save made, so two lives do not have the same taste.
 */
export function tasteFor(sim: Simulation, genre: FilmGenre, person: Person = sim.player): number {
  const p = person.personality;
  const base: Partial<Record<FilmGenre, number>> = {
    documentary: p.openness * 0.7 + 15,
    drama: p.openness * 0.5 + p.emotionalStability * 0.2 + 20,
    horror: p.riskTolerance * 0.6 + 20,
    thriller: p.riskTolerance * 0.45 + 30,
    comedy: p.extraversion * 0.45 + 32,
    action: p.extraversion * 0.3 + p.riskTolerance * 0.3 + 30,
    romance: p.agreeableness * 0.5 + 25,
    animation: p.openness * 0.25 + 40,
    science_fiction: p.openness * 0.45 + 28,
    musical: p.extraversion * 0.35 + p.openness * 0.2 + 22,
  };
  const own = sim.rng('cine.taste', person.id, genre).int(-16, 16);
  // Spread it out from the middle, so a person has things they like and
  // things they do not rather than a shrug for everything.
  const raw = (base[genre] ?? 45) + own;
  return clamp(Math.round(50 + (raw - 48) * 1.7), 0, 100);
}

/** How full the room was, and what that was like to sit in. */
function roomNote(sim: Simulation, place: Place, showing: Showing, at: Instant, seats: number): string {
  const screen = screenFor(sim, place, showing, at);
  const capacity = SCREEN_SEATS[screen];
  const left = seatsLeft(sim, place, showing, at) + seats;
  const full = clamp(1 - left / capacity, 0, 1);
  const rng = sim.rng('cine.room', place.id, showing.id, at, seats);

  const how = full > 0.85 ? 'Packed out.'
    : full > 0.55 ? 'Most of the seats gone.'
      : full > 0.2 ? 'A decent house.'
        : full > 0.05 ? 'Nine or ten people in.' : 'You and two other people.';

  // What the room does, which is most of what you remember about a cinema.
  const trouble = rng.float(0, 1);
  const busy = clamp(full, 0.05, 1);
  const thing = trouble < 0.16 * busy
    ? rng.pick([
      'Somebody behind you spent the second half kicking your seat.',
      'A phone screen came on three rows down and stayed on.',
      'Two people talked through the first twenty minutes and then left.',
      'A bag of something crinkled all the way through the quiet part.',
    ])
    : trouble < 0.3 * busy
      ? rng.pick([
        'Somebody laughed in the wrong place and it was funnier than the film.',
        'The projection was soft for the first reel and then somebody fixed it.',
        'The air conditioning was doing its best and losing.',
      ])
      : trouble > 0.9
        ? rng.pick([
          'The room went completely silent at the right moment, which almost never happens.',
          'Somebody clapped at the end and, for once, it did not feel stupid.',
          'Nobody moved until the lights came up.',
        ])
        : rng.pick([
          'Nothing happened that was not on the screen.',
          'A quiet, well behaved room.',
          'Trailers, an advert for a car, and then the film.',
        ]);
  return `${how} ${thing}`;
}

/** What you thought, in a sentence, from what it was and what you like. */
function verdictNote(verdict: number, genre: FilmGenre, rng: { pick<T>(items: readonly T[]): T }): string {
  if (verdict >= 82) {
    return rng.pick([
      'You sat through the credits. It is going to be in your head for a week.',
      'That is the reason to leave the house. Every bit of it worked.',
      'You came out of it wanting to make something.',
    ]);
  }
  if (verdict >= 62) {
    return rng.pick([
      'Good. Twenty minutes too long, and still good.',
      'It does what it set out to do and does it properly.',
      'You would recommend it to about half the people you know.',
    ]);
  }
  if (verdict >= 42) {
    return rng.pick([
      'Fine. You will have forgotten it by Thursday.',
      'It is exactly what it looks like on the poster.',
      'Two good scenes and a lot of getting between them.',
    ]);
  }
  if (verdict >= 22) {
    return rng.pick([
      'Not for you, and you knew that by the second reel.',
      `A ${GENRE_LABEL[genre].toLowerCase()} that forgot what it was for.`,
      'You checked the time twice.',
    ]);
  }
  return rng.pick([
    'You thought about leaving and stayed out of stubbornness.',
    'Nothing in it worked, and it was long.',
    'That is two hours you are not getting back.',
  ]);
}

/** A ticket in a sentence. */
export function describeTicket(sim: Simulation, ticket: CinemaTicket): string {
  if (ticket.status === 'refunded') return 'Given back before it started.';
  if (ticket.status === 'missed') return 'You never turned up, and the seat went empty.';
  if (ticket.seen) {
    const zone = zoneOf(sim, ticket.cityId);
    return `Seen ${formatDate(ticket.seen.at, zone)} at ${ticket.placeName}`
      + `${ticket.seen.snacks > 0 ? `, with ${formatMoney(ticket.seen.snacks)} spent at the stand` : ''}.`;
  }
  return `${formatDate(ticket.at, sim.homeZone)} at ${formatTime(ticket.at, sim.homeZone)}, `
    + `${plural(ticket.seats, 'seat')} in ${SCREEN_LABEL[ticket.screen as Screen] ?? ticket.screen}.`;
}

/** How old somebody is right now, in years. */
export { ageOf } from './lifespan';
import { ageOf } from './lifespan';

/** How long you can be given your money back. */
export const REFUNDABLE_UNTIL_MINUTES = 120;

/** How long after the start they will still let you in. */
export const DOORS_SHUT_MINUTES = 30;

/** How long before the start they open the doors. */
export const DOORS_OPEN_MINUTES = 45;

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerCinemaSystem(sim: Simulation): void {
  /** A seat, at a time, for a picture that is actually on. */
  sim.onCommand<
    { placeId: string; showingId: string; at: Instant; seats?: number },
    { ticketId: Id; paid: Money; title: string; screen: Screen }
  >(
    'cine.book',
    (p, { sim: s }) => {
      const cityId = s.player.currentLocationId;
      const place = cinemasIn(s, cityId).find((one) => one.id === p.placeId);
      if (!place) throw new CommandError('That is not a cinema in this city.');
      const showing = showingById(s, cityId, p.showingId, p.at);
      if (!showing) throw new CommandError('That is not on there.');
      if (p.at < s.now) throw new CommandError('That showing has started. Pick a later one.');
      if (p.at > s.now + 14 * MS_DAY) throw new CommandError('They are not selling that far ahead.');

      const day = showtimesFor(s, place, showing, p.at);
      if (!day.includes(p.at)) throw new CommandError('There is no showing at that time.');

      const age = ageOf(s);
      const cert = showing.certificate;
      if (age < cert.minimumAge && !cert.accompanied) {
        throw new CommandError(
          `${showing.title} is a ${cert.label}. ${cert.about} You are ${age}.`,
        );
      }

      const seats = clamp(Math.round(p.seats ?? 1), 1, 8);
      const left = seatsLeft(s, place, showing, p.at);
      if (left < seats) {
        throw new CommandError(left === 0
          ? `That showing is sold out. There are other times.`
          : `They have ${plural(left, 'seat')} left for that one, and you asked for ${seats}.`);
      }

      const screen = screenFor(s, place, showing, p.at);
      const paid = ticketPrice(s, place, screen, p.at) * seats;
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay for a ticket from.');
      if (s.ledger.availableFunds(accountId) < paid) {
        throw new CommandError(`That is ${formatMoney(paid)} and you do not have it.`);
      }

      const already = Object.values(s.universe.cinemaTickets).find(
        (one) => one.personId === s.player.id && one.showingId === showing.id
          && one.at === p.at && one.status === 'booked',
      );
      if (already) throw new CommandError(`You already have a seat for that one.`);

      const chain = chainOf(s, place);
      s.expense(accountId, paid, `Cinema — ${showing.title}`, 'leisure', { refType: 'place', refId: place.id });

      const ticket: CinemaTicket = {
        id: s.nextId('ticket'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        placeId: place.id,
        placeName: place.name,
        cityId,
        chainId: chain?.id,
        showingId: showing.id,
        title: showing.title,
        genre: showing.genre,
        certificate: cert.label,
        runtimeMinutes: showing.runtimeMinutes,
        screen,
        at: p.at,
        seats,
        paid,
        bookedAt: s.now,
        status: 'booked',
      };
      s.universe.cinemaTickets[ticket.id] = ticket;

      s.schedule({
        at: p.at + DOORS_SHUT_MINUTES * MS_MINUTE,
        kind: 'cine.doors',
        label: `Doors Shut On ${showing.title}`,
        category: 'personal',
        payload: { ticketId: ticket.id },
        priority: 20,
        refType: 'place', refId: place.id,
      });
      s.schedule({
        at: p.at,
        kind: 'cine.showtime',
        label: `${showing.title} At ${place.name}`,
        category: 'personal',
        payload: { ticketId: ticket.id },
        priority: 40,
        requiresPlayer: true,
        refType: 'place', refId: place.id,
      });
      s.emit('cine.booked', { ticketId: ticket.id, placeId: place.id, paid });
      return { ticketId: ticket.id, paid, title: showing.title, screen };
    },
  );

  /**
   * Sitting through it.
   *
   * The hours are real: trailers, then the picture. What you think of it is
   * what it is against what you like, and the room is whoever else came.
   */
  sim.onCommand<
    { ticketId: Id; snacks?: keyof typeof SNACK_PRICES },
    { verdict: number; note: string; room: string; snacks: Money }
  >(
    'cine.attend',
    (p, { sim: s }) => {
      const ticket = s.universe.cinemaTickets[p.ticketId];
      if (!ticket) throw new CommandError('No such ticket.');
      if (ticket.status === 'seen') throw new CommandError('You have already seen that one.');
      if (ticket.status !== 'booked') throw new CommandError('That ticket is not good for anything now.');
      if (s.now < ticket.at - DOORS_OPEN_MINUTES * MS_MINUTE) {
        throw new CommandError(
          `That is at ${formatTime(ticket.at, s.homeZone)} on ${formatDate(ticket.at, s.homeZone)}. They will not let you in yet.`,
        );
      }
      if (s.now > ticket.at + DOORS_SHUT_MINUTES * MS_MINUTE) {
        ticket.status = 'missed';
        throw new CommandError('That started half an hour ago. They have shut the doors.');
      }
      if (s.player.currentLocationId !== ticket.cityId) {
        throw new CommandError(`Your seat is in ${CITIES.get(ticket.cityId)?.name ?? 'another city'} and you are not.`);
      }
      if (s.player.currentPlaceId !== ticket.placeId) {
        throw new CommandError(`You are not at ${ticket.placeName}. Nobody has ever watched a film from the car park.`);
      }
      if (s.player.wellbeing.energy < 8) {
        throw new CommandError('You would sleep through it. Go home.');
      }

      const place = cinemasIn(s, ticket.cityId).find((one) => one.id === ticket.placeId);
      const showing = showingById(s, ticket.cityId, ticket.showingId, ticket.at);
      const size = p.snacks ?? 'nothing';
      if (!SNACK_PRICES[size] && size !== 'nothing') throw new CommandError('They do not sell that.');
      const snacks = place ? snackPrice(place, size) : 0;

      const accountId = s.player.primaryAccountId;
      if (snacks > 0) {
        if (!accountId) throw new CommandError('You have no account to pay the stand from.');
        if (s.ledger.availableFunds(accountId) < snacks) {
          throw new CommandError(`The stand wants ${formatMoney(snacks)} and you do not have it.`);
        }
        s.expense(accountId, snacks, `Cinema — ${SNACK_LABEL[size]}`, 'leisure', { refType: 'place', refId: ticket.placeId });
      }

      // What you thought: what it is, plus how much this kind of thing is
      // yours, and nothing else.
      const genre = ticket.genre as FilmGenre;
      const quality = showing?.quality ?? 55;
      const taste = tasteFor(s, genre);
      const rng = s.rng('cine.verdict', ticket.id);
      const verdict = clamp(Math.round(quality * 0.62 + taste * 0.3 + rng.int(-6, 6)), 1, 100);

      const room = place && showing
        ? roomNote(s, place, showing, ticket.at, ticket.seats)
        : 'A room with a screen in it.';
      const note = verdictNote(verdict, genre, rng);

      // Trailers first, then the picture, then getting out of the car park.
      const minutes = TRAILERS_MINUTES + ticket.runtimeMinutes + 10;
      s.advanceTo(Math.max(s.now, ticket.at) + minutes * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - minutes / 22, 0, 100);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress - (verdict >= 50 ? 9 : 3), 0, 100);
      s.player.wellbeing.morale = clamp(s.player.wellbeing.morale + (verdict - 45) / 8, 0, 100);
      s.player.currentPlaceId = ticket.placeId;

      ticket.status = 'seen';
      ticket.seen = { at: s.now, room, verdict, note, snacks };

      s.remember({
        category: 'life',
        title: `Saw ${ticket.title}`,
        detail: `${ticket.placeName}, ${SCREEN_LABEL[ticket.screen as Screen] ?? ticket.screen}. ${note} ${room}`,
        refs: [{ type: 'place', id: ticket.placeId }],
        significance: verdict >= 82 || verdict <= 20 ? 4 : 2,
        public: false,
      });
      s.emit('cine.attended', { ticketId: ticket.id, verdict });
      return { verdict, note, room, snacks };
    },
  );

  /** Changing your mind, which the box office allows up to a point. */
  sim.onCommand<{ ticketId: Id }, { refund: Money }>(
    'cine.cancel',
    (p, { sim: s }) => {
      const ticket = s.universe.cinemaTickets[p.ticketId];
      if (!ticket) throw new CommandError('No such ticket.');
      if (ticket.status !== 'booked') throw new CommandError('There is nothing to give back.');
      if (s.now > ticket.at - REFUNDABLE_UNTIL_MINUTES * MS_MINUTE) {
        throw new CommandError(
          `They will not refund inside ${plural(REFUNDABLE_UNTIL_MINUTES / 60, 'hour')} of the showing.`,
        );
      }
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account for the refund to go to.');
      s.income(accountId, ticket.paid, `Cinema refund — ${ticket.title}`, 'refund', { refType: 'place', refId: ticket.placeId });
      ticket.status = 'refunded';
      s.emit('cine.cancelled', { ticketId: ticket.id, refund: ticket.paid });
      return { refund: ticket.paid };
    },
  );

  // --- The showing itself ---------------------------------------------------

  sim.onSchedule('cine.showtime', (item, s) => {
    const ticket = s.universe.cinemaTickets[(item.payload as { ticketId: Id }).ticketId];
    if (!ticket || ticket.status !== 'booked') return;
    s.notify({
      title: `${ticket.title} Is About To Start`,
      body: `${ticket.placeName}, ${SCREEN_LABEL[ticket.screen as Screen] ?? ticket.screen}. ${ticket.certificate}.`,
      category: 'personal',
      importance: 48,
      route: '/workspace/goingout',
      refType: 'place', refId: ticket.placeId,
    });
  });

  /**
   * The doors shut.
   *
   * Nothing is watched on your behalf: a picture you did not sit through is a
   * picture you missed, and the money is gone with the seat.
   */
  sim.onSchedule('cine.doors', (item, s) => {
    const ticket = s.universe.cinemaTickets[(item.payload as { ticketId: Id }).ticketId];
    if (!ticket || ticket.status !== 'booked') return;
    ticket.status = 'missed';
    s.notify({
      title: `You Missed ${ticket.title}`,
      body: `${ticket.placeName}. ${formatMoney(ticket.paid)}, and the seat went empty.`,
      category: 'personal',
      importance: 30,
      route: '/workspace/goingout',
      refType: 'place', refId: ticket.placeId,
    });
    s.emit('cine.missed', { ticketId: ticket.id });
  });
}

export { CHAIN_BY_ID, GENRE_LABEL, SCREEN_LABEL, SNACK_LABEL, SNACK_PRICES };
