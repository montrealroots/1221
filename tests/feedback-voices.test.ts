/**
 * The courses' and the directors' voices (from 2026-10-20, the owner's brief 17, sections 3 to 7): every situation said in
 * every voice, true to its facts; two voices on the same facts recognizably apart; a note given before named in prose,
 * with the rule that puts it right said as a rule; a success left at its acknowledgment; and the words chosen by the
 * sentences' shapes the course said lately, never the game's randomness. Each claim here was run with it taken out of
 * `systems/feedback.ts` and failed (`docs/verification/continuity-2026-10-20/README.md`, Tests).
 */
import { describe, expect, it } from 'vitest';
import { STEP, VOICE_OF, pick, saysStep, shapeOf, showingCandidates, situationOf, voiceOf, type ShowingFacts, type Voice } from '@/engine/systems/feedback';
import { directorVoiceFor, directorVoiceOf, noteText } from '@/engine/systems/production';
import { directorsNote } from '@/engine/systems/school';

/** One course of each voice, and its discipline. */
const COURSE: Record<Voice, { course: string; discipline: ShowingFacts['discipline'] }> = {
  direct: { course: 'Acting I', discipline: 'acting' },
  warm: { course: 'Voice I', discipline: 'voice' },
  exacting: { course: 'Speech And Accents I', discipline: 'voice' },
  patient: { course: 'The Body As Source I', discipline: 'movement' },
  brisk: { course: 'Acting Intimacy And Combat For The Stage', discipline: 'acting' },
};
const VOICES = Object.keys(COURSE) as Voice[];
const STEP_WORDS = 'Choose one phrase and make every sound in it exact.';
const BODY = 'The lines weren’t secure, so the attention went to remembering, not to the other person. (Lines: 20% prepared.)';

const base = (v: Voice): ShowingFacts => ({
  key: `voices-${v}`, ...COURSE[v], piece: 'Scene Study', band: 'working', bandLabel: 'Working', run: 0, best: false,
  kind: 'new', note: BODY, about: 'part', part: { label: 'Lines', then: 0.2, now: 0.5 }, subject: 'your lines', here: 'your lines',
  remedy: 'Learn Lines', persistent: false, enough: 0.75, recent: [],
});

/** Each situation's facts, in a voice. */
const SITUATIONS = (v: Voice): Record<string, ShowingFacts> => {
  const f = base(v);
  const strongStep = { ...f, kind: 'advanced' as const, about: undefined, part: undefined, note: STEP_WORDS, band: 'strong' as const, bandLabel: 'Strong' };
  return {
    new: { ...f, part: { label: 'Lines', now: 0.2 } },
    // A note whose own words have a colon (Voice I's on its daily practice): the lead runs into it without one.
    newColon: { ...f, note: 'It hadn’t been practiced day by day: a voice opens over days, not in one session. (Rehearsal: 20% prepared.)', part: { label: 'Rehearsal', now: 0.2 }, subject: 'the daily practice', here: 'the daily practice', remedy: 'Rehearse Alone' },
    recurring: { ...f, kind: 'recurring', note: 'Lines weren’t secure.', before: { on: 'September 8, 2026', course: f.course, given: 1 } },
    third: { ...f, kind: 'recurring', note: 'Lines weren’t secure.', before: { on: 'September 8, 2026', course: 'Play', given: 2 } },
    persistent: { ...f, kind: 'recurring', note: 'Lines weren’t secure.', before: { on: 'September 8, 2026', course: 'Play', given: 6 }, persistent: true },
    partial: { ...f, kind: 'partial', note: 'Lines weren’t secure.', before: { on: 'September 8, 2026', course: f.course, given: 1 } },
    slipped: { ...f, kind: 'recurring', note: 'Lines weren’t secure.', before: { on: 'September 8, 2026', course: f.course, given: 2, taken: 'September 15, 2026' } },
    first: { ...strongStep, prev: { band: 'working', label: 'Working', on: 'October 1, 2026' }, run: 1, best: true, firstStrong: true },
    best: { ...strongStep, band: 'exceptional', bandLabel: 'Exceptional', prev: { band: 'strong', label: 'Strong', on: 'October 1, 2026' }, run: 2, best: true },
    maintained: { ...strongStep, prev: { band: 'strong', label: 'Strong', on: 'October 1, 2026' }, run: 3 },
    twice: { ...strongStep, prev: { band: 'strong', label: 'Strong', on: 'October 1, 2026' }, run: 2 },
    despite: { ...strongStep, run: 1, condition: { what: 'illness', whole: 3.2, words: 'x' } },
    steady: { ...strongStep, prev: { band: 'working', label: 'Working', on: 'October 1, 2026' }, run: 1 },
    held: { ...strongStep, band: 'working', bandLabel: 'Working', held: { words: 'Your composure held back your consistency by 30 points out of 100', kind: 'ability', what: 'composure', exercise: 'Graded Exposure' } },
    heldAgain: { ...strongStep, band: 'working', bandLabel: 'Working', held: { words: 'Your composure held back your consistency by 30 points out of 100', kind: 'ability', what: 'composure', exercise: 'Graded Exposure', again: 'October 1, 2026' } },
    plain: { ...strongStep, band: 'working', bandLabel: 'Working' },
  };
};

