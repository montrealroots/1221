/**
 * SLATE — the sky, where you are, and the days coming after it.
 *
 * Home prints a temperature, a row of six days and a climate chip, and every
 * one of them is a dead end today. They are not dead things: the weather is a
 * pure function of the save’s seed, the city and the day (`systems/weather.ts`),
 * so Thursday in Reykjavík is the same Thursday before and after a reload, and
 * asking about it costs nothing until somebody looks.
 *
 * Two kinds live here. `weather` is the sky over one city at this hour — the
 * thing you are standing in. `forecastday` is one day of the week ahead, which
 * is a moment, and moments are a floor a chain is allowed to end on. The
 * climate band is not a third kind: it is another face of the same sky, so it
 * is a facet, and it hangs off the weather rather than pretending to be a level
 * of its own.
 *
 * That SLATE’s weather is a climate model and not a forecast service is said
 * once, at the foot of the weather itself, and nowhere else.
 */

import { normalFor, toFahrenheit, type ClimateType } from '@/engine/content/climate';
import { CITIES, type City } from '@/engine/content/geography';
import { MONTH_NAMES, MS_DAY, WEEKDAY_NAMES, zonedParts } from '@/engine/core/time';
import {
  forecastFor, shootDayWeather, weatherAt,
  type DayWeather, type WeatherCondition, type WeatherNow,
} from '@/engine/systems/weather';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, spokenList } from './words';

/** How many days the look shows: today, and the five after it. */
const WEEK = 6;

/** The condition as a person says it is doing right now. */
const DOING: Record<WeatherCondition, string> = {
  Clear: 'clear',
  'Partly Cloudy': 'partly cloudy',
  Overcast: 'overcast',
  Drizzle: 'drizzling',
  Rain: 'raining',
  Thunderstorm: 'storming',
  Snow: 'snowing',
  Fog: 'foggy',
  Windy: 'blowing',
};

/** The condition as a thing a day brings. */
const BRINGS: Record<WeatherCondition, string> = {
  Clear: 'clear skies',
  'Partly Cloudy': 'broken cloud',
  Overcast: 'an overcast day',
  Drizzle: 'drizzle',
  Rain: 'rain',
  Thunderstorm: 'a thunderstorm',
  Snow: 'snow',
  Fog: 'fog',
  Windy: 'a windy day',
};

/** What each band is like to live in, in the words a person would use. */
const BAND: Record<ClimateType, string> = {
  equatorial: 'hot and wet the year round, with no season worth the name',
  monsoon: 'a long dry stretch, and then months of rain that don’t let up',
  savanna: 'hot all year, cut into a wet half and a dry one',
  arid: 'dry, glaring and hard on anything left standing outside',
  semi_arid: 'dry most of the year, and the rain that comes arrives all at once',
  mediterranean: 'bright dry summers, and mild winters that take the rain',
  humid_subtropical: 'heavy, humid summers and a winter that barely turns up',
  oceanic: 'gray, mild and wet, without much of an extreme in either direction',
  continental: 'a real summer and a real winter, with little patience in between',
  subpolar_oceanic: 'cool and wet the year round, with the sea holding both ends of it in check',
  subarctic: 'long dark winters and a summer that never quite gets warm',
  polar: 'cold that runs straight through the calendar, and light that comes and goes',
  highland: 'thin air, warm days and cold nights, whatever the month says',
};

/** What the eyebrow calls a day, counting from today. */
const WHEN_KIND = [
  'Today', 'Tomorrow', 'Two Days Out', 'Three Days Out', 'Four Days Out',
  'Five Days Out', 'Six Days Out',
];

const unitOf = (day: DayWeather): string => (day.fahrenheit ? '°F' : '°C');

/** A gazetteer name as a person says it. A slashed name is spoken, never read out with the slash. */
const spokenName = (name: string): string => name.replace(/\s*\/\s*/g, ' and ');

/** Small numbers the way prose spells them. */
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n);

/** Wind in the unit the country reads it in. */
const windOf = (day: DayWeather): string =>
  (day.fahrenheit ? `${Math.round(day.windKph * 0.621)} mph` : `${day.windKph} km/h`);

/** The city you are standing in, or the one asked for by name. */
function cityFor(sim: Simulation, id: string): City | undefined {
  return CITIES.get(id || sim.player.currentLocationId);
}

/** The local weekday for a day this far ahead of now. */
function weekdayAt(sim: Simulation, city: City, offset: number): string {
  const parts = zonedParts(sim.now + offset * MS_DAY, city.timeZone);
  return WEEKDAY_NAMES[parts.weekday] ?? 'Today';
}

