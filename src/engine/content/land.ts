/**
 * SLATE — land (docs/WORLD.md, stage 4), from 2026-09-29: vacant parcels
 * where one lives, their price, the taxes on buying, holding and selling
 * them, and the rules for splitting and combining them. Researched and kept
 * with every source in `docs/research/world/research-land.json`.
 *
 * **Prices.** A town lot is priced at the published value of land an acre
 * there, times its acres: the FHFA's average land value an acre under
 * single-family homes by county (2022, the series' latest; SLATE holds it
 * there), and for London the government's value of land with residential
 * planning permission by borough (April 2019, its latest edition; held).
 * Acreage is priced at the latest farmland survey: USDA's 2026 farm real
 * estate by state, FCC's 2025 cultivated land by region, Knight Frank's
 * England index for Q2 2026 and SCSI and Teagasc's Leinster good land for
 * 2025 (both read secondhand). Mexico City's official land values are
 * published only as scanned images, so SLATE sells no land there, and says
 * so.
 *
 * **Lots.** A town lot is the zoning's minimum: New York City's R2, 2,850
 * sq ft since 5 December 2024; Los Angeles's R1, 5,000; New Haven's RS-2,
 * 4,000 since 4 October 2021. London's plot is SLATE's reading of a
 * terrace's, 200 m², there being no minimum. Acreage comes in the sizes
 * SLATE offers.
 */

export type LandPlace = 'nyc' | 'ny-state' | 'new-haven' | 'ct-state' | 'los-angeles' | 'ca-state' | 'london' | 'england' | 'leinster' | 'ontario' | 'bc';

export interface LandMarket {
  /** Where it's offered from: the town one lives in. */
  cityId: string;
  place: LandPlace;
  label: string;
  currency: string;
  /** The value an acre, whole units, and the year it's for. */
  perAcre: number;
  year: string;
  basis: string;
  /** A town lot's area in acres, or acreage's sizes. */
  sizes: readonly number[];
  kind: 'lot' | 'acreage';
  /** A lot's zoning, and the least a lot may be to build on, in acres. */
  zoning?: { name: string; minAcres: number; builds: string };
  /**
   * Where farmland is: the town a house built on it stands in, which its
   * value moves with. Leinster's is Naas, Kildare's county town, whose
   * contribution a house pays; Ontario's Millbrook, in Cavan Monaghan, whose
   * permit it pays; British Columbia's Sechelt, on the Sunshine Coast, whose
   * permit it pays. America's are SLATE's choice of a farm town: Hudson, in
   * Columbia County; Litchfield; Bakersfield, in Kern County. England's is
   * none, no house being built on it. Until 2026-09-29 a house on farmland
   * stood in the city the land was bought from, New York's upstate farm in
   * Manhattan.
   */
  town?: string;
  /** Farmland's latest yearly change, from the same source, taken for the year until its next edition (`systems/land.ts`); none on a lot, which moves with the town's home market. */
  yearlyChange: number;
}

const SQFT_PER_ACRE = 43_560;
const M2_PER_ACRE = 4_046.8564224;
const HA_PER_ACRE = 0.40468564224;

