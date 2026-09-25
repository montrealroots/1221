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
import { MONTH_NAMES, MS_DAY, WEEKDAY_NAMES, instantFromZoned, noonOf, startOfDay, zonedParts } from '@/engine/core/time';
import {
  WEATHER_EMOJI, forecastFor, hoursOn, outdoorWeather, weatherAt, weatherShort,
  type DayWeather, type HourWeather, type WeatherCondition, type WeatherNow,
} from '@/engine/systems/weather';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, spokenList, toStart } from './words';

/** How many days the look shows: today, and the five after it. */
const WEEK = 6;

const A_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * How far either way the sky will answer at all.
 *
 * The model is a pure function of the date and can be asked about any day
 * ever, which is not the same as every day being a thing in the world. A year
 * each way covers anything the calendar can hold and keeps the graph finite.
 */
const HORIZON_DAYS = 400;

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

/** A word that has to open a sentence. */
const sentenceStart = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

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
  const parts = zonedParts(noonOf(sim.now, offset, city.timeZone), city.timeZone);
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

/**
 * What the day’s weather does to outdoor work: the one thing it decides, a
 * building site’s or a coach’s shift called off in a thunderstorm. This said
 * an exterior day "gets through about" a share of itself, "from the same
 * figure the production system uses", when there was no production system.
 */
