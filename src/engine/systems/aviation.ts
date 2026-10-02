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
 * The tests can be failed, from 2026-10-02
 * (`docs/research/world/research-boat-pilot-exams.json`): the knowledge test
 * at the FAA's own 89.56% passed in 2025 (44,657 taken), the checkride at
 * the 75.1% secondary sites give for 2025, none being published by the FAA
 * (decider `pilot.tests`, `passesPilotTest`). Failed, the knowledge test is taken again a month
 * on, after more instruction, at its fee; the checkride a month on, at half
 * the examiner's fee, as the examiners who publish theirs charge for a
 * retest.
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
import { airportsFor, kmToCountry } from './airports';
import { groundLeg } from '../content/air';
import { ageOn } from './mortality';
import { expenseFor, inTheBank, owe, payFromBank } from './household';
import { DEFAULT_AFTER_MISSED, REPOSSESSED_ON_RECORD } from '../content/repossession';
import { markRecord } from './credit';
import { amortized } from './vehicles';
import { weatherOn } from './weather';
import type { JourneyLeg } from './journey';

export const PILOT_TRAINING = {
  minAge: 17, months: 6, hours: 60, dualHours: 20, ratePerHour: 176, instructorPerHour: 75, knowledgeTest: 175, checkride: 1_000,
} as const;
export const SKYHAWK = { knots: 124, rangeNm: 640, reserveHours: 0.5, overheadHours: 0.2 } as const;
export const PILOT_MONTH_KIND = 'pilot.month';
/** The share passing each test: the FAA's knowledge test, 2025; the checkride, a secondary figure. And a checkride retest's share of the fee. */
export const PILOT_PASS = { knowledge: 0.8956, checkride: 0.751, retestShare: 0.5 } as const;

export interface PilotTraining { startedAt: Instant; monthsDone: number; status: 'training' | 'stopped' | 'certified'; /** Where, from 2026-09-30: absent, America. */ country?: string; /** The knowledge test passed, and the checkrides taken, from 2026-10-02. */ knowledgePassed?: boolean; knowledgeTries?: number; checkrides?: number }

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
 * The medical each license asks wasn't priced until 2026-10-01 (`MEDICAL_ABROAD`).
 * From then too (`docs/research/world/research-aviation-boats-credit-mot.json`):
 * - Mexico, AFAC's private pilot license: Voláre's MX$212,350 in Guadalajara,
 *   the one school that prints a whole course (no Mexico City school does),
 *   for the 40 hours at least, 20 with an instructor, that article 50 of the
 *   regulation asks; a Cessna 172 after at Aviafly's MX$4,500 an hour, a
 *   school's rate, as no solo rental rate is published in Mexico.
 */
