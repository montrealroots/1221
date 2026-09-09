/**
 * SLATE — viewings: walking through a house before you offer on it.
 *
 * A showing is booked on the calendar by the property system; this is what
 * happens when it comes round. It asks — play it, look around, skip it —
 * and left alone it is a no-show the agent remembers. Played, it is the
 * walk over, the agent at the door, the rooms one by one with what their
 * condition shows, the questions an agent would actually answer, and an
 * offer or a polite goodbye. The offer itself is the property system's:
 * the same command, the same lender, the same earnest money.
 *
 * Houses on the market have no rooms in the save until they are yours, so
 * the walk is built from what the listing knows: bedrooms, bathrooms, the
 * lot, the condition, the year, the features.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { MS_DAY, MS_MINUTE, formatTime } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { Id, Person, Property, PropertyListing, PropertyOffer, RealEstateAgent } from '../domain/model';
import { NEIGHBOURHOODS } from '../content/geography';
import { speak } from '../dialogue/library';
import type { DialogueTone } from '../dialogue/schema';
import { rememberFact, factsOf } from './memory';
import { ensureAgents, offerRefusal } from './property';
import { activeScene } from './scenes';

export const TRAVEL_MINUTES = 25;
export const LOOK_MINUTES = 8;
export const LAPSE_MINUTES = 90;
export const EARLY_MINUTES = 60;
export const NOT_HERE = 'You aren’t in the city the house is in.';

export interface ViewingRoom {
  id: string;
  name: string;
  kind: 'kitchen' | 'living' | 'bedroom' | 'bathroom' | 'outside';
}

export const QUESTIONS: readonly { id: string; label: string; aliases: string[] }[] = [
  { id: 'market', label: 'How Long Has It Been Listed?', aliases: ['how long', 'listed', 'market'] },
  { id: 'why', label: 'Why Are They Selling?', aliases: ['why', 'selling', 'seller'] },
  { id: 'offers', label: 'Any Other Offers?', aliases: ['offers', 'other offers', 'competition'] },
  { id: 'area', label: 'What Is The Area Like?', aliases: ['area', 'neighbourhood', 'street'] },
  { id: 'price', label: 'What Would They Take?', aliases: ['price', 'take', 'number'] },
];

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export function listingOf(sim: Simulation, listingId: Id): PropertyListing {
  const listing = sim.universe.propertyListings[listingId];
  if (!listing) throw new CommandError('That listing is gone.');
  return listing;
}

export function propertyOf(sim: Simulation, listing: PropertyListing): Property {
  const property = sim.universe.properties[listing.propertyId];
  if (!property) throw new CommandError('That house is gone.');
  return property;
}

/** The rooms you would be shown, from what the listing knows. */
export function roomsOf(property: Property): ViewingRoom[] {
  const rooms: ViewingRoom[] = [
    { id: 'living', name: 'The Living Room', kind: 'living' },
    { id: 'kitchen', name: 'The Kitchen', kind: 'kitchen' },
  ];
  for (let i = 0; i < Math.max(1, Math.min(property.bedrooms, 4)); i++) {
    rooms.push({ id: `bedroom${i + 1}`, name: i === 0 ? 'The Main Bedroom' : `Bedroom ${i + 1}`, kind: 'bedroom' });
  }
  rooms.push({ id: 'bathroom', name: property.bathrooms > 1 ? 'The Bathrooms' : 'The Bathroom', kind: 'bathroom' });
  if (property.lotSqft > property.interiorSqft * 0.6) rooms.push({ id: 'outside', name: 'Outside', kind: 'outside' });
  return rooms;
}

export function conditionBand(property: Property): 'worn' | 'fair' | 'good' | 'excellent' {
  return property.condition >= 90 ? 'excellent' : property.condition >= 75 ? 'good' : property.condition >= 60 ? 'fair' : 'worn';
}

/** The agent on the listing, or the first in the city. Reads only. */
export function agentOf(sim: Simulation, listing: PropertyListing): { agent: RealEstateAgent; person: Person } | undefined {
  const agent = (listing.agentId ? sim.universe.realEstateAgents[listing.agentId] : undefined)
    ?? Object.values(sim.universe.realEstateAgents).find((a) => a.markets.includes(propertyOf(sim, listing).locationId));
  const person = agent ? sim.universe.people[agent.personId] : undefined;
  return agent && person ? { agent, person } : undefined;
}

export function agentTone(person: Person): DialogueTone {
  return person.personality.agreeableness >= 60 ? 'warm' : 'firm';
}

/** What the agent knows about the player, as the library names it. */
export function agentKnows(sim: Simulation, agentPersonId: Id): string[] {
  const facts = factsOf(sim, agentPersonId, { aboutId: sim.player.id });
  const known: string[] = [];
  if (facts.some((f) => f.kind === 'event' && /did(n’t| not) come/.test(f.text))) known.push('missed');
  if (facts.some((f) => f.kind === 'meeting')) known.push('met');
  return known;
}

