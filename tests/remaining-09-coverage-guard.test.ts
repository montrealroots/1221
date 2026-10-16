/**
 * life.look_after's payment refused after its refusal passed (brief 09 of 2026-10-16, section 5; the coverage area). A
 * meal is paid for when it's ordered, before its hour, and `lookAfterRefusal` asks `spendRefusal` at the same moment
 * what `spend` asks, so a payment that doesn't go through after the menu offered the meal is reached by no play: the
 * command's own comment says so (systems/life.ts, 2026-10-12), and until that day no test reached it either. It's kept,
 * a necessary defensive guard: were the two ever to disagree, the meal would be eaten unpaid. This holds what it does.
 *
 * FIXTURE: `spend` made to refuse once by a test double, on a save the creation screen's draft makes. Everything else is
 * the engine's own: the command, its refusal, and the rollback that leaves the save as it was.
 */
import { describe, expect, it, vi } from 'vitest';
import { createSave } from '@/engine';
import { instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';

const h = vi.hoisted(() => ({ refuse: false }));
vi.mock('@/engine/systems/spending', async (orig) => {
  const real = await orig<typeof import('@/engine/systems/spending')>();
  return { ...real, spend: (...args: Parameters<typeof real.spend>) => (h.refuse ? false : real.spend(...args)) };
});

describe('life.look_after’s payment', () => {
  it('GUARD: a meal whose payment fails after the menu offered it is refused, “The payment didn’t go through.”, the clock, the dials and the ledger as they were; with the payment going through, the same meal is eaten and paid (FIXTURE: spend refused by a test double)', () => {
    const sim = createSave(1, 'r09-pay', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 30, hour: 12 }, 'America/New_York'));
    // TEST SETUP: hungry, so a meal isn't refused as unwanted, and awake.
    Object.assign(sim.player.wellbeing, { nourishment: 30, energy: 80 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    const was = JSON.stringify(sim.universe);
    h.refuse = true;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).error).toBe('The payment didn’t go through.');
    expect(JSON.stringify(sim.universe)).toBe(was);
    h.refuse = false;
    const ate = sim.execute<{ changed: { nourishment?: number } }>({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(ate.ok, ate.error).toBe(true);
    expect(ate.value!.changed.nourishment).toBeGreaterThan(0);
    expect(sim.universe.transactions.filter((t) => t.memo === 'A meal')).toHaveLength(1);
  });
});
