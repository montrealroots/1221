/**
 * SLATE — clothes that fit, and a tailor who takes them in (Stage 3 of
 * `docs/BACKLOG.md`, from 2026-10-01; the tailors in `content/tailors.ts`).
 *
 * **Fit.** A garment fits the body it was bought for: SLATE keeps the
 * weight it was bought or last altered at, and reads a garment as a size
 * off once the weight is more than 7.5% either side of it, its estimate of
 * a size's step; no body measurements are kept to read a size by. Shoes,
 * socks and accessories don't change with weight. A garment that doesn't
 * fit isn't worn (`wearable` in `systems/wardrobe.ts`), and on a day with
 * time for the shops one grown out of is bought again as a worn-out one is.
 *
 * **Taking in.** A garment too big can be taken in by a tailor in the town
 * you're in, at its published price, and is ready after its stated days
 * (a week where none is stated, SLATE's estimate), to collect with the dry
 * cleaning. A garment grown out of can't be let out that far.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { TAILORS, type Tailor } from '../content/tailors';
import type { Slot } from '../content/garmentcare';
import { itemById, type Item } from './items';
import { spend } from './household';
import type { Garment } from './wardrobe';

export const FIT = { band: 0.075, weekDays: 7 } as const;
const UNSIZED: ReadonlySet<Slot> = new Set(['shoes', 'socks', 'accessory']);

export const tailorsIn = (cityId: string): Tailor[] => TAILORS.filter((t) => t.cityId === cityId);
export const tailorById = (id: string): Tailor | undefined => TAILORS.find((t) => t.id === id);

/** How a garment sits now: as it should, too big, or grown out of. */
export function fitOf(person: Person, g: Garment): 'fits' | 'big' | 'small' {
  const kg = person.body?.weightKg;
  if (g.fitKg === undefined || kg === undefined || UNSIZED.has(g.slot)) return 'fits';
  const ratio = kg / g.fitKg - 1;
  return ratio > FIT.band ? 'small' : ratio < -FIT.band ? 'big' : 'fits';
}

/** The weight a garment is made for now. */
export const fitKgOf = (person: Person): number | undefined => person.body?.weightKg;

export function alterRefusal(person: Person, itemId: string, tailorId: string): string | undefined {
  const item = itemById(person, itemId) as (Item & { garment?: Garment }) | undefined;
  if (!item?.garment) return 'That isn’t a garment of yours.';
  const fit = fitOf(person, item.garment);
  if (fit === 'fits') return 'It fits.';
  if (fit === 'small') return 'It can’t be let out that far.';
  const t = tailorById(tailorId);
  if (!t) return 'There’s no such tailor.';
  if (t.cityId !== person.currentLocationId) return 'The tailor is in another town.';
  if (item.at.kind === 'service') return 'It’s away already.';
  return undefined;
}

export const alterCost = (sim: Simulation, t: Tailor): Money => { const c = Math.round(t.takeIn * 100); const cur = saveCurrency(sim.universe); return cur === t.currency ? c : exchange(c, t.currency, cur) ?? c; };

export function registerTailoring(sim: Simulation): void {
  sim.onCommand<{ itemId: string; tailorId: string }, { readyAt: number; paid: Money }>('clothes.alter', (p, { sim: s }) => {
    const person = s.player;
    const no = alterRefusal(person, String(p?.itemId), String(p?.tailorId));
    if (no) throw new CommandError(no);
    const t = tailorById(String(p.tailorId))!;
    const item = itemById(person, String(p.itemId)) as Item & { garment: Garment };
    const paid = alterCost(s, t);
    if (!spend(s, person, paid, `${t.name}, taken in`, 'clothing')) throw new CommandError('The payment didn’t go through.');
    const readyAt = s.now + (t.turnaroundDays ?? FIT.weekDays) * MS_DAY;
    item.at = { kind: 'service', serviceId: `tailor:${t.cityId}:${t.id}`, readyAt };
    item.garment.fitKg = fitKgOf(person);
    return { readyAt, paid };
  });
}
