/**
 * A checked bag the airline mishandles (`systems/baggage.ts`, from
 * 2026-10-05): drawn at the DOT's rate and SITA's split; a delayed bag held
 * and brought back, essentials bought meanwhile claimed; a damaged bag's
 * price claimed within seven days; a lost bag declared lost at 21 days with
 * everything in it, its worth claimed up to the law's cap.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { LUGGAGE } from '@/engine/content/luggagecatalog';
import { inSaveMoney } from '@/engine/systems/banking';
import { BAGGAGE, bagClaimsOf, bagFate, claimAmount, claimRefusal, landBags } from '@/engine/systems/baggage';
import { bagsOf, packedIn } from '@/engine/systems/luggage';
import { addItem, itemsOf } from '@/engine/systems/items';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

/** A journey key whose bag meets a fate, by searching the real draw. */
function keyFor(sim: Simulation, bagId: string, kind: string, international: boolean): string {
  for (let n = 0; n < 200_000; n += 1) if (bagFate(sim, sim.player, `j${n}-${bagId}`, international).kind === kind) return `j${n}`;
  throw new Error(`no ${kind}`);
}

const withBag = (sim: Simulation) => {
  sim.player.automation = { ...(sim.player.automation ?? {}), packForMe: true };
  const piece = LUGGAGE.find((x) => x.country === 'us' && x.type === 'large')!;
  const r = sim.must<{ itemId: string }>({ kind: 'luggage.buy', payload: { pieceId: piece.id } });
  // The bag just bought, made the main one so it's the one packed and checked.
  sim.must({ kind: 'luggage.choose', payload: { itemId: r.itemId } });
  sim.player.goingBags = [r.itemId];
  sim.must({ kind: 'luggage.pack', payload: {} });
  return bagsOf(sim.player).find((b) => b.id === r.itemId)!;
};

