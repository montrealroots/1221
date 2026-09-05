/**
 * SLATE — the kind of company you open.
 *
 * A production company is a shape as much as a name. Two people and a laptop
 * developing one thing at a time is a different business from a shop with a
 * slate, an overhead deal and forty people on payroll, and the difference is
 * not only size: they take different work, carry different risk and fail in
 * different ways.
 *
 * These are the shapes that actually exist, priced at what they actually cost
 * to run. Nothing here is a tier to be climbed in order — a boutique that
 * makes one great thing a year is not a failed studio.
 */

import type { Money } from '../core/money';

export interface ShingleShape {
  id: string;
  name: string;
  what: string;
  /** What it is good at. */
  suits: string;
  /** What it cannot do. */
  cannot: string;
  /** Monthly overhead before anybody is hired, in cents. */
  overhead: Money;
  /** Projects it can carry at once before quality suffers. */
  capacity: number;
  /** What it costs to open the doors, in cents. */
  setup: Money;
  /** Desks. More people, more overhead, more that gets done without you. */
  seats: number;
}

export const SHINGLE_SHAPES: readonly ShingleShape[] = [
  {
    id: 'kitchen_table', name: 'The Kitchen Table',
    what: 'You, a laptop and a company number. No office, no staff, no overhead worth the word.',
    suits: 'Developing one thing properly while you find out whether any of this works.',
    cannot: 'Carry two productions, absorb a bad month, or impress anybody who visits.',
    overhead: 1_200_00, capacity: 1, setup: 2_500_00, seats: 1,
  },
  {
    id: 'boutique', name: 'A Boutique',
    what: 'Two rooms, an assistant, and a reputation for making a small number of good things.',
    suits: 'Prestige work, festival pictures, one series at a time done properly.',
    cannot: 'Chase volume, or survive long between deliveries.',
    overhead: 14_000_00, capacity: 2, setup: 45_000_00, seats: 4,
  },
  {
    id: 'indie', name: 'An Independent',
    what: 'A proper shop. Development, production and business affairs under one roof.',
    suits: 'A real slate: three or four things moving, at different stages, at once.',
    cannot: 'Fund its own pictures. Everything still needs a buyer or a bank.',
    overhead: 62_000_00, capacity: 4, setup: 220_000_00, seats: 12,
  },
  {
    id: 'studio', name: 'A Studio',
    what: 'Stages, standing sets, post in-house, and a payroll that does not care whether you are shooting.',
    suits: 'Volume, control of the whole pipeline, and owning what you make.',
    cannot: 'Be quiet. The overhead has to be fed every month, hit or no hit.',
    overhead: 340_000_00, capacity: 8, setup: 2_800_000_00, seats: 60,
  },
];

export const SHINGLE_BY_ID: Readonly<Record<string, ShingleShape>> =
  Object.fromEntries(SHINGLE_SHAPES.map((s) => [s.id, s]));

/**
 * What the company is for.
 *
 * A remit is a promise about what you will make, and it is read by buyers,
 * by talent deciding whether to come to you, and by critics deciding what
 * you were trying to do. Changing it later is possible and costs standing.
 */
export interface Remit {
  id: string;
  name: string;
  what: string;
  /** Formats the remit is credible in. */
  formats: readonly string[];
  /** What a buyer expects to pay for it, against the ordinary rate. */
  priceIndex: number;
  /** How much critical standing the work starts with. */
  prestige: number;
}

export const REMITS: readonly Remit[] = [
  {
    id: 'prestige_drama', name: 'Prestige Drama',
    what: 'The things that get written about. Expensive per hour, slow, and how a company gets taken seriously.',
    formats: ['feature', 'limited_series', 'series'],
    priceIndex: 1.25, prestige: 78,
  },
  {
    id: 'popular_series', name: 'Popular Series',
    what: 'Returning television that people actually watch. Unfashionable, reliable, and it pays for everything else.',
    formats: ['series'],
    priceIndex: 1, prestige: 44,
  },
  {
    id: 'genre', name: 'Genre',
    what: 'Horror, thriller, science fiction. Cheap to make, travels everywhere, occasionally enormous.',
    formats: ['feature', 'series', 'limited_series'],
    priceIndex: 0.78, prestige: 40,
  },
  {
    id: 'comedy', name: 'Comedy',
    what: 'Hard to do, impossible to fake, and the only thing buyers say they want and never commission.',
    formats: ['feature', 'series', 'special'],
    priceIndex: 0.85, prestige: 48,
  },
  {
    id: 'documentary', name: 'Documentary And Factual',
    what: 'The cheapest thing you can make well, and the fastest to get on air.',
    formats: ['documentary', 'series', 'special'],
    priceIndex: 0.45, prestige: 58,
  },
  {
    id: 'family', name: 'Family And Animation',
    what: 'Long lead times, enormous costs, and a library that earns for thirty years.',
    formats: ['feature', 'series'],
    priceIndex: 1.4, prestige: 46,
  },
  {
    id: 'anything', name: 'Whatever Sells',
    what: 'No remit at all. You will make anything, which means nobody knows what you are for.',
    formats: ['feature', 'series', 'limited_series', 'documentary', 'tv_movie', 'special', 'short'],
    priceIndex: 0.92, prestige: 30,
  },
];

export const REMIT_BY_ID: Readonly<Record<string, Remit>> =
  Object.fromEntries(REMITS.map((r) => [r.id, r]));

/**
 * What a founder pays themselves a month, by default.
 *
 * An ordinary life in this game runs to about twenty-six thousand a year once
 * rent, utilities, food and the standing bills are counted. This is
 * comfortably above that and nowhere near enough to trouble the company, so a
 * new save is solvent without the player having to think about it on the first
 * morning — and it is a number they can move in either direction.
 */
export const DEFAULT_FOUNDER_DRAW: Money = 12_000_00;
