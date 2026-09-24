/**
 * A day is a date on the calendar, not twenty-four hours from its start.
 *
 * On the day the clocks go forward a day is twenty-three hours long, and on
 * the day they go back twenty-five. In five home zones (Havana, Santiago, the
 * Azores, Beirut and Cairo) the clocks go forward at midnight, so the day of
 * the jump begins at one. The engine's rollover was put on the calendar date
 * by the spring-forward fix; these hold the rest of the game to the same.
 *
 * What they replaced, measured before each fix: the night nobody chose into
 * the day of the jump, which starts at that day's first instant, was read as a
 * bedtime at one in the morning and lost 0.08 of its quality, and so was any
 * bedtime in that day's first hour; the Day look ended a day at a day added to
 * its start, so the day of the jump listed the next day's first hour as its
 * own; the month grid ended each cell 24 hours on, so on every 23-hour day a
 * plan in the next day's first hour sat in two cells and on every 25-hour day
 * one in the last hour sat in none; the plan form offered 24 hours of
 * half-hour slots from the start of the day and opened at nine hours in, which
 * on a 23-hour day was ten o'clock and ran into the next date; the hours of a
 * day were counted from its start, so each hour after the jump was an hour off
 * its label; and the week ahead stepped 24 hours at a time, so asked late any
 * evening in the week before a 23-hour day it skipped that day.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { addCountryCities } from '@/engine/content/geography';
import {
  dateKey, formatTime, instantFromZoned, startOfDay, startOfNextDay, zonedParts, MS_HOUR, MS_MINUTE,
} from '@/engine/core/time';
import { sleepQuality } from '@/engine/systems/life';
import { forecastFor, hoursOn } from '@/engine/systems/weather';
import { monthGrid, type CalendarDay } from '@/engine/world/calendar';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import { canPlan, firstFreeSlot, openSlots } from '@/ui/workspaces/cell';

interface Jump { place: string; year: number; month: number; day: number }

const JUMPS: Jump[] = [
  { place: 'cu-02-havana', year: 2026, month: 3, day: 8 },
  { place: 'lb-04-beirut', year: 2026, month: 3, day: 29 },
  { place: 'cl-12-santiago', year: 2026, month: 9, day: 6 },
  { place: 'eg-11-cairo', year: 2026, month: 4, day: 24 },
  { place: 'pt-23-pontadelgada', year: 2026, month: 3, day: 29 },
];
const HAVANA: Jump = JUMPS[0]!;
/** Los Angeles, whose clocks go forward at two on the same day as Havana's. */
const LA: Jump = { place: 'us-ca-losangeles', year: 2026, month: 3, day: 8 };
/** Los Angeles again, the day its clocks go back: twenty-five hours, one in the morning twice. */
const LA_BACK: Jump = { place: 'us-ca-losangeles', year: 2026, month: 11, day: 1 };
/** Havana's clocks go back at one to midnight, so midnight comes twice. */
const HAVANA_BACK: Jump = { place: 'cu-02-havana', year: 2026, month: 11, day: 1 };

// The Azores are Portuguese and Chatham's clock is New Zealand's, and a
// country's towns are loaded when the player picks it.
beforeAll(() => {
  addCountryCities('pt', readFileSync('public/geo/pt.tsv', 'utf8'));
  addCountryCities('nz', readFileSync('public/geo/nz.tsv', 'utf8'));
});

/** The date `offset` days from `jump`, as year, month and day. */
function dateOf(jump: Jump, offset: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(jump.year, jump.month - 1, jump.day + offset));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** The instant the save's home clock reads `hour:minute` on that date: the first, where it reads it twice. */
function wall(sim: Simulation, jump: Jump, offset: number, hour: number, minute = 0): number {
  return instantFromZoned({ ...dateOf(jump, offset), hour, minute }, sim.homeZone);
}

