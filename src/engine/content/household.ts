/**
 * SLATE — a partner's earnings, marriage and divorce, by place (Stage 10 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-household-economics.json`, read 2026-10-01.
 *
 * **Earnings.** A partner works at their country's employment rate for
 * ages 25 to 54 (OECD, 2026 Q2) and earns a full-time salary drawn from
 * its published spread:
 * - America: the BLS's deciles for full-time workers 25 and over, 2026 Q2,
 *   weekly times 52.
 * - Britain: ASHE 2025's full-time 30 to 39.
 * - Ireland: the CSO's 2024 median for 30 to 39, and Canada: Statistics
 *   Canada's 2025 full-time median for 25 to 54; neither publishes the
 *   spread, so each takes Britain's and America's shape around its median,
 *   SLATE's reading.
 * - Mexico: INEGI's ENOE, 2026 Q2, workers by multiples of the monthly
 *   minimum wage (MX$9,582.47), within a band taken evenly, and above five
 *   minimums up to eight, SLATE's reading.
 * Actors' partners are taken as anybody's: most actors earn their living
 * otherwise, and SLATE keeps no actor's earnings but its player's.
 *
 * **Marriage**, where it's done and what it costs: the license or notice,
 * the waiting before the ceremony, and a civil ceremony's fee; a wedding at
 * the country's published average: The Knot Worldwide's for America (2025's
 * weddings, read from a search's summary) and Britain (£21,990, read from
 * its page), weddingsonline.ie's for Ireland (excluding the honeymoon), a
 * Spring Financial guide's C$30,000 for Canada (a search's summary), and
 * bodas.com.mx's MX$180,000 for Mexico.
 *
 * **Divorce**: the court's fees, the least time the law asks, and how the
 * property is divided. California, British Columbia and a Mexico City
 * marriage in community each divide what was made in the marriage in half;
 * Ontario equalizes, the one who gained more paying half the difference;
 * New York's and Connecticut's equitable distribution, England's equality
 * as a yardstick, and Ireland's proper provision leave it to the judge,
 * and SLATE takes half, the yardstick. Separate property is kept.
 */

export interface Spread { p10: number; p25: number; median: number; p75: number; p90: number }

export interface EarningsRule { currency: string; employed: number; spread?: Spread; minimumMonthly?: number; bands?: readonly { share: number; from: number; to: number }[] }

const US: Spread = { p10: 34_892, p25: 46_436, median: 69_160, p75: 104_208, p90: 160_264 };
const UK: Spread = { p10: 25_041, p25: 30_717, median: 40_668, p75: 54_620, p90: 75_041 };
const shaped = (shape: Spread, median: number): Spread => ({ p10: median * shape.p10 / shape.median, p25: median * shape.p25 / shape.median, median, p75: median * shape.p75 / shape.median, p90: median * shape.p90 / shape.median });

export const EARNINGS: Readonly<Record<string, EarningsRule>> = {
  us: { currency: 'USD', employed: 0.8058, spread: US },
  uk: { currency: 'GBP', employed: 0.844, spread: UK },
  ie: { currency: 'EUR', employed: 0.845, spread: shaped(UK, 49_165) },
  ca: { currency: 'CAD', employed: 0.8343, spread: shaped(US, 72_800) },
  // Shares of the employed whose income was stated, by minimum wages a month.
  mx: { currency: 'MXN', employed: 0.7401, minimumMonthly: 9_582.47, bands: [
    { share: 4.5, from: 0, to: 0 }, { share: 46.5, from: 0, to: 1 }, { share: 31.6, from: 1, to: 2 }, { share: 5.8, from: 2, to: 3 }, { share: 2.3, from: 3, to: 5 }, { share: 0.7, from: 5, to: 8 },
  ] },
};

