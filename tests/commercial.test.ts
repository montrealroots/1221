/**
 * A commercial agent beside the theatrical one (`systems/commercial.ts`):
 * signed at a meeting on presence and record, sending the commercial
 * auditions (the theatrical agency then sends none), and left on the
 * commercials contract's own rule.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { AGENCIES } from '@/engine/content/career';
import { beginCareer, careerOf, roleById, weekOfAuditions, type Booking } from '@/engine/systems/career';
import { COMMERCIAL_LEAVING, commercialRefusal, commercialTermEnds, commercialWeek, mayLeaveCommercial, recordCommercialPay } from '@/engine/systems/commercial';
import { evenCraft } from '@/engine/systems/school';

function pro(seed: string, presence = 90): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  Object.assign(sim.player.attrs!, { presence, reputation: 50 });
  return sim;
}
const signed = (seed: string) => {
  const sim = pro(seed);
  expect(sim.must<{ signed: boolean }>({ kind: 'career.commercial_meet', payload: { agencyId: 'abrams' } }).signed).toBe(true);
  return sim;
};

describe('a commercial agent', () => {
  it('signs an actor whose presence and record clear its bar, and one it passed on waits six months to meet again', () => {
    const sim = signed('com-sign');
    expect(careerOf(sim.player).commercial).toMatchObject({ agencyId: 'abrams', cityId: 'us-ny-newyork', initial: true });
    expect(commercialRefusal(sim, sim.player, 'cesd')).toMatch(/You’re with Abrams/);
    const weak = pro('com-weak', 20);
    Object.assign(weak.player.attrs!, { reputation: 0 });
    expect(weak.must<{ signed: boolean }>({ kind: 'career.commercial_meet', payload: { agencyId: 'cesd' } }).signed).toBe(false);
    expect(commercialRefusal(weak, weak.player, 'cesd')).toMatch(/six months/);
    // DDO has no New York office.
    expect(commercialRefusal(weak, weak.player, 'ddo')).toMatch(/no commercial office/);
  });

  it('sends the commercial auditions, and the theatrical agency sends none', () => {
    const sim = signed('com-week');
    const all = Array.from({ length: 20 }, (_, n) => commercialWeek(sim, sim.player, sim.now + n * 7 * MS_DAY)).flat();
    expect(all.length).toBeGreaterThan(10);
    for (const a of all) {
      expect(a.via).toBe('commercial');
      expect(roleById(a.roleId).after?.kind).toBe('commercial');
    }
    const agency = AGENCIES.find((a) => a.tier === 1)!;
    const theatrical = Array.from({ length: 30 }, (_, n) => weekOfAuditions(sim, sim.player, sim.now + n * 7 * MS_DAY, agency, 'us-ny-newyork', 0)).flat();
    expect(theatrical.length).toBeGreaterThan(0);
    expect(theatrical.some((a) => roleById(a.roleId).after?.kind === 'commercial')).toBe(false);
  });

  it('may be left on the commercials rule: early only after 120 days with no commercial offer, then under $4,000 in 91', () => {
    const sim = signed('com-leave');
    const rep = careerOf(sim.player).commercial!;
    expect(mayLeaveCommercial(sim, sim.player).ok).toBe(false);
    rep.signedAt = sim.now - 130 * MS_DAY;
    expect(mayLeaveCommercial(sim, sim.player).ok).toBe(true);
    rep.signedAt = sim.now - 200 * MS_DAY;
    recordCommercialPay(sim.player, sim.now - 10 * MS_DAY, COMMERCIAL_LEAVING.floor);
    expect(mayLeaveCommercial(sim, sim.player).ok).toBe(false);
    careerOf(sim.player).commercialPay = [{ at: sim.now - 10 * MS_DAY, amount: COMMERCIAL_LEAVING.floor - 1 }];
    expect(sim.execute({ kind: 'career.commercial_leave', payload: {} }).ok).toBe(true);
    expect(careerOf(sim.player).commercial).toBeUndefined();
  });

  it('renews for three years at the term’s end when it booked a commercial, and runs out when it didn’t', () => {
    for (const booked of [true, false]) {
      const sim = signed(`com-term-${booked}`);
      const career = careerOf(sim.player);
      const rep = career.commercial!;
      if (booked) career.bookings.push({ id: 'c1', roleId: 'commercial', cityId: 'us-ny-newyork', starts: sim.now, units: 1, rehearsalWeeks: 0, status: 'worked', dueAt: sim.now, offeredAt: sim.now, worked: 1, owed: 0 } as Booking);
      const ends = rep.termEnds;
      sim.advanceBy(ends - sim.now + MS_DAY);
      commercialTermEnds(sim, sim.player);
      if (booked) expect(career.commercial!.termEnds).toBeGreaterThan(ends + 2.9 * 365 * MS_DAY);
      else expect(career.commercial).toBeUndefined();
    }
  });
});
