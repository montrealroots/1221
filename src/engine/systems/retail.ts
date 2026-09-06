/**
 * SLATE — the shop floor.
 *
 * A shop stops being a list of prices here. Somebody is on the floor, they
 * greet you or they do not, they have an opinion about what you have picked
 * up, there is a fitting room for the things that need one, and the counter
 * is a conversation rather than a button. The money is still `shop.purchase`
 * — one engine for every purchase in the game — and everything in this file
 * is what happens around it. Every chain here is SLATE's own.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_MINUTE } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { Id, Person, RetailVisit } from '../domain/model';
import { CATALOG, RETAILERS, retailPrice, type CatalogItem, type Retailer } from '../content/catalog';
import { costOfLiving } from '../content/tax';
import { placeById, type Place } from '../content/places';
import type { DialogueTone } from '../dialogue/schema';
import { factsOf, rememberFact, tallyFact, tallyOf } from './memory';
import { makeBackgroundPerson, peopleOf } from './people';
import { wardrobeOf } from './commerce';

/** How many things the floor puts in front of you at once. */
export const SHELF = 12;

/** Minutes it takes to look at one thing properly. */
export const HANDLE_MINUTES = 4;

/** Minutes in the fitting room, per item. */
export const FITTING_MINUTES = 6;

/** Visits before the floor knows your face. */
export const REGULAR_VISITS = 3;

/** Categories that go into a fitting room rather than straight to the till. */
export const FITTABLE: readonly string[] = ['clothing', 'footwear'];

/** What the mirror says, and what it means for the buying. */
export type Verdict = 'yours' | 'close' | 'wrong_size' | 'not_you';

export const VERDICT_LABEL: Readonly<Record<Verdict, string>> = {
  yours: 'It Is Yours',
  close: 'Nearly',
  wrong_size: 'The Wrong Size',
  not_you: 'Not You',
};

export function retailVisits(sim: Simulation): Record<Id, RetailVisit> {
  return (sim.universe.retailVisits ??= {});
}

export function visitOf(sim: Simulation, id: Id): RetailVisit {
  const visit = retailVisits(sim)[id];
  if (!visit) throw new CommandError('You have left that shop.');
  return visit;
}

export function openVisit(sim: Simulation, placeId?: string): RetailVisit | undefined {
  return Object.values(retailVisits(sim))
    .filter((v) => v.status !== 'bought' && v.status !== 'left' && (placeId === undefined || v.placeId === placeId))
    .sort((a, b) => b.arrivedAt - a.arrivedAt)[0];
}

/** The chain behind a storefront, where the storefront is one. */
export function retailerAt(place: Place): Retailer | undefined {
  return place.retailerId ? RETAILERS.get(place.retailerId) : undefined;
}

export function placeOfVisit(_sim: Simulation, visit: RetailVisit): Place {
  const place = placeById(visit.cityId, visit.placeId);
  if (!place) throw new CommandError('That shop has gone.');
  return place;
}

// ---------------------------------------------------------------------------
// The person on the floor
// ---------------------------------------------------------------------------

const FLOOR_INTERESTS: readonly string[] = ['tailoring', 'vintage', 'design', 'music', 'running', 'ceramics', 'football', 'film', 'gardening'];

export function assistantAt(sim: Simulation, place: Place): Person {
  const archetype = `retail:${place.id}`;
  const existing = peopleOf(sim, archetype)[0];
  if (existing) return existing;
  const retailer = retailerAt(place);
  const rng = sim.rng('retail', place.id);
  return makeBackgroundPerson(sim, {
    rng,
    archetype,
    industryRole: 'retail',
    cityId: place.cityId,
    background: `On the floor at ${place.name}.`,
    interests: [rng.pick(FLOOR_INTERESTS), rng.pick(FLOOR_INTERESTS)],
    skills: { selling: clamp(Math.round((retailer?.tier ?? 3) * 14 + rng.int(0, 25)), 20, 100) },
    age: [20, 58],
    personality: {
      extraversion: rng.int(45, 95),
      agreeableness: rng.int(35, 90),
      conscientiousness: rng.int(45, 92),
    },
    lifestyle: (retailer?.tier ?? 3) >= 4 ? 'comfortable' : 'modest',
  });
}

export function toneOf(person: Person): DialogueTone {
  if (person.personality.agreeableness >= 66) return 'warm';
  if (person.personality.extraversion <= 52) return 'guarded';
  if (person.personality.conscientiousness >= 78) return 'firm';
  return 'dry';
}

