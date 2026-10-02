/**
 * Courts at home (`content/homes.ts`, `systems/dwelling.ts`, from
 * 2026-10-01): built by surface at Fixr's prices on a lot big enough, played
 * on in the fine weather and in daylight unless lit, at the Compendium's
 * METs, and a tennis court's upkeep in the month's bills.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Feature, Fixtures } from '@/engine/content/homes';
import { PROJECTS } from '@/engine/content/homes';
import { CITIES } from '@/engine/content/geography';
import { sunTimes } from '@/engine/core/sun';
import { moveIntoOwned, ownBuilt, projectRefusal, type HomeFacts } from '@/engine/systems/homes';
import { courtAt, courtRefusal, homeCourts, weatherNow } from '@/engine/systems/dwelling';
import { contactsOf, newContact } from '@/engine/systems/people';
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

describe('a football pitch, and friends over to play', () => {
  it('is built in three sizes at turf’s middle price and a drainage base, on a lot big enough for it', () => {
    const five = PROJECTS.find((p) => p.id === 'pitch-five')!;
    expect(five.lot).toBe(Math.round(40 * 20 * 10.7639));
    expect(five.usd).toBe(Math.round(40 * 20 * 10.7639 * (12.5 + 4)));
    expect(PROJECTS.find((p) => p.id === 'pitch-full')!.lot).toBeGreaterThan(70_000);
    expect(five.adds?.gains).toEqual(['footballPitch']);
  });

  it('isn’t played alone, and is played with a friend over, at football’s METs, unless the weather stops it', () => {
    const sim = home(['footballPitch'], 'pitch-play');
    expect(courtRefusal(sim, sim.player)).toBe('A football pitch needs players: invite friends to play.');
    expect(homeCourts(sim.player)).toEqual([{ court: 'football', lit: false }]);
    const friend = newContact(sim, sim.player, LA, 'pitch-friend', { at: sim.now, how: 'school' });
    friend.hours = 100;
    contactsOf(sim.player).push(friend);
    // Half an hour into a fine afternoon hour of daylight, the same day's weather.
    let fine = nextHour(sim, true);
    while (zonedParts(fine, 'America/Los_Angeles').hour < 12 || zonedParts(fine, 'America/Los_Angeles').hour > 15) { sim.advanceTo(fine + MS_HOUR); fine = nextHour(sim, true); }
    const at = fine + 30 * 60_000;
    sim.player.body = { weightKg: 70, extra: 0 } as unknown as NonNullable<typeof sim.player.body>;
    const r = sim.execute<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: friend.id, at, what: 'play', court: 'football' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value, JSON.stringify(r.value)).toEqual({ accepted: true });
    expect(sim.execute({ kind: 'social.invite', payload: { contactId: friend.id, at: at + 30 * MS_HOUR, what: 'play', court: 'tennis' } }).error).toBe('You have no such court or pitch to play on.');
    sim.advanceTo(at + 2 * MS_HOUR);
    expect(friend.memory.some((m) => m.what === 'Played football at yours')).toBe(true);
    // Ninety minutes at football's 7.0 METs over sitting, for 70 kg, less what the day's rest burned anyway: more than nothing.
    expect(sim.player.body!.extra).toBeGreaterThan(0);
  });
});

describe('a game after dark', () => {
  it('on an unlit pitch is a visit: they come, and nobody plays', () => {
    const sim = home(['footballPitch'], 'pitch-dark');
    const friend = newContact(sim, sim.player, LA, 'pitch-dark-friend', { at: sim.now, how: 'school' });
    friend.hours = 100;
    contactsOf(sim.player).push(friend);
    // Nine at night, dark in Los Angeles all year.
    const p = zonedParts(sim.now + 2 * 24 * MS_HOUR, 'America/Los_Angeles');
    const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 21, minute: 0 }, 'America/Los_Angeles');
    const r = sim.execute<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: friend.id, at, what: 'play', court: 'football' } });
    expect(r.value).toEqual({ accepted: true });
    for (let i = 0; i < 400 && sim.now < at + 2 * MS_HOUR; i += 1) sim.advanceTo(Math.min(at + 2 * MS_HOUR, sim.now + MS_HOUR));
    expect(friend.memory.map((m) => m.what), JSON.stringify(sim.universe.scheduled.filter((x) => x.kind.startsWith('social')).map((x) => [x.kind, x.status, x.at - at]))).toContain('Came over to play; the weather or the dark stopped it');
  });
});

describe('special rooms and outdoor additions', () => {
  it('are priced at the cost guides’ figures, one room to each spare bedroom', () => {
    expect(PROJECTS.find((p) => p.id === 'home-theater')).toMatchObject({ usd: 25_000, spareBedroom: true });
    expect(PROJECTS.find((p) => p.id === 'hot-tub')).toMatchObject({ usd: 8_500, needs: ['yard'] });
    // A two-bedroom home has one spare: a theater takes it, and a library has none left.
    const two = home(['homeTheater'], 'rooms-two');
    const owned = two.player.homes![0]!;
    owned.facts.beds = 2;
    expect(projectRefusal(two, two.player, owned, PROJECTS.find((p) => p.id === 'library')!)).toBe('It has no spare bedroom.');
    owned.facts.beds = 3;
    expect(projectRefusal(two, two.player, owned, PROJECTS.find((p) => p.id === 'library')!)).toBeUndefined();
  });

  it('a hot tub and a putting green add their running to the month’s bills', () => {
    const without = home([], 'tub-0');
    const tub = home(['hotTub'], 'tub-1');
    const green = home(['puttingGreen'], 'tub-2');
    expect(billsOf(tub, tub.player) - billsOf(without, without.player)).toBeGreaterThan(0);
    expect(billsOf(green, green.player) - billsOf(without, without.player)).toBeGreaterThan(0);
    expect(billsOf(tub, tub.player)).toBeGreaterThan(billsOf(green, green.player));
  });
});
