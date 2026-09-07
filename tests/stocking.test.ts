/**
 * Who actually stocks what.
 *
 * A shop used to sell anything in a category it traded in, so a discount
 * chain listed a luxury down jacket and a house's own boutique offered
 * another company's socks. Two rules decide it now, and these hold them.
 *
 * A brand's own shopfront sells that brand and nothing else, across
 * everything the brand makes. Everybody else carries their own standing and
 * the one below it, which is read off a brand's own prices, so the
 * supermarket has the everyday names and the luxury floor has the houses.
 * Resale and the saleroom are the exception they really are.
 *
 * The rule lives in the engine rather than the screen: a basket built
 * anywhere at all is refused at the till if the shop would not carry the
 * piece.
 */

import { describe, expect, it } from 'vitest';
import {
  CATALOG, RETAILERS, brandStanding, houseBrandOf, shoppableItems, standingOf, stockistsFor, stocks,
  type CatalogItem, type Retailer,
} from '@/engine/content/catalog';
import { quickSave } from '@/engine';
import type { Id } from '@/engine/domain/model';

const LA = 'us-ca-losangeles';
const WEARABLE = new Set(['clothing', 'footwear', 'accessory', 'watch', 'jewelry']);

const shop = (name: string): Retailer => {
  const found = RETAILERS.all().find((r) => r.name === name);
  if (!found) throw new Error(`no retailer named ${name}`);
  return found;
};
const piece = (name: string): CatalogItem => {
  const found = shoppableItems().find((i) => i.name === name);
  if (!found) throw new Error(`no product named ${name}`);
  return found;
};

describe('a shop sells what it would really sell', () => {
  it('keeps a house’s coat off a discount rail and a value brief off a luxury floor', () => {
    expect(stocks(shop('Primark'), piece('Moncler Logo Cotton T-Shirt')), 'Primark is selling Moncler').toBe(false);
    expect(stocks(shop('Harrods'), piece('Hanes Ultimate Cotton Brief')), 'Harrods is selling Hanes').toBe(false);
    // And the shops that really would, still do.
    expect(stocks(shop('Nordstrom'), piece('Moncler Logo Cotton T-Shirt')), 'Nordstrom will not sell Moncler').toBe(true);
    expect(stocks(shop('Walmart'), piece('Hanes Ultimate Cotton Brief')), 'Walmart will not sell Hanes').toBe(true);
  });

  it('gives a brand’s own shopfront that brand and nothing else', () => {
    const houses = RETAILERS.all().filter((r) => houseBrandOf(r) !== undefined);
    expect(houses.length, 'no brand has a shopfront of its own').toBeGreaterThan(80);
    for (const house of houses.slice(0, 40)) {
      const brand = houseBrandOf(house)!;
      const mine = shoppableItems().filter((i) => i.brand === brand);
      // Everything it makes is in its own shop.
      for (const item of mine.slice(0, 25)) {
        expect(stocks(house, item), `${brand} does not stock its own ${item.name}`).toBe(true);
      }
      // And nothing anybody else makes.
      const foreign = shoppableItems().filter((i) => i.brand !== brand && WEARABLE.has(i.category));
      for (const item of foreign.slice(0, 25)) {
        if (brand === 'Nike' && item.brand === 'Jordan') continue;
        expect(stocks(house, item), `${brand} is selling ${item.name}`).toBe(false);
      }
    }
  });

  it('lets a company sell its own other label, and nobody else’s', () => {
    const nike = shop('Nike');
    const jordan = shoppableItems().find((i) => i.brand === 'Jordan');
    expect(jordan, 'no Jordan in the catalog').toBeDefined();
    expect(stocks(nike, jordan!), 'Nike will not sell Jordan').toBe(true);
    const adidas = shoppableItems().find((i) => i.brand === 'Adidas')!;
    expect(stocks(nike, adidas), 'Nike is selling Adidas').toBe(false);
  });

  it('reads a brand’s standing off its own prices', () => {
    expect(brandStanding('Hanes')).toBeLessThanOrEqual(2);
    expect(brandStanding('Levi’s')).toBeLessThanOrEqual(3);
    expect(brandStanding('Moncler')).toBeGreaterThanOrEqual(4);
    expect(brandStanding('Rolex')).toBe(5);
    // A name the table has never seen is judged by the piece in hand rather
    // than guessed at.
    const dear = shoppableItems().find((i) => i.basePrice > 5_000_00 && WEARABLE.has(i.category))!;
    expect(standingOf({ ...dear, brand: 'Nobody Has Heard Of This' })).toBe(5);
  });

  it('lets resale and the saleroom carry what they really consign', () => {
    const coat = piece('Moncler Logo Cotton T-Shirt');
    for (const name of ['The RealReal', 'Vestiaire Collective']) {
      expect(stocks(shop(name), coat), `${name} will not consign Moncler`).toBe(true);
    }
    // Not the bottom of the market, though. Nobody consigns a three dollar sock.
    const cheap = shoppableItems().find((i) => WEARABLE.has(i.category) && brandStanding(i.brand) === 1)!;
    expect(stocks(shop('The RealReal'), cheap), 'The RealReal is consigning a value label').toBe(false);
  });

  it('leaves the weekly shop alone', () => {
    const bread = shoppableItems().find((i) => i.category === 'groceries')!;
    const carriers = RETAILERS.all().filter((r) => r.categories.includes('groceries') && houseBrandOf(r) === undefined);
    expect(carriers.some((r) => stocks(r, bread)), 'nobody sells the groceries').toBe(true);
    // Standing is a wardrobe idea. It does not decide who sells milk.
    for (const r of carriers.slice(0, 20)) expect(stocks(r, bread), `${r.name} refuses ${bread.name}`).toBe(true);
  });

  it('still leaves somebody to sell every piece in the catalog', () => {
    const shops = RETAILERS.all();
    const orphans = shoppableItems().filter((item) => WEARABLE.has(item.category) && !shops.some((r) => stocks(r, item)));
    expect(orphans.map((o) => `${o.brand} ${o.name}`), 'nobody in the world would sell these').toEqual([]);
  });

  it('leaves a real spread of shops on each piece where the shops are', () => {
    const wearables = shoppableItems().filter((i) => WEARABLE.has(i.category));
    const total = wearables.reduce((sum, item) => sum + stockistsFor(item, LA).length, 0);
    const average = total / wearables.length;
    // Enough to choose between, far short of every shop in town.
    expect(average).toBeGreaterThan(3);
    expect(average).toBeLessThan(18);
  });
});

