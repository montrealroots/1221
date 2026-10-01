/**
 * SLATE — the people a life knows, and time spent with them (Stage 10 of
 * `docs/BACKLOG.md`, from 2026-10-01; the figures in `content/people.ts`).
 *
 * **Who.** Somebody known is met where Americans meet their close friends,
 * at school and at work. The class at Yale is known at the degree, each
 * classmate as near as the three years made them (`BONDS` in
 * `systems/school.ts`): a close friend at Hall's two hundred hours, a
 * friend at ninety, the rest at fifty; a rival stays one. They live in New
 * York after it, SLATE's reading of where a drama school's class goes. And
 * each job leaves one castmate known, from the town the work was in, with
 * nothing yet but the job. Each has a name of their country, an age near
 * the actor's, and the most they'd spend on a meal out.
 *
 * **An invitation** is to a meal at a restaurant in their town, each paying
 * their own, or a visit to your home. Asked, they say yes or no, and why:
 * - a rival would rather not;
 * - they live in another town;
 * - they don't come to the home of somebody they've spent fewer than
 *   Hall's fifty hours with;
 * - the hour is before ten or after ten at night;
 * - the place is dearer than they'd go to;
 * - they saw you in the last three days;
 * - you didn't come the last time, and they won't be asked again until a
 *   week has passed (`SOCIAL`, SLATE's estimates).
 * Said yes, it's on the calendar. Kept, it adds its hours to what you've
 * spent together, which is what makes a friend (`levelOf`), lifts the mood
 * by how much you need company and eases stress, and your meal is paid and
 * eaten. Missed, they remember it.
 *
 * **Living alone** weighs on how long a life lasts, at Holt-Lunstad's odds
 * (`livingFactor`, read by `systems/mortality.ts`): a place of one's own
 * with no lodger is living alone; a room in a shared flat or a friend's
 * sofa isn't.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, formatTime, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { CITIES } from '../content/geography';
import { HALL, LIVING_ALONE, NAMES, SOCIAL } from '../content/people';
import type { Tier } from '../content/restaurants';
import { DINING_MINUTES } from '../content/dining';
import { BONDS } from './school';
import { diningQuote, restaurantById } from './dining';
import { spend } from './household';
import { personalityOf } from './personality';
import { homeById } from './homes';
import { applyLookingAfter } from './life';

export const MEET_KIND = 'social.meet';

export type Spends = Exclude<Tier, 'fast'>;
const TIERS: readonly Tier[] = ['fast', 'casual', 'mid', 'upscale'];

export interface Contact {
  id: string;
  name: string;
  /** Where they live. */
  cityId: string;
  born: Instant;
  met: { at: Instant; how: 'school' | 'work'; what?: string };
  /** Hours spent together, Hall's measure. */
  hours: number;
  rival?: boolean;
  /** The dearest kind of place they'd eat at. */
  spends: Spends;
  lastSeen?: Instant;
  /** What happened between you, the latest first. */
  memory: { at: Instant; what: string }[];
  /** When you last didn't come. */
  stoodUp?: Instant;
}

export interface Invitation { contactId: string; at: Instant; what: 'meal' | 'visit'; restaurantId?: string; item?: string }

export const contactsOf = (person: Person): Contact[] => (person.contacts ??= []);

/** What somebody is to you, by the hours you've spent together. */
export function levelOf(c: Contact): 'Rival' | 'Close Friend' | 'Friend' | 'Casual Friend' | 'Acquaintance' {
  if (c.rival) return 'Rival';
  return c.hours >= HALL.close ? 'Close Friend' : c.hours >= HALL.friend ? 'Friend' : c.hours >= HALL.casual ? 'Casual Friend' : 'Acquaintance';
}

const NAME_MARKET: Record<string, keyof typeof NAMES> = { us: 'us', uk: 'uk', ie: 'ie', ca: 'ca', mx: 'mx' };

