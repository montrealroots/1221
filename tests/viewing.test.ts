/**
 * Viewings: a house from the booking to the number on the table.
 *
 * Booking a showing puts it on the calendar. When it comes round it asks —
 * play it, look around, or skip — and left alone it lapses into a missed
 * showing the agent remembers. Played, it is a door, rooms in any order
 * with the house's condition in every line, an agent who answers what an
 * agent would, and an offer that is the property system's own command
 * with the same lender behind it. The short version sees every room.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import type { PropertyListing } from '@/engine/domain/model';
import { ensureAgents, refreshListings } from '@/engine/systems/property';
import {
  LAPSE_MINUTES, LOOK_MINUTES, QUESTIONS, TRAVEL_MINUTES, agentKnows, agentOf, conditionBand, offerChoices, roomsOf, viewable,
} from '@/engine/systems/viewings';
import { factsOf } from '@/engine/systems/memory';
import { activeScene, sceneView } from '@/engine/systems/scenes';

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function aLife(seed = 'viewing', funding = 20_000_00): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

/** An active listing in the player's city, with its agent in the world. */
function aListing(sim: Simulation): PropertyListing {
  const here = sim.player.currentLocationId;
  ensureAgents(sim, here);
  let listing = Object.values(sim.universe.propertyListings).find((l) => l.status === 'active' && sim.universe.properties[l.propertyId]?.locationId === here);
  if (!listing) {
    refreshListings(sim);
    listing = Object.values(sim.universe.propertyListings).find((l) => l.status === 'active' && sim.universe.properties[l.propertyId]?.locationId === here);
  }
  if (!listing) throw new Error('No listing in town');
  return listing;
}

function choose(sim: Simulation, choiceId: string) {
  const scene = activeScene(sim)!;
  return must<{ status: string }>(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId });
}

function pendingDecision(sim: Simulation, listing: PropertyListing) {
  return Object.values(sim.universe.decisions).find((d) => d.refType === 'listing' && d.refId === listing.id && !d.resolvedAt);
}

