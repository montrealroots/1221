/**
 * SLATE — Geography and jurisdictions.
 *
 * Countries, states, metros, cities, neighbourhoods and airports. The
 * geographic facts (a city's country, its IANA time zone, an airport's code
 * and the city it serves) are public reference data. The economic figures
 * attached to each place — cost-of-living index, median rent, median home
 * price, market depth — are SLATE's own calibrated estimates and are marked
 * as such, because a precise current rent for a real city is not something
 * this game can verify.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import {
  WORLD_COUNTRIES, WORLD_REGIONS, WORLD_CITIES, CITY_COUNTS, TOTAL_CITIES,
  type RawCity,
} from './world-data';

export interface Country extends ReferenceRecord {
  type: 'country';
  iso2: string;
  currency: string;
  /** The currency's name: "Dollar", "Yen", "Pound". */
  currencyName: string;
  /** Path segment used by the jurisdiction resolver. */
  jurisdictionCode: string;
  drivesOn: 'left' | 'right';
  capital: string;
  continent: string;
  /** National population, as GeoNames records it. */
  population: number;
  areaKm2: number;
  /** International dialling code, without the plus. */
  phone: string;
  /** Languages as ISO 639 codes, most spoken first. */
  languages: string;
}

export const CONTINENT_NAMES: Record<string, string> = {
  AF: 'Africa', AS: 'Asia', EU: 'Europe', NA: 'North America', SA: 'South America', OC: 'Oceania', AN: 'Antarctica',
};

export interface Region extends ReferenceRecord {
  type: 'region';
  /** State, province or equivalent. */
  code: string;
  parentId: string;
  jurisdictionCode: string;
}

export interface City extends ReferenceRecord {
  type: 'city';
  parentId: string;
  countryId: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  /** 100 = national average. Drives rent, groceries, services. */
  costOfLivingIndex: number;
  /** Median monthly rent for a one-bedroom, in cents. Calibrated estimate. */
  medianRentCents: number;
  /** Median home price in cents. Calibrated estimate. */
  medianHomePriceCents: number;
  population: number;
  /** 0-100 how much film and television work happens here. */
  industryPresence: number;
  /** 0-100 depth of the ordinary job market. */
  jobMarketDepth: number;
  /** Primary airport id. */
  airportId?: string;
  jurisdictionCode: string;
  /** Descriptive tags used by search and lifestyle systems. */
  tags: string[];
  /**
   * A section of a larger city (Hollywood, Brooklyn), a national capital, or
   * the capital of a first-level region. An ordinary town has none.
   */
  kind?: 'section' | 'capital' | 'regional_capital';
}

export interface Neighbourhood extends ReferenceRecord {
  type: 'neighbourhood';
  parentId: string;
  /** Multiplier applied to the city's baseline housing cost. */
  priceMultiplier: number;
  /** 0-100. */
  prestige: number;
  safety: number;
  walkability: number;
  character: string;
}

export interface Airport extends ReferenceRecord {
  type: 'airport';
  iata: string;
  parentId: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  /** 0-100 how many destinations are reachable directly. */
  connectivity: number;
  hasPrivateTerminal: boolean;
  /** Longest runway in feet, gating which private aircraft can use it. */
  runwayFeet: number;
}

const V = REFERENCE_VERSION;
const PUB = { source: 'public_reference', confidence: 'high', version: V } as const;

/**
 * Countries where traffic keeps left. Public reference data; the list is short
 * enough to state outright rather than guess from a region.
 */
const DRIVES_LEFT = new Set([
  'AG', 'AU', 'BS', 'BD', 'BB', 'BM', 'BT', 'BW', 'BN', 'KY', 'CX', 'CC', 'CK', 'CY', 'DM',
  'FK', 'FJ', 'GD', 'GG', 'GY', 'HK', 'IN', 'ID', 'IE', 'IM', 'JM', 'JE', 'JP', 'KE', 'KI',
  'LS', 'MO', 'MW', 'MY', 'MV', 'MT', 'MU', 'MS', 'MZ', 'NA', 'NR', 'NP', 'NZ', 'NU', 'NF',
  'PK', 'PG', 'PN', 'WS', 'SC', 'SG', 'SB', 'ZA', 'LK', 'SH', 'KN', 'LC', 'VC', 'SR', 'SZ',
  'TZ', 'TH', 'TL', 'TK', 'TO', 'TT', 'TC', 'TV', 'UG', 'GB', 'VG', 'VI', 'ZM', 'ZW',
]);

/** Names people actually type, where they differ from the official one. */
const COUNTRY_ALIASES: Record<string, string[] | undefined> = {
  us: ['USA', 'America', 'United States of America'],
  uk: ['Britain', 'Great Britain', 'England', 'UK'],
  ae: ['UAE', 'Dubai'],
  kr: ['South Korea'],
  kp: ['North Korea'],
  nl: ['Holland'],
  cz: ['Czech Republic'],
  cd: ['DR Congo'],
};

/**
 * Every country and territory in the world, from the GeoNames public dataset.
 * The geographic and administrative facts are reference data; nothing here is
 * a SLATE invention.
 */
