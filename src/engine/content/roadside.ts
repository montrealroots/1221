/**
 * SLATE — breakdown cover and what a tow costs (the master plan's §40h, from
 * 2026-10-02; `docs/research/world/research-roadside.json`, each club's and
 * each rule's page read that day).
 *
 * **The clubs.** A tier is offered where its dues were read:
 * - AAA Northeast, for New York and Connecticut: its dues load by ZIP code
 *   behind a bot wall, so Basic is its magazine's "as low as $4.30 a month"
 *   with the $15 enrollment fee, and Premier its "never more than $14 a
 *   month"; Plus, whose dues weren't found, isn't offered. Basic tows 3
 *   miles, Premier 100 and one a year 200; four calls a year.
 * - The Automobile Club of Southern California, for California: Classic at
 *   $59 a year, a local guide's figure for August 2026 (the club's dues load
 *   by ZIP); tows 7 miles, four calls. Plus and Premier aren't offered.
 * - CAA South Central Ontario: Basic C$80, Plus C$124, Premier C$154 a year;
 *   tows of 10 and 200 km, and Premier's one of 320; four calls, Premier's
 *   five. Its page doesn't say whether HST is in them.
 * - BCAA: Basic C$97, Plus C$137, Premier C$177 a year before tax; tows of
 *   5 and 160 km, and Premier's one of 320; four calls. GO isn't offered:
 *   its roadside is paid for on the day, at a price not published.
 * - The AA, for Britain: Roadside "from £5.49 a month", unlimited calls, a
 *   repair at the roadside or a tow to a nearby garage. The RAC: Basic from
 *   £5.29 a month and Standard from £8.99, five calls; Extra from £9.49,
 *   unlimited; Standard and Extra take a car anywhere in the UK.
 * - The AA Ireland: "from €5 a month", paid for the year, six calls, a repair
 *   at the roadside; its towing tier's price is by quote only.
 * - Mexico has no club: roadside help comes inside a car policy.
 *
 * AAA and CAA honor each other's members across North America; the British
 * and Irish clubs cover their own country.
 *
 * **A tow without cover**, as each market prices one:
 * - America: CostHelper's consumer guide, a $35 to $100 hook-up and $2.50 to
 *   $5 a mile; SLATE takes the middles, $67.50 and $3.75.
 * - Ontario: Toronto's regulated tow, $261.38 in 2020 and indexed to the
 *   CPI since (the current figure wasn't found), and $3.25 a km past 5, plus
 *   HST; it's set for an accident, and SLATE takes it for a breakdown, which
 *   no rule prices.
 * - British Columbia: ICBC's schedule, $79.78 with the first 6 km and $2.41
 *   a km after.
 * - Mexico: on the road, the SCT's federal tariff, MX$528.69 and MX$18.82 a
 *   km (2017, never indexed); in Mexico City's streets, the middle of a
 *   roadside firm's MX$800 to MX$2,500.
 * - Ireland: the middles of a Dublin firm's guide, €125 with the first 10 km
 *   and €2 a km after.
 * - Britain: no breakdown price without cover was found; a car left on the
 *   road is removed by the police at the statutory £192.
 */

import type { Jurisdiction } from './vehiclefees';

export type Coverage = 'na' | 'gb' | 'ie';

export interface RoadsideTier {
  id: string; club: string; tier: string;
  /** Where its members live. */
  homes: readonly Jurisdiction[];
  /** Where it comes out to. */
  covers: Coverage;
  currency: string;
  /** Dues, a year or a month, and joining's fee. */
  yearly?: number; monthly?: number; enrollment?: number;
  /** Whether tax is added to the dues. */
  plusTax: boolean;
  /** Calls a year; none, unlimited. */
  calls: number | null;
  /** Kilometers a tow is free; null to anywhere in the country. One longer tow a year, where the tier has it. */
  towKm: number | null; longTowKm?: number;
  /** Whose figure the dues are. */
  basis: string;
  source: string;
}

