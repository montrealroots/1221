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
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Person } from '../domain/model';
import type { Project, Role, Seat } from '../domain/company';
import type { AttributeSheet } from '../domain/attributes';
import { rate, sheetOf } from '../domain/attributes';
import { emptySkillSheet } from '../domain/skills';
import { freshWellbeing } from '../systems/life';
import { impliedPerformerTitle } from '../core/performer';
import { clamp } from '../core/rng';
import { MEN, WOMEN, patronymic } from '../content/names';
import {
  AXES, CAST_SHARE, HAGGLE, QUOTE_LIFE, SIZES, axisById, passById, sizeById,
  takesAt, type AxisId, type PassId, type Size,
} from '../content/casting';
import type { Plan } from '../content/making';
import { MS_WEEK } from './lot';

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
    roles.push({
      id: sim.nextId('role'),
      ordinal,
      name: nameTheRole(one.size, ordinal),
      size: one.size.id,
      ...(one.partId ? { partId: one.partId } : {}),
      bandCents: weight > 0 ? Math.round((pot * one.size.weight) / weight) : 0,
    });
  }
  return roles;
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
  const shoot = project.periods?.find((p) => p.id === 'shooting')
    ?? project.periods?.find((p) => p.id === 'field');
  if (!shoot) return undefined;
  const opens = shoot.from - MS_WEEK;
  if (!role.partId) return { from: opens, to: shoot.to };
  const parts = project.parts ?? [];
  const at = parts.findIndex((p) => p.id === role.partId);
  if (at < 0 || parts.length <= 1) return { from: opens, to: shoot.to };
  const span = (shoot.to - shoot.from) / parts.length;
  return { from: shoot.from + Math.round(span * at) - MS_WEEK, to: shoot.from + Math.round(span * (at + 1)) };
}

/** Whether somebody is already engaged somewhere across a span. */
export function freeToWork(sim: Simulation, personId: Id, from: Instant, to: Instant): boolean {
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
 * the actor the camera loves who cannot hit the same mark twice, and the
 * technician nobody wants to look at.
 */
export function sheetFor(standing: number, next: () => number): AttributeSheet {
  const base = clamp(Math.round(standing * 0.7 + 8), 1, 100);
  const of: Record<string, number> = {};
  for (const axis of AXES) {
    const centre = clamp(standing + (next() - 0.5) * 46, 1, 100);
    for (const id of axis.of) of[id] = clamp(Math.round(centre + (next() - 0.5) * 14), 1, 100);
  }
  return sheetOf(base, of);
}

/** Somebody who acts, made because a part needed them. */
export function performerNew(sim: Simulation, standing: number, next: () => number): Person {
  const player = sim.universe.people[sim.universe.playerId]!;
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
    homeRegionId: player.homeRegionId,
    citizenshipId: player.citizenshipId,
    currentLocationId: player.currentLocationId,
    personality: {
      openness: dial(), conscientiousness: dial(), extraversion: dial(),
      agreeableness: dial(), emotionalStability: dial(), ambition: dial(),
      riskTolerance: dial(),
    },
    interests: [],
    goals: [],
    lifestyle: 'modest',
    background: 'Acts. Has done since before anybody was paying for it.',
    attributes: sheetFor(standing, next),
    traits: [],
    skills: emptySkillSheet(),
    wellbeing: freshWellbeing(),
    reputation: {
      // Known to the public only as far as the work has carried them, which at
      // this end of the business is barely at all.
      publicFame: clamp(Math.round(standing * 0.4 - 8 + next() * 12), 0, 100),
      audienceAppeal: clamp(Math.round(40 + next() * 30), 1, 100),
      professionalReputation: clamp(Math.round(standing), 1, 100),
      reliability: clamp(Math.round(standing * 0.6 + 30), 1, 100),
      prestige: clamp(Math.round(standing * 0.3 - 6 + next() * 10), 0, 100),
      industryDemand: clamp(Math.round(standing * 0.5 + next() * 20), 0, 100),
      controversy: 0,
    },
    careerTrack: 'actor',
    creditScore: 600,
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
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
    out.push(performerNew(sim, standing, () => making.next()));
  }
  role.seen = out.map((person) => person.id);
  role.outAt = sim.now;
  return out;
}

