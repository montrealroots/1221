/**
 * The logline builder and the world's own premises.
 *
 * A logline is a machine with named parts, so both halves of this are checked
 * the same way: does the sentence come out grammatical, does it say what was
 * put in, and does it never invent a part that was not there. The world's
 * premises are then measured for variety, because a world that opens with the
 * same sentence twice in an evening does not feel alive.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { buildLogline, composeLogline, splitNotes } from '@/engine/content/logline';
import { buildPremise } from '@/engine/content/premise';
import { GENRES_FULL } from '@/engine/content/genres';

/** Faults that read as broken English rather than as a rough draft. */
function grammarFaults(line: string): string[] {
  const bad: string[] = [];
  if (/\b(a|an|the)\s+(a|an|the)\b/i.test(line)) bad.push('doubled article');
  if (/\bthe (whatever|whoever|everybody|everyone|nobody|somebody|something|anything)\b/i.test(line)) bad.push('article on a pronoun');
  if (/\bbefore (nobody|nothing|never)\b/i.test(line)) bad.push('a deadline that is not an event');
  if (/\bmust (wants|want|wanted|needs|need)\b/i.test(line)) bad.push('"must" with a second verb');
  if (/\bIn (over|across|during|through|after|before)\b/.test(line)) bad.push('doubled preposition');
  if (/,\s*\./.test(line) || /\s,/.test(line)) bad.push('dangling comma');
  if (/—\s*$/.test(line)) bad.push('trailing dash');
  if (/\s{2,}/.test(line)) bad.push('double space');
  if (!/^[A-Z]/.test(line)) bad.push('lowercase opening');
  if (!/[.!?]$/.test(line)) bad.push('no full stop');
  return bad;
}

describe('the logline builder', () => {
  it('splits bullet points however they were typed', () => {
    expect(splitNotes('- a nurse\n- a body\n- clear her name')).toHaveLength(3);
    expect(splitNotes('a nurse; a body; clear her name')).toHaveLength(3);
    expect(splitNotes('• a nurse\n2. a body')).toHaveLength(2);
  });

  it('builds a sentence out of notes and says which part each one became', () => {
    const notes = [
      'a retired hitman',
      'his old crew comes back',
      'wants out',
      'the cartel will not let him go',
      'his daughter pays for it',
    ].join('\n');
    const built = buildLogline(notes, ['crime', 'thriller']);
    expect(grammarFaults(built.logline), built.logline).toEqual([]);
    expect(built.logline.toLowerCase()).toContain('retired hitman');
    expect(built.logline.toLowerCase()).toContain('cartel');
    expect(built.notes).toHaveLength(5);
    expect(new Set(built.notes.map((n) => n.slot)).size, 'every note landed on the same slot').toBeGreaterThan(3);
    expect(built.score).toBeGreaterThan(70);
    for (const note of built.notes) expect(note.why.length).toBeGreaterThan(0);
  });

  // Eight sets of notes written the way people actually write them, each with
  // what the line has to contain to be a correct reading of them. This is the
  // parser's regression net: a change that improves one case and quietly wrecks
  // another fails here.
  const CASES: { name: string; notes: string[]; contains: string[]; slots: Partial<Record<string, string>> }[] = [
    {
      name: 'a clean five-part set',
      notes: ['a retired hitman', 'his old crew comes back', 'wants out', 'the cartel will not let him go', 'his daughter pays for it'],
      contains: ['a retired hitman', 'get out', 'the cartel will not let him go', 'his daughter pays for it'],
      slots: { protagonist: 'a retired hitman', goal: 'wants out', antagonist: 'the cartel will not let him go', stakes: 'his daughter pays for it' },
    },
    {
      name: 'a setting first, and a verb nobody whitelisted',
      notes: ['1974 Belfast', 'a teenage girl', 'her father is interned', 'smuggle a message across the city', 'her brother hangs'],
      contains: ['1974 Belfast', 'a teenage girl', 'must smuggle a message across the city'],
      slots: { world: '1974 Belfast', protagonist: 'a teenage girl', incident: 'her father is interned', goal: 'smuggle a message across the city' },
    },
    {
      name: 'no inciting incident at all',
      notes: ['two best friends', "open a bakery in her mother's building", 'the landlord wants them out', 'they lose everything'],
      contains: ['two best friends', 'open a bakery'],
      slots: { protagonist: 'two best friends', goal: "open a bakery in her mother's building", antagonist: 'the landlord wants them out' },
    },
    {
      name: 'an incident with no subject in it',
      notes: ['a boxer past it', 'offered one more fight', 'win it', 'the promoter wants him to throw it', 'his son sees him quit'],
      contains: ['a boxer past it', 'offered one more fight', 'must win it', 'the promoter wants him to throw it'],
      slots: { protagonist: 'a boxer past it', goal: 'win it', antagonist: 'the promoter wants him to throw it' },
    },
    {
      name: 'opposition that reads like a place',
      notes: ['a night-shift nurse', 'a patient dies on her shift', 'clear her name', 'a hospital that needs an answer', 'she never works again'],
      contains: ['a night-shift nurse', 'must clear her name', 'a hospital that needs an answer'],
      slots: { protagonist: 'a night-shift nurse', incident: 'a patient dies on her shift', goal: 'clear her name', antagonist: 'a hospital that needs an answer' },
    },
    {
      name: 'a long objective and a clause for opposition',
      notes: ['a colony doctor', 'the ship comes back with nobody on it', 'find out what came back with them', 'a captain who will not turn back', 'it gets out'],
      contains: ['a colony doctor', 'must find out what came back with them', 'it gets out'],
      slots: { protagonist: 'a colony doctor', incident: 'the ship comes back with nobody on it', goal: 'find out what came back with them' },
    },
    {
      name: 'two notes and nothing else',
      notes: ['a grieving father', 'his daughter is taken'],
      contains: ['a grieving father', 'his daughter is taken'],
      slots: { protagonist: 'a grieving father', incident: 'his daughter is taken' },
    },
    {
      name: 'commas, fragments and shorthand',
      notes: ['detective, alcoholic', 'a body in the river, same as ten years ago', 'catch him before he does it again', 'the department wants it closed', 'another girl dies'],
      contains: ['detective', 'must catch him before he does it again', 'another girl dies'],
      slots: { protagonist: 'detective, alcoholic', goal: 'catch him before he does it again' },
    },
  ];

  it.each(CASES)('reads $name correctly', ({ notes, contains, slots }) => {
    const built = buildLogline(notes.join('\n'));
    expect(grammarFaults(built.logline), built.logline).toEqual([]);
    for (const phrase of contains) {
      expect(built.logline.toLowerCase(), built.logline).toContain(phrase.toLowerCase());
    }
    for (const [slot, raw] of Object.entries(slots)) {
      const note = built.notes.find((n) => n.slot === slot);
      expect(note?.raw, `${slot} should have been "${raw}" and was "${note?.raw ?? 'nothing'}"`).toBe(raw);
    }
    // Every note ends up somewhere, and no note is used twice.
    expect(built.notes).toHaveLength(notes.length);
    expect(new Set(built.notes.map((n) => n.slot)).size).toBe(notes.length);
  });

  it('names what is missing rather than inventing it', () => {
    const built = buildLogline('a night-shift nurse\na patient dies on her shift', ['drama']);
    expect(built.missing).toContain('stakes');
    expect(built.advice.some((a) => a.toLowerCase().includes('stakes'))).toBe(true);
    // Nothing about a cost appears in a line that was never given one.
    expect(built.logline.toLowerCase()).not.toContain('before');
  });

  it('is deterministic: the same notes always give the same line', () => {
    const notes = 'a translator\nthe border closes\nget her sister across\nthe men on the gate\nthey are separated for good';
    expect(buildLogline(notes).logline).toBe(buildLogline(notes).logline);
  });

  it('takes parts that are already known without guessing at them', () => {
    const line = composeLogline({
      protagonist: 'a village doctor',
      incident: 'a body is found on the tide line',
      goal: 'find out who he was',
      antagonist: 'a village that has agreed on a story',
      stakes: 'it is written off and forgotten',
    });
    expect(grammarFaults(line), line).toEqual([]);
    expect(line.startsWith('When a body is found')).toBe(true);
  });

  it('says nothing at all when there is nothing to say', () => {
    expect(buildLogline('').logline).toBe('');
    expect(composeLogline({})).toBe('');
  });
});

