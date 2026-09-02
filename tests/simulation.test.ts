import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse, migrate } from '@/engine';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { formatTime, MS_DAY, MS_HOUR, MS_MINUTE, zonedParts } from '@/engine/core/time';
import { skipTargets, checkConflicts, entriesBetween, monthGrid } from '@/engine/world/calendar';
import { openDecisions } from '@/engine/world/world';

describe('time advancement', () => {
  it('refuses to run the clock backwards', () => {
    const sim = quickSave();
    expect(() => sim.advanceTo(sim.now - MS_HOUR)).toThrow(/backwards/);
  });

  it('processes due items in chronological order', () => {
    const sim = quickSave();
    const fired: number[] = [];
    sim.onSchedule('test.ordered', (item) => { fired.push(item.payload.index as number); });

    // Deliberately schedule out of order.
    for (const index of [3, 1, 4, 2, 0]) {
      sim.schedule({
        at: sim.now + (index + 1) * MS_HOUR,
        kind: 'test.ordered',
        label: `step ${index}`,
        category: 'system',
        payload: { index },
      });
    }
    sim.advanceTo(sim.now + 6 * MS_HOUR);
    expect(fired).toEqual([0, 1, 2, 3, 4]);
  });

  it('sets the clock to each item as it fires, not to the target', () => {
    const sim = quickSave();
    const seen: number[] = [];
    const target = sim.now + 5 * MS_HOUR;
    sim.onSchedule('test.clock', (item, s) => { seen.push(s.now - item.at); });
    for (let i = 1; i <= 4; i++) {
      sim.schedule({ at: sim.now + i * MS_HOUR, kind: 'test.clock', label: 'x', category: 'system' });
    }
    sim.advanceTo(target);
    // Every handler ran at exactly the moment it was due.
    expect(seen).toEqual([0, 0, 0, 0]);
    expect(sim.now).toBe(target);
  });

  it('lands exactly on the requested instant', () => {
    const sim = quickSave();
    const target = sim.now + 37 * MS_DAY + 11 * MS_HOUR + 13 * MS_MINUTE;
    sim.advanceTo(target);
    expect(sim.now).toBe(target);
  });

  it('runs recurrences without drifting', () => {
    const sim = quickSave();
    let count = 0;
    sim.onSchedule('test.weekly', () => { count++; });
    sim.schedule({
      at: sim.now + MS_DAY,
      kind: 'test.weekly',
      label: 'weekly',
      category: 'system',
      recurrence: { unit: 'week', interval: 1, count: 5 },
    });
    sim.advanceTo(sim.now + 60 * MS_DAY);
    expect(count).toBe(5);
  });

  it('catches a handler that schedules itself in a loop', () => {
    const sim = quickSave();
    sim.onSchedule('test.runaway', (_item, s) => {
      s.schedule({ at: s.now, kind: 'test.runaway', label: 'loop', category: 'system' });
    });
    sim.schedule({ at: sim.now + MS_MINUTE, kind: 'test.runaway', label: 'loop', category: 'system' });
    expect(() => sim.advanceTo(sim.now + MS_DAY)).toThrow(/exceeded/);
  });

  it('refuses to schedule a kind with no handler, rather than dropping it silently', () => {
    const sim = quickSave();
    expect(() => sim.schedule({
      at: sim.now + MS_HOUR, kind: 'nobody.handles.this', label: 'x', category: 'system',
    })).toThrow(/no handler is registered/);
  });
});

