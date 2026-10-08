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
 *   while unrepresented can bring an agency's call. From 2026-10-06 the
 *   week's breakdowns are browsed, each part with its genre and what it asks,
 *   and a submission is for the one chosen (`breakdownsOf`); until then the
 *   part was picked when the submission came back.
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
 *   on the production's ticket on the flight that lands in good time, and
 *   home on the first after, there only when it lands (`careerTrip`, from
 *   2026-09-29; until then the actor was there in an instant); travel days
 *   paid, a day's meal allowance, and the wages taxed where the work was
 *   done. A job in another city with no production travel is reached on the
 *   actor's own fare, a cost of the work.
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
import { VO_BOOTHS, VO_SESSION_MINUTES } from '../content/specialrooms';
import { plural } from '../core/text';
import type { ScheduledItem } from '../core/scheduler';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, MS_HOUR, formatDate, formatDateTime, formatTime, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { occupiedAt } from './life';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax, salesTaxRate } from '../content/tax';
import {
  ACTRA, AFTERLIFE, AGENCIES, ANDA, AGENT_COMMISSION, AUDITION_READ, PART_DEMANDS, PRODUCTS, CALLS, GENRE_READS, MEMORIZE, CAREER_CITIES, GENRES, WORK_COSTS, MEAL_PENALTY, RECURRING, COMMERCIAL_RUN, COMMERCIAL_USE, EQUITY, LOCATION, MANAGEMENT, MANAGERS, OVERTIME, RESIDUALS, ROLES, SAG_AFTRA, SERIES, SHOWCASE_2029, rateOn,
  type Agency, type CareerCity, type Manager, type RateSteps, type Role,
  partsForAge,
} from '../content/career';
import { earningsOf, homeOf, recordJobCost, recordWages, ukTaxYear, yearOf } from './earnings';
import { ABROAD } from '../content/safetynet';
import { armHealth, inHospital } from './health';
import { armTaxes, canadaElected } from './taxreturn';
import { YALE_DRAMA } from '../content/school';
import { BONDS, actingOf, ceilingOf, grow, focusOf, summerOf, type Craft } from './school';
import type { Band } from './coursework';
import { footageOf, footageRefusal, reelBand, reelCallback, type Footage } from './footage';
import { rentAt } from '../content/rents';
import { CRAFTS_AT, enjoyCrafts, enjoyWork, takeTheRoom, feel } from './enjoyment';
import { ATTRIBUTES, attributesOf, classmatePresence, earn, fadeRecognition, nerves, nudge, overscaleOf, presenceSwing, sendsFactor } from './attributes';
import { personalityOf } from './personality';
import { armPension } from './pension';
import { chanceOver, laidUp, mayHurt } from './injury';
import { INJURY } from '../content/injury';
import { exerts } from './body';
import { BODY } from '../content/body';

/** Genres whose work fights or dances whatever the part asks (`GENRE_READS`): action and the musical. */
const DEMANDING_GENRES: ReadonlySet<string> = new Set(['action', 'musical']);
import { commercialTermEnds, recordCommercialPay, scheduleCommercialWeek, type CommercialRep } from './commercial';
import { RIVALS, classMonth, classmateBooked, inTheRoom, metInTheRoom, partTaken, report, reportBooking, signTheClass, workedWith, type NewsItem } from './rivals';
import { makeProduction, playerReplaced, productionOf, workedDay } from './companies';
import { move, payFromCurrent, type Housing, spend, payFromBank } from './household';
import { emptyHomeIn, livingIn, moveIntoOwned } from './homes';
import { crossingRefusal, isoOfCity, isoOfCountry, residenceRefusal } from './documents';
import { careerTrip, planBy, planJourney, startCareerJourney } from './journey';
import { contribute as contributeImss } from './imss';
import { permitAtTheBorder, workRefusal } from './permission';
import { atHome, drawRental } from './dwelling';
import { inSaveMoney } from './banking';
import { payeeAccount } from './cash';
import { cppOnCheck } from './capensions';
import { eiOnCheck } from './eiself';
import { citizenOf } from './documents';
import { moveTo } from './luggage';
import { metAtWork } from './people';
import { marriedRelief } from './marriage';
import { sagHoliday } from '../content/usholidays';

export const SHOWCASE_KIND = 'career.showcase';
export const DUES_KIND = 'career.dues';
export const CAREER_WEEK_KIND = 'career.week';
export const IMPROV_KIND = 'career.improv';
export const WORKSHOP_KIND = 'career.workshop';

/**
 * A casting director workshop where you work, at a named venue's own price,
 * from 2026-10-03 (`research-casting-therapy-hotels-cars.json`): the Actors'
 * Guild of Great Britain's £42 for three hours in London, the Gaiety School
 * of Acting's €120 in Dublin, Actorvan Studios' C$295 in Vancouver,
 * Armstrong Acting Studios' C$95.99 in Toronto, Actors Comedy Studio's $150
 * master class for Los Angeles, and Actors Connection's $59 seminar in New
 * York, read secondhand. Elsewhere SLATE's estimate, as before. The office
 * met is one of the town's real casting offices, kept as a casting contact
 * (identification, not a promise: no rate of call-ins from a workshop is
 * published, and the recognition it earns is the same as before).
 */
export const WORKSHOPS: Readonly<Record<string, { venue: string; price: number; currency: string; confirmed: boolean }>> = {
  'uk-eng-london': { venue: 'The Actors’ Guild of Great Britain', price: 42, currency: 'GBP', confirmed: true },
  'ie-lei-dublin': { venue: 'The Gaiety School of Acting', price: 120, currency: 'EUR', confirmed: true },
  'ca-bc-vancouver': { venue: 'Actorvan Studios', price: 295, currency: 'CAD', confirmed: true },
  'ca-on-toronto': { venue: 'Armstrong Acting Studios', price: 95.99, currency: 'CAD', confirmed: true },
  'us-ca-losangeles': { venue: 'Actors Comedy Studio', price: 150, currency: 'USD', confirmed: true },
  'us-ny-newyork': { venue: 'Actors Connection', price: 59, currency: 'USD', confirmed: false },
};
export const CASTING_OFFICES: Readonly<Record<string, readonly string[]>> = {
  'us-ny-newyork': ['The Telsey Office', 'Tara Rubin Casting', 'Avy Kaufman Casting'],
  'us-ca-losangeles': ['Francine Maisler Casting', 'The Sarah Finn Company', 'Allison Jones Casting'],
  'uk-eng-london': ['Nina Gold Casting', 'Shaheen Baig Casting', 'Lucy Bevan Casting'],
  'ie-lei-dublin': ['Louise Kiely Casting', 'Amy Rowan Casting', 'Gillian Reynolds Casting'],
  'ca-on-toronto': ['Lewis Kay Casting', 'Deirdre Bowen Casting', 'Robin D. Cook Casting'],
  'ca-bc-vancouver': ['Clark & Page Casting', 'Mayrs/Brandstatter Casting', 'Kris & Kara Casting'],
  'mx-cmx-mexicocity': ['Luis Rosales', 'Manuel Teil', 'Viridiana Olvera'],
};
/** A workshop's price where you work, in the save's money, and its venue. */
export function workshopPrice(sim: Simulation, cityId: string): { price: Money; venue?: string } {
  const w = WORKSHOPS[cityId];
  const cur = saveCurrency(sim.universe);
  if (!w) return { price: usd(WORK_COSTS.workshop, cur) };
  const cents = Math.round(w.price * 100);
  return { price: cur === w.currency ? cents : exchange(cents, w.currency, cur) ?? cents, venue: w.venue };
}
export const FESTIVAL_KIND = 'career.festival';
export const PRESS_KIND = 'career.press';

/**
 * A press day before a studio film opens or a series airs (Stage 13 of
 * `docs/BACKLOG.md`, from 2026-10-01; `research-career-depth.json`). A
 * weekly performer, a studio film's or a series regular's, does the press
 * the distributor asks, unpaid but for expenses, as their contracts and
 * Equity's and Irish Equity's agreements say; a day performer has no such
 * obligation (SAG-AFTRA Schedule A), and is asked to none. ACTRA asks four
 * hours at least, taken as the day's length everywhere; a week before the
 * opening, SLATE's estimate. Kept, it's in the trades and lifts
 * recognition as a trade item does (`report`).
 */
export const PRESS = { daysBefore: 7, minutes: 240, hour: 10 } as const;

export function schedulePress(sim: Simulation, person: Person, role: Role, opens: Instant, cityId: string): void {
  const zone = zoneOf(cityId);
  const p = zonedParts(opens - PRESS.daysBefore * MS_DAY, zone);
  const when = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: PRESS.hour }, zone);
  if (when <= sim.now) return;
  sim.schedule({ at: when, kind: PRESS_KIND, label: `Press Day: ${role.label}`, category: 'career', priority: 30, requiresPlayer: true, durationMinutes: PRESS.minutes, locationId: cityId, payload: { personId: person.id, roleId: role.id, cityId } });
}
export const AIRS_KIND = 'career.airs';

/**
 * A finished independent film's road, SLATE's estimate: Tribeca programs a
 * hundred or so features a year from thousands submitted, and takes one in
 * five of a finished SAG-AFTRA film with a trained cast; half the rest play
 * a smaller festival, the Brooklyn Film Festival in June; the others go
 * straight to streaming. What each is worth in recognition, of the part's
 * own (`recognitionFrom`): the festival whole, Brooklyn half, streaming six
 * tenths. And television's, by its audience when it airs: a network a fifth
 * more, a streaming service by its size, a hit twice. Until 2026-09-28 every
 * film premiered at Tribeca and every part's recognition came the day it
 * wrapped, however many saw it.
 */
export const FILM_ROAD = {
  tribeca: 0.2, brooklyn: 0.5,
  worth: { tribeca: 1, brooklyn: 0.5, streaming: 0.6 },
  audience: { network: 1.2, small: 0.5, middle: 1, large: 1.5, hit: 2 },
} as const;
export const AUDITION_KIND = 'career.audition';
export const OFFER_KIND = 'career.offer';
export const STAY_KIND = 'career.stay';
export const LAPSE_KIND = 'career.lapse';
export const WORK_KIND = 'career.work';
export const PAY_KIND = 'career.pay';
export const RESIDUAL_KIND = 'career.residual';
export const TRAVEL_KIND = 'career.travel';
export const RENEWAL_KIND = 'career.renewal';
export const AGENCY_TERM_KIND = 'career.agency_term';
export const FITTING_KIND = 'career.fitting';

/**
 * A wardrobe fitting before screen work, the day before the first call, in
 * the actor's own town (one flown to a location is fitted there, on the
 * first day), and what each union pays for one (`research-career-depth.json`):
 * - SAG-AFTRA: a fitting on an earlier day is an hour's pay at least, at the
 *   day rate over eight hours (CBA Schedule A §16.A), unless the day rate is
 *   over $1,500, or $1,700 on contracts from 1 July 2026, when none is owed.
 *   A series regular's weekly contract gives the producer four free hours
 *   (Schedule B §20), so none is owed them either.
 * - ACTRA: a two-hour minimum at its fitting rate, CA$116.50 an hour from
 *   2025, CA$121.25 from 2026, CA$125.50 from 2027.
 * - Equity UK, under Pact: half a day's pay up to five hours, capped at
 *   £161 (2024-25, the latest confirmed).
 * - Irish Equity: €50 a session.
 * A fitting takes an hour, the minimum SAG-AFTRA pays, and ACTRA's two:
 * SLATE's reading, since no figure for a fitting's length was found. Stage
 * fittings and Mexico's aren't researched, so none is booked.
 */
export const FITTING = {
  sagCap: [['2025-07-01', 1_500_00], ['2026-07-01', 1_700_00]] as RateSteps,
  actraHour: [['2025-01-01', 116_50], ['2026-01-01', 121_25], ['2027-01-01', 125_50]] as RateSteps,
  actraHours: 2,
  equityUkCap: 161_00,
  irishSession: 50_00,
} as const;

/** What a fitting pays for a booking, in the save's money, cents; and how many minutes it takes. Nothing where the union pays none or none is booked. */
export function fittingFor(booking: Booking, when: Instant, into: string): { pay: Money; minutes: number } | undefined {
  const role = roleById(booking.roleId);
  if (role.medium !== 'screen') return undefined;
  const day = dayKey(when, zoneOf(workCityOf(booking)));
  const rate = unitRate(booking, when, into);
  if (role.union === 'sag') {
    if (role.series || rate > usd(rateOn(FITTING.sagCap, day), into)) return { pay: 0, minutes: 60 };
    return { pay: Math.round(rate / 8), minutes: 60 };
  }
  if (role.union === 'actra') return { pay: Math.round(inMoney(rateOn(FITTING.actraHour, day) * FITTING.actraHours, ACTRA.currency, into)), minutes: 120 };
  if (role.union === 'equity-uk') return { pay: Math.min(Math.round(rate / 2), Math.round(inMoney(FITTING.equityUkCap, 'GBP', into))), minutes: 60 };
  if (role.union === 'irish-equity') return { pay: Math.round(inMoney(FITTING.irishSession, 'EUR', into)), minutes: 60 };
  return undefined;
}

/** Books the fitting the day before the first call, at two in the afternoon, where it's in their own town and still to come. */
function scheduleFitting(sim: Simulation, person: Person, booking: Booking, firstCall: Instant): void {
  if (booking.location) return;
  const city = workCityOf(booking);
  if (city !== (person.home?.cityId ?? person.currentLocationId)) return;
  const fit = fittingFor(booking, firstCall, saveCurrency(sim.universe));
  if (!fit) return;
  const when = at(firstCall, zoneOf(city), -1, 14);
  if (when <= sim.now) return;
  sim.schedule({ at: when, kind: FITTING_KIND, label: `Wardrobe Fitting: ${roleById(booking.roleId).label}`, category: 'career', priority: 34, requiresPlayer: true, durationMinutes: fit.minutes, locationId: city, payload: { personId: person.id, bookingId: booking.id } });
}

/** SLATE's estimates of what the business doesn't publish, each named where it's used. */
export const ESTIMATE = {
  /** How long an agency's offer of representation stands, and a booking's. */
  representationOfferDays: 30,
  bookingOfferDays: 2,
  /** How a showing reads: acting (`actingOf`) counts as much as the rest a scene shows together. */
  showcaseActingWeight: 0.5,
  /**
   * What a showcase scene shows beside the acting: the voice and speech, the
   * body, the script, the character, the feeling, and the camera for the tape
   * agencies keep. Until 2026-09-27 it was every area, when there were seven;
   * of 21, voice-over, dance and a fight never show in a scene.
   */
  showcaseSeen: ['scene', 'character', 'emotion', 'voice', 'speech', 'movement', 'script', 'screen'] as const,
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
  /**
   * What a day's work grows, and takes out of a body in energy: 8 for an
   * eight-hour day, by the hours, and a performance 10, as the School's is.
   * Until 2026-09-27 every day cost 8, a twelve-hour shoot as a three-hour one.
   */
  workGain: 1.2,
  /** What an audition done grows of the audition's own skills, as a share of a class session's. */
  auditionGain: 0.3,
  workEnergy: 8,
  performanceEnergy: 10,
  /** Hygiene an hour on set or on stage beyond the day's drift: the drift again. */
  setGrime: 1.6,
} as const;

/**
 * SAG-AFTRA's terms for leaving an agency. In a first contract's first 151
 * days, only once 120 days in a row pass with no bona fide offer; after them,
 * and in a renewal throughout, whenever the last 91 days held fewer than ten
 * days' work. Until 2026-09-27 the 91-day rule ran from the first day.
 */
export const LEAVING = { firstDays: 120, initialDays: 151, windowDays: 91, fewerThanDays: 10, source: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/2360; SAG Codified Agency Regulations, Rule 16(g), Exhibit E ¶6' } as const;

/**
 * An agency contract's term, from SAG's Rule 16(g), under which SAG-AFTRA's
 * franchised agents sign actors for film and television: a first contract
 * may run no longer than a year (§XI D(2)); a new one, up to three years,
 * once the one in force has run eight months (D(1a)); and a renewal may be
 * signed only in a term's last third (D(3)). That an agency offers to renew
 * a client it booked work for in the term, and lets the rest run out, is
 * SLATE's estimate. Until 2026-09-27 a contract had no term.
 */
export const AGENCY_TERM = { firstYears: 1, renewalYears: 3, renewFrom: 2 / 3, source: 'SAG Codified Agency Regulations, Rule 16(g), §XI D(1a), D(2), D(3)' } as const;

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
  /** Passed along by a close friend from school who works, by name (`REFERRAL`, from 2026-10-08). */
  referredBy?: string;
  /** Worked on with a coach first. */
  coached?: boolean;
  /** The job's genre, as the breakdown gives it, read at the audition and kept by the booking. */
  genre?: string;
  /** What the part itself asks beside it (`PART_DEMANDS`), kept by the booking. */
  demands?: (keyof Craft)[];
  /** Sent by the commercial agent, not the theatrical one (`systems/commercial.ts`). */
  via?: 'commercial';
  /** Submitted for from its breakdown, its genre and demands those it was read with (from 2026-10-06). */
  chosen?: true;
}

/** A breakdown open to a submission: a part, the genre it's filed under and what it asks beside it (from 2026-10-06). */
export interface Breakdown { roleId: string; genre?: string; demands?: (keyof Craft)[] }

export interface Booking {
  id: string;
  /** Stage nights an understudy played for them, laid up or in hospital: part of the run, unpaid. */
  missedNights?: number;
  roleId: string;
  cityId: CareerCity;
  starts: Instant;
  /** Days on screen; weeks of performances on stage. */
  units: number;
  /** Weeks of rehearsal first, on stage. */
  rehearsalWeeks: number;
  /** What it's filed under, where it's filed under anything. */
  genre?: string;
  /** What the part asks beside its genre, from the audition (`PART_DEMANDS`). */
  demands?: (keyof Craft)[];
  /** A commercial's product (`PRODUCTS`), drawn at the offer. */
  product?: string;
  status: 'offered' | 'accepted' | 'passed' | 'lapsed' | 'worked' | 'fired' | 'released';
  /** A former classmate cast in it too, by their place in the class (`castClassmate`, from 2026-10-08). */
  castmate?: number;
  dueAt: Instant;
  offeredAt: Instant;
  /** Days worked, and of them not yet paid. */
  worked: number;
  owed: number;
  /** Each day's overtime, by the day's place in the job. */
  overtimeDays?: Money[];
  /** Where it shoots, if not at home (`LOCATION`). */
  location?: string;
  /** A later season's rate, in US cents, above the minimum by the season's raises. */
  rate?: Money;
  /** Asked for more once (`counterOffer`, from 2026-10-02). */
  countered?: boolean;
  /** A series regular's season, and the first season's booking, which names the series. */
  season?: number;
  seriesId?: string;
  /** Canada's Form T1287, filed before the work: the rate CRA let the producer withhold instead of 23%. */
  t1287Rate?: number;
  /** Travel days and meal allowance owed, paid with the job. */
  travelOwed?: Money;
  perDiemOwed?: Money;
  /** A fitting's pay, wages paid with the job's; and the allowance for wardrobe of the actor's own, paid beside them (`systems/fittings.ts`). */
  fittingOwed?: Money;
  wardrobeOwed?: Money;
  /** The actor's own outfits, lent for it, and when the production gives them back. */
  furnished?: { outfitIds: string[]; itemIds: string[]; backAt: Instant };
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
}

