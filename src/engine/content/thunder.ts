/**
 * SLATE — how many days a year it thunders, by place.
 *
 * The weather used to give a thunderstorm only to five climate types, and only
 * on a wet day over 24°C. London, Paris, Los Angeles and Mexico City went two
 * years without one, and Tokyo had more than twice its share. Now each place
 * has a number of thunder days a year, and `systems/weather.ts` spreads them
 * over its wet days, more of them in the warm part of the year.
 *
 * Where the number is a published one it is in `THUNDER_DAYS`, with where it
 * came from. Everywhere else it is `THUNDER_BY_CLIMATE`, which is SLATE's
 * estimate for the climate type, set against the published ones: a day with
 * thunder heard at the station, the way met services count them.
 *
 * Measured over ten years of days in five worlds, every published city lands
 * within fifteen percent of its count, and Berlin, Seoul and Mexico City,
 * which have none, within a tenth of their climate's estimate. The season
 * is the warm half of the year everywhere, which is right for all but two:
 * Mexico City's storms come the year round where they come in the rainy
 * season, June to September, and Auckland's come in summer where NIWA has
 * most in winter, off cold air from the south. Nothing here knows about a
 * rainy season or a cold outbreak.
 */

import type { ClimateType } from './climate';

/** Published thunder days a year, by city id, and the source of each. */
export const THUNDER_DAYS: Readonly<Record<string, { days: number; source: string }>> = {
  'uk-eng-london': { days: 16, source: 'Met Office factsheet, southeast England 15 to 19' },
  'fr-idf-paris': { days: 18, source: 'Climate of Paris, period not stated' },
  'ie-lei-dublin': { days: 5, source: 'Met Éireann, Dublin Airport 1991-2020' },
  'es-md-madrid': { days: 14.3, source: 'AEMET, Madrid Retiro normals 1981-2010' },
  'it-laz-rome': { days: 19, source: 'MeteoNews, 1994-2005, station not named' },
  'is-39-reykjavik': { days: 2, source: 'Icelandic Met Office, the south and west 1 to 4' },
  'us-ny-newyork': { days: 19.4, source: 'NOAA NCEI 1961-90, via Current Results' },
  'us-ca-losangeles': { days: 4.6, source: 'NOAA NCEI 1961-90, via Current Results' },
  'us-fl-miami': { days: 72, source: 'NOAA NCEI 1961-90, via Current Results' },
  'us-il-chicago': { days: 38, source: 'NOAA NCEI 1961-90, via Current Results' },
  'ca-on-toronto': { days: 28, source: 'Environment Canada 1971-2000, via Current Results' },
  'ca-bc-vancouver': { days: 6.1, source: 'Climate of Vancouver, period unknown' },
  'au-nsw-sydney': { days: 22, source: 'Climate of Sydney, 20 to 25' },
  'au-vic-melbourne': { days: 10.6, source: 'Bureau of Meteorology, Melbourne' },
  'nz-akl-auckland': { days: 12, source: 'NIWA, The Climate and Weather of Auckland' },
  'jp-13-tokyo': { days: 14.5, source: 'Japan Meteorological Agency, Tokyo 1991-2020' },
  'sg-singapore': { days: 167, source: 'Meteorological Service Singapore, 1991-2020' },
};

/**
 * SLATE's estimate by climate type, for anywhere without a published number.
 * Set so the calibrated cities of each type sit around it: continental from
 * Chicago, Toronto and New York; oceanic from London, Paris and Dublin.
 */
export const THUNDER_BY_CLIMATE: Readonly<Record<ClimateType, number>> = {
  equatorial: 150, monsoon: 90, savanna: 70, arid: 5, semi_arid: 20, mediterranean: 12,
  humid_subtropical: 30, oceanic: 12, continental: 25, subpolar_oceanic: 3, subarctic: 8,
  polar: 0, highland: 40,
};

/** Thunder days a year at a place: published where there is a number, else the estimate. */
export function thunderDaysFor(cityId: string, type: ClimateType): number {
  return THUNDER_DAYS[cityId]?.days ?? THUNDER_BY_CLIMATE[type];
}
