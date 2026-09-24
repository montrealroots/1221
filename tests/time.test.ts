import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig } from '@/engine';
import {
  addDays, addMonths, addYears, ageOn, ageOnDate, dateKey, daysBetween, daysInMonth,
  endOfDay, formatDate, formatDuration, formatTime, instantFromZoned, isLeapYear,
  nextAnniversary, nthWeekdayOfMonth, parseDateKey, sameLocalDay, seasonOf,
  startOfDay, startOfNextDay, zoneOffsetMs, zonedParts, MS_DAY, MS_HOUR, MS_MINUTE,
} from '@/engine/core/time';

const LA = 'America/Los_Angeles';
const NY = 'America/New_York';
const LONDON = 'Europe/London';
const SYDNEY = 'Australia/Sydney';
const PHOENIX = 'America/Phoenix'; // no daylight saving
const TOKYO = 'Asia/Tokyo';        // no daylight saving

describe('the world clock', () => {
  it('round-trips a wall reading through an instant', () => {
    for (const zone of [LA, NY, LONDON, SYDNEY, PHOENIX, TOKYO]) {
      const instant = instantFromZoned({ year: 2026, month: 7, day: 14, hour: 20, minute: 30 }, zone);
      const parts = zonedParts(instant, zone);
      expect([parts.year, parts.month, parts.day, parts.hour, parts.minute])
        .toEqual([2026, 7, 14, 20, 30]);
    }
  });

  it('formats player-facing time naturally rather than in military form', () => {
    const evening = instantFromZoned({ year: 2026, month: 3, day: 2, hour: 20, minute: 30 }, LA);
    expect(formatTime(evening, LA)).toBe('8:30 PM');

    const midnight = instantFromZoned({ year: 2026, month: 3, day: 2, hour: 0, minute: 5 }, LA);
    expect(formatTime(midnight, LA)).toBe('12:05 AM');

    const noon = instantFromZoned({ year: 2026, month: 3, day: 2, hour: 12, minute: 0 }, LA);
    expect(formatTime(noon, LA)).toBe('12:00 PM');
  });

  describe('daylight saving', () => {
    it('resolves a spring-forward gap to the first valid instant', () => {
      // 8 March 2026, 2:00–3:00 AM does not exist in Los Angeles.
      const missing = instantFromZoned({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, LA);
      const parts = zonedParts(missing, LA);
      expect(parts.hour).toBeGreaterThanOrEqual(3);
      expect(parts.day).toBe(8);
    });

    it('resolves a time in a gap to the end of the gap exactly, whichever side the first guess lands', () => {
      // The passes that find the offset swing between an instant before the
      // gap and one after it, and stop on either. Where they stopped after it,
      // which they do at or east of Greenwich, the walk forward began a minute past
      // it and returned the reading plus the gap plus a minute: Beirut and
      // Cairo's day of the jump began at 01:01, and London's 01:30 came out
      // 02:31. Havana, Santiago, the Azores and Los Angeles, where they stopped
      // before it, were already exact.
      const gaps: [string, number, number, number, number][] = [
        ['America/Havana', 3, 8, 0, 1], ['Asia/Beirut', 3, 29, 0, 1],
        ['America/Santiago', 9, 6, 0, 1], ['Africa/Cairo', 4, 24, 0, 1],
        [LA, 3, 8, 2, 3], [LONDON, 3, 29, 1, 2], ['Atlantic/Azores', 3, 29, 0, 1],
      ];
      for (const [zone, month, day, from, to] of gaps) {
        for (const minute of [0, 1, 30, 59]) {
          const at = instantFromZoned({ year: 2026, month, day, hour: from, minute }, zone);
          const p = zonedParts(at, zone);
          expect([p.day, p.hour, p.minute], `${zone} ${from}:${minute}`).toEqual([day, to, 0]);
          // The first instant after the gap: a minute before it is before the gap.
          expect(zonedParts(at - MS_MINUTE, zone).hour, `${zone} ${from}:${minute}`).not.toBe(to);
        }
      }
    });

    it('resolves a fall-back overlap to the first occurrence', () => {
      // 1 November 2026, 1:30 AM happens twice in Los Angeles.
      const ambiguous = instantFromZoned({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, LA);
      const parts = zonedParts(ambiguous, LA);
      expect(parts.hour).toBe(1);
      expect(parts.minute).toBe(30);
      // The earlier reading is the one still on daylight time.
      expect(zoneOffsetMs(ambiguous, LA)).toBe(-7 * MS_HOUR);
    });

    it('keeps the wall time when adding a day across a transition', () => {
      const before = instantFromZoned({ year: 2026, month: 3, day: 7, hour: 9, minute: 0 }, LA);
      const after = addDays(before, 1, LA);
      const parts = zonedParts(after, LA);
      expect([parts.day, parts.hour]).toEqual([8, 9]);
      // The elapsed time really is 23 hours, which is the point.
      expect(after - before).toBe(23 * MS_HOUR);
    });

    it('gives a 25-hour day when the clocks go back', () => {
      const before = instantFromZoned({ year: 2026, month: 10, day: 31, hour: 9, minute: 0 }, LA);
      const after = addDays(before, 1, LA);
      expect(after - before).toBe(25 * MS_HOUR);
      expect(zonedParts(after, LA).hour).toBe(9);
    });

    it('leaves zones without daylight saving alone', () => {
      for (const zone of [PHOENIX, TOKYO]) {
        const before = instantFromZoned({ year: 2026, month: 3, day: 7, hour: 9 }, zone);
        expect(addDays(before, 1, zone) - before).toBe(24 * MS_HOUR);
      }
    });

    it('finds the start of the next day on a day that began at one', () => {
      // Havana goes from 23:59:59 on 7 March 2026 straight to 01:00 on the 8th,
      // so the 8th began at one and the 9th begins at midnight. Adding a day to
      // the start of the 8th kept the one o'clock.
      const HAVANA = 'America/Havana';
      const eighth = instantFromZoned({ year: 2026, month: 3, day: 8, hour: 15 }, HAVANA);
      expect(zonedParts(startOfDay(eighth, HAVANA), HAVANA).hour).toBe(1);
      const ninth = startOfNextDay(eighth, HAVANA);
      expect([zonedParts(ninth, HAVANA).day, zonedParts(ninth, HAVANA).hour]).toEqual([9, 0]);
      // The day before the jump runs into the eighth at its first instant, one.
      const seventh = instantFromZoned({ year: 2026, month: 3, day: 7, hour: 15 }, HAVANA);
      expect(startOfNextDay(seventh, HAVANA)).toBe(startOfDay(eighth, HAVANA));
      // And the eighth ends where the ninth begins.
      expect(endOfDay(eighth, HAVANA)).toBe(ninth - 1);
    });

    it('finds the start of the next day as a day added to today’s start did, wherever today began at midnight', () => {
      // Every day of 2026 in zones that skip midnight, go back over it, or
      // change their clocks at another hour, and three that never change them.
      const zones = [
        'America/Havana', 'Asia/Beirut', 'America/Santiago', 'Africa/Cairo', 'Atlantic/Azores',
        LA, LONDON, SYDNEY, 'Australia/Lord_Howe', PHOENIX, TOKYO, 'Atlantic/Reykjavik',
      ];
      let differ = 0;
      for (const zone of zones) {
        for (let d = 0; d < 365; d++) {
          const date = new Date(Date.UTC(2026, 0, 1 + d));
          const noon = instantFromZoned(
            { year: 2026, month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: 12 }, zone,
          );
          const start = startOfDay(noon, zone);
          const next = startOfNextDay(noon, zone);
          expect(zonedParts(next, zone).day, `${zone} ${dateKey(noon, zone)}`).toBe(zonedParts(addDays(noon, 1, zone), zone).day);
          expect(next, `${zone} ${dateKey(noon, zone)}`).toBe(startOfDay(next, zone));
          // The rollover asks at the first instant of its day, which on a day
          // the clocks go back is twenty-five hours from the next.
          expect(startOfNextDay(start, zone), `${zone} ${dateKey(noon, zone)}`).toBe(next);
          if (zonedParts(start, zone).hour === 0) {
            expect(next, `${zone} ${dateKey(noon, zone)}`).toBe(addDays(start, 1, zone));
          } else {
            differ += 1;
          }
        }
      }
      // Havana on 8 March, Beirut and the Azores on 29 March, Santiago on 6
      // September and Cairo on 24 April, and on no other day here.
      expect(differ).toBe(5);
    });

    it('still resolves a date past the end of its month a minute late, as it did', () => {
      // A reading that overflows its month (31 February) fails the check above
      // the gap walk and comes back through it a minute late. The spring-forward
      // fix left that as it was; the handoff records it as open, and this holds
      // it there until it is fixed on purpose.
      for (const zone of [TOKYO, LA, 'Atlantic/Reykjavik']) {
        const overflow = instantFromZoned({ year: 2026, month: 2, day: 31 }, zone);
        expect(overflow, zone).toBe(instantFromZoned({ year: 2026, month: 3, day: 3 }, zone) + MS_MINUTE);
      }
    });

    it('finds the start of the next day after a date a zone skipped outright', () => {
      // Apia went from 23:59:59 on 29 December 2011 to midnight on the 31st.
      // The 30th resolves into the 29th, and a next day that was not later
      // re-armed the rollover at the instant it ran.
      const APIA = 'Pacific/Apia';
      for (const hour of [0, 12, 23]) {
        const at = instantFromZoned({ year: 2011, month: 12, day: 29, hour }, APIA);
        const next = startOfNextDay(at, APIA);
        expect(next, String(hour)).toBeGreaterThan(at);
        const p = zonedParts(next, APIA);
        expect([p.year, p.month, p.day, p.hour], String(hour)).toEqual([2011, 12, 31, 0]);
      }
    });

    it('handles the southern hemisphere, where transitions run the other way', () => {
      const before = instantFromZoned({ year: 2026, month: 4, day: 4, hour: 9 }, SYDNEY);
      const after = addDays(before, 1, SYDNEY);
      expect(zonedParts(after, SYDNEY).hour).toBe(9);
      expect(after - before).toBe(25 * MS_HOUR);
    });
  });

  describe('leap years', () => {
    it('knows the rule, including the century exceptions', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2100)).toBe(false);
      expect(isLeapYear(2400)).toBe(true);
    });

    it('gives February the right number of days', () => {
      expect(daysInMonth(2024, 2)).toBe(29);
      expect(daysInMonth(2025, 2)).toBe(28);
      expect(daysInMonth(2100, 2)).toBe(28);
    });

    it('clamps a 29 February anniversary in a non-leap year', () => {
      const leapDay = instantFromZoned({ year: 2024, month: 2, day: 29, hour: 12 }, LA);
      const nextYear = addYears(leapDay, 1, LA);
      const parts = zonedParts(nextYear, LA);
      expect([parts.year, parts.month, parts.day]).toEqual([2025, 2, 28]);
    });

    it('counts 366 days across a leap year', () => {
      const start = instantFromZoned({ year: 2024, month: 1, day: 1 }, LA);
      const end = instantFromZoned({ year: 2025, month: 1, day: 1 }, LA);
      expect(daysBetween(start, end, LA)).toBe(366);
    });
  });

  describe('calendar arithmetic', () => {
    it('clamps a month-end date when adding months', () => {
      const jan31 = instantFromZoned({ year: 2026, month: 1, day: 31, hour: 10 }, LA);
      expect(zonedParts(addMonths(jan31, 1, LA), LA).day).toBe(28);
      expect(zonedParts(addMonths(jan31, 3, LA), LA).day).toBe(30);
    });

    it('rolls the year over correctly in both directions', () => {
      const dec = instantFromZoned({ year: 2026, month: 12, day: 15 }, LA);
      expect(zonedParts(addMonths(dec, 1, LA), LA).year).toBe(2027);
      const jan = instantFromZoned({ year: 2026, month: 1, day: 15 }, LA);
      const back = addMonths(jan, -1, LA);
      expect([zonedParts(back, LA).year, zonedParts(back, LA).month]).toEqual([2025, 12]);
    });

    it('finds the nth weekday of a month', () => {
      // American Thanksgiving 2026: the fourth Thursday of November.
      const thanksgiving = nthWeekdayOfMonth(2026, 11, 4, 4, NY);
      const parts = zonedParts(thanksgiving, NY);
      expect([parts.month, parts.day, parts.weekday]).toEqual([11, 26, 4]);
    });

    it('finds the last weekday of a month', () => {
      const lastMonday = nthWeekdayOfMonth(2026, 5, 1, -1, NY);
      const parts = zonedParts(lastMonday, NY);
      expect(parts.weekday).toBe(1);
      expect(parts.day).toBeGreaterThan(24);
    });

    it('brackets a local day correctly', () => {
      const middle = instantFromZoned({ year: 2026, month: 6, day: 10, hour: 14, minute: 22 }, LA);
      expect(zonedParts(startOfDay(middle, LA), LA).hour).toBe(0);
      expect(sameLocalDay(startOfDay(middle, LA), endOfDay(middle, LA), LA)).toBe(true);
      expect(endOfDay(middle, LA) - startOfDay(middle, LA)).toBe(MS_DAY - 1);
    });

    it('round-trips a date key', () => {
      const instant = instantFromZoned({ year: 2026, month: 9, day: 3, hour: 17 }, LA);
      const key = dateKey(instant, LA);
      expect(key).toBe('2026-09-03');
      expect(dateKey(parseDateKey(key, LA), LA)).toBe(key);
    });
  });

  describe('age and anniversaries', () => {
    it('does not count a birthday that has not happened yet', () => {
      const born = instantFromZoned({ year: 2000, month: 12, day: 25 }, LA);
      const before = instantFromZoned({ year: 2026, month: 12, day: 24 }, LA);
      const after = instantFromZoned({ year: 2026, month: 12, day: 26 }, LA);
      expect(ageOn(born, before, LA)).toBe(25);
      expect(ageOn(born, after, LA)).toBe(26);
    });

    it('finds the next anniversary and never returns one in the past', () => {
      const from = instantFromZoned({ year: 2026, month: 6, day: 1 }, LA);
      const march = nextAnniversary(3, 15, from, LA);
      expect(zonedParts(march, LA).year).toBe(2027);
      const august = nextAnniversary(8, 20, from, LA);
      expect(zonedParts(august, LA).year).toBe(2026);
      expect(march).toBeGreaterThan(from);
      expect(august).toBeGreaterThan(from);
    });
  });

  describe('seasons', () => {
    it('flips across the equator', () => {
      const july = instantFromZoned({ year: 2026, month: 7, day: 15 }, LA);
      expect(seasonOf(july, LA, 34)).toBe('Summer');
      expect(seasonOf(july, SYDNEY, -33)).toBe('Winter');
    });
  });

  describe('presentation', () => {
    it('describes durations in units a person would use', () => {
      expect(formatDuration(30 * 1000)).toBe('less than a minute');
      expect(formatDuration(25 * MS_MINUTE)).toBe('25 minutes');
      expect(formatDuration(3 * MS_HOUR)).toBe('3 hours');
      expect(formatDuration(2 * MS_DAY)).toContain('2 day');
      expect(formatDuration(300 * MS_DAY)).toContain('months');
    });

    it('writes dates the way people read them', () => {
      const instant = instantFromZoned({ year: 2026, month: 3, day: 2 }, LA);
      expect(formatDate(instant, LA)).toBe('March 2, 2026');
    });
  });

  describe('time zone differences', () => {
    it('reports the same instant differently in different zones', () => {
      const instant = instantFromZoned({ year: 2026, month: 6, day: 15, hour: 12 }, LA);
      expect(zonedParts(instant, LA).hour).toBe(12);
      expect(zonedParts(instant, NY).hour).toBe(15);
      expect(zonedParts(instant, LONDON).hour).toBe(20);
      // Sydney is on the next calendar day.
      expect(zonedParts(instant, SYDNEY).day).toBe(16);
    });
  });
});

