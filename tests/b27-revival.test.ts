/**
 * Brief 27, K6 (2026-10-25): a revival's character plans, loop 41's "A later revival: requires a plausible new project
 * event → checks elapsed time, agreements, availability, and character plans → creates a new engagement rather than
 * silently restoring the old one" (`REVIVAL`). Held here: the producers' chance of wanting a character back, a recurring
 * part's above a single episode's and falling with the years off; their word following its draw; a character wanted back
 * offered the part without an audition for days in the new season, accepted into a new engagement under a new contract,
 * the old one as it was; and the falsifiability twin, the same part in another save whose draw says no, said so and never
 * posted to the actor in that season.
 *
 * PLAYER JOURNEYS: a graduate's Desk Clerk on The Calloway Files in its 2026 season, the offer accepted through the command
 * and played by the clock; then the clock, unplayed, to the network's word bringing it back in 2032 and its producers' word
 * on the character. Each save is one whose own draws give its case: The Calloway Files canceled in May 2030 and back in 2032
 * in both, the Desk Clerk wanted back in `b27-revival-7` and not in `b27-revival-a`, found by reading the draws, never forced.
 * TEST SETUP, said where it's done: the offer on the record as casting writes one, and SAG-AFTRA membership, as the
 * audience test sets it.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { addProjects, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import { SERIES, decisionAt, seasonWindow, seasonYearAt } from '@/engine/content/series';
import { REVIVAL, REVIVAL_KIND, decisionsTo, revivalCastAt, revivalChance, revivalReturns, yearsOff } from '@/engine/systems/series';
import { ensurePro, type Opportunity } from '@/engine/systems/pro';
import { eligibilityProblems, payTermsOf, postingsAt, postingTimes } from '@/engine/systems/projobs';
import { at, graduate, notices, played, student } from './fakes/career-world';
import { represent } from './fakes/b20-career';

const CALLOWAY = SERIES[0]!;
const CLERK = projectById('calloway-files')!;
const WHITLOCK = projectById('calloway-files-whitlock')!;
type Sim = ReturnType<typeof graduate>;

/** The Desk Clerk in the 2026 season, accepted and played to its end. */
function playedClerk(seed: string): { sim: Sim; old: ReturnType<typeof ensurePro>['engagements'][number] } {
  const sim = graduate(seed);
  // TEST SETUP: SAG-AFTRA membership, as tests/b27-audience.test.ts sets it.
  ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
  // TEST SETUP: an offer for the part, written as casting writes one.
  const postedAt = at(2026, 9, 7);
  const terms = payTermsOf({ projectId: CLERK.id, postedAt });
  const o: Opportunity = { id: sim.nextId('pro'), projectId: CLERK.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {}, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: CLERK.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units } };
  sim.player.pro!.opportunities.push(o);
  sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  const old = sim.player.pro!.engagements[0]!;
  played(sim, old.days.at(-1)!.to + MS_HOUR);
  expect(old.status).toBe('finished');
  return { sim, old };
}

