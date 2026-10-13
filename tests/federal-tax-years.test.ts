/**
 * The federal income tax table by tax year (from 2026-10-14). Until that day `INCOME_TAX_RULES` held one US rule,
 * 2024's (10% to $11,600, $14,600 deducted), for every year from 2018; it now keeps 2024's for 2024 and before, 2025's
 * and 2026's, the last held after. Every figure here is worked by hand from the IRS's own tables, never from the
 * engine's constants:
 *
 * - 2024: Rev. Proc. 2023-34, §3.01 Table 3 and §3.15(1): 10% to $11,600, 12% to $47,150; $14,600 deducted.
 * - 2025: Rev. Proc. 2024-40, §2.01 Table 3: 10% to $11,925, 12% to $48,475; the deduction $15,750, the One Big
 *   Beautiful Bill Act's (Rev. Proc. 2025-32, §3.01, which removed 2024-40's $15,000).
 * - 2026: Rev. Proc. 2025-32, §4.01 Table 3 and §4.14(1): 10% to $12,400, 12% to $50,400; $16,100 deducted.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale from Monday 24 August
 * 2026, born in New York (the birthplace a player picks on Identity) or in London (at Yale on an F-1), played by the
 * clock (`sim.advanceTo`) through the tax season of 1 February. No played life files for 2025: a life begins in August
 * 2026, so 2025's table is checked on its own.
 *
 * TEST SETUP, said again where it's done: the day's dials each six hours (`tended`) and the coursework done each
 * midnight (`working`), so a student stays at the School; a family of no means (`family` undefined, `wealth`
 * scraping), the player's own pick on Identity, where the return needs Yale's living-expense scholarship; and in the
 * filing-threshold test, a year's further work-study recorded as more Saturdays would record it.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PREP_DIMS } from '@/engine/content/coursework';
import { computeAnnualTax, usStandardDeduction } from '@/engine/content/tax';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { figuresFor, returnsOf } from '@/engine/systems/taxreturn';
import { courseworkOf } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const at = (y: number, m: number, d: number, hh = 9) => instantFromZoned({ year: y, month: m, day: d, hour: hh }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A family of no means, which Yale's aid meets: the player's own pick on Identity. */
const onAid = { family: undefined, wealth: 'scraping' };
/** TEST SETUP: played by somebody who looks after themselves, the dials set each six hours, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** TEST SETUP: the coursework done each midnight, as tests/school.test.ts's `working` does it. */
const working = (sim: Simulation) => { sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => { for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); }); return sim; };

describe('the federal table by year', () => {
  it('a single filer’s standard deduction is the year’s: $14,600 for 2024 (and held back to 2018), $15,750 for 2025, $16,100 for 2026 and held for 2027', () => {
    expect(usStandardDeduction(Date.UTC(2018, 6, 1))).toBe(14_600_00);
    expect(usStandardDeduction(Date.UTC(2024, 11, 31))).toBe(14_600_00);
    expect(usStandardDeduction(Date.UTC(2025, 0, 1))).toBe(15_750_00);
    expect(usStandardDeduction(Date.UTC(2025, 11, 31))).toBe(15_750_00);
    expect(usStandardDeduction(Date.UTC(2026, 0, 1))).toBe(16_100_00);
    expect(usStandardDeduction(Date.UTC(2027, 6, 1))).toBe(16_100_00);
  });

  it('$50,000 of wages is taxed on each year’s own brackets and deduction', () => {
    const federal = (year: number) => computeAnnualTax(50_000_00, 'us-ny-newyork', at(year, 12, 31, 12)).federal;
    // 2024: $50,000 less $14,600 is $35,400; 10% of $11,600, $1,160.00, and 12% of the $23,800 past it, $2,856.00: $4,016.00.
    expect(federal(2024)).toBe(4_016_00);
    // 2025: less $15,750 is $34,250; 10% of $11,925, $1,192.50, and 12% of $22,325, $2,679.00: $3,871.50.
    expect(federal(2025)).toBe(3_871_50);
    // 2026: less $16,100 is $33,900; 10% of $12,400, $1,240.00, and 12% of $21,500, $2,580.00: $3,820.00.
    expect(federal(2026)).toBe(3_820_00);
    // 2027, the IRS's table not yet published: 2026's held.
    expect(federal(2027)).toBe(3_820_00);
  });
});

