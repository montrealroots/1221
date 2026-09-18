/**
 * SLATE — putting somebody in a part, and what that does to the picture.
 *
 * The rank this file is aiming at is one sentence long: *the eight hundred and
 * thirteen acting attributes decide something.* They have been in the save
 * since the first commit and nothing has ever read one. This reads nineteen of
 * them, on other people, where the numbers actually differ — and it is careful
 * to read them on other people, because the player's sheet is every attribute
 * at the ceiling and a system that read it would be sixty lookups all returning
 * a hundred, which `docs/DEPTH.md` names as a trap by that exact description.
 *
 * ## The three axes go to three different places
 *
 * `content/casting.ts` says what the axes are. This says where they land, and
 * the landing is the whole of whether they are a vector or one number with
 * three labels on it:
 *
 * - **Repeatable** is read by the shoot, once a week, and by nothing else. A
 *   cast that cannot do it again needs more takes; more takes is more material
 *   for the same finished second; more material is a higher shooting ratio; a
 *   higher ratio is a cutting room wading further for every second it turns
 *   out; and that is the delivery date. Five steps, every one of them already
 *   built, and casting is the thing that was missing from the front of it.
 * - **Truth** and **How It Reads** are read by the sale, and by nothing on the
 *   floor. A picture is worth what it cost and how it is sold — and now also
 *   who is in it, which is the one input a producer actually chooses.
 *
 * No axis is read twice. That is deliberate and it is checked: an axis with two
 * readers is an axis that could be split, and an axis with none is prose.
 *
 * ## Nobody is waiting in a pool
 *
 * The same doctrine as the crew, for the same reason. A performer exists
 * because a part existed and somebody went looking, and they persist
 * afterwards, so the people this company can reach are a record of what it has
 * already made. The band on the role sets how far the search reaches, which is
 * why greenlighting cheap is a casting decision months before it is a casting
 * decision.
 *
 * ## Not casting is a decision, not an error
 *
 * A role nobody is cast in is still played. Somebody local does it for the
 * band, and they are bad — `WHOEVER` bad, on every axis. So the picture never
 * blocks on an empty part; it just quietly becomes a worse picture that takes
 * longer to cut, which is what actually happens.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import { formatMoney, type Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Person } from '../domain/model';
import type { Looked, Project, Role, Seat } from '../domain/company';
import type { AttributeSheet } from '../domain/attributes';
import { rate, sheetOf } from '../domain/attributes';
import { freshWellbeing } from '../systems/life';
import { impliedPerformerTitle } from '../core/performer';
import { clamp } from '../core/rng';
import { MEN, WOMEN, patronymic } from '../content/names';
import { GROUP } from '../content/sugar';
import {
  AXES, A_PART_LEANS, CAST_SHARE, HAGGLE, QUOTE_LIFE, ROUNDS, SIZES, TAPE_LEANS, THE_TAPE,
  PAIRING, THE_GIVING, WHERE_FROM, axisById, passById, roundById, sizeById, takesAt,
  whereFromById, whereFromCity,
  type AxisId, type PassId, type Round, type Size, type WhereFrom,
} from '../content/casting';
import { planById, type Plan } from '../content/making';
import { MS_WEEK } from './lot';
import { baseWindowOf } from './periods';
import { BEFORE_THE_FIRST_DAY, theyAreFree, whatHasThem } from './diary';
import { americanArm, signedWith } from './company';
import { isCitizenOf } from '../domain/citizenship';

/** A year, for decaying a quote. */
const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * What a part is worth when nobody was cast in it.
 *
 * Somebody always plays the part. If the company never made an offer, the
 * person who plays it is whoever was available for the band, and this is what
 * they are on every axis. Low, and deliberately not zero: an unfilled part is a
 * bad performance rather than a hole in the picture.
 */
export const WHOEVER = 25;

// ---------------------------------------------------------------------------
// Reading a person
// ---------------------------------------------------------------------------

/** What somebody is on one axis, averaged off their sheet. */
export function readOn(sheet: AttributeSheet, axisId: AxisId): number {
  const axis = axisById(axisId);
  if (!axis || axis.of.length === 0) return 0;
  let total = 0;
  for (const id of axis.of) total += rate(sheet, id);
  return total / axis.of.length;
}

export type Read = Record<AxisId, number>;

/** All three, which is the only form anybody should be handed. */
export function readOf(person: Person): Read {
  return {
    truth: readOn(person.attributes, 'truth'),
    repeatable: readOn(person.attributes, 'repeatable'),
    reads: readOn(person.attributes, 'reads'),
  };
}

/** What the part is, when nobody took it. */
export const whoeverReads = (): Read => ({ truth: WHOEVER, repeatable: WHOEVER, reads: WHOEVER });

// ---------------------------------------------------------------------------
// The parts
// ---------------------------------------------------------------------------

/** Hours of finished screen time a title owes. */
const hoursOf = (project: Project): number =>
  Math.max(0, (project.owesSeconds ?? 0) / 3_600);

/**
 * How many of one size a title carries.
 *
 * Off the runtime, because that is what decides it. A hundred-minute feature
 * and a fifty-minute episode are not the same picture with a different number
 * on the front, and the count of people in them is one of the places that
 * shows.
 */
export function howMany(size: Size, project: Project): number {
  const hours = hoursOf(project);
  if (hours <= 0) return 0;
  if (size.across === 'title') return Math.max(1, Math.round(size.perHour * hours));
  // A part-scoped size is counted per part, off the length of one part rather
  // than the length of the whole thing.
  const parts = project.parts?.length ?? 1;
  const each = hours / Math.max(1, parts);
  return Math.max(1, Math.round(size.perHour * each));
}

/** What the picture has set aside for its people, all in. */
export const castPot = (project: Project): Money =>
  Math.round((project.budgetCents ?? 0) * CAST_SHARE);

/**
 * Every part a picture has, laid out.
 *
 * Called once, at the greenlight, because that is the first moment a picture
 * knows its runtime, its parts and its money — and a role priced before any of
 * those is a number somebody made up.
 */
export function layTheRoles(sim: Simulation, project: Project): Role[] {
  const roles: Role[] = [];
  let ordinal = 0;
  // Two passes: the sizes first, so the pot can be divided by what the picture
  // actually carries rather than by what a title might carry in general.
  const counted: { size: Size; partId?: Id }[] = [];
  for (const size of SIZES) {
    const many = howMany(size, project);
    if (size.across === 'title') {
      for (let i = 0; i < many; i += 1) counted.push({ size });
    } else {
      for (const part of project.parts ?? []) {
        for (let i = 0; i < many; i += 1) counted.push({ size, partId: part.id });
      }
    }
  }
  const weight = counted.reduce((n, one) => n + one.size.weight, 0);
  const pot = castPot(project);
  for (const one of counted) {
    ordinal += 1;
    const id = sim.nextId('role');
    roles.push({
      id,
      ordinal,
      name: nameTheRole(one.size, ordinal),
      size: one.size.id,
      ...(one.partId ? { partId: one.partId } : {}),
      bandCents: weight > 0 ? Math.round((pot * one.size.weight) / weight) : 0,
      wants: whatItWants(sim, project, id, one.size),
    });
  }
  return roles;
}

/**
 * What one part needs, drawn once and kept.
 *
 * The size says what a part this big usually wants and the draw says what this
 * one turned out to be. Normalised back to three afterwards, so no part is
 * quietly worth more than another — a leaning is a shape, not a quantity, and a
 * part that wanted more of everything would be a part with a bigger budget
 * rather than a different one.
 */
export function whatItWants(
  sim: Simulation, project: Project, roleId: string, size: Size,
): Record<string, number> {
  const draw = sim.rng('casting', 'wants', project.id, roleId);
  const raw: Record<string, number> = {};
  let total = 0;
  for (const axis of AXES) {
    const one = Math.max(0.1, size.leans[axis.id] + (draw.next() - 0.5) * 2 * A_PART_LEANS);
    raw[axis.id] = one;
    total += one;
  }
  const to = AXES.length;
  for (const axis of AXES) raw[axis.id] = Math.round((raw[axis.id]! / total) * to * 100) / 100;
  return raw;
}

/** How much this part cares about one axis, which is one where nobody said. */
export const wantsOn = (role: Role, axis: AxisId): number => role.wants?.[axis] ?? 1;

/**
 * What a part needs, in the order it needs it.
 *
 * Said as an order rather than as three numbers, because three numbers summing
 * to three is arithmetic and what a producer actually holds in their head is
 * "this one is a face and that one is a fortnight of coverage".
 */
export function saysWhatItWants(role: Role): string {
  const ranked = [...AXES].sort((a, b) => wantsOn(role, b.id) - wantsOn(role, a.id));
  const top = ranked[0]!;
  const bottom = ranked[ranked.length - 1]!;
  if (wantsOn(role, top.id) - wantsOn(role, bottom.id) < 0.25) return 'a bit of everything';
  return `${top.label.toLowerCase()} before ${bottom.label.toLowerCase()}`;
}

/**
 * What a part is called before anybody writes it.
 *
 * The parts are laid out from a runtime rather than lifted off a script,
 * because there is no script in this build — so the names say the size and the
 * number and claim nothing else. A role called "Second Lead" is honest about
 * what the engine knows; a role called "Ingibjörg" would be a novel the game
 * has not written.
 */
function nameTheRole(size: Size, ordinal: number): string {
  return `${size.label} ${ordinal}`;
}

export const roleOn = (project: Project, roleId: string): Role | undefined =>
  project.roles?.find((r) => r.id === roleId);

/** Who is in a role, where anybody is and has not been let go. */
export const seatFor = (project: Project, roleId: string): Seat | undefined =>
  project.cast?.find((s) => s.roleId === roleId && s.releasedAt === undefined);

/** Every part still open. */
export const openRoles = (project: Project): Role[] =>
  (project.roles ?? []).filter((role) => seatFor(project, role.id) === undefined);

// ---------------------------------------------------------------------------
// The dates
// ---------------------------------------------------------------------------

/**
 * When somebody in a part is engaged from and to.
 *
 * A week before the shoot for the fitting and the read, then the shoot. A
 * part-scoped role takes its slice of that: a guest on episode six is on the
 * picture for a stretch of the shoot and not the whole of it, which is the
 * only reason a guest is cheaper than a regular.
 */
