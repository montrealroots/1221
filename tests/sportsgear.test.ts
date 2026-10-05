/**
 * What a game is played with (`systems/sportsgear.ts`, from 2026-10-05): a
 * home's court or pitch played only with its gear owned and at home, each
 * piece bought where you live at its retailer's price with the town's tax;
 * every game's gear on sale in every market.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Fixtures } from '@/engine/content/homes';
import { SPORT_GEAR } from '@/engine/content/sportsgear';
import { salesTaxRate } from '@/engine/content/tax';
import { inSaveMoney } from '@/engine/systems/banking';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { GAME_GEAR, gearRefusal, sportShop } from '@/engine/systems/sportsgear';
import { itemsOf } from '@/engine/systems/items';

const LA = 'us-ca-losangeles';
const home = () => {
  const sim = quickSave({ startLocationId: LA, homeRegionId: LA, livesWhereBorn: true, wealth: 'wealthy' }, 'sport');
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 1_800, built: 2000, features: ['yard', 'tennisCourt'], parts: {}, hoaUsd: 0, fixtures: { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' } as Fixtures, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: LA, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = LA;
  return sim;
};

describe('a game’s gear', () => {
  it('is on sale for every game in every market', () => {
    for (const market of ['us', 'ca', 'mx', 'uk', 'ie']) for (const kinds of Object.values(GAME_GEAR)) for (const kind of kinds) {
      expect(SPORT_GEAR.some((g) => g.market === market && g.kind === kind), `${market} ${kind}`).toBe(true);
    }
    // Where SLATE keeps no gear's price at all, it says so rather than asking for what can’t be bought.
    const is = quickSave({ startLocationId: 'is-39-mosfellsbr', homeRegionId: 'is-39-mosfellsbr', livesWhereBorn: true, wealth: 'wealthy' }, 'sport-is');
    expect(gearRefusal(is.player, 'pickleball')).toBe('SLATE keeps no price for a pickleball paddle where you live yet.');
  });

  it('is needed to play: tennis a racket and balls, bought at the retailer’s price with the tax', () => {
    const sim = home();
    expect(gearRefusal(sim.player, 'tennis')).toBe('You need a tennis racket and tennis balls.');
    const shop = sportShop(sim, sim.player);
    const racket = shop.find((g) => g.kind === 'tennis-racket')!;
    expect(racket.cost).toBe(inSaveMoney(sim, Math.round(racket.price * (1 + salesTaxRate(LA, sim.now, 'general')) * 100), racket.currency));
    expect(sim.must<{ paid: number }>({ kind: 'sport.buy', payload: { productId: racket.id } }).paid).toBe(racket.cost);
    expect(gearRefusal(sim.player, 'tennis')).toBe('You need tennis balls.');
    sim.must({ kind: 'sport.buy', payload: { productId: shop.find((g) => g.kind === 'tennis-balls')!.id } });
    expect(gearRefusal(sim.player, 'tennis')).toBeUndefined();
    expect(itemsOf(sim.player).filter((i) => i.sportGear).map((i) => i.sportGear!.kind).sort()).toEqual(['tennis-balls', 'tennis-racket']);
    expect(gearRefusal(sim.player, 'basketball')).toBe('You need a basketball.');
    expect(sim.execute({ kind: 'sport.buy', payload: { productId: SPORT_GEAR.find((g) => g.market === 'uk')!.id } }).error).toBe('That isn’t sold where you live.');
  });
});
