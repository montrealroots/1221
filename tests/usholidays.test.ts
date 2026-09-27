/**
 * The United States' holidays the engine reads (`content/usholidays.ts`):
 * the Federal Reserve's, for a US bank's business days, and SAG-AFTRA's, for
 * a production's shooting days.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { instantFromZoned } from '@/engine/core/time';
import { easter, sagHoliday, usBankHoliday } from '@/engine/content/usholidays';
import { beginCareer, careerOf, workDays, type Booking } from '@/engine/systems/career';

const NY = 'America/New_York';

describe('the holidays', () => {
  it('fall where the rules put them', () => {
    expect(easter(2026)).toBe('2026-04-05');
    expect(easter(2027)).toBe('2027-03-28');
    // Thanksgiving, both; the day after and Good Friday, SAG-AFTRA's only; Columbus and Veterans Day, the Fed's only.
    for (const d of ['2026-11-26', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19', '2026-09-07', '2026-12-25']) {
      expect(usBankHoliday(d)).toBe(true);
      expect(sagHoliday(d)).toBe(true);
    }
    expect(sagHoliday('2026-11-27')).toBe(true);
    expect(usBankHoliday('2026-11-27')).toBe(false);
    expect(sagHoliday('2026-04-03')).toBe(true);
    expect(usBankHoliday('2026-04-03')).toBe(false);
    expect(usBankHoliday('2026-10-12')).toBe(true);
    expect(sagHoliday('2026-10-12')).toBe(false);
    expect(usBankHoliday('2026-11-11')).toBe(true);
    // The Fourth on a Saturday in 2026: SAG-AFTRA takes the Friday, the Fed nothing.
    expect(sagHoliday('2026-07-03')).toBe(true);
    expect(usBankHoliday('2026-07-03')).toBe(false);
    // Christmas 2027 and New Year's 2028 on Saturdays: the Fridays before, for SAG-AFTRA.
    expect(sagHoliday('2027-12-24')).toBe(true);
    expect(sagHoliday('2027-12-31')).toBe(true);
    expect(usBankHoliday('2027-12-31')).toBe(false);
    // On a Sunday, the Monday: Juneteenth 2033 for both.
    expect(usBankHoliday('2033-06-20')).toBe(true);
    expect(sagHoliday('2033-06-20')).toBe(true);
    expect(usBankHoliday('2026-11-25')).toBe(false);
  });

  it('keep a shoot off Thanksgiving and the day after', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'thanksgiving');
    beginCareer(sim, sim.player);
    const b: Booking = { id: 'tg', roleId: 'costar', cityId: 'us-ny-newyork', starts: instantFromZoned({ year: 2026, month: 11, day: 25, hour: 8 }, NY), units: 3, rehearsalWeeks: 0, status: 'offered', dueAt: 0, offeredAt: 0, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    const days = workDays(b).map((d) => new Date(d.at).toISOString().slice(0, 10));
    expect(days).toEqual(['2026-11-25', '2026-11-30', '2026-12-01']);
  });
});
