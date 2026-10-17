/**
 * The time care takes, and where a prescription is filled
 * (`content/carevisits.ts`, `systems/health.ts`, from 2026-10-01): an
 * emergency department's median hours, missed from whatever they held,
 * and an uninsured American generic at the chosen pharmacy's cash price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { edMinutes } from '@/engine/content/carevisits';
import { careFor, inHospital, planKey, rxShareOf } from '@/engine/systems/health';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const usd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };

describe('an emergency', () => {
  it('takes the department’s median where you live', () => {
    expect(edMinutes('us-ny-newyork')).toBe(204);
    expect(edMinutes('us-ca-losangeles')).toBe(186);
    expect(edMinutes('us-ct-newhaven')).toBe(189);
    expect(edMinutes('us-tx-houston')).toBe(162);
    expect(edMinutes('ie-lei-dublin')).toBeCloseTo(345.6, 9);
    expect(edMinutes('ca-on-toronto')).toBe(240);
    expect(edMinutes('uk-eng-london')).toBe(240);
  });

  it('keeps them in hospital that long, and no longer', () => {
    const sim = life('us-ny-newyork', 'ed-held');
    careFor(sim, sim.player, { care: 'emergency', what: 'A fall' }, sim.now);
    expect(inHospital(sim.player, sim.now + 200 * 60_000)).toBe(true);
    expect(inHospital(sim.player, sim.now + 205 * 60_000)).toBe(false);
  });
});

describe('a pharmacy', () => {
  it('fills an uninsured generic at its own cash price, and nothing else changes', () => {
    const sim = life('us-ny-newyork', 'rx-chain');
    const p = sim.player;
    if (planKey(p, sim.now)) delete (p.health as { cover?: unknown }).cover;
    const median = rxShareOf(p, false, sim.now, 'USD');
    expect(sim.execute({ kind: 'health.choose_pharmacy', payload: { chain: 'walmart' } }).ok).toBe(true);
    expect(planKey(p, sim.now)).toBeUndefined();
    expect(rxShareOf(p, false, sim.now, 'USD')).toBe(usd(sim, 4_00));
    expect(rxShareOf(p, false, sim.now, 'USD')).toBeLessThan(median);
    // A brand is the median still.
    expect(rxShareOf(p, true, sim.now, 'USD')).toBeGreaterThan(400_00);
    const ldn = life('uk-eng-london', 'rx-uk');
    expect(ldn.execute({ kind: 'health.choose_pharmacy', payload: { chain: 'walmart' } }).error).toMatch(/only in the United States/);
  });
});
