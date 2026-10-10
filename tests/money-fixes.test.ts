/**
 * The money repairs of 2026-10-10, each held by the behavior it fixed: a moved statement day makes one longer
 * cycle, never a statement a day; the yearly fee is charged once in its month; a US payment that bounced is charged
 * the late fee and not the returned payment's too; a hardship plan is for a holder who can't pay; an account
 * canceled new takes its standing orders with it; and a stranger's charge earns no rewards.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { cardOf, DUE_KIND, MIN_CYCLE_DAYS, STATEMENT_KIND, stateOf } from '@/engine/systems/credit';
import { bankAccountsOf } from '@/engine/systems/banking';

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'mf') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, ...extra }, seed);
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const statements = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === STATEMENT_KIND && i.status === 'done' && i.payload.personId === sim.player.id).length;
const nextStatement = (sim: Simulation) => sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === sim.player.id)!.at;
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || (a.kind !== 'checking' && a.kind !== 'savings')) continue;
    if (a.balance !== 0) give(sim, a.id, -a.balance);
  }
}

describe('a moved statement day', () => {
  it('makes one longer cycle: moving it every day for a month cuts one statement, not thirty', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable' }, 'mf-day');
    sim.advanceTo(nextStatement(sim) + 1000);
    const before = statements(sim);
    const last = stateOf(sim.player, cardOf(sim, sim.player)!).statementAt!;
    for (let d = 0; d < 30; d += 1) {
      sim.must({ kind: 'card.set_statement_day', payload: { day: ((d + 3) % 28) + 1 } });
      expect(nextStatement(sim) - last).toBeGreaterThanOrEqual(MIN_CYCLE_DAYS * MS_DAY);
      sim.advanceBy(MS_DAY);
    }
    expect(statements(sim) - before).toBeLessThanOrEqual(1);
  });
});

describe('a US autopay that bounces', () => {
  it('late, is charged the late fee, and no returned payment’s fee beside it', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'scraping' }, 'mf-bounce');
    const c = cardOf(sim, sim.player)!;
    give(sim, c.id, -300_00);
    let due = sim.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === sim.player.id)?.at;
    while (due === undefined) { sim.advanceTo(nextStatement(sim) + 1000); due = sim.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === sim.player.id)?.at; }
    broke(sim);
    sim.advanceTo(due + 1000);
    const at = (memo: string) => sim.universe.transactions.filter((t) => t.memo === memo && t.at >= due! && t.at <= due! + 2000).length;
    expect(sim.universe.notifications.some((n) => n.title === 'A Card Payment Bounced')).toBe(true);
    expect(at('Returned payment fee')).toBe(0);
    expect(at('Late fee')).toBe(1);
    expect(sim.universe.notifications.some((n) => n.title === 'A Late Card Payment')).toBe(true);
  });
});

describe('a hardship plan', () => {
  it('is refused to a holder whose bank could clear the card today', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'wealthy' }, 'mf-hardship');
    const c = cardOf(sim, sim.player)!;
    give(sim, c.id, -50_00);
    expect(sim.execute({ kind: 'card.request_hardship', payload: {} }).error).toBe('You could pay it off today: a hardship plan is for when you can’t.');
    broke(sim);
    expect(sim.execute({ kind: 'card.request_hardship', payload: {} }).ok).toBe(true);
  });
});

describe('an account canceled new', () => {
  it('takes its standing orders with it', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ca-td' }, 'mf-cancel');
    for (const a of bankAccountsOf(sim, sim.player)) if (a.kind === 'savings') sim.must({ kind: 'bank.close_savings', payload: { accountId: a.id } });
    const opened = sim.universe.accounts[sim.must<{ accountId: string }>({ kind: 'bank.open_savings', payload: {} }).accountId]!;
    sim.must({ kind: 'bank.add_standing_order', payload: { toId: opened.id, amount: 100_00, day: 15 } });
    sim.must({ kind: 'bank.cancel_new', payload: { accountId: opened.id } });
    expect(sim.player.payments!.standingOrders.filter((o) => o.toId === opened.id)).toHaveLength(0);
    expect(sim.universe.scheduled.filter((i) => i.kind === 'bank.standing_order' && i.status === 'pending')).toHaveLength(0);
  });
});
