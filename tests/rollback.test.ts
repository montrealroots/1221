/**
 * A command that fails puts the world back as it was, in the objects that
 * were there (`restoreUniverse`). Until 2026-09-28 a record's lists came back
 * as the snapshot's copies: after any refused command a class's classmates
 * and a career's bookings were new objects, and a classmate's craft lost its
 * ceiling, so the class grew toward 100 while the actor didn't.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CommandError } from '@/engine/core/simulation';
import { ceilingOf } from '@/engine/systems/school';
import { careerOf } from '@/engine/systems/career';

describe('a command that fails', () => {
  it('restores a record’s lists in place: the same classmates and bookings, their values as before, the ceilings still theirs', () => {
    const sim = createSave(1, 'rollback', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });
    const school = sim.player.school!;
    const mate = school.classmates[0]!;
    const craft = mate.craft;
    const scene = craft.scene;
    const career = careerOf(sim.player);
    career.bookings.push({ id: 'b-held', roleId: 'costar', cityId: 'us-ny-newyork', starts: sim.now, units: 1, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now, offeredAt: sim.now, worked: 0, owed: 0 });
    const booking = career.bookings.at(-1)!;
    sim.onCommand('test.fail', () => {
      craft.scene = 1;
      booking.worked = 99;
      school.classmates.reverse();
      throw new CommandError('No.');
    });
    expect(sim.execute({ kind: 'test.fail', payload: {} }).ok).toBe(false);
    expect(school.classmates[0]).toBe(mate);
    expect(school.classmates[0]!.craft).toBe(craft);
    expect(craft.scene).toBe(scene);
    expect(ceilingOf(craft, 'scene')).toBe(mate.ceiling!.scene);
    expect(careerOf(sim.player).bookings.find((b) => b.id === 'b-held')).toBe(booking);
    expect(booking.worked).toBe(0);
  });
});
