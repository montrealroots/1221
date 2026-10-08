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
 * From 2026-10-06 it can be a walk in the park, free, for ATUS's 0.96 hours
 * of a walk, called off by the weather when it comes; a film at the cinema
 * where a trade body publishes the average ticket, America and Britain; or a
 * pint at a bar at the town's own price for one (`pintPrice`).
 * Said yes, it's on the calendar. Kept, it adds its hours to what you've
 * spent together, which is what makes a friend (`levelOf`), lifts the mood
 * by how much you need company and eases stress, and your meal is paid and
 * eaten. Missed, they remember it.
 *
 * **A partner** (from later on 2026-10-01). Somebody known for Hall's
 * fifty hours can be asked out, one at a time, and says yes or no and why:
 * a rival would rather not; they live elsewhere; they'd like to know you
 * better first; they're seeing somebody (all but Pew's 38%); they don't
 * feel that way (one in two, SLATE's estimate). Seeing each other, each
 * meeting kept is a date, and the ninth makes a couple (`PARTNERS`). A
 * couple can move in together, in a place of your own in their town, and
 * each then pays the landlord half the rent and the bills. Breaking up, or
 * moving away from them, ends it, and they move out; it weighs on the mood
 * and adds stress.
 *
 * **Living alone** weighs on how long a life lasts, at Holt-Lunstad's odds
 * (`livingFactor`, read by `systems/mortality.ts`): a place of one's own
 * with no lodger or partner is living alone; a room in a shared flat or a
 * friend's sofa isn't.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, formatTime, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { CITIES } from '../content/geography';
import { HALL, LIVING_ALONE, NAMES, OUTINGS, PARTNERS, SOCIAL } from '../content/people';
import { caresFor } from './enjoyment';
import { DROP_INS, DROP_IN_MINUTES } from '../content/dropins';
import type { Tier } from '../content/restaurants';
import { DINING_MINUTES } from '../content/dining';
import { BONDS, bondMove } from './school';
import { diningQuote, restaurantById } from './dining';
import { spend } from './household';
import { personalityOf } from './personality';
import { homeById } from './homes';
import { bedSleepsOne } from './furniture';
import { incomeOf } from './marriage';
import { atWork, atWorkReason } from './availability';
import { mateBusy } from './coursework';
import { noteIncident } from './classmates';
import { childrenStay } from './support';
import { LOOKING_AFTER, applyLookingAfter, dropInPrice } from './life';
import { COURT_MET, TRAINING, courtRefusal, fineWeatherRefusal, homeCourts, type Court } from './dwelling';
import { exerts } from './body';
import { WALK } from '../content/petcare';
import { drinkingAge } from '../content/alcohol';
import { DRINKING, drinkPints, pintPrice } from './alcohol';
import { inSaveMoney } from './banking';
import type { Money } from '../core/money';

/** A walk together's effort, for its cold and its training: the 2024 Compendium's 3.0 METs for walking a dog (17165), the only walking SLATE has read, stood in. */
export const WALK_MET = WALK.met;

/** What an outing that's priced costs one of you, in the save's money, where it's sold in this town; nothing where it isn't published. */
export function outingPrice(sim: Simulation, cityId: string, what: 'film' | 'pint'): Money | undefined {
  if (what === 'pint') return pintPrice(sim, cityId);
  const p = OUTINGS.film[CITIES.get(cityId)?.countryId ?? ''];
  return p ? inSaveMoney(sim, Math.round(p.price * 100), p.currency) : undefined;
}

export const MEET_KIND = 'social.meet';

export type Spends = Exclude<Tier, 'fast'>;
const TIERS: readonly Tier[] = ['fast', 'casual', 'mid', 'upscale'];

export interface Contact {
  id: string;
  name: string;
  /** Where they live. */
  cityId: string;
  born: Instant;
  met: { at: Instant; how: 'school' | 'work' | 'online' | 'club'; what?: string };
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
  /** Free to be asked out, and whether they'd want to be by you (`PARTNERS`, `SOCIAL.interested`). */
  single?: boolean;
  interested?: boolean;
  /** Seeing each other, and the dates kept since; a couple from the ninth. */
  dating?: { since: Instant; dates: number; couple?: Instant };
  /** Living with you, since when (`householdShare`). */
  livesWith?: Instant;
  /** A partner's job and pay, drawn when you became a couple (`systems/marriage.ts`). */
  income?: import('./marriage').Income;
  /** Whether they can carry a child: their given name's list, SLATE's reading (`systems/children.ts`). */
  carries?: boolean;
  /** What they care about, three of the creation screen's, drawn when first asked (`interestsOf`, from 2026-10-03). */
  interests?: string[];
  /** Coming to stay, or staying, in a guest room (`systems/houseguests.ts`, from 2026-10-05). */
  stay?: import('./houseguests').Stay;
  /** A meal they've asked you to, unanswered, and when they last asked (`systems/reachingout.ts`, from 2026-10-06). */
  ask?: import('./reachingout').Ask;
  askedAt?: Instant;
  /**
   * The classmate this is, by their place in the class (from 2026-10-08): one person from the first week of school to
   * the rest of the life, never a second contact made at the degree.
   */
  classmate?: number;
  /** When each kind of time together was last had or asked for, so the next is another (from 2026-10-08). */
  kinds?: Partial<Record<InvitationKind, Instant>>;
  /** When you last called off at short notice, and came late (from 2026-10-08). */
  cutShort?: Instant;
  late?: Instant;
}

/**
 * A meal out, a visit home, a game on your own court or pitch (`play`, from 2026-10-02), a class taken together
 * (`class`, from 2026-10-03), and from 2026-10-06 a walk in the park, a film at the cinema or a pint at a bar
 * (`OUTINGS`).
 */
export type InvitationKind = 'meal' | 'visit' | 'play' | 'class' | 'walk' | 'film' | 'pint' | 'study' | 'coffee' | 'show';
export const INVITATION_KINDS: readonly InvitationKind[] = ['meal', 'visit', 'play', 'class', 'walk', 'film', 'pint', 'study', 'coffee', 'show'];

/**
 * Two of New Haven's own, from 2026-10-08 (research-yale-social.json): a
 * coffee, Atticus Market's drip at $2.90 (a menu site's figure; the cafe's
 * own refused a read), three quarters of an hour (SLATE's estimate); and a
 * Yale Cabaret show, a drama-school student's ticket $10 and the $2.50
 * processing fee, Thursday to Saturday at eight and Friday and Saturday at
 * eleven too, an hour and a half (the Cabaret's performance length SLATE
 * already estimates), during the school year (September to April, SLATE's
 * reading of its season).
 */
export const NEW_HAVEN_OUTINGS = {
  cityId: 'us-ct-newhaven',
  coffee: { price: 2_90, minutes: 45, source: 'https://hello.food (Atticus Market, 771 Orange St, menu read 2026-10-08)' },
  show: { price: 12_50, minutes: 90, nights: [[4, 20], [5, 20], [5, 23], [6, 20], [6, 23]] as readonly (readonly [number, number])[], season: [9, 4] as const, source: 'https://www.yalecabaret.org/visit-us/ (Season 59)' },
} as const;

/** Studying together at the Haas Arts Library, from 2026-10-08: a classmate's, during school, free, an hour and a half. */
export const STUDY = { minutes: 90, cityId: 'us-ct-newhaven', memorization: 0.15 } as const;
export interface Invitation { contactId: string; at: Instant; what: InvitationKind; restaurantId?: string; item?: string; court?: Court; classId?: string }


export const contactsOf = (person: Person): Contact[] => (person.contacts ??= []);

/** What somebody is to you, by the hours you've spent together. */
export function levelOf(c: Contact): 'Rival' | 'Close Friend' | 'Friend' | 'Casual Friend' | 'Acquaintance' {
  if (c.rival) return 'Rival';
  return c.hours >= HALL.close ? 'Close Friend' : c.hours >= HALL.friend ? 'Friend' : c.hours >= HALL.casual ? 'Casual Friend' : 'Acquaintance';
}

const NAME_MARKET: Record<string, keyof typeof NAMES> = { us: 'us', uk: 'uk', ie: 'ie', ca: 'ca', mx: 'mx' };

/** Somebody new, named as their country names people, near the actor's age. */
export function newContact(sim: Simulation, person: Person, cityId: string, key: string, met: Contact['met']): Contact {
  const rng = sim.rng('social.person', person.id, key);
  const names = NAMES[NAME_MARKET[CITIES.get(cityId)?.countryId ?? 'us'] ?? 'us'];
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rng.next() * list.length)]!;
  const carries = rng.next() < 0.5;
  const given = carries ? names.female : names.male;
  const years = 365.2425 * MS_DAY;
  return {
    id: sim.nextId('contact'), name: `${pick(given)} ${pick(names.family)}`, cityId,
    born: person.birthInstant + Math.round((rng.next() * 10 - 5) * years),
    met, hours: 0, ...(carries ? { carries } : {}), spends: pick(['casual', 'mid', 'upscale'] as const), single: rng.next() < PARTNERS.single, interested: rng.next() < SOCIAL.interested, memory: [{ at: sim.now, what: met.how === 'school' ? 'At school together' : met.how === 'club' ? `At ${met.what ?? 'a club'}` : met.how === 'online' ? `Matched on ${met.what ?? 'an app'}` : `Worked together${met.what ? ` on ${met.what}` : ''}` }],
  };
}