export const COUNTRIES = new Registry<Country>('countries', WORLD_COUNTRIES.map((c) => ({
  id: c.id,
  name: c.name,
  aliases: COUNTRY_ALIASES[c.id],
  type: 'country' as const,
  iso2: c.iso2,
  currency: c.currency,
  currencyName: c.currencyName,
  jurisdictionCode: c.iso2,
  drivesOn: DRIVES_LEFT.has(c.iso2) ? ('left' as const) : ('right' as const),
  capital: c.capital,
  continent: CONTINENT_NAMES[c.continent] ?? c.continent,
  population: c.population,
  areaKm2: c.areaKm2,
  phone: c.phone,
  languages: c.languages,
  ...PUB,
})));



/**
 * Every first-level subdivision on Earth — states, provinces, prefectures,
 * regions, emirates, counties — as published by GeoNames.
 */
export const REGIONS = new Registry<Region>('regions', WORLD_REGIONS.map((r) => ({
  id: r.id,
  name: r.name,
  type: 'region' as const,
  code: r.code,
  parentId: r.countryId,
  jurisdictionCode: `${(COUNTRIES.get(r.countryId)?.jurisdictionCode ?? r.countryId.toUpperCase())}-${r.code}`,
  ...PUB,
})));

interface CitySpec {
  id: string; name: string; region: string; tz: string; lat: number; lon: number;
  col: number; rent: number; home: number; pop: number; industry: number; jobs: number;
  airport?: string; tags: string[]; aliases?: string[];
}

function city(spec: CitySpec): City {
  const reg = REGIONS.require(spec.region);
  return {
    id: spec.id,
    name: spec.name,
    aliases: spec.aliases,
    type: 'city',
    parentId: spec.region,
    countryId: reg.parentId,
    timeZone: spec.tz,
    latitude: spec.lat,
    longitude: spec.lon,
    costOfLivingIndex: spec.col,
    medianRentCents: spec.rent * 100,
    medianHomePriceCents: spec.home * 100,
    population: spec.pop,
    industryPresence: spec.industry,
    jobMarketDepth: spec.jobs,
    airportId: spec.airport,
    jurisdictionCode: `${reg.jurisdictionCode}-${spec.id.split('-').pop()}`,
    tags: spec.tags,
    source: 'calibrated_estimate',
    confidence: 'medium',
    version: V,
    note: 'Location, time zone and administrative parentage are public reference data. Cost figures are SLATE calibrations.',
  };
}

/** The places SLATE simulates in detail, with economics that were actually
 * calibrated rather than derived. Everything else in the world is layered
 * underneath these. */
