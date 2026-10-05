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
 * say; a season's week canceled isn't given back, SLATE's reading, no
 * provider's refund terms having been read.
 *
 * **Renewing**: a season ends with its last meeting; renewed by hand
 * (`club.renew`) or by the preference to renew, at the fee then, it runs
 * another season. Leaving gives nothing back, SLATE's reading.
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
import { payFromBank, spend } from './household';
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
}

export const CLUB_MEET_KIND = 'club.meet';
export const CLUB_DUE_KIND = 'club.due';
/** A meeting's end: whether it was gone to is settled then, and a season's last ends there. */
export const CLUB_CLOSE_KIND = 'club.close';
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
  scheduleNext(sim, person, club, m, sim.now);
}

function leave(sim: Simulation, person: Person, clubId: string): void {
  person.clubs = membershipsOf(person).filter((m) => m.clubId !== clubId);
  cancelPending(sim, person, clubId);
}

/** Taking part: a week's fee where paid by the week, the session's effort for the minutes there, and the club's company. */
function takePart(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant, minutes: number): boolean {
  if (club.fee?.per === 'week' && !spend(sim, person, inSaveMoney(sim, Math.round(club.fee.amount * 100), club.fee.currency), `${club.name}, the week`, 'personal')) return false;
  const hours = minutes / 60;
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
    else if (!spend(sim, person, runningCost(sim, v, km), `Fuel, to ${club.name}`, 'vehicle', true)) return 'The fuel couldn’t be paid.';
    v.errandKm = (v.errandKm ?? 0) + km;
    v.km = (v.km ?? 0) + km;
    drive(sim, person, v.jurisdiction, km, at, `${v.id}-club-${at}`, kindOf(model), tireFactor(v, at));
    const meter = meterCost(sim, club.cityId, club.minutes, person, at);
    if (meter > 0 && !spend(sim, person, meter, `Parking, ${club.place}`, 'vehicle')) return 'The meter couldn’t be paid.';
  }
  return takePart(sim, person, club, m, at, club.minutes) ? undefined : 'The week’s fee couldn’t be paid.';
}

/** A season at its end: renewed where that's the preference and the fee's paid; over otherwise. */
function seasonEnds(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant): boolean {
  const mine = person.id === sim.universe.playerId;
  if (m.renew && club.seasonWeeks) {
    const fee = joinFee(sim, club);
    if (fee === 0 || payFromBank(sim, person, fee, `${club.name}, a season renewed`, 'personal')) {
      m.until = (m.until ?? at) + club.seasonWeeks * 7 * MS_DAY;
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

export function registerClubs(sim: Simulation): void {
  sim.onCommand<{ clubId: string; attend?: Attend; by?: TripMode; vehicleId?: string; renew?: boolean }, { paid: Money; first: Instant }>('club.join', (p, { sim: s }) => {
    const person = s.player;
    const no = joinClubRefusal(person, String(p?.clubId));
    if (no) throw new CommandError(no);
    const club = clubById(String(p.clubId))!;
    const by: TripMode = p.by === 'car' || p.by === 'transit' ? p.by : 'foot';
    if (p.attend === 'always') { const way = tripRefusal(s, person, by, p.vehicleId); if (way) throw new CommandError(way); }
    const fee = joinFee(s, club);
    if (fee > 0 && !payFromBank(s, person, fee, `${club.name}, a season`, 'personal')) throw new CommandError('The bank can’t pay the season’s fee.');
    const first = nextMeeting(club, s.now);
    const m: Membership = { clubId: club.id, since: s.now, went: 0, attend: p.attend === 'always' ? 'always' : 'ask', by, ...(by === 'car' && p.vehicleId ? { vehicleId: String(p.vehicleId) } : {}), ...(p.renew ? { renew: true } : {}), ...(club.seasonWeeks ? { until: first + (club.seasonWeeks - 1) * 7 * MS_DAY } : {}) };
    membershipsOf(person).push(m);
    scheduleNext(s, person, club, m, s.now);
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
    if (!meetingsAhead(club, s.now, 4, m.until).includes(at)) throw new CommandError('That isn’t one of its next meetings.');
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
    if (fee > 0 && !payFromBank(s, person, fee, `${club.name}, a season renewed`, 'personal')) throw new CommandError('The bank can’t pay the season’s fee.');
    m.until += club.seasonWeeks * 7 * MS_DAY;
    return { paid: fee, until: m.until };
  });

  sim.onCommand<{ clubId: string }, { left: true }>('club.leave', (p, { sim: s }) => {
    if (!membershipsOf(s.player).some((m) => m.clubId === p?.clubId)) throw new CommandError('You aren’t in it.');
    leave(s, s.player, String(p.clubId));
    return { left: true };
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
      note(m, { at: item.at, what: 'canceled', note: 'A thunderstorm' });
      if (mine && answer !== 'not') s.notify({ category: 'personal', title: 'Canceled', body: `${club.name} doesn't meet today: a thunderstorm.`, importance: 25, route: '/workspace/people' });
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
      note(m, { at, what: 'missed' });
      if (person.id === s.universe.playerId && answer === 'going') s.notify({ category: 'personal', title: 'Missed', body: `You said you'd go to ${club.name} and didn't.${club.kind === 'lesson' ? ' The session isn’t made up.' : ''}`, importance: 35, route: '/workspace/people' });
    }
    // A season's last meeting: renewed or over.
    if (m.until !== undefined && at >= m.until && !seasonEnds(s, person, club, m, at)) return;
    scheduleNext(s, person, club, m, at);
  });
}
