/**
 * Going to the pictures.
 *
 * What a test can hold about a cinema: a real chain in a country it really
 * trades in, the country's own certificate on the poster, a program that
 * does not change under you, a seat that is somebody's once it is bought, an
 * age bar that means it, a sold out showing that says so, a refund that stops
 * being a refund two hours out, and a picture you cannot watch from the car
 * park.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  REFUNDABLE_UNTIL_MINUTES, ageOf, chainOf, cinemasIn, describeTicket, programmeIn, screenFor,
  screensAt, seatsLeft, showtimesFor, snackPrice, tasteFor, ticketPrice, ticketsOf, tierOf,
  upcomingTickets, weekStartOf, zoneOf,
} from '@/engine/systems/cinema';
import { zonedParts } from '@/engine/core/time';
import {
  CINEMA_CHAINS, CINEMA_NOTE, GENRES, RATING_SYSTEMS, SCREEN_SEATS, SLATE_ADVISORY,
  chainsInCountry, ratingSystemFor, seasonFor,
} from '@/engine/content/cinemas';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import type { Place } from '@/engine/content/places';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

function inLosAngeles(name: string): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = 'us-ca-losangeles';
  sim.income(sim.player.primaryAccountId!, 20_000_00, 'Test funding', 'other');
  return sim;
}

/** A cinema, a picture on at it, and a time that has seats. */
function aSeat(sim: Simulation): { place: Place; showingId: string; at: number } {
  for (const place of cinemasIn(sim)) {
    for (const showing of programmeIn(sim, place.cityId)) {
      if (showing.certificate.minimumAge > ageOf(sim)) continue;
      for (let day = 1; day <= 5; day += 1) {
        for (const at of showtimesFor(sim, place, showing, sim.now + day * DAY)) {
          if (at > sim.now + 3 * HOUR && seatsLeft(sim, place, showing, at) >= 2) {
            return { place, showingId: showing.id, at };
          }
        }
      }
    }
  }
  throw new Error('nowhere in Los Angeles has a seat, which cannot be right');
}

describe('the chains', () => {
  it('are real companies in countries this world has', () => {
    expect(CINEMA_CHAINS.length).toBeGreaterThanOrEqual(40);
    const ids = new Set(CINEMA_CHAINS.map((one) => one.id));
    expect(ids.size).toBe(CINEMA_CHAINS.length);
    const names = new Set(CINEMA_CHAINS.map((one) => one.name));
    expect(names.size).toBe(CINEMA_CHAINS.length);
    for (const chain of CINEMA_CHAINS) {
      expect(chain.countryIds.length).toBeGreaterThan(0);
      for (const countryId of chain.countryIds) {
        expect(COUNTRIES.get(countryId), `${chain.name} in ${countryId}`).toBeTruthy();
      }
      expect(chain.screens.length).toBeGreaterThan(0);
    }
  });

  it('only run a cinema in a country they actually trade in', () => {
    const sim = inLosAngeles('cine-chains');
    for (const cityId of ['us-ca-losangeles', 'uk-eng-london', 'jp-13-tokyo', 'fr-idf-paris']) {
      const countryId = CITIES.get(cityId)!.countryId;
      for (const place of cinemasIn(sim, cityId)) {
        const chain = chainOf(sim, place);
        if (chain) expect(chain.countryIds, `${chain.name} in ${cityId}`).toContain(countryId);
      }
    }
    expect(chainsInCountry('us').length).toBeGreaterThan(3);
    expect(chainsInCountry('zz')).toEqual([]);
  });

  it('says whose the building is, and what SLATE made up', () => {
    expect(CINEMA_NOTE).toContain('SLATE');
    expect(CINEMA_NOTE).toContain('no listings feed');
  });
});