// ---------------------------------------------------------------------------
// What the floor knows about you
// ---------------------------------------------------------------------------

export interface FloorStanding {
  visits: number;
  bought: number;
  /** Times you tried things on and walked out with nothing. */
  browsedOnly: number;
  regular: boolean;
}

const CAME_IN = 'Came in';
const BOUGHT = 'Bought something';
const LOOKED = 'Looked and left';

/** What one occurrence is worth in a tallied fact's weight. */
const BUY_STEP = 20;
const LOOK_STEP = 22;

export function standingAt(sim: Simulation, place: Place): FloorStanding {
  const facts = factsOf(sim, assistantAt(sim, place).id, { aboutId: sim.player.id });
  const visits = facts.filter((f) => f.text.startsWith(CAME_IN)).length;
  return {
    visits,
    bought: tallyOf(facts, BOUGHT, BUY_STEP),
    browsedOnly: tallyOf(facts, LOOKED, LOOK_STEP),
    regular: visits >= REGULAR_VISITS,
  };
}

export function standingFlags(standing: FloorStanding): string[] {
  const flags: string[] = [];
  if (standing.visits === 0) flags.push('first');
  if (standing.regular) flags.push('regular');
  if (standing.bought >= 2) flags.push('buyer');
  if (standing.browsedOnly >= 2 && standing.bought === 0) flags.push('browser');
  return flags;
}

// ---------------------------------------------------------------------------
// What is on the shelf
// ---------------------------------------------------------------------------

export interface Stocked {
  item: CatalogItem;
  price: Money;
  fittable: boolean;
  /** Whether the floor is pushing it this fortnight. */
  featured: boolean;
}

/**
 * What is out on the floor today. The chain's whole catalogue is not: a shop
 * puts a rail out, and the rail changes with the fortnight, seeded so the same
 * fortnight in the same shop is the same rail.
 */
export function stockAt(sim: Simulation, place: Place, category?: string): Stocked[] {
  const retailer = retailerAt(place);
  if (!retailer) return [];
  const col = costOfLiving(place.cityId);
  const fortnight = Math.floor(sim.now / (14 * 24 * 60 * 60 * 1000));
  const rng = sim.rng('retail_stock', place.id, String(fortnight));
  const eligible = CATALOG.all().filter((item) =>
    item.category !== 'dining'
    && (retailer.categories.includes(item.category) || retailer.categories.includes(item.subcategory))
    && (category === undefined || item.category === category));
  const shelf = rng.shuffle([...eligible]).slice(0, SHELF);
  const featured = new Set(shelf.slice(0, 2).map((i) => i.id));
  return shelf
    .map((item) => ({
      item,
      price: retailPrice(item.id, retailer.id, col),
      fittable: FITTABLE.includes(item.category),
      featured: featured.has(item.id),
    }))
    .sort((a, b) => a.item.category.localeCompare(b.item.category) || a.price - b.price);
}

/** Whether the shop keeps anything at all. A market with no rail is not a shop. */
export function sellsAnything(sim: Simulation, place: Place): boolean {
  return stockAt(sim, place).length > 0;
}

// ---------------------------------------------------------------------------
// The fitting room
// ---------------------------------------------------------------------------

/**
 * What the mirror says. Read from the thing and from you: what you already
 * own of that slot, how dressy it is against how dressy you dress, and a
 * seeded roll for the size, because sizes are a lie every shop tells
 * differently.
 */
export function fitOf(sim: Simulation, place: Place, item: CatalogItem): Verdict {
  const rng = sim.rng('retail_fit', place.id, item.id, sim.player.id);
  if (rng.chance(0.14)) return 'wrong_size';
  const owned = Object.values(wardrobeOf(sim, sim.player.id)).flat();
  const mine = owned.filter((a) => a.wardrobe?.slot === item.slot);
  const myFormality = owned.length > 0
    ? owned.reduce((sum, a) => sum + (a.wardrobe?.formality ?? 30), 0) / owned.length
    : 40;
  const gap = Math.abs((item.formality ?? 40) - myFormality);
  const score = (item.quality - 50) * 0.6 - gap * 0.5 + (mine.length === 0 ? 8 : 0) + rng.int(-8, 8);
  if (score >= 12) return 'yours';
  if (score >= -2) return 'close';
  return 'not_you';
}

