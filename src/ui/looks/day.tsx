/**
 * SLATE — the day you are standing in, and everything the clock puts on it.
 *
 * Home’s head prints a weekday, a date, a clock time, a zone and a season, and
 * every one of them is a dead end today. So is the Calendar’s next commitment,
 * and so are the five rows under it. They are not thin things: `calendar.ts`
 * already buckets the timeline into days, flags the collisions, and hangs the
 * observances of whatever country the player is standing in off each one, and
 * `time.ts` and `sun.ts` know what the light is doing on any date at all.
 *
 * Three kinds live here. `day` is one date — today by default, any date by
 * key — with its entries, its observances, its season and its light. `entry`
 * is one thing on the calendar, and it says everything `CalendarWorkspace`'s
 * read-only EntryDetail modal says — the same four facts, the same three
 * sentences — plus the two that modal never said: whether you are in the
 * right city for it, and what it is colliding with. `season` is the quarter
 * of the year the day sits in, a real thing in a place rather than a label:
 * at Reykjavík’s latitude a season is the difference between twenty-one hours
 * of light and four.
 *
 * A day hangs beneath the city it is a day in, because a day is kept in that
 * city’s clock, keeps that country’s holidays and takes its light from that
 * latitude. Walking from one day to the next stops at a week out in either
 * direction — the calendar runs forever and a chain that runs forever is not
 * a chain.
 */

import { normalFor, toFahrenheit, usesFahrenheit } from '@/engine/content/climate';
import { CITIES, COUNTRIES, REGIONS, type City } from '@/engine/content/geography';
import { holidayLabel, holidaysAcross, type KeptHoliday } from '@/engine/content/holidays';
import { formatDaylight, sunTimes, type SunTimes } from '@/engine/core/sun';
import { plural, titleCaseLabel } from '@/engine/core/text';
import {
  MONTH_NAMES, MS_DAY, MS_HOUR, MS_MINUTE, WEEKDAY_NAMES,
  addDays, dateKey, daysBetween, formatDate, formatDuration, formatTime,
  instantFromZoned, parseDateKey, seasonOf, startOfDay, startOfNextDay, zoneAbbreviation, zonedParts,
  type Instant, type Season, type TimeZone, type ZonedParts,
} from '@/engine/core/time';
import { forecastFor } from '@/engine/systems/weather';
import { LEGEND_BY_CATEGORY, entriesBetween, keptCalendars, upcoming, type CalendarEntry } from '@/engine/world/calendar';
import { PLAN_KIND } from '@/engine/world/plans';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { Open } from './Look';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, spokenList } from './words';

/** How far either side of today one day will walk to another. */
const REACH = 6;

/** How many days ahead the sky is worked out, matching the weather’s own week. */
const FORECAST = 6;

const SEASONS: readonly Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

const A_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Numbers under ten are words in prose, and figures only in the facts. */
const SMALL = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** A number the way it is said in a sentence: "three", "eleven". */
const spokenNumber = (n: number): string => `${SMALL[n] ?? n}`;

/** "two things", "eleven things", agreeing with itself the way `plural` does. */
function count(n: number, one: string, many = `${one}s`): string {
  return `${spokenNumber(n)} ${n === 1 ? one : many}`;
}

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

/** The city the player is standing in. Every day is somewhere. */
function standingIn(sim: Simulation): City | undefined {
  const player = sim.universe.people[sim.universe.playerId];
  return player ? CITIES.get(player.currentLocationId) : undefined;
}

/**
 * Whether a city opens onto anything.
 *
 * The place look needs a region to resolve its taxes through, and a handful
 * of territories in the gazetteer carry none. A way in is never painted
 * unless it would open.
 */
const placeOpens = (city: City | undefined): boolean => !!city && !!REGIONS.get(city.parentId);

/**
 * A label made safe to be a name: no underscore, no slash, Title Case.
 *
 * The trailing full stop is taken off first, because `titleCaseLabel` reads
 * anything ending in one as prose and hands it back untouched — which is how
 * a lower-case sentence would arrive where a name belongs. Whatever survives
 * that, the first letter is raised, so a name always starts as a name does.
 */
function asName(title: string): string {
  const clean = title.replace(/\s*\/\s*/g, ' and ').replace(/_+/g, ' ')
    .replace(/[.?!]+$/, '').replace(/\s+/g, ' ').trim();
  const cased = titleCaseLabel(clean).trim();
  return cased ? cased[0]!.toUpperCase() + cased.slice(1) : cased;
}

/**
 * An entry’s own state, in the word the game shows for it.
 *
 * A label map, because the schedule’s ids are not renamed to improve a label
 * and two of them read badly on a screen: `done` is not what a person calls a
 * thing they turned up to, and `cancelled` is spelled the other way here.
 */
const STATUS_WORD: Readonly<Record<string, string>> = {
  pending: 'Pending',
  done: 'Completed',
  cancelled: 'Canceled',
  missed: 'Missed',
  observance: 'Observance',
};

