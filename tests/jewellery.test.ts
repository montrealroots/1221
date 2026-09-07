/**
 * The jeweller's, and having a piece made.
 *
 * Two things are held here. That the money is safe: a deposit is taken once, a
 * balance is settled once, exactly one piece is created, and a retried request
 * cannot do any of it twice. And that the room is honest: the awkward facts
 * about a stone or a metal are said before the money moves, never after, and
 * saying them never blocks the order.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { placesIn } from '@/engine/content/places';
import { SLOTS } from '@/engine/content/wardrobe';
import {
  CLARITIES, COLOUR_GRADES, CUTS, METALS, PIECE_KINDS, SETTINGS, STONES, metalOf, stoneOf,
} from '@/engine/content/jewellery';
import {
  DEPOSIT_SHARE, REFUNDABLE_DAYS, cautionsFor, commissionsOf, describeSpec, isJeweller,
  jewellerAt, quoteFor, standingAt, type Spec,
} from '@/engine/systems/jewellery';

beforeAll(async () => { await loadAllSections(); });

function aLife(seed = 'jewel'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 500_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

/** The bench in the city the player is standing in. */
function benchIn(sim: Simulation) {
  const place = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'jeweller');
  expect(place, 'no bench jeweller in this city').toBeDefined();
  return place!;
}

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown>): R {
  const result = sim.execute<R>({ kind, payload });
  if (!result.ok) throw new Error(`${kind}: ${result.error}`);
  return result.value!;
}

const A_RING: Spec = {
  piece: 'engagement_ring', metal: 'platinum', stone: 'diamond',
  carats: 1.5, cut: 'round', colourGrade: 'g', clarity: 'vs1', setting: 'six_claw',
};

function balanceOf(sim: Simulation): number {
  return sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
}

describe('the room itself', () => {
  it('puts a bench jeweller in every city, and knows a maison when it sees one', () => {
    const sim = aLife();
    const here = placesIn(sim.player.currentLocationId);
    const bench = here.filter((p) => p.kind === 'jeweller');
    expect(bench.length, 'no independent bench').toBeGreaterThanOrEqual(1);
    expect(isJeweller(bench[0])).toBe(true);

    // A real house on the street is a jeweller too; a supermarket is not.
    const houses = here.filter((p) => isJeweller(p) && p.retailerId);
    expect(houses.length, 'no named jeweller trades here').toBeGreaterThan(0);
    const market = here.find((p) => p.kind === 'market');
    if (market) expect(isJeweller(market)).toBe(false);
  });

  it('has the same person behind the counter every time you come in', () => {
    const sim = aLife();
    const place = benchIn(sim);
    expect(jewellerAt(sim, place).id).toBe(jewellerAt(sim, place).id);
  });

  it('remembers your face after a few visits, and not before', () => {
    const sim = aLife();
    const place = benchIn(sim);
    expect(standingAt(sim, place).regular).toBe(false);
    for (let i = 0; i < 3; i++) must(sim, 'jewel.look', { placeId: place.id });
    const standing = standingAt(sim, place);
    expect(standing.visits).toBeGreaterThanOrEqual(3);
    expect(standing.regular).toBe(true);
  });
});

