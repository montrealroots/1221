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
import { MS_DAY, startOfDay, zonedParts, type Instant } from '../core/time';
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

export interface WeatherNow extends DayWeather {
  /** The temperature at this hour, whole degrees, in the displayed unit. */
  temperature: number;
  temperatureC: number;
  /** One line for a header. */
  summary: string;
  /** The condition in one short word, for a column with no room for two. */
  short: string;
}

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
 * The weather right now: the day, plus the temperature at this hour. Coldest
 * a little before dawn, warmest mid-afternoon.
 */
export function weatherAt(sim: Simulation, cityId: string, instant: Instant = sim.now): WeatherNow | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const day = weatherOn(sim, city, instant);
  const parts = zonedParts(instant, city.timeZone);
  const hour = parts.hour + parts.minute / 60;
  const meanC = (day.highC + day.lowC) / 2;
  const halfRange = (day.highC - day.lowC) / 2;
  const temperatureC = meanC + halfRange * Math.cos((2 * Math.PI * (hour - 15)) / 24);
  const temperature = day.fahrenheit ? toFahrenheit(temperatureC) : Math.round(temperatureC);
  const unit = day.fahrenheit ? '°F' : '°C';
  return {
    ...day,
    temperature,
    temperatureC: Math.round(temperatureC),
    short: SHORT[day.condition],
    summary: `${temperature}${unit} ${day.condition.toLowerCase()}, high ${day.high}${unit}, low ${day.low}${unit}`,
  };
}

/** The days ahead, today first. */
export function forecastFor(sim: Simulation, cityId: string, days = 7, from: Instant = sim.now): DayWeather[] {
  const city = CITIES.get(cityId);
  if (!city) return [];
  const out: DayWeather[] = [];
  for (let i = 0; i < days; i++) out.push(weatherOn(sim, city, from + i * MS_DAY));
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
