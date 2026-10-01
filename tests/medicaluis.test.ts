/**
 * California's state-funded Medi-Cal for someone without satisfactory
 * immigration status (`MEDI_CAL_UIS` in `systems/health.ts`, from later on
 * 2026-09-30): full scope kept by one enrolled before 2026, restricted scope
 * (emergencies) for a new applicant, its dental gone from July 2026, and its
 * $30 premium from July 2027.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { MEDI_CAL_UIS, armHealth, healthOf, programFor, restrictedScope, shareOf } from '@/engine/systems/health';

const usd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
const at = Date.UTC(2026, 2, 1);
/** A Mexican living in Los Angeles with nothing earned: no satisfactory status. */
function angeleno(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: false, wealth: 'inherited' } as never, seed);
  sim.player.citizenshipId = 'mx';
  return sim;
}
const enrolled = (sim: Simulation, from: number, scope?: 'state' | 'restricted') => {
  healthOf(sim.player).program = { kind: 'medicaid', state: 'ca', from, renewAt: Date.UTC(2030, 0, 1), band: 'low', ...(scope ? { scope } : {}) };
};

describe('California’s state-funded Medi-Cal', () => {
  it('gives a new applicant restricted scope from 2026, keeps full scope for one enrolled before it, and a citizen federal Medicaid', () => {
    const sim = angeleno('uis-new');
    expect(programFor(sim.player, at)?.scope).toBe('restricted');
    enrolled(sim, Date.UTC(2025, 11, 1));
    expect(programFor(sim.player, at)?.scope).toBe('state');
    // Enrolled after the freeze, restricted.
    enrolled(sim, Date.UTC(2026, 1, 1));
    expect(programFor(sim.player, at)?.scope).toBe('restricted');
    sim.player.citizenshipId = 'us';
    expect(programFor(sim.player, at)?.scope).toBeUndefined();
    expect(programFor(sim.player, at)?.kind).toBe('medicaid');
  });

  it('pays an emergency on restricted scope but not a visit, a prescription or a cleaning', () => {
    const r = angeleno('uis-scope');
    enrolled(r, at, 'restricted');
    const full = angeleno('uis-scope-full');
    enrolled(full, Date.UTC(2025, 11, 1), 'state');
    const bare = angeleno('uis-scope-none');
    expect(restrictedScope(r.player, at)).toBe(true);
    expect(shareOf(r.player, 'emergency', at)).toBe(shareOf(full.player, 'emergency', at));
    expect(shareOf(r.player, 'visit', at)).toBe(shareOf(bare.player, 'visit', at));
    expect(shareOf(r.player, 'visit', at)).toBeGreaterThan(shareOf(full.player, 'visit', at));
    expect(shareOf(r.player, 'rx-generic', at)).toBe(shareOf(bare.player, 'rx-generic', at));
    expect(shareOf(r.player, 'cleaning', at)).toBe(shareOf(bare.player, 'cleaning', at));
    expect(shareOf(r.player, 'exam', at)).toBe(shareOf(bare.player, 'exam', at));
  });

  it('ends full scope’s non-emergency dental on 1 July 2026', () => {
    const sim = angeleno('uis-dental');
    enrolled(sim, Date.UTC(2025, 11, 1), 'state');
    const bare = angeleno('uis-dental-none');
    const july = Date.UTC(2026, 6, 2);
    expect(shareOf(sim.player, 'cleaning', at)).toBeLessThan(shareOf(bare.player, 'cleaning', at));
    expect(shareOf(sim.player, 'cleaning', july)).toBe(shareOf(bare.player, 'cleaning', july));
    // An eye exam is still paid.
    expect(shareOf(sim.player, 'exam', july)).toBeLessThan(shareOf(bare.player, 'exam', july) + 1);
  });

  it('charges $30 a month from July 2027 between 19 and 59, and restricts it after three months unpaid', () => {
    const sim = angeleno('uis-premium');
    sim.player.birthInstant = Date.UTC(1995, 0, 1);
    enrolled(sim, Date.UTC(2025, 11, 1), 'state');
    armHealth(sim, sim.player);
    sim.advanceTo(MEDI_CAL_UIS.premiumFrom - 40 * 86_400_000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Medi-Cal premium')).toBe(false);
    sim.advanceTo(MEDI_CAL_UIS.premiumFrom + 70 * 86_400_000);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'Medi-Cal premium');
    expect(paid.length).toBeGreaterThanOrEqual(2);
    expect(paid[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(-usd(sim, 30_00));
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    const p = healthOf(sim.player).program!;
    p.unpaid = 0;
    for (let m = 0; m < 4 && p.scope === 'state'; m += 1) {
      // Past any overdraft too.
      for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
      sim.universe.accounts[sim.player.primaryAccountId!]!.balance = -1_000_000_00;
      sim.advanceBy(31 * 86_400_000);
    }
    expect(p.scope).toBe('restricted');
  });

  it('isn’t full scope again once lost: an enrollment ended, or restricted for its premium, stays restricted', () => {
    const sim = angeleno('uis-lost');
    healthOf(sim.player).program = { kind: 'medicaid', state: 'ca', from: Date.UTC(2025, 11, 1), until: Date.UTC(2026, 0, 15), renewAt: Date.UTC(2030, 0, 1), band: 'low' };
    expect(programFor(sim.player, at)?.scope).toBe('restricted');
    enrolled(sim, Date.UTC(2025, 11, 1), 'restricted');
    expect(programFor(sim.player, at)?.scope).toBe('restricted');
  });

  it('asks no premium at 60, and enrolls a new applicant at restricted scope', () => {
    const sim = angeleno('uis-sixty');
    sim.player.birthInstant = Date.UTC(1966, 0, 1);
    enrolled(sim, Date.UTC(2025, 11, 1), 'state');
    armHealth(sim, sim.player);
    sim.advanceTo(MEDI_CAL_UIS.premiumFrom + 70 * 86_400_000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Medi-Cal premium')).toBe(false);
    const fresh = angeleno('uis-enroll');
    const r = fresh.execute<{ kind: string }>({ kind: 'health.enroll', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(healthOf(fresh.player).program?.scope).toBe('restricted');
  });

  it('renews state-funded cover without the federal work rule, and a citizen’s at renewal as federal Medicaid', () => {
    const sim = angeleno('uis-renew');
    enrolled(sim, Date.UTC(2025, 11, 1), 'state');
    healthOf(sim.player).program!.renewAt = Date.UTC(2027, 1, 1);
    armHealth(sim, sim.player);
    sim.advanceTo(Date.UTC(2027, 2, 15));
    const p = healthOf(sim.player).program!;
    expect(p.until).toBeUndefined();
    expect(p.scope).toBe('state');
    // Naturalized, the next renewal finds federal Medicaid: the scope goes, and the work rule with it.
    sim.player.citizenshipId = 'us';
    p.renewAt = sim.now + 20 * 86_400_000;
    sim.player.career = { ...(sim.player.career ?? {}), days: Array.from({ length: 12 }, (_, i) => ({ at: sim.now - i * 2 * 86_400_000 })) } as never;
    sim.advanceBy(60 * 86_400_000);
    expect(p.scope).toBeUndefined();
  });
});