describe('what the world says its films are about', () => {
  it('writes a grammatical premise for every genre in the book', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'premise-grammar');
    const faults: string[] = [];
    let built = 0;
    for (const g of GENRES_FULL) {
      for (let i = 0; i < 6; i++) {
        const premise = buildPremise([g.id], sim.rng('premise-test', g.id, i));
        if (!premise) continue;
        built++;
        const bad = grammarFaults(premise.logline);
        if (bad.length > 0) faults.push(`${g.id}: ${bad.join(', ')} — ${premise.logline}`);
      }
    }
    expect(built, 'no genre produced a premise at all').toBeGreaterThan(400);
    expect(faults.slice(0, 8)).toEqual([]);
  });

  it('does not come round again inside the window it remembers', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'premise-variety');
    // The same memory the world uses when it commissions: a premise already in
    // production is drawn again rather than made twice.
    const lines: string[] = [];
    const WINDOW = 30;
    for (let i = 0; i < 120; i++) {
      const recent = new Set(lines.slice(-WINDOW));
      const premise = buildPremise(['drama', 'thriller'], sim.rng('premise-variety', i), (line) => recent.has(line));
      if (premise) lines.push(premise.logline);
    }
    expect(lines.length).toBeGreaterThan(100);
    for (let i = 0; i < lines.length; i++) {
      const window = lines.slice(Math.max(0, i - WINDOW), i);
      expect(window, `"${lines[i]}" came round again at ${i}`).not.toContain(lines[i]);
    }
    const unique = new Set(lines);
    expect(unique.size / lines.length, `only ${unique.size} different premises in ${lines.length}`).toBeGreaterThan(0.75);
  });

  it('never invents anything: every part of a premise is material it was given', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'premise-parts');
    for (const g of ['drama', 'crime', 'horror', 'romance', 'science-fiction', 'comedy']) {
      for (let i = 0; i < 12; i++) {
        const premise = buildPremise([g], sim.rng('premise-parts', g, i));
        expect(premise, g).toBeDefined();
        const line = premise!.logline.toLowerCase();
        // Everything in the sentence came from a part, and every part is in
        // the sentence. Nothing is added on the way through.
        for (const [slot, text] of Object.entries(premise!.parts)) {
          if (!text) continue;
          expect(line, `${slot} went missing from the line`).toContain(String(text).toLowerCase());
        }
      }
    }
  });

  it('does not repeat a premise the world has already put into production', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'premise-memory');
    const made = Object.values(sim.universe.projects).filter((p) => p.worldCommissioned);
    const lines = made.map((p) => p.logline);
    expect(new Set(lines).size, `${lines.length} openings share a premise`).toBe(lines.length);
  });
});
