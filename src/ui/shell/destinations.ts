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
 * alone. The calendar stayed Home's until 2026-10-23 (brief 23), when it took
 * its place under Your Day beside Updates, every notice the save keeps: on
 * the calendar, until then, the rail marked no screen as the one you were on.
 * Later that day the owner's brief 24 gave both back to Home ("a navigation
 * cleanup, not removal"): Up Next's Open Calendar and Recent Updates' View All
 * Updates are their ways in, each always offered, and each screen has its way
 * back to Home. Your Day went from the menu with them.
 */

/** Every notice the save keeps, read and unread (`ui/screens/Updates.tsx`, from 2026-10-23). */
export const UPDATES_ROUTE = '/workspace/updates';

export interface Destination {
  route: string;
  label: string;
  /** One line on what is behind it, shown as the rail item’s title. */
  detail: string;
  /** The guide’s id that opens it (`content/tutorial.ts`): the rail carries it once the chapter’s been read. */
  feature: string;
  /**
   * Offered on Home and kept off the rail: the calendar, by Up Next's Open
   * Calendar, and Updates, by Recent Updates' View All Updates (from 2026-10-23,
   * brief 24). The calendar was until brief 23 earlier that day, as the day you
   * are standing in, and then for a day neither was.
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
      { route: '/workspace/profile', label: 'Player Profile', detail: 'Your abilities, techniques, genres, condition and history', feature: 'ui.profile' },
    ],
  },
  {
    label: 'Your Day',
    items: [
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Your plans and commitments, month by month', feature: 'ui.calendar', homeOnly: true },
      // Opened with What Needs You, whose notices it keeps (`ui.needs`).
      { route: '/workspace/updates', label: 'Updates', detail: 'Every notice you’ve had, read and unread, to filter and mark read', feature: 'ui.needs', homeOnly: true },
      // Travel, Cars and Land were opened from their panels here until the scope reset of 2026-10-09.
    ],
  },
  {
    label: 'Your Training',
    items: [
      { route: '/workspace/school', label: 'School', detail: 'Your standing, classes, coursework, casting, shifts and terms', feature: 'ui.school' },
    ],
  },
  // Your Work, the career’s, went in the scope reset of 2026-10-09, and came back with the owner’s brief 19 on
  // 2026-10-20: the professional record and its portfolio (`systems/pro.ts`), not the old career.
  {
    label: 'Your Work',
    items: [
      { route: '/workspace/career', label: 'Career', detail: 'Where you stand as a professional, and your profile, headshots, résumé and reel', feature: 'ui.career' },
    ],
  },
  {
    label: 'Your Affairs',
    items: [
      { route: '/workspace/bank', label: 'Money', detail: 'Your accounts, cards, payments, borrowing and statements', feature: 'ui.bank' },
      // Until 2026-09-29 Papers sat under Your Money; with the passport and the license it’s more than money.
      { route: '/workspace/papers', label: 'Papers', detail: 'Your tax returns, health cover, unemployment, passport, ID and permission to work', feature: 'ui.papers' },
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