/** The class known at the degree, each as near as the three years made them. */
export function knowTheClass(sim: Simulation, person: Person, classmates: readonly { name: string; bond?: number; title?: 'actor' | 'actress'; log?: readonly { at: Instant; what: string }[] }[]): void {
  for (const [i, mate] of classmates.entries()) {
    // Known since school (`classAtSchool`, from 2026-10-08): the same person, moved to New York, nearer by the years.
    const known = contactsOf(person).find((x) => x.classmate === i);
    const c = known ?? newContact(sim, person, 'us-ny-newyork', `class-${i}`, { at: sim.now, how: 'school' });
    const bond = mate.bond ?? 0;
    c.name = mate.name;
    c.classmate = i;
    c.cityId = 'us-ny-newyork';
    if (mate.title === 'actress') c.carries = true; else delete c.carries;
    c.hours = Math.max(known?.hours ?? 0, bond >= BONDS.close ? HALL.close : bond >= BONDS.friend ? HALL.friend : HALL.casual);
    if (bond <= BONDS.rival) c.rival = true; else delete c.rival;
    // What happened between you at school, remembered (from 2026-10-08): the work shared, kept and missed, and made right.
    const school = (mate.log ?? []).slice(0, 8).map((m) => ({ at: m.at, what: `At Yale: ${m.what}` }));
    c.memory = known ? [...c.memory, ...school.filter((m) => !c.memory.some((x) => x.at === m.at && x.what === m.what))].sort((a, b) => b.at - a.at).slice(0, 40) : school;
    if (!known) contactsOf(person).push(c);
  }
}

