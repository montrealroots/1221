/**
 * A quote before care (`careQuote` in `systems/health.ts`, from
 * 2026-10-02): what a visit would cost where you are now is what its bill is.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { careFor, careQuote, shareOf } from '@/engine/systems/health';
import { saveCurrency } from '@/engine/core/money';

describe('a quote before care', () => {
  it('is the bill’s amount, at home and away', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'care-quote');
    const p = sim.player;
    const home = careQuote(sim, p, 'urgent');
    expect(home).toBe(shareOf(p, 'urgent', sim.now, saveCurrency(sim.universe)));
    expect(careFor(sim, p, { care: 'urgent', what: 'Urgent care' }, sim.now)?.amount).toBe(home);
    // In London, a visitor's price, not the plan's share at home.
    p.currentLocationId = 'uk-eng-london';
    const away = careQuote(sim, p, 'stay');
    expect(away).not.toBe(shareOf(p, 'stay', sim.now, saveCurrency(sim.universe)));
    expect(careFor(sim, p, { care: 'stay', what: 'A stay' }, sim.now)?.amount).toBe(away);
  });
});