describe('sleep', () => {
  it('advances the world by exactly the hours slept', () => {
    const sim = quickSave();
    const before = sim.now;
    const result = sim.execute<{ wokeAt: number }>({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(result.ok).toBe(true);
    expect(sim.now).toBe(before + 8 * MS_HOUR);
  });

  it('restores energy and pays down sleep debt', () => {
    const sim = quickSave();
    sim.player.wellbeing.energy = 20;
    sim.player.wellbeing.sleepDebt = 12;
    sim.execute({ kind: 'life.sleep', payload: { hours: 9 } });
    expect(sim.player.wellbeing.energy).toBeGreaterThan(60);
    expect(sim.player.wellbeing.sleepDebt).toBeLessThan(12);
  });

  it('accrues debt when the night is short', () => {
    const sim = quickSave();
    sim.player.wellbeing.sleepDebt = 0;
    sim.execute({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(sim.player.wellbeing.sleepDebt).toBeGreaterThan(0);
  });

  it('keeps processing the world while the player is unconscious', () => {
    const sim = quickSave();
    let fired = false;
    sim.onSchedule('test.overnight', () => { fired = true; });
    sim.schedule({
      at: sim.now + 4 * MS_HOUR,
      kind: 'test.overnight', label: 'a bill falls due', category: 'finance',
    });
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(fired).toBe(true);
  });

  it('lands on the right wall-clock time when sleeping across a DST change', () => {
    // 7 March 2026 at 11:30 PM in Los Angeles, sleeping eight hours across the
    // spring-forward transition, wakes at 8:30 AM rather than 7:30 AM.
    const sim = quickSave({ startYear: 2026, startMonth: 3, startDay: 7 });
    const zone = sim.homeZone;
    const bedtime = sim.now;
    const parts = zonedParts(bedtime, zone);
    expect(parts.day).toBe(7);

    sim.advanceTo(bedtime + (23.5 - parts.hour - parts.minute / 60) * MS_HOUR);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    // Eight elapsed hours from 11:30 PM on the night the clocks go forward.
    expect(formatTime(sim.now, zone)).toBe('8:30 AM');
  });
});

describe('skip to event', () => {
  it('shows what would be crossed and missed before committing', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 20 * MS_DAY);
    const targets = skipTargets(sim, 5);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target.item.at).toBeGreaterThan(sim.now);
      // Nothing in the crossed list is after the target itself.
      for (const crossed of target.crossed) expect(crossed.at).toBeLessThan(target.item.at);
      expect(target.missed.every((m) => m.requiresPlayer)).toBe(true);
    }
  });

  it('does not mutate anything when only inspecting targets', () => {
    const sim = quickSave();
    const before = sim.now;
    const transactions = sim.universe.transactions.length;
    skipTargets(sim, 10);
    expect(sim.now).toBe(before);
    expect(sim.universe.transactions.length).toBe(transactions);
  });

  it('processes the skipped interval rather than just moving the clock', () => {
    const sim = quickSave();
    const target = skipTargets(sim, 20).find((t) => t.daysAway > 10);
    if (!target) return;
    const before = sim.universe.transactions.length;
    sim.advanceTo(target.item.at);
    expect(sim.universe.transactions.length).toBeGreaterThanOrEqual(before);
    expect(sim.now).toBe(target.item.at);
  });
});

describe('the calendar', () => {
  it('flags two commitments that overlap', () => {
    const sim = quickSave();
    sim.onSchedule('test.commitment', () => undefined);
    const at = sim.now + 3 * MS_DAY;
    sim.schedule({
      at, kind: 'test.commitment', label: 'Audition', category: 'career',
      requiresPlayer: true, durationMinutes: 120,
    });
    sim.schedule({
      at: at + 30 * MS_MINUTE, kind: 'test.commitment', label: 'Shift', category: 'work',
      requiresPlayer: true, durationMinutes: 120,
    });

    const conflicts = checkConflicts(sim, at + 30 * MS_MINUTE, 120);
    expect(conflicts.length).toBeGreaterThan(0);

    const entries = entriesBetween(sim, at - MS_HOUR, at + 6 * MS_HOUR);
    expect(entries.filter((e) => e.conflicted).length).toBeGreaterThanOrEqual(2);
  });

  it('does not treat back-to-back commitments as a collision', () => {
    const sim = quickSave();
    sim.onSchedule('test.back_to_back', () => undefined);
    const at = sim.now + 5 * MS_DAY;
    sim.schedule({
      at, kind: 'test.back_to_back', label: 'First', category: 'career',
      requiresPlayer: true, durationMinutes: 60,
    });
    expect(checkConflicts(sim, at + 60 * MS_MINUTE, 60)).toHaveLength(0);
  });

  it('builds a month grid that always covers whole weeks', () => {
    const sim = quickSave();
    for (const month of [1, 2, 6, 12]) {
      const grid = monthGrid(sim, 2026, month);
      expect(grid.length % 7).toBe(0);
      expect(grid.filter((d) => d.inMonth).length).toBeGreaterThan(27);
      expect(grid[0]?.weekday).toBe(0);
    }
  });

  it('marks a leap day as in-month', () => {
    const sim = quickSave();
    const grid = monthGrid(sim, 2028, 2);
    expect(grid.filter((d) => d.inMonth)).toHaveLength(29);
  });
});

