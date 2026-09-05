/**
 * How a room talks.
 *
 * Every genre gets its own language, nothing is a fixed line, and there are
 * far more of them than anybody will ever hear.
 */

import { describe, expect, it } from 'vitest';
import { makeRng } from '@/engine/core/rng';
import {
  AFTER_READ, GOODBYES, GREETINGS, NOTE_FRAMES, NOTE_SUBJECTS, NOTE_TAILS,
  ROOM_NOISE, SCENE_FRAMES, SETTLES, SMALL_TALK,
  afterReadFor, dialogueCombinations, goodbyeFor, noteFor, readerLineFor,
  registerFor, sceneFrameFor, type RoomRegister,
} from '@/engine/content/room-dialogue';

const REGISTERS = Object.keys(NOTE_SUBJECTS) as RoomRegister[];

describe('how many ways a room can talk', () => {
  it('is well past ten thousand, and they actually come out distinct', () => {
    const counted = dialogueCombinations();
    expect(counted.total).toBeGreaterThan(10_000);
    expect(counted.notes).toBeGreaterThan(10_000);

    // Counting is not the same as producing. Draw a lot and check the spread.
    const seen = new Set<string>();
    for (let i = 0; i < 6000; i++) {
      const register = REGISTERS[i % REGISTERS.length]!;
      seen.add(noteFor(register, makeRng(`note-${i}`)));
    }
    expect(seen.size, `${seen.size} distinct notes out of 6000 draws`).toBeGreaterThan(5500);
  });

  it('spreads evenly across everything one register can say', () => {
    // A thousand random draws from a space this size will collide — that is
    // arithmetic, not a fault. What matters is that the generator reaches
    // close to the number an even draw would, rather than favouring a corner
    // of the bank.
    const space = NOTE_FRAMES.length * NOTE_SUBJECTS.horror.length * NOTE_TAILS.length;
    expect(space).toBeGreaterThan(2500);
    const draws = 1000;
    const expected = space * (1 - Math.pow(1 - 1 / space, draws));
    const seen = new Set<string>();
    for (let i = 0; i < draws; i++) seen.add(noteFor('horror', makeRng(`h-${i}`)));
    expect(seen.size, `${seen.size} distinct against ${Math.round(expected)} for an even draw`).toBeGreaterThan(expected * 0.95);
    // Every part of the sentence is being varied, not just one of them.
    const firstWords = new Set([...seen].map((line) => line.split(' ').slice(0, 3).join(' ')));
    expect(firstWords.size).toBeGreaterThan(NOTE_FRAMES.length - 2);
  });
});

describe('which room you are in', () => {
  it('reads the genres, and falls back to drama rather than guessing', () => {
    expect(registerFor(['horror'])).toBe('horror');
    expect(registerFor(['comedy', 'romance'])).toBe('comedy');
    expect(registerFor(['science fiction'])).toBe('scifi');
    expect(registerFor(['true-crime'])).toBe('crime');
    expect(registerFor(['animation', 'family'])).toBe('family');
    expect(registerFor(['biography'])).toBe('biopic');
    expect(registerFor(['something nobody has heard of'])).toBe('drama');
    expect(registerFor([])).toBe('drama');
  });

  it('gives every register its own scene frames and its own notes', () => {
    for (const register of REGISTERS) {
      expect(SCENE_FRAMES[register].length, register).toBeGreaterThan(5);
      expect(NOTE_SUBJECTS[register].length, register).toBeGreaterThan(12);
      for (const line of SCENE_FRAMES[register]) expect(line.length, `${register}: ${line}`).toBeGreaterThan(20);
      for (const line of NOTE_SUBJECTS[register]) expect(line.length, `${register}: ${line}`).toBeGreaterThan(10);
    }
    // And no two registers share a subject, or they are not different rooms.
    const all = REGISTERS.flatMap((r) => NOTE_SUBJECTS[r].map((s) => `${s}`));
    const duplicates = all.filter((line, i) => all.indexOf(line) !== i);
    expect([...new Set(duplicates)], 'two registers share a note').toEqual([]);
    const frames = REGISTERS.flatMap((r) => SCENE_FRAMES[r]);
    expect(new Set(frames).size).toBe(frames.length);
  });

  it('sounds like the picture it is for', () => {
    const rng = makeRng('sound');
    const horror = Array.from({ length: 40 }, (_, i) => noteFor('horror', makeRng(`hh-${i}`))).join(' ');
    const comedy = Array.from({ length: 40 }, (_, i) => noteFor('comedy', makeRng(`cc-${i}`))).join(' ');
    expect(horror).toMatch(/frighten|die|fear|door|listening|cold/i);
    expect(comedy).toMatch(/funny|laugh|charming|joke|polite|wrong/i);
    expect(sceneFrameFor('western', rng).length).toBeGreaterThan(20);
  });
});

describe('the rest of what is said', () => {
  it('has a reader whose quality is out of your hands', () => {
    expect(readerLineFor(90)).toMatch(/good one|actor/i);
    expect(readerLineFor(5)).toMatch(/losing their place|own lines|train/i);
    expect(readerLineFor(50)).not.toBe(readerLineFor(90));
  });

  it('says something different after a good read and a bad one', () => {
    const good = afterReadFor(85, makeRng('g'));
    const bad = afterReadFor(20, makeRng('b'));
    expect(AFTER_READ.strong).toContain(good);
    expect(AFTER_READ.weak).toContain(bad);
    expect(good).not.toBe(bad);
    expect(AFTER_READ.strong.length).toBeGreaterThan(6);
    expect(AFTER_READ.fine.length).toBeGreaterThan(6);
    expect(AFTER_READ.weak.length).toBeGreaterThan(6);
  });

  it('keeps every bank free of repeats and writes in whole sentences', () => {
    const banks: [string, readonly string[]][] = [
      ['greetings', GREETINGS], ['settles', SETTLES], ['small talk', SMALL_TALK],
      ['goodbyes', GOODBYES], ['room noise', ROOM_NOISE], ['note frames', NOTE_FRAMES],
      ['note tails', NOTE_TAILS], ['after strong', AFTER_READ.strong],
      ['after fine', AFTER_READ.fine], ['after weak', AFTER_READ.weak],
    ];
    for (const [name, bank] of banks) {
      expect(new Set(bank).size, `${name} repeats itself`).toBe(bank.length);
      expect(bank.length, name).toBeGreaterThan(9);
      for (const line of bank) expect(line.trim(), `${name}: "${line}"`).toBe(line);
    }
    expect(goodbyeFor(makeRng('x')).length).toBeGreaterThan(8);
  });

  it('builds a note that reads as one sentence', () => {
    for (let i = 0; i < 50; i++) {
      const note = noteFor(REGISTERS[i % REGISTERS.length]!, makeRng(`sentence-${i}`));
      expect(note).toMatch(/\.$/);
      expect(note).not.toMatch(/\s{2}/);
      expect(note).not.toMatch(/,\s*,/);
      expect(note.length).toBeGreaterThan(30);
    }
  });
});
