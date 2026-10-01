/**
 * SLATE — what a person owns, and where each thing is (Stage 1 of
 * `docs/BACKLOG.md`, from 2026-10-01). One record for every possession that
 * isn't a vehicle, a home or a piece of land, which keep their own.
 *
 * Owning a thing and having it to hand are two things. Each item is in one
 * place:
 * - at a home of theirs, in a spot there (the floor, a wardrobe, the fridge);
 * - on them, worn or carried;
 * - in a vehicle of theirs;
 * - inside another item, such as a suitcase;
 * - on an order, until it's delivered (`systems/orders.ts`);
 * - with a service, such as a dry cleaner or a tailor, until it's ready.
 * It can be used only where it is: an item at a home is to hand only to
 * someone at that home, one in a car only where the car is, one on an order
 * or at the cleaner's to no one. A thing never moves itself to wherever it’s
 * wanted.
 *
 * A move takes the household's belongings along (`followTheMove`). The bed
 * and the sofa are paid for as movers' work, and the rest travels in the
 * same boxes. Until 2026-10-01 the bed, sofa and gear were a timestamp each
 * that followed the person anywhere; they migrate into items here, at the
 * home they live in.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { PIECE_LABEL, type Piece } from '../content/furniture';

/** Where a thing is. */
export type Place =
  | { kind: 'home'; home: string; spot?: Spot }
  | { kind: 'person' }
  | { kind: 'vehicle'; vehicleId: string }
  | { kind: 'inside'; itemId: string }
  | { kind: 'order'; orderId: string }
  | { kind: 'service'; serviceId: string; readyAt: Instant };

/** The spots a home keeps things in. Rooms come with Stage 12 of the backlog. */
export type Spot = 'floor' | 'wardrobe' | 'drawers' | 'fridge' | 'freezer' | 'pantry' | 'bathroom' | 'storage';
export const SPOT_LABEL: Readonly<Record<Spot, string>> = {
  floor: 'In The Rooms', wardrobe: 'The Wardrobe', drawers: 'The Drawers', fridge: 'The Fridge', freezer: 'The Freezer',
  pantry: 'The Pantry', bathroom: 'The Bathroom', storage: 'Storage',
};

export interface Item {
  id: string;
  /** What it is: a catalog id (`furniture:bed`, a clothing variant's id), or `custom` for a design of their own. */
  kind: string;
  /** Title Case, as the screen names it. */
  label: string;
  quantity: number;
  /** 1 new, falling with wear. */
  condition: number;
  at: Place;
  acquiredAt: Instant;
  /** What was paid for it, in the save's money, where it was bought. */
  paid?: Money;
  /** Its chosen options (a size, a color, a fabric), where it has any. */
  spec?: Readonly<Record<string, string>>;
  /** How much room it takes, and how much it holds where it's a container, liters. */
  volumeL?: number;
  holdsL?: number;
  /** Moved by movers or a delivery, never by hand: furniture. It goes between spots at a home, and with a move. */
  bulky?: boolean;
  /** A garment's kind, care and wear (`systems/wardrobe.ts`). */
  garment?: import('./wardrobe').Garment;
  /** Food: what it is, how much is left, and when it goes off (`systems/pantry.ts`). */
  food?: import('./pantry').Food;
  /** A toiletry: its kind and how much is left (`systems/hygiene.ts`). */
  supply?: import('./hygiene').Supply;
  /** A bed's market and size (`content/beds.ts`, from 2026-10-01); an older bed is its country's usual double. */
  bed?: { country: string; size: string };
}

/** The key of a home they live in: an owned home by its id, any other by its kind, town and when it began. */
export function homeKeyOf(home: Person['home']): string | undefined {
  if (!home) return undefined;
  return home.kind === 'owned' && home.homeId ? `owned:${home.homeId}` : `${home.kind}:${home.cityId}:${home.since}`;
}

/** Their possessions, the furniture of a save from before items brought in. */
export function itemsOf(person: Person): Item[] {
  const items = (person.items ??= []);
  if (person.furniture && Object.keys(person.furniture).length) {
    const home = homeKeyOf(person.home);
    for (const [piece, at] of Object.entries(person.furniture) as [Piece, number | undefined][]) {
      if (at === undefined || !home) continue;
      items.push({ id: `furniture-${piece}-${at}`, kind: `furniture:${piece}`, label: PIECE_LABEL[piece].replace(/^An? /, ''), quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: at, bulky: true });
    }
    delete person.furniture;
  }
  return items;
}

export const itemById = (person: Person, id: string): Item | undefined => itemsOf(person).find((i) => i.id === id);

/** A new possession, where it's put. */
export function addItem(sim: Simulation, person: Person, item: Omit<Item, 'id'>): Item {
  const made: Item = { ...item, id: sim.nextId('item') };
  itemsOf(person).push(made);
  return made;
}

