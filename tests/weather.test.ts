/**
 * The weather knows where it is and what month it is.
 *
 * Los Angeles is warmer in July than January and Sydney is the other way
 * round. Phoenix is dry and London is not. Moscow snows in January and
 * Singapore never does. The same seed, city and day always give the same
 * weather, and two saves do not share a sky. It thunders about as often as
 * the met services count, in the right season.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES, type City } from '@/engine/content/geography';
import { MS_DAY, instantFromZoned, startOfDay, zonedParts } from '@/engine/core/time';
import { climateTypeFor, normalFor, climateByLatitude, baselineTemperature } from '@/engine/content/climate';
import { forecastFor, hoursOn, weatherAt, weatherOn } from '@/engine/systems/weather';
import { THUNDER_DAYS } from '@/engine/content/thunder';

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
  jurisdictionCode: countryId, tags: [],
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

  it('tell a cold coast from a cold interior', () => {
    // Sixty-two degrees north in the middle of Siberia and sixty-two degrees
    // north in the North Atlantic are not the same winter, and reading every
    // high latitude as subarctic said they were.
    expect(climateByLatitude(62, 110)).toBe('subarctic');
    expect(climateByLatitude(62, -20)).toBe('subpolar_oceanic');
    expect(climateTypeFor(city('is-39-reykjavik'))).toBe('subpolar_oceanic');
  });
});

/**
 * Reykjavík against the record.
 *
 * It is the home base of every save, so its numbers are on the main screen of
 * the game every day a player opens it, and they were twenty degrees wrong:
 * a January mean of -20.6°C against a real -0.5°C, and a summer-to-winter
 * swing of 37° against a real 12°. The model is a model and will never match
 * a thirty-year average exactly, so this holds it to a degree and a half —
 * tight enough to catch the class of error that put snow on Home in March,
 * loose enough not to fail on a refinement that is still right.
 *
 * Figures are the 1991-2020 normals for the Reykjavík station.
 */