const statusWord = (entry: CalendarEntry): string =>
  STATUS_WORD[entry.status] ?? titleCaseLabel(entry.status);

/** "Monday, March 2". The date a person says, and never the year. */
const dayName = (parts: ZonedParts): string =>
  `${WEEKDAY_NAMES[parts.weekday]}, ${MONTH_NAMES[parts.month - 1]} ${parts.day}`;

/** What the eyebrow calls a date, counted from today. */
function dayKindOf(offset: number): string {
  if (offset === 0) return 'The Day';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  return offset > 0 ? 'A Day Coming' : 'A Day Gone';
}

/**
 * When something is, the way a person says it.
 *
 * `formatRelative` is the engine’s own answer and it is not prose: it prints
 * "in 2d 3h" and "in 1.5 years", which is a readout, not a sentence. A look
 * leads with a sentence, so this counts in whole days off the local calendar
 * and spells the small numbers out.
 */
function spokenWhen(target: Instant, sim: Simulation, zone: TimeZone): string {
  const offset = daysBetween(sim.now, target, zone);
  if (offset === 0) {
    const hours = Math.round((target - sim.now) / MS_HOUR);
    if (hours === 0) return 'within the hour';
    return hours > 0 ? `in ${count(hours, 'hour')}` : `${count(-hours, 'hour')} ago`;
  }
  if (offset === 1) return 'tomorrow';
  if (offset === -1) return 'yesterday';
  const away = Math.abs(offset);
  if (away < 14) return offset > 0 ? `in ${count(away, 'day')}` : `${count(away, 'day')} ago`;
  if (away < 60) {
    const weeks = Math.round(away / 7);
    return offset > 0 ? `in ${count(weeks, 'week')}` : `${count(weeks, 'week')} ago`;
  }
  const months = Math.round(away / 30.44);
  return offset > 0 ? `in ${count(months, 'month')}` : `${count(months, 'month')} ago`;
}

/** How long a commitment runs, or nothing when it is a point in the day. */
const lengthOf = (entry: CalendarEntry): string | undefined =>
  (entry.durationMinutes ? formatDuration(entry.durationMinutes * MS_MINUTE) : undefined);

/**
 * What missing a commitment costs, as its handler has it (`systems/school.ts`).
 * Until 2026-09-27 the entry look said only that it cost "what the Guide
 * says". It also had the career’s costs (`systems/career.ts`): an audition an
 * agency got you, a job’s day and a showcase. Those kinds went with the career
 * on 2026-10-09 and their cases stayed here, so a save from before it, which
 * keeps what it had settled, was still told an agency would let it go; the
 * cases went from 2026-10-12.
 */
function missCost(sim: Simulation, id: string): string {
  const item = sim.universe.scheduled.find((one) => one.id === id);
  const call = item?.payload.call;
  switch (item?.kind) {
    case 'school.classes': return ': an unexcused absence, which the faculty weigh at the term’s evaluation, unless you’re sick or in hospital';
    case 'school.call':
      return call === 'performance' ? ': a grave breach, straight to academic warning, or from warning to dismissal'
        : call === 'oncall' ? ', and if you’re sent on and not there, it’s a grave breach, straight to academic warning'
          : ': counted against your attendance, and enough missed calls take you out of the casting pool';
    case 'school.lab': return ': counted against your attendance and your calls';
    case 'school.shift': return ': the hours aren’t paid, and an assigned shift counts against your attendance';
    case 'school.summer': return call === 'performance' ? ', and the company lets you go' : ', and the rehearsal goes on without you';
    case 'school.cabaret': return ', and the show goes on without you';
    default: return '';
  }
}

/** The window an entry occupies, for working out what it collides with. */
const endOf = (entry: CalendarEntry): Instant => entry.endsAt ?? entry.at;

/** The city an entry wants you in, where it names one. */
const cityOf = (entry: CalendarEntry): City | undefined =>
  (entry.locationId ? CITIES.get(entry.locationId) : undefined);

/**
 * The clock a time is read off for one entry.
 *
 * The calendar is cut into days by the zone the player keeps house in, but a
 * call time is local: an entry that names a city is at ten-thirty in that
 * city, and printing the home clock beside that city’s name would be wrong by
 * however many hours lie between them.
 */
const clockOf = (entry: CalendarEntry, fallback: TimeZone): TimeZone =>
  cityOf(entry)?.timeZone ?? fallback;

/** What a way into an entry says before it is taken. */
function entryDetail(entry: CalendarEntry, zone: TimeZone): string {
  const parts = [formatTime(entry.at, clockOf(entry, zone))];
  const length = lengthOf(entry);
  if (length) parts.push(length);
  const city = cityOf(entry);
  if (city) parts.push(city.name);
  const line = parts.join(' · ');
  if (entry.conflicted) return `${line} — and something else wants you in the same hour`;
  if (entry.status === 'observance') return `${line} — an observance, not a commitment`;
  return entry.requiresPlayer ? `${line} — and it wants you there` : `${line} — the world handles it`;
}

