/**
 * SLATE — what is out there to be optioned, and what it asks for.
 *
 * Until now a company acquired material by the player typing a title. That is a fine
 * way to start something you thought of, and it is the whole of what existed, which
 * meant material was never **scarce**. Nothing could be taken before you got to it,
 * nothing expired, and a property cost whatever the default fee said.
 *
 * So there is a market now, and the market is a pool the player options *from*. The
 * typed title stays — an original idea is a real way to begin and the tutorial teaches
 * it — and sits beside a list of things somebody else wrote.
 *
 * ## Drawn rather than stored, and why that is not laziness
 *
 * The pool is a function of the save's seed and the month. It is never written to the
 * save. That follows the same reasoning `world/field.ts` gave for the release calendar
 * before it was deleted: a stored table has to be migrated, has to be extended when a
 * save outlives it, and is a second place the truth lives. A function of the seed and
 * the date has none of those problems and cannot drift.
 *
 * It also makes the pool **knowable**. The same month always offers the same things,
 * so a player can look, think, and come back — which is what turns "option it now or
 * lose it" into a decision rather than a reflex.
 *
 * ## The demands, which arrived with the engine that reads them
 *
 * A property says what making it will ask for. Those three ratings were written out of
 * this file when it was first built, deliberately, because the departments that read
 * them did not exist yet and a declared word nothing reads is the defect this project
 * fails its own gate on. `content/departments.ts` consumes them now, so they are here.
 */

import type { Money } from '../core/money';
import type { Provenance } from '../domain/company';

/**
 * How many properties are on the market in a given month.
 *
 * Few. A market with twenty rows is a spreadsheet to optimize; three or four is a
 * decision about whether any of them is worth the money. The lower bound is zero on
 * purpose — a month with nothing in it is what makes the months that have something
 * worth reading.
 */
export const MOST_ON_THE_MARKET = 4;

/**
 * How long a property sits before somebody else takes it.
 *
 * Counted in months. Short enough that waiting costs something, long enough that a
 * player who wants to think about it can. Because the pool is drawn per month rather
 * than stored, this is expressed as the chance a listing carries over rather than as
 * a countdown on a record.
 */
export const CARRIES_OVER = 0.45;

/**
 * What each kind of source is worth, as a multiple of the base asking price.
 *
 * `Provenance` has carried six values since it was written. These are the first thing
 * to price them differently: a novel with an audience already attached costs more than
 * somebody's original screenplay, and life rights cost most of all because the person
 * has to agree.
 */
export const COSTS_LIKE: Readonly<Record<Provenance, number>> = {
  original: 0.55,
  article: 0.8,
  play: 1.0,
  novel: 1.6,
  format: 1.3,
  life_rights: 2.1,
};

/**
 * How often each kind turns up.
 *
 * Originals are common because anybody can write one; life rights are rare because
 * somebody has to have lived something worth buying. Weights rather than probabilities
 * so a seventh kind can be added without restating the other six.
 */
export const TURNS_UP: Readonly<Record<Provenance, number>> = {
  original: 34,
  article: 18,
  play: 12,
  novel: 22,
  format: 10,
  life_rights: 4,
};

/** Every provenance, in a fixed order, so a draw against it is reproducible. */
export const PROVENANCES: readonly Provenance[] = [
  'original', 'article', 'play', 'novel', 'format', 'life_rights',
];

/**
 * The middle of what a property asks, before its kind is taken into account.
 *
 * Set against `DEFAULT_OPTION_FEE` in `world/company.ts`, which is what a typed title
 * costs. Material somebody else wrote is dearer than material you thought of yourself,
 * which is the point: the pool is a convenience you pay for.
 */
export const ASKS_AROUND: Money = 14_000_00;

/**
 * How far a property's appeal strays either side of ordinary.
 *
 * Two stories the same size do not reach the same audience, and until this existed
 * they did: reach was a pure function of the three demands, so every property with the
 * same shape was the same property. `tools/career.mjs` caught it in the plainest
 * way — a policy that costed every team against the material chose the same team every
 * single time, because there was nothing about the material left to read. Variety that
 * only shows up in hindsight, once the draw has landed, is not a decision.
 *
 * At 0.45 a property carries between about a half and about half again of what its
 * shape alone would suggest, which is enough that the team worth hiring genuinely
 * differs from one to the next.
 */
export const APPEAL_STRAYS = 0.45;

/** How far an asking price strays either side of the middle. */
export const ASKING_STRAYS = 0.6;

