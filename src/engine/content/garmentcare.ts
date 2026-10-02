/**
 * SLATE — how a garment is worn, washed and worn out (Stage 3 of
 * `docs/BACKLOG.md`, from 2026-10-01), researched in
 * `docs/research/world/research-clothing-services.json`.
 *
 * Wears between washes, by kind:
 * - The American Cleaning Institute: underwear, socks and T-shirts after
 *   every wear; leggings and workout clothes the same; bras every 2 to 3;
 *   pajamas every 3 to 4; jeans about 3; a wool suit 3 to 4 before dry
 *   cleaning; coats once or twice a season.
 * - Utah State University Extension: sweaters every 3 to 4, trousers 3 to 4.
 * - Which? (August 2026): a dress 1 to 3.
 * - Daystar et al. (2019): an American wears a knit collared shirt 1.8 days
 *   before washing it, and trousers 3.05.
 * SLATE takes the middle of each range. A coat's "once or twice a season" is
 * taken as twice in a season of 90 days worn.
 *
 * How many washes a garment lasts, from Daystar et al.'s six-country survey:
 * a T-shirt 17.3, a knit collared shirt 22.2, woven trousers 23.5. Each wash
 * takes that share off its condition. The other kinds take the nearest of
 * the three, SLATE's reading: a sweater a T-shirt's, a dress, suit or coat
 * the trousers'. Shoes and accessories aren't washed; their wear comes with
 * the services that repair them.
 */

/** Where a garment goes on the body, which decides what an outfit needs. */
export type Slot = 'top' | 'bottom' | 'dress' | 'suit' | 'outer' | 'underwear' | 'socks' | 'shoes' | 'sleep' | 'active' | 'accessory' | 'towel';

/** How it's cleaned: in a machine, by hand, or only by a dry cleaner (the FTC's Care Labeling Rule). */
export type Care = 'wash' | 'hand' | 'dry-clean';

export interface CareRule { wearsBetween: number; lifetimeWashes: number | null; source: string }

export const CARE_BY_KIND: Readonly<Record<string, CareRule>> = {
  underwear: { wearsBetween: 1, lifetimeWashes: 17.3, source: 'ACI: after each wearing' },
  socks: { wearsBetween: 1, lifetimeWashes: 17.3, source: 'ACI: after each wearing' },
  bra: { wearsBetween: 2.5, lifetimeWashes: 17.3, source: 'ACI and Which?: 2 to 3 wears' },
  't-shirt': { wearsBetween: 1, lifetimeWashes: 17.3, source: 'ACI: after each wearing; Daystar: 17.3 washes' },
  shirt: { wearsBetween: 1.8, lifetimeWashes: 22.2, source: 'Daystar: 1.8 days in the US, 22.2 washes' },
  sweater: { wearsBetween: 3.5, lifetimeWashes: 17.3, source: 'USU Extension: every 3 to 4 wears' },
  jeans: { wearsBetween: 3, lifetimeWashes: 23.5, source: 'ACI: about 3 wears; Daystar: 23.5 washes' },
  trousers: { wearsBetween: 3.05, lifetimeWashes: 23.5, source: 'Daystar: 3.05 days in the US, 23.5 washes' },
  skirt: { wearsBetween: 3.05, lifetimeWashes: 23.5, source: 'As trousers' },
  dress: { wearsBetween: 2, lifetimeWashes: 23.5, source: 'Which?: 1 to 3 wears' },
  suit: { wearsBetween: 3.5, lifetimeWashes: 23.5, source: 'ACI: 3 to 4 wears for wool before dry cleaning' },
  coat: { wearsBetween: 45, lifetimeWashes: 23.5, source: 'ACI and Which?: once or twice a season' },
  pajamas: { wearsBetween: 3.5, lifetimeWashes: 17.3, source: 'ACI: after 3 or 4 wears' },
  active: { wearsBetween: 1, lifetimeWashes: 17.3, source: 'ACI: leggings after every wear; Which?: workout gear 1 wear' },
  shoes: { wearsBetween: Infinity, lifetimeWashes: null, source: 'Not washed' },
  accessory: { wearsBetween: Infinity, lifetimeWashes: null, source: 'Not washed' },
  // From 2026-10-02: a bath towel is used after a shower and washed with the clothes. How many washes one lasts isn't published.
  towel: { wearsBetween: 3, lifetimeWashes: null, source: 'Cleveland Clinic: wash a bath towel after three uses' },
};

/** The care rule for a kind of garment, or a T-shirt's where none is named. */
export const careFor = (kind: string): CareRule => CARE_BY_KIND[kind] ?? CARE_BY_KIND['t-shirt']!;
