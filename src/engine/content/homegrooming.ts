/**
 * SLATE — a haircut and nails at home (the master plan's §31h, from
 * 2026-10-06), from `docs/research/world/research-home-grooming.json`, read
 * 2026-10-06.
 *
 * **Clippers**, the cheapest mainstream kit read in each market: Wahl's Chrome
 * Pro at Walmart, $19.99; Remington's Quick Cut with nine combs at Argos, £35;
 * Wahl's Deluxe Groom Pro, twenty pieces, at Walmart.ca, C$29.98 (read from the
 * listing page, low confidence). No kit was priced in Ireland or Mexico, so
 * none is sold there. A home user's blades last 12 to 24 months by one
 * seller's advice, too soft a figure to wear them out by, so a kit lasts.
 *
 * **Nails** grow 3.47 mm a month on the fingers and 1.62 on the toes (Yaemsiri
 * and others, 2010, healthy American young adults). A trim takes 1 mm off a
 * fingernail and 2 mm off a toenail, SLATE's estimate: nobody publishes what's
 * cut, and those put a trim about every nine days and every five and a half
 * weeks, inside the one to two weeks and four to six weeks advice pages give
 * (no survey of how often people trim was found).
 */

export interface ClipperKit { country: string; name: string; retailer: string; price: number; currency: string }

export const CLIPPER_KITS: readonly ClipperKit[] = [
  { country: 'us', name: 'Wahl Chrome Pro Hair Clipper Kit', retailer: 'Walmart', price: 19.99, currency: 'USD' },
  { country: 'uk', name: 'Remington Quick Cut Hair Clipper', retailer: 'Argos', price: 35, currency: 'GBP' },
  { country: 'ca', name: 'Wahl Deluxe Groom Pro Haircutting Kit', retailer: 'Walmart', price: 29.98, currency: 'CAD' },
];

/** Nail growth, millimeters a month (Yaemsiri 2010), and what a trim takes off, SLATE's estimate. */
export const NAILS = {
  growthMmMonth: { fingers: 3.47, toes: 1.62 },
  trimMm: { fingers: 1, toes: 2 },
} as const;
