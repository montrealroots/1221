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
import { inTheBank, payFromBank } from './household';
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
export function planFlyYourself(sim: Simulation, person: Person, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  if (!person.pilot) return 'Flying yourself asks a pilot certificate.';
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
  const fare = usd(sim, Math.round(hours * PILOT_TRAINING.ratePerHour * 100));
  // Its own kind of leg, flown oneself: no airline's delays or round-trip fares touch it.
  return [{ mode: 'fly', from: from.iata, to: to.iata, departAt: depart, arriveAt: depart + Math.round(hours * 60) * 60_000, fare, basis: `${Math.round(nm)} nautical miles flown yourself in a rented Cessna 172 at Textron’s 124 knots, ${hours.toFixed(1)} hours at the median school’s $176 an hour with fuel; the drive to and from the airports isn’t kept.` }];
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