export const LAND_MARKETS: readonly LandMarket[] = [
  // New York City: Brooklyn, Queens and Staten Island (the FHFA has no Manhattan or Bronx figure).
  { cityId: 'us-ny-newyork', place: 'nyc', label: 'A Lot In Brooklyn', currency: 'USD', perAcre: 15_217_700, year: '2022', basis: 'the FHFA’s average land value an acre under single-family homes, Kings County, 2022', sizes: [2_850 / SQFT_PER_ACRE], kind: 'lot', zoning: { name: 'R2', minAcres: 2_850 / SQFT_PER_ACRE, builds: 'a one- or two-family house, to a floor area of 0.75 of the lot' }, yearlyChange: 0 },
  { cityId: 'us-ny-newyork', place: 'nyc', label: 'A Lot In Queens', currency: 'USD', perAcre: 5_922_100, year: '2022', basis: 'the FHFA’s average land value an acre under single-family homes, Queens County, 2022', sizes: [2_850 / SQFT_PER_ACRE], kind: 'lot', zoning: { name: 'R2', minAcres: 2_850 / SQFT_PER_ACRE, builds: 'a one- or two-family house, to a floor area of 0.75 of the lot' }, yearlyChange: 0 },
  { cityId: 'us-ny-newyork', place: 'nyc', label: 'A Lot On Staten Island', currency: 'USD', perAcre: 3_561_000, year: '2022', basis: 'the FHFA’s average land value an acre under single-family homes, Richmond County, 2022', sizes: [2_850 / SQFT_PER_ACRE], kind: 'lot', zoning: { name: 'R2', minAcres: 2_850 / SQFT_PER_ACRE, builds: 'a one- or two-family house, to a floor area of 0.75 of the lot' }, yearlyChange: 0 },
  { cityId: 'us-ny-newyork', place: 'ny-state', label: 'Farmland Upstate', town: 'us-ny-hudson', currency: 'USD', perAcre: 4_500, year: '2026', basis: 'USDA’s farm real estate value, New York, 1 January 2026', sizes: [10, 40, 100], kind: 'acreage', yearlyChange: 0.047 },
  { cityId: 'us-ct-newhaven', place: 'new-haven', label: 'A Lot In New Haven', currency: 'USD', perAcre: 269_500, year: '2022', basis: 'the FHFA’s average land value an acre under single-family homes, New Haven County, 2022', sizes: [4_000 / SQFT_PER_ACRE, 0.25], kind: 'lot', zoning: { name: 'RS-2', minAcres: 4_000 / SQFT_PER_ACRE, builds: 'a single-family house, and an owner’s accessory unit' }, yearlyChange: 0 },
  { cityId: 'us-ct-newhaven', place: 'ct-state', label: 'Farmland In Connecticut', town: 'us-ct-litchfield', currency: 'USD', perAcre: 14_600, year: '2026', basis: 'USDA’s farm real estate value, Connecticut, 1 January 2026', sizes: [5, 20, 50], kind: 'acreage', yearlyChange: 0.014 },
  { cityId: 'us-ca-losangeles', place: 'los-angeles', label: 'A Lot In Los Angeles', currency: 'USD', perAcre: 4_134_000, year: '2022', basis: 'the FHFA’s average land value an acre under single-family homes, Los Angeles County, 2022', sizes: [5_000 / SQFT_PER_ACRE], kind: 'lot', zoning: { name: 'R1', minAcres: 5_000 / SQFT_PER_ACRE, builds: 'a single-family house, and an accessory unit under state law' }, yearlyChange: 0 },
  { cityId: 'us-ca-losangeles', place: 'ca-state', label: 'Farmland In California', town: 'us-ca-bakersfield', currency: 'USD', perAcre: 14_100, year: '2026', basis: 'USDA’s farm real estate value, California, 1 January 2026', sizes: [10, 40, 160], kind: 'acreage', yearlyChange: 0.029 },
  { cityId: 'uk-eng-london', place: 'london', label: 'A Plot In Hackney, With Planning Permission', currency: 'GBP', perAcre: Math.round(39_690_000 * HA_PER_ACRE), year: '2019', basis: 'the government’s value of land with residential planning permission, Hackney, April 2019, its latest edition', sizes: [200 / M2_PER_ACRE], kind: 'lot', zoning: { name: 'Planning Permission', minAcres: 0, builds: 'a house, as the permission allows' }, yearlyChange: 0 },
  { cityId: 'uk-eng-london', place: 'london', label: 'A Plot In Croydon, With Planning Permission', currency: 'GBP', perAcre: Math.round(12_315_000 * HA_PER_ACRE), year: '2019', basis: 'the government’s value of land with residential planning permission, Croydon, April 2019, its latest edition', sizes: [200 / M2_PER_ACRE], kind: 'lot', zoning: { name: 'Planning Permission', minAcres: 0, builds: 'a house, as the permission allows' }, yearlyChange: 0 },
  { cityId: 'uk-eng-london', place: 'london', label: 'A Plot In Havering, With Planning Permission', currency: 'GBP', perAcre: Math.round(7_610_000 * HA_PER_ACRE), year: '2019', basis: 'the government’s value of land with residential planning permission, Havering, April 2019, its latest edition', sizes: [200 / M2_PER_ACRE], kind: 'lot', zoning: { name: 'Planning Permission', minAcres: 0, builds: 'a house, as the permission allows' }, yearlyChange: 0 },
  { cityId: 'uk-eng-london', place: 'england', label: 'Farmland In England', currency: 'GBP', perAcre: 8_497, year: 'Q2 2026', basis: 'Knight Frank’s English farmland index, Q2 2026, read secondhand', sizes: [10, 50, 150], kind: 'acreage', yearlyChange: -0.041 },
  { cityId: 'ie-lei-dublin', place: 'leinster', label: 'Farmland In Leinster', town: 'ie-l-naas', currency: 'EUR', perAcre: 16_603, year: '2025', basis: 'SCSI and Teagasc’s good land in Leinster, 2025, read secondhand; no Dublin figure is published', sizes: [10, 30, 80], kind: 'acreage', yearlyChange: 0.07 },
  { cityId: 'ca-on-toronto', place: 'ontario', label: 'Farmland In Central East Ontario', town: 'ca-08-millbrook', currency: 'CAD', perAcre: 13_100, year: '2025', basis: 'FCC’s cultivated land, Central East Ontario, 2025', sizes: [25, 100, 200], kind: 'acreage', yearlyChange: 0 },
  { cityId: 'ca-bc-vancouver', place: 'bc', label: 'Farmland On The South Coast', town: 'ca-02-sechelt', currency: 'CAD', perAcre: 104_600, year: '2025', basis: 'FCC’s cultivated land, British Columbia’s South Coast, 2025', sizes: [5, 20, 40], kind: 'acreage', yearlyChange: -0.074 },
];

