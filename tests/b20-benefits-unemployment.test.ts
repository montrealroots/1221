/**
 * Brief 20's benefits area (docs/verification/audit-2026-10-21/criteria.md B1, B3 and D1): unemployment insurance read
 * against the wages a played career earns, and against the weeks a claimant works.
 *
 * - The base period reads the wages the clock paid: a graduate who worked two runs in New York claims there on them; the
 *   same graduate who didn't is refused; a skilled twin who worked the same runs is paid the same, work judged better
 *   being paid the same and so claiming the same.
 * - What the clock pays reaches the return: the year's unemployment line is what the weeks posted.
 * - DEFECT, found by this audit: a week certified on a claim read only the School's work (`workDoneIn`, its work-study
 *   shifts and the Summer Cabaret's stipend), so a claimant who worked four shoot days in the week was paid the full
 *   benefit for it. From 2026-10-21 the career's work days count too (`careerWorkIn`, `systems/unemployment.ts`).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York,
 * played by the clock and the commands a player sends: `pro.accept_offer`, `benefits.claim`. TEST SETUP
 * (tests/fakes/b20-benefits.ts), as tests/pro-work.test.ts does it: the body kept fed, rested and awake; a graduate made
 * through the School's own Commencement handler; each offer standing for a posted role, as casting's draw would make it;
 * and, for the twin, a skilled actor's craft. Never the wages, the claim or a week's benefit, which are under test.
 *
 * Every figure is worked here from the rule (`content/safetynet.ts`, NEW_YORK_UI, read from TC408 and the Department's
 * monetary page) and written as a literal: Winter Ledger's nine weeks at LORT C's $1,114 paid in the fourth quarter of
 * 2026, $10,026; Calder Street's ten weeks at $1,051 from 9 February 2027, six paid in the first quarter, $6,306. A claim
 * filed on 28 April 2027 reads the alternate base period, the four quarters to March 2027 (the basic one's four to
 * December 2026 hold the fourth quarter alone, which isn't one and a half times itself): two quarters with wages, the
 * higher over $4,000, so the two averaged over 26, $16,332 / 52 = $314.08, to the dollar $314, for 26 weeks, $8,164.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { BENEFIT_WEEK_KIND } from '@/engine/systems/unemployment';
import { datesOf } from '@/engine/systems/projobs';
import { at, checkingOf, graduate, offered, played, postedTo, skilled, titled, worked } from './fakes/b20-benefits';

/** What the claim's weeks posted to the checking account, by the Sunday each was certified. */
const weeks = (sim: Simulation) => postedTo(sim, /^Unemployment insurance: the week to /, checkingOf(sim).id);

/** File A Claim, as Papers sends it: its refusal, or what it pays. */
const claim = (sim: Simulation) => { const r = sim.execute<{ weekly: number; maxTotal: number }>({ kind: 'benefits.claim', payload: {} }); return { error: r.error, value: r.value }; };

/** Two runs in New York, Winter Ledger in the fall and Calder Street from February, then the claim filed. */
function twoRuns(seed: string, twin?: (sim: Simulation) => void): Simulation {
  const sim = graduate(seed);
  twin?.(sim);
  worked(sim, 'winter-ledger');
  played(sim, at(2027, 1, 4, 8));
  worked(sim, 'calder-street');
  return sim;
}

