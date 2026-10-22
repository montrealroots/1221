/**
 * Brief 20's benefits area: time and obligations (docs/verification/audit-2026-10-21/criteria.md D1, "time skipping an
 * obligation" and "a save or a load dropping or replaying a consequence"; J4). A tax season, a due date, a state's letters
 * and assessment, a plan's payments, an unemployment claim's weeks and SNAP's months, each passed in one jump of months,
 * a day at a time, and across saves opened again in the middle of them: each falls due once, on its day, and is met or
 * missed as the rules say, the same whichever way the clock was moved.
 *
 * PLAYER JOURNEYS: new lives (`createSave`), Ada Cole at Yale in New Haven, played by the clock and the commands a player
 * sends. TEST SETUP (tests/fakes/b20-benefits.ts) for the claimant: the graduate made through the School's own
 * Commencement handler and the offers standing as casting's draw would make them, as tests/b20-benefits-unemployment.test.ts
 * makes her. From the moment each comparison begins the clock is moved by `advanceTo` alone, nothing tended, so the three
 * ways of moving it differ in nothing else.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig, newLifeFrom, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { at, graduate, intoTheCd, played, reload, worked } from './fakes/b20-benefits';

/** What the tax and benefits systems have done: their notices, their money, their records and what's still to come. */
function owed(sim: Simulation): string {
  const notes = sim.universe.notifications.filter((n) => n.category === 'tax' || n.category === 'benefits').map((n) => [n.title, n.at, n.body]).sort((a, b) => Number(a[1]) - Number(b[1]) || String(a[0]).localeCompare(String(b[0])));
  const money = sim.universe.transactions.filter((t) => t.category === 'tax' || t.category === 'benefit').map((t) => [t.at, t.memo, t.postings.map((p) => p.amount)]);
  const coming = sim.universe.scheduled.filter((i) => i.status === 'pending' && /^(tax|benefits)\./.test(i.kind)).map((i) => [i.kind, i.at, JSON.stringify(i.payload)]).sort();
  const p = sim.player;
  return JSON.stringify({ notes, money, coming, returns: p.returns ?? null, plan: p.taxPlan ?? null, statePlans: p.statePlans ?? null, ui: p.unemployment ?? null, snap: p.assistance ?? null });
}

/** The clock moved to `until` three ways: at once, a day at a time, and saved and opened again at each of `stops`. */
function threeWays(start: string, until: number, stops: number[]): [string, string, string] {
  const thaw = () => loadSave(JSON.parse(start) as never);
  const jumped = thaw();
  jumped.advanceTo(until);
  const stepped = thaw();
  while (stepped.now < until) stepped.advanceTo(Math.min(until, stepped.now + MS_DAY));
  let opened = thaw();
  for (const t of stops) { opened.advanceTo(t); opened = reload(opened); }
  opened.advanceTo(until);
  return [owed(jumped), owed(stepped), owed(opened)];
}

