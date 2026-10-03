/**
 * A named hotel's own amenities and terms (`content/hotelamenities.ts`,
 * from 2026-10-02): its own cancellation deadline, its gym, and its pool,
 * while staying there.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { HOTEL_AMENITIES } from '@/engine/content/hotelamenities';
import { FREE_CANCEL_HOURS, amenitiesOf, amenityLine, freeCancelUntil, hotelById, hotelHas } from '@/engine/systems/hotels';
import { hotelRefund, type Journey } from '@/engine/systems/journey';
import { stayPlace, swimRefusal } from '@/engine/systems/dwelling';
import { addItem } from '@/engine/systems/items';

const NY = 'America/New_York';
const LONDON = 'Europe/London';
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a hotel’s own cancellation deadline', () => {
  it('is its hours before arrival at its hour, or a day before where it isn’t known', () => {
    expect(amenitiesOf('pod-times-square')!.cancel).toEqual({ hours: 24, by: '15:00' });
    const arrive = instantFromZoned({ year: 2026, month: 11, day: 10, hour: 20, minute: 0 }, NY);
    expect(freeCancelUntil('pod-times-square', arrive)).toBe(instantFromZoned({ year: 2026, month: 11, day: 9, hour: 15, minute: 0 }, NY));
    // Travelodge: noon on the day.
    expect(amenitiesOf('travelodge-london-kings-cross-royal-scot')!.cancel).toEqual({ hours: 0, by: '12:00' });
    const london = instantFromZoned({ year: 2026, month: 11, day: 10, hour: 16, minute: 0 }, LONDON);
    expect(freeCancelUntil('travelodge-london-kings-cross-royal-scot', london)).toBe(instantFromZoned({ year: 2026, month: 11, day: 10, hour: 12, minute: 0 }, LONDON));
    // Omni's 72 hours by noon: three days before.
    expect(freeCancelUntil('omni-new-haven-at-yale', arrive)).toBe(instantFromZoned({ year: 2026, month: 11, day: 7, hour: 12, minute: 0 }, NY));
    // The Plaza's 48 hours, no hour named.
    expect(amenitiesOf('the-plaza-nyc')!.cancel).toEqual({ hours: 48, by: null });
    expect(freeCancelUntil('the-plaza-nyc', arrive)).toBe(arrive - 48 * 3_600_000);
    // Not read, or no hotel: a day before.
    expect(amenitiesOf('ace-hotel-brooklyn')!.cancel).toBeNull();
    expect(freeCancelUntil('ace-hotel-brooklyn', arrive)).toBe(arrive - FREE_CANCEL_HOURS * 3_600_000);
    expect(freeCancelUntil(undefined, arrive)).toBe(arrive - FREE_CANCEL_HOURS * 3_600_000);
  });

  it('decides what comes back of a flexible rate called off', () => {
    const arrive = instantFromZoned({ year: 2026, month: 11, day: 10, hour: 20, minute: 0 }, NY);
    const hotel: NonNullable<Journey['hotel']> = { nights: 4, price: 400_00, basis: '', checkOutAt: arrive + 4 * MS_DAY, plan: 'flexible', named: { hotelId: 'pod-times-square', room: 'Bunk Pod' } };
    const deadline = freeCancelUntil('pod-times-square', arrive);
    expect(hotelRefund(hotel, arrive, deadline)).toBe(400_00);
    // Twenty-eight hours ahead is past Pod's 3 p.m. the day before, though a day ahead elsewhere.
    expect(hotelRefund(hotel, arrive, deadline + 60_000)).toBe(300_00);
    expect(hotelRefund({ ...hotel, named: undefined }, arrive, deadline + 60_000)).toBe(400_00);
    // A deadline that falls after arrival, Travelodge's noon on the day: a morning's no-show still keeps the first night.
    const morning = instantFromZoned({ year: 2026, month: 11, day: 10, hour: 10, minute: 0 }, LONDON);
    expect(hotelRefund({ ...hotel, named: { hotelId: 'travelodge-london-kings-cross-royal-scot', room: 'x' } }, morning, morning)).toBe(300_00);
    expect(hotelRefund({ ...hotel, named: { hotelId: 'travelodge-london-kings-cross-royal-scot', room: 'x' } }, morning, morning - 60_000)).toBe(400_00);
  });
});

describe('a hotel’s gym and pool', () => {
  it('are shown as its pages state them, and nothing where nothing was read', () => {
    expect(amenityLine('pod-times-square')).toBe('A gym, breakfast extra, free Wi-Fi, accessible rooms, pets at 25 USD a night.');
    expect(amenityLine('travelodge-london-kings-cross-royal-scot')).toMatch(/^No gym, no pool,.*no wheelchair access/);
    expect(amenityLine('nowhere')).toBe('');
  });

  it('are its own while staying there: a gym where it has one, none where it hasn’t', () => {
    const sim = life('us-ny-newyork', 'amen-gym');
    const p = sim.player;
    p.currentLocationId = 'uk-eng-london';
    p.stay = { kind: 'hotel', cityId: 'uk-eng-london', hotelId: 'travelodge-london-kings-cross-royal-scot' };
    expect(amenitiesOf('travelodge-london-kings-cross-royal-scot')!.gym).toBe(false);
    expect(stayPlace(sim, p).fixtures.gym).toBe('none');
    p.stay = { kind: 'hotel', cityId: 'uk-eng-london', hotelId: 'the-savoy-london' };
    expect(stayPlace(sim, p).fixtures.gym).toBe('building');
    // A hotel not named: the usual, a gym.
    p.stay = { kind: 'hotel', cityId: 'uk-eng-london' };
    expect(stayPlace(sim, p).fixtures.gym).toBe('building');
  });

  it('a pool to swim in at a hotel with an indoor one; none at one without', () => {
    const sim = life('us-ny-newyork', 'amen-pool');
    const p = sim.player;
    const indoor = HOTEL_AMENITIES.find((a) => a.pool === 'indoor')!;
    const city = hotelById(indoor.id)!.cityId;
    p.currentLocationId = city;
    p.stay = { kind: 'hotel', cityId: city, hotelId: indoor.id };
    addItem(sim, p, { kind: 'test:swimsuit', label: 'Swimsuit', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now, garment: { kind: 'swimsuit', slot: 'active', care: 'wash', wears: 0, washes: 0 } });
    expect(swimRefusal(sim, p)).toBeUndefined();
    p.stay = { kind: 'hotel', cityId: city, hotelId: 'travelodge-london-kings-cross-royal-scot' };
    expect(swimRefusal(sim, p)).toBe('You have no pool.');
    // Checked out, it isn't yours.
    p.stay = { kind: 'hotel', cityId: city, hotelId: indoor.id, out: true };
    expect(swimRefusal(sim, p)).toBe('You have no pool.');
  });
});

describe('a hotel search', () => {
  it('keeps the hotels whose own pages state what’s wanted, and only those', () => {
    expect(hotelHas('the-savoy-london', ['gym', 'pool'])).toBe(true);
    expect(hotelHas('travelodge-london-kings-cross-royal-scot', ['gym'])).toBe(false);
    expect(hotelHas('travelodge-london-kings-cross-royal-scot', ['wheelchair'])).toBe(false);
    expect(hotelHas('la-quinta-new-haven', ['breakfast'])).toBe(true);
    expect(hotelHas('pod-times-square', ['pets'])).toBe(true);
    // A hotel whose pages don't say isn't counted as having it.
    expect(hotelHas('premier-inn-london-county-hall', ['gym'])).toBe(false);
    expect(hotelHas('the-plaza-nyc', [])).toBe(true);
    expect(hotelHas('nowhere', ['gym'])).toBe(false);
  });
});