describe('the quote', () => {
  it('adds up: metal, stone and the bench, and nothing hidden', () => {
    const sim = aLife();
    const quote = quoteFor(benchIn(sim), A_RING);
    expect(quote.total).toBe(quote.metalCost + quote.stoneCost + quote.labour);
    expect(quote.metalCost).toBeGreaterThan(0);
    expect(quote.stoneCost).toBeGreaterThan(0);
    expect(quote.labour).toBeGreaterThan(0);
    expect(quote.weeks).toBeGreaterThanOrEqual(2);
  });

  it('charges more for a better stone and more again for a bigger one', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const plain = quoteFor(place, { ...A_RING, colourGrade: 'k', clarity: 'si2' });
    const fine = quoteFor(place, { ...A_RING, colourGrade: 'd', clarity: 'vvs1' });
    expect(fine.stoneCost).toBeGreaterThan(plain.stoneCost);

    const small = quoteFor(place, { ...A_RING, carats: 0.5 });
    const large = quoteFor(place, { ...A_RING, carats: 2 });
    expect(large.stoneCost).toBeGreaterThan(small.stoneCost * 4);
  });

  it('charges less for a grown stone than a mined one of the same grade', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const mined = quoteFor(place, A_RING);
    const grown = quoteFor(place, { ...A_RING, stone: 'lab_diamond' });
    expect(grown.stoneCost).toBeLessThan(mined.stoneCost);
    // Same stone chemically, so the metal and the bench cost exactly the same.
    expect(grown.metalCost).toBe(mined.metalCost);
    expect(grown.labour).toBe(mined.labour);
  });

  it('charges for two of everything when the piece is a pair', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const one = quoteFor(place, { ...A_RING, piece: 'pendant', setting: 'bezel' });
    const two = quoteFor(place, { ...A_RING, piece: 'stud_earrings', setting: 'bezel' });
    expect(two.stoneCost).toBeGreaterThan(one.stoneCost);
  });

  it('asks a house more for the same piece than a bench asks', () => {
    const sim = aLife();
    const bench = benchIn(sim);
    const house = placesIn(sim.player.currentLocationId)
      .filter((p) => isJeweller(p) && p.retailerId)
      .sort((a, b) => b.quality - a.quality)[0]!;
    expect(quoteFor(house, A_RING).labour).toBeGreaterThan(quoteFor(bench, A_RING).labour);
  });

  it('costs nothing and commits to nothing', () => {
    const sim = aLife();
    const before = balanceOf(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: benchIn(sim).id, ...A_RING });
    expect(balanceOf(sim), 'a quote took money').toBe(before);
    expect(sim.universe.commissions![made.commissionId]!.status).toBe('quoted');
  });
});

describe('what the jeweller says before you pay', () => {
  it('warns that titanium cannot be sized', () => {
    const notes = cautionsFor({ ...A_RING, metal: 'titanium' });
    expect(notes.some((n) => /cannot be sized/i.test(n))).toBe(true);
  });

  it('warns that an eternity band cannot be sized either', () => {
    const notes = cautionsFor({ ...A_RING, piece: 'eternity_band' });
    expect(notes.some((n) => /all the way round/i.test(n))).toBe(true);
  });

  it('warns that a soft stone in a ring will scuff, and says how soft', () => {
    const notes = cautionsFor({ ...A_RING, stone: 'opal' });
    expect(notes.some((n) => /Mohs/.test(n))).toBe(true);
  });

  it('warns that an emerald is oiled and hates an ultrasonic', () => {
    const notes = cautionsFor({ ...A_RING, stone: 'emerald' });
    expect(notes.some((n) => /oiled/i.test(n) && /ultrasonic/i.test(n))).toBe(true);
  });

  it('says nothing at all when there is nothing to say', () => {
    expect(cautionsFor({
      piece: 'wedding_band', metal: 'platinum', stone: 'none', carats: 0,
      cut: 'round', setting: 'plain',
    })).toEqual([]);
  });

  it('never refuses the order it just warned about', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const spec = { ...A_RING, metal: 'titanium', stone: 'pearl', setting: 'tension' };
    expect(cautionsFor(spec).length).toBeGreaterThan(2);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...spec });
    expect(sim.execute({ kind: 'jewel.approve', payload: { commissionId: made.commissionId } }).ok).toBe(true);
  });
});