describe('every situation, in every course’s voice', () => {
  it('is said whole and true: no card label as a subject, no "taken", no two colons in a sentence, the date and figures it has, and a step only where the situation gives one', () => {
    for (const v of VOICES) {
      for (const [name, f] of Object.entries(SITUATIONS(v))) {
        const all = showingCandidates(f);
        expect(all.length, `${v} ${name}`).toBeGreaterThan(0);
        for (const c of all) {
          const at = `${v} ${name}: ${c}`;
          expect(c, at).not.toMatch(/note on [A-Z]|taken at|is taken|undefined|\s[.,]/);
          expect(c.split(/(?<=[.!?]\)?)\s+/).every((s) => (s.match(/:/g) ?? []).length <= 1), at).toBe(true);
          expect(/[.?!]$/.test(c), at).toBe(true);
          // A step beyond where the situation gives one, and nowhere else (brief 17: a first Strong, a best and a piece
          // strong despite the day are acknowledged and left there).
          expect(c.includes(STEP_WORDS), at).toBe(saysStep(f));
          if (f.before) expect(c, at).toMatch(/September (?:8|15), 2026|then/);
          if (name === 'partial') expect(c, at).toMatch(/20%.*50%/);
          // A note given before, said with where it stands and never its own words again.
          if (['recurring', 'third', 'persistent', 'slipped'].includes(name)) { expect(c, at).toContain('50%'); expect(c, at).toContain('75%'); expect(c, at).not.toContain('Lines weren’t secure.'); }
        }
      }
    }
  });

  it('stops at a first Strong, a best and a strong piece despite the day, holds back the step where what held a piece has a remedy, and gives it at a plateau', () => {
    for (const v of VOICES) {
      const s = SITUATIONS(v);
      expect(situationOf(s.first!)).toBe('first');
      for (const k of ['first', 'best', 'despite', 'held'] as const) expect(saysStep(s[k]!), `${v} ${k}`).toBe(false);
      for (const k of ['maintained', 'steady', 'plain'] as const) expect(saysStep(s[k]!), `${v} ${k}`).toBe(true);
      // A day that cost under two points isn't strong despite it: the step comes (brief 17: a long scene's stamina, a
      // point of 100, read "Strong, though your stamina ran low", and stopped).
      expect(situationOf({ ...s.despite!, condition: { what: 'stamina', whole: 1.1, words: 'x' } })).not.toBe('despite');
      // A run that rose a band is acknowledged; one holding the same band hears the next step.
      expect(saysStep({ ...s.maintained!, band: 'exceptional', bandLabel: 'Exceptional' })).toBe(false);
    }
  });

  it('says how many notes there have been, and where the last was, in every voice', () => {
    const WORD = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    for (const v of VOICES) for (const given of [3, 6, 11]) {
      const n = given + 1;
      const c = showingCandidates({ ...SITUATIONS(v).persistent!, before: { on: 'September 8, 2026', course: 'Play', given } });
      for (const x of c) {
        expect(x).toContain('in Play on September 8, 2026');
        const said = new RegExp(`\\b(?:${WORD[n] ?? n}|${ORD[n] ?? `${n}th`}|${n}(?:st|nd|rd|th)?)\\b`, 'i');
        expect(said.test(x), `${v} ${given}: ${x}`).toBe(true);
      }
    }
  });
});

describe('the voices, apart', () => {
  it('gives each course one voice, and two courses of one discipline in a year different ones', () => {
    expect(voiceOf('Acting I')).toBe('direct');
    expect(voiceOf('A Course Not Listed')).toBe('direct');
    const firstYear = [['Acting I', 'Play', 'Acting Intimacy And Combat For The Stage'], ['Voice I', 'Speech And Accents I'], ['The Body As Source I', 'Alexander Technique I'], ['Text Analysis I: The Actor’s Table Work', 'Text And Context Across The Repertory']];
    for (const group of firstYear) expect(new Set(group.map((c) => VOICE_OF[c])).size, group.join(', ')).toBe(group.length);
  });

  it('says the same facts in words no other voice uses: no whole message, and no first sentence, shared', () => {
    for (const name of Object.keys(SITUATIONS('direct'))) {
      const by = VOICES.map((v) => ({ v, c: showingCandidates(SITUATIONS(v)[name]!) }));
      for (let i = 0; i < by.length; i += 1) for (let j = i + 1; j < by.length; j += 1) {
        // Same facts but each voice's own course: the course names differ, so they're taken out to compare the telling.
        const strip = (x: string, v: Voice) => x.split(COURSE[v].course).join('COURSE').replace(STEP_WORDS, 'STEP');
        const a = new Set(by[i]!.c.map((x) => strip(x, by[i]!.v)));
        const b = by[j]!.c.map((x) => strip(x, by[j]!.v));
        expect(b.filter((x) => a.has(x)), `${name}: ${by[i]!.v} and ${by[j]!.v}`).toEqual([]);
        const first = (x: string) => shapeOf(x.split(/(?<=[.!?]\)?)\s+/)[0]!);
        const fa = new Set([...a].map(first));
        // The note's own words can open a new note in two voices' messages only after each voice's own lead.
        expect(b.map(first).filter((x) => fa.has(x) && !x.startsWith('the lines')), `${name}: ${by[i]!.v} and ${by[j]!.v}`).toEqual([]);
      }
    }
  });

  it('keeps a step in its discipline’s words', () => {
    const f = SITUATIONS('warm').steady!;
    for (const c of showingCandidates({ ...f, note: STEP.voice.release })) expect(c).toContain(STEP.voice.release);
  });
});