const CALIBRATED_CITIES: readonly City[] = [
  city({ id: 'us-ca-losangeles', name: 'Los Angeles', aliases: ['LA'], region: 'us-ca', tz: 'America/Los_Angeles', lat: 34.05, lon: -118.24, col: 152, rent: 2450, home: 985000, pop: 3900000, industry: 100, jobs: 88, airport: 'lax', tags: ['film', 'television', 'beach', 'entertainment capital'] }),
  city({ id: 'us-ca-burbank', name: 'Burbank', region: 'us-ca', tz: 'America/Los_Angeles', lat: 34.18, lon: -118.31, col: 148, rent: 2350, home: 1050000, pop: 107000, industry: 96, jobs: 72, airport: 'bur', tags: ['studios', 'television', 'production'] }),
  city({ id: 'us-ca-santamonica', name: 'Santa Monica', region: 'us-ca', tz: 'America/Los_Angeles', lat: 34.02, lon: -118.49, col: 178, rent: 3300, home: 1750000, pop: 93000, industry: 82, jobs: 70, tags: ['beach', 'agencies', 'affluent'] }),
  city({ id: 'us-ca-sanfrancisco', name: 'San Francisco', region: 'us-ca', tz: 'America/Los_Angeles', lat: 37.77, lon: -122.42, col: 178, rent: 3200, home: 1300000, pop: 810000, industry: 44, jobs: 90, airport: 'sfo', tags: ['tech', 'expensive', 'coastal'] }),
  city({ id: 'us-ca-sandiego', name: 'San Diego', region: 'us-ca', tz: 'America/Los_Angeles', lat: 32.72, lon: -117.16, col: 143, rent: 2500, home: 900000, pop: 1380000, industry: 38, jobs: 78, airport: 'san', tags: ['beach', 'military', 'relaxed'] }),
  city({ id: 'us-ny-newyork', name: 'New York', aliases: ['NYC', 'Manhattan'], region: 'us-ny', tz: 'America/New_York', lat: 40.71, lon: -74.01, col: 168, rent: 3600, home: 780000, pop: 8300000, industry: 88, jobs: 96, airport: 'jfk', tags: ['theatre', 'television', 'finance', 'publishing'] }),
  city({ id: 'us-ga-atlanta', name: 'Atlanta', region: 'us-ga', tz: 'America/New_York', lat: 33.75, lon: -84.39, col: 104, rent: 1750, home: 400000, pop: 500000, industry: 78, jobs: 82, airport: 'atl', tags: ['production hub', 'incentives', 'affordable'] }),
  city({ id: 'us-tx-austin', name: 'Austin', region: 'us-tx', tz: 'America/Chicago', lat: 30.27, lon: -97.74, col: 112, rent: 1700, home: 490000, pop: 970000, industry: 46, jobs: 86, airport: 'aus', tags: ['music', 'festival', 'tech'] }),
  city({ id: 'us-tx-dallas', name: 'Dallas', region: 'us-tx', tz: 'America/Chicago', lat: 32.78, lon: -96.80, col: 101, rent: 1500, home: 390000, pop: 1300000, industry: 32, jobs: 88, airport: 'dfw', tags: ['business', 'affordable'] }),
  city({ id: 'us-fl-miami', name: 'Miami', region: 'us-fl', tz: 'America/New_York', lat: 25.76, lon: -80.19, col: 128, rent: 2600, home: 590000, pop: 450000, industry: 44, jobs: 76, airport: 'mia', tags: ['beach', 'international', 'nightlife'] }),
  city({ id: 'us-il-chicago', name: 'Chicago', region: 'us-il', tz: 'America/Chicago', lat: 41.88, lon: -87.63, col: 108, rent: 1950, home: 360000, pop: 2700000, industry: 52, jobs: 90, airport: 'ord', tags: ['theatre', 'improv', 'architecture'] }),
  city({ id: 'us-nv-lasvegas', name: 'Las Vegas', region: 'us-nv', tz: 'America/Los_Angeles', lat: 36.17, lon: -115.14, col: 105, rent: 1550, home: 430000, pop: 660000, industry: 40, jobs: 74, airport: 'las', tags: ['no state income tax', 'entertainment', 'hospitality'] }),
  city({ id: 'us-wa-seattle', name: 'Seattle', region: 'us-wa', tz: 'America/Los_Angeles', lat: 47.61, lon: -122.33, col: 148, rent: 2250, home: 830000, pop: 750000, industry: 38, jobs: 88, airport: 'sea', tags: ['tech', 'no state income tax', 'rain'] }),
  city({ id: 'us-or-portland', name: 'Portland', region: 'us-or', tz: 'America/Los_Angeles', lat: 45.51, lon: -122.68, col: 121, rent: 1700, home: 540000, pop: 640000, industry: 34, jobs: 74, airport: 'pdx', tags: ['no sales tax', 'creative', 'green'] }),
  city({ id: 'us-co-denver', name: 'Denver', region: 'us-co', tz: 'America/Denver', lat: 39.74, lon: -104.99, col: 115, rent: 1800, home: 570000, pop: 715000, industry: 30, jobs: 82, airport: 'den', tags: ['mountains', 'outdoors'] }),
  city({ id: 'us-nm-santafe', name: 'Santa Fe', region: 'us-nm', tz: 'America/Denver', lat: 35.69, lon: -105.94, col: 106, rent: 1600, home: 560000, pop: 88000, industry: 54, jobs: 48, tags: ['incentives', 'desert', 'arts'] }),
  city({ id: 'us-la-neworleans', name: 'New Orleans', region: 'us-la', tz: 'America/Chicago', lat: 29.95, lon: -90.07, col: 96, rent: 1400, home: 300000, pop: 380000, industry: 56, jobs: 62, airport: 'msy', tags: ['incentives', 'music', 'historic'] }),
  city({ id: 'us-nc-wilmington', name: 'Wilmington', region: 'us-nc', tz: 'America/New_York', lat: 34.23, lon: -77.94, col: 94, rent: 1400, home: 340000, pop: 120000, industry: 58, jobs: 52, tags: ['studios', 'coastal', 'affordable'] }),
  city({ id: 'us-tn-nashville', name: 'Nashville', region: 'us-tn', tz: 'America/Chicago', lat: 36.16, lon: -86.78, col: 103, rent: 1650, home: 450000, pop: 690000, industry: 42, jobs: 80, airport: 'bna', tags: ['music', 'no state income tax'] }),
  city({ id: 'us-ma-boston', name: 'Boston', region: 'us-ma', tz: 'America/New_York', lat: 42.36, lon: -71.06, col: 149, rent: 2900, home: 760000, pop: 650000, industry: 40, jobs: 86, airport: 'bos', tags: ['universities', 'historic'] }),
  city({ id: 'us-az-phoenix', name: 'Phoenix', region: 'us-az', tz: 'America/Phoenix', lat: 33.45, lon: -112.07, col: 103, rent: 1550, home: 440000, pop: 1650000, industry: 26, jobs: 80, airport: 'phx', tags: ['no daylight saving', 'desert', 'affordable'] }),
  city({ id: 'us-hi-honolulu', name: 'Honolulu', region: 'us-hi', tz: 'Pacific/Honolulu', lat: 21.31, lon: -157.86, col: 179, rent: 2400, home: 830000, pop: 350000, industry: 34, jobs: 58, airport: 'hnl', tags: ['island', 'no daylight saving', 'tourism'] }),
  city({ id: 'ca-bc-vancouver', name: 'Vancouver', region: 'ca-02', tz: 'America/Vancouver', lat: 49.28, lon: -123.12, col: 137, rent: 2400, home: 1150000, pop: 675000, industry: 82, jobs: 76, airport: 'yvr', tags: ['production hub', 'incentives', 'mountains'] }),
  city({ id: 'ca-on-toronto', name: 'Toronto', region: 'ca-08', tz: 'America/Toronto', lat: 43.65, lon: -79.38, col: 128, rent: 2200, home: 900000, pop: 2900000, industry: 74, jobs: 88, airport: 'yyz', tags: ['production hub', 'incentives', 'finance'] }),
  city({ id: 'ca-qc-montreal', name: 'Montreal', region: 'ca-10', tz: 'America/Toronto', lat: 45.50, lon: -73.57, col: 105, rent: 1500, home: 550000, pop: 1760000, industry: 62, jobs: 76, airport: 'yul', tags: ['vfx', 'incentives', 'bilingual'] }),
  city({ id: 'uk-eng-london', name: 'London', region: 'uk-eng', tz: 'Europe/London', lat: 51.51, lon: -0.13, col: 158, rent: 2700, home: 780000, pop: 8900000, industry: 86, jobs: 94, airport: 'lhr', tags: ['theatre', 'production hub', 'international'] }),
  city({ id: 'uk-eng-manchester', name: 'Manchester', region: 'uk-eng', tz: 'Europe/London', lat: 53.48, lon: -2.24, col: 108, rent: 1350, home: 330000, pop: 553000, industry: 52, jobs: 76, airport: 'man', tags: ['television', 'affordable', 'music'] }),
  city({ id: 'uk-sct-glasgow', name: 'Glasgow', region: 'uk-sct', tz: 'Europe/London', lat: 55.86, lon: -4.25, col: 98, rent: 1100, home: 250000, pop: 635000, industry: 44, jobs: 68, tags: ['incentives', 'locations'] }),
  city({ id: 'ie-lei-dublin', name: 'Dublin', region: 'ie-l', tz: 'Europe/Dublin', lat: 53.35, lon: -6.26, col: 132, rent: 2100, home: 520000, pop: 590000, industry: 54, jobs: 78, airport: 'dub', tags: ['incentives', 'production'] }),
  city({ id: 'fr-idf-paris', name: 'Paris', region: 'fr-11', tz: 'Europe/Paris', lat: 48.86, lon: 2.35, col: 142, rent: 2200, home: 780000, pop: 2100000, industry: 66, jobs: 86, airport: 'cdg', tags: ['festival', 'fashion', 'arthouse'] }),
  city({ id: 'fr-paca-cannes', name: 'Cannes', region: 'fr-93', tz: 'Europe/Paris', lat: 43.55, lon: 7.02, col: 138, rent: 1900, home: 720000, pop: 74000, industry: 70, jobs: 42, tags: ['festival', 'market', 'riviera'] }),
  city({ id: 'de-be-berlin', name: 'Berlin', region: 'de-16', tz: 'Europe/Berlin', lat: 52.52, lon: 13.40, col: 112, rent: 1450, home: 520000, pop: 3700000, industry: 62, jobs: 82, airport: 'ber', tags: ['festival', 'affordable', 'creative'] }),
  city({ id: 'es-md-madrid', name: 'Madrid', region: 'es-29', tz: 'Europe/Madrid', lat: 40.42, lon: -3.70, col: 102, rent: 1300, home: 420000, pop: 3300000, industry: 56, jobs: 78, airport: 'mad', tags: ['production hub', 'sunny'] }),
  city({ id: 'es-cat-barcelona', name: 'Barcelona', region: 'es-56', tz: 'Europe/Madrid', lat: 41.39, lon: 2.17, col: 108, rent: 1400, home: 480000, pop: 1620000, industry: 52, jobs: 76, airport: 'bcn', tags: ['locations', 'beach', 'design'] }),
  city({ id: 'it-laz-rome', name: 'Rome', region: 'it-07', tz: 'Europe/Rome', lat: 41.90, lon: 12.50, col: 104, rent: 1250, home: 430000, pop: 2800000, industry: 58, jobs: 70, airport: 'fco', tags: ['historic studios', 'locations'] }),
  city({ id: 'au-nsw-sydney', name: 'Sydney', region: 'au-02', tz: 'Australia/Sydney', lat: -33.87, lon: 151.21, col: 141, rent: 2400, home: 1050000, pop: 5300000, industry: 66, jobs: 86, airport: 'syd', tags: ['southern hemisphere', 'harbour', 'production hub'] }),
  city({ id: 'au-vic-melbourne', name: 'Melbourne', region: 'au-07', tz: 'Australia/Melbourne', lat: -37.81, lon: 144.96, col: 128, rent: 1900, home: 780000, pop: 5000000, industry: 58, jobs: 84, airport: 'mel', tags: ['southern hemisphere', 'arts', 'coffee'] }),
  city({ id: 'au-qld-goldcoast', name: 'Gold Coast', region: 'au-04', tz: 'Australia/Brisbane', lat: -28.02, lon: 153.40, col: 118, rent: 1700, home: 720000, pop: 640000, industry: 62, jobs: 58, tags: ['studios', 'incentives', 'beach', 'no daylight saving'] }),
  city({ id: 'nz-wgn-wellington', name: 'Wellington', region: 'nz-g2', tz: 'Pacific/Auckland', lat: -41.29, lon: 174.78, col: 116, rent: 1650, home: 640000, pop: 215000, industry: 72, jobs: 58, airport: 'wlg', tags: ['vfx', 'southern hemisphere', 'incentives'] }),
  city({ id: 'nz-akl-auckland', name: 'Auckland', region: 'nz-e7', tz: 'Pacific/Auckland', lat: -36.85, lon: 174.76, col: 122, rent: 1750, home: 720000, pop: 1650000, industry: 56, jobs: 72, airport: 'akl', tags: ['southern hemisphere', 'locations'] }),
  city({ id: 'jp-13-tokyo', name: 'Tokyo', region: 'jp-40', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69, col: 126, rent: 1500, home: 620000, pop: 13900000, industry: 62, jobs: 92, airport: 'hnd', tags: ['international', 'animation', 'dense'] }),
  city({ id: 'kr-11-seoul', name: 'Seoul', region: 'kr-11', tz: 'Asia/Seoul', lat: 37.57, lon: 126.98, col: 118, rent: 1350, home: 700000, pop: 9700000, industry: 68, jobs: 90, airport: 'icn', tags: ['international', 'television', 'music'] }),
  city({ id: 'mx-cmx-mexicocity', name: 'Mexico City', region: 'mx-09', tz: 'America/Mexico_City', lat: 19.43, lon: -99.13, col: 68, rent: 900, home: 250000, pop: 9200000, industry: 54, jobs: 80, airport: 'mex', tags: ['affordable', 'production hub'] }),
  city({ id: 'ae-du-dubai', name: 'Dubai', region: 'ae-03', tz: 'Asia/Dubai', lat: 25.20, lon: 55.27, col: 134, rent: 2200, home: 640000, pop: 3600000, industry: 42, jobs: 82, airport: 'dxb', tags: ['no income tax', 'luxury', 'international'] }),
];