// ---------------------------------------------------------------------------
// One day
// ---------------------------------------------------------------------------

interface TheDay {
  key: string;
  start: Instant;
  parts: ZonedParts;
  zone: TimeZone;
  city: City;
  offset: number;
  entries: CalendarEntry[];
  holidays: KeptHoliday[];
  sun: SunTimes;
  season: Season;
}

/** The day a date key names, read out of the live world. */
function dayAt(sim: Simulation, key: string): TheDay | undefined {
  const zone = sim.homeZone;
  const city = standingIn(sim);
  if (!city || !A_DATE.test(key)) return undefined;

  const start = startOfDay(parseDateKey(key, zone), zone);
  if (!Number.isFinite(start) || dateKey(start, zone) !== key) return undefined;

  // The day ends where the next date begins. It was a day added to its start,
  // which on a day whose clocks skipped midnight was one the next morning, so
  // the day of the jump listed the next day’s first hour as its own too.
  const end = startOfNextDay(start, zone);
  // A day either side, so a collision that starts before midnight is seen.
  const around = entriesBetween(sim, start - MS_DAY, end + MS_DAY);

  return {
    key,
    start,
    parts: zonedParts(start, zone),
    zone,
    city,
    offset: daysBetween(sim.now, start, zone),
    entries: around.filter((e) => e.at >= start && e.at < end),
    holidays: holidaysAcross(start, zone, keptCalendars(sim)),
    sun: sunTimes(start + MS_DAY / 2, city.latitude, city.longitude, city.timeZone),
    season: seasonOf(start, zone, city.latitude),
  };
}

