/**
 * A night out.
 *
 * What a test can hold about going out in town: real venues in the cities
 * they really stand in, a sport only on when its season really runs, a
 * listing that does not change under you, a card that names no club and no
 * real act, a room that does not take two bookings on one night, a seat
 * that is yours once you have bought it, doors that shut, and a night that
 * is what it was against what you like.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ageOf, describeTicket, eventById, eventsAt, eventsIn, priceOf, seatsLeft, tasteFor, ticketsOf,
  upcomingTickets, venuesIn, whatIsOn,
} from '@/engine/systems/going';
import {
  BAND_SHARE, GOING_LABEL, GOING_NOTE, REFUNDABLE_UNTIL_MINUTES, RUNS_MINUTES, SPORTS,
  VENUE_SEATS, sportsIn,
} from '@/engine/content/going';
import { zoneOf } from '@/engine/systems/cinema';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import type { Place } from '@/engine/content/places';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

function inLondon(name: string): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = 'uk-eng-london';
  sim.universe.currentZone = 'Europe/London';
  sim.income(sim.player.primaryAccountId!, 400_000_00, 'Test funding', 'other');
  return sim;
}

/** Something on with seats, far enough ahead to buy for. */
function aSeat(sim: Simulation): { place: Place; eventId: string; at: number; card: string } {
  for (const { place, event } of whatIsOn(sim)) {
    if (event.at < sim.now + 6 * HOUR) continue;
    if (seatsLeft(sim, place, event, 'middle') < 2) continue;
    return { place, eventId: event.id, at: event.at, card: event.card };
  }
  throw new Error('nothing at all is on in London with a seat, which cannot be right');
}

describe('the venues', () => {
  it('are real buildings in the cities they really stand in', () => {
    const sim = inLondon('going-venues');
    for (const cityId of ['uk-eng-london', 'us-ny-newyork', 'at-09-vienna', 'jp-13-tokyo']) {
      const venues = venuesIn(sim, cityId);
      expect(venues.length, cityId).toBeGreaterThan(0);
      for (const venue of venues) expect(venue.cityId).toBe(cityId);
      // The named ones are on the record and say so.
      expect(venues.some((one) => one.real), cityId).toBe(true);
    }
    expect(venuesIn(sim, 'uk-eng-london').map((one) => one.name)).toContain('Royal Albert Hall');
    expect(venuesIn(sim, 'us-ny-newyork').map((one) => one.name)).toContain('Madison Square Garden');
    expect(venuesIn(sim, 'at-09-vienna').map((one) => one.name)).toContain('The Musikverein');
  });

  it('holds a room of every kind somewhere, and none of them empty', () => {
    for (const [kind, seats] of Object.entries(VENUE_SEATS)) {
      expect(seats, kind).toBeGreaterThan(100);
      expect(seats, kind).toBeLessThan(120_000);
    }
  });

  it('says the card is its own and names no club', () => {
    expect(GOING_NOTE).toContain('SLATE');
    expect(GOING_NOTE).toContain('no listings feed');
    expect(GOING_NOTE).toContain('names no club');
  });
});

