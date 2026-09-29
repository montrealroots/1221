/**
 * The acting business in Dublin, for an Irish actor at home (from
 * 2026-09-29): the Irish Film Agreement's three budgets in euros, Dublin's
 * agencies, and Spotlight Ireland.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { AGENCIES, MANAGERS, ROLES } from '@/engine/content/career';
import { beginCareer, careerOf, offersFor, rateOf, roleById, weekOfAuditions, workCity } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';

const DUBLIN = 'ie-lei-dublin';

function dubliner(seed: string): Simulation {
  const sim = quickSave({ startLocationId: DUBLIN, homeRegionId: DUBLIN, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the business in Dublin', () => {
  it('draws Dublin’s films for a Dubliner, Irish ones only, and pays a day on a €2.5 million film the agreement’s €613', () => {
    const sim = dubliner('ie-parts');
    expect(workCity(sim.player)).toBe(DUBLIN);
    const agency = AGENCIES.find((a) => a.id === 'first-call')!;
    const seen = new Set<string>();
    for (let w = 0; w < 30; w += 1) for (const a of weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, DUBLIN, 3)) seen.add(a.roleId);
    expect(seen.size).toBeGreaterThan(1);
    for (const id of seen) expect(roleById(id).cities).toContain(DUBLIN);
    const cur = saveCurrency(sim.universe);
    expect(rateOf(roleById('ie-film-major'), Date.UTC(2026, 9, 1), DUBLIN, cur)).toBe(cur === 'EUR' ? 613_00 : exchange(613_00, 'EUR', cur));
    expect(ROLES.filter((r) => r.cities.includes(DUBLIN)).every((r) => r.currency === 'EUR' && r.union === 'irish-equity')).toBe(true);
  });

  it('brings Dublin’s agencies to a Dublin showing, and London’s to London’s', () => {
    const sim = dubliner('ie-agents');
    const ie = new Set<string>();
    const uk = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'ie')) ie.add(id);
      for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'uk')) uk.add(id);
    }
    expect(ie.size).toBeGreaterThan(0);
    expect([...ie].every((id) => AGENCIES.find((a) => a.id === id)!.countryId === 'ie')).toBe(true);
    expect([...uk].every((id) => AGENCIES.find((a) => a.id === id)!.countryId === 'uk')).toBe(true);
  });

  it('gets an actor in Dublin no auditions from an American agency', () => {
    const sim = dubliner('ie-uta');
    const uta = AGENCIES.find((a) => a.id === 'uta')!;
    let n = 0;
    for (let w = 0; w < 30; w += 1) n += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, uta, DUBLIN, 0).length;
    expect(n).toBe(0);
  });

  it('has an American manager find no New York agency for an actor living in Dublin', () => {
    const sim = dubliner('ie-manager');
    const career = careerOf(sim.player);
    career.managerId = MANAGERS[0]!.id;
    delete career.agencyId;
    let american = 0;
    for (let d = 0; d < 400; d += 3) {
      sim.advanceTo(sim.now + 3 * MS_DAY);
      american += career.offers.filter((o) => (AGENCIES.find((a) => a.id === o.agencyId)!.countryId ?? 'us') === 'us').length;
    }
    expect(american).toBe(0);
  }, 120_000);

  it('counts Spotlight Ireland for Dublin’s casting, and not London’s Spotlight', () => {
    const sim = dubliner('ie-spotlight');
    const run = () => { let n = 0; for (let w = 0; w < 40; w += 1) n += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, DUBLIN, 5).length; return n; };
    const bare = run();
    careerOf(sim.player).sites = { spotlight: { until: sim.now + 400 * MS_DAY, renews: true } };
    expect(run()).toBe(bare);
    careerOf(sim.player).sites = { 'spotlight-ie': { until: sim.now + 400 * MS_DAY, renews: true } };
    expect(run()).toBeGreaterThan(bare);
  });
});
