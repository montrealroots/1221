/**
 * SLATE — awards (Stage 13 of `docs/BACKLOG.md`, from 2026-10-01; the bodies
 * and their fields in `content/awards.ts`).
 *
 * **Which work.** A television guest part, a recurring one and a series
 * regular's are put up for the Primetime Emmys: a guest or recurring part in
 * the guest categories, a regular in the supporting, comedy where the work
 * was one and drama otherwise. A co-star's few lines are under the 5% of the
 * episode the Academy asks of a guest performer, so a co-star isn't. A
 * British feature is put up for BAFTA Film, as supporting. The performer's
 * word, actor or actress, is the category's.
 *
 * **Who enters it.** A network enters its series regulars; a guest performer
 * enters themselves, by the entry deadline, at the Academy's $225; a film's
 * entrant enters its performances for BAFTA.
 *
 * **When.** The Emmys' year is work finished from 1 June to 31 May, decided
 * that July and given in September; BAFTA's is work finished in a calendar
 * year, decided the next January and given in February. That a film shot in
 * a year is released in it is SLATE's reading.
 *
 * **The vote.** A performance's chance at a nomination is the category's
 * slots over its submissions, weighed by how far the actor stood above the
 * part's bar: twice as likely ten points above it, half as likely ten below,
 * no more than four times either way. A nominee's chance at the win is one
 * over the slots, weighed the same. The weighing is SLATE's estimate.
 *
 * **What it does.** A nomination lifts recognition by 4 and earns 4 of
 * reputation; a win, 8 and 8, on the scale where a series is worth 12 of
 * recognition (`ATTRIBUTES.recognition`). Recognition sets what an actor
 * is paid over scale (`overscaleOf`). The sizes are SLATE's estimates.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { dateKey, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { AWARD_DATES, BAFTA_FIELDS, EMMY_ENTRY, EMMY_FIELDS, EMMY_NAMES, type AwardBody } from '../content/awards';
import { careerOf, levelFor, roleById, workDays, type Booking } from './career';
import { earn, nudge } from './attributes';
import { spend } from './household';

export interface AwardEntry { bookingId: string; body: AwardBody; year: number; category: string; entered: Instant; byThem: boolean; nominated?: boolean; won?: boolean }

const ZONE: Readonly<Record<AwardBody, string>> = { emmys: 'America/Los_Angeles', 'bafta-film': 'Europe/London' };
/** A nomination's and a win's recognition and reputation, and the mood. SLATE's estimates. */
export const AWARD_EFFECT = { nominated: { recognition: 4, reputation: 4, morale: 5 }, won: { recognition: 8, reputation: 8, morale: 10 } } as const;

export const entriesOf = (person: Person): AwardEntry[] => (careerOf(person).awards ??= []);

/** Where a booking's work is put up: the body and the category, or nothing. */
export function categoryOf(booking: Booking): { body: AwardBody; category: string; byNetwork: boolean } | undefined {
  const role = roleById(booking.roleId);
  const comedy = booking.genre === 'comedy';
  if (role.id === 'guest-half') return { body: 'emmys', category: 'guest-comedy', byNetwork: false };
  if (role.id === 'guest-hour') return { body: 'emmys', category: 'guest-drama', byNetwork: false };
  if (role.id === 'recurring') return { body: 'emmys', category: comedy ? 'guest-comedy' : 'guest-drama', byNetwork: false };
  if (role.id === 'series-half') return { body: 'emmys', category: 'supporting-comedy', byNetwork: true };
  if (role.id === 'series-hour') return { body: 'emmys', category: 'supporting-drama', byNetwork: true };
  if (role.id.startsWith('uk-film')) return { body: 'bafta-film', category: 'supporting', byNetwork: true };
  return undefined;
}

/** The ceremony year a booking's work counts toward: the Emmys' June-to-May year, BAFTA's next. */
export function awardYear(booking: Booking, body: AwardBody): number {
  const days = workDays(booking);
  const last = zonedParts(days[days.length - 1]!.at, ZONE[body]);
  if (body === 'emmys') return last.month >= 6 ? last.year + 1 : last.year;
  return last.year + 1;
}

/** A category's field and slots, for the performer's word. */
function fieldOf(person: Person, body: AwardBody, category: string): { submissions: number; slots: number } {
  const word = person.performerTitle === 'actress' ? 'actress' : 'actor';
  return body === 'emmys' ? EMMY_FIELDS[category]![word] : BAFTA_FIELDS[word];
}

/** The category as it's named, with the performer's word. */
export function categoryName(person: Person, entry: Pick<AwardEntry, 'body' | 'category'>): string {
  const word = person.performerTitle === 'actress' ? 'Actress' : 'Actor';
  return entry.body === 'emmys' ? EMMY_NAMES[entry.category]!.replace('{title}', word) : `Supporting ${word}, BAFTA Film`;
}

/** How far above the part's bar they stood, as the vote weighs it. */
export function standout(person: Person, booking: Booking): number {
  const role = roleById(booking.roleId);
  return clamp(2 ** ((levelFor(person.craft!, role, booking.genre, booking.demands ?? []) - role.bar) / 10), 0.25, 4);
}

/** A nomination's chance, and a win's for a nominee. */
export function awardChances(person: Person, booking: Booking, body: AwardBody, category: string): { nominated: number; won: number } {
  const f = fieldOf(person, body, category);
  const q = standout(person, booking);
  return { nominated: Math.min(0.95, (f.slots / f.submissions) * q), won: Math.min(0.95, q / f.slots) };
}

