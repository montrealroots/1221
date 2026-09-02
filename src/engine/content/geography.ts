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

export interface Country extends ReferenceRecord {
  type: 'country';
  iso2: string;
  currency: string;
  /** Path segment used by the jurisdiction resolver. */
  jurisdictionCode: string;
  drivesOn: 'left' | 'right';
}

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

export const COUNTRIES = new Registry<Country>('countries', [
  { id: 'us', name: 'United States', aliases: ['USA', 'America'], type: 'country', iso2: 'US', currency: 'USD', jurisdictionCode: 'US', drivesOn: 'right', ...PUB },
  { id: 'ca', name: 'Canada', type: 'country', iso2: 'CA', currency: 'CAD', jurisdictionCode: 'CA', drivesOn: 'right', ...PUB },
  { id: 'uk', name: 'United Kingdom', aliases: ['Britain', 'UK'], type: 'country', iso2: 'GB', currency: 'GBP', jurisdictionCode: 'GB', drivesOn: 'left', ...PUB },
  { id: 'ie', name: 'Ireland', type: 'country', iso2: 'IE', currency: 'EUR', jurisdictionCode: 'IE', drivesOn: 'left', ...PUB },
  { id: 'fr', name: 'France', type: 'country', iso2: 'FR', currency: 'EUR', jurisdictionCode: 'FR', drivesOn: 'right', ...PUB },
  { id: 'de', name: 'Germany', type: 'country', iso2: 'DE', currency: 'EUR', jurisdictionCode: 'DE', drivesOn: 'right', ...PUB },
  { id: 'es', name: 'Spain', type: 'country', iso2: 'ES', currency: 'EUR', jurisdictionCode: 'ES', drivesOn: 'right', ...PUB },
  { id: 'it', name: 'Italy', type: 'country', iso2: 'IT', currency: 'EUR', jurisdictionCode: 'IT', drivesOn: 'right', ...PUB },
  { id: 'au', name: 'Australia', type: 'country', iso2: 'AU', currency: 'AUD', jurisdictionCode: 'AU', drivesOn: 'left', ...PUB },
  { id: 'nz', name: 'New Zealand', type: 'country', iso2: 'NZ', currency: 'NZD', jurisdictionCode: 'NZ', drivesOn: 'left', ...PUB },
  { id: 'jp', name: 'Japan', type: 'country', iso2: 'JP', currency: 'JPY', jurisdictionCode: 'JP', drivesOn: 'left', ...PUB },
  { id: 'kr', name: 'South Korea', type: 'country', iso2: 'KR', currency: 'KRW', jurisdictionCode: 'KR', drivesOn: 'right', ...PUB },
  { id: 'mx', name: 'Mexico', type: 'country', iso2: 'MX', currency: 'MXN', jurisdictionCode: 'MX', drivesOn: 'right', ...PUB },
  { id: 'ae', name: 'United Arab Emirates', type: 'country', iso2: 'AE', currency: 'AED', jurisdictionCode: 'AE', drivesOn: 'right', ...PUB },
]);

function region(id: string, name: string, code: string, parentId: string): Region {
  return { id, name, type: 'region', code, parentId, jurisdictionCode: `${COUNTRIES.require(parentId).jurisdictionCode}-${code}`, ...PUB };
}

