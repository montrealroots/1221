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
 * any. Until 2026-10-03 a body kit's parts weren't priced, and none was sold;
 * elsewhere nothing was.
 *
 * From 2026-10-03 (`research-vehicles-deeper.json`):
 * - A body kit in Britain: Royal Body Kits' Maxton Design front splitter,
 *   £141, fitted by Delta Styling from £50, loaded as the study's body kit;
 *   in America Maxton Design USA's front splitter, $305.99, and the lowest of
 *   the lip-kit fitting Vicrez's installers quote, $200.
 * - Wheels in America: four of Konig's Incident, its cheapest cast, from
 *   $131.79 a wheel on its own store.
 * - LED headlight bulbs in Britain: Halfords' Advanced LEDr twin pack, £37.99,
 *   fitted at its £11 a bulb (the price read secondhand). The MOT fails a
 *   halogen headlamp converted to LED (its manual, 4.1.4(c)): failed, the
 *   halogens go back, Powerbulbs' Philips X-tremeVision pair at £25.49
 *   (secondhand) and £22 to fit them.
 * America publishes no insurer's loading for any of them, so there they're
 * the car's own look, and change nothing else.
 *
 * **In the shop while it's fitted** (from 2026-10-04): until then a
 * modification was on the car the moment it was paid for. Now the car is at
 * the fitter's for the work's hours (`MOD_HOURS`), as a wrap or a repair
 * keeps it, and can't be driven meanwhile; the way about is on foot, by
 * transit or a stand-in. A second fitted while it's there adds its hours.
 * No fitter's own times were read: each is SLATE's estimate of the job, a
 * respray a working week, a remap and an exhaust half a day, springs, a body
 * kit's splitter and wheels a day's part, the bulbs an hour.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payFromBank } from './household';
import type { OwnedVehicle } from './vehicles';

export type Mod = 'respray' | 'remap' | 'lowering' | 'exhaust' | 'wheels' | 'bodykit' | 'led';
export const MOD_LOADING = { tint: 0.121, respray: 0.0452, remap: 0.1593, lowering: 0.1593, exhaust: 0.1593, wheels: 0.0079, bodykit: 0.1593, led: 0 } as const;
/** Where each is sold and at what, fitted, in the market's money. */
export const MOD_OFFERS: Readonly<Record<Mod, Partial<Record<'GB' | 'US', { price: number; currency: string }>>>> = {
  respray: { GB: { price: 3_000, currency: 'GBP' } },
  remap: { GB: { price: 449, currency: 'GBP' } },
  lowering: { GB: { price: 779.15, currency: 'GBP' } },
  exhaust: { GB: { price: (1_038.46 + 1_426.34) / 2, currency: 'GBP' } },
  wheels: { GB: { price: 332, currency: 'GBP' }, US: { price: 131.79 * 4, currency: 'USD' } },
  bodykit: { GB: { price: 141 + 50, currency: 'GBP' }, US: { price: 305.99 + 200, currency: 'USD' } },
  led: { GB: { price: 37.99 + 2 * 11, currency: 'GBP' } },
};
/** Halogens back after an MOT fails LEDs: the pair and their fitting. */
export const HALOGENS_BACK_GBP = 25.49 + 2 * 11;
export const MOD_LABEL: Readonly<Record<Mod, string>> = { respray: 'A Full Respray', remap: 'An Engine Remap', lowering: 'Lowering Springs', exhaust: 'A Sports Exhaust', wheels: 'Alloy Wheels', bodykit: 'A Body Kit', led: 'LED Headlight Bulbs' };
export const MODS: readonly Mod[] = ['led', 'wheels', 'bodykit', 'respray', 'remap', 'lowering', 'exhaust'];
/** The hours each takes at the fitter's: SLATE's estimates, no shop's own time having been read. */
export const MOD_HOURS: Readonly<Record<Mod, number>> = { respray: 120, remap: 4, lowering: 8, exhaust: 4, wheels: 2, bodykit: 8, led: 1 };
/** Who fits it, by market: the shops whose prices are kept. */
export const MOD_FITTER: Readonly<Record<Mod, Partial<Record<'GB' | 'US', string>>>> = {
  respray: { GB: 'the body shop' }, remap: { GB: 'VUDU Performance' }, lowering: { GB: 'QT Performance' }, exhaust: { GB: 'QT Performance' },
  wheels: { GB: 'LK Performance', US: 'the tire shop' }, bodykit: { GB: 'Delta Styling', US: 'a Vicrez installer' }, led: { GB: 'Halfords' },
};
const modMarket = (v: OwnedVehicle): 'GB' | 'US' | undefined => (v.jurisdiction === 'GB' ? 'GB' : v.jurisdiction.startsWith('US-') ? 'US' : undefined);

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
  const market = modMarket(v);
  if (!market || !MOD_OFFERS[mod][market]) return v.jurisdiction === 'GB' || v.jurisdiction.startsWith('US-') ? 'No price for it is read where it’s registered.' : 'SLATE sells modifications in Britain and America, where their prices are read.';
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
    const offer = MOD_OFFERS[mod][modMarket(v!)!]!;
    const cents = Math.round(offer.price * 100);
    const cost = cur === offer.currency ? cents : exchange(cents, offer.currency, cur) ?? cents;
    if (!payFromBank(s, person, cost, `${MOD_LABEL[mod]}, fitted`, 'vehicle')) throw new CommandError(`${formatMoney(cost, cur)} is more than the bank can cover.`);
    v!.mods = [...(v!.mods ?? []), mod];
    // At the fitter's for the work's hours, after any work already there.
    const from = Math.max(s.now, v!.inShop?.until ?? 0);
    v!.inShop = { shopId: `mods:${mod}`, until: from + MOD_HOURS[mod] * 3_600_000, name: MOD_FITTER[mod][modMarket(v!)!] ?? 'the fitter' };
    return { paid: cost };
  });
}
