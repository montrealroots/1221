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
 * Everything the weather does to the world goes through here too: a storm on
 * an exterior shoot day is not a coin flip in the production system any more,
 * it is the weather that day at that location.
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
  /** Also in Celsius, for anything that computes rather than displays. */
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

/** Three draws for a day, from the save's own stream. */
function noise(sim: Simulation, cityId: string, day: number): { temp: number; wet: number; wind: number } {
  const rng = sim.rng('weather', cityId, String(day));
  return { temp: rng.normal(0, 1), wet: rng.next(), wind: rng.next() };
}

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
  if (wet) {
    if (meanC <= 0.5) { condition = 'Snow'; precipitation = 'snow'; }
    else if (highC >= 24 && (normal.type === 'humid_subtropical' || normal.type === 'savanna' || normal.type === 'monsoon' || normal.type === 'equatorial' || normal.type === 'continental') && today.wind > 0.55) {
      condition = 'Thunderstorm'; precipitation = 'storm';
    } else if (normal.type === 'oceanic' && today.wind < 0.5) { condition = 'Drizzle'; precipitation = 'rain'; }
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
    highC: Math.round(highC), lowC: Math.round(lowC),
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

/**
 * How much an exterior shoot day gets done in this weather.
 *
 * One is a full day. A stage does not care. Everything else is the weather
 * that day at that location, not a roll of the dice: a storm halves the day,
 * snow and rain cost a lot, drizzle and fog a little, and heat past the
 * high thirties or a deep freeze slows a crew whatever the sky is doing.
 */
export function shootDayWeather(sim: Simulation, locationId: string, instant: Instant, onStage: boolean): { factor: number; weather?: DayWeather; note?: string } {
  if (onStage) return { factor: 1 };
  const city = CITIES.get(locationId);
  if (!city) return { factor: 1 };
  const weather = weatherOn(sim, city, instant);

  let factor = 1;
  switch (weather.condition) {
    case 'Thunderstorm': factor = 0.45; break;
    case 'Snow': factor = 0.6; break;
    case 'Rain': factor = 0.7; break;
    case 'Drizzle': factor = 0.85; break;
    case 'Fog': factor = 0.85; break;
    case 'Windy': factor = 0.9; break;
    default: factor = 1;
  }
  if (weather.highC >= 38) factor = Math.min(factor, 0.85);
  if (weather.lowC <= -15) factor = Math.min(factor, 0.8);

  const unit = weather.fahrenheit ? '°F' : '°C';
  const note = factor < 1
    ? `${weather.condition} in ${city.name}, ${weather.low}${unit} to ${weather.high}${unit}. Exterior work slowed.`
    : undefined;
  return { factor, weather, note };
}
