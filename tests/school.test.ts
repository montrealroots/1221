/**
 * Drama school, where a life begins (`systems/school.ts`, `content/school.ts`),
 * against the David Geffen School of Drama's 2026–2027 figures.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import { atSchool, defaultConfig, newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { rentAt } from '@/engine/content/rents';
import { COST_2026_27, YALE_DRAMA } from '@/engine/content/school';
import { termAccount, termStart, yearOfStudy } from '@/engine/systems/school';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const life = (seed = 'school') => createSave(1, seed, { ...newLifeConfig(), firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const scholarships = (sim: ReturnType<typeof life>) => sim.universe.transactions.filter((t) => t.category === 'scholarship');

describe('a new life', () => {
  it('begins as a first-year actor in New Haven on the first day of the fall term, 24 August 2026', () => {
    const sim = life();
    const p = sim.player;
    expect(p.currentLocationId).toBe('us-ct-newhaven');
    expect(zonedParts(sim.now, sim.zone)).toMatchObject({ year: 2026, month: 8, day: 24 });
    expect(p.school).toEqual({ schoolId: 'yale-drama', classOf: 2029, termsBegun: 0 });
    expect(yearOfStudy(p)).toBe(1);
    expect(sim.universe.notifications.some((n) => n.title === 'Welcome To The Class Of 2029')).toBe(true);
    expect(sim.universe.accounts[p.primaryAccountId!]!.institution).toBe('Chase');
  });

  it('pays New Haven’s published rent, HUD’s $1,591 for a one-bedroom and 55% of it for a room', () => {
    const rent = rentAt('us-ct-newhaven', 'USD');
    expect(rent).toMatchObject({ oneBed: 1_591_00, room: 875_05, kind: 'published' });
  });

  it('is put at the school whatever town and day a draft had', () => {
    const moved = atSchool({ ...defaultConfig(), startLocationId: 'is-39-mosfellsbr', startYear: 2027, startMonth: 3, startDay: 1 });
    expect(moved).toMatchObject({ school: 'yale-drama', startLocationId: 'us-ct-newhaven', startYear: 2026, startMonth: 8, startDay: 24, livesWhereBorn: false });
    expect(atSchool({ ...defaultConfig(), homeRegionId: 'us-ct-newhaven' }).livesWhereBorn).toBe(true);
  });

  it('isn’t at school unless it begins there, in the school’s town', () => {
    expect(quickSave({}, 'no-school').player.school).toBeUndefined();
    expect(quickSave({ school: 'yale-drama', startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork' }, 'elsewhere').player.school).toBeUndefined();
  });
});

describe('the award', () => {
  it('bills tuition and the health plan, meets them, and pays the rest of the living scholarship in at nine on the first day of each term', () => {
    const account = termAccount('USD');
    expect(account.tuition).toBe(COST_2026_27.tuition / 2);
    expect(account.healthPlan).toBe(1_882_00);
    expect(account.livingScholarship).toBe(15_200_50);
    expect(account.refund).toBe(13_318_50);
    const sim = life('award');
    const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const before = current.balance;
    sim.advanceTo(at(2026, 8, 24, 9) - 60_000);
    expect(scholarships(sim)).toEqual([]);
    sim.advanceTo(at(2026, 8, 24, 9) + 60_000);
    expect(scholarships(sim).map((t) => t.postings.find((q) => q.accountId === current.id)?.amount)).toEqual([13_318_50]);
    expect(current.balance - before).toBeGreaterThanOrEqual(13_318_50 - 200_00);
    expect(sim.player.school!.termsBegun).toBe(1);
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    expect(scholarships(sim).map((t) => t.at)).toEqual([at(2026, 8, 24, 9), at(2027, 1, 4, 9)]);
    expect(yearOfStudy(sim.player)).toBe(1);
  });

  it('runs six terms, the later ones on SLATE’s estimated dates, and no more', () => {
    expect([0, 1].map((t) => termStart(t))).toEqual([
      { date: { year: 2026, month: 8, day: 24 }, estimate: false, fall: true },
      { date: { year: 2027, month: 1, day: 4 }, estimate: false, fall: false },
    ]);
    expect([2, 3, 4, 5].map((t) => termStart(t))).toEqual([
      { date: { year: 2027, month: 8, day: 23 }, estimate: true, fall: true },
      { date: { year: 2028, month: 1, day: 3 }, estimate: true, fall: false },
      { date: { year: 2028, month: 8, day: 28 }, estimate: true, fall: true },
      { date: { year: 2029, month: 1, day: 8 }, estimate: true, fall: false },
    ]);
    const sim = life('six');
    for (let term = 0; term < YALE_DRAMA.terms; term += 1) {
      const { date } = termStart(term);
      sim.advanceTo(at(date.year, date.month, date.day) + 60_000);
      expect(sim.player.school!.termsBegun).toBe(term + 1);
    }
    expect(yearOfStudy(sim.player)).toBe(3);
    expect(scholarships(sim)).toHaveLength(6);
    expect(sim.universe.scheduled.some((one) => one.kind === 'school.term' && one.status === 'pending')).toBe(false);
  });
});