/**
 * The class known as people from the first week (from 2026-10-08), each a
 * contact in New Haven linked to the classmate they are (`classmate`): asked
 * out, asking, studying together, as anybody known is. Their bond at school
 * and the hours spent together are kept in step: an evening together draws
 * them closer (`CLASS_SOCIAL`), a rival stays one. Made once; called each
 * class day, it makes any a save from before lacks and keeps the rival flag
 * to the bond.
 */
export function classAtSchool(sim: Simulation, person: Person): void {
  const school = person.school;
  if (!school || school.standing === 'graduated' || school.standing === 'dismissed') return;
  for (const [i, mate] of school.classmates.entries()) {
    let c = contactsOf(person).find((x) => x.classmate === i);
    if (!c) {
      c = newContact(sim, person, 'us-ct-newhaven', `class-${i}`, { at: sim.now, how: 'school' });
      c.name = mate.name;
      c.classmate = i;
      if (mate.title === 'actress') c.carries = true; else delete c.carries;
      c.memory = [{ at: sim.now, what: 'In your class at Yale' }];
      contactsOf(person).push(c);
    }
    if ((mate.bond ?? 0) <= BONDS.rival) c.rival = true;
    else if ((mate.bond ?? 0) > BONDS.rival + 10) delete c.rival;
    // A friend at school is one by the bond, as the degree reads it (`knowTheClass`), not only by the evenings out: the
    // days in class are time together. Until 2026-10-08 every classmate read as an acquaintance until the degree, however
    // close, found by the social journeys (`tools/social-lives.mjs`): no classmate reached out at school, nor could be asked out.
    const bond = mate.bond ?? 0;
    c.hours = Math.max(c.hours, bond >= BONDS.close ? HALL.close : bond >= BONDS.friend ? HALL.friend : 0);
  }
}

/** What an evening with a classmate does to the bond at school, an hour of it, and a meeting missed or called off late. SLATE's estimate: a shared production's weeks are ten. */
export const CLASS_SOCIAL = { bondPerHour: 1, missed: -3, cutShort: -1 } as const;

/** Whether a contact is a classmate still at school with the player. */
export const atSchoolWith = (person: Person, c: Contact): boolean => c.classmate !== undefined && Boolean(person.school) && person.school!.standing !== 'graduated' && person.school!.standing !== 'dismissed';

/**
 * A classmate's bond, moved by time spent together or let down: at school and after it. Until 2026-10-08 only at
 * school, and after the degree an evening out moved nothing, so the social journeys (`tools/social-lives.mjs`) found
 * friends seen every month fading to even by the monthly drift (`RIVALS.fadePerMonth`) as if never seen.
 */
export function classBond(person: Person, c: Contact, by: number): void {
  if (c.classmate === undefined || !person.school) return;
  const mate = person.school!.classmates[c.classmate!];
  if (mate) mate.bond = clamp((mate.bond ?? 0) + bondMove(person, by), -100, 100);
}

/**
 * An answer to being asked, remembered once: the same answer again is the
 * latest, not another line. Until 2026-10-08 each was a line of its own, and
 * the social journeys (`tools/social-lives.mjs`) found a classmate holding
 * "Said no to a walk in the park: Imani lives in New Haven." fifteen times
 * among sixty memories, which pushed the evenings that happened out.
 */
export function rememberAnswer(c: Contact, at: Instant, what: string): void {
  c.memory = [{ at, what }, ...c.memory.filter((m) => m.what !== what)];
}

/** A castmate known from a job, in the town it was worked in. */
export function metAtWork(sim: Simulation, person: Person, cityId: string, bookingId: string, what: string): Contact {
  const c = newContact(sim, person, cityId, `work-${bookingId}`, { at: sim.now, how: 'work', what });
  contactsOf(person).push(c);
  return c;
}

