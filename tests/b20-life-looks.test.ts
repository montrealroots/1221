/**
 * Brief 20's M1 for the life looks (presentation rows: each one's purpose is to show the truth, and its evidence shows
 * it does): each look a player opens on the day, the sky, the calendar and the body says what the engine function the
 * game itself reads says, so what the player reads is what a workout, a night or a class will meet.
 *
 * - The sky (`weather`, `forecastday`, `hours`, `skyhour`, `skyweek`) is `weatherAt`, `forecastFor` and `hoursOn`, the same
 *   sky Work Out reads as its hour ends (`trainingAt`).
 * - The day (`day`, `entry`, `stretch`, `plans`) is the calendar's own entries, statuses and clashes, and the holidays kept
 *   where the player is (`keptCalendars`).
 * - The light and the season (`daylight`, `season`) are `sunTimes` and `seasonOf` for the town.
 * - The body (`dial`, `condition`) is the dial's figure and an injury's mending date and what it keeps them from
 *   (`injuryKeeps`), which the workout's refusal reads.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, from Monday 24 August
 * 2026; plans put on as the Calendar's form puts them; the clock moved with Go at each stop. TEST SETUP: an injury given
 * by hand for the condition look.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_MINUTE, dateKey, formatTime, instantFromZoned, seasonOf, startOfDay } from '@/engine/core/time';
import { sunTimes } from '@/engine/core/sun';
import { answerStop } from '@/engine/world/clock';
import { forecastFor, hoursOn, weatherAt, weatherOn } from '@/engine/systems/weather';
import { injuryKeeps } from '@/engine/systems/injury';
import { healthOf } from '@/engine/systems/health';
import { CITIES } from '@/engine/content/geography';
import { addCountryHolidays } from '@/engine/content/holidays';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
// FIXTURE: the game's provider stood in for by the save, as tests/evidence3-home.test.ts stands it in: a look's names open
// further looks through it.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0 } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

const zone = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9, mi = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: mi }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
function go(sim: Simulation, to: number): void {
  let r = sim.advanceTo(to, { stopOnPlayerRequired: true });
  for (let n = 0; r.interruptedBy && n < 500; n += 1) r = answerStop(sim, { item: r.interruptedBy, wanted: to, sentFrom: r.sentFrom }, 'go').result!;
}
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
/** A look as the panel draws it: its name, summary, body, and each way's label and detail. */
function look(sim: Simulation, kind: string, id: string): string {
  h.sim = sim;
  const l = resolveLook(sim, subject(kind, id));
  if (!l || 'gone' in l) throw new Error(`no ${kind} look for ${id}`);
  const facets = (l.facets ?? []).map((f) => `${f.label}: ${renderToStaticMarkup(createElement('div', null, f.body))}`).join(' ');
  return words(`${l.name}. ${l.summary} ${renderToStaticMarkup(createElement('div', null, l.body))} ${facets} ${(l.ways ?? []).map((w) => `${w.label}: ${w.detail}`).join(' | ')}`);
}

const NH = CITIES.get('us-ct-newhaven')!;

describe('the sky the looks show is the sky the game reads', () => {
  it('weather, forecastday, hours, skyhour and skyweek say weatherAt’s, forecastFor’s and hoursOn’s figures', () => {
    const sim = student('b20-looks-sky');
    // The reading now at nine in the morning, when it isn't the day's high: at two in the afternoon it is, once each is
    // rounded from the same figure (from 2026-10-21), and a look that said the high for the reading would read the same.
    go(sim, at(2026, 8, 24, 9));
    const morning = weatherAt(sim, NH.id)!;
    expect(morning.temperature).toBeLessThan(morning.high);
    expect(look(sim, 'weather', NH.id)).toContain(`It’s ${morning.temperature}°F`);
    go(sim, at(2026, 8, 24, 14));
    const now = weatherAt(sim, NH.id)!;
    expect(look(sim, 'weather', NH.id)).toContain(`It’s ${now.temperature}°F`);
    const week = forecastFor(sim, NH.id, 6);
    const tomorrow = week[1]!;
    const day = look(sim, 'forecastday', `${NH.id}/${tomorrow.dateKey}`);
    expect(day).toContain(`${tomorrow.high}°F`);
    expect(day).toContain(`${tomorrow.low}°F`);
    const hours = hoursOn(sim, NH.id, at(2026, 8, 25, 0));
    const strip = look(sim, 'hours', `${NH.id}/${tomorrow.dateKey}`);
    for (const h of hours) expect(strip).toContain(`${h.temperature}°F, ${h.condition.toLowerCase()}`);
    const noon = hours.find((h) => h.hour === 12)!;
    expect(look(sim, 'skyhour', `${NH.id}/${tomorrow.dateKey}/12`)).toContain(`${noon.temperature}°F`);
    const ahead = look(sim, 'skyweek', NH.id);
    for (const d of week.slice(1)) expect(ahead).toContain(`${d.low}°F`);
  });
});

