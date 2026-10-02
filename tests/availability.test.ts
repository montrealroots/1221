/**
 * The people you know have jobs (`systems/availability.ts`, from
 * 2026-10-02): employed at their country's rate for their age, at work by
 * day on the days they work, and saying so when asked then.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { HALL } from '@/engine/content/people';
import { DAYTIME, EMPLOYED, atWork, atWorkReason, works } from '@/engine/systems/availability';
import { contactsOf, newContact, type Contact } from '@/engine/systems/people';

const NY = 'America/New_York';
const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const at = (sim: Simulation, days: number, hour: number) => { const p = zonedParts(sim.now + days * MS_DAY, NY); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, NY); };
const aged = (sim: Simulation, id: string, years: number, cityId = 'us-ny-newyork') => ({ id, name: 'Sam Lee', cityId, born: sim.now - years * 365.2425 * MS_DAY }) as Contact;

describe('a job of their own', () => {
  it('is had at the country’s rate for the age', () => {
    const sim = life('avail-rate');
    let prime = 0;
    let young = 0;
    for (let i = 0; i < 2000; i += 1) {
      if (works(sim, aged(sim, `p${i}`, 35), sim.now).employed) prime += 1;
      if (works(sim, aged(sim, `y${i}`, 20), sim.now).employed) young += 1;
    }
    expect(prime / 2000).toBeCloseTo(EMPLOYED.us!.prime!, 1);
    expect(young / 2000).toBeCloseTo(EMPLOYED.us!.all, 1);
    // Of those working, BLS's 85% by day.
    let employed = 0;
    let byDay = 0;
    for (let i = 0; i < 2000; i += 1) { const w = works(sim, aged(sim, `d${i}`, 35), sim.now); if (w.employed) { employed += 1; if (w.daytime) byDay += 1; } }
    expect(byDay / employed).toBeCloseTo(DAYTIME, 1);
    // Past 64 in Britain, no rate was read: not working.
    expect(works(sim, aged(sim, 'old', 70, 'uk-eng-london'), sim.now).employed).toBe(false);
  });

  it('keeps them at work by day on a day they work, and not in the evening', () => {
    const sim = life('avail-day');
    // A person who works by day.
    let c = aged(sim, 'w0', 35);
    for (let i = 1; !works(sim, c, sim.now).daytime; i += 1) c = aged(sim, `w${i}`, 35);
    let workedDays = 0;
    for (let d = 1; d <= 28; d += 1) {
      expect(atWork(sim, c, at(sim, d, 19), 120)).toBe(false);
      if (atWork(sim, c, at(sim, d, 11), 60)) workedDays += 1;
    }
    expect(workedDays).toBeGreaterThan(10);
    expect(workedDays).toBeLessThan(28);
    // Overlapping the shift's start counts.
    expect([atWork(sim, c, at(sim, 1, 8), 120), atWork(sim, c, at(sim, 1, 11), 60)]).toEqual([atWork(sim, c, at(sim, 1, 11), 60), atWork(sim, c, at(sim, 1, 11), 60)]);
  });

  it('turns down an invitation in working hours, and says why', () => {
    const sim = life('avail-invite');
    const friends = Array.from({ length: 12 }, (_, i) => { const c = newContact(sim, sim.player, 'us-ny-newyork', `avail-${i}`, { at: sim.now, how: 'school' }); c.hours = HALL.friend; contactsOf(sim.player).push(c); return c; });
    const day = at(sim, 2, 11);
    const busy = friends.find((c) => atWork(sim, c, day, 120))!;
    expect(busy).toBeDefined();
    const r = sim.execute<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: busy.id, at: day, what: 'visit' } });
    expect(r.value).toEqual({ accepted: false, reason: atWorkReason(busy) });
    const evening = sim.execute<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: busy.id, at: at(sim, 2, 19), what: 'visit' } });
    expect(evening.value!.accepted).toBe(true);
  });
});
