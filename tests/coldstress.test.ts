/**
 * Dressed for the cold (`systems/coldstress.ts`, from 2026-10-03): ISO
 * 11079's duration limit for the clothes worn, ASHRAE's clo summed, the
 * OFCM's frostbite times, and layers that make an outfit warmer.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import { CLO, cloOf } from '@/engine/content/clo';
import { COLD_BELOW_C, FABRIC, MET_W, SITTING_MET, airNow, coldHours, coldRefusal, coldVerdict, frostbiteMinutes, outfitClo } from '@/engine/systems/coldstress';
import { weatherAt } from '@/engine/systems/weather';
import { courtRefusal, fineWeatherRefusal, stayPlace, trainingAt } from '@/engine/systems/dwelling';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { addItem } from '@/engine/systems/items';
import { outfitFor } from '@/engine/systems/wardrobe';
import { outfitRefusal } from '@/engine/systems/clothing';
import type { Slot } from '@/engine/content/garmentcare';

const wear = (sim: Simulation, pieces: [string, Slot, string][]) => {
  const items = pieces.map(([kind, slot, label]) => addItem(sim, sim.player, { kind: `test:${kind}`, label, quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now, garment: { kind, slot, care: 'wash', wears: 0, washes: 0 } }));
  sim.player.wornNow = { itemIds: items.map((i) => i.id), since: sim.now };
  return items;
};
const LIGHT: [string, Slot, string][] = [['t-shirt', 'top', 'T-Shirt'], ['jeans', 'bottom', 'Jeans'], ['underwear', 'underwear', 'Briefs'], ['socks', 'socks', 'Socks'], ['shoes', 'shoes', 'Sneakers']];
const WARM: [string, Slot, string][] = [...LIGHT, ['thermal-top', 'base', 'HEATTECH Top'], ['thermal-bottom', 'base', 'HEATTECH Tights'], ['sweater', 'top', 'Wool Sweater'], ['coat', 'outer', 'Down Parka']];

describe('ISO 11079’s duration limit', () => {
  it('lengthens with the clothes and the warmth of the air, and shortens with the wind', () => {
    const sit = SITTING_MET * MET_W;
    expect(coldHours(0, 0, 1, 60, sit, 1.5)).toBeGreaterThan(coldHours(0, 0, 1, 60, sit, 1.0));
    expect(coldHours(5, 5, 1, 60, sit, 1.0)).toBeGreaterThan(coldHours(-5, -5, 1, 60, sit, 1.0));
    expect(coldHours(0, 0, 4, 60, sit, 1.0)).toBeLessThan(coldHours(0, 0, 0.4, 60, sit, 1.0));
    // Running makes its own heat: at freezing, a light outfit keeps up.
    expect(coldHours(0, 0, 2, 60, 9.3 * MET_W, 0.4)).toBe(Infinity);
    expect(coldHours(0, 0, 2, 60, sit, 0.4)).toBeLessThan(0.5);
  });

  it('frostbite at the OFCM’s table: −25 °C in a 20 km/h wind, 14 minutes; nothing warmer than −15 °C', () => {
    expect(frostbiteMinutes(-25, 20)).toBe(14);
    // Read at the next colder and windier cell: −30 °C, 20 km/h.
    expect(frostbiteMinutes(-27, 15)).toBe(10);
    expect(frostbiteMinutes(-14, 80)).toBe(Infinity);
    expect(frostbiteMinutes(-15, 10)).toBe(Infinity);
    expect(frostbiteMinutes(-60, 95)).toBe(1);
  });
});

/** d'Ambrosio Alfano et al.'s DLE_min (2025, Appendix B.4), transcribed again line by line, as the reference. */
function dleMin(ta: number, tr: number, va: number, RH: number, M: number, W: number, Icl: number, im: number, ap: number): number {
  let walk = 0.0052 * (M - 58);
  if (walk >= 1.2) walk = 1.2;
  const tsk = 33.34 - 0.0354 * M;
  const wetness = 0.06;
  const tex = 29 + 0.2 * ta;
  const pex = 0.1333 * Math.exp(18.6686 - 4030.183 / (tex + 235));
  const psks = 0.1333 * Math.exp(18.6686 - 4030.183 / (tsk + 235));
  const pa = ta >= 0 ? (RH / 100) * 0.1333 * Math.exp(18.6686 - 4030.183 / (ta + 235)) : (RH / 100) * 0.6105 * Math.exp((21.875 * ta) / (265.5 + ta));
  const Iar = 0.092 * Math.exp(-0.15 * va - 0.22 * walk) - 0.0045;
  let S = -40, factor = 100, Iclr = Icl, balance = 1, n = 0;
  while (Math.abs(balance) > 0.0001 && n++ < 400) {
    const fcl = 1 + 1.97 * Iclr;
    Iclr = (Icl + 0.085 / fcl) * (0.54 * Math.exp(0.075 * Math.log(ap) - 0.15 * va - 0.22 * walk) - 0.06 * Math.log(ap) + 0.5) - Iar / fcl;
    const ReT = (0.06 / im) * (Iar / fcl + Iclr);
    const E = (wetness * (psks - pa)) / ReT;
    const Hres = 0.0173 * M * (pex - pa) + 0.0014 * M * (tex - ta);
    const tcl = tsk - Iclr * (M - W - E - Hres - S);
    const hr = (0.0000000567 * 0.97 * 0.77 * ((273 + tcl) ** 4 - (273 + tr) ** 4)) / (tcl - tr);
    const hc = 1 / Iar - hr;
    const R = fcl * hr * (tcl - tr);
    const C = fcl * hc * (tcl - ta);
    balance = M - W - E - Hres - R - C - S;
    if (balance > 0) { S += factor; factor /= 2; } else S -= factor;
  }
  return S < 0 ? -40 / S : Infinity;
}

