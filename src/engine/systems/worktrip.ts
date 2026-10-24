/**
 * SLATE — work abroad: getting there, being there, the visa, and getting home (from 2026-10-23, the owner's brief 25,
 * Part 9 and the dossier's Section 10, the Australia walkthrough; `docs/verification/career-world-2026-10-23/criteria.md`,
 * W4 to W12).
 *
 * A project whose town is a long way from home (`needsTrip`) is reached by a trip the production books when the work is
 * booked: a car to the airport, the flights, a car to the hotel, and the same home the day after the last work day. The
 * player is where the trip has taken them, and only once each leg has arrived (`whereAt`): in transit on a leg, at a
 * connection, then in the work's town. Home stays where it was (`person.currentLocationId`), so the bank, the taxes and
 * the School's residence read what they always did; what's in person anywhere else can't be gone to while away.
 *
 * Work in the US a long way from home is a trip the same way (from 2026-10-23, brief 25's Module 2, criteria C10: a
 * part drawn from a production the game sets in Los Angeles), its permission the US rule the rest of the work reads
 * (`eligibilityRead`, `tripRead`), with no visa and no passport.
 *
 * Permission to work abroad is the country's (`content/jurisdictions.ts`): a citizen needs nothing; a route granted on
 * arrival (New Zealand's citizens' Special Category visa) is granted at the border; one applied for ahead (the 408) is a
 * permit in Papers tied to the engagement (`bookingId`), applied for once the contract exists and decided after the
 * game's assumed delay. A country whose rules aren't in the game gives no permission at all.
 *
 * The flights are the game's schedule, never a real airline's, and each leg says so where it's shown: a flight's time is
 * its distance at an assumed speed with time for taxiing, and a flight too long to fly without stopping connects at the
 * hub that makes the trip shortest (`TRIP`, `HUBS`, every figure the game's assumption).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, addDays, formatDate, formatTime, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES, COUNTRIES, distanceKm } from '../content/geography';
import { jurisdictionOf, type WorkRoute } from '../content/jurisdictions';
import type { ProjectTemplate } from '../content/careerwork';
import { citizenOf, documentsOf, inForce, numberFor, passportOf, type PersonDocument } from './documents';
import { ensurePro, noteEvent, type EligibilityRead, type Engagement, type ProId, type TripLeg, type WorkStay, type WorkTrip } from './pro';
import { eligibilityRead } from './propay';
import { payPerDiem } from './contracts';

const MIN = 60_000;

/**
 * The game's travel times, every one an ASSUMPTION (no flight or car service is modeled as a real one): a flight's time
 * at 850 km an hour with 30 minutes to taxi; no flight longer than 13,000 km without a stop, and 2½ hours to connect;
 * the outbound flight at 5:30 in the evening, the return at eleven in the morning, the day after the last work day; at
 * the airport two hours before a flight, and an hour after landing to clear the airport; the outbound landing at least a
 * day and a half before the first call; and 40 minutes between the hotel and the airport or the set.
 */
export const TRIP = {
  minKm: 500,
  kmPerHour: 850, taxiMinutes: 30, nonstopKm: 13_000, connectMinutes: 150,
  out: { hour: 17, minute: 30 }, back: { hour: 11, minute: 0 },
  checkInMinutes: 120, clearMinutes: 60, arriveBeforeHours: 36,
  hotelMinutes: 40,
} as const;

/** Where a town's flights leave from, and the car there: New Haven's from New York's JFK, two hours away; elsewhere its own airport. */
export const AIRPORTS: Readonly<Record<string, { cityId: string; name: string; minutes: number }>> = {
  'us-ct-newhaven': { cityId: 'us-ny-newyork', name: 'JFK in New York', minutes: 120 },
};
const airportOf = (cityId: string) => AIRPORTS[cityId] ?? { cityId, name: `the airport in ${CITIES.get(cityId)?.name ?? 'town'}`, minutes: TRIP.hotelMinutes };

/** The hubs a long flight may connect at, the shortest way round chosen among them. */
export const HUBS: readonly string[] = ['us-ca-losangeles', 'uk-eng-london', 'ae-du-dubai', 'qa-01-doha', 'sg-singapore', 'hk-hongkong', 'jp-13-tokyo'];

