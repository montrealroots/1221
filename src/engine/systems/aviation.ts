/**
 * SLATE — learning to fly, and flying oneself (docs/WORLD.md, stage 7b),
 * from 2026-09-29, researched in docs/research/world/research-vehiclework.json.
 *
 * A private pilot certificate is earned in America, where training is
 * priced: from 17 (14 CFR 61.103), over six months (SLATE's estimate, none
 * published), 60 hours in a rented Cessna 172, AOPA's middle of the 50 to 70
 * most students take (a secondary figure; the rule's least is 40), at the
 * median school's $176 an hour with its fuel (a compiler's of 1,586 schools'
 * published rates), and 20 hours with an instructor at $75 (the middle of
 * the $50 to $100 schools report, secondary), paid month by month; then
 * PSI's $175 knowledge test and the examiner's $1,000 checkride, a typical
 * fee, secondary. A month the bank can't pay stops the training where it
 * is, and it can be taken up again.
 *
 * Qualified, a pilot flies themselves between towns in America in a rented
 * 172, from the airport nearest each: at Textron's 124 knots, a fifth of an
 * hour more for the ground and the climb (SLATE's), within its 640 nautical
 * miles less the half hour's fuel a day flight must keep (14 CFR 91.151),
 * paid by the hour. Owning an aircraft, a medical's renewal, the weather a
 * visual flight needs, and the drive to and from the airports aren't kept,
 * said so. Only an FAA certificate is kept, and a plane may not be rented
 * abroad on it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { airportsFor } from './airports';
import { ageOn } from './mortality';
import { inTheBank, owe, payFromBank } from './household';
import type { JourneyLeg } from './journey';

export const PILOT_TRAINING = {
  minAge: 17, months: 6, hours: 60, dualHours: 20, ratePerHour: 176, instructorPerHour: 75, knowledgeTest: 175, checkride: 1_000,
} as const;
export const SKYHAWK = { knots: 124, rangeNm: 640, reserveHours: 0.5, overheadHours: 0.2 } as const;
export const PILOT_MONTH_KIND = 'pilot.month';

export interface PilotTraining { startedAt: Instant; monthsDone: number; status: 'training' | 'stopped' | 'certified' }
export interface PilotCertificate { issuedAt: Instant; authority: 'FAA' }

const usd = (sim: Simulation, cents: Money) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? cents : exchange(cents, 'USD', cur) ?? cents; };

/** A month's training, and what the tests cost at the end, in the save's money. */
export function trainingCosts(sim: Simulation): { month: Money; tests: Money; total: Money } {
  const t = PILOT_TRAINING;
  const month = usd(sim, Math.round(((t.hours * t.ratePerHour + t.dualHours * t.instructorPerHour) / t.months) * 100));
  const tests = usd(sim, (t.knowledgeTest + t.checkride) * 100);
  return { month, tests, total: month * t.months + tests };
}

export function trainRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.pilot) return 'You hold a private pilot certificate.';
  if (person.pilotTraining?.status === 'training') return 'You’re training already.';
  if (CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId !== 'us') return 'SLATE prices a pilot’s training in America only yet.';
  if (ageOn(sim, person, sim.now) < PILOT_TRAINING.minAge) return `A private pilot certificate is had from ${PILOT_TRAINING.minAge}.`;
  if (inTheBank(sim, person) < trainingCosts(sim).month) return 'The bank can’t pay the first month.';
  return undefined;
}

/** A leg flown oneself, the town's nearest airport to the other's, or why not. */
/**
 * A pilot hired to fly one's own plane, from 2026-09-30 (researched in
 * `docs/research/world/research-charter.json`). A private pilot may not be
 * paid (14 CFR 61.113(a)); a commercial pilot may (61.133(a)(1)). The one
 * published rate for a single-engine piston is an instructor's at Mike
 * Goulian Aviation in Massachusetts, flying with the owner: $450 a half day,
 * $900 a full one, one and a half times past eight hours. SLATE takes a half
 * day to four hours. The pilot's own travel, meals and lodging are the
 * customer's and aren't kept.
 */