/** Somebody new, named as their country names people, near the actor's age. */
function newContact(sim: Simulation, person: Person, cityId: string, key: string, met: Contact['met']): Contact {
  const rng = sim.rng('social.person', person.id, key);
  const names = NAMES[NAME_MARKET[CITIES.get(cityId)?.countryId ?? 'us'] ?? 'us'];
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rng.next() * list.length)]!;
  const given = rng.next() < 0.5 ? names.female : names.male;
  const years = 365.2425 * MS_DAY;
  return {
    id: sim.nextId('contact'), name: `${pick(given)} ${pick(names.family)}`, cityId,
    born: person.birthInstant + Math.round((rng.next() * 10 - 5) * years),
    met, hours: 0, spends: pick(['casual', 'mid', 'upscale'] as const), memory: [{ at: sim.now, what: met.how === 'school' ? 'At school together' : `Worked together${met.what ? ` on ${met.what}` : ''}` }],
  };
}

/** The class known at the degree, each as near as the three years made them. */
export function knowTheClass(sim: Simulation, person: Person, classmates: readonly { name: string; bond?: number }[]): void {
  for (const [i, mate] of classmates.entries()) {
    const c = newContact(sim, person, 'us-ny-newyork', `class-${i}`, { at: sim.now, how: 'school' });
    const bond = mate.bond ?? 0;
    c.name = mate.name;
    c.hours = bond >= BONDS.close ? HALL.close : bond >= BONDS.friend ? HALL.friend : HALL.casual;
    if (bond <= BONDS.rival) c.rival = true;
    contactsOf(person).push(c);
  }
}

/** A castmate known from a job, in the town it was worked in. */
export function metAtWork(sim: Simulation, person: Person, cityId: string, bookingId: string, what: string): Contact {
  const c = newContact(sim, person, cityId, `work-${bookingId}`, { at: sim.now, how: 'work', what });
  contactsOf(person).push(c);
  return c;
}

/** Why a friend would say no to an invitation, or nothing where they'd come. */
export function declines(person: Person, c: Contact, inv: Invitation): string | undefined {
  const first = c.name.split(' ')[0];
  if (c.rival) return `${first} would rather not.`;
  const where = inv.what === 'meal' ? restaurantById(inv.restaurantId ?? '')?.cityId : person.home?.cityId;
  if (where !== c.cityId) return `${first} lives in ${CITIES.require(c.cityId).name}.`;
  if (inv.what === 'visit' && c.hours < HALL.casual) return `${first} doesn’t know you well enough yet to come to your home.`;
  const hour = zonedParts(inv.at, CITIES.require(c.cityId).timeZone).hour;
  if (hour < SOCIAL.notBefore) return `That’s too early for ${first}.`;
  if (hour >= SOCIAL.notAfter) return `That’s too late for ${first}.`;
  const r = inv.what === 'meal' ? restaurantById(inv.restaurantId ?? '') : undefined;
  if (r && TIERS.indexOf(r.tier) > TIERS.indexOf(c.spends)) return `${r.name} is more than ${first} would spend.`;
  if (c.lastSeen !== undefined && inv.at - c.lastSeen < SOCIAL.rest * MS_DAY) return `${first} saw you on ${formatDate(c.lastSeen, CITIES.require(c.cityId).timeZone)}; another time.`;
  if (c.stoodUp !== undefined && inv.at - c.stoodUp < 7 * MS_DAY) return `You didn’t come last time, and ${first} isn’t making plans yet.`;
  return undefined;
}

/** Why an invitation can't be made at all, before anybody's asked. */
export function inviteRefusal(sim: Simulation, person: Person, inv: Invitation): string | undefined {
  const c = contactsOf(person).find((x) => x.id === inv.contactId);
  if (!c) return 'You don’t know them.';
  if (inv.at <= sim.now) return 'Choose a time to come.';
  if (inv.what === 'meal') {
    const r = restaurantById(inv.restaurantId ?? '');
    if (!r) return 'Choose a restaurant.';
    if (!inv.item || !diningQuote(sim, r, [inv.item], 'in')) return 'Choose what you’ll have, from what SLATE has a price for.';
  } else if (!person.home || person.home.kind === 'sofa') return 'You have no home of your own to ask them to.';
  const ends = inv.at + minutesOf(inv) * 60_000;
  const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < ends && x.at + x.durationMinutes * 60_000 > inv.at);
  if (clash) return `You have ${clash.label} then.`;
  return undefined;
}

