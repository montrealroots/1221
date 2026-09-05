/**
 * God mode.
 *
 * Sandbox is a stat editor. God mode is the other half of it: with it on the
 * world stops refusing the player things — every seller takes the offer, every
 * profession opens with no experience spent, and every trait slot is free.
 *
 * The thing these tests care about most is that none of it is hidden. Every
 * override is logged and left in the audit next to the honest number, and a
 * save played this way can be recognised as one.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { PROFESSIONS } from '@/engine/content/professions';
import { ATTRIBUTES, PROFESSION_TRAITS, TRAITS } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { favoured, godMode } from '@/engine/systems/sandbox';

function aGame(seed: string, { god = false } = {}) {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  run('sandbox.toggle', { enabled: true });
  if (god) run('sandbox.god_mode', { enabled: true });
  return { sim, run };
}

describe('turning it on', () => {
  it('will not turn on with sandbox off', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'god-off');
    const refused = sim.execute({ kind: 'sandbox.god_mode', payload: { enabled: true } });
    expect(refused.ok).toBe(false);
    expect(sim.universe.sandbox.godMode).toBe(false);
  });

  it('does everything at once', () => {
    const { sim } = aGame('god-everything', { god: true });
    expect(godMode(sim)).toBe(true);
    for (const attribute of ATTRIBUTES) expect(sim.player.attributes[attribute.id]).toBe(100);
    for (const skill of SKILLS) expect(sim.player.skills[skill.id]).toBe(100);
    // Every trait that does not contradict one already held.
    expect(sim.player.traits.length).toBeGreaterThan(TRAITS.length / 2);
    for (const def of PROFESSIONS) expect(sim.player.professions?.[def.id]).toBeDefined();
    expect(sim.universe.sandbox.allProfessionsUnlocked).toBe(true);
  });

  it('opens every profession without spending the experience', () => {
    const { sim, run } = aGame('god-xp');
    const before = sim.player.industryXp ?? 0;
    const cheapest = Math.min(...PROFESSIONS.map((p) => p.unlockXp));
    expect(before).toBeLessThan(cheapest);
    run('sandbox.unlock_professions');
    expect(sim.player.industryXp ?? 0).toBe(before);
    for (const def of PROFESSIONS) expect(sim.player.professions?.[def.id]).toBeDefined();
  });

  it('turning it off keeps what was given', () => {
    const { sim, run } = aGame('god-off-again', { god: true });
    const traits = sim.player.traits.length;
    run('sandbox.god_mode', { enabled: false });
    expect(godMode(sim)).toBe(false);
    // Unwinding a career is worse than having cheated at one.
    expect(sim.player.traits).toHaveLength(traits);
    for (const def of PROFESSIONS) expect(sim.player.professions?.[def.id]).toBeDefined();
  });

  it('is only kind to the player', () => {
    const { sim } = aGame('god-favoured', { god: true });
    expect(favoured(sim, sim.universe.playerId)).toBe(true);
    const other = Object.values(sim.universe.people).find((p) => p.id !== sim.universe.playerId);
    expect(favoured(sim, other?.id)).toBe(false);
    expect(favoured(sim, undefined)).toBe(false);
  });
});

describe('nothing is refused', () => {
  it('has a seller take an offer they would have laughed at', () => {
    const { sim, run } = aGame('god-offer', { god: true });
    const listing = Object.values(sim.universe.propertyListings).find((l) => l.status === 'active');
    expect(listing, 'the world should have something for sale').toBeDefined();

    // A quarter of the asking price, which no motivated seller takes.
    const lowball = Math.round(listing!.askingPrice * 0.25);
    run('prop.make_offer', { listingId: listing!.id, amount: lowball, financingKind: 'cash' });
    sim.advanceTo(sim.now + 20 * 86_400_000);
    const offer = Object.values(sim.universe.propertyOffers).find((o) => o.propertyId === listing!.propertyId);
    expect(offer).toBeDefined();
    expect(['accepted', 'pending_inspection', 'closing', 'closed']).toContain(offer!.status);
  });

  it('opens a profession trait slot that has not been earned', () => {
    const { sim } = aGame('god-slots', { god: true });
    // A profession that actually has traits to take.
    const def = PROFESSIONS.find((p) => PROFESSION_TRAITS.some((t) => t.profession === p.id))!;
    expect(def, 'some profession should have traits').toBeDefined();
    const traits = PROFESSION_TRAITS.filter((t) => t.profession === def.id);
    // Level one opens one slot; taking more than that is what god mode allows.
    let taken = 0;
    for (const trait of traits) {
      if (sim.execute({ kind: 'profession.pick_trait', payload: { professionId: def.id, traitId: trait.id } }).ok) taken++;
    }
    expect(taken).toBeGreaterThan(1);
    expect(sim.player.professions![def.id]!.traitIds.length).toBe(taken);
  });
});

describe('it never pretends any of it was earned', () => {
  it('writes every override into the log', () => {
    const { sim, run } = aGame('god-log', { god: true });
    const listing = Object.values(sim.universe.propertyListings).find((l) => l.status === 'active')!;
    run('prop.make_offer', { listingId: listing.id, amount: Math.round(listing.askingPrice * 0.25), financingKind: 'cash' });
    sim.advanceTo(sim.now + 20 * 86_400_000);
    expect(sim.universe.sandbox.log.some((entry) => entry.action.startsWith('God mode:'))).toBe(true);
  });

  it('caps the log rather than growing it forever', () => {
    const { sim } = aGame('god-log-cap', { god: true });
    for (let i = 0; i < 500; i++) sim.universe.sandbox.log.push({ at: sim.now, action: `Filler ${i}` });
    sim.execute({ kind: 'sandbox.god_mode', payload: { enabled: false } });
    sim.execute({ kind: 'sandbox.god_mode', payload: { enabled: true } });
    expect(sim.universe.sandbox.log.length).toBeLessThanOrEqual(600);
  });

  it('says so in what the player remembers', () => {
    const { sim } = aGame('god-memory', { god: true });
    const remembered = sim.universe.history.filter((m) => m.title.includes('God Mode'));
    expect(remembered.length).toBeGreaterThan(0);
    expect(remembered[0]!.detail).toMatch(/none of it was earned/i);
  });

  it('survives a save and a load', () => {
    const { sim } = aGame('god-save', { god: true });
    const round = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(validateUniverse(round).ok).toBe(true);
    expect(round.sandbox.godMode).toBe(true);
    expect(round.sandbox.allProfessionsUnlocked).toBe(true);
  });
});

describe('an ordinary save is untouched', () => {
  it('still refuses a lowball', () => {
    const sim: Simulation = quickSave({ wealth: 'modest' }, 'no-god');
    expect(godMode(sim)).toBe(false);
    const listing = Object.values(sim.universe.propertyListings).find((l) => l.status === 'active')!;
    sim.execute({ kind: 'prop.make_offer', payload: { listingId: listing.id, amount: Math.round(listing.askingPrice * 0.25), financingKind: 'cash' } });
    sim.advanceTo(sim.now + 20 * 86_400_000);
    const offer = Object.values(sim.universe.propertyOffers).find((o) => o.propertyId === listing.propertyId);
    if (offer) expect(offer.status).not.toBe('accepted');
    expect(sim.universe.sandbox.log).toEqual([]);
  });
});
