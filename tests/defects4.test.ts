/**
 * The loose ends four fixers of 2026-10-13’s third round found outside their files, each held here through the command a
 * player sends or the clock that carries it, read where the player reads it, against figures worked out from the bank’s
 * or the rule’s own words. Each failed before its fix, on the break named beside it.
 *
 * - A statement period’s edge in a month run over (December’s next, a rebuilt card period’s month before January) came
 *   a minute late: December’s account period ended at 00:01 on 1 January, a minute into January’s, and a card’s rebuilt
 *   period across a new year began at 9:01.
 * - Chase’s Overdraft Assist read only the end of the next business day: a day ended within $50 and a next day ended
 *   past it was charged the first day’s item too, where Chase charges none overdrawn by $50 or less at the end of the
 *   business day.
 * - A HUSKY D held from before 1 October 2026 by an F-1 student ended at renewal with “Last month’s income is over what
 *   it allows.”, whatever the income; federal Medicaid admits no F-1 from that day.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday 24
 * August 2026, born in New York, or in London on an F-1. TEST SETUP, said where it’s done: the calendar cleared of what
 * wants the player before a meal, and the nourishment that lets one be ordered.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { periodsOf } from '@/engine/systems/statements';
import { healthOf } from '@/engine/systems/health';

/** New Haven’s clock, worked out here: Eastern Daylight Time (UTC−4) until 1 November 2026, Eastern Standard after. */
const edt = (year: number, month: number, day: number, hour: number) => Date.UTC(year, month - 1, day, hour + 4);
const est = (year: number, month: number, day: number, hour: number) => Date.UTC(year, month - 1, day, hour + 5);

const student = (seed: string, home = 'us-ny-newyork'): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: home, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const mine = (sim: Simulation, kind: Account['kind']): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && a.category !== 'term')!;
function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const moved = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).map((t) => ({ at: t.at, amount: t.postings.find((p) => p.accountId === account.id)?.amount }))
  .filter((m) => m.amount !== undefined);
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

describe('statement periods across a new year', () => {
  it('PLAYER JOURNEY: on 15 January 2027 the checking account’s December period ends at midnight on 1 January, where January’s begins, and the card’s rebuilt January 20, 2026 statement begins at nine on 20 December 2025', () => {
    const sim = student('d4-periods');
    sim.advanceTo(est(2027, 1, 15, 12));
    const checking = periodsOf(sim, sim.universe.accounts[sim.player.primaryAccountId!]!);
    const december = checking.find((p) => p.label === 'December 2026')!;
    const january = checking.find((p) => p.label.startsWith('January 2027'))!;
    // Midnight on 1 January 2027 in New Haven, Eastern Standard Time, is 5 AM in UTC. Until 2026-10-13 December’s ended a
    // minute after it.
    expect(december.to).toBe(est(2027, 1, 1, 0));
    expect(january.from).toBe(est(2027, 1, 1, 0));
    expect(december.from).toBe(est(2026, 12, 1, 0));
    const card = periodsOf(sim, mine(sim, 'credit_card'));
    const rebuilt = card.find((p) => p.label === 'Statement Of January 20, 2026 (Rebuilt)')!;
    const before = card.find((p) => p.label === 'Statement Of December 20, 2025 (Rebuilt)')!;
    // Nine on 20 December 2025, Eastern Standard Time. Until 2026-10-13 it was 9:01, the month before January asked for as
    // the 0th.
    expect(rebuilt.from).toBe(est(2025, 12, 20, 9));
    expect(before.to).toBe(est(2025, 12, 20, 9));
  }, 120_000);
});

