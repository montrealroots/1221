/**
 * Sizing by the hips and the ring finger (from 2026-10-03): a bottom or a
 * dress by waist and hips on the retailer's own chart, and a ring by the
 * finger's circumference on H.Samuel's chart.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { productById } from '@/engine/systems/clothing';
import { RING_SIZES, chartSize, measuresRefusal, ringSize } from '@/engine/systems/tailoring';

describe('a bottom by the hips', () => {
  it('takes the size that covers both waist and hips: Zara’s balloon jeans, a 64 cm waist and 96 cm hips, a 10', () => {
    const sim = quickSave();
    const jeans = productById('gb-zara-trf-mid-waist-balloon-jeans')!;
    sim.player.measures = { department: 'women', waistCm: 64 };
    expect(chartSize(sim.player, jeans, jeans.sizes)).toBe('6');
    sim.player.measures = { department: 'women', waistCm: 64, hipCm: 96 };
    expect(chartSize(sim.player, jeans, jeans.sizes)).toBe('10');
  });
});

describe('a ring by the finger', () => {
  it('is the smallest on offer that goes round it, by US number or UK letter', () => {
    expect(RING_SIZES.find((r) => r.uk === 'Q')!.us).toBe(8);
    expect(ringSize(57, ['7', '8', '9'])).toBe('8');
    // The chart steps by UK letter: past Q's 57.15 mm comes R, US 8⅝, which a ring sold in whole US sizes doesn't offer.
    expect(ringSize(57.2, ['7', '8', '9'])).toBeUndefined();
    expect(ringSize(57.2, ['8', '8.625'])).toBe('8.625');
    expect(ringSize(52, ['L', 'N', 'P'])).toBe('N');
    expect(ringSize(52, ['S', 'M', 'L', 'One Size'])).toBeUndefined();
    expect(ringSize(60, ['M', 'S'])).toBeUndefined();
    expect(ringSize(60, ['M', 'S', 'T'])).toBe('S');
    const sim = quickSave();
    const ring = productById('ca-simons-ca-pink-stone-ring')!;
    sim.player.measures = { department: 'women', fingerMm: 56 };
    expect(chartSize(sim.player, ring, ring.sizes)).toBe('8');
    sim.player.measures = { department: 'women', fingerMm: 58 };
    expect(chartSize(sim.player, ring, ring.sizes)).toBeUndefined();
    expect(measuresRefusal({ department: 'women', fingerMm: 20 })).toBe('A finger in millimeters around, from 35 to 80.');
  });
});