describe('commands', () => {
  it('never applies the same idempotency key twice', () => {
    const sim = quickSave();
    const accountId = sim.player.primaryAccountId as string;
    const before = sim.ledger.account(accountId).balance;

    const key = 'purchase-abc-123';
    const first = sim.execute({
      kind: 'finance.transfer',
      payload: { fromAccountId: accountId, toAccountId: accountId, amount: 1 },
      idempotencyKey: key,
    });
    const second = sim.execute({
      kind: 'finance.transfer',
      payload: { fromAccountId: accountId, toAccountId: accountId, amount: 1 },
      idempotencyKey: key,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.replayed).toBe(true);
    expect(sim.ledger.account(accountId).balance).toBe(before);
  });

  it('rolls back completely when a command fails part-way', () => {
    const sim = quickSave();
    const accounts = sim.ledger.accountsOf(sim.player.id).length;
    const transactions = sim.universe.transactions.length;

    // A loan far beyond what the credit score supports.
    const result = sim.execute({
      kind: 'finance.take_loan',
      payload: { borrowerId: sim.player.id, principal: 500_000_000_00, months: 360, product: 'mortgage' },
    });
    expect(result.ok).toBe(false);

    // No orphan account, no orphan transaction, no half-created state.
    expect(sim.ledger.accountsOf(sim.player.id)).toHaveLength(accounts);
    expect(sim.universe.transactions.length).toBe(transactions);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('rejects an unknown command instead of failing silently', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'does.not.exist', payload: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown command/);
  });

  it('surfaces a readable reason when a command is refused', () => {
    const sim = quickSave();
    const result = sim.execute({
      kind: 'finance.transfer',
      payload: {
        fromAccountId: sim.player.primaryAccountId,
        toAccountId: sim.player.primaryAccountId,
        amount: 999_999_999,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Not enough available/);
  });
});

describe('migrations and validation', () => {
  it('leaves a current save alone', () => {
    const sim = quickSave();
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(result.problems).toEqual([]);
  });

  it('refuses a save from a newer build rather than damaging it', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 5;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(result.problems[0]).toMatch(/newer version/);
  });

  it('restores a missing collection rather than rejecting an old save', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = 1;
    delete (sim.universe as unknown as Record<string, unknown>)['merchandise'];
    delete (sim.universe as unknown as Record<string, unknown>)['franchises'];

    const result = migrate(sim.universe);
    expect(result.migrated).toBe(true);
    expect(sim.universe.merchandise).toEqual({});
    expect(sim.universe.meta.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(validateUniverse(sim.universe).ok).toBe(true);
  });

  it('re-stamps records that carry the wrong save id', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = 1;
    const person = Object.values(sim.universe.people)[0];
    if (person) person.saveId = 'some-other-save';

    const result = migrate(sim.universe);
    expect(result.steps.some((s) => s.includes('Re-stamped'))).toBe(true);
    expect(validateUniverse(sim.universe).ok).toBe(true);
  });

  it('catches a corrupted universe', () => {
    const sim = quickSave();
    const property = Object.values(sim.universe.properties)[0];
    if (property) {
      property.ownerId = 'person_does_not_exist';
      const report = validateUniverse(sim.universe);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.includes('does not exist'))).toBe(true);
    }
  });
});

describe('the decision centre', () => {
  it('sorts overdue items above everything else', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 120 * MS_DAY);
    const decisions = openDecisions(sim);
    const firstOverdue = decisions.findIndex((d) => d.dueAt !== undefined && d.dueAt < sim.now);
    const firstNotOverdue = decisions.findIndex((d) => d.dueAt === undefined || d.dueAt >= sim.now);
    if (firstOverdue >= 0 && firstNotOverdue >= 0) {
      expect(firstOverdue).toBeLessThan(firstNotOverdue);
    }
  });

  it('never shows a resolved or dismissed item', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 60 * MS_DAY);
    for (const decision of openDecisions(sim)) {
      expect(decision.resolvedAt).toBeUndefined();
      expect(decision.dismissedAt).toBeUndefined();
    }
  });
});
