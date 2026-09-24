/**
 * SLATE — the things you put on your own calendar, opened.
 *
 * A plan is a commitment somebody made on purpose, and everything about it is
 * a thing in the world: the hours it takes, the sky over those hours, the day
 * it sits in, the place it wants you, the thing it collides with. This is the
 * half of that chain the calendar could not reach before — the run of hours
 * itself, and the set of everything you have decided to do.
 *
 * Nothing here invents anything. The hours come off the same curve the
 * weather reads, the collisions off the same detector the calendar draws, and
 * a plan that was called off says so rather than disappearing.
 */

import { CITIES, type City } from '@/engine/content/geography';
import { MS_MINUTE, dateKey, formatDate, formatRelative, formatTime, startOfDay, startOfNextDay } from '@/engine/core/time';
import { entriesBetween, upcoming, type CalendarEntry } from '@/engine/world/calendar';
import { PLAN_KIND } from '@/engine/world/plans';
import { hoursOn, shootDayWeather, type HourWeather } from '@/engine/systems/weather';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { clockWord } from './weather';
import { defineLook } from './registry';
import { at } from './subject';
import { isAre, said, spokenList, toStart } from './words';

/** How far out the calendar is asked about when gathering what you planned. */
const AHEAD_DAYS = 365;

const cityOf = (entry: CalendarEntry, sim: Simulation): City | undefined =>
  CITIES.get(entry.locationId ?? sim.player.currentLocationId);

const endOf = (entry: CalendarEntry): number =>
  entry.endsAt ?? entry.at + (entry.durationMinutes ?? 60) * MS_MINUTE;

/** The title as a name: trimmed, and never carrying its own punctuation. */
const asName = (title: string): string =>
  title.replace(/\s*\/\s*/g, ' and ').replace(/[.?!]+$/, '').replace(/\s+/g, ' ').trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Everything on the calendar the player put there. */
function plansOf(sim: Simulation): { pending: CalendarEntry[]; settled: CalendarEntry[] } {
  const window = entriesBetween(sim, sim.now - AHEAD_DAYS * 86_400_000, sim.now + AHEAD_DAYS * 86_400_000);
  const mine = window.filter((entry) => sim.timeline.get(entry.id)?.kind === PLAN_KIND);
  return {
    pending: mine.filter((e) => e.status === 'pending'),
    settled: mine.filter((e) => e.status !== 'pending'),
  };
}

// ---------------------------------------------------------------------------
// The hours a commitment takes
// ---------------------------------------------------------------------------

interface Stretch {
  entry: CalendarEntry;
  city: City | undefined;
  hours: HourWeather[];
  minutes: number;
}

/**
 * Every whole hour the window touches, from the hour it starts in.
 *
 * An hour runs until the next one on the clock begins, or until the day ends.
 * On the day the clocks go back the hour they repeat is listed once and runs
 * twice as long; taken as sixty minutes, a plan in its second run touched no
 * hour at all, and its stretch said the hours were free again.
 */
function hoursAcross(sim: Simulation, entry: CalendarEntry, city: City | undefined): HourWeather[] {
  if (!city) return [];
  const from = startOfDay(entry.at, city.timeZone);
  const finish = endOf(entry);
  const hours = hoursOn(sim, city.id, from);
  const endOfHour = (i: number) => hours[i + 1]?.at ?? startOfNextDay(from, city.timeZone);
  return hours.filter((hour, i) => hour.at < finish && endOfHour(i) > entry.at);
}

