/**
 * SLATE — what a home's special rooms are for, and what they take, from
 * `docs/research/world/research-special-rooms-indoor.json` (read 2026-10-04).
 *
 * - **A sauna**: a 6 kW heater for a two-to-four-person room (Harvia's,
 *   HUUM's and Finnleo's own ranges for 5 to 9 cubic meters), about an hour
 *   to heat, and a session of 14 minutes, the mean of Laukkanen's 2,315 Finnish
 *   men (JAMA 2015, read secondhand).
 * - **A walk-in closet**: hanging 24 inches deep along 12 to 16 feet of rod
 *   for a hundred garments (builders' guides): 14 feet of it, to a 2.3 m
 *   ceiling, about six thousand liters, SLATE's reckoning from those.
 * - **A library**: 8 to 9 books a foot of shelf (CLIR, measured), along about
 *   120 feet of shelving in a spare bedroom (SLATE's estimate from a BILLY's
 *   20 to 23 books a shelf): a thousand books.
 * - **A home theater**: four seats, the commonest configuration a seating
 *   maker reports, and a wide release's 114 minutes, its 2020s average
 *   (Stephen Follows).
 * - **A soundproofed room**: a retrofit's STC 45 to 52, SLATE's estimate,
 *   quiet enough to record in. The SAG-AFTRA Foundation says a voice actor
 *   records auditions at home in "a quiet recording space"; without one, it's
 *   a booth, at each town's studio's own hourly rate (`VO_BOOTHS`).
 */

export const SAUNA = { heaterKw: 6, preheatMinutes: 60, sessionMinutes: 14 } as const;
export const WALK_IN_L = Math.round(14 * 0.3048 * 24 * 0.0254 * 2.3 * 1_000);
export const LIBRARY_BOOKS = 1_000;
export const THEATER = { seats: 4, filmMinutes: 114 } as const;

export interface Booth { cityId: string; studio: string; perHour: number; currency: string; /** Taxes added on top, where the price is quoted before them. */ tax: number; minHours: number; status: 'verified' | 'secondhand' | 'stand-in' }

/** A voice-over booth by the hour in each town: booked an hour at the least where no shorter booking is published, SLATE's reading. */
export const VO_BOOTHS: Readonly<Record<string, Booth>> = {
  'us-ny-newyork': { cityId: 'us-ny-newyork', studio: 'Open Jar Studios, Times Square', perHour: 125, currency: 'USD', tax: 0, minHours: 1, status: 'verified' },
  'us-ca-losangeles': { cityId: 'us-ca-losangeles', studio: 'Voice Trax West, Studio City', perHour: 100, currency: 'USD', tax: 0, minHours: 0.5, status: 'verified' },
  'us-ct-newhaven': { cityId: 'us-ct-newhaven', studio: 'Horizon Music Group, West Haven', perHour: 50, currency: 'USD', tax: 0, minHours: 1, status: 'verified' },
  'uk-eng-london': { cityId: 'uk-eng-london', studio: 'Spotlight’s voiceover booth, Covent Garden', perHour: 70, currency: 'GBP', tax: 0, minHours: 1, status: 'verified' },
  'ie-lei-dublin': { cityId: 'ie-lei-dublin', studio: 'The Podcast Studios, Magennis Place', perHour: 70, currency: 'EUR', tax: 0, minHours: 1, status: 'secondhand' },
  'ca-on-toronto': { cityId: 'ca-on-toronto', studio: 'TAPA’s B Street Recording Studio', perHour: 40, currency: 'CAD', tax: 0.13, minHours: 1, status: 'verified' },
  'ca-bc-vancouver': { cityId: 'ca-bc-vancouver', studio: 'Monarch Studios', perHour: 250, currency: 'CAD', tax: 0, minHours: 2, status: 'verified' },
  'mx-cmx-mexicocity': { cityId: 'mx-cmx-mexicocity', studio: 'Elemento, Roma Norte', perHour: 399, currency: 'MXN', tax: 0, minHours: 1, status: 'verified' },
};
/** A voice-over audition's session: 15 to 20 minutes recording and 10 to 15 editing (Voice Trax West). */
export const VO_SESSION_MINUTES = 30;
