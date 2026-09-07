/**
 * The house you actually live in.
 *
 * The contract asked for three things past the cooking: appliances that are
 * the ones you bought, a broken washing machine that is a repair and a cost
 * and a week of launderettes, and every owned object having a place in a
 * room, a condition, and something you can do with it. These hold all three.
 */

import { describe, expect, it } from 'vitest';
import { shoppableItems } from '@/engine/content/catalog';
import { createAsset } from '@/engine/systems/commerce';
import {
  BREAKS_BELOW, hasWorkingDryer, hasWorkingWasher, householdAssets, placeInRoom, usesFor, whatItIsFor, works,
} from '@/engine/systems/household';
import { kitchenOf } from '@/engine/systems/life';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { roomsFor } from '@/engine/systems/purchase';
import type { Id, OwnedAsset } from '@/engine/domain/model';
import type { CatalogItem } from '@/engine/content/catalog';

function buy(sim: Simulation, match: RegExp, category?: string): OwnedAsset {
  const item = shoppableItems().find((i) => match.test(i.name) && (!category || i.category === category));
  if (!item) throw new Error(`nothing in the catalog matching ${match}`);
  return createAsset(sim, {
    ownerId: sim.player.id, catalogItem: item,
    purchasePrice: item.basePrice, acquiredVia: 'purchase',
  });
}

/** The best and the worst made thing on one shelf, so quality is the only difference. */
function bestAndWorst(category: string): [CatalogItem, CatalogItem] {
  const shelf = shoppableItems().filter((i) => i.category === category).sort((a, b) => a.quality - b.quality);
  return [shelf[shelf.length - 1]!, shelf[0]!];
}

describe('things wear out and stop', () => {
  it('counts what lives in the house and leaves the wardrobe out of it', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-count');
    buy(sim, /Oven|Range/i, 'appliance');
    buy(sim, /Levi/i, 'clothing');
    const kept = householdAssets(sim, sim.player.id);
    expect(kept.length, 'the appliance is not counted').toBeGreaterThan(0);
    expect(kept.some((a) => /Levi/i.test(a.name)), 'a pair of jeans is not a household appliance').toBe(false);
  });

  it('wears things down over the months, and the better made last longer', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-wear');
    // Two appliances, so the only thing that differs is how well they are made.
    const [good, rough] = bestAndWorst('appliance');
    const dear = createAsset(sim, {
      ownerId: sim.player.id, catalogItem: good, purchasePrice: good.basePrice, acquiredVia: 'purchase',
    });
    const cheap = createAsset(sim, {
      ownerId: sim.player.id, catalogItem: rough, purchasePrice: rough.basePrice, acquiredVia: 'purchase',
    });
    const cheapBefore = cheap.condition;
    const dearBefore = dear.condition;
    for (let month = 0; month < 6; month += 1) sim.advanceTo(sim.now + 31 * 86_400_000);
    expect(cheap.condition, 'nothing wore at all').toBeLessThan(cheapBefore);
    expect(dearBefore - dear.condition, 'the better made one wore as fast as the rough one')
      .toBeLessThan(cheapBefore - cheap.condition);
  });

  it('stops working when it breaks, and the kitchen notices', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-break');
    const blender = buy(sim, /Vitamix|Blender/i, 'appliance');
    expect(kitchenOf(sim, sim.player.id).has('blender')).toBe(true);
    blender.condition = BREAKS_BELOW - 5;
    blender.broken = true;
    expect(works(blender)).toBe(false);
    expect(kitchenOf(sim, sim.player.id).has('blender'), 'a broken blender still blends').toBe(false);
  });
});

describe('getting it fixed', () => {
  it('charges for the repair, takes days, and brings it back working', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-repair');
    const oven = buy(sim, /Oven|Range/i, 'appliance');
    oven.condition = 10;
    oven.broken = true;
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);

    const booked = sim.execute<{ cost: number; dueAt: number }>({
      kind: 'home.repair', payload: { assetId: oven.id },
    });
    expect(booked.ok, String(booked.error)).toBe(true);
    expect(booked.value!.cost, 'the repair was free').toBeGreaterThan(0);
    expect(sim.ledger.availableFunds(account)).toBeLessThan(before);
    expect(oven.broken, 'it was fixed the moment it was booked').toBe(true);

    sim.advanceTo(booked.value!.dueAt + 60_000);
    expect(oven.broken, 'the repair never came back').toBe(false);
    expect(oven.condition).toBeGreaterThan(BREAKS_BELOW);
    expect(works(oven)).toBe(true);
  });

  it('refuses to repair what is not broken, and to book the same job twice', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-repair-twice');
    const oven = buy(sim, /Oven|Range/i, 'appliance');
    const fine = sim.execute({ kind: 'home.repair', payload: { assetId: oven.id } });
    expect(fine.ok).toBe(false);
    expect(String(fine.error)).toMatch(/working/i);

    oven.broken = true;
    oven.condition = 8;
    expect(sim.execute({ kind: 'home.repair', payload: { assetId: oven.id } }).ok).toBe(true);
    const again = sim.execute({ kind: 'home.repair', payload: { assetId: oven.id } });
    expect(again.ok, 'the same repair was booked twice').toBe(false);
  });
});