describe('the till applies the same rule as the shop floor', () => {
  it('refuses a basket a shop would never have sold, and says whose it is', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'stocking');
    const account = sim.player.primaryAccountId as Id;
    const before = sim.ledger.availableFunds(account);
    const coat = piece('Moncler Logo Cotton T-Shirt');

    const refused = sim.execute({
      kind: 'shop.purchase',
      payload: { retailerId: 'primark', lines: [{ catalogId: coat.id, quantity: 1 }] },
    });
    expect(refused.ok, 'a discount chain sold a house’s piece').toBe(false);
    expect(String(refused.error)).toContain('Primark');
    expect(String(refused.error)).toContain(coat.name);
    expect(sim.ledger.availableFunds(account), 'a refused basket still took the money').toBe(before);
  });

  it('lets the shop that would really sell it take the money once', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'stocking-buy');
    const account = sim.player.primaryAccountId as Id;
    const before = sim.ledger.availableFunds(account);
    const coat = piece('Moncler Logo Cotton T-Shirt');
    const seller = stockistsFor(coat, sim.player.currentLocationId)[0];
    expect(seller, 'nowhere in town sells it').toBeDefined();

    const key = 'stocking-checkout-1';
    const first = sim.execute({
      kind: 'shop.purchase',
      payload: { retailerId: seller!.id, lines: [{ catalogId: coat.id, quantity: 1 }] },
      idempotencyKey: key,
    });
    const again = sim.execute({
      kind: 'shop.purchase',
      payload: { retailerId: seller!.id, lines: [{ catalogId: coat.id, quantity: 1 }] },
      idempotencyKey: key,
    });
    expect(first.ok, `${seller!.name} refused a piece it stocks`).toBe(true);
    expect(again.replayed, 'the retry bought it twice').toBe(true);
    expect(before - sim.ledger.availableFunds(account)).toBeGreaterThan(0);
  });

  it('never lets a shop sell what the catalog does not have', () => {
    const sim = quickSave({}, 'stocking-unknown');
    const nonsense = sim.execute({
      kind: 'shop.purchase',
      payload: { retailerId: 'primark', lines: [{ catalogId: 'not_a_real_item', quantity: 1 }] },
    });
    expect(nonsense.ok).toBe(false);
    expect(CATALOG.get('not_a_real_item')).toBeUndefined();
  });
});
