import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { DEFAULT_CITY_ID } from '@/engine/world/bootstrap';
import { CITIES } from '@/engine/content/geography';
import { formatDateTime, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { openDecisions, simulationLoad } from '@/engine/world/world';
import { netWorth } from '@/engine/systems/finance';

describe('a new universe boots and runs', () => {
  it('creates a coherent save', () => {
    const sim = quickSave();
    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors);
    expect(report.errors).toEqual([]);
    expect(sim.player.displayName).toBeTruthy();
    expect(sim.player.primaryAccountId).toBeTruthy();
    // A new save is the player and nobody else. The systems that used to
    // populate a world around them — the industry, and then the family — are
    // gone, and nothing generates a name any more.
    expect(Object.keys(sim.universe.people)).toEqual([sim.universe.playerId]);
  });

  it('has a player who exists somewhere in time and space', () => {
    const sim = quickSave();
    expect(formatDateTime(sim.now, sim.homeZone)).toContain('2026');
    expect(sim.universe.homeZone).toBe(CITIES.get(DEFAULT_CITY_ID)?.timeZone);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('advances a week without corrupting anything', () => {
    const sim = quickSave();
    const before = sim.now;
    const result = sim.advanceTo(sim.now + 7 * MS_DAY);

    expect(sim.now).toBe(before + 7 * MS_DAY);
    expect(result.itemsProcessed).toBeGreaterThan(0);
    expect(sim.ledger.audit()).toEqual([]);

    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors);
    expect(report.errors).toEqual([]);
  });

  it('advances a full year and stays consistent', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 365 * MS_DAY);

    expect(sim.ledger.audit()).toEqual([]);
    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors.slice(0, 10));
    expect(report.errors).toEqual([]);

    const load = simulationLoad(sim);
    expect(load.people).toBeLessThan(1500);
    expect(load.pendingEvents).toBeLessThan(20000);
  });

  it('runs three years without breaking anything', () => {
    // `audit()` re-derives every balance from the postings and proves each
    // transaction sums to zero, which is the invariant worth holding: money
    // may move as much as it likes and may not appear.
    const sim = quickSave();
    for (let month = 0; month < 36; month++) sim.advanceTo(sim.now + 30 * MS_DAY);

    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);

    // The clock kept turning the day over for all three years.
    const w = sim.player.wellbeing;
    expect(w.energy).toBeGreaterThan(0);
    expect(w.condition).toBeGreaterThan(0);
    expect(sim.now - sim.player.lastSleptAt!, 'no night in the last day of three years').toBeLessThan(MS_DAY);
  });

  it('keeps money as the sum of postings', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 90 * MS_DAY);
    const recomputed = sim.ledger.recompute();
    for (const [id, account] of Object.entries(sim.universe.accounts)) {
      expect(account.balance).toBe(recomputed[id] ?? 0);
    }
    const worth = netWorth(sim, sim.player.id);
    expect(Number.isFinite(worth.total)).toBe(true);
  });

  it('is deterministic: the same seed produces the same world', () => {
    const a = quickSave(undefined, 'determinism-seed');
    const b = quickSave(undefined, 'determinism-seed');
    a.advanceTo(a.now + 30 * MS_DAY);
    b.advanceTo(b.now + 30 * MS_DAY);

    expect(a.now).toBe(b.now);
    expect(Object.keys(a.universe.people).length).toBe(Object.keys(b.universe.people).length);
    expect(a.universe.transactions.length).toBe(b.universe.transactions.length);
    expect(netWorth(a, a.player.id).total).toBe(netWorth(b, b.player.id).total);
  });

  it('isolates saves from one another', () => {
    const one = quickSave(undefined, 'seed-one', 1);
    const two = quickSave(undefined, 'seed-two', 2);
    expect(one.universe.meta.id).not.toBe(two.universe.meta.id);

    one.advanceTo(one.now + 30 * MS_DAY);
    const twoBefore = two.universe.transactions.length;
    one.advanceTo(one.now + 30 * MS_DAY);
    expect(two.universe.transactions.length).toBe(twoBefore);

    for (const person of Object.values(two.universe.people)) {
      expect(person.saveId).toBe(two.universe.meta.id);
    }
  });
});