export const PILOT_SCHOOLS: Readonly<Record<string, { authority: string; license: string; currency: string; total: number; rentHour: number; airport: string }>> = {
  uk: { authority: 'CAA', license: 'A UK Private Pilot Licence', currency: 'GBP', total: 15_250, rentHour: 265, airport: 'GB' },
  ie: { authority: 'IAA', license: 'An Irish Private Pilot Licence', currency: 'EUR', total: 30 * 175 + 25 * 160 + 500 + 1_560 + 1_000, rentHour: 160, airport: 'IE' },
  ca: { authority: 'TC', license: 'A Canadian Private Pilot Licence', currency: 'CAD', total: 21_500, rentHour: 220, airport: 'CA' },
  mx: { authority: 'AFAC', license: 'A Mexican Private Pilot License', currency: 'MXN', total: 212_350, rentHour: 4_500, airport: 'MX' },
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

/**
 * The medical a license abroad asks, from 2026-10-01
 * (`docs/research/world/research-aviation-boats-credit-mot.json`), the
 * examiner's fee and the authority's charge together: Britain's Class 2 at
 * Aviation Medicals Wessex's £180 and the CAA's £11.67; Ireland's at Dr
 * Kieran Whyte's €200 and the IAA's €22; Canada's Category 3 at YOW Aviation
 * Medicals' C$240 and Transport Canada's C$67.75; Mexico's at AFAC's
 * MX$4,267, its tariff read to 30 June 2026. It runs 60 months under 40 and
 * 24 after in America and Canada (14 CFR 61.23, CAR 404.04); in Britain and
 * Ireland 24 from 40 and 12 from 50 (MED.A.045), and Mexico's is taken to
 * follow ICAO's Annex 1, whose Class 2 runs the same, as its own wasn't read.
 */
export const MEDICAL_ABROAD: Readonly<Record<string, { currency: string; fee: number }>> = {
  uk: { currency: 'GBP', fee: 180 + 11.67 },
  ie: { currency: 'EUR', fee: 200 + 22 },
  ca: { currency: 'CAD', fee: 240 + 67.75 },
  mx: { currency: 'MXN', fee: 4_267 },
};
export function medicalMonthsAt(country: string, age: number): number {
  if (age < MEDICAL.olderFrom) return MEDICAL.youngMonths;
  return country === 'us' || country === 'ca' || age < 50 ? MEDICAL.olderMonths : 12;
}
const medicalMonths = (sim: Simulation, person: Person, country = 'us') => medicalMonthsAt(country, ageOn(sim, person, sim.now));
/** A medical's fee in a country, in the save's money. */
export function medicalFee(sim: Simulation, country: string): Money {
  if (country === 'us') return usd(sim, Math.round(MEDICAL.usd * 100));
  const m = MEDICAL_ABROAD[country];
  if (!m) return 0;
  const cur = saveCurrency(sim.universe);
  const c = Math.round(m.fee * 100);
  return cur === m.currency ? c : exchange(c, m.currency, cur) ?? c;
}

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
  const medical = person.pilotTraining === undefined ? medicalFee(sim, country) : 0;
  if (licensedIn(person, country)) return country === 'us' ? 'You hold a private pilot certificate.' : 'You hold this country’s license.';
  if (person.pilotTraining?.status === 'training') return 'You’re training already.';
  if (country !== 'us' && !PILOT_SCHOOLS[country]) return 'SLATE prices a pilot’s training in America, Britain, Ireland, Canada and Mexico only yet.';
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
  const ownsHere = planeOf(person, undefined, fromCity) !== undefined;
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

/** Whether a test is passed, at its published share (decider `pilot.tests`); `odds` overrides it for the sweep. */
export function passesPilotTest(sim: Simulation, person: Person, test: 'knowledge' | 'checkride', attempt: number, odds?: number): boolean {
  return sim.rng('pilot.tests', person.id, test, attempt).next() < (odds ?? PILOT_PASS[test]);
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
    // The medical is had before the first solo: paid with the first month, abroad too from 2026-10-01.
    const medical = first ? medicalFee(s, country) : 0;
    if (!payFromBank(s, person, costs.month + medical, first ? 'Flight training, a month, and the medical' : 'Flight training, a month', 'travel')) throw new CommandError('Your bank couldn’t pay.');
    const done = person.pilotTraining?.status === 'stopped' ? person.pilotTraining.monthsDone : 0;
    person.pilotTraining = { startedAt: done > 0 ? person.pilotTraining!.startedAt : s.now, monthsDone: done + 1, status: 'training', ...(country !== 'us' ? { country } : {}) };
    scheduleMonth(s, person);
    return { month: costs.month, total: costs.total };
  });

  sim.onSchedule(MEDICAL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    // A license abroad's own medical (from 2026-10-01), renewed the same way at its country's fee and months.
    const country = item.payload.country === undefined ? undefined : String(item.payload.country);
    const licence = country ? person?.pilotLicences?.find((l) => l.country === country) : undefined;
    if (person && licence && country) {
      if (payFromBank(s, person, medicalFee(s, country), 'A pilot’s medical, renewed', 'travel')) licence.medicalUntil = addMonths(s.now, medicalMonths(s, person, country), s.zone);
      s.schedule({ at: licence.medicalUntil !== undefined && licence.medicalUntil > s.now ? licence.medicalUntil : s.now + 30 * MS_DAY, kind: MEDICAL_KIND, label: 'Pilot’s Medical', category: 'personal', priority: 30, payload: { personId: person.id, country } });
      return;
    }
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
      // Its medical, had with the first month, runs from then.
      const medicalUntil = addMonths(t.startedAt, medicalMonths(s, person, t.country!), s.zone);
      person.pilotLicences = [...(person.pilotLicences ?? []), { authority: school.authority, country: t.country!, issuedAt: s.now, medicalUntil }];
      s.schedule({ at: Math.max(s.now, medicalUntil), kind: MEDICAL_KIND, label: 'Pilot’s Medical', category: 'personal', priority: 30, payload: { personId: person.id, country: t.country! } });
      if (mine) s.notify({ category: 'personal', title: 'A Private Pilot', body: `${school.license} is yours.`, importance: 70, route: '/workspace/travel' });
      return;
    }
    if (t.monthsDone >= PILOT_TRAINING.months) {
      // The knowledge test, until passed; then the checkride, a retest at half its fee (from 2026-10-02).
      const test = !t.knowledgePassed ? 'knowledge' : 'checkride';
      const fee = test === 'knowledge' ? usd(s, PILOT_TRAINING.knowledgeTest * 100) : usd(s, Math.round(PILOT_TRAINING.checkride * ((t.checkrides ?? 0) > 0 ? PILOT_PASS.retestShare : 1) * 100));
      if (!payFromBank(s, person, fee, test === 'knowledge' ? 'The knowledge test' : (t.checkrides ?? 0) > 0 ? 'The checkride, a retest' : 'The checkride', 'travel')) {
        t.status = 'stopped';
        if (mine) s.notify({ category: 'personal', title: 'Training Stopped', body: `Your bank couldn’t pay the ${test === 'knowledge' ? 'knowledge test' : 'checkride'}, ${formatMoney(fee, saveCurrency(s.universe))}.`, importance: 60, route: '/workspace/travel' });
        return;
      }
      const passed = passesPilotTest(s, person, test, test === 'knowledge' ? t.knowledgeTries ?? 0 : t.checkrides ?? 0);
      if (test === 'checkride') t.checkrides = (t.checkrides ?? 0) + 1;
      else t.knowledgeTries = (t.knowledgeTries ?? 0) + 1;
      if (!passed) {
        if (mine) s.notify({ category: 'personal', title: test === 'knowledge' ? 'Knowledge Test Failed' : 'Checkride Failed', body: test === 'knowledge' ? 'Below the 70% it needs: more instruction, and it’s taken again next month.' : 'The examiner didn’t pass it: a retest next month, at half the fee.', importance: 60, route: '/workspace/travel' });
        scheduleMonth(s, person);
        return;
      }
      if (test === 'knowledge') {
        t.knowledgePassed = true;
        if (mine) s.notify({ category: 'personal', title: 'Knowledge Test Passed', body: 'The checkride is next month.', importance: 40, route: '/workspace/travel' });
        scheduleMonth(s, person);
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

export interface OwnedAircraft { id: string; boughtAt: Instant; price: Money; homeCity: string; at: string; hours: number; overhauledAt: Instant; annualDue: Instant; registeredUntil: Instant; soldAt?: Instant; loan?: { owed: Money; monthly: Money; monthsLeft: number; missed?: number }; repossessed?: { at: Instant; saleAt: Instant } }

/**
 * A plane loan in default, from 2026-10-01
 * (`docs/research/world/research-aviation-boats-credit-mot.json`). Three
 * payments missed running, as SLATE takes a car's and a boat's, and the
 * lender takes the plane back without a court where it breaches no peace
 * (UCC 9-609), filing the FAA's Form 8050-4, and sells it after the ten
 * days' notice UCC 9-612 makes safe. The shortfall is owed in each of
 * SLATE's states: California's Unruh Act expressly leaves out an
 * FAA-registered aircraft (Civ. Code 1801.4), and a 172's loan is past the
 * $75,000 Connecticut's consumer act reaches. The retaking's cost, which
 * UCC 9-615 lets the lender add, is the middle of the $1,500 to $15,000 a
 * repossession specialist's job is put at (secondary); its ferry flight and
 * storage are published nowhere and aren't kept. It goes on the record as
 * a car's repossession does.
 */
export const PLANE_REPO = { noticeDays: 10, retakingUsd: (1_500 + 15_000) / 2 } as const;
export const AIRCRAFT_REPO_SALE_KIND = 'aircraft.repo_sale';

const regionOf = (cityId: string) => CITIES.get(cityId)?.parentId ?? '';

/** An hour flown in one's own plane: its fuel at the region's price, in the save's money. */
export function ownHourCost(sim: Simulation, cityId: string): Money {
  return usd(sim, Math.round(OWN_172.gph * (OWN_172.avgas[regionOf(cityId)] ?? OWN_172.avgasNational) * 100));
}

/**
 * The planes they own now, as many as the bank, the lender and a tiedown for
 * each allow, from 2026-10-01; a save's single plane is moved into the list.
 * Until then a second was refused with "You own a plane.", a limit no law or
 * airport sets.
 */
export function planesOf(person: Person): OwnedAircraft[] {
  if (person.aircraft) { (person.planes ??= []).push({ ...person.aircraft, id: person.aircraft.id ?? 'plane-first' }); delete person.aircraft; }
  return (person.planes ?? []).filter((a) => a.soldAt === undefined);
}
/** One of their planes: the one named, or the first free to fly from a town. */
export function planeOf(person: Person, planeId?: string, at?: string): OwnedAircraft | undefined {
  const mine = planesOf(person);
  if (planeId !== undefined) return mine.find((a) => a.id === planeId);
  return at !== undefined ? mine.find((a) => a.at === at && !a.repossessed) : mine[0];
}
const planeFor = (person: Person | undefined, payload: Record<string, unknown>): OwnedAircraft | undefined => (person ? (payload.planeId !== undefined ? planesOf(person).find((a) => a.id === payload.planeId) : planesOf(person)[0]) : undefined);

export function buyAircraftRefusal(sim: Simulation, person: Person, financed = false): string | undefined {
  if (CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId !== 'us') return 'SLATE prices a plane’s keeping in America only yet.';
  if (financed && (person.credit?.score ?? 0) < PLANE_LOAN.minScore) return 'An aircraft lender asks a record of 700.';
  if (inTheBank(sim, person) < usd(sim, Math.round(((financed ? OWN_172.priceUsd * PLANE_LOAN.downShare : OWN_172.priceUsd) + OWN_172.registration) * 100))) return `A 172 costs about ${formatMoney(usd(sim, OWN_172.priceUsd * 100), saveCurrency(sim.universe), { cents: false })}.`;
  return undefined;
}

/** A flight in one's own plane arrives: the plane is there, and its hours are on the engine. */
export function ownFlown(person: Person, fromCity: string, toCity: string, hours: number): void {
  const a = planeOf(person, undefined, fromCity);
  if (!a) return;
  a.at = toCity;
  a.hours += hours;
}

function scheduleAircraft(sim: Simulation, person: Person, a: OwnedAircraft): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: AIRCRAFT_MONTH_KIND, label: 'The Plane’s Month', category: 'home', priority: 30, payload: { personId: person.id, planeId: a.id } });
}

