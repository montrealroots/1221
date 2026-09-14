/**
 * SLATE — how a finished picture is sold, and who the money reaches.
 *
 * A delivered picture is an asset nobody has bought yet. Between finishing it
 * and seeing a euro there is a buyer, a release pattern made of windows, and a
 * waterfall deciding how much of anything reaches the people who paid for the
 * thing. Most of the drama in film financing lives in the last of those, and
 * almost no game models it at all.
 *
 * ## The fact this file exists to make true
 *
 * A picture can take in three times what it cost and return nothing to the
 * people who financed it. That is not a trick and it is not fraud. It is what
 * an ordered recoupment does: a fee comes off the top of every euro, the money
 * spent selling the picture is repaid before the money spent making it, and
 * the negative cost sits at the back of the queue earning interest while it
 * waits. Every term below is a lever on that, and the test suite holds each of
 * them to changing who gets paid what.
 *
 * ## The windows are recent, and that matters
 *
 * The shares are SLATE's own, because they have to be: a horror picture takes
 * most of its money in three weekends and a prestige drama earns for a decade,
 * and one table cannot be both. The *shape* is not ours. The theatrical hold
 * used to run ninety days and now runs seventeen for most pictures — Universal
 * and AMC agreed that in 2020 and the rest of the business followed. A game
 * still modeling a ninety-day hold is modeling 2019.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// The waterfall's tiers
// ---------------------------------------------------------------------------

export type TierId = 'fee' | 'marketing' | 'negative' | 'net';

export interface Tier {
  id: TierId;
  /** Title Case, for a screen. */
  label: string;
  /** What it takes, and why it sits where it sits. */
  what: string;
}

/**
 * The queue, in the order it is paid.
 *
 * Order is the whole of it. Move the negative cost above the marketing spend
 * and a picture that loses money starts returning a profit, which is the
 * arithmetic of a different industry.
 */
export const TIERS: readonly Tier[] = [
  {
    id: 'fee',
    label: 'The Distributor’s Fee',
    what: 'A share of every euro that comes in, taken before anything is recouped by anybody.',
  },
  {
    id: 'marketing',
    label: 'What Was Spent Selling It',
    what: 'The prints and advertising, repaid in full ahead of the money that made the picture. It’s the tier people forget, and it’s usually the one that sinks them.',
  },
  {
    id: 'negative',
    label: 'The Money That Made It',
    what: 'The negative cost, with interest on whatever part of it is still outstanding. Third in the queue, which is why a picture can gross twice its budget and still owe for it.',
  },
  {
    id: 'net',
    label: 'What Is Left',
    what: 'Net proceeds, split on whatever terms were signed. Most pictures never reach this tier at all.',
  },
];

export const tierById = (id: string): Tier | undefined => TIERS.find((t) => t.id === id);

// ---------------------------------------------------------------------------
// The deals
// ---------------------------------------------------------------------------

export interface Deal {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What kind of arrangement it is. */
  what: string;
  /** How it feels to sign, said to whoever is deciding. */
  said: string;
  /** The distributor's share of every receipt, off the top. */
  fee: number;
  /** What gets spent selling it, as a share of the negative cost, recouped ahead of the negative. */
  spendsOnSelling: number;
  /** Paid at signature, as a multiple of the negative cost. */
  upFront: number;
  /**
   * How much of the picture's ten-year take actually flows back through the
   * windows. Zero is a buyout: the check at signature is the end of it.
   */
  reach: number;
  /** The share of anything surviving the waterfall that the company keeps. */
  keepsNet: number;
}

/**
 * What is on the table.
 *
 * Three shapes, chosen because they fail differently rather than because they
 * are the three biggest. A studio release is the most money and the least of
 * it kept. A streamer buyout is certainty bought with upside. A sales agent is
 * the middle road, and the one a company this size actually gets offered.
 */
