/**
 * The utilities a home runs on (`systems/utilities.ts`, from 2026-10-01):
 * the published charge for opening a new home's accounts, nothing for the
 * first home, and power cuts at each distributor's published rate, spoiling
 * the fridge past four hours and the freezer past forty-eight.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { RELIABILITY, WITHOUT_POWER, outageChance, powerDay, settleIn, setupCost, spoilWithoutPower } from '@/engine/systems/utilities';
import { homeKeyOf } from '@/engine/systems/items';
import { foodOf } from '@/engine/systems/pantry';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('setting up a home', () => {
  it('costs what a provider publishes, with its tax: Toronto Hydro’s $35 and HST, BC Hydro’s $13.50 and GST; nothing in New York', () => {
    const to = life('ca-on-toronto', 'ut-to');
    expect(setupCost(to, 'ca-on-toronto')).toBe(Math.round(35_00 * 1.13));
    expect(setupCost(to, 'ca-bc-vancouver')).toBe(Math.round(13_50 * 1.05));
    const ny = life('us-ny-newyork', 'ut-ny');
    expect(setupCost(ny, 'us-ny-newyork')).toBe(0);
  });

  it('isn’t charged for the first home, and is for one moved into', () => {
    const sim = life('ca-on-toronto', 'ut-move');
    const before = bank(sim);
    expect(settleIn(sim, sim.player)).toBe(0);
    expect(settleIn(sim, sim.player)).toBe(0);
    sim.player.home = { ...sim.player.home!, since: sim.now + 1 };
    expect(settleIn(sim, sim.player)).toBe(Math.round(35_00 * 1.13));
    expect(before - bank(sim)).toBe(Math.round(35_00 * 1.13));
  });
});

describe('a power cut', () => {
  it('comes at the distributor’s published rate: Con Edison’s 0.13 a year, ESB’s 1.75', () => {
    expect(outageChance('us-ny-newyork')).toBeCloseTo(1 - Math.exp(-0.13 / 365), 12);
    expect(outageChance('ie-lei-dublin')).toBeGreaterThan(outageChance('us-ny-newyork') * 10);
    expect(outageChance('is-39-mosfellsbr')).toBe(0);
  });

  it('spoils the fridge past four hours, and the freezer past forty-eight: three hours spoils nothing', () => {
    const sim = life('us-ny-newyork', 'ut-spoil');
    sim.must({ kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts' } });
    sim.must({ kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-bowl-basket-thin-crust-margherita-pizza-19-oz' } });
    const home = homeKeyOf(sim.player.home)!;
    expect(spoilWithoutPower(sim.player, home, 3, sim.now)).toBe(0);
    expect(spoilWithoutPower(sim.player, home, 5, sim.now)).toBe(1);
    expect(spoilWithoutPower(sim.player, home, 50, sim.now)).toBe(2);
  });

  it('is drawn day by day, and a long one spoils the fridge', () => {
    const sim = life('us-ny-newyork', 'ut-cut');
    sim.must({ kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts' } });
    sim.must({ kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-bowl-basket-thin-crust-margherita-pizza-19-oz' } });
    // Drawn day after day in Dublin's rate until a long cut comes.
    sim.player.home = { ...sim.player.home!, cityId: 'ie-lei-dublin' };
    let hours: number | undefined;
    let day = 0;
    while (day < 20000 && !(hours !== undefined && hours > WITHOUT_POWER.fridgeHours)) { hours = powerDay(sim, sim.player, sim.now + day * MS_DAY); day += 1; }
    expect(hours).toBeGreaterThan(WITHOUT_POWER.fridgeHours);
    const chicken = foodOf(sim.player).find((i) => i.at.kind === 'home' && i.at.spot === 'fridge')!;
    const pizza = foodOf(sim.player).find((i) => i.at.kind === 'home' && i.at.spot === 'freezer')!;
    expect(chicken.food.expiresAt).toBeLessThanOrEqual(sim.now + (day - 1) * MS_DAY);
    if (hours! <= WITHOUT_POWER.freezerHours) expect(pizza.food.expiresAt).toBeGreaterThan(sim.now + day * MS_DAY);
    expect(RELIABILITY['ie-lei-dublin']!.distributor).toBe('ESB Networks');
  });
});
