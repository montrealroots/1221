/**
 * A meal is refused before the hour when it can't be paid for (`canPayFor` in
 * `systems/household.ts`, from 2026-10-02): a debit card meal goes into an
 * overdraft only where the bank may pay it there, and the check used to count
 * the overdraft anyway, so the hour went and the payment then failed.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { canPay, canPayFor } from '@/engine/systems/household';
import { lookAfterRefusal } from '@/engine/systems/life';

describe('a meal they can’t pay for', () => {
  it('is refused as unaffordable, not failed as a payment', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'modest' }, 'afford-meal');
    const p = sim.player;
    const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === p.id && !a.nominal && !a.closedAt);
    const sink = sim.nominalAccount('expense', 'Test').id;
    for (const a of mine) if (a.balance > 0) { const keep = a.id === p.primaryAccountId ? 300 : 0; sim.post({ memo: 'drain', category: 'test', postings: [{ accountId: a.id, amount: -(a.balance - keep) }, { accountId: sink, amount: a.balance - keep }] }); }
    const room = canPay(sim, p, false) - 300;
    const card = mine.find((a) => a.kind === 'credit_card');
    if (card && room > 0) sim.post({ memo: 'max', category: 'test', postings: [{ accountId: card.id, amount: -room }, { accountId: sink, amount: room }] });
    p.wellbeing.nourishment = 20;
    // Only an overdraft would cover it, and a meal can't go into one here.
    expect(canPayFor(sim, p, 'food')).toBe(300);
    expect(canPay(sim, p)).toBeGreaterThan(canPayFor(sim, p, 'food'));
    expect(lookAfterRefusal(sim, 'order')).toBe('You can’t afford it.');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'order' } }).error).toBe('You can’t afford it.');
  });
});
