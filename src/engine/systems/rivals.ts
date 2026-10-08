/**
 * SLATE — the class after Yale, and the trades that report it.
 *
 * The fifteen classmates don't stop at the degree. At the showcase each is
 * signed, or not, by the same rule the player is (an agency takes the two
 * best it wants whose showing clears its bar), and from graduation they work:
 * a month at a time, by their agency's reach and their craft against a
 * part's bar (`career.rivals`). They turn up at the player's auditions now
 * and then, and a classmate who reads better than the player is likelier to
 * book the part; when one does, the player hears who. The trades carry it
 * all: Deadline the screen, Playbill the stage, as they do. Until 2026-09-28
 * a classmate was nothing after school, and an audition was a roll against a
 * bar with nobody else in the room.
 *
 * What's SLATE's estimate: how often a classmate is in the room, how much a
 * better read takes, how often a signed or unsigned actor books in a month,
 * and which bookings make the trades. The outlets are the real ones; what
 * they print about a fictional class is SLATE's.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { AGENCIES, ROLES, type Role } from '../content/career';
import { agencyById, auditionLevel, careerOf, roleById, showcaseScore, type Audition } from './career';
import { classmatePresence, nudge } from './attributes';
import { BONDS, bondMove, bondWord, type Classmate } from './school';
import { contactsOf } from './people';

export const RIVALS = {
  /** The chance a classmate, out of school, is in the room for one of the player's auditions. */
  inTheRoom: 0.1,
  /** What a better read in the room leaves of the player's chance. */
  outread: 0.6,
  /** A month's chance of booking, by an agency's reach, and with none. */
  monthly: { 1: 0.35, 2: 0.25, 3: 0.15, none: 0.08 } as Record<1 | 2 | 3 | 'none', number>,
  /** Recognition a trade item about the player adds. */
  press: 0.5,
  /** A classmate's booking read in the trades: a friend's lifts the mood this much, a rival's takes it off and adds it to stress. SLATE's estimate. */
  friendNews: 1,
  rivalNews: 1.5,
  /** Trade items kept. */
  kept: 40,
  /** A job worked beside a former classmate, booked before productions: the hours a day side by side, to the most a job adds. */
  castmate: { hoursPerDay: 2, mostHours: 60 },
  /**
   * A part taken in the room counts against the bond once a year a classmate
   * at most, and sharing a room is remembered and told once a season (from
   * 2026-10-08): a replay found every audition with a classmate in it cost the
   * bond again, so that after decades of auditions all fifteen were rivals,
   * and each contact carried eleven thousand memories of rooms. SLATE's estimates.
   */
  slightDays: 365, roomDays: 90,
  /**
   * And a bond after school isn't only worn down (from 2026-10-08): it drifts
   * back toward even by this much a month, so a part lost stings for about a
   * year; a job worked side by side draws two closer as a production shared at
   * school does (`BONDS.shared`); a contact keeps its latest three rooms, not
   * sixty of them. The second replay of the fix still ended with all fifteen
   * at -100, the slights never fading and nothing warming them.
   */
  fadePerMonth: 1, roomsKept: 3,
} as const;

/** The parts that make the trades, which trade, and how it puts it. */
const NEWSWORTHY: Readonly<Record<string, { source: 'Deadline' | 'Playbill'; words: string }>> = {
  'series-half': { source: 'Deadline', words: 'Joins A New Half-Hour Comedy As A Series Regular' },
  'series-hour': { source: 'Deadline', words: 'Joins A New Hour Drama As A Series Regular' },
  recurring: { source: 'Deadline', words: 'Lands A Recurring Role On A Television Series' },
  'guest-hour': { source: 'Deadline', words: 'Guest Stars On An Hour Drama' },
  'film-weekly': { source: 'Deadline', words: 'Joins The Cast Of A Studio Feature' },
  broadway: { source: 'Playbill', words: 'Joins A Broadway Company' },
  'lort-a-plus': { source: 'Playbill', words: 'Cast In A Broadway Production' },
  'offb-nonprofit': { source: 'Playbill', words: 'Cast In An Off-Broadway Play' },
  'offb-commercial': { source: 'Playbill', words: 'Cast In An Off-Broadway Play' },
};

export interface NewsItem { at: Instant; source: string; headline: string; about: 'you' | 'class' }

/** A classmate's life after the degree: their agency, and the work they've booked. */
export interface ClassmateCareer { agencyId?: string; credits: { roleId: string; year: number }[]; /** On a job with the player until then (`castClassmate`, from 2026-10-08). */ busyUntil?: Instant }

/** Something in the trades: kept on the player's record, the latest first, and a little recognition when it's them. */
export function report(sim: Simulation, person: Person, source: string, headline: string, about: 'you' | 'class'): void {
  const career = careerOf(person);
  career.news = [{ at: sim.now, source, headline, about }, ...(career.news ?? [])].slice(0, RIVALS.kept);
  if (about === 'you') nudge(sim, person, 'recognition', RIVALS.press);
}