/** Whether a showing can be started now, and if not, why. */
export function viewable(sim: Simulation, listing: PropertyListing): { ok: boolean; reason?: string } {
  if (listing.status !== 'active') return { ok: false, reason: 'That listing is no longer active.' };
  const property = propertyOf(sim, listing);
  if (sim.player.currentLocationId !== property.locationId) return { ok: false, reason: NOT_HERE };
  return { ok: true };
}

export interface OfferChoice {
  amount: Money;
  label: string;
  financingKind: PropertyOffer['financingKind'];
  disabled?: string;
}

/** The offers you could make from the table, with the ones the money will not carry closed and the reason why. */
export function offerChoices(sim: Simulation, listing: PropertyListing): OfferChoice[] {
  const steps: { key: string; fraction: number; label: string }[] = [
    { key: 'asking', fraction: 1, label: 'Offer The Asking Price' },
    { key: 'under4', fraction: 0.96, label: 'Offer Four Percent Under' },
    { key: 'under8', fraction: 0.92, label: 'Offer Eight Percent Under' },
  ];
  const out: OfferChoice[] = [];
  for (const step of steps) {
    const amount = Math.round(listing.askingPrice * step.fraction / 1000) * 1000;
    const cash = offerRefusal(sim, amount, 'cash');
    const conventional = offerRefusal(sim, amount, 'conventional');
    if (!cash) out.push({ amount, label: `${step.label}, Cash`, financingKind: 'cash' });
    out.push({ amount, label: `${step.label}, With A Mortgage`, financingKind: 'conventional', disabled: conventional });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerViewings(sim: Simulation): void {
  // A showing coming round asks, unless it is already being played.
  sim.onEvent('prop.showing_due', 'viewings.due', (event, { sim: s }) => {
    const { listingId } = event.payload as { listingId: Id };
    const listing = s.universe.propertyListings[listingId];
    if (!listing || listing.status !== 'active') return;
    const property = s.universe.properties[listing.propertyId];
    if (!property) return;
    const scene = activeScene(s);
    if (scene && scene.refType === 'listing' && scene.refId === listing.id) return;
    if (s.player.currentLocationId !== property.locationId) {
      missShowing(s, listing, 'You were in another city.');
      return;
    }
    s.requireDecision({
      urgency: 55, category: 'property',
      title: `Showing At ${property.addressLine}`,
      detail: `${formatMoney(listing.askingPrice)} asking. The agent is waiting with the keys.`,
      route: '/workspace/property',
      actions: [
        { label: 'Play It Out', commandKind: 'scene.start', payload: { definitionId: 'property.viewing', input: { listingId: listing.id }, refType: 'listing', refId: listing.id } },
        { label: 'Just Look Around', commandKind: 'viewing.summary', payload: { listingId: listing.id } },
        { label: 'Skip It', commandKind: 'viewing.skip', payload: { listingId: listing.id } },
      ],
      dueAt: s.now + LAPSE_MINUTES * MS_MINUTE,
      refType: 'listing', refId: listing.id,
    });
    s.schedule({
      at: s.now + LAPSE_MINUTES * MS_MINUTE, kind: 'viewing.lapse', label: `Showing At ${property.addressLine} Lapses`, category: 'system',
      payload: { listingId: listing.id }, priority: 80, refType: 'listing', refId: listing.id,
    });
  });

  sim.onSchedule('viewing.lapse', (item) => {
    const listing = sim.universe.propertyListings[item.payload['listingId'] as Id];
    if (!listing || listing.status !== 'active' || listing.viewedByPlayer) return;
    const scene = activeScene(sim);
    if (scene && scene.refType === 'listing' && scene.refId === listing.id) {
      sim.schedule({ at: sim.now + LAPSE_MINUTES * MS_MINUTE, kind: 'viewing.lapse', label: item.label, category: 'system', payload: { listingId: listing.id }, priority: 80, refType: 'listing', refId: listing.id });
      return;
    }
    missShowing(sim, listing, 'You never came.');
  });

  // --- Getting there, and looking --------------------------------------------------

  sim.onCommand<{ listingId: Id }, { minutes: number; greeting: string; agentId?: Id }>(
    'viewing.arrive',
    (p, { sim: s }) => {
      const listing = listingOf(s, p.listingId);
      const can = viewable(s, listing);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      const property = propertyOf(s, listing);
      ensureAgents(s, property.locationId);
      const who = agentOf(s, listing);
      s.advanceTo(s.now + TRAVEL_MINUTES * MS_MINUTE);
      s.resolveDecision('listing', listing.id);
      const first = !who || !agentKnows(s, who.person.id).includes('met');
      if (who) {
        rememberFact(s, who.person.id, { kind: 'meeting', aboutId: s.player.id, text: `Showed ${s.player.firstName} ${property.addressLine}.`, weight: 30, sourceKind: 'viewing', refType: 'listing', refId: listing.id, expiresAt: s.now + 180 * MS_DAY });
      }
      const greeting = speak(s, { section: 'property', purpose: 'greet', beat: 'door' }, {
        tone: who ? agentTone(who.person) : undefined,
        facts: who ? agentKnows(s, who.person.id).filter((k) => k !== 'met') : [],
        flags: [first ? 'first_visit' : 'returning'],
        vars: { first: who?.person.firstName ?? 'The agent' },
      }, listing.id);
      listing.viewedByPlayer = true;
      s.emit('prop.showing_attended', { listingId: listing.id, played: true });
      return { minutes: TRAVEL_MINUTES, greeting: greeting.text, agentId: who?.agent.id };
    },
  );

  sim.onCommand<{ listingId: Id; room: string }, { note: string }>(
    'viewing.look',
    (p, { sim: s }) => {
      const listing = listingOf(s, p.listingId);
      const can = viewable(s, listing);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      const property = propertyOf(s, listing);
      const room = roomsOf(property).find((r) => r.id === p.room);
      if (!room) throw new CommandError('There’s no such room here.');
      const who = agentOf(s, listing);
      s.advanceTo(s.now + LOOK_MINUTES * MS_MINUTE);
      const note = speak(s, { section: 'property', purpose: 'room', beat: 'walk' }, {
        move: room.kind, flags: [conditionBand(property)], tone: who ? agentTone(who.person) : undefined,
        vars: { first: who?.person.firstName ?? 'The agent' },
      }, `${listing.id}:${room.id}`);
      return { note: note.text };
    },
  );

  sim.onCommand<{ listingId: Id; question: string }, { answer: string }>(
    'viewing.ask',
    (p, { sim: s }) => {
      const listing = listingOf(s, p.listingId);
      const can = viewable(s, listing);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      const property = propertyOf(s, listing);
      const question = QUESTIONS.find((q) => q.id === p.question);
      if (!question) throw new CommandError('That isn’t something to ask here.');
      const who = agentOf(s, listing);
      const flags = question.id === 'why' ? [listing.sellerMotivation >= 70 ? 'keen' : 'steady'] : question.id === 'offers' ? ['quiet'] : [];
      const answer = speak(s, { section: 'property', purpose: 'answer', beat: 'ask' }, {
        move: question.id, flags, tone: who ? agentTone(who.person) : undefined,
        vars: {
          first: who?.person.firstName ?? 'The agent',
          days: String(listing.daysOnMarket),
          hood: property.neighbourhoodId ? (NEIGHBOURHOODS.get(property.neighbourhoodId)?.name ?? 'The area') : 'The area',
          asking: formatMoney(listing.askingPrice),
        },
      }, `${listing.id}:${question.id}`);
      if (who) rememberFact(s, who.person.id, { kind: 'topic', aboutId: s.player.id, text: `Asked about ${question.label.toLowerCase().replace(/\?$/, '')}.`, weight: 15, sourceKind: 'viewing', expiresAt: s.now + 60 * MS_DAY });
      return { answer: answer.text };
    },
  );

  // --- The short version, and not going ------------------------------------------------

  sim.onCommand<{ listingId: Id }, { viewed: boolean }>(
    'viewing.summary',
    (p, { sim: s }) => {
      const listing = listingOf(s, p.listingId);
      const can = viewable(s, listing);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_HERE);
      const property = propertyOf(s, listing);
      ensureAgents(s, property.locationId);
      s.resolveDecision('listing', listing.id);
      s.timeline.cancelFor('listing', listing.id, s.now);
      s.advanceTo(s.now + (TRAVEL_MINUTES + LOOK_MINUTES * roomsOf(property).length) * MS_MINUTE);
      listing.viewedByPlayer = true;
      s.emit('prop.showing_attended', { listingId: listing.id, played: false });
      s.notify({
        category: 'property', title: `You Saw ${property.addressLine}`,
        body: `${roomsOf(property).length} rooms, ${conditionBand(property)} condition. ${formatMoney(listing.askingPrice)} asking.`,
        importance: 35, route: '/workspace/property', refType: 'listing', refId: listing.id,
      });
      return { viewed: true };
    },
  );

  sim.onCommand<{ listingId: Id }, { skipped: boolean }>(
    'viewing.skip',
    (p, { sim: s }) => {
      const listing = listingOf(s, p.listingId);
      s.resolveDecision('listing', listing.id);
      s.timeline.cancelFor('listing', listing.id, s.now);
      missShowing(s, listing, 'You decided not to go.');
      return { skipped: true };
    },
  );
}

function missShowing(sim: Simulation, listing: PropertyListing, why: string): void {
  const property = sim.universe.properties[listing.propertyId];
  const who = agentOf(sim, listing);
  sim.resolveDecision('listing', listing.id);
  if (who) {
    rememberFact(sim, who.person.id, { kind: 'event', aboutId: sim.player.id, text: `Booked a showing at ${property?.addressLine ?? 'a house'} and didn’t come.`, weight: 40, sourceKind: 'viewing', refType: 'listing', refId: listing.id, expiresAt: sim.now + 120 * MS_DAY });
  }
  sim.notify({
    category: 'property', title: `You Missed The Showing`,
    body: `${property?.addressLine ?? 'The house'} at ${formatTime(sim.now, sim.zone)}. ${why}${who ? ` ${who.person.firstName} waited.` : ''}`,
    importance: 35, route: '/workspace/property', refType: 'listing', refId: listing.id,
  });
  sim.emit('prop.showing_missed', { listingId: listing.id });
}