/** Land in acres as it's said: square feet for a small US lot, square meters for a plot, acres for acreage. */
export const areaWords = (acres: number, place: LandPlace) => (place === 'london' ? `${Math.round(acres * M2_PER_ACRE).toLocaleString('en-US')} m²` : acres < 1 ? `${Math.round(acres * SQFT_PER_ACRE).toLocaleString('en-US')} sq ft` : `${acres} acres`);

/** A transfer tax: bands of the price, marginal or on the whole, and who customarily pays it. */
export interface TransferTax { label: string; payer: 'buyer' | 'seller'; bands: readonly (readonly [number, number])[]; whole?: boolean; basis: string }

/** The taxes on a sale of vacant land, by place. */
export const LAND_TRANSFER: Readonly<Record<LandPlace, readonly TransferTax[]>> = {
  nyc: [
    // Until 2026-09-29 this was 0.4% at any price; the research had 0.25% more on land in the city from $2 million.
    { label: 'New York State Transfer Tax', payer: 'seller', bands: [[1_999_999.99, 0.004], [Infinity, 0.0065]], whole: true, basis: 'Tax Department, 0.4%, and 0.65% on the whole on property in the city other than a home from $2 million' },
    { label: 'New York City Real Property Transfer Tax', payer: 'seller', bands: [[500_000, 0.01425], [Infinity, 0.02625]], whole: true, basis: 'Department of Finance, 1.425% to $500,000 and 2.625% above, on land' },
  ],
  'ny-state': [{ label: 'New York State Transfer Tax', payer: 'seller', bands: [[Infinity, 0.004]], basis: 'Tax Department, 0.4%' }],
  'new-haven': [{ label: 'Connecticut And New Haven Conveyance Tax', payer: 'seller', bands: [[Infinity, 0.0125]], basis: 'the state’s 0.75% on unimproved land and New Haven’s 0.5% (OLR, 2020)' }],
  'ct-state': [{ label: 'Connecticut Conveyance Tax', payer: 'seller', bands: [[Infinity, 0.01]], basis: 'the state’s 0.75% on unimproved land and a town’s base 0.25% (OLR, 2020)' }],
  'los-angeles': [
    { label: 'Los Angeles County Documentary Transfer Tax', payer: 'seller', bands: [[Infinity, 0.0011]], basis: 'the Registrar-Recorder, $1.10 per $1,000' },
    { label: 'City Of Los Angeles Transfer Tax', payer: 'seller', bands: [[5_400_000, 0.0045], [10_900_000, 0.04], [Infinity, 0.055]], whole: true, basis: 'the City’s 0.45%, and Measure ULA’s 4% above $5.4 million and 5.5% from $10.9 million (1 July 2026)' },
  ],
  'ca-state': [{ label: 'County Documentary Transfer Tax', payer: 'seller', bands: [[Infinity, 0.0011]], basis: 'California’s county rate, $1.10 per $1,000' }],
  london: [{ label: 'Stamp Duty Land Tax', payer: 'buyer', bands: [[150_000, 0], [250_000, 0.02], [Infinity, 0.05]], basis: 'HMRC’s non-residential rates, which land takes' }],
  england: [{ label: 'Stamp Duty Land Tax', payer: 'buyer', bands: [[150_000, 0], [250_000, 0.02], [Infinity, 0.05]], basis: 'HMRC’s non-residential rates, which land takes' }],
  leinster: [{ label: 'Stamp Duty', payer: 'buyer', bands: [[Infinity, 0.075]], basis: 'Revenue’s 7.5% on non-residential property, land included, since 9 October 2019' }],
  ontario: [{ label: 'Ontario Land Transfer Tax', payer: 'buyer', bands: [[55_000, 0.005], [250_000, 0.01], [400_000, 0.015], [Infinity, 0.02]], basis: 'the Ministry of Finance’s rates for land without a house' }],
  bc: [{ label: 'Property Transfer Tax', payer: 'buyer', bands: [[200_000, 0.01], [2_000_000, 0.02], [Infinity, 0.03]], basis: 'the Province’s 1%, 2% and 3%' }],
};

