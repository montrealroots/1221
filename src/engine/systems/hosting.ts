/**
 * SLATE — friends asked home together, for dinner or for drinks (the master
 * plan's hosting, from 2026-10-02).
 *
 * **Who comes.** Each friend asked says yes or no for their own reasons, as
 * to a visit (`declines` in `systems/people.ts`): a friend hardly known, a
 * rival, a friend from another town or at an hour they wouldn't come. Those
 * who say yes come; nobody saying yes, nothing is planned.
 *
 * **Room for them.** Everyone needs a seat, you among them, from what's at
 * home (`seatsAtHome` in `systems/furnishings.ts`); a dinner sits everyone at
 * a table. A dinner lasts as long as a meal at a mid-range restaurant does
 * (`DINING_MINUTES`), drinks as long as a visit.
 *
 * **The evening.** A dinner is cooked for everyone at a home-cooked meal's
 * price where you live (`mealOf`), paid then, and you've eaten; or from
 * 2026-10-03 from a recipe chosen, out of what's in the kitchen, where the
 * stock makes it for everyone then (`takeIngredients`), and the money only
 * where it doesn't. Each guest
 * is poured a glass of wine or a beer from what's in the kitchen, as far as
 * it goes, and you have one too; a host with nothing to pour is remembered
 * for it. A home in a mess, untidier than it starts to weigh on you
 * (`TIDY.messy`), is noticed: the evening lifts you half as much, SLATE's
 * reading. Every guest's hours count to the friendship. You not there, they
 * were stood up.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { SOCIAL } from '../content/people';
import { DINING_MINUTES } from '../content/dining';
import { PINT, WIDMARK, drinkingAge } from '../content/alcohol';
import { clamp } from '../core/rng';
import { contactsOf, declines } from './people';
import { atWork, atWorkReason } from './availability';
import { seatsAtHome } from './furnishings';
import { mealOf, spend } from './household';
import { TIDY, livingOf } from './dwelling';
import { applyLookingAfter } from './life';
import { livingIn } from './homes';
import { THEATER } from '../content/specialrooms';
import { personalityOf } from './personality';
import { foodOf, fresh } from './pantry';
import { drinkGrams, marketOf as drinkingMarketOf } from './alcohol';
import { cookRefusal, recipeById, servingsRange, takeIngredients } from './kitchen';

export const HOST_KIND = 'social.host';
const yearsOld = (person: Person, at: Instant) => (at - person.birthInstant) / (365.2425 * MS_DAY);
/** A dinner, drinks, or from 2026-10-04 a film in the home theater (`content/specialrooms.ts`). */
export type Gathering = 'dinner' | 'drinks' | 'film';
/** A wine glass, NIAAA's five ounces at its 12%. */
const GLASS = { ml: 148, abv: 0.12 } as const;
/** What a mess takes off an evening's lift. SLATE's reading. */
export const MESS_LIFT = 0.5;

export const gatheringMinutes = (what: Gathering): number => (what === 'dinner' ? DINING_MINUTES.mid : what === 'film' ? THEATER.filmMinutes : SOCIAL.visitMinutes);
const WORD: Readonly<Record<Gathering, string>> = { dinner: 'Dinner', drinks: 'Drinks', film: 'A Film' };

/** Why the evening can't be planned at all, before anybody's asked. */
export function hostRefusal(sim: Simulation, person: Person, contactIds: readonly string[], at: Instant, what: Gathering): string | undefined {
  if (!person.home || person.home.kind === 'sofa') return 'You have no home of your own to ask them to.';
  if (contactIds.length === 0) return 'Choose who to ask.';
  if (new Set(contactIds).size !== contactIds.length) return 'Ask each of them once.';
  if (contactIds.some((id) => !contactsOf(person).some((c) => c.id === id))) return 'You don’t know them.';
  if (at <= sim.now) return 'Choose a time to come.';
  const everyone = contactIds.length + 1;
  // A film is watched in the home theater, at its seats.
  if (what === 'film') {
    if (!livingIn(person)?.facts.features.includes('homeTheater')) return 'You have no home theater.';
    if (everyone > THEATER.seats) return `The theater seats ${THEATER.seats}, you among them.`;
  }
  const room = seatsAtHome(person);
  if (what !== 'film' && everyone > room.seats) return `You have seats for ${room.seats}, you among them.`;
  if (what === 'dinner' && everyone > room.table) return room.table === 0 ? 'You have no table to sit them at.' : `Your table sits ${room.table}.`;
  const ends = at + gatheringMinutes(what) * 60_000;
  const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < ends && x.at + x.durationMinutes * 60_000 > at);
  if (clash) return `You have ${clash.label} then.`;
  return undefined;
}

/** What's in the kitchen to pour: beer and wine, fresh, and how many drinks it makes. */
function pours(person: Person, at: Instant): { item: ReturnType<typeof foodOf>[number]; ml: number }[] {
  const pint = PINT[drinkingMarketOf(person.currentLocationId) ?? 'US'] ?? PINT.US;
  return foodOf(person).filter((i) => (i.food.key === 'beer' || i.food.key === 'wine') && fresh(i, at) && i.food.left > 0).map((item) => ({ item, ml: item.food.key === 'beer' ? pint.ml : GLASS.ml }));
}

