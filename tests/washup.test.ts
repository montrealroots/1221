/**
 * Washing up (`WASH_UP` and `washUp` in `systems/dwelling.ts`, from
 * 2026-10-03): a home without a running dishwasher puts the day's dishes in
 * the sink; Wash Up clears them at Energy Star's hand-washing time and a
 * teaspoon of dish soap a sinkful; a full sink stops the cooking.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { RECIPES } from '@/engine/content/groceries';
import { WASH_UP, livingOf } from '@/engine/systems/dwelling';
import { DISH_SOAP_ML } from '@/engine/systems/hygiene';
import { SINK_FULL, cookRefusal } from '@/engine/systems/kitchen';
import { lookAfterRefusal, minutesFor } from '@/engine/systems/life';
import { itemsOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const soap = (sim: ReturnType<typeof life>) => itemsOf(sim.player).filter((i) => i.supply?.kind === 'dish-soap').reduce((n, i) => n + i.supply!.left, 0);
// A working day's eight hours, as a job's shift is kept: a day with no time to wash up.
const busy = (sim: ReturnType<typeof life>, d: number) => sim.universe.scheduled.push({ id: `busy-${d}`, saveId: sim.universe.scheduled[0]?.saveId ?? '', at: sim.now + 60_000, kind: 'test.busy', payload: {}, status: 'done', createdAt: sim.now, priority: 0, label: 'A Shift', category: 'work', requiresPlayer: true, durationMinutes: 480 });
const handWash = (sim: ReturnType<typeof life>) => { const unit = sim.player.home!.unit!; unit.fixtures = { ...unit.fixtures, dishwasher: false }; };

describe('the dishes', () => {
  it('take Energy Star’s 230 hours a year by hand: 38 minutes a day’s', () => {
    expect(WASH_UP.minutesADay).toBeCloseTo(37.8, 1);
    expect(DISH_SOAP_ML).toBe(4.93);
  });

  it('go in the sink by the day without a dishwasher on a busy day, three at the most, and a free day washes them up', () => {
    const sim = life('us-ny-newyork', 'wash-pile');
    // A free day washes up only where that's the shortcut chosen (from 2026-10-03).
    sim.player.automation = { ...sim.player.automation, washUp: true };
    handWash(sim);
    const l = livingOf(sim.player);
    for (let d = 0; d < 4; d += 1) { busy(sim, d); sim.advanceBy(MS_DAY); }
    expect(l.dishes).toBe(WASH_UP.full);
    sim.advanceBy(MS_DAY);
    expect(l.dishes).toBeUndefined();
  });

  it('are washed up by hand: the time for each day’s, a sinkful of soap each, and the sink cooked in again', () => {
    const sim = life('us-ny-newyork', 'wash-up');
    handWash(sim);
    const l = livingOf(sim.player);
    l.dishes = 3;
    const recipe = RECIPES[0]!.id;
    expect(cookRefusal(sim, sim.player, recipe)).toBe(SINK_FULL);
    expect(minutesFor(sim, 'washup')).toBe(Math.round(WASH_UP.minutesADay * 3));
    const before = soap(sim);
    expect(before).toBeGreaterThan(3 * DISH_SOAP_ML);
    const start = sim.now;
    sim.must({ kind: 'life.look_after', payload: { action: 'washup' } });
    expect(sim.now - start).toBe(Math.round(WASH_UP.minutesADay * 3) * 60_000);
    expect(l.dishes).toBeUndefined();
    expect(soap(sim)).toBeCloseTo(before - 3 * DISH_SOAP_ML, 6);
    expect(cookRefusal(sim, sim.player, recipe)).not.toBe(SINK_FULL);
    expect(lookAfterRefusal(sim, 'washup')).toBe('There’s nothing to wash up.');
  });

  it('aren’t washed without dish soap, nor away from home', () => {
    const sim = life('us-ny-newyork', 'wash-nosoap');
    handWash(sim);
    livingOf(sim.player).dishes = 1;
    sim.player.items = itemsOf(sim.player).filter((i) => i.supply?.kind !== 'dish-soap');
    expect(lookAfterRefusal(sim, 'washup')).toBe('There’s no dish soap at home.');
    sim.player.currentLocationId = 'uk-eng-london';
    expect(lookAfterRefusal(sim, 'washup')).toBe('It isn’t your sink.');
  });

  it('go in a dishwasher with its tablets, and the sink stays empty', () => {
    const sim = life('us-ny-newyork', 'wash-machine');
    const unit = sim.player.home!.unit!;
    unit.fixtures = { ...unit.fixtures, dishwasher: true };
    livingOf(sim.player).dishes = 2;
    busy(sim, 0);
    sim.advanceBy(MS_DAY);
    expect(livingOf(sim.player).dishes).toBeUndefined();
  });
});
