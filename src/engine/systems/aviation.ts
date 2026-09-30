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
 * paid by the hour, with the taxi to the airport and from the far one
 * (from 2026-09-30; owning an aircraft came in 7c). A medical's renewal and
 * the weather a visual flight needs weren't kept until 2026-09-30; both are
 * now (`MEDICAL`, `NOT_VISUAL`). Only an FAA certificate is kept, and a
 * plane may not be rented abroad on it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, addMonths, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { airportsFor } from './airports';
import { groundLeg } from '../content/air';
import { ageOn } from './mortality';
import { expenseFor, inTheBank, owe, payFromBank } from './household';
import { amortized } from './vehicles';
import { weatherOn } from './weather';
import type { JourneyLeg } from './journey';

export const PILOT_TRAINING = {
  minAge: 17, months: 6, hours: 60, dualHours: 20, ratePerHour: 176, instructorPerHour: 75, knowledgeTest: 175, checkride: 1_000,
} as const;
export const SKYHAWK = { knots: 124, rangeNm: 640, reserveHours: 0.5, overheadHours: 0.2 } as const;
export const PILOT_MONTH_KIND = 'pilot.month';

export interface PilotTraining { startedAt: Instant; monthsDone: number; status: 'training' | 'stopped' | 'certified'; /** Where, from 2026-09-30: absent, America. */ country?: string }

/**
 * A pilot's license and flying oneself outside America, from 2026-09-30
 * (`docs/research/world/research-travel-aviation-boats.json`). Each is its
 * country's own, over the same six months, SLATE's:
 * - Britain, the CAA's PPL: the PPL Club's £14,000 to £16,500 for the whole
 *   of it in 2026, the middle, as students take 55 to 60 hours for the law's
 *   45 (secondary); a four-seater rented after at the middle of its £250 to
 *   £280 an hour.
 * - Ireland, the IAA's PPL: Hotel Bravo Flying Club at Weston, €175 an hour
 *   with an instructor and €160 alone, confirmed, for 30 and 25 of 55 hours,
 *   SLATE's split, and its €500 to join, two years' €1,560 and €1,000 of
 *   ground school, read from an excerpt; its €160 an hour to rent after.
 * - Canada, Transport Canada's PPL: the Calgary Flying Club's C$18,000 to
 *   C$25,000 its students typically spend, the middle; its Cessna 172 at
 *   C$220 an hour after.
 * The medical each license asks isn't priced here, none being read.
 */
export const PILOT_SCHOOLS: Readonly<Record<string, { authority: string; license: string; currency: string; total: number; rentHour: number; airport: string }>> = {
  uk: { authority: 'CAA', license: 'A UK Private Pilot Licence', currency: 'GBP', total: 15_250, rentHour: 265, airport: 'GB' },
  ie: { authority: 'IAA', license: 'An Irish Private Pilot Licence', currency: 'EUR', total: 30 * 175 + 25 * 160 + 500 + 1_560 + 1_000, rentHour: 160, airport: 'IE' },
  ca: { authority: 'TC', license: 'A Canadian Private Pilot Licence', currency: 'CAD', total: 21_500, rentHour: 220, airport: 'CA' },
};

/** Whether they may fly themselves in a country: America's on the FAA certificate, elsewhere on that country's license. */
export const licensedIn = (person: Person, country: string): boolean => (country === 'us' ? person.pilot !== undefined : (person.pilotLicences ?? []).some((l) => l.country === country));
export interface PilotCertificate { issuedAt: Instant; authority: 'FAA'; /** When the medical runs out (14 CFR 61.23), from 2026-09-30. */ medicalUntil?: Instant }

/**
 * The medical a pilot flies on, from 2026-09-30 (researched in
 * `docs/research/world/research-travel-aviation-boats.json`): a third-class
 * certificate, 60 months under 40 and 24 from 40 (14 CFR 61.23), at the
 * middle of the $125 and $160 two examiners publish (an examiner's fee isn't
 * regulated). Taken with the training and renewed when it runs out, paid
 * from the bank; one the bank can't pay lapses, and a lapsed pilot doesn't
 * fly themselves until it's paid, a month on.
 */
