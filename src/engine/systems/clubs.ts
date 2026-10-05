/**
 * SLATE — clubs joined: parkrun, running clubs, leagues and lessons (the
 * master plan's §54, from 2026-10-03; the clubs, their days and fees in
 * `content/clubs.ts`).
 *
 * Joined in the town a club meets in, free or at its fee (a season's paid on
 * joining, or a week's at each game), a club meets each week at its own day
 * and time, in the town's local time. At each meeting gone to: the session's
 * effort at its METs, and its exercise for fitness and mood
 * (`applyLookingAfter`); a run wears their running shoes and carries a run's
 * injury rate. At the first they meet one of the club, SLATE's reading, and
 * each one after is time together toward a friendship (`systems/people.ts`).
 * A league's season and a lesson's course end after their weeks; parkrun and
 * a running club go on until left.
 *
 * **Going is the player's** (from 2026-10-03, the owner's expansion; until
 * then every meeting was gone to on its own). Each meeting ahead can be
 * answered, going or not. When one comes, the clock stops at the time to set
 * out (`CLUB_DUE_KIND`), and going is a trip there of its own (`club.go`): on
 * foot, by the town's transit at its fare, or in your car, its tank and
 * meter (`systems/trips.ts`), checked in at the venue, waiting until it
 * starts, the session, staying after to meet more of the club if chosen, and
 * home. Up to halfway through it can still be joined, for what's left,
 * SLATE's reading. A meeting can also be a stop on a run of errands
 * (`club.check_in`), its refusals the same. A meeting not gone to is missed, said where it was
 * answered going, and a lesson's session isn't made up.
 *
 * **Automatic attendance** is a preference, set when joining or after, never
 * the default: each meeting not answered no is gone to on its own, by the way
 * chosen and on the same rules, its fares, fuel and meter paid, missed where
 * the car isn't there, the tank can't make it or the fare can't be paid, as
 * a trip by hand would refuse. A membership from before 2026-10-03 was joined
 * when that was the only way, and keeps it until changed.
 *
 * **A meeting canceled**: an outdoor club doesn't meet in a thunderstorm on
 * its day (`systems/weather.ts`), as leagues' and parkrun's own safety rules
 * say. From 2026-10-05 its own terms say what follows (`ClubTerms` in
 * `content/clubs.ts`): GO Mammoth and Urban Rec add a week on to the season,
 * Volo up to two a season and a game's credit past them, New Haven's
 * pickleball only past the second called off. Until then a week called off
 * was gone, no provider's terms having been read.
 *
 * **Renewing**: a season ends with its last meeting; renewed by hand
 * (`club.renew`) or by the preference to renew, at the fee then, it runs
 * another season.
 *
 * **Leaving** (from 2026-10-05) gives back what the provider's own terms do
 * of a season paid ahead (`leavingBack`): Trinity Sport's in full with a
 * week's notice, the New Haven YMCA's less $10 before it starts, Toronto's
 * pro-rated less C$14.13 up to the third class, Kensington's less a class
 * or two, West Point Grey's pro-rated less $5, Barnsdall's as a year's
 * credit; Volo, the YMCA in New York, Bulldog, Better and Waltons give none.
 * A credit is held with the provider and paid toward its next club joined.
 * Until then leaving gave nothing back anywhere, SLATE's reading.
 *
 * **Company** (from 2026-10-05): people you know can come along on the way
 * there, on a trip's rules. At parkrun or a free running club, open to
 * anybody, they run it with you, and it's time together; to a league's game
 * or a lesson, which they aren't signed up for, they come for the ride.
 *
 * Not kept: a lesson's discipline as an ability anything reads (a swimmer's
 * stage, a guitarist's grade), which nothing in SLATE asks for yet.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, formatTime, instantFromZoned, zonedParts, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { CLUBS, type Club } from '../content/clubs';
import { INJURY } from '../content/injury';
import { inSaveMoney } from './banking';
import { payFromBank, refundToBank, spend } from './household';
import { focusOf, grow } from './school';
import { exerts } from './body';
import { applyLookingAfter, occupiedAt } from './life';
import { present } from './career';
import { contactsOf, newContact } from './people';
import { runInShoes } from './resale';
import { chanceOver, mayHurt } from './injury';
import { leg, meterCost, runErrands, transitFare, tripRefusal, type TripMode } from './trips';
import { weatherOn } from './weather';
import { kindOf, modelById, runningCost, vehiclesOf } from './vehicles';
import { burn, capacityOf } from './fueltank';
import { drive } from './driving';
import { tireFactor } from './tires';

export type Attend = 'ask' | 'always';
export interface ClubLog { at: Instant; what: 'went' | 'missed' | 'declined' | 'canceled'; note?: string }

export interface Membership {
  clubId: string; since: Instant; /** A league's last game. */ until?: Instant; contactId?: string; went: number;
  /** How its meetings are gone to (from 2026-10-03): asked each time, or on its own. None was joined before, and goes on its own. */
  attend?: Attend;
  /** The way there, and the car where it's driven. */
  by?: TripMode; vehicleId?: string;
  /** Meetings answered ahead, by their start. */
  rsvp?: Record<string, 'going' | 'not'>;
  /** The meeting checked in at by hand, by its start, while it's under way. */
  attending?: Instant;
  missed?: number;
  /** The last dozen meetings, newest first. */
  log?: ClubLog[];
  /** Renew at the season's end, at the fee then. */
  renew?: boolean;
  /** Others of the club met, staying after (the first met is `contactId`). */
  met?: string[];
  /** The season paid ahead and its first meeting (from 2026-10-05), what leaving's terms count from. */
  paid?: Money; seasonFrom?: Instant;
  /** Meetings called off this season, which its terms make up past so many; and classes missed that were made up. */
  calledOff?: number; madeUp?: number;
}