/**
 * A year's tax on holding vacant land, as a share of its value, where it's
 * published or follows from published rates: New York City's Class 1 rate,
 * 19.843%, on its 6% assessment ratio, about 1.19% (the arithmetic, before
 * the assessment caps); New Haven's 39.4 mills on 70% of value, about 2.76%
 * (the mill rate read secondhand); Los Angeles's Proposition 13 base, 1%,
 * on the price paid grown at most 2% a year, the constitution's cap, which
 * SLATE takes as the rise every year (voter-approved levies on top not kept). Farmland's, England's (none on
 * vacant land) and the rest: none kept, said so.
 */
export const LAND_TAX: Readonly<Record<LandPlace, { rate: number; basis: string; onPrice?: { cap: number } } | undefined>> = {
  nyc: { rate: 0.19843 * 0.06, basis: 'New York City’s Class 1 rate, 19.843%, on the 6% assessment ratio' },
  'new-haven': { rate: 0.0394 * 0.7, basis: 'New Haven’s 39.4 mills on 70% of value' },
  'los-angeles': { rate: 0.01, basis: 'Proposition 13’s 1% on the price paid, grown at most 2% a year', onPrice: { cap: 0.02 } },
  'ny-state': undefined, 'ct-state': undefined, 'ca-state': undefined, london: undefined, england: undefined, leinster: undefined, ontario: undefined, bc: undefined,
};

/**
 * How long a parcel takes to sell: a broker's 125 days for its 1,300 US land
 * sales of 2025, read secondhand and the only figure published; SLATE takes
 * it everywhere.
 */
