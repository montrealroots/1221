/**
 * Everywhere you can go, in one list.
 *
 * This used to live inside the shell as a left-hand rail. It is a plain list
 * now because the rail is gone: Home is the hub, and a hub that is missing
 * half the building is not one. Keeping the list here rather than in the
 * screen means Go Anywhere, the breadcrumbs and Home cannot disagree about
 * what exists.
 */

export interface Destination {
  route: string;
  label: string;
  icon: string;
  /** One line on what is behind it, shown on the tile. */
  detail: string;
  /**
   * A destination that exists and does not open. Its features are not built,
   * so clicking says so and leaves you where you were.
   */
  locked?: boolean;
}

export interface DestinationGroup {
  label: string;
  items: readonly Destination[];
}

export const DESTINATIONS: readonly DestinationGroup[] = [
  {
    label: 'Your Day',
    items: [
      { route: '/world', label: 'World', icon: '◎', detail: 'Everything there is to do' },
      { route: '/workspace/calendar', label: 'Calendar', icon: '▤', detail: 'Every commitment you have' },
      { route: '/workspace/wellbeing', label: 'Wellbeing', icon: '◍', detail: 'Energy, stress, sleep and rest' },
      { route: '/workspace/relationships', label: 'Relationships', icon: '⚭', detail: 'Everyone you know' },
      { route: '/workspace/history', label: 'History', icon: '❧', detail: 'What the world remembers' },
    ],
  },
  {
    label: 'Money And Things',
    items: [
      { route: '/workspace/bank', label: 'Bank', icon: '▦', detail: 'Accounts, bills, credit and tax' },
      { route: '/workspace/property', label: 'Property', icon: '⌂', detail: 'Buy, build and furnish' },
      { route: '/workspace/vehicles', label: 'Vehicles', icon: '⛁', detail: 'Buy, service and modify' },
      { route: '/workspace/shopping', label: 'Shopping', icon: '⛾', detail: 'Everything you can buy' },
      { route: '/workspace/insurance', label: 'Insurance', icon: '⛨', detail: 'Cover for what you own' },
    ],
  },
  {
    label: 'The Work',
    items: [
      { route: '/workspace/company', label: 'Company', icon: '🎬', detail: 'Under construction', locked: true },
      { route: '/workspace/social', label: 'Social', icon: '◈', detail: 'What you post and who follows' },
    ],
  },
  {
    label: 'Care And Growth',
    items: [
      { route: '/workspace/health', label: 'Health', icon: '✚', detail: 'Care, providers and recovery' },
      { route: '/workspace/education', label: 'Education', icon: '✎', detail: 'Getting better at things' },
      { route: '/workspace/city', label: 'The City', icon: '⌖', detail: 'Where you are and what is here' },
      { route: '/workspace/travel', label: 'Travel', icon: '✈', detail: 'Anywhere else in the world' },
      { route: '/workspace/character', label: 'Character', icon: '☰', detail: 'Attributes, skills and traits' },
      { route: '/workspace/settings', label: 'Settings', icon: '⚙', detail: 'Preferences and your save' },
    ],
  },
];

/** Every destination, flat. */
export const ALL_DESTINATIONS: readonly Destination[] = DESTINATIONS.flatMap((g) => g.items);

/** The ones that do not open, by route. */
export const LOCKED_ROUTES: ReadonlySet<string> = new Set(
  ALL_DESTINATIONS.filter((d) => d.locked).map((d) => d.route),
);
