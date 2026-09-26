/**
 * Everywhere you can go, in one list.
 *
 * There is not much of it left. Keeping the list here rather than in the
 * screen means the rail, the breadcrumbs and Home cannot disagree about what
 * exists.
 *
 * Entries are text. No emoji, no glyph icons: a symbol that renders as a
 * picture on one platform and a box on another is not a label, and a
 * screen reader has nothing to say about it.
 */

export interface Destination {
  route: string;
  label: string;
  /** One line on what is behind it, shown on the tile. */
  detail: string;
  /**
   * A destination that exists and does not open. Its features are not built,
   * so clicking says so and leaves you where you were.
   */
  locked?: boolean;
  /**
   * Offered on Home and kept off the rail. The calendar describes the day you
   * are standing in, so it belongs beside the day rather than in a list of
   * other places to be.
   */
  homeOnly?: boolean;
}

export interface DestinationGroup {
  label: string;
  items: readonly Destination[];
}

export const DESTINATIONS: readonly DestinationGroup[] = [
  {
    label: 'Your Day',
    items: [
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Every commitment you have', homeOnly: true },
    ],
  },
  {
    label: 'Your Money',
    items: [
      // Opened from the Money panel, which names the bank it goes to.
      { route: '/workspace/bank', label: 'Your Bank', detail: 'Your accounts, and moving money between them', homeOnly: true },
    ],
  },
];

/**
 * What the rail offers: everything except the ones Home keeps, and no group
 * left standing with nothing under it.
 *
 * One list still, so nothing can disagree about what exists — only about where
 * it is offered.
 */
export const RAIL_DESTINATIONS: readonly DestinationGroup[] = DESTINATIONS
  .map((group) => ({ ...group, items: group.items.filter((item) => !item.homeOnly) }))
  .filter((group) => group.items.length > 0);

/** Every destination, flat. */
export const ALL_DESTINATIONS: readonly Destination[] = DESTINATIONS.flatMap((g) => g.items);

/** The ones that do not open, by route. */
export const LOCKED_ROUTES: ReadonlySet<string> = new Set(
  ALL_DESTINATIONS.filter((d) => d.locked).map((d) => d.route),
);
