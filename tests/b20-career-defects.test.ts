/**
 * Brief 20's career defects found and repaired, each with the test that holds the repair (`docs/verification/
 * audit-2026-10-21/criteria.md` D1 and T1; the career area's report, `docs/verification/audit-2026-10-21/areas/career/
 * REPORT.md`). The reposting of a part (D4) and the agreement offered again are tests/b20-career-history.test.ts's; the
 * part's near-name (D4) is tests/pro-core.test.ts's.
 *
 * - **Equity by a contract was never billed.** The first day of work under an Equity contract made a non-member a
 *   member (`unionsFrom`, `systems/projobs.ts`), and its pay took Equity's working dues, but nothing billed its
 *   initiation fee or its basic dues: only the degree's membership said `pro.equity_joined`. A student represented while
 *   enrolled, or an actor who left the School, could work Equity contracts for years having paid Equity nothing but a
 *   share of each week's pay. Repaired: the contract's first day says it as the degree does, and the same bills follow.
 *
 * TEST SETUP, said where it's done: a first-year who withdraws through the School's own command; every ability and
 * technique at the top and the projects' genres known, so the life is cast at all; an agreement signed with the agent
 * (as tests/pro-work.test.ts's J3 has one), so a part released to agents reaches her; the seed the first of a fixed list
 * whose life is offered a stage part through him (a success-path fixture, its draws the game's).
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { PROJECTS, UNIONS } from '@/engine/content/careerwork';
import { genreState } from '@/engine/systems/engagement';
import type { Opportunity } from '@/engine/systems/pro';
import { projectOf, roundToCome } from '@/engine/systems/projobs';
import { at, eng, life, opp, played, portfolio, prepareAll, represent, setSkill, tape, toCasting, twin } from './fakes/b20-career';

/** A leaver at the top, represented, offered a stage part through him: the first of the fixed seeds whose life is. */
function offeredStage(): { sim: Simulation; o: Opportunity } {
  for (const seed of Array.from({ length: 10 }, (_, n) => `b20-equity-${n}`)) {
    const sim = life(seed);
    played(sim, at(2026, 9, 9, 10));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    setSkill(sim, 100);
    for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
    portfolio(sim);
    represent(sim);
    for (let week = 0; week < 40; week += 1) {
      const o = sim.player.pro!.opportunities.find((x) => x.via === 'agent' && projectOf(x).union === 'equity' && ['submitted', 'audition', 'callback'].includes(x.status));
      if (!o) { played(sim, sim.now + 7 * MS_DAY); continue; }
      for (let n = 0; n < 8 && o.status === 'submitted'; n += 1) played(sim, sim.now + MS_DAY);
      while (o.status === 'audition' || o.status === 'callback') {
        prepareAll(sim, { opportunityId: o.id });
        if (roundToCome(o)?.form === 'self-tape') tape(sim, o);
        toCasting(sim, o);
      }
      if (o.status === 'offered') return { sim, o };
    }
  }
  throw new Error('No seed of the list was offered a stage part through him.');
}

describe('Equity by a contract, billed as Equity by the degree is', () => {
  it('PLAYER JOURNEY: an actor who left the School, cast through her agent in an Equity part, joins Equity at its first day, and its initiation fee and dues are billed from then, once across a reload', () => {
    const { sim, o } = offeredStage();
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(sim.player.pro!.equity).toBeUndefined();
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    const first = eng(sim, id).days[0]!;
    played(sim, first.to + 60_000);
    expect(sim.player.pro!.equity).toEqual({ since: first.from, how: 'contract' });
    // Billed as the degree's membership is: three parts of the fee, the first at once, and the half-years' dues.
    const bills = sim.player.pro!.unionBills!.filter((b) => b.union === 'equity');
    expect(bills.map((b) => b.key).sort()).toEqual(['equity:initiation:1', 'equity:initiation:2', 'equity:initiation:3', expect.stringMatching(/^equity:dues:\d{4}-(05|11)$/)].sort());
    expect(bills.find((b) => b.key === 'equity:initiation:1')).toMatchObject({ amount: UNIONS.equity.down, due: first.from, settled: { how: expect.stringMatching(/^(paid|owed)$/) } });
    const told = sim.universe.notifications.filter((n) => n.title === 'Your Equity Initiation Fee');
    expect(told).toHaveLength(1);
    expect(told[0]!.body).toMatch(/^You’re a member of Actors’ Equity Association from your first day under an Equity contract, \w+ \d+, 20\d\d\. Its initiation fee is \$1,800\.00, paid within three years: \$600\.00 down is due now/);
    // Once: played on across a reload, the same bills, the fee taken once.
    const again = twin(sim);
    for (const s of [sim, again]) played(s, eng(s, id).days.at(-1)!.to + 14 * MS_DAY);
    for (const s of [sim, again]) {
      expect(s.player.pro!.unionBills!.filter((b) => b.key === 'equity:initiation:1')).toHaveLength(1);
      expect(s.universe.notifications.filter((n) => n.title === 'Your Equity Initiation Fee')).toHaveLength(1);
      expect(s.universe.transactions.filter((t) => /Actors’ Equity Association: Initiation fee, part 1/.test(t.memo))).toHaveLength(1);
    }
    expect(again.player.pro!.unionBills).toEqual(sim.player.pro!.unionBills);
    // Her pay under the contract takes Equity's working dues, as a member's does.
    const paid = eng(sim, id).pay.find((p) => p.received || p.inTrust);
    expect(paid?.received?.dues ?? paid?.inTrust?.dues).toBeGreaterThan(0);
    void opp;
  }, 300_000);
});