/**
 * The Decision Center.
 *
 * Nothing in this build raises a decision on its own: the one thing that did
 * was the reimbursement on the family's pictures, and it went with them. The
 * room is kept for whatever the revamp puts in it, so these raise a row by
 * hand through `requireDecision` and hold the room itself — answering,
 * waving away, closing on its date, and staying open when the button behind
 * it refuses.
 */
describe('the Decision Center', () => {
  const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) =>
    sim.execute<{ ok: boolean; id?: string; error?: string }>({ kind, payload }).value!;

  /** Puts a plan on the calendar and raises a row whose one button calls it off. */
  function raiseOne(sim: Simulation, dueInDays?: number): { entryId: string } {
    const put = run(sim, 'calendar.schedule', { title: 'Dentist', at: sim.now + 10 * MS_DAY });
    expect(put.ok, put.error).toBe(true);
    sim.requireDecision({
      urgency: 60,
      category: 'personal',
      title: 'Keep The Dentist?',
      detail: 'It is on the calendar in ten days.',
      actions: [{ label: 'Call It Off', commandKind: 'calendar.cancel', payload: { entryId: put.id } }],
      ...(dueInDays !== undefined ? { dueAt: sim.now + dueInDays * MS_DAY } : {}),
      refType: 'sched',
      refId: put.id,
    });
    return { entryId: put.id! };
  }

  it('raises one row for one thing, however often it is asked', () => {
    const sim = quickSave({}, 'decisions-once');
    raiseOne(sim);
    const [row] = openDecisions(sim);
    sim.requireDecision({
      urgency: 80, category: row!.category, title: row!.title, detail: 'Still there.',
      refType: row!.refType, refId: row!.refId,
    });
    expect(openDecisions(sim)).toHaveLength(1);
    expect(openDecisions(sim)[0]!.urgency).toBe(80);
  });

  it('does the thing when the button on it is pressed', () => {
    const sim = quickSave({}, 'decisions-press');
    const { entryId } = raiseOne(sim);
    const row = openDecisions(sim)[0]!;

    const done = run(sim, 'world.take_decision_action', { decisionId: row.id, actionIndex: 0 });
    expect(done.ok).toBe(true);
    expect(sim.timeline.get(entryId)?.status).toBe('cancelled');
    expect(sim.universe.decisions[row.id]!.resolvedAt).toBeDefined();
    expect(openDecisions(sim)).toHaveLength(0);
  });

  it('stops asking once the row is waved away', () => {
    const sim = quickSave({}, 'decisions-dismiss');
    raiseOne(sim);
    const row = openDecisions(sim)[0]!;

    run(sim, 'world.dismiss_decision', { decisionId: row.id });
    expect(sim.universe.decisions[row.id]!.dismissedAt).toBeDefined();
    sim.advanceTo(sim.now + 8 * MS_DAY);
    expect(openDecisions(sim)).toHaveLength(0);
  });

  it('closes a dated row on its date, and forgets it a season later', () => {
    const sim = quickSave({}, 'decisions-dated');
    raiseOne(sim, 5);
    const row = openDecisions(sim)[0]!;

    sim.advanceTo(sim.now + 8 * MS_DAY);
    expect(sim.universe.decisions[row.id]!.resolvedAt).toBeDefined();
    expect(sim.universe.decisions[row.id]!.resolvedAt!).toBeGreaterThanOrEqual(row.dueAt!);
    expect(sim.universe.decisions[row.id]!.dismissedAt).toBeUndefined();

    sim.advanceTo(sim.now + 200 * MS_DAY);
    expect(sim.universe.decisions[row.id], 'a closed row outlived its retention').toBeUndefined();
  });

  it('keeps the row open when the command behind the button refuses', () => {
    const sim = quickSave({}, 'decisions-late');
    const { entryId } = raiseOne(sim);
    const row = openDecisions(sim)[0]!;

    // Past the start, a plan can no longer be called off, and the command
    // says so inside a successful envelope. The dated row would close on its
    // own, so this one is undated.
    sim.advanceTo(sim.timeline.get(entryId)!.at + MS_HOUR);

    // Read off the envelope, because the envelope is what the screen reads.
    const done = sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: row.id, actionIndex: 0 } });
    expect(done.ok, 'the refusal came back inside a successful envelope, so nobody is told').toBe(false);
    expect(done.error).toMatch(/already/);
    expect(sim.universe.decisions[row.id]!.resolvedAt).toBeUndefined();
  });
});
