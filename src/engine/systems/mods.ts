/**
 * SLATE — what a car's modifications do to its insurance (docs/WORLD.md,
 * stage 3n), from 2026-09-30, researched in
 * `docs/research/world/research-custom-effects.json` and
 * `research-customization.json`.
 *
 * Britain's insurers ask about modifications, and a declared one raises the
 * premium. A quote study across ten British cities (July 2025) measured each
 * one alone: tinted windows 12.1% and a non-standard respray 4.52%, beside an
 * engine remap, suspension, exhaust or body kit at 15.93%, and alloy wheels at
 * 0.79%. SLATE's owners declare what they fit, as the Consumer Insurance Act
 * asks. Two together are taken as the product of the two, SLATE's reading,
 * since the study measured each alone.
 *
 * Sold in Britain, where their loading is, at a named shop's price
 * (`research-customization.json`, and `research-mods-smog.json` from later on
 * 2026-09-30): a full respray in a solid color, the middle of the £2,000 to
 * £4,000 a body shop's guide gives (June 2026); a stage 1 remap, VUDU
 * Performance's £449; lowering springs fitted, QT Performance's £779.15 for
 * Eibach's Pro-Kit; a cat-back exhaust fitted, the middle of QT Performance's
 * £1,038.46 to £1,426.34 for Cobra Sport's; four alloy wheels, LK Performance's
 * £332 a set, fitted free. The tuners' prices are for one car each, taken for
 * any. A body kit's parts weren't priced, only fitting and paint, and none is
 * sold. Elsewhere no effect was published, and none is sold.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payFromBank } from './household';
import type { OwnedVehicle } from './vehicles';

export type Mod = 'respray' | 'remap' | 'lowering' | 'exhaust' | 'wheels';
export const MOD_LOADING = { tint: 0.121, respray: 0.0452, remap: 0.1593, lowering: 0.1593, exhaust: 0.1593, wheels: 0.0079 } as const;
export const MOD_PRICE: Readonly<Record<Mod, number>> = { respray: 3_000, remap: 449, lowering: 779.15, exhaust: (1_038.46 + 1_426.34) / 2, wheels: 332 };
export const MOD_LABEL: Readonly<Record<Mod, string>> = { respray: 'A Full Respray', remap: 'An Engine Remap', lowering: 'Lowering Springs', exhaust: 'A Sports Exhaust', wheels: 'Alloy Wheels' };
export const MODS: readonly Mod[] = ['wheels', 'respray', 'remap', 'lowering', 'exhaust'];

/** What a car's declared modifications add to its premium, as a factor: Britain's measured loadings. */
export function modLoading(v: OwnedVehicle): number {
  if (v.jurisdiction !== 'GB') return 1;
  const fitted = [...(v.mods ?? []), ...(v.resprayed ? ['respray' as const] : [])];
  // A wrap is told as a non-standard respray is, the nearest loading published (`systems/wraps.ts`, from 2026-10-01).
  const wrapped = v.wrap && !fitted.includes('respray') ? 1 + MOD_LOADING.respray : 1;
  return fitted.reduce((f, m) => f * (1 + MOD_LOADING[m]), (v.tint ? 1 + MOD_LOADING.tint : 1) * wrapped);
}

export function modRefusal(v: OwnedVehicle | undefined, mod: Mod, glazed: boolean): string | undefined {
  if (!v || v.soldAt !== undefined) return 'That isn’t a car you have.';
  if (!MODS.includes(mod)) return 'No such modification.';
  if (!glazed) return 'SLATE modifies a car or a van.';
  if (v.jurisdiction !== 'GB') return 'SLATE sells modifications in Britain, the one place their effect on insurance is published.';
  if (v.lease) return 'A leased car is the lender’s, and isn’t modified.';
  if ((v.mods ?? []).includes(mod) || (mod === 'respray' && v.resprayed)) return 'It has one.';
  return undefined;
}

export function registerMods(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, glazed: (v: OwnedVehicle) => boolean): void {
  sim.onCommand<{ vehicleId: string; mod: Mod }, { paid: Money }>('vehicle.modify', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const mod = p?.mod as Mod;
    const no = modRefusal(v, mod, v ? glazed(v) : true);
    if (no) throw new CommandError(no);
    const cur = saveCurrency(s.universe);
    const pence = Math.round(MOD_PRICE[mod] * 100);
    const cost = cur === 'GBP' ? pence : exchange(pence, 'GBP', cur) ?? pence;
    if (!payFromBank(s, person, cost, `${MOD_LABEL[mod]}, fitted`, 'vehicle')) throw new CommandError(`${formatMoney(cost, cur)} is more than the bank can cover.`);
    v!.mods = [...(v!.mods ?? []), mod];
    return { paid: cost };
  });
}