/** Why a friend would say no to an invitation, or nothing where they'd come. */
export function declines(person: Person, c: Contact, inv: Invitation, sim?: Simulation): string | undefined {
  const first = c.name.split(' ')[0];
  if (c.rival) return `${first} would rather not.`;
  // What they care about (`caresFor` in `systems/enjoyment.ts`, from 2026-10-03).
  if (sim && !caresFor(sim, person, c, inv.what)) return `${first} doesn’t much care for ${inv.what === 'play' ? 'games' : 'classes like that'}.`;
  if (inv.what === 'study' && !atSchoolWith(person, c)) return `${first} isn’t at school with you.`;
  const where = inv.what === 'meal' ? restaurantById(inv.restaurantId ?? '')?.cityId : inv.what === 'class' ? DROP_INS.find((d) => d.id === inv.classId)?.cityId : inv.what === 'study' ? STUDY.cityId : inv.what === 'coffee' || inv.what === 'show' ? NEW_HAVEN_OUTINGS.cityId : person.home?.cityId;
  if (where !== c.cityId) return `${first} lives in ${CITIES.require(c.cityId).name}.`;
  if ((inv.what === 'visit' || inv.what === 'play') && c.hours < HALL.casual) return `${first} doesn’t know you well enough yet to come to your home.`;
  const hour = zonedParts(inv.at, CITIES.require(c.cityId).timeZone).hour;
  if (hour < SOCIAL.notBefore) return `That’s too early for ${first}.`;
  if (hour >= SOCIAL.notAfter) return `That’s too late for ${first}.`;
  const r = inv.what === 'meal' ? restaurantById(inv.restaurantId ?? '') : undefined;
  if (r && TIERS.indexOf(r.tier) > TIERS.indexOf(c.spends)) return `${r.name} is more than ${first} would spend.`;
  if (c.lastSeen !== undefined && inv.at - c.lastSeen < SOCIAL.rest * MS_DAY) return `${first} saw you on ${formatDate(c.lastSeen, CITIES.require(c.cityId).timeZone)}; another time.`;
  if (c.stoodUp !== undefined && inv.at - c.stoodUp < 7 * MS_DAY) return `You didn’t come last time, and ${first} isn’t making plans yet.`;
  // Called off at short notice: three days before they make plans again, lighter than not coming (from 2026-10-08).
  if (c.cutShort !== undefined && sim && sim.now - c.cutShort < 3 * MS_DAY) return `${first} isn’t making plans for a few days: you called off at short notice.`;
  // A classmate's own priorities at school (`systems/classmates.ts`): somebody with a life outside keeps weeknights for it.
  if (sim && atSchoolWith(person, c) && (inv.what === 'pint' || inv.what === 'film')) {
    const pr = (person.school!.classmates[c.classmate!] as { priority?: string } | undefined)?.priority;
    const wd = zonedParts(inv.at, CITIES.require(c.cityId).timeZone).weekday;
    if (pr === 'home' && wd >= 0 && wd <= 4) return `${first} keeps weeknights for home.`;
  }
  return undefined;
}

/** A classmate at school is busy by their own school day (`mateBusy`); anybody else at their work. The reason, or nothing. */
export function busyReason(sim: Simulation, person: Person, c: Contact, at: Instant, minutes: number): string | undefined {
  if (atSchoolWith(person, c)) return mateBusy(person, c.classmate!, at, minutes);
  return atWork(sim, c, at, minutes) ? atWorkReason(c) : undefined;
}

/**
 * Another time they'd come, where the one asked for didn't suit them (busy,
 * too early or late, at school, at work): the next evening at seven in the
 * week that they're free and you are. Nothing where the no isn't about the time.
 */
export function counterTime(sim: Simulation, person: Person, c: Contact, inv: Invitation, why: string): Instant | undefined {
  const timely = /too early|too late|at work|in class|work-study|rehearsal calls|won’t rehearse/.test(why);
  if (!timely) return undefined;
  const zone = CITIES.require(c.cityId).timeZone;
  const p = zonedParts(inv.at, zone);
  for (let n = 1; n <= 7; n += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + n), hour: 19, minute: 0 }, zone);
    const moved = { ...inv, at };
    if (at <= sim.now || declines(person, c, moved, sim) || busyReason(sim, person, c, at, minutesOf(moved)) || inviteRefusal(sim, person, moved)) continue;
    return at;
  }
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
  } else if (inv.what === 'class') {
    if (!DROP_INS.some((d) => d.id === inv.classId)) return 'Choose a class.';
  } else if (inv.what === 'film' || inv.what === 'pint') {
    const city = person.home?.cityId ?? person.currentLocationId;
    if (outingPrice(sim, city, inv.what) === undefined) return inv.what === 'film' ? 'SLATE has no published ticket price here.' : 'SLATE has no bar price for a pint here.';
    if (inv.what === 'pint' && (inv.at - person.birthInstant) / (365.2425 * MS_DAY) < drinkingAge(city)) return `Served from ${drinkingAge(city)} here.`;
  } else if (inv.what === 'walk') {
    // A walk is in the park where you live, and costs nothing.
  } else if (inv.what === 'coffee' || inv.what === 'show') {
    // New Haven's own: the show on a night the Cabaret plays, in its season.
    if (inv.what === 'show') {
      const p = zonedParts(inv.at, CITIES.require(NEW_HAVEN_OUTINGS.cityId).timeZone);
      const [from, to] = NEW_HAVEN_OUTINGS.show.season;
      if (p.month > to && p.month < from) return 'The Cabaret plays from September to April.';
      if (!NEW_HAVEN_OUTINGS.show.nights.some(([wd, h]) => wd === p.weekday && h === p.hour && p.minute === 0)) return 'The Cabaret plays Thursday to Saturday at eight, and Friday and Saturday at eleven too.';
    }
  } else if (inv.what === 'study') {
    // At the Haas Arts Library, known from orientation's tour (`systems/coursework.ts`).
    const cw = (person.school as { coursework?: { orientation: { done: { tour?: number }; behind?: boolean } } } | undefined)?.coursework;
    if (!person.school || person.school.standing === 'graduated' || person.school.standing === 'dismissed') return 'Studying together is for the term at school.';
    if (cw && !cw.orientation.done.tour && !cw.orientation.behind) return 'The library isn’t known to you yet: the tour shows you it.';
  } else if (!person.home || person.home.kind === 'sofa') return 'You have no home of your own to ask them to.';
  else if (inv.what === 'play' && !homeCourts(person).some((x) => x.court === inv.court)) return 'You have no such court or pitch to play on.';
  const ends = inv.at + minutesOf(inv) * 60_000;
  const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < ends && x.at + x.durationMinutes * 60_000 > inv.at);
  if (clash) return `You have ${clash.label} then.`;
  return undefined;
}