describe('the choice of words, from what was said lately', () => {
  it('is the same for the same facts and memory, and passes over a sentence’s shape said lately whatever its dates and figures', () => {
    const options = ['Up from Working on October 1, 2026. Lines at 20%.', 'A step up since October 1, 2026, with lines at 20%.', 'Better than October 1, 2026: lines at 20%.'];
    expect(pick(options, 'k', [])).toBe(pick(options, 'k', []));
    const first = pick(options, 'k', []);
    // The same sentence said lately with another date and figure: still the same shape, so another is chosen.
    const lately = first.replace('October 1, 2026', 'September 3, 2026').replace('20%', '35%');
    expect(shapeOf(lately)).toBe(shapeOf(first));
    expect(pick(options, 'k', [lately])).not.toBe(first);
    // Every way said lately: the one said longest ago.
    const all = options.map((o) => o.replace('October 1, 2026', 'August 2, 2026'));
    expect(pick(options, 'k', [all[2]!, all[0]!, all[1]!])).toBe(options[2]);
  });
});

describe('a production’s director', () => {
  it('keeps one voice for the run, and says one note three recognizable ways, never two colons in a sentence', () => {
    expect(directorVoiceOf('school:Three Sisters')).toBe(directorVoiceOf('school:Three Sisters'));
    const voices = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((x) => directorVoiceOf(`school:${x}`)));
    expect(voices.size).toBeGreaterThan(1);
    const focus = { kind: 'craft' as const, note: 'objective' as const, problem: 'objective:1', segment: 1, where: 'The Close', measure: 40 };
    const said = (['plain', 'exacting', 'encouraging'] as const).map((voice) => noteText(focus, undefined, undefined, { key: 'k', recent: [], voice }));
    expect(new Set(said).size).toBe(3);
    for (const s of said) expect(s).toContain('the close');
    for (const voice of ['plain', 'exacting', 'encouraging'] as const) for (const taken of [true, false]) {
      const again = noteText({ kind: 'lines' }, { at: 0, text: '', focus: { kind: 'lines' }, taken }, undefined, { key: `k-${voice}-${taken}`, recent: [], voice });
      expect(again.split(/(?<=[.!?]\)?)\s+/).every((x) => (x.match(/:/g) ?? []).length <= 1), again).toBe(true);
    }
  });

  it('closes the run in the voice of its calls, its four bands said three ways and the plain way as before', () => {
    // The same director at the calls and at the close: one key, the run's and the production's.
    expect(directorVoiceFor('school', { production: 'Carlotta Festival Of New Plays' })).toBe(directorVoiceOf('school:Carlotta Festival Of New Plays'));
    expect(directorVoiceFor('summer', { title: 'Summer Show' })).toBe(directorVoiceOf('summer:Summer Show'));
    // Each band at its edge: 1.25, 0.5 and -0.25, and under.
    const at = [1.25, 0.5, -0.25, -0.26];
    expect(at.map((m) => directorsNote(m))).toEqual([
      'Remarkable work, night after night.', 'Strong, reliable work across the run.', 'Solid, sound nights. The next step is to take more risks in them.', 'Uneven: some nights got away from you. Come in rested, and have the part in your body before the house does.',
    ]);
    expect(at.map((m) => directorsNote(m, 'exacting'))).toEqual([
      'Remarkable, every night. That’s the standard to keep.', 'Strong across the run, and I could count on you every night.', 'Solid, but safe. Next time, take more risks in the nights.', 'Too uneven: on some nights the part got away from you. Come in rested, and have it in your body before the house does.',
    ]);
    expect(at.map((m) => directorsNote(m, 'encouraging'))).toEqual([
      'Remarkable work, every night of it. Thank you.', 'You were strong and reliable all through the run. Well done.', 'Good, solid nights. Next, let yourself take more risks in them.', 'Some nights got away from you, and that happens. Come in rested, and have the part in your body before the house does.',
    ]);
    expect(directorsNote(1.24)).toBe(directorsNote(0.5));
  });
});