defineLook<Stretch>('stretch', {
  gone: 'Those hours are free again.',
  resolve: (sim, id) => {
    const item = sim.timeline.get(id);
    if (!item) return undefined;
    const start = startOfDay(item.at, sim.homeZone);
    const entry = entriesBetween(sim, start, start + 2 * 86_400_000).find((e) => e.id === id);
    if (!entry) return undefined;
    const city = cityOf(entry, sim);
    const hours = hoursAcross(sim, entry, city);
    if (hours.length === 0) return undefined;
    return { entry, city, hours, minutes: Math.round((endOf(entry) - entry.at) / MS_MINUTE) };
  },
  seeds: (sim) => upcoming(sim, 6).map((entry) => entry.id),
  look: ({ entry, city, hours, minutes }, { sim }) => {
    const zone = city?.timeZone ?? sim.homeZone;
    const first = hours[0]!;
    const last = hours[hours.length - 1]!;
    const dark = hours.filter((h) => !h.daylight);
    const wet = hours.filter((h) => h.wet);
    const unit = first.fahrenheit ? '°F' : '°C';
    const cold = hours.reduce((a, b) => (b.temperature < a.temperature ? b : a));
    const warm = hours.reduce((a, b) => (b.temperature > a.temperature ? b : a));
    const outside = city ? shootDayWeather(sim, city.id, entry.at, false) : undefined;

    return {
      name: `${formatTime(entry.at, zone)} To ${formatTime(endOf(entry), zone)}`,
      kind: 'The Hours It Takes',
      parent: at('entry', entry.id),
      summary: `It has you from ${formatTime(entry.at, zone)} to ${formatTime(endOf(entry), zone)} — `
        + `${said(Math.round(minutes / 60), 'hour')} of ${formatDate(entry.at, zone)}, `
        + `and ${cold.temperature === warm.temperature
          ? `${cold.temperature}${unit} throughout`
          : `${cold.temperature}${unit} to ${warm.temperature}${unit} across it`}.`,
      body: (
        <>
          <p className="small">
            {dark.length === 0
              ? 'The sun is up for all of it.'
              : dark.length === hours.length
                ? 'All of it is after dark.'
                : `${toStart(said(dark.length, 'hour'))} of it ${isAre(dark.length)} after dark.`}
            {' '}
            {wet.length === 0
              ? 'It stays dry the whole way through.'
              : `It is ${spokenList([...new Set(wet.map((h) => h.condition.toLowerCase()))])} for `
                + `${said(wet.length, 'hour')} of it.`}
          </p>
          {outside && outside.factor < 1 && (
            <p className="small muted">
              Anything of it that happens outdoors gets through about {Math.round(outside.factor * 100)}% of
              what it set out to do. Under a roof the sky makes no difference.
            </p>
          )}
          <div className="grid grid-3">
            <Stat label="Starts" value={formatTime(entry.at, zone)} note={formatDate(entry.at, zone)} />
            <Stat label="Ends" value={formatTime(endOf(entry), zone)} note={said(hours.length, 'hour')} />
            <Stat
              label="Coldest Of Them"
              value={`${cold.temperature}${unit}`}
              note={clockWord(cold.hour)}
            />
          </div>
        </>
      ),
      waysAs: 'strip',
      ways: hours.map((hour) => ({
        to: at('skyhour', `${hour.cityId}/${hour.dateKey}/${hour.hour}`),
        label: clockWord(hour.hour),
        detail: `${hour.temperature}${unit}, ${hour.condition.toLowerCase()}${hour.daylight ? '' : ', after dark'}`,
        glance: { icon: undefined, lines: [`${hour.temperature}°`, hour.daylight ? 'Light' : 'Dark'] },
      })),
      provenance: `${first.hour === last.hour ? 'The hour' : 'Every hour'} it touches, read off the day’s own curve. `
        + 'None of it is stored anywhere.',
    };
  },
});

// ---------------------------------------------------------------------------
// Everything you decided to do
// ---------------------------------------------------------------------------

interface Plans { pending: CalendarEntry[]; settled: CalendarEntry[] }

defineLook<Plans>('plans', {
  gone: 'There’s no calendar to have put anything on.',
  resolve: (sim) => plansOf(sim),
  seeds: () => [''],
  look: ({ pending, settled }, { sim }) => {
    const zone = sim.homeZone;
    const next = pending[0];
    const called = settled.filter((e) => e.status === 'cancelled');
    const missed = settled.filter((e) => e.status === 'missed');

    return {
      name: 'Your Own Plans',
      kind: 'What You Put On The Calendar',
      parent: at('person', sim.universe.playerId),
      summary: pending.length === 0
        ? 'You haven’t put anything on the calendar yourself. Everything on it is somebody else’s doing.'
        : `You have put ${said(pending.length, 'thing')} on the calendar yourself, `
          + `and the next of them is ${formatRelative(next!.at, sim.now)}.`,
      body: (
        <>
          <p className="small">
            {pending.length === 0
              ? 'The calendar takes what you give it: a name, a time, how long it runs and where it wants you. None of it has to be there.'
              : `${asName(next!.title)} is the next one, ${formatDate(next!.at, zone)} at ${formatTime(next!.at, zone)}.`}
            {missed.length > 0 && ` ${said(missed.length, 'has', 'have')} gone by without you.`}
            {called.length > 0 && ` ${said(called.length, 'was', 'were')} called off.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Waiting" value={pending.length} note="Still ahead of you" />
            <Stat label="Called Off" value={called.length} note="You changed your mind" />
            <Stat label="Gone By" value={missed.length} note="You weren’t there" />
          </div>
        </>
      ),
      ways: pending.slice(0, 10).map((entry) => ({
        to: at('entry', entry.id),
        label: asName(entry.title),
        detail: `${formatRelative(entry.at, sim.now)}, ${formatDate(entry.at, zone)} at ${formatTime(entry.at, zone)}`,
      })),
      provenance: 'Ordinary items on the world’s own timeline, which is why the clock stops at them and why two at once are flagged.',
    };
  },
});

/** The day key an entry falls on, for anything wiring a way to its day. */
export const dayOfEntry = (entry: CalendarEntry, zone: string): string => dateKey(entry.at, zone);
