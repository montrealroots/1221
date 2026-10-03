/**
 * What's run out for something they'd do, offered in place (`shortfallsFor`
 * in `systems/hygiene.ts`, `cheapestPlanFor` in `systems/programmes.ts`, from
 * 2026-10-03): a shower's cleanser and shampoo, the tidying's spray, the
 * washing-up's soap, the washing's detergent, and a program's service.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { shortfallsFor } from '@/engine/systems/hygiene';
import { cheapestPlanFor, programmeById } from '@/engine/systems/programmes';
import { planPrice, plansHere } from '@/engine/systems/homelife';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const without = (sim: Simulation, ...kinds: string[]) => { sim.player.items = (sim.player.items ?? []).filter((i) => !kinds.includes(i.supply?.kind ?? '')); };
const midday = (sim: Simulation) => { while (new Date(sim.now).getUTCHours() !== 17) sim.advanceBy(60 * 60_000); };

describe('what’s run out', () => {
  it('is offered for what a thing uses, the cheapest open here, and not while some is to hand', () => {
    const sim = life('us-ny-newyork', 'short-wash');
    midday(sim);
    expect(shortfallsFor(sim, sim.player, 'wash')).toEqual([]);
    without(sim, 'shampoo');
    expect(shortfallsFor(sim, sim.player, 'wash').map((x) => x.label)).toEqual(['Shampoo']);
    // Without either cleanser, one is offered beside the shampoo.
    without(sim, 'soap', 'body-wash');
    expect(shortfallsFor(sim, sim.player, 'wash').map((x) => x.label)).toHaveLength(2);
    without(sim, 'dish-soap');
    expect(shortfallsFor(sim, sim.player, 'washup').map((x) => x.label)).toEqual(['Dish Soap']);
    // Some detergent left, but not enough for the loads: offered when asked.
    expect(shortfallsFor(sim, sim.player, 'laundry')).toEqual([]);
    expect(shortfallsFor(sim, sim.player, 'laundry', true).map((x) => x.label)).toEqual(['Laundry Detergent']);
    // A life that doesn't count its supplies is never short.
    sim.player.suppliesSince = undefined;
    expect(shortfallsFor(sim, sim.player, 'wash')).toEqual([]);
    expect(shortfallsFor(sim, sim.player, 'eat')).toEqual([]);
    const bought = sim.execute({ kind: 'hygiene.buy', payload: { productId: shortfallsFor(sim, sim.player, 'washup')[0]!.toiletry.id } });
    expect(bought.ok, bought.error).toBe(true);
    expect(shortfallsFor(sim, sim.player, 'washup')).toEqual([]);
  });

  it('offers a program’s service in place, its cheapest plan here, until one of theirs shows it', () => {
    const sim = life('us-ny-newyork', 'short-tv');
    const reacher = programmeById('us-reacher')!;
    const plan = cheapestPlanFor(sim, sim.player, reacher)!;
    const prime = plansHere(sim.player).filter((p) => /^Amazon Prime/.test(p.label));
    expect(plan.monthly).toBe(Math.min(...prime.map((p) => planPrice(sim, sim.player, p))));
    sim.must({ kind: 'home.subscribe', payload: { id: plan.id } });
    expect(cheapestPlanFor(sim, sim.player, reacher)).toBeUndefined();
  });
});
