/**
 * Jet lag (`systems/jetlag.ts`, from 2026-09-29): the body keeps the clock
 * it left with, catches up at the CDC's rates, and sleeps worse until it has.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { JET_LAG, arrive, hoursOut, jetLagLoss } from '@/engine/systems/jetlag';
import { sleepQuality } from '@/engine/systems/life';

const JUNE = Date.UTC(2027, 5, 10, 12);

describe('the body’s clock', () => {
  it('is left five hours out flying New York to London, and catches up an hour a day', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'jet-east');
    arrive(sim.player, 'America/New_York', 'Europe/London', JUNE);
    expect(sim.player.bodyClock!.hours).toBe(5);
    expect(hoursOut(sim.player.bodyClock, JUNE + 2 * MS_DAY)).toBe(3);
    expect(hoursOut(sim.player.bodyClock, JUNE + 6 * MS_DAY)).toBe(0);
  });

  it('flying west catches up an hour and a half a day, and costs a night half as much', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'jet-west');
    arrive(sim.player, 'Europe/London', 'America/Los_Angeles', JUNE);
    expect(sim.player.bodyClock!.hours).toBe(-8);
    expect(hoursOut(sim.player.bodyClock, JUNE + 2 * MS_DAY)).toBe(-5);
    expect(jetLagLoss(sim.player, JUNE)).toBeCloseTo(8 * JET_LAG.westLossPerHour, 10);
  });

  it('folds a second journey into the first, and a round trip the same day leaves nothing', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'jet-fold');
    arrive(sim.player, 'America/New_York', 'Europe/London', JUNE);
    arrive(sim.player, 'Europe/London', 'America/New_York', JUNE);
    expect(sim.player.bodyClock).toBeUndefined();
    // Twelve hours is the most a body can be out.
    arrive(sim.player, 'America/Los_Angeles', 'Asia/Tokyo', JUNE);
    // Sixteen hours east is eight west.
    expect(sim.player.bodyClock!.hours).toBe(-8);
    arrive(sim.player, 'Asia/Tokyo', 'Europe/London', JUNE);
    expect(Math.abs(sim.player.bodyClock!.hours)).toBeLessThanOrEqual(12);
  });

  it('makes a night in London after New York sleep worse, and the week after not at all', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'jet-night');
    const before = sleepQuality(sim, sim.player, sim.now);
    arrive(sim.player, 'America/New_York', 'Europe/London', sim.now);
    expect(jetLagLoss(sim.player, sim.now)).toBeCloseTo(0.075, 10);
    expect(sleepQuality(sim, sim.player, sim.now)).toBeLessThan(before);
    expect(sleepQuality(sim, sim.player, sim.now + 7 * MS_DAY)).toBe(sleepQuality(sim, { ...sim.player, bodyClock: undefined }, sim.now + 7 * MS_DAY));
  });
});
