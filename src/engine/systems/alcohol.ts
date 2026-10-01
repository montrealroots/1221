/**
 * SLATE — drinking, and what it does (Stage 4 of `docs/BACKLOG.md`, from
 * 2026-10-01; the figures in `content/alcohol.ts`). A pint at a bar is
 * paid for and takes half an hour, SLATE's estimate. It puts its grams into
 * the blood by Widmark's formula, which falls at NHTSA's hourly rate, and
 * its calories into the day's eating. Up to the legal limit a drink eases
 * stress and lifts the mood a little; past it, it stops lifting. A night
 * that went over 0.08, NIAAA's binge, is a hangover the next day: tired
 * and low. All of those sizes are SLATE's estimates.
 *
 * On the road the blood alcohol at the time of a drive multiplies its
 * crash risk by NHTSA's table, and a drive over the jurisdiction's line
 * can end in an arrest, at the CDC's rate, with the jurisdiction's first
 * offense: its fine, its suspension and, in Mexico City, El Torito
 * (`impairedDrive`, called by `systems/driving.ts`).
 *
 * Not yet: drinking at home, which waits on groceries (Stage 4c), and what
 * alcohol does to a night's sleep, which the research describes but doesn't
 * size.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_HOUR, formatDate, formatTime, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import type { Jurisdiction } from '../content/vehiclefees';
import { ARREST_PER_DRIVE, BAR_PINT, CRASH_RISK, OFFENCES, PINT, WIDMARK, drinkingAge, type DrinkingMarket } from '../content/alcohol';
import { inSaveMoney } from './banking';
import { owe, payFromBank, spend } from './household';
import { personalityOf } from './personality';
import { bodyOf, eatsBack } from './body';
import { occupiedAt } from './life';

/** Their blood alcohol as it stood, when, and the night's highest. */
export interface Alcohol { bac: number; at: Instant; peak: number; peakAt: Instant }

const ARREST_KIND = 'alcohol.arrest';
/** A pint's half hour, the mood and the relief a drink brings below the limit, and a hangover's toll. SLATE's estimates. */
export const DRINKING = { minutesPerPint: 30, morale: 1.5, stress: 2, binge: 0.08, hangoverEnergy: 10, hangoverMorale: 3 } as const;

export function marketOf(cityId: string): DrinkingMarket | undefined {
  return ({ us: 'US', uk: 'GB', ie: 'IE', ca: 'CA', mx: 'MX' } as const)[cityId.split('-')[0] ?? ''];
}

/** The grams of ethanol in a pint where they are. */
export function pintGrams(cityId: string): number {
  const pint = PINT[marketOf(cityId) ?? 'US'];
  return pint.ml * pint.abv * WIDMARK.gramsPerMl;
}

/** Their blood alcohol at a moment, g/dL: what was there, less what the liver has cleared since. */
export function bacAt(person: Person, at: Instant): number {
  const a = person.alcohol;
  if (!a) return 0;
  return Math.max(0, a.bac - (WIDMARK.betaPerHour * Math.max(0, at - a.at)) / MS_HOUR);
}

/** What a gram of ethanol adds to the blood, for their weight: Widmark's 1 / (r · kg · 10). */
const perGram = (sim: Simulation, person: Person): number => 1 / (WIDMARK.r * bodyOf(sim, person).weightKg * 10);

/** NHTSA's relative risk of a crash at a blood alcohol. */
export const crashRiskAt = (bac: number): number => CRASH_RISK[Math.min(CRASH_RISK.length - 1, Math.floor(bac * 100 + 1e-9))]!;

/** A bar's pint here, in the save's money, or nothing where SLATE has no price for one. */
export function pintPrice(sim: Simulation, cityId: string): Money | undefined {
  const p = BAR_PINT[cityId];
  return p ? inSaveMoney(sim, Math.round(p.price * 100), p.currency) : undefined;
}

const yearsOld = (person: Person, at: Instant) => (at - person.birthInstant) / (365.2425 * 24 * MS_HOUR);

/** Why they can't have these pints here, or nothing. */
export function drinkRefusal(sim: Simulation, person: Person, pints: number): string | undefined {
  if (!(Number.isInteger(pints) && pints >= 1 && pints <= 8)) return 'From one to eight.';
  const age = drinkingAge(person.currentLocationId);
  if (yearsOld(person, sim.now) < age) return `You have to be ${age} to be served here.`;
  const price = pintPrice(sim, person.currentLocationId);
  if (price === undefined) return 'SLATE doesn’t know what a pint costs here.';
  return undefined;
}

