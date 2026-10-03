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
 *
 * From 2026-10-03 a child of yours who lives with you can come too
 * (`travel.child`; `research-health-travel-gaps.json`, each airline's own
 * page), both ways on a round trip, at the airlines' child fares: under two
 * on your lap, free on a flight within America and Canada (Delta), €25 a
 * flight within Europe (Aer Lingus), and 10% of the adult fare otherwise
 * (Delta's and Aer Lingus's to and from North America); from two, a seat of
 * their own at the fare. A car, a chartered plane or a driver takes them for
 * nothing more; a train's child fare wasn't read, so a child goes by air or
 * by road. From two, they take a place in the room.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { CITIES } from '../content/geography';
import { HALL } from '../content/people';
import { contactsOf, type Contact } from './people';
import { journeysOf, type Journey } from './journey';
import { hotelById } from './hotels';
import { childrenOf, livesWithYou, type Child } from './children';
import { airportByCode } from './airports';
import { railRouteById } from './rail';
import { MS_DAY } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payFromBank } from './household';

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

/** A child's fares: on a lap under two, at the airlines' rules; a seat from two. */
export const LAP_CHILD = { underYears: 2, shareOfFare: 0.1, europeEur: 25 } as const;
const EUROPE = new Set(['GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'ES', 'PT', 'IT', 'CH', 'AT', 'DK', 'SE', 'NO', 'FI', 'IS', 'PL', 'CZ', 'GR']);
const YEAR = 365.2425 * MS_DAY;
export const childrenAlong = (j: Journey): string[] => j.childIds ?? [];
const ageOn = (child: Child, at: number) => (at - child.born) / YEAR;

/** What a child's way costs on a journey, in the save's money, or why they can't go that way. */
export function childFare(sim: Simulation, j: Journey, child: Child): Money | string {
  if (j.by && railRouteById(j.by)) return 'SLATE keeps no child’s fare for the train, so a child goes by air or by road.';
  if (j.by) return 0;
  const lap = ageOn(child, j.leaveAt) < LAP_CHILD.underYears;
  const cur = saveCurrency(sim.universe);
  let fare = 0;
  for (const leg of j.legs) {
    if (leg.mode !== 'flight') continue;
    if (!lap) { fare += leg.fare; continue; }
    const a = airportByCode(leg.from)?.country ?? '';
    const b = airportByCode(leg.to)?.country ?? '';
    const northAmerica = (c: string) => c === 'US' || c === 'CA';
    if (northAmerica(a) && northAmerica(b)) continue;
    fare += EUROPE.has(a) && EUROPE.has(b) ? (cur === 'EUR' ? LAP_CHILD.europeEur * 100 : exchange(LAP_CHILD.europeEur * 100, 'EUR', cur) ?? 0) : Math.round(leg.fare * LAP_CHILD.shareOfFare);
  }
  return fare;
}

/** The beds taken beside yours: everyone along, and each child of two or more. */
function bedsTaken(person: Person, j: Journey): number {
  const kids = childrenAlong(j).map((id) => childrenOf(person).find((k) => k.id === id)).filter((k): k is Child => k !== undefined && ageOn(k, j.leaveAt) >= LAP_CHILD.underYears);
  return companionsOf(j).length + kids.length;
}

/** Why a child can't come along, or nothing. */
export function childRefusal(sim: Simulation, person: Person, journeyId: string, childId: string): string | undefined {
  const out = journeysOf(person).find((j) => j.id === journeyId);
  if (!out || out.status !== 'booked') return 'That isn’t a journey you have booked.';
  if (out.tripId && journeysOf(person).some((j) => j.tripId === out.tripId && j.leaveAt < out.leaveAt)) return 'Bring them on the way out.';
  const child = childrenOf(person).find((k) => k.id === childId);
  if (!child || ageOn(child, out.leaveAt) >= 18) return 'That isn’t a child of yours.';
  if (!livesWithYou(child)) return `${child.name.split(' ')[0]} lives with their other parent.`;
  if (childrenAlong(out).includes(childId)) return 'They’re coming already.';
  if (ageOn(child, out.leaveAt) >= LAP_CHILD.underYears && bedsTaken(person, out) + 2 > sleepsIn(out)) return 'The room sleeps no more.';
  for (const j of [out, wayBack(person, out)].filter((x): x is Journey => x !== undefined)) {
    const fare = childFare(sim, j, child);
    if (typeof fare === 'string') return fare;
  }
  return undefined;
}

/** What the journey's rooms sleep: a named room's beds; two otherwise, SLATE's reading of a hotel room; each room booked. */
export function sleepsIn(j: Journey): number {
  const named = j.hotel?.named;
  const room = named ? hotelById(named.hotelId)?.rooms.find((r) => r.name === named.room) : undefined;
  return (sleepsOf(room?.bed) ?? 2) * (j.hotel?.rooms ?? 1);
}

/** Why they can't be asked along, or nothing; and why they'd say no, as a reason given. */
export function companionRefusal(person: Person, journeyId: string, contactId: string): { refused?: string; declines?: string } {
  const out = journeysOf(person).find((j) => j.id === journeyId);
  if (!out || out.status !== 'booked') return { refused: 'That isn’t a journey you have booked.' };
  if (out.tripId && journeysOf(person).some((j) => j.tripId === out.tripId && j.leaveAt < out.leaveAt)) return { refused: 'Ask them on the way out.' };
  const along = companionsOf(out);
  if (along.includes(contactId)) return { refused: 'They’re coming already.' };
  if (bedsTaken(person, out) + 2 > sleepsIn(out)) return { refused: bedsTaken(person, out) ? 'The room sleeps no more.' : 'The room sleeps only you.' };
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

  sim.onCommand<{ journeyId: string; childId: string }, { paid: Money }>('travel.child', (p, { sim: s }) => {
    const person = s.player;
    const no = childRefusal(s, person, String(p?.journeyId), String(p?.childId));
    if (no) throw new CommandError(no);
    const out = journeysOf(person).find((j) => j.id === p.journeyId)!;
    const child = childrenOf(person).find((k) => k.id === p.childId)!;
    const halves = [out, wayBack(person, out)].filter((x): x is Journey => x !== undefined);
    const fares = halves.map((j) => childFare(s, j, child) as Money);
    const paid = fares.reduce((a, b) => a + b, 0);
    if (paid > 0 && !payFromBank(s, person, paid, `${child.name}'s fare to ${CITIES.require(out.toCity).name}`, 'travel')) throw new CommandError(`${formatMoney(paid, saveCurrency(s.universe))} is more than the bank can cover.`);
    halves.forEach((j, i) => { j.childIds = [...childrenAlong(j), child.id]; j.total += fares[i]!; });
    return { paid };
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