/** "September 12", from the day’s own key. Never the year — a name carries no run of four digits. */
function dateWords(dateKey: string): string {
  const [, month, day] = dateKey.split('-').map(Number);
  return `${MONTH_NAMES[(month ?? 1) - 1]} ${day ?? 1}`;
}

/** How far the day sits from what the date usually brings, in the degrees on show. */
function offNormal(day: DayWeather): number {
  return Math.round(day.fahrenheit ? day.anomalyC * 1.8 : day.anomalyC);
}

/** "three degrees warmer than the date usually is", or nothing worth saying. */
function againstNormal(day: DayWeather): string {
  const off = offNormal(day);
  if (Math.abs(off) < 2) return 'sitting about where the date usually does';
  return `${Math.abs(off)}° ${off > 0 ? 'warmer' : 'colder'} than the date usually is`;
}

/** The high the date usually brings here, in the degrees this country reads. */
function normalHigh(sim: Simulation, city: City, day: DayWeather): number {
  const parts = zonedParts(sim.now, city.timeZone);
  const normal = normalFor(city, parts.month, parts.day);
  return day.fahrenheit ? toFahrenheit(normal.high) : Math.round(normal.high);
}

/** What an exterior day costs here, from the same figure the production system uses. */
function outdoorSentence(sim: Simulation, city: City, instant: number): string {
  const { factor } = shootDayWeather(sim, city.id, instant, false);
  if (factor >= 1) return 'A day outdoors would go the way it was planned, and a stage wouldn’t notice either way.';
  return `An exterior day here gets through about ${Math.round(factor * 100)}% of what it set out to do. A stage doesn’t care what the sky is doing.`;
}

// ---------------------------------------------------------------------------
// The sky over one city, at this hour
// ---------------------------------------------------------------------------

interface Sky { city: City; now: WeatherNow; week: DayWeather[] }