export function registerOwnedAircraft(sim: Simulation): void {
  sim.onCommand<{ financed?: boolean }, { paid: Money; planeId: string }>('aircraft.buy', (p, { sim: s }) => {
    const person = s.player;
    const financed = p?.financed === true;
    const no = buyAircraftRefusal(s, person, financed);
    if (no) throw new CommandError(no);
    const price = usd(s, OWN_172.priceUsd * 100);
    const lent = financed ? price - Math.round(price * PLANE_LOAN.downShare) : 0;
    const paid = price - lent + usd(s, OWN_172.registration * 100);
    if (!payFromBank(s, person, paid, 'A Cessna 172, and its FAA registration', 'travel')) throw new CommandError('Your bank couldn’t pay.');
    const home = person.home?.cityId ?? person.currentLocationId;
    const plane: OwnedAircraft = { id: s.nextId('vehicle'), boughtAt: s.now, price, homeCity: home, at: home, hours: 0, overhauledAt: s.now, annualDue: s.now + YEAR, registeredUntil: s.now + OWN_172.registrationYears * YEAR };
    planesOf(person);
    (person.planes ??= []).push(plane);
    if (lent > 0) {
      plane.loan = { owed: lent, monthly: amortized(lent, PLANE_LOAN.apr, PLANE_LOAN.months), monthsLeft: PLANE_LOAN.months };
      s.post({ memo: 'A loan on the Cessna 172', category: 'travel', postings: [{ accountId: s.nominalAccount('expense', expenseFor('travel')).id, amount: lent }, { accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: -lent }] });
    }
    scheduleAircraft(s, person, plane);
    return { paid, planeId: plane.id };
  });

  sim.onCommand<{ planeId?: string }, { value: Money }>('aircraft.sell', (p, { sim: s }) => {
    const person = s.player;
    const a = planeOf(person, p?.planeId);
    if (!a) throw new CommandError(p?.planeId ? 'That isn’t a plane you own.' : 'You own no plane.');
    if (a.repossessed) throw new CommandError('The lender has the plane.');
    const payoff = a.loan?.owed ?? 0;
    s.post({ memo: 'Sold the Cessna 172', category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: a.price - payoff }, ...(payoff > 0 ? [{ accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: payoff }] : []), { accountId: s.nominalAccount('income', 'Plane Sold').id, amount: -a.price }] });
    delete a.loan;
    a.soldAt = s.now;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === AIRCRAFT_MONTH_KIND && item.payload.personId === person.id && planeFor(person, item.payload) === undefined) s.timeline.cancel(item.id, s.now);
    return { value: a.price };
  });

  sim.onSchedule(AIRCRAFT_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = planeFor(person, item.payload);
    if (!person || !a) return;
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
      const paid = payFromBank(s, person, payment, 'Loan payment on the plane', 'travel');
      if (!paid) owe(s, person, payment, 'Loan payment on the plane', 'travel');
      // Three missed running, and the lender takes it back (from 2026-10-01).
      a.loan.missed = paid ? 0 : (a.loan.missed ?? 0) + 1;
      if (a.loan.missed >= DEFAULT_AFTER_MISSED) {
        const saleAt = s.now + PLANE_REPO.noticeDays * MS_DAY;
        a.repossessed = { at: s.now, saleAt };
        markRecord(person, REPOSSESSED_ON_RECORD, s.now, a.homeCity);
        s.schedule({ at: saleAt, kind: AIRCRAFT_REPO_SALE_KIND, label: 'Repossessed Plane Sold', category: 'personal', priority: 30, payload: { personId: person.id, planeId: a.id } });
        if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Your Plane Was Repossessed', body: 'Three payments missed, the lender took the plane. It’s sold after ten days’ notice, what’s left owing is yours, and it’s on your record.', importance: 85, route: '/workspace/travel' });
      }
      s.post({ memo: 'Plane loan, principal repaid', category: 'travel', postings: [{ accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: principal }, { accountId: s.nominalAccount('expense', expenseFor('travel')).id, amount: -principal }] });
      a.loan.owed -= principal;
      a.loan.monthsLeft -= 1;
      if (a.loan.owed <= 0 || a.loan.monthsLeft <= 0) delete a.loan;
    }
    if (a.hours >= OWN_172.tboHours || s.now - a.overhauledAt >= OWN_172.tboYears * YEAR) { pay(OWN_172.overhaul, 'The plane’s engine overhauled'); a.hours = 0; a.overhauledAt = s.now; }
    // Taken back, it's the lender's to keep until it's sold, and its months end.
    if (!a.repossessed) scheduleAircraft(s, person, a);
  });

  sim.onSchedule(AIRCRAFT_REPO_SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = planeFor(person, item.payload);
    if (!person || !a?.repossessed) return;
    // Sold at what it's held at, less the retaking; the loan paid from it, a surplus back, the shortfall owed.
    const owed = a.loan?.owed ?? 0;
    const proceeds = Math.max(0, a.price - usd(s, Math.round(PLANE_REPO.retakingUsd * 100)));
    if (owed > 0) s.post({ memo: 'Plane repossessed and sold', category: 'travel', postings: [{ accountId: s.nominalAccount('liability_other', 'Aircraft Loans').id, amount: owed }, { accountId: s.nominalAccount('income', 'Plane Repossessed').id, amount: -owed }] });
    const surplus = proceeds - owed;
    if (surplus > 0) s.post({ memo: 'What the plane’s sale left over', category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: surplus }, { accountId: s.nominalAccount('income', 'Plane Repossessed').id, amount: -surplus }] });
    if (surplus < 0) owe(s, person, -surplus, 'Plane loan short after its sale', 'travel');
    a.soldAt = s.now;
    delete a.loan;
    delete a.repossessed;
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
 * across a border wasn't chartered here until 2026-10-01.
 * From 2026-10-01 (`docs/research/world/research-rentals-lets-charters-2.json`):
 * - Ireland: no Irish operator prints a rate, so LunaJets' €4,600 to €7,300
 *   an hour for a light jet, the middle, a Geneva broker's own indicative
 *   table; passenger transport is exempt from Irish VAT, and Ireland has no
 *   ticket tax.
 * - Mexico: Aerolíneas Ejecutivas' US$3,000 an hour, as El Financiero
 *   printed it in 2013, the latest any operator's rate was found, with IVA at
 *   16% within the country.
 * - Across a border, between Britain and Ireland and between America and
 *   Mexico, at the rate of the country it leaves: Britain zero-rates and
 *   Ireland exempts a flight abroad, and Air Passenger Duty spares a light jet
 *   until April 2027; Mexico taxes a quarter of an international fare at 16%,
 *   4% of it (LIVA art. 16, read secondhand); a flight beginning or ending in
 *   America pays its $23.40 international facilities tax (IRS, 2026) in place
 *   of the 7.5% excise. America and Canada stayed apart until later on
 *   2026-10-01 (`docs/research/world/research-open-final.json`): now a flight
 *   between them is chartered at the rate of the country it leaves. One to or
 *   from a Canadian airport within 225 miles of the United States is taxable
 *   transportation as a domestic one is (IRC 4262), the 7.5% and its segment
 *   fee, and no facilities tax (4261(c)(2)); past 225 miles, the facilities
 *   tax. SLATE measures to the nearest American airport, never nearer than
 *   the border, so a town just inside the zone can count as outside it. A
 *   Canadian operator's fare, paid outside America, drops the 7.5% for the
 *   facilities tax (4261(e)(2)), and CRA taxes a flight from Canada to the
 *   continental United States at the 5% GST, not HST, as the taxation area
 *   takes it in (GI-170).
 * An empty leg, a jet flying back empty, isn't kept: EBAA's 2017 study found
 * 41% of Europe's business flights empty, which says how many fly, not
 * whether one is offered on a route on a day, and no operator publishes that.
 */