describe('durations round to the unit they show', () => {
  it('never prints sixty minutes or twenty-four hours', () => {
    expect(formatDuration(22 * MS_HOUR + 59.6 * MS_MINUTE)).toBe('23 hours');
    expect(formatDuration(59.6 * MS_MINUTE)).toBe('1 hour');
    expect(formatDuration(3 * MS_DAY + 23.7 * MS_HOUR)).toBe('4 days');
    expect(formatDuration(23 * MS_HOUR + 60 * MS_MINUTE)).toBe('1 day');
  });

  it('keeps the exact split when it is exact', () => {
    expect(formatDuration(2 * MS_HOUR + 5 * MS_MINUTE)).toBe('2h 5m');
    expect(formatDuration(1 * MS_DAY + 22 * MS_HOUR)).toBe('1d 22h');
    expect(formatDuration(45 * MS_MINUTE)).toBe('45 minutes');
    expect(formatDuration(MS_MINUTE)).toBe('1 minute');
    expect(formatDuration(30 * 1000)).toBe('less than a minute');
  });
});

/**
 * How old somebody is, once.
 *
 * Character creation used to work this out as `startYear - birthYear`, which
 * is right only for somebody whose birthday has already passed that year. A
 * character born in June starting a save in March was promised 25 on the
 * creation screen and handed 24 by the game. There is one definition now and
 * both callers use it; these hold that it is the right one.
 */