// ---------------------------------------------------------------------------
// The rest of the world
// ---------------------------------------------------------------------------

/**
 * Roughly what things cost in a country relative to the United States at 100.
 *
 * These are SLATE calibrations, not published figures, and they are coarse on
 * purpose: they place a country in a band rather than claim to know its prices.
 * A city SLATE actually simulates overrides its country's band entirely.
 */
const COUNTRY_PRICE_LEVEL: Record<string, number> = {
  ch: 155, is: 145, no: 140, bm: 140, ky: 138, sg: 130, dk: 128, ie: 126, lu: 126,
  au: 122, nz: 118, uk: 118, us: 100, ca: 104, nl: 112, se: 112, fi: 112, at: 110,
  be: 110, fr: 110, de: 106, il: 118, jp: 100, kr: 92, ae: 104, qa: 104, hk: 128,
  it: 96, es: 90, pt: 86, gr: 84, cy: 92, mt: 92, si: 86, cz: 80, ee: 88, lt: 78,
  lv: 80, sk: 78, pl: 72, hu: 70, hr: 78, ro: 66, bg: 62, rs: 60, ua: 48, ru: 56,
  tr: 54, cn: 62, tw: 78, my: 56, th: 54, vn: 44, ph: 46, id: 44, in: 38, pk: 34,
  bd: 36, lk: 40, np: 36, mx: 56, br: 54, ar: 50, cl: 62, co: 46, pe: 48, uy: 62,
  za: 52, ng: 40, ke: 46, eg: 34, ma: 50, gh: 44, tz: 42, et: 38, dz: 40, tn: 40,
};