const cityOf = (id: string) => CITIES.get(id);
const zoneOf = (id: string): string => cityOf(id)?.timeZone ?? 'UTC';
const km = (a: string, b: string): number => { const x = cityOf(a), y = cityOf(b); return x && y ? distanceKm(x, y) : 0; };
const nameOf = (id: string): string => cityOf(id)?.name ?? id;
const round5 = (minutes: number): number => Math.round(minutes / 5) * 5;
/** A flight's time in minutes: its distance at the assumed speed, and the taxiing. */
export const flightMinutes = (from: string, to: string): number => round5(TRIP.taxiMinutes + (km(from, to) / TRIP.kmPerHour) * 60);

/** Whether work in a town is reached by a trip rather than a day's travel from home: more than 500 km away. */
export const needsTrip = (homeId: string, workId: string): boolean => homeId !== workId && km(homeId, workId) > TRIP.minKm;

/** The flights from one airport town to another: direct within 13,000 km, or through the hub that makes it shortest. */
export function flightPath(from: string, to: string): string[] {
  if (km(from, to) <= TRIP.nonstopKm) return [from, to];
  const via = HUBS.filter((h) => cityOf(h) && h !== from && h !== to && km(from, h) <= TRIP.nonstopKm && km(h, to) <= TRIP.nonstopKm)
    .sort((a, b) => km(from, a) + km(a, to) - (km(from, b) + km(b, to)))[0];
  return via ? [from, via, to] : [from, to];
}

const at = (t: Instant, zone: string, wall: { hour: number; minute: number }): Instant => {
  const p = zonedParts(t, zone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: wall.hour, minute: wall.minute, second: 0 }, zone);
};

type Planned = Omit<TripLeg, 'id' | 'status'>;

/** One way: the car to the airport, the flights from a first departure, and the car on from the last airport. */
function way(dir: 'out' | 'back', fromCity: string, toCity: string, departs: Instant): Planned[] {
  const fromAir = airportOf(fromCity);
  const toAir = airportOf(toCity);
  const legs: Planned[] = [];
  const carFrom = fromAir.cityId === fromCity ? TRIP.hotelMinutes : fromAir.minutes;
  const toAirport = departs - TRIP.checkInMinutes * MIN;
  legs.push({ mode: 'car', from: fromCity, to: fromAir.cityId, departs: toAirport - carFrom * MIN, arrives: toAirport, label: `Car To ${dir === 'out' && fromAir.cityId !== fromCity ? fromAir.name.replace(/^the /, 'The ') : 'The Airport'}`, way: dir });
  const path = flightPath(fromAir.cityId, toAir.cityId);
  let t = departs;
  for (let i = 0; i + 1 < path.length; i += 1) {
    if (i > 0) t += TRIP.connectMinutes * MIN;
    const arrives = t + flightMinutes(path[i]!, path[i + 1]!) * MIN;
    legs.push({ mode: 'flight', from: path[i]!, to: path[i + 1]!, departs: t, arrives, label: `Flight To ${nameOf(path[i + 1]!)}`, way: dir });
    t = arrives;
  }
  const carTo = toAir.cityId === toCity ? TRIP.hotelMinutes : toAir.minutes;
  const off = t + TRIP.clearMinutes * MIN;
  legs.push({ mode: 'car', from: toAir.cityId, to: toCity, departs: off, arrives: off + carTo * MIN, label: dir === 'out' ? 'Car To The Hotel' : 'Car Home', way: dir });
  return legs;
}

/**
 * A trip's legs for work in a town on its days, planned as the production books it (`TRIP`): out on the latest evening
 * that lands a day and a half before the first call, back the morning after the last work day. Undefined where the work
 * is near enough to be a day's travel.
 */
export function planTrip(homeId: string, workId: string, days: readonly { from: Instant; to: Instant }[]): { legs: Planned[]; stay: Omit<WorkStay, 'place' | 'status'> } | undefined {
  if (!needsTrip(homeId, workId) || !days.length) return undefined;
  const outAirport = airportOf(homeId).cityId;
  const zone = zoneOf(outAirport);
  const first = days[0]!.from;
  let out: Planned[] = [];
  for (let back = 1; back <= 7; back += 1) {
    out = way('out', homeId, workId, at(addDays(first, -back, zone), zone, TRIP.out));
    if (out[out.length - 1]!.arrives <= first - TRIP.arriveBeforeHours * MS_HOUR) break;
  }
  const workZone = zoneOf(workId);
  const last = days[days.length - 1]!;
  const home = way('back', workId, homeId, at(addDays(last.to, 1, workZone), workZone, TRIP.back));
  return { legs: [...out, ...home], stay: { cityId: workId, from: out[out.length - 1]!.arrives, to: home[0]!.departs, payer: 'production' } };
}