describe('age, from a date rather than a subtraction', () => {
  it('has not counted a birthday that has not happened yet', () => {
    const born = { year: 2001, month: 6, day: 14 };
    // The exact case that was wrong: a June birthday, a March start.
    expect(ageOnDate(born, { year: 2026, month: 3, day: 2 })).toBe(24);
    // The day before, on and after the birthday.
    expect(ageOnDate(born, { year: 2026, month: 6, day: 13 })).toBe(24);
    expect(ageOnDate(born, { year: 2026, month: 6, day: 14 })).toBe(25);
    expect(ageOnDate(born, { year: 2026, month: 6, day: 15 })).toBe(25);
    expect(ageOnDate(born, { year: 2026, month: 12, day: 31 })).toBe(25);
  });

  it('never goes negative, however the dates are given', () => {
    expect(ageOnDate({ year: 2030, month: 1, day: 1 }, { year: 2026, month: 1, day: 1 })).toBe(0);
    expect(ageOnDate({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 1 })).toBe(0);
  });

  it('agrees with the instant version the world clock uses', () => {
    const zone = 'America/Los_Angeles';
    for (const [bm, bd, sm, sd] of [[6, 14, 3, 2], [1, 1, 12, 31], [12, 31, 1, 1], [3, 2, 3, 2]]) {
      const birth = instantFromZoned({ year: 2001, month: bm!, day: bd!, hour: 9, minute: 0 }, zone);
      const at = instantFromZoned({ year: 2026, month: sm!, day: sd!, hour: 9, minute: 0 }, zone);
      expect(
        ageOn(birth, at, zone),
        `born ${bm}/${bd}, measured ${sm}/${sd}`,
      ).toBe(ageOnDate({ year: 2001, month: bm!, day: bd! }, { year: 2026, month: sm!, day: sd! }));
    }
  });

  it('is the age a new save actually gives the player', () => {
    // The screen's promise and the game's answer, from the same config.
    const config = { ...defaultConfig(), firstName: 'Age', lastName: 'Check' };
    const sim = createSave(1, 'age-agreement', config);
    const promised = ageOnDate(
      { year: config.birthYear, month: config.birthMonth, day: config.birthDay },
      { year: config.startYear, month: config.startMonth, day: config.startDay },
    );
    expect(ageOn(sim.player.birthInstant, sim.now, sim.homeZone)).toBe(promised);
  });
});
