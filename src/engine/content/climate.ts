/**
 * SLATE — climate: what the weather is usually like, anywhere on Earth.
 *
 * Every city SLATE knows has a latitude, a longitude and a country, and from
 * those this derives a climate: how warm the year runs, how far the seasons
 * swing, when it rains and whether it snows. The shape of it is physics —
 * the sun's height by latitude, seasons that flip across the equator, the
 * wider swings of an interior and the narrower ones of a coast — and on top
 * of that sits a table of Köppen-style classifications for the countries,
 * states and cities people will actually look at, so Phoenix is a desert,
 * London is gray and wet, Mumbai has a monsoon and Sydney's summer is in
 * January.
 *
 * Honesty about what this is: a calibrated climate model, not a record of
 * observed normals for a hundred and seventy thousand places. A real city's
 * real thirty-year average for a given week is not something this game can
 * verify, and the UI says so where the figures are shown.
 */

import type { City } from './geography';

export type ClimateType =
  | 'equatorial' | 'monsoon' | 'savanna' | 'arid' | 'semi_arid' | 'mediterranean'
  | 'humid_subtropical' | 'oceanic' | 'continental' | 'subarctic' | 'polar' | 'highland';

export const CLIMATE_NAMES: Record<ClimateType, string> = {
  equatorial: 'Equatorial', monsoon: 'Tropical Monsoon', savanna: 'Tropical Savanna',
  arid: 'Desert', semi_arid: 'Semi-Arid', mediterranean: 'Mediterranean',
  humid_subtropical: 'Humid Subtropical', oceanic: 'Oceanic', continental: 'Continental',
  subarctic: 'Subarctic', polar: 'Polar', highland: 'Highland',
};

/**
 * Classifications by place id: a city id, then its state or province id, then
 * its country id, first match wins. A hand-kept table for the places that
 * matter most; anywhere else falls back to latitude.
 */
