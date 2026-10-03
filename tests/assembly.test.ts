/**
 * Putting furniture together (`ASSEMBLY` and `items.assemble` in
 * `systems/furnishings.ts`, from 2026-10-03): an IKEA piece comes
 * flat-packed and seats or holds nothing until it's put together, by IKEA's
 * service at its price or by you in an hour.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { ASSEMBLE_MINUTES, assemblyFee, pieceById, seatsAtHome } from '@/engine/systems/furnishings';
import { addItem, homeKeyOf, itemsOf, moveRefusal } from '@/engine/systems/items';
import { inSaveMoney } from '@/engine/systems/banking';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const ownPlace = (sim: Simulation) => { sim.player.home = { ...sim.player.home!, kind: 'own' } as never; };
const ikea = (sim: Simulation, id: string) => itemsOf(sim.player).filter((i) => i.kind === `ikea:${id}`);

describe('an IKEA piece', () => {
  it('comes flat-packed: seats nobody and holds nothing until it’s put together, an hour', () => {
    const sim = life('us-ny-newyork', 'flat-pack');
    ownPlace(sim);
    const seats = seatsAtHome(sim.player).seats;
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'us-onnestad-19554477', quantity: 1 } });
    const chair = ikea(sim, 'us-onnestad-19554477')[0]!;
    expect(chair.flatPacked).toBe(true);
    expect(seatsAtHome(sim.player).seats).toBe(seats);
    const start = sim.now;
    sim.must({ kind: 'items.assemble', payload: { itemId: chair.id } });
    expect(sim.now - start).toBe(ASSEMBLE_MINUTES * 60_000);
    expect(chair.flatPacked).toBeUndefined();
    expect(seatsAtHome(sim.player).seats).toBe(seats + pieceById('us-onnestad-19554477')!.seats!);
    expect(sim.execute({ kind: 'items.assemble', payload: { itemId: chair.id } }).error).toBe('It’s put together.');
    // A wardrobe flat-packed holds nothing.
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'us-brimnes-00576139', quantity: 1 } });
    const wardrobe = ikea(sim, 'us-brimnes-00576139')[0]!;
    const sock = addItem(sim, sim.player, { kind: 'custom', label: 'A Sock', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' }, acquiredAt: sim.now, volumeL: 0.1 });
    expect(moveRefusal(sim, sim.player, sock, { kind: 'inside', itemId: wardrobe.id })).toMatch(/still flat-packed/);
    // Away from home, it waits.
    sim.player.currentLocationId = 'uk-eng-london';
    expect(sim.execute({ kind: 'items.assemble', payload: { itemId: wardrobe.id } }).error).toBe('It’s put together where it is, at home.');
  });

  it('is put together by IKEA at its price: from $52 a piece in America, 9% in Mexico, Ireland’s call-out once', () => {
    const ny = life('us-ny-newyork', 'assembly-us');
    ownPlace(ny);
    const chair = pieceById('us-onnestad-19554477')!;
    expect(assemblyFee(ny, chair, 2)).toBe(inSaveMoney(ny, 2 * 52_00, 'USD'));
    const before = ny.universe.accounts[ny.player.primaryAccountId!]!.balance;
    const r = ny.must<{ paid: number }>({ kind: 'home.buy_piece', payload: { pieceId: chair.id, quantity: 2, assembly: true } });
    expect(before - ny.universe.accounts[ny.player.primaryAccountId!]!.balance).toBe(r.paid);
    expect(ikea(ny, chair.id)[0]!.flatPacked).toBeUndefined();
    const mx = life('mx-cmx-mexicocity', 'assembly-mx');
    // A GLOSTAD sofa at MX$2,999: 2.5%; anything else 9%.
    const sofa = pieceById('mx-glostad-70489011')!;
    expect(assemblyFee(mx, sofa, 1)).toBe(inSaveMoney(mx, Math.round(2_999 * 0.025 * 100), 'MXN'));
    expect(assemblyFee(mx, { ...sofa, kind: 'armchair' }, 1)).toBe(inSaveMoney(mx, Math.round(2_999 * 0.09 * 100), 'MXN'));
    const dub = life('ie-lei-dublin', 'assembly-ie');
    const iePiece = { ...chair, country: 'ie' };
    expect(assemblyFee(dub, iePiece, 3)).toBe(inSaveMoney(dub, 40_00, 'EUR'));
  });
});