/** When a planned trip begins and ends: the first leg's departure and the last's arrival. */
export function windowOf(legs: readonly Pick<TripLeg, 'departs' | 'arrives'>[]): { from: Instant; to: Instant } | undefined {
  return legs.length ? { from: legs[0]!.departs, to: legs[legs.length - 1]!.arrives } : undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// Where the player is
// ---------------------------------------------------------------------------------------------------------------------

export const tripsOf = (person: Person): WorkTrip[] => person.pro?.trips ?? [];
export const tripOf = (person: Person, e: Pick<Engagement, 'tripId'>): WorkTrip | undefined => (e.tripId ? tripsOf(person).find((t) => t.id === e.tripId) : undefined);

export interface Whereabouts {
  kind: 'home' | 'transit' | 'away';
  /** The town: home, the leg's departure town in transit, or where the trip has brought them. */
  cityId: string;
  leg?: TripLeg;
  trip?: WorkTrip;
}

/**
 * Where the player is at a moment: on a leg of a trip that's left, at the town a leg has brought them to, or home. A leg
 * missed or canceled goes nowhere, so the player stays where they were; a leg still booked is taken to go as planned,
 * since its handler runs when the clock reaches it.
 */
export function whereAt(person: Person, t: Instant): Whereabouts {
  const home = person.currentLocationId;
  for (const trip of tripsOf(person)) {
    if (trip.status === 'canceled' && !trip.legs.some((l) => l.status === 'done' || l.status === 'en-route')) continue;
    const span = windowOf(trip.legs);
    if (!span || t < span.from || t >= span.to) continue;
    let pos = home;
    for (const leg of trip.legs) {
      if (leg.status === 'missed' || leg.status === 'canceled' || t < leg.departs) break;
      if (t < leg.arrives) return { kind: 'transit', cityId: leg.from, leg, trip };
      pos = leg.to;
    }
    if (pos !== home) return { kind: 'away', cityId: pos, trip };
  }
  return { kind: 'home', cityId: home };
}

/** Where the player is, in a phrase: "in Sydney", "on the flight to Sydney". */
export function whereWords(w: Whereabouts): string {
  if (w.kind === 'transit' && w.leg) return w.leg.mode === 'flight' ? `on the flight to ${nameOf(w.leg.to)}` : `on the way to ${nameOf(w.leg.to)}`;
  return `in ${nameOf(w.cityId)}`;
}

/** A trip underway at a moment, away from home, where one is: what the School and the casting offices read. */
export function awayOn(person: Person, t: Instant): Whereabouts | undefined {
  const w = whereAt(person, t);
  return w.kind === 'home' ? undefined : w;
}

/** The spans the live trips hold, each its engagement's: no other booking can fall in one. */
export function tripSpans(person: Person, exceptEngagement?: ProId): { from: Instant; to: Instant; label: string; engagementId: ProId }[] {
  return tripsOf(person).filter((t) => t.status !== 'canceled' && t.status !== 'home' && t.engagementId !== exceptEngagement).flatMap((t) => {
    const span = windowOf(t.legs);
    return span ? [{ ...span, label: `Your Trip To ${nameOf(t.cityId)}`, engagementId: t.engagementId }] : [];
  });
}

/** A leg as a line: its label, and its departure and arrival, each in its own town's time. Said as the game's schedule. */
export function legWords(leg: Pick<TripLeg, 'from' | 'to' | 'departs' | 'arrives' | 'mode'>): string {
  const dz = zoneOf(leg.from), az = zoneOf(leg.to);
  return `Leaves ${nameOf(leg.from)} ${formatWeekdayDate(leg.departs, dz)} at ${formatTime(leg.departs, dz)}, arrives in ${nameOf(leg.to)} ${formatWeekdayDate(leg.arrives, az)} at ${formatTime(leg.arrives, az)}, ${hoursWords(leg.arrives - leg.departs)}.`;
}
const hoursWords = (ms: number): string => { const m = Math.round(ms / MIN); const h = Math.floor(m / 60); const r = m % 60; return `${h ? `${h} hour${h === 1 ? '' : 's'}` : ''}${h && r ? ' and ' : ''}${r ? `${r} minutes` : ''}`; };

/** A leg as a sentence names it, its place names kept: "car to the airport", "flight to Los Angeles", "car home". */
export const legPhrase = (l: Pick<TripLeg, 'label'>): string => l.label.replace(/^Car Home$/, 'car home').replace(/^(Car|Flight) To (The (Airport|Hotel)$)?/, (m) => m.toLowerCase());

/** Where a route's conditions come from, in a sentence: the department's page, the day this build read it and the page's own date. */
export function routeSourceWords(route: Pick<WorkRoute, 'source'>): string {
  const day = (d: string): string => { const [y, m, dd] = d.split('-').map(Number); return formatDate(Date.UTC(y!, m! - 1, dd!, 12), 'UTC'); };
  return `From the department’s page as the game read it on ${day(route.source.read)}${route.source.updated ? `, last updated ${day(route.source.updated)}` : ''}.`;
}

/** The schedule's own caveat, said once beside a trip's legs. */
export const SCHEDULE_WORDS = 'These are the game’s times for the trip, estimated from the distances, not a real airline’s schedule.';

// ---------------------------------------------------------------------------------------------------------------------
// Permission to work abroad
// ---------------------------------------------------------------------------------------------------------------------

const countryName = (country: string): string => COUNTRIES.get(country)?.name ?? country.toUpperCase();
/** A country's name as a sentence says it: "the United Kingdom", "Australia". */
const THE = /^(United |Netherlands$|Philippines$|Bahamas$|Czech Republic$|Dominican Republic$|Central African Republic$|Gambia$|Maldives$|Marshall Islands$|Solomon Islands$|Comoros$)/;
export const countryWords = (name: string): string => (THE.test(name) ? `the ${name}` : name);
/** A country by its id, as a sentence says it. */
export const countryIn = (country: string): string => countryWords(countryName(country));
const titled = (words: string): string => words.replace(/(^|\s)(\p{Ll})/gu, (_, sp: string, c: string) => `${sp}${c.toUpperCase()}`);

/** The work visa a booking holds or waits on, tied to it. */
export function visaFor(person: Person, engagementId: ProId): PersonDocument | undefined {
  return documentsOf(person).filter((d) => d.kind === 'permit' && d.bookingId === engagementId && d.status !== 'cancelled').sort((a, b) => (b.appliedAt ?? 0) - (a.appliedAt ?? 0))[0];
}

/** The route a person would work under in a country: one granted on arrival to their citizenship, or the one applied for. */
export function routeFor(person: Person, country: string): WorkRoute | undefined {
  const j = jurisdictionOf(country);
  return j.routes.find((r) => r.for.kind === 'citizens-of' && citizenOf(person, r.for.iso)) ?? j.routes.find((r) => r.for.kind === 'non-citizens');
}

/**
 * What permission to work reads for work abroad on its days (W2, W4): a citizen of the country; a route granted on
 * arrival, its passport in force for the days; a visa tied to the engagement, in force for each day, or pending, or
 * still to apply for; or a country whose rules the game hasn't got, which never grants it.
 */
export function abroadRead(person: Person, country: string, days: readonly { from: Instant; to: Instant }[], engagementId: ProId | undefined, now: Instant): EligibilityRead {
  const j = jurisdictionOf(country, countryName(country));
  const base = { at: now, country };
  if (citizenOf(person, j.iso)) return { ...base, authorized: true, basis: 'abroad-citizen', words: `You’re a citizen of ${j.name}, so you can work there.` };
  if (j.research !== 'verified') {
    return { ...base, authorized: false, basis: 'abroad-unsupported', words: j.research === 'partial'
      ? `The rules for working in ${countryWords(j.name)} aren’t in the game yet: their sources are found and not yet read, so the game can’t let you take work there.`
      : `The rules for working in ${countryWords(j.name)} aren’t in the game, so it can’t let you take work there.` };
  }
  const route = routeFor(person, country);
  if (!route) return { ...base, authorized: false, basis: 'abroad-unsupported', words: `The game has no way for you to work in ${countryWords(j.name)} with the papers you hold.` };
  const last = days[days.length - 1]?.to ?? now;
  if (route.how === 'on-arrival') {
    const want = route.for.kind === 'citizens-of' ? route.for.iso : undefined;
    const ok = documentsOf(person).some((d) => d.kind === 'passport' && (want === undefined || d.issuer === want) && inForce(d, now) && inForce(d, last));
    return { ...base, authorized: ok, basis: ok ? 'abroad-route' : 'abroad-needed', words: ok
      ? `As a citizen of ${nameOfIso(route.for.kind === 'citizens-of' ? route.for.iso : j.iso)} with a passport in force, you’re granted the ${route.name} when you arrive, and it lets you work in ${j.name}.`
      : `The ${route.name} is granted on arrival to a holder of a passport in force, and yours runs out before the work ends.` };
  }
  const visa = engagementId ? visaFor(person, engagementId) : undefined;
  if (visa?.status === 'valid' && days.every((d) => inForce(visa, d.from) && inForce(visa, d.to - 1))) {
    return { ...base, authorized: true, basis: 'abroad-route', words: `Your ${route.short} covers this work${visa.expiresAt !== undefined ? `, and runs to ${formatDate(visa.expiresAt, zoneOf(cityIdIn(country)))}` : ''}.` };
  }
  if (visa?.status === 'pending') return { ...base, authorized: false, basis: 'abroad-needed', words: `Your ${route.short} is with the department, which decides on ${formatDate(visa.readyAt ?? now, zoneOf(person.currentLocationId))}.` };
  return { ...base, authorized: false, basis: 'abroad-needed', words: `Work in ${j.name} needs a ${route.short} (${route.name}), which the production supports. Apply for it on the Career screen’s Work tab once you’ve accepted.` };
}
/** The country whose work reads the US rule (brief 19's package, `systems/permission.ts`) rather than a jurisdiction's. */
export const US_RULES = 'us';

/** What permission reads for a trip's work: the US rule for work in the US, the country's own for work abroad. */
export function tripRead(person: Person, country: string, days: readonly { from: Instant; to: Instant }[], engagementId: ProId | undefined, now: Instant): EligibilityRead {
  return country === US_RULES ? eligibilityRead(person, days, now) : abroadRead(person, country, days, engagementId, now);
}

const cityIdIn = (country: string): string => CITIES.all().find((c) => c.countryId === country)?.id ?? '';
const nameOfIso = (iso: string): string => COUNTRIES.all().find((c) => c.iso2?.toUpperCase() === iso)?.name ?? iso;

/** Why the player can't apply for the work visa a booking needs, or nothing. */
export function visaRefusal(person: Person, e: Engagement | undefined, t: ProjectTemplate | undefined, now: Instant): string | undefined {
  if (!e || !t || !t.trip) return 'No work abroad is booked, so there’s no visa to apply for.';
  if (e.status === 'finished' || e.status === 'canceled') return 'That work is over, so there’s no visa to apply for.';
  const country = cityOf(t.place.cityId)?.countryId ?? '';
  if (country === US_RULES) return 'Work in the US needs no visa, only your permission to work here.';
  const route = routeFor(person, country);
  const read = abroadRead(person, country, e.days, e.id, now);
  if (read.basis === 'abroad-citizen' || (route && route.how === 'on-arrival' && read.authorized)) return `You don’t need one: ${read.words.charAt(0).toLowerCase()}${read.words.slice(1)}`;
  if (!route || route.how !== 'apply-ahead') return read.words;
  const visa = visaFor(person, e.id);
  if (visa?.status === 'pending') return `You’ve applied already. ${read.words}`;
  if (visa?.status === 'valid') return `You hold it already. ${read.words}`;
  const trip = tripOf(person, e);
  const home = trip ? windowOf(trip.legs)?.to ?? now : e.days[e.days.length - 1]?.to ?? now;
  if (!passportOf(person, home)) return `You need a passport in force until you’re home on ${formatDate(home, zoneOf(person.currentLocationId))}. Papers shows yours.`;
  return undefined;
}

export const VISA_KIND = 'pro.visa_decision';
export const DEPART_KIND = 'pro.trip_depart';
export const ARRIVE_KIND = 'pro.trip_arrive';

/** Applies for the visa (W5): a pending permit in Papers, tied to the booking, and the department's decision on the clock. */
export function applyVisa(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): PersonDocument {
  const country = cityOf(t.place.cityId)!.countryId;
  const route = routeFor(person, country)!;
  const j = jurisdictionOf(country);
  const id = sim.nextId('document');
  const readyAt = sim.now + (route.decisionDays ?? 0) * MS_DAY;
  const doc: PersonDocument = { id, kind: 'permit', issuer: j.iso, destination: j.iso, name: route.name, number: numberFor('VGN', id), status: 'pending', appliedAt: sim.now, readyAt, bookingId: e.id, passportId: passportOf(person, sim.now)?.id };
  documentsOf(person).push(doc);
  sim.schedule({ at: readyAt, kind: VISA_KIND, label: `The Decision On Your ${route.short}`, category: 'career', priority: 30, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, documentId: id } });
  noteEvent(sim, e, { kind: 'visa-applied', key: `visa:${id}:applied`, words: t.trip?.supporter ? `You applied for the ${route.short} for ${t.project}, with ${t.trip.supporter} as your supporter.` : `You applied for the ${route.short} for ${t.project}.` });
  return doc;
}