/** Money held with a club's provider, for the next of its clubs joined (from 2026-10-05): Barnsdall's class credit, Volo's for a game not made up. */
export interface ClubCredit { provider: string; amount: Money; from: string; until?: Instant }

export const CLUB_MEET_KIND = 'club.meet';
export const CLUB_DUE_KIND = 'club.due';
/** A meeting's end: whether it was gone to is settled then, and a season's last ends there. */
export const CLUB_CLOSE_KIND = 'club.close';
/** How many weeks ahead a season can be booked to start (from 2026-10-05): SLATE's reading of a term's registration opening a month out. */
export const BOOK_AHEAD_WEEKS = 4;
/** A meeting can be joined until this share of it has gone, for the rest of it: SLATE's reading. */
export const LATE_SHARE = 0.5;
/** Staying after, and the most of one club met that way: SLATE's estimates. */
export const SOCIAL_MINUTES = 30;
export const CLUB_PEOPLE_MAX = 8;
/** Setting out is open this long before a meeting; the clock stops this long before leaving. */
export const SET_OUT_HOURS = 3;
export const READY_MINUTES = 10;
const LOG_KEEP = 12;

export const clubById = (id: string): Club | undefined => CLUBS.find((c) => c.id === id);
export const membershipsOf = (person: Person): Membership[] => (person.clubs ??= []);
export const clubsIn = (cityId: string): Club[] => CLUBS.filter((c) => c.cityId === cityId);
export const attendOf = (m: Membership): Attend => m.attend ?? 'always';
/** A run, worn in running shoes and at a run's injury rate: parkrun and a running club, not a league or a lesson. */
export const runsIn = (club: Club): boolean => club.kind === 'parkrun' || club.kind === 'running';
const lateMs = (club: Club): number => club.minutes * LATE_SHARE * 60_000;

/** A club's next meeting after a moment, in its town's local time, its summer start in its summer months. */
export function nextMeeting(club: Club, after: Instant): Instant {
  const zone = CITIES.require(club.cityId).timeZone;
  const today = zonedParts(after, zone);
  for (let d = 0; d <= 8; d += 1) {
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + d));
    if (day.getUTCDay() !== club.weekday) continue;
    const month = day.getUTCMonth() + 1;
    const summer = club.summer && month >= club.summer.from && month <= club.summer.to ? club.summer : undefined;
    const at = instantFromZoned({ year: day.getUTCFullYear(), month, day: day.getUTCDate(), hour: summer?.hour ?? club.hour, minute: summer?.minute ?? club.minute }, zone);
    if (at > after) return at;
  }
  return after + 7 * MS_DAY;
}

/** The next few meetings after a moment, to answer ahead; a season's stop at its end. */
export function meetingsAhead(club: Club, after: Instant, n = 4, until?: Instant): Instant[] {
  const out: Instant[] = [];
  let at = after;
  while (out.length < n) {
    at = nextMeeting(club, at);
    if (until !== undefined && at > until) break;
    out.push(at);
  }
  return out;
}

/** A member's next meetings to answer: from their season's start where it hasn't come yet, to its end. */
export const aheadFor = (club: Club, m: Membership, now: Instant, n = 4): Instant[] => meetingsAhead(club, Math.max(now, (m.seasonFrom ?? 0) - 1), n, m.until);

/** The meeting under way that can still be joined, or the next one. */
export const meetingFor = (club: Club, now: Instant): Instant => nextMeeting(club, now - lateMs(club));

/** What joining costs now, in the save's money: a season's fee, or nothing where it's free or paid by the week. */
export const joinFee = (sim: Simulation, club: Club): Money => (club.fee?.per === 'season' ? inSaveMoney(sim, Math.round(club.fee.amount * 100), club.fee.currency) : 0);

/** A session's price on one basis to compare by: a season's fee over its weeks, a week's fee, or nothing. */
export function perSession(sim: Simulation, club: Club): Money {
  if (!club.fee) return 0;
  const all = inSaveMoney(sim, Math.round(club.fee.amount * 100), club.fee.currency);
  return club.fee.per === 'week' ? all : Math.round(all / Math.max(1, club.seasonWeeks ?? 1));
}

/** The season's first meeting: kept from 2026-10-05, worked back from its last before. */
const seasonStart = (club: Club, m: Membership): Instant =>
  m.seasonFrom ?? (m.until !== undefined && club.seasonWeeks ? m.until - (club.seasonWeeks - 1) * 7 * MS_DAY : m.since);

