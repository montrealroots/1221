/**
 * The rest of Canada's safety net for an actor (`content/cabenefits.ts`,
 * `systems/eiself.ts`, `canadianDrugShare` in `systems/health.ts`, from
 * 2026-09-30): Ontario's Drug Benefit and Trillium, BC's Fair PharmaCare, and
 * EI's sickness benefit for a self-employed Canadian who registers.
 */
import { quickSave } from '@/engine';
import { FAIR_PHARMACARE } from '@/engine/content/cabenefits';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { yearOf } from '@/engine/systems/earnings';
import { eiOnCheck,eiRefusal,eiWeek,eiWeekly } from '@/engine/systems/eiself';
import { armHealth,rxShareOf } from '@/engine/systems/health';
import { describe,expect,it } from 'vitest';

const YEAR = 365.2425 * MS_DAY;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const aged = (sim: Simulation, years: number) => { (sim.player as { birthInstant: number }).birthInstant = sim.now - years * YEAR; };
const earned = (sim: Simulation, cad: number) => { yearOf(sim.player, new Date(sim.now).getUTCFullYear() - 1).acting = inSave(sim, cad * 100, 'CAD'); };
/** The prescription's price with no plan: an American's in Toronto. */
const price = (brand: boolean) => { const us = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'us-ny-newyork' }, 'rx-price'); return rxShareOf(us.player, brand, us.now, saveCurrency(us.universe)); };

describe('Ontario’s drug plans', () => {
  it('asks a senior the Drug Benefit’s $100 a year and then up to $6.11, or $2 on a low income', () => {
    const sim = life('ca-on-toronto', 'odb');
    aged(sim, 70);
    earned(sim, 30_000);
    const cur = saveCurrency(sim.universe);
    const p = price(true);
    const first = rxShareOf(sim.player, true, sim.now, cur);
    expect(first).toBe(Math.min(p, inSave(sim, 100_00, 'CAD')) + Math.min(Math.max(0, p - inSave(sim, 100_00, 'CAD')), inSave(sim, 6_11, 'CAD')));
    expect(rxShareOf(sim.player, true, sim.now, cur)).toBe(Math.min(p, inSave(sim, 6_11, 'CAD')));
    const low = life('ca-on-toronto', 'odb-low');
    aged(low, 70);
    earned(low, 20_000);
    expect(rxShareOf(low.player, true, low.now, cur)).toBe(Math.min(p, inSave(low, 2_00, 'CAD')));
  });

  it('asks an adult under 65 Trillium’s quarter of 4% of last year’s income, then $2, and nothing under 25', () => {
    const sim = life('ca-on-toronto', 'trillium');
    aged(sim, 40);
    earned(sim, 40_000);
    const cur = saveCurrency(sim.universe);
    const p = price(true);
    const deductible = inSave(sim, 400_00, 'CAD');
    let paid = 0;
    let n = 0;
    while (paid < deductible && n < 50) { paid += rxShareOf(sim.player, true, sim.now, cur); n += 1; }
    expect(paid).toBeLessThanOrEqual(deductible + inSave(sim, 2_00, 'CAD'));
    expect(rxShareOf(sim.player, true, sim.now, cur)).toBe(Math.min(p, inSave(sim, 2_00, 'CAD')));
    const young = life('ca-on-toronto', 'ohip-plus');
    aged(young, 20);
    expect(rxShareOf(young.player, true, young.now, cur)).toBe(0);
  });
});

describe('BC’s Fair PharmaCare', () => {
  it('asks the deductible by income, then 30%, to the family maximum', () => {
    const sim = life('ca-bc-vancouver', 'fpc');
    aged(sim, 40);
    earned(sim, 40_000);
    const row = FAIR_PHARMACARE.table.find(([from, to]) => 40_000 >= from && 40_000 <= to)!;
    const cur = saveCurrency(sim.universe);
    const p = price(true);
    const deductible = inSave(sim, row[2] * 100, 'CAD');
    const most = inSave(sim, row[3] * 100, 'CAD');
    let paid = 0;
    const each: number[] = [];
    for (let i = 0; i < 60; i += 1) { const x = rxShareOf(sim.player, true, sim.now, cur); each.push(x); paid += x; }
    expect(Math.abs(paid - most)).toBeLessThanOrEqual(2);
    expect(each.at(-1)).toBe(0);
    // Past the deductible and short of the maximum, 30% of the price.
    const after = each.find((x, i) => i > 0 && each.slice(0, i).reduce((a, y) => a + y, 0) >= deductible && x > 0 && x < p);
    if (after !== undefined) expect(Math.abs(after - Math.round(p * 0.3))).toBeLessThanOrEqual(1);
  });
});

