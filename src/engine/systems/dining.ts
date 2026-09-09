/**
 * SLATE — the room: the door, the table, the server, the bill.
 *
 * Eating out stops being a transaction here. Somebody is on the door and
 * somebody has your table, and both of them remember whether you came, what
 * you ordered and what you left. A counter takes your money when it takes
 * your order; a table brings a bill at the end, and the tip is yours to
 * decide. Nothing in this file invents a real restaurant: the rooms come
 * from `content/places`, which says of every one of them whether it is a
 * landmark on the record or SLATE's own.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_MINUTE, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { DiningService, DiningVisit, Id, Person } from '../domain/model';
import { CITIES } from '../content/geography';
import { menuOf, placeById, priceOf, type Place } from '../content/places';
import type { DialogueTone } from '../dialogue/schema';
import { factsOf, rememberFact, tallyFact, tallyOf } from './memory';
import { makeBackgroundPerson, peopleOf } from './people';
import { requireAge } from './lifespan';

/** What the house adds to the bill at a table. A counter adds nothing. */
export const SERVICE_SHARE = 0.18;

/** The tips a bill offers, as a share of the food. */
export const TIP_SHARES: readonly number[] = [0, 0.1, 0.15, 0.18, 0.22, 0.25];

/** At and above this share, the room decides you are worth looking after. */
export const GOOD_TIP = 0.18;

/** Sittings at the same room before the host knows your face. */
export const REGULAR_VISITS = 3;

/** Longest a room will quote you before it stops pretending. */
export const MAX_WAIT_MINUTES = 75;

/** Minutes the kitchen takes, per dish, before the room's own pace. */
const COOK_PER_DISH = 9;

const MAX_ITEMS = 3;

/** Where they can put you, worst first. The order is the ladder you climb. */
export const TABLES: readonly string[] = ['By The Kitchen Door', 'At The Back', 'In The Middle Of The Room', 'At The Bar', 'By The Window', 'On The Terrace'];

export function diningVisits(sim: Simulation): Record<Id, DiningVisit> {
  return (sim.universe.diningVisits ??= {});
}

export function visitOf(sim: Simulation, id: Id): DiningVisit {
  const visit = diningVisits(sim)[id];
  if (!visit) throw new CommandError('That sitting is over.');
  return visit;
}

/** The sitting you are in the middle of, if there is one. */
export function openVisit(sim: Simulation, placeId?: string): DiningVisit | undefined {
  return Object.values(diningVisits(sim))
    .filter((v) => v.status !== 'settled' && v.status !== 'left' && (placeId === undefined || v.placeId === placeId))
    .sort((a, b) => b.arrivedAt - a.arrivedAt)[0];
}

/** How a room serves: over a counter, or at a table. */
export function serviceOf(place: Place): DiningService {
  return place.kind === 'fast_food' || place.kind === 'cafe' ? 'counter' : 'table';
}

export function placeOfVisit(_sim: Simulation, visit: DiningVisit): Place {
  const place = placeById(visit.cityId, visit.placeId);
  if (!place) throw new CommandError('That room isn’t there any more.');
  return place;
}

// ---------------------------------------------------------------------------
// The people in the room
// ---------------------------------------------------------------------------

const FRONT_INTERESTS: readonly string[] = ['wine', 'music', 'football', 'cycling', 'painting', 'running', 'cooking', 'photography', 'theatre'];

/** The one on the door, or the one behind the counter. Made once and kept. */
export function staffOf(sim: Simulation, place: Place, role: 'host' | 'server'): Person {
  const archetype = `dining:${place.id}:${role}`;
  const existing = peopleOf(sim, archetype)[0];
  if (existing) return existing;
  const rng = sim.rng('dining', place.id, role);
  const counter = serviceOf(place) === 'counter';
  return makeBackgroundPerson(sim, {
    rng,
    archetype,
    industryRole: counter ? 'counter' : role,
    cityId: place.cityId,
    background: counter
      ? `Behind the counter at ${place.name}.`
      : role === 'host' ? `On the door at ${place.name}.` : `Waits tables at ${place.name}.`,
    interests: [rng.pick(FRONT_INTERESTS), rng.pick(FRONT_INTERESTS)],
    skills: { hospitality: clamp(Math.round(place.quality * 0.7 + rng.int(0, 25)), 20, 100) },
    age: role === 'host' ? [24, 55] : [19, 48],
    personality: {
      extraversion: rng.int(50, 95),
      agreeableness: rng.int(35, 92),
      conscientiousness: rng.int(45, 92),
    },
    lifestyle: 'modest',
  });
}