export function registerHosting(sim: Simulation): void {
  sim.onCommand<{ contactIds: string[]; at: number; what: Gathering; recipeId?: string }, { coming: string[]; declined: { contactId: string; reason: string }[] }>('social.host', (p, { sim: s }) => {
    const person = s.player;
    const what: Gathering = p?.what === 'drinks' || p?.what === 'film' ? p.what : 'dinner';
    const ids = Array.isArray(p?.contactIds) ? p.contactIds.map(String) : [];
    const at = Number(p?.at);
    const no = hostRefusal(s, person, ids, at, what);
    if (no) throw new CommandError(no);
    const recipe = what === 'dinner' && p.recipeId ? recipeById(String(p.recipeId)) : undefined;
    if (p?.recipeId && !recipe) throw new CommandError('No such recipe.');
    if (recipe && ids.length + 1 > servingsRange(recipe).most) throw new CommandError(`${recipe.name} cooks for ${servingsRange(recipe).most} at the most.`);
    const coming: string[] = [];
    const declined: { contactId: string; reason: string }[] = [];
    for (const id of ids) {
      const c = contactsOf(person).find((x) => x.id === id)!;
      const reason = declines(person, c, { contactId: id, at, what: 'visit' }) ?? (atWork(s, c, at, gatheringMinutes(what)) ? atWorkReason(c) : undefined);
      c.memory.unshift({ at: s.now, what: reason ? `Said no to ${what} at yours: ${reason}` : `Said yes to ${what} at yours` });
      if (reason) declined.push({ contactId: id, reason });
      else coming.push(id);
    }
    if (coming.length === 0) return { coming, declined };
    const names = coming.map((id) => contactsOf(person).find((c) => c.id === id)!.name.split(' ')[0]);
    s.schedule({ at, kind: HOST_KIND, label: `${WORD[what]} At Yours With ${names.join(', ')}`, category: 'relationship', priority: 40, requiresPlayer: true, durationMinutes: gatheringMinutes(what), locationId: person.home!.cityId, payload: { personId: person.id, what, contactIds: coming, ...(recipe ? { recipeId: recipe.id } : {}) } });
    return { coming, declined };
  });

  sim.onSchedule(HOST_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const what: Gathering = item.payload.what === 'drinks' || item.payload.what === 'film' ? item.payload.what : 'dinner';
    const guests = (item.payload.contactIds as string[]).map((id) => contactsOf(person).find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
    const mine = person.id === s.universe.playerId;
    const word = WORD[what];
    if (person.currentLocationId !== person.home?.cityId) {
      for (const c of guests) { c.stoodUp = item.at; c.memory.unshift({ at: item.at, what: 'You weren’t home' }); }
      if (mine) s.notify({ category: 'relationship', title: `Nobody Home For ${word}`, body: `${guests.map((c) => c.name.split(' ')[0]).join(', ')} came, and you weren’t there.`, importance: 55, route: '/workspace/people' });
      return;
    }
    // Dinner for everyone, at home's price.
    let cooked: string | undefined;
    if (what === 'dinner') {
      // The recipe chosen, where the kitchen has it for everyone; else the meal's money.
      const recipeId = item.payload.recipeId ? String(item.payload.recipeId) : undefined;
      const everyone = guests.length + 1;
      if (recipeId && !cookRefusal(s, person, recipeId, everyone)) { takeIngredients(s, person, recipeId, everyone); cooked = recipeById(recipeId)!.name; }
      else spend(s, person, mealOf(s, person) * everyone, `${word} at home for ${everyone}`, 'food', true);
      applyLookingAfter(person, 'eat', item.at);
    }
    // A drink each from the kitchen, as far as it goes; one for the host, of age.
    let poured = 0;
    for (const drinker of [...guests.map(() => 'guest' as const), 'host' as const]) {
      const p = pours(person, item.at)[0];
      if (!p) break;
      const ml = Math.min(p.item.food.left, p.ml);
      p.item.food.left -= ml;
      if (p.item.food.left <= 1e-9) person.items = (person.items ?? []).filter((x) => x.id !== p.item.id);
      if (drinker === 'host' && yearsOld(person, item.at) >= drinkingAge(person.currentLocationId)) drinkGrams(s, person, ml * (p.item.food.abv ?? (p.item.food.key === 'beer' ? (PINT[drinkingMarketOf(person.currentLocationId) ?? 'US'] ?? PINT.US).abv : GLASS.abv)) * WIDMARK.gramsPerMl, 1, item.at);
      else if (drinker === 'guest') poured += 1;
    }
    const messy = livingOf(person).tidy < TIDY.messy;
    const hours = gatheringMinutes(what) / 60;
    for (const c of guests) {
      c.hours += hours;
      c.lastSeen = item.at;
      c.memory.unshift({ at: item.at, what: `${word} at yours${cooked ? `, ${cooked}` : ''}${messy ? ', the place a mess' : ''}${poured < guests.length ? ', not much to drink' : ''}` });
    }
    const w = person.wellbeing;
    const lift = (messy ? MESS_LIFT : 1) * personalityOf(person, 'company') * personalityOf(person, 'moraleSwing');
    w.morale = clamp(w.morale + SOCIAL.morale * lift, 0, 100);
    w.stress = clamp(w.stress - SOCIAL.stress * (messy ? MESS_LIFT : 1), 0, 100);
    if (mine) s.notify({ category: 'relationship', title: `${word} At Yours`, body: `${guests.map((c) => c.name.split(' ')[0]).join(', ')} came${poured < guests.length ? `; there was drink for ${poured} of them` : ''}${messy ? ', and the place was a mess' : ''}.`, importance: 35, route: '/workspace/people' });
  });
}

