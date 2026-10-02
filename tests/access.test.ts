/**
 * Getting about in a wheelchair (`systems/access.ts`, from 2026-10-02): a
 * hotel its own pages say can't take one, a disability permit at the
 * place's fee, and meters free where the town lets holders park free.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { inSaveMoney } from '@/engine/systems/banking';
import { PERMITS, meterFree, permitRefusal } from '@/engine/systems/access';
import { namedStayRefusal } from '@/engine/systems/hotels';
import { meterCost } from '@/engine/systems/trips';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a wheelchair', () => {
  it('isn’t booked into a hotel whose own pages say it can’t take one', () => {
    const sim = life('us-ny-newyork', 'acc-hotel');
    const p = sim.player;
    const room = 'Standard Room';
    expect(namedStayRefusal(p, 'travelodge-london-kings-cross-royal-scot', room, 'flexible', sim.now)).toBeUndefined();
    sim.must({ kind: 'health.mobility', payload: { wheelchair: true } });
    expect(namedStayRefusal(p, 'travelodge-london-kings-cross-royal-scot', room, 'flexible', sim.now)).toBe('Travelodge London Kings Cross Royal Scot has no wheelchair access.');
    expect(namedStayRefusal(p, 'pod-times-square', 'Bunk Pod', 'flexible', sim.now)).toBeUndefined();
  });
});

describe('a disability permit', () => {
  it('is for a wheelchair user, at the place’s fee, and makes New York’s meters free', () => {
    const sim = life('us-ny-newyork', 'acc-ny');
    const p = sim.player;
    expect(permitRefusal(p)).toBe('A permit is for a wheelchair user.');
    const full = meterCost(sim, 'us-ny-newyork', 60, p);
    expect(full).toBeGreaterThan(0);
    sim.must({ kind: 'health.mobility', payload: { wheelchair: true } });
    const r = sim.execute<{ paid: number }>({ kind: 'health.parking_permit', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(0);
    expect(meterFree(p, 'us-ny-newyork')).toBe(true);
    expect(meterCost(sim, 'us-ny-newyork', 60, p)).toBe(0);
    expect(meterCost(sim, 'us-ny-newyork', 60)).toBe(full);
    expect(permitRefusal(p)).toBe('You have one.');
    // Not using one any more, the permit goes.
    sim.must({ kind: 'health.mobility', payload: { wheelchair: false } });
    expect(p.parkingPermit).toBeUndefined();
  });

  it('costs London’s Blue Badge fee, and Westminster’s meters are still paid', () => {
    const sim = life('uk-eng-london', 'acc-ldn');
    const p = sim.player;
    sim.must({ kind: 'health.mobility', payload: { wheelchair: true } });
    const r = sim.execute<{ paid: number }>({ kind: 'health.parking_permit', payload: {} });
    expect(r.value!.paid).toBe(inSaveMoney(sim, 1000, 'GBP'));
    expect(PERMITS['uk-eng-london']!.freeMeters).toBe(false);
    expect(meterCost(sim, 'uk-eng-london', 60, p)).toBe(meterCost(sim, 'uk-eng-london', 60));
  });
});