/** Who came in, for anybody drawing a screen. Never makes anybody. */
export function whoCameIn(sim: Simulation, role: Role): Person[] {
  const out: Person[] = [];
  for (const id of role.seen ?? []) {
    const person = sim.universe.people[id];
    if (person) out.push(person);
  }
  return out;
}

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
 * working actor cannot say yes however good the offer is and no amount of
 * money moves a shooting schedule somebody else already owns. Then price,
 * against their own quote rather than against the band, because the band is the
 * producer's problem. Then the part, because an actor in demand turns down
 * small ones and an actor who is not takes whatever comes. Then the draw, which
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
  // over the ask buys some of that down and never all of it.
  const over = offer.askCents > 0 ? offer.feeCents / offer.askCents : 1;
  const keen = clamp(0.52 + (over - 1) * 0.45 + (45 - beneath) * 0.004, 0.2, 0.96);
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
  read: Read;
  /** Share of the picture's screen time this part is, before normalising. */
  share: number;
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
  const weight = inIt.reduce((n, one) => n + one.share, 0);
  if (weight <= 0) return undefined;
  return inIt.reduce((n, one) => n + one.read[axis] * one.share, 0) / weight;
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
  if (!role) return { ok: false, error: 'There’s no such part in it.' };
  if (seatFor(project, role.id)) {
    return { ok: false, error: `${role.name} is cast. Let them go first, and the fee stays owed.` };
  }
  const person = sim.universe.people[casting.personId];
  if (!person) return { ok: false, error: 'There’s nobody by that name.' };

  // The shoot is the one thing an offer cannot be made behind. Everything else
  // about casting late is expensive; this is impossible, because the scenes
  // were shot with somebody else in them.
  const when = datesFor(project, role);
  if (when && sim.now > when.to) {
    return { ok: false, error: `${role.name} has already been shot. Whoever played it, played it.` };
  }

  const fee = Math.round(casting.feeCents);
  if (!Number.isFinite(fee) || fee < 0) return { ok: false, error: 'That isn’t an amount.' };

  const offer = offerOf(sim, project, role, person, fee);
  const roll = sim.rng('casting', 'offer', project.id, role.id, person.id).next();
  const answer = decideOffer(offer, roll);

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
  // The number goes on their record whatever it was, which is the whole of why
  // a producer thinks twice before buying somebody cheap: it is not this
  // picture the cheap number costs them, it is the next three.
  writeTheQuote(person, project.id, role.size, fee, sim.now);
  person.careerTrack = 'actor';

  sim.notify({
    category: 'business',
    title: `${person.displayName} Is ${role.name}`,
    body: `${money(fee)} on ${project.title}${when ? `, from ${new Date(when.from).getUTCFullYear()}` : ''}.`
      + ` ${sayTheRead(readOf(person))}`,
    importance: 55,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, answer };
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
    body: `${money(seat.feeCents)} was agreed and it is still owed. Paid, used and credited are three different things,`
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

const money = (cents: Money): string => `€${Math.round(cents / 100).toLocaleString('en-US')}`;

export function registerCasting(sim: Simulation): void {
  registerTheOffice(sim);

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
  const shoot = project.periods?.find((p) => p.id === 'shooting')
    ?? project.periods?.find((p) => p.id === 'field');
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
        const when = datesFor(project, role);
        return !when || freeToWork(sim, person.id, when.from, when.to);
      });
    if (seen.length === 0) continue;
    const best = seen.reduce((top, person) => {
      const one = readOf(person);
      const other = readOf(top);
      return one.truth + one.reads + one.repeatable > other.truth + other.reads + other.repeatable
        ? person : top;
    }, seen[0]!);
    if (!project.cast) project.cast = [];
    project.cast.push({ roleId: role.id, personId: best.id, feeCents: role.bandCents, castAt: sim.now });
    writeTheQuote(best, project.id, role.size, role.bandCents, sim.now);
    best.careerTrack = 'actor';
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
