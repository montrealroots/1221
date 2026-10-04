/**
 * A pet kept thing by thing (`systems/pets.ts`, `content/petcare.ts`, from
 * 2026-10-04): food bought at a named retailer's price and delivered, a day's
 * ration fed from the bag, by hand or by the shortcut; a day unfed said and
 * counted; a dog walked by you or a walker at the town's rate; a cat's litter
 * used by the week; and the yearly visit at the town's vet.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { LITTERS, PET_FOODS, RATION_G, VET_YEAR } from '@/engine/content/petcare';
import { foodLeftG, litterLeftKg, petShop, petsOf, vetPrice, walkerDay } from '@/engine/systems/pets';
import { inSaveMoney } from '@/engine/systems/banking';
import { moveTo } from '@/engine/systems/luggage';

const NY = 'us-ny-newyork';
const life = (seed: string) => quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a pet’s food', () => {
  it('is bought at the retailer’s price, cheapest a kilogram first, delivered in two days, and fed a day’s ration', () => {
    const sim = life('pc-food');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    const shop = petShop(sim, sim.player).filter((x) => x.kind === 'food' && x.species === 'dog');
    expect(shop.length).toBeGreaterThanOrEqual(2);
    expect(shop[0]!.price / shop[0]!.kg).toBeLessThanOrEqual(shop[1]!.price / shop[1]!.kg);
    sim.must({ kind: 'pets.buy', payload: { productId: shop[0]!.id } });
    expect(foodLeftG(sim.player, 'dog')).toBe(0);
    sim.advanceBy(2 * MS_DAY + 3_600_000);
    expect(foodLeftG(sim.player, 'dog')).toBeCloseTo(shop[0]!.kg * 1000, 6);
    const before = foodLeftG(sim.player, 'dog');
    sim.must({ kind: 'pets.feed', payload: {} });
    expect(before - foodLeftG(sim.player, 'dog')).toBeCloseTo(RATION_G.dog, 6);
    expect(sim.execute({ kind: 'pets.feed', payload: {} }).error).toBe('They’re fed for today.');
  });

  it('is each food’s own: two bags of one food are two things to buy, each its weight', () => {
    // Walmart's 9.07 and 1.43 kg bags of Cat Chow shared one id until 2026-10-04, and either bought the first.
    const ids = [...PET_FOODS, ...LITTERS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sim = life('pc-two-bags');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    sim.must({ kind: 'pets.buy', payload: { productId: 'us-purina-cat-chow-complete-high-protein-dry-cat-food-1-43kg' } });
    sim.advanceBy(2 * MS_DAY + 3_600_000);
    expect(foodLeftG(sim.player, 'cat')).toBeGreaterThan(1430 - 2 * RATION_G.cat - 1e-6);
    expect(foodLeftG(sim.player, 'cat')).toBeLessThanOrEqual(1430);
  });

  it('is sold by the grocers too, in their markets, each maker spelled one way', () => {
    // Chedraui's Ganador, from the grocers' own feeds (2026-10-04).
    const mx = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true, wealth: 'wealthy' }, 'pc-mx');
    mx.must({ kind: 'pets.adopt', payload: { shelterId: 'brigada-dog', name: 'Rex' } });
    expect(petShop(mx, mx.player).some((x) => x.id === 'mx-ganador-alimento-seco-para-perro-original-adulto' && x.retailer === 'Chedraui')).toBe(true);
    const spellings = new Map<string, Set<string>>();
    for (const f of PET_FOODS) spellings.set(f.brand.toLowerCase(), (spellings.get(f.brand.toLowerCase()) ?? new Set()).add(f.brand));
    expect([...spellings.values()].filter((v) => v.size > 1).map((v) => [...v])).toEqual([]);
    // The earlier read's PURINA ONE is Purina ONE, its Pro Plan Purina Pro Plan, as the grocers' feeds write them.
    expect(PET_FOODS.some((f) => f.brand === 'PURINA ONE' || f.brand === 'Pro Plan')).toBe(false);
    expect(new Set(PET_FOODS.map((f) => f.brand)).size).toBeGreaterThanOrEqual(40);
  });

  it('a day unfed is said and counted; the shortcut feeds them from what’s at home', () => {
    const sim = life('pc-hungry');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    sim.advanceBy(2 * MS_DAY);
    const mog = petsOf(sim.player)[0]!;
    expect(mog.hungryDays).toBeGreaterThanOrEqual(1);
    expect(sim.universe.notifications.some((n) => n.title === 'Mog Went Unfed')).toBe(true);
    const cat = petShop(sim, sim.player).find((x) => x.kind === 'food' && x.species === 'cat')!;
    sim.must({ kind: 'pets.buy', payload: { productId: cat.id } });
    sim.advanceBy(2 * MS_DAY + 3_600_000);
    sim.must({ kind: 'life.set_automation', payload: { key: 'feedPets', on: true } });
    const left = foodLeftG(sim.player, 'cat');
    sim.advanceBy(3 * MS_DAY);
    expect(left - foodLeftG(sim.player, 'cat')).toBeCloseTo(3 * RATION_G.cat, 6);
    expect(mog.hungryDays).toBe(0);
  });
});

describe('a dog walked, a cat’s litter, the vet', () => {
  it('a dog walked an hour by you, or a walker at the town’s rate each day', () => {
    const sim = life('pc-walk');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    const rex = petsOf(sim.player)[0]!;
    expect(sim.execute({ kind: 'pets.walk', payload: { petId: rex.id } }).error).toBe('Rex’s been walked today.');
    sim.advanceBy(MS_DAY);
    const before = sim.now;
    sim.must({ kind: 'pets.walk', payload: { petId: rex.id } });
    expect(sim.now - before).toBe(60 * 60_000);
    expect(walkerDay(sim, sim.player)).toBe(inSaveMoney(sim, Math.round(24.42 * 2 * 100), 'USD'));
    sim.must({ kind: 'pets.walker', payload: { petId: rex.id, on: true } });
    sim.advanceBy(3 * MS_DAY);
    expect(Object.values(sim.universe.transactions).filter((t) => t.memo === 'A dog walker for Rex').length).toBeGreaterThanOrEqual(2);
    expect(rex.unwalkedDays ?? 0).toBe(0);
  });

  it('a cat’s litter used by the week, and the yearly visit at the town’s vet', () => {
    const sim = life('pc-litter');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    const litter = petShop(sim, sim.player).find((x) => x.kind === 'litter')!;
    sim.must({ kind: 'pets.buy', payload: { productId: litter.id } });
    sim.advanceBy(2 * MS_DAY + 3_600_000);
    const kg = litterLeftKg(sim.player);
    sim.advanceBy(7 * MS_DAY);
    expect(kg - litterLeftKg(sim.player)).toBeCloseTo(1.9, 1);
    const mog = petsOf(sim.player)[0]!;
    expect(vetPrice(sim, sim.player, mog)).toBe(inSaveMoney(sim, Math.round(VET_YEAR[NY]!.cat * 100), 'USD'));
    const r = sim.must<{ until: number }>({ kind: 'pets.vet', payload: { petId: mog.id } });
    expect(r.until).toBeGreaterThan(sim.now + 360 * MS_DAY);
  });
});

describe('when there’s nobody but a sitter, or no food', () => {
  it('feeding with no food at home is refused, and a sitter feeds and walks them while you’re away', () => {
    const sim = life('pc-sitter');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    sim.advanceBy(MS_DAY);
    expect(sim.execute({ kind: 'pets.feed', payload: {} }).error).toBe('There’s not a day’s food at home for Rex.');
    const rex = petsOf(sim.player)[0]!;
    const unfed = rex.hungryDays ?? 0;
    sim.must({ kind: 'home.sitter', payload: { nights: 5 } });
    moveTo(sim, sim.player, 'us-ca-losangeles');
    // The day they left, before the sitter's stay began, counts as it was; the days after are the sitter's.
    sim.advanceBy(MS_DAY);
    const hungry = rex.hungryDays ?? 0;
    const unwalked = rex.unwalkedDays ?? 0;
    expect(hungry).toBeGreaterThanOrEqual(unfed);
    sim.advanceBy(2 * MS_DAY);
    expect(rex.hungryDays ?? 0).toBe(hungry);
    expect(rex.unwalkedDays ?? 0).toBeLessThanOrEqual(unwalked);
  });
});
