/**
 * The dialogue library: every line accounted for.
 *
 * Ids are unique and say where a line lives; every expectation the code
 * writes down is covered by at least one line; follow-ups resolve; no two
 * lines are the same once case, punctuation and slots are set aside, and
 * near-twins are reported; selection filters for what is true before it
 * chooses, falls back to a line that contradicts nothing, records what a
 * save has heard and leans away from it, and keeps that record bounded.
 * Set SLATE_DIALOGUE_REPORT=1 to print the count by section.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import {
  FALLBACK_LINE, MAX_SEEN, SECTIONS, allLines, chunkOf, eligible, libraryStats, lineById, linesFor, loadAllSections, normalise, preview, speak,
  type DialogueExpectation, type DialogueLine,
} from '@/engine/dialogue';

beforeAll(async () => { await loadAllSections(); });

/** Token-set similarity, for lines that are twins in all but a word or two. */
function jaccard(a: string, b: string): number {
  const x = new Set(a.split(' '));
  const y = new Set(b.split(' '));
  const both = [...x].filter((t) => y.has(t)).length;
  return both / (x.size + y.size - both);
}

function covers(line: DialogueLine, expectation: DialogueExpectation, result?: string, move?: string, tone?: string, flags?: readonly string[]): boolean {
  if (line.purpose !== expectation.purpose) return false;
  if (expectation.beat && line.beat !== expectation.beat) return false;
  return eligible([line], { result, move, tone: tone as never, flags, facts: [] }).length === 1;
}

describe('the library as data', () => {
  it('loads every section, and every id says where its line lives', () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(2);
    const lines = allLines();
    expect(lines.length).toBeGreaterThan(100);
    const ids = new Set<string>();
    for (const l of lines) {
      expect(ids.has(l.id), `duplicate id ${l.id}`).toBe(false);
      ids.add(l.id);
      expect(l.id.startsWith(`${l.section}.${l.purpose}.${l.beat}.`), l.id).toBe(true);
      expect(l.text.trim().length, l.id).toBeGreaterThan(3);
      expect(l.language).toBe('en');
      expect(l.version).toBeGreaterThanOrEqual(1);
      for (const f of l.followUps ?? []) expect(lineById(f), `${l.id} follows up to ${f}`).toBeDefined();
    }
  });

  it('covers everything the code says it will ask for', () => {
    for (const section of SECTIONS) {
      const chunk = chunkOf(section)!;
      for (const expectation of chunk.expects) {
        const results = expectation.result ?? [undefined];
        const moves = expectation.move ?? [undefined];
        const tones = expectation.tone ?? [undefined];
        for (const result of results) for (const move of moves) for (const tone of tones) {
          const hit = chunk.lines.some((l) => covers(l, expectation, result, move, tone, expectation.flags));
          expect(hit, `${section}: ${expectation.purpose}/${expectation.beat ?? '*'} result=${result ?? '*'} move=${move ?? '*'} tone=${tone ?? '*'} flags=${(expectation.flags ?? []).join(',')}`).toBe(true);
        }
      }
    }
  });

  it('has no two lines that are the same once case, punctuation and slots are set aside', () => {
    const seen = new Map<string, string>();
    for (const l of allLines()) {
      const key = normalise(l.text);
      expect(seen.get(key), `${l.id} repeats ${seen.get(key)}`).toBeUndefined();
      seen.set(key, l.id);
    }
  });

  it('reports near-twins rather than letting them pass as different lines', () => {
    const lines = allLines();
    const twins: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const a = normalise(lines[i]!.text);
        const b = normalise(lines[j]!.text);
        if (a.length < 12 || b.length < 12) continue;
        if (jaccard(a, b) >= 0.85) twins.push(`${lines[i]!.id} ~ ${lines[j]!.id}`);
      }
    }
    expect(twins, twins.join('\n')).toEqual([]);
  });

  it('counts honestly, and says so when asked', () => {
    const stats = libraryStats();
    expect(stats.unique).toBe(stats.total);
    expect(stats.total).toBeLessThan(100_001);
    if (process.env['SLATE_DIALOGUE_REPORT']) {
      console.log(`\nDialogue library: ${stats.unique} distinct entries in ${stats.sections.length} sections (target 100,001).`);
      for (const [section, n] of Object.entries(stats.bySection)) console.log(`  ${section}: ${n}`);
      console.log(`  short of the target by ${(100_001 - stats.unique).toLocaleString('en-US')}.\n`);
    }
  });
});