export const DAYS_TO_SELL = 125;
export const LAND_SOURCE = 'docs/research/world/research-land.json: FHFA WP 19-01 (2024); USDA NASS Land Values 2026; FCC 2025; VOA land values 2019; Knight Frank Q2 2026; SCSI and Teagasc 2026; NYC DOF; NY DTF; CT OLR 2020; LA Registrar-Recorder; HMRC; Revenue; Ontario and BC finance ministries; National Land Realty 2025';

/**
 * Buying land as it's bought (from 2026-09-29): an offer on a listing, the
 * seller's answer, a deposit, a time to look into the land before one's
 * bound, and the closing.
 *
 * The deposit follows the place's custom. England's is the Standard
 * Conditions of Sale's 10%, and Ireland's the Law Society's general
 * conditions' 10%, paid when contracts are exchanged or signed. Before that
 * the sale is subject to contract, and either side walks away owing nothing.
 * America's earnest money is paid when the offer is accepted, at the 1% SLATE
 * takes for a home. Canada's deposit is paid on acceptance at 5%, SLATE's
 * reading of Ontario's and British Columbia's custom, which no rule fixes.
 * Before the day, the buyer walks away with it back. After it, walking away
 * or not paying at the closing loses it.
 *
 * The time to look into the land and the day of the closing are SLATE's
 * estimates, no authority publishing either: thirty days and forty-five.
 */
export const LAND_DEAL = {
  diligenceDays: 30,
  closingDays: 45,
  deposit: {
    nyc: { share: 0.01, at: 'accept' }, 'ny-state': { share: 0.01, at: 'accept' }, 'new-haven': { share: 0.01, at: 'accept' }, 'ct-state': { share: 0.01, at: 'accept' },
    'los-angeles': { share: 0.01, at: 'accept' }, 'ca-state': { share: 0.01, at: 'accept' },
    london: { share: 0.1, at: 'exchange' }, england: { share: 0.1, at: 'exchange' }, leinster: { share: 0.1, at: 'exchange' },
    ontario: { share: 0.05, at: 'accept' }, bc: { share: 0.05, at: 'accept' },
  } as Readonly<Record<LandPlace, { share: number; at: 'accept' | 'exchange' }>>,
  /**
   * What an asking price is over the value, and the least a seller takes of
   * it, falling the longer the land has sat: SLATE's estimates, as a home's.
   */
  askOver: [-0.05, 0.15] as const,
  floor: 0.9,
  floorFallsAYear: 0.16,
  floorFallsAtMost: 0.08,
  /** Listings a market shows in a month. None is a real listing. */
  listingsAMonth: 3,
} as const;

/**
 * Looking into the land, where a search has a published fee, in the place's
 * money: HM Land Registry's official copy of the register (£7), of the title
 * plan (£3), and an official search with priority (£3), read from a third
 * party's compilation of the fee order; upstate, a percolation test for a
 * septic system, Schenectady County's $100 application, one county's fee,
 * taken for the state. A Phase I environmental assessment has no authority's
 * price and isn't kept; a survey, title insurance and a lawyer are firms'
 * prices, in `closingLines`.
 */
export const LAND_SEARCHES: Readonly<Partial<Record<LandPlace, readonly { label: string; amount: number }[]>>> = {
  london: [{ label: 'Official Copy Of The Register', amount: 7 }, { label: 'Official Copy Of The Title Plan', amount: 3 }, { label: 'Official Search With Priority', amount: 3 }],
  england: [{ label: 'Official Copy Of The Register', amount: 7 }, { label: 'Official Copy Of The Title Plan', amount: 3 }, { label: 'Official Search With Priority', amount: 3 }],
  'ny-state': [{ label: 'Percolation Test Application', amount: 100 }],
};

/**
 * HM Land Registry's Scale 1 fee for registering a transfer for value,
 * lodged electronically, by the price, paid at completion in England; from a
 * third party's compilation of the fee order.
 */
