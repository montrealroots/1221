/**
 * SLATE — a roof rack and a roof box on a car (the master plan's §38f, from
 * 2026-10-03; `docs/research/world/research-vehicles-deeper.json`, each
 * maker's own store read that day).
 *
 * **The rack** first, the cheapest complete system on the maker's store:
 * Thule's SquareBar Evo, from $444.90 in America, C$529.90 in Canada, £229.98
 * in Britain and €268.45 in Ireland. Mexico's store lists only bars and feet,
 * no complete system, and none is sold there.
 * **A box** goes on the rack, cheapest first: in America Yakima's SkyBox 12
 * (12 cubic feet, 340 liters) at $469 and SkyBox 16 (453) at $599, and Thule's
 * Motion 3 L (450) at $1,099.95; in Canada the Motion 3 L at C$1,329.95; in
 * Britain Thule's Pulse 2 M (400) at £459.99, Force 3 L Sport (300) at £499.99
 * and Motion 3 Sport (300) at £629.99. Ireland's store lists no box.
 *
 * **What it does.** On, the box holds its liters beside what the car does
 * (`stow` in `systems/trips.ts`), and costs fuel: fueleconomy.gov's large
 * roof-top box, 2 to 8% in town and 6 to 17% on the highway, the middle of
 * each taken, 5% and 11.5%. Off, it's kept at home in storage, the way people
 * take one off between trips, and costs nothing.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';
import type { OwnedVehicle } from './vehicles';

const CU_FT_L = 28.3168;

export interface RoofBox { id: string; name: string; liters: number; price: number }
export const ROOF_RACK: Readonly<Record<string, { name: string; price: number; currency: string }>> = {
  US: { name: 'Thule SquareBar Evo', price: 444.9, currency: 'USD' },
  CA: { name: 'Thule SquareBar Evo', price: 529.9, currency: 'CAD' },
  GB: { name: 'Thule SquareBar Evo', price: 229.98, currency: 'GBP' },
  IE: { name: 'Thule SquareBar Evo', price: 268.45, currency: 'EUR' },
};
export const ROOF_BOXES: Readonly<Record<string, { currency: string; boxes: readonly RoofBox[] }>> = {
  US: { currency: 'USD', boxes: [
    { id: 'yakima-skybox-12', name: 'Yakima SkyBox 12', liters: Math.round(12 * CU_FT_L), price: 469 },
    { id: 'yakima-skybox-16', name: 'Yakima SkyBox 16', liters: Math.round(16 * CU_FT_L), price: 599 },
    { id: 'thule-motion-3-l', name: 'Thule Motion 3 L', liters: 450, price: 1_099.95 },
  ] },
  CA: { currency: 'CAD', boxes: [{ id: 'thule-motion-3-l', name: 'Thule Motion 3 L', liters: 450, price: 1_329.95 }] },
  GB: { currency: 'GBP', boxes: [
    { id: 'thule-pulse-2-m', name: 'Thule Pulse 2 M', liters: 400, price: 459.99 },
    { id: 'thule-force-3-l-sport', name: 'Thule Force 3 L Sport', liters: 300, price: 499.99 },
    { id: 'thule-motion-3-sport', name: 'Thule Motion 3 Sport', liters: 300, price: 629.99 },
  ] },
};
/** A large roof-top box's fuel, the middle of fueleconomy.gov's ranges. */
export const ROOF_BOX_FUEL = { town: 0.05, highway: 0.115 } as const;

/** The box on a car, or none. */
export const boxOn = (person: Person, v: OwnedVehicle) => itemsOf(person).find((i) => i.kind.startsWith('roofbox:') && i.at.kind === 'vehicle' && i.at.vehicleId === v.id);
/** What a car burns, as a share of its rating, for the box on its roof. */
export const roofFuelFactor = (v: OwnedVehicle, road: 'town' | 'highway' = 'town'): number => (v.roofBoxL ? 1 + ROOF_BOX_FUEL[road] : 1);

const marketOf = (v: OwnedVehicle): string => (v.jurisdiction === 'GB' ? 'GB' : v.jurisdiction === 'IE' ? 'IE' : v.jurisdiction === 'MX-CMX' ? 'MX' : v.jurisdiction.startsWith('CA-') ? 'CA' : 'US');