/** A body's date in a year, at noon where it's held. */
const dayOf = (body: AwardBody, year: number, [month, day]: [number, number]): Instant => instantFromZoned({ year, month, day, hour: 12, minute: 0 }, ZONE[body]);

/** What a performer pays to enter the Emmys, in the save's money. */
export const emmyEntry = (sim: Simulation): Money => {
  const usd = EMMY_ENTRY.processing + EMMY_ENTRY.individual;
  const into = saveCurrency(sim.universe);
  return into === 'USD' ? usd : exchange(usd, 'USD', into) ?? usd;
};

/** Why this work can't be entered by them now, or nothing. */
export function entryRefusal(sim: Simulation, person: Person, bookingId: string): string | undefined {
  const booking = careerOf(person).bookings.find((b) => b.id === bookingId);
  if (!booking || booking.status !== 'worked') return 'That isn’t finished work of yours.';
  const cat = categoryOf(booking);
  if (!cat) return 'It isn’t work any award SLATE keeps takes.';
  if (cat.byNetwork) return 'The production enters it.';
  const year = awardYear(booking, cat.body);
  if (entriesOf(person).some((e) => e.bookingId === bookingId)) return 'It’s entered.';
  if (sim.now > dayOf(cat.body, year, AWARD_DATES[cat.body].entryBy)) return 'Its entry deadline has passed.';
  return undefined;
}

/** Enters a guest performance for the Emmys, paying the entry. */
export function enterAward(sim: Simulation, person: Person, bookingId: string): Money {
  const no = entryRefusal(sim, person, bookingId);
  if (no) throw new CommandError(no);
  const booking = careerOf(person).bookings.find((b) => b.id === bookingId)!;
  const cat = categoryOf(booking)!;
  const fee = emmyEntry(sim);
  if (!spend(sim, person, fee, 'The Television Academy, an Emmy entry', 'career')) throw new CommandError('The payment didn’t go through.');
  entriesOf(person).push({ bookingId, body: cat.body, year: awardYear(booking, cat.body), category: cat.category, entered: sim.now, byThem: true });
  return fee;
}

/** The productions' own entries: each regular's season and each British film, once, when the work is done. */
export function enterForThem(sim: Simulation, person: Person): number {
  let entered = 0;
  for (const b of careerOf(person).bookings) {
    if (b.status !== 'worked' || entriesOf(person).some((e) => e.bookingId === b.id)) continue;
    const cat = categoryOf(b);
    if (!cat?.byNetwork) continue;
    entriesOf(person).push({ bookingId: b.id, body: cat.body, year: awardYear(b, cat.body), category: cat.category, entered: sim.now, byThem: false });
    entered += 1;
  }
  return entered;
}

function lift(sim: Simulation, person: Person, effect: { recognition: number; reputation: number; morale: number }): void {
  nudge(sim, person, 'recognition', effect.recognition);
  earn(sim, person, effect.reputation);
  person.wellbeing.morale = clamp(person.wellbeing.morale + effect.morale, 0, 100);
}

/** A body's nominations, on its day: each of the year's entries drawn. How many nominated. */
export function announceNominations(sim: Simulation, person: Person, body: AwardBody, year: number, odds?: number): number {
  let n = 0;
  for (const e of entriesOf(person)) {
    if (e.body !== body || e.year !== year || e.nominated !== undefined) continue;
    const booking = careerOf(person).bookings.find((b) => b.id === e.bookingId);
    if (!booking) continue;
    e.nominated = sim.rng('awards.vote', person.id, `${e.bookingId}-nominated`).next() < (odds ?? awardChances(person, booking, body, e.category).nominated);
    if (!e.nominated) continue;
    n += 1;
    lift(sim, person, AWARD_EFFECT.nominated);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'Nominated', body: `${categoryName(person, e)}, for ${roleById(booking.roleId).label}.`, importance: 85, route: '/workspace/career' });
  }
  return n;
}

/** A body's ceremony: each nominee's chance at the win. How many won. */
export function holdCeremony(sim: Simulation, person: Person, body: AwardBody, year: number): number {
  let n = 0;
  for (const e of entriesOf(person)) {
    if (e.body !== body || e.year !== year || !e.nominated || e.won !== undefined) continue;
    const booking = careerOf(person).bookings.find((b) => b.id === e.bookingId)!;
    e.won = sim.rng('awards.vote', person.id, `${e.bookingId}-won`).next() < awardChances(person, booking, body, e.category).won;
    if (!e.won) continue;
    n += 1;
    lift(sim, person, AWARD_EFFECT.won);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'You Won', body: `${categoryName(person, e)}, for ${roleById(booking.roleId).label}.`, importance: 95, route: '/workspace/career' });
  }
  return n;
}

export function registerAwards(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'awards.day', (_e, { sim: s }) => {
    const person = s.player;
    if (!person.career) return;
    enterForThem(s, person);
    for (const body of Object.keys(AWARD_DATES) as AwardBody[]) {
      const today = dateKey(s.now, ZONE[body]);
      const year = zonedParts(s.now, ZONE[body]).year;
      const d = AWARD_DATES[body];
      if (today === dateKey(dayOf(body, year, d.nominations), ZONE[body])) announceNominations(s, person, body, year);
      if (today === dateKey(dayOf(body, year, d.ceremony), ZONE[body])) holdCeremony(s, person, body, year);
    }
  });
  sim.onCommand<{ bookingId: string }, { paid: Money }>('career.enter_award', (p, { sim: s }) => ({ paid: enterAward(s, s.player, String(p?.bookingId)) }));
}
