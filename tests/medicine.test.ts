/**
 * A chronic condition's medicine as a supply (`fillMedicine` in
 * `systems/health.ts`, from 2026-10-02): a fill lasts 28 days in England and
 * 30 in America, refilled where you live with a week left; away past it, the
 * condition goes untreated; a longer supply before a trip.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { armHealth, extraSupplyRefusal, fillMedicine, healthOf, keptUp, longestFillOf, renewPrescriptions, rxShareOf, rxValidUntil } from '@/engine/systems/health';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('medicine for a condition', () => {
  it('fills 28 days in England, 30 in America, and only with a week left', () => {
    const ldn = life('uk-eng-london', 'rx-ldn');
    const h = healthOf(ldn.player);
    h.chronic = { hypertension: { treated: true } };
    fillMedicine(ldn, ldn.player, ldn.now);
    expect(h.chronic.hypertension!.supplyUntil).toBe(ldn.now + 28 * MS_DAY);
    // Three weeks left: not yet.
    expect(fillMedicine(ldn, ldn.player, ldn.now + 7 * MS_DAY)).toBe(0);
    expect(h.chronic.hypertension!.supplyUntil).toBe(ldn.now + 28 * MS_DAY);
    // Two weeks left, the repeat is ordered from the GP, and collected five working days on (from 2026-10-03).
    expect(fillMedicine(ldn, ldn.player, ldn.now + 14 * MS_DAY)).toBe(0);
    const ready = h.chronic.hypertension!.orderedReadyAt!;
    expect(ready - (ldn.now + 14 * MS_DAY)).toBeGreaterThanOrEqual(7 * MS_DAY);
    fillMedicine(ldn, ldn.player, ready - 60_000);
    expect(h.chronic.hypertension!.supplyUntil).toBe(ldn.now + 28 * MS_DAY);
    fillMedicine(ldn, ldn.player, ready);
    expect(h.chronic.hypertension!.supplyUntil).toBe(ldn.now + 56 * MS_DAY);
    expect(h.chronic.hypertension!.orderedReadyAt).toBeUndefined();
    const ny = life('us-ny-newyork', 'rx-ny');
    healthOf(ny.player).chronic = { hypertension: { treated: true } };
    fillMedicine(ny, ny.player, ny.now);
    expect(healthOf(ny.player).chronic!.hypertension!.supplyUntil).toBe(ny.now + 30 * MS_DAY);
  });

  it('in British Columbia is good for two years, then waits for a doctor to renew it', () => {
    const sim = life('ca-bc-vancouver', 'rx-bc');
    const h = healthOf(sim.player);
    h.chronic = { hypertension: { treated: true } };
    fillMedicine(sim, sim.player, sim.now);
    const state = h.chronic.hypertension!;
    expect(rxValidUntil(sim.player, state)).toBeGreaterThan(sim.now + 729 * MS_DAY);
    expect(rxValidUntil(sim.player, state)).toBeLessThan(sim.now + 732 * MS_DAY);
    const late = sim.now + 731 * MS_DAY;
    state.supplyUntil = late + 2 * MS_DAY;
    expect(fillMedicine(sim, sim.player, late)).toBe(0);
    expect(state.supplyUntil).toBe(late + 2 * MS_DAY);
    expect(h.appointments?.length || h.owedVisit).toBeTruthy();
    // The doctor's visit booked, and kept, renews it.
    const visit = h.appointments![0]!;
    expect(visit.what).toBe('A prescription to renew');
    sim.advanceTo(visit.at + 2 * 60 * 60_000);
    expect(state.prescribedAt).toBe(visit.at);
    // A visit kept renews it.
    renewPrescriptions(sim.player, late);
    fillMedicine(sim, sim.player, late);
    expect(state.supplyUntil).toBe(late + 32 * MS_DAY);
    // Ontario's Drug Benefit's most before a trip, 100 days, which until 2026-10-03 never applied.
    expect(longestFillOf(life('ca-on-toronto', 'rx-on').player)).toBe(100);
    // New York sets no such date.
    const ny = life('us-ny-newyork', 'rx-ny-valid');
    expect(rxValidUntil(ny.player, { treated: true, prescribedAt: ny.now })).toBeUndefined();
  });

  it('runs out away from home, and the condition goes untreated', () => {
    const sim = life('us-ny-newyork', 'rx-away');
    armHealth(sim, sim.player);
    const h = healthOf(sim.player);
    h.chronic = { depression: { treated: true } };
    fillMedicine(sim, sim.player, sim.now);
    const state = h.chronic.depression!;
    expect(keptUp(state, sim.now + 29 * MS_DAY)).toBe(true);
    expect(keptUp(state, sim.now + 31 * MS_DAY)).toBe(false);
    expect(keptUp({ treated: true }, sim.now)).toBe(true);
    expect(keptUp({ treated: true, lapsed: true }, sim.now)).toBe(false);
    // The weekly refill is had only at home: there, forty days on, it's kept; away, it runs out.
    const home = life('us-ny-newyork', 'rx-away');
    armHealth(home, home.player);
    healthOf(home.player).chronic = { depression: { treated: true } };
    fillMedicine(home, home.player, home.now);
    home.advanceBy(40 * MS_DAY);
    expect(keptUp(healthOf(home.player).chronic!.depression, home.now)).toBe(true);
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceBy(40 * MS_DAY);
    expect(keptUp(state, sim.now)).toBe(false);
  });

  it('fills a longer supply before a trip: 56 days in England at one item’s charge, 90 in America at three fills’', () => {
    const ldn = life('uk-eng-london', 'rx-long-ldn');
    healthOf(ldn.player).chronic = { hypertension: { treated: true } };
    expect(longestFillOf(ldn.player)).toBe(56);
    const one = rxShareOf(ldn.player, false, ldn.now, 'GBP');
    expect(ldn.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 56 } }).paid).toBe(one);
    const ny = life('us-ny-newyork', 'rx-long-ny');
    healthOf(ny.player).chronic = { hypertension: { treated: true } };
    expect(longestFillOf(ny.player)).toBe(90);
    const fill = rxShareOf(ny.player, false, ny.now, 'USD');
    expect(ny.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 90 } }).paid).toBe(3 * fill);
    expect(healthOf(ny.player).chronic!.hypertension!.supplyUntil).toBe(ny.now + 90 * MS_DAY);
    // A further one adds to what's left.
    ny.must({ kind: 'health.extra_supply', payload: { days: 30 } });
    expect(healthOf(ny.player).chronic!.hypertension!.supplyUntil).toBe(ny.now + 120 * MS_DAY);
    expect(extraSupplyRefusal(ny.player, 91)).toBe('At most 90 days at once here.');
    ny.player.currentLocationId = 'us-ca-losangeles';
    expect(extraSupplyRefusal(ny.player, 30)).toBe('It’s filled at the pharmacy where you live.');
    healthOf(ny.player).chronic = {};
    expect(extraSupplyRefusal(ny.player, 30)).toBe('You take no medicine for a condition.');
  });
});