const MI = 1.609344;

export const ROADSIDE_TIERS: readonly RoadsideTier[] = [
  { id: 'aaa-ne-basic', club: 'AAA Northeast', tier: 'Basic', homes: ['US-NY', 'US-CT'], covers: 'na', currency: 'USD', monthly: 4.3, enrollment: 15, plusTax: false, calls: 4, towKm: 3 * MI, basis: 'The club magazine’s “as low as $4.30 a month”, and the $15 enrollment', source: 'https://northeast.aaa.com/membership/join/' },
  { id: 'aaa-ne-premier', club: 'AAA Northeast', tier: 'Premier', homes: ['US-NY', 'US-CT'], covers: 'na', currency: 'USD', monthly: 14, enrollment: 15, plusTax: false, calls: 4, towKm: 100 * MI, longTowKm: 200 * MI, basis: 'The club magazine’s “never more than $14 a month”, and the $15 enrollment', source: 'https://northeast.aaa.com/membership/join/' },
  { id: 'aaa-sc-classic', club: 'Automobile Club Of Southern California', tier: 'Classic', homes: ['US-CA'], covers: 'na', currency: 'USD', yearly: 59, plusTax: false, calls: 4, towKm: 7 * MI, basis: 'A local guide’s $59 a year, August 2026; the club’s dues load by ZIP', source: 'https://www.ace.aaa.com/content/dam/ace/pdf/CA-MemberGuide.pdf' },
  { id: 'caa-sco-basic', club: 'CAA South Central Ontario', tier: 'Basic', homes: ['CA-ON'], covers: 'na', currency: 'CAD', yearly: 80, plusTax: false, calls: 4, towKm: 10, basis: 'The club’s comparison page', source: 'https://www.caasco.com/membership/compare-memberships' },
  { id: 'caa-sco-plus', club: 'CAA South Central Ontario', tier: 'Plus', homes: ['CA-ON'], covers: 'na', currency: 'CAD', yearly: 124, plusTax: false, calls: 4, towKm: 200, basis: 'The club’s comparison page', source: 'https://www.caasco.com/membership/compare-memberships' },
  { id: 'caa-sco-premier', club: 'CAA South Central Ontario', tier: 'Premier', homes: ['CA-ON'], covers: 'na', currency: 'CAD', yearly: 154, plusTax: false, calls: 5, towKm: 200, longTowKm: 320, basis: 'The club’s comparison page', source: 'https://www.caasco.com/membership/compare-memberships' },
  { id: 'bcaa-basic', club: 'BCAA', tier: 'Basic', homes: ['CA-BC'], covers: 'na', currency: 'CAD', yearly: 97, plusTax: true, calls: 4, towKm: 5, basis: 'The club’s plans page, before tax', source: 'https://www.bcaa.com/membership/plans' },
  { id: 'bcaa-plus', club: 'BCAA', tier: 'Plus', homes: ['CA-BC'], covers: 'na', currency: 'CAD', yearly: 137, plusTax: true, calls: 4, towKm: 160, basis: 'The club’s plans page, before tax', source: 'https://www.bcaa.com/membership/plans' },
  { id: 'bcaa-premier', club: 'BCAA', tier: 'Premier', homes: ['CA-BC'], covers: 'na', currency: 'CAD', yearly: 177, plusTax: true, calls: 4, towKm: 160, longTowKm: 320, basis: 'The club’s plans page, before tax', source: 'https://www.bcaa.com/membership/plans' },
  { id: 'aa-roadside', club: 'The AA', tier: 'Roadside Assistance', homes: ['GB'], covers: 'gb', currency: 'GBP', monthly: 5.49, plusTax: false, calls: null, towKm: 0, basis: 'The AA’s “from £5.49 a month”, what at least a tenth of its customers paid', source: 'https://www.theaa.com/breakdown-cover/' },
  { id: 'rac-basic', club: 'RAC', tier: 'Basic', homes: ['GB'], covers: 'gb', currency: 'GBP', monthly: 5.29, plusTax: false, calls: 5, towKm: 0, basis: 'The RAC’s “from” price, what at least a tenth of new customers paid', source: 'https://www.rac.co.uk/breakdown-cover/compare-breakdown-cover' },
  { id: 'rac-standard', club: 'RAC', tier: 'Standard', homes: ['GB'], covers: 'gb', currency: 'GBP', monthly: 8.99, plusTax: false, calls: 5, towKm: null, basis: 'The RAC’s “from” price, what at least a tenth of new customers paid', source: 'https://www.rac.co.uk/breakdown-cover/compare-breakdown-cover' },
  { id: 'rac-extra', club: 'RAC', tier: 'Extra', homes: ['GB'], covers: 'gb', currency: 'GBP', monthly: 9.49, plusTax: false, calls: null, towKm: null, basis: 'The RAC’s “from” price, what at least a tenth of new customers paid', source: 'https://www.rac.co.uk/breakdown-cover/compare-breakdown-cover' },
  { id: 'aa-ireland', club: 'The AA Ireland', tier: 'Rescue', homes: ['IE'], covers: 'ie', currency: 'EUR', yearly: 60, plusTax: false, calls: 6, towKm: 0, basis: 'The AA Ireland’s “from €5 a month”, paid for the year', source: 'https://www.theaa.ie/aa-membership/' },
];