/** Whether a place is to hand for them now. */
export function reachable(sim: Simulation, person: Person, place: Place): boolean {
  switch (place.kind) {
    case 'person': return true;
    case 'home': return place.home === homeKeyOf(person.home) && person.home?.cityId === person.currentLocationId && !person.stay;
    case 'vehicle': {
      const v = (person.vehicles ?? []).find((x) => x.id === place.vehicleId && x.soldAt === undefined && !x.repossessed);
      return Boolean(v && (v.at ?? v.cityId) === person.currentLocationId && !(v.stolen && v.stolen.recoverAt === undefined));
    }
    case 'inside': {
      // `moveRefusal` lets nothing go inside what it holds, so a holder is never its own.
      const holder = itemById(person, place.itemId);
      return Boolean(holder && reachable(sim, person, holder.at));
    }
    case 'order':
    case 'service': return false;
  }
}

/** Their items to hand now. */
export const toHand = (sim: Simulation, person: Person): Item[] => itemsOf(person).filter((i) => reachable(sim, person, i.at));

/** How much of a container is used, liters. */
export const usedL = (person: Person, holderId: string): number => itemsOf(person).filter((i) => i.at.kind === 'inside' && i.at.itemId === holderId).reduce((sum, i) => sum + (i.volumeL ?? 0) * i.quantity, 0);

/** Why a thing can't go to a place now, or nothing where it can. */
export function moveRefusal(sim: Simulation, person: Person, item: Item, to: Place): string | undefined {
  if (!reachable(sim, person, item.at)) return `The ${item.label} isn’t to hand: ${whereWords(person, item.at)}.`;
  if (!reachable(sim, person, to)) return 'You can’t get to that place now.';
  if (item.bulky && to.kind !== 'home') return `The ${item.label} is moved by movers, not by hand.`;
  if (to.kind === 'home') { const no = spotRefusal(item, to.spot ?? 'floor'); if (no) return no; }
  if (to.kind === 'inside') {
    if (to.itemId === item.id) return 'A thing can’t go inside itself.';
    const holder = itemById(person, to.itemId);
    if (!holder?.holdsL) return 'That doesn’t hold things.';
    // Nor inside something it holds.
    for (let at: Place | undefined = holder.at; at?.kind === 'inside'; at = itemById(person, at.itemId)?.at) if (at.itemId === item.id) return 'It holds that already.';
    const room = holder.holdsL - usedL(person, holder.id);
    if ((item.volumeL ?? 0) * item.quantity > room) return `The ${holder.label} has ${Math.max(0, Math.floor(room))} liters left; the ${item.label} needs ${Math.ceil((item.volumeL ?? 0) * item.quantity)}.`;
  }
  return undefined;
}

/** Whether a thing goes in a spot at home: furniture in the rooms or storage, and only food in the fridge, freezer or pantry. */
export function spotRefusal(item: Item, spot: Spot): string | undefined {
  if (item.bulky && spot !== 'floor' && spot !== 'storage') return `The ${item.label} stands in a room, or in storage.`;
  const food = item.food !== undefined;
  if ((spot === 'fridge' || spot === 'freezer' || spot === 'pantry') && !food) return `${SPOT_LABEL[spot]} is for food.`;
  return undefined;
}

/** Words for where a place is. */
export function whereWords(person: Person, place: Place): string {
  switch (place.kind) {
    case 'person': return 'on you';
    case 'home': return place.home === homeKeyOf(person.home) ? `at home${place.spot && place.spot !== 'floor' ? `, ${SPOT_LABEL[place.spot].toLowerCase()}` : ''}` : 'at another home of yours';
    case 'vehicle': return 'in a vehicle';
    case 'inside': return `in the ${itemById(person, place.itemId)?.label ?? 'bag'}`;
    case 'order': return 'on its way';
    case 'service': return 'with a service';
  }
}

/** The home being left: its key, a save's furniture from before items settled into it first. */
export function leavingHome(person: Person): string | undefined {
  itemsOf(person);
  return homeKeyOf(person.home);
}

/** A move's belongings: what was at the home they left goes to the one they live in now. */
export function followTheMove(person: Person, fromKey: string | undefined): void {
  const to = homeKeyOf(person.home);
  if (!fromKey || !to) return;
  for (const item of itemsOf(person)) if (item.at.kind === 'home' && item.at.home === fromKey) item.at = { ...item.at, home: to };
}

/** Whether they have a piece of furniture at the home they live in. */
export const hasAtHome = (person: Person, kind: string): boolean => {
  const home = homeKeyOf(person.home);
  return Boolean(home) && itemsOf(person).some((i) => i.kind === kind && i.at.kind === 'home' && i.at.home === home);
};

export function registerItems(sim: Simulation): void {
  sim.onCommand<{ itemId: string; to: Place }, { at: Place }>('items.move', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    if (!item) throw new CommandError('That isn’t something you own.');
    const to = p?.to;
    if (!to || typeof to !== 'object') throw new CommandError('Where to?');
    const no = moveRefusal(s, person, item, to);
    if (no) throw new CommandError(no);
    item.at = to.kind === 'home' ? { kind: 'home', home: to.home, spot: to.spot ?? 'floor' } : to;
    return { at: item.at };
  });
}