export function toneOf(person: Person): DialogueTone {
  if (person.personality.agreeableness >= 66) return 'warm';
  if (person.personality.extraversion <= 52) return 'guarded';
  if (person.personality.conscientiousness >= 78) return 'firm';
  return 'dry';
}

// ---------------------------------------------------------------------------
// What the room knows about you
// ---------------------------------------------------------------------------

export interface Standing {
  /** Sittings the room can remember. */
  visits: number;
  /** Times you tipped well. */
  goodTips: number;
  /** Times you left nothing. */
  stiffed: number;
  /** Times you were quoted a wait and walked out. */
  walkouts: number;
  /** The dish you have ordered more than any other here. */
  usual?: string;
  regular: boolean;
}

const VISIT = 'Ate here';
const TIP_GOOD = 'Tipped well';
const TIP_NONE = 'Left nothing';
const WALKED = 'Wouldn’t wait';

/**
 * What one occurrence is worth in a tallied fact's weight. The same wording
 * told twice is one fact, so the count lives in the weight: a dish ordered
 * three times, four good tips, two walkouts.
 */
const DISH_STEP = 12;
const TIP_STEP = 20;
const WALK_STEP = 25;

export function standingAt(sim: Simulation, place: Place): Standing {
  const me = sim.player.id;
  const staff = [staffOf(sim, place, 'host').id, staffOf(sim, place, 'server').id];
  const facts = staff.flatMap((id) => factsOf(sim, id, { aboutId: me }));
  const visits = facts.filter((f) => f.text.startsWith(VISIT)).length;
  const dishes: { name: string; times: number }[] = [];
  for (const fact of facts) {
    const match = /^Ordered the (.+)$/.exec(fact.text);
    if (match) dishes.push({ name: match[1]!, times: Math.round(fact.weight / DISH_STEP) });
  }
  const usual = dishes.sort((a, b) => b.times - a.times)[0];
  return {
    visits,
    goodTips: tallyOf(facts, TIP_GOOD, TIP_STEP),
    stiffed: tallyOf(facts, TIP_NONE, TIP_STEP),
    walkouts: tallyOf(facts, WALKED, WALK_STEP),
    usual: usual && usual.times >= 2 ? usual.name : undefined,
    regular: visits >= REGULAR_VISITS,
  };
}

/** The flags the library reads about how the room feels about you. */
export function standingFlags(standing: Standing): string[] {
  const flags: string[] = [];
  if (standing.visits === 0) flags.push('first');
  if (standing.regular) flags.push('regular');
  if (standing.goodTips >= 2) flags.push('generous');
  if (standing.stiffed >= 2) flags.push('cheap');
  if (standing.walkouts >= 1) flags.push('walked');
  return flags;
}

// ---------------------------------------------------------------------------
// The door
// ---------------------------------------------------------------------------

/** Whether the room is at its busiest right now. */
export function peakNow(sim: Simulation, place: Place): boolean {
  const hour = zonedParts(sim.now, CITIES.get(place.cityId)?.timeZone ?? sim.homeZone).hour;
  if (place.kind === 'cafe') return hour >= 7 && hour < 10;
  if (place.kind === 'bar') return hour >= 20 && hour < 24;
  return (hour >= 12 && hour < 14) || (hour >= 19 && hour < 22);
}

/**
 * Minutes on the door. A busy, good, dear room at eight on a Friday makes you
 * wait; a counter never does. Being known cuts it, walking out once does not
 * help, and no room quotes more than an hour and a quarter.
 */
export function waitFor(sim: Simulation, place: Place, standing: Standing, partySize: number): number {
  if (serviceOf(place) === 'counter') return 0;
  const rng = sim.rng('dining_wait', place.id, String(Math.floor(sim.now / (30 * MS_MINUTE))));
  const pressure = (place.quality - 50) * 0.5 + (place.price - 1) * 6 + (place.industryHaunt ? 8 : 0);
  const base = peakNow(sim, place) ? Math.max(0, pressure) : Math.max(0, pressure - 28) * 0.4;
  const party = partySize >= 4 ? 12 : partySize === 3 ? 5 : 0;
  const known = standing.regular ? 0.45 : standing.visits > 0 ? 0.8 : 1;
  const grudge = standing.walkouts >= 1 && !standing.regular ? 8 : 0;
  const quoted = Math.round(((base + party) * known + grudge) * rng.float(0.75, 1.25) / 5) * 5;
  return clamp(quoted, 0, MAX_WAIT_MINUTES);
}

