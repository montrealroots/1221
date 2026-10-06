/**
 * SLATE — what a home watches, listens to and plays, and what it pays for it
 * (the master plan's §34, from 2026-10-02; the figures in `content/homelife.ts`).
 *
 * **Services.** Netflix, Disney+, HBO Max, Prime Video, Apple TV, Paramount+,
 * Peacock, Crave, ViX, NOW, Spotify, Apple Music and the game services, each
 * in its tiers where you live, at its own price, billed monthly from the day
 * you join; a month the bank and the card can't pay ends it, as a card
 * declined does. Canada's GST and HST fall on streaming, so its prices take
 * the province's tax; New York and California don't tax it, and
 * Connecticut's 1% on digital goods isn't kept.
 *
 * **The TV license.** In Britain one is needed to watch or record live TV on
 * any channel or to use BBC iPlayer (£180 a year from 2026-04-01); streaming
 * services alone don't need one. In Ireland one is needed for any TV set at
 * the address, a smart TV used only to stream included (€160). So watching
 * live TV at home needs one in Britain, and any TV at home in Ireland. A
 * license runs a year from when it's bought.
 *
 * **Consoles** are bought at their makers' prices and kept as things at
 * home; playing at home needs one.
 *
 * Unwinding at home can be any of it: live TV, a service you pay for, or a
 * game. From 2026-10-06 it needs a screen: live TV a TV, which a let or a
 * home owned before 2026-09-29 is taken to come with (`bareHome`), and a
 * service a TV, a computer, a tablet or a phone. Until then a bare house
 * with nothing in it showed live TV. It does what unwinding does, no more. Until 2026-10-03 nothing
 * was watched; now a program is, episode by episode (`systems/programmes.ts`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { CONSOLES, GAME_SERVICES, SERVICES, TV_LICENSES, type Console } from '../content/homelife';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';
import { bareHome, owns } from './furniture';
import { computerForGames } from './computers';
import { phonesOf } from './phones';

export const SUBSCRIPTION_MONTH_KIND = 'home.subscription_month';
const YEAR_MS = 365 * MS_DAY;

export interface Subscription { id: string; since: Instant }
export interface Plan { id: string; label: string; monthly: number; currency: string; taxIncluded: boolean; game: boolean }

export const marketOf = (person: Person): string | undefined => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId;
export const subscriptionsOf = (person: Person): Subscription[] => (person.subscriptions ??= []);

/** Every service and game tier where you live. */
export function plansHere(person: Person): Plan[] {
  const m = marketOf(person);
  return [
    ...SERVICES.filter((s) => s.market === m).map((s) => ({ id: s.id, label: `${s.service}, ${s.tier}`, monthly: s.monthly, currency: s.currency, taxIncluded: s.taxIncluded, game: false })),
    ...GAME_SERVICES.filter((g) => g.market === m).map((g) => ({ id: g.id, label: `${g.service}, ${g.tier}`, monthly: g.monthly, currency: g.currency, taxIncluded: g.taxIncluded, game: true })),
  ];
}
export const planById = (id: string): Plan | undefined => {
  const s = SERVICES.find((x) => x.id === id);
  if (s) return { id: s.id, label: `${s.service}, ${s.tier}`, monthly: s.monthly, currency: s.currency, taxIncluded: s.taxIncluded, game: false };
  const g = GAME_SERVICES.find((x) => x.id === id);
  return g ? { id: g.id, label: `${g.service}, ${g.tier}`, monthly: g.monthly, currency: g.currency, taxIncluded: g.taxIncluded, game: true } : undefined;
};

/** A month of a plan where you live, in the save's money: Canada's sales tax on it, none in America's towns. */
export function planPrice(sim: Simulation, person: Person, plan: Plan): Money {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const tax = !plan.taxIncluded && marketOf(person) === 'ca' ? salesTaxRate(cityId, sim.now, 'general') : 0;
  return inSaveMoney(sim, Math.round(plan.monthly * (1 + tax) * 100), plan.currency);
}

export const licenceHere = (person: Person) => TV_LICENSES.find((l) => l.market === marketOf(person));
export const licensed = (person: Person, at: Instant): boolean => (person.tvLicence?.until ?? 0) > at;

export const consolesHere = (person: Person): Console[] => CONSOLES.filter((c) => c.market === marketOf(person));
export const consolesOwned = (person: Person) => itemsOf(person).filter((i) => i.kind.startsWith('console:'));