describe('having it made', () => {
  it('takes a deposit, sets a date, and takes the deposit exactly once', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string; quote: { total: number } }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });

    const before = balanceOf(sim);
    const first = must<{ deposit: number; balance: number; readyAt: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    expect(first.deposit).toBe(Math.round(made.quote.total * DEPOSIT_SHARE));
    expect(balanceOf(sim)).toBe(before - first.deposit);

    // The retried click. Same numbers back, no second charge.
    const again = must<{ deposit: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    expect(again.deposit).toBe(first.deposit);
    expect(balanceOf(sim), 'the deposit was taken twice').toBe(before - first.deposit);
  });

  it('is not ready before it is ready, and says so rather than handing it over', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    must(sim, 'jewel.approve', { commissionId: made.commissionId });
    const early = sim.execute({ kind: 'jewel.collect', payload: { commissionId: made.commissionId } });
    expect(early.ok).toBe(false);
    expect(early.error).toMatch(/not finished/i);
  });

  it('finishes on the day it said, tells you, and hands over one piece for the balance', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string; quote: { total: number } }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    const ordered = must<{ readyAt: number; balance: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });

    sim.advanceTo(ordered.readyAt + MS_DAY);
    expect(sim.universe.commissions![made.commissionId]!.status).toBe('ready');
    expect(sim.universe.notifications.some((n) => /Your Piece Is Ready/i.test(n.title))).toBe(true);

    const assetsBefore = Object.keys(sim.universe.assets).length;
    const before = balanceOf(sim);
    const got = must<{ assetId: string; paid: number }>(sim, 'jewel.collect', { commissionId: made.commissionId });
    expect(got.paid).toBe(ordered.balance);
    expect(balanceOf(sim)).toBe(before - ordered.balance);
    expect(Object.keys(sim.universe.assets).length).toBe(assetsBefore + 1);

    const asset = sim.universe.assets[got.assetId]!;
    expect(asset.ownerId).toBe(sim.player.id);
    expect(asset.bespoke, 'the piece does not know what it is').toBeDefined();
    expect(asset.bespoke!.carats).toBe(A_RING.carats);
    expect(SLOTS).toContain(asset.wardrobe!.slot);
    expect(asset.wardrobe!.slot).toBe('ring');
  });

  it('does not make a second one, or charge again, if you collect twice', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    const ordered = must<{ readyAt: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    sim.advanceTo(ordered.readyAt + MS_DAY);

    const first = must<{ assetId: string }>(sim, 'jewel.collect', { commissionId: made.commissionId });
    const count = Object.keys(sim.universe.assets).length;
    const balance = balanceOf(sim);
    const second = must<{ assetId: string; paid: number }>(sim, 'jewel.collect', { commissionId: made.commissionId });
    expect(second.assetId).toBe(first.assetId);
    expect(second.paid).toBe(0);
    expect(Object.keys(sim.universe.assets).length).toBe(count);
    expect(balanceOf(sim)).toBe(balance);
  });

  it('is worth less the day you walk out with it, which is what bespoke does', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    const ordered = must<{ readyAt: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    sim.advanceTo(ordered.readyAt + MS_DAY);
    const got = must<{ assetId: string }>(sim, 'jewel.collect', { commissionId: made.commissionId });
    const asset = sim.universe.assets[got.assetId]!;
    expect(asset.currentValue).toBeLessThan(asset.purchasePrice);
  });

  it('cuts your words into it and keeps them on the record', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', {
      placeId: place.id, ...A_RING, engraving: 'Nine Years, And The Rest',
    });
    const ordered = must<{ readyAt: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    sim.advanceTo(ordered.readyAt + MS_DAY);
    const got = must<{ assetId: string }>(sim, 'jewel.collect', { commissionId: made.commissionId });
    const asset = sim.universe.assets[got.assetId]!;
    expect(asset.bespoke!.engraving).toBe('Nine Years, And The Rest');
    expect(asset.provenance.some((p) => /Nine Years/.test(p.note))).toBe(true);
  });
});

describe('typing the engraving, which is words rather than a choice', () => {
  function atTheCounter(sim: Simulation) {
    const place = benchIn(sim);
    must(sim, 'go.to', { placeId: place.id, mode: 'taxi' });
    must(sim, 'scene.start', { definitionId: 'life.jeweller', input: { placeId: place.id } });
    return place;
  }

  /** The live session, so a choice can carry the revision the runtime wants. */
  function live(sim: Simulation) {
    const scenes = sim.universe.scenes!;
    return scenes.sessions[scenes.activeId!]!;
  }

  function pick(sim: Simulation, choiceId: string) {
    const session = live(sim);
    return must(sim, 'scene.choose', { sceneId: session.id, revision: session.revision, choiceId });
  }

  function type(sim: Simulation, text: string) {
    const session = live(sim);
    return sim.execute<{ unsupported?: boolean }>({
      kind: 'scene.choose',
      payload: { sceneId: session.id, revision: session.revision, text },
    });
  }

  it('takes what you type at the engraving step and cuts it into the piece', () => {
    const sim = aLife();
    atTheCounter(sim);
    pick(sim, 'design');
    pick(sim, 'piece:wedding_band');
    pick(sim, 'metal:platinum');
    // A wedding band takes no stone, so the scene goes straight to the setting.
    pick(sim, 'skip_stone');
    pick(sim, 'setting:plain');

    // Nothing on screen says this. It is words, and they are the answer.
    const out = type(sim, 'Whatever The Weather');
    expect(out.ok, out.error).toBe(true);
    expect(live(sim).context['engraving']).toBe('Whatever The Weather');
    expect(live(sim).node).toBe('quote');
  });

  it('still turns away words at a step that did not ask for any', () => {
    const sim = aLife();
    atTheCounter(sim);
    const out = type(sim, 'sell me the moon');
    expect(out.ok).toBe(true);
    expect(out.value!.unsupported, 'prose reached a step that never asked for it').toBe(true);
  });
});

