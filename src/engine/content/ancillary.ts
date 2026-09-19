/**
 * SLATE — the money that is not the picture, and the second place a guarantee
 * argues with a share.
 *
 * Merchandise and a soundtrack are the two things a studio sells that are not the
 * thing it made. They are worth having in the model for one reason: they are the
 * only revenue a producer can commit to **before** knowing whether the picture
 * works, which makes them the cash a short company reaches for and the money a
 * confident one keeps.
 *
 * So they take the same shape as a talent deal, deliberately. A partner will pay a
 * guarantee now, or take the risk with you for a share of what arrives. The producer
 * is on the other side of the table this time — taking the guarantee is taking the
 * safe money, exactly as a director taking a fee is — and a player who has learned
 * to think about points from one side gets to think about it from the other.
 *
 * ## Why not every picture can sell these
 *
 * Because a mechanic that applies to everything is a tax, not a decision. Merchandise
 * needs something to put on the thing, which is why it reads spectacle and refuses
 * the genres nobody makes toys for. A soundtrack needs music worth buying, which is
 * why it reads the composer. A picture that can do neither is not being punished —
 * it was never in that business, and a romance that cannot sell action figures is a
 * fact about romances.
 *
 * ## What is deliberately not here
 *
 * No manufacturers with their own terms, no minimum production budgets to qualify,
 * no bonus features, no product placement. Each is real and each would be a table of
 * its own with its own readers. Adding them as fields here would give this file
 * columns nothing looks at, which is how a partner list becomes a price list for a
 * shop with no door.
 */

import type { Dial } from './story';

export interface Ancillary {
  /** Stable id, used as the ledger account suffix. */
  id: string;
  /** What it is called on a statement. */
  label: string;
  /** What it is, said to the person deciding. */
  what: string;
  /**
   * The genres anybody will do this with. Empty would mean all, and neither row
   * uses it — a partner who will back anything is not a partner, it is a subsidy.
   */
  suits: readonly string[];
  /** The dial the partner is really reading. */
  reads: Dial;
  /**
   * What the partner pays up front, as a share of what the picture cost to make.
   *
   * Off the budget rather than off the takings, because it is agreed before anybody
   * knows the takings — which is the whole point of a guarantee and the reason it is
   * the money a short company reaches for.
   */
  guaranteeOfBudget: number;
  /** What a share instead of a guarantee is worth, against everything received. */
  shareOfReceipts: number;
  /** How far the dial it reads can move either offer. */
  dialSwings: number;
}

export const ANCILLARIES: readonly Ancillary[] = [
  {
    id: 'merchandise',
    label: 'Merchandise',
    what: 'A partner makes the toys, the shirts and the lunchboxes, and pays for the '
      + 'right to. It wants something on the screen worth putting on a box.',
    suits: ['action', 'family', 'scifi', 'horror'],
    reads: 'spectacle',
    guaranteeOfBudget: 0.18,
    shareOfReceipts: 0.14,
    // The wider of the two. A spectacle picture and a talky one in the same genre
    // are not the same proposition to anybody selling figures.
    dialSwings: 0.7,
  },
  {
    id: 'soundtrack',
    label: 'The Soundtrack',
    what: 'A label puts the music out. Worth real money where the music is worth '
      + 'buying, and worth almost nothing where it is furniture.',
    suits: ['drama', 'romance', 'comedy', 'family'],
    reads: 'dialogue',
    guaranteeOfBudget: 0.06,
    shareOfReceipts: 0.05,
    dialSwings: 0.4,
  },
];

export const ANCILLARY_BY_ID: Readonly<Record<string, Ancillary>> = Object.fromEntries(
  ANCILLARIES.map((a) => [a.id, a]),
);

export const ancillaryById = (id: string | undefined): Ancillary | undefined =>
  (id === undefined ? undefined : ANCILLARY_BY_ID[id]);

/** Which of these a picture of this genre could sell at all. */
export const ancillariesFor = (genreId: string | undefined): readonly Ancillary[] =>
  (genreId === undefined ? [] : ANCILLARIES.filter((a) => a.suits.includes(genreId)));

/** Either shape of deal. The producer is on the other side of the table this time. */
export type AncillaryDeal = 'guarantee' | 'share';

export interface Offer {
  kind: AncillaryDeal;
  /** Paid at the opening, whatever happens. Zero on a share. */
  guaranteeCents: number;
  /** Taken from everything received afterwards. Zero on a guarantee. */
  share: number;
}

/**
 * How much the partner likes what they are looking at, around one.
 *
 * Reads one dial and nothing else, because a partner is not judging the picture —
 * they are judging the one thing about it they can sell.
 */
export function howKeen(ancillary: Ancillary, dialAt: number, most: number): number {
  const along = Math.max(0, Math.min(1, dialAt / most));
  return 1 + (along - 0.5) * 2 * ancillary.dialSwings;
}

/** Both offers, so a screen can put them side by side and the player can choose. */
export function offersOn(
  ancillary: Ancillary,
  budgetCents: number,
  dialAt: number,
  most: number,
): Readonly<Record<AncillaryDeal, Offer>> {
  const keen = howKeen(ancillary, dialAt, most);
  return {
    guarantee: {
      kind: 'guarantee',
      guaranteeCents: Math.round(budgetCents * ancillary.guaranteeOfBudget * keen),
      share: 0,
    },
    share: {
      kind: 'share',
      guaranteeCents: 0,
      share: ancillary.shareOfReceipts * keen,
    },
  };
}

/** What every share deal on a picture takes out of a receipt. */
export function shareOutOf(offers: readonly Offer[], receivedCents: number): number {
  const share = offers.reduce((sum, o) => sum + o.share, 0);
  return Math.round(receivedCents * Math.min(share, MOST_SHARE));
}

/**
 * The most of a receipt the partners can take between them.
 *
 * A ceiling nobody is refused at, the same way the back end has one. The interesting
 * failure is a producer who covered a shortfall by selling everything and then made
 * a hit, and a ceiling is what stops that becoming an arithmetic error.
 */
export const MOST_SHARE = 0.3;
