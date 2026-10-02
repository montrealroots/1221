/**
 * SLATE — tinted windows (docs/WORLD.md, stage 3m), from 2026-09-30,
 * researched in `docs/research/world/research-ev-tint-security.json`,
 * `research-electricity-charging.json` and `research-tint-effects.json`.
 *
 * A shop's tint on a sedan, at a named shop's price where one lives: all the
 * side windows and the back, or where the law allows only the back, the back.
 * The law decides whether it's legal:
 * - New York wants 70% light through the front and, on a car, the rear side
 *   windows (VTL 375), so any real tint is illegal.
 * - Connecticut allows 35%, so it's legal there.
 * - California allows almost nothing on the front side windows.
 * - Ontario's front sides are commonly held to 70% (secondary).
 * - British Columbia allows film only behind the driver.
 * - Mexico City forbids darkening side or rear windows more than 20%.
 * - Britain and Ireland want 70% and 65% on the front side windows.
 *
 * Illegal tint has consequences:
 * - New York's annual inspection has examined tint since 2017, and Ireland's
 *   NCT fails front windows under 65%. A car tinted illegally fails at
 *   inspection: the tint is taken off and the retest paid.
 * - On the road, a ticket carries the place's fine and an order to remove the
 *   tint.
 *
 * No share of cars tinted darker than the law allows is published anywhere.
 * So a ticket is drawn at New York's tint tickets per registered passenger
 * car, 119,808 over 9,277,782 (the DMV's 2025 tickets and its registrations,
 * September 2026): the lowest rate the figures allow, as if every car were
 * tinted. The same rate is used where no count is published.
 *
 * Legal or not, the tint keeps the car cooler. NREL measured aftermarket
 * film on all the windows at 1.8 °C cooler air at breath level. Its study of
 * solar-reflective glass, 7.1 °C cooler, cut air conditioning's fuel 26%, and
 * air conditioning burns 6.1% of America's light-duty fuel (NREL, 2018).
 * SLATE scales the glass's saving by the film's share of its cooling: about
 * 0.4% less fuel or charge, its reading of the three.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import type { Jurisdiction } from '../content/vehiclefees';
import { owe, payFromBank } from './household';
import type { OwnedVehicle } from './vehicles';

export type TintKind = 'rear' | 'full';

export interface TintRule {
  currency: string;
  /** A shop's price for each kind it sells, and whether the law allows it. */
  kinds: Partial<Record<TintKind, { price: number; legal: boolean; shop: string }>>;
  /** A roadside ticket's fine; none where no amount was found. */
  fine?: number;
  /** Taking it off, where a price was read, or the nearest one that was, in its own money where that differs. */
  removal?: number;
  removalCurrency?: string;
  /** An inspection that fails illegal tint, and its retest's fee. */
  inspection?: { retest: number };
}

/**
 * The fines: New York's up to $150 (VTL 375(32)(a)), taken at the most;
 * Connecticut's $136 and California's $197 with its assessments, both
 * secondary; Ontario's CAD 85 set fine; BC's CAD 109 ticket; Mexico City's
 * 20 UMA at 2026's value, the least of its 20 to 30; Britain's £50 for
 * front side windows under 70%. Ireland's amount wasn't found and none is
 * charged, though the NCT still fails it. The removal: Toronto's CAD 150 for
 * a sedan, read at Car Tint and taken in Vancouver too; Connecticut's $85 an
 * hour for two hours, SLATE's estimate, in America; the €200 a Wexford shop
 * charges, in Ireland and, the nearest read, in Britain. None was read in
 * Mexico City.
 */
export const TINT: Readonly<Record<Jurisdiction, TintRule>> = {
  'US-NY': { currency: 'USD', kinds: { full: { price: 250, legal: false, shop: 'Full Spectrum Tints, Queens, its carbon package' } }, fine: 150, removal: 170, inspection: { retest: 0 } },
  'US-CT': { currency: 'USD', kinds: { full: { price: 300, legal: true, shop: 'M&M Auto Detailing, Glastonbury' } }, fine: 136, removal: 170 },
  'US-CA': { currency: 'USD', kinds: { full: { price: 285, legal: false, shop: 'Firm Detailing, Los Angeles, carbon' } }, fine: 197, removal: 170 },
  'CA-ON': { currency: 'CAD', kinds: { full: { price: 290, legal: false, shop: 'Car Tint, Toronto' } }, fine: 85, removal: 150 },
  'CA-BC': { currency: 'CAD', kinds: { rear: { price: 299, legal: true, shop: 'Inspire Auto Studio, Richmond, dyed' } }, fine: 109, removal: 150 },
  'MX-CMX': { currency: 'MXN', kinds: { full: { price: 1_500, legal: false, shop: 'Polarizado Autos CDMX' } }, fine: 2_346.2 },
  GB: { currency: 'GBP', kinds: { rear: { price: 160, legal: true, shop: 'Select Tints, South East London' }, full: { price: 220, legal: false, shop: 'Select Tints, South East London' } }, fine: 50, removal: 200, removalCurrency: 'EUR' },
  IE: { currency: 'EUR', kinds: { rear: { price: 160, legal: true, shop: 'QZ Tints, Blanchardstown' }, full: { price: 220, legal: false, shop: 'QZ Tints, Blanchardstown' } }, removal: 200, inspection: { retest: 40 } },
};