export function datesFor(project: Project, role: Role): { from: Instant; to: Instant } | undefined {
  const shoot = baseWindowOf(project);
  if (!shoot) return undefined;
  const opens = shoot.from - MS_WEEK;
  if (!role.partId) return { from: opens, to: shoot.to };
  const parts = project.parts ?? [];
  const at = parts.findIndex((p) => p.id === role.partId);
  if (at < 0 || parts.length <= 1) return { from: opens, to: shoot.to };
  const span = (shoot.to - shoot.from) / parts.length;
  return { from: shoot.from + Math.round(span * at) - MS_WEEK, to: shoot.from + Math.round(span * (at + 1)) };
}

/**
 * Whether somebody is already engaged somewhere across a span.
 *
 * ## The player is asked a different way, and has to be
 *
 * The loop below reads `project.cast`, which is where the family's own pictures
 * seat people, and for everybody except one person that is the whole truth: an
 * NPC exists in this save only as a cast seat. The player does not. The parts a
 * player wins are won in the room, and a won part is a row in
 * `universe.auditions` with `why === 'cast'` — a table this loop has never read.
 *
 * So this function used to be right about every person in the save except the
 * one the game is about. Measured over three seeds of twenty-five played years,
 * asking both this and `diary.theyAreFree` about the same fortnight: they
 * disagreed on 1,580 of 3,900 spans — 40.5% — every single one of them the same
 * way round, this one saying free while the diary named the part. In a career
 * that only acts, `project.cast` is empty from the first day to the last, so
 * this was not merely incomplete; it was a function that returned `true`.
 *
 * `world/diary.ts` exists to be the one answer to what has the player and until
 * when, and its own docstring says why a second copy is worse than none. So the
 * player is handed to it rather than answered again here, which also picks up
 * the two things the loop below has no idea about: the week in front of a first
 * day, and the fact that a day player is not spoken for a whole quarter.
 */
