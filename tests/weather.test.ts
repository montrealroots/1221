/**
 * The weather knows where it is and what month it is.
 *
 * Los Angeles is warmer in July than January and Sydney is the other way
 * round. Phoenix is dry and London is not. Moscow snows in January and
 * Singapore never does. The same seed, city and day always give the same
 * weather, and two saves do not share a sky. And a storm on an exterior
 * shoot day costs the day what a storm costs, not what a coin says.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES, type City } from '@/engine/content/geography';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { climateTypeFor, normalFor, climateByLatitude, baselineTemperature } from '@/engine/content/climate';
import { forecastFor, shootDayWeather, weatherAt, weatherOn } from '@/engine/systems/weather';

const sim = quickSave({}, 'weather-seed');
const city = (id: string) => {
  const c = CITIES.get(id);
  if (!c) throw new Error(`${id} is not a bundled city`);
  return c;
};
/**
 * A place by its public coordinates, for cities that are not bundled. Only
 * the fields the weather reads; the economics are irrelevant here.
 */
const place = (id: string, name: string, latitude: number, longitude: number, timeZone: string, countryId: string): City => ({
  id, name, type: 'city', parentId: `${countryId}-00`, countryId, timeZone, latitude, longitude,
  costOfLivingIndex: 100, medianRentCents: 0, medianHomePriceCents: 0, population: 0,
  industryPresence: 0, jobMarketDepth: 0, jurisdictionCode: countryId, tags: [],
} as unknown as City);
const SINGAPORE = place('sg-test-singapore', 'Singapore', 1.35, 103.82, 'Asia/Singapore', 'sg');
const MOSCOW = place('ru-test-moscow', 'Moscow', 55.76, 37.62, 'Europe/Moscow', 'ru');
const EXTRA: Record<string, City> = { [SINGAPORE.id]: SINGAPORE, [MOSCOW.id]: MOSCOW };

const on = (id: string, month: number, day: number) => {
  const c = EXTRA[id] ?? city(id);
  return weatherOn(sim, c, instantFromZoned({ year: 2026, month, day, hour: 12, minute: 0, second: 0 }, c.timeZone));
};

/** Average high over a month, to see the season through the noise. */
function meanHighC(id: string, month: number): number {
  let total = 0;
  for (let day = 1; day <= 28; day++) total += on(id, month, day).highC;
  return total / 28;
}
function wetShare(id: string, month: number): number {
  let wet = 0;
  for (let day = 1; day <= 28; day++) if (on(id, month, day).precipitation !== 'none') wet++;
  return wet / 28;
}

describe('the seasons', () => {
  it('make Los Angeles warmer in July than in January', () => {
    expect(meanHighC('us-ca-losangeles', 7)).toBeGreaterThan(meanHighC('us-ca-losangeles', 1) + 5);
  });

  it('run the other way round in Sydney', () => {
    expect(meanHighC('au-nsw-sydney', 1)).toBeGreaterThan(meanHighC('au-nsw-sydney', 7) + 5);
  });

  it('barely move in Singapore', () => {
    const jan = meanHighC(SINGAPORE.id, 1);
    const jul = meanHighC(SINGAPORE.id, 7);
    expect(Math.abs(jan - jul)).toBeLessThan(3);
    expect(jan).toBeGreaterThan(27);
  });
});

