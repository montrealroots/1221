/**
 * Everywhere you can go, in one list.
 *
 * Keeping the list here rather than in the screen means the rail, the
 * breadcrumbs, Home and each screen's eyebrow cannot disagree about what
 * exists or what part of life it's in.
 *
 * A destination's name is text. A destination that existed and didn't open,
 * `locked`, went on 2026-09-27: none had been for a long time.
 *
 * **Groups** are what the player wants to do, from 2026-10-08: their day,
 * the people in it, their work, getting around, their things, their money,
 * and their affairs. Until then People and belongings sat under Your Day and
 * land under Your Money, and the rail listed none of them: every place was
 * offered on Home only (`homeOnly`, at the owner's word on 2026-10-02), the
 * rail keeping Home, the search, and the places pinned or lately visited. The
 * owner's brief of 2026-10-08 asked for a sidebar that makes them easy to find,
 * so the rail lists every group again, each folding away, and a screen's own
 * sections under it while it's open (`ui/shell/sections.ts`). Home still
 * offers every place too.
 *
 * **Icons**, from the same date: each group has one, drawn as an inline
 * picture beside the group's name and hidden from a screen reader, which has
 * the name. The rail said in 2026-09 that a glyph is no label, because an
 * emoji can be a picture on one platform and a box on another; a drawn path
 * is the same everywhere, and the word stays beside it.
 */

export type GroupIcon = 'day' | 'people' | 'work' | 'travel' | 'things' | 'money' | 'affairs';

export interface Destination {
  route: string;
  label: string;
  /** One line on what is behind it, shown on the tile and as the rail item's hint. */
  detail: string;
}

export interface DestinationGroup {
  label: string;
  icon: GroupIcon;
  items: readonly Destination[];
}

export const DESTINATIONS: readonly DestinationGroup[] = [
  {
    label: 'Your Day',
    icon: 'day',
    items: [
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Every commitment you have' },
      { route: '/workspace/routines', label: 'Routines', detail: 'The things you do in order, saved' },
      { route: '/workspace/food', label: 'Food', detail: 'Your kitchen, the shops, a bar and the restaurants' },
      { route: '/workspace/clothes', label: 'Clothes', detail: 'What you wear, the wash and the shops' },
    ],
  },
  {
    label: 'People',
    icon: 'people',
    items: [
      { route: '/workspace/people', label: 'People', detail: 'Who you know, and time together' },
    ],
  },
  {
    label: 'Your Work',
    icon: 'work',
    items: [
      { route: '/workspace/school', label: 'Your School', detail: 'Your standing, classes, casting and terms' },
      { route: '/workspace/career', label: 'Your Career', detail: 'Your agency, auditions, work and unions' },
      { route: '/workspace/industry', label: 'The Industry', detail: 'Real films and series, the companies, and this save’s projects' },
    ],
  },
  {
    label: 'Getting Around',
    icon: 'travel',
    items: [
      { route: '/workspace/travel', label: 'Travel', detail: 'A journey by air or train, a hotel, and the way home' },
      { route: '/workspace/vehicles', label: 'Cars', detail: 'A car of your own, to buy, keep and run' },
    ],
  },
  {
    label: 'Your Things',
    icon: 'things',
    items: [
      { route: '/workspace/belongings', label: 'Belongings', detail: 'What you own, and where each thing is' },
      { route: '/workspace/homes', label: 'Homes', detail: 'Homes for sale where you live, and the one you own' },
      { route: '/workspace/land', label: 'Land', detail: 'A parcel of your own, to buy, split, combine and sell' },
    ],
  },
  {
    label: 'Your Money',
    icon: 'money',
    items: [
      { route: '/workspace/bank', label: 'Your Bank', detail: 'Your accounts, and moving money between them' },
    ],
  },
  {
    // Until 2026-09-29 Papers sat under Your Money; with the passport and the license it's more than money.
    label: 'Your Affairs',
    icon: 'affairs',
    items: [
      { route: '/workspace/papers', label: 'Papers', detail: 'Your returns, health cover, unemployment, passport and license' },
    ],
  },
];

/** What the rail offers: every group. Until 2026-10-08 it was only what Home didn't keep, which was nothing. */
export const RAIL_DESTINATIONS: readonly DestinationGroup[] = DESTINATIONS;

/** Every destination, flat. */
export const ALL_DESTINATIONS: readonly Destination[] = DESTINATIONS.flatMap((g) => g.items);

/**
 * The group a place sits in, as the rail says it: the eyebrow over its page,
 * so a screen and the rail never name its part of life differently. Until
 * 2026-10-02 each page typed its own, and Cars and Travel said "Your Day"
 * while the rail put them under Getting Around.
 */
export const groupLabelOf = (route: string): string => DESTINATIONS.find((g) => g.items.some((i) => route === i.route || route.startsWith(`${i.route}/`)))?.label ?? '';
/** The group a route is in, by its label's place in the list. */
export const groupOf = (route: string): DestinationGroup | undefined => DESTINATIONS.find((g) => g.items.some((i) => route === i.route || route.startsWith(`${i.route}/`)));