describe('the sporting year', () => {
  it('runs every sport in the countries that follow it and the months it plays', () => {
    for (const sport of SPORTS) {
      expect(sport.months.length).toBeGreaterThan(0);
      expect(sport.months.length).toBeLessThanOrEqual(10);
      expect(sport.countryIds.length).toBeGreaterThan(0);
      for (const countryId of sport.countryIds) {
        expect(COUNTRIES.get(countryId), `${sport.label} in ${countryId}`).toBeTruthy();
      }
      // A card never names a club, because a made-up result attached to a real
      // one would be a claim about somebody real.
      for (const card of sport.cards) {
        expect(card).not.toMatch(/\b(United|City|Rovers|Yankees|Lakers|Real |FC )\b/);
      }
    }
  });

  it('keeps cricket to two hemispheres rather than one long year', () => {
    const cricket = SPORTS.filter((one) => one.label === 'Cricket');
    expect(cricket.length).toBe(2);
    const northern = cricket.find((one) => one.countryIds.includes('uk'))!;
    const southern = cricket.find((one) => !one.countryIds.includes('uk'))!;
    // No test match in an English March, and none in an Australian July.
    expect(northern.months).not.toContain(3);
    expect(northern.months).toContain(7);
    expect(southern.months).toContain(1);
    expect(southern.months).not.toContain(7);
  });

  it('only puts a match on where the sport is followed and in season', () => {
    const sim = inLondon('going-seasons');
    for (const cityId of ['uk-eng-london', 'us-ny-newyork', 'in-16-mumbai', 'au-vic-melbourne']) {
      const country = CITIES.get(cityId)!.countryId;
      for (let week = 0; week < 20; week += 1) {
        for (const { place, event } of whatIsOn(sim, cityId, sim.now + week * 7 * DAY)) {
          if (event.kind !== 'match') continue;
          const label = event.card.split(':')[0]!;
          const followed = sportsIn(country).filter((one) => one.label === label);
          expect(followed.length, `${label} in ${cityId}`).toBeGreaterThan(0);
          const month = zonedParts(event.at, zoneOf(sim, cityId)).month;
          expect(followed.some((one) => one.months.includes(month)), `${label} in ${cityId} month ${month}`).toBe(true);
          const vk = place.kind === 'arena' ? 'arena' : 'stadium';
          expect(followed.some((one) => one.venueKind === vk), `${label} in a ${place.kind}`).toBe(true);
        }
      }
    }
  });

  it('gives Melbourne something on in its own winter', () => {
    const sim = inLondon('going-melbourne');
    const winter = [];
    for (let week = 0; week < 52; week += 1) {
      const at = sim.now + week * 7 * DAY;
      const month = new Date(at).getUTCMonth() + 1;
      if (month < 6 || month > 8) continue;
      winter.push(...whatIsOn(sim, 'au-vic-melbourne', at).filter((one) => one.event.kind === 'match'));
    }
    expect(winter.length).toBeGreaterThan(0);
  });
});

describe('what is on', () => {
  it('is the same week twice, and moves when the week does', () => {
    const sim = inLondon('going-listing');
    const first = whatIsOn(sim);
    const again = whatIsOn(sim);
    expect(again.map((one) => one.event.id)).toEqual(first.map((one) => one.event.id));
    expect(first.length).toBeGreaterThan(4);

    const next = whatIsOn(sim, 'uk-eng-london', sim.now + 9 * DAY);
    expect(next.map((one) => one.event.id)).not.toEqual(first.map((one) => one.event.id));
  });

  it('does not book a room twice on one night, or run one act in two rooms', () => {
    const sim = inLondon('going-clashes');
    for (const cityId of ['uk-eng-london', 'us-ny-newyork', 'de-be-berlin', 'jp-13-tokyo']) {
      const zone = zoneOf(sim, cityId);
      const bookings = new Set<string>();
      const cards = new Map<string, string>();
      for (const { place, event } of whatIsOn(sim, cityId)) {
        const local = zonedParts(event.at, zone);
        const slot = `${place.id}@${local.year}-${local.month}-${local.day}`;
        if (event.kind !== 'exhibition') {
          expect(bookings.has(slot), `${place.name} twice on one day`).toBe(false);
          bookings.add(slot);
        }
        const where = cards.get(event.card);
        if (where) expect(where, `"${event.card}" in two rooms`).toBe(place.id);
        cards.set(event.card, place.id);
      }
    }
  });

  it('runs one exhibition and one production all week rather than a new one nightly', () => {
    const sim = inLondon('going-runs');
    for (const cityId of ['uk-eng-london', 'us-ny-newyork', 'at-09-vienna']) {
      for (const place of venuesIn(sim, cityId)) {
        for (const kind of ['exhibition', 'play', 'opera'] as const) {
          const shows = eventsAt(sim, place, sim.now).filter((one) => one.kind === kind);
          if (shows.length < 2) continue;
          const titles = new Set(shows.map((one) => one.card));
          expect(titles.size, `${place.name} changed its ${kind} mid-week`).toBe(1);
        }
      }
    }
  });

  it('starts things at hours a person would actually go out at', () => {
    const sim = inLondon('going-hours');
    for (const { place, event } of whatIsOn(sim)) {
      const hour = zonedParts(event.at, zoneOf(sim, place.cityId)).hour;
      if (event.kind === 'exhibition') {
        expect(hour, `${event.card} at ${hour}`).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThanOrEqual(16);
      } else if (event.kind === 'club_night') {
        expect(hour).toBeGreaterThanOrEqual(21);
      } else {
        expect(hour, `${event.card} at ${hour}`).toBeGreaterThanOrEqual(12);
        expect(hour).toBeLessThanOrEqual(22);
      }
    }
  });

  it('finds a thing by its id, and nothing by a made-up one', () => {
    const sim = inLondon('going-lookup');
    const { eventId } = aSeat(sim);
    expect(eventById(sim, 'uk-eng-london', eventId)?.event.id).toBe(eventId);
    expect(eventById(sim, 'uk-eng-london', 'not-an-event')).toBeUndefined();
    expect(eventsIn(sim, 'uk-eng-london').length).toBeGreaterThan(0);
  });
});