/** A booking's line in the trades, where it makes them: who, and what. */
function castLine(who: string, role: Role): { source: string; headline: string } | undefined {
  const news = NEWSWORTHY[role.id];
  return news ? { source: news.source, headline: `${who} ${news.words}` } : undefined;
}

/** The player's own booking, in the trades where it makes them. */
export function reportBooking(sim: Simulation, person: Person, role: Role): void {
  const line = castLine(`${person.firstName} ${person.lastName}`, role);
  if (line) report(sim, person, line.source, line.headline, 'you');
}

/**
 * The class signed after the showcase, by the rule the player is: an agency
 * takes the two best it wants whose showing clears its bar, the biggest
 * choosing first. Once, at the first showing.
 */
export function signTheClass(sim: Simulation, person: Person, playerScore: number): void {
  const school = person.school;
  if (!school || school.classmates.some((m) => m.career)) return;
  const scored = school.classmates.map((m, i) => ({ m, i, score: showcaseScore(m.craft, 1, classmatePresence(sim, person, i)) }));
  // The player's showing takes a place at an agency too, as it would.
  const taken = new Set<number>();
  for (const agency of [...AGENCIES].sort((a, b) => a.tier - b.tier)) {
    const field = [...scored.filter((x) => !taken.has(x.i)), { m: undefined, i: -1, score: playerScore }].filter((x) => x.score >= agency.bar).sort((a, b) => b.score - a.score).slice(0, 2);
    const signed = field.filter((x) => x.i >= 0);
    for (const x of signed) { taken.add(x.i); x.m!.career = { agencyId: agency.id, credits: [] }; }
    if (signed.length) report(sim, person, 'Deadline', `${agency.name} Signs ${signed.map((x) => x.m!.name).join(' And ')} Out Of Yale’s Class Of ${school.classOf}`, 'class');
  }
  for (const x of scored) if (!taken.has(x.i)) x.m.career = { credits: [] };
}

/** A classmate's craft for a part, read as an audition reads it. */
const readFor = (m: Classmate, role: Role, mode: 'tape' | 'room', genre?: string, demands: readonly (keyof Classmate['craft'])[] = []) => auditionLevel(m.craft, role, mode, genre, demands);

/**
 * Who of the class is in the room for one of the player's auditions, out of
 * school: each now and then (`RIVALS.inTheRoom`), and how each reads.
 */
export function inTheRoom(sim: Simulation, person: Person, audition: Audition): { i: number; name: string; read: number }[] {
  const school = person.school;
  if (!school || school.standing !== 'graduated') return [];
  const rng = sim.rng('career.rivals', person.id, `room-${audition.id}`);
  const role = roleById(audition.roleId);
  return school.classmates.flatMap((m, i) => (m.career && rng.next() < RIVALS.inTheRoom ? [{ i, name: m.name, read: readFor(m, role, audition.mode, audition.genre, audition.demands ?? []) }] : []));
}

/**
 * A part one of them took from the other, in the room: apart by what a lead
 * taken costs at school (`BONDS.leadTaken`), as the player takes a slight.
 * Until 2026-09-28 a part lost to a classmate after school was news and
 * nothing between them.
 */
export function partTaken(person: Person, i: number, at?: Instant): void {
  const m = person.school?.classmates[i] as (Classmate & { slightAt?: Instant }) | undefined;
  if (!m) return;
  // Once a year a classmate at most (`RIVALS.slightDays`): a rivalry is a part lost, not every room shared.
  if (at !== undefined && m.slightAt !== undefined && at - m.slightAt < RIVALS.slightDays * 86_400_000) return;
  if (at !== undefined) m.slightAt = at;
  m.bond = Math.max(-100, Math.min(100, (m.bond ?? 0) + bondMove(person, -BONDS.leadTaken)));
  // The person they are after school (`classmate` on the contact) follows the bond: a rival from there, not before.
  syncRival(person, i);
}

/**
 * The class in the room, remembered (from 2026-10-08): each classmate there
 * keeps it on the contact they are, and the player hears who, with the last
 * thing the two of you shared, once an audition. Being in the room decides
 * nothing by itself: the read does (`RIVALS.outread`).
 */
