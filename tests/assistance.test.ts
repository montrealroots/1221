/**
 * Assistance where a person lives (`systems/assistance.ts`, from
 * 2026-10-01): Ontario Works, BC Income Assistance and SNAP, each at its
 * published rates, limits and earnings rules; SNAP onto an EBT card the day's
 * groceries draw on first, and its three months in three years.
 */
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { assistanceRefusal,ebtBalance,provincialMonth,snapMonth } from '@/engine/systems/assistance';
import { buyTheDaysFood } from '@/engine/systems/spending';
import { describe,expect,it } from 'vitest';
const drain = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')) a.balance = 0; };
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('the rates', () => {
  it('pays Ontario Works’ CAD 343 and the rent to CAD 390, earnings off whole for three months and then all but CAD 200 and half the rest', () => {
    expect(provincialMonth('ontario-works', 1_200_00, 0, 0)).toBe(733_00);
    expect(provincialMonth('ontario-works', 300_00, 0, 0)).toBe(643_00);
    expect(provincialMonth('ontario-works', 1_200_00, 300_00, 0)).toBe(433_00);
    // After three months: of CAD 1,000, CAD 200 and CAD 400 kept, CAD 400 off.
    expect(provincialMonth('ontario-works', 1_200_00, 1_000_00, 3)).toBe(333_00);
    expect(provincialMonth('ontario-works', 1_200_00, 5_000_00, 3)).toBe(0);
  });

  it('pays BC’s CAD 560 and the rent to CAD 500, CAD 600 of earnings kept after the first month', () => {
    expect(provincialMonth('bc-assistance', 1_200_00, 0, 0)).toBe(1_060_00);
    expect(provincialMonth('bc-assistance', 1_200_00, 500_00, 0)).toBe(560_00);
    expect(provincialMonth('bc-assistance', 1_200_00, 500_00, 1)).toBe(1_060_00);
    expect(provincialMonth('bc-assistance', 1_200_00, 1_000_00, 1)).toBe(660_00);
  });

  it('pays SNAP’s maximum less 30% of net income, the fiscal year’s figures, and nothing once that takes it all', () => {
    const fy26 = Date.UTC(2026, 8, 15);
    const fy27 = Date.UTC(2026, 9, 15);
    expect(snapMonth(0, 0, fy26)).toBe(298_00);
    expect(snapMonth(0, 0, fy27)).toBe(306_00);
    // $1,000 earned: net $1,000 − $200 − $217 = $583; $306 − $174.90.
    expect(snapMonth(1_000_00, 1_000_00, fy27)).toBe(306_00 - 174_90);
    expect(snapMonth(2_000_00, 2_000_00, fy27)).toBe(0);
    // Under California's $2,610 gross limit but past the $1,330 net one.
    expect(snapMonth(2_500_00, 2_500_00, fy27)).toBe(0);
  });
});

describe('a claim', () => {

  it('puts a New Yorker’s SNAP on an EBT card the groceries draw on first, and pays three months in three years without 80 hours’ work', () => {
    const sim = life('us-ny-newyork', 'assist-ny');
    sim.player.birthInstant = sim.now - 30 * 365.25 * MS_DAY;
    drain(sim);
    expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).ok).toBe(true);
    sim.advanceBy(8 * MS_DAY);
    expect(ebtBalance(sim, sim.player)).toBeGreaterThan(0);
    const before = ebtBalance(sim, sim.player);
    expect(buyTheDaysFood(sim, sim.player)).toBe(true);
    expect(ebtBalance(sim, sim.player)).toBeLessThan(before);
    expect(sim.universe.transactions.some((t) => t.memo === 'Groceries, on the EBT card')).toBe(true);
    sim.advanceBy(95 * MS_DAY);
    const months = sim.universe.transactions.filter((t) => t.memo === 'SNAP, the month, onto the EBT card');
    expect(months).toHaveLength(3);
    expect(sim.universe.notifications.some((n) => n.title === 'SNAP Time Limit Reached')).toBe(true);
    // A Canadian isn't kept for SNAP.
    const other = life('us-ny-newyork', 'assist-ny-ca');
    other.player.citizenshipId = 'ca';
    expect(assistanceRefusal(other, other.player)).toMatch(/non-citizen/);
  });
});
