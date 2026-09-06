/**
 * The journey: a flight as a day, not a teleport.
 *
 * The travel system owns the mechanics (fares, bookings, what a flight does
 * to you when it lands, the hotel). This system owns the asking and the
 * day itself. Three hours before a flight it asks on Home: play the day,
 * just go, or stay home; not being at the airport when the gate closes is
 * a missed flight, and a missed flight is what the fare says it is.
 *
 * Played, it is packing (a bag in the hold or not, and the documents the
 * route needs), the run to the airport by taxi, transit or your own car
 * with its time and cost, the desk and a seat, the gate where a flight
 * can be on time, late or cancelled and rebooked by the airline, the
 * hours in the air spent one way or another, the carousel where a bag
 * can fail to arrive and come back two days later, and the way into town
 * or to the hotel, which may or may not have your room ready.
 *
 * Airlines, hotel brands, aircraft types and airports are real names,
 * stated as public record; every route, schedule, fare, property and rate
 * is SLATE's own and says so. What a route needs in documents is a
 * passport for a border and nothing more; visa rules are real-world data
 * this tree does not carry, and it says so.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_HOUR, MS_MINUTE, addDays, formatDate, formatTime } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import type { FlightBooking, HotelBooking, Id } from '../domain/model';
import { AIRPORTS, CITIES, COUNTRIES, countryOfCity } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { activeScene } from './scenes';
import { planJourney, driveableVehicle, type Mode } from './places';
import { activePolicy } from './services';
import { arriveFlight, checkIntoHotel, createFlightBooking, departFlight, searchFlights } from './travel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hours before departure the day can start. */
export const WINDOW_HOURS = 3;
/** Minutes before departure the gate closes. */
export const GATE_CLOSE_MINUTES = 45;
export const PACK_MINUTES = 20;
export const DESK_MINUTES = 15;
export const BAG_CLAIM_MINUTES = 25;
export const BAG_LOST_CHANCE = 0.03;
export const BAG_RETURN_DAYS = 2;
/** What moving or missing a non-refundable fare costs, as a share of the fare. */
export const CHANGE_FEE_RATE = 0.2;
export const NOT_HERE = 'You are not in the city the flight leaves from.';

export type BagChoice = 'carry_on' | 'checked';
export type Activity = 'sleep' | 'work' | 'watch';

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export function bookingOf(sim: Simulation, id: Id): FlightBooking {
  const booking = sim.universe.flightBookings[id];
  if (!booking) throw new CommandError('There is no flight like that.');
  return booking;
}

export function cityOfAirport(iata: string): string | undefined {
  return AIRPORTS.all().find((a) => a.iata === iata)?.parentId;
}

export function fromCityOf(booking: FlightBooking): string | undefined {
  return cityOfAirport(booking.fromAirport);
}

export function toCityOf(booking: FlightBooking): string | undefined {
  return cityOfAirport(booking.toAirport);
}

export function airportName(iata: string): string {
  return AIRPORTS.all().find((a) => a.iata === iata)?.name ?? iata;
}

/** Whether the day can start now: yours, still booked, you are in the right city, the window is open, the gate is not shut. */
export function flyable(sim: Simulation, booking: FlightBooking): { ok: boolean; reason?: string } {
  if (!booking.passengerIds.includes(sim.player.id)) return { ok: false, reason: 'You are not on that flight.' };
  if (booking.status !== 'booked' && booking.status !== 'checked_in') return { ok: false, reason: `That flight is ${booking.status.replace(/_/g, ' ')}.` };
  if (booking.boardedAt) return { ok: false, reason: 'You are already on it.' };
  if (sim.player.currentLocationId !== fromCityOf(booking)) return { ok: false, reason: NOT_HERE };
  if (sim.now < booking.departAt - WINDOW_HOURS * MS_HOUR) return { ok: false, reason: `It leaves at ${formatTime(booking.departAt, sim.zone)}; the day starts three hours before.` };
  if (sim.now > booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE && !booking.checkedInAt) return { ok: false, reason: 'The gate has closed.' };
  return { ok: true };
}

export interface Documents {
  international: boolean;
  passport: string;
  ok: boolean;
  note: string;
}

