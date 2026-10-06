/**
 * SLATE — the clothes a person owns, worn and washed (Stage 3 of
 * `docs/BACKLOG.md`, from 2026-10-01). Each garment is an item
 * (`systems/items.ts`), with its kind, its care and its wear.
 *
 * A day's outfit is real garments to hand: a top and a bottom, or a dress,
 * or a suit, and underwear, socks and shoes. It's the outfit they chose
 * where it's still to hand and clean; otherwise what's already on the go,
 * then the least washed of what's clean, and the player told what stood in
 * (silent until 2026-10-02). Each wear counts toward the kind's wears between washes
 * (`content/garmentcare.ts`), and at that count it goes in the wash. A wash
 * takes each garment's share of the washes its kind lasts off its
 * condition, and it's wearable once dry. A dry-clean-only garment goes to a
 * dry cleaner, not the machine.
 *
 * Until 2026-10-01 clothes were a count: fourteen outfits, clean or dirty.
 * A life is given a wardrobe of garments the first day it has a home
 * (`starterWardrobe` in `systems/clothing.ts`), and a save from before has
 * its count worn into one then.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { careFor, type Care, type Slot } from '../content/garmentcare';
import { fitOf } from './tailoring';
import { stopped } from './watches';
import { itemsOf, reachable, type Item, homeKeyOf, type Spot } from './items';

/** What makes an item a garment: its kind (a care rule's), where it goes on, how it's cleaned, and its wear. */
export interface Garment {
  kind: string;
  slot: Slot;
  care: Care;
  /** Wears since it was last cleaned, and cleanings in its life. */
  wears: number;
  washes: number;
  dirty?: boolean;
  /** Washed, and drying until then. */
  dryUntil?: Instant;
  /** The weight it was bought or last altered for (`systems/tailoring.ts`, from 2026-10-01); an older save's fits as it is. */
  fitKg?: number;
  /** Let out by a tailor, its seams' spare cloth used (`systems/tailoring.ts`, from 2026-10-02). */
  letOut?: true;
  /** Cut for a pregnancy, from 2026-10-03: a pregnancy's gain doesn't make it tight. */
  maternity?: true;
  /** A shoe's foot length on its brand's chart, where it was bought by one (`shoeRow` in `systems/tailoring.ts`, from later on 2026-10-02). */
  footCm?: number;
}

/**
 * A load's garments: SLATE's load was seven outfits, and an outfit's
 * garments go to the wash at a top, underwear and socks each wear and a
 * bottom every third, about 3.3 garments, so about 23 to a load.
 */
export const GARMENTS_PER_LOAD = 23;

export const garmentsOf = (person: Person): (Item & { garment: Garment })[] => itemsOf(person).filter((i): i is Item & { garment: Garment } => i.garment !== undefined);

/** Why a garment can't be put on now, or nothing: it must be to hand, clean, dry, not worn out, and fit the body as it is (`systems/tailoring.ts`). */
export function unwearable(sim: Simulation, person: Person, item: Item & { garment: Garment }, at: Instant = sim.now): string | undefined {
  const g = item.garment;
  if (g.dirty) return 'in the wash';
  if (g.dryUntil !== undefined && g.dryUntil > at) return 'still drying';
  if (item.condition <= 0) return 'worn out';
  const fit = fitOf(person, g);
  if (fit !== 'fits') return fit === 'small' ? 'too small now' : 'too big now';
  if (!reachable(sim, person, item.at)) return 'not to hand';
  // A quartz watch whose battery has run down has stopped (`systems/watches.ts`, from 2026-10-02).
  if (stopped(item, at)) return 'stopped, its battery run down';
  return undefined;
}

/** Whether a garment can be put on now. */
export const wearable = (sim: Simulation, person: Person, item: Item & { garment: Garment }, at: Instant = sim.now): boolean => unwearable(sim, person, item, at) === undefined;

/** The pieces they chose that the day can't put on, each with why: what `outfitFor` stands in for, said rather than swapped silently (from 2026-10-02). */
export function chosenMissing(sim: Simulation, person: Person, at: Instant = sim.now): { item: Item & { garment: Garment }; why: string }[] {
  const mine = garmentsOf(person);
  return (person.dressed ?? []).flatMap((id) => {
    const item = mine.find((g) => g.id === id);
    const why = item ? unwearable(sim, person, item, at) : undefined;
    return item && why ? [{ item, why }] : [];
  });
}

