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
 * A respray is sold in Britain: a full car in a solid color, the middle of
 * the £2,000 to £4,000 a body shop's guide gives (June 2026). Elsewhere no
 * effect of one was published, and none is sold. A remap, suspension, an
 * exhaust, a body kit or wheels weren't priced in Britain, where their
 * loading is, so they aren't sold yet.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payFromBank } from './household';
import type { OwnedVehicle } from './vehicles';

export const MOD_LOADING = { tint: 0.121, respray: 0.0452 } as const;
export const RESPRAY = { GB: { price: 3_000, currency: 'GBP' } } as const;

/** What a car's declared modifications add to its premium, as a factor: Britain's measured loadings. */
export function modLoading(v: OwnedVehicle): number {
  if (v.jurisdiction !== 'GB') return 1;
  return (v.tint ? 1 + MOD_LOADING.tint : 1) * (v.resprayed ? 1 + MOD_LOADING.respray : 1);
}

export function resprayRefusal(v: OwnedVehicle | undefined, glazed: boolean): string | undefined {
  if (!v || v.soldAt !== undefined) return 'That isn’t a car you have.';
  if (!glazed) return 'SLATE resprays a car or a van.';
  if (v.jurisdiction !== 'GB') return 'SLATE sells a respray in Britain, the one place its effect on insurance is published.';
  if (v.resprayed) return 'It’s been resprayed.';
  return undefined;
}

export function registerMods(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, glazed: (v: OwnedVehicle) => boolean): void {
  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.respray', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const no = resprayRefusal(v, v ? glazed(v) : true);
    if (no) throw new CommandError(no);
    const r = RESPRAY.GB;
    const cur = saveCurrency(s.universe);
    const cost = cur === r.currency ? r.price * 100 : exchange(r.price * 100, r.currency, cur) ?? r.price * 100;
    if (!payFromBank(s, person, cost, 'A full respray', 'vehicle')) throw new CommandError(`${formatMoney(cost, cur)} is more than the bank can cover.`);
    v!.resprayed = true;
    return { paid: cost };
  });
}