export const JET_ABROAD: Readonly<Record<string, { rate: number; currency: string; tax: (fromCity: string) => number; abroadTax: number; basis: string }>> = {
  GB: { rate: 2_600, currency: 'GBP', tax: () => 0.2, abroadTax: 0, basis: 'ACC Aviation’s £2,600 an hour, with VAT at 20% within Britain' },
  CA: { rate: 4_000, currency: 'CAD', tax: (from) => (CITIES.get(from)?.parentId === 'ca-08' ? 0.13 : 0.05), abroadTax: 0, basis: 'Novajet’s C$4,000 an hour, with GST or HST where it leaves from' },
  IE: { rate: 5_950, currency: 'EUR', tax: () => 0, abroadTax: 0, basis: 'LunaJets’ €5,950 an hour, the middle of its light jets’, with no VAT on passenger transport' },
  MX: { rate: 3_000, currency: 'USD', tax: () => 0.16, abroadTax: 0.25 * 0.16, basis: 'Aerolíneas Ejecutivas’ US$3,000 an hour (El Financiero, 2013), with IVA' },
};
/** The borders a jet is chartered across, and America's international facilities tax a flight to or from it pays. */
const JET_CROSSINGS = new Set(['GB-IE', 'IE-GB', 'US-MX', 'MX-US', 'US-CA', 'CA-US']);
/** IRC 4262's zone: a Canadian or Mexican airport within 225 miles of America is taxed as a domestic flight is. */
export const DOMESTIC_ZONE_MILES = 225;
export const INTERNATIONAL_FACILITIES_USD = 23.4;

