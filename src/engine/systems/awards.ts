/**
 * SLATE — awards (Stage 13 of `docs/BACKLOG.md`, from 2026-10-01; the bodies
 * and their fields in `content/awards.ts`).
 *
 * **Which work.** A television guest part, a recurring one and a series
 * regular's are put up for the Primetime Emmys: a guest or recurring part in
 * the guest categories, a regular in the supporting, comedy where the work
 * was one and drama otherwise. A co-star's few lines are under the 5% of the
 * episode the Academy asks of a guest performer, so a co-star isn't. A
 * British feature is put up for BAFTA Film, as supporting. From 2026-10-02 a
 * studio film's supporting role goes up for the Academy Awards, a play on
 * Broadway for the Tonys (featured, in a play), a play in the West End for
 * the Oliviers (supporting) and a Mexican feature for the Ariels
 * (coactuación). The performer's word, actor or actress, is the category's.
 *
 * **Who enters it.** A network enters its series regulars; a guest performer
 * enters themselves, by the entry deadline, at the Academy's $225; a film's
 * or a production's entrant enters its performances for the others.
 *
 * **When.** The Emmys' year is work finished from 1 June to 31 May, decided
 * that July and given in September; BAFTA's and the Academy's are work
 * finished in a calendar year, given the next February and March; the Tonys'
 * runs to the end of April and the Oliviers' to mid February, each given that
 * spring; the Ariels' is a calendar year, given the next October. That a film
 * shot in a year is released in it, and a play opens when its work ends, is
 * SLATE's reading.
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
 *
 * **The ceremony** (from 2026-10-06; until then it was a draw on the day and
 * nobody went): a nominee may go, and it's on the calendar in its town
 * (`CEREMONY`), reached by a journey booked on Travel and dressed for in a
 * suit or a dress, SLATE's reading. Going, the result is told there; a win's
 * recognition is in full only for one who was there, and at a festival
 * premiere's share without them otherwise (`holdCeremony`). The odds are the
 * vote's, whichever.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { dateKey, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { AWARD_DATES, EMMY_ENTRY, EMMY_FIELDS, EMMY_NAMES, OTHER_FIELDS, OTHER_NAMES, type AwardBody } from '../content/awards';
import { careerOf, levelFor, present, roleById, workDays, type Booking } from './career';
import { ATTRIBUTES, earn, nudge } from './attributes';
import { wornNow } from './wardrobe';
import { CITIES } from '../content/geography';
import { spend } from './household';

export interface AwardEntry {
  bookingId: string; body: AwardBody; year: number; category: string; entered: Instant; byThem: boolean; nominated?: boolean; won?: boolean;
  /** A nominee going to the ceremony, on the calendar (from 2026-10-06); and whether they were there, in the room and dressed for it. */
  attending?: true;
  there?: boolean;
}

/**
 * Where each body's ceremony is held, from 2026-10-06: the town its time zone was already read for, and the hall where
 * one was read (`research-career-depth.json`): the Academy Awards at the Dolby Theatre, the Oliviers at the Royal
 * Albert Hall (2026's), the Tonys at Radio City Music Hall (the 79th's). The Emmys', BAFTA's and the Ariels' halls
 * weren't read.
 */
export const CEREMONY: Readonly<Record<AwardBody, { cityId: string; hall?: string }>> = {
  emmys: { cityId: 'us-ca-losangeles' },
  'bafta-film': { cityId: 'uk-eng-london' },
  oscars: { cityId: 'us-ca-losangeles', hall: 'the Dolby Theatre' },
  tonys: { cityId: 'us-ny-newyork', hall: 'Radio City Music Hall' },
  oliviers: { cityId: 'uk-eng-london', hall: 'the Royal Albert Hall' },
  ariel: { cityId: 'mx-cmx-mexicocity' },
};
export const CEREMONY_KIND = 'awards.ceremony';

const ZONE: Readonly<Record<AwardBody, string>> = { emmys: 'America/Los_Angeles', 'bafta-film': 'Europe/London', oscars: 'America/Los_Angeles', tonys: 'America/New_York', oliviers: 'Europe/London', ariel: 'America/Mexico_City' };
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
  if (role.id === 'film-weekly') return { body: 'oscars', category: 'supporting', byNetwork: true };
  if (role.id === 'broadway' || role.id === 'lort-a-plus') return { body: 'tonys', category: 'featured-play', byNetwork: true };
  if (role.id === 'uk-west-end') return { body: 'oliviers', category: 'supporting', byNetwork: true };
  if (role.id === 'mx-film') return { body: 'ariel', category: 'coactuacion', byNetwork: true };
  return undefined;
}

/**
 * The ceremony year a booking's work counts toward: the window its last day
 * falls in, and that window's ceremony, the same year when it falls after the
 * window closes (the Emmys, the Tonys, the Oliviers) and the next otherwise.
 */
export function awardYear(booking: Booking, body: AwardBody): number {
  const days = workDays(booking);
  const last = zonedParts(days[days.length - 1]!.at, ZONE[body]);
  const { windowEnds: [em, ed], ceremony: [cm] } = AWARD_DATES[body];
  const windowYear = last.month > em || (last.month === em && last.day > ed) ? last.year + 1 : last.year;
  return cm < em ? windowYear + 1 : windowYear;
}

/** A category's field and slots, for the performer's word. */
function fieldOf(person: Person, body: AwardBody, category: string): { submissions: number; slots: number } {
  const word = person.performerTitle === 'actress' ? 'actress' : 'actor';
  return body === 'emmys' ? EMMY_FIELDS[category]![word] : OTHER_FIELDS[body][word];
}

