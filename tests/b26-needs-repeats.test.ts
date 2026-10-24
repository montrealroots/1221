/**
 * Brief 26's continuity trace (2026-10-24), its section 4, on What Needs You: a question raised twice is one row; its
 * answer is taken once and refused the second time; Dismiss is taken once and refused the second time, and a dismissed
 * question can't be answered from Home; a question raised again after a dismissal is a fresh row; Mark Read marks once
 * and a second press marks nothing; a question past its date closes by itself at the world tick, once, and stays closed
 * across a reload; a setting the game doesn't have is refused. Read at each handler (world/world.ts,
 * core/simulation.ts) and held here on a played life.
 *
 * PLAYER JOURNEY: a New Yorker at Yale in New Haven from Monday 24 August 2026 (`createSave` with `newLifeConfig`), as
 * tests/b26-papers-repeats.test.ts makes one. TEST SETUP, said where it's done: the question is raised by hand, as a
 * system raises one (`requireDecision`), with Mark Read as its one answer; the body kept fed and rested as the clock
 * moves (`tended`).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { openDecisions, unreadNotifications } from '@/engine/world/world';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const error = (r: { ok: boolean }) => (r as { ok: false; error: string }).error;
const rows = (sim: Simulation) => Object.values(sim.universe.decisions).filter((d) => d.refType === 'b26');

/** TEST SETUP: a question as a system raises one, dated ten days on, answered by Mark Read. */
function ask(sim: Simulation, urgency: number, detail: string): void {
  sim.requireDecision({ urgency, category: 'personal', title: 'A Question For The Sweep', detail, dueAt: sim.now + 10 * MS_DAY, refType: 'b26', refId: 'one', actions: [{ label: 'Mark Read', commandKind: 'world.mark_read', payload: {} }] });
}

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

describe('What Needs You pressed twice, reloaded and left to its date', () => {
  it('a question raised twice is one row, answered once, and a second answer is refused as settled', () => {
    const sim = life('b26-needs-answer');
    ask(sim, 50, 'First asked.');
    ask(sim, 70, 'Asked again.');
    expect(rows(sim)).toHaveLength(1);
    expect(rows(sim)[0]!.urgency).toBe(70);
    expect(rows(sim)[0]!.detail).toBe('Asked again.');
    const id = rows(sim)[0]!.id;
    expect(openDecisions(sim).map((d) => d.id)).toContain(id);
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }).ok).toBe(true);
    expect(sim.universe.decisions[id]!.resolvedAt).toBe(sim.now);
    expect(openDecisions(sim).map((d) => d.id)).not.toContain(id);
    expect(error(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }))).toBe('That question is already settled: it was answered, or its date passed.');
    expect(error(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 3 } }))).toBe('That question is already settled: it was answered, or its date passed.');
    expect(error(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: 'nope', actionIndex: 0 } }))).toBe('That question isn’t in What Needs You any more.');
  });

  it('Dismiss is taken once and refused the second time; a dismissed question can’t be answered from Home; raised again, it’s a fresh row', () => {
    const sim = life('b26-needs-dismiss');
    ask(sim, 50, 'Asked.');
    const id = rows(sim)[0]!.id;
    expect(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId: id } }).ok).toBe(true);
    expect(error(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId: id } }))).toBe('You’ve already dismissed that question.');
    expect(error(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }))).toBe('You dismissed that question, so it can’t be answered from What Needs You.');
    expect(openDecisions(sim)).toHaveLength(0);
    ask(sim, 50, 'Asked once more.');
    expect(rows(sim)).toHaveLength(2);
    expect(openDecisions(sim).filter((d) => d.refType === 'b26')).toHaveLength(1);
    expect(openDecisions(sim).find((d) => d.refType === 'b26')!.id).not.toBe(id);
  });

  it('Mark Read marks once and a second press marks nothing; a question past its date closes once at the tick, and stays closed across a reload', () => {
    const sim = life('b26-needs-tick');
    const unreadBefore = unreadNotifications(sim).length;
    sim.notify({ category: 'personal', title: 'A Notice For The Sweep', body: 'Said once.', importance: 40 });
    sim.notify({ category: 'personal', title: 'A Notice For The Sweep', body: 'Said once.', importance: 40 });
    const mine = sim.universe.notifications.filter((n) => n.title === 'A Notice For The Sweep');
    expect(mine).toHaveLength(1);
    expect(unreadNotifications(sim)).toHaveLength(unreadBefore + 1);
    expect((sim.execute({ kind: 'world.mark_read', payload: { notificationIds: [mine[0]!.id] } }) as { ok: true; value: { read: number } }).value.read).toBe(1);
    expect((sim.execute({ kind: 'world.mark_read', payload: { notificationIds: [mine[0]!.id] } }) as { ok: true; value: { read: number } }).value.read).toBe(0);
    expect(unreadNotifications(sim)).toHaveLength(unreadBefore);
    // Every unread at once, then nothing left to mark.
    expect((sim.execute({ kind: 'world.mark_read', payload: {} }) as { ok: true; value: { read: number } }).value.read).toBe(unreadBefore);
    expect(unreadNotifications(sim)).toHaveLength(0);
    // A question left to its date: open until the tick after it, closed by the tick, once; the same after a save.
    ask(sim, 50, 'Left alone.');
    const id = rows(sim)[0]!.id;
    const due = sim.universe.decisions[id]!.dueAt;
    tended(sim, due - MS_HOUR);
    expect(openDecisions(sim).map((d) => d.id)).toContain(id);
    const back = reload(sim);
    expect(openDecisions(back).map((d) => d.id)).toContain(id);
    expect(back.universe.notifications.filter((n) => n.title === 'A Notice For The Sweep' && n.read)).toHaveLength(1);
    tended(back, due + 3 * MS_DAY);
    const closed = back.universe.decisions[id]!;
    expect(closed.resolvedAt).toBeDefined();
    expect(closed.resolvedAt!).toBeGreaterThan(due);
    expect(openDecisions(back).map((d) => d.id)).not.toContain(id);
    expect(error(back.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }))).toBe('That question is already settled: it was answered, or its date passed.');
    const again = reload(back);
    expect(again.universe.decisions[id]!.resolvedAt).toBe(closed.resolvedAt);
  });

  it('a setting the game doesn’t have, and a speed it doesn’t offer, are refused; Play and Pause are taken', () => {
    const sim = life('b26-needs-settings');
    expect(error(sim.execute({ kind: 'world.set_preferences', payload: { theme: 'dark' } }))).toBe('That isn’t a setting the game has.');
    expect(error(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'fast' } }))).toBe('The clock can only be set to Play or Pause.');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).ok).toBe(true);
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } }).ok).toBe(true);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
  });
});
