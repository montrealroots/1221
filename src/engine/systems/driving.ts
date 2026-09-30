/**
 * SLATE — driving (docs/WORLD.md, stage 3c), from 2026-09-29: a car's
 * journey between towns, and what driving brings, every day's and the
 * journey's: an injury in a crash, and a speeding ticket with its fine and
 * points, and the license taken away where the points reach the law's
 * line. Researched and kept in `docs/research/world/research-driving.json`.
 *
 * **The road.** A town to another by road is the straight line stretched by
 * the US road network's circuity, 1.20 (Ballou et al., 2002), which SLATE
 * reads everywhere; at England's motorway and major A-road average, 56.6 mph
 * (DfT, 2025), which SLATE also reads everywhere; with the Highway Code's
 * fifteen-minute break every two hours. Tolls: the New York to Washington
 * corridor's, by E-ZPass from another state, $35.88 south and $55.67 north
 * (the research's arithmetic on each authority's 2026 tolls); other roads'
 * tolls aren't kept.
 *
 * **A crash.** NHTSA's 74 people injured for each 100 million vehicle miles
 * (2024), taken as the driver's own chance, and scaled by the driver's age as
 * AAA's injury crash involvement per mile runs (2014 to 2015). What it does is
 * the injury system's (`systems/injury.ts`). Road deaths are already in the
 * all-cause life table SLATE's mortality reads, so none is drawn here.
 *
 * **A ticket.** New York's 524,215 speeding tickets over its 12,439,380
 * licensed drivers (2024), 0.042 a driver a year, and England and Wales's
 * 2,536,194 speeding offences, about 0.06 a license holder: spread over the
 * place's miles a year. Where a place publishes none SLATE takes New York's
 * for North America and England's for Ireland, its estimate. The ticket is
 * the place's own for the band most often written, SLATE's reading.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { KM_A_YEAR, type Jurisdiction } from '../content/vehiclefees';
import type { VehicleKind } from '../content/vehiclecatalog';
import { mayHurt } from './injury';
import { documentsOf, licenseOf } from './documents';
import { owe, payFromBank } from './household';

const MILE = 1.609344;
const YEAR_MS = 365.2425 * MS_DAY;

export const ROAD = {
  circuity: 1.2,
  kmh: 56.6 * MILE,
  breakMinutes: 15,
  breakEveryHours: 2,
  /** NHTSA 2024: people injured per 100 million vehicle miles. */
  injuredPer100MMiles: 74,
  /** AAA: injury crash involvements per 100 million miles by the driver's age, 2014–2015; the 30 to 39s' taken as one. */
  byAge: [[18, 197], [20, 157], [25, 150], [30, 92], [40, 90], [50, 88], [60, 67], [70, 84], [80, 120], [200, 120]] as readonly (readonly [number, number])[],
  /** A motorcyclist's injury per mile against a car occupant's: 391 against 86 injured per 100 million vehicle miles, NHTSA's Traffic Safety Facts for 2024 (DOT HS 813 824, from 2026-09-30); a scooter rider's taken the same. */
  riderInjuryTimes: 391 / 86,
  source: 'Ballou et al. 2002; DfT 2025; the Highway Code, rule 91; NHTSA DOT HS 813 791; AAA Foundation 2017',
} as const;

/** The New York to Washington corridor's tolls, a car on another state's E-ZPass, in dollars: south, north. */
const TOLLS: Readonly<Record<string, number>> = { 'us-ny-newyork|us-dc-washington': 35.88, 'us-dc-washington|us-ny-newyork': 55.67 };

export const roadKm = (from: string, to: string) => distanceKm(CITIES.require(from), CITIES.require(to)) * ROAD.circuity;

/** Minutes behind the wheel for a distance, the breaks in. */
export function driveMinutes(km: number): number {
  const hours = km / ROAD.kmh;
  return Math.round(hours * 60 + Math.floor(hours / ROAD.breakEveryHours) * ROAD.breakMinutes);
}

/** A road's tolls, in dollar cents, where they're kept. */
export const tollsUsd = (from: string, to: string) => Math.round((TOLLS[`${from}|${to}`] ?? 0) * 100);

/** Whether two towns are joined by road: one country, North America's three, or the island of Ireland. */
export function byRoad(from: string, to: string): boolean {
  const a = CITIES.get(from)?.countryId;
  const b = CITIES.get(to)?.countryId;
  if (!a || !b) return false;
  if (a === b) return true;
  const na = new Set(['us', 'ca', 'mx']);
  if (na.has(a) && na.has(b)) return true;
  const isle = (id: string) => CITIES.get(id)?.countryId === 'ie' || CITIES.get(id)?.parentId === 'uk-nir';
  return isle(from) && isle(to);
}

/** A speeding ticket where one drives: its fine in the place's money, cents, its points, and how often one comes, a year. */
export interface TicketRule { fine: Money; currency: string; points: number; perYear: number; basis: string }
export const TICKETS: Readonly<Record<Jurisdiction, TicketRule>> = {
  'US-NY': { fine: 0, currency: 'USD', points: 4, perYear: 0.042, basis: 'New York, 11 to 20 mph over: 4 points (its fine and surcharge not kept)' },
  'US-CT': { fine: 191_00, currency: 'USD', points: 1, perYear: 0.042, basis: 'Connecticut, 15 mph over: $191 and 1 point; how often at New York’s rate, SLATE’s estimate' },
  'US-CA': { fine: 234_00, currency: 'USD', points: 1, perYear: 0.042, basis: 'California, 1 to 15 mph over: $234 and 1 point; how often at New York’s rate, SLATE’s estimate' },
  GB: { fine: 100_00, currency: 'GBP', points: 3, perYear: 0.06, basis: 'Britain’s minimum, £100 and 3 points' },
  IE: { fine: 160_00, currency: 'EUR', points: 3, perYear: 0.06, basis: 'Ireland, €160 and 3 points; how often at England’s rate, SLATE’s estimate' },
  'CA-ON': { fine: 75_00, currency: 'CAD', points: 3, perYear: 0.042, basis: 'Ontario, 20 km/h over: the $3.75 a km/h set fine and 3 demerit points (the surcharge not kept); how often at New York’s rate, SLATE’s estimate' },
  'CA-BC': { fine: 138_00, currency: 'CAD', points: 3, perYear: 0.042, basis: 'British Columbia, up to 20 km/h over: $138 and 3 points, read secondhand; how often at New York’s rate, SLATE’s estimate' },
  'MX-CMX': { fine: 0, currency: 'MXN', points: 1, perYear: 0.042, basis: 'Mexico City’s fotocívicas, a point of the car’s ten and no cash fine; how often at New York’s rate, SLATE’s estimate' },
};

