/**
 * Gas and water by the town's own tariff (`systems/gas.ts` and
 * `systems/water.ts`, from 2026-10-03): gas as electricity is, the typical
 * month out of the atlas's bills and the month used in; water billed to
 * whoever the town bills, for what the household used on its days home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { countHomeDay, electricityAdjustment, KIND_SHARE } from '@/engine/systems/electricity';
import { billsOf } from '@/engine/systems/household';
import { zonedParts } from '@/engine/core/time';
import { GAS_TARIFFS, gasAdjustment } from '@/engine/systems/gas';
import { WASHING, WATER_TARIFFS, billedWater, litersUsed, waterBillOf } from '@/engine/systems/water';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { newContact, contactsOf } from '@/engine/systems/people';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** A month of so many days home, showering and bathing as often as the country's average (`WASHING`). */
const month = (sim: Simulation, home: number, of: number) => {
  sim.player.living ??= { tidy: 80 };
  delete sim.player.living.billDays; delete sim.player.living.homeDays;
  for (let d = 0; d < of; d += 1) countHomeDay(sim.player, d < home);
  const w = WASHING[sim.player.home?.cityId?.startsWith('uk-') ? 'gb' : sim.player.home?.cityId?.slice(0, 2) ?? ''];
  sim.player.living.showers = (w?.showersADay ?? 0) * home;
  sim.player.living.baths = (w?.bathsADay ?? 0) * home;
};
const house = (sim: Simulation, cityId: string, type: HomeFacts['type'] = 'house') => {
  const facts: HomeFacts = { type, address: 'Test House', beds: 3, baths: 2, size: 1_200, built: 2000, features: [], parts: {}, hoaUsd: 0 };
  const owned = ownBuilt(sim, sim.player, { cityId, facts, price: 600_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId, homeId: owned.id, since: sim.now };
};

describe('gas', () => {
  it('is billed on each utility’s tariff: Con Edison’s blocks, FortisBC’s sample year', () => {
    const ny = GAS_TARIFFS['us-ny-newyork']!;
    expect(ny.bill(100, 1, 31)).toBeCloseTo(34 + 87 * 1.6383 + 10 * 1.3831 + 100 * (0.453801 - 0.025688), 6);
    const bc = GAS_TARIFFS['ca-bc-vancouver']!;
    const year = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].reduce((n, d, i) => n + bc.bill(7.5, i + 1, d) / 1.05, 0);
    expect(year).toBeGreaterThan(1_283 - 10);
    expect(year).toBeLessThan(1_283 + 10);
    // Enbridge's blocks: the 31st cubic meter is dearer than the 300th.
    const on = GAS_TARIFFS['ca-on-toronto']!;
    expect(on.bill(31, 1, 31) - on.bill(30, 1, 31)).toBeGreaterThan(on.bill(301, 1, 31) - on.bill(300, 1, 31));
  });

  it('home every day, nothing changes; a month away, what’s used comes off and the standing charge stays', () => {
    const sim = life('ie-lei-dublin', 'gas-dub');
    sim.player.home = { ...sim.player.home!, kind: 'own' } as never;
    month(sim, 30, 30);
    expect(gasAdjustment(sim, sim.player, 11)).toBe(0);
    month(sim, 0, 30);
    expect(gasAdjustment(sim, sim.player, 11)).toBe(inSave(sim, -(11_000 / 12) * KIND_SHARE.own! * 0.1236, 'EUR'));
    // In the month's bills, beside electricity's.
    const p = zonedParts(sim.now, 'Europe/Dublin');
    const billed = p.day === 1 ? (p.month === 1 ? 12 : p.month - 1) : p.month;
    month(sim, 30, 30);
    const home = billsOf(sim, sim.player);
    month(sim, 0, 30);
    expect(billsOf(sim, sim.player) - home).toBe(electricityAdjustment(sim, sim.player, billed) + gasAdjustment(sim, sim.player, billed));
    expect(gasAdjustment(sim, sim.player, billed)).toBeLessThan(0);
    const mx = life('mx-cmx-mexicocity', 'gas-mx');
    month(mx, 0, 31);
    // Mexico City's LP gas, from later on 2026-10-03: a month away buys none of it.
    expect(gasAdjustment(mx, mx.player, 5)).toBe(inSave(mx, -GAS_TARIFFS['mx-cmx-mexicocity']!.typical * KIND_SHARE[mx.player.home!.kind]! * 20.1, 'MXN'));
  });
});