/** Continent fallbacks, for the countries the table above does not name. */
const CONTINENT_PRICE_LEVEL: Record<string, number> = {
  EU: 92, NA: 78, OC: 96, AS: 56, SA: 52, AF: 44, AN: 90,
};

/**
 * Economics for a city nobody has calibrated by hand.
 *
 * Derived from two things SLATE does know: what country it is in and how many
 * people live there. That is enough to tell a capital from a market town, and
 * it is marked as an estimate because that is exactly what it is. Nothing here
 * claims to be a real rent in a real place.
 */
function deriveCity(raw: RawCity): City {
  const country = COUNTRIES.get(raw.countryId);
  const base = COUNTRY_PRICE_LEVEL[raw.countryId]
    ?? CONTINENT_PRICE_LEVEL[WORLD_COUNTRY_BY_ID.get(raw.countryId)?.continent ?? 'EU']
    ?? 70;

  // Big cities cost more than small ones, everywhere, and the curve flattens.
  const scale = Math.log10(Math.max(1_000, raw.population)) - 3;
  const costOfLivingIndex = Math.round(base * (1 + scale * 0.13));
  const monthlyRent = Math.round(costOfLivingIndex * 16.5 * (1 + scale * 0.22));
  const homePrice = Math.round(monthlyRent * 320);
  const kind = CITY_KIND[raw.kind];

  return {
    ...(kind ? { kind } : {}),
    id: raw.id,
    name: raw.name,
    type: 'city',
    parentId: raw.regionId || raw.countryId,
    countryId: raw.countryId,
    timeZone: raw.timeZone,
    latitude: raw.lat,
    longitude: raw.lon,
    costOfLivingIndex,
    medianRentCents: monthlyRent * 100,
    medianHomePriceCents: homePrice * 100,
    population: raw.population,
    // The industry is where SLATE says it is. Everywhere else, you would be
    // working remotely or moving.
    industryPresence: 0,
    jobMarketDepth: Math.round(Math.min(92, 18 + scale * 17)),
    jurisdictionCode: `${REGIONS.get(raw.regionId)?.jurisdictionCode ?? country?.jurisdictionCode ?? raw.countryId.toUpperCase()}-${raw.id.split('-').pop()}`,
    tags: [],
    source: 'calibrated_estimate',
    confidence: 'low',
    version: V,
    note: 'Location, time zone and administrative parentage are public reference data. '
      + 'The cost figures are derived from the country and the population, not looked up.',
  };
}

