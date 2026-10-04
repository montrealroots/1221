/**
 * A packing list kept and packed again (`luggage.save_list`,
 * `luggage.pack_list`, `luggage.delete_list`, `packList` in
 * `systems/luggage.ts`, from 2026-10-04): what's in the bag kept under a name;
 * packed another time, each thing at home and fit to go, while there's room,
 * and what can't go named; kept through a save.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { LUGGAGE } from '@/engine/content/luggagecatalog';
import { bagsOf, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { garmentsOf } from '@/engine/systems/wardrobe';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a packing list', () => {
  it('keeps the bag’s things under a name, and packs them again, naming what can’t go', () => {
    const sim = life('packlist');
    sim.player.automation = { ...(sim.player.automation ?? {}), packForMe: true };
    const piece = LUGGAGE.find((x) => x.country === 'us' && x.type === 'carry-on')!;
    sim.must({ kind: 'luggage.buy', payload: { pieceId: piece.id } });
    sim.must({ kind: 'luggage.pack', payload: {} });
    const bag = suitcaseOf(sim.player)!;
    const packed = packedIn(sim.player, bag).map((i) => i.id);
    expect(packed.length).toBeGreaterThan(2);
    expect(sim.execute({ kind: 'luggage.save_list', payload: { name: '  ' } }).error).toBe('Give the list a name.');
    const kept = sim.must<{ listId: string; things: number }>({ kind: 'luggage.save_list', payload: { name: 'A Week Away' } });
    expect(kept.things).toBe(packed.length);
    // Unpacked, one shirt put in the wash: packed again, all but it.
    sim.must({ kind: 'luggage.unpack', payload: {} });
    expect(packedIn(sim.player, bag)).toHaveLength(0);
    const [shirt, worn, carried] = garmentsOf(sim.player).filter((g) => packed.includes(g.id));
    shirt!.garment.dirty = true;
    worn!.condition = 0;
    carried!.at = { kind: 'person' };
    const r = sim.must<{ packed: number; already: number; short: { label: string; why: string }[] }>({ kind: 'luggage.pack_list', payload: { listId: kept.listId } });
    expect(r.packed).toBe(packed.length - 3);
    expect(r.short).toEqual(expect.arrayContaining([{ label: shirt!.label, why: 'in the wash' }, { label: worn!.label, why: 'worn out' }, { label: carried!.label, why: 'not at home' }]));
    expect(r.short).toHaveLength(3);
    // Again: everything's in already.
    const again = sim.must<{ packed: number; already: number }>({ kind: 'luggage.pack_list', payload: { listId: kept.listId } });
    expect(again).toMatchObject({ packed: 0, already: packed.length - 3 });
    // Kept under the same name is the same list, renewed.
    expect(sim.must<{ listId: string }>({ kind: 'luggage.save_list', payload: { name: 'a week away' } }).listId).toBe(kept.listId);
    expect(sim.player.packingLists).toHaveLength(1);
  });

  it('names a thing no longer yours, and one with no room left, and survives a save', () => {
    const sim = life('packlist-2');
    sim.player.automation = { ...(sim.player.automation ?? {}), packForMe: true };
    const small = LUGGAGE.filter((x) => x.country === 'us' && x.type === 'underseat').sort((a, b) => a.liters - b.liters)[0]!;
    const big = LUGGAGE.filter((x) => x.country === 'us' && x.type === 'large').sort((a, b) => b.liters - a.liters)[0]!;
    sim.must({ kind: 'luggage.buy', payload: { pieceId: big.id } });
    sim.must({ kind: 'luggage.pack', payload: {} });
    const kept = sim.must<{ listId: string }>({ kind: 'luggage.save_list', payload: { name: 'Everything' } });
    sim.must({ kind: 'luggage.unpack', payload: {} });
    const listed = sim.player.packingLists![0]!.itemIds;
    // One of them given away: gone from the list's reach.
    sim.player.items = (sim.player.items ?? []).filter((i) => i.id !== listed[0]);
    const after = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(after.player.packingLists).toEqual(sim.player.packingLists);
    // Packed into the smallest bag, the rest is named for want of room.
    after.must({ kind: 'luggage.buy', payload: { pieceId: small.id } });
    const tiny = bagsOf(after.player).find((b) => b.kind === `luggage:${small.id}`)!;
    const r = after.must<{ packed: number; short: { label: string; why: string }[] }>({ kind: 'luggage.pack_list', payload: { listId: kept.listId, bagId: tiny.id } });
    expect(r.short[0]).toEqual({ label: 'One Thing', why: 'no longer yours' });
    expect(r.short.some((x) => x.why === 'no room left')).toBe(true);
    expect(r.packed + r.short.length).toBe(listed.length);
    after.must({ kind: 'luggage.delete_list', payload: { listId: kept.listId } });
    expect(after.player.packingLists).toEqual([]);
  });
});
