/**
 * Assistance where a person lives (`systems/assistance.ts`, from
 * 2026-10-01): Ontario Works, BC Income Assistance and SNAP, each at its
 * published rates, limits and earnings rules; SNAP onto an EBT card the day's
 * groceries draw on first, and its three months in three years.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { assistanceRefusal, ebtBalance, provincialMonth, snapMonth, snapShelter } from '@/engine/systems/assistance';
import { billsOf, rentOf } from '@/engine/systems/household';
import { earningsOf } from '@/engine/systems/earnings';
import { buyTheDaysFood } from '@/engine/systems/household';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
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

  it('takes off the excess shelter deduction, rent and utilities above half of what’s left, to its cap, and stops at the state’s gross limit', () => {
    const fy26 = Date.UTC(2026, 8, 15);
    const fy27 = Date.UTC(2026, 9, 15);
    // $1,000 earned, $583 left; $900 of shelter is $608.50 over half of it, under the $769 cap: net $0, the maximum.
    expect(snapMonth(1_000_00, 1_000_00, fy27, 900_00)).toBe(306_00);
    // $400 of shelter is $108.50 over half: net $474.50.
    expect(snapMonth(1_000_00, 1_000_00, fy27, 400_00)).toBe(306_00 - Math.round(474_50 * 0.3));
    // $2,000 earned: $1,383 left; $3,000 of shelter is capped at $769 ($744 in fiscal 2026).
    expect(snapMonth(2_000_00, 2_000_00, fy27, 3_000_00)).toBe(306_00 - Math.round((1_383_00 - 769_00) * 0.3));
    expect(snapMonth(2_000_00, 2_000_00, fy26, 3_000_00)).toBe(298_00 - Math.round((2_000_00 - 400_00 - 209_00 - 744_00) * 0.3));
    // New York's 150% of $1,330 is $1,995: a dollar over, nothing.
    expect(snapMonth(1_995_00, 1_995_00, fy27, 3_000_00, 'us-ny')).toBeGreaterThan(0);
    expect(snapMonth(1_996_00, 1_996_00, fy27, 3_000_00, 'us-ny')).toBe(0);
    // ,000 is past New York's limit but within California's, where 30% of net income ends it first.
    expect(snapMonth(2_000_00, 2_000_00, fy27, 3_000_00, 'us-ny')).toBe(0);
    expect(snapMonth(2_000_00, 2_000_00, fy27, 3_000_00, 'us-ca')).toBeGreaterThan(0);
  });

  it('counts the rent, and the state’s utility allowance where they pay the bills: New York City’s apart from the rest of the state', () => {
    const nyc = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'snap-shelter');
    const usd = (c: number) => { const cur = saveCurrency(nyc.universe); return cur === 'USD' ? c : exchange(c, cur, 'USD')!; };
    const rent = usd(rentOf(nyc, nyc.player));
    expect(snapShelter(nyc, nyc.player)).toBe(rent + (billsOf(nyc, nyc.player) > 0 ? 1_062_00 : 0));
    const ca = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true }, 'snap-shelter-ca');
    expect(saveCurrency(ca.universe)).toBe('USD');
    expect(snapShelter(ca, ca.player)).toBe(rentOf(ca, ca.player) + (billsOf(ca, ca.player) > 0 ? 663_00 : 0));
    // On a friend's sofa, no rent and no bills: nothing counted.
    ca.player.home = { kind: 'sofa', cityId: 'us-ca-losangeles', since: ca.now };
    expect(billsOf(ca, ca.player)).toBe(0);
    expect(snapShelter(ca, ca.player)).toBe(0);
  });

  it('pays a claim its month with the shelter deduction taken', () => {
    const sim = life('us-ny-newyork', 'assist-ny-shelter');
    expect(saveCurrency(sim.universe)).toBe('USD');
    sim.player.birthInstant = sim.now - 30 * 365.25 * MS_DAY;
    drain(sim);
    // $1,500 earned in every month around the claim.
    const months = earningsOf(sim.player).months;
    for (let d = -60; d < 60; d += 10) { const p = new Date(sim.now + d * MS_DAY); months[`${p.getUTCFullYear()}-${String(p.getUTCMonth() + 1).padStart(2, '0')}`] = 1_500_00; }
    expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).ok).toBe(true);
    sim.advanceBy(8 * MS_DAY);
    const paid = sim.universe.transactions.find((t) => t.memo === 'SNAP, the month, onto the EBT card');
    const at = paid ? sim.universe.transactions.indexOf(paid) : -1;
    expect(at).toBeGreaterThanOrEqual(0);
    const amount = paid!.postings.find((p) => p.amount > 0)!.amount;
    const without = snapMonth(1_500_00, 1_500_00, sim.now, 0, 'us-ny');
    expect(amount).toBeGreaterThan(without);
  });
});

describe('a claim', () => {
  it('refuses savings past Ontario’s limit, and pays a Torontonian with little the month’s Ontario Works four working days on', () => {
    const sim = life('ca-on-toronto', 'assist-on');
    expect(assistanceRefusal(sim, sim.player)).toMatch(/under CAD 10,000/);
    drain(sim);
    expect(assistanceRefusal(sim, sim.player)).toBeUndefined();
    const r = sim.execute<{ scheme: string; firstPaymentAt: number }>({ kind: 'benefits.assistance', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.scheme).toBe('ontario-works');
    expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).error).toMatch(/claim open/);
    sim.advanceBy(7 * MS_DAY);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'Ontario Works, the month');
    expect(paid).toHaveLength(1);
    expect(paid[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBeGreaterThanOrEqual(inSave(sim, 343_00, 'CAD'));
    // Savings past the limit, a month isn't paid; moved to New York, the claim ends.
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 20_000_00, 'CAD');
    sim.advanceBy(30 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Ontario Works, the month')).toHaveLength(1);
    drain(sim);
    sim.player.home = { ...sim.player.home!, cityId: 'us-ny-newyork' };
    sim.advanceBy(30 * MS_DAY);
    expect(sim.player.assistance!.closedAt).toBeDefined();
    expect(sim.universe.transactions.filter((t) => t.memo === 'Ontario Works, the month')).toHaveLength(1);
  });

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
