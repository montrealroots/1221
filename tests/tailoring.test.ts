/**
 * Clothes that fit, and a tailor who takes them in (`systems/tailoring.ts`,
 * `content/tailors.ts`, from 2026-10-01): a size's step either side of the
 * weight a garment was bought for, a garment that doesn't fit not worn, one
 * grown out of bought again, and one too big taken in at a named tailor's
 * price and days.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { garmentsOf, wearable, type Garment } from '@/engine/systems/wardrobe';
import { replaceWornOut } from '@/engine/systems/clothing';
import { SIZE_STEP, alterCost, alterRefusal, alteredKg, fitOf, tailorById, tailorsIn } from '@/engine/systems/tailoring';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const g = (slot: Garment['slot'], fitKg?: number): Garment => ({ kind: 'tshirt', slot, care: 'wash', wears: 0, washes: 0, ...(fitKg !== undefined ? { fitKg } : {}) });
const weigh = (sim: Simulation, kg: number) => { sim.player.body = { ...(sim.player.body ?? { heightCm: 175, habitKcal: 2_200, intake: 0, extra: 0 }), weightKg: kg } as never; };
const top = (sim: Simulation) => garmentsOf(sim.player).find((x) => x.garment.slot === 'top')!;

describe('fit', () => {
  it('is a size’s step either side of the weight it was bought for; shoes and an older garment always fit', () => {
    const sim = life('us-ny-newyork', 'fit-band');
    weigh(sim, 80);
    expect(fitOf(sim.player, g('top', 80 / 1.075))).toBe('fits');
    expect(fitOf(sim.player, g('top', 80 / 1.08))).toBe('small');
    expect(fitOf(sim.player, g('top', 80 / 1.078))).toBe('small');
    expect(fitOf(sim.player, g('top', 80 / 0.92))).toBe('big');
    expect(fitOf(sim.player, g('shoes', 50))).toBe('fits');
    expect(fitOf(sim.player, g('top'))).toBe('fits');
  });

  it('is kept from the body a garment was bought for, and one that doesn’t fit isn’t worn', () => {
    const sim = life('us-ny-newyork', 'fit-wear');
    const kg = sim.player.body!.weightKg;
    const t = top(sim);
    expect(t.garment.fitKg).toBe(kg);
    expect(wearable(sim, sim.player, t)).toBe(true);
    weigh(sim, kg * 1.1);
    expect(wearable(sim, sim.player, t)).toBe(false);
  });

  it('grown out of, is bought again as a worn-out garment is', () => {
    const sim = life('us-ny-newyork', 'fit-replace');
    const kg = sim.player.body!.weightKg;
    const before = garmentsOf(sim.player).length;
    const t = top(sim);
    weigh(sim, kg * 1.2);
    expect(replaceWornOut(sim, sim.player)).toBeGreaterThan(0);
    expect(garmentsOf(sim.player).some((x) => x.id === t.id)).toBe(false);
    expect(garmentsOf(sim.player).length).toBeGreaterThanOrEqual(before - 1);
    expect(garmentsOf(sim.player).filter((x) => x.garment.slot === 'top').every((x) => fitOf(sim.player, x.garment) === 'fits')).toBe(true);
  });
});

describe('a tailor', () => {
  it('takes in what’s too big, and lets out no top, in the town you’re in', () => {
    const sim = life('us-ny-newyork', 'tl-refuse');
    const kg = sim.player.body!.weightKg;
    const t = top(sim);
    const shop = tailorsIn('us-ny-newyork')[0]!;
    expect(alterRefusal(sim.player, t.id, shop.id)).toBe('It fits.');
    weigh(sim, kg * 1.2);
    // Proper Cloth gives no shirt's figure for letting out.
    expect(alterRefusal(sim.player, t.id, shop.id)).toBe('A tailor can’t let it out.');
    weigh(sim, kg * 0.85);
    expect(alterRefusal(sim.player, t.id, shop.id)).toBeUndefined();
    expect(alterRefusal(sim.player, t.id, tailorsIn('uk-eng-london')[0]!.id)).toBe('The tailor is in another town.');
    // Away at the dry cleaner, it isn't to hand to take in, nor bought again meanwhile.
    t.at = { kind: 'service', serviceId: 'drycleaner:us-ny-newyork', readyAt: sim.now + 2 * MS_DAY };
    expect(alterRefusal(sim.player, t.id, shop.id)).toBe('It’s away already.');
    replaceWornOut(sim, sim.player);
    expect(garmentsOf(sim.player).some((x) => x.id === t.id)).toBe(true);
  });

  it('charges its price and keeps it its stated days, a week where none is stated, then it fits', () => {
    const sim = life('us-ny-newyork', 'tl-alter');
    const kg = sim.player.body!.weightKg;
    const t = top(sim);
    weigh(sim, kg * 0.85);
    const shop = tailorById('mid-city-tailoring-us-ny-newyork')!;
    expect(shop.turnaroundDays).toBe(14);
    const r = sim.execute<{ readyAt: number; paid: number }>({ kind: 'clothes.alter', payload: { itemId: t.id, tailorId: shop.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(alterCost(sim, shop));
    expect(r.value!.readyAt - sim.now).toBe(14 * MS_DAY);
    expect(fitOf(sim.player, t.garment)).toBe('fits');
    expect(wearable(sim, sim.player, t)).toBe(false);
    // A tailor that states no days: a week.
    const other = tailorById('east-side-tailor-us-ny-newyork')!;
    expect(other.turnaroundDays).toBeNull();
    const t2 = garmentsOf(sim.player).find((x) => x.garment.slot === 'bottom' && fitOf(sim.player, x.garment) === 'big')!;
    const r2 = sim.execute<{ readyAt: number }>({ kind: 'clothes.alter', payload: { itemId: t2.id, tailorId: other.id } });
    expect(r2.value!.readyAt - sim.now).toBe(7 * MS_DAY);
    sim.advanceBy(15 * MS_DAY);
    expect(sim.execute({ kind: 'clothes.collect', payload: {} }).ok).toBe(true);
    expect(t.at.kind).toBe('home');
    expect(wearable(sim, sim.player, t) || t.garment.dirty || t.garment.dryUntil !== undefined).toBe(true);
  });
});

describe('letting out', () => {
  const bottomOf = (sim: Simulation) => garmentsOf(sim.player).find((x) => x.garment.slot === 'bottom')!;

  it('lets a bottom out three quarters of a size, once, by Proper Cloth’s 1.5 inches of a 2-inch step', () => {
    const sim = life('us-ny-newyork', 'lo-bottom');
    const b = bottomOf(sim);
    const made = b.garment.fitKg!;
    const shop = tailorsIn('us-ny-newyork')[0]!;
    // Grown a size and a little: past what its seams give.
    weigh(sim, made * (1 + SIZE_STEP * 0.75 + 0.075 + 0.01));
    expect(alterRefusal(sim.player, b.id, shop.id)).toBe('It can’t be let out that far.');
    // Within it: let out to as far as it goes, and it fits.
    weigh(sim, made * 1.15);
    expect(alterRefusal(sim.player, b.id, shop.id)).toBeUndefined();
    const r = sim.execute<{ paid: number }>({ kind: 'clothes.alter', payload: { itemId: b.id, tailorId: shop.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(alterCost(sim, shop));
    expect(b.garment.fitKg).toBeCloseTo(Math.min(made * 1.15, made * (1 + 0.75 * SIZE_STEP)), 6);
    expect(fitOf(sim.player, b.garment)).toBe('fits');
    expect(b.garment.letOut).toBe(true);
    expect(Object.values(sim.universe.transactions).some((t) => t.memo === `${shop.name}, let out`)).toBe(true);
    // Its spare cloth used, it doesn't let out again.
    b.at = { kind: 'home', home: 'x', spot: 'drawers' };
    weigh(sim, made * 1.3);
    expect(alterRefusal(sim.player, b.id, shop.id)).toBe('It’s been let out as far as its seams go.');
  });

  it('takes a bottom in a size at most, as far as it goes toward the body', () => {
    const sim = life('us-ny-newyork', 'lo-in');
    const b = bottomOf(sim);
    const made = b.garment.fitKg!;
    weigh(sim, made * 0.7);
    expect(alterRefusal(sim.player, b.id, tailorsIn('us-ny-newyork')[0]!.id)).toBe('It can’t be taken in that far.');
    expect(alteredKg(sim.player, b.garment)).toBeCloseTo(made * (1 - SIZE_STEP), 6);
  });
});