/**
 * The one already on the go first, as a pair of jeans is worn until it wants
 * washing; then the least washed, so the wardrobe wears out evenly; by id
 * where it's even. Until 2026-10-01 the least worn came first, which wore
 * every pair of jeans at once: all four wanted washing in the same days, and
 * clean outfits fell from three to none overnight.
 */
const freshest = (a: Item & { garment: Garment }, b: Item & { garment: Garment }): number => b.garment.wears - a.garment.wears || a.garment.washes - b.garment.washes || a.id.localeCompare(b.id);

/** The day's outfit, or nothing where no whole outfit is to hand and clean. */
export function outfitFor(sim: Simulation, person: Person, at: Instant = sim.now): (Item & { garment: Garment })[] | undefined {
  const ready = garmentsOf(person).filter((g) => wearable(sim, person, g, at)).sort(freshest);
  const chosen = (person.dressed ?? []).map((id) => ready.find((g) => g.id === id)).filter((g): g is Item & { garment: Garment } => Boolean(g));
  const pick = (slot: Slot) => chosen.find((g) => g.garment.slot === slot) ?? ready.find((g) => g.garment.slot === slot);
  const suit = pick('suit');
  const dress = suit ? undefined : pick('dress');
  const top = suit || dress ? undefined : pick('top');
  const bottom = suit || dress ? undefined : pick('bottom');
  if (!suit && !dress && !(top && bottom)) return undefined;
  const under = pick('underwear');
  const socks = pick('socks');
  const shoes = pick('shoes');
  if (!under || !socks || !shoes) return undefined;
  const outer = pick('outer');
  // And the jewelry, watches, belts and bags chosen with it, as many as they like (from 2026-10-02).
  const extras = chosen.filter((g) => g.garment.slot === 'accessory');
  // Layers chosen with it (from 2026-10-03): a base layer under, and a sweater over the top.
  const base = chosen.filter((g) => g.garment.slot === 'base');
  const over = top ? chosen.find((g) => g.garment.slot === 'top' && g.id !== top.id) : undefined;
  return [...base, suit, dress, top, over, bottom, under, socks, shoes, ...(chosen.some((g) => g.garment.slot === 'outer') && outer ? [outer] : []), ...extras].filter((g): g is Item & { garment: Garment } => Boolean(g));
}

/**
 * Getting changed: ten minutes, SLATE's estimate. No time-use survey keeps
 * dressing apart from washing and grooming, which the American Time Use
 * Survey counts together.
 */
export const CHANGE_MINUTES = 10;

/** What they have on now, as garments they still own. */
export const wornNow = (person: Person): (Item & { garment: Garment })[] => {
  const mine = garmentsOf(person);
  return (person.wornNow?.itemIds ?? []).map((id) => mine.find((g) => g.id === id)).filter((g): g is Item & { garment: Garment } => Boolean(g));
};

/**
 * What comes off at a change, the master plan's §32e (from 2026-10-06; until then a change only said what was on, and
 * nothing came off): each piece not put back on, at home, goes in the laundry basket where its wears have made it due a
 * wash, and back where it's kept where not. Away from home it stays with what they have there.
 */
export function takeOff(person: Person, keep: ReadonlySet<string>): void {
  const home = homeKeyOf(person.home);
  const atHomeNow = Boolean(home) && person.home!.cityId === person.currentLocationId;
  for (const g of wornNow(person)) {
    if (keep.has(g.id) || !atHomeNow || g.at.kind !== 'home' || g.at.home !== home) continue;
    g.at = { ...g.at, spot: g.garment.dirty ? 'hamper' : keptIn(g.garment.slot) };
  }
}

/** Changed into these, now: what came off taken off (`takeOff`), each a wear toward its wash, and what they have on. The caller has checked them and taken the time. */
export function changeInto(sim: Simulation, person: Person, items: readonly (Item & { garment: Garment })[]): void {
  takeOff(person, new Set(items.map((g) => g.id)));
  for (const g of items) wearOnce(g);
  person.wornNow = { itemIds: items.map((g) => g.id), since: sim.now };
}