/**
 * What making a property will ask for, on a scale of one to five.
 *
 * Three, not seven. Each one has to be read by at least two departments in different
 * phases or it is a label, and three that bite are worth more than seven that tint a
 * screen. What they are is chosen so that no two move together:
 *
 * - **scope** is how much picture there is — how many days, how many people, how long
 *   the cut takes. It reaches every phase, because size is not a department.
 * - **spectacle** is how much of it cannot be photographed as found. It reaches the
 *   effects unit on the floor and the finishing that follows, and nothing else.
 * - **period** is how much of the world has to be built rather than borrowed. It
 *   reaches design in prep and the unit on the floor, and stops at the cut.
 *
 * A picture can be large and plain, small and impossible, or modern and enormous, and
 * the three vectors say which without any of them standing in for another.
 */
export interface Demands {
  scope: number;
  spectacle: number;
  period: number;
}

/** The most any one demand can ask for. */
export const MOST_DEMANDED = 5;

/**
 * What a kind of source tends to ask for.
 *
 * Leanings rather than rules — the draw moves around them — but they are not
 * arbitrary. A novel carries more world than an article does; a play is built for a
 * room and asks for the least of everything; a format is a machine for making
 * episodes and is deliberately modest so it can be repeated.
 */
export const LEANS: Readonly<Record<Provenance, Demands>> = {
  original: { scope: 3, spectacle: 3, period: 2 },
  article: { scope: 2, spectacle: 1, period: 2 },
  play: { scope: 1, spectacle: 1, period: 2 },
  novel: { scope: 4, spectacle: 3, period: 4 },
  format: { scope: 2, spectacle: 2, period: 1 },
  life_rights: { scope: 3, spectacle: 1, period: 4 },
};

/** One demand, drawn around what its kind leans toward and clamped to the scale. */
const askedFor = (leaning: number, t: number): number =>
  Math.max(1, Math.min(MOST_DEMANDED, Math.round(leaning + (t * 2 - 1) * 1.4)));

/** What a property of this kind asks for, given three draws. */
export function demandsFor(provenance: Provenance, a: number, b: number, c: number): Demands {
  const leans = LEANS[provenance];
  return {
    scope: askedFor(leans.scope, a),
    spectacle: askedFor(leans.spectacle, b),
    period: askedFor(leans.period, c),
  };
}

/**
 * Words a property is called, in two halves.
 *
 * Generated rather than listed, because a fixed set of forty repeats inside two played
 * years, and because a title carries no mechanics — nothing reads these strings but the
 * screen. They lean the way the rest of SLATE's world leans, which is north.
 */
export const TITLE_FIRST: readonly string[] = [
  'The Quiet', 'Low', 'Northern', 'The Last', 'Falling', 'The Sixth', 'Hollow',
  'Bright', 'The Narrow', 'Winter', 'The Second', 'Salt', 'The Longest', 'Iron',
  'The Other', 'Small', 'The Burning', 'Nine', 'The Empty', 'Slow', 'Cold',
  'The Standing', 'Gray', 'The Far',
];

export const TITLE_SECOND: readonly string[] = [
  'Harbor', 'Country', 'Season', 'Hours', 'Light', 'Winter', 'House', 'Road',
  'Water', 'Summer', 'Window', 'Crossing', 'Ground', 'Weather', 'Mornings',
  'Coast', 'Bell', 'Field', 'Passage', 'Dark', 'Shore', 'Valley', 'Ice', 'Mouth',
];

/** A title from two draws, which is enough spread that a played decade rarely repeats. */
export const titleFrom = (a: number, b: number): string =>
  `${TITLE_FIRST[a % TITLE_FIRST.length]} ${TITLE_SECOND[b % TITLE_SECOND.length]}`;

/**
 * Which kind a draw lands on, weighted by `TURNS_UP`.
 *
 * Takes a number in [0,1) so the caller owns the stream and this stays pure — which is
 * what lets the decider sweep it without a simulation.
 */
export function provenanceFrom(t: number): Provenance {
  const total = PROVENANCES.reduce((sum, p) => sum + TURNS_UP[p], 0);
  let at = Math.max(0, Math.min(0.999999, t)) * total;
  for (const p of PROVENANCES) {
    at -= TURNS_UP[p];
    if (at < 0) return p;
  }
  return PROVENANCES[PROVENANCES.length - 1]!;
}

/** What a property of this kind asks, given a draw for where in the spread it sits. */
export function asksFor(provenance: Provenance, t: number, appeal = 1): Money {
  const spread = 1 + (Math.max(0, Math.min(1, t)) * 2 - 1) * ASKING_STRAYS;
  const worth = Math.max(0, appeal);
  return Math.max(1_000_00, Math.round(ASKS_AROUND * COSTS_LIKE[provenance] * spread * worth));
}

/**
 * How far a property carries beyond what its shape alone would suggest.
 *
 * One is ordinary. Everything a studio does afterwards is a share of this, so it is
 * the single most valuable thing to know about a property before taking it — and the
 * asking price reads it too, which is what stops good material being free.
 */
export const appealFrom = (t: number): number =>
  1 + (Math.max(0, Math.min(1, t)) * 2 - 1) * APPEAL_STRAYS;
