/**
 * The UK's new State Pension (`systems/statepension.ts`): a National
 * Insurance record of qualifying years, a thirty-fifth of the full rate each
 * from ten, claimed from State Pension age and paid every four weeks.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { recordWages, earningsOf } from '@/engine/systems/earnings';
import { STATE_PENSION, qualifyingYears, statePensionAge, statePensionRefusal, weeklyPension } from '@/engine/systems/statepension';

function londoner(seed: string) {
  const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', wealth: 'wealthy' }, seed);
  const cur = saveCurrency(sim.universe);
  const pounds = (x: number) => (cur === 'GBP' ? x : exchange(x, 'GBP', cur)!);
  return { sim, cur, pounds };
}

describe('the State Pension', () => {
  it('counts a year of London earnings over the Lower Earnings Limit, and a year Universal Credit credited, and not a thin year', () => {
    const { sim, cur, pounds } = londoner('sp-record');
    recordWages(sim.player, Date.UTC(2031, 6, 1), 'Europe/London', { gross: pounds(7_000_00), where: 'uk-eng-london' });
    recordWages(sim.player, Date.UTC(2032, 6, 1), 'Europe/London', { gross: pounds(3_000_00), where: 'uk-eng-london' });
    earningsOf(sim.player).ukCredited = ['2033'];
    // New York work isn't the UK's record.
    recordWages(sim.player, Date.UTC(2034, 6, 1), 'Europe/London', { gross: pounds(50_000_00), where: 'us-ny-newyork' });
    expect(qualifyingYears(sim.player, cur)).toEqual(['2031', '2033']);
  });

  it('pays a thirty-fifth of £241.30 a week for each year from ten, and nothing under ten', () => {
    const { sim, cur, pounds } = londoner('sp-rate');
    const at = Date.UTC(2080, 0, 1);
    const r = earningsOf(sim.player);
    r.ukEarned = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [String(2030 + i), pounds(10_000_00)]));
    expect(weeklyPension(sim.player, at, cur)).toBe(0);
    r.ukEarned = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(2030 + i), pounds(10_000_00)]));
    expect(weeklyPension(sim.player, at, cur)).toBe(Math.round((241_30 * 20) / 35));
    r.ukEarned = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [String(2030 + i), pounds(10_000_00)]));
    expect(weeklyPension(sim.player, at, cur)).toBe(241_30);
    expect(STATE_PENSION.yearsForFull).toBe(35);
  });

  it('is claimed from 68 for a life born after 5 April 1978, and paid every four weeks', () => {
    const { sim, cur, pounds } = londoner('sp-claim');
    const age = statePensionAge(sim.player);
    expect(new Date(age).getUTCFullYear() - new Date(sim.player.birthInstant).getUTCFullYear()).toBe(68);
    earningsOf(sim.player).ukEarned = Object.fromEntries(Array.from({ length: 35 }, (_, i) => [String(2030 + i), pounds(10_000_00)]));
    expect(statePensionRefusal(sim, sim.player)).toMatch(/State Pension age/);
    sim.universe.now = age + MS_DAY;
    expect(sim.execute({ kind: 'pension.state', payload: {} }).ok).toBe(true);
    sim.advanceBy(29 * MS_DAY);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'The State Pension, four weeks');
    expect(paid.length).toBe(1);
    const due = pounds(241_30 * 4);
    expect(paid[0]!.postings.find((p) => p.amount > 0)!.amount).toBe(cur === 'GBP' ? 965_20 : due);
  });
});