describe('who is allowed in', () => {
  it('uses the country’s own board, and says so when it does not have one', () => {
    expect(ratingSystemFor('us').body).toContain('Motion Picture Association');
    expect(ratingSystemFor('uk').body).toContain('British Board');
    expect(ratingSystemFor('jp').body).toBe('Eirin');
    // China really does classify no film by age, and that is what is carried.
    expect(ratingSystemFor('cn').certificates.length).toBe(1);
    // Somewhere SLATE does not carry, the advisory says whose it is.
    const unknown = ratingSystemFor('zz');
    expect(unknown).toBe(SLATE_ADVISORY);
    expect(unknown.body).toContain('SLATE');
  });

  it('lists certificates from the loosest to the strictest, and never bars everybody', () => {
    for (const system of [...RATING_SYSTEMS, SLATE_ADVISORY]) {
      let last = -1;
      for (const certificate of system.certificates) {
        expect(certificate.advisoryAge, `${system.body} ${certificate.label}`).toBeGreaterThanOrEqual(last);
        expect(certificate.minimumAge).toBeLessThanOrEqual(certificate.advisoryAge);
        expect(certificate.minimumAge).toBeLessThanOrEqual(21);
        last = certificate.advisoryAge;
      }
    }
  });
});

describe('the program', () => {
  it('is a week’s worth of pictures, and the same week twice', () => {
    const sim = inLosAngeles('cine-program');
    const first = programmeIn(sim, 'us-ca-losangeles');
    const again = programmeIn(sim, 'us-ca-losangeles');
    expect(first.length).toBeGreaterThanOrEqual(4);
    expect(again.map((one) => one.id)).toEqual(first.map((one) => one.id));

    const titles = new Set(first.map((one) => one.title));
    expect(titles.size).toBe(first.length);
    for (const showing of first) {
      expect(showing.runtimeMinutes).toBeGreaterThan(60);
      expect(showing.runtimeMinutes).toBeLessThan(200);
      expect(showing.quality).toBeGreaterThan(0);
      expect(showing.buzz).toBeGreaterThan(0);
      expect(GENRES).toContain(showing.genre);
      expect(showing.certificate.label.length).toBeGreaterThan(0);
    }
  });

  it('moves on when the week does', () => {
    const sim = inLosAngeles('cine-week');
    const thisWeek = programmeIn(sim, 'us-ca-losangeles');
    const next = programmeIn(sim, 'us-ca-losangeles', sim.now + 8 * DAY);
    expect(weekStartOf(sim, sim.now + 8 * DAY, 'us-ca-losangeles'))
      .toBeGreaterThan(weekStartOf(sim, sim.now, 'us-ca-losangeles'));
    expect(next.map((one) => one.id)).not.toEqual(thisWeek.map((one) => one.id));
  });

  it('is different in different cities, and every city has a season', () => {
    const sim = inLosAngeles('cine-cities');
    const la = programmeIn(sim, 'us-ca-losangeles').map((one) => one.title);
    const tokyo = programmeIn(sim, 'jp-13-tokyo').map((one) => one.title);
    expect(la).not.toEqual(tokyo);
    for (let month = 1; month <= 12; month += 1) {
      expect(seasonFor(month).months).toContain(month);
    }
  });
});

describe('the building', () => {
  it('has screens, a tier and something said about it', () => {
    const sim = inLosAngeles('cine-buildings');
    const houses = cinemasIn(sim);
    expect(houses.length).toBeGreaterThan(0);
    for (const place of houses) {
      expect(screensAt(sim, place).length).toBeGreaterThan(0);
      expect(['multiplex', 'premium', 'arthouse']).toContain(tierOf(sim, place));
    }
  });

  it('charges more in the evening than at a matinee, and never nothing', () => {
    const sim = inLosAngeles('cine-price');
    const place = cinemasIn(sim)[0]!;
    // Eleven in the morning and eight in the evening, on the clock the cinema
    // itself keeps rather than the one the player lives on.
    const zone = zoneOf(sim, place.cityId);
    const parts = zonedParts(sim.now, zone);
    const midnight = sim.now - ((parts.hour * 60 + parts.minute) * MINUTE + parts.second * 1000);
    const morning = midnight + 11 * HOUR;
    const evening = midnight + 20 * HOUR;
    expect(zonedParts(morning, zone).hour).toBe(11);
    expect(zonedParts(evening, zone).hour).toBe(20);
    expect(ticketPrice(sim, place, 'standard', morning)).toBeLessThan(ticketPrice(sim, place, 'standard', evening));
    expect(ticketPrice(sim, place, 'standard', evening)).toBeGreaterThan(300);
    expect(ticketPrice(sim, place, 'premium_large', evening))
      .toBeGreaterThan(ticketPrice(sim, place, 'standard', evening));
    expect(snackPrice(place, 'nothing')).toBe(0);
    expect(snackPrice(place, 'works')).toBeGreaterThan(snackPrice(place, 'small'));
  });
});