/** How long it lasts: a meal as long as a meal at that kind of place, a visit two hours. */
const minutesOf = (inv: Invitation): number => {
  const r = inv.what === 'meal' ? restaurantById(inv.restaurantId ?? '') : undefined;
  return r ? DINING_MINUTES[r.tier] : SOCIAL.visitMinutes;
};

export function registerPeople(sim: Simulation): void {
  sim.onCommand<Invitation, { accepted: boolean; reason?: string }>('social.invite', (p, { sim: s }) => {
    const person = s.player;
    const inv: Invitation = { contactId: String(p?.contactId), at: Number(p?.at), what: p?.what === 'visit' ? 'visit' : 'meal', ...(p?.restaurantId ? { restaurantId: String(p.restaurantId) } : {}), ...(p?.item ? { item: String(p.item) } : {}) };
    const no = inviteRefusal(s, person, inv);
    if (no) throw new CommandError(no);
    const c = contactsOf(person).find((x) => x.id === inv.contactId)!;
    const reason = declines(person, c, inv);
    const r = inv.restaurantId ? restaurantById(inv.restaurantId) : undefined;
    const what = r ? `a meal at ${r.name}` : 'a visit to your home';
    c.memory.unshift({ at: s.now, what: reason ? `Said no to ${what}: ${reason}` : `Said yes to ${what}` });
    if (reason) return { accepted: false, reason };
    const first = c.name.split(' ')[0];
    s.schedule({ at: inv.at, kind: MEET_KIND, label: r ? `${r.name} With ${first}` : `${first} Comes Over`, category: 'relationship', priority: 40, requiresPlayer: true, durationMinutes: minutesOf(inv), locationId: c.cityId, payload: { personId: person.id, ...inv } });
    return { accepted: true };
  });

  sim.onSchedule(MEET_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person && contactsOf(person).find((x) => x.id === item.payload.contactId);
    if (!person || !c) return;
    const r = item.payload.restaurantId ? restaurantById(String(item.payload.restaurantId)) : undefined;
    const where = r?.cityId ?? person.home?.cityId;
    const first = c.name.split(' ')[0];
    if (person.currentLocationId !== where) {
      c.stoodUp = item.at;
      c.memory.unshift({ at: item.at, what: 'You didn’t come' });
      if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: `You Missed ${first}`, body: `${c.name} waited for you${r ? ` at ${r.name}` : ''}, and will remember it.`, importance: 50, route: '/workspace/people' });
      return;
    }
    // Your own meal, at its price, and eaten; theirs is theirs to pay. What the bank and the card can't pay is owed.
    if (r && item.payload.item) {
      const q = diningQuote(s, r, [String(item.payload.item)], 'in');
      if (q) spend(s, person, q.total, r.name, 'food', true);
      applyLookingAfter(person, 'order', item.at);
    }
    const hours = (item.durationMinutes ?? 60) / 60;
    c.hours += hours;
    // A missed meeting lapses on its own a week on, and nothing is kept inside that week, so it isn't cleared here.
    c.lastSeen = item.at;
    c.memory.unshift({ at: item.at, what: r ? `A meal at ${r.name}, ${formatTime(item.at, CITIES.require(r.cityId).timeZone)}` : 'Came over' });
    const w = person.wellbeing;
    w.morale = clamp(w.morale + SOCIAL.morale * personalityOf(person, 'company') * personalityOf(person, 'moraleSwing'), 0, 100);
    w.stress = clamp(w.stress - SOCIAL.stress, 0, 100);
  });
}

/** How living alone, or not, moves the life table (`systems/mortality.ts`). */
export function livingFactor(person: Person): number {
  const spread = 1 + (LIVING_ALONE.oddsRatio - 1) * LIVING_ALONE.share;
  return livesAlone(person) ? LIVING_ALONE.oddsRatio / spread : 1 / spread;
}

/** A place of one's own, rented or owned, with nobody in its spare rooms. */
export function livesAlone(person: Person): boolean {
  const home = person.home;
  if (!home || home.kind === 'shared' || home.kind === 'sofa') return false;
  if (home.kind === 'owned' && home.homeId) return !(homeById(person, home.homeId)?.lodgers?.length);
  return true;
}
