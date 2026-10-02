/**
 * SLATE — getting to the airport and back by public transit instead of a
 * taxi (the master plan's §47, from 2026-10-02;
 * `docs/research/world/research-airport-ground.json`).
 *
 * Where a town's way to its airport by transit was read, a flight's ground
 * legs can go by it, at its own fare a person: New York's subway and AirTrain
 * to JFK at $11.75, the free Q70 to LaGuardia, PATH and the #62 bus to Newark
 * at $4.90; Los Angeles's Metro to LAX at $1.75; Toronto's UP Express at
 * C$12.35; Vancouver's Canada Line with its AddFare at C$11.60; London's
 * Piccadilly line to Heathrow at £5.90, the Gatwick Express at £20.50 and the
 * Stansted Express at £21.90; Dublin Bus at €2; Mexico City's Metro at MX$5.
 * Each is the cheapest whose fare was read for that town and airport. The
 * minutes are the operator's where it gives them (the UP Express's 28, the
 * Stansted Express's 48), and otherwise a taxi's, SLATE's estimate. A town
 * with no transit read goes by taxi, as before.
 */

import type { Simulation } from '../core/simulation';
import { inSaveMoney } from './banking';
import type { JourneyLeg } from './journey';

export type GroundWay = 'taxi' | 'transit';

/** The cheapest transit read between a town and an airport, its fare a person and its minutes where the operator gives them. */
export const TRANSIT: Readonly<Record<string, { via: string; fare: number; currency: string; minutes: number | null; confirmed: boolean }>> = {
  'us-ny-newyork|JFK': { via: 'The subway and AirTrain JFK', fare: 11.75, currency: 'USD', minutes: null, confirmed: true },
  'us-ny-newyork|LGA': { via: 'The Q70 LaGuardia Link bus', fare: 0, currency: 'USD', minutes: null, confirmed: true },
  'us-ny-newyork|EWR': { via: 'PATH and the NJ Transit #62 bus', fare: 4.9, currency: 'USD', minutes: null, confirmed: true },
  'us-ca-losangeles|LAX': { via: 'The Metro C or K Line and the LAX shuttle', fare: 1.75, currency: 'USD', minutes: null, confirmed: true },
  'ca-on-toronto|YYZ': { via: 'The UP Express from Union Station', fare: 12.35, currency: 'CAD', minutes: 28, confirmed: true },
  'ca-bc-vancouver|YVR': { via: 'The Canada Line, with the YVR AddFare', fare: 11.6, currency: 'CAD', minutes: null, confirmed: true },
  'uk-eng-london|LHR': { via: 'The Piccadilly line', fare: 5.9, currency: 'GBP', minutes: null, confirmed: false },
  'uk-eng-london|LGW': { via: 'The Gatwick Express from Victoria', fare: 20.5, currency: 'GBP', minutes: null, confirmed: false },
  'uk-eng-london|STN': { via: 'The Stansted Express from Liverpool Street', fare: 21.9, currency: 'GBP', minutes: 48, confirmed: false },
  'ie-lei-dublin|DUB': { via: 'Dublin Bus, the TFI 90-minute fare', fare: 2, currency: 'EUR', minutes: null, confirmed: true },
  'mx-cmx-mexicocity|MEX': { via: 'Metro Line 5 to Terminal Aérea', fare: 5, currency: 'MXN', minutes: null, confirmed: false },
};

const transitFor = (cityId: string, iata: string) => TRANSIT[`${cityId}|${iata}`];

/** Whether a flight between two towns could go to and from its airports by transit at either end. */
export function transitOffered(legs: readonly JourneyLeg[]): boolean {
  return legs.some((l, i) => l.mode === 'ground' && (i === 0 ? transitFor(l.from, l.to) : transitFor(l.to, l.from)));
}

/** A flight's legs with its ground legs by transit where it was read: the way out arriving at the airport when the taxi would have, the way in leaving when the taxi would. */
export function byTransit(sim: Simulation, legs: JourneyLeg[]): JourneyLeg[] {
  return legs.map((l, i) => {
    // Only a ground leg runs between a town and an airport, so any other finds no transit.
    const first = i === 0;
    const t = first ? transitFor(l.from, l.to) : transitFor(l.to, l.from);
    if (!t) return l;
    const minutes = t.minutes ?? (l.arriveAt - l.departAt) / 60_000;
    const fare = inSaveMoney(sim, Math.round(t.fare * 100), t.currency);
    const basis = `${t.via}, ${t.fare === 0 ? 'free' : `${t.fare} ${t.currency} a person`}${t.minutes ? `, ${t.minutes} minutes by its timetable` : ', as long as a taxi takes, SLATE’s estimate'}${t.confirmed ? '' : '; the fare read secondhand'}.`;
    return first ? { ...l, departAt: l.arriveAt - minutes * 60_000, fare, basis } : { ...l, arriveAt: l.departAt + minutes * 60_000, fare, basis };
  });
}