function outdoorSentence(sim: Simulation, city: City, instant: number): string {
  return outdoorWeather(sim, city.id, instant).calledOff
    ? 'A thunderstorm: outdoor work is called off, and a building site’s or a coach’s shift doesn’t go ahead or get paid.'
    : 'Outdoor work goes ahead in this. Only a thunderstorm calls it off.';
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

    // Three ways, and only three. The five weekdays used to hang off the sky
    // directly, which put the whole week at one level and left no way at all
    // into the hours you are standing in. What a person asks is what happens
    // for the rest of today, what tomorrow is, and what the week looks like,
    // so those are the three things the sky opens onto — and each of them
    // opens further.
    const today = week[0];
    const tomorrow = week[1];
    const ways: Way[] = [];
    if (today) {
      const left = hoursOn(sim, city.id, sim.now).length;
      ways.push({
        to: at('hours', `${city.id}/${today.dateKey}`),
        label: 'The Rest Of Today',
        detail: left <= 1
          ? 'The last hour of it, and what it is doing'
          : `${countWord(left)} hours left, hour by hour to midnight`,
      });
    }
    if (tomorrow) {
      ways.push({
        to: at('forecastday', `${city.id}/${tomorrow.dateKey}`),
        label: 'Tomorrow',
        detail: `${tomorrow.condition}, ${tomorrow.low}${unit} to ${tomorrow.high}${unit}`,
      });
    }
    ways.push({
      to: at('skyweek', city.id),
      label: 'The Week Ahead',
      detail: `${toStart(countWord(week.length))} days of it, and every one of them opens`,
    });

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
              ? `Dry right through the ${countWord(ahead.length)} days after today.`
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
    const found = dayOfKey(sim, city, split.dateKey);
    return found ? { city, day: found.day, offset: found.offset } : undefined;
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
    const instant = noonOf(sim.now, offset, city.timeZone);

    const ways: Way[] = [{
      to: at('hours', `${city.id}/${day.dateKey}`),
      label: offset === 0 ? 'The Rest Of Today' : 'Hour By Hour',
      detail: offset === 0
        ? 'The hours you have left of it, one at a time'
        // From the day’s first hour, which is one where the clocks skip midnight.
        : `What it does through the day, ${clockSaid(zonedParts(startOfDay(instant, city.timeZone), city.timeZone).hour)} to ${clockSaid(23)}`,
    }];
    // Either side of it, but only inside the week. Any day resolves — a
    // commitment three weeks out opens into the sky over it — and offering
    // each of those a day before and a day after would make the graph an
    // endless line, walkable forever and worth walking nowhere. Near the
    // present, stepping through the days is what a person does; far from it,
    // you got here from the thing that happens on it.
    const nearby = Math.abs(offset) < WEEK;
    const neighbour = (step: -1 | 1) => forecastFor(sim, city.id, 1, noonOf(sim.now, offset + step, city.timeZone))[0];
    for (const step of nearby ? ([-1, 1] as const) : []) {
      const beside = neighbour(step);
      if (!beside) continue;
      ways.push({
        to: at('forecastday', `${city.id}/${beside.dateKey}`),
        label: weekdayAt(sim, city, offset + step),
        detail: step < 0
          ? `The day before it: ${beside.condition}, ${beside.low}${unit} to ${beside.high}${unit}`
          : `What follows it: ${beside.condition}, ${beside.low}${unit} to ${beside.high}${unit}`,
      });
    }

    return {
      name: weekdayAt(sim, city, offset),
      kind: WHEN_KIND[offset] ?? (offset < 0 ? 'A Sky That Has Been' : 'Further Out'),
      // A day sits inside the week, and the week inside the sky. The trail
      // reads Reykjavík · Weather · The Week Ahead · Thursday, which is the
      // way a person got there.
      parent: at('skyweek', city.id),
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

// ---------------------------------------------------------------------------
// The rest of today, and the hours of any day
// ---------------------------------------------------------------------------

/**
 * `cityId/dateKey`, the same shape a forecast day uses.
 *
 * Asked for today it gives the hours you have left; asked for any other day it
 * gives every hour its clock reads, once. That is not two kinds — it is the same thing, read
 * from where you are standing in it, which is exactly what "the rest of today"
 * means to a person.
 */
interface Hours { city: City; day: DayWeather; hours: HourWeather[]; today: boolean; offset: number }

/**
 * The stretch of the day an hour belongs to, in the words a person uses.
 *
 * Noon and midnight name themselves, so they get nothing: "at noon it’s five
 * degrees, in the afternoon" is the sentence a clock would write and not one
 * a person would.
 */
function stretchOf(hour: number): string {
  if (hour === 0 || hour === 12) return '';
  if (hour < 5) return 'the small hours';
  if (hour < 12) return 'the morning';
  if (hour < 17) return 'the afternoon';
  if (hour < 21) return 'the evening';
  return 'the night';
}

/** "3 PM", "Midnight", "Noon" — never "15:00". A name, so Title Case. */
export function clockWord(hour: number): string {
  if (hour === 0) return 'Midnight';
  if (hour === 12) return 'Noon';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${hour < 12 ? 'AM' : 'PM'}`;
}

/**
 * The same clock inside a sentence.
 *
 * "midnight" and "noon" are ordinary words and lowercase there, but AM and PM
 * are not — lowercasing the whole thing gave "at 9 am", which no style sheet
 * in the world writes.
 */
function clockSaid(hour: number): string {
  if (hour === 0 || hour === 12) return clockWord(hour).toLowerCase();
  return clockWord(hour);
}

/**
 * The warmest and coldest hour, tie broken where the curve actually turns.
 *
 * The reading is whole degrees, so on a day with a three-degree range one in
 * the afternoon through five all say the same thing. Keeping whichever a scan
 * met first named one o’clock as the warmest hour of a day that peaks at
 * three, which is true of the printed number and false about the day.
 */
function extremesOf(hours: readonly HourWeather[]): { warmest: HourWeather; coldest: HourWeather } {
  const nearest = (pick: HourWeather[], turn: number) =>
    pick.reduce((a, b) => (Math.abs(b.hour - turn) < Math.abs(a.hour - turn) ? b : a));
  const top = Math.max(...hours.map((h) => h.temperature));
  const bottom = Math.min(...hours.map((h) => h.temperature));
  return {
    warmest: nearest(hours.filter((h) => h.temperature === top), 15),
    coldest: nearest(hours.filter((h) => h.temperature === bottom), 4),
  };
}

/**
 * How many days a date key sits from today, in this city’s own reckoning.
 *
 * Worked out from the key rather than by searching the week, so the sky is
 * askable about any day the calendar can reach. It used to scan a six-day
 * forecast and return nothing beyond it, which meant a commitment three weeks
 * out could not open into the hour it happens in — the chain simply stopped,
 * with nothing saying why.
 */
function offsetOfDay(sim: Simulation, city: City, key: string): number | undefined {
  if (!A_DATE.test(key)) return undefined;
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const midnight = instantFromZoned({ year, month, day, hour: 12 }, city.timeZone);
  const today = startOfDay(sim.now, city.timeZone);
  const offset = Math.round((startOfDay(midnight, city.timeZone) - today) / MS_DAY);
  return Math.abs(offset) <= HORIZON_DAYS ? offset : undefined;
}

/** The weather on the day a key names, wherever it falls. */
function dayOfKey(sim: Simulation, city: City, key: string): { day: DayWeather; offset: number } | undefined {
  const offset = offsetOfDay(sim, city, key);
  if (offset === undefined) return undefined;
  const day = forecastFor(sim, city.id, 1, noonOf(sim.now, offset, city.timeZone))[0];
  return day && day.dateKey === key ? { day, offset } : undefined;
}

/** Where a day’s hours start from: now if it is today, the start of the day otherwise (one in the morning where the clocks skip midnight). */
function hoursFor(sim: Simulation, city: City, key: string): { hours: HourWeather[]; today: boolean; offset: number } {
  const offset = offsetOfDay(sim, city, key);
  if (offset === undefined) return { hours: [], today: false, offset: -1 };
  const today = offset === 0;
  const from = today ? sim.now : startOfDay(noonOf(sim.now, offset, city.timeZone), city.timeZone);
  return { hours: hoursOn(sim, city.id, from), today, offset };
}

/** When the wet stretch of a day runs, said as a person would say it. */
function spellSentence(hours: readonly HourWeather[]): string {
  const wet = hours.filter((h) => h.wet);
  if (wet.length === 0) return 'Every one of them stays dry.';
  const first = wet[0]!;
  const last = wet[wet.length - 1]!;
  if (wet.length === 1) return `It comes on for the one hour, around ${clockSaid(first.hour)}.`;
  return `It comes on around ${clockSaid(first.hour)} and holds until about `
    + `${clockSaid(Math.min(23, last.hour + 1))} — ${countWord(wet.length)} hours of it.`;
}

defineLook<Hours>('hours', {
  gone: 'That day is behind you, and the hours in it aren’t something anybody is forecasting now.',
  resolve: (sim, id) => {
    const split = splitDayId(id);
    if (!split) return undefined;
    const city = CITIES.get(split.cityId);
    if (!city) return undefined;
    const day = dayOfKey(sim, city, split.dateKey)?.day;
    if (!day) return undefined;
    const { hours, today, offset } = hoursFor(sim, city, split.dateKey);
    if (hours.length === 0) return undefined;
    return { city, day, hours, today, offset };
  },
  seeds: (sim) => {
    const city = cityFor(sim, '');
    if (!city) return [];
    return forecastFor(sim, city.id, WEEK).map((d) => `${city.id}/${d.dateKey}`);
  },
  look: (found, { sim }) => {
    const { city, day, hours, today, offset } = found;
    const unit = unitOf(day);
    const { warmest, coldest } = extremesOf(hours);
    const dark = hours.filter((h) => !h.daylight).length;

    return {
      name: today ? 'The Rest Of Today' : `${weekdayAt(sim, city, offset)}’s Hours`,
      kind: 'Hour By Hour',
      parent: at('forecastday', `${city.id}/${day.dateKey}`),
      summary: today
        ? `You have ${countWord(hours.length)} hours of ${dateWords(day.dateKey)} left, and they run between `
          + `${coldest.temperature}${unit} and ${warmest.temperature}${unit}.`
        : `${dateWords(day.dateKey)} runs from ${coldest.temperature}${unit} before dawn up to `
          + `${warmest.temperature}${unit} by ${clockSaid(warmest.hour)}.`,
      body: (
        <>
          <p className="small">
            The warmest of them is {clockSaid(warmest.hour)} at {warmest.temperature}{unit}, the
            coldest {clockSaid(coldest.hour)} at {coldest.temperature}{unit}, and{' '}
            {dark === 0 ? 'the sun is up for all of them' : `${countWord(dark)} of them are after dark`}.
          </p>
          <p className="small">{spellSentence(hours)}</p>
        </>
      ),
      waysAs: 'strip',
      ways: hours.map((hour) => ({
        to: at('skyhour', `${city.id}/${day.dateKey}/${hour.hour}`),
        label: clockWord(hour.hour),
        detail: `${hour.temperature}${unit}, ${hour.condition.toLowerCase()}${hour.daylight ? '' : ', after dark'}`,
        glance: {
          icon: WEATHER_EMOJI[hour.condition],
          lines: [`${hour.temperature}°`, hour.daylight ? 'Light' : 'Dark'],
        },
      })),
      provenance: 'One curve between the day’s high and its low, coldest before dawn and warmest at three, and a wet spell that falls where the day puts it rather than all day long.',
    };
  },
});

// ---------------------------------------------------------------------------
// One hour — the floor of the sky
// ---------------------------------------------------------------------------

interface OneHour { city: City; day: DayWeather; hour: HourWeather; hours: HourWeather[]; index: number }

defineLook<OneHour>('skyhour', {
  gone: 'That hour has gone by, and what it was doing is nobody’s business now.',
  resolve: (sim, id) => {
    const cut = id.lastIndexOf('/');
    if (cut <= 0) return undefined;
    const wanted = Number(id.slice(cut + 1));
    const split = splitDayId(id.slice(0, cut));
    if (!split || !Number.isInteger(wanted)) return undefined;
    const city = CITIES.get(split.cityId);
    if (!city) return undefined;
    const day = dayOfKey(sim, city, split.dateKey)?.day;
    if (!day) return undefined;
    const { hours } = hoursFor(sim, city, split.dateKey);
    const index = hours.findIndex((h) => h.hour === wanted);
    const hour = hours[index];
    if (!hour) return undefined;
    return { city, day, hour, hours, index };
  },
  seeds: (sim) => {
    const city = cityFor(sim, '');
    if (!city) return [];
    const day = forecastFor(sim, city.id, WEEK)[0];
    if (!day) return [];
    return hoursOn(sim, city.id, sim.now).slice(0, 4).map((h) => `${city.id}/${day.dateKey}/${h.hour}`);
  },
  look: (found, { sim }) => {
    const { city, day, hour, hours, index } = found;
    const unit = unitOf(day);
    const before = hours[index - 1];
    const after = hours[index + 1];
    const swing = after ? after.temperature - hour.temperature : 0;

    const ways: Way[] = [];
    if (before) {
      ways.push({
        to: at('skyhour', `${city.id}/${day.dateKey}/${before.hour}`),
        label: clockWord(before.hour),
        detail: `The hour before it: ${before.temperature}${unit}, ${before.condition.toLowerCase()}`,
      });
    }
    if (after) {
      ways.push({
        to: at('skyhour', `${city.id}/${day.dateKey}/${after.hour}`),
        label: clockWord(after.hour),
        detail: `The hour after it: ${after.temperature}${unit}, ${after.condition.toLowerCase()}`,
      });
    }

    return {
      name: clockWord(hour.hour),
      kind: 'One Hour',
      parent: at('hours', `${city.id}/${day.dateKey}`),
      summary: `At ${clockSaid(hour.hour)} it’s ${hour.temperature}${unit} and ${DOING[hour.condition]} `
        + `in ${spokenName(city.name)}${stretchOf(hour.hour) ? `, in ${stretchOf(hour.hour)}` : ''}.`,
      body: (
        <>
          <p className="small">
            {hour.daylight ? 'The sun is up for it' : 'It’s dark'}, the wind is at {windOf(day)}, and{' '}
            {hour.wet
              ? `${BRINGS[hour.condition]} is falling through it.`
              : 'nothing is falling.'}
            {' '}
            {swing === 0 ? 'The hour after it is no different.'
              : swing > 0 ? `The next hour is ${countWord(Math.abs(swing))} degrees warmer.`
                : `The next hour is ${countWord(Math.abs(swing))} degrees colder.`}
          </p>
          <p className="small">{outdoorSentence(sim, city, hour.at)}</p>
        </>
      ),
      ways,
      provenance: `Read off ${dateWords(day.dateKey)}’s own curve. No hour is stored anywhere — ask twice and it says the same thing.`,
    };
  },
});

// ---------------------------------------------------------------------------
// The week ahead, held in one view
// ---------------------------------------------------------------------------

interface TheWeek { city: City; days: DayWeather[] }

defineLook<TheWeek>('skyweek', {
  gone: 'There’s nowhere by that name to have a week of weather.',
  resolve: (sim, id) => {
    const city = cityFor(sim, id);
    if (!city) return undefined;
    const days = forecastFor(sim, city.id, WEEK);
    return days.length > 0 ? { city, days } : undefined;
  },
  seeds: (sim) => [sim.player.currentLocationId],
  look: (found, { sim }) => {
    const { city, days } = found;
    const unit = unitOf(days[0] ?? ({ fahrenheit: false } as DayWeather));
    const highs = days.map((d) => d.high);
    const lows = days.map((d) => d.low);
    const warmest = days.reduce((a, b) => (b.high > a.high ? b : a));
    const wet = days.filter((d) => d.precipitation !== 'none');
    // Today and tomorrow have names of their own. Calling today "Monday" in a
    // sentence a person reads on Monday is what a table does, not a person.
    const dayName = (i: number) => (i === 0 ? 'today' : i === 1 ? 'tomorrow' : weekdayAt(sim, city, i));
    const wetNames = wet.map((d) => dayName(days.indexOf(d)));

    return {
      name: 'The Week Ahead',
      kind: 'Six Days Of Sky',
      parent: at('weather', city.id),
      summary: `${sentenceStart(countWord(days.length))} days in ${spokenName(city.name)}, from ${Math.min(...lows)}${unit} `
        + `to ${Math.max(...highs)}${unit}, and ${wet.length === 0 ? 'not one of them wet' : `${countWord(wet.length)} of them wet`}.`,
      body: (
        <>
          <p className="small">
            The warmest is {dayName(days.indexOf(warmest))} at {warmest.high}{unit}.{' '}
            {wetNames.length === 0
              ? 'Dry all week.'
              : wetNames.length === days.length
                ? `Every one of the ${countWord(days.length)} is wet.`
                : `${sentenceStart(spokenList(wetNames))} ${isAre(wetNames.length)} the wet ${wetNames.length === 1 ? 'one' : 'ones'}.`}
          </p>
          <p className="small">
            Each day is its own draw blended with the two before it, so the week has a shape rather than
            six unrelated days: a cold snap lasts, and a wet spell lingers.
          </p>
        </>
      ),
      waysAs: 'strip',
      ways: days.map((day, i) => ({
        to: at('forecastday', `${city.id}/${day.dateKey}`),
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekdayAt(sim, city, i).slice(0, 3),
        detail: `${day.condition}, ${day.low}${unit} to ${day.high}${unit}`,
        glance: {
          icon: WEATHER_EMOJI[day.condition],
          lines: [weatherShort(day.condition), `${day.high}° / ${day.low}°`],
        },
      })),
      provenance: 'SLATE’s climate model, six days of it. It isn’t a forecast service, and it never was one.',
    };
  },
});