/** How long it lasts: a meal as long as a meal at that kind of place, a visit two hours. */
/** A game with friends: an hour and a half, SLATE's estimate. */
export const PLAY_HOURS = 1.5;
const COURT_WORD: Readonly<Record<Court, string>> = { tennis: 'tennis', basketball: 'basketball', pickleball: 'pickleball', football: 'football' };

const minutesOf = (inv: Invitation): number => {
  if (inv.what === 'play') return PLAY_HOURS * 60;
  if (inv.what === 'class') return DROP_IN_MINUTES;
  if (inv.what === 'walk') return OUTINGS.walkMinutes;
  if (inv.what === 'pint') return DRINKING.minutesPerPint;
  if (inv.what === 'study') return STUDY.minutes;
  if (inv.what === 'coffee') return NEW_HAVEN_OUTINGS.coffee.minutes;
  if (inv.what === 'show') return NEW_HAVEN_OUTINGS.show.minutes;
  const r = inv.what === 'meal' ? restaurantById(inv.restaurantId ?? '') : undefined;
  return r ? DINING_MINUTES[r.tier] : SOCIAL.visitMinutes;
};

/** What an invitation is to, in words: "a meal at …", "a walk in the park". */
export function inviteWords(inv: Pick<Invitation, 'what' | 'restaurantId' | 'classId' | 'court'>): string {
  const r = inv.restaurantId ? restaurantById(inv.restaurantId) : undefined;
  const klass = inv.what === 'class' ? DROP_INS.find((d) => d.id === inv.classId) : undefined;
  if (r) return `a meal at ${r.name}`;
  if (klass) return `${klass.label.toLowerCase()} at ${klass.studio}`;
  if (inv.what === 'play') return `a game of ${COURT_WORD[inv.court ?? 'tennis']} at yours`;
  if (inv.what === 'walk') return 'a walk in the park';
  if (inv.what === 'film') return 'a film at the cinema';
  if (inv.what === 'pint') return 'a pint at a bar';
  if (inv.what === 'study') return 'studying together at the Haas Arts Library';
  if (inv.what === 'coffee') return 'a coffee at Atticus Market';
  if (inv.what === 'show') return 'a show at the Yale Cabaret';
  return 'a visit to your home';
}

/** A meeting said yes to, on the calendar: asked by you (`social.invite`) or by them (`social.answer`, from 2026-10-06). */
export function arrange(sim: Simulation, person: Person, c: Contact, inv: Invitation): void {
  const r = inv.restaurantId ? restaurantById(inv.restaurantId) : undefined;
  const klass = inv.what === 'class' ? DROP_INS.find((d) => d.id === inv.classId) : undefined;
  const first = c.name.split(' ')[0];
  sim.schedule({ at: inv.at, kind: MEET_KIND, label: r ? `${r.name} With ${first}` : klass ? `${klass.studio} With ${first}` : inv.what === 'play' ? `${first} Comes Over To Play` : inv.what === 'walk' ? `A Walk With ${first}` : inv.what === 'film' ? `The Cinema With ${first}` : inv.what === 'pint' ? `A Pint With ${first}` : inv.what === 'study' ? `Studying With ${first}` : inv.what === 'coffee' ? `Coffee With ${first}` : inv.what === 'show' ? `The Cabaret With ${first}` : `${first} Comes Over`, category: 'relationship', priority: 40, requiresPlayer: true, durationMinutes: minutesOf(inv), locationId: inv.what === 'study' || inv.what === 'coffee' || inv.what === 'show' ? NEW_HAVEN_OUTINGS.cityId : c.cityId, payload: { personId: person.id, ...inv } });
  (c.kinds ??= {})[inv.what] = sim.now;
}

