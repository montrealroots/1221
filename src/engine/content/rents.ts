/**
 * SLATE — what rent actually is, where it's published.
 *
 * The atlas prices every town's rent from a formula (`deriveCity`), and the
 * formula can be far off: it put a one-bedroom in Mosfellsbær at $3,424 a
 * month and Reykjavík at $4,422, where Iceland's housing agency puts
 * capital-region market rent near 205,000 krónur (about $1,500) and a
 * two-room flat at 250,000. So rent is read from published figures where
 * there are some, researched and sourced on 2026-09-24, in each place's own
 * money, with what each figure measures and when.
 *
 * Every other town in a country that has a published figure is the atlas's
 * rent scaled by how far the atlas was off in that country's published places
 * (`rentAt`): the formula's shape between towns, the published level. A
 * country with no published figure keeps the atlas's estimate, and the screen
 * says which of the three a town's rent is.
 *
 * A room in a shared flat is the published room rent where there is one, and
 * otherwise 55% of the one-bedroom: rooms run about half to two-thirds of a
 * one-bedroom, lower in the dearest cities (SpareRoom's comparison of US
 * cities put New York at 38% and Houston at 75%).
 *
 * The measures differ, and are named: some are asking rents on new lets,
 * some are what sitting tenants pay, and US Fair Market Rents are a 40th
 * percentile with utilities included.
 */

import { CITIES } from './geography';
import { exchange } from './currency';

export interface PublishedRent {
  cityId: string;
  /** A one-bedroom, a month, in hundredths of `currency`. */
  oneBed: number;
  /** A room in a shared flat, where one is published. */
  room?: number;
  currency: string;
  measure: string;
  period: string;
  source: string;
}

const r = (cityId: string, oneBed: number, currency: string, measure: string, period: string, source: string, room?: number): PublishedRent => ({
  cityId, oneBed: Math.round(oneBed * 100), currency, measure, period, source,
  ...(room !== undefined ? { room: Math.round(room * 100) } : {}),
});

const HUD = 'https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY26_FMRs.xlsx';
const STATCAN = 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201';