describe('an hour of the sky never reads past its own day’s high or low', () => {
  // The guide area's finding (brief 20): the hours were worked out from the day's high and low rounded to whole degrees
  // Celsius, and the high and low shown were converted from the unrounded ones, so a Fahrenheit town's afternoon could
  // read over its own high. Over a year of New Haven's hours, 124 read above the day's high and 118 below its low; on 25
  // August 2026 at 2:37 PM Home said "86°F" beside "High 85°F".
  it('a year of New Haven’s hours, and the reading at 2:37 every afternoon, sit within the high and low the day shows', () => {
    const sim = student('b20-looks-sky');
    const past: string[] = [];
    for (let d = 0; d < 365; d += 1) {
      const start = startOfDay(at(2026, 8, 24, 12) + d * MS_DAY, zone);
      const day = weatherOn(sim, NH, start);
      for (const h of hoursOn(sim, NH.id, start)) if (h.temperature > day.high || h.temperature < day.low) past.push(`${day.dateKey} ${h.hour}:00 ${h.temperature}°F, ${day.low} to ${day.high}`);
      const now = weatherAt(sim, NH.id, start + (14 * 60 + 37) * MS_MINUTE)!;
      if (now.temperature > now.high || now.temperature < now.low) past.push(`${day.dateKey} 2:37 PM ${now.temperature}°F, ${now.low} to ${now.high}`);
    }
    expect(past).toEqual([]);
  });
});

describe('the day, its entries, a plan’s hours and the plans say the calendar as it stands', () => {
  it('today’s look names what’s on it and Labor Day kept on its day; a plan’s entry says its time, length and clash; its hours say the sky over them; Your Own Plans counts them', () => {
    addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));
    const sim = student('b20-looks-day');
    const coffee = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: at(2026, 8, 24, 16), durationMinutes: 60 } }).id;
    const call = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call Home', at: at(2026, 8, 24, 16, 30), durationMinutes: 60 } }).id;
    const later = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Read', at: at(2026, 8, 27, 20), durationMinutes: 60 } }).id;
    sim.must({ kind: 'calendar.cancel', payload: { entryId: later } });
    const today = look(sim, 'day', dateKey(sim.now, zone));
    expect(today).toContain('Coffee');
    expect(today).toContain('Call Home');
    expect(today).toMatch(/clash/);
    // In the country's own English (from 2026-10-21): until then the dataset's British gloss, `it’s Labour Day here` and
    // `keeps Labor Day (Labour Day) on it`, of New Haven.
    const labor = look(sim, 'day', '2026-09-07');
    expect(labor).toContain('it’s Labor Day here');
    expect(labor).toContain('Labor Day is kept in the United States that day.');
    expect(labor).toContain('The United States keeps Labor Day on it.');
    expect(labor).toMatch(/Daylight from 6:23 AM to 7:17 PM: 12 hours and 54 minutes\./);
    expect(labor).not.toMatch(/Labour/);
    const entry = look(sim, 'entry', coffee);
    expect(entry).toContain('4:00 PM');
    expect(entry).toContain('Call Home');
    expect(entry).toContain('Pending');
    const stretch = look(sim, 'stretch', coffee);
    for (const h of hoursOn(sim, NH.id, at(2026, 8, 24, 0)).filter((x) => x.hour === 16)) expect(stretch).toContain(`${h.temperature}°F`);
    expect(look(sim, 'plans', '')).toMatch(/Waiting.*2.*Called Off.*1.*Gone By.*0/);
    go(sim, at(2026, 8, 24, 20));
    // Settled as the clock reached them: Coffee kept, Call Home missed for the clash, Read called off.
    expect([coffee, call, later].map((id) => sim.timeline.get(id)!.status)).toEqual(['done', 'missed', 'cancelled']);
    expect(look(sim, 'entry', call)).toContain('Missed');
    expect(look(sim, 'plans', '')).toMatch(/Waiting.*0.*Called Off.*1.*Gone By.*1/);
  });
});

describe('the light and the season are the town’s', () => {
  it('daylight says sunTimes’ sunrise and sunset; the season look names the season seasonOf gives today', () => {
    const sim = student('b20-looks-light');
    const sun = sunTimes(sim.now, NH.latitude, NH.longitude, NH.timeZone);
    const light = look(sim, 'daylight', NH.id);
    expect(light).toContain(formatTime(sun.sunrise!, NH.timeZone));
    expect(light).toContain(formatTime(sun.sunset!, NH.timeZone));
    const season = seasonOf(sim.now, zone, NH.latitude);
    expect(look(sim, 'season', `${NH.id}/${season}`)).toContain(`It’s ${season.toLowerCase()} in New Haven`);
  });
});

describe('the body’s looks say the figures the game reads', () => {
  it('a dial leads with its figure; an injury’s look says when it mends and what it keeps her from, as the workout’s refusal does', () => {
    const sim = student('b20-looks-body');
    go(sim, at(2026, 8, 24, 14));
    expect(look(sim, 'dial', `${sim.player.id}/energy`)).toContain(`Energy. ${Math.round(sim.player.wellbeing.energy)}.`);
    expect(look(sim, 'dial', `${sim.player.id}/sleepDebt`)).toContain('Sleep Debt.');
    // TEST SETUP: a sprained ankle, mending in four days.
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 4 * MS_DAY };
    const hurt = look(sim, 'condition', `${sim.player.id}/injury`);
    expect(hurt).toContain('It mends by August 28, 2026.');
    expect(hurt).toContain(injuryKeeps('sprain', true));
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with a sprained ankle; it has 4 days yet to mend.');
  });
});
