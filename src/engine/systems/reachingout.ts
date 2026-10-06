/**
 * SLATE — a friend who asks first (the master plan's §52.7–9, from
 * 2026-10-06; until then nobody known ever asked you to anything, and every
 * meeting was yours to make).
 *
 * Each day, a friend in your home town may ask you to a meal on an evening
 * two to six days on, at a restaurant there they'd spend on, your dish
 * chosen: a close friend about once a fortnight, a friend once a month, a
 * casual one once in ten weeks (`ASKS`, SLATE's estimates by Pew's 29%,
 * decider `social.asks`). They don't ask:
 * - a rival, an acquaintance, or somebody you live with;
 * - from another town than where you live;
 * - while a meeting with them is on the calendar, or an ask unanswered;
 * - within three days of seeing you, a week of being stood up, or a
 *   fortnight of asking or being answered;
 * - for an evening they're at work.
 *
 * You say yes, and it's on the calendar as your own invitation would be,
 * kept or missed the same (`arrange`); or no; or nothing, and it lapses at
 * its hour. Each is remembered, and either answer starts the fortnight.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dateKey, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { ASKS, HALL, SOCIAL } from '../content/people';
import type { Tier } from '../content/restaurants';
import { DINING_MINUTES } from '../content/dining';
import { diningQuote, restaurantById, restaurantsIn } from './dining';
import { atWork } from './availability';
import { MEET_KIND, arrange, contactsOf, inviteRefusal, levelOf, type Contact, type Invitation } from './people';

export const ANSWER_KIND = 'social.answer';

/** A meal a friend has asked you to: when, where, your dish, and when they asked. */
export interface Ask { at: Instant; restaurantId: string; item: string; made: Instant }

const TIERS: readonly Tier[] = ['fast', 'casual', 'mid', 'upscale'];

/** How often they ask, a day, by how near you are. */
export const askOdds = (c: Contact): number => (c.hours >= HALL.close ? ASKS.weekly.close : c.hours >= HALL.friend ? ASKS.weekly.friend : ASKS.weekly.casual) / 7;

/** Whether they'd ask at all now, before anything is drawn. */
export function mayAsk(sim: Simulation, person: Person, c: Contact): boolean {
  if (c.rival || c.ask || c.livesWith !== undefined || levelOf(c) === 'Acquaintance') return false;
  if (c.cityId !== person.home?.cityId) return false;
  const since = (t: Instant | undefined, days: number) => t !== undefined && sim.now - t < days * MS_DAY;
  if (since(c.lastSeen, SOCIAL.rest) || since(c.stoodUp, 7) || since(c.askedAt, ASKS.pause)) return false;
  return !sim.universe.scheduled.some((x) => x.status === 'pending' && x.kind === MEET_KIND && x.payload.personId === person.id && x.payload.contactId === c.id);
}

/** Whether they ask today, at the odds given (their own, unless a sweep says otherwise). */
export const asksToday = (sim: Simulation, c: Contact, day: string, odds = askOdds(c)): boolean => sim.rng('social.asks', c.id, day).next() < odds;

/** What they'd ask you to: an evening on, a restaurant in their town they'd spend on, and a dish there with a price. */
export function whatTheyAsk(sim: Simulation, c: Contact, day: string): Ask | undefined {
  const rng = sim.rng('social.asks', c.id, day, 'what');
  const zone = CITIES.require(c.cityId).timeZone;
  const places = restaurantsIn(c.cityId).filter((r) => TIERS.indexOf(r.tier) <= TIERS.indexOf(c.spends) && r.menu.some((m) => m.price !== null));
  if (places.length === 0) return undefined;
  const r = places[Math.floor(rng.next() * places.length)]!;
  const dishes = r.menu.filter((m) => m.price !== null && diningQuote(sim, r, [m.item], 'in'));
  if (dishes.length === 0) return undefined;
  const item = dishes[Math.floor(rng.next() * dishes.length)]!.item;
  const ahead = ASKS.ahead.least + Math.floor(rng.next() * (ASKS.ahead.most - ASKS.ahead.least + 1));
  const today = zonedParts(sim.now, zone);
  const at = instantFromZoned({ ...normalDate(today.year, today.month, today.day + ahead), hour: ASKS.hour, minute: 0 }, zone);
  if (atWork(sim, c, at, DINING_MINUTES[r.tier])) return undefined;
  return { at, restaurantId: r.id, item, made: sim.now };
}

const placeOf = (a: Ask): string => restaurantById(a.restaurantId)?.name ?? 'a restaurant';

/** Who has asked you to something you haven't answered. */
export const askedBy = (person: Person): Contact[] => contactsOf(person).filter((c) => c.ask);

/** Asks lapsed at their hour, then the day's new ones. */
export function reachOut(sim: Simulation, person: Person): void {
  for (const c of contactsOf(person)) {
    if (!c.ask || c.ask.at > sim.now) continue;
    c.memory.unshift({ at: sim.now, what: `Asked you to a meal at ${placeOf(c.ask)}; you never answered` });
    delete c.ask;
  }
  for (const c of contactsOf(person)) {
    if (!mayAsk(sim, person, c)) continue;
    const day = dateKey(sim.now, CITIES.require(c.cityId).timeZone);
    if (!asksToday(sim, c, day)) continue;
    const ask = whatTheyAsk(sim, c, day);
    if (!ask) continue;
    c.ask = ask;
    c.askedAt = sim.now;
    const when = formatDate(ask.at, CITIES.require(c.cityId).timeZone);
    c.memory.unshift({ at: sim.now, what: `Asked you to a meal at ${placeOf(ask)} on ${when}` });
    const first = c.name.split(' ')[0];
    if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: `${first} Asked You Out To Eat`, body: `${c.name} would like to meet at ${placeOf(ask)} on ${when}, at seven.`, importance: 45, route: '/workspace/people' });
  }
}

/** Why an ask can't be said yes to now, or nothing. */
export function answerRefusal(sim: Simulation, person: Person, contactId: string, yes: boolean): string | undefined {
  const c = contactsOf(person).find((x) => x.id === contactId);
  if (!c) return 'You don’t know them.';
  if (!c.ask) return `${c.name.split(' ')[0]} hasn’t asked you to anything.`;
  if (!yes) return undefined;
  return inviteRefusal(sim, person, invitationOf(c, c.ask));
}

const invitationOf = (c: Contact, a: Ask): Invitation => ({ contactId: c.id, at: a.at, what: 'meal', restaurantId: a.restaurantId, item: a.item });

export function registerReachingOut(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'social.reach_out', (_e, { sim: s }) => {
    if (s.universe.meta.endedAt !== undefined) return;
    reachOut(s, s.player);
  });

  sim.onCommand<{ contactId: string; yes: boolean }, { at?: Instant }>(ANSWER_KIND, (p, { sim: s }) => {
    const person = s.player;
    const yes = p?.yes === true;
    const no = answerRefusal(s, person, String(p?.contactId), yes);
    if (no) throw new CommandError(no);
    const c = contactsOf(person).find((x) => x.id === String(p?.contactId))!;
    const ask = c.ask!;
    delete c.ask;
    c.askedAt = s.now;
    c.memory.unshift({ at: s.now, what: `You said ${yes ? 'yes' : 'no'} to a meal at ${placeOf(ask)}` });
    if (!yes) return {};
    arrange(s, person, c, invitationOf(c, ask));
    return { at: ask.at };
  });
}