/** A journey's leg in a chartered light jet, or why not. */
export function planCharterJet(sim: Simulation, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const fromAp = airportsFor(fromCity)[0];
  const toAp = airportsFor(toCity)[0];
  const from = fromAp?.airport;
  const to = toAp?.airport;
  if (!from || !to) return 'SLATE charters a jet between airports only.';
  const across = from.country !== to.country;
  if (across ? !JET_CROSSINGS.has(`${from.country}-${to.country}`) : from.country !== 'US' && !JET_ABROAD[from.country]) return 'SLATE charters a jet within America, Britain, Ireland, Canada or Mexico, or between Britain and Ireland or America and its neighbors, only yet.';
  const abroad = from.country !== 'US' ? JET_ABROAD[from.country] : undefined;
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
  const cur = saveCurrency(sim.universe);
  const billed = Math.max(LIGHT_JET.minHours, hours * 2);
  const inCur = (units: number, currency: string) => { const c = Math.round(units * 100); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
  // America's facilities tax where a flight across a border begins or ends there (from 2026-10-01).
  // A flight from America to a Canadian or Mexican airport within IRC 4262's 225 miles is taxed as a domestic one.
  const neighbor = across && from.country === 'US' ? to : undefined;
  const zoned = neighbor !== undefined && kmToCountry(neighbor, 'US') / 1.609344 <= DOMESTIC_ZONE_MILES;
  const facilities = across && (from.country === 'US' || to.country === 'US') ? usd(sim, Math.round(INTERNATIONAL_FACILITIES_USD * 100)) : 0;
  // Leaving Canada for the United States, CRA's 5% GST (from later on 2026-10-01).
  const leavingTax = abroad && across ? (from.country === 'CA' && to.country === 'US' ? 0.05 : abroad.abroadTax) : 0;
  const fare = abroad
    ? inCur(billed * abroad.rate * (1 + (across ? leavingTax : abroad.tax(fromCity))), abroad.currency) + facilities
    : across && !zoned ? usd(sim, Math.round(billed * LIGHT_JET.rateUsd * 100)) + facilities : usd(sim, Math.round(jetCharterUsd(hours) * 100));
  const how = abroad ? abroad.basis : across && !zoned ? '$3,975 an hour, with the $23.40 international facilities tax' : '$3,975 an hour, with the 7.5% federal excise tax and its segment fee';
  return withTheDrives(sim, fromCity, toCity, fromAp!, toAp!, { mode: 'fly', from: from.iata, to: to.iata, departAt: depart, arriveAt: depart + Math.round((hours + onTheGround) * 60) * 60_000, fare, routeId: 'jet', basis: `${Math.round(nm)} nautical miles in a chartered Citation CJ3 at Textron’s 416 knots, ${hours.toFixed(1)} hours${stops ? ' and a stop for fuel' : ''}; billed for the flight there and back at ${how}${across && facilities ? ' and America’s $23.40 international facilities tax' : ''}.` });
}

/** A leg flown oneself within Britain, Ireland or Canada, on that country's license, in a rented four-seater at its school's rate. */
function planFlyAbroad(sim: Simulation, person: Person, fromCity: string, toCity: string, day: Instant, slot: number, school: (typeof PILOT_SCHOOLS)[string]): JourneyLeg[] | string {
  const country = CITIES.get(fromCity)?.countryId ?? '';
  if (!licensedIn(person, country)) return `Flying yourself here asks ${school.license.replace(/^An? /, 'a ')}.`;
  const until = person.pilotLicences?.find((l) => l.country === country)?.medicalUntil;
  if (until !== undefined && until < day) return 'Your medical has lapsed: it’s renewed when the bank can pay.';
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