export const HIRED_PILOT_USD = { half: 450, full: 900, overtime: 1.5, halfHours: 4, fullHours: 8 } as const;

/** The pilot's fee for a flight of so many hours, in dollars. */
export const hiredPilotUsd = (hours: number): number => (hours <= HIRED_PILOT_USD.halfHours ? HIRED_PILOT_USD.half : hours <= HIRED_PILOT_USD.fullHours ? HIRED_PILOT_USD.full : HIRED_PILOT_USD.full * HIRED_PILOT_USD.overtime);

export function planFlyYourself(sim: Simulation, person: Person, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const ownsHere = person.aircraft !== undefined && person.aircraft.soldAt === undefined && person.aircraft.at === fromCity;
  if (!person.pilot && !ownsHere) return 'Flying yourself asks a pilot certificate.';
  const from = airportsFor(fromCity)[0]?.airport;
  const to = airportsFor(toCity)[0]?.airport;
  if (!from || !to || from.country !== 'US' || to.country !== 'US') return 'A plane is rented on an FAA certificate in America only.';
  if (from.iata === to.iata) return 'The same airport serves both towns.';
  const nm = distanceKm(from, to) / 1.852;
  const usable = SKYHAWK.rangeNm - SKYHAWK.knots * SKYHAWK.reserveHours;
  if (nm > usable) return `${Math.round(nm)} nautical miles is past a Skyhawk’s ${Math.round(usable)} with a day flight’s reserve.`;
  const hours = nm / SKYHAWK.knots + SKYHAWK.overheadHours;
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(10, slot)) }, zone);
  // One's own plane, where it is, flies for its fuel; otherwise a school's, by the hour.
  const own = ownsHere;
  // Not a pilot, the owner hires one to fly it.
  const hired = own && !person.pilot;
  const fare = own ? Math.round(ownHourCost(sim, fromCity) * hours) + (hired ? usd(sim, hiredPilotUsd(hours) * 100) : 0) : usd(sim, Math.round(hours * PILOT_TRAINING.ratePerHour * 100));
  // Its own kind of leg, flown oneself: no airline's delays or round-trip fares touch it.
  return [{ mode: 'fly', from: from.iata, to: to.iata, departAt: depart, arriveAt: depart + Math.round(hours * 60) * 60_000, fare, routeId: own ? 'own' : 'rent', basis: own ? `${Math.round(nm)} nautical miles in your own Cessna 172 at 124 knots, ${hours.toFixed(1)} hours at 10.2 gallons an hour of 100LL at the region’s price${hired ? `, and a hired commercial pilot’s $${hiredPilotUsd(hours).toLocaleString('en-US')} for the day` : ''}; the drive to and from the airports isn’t kept.` : `${Math.round(nm)} nautical miles flown yourself in a rented Cessna 172 at Textron’s 124 knots, ${hours.toFixed(1)} hours at the median school’s $176 an hour with fuel; the drive to and from the airports isn’t kept.` }];
}

function scheduleMonth(sim: Simulation, person: Person): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: PILOT_MONTH_KIND, label: 'Flight Training', category: 'personal', priority: 30, payload: { personId: person.id } });
}

