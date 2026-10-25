/**
 * SLATE — the weather, today and for the week, anywhere.
 *
 * Weather is a pure function of the save's seed, the city and the day. It is
 * never stored: asking for Tuesday in Tokyo gives the same answer every time,
 * in every screen, before and after a reload, and asking for a hundred and
 * seventy thousand cities costs nothing until somebody looks. Days are
 * correlated — a cold snap lasts, a wet spell lingers — because the noise
 * that drives a day is blended from the days around it.
 *
 * A thunderstorm called off an outdoor shift here until 2026-09-26, and an
 * exterior shoot day before that. Both systems went, and this said the sky
 * decided nothing but what it showed. A run has read it since 2026-09-28
 * (`FINE`, `trainingAt`, now in `systems/life.ts`), and since 2026-10-25
 * (brief 27, Part 11) a day on location reads `weatherOn` the evening before:
 * a thunderstorm, fog or wind of 40 km/h or more calls it off (`WEATHER_DAY`,
 * `systems/projobs.ts`).
 */

import type { Simulation } from '../core/simulation';
import {
  instantFromZoned, noonOf, startOfDay, zoneOffsetMs, zonedParts, MS_DAY, MS_HOUR, MS_MINUTE, MS_SECOND,
  type Instant,
} from '../core/time';
import { sunTimes } from '../core/sun';
import { CITIES, type City } from '../content/geography';
import { CLIMATE_NAMES, normalFor, toFahrenheit, usesFahrenheit, type ClimateType } from '../content/climate';
import { clamp } from '../core/rng';
import { thunderDaysFor } from '../content/thunder';

export type WeatherCondition =
  | 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Drizzle' | 'Rain' | 'Thunderstorm'
  | 'Snow' | 'Fog' | 'Windy';

export interface DayWeather {
  cityId: string;
  /** Local calendar day this describes. */
  dateKey: string;
  condition: WeatherCondition;
  /** Whole degrees, in the unit the country reads. */
  high: number;
  low: number;
  /** Whether that unit is Fahrenheit. */
  fahrenheit: boolean;
  /**
   * Also in Celsius, unrounded, for anything that computes rather than displays. The hours are worked out from these
   * (`temperatureAtHour`), so an hour, rounded once to the unit the town reads, never reads past the `high` and `low`
   * rounded once from the same figures. From 2026-10-21 (brief 20, the guide area's finding, repaired by the life area):
   * until then these were whole degrees while `high` and `low` were converted from the unrounded figures, and a
   * Fahrenheit town's hours, worked out from the rounded Celsius, read past them: on one save, 238 of a year of New
   * Haven's readings read over the day's high and 146 under its low, and Home said "86°F" beside "High 85°F".
   */
  highC: number;
  lowC: number;
  precipitation: 'none' | 'rain' | 'snow' | 'storm';
  windKph: number;
  humidity: number;
  climate: ClimateType;
  climateName: string;
  /** How much the day sits above or below what is usual, °C. */
  anomalyC: number;
}

/** One hour of a day's weather. The floor of the sky: a moment, in a place. */
export interface HourWeather {
  cityId: string;
  /** The instant the hour begins, on the hour, local. */
  at: Instant;
  /** Local hour of the day, 0 to 23. */
  hour: number;
  /** The calendar day it belongs to, so an hour knows its day. */
  dateKey: string;
  condition: WeatherCondition;
  /** Whole degrees, in the unit the country reads. */
  temperature: number;
  temperatureC: number;
  fahrenheit: boolean;
  /** Whether anything is actually falling in this hour. */
  wet: boolean;
  windKph: number;
  /** Whether the sun is above the horizon for it. */
  daylight: boolean;
}