export const MEDICAL = { usd: 142.5, youngMonths: 60, olderMonths: 24, olderFrom: 40 } as const;
export const MEDICAL_KIND = 'pilot.medical';
const medicalMonths = (sim: Simulation, person: Person) => (ageOn(sim, person, sim.now) < MEDICAL.olderFrom ? MEDICAL.youngMonths : MEDICAL.olderMonths);

/**
 * A plane bought on a loan, from 2026-09-30: AOPA Finance's single-engine
 * terms, the middle of its 6.99% to 9.99%, at least 15% down on one built
 * from 1960, and 20 years on a loan of $75,000 or more; the 700 most
 * lenders ask, AOPA says. The FAA's registration is paid at the sale.
 */
export const PLANE_LOAN = { apr: 0.0849, downShare: 0.15, months: 240, minScore: 700 } as const;

/**
 * The weather a visual flight needs: fog is under the three miles of 14 CFR
 * 91.155, and a thunderstorm is to be kept 20 miles off, as the FAA's pilot's
 * handbook says; on either, a flight of one's own that day is refused. Rain
 * and snow are flown in, the rule asking visibility and not dryness.
 */
export const NOT_VISUAL: ReadonlySet<string> = new Set(['Fog', 'Thunderstorm']);

/**
 * A flight not by airline, with the taxi to its airport and from the far
 * one, at the town's rate card or SLATE's estimate, as an airline journey's
 * (`groundLeg` in `content/air.ts`). Until 2026-09-30 a flight of one's own
 * and a charter began and ended on the runway, the drive left out.
 */
function withTheDrives(sim: Simulation, fromCity: string, toCity: string, a: { airport: { iata: string }; km: number }, b: { airport: { iata: string }; km: number }, leg: JourneyLeg): JourneyLeg[] {
  const cur = saveCurrency(sim.universe);
  const money = (amount: number, currency: string) => { const c = Math.round(amount * 100); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
  const out = groundLeg(fromCity, a.airport.iata, a.km);
  const back = groundLeg(toCity, b.airport.iata, b.km);
  return [
    { mode: 'ground', from: fromCity, to: a.airport.iata, departAt: leg.departAt - out.minutes * 60_000, arriveAt: leg.departAt, fare: money(out.amount, out.currency), basis: out.basis },
    leg,
    { mode: 'ground', from: b.airport.iata, to: toCity, departAt: leg.arriveAt, arriveAt: leg.arriveAt + back.minutes * 60_000, fare: money(back.amount, back.currency), basis: back.basis },
  ];
}

const usd = (sim: Simulation, cents: Money) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? cents : exchange(cents, 'USD', cur) ?? cents; };

/** A month's training, and what the tests cost at the end, in the save's money: America's, or another country's school's whole cost by the month. */
export function trainingCosts(sim: Simulation, country = 'us'): { month: Money; tests: Money; total: Money } {
  const school = PILOT_SCHOOLS[country];
  if (school) {
    const cur = saveCurrency(sim.universe);
    const c = Math.round((school.total / PILOT_TRAINING.months) * 100);
    const month = cur === school.currency ? c : exchange(c, school.currency, cur) ?? c;
    return { month, tests: 0, total: month * PILOT_TRAINING.months };
  }
  const t = PILOT_TRAINING;
  const month = usd(sim, Math.round(((t.hours * t.ratePerHour + t.dualHours * t.instructorPerHour) / t.months) * 100));
  const tests = usd(sim, (t.knowledgeTest + t.checkride) * 100);
  return { month, tests, total: month * t.months + tests };
}

/** Where they'd train: the country they live in. */
export const trainingCountry = (person: Person): string => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId ?? '';