describe('buying a seat', () => {
  it('charges the band, holds the seat and puts it on the calendar', () => {
    const sim = inLondon('going-book');
    const { place, eventId, at } = aSeat(sim);
    const event = eventsIn(sim, 'uk-eng-london').find((one) => one.id === eventId)!;
    const before = seatsLeft(sim, place, event, 'middle');
    const accountId = sim.player.primaryAccountId!;

    const booked = sim.execute<{ ticketId: Id; paid: number; card: string }>({
      kind: 'going.book', payload: { placeId: place.id, eventId, band: 'middle', seats: 2 },
    });
    expect(booked.ok, String(booked.error)).toBe(true);
    expect(booked.value!.paid).toBe(priceOf(place, event.kind, 'middle') * 2);

    const ticket = sim.universe.goingTickets[booked.value!.ticketId]!;
    expect(ticket.seats).toBe(2);
    expect(ticket.status).toBe('booked');
    expect(ticket.placeName).toBe(place.name);
    expect(upcomingTickets(sim).length).toBe(1);
    expect(seatsLeft(sim, place, event, 'middle')).toBe(before - 2);
    expect(sim.ledger.history(accountId, 20).some((e) => (e.memo ?? '').includes(event.card))).toBe(true);
    expect(sim.timeline.between(sim.now, at + HOUR).some((one) => one.kind === 'going.showtime')).toBe(true);
  });

  it('charges more for the good seats than the cheap ones', () => {
    const sim = inLondon('going-bands');
    const { place } = aSeat(sim);
    const best = priceOf(place, 'concert', 'best');
    const middle = priceOf(place, 'concert', 'middle');
    const cheap = priceOf(place, 'concert', 'cheap');
    expect(best).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(cheap);
    expect(cheap).toBeGreaterThan(400);
    expect(BAND_SHARE.best).toBeGreaterThan(BAND_SHARE.cheap);
  });

  it('refuses a thing that is not on, one that has started, and the same seat twice', () => {
    const sim = inLondon('going-book-refusals');
    const { place, eventId } = aSeat(sim);
    expect(sim.execute({ kind: 'going.book', payload: { placeId: place.id, eventId: 'nope' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'going.book', payload: { placeId: 'not-a-venue', eventId } }).ok).toBe(false);

    expect(sim.execute({ kind: 'going.book', payload: { placeId: place.id, eventId, band: 'middle' } }).ok).toBe(true);
    const twice = sim.execute({ kind: 'going.book', payload: { placeId: place.id, eventId, band: 'middle' } });
    expect(twice.ok).toBe(false);
    expect(twice.error).toContain('already have a seat');
  });
});

describe('going', () => {
  function withASeat(name: string): { sim: Simulation; ticketId: Id; at: number; place: Place } {
    const sim = inLondon(name);
    const { place, eventId, at } = aSeat(sim);
    const booked = sim.execute<{ ticketId: Id }>({
      kind: 'going.book', payload: { placeId: place.id, eventId, band: 'middle' },
    });
    expect(booked.ok, String(booked.error)).toBe(true);
    return { sim, ticketId: booked.value!.ticketId, at, place };
  }

  it('will not let you in early or from another city', () => {
    const { sim, ticketId, at } = withASeat('going-attend-guards');
    const early = sim.execute({ kind: 'going.attend', payload: { ticketId } });
    expect(early.ok).toBe(false);
    expect(early.error).toMatch(/n[o’]t open yet/);

    sim.advanceTo(at - 20 * MINUTE);
    sim.player.currentLocationId = 'us-ca-losangeles';
    const away = sim.execute({ kind: 'going.attend', payload: { ticketId } });
    expect(away.ok).toBe(false);
    expect(away.error).toMatch(/you (are(n’t| not)|aren’t)/);
  });

  it('takes the evening, writes down the night, and only counts once', () => {
    const { sim, ticketId, at } = withASeat('going-attend');
    const ticket = sim.universe.goingTickets[ticketId]!;
    sim.advanceTo(at - 20 * MINUTE);
    sim.player.wellbeing.energy = 90;
    const before = sim.now;

    const went = sim.execute<{ verdict: number; note: string; house: string }>({
      kind: 'going.attend', payload: { ticketId },
    });
    expect(went.ok, String(went.error)).toBe(true);
    expect(went.value!.verdict).toBeGreaterThan(0);
    expect(went.value!.verdict).toBeLessThanOrEqual(100);
    expect(went.value!.note.length).toBeGreaterThan(10);
    expect(went.value!.house.length).toBeGreaterThan(10);
    expect((sim.now - before) / MINUTE).toBeGreaterThan(RUNS_MINUTES[ticket.kind as keyof typeof RUNS_MINUTES]);

    expect(ticket.status).toBe('went');
    expect(ticket.went!.verdict).toBe(went.value!.verdict);
    expect(describeTicket(sim, ticket)).toContain(ticket.placeName);
    expect(sim.execute({ kind: 'going.attend', payload: { ticketId } }).ok).toBe(false);
  });

  it('what you made of it is what it was and what you like', () => {
    const sim = inLondon('going-taste');
    for (const kind of Object.keys(GOING_LABEL) as (keyof typeof GOING_LABEL)[]) {
      const taste = tasteFor(sim, kind);
      expect(taste).toBeGreaterThanOrEqual(0);
      expect(taste).toBeLessThanOrEqual(100);
    }
    expect(tasteFor(sim, 'opera')).toBe(tasteFor(sim, 'opera'));
    const outgoing = inLondon('going-taste-out');
    outgoing.player.personality.extraversion = 95;
    const quiet = inLondon('going-taste-out');
    quiet.player.personality.extraversion = 5;
    expect(tasteFor(outgoing, 'club_night')).toBeGreaterThan(tasteFor(quiet, 'club_night'));
  });

  it('shuts the doors, and a seat nobody sat in stays empty', () => {
    const { sim, ticketId, at } = withASeat('going-missed');
    sim.advanceTo(at + 3 * HOUR);
    const ticket = sim.universe.goingTickets[ticketId]!;
    expect(ticket.status).toBe('missed');
    expect(ticket.went).toBeUndefined();
    expect(describeTicket(sim, ticket)).toContain('never turned up');
    expect(sim.execute({ kind: 'going.attend', payload: { ticketId } }).ok).toBe(false);
  });
});

describe('changing your mind', () => {
  it('gives the money back until three hours out, and not after', () => {
    const sim = inLondon('going-refund');
    const { place, eventId, at } = aSeat(sim);
    const booked = sim.execute<{ ticketId: Id; paid: number }>({
      kind: 'going.book', payload: { placeId: place.id, eventId, band: 'best', seats: 2 },
    });
    expect(booked.ok, String(booked.error)).toBe(true);
    const { ticketId, paid } = booked.value!;

    if (sim.now < at - REFUNDABLE_UNTIL_MINUTES * MINUTE) {
      const refunded = sim.execute<{ refund: number }>({ kind: 'going.cancel', payload: { ticketId } });
      expect(refunded.ok, String(refunded.error)).toBe(true);
      expect(refunded.value!.refund).toBe(paid);
      expect(sim.universe.goingTickets[ticketId]!.status).toBe('refunded');
      expect(sim.execute({ kind: 'going.cancel', payload: { ticketId } }).ok).toBe(false);
    }

    const second = sim.execute<{ ticketId: Id }>({
      kind: 'going.book', payload: { placeId: place.id, eventId, band: 'cheap' },
    });
    if (second.ok) {
      sim.advanceTo(at - 30 * MINUTE);
      const late = sim.execute({ kind: 'going.cancel', payload: { ticketId: second.value!.ticketId } });
      expect(late.ok).toBe(false);
      expect(late.error).toContain('refund');
    }
  });
});

describe('what a save carries', () => {
  it('keeps the stub rather than the listing', () => {
    const sim = inLondon('going-persist');
    const { place, eventId } = aSeat(sim);
    sim.execute({ kind: 'going.book', payload: { placeId: place.id, eventId } });
    const snapshot = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(Object.keys(snapshot.goingTickets).length).toBe(1);
    const [ticket] = Object.values(snapshot.goingTickets);
    expect(ticket!.card.length).toBeGreaterThan(0);
    expect(ticket!.placeName.length).toBeGreaterThan(0);
    expect(ticket!.saveId).toBe(sim.universe.meta.id);
    expect(ticketsOf(sim).length).toBe(1);
    expect(ageOf(sim)).toBeGreaterThan(0);
  });
});
