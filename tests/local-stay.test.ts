/**
 * A hotel booked on its own, where they are (the master plan's §48g, from
 * 2026-10-06): paid at its price when booked; while it lasts they aren't at
 * home, the hotel's room is where they are; it ends at the check-out hour or
 * when they check out, and they're home again.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { atHome, placeOf } from '@/engine/systems/dwelling';
import { inLocalStay, localStayQuote } from '@/engine/systems/localstay';
import { cardRoom } from '@/engine/systems/credit';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const banked = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('a hotel booked where they are', () => {
  it('is paid when booked, keeps them away from home while it lasts, and ends at check-out', () => {
    let sim = life('local-stay');
    expect(atHome(sim.player)).toBe(true);
    const q = localStayQuote(sim, sim.player, { nights: 2 });
    if (typeof q === 'string') throw new Error(q);
    const before = banked(sim);
    const r = sim.must<{ paid: number; checkOutAt: number }>({ kind: 'travel.stay_here', payload: { nights: 2 } });
    expect(r.paid).toBe(q.price);
    expect(before - banked(sim)).toBe(q.price);
    // There, not at home: the hotel's room, no kitchen of its own, and groceries don't go to it.
    expect(atHome(sim.player)).toBe(false);
    expect(inLocalStay(sim.player)).toBe(true);
    expect(placeOf(sim, sim.player)?.cooks).toBe(false);
    expect(sim.execute({ kind: 'travel.stay_here', payload: { nights: 1 } }).error).toBe('You’re staying somewhere here already.');
    // Saved and loaded there, still there.
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(inLocalStay(sim.player)).toBe(true);
    // Past the check-out hour after the second night: home again, the booking ended once.
    sim.advanceTo(r.checkOutAt + MS_HOUR);
    expect(inLocalStay(sim.player)).toBe(false);
    expect(atHome(sim.player)).toBe(true);
    expect(r.checkOutAt - sim.universe.meta.createdAt).toBeGreaterThan(MS_DAY);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('checks out early, the nights booked paid, and refuses what it can’t book', () => {
    const sim = life('local-stay-early');
    sim.must({ kind: 'travel.stay_here', payload: { nights: 3 } });
    const paidOut = banked(sim);
    sim.advanceBy(10 * MS_HOUR);
    sim.must({ kind: 'travel.check_out', payload: {} });
    expect(atHome(sim.player)).toBe(true);
    expect(banked(sim)).toBe(paidOut);
    expect(sim.execute({ kind: 'travel.check_out', payload: {} }).error).toBe('You aren’t in a hotel booked here.');
    // Nothing left on the calendar to end it again.
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'travel.local_stay_end')).toBe(false);
    expect(sim.execute({ kind: 'travel.stay_here', payload: { nights: 0 } }).error).toBe('A stay is a whole number of nights, from one to 30.');
    expect(sim.execute({ kind: 'travel.stay_here', payload: { nights: 2, cls: 'street' } }).error).toMatch(/isn’t booked as a room\.$/);
    // Too dear for the bank: refused, nothing taken.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) sim.post({ memo: 'Moved to a relative', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
    // And the card filled to its limit, so nothing can pay.
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card');
    if (card) { const room = cardRoom(sim.player, card); sim.post({ memo: 'Spent on the card by the family', category: 'transfer', postings: [{ accountId: card.id, amount: -room }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: room }] }); }
    const r = sim.execute({ kind: 'travel.stay_here', payload: { nights: 30 } });
    expect(r.ok).toBe(false);
    expect(inLocalStay(sim.player)).toBe(false);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