/** Where a car's jurisdiction is covered. */
export const COVERAGE_OF: Readonly<Record<Jurisdiction, Coverage | undefined>> = {
  'US-NY': 'na', 'US-CT': 'na', 'US-CA': 'na', 'CA-ON': 'na', 'CA-BC': 'na', GB: 'gb', IE: 'ie', 'MX-CMX': undefined,
};

/** A tow without cover, in the market's money: a fee, the kilometers it includes, a rate a kilometer after, and tax added. */
export interface TowPrice { fee: number; includedKm: number; perKm: number; currency: string; plusTax: boolean; basis: string }
export const TOW_PRICES: Readonly<Record<Jurisdiction, TowPrice>> = {
  'US-NY': { fee: 67.5, includedKm: 0, perKm: 3.75 / MI, currency: 'USD', plusTax: false, basis: 'CostHelper’s middles, a $67.50 hook-up and $3.75 a mile' },
  'US-CT': { fee: 67.5, includedKm: 0, perKm: 3.75 / MI, currency: 'USD', plusTax: false, basis: 'CostHelper’s middles, a $67.50 hook-up and $3.75 a mile' },
  'US-CA': { fee: 67.5, includedKm: 0, perKm: 3.75 / MI, currency: 'USD', plusTax: false, basis: 'CostHelper’s middles, a $67.50 hook-up and $3.75 a mile' },
  'CA-ON': { fee: 261.38, includedKm: 5, perKm: 3.25, currency: 'CAD', plusTax: true, basis: 'Toronto’s regulated tow, its 2020 rate, and $3.25 a km past 5, plus HST' },
  'CA-BC': { fee: 79.78, includedKm: 6, perKm: 2.41, currency: 'CAD', plusTax: false, basis: 'ICBC’s schedule, $79.78 with 6 km and $2.41 a km after' },
  'MX-CMX': { fee: 528.69, includedKm: 0, perKm: 18.82, currency: 'MXN', plusTax: false, basis: 'The SCT’s federal tariff, MX$528.69 and MX$18.82 a km' },
  IE: { fee: 125, includedKm: 10, perKm: 2, currency: 'EUR', plusTax: false, basis: 'A Dublin firm’s middles, €125 with 10 km and €2 a km after' },
  GB: { fee: 192, includedKm: Infinity, perKm: 0, currency: 'GBP', plusTax: false, basis: 'The police’s statutory removal, £192' },
};
/** In Mexico City's streets: the middle of a roadside firm's MX$800 to MX$2,500. */
export const MX_CITY_TOW = 1650;
