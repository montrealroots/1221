/**
 * Universal Credit for someone living in Britain (`systems/universalcredit.ts`):
 * claimed, assessed a month at a time and paid a week after, the standard
 * allowance and the rent up to London's allowance, less 55% of earnings and
 * the tariff on savings, closed after six nil months or on leaving Britain.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { UNIVERSAL_CREDIT } from '@/engine/content/safetynet';
import { creditAward, creditRefusal } from '@/engine/systems/universalcredit';
import { rentOf } from '@/engine/systems/household';
import { careerOf, homeTownOf } from '@/engine/systems/career';

function londoner(seed: string, pounds = 1_000): Simulation {
  const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'modest' }, seed);
  const cur = saveCurrency(sim.universe);
  const accounts = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings'));
  for (const a of accounts) a.balance = 0;
  accounts.find((a) => a.kind === 'checking')!.balance = cur === 'GBP' ? pounds * 100 : exchange(pounds * 100, 'GBP', cur)!;
  return sim;
}
/** The standard allowance for their age: a life begins at 24, under the 25 the higher rate starts at. */
const standard = (sim: Simulation) => ((sim.now - sim.player.birthInstant) / (365.25 * MS_DAY) < 25 ? 338_58 : 424_90);
const gbp = (sim: Simulation, x: number) => { const cur = saveCurrency(sim.universe); return cur === 'GBP' ? x : exchange(x, cur, 'GBP')!; };

describe('Universal Credit', () => {
  it('pays the standard allowance for their age and the rent up to London’s shared-room rate, a week after the first month', () => {
    const sim = londoner('uc-basic');
    const a = sim.execute<{ firstPaymentAt: number }>({ kind: 'benefits.claim', payload: {} });
    expect(a.ok, a.error).toBe(true);
    expect(Math.round((a.value!.firstPaymentAt - sim.now) / MS_DAY)).toBeGreaterThanOrEqual(35);
    const { award } = creditAward(sim, sim.player, sim.now, sim.now + 30 * MS_DAY);
    const housing = Math.min(gbp(sim, rentOf(sim, sim.player)), Math.round(UNIVERSAL_CREDIT.lhaLondon.sharedRoom * 100));
    expect(award).toBe(standard(sim) + housing);
    sim.advanceBy(a.value!.firstPaymentAt - sim.now + MS_DAY);
    expect(sim.player.universalCredit!.paid).toBeGreaterThan(0);
    expect(sim.universe.notifications.some((n) => n.title === 'Universal Credit Paid')).toBe(true);
  }, 60_000);

  it('takes 55p of each pound earned, and £4.35 a month for each £250 of savings over £6,000', () => {
    const sim = londoner('uc-taper', 7_000);
    const from = sim.now;
    const base = creditAward(sim, sim.player, from, from + 30 * MS_DAY).award;
    // £7,000 held: £1,000 over, four steps of £250.
    const housing = Math.min(gbp(sim, rentOf(sim, sim.player)), Math.round(UNIVERSAL_CREDIT.lhaLondon.sharedRoom * 100));
    expect(base).toBe(standard(sim) + housing - 4 * 4_35);
    const cur = saveCurrency(sim.universe);
    careerOf(sim.player).days = [{ at: from + MS_DAY, hours: 8, pay: cur === 'GBP' ? 200_00 : exchange(200_00, 'GBP', cur)!, roleId: 'x' } as never];
    const worked = creditAward(sim, sim.player, from, from + 30 * MS_DAY).award;
    expect(Math.abs(base - worked - 110_00)).toBeLessThanOrEqual(2);
  });

  it('isn’t for savings over £16,000, a visa holder, or someone abroad', () => {
    const rich = londoner('uc-rich2', 20_000);
    expect(creditRefusal(rich, rich.player)).toMatch(/16,000/);
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'uc-ny');
    expect(creditRefusal(ny, ny.player)).toMatch(/living in Britain/);
  });
});

describe('going home', () => {
  it('moves a British graduate in New York home to London, on a passport, paying the flight, where Universal Credit can be claimed', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'uk-eng-london', livesWhereBorn: false, wealth: 'wealthy' }, 'go-home');
    sim.player.documents = [];
    const no = sim.execute({ kind: 'career.relocate', payload: { cityId: 'uk-eng-london', kind: 'shared' } });
    expect(no.error).toMatch(/passport/i);
    sim.player.documents.push({ id: 'pp', kind: 'passport', issuer: 'GB', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - 365 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    if (sim.player.school) sim.player.school.standing = 'graduated';
    const before = sim.universe.transactions.length;
    const a = sim.execute({ kind: 'career.relocate', payload: { cityId: 'uk-eng-london', kind: 'shared' } });
    expect(a.ok, a.error).toBe(true);
    expect(sim.player.home!.cityId).toBe('uk-eng-london');
    expect(sim.universe.transactions.slice(before).some((t) => /The flight to London/.test(t.memo))).toBe(true);
    expect(creditRefusal(sim, sim.player) ?? '').not.toMatch(/living in Britain|recourse/);
  });

  it('isn’t a move an American can make to London: the border and the right to live there refuse it', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'no-home');
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'uk-eng-london', kind: 'shared' } }).error).toMatch(/ETA|permission to live there/);
  });
});

describe('who it isn’t for', () => {
  it('gives a US citizen living in London no recourse to public funds, and no home to go back to there', () => {
    const sim = londoner('uc-visa');
    sim.player.citizenshipId = 'us';
    expect(creditRefusal(sim, sim.player)).toMatch(/recourse to public funds/);
    expect(homeTownOf(sim.player)).toBeUndefined();
    // London and, from 2026-09-29, Dublin are the business's cities, open to anyone who may live there; a home town is somewhere else.
    expect(homeTownOf(sim.player)).toBeUndefined();
    const cork = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'ie-m-cork', livesWhereBorn: false }, 'uc-cork');
    expect(homeTownOf(cork.player)).toBe('ie-m-cork');
    cork.player.citizenshipId = 'us';
    expect(homeTownOf(cork.player)).toBeUndefined();
  });
});
