/**
 * Brief 20's papers area, B1 for what a student's papers do to her Social Security record (the papers guide's
 * Pensions entry: "The Summer Cabaret’s stipend, with FICA withheld, is the work that earns a school life its credits"
 * and "A year as a nonresident on an F-1 earns no credit: your status is read for each year of your record"). Two lives
 * alike but for where they were born, from the same seed, each a student in good standing who joins the Summer
 * Cabaret's company on 1 April 2027 through Join The Company (`school.summer_cabaret`) and is paid its stipend each
 * Friday by the clock.
 *
 * The relevant side: the citizen's stipends have FICA withheld (Social Security's 6.2% and Medicare's 1.45% of each
 * week's $375, IRC 3101) and earn her 2027's credits, one for each $1,890 to four (SSA's 2027 figure, as
 * `SOCIAL_SECURITY.perCredit` keeps it); the British student on an F-1, a nonresident alien in her first five years, has
 * no FICA withheld (IRC 3121(b)(19)) and earns none. The no-leak side: the same company, the same Fridays and the same
 * $375 a week, before tax, for both; her work-study counts toward neither's credits (IRC 3121(b)(10)).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), at Yale in New Haven from Monday 24 August 2026,
 * played by the clock and the command the School's Summer Cabaret panel sends.
 *
 * TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves (`tend`); and the work done
 * each midnight, every open piece's every part prepared, as a player at work on it would, so each stays in good
 * standing for the company (as tests/evidence2-b06.test.ts plays the same summer).
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { yearOf } from '@/engine/systems/earnings';
import { f1Of } from '@/engine/systems/permission';
import { SOCIAL_SECURITY, socialSecurityOf } from '@/engine/systems/socialsecurity';

const NY = 'America/New_York';
const on = (year: number, month: number, day: number, hour = 12) => instantFromZoned({ year, month, day, hour, minute: 0 }, NY);
const life = (seed: string, more: Partial<NewSaveConfig> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tend(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** TEST SETUP: the work done each midnight, every open piece's every part prepared, as a player at work on it would. */
function working(sim: Simulation): Simulation {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
}
const stipends = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Yale Summer Cabaret stipend, the week');
/** Each stipend's day, its gross (what the wages line paid) and what was withheld from it. */
const paid = (sim: Simulation) => stipends(sim).map((t) => ({
  at: t.at,
  gross: -t.postings.filter((p) => sim.universe.accounts[p.accountId]?.kind === 'income').reduce((s, p) => s + p.amount, 0),
  withheld: t.postings.filter((p) => sim.universe.accounts[p.accountId]?.name === 'Tax Withheld').reduce((s, p) => s + p.amount, 0),
}));

describe('B1: a student’s papers and her Social Security record', () => {
  it('PLAYER JOURNEY: the same summer in the Summer Cabaret’s company, the same $375 each Friday, earns the citizen two credits with FICA withheld, and the F-1 student none, with no FICA withheld', () => {
    const us = working(life('b20-papers-cabaret'));
    const f1 = working(life('b20-papers-cabaret', { homeRegionId: 'uk-eng-london' }));
    expect(f1Of(f1.player)).toBeDefined();
    for (const sim of [us, f1]) {
      tend(sim, on(2027, 4, 1));
      expect(sim.player.school!.standing).toBe('good');
      expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
      tend(sim, on(2027, 9, 1));
    }
    // No leak: the same Fridays, the same $375 a week before tax, for both.
    const a = paid(us);
    const b = paid(f1);
    expect(a.length).toBeGreaterThanOrEqual(12);
    expect(b.map((x) => [x.at, x.gross])).toEqual(a.map((x) => [x.at, x.gross]));
    expect(new Set(a.map((x) => x.gross))).toEqual(new Set([375_00]));
    expect(yearOf(f1.player, 2027).acting).toBe(yearOf(us.player, 2027).acting);

    // The relevant side, at the first Friday: the citizen's $375 has FICA withheld, 7.65%, $28.69, and nothing else, her
    // year's income being under the standard deduction; the F-1 student's has none of it, only the 10% federal tax on the
    // week that the nonresident's added deduction (IRS Notice 1392) leaves, $37.50.
    expect(a[0]!.withheld).toBe(Math.round(375_00 * 0.0765));
    expect(b[0]!.withheld).toBe(37_50);
    // And the citizen's 2027 is covered and earns its credits; the F-1 student's earns none.
    const covered = yearOf(us.player, 2027).acting / 100;
    const credits = Math.min(4, Math.floor(covered / SOCIAL_SECURITY.perCredit));
    expect(credits).toBe(2);
    expect(socialSecurityOf(us.player, 'USD').credits).toBe(credits);
    expect(socialSecurityOf(f1.player, 'USD').credits).toBe(0);
    expect(socialSecurityOf(f1.player, 'USD').years.find((y) => y.year === 2027)?.covered).toBe(0);
  }, 120_000);
});