describe('a checked bag', () => {
  it('is mishandled about as often as the DOT says, more often abroad, and in SITA’s proportions', () => {
    const sim = life('bag-rate');
    const n = 40_000;
    const fates = { ok: 0, delayed: 0, damaged: 0, lost: 0 } as Record<string, number>;
    for (let i = 0; i < n; i += 1) fates[bagFate(sim, sim.player, `r${i}`, false).kind] = (fates[bagFate(sim, sim.player, `r${i}`, false).kind] ?? 0) + 1;
    expect((n - fates.ok!) / n).toBeCloseTo(BAGGAGE.domesticRate, 2);
    let abroad = 0;
    for (let i = 0; i < n; i += 1) if (bagFate(sim, sim.player, `a${i}`, true).kind !== 'ok') abroad += 1;
    expect(abroad / n).toBeGreaterThan(3 * BAGGAGE.domesticRate);
  });

  it('delayed, is held and brought back, and what was bought to get by meanwhile is claimed', () => {
    const sim = life('bag-delayed');
    const bag = withBag(sim);
    const key = keyFor(sim, bag.id, 'delayed', false);
    bag.at = { kind: 'person' };
    const [claim] = landBags(sim, sim.player, key, 'us-ny-newyork', 'us-ca-losangeles', 1);
    expect(claim!.kind).toBe('delayed');
    expect(bag.at.kind).toBe('held');
    expect(claimRefusal(sim, sim.player, claim!)).toBe('It’s claimed once the bag is back.');
    // A toothbrush and a shirt bought meanwhile.
    addItem(sim, sim.player, { kind: 'x-shirt', label: 'A Shirt', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now + 1000, paid: 30_00, garment: { kind: 'shirt', slot: 'top', care: 'machine', wears: 0, washes: 0 } } as never);
    addItem(sim, sim.player, { kind: 'x-brush', label: 'A Toothbrush', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now + 2000, paid: 5_00, supply: { kind: 'toothbrush', unit: 'ct', left: 1 } } as never);
    // Bought before it went missing: not the airline's.
    addItem(sim, sim.player, { kind: 'x-old', label: 'An Old Shirt', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: claim!.at - 1000, paid: 99_00, garment: { kind: 'shirt', slot: 'top', care: 'machine', wears: 0, washes: 0 } } as never);
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.advanceTo(claim!.backAt! + 60_000);
    expect(bag.at.kind).not.toBe('held');
    expect(claimAmount(sim.player, claim!)).toBe(35_00);
    const r = sim.must<{ paid: number }>({ kind: 'travel.bag_claim', payload: { claimId: claim!.id } });
    expect(r.paid).toBe(35_00);
    expect(claimRefusal(sim, sim.player, claim!)).toBe('It’s been claimed.');
    // Another, never claimed in time.
    const late = { ...claim!, id: 'late', paid: undefined };
    sim.advanceBy((BAGGAGE.claimDays.delayed + 1) * MS_DAY);
    expect(claimRefusal(sim, sim.player, late)).toBe('A delayed bag’s claim is made within 21 days of its return.');
  });

  it('damaged, is left worn and its price claimed within seven days, not after', () => {
    const sim = life('bag-damaged');
    const bag = withBag(sim);
    const key = keyFor(sim, bag.id, 'damaged', false);
    const [claim] = landBags(sim, sim.player, key, 'us-ny-newyork', 'us-ca-losangeles', 1);
    expect(bag.condition).toBe(BAGGAGE.damagedCondition);
    expect(claimAmount(sim.player, claim!)).toBe(bag.paid);
    sim.advanceBy(8 * MS_DAY);
    expect(claimRefusal(sim, sim.player, claim!)).toBe('A damaged bag’s claim is made within 7 days.');
  });

  it('lost, is declared lost at 21 days with what was in it, and its worth claimed up to the cap', () => {
    const sim = life('bag-lost');
    const bag = withBag(sim);
    const inIt = packedIn(sim.player, bag).map((i) => i.id);
    expect(inIt.length).toBeGreaterThan(0);
    // A life's first clothes, bought for nothing, count at the cheapest of their kind here (from 2026-10-05).
    const unpriced = packedIn(sim.player, bag).filter((i) => i.paid === undefined && i.garment);
    expect(unpriced.length).toBeGreaterThan(0);
    const paidSum = [bag, ...packedIn(sim.player, bag)].reduce((n, i) => n + (i.paid ?? 0), 0);
    const key = keyFor(sim, bag.id, 'lost', true);
    const [claim] = landBags(sim, sim.player, key, 'us-ny-newyork', 'uk-eng-london', 1);
    expect(claim!.cap).toBe(inSaveMoney(sim, BAGGAGE.montrealUsd * 100, 'USD'));
    expect(claim!.value!).toBeGreaterThan(paidSum);
    expect(claimRefusal(sim, sim.player, claim!)).toMatch(/still being traced/);
    sim.advanceBy(BAGGAGE.tracingDays * MS_DAY + 60_000);
    expect(itemsOf(sim.player).some((i) => i.id === bag.id || inIt.includes(i.id))).toBe(false);
    expect(claimAmount(sim.player, claim!)).toBe(Math.min(claim!.value!, claim!.cap));
    expect(claimAmount(sim.player, { ...claim!, value: claim!.cap * 3 })).toBe(claim!.cap);
    sim.must({ kind: 'travel.bag_claim', payload: { claimId: claim!.id } });
    expect(bagClaimsOf(sim.player)[0]!.paid).toBe(Math.min(claim!.value!, claim!.cap));
  });

  it('is landed on a booked flight’s arrival, where the airline mishandles it', () => {
    const sim = life('bag-trip');
    withBag(sim);
    const rates = BAGGAGE as { domesticRate: number };
    const was = rates.domesticRate;
    rates.domesticRate = 1;
    try {
      const day = sim.now + 14 * MS_DAY;
      const r = sim.must<{ journeyId: string; arriveAt: number }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, bags: 1, nights: 2 } });
      sim.advanceTo(r.arriveAt + 3 * 3_600_000);
      expect(bagClaimsOf(sim.player)).toHaveLength(1);
    } finally { rates.domesticRate = was; }
  });
});