/**
 * Where points take a license away: the count, over how many months, and for
 * how long (months; null revokes it, to be earned again). A novice's line in
 * Britain and Ireland: two years from passing.
 */
export const LOSING: Readonly<Record<Jurisdiction, { points: number; months: number; forMonths: number | null; novice?: { points: number; forMonths: number | null } } | undefined>> = {
  'US-NY': { points: 11, months: 24, forMonths: 6 },
  'US-CT': { points: 11, months: 24, forMonths: 1 },
  'US-CA': { points: 4, months: 12, forMonths: 6 },
  GB: { points: 12, months: 36, forMonths: 6, novice: { points: 6, forMonths: null } },
  IE: { points: 12, months: 36, forMonths: 6, novice: { points: 7, forMonths: 6 } },
  'CA-ON': { points: 15, months: 24, forMonths: 1 },
  'CA-BC': undefined,
  'MX-CMX': undefined,
};

export interface DrivingRecord { points: { at: Instant; n: number; jurisdiction: Jurisdiction }[]; suspendedUntil?: Instant }
export const drivingOf = (person: Person): DrivingRecord => (person.driving ??= { points: [] });

const ageAt = (person: Person, at: Instant) => (at - person.birthInstant) / YEAR_MS;
const ageFactor = (age: number) => (ROAD.byAge.find(([upTo]) => age < upTo)?.[1] ?? 120) / 92;

/** What driving a distance brought: drawn, a crash's injury and a ticket. */
/** The chance a distance's driving or riding injures, by the driver's age and what's driven. */
export function crashChance(person: Person, km: number, at: Instant, kind: VehicleKind = 'car'): number {
  const rider = kind === 'motorcycle' || kind === 'scooter' ? ROAD.riderInjuryTimes : 1;
  return 1 - Math.exp(-((km / MILE) * ROAD.injuredPer100MMiles * rider * ageFactor(ageAt(person, at))) / 1e8);
}

export function drive(sim: Simulation, person: Person, j: Jurisdiction, km: number, at: Instant, key: string, kind: VehicleKind = 'car'): { hurt: boolean; ticket: boolean } {
  const injuryChance = crashChance(person, km, at, kind);
  const hurt = mayHurt(sim, person, 'crash', injuryChance, at) !== undefined;
  const rule = TICKETS[j];
  const rng = sim.rng('driving.ticket', person.id, key);
  const ticketChance = 1 - Math.exp(-(rule.perYear * km) / KM_A_YEAR[j]);
  const ticket = rng.next() < ticketChance;
  if (ticket) ticketed(sim, person, j, at);
  return { hurt, ticket };
}

/** A speeding ticket: the fine paid or owed, the points, and the license taken where they reach the line. */
function ticketed(sim: Simulation, person: Person, j: Jurisdiction, at: Instant): void {
  const rule = TICKETS[j];
  const cur = saveCurrency(sim.universe);
  if (rule.fine > 0) {
    const due = cur === rule.currency ? rule.fine : exchange(rule.fine, rule.currency, cur) ?? rule.fine;
    if (!payFromBank(sim, person, due, 'A speeding ticket', 'vehicle')) owe(sim, person, due, 'A speeding ticket', 'vehicle');
  }
  const rec = drivingOf(person);
  rec.points.push({ at, n: rule.points, jurisdiction: j });
  const line = LOSING[j];
  let lost = '';
  if (line) {
    const license = licenseOf(person, at);
    const passed = license?.issuedAt ?? 0;
    const novice = line.novice && at - passed < 2 * YEAR_MS;
    const limit = novice ? line.novice!.points : line.points;
    const window = novice ? 24 : line.months;
    const held = rec.points.filter((p) => p.jurisdiction === j && p.at > at - window * (YEAR_MS / 12)).reduce((a, p) => a + p.n, 0);
    if (held >= limit) {
      const months = novice ? line.novice!.forMonths : line.forMonths;
      if (months === null) {
        for (const d of documentsOf(person)) if (d.kind === 'license' && d.status === 'valid') d.status = 'cancelled';
        lost = ' The points revoke your license: it has to be earned again.';
      } else {
        rec.suspendedUntil = at + months * (YEAR_MS / 12);
        lost = ` The points suspend your license until ${formatDate(rec.suspendedUntil, sim.zone)}.`;
      }
    }
  }
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'A Speeding Ticket', body: `${rule.fine > 0 ? `${formatMoney(cur === rule.currency ? rule.fine : exchange(rule.fine, rule.currency, cur) ?? rule.fine, cur)} and ` : ''}${rule.points} ${rule.points === 1 ? 'point' : 'points'}.${lost}`, importance: 60, route: '/workspace/vehicles' });
}

/** Whether a suspension stands. */
export const suspended = (person: Person, at: Instant) => (person.driving?.suspendedUntil ?? 0) > at;
