/**
 * Going out together beyond a meal (`OUTINGS` in `content/people.ts`, from
 * 2026-10-06): a walk in the park, free, for ATUS's 0.96 hours; a film at the
 * cinema at the published average ticket where a trade body gives one,
 * refused elsewhere; a pint at a bar at the town's own price for one, the
 * price a pint alone costs, refused where SLATE keeps no bar price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { OUTINGS } from '@/engine/content/people';
import { contactsOf, knowTheClass, outingPrice } from '@/engine/systems/people';
import { inSaveMoney } from '@/engine/systems/banking';
import { bacAt, pintPrice } from '@/engine/systems/alcohol';
import { breaches } from '@/engine/core/invariants';
import { atWork } from '@/engine/systems/availability';

const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }]);
  const maya = contactsOf(sim.player)[contactsOf(sim.player).length - 1]!;
  maya.cityId = city;
  return { sim, maya };
};
/** A day some days on, at the hour, where they live, when the friend isn't at work. */
const freeAt = (sim: Simulation, city: string, hour = 14) => {
  const zone = CITIES.require(city).timeZone;
  const maya = contactsOf(sim.player)[contactsOf(sim.player).length - 1]!;
  for (let d = 4; ; d += 1) {
    const p = zonedParts(sim.now + d * MS_DAY, zone);
    const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, zone);
    if (!atWork(sim, maya, at, 120)) return at;
  }
};
const spentOn = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).length;

describe('going out together', () => {
  it('is a walk in the park, free, as long as ATUS’s walk, its hours counted', () => {
    const { sim, maya } = life('us-ca-losangeles', 'out-walk');
    const at = freeAt(sim, 'us-ca-losangeles');
    const r = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: maya.id, at, what: 'walk' } });
    expect(r.accepted, r.reason).toBe(true);
    const meet = sim.universe.scheduled.find((x) => x.status === 'pending' && x.kind === 'social.meet')!;
    expect(meet.label).toBe('A Walk With Maya');
    expect(meet.durationMinutes).toBeCloseTo(OUTINGS.walkMinutes, 9);
    const hours = maya.hours;
    const txns = sim.universe.transactions.length;
    sim.advanceTo(at + 2 * 3_600_000);
    expect(maya.hours).toBeCloseTo(hours + 0.96, 9);
    expect(maya.memory[0]!.what).toMatch(/^(A walk together|The walk called off)$/);
    expect(sim.universe.transactions.slice(txns).some((t) => /walk/i.test(t.memo))).toBe(false);
  });

  it('is a film at the average ticket where one is published, and refused where it isn’t', () => {
    const { sim, maya } = life('us-ny-newyork', 'out-film');
    expect(outingPrice(sim, 'us-ny-newyork', 'film')).toBe(inSaveMoney(sim, 1_075, 'USD'));
    const at = freeAt(sim, 'us-ny-newyork');
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: maya.id, at, what: 'film' } }).accepted).toBe(true);
    sim.advanceTo(at + 3 * 3_600_000);
    expect(spentOn(sim, 'The cinema, a ticket')).toBe(1);
    expect(maya.memory[0]!.what).toBe('A film together');
    const dub = life('ie-lei-dublin', 'out-film-ie');
    expect(dub.sim.execute({ kind: 'social.invite', payload: { contactId: dub.maya.id, at: freeAt(dub.sim, 'ie-lei-dublin'), what: 'film' } }).error).toBe('SLATE has no published ticket price here.');
  });

  it('is a pint at the town’s bar price, the one a pint alone costs, drunk as a bar’s is', () => {
    const { sim, maya } = life('uk-eng-london', 'out-pint');
    // London’s pubs’ £6.10, the same as a pint alone (until 2026-10-06 one pint had two prices).
    expect(outingPrice(sim, 'uk-eng-london', 'pint')).toBe(inSaveMoney(sim, 610, 'GBP'));
    expect(outingPrice(sim, 'uk-eng-london', 'pint')).toBe(pintPrice(sim, 'uk-eng-london'));
    const at = freeAt(sim, 'uk-eng-london', 19);
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: maya.id, at, what: 'pint' } }).accepted).toBe(true);
    sim.advanceTo(at + 31 * 60_000);
    expect(spentOn(sim, 'A pint at a bar')).toBe(1);
    expect(bacAt(sim.player, sim.now)).toBeGreaterThan(0);
    expect(breaches(sim.universe)).toEqual([]);
    // New Haven: no bar price kept.
    const nh = life('us-ct-newhaven', 'out-pint-nh');
    expect(nh.sim.execute({ kind: 'social.invite', payload: { contactId: nh.maya.id, at: freeAt(nh.sim, 'us-ct-newhaven', 19), what: 'pint' } }).error).toBe('SLATE has no bar price for a pint here.');
  });
});
