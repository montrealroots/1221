/**
 * The laws of a save (`core/invariants.ts`, from 2026-10-06): a new life and a
 * day of it hold every one, and each law, broken once by hand, is reported by
 * name, so a clean report means something.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { itemsOf } from '@/engine/systems/items';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, seed);
const laws = (sim: ReturnType<typeof life>) => breaches(sim.universe).map((b) => b.law);

describe('the laws of a save', () => {
  it('hold in a new life and after two weeks of it', () => {
    const sim = life('laws-hold');
    expect(breaches(sim.universe)).toEqual([]);
    sim.advanceBy(14 * MS_DAY);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('report each broken law by name', () => {
    const cases: [string, (sim: ReturnType<typeof life>) => void][] = [
      ['transaction doesn’t balance', (s) => { s.universe.transactions[0]!.postings[0]!.amount += 1; }],
      ['balance not the sum of its postings', (s) => { s.universe.accounts[s.player.primaryAccountId!]!.balance += 100; }],
      ['item id held twice', (s) => { const i = itemsOf(s.player)[0]!; s.player.items!.push({ ...i }); }],
      ['item in a vehicle they don’t have', (s) => { itemsOf(s.player)[0]!.at = { kind: 'vehicle', vehicleId: 'no-such-car' }; }],
      ['item on an order that doesn’t exist', (s) => { itemsOf(s.player)[0]!.at = { kind: 'order', orderId: 'no-such-order' }; }],
      ['item at a home they don’t own', (s) => { itemsOf(s.player)[0]!.at = { kind: 'home', home: 'owned:nowhere' }; }],
      ['item quantity not a count', (s) => { itemsOf(s.player)[0]!.quantity = -1; }],
      ['item condition off its scale', (s) => { itemsOf(s.player)[0]!.condition = 2; }],
      ['wellbeing off its scale', (s) => { s.player.wellbeing.energy = 140; }],
      ['pending item left behind in the past', (s) => { s.universe.scheduled.find((x) => x.status === 'pending')!.at = s.now - 3 * MS_DAY; }],
    ];
    for (const [law, breakIt] of cases) {
      const sim = life(`laws-${law}`);
      breakIt(sim);
      expect(laws(sim), law).toContain(law);
    }
  });
});
