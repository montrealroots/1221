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
 * Until 2026-10-06 a meal was all they asked to; from then it may be a visit
 * to yours, a game on your court or a class at a studio in their town, each
 * only where they'd say yes to it themselves (`declines`), as likely as any
 * other of them (`whatTheyAsk`).
 *
 * You say yes, and it's on the calendar as your own invitation would be,
 * kept or missed the same (`arrange`); or no; or nothing, and it lapses at
 * its hour. Each is remembered, and either answer starts the fortnight.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dateKey, formatDate, formatTime, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { ASKS, HALL, SOCIAL } from '../content/people';
import type { Tier } from '../content/restaurants';
import { DINING_MINUTES } from '../content/dining';
import { diningQuote, restaurantById, restaurantsIn } from './dining';
import { MEET_KIND, NEW_HAVEN_OUTINGS, PLAY_HOURS, STUDY, arrange, atSchoolWith, busyReason, contactsOf, declines, inviteRefusal, inviteWords, levelOf, type Contact, type Invitation } from './people';
import { DROP_INS, DROP_IN_MINUTES } from '../content/dropins';
import { homeCourts, type Court } from './dwelling';

export const ANSWER_KIND = 'social.answer';

/** How much of what happened a contact keeps, the latest first. SLATE's estimate. */
export const MEMORY_KEPT = 60;
/** Of them, the memories of school kept however much comes after. */
export const SCHOOL_KEPT = 8;

/**
 * What a friend has asked you to, and when they asked: a meal (where, your dish), and from 2026-10-06 a visit to
 * yours, a game on your court, or a class together. An ask kept from before then, without `what`, is a meal.
 */
export interface Ask { at: Instant; what?: 'meal' | 'visit' | 'play' | 'class' | 'study' | 'coffee' | 'show' | 'pint'; restaurantId?: string; item?: string; court?: Court; classId?: string; made: Instant; /** Why, where it's for something: a closing night (from 2026-10-08). */ about?: string }

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

/**
 * What they'd ask you to: an evening on, and a meal at a restaurant in their town they'd spend on, a dish there with a
 * price; or, from 2026-10-06, a visit to yours, a game on your court, or a class at a studio in their town. Each of
 * those that they'd say yes to themselves (`declines`, their interests among it) is as likely as the others, SLATE's
 * estimate: nobody publishes what friends ask each other to.
 */
export function whatTheyAsk(sim: Simulation, c: Contact, day: string, person: Person = sim.player): Ask | undefined {
  const rng = sim.rng('social.asks', c.id, day, 'what');
  const zone = CITIES.require(c.cityId).timeZone;
  const ahead = (n: number) => ASKS.ahead.least + Math.floor(n * (ASKS.ahead.most - ASKS.ahead.least + 1));
  const today = zonedParts(sim.now, zone);
  const evening = (n: number) => instantFromZoned({ ...normalDate(today.year, today.month, today.day + ahead(n)), hour: ASKS.hour, minute: 0 }, zone);
  const asks: Ask[] = [];
  const places = restaurantsIn(c.cityId).filter((r) => TIERS.indexOf(r.tier) <= TIERS.indexOf(c.spends) && r.menu.some((m) => m.price !== null));
  if (places.length > 0) {
    const r = places[Math.floor(rng.next() * places.length)]!;
    const dishes = r.menu.filter((m) => m.price !== null && diningQuote(sim, r, [m.item], 'in'));
    const item = dishes.length ? dishes[Math.floor(rng.next() * dishes.length)]!.item : undefined;
    const at = evening(rng.next());
    if (item && !busyReason(sim, person, c, at, DINING_MINUTES[r.tier])) asks.push({ at, what: 'meal', restaurantId: r.id, item, made: sim.now });
  }
  const other = sim.rng('social.asks', c.id, day, 'other');
  const at = evening(other.next());
  const court = homeCourts(person)[0]?.court;
  const klass = DROP_INS.filter((d) => d.cityId === c.cityId);
  const others: Ask[] = [
    ...(person.home && person.home.kind !== 'sofa' ? [{ at, what: 'visit' as const, made: sim.now }] : []),
    ...(court ? [{ at, what: 'play' as const, court, made: sim.now }] : []),
    ...(klass.length ? [{ at, what: 'class' as const, classId: klass[Math.floor(other.next() * klass.length)]!.id, made: sim.now }] : []),
    // A classmate at school: studying together, a coffee, a Cabaret show on its night (from 2026-10-08).
    ...(atSchoolWith(person, c) ? [{ at, what: 'study' as const, made: sim.now }, { at, what: 'coffee' as const, made: sim.now }, ...(showNight(at, c) ? [{ at: showNight(at, c)!, what: 'show' as const, made: sim.now }] : [])] : []),
  ];
  for (const a of others) if (!declines(person, c, invitationOf(c, a), sim) && !inviteRefusal(sim, person, invitationOf(c, a)) && !busyReason(sim, person, c, a.at, minutesFor(a))) asks.push(a);
  if (asks.length === 0) return undefined;
  // The kind you've had least lately together first (from 2026-10-08; until then any, at random, the same twice running as
  // likely as not); among those, the draw.
  const lastOf = (a: Ask) => c.kinds?.[a.what ?? 'meal'] ?? 0;
  const oldest = Math.min(...asks.map(lastOf));
  const fresh = asks.filter((a) => lastOf(a) === oldest);
  return fresh[Math.floor(sim.rng('social.asks', c.id, day, 'kind').next() * fresh.length)];
}