export function trainRefusal(sim: Simulation, person: Person): string | undefined {
  const country = trainingCountry(person);
  const medical = person.pilotTraining === undefined && country === 'us' ? usd(sim, Math.round(MEDICAL.usd * 100)) : 0;
  if (licensedIn(person, country)) return country === 'us' ? 'You hold a private pilot certificate.' : 'You hold this country’s license.';
  if (person.pilotTraining?.status === 'training') return 'You’re training already.';
  if (country !== 'us' && !PILOT_SCHOOLS[country]) return 'SLATE prices a pilot’s training in America, Britain, Ireland and Canada only yet.';
  if (person.pilotTraining?.status === 'stopped' && (person.pilotTraining.country ?? 'us') !== country) return 'Training taken up again is where it was begun.';
  if (ageOn(sim, person, sim.now) < PILOT_TRAINING.minAge) return `A private pilot certificate is had from ${PILOT_TRAINING.minAge}.`;
  if (inTheBank(sim, person) < trainingCosts(sim, country).month + medical) return 'There isn’t enough in the bank for the first month.';
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
  const fromCountry = CITIES.get(fromCity)?.countryId ?? '';
  const abroad = fromCountry !== 'us' ? PILOT_SCHOOLS[fromCountry] : undefined;
  if (abroad) return planFlyAbroad(sim, person, fromCity, toCity, day, slot, abroad);
  if (!person.pilot && !ownsHere) return 'Flying yourself asks a pilot certificate.';
  // A pilot flying needs a medical in force.
  if (person.pilot?.medicalUntil !== undefined && person.pilot.medicalUntil < day) return 'Your medical has lapsed: it’s renewed when the bank can pay.';
  const fromAp = airportsFor(fromCity)[0];
  const toAp = airportsFor(toCity)[0];
  const from = fromAp?.airport;
  const to = toAp?.airport;
  if (!from || !to || from.country !== 'US' || to.country !== 'US') return 'A plane is rented on an FAA certificate in America only.';
  if (from.iata === to.iata) return 'One airport serves both towns.';
  const nm = distanceKm(from, to) / 1.852;
  const usable = SKYHAWK.rangeNm - SKYHAWK.knots * SKYHAWK.reserveHours;
  if (nm > usable) return `${Math.round(nm)} nautical miles is past a Skyhawk’s ${Math.round(usable)} with a day flight’s reserve.`;
  const hours = nm / SKYHAWK.knots + SKYHAWK.overheadHours;
  // Visual flight: no fog or thunderstorm at either end that day.
  for (const city of [fromCity, toCity]) { const w = weatherOn(sim, CITIES.require(city), day).condition; if (NOT_VISUAL.has(w)) return `${w === 'Fog' ? 'Fog' : 'A thunderstorm'} in ${CITIES.require(city).name} that day: no visual flight.`; }
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(10, slot)) }, zone);
  // One's own plane, where it is, flies for its fuel; otherwise a school's, by the hour.
  const own = ownsHere;
  // Not a pilot, the owner hires one to fly it.
  const hired = own && !person.pilot;
  const fare = own ? Math.round(ownHourCost(sim, fromCity) * hours) + (hired ? usd(sim, hiredPilotUsd(hours) * 100) : 0) : usd(sim, Math.round(hours * PILOT_TRAINING.ratePerHour * 100));
  // Its own kind of leg, flown oneself: no airline's delays or round-trip fares touch it.
  return withTheDrives(sim, fromCity, toCity, fromAp!, toAp!, { mode: 'fly', from: from.iata, to: to.iata, departAt: depart, arriveAt: depart + Math.round(hours * 60) * 60_000, fare, routeId: own ? 'own' : 'rent', basis: own ? `${Math.round(nm)} nautical miles in your own Cessna 172 at 124 knots, ${hours.toFixed(1)} hours at 10.2 gallons an hour of 100LL at the region’s price${hired ? `, and a hired commercial pilot’s $${hiredPilotUsd(hours).toLocaleString('en-US')} for the day` : ''}.` : `${Math.round(nm)} nautical miles flown yourself in a rented Cessna 172 at Textron’s 124 knots, ${hours.toFixed(1)} hours at the median school’s $176 an hour with fuel.` });
}

function scheduleMonth(sim: Simulation, person: Person): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: PILOT_MONTH_KIND, label: 'Flight Training', category: 'personal', priority: 30, payload: { personId: person.id } });
}