/** Which table they offer, worst first, better the better they know you. */
export function tableFor(sim: Simulation, place: Place, standing: Standing): string {
  if (serviceOf(place) === 'counter') return 'At The Counter';
  const rng = sim.rng('dining_table', place.id, String(sim.now));
  let rung = 1 + (place.quality >= 78 ? 1 : 0);
  if (standing.regular) rung += 2;
  else if (standing.visits > 0) rung += 1;
  if (standing.goodTips >= 2) rung += 1;
  if (standing.stiffed >= 2) rung -= 2;
  if (peakNow(sim, place)) rung -= 1;
  rung += rng.int(-1, 1);
  return TABLES[clamp(rung, 0, TABLES.length - 1)]!;
}

// ---------------------------------------------------------------------------
// The bill
// ---------------------------------------------------------------------------

export interface Bill {
  subtotal: Money;
  serviceCharge: Money;
  total: Money;
}

export function billFor(_sim: Simulation, visit: DiningVisit, tipShare: number): Bill & { tip: Money } {
  const subtotal = visit.items.reduce((sum, i) => sum + i.price, 0);
  const serviceCharge = visit.service === 'table' ? Math.round(subtotal * SERVICE_SHARE) : 0;
  const tip = Math.round(subtotal * clamp(tipShare, 0, 1));
  return { subtotal, serviceCharge, tip, total: subtotal + serviceCharge + tip };
}

