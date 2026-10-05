/**
 * Car audio by make and model (`systems/caraudio.ts`, `content/caraudiocatalog.ts`,
 * from 2026-10-05): a stereo, speakers or an amplifier sold where the car is,
 * fitted at the market's published price (Geek Squad's by the kind of work in
 * America) or by the owner where none is published, and full cover paying
 * toward what it cost when the car is lost.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CAR_AUDIO_PRODUCTS } from '@/engine/content/caraudiocatalog';
import { carAudioCatalog, chosenPrice, chosenRefusal, fittingFor, stereoCover } from '@/engine/systems/caraudio';
import { devicePrice } from '@/engine/systems/devices';
import { inSaveMoney } from '@/engine/systems/banking';
import { vehiclesOf } from '@/engine/systems/vehicles';

const bought = (city: string, model: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.must({ kind: 'vehicle.buy', payload: { modelId: model } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
};

describe('car audio by make and model', () => {
  it('is fitted at Geek Squad’s price for the kind of work in America', () => {
    const us = (attrs: Record<string, unknown>) => fittingFor('us', { attrs } as never)!.price;
    expect([us({ part: 'head-unit', screenIn: 7 }), us({ part: 'head-unit', screenIn: null })]).toEqual([149.99, 99.99]);
    expect([us({ part: 'speakers', kind: 'component' }), us({ part: 'speakers', kind: 'coaxial' })]).toEqual([149.99, 99.99]);
    expect([us({ part: 'amplifier', channels: 2 }), us({ part: 'amplifier', channels: 4 }), us({ part: 'amplifier', channels: null })]).toEqual([199.99, 249.99, 249.99]);
    expect(fittingFor('mx', CAR_AUDIO_PRODUCTS[0]!)).toBeUndefined();
  });

  it('sells what’s sold where the car is, with its fitting, and fits it once', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-toyota-camry', 'audiocat-us');
    v.coverage = 'full';
    const shop = carAudioCatalog(sim, v);
    expect(shop.length).toBeGreaterThan(0);
    expect(shop.every((r) => r.offer.market === 'us')).toBe(true);
    const unit = shop.find((r) => r.product.attrs.part === 'head-unit')!;
    const fit = fittingFor('us', unit.product)!;
    expect(unit.price).toBe(devicePrice(sim, 'us-ny-newyork', unit.offer) + inSaveMoney(sim, Math.round(fit.price * 100), 'USD'));
    expect(chosenPrice(sim, 'us-ny-newyork', unit.product, unit.offer)).toBe(unit.price);
    const r = sim.must<{ paid: number }>({ kind: 'vehicle.audio', payload: { vehicleId: v.id, offerId: unit.offer.id } });
    expect(r.paid).toBe(unit.price);
    expect(v.stereo).toBe(true);
    expect(v.audioPaid?.stereo).toBe(unit.price);
    expect(chosenRefusal(v, unit.offer.id)).toBe('It has one.');
    // Full cover pays toward what it cost, to Progressive's $1,000.
    expect(stereoCover(sim, v, 10_000_000)).toBe(Math.min(unit.price, inSaveMoney(sim, 1_000 * 100, 'USD')));
    const abroad = CAR_AUDIO_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(chosenRefusal(v, abroad.id)).toBe('It’s sold in another country.');
  });

  it('is fitted by the owner, at nothing more, where no fitting price is published', () => {
    const { sim, v } = bought('mx-cmx-mexicocity', 'mx-nissan-versa', 'audiocat-mx');
    const shop = carAudioCatalog(sim, v);
    expect(shop.length).toBeGreaterThan(0);
    const one = shop[0]!;
    expect(one.price).toBe(devicePrice(sim, 'mx-cmx-mexicocity', one.offer));
    sim.must({ kind: 'vehicle.audio', payload: { vehicleId: v.id, offerId: one.offer.id } });
  });
});