/** Drinks taken: the grams into the blood, the calories into the day, and the mood. */
export function drinkPints(sim: Simulation, person: Person, pints: number, at: Instant): void {
  const grams = pintGrams(person.currentLocationId) * pints;
  const before = bacAt(person, at);
  const bac = before + grams * perGram(sim, person);
  const prior = person.alcohol;
  const peak = prior && at - prior.peakAt < 24 * MS_HOUR ? Math.max(prior.peak, bac) : bac;
  person.alcohol = { bac, at, peak, peakAt: peak === bac ? at : prior!.peakAt };
  eatsBack(person, grams * WIDMARK.kcalPerGram);
  // Below the binge line a drink relaxes; over it, the mood stops rising.
  const easing = Math.max(0, Math.min(pints, Math.ceil((DRINKING.binge - before) / Math.max(1e-9, pintGrams(person.currentLocationId) * perGram(sim, person)))));
  const w = person.wellbeing;
  w.morale = clamp(w.morale + easing * DRINKING.morale * personalityOf(person, 'moraleSwing'), 0, 100);
  w.stress = clamp(w.stress - easing * DRINKING.stress, 0, 100);
}

/** A morning after a night over the binge line: tired and low, once. */
export function hangover(person: Person, at: Instant): boolean {
  const a = person.alcohol;
  if (!a || a.peak < DRINKING.binge || at - a.peakAt > 24 * MS_HOUR) return false;
  const w = person.wellbeing;
  w.energy = clamp(w.energy - DRINKING.hangoverEnergy, 0, 100);
  w.morale = clamp(w.morale - DRINKING.hangoverMorale, 0, 100);
  a.peak = 0;
  return true;
}

/**
 * A drive with alcohol in the blood: an arrest at the CDC's rate where it's
 * over the jurisdiction's line, and its first offense. True where it was.
 */
export function impairedDrive(sim: Simulation, person: Person, j: Jurisdiction, at: Instant, key: string, odds = ARREST_PER_DRIVE): boolean {
  const bac = bacAt(person, at);
  const law = OFFENCES[j];
  if (!law || bac < law.bands[0]!.from) return false;
  if (sim.rng('alcohol.arrest', person.id, key).next() >= odds) return false;
  const band = [...law.bands].reverse().find((b) => bac >= b.from)!;
  const cur = saveCurrency(sim.universe);
  const fine = band.fine === null ? undefined : inSaveMoney(sim, Math.round(band.fine * 100), law.currency);
  if (fine) { if (!payFromBank(sim, person, fine, band.label, 'vehicle')) owe(sim, person, fine, band.label, 'vehicle'); }
  const rec = (person.driving ??= { points: [] });
  if (band.months > 0) rec.suspendedUntil = Math.max(rec.suspendedUntil ?? 0, at + band.months * 30.4375 * 24 * MS_HOUR);
  if (band.arrestHours) sim.schedule({ at: Math.max(sim.now, at) + 60_000, kind: ARREST_KIND, label: 'Held At El Torito', category: 'personal', priority: 5, requiresPlayer: person.id === sim.universe.playerId, durationMinutes: band.arrestHours * 60, payload: { personId: person.id } });
  if (person.id === sim.universe.playerId) {
    const parts = [fine ? `${formatMoney(fine, cur)} fined` : band.fine === null ? 'a fine the court sets' : undefined, band.months > 0 ? `your license suspended until ${formatDate(rec.suspendedUntil!, sim.zone)}` : undefined, band.arrestHours ? `${band.arrestHours} hours held` : undefined].filter(Boolean);
    sim.notify({ category: 'personal', title: 'Stopped Over The Limit', body: `${band.label}, at ${bac.toFixed(3)}: ${parts.join(', ')}.`, importance: 70, route: '/workspace/vehicles' });
  }
  return true;
}

export function registerAlcohol(sim: Simulation): void {
  sim.onSchedule(ARREST_KIND, () => undefined);
  sim.onEvent('world.day_rollover', 'alcohol.hangover', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) hangover(person, s.now);
  });
  sim.onCommand<{ pints: number }, { paid: Money; bac: number }>('food.drink', (p, { sim: s }) => {
    const person = s.player;
    const pints = Number(p?.pints ?? 1);
    const no = drinkRefusal(s, person, pints);
    if (no) throw new CommandError(no);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    const paid = pintPrice(s, person.currentLocationId)! * pints;
    if (!spend(s, person, paid, `A bar in ${CITIES.get(person.currentLocationId)?.name ?? 'town'}`, 'food')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + pints * DRINKING.minutesPerPint * 60_000);
    drinkPints(s, person, pints, s.now);
    return { paid, bac: bacAt(person, s.now) };
  });
}