describe('the published code', () => {
  it('is what the duration limit computes, walking, wind and humidity all in', () => {
    for (const [ta, va, rh, M, clo] of [[-10, 1, 50, 90, 1.5], [-30, 5, 50, 175, 2.5], [5, 0.5, 80, 70, 0.8], [-20, 2, 50, 260, 2.0], [0, 10, 50, 145, 1.0]] as const) {
      expect(coldHours(ta, ta, va, rh, M, clo)).toBeCloseTo(dleMin(ta, ta, va, rh, M, 0, clo * 0.155, FABRIC.im, FABRIC.ap), 6);
    }
  });

  it('at an hour’s air: below 10 °C only, skin first, and as many minutes as it allows', () => {
    const air = { ta: -5, va: 1, rh: 60, windKph: 20 };
    const hours = coldHours(-5, -5, 1, 60, MET_W, 1.0);
    expect(coldVerdict(air, 1.0, 1, Math.floor(hours * 60), 'sit out')).toBeUndefined();
    expect(coldVerdict(air, 1.0, 1, Math.ceil(hours * 60) + 1, 'sit out')).toMatch(/^Dressed in 1 clo, -5 °C allows \d+ minutes to sit out/);
    expect(coldVerdict({ ...air, ta: COLD_BELOW_C }, 0.1, 1, 600, 'sit out')).toBeUndefined();
    expect(coldVerdict({ ...air, ta: COLD_BELOW_C - 0.5 }, 0.1, 1, 600, 'sit out')).toMatch(/put on more/);
    expect(coldVerdict({ ta: -30, va: 2, rh: 50, windKph: 30 }, 4, 9.3, 60, 'run')).toBe('Exposed skin freezes in 8 minutes at -30 °C in this wind.');
  });

  it('reads the wind on the body as the 10-meter wind over 1.5', () => {
    const sim = quickSave();
    const w = weatherAt(sim, sim.player.currentLocationId, sim.now)!;
    expect(airNow(sim, sim.player)!.va).toBeCloseTo(Math.max(0.4, w.windKph / 3.6 / 1.5), 9);
  });
});

describe('in Nuuk’s cold', () => {
  it('a run waits indoors, and sitting out says why', () => {
    const sim = quickSave();
    sim.player.currentLocationId = 'gl-07-nuuk';
    sim.player.homes = [];
    for (let i = 0; i < 24 * 60; i += 1) {
      const air = airNow(sim, sim.player)!;
      const w = weatherAt(sim, 'gl-07-nuuk', sim.now)!;
      if (frostbiteMinutes(air.ta, air.windKph) < 60 && !['Rain', 'Thunderstorm', 'Snow', 'Drizzle'].includes(w.condition)) break;
      sim.advanceTo(sim.now + MS_HOUR);
    }
    wear(sim, LIGHT);
    // A room with no gym, so a workout is a run or at home.
    const base = stayPlace(sim, sim.player);
    sim.player.stay = { kind: 'sublet', cityId: 'gl-07-nuuk', unit: { type: base.type, size: base.size, fixtures: { ...base.fixtures, gym: 'none' } } } as never;
    expect(trainingAt(sim, sim.player).where).toBe('home');
    expect(fineWeatherRefusal(sim, sim.player, 'sit out', SITTING_MET, 45)).toMatch(/^Exposed skin freezes/);
    expect(courtRefusal(sim, sim.player, { court: 'tennis', lit: true })).toMatch(/^Exposed skin freezes/);
  });
});