/** A day worked: when, its hours, and its scale, for the rule on leaving an agency and a week's unemployment. */
export interface WorkedDay { at: Instant; hours: number; pay: Money }

export interface Offer { agencyId: string; cityId: CareerCity; until: Instant }
export interface ManagerOffer { managerId: string; until: Instant }

export interface CareerRecord {
  /** Work entered for awards, and what came of it (`systems/awards.ts`, from 2026-10-01). */
  awards?: import('./awards').AwardEntry[];
  /** Casting offices met at a workshop, kept as contacts (`CASTING_OFFICES`, from 2026-10-03). */
  castingContacts?: { office: string; cityId: string; at: Instant }[];
  /** Each showcase's reading, by city. */
  showcases: { cityId: CareerCity; at: Instant; score: number }[];
  /** Offers of representation standing. */
  offers: Offer[];
  agencyId?: string;
  agencyCity?: CareerCity;
  signedAt?: Instant;
  /** When the agency contract's term ends (`AGENCY_TERM`), and whether it's a first contract with the agency, to which the 151-day rule applies. */
  termEnds?: Instant;
  initialTerm?: boolean;
  /** A renewal: offered by the agency until the term ends, or turned down by either side, for this term. */
  renewal?: { state: 'offered' | 'declined' | 'not-offered' };
  /** The last representation ended, and why. */
  ended?: { agencyId: string; at: Instant; reason: string; left: boolean };
  missed: number;
  lastBookedAt?: Instant;
  auditions: Audition[];
  bookings: Booking[];
  credits: { roleId: string; year: number; cityId: CareerCity; /** The production and the part, from 2026-10-08 (`systems/companies.ts`). */ productionId?: string; part?: string }[];
  unions: {
    sag?: { eligibleAt: Instant; joinedAt?: Instant };
    equity?: { joinedAt: Instant; initiationPaid: Money };
    /** ACTRA's: an apprentice from the first engagement, a full member at three credits; the year's dues, CAD cents, toward its cap (`ACTRA`, from 2026-09-30). */
    actra?: { joinedAt: Instant; credits: number; fullAt?: Instant; duesBy?: Record<string, Money> };
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
  /** What the trades have printed, about them and their class, the latest first (`systems/rivals.ts`). */
  news?: NewsItem[];
  /** A commercial agent beside the theatrical one, commercial pay for its rule on leaving, and when each commercial agency last met them (`systems/commercial.ts`). */
  commercial?: CommercialRep;
  commercialPay?: { at: Instant; amount: Money }[];
  commercialMet?: Record<string, Instant>;
  /** A series under option between seasons, until its pickup is decided. */
  option?: { seriesId: string; decidedAt: Instant };
  /** Self-submissions this week, waiting on Monday. */
  submitted: number;
  /** Of them, the breakdowns chosen and submitted for (`career.submit_for`, from 2026-10-06): the part, its genre and what it asks. */
  chosen?: Breakdown[];
  /** When the business began for them: the school's hold let go. */
  since?: Instant;
  /** What the work costs them: casting sites paid to a date and whether they renew; headshots' date; a tape kit; a class, and the month it's paid for. */
  sites?: Partial<Record<CastingSite, { until: Instant; renews: boolean }>>;
  headshotsAt?: Instant;
  /** When they last submitted themselves to the agencies where they live (`career.query_agencies`, from 2026-10-01). */
  queriedAt?: Instant;
  kit?: boolean;
  reelAt?: Instant;
  /** What the reel was cut from, and how good it is (`systems/footage.ts`, from 2026-10-08). */
  reelCut?: { at: Instant; ids: string[]; band: Band };
  scene?: { paidFor: string };
  /** An improv course under way: its evenings left (`career.improv`). */
  improv?: { left: number };
  /** A publicist on retainer, and the month last paid (`career.publicist`). */
  publicist?: { paidFor: string };
  /** The last dues period billed, `YYYY-M`. */
  duesBilled?: string;
  /** The last id given an audition or a booking. */
  seq: number;
}

export const nextOwnId = (career: CareerRecord, prefix: string) => `${prefix}${(career.seq += 1)}`;

export type CastingSite = keyof typeof WORK_COSTS.sites;

/** Whether a casting site is paid for at a moment. */
export const onSite = (career: CareerRecord, site: CastingSite, at: Instant) => (career.sites?.[site]?.until ?? 0) > at;

/**
 * How far a self-submission reaches: a free one a name and a résumé; a paid
 * site's the headshot and the reel, without which the breakdowns that ask for
 * one are shut; and, from 2026-10-08, the reel's footage read too
 * (`reelCallback`), strong work called back a little more often.
 */
export function submissionReach(career: CareerRecord, onAny: boolean): number {
  if (!onAny) return WORK_COSTS.freeSubmissionShare;
  return career.reelAt !== undefined ? reelCallback(career.reelCut) : 1 - WORK_COSTS.wantReel;
}

/** The actor's footage, school's and screen's, for a reel (`footageOf`). */
export function footageFor(person: Person): Footage[] {
  const credits = (person.career?.credits ?? []).map((c, i) => ({ c, i })).filter(({ c }) => roleById(c.roleId).medium === 'screen').map(({ c, i }) => ({ id: `${c.roleId}-${c.year}-${i}`, label: `${roleById(c.roleId).label}, ${c.year}` }));
  return footageOf(person, credits);
}

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
/** An amount in a currency, in the save's: a British part's pounds as a dollar figure is converted. */
const inMoney = (cents: Money, from: string, into: string) => (into === from ? cents : exchange(cents, from, into) ?? cents);
/** A casting site's money and country: dollars and America where it doesn't say. */
const siteMoney = (site: CastingSite) => (WORK_COSTS.sites[site] as { currency?: string }).currency ?? 'USD';
const siteCountry = (site: CastingSite) => (WORK_COSTS.sites[site] as { countryId?: string }).countryId ?? 'us';
/** A role's own money: dollars where it doesn't say. */
const roleMoney = (role: Role) => role.currency ?? 'USD';
const dayKey = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const weekday = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); };
const at = (from: Instant, zone: string, days: number, hour: number) => { const p = zonedParts(from, zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day + days), hour }, zone); };

/**
 * Where the business is for them: the agency's city, where it's in the
 * country they live in; else where they live, if it's one of the business's
 * cities; else New York. From 2026-09-29 an American agency's city doesn't
 * hold an actor who has moved home to London: London's work is theirs.
 */
export function workCity(person: Person): CareerCity {
  const home = person.home?.cityId ?? person.currentLocationId;
  const homeIsWork = (CAREER_CITIES as readonly string[]).includes(home);
  const agencyCity = person.career?.agencyCity;
  if (agencyCity && (!homeIsWork || CITIES.get(agencyCity)?.countryId === CITIES.get(home)?.countryId)) return agencyCity;
  if (homeIsWork) return home as CareerCity;
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
  // Work in the country they live in is taxed as a resident's, at home. Until
  // 2026-09-30 a Londoner's British work was withheld as a visitor's too.
  if (CITIES.get(homeOf(person))?.countryId === country) return 0;
  if (country === 'ca') {
    // Less where a T1287 was filed for the job (`t1287Quote`).
    const booking = payer ? careerOf(person).bookings.find((b) => b.id === payer.id) : undefined;
    return Math.round(gross * (booking?.t1287Rate ?? ABROAD.canada.rate));
  }
  if (country === 'uk') {
    // Payer by payer, in the UK's tax year: from the first payment, once the payer's total is expected past £12,570.
    const paid = payer ? earningsOf(person).ukPayers?.[ukTaxYear(when)]?.[payer.id] ?? 0 : 0;
    const threshold = exchange(ABROAD.uk.payerThresholdGbp, 'GBP', into) ?? ABROAD.uk.payerThresholdGbp;
    return Math.max(paid + gross, payer?.expected ?? 0) > threshold ? Math.round(gross * ABROAD.uk.rate) : 0;
  }
  return 0;
}

/**
 * Canada's Form T1287, for a job to be worked there: filed before the work,
 * it lets the producer withhold what the tax on the net would be, where
 * that's under the 23% of the gross (CRA, "Application by a Non-Resident of
 * Canada for a Reduction in the Amount of Non-Resident Tax Required to be
 * Withheld on Income Earned from Acting"). The rate is the election's tax
 * on the job's expected pay, less its commission, over that pay, with the
 * year's acting so far as the income it's measured against. The election's
 * return settles the year either way. Until 2026-09-28 every Canadian job
 * was withheld at 23%.
 */
export function t1287Quote(sim: Simulation, person: Person, booking: Booking): { rate: number } | { refused: string } {
  const city = CITIES.get(workCityOf(booking));
  if (city?.countryId !== 'ca') return { refused: 'It’s for work in Canada.' };
  if (booking.status !== 'accepted') return { refused: 'Only for a job you’ve taken.' };
  if (sim.now >= booking.starts) return { refused: 'It has to be filed before the work begins.' };
  if (booking.t1287Rate !== undefined) return { refused: 'You’ve filed one for it.' };
  const cur = saveCurrency(sim.universe);
  const gross = expectedGross(booking, booking.starts, cur);
  if (gross <= 0) return { refused: 'There’s nothing to withhold from.' };
  const commission = careerOf(person).agencyId ? Math.round(gross * AGENT_COMMISSION.rate) : 0;
  const world = earningsOf(person).years[zonedParts(sim.now, sim.homeZone).year]?.acting ?? 0;
  const tax = canadaElected(gross, commission, world + gross, cur, { [city.parentId]: gross });
  return { rate: Math.min(ABROAD.canada.rate, Math.max(0, tax / gross)) };
}

/** What a booking is expected to pay in all, at its rate: its days on screen, its weeks on stage with rehearsal. */
export function expectedGross(booking: Booking, when: Instant, into: string): Money {
  const role = roleById(booking.roleId);
  const units = role.medium === 'stage' ? booking.units + booking.rehearsalWeeks : role.series ? role.series.episodes : booking.units;
  return unitRate(booking, when, into) * units;
}

/** What a finished part adds to recognition: the screen's reach, and Broadway's (`ATTRIBUTES.recognition`). */
export function recognitionFrom(role: Role): number {
  const r = ATTRIBUTES.recognition;
  if (role.series) return r.series;
  if (role.arc) return r.arc;
  if (role.id.startsWith('guest')) return r.guest;
  if (role.id === 'costar') return r.costar;
  if (role.id === 'film-weekly') return r.studioFilm;
  if (role.id.startsWith('film')) return r.film;
  if (role.id === 'commercial') return r.commercial;
  if (role.id === 'broadway') return r.broadway;
  return 0;
}

/** A booking's unit rate on a day: a later season's own, or the part's minimum. */
export function unitRate(booking: Booking, when: Instant, into: string): Money {
  const role = roleById(booking.roleId);
  const minimum = rateOf(role, when, workCityOf(booking), into);
  return booking.rate !== undefined ? Math.max(minimum, inMoney(booking.rate, roleMoney(role), into)) : minimum;
}

/** What's left of ACTRA's $4,000 cap on a year's basic and working dues, in the save's money: none short of full membership, as an apprentice pays no working dues. */
export function actraRoom(person: Person, year: number, into: string): Money {
  const actra = careerOf(person).unions.actra;
  if (actra?.fullAt === undefined) return 0;
  return inMoney(Math.max(0, ACTRA.duesCap - (actra?.duesBy?.[year] ?? 0)), ACTRA.currency, into);
}

/** What a part pays a unit (a day on screen, a week on stage) on a day, in the save's money. */
export function rateOf(role: Role, when: Instant, cityId: string, into: string): Money {
  return inMoney(rateOn(role.steps, dayKey(when, zoneOf(cityId))), roleMoney(role), into);
}

// ---------------------------------------------------------------------------
// The showcase and representation
// ---------------------------------------------------------------------------

/**
 * What a showing reads as: acting (`actingOf`) weighed against the rest, presence beside
 * the craft (`ATTRIBUTES.showcaseShare`), and up to a fifth less for a tired
 * actor. A classmate is read at their own presence (`classmatePresence`); until
 * 2026-09-28 at an ordinary 50.
 */
export function showcaseScore(craft: Craft, focus: number, presence = 50): number {
  const w = ESTIMATE.showcaseActingWeight;
  const shown = (1 - ATTRIBUTES.showcaseShare) * (w * actingOf(craft) + (1 - w) * ESTIMATE.showcaseSeen.reduce((sum, k) => sum + craft[k], 0) / ESTIMATE.showcaseSeen.length) + ATTRIBUTES.showcaseShare * presence;
  return shown * (1 - ESTIMATE.showcaseTiredness * (1 - Math.min(1, focus)));
}

/**
 * What the final year's work adds to a showcase: agents attend the thesis
 * productions, so a lead part there and the nights the faculty reviewed read
 * beside the showing. SLATE's estimate: two points a lead in the last year,
 * and up to two for the reviewed nights.
 */
export function thesisSeen(person: Person): number {
  const school = person.school;
  if (!school) return 0;
  const lastYear = school.classOf - 1;
  const leads = (school.credits ?? []).filter((c) => c.year >= lastYear && (c.kind === 'thesis' || c.kind === 'carlotta') && c.wentOn > 0 && /lead/i.test(c.size ?? '')).length;
  const reviewed = school.history.filter((r) => r.work !== undefined).slice(-2);
  const nights = reviewed.length ? reviewed.reduce((sum, r) => sum + r.work!, 0) / reviewed.length : 0;
  return 2 * Math.min(1, leads) + Math.max(-2, Math.min(2, nights * 2));
}

/**
 * What the showcase scene, as it last went in class, adds to the showcase
 * (from 2026-10-07): the scene the actor chose and rehearsed in DRAM 793b
 * (`showcase-scene` in `content/coursework.ts`), shown, and shown again with
 * the note taken. Ordinary work adds nothing, so an actor's showcase reads as
 * it did before; an unready scene, or one not shown, two points less; a
 * strong one, one more, and an exceptional one two. SLATE's estimate, on the
 * scale of `thesisSeen`. Until 2026-10-07 the showcase read the craft and the
 * thesis, and the scene shown to the industry was nobody's work.
 */
export const SHOWCASE_SCENE_POINTS: Record<Band, number> = { unready: -2, working: 0, strong: 1, exceptional: 2 };
export function showcaseSceneSeen(person: Person): { band: Band; points: number } | undefined {
  const scenes = (person.school?.coursework?.assignments ?? []).filter((a) => a.template === 'showcase-scene' && (a.shown || a.status === 'missed' || a.status === 'lapsed'));
  const last = scenes.at(-1);
  if (!last) return undefined;
  const band: Band = last.revision?.band ?? last.shown?.band ?? 'unready';
  return { band, points: SHOWCASE_SCENE_POINTS[band] };
}

/** Which agencies offer after a showing (`career.offers`): those whose bar it clears and who want the actor. */
export function offersFor(sim: Simulation, person: Person, showing: number, key: string, rivals: readonly number[] = [], countryId = 'us'): string[] {
  const rng = sim.rng('career.offers', person.id, key);
  // A track record reads beside the showing (`attributes.ts`).
  const score = showing + ATTRIBUTES.reputationShowing * attributesOf(sim, person).reputation / 100;
  // Shown beside the class, an agency takes its best two: a classmate who outshone them cleared its bar too.
  const ahead = rivals.filter((r) => r > score).length;
  // An agency offers where its clients work: New York's and Los Angeles's for a showing there, London's for London's.
  return AGENCIES.filter((agency) => (agency.countryId ?? 'us') === countryId && rng.next() < ESTIMATE.agencyInterest && score >= agency.bar && ahead < ESTIMATE.agencyTakes).map((a) => a.id);
}

/** A showcase's buzz: how long a manager may still call after it, and how likely in a month. SLATE's estimates. */
export const BUZZ = { days: 180, chance: 0.15 };

/**
 * The managers a month's buzz brings, for somebody unmanaged with a showcase
 * in the last half year: a month in `BUZZ.chance`, and then those whose bar
 * the best showing clears and who want the actor (`managerOffersFor`).
 */
export function showcaseBuzz(sim: Simulation, person: Person, at: Instant): string[] {
  const career = careerOf(person);
  if (career.managerId) return [];
  const shown = career.showcases.filter((one) => at >= one.at && at - one.at < BUZZ.days * MS_DAY);
  if (!shown.length) return [];
  if (sim.rng('career.managers', person.id, `buzz-${at}`).next() >= BUZZ.chance) return [];
  return managerOffersFor(sim, person, Math.max(...shown.map((one) => one.score)), `buzz-${at}`);
}

/** Which management firms offer (`career.managers`): those whose bar the showing clears, half of them wanting the actor. */
export function managerOffersFor(sim: Simulation, person: Person, showing: number, key: string): string[] {
  const rng = sim.rng('career.managers', person.id, key);
  const score = showing + ATTRIBUTES.reputationShowing * attributesOf(sim, person).reputation / 100;
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

/**
 * The town a person can move home to abroad: where they were born, in the
 * country they're a citizen of, if it isn't one of the business's own. From
 * 2026-09-29: until then a British graduate out of permission to work in the
 * United States had nowhere to go.
 */
/**
 * Where a person out of permission to work where they live goes home to, from
 * 2026-10-01: their own country's acting city where SLATE's business has one
 * (London, Dublin, Mexico City), or the town they were born in. Until then a
 * Mexican born in Mexico City had no home town, as the business's own cities
 * are left out of it, and a played life stayed in New York out of status.
 */
export function homeAbroadOf(person: Person): string | undefined {
  const own = isoOfCountry(person.citizenshipId);
  if (!own || own === 'US') return undefined;
  // The business's city they were born in, where it's one (Vancouver), before the country's first (Toronto).
  if ((CAREER_CITIES as readonly string[]).includes(person.homeRegionId ?? '') && isoOfCity(person.homeRegionId!) === own) return person.homeRegionId;
  return (CAREER_CITIES as readonly string[]).find((id) => isoOfCity(id) === own) ?? homeTownOf(person);
}

export function homeTownOf(person: Person): string | undefined {
  const born = person.homeRegionId;
  if (!born || !CITIES.get(born)) return undefined;
  if ((CAREER_CITIES as readonly string[]).includes(born) || born === YALE_DRAMA.cityId) return undefined;
  return isoOfCity(born) === isoOfCountry(person.citizenshipId) ? born : undefined;
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
    if (payForWork(sim, person, inMoney(price, siteMoney(site), cur), `${label}, a year`)) held.until += 365 * MS_DAY;
    else held.renews = false;
  }
  // A publicist's month: the retainer, and press by the work there is to sell (`attributes.ts`).
  const pr = career.publicist;
  if (pr && pr.paidFor !== monthOf(when, sim.homeZone)) {
    if (!payForWork(sim, person, usd(WORK_COSTS.publicistMonthly, cur), 'A publicist, the month')) delete career.publicist;
    else { pr.paidFor = monthOf(when, sim.homeZone); nudge(sim, person, 'recognition', publicityFor(sim, person, when)); }
  }
  const scene = career.scene;
  if (!scene) return;
  const month = monthOf(when, sim.homeZone);
  if (scene.paidFor !== month) {
    if (!payForWork(sim, person, usd(WORK_COSTS.classMonthly, cur), 'Scene-study class, the month')) { delete career.scene; return; }
    scene.paidFor = month;
  }
  if (present(person, when) && person.craft) {
    grow(person.craft, 'scene', focusOf(person));
    // Working scenes in front of a class, week on week: steadier, and a little more there.
    nudge(sim, person, 'composure', ATTRIBUTES.build.sceneWeek.composure, true);
    nudge(sim, person, 'presence', ATTRIBUTES.build.sceneWeek.presence, true);
  }
}

