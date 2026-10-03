/**
 * SLATE — a car stereo fitted, and what insurance pays for it when the car is
 * lost (Stage 8 of `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-cars-clothes.json`, read 2026-10-02.
 *
 * **The stereo.** The cheapest head unit with Apple CarPlay and Android Auto
 * at a named retailer, fitted:
 * - America: Best Buy's Pioneer DMH-1500NEX, $279.99, and its touchscreen
 *   installation, $149.99.
 * - Britain: Halfords' JVC KW-M560BT, £140 (a search's summary), fitted from
 *   £110.
 * - Ireland: Halfords' Pioneer SPH-DA150BT, €275, fitted from €120.
 * - Canada: Best Buy Canada's Pioneer DMH-1500NEX, C$448.99. No Canadian
 *   retailer publishes a fitting price, so none is sold there.
 * - Mexico: Walmart's Pioneer DMH-1800NEX, MX$6,799. No retailer publishes a
 *   fitting price, so none is sold there either.
 *
 * **What insurance pays for it.** Aftermarket sound equipment is capped when
 * the car is stolen and not found, or written off, under full cover:
 * Progressive's included $1,000 of custom parts in America; Admiral's £1,250
 * for aftermarket audio in Britain; in Ireland Aviva's lesser of €650 and 5%
 * of the car's insured value. Paid at what it cost, to the cap, SLATE's
 * reading of an actual cash value no insurer publishes for a year-old stereo.
 * Until 2026-10-02 no car had a stereo to lose.
 *
 * **Speakers and an amplifier** (from 2026-10-03,
 * `research-vehicles-deeper.json`), each fitted, at a named retailer:
 * - America: a pair of JBL Concert Series 621 at Crutchfield, $69.99
 *   (secondhand), fitted by Geek Squad's standard speaker installation,
 *   $99.99; Kicker's 47KEY200.4 four-channel amplifier at Crutchfield,
 *   $299.99, and Geek Squad's four-channel installation, $249.99 (both
 *   secondhand).
 * - Britain: Halfords' Pioneer TS-G670 pair, £34.99, fitted at its £60 (read
 *   secondhand). No amplifier's fitting is read.
 * They're the car's sound equipment with the stereo, so what insurance pays
 * when the car is lost is all of it together, to the one cap.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import type { Jurisdiction } from '../content/vehiclefees';
import { payFromBank } from './household';
import type { OwnedVehicle } from './vehicles';

type Market = 'us' | 'gb' | 'ie';
const marketOf = (j: Jurisdiction): Market | undefined => (j.startsWith('US-') ? 'us' : j === 'GB' ? 'gb' : j === 'IE' ? 'ie' : undefined);

export const HEAD_UNIT: Readonly<Record<Market, { retailer: string; unit: string; price: number; fitting: number; currency: string }>> = {
  us: { retailer: 'Best Buy', unit: 'Pioneer DMH-1500NEX', price: 279.99, fitting: 149.99, currency: 'USD' },
  gb: { retailer: 'Halfords', unit: 'JVC KW-M560BT', price: 140, fitting: 110, currency: 'GBP' },
  ie: { retailer: 'Halfords', unit: 'Pioneer SPH-DA150BT', price: 275, fitting: 120, currency: 'EUR' },
};
/** The most full cover pays for it, in its money; Ireland's the lesser of this and 5% of the car's value. */
export const AUDIO_CAP: Readonly<Record<Market, { cap: number; ofValue?: number }>> = { us: { cap: 1_000 }, gb: { cap: 1_250 }, ie: { cap: 650, ofValue: 0.05 } };

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

export type AudioPart = 'speakers' | 'amp';
export const AUDIO_PARTS: Readonly<Record<Market, Partial<Record<AudioPart, { item: string; price: number; fitting: number; currency: string }>>>> = {
  us: { speakers: { item: 'JBL Concert Series 621 speakers', price: 69.99, fitting: 99.99, currency: 'USD' }, amp: { item: 'Kicker 47KEY200.4 amplifier', price: 299.99, fitting: 249.99, currency: 'USD' } },
  gb: { speakers: { item: 'Pioneer TS-G670 speakers', price: 34.99, fitting: 60, currency: 'GBP' } },
  ie: {},
};

export function audioQuote(sim: Simulation, v: OwnedVehicle, part: AudioPart): { price: Money; basis: string } | string {
  if (v.soldAt !== undefined) return 'That isn’t a car you have.';
  if (v.audio?.includes(part)) return 'It has them.';
  const m = marketOf(v.jurisdiction);
  const p = m ? AUDIO_PARTS[m][part] : undefined;
  if (!p) return 'No retailer where it’s registered publishes a price for fitting it.';
  return { price: inSave(sim, p.price + p.fitting, p.currency), basis: `${p.item}, ${p.price} ${p.currency}, fitted for ${p.fitting}.` };
}

export function stereoQuote(sim: Simulation, v: OwnedVehicle): { price: Money; basis: string } | string {
  if (v.soldAt !== undefined) return 'That isn’t a car you have.';
  if (v.stereo) return 'It has one.';
  const m = marketOf(v.jurisdiction);
  if (!m) return 'No retailer where it’s registered publishes a price for fitting one.';
  const h = HEAD_UNIT[m];
  return { price: inSave(sim, h.price + h.fitting, h.currency), basis: `${h.retailer}: a ${h.unit}, ${h.price} ${h.currency}, fitted for ${h.fitting}.` };
}

/** What full cover pays for the stereo when the car is lost, in the save's money; `carValue` in the save's money. */
export function stereoCover(sim: Simulation, v: OwnedVehicle, carValue: Money): Money {
  const m = marketOf(v.jurisdiction);
  if (!(v.stereo || v.audio?.length) || v.coverage !== 'full' || !m) return 0;
  const h = HEAD_UNIT[m];
  const cap = AUDIO_CAP[m];
  const most = Math.min(inSave(sim, cap.cap, h.currency), cap.ofValue !== undefined ? Math.round(carValue * cap.ofValue) : Infinity);
  // The stereo and the speakers and amplifier with it, all to the one cap.
  const parts = (v.audio ?? []).reduce((n, part) => { const p = AUDIO_PARTS[m][part]!; return n + inSave(sim, p.price + p.fitting, p.currency); }, 0);
  return Math.min((v.stereo ? inSave(sim, h.price + h.fitting, h.currency) : 0) + parts, most);
}

export function registerCarAudio(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined): void {
  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.stereo', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you have.');
    const q = stereoQuote(s, v);
    if (typeof q === 'string') throw new CommandError(q);
    if (!payFromBank(s, person, q.price, 'A car stereo, fitted', 'vehicle')) throw new CommandError(`${formatMoney(q.price, saveCurrency(s.universe))} is more than the bank can cover.`);
    v.stereo = true;
    return { paid: q.price };
  });
  sim.onCommand<{ vehicleId: string; part: AudioPart }, { paid: Money }>('vehicle.audio', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you have.');
    const part = p?.part === 'amp' ? 'amp' : 'speakers';
    const q = audioQuote(s, v, part);
    if (typeof q === 'string') throw new CommandError(q);
    if (!payFromBank(s, person, q.price, part === 'amp' ? 'A car amplifier, fitted' : 'Car speakers, fitted', 'vehicle')) throw new CommandError(`${formatMoney(q.price, saveCurrency(s.universe))} is more than the bank can cover.`);
    v.audio = [...(v.audio ?? []), part];
    return { paid: q.price };
  });
}