/** A save at home in `jump.place` from half past seven `offset` days from `jump`. */
function saveIn(jump: Jump, offset: number, seed = 'bounds'): Simulation {
  const d = dateOf(jump, offset);
  // No day job: these read which entries a day holds, and a shift would be
  // one of them.
  return quickSave({ startYear: d.year, startMonth: d.month, startDay: d.day, startLocationId: jump.place, dayJob: false }, seed);
}

const keyOf = (jump: Jump, offset: number) => {
  const d = dateOf(jump, offset);
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
};

/** Puts a plan on the calendar through the command the Calendar uses. */
function plan(sim: Simulation, title: string, when: number, durationMinutes = 60): string {
  const result = sim.execute<{ ok: boolean }>({ kind: 'calendar.schedule', payload: { title, at: when, durationMinutes } });
  expect(result.ok, title).toBe(true);
  const item = sim.universe.scheduled.find((one) => one.label === title && one.at === when);
  expect(item, title).toBeDefined();
  return item!.id;
}

const looked = (sim: Simulation, kind: string, id: string): Looked => {
  const found = resolveLook(sim, at(kind, id));
  expect(found && !('gone' in found), `${kind} ${id}`).toBe(true);
  return found as Looked;
};

const waysTo = (look: Looked, kind: string): string[] =>
  (look.ways ?? []).filter((way) => way.to.kind === kind).map((way) => way.to.id);

describe('a bedtime in the first hour of the day of the jump', () => {
  for (const jump of JUMPS) {
    it(`is read as a bedtime in the first hour after midnight in ${jump.place}, not one at one`, () => {
      const sim = saveIn(jump, -1);
      const start = wall(sim, jump, 0, 0);
      // The day's first instant reads one o'clock, because midnight never came.
      expect(zonedParts(start, sim.homeZone).hour).toBe(1);
      const quality = (when: number) => sleepQuality(sim, sim.player, when);
      // The night nobody chose starts at that first instant.
      expect(quality(start)).toBe(quality(start - 1));
      expect(quality(start + 30 * MS_MINUTE)).toBe(quality(start - 1));
      // An hour into the day, at two by the clock, it is late, as one is on an ordinary night.
      expect(quality(start + MS_HOUR)).toBeCloseTo(quality(start - 1) - 0.08, 10);
    });
  }

  it('still reads a bedtime at one on an ordinary night as late', () => {
    const sim = saveIn(LA, 3);
    const one = wall(sim, LA, 4, 1);
    expect(sleepQuality(sim, sim.player, one)).toBeCloseTo(sleepQuality(sim, sim.player, one - 1) - 0.08, 10);
  });

  it('leaves a life on autopilot through the jump where one in Los Angeles is, morning by morning', () => {
    // Measured before the fix: the night into the day of the jump put back
    // 0.11 condition and 0.54 morale where Los Angeles's put back 0.64 and
    // 1.47, and the gap held 21 days in condition and 24 in morale. Within a
    // twentieth now: a day of twenty-three hours is still an hour shorter, and
    // the four zones whose clocks jump on another night from Los Angeles's read
    // 0.009 condition and 0.016 morale off it the morning after, where Havana,
    // whose clocks jump the same night, reads the same.
    for (const jump of JUMPS) {
      const here = saveIn(jump, -3, 'autopilot');
      const d = dateOf(jump, -3);
      const la = quickSave({ startYear: d.year, startMonth: d.month, startDay: d.day, startLocationId: LA.place, dayJob: false }, 'autopilot');
      for (let offset = -2; offset <= 6; offset += 1) {
        here.advanceTo(wall(here, jump, offset, 7));
        la.advanceTo(instantFromZoned({ ...dateOf(jump, offset), hour: 7 }, la.homeZone));
        const label = `${jump.place} ${keyOf(jump, offset)}`;
        expect(here.player.wellbeing.condition, label).toBeCloseTo(la.player.wellbeing.condition, 1);
        expect(here.player.wellbeing.morale, label).toBeCloseTo(la.player.wellbeing.morale, 1);
      }
    }
  });
});

