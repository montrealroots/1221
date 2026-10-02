/**
 * SLATE — a trip on errands in a town (Stage 7 of `docs/BACKLOG.md`, from
 * 2026-10-01): how far each leg goes, how long it takes there, what parking
 * costs, and where fuel is bought (`docs/research/world/research-errands.json`).
 *
 * **A leg** is an average trip of its kind, the length homes don't publish
 * to the shop around the corner:
 * - America and Canada: the 2022 NHTS's vehicle trip to shop, 5.8 miles,
 *   and for other errands, the post office or the dry cleaner, 8.7 (FHWA,
 *   Summary of Travel Trends, Table 3-5). Canada's taken as America's.
 * - Britain, Ireland and Mexico: England's 2024 National Travel Survey, 620
 *   miles a year of shopping over 167 shopping trips, 3.71 miles a trip;
 *   Ireland's and Mexico City's taken as England's, both denser than an
 *   American town.
 * - On foot, England's 230 miles a year over 267 walks, 0.86 miles a walk,
 *   at three miles an hour, the pace a walk is usually reckoned at.
 *
 * **Time on the road** is TomTom's Traffic Index for 2025: the average
 * minutes to drive a kilometer in the town (New York's from the 2024
 * index; Vancouver's the mean of its two rush hours, its all-day figure not
 * published). New Haven isn't in the index, and takes Los Angeles's
 * free-flow 58 seconds a kilometer, SLATE's reading.
 *
 * **Parking** at a meter, for the minutes stopped, at a representative
 * zone's hourly rate: New York's Manhattan south of 96th Street ($5 the
 * first hour); Los Angeles's $1.50 base; New Haven's $1.50; Westminster's
 * zone A, £4.70 (2 March 2026); Dublin's yellow zone, €4; downtown Toronto's
 * about $5 with HST; Mexico City's MX$13.60 (art. 259 of its 2026 fiscal
 * code). Vancouver prices each block by demand and publishes no one rate,
 * so a stop there isn't charged.
 *
 * **Fuel** is bought at a named station of the town, at AAA's, DESNZ's, AA
 * Ireland's, Kalibrate's and the CRE's published prices for the area,
 * already kept in `content/vehiclefees.ts`.
 */

const MI = 1.609344;

export type LegKind = 'shopping' | 'errand';

/** A leg's kilometers, by market: America and Canada; Britain, Ireland and Mexico. */
export const LEG_KM: Readonly<Record<'na' | 'eu', Record<LegKind, number>>> = {
  na: { shopping: 5.8 * MI, errand: 8.7 * MI },
  eu: { shopping: (620 / 167) * MI, errand: (620 / 167) * MI },
};
export const WALK_KM = (230 / 267) * MI;
export const WALK_KMH = 3 * MI;

/** Minutes to drive a kilometer in the town (TomTom). */
export const MIN_PER_KM: Readonly<Record<string, number>> = {
  'us-ny-newyork': 31 / 10,
  'us-ca-losangeles': 15.5 / 10,
  'us-ct-newhaven': 58 / 60,
  'uk-eng-london': (36 + 20 / 60) / 10,
  'ie-lei-dublin': (34 + 29 / 60) / 10,
  'ca-on-toronto': (26 + 40 / 60) / 10,
  'ca-bc-vancouver': ((29 + 33 / 60) + (35 + 18 / 60)) / 2 / 10,
  'mx-cmx-mexicocity': (34 + 30 / 60) / 10,
};

/** A meter's hourly rate, in the town's money; none where none is published. */
export const METER: Readonly<Record<string, { perHour: number; currency: string; zone: string }>> = {
  'us-ny-newyork': { perHour: 5, currency: 'USD', zone: 'Manhattan south of 96th Street' },
  'us-ca-losangeles': { perHour: 1.5, currency: 'USD', zone: 'the city’s base rate' },
  'us-ct-newhaven': { perHour: 1.5, currency: 'USD', zone: 'a one-hour meter' },
  'uk-eng-london': { perHour: 4.7, currency: 'GBP', zone: 'Westminster, zone A' },
  'ie-lei-dublin': { perHour: 4, currency: 'EUR', zone: 'the yellow zone' },
  'ca-on-toronto': { perHour: 5, currency: 'CAD', zone: 'downtown' },
  'mx-cmx-mexicocity': { perHour: 13.6, currency: 'MXN', zone: 'a parquímetro zone' },
};

/** A station in the town fuel is bought at. */
export const STATIONS: Readonly<Record<string, readonly string[]>> = {
  'us-ny-newyork': ['BP, 255 E 125th St', 'Shell, 232 W 145th St', 'BP, 3936 10th Ave'],
  'us-ca-losangeles': ['Chevron, 2065 S La Cienega Blvd', 'Chevron, 3300 S La Cienega Blvd'],
  'us-ct-newhaven': ['Mobil, 284 Whalley Ave', 'CITGO, 801 Whalley Ave', 'Mobil, 1474 Whalley Ave'],
  'uk-eng-london': ['Esso, 77-83 Park Lane', 'Shell, 106 Old Brompton Road', 'Esso, Marylebone Road'],
  'ie-lei-dublin': ['Maxol, 134 Richmond Road', 'Maxol, Ringsend Road', 'Applegreen, 16 Ballinteer Avenue'],
  'ca-on-toronto': ['Petro-Canada, 117 Jarvis St', 'Esso, 1110 Bathurst St', 'Esso, 3069 Bathurst St'],
  'ca-bc-vancouver': ['Esso, 1205 Burrard St', 'Chevron, 1900 Burrard St', 'Esso, 1795 W Broadway'],
  'mx-cmx-mexicocity': ['TotalEnergies, Av. Insurgentes Sur 507', 'BP, Av. Ribera de San Cosme 114', 'Pemex, Dr. José María Vértiz 431'],
};

/** Minutes a fuel stop takes, SLATE's estimate. */
export const FUEL_STOP_MINUTES = 10;
