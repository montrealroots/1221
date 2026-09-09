/**
 * Everywhere you can go, in one list.
 *
 * This used to live inside the shell as a left-hand rail. It is a plain list
 * now because the rail is gone: Home is the hub, and a hub that is missing
 * half the building is not one. Keeping the list here rather than in the
 * screen means Go Anywhere, the breadcrumbs and Home cannot disagree about
 * what exists.
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
}

export interface DestinationGroup {
  label: string;
  items: readonly Destination[];
}

export const DESTINATIONS: readonly DestinationGroup[] = [
  {
    label: 'Your Day',
    items: [
      { route: '/world', label: 'World', detail: 'Everything there is to do' },
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Every commitment you have' },
      { route: '/workspace/wellbeing', label: 'Wellbeing', detail: 'Energy, stress, sleep and rest' },
      { route: '/workspace/relationships', label: 'Relationships', detail: 'Everyone you know' },
      { route: '/workspace/history', label: 'History', detail: 'What the world remembers' },
    ],
  },
  {
    label: 'Money And Things',
    items: [
      { route: '/workspace/bank', label: 'Bank', detail: 'Accounts, bills, credit and tax' },
      { route: '/workspace/property', label: 'Property', detail: 'Buy, build and furnish' },
      { route: '/workspace/vehicles', label: 'Vehicles', detail: 'Buy, service and modify' },
      { route: '/workspace/shopping', label: 'Shopping', detail: 'Everything you can buy' },
      { route: '/workspace/insurance', label: 'Insurance', detail: 'Cover for what you own' },
    ],
  },
  {
    label: 'The Work',
    items: [
      { route: '/workspace/casting', label: 'Casting', detail: 'Locked until the industry milestone', locked: true },
      { route: '/workspace/phone', label: 'Phone', detail: 'Your handset, and the apps on it' },
      { route: '/workspace/film', label: 'Film', detail: 'Kit, shoot days and pictures of your own' },
      { route: '/workspace/social', label: 'Social', detail: 'What you post and who follows' },
    ],
  },
  {
    label: 'Care And Growth',
    items: [
      { route: '/workspace/health', label: 'Health', detail: 'Care, providers and recovery' },
      { route: '/workspace/education', label: 'Education', detail: 'Getting better at things' },
      { route: '/workspace/track', label: 'Track', detail: 'The season, the work and every time you have run' },
      { route: '/workspace/city', label: 'The City', detail: 'Where you are and what is here' },
      { route: '/workspace/goingout', label: 'Going Out', detail: 'The cinema, what is on in town, and the fashion weeks' },
      { route: '/workspace/travel', label: 'Travel', detail: 'Anywhere else in the world' },
      { route: '/workspace/character', label: 'Character', detail: 'Attributes, skills and traits' },
      { route: '/workspace/settings', label: 'Settings', detail: 'Preferences and your save' },
    ],
  },
];

/** Every destination, flat. */
export const ALL_DESTINATIONS: readonly Destination[] = DESTINATIONS.flatMap((g) => g.items);

/** The ones that do not open, by route. */
export const LOCKED_ROUTES: ReadonlySet<string> = new Set(
  ALL_DESTINATIONS.filter((d) => d.locked).map((d) => d.route),
);