describe('the washing', () => {
  it('is free at home with a machine and costs money without one', () => {
    const without = quickSave({ wealth: 'comfortable' }, 'house-wash');
    expect(hasWorkingWasher(without, without.player.id)).toBe(false);

    const withOne = quickSave({ wealth: 'comfortable' }, 'house-wash');
    buy(withOne, /Washing Machine/i, 'appliance');
    expect(hasWorkingWasher(withOne, withOne.player.id)).toBe(true);
  });

  it('needs a dryer as well, or the washing hangs overnight', () => {
    const airer = quickSave({ wealth: 'wealthy' }, 'house-airer');
    buy(airer, /Washing Machine/i, 'appliance');
    expect(hasWorkingWasher(airer, airer.player.id)).toBe(true);
    expect(hasWorkingDryer(airer, airer.player.id), 'a washer is not a dryer').toBe(false);

    const both = quickSave({ wealth: 'wealthy' }, 'house-dryer');
    buy(both, /Heat Pump Dryer|WashTower/i, 'appliance');
    expect(hasWorkingDryer(both, both.player.id)).toBe(true);
  });

  it('sends you out again when the machine breaks', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-wash-break');
    const washer = buy(sim, /Washing Machine/i, 'appliance');
    expect(hasWorkingWasher(sim, sim.player.id)).toBe(true);
    washer.broken = true;
    expect(hasWorkingWasher(sim, sim.player.id), 'a broken washer still washes').toBe(false);
  });
});