describe('a revival’s character plans', () => {
  it('want a recurring part back more than a single episode’s, less with each year off, and their word follows the draw', () => {
    const sim = student('b27-revival-rule');
    let differs = 0;
    for (let n = 0; n < 60; n += 1) {
      const s = { ...CALLOWAY, id: `test-revival-${n}` };
      const back = decisionsTo(sim, s, 2045).find((d) => d.what === 'revived');
      if (!back) continue;
      const off = yearsOff(sim, s, back.year);
      for (const t of [CLERK, WHITLOCK] as ProjectTemplate[]) {
        const base = t.schedule.kind === 'episodes' ? REVIVAL.recurring : REVIVAL.guest;
        const chance = revivalChance(sim, s, back.year, t);
        expect(chance).toBeCloseTo(Math.max(REVIVAL.least, base - REVIVAL.perYear * Math.max(0, off - s.chance.reviveAfter)), 10);
        expect(revivalReturns(sim, s, back.year, t)).toBe(sim.rng('pro.revival', s.id, back.year, t.id).next() < chance);
      }
      expect(revivalChance(sim, s, back.year, WHITLOCK)).toBeGreaterThanOrEqual(revivalChance(sim, s, back.year, CLERK));
      if (revivalReturns(sim, s, back.year, CLERK) !== revivalReturns(sim, s, back.year, WHITLOCK)) differs += 1;
    }
    expect(differs).toBeGreaterThan(0);
    // The years off: two, the most; more, less; never under the least.
    const s = { ...CALLOWAY, id: 'test-revival-years' };
    const chanceAfter = (off: number) => Math.max(REVIVAL.least, REVIVAL.recurring - REVIVAL.perYear * Math.max(0, off - s.chance.reviveAfter));
    expect([chanceAfter(2), chanceAfter(4), chanceAfter(30)]).toEqual([REVIVAL.recurring, REVIVAL.recurring - 2 * REVIVAL.perYear, REVIVAL.least]);
    // Cast so the part's days fall in the new season's first weeks, never before the network's word.
    const serialized = { ...CALLOWAY, id: 'test-serialized', season: { from: [2, 1], to: [8, 31] }, decide: { month: 1, day: 10, hour: 12 } } as typeof CALLOWAY;
    for (const x of [CALLOWAY, serialized]) for (const y of [2032, 2035]) {
      expect(revivalCastAt(x, y)).toBeGreaterThan(decisionAt(x, y));
      expect(revivalCastAt(x, y)).toBeLessThan(seasonWindow(x, y).from);
    }
  });

  it('PLAYER JOURNEY: a character wanted back is offered the part without an audition for the new season, and accepted into a new engagement, the old one as it was', () => {
    const { sim, old } = playedClerk('b27-revival-7');
    const back = decisionsTo(sim, CALLOWAY, 2033).find((d) => d.what === 'revived')!;
    expect([back.year, yearsOff(sim, CALLOWAY, back.year), revivalReturns(sim, CALLOWAY, back.year, CLERK)]).toEqual([2032, 2, true]);
    const days = old.days.map((d) => ({ ...d }));
    sim.advanceTo(back.at + MS_HOUR);
    const castAt = revivalCastAt(CALLOWAY, back.year);
    expect(sim.universe.scheduled.some((i) => i.kind === REVIVAL_KIND && i.at === castAt && i.status === 'pending')).toBe(true);
    expect(notices(sim).some((n) => n.startsWith('The Calloway Files Is Back | ') && n.includes('Its producers will say by June 17, 2032, whether Desk Clerk comes back'))).toBe(true);
    sim.advanceTo(castAt + MS_HOUR);
    expect(old.revival).toEqual({ year: 2032, returns: true });
    const o = sim.player.pro!.opportunities.find((x) => x.projectId === CLERK.id && x.postedAt >= castAt)!;
    expect(o.status).toBe('offered');
    expect(o.direct).toEqual(expect.objectContaining({ engagementId: old.id, returning: true }));
    expect(o.direct!.words).toContain('The Calloway Files is back after two years off, and its producers want Desk Clerk back');
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
    // A new engagement, in the new season, under its own contract; the old one as it was.
    expect(id).not.toBe(old.id);
    expect(e.days.every((d) => seasonYearAt(CALLOWAY, d.from) === 2032)).toBe(true);
    expect(e.contract?.version).toBe(1);
    expect(e.contract?.series).toEqual(expect.objectContaining({ id: CALLOWAY.id, year: 2032 }));
    expect([old.status, old.days]).toEqual(['finished', days]);
  }, 300_000);

  it('PLAYER JOURNEY: the falsifiability twin, the same part in a save whose draw says no: said, and never posted to the actor in that season', () => {
    const { sim, old } = playedClerk('b27-revival-a');
    const back = decisionsTo(sim, CALLOWAY, 2033).find((d) => d.what === 'revived')!;
    expect([back.year, revivalReturns(sim, CALLOWAY, back.year, CLERK)]).toEqual([2032, false]);
    const castAt = revivalCastAt(CALLOWAY, back.year);
    sim.advanceTo(castAt + MS_HOUR);
    expect(old.revival).toEqual({ year: 2032, returns: false });
    expect(notices(sim).some((n) => n.startsWith('The Calloway Files Comes Back Without Desk Clerk | The Calloway Files is back after two years off without Desk Clerk'))).toBe(true);
    expect(sim.player.pro!.opportunities.some((x) => x.projectId === CLERK.id && x.postedAt >= castAt)).toBe(false);
    // TEST SETUP: an agent representing the actor through the season, as tests/fakes/b20-career.ts's `represent` signs one,
    // so the part, cast through agents, can reach them.
    represent(sim);
    // Every Monday of its season's casting, the part isn't posted to the actor; the same record without the producers' word
    // on the character (TEST SETUP), and it is, on some Monday, as a series' part is cast again each season.
    const mondays = postingTimes(castAt, at(2033, 3, 1));
    const posted = () => mondays.filter((m) => postingsAt(sim, sim.player, m).some((p) => p.project.id === CLERK.id)).length;
    expect(posted()).toBe(0);
    delete old.revival;
    expect(posted()).toBeGreaterThan(0);
  }, 300_000);

  it('reads a returning character’s playing ages no more: the actor plays their own character at any age', () => {
    const sim = graduate('b27-revival-ages');
    // TEST SETUP: the part as a template whose playing ages the actor is far outside, known to the session as the slate's parts are.
    addProjects([{ ...CLERK, id: 'test-revival-far', requirements: { ...CLERK.requirements, ages: [60, 70] } }]);
    const o = { id: 'test-o', projectId: 'test-revival-far', via: 'open', status: 'offered', postedAt: at(2026, 9, 7), submitBy: at(2026, 9, 14), history: [], counts: {} } as Opportunity;
    const problems = (direct?: Opportunity['direct']) => eligibilityProblems(sim.player, { ...o, ...(direct ? { direct } : {}) }, sim.now).filter((p) => p.startsWith('Casting wants actors who play'));
    expect(problems().length).toBe(1);
    expect(problems({ engagementId: 'x', words: '', returning: true })).toEqual([]);
    expect(problems({ engagementId: 'x', words: '' }).length).toBe(1);
  });
});