describe('time and obligations, tax (D1, J4)', () => {
  it('JOURNEY: an heir who never files, from 15 January 2027 to 1 June 2028: her 2026 return made on 1 February 2027, its late notice on 15 April, Connecticut’s letter, assessment, bill, notice of intent with its lien, and levy, her 2027 return made a year on and its late notice, and the IRS’s CP2566 on the first: the same notices, money and records whether the clock jumps the seventeen months at once, steps a day at a time, or is saved and opened again mid-season, after the due date, and at each of Connecticut’s steps', () => {
    const sim = createSave(1, 'b20-time-heir', newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'inherited', bankId: 'us-capital-one' } as Partial<NewSaveConfig>));
    sim.advanceTo(at(2027, 1, 15, 12));
    const start = JSON.stringify(sim.universe);
    const until = at(2028, 6, 1, 12);
    const [jumped, stepped, opened] = threeWays(start, until, [at(2027, 3, 1, 12), at(2027, 4, 16, 12), at(2027, 7, 20, 12), at(2027, 9, 20, 12), at(2028, 2, 2, 12)]);
    expect(stepped).toBe(jumped);
    expect(opened).toBe(jumped);
    const s = JSON.parse(jumped) as { notes: [string, number, string][]; coming: [string, number, string][] };
    const when = (title: string) => s.notes.filter((n) => n[0] === title).map((n) => n[1]);
    // Each obligation once, on its day.
    expect(when('Your 2026 Return Is Late')).toEqual([at(2027, 4, 15, 23, 59)]);
    expect(when('Your 2027 Return Is Late')).toEqual([at(2028, 4, 18, 23, 59)]);
    expect(when('Connecticut DRS Made Your Return')).toEqual([at(2027, 4, 15, 23, 59) + 92 * MS_DAY]);
    expect(when('Connecticut DRS Assessed Your 2026 Return')).toEqual([at(2027, 4, 15, 23, 59) + 152 * MS_DAY]);
    expect(when('The IRS Figured Your 2026 Return')).toEqual([at(2027, 4, 15, 23, 59) + 365 * MS_DAY]);
    expect(when('A Connecticut Tax Lien Is Filed')).toHaveLength(1);
    // One season each February: the next on the calendar once.
    expect(s.coming.filter((c) => c[0] === 'tax.season').map((c) => c[1])).toEqual([at(2029, 2, 1, 9)]);
  }, 120_000);

  it('JOURNEY: a Scraping student’s IRS plan of $23.62 a month from 1 February 2028, kept up: its four payments to June taken once each, on their days, the same jumped, stepped a day at a time, and saved and opened again the day before each', () => {
    const sim = createSave(1, 'b20-time-plan', { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2027, 2, 1, 12));
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    sim.advanceTo(at(2028, 2, 1, 12));
    // Filed with the money in a CD, then the CD broken and the plan applied for.
    intoTheCd(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2027 } });
    const cd = sim.ledger.accountsOf(sim.player.id).find((a) => a.category === 'term' && !a.closedAt)!;
    sim.must({ kind: 'bank.break_term', payload: { accountId: cd.id } });
    sim.must({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: true } });
    sim.advanceTo(sim.now + 2 * 60_000);
    const first = sim.player.taxPlan!.nextDue!;
    const start = JSON.stringify(sim.universe);
    const [jumped, stepped, opened] = threeWays(start, at(2028, 6, 2, 12), [0, 1, 2, 3].map((n) => first + n * 30 * MS_DAY - MS_DAY));
    expect(stepped).toBe(jumped);
    expect(opened).toBe(jumped);
    const s = JSON.parse(jumped) as { money: [number, string, number[]][]; plan: { status: string; history: { what: string }[] } };
    expect(s.money.filter((m) => m[1] === 'IRS payment plan').map((m) => m[0])).toEqual([0, 1, 2, 3].map((n) => first + n * 30 * MS_DAY));
    expect(s.plan.status).toBe('active');
    expect(s.plan.history.filter((h) => h.what === 'A payment')).toHaveLength(4);
  }, 120_000);
});

describe('time and obligations, benefits (D1, J4)', () => {
  it('JOURNEY: a graduate’s New York claim of $314 a week and her SNAP from 1 May 2027, run to 1 September: each Sunday certified once and each month’s SNAP once, the same jumped, stepped a day at a time, and saved and opened again mid-week and mid-month', () => {
    const sim = graduate('b20-time-claim');
    worked(sim, 'winter-ledger');
    played(sim, at(2027, 1, 4, 8));
    worked(sim, 'calder-street');
    sim.must({ kind: 'benefits.claim', payload: {} });
    sim.must({ kind: 'benefits.assistance', payload: {} });
    const start = JSON.stringify(sim.universe);
    const [jumped, stepped, opened] = threeWays(start, at(2027, 9, 1, 12), [at(2027, 5, 5, 15), at(2027, 6, 2, 3), at(2027, 7, 14, 21), at(2027, 8, 6, 11)]);
    expect(stepped).toBe(jumped);
    expect(opened).toBe(jumped);
    const s = JSON.parse(jumped) as { money: [number, string, number[]][]; ui: { claim: { paid: number } } };
    const weeks = s.money.filter((m) => m[1].startsWith('Unemployment insurance: the week to ')).map((m) => m[0]);
    // Sundays from 9 May (2 May the waiting week) to 29 August: seventeen, each once.
    expect(weeks).toEqual(Array.from({ length: 17 }, (_, n) => at(2027, 5, 9, 20) + n * 7 * MS_DAY));
    expect(s.ui.claim.paid).toBe(17 * 314_00);
    expect(new Set(s.money.filter((m) => m[1] === 'SNAP, the month, onto the EBT card').map((m) => m[0])).size).toBe(s.money.filter((m) => m[1] === 'SNAP, the month, onto the EBT card').length);
  }, 120_000);
});