export const DEALS: readonly Deal[] = [
  {
    id: 'studio',
    label: 'A Studio Release',
    what: 'A wide release across every window, paid for and marketed by somebody else.',
    said: 'The biggest audience anybody will give this picture, on terms that take a third off the top before a euro comes home.',
    fee: 0.325,
    spendsOnSelling: 0.85,
    upFront: 0,
    reach: 1,
    keepsNet: 0.5,
  },
  {
    id: 'streamer',
    label: 'A Streamer Buyout',
    what: 'One payment for the picture outright. No windows, no reporting, no participation.',
    said: 'Certain, immediate, and the end of the story. That check is everything it will ever pay.',
    fee: 0,
    spendsOnSelling: 0,
    upFront: 1.2,
    reach: 0,
    keepsNet: 1,
  },
  {
    id: 'agent',
    label: 'A Sales Agent',
    what: 'Territory by territory, sold off a market stand, with the agent taking a commission and charging the market costs back.',
    said: 'Slower and smaller, and the company keeps nearly all of what survives. You’ll be reading statements for years.',
    fee: 0.2,
    spendsOnSelling: 0.15,
    upFront: 0,
    reach: 0.55,
    keepsNet: 0.9,
  },
];

export const dealById = (id: string): Deal | undefined => DEALS.find((d) => d.id === id);

// ---------------------------------------------------------------------------
// The windows
// ---------------------------------------------------------------------------

export interface ReleaseWindow {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What is being sold in it. */
  what: string;
  /** Weeks after release that it pays. */
  opensAt: number;
  /** Its share of the picture's whole take. SLATE's own. */
  share: number;
}

/**
 * The release pattern, and when each part of it pays.
 *
 * The shares sum to one, so a picture's windows add up to its take and nothing
 * leaks. The dates are the modern ones: seventeen days to the home window,
 * nine months to the first pay license, and a long tail after that which is
 * small per year and real across a decade.
 */
export const WINDOWS: readonly ReleaseWindow[] = [
  {
    id: 'theatrical',
    label: 'The Theatrical Run',
    what: 'Cinemas, where roughly half of every ticket stays with the exhibitor and never reaches the picture at all.',
    opensAt: 0,
    share: 0.34,
  },
  {
    id: 'home',
    label: 'The Home Window',
    what: 'Digital rental and purchase, seventeen days after the picture opens. It used to be ninety, and the change is the single biggest shift in how pictures earn this century.',
    opensAt: 2.5,
    share: 0.26,
  },
  {
    id: 'pay',
    label: 'The Pay Window',
    what: 'The first streaming or pay television license, sold as a lump for a term.',
    opensAt: 39,
    share: 0.22,
  },
  {
    id: 'free',
    label: 'Free Television',
    what: 'Broadcast and ad-supported streaming, two and a half years out, sold to whoever wants a library title cheap.',
    opensAt: 130,
    share: 0.12,
  },
  {
    id: 'library',
    label: 'The Library Tail',
    what: 'What a picture earns forever, renewed license by renewed license. Small every year and the reason a catalog is worth owning.',
    opensAt: 260,
    share: 0.06,
  },
];

export const windowById = (id: string): ReleaseWindow | undefined => WINDOWS.find((w) => w.id === id);

// ---------------------------------------------------------------------------
// The numbers behind the terms
// ---------------------------------------------------------------------------

/**
 * What an unrecouped negative costs a year while it waits.
 *
 * Real film finance charges the outstanding balance at a commercial rate, and
 * this sits inside the ordinary band for that. It accrues on what is still
 * owed between one receipt and the next, never on the original sum, which is
 * the difference between a debt and a fiction.
 */
export const INTEREST_A_YEAR = 0.1;

/** Weeks between signing a deal and the picture opening. SLATE's own. */
export const RELEASE_WEEKS = 12;

/**
 * What a picture is reckoned to take across ten years, before any deal terms.
 *
 * Climbs with the negative cost and climbs slower than it does, because scale
 * buys audience sublinearly and always has. A quarter-million-euro picture and
 * a hundred-million one cannot land in the same band, and doubling a budget
 * has never doubled a gross. The curve is SLATE's own.
 */
export const ultimateFor = (negativeCents: Money): Money => {
  const millions = Math.max(0.25, negativeCents / 100 / 1_000_000);
  return Math.round(negativeCents * 4.2 * millions ** -0.12);
};
