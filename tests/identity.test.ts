/**
 * Proving who one is at an American airport (`systems/identity.ts`, from
 * 2026-09-30): the TSA's REAL ID or a passport, ConfirmID's $45 for ten days
 * without either, the state ID card, Connecticut's upgrade, and a license
 * issued or renewed as REAL ID.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { idCardRefusal, throughTsa, tsaAccepts } from '@/engine/systems/identity';
import { journeysOf } from '@/engine/systems/journey';
import { realIdShare } from '@/engine/content/identity';

const YEAR = 365.25 * MS_DAY;
const inSave = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
function life(town: string, seed: string, docs: Partial<PersonDocument>[]): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = docs.map((d, i) => ({ id: `d${i}`, kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: `N${i}`, status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 5 * YEAR, ...d }) as PersonDocument);
  return sim;
}
function weekday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
}
const confirmIds = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'TSA ConfirmID, no REAL ID or passport').length;
const fly = (sim: Simulation, to: string, after: number) => {
  const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: to, day: weekday(sim, after), slot: 2, nights: 2 } });
  expect(r.ok, r.error).toBe(true);
  const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
  sim.advanceTo(j.arriveAt + 3 * MS_DAY);
  return j;
};

describe('the checkpoint', () => {
  it('takes a passport or an American REAL ID, and not a standard license or a foreign one', () => {
    const at = Date.UTC(2026, 9, 1);
    const sim = life('us-ny-newyork', 'id-accepts', [{ realId: false }]);
    expect(tsaAccepts(sim.player, at)).toBeUndefined();
    sim.player.documents![0]!.realId = true;
    expect(tsaAccepts(sim.player, at)).toBeDefined();
    const foreign = life('us-ny-newyork', 'id-foreign', [{ issuer: 'gb', realId: true }]);
    expect(tsaAccepts(foreign.player, at)).toBeUndefined();
    const passport = life('us-ny-newyork', 'id-passport', [{ kind: 'passport', issuer: 'GB', name: 'Passport' }]);
    expect(tsaAccepts(passport.player, at)).toBeDefined();
  });

  it('checks an airline’s flight within America, not one abroad or one of one’s own', () => {
    const leg = (mode: 'flight' | 'fly') => [{ mode, from: 'JFK', to: 'LAX', departAt: 0, arriveAt: 1, fare: 0, basis: '' }];
    expect(throughTsa({ fromCity: 'us-ny-newyork', toCity: 'us-ca-losangeles', legs: leg('flight') })).toBe(true);
    expect(throughTsa({ fromCity: 'us-ny-newyork', toCity: 'uk-eng-london', legs: leg('flight') })).toBe(false);
    expect(throughTsa({ fromCity: 'us-ny-newyork', toCity: 'us-ca-losangeles', legs: leg('fly') })).toBe(false);
  });

  it('charges ConfirmID’s $45 without either, once for ten days, and not with a REAL ID', () => {
    const sim = life('us-ny-newyork', 'id-confirm', [{ realId: false }]);
    fly(sim, 'us-ca-losangeles', 7);
    expect(confirmIds(sim)).toBe(1);
    const paid = sim.universe.transactions.find((t) => t.memo === 'TSA ConfirmID, no REAL ID or passport')!;
    expect(paid.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(-inSave(sim, 45_00));
    // Home within its ten days: not again.
    fly(sim, 'us-ny-newyork', 1);
    expect(confirmIds(sim)).toBe(1);
    const real = life('us-ny-newyork', 'id-real', [{ realId: true }]);
    fly(real, 'us-ca-losangeles', 7);
    expect(confirmIds(real)).toBe(0);
  });
});

describe('a starting license', () => {
  it('is REAL ID at its state’s published share of holders, and one without a figure at the mean', () => {
    expect(realIdShare('us-ca')).toBe(0.58);
    expect(realIdShare('us-tx')).toBeCloseTo((0.58 + 0.73 + 0.5) / 3, 9);
    // Forty Californians’ licenses: about 58% REAL ID, not all of them.
    const licenses = Array.from({ length: 40 }, (_, n) => quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true }, `real-${n}`)).flatMap((sim) => documentsOf(sim.player).filter((d) => d.kind === 'license'));
    const share = licenses.filter((d) => d.realId).length / licenses.length;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.8);
  });
});

describe('the cards', () => {
  it('issues New York’s non-driver ID for $14, REAL ID, to someone the state hasn’t licensed', () => {
    const sim = life('us-ny-newyork', 'id-card', []);
    const r = sim.execute<{ fee: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.fee).toBe(inSave(sim, 14_00));
    expect(tsaAccepts(sim.player, sim.now)!.kind).toBe('idcard');
    const licensed = life('us-ny-newyork', 'id-card-licensed', [{ realId: false }]);
    expect(idCardRefusal(licensed.player, licensed.now)).toMatch(/serves as your ID/);
  });

  it('upgrades a Connecticut license for $30, and renews any American license as REAL ID', () => {
    const ct = life('us-ct-newhaven', 'id-ct', [{ issuer: 'us-ct', realId: false }]);
    const r = ct.execute<{ fee: number }>({ kind: 'documents.real_id', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.fee).toBe(inSave(ct, 30_00));
    expect(documentsOf(ct.player)[0]!.realId).toBe(true);
    expect(ct.execute({ kind: 'documents.real_id', payload: {} }).error).toMatch(/REAL ID already/);
    // A license granted here, as one exchanged from another state is, is REAL ID.
    const moved = life('us-ny-newyork', 'id-exchange', [{ issuer: 'us-ca', realId: false }]);
    expect(moved.execute({ kind: 'documents.exchange_license', payload: {} }).ok).toBe(true);
    expect(documentsOf(moved.player).find((d) => d.issuer === 'us-ny')!.realId).toBe(true);
    const ny = life('us-ny-newyork', 'id-renew', [{ realId: false }]);
    ny.player.documents![0]!.expiresAt = ny.now + 30 * MS_DAY;
    expect(ny.execute({ kind: 'documents.real_id', payload: {} }).error).toMatch(/at the renewal/);
    expect(ny.execute({ kind: 'documents.renew_license', payload: {} }).ok).toBe(true);
    expect(tsaAccepts(ny.player, ny.now)).toBeDefined();
  });
});