export interface WeatherNow extends DayWeather {
  /**
   * What the sky is doing *this hour*, which is not always what the day is
   * doing. A snow day whose spell ran out before dawn is overcast by
   * breakfast, and saying "snowing" over a sky that is not is the kind of lie
   * an hourly model exists to stop.
   */
  condition: WeatherCondition;
  /** The day's headline, which is what a forecast for it would say. */
  dayCondition: WeatherCondition;
  /** Whether anything is falling right now. */
  wetNow: boolean;
  /** The temperature at this hour, whole degrees, in the displayed unit. */
  temperature: number;
  temperatureC: number;
  /** One line for a header. */
  summary: string;
  /** The condition in one short word, for a column with no room for two. */
  short: string;
}

/**
 * The picture the weather gets.
 *
 * The rest of SLATE's interface is words, on purpose. The weather is the one
 * place where a picture reads faster than a word does and where every phone,
 * every forecast and every newspaper uses one, so it keeps one. It is always
 * beside the word rather than instead of it, and always hidden from a screen
 * reader, which has the word.
 */
export const WEATHER_EMOJI: Record<WeatherCondition, string> = {
  Clear: '☀️',
  'Partly Cloudy': '⛅',
  Overcast: '☁️',
  Drizzle: '🌦️',
  Rain: '🌧️',
  Thunderstorm: '⛈️',
  Snow: '🌨️',
  Fog: '🌫️',
  Windy: '💨',
};

const SHORT: Record<WeatherCondition, string> = {
  Clear: 'Clear', 'Partly Cloudy': 'Cloudy', Overcast: 'Overcast', Drizzle: 'Drizzle', Rain: 'Rain',
  Thunderstorm: 'Storm', Snow: 'Snow', Fog: 'Fog', Windy: 'Windy',
};

/** A stable integer for a local day, so noise can be keyed on it. */
function dayIndex(instant: Instant, zone: string): number {
  return Math.floor(startOfDay(instant, zone) / MS_DAY);
}

/**
 * Four draws for a day, from the save's own stream. The fourth, for thunder,
 * came after the other three, so adding it moved no day's temperature, rain
 * or wind.
 */
function noise(sim: Simulation, cityId: string, day: number): { temp: number; wet: number; wind: number; thunder: number } {
  const rng = sim.rng('weather', cityId, String(day));
  return { temp: rng.normal(0, 1), wet: rng.next(), wind: rng.next(), thunder: rng.next() };
}

/**
 * How much a day leans toward thunder: a little on a cold day, because winter
 * thunder does happen on the coasts, and far more on a hot one.
 *
 * Thunder is not confined to the wet days. When it was, Madrid and Rome, whose
 * rain falls in winter, had their thunder in winter too, where AEMET has
 * Madrid's in May and June. A summer storm there is the day's only rain. A
 * wet day leaning four times harder was tried as well, and no count, season
 * or run of days came out differently, since a storm is the day's weather
 * whatever the rain was going to be; it went.
 */
function thunderWeight(highC: number): number {
  return 0.02 + clamp((highC - 12) / 16, 0, 1) ** 2.5;
}

/**
 * How many thunder days a place has a year, divided over its above-freezing
 * days as they lean: the chance of thunder on a day is this times that day's
 * weight. Worked out once per city from its normals, since it is the same
 * every year.
 */
const THUNDER_SCALE = new Map<string, number>();
function thunderScale(city: City, type: ClimateType): number {
  const held = THUNDER_SCALE.get(city.id);
  if (held !== undefined) return held;
  let expected = 0;
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= DAYS_IN_MONTH[month - 1]!; day += 1) {
      const normal = normalFor(city, month, day);
      if (normal.mean - 1.5 <= 0.5) continue;
      // A wet day runs cooler, and leans a little less. The wet chance is
      // not quite the share of days that come out wet, since the draw blends
      // two days. The exact share was worked out first, and every count the
      // tests hold stayed inside its bounds without it.
      expected += normal.wetChance * thunderWeight(normal.high - 1.5 - normal.diurnal * 0.2)
        + (1 - normal.wetChance) * thunderWeight(normal.high);
    }
  }
  const scale = expected > 0 ? thunderDaysFor(city.id, type) / expected : 0;
  THUNDER_SCALE.set(city.id, scale);
  return scale;
}
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * The weather on one day.
 *
 * The day's anomaly blends today's draw with the two before it, which is what
 * gives weather its memory. A cold day is more likely to follow a cold day.
 */
