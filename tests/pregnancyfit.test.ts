/**
 * A pregnancy's weight (`pregnancyGainKg` in `systems/body.ts`, from
 * 2026-10-03), by the IOM's 2009 guidelines, and the clothes it makes tight,
 * a maternity garment excepted.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { IOM_GAIN, bodyDay, pregnancyGainKg } from '@/engine/systems/body';
import { SIZE_STEP, cutOf, fitKgFor, fitOf, sizeFor } from '@/engine/systems/tailoring';
import { isMaternity, productById } from '@/engine/systems/clothing';
import type { Garment } from '@/engine/systems/wardrobe';

const WEEK = 7 * MS_DAY;
const carrying = (weeksToGo: number, bmi: number) => {
  const sim = quickSave();
  const p = sim.player;
  p.body = { ...p.body!, heightCm: 170, weightKg: Math.round(bmi * 1.7 ** 2 * 10) / 10 };
  p.pregnancy = { carrier: 'you', contactId: 'c1', due: sim.now + weeksToGo * WEEK };
  return { sim, p };
};

describe('a pregnancy’s gain', () => {
  it('is the IOM’s: the first trimester’s middle by week 13, then the BMI’s weekly rate', () => {
    expect(pregnancyGainKg(carrying(27, 22).p, carrying(27, 22).sim.now)).toBe(IOM_GAIN.firstTrimesterKg);
    const term = carrying(0, 22);
    expect(pregnancyGainKg(term.p, term.sim.now)).toBe(Math.round((1.25 + 27 * 0.42) * 100) / 100);
    expect(pregnancyGainKg(term.p, term.sim.now)).toBeGreaterThanOrEqual(11.5);
    expect(pregnancyGainKg(term.p, term.sim.now)).toBeLessThanOrEqual(16);
    const heavy = carrying(0, 32);
    expect(pregnancyGainKg(heavy.p, heavy.sim.now)).toBe(Math.round((1.25 + 27 * 0.22) * 100) / 100);
    const slight = carrying(0, 17);
    expect(pregnancyGainKg(slight.p, slight.sim.now)).toBe(Math.round((1.25 + 27 * 0.51) * 100) / 100);
    // Not one's own to carry, nothing.
    term.p.pregnancy!.carrier = 'them';
    expect(pregnancyGainKg(term.p, term.sim.now)).toBe(0);
  });

  it('makes clothes tight by the third trimester, but not a maternity garment', () => {
    const { sim, p } = carrying(8, 22);
    const jeans: Garment = { kind: 'jeans', slot: 'bottom', care: 'wash', wears: 0, washes: 0, fitKg: p.body!.weightKg };
    const maternity: Garment = { ...jeans, maternity: true };
    expect(fitOf(p, jeans)).toBe('fits');
    bodyDay(p, sim.now);
    expect(p.body!.bumpKg).toBeGreaterThan(8);
    expect(fitOf(p, jeans)).toBe('small');
    expect(fitOf(p, maternity)).toBe('fits');
    delete p.pregnancy;
    bodyDay(p, sim.now);
    expect(p.body!.bumpKg).toBeUndefined();
    expect(fitOf(p, jeans)).toBe('fits');
    expect(isMaternity({ name: 'Maternity Classic Pajama Short Set' })).toBe(true);
    expect(isMaternity({ name: 'Legging maternidad' })).toBe(true);
    expect(isMaternity({ name: 'Classic Pajama Short Set' })).toBe(false);
  });
});

describe('a petite cut', () => {
  it('is chosen at M&S’s 160 cm or shorter, where the listing has one, and sized within its own run', () => {
    const sim = quickSave();
    const p = sim.player;
    const skirt = productById('us-j-crew-mini-circle-skirt-in-faux-leather')!;
    p.body = { ...p.body!, heightCm: 158 };
    const short = sizeFor(sim, p, skirt.sizes, skirt)!;
    expect(short.startsWith('PETITE ')).toBe(true);
    expect(fitKgFor(sim, p, skirt.sizes, short, skirt)).toBe(p.body!.weightKg);
    // A petite a size down is made a size lighter, within the petite run.
    const petites = cutOf(skirt.sizes, 'petite');
    const down = petites[petites.indexOf(short) - 1]!;
    expect(fitKgFor(sim, p, skirt.sizes, down, skirt)).toBeCloseTo(p.body!.weightKg / (1 + SIZE_STEP), 6);
    p.body = { ...p.body!, heightCm: 172 };
    const regular = sizeFor(sim, p, skirt.sizes, skirt)!;
    expect(regular).toBe(cutOf(skirt.sizes, 'regular').find((s) => s === regular));
    expect(cutOf(skirt.sizes, 'tall').length).toBeGreaterThan(0);
    // Sized by hand as a man, the women's petite cut isn't chosen.
    p.body = { ...p.body!, heightCm: 158 };
    p.measures = { department: 'men' };
    expect(sizeFor(sim, p, skirt.sizes, skirt)!.startsWith('PETITE ')).toBe(false);
  });
});
