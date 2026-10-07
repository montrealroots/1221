/**
 * What a student has worked on and what's still open (`systems/learning.ts`,
 * from 2026-10-08): the next scene, part, partner and objective read from the
 * record; and the notes kept as a ledger, so a note says whether it's new,
 * the same again, better but short, taken, or the step beyond.
 */
import { describe, expect, it } from 'vitest';
import { SCENES, templateById } from '@/engine/content/coursework';
import {
  ADVANCED, LEARNING, mayGive, nextChallenge, noteKey, objectiveFor, partnerFor, recordNote, resolveNote, revisitOf, scenesFor, targetDifficulty,
  type NoteRecord, type Worked,
} from '@/engine/systems/learning';

const w = (id: string, over: Partial<Worked> = {}): Worked => ({ id, course: 'DRAM 103a/b', template: 'scene-study', setOn: '2026-09-01', answers: {}, status: 'done', ...over });

describe('the ledger of notes', () => {
  it('says new, then the same again, then better but short, by what it measures; taken, it isn’t given again unless it slips back', () => {
    const notes: NoteRecord[] = [];
    const lines = { kind: 'dim', dim: 'memorization' } as const;
    expect(recordNote(notes, lines, '2026-09-10', 'a1', 'Acting I', 0.3).kind).toBe('new');
    expect(recordNote(notes, lines, '2026-09-24', 'a2', 'Voice I', 0.33).kind).toBe('recurring');
    const third = recordNote(notes, lines, '2026-10-08', 'a3', 'Acting I', 0.5);
    expect(third.kind).toBe('partial');
    expect(third.before!.level).toBe(0.33);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.given).toBe(3);
    // Taken: not given while it holds; given again, slipped back, as recurring.
    expect(resolveNote(notes, noteKey(lines), '2026-10-22', 'a4', 'Acting I')).toBe(true);
    expect(resolveNote(notes, noteKey(lines), '2026-10-22', 'a4', 'Acting I')).toBe(false);
    expect(mayGive(notes, noteKey(lines), 0.6)).toBe(false);
    expect(mayGive(notes, noteKey(lines), LEARNING.slipped - 0.01)).toBe(true);
    expect(recordNote(notes, lines, '2026-11-05', 'a5', 'Acting I', 0.3).kind).toBe('recurring');
    expect(notes[0]!.history.map((h) => h.kind)).toEqual(['new', 'recurring', 'partial', 'applied', 'recurring']);
  });

  it('keeps a bounded history, and gives the step beyond least recently given', () => {
    const notes: NoteRecord[] = [];
    for (let i = 0; i < 20; i += 1) recordNote(notes, { kind: 'choice', question: 'objective' }, `2026-09-${String(10 + i).padStart(2, '0')}`, `a${i}`, 'Acting I');
    expect(notes[0]!.history).toHaveLength(LEARNING.history);
    const given = new Set<string>();
    for (let i = 0; i < Object.keys(ADVANCED).length; i += 1) {
      const c = nextChallenge(notes, 0.5);
      expect(given.has(c)).toBe(false);
      given.add(c);
      recordNote(notes, { kind: 'advanced', challenge: c }, `2026-10-${String(10 + i).padStart(2, '0')}`, `b${i}`, 'Acting I');
    }
    expect(given.size).toBe(Object.keys(ADVANCED).length);
  });
});