export function registerAviation(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { month: Money; total: Money }>('pilot.train', (_p, { sim: s }) => {
    const person = s.player;
    const no = trainRefusal(s, person);
    if (no) throw new CommandError(no);
    const country = trainingCountry(person);
    const costs = trainingCosts(s, country);
    // Stopped at the tests: taken up again, the tests are what's left.
    if (person.pilotTraining?.status === 'stopped' && person.pilotTraining.monthsDone >= PILOT_TRAINING.months) {
      person.pilotTraining.status = 'training';
      s.schedule({ at: s.now, kind: PILOT_MONTH_KIND, label: 'Flight Training', category: 'personal', priority: 30, payload: { personId: person.id } });
      return { month: 0, total: costs.tests };
    }
    const first = person.pilotTraining === undefined || (person.pilotTraining.status === 'certified' && (person.pilotTraining.country ?? 'us') !== country);
    // The FAA's medical is had before the first solo: paid with the first month.
    const medical = first && country === 'us' ? usd(s, Math.round(MEDICAL.usd * 100)) : 0;
    if (!payFromBank(s, person, costs.month + medical, first ? 'Flight training, a month, and the medical' : 'Flight training, a month', 'travel')) throw new CommandError('Your bank couldn’t pay.');
    const done = person.pilotTraining?.status === 'stopped' ? person.pilotTraining.monthsDone : 0;
    person.pilotTraining = { startedAt: done > 0 ? person.pilotTraining!.startedAt : s.now, monthsDone: done + 1, status: 'training', ...(country !== 'us' ? { country } : {}) };
    scheduleMonth(s, person);
    return { month: costs.month, total: costs.total };
  });

  sim.onSchedule(MEDICAL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const pilot = person?.pilot;
    if (!person || !pilot) return;
    // Renewed and paid, for its months; or lapsed, and asked again a month on.
    if (payFromBank(s, person, usd(s, Math.round(MEDICAL.usd * 100)), 'A pilot’s medical, renewed', 'travel')) pilot.medicalUntil = addMonths(s.now, medicalMonths(s, person), s.zone);
    s.schedule({ at: pilot.medicalUntil !== undefined && pilot.medicalUntil > s.now ? pilot.medicalUntil : s.now + 30 * MS_DAY, kind: MEDICAL_KIND, label: 'Pilot’s Medical', category: 'personal', priority: 30, payload: { personId: person.id } });
  });

  sim.onSchedule(PILOT_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const t = person?.pilotTraining;
    if (!person || !t || t.status !== 'training') return;
    const costs = trainingCosts(s, t.country ?? 'us');
    const school = t.country ? PILOT_SCHOOLS[t.country] : undefined;
    const mine = person.id === s.universe.playerId;
    if (t.monthsDone >= PILOT_TRAINING.months && school) {
      // Abroad the school's cost was the whole of it: the license, its tests in it.
      t.status = 'certified';
      person.pilotLicences = [...(person.pilotLicences ?? []), { authority: school.authority, country: t.country!, issuedAt: s.now }];
      if (mine) s.notify({ category: 'personal', title: 'A Private Pilot', body: `${school.license} is yours.`, importance: 70, route: '/workspace/travel' });
      return;
    }
    if (t.monthsDone >= PILOT_TRAINING.months) {
      if (!payFromBank(s, person, costs.tests, 'The knowledge test and the checkride', 'travel')) {
        t.status = 'stopped';
        if (mine) s.notify({ category: 'personal', title: 'Training Stopped', body: `Your bank couldn’t pay the tests, ${formatMoney(costs.tests, saveCurrency(s.universe))}.`, importance: 60, route: '/workspace/travel' });
        return;
      }
      t.status = 'certified';
      person.pilot = { issuedAt: s.now, authority: 'FAA', medicalUntil: person.pilotTraining?.startedAt !== undefined ? addMonths(person.pilotTraining.startedAt, medicalMonths(s, person), s.zone) : addMonths(s.now, medicalMonths(s, person), s.zone) };
      s.schedule({ at: person.pilot.medicalUntil!, kind: MEDICAL_KIND, label: 'Pilot’s Medical', category: 'personal', priority: 30, payload: { personId: person.id } });
      if (mine) s.notify({ category: 'personal', title: 'A Private Pilot', body: 'You passed the knowledge test and the checkride: the FAA’s private pilot certificate is yours.', importance: 70, route: '/workspace/travel' });
      return;
    }
    if (!payFromBank(s, person, costs.month, 'Flight training, a month', 'travel')) {
      t.status = 'stopped';
      if (mine) s.notify({ category: 'personal', title: 'Training Stopped', body: 'Your bank couldn’t pay the month’s flying. Take it up again on Travel.', importance: 60, route: '/workspace/travel' });
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

export interface OwnedAircraft { boughtAt: Instant; price: Money; homeCity: string; at: string; hours: number; overhauledAt: Instant; annualDue: Instant; registeredUntil: Instant; soldAt?: Instant; loan?: { owed: Money; monthly: Money; monthsLeft: number } }

const regionOf = (cityId: string) => CITIES.get(cityId)?.parentId ?? '';

/** An hour flown in one's own plane: its fuel at the region's price, in the save's money. */
export function ownHourCost(sim: Simulation, cityId: string): Money {
  return usd(sim, Math.round(OWN_172.gph * (OWN_172.avgas[regionOf(cityId)] ?? OWN_172.avgasNational) * 100));
}

export function buyAircraftRefusal(sim: Simulation, person: Person, financed = false): string | undefined {
  if (person.aircraft && person.aircraft.soldAt === undefined) return 'You own a plane.';
  if (CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId !== 'us') return 'SLATE prices a plane’s keeping in America only yet.';
  if (financed && (person.credit?.score ?? 0) < PLANE_LOAN.minScore) return 'An aircraft lender asks a record of 700.';
  if (inTheBank(sim, person) < usd(sim, Math.round(((financed ? OWN_172.priceUsd * PLANE_LOAN.downShare : OWN_172.priceUsd) + OWN_172.registration) * 100))) return `A 172 costs about ${formatMoney(usd(sim, OWN_172.priceUsd * 100), saveCurrency(sim.universe), { cents: false })}.`;
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
  sim.onCommand<{ financed?: boolean }, { paid: Money }>('aircraft.buy', (p, { sim: s }) => {
    const person = s.player;
    const financed = p?.financed === true;
    const no = buyAircraftRefusal(s, person, financed);
    if (no) throw new CommandError(no);
    const price = usd(s, OWN_172.priceUsd * 100);
    const lent = financed ? price - Math.round(price * PLANE_LOAN.downShare) : 0;
    const paid = price - lent + usd(s, OWN_172.registration * 100);
    if (!payFromBank(s, person, paid, 'A Cessna 172, and its FAA registration', 'travel')) throw new CommandError('Your bank couldn’t pay.');
    const home = person.home?.cityId ?? person.currentLocationId;
    person.aircraft = { boughtAt: s.now, price, homeCity: home, at: home, hours: 0, overhauledAt: s.now, annualDue: s.now + YEAR, registeredUntil: s.now + OWN_172.registrationYears * YEAR };
    if (lent > 0) {
      person.aircraft.loan = { owed: lent, monthly: amortized(lent, PLANE_LOAN.apr, PLANE_LOAN.months), monthsLeft: PLANE_LOAN.months };
      s.post({ memo: 'A loan on the Cessna 172', category: 'travel', postings: [{ accountId: s.nominalAccount('expense', expenseFor('travel')).id, amount: lent }, { accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: -lent }] });
    }
    scheduleAircraft(s, person);
    return { paid };
  });

  sim.onCommand<Record<string, never>, { value: Money }>('aircraft.sell', (_p, { sim: s }) => {
    const person = s.player;
    const a = person.aircraft;
    if (!a || a.soldAt !== undefined) throw new CommandError('You own no plane.');
    const payoff = a.loan?.owed ?? 0;
    s.post({ memo: 'Sold the Cessna 172', category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: a.price - payoff }, ...(payoff > 0 ? [{ accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: payoff }] : []), { accountId: s.nominalAccount('income', 'Plane Sold').id, amount: -a.price }] });
    delete a.loan;
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
    // The loan: interest on what's owed, the rest off it, what the bank can't pay owed.
    if (a.loan) {
      const interest = Math.round((a.loan.owed * PLANE_LOAN.apr) / 12);
      const payment = Math.min(a.loan.monthly, a.loan.owed + interest);
      const principal = payment - interest;
      if (!payFromBank(s, person, payment, 'Loan payment on the plane', 'travel')) owe(s, person, payment, 'Loan payment on the plane', 'travel');
      s.post({ memo: 'Plane loan, principal repaid', category: 'travel', postings: [{ accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: principal }, { accountId: s.nominalAccount('expense', expenseFor('travel')).id, amount: -principal }] });
      a.loan.owed -= principal;
      a.loan.monthsLeft -= 1;
      if (a.loan.owed <= 0 || a.loan.monthsLeft <= 0) delete a.loan;
    }
    if (a.hours >= OWN_172.tboHours || s.now - a.overhauledAt >= OWN_172.tboYears * YEAR) { pay(OWN_172.overhaul, 'The plane’s engine overhauled'); a.hours = 0; a.overhauledAt = s.now; }
    scheduleAircraft(s, person);
  });
}

