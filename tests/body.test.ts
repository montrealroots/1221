/**
 * A body's height and weight (2026-09-28): drawn from the birth country's
 * adults, moved by what's eaten against what's spent at Hall's pace, and
 * read by the onset of conditions and the end of a life.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Person } from '@/engine/domain/model';
import { BODY, bmiHazard, onsetYearly } from '@/engine/content/body';
import { bmiOf, bodyDay, bodyOf, eatsOut, eatsShort, exerts, restingKcal, settle } from '@/engine/systems/body';
import { chanceOfEndingYear } from '@/engine/systems/mortality';

const YEAR = 365.2425 * 86_400_000;
const at = Date.UTC(2026, 0, 5);
const person = (age = 27) => ({ id: 'p', birthInstant: at - age * YEAR, personalityTraits: [], personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 }, wellbeing: { condition: 80 } } as unknown as Person);
/** A year of days eating the day's points, with something more or less each day. */
function year(p: Person, extraKcal: number, days = 365): void {
  for (let d = 0; d < days; d += 1) {
    p.body!.intake += extraKcal;
    bodyDay(p, at + d * 86_400_000);
  }
}

describe('a body', () => {
  it('is drawn from the birth country’s adults: taller in Iceland than in Japan, heavier in the US than in Japan', () => {
    const mean = (city: string, f: (p: Person) => number) => {
      let sum = 0;
      for (let i = 0; i < 60; i += 1) {
        const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true }, `body-${city}-${i}`);
        delete sim.player.body;
        sum += f(Object.assign(sim.player, { body: bodyOf(sim, sim.player) }));
      }
      return sum / 60;
    };
    expect(mean('is-39-mosfellsbr', (p) => p.body!.heightCm)).toBeGreaterThan(mean('jp-13-tokyo', (p) => p.body!.heightCm) + 5);
    expect(mean('us-ny-newyork', (p) => bmiOf(p.body!))).toBeGreaterThan(mean('jp-13-tokyo', (p) => bmiOf(p.body!)) + 3);
    // The country's adults, both sides of them: a spread of heights wider than either side's own 6.3 cm.
    const heights: number[] = [];
    for (let i = 0; i < 80; i += 1) {
      const sim = quickSave({ startLocationId: 'is-39-mosfellsbr', homeRegionId: 'is-39-mosfellsbr', livesWhereBorn: true }, `spread-${i}`);
      delete sim.player.body;
      heights.push(bodyOf(sim, sim.player).heightCm);
    }
    const m = heights.reduce((a, b) => a + b, 0) / heights.length;
    expect(Math.sqrt(heights.reduce((a, b) => a + (b - m) ** 2, 0) / heights.length)).toBeGreaterThan(7.5);
  });

  it('holds its weight on the life it starts with, and gains as the years slow its rest, about 0.29 kg a year', () => {
    const p = person();
    p.body = settle({ heightCm: 170, weightKg: 70 }, p, at);
    year(p, 0, 30);
    expect(Math.abs(p.body.weightKg - 70)).toBeLessThan(0.05);
    // Ten years on, the same eating: rest is 50 kcal less a day at 1.4.
    const older = person(37);
    older.body = { ...settle({ heightCm: 170, weightKg: 70 }, person(27), at) };
    for (let y = 0; y < 3; y += 1) year(older, 0);
    expect(older.body.weightKg).toBeGreaterThan(70.5);
  });

  it('moves by Hall’s rule: a lasting 100 kJ a day is a kilogram in the end, half of it in about a year', () => {
    const p = person();
    p.body = settle({ heightCm: 170, weightKg: 70 }, p, at);
    year(p, BODY.kcalPerKgDay);
    expect(p.body.weightKg - 70).toBeGreaterThan(0.4);
    expect(p.body.weightKg - 70).toBeLessThan(0.6);
    for (let y = 0; y < 4; y += 1) year(p, BODY.kcalPerKgDay);
    expect(p.body.weightKg - 70).toBeGreaterThan(0.9);
    expect(p.body.weightKg - 70).toBeLessThan(1.05);
  });

  it('loses on days it can’t pay for', () => {
    const p = person();
    p.body = settle({ heightCm: 170, weightKg: 70 }, p, at);
    for (let d = 0; d < 60; d += 1) { eatsShort(p); bodyDay(p, at + d * 86_400_000); }
    expect(p.body.weightKg).toBeLessThan(69);
  });

  it('gains on meals eaten out, and spends by an hour’s MET value', () => {
    const out = person();
    out.body = settle({ heightCm: 170, weightKg: 70 }, out, at);
    const home = person();
    home.body = settle({ heightCm: 170, weightKg: 70 }, home, at);
    const runner = person();
    runner.body = settle({ heightCm: 170, weightKg: 70 }, runner, at);
    for (let d = 0; d < 365; d += 1) {
      eatsOut(out);
      exerts(runner, BODY.met.run, 0.5);
      for (const p of [out, home, runner]) bodyDay(p, at + d * 86_400_000);
    }
    expect(out.body.weightKg).toBeGreaterThan(home.body.weightKg + 2);
    expect(runner.body.weightKg).toBeLessThan(home.body.weightKg - 2);
    expect(restingKcal(70, 170, 27)).toBeCloseTo(10 * 70 + 6.25 * 170 - 5 * 27 - 78, 6);
  });
});

describe('what the weight raises', () => {
  it('raises diabetes, high blood pressure and arthritis by Guh’s ratios, over the published average', () => {
    expect(onsetYearly('diabetes', 30, 32) / onsetYearly('diabetes', 30, 22)).toBeCloseTo((6.74 + 12.41) / 2, 6);
    expect(onsetYearly('hypertension', 30, 27) / onsetYearly('hypertension', 30, 22)).toBeCloseTo((1.28 + 1.65) / 2, 6);
    // The CDC's rate is the average over the weights.
    const mix = 0.3415 * onsetYearly('diabetes', 30, 22) + 0.2915 * onsetYearly('diabetes', 30, 27) + 0.367 * onsetYearly('diabetes', 30, 32);
    expect(mix).toBeCloseTo(0.003, 6);
    expect(onsetYearly('diabetes', 50, 22)).toBeGreaterThan(onsetYearly('diabetes', 30, 22));
  });

  it('raises the chance of the end by the Global BMI Mortality Collaboration’s bands', () => {
    expect(bmiHazard(23)).toBe(1);
    expect(bmiHazard(32)).toBe(1.45);
    expect(bmiHazard(17)).toBe(1.51);
    const lean = person(40);
    lean.body = settle({ heightCm: 170, weightKg: 66 }, lean, at);
    const heavy = person(40);
    heavy.body = settle({ heightCm: 170, weightKg: 120 }, heavy, at);
    expect(chanceOfEndingYear(heavy, 40, 'us') / chanceOfEndingYear(lean, 40, 'us')).toBeCloseTo(2.76, 6);
  });
});
