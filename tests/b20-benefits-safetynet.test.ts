/**
 * Brief 20's benefits area, B1 and B3 for SNAP and a pension (docs/verification/audit-2026-10-21/criteria.md): SNAP reads
 * the month before's income, earned and unearned, and leaves a student's work-study out (7 CFR 273.9(c)(3)); a pension
 * reads the years worked. Each is a comparison of lives alike but for one input, from the same seed, through the commands
 * and the clock, with the input that mustn't leak asserted equal.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, a US citizen born in New
 * York, played by the clock and the commands a player sends: `school.take_shift`, `pro.accept_offer`,
 * `benefits.assistance`, `pension.social_security`. TEST SETUP (tests/fakes/b20-benefits.ts), said where it's done: the
 * graduate made through the School's own Commencement handler, the offer for Winter Ledger standing as casting's draw
 * would make it; and for the pension, which is on the owner's deferred list (no life reaches forty credits or 62),
 * a worker's years of wages written into the record and their age set, as tests/socialsecurity.test.ts sets them.
 *
 * SNAP's figures from the rule (`systems/assistance.ts`, the USDA's fiscal 2027 figures): the maximum for one, $306;
 * Connecticut's gross limit, 200% of the $1,330 poverty line a month, $2,660; the first month's payment, a week after
 * applying, without SNAP's least.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { at, graduate, offered, played, postedTo, titled } from './fakes/b20-benefits';

/** What SNAP has posted onto the EBT card, by its moment. */
const snap = (sim: Simulation) => {
  const ebt = sim.player.assistance?.ebtAccountId;
  return ebt ? postedTo(sim, /^SNAP, the month, onto the EBT card$/, ebt) : [];
};

