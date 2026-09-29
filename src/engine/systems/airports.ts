/**
 * SLATE — the airports a town is served by, and the way between two
 * (docs/WORLD.md, stage 2). From 2026-09-29.
 *
 * The airports are OurAirports' (`content/airports.ts`), real and with their
 * real places. The routes aren't: airlines' schedules aren't open data, so an
 * itinerary is SLATE's model and says so. A flight between two large
 * airports within a long-haul aircraft's reach is taken as direct; from or to
 * a smaller airport, or farther, it connects through the large airport
 * nearest the smaller one in its own country, as regional flying feeds a
 * hub.
 */

import { AIRPORT_ROWS, type AirportRow } from '../content/airports';
import { CITIES, distanceKm } from '../content/geography';

export interface Airport { iata: string; name: string; large: boolean; latitude: number; longitude: number; country: string; municipality: string }

const toAirport = (r: AirportRow): Airport => ({ iata: r[0], name: r[1], large: r[2] === 1, latitude: r[3], longitude: r[4], country: r[5], municipality: r[6] });
let byCode: Map<string, Airport> | undefined;
let all: Airport[] | undefined;
const airports = (): Airport[] => (all ??= AIRPORT_ROWS.map(toAirport));

export function airportByCode(iata: string): Airport | undefined {
  byCode ??= new Map(airports().map((a) => [a.iata, a]));
  return byCode.get(iata);
}

/**
 * How far a town is from an airport it would fly from: within this, a
 * scheduled airport serves the town; SLATE's estimate, about two hours by
 * road, the distance most travelers will go to fly.
 */
export const SERVED_WITHIN_KM = 150;

/** The airports that serve a town, nearest first: every scheduled one within reach, or the nearest if none is. */
export function airportsFor(cityId: string): { airport: Airport; km: number }[] {
  const city = CITIES.get(cityId);
  if (!city) return [];
  const near = airports().map((airport) => ({ airport, km: distanceKm(city, airport) })).sort((a, b) => a.km - b.km);
  const within = near.filter((n) => n.km <= SERVED_WITHIN_KM);
  return within.length ? within : near.slice(0, 1);
}

/** The large airport a town flies from, if one serves it: where a long flight starts. */
export function largeAirportFor(cityId: string): { airport: Airport; km: number } | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  return airports().filter((a) => a.large).map((airport) => ({ airport, km: distanceKm(city, airport) })).sort((a, b) => a.km - b.km)[0];
}

/** The large airport nearest another, in its own country: the hub its regional flights feed. */
export function hubFor(airport: Airport): Airport | undefined {
  if (airport.large) return airport;
  return airports().filter((a) => a.large && a.country === airport.country).map((a) => ({ a, km: distanceKm(airport, a) })).sort((x, y) => x.km - y.km)[0]?.a;
}

/**
 * The world's connecting hubs: ACI World's busiest airports of 2025, by all
 * passengers and by international ones, the top twenty of each (final
 * release 15 July 2026; the international ranking, September 2026). A
 * journey past an aircraft's reach connects through one of them.
 */
export const HUBS: readonly string[] = [
  'ATL', 'DXB', 'HND', 'DFW', 'PVG', 'ORD', 'LHR', 'IST', 'CAN', 'DEN', 'DEL', 'ICN', 'LAX', 'CDG', 'PEK', 'SIN', 'AMS', 'MAD', 'SZX', 'KUL',
  'HKG', 'FRA', 'DOH', 'BKK', 'TPE', 'BCN', 'FCO', 'LGW', 'MUC', 'JED', 'NRT',
];

/**
 * A country's gateway for flights abroad, by international passengers in
 * 2025 where the research confirmed it (ACI World, and each country's
 * figures): a trip abroad leaves from it when it's within reach of the town.
 * Mexico's is Cancún, which is out of Mexico City's reach, so the capital
 * flies from its own. Canada, Australia, Ireland, Iceland, New Zealand and
 * Latvia weren't checked against a 2025 figure.
 */
export const GATEWAYS: Readonly<Record<string, string>> = {
  US: 'JFK', BR: 'GRU', JP: 'NRT', CA: 'YYZ', AU: 'SYD', MX: 'CUN', KR: 'ICN', GB: 'LHR', DE: 'FRA', FR: 'CDG', ES: 'MAD', IE: 'DUB', IS: 'KEF', NZ: 'AKL', LV: 'RIX',
};

/** A long-haul aircraft's reach with a full load: SLATE's estimate from the longest scheduled routes, about 15,000 km. */
export const DIRECT_MAX_KM = 15_000;

/** The airports an itinerary flies through, first to last: direct between large airports in reach, else through the hubs. */
export function itinerary(from: Airport, to: Airport): Airport[] {
  if (from.iata === to.iata) return [from];
  const km = distanceKm(from, to);
  if (from.large && to.large && km <= DIRECT_MAX_KM) return [from, to];
  const a = hubFor(from) ?? from;
  const b = hubFor(to) ?? to;
  const path = [from];
  if (a.iata !== from.iata) path.push(a);
  // Past a long-haul aircraft's reach, the hubs connect through the large airport that adds least to the way.
  if (distanceKm(a, b) > DIRECT_MAX_KM) {
    const via = HUBS.map((code) => airportByCode(code)).filter((x): x is Airport => x !== undefined && distanceKm(a, x) <= DIRECT_MAX_KM && distanceKm(x, b) <= DIRECT_MAX_KM)
      .sort((x, y) => distanceKm(a, x) + distanceKm(x, b) - distanceKm(a, y) - distanceKm(y, b))[0];
    if (via) path.push(via);
  }
  if (b.iata !== a.iata) path.push(b);
  if (to.iata !== b.iata) path.push(to);
  return path;
}

/**
 * The airport a trip from or to a town uses: abroad, the country's gateway
 * where it's in reach; else the nearest large one within reach, as
 * travelers drive past a small airport to fly from a big one; else the
 * nearest scheduled one, whose flight connects through its hub.
 */
export function tripAirportFor(cityId: string, abroad = false): { airport: Airport; km: number } | undefined {
  const city = CITIES.get(cityId);
  const gateway = abroad && city ? airportByCode(GATEWAYS[city.countryId === 'uk' ? 'GB' : city.countryId.toUpperCase()] ?? '') : undefined;
  if (gateway && city && distanceKm(city, gateway) <= SERVED_WITHIN_KM) return { airport: gateway, km: distanceKm(city, gateway) };
  const large = largeAirportFor(cityId);
  if (large && large.km <= SERVED_WITHIN_KM) return large;
  return airportsFor(cityId)[0];
}