describe('the next work', () => {
  it('matches difficulty to the year and the acting', () => {
    expect(targetDifficulty(1, 60)).toBe(1);
    expect(targetDifficulty(1, 75)).toBe(2);
    expect(targetDifficulty(2, 60)).toBe(2);
    expect(targetDifficulty(3, 45)).toBe(2);
    expect(targetDifficulty(3, 80)).toBe(3);
  });

  it('offers never-studied scenes first, nearest the difficulty that fits; studied ones the longest ago first', () => {
    const t = templateById('scene-study')!;
    const fresh = scenesFor(t, 'DRAM 303a', [], 1);
    expect(fresh.every((s) => s.language === 'prose' && s.tradition !== 'greek')).toBe(true);
    expect(fresh[0]!.difficulty).toBe(1);
    const all = fresh.map((s, i) => w(`a${i}`, { sceneId: s.id, setOn: `2026-${String(9 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}` }));
    const again = scenesFor(t, 'DRAM 303a', all, 1);
    expect(again[0]!.id).toBe(fresh[0]!.id);
    // One left unstudied comes first, whatever its difficulty.
    const left = scenesFor(t, 'DRAM 303a', all.slice(1), 3);
    expect(left[0]!.id).toBe(fresh[0]!.id);
    // Acting I's first term takes its plays from 1900 on (the Bulletin).
    expect(scenesFor(t, 'DRAM 103a/b', [], 2).every((s) => s.year >= 1900)).toBe(true);
    expect(scenesFor(templateById('classical-scene')!, 'DRAM 203a/b', [], 2).every((s) => s.language === 'verse')).toBe(true);
  });

  it('brings a scene back in the other part, then asks for another reading, never with last time’s partner', () => {
    expect(revisitOf([], 0.2)).toEqual({ role: 0 });
    const once = revisitOf([w('a1', { sceneId: 's', role: 0, partner: 3 })], 0.9);
    expect(once).toMatchObject({ role: 1, revisit: { change: 'role', assignmentId: 'a1', partner: 3 } });
    const twice = revisitOf([w('a1', { sceneId: 's', role: 0, partner: 3 }), w('a2', { sceneId: 's', role: 1, partner: 5, setOn: '2027-02-01' })], 0.9);
    expect(twice).toMatchObject({ role: 0, revisit: { change: 'reading', assignmentId: 'a2' } });
    expect(partnerFor([w('a1', { partner: 0 }), w('a2', { partner: 1 })], 'DRAM 103a/b', 3, 0.5)).toBe(2);
    // Last time's in the course isn't given again, even if least worked with.
    expect(partnerFor([w('a1', { partner: 2, setOn: '2026-10-01' }), w('a2', { partner: 0 }), w('a3', { partner: 1 })], 'DRAM 103a/b', 3, 0.99, [])).not.toBe(2);
    expect(partnerFor([w('a1', { partner: 0, course: 'X' })], 'DRAM 103a/b', 3, 0.99, [1])).toBe(2);
  });

  it('sets the objective a recurring note names, or the one the course asked longest ago', () => {
    const t = templateById('scene-study')!;
    const notes: NoteRecord[] = [];
    recordNote(notes, { kind: 'dim', dim: 'partner' }, '2026-09-10', 'a1', 'Acting I', 0.2);
    expect(objectiveFor(t, 'DRAM 103a/b', [], notes)).not.toBe('listening');
    recordNote(notes, { kind: 'dim', dim: 'partner' }, '2026-09-24', 'a2', 'Voice I', 0.25);
    expect(objectiveFor(t, 'DRAM 103a/b', [], notes)).toBe('listening');
    resolveNote(notes, 'dim:partner', '2026-10-01', 'a3', 'Acting I');
    const asked = [w('a1', { objective: 'circumstances', setOn: '2026-09-01' }), w('a2', { objective: 'lines', setOn: '2026-09-15' }), w('a3', { objective: 'choices', setOn: '2026-09-29' }), w('a4', { objective: 'shape', setOn: '2026-10-13' })];
    expect(objectiveFor(t, 'DRAM 103a/b', asked, notes)).toBe('listening');
    expect(objectiveFor(t, 'DRAM 103a/b', [...asked, w('a5', { objective: 'listening', setOn: '2026-10-27' })], notes)).toBe('circumstances');
    // A course without a partner never asks for one.
    expect(objectiveFor(templateById('audition-pair')!, 'DRAM 743b', [], [])).not.toBe('listening');
  });

  it('has scenes of every difficulty in modern prose', () => {
    const prose = SCENES.filter((s) => s.language === 'prose' && s.tradition !== 'greek');
    expect(new Set(prose.map((s) => s.difficulty)).size).toBe(3);
  });
});
