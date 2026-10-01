/**
 * Drinking (`systems/alcohol.ts`, `content/alcohol.ts`, from 2026-10-01):
 * Widmark's blood alcohol and NHTSA's hourly fall, the age to be served,
 * a pint at a bar, the mood below the binge line and a hangover over it,
 * NHTSA's crash risk, and a drive over the line ending as each
 * jurisdiction's first offense does.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { WIDMARK } from '@/engine/content/alcohol';
import { bodyOf } from '@/engine/systems/body';
import { crashChance, drive, driveInjuryChance } from '@/engine/systems/driving';
import { bacAt, crashRiskAt, drinkPints, drinkRefusal, hangover, impairedDrive, pintGrams } from '@/engine/systems/alcohol';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('blood alcohol', () => {
  it('is Widmark’s grams over the body’s water, and falls at NHTSA’s 0.017 an hour', () => {
    const sim = life('us-ny-newyork', 'bac');
    bodyOf(sim, sim.player).weightKg = 70;
    const grams = 473 * 0.05 * 0.789;
    expect(pintGrams('us-ny-newyork')).toBeCloseTo(grams, 6);
    expect(pintGrams('uk-eng-london')).toBeCloseTo(568 * 0.04 * 0.789, 6);
    drinkPints(sim, sim.player, 2, sim.now);
    const bac = (2 * grams) / (WIDMARK.r * 70 * 10);
    expect(bacAt(sim.player, sim.now)).toBeCloseTo(bac, 6);
    expect(bacAt(sim.player, sim.now + 2 * MS_HOUR)).toBeCloseTo(bac - 0.034, 6);
    expect(bacAt(sim.player, sim.now + 24 * MS_HOUR)).toBe(0);
    // Heavier, the same pints run lower.
    const heavy = life('us-ny-newyork', 'bac-heavy');
    bodyOf(heavy, heavy.player).weightKg = 100;
    drinkPints(heavy, heavy.player, 2, heavy.now);
    expect(bacAt(heavy.player, heavy.now)).toBeLessThan(bac);
  });

  it('carries NHTSA’s crash risk: under 1 at 0.01, 3.93 at 0.08, 23.29 past 0.20', () => {
    expect(crashRiskAt(0)).toBe(1);
    expect(crashRiskAt(0.015)).toBe(0.54);
    expect(crashRiskAt(0.08)).toBe(3.93);
    expect(crashRiskAt(0.35)).toBe(23.29);
  });
});

describe('a bar', () => {
  it('serves from the country’s age: 21 in America, 19 in Ontario, 18 in Britain', () => {
    const young = life('us-ny-newyork', 'age-ny');
    young.player.birthInstant = young.now - 20.5 * 365.2425 * MS_DAY;
    expect(drinkRefusal(young, young.player, 1)).toBe('You have to be 21 to be served here.');
    const toronto = life('ca-on-toronto', 'age-to');
    toronto.player.birthInstant = toronto.now - 19.5 * 365.2425 * MS_DAY;
    expect(drinkRefusal(toronto, toronto.player, 1)).toBeUndefined();
    toronto.player.birthInstant = toronto.now - 18.5 * 365.2425 * MS_DAY;
    expect(drinkRefusal(toronto, toronto.player, 1)).toBe('You have to be 19 to be served here.');
    const london = life('uk-eng-london', 'age-ldn');
    london.player.birthInstant = london.now - 18.5 * 365.2425 * MS_DAY;
    expect(drinkRefusal(london, london.player, 1)).toBeUndefined();
    expect(drinkRefusal(london, london.player, 9)).toBe('From one to eight.');
  });

  it('pours a pint at Numbeo’s price, half an hour each, and eases the evening', () => {
    const sim = life('us-ny-newyork', 'bar');
    sim.player.birthInstant = sim.now - 30 * 365.2425 * MS_DAY;
    sim.player.wellbeing.stress = 50;
    const before = bank(sim);
    const start = sim.now;
    const r = sim.must<{ paid: number; bac: number }>({ kind: 'food.drink', payload: { pints: 2 } });
    expect(before - bank(sim)).toBe(1600);
    expect(sim.now - start).toBe(60 * 60_000);
    expect(r.bac).toBeGreaterThan(0.03);
    expect(sim.player.wellbeing.stress).toBeLessThan(50);
    // Two pints under the binge line, each easing stress by two (an estimate), on what the hour itself did.
    const calm = life('us-ny-newyork', 'calm');
    calm.player.wellbeing.stress = 50;
    drinkPints(calm, calm.player, 2, calm.now);
    expect(calm.player.wellbeing.stress).toBe(46);
  });

  it('a night over the binge line is a hangover the next morning; one under it isn’t', () => {
    const sim = life('us-ny-newyork', 'hangover');
    drinkPints(sim, sim.player, 6, sim.now);
    const energy = sim.player.wellbeing.energy;
    expect(hangover(sim.player, sim.now + 10 * MS_HOUR)).toBe(true);
    expect(sim.player.wellbeing.energy).toBe(Math.max(0, energy - 10));
    // Once.
    expect(hangover(sim.player, sim.now + 11 * MS_HOUR)).toBe(false);
    const light = life('us-ny-newyork', 'no-hangover');
    drinkPints(light, light.player, 1, light.now);
    expect(hangover(light.player, light.now + 10 * MS_HOUR)).toBe(false);
  });
});

describe('a drive over the line', () => {
  it('carries NHTSA’s crash risk for the blood alcohol at the time, and an arrest about one drive in eighty', () => {
    const sim = life('us-ny-newyork', 'drive');
    const sober = driveInjuryChance(sim.player, 1000, sim.now);
    expect(sober).toBeCloseTo(crashChance(sim.player, 1000, sim.now), 12);
    sim.player.alcohol = { bac: 0.08, at: sim.now, peak: 0.08, peakAt: sim.now };
    expect(driveInjuryChance(sim.player, 1000, sim.now)).toBeCloseTo(crashChance(sim.player, 1000, sim.now, 'car', 3.93), 12);
    // Two thousand drives at 0.10, each drawn on its own: about twenty-five arrests.
    let arrests = 0;
    for (let k = 0; k < 2000; k += 1) {
      sim.player.alcohol = { bac: 0.1, at: sim.now, peak: 0.1, peakAt: sim.now };
      if (sim.player.driving) delete sim.player.driving.suspendedUntil;
      drive(sim, sim.player, 'US-NY', 1, sim.now, `k-${k}`);
      if (sim.player.driving?.suspendedUntil) arrests += 1;
    }
    expect(arrests).toBeGreaterThan(10);
    expect(arrests).toBeLessThan(45);
  });

  it('ends, when stopped, in New York’s DWI: $750 and six months', () => {
    const sim = life('us-ny-newyork', 'dwi');
    sim.player.alcohol = { bac: 0.1, at: sim.now, peak: 0.1, peakAt: sim.now };
    const before = bank(sim);
    expect(impairedDrive(sim, sim.player, 'US-NY', sim.now, 'k', 1)).toBe(true);
    expect(before - bank(sim)).toBe(75000);
    expect(sim.player.driving!.suspendedUntil! - sim.now).toBeCloseTo(6 * 30.4375 * MS_DAY, -3);
  });

  it('isn’t an offense under the line, and in Mexico City it’s El Torito', () => {
    const sim = life('us-ny-newyork', 'under');
    sim.player.alcohol = { bac: 0.04, at: sim.now, peak: 0.04, peakAt: sim.now };
    expect(impairedDrive(sim, sim.player, 'US-NY', sim.now, 'k', 1)).toBe(false);
    const cdmx = life('mx-cmx-mexicocity', 'torito');
    cdmx.player.alcohol = { bac: 0.09, at: cdmx.now, peak: 0.09, peakAt: cdmx.now };
    expect(impairedDrive(cdmx, cdmx.player, 'MX-CMX', cdmx.now, 'k', 1)).toBe(true);
    expect(cdmx.universe.scheduled.some((i) => i.kind === 'alcohol.arrest' && i.durationMinutes === 36 * 60)).toBe(true);
    // Ireland's court fine isn't kept: a suspension, no fine charged.
    const dublin = life('ie-lei-dublin', 'court');
    dublin.player.alcohol = { bac: 0.12, at: dublin.now, peak: 0.12, peakAt: dublin.now };
    const before = bank(dublin);
    expect(impairedDrive(dublin, dublin.player, 'IE', dublin.now, 'k', 1)).toBe(true);
    expect(bank(dublin)).toBe(before);
    expect(dublin.player.driving!.suspendedUntil).toBeGreaterThan(dublin.now);
  });
});