export function registerPeople(sim: Simulation): void {
  sim.onCommand<Invitation, { accepted: boolean; reason?: string; counter?: Instant }>('social.invite', (p, { sim: s }) => {
    const person = s.player;
    const inv: Invitation = { contactId: String(p?.contactId), at: Number(p?.at), what: INVITATION_KINDS.includes(p?.what) ? p.what : 'meal', ...(p?.restaurantId ? { restaurantId: String(p.restaurantId) } : {}), ...(p?.item ? { item: String(p.item) } : {}), ...(p?.court ? { court: p.court } : {}), ...(p?.classId ? { classId: String(p.classId) } : {}) };
    const no = inviteRefusal(s, person, inv);
    if (no) throw new CommandError(no);
    const c = contactsOf(person).find((x) => x.id === inv.contactId)!;
    // At work then, a job of their own (`systems/availability.ts`, from 2026-10-02).
    const reason = declines(person, c, inv, s) ?? busyReason(s, person, c, inv.at, minutesOf(inv));
    const what = inviteWords(inv);
    rememberAnswer(c, s.now, reason ? `Said no to ${what}: ${reason}` : `Said yes to ${what}`);
    if (reason) { const counter = counterTime(s, person, c, inv, reason); return { accepted: false, reason, ...(counter ? { counter } : {}) }; }
    arrange(s, person, c, inv);
    return { accepted: true };
  });

  sim.onSchedule(MEET_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person && contactsOf(person).find((x) => x.id === item.payload.contactId);
    if (!person || !c) return;
    const r = item.payload.restaurantId ? restaurantById(String(item.payload.restaurantId)) : undefined;
    const klass = item.payload.what === 'class' ? DROP_INS.find((d) => d.id === item.payload.classId) : undefined;
    const where = item.payload.what === 'study' || item.payload.what === 'coffee' || item.payload.what === 'show' ? NEW_HAVEN_OUTINGS.cityId : r?.cityId ?? klass?.cityId ?? person.home?.cityId;
    const first = c.name.split(' ')[0];
    // Held by something else when it starts (from 2026-10-08): a short way into it, you come late; longer, you don't come.
    // Until then a meeting and a call booked later over it were both kept at once.
    const holding = s.universe.scheduled.find((x) => x.id !== item.id && x.requiresPlayer && x.durationMinutes && x.status !== 'cancelled' && x.status !== 'missed' && x.payload.personId === person.id && x.at < item.at && x.at + x.durationMinutes * 60_000 > item.at);
    const lateBy = holding ? Math.round((holding.at + holding.durationMinutes! * 60_000 - item.at) / 60_000) : 0;
    if (person.currentLocationId !== where || lateBy > SOCIAL_LATE.most) {
      c.stoodUp = item.at;
      classBond(person, c, CLASS_SOCIAL.missed);
      // Something to make right with a classmate (`school.make_amends`, from 2026-10-08), at school or after it.
      const mate = c.classmate !== undefined ? person.school?.classmates[c.classmate] : undefined;
      if (mate) noteIncident(mate, item.at, 'missed');
      c.memory.unshift({ at: item.at, what: holding && person.currentLocationId === where ? `Not there: held at ${holding.label}` : 'You didn’t come' });
      if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: `You Missed ${first}`, body: `${c.name} waited for you${r ? ` at ${r.name}` : ''}, and will remember it.`, importance: 50, route: '/workspace/people' });
      return;
    }
    // Your own meal, at its price, and eaten; theirs is theirs to pay. What the bank and the card can't pay is owed.
    if (r && item.payload.item) {
      const q = diningQuote(s, r, [String(item.payload.item)], 'in');
      if (q) spend(s, person, q.total, r.name, 'food', true);
      applyLookingAfter(person, 'order', item.at);
    }
    const kind = item.payload.what;
    const hours = Math.max(0, (item.durationMinutes ?? 60) - lateBy) / 60;
    c.hours += hours;
    classBond(person, c, CLASS_SOCIAL.bondPerHour * hours);
    (c.kinds ??= {})[item.payload.what as InvitationKind] = item.at;
    if (lateBy > 0) { c.late = item.at; c.memory.unshift({ at: item.at, what: `Late by ${lateBy} minutes, from ${holding!.label}` }); }
    // Studying together: your least secure open lines, as running lines moves them, without training a skill.
    if (item.payload.what === 'study') studyTogether(person);
    // Your coffee or your ticket, at New Haven's price; theirs is theirs.
    if (kind === 'coffee') spend(s, person, inSaveMoney(s, NEW_HAVEN_OUTINGS.coffee.price, 'USD'), 'Atticus Market, a coffee', 'food', true);
    if (kind === 'show') spend(s, person, inSaveMoney(s, NEW_HAVEN_OUTINGS.show.price, 'USD'), 'The Yale Cabaret, a student ticket', 'personal', true);
    // A missed meeting lapses on its own a week on, and nothing is kept inside that week, so it isn't cleared here.
    c.lastSeen = item.at;
    // A date, while you're seeing each other: the ninth makes a couple.
    if (c.dating) {
      c.dating.dates += 1;
      if (!c.dating.couple && c.dating.dates >= PARTNERS.datesToCouple) {
        c.dating.couple = item.at;
        // Their job and pay, drawn now (`systems/marriage.ts`).
        incomeOf(s, person, c);
        if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: `You And ${first} Are A Couple`, body: `Nine dates on, ${c.name} and you are together.`, importance: 60, route: '/workspace/people' });
      }
    }
    // A game, where the weather and the light let it be played: an hour and a half of it, at its METs, trained as a run trains.
    const court = item.payload.what === 'play' ? homeCourts(person).find((x) => x.court === item.payload.court) : undefined;
    const played = court && !courtRefusal(s, person, court);
    if (played) { exerts(person, COURT_MET[court.court], PLAY_HOURS); applyLookingAfter(person, 'court', item.at, TRAINING.run); }
    // A class taken together: each pays their own, yours at the studio's price, and its effort (from 2026-10-03).
    if (klass) { spend(s, person, dropInPrice(s, klass), `${klass.studio}, ${klass.label.toLowerCase()}`, 'personal', true); exerts(person, klass.met, DROP_IN_MINUTES / 60); applyLookingAfter(person, klass.met >= 3 ? 'exercise' : 'unwind', item.at); }
    // From 2026-10-06: a walk in the park, in the fine weather, its minutes out of doors at sitting out's rate and its
    // effort; a film, your ticket at the country's average; a pint, yours at the ONS's price, drunk as a bar's is.
    const walked = kind === 'walk' && !fineWeatherRefusal(s, person, 'walk', WALK_MET, OUTINGS.walkMinutes);
    if (walked) { exerts(person, WALK_MET, OUTINGS.walkMinutes / 60); applyLookingAfter(person, 'outside', item.at, 1, OUTINGS.walkMinutes / LOOKING_AFTER.outside.minutes); }
    if (kind === 'film' || kind === 'pint') {
      const price = outingPrice(s, where ?? person.currentLocationId, kind);
      if (price) spend(s, person, price, kind === 'film' ? 'The cinema, a ticket' : 'A pint at a bar', kind === 'film' ? 'personal' : 'food', true);
      if (kind === 'pint') drinkPints(s, person, 1, item.at + DRINKING.minutesPerPint * 60_000);
    }
    c.memory.unshift({ at: item.at, what: kind === 'study' ? 'Studied together at the Haas Arts Library' : kind === 'coffee' ? 'A coffee at Atticus Market' : kind === 'show' ? 'Saw a show at the Yale Cabaret together' : klass ? `${klass.label} at ${klass.studio}, together` : r ? `A meal at ${r.name}, ${formatTime(item.at, CITIES.require(r.cityId).timeZone)}` : court ? (played ? `Played ${COURT_WORD[court.court]} at yours` : 'Came over to play; the weather or the dark stopped it') : kind === 'walk' ? (walked ? 'A walk together' : 'The walk called off') : kind === 'film' ? 'A film together' : kind === 'pint' ? 'A pint together' : 'Came over' });
    const w = person.wellbeing;
    w.morale = clamp(w.morale + SOCIAL.morale * personalityOf(person, 'company') * personalityOf(person, 'moraleSwing'), 0, 100);
    w.stress = clamp(w.stress - SOCIAL.stress, 0, 100);
  });
}

