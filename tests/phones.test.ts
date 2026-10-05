/**
 * A phone of your own (`systems/phones.ts`, from 2026-10-02): the makers'
 * phones where you live at their price with the place's tax, bought outright
 * or on a maker's 0% plan, a trade-in at the maker's published value, the
 * carrier's charge to activate it, its battery's wear and replacement, and a
 * protection plan billed monthly.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { PHONES, TRADE_IN } from '@/engine/content/phones';
import { BATTERY, PHONE_DAYS, activationCost, batteryQuote, phoneById, phoneLabel, phonePrice, phonesOf, phonesOnSale, plansFor, protectionFor, tradeInValue } from '@/engine/systems/phones';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const into = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const iphone16 = 'us-apple-iphone-16-128';

function bought(sim: Simulation, phoneId: string) {
  const p = phoneById(phoneId)!;
  const r = sim.execute({ kind: 'phone.buy', payload: { phoneId, color: p.colors[0] } });
  expect(r.ok, r.error).toBe(true);
  sim.advanceBy(PHONE_DAYS * MS_DAY + 60_000);
  return phonesOf(sim.player).find((x) => x.device.phoneId === phoneId)!;
}

describe('a phone', () => {
  it('is any of 27 makers’ on their own stores, each model and storage its own', () => {
    // From 2026-10-05: Motorola, OnePlus, Nothing, Xiaomi, OPPO, Huawei, Fairphone, Doro and others beside Apple,
    // Samsung and Google, each read from its own store.
    expect(new Set(PHONES.map((p) => p.maker)).size).toBeGreaterThanOrEqual(27);
    const ids = PHONES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    // A "+" is a model of its own: the Galaxy S26+ and S26 shared an id, and one of the two was dropped in each market.
    for (const m of ['us', 'uk', 'ie', 'ca', 'mx']) for (const model of ['Galaxy S26', 'Galaxy S26+']) expect(PHONES.some((p) => p.market === m && p.model === model)).toBe(true);
    expect(phoneById('uk-fairphone-gen-6-plus-256')!.price).toBe(569);
    expect(phoneById('uk-fairphone-gen-6-256')!.price).toBe(519);
    // A phone read twice is at its list price in every color read: Samsung Canada's S26 in Silver Shadow was on sale.
    const s26 = phoneById('ca-samsung-galaxy-s26-256')!;
    expect(s26.price).toBe(1399.99);
    expect(s26.colors).toEqual(expect.arrayContaining(['Silver Shadow', 'Pinkgold']));
  });

  it('is named with its storage as the shop gives it, a feature phone’s in megabytes, none where its maker states none', () => {
    expect(phoneLabel(phoneById('us-motorola-moto-g-play-2026-64')!)).toBe('Motorola moto g play (2026), 64 GB');
    expect(phoneLabel(phoneById('uk-hmd-110-4g-0-128')!)).toBe('HMD 110 4G, 128 MB');
    expect(phoneLabel(phoneById('us-apple-iphone-18-pro-2048')!)).toBe('Apple iPhone 18 Pro, 2 TB');
    const doro = phoneById('uk-doro-aurora-a30')!;
    expect(doro.storageGB).toBeNull();
    expect(phoneLabel(doro)).toBe('Doro Aurora A30');
    // Bought in London from Doro's own store, at its price; it publishes no plan or trade-in value for it.
    const sim = life('uk-eng-london', 'phone-doro');
    expect(phonesOnSale(sim, sim.player).some((p) => p.id === doro.id)).toBe(true);
    expect(plansFor(doro)).toEqual([]);
    const owned = bought(sim, doro.id);
    expect(owned.label).toBe('Doro Aurora A30');
  });

  it('is on sale from its release date where you live, and not before', () => {
    // A life begins on January 5, 2026; until 2026-10-05 the iPhone 18 Pro, out on September 18, was on sale from then.
    const early = life('us-ny-newyork', 'phone-early');
    const pro = 'us-apple-iphone-18-pro-256';
    expect(phonesOnSale(early, early.player).some((p) => p.id === pro)).toBe(false);
    expect(early.execute({ kind: 'phone.buy', payload: { phoneId: pro, color: phoneById(pro)!.colors[0] } }).error).toBe('The Apple iPhone 18 Pro isn’t out until September 18, 2026.');
    // On its day it's on sale; one whose date wasn't read is on sale throughout.
    const day = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy', startYear: 2026, startMonth: 9, startDay: 18 }, 'phone-day');
    expect(phonesOnSale(day, day.player).some((p) => p.id === pro)).toBe(true);
    expect(phoneById('us-samsung-galaxy-a17-5g-128')!.released).toBeNull();
    expect(phonesOnSale(early, early.player).some((p) => p.id === 'us-samsung-galaxy-a17-5g-128')).toBe(true);
  });

  it('is on sale where you live, cheapest first, at the maker’s price with the sales tax', () => {
    const sim = life('us-ny-newyork', 'phone-list');
    const list = phonesOnSale(sim, sim.player);
    expect(list.every((p) => p.market === 'us')).toBe(true);
    expect(list.map((p) => phonePrice(sim, sim.player, p))).toEqual([...list.map((p) => phonePrice(sim, sim.player, p))].sort((a, b) => a - b));
    const p = phoneById(iphone16)!;
    expect(phonePrice(sim, sim.player, p)).toBe(into(sim, Math.round(829 * (1 + salesTaxRate('us-ny-newyork', sim.now, 'general')) * 100), 'USD'));
  });

  it('is bought outright, arrives, and is activated on your line at the carrier’s charge', () => {
    const sim = life('ca-on-toronto', 'phone-buy');
    const p = phonesOnSale(sim, sim.player)[0]!;
    const before = bank(sim);
    const owned = bought(sim, p.id);
    expect(before - bank(sim)).toBeGreaterThanOrEqual(phonePrice(sim, sim.player, p));
    expect(owned.at.kind).toBe('home');
    expect(owned.device.color).toBe(p.colors[0] ?? '');
    // Public Mobile's eSIM, $5.
    expect(activationCost(sim, sim.player)).toEqual({ cost: into(sim, 500, 'CAD'), carrier: 'Public Mobile' });
    expect(sim.execute({ kind: 'phone.activate', payload: { itemId: owned.id } }).ok).toBe(true);
    expect(owned.device.activated).toBe(true);
    expect(sim.execute({ kind: 'phone.activate', payload: { itemId: owned.id } }).error).toBe('It’s on your line already.');
  });

  it('is on a maker’s 0% plan month by month, but not Apple’s on a prepaid line', () => {
    const sim = life('us-ny-newyork', 'phone-plan');
    const apple = phoneById(iphone16)!;
    const acmi = plansFor(apple)[0]!;
    expect(sim.execute({ kind: 'phone.buy', payload: { phoneId: apple.id, color: apple.colors[0], plan: acmi.plan.name, months: 24 } }).error).toMatch(/isn’t open to a prepaid line like Mint Mobile’s/);
    const galaxy = phonesOnSale(sim, sim.player).find((p) => p.maker === 'Samsung' && plansFor(p).some((x) => x.months.includes(24)))!;
    const plan = plansFor(galaxy).find((x) => x.months.includes(24))!.plan.name;
    const before = bank(sim);
    expect(sim.execute({ kind: 'phone.buy', payload: { phoneId: galaxy.id, color: galaxy.colors[0], plan, months: 24 } }).ok).toBe(true);
    expect(bank(sim)).toBe(before);
    sim.advanceBy(31 * MS_DAY);
    const owned = phonesOf(sim.player).find((x) => x.device.phoneId === galaxy.id)!;
    expect(owned.device.finance!.monthsLeft).toBe(23);
    expect(owned.device.finance!.monthly).toBe(Math.ceil(phonePrice(sim, sim.player, galaxy) / 24));
    expect(sim.universe.transactions.some((t) => t.memo.startsWith(plan))).toBe(true);
  });

  it('trades an old one in at the maker’s published value', () => {
    const sim = life('us-ny-newyork', 'phone-trade');
    const old = bought(sim, iphone16);
    const next = phoneById('us-apple-iphone-17-256')!;
    const credit = tradeInValue(sim, old, next)!;
    expect(credit).toBe(into(sim, TRADE_IN.find((t) => t.market === 'us' && t.model === 'iPhone 16')!.upTo * 100, 'USD'));
    const before = bank(sim);
    expect(sim.execute({ kind: 'phone.buy', payload: { phoneId: next.id, color: next.colors[0], tradeInItemId: old.id } }).ok).toBe(true);
    expect(before - bank(sim)).toBe(phonePrice(sim, sim.player, next) - credit);
    expect(phonesOf(sim.player).some((x) => x.id === old.id)).toBe(false);
  });

  it('wears its battery a cycle a day to 80% at a thousand, and a new one costs the maker’s price', () => {
    const sim = life('us-ny-newyork', 'phone-battery');
    const owned = bought(sim, iphone16);
    expect(sim.execute({ kind: 'phone.activate', payload: { itemId: owned.id } }).ok).toBe(true);
    sim.advanceBy(61 * MS_DAY);
    expect(owned.device.battery).toBeCloseTo(1 - (60 * (1 - BATTERY.keptAt)) / BATTERY.cycles, 9);
    const cost = batteryQuote(sim, sim.player, owned)!;
    expect(cost).toBeGreaterThan(0);
    const r = sim.execute<{ paid: number }>({ kind: 'phone.battery', payload: { itemId: owned.id } });
    expect(r.value?.paid).toBe(cost);
    expect(owned.device.battery).toBe(1);
  });
});

describe('a phone’s cover', () => {
  it('is billed monthly at its plan’s price, and replaces a battery worn below 80% at its own fee', () => {
    const sim = life('us-ny-newyork', 'phone-cover');
    const owned = bought(sim, iphone16);
    const plan = protectionFor(phoneById(iphone16)!).find((x) => x.batteryFee !== null)!;
    const r = sim.execute<{ monthly: number }>({ kind: 'phone.protect', payload: { itemId: owned.id, plan: plan.plan } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.monthly).toBe(into(sim, Math.round(plan.monthly * 100), plan.currency));
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith(plan.plan))).toBe(true);
    // Above 80% the maker's own price; below it, the plan's fee.
    owned.device.battery = 0.9;
    const outright = batteryQuote(sim, sim.player, owned)!;
    owned.device.battery = 0.79;
    expect(batteryQuote(sim, sim.player, owned)).toBe(into(sim, Math.round(plan.batteryFee! * 100), plan.currency));
    expect(batteryQuote(sim, sim.player, owned)).not.toBe(outright);
  });
});
