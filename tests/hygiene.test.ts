/**
 * Toiletries and grooming (`systems/hygiene.ts`, from 2026-10-01): a life's
 * starting set, what a shower and a day use at the researched amounts, what
 * going without does, a toothbrush worn out and what's run out bought again,
 * and a barber's or a salon's service at its own price, tipped.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { TOILETRIES } from '@/engine/content/hygiene';
import { homeKeyOf } from '@/engine/systems/items';
import { GROOMING, USE, WITHOUT, dailyCare, groomingLift, groomingQuote, groomingRefusal, keepsSupplies, restock, salonById, showerUses, suppliesOf, toiletryCatalog, toiletryPrice } from '@/engine/systems/hygiene';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const left = (sim: Simulation, kind: string) => suppliesOf(sim.player).filter((i) => i.supply.kind === kind).reduce((a, i) => a + i.supply.left, 0);
const without = (sim: Simulation, kind: string) => { sim.player.items = (sim.player.items ?? []).filter((i) => i.supply?.kind !== kind); };

describe('toiletries', () => {
  it('a life starts with the cheapest of each kind where it lives, in the bathroom', () => {
    const sim = life('us-ny-newyork', 'hyg-start');
    expect(keepsSupplies(sim.player)).toBe(true);
    // From 2026-10-02 the home's detergents too, and from 2026-10-03 its dish soap and spray, kept in storage (tests/cleaning.test.ts).
    const bathroom = suppliesOf(sim.player).filter((i) => !i.supply.kind.endsWith('-detergent') && i.supply.kind !== 'dish-soap' && i.supply.kind !== 'all-purpose-cleaner');
    expect(bathroom.map((i) => i.supply.kind).sort()).toEqual(['body-wash', 'deodorant', 'shampoo', 'toothbrush', 'toothpaste']);
    expect(bathroom.every((i) => i.at.kind === 'home' && i.at.spot === 'bathroom')).toBe(true);
    // Where SLATE keeps no chain's toiletries, none are counted.
    const away = life('is-39-mosfellsbr', 'hyg-none');
    expect(keepsSupplies(away.player)).toBe(false);
    expect(showerUses(away, away.player)).toBe(100);
  });

  it('a shower uses Loretz’s 11.3 g of body wash and 11.76 g of shampoo; a day two brushings and the deodorant', () => {
    const sim = life('us-ny-newyork', 'hyg-use');
    const wash = left(sim, 'body-wash');
    const shampoo = left(sim, 'shampoo');
    expect(showerUses(sim, sim.player)).toBe(100);
    expect(left(sim, 'body-wash')).toBeCloseTo(wash - USE.bodyWashG, 6);
    expect(left(sim, 'shampoo')).toBeCloseTo(shampoo - USE.shampooG, 6);
    const paste = left(sim, 'toothpaste');
    expect(dailyCare(sim, sim.player)).toBe(0);
    expect(left(sim, 'toothpaste')).toBeCloseTo(paste - 0.5, 6);
    const brush = suppliesOf(sim.player).find((i) => i.supply.kind === 'toothbrush')!;
    expect(brush.condition).toBeCloseTo(1 - 1 / 90, 9);
  });

  it('without them a shower leaves them less clean, and a morning less fresh', () => {
    const sim = life('us-ny-newyork', 'hyg-without');
    without(sim, 'body-wash');
    expect(showerUses(sim, sim.player)).toBe(WITHOUT.cleanser);
    without(sim, 'shampoo');
    without(sim, 'toothpaste');
    expect(dailyCare(sim, sim.player)).toBe(WITHOUT.daily);
    without(sim, 'deodorant');
    expect(dailyCare(sim, sim.player)).toBe(2 * WITHOUT.daily);
    // A shower by hand, the same.
    sim.player.wellbeing.hygiene = 40;
    sim.must({ kind: 'life.look_after', payload: { action: 'wash' } });
    expect(sim.player.wellbeing.hygiene).toBeLessThanOrEqual(WITHOUT.cleanser);
  });

  it('what’s run out is bought again, the cheapest here, and a worn toothbrush thrown out', () => {
    const sim = life('us-ny-newyork', 'hyg-restock');
    without(sim, 'body-wash');
    suppliesOf(sim.player).find((i) => i.supply.kind === 'toothbrush')!.condition = 0;
    const before = bank(sim);
    expect(restock(sim, sim.player)).toBe(2);
    expect(left(sim, 'body-wash')).toBeGreaterThan(0);
    expect(suppliesOf(sim.player).filter((i) => i.supply.kind === 'toothbrush').every((b) => b.condition === 1)).toBe(true);
    expect(bank(sim)).toBeLessThan(before);
    // Nothing run out, nothing bought.
    expect(restock(sim, sim.player)).toBe(0);
  });

  it('are on sale at the chains here, taxed as New York taxes them, and bought into the bathroom', () => {
    const sim = life('us-ny-newyork', 'hyg-buy');
    const list = toiletryCatalog(sim, 'us-ny-newyork');
    expect(list.length).toBeGreaterThan(10);
    const t = list[0]!.value;
    expect(toiletryPrice(sim, 'us-ny-newyork', t)).toBe(Math.round(t.price * 1.08875 * 100));
    const before = bank(sim);
    sim.must({ kind: 'hygiene.buy', payload: { productId: t.id, quantity: 2 } });
    expect(before - bank(sim)).toBe(2 * toiletryPrice(sim, 'us-ny-newyork', t));
    expect(sim.execute({ kind: 'hygiene.buy', payload: { productId: t.id, quantity: 11 } }).error).toBe('From one to ten.');
  });
});

describe('what each rule decides', () => {
  it('a shower without shampoo leaves them at most 90; a bar of soap gives its own 2.6 g', () => {
    const sim = life('us-ny-newyork', 'hyg-shampoo');
    without(sim, 'shampoo');
    expect(showerUses(sim, sim.player)).toBe(WITHOUT.shampoo);
    without(sim, 'body-wash');
    const bar = TOILETRIES.find((t) => t.kind === 'soap' && t.market === 'US')!;
    sim.player.items!.push({ id: 'bar', kind: bar.id, label: bar.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'bathroom' }, acquiredAt: sim.now, supply: { kind: 'soap', unit: 'g', left: 100 } });
    showerUses(sim, sim.player);
    expect(left(sim, 'soap')).toBeCloseTo(100 - USE.soapG, 6);
    // A bar standing in for body wash, none is bought.
    expect(restock(sim, sim.player)).toBe(1);
    expect(left(sim, 'body-wash')).toBe(0);
  });

  it('a chain with no store here sells nothing here', () => {
    const sim = life('us-ny-newyork', 'hyg-chain');
    const la = TOILETRIES.find((t) => t.chain === 'smartfinal')!;
    expect(sim.execute({ kind: 'hygiene.buy', payload: { productId: la.id } }).error).toBe('There’s no store of that chain here.');
  });

  it('the morning shower nobody chooses uses them too, and the day’s turn buys what ran out', () => {
    const stocked = life('us-ny-newyork', 'hyg-morning');
    const bare = life('us-ny-newyork', 'hyg-morning');
    for (const k of ['body-wash', 'toothpaste', 'deodorant']) without(bare, k);
    // No shops on the way: a day of work, and nothing restocked.
    for (const sim of [stocked, bare]) { sim.onSchedule('test.work', () => undefined); sim.schedule({ at: sim.now + 60_000, kind: 'test.work', label: 'A Long Day', category: 'career', requiresPlayer: true, durationMinutes: 600, payload: {} }); }
    stocked.advanceBy(MS_DAY);
    bare.advanceBy(MS_DAY);
    expect(bare.player.wellbeing.hygiene).toBeLessThan(stocked.player.wellbeing.hygiene);
    // A free day, and the body wash is back.
    bare.advanceBy(MS_DAY);
    expect(left(bare, 'body-wash')).toBeGreaterThan(0);
  });
});

describe('a barber or a salon', () => {
  it('is its own price, tipped as the place tips, taking its minutes, and lifts the mood', () => {
    const sim = life('uk-eng-london', 'groom');
    const pall = salonById('pall-mall-barbers-trafalgar-square-london')!;
    const q = groomingQuote(sim, pall, 'mens-cut')!;
    expect(q).toEqual({ price: 3797, tip: Math.round(37.97 * 0.1 * 100), minutes: 30 });
    const before = bank(sim);
    const start = sim.now;
    const morale = sim.player.wellbeing.morale;
    sim.must({ kind: 'hygiene.groom', payload: { salonId: pall.id, service: 'mens-cut' } });
    expect(before - bank(sim)).toBe(q.price + q.tip);
    expect(sim.now - start).toBe(30 * 60_000);
    expect(sim.player.groomedAt).toBe(sim.now);
    expect(sim.player.wellbeing.morale).toBeGreaterThan(morale - 0.5);
  });

  it('lifts the mood by how due it was: the whole of it four weeks on, half at two, the whole the first time', () => {
    const sim = life('uk-eng-london', 'groom-due');
    const p = sim.player;
    expect(groomingLift(p, sim.now)).toBe(GROOMING.morale);
    p.groomedAt = sim.now - 14 * MS_DAY;
    expect(groomingLift(p, sim.now)).toBeCloseTo(GROOMING.morale / 2, 9);
    p.groomedAt = sim.now - 40 * MS_DAY;
    expect(groomingLift(p, sim.now)).toBe(GROOMING.morale);
    // Back to back, the second barely lifts it.
    const pall = salonById('pall-mall-barbers-trafalgar-square-london')!;
    p.wellbeing.morale = 50;
    sim.must({ kind: 'hygiene.groom', payload: { salonId: pall.id, service: 'mens-cut' } });
    const after = p.wellbeing.morale;
    sim.must({ kind: 'hygiene.groom', payload: { salonId: pall.id, service: 'mens-cut' } });
    expect(p.wellbeing.morale - after).toBeLessThan(0.1);
    expect(after - 50).toBeGreaterThan(1);
  });

  it('isn’t had in another town, nor where the price isn’t known', () => {
    const sim = life('us-ny-newyork', 'groom-no');
    expect(groomingRefusal(sim, sim.player, 'pall-mall-barbers-trafalgar-square-london', 'mens-cut')).toMatch(/another town/);
    expect(groomingRefusal(sim, sim.player, 'supercuts-yorkville-new-york', 'mens-cut')).toBe('SLATE doesn’t know their price for it.');
    expect(groomingRefusal(sim, sim.player, 'artisan-barbershop-new-york', 'color')).toBe('They don’t offer that.');
    // The 45 minutes where a list gives none.
    expect(groomingQuote(sim, salonById('artisan-barbershop-new-york')!, 'mens-cut')!.minutes).toBe(45);
  });
});

describe('conditioner', () => {
  it('is used after the shampoo where it’s been bought, Loretz’s 13.13 g a shower', () => {
    const sim = life('us-ny-newyork', 'hyg-cond');
    const t = TOILETRIES.find((x) => x.kind === 'conditioner' && x.market === 'US')!;
    const home = suppliesOf(sim.player).find((i) => i.supply.kind === 'shampoo')!.at;
    sim.player.items = [...(sim.player.items ?? []), { id: 'cond', kind: t.id, label: t.name, quantity: 1, condition: 1, at: home, acquiredAt: sim.now, supply: { kind: 'conditioner', unit: 'g', left: 300 } }];
    showerUses(sim, sim.player);
    expect(left(sim, 'conditioner')).toBeCloseTo(300 - USE.conditionerG, 6);
    // No shampoo, no conditioner after it.
    without(sim, 'shampoo');
    showerUses(sim, sim.player);
    expect(left(sim, 'conditioner')).toBeCloseTo(300 - USE.conditionerG, 6);
  });
});