/** A month of press: a point, and half a point for each credit to sell in the last year, to the most a publicist can do. */
export function publicityFor(sim: Simulation, person: Person, when: Instant): number {
  const p = ATTRIBUTES.build.publicity;
  const year = zonedParts(when, sim.homeZone).year;
  const recent = careerOf(person).credits.filter((c) => c.year >= year - 1 && recognitionFrom(roleById(c.roleId)) > 0).length;
  return Math.min(p.most, p.base + p.perCredit * recent);
}

/** Whether a publicist has anything to sell: a screen credit or Broadway. */
export function publicistRefusal(person: Person): string | undefined {
  if (!careerOf(person).credits.some((c) => recognitionFrom(roleById(c.roleId)) > 0)) return 'A publicist needs work to sell: a screen credit, or Broadway.';
  return undefined;
}

/** The next weekday at an hour, in a zone, after a moment. */
function nextDayAt(from: Instant, zone: string, day: number, hour: number): Instant {
  for (let n = 1; n <= 7; n += 1) if (weekday(at(from, zone, n, hour), zone) === day) return at(from, zone, n, hour);
  return from + 7 * MS_DAY;
}

/**
 * A finished film's premiere: an independent one at Tribeca, in New York in
 * June, the first one at least five months after the wrap; a studio film in
 * Los Angeles nine months on. SLATE's estimate of a film's road; attending
 * it is the actor's to choose.
 */
function schedulePremiere(sim: Simulation, person: Person, role: Role, wrapped: Instant): void {
  const studio = role.id === 'film-weekly';
  const cityId: CareerCity = studio ? 'us-ca-losangeles' : 'us-ny-newyork';
  const zone = zoneOf(cityId);
  let when: Instant;
  // An independent film submits to Tribeca, and may not get in (`career.selection`).
  const x = studio ? 0 : sim.rng('career.selection', person.id, `${role.id}-${wrapped}`).next();
  const road: 'studio' | 'tribeca' | 'brooklyn' | 'streaming' = studio ? 'studio' : x < FILM_ROAD.tribeca ? 'tribeca' : x < FILM_ROAD.tribeca + (1 - FILM_ROAD.tribeca) * FILM_ROAD.brooklyn ? 'brooklyn' : 'streaming';
  if (studio) when = at(wrapped + 270 * MS_DAY, zone, 0, 19);
  else {
    // June's festivals: Tribeca from the 10th, Brooklyn's from the 1st; streaming about nine months on.
    let year = zonedParts(wrapped, zone).year;
    const day = road === 'brooklyn' ? 1 : 10;
    when = instantFromZoned({ year, month: 6, day, hour: 19 }, zone);
    if (when < wrapped + 150 * MS_DAY) { year += 1; when = instantFromZoned({ year, month: 6, day, hour: 19 }, zone); }
    if (road === 'streaming') when = at(wrapped + 270 * MS_DAY, zone, 0, 12);
  }
  const label = { studio: 'Premiere', tribeca: 'Tribeca Premiere', brooklyn: 'Brooklyn Film Festival Premiere', streaming: 'Released To Streaming' }[road];
  sim.schedule({ at: when, kind: FESTIVAL_KIND, label: `${label}: ${role.label}`, category: 'career', priority: 30, requiresPlayer: road !== 'streaming', durationMinutes: road === 'streaming' ? 0 : 180, locationId: cityId, payload: { personId: person.id, roleId: role.id, studio, road } });
  // A studio film's weekly performer does its press the week before (`PRESS`).
  if (studio) schedulePress(sim, person, role, when, cityId);
}

/** What a call costs in stress by its hour: before nine in the morning, or a performance that runs late. */
export function callStress(person: Person, hour: number, performance: boolean): number {
  if (hour < CALLS.earlyBefore) return CALLS.early * personalityOf(person, 'earlyCall');
  return performance ? CALLS.late * personalityOf(person, 'lateCall') : 0;
}

/** A job's genre, by its medium, from a draw. */
/** A commercial's product, by its share, political ads three times theirs in an election year's autumn. */
export function productOf(x: number, when: Instant, zone: string): string {
  const p = zonedParts(when, zone);
  const election = p.year % 2 === 0 && p.month >= 8 && p.month <= 10;
  const weights = PRODUCTS.map(([id, , w]) => [id, id === 'political' && election ? w * 3 : w] as const);
  let left = x * weights.reduce((sum, [, w]) => sum + w, 0);
  for (const [id, w] of weights) { left -= w; if (left <= 0) return id; }
  return weights[weights.length - 1]![0];
}

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

/** A moment some years on, on the same date in a zone. */
function yearsOn(from: Instant, zone: string, years: number): Instant {
  const p = zonedParts(from, zone);
  return instantFromZoned({ year: p.year + years, month: p.month, day: Math.min(p.day, 28), hour: p.hour, minute: p.minute }, zone);
}

/** A term's end, and the day its last third opens, on the calendar. */
function armTerm(sim: Simulation, person: Person, from: Instant, years: number, initial: boolean): void {
  const career = careerOf(person);
  const zone = zoneOf(career.agencyCity ?? workCity(person));
  const ends = yearsOn(from, zone, years);
  career.termEnds = ends;
  career.initialTerm = initial;
  delete career.renewal;
  const window = Math.max(sim.now + 60_000, from + Math.round((ends - from) * AGENCY_TERM.renewFrom));
  sim.schedule({ at: window, kind: AGENCY_TERM_KIND, label: 'The Agency Contract’s Last Third', category: 'system', priority: 20, payload: { personId: person.id, stage: 'window', termEnds: ends } });
  sim.schedule({ at: ends, kind: AGENCY_TERM_KIND, label: 'The Agency Contract Ends', category: 'system', priority: 20, payload: { personId: person.id, stage: 'end', termEnds: ends } });
}

function represent(sim: Simulation, person: Person, offer: Offer): void {
  const career = careerOf(person);
  career.agencyId = offer.agencyId;
  career.agencyCity = offer.cityId;
  if (person.id === sim.universe.playerId) report(sim, person, 'Deadline', `${agencyById(offer.agencyId)!.name} Signs ${person.firstName} ${person.lastName}`, 'you');
  career.signedAt = sim.now;
  armTerm(sim, person, sim.now, AGENCY_TERM.firstYears, true);
  career.missed = 0;
  career.offers = [];
  feel(person, 'signed');
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
  delete career.termEnds;
  delete career.initialTerm;
  delete career.renewal;
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'agency-renewal' && !d.resolvedAt) d.resolvedAt = sim.now;
  career.missed = 0;
  for (const a of career.auditions) {
    if (a.status !== 'ahead' || a.self) continue;
    a.status = 'missed';
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === AUDITION_KIND && item.payload.auditionId === a.id) sim.timeline.cancel(item.id, sim.now);
  }
  if (!left) feel(person, 'dropped');
  if (!left && person.id === sim.universe.playerId) sim.notify({ category: 'career', title: `${agency.name} Let You Go`, body: `${reason} You can still submit yourself for work.`, importance: 85, route: '/workspace/career' });
}

/**
 * Whether an agency would take them back: not one they walked out on within
 * two years, and not one that let them go within a year unless they've booked
 * since. SLATE's reading of how agencies treat a former client.
 */
/**
 * An actor's own submission to the agencies where they live, from 2026-10-01:
 * the headshot, the résumé and the reel sent to each, as an unrepresented
 * actor does in every market. Until then an agency came only from a
 * showcase, a job it noticed or a manager's meetings, and a Mexican
 * graduate come home to Mexico City went 27 months unrepresented in a
 * played life, the country's television made in the city. Each agency reads
 * it as it reads a showcase (`offersFor`), against its bar and its own
 * interest, and answers about four weeks on; a submission is sent again six
 * months on, the round most advice gives. The four weeks and six months are
 * SLATE's estimates. It asks the headshots, which a submission is.
 */
export const QUERY = { answerDays: 28, againDays: 182 } as const;
export const QUERY_KIND = 'career.query_answer';

/** Why they can't submit to the agencies now, or nothing. */
export function queryRefusal(sim: Simulation, person: Person): string | undefined {
  const career = careerOf(person);
  if (career.since === undefined) return 'Agencies are written to once the career has begun.';
  if (career.agencyId) return 'You have an agency.';
  if (career.headshotsAt === undefined) return 'A submission is a headshot and a résumé: have headshots taken first.';
  if (career.queriedAt !== undefined && sim.now - career.queriedAt < QUERY.againDays * MS_DAY) return `You wrote to them on ${formatDate(career.queriedAt, sim.zone)}; a submission is sent again six months on.`;
  return undefined;
}

export function takesBack(sim: Simulation, person: Person, agencyId: string): boolean {
  const ended = careerOf(person).ended;
  if (!ended || ended.agencyId !== agencyId) return true;
  const since = sim.now - ended.at;
  if (ended.left) return since > 2 * 365 * MS_DAY;
  return since > 365 * MS_DAY || (careerOf(person).lastBookedAt ?? 0) > ended.at;
}

function offerRepresentation(sim: Simulation, person: Person, agencies: string[], cityId: CareerCity, why: string): void {
  const career = careerOf(person);
  const until = sim.now + ESTIMATE.representationOfferDays * MS_DAY;
  const fresh = agencies.filter((id) => !career.offers.some((o) => o.agencyId === id) && takesBack(sim, person, id));
  career.offers.push(...fresh.map((agencyId) => ({ agencyId, cityId, until })));
  if (!fresh.length || person.id !== sim.universe.playerId) return;
  const city = CITIES.require(cityId).name;
  sim.requireDecision({
    urgency: 90, category: 'career', title: fresh.length === 1 ? 'An Offer Of Representation' : `${fresh.length} Offers Of Representation`,
    detail: `${why} ${fresh.map((id) => agencyById(id)!.name).join(', ')}, in ${city}, offered to represent you. An agency takes ${Math.round((agencyById(fresh[0]!)?.commission ?? AGENT_COMMISSION.rate) * 1000) / 10}% of what you earn. The offers stand until ${formatDate(until, zoneOf(cityId))}.`,
    route: '/workspace/career', dueAt: until, refType: 'representation', refId: `${cityId}-${sim.now}`,
    actions: fresh.map((agencyId) => ({ label: `Sign With ${agencyById(agencyId)!.name}`, commandKind: 'career.sign', payload: { agencyId, cityId } })),
  });
}

// ---------------------------------------------------------------------------
// Auditions and bookings
// ---------------------------------------------------------------------------

/** What a part, its genre and its own demands ask of the craft, by weight (`READS`, `GENRE_READS`, `PART_DEMANDS`). */
export function readsFor(role: Role, genre?: string, demands: readonly (keyof Craft)[] = []): Partial<Craft> {
  const out: Partial<Craft> = { ...role.reads };
  for (const [skill, w] of Object.entries((genre && GENRE_READS[genre]) || {}) as [keyof Craft, number][]) out[skill] = (out[skill] ?? 0) + w;
  for (const skill of demands) out[skill] = (out[skill] ?? 0) + 1;
  return out;
}

/** What a part asks beside its genre, drawn from the breakdown (`PART_DEMANDS`): none for voice work or a commercial, and nothing the genre asks already. */
export function demandsOf(role: Role, genre: string | undefined, draw: () => number): (keyof Craft)[] {
  if (role.medium === 'voice' || role.after?.kind === 'commercial') return [];
  const asked: Partial<Craft> = (genre && GENRE_READS[genre]) || {};
  return PART_DEMANDS[role.medium].filter(([skill, chance]) => draw() < chance && asked[skill] === undefined).map(([skill]) => skill);
}

/** The craft a part reads: its skills, weighed (`readsFor`). */
export function levelFor(craft: Craft, role: Role, genre?: string, demands: readonly (keyof Craft)[] = []): number {
  const reads = Object.entries(readsFor(role, genre, demands)) as [keyof Craft, number][];
  return reads.reduce((sum, [skill, w]) => sum + craft[skill] * w, 0) / reads.reduce((sum, [, w]) => sum + w, 0);
}

/** The skills an audition itself reads (`AUDITION_READ`): the booth's copy read cold, a tape's lines learned, and a room's both. */
export function auditionSkills(role: Role, mode: 'tape' | 'room'): (keyof Craft)[] {
  if (role.medium === 'voice') return ['audition', 'coldReading'];
  return mode === 'tape' ? ['audition', 'memorization'] : ['audition', 'coldReading', 'memorization'];
}

/** The read an audition gives: the part's craft, and a fifth the audition's own. */
export function auditionLevel(craft: Craft, role: Role, mode: 'tape' | 'room', genre?: string, demands: readonly (keyof Craft)[] = []): number {
  const own = auditionSkills(role, mode);
  const s = AUDITION_READ.share;
  return (1 - s) * levelFor(craft, role, genre, demands) + s * own.reduce((sum, k) => sum + craft[k], 0) / own.length;
}

/**
 * What a day's work grows: what the part reads, the heaviest at a full
 * session's worth, and the lines learned (`MEMORIZE`), more for a play or
 * a series, none in the booth.
 */
export function growsFor(role: Role, genre?: string, demands: readonly (keyof Craft)[] = []): Partial<Craft> {
  const reads = readsFor(role, genre, demands);
  const most = Math.max(...Object.values(reads));
  const out = Object.fromEntries(Object.entries(reads).map(([k, w]) => [k, w / most])) as Partial<Craft>;
  if (role.medium !== 'voice') out.memorization = role.medium === 'stage' || role.series || role.arc ? MEMORIZE.long : MEMORIZE.job;
  return out;
}

/** A booking's chance at an audition: at the part's bar, more above and less below, less tired, less on tape and less again without a kit, more coached. */
export function bookingChance(craft: Craft, role: Role, focus: number, mode: 'tape' | 'room', kit = true, coached = false, presence = 50, genre?: string, demands: readonly (keyof Craft)[] = []): number {
  // Presence moves the read above or below the bar, fully in the room and half on tape (`attributes.ts`).
  const raw = ESTIMATE.bookAtBar + ESTIMATE.bookPerPoint * (auditionLevel(craft, role, mode, genre, demands) + presenceSwing(presence, mode) - role.bar);
  const chance = Math.min(ESTIMATE.bookCeiling, Math.max(ESTIMATE.bookFloor, raw)) * Math.min(1.1, focus) * (coached ? WORK_COSTS.coached : 1);
  return mode === 'tape' ? chance * ESTIMATE.tapeFactor * (kit ? 1 : WORK_COSTS.noKit) : chance;
}

/** Whether an audition books (`career.booking`). */
/**
 * What a city's casting knowing the work adds: 3% of the chance for each
 * credit made there, to five. SLATE's estimate of how a local résumé reads.
 */
export const LOCAL_CREDIT = { per: 0.03, most: 5 };
export function localEdge(person: Person, cityId: string): number {
  const here = (person.career?.credits ?? []).filter((c) => c.cityId === cityId).length;
  return 1 + LOCAL_CREDIT.per * Math.min(LOCAL_CREDIT.most, here);
}

export function books(sim: Simulation, person: Person, audition: Audition, focus: number, edge = 1): boolean {
  return sim.rng('career.booking', person.id, audition.id).next() < edge * localEdge(person, audition.cityId) * bookingChance(person.craft!, roleById(audition.roleId), focus, audition.mode, careerOf(person).kit === true, audition.coached === true, attributesOf(sim, person).presence, audition.genre, audition.demands ?? []);
}

/** A week's auditions (`career.auditions`): the agency's, a Poisson count by its reach, and the submissions that came back. */
/** Whether a part drawn for an actor past sixty is one written for their age: kept at its kind's share, on a draw of its own. */
export function keepsPart(sim: Simulation, person: Person, weekStart: Instant, n: number, share: number): boolean {
  return sim.rng('career.age', person.id, `${weekStart}-${n}`).next() < share;
}

/**
 * The breakdowns open to a submission this week, from 2026-10-06: each part here that takes submissions, the genre it's
 * filed under and what it asks beside it, drawn for the week as an audition's are (`genreOf`, `demandsOf`, on
 * `career.booking`), and the same for the week however often they're looked at. Until then a submission was for a part
 * the engine picked when it came back, and nobody saw a breakdown before its audition.
 */
export function breakdownsOf(sim: Simulation, person: Person): Breakdown[] {
  const cityId = workCity(person);
  const week = nextMonday(sim.now, zoneOf(cityId));
  return ROLES.filter((r) => r.cities.includes(cityId) && r.selfSubmit).map((role) => {
    const rng = sim.rng('career.booking', person.id, `breakdown-${week}-${role.id}`);
    const { genre } = genreOf(role, rng.next());
    const demands = demandsOf(role, genre, () => rng.next());
    return { roleId: role.id, ...(genre ? { genre } : {}), ...(demands.length ? { demands } : {}) };
  });
}

/** Why a breakdown can't be submitted for now, or nothing: the week's submissions as Submit Yourself's, and once a part. */
export function submitForRefusal(sim: Simulation, person: Person, roleId: string): string | undefined {
  const career = careerOf(person);
  if (career.since === undefined && !summerOf(person, sim.now)) return 'While classes are in session, the school’s work comes first; submissions start in the summer, and for good when school ends.';
  const most = submissionsAWeek(career, sim.now, workCity(person));
  if (career.submitted >= most) return `You’ve made this week’s ${most} submissions.`;
  if (!breakdownsOf(sim, person).some((b) => b.roleId === roleId)) return 'That part isn’t taking submissions here this week.';
  if ((career.chosen ?? []).some((b) => b.roleId === roleId)) return 'You’ve submitted for it this week.';
  return undefined;
}