/** What the route needs from your wallet. A border wants a passport; a visa is data this tree does not carry. */
export function documentsFor(sim: Simulation, booking: FlightBooking): Documents {
  const from = countryOfCity(fromCityOf(booking));
  const to = countryOfCity(toCityOf(booking));
  const international = Boolean(from && to && from !== to);
  const me = sim.player;
  const passport = COUNTRIES.get(me.citizenshipId)?.name ?? me.citizenshipId;
  if (!international) return { international, passport, ok: true, note: 'A domestic flight. Photo identification and the boarding pass.' };
  const home = me.citizenshipId === to || me.secondCitizenshipId === to;
  return {
    international, passport, ok: true,
    note: home
      ? `A border, and your own. Your ${passport} passport takes you home.`
      : `A border. Your ${passport} passport. Whether ${COUNTRIES.get(to ?? '')?.name ?? 'the country'} wants a visa with it is real-world data SLATE does not carry, so it does not pretend to check.`,
  };
}

export function bagFee(sim: Simulation, booking: FlightBooking): Money {
  if (booking.cabin !== 'economy') return 0;
  return Math.round(35_00 * costOfLiving(fromCityOf(booking) ?? sim.player.currentLocationId));
}

export interface SeatOption {
  id: string;
  label: string;
  detail: string;
  cost: Money;
  seat: string;
}

export function seatOptions(sim: Simulation, booking: FlightBooking): SeatOption[] {
  const row = booking.seats[0]?.replace(/[A-F]$/, '') || '12';
  const col = costOfLiving(fromCityOf(booking) ?? sim.player.currentLocationId);
  const options: SeatOption[] = [
    { id: 'keep', label: 'Keep The Seat You Have', detail: `${booking.seats[0] ?? `${row}A`}. Whatever it is.`, cost: 0, seat: booking.seats[0] ?? `${row}A` },
    { id: 'window', label: 'A Window', detail: 'Something to look at, and a wall to lean on.', cost: 0, seat: `${row}A` },
    { id: 'aisle', label: 'An Aisle', detail: 'Room for a leg, and you can get out.', cost: 0, seat: `${row}C` },
  ];
  if (booking.cabin === 'economy' || booking.cabin === 'premium_economy') {
    options.push({ id: 'legroom', label: 'Buy More Legroom', detail: 'The exit row. It is not comfort; it is less discomfort.', cost: Math.round(45_00 * col), seat: '14C' });
  }
  return options;
}

export interface AirportRun {
  mode: Mode;
  label: string;
  minutes: number;
  cost: Money;
  detail: string;
  disabled?: string;
}

/** The run to the airport, priced the way the city prices a journey and stretched for the distance an airport is. */
export function airportRuns(sim: Simulation, booking: FlightBooking): AirportRun[] {
  const cityId = fromCityOf(booking) ?? sim.player.currentLocationId;
  const stretch = (mode: Mode) => {
    const j = planJourney(sim, { cityId }, mode);
    return { minutes: Math.round(j.minutes * 1.2 + 12), cost: Math.round(j.cost * 1.9) };
  };
  const car = driveableVehicle(sim);
  const taxi = stretch('taxi');
  const transit = stretch('transit');
  const drive = stretch('drive');
  const funds = sim.player.primaryAccountId ? sim.ledger.availableFunds(sim.player.primaryAccountId) : 0;
  return [
    { mode: 'taxi', label: 'Call A Cab', minutes: taxi.minutes, cost: taxi.cost, detail: `${taxi.minutes} minutes, ${formatMoney(taxi.cost)}.`, disabled: funds < taxi.cost ? `You have ${formatMoney(funds)}.` : undefined },
    { mode: 'transit', label: 'Take The Train', minutes: transit.minutes, cost: transit.cost, detail: `${transit.minutes} minutes, ${formatMoney(transit.cost)}. A wait, then a ride.`, disabled: funds < transit.cost ? `You have ${formatMoney(funds)}.` : undefined },
    { mode: 'drive', label: 'Drive And Park', minutes: drive.minutes, cost: drive.cost + Math.round(18_00 * costOfLiving(cityId)), detail: car ? `${drive.minutes} minutes. Fuel and parking.` : 'You have no car here.', disabled: car ? undefined : 'You have no car here.' },
  ];
}

export function gateOpen(sim: Simulation, booking: FlightBooking): boolean {
  return sim.now <= booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE;
}

