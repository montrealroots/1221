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
 * didn’t open, `locked`, went on 2026-09-27: none had been for a long time.
 *
 * From the connected attributes of 2026-10-09 the Player Profile, the
 * school, money and the papers are on the rail as well as on Home, each once
 * the guide’s chapter that opens it (`feature`) is read. Until then they
 * were `homeOnly`, reached only from their panels, and the rail held Home
 * alone; the calendar still is.
 */

export interface Destination {
  route: string;
  label: string;
  /** One line on what is behind it, shown as the rail item’s title. */
  detail: string;
  /** The guide’s id that opens it (`content/tutorial.ts`): the rail carries it once the chapter’s been read. */
  feature: string;
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
    label: 'You',
    items: [
      { route: '/workspace/profile', label: 'Player Profile', detail: 'Your abilities, techniques, interests, genres, condition and history', feature: 'ui.profile' },
    ],
  },
  {
    label: 'Your Day',
    items: [
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Every commitment you have', feature: 'ui.calendar', homeOnly: true },
      // Travel, Cars and Land were opened from their panels here until the scope reset of 2026-10-09.
    ],
  },
  {
    label: 'Your Training',
    items: [
      { route: '/workspace/school', label: 'School', detail: 'Your standing, classes, coursework, casting and terms', feature: 'ui.school' },
    ],
  },
  // Your Work, the career’s, went in the scope reset of 2026-10-09.
  {
    label: 'Your Affairs',
    items: [
      { route: '/workspace/bank', label: 'Money', detail: 'Your accounts, and moving money between them', feature: 'ui.bank' },
      // Until 2026-09-29 Papers sat under Your Money; with the passport and the license it’s more than money.
      { route: '/workspace/papers', label: 'Papers', detail: 'Your returns, health cover, unemployment, passport and ID', feature: 'ui.papers' },
      // Homes, opened from the Home panel, went in the scope reset of 2026-10-09.
    ],
  },
];

/**
 * What the rail offers: everything except the ones Home keeps, and no group
 * left standing with nothing under it. One list still, so nothing can
 * disagree about what exists, only about where it is offered.
 */
export const RAIL_DESTINATIONS: readonly DestinationGroup[] = DESTINATIONS
  .map((group) => ({ ...group, items: group.items.filter((item) => !item.homeOnly) }))
  .filter((group) => group.items.length > 0);

/** Every destination, flat. */
export const ALL_DESTINATIONS: readonly Destination[] = DESTINATIONS.flatMap((g) => g.items);