describe('changing your mind', () => {
  it('gives the deposit back before the bench has started', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    const ordered = must<{ deposit: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    const before = balanceOf(sim);
    const out = must<{ refunded: number }>(sim, 'jewel.cancel', { commissionId: made.commissionId });
    expect(out.refunded).toBe(ordered.deposit);
    expect(balanceOf(sim)).toBe(before + ordered.deposit);
  });

  it('keeps it once the metal has been bought, and says why', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    must(sim, 'jewel.approve', { commissionId: made.commissionId });
    sim.advanceTo(sim.now + (REFUNDABLE_DAYS + 2) * MS_DAY);
    const out = must<{ refunded: number; kept: number }>(sim, 'jewel.cancel', { commissionId: made.commissionId });
    expect(out.refunded).toBe(0);
    expect(out.kept).toBeGreaterThan(0);
    expect(sim.universe.commissions![made.commissionId]!.cancelledReason).toMatch(/did not come back/i);
  });

  it('cancels once, and cancelling again does nothing at all', () => {
    const sim = aLife();
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    must(sim, 'jewel.approve', { commissionId: made.commissionId });
    must(sim, 'jewel.cancel', { commissionId: made.commissionId });
    const balance = balanceOf(sim);
    const again = must<{ refunded: number }>(sim, 'jewel.cancel', { commissionId: made.commissionId });
    expect(again.refunded).toBe(0);
    expect(balanceOf(sim)).toBe(balance);
  });
});

describe('what else a jeweller does', () => {
  function aPiece(sim: Simulation, spec: Spec = A_RING): string {
    const place = benchIn(sim);
    const made = must<{ commissionId: string }>(sim, 'jewel.commission', { placeId: place.id, ...spec });
    const ordered = must<{ readyAt: number }>(sim, 'jewel.approve', { commissionId: made.commissionId });
    sim.advanceTo(ordered.readyAt + MS_DAY);
    return must<{ assetId: string }>(sim, 'jewel.collect', { commissionId: made.commissionId }).assetId;
  }

  it('sizes a ring, and takes it away while it does', () => {
    const sim = aLife();
    const assetId = aPiece(sim);
    const out = must<{ cost: number; readyAt: number }>(sim, 'jewel.resize', { placeId: benchIn(sim).id, assetId });
    expect(out.cost).toBeGreaterThan(0);
    expect(sim.universe.assets[assetId]!.wardrobe!.awayUntil).toBe(out.readyAt);
  });

  it('refuses to size a metal it told you it could not size', () => {
    const sim = aLife();
    const assetId = aPiece(sim, { ...A_RING, metal: 'titanium' });
    const out = sim.execute({ kind: 'jewel.resize', payload: { placeId: benchIn(sim).id, assetId } });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/cannot be sized/i);
  });

  it('repairs a worn piece, and it comes back better than it went', () => {
    const sim = aLife();
    const assetId = aPiece(sim);
    sim.universe.assets[assetId]!.condition = 46;
    const out = must<{ readyAt: number }>(sim, 'jewel.repair', { placeId: benchIn(sim).id, assetId });
    expect(sim.universe.assets[assetId]!.wardrobe!.awayUntil).toBe(out.readyAt);
    sim.advanceTo(out.readyAt + MS_DAY);
    expect(sim.universe.assets[assetId]!.condition).toBeGreaterThan(46);
    expect(sim.universe.assets[assetId]!.wardrobe!.awayUntil).toBeUndefined();
  });

  it('will not put an emerald in an ultrasonic, and says so instead of doing it', () => {
    const sim = aLife();
    const hardy = aPiece(sim);
    const delicate = aPiece(sim, { ...A_RING, stone: 'emerald' });
    const place = benchIn(sim);
    expect(must<{ refused?: string }>(sim, 'jewel.clean', { placeId: place.id, assetId: hardy }).refused).toBeUndefined();
    const soft = must<{ refused?: string }>(sim, 'jewel.clean', { placeId: place.id, assetId: delicate });
    expect(soft.refused).toMatch(/ultrasonic/i);
  });

  it('writes a valuation for an insurer, and is straight that it is not a resale price', () => {
    const sim = aLife();
    const assetId = aPiece(sim);
    const out = must<{ valuation: number; note: string }>(sim, 'jewel.appraise', { placeId: benchIn(sim).id, assetId });
    expect(out.valuation).toBeGreaterThan(sim.universe.assets[assetId]!.currentValue);
    expect(out.note).toMatch(/not what it would fetch/i);
    expect(sim.universe.assets[assetId]!.provenance.some((p) => /Valued for insurance/.test(p.note))).toBe(true);
  });

  it('engraves something you already own', () => {
    const sim = aLife();
    const assetId = aPiece(sim);
    must(sim, 'jewel.engrave', { placeId: benchIn(sim).id, assetId, text: 'For M' });
    expect(sim.universe.assets[assetId]!.bespoke!.engraving).toBe('For M');
  });

  it('will not touch something that is not yours', () => {
    const sim = aLife();
    const other = Object.values(sim.universe.assets).find((a) => a.ownerId !== sim.player.id);
    if (!other) return;
    const out = sim.execute({ kind: 'jewel.clean', payload: { placeId: benchIn(sim).id, assetId: other.id } });
    expect(out.ok).toBe(false);
  });
});

