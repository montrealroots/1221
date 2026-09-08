/**
 * A camera you own is a thing on a shelf in a room.
 *
 * What a test can hold: kit that lands in a room of the house the moment it is
 * yours, wears the way kit wears, breaks the way kit breaks, has something you
 * actually do with it between jobs, and a shoot day that knows the difference
 * between a camera you have looked after and one you have not.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CATALOG } from '@/engine/content/catalog';
import { createAsset } from '@/engine/systems/commerce';
import {
  BREAKS_BELOW, householdAssets, placeInRoom, usesFor, whatItIsFor, works,
} from '@/engine/systems/household';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

function anOwner(seed: string): Simulation {
  return quickSave({ birthYear: 1995, startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles' }, seed);
}

const CAMERAS = CATALOG.all().filter(
  (one) => one.category === 'kit' && one.tags.includes('camera') && !one.tags.includes('rental only'),
);
const LENSES = CATALOG.all().filter(
  (one) => one.category === 'kit' && /prime|zoom|lens/i.test(one.name) && !one.tags.includes('rental only'),
);

/** Put a piece of kit in this person's hands, the way buying one would. */
function own(sim: Simulation, item = CAMERAS[0]!) {
  return createAsset(sim, {
    ownerId: sim.player.id, catalogItem: item, purchasePrice: item.basePrice, acquiredVia: 'purchase',
  });
}

// ---------------------------------------------------------------------------

describe('kit in the house', () => {
  it('has kit to own that is not hire only', () => {
    expect(CAMERAS.length).toBeGreaterThan(10);
    expect(LENSES.length).toBeGreaterThan(5);
    // And the hire only kit really is marked, so it can never land on a shelf.
    const hireOnly = CATALOG.all().filter((one) => one.tags.includes('rental only'));
    expect(hireOnly.length).toBeGreaterThan(0);
  });

  it('puts a camera in a room of the house the moment it is yours', () => {
    const sim = anOwner('kit-room');
    const asset = own(sim);
    expect(asset.roomId, `${asset.name} landed in no room`).toBeDefined();
    // And it turns up among the things the household knows it has.
    expect(householdAssets(sim, sim.player.id).some((one) => one.id === asset.id)).toBe(true);
  });

  it('never puts hire only kit on a shelf', () => {
    const sim = anOwner('kit-hire');
    const hireOnly = CATALOG.all().find((one) => one.tags.includes('rental only'));
    if (!hireOnly) return;
    const asset = createAsset(sim, {
      ownerId: sim.player.id, catalogItem: hireOnly, purchasePrice: 1_00, acquiredVia: 'purchase',
    });
    expect(placeInRoom(sim, asset)).toBeUndefined();
  });

  it('has something you actually do with it, and it is looking after it', () => {
    const camera = CAMERAS[0]!;
    const uses = usesFor(camera.name, 'kit');
    expect(uses.length).toBeGreaterThan(0);
    expect(whatItIsFor(camera.name, 'kit')!.label).toBe('Check It Over');
    // A lens is cleaned first, because that is what you do with a lens.
    const lens = LENSES[0]!;
    expect(whatItIsFor(lens.name, 'kit')!.label).toBe('Clean The Glass');
    // Every one of them puts condition back rather than taking it.
    for (const use of uses) expect(use.restores, use.label).toBeGreaterThan(0);
  });

  it('puts condition back when you look after it, and takes it when you do not', () => {
    const sim = anOwner('kit-service');
    const asset = own(sim);
    asset.condition = 50;
    sim.player.wellbeing.energy = 100;
    const res = sim.execute<{ label: string }>(
      { kind: 'home.use', payload: { assetId: asset.id, useId: 'service' } },
    );
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.label).toBe('Check It Over');
    expect(asset.condition).toBeGreaterThan(50);
    // Left alone for two years it goes the other way.
    const after = asset.condition;
    sim.advanceTo(sim.now + 730 * MS_DAY);
    expect(asset.condition).toBeLessThan(after);
  });

  it('breaks, because camera kit breaks', () => {
    const sim = anOwner('kit-broken');
    const asset = own(sim);
    asset.condition = BREAKS_BELOW - 1;
    asset.broken = true;
    expect(works(asset)).toBe(false);
    // And a broken thing cannot be used from the shelf.
    const res = sim.execute({ kind: 'home.use', payload: { assetId: asset.id, useId: 'service' } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/broken/i);
  });
});

describe('and the day it is for', () => {
  /** A day at home tomorrow, which needs nobody's permission. */
  function aDay(sim: Simulation): string {
    const res = sim.execute<{ dayId: string }>({
      kind: 'shoot.plan',
      payload: { title: 'A Day At Home', at: sim.now + MS_DAY, where: 'home', setups: 4 },
    });
    expect(res.ok, res.error).toBe(true);
    return res.value!.dayId;
  }

  it('will not let a broken camera stand in for a working one, and says which', () => {
    const sim = anOwner('kit-shoot-broken');
    const asset = own(sim);
    asset.broken = true;
    const dayId = aDay(sim);
    sim.advanceTo(sim.now + MS_DAY);
    sim.player.wellbeing.energy = 90;
    const res = sim.execute({ kind: 'shoot.run', payload: { dayId } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/broken/i);
    expect(res.error).toContain(asset.name);
  });

  it('shoots the day on a camera that works', () => {
    const sim = anOwner('kit-shoot-works');
    own(sim);
    const dayId = aDay(sim);
    sim.advanceTo(sim.now + MS_DAY);
    sim.player.wellbeing.energy = 90;
    const res = sim.execute<{ got: number; setups: number }>({ kind: 'shoot.run', payload: { dayId } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.setups).toBeGreaterThan(0);
  });

  it('says on the day whether the kit was looked after or not', () => {
    // One save, two days, and the only thing changed between them is the
    // state of the camera. What is asserted is that the day noticed.
    const sim = anOwner('kit-shoot-condition');
    const camera = own(sim);

    camera.condition = 95;
    const good = aDay(sim);
    sim.advanceTo(sim.now + MS_DAY);
    sim.player.wellbeing.energy = 90;
    const kept = sim.execute<{ note: string }>({ kind: 'shoot.run', payload: { dayId: good } });
    expect(kept.ok, kept.error).toBe(true);
    expect(kept.value!.note).toContain('the condition you keep it in');

    camera.condition = 20;
    const bad = aDay(sim);
    sim.advanceTo(sim.now + MS_DAY);
    sim.player.wellbeing.energy = 90;
    const neglected = sim.execute<{ note: string }>({ kind: 'shoot.run', payload: { dayId: bad } });
    expect(neglected.ok, neglected.error).toBe(true);
    expect(neglected.value!.note).toContain('has not been looked after');
  });
});
