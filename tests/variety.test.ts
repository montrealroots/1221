/**
 * Variety and continuity (integration pass, 2026-10-10; tools/variety.ts measures them over played years): an hour's
 * feedback reads the record, not just the hour, and a director's note reads the notes before it. Found by the audit: a
 * student told "Pitched where you are." 175 hours running while the level rose 17 points, and the same note on the same
 * skill at every work-through, taken or not.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { practiceHour } from '@/engine/systems/practice';
import { noteFor, noteText, processOf, type Process } from '@/engine/systems/production';
import { EXERCISE_BY_ID } from '@/engine/content/practice';
import { evenCraft } from '@/engine/systems/school';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

describe('an hour’s feedback, from the record', () => {
  it('says what the hour moved and where it stands, differs as the level rises, and says when a long run is slowing', () => {
    const sim = life('var-feedback');
    // FIXTURE: a rested student, imagination high in its band, practicing the same exercise a day apart.
    const said: string[] = [];
    for (let n = 0; n < 9; n += 1) {
      Object.assign(sim.player.wellbeing, { energy: 95, stress: 5, sleepDebt: 0 });
      said.push(practiceHour(sim, sim.player, EXERCISE_BY_ID['given-circumstances']!).feedback);
      sim.advanceTo(sim.now + MS_DAY);
    }
    expect(new Set(said).size).toBe(said.length);
    expect(said[0]).toMatch(/Imagination rose \d+\.\d\d, to \d+\.\d of \d+/);
    expect(said[8]).toMatch(/Session 9 on it in a row/);
  });

  it('says a target at its full gains nothing more, and that the work is in new material', () => {
    const sim = life('var-full');
    sim.player.craft = evenCraft(50);
    // FIXTURE: Vocal Expression full. (Every ability practice trains is full at 100; only Stamina's full is lower.)
    sim.player.craft.voice = 100;
    const r = practiceHour(sim, sim.player, EXERCISE_BY_ID['voice-work']!);
    expect(r.gained).toBe(0);
    expect(r.feedback).toMatch(/it’s full\. What’s left is new material/);
    expect(r.feedback).not.toMatch(/rose/);
  });
});

describe('an hour that gives less, said why', () => {
  it('names a repeat the same day, and a tired day, from the numbers that made the hour smaller', () => {
    const sim = life('var-why');
    Object.assign(sim.player.wellbeing, { energy: 95, stress: 5, sleepDebt: 0 });
    const first = practiceHour(sim, sim.player, EXERCISE_BY_ID['given-circumstances']!);
    const again = practiceHour(sim, sim.player, EXERCISE_BY_ID['given-circumstances']!);
    expect(again.gained).toBeLessThan(first.gained * 0.6);
    expect(first.feedback).not.toMatch(/on it today/);
    expect(again.feedback).toMatch(/Hour 2 on it today: each repeat gives half/);
    // FIXTURE: a night without sleep.
    sim.advanceTo(sim.now + 2 * MS_DAY);
    Object.assign(sim.player.wellbeing, { energy: 25, sleepDebt: 9 });
    const tired = practiceHour(sim, sim.player, EXERCISE_BY_ID['concentration']!);
    expect(tired.feedback).toMatch(/A tired day: the hour counted for less/);
  });
});

describe('a director’s notes, from the notes before', () => {
  const process = (notes: Process['notes']): Process => ({ lines: 1, blocking: 1, calls: 6, blockingMissed: 0, notes, trained: 0 });
  it('moves on from a skill note that was taken to the next thinnest place; one not taken comes again, said as still', () => {
    const sim = life('var-notes');
    const reads = { classical: 2, speech: 1, scene: 1 } as const;
    sim.player.craft = { ...evenCraft(60), classical: 40, speech: 45, scene: 70 };
    const first = noteFor(sim.player, process([]), reads, 8, 10);
    expect(first).toEqual({ kind: 'skill', skill: 'classical' });
    const taken = { at: 0, text: noteText(first), focus: first, taken: true };
    expect(noteFor(sim.player, process([taken]), reads, 9, 10)).toEqual({ kind: 'skill', skill: 'speech' });
    const notTaken = { ...taken, taken: false };
    expect(noteFor(sim.player, process([notTaken]), reads, 9, 10)).toEqual(first);
    expect(noteText(first, notTaken)).toMatch(/^Still: find more classical/);
    expect(noteText(first, taken)).toMatch(/^Better since the last note\./);
  });

  // Found on the director's-note journey's save (2026-10-13): "Still: i don’t know what you want in the second half."
  it('keeps the word I a capital when a note comes again as still, and makes any other first word small', () => {
    const objective = { kind: 'craft', note: 'objective', problem: 'quality:believability', where: 'The Second Half', measure: 60 } as const;
    const relationship = { ...objective, note: 'relationship' } as const;
    const direction = { kind: 'direction', axis: 'pace', side: 'driven' } as const;
    const again = (f: Parameters<typeof noteText>[0]) => noteText(f, { at: 0, text: noteText(f), focus: f, taken: false });
    expect(noteText(objective)).toMatch(/^I don’t know what you want in the second half\./);
    expect(again(objective)).toBe('Still: I don’t know what you want in the second half. Find it, and play it.');
    expect(noteText(direction)).toMatch(/^I want it /);
    expect(again(direction)).toMatch(/^Still: I want it /);
    expect(again(relationship)).toBe('Still: who are they to you in the second half? Decide, and let it show.');
  });

  it('puts right on opening a note a save from before kept as "Still: i …", and leaves the rest as they were', () => {
    const sim = life('var-still-load');
    sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, 'America/New_York'));
    // TEST SETUP: the notes as a save from before 2026-10-13 kept them, in the festival the student is cast in.
    const notes = processOf(sim.player.school!.casting!).notes;
    const old = ['Still: i don’t know what you want in the second half. Find it, and play it.', 'Still: who are they to you in the second half? Decide, and let it show.', 'I want it driven: it pushes on.'];
    for (const text of old) notes.push({ at: sim.now, text, focus: { kind: 'lines' } });
    const opened = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(processOf(opened.player.school!.casting!).notes.map((n) => n.text)).toEqual(['Still: I don’t know what you want in the second half. Find it, and play it.', old[1], old[2]]);
  });
});
