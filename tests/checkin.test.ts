/**
 * A hotel room at its own check-in hour (`roomReadyAt` in
 * `systems/hotels.ts`, from 2026-10-02): arriving in the day before it, the
 * room waits; early check-in where the hotel gives it free; the small hours
 * the night before's.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { roomReadyAt } from '@/engine/systems/hotels';
import { HOTELS } from '@/engine/content/hotels';
import { journeysOf, planBy } from '@/engine/systems/journey';

const NY = 'America/New_York';
const LA = 'America/Los_Angeles';
const at = (hour: number) => instantFromZoned({ year: 2026, month: 11, day: 10, hour, minute: 0 }, NY);

describe('the room', () => {
  it('waits for the hotel’s check-in hour, arriving in the day before it', () => {
    expect(roomReadyAt('the-plaza-nyc', at(10))).toBe(at(15));
    expect(roomReadyAt('the-plaza-nyc', at(16))).toBe(at(16));
    // The small hours are the night before's.
    expect(roomReadyAt('the-plaza-nyc', at(3))).toBe(at(3));
    // Pod gives early check-in free, in its facility fee.
    expect(roomReadyAt('pod-times-square', at(10))).toBe(at(10));
    // A hotel whose hour wasn't read: at once.
    expect(roomReadyAt('omni-new-haven-at-yale', at(10))).toBe(at(10));
  });

  it('isn’t showered in until then, and is once it’s ready', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'checkin-wash');
    const p = sim.player;
    const day = sim.now + 10 * 86_400_000;
    // A flight that lands in Los Angeles in the morning, before the Hollywood Roosevelt's three o'clock.
    let booked: string | undefined;
    for (let slot = 0; slot < 6 && !booked; slot += 1) {
      const legs = planBy(sim, undefined, 'us-ny-newyork', 'us-ca-losangeles', day, slot, 0);
      if (typeof legs === 'string') continue;
      const h = zonedParts(legs[legs.length - 1]!.arriveAt, LA).hour;
      if (h < 6 || h >= 14) continue;
      const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot, nights: 2, hotelId: 'hollywood-roosevelt', room: HOTELS.find((x) => x.id === 'hollywood-roosevelt')!.rooms[0]!.name } });
      if (r.ok) booked = r.value!.journeyId;
    }
    expect(booked).toBeDefined();
    const j = journeysOf(p).find((x) => x.id === booked)!;
    while (j.status !== 'arrived' && j.status !== 'missed' && sim.now < j.arriveAt + 86_400_000) sim.advanceTo(sim.now + 30 * 60_000);
    expect(j.status, j.why).toBe('arrived');
    expect(p.stay).toMatchObject({ kind: 'hotel', hotelId: 'hollywood-roosevelt', out: true });
    const ready = p.stay!.readyAt!;
    expect(zonedParts(ready, LA).hour).toBe(15);
    // A deposit paid before the hour gives the key, not the room.
    j.hotel!.depositDue = 100_00;
    const paid = sim.execute({ kind: 'travel.pay_deposit', payload: { journeyId: j.id } });
    expect(paid.ok, paid.error).toBe(true);
    expect(p.stay!.out).toBe(true);
    p.wellbeing.hygiene = 40;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).error).toMatch(/^The room isn’t ready until /);
    sim.advanceTo(ready + 60_000);
    expect(p.stay!.out).toBeUndefined();
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
  });
});