/**
 * A week's auditions. From 2026-10-06 the first of the week's submissions are the breakdowns chosen (`chosen`), each
 * come back at the same odds as any submission; one that does is an audition for its part, read with its breakdown's
 * genre and demands, where until then every submission's part was picked when it came back.
 */
export function weekOfAuditions(sim: Simulation, person: Person, weekStart: Instant, agency: Agency | undefined, cityId: CareerCity, submitted: number, managed = false, chosen: readonly Breakdown[] = []): Omit<Audition, 'id' | 'status'>[] {
  const rng = sim.rng('career.auditions', person.id, String(weekStart));
  const poisson = (mean: number) => { let n = 0; const limit = Math.exp(-mean); for (let p = rng.next(); p > limit; p *= rng.next()) n += 1; return n; };
  // Old headshots get an actor called in less, by the agency and on their own.
  const career = careerOf(person);
  const look = staleHeadshots(career, weekStart) ? WORK_COSTS.staleHeadshots : 1;
  // Known to the offices, an actor is called in more (`attributes.ts`).
  const known = sendsFactor(attributesOf(sim, person).reputation);
  // An agency, and a manager (American, all of them), sends work in its own country only. Until
  // 2026-09-29 an American agency sent Irish parts to an actor living in Dublin, and kept them for 62 years.
  const country = CITIES.get(cityId)?.countryId ?? 'us';
  const count = agency && (agency.countryId ?? 'us') === country ? poisson(agency.auditionsPerWeek * look * known) : 0;
  // A manager's relationships: the work a middling agency's reach sends.
  const fromManager = managed && country === 'us' ? poisson(MANAGEMENT.auditionsPerWeek * look * known) : 0;
  // The submissions that came back, by their place in the week's.
  const back: number[] = [];
  // A free submission sends a name and a résumé; a paid site's, the headshot, and the reel where there is one, without which the breakdowns that ask for one are shut.
  // A site casts in its own country: Spotlight in Britain, the American ones there.
  const onAny = (Object.keys(WORK_COSTS.sites) as CastingSite[]).some((site) => siteCountry(site) === country && onSite(career, site, weekStart));
  const paid = submissionReach(career, onAny);
  for (let n = 0; n < submitted; n += 1) if (rng.next() < ESTIMATE.selfSubmitCallback * paid * look * known) back.push(n);
  const self = back.length;
  const pick = (open: readonly Role[]) => {
    let x = rng.next() * open.reduce((sum, r) => sum + r.weight, 0);
    for (const r of open) { x -= r.weight; if (x <= 0) return r; }
    return open[open.length - 1]!;
  };
  const here = ROLES.filter((r) => r.cities.includes(cityId));
  // With a commercial agent, the theatrical agency sends no commercials (`systems/commercial.ts`).
  const sent = here.filter((r) => agency !== undefined && r.tiers.includes(agency.tier) && !(career.commercial && r.after?.kind === 'commercial'));
  const open = here.filter((r) => r.selfSubmit);
  const theirs = here.filter((r) => r.tiers.includes(2));
  const zone = zoneOf(cityId);
  const out: Omit<Audition, 'id' | 'status'>[] = [];
  // Past sixty, fewer parts are written for them, and a part drawn is kept at its kind's share (`AGE_ON_SCREEN`).
  const age = (weekStart - person.birthInstant) / (365.2425 * MS_DAY);
  for (let n = 0; n < count + fromManager + self; n += 1) {
    const mine = n >= count + fromManager;
    const asked = mine ? chosen[back[n - count - fromManager]!] : undefined;
    // A breakdown is cast where it was posted: moved away since, the submission is any part's here, as before.
    const breakdown = asked && roleById(asked.roleId).cities.includes(cityId) ? asked : undefined;
    const role = breakdown ? roleById(breakdown.roleId) : pick(mine ? open : n >= count ? theirs : sent);
    const share = partsForAge(role, age);
    if (share < 1 && !keepsPart(sim, person, weekStart, n, share)) continue;
    const when = at(weekStart, zone, Math.floor(rng.next() * 5), 10 + Math.floor(rng.next() * 7));
    // Submitted from out of town, casting asks for a tape. An agency's room
    // expects a client who lives in town, and one away there comes back for it;
    // a client who lives elsewhere is put on tape, as an agent does for
    // out-of-town clients. Until 2026-09-27 a client who moved away from the
    // agency's city was booked into its rooms, missed them, and was let go.
    const room = rng.next() >= ESTIMATE.tapeShare && !(person.currentLocationId !== cityId && (mine || homeOf(person) !== cityId));
    out.push({ roleId: role.id, at: when, mode: room ? 'room' : 'tape', cityId, ...(mine ? { self: true } : {}), ...(breakdown ? { chosen: true as const, ...(breakdown.genre ? { genre: breakdown.genre } : {}), ...(breakdown.demands?.length ? { demands: breakdown.demands } : {}) } : {}) });
  }
  // A part passed along by a close friend from school who's signed with an agency (from 2026-10-08), now and then: the
  // class's years together reaching the profession. Its own draw, so the week's others are as they were.
  const friend = (person.school?.classmates ?? []).find((m) => (m.bond ?? 0) >= BONDS.close && m.career?.agencyId);
  const tip = sim.rng('career.auditions', person.id, `referral-${weekStart}`);
  if (friend && person.career?.since !== undefined && theirs.length && tip.next() < REFERRAL.chance) {
    const role = theirs[Math.floor(tip.next() * theirs.length)]!;
    out.push({ roleId: role.id, at: at(weekStart, zone, 2, 12), mode: 'tape', cityId, referredBy: friend.name });
  }
  return out;
}

/** How often a close friend from school who works passes along a part: a week in this many. SLATE's estimate. */
export const REFERRAL = { chance: 0.02 } as const;

/**
 * A city an actor reaches for the day and comes home from: Metro-North's New
 * Haven Line between New Haven and Grand Central, about an hour and fifty
 * minutes, on its weekday day pass, $46.75 from New Haven in January 2026
 * (CT Mirror, 12 January 2026). The rise of 1 July 2026 wasn't published as a
 * figure, so the January fare stands. Until 2026-09-28 an actor in New Haven
 * signed with a New York agency missed every audition in its room unless they
 * moved, and was let go for it.
 */
export const DAY_TRIPS: Readonly<Record<string, Readonly<Record<string, { fare: Money; currency: string; minutes: number; source: string }>>>> = {
  'us-ct-newhaven': { 'us-ny-newyork': { fare: 46_75, currency: 'USD', minutes: 110, source: 'https://ctmirror.org/2026/01/12/ct-metro-north-january-ticket-changes/' } },
  'us-ny-newyork': { 'us-ct-newhaven': { fare: 46_75, currency: 'USD', minutes: 110, source: 'https://ctmirror.org/2026/01/12/ct-metro-north-january-ticket-changes/' } },
};

/** There for a call in a city: in it, or a day trip from where they are, the fare paid. */
function reaches(sim: Simulation, person: Person, when: Instant, cityId: string, memo: string): boolean {
  if (!present(person, when)) return false;
  if (person.currentLocationId === cityId) return true;
  const trip = DAY_TRIPS[person.currentLocationId]?.[cityId];
  if (!trip) return false;
  const cur = saveCurrency(sim.universe);
  return payForWork(sim, person, exchange(trip.fare, trip.currency, cur) ?? trip.fare, `The train to ${CITIES.get(cityId)?.name ?? 'the city'} and back: ${memo}`);
}

/** A soundproofed room at the home they're in, quiet enough to record in (`content/specialrooms.ts`, from 2026-10-04). */
export function quietAtHome(person: Person): boolean {
  return atHome(person) && Boolean(livingIn(person)?.facts.features.includes('soundproofRoom'));
}

/** A voice-over booth's fee in a town, its session's least booking at its rate with any tax, in the save's money; nothing where none is kept. */
export function boothFee(sim: Simulation, cityId: string): { fee: Money; studio: string } | undefined {
  const b = VO_BOOTHS[cityId];
  if (!b) return undefined;
  const hours = Math.max(b.minHours, VO_SESSION_MINUTES / 60);
  return { fee: inSaveMoney(sim, Math.round(b.perHour * hours * (1 + b.tax) * 100), b.currency), studio: b.studio };
}

export function present(person: Person, when: Instant, cityId?: string): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  // In hospital, they're nowhere else (`systems/health.ts`).
  return !asleep && !inHospital(person, when) && !laidUp(person, when) && (cityId === undefined || person.currentLocationId === cityId);
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
    // None falls on a SAG-AFTRA holiday, which production takes off (`content/usholidays.ts`);
    // until 2026-09-27 a shoot ran through Thanksgiving and Christmas.
    const days = role.series ? role.series.weeks * 5 : role.arc ? booking.units * 5 : booking.units;
    for (let d = 0; out.length < days; d += 1) {
      const when = at(booking.starts, zone, d, role.medium === 'voice' ? 10 : 7);
      const wd = weekday(when, zone);
      if (wd >= 1 && wd <= 5 && !sagHoliday(dayKey(when, zone))) out.push({ at: when, week: Math.floor(d / 7), rehearsal: false });
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
export function paycheck(opts: { scale: Money; overtime?: Money; role: Role; rehearsal: boolean; represented: boolean; managed?: boolean; before: Money; cityId: string; at: Instant; resident?: boolean; currency?: string; commission?: number; actraRoom?: Money; relief?: { deductions?: Money; credit?: Money } }) {
  const { scale, role, rehearsal, represented, before, cityId } = opts;
  const agentRate = role.union === 'equity' && rehearsal ? AGENT_COMMISSION.equityRehearsalRate : opts.commission ?? AGENT_COMMISSION.rate;
  // A commercial is commissioned at scale; other SAG-AFTRA work is paid scale plus 10% for the agent's share.
  const plusTen = represented && role.union === 'sag' && role.after?.kind !== 'commercial';
  const gross = (plusTen ? Math.round(scale * (1 + AGENT_COMMISSION.rate)) : scale) + (opts.overtime ?? 0);
  const agent = !represented ? 0 : role.union === 'sag' ? Math.round(scale * AGENT_COMMISSION.rate) : Math.round(scale * agentRate);
  // A manager takes a share of all of it: less beside an agent.
  const manager = opts.managed ? Math.round(gross * (represented ? MANAGEMENT.withAgent : MANAGEMENT.alone)) : 0;
  // ACTRA's working dues, up to what's left of the year's cap (`actraRoom`, in the check's money).
  const dues = role.union === 'equity' ? Math.round(gross * EQUITY.workingDues) : role.union === 'anda' ? Math.round(gross * ANDA.dues) : role.union === 'actra' ? Math.min(Math.round(gross * ACTRA.workingDues), Math.max(0, opts.actraRoom ?? Number.POSITIVE_INFINITY)) : 0;
  // A city's resident tax is withheld only from its residents: New York City
  // withholds nothing from a New Haven or Los Angeles actor working there.
  // Until 2026-09-27 it withheld it from everybody, and the return refunded it.
  const owing = (income: Money) => { const t = computeAnnualTax(income, cityId, opts.at, { currency: opts.currency, ...(opts.relief ? { relief: opts.relief } : {}) }); return t.total - (opts.resident === false ? t.local : 0); };
  const withheld = owing(before + gross) - owing(before);
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
  if (career.initialTerm !== false && sim.now - career.signedAt < LEAVING.initialDays * MS_DAY) {
    // A first contract's first 151 days: the longest stretch since signing with no offer.
    const times = [career.signedAt, ...career.bookings.map((b) => b.offeredAt).filter((t) => t >= career.signedAt!).sort((a, b) => a - b), sim.now];
    const longest = Math.max(...times.slice(1).map((t, i) => t - times[i]!));
    return longest >= LEAVING.firstDays * MS_DAY
      ? { ok: true, why: `${LEAVING.firstDays} days in a row with no offer.` }
      : { ok: false, why: `In a first contract’s first ${LEAVING.initialDays} days, you may leave only once ${LEAVING.firstDays} days in a row pass with no offer.` };
  }
  const worked = daysWorkedIn(sim, person, LEAVING.windowDays);
  return worked < LEAVING.fewerThanDays
    ? { ok: true, why: `${worked} days’ work in the last ${LEAVING.windowDays}.` }
    : { ok: false, why: `${worked} days’ work in the last ${LEAVING.windowDays}: the contract holds while it’s ${LEAVING.fewerThanDays} or more.` };
}

// ---------------------------------------------------------------------------
// Handlers and commands
// ---------------------------------------------------------------------------

/**
 * A job's last call past: its credit, its recognition, its afterlife, and
 * the calls a job seen can bring. Reached when the days worked and the stage
 * nights an understudy covered come to the job's days; until 2026-09-28 a
 * night missed laid up or in hospital left the run open for good, and the
 * actor on a job for the rest of their life.
 */
function finishJob(s: Simulation, person: Person, career: CareerRecord, booking: Booking, role: Role, item: ScheduledItem): void {
  if (!person.craft) return;
    booking.status = 'worked';
    earn(s, person, ATTRIBUTES.reputation.job);
    // Recognition comes when the work is seen: a commercial and Broadway as they run; television when it airs, by its audience; a film at its premiere or release (`FILM_ROAD`).
    const television = role.series !== undefined || role.arc === true || role.id.startsWith('guest') || role.id === 'costar';
    if (!television && !role.id.startsWith('film')) nudge(s, person, 'recognition', recognitionFrom(role));
    if (role.id.startsWith('film')) schedulePremiere(s, person, role, item.at);
    const production = productionOf(person, booking.id);
    career.credits.push({ roleId: role.id, year: zonedParts(item.at, zoneOf(booking.cityId)).year, cityId: booking.cityId, ...(production ? { productionId: production.id, part: production.slots.find((x) => x.performer.kind === 'player')?.part ?? 'Your Part' } : {}) });
    // A castmate known from it (`systems/people.ts`, from 2026-10-01): the former classmate cast in it where there was one
    // (from 2026-10-08), the person you already know, never a second; otherwise somebody new.
    // A production with classmates who shared its days knows them already, day by day (`workedDay`); a booking from before
    // productions kept its one castmate at the end (`workedWith`); otherwise somebody new.
    const sharedWithClass = production?.slots.some((x) => x.performer.kind === 'classmate' && x.shared > 0);
    if (!sharedWithClass && (booking.castmate === undefined || production || !workedWith(s, person, booking.castmate, role.label, workDays(booking).length))) metAtWork(s, person, workCityOf(booking), booking.id, role.label);
    const life = role.after ? afterlife(s, person, booking, item.at) : undefined;
    if (television) {
      const a = FILM_ROAD.audience;
      const audience = life?.kind === 'network' ? a.network : life?.kind === 'svod' ? a[life.size ?? 'middle'] * (life.hit ? a.hit : 1) : 1;
      s.schedule({ at: Math.max(s.now + 60_000, life?.airsAt ?? s.now + 60_000), kind: AIRS_KIND, label: `It Airs: ${role.label}`, category: 'system', priority: 20, payload: { personId: person.id, roleId: role.id, audience } });
      // A series regular, a weekly performer, does the press the week before it airs (`PRESS`).
      if (role.series && life?.airsAt !== undefined) schedulePress(s, person, role, life.airsAt, workCityOf(booking));
    }
    // A season done, the series holds its option until it's picked up or dropped, by mid-June.
    if (role.series && life) {
      const q = zonedParts(item.at, s.homeZone);
      const june = instantFromZoned({ year: q.month > SERIES.optionMonth || (q.month === SERIES.optionMonth && q.day >= SERIES.optionDay) ? q.year + 1 : q.year, month: SERIES.optionMonth, day: SERIES.optionDay, hour: 10 }, s.homeZone);
      career.option = { seriesId: booking.seriesId ?? booking.id, decidedAt: june };
      s.schedule({ at: june, kind: RENEWAL_KIND, label: `The Option: ${role.label}`, category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking.id } });
    }
    if (!career.managerId && role.tiers.some((t) => t <= 2)) {
      const managers = managerOffersFor(s, person, levelFor(person.craft, role), booking.id);
      if (managers.length) offerManagement(s, person, managers, `Having seen your ${role.label.toLowerCase()},`);
    }
    // Worked while unrepresented, a job an agency notices can bring its call (`career.offers`).
    if (!career.agencyId && role.tiers.some((t) => t <= 2)) {
      const score = levelFor(person.craft, role);
      const offers = offersFor(s, person, score, booking.id, [], CITIES.get(booking.cityId)?.countryId ?? 'us');
      if (offers.length) offerRepresentation(s, person, offers, booking.cityId, `Having seen your ${role.label.toLowerCase()},`);
    }
}

/**
 * A stage run left open by a night an understudy covered, as a save from
 * before 2026-09-28 holds one: its last call past and none still to come, it
 * closes now as a finished run, its missed nights counted as covered.
 */
export function closeStaleBookings(sim: Simulation, person: Person): void {
  const career = person.career;
  if (!career || !person.craft) return;
  for (const booking of career.bookings) {
    if (booking.status !== 'accepted') continue;
    const days = workDays(booking);
    const last = days[days.length - 1];
    if (!last || last.at > sim.now) continue;
    if (sim.universe.scheduled.some((i) => i.kind === WORK_KIND && i.status === 'pending' && i.payload.bookingId === booking.id)) continue;
    booking.missedNights = Math.max(booking.missedNights ?? 0, days.length - booking.worked);
    finishJob(sim, person, career, booking, roleById(booking.roleId), { at: last.at } as ScheduledItem);
  }
}

/** An offer put to the player: its terms, Take It where it can be taken, Ask For More where it hasn't been asked, and Pass. */
function presentOffer(s: Simulation, person: Person, booking: Booking): void {
  const role = roleById(booking.roleId);
  const cur = saveCurrency(s.universe);
  const zone = zoneOf(booking.cityId);
  const span2 = role.series
    ? `A season of ${role.series.episodes} episodes over ${role.series.weeks} weeks`
    : role.medium !== 'stage'
    ? `${booking.units} ${booking.units === 1 ? (role.medium === 'voice' ? 'session' : 'day') : (role.medium === 'voice' ? 'sessions' : 'days')}`
    : `${booking.rehearsalWeeks} weeks of rehearsal and ${booking.units} of performances`;
  // One that can't be taken says why, and offers only a pass: until
  // 2026-09-27 it offered Take It, which the command then refused.
  const cannot = acceptRefusal(s, person, booking);
  s.requireDecision({
    urgency: 95, category: 'career', title: `Booked: ${role.label}${booking.product ? `, For ${PRODUCTS.find(([id]) => id === booking.product)![1]}` : ''}`,
    detail: `${span2} from ${formatDate(booking.starts, zone)}, in ${CITIES.require(workCityOf(booking)).name}${booking.location ? ', on location' : ''}, at ${formatMoney(unitRate(booking, booking.starts, cur), cur)} a ${role.series ? 'episode' : role.medium === 'voice' ? 'session' : role.medium === 'screen' ? 'day' : 'week'}. ${cannot ? `You can’t take it: ${cannot}` : `Answer by ${formatDateTime(booking.dueAt, zone)}.`}`,
    route: '/workspace/career', dueAt: booking.dueAt, refType: 'booking', refId: booking.id,
    actions: [
      ...(cannot ? [] : [{ label: 'Take It', commandKind: 'career.accept', payload: { bookingId: booking.id } }]),
      ...(cannot || booking.countered ? [] : [{ label: 'Ask For More', commandKind: 'career.counter', payload: { bookingId: booking.id } }]),
      { label: 'Pass', commandKind: 'career.pass', payload: { bookingId: booking.id } },
    ],
  });
}

