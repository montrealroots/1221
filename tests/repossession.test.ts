/**
 * A car loan in default (`systems/repossession.ts`, docs/WORLD.md stage 3e,
 * from 2026-09-29): three payments missed and the car taken where the loan is
 * secured and the law allows, redeemed as each place's law says, or sold with
 * the shortfall owed, ended by British Columbia's seize-or-sue, or barred to
 * the car's value in Connecticut; and none in Britain, whose loan is
 * unsecured.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { valueOf, vehiclesOf, modelById } from '@/engine/systems/vehicles';
import { loanMonth, redemption, repoFees } from '@/engine/systems/repossession';
import { LOAN_LATE_ON_RECORD, REPOSSESSED_ON_RECORD } from '@/engine/content/repossession';
import { arrearsOf } from '@/engine/systems/household';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** A car bought on a loan, where one lives, with a good record. */
function financed(city: string, model: string, name: string) {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
  sim.player.credit = { ...(sim.player.credit ?? {}), score: 720 } as typeof sim.player.credit;
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 20_000_00, 'USD');
  const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId: model, financed: true, months: 60 } });
  expect(r.ok, r.error).toBe(true);
  return { sim, v: vehiclesOf(sim.player)[0]! };
}
/** No money anywhere, so the payments are missed. */
const broke = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0; };

describe('three payments missed', () => {
  it('takes a New York car after the third, sells it ten days on, and owes the shortfall past the sale', () => {
    const { sim, v } = financed('us-ny-newyork', 'us-honda-cr-v', 'repo-ny');
    broke(sim);
    sim.advanceBy(61 * MS_DAY);
    expect(v.repossessed).toBeUndefined();
    sim.advanceBy(30 * MS_DAY);
    expect(v.repossessed).toBeDefined();
    expect(v.repossessed!.saleAt - v.repossessed!.at).toBe(10 * MS_DAY);
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: v.id } }).error).toMatch(/lender has it/);
    // Redeemed only by the whole balance in New York.
    expect(redemption(sim, v)).toBe(v.loan!.owed + v.loan!.missedAmount! + repoFees(sim, v));
    const owed = v.loan!.owed;
    const value = inSave(sim, valueOf(v, v.repossessed!.saleAt), modelById(v.modelId)!.currency);
    const fees = repoFees(sim, v, v.repossessed!.saleAt);
    const arrearsBefore = arrearsOf(sim, sim.player);
    sim.advanceTo(v.repossessed!.saleAt + MS_DAY);
    expect(v.soldAt).toBeDefined();
    expect(v.loan).toBeUndefined();
    const short = Math.max(0, owed - (value - fees));
    expect(arrearsOf(sim, sim.player) - arrearsBefore).toBeGreaterThanOrEqual(short);
  });

  it('bars Connecticut’s shortfall to the car’s value, and redeems a car there by paying only what’s missed', () => {
    const { sim, v } = financed('us-ct-newhaven', 'us-toyota-camry', 'repo-ct');
    broke(sim);
    sim.advanceBy(91 * MS_DAY);
    expect(v.repossessed).toBeDefined();
    const due = redemption(sim, v)!;
    expect(due).toBe(v.loan!.missedAmount! + repoFees(sim, v));
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = due;
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.redeem', payload: { vehicleId: v.id } });
    expect(r.ok, r.error).toBe(true);
    expect(v.repossessed).toBeUndefined();
    expect(v.loan!.missed).toBe(0);
    expect(v.soldAt).toBeUndefined();
  });

  it('ends a British Columbia debt with the seizure, and seizes none once two-thirds is paid', () => {
    const { sim, v } = financed('ca-bc-vancouver', 'ca-hyundai-tucson', 'repo-bc');
    broke(sim);
    sim.advanceBy(91 * MS_DAY);
    expect(v.repossessed).toBeDefined();
    const arrearsBefore = arrearsOf(sim, sim.player);
    const missed = v.loan!.missedAmount!;
    sim.advanceTo(v.repossessed!.saleAt + MS_DAY);
    expect(v.soldAt).toBeDefined();
    // The missed payments forgiven, and no shortfall added.
    expect(arrearsBefore - arrearsOf(sim, sim.player)).toBe(Math.min(missed, arrearsBefore));
    const again = financed('ca-bc-vancouver', 'ca-hyundai-tucson', 'repo-bc-2');
    again.v.loan!.owed = Math.round(again.v.loan!.original! * 0.3);
    broke(again.sim);
    again.sim.advanceBy(91 * MS_DAY);
    expect(again.v.repossessed).toBeUndefined();
    expect(again.v.loan!.missed).toBeGreaterThanOrEqual(3);
  });

  it('takes no British car: the loan is unsecured, and its arrears run', () => {
    const { sim, v } = financed('uk-eng-london', 'gb-ford-puma', 'repo-gb');
    broke(sim);
    sim.advanceBy(121 * MS_DAY);
    expect(v.repossessed).toBeUndefined();
    expect(v.loan!.missed).toBeGreaterThanOrEqual(3);
    expect(arrearsOf(sim, sim.player)).toBeGreaterThan(0);
  });

  it('counts only payments missed running: one paid between starts the count again', () => {
    const { sim, v } = financed('us-ny-newyork', 'us-honda-cr-v', 'repo-run');
    broke(sim);
    sim.advanceBy(61 * MS_DAY);
    expect(v.loan!.missed).toBe(2);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = inSave(sim, 100_000_00, 'USD');
    sim.advanceBy(30 * MS_DAY);
    expect(v.loan!.missed).toBe(0);
    broke(sim);
    sim.advanceBy(60 * MS_DAY);
    expect(v.loan!.missed).toBe(2);
    expect(v.repossessed).toBeUndefined();
  });
});

describe('the record', () => {
  it('takes nothing for one missed payment, 70 when the next is missed too, and 100 more for the car taken', () => {
    const { sim, v } = financed('us-ny-newyork', 'us-honda-cr-v', 'repo-record');
    const record = sim.player.credit!;
    const at = () => [record.score, record.late.length] as const;
    const [start, lates] = at();
    loanMonth(sim, sim.player, v, false, v.loan!.monthly, 'CR-V');
    expect(at()).toEqual([start, lates]);
    loanMonth(sim, sim.player, v, false, v.loan!.monthly, 'CR-V');
    expect(at()).toEqual([start - LOAN_LATE_ON_RECORD, lates + 1]);
    loanMonth(sim, sim.player, v, false, v.loan!.monthly, 'CR-V');
    expect(v.repossessed).toBeDefined();
    expect(at()).toEqual([start - 2 * LOAN_LATE_ON_RECORD - REPOSSESSED_ON_RECORD, lates + 3]);
  });

  it('starts again after a payment made: one missed after it takes nothing', () => {
    const { sim, v } = financed('us-ny-newyork', 'us-honda-cr-v', 'repo-record-run');
    const record = sim.player.credit!;
    loanMonth(sim, sim.player, v, false, v.loan!.monthly, 'CR-V');
    loanMonth(sim, sim.player, v, true, v.loan!.monthly, 'CR-V');
    const start = record.score;
    loanMonth(sim, sim.player, v, false, v.loan!.monthly, 'CR-V');
    expect(record.score).toBe(start);
  });
});
