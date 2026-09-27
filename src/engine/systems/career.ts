/**
 * SLATE — the actor's working life after drama school (`content/career.ts`).
 *
 * - **The showcase.** In the last spring the class shows scenes to agents,
 *   managers and casting directors in New York and, a week later, Los
 *   Angeles. What an agency sees is the actor's craft that day and how rested
 *   they came; the agencies whose bar the showing clears may offer, from
 *   that city's office, and which do is drawn for the save (`career.offers`).
 *   An offer stands a month.
 * - **Representation.** Signed, the agency takes its commission and, from the
 *   Monday after the school's hold ends, sends the actor out: each Monday a
 *   week's auditions, how many by the agency's reach, drawn
 *   (`career.auditions`). An agency that books nothing in a year, or whose
 *   client misses three auditions or walks off a job, lets them go. An actor
 *   may leave on SAG-AFTRA's terms: no offer in the first 120 days, or fewer
 *   than ten days' work in the last 91. Anybody can submit themselves, on the
 *   casting sites, for the smaller work that takes them; and a job worked
 *   while unrepresented can bring an agency's call.
 * - **Auditions.** A self-tape is made wherever they are; an audition in the
 *   room is in the agency's city. Awake and there, the actor is weighed
 *   against the part (`career.booking`); booked, the offer comes days later
 *   and stands two days.
 * - **Work.** An accepted job's days go on the calendar and are paid at the
 *   contract's minimum: SAG-AFTRA's on the Thursday after the week, Equity's
 *   each Friday. From the check come the agency's commission, Equity's
 *   working dues, and tax withheld the way a payroll does, on the year's
 *   wages so far at the job's town. A day not turned up for ends the job.
 * - **Managers.** A management firm can offer beside the agencies, and after
 *   a job it noticed. It takes 10% beside an agent and 15% without one, adds
 *   an audition a week through its relationships, and finds an unrepresented
 *   client an agency now and then (`career.managers`). A first contract runs
 *   a year.
 * - **Overtime.** A shooting day runs ten to twelve hours (`career.hours`),
 *   and the hours past the contract's are paid at its premiums.
 * - **Residuals.** Television work earns reruns, syndication and streaming
 *   years by the agreements' formulas, and a film's cast shares its
 *   television and streaming money; where it's seen and how it does is drawn
 *   (`career.residuals`).
 * - **Commercials and voice.** A commercial shoots a day and pays its use
 *   fees each 13-week cycle it runs; voice work is a booth session.
 * - **Location.** A screen job may shoot away (`career.location`): flown out
 *   the day before and home the day after, travel days paid, a day's meal
 *   allowance, and the wages taxed where the work was done.
 * - **Later seasons.** A series regular is under option after a season; by
 *   mid-June it's picked up or not (`career.renewal`), a picked-up season
 *   starting about a year after the last, at 4% more, taking precedence over
 *   what clashes with it, and another series regular's part is refused while
 *   the option stands.
 * - **The unions.** The first SAG-AFTRA job makes the actor eligible; working
 *   under it again thirty days on means joining, and the initiation fee,
 *   first. The first Equity contract makes them a member, $600 of the fee
 *   down and $600 on each of the next two anniversaries. Dues are billed each
 *   May and November.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, MS_HOUR, formatDate, formatDateTime, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax, salesTaxRate } from '../content/tax';
import {
  AFTERLIFE, AGENCIES, AGENT_COMMISSION, CALLS, CAREER_CITIES, GENRES, WORK_COSTS, MEAL_PENALTY, RECURRING, COMMERCIAL_RUN, COMMERCIAL_USE, EQUITY, LOCATION, MANAGEMENT, MANAGERS, OVERTIME, RESIDUALS, ROLES, SAG_AFTRA, SERIES, SHOWCASE_2029, rateOn,
  type Agency, type CareerCity, type Manager, type Role,
} from '../content/career';
import { earningsOf, homeOf, recordJobCost, recordWages, ukTaxYear, yearOf } from './earnings';
import { ABROAD } from '../content/safetynet';
import { armHealth, inHospital } from './health';
import { armTaxes } from './taxreturn';
import { YALE_DRAMA } from '../content/school';
import { meanCraft, focusOf, sessionGain, summerOf, type Craft } from './school';
import { rentAt } from '../content/rents';
import { enjoyWork, takeTheRoom } from './enjoyment';
import { personalityOf } from './personality';
import { move, payFromCurrent, type Housing, spend } from './household';

export const SHOWCASE_KIND = 'career.showcase';
export const CAREER_WEEK_KIND = 'career.week';
export const AUDITION_KIND = 'career.audition';
export const OFFER_KIND = 'career.offer';
export const STAY_KIND = 'career.stay';
export const LAPSE_KIND = 'career.lapse';
export const WORK_KIND = 'career.work';
export const PAY_KIND = 'career.pay';
export const RESIDUAL_KIND = 'career.residual';
export const TRAVEL_KIND = 'career.travel';
export const RENEWAL_KIND = 'career.renewal';

/** SLATE's estimates of what the business doesn't publish, each named where it's used. */
export const ESTIMATE = {
  /** How long an agency's offer of representation stands, and a booking's. */
  representationOfferDays: 30,
  bookingOfferDays: 2,
  /** How a showing reads: acting counts as much as every other area together. */
  showcaseActingWeight: 0.5,
  /** How much of a showing tiredness can take: at no readiness at all, a fifth. It took it all until 2026-09-26, and the class's best actor, tired at five, read at 58 and no big agency looked. */
  showcaseTiredness: 0.2,
  /** The chance a management firm whose bar the showing clears wants the actor. */
  managerInterest: 0.5,
  /** The chance an agency whose bar the showing clears wants the actor. */
  agencyInterest: 0.6,
  /**
   * How many of a class an agency signs from one showcase: the class shows
   * together, and an agency takes the best it sees, two of them. Until
   * 2026-09-27 the player was seen alone.
   */
  agencyTakes: 2,
  /**
   * A booking's chance at the part's bar, and how far each point of craft
   * above or below moves it: a newer actor at the bar books about one in
   * twenty, as the trade reckons (1 in 20 to 1 in 30), and a seasoned one
   * well above it one in ten.
   */
  bookAtBar: 0.05,
  bookPerPoint: 0.004,
  bookFloor: 0.005,
  bookCeiling: 0.2,
  /** A self-tape is weighed a little under the room. */
  tapeFactor: 0.85,
  /** How many of a week's auditions are self-tapes. */
  tapeShare: 0.6,
  /** How long after an audition an offer comes. */
  offerAfterDays: [3, 10] as const,
  /** A year signed with nothing booked, or three missed auditions, and the agency lets the actor go. */
  dropAfterDays: 365,
  dropAfterMissed: 3,
  /** Self-submissions a week, and the chance each brings an audition. */
  selfSubmitsAWeek: 5,
  selfSubmitCallback: 0.15,
  /** What a day's work grows, and takes out of a body in energy. */
  workGain: 1.2,
  workEnergy: 8,
} as const;

/** SAG-AFTRA's terms for leaving an agency: no offer in the first 120 days; after, under ten days' work in 91. */
export const LEAVING = { firstDays: 120, windowDays: 91, fewerThanDays: 10, source: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/2360' } as const;

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

export interface Audition {
  id: string;
  roleId: string;
  at: Instant;
  mode: 'tape' | 'room';
  cityId: CareerCity;
  status: 'ahead' | 'done' | 'missed' | 'booked';
  /** Self-submitted, not sent by the agency. */
  self?: boolean;
  /** Worked on with a coach first. */
  coached?: boolean;
}

export interface Booking {
  id: string;
  roleId: string;
  cityId: CareerCity;
  starts: Instant;
  /** Days on screen; weeks of performances on stage. */
  units: number;
  /** Weeks of rehearsal first, on stage. */
  rehearsalWeeks: number;
  /** What it's filed under, where it's filed under anything. */
  genre?: string;
  status: 'offered' | 'accepted' | 'passed' | 'lapsed' | 'worked' | 'fired' | 'released';
  dueAt: Instant;
  offeredAt: Instant;
  /** Days worked, and of them not yet paid. */
  worked: number;
  owed: number;
  /** Weeks paid, on stage, so rehearsal weeks are commissioned at their rate. */
  weeksPaid: number;
  /** Each day's overtime, by the day's place in the job. */
  overtimeDays?: Money[];
  /** Where it shoots, if not at home (`LOCATION`). */
  location?: string;
  /** A later season's rate, in US cents, above the minimum by the season's raises. */
  rate?: Money;
  /** A series regular's season, and the first season's booking, which names the series. */
  season?: number;
  seriesId?: string;
  /** Travel days and meal allowance owed, paid with the job. */
  travelOwed?: Money;
  perDiemOwed?: Money;
}

/** A job's life after it's made, and what it has paid (`RESIDUALS`, `AFTERLIFE`). */
export interface Residual {
  id: string;
  bookingId: string;
  roleId: string;
  kind: 'network' | 'svod' | 'film' | 'commercial';
  /** A commercial's cycles after the first: where each ran, and a network's airings. */
  plan?: ('network' | 'cable' | 'wild')[];
  uses?: number[];
  /** A streaming service's size, by its subscribers. */
  size?: 'small' | 'middle' | 'large';
  /** What the performer was paid for an episode, overtime premiums aside, and how many episodes. */
  perEpisode: Money;
  episodes: number;
  /** Days worked, for a film's units. */
  days: number;
  /** When it was first seen. */
  airsAt: Instant;
  /** Where the work was done, for another country's tax on what it pays later. */
  workCity?: string;
  rerun?: boolean;
  syndicated?: boolean;
  hit?: boolean;
  paid: Money;
  payments: number;
}

/** A day worked: when, its hours, and its scale, for the rule on leaving an agency and a week's unemployment. */
export interface WorkedDay { at: Instant; hours: number; pay: Money }

export interface Offer { agencyId: string; cityId: CareerCity; until: Instant }
export interface ManagerOffer { managerId: string; until: Instant }

export interface CareerRecord {
  /** Each showcase's reading, by city. */
  showcases: { cityId: CareerCity; at: Instant; score: number }[];
  /** Offers of representation standing. */
  offers: Offer[];
  agencyId?: string;
  agencyCity?: CareerCity;
  signedAt?: Instant;
  /** The last representation ended, and why. */
  ended?: { agencyId: string; at: Instant; reason: string; left: boolean };
  missed: number;
  lastBookedAt?: Instant;
  auditions: Audition[];
  bookings: Booking[];
  credits: { roleId: string; year: number; cityId: CareerCity }[];
  unions: {
    sag?: { eligibleAt: Instant; joinedAt?: Instant };
    equity?: { joinedAt: Instant; initiationPaid: Money };
    /** A joining fee the bank couldn't cover on a job they were bound to, taken from the job's pay. */
    owed?: Money;
  };
  /** A manager, and offers from them. Until 2026-09-27 there were none. */
  managerId?: string;
  managerSince?: Instant;
  managerOffers: ManagerOffer[];
  /** The days worked, the last few hundred. */
  days: WorkedDay[];
  residuals: Residual[];
  /** A series under option between seasons, until its pickup is decided. */
  option?: { seriesId: string; bookingId: string; decidedAt: Instant };
  /** Self-submissions this week, waiting on Monday. */
  submitted: number;
  /** When the business began for them: the school's hold let go. */
  since?: Instant;
  /** What the work costs them: casting sites paid to a date and whether they renew; headshots' date; a tape kit; a class, and the month it's paid for. */
  sites?: Partial<Record<CastingSite, { until: Instant; renews: boolean }>>;
  headshotsAt?: Instant;
  kit?: boolean;
  reelAt?: Instant;
  scene?: { paidFor: string };
  /** The last dues period billed, `YYYY-M`. */
  duesBilled?: string;
  /** The last id given an audition or a booking. */
  seq: number;
}

const nextOwnId = (career: CareerRecord, prefix: string) => `${prefix}${(career.seq += 1)}`;

export type CastingSite = keyof typeof WORK_COSTS.sites;

/** Whether a casting site is paid for at a moment. */
export const onSite = (career: CareerRecord, site: CastingSite, at: Instant) => (career.sites?.[site]?.until ?? 0) > at;

/** Headshots more than two years old: the showcase's, from when the business began, until new ones. */
export const staleHeadshots = (career: CareerRecord, at: Instant) => at - (career.headshotsAt ?? career.since ?? at) > WORK_COSTS.headshotsLastDays * MS_DAY;

/** Goods bought where they are: the price and the sales tax on it. */
export function withSalesTax(person: Person, at: Instant, cents: Money): Money {
  return Math.round(cents * (1 + salesTaxRate(person.currentLocationId, at, 'goods')));
}

/** Paid from the bank as a cost of the work, counted for the return; false where the bank can't. */
function payForWork(sim: Simulation, person: Person, amount: Money, memo: string): boolean {
  if (!payFromCurrent(sim, person, amount, memo, 'career')) return false;
  recordJobCost(person, sim.now, amount);
  return true;
}

export function careerOf(person: Person): CareerRecord {
  person.career ??= { showcases: [], offers: [], missed: 0, auditions: [], bookings: [], credits: [], unions: {}, submitted: 0, seq: 0, managerOffers: [], days: [], residuals: [] };
  person.career.managerOffers ??= [];
  person.career.days ??= [];
  person.career.residuals ??= [];
  return person.career;
}

export const roleById = (id: string): Role => {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`No role kind ${id}.`);
  return role;
};
export const agencyById = (id: string): Agency | undefined => AGENCIES.find((a) => a.id === id);
export const managerById = (id: string): Manager | undefined => MANAGERS.find((m) => m.id === id);

