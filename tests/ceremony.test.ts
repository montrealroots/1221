/**
 * Going to an awards ceremony as a nominee (`systems/awards.ts`, from
 * 2026-10-06): on the calendar in its town, decided there at the vote's own
 * odds and told there, and a win's recognition in full only for a nominee who
 * was there, in its town and dressed for it. Until then nobody went.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { ATTRIBUTES, attributesOf } from '@/engine/systems/attributes';
import { CEREMONY, CEREMONY_KIND, attendRefusal, ceremonyOf, dressedForCeremony, entriesOf, holdCeremony } from '@/engine/systems/awards';
import { addItem } from '@/engine/systems/items';

function nominee(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(100);
  beginCareer(sim, sim.player);
  const b: Booking = { id: 'w0', roleId: 'guest-hour', cityId: 'us-ny-newyork', starts: sim.now, units: 1, rehearsalWeeks: 0, status: 'worked', dueAt: sim.now, offeredAt: sim.now, worked: 1, owed: 0 };
  careerOf(sim.player).bookings.push(b);
  entriesOf(sim.player).push({ bookingId: b.id, body: 'emmys', year: 2027, category: 'guest-drama', entered: sim.now, byThem: true, nominated: true });
  return sim;
}
function suitUp(sim: Simulation) {
  const g = addItem(sim, sim.player, { kind: 'suit', label: 'A Suit', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now, garment: { kind: 'suit', slot: 'suit', care: 'dry-clean', wears: 0, washes: 0 } });
  sim.player.wornNow = { itemIds: [g.id], since: sim.now };
}

describe('an awards ceremony', () => {
  it('is gone to by a nominee only, put on the calendar in its town', () => {
    const sim = nominee('cer-cal');
    expect(attendRefusal(sim, sim.player, 'nope', 'emmys')).toBe('Only a nominee is asked.');
    const r = sim.must<{ at: number }>({ kind: 'career.attend_ceremony', payload: { bookingId: 'w0', body: 'emmys' } });
    const where = ceremonyOf('emmys', 2027);
    expect(r.at).toBe(where.at);
    expect(where.cityId).toBe(CEREMONY.emmys.cityId);
    const item = sim.universe.scheduled.find((i) => i.kind === CEREMONY_KIND && i.status === 'pending')!;
    expect(item).toMatchObject({ at: where.at, locationId: 'us-ca-losangeles', stopsClock: true });
    expect(attendRefusal(sim, sim.player, 'w0', 'emmys')).toBe('You’re going.');
    // The day's turn leaves it to the ceremony itself.
    expect(holdCeremony(sim, sim.player, 'emmys', 2027)).toBe(0);
    expect(entriesOf(sim.player)[0]!.won).toBeUndefined();
  });

  it('decides the win at the vote’s odds either way, and lifts recognition in full only for one there and dressed for it', () => {
    let checked = 0;
    for (let n = 0; n < 40 && checked < 1; n += 1) {
      const run = (there: boolean, dressed: boolean) => {
        const sim = nominee(`cer-win-${n}`);
        sim.must({ kind: 'career.attend_ceremony', payload: { bookingId: 'w0', body: 'emmys' } });
        if (there) sim.player.currentLocationId = 'us-ca-losangeles';
        if (dressed) suitUp(sim);
        expect(dressedForCeremony(sim.player)).toBe(dressed);
        const before = attributesOf(sim, sim.player).recognition;
        const won = holdCeremony(sim, sim.player, 'emmys', 2027, true);
        return { won, lift: attributesOf(sim, sim.player).recognition - before, e: entriesOf(sim.player)[0]!, sim };
      };
      const in_ = run(true, true);
      const away = run(false, true);
      const casual = run(true, false);
      // Being there never moves the odds.
      expect(away.won).toBe(in_.won);
      expect(casual.won).toBe(in_.won);
      expect(in_.e.there).toBe(true);
      expect(away.e.there).toBe(false);
      expect(casual.e.there).toBe(false);
      if (!in_.won) continue;
      checked += 1;
      expect(in_.lift).toBeGreaterThan(away.lift);
      expect(casual.lift).toBeCloseTo(away.lift, 9);
      expect(away.lift).toBeGreaterThan(0);
      expect(ATTRIBUTES.build.festival.absent).toBeLessThan(1);
      expect(in_.sim.universe.notifications.some((x) => x.title === 'You Won' && x.body.startsWith('At '))).toBe(true);
      expect(away.sim.universe.notifications.some((x) => x.title === 'You Weren’t There')).toBe(true);
    }
    expect(checked).toBe(1);
  });
});
