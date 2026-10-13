/**
 * A refused command leaves the notices as they were, at the cap too (from 2026-10-12; `notify`, `core/simulation.ts`).
 *
 * Measured by the saves reading of 2026-10-12 on a played fixture sitting at the 500-notice cap: a command that said
 * something and then was refused left its notice in the save and lost the oldest, because the rollback cuts the log
 * back to its length and the notice had moved an earlier one or cut the log at 500 mid-command. A notice is only added
 * inside a command now, and the earlier one taken off and the log capped once it's done.
 * TEST SETUP: commands registered by the test, one that notifies and is refused and one that notifies and succeeds.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CommandError } from '@/engine/core/simulation';

function atCap() {
  const sim = quickSave({}, 'notices-cap');
  sim.universe.notifications.length = 0;
  for (let i = 0; i < 500; i += 1) sim.notify({ category: 'test', title: `Notice ${i}`, body: `Body ${i}`, importance: 10 });
  sim.onCommand('test.say_then_refuse', () => { sim.notify({ category: 'test', title: 'Said', body: 'Then refused' }); throw new CommandError('No.'); });
  sim.onCommand('test.say', (p: { title: string; body: string }) => { sim.notify({ category: 'test', title: p.title, body: p.body }); return true; });
  return sim;
}

describe('notices and a refused command', () => {
  it('leaves the log exactly as it was, at the cap', () => {
    const sim = atCap();
    const before = JSON.stringify(sim.universe.notifications);
    expect(sim.execute({ kind: 'test.say_then_refuse', payload: {} }).ok).toBe(false);
    expect(JSON.stringify(sim.universe.notifications)).toBe(before);
    expect(sim.universe.notifications[0]!.title).toBe('Notice 0');
  });

  it('keeps the latest 500 after a command that succeeds, and a notice said again takes the earlier one’s place', () => {
    const sim = atCap();
    expect(sim.execute({ kind: 'test.say', payload: { title: 'Notice 10', body: 'Body 10' } }).ok).toBe(true);
    const notes = sim.universe.notifications;
    expect(notes.length).toBe(500);
    expect(notes.filter((n) => n.title === 'Notice 10').length).toBe(1);
    expect(notes.at(-1)!.title).toBe('Notice 10');
    expect(sim.execute({ kind: 'test.say', payload: { title: 'New', body: 'One' } }).ok).toBe(true);
    expect(sim.universe.notifications.length).toBe(500);
    expect(sim.universe.notifications[0]!.title).toBe('Notice 1');
  });
});
