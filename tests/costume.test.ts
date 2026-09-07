/**
 * The costume house, the tailor, and your own machine.
 *
 * Three things are held here. That the money is safe: a deposit is taken once,
 * a balance is settled once, exactly one garment is created, and a retried
 * request cannot do any of it twice. That the room is honest: the awkward
 * facts about a cloth are said before the money moves, never after, and saying
 * them never blocks the order. And that making one yourself is real work:
 * it needs a machine and cloth you actually own, it consumes the cloth once,
 * and how it comes out depends on your hands.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { placesIn } from '@/engine/content/places';
import { SLOTS } from '@/engine/content/wardrobe';
import { CLOTHS, FINISHES, GARMENT_KINDS, clothOf, garmentKindOf } from '@/engine/content/costume';
import {
  ALTERATIONS, DEPOSIT_SHARE, REFUNDABLE_DAYS, cautionsFor, costumesOf, cutterAt,
  describeSpec, houseQuality, isCostumier, quoteFor, readinessFor, selfQuality,
  standingAt, type Spec,
} from '@/engine/systems/costume';

beforeAll(async () => { await loadAllSections(); });

function aLife(seed = 'costume'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 500_000_00, 'Test funding', 'other');
  must(sim, 'co.set_draw', { amount: 0 });
  return sim;
}

/** The workroom in the city the player is standing in. */
function roomIn(sim: Simulation) {
  const place = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'costumier');
  expect(place, 'no costume house in this city').toBeDefined();
  return place!;
}

/** Run a command and insist it worked, the way the UI's own path does. */
function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown>): R {
  const result = sim.execute<R>({ kind, payload });
  if (!result.ok) throw new Error(`${kind}: ${result.error}`);
  return result.value!;
}

/** The error a command refused with, or undefined if it did not refuse. */
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown>): string | undefined {
  const result = sim.execute({ kind, payload });
  return result.ok ? undefined : result.error;
}

const A_JACKET = { kind: 'jacket', cloth: 'wool_suiting', finish: 'half_canvas' } satisfies Spec & Record<string, unknown>;

/** Put a machine and some cloth in the player's hands, the way buying would. */
function stock(sim: Simulation, clothId: string, yards: number): void {
  const machineId = sim.nextId('asset');
  sim.universe.assets[machineId] = {
    id: machineId, saveId: sim.universe.meta.id, ownerId: sim.player.id, ownerKind: 'person',
    name: 'Juki DDL-8700 Industrial Straight Stitch', brand: 'Juki', category: 'other',
    purchasePrice: 1_099_00, currentValue: 1_099_00, condition: 100, acquiredAt: sim.now,
    acquiredVia: 'purchase', tags: ['haberdashery', 'machine'],
  } as never;
  const id = sim.nextId('asset');
  sim.universe.assets[id] = {
    id, saveId: sim.universe.meta.id, ownerId: sim.player.id, ownerKind: 'person',
    name: `${clothOf(clothId).name} By The Yard`, brand: 'Mood Fabrics', category: 'other',
    purchasePrice: 42_00, currentValue: 42_00, condition: 100, acquiredAt: sim.now,
    acquiredVia: 'purchase', tags: ['haberdashery', 'fabric', clothId], quantity: yards,
  } as never;
}