/**
 * Asking for more on an offer, from 2026-10-02
 * (`research-gaps-awards-negotiation.json`): no source publishes how an
 * actor's counter goes, and the nearest measured is a 2025 NBER field study
 * of job offers (Cullen and others): 85% of counters got something, and
 * countering raised pay 12.45% on average; withdrawals, far rarer than
 * feared, aren't sized, and none is drawn. Below a series regular in American
 * television, and for a commercial, Variety (2023) reports offers made at
 * scale, take it or leave it: there the counter changes nothing. One counter
 * an offer.
 */
export const COUNTER = { met: 0.85, raise: 0.1245 } as const;
const TAKE_IT_OR_LEAVE_IT = new Set(['costar', 'guest-half', 'guest-hour', 'recurring', 'commercial', 'commercial-vo']);

/** Whether a counter is met (decider `career.counter`), and the offer's new rate in its role's money, or why it can't be asked. */
export function counterOffer(sim: Simulation, person: Person, booking: Booking, odds?: number): { met: boolean; rate?: Money } | string {
  if (booking.status !== 'offered') return 'That isn’t an offer open to you.';
  if (booking.countered) return 'You’ve asked once already.';
  booking.countered = true;
  const role = roleById(booking.roleId);
  if (TAKE_IT_OR_LEAVE_IT.has(role.id)) return { met: false };
  if (sim.rng('career.counter', person.id, booking.id).next() >= (odds ?? COUNTER.met)) return { met: false };
  const now = booking.rate ?? rateOn(role.steps, dayKey(booking.starts, zoneOf(workCityOf(booking))));
  booking.rate = Math.round(now * (1 + COUNTER.raise));
  return { met: true, rate: booking.rate };
}