/** What a verdict does to the wearing of it, for the scene to say plainly. */
export function verdictNote(verdict: Verdict): string {
  switch (verdict) {
    case 'yours': return 'It fits, and it looks like it was meant for you.';
    case 'close': return 'It fits. Whether it is right is another question.';
    case 'wrong_size': return 'Not in your size, not in this shop, not today.';
    case 'not_you': return 'It fits, technically. The mirror is not convinced.';
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function registerRetail(sim: Simulation): void {
  retailVisits(sim);

  /** Through the door. Nothing is bought and nothing is promised. */
  sim.onCommand<{ placeId: string }, { visitId: Id; assistantName: string; regular: boolean; shelf: number }>(
    'retail.enter',
    (p, { sim: s }) => {
      const me = s.player;
      const place = placeById(me.currentLocationId, p.placeId);
      if (!place) throw new CommandError('That is not somewhere in this city.');
      if (me.currentPlaceId !== place.id) throw new CommandError(`You are not at ${place.name}. Go there first.`);
      if (!retailerAt(place)) throw new CommandError(`${place.name} is not a shop you can walk around.`);
      if (openVisit(s, place.id)) throw new CommandError('You are already in there.');

      const assistant = assistantAt(s, place);
      const standing = standingAt(s, place);
      const visit: RetailVisit = {
        id: s.nextId('retail'),
        saveId: s.universe.meta.id,
        placeId: place.id,
        retailerId: place.retailerId!,
        cityId: place.cityId,
        assistantId: assistant.id,
        arrivedAt: s.now,
        handled: [], tried: [], basket: [],
        spent: 0,
        status: 'browsing',
      };
      retailVisits(s)[visit.id] = visit;
      s.emit('retail.entered', { visitId: visit.id, placeId: place.id, retailerId: visit.retailerId });
      return { visitId: visit.id, assistantName: assistant.displayName, regular: standing.regular, shelf: stockAt(s, place).length };
    },
  );

  /** Picking something up and looking at it. Costs minutes, nothing else. */
  sim.onCommand<{ visitId: Id; catalogId: string }, { name: string; price: Money; minutes: number; fittable: boolean }>(
    'retail.handle',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status !== 'browsing') throw new CommandError('You are not on the floor.');
      const place = placeOfVisit(s, visit);
      const stocked = stockAt(s, place).find((x) => x.item.id === p.catalogId);
      if (!stocked) throw new CommandError('That is not out on the floor today.');
      if (!visit.handled.includes(p.catalogId)) visit.handled.push(p.catalogId);
      s.advanceTo(s.now + HANDLE_MINUTES * MS_MINUTE);
      return { name: stocked.item.name, price: stocked.price, minutes: HANDLE_MINUTES, fittable: stocked.fittable };
    },
  );

  /** The fitting room. The mirror has an opinion and so does the floor. */
  sim.onCommand<{ visitId: Id; catalogId: string }, { verdict: Verdict; note: string; minutes: number }>(
    'retail.try_on',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status === 'bought' || visit.status === 'left') throw new CommandError('You have left that shop.');
      const place = placeOfVisit(s, visit);
      const stocked = stockAt(s, place).find((x) => x.item.id === p.catalogId);
      if (!stocked) throw new CommandError('That is not out on the floor today.');
      if (!stocked.fittable) throw new CommandError(`You do not try ${stocked.item.name} on.`);
      if (visit.tried.some((t) => t.catalogId === p.catalogId)) throw new CommandError('You have had that on already.');

      const verdict = fitOf(s, place, stocked.item);
      visit.tried.push({ catalogId: p.catalogId, verdict });
      visit.status = 'fitting';
      s.advanceTo(s.now + FITTING_MINUTES * MS_MINUTE);
      rememberFact(s, visit.assistantId, {
        kind: 'preference', aboutId: s.player.id,
        text: `Tried the ${stocked.item.name}`, weight: 20, sourceKind: 'observed',
      });
      visit.status = 'browsing';
      s.emit('retail.tried', { visitId: visit.id, catalogId: p.catalogId, verdict });
      return { verdict, note: verdictNote(verdict), minutes: FITTING_MINUTES };
    },
  );

  /** Into the basket, or back on the rail. Nothing is charged either way. */
  sim.onCommand<{ visitId: Id; catalogId: string; take?: boolean }, { basket: string[]; running: Money }>(
    'retail.basket',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status !== 'browsing') throw new CommandError('You are not on the floor.');
      const place = placeOfVisit(s, visit);
      const stocked = stockAt(s, place).find((x) => x.item.id === p.catalogId);
      if (!stocked) throw new CommandError('That is not out on the floor today.');
      const wrongSize = visit.tried.find((t) => t.catalogId === p.catalogId)?.verdict === 'wrong_size';
      if (wrongSize && p.take !== false) throw new CommandError(`They do not have the ${stocked.item.name} in your size.`);

      if (p.take === false) visit.basket = visit.basket.filter((id) => id !== p.catalogId);
      else if (!visit.basket.includes(p.catalogId)) visit.basket.push(p.catalogId);

      const shelf = stockAt(s, place);
      const running = visit.basket.reduce((sum, id) => sum + (shelf.find((x) => x.item.id === id)?.price ?? 0), 0);
      return { basket: [...visit.basket], running };
    },
  );

  /** What the counter would come to, before you say yes. Nothing moves. */
  sim.onCommand<{ visitId: Id }, { lines: { catalogId: string; name: string; price: Money }[]; subtotal: Money }>(
    'retail.quote',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      const place = placeOfVisit(s, visit);
      const shelf = stockAt(s, place);
      const lines = visit.basket.map((id) => {
        const stocked = shelf.find((x) => x.item.id === id);
        return { catalogId: id, name: stocked?.item.name ?? id, price: stocked?.price ?? 0 };
      });
      return { lines, subtotal: lines.reduce((sum, l) => sum + l.price, 0) };
    },
  );

  /** Out again with nothing. The floor notices, and it remembers. */
  sim.onCommand<{ visitId: Id }, { note: string }>(
    'retail.walk_out',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status === 'bought' || visit.status === 'left') throw new CommandError('You have left that shop.');
      const place = placeOfVisit(s, visit);
      visit.status = 'left';
      visit.leftAt = s.now;
      rememberFact(s, visit.assistantId, { kind: 'meeting', aboutId: s.player.id, text: `${CAME_IN} on ${new Date(visit.arrivedAt).toISOString().slice(0, 10)}`, weight: 18, sourceKind: 'observed' });
      if (visit.tried.length > 0 || visit.handled.length > 0) {
        tallyFact(s, visit.assistantId, { kind: 'event', aboutId: s.player.id, text: LOOKED, step: LOOK_STEP, sourceKind: 'observed' });
      }
      s.emit('retail.left', { visitId: visit.id, placeId: place.id, bought: false });
      return { note: `You put it back on the rail and left ${place.name}.` };
    },
  );

  /**
   * The counter. The money is `shop.purchase`, so the tax, the receipt and the
   * asset it creates are the same ones every other purchase in the game gets;
   * this hands it the basket, in store, and closes the visit.
   */
  sim.onCommand<{ visitId: Id; accountId?: Id }, { orderId: Id; total: Money; items: number }>(
    'retail.pay',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status === 'bought' || visit.status === 'left') throw new CommandError('You have left that shop.');
      if (visit.basket.length === 0) throw new CommandError('You are holding nothing.');
      const place = placeOfVisit(s, visit);

      const counted = new Map<string, number>();
      for (const id of visit.basket) counted.set(id, (counted.get(id) ?? 0) + 1);
      const lines = [...counted.entries()].map(([catalogId, quantity]) => ({ catalogId, quantity }));

      const result = s.must<{ orderId: Id; total: Money }>({
        kind: 'shop.purchase',
        payload: { retailerId: visit.retailerId, lines, channel: 'in_store', accountId: p.accountId },
        idempotencyKey: `retail.pay:${visit.id}`,
      });

      visit.orderId = result.orderId;
      visit.spent = result.total;
      visit.status = 'bought';
      visit.leftAt = s.now;
      s.advanceTo(s.now + 6 * MS_MINUTE);

      rememberFact(s, visit.assistantId, { kind: 'meeting', aboutId: s.player.id, text: `${CAME_IN} on ${new Date(visit.arrivedAt).toISOString().slice(0, 10)}`, weight: 18, sourceKind: 'observed' });
      tallyFact(s, visit.assistantId, { kind: 'event', aboutId: s.player.id, text: BOUGHT, step: BUY_STEP, sourceKind: 'observed', refType: 'order', refId: result.orderId });

      s.remember({
        category: 'life',
        title: `Shopped At ${place.name}`,
        detail: `${lines.length} things, ${formatMoney(result.total)}.`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: result.total > 200_000 ? 10 : 3, public: false, amount: result.total,
      });
      s.emit('retail.left', { visitId: visit.id, placeId: place.id, bought: true });
      return { orderId: result.orderId, total: result.total, items: visit.basket.length };
    },
  );
}