const zoneOf = (cityId: string) => CITIES.require(cityId).timeZone;
const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
const dayKey = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const weekday = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); };
const at = (from: Instant, zone: string, days: number, hour: number) => { const p = zonedParts(from, zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day + days), hour }, zone); };

/** Where the business is for them: the agency's city, or where they live if it's one of the two, or New York. */
export function workCity(person: Person): CareerCity {
  if (person.career?.agencyCity) return person.career.agencyCity;
  return (CAREER_CITIES as readonly string[]).includes(person.currentLocationId) ? (person.currentLocationId as CareerCity) : 'us-ny-newyork';
}

/** Where a booking's work is done: on location, or at home. */
export const workCityOf = (booking: Booking): string => booking.location ?? booking.cityId;

/**
 * A recurring arc's episode past 60% of the season, where the arc reaches
 * it, paid at 120% (`RECURRING`), for a season begun from 2027.
 */
export function arcUplift(booking: Booking, episode: number): number {
  const role = roleById(booking.roleId);
  if (!role.arc || dayKey(booking.starts, zoneOf(workCityOf(booking))) < RECURRING.from) return 1;
  const threshold = Math.floor(RECURRING.share * RECURRING.seasonEpisodes);
  // An episode past the mark means the arc reached it.
  return episode >= threshold ? RECURRING.uplift : 1;
}

/**
 * What another country withholds from a check for work done there: Canada
 * 23% of the gross, residuals included; the United Kingdom 20% once the UK
 * tax year's gross, from 6 April, passes the treaty's $20,000. Canada's is withheld whatever the year comes to, and
 * the return has it back where the year stays under CAD 15,000.
 */
export function foreignWithholding(person: Person, workCity: string, gross: Money, when: Instant, into: string, payer?: { id: string; expected: Money }): Money {
  const country = CITIES.get(workCity)?.countryId;
  if (!country || country === 'us') return 0;
  if (country === 'ca') return Math.round(gross * ABROAD.canada.rate);
  if (country === 'uk') {
    // Payer by payer, in the UK's tax year: from the first payment, once the payer's total is expected past £12,570.
    const paid = payer ? earningsOf(person).ukPayers?.[ukTaxYear(when)]?.[payer.id] ?? 0 : 0;
    const threshold = exchange(ABROAD.uk.payerThresholdGbp, 'GBP', into) ?? ABROAD.uk.payerThresholdGbp;
    return Math.max(paid + gross, payer?.expected ?? 0) > threshold ? Math.round(gross * ABROAD.uk.rate) : 0;
  }
  return 0;
}

/** What a booking is expected to pay in all, at its rate: its days on screen, its weeks on stage with rehearsal. */
export function expectedGross(booking: Booking, when: Instant, into: string): Money {
  const role = roleById(booking.roleId);
  const units = role.medium === 'stage' ? booking.units + booking.rehearsalWeeks : role.series ? role.series.episodes : booking.units;
  return unitRate(booking, when, into) * units;
}

/** A booking's unit rate on a day: a later season's own, or the part's minimum. */
export function unitRate(booking: Booking, when: Instant, into: string): Money {
  const role = roleById(booking.roleId);
  const minimum = rateOf(role, when, workCityOf(booking), into);
  return booking.rate !== undefined ? Math.max(minimum, usd(booking.rate, into)) : minimum;
}

/** What a part pays a unit (a day on screen, a week on stage) on a day, in the save's money. */
export function rateOf(role: Role, when: Instant, cityId: string, into: string): Money {
  return usd(rateOn(role.steps, dayKey(when, zoneOf(cityId))), into);
}

// ---------------------------------------------------------------------------
// The showcase and representation
// ---------------------------------------------------------------------------

/** What a showing reads as: acting weighed against the rest, and up to a fifth less for a tired actor. */
export function showcaseScore(craft: Craft, focus: number): number {
  const w = ESTIMATE.showcaseActingWeight;
  return (w * craft.acting + (1 - w) * meanCraft(craft)) * (1 - ESTIMATE.showcaseTiredness * (1 - Math.min(1, focus)));
}

/** Which agencies offer after a showing (`career.offers`): those whose bar it clears and who want the actor. */
export function offersFor(sim: Simulation, person: Person, score: number, key: string, rivals: readonly number[] = []): string[] {
  const rng = sim.rng('career.offers', person.id, key);
  // Shown beside the class, an agency takes its best two: a classmate who outshone them cleared its bar too.
  const ahead = rivals.filter((r) => r > score).length;
  return AGENCIES.filter((agency) => rng.next() < ESTIMATE.agencyInterest && score >= agency.bar && ahead < ESTIMATE.agencyTakes).map((a) => a.id);
}

/** Which management firms offer (`career.managers`): those whose bar the showing clears, half of them wanting the actor. */
export function managerOffersFor(sim: Simulation, person: Person, score: number, key: string): string[] {
  const rng = sim.rng('career.managers', person.id, key);
  return MANAGERS.filter((m) => rng.next() < ESTIMATE.managerInterest && score >= m.bar).map((m) => m.id);
}

function offerManagement(sim: Simulation, person: Person, managers: string[], why: string): void {
  const career = careerOf(person);
  if (career.managerId) return;
  const until = sim.now + ESTIMATE.representationOfferDays * MS_DAY;
  const fresh = managers.filter((id) => !career.managerOffers.some((o) => o.managerId === id));
  career.managerOffers.push(...fresh.map((managerId) => ({ managerId, until })));
  if (!fresh.length || person.id !== sim.universe.playerId) return;
  sim.requireDecision({
    urgency: 85, category: 'career', title: fresh.length === 1 ? 'An Offer Of Management' : `${fresh.length} Offers Of Management`,
    detail: `${why} ${fresh.map((id) => managerById(id)!.name).join(', ')} offered to manage you, for ${Math.round(MANAGEMENT.withAgent * 100)}% of what you earn beside an agent, or ${Math.round(MANAGEMENT.alone * 100)}% without one. The offers stand until ${formatDate(until, sim.zone)}.`,
    route: '/workspace/career', dueAt: until, refType: 'management', refId: `${sim.now}`,
    actions: fresh.map((managerId) => ({ label: `Sign With ${managerById(managerId)!.name}`, commandKind: 'career.sign_manager', payload: { managerId } })),
  });
}

/** Both showcases on the calendar, for a student in their last term. */
export function bookShowcase(sim: Simulation, person: Person): void {
  const shows: [CareerCity, { year: number; month: number; day: number }, number][] = [
    ['us-ny-newyork', SHOWCASE_2029.newYork, 17],
    ['us-ca-losangeles', SHOWCASE_2029.losAngeles, 13],
  ];
  for (const [cityId, date, hour] of shows) {
    const when = instantFromZoned({ ...date, hour }, zoneOf(cityId));
    if (when <= sim.now) continue;
    sim.schedule({
      at: when, kind: SHOWCASE_KIND, label: `Actor Showcase, ${CITIES.require(cityId).name}`, category: 'school', priority: 30,
      requiresPlayer: true, durationMinutes: 150, locationId: cityId, payload: { personId: person.id, cityId },
    });
  }
}

/** When the school's hold on their time ends, by the degree or dismissal: the business from the Monday after. */
export function beginCareer(sim: Simulation, person: Person): void {
  const career = careerOf(person);
  if (career.since !== undefined) return;
  career.since = sim.now;
  scheduleWeek(sim, person, nextMonday(sim.now, zoneOf(workCity(person))));
  // Cover and taxes from here: the school's plan runs out, and the returns begin.
  armHealth(sim, person);
  armTaxes(sim, person);
}

/** A week's submissions: five, Backstage's listings five more, and Casting Networks' five more in Los Angeles and two elsewhere. */
export function submissionsAWeek(career: CareerRecord, at: Instant, cityId?: string): number {
  const cn = WORK_COSTS.castingNetworksSubmissions;
  return ESTIMATE.selfSubmitsAWeek + (onSite(career, 'backstage', at) ? WORK_COSTS.backstageSubmissions : 0)
    + (onSite(career, 'casting-networks', at) ? (cityId === 'us-ca-losangeles' ? cn['us-ca-losangeles'] : cn.other) : 0);
}

