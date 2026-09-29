/**
 * The acting business in Mexico City (from 2026-09-29): SLATE's estimate of
 * its rates, ANDA's tabuladores being confidential, its agencies, and ANDA's
 * dues.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { AGENCIES, MEXICO_SCALE, ROLES } from '@/engine/content/career';
import { beginCareer, offersFor, paycheck, rateOf, roleById, weekOfAuditions, workCity } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';

const MXC = 'mx-cmx-mexicocity';

function capitalino(seed: string): Simulation {
  const sim = quickSave({ startLocationId: MXC, homeRegionId: MXC, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the business in Mexico City', () => {
  it('scales the American minimum by IMSS’s average wage against SSA’s, and draws Mexico City’s parts for someone living there', () => {
    // A year at MXN 662.80 a day, in dollars, over $69,846.57.
    expect(MEXICO_SCALE).toBeCloseTo(exchange(662_80 * 365, 'MXN', 'USD')! / 69_846_57, 10);
    const tele = roleById('mx-telenovela');
    expect(Math.abs(tele.steps[0]![1] - exchange(1_283_00, 'USD', 'MXN')! * MEXICO_SCALE)).toBeLessThanOrEqual(100);
    const sim = capitalino('mx-parts');
    expect(workCity(sim.player)).toBe(MXC);
    const agency = AGENCIES.find((a) => a.id === 'shoot-management')!;
    const seen = new Set<string>();
    for (let w = 0; w < 30; w += 1) for (const a of weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, MXC, 3)) seen.add(a.roleId);
    expect(seen.size).toBeGreaterThan(1);
    for (const id of seen) expect(roleById(id).cities).toContain(MXC);
    const cur = saveCurrency(sim.universe);
    expect(rateOf(tele, Date.UTC(2026, 9, 1), MXC, cur)).toBe(cur === 'MXN' ? tele.steps[0]![1] : exchange(tele.steps[0]![1], 'MXN', cur));
    expect(ROLES.filter((r) => r.cities.includes(MXC)).every((r) => r.currency === 'MXN' && r.union === 'anda')).toBe(true);
  });

  it('brings Mexico City’s agencies to a showing there', () => {
    const sim = capitalino('mx-agents');
    const mx = new Set<string>();
    for (let i = 0; i < 40; i += 1) for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'mx')) mx.add(id);
    expect(mx.size).toBeGreaterThan(0);
    expect([...mx].every((id) => AGENCIES.find((a) => a.id === id)!.countryId === 'mx')).toBe(true);
  });

  it('takes ANDA’s 15% dues from a check, and none from a SAG-AFTRA one', () => {
    const at = Date.UTC(2026, 9, 1);
    const anda = paycheck({ scale: 10_000_00, role: roleById('mx-telenovela'), rehearsal: false, represented: false, before: 0, cityId: MXC, at, currency: 'MXN' });
    expect(anda.dues).toBe(1_500_00);
    expect(paycheck({ scale: 10_000_00, role: roleById('costar'), rehearsal: false, represented: false, before: 0, cityId: 'us-ny-newyork', at }).dues).toBe(0);
  });
});