defineLook<TheDay>('day', {
  gone: 'There’s no such date. The calendar runs on real days, and that isn’t one of them.',
  resolve: (sim, id) => dayAt(sim, id || dateKey(sim.now, sim.homeZone)),
  seeds: (sim) => {
    const zone = sim.homeZone;
    return [
      dateKey(sim.now, zone),
      dateKey(addDays(sim.now, 1, zone), zone),
      dateKey(addDays(sim.now, -1, zone), zone),
    ];
  },
  look: (day, { sim }) => {
    const { city, entries, holidays, offset, zone } = day;
    const wants = entries.filter((e) => e.requiresPlayer && e.status === 'pending');
    const clashes = entries.filter((e) => e.conflicted);
    const country = COUNTRIES.get(city.countryId)?.name ?? city.countryId.toUpperCase();
    const observed = holidays.map((h) => h.englishName || h.name);
    // Whose day it is: the calendar keeps the year of where the player is
    // standing, and a day says so in that country’s name.
    const named = (h: KeptHoliday) => h.englishName || h.name;
    const keptHere = holidays.filter((h) => h.countryId === city.countryId).map(named);
    // `holidaysAcross` has already dropped the ones kept in another region, so
    // anything still carrying a subdivision code is kept here and not nationally.
    const regional = holidays.filter((h) => h.regionCode).length;
    // A life keeps more than one country’s year. Grouped by whose it is,
    // because "Iceland and the United States both keep it" and "one is theirs
    // and one is yours" are different facts about the same day.
    const byCountry = [...new Map(holidays.map((h) => [h.countryId, h.countryName])).entries()]
      .map(([id, name]) => ({ name, kept: holidays.filter((h) => h.countryId === id) }));

    const ways: Way[] = entries.slice(0, 8).map((entry) => ({
      to: at('entry', entry.id),
      label: asName(entry.title),
      detail: entryDetail(entry, zone),
    }));

    ways.push({
      to: at('season', `${city.id}/${day.season}`),
      label: day.season,
      detail: `What ${day.season} is in ${city.name}, and how much of the year it takes`,
    });
    ways.push({
      to: at('daylight', city.id),
      label: 'Daylight',
      detail: lightDetail(day),
    });

    // The sky, but only as far ahead as the weather is worked out.
    if (offset >= 0 && offset < FORECAST) {
      const ahead = forecastFor(sim, city.id, FORECAST)[offset];
      if (ahead) {
        const unit = ahead.fahrenheit ? '°F' : '°C';
        ways.push({
          to: at('forecastday', `${city.id}/${ahead.dateKey}`),
          label: 'The Sky',
          detail: `${ahead.condition}, ${ahead.low}${unit} to ${ahead.high}${unit}`,
        });
      }
    }

    for (const step of [-1, 1]) {
      const near = offset + step;
      if (Math.abs(near) > REACH) continue;
      const other = dayAt(sim, dateKey(addDays(day.start, step, zone), zone));
      if (!other) continue;
      ways.push({
        to: at('day', other.key),
        label: dayName(other.parts),
        detail: step < 0
          ? `One day back, and ${loadOf(other, 'before')}`
          : `One day on, and ${loadOf(other, 'after')}`,
      });
    }

    return {
      name: dayName(day.parts),
      kind: dayKindOf(offset),
      // A day falls on a city whether or not the tax tables can reach it, so
      // the parent is declared only where it would open.
      parent: placeOpens(city) ? at('place', city.id) : undefined,
      summary: daySentence(day, sim, keptHere),
      body: (
        <>
          <p className="small muted">
            {lightSentence(day)}{' '}
            {offset === 0
              ? `${quarterSentence(day)}.`
              : `${day.season} in ${city.name} on it, and ${quarterSentence(day)}.`}
          </p>
          <p className="small muted">
            {entries.length === 0
              ? offset === 0
                ? 'Not a thing booked on it, either.'
                : 'Not a thing booked on it yet.'
              : `The day is carrying ${count(entries.length, 'thing')}: ${spokenList(entries.map((e) => asName(e.title)))}.`}
            {wants.length > 0 && ` You have to be at ${count(wants.length, 'of them', 'of them')}.`}
            {clashes.length > 0 && ` The calendar has flagged ${count(clashes.length, 'of them', 'of them')} as landing on top of each other.`}
            {keptHere.length > 0 && ` ${spokenList(keptHere)} ${isAre(keptHere.length)} kept in ${country} that day.`}
          </p>
          {sim.zone !== zone && (
            <p className="small muted">
              You’re keeping {zoneAbbreviation(sim.now, sim.zone)} out there, and the calendar is still
              cut into days by {zoneAbbreviation(sim.now, zone)}, where you live.
            </p>
          )}
          <div className="grid grid-3">
            <Stat
              label="Sunrise"
              value={day.sun.polar ? 'None' : formatTime(day.sun.sunrise ?? 0, city.timeZone)}
              note={day.sun.polar === 'day' ? 'It never gets dark' : day.sun.polar === 'night' ? 'It stays under the horizon' : 'Local clock'}
            />
            <Stat
              label="Sunset"
              value={day.sun.polar ? 'None' : formatTime(day.sun.sunset ?? 0, city.timeZone)}
              note={day.sun.polar ? 'It never clears the horizon' : 'Local clock'}
            />
            <Stat
              label="Daylight"
              value={day.sun.polar === 'day' ? 'All Of It' : day.sun.polar === 'night' ? 'None Of It' : formatDaylight(day.sun.daylightMinutes)}
              note={`${day.season} here`}
              look={at('daylight', city.id)}
            />
            <Stat
              label="On The Calendar"
              value={entries.length}
              note={entries.length > 0
                ? 'Things the day is carrying'
                : holidays.length > 0 ? 'No plans, and a holiday' : 'No plans'}
            />
            <Stat
              label="Wants You"
              value={wants.length}
              note={wants.length === 0 ? 'None of it needs you' : 'You have to be at these'}
              tone={clashes.length > 0 ? 'negative' : undefined}
            />
            <Stat label="Where" value={city.name} note={zoneAbbreviation(day.start, city.timeZone)} look={placeOpens(city) ? at('place', city.id) : undefined} />
          </div>
        </>
      ),
      facets: observed.length > 0
        ? [{
          id: 'observed',
          label: 'What’s Kept That Day',
          body: (
            <>
              {byCountry.map(({ name, kept }) => (
                <p key={name} className="small">
                  {`${name} keeps ${spokenList(kept.map(holidayLabel))} on it.`}
                </p>
              ))}
              <p className="small muted">
                {holidays.some((h) => h.type === 'public')
                  ? 'Public ones close offices and banks in the places that keep them.'
                  : holidays.some((h) => h.type === 'bank' || h.type === 'school')
                    ? 'None of them is a public holiday, though the banks or the schools shut for one.'
                    : 'None of them is a day off — they’re marked, not taken.'}
                {regional > 0
                  ? ` ${count(regional, 'of them', 'of them')} ${isAre(regional)} kept here and not in the rest of ${country}.`
                  : ''}
              </p>
            </>
          ),
        }]
        : undefined,
      ways,
      provenance: 'The light is worked out from the tilt, the date and this latitude — not looked up. The observances are the ones kept where you’re standing.',
    };
  },
});

/**
 * What a day is carrying, in the half-line a way in gets. An empty day either
 * side of this one is the common case, and the two lines sit one above the
 * other, so an empty day says it in the tense it belongs to.
 */
function loadOf(day: TheDay, when: 'before' | 'after' | 'around' = 'around'): string {
  const empty = when === 'before'
    ? 'nothing was booked on it'
    : when === 'after' ? 'nothing on it yet' : 'nothing booked on it at all';
  if (day.holidays.length > 0 && day.entries.length === 0) {
    return `${empty}, and ${day.holidays[0]?.englishName ?? day.holidays[0]?.name} kept on it`;
  }
  const first = day.entries[0];
  return first
    ? `${count(day.entries.length, 'thing')} on it, starting with ${asName(first.title)}`
    : empty;
}