describe('water', () => {
  it('is billed to a London renter, for each of the household a day home, and the standing charge away', () => {
    const sim = life('uk-eng-london', 'water-ldn');
    sim.player.home = { ...sim.player.home!, kind: 'own' } as never;
    expect(billedWater(sim, sim.player)).toBe(true);
    month(sim, 30, 30);
    const standing = ((66.87 + 128.13) * 30) / 365;
    const perM3 = 2.7346 + 1.4721;
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, 0.122 * 30 * perM3 + standing, 'GBP'));
    // A partner living there doubles what's used.
    const partner = newContact(sim, sim.player, 'uk-eng-london', 'water-partner', { at: sim.now, how: 'school' });
    partner.livesWith = sim.now;
    contactsOf(sim.player).push(partner);
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, 2 * 0.122 * 30 * perM3 + standing, 'GBP'));
    month(sim, 0, 30);
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, standing, 'GBP'));
    // A room pays its share of the standing charges.
    (sim.player.home as { kind: string }).kind = 'shared';
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, standing * KIND_SHARE.shared!, 'GBP'));
  });

  it('meters the player’s own showers and baths against the average', () => {
    const sim = life('uk-eng-london', 'water-showers');
    sim.player.home = { ...sim.player.home!, kind: 'own' } as never;
    month(sim, 30, 30);
    const average = litersUsed(sim.player, 'uk-eng-london', 11);
    expect(average).toBeCloseTo(122 * 30, 6);
    sim.player.living!.showers! += 10;
    expect(litersUsed(sim.player, 'uk-eng-london', 11)).toBeCloseTo(average + 10 * 60, 6);
    sim.player.living!.baths! += 2;
    expect(litersUsed(sim.player, 'uk-eng-london', 11)).toBeCloseTo(average + 10 * 60 + 2 * 80, 6);
    // Never showering at home, the average's showers come out.
    sim.player.living!.showers = 0; sim.player.living!.baths = 0;
    expect(litersUsed(sim.player, 'uk-eng-london', 11)).toBeCloseTo(average - 30 * (4.4 / 7) * 60 - 30 * (1.3 / 7) * 80, 6);
    // In America a shower is REU2016's 59.8 liters, and a bath isn't metered.
    expect(WASHING.us!.showerL).toBe(59.8);
    expect(WASHING.us!.bathL).toBeUndefined();
  });

  it('a shower at home counts toward it', () => {
    const sim = life('uk-eng-london', 'water-count');
    sim.player.wellbeing.hygiene = 20;
    sim.player.living ??= { tidy: 80 };
    const before = sim.player.living.showers ?? 0;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    expect(sim.player.living!.showers).toBe(before + 1);
  });

  it('is in a renter’s rent elsewhere, and billed to the owner of a house, by the town’s own tariff', () => {
    const sim = life('us-ny-newyork', 'water-ny');
    expect(billedWater(sim, sim.player)).toBe(false);
    house(sim, 'us-ny-newyork');
    expect(billedWater(sim, sim.player)).toBe(true);
    // One person a month uses less than the Water Board's 49 cents a day covers, so that's the bill, home or away.
    month(sim, 30, 30);
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, 0.49 * 30 * 2.59, 'USD'));
    month(sim, 0, 30);
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, 0.49 * 30 * 2.59, 'USD'));
    // Two use more, at the metered rate and sewer's 159% of it.
    const partner = newContact(sim, sim.player, 'us-ny-newyork', 'water-ny-partner', { at: sim.now, how: 'school' });
    partner.livesWith = sim.now;
    contactsOf(sim.player).push(partner);
    month(sim, 30, 30);
    expect(waterBillOf(sim, sim.player, 11)).toBe(inSave(sim, 5.35 * ((2 * 221.8 * 30) / 2_831.68) * 2.59, 'USD'));
    // A condo's is the building's.
    house(sim, 'us-ny-newyork', 'condo');
    expect(billedWater(sim, sim.player)).toBe(false);
  });

  it('runs on each town’s rules: New Haven’s sewer minimum, Vancouver’s flat year, none in Dublin', () => {
    expect(WATER_TARIFFS['us-ct-newhaven']!.bill(5 * 2_831.68, 1, 31, false)).toBeCloseTo(23.63 + 5 * 5.41 + 27.5 + 18, 6);
    expect(WATER_TARIFFS['us-ct-newhaven']!.bill(7 * 2_831.68, 1, 31, false)).toBeCloseTo(23.63 + 7 * 5.41 + 27.5 + 18 + 2 * 5.5, 6);
    const van = life('ca-bc-vancouver', 'water-van');
    house(van, 'ca-bc-vancouver');
    month(van, 0, 30);
    expect(waterBillOf(van, van.player, 11)).toBe(inSave(van, (867 + 1_238) / 12, 'CAD'));
    const dub = life('ie-lei-dublin', 'water-dub');
    house(dub, 'ie-lei-dublin');
    expect(waterBillOf(dub, dub.player, 11)).toBe(0);
  });
});
