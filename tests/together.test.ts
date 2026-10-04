/**
 * What people care about, read by what they say yes to, and a class taken
 * together (`systems/people.ts`, from 2026-10-03).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { contactsOf, declines, newContact } from '@/engine/systems/people';
import { CONTACT_INTERESTS, interestsOf } from '@/engine/systems/enjoyment';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('what they care about', () => {
  it('is three interests, drawn once and kept', () => {
    const sim = life('us-ny-newyork', 'together-int');
    const c = newContact(sim, sim.player, 'us-ny-newyork', 'k1', { at: sim.now, how: 'school' });
    const first = interestsOf(sim, sim.player, c);
    expect(first).toHaveLength(CONTACT_INTERESTS);
    expect(new Set(first).size).toBe(CONTACT_INTERESTS);
    expect(interestsOf(sim, sim.player, c)).toBe(first);
  });

  it('decides a game or a class: no to one they don’t care for, and a class together paid and kept in memory', () => {
    const sim = life('us-ny-newyork', 'together-class');
    const c = newContact(sim, sim.player, 'us-ny-newyork', 'k2', { at: sim.now, how: 'school' });
    c.hours = 100;
    contactsOf(sim.player).push(c);
    const zone = 'America/New_York';
    const p = zonedParts(sim.now + 3 * MS_DAY, zone);
    const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 18 }, zone);
    c.interests = ['reading', 'music', 'history'];
    expect(declines(sim.player, c, { contactId: c.id, at, what: 'class', classId: 'bdc-open-class' }, sim)).toMatch(/doesn’t much care for classes like that/);
    c.interests = ['dance', 'music', 'history'];
    expect(declines(sim.player, c, { contactId: c.id, at, what: 'class', classId: 'bdc-open-class' }, sim)).toBeUndefined();
    const r = sim.execute<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: c.id, at, what: 'class', classId: 'bdc-open-class' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.accepted, r.value!.reason).toBe(true);
    const hours = c.hours;
    sim.advanceTo(at + 2 * 60 * 60_000);
    expect(c.hours).toBe(hours + 1);
    expect(c.memory[0]!.what).toBe('An Open Dance Class at Broadway Dance Center, together');
    expect(sim.universe.transactions.some((t) => t.memo === 'Broadway Dance Center, an open dance class')).toBe(true);
  });
});
