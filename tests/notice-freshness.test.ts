/**
 * A notice said again word for word while the last is unread is brought up to
 * now, not said twice (`Simulation.notify`, from 2026-10-06). A played life to
 * 89 had one towel notice as 354 of its last 500. Read, it's said again; a
 * different word is a different notice.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, seed);
const towel = { category: 'home', title: 'No Clean Towel', body: 'Every towel to hand is in the wash or still drying: put a load on.' };

describe('a notice said again', () => {
  it('is one notice while unread, brought up to now, and said again once read', () => {
    const sim = life('notice-again');
    const notes = sim.universe.notifications;
    const before = notes.length;
    sim.notify(towel);
    const first = notes[notes.length - 1]!;
    sim.universe.now += MS_DAY;
    sim.notify({ category: 'home', title: 'Something Else', body: 'Another thing.' });
    sim.notify(towel);
    expect(notes.length).toBe(before + 2);
    const last = notes[notes.length - 1]!;
    expect(last.id).toBe(first.id);
    expect(last.at).toBe(sim.now);
    // Read, it's said again as a notice of its own.
    last.read = true;
    sim.notify(towel);
    expect(notes.length).toBe(before + 3);
    // Another body is another notice.
    sim.notify({ ...towel, body: 'Every towel is wet.' });
    expect(notes.length).toBe(before + 4);
  });

  it('keeps each month’s pension its own notice, naming the day it was paid', () => {
    const sim = life('notice-pension');
    sim.notify({ category: 'bank', title: 'Social Security Paid', body: '$1.00 paid June 3, 2070, as every month since June 3, 2069.' });
    sim.notify({ category: 'bank', title: 'Social Security Paid', body: '$1.00 paid July 3, 2070, as every month since June 3, 2069.' });
    expect(sim.universe.notifications.filter((n) => n.title === 'Social Security Paid')).toHaveLength(2);
  });
});
