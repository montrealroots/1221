/**
 * SLATE — the trade, and who in it is free.
 *
 * `content/people.ts` says what is true about somebody. This draws them, works out
 * where they are in a working life, and answers the only question that makes a pool a
 * market rather than a price list: **who can you actually get.**
 *
 * ## Drawn, not stored, which is a decision
 *
 * The trade is a deterministic draw off the save's own seed, exactly the way
 * `world/material.ts` draws the market. What is stored is the **engagement** — the
 * fact that this studio hired this person for these months — and nothing else.
 *
 * The alternative was to mint every one of them into `universe.people` as a full
 * `Person`, which is what "one pool" sounded like it asked for. It was refused for
 * two reasons and both are practical. A `Person` carries a portrait, a personality, a
 * household, two citizenships and a wellbeing record, and `systems/life.ts` walks
 * every one of them every day — so a few hundred crew would be a few hundred people
 * having feelings about a job nobody has offered them. And the Monte Carlo invariants
 * are measured over that walk, so the cost would land on the very thing this project
 * uses to know whether it is still correct.
 *
 * Nothing is lost by drawing them. The pool is finite, it is the same pool for
 * everybody who reads it, and it answers the same way every time it is asked. The day
 * a rival studio has to hold somebody visibly, it reads this and stores an engagement
 * of its own.
 *
 * ## Age is not decoration here
 *
 * A person's standing is **computed at the moment of asking**, from how far they were
 * ever going to get and how old they are that day. So a career has a shape without
 * anything having to tick: somebody too young to run a department grows into it, is at
 * their best from forty through fifty-six, declines slowly after, and leaves the trade
 * at sixty-eight. Ask the same question ten years later and you get a different
 * answer, which is the falsifiability test for the whole idea of ageing.
 *
 * Both ends of that curve were measured rather than reasoned. With the peak at a
 * single age and reach drawn flat, the trade held **nobody** at the top rung and
 * eleven people at the one below it across all six disciplines — a ladder whose top
 * two rungs no studio could hire. Widening the peak to a stretch and bending the
 * reach draw toward the top puts eleven, twenty-six, thirty-three, thirty and seven
 * people on the five rungs, which is a trade with a top rather than only a middle.
 */

import type { Simulation } from '../core/simulation';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { MS_DAY, zonedParts } from '../core/time';
import type { Engagement } from '../domain/company';
import { MEN, WOMEN, patronymic } from '../content/names';
import {
  HOW_MANY_OFFERED, RETIRES_AT, STARTS_AT, reachFrom,
  type Temperament, signsFor, standingFor, temperamentFrom, wantsPayOrPlay, worksAboveFor,
} from '../content/people';

/**
 * How many the trade holds in each discipline, across every age at once.
 *
 * Wide enough that a run of retirements does not empty a department, narrow enough
 * that the same names keep coming back — which is what makes a pool feel like a town
 * rather than a generator. Only four are ever offered at a time, so most of this is
 * depth rather than choice.
 */
export const TRADE_HOLDS = 20;

/** The widest a cohort's ages are spread, either side of the middle of a career. */
export const AGES_SPREAD = 26;

/** One person the trade could offer. A draw, not a record. */
export interface Hand {
  /** Stable for the life of the save, and carries the discipline it was drawn for. */
  id: string;
  name: string;
  /** Which department they run, which is the only taxonomy of work there is. */
  discipline: string;
  /** How far they were ever going to get, before age is taken into account. */
  reach: number;
  /**
   * Their own draw for what they insist on, held rather than resolved.
   *
   * The terms it decides — the least a picture can cost before they will take it,
   * and whether they sign pay-or-play — both read their standing, and standing moves
   * with age. Resolving them at the draw would freeze a twenty-six-year-old’s terms
   * onto the head of department they become.
   */
  asks: number;
  bornAt: Instant;
  temperament: Temperament;
}

export type { Engagement } from '../domain/company';