export function registerCareer(sim: Simulation): void {
  const personOf = (item: { payload: Record<string, unknown> }) => sim.universe.people[String(item.payload.personId)];
  const isPlayer = (person: Person) => person.id === sim.universe.playerId;

  sim.onSchedule(SHOWCASE_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft || !person.school || person.school.standing === 'dismissed') return;
    const career = careerOf(person);
    const cityId = item.payload.cityId as CareerCity;
    // The school takes the class; asleep, they aren't seen.
    // Nerves in the room, by the composure there is (`attributes.ts`).
    const focus = present(person, item.at) ? focusOf(person) * nerves(s, person, 'showcase') : 0;
    // Agents come to the third-years' thesis shows: the last year's work on stage, as the faculty reviewed it, reads beside the day's.
    // And the scene itself, as it last went in class (`showcaseSceneSeen`).
    const score = showcaseScore(person.craft, focus, attributesOf(s, person).presence) + thesisSeen(person) + (showcaseSceneSeen(person)?.points ?? 0);
    if (focus > 0) earn(s, person, Math.max(0, score - 50) * ATTRIBUTES.reputation.showcasePer);
    career.showcases.push({ cityId, at: item.at, score });
    // The class shows with them, each classmate at an ordinary day's readiness and their own presence.
    const rivals = person.school.classmates.map((m, i) => showcaseScore(m.craft, 1, classmatePresence(s, person, i)));
    // The class is signed too, at the first showing, by the same rule (`systems/rivals.ts`).
    signTheClass(s, person, score);
    const offers = focus > 0 && !career.agencyId ? offersFor(s, person, score, cityId, rivals, CITIES.get(cityId)?.countryId ?? 'us') : [];
    const city = CITIES.require(cityId).name;
    const managers = focus > 0 && !career.managerId ? managerOffersFor(s, person, score, cityId) : [];
    if (managers.length) offerManagement(s, person, managers, `After the showcase in ${city},`);
    if (offers.length) { offerRepresentation(s, person, offers, cityId, `After the showcase in ${city},`); return; }
    if (isPlayer(person) && !career.agencyId) {
      // Until 2026-09-27 a showcase missed in hospital said it was slept through.
      const missed = inHospital(person, item.at) ? 'In hospital that day, you weren’t seen.' : laidUp(person, item.at) ? 'Laid up with an injury, you weren’t seen.' : 'Asleep through it, you weren’t seen.';
      s.notify({ category: 'career', title: focus > 0 ? `No Offers From ${city}` : `You Missed The Showcase In ${city}`, body: focus > 0 ? 'Nobody in the room offered to represent you. You can still submit yourself for work, and an agency can come later.' : missed, importance: 80, route: '/workspace/career' });
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
    // The month's first week: the public forgets a little, half as much with a publicist (`attributes.ts`).
    if (month.day <= 7) fadeRecognition(s, person, career.publicist !== undefined);
    // And the class's month of work, after the degree.
    if (month.day <= 7) classMonth(s, person, item.at);
    // The pension's months, from 65 (`systems/pension.ts`).
    armPension(s, person);
    // The commercial agent's week, and its contract's end (`systems/commercial.ts`).
    commercialTermEnds(s, person);
    scheduleCommercialWeek(s, person, item.at);
    // A showcase's buzz: for half a year after it, a manager who was in the room may still call (`showcaseBuzz`).
    if (month.day <= 7) {
      const found = showcaseBuzz(s, person, item.at);
      if (found.length) offerManagement(s, person, found, `Still talking about your showcase,`);
    }
    // An American manager finds an American agency, for an actor whose work is in the US: until 2026-09-29 one
    // found an actor living in Dublin a New York agency, a year at a time, for forty years.
    if (career.managerId && !career.agencyId && month.day <= 7 && (CITIES.get(workCity(person))?.countryId ?? 'us') === 'us' && s.rng('career.managers', person.id, `agency-${item.at}`).next() < MANAGEMENT.findsAnAgency) {
      const found = offersFor(s, person, showcaseScore(person.craft, 1, attributesOf(s, person).presence), `manager-${item.at}`);
      if (found.length) offerRepresentation(s, person, found, workCity(person), `Your manager, ${managerById(career.managerId)!.name}, set up meetings, and`);
    }
    // Signed before contracts had a term: the term that would be running now, a year at a time from the signing.
    if (career.agencyId && career.signedAt !== undefined && career.termEnds === undefined) {
      let years = AGENCY_TERM.firstYears;
      const zone = zoneOf(career.agencyCity ?? workCity(person));
      while (yearsOn(career.signedAt, zone, years) <= s.now + 7 * MS_DAY) years += 1;
      armTerm(s, person, yearsOn(career.signedAt, zone, years - 1), 1, years === 1);
    }
    if (career.agencyId && career.signedAt !== undefined) {
      const since = Math.max(career.signedAt, career.lastBookedAt ?? 0, career.since ?? 0);
      if (s.now - since > ESTIMATE.dropAfterDays * MS_DAY) endRepresentation(s, person, 'A year with nothing booked, and the agency ended the contract.', false);
    }
    workCostsWeek(s, person, item.at);
    const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
    const cityId = workCity(person);
    const week = weekOfAuditions(s, person, item.at, agency, cityId, career.submitted, career.managerId !== undefined, career.chosen ?? []);
    career.submitted = 0;
    delete career.chosen;
    for (const one of week) {
      // Booked out: an agency doesn't send a client to an audition that clashes with a job they're working.
      if (s.timeline.conflicts(one.at, one.mode === 'tape' ? 120 : 60).some((i) => i.kind === WORK_KIND && i.payload.personId === person.id)) continue;
      const audition: Audition = { ...one, id: nextOwnId(career, 'a'), status: 'ahead' };
      // A breakdown chosen keeps the genre and demands it was posted with; any other part's are drawn now.
      if (!audition.chosen) {
        Object.assign(audition, genreOf(roleById(audition.roleId), s.rng('career.booking', person.id, `${audition.id}-genre`).next()));
        const asks = s.rng('career.booking', person.id, `${audition.id}-demands`);
        const demands = demandsOf(roleById(audition.roleId), audition.genre, () => asks.next());
        if (demands.length) audition.demands = demands;
      }
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
      s.notify({ category: 'career', title: sent.length === 1 ? 'An Audition This Week' : `${sent.length} Auditions This Week`, body: sent.map((a) => `${roleById(a.roleId).label}, ${a.mode === 'tape' ? 'a self-tape' : `in the room in ${CITIES.require(a.cityId).name}`}, ${formatDateTime(a.at, zoneOf(a.cityId))}`).join('; ') + '.', importance: 70, route: '/workspace/career' });
    }
    // The next Monday by the calendar, not seven days of the clock, which a change of the clocks moves an hour.
    scheduleWeek(s, person, nextMonday(item.at, zoneOf(workCity(person))));
    // A member saved before the dues had a date of their own is given it here.
    if (career.unions.sag?.joinedAt !== undefined || career.unions.equity) armDues(s, person);
  });

  // The unions bill on the first of May and November, whatever else the
  // actor is doing. Until 2026-09-27 the bill went out with the first career
  // week of the month, which a student's term never has, and a student who
  // joined on a summer job paid no dues until the degree.
  sim.onSchedule(DUES_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const p = zonedParts(item.at, s.homeZone);
    billDues(s, person, p.year, p.month);
    armDues(s, person);
  });

  sim.onSchedule(AUDITION_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft) return;
    const career = careerOf(person);
    const audition = career.auditions.find((a) => a.id === item.payload.auditionId);
    if (!audition || audition.status !== 'ahead') return;
    // Away on a job in another city, the room takes a tape instead, as casting does for an actor on set.
    if (audition.mode === 'room' && person.currentLocationId !== audition.cityId && !DAY_TRIPS[person.currentLocationId]?.[audition.cityId] && working(s, person) && present(person, item.at)) audition.mode = 'tape';
    const there = audition.mode === 'room' ? reaches(s, person, item.at, audition.cityId, 'an audition') : present(person, item.at);
    if (!there) {
      audition.status = 'missed';
      item.status = 'missed';
      // In hospital, the agency passes on it for them: no strike.
      if (audition.self || audition.via === 'commercial' || !career.agencyId || inHospital(person, item.at) || laidUp(person, item.at)) return;
      career.missed += 1;
      earn(s, person, ATTRIBUTES.reputation.missedAudition);
      if (career.missed >= ESTIMATE.dropAfterMissed) { endRepresentation(s, person, `You missed ${ESTIMATE.dropAfterMissed} auditions the agency got you.`, false); return; }
      if (isPlayer(person)) s.notify({ category: 'career', title: 'You Missed An Audition', body: `${roleById(audition.roleId).label}: the agency got you in, and you weren’t there. ${ESTIMATE.dropAfterMissed} missed and they let you go.`, importance: 75, route: '/workspace/career' });
      return;
    }
    // A voice audition on tape wants "a quiet recording space" (the SAG-AFTRA Foundation): a soundproofed room at home, or a booth (from 2026-10-04).
    if (audition.mode === 'tape' && roleById(audition.roleId).medium === 'voice' && !quietAtHome(person)) {
      const booth = boothFee(s, person.currentLocationId);
      if (!booth || !spend(s, person, booth.fee, `A voice-over booth, ${booth.studio}`, 'career')) {
        audition.status = 'missed';
        item.status = 'missed';
        if (isPlayer(person)) s.notify({ category: 'career', title: 'No Quiet Place To Record', body: `${roleById(audition.roleId).label} wanted a voice audition recorded somewhere quiet, ${booth ? `and the booth at ${booth.studio} couldn't be paid for` : 'and no booth is kept in this town'}. A soundproofed room at home records them free.`, importance: 50, route: '/workspace/career' });
        return;
      }
    }
    audition.status = 'done';
    if (audition.mode === 'room') takeTheRoom(person);
    // Every audition is practice at auditioning.
    if (person.craft) for (const k of auditionSkills(roleById(audition.roleId), audition.mode)) grow(person.craft, k, focusOf(person), ESTIMATE.auditionGain);
    // A classmate in the room who reads better is likelier to get it (`systems/rivals.ts`).
    const role = roleById(audition.roleId);
    const room = inTheRoom(s, person, audition);
    // The class in the room, remembered on the contacts they are (from 2026-10-08).
    metInTheRoom(s, person, room, role.label);
    const mine = auditionLevel(person.craft, role, audition.mode, audition.genre, audition.demands ?? []);
    const better = room.filter((r) => r.read > mine).sort((a, b) => b.read - a.read)[0];
    if (!books(s, person, audition, focusOf(person) * nerves(s, person, 'audition', audition.coached ? ATTRIBUTES.build.coachedNerves : 1), better ? RIVALS.outread : 1)) {
      if (better) {
        classmateBooked(s, person, better.i, role, item.at);
        partTaken(person, better.i, item.at);
        if (isPlayer(person)) s.notify({ category: 'career', title: `The Part Went To ${better.name}`, body: `${role.label}: your classmate from Yale was in the room too, and booked it.`, importance: 55, route: '/workspace/career' });
      }
      return;
    }
    audition.status = 'booked';
    // Booked over the classmates in the room: a part taken from each.
    for (const r of room) partTaken(person, r.i, item.at);
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
      ...(audition.genre === undefined ? genreOf(role, rng.next()) : { genre: audition.genre }),
      ...(audition.demands?.length ? { demands: audition.demands } : {}),
      ...(role.after?.kind === 'commercial' ? { product: productOf(s.rng('career.booking', person.id, `${audition.id}-product`).next(), s.now, s.homeZone) } : {}),
      status: 'offered', dueAt: s.now + ESTIMATE.bookingOfferDays * MS_DAY, offeredAt: s.now, worked: 0, owed: 0,
      ...(location ? { location } : {}),
    };
    // A name the public knows is quoted above scale, and the quote holds for the job (`attributes.ts`).
    const over = overscaleOf(attributesOf(s, person).recognition);
    if (over > 1) booking.rate = Math.round(rateOn(role.steps, dayKey(booking.starts, zoneOf(workCityOf(booking)))) * over);
    career.bookings.push(booking);
    pruneBookings(s, person);
    feel(person, 'booked');
    s.schedule({ at: booking.dueAt, kind: LAPSE_KIND, label: 'An Offer Lapses', category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking.id } });
    if (!isPlayer(person)) return;
    presentOffer(s, person, booking);
  });

  sim.onSchedule(LAPSE_KIND, (item, s) => {
    const person = personOf(item);
    const booking = person ? careerOf(person).bookings.find((b) => b.id === item.payload.bookingId) : undefined;
    if (!person || !booking || booking.status !== 'offered') return;
    booking.status = 'lapsed';
    closeDecision(s, booking.id);
    if (isPlayer(person)) s.notify({ category: 'career', title: 'An Offer Lapsed', body: `${roleById(booking.roleId).label}: unanswered, it went to somebody else.`, importance: 60, route: '/workspace/career' });
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
      if (inHospital(person, item.at) || laidUp(person, item.at)) {
        // On stage the understudy goes on, and they come back after; the
        // night isn't paid. On screen or in the booth the production can't
        // wait, and recasts: the days worked are paid, and nobody walked off.
        // An injury that keeps them off work is taken as a stay in hospital is.
        if (role.medium === 'stage') {
          booking.missedNights = (booking.missedNights ?? 0) + 1;
          if (booking.worked + booking.missedNights >= workDays(booking).length) finishJob(s, person, career, booking, role, item);
          return;
        }
        booking.status = 'released';
        playerReplaced(s, person, booking.id, 'recast while unable to work');
        for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === WORK_KIND && one.payload.bookingId === booking.id) s.timeline.cancel(one.id, s.now);
        if (booking.owed > 0) schedulePay(s, person, booking, s.now + 60_000, true);
        sendHome(s, booking);
        feel(person, 'recast');
        if (isPlayer(person)) s.notify({ category: 'career', title: laidUp(person, item.at) ? 'Recast While You Mended' : 'Recast While You Were In Hospital', body: `${role.label} couldn’t wait for you, and went to somebody else. What you worked is still paid.`, importance: 90, route: '/workspace/career' });
        return;
      }
      booking.status = 'fired';
      playerReplaced(s, person, booking.id, 'replaced for not turning up');
      earn(s, person, ATTRIBUTES.reputation.fired);
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === WORK_KIND && one.payload.bookingId === booking.id) s.timeline.cancel(one.id, s.now);
      if (booking.owed > 0) schedulePay(s, person, booking, s.now + 60_000, true);
      sendHome(s, booking);
      feel(person, 'replaced');
      if (isPlayer(person)) s.notify({ category: 'career', title: 'Replaced', body: `You didn’t turn up for ${role.label}, and the production replaced you. What you worked is still paid.`, importance: 90, route: '/workspace/career' });
      if (career.agencyId) endRepresentation(s, person, 'You walked off a job the agency booked.', false);
      return;
    }
    booking.worked += 1;
    booking.owed += 1;
    // Side by side with classmates in the cast that day, where they were (`workedDay`).
    workedDay(s, person, booking.id, booking.worked, booking.worked + (booking.missedNights ?? 0) >= workDays(booking).length);
    const cur = saveCurrency(s.universe);
    const call = workDays(booking)[booking.worked + (booking.missedNights ?? 0) - 1]!;
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
    // A day's work in Mexico is a day registered with IMSS; a stage run's week is registered whole (`systems/imss.ts`).
    if (CITIES.get(workCityOf(booking))?.countryId === 'mx') contributeImss(s, person, item.at, scale, role.medium === 'stage' ? 7 / 6 : 1);
    career.days = career.days.slice(-400);
    if (role.union === 'equity') {
      const monday = at(item.at, zoneOf(booking.cityId), -((weekday(item.at, zoneOf(booking.cityId)) + 6) % 7), 12);
      const key = dayKey(monday, zoneOf(booking.cityId));
      const weeks = earningsOf(person).equityWeeks;
      if (!weeks.includes(key)) weeks.push(key);
    }
    // Nerves at a performance or a day on set, none in the rehearsal room or the booth; and a day kept, remembered (`attributes.ts`).
    const event = role.medium === 'stage' ? (call.rehearsal ? undefined : 'performance') : role.medium === 'screen' ? 'set' : undefined;
    const focus = focusOf(person) * (event ? nerves(s, person, event) : 1);
    earn(s, person, ATTRIBUTES.reputation.day);
    for (const [skill, weight] of Object.entries(growsFor(role, booking.genre, booking.demands ?? [])) as [keyof Craft, number][]) {
      // Toward how far they can grow (`CEILING`), the gain falling to nothing there.
      person.craft[skill] += ESTIMATE.workGain * weight * focus * Math.max(0, 1 - person.craft[skill] / ceilingOf(person.craft, skill)) ** 1.5;
    }
    const spent = role.medium === 'stage' && !call.rehearsal ? ESTIMATE.performanceEnergy : (ESTIMATE.workEnergy * hours) / 8;
    person.wellbeing.energy = Math.max(0, person.wellbeing.energy - spent);
    // Under lights, in makeup and costume, a body soils twice as fast as the
    // day's own drift (`life.ts`), SLATE's estimate; a booth doesn't. Until
    // 2026-09-27 the model's word for it said so and nothing did it.
    if (role.medium !== 'voice') person.wellbeing.hygiene = Math.max(0, (person.wellbeing.hygiene ?? 80) - hours * ESTIMATE.setGrime * personalityOf(person, 'hygieneDrift'));
    // The day's energy by its MET value (`content/body.ts`): a musical's singing and dancing, a rehearsal room, an actor's day, the booth.
    const musical = booking.genre === 'musical' || (booking.demands ?? []).includes('dance');
    exerts(person, role.medium === 'voice' ? BODY.met.booth : role.medium === 'stage' ? (musical ? (call.rehearsal ? BODY.met.rehearsal : BODY.met.musical) : BODY.met.acting) : BODY.met.acting, hours, true);
    // The day's risk to the body, at the medium's rate, more for a part that fights, dances or does its stunts; hurt at work, workers' compensation (`systems/injury.ts`).
    if (role.medium !== 'voice') {
      const demanding = (booking.demands ?? []).some((d) => d === 'combat' || d === 'dance') || DEMANDING_GENRES.has(booking.genre ?? '');
      const rate = role.medium === 'stage' ? (demanding ? INJURY.perThousandHours.stageDemanding : INJURY.perThousandHours.stage) : (demanding ? INJURY.perThousandHours.screenDemanding : INJURY.perThousandHours.screen);
      mayHurt(s, person, role.medium === 'stage' ? 'stage' : 'screen', chanceOver(rate, hours), item.at, { cityId: workCityOf(booking), weeklyWage: scale * 5 });
    }
    // What they love about the day, and how they take the road and the rehearsal room.
    enjoyWork(person, { medium: role.medium, ...(role.after ? { after: role.after.kind } : {}), ...(booking.genre ? { genre: booking.genre } : {}), ...(booking.product ? { product: booking.product } : {}), away: workCityOf(booking) !== homeOf(person), rehearsal: call.rehearsal === true, role: role.id });
    // An early call, or a performance that runs late, as the body clock takes it.
    person.wellbeing.stress = Math.min(100, person.wellbeing.stress + callStress(person, zonedParts(item.at, zoneOf(workCityOf(booking))).hour, role.medium === 'stage' && !call.rehearsal));
    if (booking.worked + (booking.missedNights ?? 0) < workDays(booking).length) return;
    finishJob(s, person, career, booking, role, item);
  });

  // A fitting attended: its pay owed with the job's; a booking released or passed meanwhile owes nothing.
  sim.onSchedule(FITTING_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const booking = person && careerOf(person).bookings.find((b) => b.id === item.payload.bookingId);
    if (!person || !booking || booking.status !== 'accepted') return;
    // Paid for being there: out of town, asleep, in hospital or laid up, it's missed and not paid (until 2026-10-02 it was paid wherever they were).
    if (!present(person, item.at, workCityOf(booking))) {
      item.status = 'missed';
      if (isPlayer(person)) s.notify({ category: 'career', title: 'Missed The Fitting', body: `You weren’t at wardrobe’s fitting for ${roleById(booking.roleId).label}, so it isn’t paid.`, importance: 55, route: '/workspace/career' });
      return;
    }
    const fit = fittingFor(booking, item.at, saveCurrency(s.universe));
    if (fit && fit.pay > 0) booking.fittingOwed = (booking.fittingOwed ?? 0) + fit.pay;
  });

  sim.onSchedule(PAY_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const career = careerOf(person);
    const booking = career.bookings.find((b) => b.id === item.payload.bookingId);
    const account = payeeAccount(s, person);
    if (!booking) return;
    if (booking.owed <= 0 && !booking.travelOwed && !booking.perDiemOwed && !booking.fittingOwed && !booking.wardrobeOwed) return;
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
    const extras = (booking.travelOwed ?? 0) + (booking.perDiemOwed ?? 0) + (booking.fittingOwed ?? 0) + (booking.wardrobeOwed ?? 0);
    if (!calls.length && !extras) return;
    // A day's scale on screen; on stage, each week's, a sixth for each of its six days.
    const lines = new Map<number, { rehearsal: boolean; days: number }>();
    for (const c of calls) lines.set(c.week, { rehearsal: c.rehearsal, days: (lines.get(c.week)?.days ?? 0) + 1 });
    if (!lines.size) lines.set(-1, { rehearsal: false, days: 0 });
    const postings: { accountId: string; amount: Money }[] = [];
    let net = 0;
    let gross = 0;
    // Travel days are paid as days' work, with the first line.
    // And a fitting's, which is wages too.
    let overtime = (booking.overtimeDays ?? []).slice(from, from + calls.length).reduce((sum, o) => sum + (o ?? 0), 0) + (booking.travelOwed ?? 0) + (booking.fittingOwed ?? 0);
    booking.travelOwed = 0;
    booking.fittingOwed = 0;
    for (const [week, line] of lines) {
      const rate = unitRate(booking, item.at, cur);
      // A series regular's episodes, spread over the season's workweeks.
      const scale = role.series ? Math.round((rate * role.series.episodes * line.days) / (role.series.weeks * 5)) : role.medium !== 'stage' ? rate * line.days : Math.round((rate * line.days) / 6);
      // Abroad, US tax is withheld as at home, and the country takes its own (`ABROAD`).
      // Use paid with the fees: an ACTRA producer's prepaid use, a Canadian commercial's year on television (`Role.prepaid`).
      const check = paycheck({ scale: Math.round(scale * arcUplift(booking, week) * (1 + (role.prepaid ?? 0))), overtime, role, rehearsal: line.rehearsal, represented, managed, before: wages.acting, cityId: taxCity, at: item.at, resident: taxCity === homeOf(person), currency: cur, commission: agencyById(career.agencyId ?? '')?.commission, actraRoom: actraRoom(person, year, cur), relief: marriedRelief(person, taxCity, item.at, cur) });
      if (role.union === 'actra' && career.unions.actra) { const by = (career.unions.actra.duesBy ??= {}); by[year] = (by[year] ?? 0) + inMoney(check.dues, cur, ACTRA.currency); }
      overtime = 0;
      const foreign = foreignWithholding(person, workCity, check.gross, item.at, cur, { id: booking.id, expected: expectedGross(booking, item.at, cur) });
      recordWages(person, item.at, zone, { gross: check.gross, withheld: check.withheld, commission: check.commission, dues: check.dues, sag: role.union === 'sag', employer: booking.id, where: workCity, foreignWithheld: foreign });
      if (role.after?.kind === 'commercial') recordCommercialPay(person, item.at, check.gross);
      check.net -= foreign;
      if (foreign) postings.push({ accountId: s.nominalAccount('expense', 'Foreign Tax Withheld').id, amount: foreign });
      // A self-employed Canadian's CPP, both halves, as the year goes (`systems/capensions.ts`, from 2026-09-30).
      const cpp = cppOnCheck(person, year, check.gross, cur);
      check.net -= cpp;
      if (cpp) postings.push({ accountId: s.nominalAccount('expense', 'CPP Contributions').id, amount: cpp });
      // And EI's premium, once registered (`systems/eiself.ts`).
      const ei = eiOnCheck(person, year, check.gross, cur);
      check.net -= ei;
      if (ei) postings.push({ accountId: s.nominalAccount('expense', 'EI Premiums').id, amount: ei });
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
    // So is the allowance for wardrobe of their own: a reimbursement, untaxed.
    const wardrobe = booking.wardrobeOwed ?? 0;
    booking.wardrobeOwed = 0;
    if (wardrobe) postings.push({ accountId: s.nominalAccount('income', 'Wardrobe Allowance').id, amount: -wardrobe });
    s.post({
      memo: `${role.label}: ${calls.length} ${calls.length === 1 ? 'day' : 'days'}${perDiem ? ', with the meal allowance' : ''}${wardrobe ? ', with the wardrobe allowance' : ''}`, category: 'salary',
      postings: [{ accountId: account.id, amount: net + perDiem + wardrobe }, { accountId: s.nominalAccount('income', 'Acting').id, amount: -gross }, ...postings],
    });
  });

  sim.onCommand<Record<string, never>, { answersBy: Instant }>('career.query_agencies', (_p, { sim: s }) => {
    const person = s.player;
    const no = queryRefusal(s, person);
    if (no) throw new CommandError(no);
    const career = careerOf(person);
    career.queriedAt = s.now;
    const answersBy = s.now + QUERY.answerDays * MS_DAY;
    s.schedule({ at: answersBy, kind: QUERY_KIND, label: 'The Agencies Answer', category: 'career', priority: 20, payload: { personId: person.id, cityId: workCity(person) } });
    return { answersBy };
  });

  sim.onSchedule(QUERY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const career = careerOf(person);
    // Signed meanwhile, the answers don't matter.
    if (career.agencyId) return;
    const cityId = String(item.payload.cityId) as CareerCity;
    const found = offersFor(s, person, showcaseScore(person.craft!, 1, attributesOf(s, person).presence), `query-${item.at}`, [], CITIES.get(cityId)?.countryId ?? 'us');
    if (found.length) { offerRepresentation(s, person, found, cityId, 'Having read your submission,'); return; }
    if (person.id === s.universe.playerId) s.notify({ category: 'career', title: 'No Agency Answered', body: 'None of the agencies you wrote to asked to meet. You can write again six months after you sent it.', importance: 45, route: '/workspace/career' });
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

  // The term's last third, and its end (`AGENCY_TERM`).
  sim.onSchedule(AGENCY_TERM_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const career = careerOf(person);
    if (!career.agencyId || career.termEnds === undefined || career.termEnds !== item.payload.termEnds) return;
    const ends = career.termEnds;
    const agency = agencyById(career.agencyId)!;
    const zone = zoneOf(career.agencyCity ?? workCity(person));
    if (item.payload.stage === 'window') {
      // An agency keeps a client it booked work for in the term.
      const booked = (career.lastBookedAt ?? 0) >= yearsOn(ends, zone, -(career.initialTerm === false ? AGENCY_TERM.renewalYears : AGENCY_TERM.firstYears));
      career.renewal = { state: booked ? 'offered' : 'not-offered' };
      if (!isPlayer(person)) { if (booked) armTerm(s, person, ends, AGENCY_TERM.renewalYears, false); return; }
      if (!booked) {
        s.notify({ category: 'career', title: `${agency.name} Won’t Renew`, body: `Your contract with ${agency.name} ends ${formatDate(ends, zone)}, and with no work booked in it, they won’t renew.`, importance: 80, route: '/workspace/career' });
        return;
      }
      s.requireDecision({
        urgency: 70, category: 'career', title: `${agency.name} Offers To Renew`,
        detail: `Your contract with ${agency.name} ends ${formatDate(ends, zone)}. They offer a new one for ${plural(AGENCY_TERM.renewalYears, 'year')} from then, on the same terms. Let it run out and you’re unrepresented when it ends.`,
        route: '/workspace/career', dueAt: ends, refType: 'agency-renewal', refId: `${ends}`,
        actions: [
          { label: `Renew With ${agency.name}`, commandKind: 'career.renew', payload: { accept: true } },
          { label: 'Let It Run Out', commandKind: 'career.renew', payload: { accept: false } },
        ],
      });
      return;
    }
    // The term's end, unrenewed.
    const turnedDown = career.renewal?.state === 'declined' || career.renewal?.state === 'offered';
    endRepresentation(s, person, turnedDown ? 'You let the contract run out.' : 'The contract ran its term, and the agency didn’t renew it.', turnedDown);
    if (isPlayer(person)) s.notify({ category: 'career', title: 'Your Agency Contract Ended', body: `Your contract with ${agency.name} ended ${formatDate(item.at, zone)}.`, importance: 80, route: '/workspace/career' });
  });

  sim.onCommand<{ accept: boolean }, { termEnds?: Instant }>('career.renew', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    if (!career.agencyId || career.termEnds === undefined || career.renewal?.state !== 'offered') throw new CommandError('No renewal is on offer.');
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'agency-renewal' && !d.resolvedAt) d.resolvedAt = s.now;
    if (p.accept !== true) { career.renewal = { state: 'declined' }; return {}; }
    armTerm(s, person, career.termEnds, AGENCY_TERM.renewalYears, false);
    return { termEnds: career.termEnds };
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
    const no = acceptRefusal(s, person, booking);
    if (no) throw new CommandError(no);
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
      const no = crossingRefusal(person, person.currentLocationId, city, s.now, (Number(item.payload.back) - s.now) / MS_DAY)
        ?? workRefusal(person, city, workDays(booking)[0]!.at, workDays(booking).at(-1)!.at, booking);
      if (no) { turnedBack(s, person, booking, no); return; }
      const cur = saveCurrency(s.universe);
      // Their own fare there, a cost of the work, from 2026-09-29: until then
      // an actor was in the job's city in an instant, and paid nothing to get there.
      const by = item.payload.by === undefined ? undefined : String(item.payload.by);
      const legs = item.payload.slot !== undefined ? planBy(s, by, person.currentLocationId, city, Number(item.payload.day), Number(item.payload.slot), 1) : undefined;
      if (legs && typeof legs !== 'string') {
        const fare = legs.reduce((a, l) => a + l.fare, 0);
        if (!spend(s, person, fare, `The fare to ${CITIES.require(city).name}, for the job`, 'career')) { turnedBack(s, person, booking, `The fare to ${CITIES.require(city).name}, ${formatMoney(fare, cur)}, is more than the bank or the card can cover.`); return; }
        recordJobCost(person, s.now, fare);
      }
      const go = (stay?: Person['stay']) => {
        if (item.payload.slot !== undefined && startCareerJourney(s, person, city, Number(item.payload.day), Number(item.payload.slot), { bookingId: booking.id, paidBy: 'self', ...(by ? { by } : {}), ...(stay ? { onArrival: stay } : {}) })) return;
        moveTo(s, person, city); s.universe.currentZone = zoneOf(city);
        if (stay) person.stay = stay;
      };
      // A room, sublet for the nights: the town's room rent by the night, SLATE's estimate of what it costs.
      // Only the nights no earlier stay in the city already has a room for:
      // back to back, the first room is kept on. Until 2026-09-27 each job
      // sublet its own, and the nights they shared were paid twice.
      const covered = s.universe.scheduled
        .filter((one) => one.kind === STAY_KIND && one.status === 'done' && one.payload.direction === 'out' && one.payload.personId === person.id && one.payload.bookingId !== booking.id && one.at <= item.at)
        .filter((one) => { const other = careerOf(person).bookings.find((b) => b.id === one.payload.bookingId); return other !== undefined && workCityOf(other) === city; })
        .reduce((most, one) => Math.max(most, Number(one.payload.back)), 0);
      const from = Math.max(item.at, covered);
      // A home of their own in the city, empty, is where they stay: no sublet.
      const own = (person.homes ?? []).some((h) => h.cityId === city && !h.tenancies.some((t) => t.unit === 'main' && t.status === 'let') && !h.selling);
      if (from >= Number(item.payload.back) || own) {
        go(own ? { kind: 'own', cityId: city } : undefined);
        if (own && isPlayer(person) && from < Number(item.payload.back)) s.notify({ category: 'career', title: `In ${CITIES.require(city).name} For The Job`, body: `${roleById(booking.roleId).label}: you’re staying in your own home there.`, importance: 50, route: '/workspace/career' });
        return;
      }
      const nights = Math.max(1, Math.round((Number(item.payload.back) - from) / MS_DAY));
      const cost = Math.round((rentAt(city, cur).room * nights) / 30.44);
      const howLong = nights === 1 ? 'one night' : `${nights} nights`;
      // A cost of the work, on the return with the rest, from the bank or on
      // the card. With neither, a friend's sofa for the run. Until 2026-09-27
      // it was taken whether or not the bank could pay, and the room was free.
      const paid = spend(s, person, cost, `A sublet in ${CITIES.require(city).name}, ${howLong}`, 'career');
      if (paid) recordJobCost(person, s.now, cost);
      // A room in somebody's flat, as it is inside, or a friend's sofa (`systems/dwelling.ts`).
      go(paid ? { kind: 'sublet', cityId: city, unit: drawRental(s, person, city, true, item.at) } : { kind: 'sofa', cityId: city });
      if (isPlayer(person)) s.notify({ category: 'career', title: `In ${CITIES.require(city).name} For The Job`, body: paid ? `${roleById(booking.roleId).label}: a room sublet for ${howLong}, ${formatMoney(cost, cur)}.` : `${roleById(booking.roleId).label}: a sublet for ${howLong} is ${formatMoney(cost, cur)}, which neither the bank nor the card could cover, so it’s a friend’s sofa.`, importance: 55, route: '/workspace/career' });
      return;
    }
    // Home again however the job went, fired from it or not, where they're
    // still there, and no other job there has calls ahead: that one's own
    // journey home brings them back. Until 2026-09-27 the first job's took
    // them home in the middle of the next, and the next was lost to it.
    const home = person.home?.cityId ?? person.currentLocationId;
    if (person.currentLocationId !== city || stillWorkingIn(s, person, city, booking.id)) return;
    // Home on their own fare, where there's a flight; where neither the bank nor the card can pay it, home anyway, as SLATE doesn't yet have the bus.
    const flight = careerTrip(s, city, home, s.now, 'back', 'self');
    if (flight) {
      const fare = flight.legs.reduce((a, l) => a + l.fare, 0);
      if (spend(s, person, fare, `The fare home from ${CITIES.require(city).name}, for the job`, 'career')) {
        recordJobCost(person, s.now, fare);
        if (startCareerJourney(s, person, home, flight.day, flight.slot, { bookingId: booking.id, paidBy: 'self', ...(flight.by ? { by: flight.by } : {}) })) return;
      }
    }
    moveTo(s, person, home);
    s.universe.currentZone = zoneOf(home);
    delete person.stay;
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
      const last = workDays(booking).at(-1)!.at;
      const no = crossingRefusal(person, person.currentLocationId, booking.location, s.now, (last - s.now) / MS_DAY + 1)
        ?? workRefusal(person, booking.location, workDays(booking)[0]!.at, last, booking)
        ?? (permitAtTheBorder(s, person, booking) ? undefined : 'The work permit’s fee at the border is more than the bank can cover.');
      if (no) { turnedBack(s, person, booking, no); return; }
      // The production's flight, from 2026-09-29; until then they were there in an instant.
      const trip = item.payload.slot !== undefined ? startCareerJourney(s, person, booking.location, Number(item.payload.day), Number(item.payload.slot), { bookingId: booking.id, paidBy: 'production', onArrival: { kind: 'hotel', cityId: booking.location }, ...(item.payload.by !== undefined ? { by: String(item.payload.by) } : {}) }) : undefined;
      if (!trip) {
        moveTo(s, person, booking.location);
        s.universe.currentZone = zoneOf(booking.location);
        person.stay = { kind: 'hotel', cityId: booking.location };
      }
      if (isPlayer(person)) s.notify({ category: 'career', title: `On Location In ${CITIES.require(booking.location).name}`, body: `The production ${trip ? 'is flying' : 'flew'} you out for ${role.label}, with a room of your own and a meal allowance each day.`, importance: 55, route: '/workspace/career' });
      return;
    }
    const home = person.home?.cityId ?? booking.cityId;
    const days = Math.round((item.at - Number(item.payload.outAt)) / MS_DAY) + 1;
    booking.perDiemOwed = (booking.perDiemOwed ?? 0) + days * usd(rateOn(LOCATION.perDiem, dayKey(item.at, zoneOf(booking.location))), cur);
    const flight = careerTrip(s, booking.location, home, s.now, 'back');
    if (!flight || !startCareerJourney(s, person, home, flight.day, flight.slot, { bookingId: booking.id, paidBy: 'production', ...(flight.by ? { by: flight.by } : {}) })) {
      moveTo(s, person, home);
      s.universe.currentZone = zoneOf(home);
      delete person.stay;
    }
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
    const odds = life?.kind === 'network' ? SERIES.renewal.network : season === 2 ? SERIES.renewal.svodFirst : SERIES.renewal.svod;
    const picked = season <= SERIES.maxSeasons && renewed(s, person, prior.id, odds);
    if (!picked) {
      feel(person, 'canceled');
      if (isPlayer(person)) s.notify({ category: 'career', title: 'Your Series Was Canceled', body: `${role.label}: the option wasn’t taken up. You’re free.`, importance: 80, route: '/workspace/career' });
      return;
    }
    const zone = zoneOf(workCityOf(prior));
    const rate = Math.round(rateOn(role.steps, dayKey(prior.starts, zone)) * (1 + SERIES.raise));
    const next: Booking = {
      // A year on, and never before the pickup's own lead: until 2026-09-27 a season
      // that had started in the spring was picked up in June to start in March,
      // its days already gone, and its first call "missed" at once.
      id: nextOwnId(career, 'b'), roleId: role.id, cityId: prior.cityId, starts: nextMonday(Math.max(prior.starts + SERIES.nextSeasonDays * MS_DAY, s.now + role.leadDays * MS_DAY) - 3 * MS_DAY, zone),
      units: prior.units, rehearsalWeeks: 0, status: 'offered', dueAt: s.now, offeredAt: s.now, worked: 0, owed: 0,
      rate: Math.max(rate, prior.rate ? Math.round(prior.rate * (1 + SERIES.raise)) : 0), season, seriesId: prior.seriesId ?? prior.id,
      ...(prior.location ? { location: prior.location } : {}),
    };
    career.bookings.push(next);
    takeJob(s, person, next, true);
    feel(person, 'pickedUp');
    if (isPlayer(person)) s.notify({ category: 'career', title: `Picked Up For Season ${season}`, body: `${role.label}: the option was taken up. The season starts ${formatDate(next.starts, zone)}, at ${formatMoney(usd(next.rate!, saveCurrency(s.universe)), saveCurrency(s.universe))} an episode.`, importance: 90, route: '/workspace/career' });
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
    // Joined first, so a job taken by choice that the bank can't join for
    // releases nothing. One they're bound to, a season picked up, never
    // fails on the fee: the union takes it from the pay, as a payroll
    // deduction. Until 2026-09-27 the fee was asked after the clashing job
    // was released, and a pickup the bank couldn't join for lost both.
    joinFor(s, person, role, bound, Math.max(1, Math.ceil(days.length / 5)));
    for (const other of career.bookings) {
      if (other.status !== 'accepted' || other.id === booking.id) continue;
      if (!jobsClash(person, booking, other)) continue;
      if (!bound) throw new CommandError(`It clashes with ${roleById(other.roleId).label}.`);
      other.status = 'released';
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one.payload.bookingId === other.id && (one.kind === WORK_KIND || ((one.kind === TRAVEL_KIND || one.kind === STAY_KIND) && one.payload.direction === 'out'))) s.timeline.cancel(one.id, s.now);
      sendHome(s, other);
      if (other.owed > 0) schedulePay(s, person, other, s.now + 60_000, true);
      if (isPlayer(person)) s.notify({ category: 'career', title: 'Released For Your Series', body: `${roleById(other.roleId).label} clashed with the series’ new season, which has you first.`, importance: 75, route: '/workspace/career' });
    }
    booking.status = 'accepted';
    career.lastBookedAt = s.now;
    const workCity = workCityOf(booking);
    // The production it is, its parts and who plays them (`makeProduction`, from 2026-10-08): a former classmate in another
    // part now and then, where one fits it and is free. Until then a classmate was cast as the player's own part.
    if (days.length) makeProduction(s, person, booking, role, workCity, days[0]!.at, days.at(-1)!.at, (craft) => auditionLevel(craft, role, 'room'), (i) => classmateBooked(s, person, i, role, days[0]!.at));
    const zone = zoneOf(workCity);
    for (const d of days) {
      s.schedule({
        at: d.at, kind: WORK_KIND,
        label: role.medium === 'screen' ? `On Set: ${role.label}` : role.medium === 'voice' ? `In The Booth: ${role.label}` : `${d.rehearsal ? 'Rehearsal' : 'Performance'}: ${role.label}`,
        category: 'career', priority: 34, requiresPlayer: true,
        durationMinutes: workMinutes(role, d.rehearsal),
        locationId: workCity, payload: { personId: person.id, bookingId: booking.id },
      });
    }
    // Out on the flight that lands in good time for the first call, from 2026-09-29 (`careerFlight`); where there's no flight, the day before at noon.
    const flightFrom = person.home?.cityId ?? person.currentLocationId;
    if (booking.location) {
      const flight = careerTrip(s, flightFrom, booking.location, days[0]!.at, 'out');
      const out = flight ? flight.legs[0]!.departAt : at(days[0]!.at, zone, -1, 12);
      s.schedule({ at: out, kind: TRAVEL_KIND, label: `Travel To ${CITIES.require(booking.location).name}`, category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'out', ...(flight ? { day: flight.day, slot: flight.slot, ...(flight.by ? { by: flight.by } : {}) } : {}) } });
      s.schedule({ at: at(days[days.length - 1]!.at, zone, 1, 12), kind: TRAVEL_KIND, label: 'Travel Home', category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'back', outAt: out } });
    }
    // A job in another city with no production travel: they go and stay, in a room of their own paying.
    const home = person.home?.cityId ?? person.currentLocationId;
    if (!booking.location && workCity !== home) {
      const flight = careerTrip(s, home, workCity, days[0]!.at, 'out', 'self');
      const out = flight ? flight.legs[0]!.departAt : at(days[0]!.at, zone, -1, 18);
      s.schedule({ at: out, kind: STAY_KIND, label: `To ${CITIES.require(workCity).name}`, category: 'career', priority: 30, payload: { personId: person.id, bookingId: booking.id, direction: 'out', back: at(days[days.length - 1]!.at, zone, 1, 12), ...(flight ? { day: flight.day, slot: flight.slot, ...(flight.by ? { by: flight.by } : {}) } : {}) } });
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
    // A wardrobe fitting the day before, where the union's rules pay one (`FITTING`).
    scheduleFitting(s, person, booking, days[0]!.at);
    closeDecision(s, booking.id);
    stillTakeable(s, person);
    if (isPlayer(person)) reportBooking(s, person, role);
  }

  sim.onCommand<{ bookingId: string }, { met: boolean }>('career.counter', (p, { sim: s }) => {
    const person = s.player;
    const booking = careerOf(person).bookings.find((b) => b.id === p?.bookingId);
    if (!booking) throw new CommandError('That isn’t an offer open to you.');
    const r = counterOffer(s, person, booking);
    if (typeof r === 'string') throw new CommandError(r);
    closeDecision(s, booking.id);
    presentOffer(s, person, booking);
    s.notify({ category: 'career', title: r.met ? 'They Came Up' : 'The Offer Stands', body: r.met ? `${roleById(booking.roleId).label}: they met you part of the way, at ${formatMoney(unitRate(booking, booking.starts, saveCurrency(s.universe)), saveCurrency(s.universe))}.` : `${roleById(booking.roleId).label}: the offer stands as it was.`, importance: 50, route: '/workspace/career' });
    return { met: r.met };
  });

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

  // A breakdown browsed and submitted for (from 2026-10-06): one of the week's submissions, for that part.
  sim.onCommand<{ roleId: string }, { submitted: number }>('career.submit_for', (p, { sim: s }) => {
    const roleId = String(p?.roleId);
    const no = submitForRefusal(s, s.player, roleId);
    if (no) throw new CommandError(no);
    const career = careerOf(s.player);
    career.chosen = [...(career.chosen ?? []), breakdownsOf(s, s.player).find((b) => b.roleId === roleId)!];
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
    if (!payForWork(s, person, inMoney(site.price, siteMoney(p.site), cur), `${site.label}, a year`)) throw new CommandError(`A year is ${formatMoney(inMoney(site.price, siteMoney(p.site), cur), cur)}, which the bank can’t cover.`);
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

  sim.onCommand<{ footage?: string[] }, { at: Instant; band: Band }>('career.reel', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    // Footage: what's filmed and can be used (`footageOf`); the pieces chosen, or, none chosen, every usable piece.
    const all = footageFor(person);
    const usable = all.filter((f) => !footageRefusal(f));
    if (!usable.length) throw new CommandError(all.length ? footageRefusal(all[0]) ?? 'None of your footage can go on a reel.' : 'A reel is cut from footage, and you have none: a screen credit, a self-tape from class, or the school’s film monologue.');
    const ids = Array.isArray(p?.footage) && p!.footage!.length ? p!.footage!.map(String) : usable.map((f) => f.id);
    if (ids.length > 4) throw new CommandError('A reel is short: four pieces at most.');
    for (const id of ids) { const no = footageRefusal(all.find((f) => f.id === id)); if (no) throw new CommandError(no); }
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.reel, cur), 'A reel, edited')) throw new CommandError(`An edit is ${formatMoney(usd(WORK_COSTS.reel, cur), cur)}, which the bank can’t cover.`);
    career.reelAt = s.now;
    const band = reelBand(ids.map((id) => all.find((f) => f.id === id)!.band));
    career.reelCut = { at: s.now, ids, band };
    return { at: s.now, band };
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

  // An improv course: eight Tuesday evenings where you live and work.
  sim.onCommand<Record<string, never>, { first: Instant }>('career.improv', (_p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    if (career.since === undefined && !summerOf(person, s.now)) throw new CommandError('School is your class for now; a course waits for the summer or the degree.');
    if (career.improv) throw new CommandError('You’re in a course.');
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.improv, cur), 'An improv course, eight weeks')) throw new CommandError(`The course is ${formatMoney(usd(WORK_COSTS.improv, cur), cur)}, which the bank can’t cover.`);
    const city = workCity(person);
    const first = nextDayAt(s.now, zoneOf(city), 2, 19);
    for (let n = 0; n < WORK_COSTS.improvWeeks; n += 1) {
      s.schedule({ at: at(first, zoneOf(city), 7 * n, 19), kind: IMPROV_KIND, label: `Improv Class ${n + 1} Of ${WORK_COSTS.improvWeeks}`, category: 'career', priority: 34, requiresPlayer: true, durationMinutes: 180, locationId: city, payload: { personId: person.id, cityId: city } });
    }
    career.improv = { left: WORK_COSTS.improvWeeks };
    return { first };
  });

  sim.onSchedule(IMPROV_KIND, (item, s) => {
    const person = personOf(item);
    const career = person ? careerOf(person) : undefined;
    if (!person || !career?.improv) return;
    career.improv.left -= 1;
    if (career.improv.left <= 0) delete career.improv;
    if (!reaches(s, person, item.at, String(item.payload.cityId), 'an improv class')) { item.status = 'missed'; return; }
    // On your feet in front of a room, with nothing prepared.
    nudge(s, person, 'composure', ATTRIBUTES.build.improvSession.composure, true);
    nudge(s, person, 'presence', ATTRIBUTES.build.improvSession.presence, true);
    if (person.craft) grow(person.craft, 'improv', focusOf(person));
    enjoyWork(person, { medium: 'stage', away: false, rehearsal: true, crafts: CRAFTS_AT.improv });
  });

  // A casting director workshop: an evening's cold reading for one office.
  sim.onCommand<Record<string, never>, { at: Instant }>('career.workshop', (_p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    if (career.since === undefined && !summerOf(person, s.now)) throw new CommandError('While classes are in session, the school’s work comes first.');
    if (s.universe.scheduled.some((i) => i.kind === WORKSHOP_KIND && i.status === 'pending' && i.payload.personId === person.id)) throw new CommandError('You have one booked.');
    const cur = saveCurrency(s.universe);
    const city = workCity(person);
    const w = workshopPrice(s, city);
    if (!payForWork(s, person, w.price, w.venue ? `${w.venue}, a casting director workshop` : 'A casting director workshop')) throw new CommandError(`A workshop is ${formatMoney(w.price, cur)}, which the bank can’t cover.`);
    const when = nextDayAt(s.now, zoneOf(city), 4, 19);
    s.schedule({ at: when, kind: WORKSHOP_KIND, label: 'Casting Director Workshop', category: 'career', priority: 34, requiresPlayer: true, durationMinutes: 180, locationId: city, payload: { personId: person.id, cityId: city } });
    return { at: when };
  });

  sim.onSchedule(WORKSHOP_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    if (!reaches(s, person, item.at, String(item.payload.cityId), 'a workshop')) { item.status = 'missed'; return; }
    // A cold read in front of the office: known to it after, and the nerves of it; the office kept as a casting contact (from 2026-10-03).
    const offices = CASTING_OFFICES[String(item.payload.cityId)];
    if (offices?.length) { const office = offices[Math.floor(s.rng('career.workshop_office', person.id, String(item.at)).next() * offices.length)]!; const c = careerOf(person); (c.castingContacts ??= []).push({ office, cityId: String(item.payload.cityId), at: item.at }); }
    nerves(s, person, 'audition');
    earn(s, person, ATTRIBUTES.build.workshop);
    if (person.craft) grow(person.craft, 'coldReading', focusOf(person));
    enjoyCrafts(person, CRAFTS_AT.room);
  });

  sim.onCommand<{ on: boolean }, { on: boolean }>('career.publicist', (p, { sim: s }) => {
    const person = s.player;
    const career = careerOf(person);
    if (p.on !== true) {
      if (!career.publicist) throw new CommandError('You have no publicist.');
      delete career.publicist;
      return { on: false };
    }
    if (career.publicist) throw new CommandError('You have a publicist.');
    const no = publicistRefusal(person);
    if (no) throw new CommandError(no);
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.publicistMonthly, cur), 'A publicist, the month')) throw new CommandError(`A month is ${formatMoney(usd(WORK_COSTS.publicistMonthly, cur), cur)}, which the bank can’t cover.`);
    career.publicist = { paidFor: monthOf(s.now, s.homeZone) };
    nudge(s, person, 'recognition', publicityFor(s, person, s.now));
    return { on: true };
  });

  // Television seen: recognition by its audience.
  sim.onSchedule(PRESS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const role = roleById(String(item.payload.roleId));
    // Kept, it's in the trades; missed, nothing comes of it, the contract asking no more than reasonable availability.
    if (person.currentLocationId !== item.payload.cityId) return;
    report(s, person, 'Press Day', `${person.displayName} talks ${role.label} with the press`, 'you');
  });

  sim.onSchedule(AIRS_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const role = roleById(String(item.payload.roleId));
    nudge(s, person, 'recognition', recognitionFrom(role) * Number(item.payload.audience ?? 1));
    // The finished episodes, seen: what the edit, the score and the effects made of the days.
    enjoyCrafts(person, CRAFTS_AT.seen);
    if (isPlayer(person) && (role.series || role.arc)) s.notify({ category: 'career', title: `It’s On: ${role.label}`, body: `The episodes you made are airing now.`, importance: 45, route: '/workspace/career' });
  });

  sim.onSchedule(FESTIVAL_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const role = roleById(String(item.payload.roleId));
    const f = ATTRIBUTES.build.festival;
    // A film booked before 2026-09-28 went to Tribeca, or to a studio's premiere.
    const road = String(item.payload.road ?? (item.payload.studio === true ? 'studio' : 'tribeca')) as 'studio' | 'tribeca' | 'brooklyn' | 'streaming';
    const worth = road === 'studio' ? 1 : FILM_ROAD.worth[road];
    if (road === 'streaming') {
      // Straight to streaming: seen, without a premiere to be at.
      nudge(s, person, 'recognition', recognitionFrom(role) * worth);
      enjoyCrafts(person, CRAFTS_AT.seen);
      if (isPlayer(person)) s.notify({ category: 'career', title: 'Your Film Went To Streaming', body: `${role.label} didn’t get into Tribeca or Brooklyn, and was released straight to streaming.`, importance: 50, route: '/workspace/career' });
      return;
    }
    const full = (road === 'studio' ? f.studio : f.indie) * worth;
    const there = present(person, item.at, item.locationId);
    // The film premieres either way, and its audience sees the work; the room sees the actor only if they came.
    nudge(s, person, 'recognition', recognitionFrom(role) * worth + (there ? full : full * f.absent));
    if (there) {
      earn(s, person, f.reputation);
      // In the house for the finished film, and at a festival the festival.
      enjoyCrafts(person, road === 'studio' ? CRAFTS_AT.seen : [...CRAFTS_AT.seen, ...CRAFTS_AT.festival]);
    } else item.status = 'missed';
    const where = road === 'brooklyn' ? ' at the Brooklyn Film Festival' : road === 'tribeca' ? ' at Tribeca' : '';
    if (isPlayer(person)) s.notify({ category: 'career', title: there ? 'Your Film Premiered' : 'Your Film Premiered Without You', body: there ? `${role.label} premiered${where}, and you walked the carpet and did the press line.` : `${role.label} premiered${where}, and you weren’t there for the press.`, importance: 60, route: '/workspace/career' });
  });

  sim.onCommand<{ bookingId: string }, { rate: number }>('career.t1287', (p, { sim: s }) => {
    const person = s.player;
    const booking = careerOf(person).bookings.find((b) => b.id === p.bookingId);
    if (!booking) throw new CommandError('There’s no such job.');
    const quote = t1287Quote(s, person, booking);
    if ('refused' in quote) throw new CommandError(quote.refused);
    booking.t1287Rate = quote.rate;
    return { rate: quote.rate };
  });

  /** A coaching session, the hour its price is for (`WORK_COSTS.coach`). */
  const COACH_MINUTES = 60;
  sim.onCommand<{ auditionId: string }, { coached: true }>('career.coach', (p, { sim: s }) => {
    const person = s.player;
    const audition = careerOf(person).auditions.find((a) => a.id === p.auditionId);
    if (!audition || audition.status !== 'ahead') throw new CommandError('That audition isn’t ahead.');
    if (audition.coached) throw new CommandError('You’ve worked on it already.');
    // The hour is spent with the coach, from 2026-10-03: not while something else holds you (`occupiedAt`).
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    const cur = saveCurrency(s.universe);
    if (!payForWork(s, person, usd(WORK_COSTS.coach, cur), `A coach, for ${roleById(audition.roleId).label}`)) throw new CommandError(`An hour is ${formatMoney(usd(WORK_COSTS.coach, cur), cur)}, which the bank can’t cover.`);
    s.advanceTo(s.now + COACH_MINUTES * 60_000);
    audition.coached = true;
    return { coached: true };
  });

  sim.onCommand<{ cityId: string; kind: Housing }, { cityId: string }>('career.relocate', (p, { sim: s }) => {
    const person = s.player;
    const home = homeTownOf(person);
    if (![...CAREER_CITIES, YALE_DRAMA.cityId, ...(home ? [home] : [])].includes(p.cityId as CareerCity)) throw new CommandError(`New York, Los Angeles, London, Dublin, Mexico City or New Haven${home ? `, or home to ${CITIES.require(home).name}` : ''}.`);
    if (person.currentLocationId === p.cityId && person.home?.cityId === p.cityId && person.home.kind === p.kind) throw new CommandError('You live there already.');
    // Until 2026-09-27 a student could move to Los Angeles mid-term, and miss every class after.
    const school = person.school;
    if (p.cityId !== YALE_DRAMA.cityId && school && school.standing !== 'dismissed' && school.standing !== 'graduated' && !summerOf(person, s.now)) throw new CommandError('Classes are in New Haven while the term is on; a move away waits for the summer or the degree.');
    // Away on a job, the move waits for home; a home being bought to live in is where they're moving already.
    if (person.home && person.currentLocationId !== person.home.cityId && working(s, person)) throw new CommandError('You’re away on a job: move when you’re home.');
    if (person.buying?.live && person.buying.cityId !== p.cityId) throw new CommandError(`You’re buying a home to live in, in ${CITIES.get(person.buying.cityId)?.name ?? 'another town'}: call it off first.`);
    // Across a border it's a move abroad: the papers to go and the right to live there, and the flight, one way.
    const from = person.home?.cityId ?? person.currentLocationId;
    if (isoOfCity(from) !== isoOfCity(p.cityId)) {
      const no = crossingRefusal(person, person.currentLocationId, p.cityId, s.now + MS_DAY, 30) ?? residenceRefusal(person, p.cityId, s.now);
      if (no) throw new CommandError(no);
      const legs = planJourney(s, person.currentLocationId, p.cityId, s.now + MS_DAY, 1, 2);
      if (typeof legs === 'string') throw new CommandError(legs);
      const fare = legs.reduce((a, l) => a + l.fare, 0);
      if (!payFromBank(s, person, fare, `The flight to ${CITIES.require(p.cityId).name}, one way, with two bags`, 'travel')) throw new CommandError(`The flight, ${formatMoney(fare, saveCurrency(s.universe))}, is more than the bank can cover.`);
      if (isoOfCity(p.cityId) === isoOfCountry(person.citizenshipId)) person.returnedHomeAt = s.now;
    }
    // A home of their own there, empty, is where they go.
    const own = emptyHomeIn(person, p.cityId);
    if (own) { moveIntoOwned(s, person, own); s.universe.currentZone = zoneOf(p.cityId); return { cityId: p.cityId }; }
    moveTo(s, person, p.cityId);
    s.universe.currentZone = zoneOf(p.cityId);
    // A move the bank can't pay for throws, and the command's rollback puts them back where they were.
    move(s, person, p.kind);
    return { cityId: p.cityId };
  });

  /** A union's membership where a job needs it: SAG-AFTRA's after thirty days eligible, Equity's on the first contract. */
  function joinFor(s: Simulation, person: Person, role: Role, bound = false, weeks = 1): void {
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
      armDues(s, person);
    } else if (role.union === 'actra') {
      const actra = career.unions.actra;
      // Short of full membership, ACTRA's work permit, a week of the job (`ACTRA`); one who isn't Canadian pays less after the first.
      if (role.permitWeekly && actra?.fullAt === undefined) {
        const canadian = citizenOf(person, 'CA');
        const dollars = canadian ? role.permitWeekly * weeks : role.permitWeekly + ACTRA.permitAfterFirstForeign * (weeks - 1);
        pay(inMoney(dollars * 100, ACTRA.currency, cur), 'ACTRA work permit', `ACTRA’s work permit, ${formatMoney(inMoney(dollars * 100, ACTRA.currency, cur), cur)}, is more than the bank can cover.`);
      }
      if (!actra) {
        const fee = inMoney(ACTRA.apprentice, ACTRA.currency, cur);
        pay(fee, 'ACTRA apprentice fee', `An ACTRA engagement makes you an apprentice, for ${formatMoney(fee, cur)}, which the bank can’t cover.`);
        career.unions.actra = { joinedAt: s.now, credits: 1 };
        armDues(s, person);
        return;
      }
      if (actra.fullAt !== undefined) return;
      actra.credits += 1;
      if (actra.credits < ACTRA.credits) return;
      // The apprentice fee paid comes off the initiation fee.
      const fee = inMoney(ACTRA.initiation - ACTRA.apprentice + Math.round(ACTRA.basicDues / 2), ACTRA.currency, cur);
      pay(fee, 'ACTRA initiation fee and dues', `A third ACTRA credit makes you a full member, for ${formatMoney(fee, cur)}, which the bank can’t cover.`);
      actra.fullAt = s.now;
      armDues(s, person);
    } else if (role.union === 'equity' && !career.unions.equity) {
      const fee = usd(EQUITY.initiationNow + Math.round(EQUITY.basicDues / 2), cur);
      pay(fee, 'Actors’ Equity initiation fee and dues', `An Equity contract makes you a member, for ${formatMoney(fee, cur)} now, which the bank can’t cover.`);
      career.unions.equity = { joinedAt: s.now, initiationPaid: EQUITY.initiationNow };
      armDues(s, person);
    }
  }
}