describe('a played student’s returns on the year’s table', () => {
  it('PLAYER JOURNEY: born in New York and on aid, her 2026 return taxes $15,670.01 under 2026’s $16,100 at nothing federal, and her 2027 return $32,336.56 at $1,700.39 on 2026’s table', () => {
    const sim = working(student('tax-before-after', onAid));
    tended(sim, at(2027, 2, 1, 10));
    const r26 = returnsOf(sim.player)['2026'];
    // Made for Connecticut's $3.35 alone: 2% of the $670.01 past its $15,000 exemption, less its credit.
    expect(r26).toBeDefined();
    // Income: $14,014.00 of taxable living-expense scholarship (the fall's $15,200.50 less the books' $1,186.50),
    // twelve Saturdays of work-study at $138, $1,656.00, and $0.01 of interest: $15,670.01.
    expect(r26!.figures.income).toBe(15_670_01);
    // 2026's deduction, $16,100, is more than all of it: nothing taxed. Until 2026-10-14 this held $107.00, on 2024's
    // table: 10% of the $1,070.01 past $14,600.
    expect(r26!.figures.federal).toBe(0);
    expect(r26!.figures.states).toEqual([{ state: 'us-ct', tax: 3_35, credit: 0 }]);
    expect(r26!.figures.balance).toBe(3_35);

    tended(sim, at(2028, 2, 1, 10));
    const r27 = returnsOf(sim.player)['2027'];
    expect(r27).toBeDefined();
    expect(r27!.figures.income).toBe(32_336_56);
    // 2027 on 2026's table, held: $32,336.56 less $16,100 is $16,236.56; 10% of $12,400, $1,240.00, and 12% of the
    // $3,836.56 past it, $460.3872, $460.39: $1,700.39. Until 2026-10-14 it was $1,896.39 on 2024's: $17,736.56 taxed,
    // $1,160.00 and 12% of $6,136.56, $736.39.
    expect(r27!.figures.federal).toBe(1_700_39);
  }, 120_000);

  it('PLAYER JOURNEY: a citizen whose 2026 income is over 2024’s $14,600 and under 2026’s $16,100, with nothing owed, has no 2026 return', () => {
    const sim = working(student('tax-threshold'));
    tended(sim, at(2026, 12, 1));
    // TEST SETUP: $13,000 more of work-study in 2026, as more Saturdays would record it, nothing withheld.
    recordWages(sim.player, at(2026, 12, 1), zone, { gross: 13_000_00, workStudy: true });
    tended(sim, at(2027, 2, 1, 10));
    const y = yearOf(sim.player, 2026);
    const income = y.workStudy + (y.acting ?? 0) + (y.interest ?? 0);
    // The year's income: the $13,000, twelve Saturdays' $1,656.00 and the banks' interest.
    expect(income).toBe(13_000_00 + 1_656_00 + (y.interest ?? 0));
    expect(income).toBeGreaterThan(14_600_00);
    expect(income).toBeLessThan(16_100_00);
    // Nothing owed either way: under 2026's deduction nothing federal; under Connecticut's $15,000 exemption nothing
    // to the state; work-study pays no FICA.
    const f = figuresFor(sim.player, 2026);
    expect(f.federal).toBe(0);
    expect(f.balance).toBe(0);
    // So no return is made. Until 2026-10-14 the threshold was 2024's $14,600, and this year had one: 10% of what
    // was over $14,600, owed.
    expect(returnsOf(sim.player)['2026']).toBeUndefined();
  }, 120_000);

  it('PLAYER JOURNEY: born in London, on an F-1, her 2026 1040-NR takes back 2026’s deduction and taxes the $1,656 of work-study at 10% from the first dollar, $165.60', () => {
    const sim = working(student('tax-before-after', { homeRegionId: 'uk-eng-london' }));
    tended(sim, at(2027, 2, 1, 10));
    const r = returnsOf(sim.player)['2026'];
    expect(r!.figures.form).toBe('1040-NR');
    // The work-study's $1,656.00; the banks' interest isn't connected with the US (IRC 871(i)).
    expect(r!.figures.income).toBe(1_656_00);
    // No standard deduction on a 1040-NR: $16,100 added back to be taken off again, all $1,656 at 10%, $165.60. Were
    // 2024's $14,600 added back against 2026's $16,100, only $156 would be taxed, $15.60.
    expect(r!.figures.federal).toBe(165_60);
  }, 120_000);
});