// ---------------------------------------------------------------------------
// A light jet chartered (stage 7f, from 2026-09-30), researched in
// docs/research/world/research-charter.json.

/**
 * A light jet chartered between two American airports: Textron's Citation
 * CJ3 Gen2 at its 416 knots and within its 2,040 nautical miles less the 45
 * minutes an instrument flight holds in reserve (14 CFR 91.167; no
 * alternate is kept), or twice that with one stop for fuel, as a light
 * jet crossing the country makes; the half hour taxiing and climbing each
 * time, and 45 minutes on the ground to refuel, unbilled, are SLATE's.
 * Billed at the middle of Paramount Business Jets' $3,750 to $4,200 an hour
 * for a light jet, for the flight there and the jet's flight back, as a
 * one-way charter is: evoJets' $45,100 to $55,100 from Teterboro to Van
 * Nuys is about twice the hours one way. Paramount bills at least two hours
 * a day. On top, the federal excise tax on air transportation, 7.5%, and the
 * 2026 segment fee of $5.30 (26 USC 4261, Rev. Proc. 2025-32).
 */
export const LIGHT_JET = { knots: 416, rangeNm: 2_040, reserveHours: 0.75, overheadHours: 0.5, rateUsd: 3_975, minHours: 2, excise: 0.075, segmentUsd: 5.3, fuelStopHours: 0.75 } as const;