export function metInTheRoom(sim: Simulation, person: Person, room: readonly { i: number; name: string }[], roleLabel: string): void {
  for (const r of room) {
    const c = contactsOf(person).find((x) => x.classmate === r.i);
    if (!c) continue;
    // Remembered and told once a season a classmate (`RIVALS.roomDays`).
    const lastRoom = c.memory.find((m) => m.what.startsWith('At an audition'));
    if (lastRoom && sim.now - lastRoom.at < RIVALS.roomDays * 86_400_000) continue;
    const before = c.memory.find((m) => !m.what.startsWith('At an audition'));
    c.memory.unshift({ at: sim.now, what: `At an audition for ${roleLabel}, both of you` });
    let rooms = 0;
    c.memory = c.memory.filter((m) => !m.what.startsWith('At an audition') || (rooms += 1) <= RIVALS.roomsKept);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: `${r.name.split(' ')[0]} Was At The Audition Too`, body: `${r.name}, from your class at Yale, read for ${roleLabel} as well.${before ? ` The last thing you shared: ${before.what.replace(/^At Yale: /, '').toLowerCase()}.` : ''}`, importance: 35, route: '/workspace/career' });
  }
}

/**
 * Casting a former classmate beside the player is a production's (`makeProduction`
 * in `systems/companies.ts`, from 2026-10-08): a part of their own in it, for a
 * job of the player's. Until then one draw here cast a classmate as the player's
 * own part.
 */

/** A job worked beside a former classmate, booked before productions (2026-10-08 to 2026-10-08): the contact they are keeps it at the end. */
export function workedWith(sim: Simulation, person: Person, i: number, roleLabel: string, days: number): boolean {
  const c = contactsOf(person).find((x) => x.classmate === i);
  if (!c) return false;
  c.hours += Math.min(RIVALS.castmate.mostHours, days * RIVALS.castmate.hoursPerDay);
  const m = person.school?.classmates[i];
  if (m) m.bond = Math.max(-100, Math.min(100, (m.bond ?? 0) + bondMove(person, BONDS.shared)));
  syncRival(person, i);
  c.lastSeen = sim.now;
  c.memory.unshift({ at: sim.now, what: `Worked together on ${roleLabel}` });
  return true;
}

/** The contact a classmate is: a rival at the bond's rival line, and not, once it's come ten back above it. */
function syncRival(person: Person, i: number): void {
  const m = person.school?.classmates[i];
  const c = contactsOf(person).find((x) => x.classmate === i);
  if (!m || !c) return;
  if ((m.bond ?? 0) <= BONDS.rival) c.rival = true;
  else if ((m.bond ?? 0) > BONDS.rival + 10) delete c.rival;
}

/** A part a classmate booked: on their record, and in the trades where it makes them. */
export function classmateBooked(sim: Simulation, person: Person, i: number, role: Role, when: Instant): void {
  const m = person.school?.classmates[i];
  if (!m?.career) return;
  m.career.credits.push({ roleId: role.id, year: zonedParts(when, sim.homeZone).year });
  m.career.credits = m.career.credits.slice(-30);
  const line = castLine(m.name, role);
  if (!line) return;
  report(sim, person, line.source, line.headline, 'class');
  // Read in the trades: a friend's news is good news, a rival's stings (`bondWord`). SLATE's estimate of by how much.
  const bond = bondWord(m.bond);
  const w = person.wellbeing;
  if (bond === 'Close Friend' || bond === 'Friend') w.morale = Math.min(100, w.morale + RIVALS.friendNews);
  if (bond === 'Rival') { w.morale = Math.max(0, w.morale - RIVALS.rivalNews); w.stress = Math.min(100, w.stress + RIVALS.rivalNews); }
}

/**
 * A month of the class's work, after the degree: each classmate books a part
 * or doesn't, by their agency's reach, among the parts it sends clients to
 * that their craft can carry.
 */
export function classMonth(sim: Simulation, person: Person, when: Instant): void {
  const school = person.school;
  if (!school || school.standing !== 'graduated') return;
  const key = `${zonedParts(when, sim.homeZone).year}-${zonedParts(when, sim.homeZone).month}`;
  const rng = sim.rng('career.rivals', person.id, `month-${key}`);
  // Each bond a month nearer even (`RIVALS.fadePerMonth`), and the contact's rival flag kept to it.
  school.classmates.forEach((m, i) => {
    const b = m.bond ?? 0;
    if (b !== 0) m.bond = b > 0 ? Math.max(0, b - RIVALS.fadePerMonth) : Math.min(0, b + RIVALS.fadePerMonth);
    syncRival(person, i);
  });
  school.classmates.forEach((m, i) => {
    if (!m.career) return;
    const agency = m.career.agencyId ? agencyById(m.career.agencyId) : undefined;
    const chance = RIVALS.monthly[agency?.tier ?? 'none'];
    const x = rng.next();
    const y = rng.next();
    if (x >= chance) return;
    const open = ROLES.filter((r) => (agency ? r.tiers.includes(agency.tier) : r.selfSubmit) && readFor(m, r, 'room') >= r.bar - 5);
    if (!open.length) return;
    const total = open.reduce((sum, r) => sum + r.weight, 0);
    let left = y * total;
    const role = open.find((r) => (left -= r.weight) <= 0) ?? open[open.length - 1]!;
    classmateBooked(sim, person, i, role, when);
  });
}