describe('choosing a line', () => {
  it('filters for what is true first: the move, the outcome, the voice, what they know', () => {
    const replies = linesFor({ section: 'dating', purpose: 'reply', beat: 'table' });
    const askGood = eligible(replies, { move: 'ask', result: 'good', tone: 'warm' });
    expect(askGood.length).toBeGreaterThanOrEqual(3);
    for (const l of askGood) {
      expect(l.when!.move).toContain('ask');
      expect(l.when!.result).toContain('good');
      expect(!l.when!.tone || l.when!.tone.includes('warm')).toBe(true);
    }
    const greets = linesFor({ section: 'vehicles', purpose: 'greet', beat: 'lot' });
    const bought = eligible(greets, { facts: ['bought'], tone: 'firm', flags: [] });
    expect(bought.every((l) => l.when?.requires?.includes('bought'))).toBe(true);
    const stranger = eligible(greets, { facts: [], flags: ['first_visit'], tone: 'firm' });
    expect(stranger.every((l) => l.when?.flags?.includes('first_visit'))).toBe(true);
    expect(stranger.some((l) => l.when?.requires?.length)).toBe(false);
  });

  it('falls back on a line that contradicts nothing when nothing qualifies, and says so', () => {
    const sim = quickSave({}, 'dialogue');
    const nothing = speak(sim, { section: 'dating', purpose: 'reply', beat: 'table' }, { move: 'skydive', result: 'good' });
    expect(nothing.fallback).toBe(true);
    expect(nothing.text).toBe(FALLBACK_LINE);
    expect(nothing.id).toBeUndefined();
    const missing = speak(sim, { section: 'banking', purpose: 'greet' }, {});
    expect(missing.fallback).toBe(true);
  });

  it('records what a save has heard, leans away from it, and keeps the record bounded', () => {
    const sim = quickSave({}, 'dialogue');
    const heard = new Map<string, number>();
    for (let i = 0; i < 40; i++) {
      sim.advanceTo(sim.now + 60_000);
      const line = speak(sim, { section: 'dating', purpose: 'reply', beat: 'table' }, { move: 'ask', result: 'good', tone: 'warm' }, i);
      expect(line.fallback).toBe(false);
      heard.set(line.id!, (heard.get(line.id!) ?? 0) + 1);
    }
    // Four lines qualify for a warm voice; forty hearings spread across them rather than landing on one.
    expect(heard.size).toBe(4);
    expect(Math.max(...heard.values())).toBeLessThan(20);
    const seen = sim.universe.dialogue!.seen;
    for (const [id, n] of heard) expect(seen[id]!.n).toBe(n);

    for (let i = 0; i < MAX_SEEN + 50; i++) seen[`fake.${i}`] = { n: 1, at: i };
    sim.advanceTo(sim.now + 60_000);
    speak(sim, { section: 'dating', purpose: 'reply', beat: 'table' }, { move: 'ask', result: 'good' }, 'bound');
    expect(Object.keys(sim.universe.dialogue!.seen).length).toBeLessThanOrEqual(MAX_SEEN);
  });

  it('is the same line for the same moment, and fills its slots', () => {
    const a = quickSave({}, 'dialogue');
    const b = quickSave({}, 'dialogue');
    const x = speak(a, { section: 'vehicles', purpose: 'counter', beat: 'numbers' }, { tone: 'warm', vars: { ask: '$9,000.00' } }, 'same');
    const y = speak(b, { section: 'vehicles', purpose: 'counter', beat: 'numbers' }, { tone: 'warm', vars: { ask: '$9,000.00' } }, 'same');
    expect(x.id).toBe(y.id);
    expect(x.text).toContain('$9,000.00');
    expect(x.text).not.toContain('{ask}');
  });

  it('a preview chooses the same way and records nothing', () => {
    const sim = quickSave({}, 'dialogue');
    const before = JSON.stringify(sim.universe.dialogue);
    const shown = preview(sim, { section: 'vehicles', purpose: 'greet', beat: 'lot' }, { flags: ['first_visit'], tone: 'warm', vars: { first: 'Sofia' } });
    expect(shown.fallback).toBe(false);
    expect(shown.text).toContain('Sofia');
    expect(JSON.stringify(sim.universe.dialogue)).toBe(before);
  });

  it('respects a cooldown while anything else qualifies', () => {
    const sim = quickSave({}, 'dialogue');
    const query = { section: 'dating', purpose: 'checkin', beat: 'message' };
    const first = speak(sim, query, { result: 'no_show', tone: 'warm' }, 1);
    expect(first.fallback).toBe(false);
    // Mark it as under cooldown by hand and ask again: a different line comes.
    const state = sim.universe.dialogue!;
    const line = lineById(first.id!)!;
    (line as { cooldownDays?: number }).cooldownDays = 30;
    state.seen[first.id!] = { n: 1, at: sim.now };
    const second = speak(sim, query, { result: 'no_show', tone: 'warm' }, 2);
    expect(second.id).not.toBe(first.id);
    (line as { cooldownDays?: number }).cooldownDays = undefined;
    expect(sim.now - state.seen[first.id!]!.at).toBeLessThan(MS_DAY);
  });
});