describe('Chase’s Overdraft Assist, the end of the item’s own business day', () => {
  it('PLAYER JOURNEY: Wednesday’s item, the day put back inside $50 by a transfer from savings, is let go though Thursday ends past $50, and nothing is charged at Thursday’s end; Thursday’s is held for Friday’s', () => {
    const sim = student('d4-assist');
    sim.advanceTo(edt(2026, 10, 14, 11));
    const checking = mine(sim, 'checking');
    const savings = mine(sim, 'savings');
    must(sim, 'bank.debit_overdraft', { on: true });
    // Everything in checking moved to savings by Move Money: nothing left in it.
    must(sim, 'bank.transfer', { fromId: checking.id, toId: savings.id, amount: checking.balance });
    expect(checking.balance).toBe(0);
    const order = (hour: number, day = 14) => {
      sim.advanceTo(edt(2026, 10, day, hour));
      for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer && item.at < sim.now + 2 * 3_600_000) sim.timeline.cancel(item.id, sim.now); // TEST SETUP
      sim.player.wellbeing.nourishment = 30; // TEST SETUP
      must(sim, 'life.look_after', { action: 'order' });
    };
    // A meal ordered in at 5 PM, $34.65 on the debit card: $34.65 overdrawn, inside $50, so no item is held.
    order(17);
    expect(checking.balance).toBe(-34_65);
    expect(checking.pendingItems).toBeUndefined();
    // Another at 6 PM: $69.30 overdrawn, past $50, so Wednesday’s item is held.
    order(18);
    expect(checking.balance).toBe(-69_30);
    expect(checking.pendingItems).toEqual([{ day: '2026-10-14', count: 1 }]);
    // $35 from savings at 9 PM: $34.30 overdrawn, and $44.30 when Wednesday ends, the week’s $10 of groceries taken
    // at midnight; inside $50 either way.
    sim.advanceTo(edt(2026, 10, 14, 21));
    must(sim, 'bank.transfer', { fromId: savings.id, toId: checking.id, amount: 35_00 });
    expect(checking.balance).toBe(-34_30);
    // Thursday at 5 PM a third: $78.95 overdrawn, past $50, and Thursday ends there: only Thursday’s item is held.
    order(17, 15);
    expect(checking.balance).toBe(-78_95);
    expect(checking.pendingItems).toEqual([{ day: '2026-10-15', count: 1 }]);
    // Friday at noon, before the day’s work-study wages: Wednesday’s item was let go at midnight into Thursday, its day
    // ended inside $50, and nothing is charged. Until 2026-10-13 it was charged $34 at midnight into Friday, when
    // Thursday, its next business day, ended past $50.
    sim.advanceTo(edt(2026, 10, 16, 12));
    expect(moved(sim, checking, 'Overdraft fee')).toEqual([]);
    // Thursday’s held still, and Friday’s $10 of groceries at midnight, $88.95 overdrawn, Friday’s.
    expect(checking.pendingItems).toEqual([{ day: '2026-10-15', count: 1 }, { day: '2026-10-16', count: 1 }]);
  }, 120_000);
});

describe('HUSKY D held from before 1 October 2026', () => {
  it('PLAYER JOURNEY: an F-1 student who withdrew on 2 September 2026 and enrolled in HUSKY D that month is told at its renewal on 1 October 2027 that it’s now for a citizen or a green card of five years, not that her income was over', () => {
    const sim = student('d4-husky', 'uk-eng-london');
    sim.advanceTo(edt(2026, 9, 2, 12));
    must(sim, 'school.withdraw', { confirm: true });
    sim.advanceTo(edt(2026, 9, 3, 12));
    expect(must<{ kind: string }>(sim, 'health.enroll')).toMatchObject({ kind: 'medicaid' });
    const program = healthOf(sim.player).program!;
    expect([program.state, program.from, program.renewAt]).toEqual(['ct', edt(2026, 10, 1, 0), edt(2027, 10, 1, 0)]);
    sim.advanceTo(edt(2027, 10, 2, 12));
    // Said at the renewal, and ended at the month's end at least ten days on, 31 October (42 CFR 431.211; from
    // 2026-10-16: until then it ended at the renewal's own hour, “Your Public Cover Ended At Renewal”).
    expect(notices(sim, 'Your Public Cover Ends').map((n) => n.body)).toEqual([
      'From October 1, 2026, HUSKY D is for a US citizen, or somebody with a green card for five years, and renewing it reads that: HUSKY D ends on October 31, 2027, and out of status the marketplace won’t take you.',
    ]);
    expect(healthOf(sim.player).program!.until).toBe(edt(2027, 11, 1, 0));
  }, 300_000);
});
