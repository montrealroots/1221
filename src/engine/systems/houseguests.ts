/**
 * SLATE — a friend from another town come to stay (from 2026-10-05, the
 * reader of a guest room, `docs/REQUIREMENTS.md` 41c).
 *
 * Until then a friend who lived elsewhere couldn't be seen at all unless you
 * went to them: every invitation home said they lived in another town, and a
 * spare bedroom could only be kept spare or used for storage.
 *
 * **The room.** A spare bedroom of a home you own is made a guest room
 * (`home.room_use`), and it's ready for a guest with a bed put in it
 * (`items.move` with the room). A lodger isn't let it, and nothing given over
 * takes it while another bedroom is free (`roomList` in `systems/rooms.ts`).
 *
 * **Who comes.** A friend, by Hall's ninety hours, who lives in another town
 * (one who lives in yours is asked over instead), asked to arrive at an hour
 * they'd come to a visit, for one to fourteen nights, SLATE's limit; not a
 * rival, nor somebody you stood up in the last week. One guest a guest room
 * at a time.
 *
 * **The stay.** They arrive and the first two hours are a visit's
 * (`SOCIAL.visitMinutes`), which you must be home for, or you've stood them
 * up and they go home. Each day after, until they leave, they eat at yours:
 * a day's groceries where you live, the cost of living's figure for one
 * person (`foodOf`), paid by you, a third less for each meal you served
 * them from what you cooked that day (from 2026-10-06). Each of those days counts a visit's hours
 * to the friendship where you're in town, and a person's day of water at
 * the town's own figure (`guestDays`, `litersUsed` in `systems/water.ts`).
 * A stay may be called off before it starts, never after.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { CITIES } from '../content/geography';
import { HALL, SOCIAL } from '../content/people';
import { contactsOf, type Contact } from './people';
import { foodOf, spend } from './household';
import { personalityOf } from './personality';
import { livingIn } from './homes';
import { livingOf } from './dwelling';
import { homeKeyOf, itemsOf } from './items';
import { pieceById } from './furnishings';
import { roomList, type Room } from './rooms';

export const STAY_KIND = 'social.stay';
export const STAY_DAY_KIND = 'social.stay_day';
/** The longest stay asked, nights. SLATE's limit. */
export const STAY_NIGHTS = 14;

/** A guest's stay: when they arrive, how many nights, and the room. */
export interface Stay { from: Instant; nights: number; roomId: string; /** Meals served them from what was cooked since the day's food was last bought for them (from 2026-10-06). */ served?: number }

const isBed = (kind: string): boolean => kind === 'furniture:bed' || /bed/i.test(pieceById(kind.slice(5))?.type ?? '');

/** The guest rooms of the home they live in with a bed in each. */
export function guestRooms(sim: Simulation, person: Person): Room[] {
  const home = homeKeyOf(person.home);
  return roomList(sim, person).filter((r) => r.use === 'guest' && itemsOf(person).some((i) => i.at.kind === 'home' && i.at.home === home && i.at.room === r.id && isBed(i.kind)));
}

const until = (s: Stay): Instant => s.from + s.nights * MS_DAY;

/** Why a friend can't be asked to stay then, before they're asked; nothing where they may be. */
export function stayRefusal(sim: Simulation, person: Person, c: Contact | undefined, from: Instant, nights: number): string | undefined {
  if (!c) return 'You don’t know them.';
  const first = c.name.split(' ')[0];
  if (!livingIn(person)) return 'A guest stays in a home you own and live in.';
  if (!Number.isInteger(nights) || nights < 1 || nights > STAY_NIGHTS) return `From one night to ${STAY_NIGHTS}.`;
  if (!(from > sim.now)) return 'Choose when they arrive.';
  if (c.cityId === person.home!.cityId) return `${first} lives in ${CITIES.require(c.cityId).name}: ask them over instead.`;
  if (c.rival) return `${first} would rather not.`;
  if (c.hours < HALL.friend) return `${first} doesn’t know you well enough yet to come and stay.`;
  if (c.stoodUp !== undefined && from - c.stoodUp < 7 * MS_DAY) return `You didn’t come last time, and ${first} isn’t making plans yet.`;
  const hour = zonedParts(from, CITIES.require(person.home!.cityId).timeZone).hour;
  if (hour < SOCIAL.notBefore) return `That’s too early for ${first} to arrive.`;
  if (hour >= SOCIAL.notAfter) return `That’s too late for ${first} to arrive.`;
  if (c.stay) return `${first} is coming to stay already, from ${formatDate(c.stay.from, CITIES.require(person.home!.cityId).timeZone)}.`;
  const rooms = guestRooms(sim, person);
  if (rooms.length === 0) return 'You need a guest room with a bed in it.';
  if (!freeRoom(sim, person, from, nights)) return 'Your guest rooms are taken then.';
  const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < from + SOCIAL.visitMinutes * 60_000 && x.at + x.durationMinutes * 60_000 > from);
  if (clash) return `You have ${clash.label} when ${first} arrives.`;
  return undefined;
}

