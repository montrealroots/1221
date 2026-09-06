/**
 * Buying a home, after the offer: the seller's answer, the inspection, the
 * appraisal, closing day, and moving in.
 *
 * The property system owns the mechanics (what an offer is, what closing
 * moves, what a room is worth). This system owns the asking: every point
 * where the purchase waits on you becomes a decision on Home with a scene
 * behind it, a short version that follows the same rules, and a clock
 * that runs out. A counter the seller does not hear back on is withdrawn.
 * An inspection contingency you say nothing about is waived. A closing
 * you do not come to costs you the deposit, because that is what the
 * contract says. Moving day is three days after the keys unless you go
 * straight there.
 *
 * Nothing here decides for you by the clock alone, except the things a
 * seller would decide for you.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_HOUR, MS_MINUTE, addDays, formatDate, formatTime } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { Id, Person, Property, PropertyListing, PropertyOffer, Room, Structure } from '../domain/model';
import { CATALOG } from '../content/catalog';
import { preview, speak } from '../dialogue/library';
import type { DialogueTone } from '../dialogue/schema';
import { makeBackgroundPerson, peopleOf } from './people';
import { rememberFact } from './memory';
import { amortisedPayment, offeredApr } from './finance';
import { activeScene } from './scenes';
import { agentOf, agentTone } from './viewings';
import {
  COUNTER_DAYS, DESIGN_THEMES, closeTransaction, closingCash, estimateMonthlyIncome, finishCost, finishRoom, buyFurnishing, furnishingPrice,
  moveIn, recomputeRoomQuality, refundEarnest, type ClosingOutcome, type FinishRoomSpec,
} from './property';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Days the inspection contingency stays open before silence waives it. */
export const INSPECTION_DAYS = 4;
/** Days the seller waits at the table before the deal is off and the deposit is theirs. */
export const CLOSING_LAPSE_DAYS = 3;
/** The one delay a seller allows, in days. */
export const POSTPONE_DAYS = 3;
/** Days after closing that moving day comes round. */
export const MOVING_DAY_DAYS = 3;
/** Days before closing the appraisal comes in. */
export const APPRAISAL_LEAD_DAYS = 7;

export const CALL_MINUTES = 10;
export const INSPECTION_MINUTES = 90;
export const CLOSING_MINUTES = 60;
export const ROOM_MINUTES = 20;

export const NOT_HERE = 'You are not in the city the house is in.';

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export function offerOf(sim: Simulation, offerId: Id): PropertyOffer {
  const offer = sim.universe.propertyOffers[offerId];
  if (!offer) throw new CommandError('There is no offer like that.');
  return offer;
}

export function propertyOfOffer(sim: Simulation, offer: PropertyOffer): Property {
  const property = sim.universe.properties[offer.propertyId];
  if (!property) throw new CommandError('That house is gone.');
  return property;
}

export function listingOfOffer(sim: Simulation, offer: PropertyOffer): PropertyListing | undefined {
  return sim.universe.propertyListings[offer.listingId];
}

export function agentOfOffer(sim: Simulation, offer: PropertyOffer): ReturnType<typeof agentOf> {
  const listing = listingOfOffer(sim, offer);
  if (listing) return agentOf(sim, listing);
  const agent = offer.agentId ? sim.universe.realEstateAgents[offer.agentId] : undefined;
  const person = agent ? sim.universe.people[agent.personId] : undefined;
  return agent && person ? { agent, person } : undefined;
}