export const LAND_REGISTRATION: readonly (readonly [number, number])[] = [[80_000, 20], [100_000, 40], [200_000, 100], [500_000, 150], [1_000_000, 295], [Infinity, 500]];

/**
 * What a buyer's closing costs past the taxes, from 2026-09-30
 * (`docs/research/world/research-land-construction.json`): an owner's title
 * policy and a lawyer's fee, where each is published.
 * - New York: TIRSA's promulgated owner's rates, zone 2, which takes in
 *   Brooklyn, Queens, Staten Island and Columbia County; and a real estate
 *   attorney's flat fee, the middle of $2,500 to $5,000 in the city and of
 *   $2,000 to $3,000 elsewhere in the state (firms' pages, secondary).
 * - Connecticut: CATIC's owner's policy formula, its 2016 schedule, the
 *   latest it publishes.
 * - California: Old Republic's Los Angeles owner's premiums at $100,000,
 *   $250,000 and $500,000, between and past them at their own rate; an
 *   underwriter files its own, and escrow is separate and not kept.
 * - England: the conveyancing index's £1,509 for a purchase, with its
 *   disbursements and VAT (Q2 2026).
 * - Ireland: a solicitor's flat fee, the middle of €1,500 to €2,500, with 23%
 *   VAT.
 * From 2026-10-01 (`docs/research/world/research-land-construction-2.json`):
 * - California: escrow, the buyer's half of Neighborhood Escrow's $250 and $2
 *   a thousand of the price, $795 at least (its own 2025 page; Los Angeles
 *   County splits the fee between buyer and seller).
 * - Ontario: Law Booth's $895 for a cash purchase, with 13% HST; its
 *   registration and title search are billed past it and aren't kept.
 * - British Columbia: Coquitlam Notary's $1,550 for a purchase without a
 *   mortgage, its typical disbursements in; the GST and PST on its fee, whose
 *   share of the $1,550 it doesn't print, aren't kept.
 * - A boundary survey, the middle of a surveyor's own published range: New
 *   York's from Island-Wide Land Surveyors ($1,200 to $3,500), Connecticut's
 *   stakeout from Juliano Associates ($2,800 to $3,200, two acres or less),
 *   and England's topographical survey of a residential site from THS
 *   Concepts (£800 to £1,200, with VAT). Aggregators' averages (Angi's $2,590
 *   for New York) disagreed with the firms' own and weren't used. No
 *   California, Irish or Canadian surveyor prints a price, and none is kept.
 * Title insurance in Ontario and British Columbia is sold from calculators
 * with no published table, and wasn't kept until later on 2026-10-01, when
 * TitlePLUS's Ontario rate card (March 2025) was read
 * (`docs/research/world/research-open-final.json`): C$385.74 to $500,000 and
 * C$0.90 a thousand past it, with Ontario's 8% sales tax on insurance.
 * British Columbia's is still unpublished.
 */