export function weatherOn(sim: Simulation, city: City, instant: Instant): DayWeather {
  const zone = city.timeZone;
  const day = dayIndex(instant, zone);
  const parts = zonedParts(instant, zone);
  const normal = normalFor(city, parts.month, parts.day);

  const today = noise(sim, city.id, day);
  const yesterday = noise(sim, city.id, day - 1);
  const before = noise(sim, city.id, day - 2);

  // Interiors swing harder than coasts.
  const spread = normal.type === 'continental' || normal.type === 'subarctic' || normal.type === 'arid' ? 4.2
    : normal.type === 'oceanic' || normal.type === 'equatorial' ? 2.2 : 3.2;
  const anomalyC = (today.temp * 0.6 + yesterday.temp * 0.3 + before.temp * 0.1) * spread;

  // Wet spells linger too, and a wet day is a touch cooler.
  const wetSignal = today.wet * 0.65 + yesterday.wet * 0.35;
  const wet = wetSignal < normal.wetChance;
  const meanC = normal.mean + anomalyC - (wet ? 1.5 : 0);
  const rangeC = normal.diurnal * (wet ? 0.6 : 1);
  const highC = meanC + rangeC / 2;
  const lowC = meanC - rangeC / 2;

  const windKph = Math.round(6 + today.wind * 22 + (wet ? 8 : 0) + (normal.type === 'oceanic' || normal.type === 'polar' ? 6 : 0));
  const humidity = Math.round(clamp(
    (normal.type === 'arid' ? 22 : normal.type === 'semi_arid' ? 35 : normal.type === 'equatorial' || normal.type === 'monsoon' ? 78 : 58)
      + (wet ? 18 : 0) + (today.wet - 0.5) * 10,
    10, 100,
  ));

  let condition: WeatherCondition;
  let precipitation: DayWeather['precipitation'] = 'none';
  if (meanC > 0.5 && today.thunder < Math.min(0.95, thunderScale(city, normal.type) * thunderWeight(highC))) {
    condition = 'Thunderstorm'; precipitation = 'storm';
  } else if (wet) {
    if (meanC <= 0.5) { condition = 'Snow'; precipitation = 'snow'; }
    else if (normal.type === 'oceanic' && today.wind < 0.5) { condition = 'Drizzle'; precipitation = 'rain'; }
    else { condition = 'Rain'; precipitation = 'rain'; }
  } else {
    const cloud = normal.cloud + (yesterday.wet < normal.wetChance ? 0.2 : 0) + (today.wet - 0.5) * 0.3;
    const fogProne = (normal.type === 'oceanic' || normal.type === 'mediterranean') && (parts.month >= 10 || parts.month <= 2) && today.wind < 0.18;
    if (windKph >= 32) condition = 'Windy';
    else if (fogProne) condition = 'Fog';
    else if (cloud >= 0.65) condition = 'Overcast';
    else if (cloud >= 0.35) condition = 'Partly Cloudy';
    else condition = 'Clear';
  }

  const fahrenheit = usesFahrenheit(city.countryId);
  const show = (c: number) => (fahrenheit ? toFahrenheit(c) : Math.round(c));

  return {
    cityId: city.id,
    dateKey: `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    condition,
    high: show(highC), low: show(lowC), fahrenheit,
    highC, lowC,
    precipitation, windKph, humidity,
    climate: normal.type, climateName: CLIMATE_NAMES[normal.type],
    anomalyC: Math.round(anomalyC * 10) / 10,
  };
}

/**
 * The temperature at an hour of a day, in Celsius.
 *
 * Coldest a little before dawn, warmest mid-afternoon: one cosine, peaking at
 * three, between the day's own high and low. Shared by the reading of right
 * now and by the hour-by-hour, so the two can never disagree about what four
 * in the afternoon is like.
 */
function temperatureAtHour(day: DayWeather, hour: number): number {
  const meanC = (day.highC + day.lowC) / 2;
  const halfRange = (day.highC - day.lowC) / 2;
  return meanC + halfRange * Math.cos((2 * Math.PI * (hour - 15)) / 24);
}

/**
 * When it actually rains on a day it rains.
 *
 * A wet day is not wet from midnight to midnight; it has a spell in it. The
 * spell is drawn from its own stream rather than the day's, so adding hours
 * to the model left every day the model had already decided on untouched.
 */
function wetSpell(sim: Simulation, cityId: string, day: number): { from: number; to: number } {
  const rng = sim.rng('weather-hours', cityId, String(day));
  const start = Math.floor(rng.next() * 20);
  const length = 3 + Math.floor(rng.next() * 7);
  return { from: start, to: Math.min(24, start + length) };
}

/**
 * The hours of a day, from an instant forward.
 *
 * Asking at half past seven gives half past seven's hour first and runs to
 * the end of the local day, which is what "the rest of today" means. Asking
 * from the start of a day gives every hour its clock reads, once: twenty-three
 * on the day the clocks go forward, from one where they skip midnight, and
 * twenty-four on the day they go back, where the hour they repeat is given
 * once, at its first run, and runs until the next hour listed.
 *
 * Each hour is put at its own reading on the clock. They were counted from the
 * start of the day, so on the day the clocks went forward every hour after the
 * jump was an hour past its label (a plan from ten to eleven showed the sky at
 * nine), and on the day they went back every hour after it an hour short.
 */
export function hoursOn(sim: Simulation, cityId: string, from: Instant, limit = 24): HourWeather[] {
  const city = CITIES.get(cityId);
  if (!city) return [];
  const zone = city.timeZone;
  const day = weatherOn(sim, city, from);
  const parts = zonedParts(from, zone);
  const spell = wetSpell(sim, city.id, dayIndex(from, zone));
  const sun = sunTimes(from, city.latitude, city.longitude, zone);
  // The start of the hour `from` is in, read off its own clock, so the hour
  // that comes twice on the day the clocks go back is the run being asked
  // about. Where the clocks change inside the hour, as Chatham's do at a
  // quarter to, going back by the minutes on the clock crosses the change and
  // reads another hour; the hour then starts where the clock first reads it
  // again. Without that, the rest of the day asked at ten to four on the day
  // Chatham's clocks went forward began at four.
  let thisHour = from - parts.minute * MS_MINUTE - parts.second * MS_SECOND - (((from % MS_SECOND) + MS_SECOND) % MS_SECOND);
  while (thisHour < from && zonedParts(thisHour, zone).hour !== parts.hour) thisHour += MS_MINUTE;

  const out: HourWeather[] = [];
  let before = -Infinity;
  for (let hour = parts.hour; hour < 24 && out.length < limit; hour++) {
    let at = hour === parts.hour
      ? thisHour
      : instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour }, zone);
    // An hour the clocks skipped isn't in the day.
    if (zonedParts(at, zone).hour !== hour) continue;
    // Asked from the second run of a repeated hour, the next hour on the clock
    // can come round twice as well, and the one wanted is the later.
    if (at <= before) at += zoneOffsetMs(at, zone) - zoneOffsetMs(before, zone);
    before = at;
    const wet = day.precipitation !== 'none' && hour >= spell.from && hour < spell.to;
    const lit = sun.polar === 'day' ? true
      : sun.polar === 'night' ? false
        : at + MS_HOUR > (sun.sunrise ?? at) && at < (sun.sunset ?? at);
    const temperatureC = temperatureAtHour(day, hour);
    out.push({
      cityId: city.id,
      at,
      hour,
      dateKey: day.dateKey,
      condition: hourCondition(day, wet, lit, hour),
      temperature: day.fahrenheit ? toFahrenheit(temperatureC) : Math.round(temperatureC),
      temperatureC: Math.round(temperatureC),
      fahrenheit: day.fahrenheit,
      wet,
      windKph: day.windKph,
      daylight: lit,
    });
  }
  return out;
}

/**
 * What the sky is doing in one hour of a day.
 *
 * Inside the wet spell it is the day's own weather. Outside it, a wet day is
 * still an overcast one — the cloud that brought the rain does not leave
 * between showers — and a dry day keeps what it was, except that fog is a
 * thing that happens around dawn and burns off.
 */
function hourCondition(day: DayWeather, wet: boolean, lit: boolean, hour: number): WeatherCondition {
  if (day.precipitation !== 'none') return wet ? day.condition : 'Overcast';
  if (day.condition === 'Fog') return hour >= 4 && hour < 11 ? 'Fog' : 'Partly Cloudy';
  if (day.condition === 'Clear' && !lit) return 'Clear';
  return day.condition;
}

/**
 * The weather right now: the day, plus the temperature at this hour. Coldest
 * a little before dawn, warmest mid-afternoon.
 */
export function weatherAt(sim: Simulation, cityId: string, instant: Instant = sim.now): WeatherNow | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const day = weatherOn(sim, city, instant);
  const parts = zonedParts(instant, city.timeZone);
  const hour = parts.hour + parts.minute / 60;
  const temperatureC = temperatureAtHour(day, hour);
  const temperature = day.fahrenheit ? toFahrenheit(temperatureC) : Math.round(temperatureC);
  const unit = day.fahrenheit ? '°F' : '°C';
  const thisHour = hoursOn(sim, city.id, instant, 1)[0];
  const condition = thisHour?.condition ?? day.condition;
  return {
    ...day,
    condition,
    dayCondition: day.condition,
    wetNow: thisHour?.wet ?? day.precipitation !== 'none',
    temperature,
    temperatureC: Math.round(temperatureC),
    short: SHORT[condition],
    summary: `${temperature}${unit} ${condition.toLowerCase()}, high ${day.high}${unit}, low ${day.low}${unit}`,
  };
}

/**
 * The days ahead, today first.
 *
 * A calendar date at a time, at noon. It stepped twenty-four hours at a time:
 * asked at eleven or later any evening in the week before a 23-hour day, it
 * stepped clean over that day, and asked before one in the morning in the
 * week up to a 25-hour day, it gave that day twice and lost the week's last.
 */
export function forecastFor(sim: Simulation, cityId: string, days = 7, from: Instant = sim.now): DayWeather[] {
  const city = CITIES.get(cityId);
  if (!city) return [];
  const out: DayWeather[] = [];
  for (let i = 0; i < days; i++) out.push(weatherOn(sim, city, noonOf(from, i, city.timeZone)));
  return out;
}

export function weatherShort(condition: WeatherCondition): string {
  return SHORT[condition];
}

// `outdoorWeather`, what a day's weather did to work done outdoors, was here
// until 2026-09-26. It was named for an exterior shoot day, lost its reader
// when the production system went, found one in the outdoor shift, and went
// with the job engine.

/**
 * The heat index, °C: how hot a temperature feels at a humidity, by the
 * National Weather Service's own method (WPC, "The Heat Index Equation"):
 * Steadman's simple form, and where that comes to 80°F or more, Rothfusz's
 * regression with its two adjustments, for very dry and very humid air.
 * From 2026-10-01 it's what a run reads (`trainingAt` in `systems/life.ts` since 2026-10-09), where until then
 * the humidity the weather drew was only shown.
 */
export function heatIndexC(tempC: number, humidity: number): number {
  const t = tempC * 9 / 5 + 32;
  const rh = humidity;
  let hi = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if ((hi + t) / 2 >= 80) {
    hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t - 0.05481717 * rh * rh + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
    if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    else if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
  }
  return (hi - 32) * 5 / 9;
}