describe('the Day look and the entry look', () => {
  it('end the day of a jump where the next date begins, in Havana', () => {
    const sim = saveIn(HAVANA, -1);
    const morning = plan(sim, 'Morning Meeting', wall(sim, HAVANA, 0, 10));
    const late = plan(sim, 'Late Drink', wall(sim, HAVANA, 0, 23, 30), 30);
    const after = plan(sim, 'After Midnight', wall(sim, HAVANA, 1, 0, 30), 30);

    const jumpDay = waysTo(looked(sim, 'day', keyOf(HAVANA, 0)), 'entry');
    expect(jumpDay).toEqual([morning, late]);
    expect(waysTo(looked(sim, 'day', keyOf(HAVANA, 1)), 'entry')).toEqual([after]);
    // Nothing else that day comes after the late drink.
    const nextThatDay = (looked(sim, 'entry', late).ways ?? []).filter((way) => way.detail.startsWith('Next thing that day'));
    expect(nextThatDay).toEqual([]);
  });

  it('still end a 23-hour day that begins at midnight at the next one, in Los Angeles', () => {
    const sim = saveIn(LA, -1);
    const late = plan(sim, 'Late Drink', wall(sim, LA, 0, 23, 30), 30);
    const after = plan(sim, 'After Midnight', wall(sim, LA, 1, 0, 30), 30);
    expect(waysTo(looked(sim, 'day', keyOf(LA, 0)), 'entry')).toEqual([late]);
    expect(waysTo(looked(sim, 'day', keyOf(LA, 1)), 'entry')).toEqual([after]);
  });

  it('keep the whole of a 25-hour day, its last hour included', () => {
    const sim = saveIn(LA_BACK, -1);
    // The first of November's rent falls due at eight that evening, inside
    // the day, and it is the next thing after the meeting.
    const rent = sim.timeline.pending().find((item) => item.kind === 'home.rent')!.id;
    const morning = plan(sim, 'Morning Meeting', wall(sim, LA_BACK, 0, 10));
    const late = plan(sim, 'Late Drink', wall(sim, LA_BACK, 0, 23, 30), 30);
    expect(waysTo(looked(sim, 'day', keyOf(LA_BACK, 0)), 'entry')).toEqual([morning, rent, late]);
    const next = (looked(sim, 'entry', morning).ways ?? []).find((way) => way.detail.startsWith('Next thing that day'));
    expect(next?.to.id).toBe(rent);
    const after = (looked(sim, 'entry', rent).ways ?? []).find((way) => way.detail.startsWith('Next thing that day'));
    expect(after?.to.id).toBe(late);
  });
});

describe('the stretch of a plan', () => {
  for (const [back, hour, label] of [[LA_BACK, 1, '1'], [HAVANA_BACK, 0, '0']] as const) {
    it(`opens for a plan in the second run of the hour ${back.place} repeats`, () => {
      const sim = saveIn(back, -1);
      // The second run starts an hour after the first.
      const second = wall(sim, back, 0, hour) + MS_HOUR;
      expect(zonedParts(second, sim.homeZone).hour).toBe(hour);
      const id = plan(sim, 'Second Run', second, 30);
      const stretch = looked(sim, 'stretch', id);
      expect(waysTo(stretch, 'skyhour')).toEqual([`${back.place}/${keyOf(back, 0)}/${label}`]);
    });
  }

  it('shows the sky at ten for a plan from ten to eleven on a 23-hour day', () => {
    const sim = saveIn(LA, -1);
    const id = plan(sim, 'Morning Meeting', wall(sim, LA, 0, 10));
    expect(waysTo(looked(sim, 'stretch', id), 'skyhour')).toEqual([`${LA.place}/${keyOf(LA, 0)}/10`]);
  });
});