/** The hotel waiting for you where the flight lands, if you booked one around the arrival. */
export function hotelOnArrival(sim: Simulation, booking: FlightBooking): HotelBooking | undefined {
  const cityId = toCityOf(booking);
  return Object.values(sim.universe.hotelBookings).find((h) =>
    h.locationId === cityId && h.guestIds.includes(sim.player.id) && (h.status === 'booked' || h.status === 'checked_in')
    && h.checkInAt <= booking.arriveAt + 36 * MS_HOUR && h.checkOutAt > booking.arriveAt);
}

/** What moving or missing this fare costs today. */
export function changeFee(booking: FlightBooking): Money {
  return booking.refundable ? 0 : Math.round(booking.fare * CHANGE_FEE_RATE);
}

export function describeFlight(sim: Simulation, booking: FlightBooking): string {
  return `${booking.airlineName} ${booking.flightNumber}, ${airportName(booking.fromAirport)} to ${airportName(booking.toAirport)}, ${formatDate(booking.departAt, sim.homeZone)} at ${formatTime(booking.departAt, sim.homeZone)}`;
}

// ---------------------------------------------------------------------------
// The day, in steps that both the scene and the short version use
// ---------------------------------------------------------------------------

function cancelKind(sim: Simulation, kind: string, refId: Id): void {
  for (const item of sim.timeline.pending()) if (item.kind === kind && item.refId === refId) sim.timeline.cancel(item.id, sim.now);
}

function sceneOn(sim: Simulation, refType: string, refId: Id): boolean {
  const scene = activeScene(sim);
  return Boolean(scene && scene.refType === refType && scene.refId === refId);
}

function pay(sim: Simulation, amount: Money, memo: string, booking: FlightBooking): void {
  if (amount <= 0) return;
  const accountId = sim.player.primaryAccountId;
  if (!accountId) throw new CommandError('No account to pay from.');
  if (sim.ledger.availableFunds(accountId) < amount) throw new CommandError(`${memo} is ${formatMoney(amount)}. You have ${formatMoney(sim.ledger.availableFunds(accountId))}.`);
  sim.expense(accountId, amount, memo, 'travel', { refType: 'flight', refId: booking.id });
  booking.extras = (booking.extras ?? 0) + amount;
}

function pack(sim: Simulation, booking: FlightBooking, bag: BagChoice): { fee: Money; documents: Documents } {
  const can = flyable(sim, booking);
  if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
  if (booking.bag) throw new CommandError('You have packed already.');
  const fee = bag === 'checked' ? bagFee(sim, booking) : 0;
  pay(sim, fee, 'Checked bag', booking);
  booking.bag = bag;
  sim.advanceTo(sim.now + PACK_MINUTES * MS_MINUTE);
  cancelKind(sim, 'travel.gate_closes', booking.id);
  sim.resolveDecision('flight', booking.id);
  // The gate still closes; it just does not close on a player who is on the way.
  sim.schedule({
    at: booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE, kind: 'travel.gate_closes', label: `Gate Closes — ${booking.flightNumber}`, category: 'system',
    payload: { bookingId: booking.id }, priority: 80, refType: 'flight', refId: booking.id,
  });
  return { fee, documents: documentsFor(sim, booking) };
}

function toAirport(sim: Simulation, booking: FlightBooking, mode: Mode): { minutes: number; cost: Money; late: boolean } {
  if (!booking.bag) throw new CommandError('Pack first.');
  if (booking.checkedInAt) throw new CommandError('You are at the airport already.');
  const run = airportRuns(sim, booking).find((r) => r.mode === mode);
  if (!run) throw new CommandError('That is not a way to the airport.');
  if (run.disabled) throw new CommandError(run.disabled);
  pay(sim, run.cost, mode === 'taxi' ? 'Taxi to the airport' : mode === 'transit' ? 'Train to the airport' : 'Fuel and parking', booking);
  sim.advanceTo(sim.now + run.minutes * MS_MINUTE);
  sim.player.currentPlaceId = undefined;
  sim.player.wellbeing.energy = clamp(sim.player.wellbeing.energy - 3, 0, 100);
  const late = !gateOpen(sim, booking);
  if (late) missFlight(sim, booking, 'You reached the airport after the gate had closed.');
  return { minutes: run.minutes, cost: run.cost, late };
}

