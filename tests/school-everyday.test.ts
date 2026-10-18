/**
 * School and everyday life (from 2026-10-08): the work-study protective
 * equipment the school requires, bought through the bank once, at the first
 * Saturday shift if not before, and the shift missed when the bank can't
 * cover it; and coursework on one's feet refused when spent, as training is,
 * by the button and by a routine alike.
 */
import { createSave,loadSave } from '@/engine';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR,instantFromZoned } from '@/engine/core/time';
import { deserialise,serialise } from '@/engine/persistence/adapter';
import { overdraftHeadroom } from '@/engine/systems/lending';
import { SHIFT_KIND,ppeCost } from '@/engine/systems/school';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { describe,expect,it } from 'vitest';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9) => instantFromZoned({ year: 2026, month, day, hour }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt);
const money = (sim: Simulation) => mine(sim).filter((a) => a.kind !== 'credit_card').reduce((s, a) => s + a.balance, 0);
/** Everything in the bank and the wallet spent elsewhere, posted, never set. */
function drain(sim: Simulation) {
  for (const a of mine(sim)) if (a.kind === 'credit_card') a.creditLimit = 0;
  for (const a of mine(sim)) if (a.balance > 0 && a.kind !== 'credit_card') sim.post({ memo: 'Spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: a.balance }, { accountId: a.id, amount: -a.balance }] });
  // And the overdraft's room, which the first of the month's rent took up until the home went in the scope reset of
  // 2026-10-09: with it there, the bank would pay.
  const current = sim.player.primaryAccountId ? sim.universe.accounts[sim.player.primaryAccountId] : undefined;
  const room = overdraftHeadroom(sim, sim.player);
  if (current && room > 0) sim.post({ memo: 'Spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: room }, { accountId: current.id, amount: -room }] });
}
const firstShift = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.status === 'pending' && i.payload.elective === false).sort((a, b) => a.at - b.at)[0]!;

describe('the protective equipment work-study requires', () => {
  it('is bought once, through the bank, as a school cost', () => {
    let sim = life('pp-buy');
    tended(sim, at(8, 31, 12));
    const before = money(sim);
    const r = sim.must<{ cost: number }>({ kind: 'school.buy_ppe', payload: {} });
    expect(r.cost).toBe(ppeCost(sim));
    expect(money(sim)).toBe(before - r.cost);
    sim = reload(sim);
    expect(sim.execute({ kind: 'school.buy_ppe', payload: {} }).error).toMatch(/^You already bought it on /);
    // The first Saturday's shift worked, and nothing charged again.
    const shift = firstShift(sim);
    tended(sim, shift.at + 7 * MS_HOUR);
    expect(sim.universe.scheduled.find((i) => i.id === shift.id)!.status).not.toBe('missed');
    // In the ledger once, whatever else the week cost.
    expect(sim.universe.transactions.filter((t) => t.memo === 'Required protective equipment for work-study')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('not bought before, is bought at the first shift; the bank short of it, the supervisor sends you home', () => {
    const sim = life('pp-shift');
    tended(sim, at(8, 31, 12));
    const twin = reload(sim);
    const shift = firstShift(sim);
    const before = money(sim);
    tended(sim, shift.at + 7 * MS_HOUR);
    expect(sim.player.school!.ppe).toBeDefined();
    expect(sim.universe.transactions.filter((t) => t.memo === 'Required protective equipment for work-study')).toHaveLength(1);
    void before;
    expect(shift.status).not.toBe('missed');
    // The twin with nothing in the bank.
    drain(twin);
    const s2 = firstShift(twin);
    const worked = twin.player.school!.tally.worked;
    tended(twin, s2.at + 7 * MS_HOUR);
    expect(twin.player.school!.ppe).toBeUndefined();
    expect(twin.universe.scheduled.find((i) => i.id === s2.id)!.status).toBe('missed');
    expect(twin.player.school!.tally.worked).toBe(worked);
    expect(twin.universe.notifications.filter((n) => n.title === 'Sent Home From Work-Study')).toHaveLength(1);
    expect(twin.execute({ kind: 'school.buy_ppe', payload: {} }).error).toMatch(/^Your bank can’t cover \$[\d,]+\.\d\d, so nothing was charged\.$/);
    expect(breaches(twin.universe)).toEqual([]);
  });
});