const CITY_KIND: Record<string, City['kind']> = { x: 'section', c: 'capital', a: 'regional_capital' };

const WORLD_COUNTRY_BY_ID = new Map(WORLD_COUNTRIES.map((c) => [c.id, c]));
const CALIBRATED_IDS = new Set(CALIBRATED_CITIES.map((c) => c.id));

/**
 * Every city SLATE can name. The calibrated ones first, then the largest
 * places on Earth; the remaining ${'${'}TOTAL_CITIES.toLocaleString('en-US')} are fetched
 * a country at a time by `loadCountryCities`.
 */
export const CITIES = new Registry<City>('cities', [
  ...CALIBRATED_CITIES,
  ...WORLD_CITIES.filter((c) => !CALIBRATED_IDS.has(c.id)).map(deriveCity),
]);

/** Countries whose full city list has already been pulled in. */
const loadedCountries = new Set<string>();

/**
 * Pulls in every city in one country.
 *
 * A picker set to Italy should offer all ten thousand Italian towns, not the
 * three that happened to be big enough to bundle. They are fetched once and
 * kept, and asking twice is free.
 */
export async function loadCountryCities(countryId: string): Promise<number> {
  if (loadedCountries.has(countryId)) return 0;
  const total = CITY_COUNTS[countryId];
  if (!total) {
    loadedCountries.add(countryId);
    return 0;
  }

  const response = await fetch(`${import.meta.env.BASE_URL}geo/${countryId}.tsv`);
  if (!response.ok) {
    throw new Error(`The city list for ${COUNTRIES.get(countryId)?.name ?? countryId} could not be loaded.`);
  }
  return addCountryCities(countryId, await response.text());
}

/**
 * Adds every city in one country from its tab-delimited file, as built by
 * `tools/build-world-data.mjs`. The fetch above uses this; so can anything
 * that already has the file in hand.
 */
export function addCountryCities(countryId: string, text: string): number {
  if (loadedCountries.has(countryId)) return 0;
  const parsed: City[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const [id, name, regionId, lat, lon, timeZone, population, kind] = line.split('\t');
    if (!id || !name || !timeZone) continue;
    if (CITIES.get(id)) continue;
    parsed.push(deriveCity({
      id, name, regionId: regionId ?? '', countryId,
      lat: Number(lat), lon: Number(lon), timeZone, population: Number(population) || 0, kind: kind ?? '',
    }));
  }

  loadedCountries.add(countryId);
  return CITIES.add(parsed);
}

/** Whether a country's full list is already in memory. */
export function isCountryLoaded(countryId: string): boolean {
  return loadedCountries.has(countryId);
}

/** How many cities SLATE knows in a country, loaded or not. */
export function cityCount(countryId: string): number {
  return CITY_COUNTS[countryId] ?? 0;
}

/** Every city in the world SLATE knows about, loaded or not. */
export const CITIES_IN_THE_WORLD = TOTAL_CITIES;



function airport(id: string, name: string, iata: string, cityId: string, connectivity: number, runwayFeet: number, privateTerminal = true): Airport {
  const c = CITIES.require(cityId);
  return {
    id, name, type: 'airport', iata, parentId: cityId,
    timeZone: c.timeZone, latitude: c.latitude, longitude: c.longitude,
    connectivity, hasPrivateTerminal: privateTerminal, runwayFeet,
    aliases: [iata],
    ...PUB,
    note: 'Airport identity and served city are public reference data; connectivity is a SLATE rating.',
  };
}

