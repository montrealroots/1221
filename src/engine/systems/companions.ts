/**
 * SLATE — a friend or partner along on a journey (the master plan's §47m, from
 * 2026-10-02).
 *
 * A friend or a partner can be asked along on a journey you've booked from
 * the town they live in. They say yes or no, and why, as to anything else:
 * a rival won't come; a friend who lives elsewhere isn't setting out from
 * here; and traveling together is for a friend, at Hall's ninety hours, or a
 * partner. Each pays their own fare, as each pays their own meal; a hotel
 * room booked for the journey is shared, its price split evenly, and they pay
 * you back their half when they say yes. The journey is time together: its
 * waking hours, two-thirds of the whole, SLATE's reading of a day's
 * sixteen waking hours in twenty-four, counted to the friendship when it's
 * over. Called off, nobody owes anybody.
 *
 * From later on 2026-10-02, more than one can come, as many as the room
 * sleeps beside you: a named hotel's room by its beds as the hotel lists
 * them (a king, a queen or a double two, a twin or a bunk one, a sofa bed
 * two); a room whose beds weren't read, or the town's average hotel, two.
 * Each who joins pays back their share of the room as it's split again
 * among everyone, so the room always comes out evenly.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { HALL } from '../content/people';
import { contactsOf, type Contact } from './people';
import { journeysOf, type Journey } from './journey';
import { hotelById } from './hotels';

export const COMPANION_HOME_KIND = 'travel.companion_home';
/** Waking hours in a day's twenty-four: SLATE's reading. */
export const AWAKE_SHARE = 16 / 24;

/** The way home of a round trip, where there is one. */
const wayBack = (person: Person, out: Journey): Journey | undefined => (out.tripId ? journeysOf(person).find((j) => j.tripId === out.tripId && j.id !== out.id) : undefined);

/** Everybody coming: an older save's one companion, or the list. */
export const companionsOf = (j: Journey): string[] => j.companionIds ?? (j.companionId ? [j.companionId] : []);

/** How many a bed description sleeps: a king, a queen or a double two, a twin, a single or a bunk one, a sofa bed two; nothing where it says no bed. */
export function sleepsOf(bed: string | null | undefined): number | undefined {
  if (!bed) return undefined;
  let n = 0;
  for (const m of bed.toLowerCase().matchAll(/(?:(\d+)\s+)?(?:[a-z]+\s+)?(king|queen|double|full|twin|single|bunk)s?/g)) n += Number(m[1] ?? 1) * (/king|queen|double|full/.test(m[2]!) ? 2 : 1);
  // "2 Bunks or 4 Twins" is either; the smaller.
  if (/\bor\b/.test(bed.toLowerCase())) { const parts = bed.split(/\bor\b/i).map((p) => sleepsOf(p) ?? 0); n = Math.min(...parts); }
  return n > 0 ? n : undefined;
}

/** What the journey's room sleeps: a named room's beds; two otherwise, SLATE's reading of a hotel room. */
export function sleepsIn(j: Journey): number {
  const named = j.hotel?.named;
  const room = named ? hotelById(named.hotelId)?.rooms.find((r) => r.name === named.room) : undefined;
  return sleepsOf(room?.bed) ?? 2;
}

/** Why they can't be asked along, or nothing; and why they'd say no, as a reason given. */
export function companionRefusal(person: Person, journeyId: string, contactId: string): { refused?: string; declines?: string } {
  const out = journeysOf(person).find((j) => j.id === journeyId);
  if (!out || out.status !== 'booked') return { refused: 'That isn’t a journey you have booked.' };
  if (out.tripId && journeysOf(person).some((j) => j.tripId === out.tripId && j.leaveAt < out.leaveAt)) return { refused: 'Ask them on the way out.' };
  const along = companionsOf(out);
  if (along.includes(contactId)) return { refused: 'They’re coming already.' };
  if (along.length + 2 > sleepsIn(out)) return { refused: along.length ? 'The room sleeps no more.' : 'The room sleeps only you.' };
  const c = contactsOf(person).find((x) => x.id === contactId);
  if (!c) return { refused: 'You don’t know them.' };
  const first = c.name.split(' ')[0];
  if (c.rival) return { declines: `${first} would rather not.` };
  if (c.cityId !== out.fromCity) return { declines: `${first} lives in ${CITIES.require(c.cityId).name}, not where you set out from.` };
  if (!c.dating && c.livesWith === undefined && c.hours < HALL.friend) return { declines: `${first} doesn’t know you well enough yet to go away together.` };
  return {};
}

export function registerCompanions(sim: Simulation): void {
  sim.onCommand<{ journeyId: string; contactId: string }, { accepted: boolean; reason?: string; repaid?: Money }>('travel.companion', (p, { sim: s }) => {
    const person = s.player;
    const q = companionRefusal(person, String(p?.journeyId), String(p?.contactId));
    if (q.refused) throw new CommandError(q.refused);
    const out = journeysOf(person).find((j) => j.id === p.journeyId)!;
    const c = contactsOf(person).find((x) => x.id === p.contactId)! as Contact;
    const where = CITIES.require(out.toCity).name;
    c.memory.unshift({ at: s.now, what: q.declines ? `Said no to a trip to ${where}: ${q.declines}` : `Said yes to a trip to ${where}` });
    if (q.declines) return { accepted: false, reason: q.declines };
    out.companionIds = [...companionsOf(out), c.id];
    delete out.companionId;
    // Their share of a room booked for the journey, the room split again among everyone, paid back to you.
    const room = out.hotel?.price ?? out.let?.price ?? 0;
    const n = out.companionIds.length;
    const repaid = Math.floor((room * n) / (n + 1)) - (out.companionRepaid ?? 0);
    out.companionRepaid = (out.companionRepaid ?? 0) + repaid;
    if (repaid > 0) s.post({ memo: `${c.name}: their share of the room in ${where}`, category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: repaid }, { accountId: s.nominalAccount('expense', 'Travel').id, amount: -repaid }] });
    const end = (wayBack(person, out) ?? out).arriveAt;
    s.schedule({ at: end, kind: COMPANION_HOME_KIND, label: `Home With ${c.name.split(' ')[0]}`, category: 'relationship', priority: 30, payload: { personId: person.id, journeyId: out.id, contactId: c.id } });
    return { accepted: true, ...(repaid ? { repaid } : {}) };
  });

  // The trip over: its waking hours, together.
  sim.onSchedule(COMPANION_HOME_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const out = person ? journeysOf(person).find((j) => j.id === item.payload.journeyId) : undefined;
    const c = person ? contactsOf(person).find((x) => x.id === item.payload.contactId) : undefined;
    if (!person || !out || !c || out.status === 'canceled' || out.status === 'missed' || !companionsOf(out).includes(c.id)) return;
    const hours = ((item.at - out.leaveAt) / 3_600_000) * AWAKE_SHARE;
    c.hours += hours;
    c.lastSeen = item.at;
    c.memory.unshift({ at: item.at, what: `A trip to ${CITIES.require(out.toCity).name} together, ${Math.round(hours)} hours` });
    if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: `Back With ${c.name.split(' ')[0]}`, body: `${Math.round(hours)} hours together in ${CITIES.require(out.toCity).name}.`, importance: 30, route: '/workspace/people' });
  });
}

