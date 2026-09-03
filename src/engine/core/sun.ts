/**
 * SLATE — when the sun rises and sets, anywhere, on any day.
 *
 * Not a lookup: the geometry. The Earth's tilt, the day of the year and the
 * latitude give the sun's declination and the hour angle at which it crosses
 * the horizon, and the longitude and the equation of time place that on the
 * clock. This is the standard NOAA solar calculation, accurate to a minute or
 * two, which is real astronomy rather than an invented figure — and it is
 * why June in Reykjavik has twenty-one hours of light and December in
 * Sydney is the long day, not the short one.
 */

import { MS_MINUTE, zonedParts, type Instant, type TimeZone } from './time';

export interface SunTimes {
  sunrise?: Instant;
  sunset?: Instant;
  /** Minutes of daylight. A full day for polar day, none for polar night. */
  daylightMinutes: number;
  polar?: 'day' | 'night';
}

const RAD = Math.PI / 180;
/** The sun's centre 0.833° below the horizon: the conventional sunrise. */
const ZENITH = 90.833;

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function leap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Sunrise and sunset on the local calendar day of `instant`, at this spot. */
export function sunTimes(instant: Instant, latitude: number, longitude: number, zone: TimeZone): SunTimes {
  const p = zonedParts(instant, zone);
  const yearDays = leap(p.year) ? 366 : 365;
  const doy = (DAYS_BEFORE_MONTH[p.month - 1] ?? 0) + p.day + (leap(p.year) && p.month > 2 ? 1 : 0);

  // Fractional year, at local noon, in radians.
  const gamma = (2 * Math.PI / yearDays) * (doy - 1 + (12 - 12) / 24);
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  const lat = Math.max(-89.9, Math.min(89.9, latitude)) * RAD;
  const cosHa = Math.cos(ZENITH * RAD) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);

  if (cosHa > 1) return { daylightMinutes: 0, polar: 'night' };
  if (cosHa < -1) return { daylightMinutes: 24 * 60, polar: 'day' };

  const ha = Math.acos(cosHa) / RAD;
  const riseUtcMinutes = 720 - 4 * (longitude + ha) - eot;
  const setUtcMinutes = 720 - 4 * (longitude - ha) - eot;

  const midnightUtc = Date.UTC(p.year, p.month - 1, p.day);
  return {
    sunrise: midnightUtc + riseUtcMinutes * MS_MINUTE,
    sunset: midnightUtc + setUtcMinutes * MS_MINUTE,
    daylightMinutes: Math.round(setUtcMinutes - riseUtcMinutes),
  };
}

/** Hours and minutes of daylight, as words. */
export function formatDaylight(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