export const AIRPORTS = new Registry<Airport>('airports', [
  airport('lax', 'Los Angeles International Airport', 'LAX', 'us-ca-losangeles', 98, 12091),
  airport('bur', 'Hollywood Burbank Airport', 'BUR', 'us-ca-burbank', 46, 6886),
  airport('jfk', 'John F. Kennedy International Airport', 'JFK', 'us-ny-newyork', 97, 14511),
  airport('atl', 'Hartsfield-Jackson Atlanta International Airport', 'ATL', 'us-ga-atlanta', 96, 12390),
  airport('ord', "O'Hare International Airport", 'ORD', 'us-il-chicago', 95, 13000),
  airport('dfw', 'Dallas/Fort Worth International Airport', 'DFW', 'us-tx-dallas', 93, 13401),
  airport('aus', 'Austin-Bergstrom International Airport', 'AUS', 'us-tx-austin', 62, 12250),
  airport('mia', 'Miami International Airport', 'MIA', 'us-fl-miami', 88, 13016),
  airport('las', 'Harry Reid International Airport', 'LAS', 'us-nv-lasvegas', 78, 14515),
  airport('sea', 'Seattle-Tacoma International Airport', 'SEA', 'us-wa-seattle', 82, 11901),
  airport('pdx', 'Portland International Airport', 'PDX', 'us-or-portland', 62, 11000),
  airport('den', 'Denver International Airport', 'DEN', 'us-co-denver', 88, 16000),
  airport('sfo', 'San Francisco International Airport', 'SFO', 'us-ca-sanfrancisco', 90, 11870),
  airport('san', 'San Diego International Airport', 'SAN', 'us-ca-sandiego', 60, 9401),
  airport('msy', 'Louis Armstrong New Orleans International Airport', 'MSY', 'us-la-neworleans', 54, 10104),
  airport('bna', 'Nashville International Airport', 'BNA', 'us-tn-nashville', 64, 11030),
  airport('bos', 'Boston Logan International Airport', 'BOS', 'us-ma-boston', 84, 10083),
  airport('phx', 'Phoenix Sky Harbor International Airport', 'PHX', 'us-az-phoenix', 80, 11489),
  airport('hnl', 'Daniel K. Inouye International Airport', 'HNL', 'us-hi-honolulu', 66, 12300),
  airport('yvr', 'Vancouver International Airport', 'YVR', 'ca-bc-vancouver', 80, 11500),
  airport('yyz', 'Toronto Pearson International Airport', 'YYZ', 'ca-on-toronto', 90, 11120),
  airport('yul', 'Montreal-Trudeau International Airport', 'YUL', 'ca-qc-montreal', 74, 11000),
  airport('lhr', 'Heathrow Airport', 'LHR', 'uk-eng-london', 99, 12802),
  airport('man', 'Manchester Airport', 'MAN', 'uk-eng-manchester', 70, 10000),
  airport('dub', 'Dublin Airport', 'DUB', 'ie-lei-dublin', 74, 8652),
  airport('cdg', 'Charles de Gaulle Airport', 'CDG', 'fr-idf-paris', 96, 13829),
  airport('ber', 'Berlin Brandenburg Airport', 'BER', 'de-be-berlin', 76, 13123),
  airport('mad', 'Adolfo Suarez Madrid-Barajas Airport', 'MAD', 'es-md-madrid', 86, 14268),
  airport('bcn', 'Josep Tarradellas Barcelona-El Prat Airport', 'BCN', 'es-cat-barcelona', 80, 11893),
  airport('fco', 'Leonardo da Vinci-Fiumicino Airport', 'FCO', 'it-laz-rome', 84, 12795),
  airport('syd', 'Sydney Kingsford Smith Airport', 'SYD', 'au-nsw-sydney', 84, 12999),
  airport('mel', 'Melbourne Airport', 'MEL', 'au-vic-melbourne', 78, 11998),
  airport('akl', 'Auckland Airport', 'AKL', 'nz-akl-auckland', 70, 11926),
  airport('wlg', 'Wellington Airport', 'WLG', 'nz-wgn-wellington', 44, 6351, false),
  airport('hnd', 'Tokyo Haneda Airport', 'HND', 'jp-13-tokyo', 92, 11762),
  airport('icn', 'Incheon International Airport', 'ICN', 'kr-11-seoul', 92, 12303),
  airport('mex', 'Mexico City International Airport', 'MEX', 'mx-cmx-mexicocity', 80, 12966),
  airport('dxb', 'Dubai International Airport', 'DXB', 'ae-du-dubai', 96, 13124),
]);

function hood(id: string, name: string, cityId: string, priceMultiplier: number, prestige: number, safety: number, walkability: number, character: string): Neighbourhood {
  return {
    id, name, type: 'neighbourhood', parentId: cityId,
    priceMultiplier, prestige, safety, walkability, character,
    source: 'calibrated_estimate', confidence: 'medium', version: V,
    note: 'Neighbourhood exists; the ratings are SLATE calibrations.',
  };
}