describe('the month grid', () => {
  const cellsHolding = (days: CalendarDay[], id: string) =>
    days.filter((day) => day.entries.some((entry) => entry.id === id)).map((day) => day.key);

  for (const jump of [HAVANA, LA]) {
    it(`puts a plan in the first hour after a 23-hour day in its own cell only, in ${jump.place}`, () => {
      const sim = saveIn(jump, -1);
      const after = plan(sim, 'After Midnight', wall(sim, jump, 1, 0, 30), 30);
      expect(cellsHolding(monthGrid(sim, jump.year, jump.month), after)).toEqual([keyOf(jump, 1)]);
    });
  }

  it('puts a plan in the last hour of a 25-hour day in that day', () => {
    const sim = saveIn(LA_BACK, -1);
    const late = plan(sim, 'Late Drink', wall(sim, LA_BACK, 0, 23, 30), 30);
    expect(cellsHolding(monthGrid(sim, LA_BACK.year, LA_BACK.month), late)).toEqual([keyOf(LA_BACK, 0)]);
  });

  it('flags a clash across the grid’s last midnight in the cell it falls in', () => {
    // March 2026's grid ends on Saturday 4 April.
    const sim = saveIn(LA, 3);
    const late = plan(sim, 'Late Drink', instantFromZoned({ year: 2026, month: 4, day: 4, hour: 23, minute: 30 }, sim.homeZone), 60);
    plan(sim, 'Early Call', instantFromZoned({ year: 2026, month: 4, day: 5, hour: 0, minute: 15 }, sim.homeZone), 30);
    const days = monthGrid(sim, 2026, 3);
    expect(days.at(-1)!.key).toBe('2026-04-04');
    expect(days.at(-1)!.entries.find((entry) => entry.id === late)?.conflicted).toBe(true);
  });
});

describe('the plan form', () => {
  const cell = (sim: Simulation, jump: Jump, offset: number): CalendarDay =>
    monthGrid(sim, dateOf(jump, offset).year, dateOf(jump, offset).month).find((day) => day.key === keyOf(jump, offset))!;
  const labels = (sim: Simulation, day: CalendarDay) =>
    openSlots(day, sim.now, sim.homeZone).map((slot) => formatTime(day.date + slot * MS_MINUTE, sim.homeZone));
  const opensAt = (sim: Simulation, day: CalendarDay) =>
    formatTime(day.date + firstFreeSlot(day, sim.now, sim.homeZone) * MS_MINUTE, sim.homeZone);

  it('offers every half hour of an ordinary day, and opens at nine', () => {
    const sim = saveIn(LA, 3);
    const day = cell(sim, LA, 4);
    expect(labels(sim, day)).toHaveLength(48);
    expect(opensAt(sim, day)).toBe('9:00 AM');
  });

  it('offers the half hour the clock is standing on', () => {
    const sim = saveIn(LA, 3);
    expect(labels(sim, cell(sim, LA, 3))[0]).toBe('7:30 AM');
  });

  for (const [jump, first, count] of [[LA, '12:00 AM', 46], [HAVANA, '1:00 AM', 46]] as const) {
    it(`offers only the day's own half hours on a 23-hour day, and opens at nine, in ${jump.place}`, () => {
      const sim = saveIn(jump, -1);
      const day = cell(sim, jump, 0);
      const offered = labels(sim, day);
      expect(offered).toHaveLength(count);
      expect(offered[0]).toBe(first);
      expect(offered.at(-1)).toBe('11:30 PM');
      // Every slot falls on the day it is offered under.
      for (const slot of openSlots(day, sim.now, sim.homeZone)) {
        expect(dateKey(day.date + slot * MS_MINUTE, sim.homeZone)).toBe(day.key);
      }
      expect(opensAt(sim, day)).toBe('9:00 AM');
    });
  }

  it('offers the whole of a 25-hour day, the hour that comes twice included, and opens at nine', () => {
    const sim = saveIn(LA_BACK, -1);
    const day = cell(sim, LA_BACK, 0);
    const offered = labels(sim, day);
    expect(offered).toHaveLength(50);
    expect(offered.at(-1)).toBe('11:30 PM');
    expect(offered.filter((label) => label === '1:30 AM')).toHaveLength(2);
    expect(opensAt(sim, day)).toBe('9:00 AM');
    expect(canPlan(day, wall(sim, LA_BACK, 0, 23, 30), sim.homeZone)).toBe(true);
  });

  it('closes a day to plans when the next one begins, not 24 hours after it began', () => {
    const sim = saveIn(HAVANA, -1);
    const day = cell(sim, HAVANA, 0);
    expect(canPlan(day, wall(sim, HAVANA, 0, 23, 59), sim.homeZone)).toBe(true);
    expect(canPlan(day, startOfNextDay(day.date, sim.homeZone) - 1, sim.homeZone)).toBe(true);
    expect(canPlan(day, startOfNextDay(day.date, sim.homeZone), sim.homeZone)).toBe(false);
    expect(canPlan(day, wall(sim, HAVANA, 1, 0, 30), sim.homeZone)).toBe(false);
  });
});