function checkIn(sim: Simulation, booking: FlightBooking, seatId: string): { seat: string; cost: Money } {
  if (booking.status !== 'booked') throw new CommandError(`That flight is ${booking.status.replace(/_/g, ' ')}.`);
  if (!booking.bag) throw new CommandError('Pack first.');
  if (!gateOpen(sim, booking)) { missFlight(sim, booking, 'The desk had closed.'); throw new CommandError('The desk has closed; the flight has gone without you.'); }
  const option = seatOptions(sim, booking).find((o) => o.id === seatId);
  if (!option) throw new CommandError('That is not a seat on offer.');
  pay(sim, option.cost, 'Seat selection', booking);
  booking.seats[0] = option.seat;
  booking.seatChoice = option.id;
  booking.status = 'checked_in';
  booking.checkedInAt = sim.now;
  sim.advanceTo(sim.now + DESK_MINUTES * MS_MINUTE);
  cancelKind(sim, 'travel.gate_closes', booking.id);
  return { seat: option.seat, cost: option.cost };
}

function board(sim: Simulation, booking: FlightBooking): { delayMinutes: number; cancelled: boolean; replacement?: Id } {
  if (booking.status !== 'checked_in') throw new CommandError('Check in first.');
  if (booking.boardedAt) throw new CommandError('You are on it.');
  const rng = sim.rng('gate', booking.id);
  const roll = rng.next();
  if (roll < 0.05) {
    // The airline cancels; it moves you, at no cost, to the next thing it flies.
    const replacement = rebook(sim, booking, 'cancelled');
    return { delayMinutes: 0, cancelled: true, replacement: replacement?.id };
  }
  const delay = roll < 0.30 ? rng.int(30, 150) : 0;
  if (delay > 0) {
    booking.delayMinutes = delay;
    booking.departAt += delay * MS_MINUTE;
    booking.arriveAt += delay * MS_MINUTE;
    for (const item of sim.timeline.pending()) if (item.kind === 'travel.arrive' && item.refId === booking.id) sim.timeline.reschedule(item.id, booking.arriveAt);
  }
  sim.advanceTo(Math.max(sim.now, booking.departAt));
  booking.boardedAt = sim.now;
  departFlight(sim, booking.id);
  return { delayMinutes: delay, cancelled: false };
}

function inflight(sim: Simulation, booking: FlightBooking, activity: Activity): { hours: number; landedIn?: string } {
  if (!booking.boardedAt) throw new CommandError('Board first.');
  if (booking.status === 'flown') throw new CommandError('You have landed.');
  const hours = Math.max(0, (booking.arriveAt - sim.now) / MS_HOUR);
  const me = sim.player;
  if (activity === 'sleep') { me.wellbeing.sleepDebt = clamp(me.wellbeing.sleepDebt - Math.min(10, hours * 3), 0, 100); me.wellbeing.energy = clamp(me.wellbeing.energy + Math.min(8, hours * 2), 0, 100); }
  if (activity === 'work') { me.wellbeing.morale = clamp(me.wellbeing.morale + 3, 0, 100); me.wellbeing.stress = clamp(me.wellbeing.stress + 3, 0, 100); }
  if (activity === 'watch') { me.wellbeing.stress = clamp(me.wellbeing.stress - 5, 0, 100); }
  // Landing is the travel system's own arrival, fired by the clock as it passes.
  sim.advanceTo(booking.arriveAt + MS_MINUTE);
  if (sim.universe.flightBookings[booking.id]?.status !== 'flown') arriveFlight(sim, booking.id);
  return { hours: Math.round(hours * 10) / 10, landedIn: toCityOf(booking) };
}

