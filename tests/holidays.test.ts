/**
 * The holidays a life keeps.
 *
 * Each country's file is what a calendar there would show, in its own words,
 * with the English beside it, and a state keeps its own days.
 *
 * A life is not always lived in one country's year. On the family land in
 * Iceland, working in an American business, the calendar keeps both: the
 * shops shut for Sumardagurinn fyrsti and nobody in Los Angeles picks up the
 * phone on Thanksgiving. The month grid reads every calendar the player
 * keeps, where they are standing first, and the two collapse to one in
 * America.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { addCountryHolidays, holidayLabel, holidaysInYear, holidaysOn, regionCodeFor } from '@/engine/content/holidays';
import { HOLIDAY_FILES, HOLIDAY_YEARS } from '@/engine/content/holiday-data';
import { keptCalendars, monthGrid } from '@/engine/world/calendar';
import { instantFromZoned } from '@/engine/core/time';
import { REGIONS } from '@/engine/content/geography';

const regionNamed = (countryId: string, name: string) => REGIONS.all().find((r) => r.parentId === countryId && r.name === name)!.id;

const load = (id: string) => addCountryHolidays(id, readFileSync(`public/holidays/${id}.tsv`, 'utf8'));
const on = (id: string, y: number, m: number, d: number, zone: string, regionId?: string) =>
  holidaysOn(instantFromZoned({ year: y, month: m, day: d, hour: 9 }, zone), zone, id, regionId);

describe('the holiday files', () => {
  beforeAll(() => { for (const id of ['us', 'uk', 'jp', 'fr', 'ca', 'au', 'mx']) load(id); });

  it('cover most of the world for twenty years', () => {
    expect(Object.keys(HOLIDAY_FILES).length).toBeGreaterThan(190);
    expect(HOLIDAY_YEARS[0]).toBeLessThanOrEqual(2026);
    expect(HOLIDAY_YEARS[1]).toBeGreaterThanOrEqual(2040);
    expect(holidaysInYear('us', 2040).some((h) => h.holiday.englishName === 'Thanksgiving Day')).toBe(true);
  });

  it('say the day the way the country does, with the English beside it', () => {
    const tokyo = on('jp', 2026, 1, 1, 'Asia/Tokyo');
    expect(tokyo.map((h) => h.name)).toContain('元日');
    expect(tokyo.find((h) => h.name === '元日')?.englishName).toBe("New Year's Day");
    expect(holidayLabel(tokyo.find((h) => h.name === '元日')!)).toBe("元日 (New Year's Day)");
    const paris = on('fr', 2026, 7, 14, 'Europe/Paris');
    expect(paris.some((h) => /nationale/i.test(h.name) && /Bastille/i.test(h.englishName))).toBe(true);
    expect(holidayLabel({ name: 'Boxing Day', englishName: 'Boxing Day', type: 'public' })).toBe('Boxing Day');
  });

  it('keep each country\'s own days and nobody else\'s', () => {
    expect(on('us', 2026, 11, 26, 'America/New_York').some((h) => h.name === 'Thanksgiving Day')).toBe(true);
    expect(on('uk', 2026, 11, 26, 'Europe/London')).toEqual([]);
    expect(on('uk', 2026, 12, 26, 'Europe/London').some((h) => h.name === 'Boxing Day')).toBe(true);
    expect(on('mx', 2026, 9, 16, 'America/Mexico_City').some((h) => /Independencia/i.test(h.name))).toBe(true);
    expect(on('us', 2026, 9, 16, 'America/Los_Angeles').some((h) => /Independencia/i.test(h.name))).toBe(false);
  });

  it('give a state its own days, matched by code or by name', () => {
    expect(regionCodeFor('us', 'us-ca')).toBe('CA');
    expect(regionCodeFor('ca', regionNamed('ca', 'Ontario'))).toBe('ON');
    expect(regionCodeFor('au', regionNamed('au', 'New South Wales'))).toBe('NSW');
    const sacramento = on('us', 2026, 3, 31, 'America/Los_Angeles', 'us-ca');
    expect(sacramento.some((h) => h.name === 'César Chávez Day' && h.type === 'public')).toBe(true);
    const albany = on('us', 2026, 3, 31, 'America/New_York', 'us-ny');
    expect(albany.some((h) => /Ch[aá]vez/.test(h.name))).toBe(false);
    // A day the whole country keeps is not doubled by the state.
    expect(sacramento.filter((h) => h.name === 'Presidents\' Day').length).toBeLessThanOrEqual(1);
  });

  it('shows the month grid both the calendars this life keeps', () => {
    load('is');
    const home = quickSave({}, 'holiday-grid-home');
    const march = monthGrid(home, 2026, 3);
    const dayIn = (n: number) => march.find((d) => d.inMonth && d.dayOfMonth === n)!;

    // Iceland's, because that is where the shops are.
    expect(dayIn(29).holidays.some((h) => /Palm Sunday|Pálmasunnudagur/.test(h.name))).toBe(true);
    // America's, because that is where the work is.
    expect(dayIn(17).holidays.some((h) => /Patrick/.test(h.name))).toBe(true);

    // And each day says whose it is.
    const stPatrick = dayIn(17).holidays.find((h) => /Patrick/.test(h.name))!;
    expect(stPatrick.countryId).toBe('us');
    expect(stPatrick.countryName).toBe('United States');
    const palmSunday = dayIn(29).holidays.find((h) => /Palm Sunday|Pálmasunnudagur/.test(h.name))!;
    expect(palmSunday.countryId).toBe('is');

    // The big American days are on it, which is what a calendar for this life
    // has to have and what it did not have when it read one country only.
    const november = monthGrid(home, 2026, 11);
    const thanksgiving = november.find((d) => d.inMonth && d.dayOfMonth === 26)!;
    expect(thanksgiving.holidays.some((h) => h.englishName === 'Thanksgiving Day')).toBe(true);
    const july = monthGrid(home, 2026, 7);
    expect(july.find((d) => d.inMonth && d.dayOfMonth === 4)!.holidays
      .some((h) => h.englishName === 'Independence Day')).toBe(true);
  });

  it('does not print a day twice when two calendars keep it', () => {
    load('is');
    const home = quickSave({}, 'holiday-grid-dedupe');
    const january = monthGrid(home, 2026, 1);
    const newYear = january.find((d) => d.inMonth && d.dayOfMonth === 1)!;
    const named = newYear.holidays.filter((h) => /New Year's Day/i.test(h.englishName));
    expect(named).toHaveLength(1);
    // Where you are standing wins the naming of a day both keep.
    expect(named[0]!.countryId).toBe('is');
  });

  it('keeps one calendar, not two, when the two are the same country', () => {
    const abroad = quickSave({ startLocationId: 'us-ca-losangeles' }, 'holiday-grid-abroad');
    expect(keptCalendars(abroad).map((c) => c.countryId)).toEqual(['us']);
    const american = monthGrid(abroad, 2026, 3);
    // The state's own day still lands, which the industry calendar alone
    // would not give: it carries no region.
    const day31 = american.find((d) => d.inMonth && d.dayOfMonth === 31)!;
    expect(day31.holidays.some((h) => h.name === 'César Chávez Day')).toBe(true);
    const day17 = american.find((d) => d.inMonth && d.dayOfMonth === 17)!;
    expect(day17.holidays.some((h) => /Patrick/.test(h.name) && h.type === 'observance')).toBe(true);
  });

  it('puts where you are standing before the business', () => {
    load('is');
    const home = quickSave({}, 'holiday-grid-order');
    expect(keptCalendars(home).map((c) => c.countryId)).toEqual(['is', 'us']);
  });
});
