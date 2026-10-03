/**
 * Speakers and an amplifier (`audioQuote` and `vehicle.audio` in
 * `systems/caraudio.ts`, from 2026-10-03): fitted at a named retailer's
 * price, and paid for with the stereo, to the one cap, when the car is lost.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { audioQuote, stereoCover } from '@/engine/systems/caraudio';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { inSaveMoney } from '@/engine/systems/banking';

const bought = (city: string, model: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.must({ kind: 'vehicle.buy', payload: { modelId: model } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
};

describe('a car’s sound', () => {
  it('speakers and an amplifier at Crutchfield’s and Geek Squad’s prices, and insurance pays all of it to the cap', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'audio-us');
    const q = audioQuote(sim, v, 'speakers');
    expect(typeof q === 'string' ? q : q.price).toBe(inSaveMoney(sim, Math.round((69.99 + 99.99) * 100), 'USD'));
    sim.must({ kind: 'vehicle.audio', payload: { vehicleId: v.id, part: 'speakers' } });
    expect(audioQuote(sim, v, 'speakers')).toBe('It has them.');
    const big = inSaveMoney(sim, 100_000_00, 'USD');
    expect(stereoCover(sim, v, big)).toBe(inSaveMoney(sim, Math.round((69.99 + 99.99) * 100), 'USD'));
    sim.must({ kind: 'vehicle.audio', payload: { vehicleId: v.id, part: 'amp' } });
    sim.must({ kind: 'vehicle.stereo', payload: { vehicleId: v.id } });
    // The stereo, speakers and amplifier come to more than Progressive's $1,000: the cap.
    expect(stereoCover(sim, v, big)).toBe(inSaveMoney(sim, 1_000_00, 'USD'));
  });

  it('isn’t fitted where no retailer prices it', () => {
    const { sim, v } = bought('uk-eng-london', 'gb-ford-puma', 'audio-gb');
    expect(audioQuote(sim, v, 'amp')).toBe('No retailer where it’s registered publishes a price for fitting it.');
    expect(typeof audioQuote(sim, v, 'speakers')).toBe('object');
  });
});
