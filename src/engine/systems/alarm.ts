/**
 * SLATE — a burglar alarm (docs/WORLD.md, stage 6f), from 2026-09-30,
 * researched in `docs/research/world/research-home-contents.json` and
 * `research-home-effects.json`.
 *
 * Ring's Alarm kit and its Pro plan, which monitors it around the clock:
 * $199.99 and $19.99 a month in America, £139.99 and £15.99 in Britain, the
 * two places both prices were read (Canada's and Ireland's kits weren't).
 * What it changes is the insurance: the Triple-I's "at least 5 percent" off a
 * homeowner's or renter's premium for a burglar alarm in America, and Aviva's
 * 12.5% in Britain (read from a search's summary). It doesn't change the risk
 * of a burglary: Tseloni and her colleagues found, in the Crime Survey for
 * England and Wales, that "having just a burglar alarm and no other form of
 * security confers less protection than no security at all", and SLATE takes
 * it as none. On a home one owns it's fitted there and stays with it; a
 * renter's goes where they go.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { payFromBank, spend } from './household';
import { livingIn, type OwnedHome } from './homes';

export const ALARM: Readonly<Record<string, { kit: number; monthly: number; currency: string; discount: number; basis: string }>> = {
  us: { kit: 199.99, monthly: 19.99, currency: 'USD', discount: 0.05, basis: 'Ring Alarm’s five-piece kit and Ring Pro’s monitoring; the Triple-I’s 5% off the premium' },
  uk: { kit: 139.99, monthly: 15.99, currency: 'GBP', discount: 0.125, basis: 'Ring Alarm Pack S and Ring Pro’s monitoring; Aviva’s 12.5% off the premium, read from a search’s summary' },
};

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
const countryOf = (person: Person) => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId ?? '';

/** Whether the home they live in has an alarm: fitted in the home they own, or a renter's own. */
export function alarmed(person: Person): boolean {
  const owned = livingIn(person);
  return owned ? owned.alarm === true : person.living?.alarm === true;
}

/** What an alarm takes off an owned home's premium, as a factor: its discount where it's fitted. */
export const alarmFactor = (owned: OwnedHome): number => (owned.alarm ? 1 - (ALARM[CITIES.get(owned.cityId)?.countryId ?? '']?.discount ?? 0) : 1);

/** What an alarm takes off a renter's premium, as a factor. */
export const renterAlarmFactor = (person: Person): number => (person.living?.alarm ? 1 - (ALARM[countryOf(person)]?.discount ?? 0) : 1);

export function alarmRefusal(person: Person): string | undefined {
  if (!person.home || person.home.kind === 'sofa') return 'An alarm goes in a home of your own or one you rent.';
  if (!ALARM[countryOf(person)]) return 'SLATE sells an alarm in America and Britain, where its kit and monitoring are both priced.';
  if (alarmed(person)) return 'Your home has one.';
  return undefined;
}

/** The month's monitoring, charged with the month's belongings (`systems/dwelling.ts`); an alarm unpaid is switched off. */
export function alarmMonth(sim: Simulation, person: Person): void {
  if (!alarmed(person)) return;
  const a = ALARM[countryOf(person)];
  if (!a) return;
  if (spend(sim, person, inSave(sim, a.monthly, a.currency), 'Alarm monitoring', 'insurance')) return;
  const owned = livingIn(person);
  if (owned) delete owned.alarm; else if (person.living) delete person.living.alarm;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Alarm Was Switched Off', body: 'The monitoring couldn’t be paid, so it ended, and its discount with it.', importance: 55, route: '/home' });
}

export function registerAlarm(sim: Simulation): void {
  sim.onCommand<{ on: boolean }, { paid: Money }>('home.alarm', (p, { sim: s }) => {
    const person = s.player;
    const owned = livingIn(person);
    if (p?.on === false) {
      if (!alarmed(person)) throw new CommandError('Your home has none.');
      if (owned) delete owned.alarm; else if (person.living) delete person.living.alarm;
      return { paid: 0 };
    }
    const no = alarmRefusal(person);
    if (no) throw new CommandError(no);
    const a = ALARM[countryOf(person)]!;
    const kit = inSave(s, a.kit, a.currency);
    if (!payFromBank(s, person, kit, 'A burglar alarm, its kit', 'household')) throw new CommandError(`${formatMoney(kit, saveCurrency(s.universe))} is more than the bank can cover.`);
    if (owned) owned.alarm = true; else person.living = { ...(person.living ?? { tidy: 80 }), alarm: true };
    return { paid: kit };
  });
}
