/**
 * The acting business in Britain, for a British actor at home (from
 * 2026-09-29): London's parts at Equity's pounds, London's agencies,
 * Spotlight, and a US return only for someone the US taxes.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { AGENCIES, ROLES } from '@/engine/content/career';
import { beginCareer, careerOf, offersFor, rateOf, roleById, weekOfAuditions, workCity } from '@/engine/systems/career';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { owesUsReturn } from '@/engine/systems/taxreturn';
import { evenCraft } from '@/engine/systems/school';

function londoner(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the business in London', () => {
  it('draws London’s parts for a Londoner, British ones only, and pays a television episode Equity’s £635.50', () => {
    const sim = londoner('uk-parts');
    expect(workCity(sim.player)).toBe('uk-eng-london');
    const agency = AGENCIES.find((a) => a.id === 'hamilton-hodell')!;
    const seen = new Set<string>();
    for (let w = 0; w < 30; w += 1) for (const a of weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, 'uk-eng-london', 3)) seen.add(a.roleId);
    expect(seen.size).toBeGreaterThan(1);
    for (const id of seen) expect(roleById(id).cities).toContain('uk-eng-london');
    const cur = saveCurrency(sim.universe);
    const pay = rateOf(roleById('uk-tv'), Date.UTC(2026, 9, 1), 'uk-eng-london', cur);
    expect(pay).toBe(cur === 'GBP' ? 635_50 : exchange(635_50, 'GBP', cur));
    expect(ROLES.filter((r) => r.cities.includes('uk-eng-london')).every((r) => r.currency === 'GBP' && r.union === 'equity-uk')).toBe(true);
  });

  it('brings London’s agencies to a London showing and New York’s to New York’s, and London is home’s work though an American agency signed them', () => {
    const sim = londoner('uk-agents');
    const uk = new Set<string>();
    const us = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'uk')) uk.add(id);
      for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'us')) us.add(id);
    }
    expect([...uk].every((id) => AGENCIES.find((a) => a.id === id)!.countryId === 'uk')).toBe(true);
    expect([...us].every((id) => (AGENCIES.find((a) => a.id === id)!.countryId ?? 'us') === 'us')).toBe(true);
    expect(uk.size).toBeGreaterThan(0);
    careerOf(sim.player).agencyId = 'gersh';
    careerOf(sim.player).agencyCity = 'us-ny-newyork';
    expect(workCity(sim.player)).toBe('uk-eng-london');
  });

  it('counts Spotlight for London’s casting, and not the American sites', () => {
    const sim = londoner('uk-spotlight');
    const run = () => { let n = 0; for (let w = 0; w < 40; w += 1) n += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'uk-eng-london', 5).length; return n; };
    const bare = run();
    careerOf(sim.player).sites = { 'actors-access': { until: sim.now + 400 * MS_DAY, renews: true } };
    expect(run()).toBe(bare);
    careerOf(sim.player).sites = { spotlight: { until: sim.now + 400 * MS_DAY, renews: true } };
    expect(run()).toBeGreaterThan(bare);
  });
});

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
