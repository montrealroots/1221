/**
 * Buying a home, after the offer: the seller's answer, the inspection, the
 * appraisal, closing day and moving in.
 *
 * Every point where the purchase waits on you asks on Home and has a scene
 * behind it, a short version by the same rules, and a clock: a counter you
 * do not answer is withdrawn, an inspection you say nothing about is
 * waived, a closing you do not come to costs the deposit. The money moves
 * only through the property system's own commands, the ledger stays
 * balanced, and a retry cannot buy a sofa twice.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays } from '@/engine/core/time';
import type { PropertyListing, PropertyOffer } from '@/engine/domain/model';
import { ensureAgents, refreshListings, MAX_SELLER_COUNTERS, COUNTER_DAYS } from '@/engine/systems/property';
import {
  APPRAISAL_LEAD_DAYS, CLOSING_LAPSE_DAYS, INSPECTION_DAYS, MOVING_DAY_DAYS, POSTPONE_DAYS, closingNumbers, counterChoices, findingsTotal,
  furnishPlan, inspectionSignificant, inspectorFor, reductionChoices, roomsFor,
} from '@/engine/systems/purchase';
import { factsOf } from '@/engine/systems/memory';
import { formatMoney } from '@/engine/core/money';
import { activeScene, sceneView } from '@/engine/systems/scenes';

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function aLife(seed = 'purchase', funding = 50_000_000_00): Simulation {
  const sim = quickSave({}, seed);
  if (funding > 0) sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  sim.universe.creditProfiles[sim.player.id]!.score = 760;
  return sim;
}

function balance(sim: Simulation): number {
  return sim.ledger.account(sim.player.primaryAccountId!).balance;
}

/** Transactions on the player's account with a memo, newest first. */
function txns(sim: Simulation, memo: RegExp, refId?: string) {
  return sim.ledger.history(sim.player.primaryAccountId!, 500).filter((t) => memo.test(t.memo) && (!refId || t.refId === refId));
}

function refunds(sim: Simulation, offerId: string): number {
  return txns(sim, /Earnest money returned/, offerId).length;
}

function listingsHere(sim: Simulation): PropertyListing[] {
  const here = sim.player.currentLocationId;
  ensureAgents(sim, here);
  let all = Object.values(sim.universe.propertyListings).filter((l) => l.status === 'active' && sim.universe.properties[l.propertyId]?.locationId === here && sim.universe.properties[l.propertyId]?.kind !== 'land');
  if (all.length < 3) { refreshListings(sim); all = Object.values(sim.universe.propertyListings).filter((l) => l.status === 'active' && sim.universe.properties[l.propertyId]?.locationId === here && sim.universe.properties[l.propertyId]?.kind !== 'land'); }
  return all.sort((a, b) => a.askingPrice - b.askingPrice);
}

function choose(sim: Simulation, choiceId: string) {
  const scene = activeScene(sim)!;
  return must<{ status: string }>(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId });
}

function decisionFor(sim: Simulation, refType: string, refId: string, category?: string) {
  return Object.values(sim.universe.decisions).find((d) => d.refType === refType && d.refId === refId && !d.resolvedAt && (!category || d.category === category));
}

function pendingKinds(sim: Simulation, refId: string): string[] {
  return sim.timeline.pending().filter((i) => i.refId === refId).map((i) => i.kind).sort();
}

/** Offer on listings in turn until the seller comes back with a number. */
function countered(sim: Simulation): PropertyOffer {
  for (const listing of listingsHere(sim)) {
    const amount = Math.round(listing.askingPrice * 0.9 / 1000_00) * 1000_00;
    const { offerId } = must<{ offerId: string }>(sim, 'prop.make_offer', { listingId: listing.id, amount, financingKind: 'cash', contingencies: ['inspection'] });
    const offer = sim.universe.propertyOffers[offerId]!;
    sim.advanceTo(offer.respondBy + MS_HOUR);
    if (offer.status === 'countered') return offer;
  }
  throw new Error('No seller countered');
}