function claimBags(sim: Simulation, booking: FlightBooking): { lost: boolean; minutes: number } {
  if (booking.status !== 'flown') throw new CommandError('You have not landed.');
  if (booking.bagsClaimedAt) throw new CommandError('You have your bags.');
  booking.bagsClaimedAt = sim.now;
  if (booking.bag !== 'checked') return { lost: false, minutes: 0 };
  sim.advanceTo(sim.now + BAG_CLAIM_MINUTES * MS_MINUTE);
  const lost = sim.rng('carousel', booking.id).chance(BAG_LOST_CHANCE);
  if (lost) {
    booking.bagLost = true;
    const returnAt = addDays(sim.now, BAG_RETURN_DAYS, sim.homeZone);
    sim.schedule({ at: returnAt, kind: 'travel.bag_returned', label: 'Bag Delivered', category: 'travel', payload: { bookingId: booking.id }, priority: 60, refType: 'flight', refId: booking.id });
    const policy = activePolicy(sim, sim.player.id, 'travel');
    const claim = Math.round(400_00 * costOfLiving(toCityOf(booking) ?? sim.player.currentLocationId));
    sim.notify({
      category: 'travel', title: 'Your Bag Did Not Arrive',
      body: `The carousel stopped without it. The airline has it somewhere; it comes to you in ${BAG_RETURN_DAYS} days.${policy ? ' Your travel cover will pay for what you need meanwhile.' : ''}`,
      importance: 55, route: '/workspace/travel', refType: 'flight', refId: booking.id,
    });
    if (policy) {
      sim.requireDecision({
        urgency: 45, category: 'travel', title: 'Claim For The Bag',
        detail: `${formatMoney(claim)} for what you need until it turns up, under your travel cover.`,
        route: '/workspace/insurance',
        actions: [{ label: 'File The Claim', commandKind: 'ins.file_claim', payload: { policyId: policy.id, description: `Delayed bag, ${booking.airlineName} ${booking.flightNumber}`, claimedAmount: claim, refType: 'flight', refId: booking.id } }],
        refType: 'flight', refId: booking.id,
      });
    }
    sim.emit('travel.bag_lost', { bookingId: booking.id });
  }
  return { lost, minutes: BAG_CLAIM_MINUTES };
}

function toHotel(sim: Simulation, booking: FlightBooking, mode: Mode): { hotel?: string; checkedIn: boolean; readyAt?: number; minutes: number; cost: Money } {
  if (booking.status !== 'flown') throw new CommandError('You have not landed.');
  const cityId = toCityOf(booking) ?? sim.player.currentLocationId;
  const hotel = hotelOnArrival(sim, booking);
  const j = planJourney(sim, { cityId }, mode === 'drive' ? 'taxi' : mode);
  const minutes = Math.round(j.minutes * 1.4 + 12);
  const cost = Math.round(j.cost * 1.6);
  const accountId = sim.player.primaryAccountId;
  if (cost > 0 && accountId && sim.ledger.availableFunds(accountId) >= cost) sim.expense(accountId, cost, mode === 'transit' ? 'Train from the airport' : 'Taxi from the airport', 'travel', { refType: 'flight', refId: booking.id });
  sim.advanceTo(sim.now + minutes * MS_MINUTE);
  if (!hotel) return { checkedIn: false, minutes, cost };
  if (hotel.status === 'checked_in') return { hotel: hotel.hotelName, checkedIn: true, minutes, cost };
  if (sim.now >= hotel.checkInAt - 2 * MS_HOUR) {
    for (const item of sim.timeline.pending()) if (item.kind === 'travel.check_in' && item.refId === hotel.id) sim.timeline.cancel(item.id, sim.now);
    checkIntoHotel(sim, hotel.id);
    return { hotel: hotel.hotelName, checkedIn: true, minutes, cost };
  }
  return { hotel: hotel.hotelName, checkedIn: false, readyAt: hotel.checkInAt, minutes, cost };
}

/** A missed flight is what the fare says it is: refundable comes back, the rest does not. */
export function missFlight(sim: Simulation, booking: FlightBooking, why: string): void {
  if (booking.status !== 'booked' && booking.status !== 'checked_in') return;
  booking.status = 'missed';
  sim.timeline.cancelFor('flight', booking.id, sim.now);
  sim.resolveDecision('flight', booking.id);
  const accountId = sim.player.primaryAccountId;
  const refund = booking.refundable ? booking.fare + booking.taxesFees : 0;
  if (refund > 0 && accountId) sim.income(accountId, refund, `Refund — ${booking.airlineName} ${booking.flightNumber}`, 'travel', { refType: 'flight', refId: booking.id });
  const toCity = CITIES.get(toCityOf(booking) ?? '')?.name ?? booking.toAirport;
  sim.notify({
    category: 'travel', title: `Missed ${booking.airlineName} ${booking.flightNumber}`,
    body: `${why} ${refund > 0 ? `The fare was refundable; ${formatMoney(refund)} comes back.` : `The fare was not refundable; ${formatMoney(booking.fare + booking.taxesFees)} is gone.`} The next flight to ${toCity} can be booked from Travel.`,
    importance: 70, route: '/workspace/travel', refType: 'flight', refId: booking.id,
  });
  sim.requireDecision({
    urgency: 58, category: 'travel', title: `Rebook To ${toCity}`,
    detail: `The next flight the airline has, for ${formatMoney(changeFee(booking))} plus any difference in fare.`,
    route: '/workspace/travel',
    actions: [{ label: 'Rebook', commandKind: 'travel.rebook', payload: { bookingId: booking.id } }],
    refType: 'flight', refId: booking.id,
  });
  sim.emit('travel.flight_missed', { bookingId: booking.id, refund });
}