/** Where a garment is put away at home: shoes and coats in the wardrobe, the rest in the drawers, as a life's first wardrobe is; a towel in the bathroom (until 2026-10-05 a washed one went to the drawers). */
export const keptIn = (slot: Slot): Spot => (slot === 'shoes' || slot === 'outer' ? 'wardrobe' : slot === 'towel' ? 'bathroom' : 'drawers');

/**
 * Taken off and put in the laundry basket, the master plan's §32e (from
 * 2026-10-02): to be washed now, whatever its kind's count of wears says.
 * Left out of it, a garment is put away and worn again until its count
 * comes, as before. Only at home, where the basket is.
 */
export function toBasketRefusal(sim: Simulation, person: Person, item: (Item & { garment?: Garment }) | undefined): string | undefined {
  if (!item?.garment) return 'That isn’t a garment of yours.';
  if (item.garment.care === 'dry-clean') return 'It goes to the dry cleaner, not in the wash.';
  if (!person.home || person.home.cityId !== person.currentLocationId || !reachable(sim, person, item.at)) return 'The basket is at home.';
  if (item.at.kind === 'home' && item.at.spot === 'hamper') return 'It’s in the basket.';
  return undefined;
}

export function toBasket(person: Person, item: Item & { garment: Garment }): void {
  const home = homeKeyOf(person.home)!;
  item.garment.dirty = true;
  item.at = { kind: 'home', home, spot: 'hamper' };
}

/** A wear: counted toward its wash, and in the wash at its kind's count. */
function wearOnce(item: Item & { garment: Garment }): void {
  item.garment.wears += 1;
  if (item.garment.wears >= careFor(item.garment.kind).wearsBetween) item.garment.dirty = true;
}

/**
 * A day dressed: the outfit worn, and true; or false where there's none whole
 * and clean. A chosen piece the day couldn't put on is told to the player,
 * with what stood in for it. Until 2026-10-02 the swap was silent.
 */
export function wearTheDay(sim: Simulation, person: Person, at: Instant = sim.now, tell = true): boolean {
  const outfit = outfitFor(sim, person, at);
  if (!outfit) return false;
  const missing = tell && person.id === sim.universe.playerId ? chosenMissing(sim, person, at) : [];
  for (const g of outfit) wearOnce(g);
  takeOff(person, new Set(outfit.map((g) => g.id)));
  person.wornNow = { itemIds: outfit.map((g) => g.id), since: at };
  if (missing.length) {
    // A dress or a suit is stood in for by a top and a bottom, and they by either.
    const BODY: readonly Slot[] = ['suit', 'dress', 'top', 'bottom'];
    const chosen = new Set(person.dressed ?? []);
    const stood = (slot: Slot) => outfit.filter((g) => !chosen.has(g.id) && (BODY.includes(slot) ? BODY.includes(g.garment.slot) : g.garment.slot === slot)).map((g) => g.label).join(' and ') || undefined;
    const lines = missing.map(({ item, why }) => { const instead = stood(item.garment.slot); return `${item.label} was ${why}${instead ? `, so ${instead} instead` : ''}`; });
    sim.notify({ category: 'home', title: 'Not Quite What You Chose', body: `${lines.join('; ')}.`, importance: 30, route: '/workspace/clothes' });
  }
  return true;
}

/** A towel after a shower: a clean, dry one to hand, the most used first, a use toward its wash; false where there's none. */
export function useTowel(sim: Simulation, person: Person, at: Instant = sim.now): boolean {
  const towel = garmentsOf(person).filter((g) => g.garment.slot === 'towel' && wearable(sim, person, g, at)).sort(freshest)[0];
  if (!towel) return false;
  wearOnce(towel);
  return true;
}

/** A night in their own sleepwear at home: a clean pair to hand, the one on the go first, a wear toward its wash (ACI: 3 or 4); false where there's none (from 2026-10-02). */
export function wearForSleep(sim: Simulation, person: Person, at: Instant = sim.now): boolean {
  const pair = garmentsOf(person).filter((g) => g.garment.slot === 'sleep' && wearable(sim, person, g, at)).sort(freshest)[0];
  if (!pair) return false;
  wearOnce(pair);
  return true;
}

