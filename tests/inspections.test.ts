/**
 * A car's periodic inspection (`systems/inspections.ts`, docs/WORLD.md stage
 * 7a, from 2026-09-29): each place's cycle and fee, none where the law asks
 * none, and the fee paid as the car's month comes round.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { inspectIfDue, nextInspection } from '@/engine/systems/inspections';

const YEAR = 365.2425 * MS_DAY;
const at = Date.UTC(2026, 8, 29);
const car = (jurisdiction: 'US-NY' | 'US-CT' | 'US-CA' | 'GB' | 'IE' | 'CA-ON' | 'MX-CMX', ageAtPurchase = 0, cityId = 'us-ny-newyork') => ({ id: 'car', boughtAt: at, ageAtPurchase, jurisdiction, cityId });
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

describe('when a car is inspected', () => {
  it('takes England’s first MOT on the third anniversary, then yearly; a used car’s next on its anniversary', () => {
    expect(nextInspection(car('GB'), at)).toBe(at + 3 * YEAR);
    expect(nextInspection(car('GB'), at + 3 * YEAR)).toBe(at + 4 * YEAR);
    // Five and a half years old when bought: its next is six years from registration.
    expect(nextInspection(car('GB', 5.5), at)).toBe(at + 0.5 * YEAR);
  });

  it('takes Ireland’s NCT at four years, every two to ten, then yearly', () => {
    const due = [nextInspection(car('IE'), at)!];
    for (let i = 0; i < 5; i += 1) due.push(nextInspection(car('IE'), due[due.length - 1]!)!);
    expect(due.map((d) => Math.round((d - at) / YEAR))).toEqual([4, 6, 8, 10, 11, 12]);
  });

  it('inspects New York’s cars yearly from the sale, Connecticut’s every two years from the fourth, Mexico City’s every six months, and none in Ontario or California', () => {
    expect(nextInspection(car('US-NY'), at)).toBe(at + YEAR);
    expect(nextInspection(car('US-CT'), at)).toBe(at + 4 * YEAR);
    expect(nextInspection(car('US-CT'), at + 4 * YEAR)).toBe(at + 6 * YEAR);
    expect(nextInspection(car('MX-CMX'), at)).toBe(at + 0.5 * YEAR);
    expect(nextInspection(car('CA-ON'), at)).toBeUndefined();
    expect(nextInspection(car('US-CA'), at)).toBeUndefined();
  });
});

describe('what it costs', () => {
  it('charges New York City’s $37 once it’s due, $21 outside the metropolitan area, and nothing before', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'inspect-ny');
    const v: Parameters<typeof inspectIfDue>[2] = { ...car('US-NY'), boughtAt: sim.now };
    expect(inspectIfDue(sim, sim.player, v)).toBe(false);
    sim.advanceBy(YEAR + MS_DAY);
    expect(inspectIfDue(sim, sim.player, v)).toBe(true);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'The car’s State Inspection');
    expect(paid.at(-1)!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 37_00, 'USD'));
    expect(inspectIfDue(sim, sim.player, v)).toBe(false);
    const upstate: Parameters<typeof inspectIfDue>[2] = { ...car('US-NY', 0, 'us-ny-hudson'), id: 'car2', boughtAt: sim.now - YEAR - MS_DAY };
    expect(inspectIfDue(sim, sim.player, upstate)).toBe(true);
    expect(sim.universe.transactions.filter((t) => t.memo === 'The car’s State Inspection').at(-1)!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 21_00, 'USD'));
  });

  it('pays a used car’s MOT on the car’s month once it falls due', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'inspect-gb');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 30_000_00, 'GBP');
    const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', age: 5 } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceBy(11 * 30 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'The car’s MOT')).toBe(false);
    sim.advanceBy(60 * MS_DAY);
    const mot = sim.universe.transactions.filter((t) => t.memo === 'The car’s MOT');
    expect(mot).toHaveLength(1);
    expect(mot[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 54_85, 'GBP'));
  });
});
