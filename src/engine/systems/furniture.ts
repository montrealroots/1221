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
 * Not kept, and said so: a removal's cost, a mattress wearing out, the rest
 * of a home's furniture.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { FURNITURE, PIECE_LABEL, WITHOUT, type Piece } from '../content/furniture';
import { inTheBank, payFromBank } from './household';

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
  return { amount: inSave(sim, Math.round((item.price + item.delivery) * 100) + tax, country.currency), tax: inSave(sim, tax, country.currency) };
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