const minutesFor = (a: Ask): number => (a.what === 'play' ? PLAY_HOURS * 60 : a.what === 'class' ? DROP_IN_MINUTES : a.what === 'study' ? STUDY.minutes : a.what === 'coffee' ? NEW_HAVEN_OUTINGS.coffee.minutes : a.what === 'show' ? NEW_HAVEN_OUTINGS.show.minutes : SOCIAL.visitMinutes);

/** The first Cabaret night at eight on or after an evening, within the week, in its season. */
function showNight(at: Instant, c: Contact): Instant | undefined {
  const zone = CITIES.require(c.cityId).timeZone;
  const p = zonedParts(at, zone);
  for (let n = 0; n < 7; n += 1) {
    const t = instantFromZoned({ ...normalDate(p.year, p.month, p.day + n), hour: 20, minute: 0 }, zone);
    const q = zonedParts(t, zone);
    if (q.weekday >= 4 && q.weekday <= 6 && (q.month >= NEW_HAVEN_OUTINGS.show.season[0] || q.month <= NEW_HAVEN_OUTINGS.show.season[1])) return t;
  }
  return undefined;
}

/** What an ask is to, in words:  meal at …,  visit to your home. */
export const askWords = (a: Ask): string => (a.what && a.what !== 'meal' ? inviteWords({ what: a.what, court: a.court, classId: a.classId }) : `a meal at ${restaurantById(a.restaurantId ?? '')?.name ?? 'a restaurant'}`) + (a.about ? `, ${a.about}` : '');

/** Who has asked you to something you haven't answered. */
export const askedBy = (person: Person): Contact[] => contactsOf(person).filter((c) => c.ask);

/** Asks lapsed at their hour, then the day's new ones. */
export function reachOut(sim: Simulation, person: Person): void {
  // What's remembered, the latest sixty (`MEMORY_KEPT`, from 2026-10-08): a replay found contacts carrying thousands.
  // The years at school kept first, up to eight (`SCHOOL_KEPT`): a replay's New York life, its friends' asks unanswered for
  // decades, had pushed every memory of Yale out of its classmates.
  for (const c of contactsOf(person)) if (c.memory.length > MEMORY_KEPT) {
    const school = c.memory.filter((m) => m.what.startsWith('At Yale')).slice(0, SCHOOL_KEPT);
    const rest = c.memory.filter((m) => !school.includes(m)).slice(0, MEMORY_KEPT - school.length);
    c.memory = [...rest, ...school].sort((x, y) => y.at - x.at);
  }
  for (const c of contactsOf(person)) {
    if (!c.ask || c.ask.at > sim.now) continue;
    c.memory.unshift({ at: sim.now, what: `Asked you to ${askWords(c.ask)}; you never answered` });
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
    c.memory.unshift({ at: sim.now, what: `Asked you to ${askWords(ask)} on ${when}` });
    const first = c.name.split(' ')[0];
    if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: !ask.what || ask.what === 'meal' ? `${first} Asked You Out To Eat` : `${first} Asked You To Something`, body: `${c.name} would like ${askWords(ask)} on ${when}, at ${formatTime(ask.at, CITIES.require(c.cityId).timeZone)}.`, importance: 45, route: '/workspace/people' });
  }
}

/** Why an ask can't be said yes to now, or nothing. */
export function answerRefusal(sim: Simulation, person: Person, contactId: string, yes: boolean, at?: Instant): string | undefined {
  const c = contactsOf(person).find((x) => x.id === contactId);
  if (!c) return 'You don’t know them.';
  if (!c.ask) return `${c.name.split(' ')[0]} hasn’t asked you to anything.`;
  if (!yes && at === undefined) return undefined;
  return inviteRefusal(sim, person, { ...invitationOf(c, c.ask), ...(at !== undefined ? { at } : {}) });
}

const invitationOf = (c: Contact, a: Ask): Invitation => ({ contactId: c.id, at: a.at, what: a.what ?? 'meal', ...(a.restaurantId ? { restaurantId: a.restaurantId, item: a.item } : {}), ...(a.court ? { court: a.court } : {}), ...(a.classId ? { classId: a.classId } : {}) });

export function registerReachingOut(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'social.reach_out', (_e, { sim: s }) => {
    if (s.universe.meta.endedAt !== undefined) return;
    reachOut(s, s.player);
  });

  // Yes, no, or another time (`at`, from 2026-10-08): another time is theirs to take or not, as an invitation is.
  sim.onCommand<{ contactId: string; yes: boolean; at?: Instant }, { at?: Instant; reason?: string }>(ANSWER_KIND, (p, { sim: s }) => {
    const person = s.player;
    const yes = p?.yes === true;
    const other = !yes && p?.at !== undefined ? Number(p.at) : undefined;
    const no = answerRefusal(s, person, String(p?.contactId), yes, other);
    if (no) throw new CommandError(no);
    const c = contactsOf(person).find((x) => x.id === String(p?.contactId))!;
    const ask = c.ask!;
    delete c.ask;
    c.askedAt = s.now;
    if (other !== undefined) {
      const inv = { ...invitationOf(c, ask), at: other };
      const reason = declines(person, c, inv, s) ?? busyReason(s, person, c, other, minutesFor(ask));
      c.memory.unshift({ at: s.now, what: reason ? `You asked to move ${askWords(ask)}; it didn’t suit them` : `You asked to move ${askWords(ask)}, and they agreed` });
      if (reason) return { reason };
      arrange(s, person, c, inv);
      return { at: other };
    }
    c.memory.unshift({ at: s.now, what: `You said ${yes ? 'yes' : 'no'} to ${askWords(ask)}` });
    if (!yes) return {};
    arrange(s, person, c, invitationOf(c, ask));
    return { at: ask.at };
  });
}