export const CLIMATE_OVERRIDES: Readonly<Record<string, ClimateType>> = {
  // --- Calibrated cities -----------------------------------------------------
  'us-ca-losangeles': 'mediterranean', 'us-ca-burbank': 'mediterranean', 'us-ca-santamonica': 'mediterranean',
  'us-ca-sanfrancisco': 'mediterranean', 'us-ca-sandiego': 'mediterranean',
  'us-nv-lasvegas': 'arid', 'us-az-phoenix': 'arid', 'us-nm-santafe': 'semi_arid',
  'us-co-denver': 'semi_arid', 'us-wa-seattle': 'oceanic', 'us-or-portland': 'oceanic',
  'us-hi-honolulu': 'savanna', 'us-fl-miami': 'savanna',
  'mx-cmx-mexicocity': 'highland', 'ae-du-dubai': 'arid',
  'au-vic-melbourne': 'oceanic', 'nz-wgn-wellington': 'oceanic', 'nz-akl-auckland': 'oceanic',
  'fr-paca-cannes': 'mediterranean', 'es-cat-barcelona': 'mediterranean',

  // --- United States, by state --------------------------------------------
  'us-ak': 'subarctic', 'us-hi': 'savanna',
  'us-wa': 'oceanic', 'us-or': 'oceanic', 'us-ca': 'mediterranean',
  'us-nv': 'arid', 'us-az': 'arid', 'us-ut': 'semi_arid', 'us-nm': 'semi_arid', 'us-id': 'semi_arid',
  'us-mt': 'continental', 'us-wy': 'semi_arid', 'us-co': 'semi_arid',
  'us-nd': 'continental', 'us-sd': 'continental', 'us-ne': 'continental', 'us-ks': 'continental',
  'us-ok': 'humid_subtropical', 'us-tx': 'humid_subtropical',
  'us-mn': 'continental', 'us-ia': 'continental', 'us-mo': 'humid_subtropical', 'us-ar': 'humid_subtropical',
  'us-la': 'humid_subtropical', 'us-ms': 'humid_subtropical', 'us-al': 'humid_subtropical',
  'us-tn': 'humid_subtropical', 'us-ky': 'humid_subtropical', 'us-ga': 'humid_subtropical',
  'us-fl': 'humid_subtropical', 'us-sc': 'humid_subtropical', 'us-nc': 'humid_subtropical',
  'us-va': 'humid_subtropical', 'us-wv': 'continental', 'us-md': 'humid_subtropical', 'us-de': 'humid_subtropical',
  'us-dc': 'humid_subtropical', 'us-nj': 'humid_subtropical', 'us-pa': 'continental', 'us-ny': 'continental',
  'us-ct': 'continental', 'us-ri': 'continental', 'us-ma': 'continental', 'us-vt': 'continental',
  'us-nh': 'continental', 'us-me': 'continental', 'us-oh': 'continental', 'us-mi': 'continental',
  'us-in': 'continental', 'us-il': 'continental', 'us-wi': 'continental',

  // --- Canada and Australia, by province and state -------------------------
  'ca-02': 'oceanic', 'ca-01': 'continental', 'ca-11': 'continental', 'ca-03': 'continental',
  'ca-08': 'continental', 'ca-10': 'continental', 'ca-04': 'continental', 'ca-07': 'continental',
  'ca-05': 'subarctic', 'ca-12': 'subarctic', 'ca-13': 'subarctic', 'ca-14': 'polar',
  'au-02': 'humid_subtropical', 'au-04': 'humid_subtropical', 'au-07': 'oceanic', 'au-06': 'oceanic',
  'au-05': 'semi_arid', 'au-08': 'semi_arid', 'au-03': 'savanna', 'au-01': 'oceanic',

  // --- Countries -------------------------------------------------------------
  uk: 'oceanic', ie: 'oceanic', nl: 'oceanic', be: 'oceanic', dk: 'oceanic', fr: 'oceanic',
  pt: 'mediterranean', es: 'mediterranean', it: 'mediterranean', gr: 'mediterranean', mt: 'mediterranean',
  hr: 'mediterranean', cy: 'mediterranean', tr: 'mediterranean', il: 'mediterranean', lb: 'mediterranean',
  ma: 'mediterranean', tn: 'mediterranean', dz: 'arid', ly: 'arid', eg: 'arid',
  de: 'continental', pl: 'continental', cz: 'continental', at: 'continental', ch: 'continental',
  hu: 'continental', sk: 'continental', ro: 'continental', bg: 'continental', rs: 'continental',
  ua: 'continental', by: 'continental', lt: 'continental', lv: 'continental', ee: 'continental',
  ru: 'continental', kz: 'continental', mn: 'continental', uz: 'arid', tm: 'arid', kg: 'continental', tj: 'continental',
  no: 'subarctic', se: 'subarctic', fi: 'subarctic', is: 'subarctic', gl: 'polar',
  in: 'monsoon', bd: 'monsoon', lk: 'monsoon', mm: 'monsoon', th: 'monsoon', vn: 'monsoon',
  kh: 'monsoon', la: 'monsoon', ph: 'monsoon', np: 'highland', bt: 'highland',
  id: 'equatorial', my: 'equatorial', sg: 'equatorial', bn: 'equatorial', pg: 'equatorial',
  cd: 'equatorial', cg: 'equatorial', ga: 'equatorial', cm: 'equatorial', gq: 'equatorial', ug: 'equatorial',
  ng: 'savanna', gh: 'savanna', ci: 'savanna', sn: 'savanna', bj: 'savanna', tg: 'savanna',
  ke: 'savanna', tz: 'savanna', zm: 'savanna', zw: 'savanna', mz: 'savanna', ao: 'savanna', mw: 'savanna',
  et: 'highland', rw: 'highland', bi: 'highland',
  sa: 'arid', ae: 'arid', qa: 'arid', kw: 'arid', bh: 'arid', om: 'arid', ye: 'arid', iq: 'arid',
  ir: 'arid', jo: 'arid', sy: 'semi_arid', af: 'semi_arid', pk: 'arid',
  mr: 'arid', ml: 'arid', ne: 'arid', td: 'arid', sd: 'arid', er: 'arid', dj: 'arid', so: 'arid',
  na: 'arid', bw: 'semi_arid', za: 'semi_arid', ls: 'highland',
  cn: 'continental', jp: 'humid_subtropical', kr: 'humid_subtropical', kp: 'continental', tw: 'humid_subtropical', hk: 'humid_subtropical',
  mx: 'semi_arid', gt: 'savanna', hn: 'savanna', sv: 'savanna', ni: 'savanna', cr: 'equatorial', pa: 'equatorial',
  cu: 'savanna', do: 'savanna', ht: 'savanna', jm: 'savanna', pr: 'savanna', bs: 'savanna', tt: 'savanna',
  co: 'equatorial', ve: 'savanna', ec: 'equatorial', pe: 'arid', bo: 'highland', br: 'savanna',
  py: 'humid_subtropical', uy: 'humid_subtropical', ar: 'humid_subtropical', cl: 'mediterranean',
  au: 'semi_arid', nz: 'oceanic', fj: 'equatorial',
};