export const REGIONS = new Registry<Region>('regions', [
  region('us-ca', 'California', 'CA', 'us'),
  region('us-ny', 'New York', 'NY', 'us'),
  region('us-ga', 'Georgia', 'GA', 'us'),
  region('us-tx', 'Texas', 'TX', 'us'),
  region('us-fl', 'Florida', 'FL', 'us'),
  region('us-il', 'Illinois', 'IL', 'us'),
  region('us-nv', 'Nevada', 'NV', 'us'),
  region('us-wa', 'Washington', 'WA', 'us'),
  region('us-or', 'Oregon', 'OR', 'us'),
  region('us-co', 'Colorado', 'CO', 'us'),
  region('us-nm', 'New Mexico', 'NM', 'us'),
  region('us-la', 'Louisiana', 'LA', 'us'),
  region('us-nc', 'North Carolina', 'NC', 'us'),
  region('us-tn', 'Tennessee', 'TN', 'us'),
  region('us-ma', 'Massachusetts', 'MA', 'us'),
  region('us-pa', 'Pennsylvania', 'PA', 'us'),
  region('us-az', 'Arizona', 'AZ', 'us'),
  region('us-ut', 'Utah', 'UT', 'us'),
  region('us-mi', 'Michigan', 'MI', 'us'),
  region('us-oh', 'Ohio', 'OH', 'us'),
  region('us-nj', 'New Jersey', 'NJ', 'us'),
  region('us-hi', 'Hawaii', 'HI', 'us'),
  region('ca-bc', 'British Columbia', 'BC', 'ca'),
  region('ca-on', 'Ontario', 'ON', 'ca'),
  region('ca-qc', 'Quebec', 'QC', 'ca'),
  region('uk-eng', 'England', 'ENG', 'uk'),
  region('uk-sct', 'Scotland', 'SCT', 'uk'),
  region('uk-wls', 'Wales', 'WLS', 'uk'),
  region('ie-lei', 'Leinster', 'LEI', 'ie'),
  region('fr-idf', 'Ile-de-France', 'IDF', 'fr'),
  region('fr-paca', 'Provence-Alpes-Cote d’Azur', 'PAC', 'fr'),
  region('de-be', 'Berlin', 'BE', 'de'),
  region('es-md', 'Madrid', 'MD', 'es'),
  region('es-cat', 'Catalonia', 'CAT', 'es'),
  region('it-laz', 'Lazio', 'LAZ', 'it'),
  region('au-nsw', 'New South Wales', 'NSW', 'au'),
  region('au-vic', 'Victoria', 'VIC', 'au'),
  region('au-qld', 'Queensland', 'QLD', 'au'),
  region('nz-akl', 'Auckland', 'AKL', 'nz'),
  region('nz-wgn', 'Wellington', 'WGN', 'nz'),
  region('jp-13', 'Tokyo', 'TKY', 'jp'),
  region('kr-11', 'Seoul', 'SEO', 'kr'),
  region('mx-cmx', 'Mexico City', 'CMX', 'mx'),
  region('ae-du', 'Dubai', 'DU', 'ae'),
]);

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

