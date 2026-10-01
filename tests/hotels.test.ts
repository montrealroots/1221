/**
 * A named hotel (`systems/hotels.ts`, `content/hotels.ts`, from 2026-10-01):
 * a room's own rate on the nights its booking engine was read and their
 * mean otherwise, the town's hotel taxes on a rate before tax, the hotel's
 * fee, its minimum age, its rate plans, and a journey booked with it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { hotelById, hotelsIn, namedStayQuote, namedStayRefusal, roomRate } from '@/engine/systems/hotels';
import { nightRateFor } from '@/engine/systems/stays';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const night = (y: number, m: number, d: number, zone: string) => instantFromZoned({ year: y, month: m, day: d, hour: 21, minute: 0 }, zone);
const LDN = 'Europe/London';

describe('a room’s rate', () => {
  it('is the night it was read for, or the mean of those nights, an estimate', () => {
    const h = hotelById('hoxton-holborn')!;
    const shoebox = h.rooms.find((r) => r.name === 'Shoebox')!;
    expect(roomRate(h, shoebox, 'flexible', night(2026, 11, 10, LDN))).toEqual({ rate: 332.5, estimated: false });
    const mean = (332.5 + 290.83 + 282.5) / 3;
    expect(roomRate(h, shoebox, 'flexible', night(2026, 11, 11, LDN))!.rate).toBeCloseTo(mean, 6);
    expect(roomRate(h, shoebox, 'flexible', night(2026, 11, 11, LDN))!.estimated).toBe(true);
    // Premier Inn's standard room is only paid ahead.
    const pi = hotelById('premier-inn-london-county-hall')!;
    expect(roomRate(pi, pi.rooms[0]!, 'flexible', night(2026, 11, 10, LDN))).toBeUndefined();
  });

  it('comes to the town’s hotel taxes on a rate before tax, none on one tax in, and the hotel’s fee a night', () => {
    const sim = life('uk-eng-london', 'ht-quote');
    const at = night(2026, 11, 10, LDN);
    const taxes = nightRateFor('uk-eng-london')!.rate;
    const hox = namedStayQuote(sim, 'hoxton-holborn', 'Shoebox', 'flexible', at, 1)!;
    expect(hox.price).toBe(Math.round((332.5 * (1 + taxes.onTop) + taxes.perRoomNight + taxes.perPersonNight) * 100));
    expect(hox.estimated).toBe(false);
    const savoy = hotelById('the-savoy-london')!;
    expect(namedStayQuote(sim, savoy.id, savoy.rooms[0]!.name, 'flexible', at, 1)!.price).toBe(99000);
    // Two nights, the second not read: the mean, said to be an estimate.
    expect(namedStayQuote(sim, 'hoxton-holborn', 'Shoebox', 'flexible', at, 2)!.estimated).toBe(true);
    // Pod Times Square's facility fee comes with each night.
    const ny = life('us-ny-newyork', 'ht-fee');
    const pod = hotelById('pod-times-square')!;
    const one = namedStayQuote(ny, pod.id, 'Bunk Pod', 'flexible', night(2026, 11, 10, 'America/New_York'), 1)!;
    const nyTaxes = nightRateFor('us-ny-newyork')!.rate;
    expect(one.price).toBe(Math.round((221 * (1 + nyTaxes.onTop) + nyTaxes.perRoomNight + nyTaxes.perPersonNight) * 100) + Math.round(29.84 * 100));
  });

  it('isn’t booked under the hotel’s age, nor on a plan it doesn’t offer for the room', () => {
    const sim = life('us-ny-newyork', 'ht-age');
    const at = night(2026, 11, 10, 'America/New_York');
    sim.player.birthInstant = at - 20 * 365.2425 * MS_DAY;
    expect(namedStayRefusal(sim.player, 'ace-hotel-brooklyn', 'Queen', 'flexible', at)).toMatch(/21 or older/);
    sim.player.birthInstant = at - 30 * 365.2425 * MS_DAY;
    expect(namedStayRefusal(sim.player, 'ace-hotel-brooklyn', 'Queen', 'flexible', at)).toBeUndefined();
    expect(namedStayRefusal(sim.player, 'premier-inn-london-county-hall', 'Standard room', 'flexible', at)).toBe('It offers that room only paid ahead.');
    expect(namedStayRefusal(sim.player, 'ace-hotel-brooklyn', 'A Ballroom', 'flexible', at)).toBe('It has no such room.');
  });
});

describe('a journey', () => {
  it('is booked with a named hotel’s room, which it keeps, at its price', () => {
    const sim = life('uk-eng-london', 'ht-book');
    const p = zonedParts(sim.now + 10 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    const dublin = hotelsIn('ie-lei-dublin').find((h) => h.rooms.some((r) => Object.keys(r.rates.flexible).length > 0))!;
    const room = dublin.rooms.find((r) => Object.keys(r.rates.flexible).length > 0)!;
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'ie-lei-dublin', day, slot: 2, nights: 2, hotelId: dublin.id, room: room.name } });
    expect(r.ok, r.error).toBe(true);
    const j = sim.player.journeys!.find((x) => x.id === r.value!.journeyId)!;
    expect(j.hotel!.named).toEqual({ hotelId: dublin.id, room: room.name });
    expect(j.hotel!.basis).toMatch(new RegExp(dublin.name));
    // A hotel in another town isn't booked for this one.
    const other = life('uk-eng-london', 'ht-book-2');
    expect(other.execute({ kind: 'travel.book', payload: { toCity: 'ie-lei-dublin', day, slot: 2, nights: 2, hotelId: 'the-savoy-london', room: 'x' } }).error).toBe('That hotel is in another town.');
  });
});

