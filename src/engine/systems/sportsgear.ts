/**
 * SLATE — what a game is played with (from 2026-10-05; the sports equipment
 * in `content/sportsgear.ts`).
 *
 * Until then a home's tennis, pickleball or basketball court and its pitch
 * were played on with nothing in hand. Now each needs what the game is
 * played with, owned and at home: tennis a racket and balls, pickleball a
 * paddle and balls, basketball and football a ball. A friend asked over to
 * play brings their own racket or paddle; the balls are the host's. Each is
 * bought where you live at its retailer's regular price, with the town's
 * sales tax where it's added, and carried home.
 *
 * How fast balls go flat isn't published as a figure SLATE can use, so they
 * don't wear out here; nor does a racket's strings.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { SPORT_GEAR, type SportGear, type SportGearKind } from '../content/sportsgear';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';

export type Game = 'tennis' | 'pickleball' | 'basketball' | 'football';
/** What each game needs. */
export const GAME_GEAR: Readonly<Record<Game, readonly SportGearKind[]>> = {
  tennis: ['tennis-racket', 'tennis-balls'],
  pickleball: ['pickleball-paddle', 'pickleballs'],
  basketball: ['basketball'],
  football: ['football'],
};
const GEAR_WORD: Readonly<Record<SportGearKind, string>> = {
  'tennis-racket': 'a tennis racket', 'tennis-balls': 'tennis balls', 'pickleball-paddle': 'a pickleball paddle', pickleballs: 'pickleballs', basketball: 'a basketball', football: 'a football',
};

const MARKET: Readonly<Record<string, string>> = { us: 'us', ca: 'ca', mx: 'mx', uk: 'uk', ie: 'ie' };
const marketOf = (cityId: string): string | undefined => MARKET[CITIES.get(cityId)?.countryId ?? ''];

/** The kinds of gear owned at the home they live in. */
export function gearAtHome(person: Person): Set<SportGearKind> {
  const home = homeKeyOf(person.home);
  return new Set(itemsOf(person).filter((i) => i.sportGear && i.at.kind === 'home' && i.at.home === home).map((i) => i.sportGear!.kind));
}

/** Why a game can't be played for want of its gear, or nothing. */
export function gearRefusal(person: Person, game: Game): string | undefined {
  const have = gearAtHome(person);
  const missing = GAME_GEAR[game].filter((k) => !have.has(k));
  if (missing.length === 0) return undefined;
  // Where SLATE keeps no price for one here (Mexico's pickleballs, which no retailer's page could be read for), it says so.
  const sold = new Set(SPORT_GEAR.filter((g) => g.market === marketOf(person.home?.cityId ?? person.currentLocationId)).map((g) => g.kind));
  const unsold = missing.find((k) => !sold.has(k));
  if (unsold) return `SLATE keeps no price for ${GEAR_WORD[unsold].replace(/^a /, '')} where you live yet.`;
  const words = missing.map((k) => GEAR_WORD[k]);
  return `You need ${words.length === 2 ? `${words[0]} and ${words[1]}` : words[0]}.`;
}

/** The gear on sale where they live, cheapest first, taxed. */
export function sportShop(sim: Simulation, person: Person): (SportGear & { cost: Money })[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const m = marketOf(cityId);
  return SPORT_GEAR.filter((g) => g.market === m).map((g) => ({ ...g, cost: inSaveMoney(sim, Math.round(g.price * (1 + (g.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'general'))) * 100), g.currency) })).sort((a, b) => a.cost - b.cost);
}

export function registerSportsGear(sim: Simulation): void {
  sim.onCommand<{ productId: string }, { paid: Money }>('sport.buy', (p, { sim: s }) => {
    const person = s.player;
    if (!person.home || person.home.kind === 'sofa' || person.home.cityId !== person.currentLocationId) throw new CommandError('It’s bought where you live, for your home.');
    const g = sportShop(s, person).find((x) => x.id === p?.productId);
    if (!g) throw new CommandError('That isn’t sold where you live.');
    if (!payFromBank(s, person, g.cost, `${g.retailer}, ${g.name}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
    addItem(s, person, { kind: `sport:${g.id}`, label: g.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'storage' }, acquiredAt: s.now, paid: g.cost, sportGear: { kind: g.kind } });
    return { paid: g.cost };
  });
}