/** The category as it's named, with the performer's word. */
export function categoryName(person: Person, entry: Pick<AwardEntry, 'body' | 'category'>): string {
  const actress = person.performerTitle === 'actress';
  const word = actress ? 'Actress' : 'Actor';
  return entry.body === 'emmys' ? EMMY_NAMES[entry.category]!.replace('{title}', word) : OTHER_NAMES[entry.body].replace('{title}', word).replace('{genero}', actress ? 'Femenina' : 'Masculina');
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
    const where = ceremonyOf(body, year);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'Nominated', body: `${categoryName(person, e)}, for ${roleById(booking.roleId).label}. The ceremony is in ${CITIES.get(where.cityId)?.name ?? 'its town'}${where.hall ? `, at ${where.hall}` : ''}, on ${formatDate(where.at, ZONE[body])}; going is on Career.`, importance: 85, route: '/workspace/career' });
  }
  return n;
}

/** A body's ceremony, as it's held in a year: noon on its day where it's held, the time the vote has always been read at, and where. */
export function ceremonyOf(body: AwardBody, year: number): { at: Instant; cityId: string; hall?: string } {
  return { at: dayOf(body, year, AWARD_DATES[body].ceremony), ...CEREMONY[body] };
}

/** Why a nominee can't say they're going to the ceremony, or nothing. */
export function attendRefusal(sim: Simulation, person: Person, bookingId: string, body: AwardBody): string | undefined {
  const e = entriesOf(person).find((x) => x.bookingId === bookingId && x.body === body);
  if (!e?.nominated) return 'Only a nominee is asked.';
  if (e.won !== undefined) return 'Its ceremony has been held.';
  if (e.attending) return 'You’re going.';
  if (ceremonyOf(body, e.year).at <= sim.now) return 'Its ceremony has been held.';
  return undefined;
}

/** Dressed for a ceremony: a suit or a dress on, SLATE's reading (no body's dress code was read). */
export const dressedForCeremony = (person: Person): boolean => wornNow(person).some((g) => g.garment.slot === 'suit' || g.garment.slot === 'dress');

/**
 * A body's ceremony: each nominee's chance at the win, at the odds it always had. How many won. From 2026-10-06 a
 * nominee going is held at the ceremony itself (`atCeremony`), told there, and a win's recognition is the room's and
 * the broadcast's seeing them take it: there, in its town and dressed for it, in full; not, at the share a festival's
 * premiere without them earns (`ATTRIBUTES.build.festival.absent`, SLATE's estimate). Until then nobody could go, and
 * every win lifted recognition in full.
 */
export function holdCeremony(sim: Simulation, person: Person, body: AwardBody, year: number, atCeremony = false): number {
  let n = 0;
  const where = ceremonyOf(body, year);
  for (const e of entriesOf(person)) {
    if (e.body !== body || e.year !== year || !e.nominated || e.won !== undefined) continue;
    // Going, it's decided at the ceremony; the day's turn leaves it to then.
    if (Boolean(e.attending) !== atCeremony) continue;
    const booking = careerOf(person).bookings.find((b) => b.id === e.bookingId)!;
    e.won = sim.rng('awards.vote', person.id, `${e.bookingId}-won`).next() < awardChances(person, booking, body, e.category).won;
    e.there = atCeremony && present(person, sim.now, where.cityId) && dressedForCeremony(person);
    const place = where.hall ?? CITIES.get(where.cityId)?.name ?? 'the ceremony';
    if (atCeremony && person.id === sim.universe.playerId && !e.there) sim.notify({ category: 'career', title: 'You Weren’t There', body: present(person, sim.now, where.cityId) ? `Not dressed for it, you didn’t go in to ${place}.` : `You weren’t in ${CITIES.get(where.cityId)?.name ?? 'its town'} for it.`, importance: 60, route: '/workspace/career' });
    if (!e.won) {
      if (e.there && person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'Not This Time', body: `At ${place}, ${categoryName(person, e)} went to another nominee.`, importance: 70, route: '/workspace/career' });
      continue;
    }
    n += 1;
    lift(sim, person, { ...AWARD_EFFECT.won, recognition: AWARD_EFFECT.won.recognition * (e.there ? 1 : ATTRIBUTES.build.festival.absent) });
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'You Won', body: `${e.there ? `At ${place}: ` : ''}${categoryName(person, e)}, for ${roleById(booking.roleId).label}.`, importance: 95, route: '/workspace/career' });
  }
  return n;
}

/** A nominee going to the ceremony: on the calendar, the clock stopping for it there. */
export function attendCeremony(sim: Simulation, person: Person, bookingId: string, body: AwardBody): Instant {
  const no = attendRefusal(sim, person, bookingId, body);
  if (no) throw new CommandError(no);
  const e = entriesOf(person).find((x) => x.bookingId === bookingId && x.body === body)!;
  const where = ceremonyOf(body, e.year);
  e.attending = true;
  // One ceremony on the calendar however many of their nominations it decides.
  const listed = sim.universe.scheduled.some((i) => i.kind === CEREMONY_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.body === body && i.payload.year === e.year);
  if (!listed) sim.schedule({ at: where.at, kind: CEREMONY_KIND, label: `The Ceremony: ${categoryName(person, e)}`, category: 'career', priority: 30, stopsClock: true, locationId: where.cityId, payload: { personId: person.id, body, year: e.year } });
  return where.at;
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
  // Going to the ceremony as a nominee (from 2026-10-06): getting there is a journey booked on Travel, dressing for it on Clothes.
  sim.onCommand<{ bookingId: string; body: AwardBody }, { at: Instant }>('career.attend_ceremony', (p, { sim: s }) => ({ at: attendCeremony(s, s.player, String(p?.bookingId), p?.body as AwardBody) }));
  sim.onSchedule(CEREMONY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) holdCeremony(s, person, item.payload.body as AwardBody, Number(item.payload.year), true);
  });
}