/** How late counts as coming late, not missing it: three quarters of an hour (SLATE's estimate). */
export const SOCIAL_LATE = { most: 45 } as const;

/** Studying together: the least secure open lines move, as running lines moves them, a step of no skill. */
function studyTogether(person: Person): void {
  const cw = (person.school as { coursework?: { assignments: { status: string; sceneId?: string; prep: { memorization: number } }[] } } | undefined)?.coursework;
  const open = (cw?.assignments ?? []).filter((a) => (a.status === 'open' || a.status === 'revising') && a.sceneId).sort((x, y) => x.prep.memorization - y.prep.memorization)[0];
  if (open) open.prep.memorization = clamp(open.prep.memorization + STUDY.memorization * (1 - open.prep.memorization), 0, 1);
}

/** Why a meeting on the calendar can't be called off or moved, or nothing. */
export function cancelRefusal(sim: Simulation, person: Person, itemId: string): string | undefined {
  const item = sim.universe.scheduled.find((x) => x.id === itemId && x.kind === MEET_KIND && x.payload.personId === person.id);
  if (!item || item.status !== 'pending') return 'There’s no such meeting on your calendar.';
  if (item.at <= sim.now) return 'It’s already started.';
  return undefined;
}

/** Called off: with a day's notice it costs nothing; at shorter notice they'll wait a few days before making plans, and a classmate minds a little. */
function callOff(sim: Simulation, person: Person, itemId: string, why: string): { late: boolean; c: Contact } {
  const item = sim.universe.scheduled.find((x) => x.id === itemId)!;
  const c = contactsOf(person).find((x) => x.id === item.payload.contactId)!;
  sim.timeline.cancel(item.id, sim.now);
  const late = item.at - sim.now < MS_DAY;
  if (late) { c.cutShort = sim.now; classBond(person, c, CLASS_SOCIAL.cutShort); const mate = c.classmate !== undefined ? person.school?.classmates[c.classmate] : undefined; if (mate) noteIncident(mate, sim.now, 'lateCancel'); }
  c.memory.unshift({ at: sim.now, what: late ? `Called off ${why} at short notice` : `Moved ${why}, with notice` });
  return { late, c };
}

/** Who you're seeing, if anybody. */
export const seeing = (person: Person): Contact | undefined => contactsOf(person).find((c) => c.dating);

/** Why you can't ask anybody out now: you're seeing somebody, and it's one at a time. */
export function askingRefusal(person: Person): string | undefined {
  const now = seeing(person);
  return now ? `You’re seeing ${now.name.split(' ')[0]}.` : undefined;
}

/** Why somebody would say no to being asked out, or nothing where they'd say yes. */
export function asksOutRefusal(person: Person, c: Contact): string | undefined {
  const first = c.name.split(' ')[0];
  if (c.rival) return `${first} would rather not.`;
  if (c.cityId !== (person.home?.cityId ?? person.currentLocationId)) return `${first} lives in ${CITIES.require(c.cityId).name}.`;
  if (c.hours < HALL.casual) return `${first} would like to know you better first.`;
  if (!c.single) return `${first} is seeing somebody.`;
  if (!c.interested) return `${first} doesn’t feel that way about you.`;
  return undefined;
}

/** Why a partner can't move in, or nothing. */
export function moveInRefusal(person: Person, c: Contact): string | undefined {
  const first = c.name.split(' ')[0];
  if (!c.dating?.couple) return `You and ${first} aren’t a couple yet.`;
  if (c.livesWith !== undefined) return `${first} lives with you already.`;
  const home = person.home;
  if (!home || home.kind === 'sofa') return 'You have no home of your own to share.';
  if (home.kind === 'shared') return 'A room in a shared flat has no room for two.';
  // A bed under 120 cm sleeps one (`content/beds.ts`, from 2026-10-01).
  if (bedSleepsOne(person)) return 'Your bed sleeps one: buy a bigger one first.';
  if (home.cityId !== c.cityId) return `${first} lives in ${CITIES.require(c.cityId).name}.`;
  return undefined;
}