/**
 * Games to play (the master plan's §34b, from 2026-10-03): a console plays
 * only with software, a game of its maker's owned, a subscription to its
 * maker's service with a catalog (PlayStation Plus, Xbox Game Pass, Nintendo
 * Switch Online), or the game a bundle comes with. Games are sold at
 * Nintendo's own prices (its eShop price service, `research-home-gaps.json`):
 * Donkey Kong Bananza in each market, Mario Kart World in America. Sony's and
 * Microsoft's own store prices weren't read, so their consoles play through
 * their services. Until 2026-10-03 a console played with nothing on it.
 */
export interface Game { id: string; market: string; maker: string; title: string; price: number; currency: string; taxIncluded: boolean }
export const GAMES: readonly Game[] = [
  { id: 'us-dk-bananza', market: 'us', maker: 'Nintendo', title: 'Donkey Kong Bananza', price: 69.99, currency: 'USD', taxIncluded: false },
  { id: 'us-mario-kart-world', market: 'us', maker: 'Nintendo', title: 'Mario Kart World', price: 79.99, currency: 'USD', taxIncluded: false },
  { id: 'uk-dk-bananza', market: 'uk', maker: 'Nintendo', title: 'Donkey Kong Bananza', price: 58.99, currency: 'GBP', taxIncluded: true },
  { id: 'ie-dk-bananza', market: 'ie', maker: 'Nintendo', title: 'Donkey Kong Bananza', price: 69.99, currency: 'EUR', taxIncluded: true },
  { id: 'ca-dk-bananza', market: 'ca', maker: 'Nintendo', title: 'Donkey Kong Bananza', price: 99.99, currency: 'CAD', taxIncluded: false },
  { id: 'mx-dk-bananza', market: 'mx', maker: 'Nintendo', title: 'Donkey Kong Bananza', price: 1449, currency: 'MXN', taxIncluded: true },
];
const SERVICE_MAKER: Readonly<Record<string, string>> = { 'PlayStation Plus': 'Sony', 'Xbox Game Pass': 'Microsoft', 'Nintendo Switch Online': 'Nintendo' };
const consoleOf = (kind: string): Console | undefined => CONSOLES.find((c) => `console:${c.id}` === kind);
export const gamesOwned = (person: Person) => itemsOf(person).filter((i) => i.kind.startsWith('game:'));
export const gamesHere = (person: Person): Game[] => GAMES.filter((g) => g.market === marketOf(person));

/** Whether a console of theirs has something to play: its maker's game, its maker's service, or its bundle's game. */
export function playable(person: Person): boolean {
  const makers = new Set(subscriptionsOf(person).map((s) => GAME_SERVICES.find((g) => g.id === s.id)?.service).filter((x): x is string => Boolean(x)).map((svc) => SERVICE_MAKER[svc]));
  const games = new Set(gamesOwned(person).map((i) => GAMES.find((g) => `game:${g.id}` === i.kind)?.maker));
  return consolesOwned(person).some((i) => {
    const c = consoleOf(i.kind);
    return Boolean(c) && (games.has(c!.maker) || makers.has(c!.maker) || /bundle/i.test(c!.edition ?? ''));
  });
}

/** Why unwinding this way at home can't be done now, or nothing. `how`: 'live' TV, a plan's id, or 'games'. */
export function watchRefusal(sim: Simulation, person: Person, how: string): string | undefined {
  const m = marketOf(person);
  if (how === 'games') return consolesOwned(person).length === 0 ? 'You have no console.' : playable(person) ? undefined : 'It needs a game of its own to play, or its maker’s subscription.';
  // A screen to watch on: a TV for live TV; for a service, a TV, a computer, a tablet or a phone.
  const tv = !bareHome(person) || owns(person, 'tv');
  if (how === 'live' && !tv) return 'There’s no TV here to watch it on.';
  if (how !== 'live' && !tv && !computerForGames(person) && phonesOf(person).length === 0) return 'There’s nothing here to watch it on: a TV, a computer, a tablet or a phone.';
  // Ireland's license is for the TV set itself; Britain's for live TV and iPlayer.
  if ((how === 'live' && m === 'uk') || (m === 'ie' && how !== 'games')) return licensed(person, sim.now) ? undefined : `You need a TV license for that${m === 'ie' ? ': any TV at home needs one in Ireland' : ''}.`;
  if (how === 'live') return undefined;
  if (!subscriptionsOf(person).some((s) => s.id === how)) return 'You don’t subscribe to it.';
  return undefined;
}

function scheduleMonth(sim: Simulation, person: Person, sub: Subscription, from: Instant): void {
  sim.schedule({ at: from + 30 * MS_DAY, kind: SUBSCRIPTION_MONTH_KIND, label: 'A Subscription’s Month', category: 'home', priority: 30, payload: { personId: person.id, id: sub.id } });
}