/** How long the kitchen takes for what you ordered, in this room. */
export function cookMinutes(place: Place, dishes: number): number {
  const pace = place.kind === 'fast_food' ? 0.35 : place.kind === 'cafe' ? 0.5 : place.price >= 3 ? 1.4 : 1;
  return Math.max(4, Math.round(dishes * COOK_PER_DISH * pace));
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function registerDining(sim: Simulation): void {
  diningVisits(sim);

  /** Walking in. Nothing is charged and nothing is promised; you get a quote. */
  sim.onCommand<
    { placeId: string; partySize?: number; withPersonIds?: Id[] },
    { visitId: Id; service: DiningService; quotedWait: number; table: string; hostName: string; serverName: string; regular: boolean; usual?: string }
  >(
    'dine.arrive',
    (p, { sim: s }) => {
      const me = s.player;
      const place = placeById(me.currentLocationId, p.placeId);
      if (!place) throw new CommandError('That isn’t somewhere in this city.');
      if (me.currentPlaceId !== place.id) throw new CommandError(`You aren’t at ${place.name}. Go there first.`);
      if (!place.actions.includes('eat') && !place.actions.includes('drink')) throw new CommandError(`${place.name} doesn’t serve food.`);
      // A bar sells one thing, so a bar is a door with an age on it. A
      // restaurant that also has a bar is not, and neither is a cafe.
      if (place.kind === 'bar' || place.kind === 'club') requireAge(s, 'drink');
      if (menuOf(place).length === 0) throw new CommandError(`${place.name} has nothing to order.`);

      const already = openVisit(s, place.id);
      if (already) throw new CommandError('You’re already in there.');

      const guestIds = (p.withPersonIds ?? []).filter((id) => s.universe.people[id]);
      const partySize = clamp(p.partySize ?? 1 + guestIds.length, 1, 8);
      const service = serviceOf(place);
      const standing = standingAt(s, place);
      const host = staffOf(s, place, 'host');
      const server = staffOf(s, place, 'server');
      const quotedWait = waitFor(s, place, standing, partySize);

      const visit: DiningVisit = {
        id: s.nextId('dining'),
        saveId: s.universe.meta.id,
        placeId: place.id,
        cityId: place.cityId,
        service,
        hostId: service === 'table' ? host.id : undefined,
        serverId: service === 'table' ? server.id : host.id,
        partySize,
        guestIds,
        arrivedAt: s.now,
        quotedWait,
        waitedMinutes: 0,
        table: quotedWait > 0 ? '' : tableFor(s, place, standing),
        items: [],
        subtotal: 0, serviceCharge: 0, tip: 0, total: 0,
        status: quotedWait > 0 ? 'waiting' : 'seated',
      };
      diningVisits(s)[visit.id] = visit;
      s.emit('dine.arrived', { visitId: visit.id, placeId: place.id, quotedWait, service });
      return {
        visitId: visit.id, service, quotedWait, table: visit.table,
        hostName: host.displayName, serverName: server.displayName,
        regular: standing.regular, usual: standing.usual,
      };
    },
  );

  /** Standing there until they call you. The clock actually moves. */
  sim.onCommand<{ visitId: Id }, { waited: number; table: string }>(
    'dine.wait',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status !== 'waiting') throw new CommandError('You aren’t waiting for anything.');
      const place = placeOfVisit(s, visit);
      const rng = s.rng('dining_called', visit.id);
      // They said twenty minutes. Sometimes it is fifteen and sometimes it is
      // thirty five, and the better the room the closer it is to the truth.
      const drift = place.quality >= 80 ? rng.float(0.85, 1.2) : rng.float(0.8, 1.6);
      const waited = Math.max(1, Math.round(visit.quotedWait * drift));
      visit.waitedMinutes = waited;
      visit.table = tableFor(s, place, standingAt(s, place));
      visit.status = 'seated';
      s.advanceTo(s.now + waited * MS_MINUTE);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + (waited > visit.quotedWait + 10 ? 4 : 1), 0, 100);
      s.emit('dine.seated', { visitId: visit.id, placeId: visit.placeId, waited });
      return { waited, table: visit.table };
    },
  );

  /** Not waiting. The door remembers it, and it costs you the next time. */
  sim.onCommand<{ visitId: Id }, { note: string }>(
    'dine.leave',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      const place = placeOfVisit(s, visit);
      const spentAnything = visit.items.length > 0 && visit.status !== 'settled';
      if (spentAnything) throw new CommandError('You have eaten. Settle the bill first.');
      visit.status = 'left';
      if (visit.status === 'left' && visit.quotedWait > 0 && visit.waitedMinutes === 0) {
        for (const id of [visit.hostId, visit.serverId]) {
          if (id) tallyFact(s, id, { kind: 'event', aboutId: s.player.id, text: WALKED, step: WALK_STEP, sourceKind: 'observed' });
        }
      }
      s.emit('dine.left', { visitId: visit.id, placeId: visit.placeId });
      return { note: `You put your coat back on and left ${place.name} to it.` };
    },
  );

  /** The order. Nothing is paid at a table; a counter takes it now. */
  sim.onCommand<
    { visitId: Id; items: string[]; accountId?: Id },
    { subtotal: Money; charged: Money; minutes: number; nourishment: number; items: string[] }
  >(
    'dine.order',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status !== 'seated') throw new CommandError('Nobody has taken your order yet.');
      const place = placeOfVisit(s, visit);
      const menu = menuOf(place);
      if (p.items.length === 0) throw new CommandError('Order something.');
      if (p.items.length > MAX_ITEMS * Math.max(1, visit.partySize)) throw new CommandError('That’s more than one table can eat.');

      const chosen = p.items.map((name) => {
        const item = menu.find((m) => m.name.toLowerCase() === name.toLowerCase());
        if (!item) throw new CommandError(`${place.name} doesn’t have that. The menu is: ${menu.map((m) => m.name).join(', ')}.`);
        return item;
      });

      const lines = chosen.map((item) => ({ name: item.name, price: priceOf(place, item) }));
      const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay with.');

      // A counter wants the money before it makes the coffee.
      let charged = 0;
      if (visit.service === 'counter') {
        if (s.ledger.availableFunds(accountId) < subtotal) {
          throw new CommandError(`That comes to ${formatMoney(subtotal)} and you can’t cover it.`);
        }
        s.expense(accountId, subtotal, place.name, 'dining', { refType: 'dining', refId: visit.id });
        charged = subtotal;
      } else if (s.ledger.availableFunds(accountId) < subtotal) {
        // A table will still serve you; the bill is the problem you are making.
        s.notify({
          category: 'money', title: 'You Can’t Cover This', importance: 60,
          body: `The order at ${place.name} comes to ${formatMoney(subtotal)} before service, and you have ${formatMoney(s.ledger.availableFunds(accountId))}.`,
        });
      }

      visit.items = lines;
      visit.subtotal = subtotal;
      visit.accountId = accountId;
      visit.orderedAt = s.now;
      visit.status = 'ordered';

      const minutes = cookMinutes(place, lines.length);
      s.advanceTo(s.now + minutes * MS_MINUTE);
      visit.servedAt = s.now;
      visit.status = 'served';

      const nourishment = chosen.reduce((sum, i) => sum + i.nourishment, 0);
      const me = s.player;
      me.wellbeing.nourishment = clamp(me.wellbeing.nourishment + nourishment, 0, 100);
      me.wellbeing.morale = clamp(me.wellbeing.morale + place.quality * 0.05 + (visit.guestIds.length > 0 ? 4 : 0), 0, 100);
      me.wellbeing.stress = clamp(me.wellbeing.stress - (place.kind === 'bar' ? 8 : 5), 0, 100);
      if (place.kind === 'bar') me.wellbeing.energy = clamp(me.wellbeing.energy - 6, 0, 100);

      for (const line of lines) {
        tallyFact(s, visit.serverId, { kind: 'preference', aboutId: me.id, text: `Ordered the ${line.name}`, step: DISH_STEP, sourceKind: 'observed' });
      }
      if (visit.service === 'counter') settle(s, visit, 0);

      s.emit('dine.ordered', { visitId: visit.id, placeId: place.id, subtotal, items: lines.length });
      return { subtotal, charged, minutes, nourishment, items: lines.map((l) => l.name) };
    },
  );

  /** The bill, and what you put on top of it. */
  sim.onCommand<{ visitId: Id; tipShare?: number; accountId?: Id }, { subtotal: Money; serviceCharge: Money; tip: Money; total: Money }>(
    'dine.settle',
    (p, { sim: s }) => {
      const visit = visitOf(s, p.visitId);
      if (visit.status === 'settled') throw new CommandError('That bill is paid.');
      if (visit.items.length === 0) throw new CommandError('There’s no bill; you haven’t ordered.');
      if (p.accountId) visit.accountId = p.accountId;
      return settle(s, visit, clamp(p.tipShare ?? 0, 0, 1));
    },
  );
}

