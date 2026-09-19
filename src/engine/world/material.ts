/**
 * SLATE — the material market, so that a property can be taken before you get to it.
 *
 * `company.option` has always accepted a title the player typed. That stays: an
 * original idea is a real way to begin. What it never had was anything to option
 * *from*, so material was infinitely available, never contested, and always cost the
 * same default fee. Nothing could be missed.
 *
 * This is the pool. It is drawn from the save's seed and the month rather than stored,
 * for the reasons `content/material.ts` sets out, and it has two properties that make
 * it a market rather than a catalog:
 *
 * **It is stable inside a month.** Ask twice in March and March answers the same
 * thing, so a player can look, think and come back.
 *
 * **It churns between months.** Most of what is listed is gone next month and
 * something else is there instead. A minority carries over, so a property can be
 * thought about for a while — and the ones that carry are not announced, so waiting
 * is a gamble rather than a schedule.
 *
 * ## What "taken" means when nothing is stored
 *
 * A drawn pool cannot have a row deleted from it. It does not need one: the company's
 * own holdings are the record. A listing whose title the company already holds is
 * filtered out, so optioning something removes it from the market by the only means
 * that cannot desynchronise — the thing that proves it was taken is the holding
 * itself.
 */

import type { Simulation } from '../core/simulation';
import type { Money } from '../core/money';
import type { Provenance } from '../domain/company';
import { zonedParts } from '../core/time';
import {
  CARRIES_OVER, MOST_ON_THE_MARKET, asksFor, provenanceFrom, titleFrom,
} from '../content/material';
import { holdingsOf } from './company';

/** One property, as the market offers it. */
export interface Listing {
  /** Stable for as long as the listing is offered, and carries the month it was drawn in. */
  id: string;
  title: string;
  provenance: Provenance;
  /** What the rights holder is asking. */
  asksCents: Money;
  /** Whether this is a fresh listing or one that has been sitting. */
  carriedOver: boolean;
}

/** The month a draw is keyed against, as `year-month`. */
export const monthKey = (at: number, zone: string): string => {
  const parts = zonedParts(at, zone);
  return `${parts.year}-${parts.month}`;
};

/** The month before the one an instant falls in, as the same key. */
const previousKey = (at: number, zone: string): string => {
  const parts = zonedParts(at, zone);
  const year = parts.month === 1 ? parts.year - 1 : parts.year;
  const month = parts.month === 1 ? 12 : parts.month - 1;
  return `${year}-${month}`;
};

/**
 * What one month puts on the market, before carry-over and before anything is taken.
 *
 * Pure in everything but the simulation's own seed, so the same month always answers
 * the same way. Kept separate from `onTheMarket` because carry-over has to ask this
 * about the previous month without recursing into carry-over again — a listing that
 * carried over once does not carry forever, and one month of memory is all this needs.
 */
export function drawnIn(sim: Simulation, key: string): readonly Listing[] {
  const rng = sim.rng('material', key);
  const many = Math.floor(rng.next() * (MOST_ON_THE_MARKET + 1));
  const out: Listing[] = [];
  for (let i = 0; i < many; i += 1) {
    const provenance = provenanceFrom(rng.next());
    out.push({
      id: `${key}:${i}`,
      title: titleFrom(Math.floor(rng.next() * 997), Math.floor(rng.next() * 997)),
      provenance,
      asksCents: asksFor(provenance, rng.next()),
      carriedOver: false,
    });
  }
  return out;
}

/**
 * Everything on the market in the month an instant falls in.
 *
 * This month's fresh listings, plus whichever of last month's rolled to stay. Anything
 * the company already holds is dropped, because the holding is the proof it was taken.
 */
export function onTheMarket(sim: Simulation, at: number = sim.now): readonly Listing[] {
  const key = monthKey(at, sim.homeZone);
  const fresh = drawnIn(sim, key);

  // Last month's, asked once and only once. The roll is keyed to the listing rather
  // than to the month so that two properties listed together do not vanish together.
  const held = new Set(holdingsOf(sim.universe).map((one) => one.title.toLowerCase()));
  const carried: Listing[] = [];
  for (const one of drawnIn(sim, previousKey(at, sim.homeZone))) {
    const rng = sim.rng('material', key, 'carry', one.id);
    if (rng.next() < CARRIES_OVER) carried.push({ ...one, carriedOver: true });
  }

  return [...carried, ...fresh].filter((one) => !held.has(one.title.toLowerCase()));
}

/**
 * One listing by its id, whatever month it is now.
 *
 * The id carries the month it was drawn in, which is what lets a command name a
 * property without the world keeping a table of them. A listing that is no longer
 * offered — taken, or churned away — answers undefined, and the caller refuses.
 */
export function listingById(sim: Simulation, id: string, at: number = sim.now): Listing | undefined {
  return onTheMarket(sim, at).find((one) => one.id === id);
}