/** The one sentence a day leads with. */
function daySentence(day: TheDay, sim: Simulation, keptHere: string[]): string {
  const { city, entries, offset } = day;
  const past = offset < 0;
  // What is booked outranks what is kept: a commitment is the thing you act on.
  const tail = entries.length > 0
    ? `with ${count(entries.length, 'thing')} on the calendar`
    : keptHere.length > 0
      ? `and it’s ${spokenList(keptHere)} here`
      : offset === 0
        ? 'and the day is entirely yours'
        : past ? 'and nothing was on it' : 'and nothing is on it yet';

  // The clock is the city’s; the date is the calendar’s, which is cut by the
  // zone the player keeps house in. Where those two disagree the sentence says
  // so, because "7:30 AM in Los Angeles" was eight hours wrong the moment
  // anybody traveled.
  if (offset === 0) {
    const local = formatTime(sim.now, city.timeZone);
    return city.timeZone === day.zone
      ? `It’s ${local} in ${city.name} on ${dayName(day.parts)}, ${tail}.`
      : `It’s ${local} in ${city.name}, and ${dayName(day.parts)} back home, ${tail}.`;
  }
  if (offset === 1) return `Tomorrow’s ${dayName(day.parts)}, ${tail}.`;
  if (offset === -1) return `Yesterday was ${dayName(day.parts)}, ${tail}.`;

  const away = Math.abs(offset);
  return past
    ? `You’re looking back at ${dayName(day.parts)}, ${count(away, 'day')} ago, ${tail}.`
    : `You’re looking at ${dayName(day.parts)}, ${count(away, 'day')} out, ${tail}.`;
}

/** What the light does on a day, said the way a person standing in it would. */
function lightSentence(day: TheDay): string {
  const { sun, city } = day;
  if (sun.polar === 'day') return 'The sun doesn’t go down on it at all — twenty-four hours of light, and the only difference between two in the afternoon and two in the morning is the color of it.';
  if (sun.polar === 'night') return 'The sun doesn’t clear the horizon on it — a few hours of blue in the middle, and that’s the whole of the day.';
  return `Light from ${formatTime(sun.sunrise ?? 0, city.timeZone)} to ${formatTime(sun.sunset ?? 0, city.timeZone)}, ${formatDaylight(sun.daylightMinutes)} of it.`;
}

/** The same, compressed into the line a way into the light carries. */
function lightDetail(day: TheDay): string {
  if (day.sun.polar === 'day') return 'The sun never sets on it here';
  if (day.sun.polar === 'night') return 'No sunrise on it here at all';
  return `${formatTime(day.sun.sunrise ?? 0, day.city.timeZone)} to ${formatTime(day.sun.sunset ?? 0, day.city.timeZone)}, ${formatDaylight(day.sun.daylightMinutes)} of it`;
}

/** Where the day sits inside its season, without ever printing a fraction. */
function quarterSentence(day: TheDay): string {
  const months = monthsOfSeason(day.city, day.season, day.parts.year);
  const place = months.indexOf(day.parts.month);
  if (place === 0) return `${day.season} here has only just started`;
  if (place === months.length - 1) return `${day.season} here is nearly over`;
  return `${day.season} here is at its middle`;
}

// ---------------------------------------------------------------------------
// One thing on the calendar
// ---------------------------------------------------------------------------

interface TheEntry {
  entry: CalendarEntry;
  day: TheDay | undefined;
  /** Commitments that want the player inside the same window. */
  clashes: CalendarEntry[];
  /** The next thing after it on the same day. */
  next: CalendarEntry | undefined;
  /** Where the player is standing, when that is not where this is. */
  elsewhere: City | undefined;
}