/** New York's tint tickets a year per registered passenger car, 2025. */
export const TINT_TICKETS_A_YEAR = 119_808 / 9_277_782;
/** What tint takes off a car's fuel or charge: the film's 1.8 °C over the glass's 7.1 °C, of the glass's 26% off air conditioning's 6.1%. */
export const TINT_FUEL_SAVING = 0.061 * 0.26 * (1.8 / 7.1);

const inSave = (sim: Simulation, units: number, from: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur) ?? c; };

/** Whether a car's tint breaks the law where it's registered. */
export const illegalTint = (v: OwnedVehicle): boolean => v.tint !== undefined && TINT[v.jurisdiction].kinds[v.tint]?.legal === false;

/** A tinted car's fuel or charge, as a factor. */
export const tintFuelFactor = (v: OwnedVehicle): number => (v.tint ? 1 - TINT_FUEL_SAVING : 1);

/** The tint taken off, at the place's removal price where one was read; the price in the save's money. */
function removeTint(sim: Simulation, person: Person, v: OwnedVehicle, memo: string): Money {
  const rule = TINT[v.jurisdiction];
  delete v.tint;
  if (!rule.removal) return 0;
  const cost = inSave(sim, rule.removal, rule.removalCurrency ?? rule.currency);
  if (!payFromBank(sim, person, cost, memo, 'vehicle')) owe(sim, person, cost, memo, 'vehicle');
  return cost;
}

/** At an inspection that examines tint: illegal tint fails it, comes off, and the retest is paid. */
export function tintAtInspection(sim: Simulation, person: Person, v: OwnedVehicle): boolean {
  const rule = TINT[v.jurisdiction];
  if (!rule.inspection || !illegalTint(v)) return false;
  const removal = removeTint(sim, person, v, 'Tint taken off after a failed inspection');
  const retest = inSave(sim, rule.inspection.retest, rule.currency);
  if (retest > 0 && !payFromBank(sim, person, retest, 'The inspection’s retest', 'vehicle')) owe(sim, person, retest, 'The inspection’s retest', 'vehicle');
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'The Tint Failed Inspection', body: `It was darker than the law allows, so it came off and the car was tested again: ${formatMoney(removal + retest, saveCurrency(sim.universe), { cents: false })}.`, importance: 55, route: '/workspace/vehicles' });
  return true;
}

/** A month driven with illegal tint: a ticket, at New York's rate a car (decider `vehicle.tint`), its fine and the tint taken off. */
export function tintOnTheRoad(sim: Simulation, person: Person, v: OwnedVehicle, at: number, odds?: number): boolean {
  if (!illegalTint(v)) return false;
  const chance = odds ?? 1 - Math.exp(-TINT_TICKETS_A_YEAR / 12);
  if (sim.rng('vehicle.tint', v.id, at).next() >= chance) return false;
  const rule = TINT[v.jurisdiction];
  const fine = rule.fine ? inSave(sim, rule.fine, rule.currency) : 0;
  if (fine > 0 && !payFromBank(sim, person, fine, 'A ticket for window tint', 'vehicle')) owe(sim, person, fine, 'A ticket for window tint', 'vehicle');
  // Mexico City's removal price wasn't read, and there the tint stays.
  const removal = rule.removal ? removeTint(sim, person, v, 'Tint taken off, as the ticket ordered') : 0;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'A Ticket For Window Tint', body: `Stopped for tint darker than the law allows: ${formatMoney(fine + removal, saveCurrency(sim.universe), { cents: false })}${removal ? ', the fine and taking it off' : ''}.`, importance: 55, route: '/workspace/vehicles' });
  return true;
}

export function tintRefusal(v: OwnedVehicle | undefined, kind: TintKind, glazed = true): string | undefined {
  if (!v || v.soldAt !== undefined) return 'That isn’t a car you have.';
  if (!glazed) return 'It has no windows to tint.';
  if (v.tint) return 'It’s tinted.';
  if (!TINT[v.jurisdiction].kinds[kind]) return kind === 'rear' ? 'Shops there tint all round, not the back alone.' : 'Shops there tint only behind the driver, as the law allows.';
  return undefined;
}

export function registerTint(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, glazed: (v: OwnedVehicle) => boolean): void {
  sim.onCommand<{ vehicleId: string; kind: TintKind }, { paid: Money; legal: boolean }>('vehicle.tint', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    const kind: TintKind = p?.kind === 'rear' ? 'rear' : 'full';
    const no = tintRefusal(v, kind, v ? glazed(v) : true);
    if (no) throw new CommandError(no);
    const offer = TINT[v!.jurisdiction].kinds[kind]!;
    const cost = inSave(s, offer.price, TINT[v!.jurisdiction].currency);
    if (!payFromBank(s, person, cost, `Window tint, ${offer.shop}`, 'vehicle')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    v!.tint = kind;
    return { paid: cost, legal: offer.legal };
  });
}
