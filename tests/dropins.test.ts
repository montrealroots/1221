/**
 * Yoga and dance classes taken one at a time (`class.take`, `content/dropins.ts`,
 * from 2026-10-03): each studio's single price with the town's tax, an hour,
 * at the Compendium's METs; under three an hour unwinding.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { DROP_INS, DROP_IN_MINUTES } from '@/engine/content/dropins';
import { dropInPrice } from '@/engine/systems/life';
import { inSaveMoney } from '@/engine/systems/banking';
import { salesTaxRate } from '@/engine/content/tax';
import { BODY } from '@/engine/content/body';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const byId = (id: string) => DROP_INS.find((c) => c.id === id)!;

describe('a drop-in class', () => {
  it('is the studio’s single price with the town’s tax, an hour of the clock', () => {
    const sim = life('us-ny-newyork', 'dropin-yoga');
    sim.advanceBy(MS_DAY);
    const c = byId('new-york-yoga');
    expect(dropInPrice(sim, c)).toBe(inSaveMoney(sim, Math.round(39 * (1 + salesTaxRate('us-ny-newyork', sim.now, 'general')) * 100), 'USD'));
    const before = sim.now;
    const r = sim.must<{ doneAt: number; paid: number }>({ kind: 'class.take', payload: { classId: c.id } });
    expect(r.paid).toBe(dropInPrice(sim, c));
    expect(r.doneAt - before).toBe(DROP_IN_MINUTES * 60_000);
    // A price with its tax in is the price.
    const ldn = life('uk-eng-london', 'dropin-ldn');
    expect(dropInPrice(ldn, byId('fierce-grace'))).toBe(inSaveMoney(ldn, 17_00, 'GBP'));
  });

  it('a dance class is a workout and builds fitness; yoga’s 2.3 METs unwind instead', () => {
    const dance = life('us-ny-newyork', 'dropin-dance');
    dance.advanceBy(MS_DAY);
    dance.player.wellbeing.fitness = 30;
    const spent = dance.player.body!.extra;
    dance.must({ kind: 'class.take', payload: { classId: 'bdc-open-class' } });
    expect(dance.player.wellbeing.fitness).toBeGreaterThan(30);
    // Its effort, at its METs past the sedentary hour's, by the weight.
    expect(dance.player.body!.extra - spent).toBeCloseTo((5.0 - BODY.sedentary) * dance.player.body!.weightKg, 6);
    const yoga = life('us-ny-newyork', 'dropin-unwind');
    yoga.advanceBy(MS_DAY);
    yoga.player.wellbeing.fitness = 30;
    yoga.player.wellbeing.stress = 60;
    yoga.must({ kind: 'class.take', payload: { classId: 'new-york-yoga' } });
    expect(yoga.player.wellbeing.fitness).toBeLessThanOrEqual(30);
    expect(yoga.player.wellbeing.stress).toBeLessThan(60);
  });

  it('is taken in the studio’s town', () => {
    const sim = life('us-ny-newyork', 'dropin-away');
    expect(sim.execute({ kind: 'class.take', payload: { classId: 'kula-yoga' } }).error).toBe('Kula Yoga is in Toronto.');
    expect(sim.execute({ kind: 'class.take', payload: { classId: 'nope' } }).error).toBe('There’s no such class.');
  });
});