/** Countries that read the temperature in Fahrenheit. */
const FAHRENHEIT_COUNTRIES = new Set(['us', 'bs', 'bz', 'ky', 'lr', 'pw', 'fm', 'mh']);

export function usesFahrenheit(countryId: string): boolean {
  return FAHRENHEIT_COUNTRIES.has(countryId);
}

/** The classification for a city: its own id, then its region, then its country, then latitude. */
export function climateTypeFor(city: Pick<City, 'id' | 'parentId' | 'countryId' | 'latitude' | 'longitude'>): ClimateType {
  return CLIMATE_OVERRIDES[city.id]
    ?? CLIMATE_OVERRIDES[city.parentId]
    ?? CLIMATE_OVERRIDES[city.countryId]
    ?? climateByLatitude(city.latitude, city.longitude);
}

/**
 * The fallback when nothing is known but where a place is on the globe.
 * The two big continental interiors are recognized by longitude, because a
 * winter in Novosibirsk and a winter in Cork are not the same thing.
 */
export function climateByLatitude(latitude: number, longitude: number): ClimateType {
  const lat = Math.abs(latitude);
  const interior = (longitude > 20 && longitude < 135 && lat > 38 && lat < 66)
    || (longitude > -115 && longitude < -78 && lat > 35 && lat < 60);
  if (lat < 10) return 'equatorial';
  if (lat < 23.5) return 'savanna';
  if (lat < 35) return 'humid_subtropical';
  if (lat < 58) return interior ? 'continental' : 'oceanic';
  if (lat < 66.5) return 'subarctic';
  return 'polar';
}

// ---------------------------------------------------------------------------
// Normals
// ---------------------------------------------------------------------------

/** Per-type shape of a year. Northern-hemisphere months; mirrored for the south. */
interface ClimateProfile {
  /** Mean annual temperature offset against the latitude baseline, °C. */
  tempOffset: number;
  /** Seasonal swing relative to the latitude baseline. */
  amplitude: number;
  /** Day/night range, °C. */
  diurnal: number;
  /** Chance a given day has precipitation, by month, January first. */
  wetDays: readonly number[];
  /** Days later than the solstice the warmest day falls. */
  lagDays: number;
  /** Cloud cover on a dry day, 0-1. */
  cloud: number;
}

const flat = (value: number): number[] => Array.from({ length: 12 }, () => value);

