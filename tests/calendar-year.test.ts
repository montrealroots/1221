/**
 * A whole leap year lived through (the owner's audit of 2026-10-06, §6):
 * New York from the first working Monday of 2028 to March 2029, across
 * February's 29th, both daylight-saving changes, every month's end and the
 * year's. Born on the 29th of February, the birthday falls on it in 2028 and
 * on the 28th in 2029 (`systems/birthdays.ts`); the rent is charged once a
 * month, never twice and never skipped; and every law of the world holds at
 * the end of each month.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { ageOn } from '@/engine/systems/mortality';

const NY = 'America/New_York';
const day = (year: number, month: number, d: number, hour = 12) => instantFromZoned({ year, month, day: d, hour }, NY);

describe('a leap year lived through', () => {
  it('keeps the birthday, the rent and every law right across February 29th, the clock changes and the year’s end', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy', startYear: 2028, startMonth: 1, startDay: 3, birthYear: 2000, birthMonth: 2, birthDay: 29 }, 'calendar-leap-year');
    const breachesAt: string[] = [];
    for (let m = 0; m < 14; m += 1) {
      const y = 2028 + Math.floor(m / 12);
      const month = (m % 12) + 1;
      const last = new Date(Date.UTC(y, month, 0)).getUTCDate();
      sim.advanceTo(day(y, month, last, 23));
      if (breaches(sim.universe).length) breachesAt.push(`${y}-${month}: ${breaches(sim.universe).map((b) => b.law).join(', ')}`);
    }
    expect(breachesAt).toEqual([]);

    // The birthday: on the 29th in the leap year, and the 28th the year after.
    const birthdays = sim.universe.scheduled.filter((s) => s.kind === 'life.birthday' && s.status !== 'pending').map((s) => { const p = zonedParts(s.at, NY); return `${p.year}-${p.month}-${p.day}`; });
    expect(birthdays).toContain('2028-2-29');
    expect(birthdays).toContain('2029-2-28');
    // The age turns on the day the birthday's kept, not a day after it (until 2026-10-06 it turned on the 1st of March).
    expect(ageOn(sim, sim.player, day(2029, 2, 28))).toBe(29);
    expect(ageOn(sim, sim.player, day(2029, 2, 27))).toBe(28);

    // The rent: once in each calendar month, none twice and none skipped.
    const rentMonths = sim.universe.transactions.filter((t) => /rent/i.test(t.memo) && t.postings.some((p) => p.accountId === sim.player.primaryAccountId && p.amount < 0)).map((t) => { const p = zonedParts(t.at, NY); return `${p.year}-${p.month}`; });
    const counts = new Map<string, number>();
    for (const m of rentMonths) counts.set(m, (counts.get(m) ?? 0) + 1);
    expect([...counts.values()].every((n) => n === 1), JSON.stringify([...counts])).toBe(true);
    for (let month = 2; month <= 12; month += 1) expect(counts.has(`2028-${month}`), `rent in 2028-${month}`).toBe(true);
  }, 600_000);

  it('keeps a London leapling’s birthday on the 1st of March, the day the law there counts it', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy', startYear: 2029, startMonth: 1, startDay: 8, birthYear: 2000, birthMonth: 2, birthDay: 29 }, 'calendar-leap-london');
    const LDN = 'Europe/London';
    sim.advanceTo(instantFromZoned({ year: 2029, month: 3, day: 3, hour: 12 }, LDN));
    const kept = sim.universe.scheduled.filter((s) => s.kind === 'life.birthday' && s.status !== 'pending').map((s) => { const p = zonedParts(s.at, LDN); return `${p.month}-${p.day}`; });
    expect(kept).toEqual(['3-1']);
    expect(ageOn(sim, sim.player, instantFromZoned({ year: 2029, month: 2, day: 28, hour: 12 }, LDN))).toBe(28);
    expect(ageOn(sim, sim.player, instantFromZoned({ year: 2029, month: 3, day: 1, hour: 12 }, LDN))).toBe(29);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});