defineLook<TheEntry>('entry', {
  gone: 'That’s off the calendar now. Whatever it was, it isn’t waiting on you.',
  resolve: (sim, id) => {
    const item = sim.timeline.get(id);
    if (!item) return undefined;

    const zone = sim.homeZone;
    const start = startOfDay(item.at, zone);
    const dayEnd = startOfNextDay(start, zone);
    const around = entriesBetween(sim, start - MS_DAY, dayEnd + MS_DAY);
    const entry = around.find((e) => e.id === id);
    if (!entry) return undefined;

    const end = endOf(entry);
    const clashes = entry.requiresPlayer && entry.status === 'pending'
      ? around.filter((other) => other.id !== entry.id
        && other.requiresPlayer && other.status === 'pending'
        && other.at < end && endOf(other) > entry.at)
      : [];

    // Where the next date begins, as for the Day look: a day added to the
    // start of the day of a jump reached into the next day’s first hour, and
    // "next thing that day" offered something from the day after.
    const next = around.find((other) => other.id !== entry.id
      && other.at >= entry.at && other.at < dayEnd
      && !clashes.some((c) => c.id === other.id));

    const here = standingIn(sim);
    const wanted = cityOf(entry);
    const elsewhere = wanted && here && wanted.id !== here.id ? here : undefined;

    return { entry, day: dayAt(sim, dateKey(entry.at, zone)), clashes, next, elsewhere };
  },
  seeds: (sim) => upcoming(sim, 8).map((entry) => entry.id),
  look: (found, { sim }) => {
    const { entry, clashes, next, elsewhere } = found;
    const zone = sim.homeZone;
    const legend = LEGEND_BY_CATEGORY[entry.category];
    const city = cityOf(entry);
    const clock = clockOf(entry, zone);
    const length = lengthOf(entry);
    const parts = zonedParts(entry.at, zone);

    const ways: Way[] = clashes.map((other) => ({
      to: at('entry', other.id),
      label: asName(other.title),
      detail: `What it collides with: ${formatTime(other.at, clockOf(other, zone))}, and that one wants you too`,
    }));

    // The hours it actually takes, and the sky over them. A commitment is a
    // window, not an instant, and the window is a thing you can look at.
    if (length) {
      ways.push({
        to: at('stretch', entry.id),
        label: `${formatTime(entry.at, clock)} To ${formatTime(endOf(entry), clock)}`,
        detail: 'How many hours it takes, and what the sky is doing across them',
      });
    }
    // Everything else you decided to do, where this is one of them.
    if (sim.timeline.get(entry.id)?.kind === PLAN_KIND) {
      ways.push({
        to: at('plans'),
        label: 'Your Own Plans',
        detail: 'Everything else you have put on the calendar yourself',
      });
    }

    if (city && placeOpens(city)) {
      ways.push({
        to: at('place', city.id),
        label: city.name,
        detail: elsewhere
          ? `Where this one is, and you’re in ${elsewhere.name} instead`
          : 'Where this one is — where you already are',
      });
    }
    if (next) {
      ways.push({
        to: at('entry', next.id),
        label: asName(next.title),
        detail: `Next thing that day: ${entryDetail(next, zone)}`,
      });
    }
    if (found.day) {
      ways.push({
        to: at('day', found.day.key),
        label: dayName(found.day.parts),
        detail: `Which day it sits in: ${loadOf(found.day)}`,
      });
    }

    return {
      name: asName(entry.title),
      kind: entry.status === 'observance'
        ? 'An Observance'
        : entry.requiresPlayer ? 'Something You Have To Be At' : 'Something The World Handles',
      // The day it sits in, and where that cannot be read, the city it names —
      // never `at('place', '')`, which resolves to wherever the player happens
      // to be standing and would hang the thing beneath a town it is not in.
      parent: found.day ? at('day', found.day.key)
        : city && placeOpens(city) ? at('place', city.id) : undefined,
      summary: entrySentence(found, sim),
      body: (
        <>
          <p className="small">
            {entry.status === 'observance'
              ? 'An observance. It’s on the calendar so you know; nothing about it is yours to change.'
              : entry.requiresPlayer
                ? `This one wants you there, awake${city ? ` and in ${city.name}` : ''}, when the clock reaches it; if you aren’t, it’s missed${missCost(sim, entry.id)}.`
                : 'This one the world handles on its own when the clock reaches it.'}
            {length && ` It runs ${length}, ${formatTime(entry.at, clock)} to ${formatTime(endOf(entry), clock)}.`}
          </p>
          {/* Until 2026-10-12 an entry somewhere else said "a job’s travel takes you there on its own, and anything
              else needs you to be there by then". There’s been no job since 2026-10-09, and nothing writes where the
              player is after a life begins (`world/bootstrap.ts`), so one that wants them and hasn’t come round says
              it’ll be missed, as its handler has it (from 2026-10-12). */}
          <p className="small muted">
            {city
              ? elsewhere
                ? <>It’s in <Open subject={at('place', city.id)}>{city.name}</Open> and you’re in {elsewhere.name}{entry.requiresPlayer && entry.status === 'pending' ? ', and nothing takes you there, so it’ll be missed' : ''}.</>
                : <>It’s in <Open subject={at('place', city.id)}>{city.name}</Open>, where you already are.</>
              : 'It names no city, so wherever you are is close enough.'}
            {clashes.length > 0
              ? ` ${spokenList(clashes.map((c) => asName(c.title)))} ${isAre(clashes.length)} inside the same hour, and both want you.`
              : entry.requiresPlayer && entry.status === 'pending'
                ? ' No other booking clashes with it.'
                : ''}
          </p>
          <div className="grid grid-2">
            <Stat
              label="When"
              value={formatTime(entry.at, clock)}
              note={clock === zone ? formatDate(entry.at, zone) : `${formatDate(entry.at, clock)}, ${zoneAbbreviation(entry.at, clock)}`}
            />
            <Stat label="Length" value={length ?? 'As Long As It Takes'} note={length ? `Ends ${formatTime(endOf(entry), clock)}` : 'No end time on it'} />
            <Stat
              label="Kind"
              value={legend?.label ?? titleCaseLabel(entry.category)}
              note={city?.name}
              look={city && placeOpens(city) ? at('place', city.id) : undefined}
            />
            <Stat
              label="Status"
              value={statusWord(entry)}
              tone={entry.status === 'missed' || entry.status === 'cancelled' ? 'negative'
                : entry.status === 'done' ? 'positive' : undefined}
              note={`${WEEKDAY_NAMES[parts.weekday]}, ${spokenWhen(entry.at, sim, zone)}`}
            />
            {entry.bookedAt !== undefined && (
              <Stat label="Booked" value={formatDate(entry.bookedAt, zone)} note={formatTime(entry.bookedAt, zone)} />
            )}
            {entry.settledAt !== undefined && entry.status !== 'pending' && (
              <Stat label={entry.status === 'cancelled' ? 'Called Off' : entry.status === 'missed' ? 'Missed' : 'Done'} value={formatDate(entry.settledAt, zone)} note={formatTime(entry.settledAt, zone)} />
            )}
          </div>
        </>
      ),
      ways,
      provenance: 'The calendar is the collision detector: anything that wants you inside the same hour as something else is flagged here before you get to it.',
    };
  },
});