export const PUBLISHED_RENTS: readonly PublishedRent[] = [
  r('is-39-reykjavik', 250_000, 'ISK', 'HMS’s mean market rent for a two-room flat', 'the third quarter of 2025, for an area HMS doesn’t name', 'https://hms.is/skyrslur/manadarskyrsla-oktober-2025'),
  r('is-39-mosfellsbr', 205_000, 'ISK', 'HMS’s market rent for the capital region, 3,739 kr a square meter, for 55 square meters', 'September to October 2025', 'https://hms.is/gogn-og-maelabord/maelabordleiguskra/leiguverdsja'),
  r('us-ny-newyork', 2_655, 'USD', 'HUD’s Fair Market Rent, the 40th percentile rent, utilities included', 'fiscal year 2026; the room’s rent is SpareRoom’s, for the second quarter of 2026', HUD, 1_515),
  r('us-ct-newhaven', 1_591, 'USD', 'HUD’s Fair Market Rent for the New Haven–Meriden area, the 40th percentile rent, utilities included', 'fiscal year 2026', HUD),
  r('us-ca-losangeles', 2_085, 'USD', 'HUD’s Fair Market Rent, the 40th percentile rent, utilities included', 'fiscal year 2026; the room’s rent is SpareRoom’s, for the fourth quarter of 2025', HUD, 1_354),
  r('uk-eng-london', 1_760, 'GBP', 'the ONS’s mean rent across private tenancies', 'August 2026; the room’s rent is SpareRoom’s, for the first quarter of 2026', 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/priceindexofprivaterentsukmonthlypricestatistics', 978),
  r('ca-on-toronto', 2_090, 'CAD', 'Statistics Canada’s mean asking rent for a one-bedroom', 'the second quarter of 2026', STATCAN),
  r('ca-bc-vancouver', 2_280, 'CAD', 'Statistics Canada’s mean asking rent for a one-bedroom', 'the second quarter of 2026', STATCAN),
  r('ca-qc-montreal', 1_480, 'CAD', 'Statistics Canada’s mean asking rent for a one-bedroom', 'the second quarter of 2026', STATCAN),
  r('au-nsw-sydney', 3_033, 'AUD', 'the NSW median rent on new bonds for a one-bedroom unit, A$700 a week', 'April to June 2026', 'https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html'),
  r('au-vic-melbourne', 2_167, 'AUD', 'Victoria’s median rent on new lettings for a one-bedroom flat, A$500 a week', 'the September quarter of 2025; the room’s rent is from a summary of listings, April 2026', 'https://www.dffh.vic.gov.au/tables-rental-report-september-quarter-2025-excel', 1_148),
  r('nz-akl-auckland', 2_006, 'NZD', 'a summary of Tenancy Services’ bond data for central Auckland, NZ$463 a week', 'March 2026', 'https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/'),
  r('de-be-berlin', 940, 'EUR', 'the IBB’s median asking rent including heating (warm), for about 50 square meters', '2025; the room’s rent is the Moses Mendelssohn Institut’s, September 2026', 'https://www.ibb.de/de/ueber-uns/publikationen/wohnungsmarktbericht/2025.html', 650),
  r('fr-idf-paris', 1_172, 'EUR', 'OLAP’s mean rent for recent movers into a two-room flat, without charges', 'January 2025', 'https://www.observatoire-des-loyers.fr/'),
  r('es-md-madrid', 1_165, 'EUR', 'idealista’s asking rent, €23.30 a square meter for 50 square meters', 'August 2026; the room’s rent is from idealista and OCU', 'https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/madrid-comunidad/madrid-provincia/madrid/', 659),
  r('it-laz-rome', 675, 'EUR', 'the Agenzia Entrate’s registered new contracts, €13.50 a square meter for 50 square meters, likely below listing prices', '2025', 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi/pubblicazioni/rapporti-immobiliari-residenziali'),
  r('ie-lei-dublin', 1_865, 'EUR', 'the RTB’s standardized average for a one-bedroom on new tenancies', 'the fourth quarter of 2025; the room’s rent is Daft.ie’s, for the first quarter of 2026', 'https://www.rtb.ie/', 914),
  r('jp-13-tokyo', 171_000, 'JPY', 'At Home’s average asking rent for 30 to 50 square meters in the 23 wards', 'October 2025', 'https://www.athome.co.jp/corporate/news/data/market/2026/'),
  r('kr-11-seoul', 830_000, 'KRW', 'the monthly rent (wolse) on small units, taken at a ₩10 million deposit', 'the first quarter of 2026', 'https://www.seoul.co.kr/news/economy/estate/2026/03/09/20260309029001'),
  r('mx-cmx-mexicocity', 15_750, 'MXN', 'Inmuebles24’s asking rent, 334 pesos a square meter, for 45 to 50 square meters', 'April 2026', 'https://www.inmuebles24.com/blog/'),
];

const ROOM_SHARE = 0.55;

export interface RentFigure {
  /** A month, in hundredths of the currency asked for. */
  oneBed: number;
  room: number;
  kind: 'published' | 'calibrated' | 'estimate';
  measure?: string;
  period?: string;
  source?: string;
}

const inUsd = (one: PublishedRent, cents: number) => exchange(cents, one.currency, 'USD');

/**
 * How far the atlas is off in a country, from its published places: the
 * published rent over the atlas's, averaged. Nothing for a country with none.
 */
function correctionFor(countryId: string): number | undefined {
  const ratios = PUBLISHED_RENTS.flatMap((one) => {
    const city = CITIES.get(one.cityId);
    const usd = inUsd(one, one.oneBed);
    return city && city.countryId === countryId && usd !== undefined && city.medianRentCents > 0
      ? [usd / city.medianRentCents] : [];
  });
  return ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : undefined;
}

/** A town's rent for a one-bedroom and a room, in a currency: published, calibrated, or the atlas's estimate. */
export function rentAt(cityId: string, currency: string): RentFigure {
  const city = CITIES.require(cityId);
  const to = (cents: number, from: string) => exchange(cents, from, currency) ?? cents;
  const published = PUBLISHED_RENTS.find((one) => one.cityId === cityId);
  if (published) {
    const oneBed = to(published.oneBed, published.currency);
    return {
      oneBed, room: published.room !== undefined ? to(published.room, published.currency) : Math.round(oneBed * ROOM_SHARE),
      kind: 'published', measure: published.measure, period: published.period, source: published.source,
    };
  }
  const correction = correctionFor(city.countryId);
  const oneBed = to(Math.round(city.medianRentCents * (correction ?? 1)), 'USD');
  return { oneBed, room: Math.round(oneBed * ROOM_SHARE), kind: correction === undefined ? 'estimate' : 'calibrated' };
}