defineLook<Sky>('weather', {
  gone: 'Nowhere on the map answers to that, so there’s no sky here to check.',
  resolve: (sim, id) => {
    const city = cityFor(sim, id);
    if (!city) return undefined;
    const now = weatherAt(sim, city.id);
    if (!now) return undefined;
    return { city, now, week: forecastFor(sim, city.id, WEEK) };
  },
  seeds: (sim) => [sim.player.currentLocationId],
  look: (sky, { sim }) => {
    const { city, now, week } = sky;
    const unit = unitOf(now);
    const ahead = week.slice(1);
    const wetNames = ahead
      .map((d, i) => (d.precipitation === 'none' ? '' : weekdayAt(sim, city, i + 1)))
      .filter((name) => name !== '');

    const ways: Way[] = ahead.map((day, i) => ({
      to: at('forecastday', `${city.id}/${day.dateKey}`),
      label: weekdayAt(sim, city, i + 1),
      detail: `${day.condition}, ${day.low}${unit} to ${day.high}${unit}`,
    }));

    return {
      name: `Weather In ${spokenName(city.name)}`,
      kind: 'Out The Window',
      parent: at('place', city.id),
      summary: city.id === sim.player.currentLocationId
        ? `It’s ${now.temperature}${unit} and ${DOING[now.condition]} where you are, `
          + `${now.high}${unit} over ${now.low}${unit} on the day.`
        : `You’re not in ${spokenName(city.name)}, where it’s ${now.temperature}${unit} and `
          + `${DOING[now.condition]}, ${now.high}${unit} over ${now.low}${unit} on the day.`,
      body: (
        <>
          <p className="small">
            The wind’s at {windOf(now)} and the air is {now.humidity}% humid. The day itself is{' '}
            {againstNormal(now)}.
          </p>
          <p className="small">
            {wetNames.length === 0
              ? `Nothing wet in the ${countWord(ahead.length)} days after today.`
              : wetNames.length === ahead.length
                ? `Every one of the ${countWord(ahead.length)} days after today is wet.`
                : `${spokenList(wetNames)} ${isAre(wetNames.length)} wet, and the rest of the week stays dry.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Right Now" value={`${now.temperature}${unit}`} note={now.condition} />
            <Stat label="High" value={`${now.high}${unit}`} note="The warmest it gets today" />
            <Stat label="Low" value={`${now.low}${unit}`} note="Overnight" />
            <Stat label="Wind" value={windOf(now)} note={now.condition === 'Windy' ? 'Enough to be the story' : 'Not the story today'} />
            <Stat label="Humidity" value={`${now.humidity}%`} note="Water the air is carrying" />
            <Stat
              label="Against Usual"
              value={`${offNormal(now) > 0 ? '+' : ''}${offNormal(now)}°`}
              note="Set beside the date’s normal"
            />
          </div>
        </>
      ),
      facets: [
        {
          id: 'band',
          label: 'What It’s Usually Like',
          body: (
            <>
              <p className="small">
                {spokenName(city.name)} is {now.climateName.toLowerCase()} country — {BAND[now.climate]}.
              </p>
              <p className="small">
                {dateWords(now.dateKey)} here normally runs to about {normalHigh(sim, city, now)}{unit} by day,
                and today is {againstNormal(now)}.
              </p>
            </>
          ),
        },
        {
          id: 'outside',
          label: 'Working Outside',
          body: <p className="small">{outdoorSentence(sim, city, sim.now)}</p>,
        },
      ],
      ways,
      provenance: `SLATE’s climate model for ${spokenName(city.name)} — the season, the latitude and the kind of place this is. It isn’t a forecast service, and it never was one.`,
    };
  },
});

// ---------------------------------------------------------------------------
// One day of the week ahead
// ---------------------------------------------------------------------------

interface Ahead { city: City; day: DayWeather; offset: number }

/** `cityId/dateKey`, so a day belongs to a place rather than to the calendar. */
function splitDayId(id: string): { cityId: string; dateKey: string } | undefined {
  const cut = id.lastIndexOf('/');
  if (cut <= 0) return undefined;
  return { cityId: id.slice(0, cut), dateKey: id.slice(cut + 1) };
}

defineLook<Ahead>('forecastday', {
  gone: 'That day has been and gone, and the week ahead has moved on without it.',
  resolve: (sim, id) => {
    const split = splitDayId(id);
    if (!split) return undefined;
    const city = CITIES.get(split.cityId);
    if (!city) return undefined;
    const week = forecastFor(sim, city.id, WEEK);
    const offset = week.findIndex((d) => d.dateKey === split.dateKey);
    const day = week[offset];
    if (!day) return undefined;
    return { city, day, offset };
  },
  seeds: (sim) => {
    const city = cityFor(sim, '');
    if (!city) return [];
    return forecastFor(sim, city.id, WEEK).map((d) => `${city.id}/${d.dateKey}`);
  },
  look: (ahead, { sim }) => {
    const { city, day, offset } = ahead;
    const unit = unitOf(day);
    const when = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : `on ${weekdayAt(sim, city, offset)}`;
    const instant = sim.now + offset * MS_DAY;

    const week = forecastFor(sim, city.id, WEEK);
    const ways: Way[] = [];
    if (offset > 0) {
      const before = week[offset - 1];
      if (before) {
        ways.push({
          to: at('forecastday', `${city.id}/${before.dateKey}`),
          label: weekdayAt(sim, city, offset - 1),
          detail: `The day before it: ${before.condition}, ${before.low}${unit} to ${before.high}${unit}`,
        });
      }
    }
    if (offset < WEEK - 1) {
      const after = week[offset + 1];
      if (after) {
        ways.push({
          to: at('forecastday', `${city.id}/${after.dateKey}`),
          label: weekdayAt(sim, city, offset + 1),
          detail: `What follows it: ${after.condition}, ${after.low}${unit} to ${after.high}${unit}`,
        });
      }
    }

    return {
      name: weekdayAt(sim, city, offset),
      kind: WHEN_KIND[offset] ?? 'The Week Ahead',
      parent: at('weather', city.id),
      summary: `You’re looking at ${BRINGS[day.condition]} in ${spokenName(city.name)} ${when}, `
        + `${day.low}${unit} to ${day.high}${unit}.`,
      body: (
        <>
          <p className="small">
            {dateWords(day.dateKey)}: the wind at {windOf(day)}, humidity {day.humidity}%, and the day{' '}
            {againstNormal(day)}.
          </p>
          <p className="small">{outdoorSentence(sim, city, instant)}</p>
          <div className="grid grid-3">
            <Stat label="High" value={`${day.high}${unit}`} note="Mid-afternoon" />
            <Stat label="Low" value={`${day.low}${unit}`} note="A little before dawn" />
            <Stat label="Wind" value={windOf(day)} note={day.condition} />
          </div>
        </>
      ),
      ways,
      provenance: 'Its own draw, blended with the two days before it, which is why a cold snap lasts and a wet spell lingers.',
    };
  },
});