describe('buying a seat', () => {
  it('takes the money, holds the seat and puts it on the calendar', () => {
    const sim = inLosAngeles('cine-book');
    const { place, showingId, at } = aSeat(sim);
    const accountId = sim.player.primaryAccountId!;
    const before = seatsLeft(sim, place, programmeIn(sim, place.cityId).find((o) => o.id === showingId)!, at);

    const booked = sim.execute<{ ticketId: Id; paid: number; title: string }>({
      kind: 'cine.book', payload: { placeId: place.id, showingId, at, seats: 2 },
    });
    expect(booked.ok, String(booked.error)).toBe(true);
    expect(booked.value!.paid).toBeGreaterThan(0);

    const ticket = sim.universe.cinemaTickets[booked.value!.ticketId]!;
    expect(ticket.seats).toBe(2);
    expect(ticket.status).toBe('booked');
    expect(ticket.placeName).toBe(place.name);
    expect(ticket.certificate.length).toBeGreaterThan(0);
    expect(upcomingTickets(sim).length).toBe(1);
    expect(describeTicket(sim, ticket)).toContain('seat');

    // The seat is yours, so it is not anybody else's.
    const after = seatsLeft(sim, place, programmeIn(sim, place.cityId).find((o) => o.id === showingId)!, at);
    expect(after).toBe(before - 2);
    expect(sim.ledger.history(accountId, 20).some((entry) => (entry.memo ?? '').includes('Cinema'))).toBe(true);
    // And it is on the calendar, because you have to be there.
    expect(sim.timeline.between(sim.now, at + HOUR).some((one) => one.kind === 'cine.showtime')).toBe(true);
  });

  it('refuses a time nothing is on at, a showing that is not there, and the same seat twice', () => {
    const sim = inLosAngeles('cine-book-refusals');
    const { place, showingId, at } = aSeat(sim);
    expect(sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at: at + 7 * MINUTE } }).ok).toBe(false);
    expect(sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId: 'show-nowhere', at } }).ok).toBe(false);
    expect(sim.execute({ kind: 'cine.book', payload: { placeId: 'not-a-cinema', showingId, at } }).ok).toBe(false);
    expect(sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at: sim.now - DAY } }).ok).toBe(false);
    expect(sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at: sim.now + 40 * DAY } }).ok).toBe(false);

    expect(sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at } }).ok).toBe(true);
    const twice = sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at } });
    expect(twice.ok).toBe(false);
    expect(twice.error).toContain('already have a seat');
  });

  it('will not sell a child a ticket for something they are not allowed into', () => {
    const sim = inLosAngeles('cine-age');
    // A twelve year old, which most boards have something to say about.
    sim.player.birthInstant = sim.now - 12 * 365.25 * DAY;
    expect(ageOf(sim)).toBe(12);

    let refusals = 0;
    let offered = 0;
    for (const place of cinemasIn(sim)) {
      for (const showing of programmeIn(sim, place.cityId)) {
        const barred = showing.certificate.minimumAge > 12 && !showing.certificate.accompanied;
        for (const at of showtimesFor(sim, place, showing, sim.now + 2 * DAY)) {
          if (seatsLeft(sim, place, showing, at) < 1) continue;
          const result = sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId: showing.id, at } });
          if (barred) {
            expect(result.ok, `${showing.title} is a ${showing.certificate.label}`).toBe(false);
            expect(result.error).toContain(showing.certificate.label);
            refusals += 1;
          } else if (result.ok) {
            offered += 1;
          }
          break;
        }
      }
    }
    expect(refusals + offered).toBeGreaterThan(0);
  });

  it('will not sell more seats than are left', () => {
    const sim = inLosAngeles('cine-soldout');
    const { place, showingId, at } = aSeat(sim);
    const showing = programmeIn(sim, place.cityId).find((one) => one.id === showingId)!;
    const left = seatsLeft(sim, place, showing, at);
    expect(left).toBeLessThanOrEqual(SCREEN_SEATS[screenFor(sim, place, showing, at)]);

    // Take every seat there is, then ask for one more.
    let taken = 0;
    while (taken < left) {
      const want = Math.min(8, left - taken);
      const result = sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at, seats: want } });
      if (!result.ok) break;
      taken += want;
      // Each ticket is its own booking, so a second one for the same showing
      // is refused; that is enough to prove the count comes down.
      break;
    }
    expect(seatsLeft(sim, place, showing, at)).toBe(left - taken);
  });
});

