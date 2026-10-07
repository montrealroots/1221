/**
 * Everything under way, in one list (`systems/underway.ts`, from 2026-10-02):
 * an order, a car on order, an appointment and a journey, soonest first, and
 * each gone once it's done; from 2026-10-06 the rest of its kinds too, a car
 * at a shop, a journey, a document, a rental held and a machine being mended,
 * each played to and played past (a home's works in `tests/homes.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { journeysOf } from '@/engine/systems/journey';
import { rentalsOf } from '@/engine/systems/rentals';
import { faultsOf, machinesDay } from '@/engine/systems/appliancefaults';
import { documentsOf } from '@/engine/systems/documents';
import { optionsFor } from '@/engine/systems/caroptions';
import { book } from '@/engine/systems/appointments';
import { underWay } from '@/engine/systems/underway';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { sizeFor } from '@/engine/systems/tailoring';

describe('under way', () => {
  it('lists an order, a car on order and an appointment, soonest first, and drops each when it’s done', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'underway');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'online', size: sizeFor(sim, sim.player, tee.sizes), color: tee.colors[0] } });
    const pack = optionsFor('us-ford-f-series').find((o) => o.category === 'package' && o.price > 0)!;
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-ford-f-series', options: [pack.key] } });
    book(sim, sim.player, 'A doctor’s visit');
    const list = underWay(sim, sim.player);
    expect(list.map((u) => u.kind).sort()).toEqual(['appointment', 'car', 'order']);
    expect(list.map((u) => u.until)).toEqual([...list.map((u) => u.until)].sort((a, b) => a - b));
    for (let i = 0; i < 400 && underWay(sim, sim.player).some((u) => u.kind === 'order'); i += 1) sim.advanceTo(sim.now + 6 * 3_600_000);
    expect(underWay(sim, sim.player).some((u) => u.kind === 'order')).toBe(false);
    expect(underWay(sim, sim.player).some((u) => u.kind === 'car')).toBe(true);
  });
});

// From 2026-10-06 (§59): until then six of the nine kinds were listed by nothing a test read.
describe('under way, each kind', () => {
  const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const noon = (sim: Simulation, after: number) => { const p = zonedParts(sim.now + after * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };
  const of = (sim: Simulation, kind: string) => underWay(sim, sim.player).filter((u) => u.kind === kind);

  it('a car at a shop, until it’s ready', () => {
    const sim = life('us-ny-newyork', 'uw-shop');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player)[0]!;
    expect(of(sim, 'shop')).toEqual([]);
    const r = sim.must<{ readyAt: number }>({ kind: 'vehicle.wrap', payload: { vehicleId: v.id, shopId: 'wrp', color: 'Red', finish: 'matte' } });
    expect(of(sim, 'shop')).toEqual([{ kind: 'shop', label: 'Toyota Camry, At WRP (We Reject Paint)', until: r.readyAt, route: '/workspace/vehicles' }]);
    sim.advanceTo(r.readyAt + 60_000);
    expect(of(sim, 'shop')).toEqual([]);
  });

  it('a journey, booked until it leaves and on the way until it arrives', () => {
    const sim = life('us-ct-newhaven', 'uw-journey');
    const r = sim.must<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: noon(sim, 10), slot: 2, nights: 2 } });
    const j = journeysOf(sim.player).find((x) => x.id === r.journeyId)!;
    expect(of(sim, 'journey')).toEqual([{ kind: 'journey', label: 'To New York', until: j.leaveAt, route: '/workspace/travel' }]);
    for (let i = 0; i < 2000 && j.status !== 'arrived'; i += 1) sim.advanceTo(sim.now + 30 * 60_000);
    expect(of(sim, 'journey')).toEqual([]);
  });

  it('a document being issued, until it’s ready', () => {
    const sim = life('us-ny-newyork', 'uw-document');
    // A life begins without a passport: applying for one.
    const issued = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    const listed = of(sim, 'document');
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ until: issued.readyAt, route: '/workspace/papers' });
    expect(listed[0]!.label).toMatch(/, Being Issued$/);
    sim.advanceTo(issued.readyAt + 60_000);
    expect(of(sim, 'document')).toEqual([]);
  });

  it('a rental car held at the desk for its deposit, until the hold ends', () => {
    const sim = life('us-ny-newyork', 'uw-rental');
    const day = noon(sim, 14);
    const booked = sim.must<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, returnDay: day + 7 * MS_DAY, returnSlot: 2 } });
    sim.must({ kind: 'travel.rent_car', payload: { journeyId: booked.journeyId } });
    const out = journeysOf(sim.player).find((x) => x.id === booked.journeyId)!;
    sim.advanceTo(out.leaveAt - MS_HOUR);
    // The bank emptied before the desk, as the deposits' own tests do, so the deposit can't be held and the car is.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')) a.balance = 0;
    const r = rentalsOf(sim.player)[0]!;
    for (let i = 0; i < 400 && r.status === 'booked'; i += 1) sim.advanceTo(sim.now + 30 * 60_000);
    expect(r.status).toBe('held');
    expect(of(sim, 'rental')).toEqual([{ kind: 'rental', label: 'A Rental Car Held For Its Deposit', until: r.heldUntil!, route: '/workspace/travel' }]);
    sim.advanceTo(r.heldUntil! + MS_HOUR);
    expect(of(sim, 'rental')).toEqual([]);
  });

  it('a machine being mended, until the technician’s been', () => {
    const sim = life('us-ny-newyork', 'uw-repair');
    expect(sim.player.home!.kind).not.toBe('owned');
    // The day's odds of a fault set to one, as the faults' own tests do: no command breaks a machine.
    machinesDay(sim, sim.player, 1);
    const fridge = faultsOf(sim.player).fridge!;
    expect(of(sim, 'repair')).toContainEqual({ kind: 'repair', label: 'The Fridge, Being Mended', until: fridge.fixAt!, route: '/home' });
    sim.advanceTo(fridge.fixAt! + MS_HOUR);
    expect(of(sim, 'repair').some((u) => u.label === 'The Fridge, Being Mended')).toBe(false);
  });
});