const titlePlus = (dollars: number): number => (385.74 + (Math.ceil(Math.max(0, dollars - 500_000) / 1_000) * 0.9)) * 1.08;
const TIRSA_ZONE2: readonly [number, number][] = [[50_000, 6.34], [100_000, 5.16], [500_000, 4.14], [1_000_000, 3.78], [5_000_000, 3.48], [10_000_000, 3.09], [15_000_000, 2.92], [Number.POSITIVE_INFINITY, 2.62]];
function tirsaZone2(dollars: number): number {
  let premium = 382;
  let from = 35_000;
  for (const [upTo, per] of TIRSA_ZONE2) {
    if (dollars <= from) break;
    premium += Math.ceil((Math.min(dollars, upTo) - from) / 1_000) * per;
    from = upTo;
  }
  return Math.round(premium * 100) / 100;
}
/** CATIC's schedule, in whole dollars as it prints them: $957.50 at $250,000 is its $957. */
const catic = (dollars: number): number => Math.floor(caticExact(dollars));
function caticExact(dollars: number): number {
  if (dollars <= 20_000) return 100;
  if (dollars <= 100_000) return 100 + Math.ceil((dollars - 20_000) / 1_000) * 4;
  if (dollars <= 200_000) return 420 + Math.ceil((dollars - 100_000) / 1_000) * 3.75;
  if (dollars <= 500_000) return 795 + Math.ceil((dollars - 200_000) / 1_000) * 3.25;
  return 1_770 + Math.ceil((dollars - 500_000) / 1_000) * 2.75;
}
function oldRepublicLa(dollars: number): number {
  if (dollars <= 100_000) return 725;
  if (dollars <= 250_000) return 725 + ((dollars - 100_000) / 150_000) * 375;
  return 1_100 + ((dollars - 250_000) / 250_000) * 500;
}
export function closingLines(place: string, cents: number): { label: string; amount: number }[] {
  const dollars = cents / 100;
  const out: { label: string; amount: number }[] = [];
  const add = (label: string, units: number) => out.push({ label, amount: Math.round(units * 100) });
  if (place === 'nyc' || place === 'ny-state') { add('Owner’s Title Insurance', tirsaZone2(dollars)); add('The Attorney’s Fee', place === 'nyc' ? 3_750 : 2_500); add('A Boundary Survey', (1_200 + 3_500) / 2); }
  if (place === 'new-haven' || place === 'ct-state') { add('Owner’s Title Insurance', catic(dollars)); add('A Boundary Survey', (2_800 + 3_200) / 2); }
  if (place === 'los-angeles' || place === 'ca-state') { add('Owner’s Title Insurance', oldRepublicLa(dollars)); add('Escrow, The Buyer’s Half', Math.max(795, 250 + (dollars / 1_000) * 2)); }
  if (place === 'london' || place === 'england') { add('Conveyancing', 1_509); add('A Topographical Survey, With VAT', ((800 + 1_200) / 2) * 1.2); }
  if (place === 'leinster') add('The Solicitor’s Fee, With VAT', 2_000 * 1.23);
  if (place === 'ontario') { add('The Lawyer’s Fee, With HST', 895 * 1.13); add('Title Insurance, With Sales Tax', titlePlus(dollars)); }
  if (place === 'bc') add('The Notary’s Fee And Disbursements', 1_550);
  return out;
}

/**
 * What splitting a parcel in two costs, in its place's money, from 2026-10-01
 * (`docs/research/world/research-land-construction-2.json`), each the
 * authority's own schedule for the town SLATE's land lies in:
 * - New York City: the Department of Finance's $73 for the new tax lot.
 * - Upstate (Hudson): the Town of Greenport's $250 a lot, two lots.
 * - Connecticut (Litchfield): $250 a lot and the state's $60 (its 2011 form).
 * - Los Angeles: the parcel map, $13,666 preliminary (LAMC 19.02, July 2024's
 *   adjustment) and $8,240 final; from 2026-10-03 City Planning's current
 *   $14,978 for a preliminary map of up to four lots (`research-pets-property.json`).
 * - California farmland (Kern County): the tentative parcel map's $4,908 and
 *   $75 a lot (from 1 July 2026).
 * - Ontario (Cavan Monaghan): Peterborough County's $1,150 consent, its $450
 *   deed stamping and the township's $500 review.
 * - British Columbia (the Sunshine Coast): $500 to apply first and $5,000 for
 *   up to two lots added.
 * Ireland charges no authority's fee to split: a house on the new site asks
 * planning when it's built. What it does need is a map Tailte Éireann will
 * register, Property Maps Ireland's €190. No New Haven or English fee was
 * read, and none is kept.
 */
export const SPLIT_FEES: Readonly<Record<string, number>> = {
  nyc: 73,
  'ny-state': 250 * 2,
  'ct-state': 250 * 2 + 60,
  'los-angeles': 14_978 + 8_240,
  'ca-state': 4_908 + 75 * 2,
  ontario: 1_150 + 450 + 500,
  bc: 500 + 5_000,
  leinster: 190,
};