/** Your open purchases: offered, countered, or accepted and heading for a table. */
export function openOffers(sim: Simulation): PropertyOffer[] {
  return Object.values(sim.universe.propertyOffers)
    .filter((o) => o.buyerId === sim.player.id && (o.status === 'submitted' || o.status === 'countered' || o.status === 'accepted'))
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

function inCity(sim: Simulation, offer: PropertyOffer): boolean {
  return sim.player.currentLocationId === propertyOfOffer(sim, offer).locationId;
}

/** The inspector who did the house: one per city, made the first time and remembered after. */
export function inspectorFor(sim: Simulation, offer: PropertyOffer): Person {
  const property = propertyOfOffer(sim, offer);
  const existing = peopleOf(sim, `inspector:${property.locationId}`)[0];
  if (existing) return existing;
  const rng = sim.rng('inspector', property.locationId);
  return makeBackgroundPerson(sim, {
    rng, archetype: `inspector:${property.locationId}`, industryRole: 'home_inspector', cityId: property.locationId,
    background: 'Inspects houses for people about to buy them, and has crawled under most of the city.',
    interests: ['houses', rng.pick(['woodwork', 'fishing', 'motorbikes', 'gardening'])],
    skills: { construction: rng.int(60, 92) },
    age: [36, 64],
    personality: { conscientiousness: rng.int(70, 95), extraversion: rng.int(30, 65), agreeableness: rng.int(45, 80) },
    lifestyle: 'modest',
  });
}

/** The escrow officer at the table: one per city. */
export function closerFor(sim: Simulation, offer: PropertyOffer): Person {
  const property = propertyOfOffer(sim, offer);
  const existing = peopleOf(sim, `escrow:${property.locationId}`)[0];
  if (existing) return existing;
  const rng = sim.rng('escrow', property.locationId);
  return makeBackgroundPerson(sim, {
    rng, archetype: `escrow:${property.locationId}`, industryRole: 'escrow_officer', cityId: property.locationId,
    background: 'Closes house purchases, and has seen every way one can fail to close.',
    interests: ['paperwork', rng.pick(['tennis', 'opera', 'baking', 'hiking'])],
    skills: { administration: rng.int(65, 95) },
    age: [30, 60],
    personality: { conscientiousness: rng.int(75, 98), extraversion: rng.int(35, 70), agreeableness: rng.int(40, 85) },
    lifestyle: 'comfortable',
  });
}

export function personTone(person: Person): DialogueTone {
  return agentTone(person);
}

export function findingsTotal(offer: PropertyOffer): Money {
  return (offer.inspectionFindings ?? []).reduce((sum, f) => sum + f.estimate, 0);
}

export function inspectionSignificant(offer: PropertyOffer): boolean {
  const findings = offer.inspectionFindings ?? [];
  return findings.some((f) => f.severity === 'major') || findingsTotal(offer) > offer.amount * 0.03;
}

export interface CounterChoice {
  id: string;
  label: string;
  amount: Money;
  detail: string;
  disabled?: string;
}

/** What you could say back to a counter, with the lender's refusal on any line the money will not carry. */
export function counterChoices(sim: Simulation, offer: PropertyOffer): CounterChoice[] {
  const theirs = offer.counterAmount ?? offer.amount;
  const yours = offer.amount;
  const diff = Math.max(0, theirs - yours);
  const round = (n: number) => Math.round(n / 1000_00) * 1000_00;
  const raw: { id: string; label: string; amount: Money; detail: string }[] = [
    { id: 'split', label: 'Split The Difference', amount: round(yours + diff / 2), detail: 'Halfway between the two numbers.' },
    { id: 'nudge', label: 'Come Up A Little', amount: round(yours + diff / 4), detail: 'A quarter of the way to them.' },
    { id: 'hold', label: 'Hold Your Number', amount: yours, detail: 'Say it again, politely.' },
  ];
  const seen = new Set<number>();
  const out: CounterChoice[] = [];
  for (const c of raw) {
    if (c.amount >= theirs || c.amount <= 0 || seen.has(c.amount)) continue;
    seen.add(c.amount);
    const down = offer.financingKind === 'cash' ? c.amount : Math.round(c.amount * 0.2);
    out.push({ ...c, disabled: refusalFor(sim, c.amount, offer, down) });
  }
  return out;
}

/** The lender's reason, if any, why accepting the counter as it stands would not carry. */
export function counterAcceptRefusal(sim: Simulation, offer: PropertyOffer): string | undefined {
  const amount = offer.counterAmount ?? offer.amount;
  return refusalFor(sim, amount, offer, offer.financingKind === 'cash' ? amount : Math.round(amount * 0.2));
}

function refusalFor(sim: Simulation, amount: Money, offer: PropertyOffer, down: Money): string | undefined {
  // The same rule the property system applies when the number is committed.
  const player = sim.player;
  const liquid = player.primaryAccountId
    ? sim.ledger.accountsOf(player.id).filter((a) => a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash').reduce((sum, a) => sum + a.balance, 0)
    : 0;
  const closingEstimate = Math.round(amount * 0.028);
  if (liquid < down + closingEstimate) return `You need about ${formatMoney(down + closingEstimate)} liquid for the deposit and closing costs. You have ${formatMoney(liquid)}.`;
  if (offer.financingKind !== 'cash') {
    const payment = amortisedPayment(amount - down, offeredApr(player.creditScore, 'mortgage'), 360);
    const income = estimateMonthlyIncome(sim, player.id);
    if (income > 0 && payment > income * 0.45) return `A lender will not approve this. The payment would be ${formatMoney(payment)} a month against income of about ${formatMoney(income)}.`;
  }
  return undefined;
}

export interface ReductionChoice {
  id: string;
  label: string;
  amount: Money;
  detail: string;
}

/** What you could ask off the price for the findings: all of it, most of it, or a round number. */
export function reductionChoices(offer: PropertyOffer): ReductionChoice[] {
  const total = findingsTotal(offer);
  if (total <= 0) return [];
  const round = (n: number) => Math.round(n / 500_00) * 500_00;
  const raw = [
    { id: 'all', label: 'Ask For All Of It', amount: offer.amount - round(total), detail: `${formatMoney(round(total))} off, the findings to the dollar.` },
    { id: 'most', label: 'Ask For Most Of It', amount: offer.amount - round(total * 0.6), detail: `${formatMoney(round(total * 0.6))} off. Easier to say yes to.` },
    { id: 'gesture', label: 'Ask For A Gesture', amount: offer.amount - round(total * 0.3), detail: `${formatMoney(round(total * 0.3))} off. A number that costs them nothing to agree to.` },
  ];
  const seen = new Set<number>();
  return raw.filter((c) => c.amount > 0 && c.amount < offer.amount && !seen.has(c.amount) && seen.add(c.amount));
}

export interface ClosingNumbers {
  price: Money;
  earnestPaid: Money;
  downPayment: Money;
  appraisalGap: Money;
  closingCosts: Money;
  cashToClose: Money;
  available: Money;
  shortfall: Money;
  financed: boolean;
  monthlyPayment?: Money;
  appraisal?: Money;
}

/** Page one of the closing folder, from the offer as it stands and the account as it is. */
export function closingNumbers(sim: Simulation, offer: PropertyOffer): ClosingNumbers {
  const { closingCosts, cashNeeded } = closingCash(offer);
  const accountId = sim.player.primaryAccountId;
  const available = accountId ? sim.ledger.availableFunds(accountId) : 0;
  const financed = offer.financingKind !== 'cash';
  const borrow = financed ? offer.amount - offer.downPayment - (offer.appraisalGap ?? 0) : 0;
  return {
    price: offer.amount,
    earnestPaid: offer.earnestMoney,
    downPayment: financed ? offer.downPayment : offer.amount,
    appraisalGap: offer.appraisalGap ?? 0,
    closingCosts,
    cashToClose: cashNeeded,
    available,
    shortfall: Math.max(0, cashNeeded - available),
    financed,
    monthlyPayment: financed ? amortisedPayment(borrow, offeredApr(sim.player.creditScore, 'mortgage'), 360) : undefined,
    appraisal: offer.appraisalValue,
  };
}

export function canPostpone(offer: PropertyOffer): boolean {
  return offer.status === 'accepted' && !offer.postponedOnce;
}

/** Whether closing can be sat at now: the day has come, the purchase is open, you are there. */
export function atTheTable(sim: Simulation, offer: PropertyOffer): { ok: boolean; reason?: string } {
  if (offer.status !== 'accepted') return { ok: false, reason: 'That purchase is not open to close.' };
  if (!offer.closingAt || sim.now < offer.closingAt - 12 * MS_HOUR) return { ok: false, reason: `Closing is set for ${formatDate(offer.closingAt ?? sim.now, sim.homeZone)}.` };
  if (!inCity(sim, offer)) return { ok: false, reason: NOT_HERE };
  return { ok: true };
}

/** Whether the inspection can be walked now: it has happened, it is open, you are there. */
export function inspectionWalkable(sim: Simulation, offer: PropertyOffer): { ok: boolean; reason?: string } {
  if (offer.status !== 'accepted') return { ok: false, reason: 'That purchase is not open.' };
  if (!offer.inspectionFindings) return { ok: false, reason: 'The inspection has not happened yet.' };
  if (offer.inspectionDecidedAt) return { ok: false, reason: 'The report has been answered; there is nothing left to walk.' };
  if (!inCity(sim, offer)) return { ok: false, reason: NOT_HERE };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Rooms: the interior a market home has, and what furnishing one costs
// ---------------------------------------------------------------------------

export function roomsFor(sim: Simulation, propertyId: Id): Room[] {
  const property = sim.universe.properties[propertyId];
  if (!property) return [];
  const rooms: Room[] = [];
  for (const structureId of property.structureIds) {
    const structure = sim.universe.structures[structureId];
    if (!structure) continue;
    for (const roomId of structure.roomIds) {
      const room = sim.universe.rooms[roomId];
      if (room) rooms.push(room);
    }
  }
  return rooms;
}

function conditionFinishes(condition: number): Room['finishes'] {
  if (condition >= 90) return { walls: 'Painted', floor: 'Oak', ceiling: 'Flat', lighting: 'Recessed' };
  if (condition >= 75) return { walls: 'Painted', floor: 'Oak', lighting: 'Pendant' };
  if (condition >= 60) return { walls: 'Painted', floor: 'Carpet' };
  return { walls: 'Painted' };
}

/**
 * A home from the market comes with the rooms the listing described, so the
 * place you live in has rooms to furnish. Built homes already have theirs;
 * land has none. Idempotent: a property with structures is left alone.
 */
export function ensureInterior(sim: Simulation, property: Property): void {
  if (property.structureIds.length > 0 || property.kind === 'land' || property.interiorSqft <= 0) return;
  const structure: Structure = {
    id: sim.nextId('prop'),
    saveId: sim.universe.meta.id,
    propertyId: property.id,
    kind: 'main_house',
    name: property.kind === 'apartment' || property.kind === 'condo' || property.kind === 'penthouse' ? 'The Apartment' : 'The House',
    floors: property.interiorSqft > 2200 ? 2 : 1,
    sqft: property.interiorSqft,
    condition: property.condition,
    roomIds: [],
    builtAt: sim.now - (sim.now - Date.UTC(property.yearBuilt, 0, 1)),
  };
  sim.universe.structures[structure.id] = structure;
  property.structureIds.push(structure.id);

  const bedrooms = clamp(property.bedrooms, 0, 6);
  const bathrooms = clamp(property.bathrooms, 1, 4);
  const layout: { kind: string; name: string; share: number }[] = [
    { kind: 'living', name: 'The Living Room', share: 0.22 },
    { kind: 'kitchen', name: 'The Kitchen', share: 0.13 },
  ];
  if (property.interiorSqft >= 1400) layout.push({ kind: 'dining', name: 'The Dining Room', share: 0.08 });
  if (bedrooms === 0) layout.push({ kind: 'bedroom', name: 'The Sleeping Corner', share: 0.16 });
  for (let i = 0; i < bedrooms; i++) layout.push({ kind: 'bedroom', name: i === 0 ? 'The Main Bedroom' : `Bedroom ${i + 1}`, share: i === 0 ? 0.14 : 0.09 });
  for (let i = 0; i < bathrooms; i++) layout.push({ kind: 'bathroom', name: i === 0 ? 'The Main Bathroom' : `Bathroom ${i + 1}`, share: 0.05 });
  if (bedrooms >= 3 && property.interiorSqft >= 1800) layout.push({ kind: 'office', name: 'The Office', share: 0.07 });
  if (property.interiorSqft >= 1200) layout.push({ kind: 'laundry', name: 'The Laundry', share: 0.03 });
  if (property.lotSqft > property.interiorSqft * 0.6) layout.push({ kind: 'outside', name: 'Outside', share: 0 });
  const totalShare = layout.reduce((s, r) => s + r.share, 0);
  const scale = totalShare > 0.95 ? 0.95 / totalShare : 1;

  const finishes = conditionFinishes(property.condition);
  for (const entry of layout) {
    const room: Room = {
      id: sim.nextId('room'),
      saveId: sim.universe.meta.id,
      structureId: structure.id,
      floor: 1,
      kind: entry.kind,
      name: entry.name,
      sqft: entry.kind === 'outside' ? Math.round(property.lotSqft * 0.5) : Math.max(40, Math.round(property.interiorSqft * entry.share * scale)),
      finishes: entry.kind === 'outside' ? {} : { ...finishes },
      zoneIds: [],
      quality: 0,
    };
    sim.universe.rooms[room.id] = room;
    structure.roomIds.push(room.id);
    recomputeRoomQuality(sim, room.id);
  }
}

/** Every home somebody lives in, or the player owns, gets its interior. Safe to run on every load. */
export function ensureInteriors(sim: Simulation): void {
  const lived = new Set<Id>();
  for (const person of Object.values(sim.universe.people)) if (person.residenceId) lived.add(person.residenceId);
  for (const property of Object.values(sim.universe.properties)) {
    if (lived.has(property.id) || property.ownerId === sim.player.id) ensureInterior(sim, property);
  }
}

export type FurnishLevel = 'bare' | 'comfortable' | 'proper';

export const FURNISH_LEVELS: readonly { id: FurnishLevel; label: string; detail: string }[] = [
  { id: 'bare', label: 'Leave It Bare', detail: 'Nothing today. The room waits.' },
  { id: 'comfortable', label: 'Make It Comfortable', detail: 'The pieces you need to live in it.' },
  { id: 'proper', label: 'Do It Properly', detail: 'The good pieces, the rug, the lamp. The room you would show someone.' },
];

const SETS: Readonly<Record<string, { comfortable: string[]; proper: string[] }>> = {
  living: { comfortable: ['sofa_basic', 'coffee_table', 'floor_lamp', 'art_print'], proper: ['sofa_designer', 'rug_persian', 'coffee_table', 'floor_lamp', 'bookcase', 'tv_oled', 'curtains'] },
  kitchen: { comfortable: ['fridge_std', 'cookware_set', 'bar_stools'], proper: ['range_pro', 'fridge_std', 'dishwasher', 'cookware_set', 'bar_stools', 'pendant_light'] },
  dining: { comfortable: ['dining_table', 'pendant_light'], proper: ['dining_table', 'sideboard', 'pendant_light', 'rug_persian'] },
  bedroom: { comfortable: ['bed_queen', 'bedside_pair', 'wardrobe'], proper: ['bed_king_lux', 'bedside_pair', 'wardrobe', 'curtains', 'rug_persian', 'armchair'] },
  bathroom: { comfortable: ['bath_set'], proper: ['bath_set', 'vanity_mirror', 'heated_rail'] },
  office: { comfortable: ['desk_work', 'office_chair'], proper: ['desk_work', 'office_chair', 'bookcase', 'floor_lamp', 'rug_persian'] },
  laundry: { comfortable: ['washer_dryer'], proper: ['washer_dryer', 'storage_cabinets'] },
  foyer: { comfortable: ['floor_lamp'], proper: ['sideboard', 'pendant_light', 'art_print'] },
  outside: { comfortable: ['outdoor_set'], proper: ['outdoor_set'] },
  den: { comfortable: ['armchair', 'floor_lamp'], proper: ['sofa_designer', 'tv_oled', 'rug_persian'] },
  theater: { comfortable: ['sofa_basic', 'tv_oled'], proper: ['sofa_designer', 'projector_cinema', 'rug_persian'] },
};

export interface FurnishPlan {
  level: FurnishLevel;
  items: { catalogId: string; name: string; price: Money }[];
  finish?: FinishRoomSpec;
  finishCost: Money;
  cost: Money;
  projectedQuality: number;
}

/** What furnishing a room to a level would buy and cost, and roughly where the room would land. */
export function furnishPlan(sim: Simulation, room: Room, level: FurnishLevel, themeId?: string): FurnishPlan {
  const structure = sim.universe.structures[room.structureId];
  const property = structure ? sim.universe.properties[structure.propertyId] : undefined;
  if (!property) throw new CommandError('That room is not attached to a property.');
  const set = SETS[room.kind] ?? SETS['den']!;
  const already = new Set(Object.values(sim.universe.furnishings).filter((f) => f.roomId === room.id).map((f) => f.catalogId));
  const ids = level === 'bare' ? [] : set[level].filter((id) => !already.has(id) && CATALOG.get(id));
  const items = ids.map((id) => ({ catalogId: id, name: CATALOG.require(id).name, price: furnishingPrice(sim, id, property.id) }));
  const theme = themeId ? DESIGN_THEMES.find((t) => t.id === themeId) : undefined;
  let finish: FinishRoomSpec | undefined;
  if (level !== 'bare' && room.kind !== 'outside') {
    const spec: FinishRoomSpec = { roomId: room.id, themeId: theme?.id };
    if (!room.finishes.walls || theme) spec.walls = 'Painted';
    if (level === 'proper') {
      spec.floor = theme?.id === 'industrial' ? 'Polished Concrete' : theme?.id === 'coastal' ? 'Whitewashed Boards' : 'Oak';
      spec.lighting = 'Warm';
    }
    finish = spec;
  }
  const finishPrice = finish ? finishCost(sim, finish) : 0;
  const coherence = theme?.coherenceBonus ?? 1;
  const gain = ids.reduce((s, id) => s + (CATALOG.require(id).qualityContribution ?? 0) * coherence, 0);
  const finishGain = finish ? [finish.walls, finish.floor, finish.ceiling, finish.lighting].filter((f, i) => f && !Object.values(room.finishes)[i]).length * 9 : 0;
  return {
    level, items, finish, finishCost: finishPrice,
    cost: items.reduce((s, i) => s + i.price, 0) + finishPrice,
    projectedQuality: clamp(Math.round(room.quality + gain + finishGain), 0, 100),
  };
}

/** Whether a property's rooms can be furnished by the player now. */
export function furnishable(sim: Simulation, propertyId: Id): { ok: boolean; reason?: string } {
  const property = sim.universe.properties[propertyId];
  if (!property) return { ok: false, reason: 'There is no home like that.' };
  const yours = property.ownerId === sim.player.id || sim.player.residenceId === property.id;
  if (!yours) return { ok: false, reason: 'That is not your home to furnish.' };
  if (sim.player.currentLocationId !== property.locationId) return { ok: false, reason: NOT_HERE };
  if (roomsFor(sim, property.id).length === 0) return { ok: false, reason: 'There are no rooms to furnish.' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function cancelKind(sim: Simulation, kind: string, refId: Id): void {
  for (const item of sim.timeline.pending()) {
    if (item.kind === kind && item.refId === refId) sim.timeline.cancel(item.id, sim.now);
  }
}

function sceneOn(sim: Simulation, refType: string, refId: Id): boolean {
  const scene = activeScene(sim);
  return Boolean(scene && scene.refType === refType && scene.refId === refId);
}

export function registerPurchase(sim: Simulation): void {
  // --- The seller came back --------------------------------------------------------

  sim.onEvent('prop.offer_countered', 'purchase.counter', (event, { sim: s }) => {
    const { offerId, counterAmount } = event.payload as { offerId: Id; counterAmount: Money };
    const offer = s.universe.propertyOffers[offerId];
    if (!offer || offer.status !== 'countered') return;
    const property = propertyOfOffer(s, offer);
    const who = agentOfOffer(s, offer);
    s.requireDecision({
      urgency: 78, category: 'property',
      title: `Counteroffer On ${property.addressLine}`,
      detail: `${who ? `${who.person.firstName} called. ` : ''}They came back at ${formatMoney(counterAmount)}; you offered ${formatMoney(offer.amount)}. They will wait ${COUNTER_DAYS} days.`,
      route: '/workspace/property',
      actions: [
        { label: 'Take The Call', commandKind: 'scene.start', payload: { definitionId: 'property.counter', input: { offerId: offer.id }, refType: 'offer', refId: offer.id } },
        { label: 'Accept The Counter', commandKind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: true } },
        { label: 'Walk Away', commandKind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: false } },
      ],
      dueAt: offer.respondBy,
      refType: 'offer', refId: offer.id,
    });
    s.schedule({
      at: offer.respondBy, kind: 'prop.counter_lapse', label: `Counter On ${property.addressLine} Lapses`, category: 'system',
      payload: { offerId: offer.id }, priority: 80, refType: 'offer', refId: offer.id,
    });
  });

  sim.onSchedule('prop.counter_lapse', (item) => {
    const offer = sim.universe.propertyOffers[item.payload['offerId'] as Id];
    if (!offer || offer.status !== 'countered') return;
    if (sceneOn(sim, 'offer', offer.id)) {
      sim.schedule({ at: sim.now + 2 * MS_HOUR, kind: 'prop.counter_lapse', label: item.label, category: 'system', payload: { offerId: offer.id }, priority: 80, refType: 'offer', refId: offer.id });
      return;
    }
    const property = propertyOfOffer(sim, offer);
    offer.status = 'rejected';
    offer.history.push({ at: sim.now, note: 'The seller stopped waiting for an answer to the counter.' });
    refundEarnest(sim, offer);
    const listing = listingOfOffer(sim, offer);
    if (listing && listing.status === 'pending') listing.status = 'active';
    sim.resolveDecision('offer', offer.id);
    sim.notify({
      category: 'property', title: `They Stopped Waiting On ${property.addressLine}`,
      body: `You never answered the counter at ${formatMoney(offer.counterAmount ?? offer.amount)}. The seller has moved on and your deposit is back.`,
      importance: 55, route: '/workspace/property', refType: 'offer', refId: offer.id,
    });
    sim.emit('prop.counter_lapsed', { offerId: offer.id });
  });

  sim.onEvent('prop.counter_answered', 'purchase.counter_answered', (event, { sim: s }) => {
    const { offerId } = event.payload as { offerId: Id };
    s.resolveDecision('offer', offerId);
    cancelKind(s, 'prop.counter_lapse', offerId);
  });

  // --- Accepted: the appraisal comes a week before the table ------------------------------

  sim.onEvent('prop.offer_accepted', 'purchase.appraisal', (event, { sim: s }) => {
    const { offerId, closingAt } = event.payload as { offerId: Id; closingAt: number };
    const offer = s.universe.propertyOffers[offerId];
    if (!offer || offer.financingKind === 'cash' || !offer.contingencies.includes('appraisal')) return;
    const property = propertyOfOffer(s, offer);
    s.schedule({
      at: Math.max(s.now + MS_HOUR, closingAt - APPRAISAL_LEAD_DAYS * 24 * MS_HOUR), kind: 'prop.appraisal', label: `Appraisal — ${property.addressLine}`, category: 'property',
      payload: { offerId: offer.id }, priority: 45, refType: 'offer', refId: offer.id,
    });
  });

  sim.onSchedule('prop.appraisal', (item) => {
    const offer = sim.universe.propertyOffers[item.payload['offerId'] as Id];
    if (!offer || offer.status !== 'accepted') return;
    const property = propertyOfOffer(sim, offer);
    const rng = sim.rng('appraisal', offer.id);
    const appraisal = Math.round(property.marketValue * rng.float(0.93, 1.06));
    offer.appraisalValue = appraisal;
    if (appraisal >= offer.amount * 0.97) {
      offer.history.push({ at: sim.now, note: `Appraisal came in at ${formatMoney(appraisal)}. The lender is satisfied.` });
      sim.emit('prop.appraised', { offerId: offer.id, appraisal, gap: 0 });
      return;
    }
    const gap = offer.amount - appraisal;
    const accountId = sim.player.primaryAccountId;
    const canCover = accountId ? sim.ledger.availableFunds(accountId) >= offer.downPayment + gap : false;
    if (!canCover) {
      offer.status = 'withdrawn';
      offer.history.push({ at: sim.now, note: `Appraisal came in at ${formatMoney(appraisal)}, ${formatMoney(gap)} under the price, and you could not cover the gap.` });
      refundEarnest(sim, offer);
      const listing = listingOfOffer(sim, offer);
      if (listing) listing.status = 'active';
      sim.timeline.cancelFor('offer', offer.id, sim.now);
      sim.resolveDecision('offer', offer.id);
      sim.notify({
        category: 'property', title: 'Purchase Fell Through',
        body: `The appraisal on ${property.addressLine} came in ${formatMoney(gap)} low and you could not cover the gap. Your deposit has been returned.`,
        importance: 85, route: '/workspace/property', refType: 'offer', refId: offer.id,
      });
      sim.emit('prop.closing_failed', { offerId: offer.id, reason: 'appraisal_gap', gap });
      return;
    }
    offer.appraisalGap = gap;
    offer.history.push({ at: sim.now, note: `Appraisal came in at ${formatMoney(appraisal)}, ${formatMoney(gap)} under the price. The lender will only finance to the appraised value; you bring the gap to the table.` });
    sim.notify({
      category: 'property', title: `Appraisal Short On ${property.addressLine}`,
      body: `${formatMoney(appraisal)} against a price of ${formatMoney(offer.amount)}. You will need ${formatMoney(gap)} more at closing.`,
      importance: 60, route: '/workspace/property', refType: 'offer', refId: offer.id,
    });
    sim.emit('prop.appraised', { offerId: offer.id, appraisal, gap });
  });

  // --- The inspection: findings, and four days to answer them ------------------------------

  sim.onEvent('prop.inspection_complete', 'purchase.inspection', (event, { sim: s }) => {
    const { offerId, total, significant } = event.payload as { offerId: Id; total: Money; significant: boolean };
    const offer = s.universe.propertyOffers[offerId];
    if (!offer || offer.status !== 'accepted') return;
    const property = propertyOfOffer(s, offer);
    const count = offer.inspectionFindings?.length ?? 0;
    const here = s.player.currentLocationId === property.locationId;
    const actions = [
      ...(here ? [{ label: 'Walk It With The Inspector', commandKind: 'scene.start', payload: { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id } }] : []),
      { label: 'Read The Report', commandKind: 'scene.quick', payload: { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id } },
      { label: 'Proceed Anyway', commandKind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: true } },
      ...(significant ? [{ label: 'Walk Away', commandKind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: false } }] : []),
    ];
    s.requireDecision({
      urgency: significant ? 82 : 45, category: 'property',
      title: significant ? `Inspection Findings On ${property.addressLine}` : `Inspection Report On ${property.addressLine}`,
      detail: count === 0
        ? 'A clean report. Nothing to fix, nothing to ask for.'
        : `${count} item${count === 1 ? '' : 's'}, roughly ${formatMoney(total)} of work. ${significant ? 'You can proceed, ask for money off, or walk away with your deposit.' : 'Small things. You can proceed, or ask for a gesture.'} Silence for ${INSPECTION_DAYS} days is a yes.`,
      route: '/workspace/property',
      actions,
      dueAt: addDays(s.now, INSPECTION_DAYS, s.homeZone),
      refType: 'offer', refId: offer.id,
    });
    s.schedule({
      at: addDays(s.now, INSPECTION_DAYS, s.homeZone), kind: 'prop.inspection_lapse', label: `Inspection Contingency On ${property.addressLine} Ends`, category: 'system',
      payload: { offerId: offer.id }, priority: 80, refType: 'offer', refId: offer.id,
    });
  });

  sim.onSchedule('prop.inspection_lapse', (item) => {
    const offer = sim.universe.propertyOffers[item.payload['offerId'] as Id];
    if (!offer || offer.status !== 'accepted' || offer.inspectionDecidedAt) return;
    if (sceneOn(sim, 'offer', offer.id)) {
      sim.schedule({ at: sim.now + 2 * MS_HOUR, kind: 'prop.inspection_lapse', label: item.label, category: 'system', payload: { offerId: offer.id }, priority: 80, refType: 'offer', refId: offer.id });
      return;
    }
    const property = propertyOfOffer(sim, offer);
    offer.inspectionDecidedAt = sim.now;
    offer.history.push({ at: sim.now, note: 'The inspection contingency passed without a word. You are proceeding at the agreed price.' });
    sim.resolveDecision('offer', offer.id);
    sim.notify({
      category: 'property', title: `Inspection Contingency Waived On ${property.addressLine}`,
      body: `You said nothing for ${INSPECTION_DAYS} days, so the findings are yours. Closing is still ${formatDate(offer.closingAt ?? sim.now, sim.homeZone)}.`,
      importance: 50, route: '/workspace/property', refType: 'offer', refId: offer.id,
    });
    sim.emit('prop.inspection_waived', { offerId: offer.id });
  });

  sim.onEvent('prop.inspection_decided', 'purchase.inspection_decided', (event, { sim: s }) => {
    const { offerId } = event.payload as { offerId: Id };
    s.resolveDecision('offer', offerId);
    cancelKind(s, 'prop.inspection_lapse', offerId);
  });

  sim.onCommand<{ offerId: Id; here: boolean }, { inspector: string; minutes: number; count: number }>(
    'prop.inspection_walk',
    (p, { sim: s }) => {
      const offer = offerOf(s, p.offerId);
      if (offer.status !== 'accepted' || !offer.inspectionFindings) throw new CommandError('There is no inspection to walk.');
      const property = propertyOfOffer(s, offer);
      const inspector = inspectorFor(s, offer);
      const here = p.here && s.player.currentLocationId === property.locationId;
      const minutes = here ? INSPECTION_MINUTES : 15;
      s.advanceTo(s.now + minutes * MS_MINUTE);
      if (here) {
        rememberFact(s, inspector.id, { kind: 'meeting', aboutId: s.player.id, text: `Walked ${s.player.firstName} through the report on ${property.addressLine}.`, weight: 30, sourceKind: 'inspection', refType: 'offer', refId: offer.id, expiresAt: addDays(s.now, 365, s.homeZone) });
      }
      return { inspector: inspector.displayName, minutes, count: offer.inspectionFindings.length };
    },
  );

  // --- Closing day ------------------------------------------------------------------------

  sim.onEvent('prop.closing_due', 'purchase.closing', (event, { sim: s }) => {
    const { offerId } = event.payload as { offerId: Id };
    const offer = s.universe.propertyOffers[offerId];
    if (!offer || offer.status !== 'accepted') return;
    const property = propertyOfOffer(s, offer);
    const numbers = closingNumbers(s, offer);
    const here = s.player.currentLocationId === property.locationId;
    s.requireDecision({
      urgency: 90, category: 'property',
      title: `Closing On ${property.addressLine}`,
      detail: `${formatMoney(numbers.cashToClose)} to close${numbers.shortfall > 0 ? `; you are ${formatMoney(numbers.shortfall)} short` : ''}. ${here ? 'The table is set.' : 'You are out of town; you can sign remotely.'} The seller waits ${CLOSING_LAPSE_DAYS} days, and the deposit is theirs if you do not close.`,
      route: '/workspace/property',
      actions: [
        ...(here ? [{ label: 'Sit At The Table', commandKind: 'scene.start', payload: { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id } }] : []),
        { label: 'Sign Remotely', commandKind: 'prop.close', payload: { offerId: offer.id } },
        ...(canPostpone(offer) ? [{ label: `Ask For ${POSTPONE_DAYS} More Days`, commandKind: 'prop.postpone_closing', payload: { offerId: offer.id } }] : []),
      ],
      dueAt: addDays(s.now, CLOSING_LAPSE_DAYS, s.homeZone),
      refType: 'offer', refId: offer.id,
    });
    s.schedule({
      at: addDays(s.now, CLOSING_LAPSE_DAYS, s.homeZone), kind: 'prop.closing_lapse', label: `Seller Walks From ${property.addressLine}`, category: 'system',
      payload: { offerId: offer.id }, priority: 80, refType: 'offer', refId: offer.id,
    });
  });

  sim.onSchedule('prop.closing_lapse', (item) => {
    const offer = sim.universe.propertyOffers[item.payload['offerId'] as Id];
    if (!offer || offer.status !== 'accepted') return;
    if (sceneOn(sim, 'offer', offer.id)) {
      sim.schedule({ at: sim.now + 2 * MS_HOUR, kind: 'prop.closing_lapse', label: item.label, category: 'system', payload: { offerId: offer.id }, priority: 80, refType: 'offer', refId: offer.id });
      return;
    }
    forfeit(sim, offer, 'You never came to the table.');
  });

  sim.onCommand<{ offerId: Id }, ClosingOutcome>(
    'prop.close',
    (p, { sim: s }) => {
      const offer = offerOf(s, p.offerId);
      if (offer.status !== 'accepted') throw new CommandError('That purchase is not open to close.');
      if (!offer.closingAt || s.now < offer.closingAt - 12 * MS_HOUR) throw new CommandError(`Closing is set for ${formatDate(offer.closingAt ?? s.now, s.homeZone)}. The table is not ready before then.`);
      const property = propertyOfOffer(s, offer);
      const here = s.player.currentLocationId === property.locationId;
      s.advanceTo(s.now + (here ? CLOSING_MINUTES : 20) * MS_MINUTE);
      const outcome = closeTransaction(s, offer.id);
      s.resolveDecision('offer', offer.id);
      cancelKind(s, 'prop.closing_lapse', offer.id);
      if (outcome.closed) {
        const closer = closerFor(s, offer);
        if (here) rememberFact(s, closer.id, { kind: 'meeting', aboutId: s.player.id, text: `Closed ${property.addressLine} for ${s.player.firstName}.`, weight: 30, sourceKind: 'closing', refType: 'offer', refId: offer.id, expiresAt: addDays(s.now, 365, s.homeZone) });
        const who = agentOfOffer(s, offer);
        if (who) rememberFact(s, who.person.id, { kind: 'event', aboutId: s.player.id, text: `Sold ${s.player.firstName} ${property.addressLine} for ${formatMoney(offer.amount)}.`, weight: 45, sourceKind: 'closing', refType: 'property', refId: property.id, expiresAt: addDays(s.now, 730, s.homeZone) });
        if (s.player.residenceId !== property.id) {
          s.schedule({
            at: addDays(s.now, MOVING_DAY_DAYS, s.homeZone), kind: 'prop.moving_day', label: `Moving Day — ${property.addressLine}`, category: 'property',
            payload: { propertyId: property.id }, priority: 50, refType: 'property', refId: property.id, requiresPlayer: true, locationId: property.locationId, durationMinutes: 240,
          });
        }
      }
      return outcome;
    },
  );

  sim.onCommand<{ offerId: Id }, { closingAt: number }>(
    'prop.postpone_closing',
    (p, { sim: s }) => {
      const offer = offerOf(s, p.offerId);
      if (!canPostpone(offer)) throw new CommandError(offer.status === 'accepted' ? 'The seller has already waited once.' : 'That purchase is not open.');
      const property = propertyOfOffer(s, offer);
      offer.postponedOnce = true;
      const closingAt = addDays(s.now, POSTPONE_DAYS, s.homeZone);
      offer.closingAt = closingAt;
      offer.history.push({ at: s.now, note: `You asked for ${POSTPONE_DAYS} more days. Closing is now ${formatDate(closingAt, s.homeZone)}.` });
      s.resolveDecision('offer', offer.id);
      cancelKind(s, 'prop.closing_lapse', offer.id);
      cancelKind(s, 'prop.closing', offer.id);
      s.schedule({
        at: closingAt, kind: 'prop.closing', label: `Closing — ${property.addressLine}`, category: 'property',
        payload: { offerId: offer.id }, priority: 20, refType: 'offer', refId: offer.id, requiresPlayer: true, locationId: property.locationId, durationMinutes: 120,
      });
      s.emit('prop.closing_postponed', { offerId: offer.id, closingAt });
      return { closingAt };
    },
  );

  sim.onCommand<{ offerId: Id }, { forfeited: Money }>(
    'prop.walk_from_closing',
    (p, { sim: s }) => {
      const offer = offerOf(s, p.offerId);
      if (offer.status !== 'accepted') throw new CommandError('That purchase is not open.');
      forfeit(s, offer, 'You walked away at the table.');
      return { forfeited: offer.earnestMoney };
    },
  );

  // --- Moving in, and the rooms --------------------------------------------------------------

  sim.onEvent('property.purchased', 'interiors.ensure', (event, { sim: s }) => {
    const { propertyId } = event.payload as { propertyId: Id };
    const property = s.universe.properties[propertyId];
    if (property) ensureInterior(s, property);
  }, 45);

  sim.onEvent('prop.moved_in', 'interiors.ensure_home', (event, { sim: s }) => {
    const { propertyId } = event.payload as { propertyId: Id };
    const property = s.universe.properties[propertyId];
    if (property) ensureInterior(s, property);
    cancelKind(s, 'prop.moving_day', propertyId);
    s.resolveDecision('property', propertyId);
  });

  sim.onSchedule('prop.moving_day', (item) => {
    const property = sim.universe.properties[item.payload['propertyId'] as Id];
    if (!property || property.ownerId !== sim.player.id || sim.player.residenceId === property.id) return;
    const here = sim.player.currentLocationId === property.locationId;
    sim.requireDecision({
      urgency: 60, category: 'property',
      title: `Moving Day At ${property.addressLine}`,
      detail: here ? 'The keys are in your pocket and the rooms are empty. Go and make it yours, or just move the boxes.' : 'The keys are in your pocket. You are out of town; the rooms will wait.',
      route: '/workspace/property',
      actions: [
        ...(here ? [{ label: 'Play It Out', commandKind: 'scene.start', payload: { definitionId: 'property.movein', input: { propertyId: property.id }, refType: 'property', refId: property.id } }] : []),
        { label: 'Just Move In', commandKind: 'prop.move_in', payload: { propertyId: property.id } },
      ],
      refType: 'property', refId: property.id,
    });
    sim.emit('prop.moving_day_due', { propertyId: property.id });
  });

  sim.onCommand<{ propertyId: Id }, { propertyId: Id; endedLease: boolean }>(
    'prop.move_in',
    (p, { sim: s }) => {
      const property = s.universe.properties[p.propertyId];
      if (!property) throw new CommandError('There is no home like that.');
      if (property.ownerId !== s.player.id && property.tenure !== 'rented') throw new CommandError('That is not yours to move into.');
      if (s.player.residenceId === property.id) throw new CommandError('You already live there.');
      const previous = s.player.residenceId ? s.universe.properties[s.player.residenceId] : undefined;
      let endedLease = false;
      if (previous && previous.tenure === 'rented' && previous.ownerId !== s.player.id) {
        for (const bill of Object.values(s.universe.bills)) {
          if (bill.active && bill.refType === 'property' && bill.refId === previous.id && bill.payerId === s.player.id) {
            bill.active = false;
            bill.endsAt = s.now;
            s.timeline.cancelFor('bill', bill.id, s.now);
            endedLease = true;
          }
        }
        previous.isPrimaryResidence = false;
        previous.leaseEndsAt = s.now;
      }
      s.advanceTo(s.now + 2 * MS_HOUR);
      moveIn(s, s.player.id, property.id);
      s.remember({
        category: 'property', title: `Moved Into ${property.addressLine}`,
        detail: `${endedLease ? 'Handed back the keys to the old place. ' : ''}${roomsFor(s, property.id).length} rooms, most of them empty.`,
        refs: [{ type: 'property', id: property.id }], significance: 60, public: false,
      });
      return { propertyId: property.id, endedLease };
    },
  );

  sim.onCommand<{ roomId: Id; level: FurnishLevel; themeId?: string }, { cost: Money; quality: number; bought: string[]; minutes: number }>(
    'prop.furnish_room',
    (p, { sim: s }) => {
      const room = s.universe.rooms[p.roomId];
      if (!room) throw new CommandError('There is no room like that.');
      const structure = s.universe.structures[room.structureId];
      const property = structure ? s.universe.properties[structure.propertyId] : undefined;
      if (!property) throw new CommandError('That room is not attached to a property.');
      const can = furnishable(s, property.id);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      if (!FURNISH_LEVELS.some((l) => l.id === p.level)) throw new CommandError('That is not a way to furnish a room.');
      if (p.themeId && !DESIGN_THEMES.some((t) => t.id === p.themeId)) throw new CommandError('That is not a theme SLATE knows.');
      const plan = furnishPlan(s, room, p.level, p.themeId);
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (plan.cost > s.ledger.availableFunds(accountId)) {
        throw new CommandError(`Doing ${room.name} that way costs ${formatMoney(plan.cost)}. You have ${formatMoney(s.ledger.availableFunds(accountId))}.`);
      }
      s.advanceTo(s.now + ROOM_MINUTES * MS_MINUTE);
      if (plan.finish) finishRoom(s, plan.finish);
      const bought: string[] = [];
      for (const item of plan.items) {
        buyFurnishing(s, { catalogId: item.catalogId, roomId: room.id, propertyId: property.id });
        bought.push(item.name);
      }
      recomputeRoomQuality(s, room.id);
      s.emit('prop.room_furnished', { roomId: room.id, propertyId: property.id, level: p.level, cost: plan.cost, quality: room.quality });
      return { cost: plan.cost, quality: room.quality, bought, minutes: ROOM_MINUTES };
    },
  );
}

/** The seller keeps the deposit and the house goes back on the market. */
function forfeit(sim: Simulation, offer: PropertyOffer, why: string): void {
  const property = propertyOfOffer(sim, offer);
  offer.status = 'withdrawn';
  offer.history.push({ at: sim.now, note: `${why} The deposit of ${formatMoney(offer.earnestMoney)} stays with the seller.` });
  const listing = listingOfOffer(sim, offer);
  if (listing) listing.status = 'active';
  sim.timeline.cancelFor('offer', offer.id, sim.now);
  sim.resolveDecision('offer', offer.id);
  sim.notify({
    category: 'property', title: `Deal Off On ${property.addressLine}`,
    body: `${why} The seller keeps your ${formatMoney(offer.earnestMoney)} deposit, as the contract said.`,
    importance: 80, route: '/workspace/property', refType: 'offer', refId: offer.id,
  });
  sim.remember({
    category: 'property', title: `Lost The Deposit On ${property.addressLine}`,
    detail: `${why} ${formatMoney(offer.earnestMoney)} gone.`,
    refs: [{ type: 'property', id: property.id }], significance: 55, public: false, amount: offer.earnestMoney,
  });
  sim.emit('prop.closing_failed', { offerId: offer.id, reason: 'buyer_walked' });
}

/** What the audience of one, the closer, says when the numbers are read. Used by the scene. */
export function closerSays(sim: Simulation, offer: PropertyOffer, result: 'open' | 'signed' | 'postponed' | 'walked' | 'failed', salt: string, record = false): string {
  const closer = closerFor(sim, offer);
  const numbers = closingNumbers(sim, offer);
  const flags = [
    ...(result === 'open' && numbers.shortfall > 0 ? ['short'] : []),
    ...(result === 'signed' ? [numbers.financed ? 'financed' : 'cash'] : []),
  ];
  const ctx = { result, flags, tone: personTone(closer), vars: { first: closer.firstName, shortfall: formatMoney(numbers.shortfall) } };
  const query = { section: 'property', purpose: 'closing', beat: 'table' };
  return (record ? speak(sim, query, ctx, `${offer.id}:${salt}`) : preview(sim, query, ctx, `${offer.id}:${salt}`)).text;
}

export function whenIsClosing(sim: Simulation, offer: PropertyOffer): string {
  return offer.closingAt ? `${formatDate(offer.closingAt, sim.homeZone)} at ${formatTime(offer.closingAt, sim.homeZone)}` : 'not set';
}