describe('viewings', () => {
  beforeAll(async () => {
    await loadAllSections();
  });

  it('a booked showing asks when it comes round, and every action it offers is a real command', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const at = sim.now + 26 * MS_HOUR;
    must(sim, 'prop.book_showing', { listingId: listing.id, at });
    sim.advanceTo(at + MS_MINUTE);
    const decision = pendingDecision(sim, listing);
    expect(decision).toBeDefined();
    expect(decision!.title).toMatch(/^Showing At /);
    const kinds = decision!.actions.map((a) => a.commandKind);
    expect(kinds).toEqual(['scene.start', 'viewing.summary', 'viewing.skip']);
    for (const action of decision!.actions) expect(sim.hasCommand(action.commandKind)).toBe(true);
    expect(sim.timeline.pending().some((i) => i.kind === 'viewing.lapse' && i.refId === listing.id)).toBe(true);
  });

  it('left alone, a showing lapses into a missed one the agent remembers', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const who = agentOf(sim, listing)!;
    const at = sim.now + 26 * MS_HOUR;
    must(sim, 'prop.book_showing', { listingId: listing.id, at });
    sim.advanceTo(at + (LAPSE_MINUTES + 1) * MS_MINUTE);
    expect(pendingDecision(sim, listing)).toBeUndefined();
    expect(listing.viewedByPlayer).toBe(false);
    expect(sim.universe.notifications.some((n) => /Missed The Showing/.test(n.title))).toBe(true);
    expect(factsOf(sim, who.person.id, { kind: 'event' }).some((f) => /did(n’t| not) come/.test(f.text))).toBe(true);
    expect(agentKnows(sim, who.person.id)).toContain('missed');
  });

  it('skipping it is a choice, and the agent remembers that too', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const at = sim.now + 26 * MS_HOUR;
    must(sim, 'prop.book_showing', { listingId: listing.id, at });
    sim.advanceTo(at + MS_MINUTE);
    must(sim, 'viewing.skip', { listingId: listing.id });
    expect(pendingDecision(sim, listing)).toBeUndefined();
    expect(sim.timeline.pending().some((i) => i.kind === 'viewing.lapse' && i.refId === listing.id)).toBe(false);
    expect(sim.universe.notifications.some((n) => /Missed The Showing/.test(n.title) && /decided n[o’]t to go/.test(n.body))).toBe(true);
  });

  it('being in another city when it comes round is a missed showing, not a blocked one', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const at = sim.now + 26 * MS_HOUR;
    must(sim, 'prop.book_showing', { listingId: listing.id, at });
    sim.player.currentLocationId = sim.player.currentLocationId === 'uk-eng-london' ? 'us-ny-newyork' : 'uk-eng-london';
    sim.advanceTo(at + MS_MINUTE);
    expect(pendingDecision(sim, listing)).toBeUndefined();
    expect(sim.universe.notifications.some((n) => /Missed The Showing/.test(n.title) && /another city/.test(n.body))).toBe(true);
    expect(viewable(sim, listing).ok).toBe(false);
  });

  it('arriving takes the travel time, greets you in the agent\'s voice and marks the listing seen', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const who = agentOf(sim, listing)!;
    const before = sim.now;
    const arrived = must<{ minutes: number; greeting: string; agentId?: string }>(sim, 'viewing.arrive', { listingId: listing.id });
    expect(sim.now - before).toBe(TRAVEL_MINUTES * MS_MINUTE);
    expect(arrived.greeting.length).toBeGreaterThan(10);
    expect(arrived.greeting).toContain(who.person.firstName);
    expect(arrived.agentId).toBe(who.agent.id);
    expect(listing.viewedByPlayer).toBe(true);
    expect(agentKnows(sim, who.person.id)).toContain('met');
  });

  it('every room has a line that fits its condition, and the agent answers every question', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const property = sim.universe.properties[listing.propertyId]!;
    must(sim, 'viewing.arrive', { listingId: listing.id });
    const rooms = roomsOf(property);
    expect(rooms.length).toBeGreaterThanOrEqual(4);
    expect(rooms.map((r) => r.kind)).toContain('bedroom');
    for (const room of rooms) {
      const before = sim.now;
      const { note } = must<{ note: string }>(sim, 'viewing.look', { listingId: listing.id, room: room.id });
      expect(sim.now - before).toBe(LOOK_MINUTES * MS_MINUTE);
      expect(note.length).toBeGreaterThan(10);
      expect(note).not.toMatch(/\{\w+\}/);
    }
    expect(attempt(sim, 'viewing.look', { listingId: listing.id, room: 'attic' }).ok).toBe(false);
    for (const q of QUESTIONS) {
      const { answer } = must<{ answer: string }>(sim, 'viewing.ask', { listingId: listing.id, question: q.id });
      expect(answer.length).toBeGreaterThan(10);
      expect(answer).not.toMatch(/\{\w+\}/);
    }
    const market = must<{ answer: string }>(sim, 'viewing.ask', { listingId: listing.id, question: 'market' }).answer;
    expect(market).toContain(String(listing.daysOnMarket));
    expect(attempt(sim, 'viewing.ask', { listingId: listing.id, question: 'basement' }).ok).toBe(false);
    expect(['worn', 'fair', 'good', 'excellent']).toContain(conditionBand(property));
  });

  it('the offers on the table are the ones the money carries, with the lender\'s reason on the rest', () => {
    const poor = aLife('viewing-poor', 0);
    const listing = aListing(poor);
    const choices = offerChoices(poor, listing);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.every((c) => c.financingKind === 'conventional' && c.disabled)).toBe(true);
    expect(choices[0]!.disabled).toMatch(/liquid|lender/);

    const rich = aLife('viewing-rich', 50_000_000_00);
    const richListing = aListing(rich);
    const richChoices = offerChoices(rich, richListing);
    expect(richChoices.some((c) => c.financingKind === 'cash' && !c.disabled)).toBe(true);
    expect(richChoices.map((c) => c.label)).toContain('Offer The Asking Price, Cash');
  });

  it('played out, a viewing walks the rooms, asks, and puts a real offer in through the property system', () => {
    const sim = aLife('viewing-play', 50_000_000_00);
    const listing = aListing(sim);
    const property = sim.universe.properties[listing.propertyId]!;
    const account = sim.ledger.account(sim.player.primaryAccountId!)!;
    const balanceBefore = account.balance;
    must(sim, 'scene.start', { definitionId: 'property.viewing', input: { listingId: listing.id }, refType: 'listing', refId: listing.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('arrive');
    const door = sceneView(sim, scene);
    expect(door.title).toBe(property.addressLine);
    expect(door.choices.map((c) => c.id)).toEqual(['go']);
    choose(sim, 'go');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('rooms');
    const rooms = sceneView(sim, scene);
    expect(rooms.choices.find((c) => c.id === 'offer')!.disabled).toBeDefined();
    const first = roomsOf(property)[0]!;
    choose(sim, `room:${first.id}`);
    const again = sceneView(sim, activeScene(sim)!);
    expect(again.eyebrow).toMatch(/^1 of \d+ rooms seen/);
    expect(again.choices.find((c) => c.id === `room:${first.id}`)!.label).toMatch(/ Again$/);
    expect(again.choices.find((c) => c.id === 'offer')!.disabled).toBeUndefined();
    choose(sim, 'ask');
    expect(activeScene(sim)!.node).toBe('ask');
    choose(sim, 'ask:area');
    const asked = sceneView(sim, activeScene(sim)!);
    expect(asked.text.length).toBeGreaterThan(10);
    choose(sim, 'back');
    choose(sim, 'offer');
    const table = sceneView(sim, activeScene(sim)!);
    const cash = table.choices.find((c) => c.id.endsWith(':cash') && !c.disabled)!;
    expect(cash).toBeDefined();
    choose(sim, cash.id);
    scene = activeScene(sim)!;
    expect(scene.node).toBe('done');
    const done = sceneView(sim, scene);
    expect(done.title).toBe('Offer In');
    const offer = Object.values(sim.universe.propertyOffers).find((o) => o.listingId === listing.id && o.buyerId === sim.player.id);
    expect(offer).toBeDefined();
    expect(offer!.financingKind).toBe('cash');
    expect(offer!.contingencies).toEqual(['inspection']);
    expect(balanceBefore - account.balance).toBe(offer!.earnestMoney);
    choose(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
    expect(listing.viewedByPlayer).toBe(true);
  });

  it('thanking them and going puts nothing on the table and costs nothing', () => {
    const sim = aLife('viewing-leave', 50_000_000_00);
    const listing = aListing(sim);
    const account = sim.ledger.account(sim.player.primaryAccountId!)!;
    const balanceBefore = account.balance;
    must(sim, 'scene.start', { definitionId: 'property.viewing', input: { listingId: listing.id }, refType: 'listing', refId: listing.id });
    choose(sim, 'go');
    choose(sim, `room:${roomsOf(sim.universe.properties[listing.propertyId]!)[0]!.id}`);
    choose(sim, 'leave');
    const done = sceneView(sim, activeScene(sim)!);
    expect(done.title).toBe('Seen');
    expect(done.text.length).toBeGreaterThan(10);
    choose(sim, 'finish');
    expect(Object.values(sim.universe.propertyOffers).some((o) => o.listingId === listing.id)).toBe(false);
    expect(account.balance).toBe(balanceBefore);
  });

  it('the short version sees every room and resolves the showing', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const property = sim.universe.properties[listing.propertyId]!;
    const at = sim.now + 26 * MS_HOUR;
    must(sim, 'prop.book_showing', { listingId: listing.id, at });
    sim.advanceTo(at + MS_MINUTE);
    expect(pendingDecision(sim, listing)).toBeDefined();
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'property.viewing', input: { listingId: listing.id }, refType: 'listing', refId: listing.id });
    expect(quick.status).toBe('completed');
    expect(quick.lines.length).toBeGreaterThanOrEqual(roomsOf(property).length + 2);
    expect(quick.lines.at(-1)).toMatch(/^You saw it all\./);
    expect(listing.viewedByPlayer).toBe(true);
    expect(pendingDecision(sim, listing)).toBeUndefined();
    sim.advanceTo(sim.now + LAPSE_MINUTES * 2 * MS_MINUTE);
    expect(sim.universe.notifications.some((n) => /Missed The Showing/.test(n.title))).toBe(false);
  });

  it('just looking around is the same seeing without the scene', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const property = sim.universe.properties[listing.propertyId]!;
    const before = sim.now;
    must(sim, 'viewing.summary', { listingId: listing.id });
    expect(sim.now - before).toBe((TRAVEL_MINUTES + LOOK_MINUTES * roomsOf(property).length) * MS_MINUTE);
    expect(listing.viewedByPlayer).toBe(true);
    expect(sim.universe.notifications.some((n) => n.title === `You Saw ${property.addressLine}`)).toBe(true);
  });

  it('a second visit is greeted as a return, and a missed one is held against you politely', () => {
    const sim = aLife();
    const listing = aListing(sim);
    const who = agentOf(sim, listing)!;
    const at = sim.now + 26 * MS_HOUR;
    must(sim, 'prop.book_showing', { listingId: listing.id, at });
    sim.advanceTo(at + (LAPSE_MINUTES + 1) * MS_MINUTE);
    expect(agentKnows(sim, who.person.id)).toEqual(['missed']);
    const first = must<{ greeting: string }>(sim, 'viewing.arrive', { listingId: listing.id });
    expect(first.greeting).toMatch(/polite|did(n’t| not) come|checks the time/);
    expect(agentKnows(sim, who.person.id)).toEqual(['missed', 'met']);
    sim.advanceTo(sim.now + MS_DAY);
    const second = must<{ greeting: string }>(sim, 'viewing.arrive', { listingId: listing.id });
    expect(second.greeting.length).toBeGreaterThan(10);
  });

  it('a viewing cannot be started on a listing that is gone or from another city', () => {
    const sim = aLife();
    const listing = aListing(sim);
    expect(attempt(sim, 'scene.start', { definitionId: 'property.viewing', input: { listingId: 'listing_nope' } }).ok).toBe(false);
    listing.status = 'expired';
    const refused = attempt(sim, 'viewing.arrive', { listingId: listing.id });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/no longer active/);
  });
});