export function freeToWork(sim: Simulation, personId: Id, from: Instant, to: Instant): boolean {
  if (personId === sim.universe.playerId) return theyAreFree(sim, from, to);
  for (const project of Object.values(sim.universe.projects)) {
    for (const seat of project.cast ?? []) {
      if (seat.personId !== personId || seat.releasedAt !== undefined) continue;
      const role = roleOn(project, seat.roleId);
      const when = role ? datesFor(project, role) : undefined;
      if (when && when.from < to && from < when.to) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// The quote
// ---------------------------------------------------------------------------

/**
 * What somebody was last paid, decayed, for a part this size.
 *
 * The ratchet. Only fees at this size or larger count — a day player's check
 * does not price a lead, and a lead's does not stop a day player being cheap —
 * and each one is worn down by the years since it was paid, because business
 * affairs argues an old number down and the agent argues it back up.
 */
export function quoteOf(person: Person, sizeId: string, now: Instant): Money {
  const want = sizeById(sizeId);
  if (!want) return 0;
  let best = 0;
  for (const quote of person.quotes ?? []) {
    const had = sizeById(quote.size);
    if (!had || had.weight < want.weight) continue;
    const years = Math.max(0, (now - quote.at) / MS_YEAR);
    const left = Math.max(0, 1 - years / QUOTE_LIFE);
    best = Math.max(best, Math.round(quote.cents * left));
  }
  return best;
}

/** What the fee written on a closed deal becomes, for everybody who asks next. */
export function writeTheQuote(person: Person, projectId: Id, sizeId: string, cents: Money, at: Instant): void {
  if (!person.quotes) person.quotes = [];
  person.quotes.push({ projectId, size: sizeId, cents, at });
}

/**
 * What the agent opens at.
 *
 * The band is what the picture set aside; the quote is what the person is
 * already worth. Whichever is higher is where the call starts, because neither
 * side forgets their own number.
 */
export function askFor(person: Person, role: Role, now: Instant): Money {
  return Math.max(role.bandCents, quoteOf(person, role.size, now));
}

// ---------------------------------------------------------------------------
// Who comes in
// ---------------------------------------------------------------------------

/**
 * How good a person a part can reach, out of a hundred.
 *
 * Money reaches, and it reaches with diminishing returns, the same shape the
 * crew uses. A part with ten thousand euros behind it gets who is free; a part
 * with a million gets who is wanted. The ceiling is short of a hundred on
 * purpose: nobody is bought outright, and the best performer in the world is
 * not for sale at any band.
 */
export function reachOfBand(bandCents: Money): number {
  const thousands = bandCents / 100 / 1_000;
  return 24 + 58 * Math.min(1, Math.sqrt(thousands / 400));
}

/**
 * A performer's sheet, built so the three axes disagree with each other.
 *
 * This is the part that had to be got right or the whole vector is theater.
 * A single standing with a little noise on each attribute would produce three
 * axes that are the same number three times, which is exactly the failure
 * `docs/DEPTH.md` names — seven fields moved by one fudge factor. So the
 * standing sets where the person sits, and then each axis is drawn its own
 * distance from that standing, wide enough that somebody at sixty can be
 * thirty-eight on one axis and eighty-two on another. That is a real person:
 * the performer the camera loves who cannot hit the same mark twice, and the
 * technician nobody wants to look at.
 */
export function sheetFor(standing: number, next: () => number): AttributeSheet {
  const base = clamp(Math.round(standing * 0.7 + 8), 1, 100);
  const of: Record<string, number> = {};
  for (const axis of AXES) {
    const centre = clamp(standing + (next() - 0.5) * 46, 1, 100);
    for (const id of axis.of) of[id] = clamp(Math.round(centre + (next() - 0.5) * 14), 1, 100);
  }
  // And their hand at taping, drawn on its own and against the middle of the
  // scale rather than against their standing. Nothing about being fine on screen
  // makes anybody good at lighting their own kitchen, and a version of this
  // that hung off the standing would have quietly said it did.
  const hand = clamp(Math.round(20 + next() * 70), 1, 100);
  for (const id of THE_TAPE) of[id] = clamp(Math.round(hand + (next() - 0.5) * 18), 1, 100);
  // And what they give the other person, drawn on its own for the same reason
  // and for a sharper one. Generosity on camera is a disposition and not a
  // level: the most technically secure performer in the country can be the one
  // who gives nothing back across the lens.
  //
  // This was missing, and the omission is worth keeping in the comment. Nothing
  // wrote these six, so every performer carried them at the sheet's base — which
  // is a function of `standing` — and `givingOf` handed chemistry a number that
  // was craft standing under a second name. Two people equally good were
  // equally generous, always. The decider harness could not see it, because it
  // sweeps a declared input itself and so proves only that something reads the
  // field, never that the world ever varies it.
  const gives = clamp(Math.round(15 + next() * 80), 1, 100);
  for (const id of THE_GIVING) of[id] = clamp(Math.round(gives + (next() - 0.5) * 16), 1, 100);
  return sheetOf(base, of);
}

/** Somebody who acts, made because a part needed them. */
export function performerNew(
  sim: Simulation, standing: number, next: () => number, from = whereFromById('here')!,
): Person {
  const woman = next() < 0.5;
  const given = woman
    ? WOMEN[Math.floor(next() * WOMEN.length)] ?? 'Anna'
    : MEN[Math.floor(next() * MEN.length)]?.name ?? 'Jón';
  const father = MEN[Math.floor(next() * MEN.length)] ?? MEN[0]!;
  const family = patronymic(father, woman ? 'dóttir' : 'son');
  const pronouns = woman ? 'she/her' : 'he/him';
  const dial = () => Math.round(25 + next() * 50);
  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName: given,
    lastName: family,
    displayName: `${given} ${family}`,
    pronouns,
    performerTitle: impliedPerformerTitle(pronouns),
    birthInstant: sim.now - Math.round((21 + next() * 40) * MS_YEAR),
    gender: woman ? 'female' : 'male',
    // Where they actually live, which is the first thing in casting to read a
    // row out of the gazetteer. It used to be copied from the player, so every
    // performer in every save was from the same town and three declared fields
    // said nothing.
    homeRegionId: from.cityId,
    citizenshipId: from.citizenshipId,
    currentLocationId: from.cityId,
    personality: {
      conscientiousness: dial(), emotionalStability: dial(), ambition: dial(),
    },
    interests: [],
    background: from.id === 'here'
      ? 'Acts. Has done since before anybody was paying for it.'
      : `Acts, out of ${from.label}. Would have to be brought here and put up.`,
    attributes: sheetFor(standing, next),
    traits: [],
    wellbeing: freshWellbeing(),
    reputation: {
      // Known to the public only as far as the work has carried them, which at
      // this end of the business is barely at all.
      publicFame: clamp(Math.round(standing * 0.4 - 8 + next() * 12), 0, 100),
      audienceAppeal: clamp(Math.round(40 + next() * 30), 1, 100),
      professionalReputation: clamp(Math.round(standing), 1, 100),
      reliability: clamp(Math.round(standing * 0.6 + 30), 1, 100),

      industryDemand: clamp(Math.round(standing * 0.5 + next() * 20), 0, 100),
      controversy: 0,
    },
    careerTrack: 'actor',
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
}

/**
 * Where the next person in the pile comes from.
 *
 * The band's reach is the gate. Nobody flies from Los Angeles to read for a
 * part that pays four thousand euros, and no amount of wanting them changes it
 * — so a cheap picture is cast out of the phone book and an expensive one is
 * cast out of the world. Within whatever the money has opened up, the weights
 * decide, and most of everybody is from here because this is Iceland.
 */
export function reachesTo(reach: number, draw: number): WhereFrom {
  const open = WHERE_FROM.filter((one) => reach >= one.reaches);
  const total = open.reduce((n, one) => n + one.weight, 0);
  if (total <= 0) return whereFromById('here')!;
  let at = draw * total;
  for (const one of open) {
    at -= one.weight;
    if (at <= 0) return one;
  }
  return open[open.length - 1]!;
}

/** Where somebody lives, where it is a place this build knows about. */
export const fromWhere = (person: Person): WhereFrom | undefined =>
  whereFromCity(person.homeRegionId);

/**
 * What it costs on top of the fee to have somebody here for the run.
 *
 * Flights, a hotel and per diem, as a share of what they are paid, and nought
 * for anybody who already lives here. This is the whole of why local hire is a
 * budget decision and not only a casting one: the best person for the part can
 * be a fifth more expensive than the number on their deal.
 */
export function bringingThemCents(person: Person, feeCents: Money): Money {
  return Math.round(feeCents * (fromWhere(person)?.travel ?? 0));
}

/** How many people a part gets in front of anybody. */
export const WANTED = 4;

/**
 * Puts the part out, and writes down who came in.
 *
 * A dated act, once. The research calls it the breakdown release and gives
 * twelve channels to release it through, each with its own reach and its own
 * leak risk — and none of those twelve mean anything until there is a market
 * with other people's projects in it to leak to. So this build has the one
 * thing that is true of all twelve: the part goes out, and a pile comes back
 * whose quality is what the band bought.
 *
 * Going out twice brings back the same pile. That is not a guard against
 * double-clicking, it is the point: the way to see better people is to have
 * more money behind the part, and refreshing the list until somebody good
 * turns up would make the band irrelevant.
 */
export function putItOut(sim: Simulation, project: Project, role: Role): Person[] {
  if (role.seen) return whoCameIn(sim, role);

  const when = datesFor(project, role);
  const already = new Set<Id>();
  const out: Person[] = [];
  // People who have acted for this company before and are free come first,
  // because that is what a production office does before it advertises
  // anything.
  for (const other of Object.values(sim.universe.projects)) {
    if (other.companyId !== project.companyId) continue;
    for (const seat of other.cast ?? []) {
      if (already.has(seat.personId)) continue;
      already.add(seat.personId);
      const person = sim.universe.people[seat.personId];
      if (!person || person.isPlayer) continue;
      if (when && !freeToWork(sim, person.id, when.from, when.to)) continue;
      out.push(person);
    }
  }
  const reach = reachOfBand(role.bandCents);
  const making = sim.rng('casting', 'seen', project.id, role.id);
  for (let i = out.length; i < WANTED; i += 1) {
    const draw = making.next();
    const standing = clamp(Math.round(reach - 18 + draw * 30), 1, 100);
    out.push(performerNew(sim, standing, () => making.next(), reachesTo(reach, making.next())));
  }
  role.seen = out.map((person) => ({ personId: person.id }));
  return out;
}

/** Who came in, for anybody drawing a screen. Never makes anybody. */
export function whoCameIn(sim: Simulation, role: Role): Person[] {
  const out: Person[] = [];
  for (const one of role.seen ?? []) {
    const person = sim.universe.people[one.personId];
    if (person) out.push(person);
  }
  return out;
}

/** What the company has done about one person for one part. */
export const lookedAt = (role: Role, personId: Id): Looked | undefined =>
  role.seen?.find((one) => one.personId === personId);

// ---------------------------------------------------------------------------
// The offer
// ---------------------------------------------------------------------------

export interface Offer {
  /** What the agent wants, before anybody argues. */
  askCents: Money;
  /** What is being offered. */
  feeCents: Money;
  /** How much of the picture the part is, out of a hundred. */
  carries: number;
  /** Whether the dates are clear. */
  free: boolean;
  /** How much the person is in demand, out of a hundred. */
  demand: number;
}

export type Answer =
  | { took: true; feeCents: Money }
  | { took: false; counterCents: Money }
  | { took: false; passed: PassId };

/**
 * Whether somebody takes the part.
 *
 * Four things, in the order they actually kill a deal. Dates first, because a
 * working performer cannot say yes however good the offer is and no amount of
 * money moves a shooting schedule somebody else already owns. Then price,
 * against their own quote rather than against the band, because the band is the
 * producer's problem. Then the part, because somebody in demand turns down
 * small ones and somebody who is not takes whatever comes. Then the draw, which
 * only decides the ones the first three left open — which is the honest shape
 * of it, since the reason people say no is frequently no reason at all.
 */
export function decideOffer(offer: Offer, roll: number): Answer {
  if (!offer.free) return { took: false, passed: 'dates' };

  const floor = Math.round(offer.askCents * HAGGLE.under);
  if (offer.feeCents < floor) {
    // Far enough under and they do not counter, they hang up. Close enough and
    // the agent names a number, which is the part of a negotiation the player
    // can actually act on.
    return offer.feeCents < floor * 0.7
      ? { took: false, passed: 'price' }
      : { took: false, counterCents: offer.askCents };
  }

  // A part that is beneath somebody is a pass whatever it pays. The threshold
  // moves with how wanted they are, so a performer nobody is asking for takes
  // the day and one everybody wants does not.
  const beneath = offer.demand - offer.carries * 1.6;
  if (beneath > 45) return { took: false, passed: 'size' };

  // What is left is the ordinary business of somebody reading it twice. Money
  // over the ask buys some of that down and never all of it — and it stops
  // buying anything at all past the point somebody can be talked into, which is
  // why doubling an already-generous offer is money handed over for nothing.
  const over = Math.min(
    HAGGLE.over,
    offer.askCents > 0 ? offer.feeCents / offer.askCents : 1,
  );
  const keen = clamp(0.52 + (over - 1) * 0.45 + (45 - beneath) * 0.004, 0.2, HAGGLE.most);
  return roll < keen
    ? { took: true, feeCents: offer.feeCents }
    : { took: false, passed: 'thought-about-it' };
}

/** The offer, as the engine sees it, for one person and one part. */
export function offerOf(sim: Simulation, project: Project, role: Role, person: Person, feeCents: Money): Offer {
  const when = datesFor(project, role);
  const size = sizeById(role.size);
  return {
    askCents: askFor(person, role, sim.now),
    feeCents,
    carries: Math.round((size?.onScreen ?? 0) * 100),
    free: when ? freeToWork(sim, person.id, when.from, when.to) : true,
    demand: person.reputation.industryDemand,
  };
}

// ---------------------------------------------------------------------------
// What the cast is
// ---------------------------------------------------------------------------

export interface InIt {
  role: Role;
  size: Size;
  /** Absent where nobody took it and whoever is playing it. */
  person?: Person;
  seat?: Seat;
  /**
   * What they actually are. The shoot and the sale read this and nobody else
   * may: it is not a fact anybody in the world has access to.
   */
  read: Read;
  /**
   * What the company believes they are, which is what a screen is allowed to
   * print. Equal to `read` for the player and for anybody who has already
   * finished a job here, and a guess with a known width for everybody else.
   */
  shown: Read;
  /** Share of the picture's screen time this part is, before normalising. */
  share: number;
}

/**
 * Somebody a cast figure can be weighted over, whether or not they have a part.
 *
 * The three figures the sale reads that are about people rather than about parts
 * — appeal, controversy and spark — need a person, a weight and something stable
 * to seed a draw from. They do not need a role, and a format season has none: a
 * contributor is engaged for the season and what they are on it is themselves.
 *
 * Deliberately not `InIt`. Forcing a contributor into that shape meant giving it
 * a synthetic `Role` and a fifth `SizeId`, which would have put a person with no
 * part into every piece of code that walks parts — and `castOn` would then have
 * asked `wantsOn` what a nonexistent part wants on an axis. The two lists stay
 * separate and only the three functions that can honestly take either are shared.
 */
interface Counted {
  person?: Person;
  /** How much of the title they are, before normalising. */
  share: number;
  /** Stable per title, for seeding a pairwise draw. */
  key: string;
  /**
   * Whether they are on the whole title rather than one part of it.
   *
   * Carried rather than re-derived, and it is here because dropping it broke a
   * scripted picture. `castSpark` has always paired only the people who are in it
   * together for months, off `size.across === 'title'`; the first version of this
   * shape had no such field, so the swap paired every guest and day player on a
   * feature too and moved a pinned chemistry figure by three points. A contributor
   * is across the title by construction — a format board is engaged for the season
   * — which is exactly why the board pairs and why that is the point rather than a
   * side effect.
   */
  acrossTitle: boolean;
}

/**
 * Everybody the sale should weigh on this picture, from whichever list it keeps.
 *
 * A format season's board is an equal share each rather than a hierarchy, because
 * a cast board is not a call sheet: there is no lead on a format, and which of the
 * twelve the season turns out to be about is not decided when they are chosen.
 */
export function whoIsInIt(sim: Simulation, project: Project): Counted[] {
  const board = project.contributors ?? [];
  if (board.length > 0) {
    const share = 1 / board.length;
    const out: Counted[] = [];
    for (const one of board) {
      const person = sim.universe.people[one.personId];
      if (person) out.push({ person, share, key: one.personId, acrossTitle: true });
    }
    return out;
  }
  return castOf(sim, project).map((one) => ({
    ...(one.person ? { person: one.person } : {}),
    share: one.share,
    key: one.role.id,
    acrossTitle: one.size.across === 'title',
  }));
}

/** Every part and who is in it, uncast ones included. */
export function castOf(sim: Simulation, project: Project): InIt[] {
  const parts = Math.max(1, project.parts?.length ?? 1);
  const out: InIt[] = [];
  for (const role of project.roles ?? []) {
    const size = sizeById(role.size);
    if (!size) continue;
    const seat = seatFor(project, role.id);
    const person = seat ? sim.universe.people[seat.personId] : undefined;
    out.push({
      role,
      size,
      ...(person ? { person } : {}),
      ...(seat ? { seat } : {}),
      read: person ? readOf(person) : whoeverReads(),
      shown: person ? shownOf(sim, project, role, person) : whoeverReads(),
      share: size.across === 'title' ? size.onScreen : size.onScreen / parts,
    });
  }
  return out.sort((a, b) => b.share - a.share || a.role.ordinal - b.role.ordinal);
}

/**
 * What the cast is on one axis, weighted by how much of the picture each of
 * them is in.
 *
 * Weighted and not averaged, because a day player and a lead are not two
 * opinions of equal standing. A lead who cannot repeat costs the shoot forty
 * times what a day player who cannot does, and the weight is the only place
 * that is said.
 */
export function castOn(sim: Simulation, project: Project, axis: AxisId): number | undefined {
  const inIt = castOf(sim, project);
  // How much of the picture the part is, times how much the part needs this of
  // whoever plays it. Both, because they are different questions: a day player
  // is a small part of the picture and what there is of them is almost entirely
  // a face, and a lead is most of the picture and most of what it costs the
  // floor is whether they can do it again.
  const at = (one: InIt) => one.share * wantsOn(one.role, axis);
  const weight = inIt.reduce((n, one) => n + at(one), 0);
  if (weight <= 0) return undefined;
  return inIt.reduce((n, one) => n + one.read[axis] * at(one), 0) / weight;
}

/** How many of the parts have somebody in them. */
export const howManyCast = (project: Project): number =>
  (project.roles ?? []).filter((role) => seatFor(project, role.id) !== undefined).length;

/**
 * How much material a week of this picture's shoot banks, against the plan.
 *
 * The one reader of repeatability, and the reason the axis is not decoration.
 * Undefined before the roles are laid out, because a picture with no parts has
 * no cast to be slowed by.
 */
export function takeFactor(sim: Simulation, project: Project): number {
  const repeatable = castOn(sim, project, 'repeatable');
  return repeatable === undefined ? 1 : takesAt(repeatable);
}

/** What the cast amounts to, in a sentence. */
export function whereTheCastStands(sim: Simulation, project: Project): string {
  const roles = project.roles ?? [];
  if (roles.length === 0) return `${project.title} has no parts written yet.`;
  const filled = howManyCast(project);
  if (filled === 0) {
    return `Nobody is cast in ${project.title}. Its ${roles.length} parts would be played by whoever is free for the band.`;
  }
  const repeatable = castOn(sim, project, 'repeatable') ?? 0;
  const takes = takesAt(repeatable);
  const shoots = takes > 1.02
    ? `The shoot banks ${Math.round((takes - 1) * 100)}% more than the plan allows for.`
    : takes < 0.98
      ? `The shoot banks ${Math.round((1 - takes) * 100)}% less than the plan allows for.`
      : 'The shoot banks what the plan allows for.';
  return `${filled} of ${roles.length} parts cast on ${project.title}. ${shoots}`;
}

/** Whether a plan puts performers in front of a camera at all. */
export const castsPerformers = (plan: Plan | undefined): boolean =>
  plan?.cast === 'performers';

// ---------------------------------------------------------------------------
// Doing it
// ---------------------------------------------------------------------------

export interface Casting {
  projectId: Id;
  roleId: string;
  personId: Id;
  feeCents: Money;
}

export type Cast =
  | { ok: true; answer: Answer }
  | { ok: false; error: string };

/**
 * Offers a part to somebody, and finds out.
 *
 * One call, one answer, no stored offer sitting open. The research describes
 * five distinct hold states between asking and booking, and every one of them
 * is real — but four of them are only meaningful against a world that keeps
 * generating competing work while somebody sits pinned, and this build does not
 * generate any. Modeling them now would be four states that always resolve the
 * same way, which is the definition of the thing `docs/DEPTH.md` forbids. So:
 * ask, and hear back. The pin arrives with the market that makes it cost
 * something.
 */
export function castSomebody(sim: Simulation, casting: Casting): Cast {
  const project = sim.universe.projects[casting.projectId];
  if (!project) return { ok: false, error: 'There’s no such picture.' };
  if (project.shelvedAt) return { ok: false, error: `${project.title} is shelved.` };
  const role = roleOn(project, casting.roleId);
  if (!role) return { ok: false, error: 'No part by that id is in it.' };
  if (seatFor(project, role.id)) {
    return { ok: false, error: `${role.name} is cast. Let them go first, and the fee stays owed.` };
  }
  const person = sim.universe.people[casting.personId];
  if (!person) return { ok: false, error: 'Nobody by that name exists.' };

  // The shoot is the one thing an offer cannot be made behind. Everything else
  // about casting late is expensive; this is impossible, because the scenes
  // were shot with somebody else in them.
  const when = datesFor(project, role);
  if (when && sim.now > when.to) {
    return { ok: false, error: `${role.name} has already been shot. Whoever played it, played it.` };
  }

  const fee = Math.round(casting.feeCents);
  if (!Number.isFinite(fee) || fee < 0) return { ok: false, error: 'That isn’t an amount.' };

  const shut = globalRuleOne(sim, person);
  if (shut) return { ok: false, error: shut };

  // And the one hard constraint a perfect performer actually has. This side
  // never asked: the room refused to let the player go up for something that
  // clashed, and Play It would seat them in a part shooting across one they had
  // already won, so the only real refusal in the game was enforced in one
  // direction. Everybody else is filtered on `freeToWork` before an offer is
  // ever made; the player was the exception, and they are the one person in the
  // save who cannot be replaced by somebody similar.
  if (person.isPlayer && when) {
    const has = whatHasThem(sim, when.from - BEFORE_THE_FIRST_DAY, when.to);
    if (has) {
      return {
        ok: false,
        error: `You’re on ${has.what} across those dates. Nobody’s in two places.`,
      };
    }
  }

  // The one person in the save who does not get asked, because asking them is
  // asking the hand on the button what it just did. Everybody else has an
  // agent, a diary and a view about the part, and `decideOffer` is where those
  // three argue; the player's answer is the offer. Before this line the draw
  // ran for them too, and on seven and a half offers in a hundred — measured,
  // over forty seeds — the game turned down a part on the player's own picture
  // and said so in the only words it has for a refusal with no cause behind
  // it: *they read it twice and they're going to pass. No, there isn't a
  // reason.* There wasn't one. The dates are still a refusal, because being in
  // two places at once is not a preference, and they are asked above with a
  // sentence of their own.
  const answer: Answer = person.isPlayer
    ? { took: true, feeCents: fee }
    : decideOffer(
      offerOf(sim, project, role, person, fee),
      sim.rng('casting', 'offer', project.id, role.id, person.id).next(),
    );

  if (!('took' in answer) || !answer.took) {
    sim.notify({
      category: 'business',
      title: `${person.displayName} Passes On ${role.name}`,
      body: sayTheAnswer(person, answer),
      importance: 35,
      refType: 'project',
      refId: project.id,
    });
    return { ok: true, answer };
  }

  if (!project.cast) project.cast = [];
  project.cast.push({ roleId: role.id, personId: person.id, feeCents: fee, castAt: sim.now });
  // The number goes on their record whatever it was, which is the reason a
  // producer thinks twice before buying somebody cheap: it is not this picture
  // the cheap number costs them, it is the next three.
  writeTheQuote(person, project.id, role.size, fee, sim.now);
  if (!person.isPlayer) person.careerTrack = 'actor';
  const before = cashOn(sim, project.companyId);
  payTheOverage(sim, project, role, fee);
  payToBringThem(sim, project, person, fee);
  payThePlayer(sim, project, person, fee);
  sayIfItWentUnder(sim, project, before);

  sim.notify({
    category: 'business',
    title: `${person.displayName} Is ${role.name}`,
    body: `${money(fee)} on ${project.title}${when ? `, from ${new Date(when.from).getUTCFullYear()}` : ''}.`
      + ` ${sayTheRead(shownOf(sim, project, role, person))}`
      // How well the company knows them, as its own sentence, and not said at
      // all about the player: `howSure` returns a hundred for them because
      // there is nothing to be unsure about, and the sentence it reads as —
      // *you have worked with them* — would be the game telling the player
      // they have met themselves.
      + (person.isPlayer ? '' : ` ${saidAsASentence(sureReads(howSure(sim, project, role, person)))}`),
    importance: 55,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, answer };
}

/**
 * Global Rule One, finally asked at the one place it exists for.
 *
 * A member of SAG-AFTRA may not work for a producer who has not signed with
 * SAG-AFTRA — anywhere on earth, which is the whole point of the rule. It is
 * the reason the family business is two companies rather than one, and
 * `domain/company.ts` calls it the ladder the whole of that file exists to
 * build. Until now nothing anywhere checked it: the arm could be formed, the
 * agreement signed, and an American cast either way, which made the entire
 * structure a screen that congratulated you.
 *
 * It asks for both, because both are real and they are different steps. An
 * Icelandic company with no American arm has nobody to sign as; an arm that has
 * not signed is a producer SAG-AFTRA has never heard of.
 */
export function globalRuleOne(sim: Simulation, person: Person): string | undefined {
  if (person.isPlayer) return undefined;
  if (!isCitizenOf(person, 'us')) return undefined;
  if (!americanArm(sim.universe)) {
    return `${person.displayName} is American, and an American can’t work for a producer who isn’t. `
      + 'Form the arm first.';
  }
  if (!signedWith(sim.universe, 'sag_aftra')) {
    return `${person.displayName} is American, and the arm has never signed with SAG-AFTRA. `
      + 'Until it does, nobody who is a member may work for it — here or anywhere else.';
  }
  return undefined;
}

/** What the company's cash account holds, or nothing if it has none. */
function cashOn(sim: Simulation, companyId: Id | undefined): Money {
  if (!companyId) return 0;
  return Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === companyId && one.kind === 'company_cash' && !one.closedAt)
    ?.balance ?? 0;
}

/**
 * What closing this deal takes out of the company today.
 *
 * Not the fee. Everybody except the player is an abstraction the picture pays
 * for out of the budget as the periods run, so seating them moves no cash at
 * all. What moves on the day is the player's own fee, because they hold a real
 * account and the company has to actually hand it over; whatever was agreed
 * above the band, because that is the picture going over on the day it reaches;
 * and the flights and the hotel for somebody who does not live here.
 */
export function whatSayingYesCosts(role: Role, person: Person, fee: Money): Money {
  return Math.max(0, fee - role.bandCents)
    + bringingThemCents(person, fee)
    + (person.isPlayer ? fee : 0);
}

/**
 * Says so when closing a deal put the company under.
 *
 * It is not refused, and getting to that was a wrong turn worth recording. A
 * company mid-picture is supposed to be overdrawn: the periods spend the
 * budget as they run and `familyCovers` tops the account back up at the end of
 * the month, so on the first day of a shoot this company is routinely a couple
 * of million under. Measured on played careers, the account sits under water
 * for thirty-four to sixty-two weeks out of thirteen hundred across five
 * seeds, at worst EUR 2.5m down. A cash test on casting would have made
 * casting impossible at exactly the moment casting happens.
 *
 * "Back to zero at the end of every month" is what this used to say, and it is
 * two things too strong. The top-up goes in round hundreds of thousands, so
 * the account lands a little above zero rather than on it — and past the last
 * rung of `PATIENCE` the money carries a condition, so a month the lot earned
 * nothing gets no check at all and the company stays under. Over twenty-five
 * years that is eight to twenty months of the two hundred and ninety-nine, per
 * seed, which is the family's patience working exactly as it was built to.
 *
 * What was actually wrong was the silence. The money goes, the family covers
 * it, the share of a year of the group's profit that has gone in ticks up, and
 * the next greenlight is measured against what is left — so a deal closed today
 * is a picture not made in two years, and nothing anywhere said so. The
 * consequence was right and arrived with no cause attached to it.
 */
function sayIfItWentUnder(sim: Simulation, project: Project, before: Money): void {
  const after = cashOn(sim, project.companyId);
  if (after >= 0 || after >= before) return;
  sim.notify({
    category: 'business',
    title: `${project.title} Is Spending Money The Company Hasn’t Got`,
    body: `${money(-after)} under. ${GROUP.name} has been covering the difference at the end of `
      + 'the month, and every euro of it is counted against what the family will still put in — '
      + 'which is the same figure the next picture has to be greenlit against, and the figure that '
      + 'decides whether the next check comes at all.',
    importance: 60,
    refType: 'project',
    refId: project.id,
  });
}

/**
 * Charges the company whatever the part cost over what it was priced at.
 *
 * Without this, paying over the band is free and the whole negotiation is a
 * form: there would be no reason ever to offer less than the most somebody
 * would take. The band is already inside the budget — the cast account is a
 * share of the negative, and the periods spend the negative — so what is posted
 * here is the difference and only the difference. A picture that reaches past
 * what it was greenlit for is a picture going over, on the day it reaches.
 *
 * It goes out at the offer rather than at the shoot because that is when the
 * company committed to it. Pay or play is precisely the doctrine that the money
 * is owed from the moment somebody said yes, whether or not a frame is shot.
 */
function payTheOverage(sim: Simulation, project: Project, role: Role, fee: Money): void {
  const over = fee - role.bandCents;
  if (over <= 0) return;
  const account = Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === project.companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
  if (!account) return;
  sim.expense(account, over, `${project.title}: Over The Band On ${role.name}`, 'business',
    { refType: 'project', refId: project.id });
  project.spentCents += over;
}

/**
 * Pays what it costs to have somebody here who does not live here.
 *
 * Flights, a hotel for the run and per diem, charged on the day the deal
 * closes, the same way the overage is. It is the half of local hire the
 * casting screen cannot argue with: the band buys the fee and says nothing at
 * all about what it takes to get them onto the stage.
 */
function payToBringThem(sim: Simulation, project: Project, person: Person, fee: Money): void {
  const cost = bringingThemCents(person, fee);
  if (cost <= 0) return;
  const account = Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === project.companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
  if (!account) return;
  const from = fromWhere(person);
  sim.expense(account, cost, `${project.title}: Bringing ${person.displayName} From ${from?.label ?? 'Abroad'}`,
    'business', { refType: 'project', refId: project.id });
  project.spentCents += cost;
  // Flights and a hotel booked from here are still bought abroad, so none of it
  // is Icelandic spend and none of it is certifiable. Recorded on the way out,
  // because a total cannot be taken apart afterwards to find it.
  project.notSpentHereCents = (project.notSpentHereCents ?? 0) + cost;
}

/**
 * Moves the fee, where the person being paid is the player.
 *
 * Everybody else's fee is inside the budget and goes out with the periods,
 * because everybody else is an abstraction the picture pays for. The player is
 * not: they hold a real account with a real balance, and a company that hires
 * them has to actually hand the money over. It is the whole of what being cast
 * pays, and it is the first money in this build that goes from the family's
 * company into the player's own pocket.
 */
function payThePlayer(sim: Simulation, project: Project, person: Person, fee: Money): void {
  if (!person.isPlayer || fee <= 0) return;
  const from = Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === project.companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
  const to = person.primaryAccountId
    ?? Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.closedAt)?.id;
  if (!from || !to) return;
  sim.transfer(from, to, fee, `${project.title}: Acting Fee`, 'business',
    { refType: 'project', refId: project.id });
}

/** Lets somebody go. The money stays owed, which is the point of the record. */
export function letThemGo(sim: Simulation, projectId: Id, roleId: string): { ok: true } | { ok: false; error: string } {
  const project = sim.universe.projects[projectId];
  if (!project) return { ok: false, error: 'There’s no such picture.' };
  const seat = seatFor(project, roleId);
  if (!seat) return { ok: false, error: 'Nobody is in that part.' };
  seat.releasedAt = sim.now;
  const person = sim.universe.people[seat.personId];
  sim.notify({
    category: 'business',
    title: `${person?.displayName ?? 'Somebody'} Is Off ${project.title}`,
    body: `${money(seat.feeCents)} was agreed and it’s still owed. Paid, used and credited are three different things,`
      + ' and this is the first of them without the other two.',
    importance: 50,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true };
}

/** What the agent says, for a screen. */
export function sayTheAnswer(person: Person, answer: Answer): string {
  if (answer.took) return `${person.displayName} is in, at ${money(answer.feeCents)}.`;
  if ('counterCents' in answer) {
    return `Not at that. ${person.displayName}’s people say ${money(answer.counterCents)} and they’d go this week.`;
  }
  return passById(answer.passed)?.said ?? 'They’re passing.';
}

/** What a read amounts to, in a sentence, without printing three numbers. */
export function sayTheRead(read: Read): string {
  const best = AXES.reduce((top, axis) => (read[axis.id] > read[top.id] ? axis : top), AXES[0]!);
  const worst = AXES.reduce((low, axis) => (read[axis.id] < read[low.id] ? axis : low), AXES[0]!);
  if (Math.round(read[best.id]) - Math.round(read[worst.id]) < 12) {
    return `Even across all three: ${Math.round(read[best.id])}/100.`;
  }
  return `${best.label} ${Math.round(read[best.id])}/100, ${worst.label.toLowerCase()} ${Math.round(read[worst.id])}/100.`;
}

/**
 * A fragment written to sit inside a line, read out as a sentence of its own.
 *
 * `sureReads` and its kind are phrased to be dropped into the middle of
 * something — *…, and you have watched a tape* — which is right where a screen
 * puts them under a name and wrong where a notification needs a full stop. The
 * alternative was two wordings of every phrase, which is two wordings to keep
 * true.
 */
function saidAsASentence(fragment: string): string {
  if (!fragment) return fragment;
  return `${fragment[0]!.toUpperCase()}${fragment.slice(1)}.`;
}

/** Whole units, no cents. Routed through the one formatter so the ledger
 *  has one currency rather than four opinions about it. */
const money = (cents: Money): string => formatMoney(cents, { cents: false });

export function registerCasting(sim: Simulation): void {
  registerTheOffice(sim);
  registerTheRoom(sim);

  /**
   * Offer a part to somebody.
   *
   * The only command in the build where the answer is not the same shape as
   * the question: a refusal here is not the engine saying the thing could not
   * be done, it is a person saying no, and those two have to be told apart or
   * the whole business of asking is a form with a submit button.
   */
  sim.onCommand<Casting, { ok: boolean; error?: string; said?: string }>(
    'company.cast', (payload, { sim: s }) => {
      const done = castSomebody(s, payload);
      if (!done.ok) return { ok: false, error: done.error };
      const person = s.universe.people[payload.personId];
      return {
        ok: true,
        said: person ? sayTheAnswer(person, done.answer) : undefined,
      };
    },
  );

  /**
   * Put a part out and see who comes in.
   *
   * Separate from the offer on purpose. Advertising a part and offering it to
   * somebody are two different decisions taken days apart by different people,
   * and a build where the pile appears the moment you look at the role would be
   * saying the first one does not exist.
   */
  sim.onCommand<{ projectId: Id; roleId: string }, { ok: boolean; error?: string; came?: number }>(
    'company.breakdown', (payload, { sim: s }) => {
      const project = s.universe.projects[payload.projectId];
      if (!project) return { ok: false, error: 'There\u2019s no such picture.' };
      const role = roleOn(project, payload.roleId);
      if (!role) return { ok: false, error: 'There\u2019s no such part in it.' };
      if (seatFor(project, role.id)) return { ok: false, error: `${role.name} is cast.` };
      return { ok: true, came: putItOut(s, project, role).length };
    },
  );

  /**
   * Put somebody on a format season's cast board.
   *
   * One at a time, twelve times, and not as a list, because that is the shape of
   * the decision: a cast board is assembled person by person against the eleven
   * already on it, and the whole reason it is a decision is that the twelfth
   * choice is different from the first.
   */
  sim.onCommand<{ projectId: Id; personId: Id }, { ok: boolean; error?: string; onIt?: number }>(
    'company.board', (payload, { sim: s }) => putOnTheBoard(s, payload.projectId, payload.personId),
  );

  /**
   * Put somebody in the room, with or without a note.
   *
   * Separate from the breakdown and from the offer, because seeing somebody,
   * advertising a part and hiring somebody are three things a production does
   * on three different days for three different reasons. This one buys nothing
   * but information, and information is the only thing in casting that is worth
   * what it costs.
   */
  sim.onCommand<Booking, { ok: boolean; error?: string; at?: number }>(
    'company.session', (payload, { sim: s }) => {
      const done = bookTheRoom(s, payload);
      return done.ok ? { ok: true, at: done.at } : { ok: false, error: done.error };
    },
  );

  /** Let somebody go, which never gets the money back. */
  sim.onCommand<{ projectId: Id; roleId: string }, { ok: boolean; error?: string }>(
    'company.release', (payload, { sim: s }) => letThemGo(s, payload.projectId, payload.roleId),
  );
}

// ---------------------------------------------------------------------------
// What the office does with the parts nobody filled
// ---------------------------------------------------------------------------

export const CASTING_KIND = 'project.cast';

/**
 * Weeks before the camera turns over that the office stops waiting.
 *
 * There is no such thing as an unfilled part on the first day of photography.
 * Somebody stands on the mark and says the line, and if the producer never
 * chose them, the casting office did — at the band, out of whoever the band
 * reaches, with nobody's opinion asked. That is what casting *by default* is,
 * and it is the thing the player is actually competing with when they pay over
 * the band to get somebody better.
 */
export const OFFICE_FILLS_AT = 2;

/** Arms the office's own pass at the parts, for a picture that has dates. */
export function armTheCasting(sim: Simulation, project: Project): void {
  const shoot = baseWindowOf(project);
  if (!shoot || (project.roles ?? []).length === 0) return;
  sim.schedule({
    at: Math.max(sim.now, shoot.from - OFFICE_FILLS_AT * MS_WEEK),
    kind: CASTING_KIND,
    label: `${project.title}: The Rest Of The Parts`,
    category: 'business',
    priority: 55,
    payload: { projectId: project.id },
    refType: 'project',
    refId: project.id,
  });
}

/**
 * Fills every part still open, at the band.
 *
 * The office takes the best read it can find for the money and does not
 * negotiate, because it has no authority to go over. So the reach of the band
 * is the whole of what an unattended picture gets — which is why the money a
 * producer greenlights at is a casting decision months before anybody thinks of
 * it as one.
 */
export function theOfficeFills(sim: Simulation, project: Project): number {
  let filled = 0;
  for (const role of openRoles(project)) {
    const seen = putItOut(sim, project, role)
      .filter((person) => {
        // An office with no authority to go over the band also has no appetite
        // for explaining a booking to anybody. It passes, and `conduct history`
        // is one of the twenty pass reasons a real office records.
        if (person.reputation.controversy >= TOO_HOT) return false;
        // And it cannot book somebody the company is not allowed to employ.
        // The office fills parts without asking anybody, so this is the one
        // place Global Rule One would otherwise be quietly got round by not
        // going through the front door.
        if (globalRuleOne(sim, person)) return false;
        const when = datesFor(project, role);
        return !when || freeToWork(sim, person.id, when.from, when.to);
      });
    if (seen.length === 0) continue;
    // On what the office believes, which is the whole of what an office has.
    // Reading the truth here would have made the casting director clairvoyant
    // and every round in the diary pointless: a producer who never saw anybody
    // would get the same cast as one who saw everybody twice.
    const worth = (person: Person): number => {
      const one = shownOf(sim, project, role, person);
      // Weighted by what this part needs rather than summed flat, because an
      // office casting a day player and an office casting a lead are not
      // looking for the same thing, and a flat sum would have made every
      // casting decision in the save the same decision wearing a vector.
      return AXES.reduce((n, axis) => n + one[axis.id] * wantsOn(role, axis.id), 0);
    };
    // Down the list in the order it believes in, asking each one — because an
    // office is refused like anybody else. Without this it simply seated its
    // first choice: `decideOffer` had exactly one caller in the engine, so at
    // the band the player was turned down on thirty-six of eighty-four
    // person-part pairs and the office was turned down never. Doing nothing was
    // strictly better than negotiating, which is the whole of casting made
    // pointless by one missing call.
    //
    // On the same draw the player gets, deliberately. Whether somebody will do
    // it at that number is a fact about them and the number, not about who is
    // asking, so a part the player was refused is a part the office is refused
    // too, and the band stops being a way of getting for free what would not be
    // given.
    const order = [...seen].sort((a, b) => worth(b) - worth(a));
    let best: Person | undefined;
    for (const person of order) {
      const roll = sim.rng('casting', 'offer', project.id, role.id, person.id).next();
      if (decideOffer(offerOf(sim, project, role, person, role.bandCents), roll).took) {
        best = person;
        break;
      }
    }
    // Everybody in the pile said no at the band. The part stays open, which is
    // the honest outcome and the one that makes going over the band worth money.
    if (!best) continue;
    if (!project.cast) project.cast = [];
    project.cast.push({ roleId: role.id, personId: best.id, feeCents: role.bandCents, castAt: sim.now });
    writeTheQuote(best, project.id, role.size, role.bandCents, sim.now);
    best.careerTrack = 'actor';
    // And the flights, which the office incurs exactly as a producer does. It
    // casts at the band so there is never an overage, and it never reaches the
    // player, so those two payments have nothing to do here — but somebody
    // living in Copenhagen has to be got to the stage whoever hired them. This
    // was missing, and a picture cast by the office flew four people in for
    // nothing: the money was never spent, and the reimbursement then took their
    // fees off the certificate as money paid abroad on travel nobody bought.
    payToBringThem(sim, project, best, role.bandCents);
    filled += 1;
  }
  return filled;
}

export function registerTheOffice(sim: Simulation): void {
  sim.onSchedule(CASTING_KIND, (item) => {
    const project = sim.universe.projects[String(item.payload?.projectId ?? '')];
    if (!project || project.shelvedAt) return;
    const filled = theOfficeFills(sim, project);
    if (filled === 0) return;
    sim.notify({
      category: 'business',
      title: `${project.title}: ${filled === 1 ? 'The Last Part Is Filled' : 'The Rest Of The Parts Are Filled'}`,
      body: `The office cast ${filled} ${filled === 1 ? 'part' : 'parts'} at the band, because nobody else had. `
        + `${whereTheCastStands(sim, project)}`,
      importance: 45,
      refType: 'project',
      refId: project.id,
    });
  });
}

// ---------------------------------------------------------------------------
// What a name is worth, and what it exposes you to
// ---------------------------------------------------------------------------

/**
 * The public fame at which somebody is known well enough to be news.
 *
 * SLATE's own. Under it a person is a working performer and what they do at the
 * weekend is nobody's business; over it there is a market for it. Set so that a
 * picture with real money behind its leads has names on it and a cheap one does
 * not, which makes it the price of the thing the money bought.
 */
export const SOMEBODY_KNOWS = 25;

/** How well known the best-known person in the cast is. */
export function theBiggestName(sim: Simulation, project: Project): number {
  let most = 0;
  for (const one of castOf(sim, project)) {
    if (one.person) most = Math.max(most, one.person.reputation.publicFame);
  }
  return most;
}

/**
 * Whoever in the cast has the most to lose, which is whoever has the most.
 *
 * The person a story is about is the person a story is worth writing about, so
 * a name going off goes off on the biggest name in the picture rather than on a
 * random one. Returns nobody where nobody is known, which is the same condition
 * that stops the finding being dealt at all.
 */
export function theNameThatGoesOff(sim: Simulation, project: Project): Person | undefined {
  let worst: Person | undefined;
  for (const one of castOf(sim, project)) {
    if (!one.person || one.person.reputation.publicFame < SOMEBODY_KNOWS) continue;
    if (!worst || one.person.reputation.publicFame > worst.reputation.publicFame) worst = one.person;
  }
  return worst;
}

/**
 * How far a wave of attention over somebody carries, out of a hundred.
 *
 * Scaled to how known they were, because a story about somebody nobody has
 * heard of is not a story. It never reaches a hundred from one week: this is a
 * thing that accumulates across a career and decays across years, and a single
 * event that maxed the axis would leave nowhere for the second one to go.
 */
export const goesOffBy = (fame: number): number =>
  Math.round(18 + Math.min(1, fame / 80) * 34);

/**
 * What the cast's controversy costs the picture at the sale.
 *
 * Weighted the way every other cast figure is: by how much of the picture each
 * of them is in, because a day player nobody minds is not the same exposure as
 * the lead. Read by `world/selling.ts` and by the office, which will not cast
 * somebody the trade is currently writing about.
 */
export function castsControversy(sim: Simulation, project: Project): number | undefined {
  const inIt = whoIsInIt(sim, project);
  const weight = inIt.reduce((n, one) => n + one.share, 0);
  if (weight <= 0) return undefined;
  return inIt.reduce((n, one) => n + (one.person?.reputation.controversy ?? 0) * one.share, 0) / weight;
}

/** What an office will not touch. SLATE's own, and deliberately not a ban. */
export const TOO_HOT = 55;

/**
 * What the cast is worth to the people who already like them, out of a hundred.
 *
 * Weighted the way every other cast figure is. It is deliberately not the same
 * question as how a face reads: that is a property of the instrument and a
 * newcomer can have it in full, while this is a relationship an audience has
 * with somebody, and the only way to get one is to have been in things they
 * watched. A beautiful stranger reads and does not appeal; somebody people have
 * liked for fifteen years appeals whatever the lens makes of them.
 */
export function castsAppeal(sim: Simulation, project: Project): number | undefined {
  const inIt = whoIsInIt(sim, project);
  const weight = inIt.reduce((n, one) => n + one.share, 0);
  if (weight <= 0) return undefined;
  return inIt.reduce(
    (n, one) => n + (one.person?.reputation.audienceAppeal ?? 50) * one.share, 0,
  ) / weight;
}

/**
 * What the cast is trusted to finish, out of a hundred.
 *
 * Read by the floor and by nothing else. A producer believing somebody will
 * turn up is not a claim about how good they are — the best performer alive can
 * be the one who does not come out of the trailer — and it is the one thing
 * about a cast that costs days rather than money or an audience.
 */
export function castsReliability(sim: Simulation, project: Project): number | undefined {
  const inIt = castOf(sim, project);
  const at = (one: InIt) => one.share;
  const weight = inIt.reduce((n, one) => n + at(one), 0);
  if (weight <= 0) return undefined;
  return inIt.reduce(
    (n, one) => n + (one.person?.reputation.reliability ?? 50) * at(one), 0,
  ) / weight;
}

/**
 * Takes the shine off everybody who was on a picture that ran over.
 *
 * The writer that makes reliability a thing somebody has rather than a thing
 * they were seeded with. It lands on the whole cast and not on whoever was
 * actually late, because that is how it works: a production that overran is a
 * production everybody on it was on, and the next producer reading the crew
 * list does not know whose fault it was either.
 */
export function ranOverOnThem(sim: Simulation, project: Project, days: number): void {
  if (days <= 0) return;
  for (const one of castOf(sim, project)) {
    if (!one.person) continue;
    one.person.reputation.reliability = clamp(
      Math.round(one.person.reputation.reliability - days * OVERRUNS_COST), 1, 100,
    );
  }
}

/**
 * What a day over costs everybody on the picture, out of a hundred.
 *
 * Small, because one bad week should not end a career and a run of them should.
 * SLATE's own.
 */
export const OVERRUNS_COST = 0.6;

// ---------------------------------------------------------------------------
// What the company believes, as against what is true
// ---------------------------------------------------------------------------

/**
 * Whether this company has already found out.
 *
 * Somebody who has finished a job here is not a person you have an opinion
 * about, they are a person you know: you watched them work for eleven weeks and
 * cut the results. So the estimate collapses to the truth and stays there, for
 * good, and the fourth picture is cast by people the third one taught you
 * about. It is the same recurrence the crew has, paying out on the axis that
 * actually matters.
 */
export function alreadyKnown(sim: Simulation, companyId: Id, personId: Id): boolean {
  for (const project of Object.values(sim.universe.projects)) {
    if (project.companyId !== companyId) continue;
    for (const seat of project.cast ?? []) {
      if (seat.personId !== personId) continue;
      const role = roleOn(project, seat.roleId);
      const when = role ? datesFor(project, role) : undefined;
      if (when && sim.now > when.to) return true;
    }
  }
  return false;
}

/** The furthest round anybody has got to with somebody, which is the pile at worst. */
export function furthestRound(looked: Looked | undefined): Round {
  let best = roundById('pile')!;
  for (const id of looked?.rounds ?? []) {
    const round = roundById(id);
    if (round && ROUNDS.indexOf(round) > ROUNDS.indexOf(best)) best = round;
  }
  return best;
}

/**
 * How far out the estimate can be on one axis, and which way it leans.
 *
 * The note is the whole of the interesting part. A session is one note and a
 * note is one axis, so naming an axis takes that one a round further than the
 * session would have taken it and leaves the other two exactly where they were.
 * On the last round there is nothing further to reach for, so it halves
 * instead — which is the honest reading of a director spending the whole of a
 * callback on one question.
 */
export function howWide(looked: Looked | undefined, axis: AxisId): { width: number; distorted: boolean } {
  const round = furthestRound(looked);
  const distorted = (round.distorts ?? []).includes(axis);
  if (looked?.note !== axis) return { width: round.width[axis], distorted };
  const next = ROUNDS[ROUNDS.indexOf(round) + 1];
  return {
    width: next ? next.width[axis] : round.width[axis] / 2,
    // A note is somebody asking the question directly, in the room, to their
    // face. Whatever the file was flattering does not survive that.
    distorted: false,
  };
}

/**
 * How far this person's tape misrepresents them, out of a hundred, and which
 * way.
 *
 * Off four attributes that are about equipment and deadlines rather than about
 * acting, so it is genuinely independent of whether they are any good. Positive
 * means the file is better than the person.
 */
export function tapeLean(sheet: AttributeSheet): number {
  if (THE_TAPE.length === 0) return 0;
  let total = 0;
  for (const id of THE_TAPE) total += rate(sheet, id);
  return ((total / THE_TAPE.length - 50) / 50) * TAPE_LEANS;
}

/**
 * Where the estimate sits, for one person on one axis.
 *
 * Fixed for the life of the save, on the keys of the part and the person and
 * the axis and nothing else — deliberately not on how far anybody has got,
 * because an offset that redrew every round would make the shown figure jump
 * about rather than close in. It closes in: the same point, seen from nearer.
 */
function offsetOn(sim: Simulation, role: Role, personId: Id, axis: AxisId): number {
  return sim.rng('casting', 'shown', role.id, personId, axis).next() * 2 - 1;
}

/**
 * What the company would say this person is, if asked today.
 *
 * Truth, pushed by whatever the round it was seen through flatters, and then
 * displaced by a fixed amount of however wrong it is allowed to be. This is the
 * number every screen prints and the number the casting office picks on. The
 * true read is still what the shoot and the sale get, and the gap between the
 * two is the entire cost of not having gone to the trouble.
 */
export function shownOn(
  sim: Simulation, project: Project, role: Role, person: Person, axis: AxisId,
): number {
  const truth = readOn(person.attributes, axis);
  if (person.isPlayer || alreadyKnown(sim, project.companyId, person.id)) return truth;
  return believedAt(
    truth, lookedAt(role, person.id), axis,
    offsetOn(sim, role, person.id, axis), tapeLean(person.attributes),
  );
}

/**
 * The arithmetic of a belief, with nothing in it but numbers.
 *
 * Pulled out of `shownOn` so the decider sweep can call it with a world posed
 * rather than played, and so the one line that actually decides what a producer
 * sees can be read without a simulation around it.
 */
export function believedAt(
  truth: number, looked: Looked | undefined, axis: AxisId, offset: number, lean = 0,
): number {
  const { width, distorted } = howWide(looked, axis);
  return clamp(Math.round(truth + (distorted ? lean : 0) + offset * width), 1, 100);
}

/** All three, which is the only form anybody should be shown. */
export function shownOf(sim: Simulation, project: Project, role: Role, person: Person): Read {
  return {
    truth: shownOn(sim, project, role, person, 'truth'),
    repeatable: shownOn(sim, project, role, person, 'repeatable'),
    reads: shownOn(sim, project, role, person, 'reads'),
  };
}

/** How sure anybody is, out of a hundred, for a screen to say so in one word. */
export function howSure(sim: Simulation, project: Project, role: Role, person: Person): number {
  if (person.isPlayer || alreadyKnown(sim, project.companyId, person.id)) return 100;
  const looked = lookedAt(role, person.id);
  const pile = roundById('pile')!;
  let widest = 0;
  let worst = 0;
  for (const axis of AXES) {
    widest += pile.width[axis.id];
    worst += howWide(looked, axis.id).width;
  }
  return widest <= 0 ? 100 : clamp(Math.round(100 - (worst / widest) * 100), 0, 100);
}

/** What a sureness reads as, in the words somebody would use. */
export function sureReads(sure: number): string {
  if (sure >= 96) return 'you have worked with them';
  if (sure >= 70) return 'you have had them in twice';
  if (sure >= 45) return 'you have met them';
  if (sure >= 20) return 'you have watched a tape';
  return 'you have seen a photograph';
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

export const ROOM_KIND = 'project.room';

/** A day, for a diary that is kept in days rather than weeks. */
const MS_DAY = 24 * 60 * 60 * 1000;

/**
 * The first day this company's casting office is free.
 *
 * The office runs one thing at a time, and the schedule is the diary — there is
 * no second record of what the office is doing, because a second record is a
 * second thing to keep in step with the first. Whatever is already booked pushes
 * everything after it, so a picture with twenty-one parts discovers that eleven
 * weeks is not very long by trying to fill it.
 */
export function nextFreeDay(sim: Simulation, companyId: Id): Instant {
  let free = sim.now;
  for (const item of sim.universe.scheduled) {
    if (item.kind !== ROOM_KIND || item.status !== 'pending') continue;
    const project = sim.universe.projects[String(item.payload?.projectId ?? '')];
    if (!project || project.companyId !== companyId) continue;
    free = Math.max(free, item.at);
  }
  return free;
}

/** When the office stops waiting and fills whatever is left. */
export function officeFillsAt(project: Project): Instant | undefined {
  const shoot = baseWindowOf(project);
  return shoot ? shoot.from - OFFICE_OPEN_UNTIL * MS_WEEK : undefined;
}

/**
 * Weeks before the shoot that the office stops taking bookings.
 *
 * The same date it fills the open parts on, and it is the same number for the
 * same reason: after this there is no point seeing anybody, because whoever is
 * playing the part has already been told they are.
 */
export const OFFICE_OPEN_UNTIL = OFFICE_FILLS_AT;

export interface Booking {
  projectId: Id;
  roleId: string;
  personId: Id;
  round: string;
  /** The axis the note is on, where one is given. */
  note?: string;
}

/**
 * Books somebody into the room.
 *
 * Refuses for real reasons rather than politely: a part that is cast, a round
 * that cannot follow what has happened so far, a round already done, and — the
 * one that actually bites — a diary that has run past the day the office stops
 * waiting. That last refusal is the whole shape of casting as a decision. There
 * is enough room to see the people who matter and not enough to see everybody,
 * and nothing tells you which is which.
 */
export function bookTheRoom(sim: Simulation, booking: Booking): { ok: true; at: Instant } | { ok: false; error: string } {
  const project = sim.universe.projects[booking.projectId];
  if (!project) return { ok: false, error: 'There’s no such picture.' };
  if (project.shelvedAt) return { ok: false, error: `${project.title} is shelved.` };
  const role = roleOn(project, booking.roleId);
  if (!role) return { ok: false, error: 'No part by that id is in it.' };
  if (seatFor(project, role.id)) return { ok: false, error: `${role.name} is cast, so a room would teach nobody anything.` };
  const round = roundById(booking.round);
  if (!round || round.id === 'pile') return { ok: false, error: 'That isn’t a round anybody runs.' };
  const person = sim.universe.people[booking.personId];
  if (!person) return { ok: false, error: 'Nobody by that name exists.' };
  const looked = lookedAt(role, person.id);
  if (!looked) return { ok: false, error: `Nobody has put ${role.name} out yet, so nobody has come in for it.` };
  if ((looked.rounds ?? []).includes(round.id)) {
    return { ok: false, error: `${person.displayName} has already done that. Doing it again teaches nobody anything.` };
  }
  if (round.after && !round.after.some((id) => (looked.rounds ?? []).includes(id))) {
    const names = round.after.map((id) => roundById(id)?.label.toLowerCase() ?? id);
    return {
      ok: false,
      error: `Nobody calls a stranger back. ${names.join(' or ')} first.`,
    };
  }
  if (booking.note !== undefined && !axisById(booking.note)) {
    return { ok: false, error: 'That isn’t something anybody could give a note on.' };
  }
  if (person.isPlayer || alreadyKnown(sim, project.companyId, person.id)) {
    return { ok: false, error: `You know what ${person.displayName} is. Seeing them again is a day spent learning nothing.` };
  }

  const at = nextFreeDay(sim, project.companyId) + Math.round(round.takes * MS_DAY);
  const shuts = officeFillsAt(project);
  if (shuts !== undefined && at > shuts) {
    return {
      ok: false,
      error: `The office is booked solid until after ${new Date(at).toISOString().slice(0, 10)}, `
        + 'and by then the parts are filled. Something else has to come off the diary.',
    };
  }

  const account = Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === project.companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
  if (account && round.costsCents > 0) {
    sim.expense(account, round.costsCents, `${project.title}: ${round.label} For ${role.name}`, 'business',
      { refType: 'project', refId: project.id });
    project.spentCents += round.costsCents;
  }

  sim.schedule({
    at,
    kind: ROOM_KIND,
    label: `${project.title}: ${round.label} — ${person.displayName}`,
    category: 'business',
    priority: 50,
    payload: {
      projectId: project.id,
      roleId: role.id,
      personId: person.id,
      round: round.id,
      ...(booking.note ? { note: booking.note } : {}),
    },
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, at };
}

/** Everything the office has in the diary for a picture, soonest first. */
export function theDiary(sim: Simulation, project: Project): { at: Instant; roleId: string; personId: Id; round: string }[] {
  const out: { at: Instant; roleId: string; personId: Id; round: string }[] = [];
  for (const item of sim.universe.scheduled) {
    if (item.kind !== ROOM_KIND || item.status !== 'pending') continue;
    if (String(item.payload?.projectId ?? '') !== project.id) continue;
    out.push({
      at: item.at,
      roleId: String(item.payload?.roleId ?? ''),
      personId: String(item.payload?.personId ?? ''),
      round: String(item.payload?.round ?? ''),
    });
  }
  return out.sort((a, b) => a.at - b.at);
}

export function registerTheRoom(sim: Simulation): void {
  sim.onSchedule(ROOM_KIND, (item) => {
    const project = sim.universe.projects[String(item.payload?.projectId ?? '')];
    if (!project || project.shelvedAt) return;
    const role = roleOn(project, String(item.payload?.roleId ?? ''));
    const person = sim.universe.people[String(item.payload?.personId ?? '')];
    const round = roundById(String(item.payload?.round ?? ''));
    if (!role || !person || !round) return;
    const looked = lookedAt(role, person.id);
    if (!looked) return;

    // What the company thought before anybody walked in, so the notification can
    // say what the room actually bought. It is the only honest way to report a
    // round: not what they are, which nobody in the world knows, but how far
    // what you believed has just moved.
    const before = shownOf(sim, project, role, person);
    looked.rounds = [...(looked.rounds ?? []), round.id];
    const note = item.payload?.note === undefined ? undefined : String(item.payload.note);
    if (note) looked.note = note;
    const after = shownOf(sim, project, role, person);

    sim.notify({
      category: 'business',
      title: `${project.title}: ${person.displayName}, ${role.name}`,
      body: `${sayTheRoom(before, after)} ${sureReads(howSure(sim, project, role, person))}.`,
      importance: 40,
      refType: 'project',
      refId: project.id,
    });
  });
}

/**
 * What a round moved, said as a change rather than as a state.
 *
 * Nobody in this world ever learns what somebody is. They learn that what they
 * thought was wrong, and by how much, which is the only thing a round can
 * honestly report.
 */
export function sayTheRoom(before: Read, after: Read): string {
  const moved = AXES
    .map((axis) => ({ axis, by: after[axis.id] - before[axis.id] }))
    .filter((one) => Math.abs(one.by) >= 2)
    .sort((a, b) => Math.abs(b.by) - Math.abs(a.by));
  if (moved.length === 0) return 'The office thinks exactly what it thought before they walked in.';
  const worst = moved[0]!;
  return `${worst.axis.label} was ${Math.round(before[worst.axis.id])}/100 and reads `
    + `${Math.round(after[worst.axis.id])}/100 now.`;
}

// ---------------------------------------------------------------------------
// What two of them have between them
// ---------------------------------------------------------------------------

/**
 * A read with its own level taken out of it, leaving only its shape.
 *
 * The whole reason chemistry is not a sum. Two performers a long way apart in
 * how good they are can be exactly the same note twice, and two identical in
 * standing can fill each other's gaps completely — so what pairs is the second
 * thing, and a level-blind shape is how you ask about it. It is also what keeps
 * the player out of the trap: at a hundred on everything their shape is flat,
 * not extreme, so they are neither the best nor the worst partner alive by
 * construction.
 */
export function shapeOf(read: Read): Read {
  const level = AXES.reduce((n, axis) => n + read[axis.id], 0) / AXES.length;
  const out = { ...read };
  for (const axis of AXES) out[axis.id] = read[axis.id] - level;
  return out;
}

/**
 * How far apart two people are in shape, out of a hundred.
 *
 * The term that cannot be split into two solo scores, and the reason this file
 * can claim to have a pairing at all rather than addition with a new name.
 */
export function complementOf(one: Read, other: Read): number {
  const a = shapeOf(one);
  const b = shapeOf(other);
  let apart = 0;
  for (const axis of AXES) apart += Math.abs(a[axis.id] - b[axis.id]);
  return apart / AXES.length;
}

/** What somebody gives whoever is in the scene with them, out of a hundred. */
export function givingOf(sheet: AttributeSheet): number {
  if (THE_GIVING.length === 0) return 0;
  let total = 0;
  for (const id of THE_GIVING) total += rate(sheet, id);
  return total / THE_GIVING.length;
}

/**
 * What two people have between them.
 *
 * Difference in shape, multiplied by how much the two of them give, plus the
 * part nobody can account for. The multiplication is what makes it a pairing:
 * generosity with nothing to be generous toward buys nothing, and two people
 * who fill each other's gaps and will not look at each other buy nothing
 * either.
 */
export function sparkBetween(one: Person, other: Person, draw: number): number {
  const apart = complementOf(readOf(one), readOf(other));
  const giving = (givingOf(one.attributes) + givingOf(other.attributes)) / 2 / 100;
  return clamp(
    Math.round(
      PAIRING.middling
      + Math.min(1, apart / PAIRING.apartAt) * PAIRING.complement * giving
      + (draw - 0.5) * PAIRING.rapport,
    ),
    1, 100,
  );
}

/**
 * What the whole cast has between them, weighted by how much of the picture
 * each pairing is actually in together.
 *
 * Only the parts engaged across the title, because those are the people who are
 * in scenes with each other for months. A day player pairs with nobody: they
 * are there for an afternoon and whoever they played it with was somebody
 * else's problem.
 *
 * Undefined where there is nobody to pair with, which is a picture with one
 * person in it and not a picture with no chemistry.
 */
export function castSpark(sim: Simulation, project: Project): number | undefined {
  // Only the people who are in it together for months, which on a scripted
  // picture is the leads and the regulars. A format season's whole board passes
  // this by construction — twelve people engaged for the season — and that is why
  // a board sparks at all, which is the single thing a cast board is chosen for.
  const together = whoIsInIt(sim, project).filter((one) => one.acrossTitle && one.person);
  if (together.length < 2) return undefined;
  let total = 0;
  let weight = 0;
  for (let i = 0; i < together.length; i += 1) {
    for (let j = i + 1; j < together.length; j += 1) {
      const a = together[i]!;
      const b = together[j]!;
      // How much of the picture the two of them are in at the same time, which
      // is what makes a pairing of leads worth more than a pairing of the fifth
      // and sixth names on the call sheet.
      const share = a.share * b.share;
      const draw = sim.rng('casting', 'spark', project.id, a.key, b.key).next();
      total += sparkBetween(a.person!, b.person!, draw) * share;
      weight += share;
    }
  }
  return weight > 0 ? total / weight : undefined;
}

/** What a pairing reads as, in the words anybody would use about one. */
export function sparkReads(spark: number): string {
  if (spark >= 78) return 'something happens between them';
  if (spark >= 60) return 'they play well together';
  if (spark >= 42) return 'they’re fine together';
  if (spark >= 25) return 'two performances side by side';
  return 'they don’t look at each other';
}

// ---------------------------------------------------------------------------
// A format season's cast board
// ---------------------------------------------------------------------------

/**
 * How many go on the board, and how many are seen to fill it.
 *
 * Twelve is the plan's own figure — `content/making.ts` says "Choosing twelve
 * people" in the casting period's own words, and forty contributors are seen a
 * week — so neither number is invented here. They are read off the plan rather
 * than restated, except the twelve, which the plan states in prose and cannot be
 * read from, so it is declared once and the plan's sentence points at it.
 */
export const ON_THE_BOARD = 12;

/** Whether this plan casts a board rather than parts. */
export const castsContributors = (plan: Plan | undefined): boolean => plan?.cast === 'contributors';

/**
 * Whoever has been seen for the board, making the pool the first time somebody
 * looks.
 *
 * They are civilians, not performers, and that is the whole difference between
 * this and `whoCameIn`. A format does not audition actors; it finds people whose
 * lives are the program. So `careerTrack` is `civilian`, there is no acting
 * instrument on them worth reading, and the one thing about them that matters
 * commercially is the one thing a format is cast on: whether an audience will
 * like them and whether they will go off.
 */
export function boardSeen(sim: Simulation, project: Project): Person[] {
  const already: Person[] = [];
  for (const id of project.seenForBoard ?? []) {
    const person = sim.universe.people[id];
    if (person) already.push(person);
  }
  if (already.length > 0) return already;

  const plan = project.planId ? planById(project.planId) : undefined;
  const period = plan?.periods.find((one) => one.id === 'casting');
  // Four weeks of the casting period's own throughput, which is where the size of
  // the pool comes from rather than a number somebody liked.
  const wanted = Math.max(ON_THE_BOARD * 2, Math.round((period?.unit.aWeek ?? 40) * 4));
  const making = sim.rng('casting', 'board', project.id);
  const out: Person[] = [];
  for (let i = 0; i < wanted; i += 1) out.push(civilianNew(sim, () => making.next()));
  project.seenForBoard = out.map((one) => one.id);
  return out;
}

/** Somebody with a life rather than a career, which is who a format is made of. */
function civilianNew(sim: Simulation, next: () => number): Person {
  const person = performerNew(sim, Math.round(20 + next() * 30), next);
  person.careerTrack = 'civilian';
  person.background = 'Has never acted and isn’t trying to. Would be on television for the '
    + 'reason anybody ordinary is: a producer thought the country would want to watch them.';
  // What a format is cast on, and it is not the instrument. Appeal across the
  // whole range, because a cast board wants some people an audience will love and
  // some it will not, and controversy already present on a few of them, because
  // the person who goes off is the person the season is about.
  person.reputation.audienceAppeal = clamp(Math.round(10 + next() * 85), 1, 100);
  person.reputation.controversy = next() < 0.25 ? Math.round(next() * 40) : 0;
  person.reputation.publicFame = 0;
  person.reputation.industryDemand = 0;
  return person;
}

/** Why somebody cannot go on the board, or nothing if they can. */
export function whyNotOnTheBoard(sim: Simulation, projectId: Id, personId: Id): string | undefined {
  const project = sim.universe.projects[projectId];
  if (!project) return 'There’s no such picture.';
  if (!castsContributors(project.planId ? planById(project.planId) : undefined)) {
    return `${project.title} isn’t cast off a board. Its parts are written.`;
  }
  if (project.shelvedAt) return `${project.title} is shelved.`;
  const board = project.contributors ?? [];
  if (board.length >= ON_THE_BOARD) return `The board is full at ${ON_THE_BOARD}.`;
  if (board.some((one) => one.personId === personId)) return 'They’re already on it.';
  const person = sim.universe.people[personId];
  if (!person) return 'There’s no such person.';
  if (person.isPlayer) {
    // Said rather than silently refused, because a player who tries this is asking
    // a reasonable question and deserves the actual answer.
    return 'You’re an actor. A format casts people to be themselves — a different job '
      + 'from the one this career is.';
  }
  if (!(project.seenForBoard ?? []).includes(personId)) {
    return 'Nobody has seen them for this. The casting period is how the board gets filled.';
  }
  // Once the field starts, the board is what it is. The episodes are made of what
  // happened to the people who were there.
  // Read straight off the project's own periods rather than through
  // `windowOf`, which lives in `world/making.ts` — the module that imports this
  // one.
  const field = project.periods?.find((one) => one.id === 'field');
  if (field && sim.now >= field.from) {
    return 'The field has started. The season is made of whoever was on the board when it did.';
  }
  return undefined;
}

/** Puts somebody on a format season's cast board. */
export function putOnTheBoard(
  sim: Simulation, projectId: Id, personId: Id,
): { ok: boolean; error?: string; onIt?: number } {
  const no = whyNotOnTheBoard(sim, projectId, personId);
  if (no) return { ok: false, error: no };
  const project = sim.universe.projects[projectId]!;
  project.contributors = [...(project.contributors ?? []), { personId, chosenAt: sim.now }];
  const person = sim.universe.people[personId]!;
  const onIt = project.contributors.length;
  sim.notify({
    category: 'business',
    title: `${project.title}: ${person.displayName || person.firstName} Is On The Board`,
    body: onIt >= ON_THE_BOARD
      ? `That’s the board full at ${ON_THE_BOARD}, and the field will fix it there: the episodes `
        + 'are made of what happens to the people who are on it.'
      : `${onIt} of ${ON_THE_BOARD}, at no cost on top — the casting period already spends its `
        + 'share of the budget on filling the board.',
    importance: 35,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, onIt };
}