/** How old somebody is, in whole years, on a given day. */
export function ageOn(bornAt: Instant, at: Instant, zone: string): number {
  const born = zonedParts(bornAt, zone);
  const now = zonedParts(at, zone);
  const years = now.year - born.year;
  const hadBirthday = now.month > born.month
    || (now.month === born.month && now.day >= born.day);
  return Math.max(0, hadBirthday ? years : years - 1);
}

/** A name in the Icelandic pattern, from three draws. */
function nameFrom(a: number, b: number, c: number): string {
  const father = MEN[Math.floor(a * MEN.length) % MEN.length]!;
  const takesDottir = b < 0.5;
  const given = takesDottir
    ? WOMEN[Math.floor(c * WOMEN.length) % WOMEN.length]!
    : MEN[Math.floor(c * MEN.length) % MEN.length]!.name;
  return `${given} ${patronymic(father, takesDottir ? 'dóttir' : 'son')}`;
}

/**
 * Everybody in one discipline, at every age, for the whole life of the save.
 *
 * Drawn once off a key that names only the discipline, so the trade does not change
 * when the month does. Ages are spread around the middle of a working life rather
 * than around the save's start date, which is what gives the pool people retiring out
 * of it and people growing into it without anything having to be scheduled.
 */
export function theTrade(sim: Simulation, discipline: string): readonly Hand[] {
  const rng = sim.rng('people', discipline);
  const middle = (STARTS_AT + RETIRES_AT) / 2;
  const out: Hand[] = [];
  for (let i = 0; i < TRADE_HOLDS; i += 1) {
    const age = middle + (rng.next() * 2 - 1) * AGES_SPREAD;
    out.push({
      id: `${discipline}:${i}`,
      name: nameFrom(rng.next(), rng.next(), rng.next()),
      discipline,
      reach: reachFrom(rng.next()),
      asks: rng.next(),
      bornAt: sim.universe.meta.createdAt - Math.round(age * 365.2425 * MS_DAY),
      temperament: temperamentFrom(rng.next()),
    });
  }
  return out;
}

/** Whether somebody is of an age to be running a department at all. */
export function working(hand: Hand, at: Instant, zone: string): boolean {
  const age = ageOn(hand.bornAt, at, zone);
  return age >= STARTS_AT && age < RETIRES_AT;
}

/**
 * What rung they stand at today.
 *
 * Not stored anywhere, because it is not a fact about them — it is a fact about them
 * *and the date*, and the day it gets written down is the day it stops moving.
 */
export const standingOn = (hand: Hand, at: Instant, zone: string): number =>
  standingFor(hand.reach, ageOn(hand.bornAt, at, zone));

/** What they ask to sign today. */
export const asksToSign = (hand: Hand, at: Instant, zone: string): Money =>
  signsFor(standingOn(hand, at, zone));

/**
 * The least a picture can cost before they will take it, today.
 *
 * Reads their standing, so it climbs as a career does and falls again at the end of
 * one: somebody who would not look at a small picture at fifty will look at it at
 * sixty-five, which is a thing about this trade worth having in the model.
 */
export const worksAboveOn = (hand: Hand, at: Instant, zone: string): Money =>
  worksAboveFor(standingOn(hand, at, zone), hand.asks);

/** Whether they sign pay-or-play, today. */
export const signsPayOrPlay = (hand: Hand, at: Instant, zone: string): boolean =>
  wantsPayOrPlay(standingOn(hand, at, zone), hand.asks);

/** One person by id, whichever discipline they belong to. */
export function handById(sim: Simulation, id: string): Hand | undefined {
  const discipline = id.split(':')[0];
  if (!discipline) return undefined;
  return theTrade(sim, discipline).find((one) => one.id === id);
}

