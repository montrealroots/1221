/**
 * A child's school day as the parent's time (`systems/schoolrun.ts`, from
 * 2026-10-03): a primary-age child taken and fetched at the town's bell on
 * each school day of its year.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { SCHOOL_RUN_KIND, SCHOOL_RUN_MINUTES, bookSchoolRun, schoolDay } from '@/engine/systems/schoolrun';
import { childrenOf } from '@/engine/systems/children';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const day = (y: number, m: number, d: number, h = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h }, 'America/New_York');

describe('the school run', () => {
  it('runs on a school day of the town’s year: not a weekend, a break or the summer', () => {
    expect(schoolDay('us-ct-newhaven', day(2027, 3, 3))).toBe(true);
    expect(schoolDay('us-ct-newhaven', day(2027, 3, 6))).toBe(false);
    expect(schoolDay('us-ct-newhaven', day(2027, 4, 13))).toBe(false);
    expect(schoolDay('us-ct-newhaven', day(2027, 7, 14))).toBe(false);
    expect(schoolDay('us-ct-newhaven', day(2026, 12, 29))).toBe(false);
    expect(schoolDay('ca-bc-vancouver', day(2027, 3, 3))).toBe(false);
  });

  it('London, Dublin and Toronto keep their own years and bells; Vancouver none', () => {
    expect(schoolDay('uk-eng-london', day(2027, 3, 3))).toBe(true);
    expect(schoolDay('uk-eng-london', day(2027, 4, 7))).toBe(false);
    expect(schoolDay('ie-lei-dublin', day(2026, 10, 28))).toBe(false);
    expect(schoolDay('ie-lei-dublin', day(2026, 10, 21))).toBe(true);
    expect(schoolDay('ie-lei-dublin', day(2027, 6, 30))).toBe(false);
    expect(schoolDay('ca-on-toronto', day(2026, 9, 9))).toBe(true);
    expect(schoolDay('ca-on-toronto', day(2026, 9, 4))).toBe(false);
    for (const [city, zone, at] of [['uk-eng-london', 'Europe/London', ['9:0', '15:30']], ['ie-lei-dublin', 'Europe/Dublin', ['9:0', '14:40']], ['ca-on-toronto', 'America/Toronto', ['8:45', '15:20']]] as const) {
      const sim = life(city, `school-${city}`);
      const wed = instantFromZoned({ year: 2027, month: 3, day: 3, hour: 1 }, zone);
      childrenOf(sim.player).push({ id: 'k1', name: 'Sam', born: wed - 7 * 365.2425 * MS_DAY });
      expect(bookSchoolRun(sim, sim.player, wed)).toBe(2);
      const runs = sim.universe.scheduled.filter((i) => i.kind === SCHOOL_RUN_KIND && i.status === 'pending');
      expect(runs.map((r) => { const p = zonedParts(r.at, zone); return `${p.hour}:${p.minute}`; })).toEqual(at);
    }
  });

  it('books the drop-off and the fetch at New Haven’s bell for a child of primary age', () => {
    const sim = life('us-ct-newhaven', 'school-run');
    const wed = day(2027, 3, 3, 1);
    expect(bookSchoolRun(sim, sim.player, wed)).toBe(0);
    childrenOf(sim.player).push({ id: 'k1', name: 'Sam', born: wed - 7 * 365.2425 * MS_DAY });
    expect(bookSchoolRun(sim, sim.player, wed)).toBe(2);
    const runs = sim.universe.scheduled.filter((i) => i.kind === SCHOOL_RUN_KIND && i.status === 'pending');
    expect(runs.map((r) => { const p = zonedParts(r.at, 'America/New_York'); return `${p.hour}:${p.minute}`; })).toEqual(['8:20', '15:5']);
    expect(runs.every((r) => r.requiresPlayer && r.durationMinutes === SCHOOL_RUN_MINUTES)).toBe(true);
    // A teenager isn't walked to school.
    childrenOf(sim.player)[0]!.born = wed - 14 * 365.2425 * MS_DAY;
    expect(bookSchoolRun(sim, sim.player, wed + MS_DAY)).toBe(0);
  });
});