/**
 * Pays, records it, and leaves the room with an opinion of you. Called by the
 * settle command and, at a counter, by the order itself.
 */
function settle(sim: Simulation, visit: DiningVisit, tipShare: number): Bill & { tip: Money } {
  const place = placeOfVisit(sim, visit);
  const bill = billFor(sim, visit, tipShare);
  const accountId = visit.accountId ?? sim.player.primaryAccountId;
  if (!accountId) throw new CommandError('No account to pay with.');

  const outstanding = visit.service === 'counter' ? bill.total - visit.subtotal : bill.total;
  if (outstanding > 0) {
    if (sim.ledger.availableFunds(accountId) < outstanding) {
      throw new CommandError(`The bill is ${formatMoney(bill.total)} and you have ${formatMoney(sim.ledger.availableFunds(accountId))} available.`);
    }
    sim.expense(accountId, outstanding, place.name, 'dining', { refType: 'dining', refId: visit.id });
  }

  visit.serviceCharge = bill.serviceCharge;
  visit.tip = bill.tip;
  visit.total = bill.total;
  visit.status = 'settled';
  visit.settledAt = sim.now;

  const me = sim.player;
  const staff = [visit.hostId, visit.serverId].filter(Boolean) as Id[];
  for (const id of staff) {
    rememberFact(sim, id, { kind: 'meeting', aboutId: me.id, text: `${VISIT} on ${new Date(visit.arrivedAt).toISOString().slice(0, 10)}`, weight: 20, sourceKind: 'observed' });
  }
  if (visit.service === 'table') {
    if (tipShare >= GOOD_TIP) tallyFact(sim, visit.serverId, { kind: 'topic', aboutId: me.id, text: TIP_GOOD, step: TIP_STEP, sourceKind: 'observed' });
    else if (tipShare <= 0) tallyFact(sim, visit.serverId, { kind: 'topic', aboutId: me.id, text: TIP_NONE, step: TIP_STEP, sourceKind: 'observed' });
  }

  for (const id of visit.guestIds) {
    const relationship = Object.values(sim.universe.relationships).find((r) =>
      !r.endedAt && ((r.aId === me.id && r.bId === id) || (r.bId === me.id && r.aId === id)));
    if (!relationship) continue;
    relationship.dimensions.affection = clamp(relationship.dimensions.affection + 2.5, 0, 100);
    relationship.dimensions.familiarity = clamp(relationship.dimensions.familiarity + 1.5, 0, 100);
    relationship.dimensions.trust = clamp(relationship.dimensions.trust + 1, 0, 100);
    relationship.lastInteractionAt = sim.now;
  }

  sim.remember({
    category: 'life',
    title: `Ate at ${place.name}`,
    detail: `${CITIES.get(place.cityId)?.name}. ${formatMoney(bill.total)}. ${visit.items.map((i) => i.name).join(', ')}.`,
    refs: [{ type: 'person', id: me.id }],
    significance: visit.guestIds.length > 0 ? 12 : 4, public: false, amount: bill.total,
  });
  sim.emit('dine.settled', { visitId: visit.id, placeId: place.id, total: bill.total, tip: bill.tip });
  return bill;
}