/**
 * Whether somebody can be had for these months.
 *
 * The engagements are handed in rather than looked up, which is what keeps this file
 * from having to know that projects exist. Where they come from is a question for
 * `world/company.ts`, which owns the projects that hold them; what a clash *is* is a
 * question about people, and belongs here.
 *
 * Two engagements that touch at the edges do not clash. A department that wraps in
 * March and one that starts in March are somebody finishing one job and beginning
 * another, which is how the trade actually works.
 */
export function freeBetween(
  engagements: readonly Engagement[], handId: string, from: Instant, to: Instant,
): boolean {
  for (const one of engagements) {
    if (one.handId !== handId) continue;
    if (from < one.to && to > one.from) return false;
  }
  return true;
}

/** How long they are booked out for, so a refusal can say something useful. */
export function heldUntil(
  engagements: readonly Engagement[], handId: string,
): Instant | undefined {
  let latest: Instant | undefined;
  for (const one of engagements) {
    if (one.handId !== handId) continue;
    if (latest === undefined || one.to > latest) latest = one.to;
  }
  return latest;
}

/**
 * Somebody free at a particular rung, with as little character as possible.
 *
 * This is what an instrument wants and it is deliberately not what a player gets. To
 * measure what a rung is worth, `tools/slate.mjs` puts the same property through five
 * times changing only the rung — and if each rung also arrived with whatever
 * temperament happened to be attached, the comparison would be measuring the
 * temperament. So this prefers `steady`, which is the absence of a story, and falls
 * back to whoever is free if the trade has nobody plain at that rung.
 *
 * Nearest rung rather than exact, because the pool is finite and a demand for a
 * standing-five effects supervisor in a month when both of them are working should
 * get the best available answer rather than nothing at all.
 */
export function somebodyAt(
  sim: Simulation,
  engagements: readonly Engagement[],
  discipline: string,
  standing: number,
  from: Instant,
  to: Instant,
): Hand | undefined {
  const zone = sim.homeZone;
  const free = theTrade(sim, discipline)
    .filter((one) => working(one, from, zone) && freeBetween(engagements, one.id, from, to));
  if (free.length === 0) return undefined;
  return free.reduce((best, one) => {
    const score = (hand: Hand) => Math.abs(standingOn(hand, from, zone) - standing) * 10
      + (hand.temperament.id === 'steady' ? 0 : 1);
    return score(one) < score(best) ? one : best;
  });
}

/**
 * The shortlist for one department, for the months it would be working.
 *
 * Of working age, not already booked across those months, and **spread across what is
 * available** rather than skimmed off the top.
 *
 * The first version sorted by standing and took the best four, which looked sensible
 * and quietly removed the decision: the trade holds more good heads than great ones,
 * so every department offered four people at the top rung and the cheap option was
 * never on the screen at all. A shortlist that only ever shows the expensive answer is
 * not a choice, it is a price tag.
 *
 * So it is still ordered best first — the dear answer should be the obvious one, and
 * passing it over should feel like passing it over — but the four are taken at even
 * steps down the list, which puts somebody near the top, somebody near the bottom and
 * two in between. Four, because a list you search is not a list you choose from.
 */
export function offered(
  sim: Simulation,
  engagements: readonly Engagement[],
  discipline: string,
  from: Instant,
  to: Instant,
): readonly Hand[] {
  const zone = sim.homeZone;
  const free = theTrade(sim, discipline)
    .filter((one) => working(one, from, zone) && freeBetween(engagements, one.id, from, to))
    .sort((a, b) => standingOn(b, from, zone) - standingOn(a, from, zone)
      || a.id.localeCompare(b.id));
  if (free.length <= HOW_MANY_OFFERED) return free;

  const out: Hand[] = [];
  for (let i = 0; i < HOW_MANY_OFFERED; i += 1) {
    // Even steps from the top of the list to the bottom of it, ends included.
    const at = Math.round((i * (free.length - 1)) / (HOW_MANY_OFFERED - 1));
    const one = free[at]!;
    if (!out.includes(one)) out.push(one);
  }
  return out;
}