/** What leaving now gives back of the season paid ahead, by the provider's own steps (`ClubTerms`): money, a credit, or nothing. */
/** A deadline so many days, or business days, ahead of a meeting, in its town's own days. */
function aheadOf(club: Club, at: Instant, days: number, business: boolean): Instant {
  if (!business) return at - days * MS_DAY;
  const zone = CITIES.require(club.cityId).timeZone;
  let t = at;
  for (let left = days; left > 0;) {
    t -= MS_DAY;
    const p = zonedParts(t, zone);
    const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return t;
}

export function leavingBack(sim: Simulation, club: Club, m: Membership): { back: Money; credit: Money; why: string; creditMonths?: number } {
  if (!club.fee) return { back: 0, credit: 0, why: 'It’s free.' };
  if (club.fee.per === 'week') return { back: 0, credit: 0, why: 'Paid by the week, so nothing is paid ahead to come back.' };
  if (!m.paid) return { back: 0, credit: 0, why: 'No season was paid ahead.' };
  const season = meetingsAhead(club, seasonStart(club, m) - 1, club.seasonWeeks ?? 1);
  for (const step of club.terms?.leave ?? []) {
    const at = season[step.before - 1];
    if (at === undefined || sim.now >= aheadOf(club, at, step.daysAhead ?? 0, step.business === true)) continue;
    const fee = step.fee ? inSaveMoney(sim, Math.round(step.fee * 100), club.fee.currency) : 0;
    const left = season.filter((x) => x > sim.now).length;
    const gross = step.prorated ? Math.round((m.paid * left) / season.length)
      : step.keepShare !== undefined ? Math.round(m.paid * (1 - step.keepShare))
      : m.paid - (step.keepSessions ?? 0) * Math.round(m.paid / season.length);
    const amount = Math.max(0, gross - fee);
    const why = club.terms!.leaveSaid;
    return step.credit ? { back: 0, credit: amount, why, ...(step.creditMonths ? { creditMonths: step.creditMonths } : {}) } : { back: amount, credit: 0, why };
  }
  return { back: 0, credit: 0, why: club.terms?.leaveSaid ?? 'No terms of its own were read: nothing comes back.' };
}

/** What credit the person holds with a provider now, unexpired. */
export const creditWith = (person: Person, provider: string | undefined, at: Instant): Money =>
  provider ? (person.clubCredits ?? []).filter((c) => c.provider === provider && (c.until === undefined || c.until > at)).reduce((n, c) => n + c.amount, 0) : 0;

/** Takes up to an amount from a provider's credit, oldest first; what was taken. */
function takeCredit(person: Person, provider: string | undefined, upTo: Money, at: Instant): Money {
  if (!provider || upTo <= 0) return 0;
  let used = 0;
  for (const c of (person.clubCredits ?? []).filter((x) => x.provider === provider && (x.until === undefined || x.until > at))) {
    const take = Math.min(c.amount, upTo - used);
    c.amount -= take;
    used += take;
    if (used >= upTo) break;
  }
  person.clubCredits = (person.clubCredits ?? []).filter((c) => c.amount > 0 && (c.until === undefined || c.until > at));
  return used;
}

/** A season's fee paid, a provider's credit first and the bank for the rest; false where the bank can't. */
function paySeason(sim: Simulation, person: Person, club: Club, fee: Money, memo: string): boolean {
  if (fee <= 0) return true;
  const credit = Math.min(fee, creditWith(person, club.provider, sim.now));
  if (fee - credit > 0 && !payFromBank(sim, person, fee - credit, memo, 'personal')) return false;
  takeCredit(person, club.provider, credit, sim.now);
  return true;
}

/** Why a meeting doesn't happen: an outdoor club in a thunderstorm on its day. */
export function canceledFor(sim: Simulation, club: Club, at: Instant): string | undefined {
  if (!club.outdoor) return undefined;
  return weatherOn(sim, CITIES.require(club.cityId), at).condition === 'Thunderstorm' ? 'A thunderstorm is forecast, and it doesn’t meet in one.' : undefined;
}

export function joinClubRefusal(person: Person, clubId: string): string | undefined {
  const club = clubById(clubId);
  if (!club) return 'There’s no such club.';
  if (person.currentLocationId !== club.cityId) return `${club.name} is joined in ${CITIES.get(club.cityId)?.name ?? 'its town'}.`;
  if (membershipsOf(person).some((m) => m.clubId === clubId)) return 'You’re in it.';
  return undefined;
}

/** The way there's leg, each way. */
export const legTo = (club: Club, by: TripMode): { km: number; minutes: number } => leg(club.cityId, by, 'errand');

/**
 * A club anybody can turn up to and take part in: parkrun, free to all once
 * registered, and the free running clubs (from 2026-10-05). Somebody along
 * runs it with you there; to a league's game or a lesson they come for the
 * ride, the time on the way together, as an errand's company is.
 */
export const openToAnyone = (club: Club): boolean => club.kind === 'parkrun' || (club.kind === 'running' && !club.fee);

/** Why setting out for a club's meeting now, this way, with whoever's along, can't happen, or nothing. */
export function goRefusal(sim: Simulation, person: Person, clubId: string, by: TripMode, vehicleId?: string, passengerIds: readonly string[] = []): string | undefined {
  const club = clubById(clubId);
  const m = membershipsOf(person).find((x) => x.clubId === clubId);
  if (!club || !m) return 'You aren’t in it.';
  if (person.currentLocationId !== club.cityId) return `${club.name} meets in ${CITIES.require(club.cityId).name}.`;
  if (!present(person, sim.now)) return 'You can’t go now.';
  if (person.trip) return 'You’re out already.';
  const at = meetingFor(club, sim.now);
  const zone = CITIES.require(club.cityId).timeZone;
  if (m.until !== undefined && at > m.until) return 'Its season is over.';
  if (m.seasonFrom !== undefined && at < m.seasonFrom) return `Its season starts ${formatDate(m.seasonFrom, zone)}.`;
  if (at - sim.now > SET_OUT_HOURS * 3_600_000) return `It meets ${formatDate(at, zone)} at ${formatTime(at, zone)}; you can set out within ${SET_OUT_HOURS} hours of it.`;
  if ((m.log ?? []).some((l) => l.at === at && l.what === 'went')) return 'That meeting’s been and gone.';
  const off = canceledFor(sim, club, at);
  if (off) return off;
  const there = sim.now + legTo(club, by).minutes * 60_000;
  if (there > at + lateMs(club)) return `Getting there takes ${Math.round(legTo(club, by).minutes)} minutes, past halfway through it.`;
  return tripRefusal(sim, person, by, vehicleId, passengerIds);
}

function note(m: Membership, entry: ClubLog): void {
  m.log = [entry, ...(m.log ?? []).filter((l) => l.at !== entry.at)].slice(0, LOG_KEEP);
}

function cancelPending(sim: Simulation, person: Person, clubId: string): void {
  for (const one of sim.universe.scheduled) {
    if (one.status !== 'pending' || (one.kind !== CLUB_MEET_KIND && one.kind !== CLUB_DUE_KIND && one.kind !== CLUB_CLOSE_KIND)) continue;
    if (one.payload.clubId === clubId && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
  }
}

/** The next meeting on the calendar, and, asked each time and not answered no, the moment to set out for it. */
function scheduleNext(sim: Simulation, person: Person, club: Club, m: Membership, after: Instant): void {
  const at = nextMeeting(club, after);
  sim.schedule({ at, kind: CLUB_MEET_KIND, label: club.name, category: 'personal', priority: 35, durationMinutes: club.minutes, locationId: club.cityId, payload: { personId: person.id, clubId: club.id } });
  sim.schedule({ at: at + club.minutes * 60_000, kind: CLUB_CLOSE_KIND, label: `${club.name} Ends`, category: 'system', priority: 35, locationId: club.cityId, payload: { personId: person.id, clubId: club.id, meetingAt: at } });
  if (attendOf(m) !== 'ask' || m.rsvp?.[String(at)] === 'not' || person.id !== sim.universe.playerId) return;
  const leave = at - Math.round(legTo(club, m.by ?? 'foot').minutes * 60_000) - READY_MINUTES * 60_000;
  if (leave > sim.now) sim.schedule({ at: leave, kind: CLUB_DUE_KIND, label: `Set Out For ${club.name}`, category: 'personal', priority: 35, stopsClock: true, locationId: club.cityId, payload: { personId: person.id, clubId: club.id, meetingAt: at } });
}

function reschedule(sim: Simulation, person: Person, club: Club, m: Membership): void {
  cancelPending(sim, person, club.id);
  scheduleNext(sim, person, club, m, Math.max(sim.now, (m.seasonFrom ?? 0) - 1));
}

function leave(sim: Simulation, person: Person, clubId: string): void {
  person.clubs = membershipsOf(person).filter((m) => m.clubId !== clubId);
  cancelPending(sim, person, clubId);
}

/** Taking part: a week's fee where paid by the week, the session's effort for the minutes there, and the club's company. */
function takePart(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant, minutes: number): boolean {
  if (club.fee?.per === 'week' && !spend(sim, person, inSaveMoney(sim, Math.round(club.fee.amount * 100), club.fee.currency), `${club.name}, the week`, 'personal')) return false;
  const hours = minutes / 60;
  // A course in the actor's craft grows the skill it trains, a session at the readiness they come with, its share where
  // they came late (from 2026-10-05): singing, voice-over, stage combat, accents, on camera.
  if (club.trains && person.craft) grow(person.craft, club.trains, focusOf(person), Math.min(1, minutes / club.minutes));
  // A session's effort at its METs; under three, an hour unwinding rather than a workout (from 2026-10-03).
  if (club.met !== undefined) exerts(person, club.met, hours);
  applyLookingAfter(person, club.met !== undefined && club.met >= 3 ? 'exercise' : 'unwind', at);
  if (runsIn(club)) {
    runInShoes(sim, person);
    mayHurt(sim, person, 'run', chanceOver(INJURY.perThousandHours.run, hours), at);
  }
  // At the first, one of the club met; at each, time together.
  let c = m.contactId ? contactsOf(person).find((x) => x.id === m.contactId) : undefined;
  if (!c) {
    c = newContact(sim, person, club.cityId, `club-${club.id}-${m.since}`, { at, how: 'club', what: club.name });
    contactsOf(person).push(c);
    m.contactId = c.id;
  }
  c.hours += hours;
  c.lastSeen = at;
  m.went += 1;
  return true;
}

/** Staying after: time with those of the club already known, and one more met while there are more to meet. */
function stayAfter(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant): string | undefined {
  const known = [m.contactId, ...(m.met ?? [])].map((id) => contactsOf(person).find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  for (const c of known) { c.hours += SOCIAL_MINUTES / 60; c.lastSeen = at; }
  if (known.length >= CLUB_PEOPLE_MAX) return undefined;
  const c = newContact(sim, person, club.cityId, `club-${club.id}-after-${at}`, { at, how: 'club', what: club.name });
  c.hours += SOCIAL_MINUTES / 60;
  c.lastSeen = at;
  contactsOf(person).push(c);
  m.met = [...(m.met ?? []), c.id];
  return c.name;
}

/** Gone to on its own, by the way chosen, on a trip's rules: its fares, fuel and meter, refused as the trip would be. */
function goOnItsOwn(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant): string | undefined {
  const busy = occupiedAt(sim, at);
  if (!present(person, at, club.cityId) || (busy && busy.kind !== CLUB_MEET_KIND)) return 'You weren’t free, or weren’t in town.';
  const by = m.by ?? 'foot';
  const no = person.trip ? 'You were out already.' : tripRefusal(sim, person, by, m.vehicleId);
  if (no) return no;
  const way = legTo(club, by);
  if (by === 'transit') {
    const fare = transitFare(sim, club.cityId, at) ?? 0;
    if (fare > 0 && !spend(sim, person, fare * 2, `${CITIES.require(club.cityId).name}’s transit, there and back`, 'personal')) return 'The fares couldn’t be paid.';
  }
  if (by === 'car') {
    const v = vehiclesOf(person).find((x) => x.id === m.vehicleId)!;
    const model = modelById(v.modelId)!;
    const km = way.km * 2;
    if (capacityOf(model) !== undefined) { if (!burn(v, km)) return 'There wasn’t enough in the tank to get there and back.'; }
    else if (!spend(sim, person, runningCost(sim, v, km), `Fuel, to ${club.name}`, 'vehicle', true)) return 'Fuel couldn’t be paid for.';
    v.errandKm = (v.errandKm ?? 0) + km;
    v.km = (v.km ?? 0) + km;
    drive(sim, person, v.jurisdiction, km, at, `${v.id}-club-${at}`, kindOf(model), tireFactor(v, at));
    const meter = meterCost(sim, club.cityId, club.minutes, person, at);
    if (meter > 0 && !spend(sim, person, meter, `Parking, ${club.place}`, 'vehicle')) return 'Parking couldn’t be paid for.';
  }
  return takePart(sim, person, club, m, at, club.minutes) ? undefined : 'The week’s fee couldn’t be paid.';
}

/** Another season paid: its first meeting the week after the last one's, its own called-off count. */
function newSeason(club: Club, m: Membership, fee: Money, at = m.until ?? 0): void {
  m.seasonFrom = (m.until ?? at) + 7 * MS_DAY;
  m.until = (m.until ?? at) + club.seasonWeeks! * 7 * MS_DAY;
  if (fee > 0) m.paid = fee; else delete m.paid;
  delete m.calledOff;
  delete m.madeUp;
}

/** A season at its end: renewed where that's the preference and the fee's paid; over otherwise. */
function seasonEnds(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant): boolean {
  const mine = person.id === sim.universe.playerId;
  if (m.renew && club.seasonWeeks) {
    const fee = joinFee(sim, club);
    if (paySeason(sim, person, club, fee, `${club.name}, a season renewed`)) {
      newSeason(club, m, fee, at);
      if (mine) sim.notify({ category: 'personal', title: 'Renewed', body: `${club.name} runs another ${club.seasonWeeks} weeks.`, importance: 25, route: '/workspace/people' });
      return true;
    }
    leave(sim, person, club.id);
    if (mine) sim.notify({ category: 'personal', title: 'Not Renewed', body: `${club.name}'s next season couldn't be paid for, so it's over.`, importance: 40, route: '/workspace/people' });
    return false;
  }
  leave(sim, person, club.id);
  if (mine) sim.notify({ category: 'personal', title: 'A Season Over', body: `${club.name}'s season is over. Join again for the next.`, importance: 30, route: '/workspace/people' });
  return false;
}

/** A credit's month, for how long one is good: Barnsdall's a year, NYC Stage & Screen Combat's two months. */
const CREDIT_MONTH = (365.2425 / 12) * MS_DAY;

/**
 * A meeting called off by the club, by its own terms (from 2026-10-05; until
 * then a week called off was simply gone): a week added on to the season past
 * the first `after` called off and up to `most` a season, and past those a
 * session's worth of credit where the terms give one. What it gave, or nothing.
 */
/** A class missed, made up by the course's own terms where they make one up, a week on: true where it was. */
export function madeUpFor(club: Club, m: Membership): boolean {
  const most = club.terms?.missedMakeUps ?? 0;
  if (m.until === undefined || (m.madeUp ?? 0) >= most) return false;
  m.madeUp = (m.madeUp ?? 0) + 1;
  m.until += 7 * MS_DAY;
  return true;
}

export function calledOff(person: Person, club: Club, m: Membership): string | undefined {
  m.calledOff = (m.calledOff ?? 0) + 1;
  const off = club.terms?.calledOff;
  if (!off || m.until === undefined) return undefined;
  const past = m.calledOff - (off.after ?? 0);
  if (past <= 0) return undefined;
  if (off.most === undefined || past <= off.most) {
    m.until += 7 * MS_DAY;
    return 'a week added on to the season';
  }
  if (off.creditPast && club.fee) {
    const each = club.fee.per === 'week' ? 0 : Math.round((m.paid ?? 0) / Math.max(1, club.seasonWeeks ?? 1));
    if (each > 0) {
      (person.clubCredits ??= []).push({ provider: club.provider ?? club.id, amount: each, from: club.name });
      return 'a game’s credit, past the make-ups it guarantees';
    }
  }
  return undefined;
}

export function registerClubs(sim: Simulation): void {
  sim.onCommand<{ clubId: string; attend?: Attend; by?: TripMode; vehicleId?: string; renew?: boolean; ahead?: number }, { paid: Money; first: Instant }>('club.join', (p, { sim: s }) => {
    const person = s.player;
    const no = joinClubRefusal(person, String(p?.clubId));
    if (no) throw new CommandError(no);
    const club = clubById(String(p.clubId))!;
    // A season booked to start this week or up to four weeks on (from 2026-10-05); a weekly club starts this week.
    const ahead = p.ahead === undefined ? 0 : Number(p.ahead);
    if (!(Number.isInteger(ahead) && ahead >= 0 && ahead <= BOOK_AHEAD_WEEKS)) throw new CommandError(`From this week to ${BOOK_AHEAD_WEEKS} weeks on.`);
    if (ahead > 0 && !club.seasonWeeks) throw new CommandError('It meets every week: it starts when you join.');
    const by: TripMode = p.by === 'car' || p.by === 'transit' ? p.by : 'foot';
    if (p.attend === 'always') { const way = tripRefusal(s, person, by, p.vehicleId); if (way) throw new CommandError(way); }
    const fee = joinFee(s, club);
    if (!paySeason(s, person, club, fee, `${club.name}, a season`)) throw new CommandError('There isn’t enough in the bank for the season’s fee.');
    const first = nextMeeting(club, s.now + ahead * 7 * MS_DAY);
    const m: Membership = { clubId: club.id, since: s.now, went: 0, attend: p.attend === 'always' ? 'always' : 'ask', by, ...(by === 'car' && p.vehicleId ? { vehicleId: String(p.vehicleId) } : {}), ...(p.renew ? { renew: true } : {}), ...(club.seasonWeeks ? { until: first + (club.seasonWeeks - 1) * 7 * MS_DAY, seasonFrom: first } : {}), ...(fee > 0 ? { paid: fee } : {}) };
    membershipsOf(person).push(m);
    scheduleNext(s, person, club, m, first - 1);
    return { paid: fee, first };
  });

  // The preferences: asked or on its own, the way there, renewing.
  sim.onCommand<{ clubId: string; attend?: Attend; by?: TripMode; vehicleId?: string; renew?: boolean }, { set: true }>('club.set', (p, { sim: s }) => {
    const person = s.player;
    const m = membershipsOf(person).find((x) => x.clubId === p?.clubId);
    const club = clubById(String(p?.clubId));
    if (!m || !club) throw new CommandError('You aren’t in it.');
    const by: TripMode = p.by === 'car' || p.by === 'transit' || p.by === 'foot' ? p.by : m.by ?? 'foot';
    const vehicleId = by === 'car' ? String(p.vehicleId ?? m.vehicleId ?? '') : undefined;
    const attend: Attend = p.attend === 'always' || p.attend === 'ask' ? p.attend : attendOf(m);
    if (attend === 'always') { const way = tripRefusal(s, person, by, vehicleId); if (way) throw new CommandError(way); }
    m.attend = attend;
    m.by = by;
    if (vehicleId) m.vehicleId = vehicleId; else delete m.vehicleId;
    if (p.renew !== undefined) { if (p.renew) m.renew = true; else delete m.renew; }
    reschedule(s, person, club, m);
    return { set: true };
  });

  // An answer for a meeting ahead.
  sim.onCommand<{ clubId: string; at: Instant; going: boolean }, { at: Instant }>('club.rsvp', (p, { sim: s }) => {
    const person = s.player;
    const m = membershipsOf(person).find((x) => x.clubId === p?.clubId);
    const club = clubById(String(p?.clubId));
    if (!m || !club) throw new CommandError('You aren’t in it.');
    const at = Number(p.at);
    if (!aheadFor(club, m, s.now).includes(at)) throw new CommandError('That isn’t one of its next meetings.');
    m.rsvp = { ...(m.rsvp ?? {}), [String(at)]: p.going ? 'going' : 'not' };
    reschedule(s, person, club, m);
    return { at };
  });

  // Going by hand: a trip there, checked in, the session, staying after if chosen, and home.
  sim.onCommand<{ clubId: string; by?: TripMode; vehicleId?: string; stayAfter?: boolean; passengerIds?: string[] }, { at: Instant; met?: string; minutes: number }>('club.go', (p, { sim: s }) => {
    const person = s.player;
    const by: TripMode = p?.by === 'car' || p?.by === 'transit' ? p.by : 'foot';
    // Somebody along (from 2026-10-05), on a trip's rules: a seat in the car, known, in town and free.
    const along = Array.isArray(p?.passengerIds) ? p.passengerIds.map(String) : [];
    const no = goRefusal(s, person, String(p?.clubId), by, p?.vehicleId, along);
    if (no) throw new CommandError(no);
    const club = clubById(String(p.clubId))!;
    const at = meetingFor(club, s.now);
    let out: { at: Instant; met?: string; minutes: number } | undefined;
    runErrands(s, { by, ...(p.vehicleId ? { vehicleId: String(p.vehicleId) } : {}), ...(along.length ? { passengerIds: along } : {}), stops: [{ kind: 'club.check_in', payload: { clubId: club.id, ...(p.stayAfter ? { stayAfter: true } : {}) }, leg: 'errand' }] }, (kind, payload) => {
      const r = s.execute<{ at: Instant; met?: string; minutes: number }>({ kind, payload });
      if (kind === 'club.check_in' && r.ok) out = r.value;
      return r;
    });
    return out ?? { at, minutes: 0 };
  });

  // At the venue, on a trip: waiting for it to start, the session for what's left of it, and the time after.
  sim.onCommand<{ clubId: string; stayAfter?: boolean }, { at: Instant; met?: string; minutes: number }>('club.check_in', (p, { sim: s }) => {
    const person = s.player;
    const m = membershipsOf(person).find((x) => x.clubId === p?.clubId);
    const club = clubById(String(p?.clubId));
    if (!m || !club) throw new CommandError('You aren’t in it.');
    if (!person.trip) throw new CommandError('You check in when you’re there.');
    if (person.currentLocationId !== club.cityId) throw new CommandError(`${club.name} meets in ${CITIES.require(club.cityId).name}.`);
    const at = meetingFor(club, s.now);
    if (at - s.now > SET_OUT_HOURS * 3_600_000) throw new CommandError('It isn’t meeting now.');
    if (m.until !== undefined && at > m.until) throw new CommandError('Its season is over.');
    if (m.seasonFrom !== undefined && at < m.seasonFrom) throw new CommandError('Its season hasn’t started.');
    if ((m.log ?? []).some((l) => l.at === at && l.what === 'went')) throw new CommandError('That meeting’s been and gone.');
    const off = canceledFor(s, club, at);
    if (off) throw new CommandError(off);
    m.attending = at;
    // Gone on its own and missed it, then gone by hand after all: not missed.
    if ((m.log ?? []).some((l) => l.at === at && l.what === 'missed')) m.missed = Math.max(0, (m.missed ?? 1) - 1);
    if (s.now < at) s.advanceTo(at);
    const end = at + club.minutes * 60_000;
    const minutes = Math.max(0, (end - s.now) / 60_000);
    if (!takePart(s, person, club, m, s.now, minutes)) throw new CommandError('The week’s fee can’t be paid.');
    // Whoever came along takes part where anybody can, and it's time together (from 2026-10-05).
    if (openToAnyone(club)) {
      for (const id of person.trip.passengerIds ?? (person.trip.passengerId ? [person.trip.passengerId] : [])) {
        const c = contactsOf(person).find((x) => x.id === id);
        if (!c) continue;
        c.hours += minutes / 60;
        c.lastSeen = end;
        c.memory.unshift({ at: end, what: `Ran ${club.name} with you` });
      }
    }
    s.advanceTo(end);
    let met: string | undefined;
    if (p.stayAfter) { met = stayAfter(s, person, club, m, s.now); s.advanceTo(s.now + SOCIAL_MINUTES * 60_000); }
    note(m, { at, what: 'went', ...(minutes < club.minutes - 0.5 ? { note: `Late: ${Math.round(minutes)} of its ${club.minutes} minutes` } : {}) });
    delete m.attending;
    return { at, ...(met ? { met } : {}), minutes };
  });

  sim.onCommand<{ clubId: string }, { paid: Money; until: Instant }>('club.renew', (p, { sim: s }) => {
    const person = s.player;
    const m = membershipsOf(person).find((x) => x.clubId === p?.clubId);
    const club = clubById(String(p?.clubId));
    if (!m || !club) throw new CommandError('You aren’t in it.');
    if (!club.seasonWeeks || m.until === undefined) throw new CommandError('It doesn’t run by the season.');
    const fee = joinFee(s, club);
    if (!paySeason(s, person, club, fee, `${club.name}, a season renewed`)) throw new CommandError('There isn’t enough in the bank for the season’s fee.');
    newSeason(club, m, fee);
    return { paid: fee, until: m.until! };
  });

  // Leaving: what the provider's own terms give back of a season paid ahead, as money or a credit with it (from 2026-10-05).
  sim.onCommand<{ clubId: string }, { left: true; back: Money; credit: Money }>('club.leave', (p, { sim: s }) => {
    const person = s.player;
    const m = membershipsOf(person).find((x) => x.clubId === p?.clubId);
    const club = clubById(String(p?.clubId));
    if (!m || !club) throw new CommandError('You aren’t in it.');
    const { back, credit, creditMonths } = leavingBack(s, club, m);
    if (back > 0) refundToBank(s, person, back, `${club.name}, back on leaving`, 'personal');
    if (credit > 0) (person.clubCredits ??= []).push({ provider: club.provider ?? club.id, amount: credit, from: club.name, ...(creditMonths ? { until: s.now + creditMonths * CREDIT_MONTH } : {}) });
    leave(s, person, club.id);
    return { left: true, back, credit };
  });

  // The moment to set out only stops the clock; going is the player's (`club.go`).
  sim.onSchedule(CLUB_DUE_KIND, () => undefined);

  sim.onSchedule(CLUB_MEET_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const club = clubById(String(item.payload.clubId));
    const m = person ? membershipsOf(person).find((x) => x.clubId === item.payload.clubId) : undefined;
    if (!person || !club || !m) return;
    const mine = person.id === s.universe.playerId;
    const answer = m.rsvp?.[String(item.at)];
    // A meeting put on the calendar before 2026-10-03 had no end of its own, which now carries the next.
    if (!s.universe.scheduled.some((x) => x.status === 'pending' && x.kind === CLUB_CLOSE_KIND && x.payload.clubId === club.id && x.payload.meetingAt === item.at && x.payload.personId === person.id)) {
      s.schedule({ at: item.at + club.minutes * 60_000, kind: CLUB_CLOSE_KIND, label: `${club.name} Ends`, category: 'system', priority: 35, locationId: club.cityId, payload: { personId: person.id, clubId: club.id, meetingAt: item.at } });
    }
    if (m.attending === item.at) {
      // Checked in by hand: the trip carries the session.
    } else if (canceledFor(s, club, item.at)) {
      const remedy = calledOff(person, club, m);
      note(m, { at: item.at, what: 'canceled', note: `A thunderstorm${remedy ? `: ${remedy}` : ''}` });
      if (mine && answer !== 'not') s.notify({ category: 'personal', title: 'Canceled', body: `${club.name} doesn't meet today: a thunderstorm.${remedy ? ` ${remedy[0]!.toUpperCase()}${remedy.slice(1)}.` : ''}`, importance: 25, route: '/workspace/people' });
    } else if (answer === 'not') {
      note(m, { at: item.at, what: 'declined' });
    } else if (attendOf(m) === 'always') {
      const why = goOnItsOwn(s, person, club, m, item.at);
      if (why) { m.missed = (m.missed ?? 0) + 1; note(m, { at: item.at, what: 'missed', note: why }); }
      else note(m, { at: item.at, what: 'went' });
    }
    // Asked, it's still open until halfway: settled at its end.
  });

  sim.onSchedule(CLUB_CLOSE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const club = clubById(String(item.payload.clubId));
    const m = person ? membershipsOf(person).find((x) => x.clubId === item.payload.clubId) : undefined;
    if (!person || !club || !m) return;
    const at = Number(item.payload.meetingAt);
    const answer = m.rsvp?.[String(at)];
    if (m.rsvp) { const { [String(at)]: _gone, ...rest } = m.rsvp; m.rsvp = rest; }
    if (m.attending !== at && !(m.log ?? []).some((l) => l.at === at)) {
      m.missed = (m.missed ?? 0) + 1;
      // Made up where its terms make one up (Voice Academy NYC's one a course), a week added on (from 2026-10-05).
      const madeUp = madeUpFor(club, m);
      note(m, { at, what: 'missed', ...(madeUp ? { note: 'A make-up class added on' } : {}) });
      if (person.id === s.universe.playerId && answer === 'going') s.notify({ category: 'personal', title: 'Missed', body: `You said you'd go to ${club.name} and didn't.${madeUp ? ' A make-up class is added on to the course.' : club.kind === 'lesson' ? ' The session isn’t made up.' : ''}`, importance: 35, route: '/workspace/people' });
    }
    // A season's last meeting: renewed or over.
    if (m.until !== undefined && at >= m.until && !seasonEnds(s, person, club, m, at)) return;
    scheduleNext(s, person, club, m, at);
  });
}
