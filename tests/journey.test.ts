/**
 * The journey: a flight as a day.
 *
 * Three hours before a flight it asks; the gate closes on a player who never
 * went, and the fare says what that costs. Played, it is packing, the run
 * to the airport, the desk, the gate with its delay or cancellation, the
 * air, the carousel and the hotel; every step is a command with a price on
 * the line first, the landing is the travel system's own arrival, and a
 * lost bag comes back. Airlines and hotel brands are real names; every
 * route, fare and rate is SLATE's own, and the tests hold that too.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays } from '@/engine/core/time';
import type { FlightBooking } from '@/engine/domain/model';
import { CITIES } from '@/engine/content/geography';
import { AIRLINES, HOTEL_BRANDS, REAL_CARRIER_NOTE, airlinesFor, searchFlights } from '@/engine/systems/travel';
import {
  BAG_RETURN_DAYS, GATE_CLOSE_MINUTES, WINDOW_HOURS, airportRuns, bagFee, changeFee, documentsFor, flyable, fromCityOf, hotelOnArrival, seatOptions, toCityOf,
} from '@/engine/systems/journey';
import { activeScene, sceneView } from '@/engine/systems/scenes';
import { driveableVehicle } from '@/engine/systems/places';

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function aLife(seed = 'journey', funding = 200_000_00): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

function balance(sim: Simulation): number {
  return sim.ledger.account(sim.player.primaryAccountId!).balance;
}

function txns(sim: Simulation, memo: RegExp, refId?: string) {
  return sim.ledger.history(sim.player.primaryAccountId!, 500).filter((t) => memo.test(t.memo) && (!refId || t.refId === refId));
}

/** A flight to New York (or London from New York) in a few days, in the cabin asked for. */
function booked(sim: Simulation, opts: { cabin?: FlightBooking['cabin']; refundable?: boolean; daysOut?: number; to?: string } = {}): FlightBooking {
  const to = opts.to ?? (sim.player.currentLocationId === 'us-ny-newyork' ? 'uk-eng-london' : 'us-ny-newyork');
  const departAt = addDays(sim.now, opts.daysOut ?? 5, sim.homeZone) + 10 * MS_HOUR;
  const { bookingId } = must<{ bookingId: string }>(sim, 'travel.book_flight', { toCityId: to, departAt, cabin: opts.cabin ?? 'economy', refundable: opts.refundable ?? false });
  return sim.universe.flightBookings[bookingId]!;
}

function dueSoon(sim: Simulation, booking: FlightBooking): void {
  sim.advanceTo(booking.departAt - 3 * MS_HOUR + MS_MINUTE);
}

function decisionFor(sim: Simulation, refId: string) {
  return Object.values(sim.universe.decisions).find((d) => d.refType === 'flight' && d.refId === refId && !d.resolvedAt);
}

function choose(sim: Simulation, choiceId: string) {
  const scene = activeScene(sim)!;
  return must<{ status: string }>(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId });
}

describe('real names, honest labels', () => {
  it('routes are flown by real carriers that plausibly serve them, and the label says whose the fare is', () => {
    const sim = aLife('carriers');
    expect(AIRLINES.every((a) => a.name.length > 2 && a.code.length === 2)).toBe(true);
    const domestic = airlinesFor('us', 'us', 4000);
    expect(domestic.every((a) => a.countryId === 'us')).toBe(true);
    const longHaul = airlinesFor('us', 'gb', 5500);
    expect(longHaul.some((a) => a.countryId === 'gb')).toBe(true);
    expect(longHaul.every((a) => a.longHaul)).toBe(true);
    const options = searchFlights(sim, 'us-ca-losangeles', 'uk-eng-london', sim.now + 5 * MS_DAY);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) expect(AIRLINES.some((a) => a.code === o.airlineCode && a.name === o.airlineName)).toBe(true);
    expect(REAL_CARRIER_NOTE).toMatch(/SLATE's own/);
    expect(Object.values(HOTEL_BRANDS).flat().length).toBeGreaterThan(15);
  });
});

