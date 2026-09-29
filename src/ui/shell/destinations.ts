/**
 * Everywhere you can go, in one list.
 *
 * There is not much of it left. Keeping the list here rather than in the
 * screen means the rail, the breadcrumbs and Home cannot disagree about what
 * exists.
 *
 * Entries are text. No emoji, no glyph icons: a symbol that renders as a
 * picture on one platform and a box on another is not a label, and a
 * screen reader has nothing to say about it. A destination that existed and
 * didn't open, `locked`, went on 2026-09-27: none had been for a long time.
 */

export interface Destination {
  route: string;
  label: string;
  /** One line on what is behind it, shown on the tile. */
  detail: string;
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
      // Opened from the Travel panel on Home.
      { route: '/workspace/travel', label: 'Travel', detail: 'A journey by air or train, a hotel, and the way home', homeOnly: true },
      // Opened from the Cars panel on Home.
      { route: '/workspace/vehicles', label: 'Cars', detail: 'A car of your own, to buy, keep and run', homeOnly: true },
    ],
  },
  {
    label: 'Your Training',
    items: [
      // Opened from the School panel, for a life that began at drama school.
      { route: '/workspace/school', label: 'Your School', detail: 'Your standing, classes, casting and terms', homeOnly: true },
    ],
  },
  {
    label: 'Your Work',
    items: [
      // Opened from the Career panel, from the showcase on.
      { route: '/workspace/career', label: 'Your Career', detail: 'Your agency, auditions, work and unions', homeOnly: true },
    ],
  },
  {
    label: 'Your Money',
    items: [
      // Opened from the Money panel, which names the bank it goes to.
      { route: '/workspace/bank', label: 'Your Bank', detail: 'Your accounts, and moving money between them', homeOnly: true },
      // Opened from the Home panel: the homes for sale in town, and the one owned.
      { route: '/workspace/homes', label: 'Homes', detail: 'Homes for sale where you live, and the one you own', homeOnly: true },
    ],
  },
  {
    // Until 2026-09-29 Papers sat under Your Money; with the passport and the license it's more than money.
    label: 'Your Affairs',
    items: [
      // Opened from the Papers panel.
      { route: '/workspace/papers', label: 'Papers', detail: 'Your returns, health cover, unemployment, passport and license', homeOnly: true },
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