/**
 * A job that ended early on location or in another city sends them home the
 * next day, as a production does, rather than at the day the job would have
 * ended. Until 2026-09-27 an actor fired from a series in Vancouver stayed
 * there four months, and one released for a series' new season had the
 * journey home taken off the calendar with the rest.
 */
export function sendHome(sim: Simulation, booking: Booking): void {
  for (const one of sim.universe.scheduled) {
    if (one.status !== 'pending' || one.payload.bookingId !== booking.id || one.payload.direction !== 'back' || (one.kind !== TRAVEL_KIND && one.kind !== STAY_KIND)) continue;
    const tomorrow = sim.now + MS_DAY;
    if (one.at > tomorrow) sim.timeline.reschedule(one.id, tomorrow);
  }
}

/**
 * Forty bookings kept, the oldest finished ones making room, and never one
 * with anything still to come. Until 2026-09-27 the list was cut at forty
 * whatever was in it, and a job still running or a season under option
 * could be cut with the rest.
 */
export function pruneBookings(sim: Simulation, person: Person): void {
  const career = careerOf(person);
  for (let i = 0; career.bookings.length > 40 && i < career.bookings.length;) {
    const old = career.bookings[i]!;
    const done = old.status !== 'offered' && old.status !== 'accepted' && career.option?.seriesId !== (old.seriesId ?? old.id);
    if (done && !sim.universe.scheduled.some((one) => one.status === 'pending' && one.payload.bookingId === old.id)) career.bookings.splice(i, 1);
    else i += 1;
  }
}

