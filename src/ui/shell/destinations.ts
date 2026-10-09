/**
 * Everywhere you can go, in one list.
 *
 * Keeping the list here rather than in the screen means the rail, the
 * breadcrumbs and Home cannot disagree about what exists.
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

/**
 * Every place is offered on Home, from the panel it belongs to, grouped under
 * these headings there; the rail keeps Home, the search, and the places pinned
 * or lately visited. For part of 2026-10-02 the rail carried every place
 * too, and the owner asked for them to stay on Home.
 */
export const DESTINATIONS: readonly DestinationGroup[] = [
  {
    label: 'Your Day',
    items: [
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Every commitment you have', homeOnly: true },
      { route: '/workspace/people', label: 'People', detail: 'Who you know, and time together', homeOnly: true },
      { route: '/workspace/food', label: 'Food', detail: 'Your kitchen, the shops, a bar and the restaurants', homeOnly: true },
      { route: '/workspace/clothes', label: 'Clothes', detail: 'What you wear, the wash and the shops', homeOnly: true },
      { route: '/workspace/routines', label: 'Routines', detail: 'The things you do in order, saved', homeOnly: true },
      { route: '/workspace/belongings', label: 'Belongings', detail: 'What you own, and where each thing is', homeOnly: true },
    ],
  },
  {
    label: 'Your Work',
    items: [
      { route: '/workspace/career', label: 'Your Career', detail: 'Your agency, auditions, work and unions', homeOnly: true },
      { route: '/workspace/school', label: 'Your School', detail: 'Your standing, classes, casting and terms', homeOnly: true },
      { route: '/workspace/industry', label: 'The Industry', detail: 'Real films and series, the companies, and this save’s projects', homeOnly: true },
    ],
  },
  {
    label: 'Getting Around',
    items: [
      { route: '/workspace/travel', label: 'Travel', detail: 'A journey by air or train, a hotel, and the way home', homeOnly: true },
      { route: '/workspace/vehicles', label: 'Cars', detail: 'A car of your own, to buy, keep and run', homeOnly: true },
    ],
  },
  {
    label: 'Your Money',
    items: [
      { route: '/workspace/bank', label: 'Your Bank', detail: 'Your accounts, and moving money between them', homeOnly: true },
      { route: '/workspace/homes', label: 'Homes', detail: 'Homes for sale where you live, and the one you own', homeOnly: true },
      { route: '/workspace/land', label: 'Land', detail: 'A parcel of your own, to buy, split, combine and sell', homeOnly: true },
    ],
  },
  {
    // Until 2026-09-29 Papers sat under Your Money; with the passport and the license it's more than money.
    label: 'Your Affairs',
    items: [
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


/**
 * The group a place sits in, as the rail says it: the eyebrow over its page,
 * so a screen and the rail never name its part of life differently. Until
 * 2026-10-02 each page typed its own, and Cars and Travel said "Your Day"
 * while the rail put them under Getting Around.
 */
export const groupLabelOf = (route: string): string => DESTINATIONS.find((g) => g.items.some((i) => i.route === route))?.label ?? '';
