/**
 * Furniture collected by the council (`systems/bulky.ts`, from 2026-10-03).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { addItem, homeKeyOf, itemsOf } from '@/engine/systems/items';
import { bulkyFee, bulkyRefusal } from '@/engine/systems/bulky';
import { inSaveMoney } from '@/engine/systems/banking';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const piece = (sim: Simulation, label = 'A Chair') => addItem(sim, sim.player, { kind: 'ikea:x', label, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' }, acquiredAt: sim.now, bulky: true });

describe('a bulky collection', () => {
  it('in London is Westminster’s £36 for up to six, £6.40 each after, and takes it away', () => {
    const sim = life('uk-eng-london', 'bulky-ldn');
    expect(bulkyFee(sim, sim.player, 6)).toBe(inSaveMoney(sim, 36_00, 'GBP'));
    expect(bulkyFee(sim, sim.player, 8)).toBe(inSaveMoney(sim, Math.round((36 + 2 * 6.4) * 100), 'GBP'));
    const a = piece(sim);
    const r = sim.must<{ collectAt: number; fee: number }>({ kind: 'items.discard', payload: { itemIds: [a.id] } });
    expect(r.fee).toBe(inSaveMoney(sim, 36_00, 'GBP'));
    expect(bulkyRefusal(sim.player, [a.id])).toMatch(/booked for collection/);
    sim.advanceTo(r.collectAt + MS_DAY);
    expect(itemsOf(sim.player).some((i) => i.id === a.id)).toBe(false);
  });

  it('in New York is free, six a day; New Haven’s first of the year free, then $50; Vancouver collects none', () => {
    const ny = life('us-ny-newyork', 'bulky-ny');
    const seven = Array.from({ length: 7 }, (_, i) => piece(ny, `Chair ${i}`).id);
    expect(bulkyRefusal(ny.player, seven)).toBe('It takes 6 items a collection day.');
    expect(ny.must<{ fee: number }>({ kind: 'items.discard', payload: { itemIds: seven.slice(0, 6) } }).fee).toBe(0);
    const nh = life('us-ct-newhaven', 'bulky-nh');
    expect(nh.must<{ fee: number }>({ kind: 'items.discard', payload: { itemIds: [piece(nh).id] } }).fee).toBe(0);
    expect(nh.must<{ fee: number }>({ kind: 'items.discard', payload: { itemIds: [piece(nh, 'Another').id] } }).fee).toBe(inSaveMoney(nh, 50_00, 'USD'));
    const van = life('ca-bc-vancouver', 'bulky-van');
    expect(bulkyRefusal(van.player, [piece(van).id])).toMatch(/transfer stations/);
  });
});