/** The department's decision (W5): granted to the last work day and the game's days past it. */
export function grantVisa(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, doc: PersonDocument): void {
  const route = routeFor(person, cityOf(t.place.cityId)!.countryId)!;
  const last = e.days[e.days.length - 1]?.to ?? sim.now;
  doc.status = 'valid';
  doc.issuedAt = sim.now;
  doc.expiresAt = last + (route.graceDays ?? 0) * MS_DAY;
  noteEvent(sim, e, { kind: 'visa-granted', key: `visa:${doc.id}:granted`, words: `Your ${route.short} for ${t.project} was granted, to ${formatDate(doc.expiresAt, zoneOf(t.place.cityId))}.` });
}

// ---------------------------------------------------------------------------------------------------------------------
// Booking the trip, and its legs on the clock
// ---------------------------------------------------------------------------------------------------------------------

/** Books the trip for a booking abroad (W6): its legs and stay on the record, each leg's departure and arrival on the clock. */
export function bookTrip(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): WorkTrip | undefined {
  if (!t.trip) return undefined;
  const plan = planTrip(person.currentLocationId, t.place.cityId, e.days);
  if (!plan) return undefined;
  const pro = ensurePro(sim, person);
  const trip: WorkTrip = {
    id: sim.nextId('pro'), engagementId: e.id, country: cityOf(t.place.cityId)!.countryId, cityId: t.place.cityId,
    legs: plan.legs.map((l) => ({ ...l, id: sim.nextId('pro'), status: 'booked' as const })),
    stay: { ...plan.stay, place: t.trip.hotel, status: 'booked' },
    status: 'booked', history: [], counts: {},
  };
  (pro.trips ??= []).push(trip);
  e.tripId = trip.id;
  scheduleLegs(sim, person, trip);
  return trip;
}