/** A workout's clothes: activewear where there's some clean, else a top, with underwear and socks. */
export function wearForExercise(sim: Simulation, person: Person, at: Instant = sim.now): boolean {
  const ready = garmentsOf(person).filter((g) => wearable(sim, person, g, at) && !isSwimsuit(g)).sort(freshest);
  const body = ready.find((g) => g.garment.slot === 'active') ?? ready.find((g) => g.garment.slot === 'top');
  const under = ready.find((g) => g.garment.slot === 'underwear');
  const socks = ready.find((g) => g.garment.slot === 'socks');
  if (!body || !under || !socks) return false;
  for (const g of [body, under, socks]) wearOnce(g);
  return true;
}

/**
 * A swim is in a swimsuit (from 2026-10-03): one of your own, clean and to
 * hand, worn for it and washed after as activewear is. Until then a swim
 * wore the gym's clothes.
 */
export const isSwimsuit = (g: Item & { garment: Garment }): boolean => g.garment.kind === 'swimsuit';
export const swimsuitFor = (sim: Simulation, person: Person, at: Instant = sim.now): (Item & { garment: Garment }) | undefined =>
  garmentsOf(person).filter((g) => isSwimsuit(g) && wearable(sim, person, g, at)).sort(freshest)[0];
export function wearForSwim(sim: Simulation, person: Person, at: Instant = sim.now): boolean {
  const suit = swimsuitFor(sim, person, at);
  if (!suit) return false;
  wearOnce(suit);
  return true;
}

/** What's in the wash and to hand: the dirty garments a machine takes. */
export const washableDirty = (sim: Simulation, person: Person): (Item & { garment: Garment })[] => garmentsOf(person).filter((g) => g.garment.dirty && g.garment.care !== 'dry-clean' && reachable(sim, person, g.at));

/** The garments waiting on a dry cleaner. */
export const dryCleanDirty = (sim: Simulation, person: Person): (Item & { garment: Garment })[] => garmentsOf(person).filter((g) => g.garment.dirty && g.garment.care === 'dry-clean' && reachable(sim, person, g.at));

/** Washes garments: clean once dry, each wash its share of the kind's life off its condition. */
export function washGarments(items: readonly (Item & { garment: Garment })[], dryAt: Instant): void {
  for (const item of items) {
    // Out of the laundry basket, put away where its kind is kept (from 2026-10-02).
    if (item.at.kind === 'home' && item.at.spot === 'hamper') item.at = { ...item.at, spot: keptIn(item.garment.slot) };
    const life = careFor(item.garment.kind).lifetimeWashes;
    item.garment.dirty = false;
    item.garment.wears = 0;
    item.garment.washes += 1;
    if (life) item.condition = Math.max(0, item.condition - 1 / life);
    item.garment.dryUntil = dryAt;
  }
}

/** The wears a clean garment has left before its wash. */
const wearsLeft = (g: Item & { garment: Garment }): number => Math.max(1, Math.ceil(careFor(g.garment.kind).wearsBetween - g.garment.wears));

/**
 * Clean outfits to hand: as many days as the scarcest of what an outfit
 * needs allows, each garment counted for the wears it has left. Until
 * 2026-10-01 a bottom counted for three tops however far it was worn, so
 * one pair of jeans going in the wash took three outfits off at once.
 */
export function cleanOutfits(sim: Simulation, person: Person, at: Instant = sim.now): number {
  const ready = garmentsOf(person).filter((g) => wearable(sim, person, g, at));
  const days = (slot: Slot) => ready.filter((g) => g.garment.slot === slot).reduce((sum, g) => sum + (Number.isFinite(careFor(g.garment.kind).wearsBetween) ? wearsLeft(g) : Infinity), 0);
  const bases = days('dress') + days('suit') + Math.min(days('top'), days('bottom'));
  return Math.min(bases, days('underwear'), days('socks'), days('shoes') > 0 ? Infinity : 0);
}