export function rackRefusal(v: OwnedVehicle | undefined): string | undefined {
  if (!v || v.soldAt !== undefined) return 'That isn’t a car you own.';
  if (v.roofRack) return 'It has a rack.';
  if (!ROOF_RACK[marketOf(v)]) return 'No complete roof rack is sold where it’s registered.';
  return undefined;
}

export function boxRefusal(person: Person, v: OwnedVehicle | undefined, boxId: string): string | undefined {
  if (!v || v.soldAt !== undefined) return 'That isn’t a car you own.';
  if (!v.roofRack) return 'A box goes on a roof rack: fit one first.';
  if (!ROOF_BOXES[marketOf(v)]?.boxes.some((b) => b.id === boxId)) return 'That box isn’t sold where it’s registered.';
  if (boxOn(person, v)) return 'It has a box on.';
  return undefined;
}

export function roofCatalog(sim: Simulation, v: OwnedVehicle): { rack?: { name: string; price: Money }; boxes: (RoofBox & { cost: Money })[] } {
  const m = marketOf(v);
  const rack = ROOF_RACK[m];
  const boxes = ROOF_BOXES[m];
  return {
    ...(rack ? { rack: { name: rack.name, price: inSaveMoney(sim, Math.round(rack.price * 100), rack.currency) } } : {}),
    boxes: (boxes?.boxes ?? []).map((b) => ({ ...b, cost: inSaveMoney(sim, Math.round(b.price * 100), boxes!.currency) })).sort((a, b) => a.cost - b.cost),
  };
}

export function registerRoofBox(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined): void {
  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.roof_rack', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const no = rackRefusal(v);
    if (no) throw new CommandError(no);
    const price = roofCatalog(s, v!).rack!.price;
    if (!payFromBank(s, person, price, ROOF_RACK[marketOf(v!)]!.name, 'vehicle')) throw new CommandError(`${formatMoney(price, saveCurrency(s.universe))} is more than the bank can cover.`);
    v!.roofRack = true;
    return { paid: price };
  });
  sim.onCommand<{ vehicleId: string; boxId: string }, { paid: Money }>('vehicle.roof_box', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const no = boxRefusal(person, v, String(p?.boxId));
    if (no) throw new CommandError(no);
    const box = roofCatalog(s, v!).boxes.find((b) => b.id === p.boxId)!;
    if (!payFromBank(s, person, box.cost, box.name, 'vehicle')) throw new CommandError(`${formatMoney(box.cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    addItem(s, person, { kind: `roofbox:${box.id}`, label: box.name, quantity: 1, condition: 1, at: { kind: 'vehicle', vehicleId: v!.id }, acquiredAt: s.now, paid: box.cost, bulky: true, volumeL: box.liters, holdsL: box.liters });
    v!.roofBoxL = box.liters;
    return { paid: box.cost };
  });
  // On or off: off, it's kept at home; on, it's back on the roof.
  sim.onCommand<{ vehicleId: string; on: boolean }, { on: boolean }>('vehicle.roof_box_fit', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you own.');
    const home = homeKeyOf(person.home);
    if (p.on) {
      if (!v.roofRack) throw new CommandError('A box goes on a roof rack.');
      if (boxOn(person, v)) throw new CommandError('It has a box on.');
      const box = itemsOf(person).find((i) => i.kind.startsWith('roofbox:') && i.at.kind === 'home' && i.at.home === home);
      if (!box || person.currentLocationId !== person.home?.cityId) throw new CommandError('There’s no box of yours at home to put on.');
      box.at = { kind: 'vehicle', vehicleId: v.id };
      v.roofBoxL = box.holdsL;
      return { on: true };
    }
    const box = boxOn(person, v);
    if (!box) throw new CommandError('There’s no box on it.');
    if (!home || person.currentLocationId !== person.home?.cityId) throw new CommandError('It’s taken off at home, to be kept there.');
    if (itemsOf(person).some((i) => i.at.kind === 'inside' && i.at.itemId === box.id)) throw new CommandError('Empty it first.');
    box.at = { kind: 'home', home, spot: 'storage' };
    delete v.roofBoxL;
    return { on: false };
  });
}