/** The one sentence an entry leads with. */
function entrySentence(found: TheEntry, sim: Simulation): string {
  const { entry, clashes, elsewhere } = found;
  const zone = sim.homeZone;
  const when = spokenWhen(entry.at, sim, zone);
  const city = cityOf(entry);
  // Local to the thing, not to the ledger: see `clockOf`.
  const time = formatTime(entry.at, clockOf(entry, zone));

  // Counted off the clock rather than off `found.day`, which is undefined
  // wherever the player is standing nowhere the gazetteer knows — and a day
  // that cannot be read is no reason to tell somebody a thing is tomorrow.
  const offset = daysBetween(sim.now, entry.at, zone);

  // "in three hours, at 10:30 AM" for today; "at 4:00 PM on Saturday, in six
  // weeks" for anything further off, and never the same word twice.
  const lead = offset === 0 ? `${when}, at ${time}`
    : Math.abs(offset) === 1 ? `at ${time} ${when}`
      : `at ${time} on ${WEEKDAY_NAMES[zonedParts(entry.at, zone).weekday]}, ${when}`;

  if (entry.status === 'observance') {
    return `That’s ${when}, and it’s an observance — on the calendar so you know, and nothing about it is yours to change.`;
  }
  if (entry.status !== 'pending') {
    return `That was ${lead}, and it’s down as ${statusWord(entry).toLowerCase()}.`;
  }
  if (clashes.length > 0) {
    return `It wants you ${lead}, and so does ${asName(clashes[0]?.title ?? 'something else')}.`;
  }
  if (elsewhere && city) {
    return `It wants you in ${city.name} ${lead}, and you’re in ${elsewhere.name}.`;
  }
  if (entry.requiresPlayer) {
    return `It wants you ${lead}${city ? `, in ${city.name}` : ''}.`;
  }
  return `The world handles this one ${lead}, without needing you there.`;
}

// ---------------------------------------------------------------------------
// The season the day sits in
// ---------------------------------------------------------------------------

interface TheSeason {
  city: City;
  season: Season;
  /** The months it runs here, in order, 1-12. */
  months: number[];
  now: Season;
  /** Midday at the middle of it. */
  middle: Instant;
  sun: SunTimes;
}

/** The months a season covers in a place, asked of the engine rather than tabled. */
function monthsOfSeason(city: City, season: Season, year: number): number[] {
  const found: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const mid = instantFromZoned({ year, month, day: 15, hour: 12 }, city.timeZone);
    if (seasonOf(mid, city.timeZone, city.latitude) === season) found.push(month);
  }
  if (found.length === 0) return found;
  // December, January, February reads in that order, not January, February, December.
  const head = found.find((m) => !found.includes(m === 1 ? 12 : m - 1)) ?? found[0]!;
  const start = found.indexOf(head);
  return [...found.slice(start), ...found.slice(0, start)];
}

/** `cityId/Season`, so a season belongs to a place rather than to the year. */
function splitSeasonId(id: string): { cityId: string; season: Season } | undefined {
  const cut = id.lastIndexOf('/');
  if (cut <= 0) return undefined;
  const season = id.slice(cut + 1) as Season;
  if (!SEASONS.includes(season)) return undefined;
  return { cityId: id.slice(0, cut), season };
}