const monthOf = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${p.month}`; };

/**
 * A week of what the work costs: a site that's run out renews for a year if
 * it's set to and the bank can pay; a class is paid for each new month, or
 * left; and a week in class grows the actor's acting as a class at school
 * does, if they're there to take it.
 */
export function workCostsWeek(sim: Simulation, person: Person, when: Instant): void {
  const career = careerOf(person);
  const cur = saveCurrency(sim.universe);
  for (const [site, held] of Object.entries(career.sites ?? {}) as [CastingSite, { until: Instant; renews: boolean }][]) {
    if (held.until > when || !held.renews) continue;
    const { label, price } = WORK_COSTS.sites[site];
    if (payForWork(sim, person, usd(price, cur), `${label}, a year`)) held.until += 365 * MS_DAY;
    else held.renews = false;
  }
  const scene = career.scene;
  if (!scene) return;
  const month = monthOf(when, sim.homeZone);
  if (scene.paidFor !== month) {
    if (!payForWork(sim, person, usd(WORK_COSTS.classMonthly, cur), 'Scene-study class, the month')) { delete career.scene; return; }
    scene.paidFor = month;
  }
  if (present(person, when) && person.craft) person.craft.acting = Math.min(100, person.craft.acting + sessionGain(person.craft.acting, focusOf(person)));
}

/** What a call costs in stress by its hour: before nine in the morning, or a performance that runs late. */
export function callStress(person: Person, hour: number, performance: boolean): number {
  if (hour < CALLS.earlyBefore) return CALLS.early * personalityOf(person, 'earlyCall');
  return performance ? CALLS.late * personalityOf(person, 'lateCall') : 0;
}

/** A job's genre, by its medium, from a draw. */
export function genreOf(role: Role, x: number): { genre?: string } {
  const list = role.id === 'animation' ? GENRES.animation : role.medium === 'stage' ? GENRES.stage : role.medium === 'screen' && role.after?.kind !== 'commercial' ? GENRES.screen : undefined;
  if (!list) return {};
  let left = x * list.reduce((sum, [, w]) => sum + w, 0);
  for (const [genre, w] of list) { left -= w; if (left <= 0) return { genre }; }
  return { genre: list[list.length - 1]![0] };
}

/** A student's summer: the business's week from the next Monday, while the summer lasts (`systems/school.ts`). */
export function armSummerWork(sim: Simulation, person: Person): void {
  if (sim.universe.scheduled.some((i) => i.kind === CAREER_WEEK_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  scheduleWeek(sim, person, nextMonday(sim.now, zoneOf(workCity(person))));
}

/** The next Monday at eight, after a moment. */
function nextMonday(from: Instant, zone: string): Instant {
  for (let n = 1; n <= 7; n += 1) if (weekday(at(from, zone, n, 8), zone) === 1) return at(from, zone, n, 8);
  return from + 7 * MS_DAY;
}

function scheduleWeek(sim: Simulation, person: Person, when: Instant): void {
  sim.schedule({ at: when, kind: CAREER_WEEK_KIND, label: 'The Week’s Submissions', category: 'system', priority: 8, payload: { personId: person.id } });
}

function represent(sim: Simulation, person: Person, offer: Offer): void {
  const career = careerOf(person);
  career.agencyId = offer.agencyId;
  career.agencyCity = offer.cityId;
  career.signedAt = sim.now;
  career.missed = 0;
  career.offers = [];
  for (const d of Object.values(sim.universe.decisions)) if (d.category === 'career' && d.refType === 'representation' && !d.resolvedAt) d.resolvedAt = sim.now;
}

function endRepresentation(sim: Simulation, person: Person, reason: string, left: boolean): void {
  const career = careerOf(person);
  if (!career.agencyId) return;
  const agency = agencyById(career.agencyId)!;
  career.ended = { agencyId: agency.id, at: sim.now, reason, left };
  delete career.agencyId;
  delete career.agencyCity;
  delete career.signedAt;
  career.missed = 0;
  for (const a of career.auditions) {
    if (a.status !== 'ahead' || a.self) continue;
    a.status = 'missed';
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === AUDITION_KIND && item.payload.auditionId === a.id) sim.timeline.cancel(item.id, sim.now);
  }
  if (!left && person.id === sim.universe.playerId) sim.notify({ category: 'money', title: `${agency.name} Let You Go`, body: `${reason} You can still submit yourself for work.`, importance: 85, route: '/workspace/career' });
}

function offerRepresentation(sim: Simulation, person: Person, agencies: string[], cityId: CareerCity, why: string): void {
  const career = careerOf(person);
  const until = sim.now + ESTIMATE.representationOfferDays * MS_DAY;
  const fresh = agencies.filter((id) => !career.offers.some((o) => o.agencyId === id));
  career.offers.push(...fresh.map((agencyId) => ({ agencyId, cityId, until })));
  if (!fresh.length || person.id !== sim.universe.playerId) return;
  const city = CITIES.require(cityId).name;
  sim.requireDecision({
    urgency: 90, category: 'career', title: fresh.length === 1 ? 'An Offer Of Representation' : `${fresh.length} Offers Of Representation`,
    detail: `${why} ${fresh.map((id) => agencyById(id)!.name).join(', ')}, in ${city}, offered to represent you. An agency takes ${Math.round(AGENT_COMMISSION.rate * 100)}% of what you earn. The offers stand until ${formatDate(until, zoneOf(cityId))}.`,
    route: '/workspace/career', dueAt: until, refType: 'representation', refId: `${cityId}-${sim.now}`,
    actions: fresh.map((agencyId) => ({ label: `Sign With ${agencyById(agencyId)!.name}`, commandKind: 'career.sign', payload: { agencyId, cityId } })),
  });
}

// ---------------------------------------------------------------------------
// Auditions and bookings
// ---------------------------------------------------------------------------

/** The craft a part reads: acting twice, with the camera on screen, or the voice and the text on stage. */
export function levelFor(craft: Craft, role: Role): number {
  if (role.medium === 'voice') return (craft.acting + craft.voice * 2) / 3;
  return role.medium === 'screen' ? (craft.acting * 2 + craft.screen) / 3 : (craft.acting * 2 + craft.voice + craft.text) / 4;
}

/** A booking's chance at an audition: at the part's bar, more above and less below, less tired, less on tape and less again without a kit, more coached. */
export function bookingChance(craft: Craft, role: Role, focus: number, mode: 'tape' | 'room', kit = true, coached = false): number {
  const raw = ESTIMATE.bookAtBar + ESTIMATE.bookPerPoint * (levelFor(craft, role) - role.bar);
  const chance = Math.min(ESTIMATE.bookCeiling, Math.max(ESTIMATE.bookFloor, raw)) * Math.min(1.1, focus) * (coached ? WORK_COSTS.coached : 1);
  return mode === 'tape' ? chance * ESTIMATE.tapeFactor * (kit ? 1 : WORK_COSTS.noKit) : chance;
}

/** Whether an audition books (`career.booking`). */
export function books(sim: Simulation, person: Person, audition: Audition, focus: number): boolean {
  return sim.rng('career.booking', person.id, audition.id).next() < bookingChance(person.craft!, roleById(audition.roleId), focus, audition.mode, careerOf(person).kit === true, audition.coached === true);
}

/** A week's auditions (`career.auditions`): the agency's, a Poisson count by its reach, and the submissions that came back. */
export function weekOfAuditions(sim: Simulation, person: Person, weekStart: Instant, agency: Agency | undefined, cityId: CareerCity, submitted: number, managed = false): Omit<Audition, 'id' | 'status'>[] {
  const rng = sim.rng('career.auditions', person.id, String(weekStart));
  const poisson = (mean: number) => { let n = 0; const limit = Math.exp(-mean); for (let p = rng.next(); p > limit; p *= rng.next()) n += 1; return n; };
  // Old headshots get an actor called in less, by the agency and on their own.
  const career = careerOf(person);
  const look = staleHeadshots(career, weekStart) ? WORK_COSTS.staleHeadshots : 1;
  const count = agency ? poisson(agency.auditionsPerWeek * look) : 0;
  // A manager's relationships: the work a middling agency's reach sends.
  const fromManager = managed ? poisson(MANAGEMENT.auditionsPerWeek * look) : 0;
  let self = 0;
  // A free submission sends a name and a résumé; a paid site's, the headshot, and the reel where there is one, without which the breakdowns that ask for one are shut.
  const onAny = (Object.keys(WORK_COSTS.sites) as CastingSite[]).some((site) => onSite(career, site, weekStart));
  const paid = onAny ? (career.reelAt !== undefined ? 1 : 1 - WORK_COSTS.wantReel) : WORK_COSTS.freeSubmissionShare;
  for (let n = 0; n < submitted; n += 1) if (rng.next() < ESTIMATE.selfSubmitCallback * paid * look) self += 1;
  const pick = (open: readonly Role[]) => {
    let x = rng.next() * open.reduce((sum, r) => sum + r.weight, 0);
    for (const r of open) { x -= r.weight; if (x <= 0) return r; }
    return open[open.length - 1]!;
  };
  const here = ROLES.filter((r) => r.cities.includes(cityId));
  const sent = here.filter((r) => agency !== undefined && r.tiers.includes(agency.tier));
  const open = here.filter((r) => r.selfSubmit);
  const theirs = here.filter((r) => r.tiers.includes(2));
  const zone = zoneOf(cityId);
  const out: Omit<Audition, 'id' | 'status'>[] = [];
  for (let n = 0; n < count + fromManager + self; n += 1) {
    const mine = n >= count + fromManager;
    const role = pick(mine ? open : n >= count ? theirs : sent);
    const when = at(weekStart, zone, Math.floor(rng.next() * 5), 10 + Math.floor(rng.next() * 7));
    // Submitted from out of town, casting asks for a tape; an agency's room expects its client in town.
    const room = rng.next() >= ESTIMATE.tapeShare && !(mine && person.currentLocationId !== cityId);
    out.push({ roleId: role.id, at: when, mode: room ? 'room' : 'tape', cityId, ...(mine ? { self: true } : {}) });
  }
  return out;
}

function present(person: Person, when: Instant, cityId?: string): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  // In hospital, they're nowhere else (`systems/health.ts`).
  return !asleep && !inHospital(person, when) && (cityId === undefined || person.currentLocationId === cityId);
}

/**
 * A booking's calls, from its start: on screen, consecutive weekdays at
 * seven; on stage, rehearsal days, Tuesday to Sunday at eleven, then
 * performances, Tuesday to Sunday at half past seven. Each carries the week
 * it's in, counted from the start.
 */
export function workDays(booking: Booking): { at: Instant; week: number; rehearsal: boolean }[] {
  const role = roleById(booking.roleId);
  const zone = zoneOf(workCityOf(booking));
  const out: { at: Instant; week: number; rehearsal: boolean }[] = [];
  if (role.medium !== 'stage') {
    // A series regular's season is its workweeks, Monday to Friday; a voice session is at ten.
    const days = role.series ? role.series.weeks * 5 : role.arc ? booking.units * 5 : booking.units;
    for (let d = 0; out.length < days; d += 1) {
      const when = at(booking.starts, zone, d, role.medium === 'voice' ? 10 : 7);
      const wd = weekday(when, zone);
      if (wd >= 1 && wd <= 5) out.push({ at: when, week: Math.floor(d / 7), rehearsal: false });
    }
    return out;
  }
  const weeks = booking.rehearsalWeeks + booking.units;
  for (let d = 0; d < weeks * 7; d += 1) {
    const week = Math.floor(d / 7);
    const rehearsal = week < booking.rehearsalWeeks;
    const when = at(booking.starts, zone, d, rehearsal ? 11 : 19);
    if (weekday(when, zone) !== 1) out.push({ at: rehearsal ? when : when + 30 * 60_000, week, rehearsal });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pay
// ---------------------------------------------------------------------------

/**
 * A paycheck, as a payroll works it out. On SAG-AFTRA work at scale with an
 * agent, the producer pays scale plus 10% and the agency takes the 10%; on
 * Equity work the agency takes 10%, or 5% of a rehearsal week. Equity's
 * working dues come off the check. Tax is withheld as the difference the
 * check makes to the year's tax on the year's wages at the job's town, so a
 * year's withholding comes to the year's tax on what was earned.
 */
export function paycheck(opts: { scale: Money; overtime?: Money; role: Role; rehearsal: boolean; represented: boolean; managed?: boolean; before: Money; cityId: string; at: Instant }) {
  const { scale, role, rehearsal, represented, before, cityId } = opts;
  const agentRate = role.union === 'equity' && rehearsal ? AGENT_COMMISSION.equityRehearsalRate : AGENT_COMMISSION.rate;
  // A commercial is commissioned at scale; other SAG-AFTRA work is paid scale plus 10% for the agent's share.
  const plusTen = represented && role.union === 'sag' && role.after?.kind !== 'commercial';
  const gross = (plusTen ? Math.round(scale * (1 + AGENT_COMMISSION.rate)) : scale) + (opts.overtime ?? 0);
  const agent = !represented ? 0 : role.union === 'sag' ? Math.round(scale * AGENT_COMMISSION.rate) : Math.round(scale * agentRate);
  // A manager takes a share of all of it: less beside an agent.
  const manager = opts.managed ? Math.round(gross * (represented ? MANAGEMENT.withAgent : MANAGEMENT.alone)) : 0;
  const dues = role.union === 'equity' ? Math.round(gross * EQUITY.workingDues) : 0;
  const withheld = computeAnnualTax(before + gross, cityId, opts.at).total - computeAnnualTax(before, cityId, opts.at).total;
  return { gross, commission: agent + manager, agent, manager, dues, withheld, net: gross - agent - manager - dues - withheld };
}

/**
 * A shooting day's overtime, over its hours (`OVERTIME`): a day player's
 * ninth and tenth hours at time and a half and the rest at double, on the
 * day rate over eight, capped at twice the day minimum; a weekly performer's
 * hours past ten at double, on the week over 44, and above the money break
 * on the break's rate. SLATE leaves out a weekly performer's time and a half
 * for the ninth and tenth hours after a week's first two such days.
 */
export function overtimeFor(role: Role, dayRate: Money, dayMinimum: Money, hours: number, day: string): Money {
  if (!role.basis) return 0;
  if (role.basis === 'day') {
    const hourly = Math.min(dayRate, OVERTIME.dayBaseCap * dayMinimum) / OVERTIME.dayStraight;
    const half = Math.max(0, Math.min(hours, OVERTIME.dayHalfUntil) - OVERTIME.dayStraight);
    const double = Math.max(0, hours - OVERTIME.dayHalfUntil);
    return Math.round(hourly * (1.5 * half + 2 * double));
  }
  const weekly = role.basis === 'episode' ? dayRate * (role.after?.kind === 'tv' && role.after.length === 'hour' ? 5 / 6 : 1) : dayRate * 5;
  const after = Math.max(0, hours - OVERTIME.weekDoubleAfter);
  let hourly = (2 * weekly) / OVERTIME.weekHours;
  for (const [from, above, rate] of OVERTIME.moneyBreak) if (day >= from && weekly >= above) hourly = rate;
  return Math.round(after * hourly);
}

/** Where a job that travels shoots (`career.location`): home, or one of the places the work goes. */
export function locationFor(sim: Simulation, person: Person, key: string): string | undefined {
  let x = sim.rng('career.location', person.id, key).next();
  for (const [cityId, share] of LOCATION.cities) { if (x < share) return cityId; x -= share; }
  return undefined;
}

/** What a shooting day's late meal costs the production (`MEAL_PENALTY`), drawn with its hours: nothing four days in five. */
export function mealPenalty(sim: Simulation, person: Person, key: string): Money {
  const rng = sim.rng('career.hours', person.id, `${key}-meal`);
  if (rng.next() >= MEAL_PENALTY.chance) return 0;
  const [lo, hi] = MEAL_PENALTY.halfHours;
  const late = lo + Math.floor(rng.next() * (hi - lo + 1));
  let sum = 0;
  for (let n = 0; n < late; n += 1) sum += MEAL_PENALTY.steps[n] ?? MEAL_PENALTY.later;
  return sum;
}

/** Whether a series picks up its option on a regular (`career.renewal`), at the odds its kind of series has. */
export function renewed(sim: Simulation, person: Person, bookingId: string, odds: number): boolean {
  return sim.rng('career.renewal', person.id, bookingId).next() < odds;
}

/** How long a shooting day runs (`career.hours`). */
export function hoursOf(sim: Simulation, person: Person, key: string): number {
  const [lo, hi] = OVERTIME.dayHours;
  return lo + Math.floor(sim.rng('career.hours', person.id, key).next() * (hi - lo + 1));
}

function bankAccount(sim: Simulation, person: Person): Account | undefined {
  const a = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  return a && !a.closedAt ? a : undefined;
}

/** Days worked, on any job, in the window before a moment. */
export function daysWorkedIn(sim: Simulation, person: Person, days: number): number {
  const from = sim.now - days * MS_DAY;
  return careerOf(person).days.filter((d) => d.at >= from && d.at <= sim.now).length;
}

/** What a stretch of work came to: its hours and its scale, for a week of unemployment. */
export function workedBetween(person: Person, from: Instant, to: Instant): { hours: number; pay: Money } {
  const days = (person.career?.days ?? []).filter((d) => d.at >= from && d.at < to);
  return { hours: days.reduce((sum, d) => sum + d.hours, 0), pay: days.reduce((sum, d) => sum + d.pay, 0) };
}

/** Whether they're on a job now: one taken whose days have begun and not ended. */
export function working(sim: Simulation, person: Person): boolean {
  return (person.career?.bookings ?? []).some((b) => b.status === 'accepted' && workDays(b)[0]!.at <= sim.now);
}

/** Whether they may leave their agency now, on SAG-AFTRA's terms, and why not if not. */
export function mayLeave(sim: Simulation, person: Person): { ok: boolean; why: string } {
  const career = careerOf(person);
  if (!career.agencyId || career.signedAt === undefined) return { ok: false, why: 'You have no agency.' };
  const offered = career.bookings.some((b) => b.offeredAt >= career.signedAt!);
  if (!offered) {
    return sim.now - career.signedAt >= LEAVING.firstDays * MS_DAY
      ? { ok: true, why: `No offer in the first ${LEAVING.firstDays} days.` }
      : { ok: false, why: `With no offer yet, you may leave once ${LEAVING.firstDays} days have passed since signing.` };
  }
  const worked = daysWorkedIn(sim, person, LEAVING.windowDays);
  return worked < LEAVING.fewerThanDays
    ? { ok: true, why: `${worked} days’ work in the last ${LEAVING.windowDays}.` }
    : { ok: false, why: `${worked} days’ work in the last ${LEAVING.windowDays}: the contract holds while it’s ${LEAVING.fewerThanDays} or more.` };
}

// ---------------------------------------------------------------------------
// Handlers and commands
// ---------------------------------------------------------------------------

export function registerCareer(sim: Simulation): void {
  const personOf = (item: { payload: Record<string, unknown> }) => sim.universe.people[String(item.payload.personId)];
  const isPlayer = (person: Person) => person.id === sim.universe.playerId;

  sim.onSchedule(SHOWCASE_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft || !person.school || person.school.standing === 'dismissed') return;
    const career = careerOf(person);
    const cityId = item.payload.cityId as CareerCity;
    // The school takes the class; asleep, they aren't seen.
    const focus = present(person, item.at) ? focusOf(person) : 0;
    const score = showcaseScore(person.craft, focus);
    career.showcases.push({ cityId, at: item.at, score });
    // The class shows with them, each classmate at an ordinary day's readiness.
    const rivals = person.school.classmates.map((m) => showcaseScore(m.craft, 1));
    const offers = focus > 0 && !career.agencyId ? offersFor(s, person, score, cityId, rivals) : [];
    const city = CITIES.require(cityId).name;
    const managers = focus > 0 && !career.managerId ? managerOffersFor(s, person, score, cityId) : [];
    if (managers.length) offerManagement(s, person, managers, `After the showcase in ${city},`);
    if (offers.length) { offerRepresentation(s, person, offers, cityId, `After the showcase in ${city},`); return; }
    if (isPlayer(person) && !career.agencyId) {
      s.notify({ category: 'money', title: focus > 0 ? `No Offers From ${city}` : `You Missed The Showcase In ${city}`, body: focus > 0 ? 'Nobody in the room offered to represent you. You can still submit yourself for work, and an agency can come later.' : 'Asleep through it, you weren’t seen.', importance: 80, route: '/workspace/career' });
    }
  });

  sim.onSchedule(CAREER_WEEK_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft) return;
    const career = careerOf(person);
    // A student's week runs only through the summer; the fall term ends it.
    if (career.since === undefined && !summerOf(person, item.at)) { career.submitted = 0; return; }
    career.offers = career.offers.filter((o) => o.until > s.now);
    career.managerOffers = career.managerOffers.filter((o) => o.until > s.now);
    // A manager's month: now and then, meetings that bring an unrepresented client an agency (`career.managers`).
    const month = zonedParts(item.at, s.homeZone);
    if (career.managerId && !career.agencyId && month.day <= 7 && s.rng('career.managers', person.id, `agency-${item.at}`).next() < MANAGEMENT.findsAnAgency) {
      const found = offersFor(s, person, showcaseScore(person.craft, 1), `manager-${item.at}`);
      if (found.length) offerRepresentation(s, person, found, workCity(person), `Your manager, ${managerById(career.managerId)!.name}, set up meetings, and`);
    }
    if (career.agencyId && career.signedAt !== undefined) {
      const since = Math.max(career.signedAt, career.lastBookedAt ?? 0, career.since ?? 0);
      if (s.now - since > ESTIMATE.dropAfterDays * MS_DAY) endRepresentation(s, person, 'A year with nothing booked, and the agency ended the contract.', false);
    }
    workCostsWeek(s, person, item.at);
    const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
    const cityId = workCity(person);
    const week = weekOfAuditions(s, person, item.at, agency, cityId, career.submitted, career.managerId !== undefined);
    career.submitted = 0;
    for (const one of week) {
      // Booked out: an agency doesn't send a client to an audition that clashes with a job they're working.
      if (s.timeline.conflicts(one.at, one.mode === 'tape' ? 120 : 60).some((i) => i.kind === WORK_KIND && i.payload.personId === person.id)) continue;
      const audition: Audition = { ...one, id: nextOwnId(career, 'a'), status: 'ahead' };
      career.auditions.push(audition);
      s.schedule({
        at: audition.at, kind: AUDITION_KIND, label: `${audition.mode === 'tape' ? 'Self-Tape' : 'Audition'}: ${roleById(audition.roleId).label}`,
        category: 'career', priority: 30, requiresPlayer: true, durationMinutes: audition.mode === 'tape' ? 120 : 60,
        locationId: audition.cityId, payload: { personId: person.id, auditionId: audition.id },
      });
    }
    career.auditions = career.auditions.slice(-60);
    const sent = career.auditions.filter((a) => a.status === 'ahead' && a.at >= item.at);
    if (sent.length && isPlayer(person)) {
      s.notify({ category: 'money', title: sent.length === 1 ? 'An Audition This Week' : `${sent.length} Auditions This Week`, body: sent.map((a) => `${roleById(a.roleId).label}, ${a.mode === 'tape' ? 'a self-tape' : `in the room in ${CITIES.require(a.cityId).name}`}, ${formatDateTime(a.at, zoneOf(a.cityId))}`).join('; ') + '.', importance: 70, route: '/workspace/career' });
    }
    // The next Monday by the calendar, not seven days of the clock, which a change of the clocks moves an hour.
    scheduleWeek(s, person, nextMonday(item.at, zoneOf(workCity(person))));
    const p = zonedParts(item.at, s.homeZone);
    if ((p.month === 5 || p.month === 11) && p.day <= 7) billDues(s, person, p.year, p.month);
  });

  sim.onSchedule(AUDITION_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft) return;
    const career = careerOf(person);
    const audition = career.auditions.find((a) => a.id === item.payload.auditionId);
    if (!audition || audition.status !== 'ahead') return;
    if (!present(person, item.at, audition.mode === 'room' ? audition.cityId : undefined)) {
      audition.status = 'missed';
      item.status = 'missed';
      // In hospital, the agency passes on it for them: no strike.
      if (audition.self || !career.agencyId || inHospital(person, item.at)) return;
      career.missed += 1;
      if (career.missed >= ESTIMATE.dropAfterMissed) { endRepresentation(s, person, `You missed ${ESTIMATE.dropAfterMissed} auditions the agency got you.`, false); return; }
      if (isPlayer(person)) s.notify({ category: 'money', title: 'You Missed An Audition', body: `${roleById(audition.roleId).label}: the agency got you in, and you weren’t there. ${ESTIMATE.dropAfterMissed} missed and they let you go.`, importance: 75, route: '/workspace/career' });
      return;
    }
    audition.status = 'done';
    if (audition.mode === 'room') takeTheRoom(person);
    if (!books(s, person, audition, focusOf(person))) return;
    audition.status = 'booked';
    const [lo, hi] = ESTIMATE.offerAfterDays;
    const wait = lo + Math.floor(s.rng('career.booking', person.id, `${audition.id}-wait`).next() * (hi - lo + 1));
    s.schedule({ at: item.at + wait * MS_DAY, kind: OFFER_KIND, label: 'An Offer', category: 'system', priority: 20, payload: { personId: person.id, auditionId: audition.id } });
  });

  sim.onSchedule(OFFER_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const career = careerOf(person);
    const audition = career.auditions.find((a) => a.id === item.payload.auditionId);
    if (!audition) return;
    const role = roleById(audition.roleId);
    const rng = s.rng('career.booking', person.id, `${audition.id}-job`);
    const span = (r: readonly [number, number]) => r[0] + Math.floor(rng.next() * (r[1] - r[0] + 1));
    const location = role.travels ? locationFor(s, person, audition.id) : undefined;
    const booking: Booking = {
      id: nextOwnId(career, 'b'), roleId: role.id, cityId: audition.cityId,
      starts: nextMonday(s.now + role.leadDays * MS_DAY, zoneOf(location ?? audition.cityId)),
      units: span(role.units), rehearsalWeeks: role.rehearsalWeeks ? span(role.rehearsalWeeks) : 0,
      ...genreOf(role, rng.next()),
      status: 'offered', dueAt: s.now + ESTIMATE.bookingOfferDays * MS_DAY, offeredAt: s.now, worked: 0, owed: 0, weeksPaid: 0,
      ...(location ? { location } : {}),
    };
    career.bookings.push(booking);
    career.bookings = career.bookings.slice(-40);
    s.schedule({ at: booking.dueAt, kind: LAPSE_KIND, label: 'An Offer Lapses', category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking.id } });
    if (!isPlayer(person)) return;
    const cur = saveCurrency(s.universe);
    const zone = zoneOf(booking.cityId);
    const span2 = role.series
      ? `A season of ${role.series.episodes} episodes over ${role.series.weeks} weeks`
      : role.medium !== 'stage'
      ? `${booking.units} ${booking.units === 1 ? (role.medium === 'voice' ? 'session' : 'day') : (role.medium === 'voice' ? 'sessions' : 'days')}`
      : `${booking.rehearsalWeeks} weeks of rehearsal and ${booking.units} of performances`;
    s.requireDecision({
      urgency: 95, category: 'career', title: `Booked: ${role.label}`,
      detail: `${span2} from ${formatDate(booking.starts, zone)}, in ${CITIES.require(workCityOf(booking)).name}${booking.location ? ', on location' : ''}, at ${formatMoney(unitRate(booking, booking.starts, cur), cur)} a ${role.series ? 'episode' : role.medium === 'voice' ? 'session' : role.medium === 'screen' ? 'day' : 'week'}. Answer by ${formatDateTime(booking.dueAt, zone)}.`,
      route: '/workspace/career', dueAt: booking.dueAt, refType: 'booking', refId: booking.id,
      actions: [
        { label: 'Take It', commandKind: 'career.accept', payload: { bookingId: booking.id } },
        { label: 'Pass', commandKind: 'career.pass', payload: { bookingId: booking.id } },
      ],
    });
  });

  sim.onSchedule(LAPSE_KIND, (item, s) => {
    const person = personOf(item);
    const booking = person ? careerOf(person).bookings.find((b) => b.id === item.payload.bookingId) : undefined;
    if (!person || !booking || booking.status !== 'offered') return;
    booking.status = 'lapsed';
    closeDecision(s, booking.id);
    if (isPlayer(person)) s.notify({ category: 'money', title: 'An Offer Lapsed', body: `${roleById(booking.roleId).label}: unanswered, it went to somebody else.`, importance: 60, route: '/workspace/career' });
  });

  sim.onSchedule(WORK_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft) return;
    const career = careerOf(person);
    const booking = career.bookings.find((b) => b.id === item.payload.bookingId);
    if (!booking || booking.status !== 'accepted') return;
    const role = roleById(booking.roleId);
    if (!present(person, item.at, workCityOf(booking))) {
      item.status = 'missed';
      if (inHospital(person, item.at)) {
        // On stage the understudy goes on, and they come back after; the
        // night isn't paid. On screen or in the booth the production can't
        // wait, and recasts: the days worked are paid, and nobody walked off.
        if (role.medium === 'stage') return;
        booking.status = 'released';
        for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === WORK_KIND && one.payload.bookingId === booking.id) s.timeline.cancel(one.id, s.now);
        if (booking.owed > 0) schedulePay(s, person, booking, s.now + 60_000, true);
        if (isPlayer(person)) s.notify({ category: 'money', title: 'Recast While You Were In Hospital', body: `${role.label} couldn’t wait for you, and went to somebody else. What you worked is still paid.`, importance: 90, route: '/workspace/career' });
        return;
      }
      booking.status = 'fired';
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === WORK_KIND && one.payload.bookingId === booking.id) s.timeline.cancel(one.id, s.now);
      if (booking.owed > 0) schedulePay(s, person, booking, s.now + 60_000, true);
      if (isPlayer(person)) s.notify({ category: 'money', title: 'Replaced', body: `You didn’t turn up for ${role.label}, and the production replaced you. What you worked is still paid.`, importance: 90, route: '/workspace/career' });
      if (career.agencyId) endRepresentation(s, person, 'You walked off a job the agency booked.', false);
      return;
    }
    booking.worked += 1;
    booking.owed += 1;
    const cur = saveCurrency(s.universe);
    const call = workDays(booking)[booking.worked - 1]!;
    const unit = unitRate(booking, item.at, cur);
    const scale = role.series ? Math.round((unit * role.series.episodes) / (role.series.weeks * 5)) : role.medium !== 'stage' ? unit : Math.round(unit / 6);
    const hours = role.medium === 'screen' ? hoursOf(s, person, `${booking.id}-${booking.worked}`) : role.medium === 'voice' ? role.sessionHours ?? 4 : call.rehearsal ? 8 : 3;
    if (role.basis) {
      const minimum = rateOf(roleById('costar'), item.at, workCityOf(booking), cur);
      // A day's overtime, and any meal it ran late to (`career.hours`).
      (booking.overtimeDays ??= [])[booking.worked - 1] = overtimeFor(role, unit, minimum, hours, dayKey(item.at, zoneOf(workCityOf(booking))))
        + usd(mealPenalty(s, person, `${booking.id}-${booking.worked}`), cur);
    }
    career.days.push({ at: item.at, hours, pay: scale });
    career.days = career.days.slice(-400);
    if (role.union === 'equity') {
      const monday = at(item.at, zoneOf(booking.cityId), -((weekday(item.at, zoneOf(booking.cityId)) + 6) % 7), 12);
      const key = dayKey(monday, zoneOf(booking.cityId));
      const weeks = earningsOf(person).equityWeeks;
      if (!weeks.includes(key)) weeks.push(key);
    }
    const focus = focusOf(person);
    for (const [skill, weight] of Object.entries(role.grows) as [keyof Craft, number][]) {
      person.craft[skill] = Math.min(100, person.craft[skill] + ESTIMATE.workGain * weight * focus * (1 - person.craft[skill] / 100) ** 1.5);
    }
    person.wellbeing.energy = Math.max(0, person.wellbeing.energy - ESTIMATE.workEnergy);
    // What they love about the day, and how they take the road and the rehearsal room.
    enjoyWork(person, { medium: role.medium, ...(role.after ? { after: role.after.kind } : {}), ...(booking.genre ? { genre: booking.genre } : {}), away: workCityOf(booking) !== homeOf(person), rehearsal: call.rehearsal === true });
    // An early call, or a performance that runs late, as the body clock takes it.
    person.wellbeing.stress = Math.min(100, person.wellbeing.stress + callStress(person, zonedParts(item.at, zoneOf(workCityOf(booking))).hour, role.medium === 'stage' && !call.rehearsal));
    if (booking.worked < workDays(booking).length) return;
    booking.status = 'worked';
    career.credits.push({ roleId: role.id, year: zonedParts(item.at, zoneOf(booking.cityId)).year, cityId: booking.cityId });
    const life = role.after ? afterlife(s, person, booking, item.at) : undefined;
    // A season done, the series holds its option until it's picked up or dropped, by mid-June.
    if (role.series && life) {
      const q = zonedParts(item.at, s.homeZone);
      const june = instantFromZoned({ year: q.month > SERIES.optionMonth || (q.month === SERIES.optionMonth && q.day >= SERIES.optionDay) ? q.year + 1 : q.year, month: SERIES.optionMonth, day: SERIES.optionDay, hour: 10 }, s.homeZone);
      career.option = { seriesId: booking.seriesId ?? booking.id, bookingId: booking.id, decidedAt: june };
      s.schedule({ at: june, kind: RENEWAL_KIND, label: `The Option: ${role.label}`, category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking.id } });
    }
    if (!career.managerId && role.tiers.some((t) => t <= 2)) {
      const managers = managerOffersFor(s, person, levelFor(person.craft, role), booking.id);
      if (managers.length) offerManagement(s, person, managers, `Having seen your ${role.label.toLowerCase()},`);
    }
    // Worked while unrepresented, a job an agency notices can bring its call (`career.offers`).
    if (!career.agencyId && role.tiers.some((t) => t <= 2)) {
      const score = levelFor(person.craft, role);
      const offers = offersFor(s, person, score, booking.id);
      if (offers.length) offerRepresentation(s, person, offers, booking.cityId, `Having seen your ${role.label.toLowerCase()},`);
    }
  });

  sim.onSchedule(PAY_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const career = careerOf(person);
    const booking = career.bookings.find((b) => b.id === item.payload.bookingId);
    const account = bankAccount(s, person);
    if (!booking || !account) return;
    if (booking.owed <= 0 && !booking.travelOwed && !booking.perDiemOwed) return;
    const role = roleById(booking.roleId);
    const cur = saveCurrency(s.universe);
    const workCity = workCityOf(booking);
    const zone = zoneOf(workCity);
    const taxCity = CITIES.get(workCity)?.countryId === 'us' ? workCity : homeOf(person);
    const year = zonedParts(item.at, zone).year;
    const wages = yearOf(person, year);
    const represented = career.agencyId !== undefined;
    const managed = career.managerId !== undefined;
    // The days the period covers: SAG-AFTRA's through the Saturday before the Thursday, Equity's through the Friday; a last check, all.
    const cutoff = item.payload.final === true ? Number.POSITIVE_INFINITY : role.union === 'sag' ? item.at - 4 * MS_DAY : item.at;
    const from = booking.worked - booking.owed;
    const calls = workDays(booking).slice(from, booking.worked).filter((c) => c.at <= cutoff);
    const extras = (booking.travelOwed ?? 0) + (booking.perDiemOwed ?? 0);
    if (!calls.length && !extras) return;
    // A day's scale on screen; on stage, each week's, a sixth for each of its six days.
    const lines = new Map<number, { rehearsal: boolean; days: number }>();
    for (const c of calls) lines.set(c.week, { rehearsal: c.rehearsal, days: (lines.get(c.week)?.days ?? 0) + 1 });
    if (!lines.size) lines.set(-1, { rehearsal: false, days: 0 });
    const postings: { accountId: string; amount: Money }[] = [];
    let net = 0;
    let gross = 0;
    // Travel days are paid as days' work, with the first line.
    let overtime = (booking.overtimeDays ?? []).slice(from, from + calls.length).reduce((sum, o) => sum + (o ?? 0), 0) + (booking.travelOwed ?? 0);
    booking.travelOwed = 0;
    for (const [week, line] of lines) {
      const rate = unitRate(booking, item.at, cur);
      // A series regular's episodes, spread over the season's workweeks.
      const scale = role.series ? Math.round((rate * role.series.episodes * line.days) / (role.series.weeks * 5)) : role.medium !== 'stage' ? rate * line.days : Math.round((rate * line.days) / 6);
      // Abroad, US tax is withheld as at home, and the country takes its own (`ABROAD`).
      const check = paycheck({ scale: Math.round(scale * arcUplift(booking, week)), overtime, role, rehearsal: line.rehearsal, represented, managed, before: wages.acting, cityId: taxCity, at: item.at });
      overtime = 0;
      const foreign = foreignWithholding(person, workCity, check.gross, item.at, cur, { id: booking.id, expected: expectedGross(booking, item.at, cur) });
      recordWages(person, item.at, zone, { gross: check.gross, withheld: check.withheld, commission: check.commission, dues: check.dues, sag: role.union === 'sag', employer: booking.id, where: workCity, foreignWithheld: foreign });
      check.net -= foreign;
      if (foreign) postings.push({ accountId: s.nominalAccount('expense', 'Foreign Tax Withheld').id, amount: foreign });
      gross += check.gross;
      net += check.net;
      if (check.agent) postings.push({ accountId: s.nominalAccount('expense', 'Agent Commission').id, amount: check.agent });
      if (check.manager) postings.push({ accountId: s.nominalAccount('expense', 'Manager Commission').id, amount: check.manager });
      if (check.dues) postings.push({ accountId: s.nominalAccount('expense', 'Union Dues').id, amount: check.dues });
      if (check.withheld) postings.push({ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: check.withheld });
    }
    booking.owed -= calls.length;
    // A joining fee still owed comes out of the check.
    const toUnion = Math.min(net, careerOf(person).unions.owed ?? 0);
    if (toUnion > 0) {
      net -= toUnion;
      careerOf(person).unions.owed! -= toUnion;
      yearOf(person, zonedParts(item.at, zone).year).dues += toUnion;
      postings.push({ accountId: s.nominalAccount('expense', 'Union Dues').id, amount: toUnion });
    }
    // The meal allowance isn't wages: it's paid beside them, untaxed.
    const perDiem = booking.perDiemOwed ?? 0;
    booking.perDiemOwed = 0;
    if (perDiem) postings.push({ accountId: s.nominalAccount('income', 'Per Diem').id, amount: -perDiem });
    s.post({
      memo: `${role.label}: ${calls.length} ${calls.length === 1 ? 'day' : 'days'}${perDiem ? ', with the meal allowance' : ''}`, category: 'salary',
      postings: [{ accountId: account.id, amount: net + perDiem }, { accountId: s.nominalAccount('income', 'Acting').id, amount: -gross }, ...postings],
    });
  });

  sim.onCommand<{ agencyId: string; cityId: string }, { agencyId: string }>('career.sign', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    const offer = career.offers.find((o) => o.agencyId === p.agencyId && o.cityId === p.cityId && o.until > s.now);
    if (!offer) throw new CommandError('That agency hasn’t an offer standing.');
    if (career.agencyId) throw new CommandError(`You’re with ${agencyById(career.agencyId)!.name}.`);
    represent(s, person, offer);
    return { agencyId: p.agencyId };
  });

  sim.onCommand<{ managerId: string }, { managerId: string }>('career.sign_manager', (p, { sim: s }) => {
    const career = careerOf(s.player);
    if (career.managerId) throw new CommandError(`${managerById(career.managerId)!.name} manages you.`);
    if (!career.managerOffers.some((o) => o.managerId === p.managerId && o.until > s.now)) throw new CommandError('That firm hasn’t an offer standing.');
    career.managerId = p.managerId;
    career.managerSince = s.now;
    career.managerOffers = [];
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'management' && !d.resolvedAt) d.resolvedAt = s.now;
    return { managerId: p.managerId };
  });

  sim.onCommand<Record<string, never>, { left: string }>('career.leave_manager', (_p, { sim: s }) => {
    const career = careerOf(s.player);
    if (!career.managerId || career.managerSince === undefined) throw new CommandError('You have no manager.');
    if (s.now - career.managerSince < MANAGEMENT.minimumDays * MS_DAY) throw new CommandError(`The contract runs a year from ${formatDate(career.managerSince, s.zone)}.`);
    const name = managerById(career.managerId)!.name;
    delete career.managerId;
    delete career.managerSince;
    return { left: name };
  });

  sim.onSchedule(RESIDUAL_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const residual = careerOf(person).residuals.find((r) => r.id === item.payload.residualId);
    if (!residual) return;
    payResidual(s, person, residual, String(item.payload.stream) as Stream, Number(item.payload.n), item.at);
  });

  sim.onCommand<Record<string, never>, { left: string }>('career.leave', (_p, { sim: s }) => {
    const person = s.player;
    const may = mayLeave(s, person);
    if (!may.ok) throw new CommandError(may.why);
    const name = agencyById(careerOf(person).agencyId!)!.name;
    endRepresentation(s, person, may.why, true);
    return { left: name };
  });

  sim.onCommand<{ bookingId: string }, { starts: Instant }>('career.accept', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    const booking = career.bookings.find((b) => b.id === p.bookingId);
    if (!booking || booking.status !== 'offered') throw new CommandError('That offer isn’t open.');
    const summer = career.since === undefined ? summerOf(person, s.now) : undefined;
    if (career.since === undefined) {
      const days = workDays(booking);
      if (!summer || days[days.length - 1]!.at >= summer.until) throw new CommandError('It runs into the fall term, and the school’s work comes first while classes are in session.');
    }
    takeJob(s, person, booking, false);
    return { starts: booking.starts };
  });

  sim.onSchedule(STAY_KIND, (item, s) => {
    const person = personOf(item);
    const booking = person ? careerOf(person).bookings.find((b) => b.id === item.payload.bookingId) : undefined;
    if (!person || !booking) return;
    const city = workCityOf(booking);
    if (item.payload.direction === 'out') {
      if (booking.status !== 'accepted') return;
      // A room, sublet for the nights: the town's room rent by the night, SLATE's estimate of what it costs.
      const cur = saveCurrency(s.universe);
      const nights = Math.max(1, Math.round((Number(item.payload.back) - item.at) / MS_DAY));
      const cost = Math.round((rentAt(city, cur).room * nights) / 30.44);
      // A cost of the work, on the return with the rest, from the bank or on
      // the card. With neither, a friend's sofa for the run. Until 2026-09-27
      // it was taken whether or not the bank could pay, and the room was free.
      const paid = spend(s, person, cost, `A sublet in ${CITIES.require(city).name}, ${nights} nights`, 'career');
      if (paid) recordJobCost(person, s.now, cost);
      person.currentLocationId = city;
      s.universe.currentZone = zoneOf(city);
      if (isPlayer(person)) s.notify({ category: 'money', title: `In ${CITIES.require(city).name} For The Job`, body: paid ? `${roleById(booking.roleId).label}: a room sublet for ${nights} nights, ${formatMoney(cost, cur)}.` : `${roleById(booking.roleId).label}: a sublet for ${nights} nights is ${formatMoney(cost, cur)}, which neither the bank nor the card could cover, so it’s a friend’s sofa.`, importance: 55, route: '/workspace/career' });
      return;
    }
    // Home again however the job went, fired from it or not, where they're still there.
    const home = person.home?.cityId ?? person.currentLocationId;
    if (person.currentLocationId !== city) return;
    person.currentLocationId = home;
    s.universe.currentZone = zoneOf(home);
  });

  sim.onSchedule(TRAVEL_KIND, (item, s) => {
    const person = personOf(item);
    const booking = person ? careerOf(person).bookings.find((b) => b.id === item.payload.bookingId) : undefined;
    if (!person || !booking || !booking.location) return;
    // Out only to a job still on; home from one however it went. Until 2026-09-27 an actor fired on location was left there.
    if (item.payload.direction === 'out' ? booking.status !== 'accepted' : person.currentLocationId !== booking.location) return;
    const cur = saveCurrency(s.universe);
    const role = roleById(booking.roleId);
    const unit = unitRate(booking, item.at, cur);
    const day = role.series ? Math.round((unit * role.series.episodes) / (role.series.weeks * 5)) : unit;
    booking.travelOwed = (booking.travelOwed ?? 0) + day;
    if (item.payload.direction === 'out') {
      person.currentLocationId = booking.location;
      s.universe.currentZone = zoneOf(booking.location);
      if (isPlayer(person)) s.notify({ category: 'money', title: `On Location In ${CITIES.require(booking.location).name}`, body: `The production flew you out for ${role.label}, with a room of your own and a meal allowance each day.`, importance: 55, route: '/workspace/career' });
      return;
    }
    const home = person.home?.cityId ?? booking.cityId;
    const days = Math.round((item.at - Number(item.payload.outAt)) / MS_DAY) + 1;
    booking.perDiemOwed = (booking.perDiemOwed ?? 0) + days * usd(rateOn(LOCATION.perDiem, dayKey(item.at, zoneOf(booking.location))), cur);
    person.currentLocationId = home;
    s.universe.currentZone = zoneOf(home);
    schedulePay(s, person, booking, item.at + MS_HOUR, true);
  });

  sim.onSchedule(RENEWAL_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const career = careerOf(person);
    const prior = career.bookings.find((b) => b.id === item.payload.bookingId);
    delete career.option;
    if (!prior) return;
    const role = roleById(prior.roleId);
    const life = career.residuals.find((r) => r.bookingId === prior.id);
    const season = (prior.season ?? 1) + 1;
    const odds = life?.kind === 'network' ? SERIES.renewal.network : SERIES.renewal.svod;
    const picked = season <= SERIES.maxSeasons && renewed(s, person, prior.id, odds);
    if (!picked) {
      if (isPlayer(person)) s.notify({ category: 'money', title: 'Your Series Was Canceled', body: `${role.label}: the option wasn’t taken up. You’re free.`, importance: 80, route: '/workspace/career' });
      return;
    }
    const zone = zoneOf(workCityOf(prior));
    const rate = Math.round(rateOn(role.steps, dayKey(prior.starts, zone)) * (1 + SERIES.raise));
    const next: Booking = {
      id: nextOwnId(career, 'b'), roleId: role.id, cityId: prior.cityId, starts: nextMonday(prior.starts + SERIES.nextSeasonDays * MS_DAY - 3 * MS_DAY, zone),
      units: prior.units, rehearsalWeeks: 0, status: 'offered', dueAt: s.now, offeredAt: s.now, worked: 0, owed: 0, weeksPaid: 0,
      rate: Math.max(rate, prior.rate ? Math.round(prior.rate * (1 + SERIES.raise)) : 0), season, seriesId: prior.seriesId ?? prior.id,
      ...(prior.location ? { location: prior.location } : {}),
    };
    career.bookings.push(next);
    takeJob(s, person, next, true);
    if (isPlayer(person)) s.notify({ category: 'money', title: `Picked Up For Season ${season}`, body: `${role.label}: the option was taken up. The season starts ${formatDate(next.starts, zone)}, at ${formatMoney(usd(next.rate!, saveCurrency(s.universe)), saveCurrency(s.universe))} an episode.`, importance: 90, route: '/workspace/career' });
  });

  /**
   * A job taken: its union's membership, its days and paydays, and its
   * travel. A job clashing with one already taken is refused, unless this
   * one binds (a series' picked-up season), which releases the other. A
   * series regular's part is refused while another series holds an option.
   */
  function takeJob(s: Simulation, person: Person, booking: Booking, bound: boolean): void {
    const career = careerOf(person);
    const role = roleById(booking.roleId);
    if (!bound && role.series && career.option && career.option.seriesId !== (booking.seriesId ?? booking.id)) {
      throw new CommandError('Another series holds an option on you until it’s decided.');
    }
    const days = workDays(booking);
    const first = days[0]!.at - (booking.location ? MS_DAY : 0);
    const last = days[days.length - 1]!.at + (booking.location ? MS_DAY : 0);
    // Joined first, so a job taken by choice that the bank can't join for
    // releases nothing. One they're bound to, a season picked up, never
    // fails on the fee: the union takes it from the pay, as a payroll
    // deduction. Until 2026-09-27 the fee was asked after the clashing job
    // was released, and a pickup the bank couldn't join for lost both.
    joinFor(s, person, role, bound);
    for (const other of career.bookings) {
      if (other.status !== 'accepted' || other.id === booking.id) continue;
      const theirs = workDays(other);
      if (!(first <= theirs[theirs.length - 1]!.at && theirs[0]!.at <= last)) continue;
      if (!bound) throw new CommandError(`It clashes with ${roleById(other.roleId).label}.`);
      other.status = 'released';
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one.payload.bookingId === other.id && (one.kind === WORK_KIND || one.kind === TRAVEL_KIND)) s.timeline.cancel(one.id, s.now);
      if (other.owed > 0) schedulePay(s, person, other, s.now + 60_000, true);
      if (isPlayer(person)) s.notify({ category: 'money', title: 'Released For Your Series', body: `${roleById(other.roleId).label} clashed with the series’ new season, which has you first.`, importance: 75, route: '/workspace/career' });
    }
    booking.status = 'accepted';
    career.lastBookedAt = s.now;
    const workCity = workCityOf(booking);
    const zone = zoneOf(workCity);
    for (const d of days) {
      s.schedule({
        at: d.at, kind: WORK_KIND,
        label: role.medium === 'screen' ? `On Set: ${role.label}` : role.medium === 'voice' ? `In The Booth: ${role.label}` : `${d.rehearsal ? 'Rehearsal' : 'Performance'}: ${role.label}`,
        category: 'career', priority: 34, requiresPlayer: true,
        durationMinutes: role.medium === 'screen' ? 720 : role.medium === 'voice' ? (role.sessionHours ?? 4) * 60 : d.rehearsal ? 480 : 180,
        locationId: workCity, payload: { personId: person.id, bookingId: booking.id },
      });
    }
    if (booking.location) {
      const out = at(days[0]!.at, zone, -1, 12);
      s.schedule({ at: out, kind: TRAVEL_KIND, label: `Travel To ${CITIES.require(booking.location).name}`, category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'out' } });
      s.schedule({ at: at(days[days.length - 1]!.at, zone, 1, 12), kind: TRAVEL_KIND, label: 'Travel Home', category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'back', outAt: out } });
    }
    // A job in another city with no production travel: they go and stay, in a room of their own paying.
    const home = person.home?.cityId ?? person.currentLocationId;
    if (!booking.location && workCity !== home) {
      const out = at(days[0]!.at, zone, -1, 18);
      s.schedule({ at: out, kind: STAY_KIND, label: `To ${CITIES.require(workCity).name}`, category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'out', back: at(days[days.length - 1]!.at, zone, 1, 12) } });
      s.schedule({ at: at(days[days.length - 1]!.at, zone, 1, 12), kind: STAY_KIND, label: 'Home Again', category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'back' } });
    }
    // SAG-AFTRA pays on the Thursday after the week's Saturday; Equity, each Friday.
    const paydays = new Set<Instant>();
    for (const d of days) {
      const wd = weekday(d.at, zone);
      const toSaturday = (6 - wd + 7) % 7;
      paydays.add(role.union === 'sag' ? at(d.at, zone, toSaturday + 5, 17) : at(d.at, zone, (5 - wd + 7) % 7, 18));
    }
    for (const when of paydays) schedulePay(s, person, booking, when);
    closeDecision(s, booking.id);
  }

  sim.onCommand<{ bookingId: string }, { passed: true }>('career.pass', (p, { sim: s }) => {
    const booking = careerOf(s.player).bookings.find((b) => b.id === p.bookingId);
    if (!booking || booking.status !== 'offered') throw new CommandError('That offer isn’t open.');
    booking.status = 'passed';
    closeDecision(s, booking.id);
    return { passed: true };
  });

  sim.onCommand<Record<string, never>, { submitted: number }>('career.self_submit', (_p, { sim: s }) => {
    const career = careerOf(s.player);
    if (career.since === undefined && !summerOf(s.player, s.now)) throw new CommandError('While classes are in session, the school’s work comes first; submissions start in the summer, and for good when school ends.');
    const most = submissionsAWeek(career, s.now, workCity(s.player));
    if (career.submitted >= most) throw new CommandError(`You’ve made this week’s ${most} submissions.`);
    career.submitted += 1;
    return { submitted: career.submitted };
  });

  sim.onCommand<{ site: CastingSite; on: boolean }, { until: Instant; renews: boolean }>('career.subscribe', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    const site = WORK_COSTS.sites[p.site];
    if (!site) throw new CommandError('No such site.');
    const now = career.sites?.[p.site];
    if (p.on !== true) {
      if (!now || !onSite(career, p.site, s.now)) throw new CommandError(`You aren’t on ${site.label}.`);
      now.renews = false;
      return { until: now.until, renews: false };
    }
    if (onSite(career, p.site, s.now)) { now!.renews = true; return { until: now!.until, renews: true }; }
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(site.price, cur), `${site.label}, a year`)) throw new CommandError(`A year is ${formatMoney(usd(site.price, cur), cur)}, which the bank can’t cover.`);
    career.sites ??= {};
    career.sites[p.site] = { until: s.now + 365 * MS_DAY, renews: true };
    return { until: career.sites[p.site]!.until, renews: true };
  });

  sim.onCommand<Record<string, never>, { at: Instant }>('career.headshots', (_p, { sim: s }) => {
    const person = s.player;
    const cur = saveCurrency(s.universe);
    const cost = usd(WORK_COSTS.headshots - WORK_COSTS.prints, cur) + withSalesTax(person, s.now, usd(WORK_COSTS.prints, cur));
    if (!payForWork(s, person, cost, 'Headshots and prints')) throw new CommandError(`A session and prints come to ${formatMoney(cost, cur)}, which the bank can’t cover.`);
    careerOf(person).headshotsAt = s.now;
    return { at: s.now };
  });

  sim.onCommand<Record<string, never>, { at: Instant }>('career.reel', (_p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    // Footage: a screen credit, or the school's filmed monologues.
    if (!career.credits.some((c) => roleById(c.roleId).medium === 'screen') && !person.school?.filmed) throw new CommandError('A reel is cut from footage, and you have no screen credit yet.');
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.reel, cur), 'A reel, edited')) throw new CommandError(`An edit is ${formatMoney(usd(WORK_COSTS.reel, cur), cur)}, which the bank can’t cover.`);
    career.reelAt = s.now;
    return { at: s.now };
  });

  sim.onCommand<Record<string, never>, { kit: true }>('career.buy_kit', (_p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    if (career.kit) throw new CommandError('You have a kit.');
    const cur = saveCurrency(s.universe);
    const cost = withSalesTax(person, s.now, usd(WORK_COSTS.kit, cur));
    if (!payForWork(s, person, cost, 'A self-tape kit')) throw new CommandError(`A kit is ${formatMoney(cost, cur)} with the sales tax, which the bank can’t cover.`);
    career.kit = true;
    return { kit: true };
  });

  sim.onCommand<{ on: boolean }, { on: boolean }>('career.class', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    if (career.since === undefined) throw new CommandError('School is your class for now.');
    if (p.on !== true) {
      if (!career.scene) throw new CommandError('You aren’t in a class.');
      delete career.scene;
      return { on: false };
    }
    if (career.scene) throw new CommandError('You’re in a class.');
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.classMonthly, cur), 'Scene-study class, the month')) throw new CommandError(`A month is ${formatMoney(usd(WORK_COSTS.classMonthly, cur), cur)}, which the bank can’t cover.`);
    career.scene = { paidFor: monthOf(s.now, s.homeZone) };
    return { on: true };
  });

  sim.onCommand<{ auditionId: string }, { coached: true }>('career.coach', (p, { sim: s }) => {
    const person = s.player;
    const audition = careerOf(person).auditions.find((a) => a.id === p.auditionId);
    if (!audition || audition.status !== 'ahead') throw new CommandError('That audition isn’t ahead.');
    if (audition.coached) throw new CommandError('You’ve worked on it already.');
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.coach, cur), `A coach, for ${roleById(audition.roleId).label}`)) throw new CommandError(`An hour is ${formatMoney(usd(WORK_COSTS.coach, cur), cur)}, which the bank can’t cover.`);
    audition.coached = true;
    return { coached: true };
  });

  sim.onCommand<{ cityId: string; kind: Housing }, { cityId: string }>('career.relocate', (p, { sim: s }) => {
    const person = s.player;
    if (![...CAREER_CITIES, YALE_DRAMA.cityId].includes(p.cityId as CareerCity)) throw new CommandError('New York, Los Angeles or New Haven.');
    if (person.currentLocationId === p.cityId && person.home?.cityId === p.cityId && person.home.kind === p.kind) throw new CommandError('You live there already.');
    person.currentLocationId = p.cityId;
    s.universe.currentZone = zoneOf(p.cityId);
    // A move the bank can't pay for throws, and the command's rollback puts them back where they were.
    move(s, person, p.kind);
    return { cityId: p.cityId };
  });

  /** A union's membership where a job needs it: SAG-AFTRA's after thirty days eligible, Equity's on the first contract. */
  function joinFor(s: Simulation, person: Person, role: Role, bound = false): void {
    const career = careerOf(person);
    const cur = saveCurrency(s.universe);
    const pay = (fee: Money, memo: string, why: string) => {
      if (payFromCurrent(s, person, fee, memo, 'dues')) return;
      if (!bound) throw new CommandError(why);
      career.unions.owed = (career.unions.owed ?? 0) + fee;
    };
    if (role.union === 'sag') {
      const sag = career.unions.sag;
      if (!sag) { career.unions.sag = { eligibleAt: s.now }; return; }
      if (sag.joinedAt !== undefined || s.now - sag.eligibleAt < SAG_AFTRA.taftHartleyDays * MS_DAY) return;
      const fee = usd(SAG_AFTRA.initiation + Math.round(SAG_AFTRA.basicDues / 2), cur);
      pay(fee, 'SAG-AFTRA initiation fee and dues', `Working under SAG-AFTRA again means joining, for ${formatMoney(fee, cur)}, which the bank can’t cover.`);
      sag.joinedAt = s.now;
    } else if (!career.unions.equity) {
      const fee = usd(EQUITY.initiationNow + Math.round(EQUITY.basicDues / 2), cur);
      pay(fee, 'Actors’ Equity initiation fee and dues', `An Equity contract makes you a member, for ${formatMoney(fee, cur)} now, which the bank can’t cover.`);
      career.unions.equity = { joinedAt: s.now, initiationPaid: EQUITY.initiationNow };
    }
  }
}

function schedulePay(sim: Simulation, person: Person, booking: Booking, when: Instant, final = false): void {
  sim.schedule({ at: when, kind: PAY_KIND, label: `Paid: ${roleById(booking.roleId).label}`, category: 'career', priority: 20, payload: { personId: person.id, bookingId: booking.id, ...(final ? { final } : {}) } });
}

function closeDecision(sim: Simulation, bookingId: string): void {
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'booking' && d.refId === bookingId && !d.resolvedAt) d.resolvedAt = sim.now;
}

/**
 * The unions' bills each May and November: half a year's basic dues each;
 * in May, SAG-AFTRA's work dues on the prior year's covered earnings, and
 * the next $600 of Equity's initiation fee once a year has passed since the
 * last.
 */
export function billDues(sim: Simulation, person: Person, year: number, month: number): Money {
  const career = careerOf(person);
  const period = `${year}-${month}`;
  if (career.duesBilled === period) return 0;
  career.duesBilled = period;
  const cur = saveCurrency(sim.universe);
  let total = 0;
  const sag = career.unions.sag;
  if (sag?.joinedAt !== undefined) {
    total += usd(Math.round(SAG_AFTRA.basicDues / 2), cur);
    if (month === 5) total += Math.round(Math.min(yearOf(person, year - 1).sag, usd(SAG_AFTRA.workDuesCap, cur)) * SAG_AFTRA.workDues);
  }
  const equity = career.unions.equity;
  if (equity) {
    total += usd(Math.round(EQUITY.basicDues / 2), cur);
    const installments = equity.initiationPaid / EQUITY.initiationNow;
    if (month === 5 && equity.initiationPaid < EQUITY.initiation && sim.now - equity.joinedAt >= installments * 365 * MS_DAY - 30 * MS_DAY) {
      total += usd(EQUITY.initiationNow, cur);
      equity.initiationPaid += EQUITY.initiationNow;
    }
  }
  // Paid, they're on the year's return; bounced, they're owed, and the next
  // check pays them. Until 2026-09-27 dues the bank couldn't cover were taken
  // as paid, and deducted on the return.
  if (total > 0) {
    if (payFromCurrent(sim, person, total, 'Union dues', 'dues')) yearOf(person, year).dues += total;
    else career.unions.owed = (career.unions.owed ?? 0) + total;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Residuals
// ---------------------------------------------------------------------------

type Stream = 'rerun' | 'syndication' | 'svod' | 'bonus' | 'film' | 'cycle';

/**
 * A finished job's life after (`career.residuals`): a television episode on
 * a network or a streaming service of a size, with or without a prime-time
 * rerun, a syndication sale or a hit's bonus; a film by its budget. Its
 * payments go on the calendar as they fall due.
 */
export function afterlife(sim: Simulation, person: Person, booking: Booking, when: Instant): Residual | undefined {
  const role = roleById(booking.roleId);
  if (!role.after) return undefined;
  const career = careerOf(person);
  const rng = sim.rng('career.residuals', person.id, booking.id);
  const cur = saveCurrency(sim.universe);
  const unit = rateOf(role, when, booking.cityId, cur);
  const episodes = role.series ? role.series.episodes : 1;
  const perEpisode = role.series ? unit : unit * booking.units;
  const base = { id: nextOwnId(career, 'r'), bookingId: booking.id, roleId: role.id, perEpisode, episodes, days: booking.worked, paid: 0, payments: 0, workCity: workCityOf(booking) };
  let residual: Residual;
  if (role.after.kind === 'film') {
    residual = { ...base, kind: 'film', airsAt: when };
  } else if (role.after.kind === 'commercial') {
    // The session fee covers the first cycle; how many more it runs, where, and how often (SLATE's estimate).
    let x = rng.next();
    let more = 0;
    for (const [n, share] of COMMERCIAL_RUN.moreCycles.entries()) { if (x < share) { more = n; break; } x -= share; }
    const plan: ('network' | 'cable' | 'wild')[] = [];
    const uses: number[] = [];
    for (let n = 0; n < more; n += 1) {
      const y = rng.next();
      plan.push(y < COMMERCIAL_RUN.network ? 'network' : y < COMMERCIAL_RUN.network + COMMERCIAL_RUN.cable ? 'cable' : 'wild');
      uses.push(COMMERCIAL_RUN.uses[0] + Math.floor(rng.next() * (COMMERCIAL_RUN.uses[1] - COMMERCIAL_RUN.uses[0] + 1)));
    }
    residual = { ...base, perEpisode: unit, kind: 'commercial', airsAt: when, plan, uses };
  } else {
    const network = rng.next() < AFTERLIFE.network;
    const x = rng.next();
    const size = x < AFTERLIFE.svodSize.small ? 'small' : x < AFTERLIFE.svodSize.small + AFTERLIFE.svodSize.middle ? 'middle' : 'large';
    residual = {
      ...base, kind: network ? 'network' : 'svod', airsAt: when + AFTERLIFE.airsAfterDays * MS_DAY,
      ...(network ? { rerun: rng.next() < AFTERLIFE.rerun, syndicated: rng.next() < AFTERLIFE.syndicated } : { size, hit: rng.next() < AFTERLIFE.successBonus }),
    } as Residual;
  }
  career.residuals.push(residual);
  const due = (stream: Stream, n: number, at: Instant) => sim.schedule({
    at, kind: RESIDUAL_KIND, label: `Residuals: ${role.label}`, category: 'career', priority: 20, payload: { personId: person.id, residualId: residual.id, stream, n },
  });
  if (residual.kind === 'film') due('film', 1, when + 365 * MS_DAY);
  else if (residual.kind === 'commercial') {
    // Each cycle's fees at its end.
    for (let n = 2; n <= 1 + (residual.plan?.length ?? 0); n += 1) due('cycle', n, when + n * COMMERCIAL_USE.cycleDays * MS_DAY);
  }
  else if (residual.kind === 'network') {
    // Paid within 30 days of the telecast: SLATE pays on the thirtieth.
    if (residual.rerun) due('rerun', 2, residual.airsAt + (AFTERLIFE.rerunAfterDays + 30) * MS_DAY);
    if (residual.syndicated) due('syndication', residual.rerun ? 3 : 2, residual.airsAt + 2 * 365 * MS_DAY);
  } else {
    const yearOne = residual.airsAt + 90 * MS_DAY;
    due('svod', 1, afterQuarter(yearOne, sim.homeZone));
    if (residual.hit) due('bonus', 1, afterQuarter(yearOne, sim.homeZone));
  }
  return residual;
}

/** Sixty days after the end of the quarter a moment is in. */
function afterQuarter(when: Instant, zone: string): Instant {
  const p = zonedParts(when, zone);
  const endMonth = Math.ceil(p.month / 3) * 3;
  return instantFromZoned({ ...normalDate(p.year, endMonth + 1, 1), hour: 10 }, zone) + 59 * MS_DAY;
}

/** What a payment of a residual comes to, by its stream and its number. */
export function residualAmount(residual: Residual, stream: Stream, n: number, when: Instant, zone: string, into: string): Money {
  const role = roleById(residual.roleId);
  const length = role.after?.kind === 'tv' ? role.after.length : 'hour';
  const day = dayKey(when, zone);
  if (stream === 'cycle') {
    // A cycle's use, or the holding fee, the session fee, whichever is more.
    const voice = role.after?.kind === 'commercial' && role.after.voice;
    const where = residual.plan?.[n - 2] ?? 'wild';
    let use: number;
    if (where === 'network') {
      const [first, second, third, later] = COMMERCIAL_USE.classA[voice ? 'voice' : 'camera'];
      const airings = residual.uses?.[n - 2] ?? 13;
      use = first + (airings >= 2 ? second : 0) + Math.max(0, Math.min(airings, 13) - 2) * third + Math.max(0, airings - 13) * later;
      use = Math.min(use, COMMERCIAL_USE.cap[voice ? 'voice' : 'camera']);
    } else use = COMMERCIAL_USE[where][voice ? 'voice' : 'camera'];
    return Math.max(residual.perEpisode, usd(use, into));
  }
  if (stream === 'rerun') return Math.min(residual.perEpisode, usd(RESIDUALS.networkCeiling[length], into)) * residual.episodes;
  if (stream === 'syndication') return Math.round(residual.perEpisode * (RESIDUALS.syndication[n] ?? RESIDUALS.syndicationLater)) * residual.episodes;
  if (stream === 'svod' || stream === 'bonus') {
    const ceiling = usd(rateOn(RESIDUALS.svodCeiling[length], day), into);
    const year = Math.round(Math.min(residual.perEpisode, ceiling) * (RESIDUALS.svodYears[n - 1] ?? RESIDUALS.svodLater) * RESIDUALS.svodSubscribers[residual.size ?? 'large']) * residual.episodes;
    return stream === 'bonus' ? Math.round(year * RESIDUALS.successBonus * RESIDUALS.successBonusShare) : year;
  }
  // A film: the cast's 3.6% of the distributor's year, shared by units.
  const film = role.after?.kind === 'film' ? role.after.budget : 0;
  const gross = usd(film, into) * AFTERLIFE.filmFirstYear * AFTERLIFE.filmDecay ** (n - 1);
  const time = Math.min(5, residual.days / 5);
  const units = time + Math.min(10, time);
  return Math.round((gross * RESIDUALS.filmPool * units) / AFTERLIFE.castUnits);
}

function payResidual(sim: Simulation, person: Person, residual: Residual, stream: Stream, n: number, when: Instant): void {
  const account = bankAccount(sim, person);
  const cur = saveCurrency(sim.universe);
  const zone = sim.homeZone;
  const amount = residualAmount(residual, stream, n, when, zone, cur);
  const role = roleById(residual.roleId);
  const next = (at: Instant) => sim.schedule({ at, kind: RESIDUAL_KIND, label: `Residuals: ${role.label}`, category: 'career', priority: 20, payload: { personId: person.id, residualId: residual.id, stream, n: n + 1 } });
  // The streams that go on: syndication and streaming each year, a film's while it earns a dollar.
  if (stream === 'syndication' && n < 20) next(when + 365 * MS_DAY);
  if (stream === 'svod' && n < 20) next(when + 365 * MS_DAY);
  if (stream === 'film' && amount >= 1_00 && n < 20) next(when + 365 * MS_DAY);
  if (!account || amount <= 0) return;
  // Wages, with tax withheld as a paycheck's. An agency commissions a commercial's use fees, not television's residuals.
  const year = zonedParts(when, zone).year;
  const before = yearOf(person, year).acting;
  const withheld = computeAnnualTax(before + amount, homeOf(person), when).total - computeAnnualTax(before, homeOf(person), when).total;
  const commission = stream === 'cycle' && person.career?.agencyId ? Math.round(amount * AGENT_COMMISSION.rate) : 0;
  // Canada taxes residuals from work done there, at the same 23%.
  const foreign = residual.workCity && CITIES.get(residual.workCity)?.countryId === 'ca' ? foreignWithholding(person, residual.workCity, amount, when, cur) : 0;
  recordWages(person, when, zone, { gross: amount, withheld, commission, sag: true, residual: true, ...(foreign || residual.workCity ? { where: residual.workCity, foreignWithheld: foreign } : {}) });
  residual.paid += amount;
  residual.payments += 1;
  const what = { cycle: `the commercial’s cycle ${n}`, rerun: 'a prime-time rerun', syndication: `syndicated run ${n}`, svod: `streaming, year ${n}`, bonus: 'streaming’s success bonus', film: `the film’s year ${n}` }[stream];
  sim.post({
    memo: `Residuals, ${role.label}: ${what}`, category: 'salary',
    postings: [
      { accountId: account.id, amount: amount - withheld - commission - foreign },
      ...(foreign ? [{ accountId: sim.nominalAccount('expense', 'Foreign Tax Withheld').id, amount: foreign }] : []),
      { accountId: sim.nominalAccount('income', 'Residuals').id, amount: -amount },
      ...(withheld ? [{ accountId: sim.nominalAccount('expense', 'Tax Withheld').id, amount: withheld }] : []),
      ...(commission ? [{ accountId: sim.nominalAccount('expense', 'Agent Commission').id, amount: commission }] : []),
    ],
  });
}
