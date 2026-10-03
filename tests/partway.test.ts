/**
 * What was left partway, and picked up where it was left (`leftPartway` in
 * `systems/underway.ts`, from 2026-10-03): a program, a book begun, flight
 * training stopped, a build stopped on its bill.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { SERVICES } from '@/engine/content/homelife';
import { leftPartway } from '@/engine/systems/underway';
import { NOVEL_WORDS, READ_WPM } from '@/engine/systems/reading';
import { addItem, homeKeyOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('left partway', () => {
  it('lists a program partway through, and its resume picks it up there', () => {
    const sim = life('us-ny-newyork', 'pw-prog');
    expect(leftPartway(sim.player)).toEqual([]);
    sim.must({ kind: 'home.subscribe', payload: { id: SERVICES.find((s) => s.market === 'us' && s.service === 'Amazon Prime')!.id } });
    sim.must({ kind: 'tv.watch', payload: { programmeId: 'us-reacher', to: 'hour' } });
    const [x] = leftPartway(sim.player);
    expect(x).toMatchObject({ kind: 'program', label: 'Reacher', note: 'Season 1, episode 2, 11 minutes in', resume: { command: 'tv.watch', label: 'Finish The Episode' } });
    const r = sim.must<{ watched: number; episode: number; minute: number }>({ kind: x!.resume.command, payload: x!.resume.payload });
    expect(r).toMatchObject({ watched: 38, episode: 2, minute: 0 });
    expect(leftPartway(sim.player)[0]!.resume.label).toBe('Watch The Next');
    // Watched to its end, it isn't waiting.
    sim.player.watching!['us-reacher'] = { season: 99, episode: 0, minute: 0, at: sim.now };
    expect(leftPartway(sim.player)).toEqual([]);
  });

  it('lists a book begun, read on for an hour by choice, a reader or not', () => {
    const sim = life('us-ny-newyork', 'pw-book');
    const book = addItem(sim, sim.player, { kind: 'book:x', label: 'A Novel', quantity: 1, condition: 1, paid: 0, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'shelf' } as never, acquiredAt: sim.now } as never);
    expect(leftPartway(sim.player)).toEqual([]);
    book.readWords = NOVEL_WORDS / 2;
    const [x] = leftPartway(sim.player);
    expect(x).toMatchObject({ kind: 'book', label: 'A Novel', note: '50% read' });
    sim.must({ kind: x!.resume.command, payload: x!.resume.payload });
    expect(book.readWords).toBe(NOVEL_WORDS / 2 + 60 * READ_WPM);
    book.readThrough = true;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'unwind', how: 'read' } }).error).toBe('There’s no book at home you haven’t read through.');
  });

  it('lists flight training stopped and a build stopped on its bill', () => {
    const sim = life('us-ny-newyork', 'pw-pilot');
    sim.player.pilotTraining = { startedAt: sim.now, monthsDone: 2, status: 'stopped' };
    expect(leftPartway(sim.player)[0]).toMatchObject({ kind: 'pilot', note: 'Stopped after 2 of 6 months', resume: { command: 'pilot.train' } });
    sim.player.pilotTraining.monthsDone = 6;
    expect(leftPartway(sim.player)[0]!.note).toBe('Stopped at the tests');
  });
});