describe('unemployment insurance reads the base period the clock paid (B1, B3)', () => {
  it('COMPARISON: two runs in New York paid by the clock make a New York claim of $314 a week for 26 weeks; the same graduate without them is refused in Connecticut’s words; a skilled twin who worked the same runs claims the same $314', () => {
    const a = twoRuns('b20-ui-runs');
    expect(a.player.earnings!.quarters).toEqual({ '2026-4': { wages: 10_026_00, byState: { 'us-ny': 10_026_00 } }, '2027-1': { wages: 6_306_00, byState: { 'us-ny': 6_306_00 } }, '2027-2': { wages: 4_204_00, byState: { 'us-ny': 4_204_00 } } });
    expect(a.now).toBe(at(2027, 4, 28, 22, 30));
    expect(claim(a)).toEqual({ error: undefined, value: { weekly: 314_00, maxTotal: 8_164_00 } });
    expect(a.player.unemployment!.claim).toMatchObject({ state: 'ny', weekly: 314_00, maxTotal: 8_164_00, basePeriod: ['2026-2', '2026-3', '2026-4', '2027-1'], waited: false });

    // The same graduate on the same day, who took neither run: nothing in any quarter, so the claim goes to where she
    // lives, and Connecticut's test refuses it.
    const b = graduate('b20-ui-runs');
    played(b, a.now);
    expect(b.player.earnings?.quarters ?? {}).toEqual({});
    expect(b.execute({ kind: 'benefits.claim', payload: {} }).error).toBe('Connecticut asks for base-period wages of 40 times the weekly benefit: $1,800.00 for $45.00. Your base period’s quarters paid $0.00, $0.00, $0.00, $0.00.');
    expect(b.player.unemployment?.claim).toBeUndefined();

    // The input that mustn't leak: the same runs worked by a skilled actor, judged better, pay the same and claim the same.
    const c = twoRuns('b20-ui-runs', skilled);
    expect(c.player.earnings!.quarters).toEqual(a.player.earnings!.quarters);
    expect(claim(c)).toEqual({ error: undefined, value: { weekly: 314_00, maxTotal: 8_164_00 } });
  }, 120_000);

  it('PLAYER JOURNEY: the claim’s first Sunday is New York’s unpaid waiting week, each Sunday after posts $314 to her checking account once, and the 2027 return made on 1 February 2028 reads every dollar the weeks paid as unemployment', () => {
    const sim = twoRuns('b20-ui-return');
    expect(claim(sim).error).toBeUndefined();
    played(sim, at(2027, 6, 1, 8));
    // Sundays 2, 9, 16, 23 and 30 May at eight in the evening: the first the waiting week, four paid.
    expect(titled(sim, 'Your Waiting Week').map((n) => n.at)).toEqual([at(2027, 5, 2, 20)]);
    expect(weeks(sim)).toEqual([at(2027, 5, 9, 20), at(2027, 5, 16, 20), at(2027, 5, 23, 20), at(2027, 5, 30, 20)].map((t) => [t, 314_00]));
    expect(sim.universe.scheduled.filter((i) => i.kind === BENEFIT_WEEK_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2027, 6, 6, 20)]);
    played(sim, at(2028, 2, 1, 12));
    // Twenty-six weeks paid, $8,164, the claim ended at its most, and all of it in 2027.
    expect(weeks(sim)).toHaveLength(26);
    expect(sim.player.unemployment!.past.map((c) => c.paid)).toEqual([8_164_00]);
    expect(titled(sim, 'Your Unemployment Claim Ended').map((n) => n.body)).toEqual(['The claim has paid all it can: $8,164.00.']);
    const r = sim.player.returns!['2027']!;
    expect(r.figures.unemployment).toBe(8_164_00);
    expect(r.figures.income).toBe(r.figures.acting + 8_164_00 + (r.figures.interest ?? 0) + (r.figures.scholarship ?? 0));
  }, 120_000);
});

describe('a week worked while on a claim (D1)', () => {
  it('DEFECT: four shoot days of Route Nine in the week to Sunday 13 June 2027, 32 hours, pay nothing that week, New York paying no week of over 30 hours; two days of Eastview the week to 20 June, 16 hours, pay three quarters, $235.50; until 2026-10-21 both paid the full $314, the week reading the School’s work alone', () => {
    const sim = twoRuns('b20-ui-worked');
    expect(claim(sim).error).toBeUndefined();
    played(sim, at(2027, 5, 3, 8));
    // Both offers taken now, through the command, their days worked by the clock as it moves on.
    const route = offered(sim, 'route-nine', sim.now);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: route.id } });
    expect(datesOf(route).map((d) => d.from)).toEqual([at(2027, 6, 7, 7), at(2027, 6, 8, 7), at(2027, 6, 9, 7), at(2027, 6, 10, 7)]);
    const east = offered(sim, 'eastview', sim.now + 7 * MS_DAY);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: east.id } });
    expect(datesOf(east).map((d) => d.from)).toEqual([at(2027, 6, 14, 7), at(2027, 6, 15, 7)]);
    played(sim, at(2027, 7, 1, 8));
    // The week of the four shoot days, to Sunday 13 June, posts nothing, and the claim's next Sunday goes on the calendar.
    expect(weeks(sim).filter(([t]) => t >= at(2027, 6, 1))).toEqual([[at(2027, 6, 6, 20), 314_00], [at(2027, 6, 20, 20), 235_50], [at(2027, 6, 27, 20), 314_00]]);
    // Six full weeks from 9 May and the three-quarter week: what the claim has paid, and what's left of its $8,164.
    expect(sim.player.unemployment!.claim!.paid).toBe(6 * 314_00 + 235_50);
    expect(sim.universe.scheduled.filter((i) => i.kind === BENEFIT_WEEK_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2027, 7, 4, 20)]);
  }, 120_000);
});