export interface MarriageRule { currency: string; fee: number; waitDays: number; basis: string }
/** By the place's key (`placeKey`): the license or notice and the civil ceremony, together. */
export const MARRIAGE: Readonly<Record<string, MarriageRule>> = {
  'us-ny-newyork': { currency: 'USD', fee: 35, waitDays: 1, basis: 'The City Clerk’s license, a day’s wait' },
  'us-ca': { currency: 'USD', fee: 91 + 35, waitDays: 0, basis: 'Los Angeles County’s license and civil ceremony' },
  'us-ct': { currency: 'USD', fee: 50, waitDays: 2, basis: 'The town clerk’s license, two days’ wait' },
  uk: { currency: 'GBP', fee: 2 * 46.5 + 62 + 12.5, waitDays: 29, basis: 'Notice for you both, the register office ceremony and the certificate, after 29 days’ notice' },
  ie: { currency: 'EUR', fee: 200, waitDays: 92, basis: 'The HSE’s notification, three months ahead' },
  'ca-on': { currency: 'CAD', fee: 180, waitDays: 0, basis: 'Toronto’s license' },
  'ca-bc': { currency: 'CAD', fee: 100 + 75, waitDays: 0, basis: 'A license and a commissioner’s ceremony' },
  mx: { currency: 'MXN', fee: 1_652, waitDays: 0, basis: 'The Registro Civil’s ceremony in its office' },
};

/** A wedding's published average, by country, where one is. */
export const WEDDING: Readonly<Record<string, { amount: number; currency: string }>> = {
  us: { amount: 34_200, currency: 'USD' }, uk: { amount: 21_990, currency: 'GBP' }, ie: { amount: 36_641, currency: 'EUR' }, ca: { amount: 30_000, currency: 'CAD' }, mx: { amount: 180_000, currency: 'MXN' },
};

export type Division = 'half' | 'equalize';
export interface DivorceRule { currency: string; fee: number; waitDays: number; division: Division; basis: string }
export const DIVORCE: Readonly<Record<string, DivorceRule>> = {
  'us-ny-newyork': { currency: 'USD', fee: 210 + 95 + 30, waitDays: 183, division: 'half', basis: 'New York’s index number, judicial intervention and note of issue, after six months’ breakdown' },
  'us-ca': { currency: 'USD', fee: 435, waitDays: 183, division: 'half', basis: 'California’s petition, and six months before it’s final' },
  'us-ct': { currency: 'USD', fee: 360, waitDays: 90, division: 'half', basis: 'Connecticut’s entry fee, and ninety days' },
  uk: { currency: 'GBP', fee: 628, waitDays: 26 * 7, division: 'half', basis: 'England’s application, twenty weeks to the conditional order and six more to the final' },
  ie: { currency: 'EUR', fee: 0, waitDays: 730, division: 'half', basis: 'No court fee, after two years apart' },
  'ca-on': { currency: 'CAD', fee: 214 + 445 + 10, waitDays: 365, division: 'equalize', basis: 'Ontario’s application, hearing and the central registry, after a year apart' },
  'ca-bc': { currency: 'CAD', fee: 210 + 80, waitDays: 365, division: 'half', basis: 'BC’s claim and the desk order, after a year apart' },
  mx: { currency: 'MXN', fee: 0, waitDays: 0, division: 'half', basis: 'Mexico City’s no-fault divorce, no court fee' },
};

/** The rule's key for a town: New York City's own, a state's or province's, or a country's. */
export function placeKey(cityId: string): string {
  if (cityId.startsWith('us-ny-newyork')) return 'us-ny-newyork';
  const [country, region] = cityId.split('-');
  if (country === 'us' || country === 'ca') return `${country}-${region}`;
  return country === 'mx' ? 'mx' : country!;
}

/**
 * A marriage's yearly chance of ending, by its year, from Statistics
 * Canada's 2008 rates per 1,000 by duration (a peak of 30 in the third
 * year, 18 in the tenth, 10 in the twentieth), between them by a line and
 * after the twentieth held at 10; the first year's start, 10, is SLATE's
 * estimate, none being published. Taken in North America. England's 2013
 * cohort, 16.8% ended by the tenth anniversary, is 1.82% a year, taken in
 * Britain and Ireland.
 */
export function divorceRate(years: number, country: string): number {
  if (country === 'uk' || country === 'ie') return 1 - Math.pow(1 - 0.168, 1 / 10);
  const points: [number, number][] = [[0, 10], [3, 30], [10, 18], [20, 10]];
  if (years >= 20) return 10 / 1000;
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i]!;
    const [x0, y0] = points[i - 1]!;
    if (years <= x1) return (y0 + (y1 - y0) * (years - x0) / (x1 - x0)) / 1000;
  }
  return 10 / 1000;
}