/** Each leg's departure and arrival on the clock: the first leg of each way wants the player, the rest follow on. */
function scheduleLegs(sim: Simulation, person: Person, trip: WorkTrip, from = 0): void {
  trip.legs.forEach((leg, i) => {
    if (i < from || leg.status !== 'booked') return;
    const first = i === 0 || trip.legs[i - 1]!.way !== leg.way;
    sim.schedule({ at: leg.departs, kind: DEPART_KIND, label: leg.label, category: 'career', priority: 37, requiresPlayer: first, ...(first ? { durationMinutes: Math.round((leg.arrives - leg.departs) / MIN) } : {}), locationId: leg.from, refType: 'pro.trip', refId: trip.id, payload: { personId: person.id, tripId: trip.id, leg: i } });
    sim.schedule({ at: leg.arrives, kind: ARRIVE_KIND, label: `${leg.label}: Arrives`, category: 'career', priority: 36, requiresPlayer: false, locationId: leg.to, refType: 'pro.trip', refId: trip.id, payload: { personId: person.id, tripId: trip.id, leg: i } });
  });
}

/** Calls a trip off: the legs not yet gone and the stay canceled, their times off the clock. */
export function cancelTrip(sim: Simulation, trip: WorkTrip): void {
  for (const leg of trip.legs) if (leg.status === 'booked') leg.status = 'canceled';
  if (trip.stay.status === 'booked') trip.stay.status = 'canceled';
  if (!trip.legs.some((l) => l.status === 'done' || l.status === 'en-route')) trip.status = 'canceled';
  sim.timeline.cancelFor('pro.trip', trip.id, sim.now);
}