const PROFILES: Record<ClimateType, ClimateProfile> = {
  equatorial:        { tempOffset: -1, amplitude: 0.25, diurnal: 8, wetDays: [0.5, 0.45, 0.5, 0.55, 0.55, 0.45, 0.4, 0.4, 0.45, 0.55, 0.6, 0.55], lagDays: 30, cloud: 0.55 },
  monsoon:           { tempOffset: 1, amplitude: 0.6, diurnal: 9, wetDays: [0.05, 0.05, 0.08, 0.12, 0.25, 0.55, 0.7, 0.7, 0.55, 0.25, 0.08, 0.05], lagDays: -20, cloud: 0.35 },
  savanna:           { tempOffset: 0, amplitude: 0.5, diurnal: 10, wetDays: [0.06, 0.07, 0.12, 0.25, 0.4, 0.45, 0.45, 0.45, 0.42, 0.3, 0.14, 0.07], lagDays: 15, cloud: 0.35 },
  arid:              { tempOffset: 2.5, amplitude: 1.1, diurnal: 15, wetDays: [0.06, 0.06, 0.05, 0.03, 0.02, 0.01, 0.02, 0.03, 0.02, 0.03, 0.04, 0.06], lagDays: 25, cloud: 0.12 },
  semi_arid:         { tempOffset: 0.5, amplitude: 1.0, diurnal: 13, wetDays: [0.1, 0.1, 0.12, 0.12, 0.15, 0.12, 0.18, 0.18, 0.14, 0.1, 0.08, 0.1], lagDays: 25, cloud: 0.25 },
  mediterranean:     { tempOffset: 0.5, amplitude: 0.7, diurnal: 10, wetDays: [0.32, 0.3, 0.25, 0.18, 0.1, 0.04, 0.02, 0.02, 0.06, 0.15, 0.28, 0.33], lagDays: 35, cloud: 0.2 },
  humid_subtropical: { tempOffset: 0, amplitude: 0.85, diurnal: 9, wetDays: [0.28, 0.28, 0.3, 0.28, 0.32, 0.38, 0.42, 0.4, 0.32, 0.25, 0.25, 0.28], lagDays: 30, cloud: 0.4 },
  oceanic:           { tempOffset: 1.5, amplitude: 0.55, diurnal: 7, wetDays: [0.45, 0.4, 0.38, 0.35, 0.33, 0.32, 0.3, 0.32, 0.35, 0.42, 0.45, 0.46], lagDays: 40, cloud: 0.6 },
  continental:       { tempOffset: -2, amplitude: 1.15, diurnal: 10, wetDays: [0.3, 0.28, 0.3, 0.32, 0.36, 0.38, 0.36, 0.34, 0.3, 0.3, 0.32, 0.32], lagDays: 25, cloud: 0.5 },
  subarctic:         { tempOffset: -3, amplitude: 1.3, diurnal: 8, wetDays: [0.35, 0.3, 0.28, 0.25, 0.25, 0.3, 0.35, 0.38, 0.38, 0.38, 0.38, 0.38], lagDays: 30, cloud: 0.6 },
  polar:             { tempOffset: -6, amplitude: 1.2, diurnal: 5, wetDays: flat(0.2), lagDays: 30, cloud: 0.6 },
  highland:          { tempOffset: -8, amplitude: 0.4, diurnal: 13, wetDays: [0.1, 0.1, 0.15, 0.25, 0.35, 0.45, 0.5, 0.5, 0.45, 0.3, 0.12, 0.08], lagDays: 15, cloud: 0.4 },
};

/** Mean annual temperature the sun alone would give this latitude, °C. */
export function baselineTemperature(latitude: number): number {
  const lat = Math.abs(latitude);
  return 28 - 0.0058 * lat * lat - 0.05 * lat;
}

/** Half the summer-to-winter swing the latitude alone would give, °C. */
export function baselineAmplitude(latitude: number): number {
  return 1.5 + 0.2 * Math.abs(latitude);
}

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Day of the year, 1-366, from a local month and day. */
export function dayOfYear(month: number, day: number, leap = false): number {
  const before = DAYS_BEFORE_MONTH[month - 1] ?? 0;
  return before + day + (leap && month > 2 ? 1 : 0);
}

export interface DailyNormal {
  type: ClimateType;
  /** Mean temperature for the day, °C. */
  mean: number;
  /** Typical high and low, °C. */
  high: number;
  low: number;
  /** Chance of precipitation on this day. */
  wetChance: number;
  /** Typical cloud cover on a dry day, 0-1. */
  cloud: number;
  /** Day/night range, °C. */
  diurnal: number;
}

/**
 * What a day is usually like at this place and date.
 *
 * The warm peak sits a few weeks after the solstice — late July in the north,
 * late January in the south — and everything else follows from that.
 */
export function normalFor(
  city: Pick<City, 'id' | 'parentId' | 'countryId' | 'latitude' | 'longitude'>,
  month: number,
  day: number,
): DailyNormal {
  const type = climateTypeFor(city);
  const profile = PROFILES[type];
  const southern = city.latitude < 0;
  const doy = dayOfYear(month, day);

  const mean = baselineTemperature(city.latitude) + profile.tempOffset;
  const amplitude = baselineAmplitude(city.latitude) * profile.amplitude;
  // Northern peak near 21 June + lag; the south is half a year away.
  const peak = 172 + profile.lagDays + (southern ? 182.5 : 0);
  const seasonal = amplitude * Math.cos((2 * Math.PI * (doy - peak)) / 365.25);
  const today = mean + seasonal;

  // The wet-day curve is written for the north; the south reads it six months on.
  const monthIndex = southern ? (month - 1 + 6) % 12 : month - 1;
  const wetChance = profile.wetDays[monthIndex] ?? 0.2;

  return {
    type,
    mean: today,
    high: today + profile.diurnal / 2,
    low: today - profile.diurnal / 2,
    wetChance,
    cloud: profile.cloud,
    diurnal: profile.diurnal,
  };
}

/** Celsius to Fahrenheit, rounded to a whole degree. */
export function toFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32);
}