describe('the places', () => {
  it('classify the calibrated cities the way an atlas would', () => {
    expect(climateTypeFor(city('us-ca-losangeles'))).toBe('mediterranean');
    expect(climateTypeFor(city('us-az-phoenix'))).toBe('arid');
    expect(climateTypeFor(city('uk-eng-london'))).toBe('oceanic');
    expect(climateTypeFor(city('us-ny-newyork'))).toBe('continental');
    expect(climateTypeFor(city('mx-cmx-mexicocity'))).toBe('highland');
    expect(climateTypeFor(city('ae-du-dubai'))).toBe('arid');
  });

  it('keep Phoenix dry and London wet', () => {
    const phoenix = (wetShare('us-az-phoenix', 1) + wetShare('us-az-phoenix', 7)) / 2;
    const london = (wetShare('uk-eng-london', 1) + wetShare('uk-eng-london', 7)) / 2;
    expect(phoenix).toBeLessThan(0.15);
    expect(london).toBeGreaterThan(0.25);
    expect(london).toBeGreaterThan(phoenix * 3);
  });

  it('give Los Angeles a dry summer and a wetter winter', () => {
    expect(wetShare('us-ca-losangeles', 7)).toBeLessThan(0.1);
    expect(wetShare('us-ca-losangeles', 1)).toBeGreaterThan(0.15);
  });

  it('snow in Moscow in January and never in Singapore', () => {
    let snow = 0;
    for (let day = 1; day <= 28; day++) if (on(MOSCOW.id, 1, day).precipitation === 'snow') snow++;
    expect(snow).toBeGreaterThan(2);
    expect(meanHighC(MOSCOW.id, 1)).toBeLessThan(2);
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= 28; day += 3) expect(on(SINGAPORE.id, month, day).precipitation).not.toBe('snow');
    }
  });

  it('read the temperature in the unit the country uses', () => {
    const la = on('us-ca-losangeles', 7, 4);
    const london = on('uk-eng-london', 7, 4);
    expect(la.fahrenheit).toBe(true);
    expect(london.fahrenheit).toBe(false);
    expect(la.high).toBeGreaterThan(la.highC); // 25°C reads as 77°F
    expect(london.high).toBe(london.highC);
  });

  it('fall back on latitude for a place the table does not name', () => {
    expect(climateByLatitude(2, 30)).toBe('equatorial');
    expect(climateByLatitude(-40, 175)).toBe('oceanic');
    expect(climateByLatitude(55, 60)).toBe('continental');
    expect(climateByLatitude(70, 20)).toBe('polar');
    expect(baselineTemperature(0)).toBeGreaterThan(baselineTemperature(50));
  });

  it('describe a day in one line with a matching icon', () => {
    const now = weatherAt(sim, 'us-ca-losangeles');
    expect(now).toBeTruthy();
    expect(now!.summary).toMatch(/°F/);
    expect(now!.icon.length).toBeGreaterThan(0);
    expect(now!.temperature).toBeGreaterThanOrEqual(now!.low - 1);
    expect(now!.temperature).toBeLessThanOrEqual(now!.high + 1);
  });
});

describe('the sky has a memory and a seed', () => {
  it('gives the same day the same weather every time it is asked', () => {
    const a = on('uk-eng-london', 3, 14);
    const b = on('uk-eng-london', 3, 14);
    expect(a).toEqual(b);
  });

  it('does not share a sky between two saves', () => {
    const other = quickSave({}, 'weather-other-seed');
    const c = city('uk-eng-london');
    let different = 0;
    for (let day = 1; day <= 28; day++) {
      const at = instantFromZoned({ year: 2026, month: 3, day, hour: 12, minute: 0, second: 0 }, c.timeZone);
      if (weatherOn(sim, c, at).highC !== weatherOn(other, c, at).highC) different++;
    }
    expect(different).toBeGreaterThan(14);
  });

  it('moves from one day to the next rather than jumping', () => {
    const week = forecastFor(sim, 'uk-eng-london', 30);
    for (let i = 1; i < week.length; i++) {
      expect(Math.abs((week[i]?.highC ?? 0) - (week[i - 1]?.highC ?? 0))).toBeLessThan(12);
    }
  });

  it('stays within the day it was asked about', () => {
    const noon = weatherAt(sim, 'us-ca-losangeles', sim.now)!;
    const later = weatherAt(sim, 'us-ca-losangeles', sim.now + MS_DAY)!;
    expect(noon.dateKey).not.toBe(later.dateKey);
  });

  it('keeps the normal itself steady from year to year', () => {
    const a = normalFor(city('us-ca-losangeles'), 7, 15);
    expect(a.high).toBeGreaterThan(a.low);
    expect(a.wetChance).toBeLessThan(0.1);
  });
});

describe('a shoot day in the weather', () => {
  it('is unaffected on a stage, and only ever slowed outdoors', () => {
    expect(shootDayWeather(sim, 'us-ca-losangeles', sim.now, true).factor).toBe(1);
    for (let i = 0; i < 60; i++) {
      const outdoors = shootDayWeather(sim, 'uk-eng-london', sim.now + i * MS_DAY, false);
      expect(outdoors.factor).toBeGreaterThan(0);
      expect(outdoors.factor).toBeLessThanOrEqual(1);
      if (outdoors.factor < 1) expect(outdoors.note).toMatch(/London/);
      else expect(outdoors.note).toBeUndefined();
    }
  });

  it('costs a wet day and spares a dry one', () => {
    const c = city('uk-eng-london');
    let wetSeen = false;
    for (let i = 0; i < 60; i++) {
      const at = sim.now + i * MS_DAY;
      const day = weatherOn(sim, c, at);
      const { factor } = shootDayWeather(sim, c.id, at, false);
      if (day.precipitation !== 'none') { expect(factor).toBeLessThan(1); wetSeen = true; }
    }
    expect(wetSeen).toBe(true);
  });
});