export const CITIES = new Registry<City>('cities', [
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
  city({ id: 'ca-bc-vancouver', name: 'Vancouver', region: 'ca-bc', tz: 'America/Vancouver', lat: 49.28, lon: -123.12, col: 137, rent: 2400, home: 1150000, pop: 675000, industry: 82, jobs: 76, airport: 'yvr', tags: ['production hub', 'incentives', 'mountains'] }),
  city({ id: 'ca-on-toronto', name: 'Toronto', region: 'ca-on', tz: 'America/Toronto', lat: 43.65, lon: -79.38, col: 128, rent: 2200, home: 900000, pop: 2900000, industry: 74, jobs: 88, airport: 'yyz', tags: ['production hub', 'incentives', 'finance'] }),
  city({ id: 'ca-qc-montreal', name: 'Montreal', region: 'ca-qc', tz: 'America/Toronto', lat: 45.50, lon: -73.57, col: 105, rent: 1500, home: 550000, pop: 1760000, industry: 62, jobs: 76, airport: 'yul', tags: ['vfx', 'incentives', 'bilingual'] }),
  city({ id: 'uk-eng-london', name: 'London', region: 'uk-eng', tz: 'Europe/London', lat: 51.51, lon: -0.13, col: 158, rent: 2700, home: 780000, pop: 8900000, industry: 86, jobs: 94, airport: 'lhr', tags: ['theatre', 'production hub', 'international'] }),
  city({ id: 'uk-eng-manchester', name: 'Manchester', region: 'uk-eng', tz: 'Europe/London', lat: 53.48, lon: -2.24, col: 108, rent: 1350, home: 330000, pop: 553000, industry: 52, jobs: 76, airport: 'man', tags: ['television', 'affordable', 'music'] }),
  city({ id: 'uk-sct-glasgow', name: 'Glasgow', region: 'uk-sct', tz: 'Europe/London', lat: 55.86, lon: -4.25, col: 98, rent: 1100, home: 250000, pop: 635000, industry: 44, jobs: 68, tags: ['incentives', 'locations'] }),
  city({ id: 'ie-lei-dublin', name: 'Dublin', region: 'ie-lei', tz: 'Europe/Dublin', lat: 53.35, lon: -6.26, col: 132, rent: 2100, home: 520000, pop: 590000, industry: 54, jobs: 78, airport: 'dub', tags: ['incentives', 'production'] }),
  city({ id: 'fr-idf-paris', name: 'Paris', region: 'fr-idf', tz: 'Europe/Paris', lat: 48.86, lon: 2.35, col: 142, rent: 2200, home: 780000, pop: 2100000, industry: 66, jobs: 86, airport: 'cdg', tags: ['festival', 'fashion', 'arthouse'] }),
  city({ id: 'fr-paca-cannes', name: 'Cannes', region: 'fr-paca', tz: 'Europe/Paris', lat: 43.55, lon: 7.02, col: 138, rent: 1900, home: 720000, pop: 74000, industry: 70, jobs: 42, tags: ['festival', 'market', 'riviera'] }),
  city({ id: 'de-be-berlin', name: 'Berlin', region: 'de-be', tz: 'Europe/Berlin', lat: 52.52, lon: 13.40, col: 112, rent: 1450, home: 520000, pop: 3700000, industry: 62, jobs: 82, airport: 'ber', tags: ['festival', 'affordable', 'creative'] }),
  city({ id: 'es-md-madrid', name: 'Madrid', region: 'es-md', tz: 'Europe/Madrid', lat: 40.42, lon: -3.70, col: 102, rent: 1300, home: 420000, pop: 3300000, industry: 56, jobs: 78, airport: 'mad', tags: ['production hub', 'sunny'] }),
  city({ id: 'es-cat-barcelona', name: 'Barcelona', region: 'es-cat', tz: 'Europe/Madrid', lat: 41.39, lon: 2.17, col: 108, rent: 1400, home: 480000, pop: 1620000, industry: 52, jobs: 76, airport: 'bcn', tags: ['locations', 'beach', 'design'] }),
  city({ id: 'it-laz-rome', name: 'Rome', region: 'it-laz', tz: 'Europe/Rome', lat: 41.90, lon: 12.50, col: 104, rent: 1250, home: 430000, pop: 2800000, industry: 58, jobs: 70, airport: 'fco', tags: ['historic studios', 'locations'] }),
  city({ id: 'au-nsw-sydney', name: 'Sydney', region: 'au-nsw', tz: 'Australia/Sydney', lat: -33.87, lon: 151.21, col: 141, rent: 2400, home: 1050000, pop: 5300000, industry: 66, jobs: 86, airport: 'syd', tags: ['southern hemisphere', 'harbour', 'production hub'] }),
  city({ id: 'au-vic-melbourne', name: 'Melbourne', region: 'au-vic', tz: 'Australia/Melbourne', lat: -37.81, lon: 144.96, col: 128, rent: 1900, home: 780000, pop: 5000000, industry: 58, jobs: 84, airport: 'mel', tags: ['southern hemisphere', 'arts', 'coffee'] }),
  city({ id: 'au-qld-goldcoast', name: 'Gold Coast', region: 'au-qld', tz: 'Australia/Brisbane', lat: -28.02, lon: 153.40, col: 118, rent: 1700, home: 720000, pop: 640000, industry: 62, jobs: 58, tags: ['studios', 'incentives', 'beach', 'no daylight saving'] }),
  city({ id: 'nz-wgn-wellington', name: 'Wellington', region: 'nz-wgn', tz: 'Pacific/Auckland', lat: -41.29, lon: 174.78, col: 116, rent: 1650, home: 640000, pop: 215000, industry: 72, jobs: 58, airport: 'wlg', tags: ['vfx', 'southern hemisphere', 'incentives'] }),
  city({ id: 'nz-akl-auckland', name: 'Auckland', region: 'nz-akl', tz: 'Pacific/Auckland', lat: -36.85, lon: 174.76, col: 122, rent: 1750, home: 720000, pop: 1650000, industry: 56, jobs: 72, airport: 'akl', tags: ['southern hemisphere', 'locations'] }),
  city({ id: 'jp-13-tokyo', name: 'Tokyo', region: 'jp-13', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69, col: 126, rent: 1500, home: 620000, pop: 13900000, industry: 62, jobs: 92, airport: 'hnd', tags: ['international', 'animation', 'dense'] }),
  city({ id: 'kr-11-seoul', name: 'Seoul', region: 'kr-11', tz: 'Asia/Seoul', lat: 37.57, lon: 126.98, col: 118, rent: 1350, home: 700000, pop: 9700000, industry: 68, jobs: 90, airport: 'icn', tags: ['international', 'television', 'music'] }),
  city({ id: 'mx-cmx-mexicocity', name: 'Mexico City', region: 'mx-cmx', tz: 'America/Mexico_City', lat: 19.43, lon: -99.13, col: 68, rent: 900, home: 250000, pop: 9200000, industry: 54, jobs: 80, airport: 'mex', tags: ['affordable', 'production hub'] }),
  city({ id: 'ae-du-dubai', name: 'Dubai', region: 'ae-du', tz: 'Asia/Dubai', lat: 25.20, lon: 55.27, col: 134, rent: 2200, home: 640000, pop: 3600000, industry: 42, jobs: 82, airport: 'dxb', tags: ['no income tax', 'luxury', 'international'] }),
]);

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