describe('the hours of a day', () => {
  for (const [jump, first, count] of [[LA, 0, 23], [HAVANA, 1, 23], [LA_BACK, 0, 24]] as const) {
    it(`put each hour at its own reading on the clock in ${jump.place} on ${keyOf(jump, 0)}`, () => {
      const sim = saveIn(jump, -1);
      const hours = hoursOn(sim, jump.place, startOfDay(wall(sim, jump, 0, 12), sim.homeZone));
      expect(hours).toHaveLength(count);
      expect(hours[0]!.hour).toBe(first);
      for (const hour of hours) {
        const read = zonedParts(hour.at, sim.homeZone);
        expect([read.hour, read.minute], `${jump.place} ${hour.hour}`).toEqual([hour.hour, 0]);
      }
    });
  }

  it('starts the rest of today at the start of the hour it is, whatever the seconds say', () => {
    const sim = saveIn(LA, 0);
    sim.advanceTo(wall(sim, LA, 0, 10, 20) + 37_250);
    const hours = hoursOn(sim, LA.place, sim.now);
    expect(hours[0]!.hour).toBe(10);
    expect(hours[0]!.at).toBe(wall(sim, LA, 0, 10));
  });

  it('starts the rest of today at the run of the repeated hour the clock is in', () => {
    const sim = saveIn(LA_BACK, -1);
    const second = wall(sim, LA_BACK, 0, 1) + MS_HOUR;
    sim.advanceTo(second + 20 * MS_MINUTE);
    const hours = hoursOn(sim, LA_BACK.place, sim.now);
    expect(hours[0]!.hour).toBe(1);
    expect(hours[0]!.at).toBe(second);
    expect(hours[1]!.hour).toBe(2);
    expect(hours[1]!.at).toBeGreaterThan(sim.now);
  });

  it('keeps the hour it is asked in where the clocks change at a quarter to (Chatham)', () => {
    // Waitangi's clocks go from 2:45 to 3:45 on 27 September 2026, and back
    // from 3:45 to 2:45 on 5 April.
    const place = 'nz-10-waitangi';
    const forward: Jump = { place, year: 2026, month: 9, day: 27 };
    const onward = saveIn(forward, -1);
    onward.advanceTo(wall(onward, forward, 0, 3, 50));
    const first = hoursOn(onward, place, onward.now)[0]!;
    expect(first.hour).toBe(3);
    expect(formatTime(first.at, onward.homeZone)).toBe('3:45 AM');

    const back: Jump = { place, year: 2026, month: 4, day: 5 };
    const behind = saveIn(back, -1);
    // The second run of 2:45 to 3:45, at ten to three.
    behind.advanceTo(wall(behind, back, 0, 2, 50) + MS_HOUR);
    const [two, three] = hoursOn(behind, place, behind.now);
    expect(two!.hour).toBe(2);
    expect(behind.now - two!.at).toBe(5 * MS_MINUTE);
    expect(three!.hour).toBe(3);
    expect(three!.at).toBeGreaterThan(behind.now);
  });
});