describe('the clothes worn', () => {
  it('are worth ASHRAE’s clo, summed', () => {
    expect(cloOf('coat', 'outer', 'Down Parka')).toBe(CLO.parka);
    expect(cloOf('coat', 'outer', 'Puffer Jacket')).toBe(CLO.downJacket);
    expect(cloOf('coat', 'outer', 'Wool Overcoat')).toBe(CLO.coat);
    expect(cloOf('shoes', 'shoes', 'Chelsea Boots')).toBe(CLO.boots);
    expect(cloOf('thermal-top', 'base', 'x')).toBe(CLO.longUnderwearTop);
    expect(cloOf('swimsuit', 'active', 'x')).toBe(0);
    const sim = quickSave();
    wear(sim, LIGHT);
    expect(outfitClo(sim, sim.player)).toBe(Math.round((CLO.tShirt + CLO.jeans + CLO.underwear + CLO.socks + CLO.shoes) * 100) / 100);
  });

  it('below 10 °C, a light outfit can’t sit out long, a warm one can', () => {
    const sim = quickSave();
    for (let i = 0; i < 24 * 120 && !((airNow(sim, sim.player)?.ta ?? 99) < 8 && airNow(sim, sim.player)!.ta > 3); i += 1) sim.advanceTo(sim.now + MS_HOUR);
    const air = airNow(sim, sim.player)!;
    expect(air.ta).toBeLessThan(COLD_BELOW_C);
    wear(sim, LIGHT);
    const light = coldHours(air.ta, air.ta, air.va, air.rh, MET_W, outfitClo(sim, sim.player));
    expect(light * 60).toBeLessThan(45);
    expect(coldRefusal(sim, sim.player, SITTING_MET, 45, 'sit out')).toBe(`Dressed in ${outfitClo(sim, sim.player)} clo, ${Math.round(air.ta)} °C allows ${Math.floor(light * 60)} minutes to sit out: put on more.`);
    // A run's effort keeps up.
    expect(coldRefusal(sim, sim.player, 9.3, 60, 'run')).toBeUndefined();
    wear(sim, WARM);
    const warm = coldHours(air.ta, air.ta, air.va, air.rh, MET_W, outfitClo(sim, sim.player));
    expect(warm).toBeGreaterThan(light * 1.5);
    // As long as the warm outfit allows, and no longer.
    expect(coldRefusal(sim, sim.player, SITTING_MET, Math.floor(warm * 60), 'sit out')).toBeUndefined();
    expect(coldRefusal(sim, sim.player, SITTING_MET, Math.floor(warm * 60) + 1, 'sit out')).toMatch(/put on more/);
  });
});

describe('layers', () => {
  it('a sweater over a top, and base layers of different kinds, but not two of the same', () => {
    const sim = quickSave();
    const [shirt, sweater, tee, thermal, thermal2, slip] = wear(sim, [['shirt', 'top', 'Oxford'], ['sweater', 'top', 'Merino'], ['t-shirt', 'top', 'Tee'], ['thermal-top', 'base', 'HEATTECH'], ['thermal-top', 'base', 'HEATTECH 2'], ['slip', 'base', 'Slip']]);
    expect(outfitRefusal(sim, sim.player, [shirt!.id, sweater!.id])).toBeUndefined();
    expect(outfitRefusal(sim, sim.player, [shirt!.id, tee!.id])).toBe('A sweater goes over a top; two of the rest don’t layer.');
    expect(outfitRefusal(sim, sim.player, [shirt!.id, sweater!.id, tee!.id])).toBe('A sweater goes over a top; two of the rest don’t layer.');
    expect(outfitRefusal(sim, sim.player, [thermal!.id, slip!.id])).toBeUndefined();
    expect(outfitRefusal(sim, sim.player, [thermal!.id, thermal2!.id])).toBe('One base layer of a kind.');
  });

  it('chosen, are worn with the day’s outfit: the shirt under, the sweater over', () => {
    const sim = quickSave();
    const [shirt, sweater, thermal] = wear(sim, [['shirt', 'top', 'Oxford'], ['sweater', 'top', 'Merino'], ['thermal-top', 'base', 'HEATTECH']]);
    sim.player.dressed = [sweater!.id, shirt!.id, thermal!.id];
    const day = outfitFor(sim, sim.player)!.map((g) => g.id);
    expect(day).toContain(shirt!.id);
    expect(day).toContain(sweater!.id);
    expect(day).toContain(thermal!.id);
  });

  it('thermals are sold as base layers: Uniqlo’s men’s HEATTECH Tights are long underwear', () => {
    const tights = CLOTHING_PRODUCTS.find((p) => p.retailer === 'us-uniqlo' && p.name === 'HEATTECH Tights (men)')!;
    expect([tights.slot, tights.kind]).toEqual(['base', 'thermal-bottom']);
    expect(CLOTHING_PRODUCTS.filter((p) => p.subtype === 'thermals' && p.slot === 'base').length).toBeGreaterThan(20);
    expect(CLOTHING_PRODUCTS.filter((p) => p.subtype === 'slips').every((p) => p.slot === 'base')).toBe(true);
  });
});

describe('a hat and mittens (from 2026-10-05)', () => {
  it('count Kuklane and Toma’s measured clo, a warm cap more than a cap, mittens more than gloves', () => {
    expect(cloOf('accessory', 'accessory', 'Wool Beanie')).toBe(CLO.warmCap);
    expect(cloOf('accessory', 'accessory', 'Baseball Cap')).toBe(CLO.hat);
    expect(cloOf('accessory', 'accessory', 'Ski Mittens')).toBe(CLO.mittens);
    expect(cloOf('accessory', 'accessory', 'Leather Gloves')).toBe(CLO.gloves);
    expect(cloOf('accessory', 'accessory', 'Cashmere Scarf')).toBe(0);
    expect([CLO.warmCap, CLO.hat, CLO.mittens]).toEqual([0.03, 0.01, 0.06]);
  });
});