export function registerAviation(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { month: Money; total: Money }>('pilot.train', (_p, { sim: s }) => {
    const person = s.player;
    const no = trainRefusal(s, person);
    if (no) throw new CommandError(no);
    const costs = trainingCosts(s);
    // Stopped at the tests: taken up again, the tests are what's left.
    if (person.pilotTraining?.status === 'stopped' && person.pilotTraining.monthsDone >= PILOT_TRAINING.months) {
      person.pilotTraining.status = 'training';
      s.schedule({ at: s.now, kind: PILOT_MONTH_KIND, label: 'Flight Training', category: 'personal', priority: 30, payload: { personId: person.id } });
      return { month: 0, total: costs.tests };
    }
    if (!payFromBank(s, person, costs.month, 'Flight training, a month', 'travel')) throw new CommandError('The bank couldn’t pay.');
    const done = person.pilotTraining?.status === 'stopped' ? person.pilotTraining.monthsDone : 0;
    person.pilotTraining = { startedAt: person.pilotTraining?.startedAt ?? s.now, monthsDone: done + 1, status: 'training' };
    scheduleMonth(s, person);
    return { month: costs.month, total: costs.total };
  });

  sim.onSchedule(PILOT_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const t = person?.pilotTraining;
    if (!person || !t || t.status !== 'training') return;
    const costs = trainingCosts(s);
    const mine = person.id === s.universe.playerId;
    if (t.monthsDone >= PILOT_TRAINING.months) {
      if (!payFromBank(s, person, costs.tests, 'The knowledge test and the checkride', 'travel')) {
        t.status = 'stopped';
        if (mine) s.notify({ category: 'personal', title: 'Training Stopped', body: `The bank couldn’t pay the tests, ${formatMoney(costs.tests, saveCurrency(s.universe))}.`, importance: 60, route: '/workspace/travel' });
        return;
      }
      t.status = 'certified';
      person.pilot = { issuedAt: s.now, authority: 'FAA' };
      if (mine) s.notify({ category: 'personal', title: 'A Private Pilot', body: 'You passed the knowledge test and the checkride: the FAA’s private pilot certificate is yours.', importance: 70, route: '/workspace/travel' });
      return;
    }
    if (!payFromBank(s, person, costs.month, 'Flight training, a month', 'travel')) {
      t.status = 'stopped';
      if (mine) s.notify({ category: 'personal', title: 'Training Stopped', body: 'The bank couldn’t pay the month’s flying. Take it up again on Travel.', importance: 60, route: '/workspace/travel' });
      return;
    }
    t.monthsDone += 1;
    scheduleMonth(s, person);
  });
}

// ---------------------------------------------------------------------------
// A plane of one's own (stage 7c, from 2026-09-29), researched in
// docs/research/world/research-aircraft-owning.json.

/**
 * Owning a Cessna 172, in dollars. The price is the median asking price of
 * the used 172s listed for sale, a secondary figure (Vref's and the Bluebook's
 * values are sold, not published), and SLATE holds it there, no depreciation
 * series being published. Flown, it burns 10.2 gallons an hour at 75% power
 * (Cessna's 172S information manual, 124 knots at 12.2 nautical miles a
 * gallon), at the week's 100LL by FAA region from AirNav's 3,480 FBOs. Kept:
 * a paved tiedown a month, the Connecticut Airport Authority's $100 for New
 * York and Connecticut and Hayward's city-run $65 for California; insurance,
 * the middle of a broker's $1,200 to $2,500 a year (secondary); the annual
 * inspection 14 CFR 91.409 asks, one shop's $1,800 (secondary); the FAA's $5
 * registration every seven years; and the engine overhauled at Lycoming's
 * 2,000 hours or twelve years (SI 1009), the middle of a field overhaul's
 * $32,000 to $53,000 and the $7,500 to take it out and put it back
 * (secondary). A plane's engine is taken as just overhauled when it's
 * bought. Owning asks no certificate; flying it oneself does. Until
 * 2026-09-30 an owner who wasn't a pilot kept it on the ground; now they hire
 * a commercial pilot to fly it (`HIRED_PILOT_USD`).
 */
export const OWN_172 = {
  priceUsd: 121_847, gph: 10.2,
  avgas: { 'us-ny': 7.6, 'us-ct': 7.88, 'us-ca': 7.74 } as Readonly<Record<string, number>>, avgasNational: 7.25,
  tiedown: { 'us-ny': 100, 'us-ct': 100, 'us-ca': 65 } as Readonly<Record<string, number>>, tiedownDefault: 100,
  insuranceYear: 1_850, annual: 1_800, registration: 5, registrationYears: 7,
  overhaul: 42_500 + 7_500, tboHours: 2_000, tboYears: 12,
} as const;
export const AIRCRAFT_MONTH_KIND = 'aircraft.month';
const YEAR = 365.2425 * MS_DAY;

export interface OwnedAircraft { boughtAt: Instant; price: Money; homeCity: string; at: string; hours: number; overhauledAt: Instant; annualDue: Instant; registeredUntil: Instant; soldAt?: Instant }