/** Why a player can't fly out for work abroad, said at the flight: no visa applied for, one still undecided, or no route at all. */
function departureWords(person: Person, country: string, e: Engagement, now: Instant): string {
  if (country === US_RULES) return tripRead(person, country, e.days, e.id, now).words.replace(/\.$/, '');
  const route = routeFor(person, country);
  const where = jurisdictionOf(country, countryName(country)).name;
  const visa = visaFor(person, e.id);
  if (!route || route.how !== 'apply-ahead') return abroadRead(person, country, e.days, e.id, now).words.replace(/\.$/, '');
  if (visa?.status === 'pending') return `The department hadn’t decided on your ${route.short} by your flight, and you can’t work in ${where} without it`;
  if (visa?.status === 'valid') return `Your ${route.short} doesn’t cover every day of the work, and you can’t work in ${where} without it`;
  return `You didn’t apply for the ${route.short} the work in ${where} needs, and you can’t work there without it`;
}

/** What the work loop lends the trip's handlers, so this module needn't import it (it imports this one). */
export interface TripHooks {
  engagementOf: (person: Person, id: unknown) => Engagement | undefined;
  projectOf: (e: Engagement) => ProjectTemplate | undefined;
  /** Awake and not laid up at a moment. */
  there: (person: Person, at: Instant) => boolean;
  /** Releases the actor from the work for a reason said in a sentence. */
  release: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, at: Instant, why: string) => void;
  tell: (sim: Simulation, person: Person, title: string, body: string, importance?: number) => void;
}

