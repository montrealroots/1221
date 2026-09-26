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
import { MS_DAY, formatDate, formatDateTime, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax } from '../content/tax';
import {
  AGENCIES, AGENT_COMMISSION, CAREER_CITIES, EQUITY, ROLES, SAG_AFTRA, SHOWCASE_2029, rateOn,
  type Agency, type CareerCity, type Role,
} from '../content/career';
import { YALE_DRAMA } from '../content/school';
import { meanCraft, focusOf, type Craft } from './school';
import { move, payFromCurrent, type Housing } from './household';

export const SHOWCASE_KIND = 'career.showcase';
export const CAREER_WEEK_KIND = 'career.week';
export const AUDITION_KIND = 'career.audition';
export const OFFER_KIND = 'career.offer';
export const LAPSE_KIND = 'career.lapse';
export const WORK_KIND = 'career.work';
export const PAY_KIND = 'career.pay';

/** SLATE's estimates of what the business doesn't publish, each named where it's used. */
export const ESTIMATE = {
  /** How long an agency's offer of representation stands, and a booking's. */
  representationOfferDays: 30,
  bookingOfferDays: 2,
  /** How a showing reads: acting counts as much as every other area together. */
  showcaseActingWeight: 0.5,
  /** How much of a showing tiredness can take: at no readiness at all, a fifth. It took it all until 2026-09-26, and the class's best actor, tired at five, read at 58 and no big agency looked. */
  showcaseTiredness: 0.2,
  /** The chance an agency whose bar the showing clears wants the actor. */
  agencyInterest: 0.6,
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
  status: 'offered' | 'accepted' | 'passed' | 'lapsed' | 'worked' | 'fired';
  dueAt: Instant;
  offeredAt: Instant;
  /** Days worked, and of them not yet paid. */
  worked: number;
  owed: number;
  /** Weeks paid, on stage, so rehearsal weeks are commissioned at their rate. */
  weeksPaid: number;
}

export interface Offer { agencyId: string; cityId: CareerCity; until: Instant }

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
  };
  /** Wages by calendar year: gross, withheld for tax, and under SAG-AFTRA, for the payroll's year-to-date and the work dues. */
  wages: Record<string, { gross: Money; withheld: Money; sag: Money }>;
  /** Self-submissions this week, waiting on Monday. */
  submitted: number;
  /** When the business began for them: the school's hold let go. */
  since?: Instant;
  /** The last dues period billed, `YYYY-M`. */
  duesBilled?: string;
  /** The last id given an audition or a booking. */
  seq: number;
}

const nextOwnId = (career: CareerRecord, prefix: string) => `${prefix}${(career.seq += 1)}`;

export function careerOf(person: Person): CareerRecord {
  person.career ??= { showcases: [], offers: [], missed: 0, auditions: [], bookings: [], credits: [], unions: {}, wages: {}, submitted: 0, seq: 0 };
  return person.career;
}

export const roleById = (id: string): Role => {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`No role kind ${id}.`);
  return role;
};
export const agencyById = (id: string): Agency | undefined => AGENCIES.find((a) => a.id === id);

const zoneOf = (cityId: string) => CITIES.require(cityId).timeZone;
const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
const dayKey = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const weekday = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); };
const at = (from: Instant, zone: string, days: number, hour: number) => { const p = zonedParts(from, zone); return instantFromZoned({ year: p.year, month: p.month, day: p.day + days, hour }, zone); };

