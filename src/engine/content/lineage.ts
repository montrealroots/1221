/**
 * SLATE — what a second one inherits, and what it spends doing so.
 *
 * A studio with no franchises is a studio making unrelated bets, and a studio making
 * unrelated bets has no strategy to have. This is the file that makes a hit worth
 * more than its own takings: it can be built on.
 *
 * ## The two forces, which pull against each other
 *
 * **Inheritance.** A follow-up arrives at an audience the last one made. It does not
 * have to introduce itself, so it opens above where its own merits would put it, and
 * how far above depends on how well the last one did and on whether the format is the
 * kind of thing anybody remembers the name of — which is `carriesForward` on the
 * format row rather than a rule in here.
 *
 * **Fatigue.** The same audience gets tired, and it gets tired faster than most
 * studios believe. The second is usually the best business anybody does. The third
 * holds. By the fifth the inheritance is worth less than the obligation to keep
 * making it, and the only way out is to stop, which is a decision a player has to be
 * able to take too late.
 *
 * Both curves are here and they cross. Where they cross is the interesting part of
 * the mechanic and it is deliberately not stated anywhere a player can read — it is
 * a thing to discover by running a franchise into the ground once.
 *
 * ## Why the gap matters
 *
 * Too soon and the audience has not missed it; too late and they have stopped caring.
 * A single-peaked curve on the years between entries, which is the smallest honest
 * model of a thing every studio gets wrong in both directions.
 */

/** How much the audience of one entry carries into the next, before fatigue. */
export const INHERITS_AT_BEST = 0.85;

/**
 * How fast an audience tires of the same thing.
 *
 * Applied to the entry's position in the line, so the first follow-up is barely
 * touched and the fifth is most of the way gone. Geometric rather than linear because
 * tiredness compounds: a fourth is not three times worse than a second, it is worse
 * than that.
 */
export const TIRES_BY = 0.34;

/**
 * The gap that suits a follow-up best, in years.
 *
 * Between two and three. Under a year an audience has not had time to want it; past
 * five they have found something else. Set from the shape of the thing rather than
 * measured, and it is the one figure in this file with no derivation.
 */
export const BEST_GAP_YEARS = 2.5;

/** How far either side of the best gap still counts as well judged. */
export const GAP_FORGIVES_YEARS = 2.0;

export interface Entry {
  /** Which one in the line this is, counting the original as one. */
  ordinal: number;
  /**
   * How the previous entry did, as what it returned against what it cost.
   *
   * One means it washed its face. The inheritance reads this rather than the raw
   * take, because a picture that took a great deal and cost more did not build an
   * audience, it rented one.
   */
  lastReturned: number;
  /** Years between the previous entry's release and this one's. */
  gapYears: number;
  /** The format's own `carriesForward`. */
  carriesForward: number;
}

/**
 * What a follow-up inherits, as a multiplier on what it would have opened at alone.
 *
 * One means it inherits nothing and stands on its own. Above one means the line is
 * still worth something; below one is possible and is the whole warning — a franchise
 * run past its welcome is worse than a new title, because the audience arrives
 * already tired.
 */
export function inherits(entry: Entry): number {
  if (entry.ordinal <= 1) return 1;
  const behind = entry.ordinal - 1;

  // What the last one earned the line, capped: a runaway hit does not license an
  // unlimited number of follow-ups, it licenses a very good one.
  const earned = Math.max(0, Math.min(2.2, entry.lastReturned));
  const carried = INHERITS_AT_BEST * entry.carriesForward * earned;

  // And what the audience has already given, which is a share of it each time.
  const tired = Math.pow(1 - TIRES_BY, behind - 1);

  const away = Math.abs(entry.gapYears - BEST_GAP_YEARS);
  const judged = Math.max(0.55, 1 - Math.pow(away / GAP_FORGIVES_YEARS, 2) * 0.45);

  return 1 + carried * tired * judged - FATIGUE_FLOOR * (behind - 1);
}

/**
 * What each entry past the first costs the line, whatever it inherits.
 *
 * The other half of the crossing. Without it a franchise would asymptote towards
 * standing alone rather than becoming actively worse than a new title, and the
 * decision to stop would never arrive — a studio could keep making them forever at
 * no penalty, which is not a decision.
 */
export const FATIGUE_FLOOR = 0.09;

/**
 * Whether a line is past its best, which is the sentence a player should be shown.
 *
 * Read off `inherits` rather than off the ordinal, because a line whose last entry
 * doubled its money is not tired at four and a line that limped is tired at two.
 */
export function pastItsBest(entry: Entry): boolean {
  return inherits(entry) <= 1;
}

/** What to call an entry in a line, on a screen. */
export function saidAs(ordinal: number): string {
  if (ordinal <= 1) return 'The first of it';
  if (ordinal === 2) return 'A second one';
  if (ordinal === 3) return 'A third';
  return `Number ${ordinal}`;
}
