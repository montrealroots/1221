/**
 * A named hotel (`systems/hotels.ts`, `content/hotels.ts`, from 2026-10-01):
 * a room's own rate on the nights its booking engine was read and their
 * mean otherwise, the town's hotel taxes on a rate before tax, the hotel's
 * fee, its minimum age, its rate plans, and a journey booked with it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { checkOutHourOf, depositFor, hotelById, hotelParking, hotelsIn, namedStayQuote, namedStayRefusal, roomRate } from '@/engine/systems/hotels';
import { documentsOf } from '@/engine/systems/documents';
import { nightRateFor } from '@/engine/systems/stays';
import { stayTotal } from '@/engine/systems/hotelbreakfast';

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


describe('the stay at a named hotel', () => {
  it('checks out at its own hour, holds its deposit from arrival and returns it at check-out', () => {
    const sim = life('us-ct-newhaven', 'ht-stay');
    const p = zonedParts(sim.now + 10 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, nights: 2, hotelId: 'pod-times-square', room: 'Bunk Pod' } });
    expect(r.ok, r.error).toBe(true);
    const j = sim.player.journeys!.find((x) => x.id === r.value!.journeyId)!;
    expect(checkOutHourOf('pod-times-square')).toBe(13);
    expect(zonedParts(j.hotel!.checkOutAt, 'America/New_York')).toMatchObject({ hour: 13, minute: 0 });
    // Until it's in, however late it runs.
    while (j.status !== 'arrived' && sim.now < j.arriveAt + 2 * MS_DAY) sim.advanceTo(sim.now + 30 * 60_000);
    expect(sim.player.stay?.kind).toBe('hotel');
    expect(j.hotel!.deposit).toBe(depositFor(sim, 'pod-times-square', 2));
    expect(sim.universe.transactions.some((t) => t.memo === 'Pod Times Square, the deposit held')).toBe(true);
    sim.advanceTo(j.hotel!.checkOutAt + 60_000);
    expect(j.hotel!.deposit).toBeUndefined();
    expect(j.hotel!.returned).toBe(depositFor(sim, 'pod-times-square', 2));
    expect(sim.universe.transactions.some((t) => t.memo === 'The hotel’s deposit, returned')).toBe(true);
    // Not leaving, the hotel keeps them another night at its own rate, not the town's.
    const another = sim.universe.transactions.find((t) => t.memo === 'Another night in a hotel in New York')!;
    const paid = another.postings.filter((q) => q.amount < 0 && sim.universe.accounts[q.accountId]?.ownerId === sim.player.id).reduce((x, q) => x - q.amount, 0);
    expect(paid).toBe(namedStayQuote(sim, 'pod-times-square', 'Bunk Pod', 'flexible', another.at ?? j.hotel!.checkOutAt, 1)!.price);
  });

  it('booked by car, parks at the hotel’s own garage', () => {
    const sim = life('us-ct-newhaven', 'ht-car');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ct', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const car = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    expect(car.ok, car.error).toBe(true);
    const p = zonedParts(sim.now + 10 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, nights: 2, by: `car:${car.value!.vehicleId}`, hotelId: 'pod-times-square', room: 'Bunk Pod' } });
    expect(r.ok, r.error).toBe(true);
    const j = sim.player.journeys!.find((x) => x.id === r.value!.journeyId)!;
    expect(j.hotel!.parking).toBe(hotelParking(sim, 'pod-times-square', 2)!.price);
    expect(j.hotel!.basis).toMatch(/the garage it sends guests to/);
  });

  it('parks at its own lot, valet or garage, and a night’s deposit is the nights’', () => {
    const sim = life('us-ny-newyork', 'ht-park');
    expect(hotelParking(sim, 'pod-times-square', 2)).toMatchObject({ price: Math.round(57 * 2 * 100) });
    expect(hotelParking(sim, 'pod-times-square', 2)!.basis).toMatch(/the garage it sends guests to/);
    expect(hotelParking(sim, 'hoxton-holborn', 2)).toBeUndefined();
    expect(depositFor(sim, 'omni-new-haven-at-yale', 3)).toBe(3 * 100_00);
    expect(depositFor(sim, 'ace-hotel-brooklyn', 3)).toBe(300_00);
    expect(depositFor(sim, 'the-plaza-nyc', 3)).toBe(0);
  });
});

// From 2026-10-06 (§48c): until then hotels were compared on the room, its tax and fee alone.
describe('a stay’s whole cost, side by side', () => {
  it('adds the hotel’s parking for a car, your breakfast each morning and holds its deposit apart', () => {
    const sim = life('us-ny-newyork', 'ht-total');
    const from = sim.now + 10 * MS_DAY;
    const omni = hotelById('omni-new-haven-at-yale')!;
    const plan = namedStayQuote(sim, omni.id, omni.rooms[0]!.name, 'flexible', from, 3) ? 'flexible' : 'prepaid';
    const room = namedStayQuote(sim, omni.id, omni.rooms[0]!.name, plan, from, 3)!.price;
    const t = stayTotal(sim, omni.id, omni.rooms[0]!.name, plan, from, 3, { rooms: 2, car: true })!;
    // Two rooms; its lot at $28.75 a night; its $25 breakfast three mornings; $100 a night held for each room.
    expect(t).toMatchObject({ room: 2 * room, parking: 8625, breakfast: 7500, deposit: 2 * 3 * 100_00 });
    expect(t.paid).toBe(2 * room + 8625 + 7500);
    // Without a car, no parking; the deposit isn't in what's paid.
    expect(stayTotal(sim, omni.id, omni.rooms[0]!.name, plan, from, 3)!.paid).toBe(room + 7500);
    // La Quinta's breakfast comes with the room; the Plaza publishes none, so none is counted.
    const lq = hotelById('la-quinta-new-haven')!;
    const lqPlan = namedStayQuote(sim, lq.id, lq.rooms[0]!.name, 'flexible', from, 3) ? 'flexible' : 'prepaid';
    expect(stayTotal(sim, lq.id, lq.rooms[0]!.name, lqPlan, from, 3)!.breakfast).toBe(0);
    const plaza = hotelById('the-plaza-nyc')!;
    const pPlan = namedStayQuote(sim, plaza.id, plaza.rooms[0]!.name, 'flexible', from, 3) ? 'flexible' : 'prepaid';
    const p = stayTotal(sim, plaza.id, plaza.rooms[0]!.name, pPlan, from, 3, { car: true })!;
    expect(p.breakfast).toBeUndefined();
    expect(p.parking).toBe(110 * 3 * 100);
    expect(p.paid).toBe(p.room + p.parking);
  });
});
