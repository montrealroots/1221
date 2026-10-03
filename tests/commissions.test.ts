/**
 * A piece made to order, and a piece engraved (`systems/commissions.ts`,
 * from 2026-10-03): a named jeweler's least, its deposit or share at the
 * order, the rest when it's ready, and the piece a valuable after.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { JEWELERS, commissionRefusal, commissionsOf, dueAtOrder } from '@/engine/systems/commissions';
import { isValuable, valuablesOf } from '@/engine/systems/valuables';
import { pledgeRefusal } from '@/engine/systems/pawn';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('a commission', () => {
  it('is a named jeweler’s where you live, at your price from its least', () => {
    const sim = life('uk-eng-london', 'com-ldn');
    expect(commissionRefusal(sim.player, 'brilliant-earth', 'ring', 'gold', 5_000)).toBe('Choose a jeweler where you live.');
    expect(commissionRefusal(sim.player, 'james-newman', 'engagement-ring', 'platinum', 1_500)).toBe('James Newman Jewelry’s start at 1,800 GBP.');
    expect(commissionRefusal(sim.player, 'selina-campbell', 'ring', 'platinum', 2_000)).toBe('Selina Campbell doesn’t make that.');
    expect(commissionRefusal(sim.player, 'selina-campbell', 'necklace', 'silver', 350)).toBeUndefined();
    const ie = JEWELERS.find((j) => j.id === 'gear')!;
    // Gear's €300 fee, or a quarter, whichever's more.
    expect(dueAtOrder(ie, 2_500)).toBe(625);
    expect(dueAtOrder(JEWELERS.find((j) => j.id === 'james-newman')!, 2_000)).toBe(150);
  });

  it('takes the deposit at the order and the rest when it’s ready, and is then a valuable', () => {
    const sim = life('uk-eng-london', 'com-order');
    const before = bank(sim);
    const r = sim.must<{ paid: number; readyAt: number }>({ kind: 'jewelry.commission', payload: { jewelerId: 'james-newman', kind: 'ring', metal: 'gold', price: 2_000 } });
    expect(r.paid).toBe(inSaveMoney(sim, 150_00, 'GBP'));
    expect(before - bank(sim)).toBe(r.paid);
    expect(r.readyAt - sim.now).toBe(70 * MS_DAY);
    expect(commissionsOf(sim.player)).toHaveLength(1);
    sim.advanceBy(71 * MS_DAY);
    expect(commissionsOf(sim.player)).toHaveLength(0);
    const piece = valuablesOf(sim.player).find((i) => i.kind.startsWith('bespoke:'))!;
    expect(piece.label).toBe('A Gold Ring By James Newman Jewelry');
    expect(piece.paid).toBe(inSaveMoney(sim, 2_000_00, 'GBP'));
    expect(isValuable(piece)).toBe(true);
    expect(pledgeRefusal(sim, sim.player, [piece.id])).toBeUndefined();
    expect(sim.universe.transactions.some((t) => t.memo === 'James Newman Jewelry: the rest of a ring')).toBe(true);
    // Engraved at Fraser Hart's ring price, the words kept.
    const e = sim.must<{ paid: number }>({ kind: 'jewelry.engrave', payload: { itemId: piece.id, words: 'For A' } });
    expect(e.paid).toBe(inSaveMoney(sim, 60_00, 'GBP'));
    expect(piece.engraved).toBe('For A');
    expect(sim.execute({ kind: 'jewelry.engrave', payload: { itemId: piece.id, words: ' ' } }).error).toBe('Write the words to engrave.');
  });
});