export function registerHomeLife(sim: Simulation): void {
  sim.onCommand<{ id: string }, { paid: Money }>('home.subscribe', (p, { sim: s }) => {
    const person = s.player;
    const plan = plansHere(person).find((x) => x.id === p?.id);
    if (!plan) throw new CommandError('That isn’t offered where you live.');
    if (subscriptionsOf(person).some((x) => x.id === plan.id)) throw new CommandError('You subscribe to it already.');
    const paid = planPrice(s, person, plan);
    if (!spend(s, person, paid, plan.label, 'personal')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(s.universe))}, more than you can pay.`);
    const sub = { id: plan.id, since: s.now };
    subscriptionsOf(person).push(sub);
    scheduleMonth(s, person, sub, s.now);
    return { paid };
  });
  sim.onCommand<{ id: string }, { left: number }>('home.unsubscribe', (p, { sim: s }) => {
    const person = s.player;
    if (!subscriptionsOf(person).some((x) => x.id === p?.id)) throw new CommandError('You don’t subscribe to it.');
    person.subscriptions = subscriptionsOf(person).filter((x) => x.id !== p.id);
    return { left: person.subscriptions.length };
  });
  sim.onCommand<Record<string, never>, { paid: Money; until: Instant }>('home.tv_licence', (_p, { sim: s }) => {
    const person = s.player;
    const l = licenceHere(person);
    if (!l) throw new CommandError('No TV license is needed where you live.');
    if (licensed(person, s.now + 30 * MS_DAY)) throw new CommandError('Yours runs more than another month.');
    const paid = inSaveMoney(s, Math.round(l.annual * 100), l.currency);
    if (!spend(s, person, paid, l.name, 'personal')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(s.universe))}, more than you can pay.`);
    const from = Math.max(s.now, person.tvLicence?.until ?? 0);
    person.tvLicence = { until: from + YEAR_MS };
    return { paid, until: person.tvLicence.until };
  });
  sim.onCommand<{ consoleId: string }, { paid: Money }>('home.console', (p, { sim: s }) => {
    const person = s.player;
    const c = consolesHere(person).find((x) => x.id === p?.consoleId);
    if (!c) throw new CommandError('That isn’t sold where you live.');
    const home = homeKeyOf(person.home);
    if (!home || person.home!.kind === 'sofa') throw new CommandError('A console goes in a home of your own.');
    const cityId = person.home!.cityId;
    const paid = inSaveMoney(s, Math.round(c.price * (1 + (c.taxIncluded ? 0 : salesTaxRate(cityId, s.now, 'general'))) * 100), c.currency);
    if (!spend(s, person, paid, `${c.maker}: ${c.model}`, 'personal')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(s.universe))}, more than you can pay.`);
    addItem(s, person, { kind: `console:${c.id}`, label: `${c.model}${c.edition ? `, ${c.edition}` : ''}`, quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: s.now, paid });
    return { paid };
  });

  sim.onCommand<{ gameId: string }, { paid: Money }>('home.buy_game', (p, { sim: s }) => {
    const person = s.player;
    const g = gamesHere(person).find((x) => x.id === p?.gameId);
    if (!g) throw new CommandError('That isn’t sold where you live.');
    if (!consolesOwned(person).some((i) => consoleOf(i.kind)?.maker === g.maker)) throw new CommandError(`It plays on a ${g.maker} console, and you have none.`);
    const home = homeKeyOf(person.home);
    if (!home || person.home!.kind === 'sofa') throw new CommandError('A game is kept in a home of your own.');
    const paid = inSaveMoney(s, Math.round(g.price * (1 + (g.taxIncluded ? 0 : salesTaxRate(person.home!.cityId, s.now, 'general'))) * 100), g.currency);
    if (!spend(s, person, paid, `${g.maker}: ${g.title}`, 'personal')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(s.universe))}, more than you can pay.`);
    addItem(s, person, { kind: `game:${g.id}`, label: g.title, quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: s.now, paid });
    return { paid };
  });

  // A subscription's month, paid; one the bank and the card can't pay ends.
  sim.onSchedule(SUBSCRIPTION_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const sub = person ? subscriptionsOf(person).find((x) => x.id === item.payload.id) : undefined;
    const plan = sub && planById(sub.id);
    if (!person || !sub || !plan) return;
    if (!spend(s, person, planPrice(s, person, plan), plan.label, 'personal')) {
      person.subscriptions = subscriptionsOf(person).filter((x) => x.id !== sub.id);
      if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'A Subscription Ended', body: `${plan.label}: the month’s payment didn’t go through, so it stopped.`, importance: 35, route: '/workspace/belongings' });
      return;
    }
    scheduleMonth(s, person, sub, item.at);
  });
}