/** The next flight the airline has to the same place, for the fee the reason carries. */
function rebook(sim: Simulation, booking: FlightBooking, reason: 'cancelled' | 'missed' | 'moved', departAt?: number): FlightBooking | undefined {
  const fromCity = fromCityOf(booking);
  const toCity = toCityOf(booking);
  if (!fromCity || !toCity) throw new CommandError('That route no longer exists.');
  const options = searchFlights(sim, fromCity, toCity, departAt ?? sim.now + 2 * MS_HOUR).filter((o) => o.departAt > sim.now + MS_HOUR);
  const option = options[0];
  if (!option) throw new CommandError('The airline has nothing else to that city today.');
  const base = option.fares[booking.cabin];
  const difference = Math.max(0, base - booking.fare / Math.max(1, booking.passengerIds.length)) * booking.passengerIds.length;
  const fee = reason === 'cancelled' ? 0 : changeFee(booking) + difference;
  if (fee > 0) {
    const accountId = sim.player.primaryAccountId;
    if (!accountId) throw new CommandError('No account to pay from.');
    if (sim.ledger.availableFunds(accountId) < fee) throw new CommandError(`Rebooking is ${formatMoney(fee)} and you cannot cover it.`);
    sim.expense(accountId, fee, `${reason === 'missed' ? 'Rebooking' : 'Change'} — ${option.airlineName} ${option.flightNumber}`, 'travel', { refType: 'flight', refId: booking.id });
  }
  const replacement = createFlightBooking(sim, {
    fromCity, toCity, option, cabin: booking.cabin, passengers: booking.passengerIds,
    fare: reason === 'cancelled' ? booking.fare : booking.fare + Math.max(0, fee - changeFee(booking)), taxes: booking.taxesFees, refundable: booking.refundable, tripId: booking.tripId,
  });
  booking.replacedBy = replacement.id;
  if (booking.status === 'booked' || booking.status === 'checked_in') {
    booking.status = 'changed';
    sim.timeline.cancelFor('flight', booking.id, sim.now);
  }
  sim.resolveDecision('flight', booking.id);
  sim.notify({
    category: 'travel', title: reason === 'cancelled' ? `${booking.airlineName} Cancelled ${booking.flightNumber}` : `Rebooked On ${option.airlineName} ${option.flightNumber}`,
    body: `${reason === 'cancelled' ? 'The airline has moved you, at no cost, to' : 'You are now on'} ${option.airlineName} ${option.flightNumber}, ${formatDate(option.departAt, sim.homeZone)} at ${formatTime(option.departAt, sim.homeZone)}.${fee > 0 ? ` ${formatMoney(fee)} paid.` : ''}`,
    importance: 60, route: '/workspace/travel', refType: 'flight', refId: replacement.id,
  });
  sim.emit('travel.flight_rebooked', { bookingId: booking.id, replacementId: replacement.id, reason, fee });
  return replacement;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerJourney(sim: Simulation): void {
  sim.onEvent('travel.departure_due', 'journey.due', (event, { sim: s }) => {
    const { bookingId } = event.payload as { bookingId: Id };
    const booking = s.universe.flightBookings[bookingId];
    if (!booking || booking.status !== 'booked') return;
    if (!booking.passengerIds.includes(s.player.id)) { departFlight(s, booking.id); return; }
    if (sceneOn(s, 'flight', booking.id)) return;
    const toCity = CITIES.get(toCityOf(booking) ?? '')?.name ?? booking.toAirport;
    if (s.player.currentLocationId !== fromCityOf(booking)) {
      missFlight(s, booking, `You were not in ${CITIES.get(fromCityOf(booking) ?? '')?.name ?? 'the city'} for it.`);
      return;
    }
    s.requireDecision({
      urgency: 75, category: 'travel',
      title: `Fly To ${toCity}`,
      detail: `${booking.airlineName} ${booking.flightNumber} at ${formatTime(booking.departAt, s.zone)}. The gate closes ${GATE_CLOSE_MINUTES} minutes before; a missed flight is ${booking.refundable ? 'refunded' : 'gone'}.`,
      route: '/workspace/travel',
      actions: [
        { label: 'Play It Out', commandKind: 'scene.start', payload: { definitionId: 'travel.flight', input: { bookingId: booking.id }, refType: 'flight', refId: booking.id } },
        { label: 'Just Go', commandKind: 'travel.fly', payload: { bookingId: booking.id } },
        { label: 'Stay Home', commandKind: 'travel.no_show', payload: { bookingId: booking.id } },
      ],
      dueAt: booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE,
      refType: 'flight', refId: booking.id,
    });
    s.schedule({
      at: booking.departAt - GATE_CLOSE_MINUTES * MS_MINUTE, kind: 'travel.gate_closes', label: `Gate Closes — ${booking.flightNumber}`, category: 'system',
      payload: { bookingId: booking.id }, priority: 80, refType: 'flight', refId: booking.id,
    });
  });

  sim.onSchedule('travel.gate_closes', (item) => {
    const booking = sim.universe.flightBookings[item.payload['bookingId'] as Id];
    if (!booking || booking.status !== 'booked') return;
    if (sceneOn(sim, 'flight', booking.id)) {
      // A day in play still has to reach the desk in time; the desk decides.
      return;
    }
    missFlight(sim, booking, 'The gate closed without you.');
  });

  sim.onSchedule('travel.bag_returned', (item) => {
    const booking = sim.universe.flightBookings[item.payload['bookingId'] as Id];
    if (!booking || !booking.bagLost || booking.bagReturnedAt) return;
    booking.bagReturnedAt = sim.now;
    sim.notify({ category: 'travel', title: 'Your Bag Is Back', body: 'Delivered to where you are staying, with an apology printed on a card.', importance: 30, route: '/workspace/travel', refType: 'flight', refId: booking.id });
    sim.emit('travel.bag_returned', { bookingId: booking.id });
  });

  sim.onCommand<{ bookingId: Id; bag: BagChoice }, { fee: Money; documents: Documents }>('travel.pack', (p, { sim: s }) => {
    if (p.bag !== 'carry_on' && p.bag !== 'checked') throw new CommandError('Carry it on, or check it.');
    return pack(s, bookingOf(s, p.bookingId), p.bag);
  });

  sim.onCommand<{ bookingId: Id; mode: Mode }, { minutes: number; cost: Money; late: boolean }>('travel.to_airport', (p, { sim: s }) => toAirport(s, bookingOf(s, p.bookingId), p.mode));

  sim.onCommand<{ bookingId: Id; seat: string }, { seat: string; cost: Money }>('travel.check_in_flight', (p, { sim: s }) => checkIn(s, bookingOf(s, p.bookingId), p.seat));

  sim.onCommand<{ bookingId: Id }, { delayMinutes: number; cancelled: boolean; replacement?: Id }>('travel.board', (p, { sim: s }) => board(s, bookingOf(s, p.bookingId)));

  sim.onCommand<{ bookingId: Id; activity: Activity }, { hours: number; landedIn?: string }>('travel.inflight', (p, { sim: s }) => {
    if (p.activity !== 'sleep' && p.activity !== 'work' && p.activity !== 'watch') throw new CommandError('Sleep, work, or watch something.');
    return inflight(s, bookingOf(s, p.bookingId), p.activity);
  });

  sim.onCommand<{ bookingId: Id }, { lost: boolean; minutes: number }>('travel.claim_bags', (p, { sim: s }) => claimBags(s, bookingOf(s, p.bookingId)));

  sim.onCommand<{ bookingId: Id; mode: Mode }, { hotel?: string; checkedIn: boolean; readyAt?: number; minutes: number; cost: Money }>('travel.to_hotel', (p, { sim: s }) => toHotel(s, bookingOf(s, p.bookingId), p.mode));

  /** Just going: the whole day by its defaults. Carry-on, a cab, the seat you have, sleep, a cab to the hotel. */
  sim.onCommand<{ bookingId: Id }, { landedIn?: string; delayMinutes: number; cancelled: boolean; missed: boolean; hotel?: string }>('travel.fly', (p, { sim: s }) => {
    const booking = bookingOf(s, p.bookingId);
    if (!booking.bag) pack(s, booking, 'carry_on');
    if (!booking.checkedInAt && booking.status === 'booked') {
      const run = airportRuns(s, booking).find((r) => !r.disabled) ?? airportRuns(s, booking)[1]!;
      const { late } = toAirport(s, booking, run.mode);
      if (late) return { delayMinutes: 0, cancelled: false, missed: true };
      checkIn(s, booking, 'keep');
    }
    const gate = board(s, booking);
    if (gate.cancelled) return { delayMinutes: 0, cancelled: true, missed: false };
    const air = inflight(s, booking, 'sleep');
    claimBags(s, booking);
    const hotel = toHotel(s, booking, 'taxi');
    return { landedIn: air.landedIn, delayMinutes: gate.delayMinutes, cancelled: false, missed: false, hotel: hotel.hotel };
  });

  sim.onCommand<{ bookingId: Id }, { refund: Money }>('travel.no_show', (p, { sim: s }) => {
    const booking = bookingOf(s, p.bookingId);
    if (booking.status !== 'booked' && booking.status !== 'checked_in') throw new CommandError('That flight is not open.');
    cancelKind(s, 'travel.gate_closes', booking.id);
    missFlight(s, booking, 'You decided not to go.');
    return { refund: booking.refundable ? booking.fare + booking.taxesFees : 0 };
  });

  sim.onCommand<{ bookingId: Id }, { replacementId: Id; departAt: number }>('travel.rebook', (p, { sim: s }) => {
    const booking = bookingOf(s, p.bookingId);
    if (booking.status !== 'missed') throw new CommandError('Only a missed flight is rebooked; move a booked one instead.');
    if (booking.replacedBy) throw new CommandError('You have rebooked already.');
    const replacement = rebook(s, booking, 'missed');
    if (!replacement) throw new CommandError('Nothing to rebook onto.');
    return { replacementId: replacement.id, departAt: replacement.departAt };
  });

  sim.onCommand<{ bookingId: Id; departAt: number }, { replacementId: Id; departAt: number; fee: Money }>('travel.change_flight', (p, { sim: s }) => {
    const booking = bookingOf(s, p.bookingId);
    if (booking.status !== 'booked') throw new CommandError('That flight cannot be moved.');
    if (!Number.isFinite(p.departAt) || p.departAt <= s.now + 2 * MS_HOUR) throw new CommandError('Move it to a later day.');
    const before = s.player.primaryAccountId ? s.ledger.availableFunds(s.player.primaryAccountId) : 0;
    const replacement = rebook(s, booking, 'moved', p.departAt);
    if (!replacement) throw new CommandError('Nothing on that day.');
    const after = s.player.primaryAccountId ? s.ledger.availableFunds(s.player.primaryAccountId) : 0;
    return { replacementId: replacement.id, departAt: replacement.departAt, fee: before - after };
  });
}

/** What the fare, the day and the arrival add up to, for the scene's last page. */
export function dayFacts(sim: Simulation, booking: FlightBooking): { label: string; value: string }[] {
  return [
    { label: 'Fare', value: formatMoney(booking.fare + booking.taxesFees) },
    { label: 'The Day Added', value: formatMoney(booking.extras ?? 0) },
    ...(booking.delayMinutes ? [{ label: 'Delay', value: `${booking.delayMinutes} minutes` }] : []),
    { label: 'Travel Fatigue', value: `${Math.round(sim.player.wellbeing.travelFatigue)}` },
    { label: 'Energy', value: `${Math.round(sim.player.wellbeing.energy)}` },
  ];
}

export const CHANGE_NOTE = `Moving a flight costs ${Math.round(CHANGE_FEE_RATE * 100)}% of a non-refundable fare plus any difference; a refundable fare moves for the difference alone.`;

export function applyChangeRate(amount: Money): Money {
  return applyRate(amount, CHANGE_FEE_RATE);
}