describe('EI for a self-employed Canadian', () => {
  it('takes 1.63% of each check once registered, to $1,123.07 a year', () => {
    const sim = life('ca-on-toronto', 'ei-premium');
    expect(eiOnCheck(sim.player, 2027, 10_000_00, 'CAD')).toBe(0);
    expect(sim.execute({ kind: 'benefits.ei_register', payload: {} }).ok).toBe(true);
    expect(eiRefusal(sim.player)).toMatch(/registered/);
    expect(eiOnCheck(sim.player, 2027, 10_000_00, 'CAD')).toBe(163_00);
    expect(eiOnCheck(sim.player, 2027, 100_000_00, 'CAD')).toBe(1_123_07 - 163_00);
    expect(eiOnCheck(sim.player, 2027, 10_000_00, 'CAD')).toBe(0);
    const ny = life('us-ny-newyork', 'ei-ny');
    expect(eiRefusal(ny.player)).toMatch(/living in Canada/);
  });

  it('pays a sick week 55% of last year’s weekly earnings, to $729, after twelve months registered and one unpaid week, for 26 weeks', () => {
    const sim = life('ca-on-toronto', 'ei-sick');
    expect(sim.execute({ kind: 'benefits.ei_register', payload: {} }).ok).toBe(true);
    earned(sim, 30_000);
    expect(eiWeekly(sim, sim.player, sim.now)).toBe(0);
    sim.player.ei!.registeredAt -= 13 * 30.44 * MS_DAY;
    expect(eiWeekly(sim, sim.player, sim.now)).toBeCloseTo((0.55 * 30_000) / 52, 6);
    earned(sim, 80_000);
    expect(eiWeekly(sim, sim.player, sim.now)).toBe(729);
    earned(sim, 9_000);
    expect(eiWeekly(sim, sim.player, sim.now)).toBe(0);
    earned(sim, 30_000);
    expect(eiWeek(sim, sim.player, sim.now, true)).toBe(0);
    expect(eiWeek(sim, sim.player, sim.now + 7 * MS_DAY, true)).toBe(inSave(sim, Math.round(((0.55 * 30_000) / 52) * 100), 'CAD'));
    for (let w = 2; w <= 26; w += 1) eiWeek(sim, sim.player, sim.now + w * 7 * MS_DAY, true);
    expect(eiWeek(sim, sim.player, sim.now + 27 * 7 * MS_DAY, true)).toBe(0);
  });

  it('is paid from the health tick for a week laid up by an injury', () => {
    const sim = life('ca-on-toronto', 'ei-injury');
    expect(sim.execute({ kind: 'benefits.ei_register', payload: {} }).ok).toBe(true);
    sim.player.ei!.registeredAt -= 13 * 30.44 * MS_DAY;
    earned(sim, 30_000);
    armHealth(sim, sim.player);
    sim.player.health!.injury = { kind: 'fracture', at: sim.now, until: sim.now + 60 * MS_DAY, offWorkUntil: sim.now + 40 * MS_DAY } as never;
    sim.advanceBy(21 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'EI sickness benefit, the week')).toBe(true);
  });

  it('is paid from the health tick for a week in hospital', () => {
    const sim = life('ca-on-toronto', 'ei-hospital');
    expect(sim.execute({ kind: 'benefits.ei_register', payload: {} }).ok).toBe(true);
    sim.player.ei!.registeredAt -= 13 * 30.44 * MS_DAY;
    earned(sim, 30_000);
    armHealth(sim, sim.player);
    sim.player.health!.inHospitalUntil = sim.now + 30 * MS_DAY;
    sim.advanceBy(21 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'EI sickness benefit, the week')).toBe(true);
  });
});
