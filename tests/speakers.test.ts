/**
 * A speaker of one's own (`systems/speakers.ts`, `systems/devices.ts`,
 * `content/audiocatalog.ts`, from 2026-10-05): sold where they live at the
 * seller's price with the place's tax, bought in a color it comes in and kept
 * as the home's speaker, what a music lover unwinds with, its model and color
 * kept and named.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { salesTaxRate } from '@/engine/content/tax';
import { AUDIO_PRODUCTS } from '@/engine/content/audiocatalog';
import { inSaveMoney } from '@/engine/systems/banking';
import { owns } from '@/engine/systems/furniture';
import { itemsOf } from '@/engine/systems/items';
import { buySpeakerRefusal, speakerCatalog } from '@/engine/systems/speakers';
import { colorsOfProduct } from '@/engine/systems/devices';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a speaker', () => {
  it('is sold where you live, cheapest first, at its price with the place’s tax', () => {
    const sim = life('us-ny-newyork', 'spk-shop');
    const shop = speakerCatalog(sim, sim.player);
    expect(shop.length).toBeGreaterThan(50);
    expect(new Set(shop.map((x) => x.product.brand)).size).toBeGreaterThan(20);
    expect(shop.map((x) => x.price)).toEqual([...shop.map((x) => x.price)].sort((a, b) => a - b));
    const one = shop[0]!;
    expect(one.price).toBe(inSaveMoney(sim, Math.round(one.offer.price * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods')) * 100), one.offer.currency));
    const abroad = AUDIO_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(buySpeakerRefusal(sim.player, abroad.id)).toBe('It’s sold in another country.');
  });

  it('is bought in a color it comes in, kept as the home’s speaker with its model and color named', () => {
    const sim = life('us-ny-newyork', 'spk-buy');
    const two = speakerCatalog(sim, sim.player).find((x) => colorsOfProduct(x.product).length > 1)!;
    const second = colorsOfProduct(two.product)[1];
    expect(sim.execute({ kind: 'speaker.buy', payload: { offerId: two.offer.id, color: 'Plaid' } }).error).toBe('It isn’t offered in that color.');
    const r = sim.must<{ paid: number; itemId: string }>({ kind: 'speaker.buy', payload: { offerId: two.offer.id, color: second } });
    expect(r.paid).toBe(two.price);
    const item = itemsOf(sim.player).find((i) => i.id === r.itemId)!;
    expect(item.kind).toBe('furniture:speaker');
    expect(item.spec).toMatchObject({ product: two.product.id, offer: two.offer.id, color: second });
    expect(item.label.endsWith(`, ${second}`)).toBe(true);
    expect(owns(sim.player, 'speaker')).toBe(true);
  });

  it('isn’t bought away from home', () => {
    const sim = life('us-ny-newyork', 'spk-away');
    const one = speakerCatalog(sim, sim.player)[0]!;
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(buySpeakerRefusal(sim.player, one.offer.id)).toBe('A speaker is bought where you live, for a home of your own.');
  });
});