/** Where the business is for them: the agency's city, or where they live if it's one of the two, or New York. */
export function workCity(person: Person): CareerCity {
  if (person.career?.agencyCity) return person.career.agencyCity;
  return (CAREER_CITIES as readonly string[]).includes(person.currentLocationId) ? (person.currentLocationId as CareerCity) : 'us-ny-newyork';
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
export function offersFor(sim: Simulation, person: Person, score: number, key: string): string[] {
  const rng = sim.rng('career.offers', person.id, key);
  return AGENCIES.filter((agency) => rng.next() < ESTIMATE.agencyInterest && score >= agency.bar).map((a) => a.id);
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
  return role.medium === 'screen' ? (craft.acting * 2 + craft.screen) / 3 : (craft.acting * 2 + craft.voice + craft.text) / 4;
}

/** A booking's chance at an audition: at the part's bar, more above and less below, less tired, and less on tape. */
export function bookingChance(craft: Craft, role: Role, focus: number, mode: 'tape' | 'room'): number {
  const raw = ESTIMATE.bookAtBar + ESTIMATE.bookPerPoint * (levelFor(craft, role) - role.bar);
  const chance = Math.min(ESTIMATE.bookCeiling, Math.max(ESTIMATE.bookFloor, raw)) * Math.min(1.1, focus);
  return mode === 'tape' ? chance * ESTIMATE.tapeFactor : chance;
}

/** Whether an audition books (`career.booking`). */
export function books(sim: Simulation, person: Person, audition: Audition, focus: number): boolean {
  return sim.rng('career.booking', person.id, audition.id).next() < bookingChance(person.craft!, roleById(audition.roleId), focus, audition.mode);
}

/** A week's auditions (`career.auditions`): the agency's, a Poisson count by its reach, and the submissions that came back. */
export function weekOfAuditions(sim: Simulation, person: Person, weekStart: Instant, agency: Agency | undefined, cityId: CareerCity, submitted: number): Omit<Audition, 'id' | 'status'>[] {
  const rng = sim.rng('career.auditions', person.id, String(weekStart));
  let count = 0;
  if (agency) {
    const limit = Math.exp(-agency.auditionsPerWeek);
    for (let p = rng.next(); p > limit; p *= rng.next()) count += 1;
  }
  let self = 0;
  for (let n = 0; n < submitted; n += 1) if (rng.next() < ESTIMATE.selfSubmitCallback) self += 1;
  const pick = (open: readonly Role[]) => {
    let x = rng.next() * open.reduce((sum, r) => sum + r.weight, 0);
    for (const r of open) { x -= r.weight; if (x <= 0) return r; }
    return open[open.length - 1]!;
  };
  const here = ROLES.filter((r) => r.cities.includes(cityId));
  const sent = here.filter((r) => agency !== undefined && r.tiers.includes(agency.tier));
  const open = here.filter((r) => r.selfSubmit);
  const zone = zoneOf(cityId);
  const out: Omit<Audition, 'id' | 'status'>[] = [];
  for (let n = 0; n < count + self; n += 1) {
    const mine = n >= count;
    const role = pick(mine ? open : sent);
    const when = at(weekStart, zone, Math.floor(rng.next() * 5), 10 + Math.floor(rng.next() * 7));
    out.push({ roleId: role.id, at: when, mode: rng.next() < ESTIMATE.tapeShare ? 'tape' : 'room', cityId, ...(mine ? { self: true } : {}) });
  }
  return out;
}

function present(person: Person, when: Instant, cityId?: string): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  return !asleep && (cityId === undefined || person.currentLocationId === cityId);
}

/**
 * A booking's calls, from its start: on screen, consecutive weekdays at
 * seven; on stage, rehearsal days, Tuesday to Sunday at eleven, then
 * performances, Tuesday to Sunday at half past seven. Each carries the week
 * it's in, counted from the start.
 */