/** A guest room free for those nights, or nothing. */
function freeRoom(sim: Simulation, person: Person, from: Instant, nights: number): Room | undefined {
  const end = from + nights * MS_DAY;
  const taken = new Set(contactsOf(person).filter((x) => x.stay && x.stay.from < end && until(x.stay) > from).map((x) => x.stay!.roomId));
  return guestRooms(sim, person).find((r) => !taken.has(r.id));
}

/** The guests staying now or coming, with their stays. */
export const guestsOf = (person: Person): (Contact & { stay: Stay })[] => contactsOf(person).filter((c): c is Contact & { stay: Stay } => c.stay !== undefined);

function endStay(sim: Simulation, c: Contact, why: string): void {
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && (one.kind === STAY_KIND || one.kind === STAY_DAY_KIND) && one.payload.contactId === c.id) sim.timeline.cancel(one.id, sim.now);
  delete c.stay;
  c.memory.unshift({ at: sim.now, what: why });
}

export function registerHouseguests(sim: Simulation): void {
  sim.onCommand<{ contactId: string; from: Instant; nights: number }, { from: Instant; until: Instant; roomId: string }>('social.ask_to_stay', (p, { sim: s }) => {
    const person = s.player;
    const c = contactsOf(person).find((x) => x.id === p?.contactId);
    const from = Number(p?.from);
    const nights = Number(p?.nights);
    const no = stayRefusal(s, person, c, from, nights);
    if (no) throw new CommandError(no);
    const room = freeRoom(s, person, from, nights)!;
    c!.stay = { from, nights, roomId: room.id };
    const first = c!.name.split(' ')[0];
    c!.memory.unshift({ at: s.now, what: `Said yes to staying ${nights === 1 ? 'a night' : `${nights} nights`}` });
    s.schedule({ at: from, kind: STAY_KIND, label: `${first} Arrives To Stay`, category: 'relationship', priority: 40, requiresPlayer: true, durationMinutes: SOCIAL.visitMinutes, locationId: person.home!.cityId, payload: { personId: person.id, contactId: c!.id } });
    return { from, until: until(c!.stay), roomId: room.id };
  });

  // Called off before they've come; once they're here, they stay the nights asked.
  sim.onCommand<{ contactId: string }, { cancelled: true }>('social.cancel_stay', (p, { sim: s }) => {
    const c = contactsOf(s.player).find((x) => x.id === p?.contactId);
    if (!c?.stay) throw new CommandError('Nobody’s coming to stay.');
    if (c.stay.from <= s.now) throw new CommandError(`${c.name.split(' ')[0]} is here already.`);
    endStay(s, c, 'You called off their stay');
    return { cancelled: true };
  });

  sim.onSchedule(STAY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person && contactsOf(person).find((x) => x.id === item.payload.contactId);
    if (!person || !c?.stay) return;
    const first = c.name.split(' ')[0];
    if (person.currentLocationId !== person.home?.cityId) {
      c.stoodUp = item.at;
      endStay(s, c, 'Came to stay, and you weren’t home');
      if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: `You Missed ${first}`, body: `${c.name} came to stay and found nobody home, and went back to ${CITIES.require(c.cityId).name}.`, importance: 55, route: '/workspace/people' });
      return;
    }
    c.hours += SOCIAL.visitMinutes / 60;
    c.lastSeen = item.at;
    c.memory.unshift({ at: item.at, what: 'Arrived to stay' });
    const w = person.wellbeing;
    w.morale = clamp(w.morale + SOCIAL.morale * personalityOf(person, 'company') * personalityOf(person, 'moraleSwing'), 0, 100);
    w.stress = clamp(w.stress - SOCIAL.stress, 0, 100);
    s.schedule({ at: item.at + MS_DAY, kind: STAY_DAY_KIND, label: `${first} Staying`, category: 'relationship', payload: { personId: person.id, contactId: c.id, day: 1 } });
  });

  sim.onSchedule(STAY_DAY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person && contactsOf(person).find((x) => x.id === item.payload.contactId);
    if (!person || !c?.stay) return;
    const day = Number(item.payload.day);
    const first = c.name.split(' ')[0];
    // The day's food for them, at what a day's groceries cost where you live, a third less for each meal served them
    // from what was cooked (from 2026-10-06, as the day's own groceries are by the meals from stock), and their day's water.
    const served = Math.min(3, c.stay.served ?? 0);
    delete c.stay.served;
    const food = Math.round((foodOf(s, { ...person, currentLocationId: person.home?.cityId ?? person.currentLocationId }) * (3 - served)) / 3);
    if (food > 0) spend(s, person, food, `Food for ${first}, staying`, 'food', true);
    const l = livingOf(person);
    l.guestDays = (l.guestDays ?? 0) + 1;
    if (person.currentLocationId === person.home?.cityId) { c.hours += SOCIAL.visitMinutes / 60; c.lastSeen = item.at; }
    if (day >= c.stay.nights) {
      c.memory.unshift({ at: item.at, what: `Stayed ${c.stay.nights === 1 ? 'a night' : `${c.stay.nights} nights`}, and went home` });
      delete c.stay;
      return;
    }
    s.schedule({ at: item.at + MS_DAY, kind: STAY_DAY_KIND, label: `${first} Staying`, category: 'relationship', payload: { personId: person.id, contactId: c.id, day: day + 1 } });
  });
}