/** Offer asking, cash, until one is accepted. */
function accepted(sim: Simulation, financingKind: 'cash' | 'conventional' = 'cash', contingencies: string[] = ['inspection']): PropertyOffer {
  for (const listing of listingsHere(sim)) {
    const { offerId } = must<{ offerId: string }>(sim, 'prop.make_offer', { listingId: listing.id, amount: listing.askingPrice, financingKind, contingencies });
    const offer = sim.universe.propertyOffers[offerId]!;
    sim.advanceTo(offer.respondBy + MS_HOUR);
    if (offer.status === 'accepted') return offer;
    if (offer.status === 'countered') { must(sim, 'prop.respond_to_counter', { offerId, accept: true }); return offer; }
  }
  throw new Error('No seller accepted');
}

describe('the seller came back', () => {
  beforeAll(async () => { await loadAllSections(); });

  it('a counter asks on Home with the call, the yes and the no, and lapses into a refusal with the deposit back', () => {
    const sim = aLife('counter-lapse');
    const offer = countered(sim);
    expect(txns(sim, /Earnest money deposit/, offer.listingId).length).toBe(1);
    const decision = decisionFor(sim, 'offer', offer.id)!;
    expect(decision.title).toMatch(/^Counteroffer On /);
    expect(decision.actions.map((a) => a.label)).toEqual(['Take The Call', 'Accept The Counter', 'Walk Away']);
    expect(pendingKinds(sim, offer.id)).toContain('prop.counter_lapse');
    sim.advanceTo(offer.respondBy + 2 * MS_HOUR);
    expect(offer.status).toBe('rejected');
    expect(refunds(sim, offer.id)).toBe(1);
    expect(decisionFor(sim, 'offer', offer.id)).toBeUndefined();
    expect(sim.universe.propertyListings[offer.listingId]!.status).toBe('active');
    expect(sim.universe.notifications.some((n) => /Stopped Waiting/.test(n.title))).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('the call: counter back with a number between the two, and the seller answers again', () => {
    const sim = aLife('counter-back');
    const offer = countered(sim);
    const theirs = offer.counterAmount!;
    const mine = offer.amount;
    must(sim, 'scene.start', { definitionId: 'property.counter', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('call');
    const call = sceneView(sim, scene);
    expect(call.text.length).toBeGreaterThan(10);
    expect(call.choices.map((c) => c.id)).toEqual(['accept', 'counter', 'walk']);
    choose(sim, 'counter');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('number');
    const number = sceneView(sim, scene);
    const options = counterChoices(sim, offer);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) { expect(o.amount).toBeGreaterThanOrEqual(mine); expect(o.amount).toBeLessThan(theirs); }
    const pick = number.choices.find((c) => c.id.startsWith('counter:') && !c.disabled)!;
    choose(sim, pick.id);
    expect(activeScene(sim)!.node).toBe('done');
    expect(offer.status).toBe('submitted');
    expect(offer.amount).toBe(options.find((o) => `counter:${o.id}` === pick.id)!.amount);
    expect(decisionFor(sim, 'offer', offer.id)).toBeUndefined();
    expect(pendingKinds(sim, offer.id)).not.toContain('prop.counter_lapse');
    expect(pendingKinds(sim, offer.id)).toContain('prop.offer_response');
    choose(sim, 'finish');
    sim.advanceTo(offer.respondBy + MS_HOUR);
    expect(['accepted', 'countered', 'rejected']).toContain(offer.status);
    expect(offer.counterRounds ?? 0).toBeLessThanOrEqual(MAX_SELLER_COUNTERS);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a seller comes back with a number at most twice', () => {
    const sim = aLife('counter-rounds');
    const offer = countered(sim);
    offer.counterRounds = MAX_SELLER_COUNTERS;
    must(sim, 'prop.respond_to_counter', { offerId: offer.id, accept: false, counterAmount: offer.amount });
    sim.advanceTo(offer.respondBy + MS_HOUR);
    expect(['accepted', 'rejected']).toContain(offer.status);
  });

  it('accepting the counter on the call sets the inspection and the closing; walking away refunds', () => {
    const accept = aLife('counter-accept');
    const offerA = countered(accept);
    must(accept, 'scene.start', { definitionId: 'property.counter', input: { offerId: offerA.id }, refType: 'offer', refId: offerA.id });
    choose(accept, 'accept');
    expect(offerA.status).toBe('accepted');
    expect(offerA.amount).toBe(offerA.counterAmount);
    expect(pendingKinds(accept, offerA.id)).toEqual(expect.arrayContaining(['prop.closing', 'prop.inspection']));
    expect(sceneView(accept, activeScene(accept)!).title).toBe('A House, Then');

    const walk = aLife('counter-walk');
    const offerB = countered(walk);
    must(walk, 'scene.start', { definitionId: 'property.counter', input: { offerId: offerB.id }, refType: 'offer', refId: offerB.id });
    choose(walk, 'walk');
    expect(offerB.status).toBe('withdrawn');
    expect(refunds(walk, offerB.id)).toBe(1);
    expect(walk.universe.propertyListings[offerB.listingId]!.status).toBe('active');
  });

  it('the short version takes the counter when the money carries it', () => {
    const sim = aLife('counter-quick');
    const offer = countered(sim);
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'property.counter', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    expect(quick.status).toBe('completed');
    expect(offer.status).toBe('accepted');
    expect(attempt(sim, 'prop.respond_to_counter', { offerId: offer.id, accept: false, counterAmount: 0 }).ok).toBe(false);
  });
});

describe('the inspection', () => {
  beforeAll(async () => { await loadAllSections(); });

  function inspected(sim: Simulation): PropertyOffer {
    const offer = accepted(sim);
    sim.advanceTo(offer.inspectionAt! + MS_HOUR);
    expect(offer.inspectionFindings).toBeDefined();
    return offer;
  }

  it('the report always asks, with the walk when you are there, and silence for four days is a yes', () => {
    const sim = aLife('inspect-lapse');
    const offer = inspected(sim);
    const decision = decisionFor(sim, 'offer', offer.id)!;
    expect(decision.title).toMatch(/^Inspection (Findings|Report) On /);
    const labels = decision.actions.map((a) => a.label);
    expect(labels).toContain('Walk It With The Inspector');
    expect(labels).toContain('Read The Report');
    expect(labels).toContain('Proceed Anyway');
    expect(labels.includes('Walk Away')).toBe(inspectionSignificant(offer));
    expect(pendingKinds(sim, offer.id)).toContain('prop.inspection_lapse');
    sim.advanceTo(addDays(sim.now, INSPECTION_DAYS, sim.homeZone) + MS_HOUR);
    expect(offer.inspectionDecidedAt).toBeDefined();
    expect(offer.status).toBe('accepted');
    expect(offer.history.some((h) => /without a word/.test(h.note))).toBe(true);
    expect(decisionFor(sim, 'offer', offer.id)).toBeUndefined();
    expect(attempt(sim, 'prop.inspection_decision', { offerId: offer.id, proceed: true }).error).toMatch(/already been answered/);
  });

  it('walked with the inspector: every finding in their voice, then money off asked for in the room', () => {
    const sim = aLife('inspect-walk');
    const offer = inspected(sim);
    const inspector = inspectorFor(sim, offer);
    must(sim, 'scene.start', { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    expect(activeScene(sim)!.node).toBe('meet');
    const before = sim.now;
    choose(sim, 'walk');
    expect(sim.now - before).toBe(90 * MS_MINUTE);
    expect(factsOf(sim, inspector.id, { kind: 'meeting' }).length).toBe(1);
    expect(activeScene(sim)!.node).toBe('findings');
    const findings = offer.inspectionFindings!;
    for (let i = 0; i < findings.length; i++) {
      choose(sim, `look:${i}`);
      const view = sceneView(sim, activeScene(sim)!);
      expect(view.text).toContain(findings[i]!.item);
      expect(view.text).not.toMatch(/\{\w+\}/);
    }
    choose(sim, 'decide');
    expect(activeScene(sim)!.node).toBe('decide');
    const decide = sceneView(sim, activeScene(sim)!);
    if (findings.length === 0) {
      expect(decide.choices.find((c) => c.id === 'ask')!.disabled).toBeDefined();
      choose(sim, 'proceed');
      expect(offer.inspectionDecidedAt).toBeDefined();
      return;
    }
    choose(sim, 'ask');
    const ask = sceneView(sim, activeScene(sim)!);
    const options = reductionChoices(offer);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) { expect(o.amount).toBeLessThan(offer.amount); expect(o.amount).toBeGreaterThan(0); }
    const price = offer.amount;
    choose(sim, ask.choices.find((c) => c.id.startsWith('ask:'))!.id);
    expect(activeScene(sim)!.node).toBe('done');
    expect(offer.inspectionDecidedAt).toBeDefined();
    const done = sceneView(sim, activeScene(sim)!);
    if (offer.amount < price) expect(done.title).toBe('Price Reduced');
    else expect(done.title).toBe('They Said No');
    expect(offer.history.at(-1)!.note).toMatch(/reduction/);
    choose(sim, 'finish');
    expect(decisionFor(sim, 'offer', offer.id)).toBeUndefined();
    expect(pendingKinds(sim, offer.id)).not.toContain('prop.inspection_lapse');
    expect(pendingKinds(sim, offer.id)).toContain('prop.closing');
  });

  it('read from another city, and walked away with the deposit', () => {
    const sim = aLife('inspect-away');
    const before = balance(sim);
    const offer = inspected(sim);
    sim.player.currentLocationId = sim.player.currentLocationId === 'uk-eng-london' ? 'us-ny-newyork' : 'uk-eng-london';
    must(sim, 'scene.start', { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    const meet = sceneView(sim, activeScene(sim)!);
    expect(meet.choices.find((c) => c.id === 'walk')!.disabled).toMatch(/not in the city/);
    choose(sim, 'read');
    choose(sim, 'decide');
    choose(sim, 'walk');
    expect(offer.status).toBe('withdrawn');
    expect(sim.universe.propertyListings[offer.listingId]!.status).toBe('active');
    expect(pendingKinds(sim, offer.id)).toEqual([]);
    // Deposit back; the inspection fee was real and stays spent.
    expect(refunds(sim, offer.id)).toBe(1);
    expect(txns(sim, /Home inspection/, offer.id).length).toBe(1);
    expect(balance(sim)).toBeLessThan(before);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('the short version reads everything and asks for the findings off when they matter', () => {
    const sim = aLife('inspect-quick');
    const offer = inspected(sim);
    const price = offer.amount;
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    expect(quick.status).toBe('completed');
    expect(quick.lines.length).toBeGreaterThanOrEqual((offer.inspectionFindings?.length ?? 0) + 2);
    expect(offer.inspectionDecidedAt).toBeDefined();
    if (inspectionSignificant(offer)) expect(offer.history.at(-1)!.note).toMatch(/reduction/);
    else expect(offer.amount).toBe(price);
    expect(findingsTotal(offer)).toBe((offer.inspectionFindings ?? []).reduce((s, f) => s + f.estimate, 0));
  });
});

describe('the appraisal and closing day', () => {
  beforeAll(async () => { await loadAllSections(); });

  it('a financed purchase is appraised a week before closing, and a gap you can carry goes on the table', () => {
    const sim = aLife('appraise');
    const offer = accepted(sim, 'conventional', ['inspection', 'appraisal']);
    expect(pendingKinds(sim, offer.id)).toContain('prop.appraisal');
    const property = sim.universe.properties[offer.propertyId]!;
    property.marketValue = Math.round(offer.amount * 0.85);
    sim.advanceTo(offer.closingAt! - APPRAISAL_LEAD_DAYS * MS_DAY + MS_HOUR);
    expect(offer.appraisalValue).toBeDefined();
    expect(offer.appraisalValue!).toBeLessThan(offer.amount * 0.97);
    expect(offer.status).toBe('accepted');
    expect(offer.appraisalGap).toBe(offer.amount - offer.appraisalValue!);
    const n = closingNumbers(sim, offer);
    expect(n.appraisalGap).toBe(offer.appraisalGap);
    expect(n.cashToClose).toBe(offer.downPayment + offer.appraisalGap! - offer.earnestMoney + n.closingCosts);
  });

  it('a gap you cannot carry ends the purchase with the deposit back', () => {
    const sim = aLife('appraise-fail');
    const offer = accepted(sim, 'conventional', ['appraisal']);
    const property = sim.universe.properties[offer.propertyId]!;
    property.marketValue = Math.round(offer.amount * 0.8);
    const accountId = sim.player.primaryAccountId!;
    const keep = offer.downPayment + Math.round(offer.amount * 0.05);
    sim.expense(accountId, balance(sim) - keep, 'Test drain', 'other');
    sim.advanceTo(offer.closingAt! - APPRAISAL_LEAD_DAYS * MS_DAY + MS_HOUR);
    expect(offer.status).toBe('withdrawn');
    expect(refunds(sim, offer.id)).toBe(1);
    expect(balance(sim)).toBeLessThan(keep + offer.earnestMoney);
    expect(pendingKinds(sim, offer.id)).toEqual([]);
    expect(sim.universe.notifications.some((n) => n.title === 'Purchase Fell Through')).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  function atTheTable(sim: Simulation, financing: 'cash' | 'conventional' = 'cash'): PropertyOffer {
    const offer = accepted(sim, financing, ['inspection']);
    sim.advanceTo(offer.inspectionAt! + MS_HOUR);
    must(sim, 'prop.inspection_decision', { offerId: offer.id, proceed: true });
    sim.advanceTo(offer.closingAt! + MS_MINUTE);
    // A month of thin history pulls a new character's score down; this buyer has credit.
    sim.universe.creditProfiles[sim.player.id]!.score = 760;
    return offer;
  }

  it('closing day asks with the table, remote signing and the one delay; left alone the seller keeps the deposit', () => {
    const sim = aLife('closing-lapse');
    const offer = atTheTable(sim);
    const decision = decisionFor(sim, 'offer', offer.id)!;
    expect(decision.title).toMatch(/^Closing On /);
    expect(decision.actions.map((a) => a.label)).toEqual(['Sit At The Table', 'Sign Remotely', `Ask For ${POSTPONE_DAYS} More Days`]);
    sim.advanceTo(addDays(sim.now, CLOSING_LAPSE_DAYS, sim.homeZone) + MS_HOUR);
    expect(offer.status).toBe('withdrawn');
    expect(refunds(sim, offer.id)).toBe(0);
    expect(offer.history.at(-1)!.note).toMatch(/stays with the seller/);
    expect(sim.universe.propertyListings[offer.listingId]!.status).toBe('active');
    expect(sim.universe.notifications.some((n) => /^Deal Off On /.test(n.title))).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('the seller allows one delay, not two', () => {
    const sim = aLife('closing-postpone');
    const offer = atTheTable(sim);
    const was = offer.closingAt!;
    const { closingAt } = must<{ closingAt: number }>(sim, 'prop.postpone_closing', { offerId: offer.id });
    expect(closingAt).toBeGreaterThan(was);
    expect(offer.postponedOnce).toBe(true);
    expect(pendingKinds(sim, offer.id)).toContain('prop.closing');
    expect(pendingKinds(sim, offer.id)).not.toContain('prop.closing_lapse');
    expect(decisionFor(sim, 'offer', offer.id)).toBeUndefined();
    expect(attempt(sim, 'prop.postpone_closing', { offerId: offer.id }).error).toMatch(/already waited/);
    sim.advanceTo(closingAt + MS_MINUTE);
    const again = decisionFor(sim, 'offer', offer.id)!;
    expect(again.actions.map((a) => a.label)).toEqual(['Sit At The Table', 'Sign Remotely']);
  });

  it('at the table: the numbers, the pen, the keys, and straight there', () => {
    const sim = aLife('closing-sign', 50_000_000_00);
    const oldHome = sim.player.residenceId!;
    const rentBills = Object.values(sim.universe.bills).filter((b) => b.active && b.refType === 'property' && b.refId === oldHome);
    const offer = atTheTable(sim, 'conventional');
    const property = sim.universe.properties[offer.propertyId]!;
    const before = balance(sim);
    must(sim, 'scene.start', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('table');
    const table = sceneView(sim, scene);
    const n = closingNumbers(sim, offer);
    expect(table.facts!.find((f) => f.label === 'Cash To Close')!.value).toBe(formatMoney(n.cashToClose));
    expect(table.choices.find((c) => c.id === 'sign')!.disabled).toBeUndefined();
    choose(sim, 'sign');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('keys');
    expect(offer.status).toBe('closed');
    expect(property.ownerId).toBe(sim.player.id);
    expect(property.tenure).toBe('owned');
    expect(before - balance(sim)).toBe(n.cashToClose);
    expect(property.mortgageAccountId).toBeDefined();
    expect(roomsFor(sim, property.id).length).toBeGreaterThanOrEqual(4);
    expect(roomsFor(sim, property.id).map((r) => r.kind)).toEqual(expect.arrayContaining(['living', 'kitchen', 'bedroom', 'bathroom']));
    expect(sim.player.residenceId).toBe(oldHome);
    expect(sim.timeline.pending().some((i) => i.kind === 'prop.moving_day' && i.refId === property.id)).toBe(true);
    choose(sim, 'movein');
    expect(sim.player.residenceId).toBe(property.id);
    expect(sim.timeline.pending().some((i) => i.kind === 'prop.moving_day' && i.refId === property.id)).toBe(false);
    for (const bill of rentBills) expect(bill.active).toBe(false);
    expect(sceneView(sim, activeScene(sim)!).title).toBe('Home');
    choose(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('signing remotely closes by the same rule and moving day asks three days on', () => {
    const sim = aLife('closing-remote');
    const offer = atTheTable(sim);
    const property = sim.universe.properties[offer.propertyId]!;
    const outcome = must<{ closed: boolean }>(sim, 'prop.close', { offerId: offer.id });
    expect(outcome.closed).toBe(true);
    expect(decisionFor(sim, 'offer', offer.id)).toBeUndefined();
    sim.advanceTo(addDays(sim.now, MOVING_DAY_DAYS, sim.homeZone) + MS_HOUR);
    // The house asks two things of you now: to insure it, and to move in.
    expect(decisionFor(sim, 'property', property.id, 'insurance')?.title).toMatch(/^Insure /);
    const moving = decisionFor(sim, 'property', property.id, 'property')!;
    expect(moving.title).toMatch(/^Moving Day At /);
    expect(moving.actions.map((a) => a.label)).toEqual(['Play It Out', 'Just Move In']);
    must(sim, 'prop.move_in', { propertyId: property.id });
    expect(sim.player.residenceId).toBe(property.id);
    expect(decisionFor(sim, 'property', property.id, 'property')).toBeUndefined();
    expect(attempt(sim, 'prop.move_in', { propertyId: property.id }).error).toMatch(/already live/);
  });

  it('short at the table: signing is closed with the reason, the short version asks for the days, and the second time it is the deposit', () => {
    const sim = aLife('closing-short');
    const offer = atTheTable(sim);
    const accountId = sim.player.primaryAccountId!;
    const n = closingNumbers(sim, offer);
    sim.expense(accountId, balance(sim) - Math.round(n.cashToClose / 2), 'Test drain', 'other');
    must(sim, 'scene.start', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    const table = sceneView(sim, activeScene(sim)!);
    expect(table.choices.find((c) => c.id === 'sign')!.disabled).toMatch(/short/);
    must(sim, 'scene.leave', { sceneId: activeScene(sim)!.id, revision: activeScene(sim)!.revision });
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    expect(quick.status).toBe('completed');
    expect(offer.postponedOnce).toBe(true);
    expect(offer.status).toBe('accepted');
    sim.advanceTo(offer.closingAt! + MS_MINUTE);
    const again = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    expect(again.lines.at(-1)).toMatch(/short at the table/);
    expect(offer.status).toBe('accepted');
    sim.advanceTo(addDays(sim.now, CLOSING_LAPSE_DAYS, sim.homeZone) + MS_HOUR);
    expect(offer.status).toBe('withdrawn');
    expect(refunds(sim, offer.id)).toBe(0);
  });

  it('walking away at the table forfeits the deposit, and says so first', () => {
    const sim = aLife('closing-walk');
    const offer = atTheTable(sim);
    must(sim, 'scene.start', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id });
    choose(sim, 'walk');
    expect(activeScene(sim)!.node).toBe('confirm');
    choose(sim, 'back');
    expect(activeScene(sim)!.node).toBe('table');
    choose(sim, 'walk');
    choose(sim, 'walk');
    expect(offer.status).toBe('withdrawn');
    expect(refunds(sim, offer.id)).toBe(0);
    expect(sceneView(sim, activeScene(sim)!).title).toBe('Walked');
    expect(sim.universe.notifications.some((n) => /^Deal Off On /.test(n.title) && /walked away/.test(n.body))).toBe(true);
  });

  it('closing cannot be forced before the day', () => {
    const sim = aLife('closing-early');
    const offer = accepted(sim);
    expect(attempt(sim, 'prop.close', { offerId: offer.id }).error).toMatch(/Closing is set for/);
    expect(attempt(sim, 'scene.start', { definitionId: 'property.closing', input: { offerId: 'offer_nope' } }).ok).toBe(false);
  });
});

describe('moving in and the rooms', () => {
  beforeAll(async () => { await loadAllSections(); });

  function owned(sim: Simulation) {
    const offer = accepted(sim);
    sim.advanceTo(offer.inspectionAt! + MS_HOUR);
    must(sim, 'prop.inspection_decision', { offerId: offer.id, proceed: true });
    sim.advanceTo(offer.closingAt! + MS_MINUTE);
    must(sim, 'prop.close', { offerId: offer.id });
    return sim.universe.properties[offer.propertyId]!;
  }

  it('the home you already rent has rooms once the save loads, and a bought one has them at the keys', () => {
    const sim = aLife('rooms');
    const rented = sim.universe.properties[sim.player.residenceId!]!;
    expect(roomsFor(sim, rented.id).length).toBeGreaterThan(0);
    // An older save without interiors gets them on load, once.
    for (const id of rented.structureIds) { for (const roomId of sim.universe.structures[id]!.roomIds) delete sim.universe.rooms[roomId]; delete sim.universe.structures[id]; }
    rented.structureIds = [];
    const reloaded = loadSave(sim.universe);
    expect(roomsFor(reloaded, rented.id).length).toBeGreaterThan(0);
    const count = roomsFor(reloaded, rented.id).length;
    expect(roomsFor(loadSave(reloaded.universe), rented.id).length).toBe(count);
    const house = owned(reloaded);
    const rooms = roomsFor(reloaded, house.id);
    expect(rooms.filter((r) => r.kind === 'bedroom').length).toBe(Math.max(1, Math.min(house.bedrooms, 6)));
    expect(rooms.every((r) => r.quality > 0)).toBe(true);
  });

  it('furnishing a room is one commit, priced before you choose, and a retry cannot buy it twice', () => {
    const sim = aLife('furnish');
    const house = owned(sim);
    must(sim, 'prop.move_in', { propertyId: house.id });
    const room = roomsFor(sim, house.id).find((r) => r.kind === 'living')!;
    const plan = furnishPlan(sim, room, 'comfortable', 'warm_minimal');
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.cost).toBe(plan.items.reduce((s, i) => s + i.price, 0) + plan.finishCost);
    const before = balance(sim);
    const qualityBefore = room.quality;
    const first = must<{ cost: number; quality: number; bought: string[] }>(sim, 'prop.furnish_room', { roomId: room.id, level: 'comfortable', themeId: 'warm_minimal' }, 'furnish:test');
    expect(first.cost).toBe(plan.cost);
    expect(before - balance(sim)).toBe(plan.cost);
    expect(room.quality).toBeGreaterThan(qualityBefore);
    expect(room.themeId).toBe('warm_minimal');
    const furnishings = () => Object.values(sim.universe.furnishings).filter((f) => f.roomId === room.id).length;
    const count = furnishings();
    const again = must<{ cost: number }>(sim, 'prop.furnish_room', { roomId: room.id, level: 'comfortable', themeId: 'warm_minimal' }, 'furnish:test');
    expect(again.cost).toBe(first.cost);
    expect(furnishings()).toBe(count);
    expect(balance(sim)).toBe(before - plan.cost);
    // Doing it properly afterwards only buys what is missing.
    const proper = furnishPlan(sim, room, 'proper', 'warm_minimal');
    expect(proper.items.every((i) => !plan.items.some((p) => p.catalogId === i.catalogId))).toBe(true);
    expect(attempt(sim, 'prop.furnish_room', { roomId: room.id, level: 'palatial' }).ok).toBe(false);
    expect(attempt(sim, 'prop.furnish_room', { roomId: room.id, level: 'proper', themeId: 'brutalist' }).ok).toBe(false);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('moving in as a scene: the door, a theme, room by room, and the living quality that follows you to bed', () => {
    const sim = aLife('movein-scene');
    const house = owned(sim);
    must(sim, 'scene.start', { definitionId: 'property.movein', input: { propertyId: house.id }, refType: 'property', refId: house.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('door');
    expect(sceneView(sim, scene).choices[0]!.label).toBe('Move In');
    choose(sim, 'in');
    expect(sim.player.residenceId).toBe(house.id);
    scene = activeScene(sim)!;
    expect(scene.node).toBe('theme');
    choose(sim, 'theme:mid_century');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('rooms');
    const rooms = sceneView(sim, scene);
    const bedroom = roomsFor(sim, house.id).find((r) => r.kind === 'bedroom')!;
    expect(rooms.choices.some((c) => c.id === `room:${bedroom.id}`)).toBe(true);
    choose(sim, `room:${bedroom.id}`);
    const levels = sceneView(sim, activeScene(sim)!);
    expect(levels.choices.map((c) => c.id)).toEqual(['level:bare', 'level:comfortable', 'level:proper', 'back']);
    expect(levels.choices[1]!.detail).toMatch(/quality about \d+/);
    const before = balance(sim);
    choose(sim, 'level:proper');
    expect(balance(sim)).toBeLessThan(before);
    expect(bedroom.themeId).toBe('mid_century');
    expect(activeScene(sim)!.node).toBe('rooms');
    expect(sceneView(sim, activeScene(sim)!).choices.find((c) => c.id === `room:${bedroom.id}`)!.detail).toMatch(/done today/);
    choose(sim, `room:${roomsFor(sim, house.id).find((r) => r.kind === 'kitchen')!.id}`);
    choose(sim, 'level:bare');
    choose(sim, 'enough');
    const done = sceneView(sim, activeScene(sim)!);
    expect(done.title).toBe('Home');
    expect(done.facts!.find((f) => f.label === 'Rooms Done')!.value).toMatch(/^1 of /);
    choose(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('the short version moves in and makes every room comfortable the money allows; nothing when you are elsewhere', () => {
    const sim = aLife('movein-quick');
    const house = owned(sim);
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'property.movein', input: { propertyId: house.id }, refType: 'property', refId: house.id });
    expect(quick.status).toBe('completed');
    expect(sim.player.residenceId).toBe(house.id);
    const rooms = roomsFor(sim, house.id);
    expect(rooms.filter((r) => r.themeId === 'warm_minimal').length).toBeGreaterThan(0);
    expect(quick.lines.at(-1)).toMatch(/rooms done/);
    sim.player.currentLocationId = sim.player.currentLocationId === 'uk-eng-london' ? 'us-ny-newyork' : 'uk-eng-london';
    expect(attempt(sim, 'scene.start', { definitionId: 'property.movein', input: { propertyId: house.id } }).error).toMatch(/not in the city/);
    expect(attempt(sim, 'prop.furnish_room', { roomId: rooms[0]!.id, level: 'comfortable' }).error).toMatch(/not in the city/);
  });

  it('you cannot furnish somebody else\'s house', () => {
    const sim = aLife('furnish-other');
    const listing = listingsHere(sim)[0]!;
    const other = sim.universe.properties[listing.propertyId]!;
    expect(attempt(sim, 'scene.start', { definitionId: 'property.movein', input: { propertyId: other.id } }).error).toMatch(/not your home/);
    expect(attempt(sim, 'prop.move_in', { propertyId: other.id }).error).toMatch(/not yours/);
  });
});

describe('the counter clock and the seller', () => {
  it('COUNTER_DAYS is what the decision and the lapse both use', () => {
    const sim = aLife('counter-days');
    const offer = countered(sim);
    const decision = decisionFor(sim, 'offer', offer.id)!;
    expect(decision.dueAt).toBe(offer.respondBy);
    const lapse = sim.timeline.pending().find((i) => i.kind === 'prop.counter_lapse' && i.refId === offer.id)!;
    expect(lapse.at).toBe(offer.respondBy);
    expect(offer.respondBy - sim.now).toBeLessThanOrEqual(COUNTER_DAYS * MS_DAY + MS_HOUR);
  });
});
