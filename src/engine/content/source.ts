/**
 * SLATE — where a story came from before it was yours, and what that is worth.
 *
 * `Provenance` has been in the domain model for the life of the build. Six values —
 * an original, a novel, an article, a play, somebody's life, a licensed format — and
 * `company.option` has been writing one onto every holding since the day it was
 * added. Nothing in the tree ever read it. A declared word with nothing that reads it
 * is worse than no word at all, and this one had six of them.
 *
 * So this is the file that makes the choice real, and it turns out to be the front of
 * the pipeline: before the format, before the script, before anybody is engaged,
 * there is the question of whether you are making something up or buying something
 * people already know.
 *
 * ## The four things a provenance decides
 *
 * Each is read somewhere else, which is the whole point of writing this down:
 *
 *   - **What it costs to take.** An original screenplay is the cheapest thing in the
 *     business and a novel people have read is not.
 *   - **How much of an audience it arrives with.** A campaign has to reach a floor
 *     before anybody has heard of the picture. Material with readers has already paid
 *     part of that, so the floor comes down — which is the single most valuable thing
 *     about owning something known, and it is why studios buy books.
 *   - **How much more the script can carry.** A novel has done work a screenplay has
 *     to do from nothing: the people exist, the world exists, the sub-plots are
 *     already load-bearing. That is extra room in the attention pool rather than a
 *     bonus to a result, so it widens what a writer may attempt instead of making the
 *     same attempt score higher.
 *   - **What it can honestly be made as.** A stage play is two hours in one room and
 *     does not become a twenty-four part serial. A licensed format is a machine for
 *     making episodes and makes a poor feature.
 *
 * ## Why the head start is a discount and not a bonus
 *
 * Because a bonus would be the thing `docs/research/PIPELINE.md` calls decoration: a
 * multiplier on a result that changes no decision. A lower campaign floor changes what
 * the player should *do* — a known property can be released on a smaller campaign, so
 * the money saved goes on the screen instead, and that is a real trade with a real
 * wrong answer.
 */

import type { Provenance } from '../domain/company';

export interface Source {
  id: Provenance;
  /** What it is called on a screen. */
  label: string;
  /** What it is, said to the person choosing. */
  what: string;
  /**
   * Roughly what a hold on one costs, in cents.
   *
   * A guide rather than a price: `company.option` already takes a fee on the payload
   * and this is what a screen offers as the sensible figure. Ordering matters more
   * than the amounts — an original is the cheapest thing in the business.
   */
  aboutCents: number;
  /**
   * How much of the campaign floor is already paid, 0 to 1.
   *
   * The reason a studio buys a book. At 0.4 the picture needs forty per cent less
   * campaign to be as well known, and the money saved can go on the screen.
   */
  knownAlready: number;
  /**
   * Extra points the script may spend, on top of the ordinary pool.
   *
   * Room rather than reward. A novel hands a writer people and a world that already
   * work, so more of the page can be spent elsewhere — and a player who takes a novel
   * and then writes a thin script has wasted it, which a flat bonus could never say.
   */
  carriesInto: number;
  /** Which formats it can honestly become, by format id. Empty means all of them. */
  suits: readonly string[];
}

/**
 * The six, in the order they cost.
 *
 * The values are fixed by `Provenance` in the domain model — they are written into
 * saves already, so this table fills them in rather than inventing a list. That
 * constraint turned out to be a good one: six is enough to make the choice real and
 * few enough that every row is obviously different from every other.
 */
export const SOURCES: readonly Source[] = [
  {
    id: 'original',
    label: 'An Original',
    what: 'Nobody has read it, nobody is waiting for it, and it is yours outright '
      + 'from the first day.',
    aboutCents: 40_000_00,
    // Nothing at all, and that is the trade: the cheapest material in the business
    // arrives with no audience whatever and every penny of awareness has to be bought.
    knownAlready: 0,
    carriesInto: 0,
    suits: [],
  },
  {
    id: 'article',
    label: 'A Piece Of Journalism',
    what: 'Ten thousand words a reporter filed. A true story with the reporting '
      + 'already done and the people still alive.',
    aboutCents: 120_000_00,
    knownAlready: 0.14,
    // The research is done and the shape is not. A reported piece hands over a world
    // and almost no structure, so it widens the page a little.
    carriesInto: 2,
    suits: [],
  },
  {
    id: 'play',
    label: 'A Stage Play',
    what: 'Two hours that already works in front of people, in one room, with the '
      + 'dialogue proved nightly.',
    aboutCents: 180_000_00,
    knownAlready: 0.18,
    carriesInto: 3,
    // One room and two hours. It becomes a film or a thing made for television and
    // it does not become a serial, which is a refusal rather than a bad price.
    suits: ['feature', 'tv-movie'],
  },
  {
    id: 'life_rights',
    label: 'A Real Life',
    what: 'The right to tell a real person’s story, agreed with the person or their '
      + 'estate. The chain of title starts with a signature.',
    aboutCents: 260_000_00,
    knownAlready: 0.22,
    carriesInto: 3,
    suits: ['feature', 'tv-movie', 'miniseries'],
  },
  {
    id: 'format',
    label: 'A Licensed Format',
    what: 'A show that already works somewhere else, licensed to be remade here. A '
      + 'machine for making episodes, bought whole.',
    aboutCents: 340_000_00,
    knownAlready: 0.25,
    // The most of any row, because a format is nothing but structure — the engine,
    // the shape of a week and the way an episode ends are all included.
    carriesInto: 5,
    suits: ['miniseries', 'anthology', 'serial', 'micro'],
  },
  {
    id: 'novel',
    label: 'A Novel',
    what: 'A book people have read, with an audience that turns up on the strength '
      + 'of the title alone.',
    aboutCents: 480_000_00,
    // The highest, and the reason the row costs what it does. Nearly half a
    // campaign is already paid before anybody spends anything.
    knownAlready: 0.42,
    carriesInto: 4,
    suits: [],
  },
];

export const SOURCE_BY_ID: Readonly<Record<string, Source>> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);

export const sourceById = (id: string | undefined): Source | undefined =>
  (id === undefined ? undefined : SOURCE_BY_ID[id]);

/** What a picture off this material needs to spend before anybody has heard of it. */
export function floorAfter(expectsCents: number, source: Source | undefined): number {
  return Math.round(expectsCents * (1 - (source?.knownAlready ?? 0)));
}

/** How many points of attention a script off this material may spend. */
export const carriedInto = (source: Source | undefined): number => source?.carriesInto ?? 0;

/**
 * Why this material cannot be made in this format.
 *
 * A refusal rather than a penalty, and it names what the material does suit, because
 * a refusal that does not say where to go is a wall.
 */
export function whyNotFrom(
  source: Source,
  formatId: string,
  formatLabel: string,
  labelOf: (id: string) => string,
): string | undefined {
  if (source.suits.length === 0 || source.suits.includes(formatId)) return undefined;
  return `${source.label} does not become ${formatLabel}. What it suits: `
    + `${source.suits.map(labelOf).join(', ')}.`;
}