/** What a light jet charter bills for a flight of so many hours, in dollars. */
export function jetCharterUsd(hours: number): number {
  const billed = Math.max(LIGHT_JET.minHours, hours * 2);
  return Math.round((billed * LIGHT_JET.rateUsd * (1 + LIGHT_JET.excise) + LIGHT_JET.segmentUsd) * 100) / 100;
}

/**
 * A light jet chartered within Britain or Canada, from 2026-09-30
 * (`docs/research/world/research-charter-abroad.json`), the same CJ3 and the
 * same billing of the flight there and back:
 * - Britain: ACC Aviation's £2,600 an hour for a light jet (April 2025); no
 *   Air Passenger Duty, which falls on aircraft of 5.7 tonnes or more; VAT at
 *   20%, as only an aircraft built for ten passengers or more is zero-rated.
 * - Canada: Novajet's C$3,000 to C$5,000 an hour, the middle; GST, or HST in
 *   a participating province, where it leaves from (CRA's GI-170): Ontario's
 *   13%, British Columbia's 5%.
 * Ireland's and Mexico's rates were read only from brokers, and a flight
 * across a border isn't chartered here.
 */
export const JET_ABROAD: Readonly<Record<string, { rate: number; currency: string; tax: (fromCity: string) => number; basis: string }>> = {
  GB: { rate: 2_600, currency: 'GBP', tax: () => 0.2, basis: 'ACC Aviation’s £2,600 an hour, with VAT at 20%' },
  CA: { rate: 4_000, currency: 'CAD', tax: (from) => (CITIES.get(from)?.parentId === 'ca-08' ? 0.13 : 0.05), basis: 'Novajet’s C$4,000 an hour, with GST or HST where it leaves from' },
};