describe('the workroom as data', () => {
  it('hangs every garment kind on a peg the wardrobe actually has', () => {
    for (const kind of GARMENT_KINDS) {
      expect(SLOTS as readonly string[], `${kind.name} has no peg`).toContain(kind.slot);
    }
  });

  it('gives every cloth a hand, an effort and a durability that mean something', () => {
    for (const cloth of CLOTHS) {
      expect(cloth.hand.length, cloth.name).toBeGreaterThan(6);
      expect(cloth.effort).toBeGreaterThanOrEqual(1);
      expect(cloth.durability).toBeGreaterThan(0);
      expect(cloth.durability).toBeLessThanOrEqual(100);
    }
  });

  it('has no two garment kinds, cloths or finishes sharing an id', () => {
    for (const list of [GARMENT_KINDS, CLOTHS, FINISHES]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('charges more for harder cloth and more finishing', () => {
    const plain = quoteFor(undefined, { kind: 'jacket', cloth: 'cotton_twill', finish: 'machine' });
    const dear = quoteFor(undefined, { kind: 'jacket', cloth: 'cashmere', finish: 'full_canvas' });
    expect(dear.total).toBeGreaterThan(plain.total);
    expect(dear.clothCost).toBeGreaterThan(plain.clothCost);
    expect(dear.labour).toBeGreaterThan(plain.labour);
  });
});

describe('what the cutter says before you pay', () => {
  it('warns about chiffon without refusing to cut it', () => {
    const cautions = cautionsFor({ kind: 'evening_gown', cloth: 'silk_chiffon', finish: 'french_seams' });
    expect(cautions.join(' ')).toMatch(/paper|slowly/i);
    expect(quoteFor(undefined, { kind: 'evening_gown', cloth: 'silk_chiffon', finish: 'french_seams' }).total)
      .toBeGreaterThan(0);
  });

  it('says leather keeps every hole you put in it', () => {
    expect(cautionsFor({ kind: 'blouson', cloth: 'leather', finish: 'machine' }).join(' '))
      .toMatch(/unpicked|hole/i);
  });

  it('says boning on the wrong garment will read as armor', () => {
    expect(cautionsFor({ kind: 'trousers', cloth: 'wool_suiting', finish: 'boned' }).join(' '))
      .toMatch(/armor/i);
  });

  it('says nothing awkward about a plain cotton shirt', () => {
    expect(cautionsFor({ kind: 'shirt', cloth: 'cotton_shirting', finish: 'machine' })).toHaveLength(0);
  });

  it('never refuses an order, however bad the idea', () => {
    for (const cloth of CLOTHS) {
      for (const kind of ['creature_suit', 'dinner_suit', 'corset']) {
        const quote = quoteFor(undefined, { kind, cloth: cloth.id, finish: 'beaded' });
        expect(quote.total, `${kind} in ${cloth.name}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('having something cut', () => {
  it('quotes without charging anything', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    must(sim, 'costume.commission', { placeId: room.id, ...A_JACKET });
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before);
  });

  it('takes the deposit exactly once, however many times you approve', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const { costumeId, quote } = must<{ costumeId: string; quote: { total: number } }>(sim, 'costume.commission', { placeId: room.id, ...A_JACKET });
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    must(sim, 'costume.approve', { costumeId });
    const afterFirst = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    must(sim, 'costume.approve', { costumeId });
    must(sim, 'costume.approve', { costumeId });
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(afterFirst);
    expect(before - afterFirst).toBe(Math.round(quote.total * DEPOSIT_SHARE));
  });

  it('creates exactly one garment however many times you collect', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const { costumeId } = must<{ costumeId: string }>(sim, 'costume.commission', { placeId: room.id, ...A_JACKET });
    must(sim, 'costume.approve', { costumeId });
    sim.advanceTo(sim.now + 400 * MS_DAY);
    const first = must<{ assetId: string; paid: number }>(sim, 'costume.collect', { costumeId });
    const again = must<{ assetId: string; paid: number }>(sim, 'costume.collect', { costumeId });
    expect(again.assetId).toBe(first.assetId);
    expect(again.paid).toBe(0);
    const mine = Object.values(sim.universe.assets).filter((a) => a.ownerId === sim.player.id && a.tags?.includes('made to measure'));
    expect(mine).toHaveLength(1);
  });

  it('puts the finished garment in the wardrobe on the right peg', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const { costumeId } = must<{ costumeId: string }>(sim, 'costume.commission', { placeId: room.id, kind: 'overcoat', cloth: 'wool_melton', finish: 'hand_finished' });
    must(sim, 'costume.approve', { costumeId });
    sim.advanceTo(sim.now + 400 * MS_DAY);
    const { assetId } = must<{ assetId: string }>(sim, 'costume.collect', { costumeId });
    const asset = sim.universe.assets[assetId]!;
    expect(asset.wardrobe?.slot).toBe('outerwear');
    expect(asset.wardrobe?.material).toBe('wool');
    expect(asset.wardrobe?.fit).toBeGreaterThan(0);
    expect(asset.provenance?.some((p) => /calibration/i.test(p.note))).toBe(true);
  });

  it('refunds the deposit before the cloth is cut and not after', () => {
    const early = aLife('early');
    const room = roomIn(early);
    const a = must<{ costumeId: string }>(early, 'costume.commission', { placeId: room.id, ...A_JACKET });
    must(early, 'costume.approve', { costumeId: a.costumeId });
    expect(must<{ refunded: number }>(early, 'costume.cancel', { costumeId: a.costumeId }).refunded)
      .toBeGreaterThan(0);

    const late = aLife('late');
    const room2 = roomIn(late);
    const b = must<{ costumeId: string }>(late, 'costume.commission', { placeId: room2.id, ...A_JACKET });
    must(late, 'costume.approve', { costumeId: b.costumeId });
    late.advanceTo(late.now + (REFUNDABLE_DAYS + 3) * MS_DAY);
    expect(must<{ refunded: number }>(late, 'costume.cancel', { costumeId: b.costumeId }).refunded)
      .toBe(0);
  });

  it('cancels idempotently', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const { costumeId } = must<{ costumeId: string }>(sim, 'costume.commission', { placeId: room.id, ...A_JACKET });
    must(sim, 'costume.approve', { costumeId });
    const first = must<{ refunded: number }>(sim, 'costume.cancel', { costumeId });
    const second = must<{ refunded: number }>(sim, 'costume.cancel', { costumeId });
    expect(second.refunded).toBe(0);
    expect(first.refunded).toBeGreaterThan(0);
  });
});

describe('fittings, which are the point', () => {
  it('counts fittings and stops at the number the workroom wanted', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const { costumeId, quote } = must<{ costumeId: string; quote: { fittings: number } }>(sim, 'costume.commission', { placeId: room.id, ...A_JACKET });
    must(sim, 'costume.approve', { costumeId });
    for (let i = 0; i < quote.fittings + 2; i++) {
      must(sim, 'costume.fitting', { costumeId });
    }
    expect(costumesOf(sim, sim.player.id)[0]!.fittingsDone).toBe(quote.fittings);
  });

  it('fits worse when you skip them, and says so rather than hiding it', () => {
    const attended = aLife('attend');
    const roomA = roomIn(attended);
    const a = must<{ costumeId: string; quote: { fittings: number } }>(attended, 'costume.commission', { placeId: roomA.id, ...A_JACKET });
    must(attended, 'costume.approve', { costumeId: a.costumeId });
    for (let i = 0; i < a.quote.fittings; i++) {
      must(attended, 'costume.fitting', { costumeId: a.costumeId });
    }
    attended.advanceTo(attended.now + 400 * MS_DAY);
    const good = must<{ quality: number }>(attended, 'costume.collect', { costumeId: a.costumeId });

    const skipped = aLife('attend');
    const roomB = roomIn(skipped);
    const b = must<{ costumeId: string }>(skipped, 'costume.commission', { placeId: roomB.id, ...A_JACKET });
    must(skipped, 'costume.approve', { costumeId: b.costumeId });
    skipped.advanceTo(skipped.now + 400 * MS_DAY);
    const worse = must<{ quality: number }>(skipped, 'costume.collect', { costumeId: b.costumeId });

    expect(worse.quality).toBeLessThan(good.quality);
  });
});

describe('making it yourself', () => {
  it('will not start without a machine and enough cloth, and says which', () => {
    const sim = aLife();
    const ready = readinessFor(sim, sim.player.id, A_JACKET);
    expect(ready.ready).toBe(false);
    expect(ready.missing.join(' ')).toMatch(/machine/i);
    expect(() => must(sim, 'costume.make', A_JACKET)).toThrow(/machine/i);
  });

  it('names the cloth it is short of, by the yard', () => {
    const sim = aLife();
    stock(sim, 'wool_suiting', 1);
    const ready = readinessFor(sim, sim.player.id, A_JACKET);
    expect(ready.ready).toBe(false);
    expect(ready.missing.join(' ')).toMatch(/wool suiting/i);
    expect(ready.yardsOwned).toBe(1);
  });

  it('makes one garment, consumes the cloth once, and spends the hours', () => {
    const sim = aLife();
    stock(sim, 'wool_suiting', 20);
    const before = sim.now;
    const made = must<{ assetId: string; quality: number; hours: number }>(sim, 'costume.make', A_JACKET);
    expect(sim.now).toBeGreaterThan(before);
    expect(made.hours).toBeGreaterThan(0);
    const asset = sim.universe.assets[made.assetId]!;
    expect(asset.tags).toContain('self made');
    expect(asset.wardrobe?.slot).toBe('top');
    const left = readinessFor(sim, sim.player.id, A_JACKET).yardsOwned;
    expect(left).toBe(20 - Math.ceil(garmentKindOf('jacket').yards * 1.15));
  });

  it('costs nothing at the till, because you already bought the cloth', () => {
    const sim = aLife();
    stock(sim, 'cotton_shirting', 20);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    must(sim, 'costume.make', { kind: 'shirt', cloth: 'cotton_shirting', finish: 'machine' });
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before);
  });

  it('comes out better in a skilled pair of hands, and worse on a harder garment', () => {
    const sim = aLife();
    const person = sim.universe.people[sim.player.id]!;
    person.skills['costume_design'] = 15;
    const novice = selfQuality(sim, sim.player.id, A_JACKET);
    person.skills['costume_design'] = 92;
    const expert = selfQuality(sim, sim.player.id, A_JACKET);
    expect(expert).toBeGreaterThan(novice);
    expect(selfQuality(sim, sim.player.id, { kind: 'tee', cloth: 'jersey', finish: 'machine' }))
      .toBeGreaterThan(selfQuality(sim, sim.player.id, { kind: 'dinner_suit', cloth: 'silk_velvet', finish: 'full_canvas' }));
  });

  it('does not make two garments from one lot of cloth when there is only enough for one', () => {
    const sim = aLife();
    stock(sim, 'wool_suiting', 4);
    must(sim, 'costume.make', A_JACKET);
    expect(() => must(sim, 'costume.make', A_JACKET)).toThrow(/yard/i);
  });
});

describe('the tailor', () => {
  it('moves the fit and writes what it did on the garment', () => {
    const sim = aLife();
    stock(sim, 'cotton_shirting', 20);
    const made = must<{ assetId: string }>(sim, 'costume.make', { kind: 'shirt', cloth: 'cotton_shirting', finish: 'machine' });
    const room = roomIn(sim);
    const before = sim.universe.assets[made.assetId]!.wardrobe!.fit!;
    const result = must<{ cost: number; fit: number }>(sim, 'costume.alter', { placeId: room.id, assetId: made.assetId, change: 'take_in' });
    expect(result.cost).toBeGreaterThan(0);
    expect(result.fit).toBeGreaterThan(before);
    expect(sim.universe.assets[made.assetId]!.provenance?.some((p) => /Take In/.test(p.note))).toBe(true);
  });

  it('will not alter something you do not own', () => {
    const sim = aLife();
    const room = roomIn(sim);
    expect(refusal(sim, 'costume.alter', { placeId: room.id, assetId: 'nope', change: 'take_in' }))
      .toMatch(/own/i);
  });

  it('offers alterations a real tailor would actually do', () => {
    for (const a of ALTERATIONS) {
      expect(a.hours).toBeGreaterThan(0);
      expect(a.note.length).toBeGreaterThan(20);
    }
    expect(ALTERATIONS.find((a) => a.id === 'let_out')!.note).toMatch(/seam allowance/i);
  });
});

describe('the room itself', () => {
  it('knows a costume house when it is standing in one', () => {
    const sim = aLife();
    expect(isCostumier(roomIn(sim))).toBe(true);
    expect(isCostumier(placesIn(sim.player.currentLocationId).find((p) => p.kind === 'cafe'))).toBe(false);
  });

  it('keeps the same cutter across visits', () => {
    const sim = aLife();
    const room = roomIn(sim);
    expect(cutterAt(sim, room).id).toBe(cutterAt(sim, room).id);
  });

  it('remembers you after enough visits', () => {
    const sim = aLife();
    const room = roomIn(sim);
    expect(standingAt(sim, room).regular).toBe(false);
    for (let i = 0; i < 6; i++) must(sim, 'costume.look', { placeId: room.id });
    expect(standingAt(sim, room).regular).toBe(true);
  });

  it('describes a garment the way a docket would', () => {
    expect(describeSpec(A_JACKET)).toMatch(/wool suiting tailored jacket/i);
    expect(describeSpec({ kind: 'shirt', cloth: 'linen', finish: 'machine' })).toBe('Linen shirt');
  });

  it('scores a house-made garment higher in a dearer room', () => {
    const sim = aLife();
    const room = roomIn(sim);
    const costume = {
      cloth: 'wool_suiting', finish: 'full_canvas', fittingsWanted: 3, fittingsDone: 3,
    } as never;
    expect(houseQuality(room, costume)).toBeGreaterThan(houseQuality(undefined, costume));
  });
});
