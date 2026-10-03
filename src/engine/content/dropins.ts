/**
 * SLATE — yoga and dance classes taken one at a time, at a studio's own
 * single-class price (the master plan's §54, from 2026-10-03;
 * `docs/research/world/research-life-gaps.json`, each studio's own page
 * unless marked), and each at the 2024 Adult Compendium's METs for the kind:
 * yoga, general, 2.3 (02175); hot yoga 3.0 (02155); a ballet, modern or jazz
 * class 5.0 (03010); jazz dancing 4.5 (03078). No studio publishes how long a
 * class runs, so it's an hour, SLATE's reading.
 *
 * Not kept: CorePower's drop-in (read only from a summary), Tantra Fitness's
 * aerial classes (no Compendium MET), and the salsa schools priced only by
 * promotion or course.
 */

export interface DropIn { id: string; cityId: string; studio: string; kind: string; label: string; price: number; currency: string; taxIncluded: boolean; met: number; confirmed: boolean }

export const DROP_INS: readonly DropIn[] = [
  { id: 'bdc-open-class', cityId: 'us-ny-newyork', studio: 'Broadway Dance Center', kind: 'dance', label: 'An Open Dance Class', price: 29, currency: 'USD', taxIncluded: false, met: 5.0, confirmed: true },
  { id: 'new-york-yoga', cityId: 'us-ny-newyork', studio: 'New York Yoga', kind: 'yoga', label: 'A Yoga Class', price: 39, currency: 'USD', taxIncluded: false, met: 2.3, confirmed: true },
  { id: 'millennium-dance', cityId: 'us-ca-losangeles', studio: 'Millennium Dance Complex', kind: 'dance', label: 'A Drop-In Dance Class', price: 23, currency: 'USD', taxIncluded: false, met: 5.0, confirmed: true },
  { id: 'breathing-room-yoga', cityId: 'us-ct-newhaven', studio: 'Breathing Room', kind: 'yoga', label: 'A Yoga Class', price: 26, currency: 'USD', taxIncluded: false, met: 2.3, confirmed: true },
  { id: 'elm-city-dance', cityId: 'us-ct-newhaven', studio: 'Elm City Dance Collective', kind: 'dance', label: 'A Drop-In Dance Class (Read Secondhand)', price: 20, currency: 'USD', taxIncluded: false, met: 5.0, confirmed: false },
  { id: 'fierce-grace', cityId: 'uk-eng-london', studio: 'Fierce Grace', kind: 'hot-yoga', label: 'A Hot Yoga Class', price: 17, currency: 'GBP', taxIncluded: true, met: 3.0, confirmed: true },
  { id: 'pineapple-jazz-funk', cityId: 'uk-eng-london', studio: 'Pineapple Dance Studios', kind: 'dance', label: 'Beginner Jazz Funk (Read Secondhand)', price: 13, currency: 'GBP', taxIncluded: true, met: 4.5, confirmed: false },
  { id: 'yogahub', cityId: 'ie-lei-dublin', studio: 'yogahub', kind: 'yoga', label: 'A Yoga Class', price: 22, currency: 'EUR', taxIncluded: true, met: 2.3, confirmed: true },
  { id: 'kula-yoga', cityId: 'ca-on-toronto', studio: 'Kula Yoga', kind: 'yoga', label: 'A Yoga Class', price: 30, currency: 'CAD', taxIncluded: false, met: 2.3, confirmed: true },
  { id: 'blanco-yoga', cityId: 'mx-cmx-mexicocity', studio: 'Blanco Yoga', kind: 'yoga', label: 'Una Clase Suelta De Yoga', price: 350, currency: 'MXN', taxIncluded: true, met: 2.3, confirmed: true },
];

/** A class's minutes: SLATE's reading, no studio publishing one. */
export const DROP_IN_MINUTES = 60;
