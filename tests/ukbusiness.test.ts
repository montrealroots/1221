/**
 * The acting business in Britain, for a British actor at home (from
 * 2026-09-29): London's parts at Equity's pounds, London's agencies,
 * Spotlight, and a US return only for someone the US taxes.
 */
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { recordWages,yearOf } from '@/engine/systems/earnings';
import { evenCraft } from '@/engine/systems/school';
import { owesUsReturn } from '@/engine/systems/taxreturn';
import { describe,expect,it } from 'vitest';

function londoner(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  return sim;
}

describe('a US return', () => {
  it('isn’t asked of a British citizen whose year was all London work, and is of an American’s', () => {
    const sim = londoner('uk-return');
    const at = Date.UTC(2031, 5, 1);
    recordWages(sim.player, at, 'Europe/London', { gross: 10_000_00, where: 'uk-eng-london' });
    expect(yearOf(sim.player, 2031).bySource).toEqual({ uk: 10_000_00 });
    expect(owesUsReturn(sim.player, 2031)).toBe(false);
    recordWages(sim.player, at, 'Europe/London', { gross: 2_000_00, where: 'us-ny-newyork' });
    expect(owesUsReturn(sim.player, 2031)).toBe(true);
    sim.player.citizenshipId = 'us';
    recordWages(sim.player, Date.UTC(2032, 5, 1), 'Europe/London', { gross: 10_000_00, where: 'uk-eng-london' });
    expect(owesUsReturn(sim.player, 2032)).toBe(true);
  });
});