/** The next union bill, on the first of May or November at nine, unless one is on the calendar already. */
function armDues(sim: Simulation, person: Person): void {
  if (sim.universe.scheduled.some((i) => i.kind === DUES_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  const p = zonedParts(sim.now, sim.homeZone);
  let year = p.year;
  let month = p.month < 5 ? 5 : p.month < 11 ? 11 : 5;
  if (p.month >= 11) year += 1;
  let when = instantFromZoned({ year, month, day: 1, hour: 9 }, sim.homeZone);
  // On the first itself, before nine: this one.
  if (when <= sim.now) { month = month === 5 ? 11 : 5; if (month === 5) year += 1; when = instantFromZoned({ year, month, day: 1, hour: 9 }, sim.homeZone); }
  sim.schedule({ at: when, kind: DUES_KIND, label: 'Union Dues', category: 'career', priority: 20, payload: { personId: person.id } });
}

/**
 * Why an offer can't be taken by choice now, or nothing where it can: a
 * student's term, a school call or showcase in its hours, another series'
 * option, or a job already taken that it clashes with. `career.accept`
 * refuses on it, and the offer on Home and on the Career screen says it.
 */
/**
 * The offers still open, asked again once a job is taken: one it now clashes
 * with says why, and offers only a pass. Until 2026-09-28 an offer kept the
 * Take It it was raised with, and the command refused it.
 */
export function stillTakeable(sim: Simulation, person: Person): void {
  for (const other of careerOf(person).bookings) {
    if (other.status !== 'offered') continue;
    const cannot = acceptRefusal(sim, person, other);
    if (!cannot) continue;
    for (const d of Object.values(sim.universe.decisions)) {
      if (d.resolvedAt || d.refType !== 'booking' || d.refId !== other.id || !d.actions.some((x) => x.commandKind === 'career.accept')) continue;
      d.actions = d.actions.filter((x) => x.commandKind !== 'career.accept');
      d.detail = `${d.detail.replace(/ Answer by .*$/, '')} You can’t take it now: ${cannot}`;
    }
  }
}

export function acceptRefusal(sim: Simulation, person: Person, booking: Booking): string | undefined {
  const career = careerOf(person);
  if (career.since === undefined) {
    const summer = summerOf(person, sim.now);
    const days = workDays(booking);
    if (!summer || days[days.length - 1]!.at >= summer.until) return 'It runs into the fall term, and the school’s work comes first while classes are in session.';
  }
  const called = schoolClash(sim, person, booking);
  if (called) return `It clashes with ${called.label}, ${formatDateTime(called.at, sim.homeZone)}.`;
  const role = roleById(booking.roleId);
  if (role.series && career.option && career.option.seriesId !== (booking.seriesId ?? booking.id)) return 'Another series holds an option on you until it’s decided.';
  const other = career.bookings.find((b) => b.status === 'accepted' && b.id !== booking.id && jobsClash(person, booking, b));
  if (other) return `It clashes with ${roleById(other.roleId).label}.`;
  return borderRefusal(person, booking);
}

/**
 * A job across a border: why the actor couldn't go on its travel day, or
 * come home after, with the papers they hold, or nothing. Until 2026-09-29 a
 * production in London, Vancouver or Toronto flew an actor out with no
 * passport asked.
 */
export function borderRefusal(person: Person, booking: Booking): string | undefined {
  const home = person.home?.cityId ?? person.currentLocationId;
  const city = workCityOf(booking);
  const days = workDays(booking);
  const zone = zoneOf(city);
  const out = at(days[0]!.at, zone, -1, 12);
  const back = at(days[days.length - 1]!.at, zone, 1, 12);
  // Coming home, they come to where they live on the papers they live there on, not as a visitor.
  return crossingRefusal(person, home, city, out, (back - out) / MS_DAY) ?? crossingRefusal(person, city, home, back, 1)
    ?? workRefusal(person, city, days[0]!.at, days[days.length - 1]!.at, booking);
}

/** Turned away at the border on the travel day: the production recasts, and the days worked are paid. */
function turnedBack(sim: Simulation, person: Person, booking: Booking, why: string): void {
  booking.status = 'released';
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.payload.bookingId === booking.id) sim.timeline.cancel(one.id, sim.now);
  if (booking.owed > 0) schedulePay(sim, person, booking, sim.now + 60_000, true);
  feel(person, 'recast');
  if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'Turned Back At The Border', body: `${roleById(booking.roleId).label} went to somebody else: you couldn’t travel. ${why}`, importance: 90, route: '/workspace/papers' });
}

/**
 * Whether two jobs can't both be worked. In one city, a call of one inside
 * another's hours. In two, the days away from home, a day either side of a
 * job away for the journey, overlapping. Until 2026-09-27 only the calls'
 * start times were compared, so a 7 a.m. commercial in New York didn't clash
 * with a location shoot in Chicago at eight the same morning, both were
 * taken, and the film was lost.
 */
export function jobsClash(person: Person, a: Booking, b: Booking): boolean {
  const calls = (x: Booking) => { const role = roleById(x.roleId); return workDays(x).map((d) => [d.at, d.at + workMinutes(role, d.rehearsal) * 60_000] as const); };
  const ca = calls(a);
  const cb = calls(b);
  if (workCityOf(a) === workCityOf(b)) return ca.some(([s, e]) => cb.some(([s2, e2]) => s < e2 && s2 < e));
  const home = person.home?.cityId ?? person.currentLocationId;
  const pad = (x: Booking) => (x.location !== undefined || workCityOf(x) !== home ? MS_DAY : 0);
  return ca[0]![0] - pad(a) < cb[cb.length - 1]![1] + pad(b) && cb[0]![0] - pad(b) < ca[ca.length - 1]![1] + pad(a);
}

/** How long a job's day holds the actor: a screen day twelve hours, a voice session its hours, a stage rehearsal eight and a performance three. */
function workMinutes(role: Role, rehearsal: boolean): number {
  return role.medium === 'screen' ? 720 : role.medium === 'voice' ? (role.sessionHours ?? 4) * 60 : rehearsal ? 480 : 180;
}

/**
 * The first school call, Summer Cabaret night or showcase a job would keep
 * the actor from: in another city, anything from the day before the work to
 * the day after it; at home, anything in its hours. Until 2026-09-27 a
 * student could take a job over the Summer Cabaret's run, and the calendar
 * flagged it but Take It didn't, and the company dropped them.
 */
export function schoolClash(sim: Simulation, person: Person, booking: Booking): ScheduledItem | undefined {
  const days = workDays(booking);
  const role = roleById(booking.roleId);
  const home = person.home?.cityId ?? person.currentLocationId;
  const away = booking.location !== undefined || workCityOf(booking) !== home;
  const spans: [Instant, Instant][] = away
    ? [[days[0]!.at - MS_DAY, days[days.length - 1]!.at + 2 * MS_DAY]]
    : days.map((d) => [d.at, d.at + workMinutes(role, d.rehearsal) * 60_000]);
  return sim.universe.scheduled
    .filter((i) => i.status === 'pending' && i.requiresPlayer && i.payload.personId === person.id && (i.kind.startsWith('school.') || i.kind === SHOWCASE_KIND))
    .sort((a, b) => a.at - b.at)
    .find((i) => spans.some(([a, b]) => i.at < b && a < i.at + Math.max(60_000, (i.durationMinutes ?? 0) * 60_000)));
}

/** Whether another job has a call ahead in a city, which keeps the actor there. */
function stillWorkingIn(sim: Simulation, person: Person, cityId: string, except: string): boolean {
  return sim.universe.scheduled.some((i) => i.kind === WORK_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.bookingId !== except && i.locationId === cityId);
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
  // ACTRA's: a full member's basic dues, half each May and November; an
  // apprentice's $75 renewal each May, from a year after joining.
  const actra = career.unions.actra;
  if (actra?.fullAt !== undefined) {
    const half = Math.round(ACTRA.basicDues / 2);
    total += inMoney(half, ACTRA.currency, cur);
    const by = (actra.duesBy ??= {});
    by[year] = (by[year] ?? 0) + half;
  } else if (actra && month === 5 && sim.now - actra.joinedAt >= 335 * MS_DAY) total += inMoney(ACTRA.apprentice, ACTRA.currency, cur);
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
  const base = { id: nextOwnId(career, 'r'), bookingId: booking.id, roleId: role.id, perEpisode, episodes, days: booking.worked, workCity: workCityOf(booking) };
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
  const account = payeeAccount(sim, person);
  const cur = saveCurrency(sim.universe);
  const zone = sim.homeZone;
  const amount = residualAmount(residual, stream, n, when, zone, cur);
  const role = roleById(residual.roleId);
  const next = (at: Instant) => sim.schedule({ at, kind: RESIDUAL_KIND, label: `Residuals: ${role.label}`, category: 'career', priority: 20, payload: { personId: person.id, residualId: residual.id, stream, n: n + 1 } });
  // The streams that go on: syndication and streaming each year, a film's while it earns a dollar.
  if (stream === 'syndication' && n < 20) next(when + 365 * MS_DAY);
  if (stream === 'svod' && n < 20) next(when + 365 * MS_DAY);
  if (stream === 'film' && amount >= 1_00 && n < 20) next(when + 365 * MS_DAY);
  if (amount <= 0) return;
  // Wages, with tax withheld as a paycheck's. An agency commissions a commercial's use fees, not television's residuals.
  const year = zonedParts(when, zone).year;
  const before = yearOf(person, year).acting;
  const money = { currency: saveCurrency(sim.universe) };
  const withheld = computeAnnualTax(before + amount, homeOf(person), when, money).total - computeAnnualTax(before, homeOf(person), when, money).total;
  const commission = stream === 'cycle' && person.career?.agencyId ? Math.round(amount * AGENT_COMMISSION.rate) : 0;
  // Canada taxes residuals from work done there, at the same 23%.
  const foreign = residual.workCity && CITIES.get(residual.workCity)?.countryId === 'ca' ? foreignWithholding(person, residual.workCity, amount, when, cur) : 0;
  recordWages(person, when, zone, { gross: amount, withheld, commission, sag: true, residual: true, ...(foreign || residual.workCity ? { where: residual.workCity, foreignWithheld: foreign } : {}) });
  if (residual.kind === 'commercial') recordCommercialPay(person, when, amount);
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