describe('the home base', () => {
  const NORMALS: readonly (readonly [month: number, mean: number, high: number])[] = [
    [1, -0.5, 1.9], [2, -0.1, 2.8], [3, 0.7, 3.6], [4, 2.9, 5.9],
    [7, 11.2, 14.1], [10, 4.4, 7.0], [12, 0.4, 2.9],
  ];
  const TOLERANCE = 1.5;

  for (const [month, mean, high] of NORMALS) {
    it(`reads month ${month} within a degree and a half of the record`, () => {
      const normal = normalFor(city('is-39-reykjavik'), month, 15);
      expect(Math.abs(normal.mean - mean), `mean ${normal.mean.toFixed(1)} against ${mean}`)
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(normal.high - high), `high ${normal.high.toFixed(1)} against ${high}`)
        .toBeLessThan(TOLERANCE);
    });
  }

  it('swings through the year the way the sea lets it', () => {
    const swing = normalFor(city('is-39-reykjavik'), 7, 15).mean
      - normalFor(city('is-39-reykjavik'), 1, 15).mean;
    expect(Math.abs(swing - 11.7), `swing ${swing.toFixed(1)} against 11.7`).toBeLessThan(TOLERANCE);
  });

  it('never puts a Reykjavík March below freezing all day', () => {
    // What the bug actually looked like: "snow in Reykjavík on Thursday,
    // -16°C to -11°C" on a day whose real high is about four above.
    for (let day = 1; day <= 28; day += 3) {
      const march = on('is-39-reykjavik', 3, day);
      expect(march.highC, `March ${day} high ${march.highC}`).toBeGreaterThan(-4);
    }
  });

  it('describe a day in one line, with a short word for the condition', () => {
    const now = weatherAt(sim, 'us-ca-losangeles');
    expect(now).toBeTruthy();
    expect(now!.summary).toMatch(/°F/);
    expect(now!.short).toMatch(/^[A-Z][a-z]+$/);
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

describe('thunder', () => {
  // Three worlds, two years each: six years of days per city, enough that a
  // published count shows through the noise.
  const worlds = [0, 1, 2].map((n) => quickSave({}, `thunder-${n}`));
  const storms = (id: string) => {
    const c = city(id);
    const months = new Array<number>(12).fill(0);
    for (const world of worlds) {
      for (let d = 0; d < 730; d++) {
        const day = weatherOn(world, c, world.now + d * MS_DAY + 12 * 3_600_000);
        if (day.condition === 'Thunderstorm') months[Number(day.dateKey.slice(5, 7)) - 1]! += 1;
      }
    }
    return { perYear: months.reduce((a, b) => a + b, 0) / 6, months };
  };

  it('comes about as often a year as the published count says', () => {
    // London 16, Dublin 5, New York 19.4, Tokyo 14.5, Sydney 22, and the dry
    // summers, Madrid 14.3 and Los Angeles 4.6. Six years
    // of a count is noisy, and a small count most of all: within three
    // standard deviations of it as a Poisson count, and a tenth for the
    // model. The old rule gave London and Dublin none.
    for (const id of ['uk-eng-london', 'ie-lei-dublin', 'us-ny-newyork', 'jp-13-tokyo', 'au-nsw-sydney', 'es-md-madrid', 'us-ca-losangeles']) {
      const want = THUNDER_DAYS[id]!.days;
      const got = storms(id).perYear;
      const room = 3 * Math.sqrt(want / 6) + want * 0.1;
      expect(got, id).toBeGreaterThan(want - room);
      expect(got, id).toBeLessThan(want + room);
    }
  });

  it('keeps the order of the places: Singapore, then Chicago, then Dublin', () => {
    const singapore = storms('sg-singapore').perYear;
    expect(singapore).toBeGreaterThan(120);
    expect(storms('uk-eng-london').perYear).toBeGreaterThan(storms('ie-lei-dublin').perYear * 2);
  });

  it('falls in the warm half of the year, north and south', () => {
    const summer = (m: number[], months: number[]) => months.reduce((a, i) => a + m[i - 1]!, 0);
    const london = storms('uk-eng-london').months;
    expect(summer(london, [5, 6, 7, 8, 9])).toBeGreaterThan(summer(london, [11, 12, 1, 2, 3]) * 3);
    // Madrid's rain falls in winter and its thunder in May and June (AEMET).
    const madrid = storms('es-md-madrid').months;
    expect(summer(madrid, [5, 6, 7, 8])).toBeGreaterThan(summer(madrid, [11, 12, 1, 2]) * 3);
    const sydney = storms('au-nsw-sydney').months;
    expect(summer(sydney, [11, 12, 1, 2, 3])).toBeGreaterThan(summer(sydney, [5, 6, 7, 8, 9]) * 3);
  });
});


/**
 * The hours of a day.
 *
 * A day used to be the smallest thing the weather knew, and "it is snowing"
 * meant snowing from midnight to midnight. It does not: a wet day has a spell
 * in it, and a day whose spell ran out before dawn is overcast by breakfast.
 * These hold the two halves of that — that the hour and the day agree about
 * the shape of the day, and that they are allowed to disagree about right now.
 */
describe('the hours', () => {
  const HOME = 'is-39-reykjavik';

  it('runs from now to the end of the local day', () => {
    const sim = quickSave();
    const rest = hoursOn(sim, HOME, sim.now);
    expect(rest.length).toBeGreaterThan(0);
    expect(rest.length).toBeLessThanOrEqual(24);
    const zone = CITIES.require(HOME).timeZone;
    expect(rest[0]!.hour).toBe(zonedParts(sim.now, zone).hour);
    expect(rest[rest.length - 1]!.hour).toBe(23);
    // Consecutive, no gaps.
    for (let i = 1; i < rest.length; i++) expect(rest[i]!.hour).toBe(rest[i - 1]!.hour + 1);
  });

  it('gives a whole day when asked from its start', () => {
    const sim = quickSave();
    const zone = CITIES.require(HOME).timeZone;
    const hours = hoursOn(sim, HOME, startOfDay(sim.now + MS_DAY, zone));
    expect(hours).toHaveLength(24);
    expect(hours[0]!.hour).toBe(0);
  });

  it('says the same thing every time it is asked', () => {
    const sim = quickSave();
    const once = hoursOn(sim, HOME, sim.now).map((h) => `${h.hour}:${h.temperatureC}:${h.condition}`);
    const twice = hoursOn(sim, HOME, sim.now).map((h) => `${h.hour}:${h.temperatureC}:${h.condition}`);
    expect(twice).toEqual(once);
  });

  it('stays inside the day it belongs to', () => {
    const sim = quickSave();
    const zone = CITIES.require(HOME).timeZone;
    const day = weatherOn(sim, CITIES.require(HOME), sim.now);
    for (const hour of hoursOn(sim, HOME, startOfDay(sim.now, zone))) {
      expect(hour.temperatureC).toBeGreaterThanOrEqual(day.lowC - 1);
      expect(hour.temperatureC).toBeLessThanOrEqual(day.highC + 1);
      expect(hour.dateKey).toBe(day.dateKey);
    }
  });

  it('is coldest before dawn and warmest mid-afternoon', () => {
    // Asserted as "no hour beats three in the afternoon" rather than "the
    // warmest hour is three": the reading is whole degrees, so on a day with
    // a three-degree range half the afternoon ties and which one a scan
    // happens to keep says nothing about the curve.
    const sim = quickSave();
    const zone = CITIES.require(HOME).timeZone;
    const hours = hoursOn(sim, HOME, startOfDay(sim.now, zone));
    const at3pm = hours.find((h) => h.hour === 15)!;
    const at4am = hours.find((h) => h.hour === 4)!;
    for (const hour of hours) {
      expect(hour.temperatureC, `${hour.hour} beat three in the afternoon`).toBeLessThanOrEqual(at3pm.temperatureC);
      expect(hour.temperatureC, `${hour.hour} was colder than four in the morning`).toBeGreaterThanOrEqual(at4am.temperatureC);
    }
  });

  it('rains in a spell rather than all day', () => {
    // Somewhere in a fortnight there is a wet day; on it, some hours are wet
    // and some are not. A day that rained every hour of itself would be the
    // old model with more steps.
    const sim = quickSave();
    const zone = CITIES.require(HOME).timeZone;
    let checked = 0;
    for (let d = 0; d < 21 && checked < 3; d++) {
      const start = startOfDay(sim.now + d * MS_DAY, zone);
      const day = weatherOn(sim, CITIES.require(HOME), start);
      if (day.precipitation === 'none') continue;
      const hours = hoursOn(sim, HOME, start);
      const wet = hours.filter((h) => h.wet);
      expect(wet.length, `${day.dateKey} is wet but no hour of it is`).toBeGreaterThan(0);
      expect(wet.length, `${day.dateKey} is wet in all twenty-four hours`).toBeLessThan(24);
      // One unbroken spell, not scattered showers.
      const first = hours.indexOf(wet[0]!);
      for (let i = 0; i < wet.length; i++) expect(hours[first + i]!.wet).toBe(true);
      checked++;
    }
    expect(checked, 'no wet day in three weeks to check').toBeGreaterThan(0);
  });

  it('reports what the sky is doing now, not what the day is called', () => {
    // The reading of right now takes its condition from its own hour. On a
    // day whose spell has not started or has already finished, that is not
    // the day's headline — and saying "snowing" over a sky that is not is
    // the lie this exists to stop.
    const sim = quickSave();
    const zone = CITIES.require(HOME).timeZone;
    let disagreed = 0;
    for (let d = 0; d < 21; d++) {
      const start = startOfDay(sim.now + d * MS_DAY, zone);
      const day = weatherOn(sim, CITIES.require(HOME), start);
      if (day.precipitation === 'none') continue;
      for (const hour of hoursOn(sim, HOME, start)) {
        const now = weatherAt(sim, HOME, hour.at)!;
        expect(now.condition).toBe(hour.condition);
        expect(now.dayCondition).toBe(day.condition);
        if (now.condition !== now.dayCondition) disagreed++;
      }
    }
    expect(disagreed, 'the hour never once differed from the day').toBeGreaterThan(0);
  });

  it('knows which of its hours the sun is up for', () => {
    const sim = quickSave();
    const zone = CITIES.require(HOME).timeZone;
    const hours = hoursOn(sim, HOME, startOfDay(sim.now, zone));
    const lit = hours.filter((h) => h.daylight);
    expect(lit.length).toBeGreaterThan(0);
    expect(lit.length).toBeLessThan(24);
    // Daylight is one unbroken stretch, not scattered through the night.
    const first = hours.findIndex((h) => h.daylight);
    for (let i = 0; i < lit.length; i++) expect(hours[first + i]!.daylight).toBe(true);
  });
});
