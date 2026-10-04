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

describe('Taskrabbit’s hours, and IKEA’s buyback', () => {
  it('puts a BILLY together in Taskrabbit’s 45 minutes, the middle of its range', () => {
    const sim = life('uk-eng-london', 'billy-time');
    ownPlace(sim);
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'uk-billy-80263832', quantity: 1 } });
    const billy = ikea(sim, 'uk-billy-80263832')[0]!;
    const start = sim.now;
    sim.must({ kind: 'items.assemble', payload: { itemId: billy.id } });
    expect(sim.now - start).toBe(45 * 60_000);
  });

  it('takes a put-together bookcase back in Britain for credit at its tiers, spent on the next piece; no sofa', () => {
    const sim = life('uk-eng-london', 'buyback');
    ownPlace(sim);
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'uk-billy-59182201', quantity: 1 } });
    const billy = ikea(sim, 'uk-billy-59182201')[0]!;
    expect(sim.execute({ kind: 'home.sell_back', payload: { itemId: billy.id } }).error).toBe('IKEA takes a piece back put together.');
    sim.must({ kind: 'items.assemble', payload: { itemId: billy.id } });
    const credit = sim.must<{ credit: number }>({ kind: 'home.sell_back', payload: { itemId: billy.id } }).credit;
    expect(credit).toBe(Math.round(billy.paid! * 0.45 * 1.15));
    expect(ikea(sim, 'uk-billy-59182201')).toHaveLength(0);
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'uk-glostad-90489010', quantity: 1 } });
    const sofa = ikea(sim, 'uk-glostad-90489010')[0]!;
    expect(sim.player.ikeaCredit).toBe(Math.max(0, credit - sofa.paid!));
    sim.must({ kind: 'items.assemble', payload: { itemId: sofa.id } });
    expect(sim.execute({ kind: 'home.sell_back', payload: { itemId: sofa.id } }).error).toMatch(/no sofa/);
    const ny = life('us-ny-newyork', 'buyback-us');
    ownPlace(ny);
    ny.must({ kind: 'home.buy_piece', payload: { pieceId: 'us-brimnes-00576139', quantity: 1 } });
    expect(ny.execute({ kind: 'home.sell_back', payload: { itemId: ikea(ny, 'us-brimnes-00576139')[0]!.id } }).error).toMatch(/only in Britain and Ireland/);
  });
});