/** A journey's leg in a chartered light jet, or why not. */
export function planCharterJet(sim: Simulation, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const fromAp = airportsFor(fromCity)[0];
  const toAp = airportsFor(toCity)[0];
  const from = fromAp?.airport;
  const to = toAp?.airport;
  const abroad = from && to && from.country === to.country && from.country !== 'US' ? JET_ABROAD[from.country] : undefined;
  if (!from || !to || (!abroad && (from.country !== 'US' || to.country !== 'US'))) return 'SLATE charters a jet within America, Britain or Canada only yet.';
  if (from.iata === to.iata) return 'One airport serves both towns.';
  const nm = distanceKm(from, to) / 1.852;
  const usable = LIGHT_JET.rangeNm - LIGHT_JET.knots * LIGHT_JET.reserveHours;
  // Past its range, it stops once for fuel, as a light jet crossing the country does.
  if (nm > 2 * usable) return `${Math.round(nm)} nautical miles is past a light jet’s ${Math.round(2 * usable)} with one stop for fuel.`;
  const stops = nm > usable ? 1 : 0;
  const hours = nm / LIGHT_JET.knots + LIGHT_JET.overheadHours * (1 + stops);
  const onTheGround = stops * LIGHT_JET.fuelStopHours;
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(10, slot)) }, zone);
  const dollars = jetCharterUsd(hours);
  const cur = saveCurrency(sim.universe);
  const abroadFare = abroad ? (() => { const c = Math.round(Math.max(LIGHT_JET.minHours, hours * 2) * abroad.rate * (1 + abroad.tax(fromCity)) * 100); return cur === abroad.currency ? c : exchange(c, abroad.currency, cur) ?? c; })() : 0;
  return withTheDrives(sim, fromCity, toCity, fromAp!, toAp!, { mode: 'fly', from: from.iata, to: to.iata, departAt: depart, arriveAt: depart + Math.round((hours + onTheGround) * 60) * 60_000, fare: abroad ? abroadFare : usd(sim, Math.round(dollars * 100)), routeId: 'jet', basis: `${Math.round(nm)} nautical miles in a chartered Citation CJ3 at Textron’s 416 knots, ${hours.toFixed(1)} hours${stops ? ' and a stop for fuel' : ''}; billed for the flight there and back at ${abroad ? abroad.basis : '$3,975 an hour, with the 7.5% federal excise tax and its segment fee'}.` });
}

/** A leg flown oneself within Britain, Ireland or Canada, on that country's license, in a rented four-seater at its school's rate. */
function planFlyAbroad(sim: Simulation, person: Person, fromCity: string, toCity: string, day: Instant, slot: number, school: (typeof PILOT_SCHOOLS)[string]): JourneyLeg[] | string {
  const country = CITIES.get(fromCity)?.countryId ?? '';
  if (!licensedIn(person, country)) return `Flying yourself here asks ${school.license.replace(/^An? /, 'a ')}.`;
  const fromAp = airportsFor(fromCity)[0];
  const toAp = airportsFor(toCity)[0];
  const from = fromAp?.airport;
  const to = toAp?.airport;
  if (!from || !to || from.country !== school.airport || to.country !== school.airport) return 'A plane is rented on a license within its country only.';
  if (from.iata === to.iata) return 'One airport serves both towns.';
  const nm = distanceKm(from, to) / 1.852;
  const usable = SKYHAWK.rangeNm - SKYHAWK.knots * SKYHAWK.reserveHours;
  if (nm > usable) return `${Math.round(nm)} nautical miles is past a four-seater’s ${Math.round(usable)} with a day flight’s reserve.`;
  const hours = nm / SKYHAWK.knots + SKYHAWK.overheadHours;
  for (const city of [fromCity, toCity]) { const w = weatherOn(sim, CITIES.require(city), day).condition; if (NOT_VISUAL.has(w)) return `${w === 'Fog' ? 'Fog' : 'A thunderstorm'} in ${CITIES.require(city).name} that day: no visual flight.`; }
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(10, slot)) }, zone);
  const cur = saveCurrency(sim.universe);
  const c = Math.round(hours * school.rentHour * 100);
  const fare = cur === school.currency ? c : exchange(c, school.currency, cur) ?? c;
  return withTheDrives(sim, fromCity, toCity, fromAp!, toAp!, { mode: 'fly', from: from.iata, to: to.iata, departAt: depart, arriveAt: depart + Math.round(hours * 60) * 60_000, fare, routeId: 'rent', basis: `${Math.round(nm)} nautical miles flown yourself in a rented four-seater at 124 knots, ${hours.toFixed(1)} hours at the school’s ${school.currency === 'GBP' ? '£' : school.currency === 'EUR' ? '€' : 'C$'}${school.rentHour} an hour.` });
}
