/**
 * SLATE — clubs joined: parkrun, running clubs and leagues (the master plan's
 * §54, from 2026-10-03; the clubs, their days and fees in `content/clubs.ts`).
 *
 * Joined in the town a club meets in, free or at its fee (a season's paid on
 * joining, or a week's at each game), a club meets each week at its own day
 * and time, in the town's local time. At each meeting, someone in the town,
 * awake and not held by anything else, goes: the session's effort at its
 * METs, and an hour's exercise for fitness and mood (`applyLookingAfter`); a
 * run wears their running shoes and carries a run's injury rate. At the
 * first they go to they meet one of the club, SLATE's reading, and each one
 * after is time together toward a friendship (`systems/people.ts`). A
 * meeting missed is missed, and a season's fee isn't given back. A league's
 * season ends after its weeks; parkrun and a running club go on until left.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
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

export interface Membership { clubId: string; since: Instant; /** A league's last game. */ until?: Instant; contactId?: string; went: number }

export const CLUB_MEET_KIND = 'club.meet';
export const clubById = (id: string): Club | undefined => CLUBS.find((c) => c.id === id);
export const membershipsOf = (person: Person): Membership[] => (person.clubs ??= []);
export const clubsIn = (cityId: string): Club[] => CLUBS.filter((c) => c.cityId === cityId);

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

/** What joining costs now, in the save's money: a season's fee, or nothing where it's free or paid by the week. */
export const joinFee = (sim: Simulation, club: Club): Money => (club.fee?.per === 'season' ? inSaveMoney(sim, Math.round(club.fee.amount * 100), club.fee.currency) : 0);

export function joinClubRefusal(person: Person, clubId: string): string | undefined {
  const club = clubById(clubId);
  if (!club) return 'There’s no such club.';
  if (person.currentLocationId !== club.cityId) return `${club.name} is joined in ${CITIES.get(club.cityId)?.name ?? 'its town'}.`;
  if (membershipsOf(person).some((m) => m.clubId === clubId)) return 'You’re in it.';
  return undefined;
}

function scheduleNext(sim: Simulation, person: Person, club: Club, after: Instant): void {
  sim.schedule({ at: nextMeeting(club, after), kind: CLUB_MEET_KIND, label: club.name, category: 'personal', priority: 35, durationMinutes: club.minutes, locationId: club.cityId, payload: { personId: person.id, clubId: club.id } });
}

function leave(sim: Simulation, person: Person, clubId: string): void {
  person.clubs = membershipsOf(person).filter((m) => m.clubId !== clubId);
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === CLUB_MEET_KIND && one.payload.clubId === clubId && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
}

/** A meeting: gone to where they're in town, awake and free; its effort, its time with the club, and a week's fee where paid by the week. */
function meet(sim: Simulation, person: Person, club: Club, m: Membership, at: Instant): boolean {
  const busy = occupiedAt(sim, at);
  if (!present(person, at, club.cityId) || (busy && busy.kind !== CLUB_MEET_KIND)) return false;
  if (club.fee?.per === 'week' && !spend(sim, person, inSaveMoney(sim, Math.round(club.fee.amount * 100), club.fee.currency), `${club.name}, the week`, 'personal')) return false;
  const hours = club.minutes / 60;
  exerts(person, club.met, hours);
  applyLookingAfter(person, 'exercise', at);
  if (club.kind !== 'league') {
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

export function registerClubs(sim: Simulation): void {
  sim.onCommand<{ clubId: string }, { paid: Money; first: Instant }>('club.join', (p, { sim: s }) => {
    const person = s.player;
    const no = joinClubRefusal(person, String(p?.clubId));
    if (no) throw new CommandError(no);
    const club = clubById(String(p.clubId))!;
    const fee = joinFee(s, club);
    if (fee > 0 && !payFromBank(s, person, fee, `${club.name}, a season`, 'personal')) throw new CommandError('The bank can’t pay the season’s fee.');
    const first = nextMeeting(club, s.now);
    membershipsOf(person).push({ clubId: club.id, since: s.now, went: 0, ...(club.seasonWeeks ? { until: first + (club.seasonWeeks - 1) * 7 * MS_DAY } : {}) });
    scheduleNext(s, person, club, s.now);
    return { paid: fee, first };
  });
  sim.onCommand<{ clubId: string }, { left: true }>('club.leave', (p, { sim: s }) => {
    if (!membershipsOf(s.player).some((m) => m.clubId === p?.clubId)) throw new CommandError('You aren’t in it.');
    leave(s, s.player, String(p.clubId));
    return { left: true };
  });
  sim.onSchedule(CLUB_MEET_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const club = clubById(String(item.payload.clubId));
    const m = person ? membershipsOf(person).find((x) => x.clubId === item.payload.clubId) : undefined;
    if (!person || !club || !m) return;
    meet(s, person, club, m, item.at);
    // A league's season over, it ends; the rest go on.
    if (m.until !== undefined && item.at >= m.until) { leave(s, person, club.id); if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'A Season Over', body: `${club.name}'s season is over. Join again for the next.`, importance: 30, route: '/workspace/people' }); return; }
    scheduleNext(s, person, club, item.at);
  });
}