const regionOf = (cityId: string) => CITIES.get(cityId)?.parentId ?? '';

/** An hour flown in one's own plane: its fuel at the region's price, in the save's money. */
export function ownHourCost(sim: Simulation, cityId: string): Money {
  return usd(sim, Math.round(OWN_172.gph * (OWN_172.avgas[regionOf(cityId)] ?? OWN_172.avgasNational) * 100));
}

export function buyAircraftRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.aircraft && person.aircraft.soldAt === undefined) return 'You own a plane.';
  if (CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId !== 'us') return 'SLATE prices a plane’s keeping in America only yet.';
  if (inTheBank(sim, person) < usd(sim, (OWN_172.priceUsd + OWN_172.registration) * 100)) return `A 172 costs about ${formatMoney(usd(sim, OWN_172.priceUsd * 100), saveCurrency(sim.universe), { cents: false })}.`;
  return undefined;
}

/** A flight in one's own plane arrives: the plane is there, and its hours are on the engine. */
export function ownFlown(person: Person, toCity: string, hours: number): void {
  const a = person.aircraft;
  if (!a || a.soldAt !== undefined) return;
  a.at = toCity;
  a.hours += hours;
}

function scheduleAircraft(sim: Simulation, person: Person): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: AIRCRAFT_MONTH_KIND, label: 'The Plane’s Month', category: 'home', priority: 30, payload: { personId: person.id } });
}

export function registerOwnedAircraft(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money }>('aircraft.buy', (_p, { sim: s }) => {
    const person = s.player;
    const no = buyAircraftRefusal(s, person);
    if (no) throw new CommandError(no);
    const price = usd(s, OWN_172.priceUsd * 100);
    const paid = price + usd(s, OWN_172.registration * 100);
    if (!payFromBank(s, person, paid, 'A Cessna 172, and its FAA registration', 'travel')) throw new CommandError('The bank couldn’t pay.');
    const home = person.home?.cityId ?? person.currentLocationId;
    person.aircraft = { boughtAt: s.now, price, homeCity: home, at: home, hours: 0, overhauledAt: s.now, annualDue: s.now + YEAR, registeredUntil: s.now + OWN_172.registrationYears * YEAR };
    scheduleAircraft(s, person);
    return { paid };
  });

  sim.onCommand<Record<string, never>, { value: Money }>('aircraft.sell', (_p, { sim: s }) => {
    const person = s.player;
    const a = person.aircraft;
    if (!a || a.soldAt !== undefined) throw new CommandError('You own no plane.');
    s.post({ memo: 'Sold the Cessna 172', category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: a.price }, { accountId: s.nominalAccount('income', 'Plane Sold').id, amount: -a.price }] });
    a.soldAt = s.now;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === AIRCRAFT_MONTH_KIND && item.payload.personId === person.id) s.timeline.cancel(item.id, s.now);
    return { value: a.price };
  });

  sim.onSchedule(AIRCRAFT_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person?.aircraft;
    if (!person || !a || a.soldAt !== undefined) return;
    const pay = (usdUnits: number, memo: string) => { const due = usd(s, Math.round(usdUnits * 100)); if (!payFromBank(s, person, due, memo, 'travel')) owe(s, person, due, memo, 'travel'); };
    pay(OWN_172.tiedown[regionOf(a.homeCity)] ?? OWN_172.tiedownDefault, 'The plane’s tiedown, a month');
    pay(OWN_172.insuranceYear / 12, 'The plane’s insurance, a month');
    if (s.now >= a.annualDue) { pay(OWN_172.annual, 'The plane’s annual inspection'); a.annualDue += YEAR; }
    if (s.now >= a.registeredUntil) { pay(OWN_172.registration, 'The plane’s FAA registration'); a.registeredUntil += OWN_172.registrationYears * YEAR; }
    if (a.hours >= OWN_172.tboHours || s.now - a.overhauledAt >= OWN_172.tboYears * YEAR) { pay(OWN_172.overhaul, 'The plane’s engine overhauled'); a.hours = 0; a.overhauledAt = s.now; }
    scheduleAircraft(s, person);
  });
}
