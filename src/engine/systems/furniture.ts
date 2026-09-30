/**
 * SLATE — furniture of one's own (docs/WORLD.md, stage 6c), from
 * 2026-09-29, on the prices in `content/furniture.ts`.
 *
 * A home bought or built from 2026-09-29 comes empty, as a real one does; a
 * rented room or flat comes furnished, SLATE's reading of what a let
 * includes, and a home owned before then is taken as furnished, so no save
 * wakes to an empty house. A bed and a sofa are the person's, bought where
 * they live and delivered, and they move with them. In an empty home, a
 * night without a bed is slept on the floor and an hour unwinding without a
 * sofa takes half the stress off (`WITHOUT`).
 *
 * Movers take them from one home to the next, and a bed carries a state's
 * mattress recycling fee, from 2026-09-30 (below); until then neither was
 * kept. Not kept, and said so: a mattress wearing out, movers in Ireland or
 * abroad, and the rest of a home's furniture.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { FURNITURE, MATTRESS_FEE_USD, MOVERS, MOVERS_ABROAD, PIECE_LABEL, WITHOUT, type Piece } from '../content/furniture';
import { inTheBank, owe, payFromBank } from './household';

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** The home they live in, where they own it and it came empty. */
function bareHome(person: Person): boolean {
  if (person.home?.kind !== 'owned') return false;
  return (person.homes ?? []).find((h) => h.id === person.home!.homeId)?.bare === true;
}

export const owns = (person: Person, piece: Piece): boolean => person.furniture?.[piece] !== undefined;

/** Sleeping at home on the floor: an empty home and no bed of their own. */
export const onTheFloor = (person: Person): boolean => bareHome(person) && !owns(person, 'bed');

/** What an hour unwinding at home takes off, of the usual: half in an empty home with no sofa. */
export const unwindComfort = (person: Person): number => (bareHome(person) && !owns(person, 'sofa') ? WITHOUT.unwindBare : 1);

/** What a piece costs where a town is, delivered and taxed, in the save's money, cents; or nothing where SLATE keeps no price. */
export function pieceCost(sim: Simulation, cityId: string, piece: Piece): { amount: Money; tax: Money } | undefined {
  const country = FURNITURE[CITIES.get(cityId)?.countryId ?? ''];
  if (!country) return undefined;
  const item = country.items[piece];
  const taxRate = country.taxAdded ? salesTaxRate(cityId, sim.now, 'furniture') : 0;
  const tax = Math.round(item.price * 100 * taxRate);
  // A bed's mattress carries its state's recycling fee, where one is charged.
  const fee = piece === 'bed' ? inSave(sim, Math.round(mattressFeeUsd(cityId, sim.now) * 100), 'USD') : 0;
  return { amount: inSave(sim, Math.round((item.price + item.delivery) * 100) + tax, country.currency) + fee, tax: inSave(sim, tax, country.currency) };
}

export function furnishRefusal(sim: Simulation, person: Person, piece: Piece): string | undefined {
  if (owns(person, piece)) return 'You have one.';
  const where = person.home?.cityId ?? person.currentLocationId;
  const cost = pieceCost(sim, where, piece);
  if (!cost) return 'SLATE keeps no furniture prices where you live yet.';
  if (inTheBank(sim, person) < cost.amount) return `It costs ${formatMoney(cost.amount, saveCurrency(sim.universe), { cents: false })}, delivered.`;
  return undefined;
}

export function registerFurniture(sim: Simulation): void {
  sim.onCommand<{ piece: Piece }, { paid: Money }>('home.furnish', (p, { sim: s }) => {
    const person = s.player;
    const piece = p?.piece;
    if (piece !== 'bed' && piece !== 'sofa') throw new CommandError('No such piece.');
    const no = furnishRefusal(s, person, piece);
    if (no) throw new CommandError(no);
    const cost = pieceCost(s, person.home?.cityId ?? person.currentLocationId, piece)!;
    if (!payFromBank(s, person, cost.amount, `${PIECE_LABEL[piece]}, bought and delivered`, 'home')) throw new CommandError('The bank couldn’t pay for it.');
    (person.furniture ??= {})[piece] = s.now;
    return { paid: cost.amount };
  });
}

/** A state's mattress recycling fee on a bed bought there, in dollars, or nothing. */
export function mattressFeeUsd(cityId: string, at: number): number {
  const steps = MATTRESS_FEE_USD[CITIES.get(cityId)?.parentId ?? ''];
  return steps ? [...steps].reverse().find((s) => at >= s.from)!.usd : 0;
}

/**
 * What movers charge to take one's own bed and sofa from one home to the
 * next (\`MOVERS\`), in the save's money; nothing without pieces of one's own,
 * across a border, or where no figure is kept.
 */
export function moversCost(sim: Simulation, person: Person, fromCity: string, toCity: string): Money {
  if (!owns(person, 'bed') && !owns(person, 'sofa')) return 0;
  const from = CITIES.get(fromCity);
  const to = CITIES.get(toCity);
  if (!from || !to) return 0;
  // Abroad: the pair's own estimate, either way.
  if (from.countryId !== to.countryId) {
    const abroad = MOVERS_ABROAD[[from.countryId, to.countryId].sort().join('|')];
    return abroad ? inSave(sim, Math.round(abroad.amount * 100), abroad.currency) : 0;
  }
  const rates = MOVERS[from.countryId];
  if (!rates) return 0;
  const miles = distanceKm(from, to) / 1.609344;
  const units = miles <= 100 ? rates.local(miles) : rates.far;
  return units === undefined ? 0 : inSave(sim, Math.round(units * 100), rates.currency);
}

/** Movers paid on moving home, where one's own pieces go too. */
export function carryFurniture(sim: Simulation, person: Person, fromCity: string, toCity: string): void {
  const cost = moversCost(sim, person, fromCity, toCity);
  if (cost > 0 && !payFromBank(sim, person, cost, 'Movers, your bed and sofa', 'home')) owe(sim, person, cost, 'Movers', 'home');
}