describe('the vocabulary is the real one', () => {
  it('uses the GIA scales as published, D to Z and Flawless to Included', () => {
    expect(COLOUR_GRADES[0]!.name).toBe('D');
    expect(COLOUR_GRADES[0]!.band).toBe('Colourless');
    expect(CLARITIES.map((c) => c.name)).toEqual(['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']);
    // Better grades cost more, all the way down both scales.
    for (let i = 1; i < COLOUR_GRADES.length; i++) {
      expect(COLOUR_GRADES[i]!.factor).toBeLessThan(COLOUR_GRADES[i - 1]!.factor);
    }
    for (let i = 1; i < CLARITIES.length; i++) {
      expect(CLARITIES[i]!.factor).toBeLessThan(CLARITIES[i - 1]!.factor);
    }
  });

  it('gets the hardness and the fineness right', () => {
    expect(stoneOf('diamond').mohs).toBe(10);
    expect(stoneOf('ruby').mohs).toBe(9);
    expect(stoneOf('sapphire').mohs).toBe(9);
    expect(metalOf('gold_18').fineness).toBe(750);
    expect(metalOf('gold_14').fineness).toBe(585);
    expect(metalOf('gold_9').fineness).toBe(375);
    expect(metalOf('silver').fineness).toBe(925);
    expect(metalOf('platinum').fineness).toBe(950);
  });

  it('offers enough to design with, and hangs every piece on a real peg', () => {
    expect(PIECE_KINDS.length).toBeGreaterThanOrEqual(15);
    expect(METALS.length).toBeGreaterThanOrEqual(10);
    expect(STONES.length).toBeGreaterThanOrEqual(15);
    expect(CUTS.length).toBeGreaterThanOrEqual(10);
    expect(SETTINGS.length).toBeGreaterThanOrEqual(10);
    for (const piece of PIECE_KINDS) expect(SLOTS, piece.id).toContain(piece.slot);
  });

  it('describes a piece the way a valuation would', () => {
    const text = describeSpec(A_RING);
    expect(text).toMatch(/Platinum/);
    expect(text).toMatch(/1\.50 carat/);
    expect(text).toMatch(/round brilliant/i);
    expect(text).toMatch(/G VS1/);
  });

  it('keeps every commission it has ever quoted you, newest first', () => {
    const sim = aLife();
    const place = benchIn(sim);
    must(sim, 'jewel.commission', { placeId: place.id, ...A_RING });
    sim.advanceTo(sim.now + MS_DAY);
    must(sim, 'jewel.commission', { placeId: place.id, ...A_RING, piece: 'pendant' });
    const mine = commissionsOf(sim, sim.player.id);
    expect(mine).toHaveLength(2);
    expect(mine[0]!.quotedAt).toBeGreaterThanOrEqual(mine[1]!.quotedAt);
  });
});