/** The share of the rent and the bills somebody pays: half with a partner living with them, all of it otherwise. */
export function householdShare(person: Person): number {
  const partner = contactsOf(person).find((c) => c.livesWith !== undefined);
  return partner && partner.cityId === person.home?.cityId ? 1 - PARTNERS.share : 1;
}

function partWays(sim: Simulation, person: Person, c: Contact, why: string): void {
  delete c.dating;
  delete c.livesWith;
  c.memory.unshift({ at: sim.now, what: why });
  const w = person.wellbeing;
  w.stress = clamp(w.stress + SOCIAL.breakup * personalityOf(person, 'stressGain'), 0, 100);
  w.morale = clamp(w.morale - SOCIAL.breakup * personalityOf(person, 'moraleSwing'), 0, 100);
}

export function registerSocialPlans(sim: Simulation): void {
  sim.onCommand<{ itemId: string }, { late: boolean }>('social.cancel', (p, { sim: s }) => {
    const no = cancelRefusal(s, s.player, String(p?.itemId));
    if (no) throw new CommandError(no);
    const item = s.universe.scheduled.find((x) => x.id === p!.itemId)!;
    return { late: callOff(s, s.player, item.id, inviteWords(item.payload as unknown as Invitation)).late };
  });
  // Moved to another time: asked again as an invitation is; their no leaves the first time as it was.
  sim.onCommand<{ itemId: string; at: Instant }, { moved: boolean; reason?: string; late?: boolean }>('social.reschedule', (p, { sim: s }) => {
    const person = s.player;
    const no = cancelRefusal(s, person, String(p?.itemId));
    if (no) throw new CommandError(no);
    const item = s.universe.scheduled.find((x) => x.id === p!.itemId)!;
    const inv = { ...(item.payload as unknown as Invitation), at: Number(p?.at) };
    const c = contactsOf(person).find((x) => x.id === inv.contactId)!;
    if (!(inv.at > s.now)) throw new CommandError('Choose a time to come.');
    // Their own meeting doesn't clash with itself: refused only by another commitment then.
    const clash = s.universe.scheduled.find((x) => x.id !== item.id && x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < inv.at + minutesOf(inv) * 60_000 && x.at + x.durationMinutes * 60_000 > inv.at);
    if (clash) throw new CommandError(`You have ${clash.label} then.`);
    const reason = declines(person, c, inv, s) ?? busyReason(s, person, c, inv.at, minutesOf(inv));
    if (reason) return { moved: false, reason };
    const { late } = callOff(s, person, item.id, inviteWords(inv));
    arrange(s, person, c, inv);
    return { moved: true, late };
  });
}

export function registerPartners(sim: Simulation): void {
  sim.onCommand<{ contactId: string }, { accepted: boolean; reason?: string }>('social.ask_out', (p, { sim: s }) => {
    const person = s.player;
    const c = contactsOf(person).find((x) => x.id === String(p?.contactId));
    if (!c) throw new CommandError('You don’t know them.');
    const mine = askingRefusal(person);
    if (mine) throw new CommandError(mine);
    const reason = asksOutRefusal(person, c);
    rememberAnswer(c, s.now, reason ? `Said no to going out: ${reason}` : 'Said yes to going out');
    if (reason) return { accepted: false, reason };
    c.dating = { since: s.now, dates: 0 };
    return { accepted: true };
  });

  sim.onCommand<{ contactId: string }, { since: Instant }>('social.move_in', (p, { sim: s }) => {
    const person = s.player;
    const c = contactsOf(person).find((x) => x.id === String(p?.contactId));
    if (!c) throw new CommandError('You don’t know them.');
    const no = moveInRefusal(person, c);
    if (no) throw new CommandError(no);
    c.livesWith = s.now;
    c.memory.unshift({ at: s.now, what: 'Moved in with you' });
    return { since: s.now };
  });

  sim.onCommand<{ contactId: string }, { ended: boolean }>('social.break_up', (p, { sim: s }) => {
    const person = s.player;
    const c = contactsOf(person).find((x) => x.id === String(p?.contactId));
    if (!c?.dating) throw new CommandError('You aren’t seeing them.');
    if (person.marriage?.contactId === c.id) throw new CommandError('You’re married: only a divorce ends it.');
    partWays(s, person, c, c.livesWith !== undefined ? 'Broke up, and moved out' : 'Broke up');
    return { ended: true };
  });
}

/** A partner who lives with you stays where they live when you move away, and it ends there. */
export function partnerStays(sim: Simulation, person: Person): void {
  const c = contactsOf(person).find((x) => x.livesWith !== undefined);
  if (!c || c.cityId === person.home?.cityId) return;
  // Married, they stay where they live, and the marriage goes on apart (`systems/marriage.ts`).
  if (person.marriage?.contactId === c.id) { delete c.livesWith; c.memory.unshift({ at: sim.now, what: `Stayed in ${CITIES.require(c.cityId).name} when you moved` }); return; }
  // Your children together stay with them, in the home they had (`systems/support.ts`).
  childrenStay(person, c);
  partWays(sim, person, c, `Stayed in ${CITIES.require(c.cityId).name} when you moved`);
  if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: `${c.name.split(' ')[0]} Stayed`, body: `${c.name} stayed in ${CITIES.require(c.cityId).name}, and it’s over.`, importance: 60, route: '/workspace/people' });
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
  if (householdShare(person) < 1) return false;
  if (home.kind === 'owned' && home.homeId) return !(homeById(person, home.homeId)?.lodgers?.length);
  return true;
}