describe('the day comes round', () => {
  beforeAll(async () => { await loadAllSections(); });

  it('three hours before, it asks; the gate closes on a player who never went and the fare says what that costs', () => {
    const sim = aLife('gate');
    const booking = booked(sim);
    dueSoon(sim, booking);
    const decision = decisionFor(sim, booking.id)!;
    expect(decision.title).toMatch(/^Fly To /);
    expect(decision.actions.map((a) => a.label)).toEqual(['Play It Out', 'Just Go', 'Stay Home']);
    expect(sim.timeline.pending().some((i) => i.kind === 'travel.gate_closes' && i.refId === booking.id)).toBe(true);
    sim.advanceTo(booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE + MS_MINUTE);
    expect(booking.status).toBe('missed');
    expect(txns(sim, /Refund/, booking.id).length).toBe(0);
    expect(decisionFor(sim, booking.id)!.title).toMatch(/^Rebook To /);
    expect(sim.universe.notifications.some((n) => /^Missed /.test(n.title) && /gone/.test(n.body))).toBe(true);
    expect(sim.player.currentLocationId).toBe(fromCityOf(booking));
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a refundable fare comes back when the flight is missed, and staying home is a choice', () => {
    const sim = aLife('refundable');
    const booking = booked(sim, { refundable: true });
    dueSoon(sim, booking);
    must(sim, 'travel.no_show', { bookingId: booking.id });
    expect(booking.status).toBe('missed');
    expect(txns(sim, /Refund/, booking.id).length).toBe(1);
    expect(changeFee(booking)).toBe(0);
  });

  it('being in another city is a missed flight, and rebooking finds the next one for the fee', () => {
    const sim = aLife('elsewhere');
    const booking = booked(sim);
    const before = balance(sim);
    sim.player.currentLocationId = 'uk-eng-london';
    dueSoon(sim, booking);
    expect(booking.status).toBe('missed');
    sim.player.currentLocationId = fromCityOf(booking)!;
    const { replacementId, departAt } = must<{ replacementId: string; departAt: number }>(sim, 'travel.rebook', { bookingId: booking.id });
    const replacement = sim.universe.flightBookings[replacementId]!;
    expect(replacement.status).toBe('booked');
    expect(departAt).toBeGreaterThan(sim.now);
    expect(booking.replacedBy).toBe(replacementId);
    expect(balance(sim)).toBeLessThan(before);
    expect(attempt(sim, 'travel.rebook', { bookingId: booking.id }).error).toMatch(/already/);
    expect(sim.timeline.pending().some((i) => i.kind === 'travel.depart' && i.refId === replacementId)).toBe(true);
  });

  it('moving a flight is the change fee plus any difference, and the old booking is changed, not lost', () => {
    const sim = aLife('move');
    const booking = booked(sim);
    const { replacementId, fee } = must<{ replacementId: string; fee: number }>(sim, 'travel.change_flight', { bookingId: booking.id, departAt: addDays(sim.now, 12, sim.homeZone) + 9 * MS_HOUR });
    expect(booking.status).toBe('changed');
    expect(fee).toBeGreaterThanOrEqual(changeFee(booking));
    expect(sim.universe.flightBookings[replacementId]!.departAt).toBeGreaterThan(booking.departAt);
    expect(sim.timeline.pending().some((i) => i.refId === booking.id)).toBe(false);
    expect(attempt(sim, 'travel.change_flight', { bookingId: booking.id, departAt: sim.now + 5 * MS_DAY }).ok).toBe(false);
  });
});