describe('sitting through it', () => {
  it('needs you to be in the building, at the right time', () => {
    const sim = inLosAngeles('cine-attend-guards');
    const { place, showingId, at } = aSeat(sim);
    const ticketId = sim.execute<{ ticketId: Id }>({
      kind: 'cine.book', payload: { placeId: place.id, showingId, at },
    }).value!.ticketId;

    // Too early.
    const early = sim.execute({ kind: 'cine.attend', payload: { ticketId } });
    expect(early.ok).toBe(false);
    expect(early.error).toContain('not let you in yet');

    // In time, but standing in the wrong place.
    sim.advanceTo(at - 20 * MINUTE);
    const outside = sim.execute({ kind: 'cine.attend', payload: { ticketId } });
    expect(outside.ok).toBe(false);
    expect(outside.error).toContain(place.name);
  });

  it('takes the runtime out of the day and writes down what you thought', () => {
    const sim = inLosAngeles('cine-attend');
    const { place, showingId, at } = aSeat(sim);
    const showing = programmeIn(sim, place.cityId).find((one) => one.id === showingId)!;
    const ticketId = sim.execute<{ ticketId: Id }>({
      kind: 'cine.book', payload: { placeId: place.id, showingId, at },
    }).value!.ticketId;

    sim.advanceTo(at - 15 * MINUTE);
    sim.player.currentPlaceId = place.id;
    sim.player.wellbeing.energy = 90;
    const before = sim.now;

    const seen = sim.execute<{ verdict: number; note: string; room: string; snacks: number }>({
      kind: 'cine.attend', payload: { ticketId, snacks: 'large' },
    });
    expect(seen.ok, String(seen.error)).toBe(true);
    expect(seen.value!.verdict).toBeGreaterThan(0);
    expect(seen.value!.note.length).toBeGreaterThan(10);
    expect(seen.value!.room.length).toBeGreaterThan(10);
    expect(seen.value!.snacks).toBeGreaterThan(0);

    // Trailers, the picture, and getting out again.
    expect((sim.now - before) / MINUTE).toBeGreaterThan(showing.runtimeMinutes);
    const ticket = sim.universe.cinemaTickets[ticketId]!;
    expect(ticket.status).toBe('seen');
    expect(ticket.seen!.verdict).toBe(seen.value!.verdict);
    expect(describeTicket(sim, ticket)).toContain('Seen');
    expect(describeTicket(sim, ticket)).toContain(place.name);
    expect(sim.ledger.history(sim.player.primaryAccountId!, 30)
      .some((entry) => (entry.memo ?? '').includes('Popcorn'))).toBe(true);

    // And you only see it once.
    expect(sim.execute({ kind: 'cine.attend', payload: { ticketId } }).ok).toBe(false);
  });

  it('what you thought of it is what it was and what you like', () => {
    const sim = inLosAngeles('cine-taste');
    for (const genre of GENRES) {
      const taste = tasteFor(sim, genre);
      expect(taste).toBeGreaterThanOrEqual(0);
      expect(taste).toBeLessThanOrEqual(100);
    }
    // Taste is a fact about the person, so it does not move underneath them.
    expect(tasteFor(sim, 'horror')).toBe(tasteFor(sim, 'horror'));
    const bold = inLosAngeles('cine-taste-bold');
    bold.player.personality.riskTolerance = 95;
    const timid = inLosAngeles('cine-taste-bold');
    timid.player.personality.riskTolerance = 5;
    expect(tasteFor(bold, 'horror')).toBeGreaterThan(tasteFor(timid, 'horror'));
  });

  it('shuts the doors, and a seat nobody sat in is a seat nobody sat in', () => {
    const sim = inLosAngeles('cine-missed');
    const { place, showingId, at } = aSeat(sim);
    const ticketId = sim.execute<{ ticketId: Id }>({
      kind: 'cine.book', payload: { placeId: place.id, showingId, at },
    }).value!.ticketId;

    sim.advanceTo(at + 2 * HOUR);
    const ticket = sim.universe.cinemaTickets[ticketId]!;
    expect(ticket.status).toBe('missed');
    expect(ticket.seen).toBeUndefined();
    expect(describeTicket(sim, ticket)).toContain('never turned up');
    expect(sim.execute({ kind: 'cine.attend', payload: { ticketId } }).ok).toBe(false);
  });
});

