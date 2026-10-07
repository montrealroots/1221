/**
 * The engine's list of what a stop on errands can be (`errandStops` in
 * `systems/trips.ts`, from 2026-10-06): besides the groceries, toiletries,
 * salons, dry cleaner's, stations and clubs the screen offered before, a
 * clothes shop's till, the pharmacy, the bank's counter, the Post Office and
 * a restaurant, each the command its own screen runs, and a run of errands
 * does each of them.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { CLOTHING_PRODUCTS, CLOTHING_RETAILERS } from '@/engine/content/clothingcatalog';
import { healthOf } from '@/engine/systems/health';
import { walletOf } from '@/engine/systems/cash';
import { errandStops, runErrands } from '@/engine/systems/trips';

const CITY = 'uk-eng-london';

const saturdayAt = (sim: ReturnType<typeof quickSave>, hour: number) => {
  const zone = CITIES.get(CITY)!.timeZone;
  let t = sim.now + 3_600_000;
  for (;;) { const p = zonedParts(t, zone); if (p.weekday === 6 && p.hour === hour) break; t += 3_600_000; }
  sim.advanceTo(t - (zonedParts(t, zone).minute * 60_000));
};

describe('a stop on errands', () => {
  it('can be the clothes shop, the pharmacy, the bank, the Post Office and a restaurant, and a run does each', () => {
    const sim = quickSave({ startLocationId: CITY, homeRegionId: CITY, livesWhereBorn: true, wealth: 'wealthy' }, 'errand-stops');
    saturdayAt(sim, 12);
    healthOf(sim.player).chronic = { hypertension: { treated: true } };
    const shop = CLOTHING_RETAILERS.find((r) => r.storesIn.includes(CITY) && CLOTHING_PRODUCTS.some((p) => p.retailer === r.id))!;
    const product = CLOTHING_PRODUCTS.find((p) => p.retailer === shop.id)!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: product.id, how: 'store', ...(product.sizes[0] ? { size: product.sizes[0] } : {}), ...(product.colors.length > 1 ? { color: product.colors[0] } : {}) } });
    sim.must({ kind: 'cash.withdraw', payload: { amount: 50_00, from: 'counter' } });
    sim.player.wellbeing.nourishment = 20;

    const offers = errandStops(sim, sim.player, 'foot', 20_00);
    const kinds = new Set(offers.map((o) => o.kind));
    for (const k of ['clothes.checkout', 'health.extra_supply', 'cash.withdraw', 'cash.deposit', 'food.dine']) expect(kinds, k).toContain(k);
    expect(offers.some((o) => o.key === 'po-out')).toBe(true);
    // No cash asked for, no bank or Post Office stop.
    expect(errandStops(sim, sim.player, 'foot').some((o) => o.kind.startsWith('cash.'))).toBe(false);

    const pick = (key: string) => offers.find((o) => o.key === key)!;
    const till = offers.find((o) => o.kind === 'clothes.checkout')!;
    const meal = offers.find((o) => o.kind === 'food.dine')!;
    const wallet0 = walletOf(sim, sim.player)!.balance;
    const bought0 = (sim.player.clothesBought ?? []).length;
    const supply0 = healthOf(sim.player).chronic!.hypertension!.supplyUntil ?? 0;
    const memos0 = sim.universe.transactions.length;
    const plan = [till, pick('rx'), pick('bank-out'), pick('bank-in'), pick('po-out'), meal];
    const r = runErrands(sim, { by: 'foot', stops: plan });
    expect(r.stopped, r.stopped?.error).toBeUndefined();
    expect(r.done).toBe(plan.length);

    expect((sim.player.clothesBought ?? []).length).toBe(bought0 + 1);
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil ?? 0).toBeGreaterThan(supply0);
    const memos = sim.universe.transactions.slice(memos0).map((t) => t.memo);
    expect(memos).toContain('Cash out: Counter');
    expect(memos).toContain('Cash in: Counter');
    expect(memos).toContain('Cash out: Post Office');
    // Out 20 twice and in 20 once.
    expect(walletOf(sim, sim.player)!.balance).toBe(wallet0 + 20_00);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(20);
    expect(sim.player.trip).toBeUndefined();
  });
});