export function workDays(booking: Booking): { at: Instant; week: number; rehearsal: boolean }[] {
  const role = roleById(booking.roleId);
  const zone = zoneOf(booking.cityId);
  const out: { at: Instant; week: number; rehearsal: boolean }[] = [];
  if (role.medium === 'screen') {
    for (let d = 0; out.length < booking.units; d += 1) {
      const when = at(booking.starts, zone, d, 7);
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
export function paycheck(opts: { scale: Money; role: Role; rehearsal: boolean; represented: boolean; before: Money; cityId: string; at: Instant }) {
  const { scale, role, rehearsal, represented, before, cityId } = opts;
  const agentRate = role.union === 'equity' && rehearsal ? AGENT_COMMISSION.equityRehearsalRate : AGENT_COMMISSION.rate;
  const gross = represented && role.union === 'sag' ? Math.round(scale * (1 + AGENT_COMMISSION.rate)) : scale;
  const commission = !represented ? 0 : role.union === 'sag' ? gross - scale : Math.round(scale * agentRate);
  const dues = role.union === 'equity' ? Math.round(gross * EQUITY.workingDues) : 0;
  const withheld = computeAnnualTax(before + gross, cityId, opts.at).total - computeAnnualTax(before, cityId, opts.at).total;
  return { gross, commission, dues, withheld, net: gross - commission - dues - withheld };
}

function bankAccount(sim: Simulation, person: Person): Account | undefined {
  const a = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  return a && !a.closedAt ? a : undefined;
}

/** Days worked, on any job, in the window before a moment. */
export function daysWorkedIn(sim: Simulation, person: Person, days: number): number {
  const from = sim.now - days * MS_DAY;
  return sim.universe.scheduled.filter((i) => i.kind === WORK_KIND && i.payload.personId === person.id && i.status === 'done' && i.at >= from && i.at <= sim.now).length;
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
    const offers = focus > 0 && !career.agencyId ? offersFor(s, person, score, cityId) : [];
    const city = CITIES.require(cityId).name;
    if (offers.length) { offerRepresentation(s, person, offers, cityId, `After the showcase in ${city},`); return; }
    if (isPlayer(person) && !career.agencyId) {
      s.notify({ category: 'money', title: focus > 0 ? `No Offers From ${city}` : `You Missed The Showcase In ${city}`, body: focus > 0 ? 'Nobody in the room offered to represent you. You can still submit yourself for work, and an agency can come later.' : 'Asleep through it, you weren’t seen.', importance: 80, route: '/workspace/career' });
    }
  });

  sim.onSchedule(CAREER_WEEK_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.craft) return;
    const career = careerOf(person);
    career.offers = career.offers.filter((o) => o.until > s.now);
    if (career.agencyId && career.signedAt !== undefined) {
      const since = Math.max(career.signedAt, career.lastBookedAt ?? 0, career.since ?? 0);
      if (s.now - since > ESTIMATE.dropAfterDays * MS_DAY) endRepresentation(s, person, 'A year with nothing booked, and the agency ended the contract.', false);
    }
    const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
    const cityId = workCity(person);
    const week = weekOfAuditions(s, person, item.at, agency, cityId, career.submitted);
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
      if (audition.self || !career.agencyId) return;
      career.missed += 1;
      if (career.missed >= ESTIMATE.dropAfterMissed) { endRepresentation(s, person, `You missed ${ESTIMATE.dropAfterMissed} auditions the agency got you.`, false); return; }
      if (isPlayer(person)) s.notify({ category: 'money', title: 'You Missed An Audition', body: `${roleById(audition.roleId).label}: the agency got you in, and you weren’t there. ${ESTIMATE.dropAfterMissed} missed and they let you go.`, importance: 75, route: '/workspace/career' });
      return;
    }
    audition.status = 'done';
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
    const booking: Booking = {
      id: nextOwnId(career, 'b'), roleId: role.id, cityId: audition.cityId,
      starts: nextMonday(s.now + role.leadDays * MS_DAY, zoneOf(audition.cityId)),
      units: span(role.units), rehearsalWeeks: role.rehearsalWeeks ? span(role.rehearsalWeeks) : 0,
      status: 'offered', dueAt: s.now + ESTIMATE.bookingOfferDays * MS_DAY, offeredAt: s.now, worked: 0, owed: 0, weeksPaid: 0,
    };
    career.bookings.push(booking);
    career.bookings = career.bookings.slice(-40);
    s.schedule({ at: booking.dueAt, kind: LAPSE_KIND, label: 'An Offer Lapses', category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking.id } });
    if (!isPlayer(person)) return;
    const cur = saveCurrency(s.universe);
    const zone = zoneOf(booking.cityId);
    const span2 = role.medium === 'screen'
      ? `${booking.units} ${booking.units === 1 ? 'day' : 'days'}`
      : `${booking.rehearsalWeeks} weeks of rehearsal and ${booking.units} of performances`;
    s.requireDecision({
      urgency: 95, category: 'career', title: `Booked: ${role.label}`,
      detail: `${span2} from ${formatDate(booking.starts, zone)}, in ${CITIES.require(booking.cityId).name}, at ${formatMoney(rateOf(role, booking.starts, booking.cityId, cur), cur)} a ${role.medium === 'screen' ? 'day' : 'week'}. Answer by ${formatDateTime(booking.dueAt, zone)}.`,
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
    if (!present(person, item.at, booking.cityId)) {
      item.status = 'missed';
      booking.status = 'fired';
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === WORK_KIND && one.payload.bookingId === booking.id) s.timeline.cancel(one.id, s.now);
      if (booking.owed > 0) schedulePay(s, person, booking, s.now + 60_000);
      if (isPlayer(person)) s.notify({ category: 'money', title: 'Replaced', body: `You didn’t turn up for ${role.label}, and the production replaced you. What you worked is still paid.`, importance: 90, route: '/workspace/career' });
      if (career.agencyId) endRepresentation(s, person, 'You walked off a job the agency booked.', false);
      return;
    }
    booking.worked += 1;
    booking.owed += 1;
    const focus = focusOf(person);
    for (const [skill, weight] of Object.entries(role.grows) as [keyof Craft, number][]) {
      person.craft[skill] = Math.min(100, person.craft[skill] + ESTIMATE.workGain * weight * focus * (1 - person.craft[skill] / 100) ** 1.5);
    }
    person.wellbeing.energy = Math.max(0, person.wellbeing.energy - ESTIMATE.workEnergy);
    if (booking.worked < workDays(booking).length) return;
    booking.status = 'worked';
    career.credits.push({ roleId: role.id, year: zonedParts(item.at, zoneOf(booking.cityId)).year, cityId: booking.cityId });
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
    if (!booking || booking.owed <= 0 || !account) return;
    const role = roleById(booking.roleId);
    const cur = saveCurrency(s.universe);
    const zone = zoneOf(booking.cityId);
    const year = zonedParts(item.at, zone).year;
    const wages = (career.wages[year] ??= { gross: 0, withheld: 0, sag: 0 });
    const represented = career.agencyId !== undefined;
    // A day's scale on screen; on stage, each week's, a sixth for each of its six days.
    const calls = workDays(booking).slice(booking.worked - booking.owed, booking.worked);
    const lines = new Map<number, { rehearsal: boolean; days: number }>();
    for (const c of calls) lines.set(c.week, { rehearsal: c.rehearsal, days: (lines.get(c.week)?.days ?? 0) + 1 });
    const postings: { accountId: string; amount: Money }[] = [];
    let net = 0;
    let gross = 0;
    for (const [, line] of lines) {
      const rate = rateOf(role, item.at, booking.cityId, cur);
      const scale = role.medium === 'screen' ? rate * line.days : Math.round((rate * line.days) / 6);
      const check = paycheck({ scale, role, rehearsal: line.rehearsal, represented, before: wages.gross, cityId: booking.cityId, at: item.at });
      wages.gross += check.gross;
      wages.withheld += check.withheld;
      if (role.union === 'sag') wages.sag += check.gross;
      gross += check.gross;
      net += check.net;
      if (check.commission) postings.push({ accountId: s.nominalAccount('expense', 'Agent Commission').id, amount: check.commission });
      if (check.dues) postings.push({ accountId: s.nominalAccount('expense', 'Union Dues').id, amount: check.dues });
      if (check.withheld) postings.push({ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: check.withheld });
    }
    booking.owed = 0;
    s.post({
      memo: `${role.label}: ${calls.length} ${calls.length === 1 ? 'day' : 'days'}`, category: 'salary',
      postings: [{ accountId: account.id, amount: net }, { accountId: s.nominalAccount('income', 'Acting').id, amount: -gross }, ...postings],
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
    const role = roleById(booking.roleId);
    const days = workDays(booking);
    const first = days[0]!.at;
    const last = days[days.length - 1]!.at;
    for (const other of career.bookings) {
      if (other.status !== 'accepted') continue;
      const theirs = workDays(other);
      if (first <= theirs[theirs.length - 1]!.at && theirs[0]!.at <= last) throw new CommandError(`It clashes with ${roleById(other.roleId).label}.`);
    }
    joinFor(s, person, role);
    booking.status = 'accepted';
    career.lastBookedAt = s.now;
    const zone = zoneOf(booking.cityId);
    for (const d of days) {
      s.schedule({
        at: d.at, kind: WORK_KIND, label: role.medium === 'screen' ? `On Set: ${role.label}` : `${d.rehearsal ? 'Rehearsal' : 'Performance'}: ${role.label}`,
        category: 'career', priority: 34, requiresPlayer: true, durationMinutes: role.medium === 'screen' ? 720 : d.rehearsal ? 480 : 180,
        locationId: booking.cityId, payload: { personId: person.id, bookingId: booking.id },
      });
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
    return { starts: booking.starts };
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
    if (career.since === undefined) throw new CommandError('While you’re at school, its work comes first; submissions start when it ends.');
    if (career.submitted >= ESTIMATE.selfSubmitsAWeek) throw new CommandError(`You’ve made this week’s ${ESTIMATE.selfSubmitsAWeek} submissions.`);
    career.submitted += 1;
    return { submitted: career.submitted };
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
  function joinFor(s: Simulation, person: Person, role: Role): void {
    const career = careerOf(person);
    const cur = saveCurrency(s.universe);
    if (role.union === 'sag') {
      const sag = career.unions.sag;
      if (!sag) { career.unions.sag = { eligibleAt: s.now }; return; }
      if (sag.joinedAt !== undefined || s.now - sag.eligibleAt < SAG_AFTRA.taftHartleyDays * MS_DAY) return;
      const fee = usd(SAG_AFTRA.initiation + Math.round(SAG_AFTRA.basicDues / 2), cur);
      if (!payFromCurrent(s, person, fee, 'SAG-AFTRA initiation fee and dues', 'dues')) throw new CommandError(`Working under SAG-AFTRA again means joining, for ${formatMoney(fee, cur)}, which the bank can’t cover.`);
      sag.joinedAt = s.now;
    } else if (!career.unions.equity) {
      const fee = usd(EQUITY.initiationNow + Math.round(EQUITY.basicDues / 2), cur);
      if (!payFromCurrent(s, person, fee, 'Actors’ Equity initiation fee and dues', 'dues')) throw new CommandError(`An Equity contract makes you a member, for ${formatMoney(fee, cur)} now, which the bank can’t cover.`);
      career.unions.equity = { joinedAt: s.now, initiationPaid: EQUITY.initiationNow };
    }
  }
}

function schedulePay(sim: Simulation, person: Person, booking: Booking, when: Instant): void {
  sim.schedule({ at: when, kind: PAY_KIND, label: `Paid: ${roleById(booking.roleId).label}`, category: 'career', priority: 20, payload: { personId: person.id, bookingId: booking.id } });
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
    if (month === 5) total += Math.round(Math.min(career.wages[year - 1]?.sag ?? 0, usd(SAG_AFTRA.workDuesCap, cur)) * SAG_AFTRA.workDues);
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
  if (total > 0) payFromCurrent(sim, person, total, 'Union dues', 'dues');
  return total;
}