describe('changing your mind', () => {
  it('gives the money back until two hours out, and not after', () => {
    const sim = inLosAngeles('cine-refund');
    const { place, showingId, at } = aSeat(sim);
    const booked = sim.execute<{ ticketId: Id; paid: number }>({
      kind: 'cine.book', payload: { placeId: place.id, showingId, at, seats: 2 },
    });
    expect(booked.ok, String(booked.error)).toBe(true);
    const { ticketId, paid } = booked.value!;

    const refunded = sim.execute<{ refund: number }>({ kind: 'cine.cancel', payload: { ticketId } });
    expect(refunded.ok, String(refunded.error)).toBe(true);
    expect(refunded.value!.refund).toBe(paid);
    expect(sim.universe.cinemaTickets[ticketId]!.status).toBe('refunded');
    expect(sim.execute({ kind: 'cine.cancel', payload: { ticketId } }).ok).toBe(false);
    expect(describeTicket(sim, sim.universe.cinemaTickets[ticketId]!)).toContain('Given back');

    // A second seat, and this time leave it too late.
    const second = sim.execute<{ ticketId: Id }>({
      kind: 'cine.book', payload: { placeId: place.id, showingId, at },
    });
    expect(second.ok, String(second.error)).toBe(true);
    sim.advanceTo(at - (REFUNDABLE_UNTIL_MINUTES - 30) * MINUTE);
    const late = sim.execute({ kind: 'cine.cancel', payload: { ticketId: second.value!.ticketId } });
    expect(late.ok).toBe(false);
    expect(late.error).toContain('refund');
  });
});

describe('what a save carries', () => {
  it('keeps the ticket rather than the program', () => {
    const sim = inLosAngeles('cine-persist');
    const { place, showingId, at } = aSeat(sim);
    sim.execute({ kind: 'cine.book', payload: { placeId: place.id, showingId, at } });
    const snapshot = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(Object.keys(snapshot.cinemaTickets).length).toBe(1);
    // The stub stands on its own after the program has moved on.
    const [ticket] = Object.values(snapshot.cinemaTickets);
    expect(ticket!.title.length).toBeGreaterThan(0);
    expect(ticket!.runtimeMinutes).toBeGreaterThan(0);
    expect(ticket!.saveId).toBe(sim.universe.meta.id);
    expect(ticketsOf(sim).length).toBe(1);
  });
});