describe('the day, played', () => {
  beforeAll(async () => { await loadAllSections(); });

  it('packing, the run, the desk, the gate, the air, the carousel and the hotel, each priced first', () => {
    const sim = aLife('play');
    const booking = booked(sim, { cabin: 'economy' });
    const toCity = toCityOf(booking)!;
    must(sim, 'travel.book_hotel', { cityId: toCity, checkInAt: booking.arriveAt - 6 * MS_HOUR, nights: 3, roomClass: 'deluxe' });
    const hotel = hotelOnArrival(sim, booking)!;
    expect(hotel).toBeDefined();
    expect(Object.values(HOTEL_BRANDS).flat().some((b) => hotel.hotelName.startsWith(b))).toBe(true);
    dueSoon(sim, booking);
    expect(flyable(sim, booking).ok).toBe(true);
    expect(documentsFor(sim, booking).international).toBe(fromCityOf(booking) !== undefined && CITIES.get(fromCityOf(booking)!)!.countryId !== CITIES.get(toCity)!.countryId);
    must(sim, 'scene.start', { definitionId: 'travel.flight', input: { bookingId: booking.id }, refType: 'flight', refId: booking.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('pack');
    const pack = sceneView(sim, scene);
    expect(pack.choices.map((c) => c.id)).toEqual(['bag:carry_on', 'bag:checked']);
    const fee = bagFee(sim, booking);
    expect(fee).toBeGreaterThan(0);
    const before = balance(sim);
    choose(sim, 'bag:checked');
    expect(booking.bag).toBe('checked');
    expect(before - balance(sim)).toBe(fee);
    expect(decisionFor(sim, booking.id)).toBeUndefined();
    scene = activeScene(sim)!;
    expect(scene.node).toBe('airport');
    const runs = airportRuns(sim, booking);
    expect(runs.map((r) => r.mode)).toEqual(['taxi', 'transit', 'drive']);
    const hasCar = Boolean(driveableVehicle(sim));
    expect(Boolean(runs[2]!.disabled)).toBe(!hasCar);
    const airport = sceneView(sim, scene);
    expect(Boolean(airport.choices.find((c) => c.id === 'run:drive')!.disabled)).toBe(!hasCar);
    choose(sim, 'run:taxi');
    expect(booking.status).toBe('booked');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('desk');
    const seats = seatOptions(sim, booking);
    expect(seats.map((s) => s.id)).toEqual(['keep', 'window', 'aisle', 'legroom']);
    choose(sim, 'seat:legroom');
    expect(booking.status).toBe('checked_in');
    expect(booking.seats[0]).toBe('14C');
    expect(booking.extras).toBe(fee + seats[3]!.cost + runs[0]!.cost);
    scene = activeScene(sim)!;
    expect(scene.node).toBe('gate');
    choose(sim, 'board');
    scene = activeScene(sim)!;
    if (scene.node === 'done') {
      // The airline cancelled and moved you; that is a real outcome and the test accepts it.
      expect(booking.status).toBe('changed');
      expect(booking.replacedBy).toBeDefined();
      return;
    }
    expect(scene.node).toBe('air');
    expect(booking.boardedAt).toBeDefined();
    const energy = sim.player.wellbeing.energy;
    choose(sim, 'do:sleep');
    expect(booking.status).toBe('flown');
    expect(sim.player.currentLocationId).toBe(toCity);
    expect(sim.player.wellbeing.travelFatigue).toBeGreaterThan(0);
    void energy;
    scene = activeScene(sim)!;
    expect(scene.node).toBe('land');
    choose(sim, 'bags');
    expect(booking.bagsClaimedAt).toBeDefined();
    scene = activeScene(sim)!;
    expect(scene.node).toBe('town');
    const town = sceneView(sim, scene);
    expect(town.choices[0]!.label).toBe('A Cab To The Hotel');
    choose(sim, 'go:taxi');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('done');
    expect(hotel.status).toBe('checked_in');
    const done = sceneView(sim, scene);
    expect(done.facts!.find((f) => f.label === 'The Day Added')!.value).toBe(`$${(booking.extras! / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    choose(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('reaching the airport after the gate has closed is a missed flight, in the scene', () => {
    const sim = aLife('late');
    const booking = booked(sim);
    sim.advanceTo(booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE - 20 * MS_MINUTE);
    must(sim, 'scene.start', { definitionId: 'travel.flight', input: { bookingId: booking.id }, refType: 'flight', refId: booking.id });
    choose(sim, 'bag:carry_on');
    choose(sim, 'run:transit');
    expect(activeScene(sim)!.node).toBe('missed');
    expect(booking.status).toBe('missed');
    expect(sceneView(sim, activeScene(sim)!).text).toMatch(/gate/);
    choose(sim, 'finish');
  });

  it('the short version flies the whole day by its defaults and lands you there', () => {
    const sim = aLife('quick');
    const booking = booked(sim, { cabin: 'business' });
    dueSoon(sim, booking);
    const result = must<{ landedIn?: string; cancelled: boolean; missed: boolean }>(sim, 'travel.fly', { bookingId: booking.id });
    if (result.cancelled) { expect(booking.replacedBy).toBeDefined(); return; }
    expect(result.missed).toBe(false);
    expect(result.landedIn).toBe(toCityOf(booking));
    expect(booking.bag).toBe('carry_on');
    expect(booking.status).toBe('flown');
    expect(sim.player.currentLocationId).toBe(toCityOf(booking));
    expect(bagFee(sim, booking)).toBe(0);
  });

  it('the day cannot start early, from the wrong city, or twice', () => {
    const sim = aLife('window');
    const booking = booked(sim);
    expect(flyable(sim, booking).reason).toMatch(/three hours before/);
    sim.advanceTo(booking.departAt - WINDOW_HOURS * MS_HOUR + MS_MINUTE);
    expect(flyable(sim, booking).ok).toBe(true);
    expect(attempt(sim, 'travel.to_airport', { bookingId: booking.id, mode: 'taxi' }).error).toMatch(/Pack first/);
    must(sim, 'travel.pack', { bookingId: booking.id, bag: 'carry_on' });
    expect(attempt(sim, 'travel.pack', { bookingId: booking.id, bag: 'carry_on' }).error).toMatch(/packed already/);
    expect(attempt(sim, 'travel.board', { bookingId: booking.id }).error).toMatch(/Check in first/);
  });

  it('a lost bag comes back in two days, and travel cover asks to claim', () => {
    // Find a seed where the carousel loses the bag, so the path is held, not hoped for.
    for (let i = 0; i < 60; i++) {
      const sim = aLife(`bag-${i}`);
      const booking = booked(sim);
      dueSoon(sim, booking);
      const { quoteId } = must<{ quoteId: string }>(sim, 'ins.quote', { line: 'travel' });
      must(sim, 'ins.purchase', { quoteId });
      must(sim, 'travel.pack', { bookingId: booking.id, bag: 'checked' });
      must(sim, 'travel.to_airport', { bookingId: booking.id, mode: 'taxi' });
      must(sim, 'travel.check_in_flight', { bookingId: booking.id, seat: 'keep' });
      const gate = must<{ cancelled: boolean }>(sim, 'travel.board', { bookingId: booking.id });
      if (gate.cancelled) continue;
      must(sim, 'travel.inflight', { bookingId: booking.id, activity: 'watch' });
      const { lost } = must<{ lost: boolean }>(sim, 'travel.claim_bags', { bookingId: booking.id });
      if (!lost) continue;
      expect(booking.bagLost).toBe(true);
      expect(decisionFor(sim, booking.id)!.title).toBe('Claim For The Bag');
      expect(decisionFor(sim, booking.id)!.actions[0]!.commandKind).toBe('ins.file_claim');
      sim.advanceTo(addDays(sim.now, BAG_RETURN_DAYS, sim.homeZone) + MS_HOUR);
      expect(booking.bagReturnedAt).toBeDefined();
      expect(sim.universe.notifications.some((n) => n.title === 'Your Bag Is Back')).toBe(true);
      return;
    }
    throw new Error('No seed lost a bag in sixty tries; the chance is not what the constant says.');
  });

  it('when the airline cancels at the gate it moves you at no cost', () => {
    for (let i = 0; i < 80; i++) {
      const sim = aLife(`cancel-${i}`);
      const booking = booked(sim);
      dueSoon(sim, booking);
      must(sim, 'travel.pack', { bookingId: booking.id, bag: 'carry_on' });
      must(sim, 'travel.to_airport', { bookingId: booking.id, mode: 'taxi' });
      must(sim, 'travel.check_in_flight', { bookingId: booking.id, seat: 'keep' });
      const before = balance(sim);
      const gate = must<{ cancelled: boolean; replacement?: string }>(sim, 'travel.board', { bookingId: booking.id });
      if (!gate.cancelled) continue;
      expect(booking.status).toBe('changed');
      expect(gate.replacement).toBeDefined();
      expect(balance(sim)).toBe(before);
      expect(sim.universe.flightBookings[gate.replacement!]!.status).toBe('booked');
      expect(sim.universe.notifications.some((n) => /Cancelled/.test(n.title))).toBe(true);
      return;
    }
    throw new Error('No seed had the airline cancel in eighty tries; the chance is not what the constant says.');
  });
});