describe('the week ahead', () => {
  const weekOf = (sim: Simulation, place: string) => forecastFor(sim, place, 7).map((day) => day.dateKey);

  for (const [jump, firstHour] of [[HAVANA, '1'], [LA, '0']] as const) {
    it(`keeps a 23-hour day when asked late the evening before, in ${jump.place}`, () => {
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, -1, 23, 30));
      expect(weekOf(sim, jump.place)).toEqual([-1, 0, 1, 2, 3, 4, 5].map((offset) => keyOf(jump, offset)));

      // And the looks over that day name it, step from it, and hold its hours.
      const day = looked(sim, 'forecastday', `${jump.place}/${keyOf(jump, 0)}`);
      expect(day.name).toBe('Sunday');
      expect(waysTo(day, 'forecastday')).toEqual([keyOf(jump, -1), keyOf(jump, 1)].map((key) => `${jump.place}/${key}`));
      const hours = looked(sim, 'hours', `${jump.place}/${keyOf(jump, 0)}`);
      expect(hours.name).toBe('Sunday’s Hours');
      const tiles = waysTo(hours, 'skyhour');
      expect(tiles).toHaveLength(23);
      expect(tiles[0]).toBe(`${jump.place}/${keyOf(jump, 0)}/${firstHour}`);
    });
  }

  it('says the hours of a day that began at one run from one, asked any time before it', () => {
    const sim = saveIn(HAVANA, -1);
    for (const when of [wall(sim, HAVANA, -1, 7, 30), wall(sim, HAVANA, -1, 23, 30)]) {
      sim.advanceTo(when);
      const day = looked(sim, 'forecastday', `${HAVANA.place}/${keyOf(HAVANA, 0)}`);
      const hours = (day.ways ?? []).find((way) => way.to.kind === 'hours')!;
      expect(hours.detail).toContain('1 AM to 11 PM');
      expect(hours.detail).not.toContain('midnight');
    }
  });

  it('still says an ordinary day runs from midnight', () => {
    const sim = saveIn(LA, 3);
    const day = looked(sim, 'forecastday', `${LA.place}/${keyOf(LA, 5)}`);
    const hours = (day.ways ?? []).find((way) => way.to.kind === 'hours')!;
    expect(hours.detail).toContain('midnight to 11 PM');
  });

  it('gives a 25-hour day once when asked in its first hour', () => {
    const sim = saveIn(LA_BACK, -1);
    sim.advanceTo(wall(sim, LA_BACK, 0, 0, 30));
    expect(weekOf(sim, LA_BACK.place)).toEqual([0, 1, 2, 3, 4, 5, 6].map((offset) => keyOf(LA_BACK, offset)));
  });

  it('keeps a day whose last hour the clocks skip (Nuuk)', () => {
    // Nuuk's 28 March 2026 has no hour from eleven: a day on from half past
    // eleven the evening before, by the clock, is the 29th.
    const nuuk: Jump = { place: 'gl-07-nuuk', year: 2026, month: 3, day: 28 };
    const sim = saveIn(nuuk, -2);
    sim.advanceTo(wall(sim, nuuk, -1, 23, 30));
    expect(weekOf(sim, nuuk.place)).toEqual([-1, 0, 1, 2, 3, 4, 5].map((offset) => keyOf(nuuk, offset)));
    looked(sim, 'forecastday', `${nuuk.place}/${keyOf(nuuk, 0)}`);
  });

  it('counts another city’s week on that city’s calendar', () => {
    // Half past three in Los Angeles is half past midnight in Paris.
    const sim = saveIn(LA, -1);
    sim.advanceTo(wall(sim, LA, -1, 15, 30));
    expect(weekOf(sim, 'fr-idf-paris')).toEqual([0, 1, 2, 3, 4, 5, 6].map((offset) => keyOf(LA, offset)));
  });
});