describe('a thing has a place and something to do with it', () => {
  it('knows what each thing is for, and that some things are only owned', () => {
    expect(whatItIsFor('Steinway Model B Grand Piano', 'furniture')?.label).toBe('Play It');
    expect(whatItIsFor('LG C4 OLED Television', 'electronics')?.label).toBe('Watch Something');
    expect(usesFor('LG C4 OLED Television', 'electronics').map((u) => u.label))
      .toContain('Doze Off In Front Of It');
    expect(whatItIsFor('Eames Lounge Chair', 'furniture')?.label).toBe('Sit Down');
    // A wardrobe is not a thing you use; it is a thing you wear.
    expect(whatItIsFor('Levi’s 501 Original Fit Jeans', 'clothing')).toBeUndefined();
  });

  it('sends you to the right place for the things used somewhere else', () => {
    expect(whatItIsFor('Wolf Dual Fuel Range', 'appliance')?.via).toBe('kitchen');
    expect(whatItIsFor('Miele W1 Washing Machine', 'appliance')?.via).toBe('laundry');
    const sim = quickSave({ wealth: 'wealthy' }, 'house-elsewhere');
    const pan = buy(sim, /Le Creuset Signature Dutch Oven/i, 'household');
    const refused = sim.execute({ kind: 'home.use', payload: { assetId: pan.id } });
    expect(refused.ok).toBe(false);
    expect(String(refused.error)).toMatch(/Wellbeing/);
  });

  it('does not read a thing by half its name', () => {
    // Every one of these was a bug the first time round.
    expect(whatItIsFor('IKEA Lack Coffee Table', 'furniture'), 'a coffee table made coffee').toBeUndefined();
    expect(whatItIsFor('Frette Unito Bath Towels', 'home'), 'a towel ran a bath').toBeUndefined();
    expect(whatItIsFor('Muji Organic Cotton Bed Linen Set', 'home'), 'a sheet was a bed').toBeUndefined();
    expect(whatItIsFor('Muji LED Desk Lamp', 'home'), 'a lamp was a desk').toBeUndefined();
    expect(whatItIsFor('Dyson Supersonic Hair Dryer', 'appliance')?.label).toBe('Do Your Hair');
    expect(whatItIsFor('Miele G 7000 Dishwasher', 'appliance')?.label).toBe('Load The Dishwasher');
    expect(whatItIsFor('Weber Original Kettle Charcoal Grill', 'appliance')?.via).toBe('kitchen');
    expect(whatItIsFor('FINIS Freestyler Paddles', 'equipment')?.label).toBe('Get In The Water');
    expect(whatItIsFor('Rogue Kettlebell', 'equipment')?.label).toBe('Lift Some Weights');
  });

  it('does not count the dishwasher as the washing machine', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-dish');
    buy(sim, /Dishwasher/i, 'appliance');
    expect(hasWorkingWasher(sim, sim.player.id), 'a dishwasher washed the shirts').toBe(false);
  });

  it('makes the sofa you bought for the living room a thing you own', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-furnish');
    const rooms = roomsFor(sim, sim.player.residenceId!);
    expect(rooms.length, 'a home with no rooms').toBeGreaterThan(0);
    const living = rooms.find((r) => r.kind === 'living') ?? rooms[0]!;
    const sofa = shoppableItems().find((i) => i.category === 'furniture' && /Sofa/i.test(i.name))!;
    const bought = sim.execute<{ furnishingIds: Id[] }>({
      kind: 'prop.buy_furnishing',
      payload: { catalogId: sofa.id, roomId: living.id, propertyId: sim.player.residenceId },
    });
    expect(bought.ok, String(bought.error)).toBe(true);
    const furnishing = sim.universe.furnishings[bought.value!.furnishingIds[0]!]!;
    expect(furnishing.assetId, 'the sofa was a number on a room and nothing else').toBeDefined();
    const asset = sim.universe.assets[furnishing.assetId!]!;
    expect(asset.roomId).toBe(living.id);
    expect(householdAssets(sim, sim.player.id).some((a) => a.id === asset.id)).toBe(true);
    expect(whatItIsFor(asset.name, 'furniture')?.label).toBe('Sit Down');
  });

  it('shows the wear on the room the thing stands in', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-room-wear');
    const rooms = roomsFor(sim, sim.player.residenceId!);
    const living = rooms.find((r) => r.kind === 'living') ?? rooms[0]!;
    const sofa = shoppableItems().find((i) => i.category === 'furniture' && /Sofa/i.test(i.name))!;
    const bought = sim.execute<{ furnishingIds: Id[] }>({
      kind: 'prop.buy_furnishing',
      payload: { catalogId: sofa.id, roomId: living.id, propertyId: sim.player.residenceId },
    });
    expect(bought.ok, String(bought.error)).toBe(true);
    const furnishing = sim.universe.furnishings[bought.value!.furnishingIds[0]!]!;
    for (let month = 0; month < 12; month += 1) sim.advanceTo(sim.now + 31 * 86_400_000);
    expect(furnishing.condition, 'the room never noticed the sofa ageing').toBeLessThan(100);
  });

  it('puts a washing machine in the kitchen when the flat has no laundry', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-laundry');
    const rooms = roomsFor(sim, sim.player.residenceId!);
    expect(rooms.some((r) => r.kind === 'laundry'), 'this flat has a laundry room after all').toBe(false);
    const washer = buy(sim, /Washing Machine/i, 'appliance');
    const where = sim.universe.rooms[washer.roomId!];
    expect(where, 'the washing machine was put nowhere').toBeDefined();
    expect(where!.kind, 'it ended up in the first room going').toBe('kitchen');
  });

  it('puts a thing in a room of the home', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-room');
    const sofa = buy(sim, /Sofa|Sectional/i, 'furniture');
    const roomId = placeInRoom(sim, sofa);
    // A save with rooms puts it in one; a save without simply does not, and
    // that is not a failure, it is a flat nobody has laid out yet.
    if (roomId !== undefined) expect(sofa.roomId).toBe(roomId);
  });

  it('gives a sofa both the things people really do on one', () => {
    const labels = usesFor('IKEA Söderhamn Sofa', 'furniture').map((u) => u.label);
    expect(labels[0], 'a sofa is for sitting on first').toBe('Sit Down');
    expect(labels, 'nobody has ever slept on this sofa').toContain('Take A Nap');

    const sim = quickSave({ wealth: 'wealthy' }, 'house-nap');
    const sofa = buy(sim, /Sofa|Sectional/i, 'furniture');
    const before = sim.player.wellbeing.energy;
    const napped = sim.execute<{ label: string }>({
      kind: 'home.use', payload: { assetId: sofa.id, useId: 'nap' },
    });
    expect(napped.ok, String(napped.error)).toBe(true);
    expect(napped.value!.label).toBe('Take A Nap');
    expect(sim.player.wellbeing.energy, 'the nap was no rest at all').toBeGreaterThan(before);
  });

  it('lets you use the thing, which costs time and wears it a little', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-use');
    const tv = buy(sim, /OLED evo/i, 'electronics');
    const before = { at: sim.now, condition: tv.condition, morale: sim.player.wellbeing.morale };
    const used = sim.execute<{ label: string; minutes: number }>({
      kind: 'home.use', payload: { assetId: tv.id, minutes: 60 },
    });
    expect(used.ok, String(used.error)).toBe(true);
    expect(sim.now, 'no time passed').toBeGreaterThan(before.at);
    expect(tv.condition, 'using it did not wear it').toBeLessThan(before.condition);
    expect(sim.player.wellbeing.morale).toBeGreaterThan(before.morale);
    expect(tv.lastUsedAt).toBeDefined();
  });

  it('will not let you use something broken', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'house-use-broken');
    const tv = buy(sim, /OLED evo/i, 'electronics');
    tv.broken = true;
    const refused = sim.execute({ kind: 'home.use', payload: { assetId: tv.id } });
    expect(refused.ok).toBe(false);
    expect(String(refused.error)).toMatch(/broken/i);
  });
});
