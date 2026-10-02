/**
 * Jewelry and watches as valuables (`systems/valuables.ts`, from
 * 2026-10-02): a burglary takes the pieces at home that aren't locked in a
 * safe or worn, the policy pays for them up to its jewelry limit, and a
 * scheduled piece in full.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { belongingsDay } from '@/engine/systems/dwelling';
import { addItem, homeKeyOf, itemById, type Item } from '@/engine/systems/items';
import { burgleValuables, safeCatalog, scheduleRefusal, scheduledMonth, scheduledPremium } from '@/engine/systems/valuables';
import { inSaveMoney } from '@/engine/systems/banking';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const WATCH_US = 'us-timex-weekender-37mm-fabric-strap-watch';
const WATCH_GB = 'gb-john-lewis-seiko-sne595p1-mens-prospex-solar-divers-date-bracelet-strap-watch-silvernav';

function piece(sim: Simulation, kind: string, paid: number): Item {
  const p = sim.player;
  return addItem(sim, p, { kind, label: 'A Watch', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'drawers' }, acquiredAt: sim.now, paid, garment: { kind: 'accessory', slot: 'accessory', care: 'hand', wears: 0, washes: 0 } });
}

function withSafe(sim: Simulation): void {
  const cheapest = safeCatalog(sim, sim.player)[0]!;
  sim.must({ kind: 'valuables.buy_safe', payload: { id: cheapest.safe.id } });
}

describe('a burglary’s jewelry and watches', () => {
  it('takes what isn’t locked away or worn, and counts it toward the claim up to the policy’s limit', () => {
    const sim = life('us-ny-newyork', 'val-ny');
    const p = sim.player;
    sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
    withSafe(sim);
    const loose = piece(sim, WATCH_US, 1_000_00);
    const loose2 = piece(sim, WATCH_US, 1_000_00);
    const locked = piece(sim, WATCH_US, 1_000_00);
    const worn = piece(sim, WATCH_US, 1_000_00);
    // One at another home of theirs isn't this burglary's.
    const away = piece(sim, WATCH_US, 1_000_00);
    away.at = { kind: 'home', home: 'owned:elsewhere', spot: 'drawers' };
    sim.must({ kind: 'valuables.lock_up', payload: { itemId: locked.id } });
    p.wornNow = { itemIds: [worn.id], since: sim.now };
    const r = burgleValuables(sim, p, homeKeyOf(p.home)!, true);
    expect(r.taken.map((i) => i.id).sort()).toEqual([loose.id, loose2.id].sort());
    expect(itemById(p, loose.id)).toBeUndefined();
    expect(itemById(p, locked.id)).toBeDefined();
    expect(itemById(p, worn.id)).toBeDefined();
    expect(itemById(p, away.id)).toBeDefined();
    // Two $1,000 pieces against Lemonade's $1,500 limit for jewelry stolen.
    expect(r.toClaim).toBe(inSaveMoney(sim, 1_500_00, 'USD'));
    expect(r.inFull).toBe(0);
  });

  it('pays a scheduled piece in full besides, and nothing without a policy', () => {
    const sim = life('us-ny-newyork', 'val-sched');
    const p = sim.player;
    const w = piece(sim, WATCH_US, 4_000_00);
    expect(scheduleRefusal(sim, p, w)).toBe('Scheduling goes on a policy that covers what’s in your home.');
    expect(scheduleRefusal(sim, p, { ...w, paid: undefined })).toBe('There’s no receipt to schedule it at.');
    sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
    sim.must({ kind: 'valuables.schedule', payload: { itemId: w.id, on: true } });
    expect(scheduledPremium(w)).toBe(Math.round(4_000_00 * 0.0126 / 12));
    const r = burgleValuables(sim, p, homeKeyOf(p.home)!, true);
    expect(r.inFull).toBe(4_000_00);
    expect(r.toClaim).toBe(0);
    const bare = life('us-ny-newyork', 'val-bare');
    piece(bare, WATCH_US, 4_000_00);
    expect(burgleValuables(bare, bare.player, homeKeyOf(bare.player.home)!, false)).toMatchObject({ toClaim: 0, inFull: 0 });
    expect(bare.player.items!.some((i) => i.kind === WATCH_US)).toBe(false);
  });

  it('caps a piece at Aviva’s £2,500 an item in London', () => {
    const sim = life('uk-eng-london', 'val-ldn');
    const p = sim.player;
    piece(sim, WATCH_GB, inSaveMoney(sim, 4_000_00, 'GBP'));
    piece(sim, WATCH_GB, inSaveMoney(sim, 1_000_00, 'GBP'));
    expect(burgleValuables(sim, p, homeKeyOf(p.home)!, true).toClaim).toBe(inSaveMoney(sim, 2_500_00, 'GBP') + inSaveMoney(sim, 1_000_00, 'GBP'));
  });

  it('is part of a burglary, the pieces named and paid on the claim', () => {
    // The same life twice, the same burglary: scheduled, the $4,000 watch is paid in full; not, only to the $1,500 limit.
    const claimed = (scheduled: boolean) => {
      const sim = life('us-ny-newyork', 'val-day');
      const p = sim.player;
      sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
      const w = piece(sim, WATCH_US, 4_000_00);
      if (scheduled) sim.must({ kind: 'valuables.schedule', payload: { itemId: w.id, on: true } });
      belongingsDay(sim, p, false, 1e9);
      expect(itemById(p, w.id)).toBeUndefined();
      const claim = Object.values(sim.universe.transactions).find((t) => t.memo === 'Insurance claim: a burglary')!;
      return claim.postings.find((x) => x.accountId === p.primaryAccountId)!.amount;
    };
    expect(claimed(true) - claimed(false)).toBe(4_000_00 - 1_500_00);
  });

  it('charges the scheduled premium with the month’s belongings', () => {
    const sim = life('us-ny-newyork', 'val-first');
    sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
    const w = piece(sim, WATCH_US, 4_000_00);
    sim.must({ kind: 'valuables.schedule', payload: { itemId: w.id, on: true } });
    belongingsDay(sim, sim.player, true, 0);
    expect(Object.values(sim.universe.transactions).some((t) => t.memo === 'Scheduled jewelry and watches')).toBe(true);
  });

  it('charges the scheduled premium on the first, and lapses it with the policy', () => {
    const sim = life('us-ny-newyork', 'val-month');
    const p = sim.player;
    sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
    const w = piece(sim, WATCH_US, 4_000_00);
    sim.must({ kind: 'valuables.schedule', payload: { itemId: w.id, on: true } });
    scheduledMonth(sim, p, true);
    expect(Object.values(sim.universe.transactions).some((t) => t.memo === 'Scheduled jewelry and watches')).toBe(true);
    expect(w.scheduled).toBe(true);
    scheduledMonth(sim, p, false);
    expect(w.scheduled).toBeUndefined();
  });
});

describe('a safe', () => {
  it('is bought where you live, cheapest first, and holds what fits', () => {
    const sim = life('ie-lei-dublin', 'val-safe');
    const shop = safeCatalog(sim, sim.player);
    expect(shop.every((x) => x.safe.country === 'ie')).toBe(true);
    expect(shop.map((x) => x.price)).toEqual([...shop.map((x) => x.price)].sort((a, b) => a - b));
    expect(sim.execute({ kind: 'valuables.lock_up', payload: { itemId: 'none' } }).error).toBe('Only jewelry and watches go in the safe.');
    const w = piece(sim, WATCH_US, 100_00);
    expect(sim.execute({ kind: 'valuables.lock_up', payload: { itemId: w.id } }).error).toBe('There’s no safe where you live.');
    withSafe(sim);
    sim.must({ kind: 'valuables.lock_up', payload: { itemId: w.id } });
    expect(w.at.kind).toBe('inside');
    sim.must({ kind: 'valuables.take_out', payload: { itemId: w.id } });
    expect(w.at).toMatchObject({ kind: 'home', spot: 'drawers' });
    expect(sim.execute({ kind: 'valuables.buy_safe', payload: { id: 'us-sentrysafe-sfw082et' } }).error).toBe('It’s sold in another country.');
    sim.player.home = { ...sim.player.home!, kind: 'sofa' };
    expect(sim.execute({ kind: 'valuables.buy_safe', payload: { id: shop[0]!.safe.id } }).error).toBe('A safe is bought where you live, and bolted down there.');
  });
});
