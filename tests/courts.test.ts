/**
 * Courts at home (`content/homes.ts`, `systems/dwelling.ts`, from
 * 2026-10-01): built by surface at Fixr's prices on a lot big enough, played
 * on in the fine weather and in daylight unless lit, at the Compendium's
 * METs, and a tennis court's upkeep in the month's bills.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import type { Feature, Fixtures } from '@/engine/content/homes';
import { PROJECTS } from '@/engine/content/homes';
import { CITIES } from '@/engine/content/geography';
import { sunTimes } from '@/engine/core/sun';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { courtAt, courtRefusal, weatherNow } from '@/engine/systems/dwelling';
import { billsOf } from '@/engine/systems/household';
import { lookAfterRefusal } from '@/engine/systems/life';

const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };
const LA = 'us-ca-losangeles';
const home = (features: Feature[], seed = 'courts') => {
  const sim = quickSave({ startLocationId: LA, homeRegionId: LA, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 1_800, built: 2000, features: ['yard', ...features], parts: {}, hoaUsd: 0, fixtures: bare, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: LA, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = LA;
  return sim;
};
/** The next hour, from now, that's fine to play in, in daylight or after dark. */
const nextHour = (sim: Simulation, daylight: boolean): number => {
  const c = CITIES.require(LA);
  for (let t = sim.now; t < sim.now + 60 * 24 * MS_HOUR; t += MS_HOUR) {
    sim.advanceTo(t);
    const w = weatherNow(sim, sim.player);
    const sun = sunTimes(t, c.latitude, c.longitude, c.timeZone);
    const light = t >= sun.sunrise! && t < sun.sunset!;
    if (w && !/rain|snow|storm|drizzle|shower|sleet/i.test(w.condition) && w.highC > 5 && w.highC < 30 && light === daylight) return t;
  }
  throw new Error('no such hour');
};

describe('a court', () => {
  it('is built by its surface at Fixr’s middle, on a lot big enough', () => {
    const tennis = PROJECTS.filter((p) => p.id.startsWith('tennis-') && p.id !== 'tennis-lights');
    expect(tennis.map((p) => p.usd)).toEqual([47_500, 52_500, 60_000, 62_500, 75_000, 82_500, 87_500]);
    expect(tennis.every((p) => p.lot === 130 * 55 && p.adds?.gains?.includes('tennisCourt'))).toBe(true);
    expect(PROJECTS.find((p) => p.id === 'basketball-half')).toMatchObject({ usd: (15_500 + 40_000) / 2, lot: 47 * 50 });
    expect(PROJECTS.find((p) => p.id === 'tennis-lights')).toMatchObject({ needs: ['tennisCourt'] });
  });

  it('is played on in the daylight, or after dark where it’s lit, and not where there’s none', () => {
    const none = home([]);
    expect(courtRefusal(none, none.player)).toBe('You have no court.');
    const dark = home(['tennisCourt']);
    nextHour(dark, false);
    expect(courtRefusal(dark, dark.player)).toBe('It’s dark, and the court has no lights.');
    nextHour(dark, true);
    expect(courtRefusal(dark, dark.player)).toBeUndefined();
    const lit = home(['tennisCourt', 'tennisLights']);
    nextHour(lit, false);
    expect(courtRefusal(lit, lit.player)).toBeUndefined();
    expect(courtAt(lit.player)).toEqual({ court: 'tennis', lit: true });
    // A wet hour, lit or not, isn't one for the court.
    for (let t = lit.now; t < lit.now + 365 * 24 * MS_HOUR; t += MS_HOUR) {
      lit.advanceTo(t);
      if (/rain|storm|drizzle|shower/i.test(weatherNow(lit, lit.player)!.condition)) break;
    }
    expect(courtRefusal(lit, lit.player)).toBe('It isn’t a day for the court.');
    expect(courtAt(home(['basketballCourt', 'basketballLights']).player)).toEqual({ court: 'basketball', lit: true });
  });

  it('builds fitness as a run does, at its own METs: tennis harder than shooting baskets', () => {
    const play = (court: Feature) => {
      const lights: Feature[] = court === 'tennisCourt' ? ['tennisLights'] : court === 'basketballCourt' ? ['basketballLights'] : [];
      const sim = home([court, ...lights], 'courts-play');
      nextHour(sim, true);
      Object.assign(sim.player.wellbeing, { fitness: 40, energy: 80, stress: 50 });
      expect(lookAfterRefusal(sim, 'court')).toBeUndefined();
      // A body of 70 kg, to read the hour's energy off.
      sim.player.body = { weightKg: 70, extra: 0 } as unknown as NonNullable<typeof sim.player.body>;
      const r = sim.execute({ kind: 'life.look_after', payload: { action: 'court' } });
      expect(r.ok, r.error).toBe(true);
      return { fitness: sim.player.wellbeing.fitness, stress: sim.player.wellbeing.stress, kcal: sim.player.body!.extra };
    };
    const tennis = play('tennisCourt');
    const hoops = play('basketballCourt');
    expect(tennis.fitness).toBeGreaterThan(40);
    expect(tennis.stress).toBeLessThan(50);
    // The hour's energy over sitting, at each one's METs: (6.8 − 5.0) × 70 kg more for tennis.
    expect(tennis.kcal - hoops.kcal).toBeCloseTo((6.8 - 5.0) * 70, 6);
    // Pickleball's doubles, measured at 4.1, lighter than shooting baskets (from 2026-10-02).
    const pickle = play('pickleballCourt');
    expect(hoops.kcal - pickle.kcal).toBeCloseTo((5.0 - 4.1) * 70, 6);
    expect(courtAt(home(['pickleballCourt']).player)).toEqual({ court: 'pickleball', lit: false });
  });

  it('a tennis court’s upkeep, Fixr’s $1,800 a year, comes with the month’s bills', () => {
    const without = home([]);
    const withCourt = home(['tennisCourt']);
    const diff = billsOf(withCourt, withCourt.player) - billsOf(without, without.player);
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan(1_800 * 100);
  });
});