defineLook<TheSeason>('season', {
  gone: 'There’s no season by that name where you’re standing.',
  resolve: (sim, id) => {
    const split = splitSeasonId(id);
    if (!split) return undefined;
    const city = CITIES.get(split.cityId);
    if (!city) return undefined;

    const year = zonedParts(sim.now, city.timeZone).year;
    const months = monthsOfSeason(city, split.season, year);
    if (months.length === 0) return undefined;

    const middleMonth = months[Math.floor(months.length / 2)] ?? months[0]!;
    const middle = instantFromZoned({ year, month: middleMonth, day: 15, hour: 12 }, city.timeZone);
    return {
      city,
      season: split.season,
      months,
      now: seasonOf(sim.now, city.timeZone, city.latitude),
      middle,
      sun: sunTimes(middle, city.latitude, city.longitude, city.timeZone),
    };
  },
  seeds: (sim) => {
    const city = standingIn(sim);
    if (!city) return [];
    return SEASONS.map((season) => `${city.id}/${season}`);
  },
  look: (season, { sim }) => {
    const { city, months, sun } = season;
    const isNow = season.now === season.season;
    const names = months.map((m) => MONTH_NAMES[m - 1] ?? '');
    const middleMonth = months[Math.floor(months.length / 2)] ?? months[0]!;
    const normal = normalFor(city, middleMonth, 15);
    const warm = usesFahrenheit(city.countryId);
    const unit = warm ? '°F' : '°C';
    const high = warm ? toFahrenheit(normal.high) : Math.round(normal.high);
    const low = warm ? toFahrenheit(normal.low) : Math.round(normal.low);
    const wet = Math.round(normal.wetChance * 100);
    const south = city.latitude < 0;
    const after = SEASONS[(SEASONS.indexOf(season.season) + 1) % SEASONS.length]!;

    const ways: Way[] = [
      {
        to: at('season', `${city.id}/${after}`),
        label: after,
        detail: `What follows it here, ${spokenList(monthsOfSeason(city, after, zonedParts(sim.now, city.timeZone).year).map((m) => MONTH_NAMES[m - 1] ?? ''))}`,
      },
      {
        to: at('daylight', city.id),
        label: 'Daylight',
        detail: `What the light is doing in ${city.name} today, and which way it’s going`,
      },
    ];

    return {
      name: season.season,
      kind: 'A Quarter Of The Year',
      parent: placeOpens(city) ? at('place', city.id) : undefined,
      summary: isNow
        ? `You’re in ${season.season} in ${city.name}, which here runs ${spokenList(names)}.`
        : `${season.season} in ${city.name} runs ${spokenList(names)}, so you’re ${count(monthsUntil(season, sim), 'month')} off it.`,
      body: (
        <>
          <p className="small muted">
            {city.name} sits at {Math.abs(Math.round(city.latitude))}° {south ? 'south' : 'north'},{' '}
            {south
              ? `so the seasons run the other way around from the ones a northern calendar prints — ${season.season} is ${spokenList(names)} here, and nobody down here thinks that’s strange.`
              : `so ${season.season} is ${spokenList(names)}, the way the northern half of the world keeps it.`}
          </p>
          <p className="small muted">
            At the middle of it a day here normally reaches {high}{unit} and falls to {low}{unit},
            with {sun.polar === 'day' ? 'the sun never setting' : sun.polar === 'night' ? 'the sun never rising' : `${formatDaylight(sun.daylightMinutes)} of light in it`}.
            {' '}Something like {spokenNumber(wet)} days in a hundred come wet.
          </p>
          <div className="grid grid-3">
            <Stat label="Runs" value={`${names[0]} To ${names[names.length - 1]}`} note={`${plural(months.length, 'month')} of the year`} />
            <Stat label="Typical High" value={`${high}${unit}`} note="At the middle of it" />
            <Stat label="Typical Low" value={`${low}${unit}`} note="Overnight, at the middle of it" />
            <Stat
              label="Light Then"
              value={sun.polar === 'day' ? 'All Of It' : sun.polar === 'night' ? 'None Of It' : formatDaylight(sun.daylightMinutes)}
              note="On the middle day of it"
            />
            <Stat label="Wet Days" value={`${wet}%`} note="Of the days in it" />
            <Stat label="Where" value={city.name} note={isNow ? 'And this is the season you’re in' : 'Not the season you’re in'} look={placeOpens(city) ? at('place', city.id) : undefined} />
          </div>
        </>
      ),
      ways,
      provenance: 'SLATE’s climate model for this latitude and this kind of place — what the date usually brings here, not a forecast of any particular one.',
    };
  },
});

/**
 * How many months until a season starts here, counted forward only.
 *
 * The short way round the year was wrong in a way that read as fact: in March
 * the nearest Winter month is last February, and "one month off Winter" is a
 * sentence about a winter that has already been. Seasons that are not this
 * one are ahead of you, so they are counted ahead.
 */
function monthsUntil(season: TheSeason, sim: Simulation): number {
  const month = zonedParts(sim.now, season.city.timeZone).month;
  const first = season.months[0] ?? month;
  // A season starting this month is the season you are in, and never lands here.
  return (first - month + 12) % 12 || 12;
}