const locate = (sim: Simulation, item: { payload: Record<string, unknown> }): { person: Person; trip: WorkTrip; i: number } | undefined => {
  const person = sim.universe.people[String(item.payload.personId)];
  const trip = person ? tripsOf(person).find((t) => t.id === item.payload.tripId) : undefined;
  return person && trip ? { person, trip, i: Number(item.payload.leg) } : undefined;
};

/** The first call of a booking, in its town's time and in home's, said for a notice. */
const callWords = (e: Engagement, t: ProjectTemplate, home: string): string => {
  const first = e.days[0];
  if (!first) return '';
  const z = zoneOf(t.place.cityId), hz = zoneOf(home);
  const there = `${formatWeekdayDate(first.from, z)} at ${formatTime(first.from, z)} in ${nameOf(t.place.cityId)}`;
  const athome = `${formatTime(first.from, hz)} on ${formatWeekdayDate(first.from, hz).split(',')[0]} in ${nameOf(home)}`;
  return ` Your first call is ${there} (${athome}).`;
};

export function registerWorkTrips(sim: Simulation, hooks: TripHooks): void {
  sim.onSchedule(VISA_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person ? hooks.engagementOf(person, item.payload.engagementId) : undefined;
    const t = e ? hooks.projectOf(e) : undefined;
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!person || !e || !t || !doc || doc.status !== 'pending') return;
    grantVisa(s, person, e, t, doc);
    hooks.tell(s, person, `Your ${titled(routeFor(person, doc.destination?.toLowerCase() ?? '')?.short ?? 'visa')} Was Granted`, `The department granted your ${doc.name} for ${t.project}. It runs to ${formatDate(doc.expiresAt!, zoneOf(t.place.cityId))}, and it’s in Papers under Permission To Work.`, 75);
  });

  sim.onSchedule(DEPART_KIND, (item, s) => {
    const at = locate(s, item);
    if (!at) return;
    const { person, trip, i } = at;
    const leg = trip.legs[i];
    const e = hooks.engagementOf(person, trip.engagementId);
    const t = e ? hooks.projectOf(e) : undefined;
    if (!leg || leg.status !== 'booked' || !e || !t) return;
    const first = i === 0 || trip.legs[i - 1]!.way !== leg.way;
    if (!first) {
      const before = trip.legs[i - 1]!;
      if (before.status !== 'done') { leg.status = 'canceled'; return; }
      leg.status = 'en-route';
      return;
    }
    if (leg.way === 'out') {
      // At the first departure (W9): permission for the work and a passport in force to the trip's end, or no flight.
      const read = tripRead(person, trip.country, e.days, e.id, s.now);
      const end = windowOf(trip.legs)!.to;
      // A passport for a flight abroad; a flight within the US needs none (the game reads no other ID for one).
      const why = !read.authorized ? departureWords(person, trip.country, e, s.now) : trip.country !== US_RULES && !passportOf(person, end) ? `You need a passport in force until you’re home on ${formatDate(end, zoneOf(person.currentLocationId))}, and yours isn’t` : undefined;
      if (why) {
        cancelTrip(s, trip);
        hooks.release(s, person, e, t, s.now, why.replace(/\.$/, ''));
        return;
      }
    }
    if (!hooks.there(person, item.at)) {
      leg.status = 'missed';
      for (const l of trip.legs) if (l.way === leg.way && l.status === 'booked' && l !== leg) l.status = 'canceled';
      noteEvent(s, trip, { kind: 'missed-flight', key: `missed:${leg.way}:${leg.departs}`, words: `You weren’t there for the ${legPhrase(leg)} on ${formatDate(leg.departs, zoneOf(leg.from))}.` });
      if (leg.way === 'back') {
        // Booked again a day later, all the way home: the production's, assumed, since it brought you and can't leave you.
        const again = trip.legs.filter((l) => l.way === 'back').map((l) => ({ ...l, id: s.nextId('pro'), departs: l.departs + MS_DAY, arrives: l.arrives + MS_DAY, status: 'booked' as const }));
        trip.legs = [...trip.legs.filter((l) => l.way === 'out' || l.status === 'missed' || l.status === 'canceled'), ...again];
        trip.stay.to += MS_DAY;
        scheduleLegs(s, person, trip, trip.legs.length - again.length);
        hooks.tell(s, person, 'You Missed Your Flight Home', `You weren’t there for the car to the airport, so ${t.company} booked you on the same flights a day later. ${legWords(again[0]!)}`, 80);
      } else {
        // Never there, so never on the way home: the rest called off, the hotel with it. Until 2026-10-23 (the missed-flight
        // test) only the legs out were, and the legs home still ran and told a player who hadn't left that they were back.
        cancelTrip(s, trip);
        hooks.tell(s, person, `You Missed Your Flight To ${nameOf(trip.cityId)}`, `You weren’t there for the car to the airport, so the flights to ${nameOf(trip.cityId)} left without you, and you won’t be there for ${t.project}’s first call. A shoot can’t wait for an actor.`, 85);
      }
      return;
    }
    leg.status = 'en-route';
    trip.status = leg.way === 'out' ? 'out' : 'back';
    if (leg.way === 'back' && trip.stay.status === 'in') {
      trip.stay.status = 'out';
      noteEvent(s, trip, { kind: 'checked-out', key: 'checked-out', words: `You checked out of ${trip.stay.place}.` });
    }
    noteEvent(s, trip, { kind: 'departed', key: `departed:${leg.way}`, words: leg.way === 'out' ? `You left for ${nameOf(trip.cityId)}.` : `You left ${nameOf(trip.cityId)} for home.` });
  });

  sim.onSchedule(ARRIVE_KIND, (item, s) => {
    const at = locate(s, item);
    if (!at) return;
    const { person, trip, i } = at;
    const leg = trip.legs[i];
    if (!leg || leg.status !== 'en-route') return;
    leg.status = 'done';
    const e = hooks.engagementOf(person, trip.engagementId);
    const t = e ? hooks.projectOf(e) : undefined;
    const lastOfWay = i === trip.legs.length - 1 || trip.legs[i + 1]!.way !== leg.way;
    if (!lastOfWay || !e || !t) return;
    if (leg.way === 'out') {
      trip.status = 'there';
      trip.stay.status = 'in';
      noteEvent(s, trip, { kind: 'arrived', key: 'arrived', words: `You arrived in ${nameOf(trip.cityId)}.` });
      noteEvent(s, trip, { kind: 'checked-in', key: 'checked-in', words: `You checked in to ${trip.stay.place}.` });
      hooks.tell(s, person, `You’ve Arrived In ${nameOf(trip.cityId)}`, `You’ve arrived in ${nameOf(trip.cityId)}, and the production’s car took you to ${trip.stay.place}.${callWords(e, t, person.currentLocationId)}`, 75);
    } else {
      trip.status = 'home';
      noteEvent(s, trip, { kind: 'home', key: 'home', words: `You were home in ${nameOf(person.currentLocationId)}.` });
      hooks.tell(s, person, `You’re Home From ${nameOf(trip.cityId)}`, `You’re back in ${nameOf(person.currentLocationId)} after ${t.project}.`, 60);
      // The per diem for the days away, once home (from 2026-10-24, brief 25's Module 4, D6), where the contract has one.
      payPerDiem(s, person, e, trip);
    }
  });

  sim.onCommand<{ engagementId: string }, { readyAt: Instant }>('pro.apply_work_visa', (p, { sim: s }) => {
    const person = s.player;
    const e = hooks.engagementOf(person, p?.engagementId);
    const t = e ? hooks.projectOf(e) : undefined;
    const no = visaRefusal(person, e, t, s.now);
    if (no) throw new CommandError(no);
    const doc = applyVisa(s, person, e!, t!);
    return { readyAt: doc.readyAt! };
  });
}