describe('SNAP reads the month before’s income (B1, B3)', () => {
  it('COMPARISON: two graduates apply on 1 December 2026, one paid $4,456 for Winter Ledger’s November weeks: her first month, read on 8 December, is over Connecticut’s $2,660 gross limit and pays nothing, and so does January’s, on December’s $3,342; the other’s pays the full $306 each month onto the EBT card, which the day’s groceries draw on first', () => {
    const a = graduate('b20-snap-wages');
    a.must({ kind: 'pro.accept_offer', payload: { opportunityId: offered(a, 'winter-ledger', a.now).id } });
    const b = graduate('b20-snap-wages');
    played(a, at(2026, 12, 1, 9));
    played(b, at(2026, 12, 1, 9));
    expect(a.player.earnings!.kinds!['2026-11']!.wages).toBe(4 * 1_114_00);
    expect(b.player.earnings?.kinds?.['2026-11']?.wages ?? 0).toBe(0);
    for (const s of [a, b]) expect(s.must({ kind: 'benefits.assistance', payload: {} })).toEqual({ scheme: 'snap', firstPaymentAt: at(2026, 12, 1, 9) + 7 * MS_DAY });
    for (const s of [a, b]) played(s, at(2027, 1, 10, 9));
    // Her November, $4,456, and December, three paydays to 17 December, $3,342: each over $2,660.
    expect(a.player.earnings!.kinds!['2026-12']!.wages).toBe(3 * 1_114_00);
    expect(snap(a)).toEqual([]);
    expect(titled(a, 'SNAP Paid')).toEqual([]);
    expect(a.player.assistance!.months).toBe(0);
    // Hers: nothing earned, a few cents of interest unearned, under SNAP's $217 standard deduction: the maximum.
    expect(snap(b)).toEqual([[at(2026, 12, 8, 9), 306_00], [at(2027, 1, 7, 9), 306_00]]);
    // Said once and brought up to the second month, the same words unread (`notify`).
    expect(titled(b, 'SNAP Paid').map((n) => [n.at, n.body])).toEqual([[at(2027, 1, 7, 9), '$306.00 for the month.']]);
    expect(b.player.assistance!.months).toBe(2);
    // The card pays for groceries first: what it holds is less than what was put on it.
    const ebt = b.universe.accounts[b.player.assistance!.ebtAccountId!]!;
    expect(b.universe.transactions.filter((t) => t.memo === 'Groceries, on the EBT card').length).toBeGreaterThan(20);
    expect(ebt.balance).toBeLessThan(612_00);
    // Her February, on January's nothing earned, pays.
    played(a, at(2027, 2, 8, 9));
    expect(snap(a).map(([, v]) => v)).toEqual([306_00]);
  }, 120_000);

  it('COMPARISON: two first-year students apply on 2 November 2026, one of them having worked eight more four-hour shifts of work-study in September and October; SNAP leaves work-study out, so both are paid the same $306 on October’s income and on November’s', () => {
    const mk = () => createSave(1, 'b20-snap-shifts', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const a = mk();
    const b = mk();
    for (const s of [a, b]) s.advanceTo(at(2026, 9, 7, 9));
    for (let w = 0; w < 8; w += 1) {
      expect(a.execute({ kind: 'school.take_shift', payload: {} }).error).toBeUndefined();
      for (const s of [a, b]) s.advanceTo(s.now + 7 * MS_DAY);
    }
    // On 2 November both apply; October's work-study differs by the shifts done in it.
    const applied = a.now;
    const ws = (s: Simulation, m: string) => s.player.earnings!.kinds![m]!.workStudy;
    expect(ws(a, '2026-10') - ws(b, '2026-10')).toBeGreaterThan(0);
    for (const s of [a, b]) s.must({ kind: 'benefits.assistance', payload: {} });
    for (const s of [a, b]) s.advanceTo(at(2026, 12, 10, 9));
    expect(snap(a)).toEqual(snap(b));
    expect(snap(a)).toEqual([[applied + 7 * MS_DAY, 306_00], [applied + 37 * MS_DAY, 306_00]]);
  }, 120_000);
});

describe('a pension reads the years worked (B1; the rows are the owner’s deferred ones)', () => {
  /** TEST SETUP, as tests/socialsecurity.test.ts sets it: years of US wages written into the record, and 67 today. */
  function worker(seed: string, years: number): Simulation {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, seed);
    for (let i = 0; i < years; i += 1) recordWages(sim.player, Date.UTC(2030 + i, 5, 1), 'America/New_York', { gross: 50_000_00, where: 'us-ny-newyork' });
    sim.player.birthInstant = sim.now - 67.05 * 365.2425 * MS_DAY;
    return sim;
  }

  it('COMPARISON: 35 years at $50,000 claim $2,079 a month at 67, 20 years $1,507, the best 35 years’ average over 420 months through the 2026 bend points; each paid by the clock a month on and on the year’s return as Social Security; $100,000 more in the bank changes nothing', () => {
    const full = worker('b20-pension', 35);
    const part = worker('b20-pension', 20);
    const richer = worker('b20-pension', 35);
    richer.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: richer.player.primaryAccountId!, amount: 100_000_00 }, { accountId: richer.nominalAccount('income', 'Test').id, amount: -100_000_00 }] });
    // AIME $4,166 (35 years) and $2,380 (20): 90% to $1,286 and 32% above, to the dime down.
    expect(full.must({ kind: 'pension.social_security', payload: {} })).toEqual({ monthly: 2_079_00, factor: 1 });
    expect(part.must({ kind: 'pension.social_security', payload: {} })).toEqual({ monthly: 1_507_00, factor: 1 });
    expect(richer.must({ kind: 'pension.social_security', payload: {} })).toEqual({ monthly: 2_079_00, factor: 1 });
    for (const s of [full, part, richer]) s.advanceBy(32 * MS_DAY);
    const paid = (s: Simulation) => postedTo(s, /^Social Security, the month$/, s.player.primaryAccountId!).map(([, v]) => v);
    expect([paid(full), paid(part), paid(richer)]).toEqual([[2_079_00], [1_507_00], [2_079_00]]);
    const year = new Date(full.now).getUTCFullYear();
    expect([yearOf(full.player, year).socialSecurity, yearOf(part.player, year).socialSecurity]).toEqual([2_079_00, 1_507_00]);
  }, 60_000);
});