export const NEIGHBOURHOODS = new Registry<Neighbourhood>('neighbourhoods', [
  hood('la-beverlyhills', 'Beverly Hills', 'us-ca-losangeles', 3.6, 96, 88, 55, 'Old money, new money, and the people who bill them.'),
  hood('la-bel-air', 'Bel Air', 'us-ca-losangeles', 4.8, 97, 92, 22, 'Gated estates behind hedges you cannot see over.'),
  hood('la-hollywoodhills', 'Hollywood Hills', 'us-ca-losangeles', 2.6, 88, 74, 30, 'Winding roads, glass walls and a view of the whole basin.'),
  hood('la-losfeliz', 'Los Feliz', 'us-ca-losangeles', 1.7, 76, 72, 68, 'Spanish revival houses and people who work in post.'),
  hood('la-silverlake', 'Silver Lake', 'us-ca-losangeles', 1.6, 72, 70, 74, 'Coffee, a reservoir, and everyone is writing something.'),
  hood('la-venice', 'Venice', 'us-ca-losangeles', 2.1, 78, 62, 82, 'Canals, boardwalk, and rents that stopped making sense years ago.'),
  hood('la-studiocity', 'Studio City', 'us-ca-losangeles', 1.5, 70, 78, 62, 'Over the hill, close to the lots, and quietly comfortable.'),
  hood('la-northhollywood', 'North Hollywood', 'us-ca-losangeles', 0.95, 52, 60, 66, 'Where you live when the career is still in front of you.'),
  hood('la-koreatown', 'Koreatown', 'us-ca-losangeles', 0.85, 48, 55, 88, 'Dense, awake at all hours, and the best food per block in the city.'),
  hood('la-echopark', 'Echo Park', 'us-ca-losangeles', 1.25, 62, 62, 76, 'Hills, a lake, and a lot of first features.'),
  hood('la-culvercity', 'Culver City', 'us-ca-losangeles', 1.55, 74, 78, 70, 'Studio town that became a tech town and kept the studios.'),
  hood('la-malibu', 'Malibu', 'us-ca-losangeles', 4.2, 92, 84, 18, 'Twenty-one miles of coast and a commute that will ruin you.'),
  hood('nyc-tribeca', 'Tribeca', 'us-ny-newyork', 3.4, 94, 86, 92, 'Cast iron, a film festival, and lofts the size of sound stages.'),
  hood('nyc-uppereast', 'Upper East Side', 'us-ny-newyork', 2.6, 90, 88, 94, 'Doormen, museums and a very specific idea of correct.'),
  hood('nyc-westvillage', 'West Village', 'us-ny-newyork', 3.1, 92, 84, 97, 'Crooked streets, brownstones and the most photographed corners in America.'),
  hood('nyc-brooklynheights', 'Brooklyn Heights', 'us-ny-newyork', 2.4, 86, 86, 90, 'A promenade, a skyline view and quiet that Manhattan cannot buy.'),
  hood('nyc-astoria', 'Astoria', 'us-ny-newyork', 1.1, 58, 76, 88, 'Where the working actors actually live, next to a studio lot.'),
  hood('nyc-harlem', 'Harlem', 'us-ny-newyork', 1.0, 62, 64, 90, 'History on every block and the best brownstone value left.'),
  hood('atl-buckhead', 'Buckhead', 'us-ga-atlanta', 2.0, 82, 82, 48, 'Big houses, big lawns, and everyone in the industry has an address here.'),
  hood('atl-virginiahighland', 'Virginia-Highland', 'us-ga-atlanta', 1.4, 68, 76, 78, 'Bungalows, porches and a walkable strip.'),
  hood('atl-eastatlanta', 'East Atlanta', 'us-ga-atlanta', 0.9, 50, 62, 70, 'Cheap, loud and full of people making things.'),
  hood('ldn-soho', 'Soho', 'uk-eng-london', 2.8, 88, 70, 98, 'Post houses, screening rooms and a pub for every one of them.'),
  hood('ldn-notting', 'Notting Hill', 'uk-eng-london', 2.9, 90, 84, 88, 'Pastel terraces and a market that is now mostly for visitors.'),
  hood('ldn-hackney', 'Hackney', 'uk-eng-london', 1.3, 62, 62, 86, 'Warehouses turned studios and the cheapest edit suites in the city.'),
  hood('van-yaletown', 'Yaletown', 'ca-bc-vancouver', 1.9, 80, 84, 90, 'Glass towers, converted warehouses and constant location shooting.'),
  hood('van-kitsilano', 'Kitsilano', 'ca-bc-vancouver', 1.7, 78, 88, 76, 'Beach, mountains and a very healthy population.'),
]);

/** Great-circle distance in kilometres. Used for travel time and cost. */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function cityDistanceKm(fromCityId: string, toCityId: string): number {
  return distanceKm(CITIES.require(fromCityId), CITIES.require(toCityId));
}

/** Full jurisdiction path for a city, outermost first. Drives tax resolution. */
export function jurisdictionPath(cityId: string): string[] {
  const c = CITIES.require(cityId);
  const r = REGIONS.require(c.parentId);
  const n = COUNTRIES.require(r.parentId);
  return [n.jurisdictionCode, r.jurisdictionCode, c.jurisdictionCode];
}

export function cityTimeZone(cityId: string): string {
  return CITIES.require(cityId).timeZone;
}

export function nearestAirport(cityId: string): string | undefined {
  const c = CITIES.get(cityId);
  if (!c) return undefined;
  if (c.airportId) return c.airportId;
  let best: { id: string; km: number } | undefined;
  for (const a of AIRPORTS.all()) {
    const km = distanceKm(c, a);
    if (!best || km < best.km) best = { id: a.id, km };
  }
  return best?.id;
}
