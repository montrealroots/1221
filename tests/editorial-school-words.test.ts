/**
 * The school's words, one name for each thing (from 2026-10-17, brief 14's editorial review). A part of a piece is
 * named as its card names it, in a forecast, a teacher's note and a note taken; a Table Work question and a skill are
 * said in a sentence's own words; a scene's place reads mid-sentence; a classmate's request for help is titled as the
 * other moments are. Until then a presentation's card said “Still to finish: the presentation prepared” beside “The
 * revision isn’t complete”, a note was “on with your partner”, “Priya reads given circumstances …”, “Your on camera and
 * scene study carried it.”, and “What We Keep, Their late father’s apartment”. A life played through every year, with
 * these words in its notices, is in `docs/verification/language-2026-10-17/editorial/b2-rendered.txt`.
 */
import { describe, expect, it } from 'vitest';
import { QUESTIONS, questionWords, templateById } from '@/engine/content/coursework';
import { SKILLS, SKILL_WORDS } from '@/engine/content/school';
import { whereWords, withPartLabels, type Assignment } from '@/engine/systems/coursework';
import { chiefLimit, type Limit } from '@/engine/systems/evaluation';
import { MOMENT_TITLE } from '@/engine/systems/classmates';
import { CABARET_RUN, partWords } from '@/engine/systems/school';

describe('the school’s words: one name for each thing, and each said as a sentence says it', () => {
  it('a part of a piece is named as its card names it, so a presentation’s forecast says its own part and not a revision', () => {
    const t = templateById('context-presentation')!;
    expect(t.dims.revision!.label).toBe('The Presentation Prepared');
    const limit: Limit = { kind: 'preparation', what: 'revision', label: 'The revision', dimension: 'execution', by: 43.9 };
    const a = { template: 'context-presentation' } as unknown as Assignment;
    expect(chiefLimit({ limits: [limit] }, 'now')).toBe('The revision isn’t complete, and that costs your execution 44 points out of 100');
    expect(chiefLimit(withPartLabels({ limits: [limit] }, a), 'now')).toBe('“The Presentation Prepared” isn’t complete, and that costs your execution 44 points out of 100');
    // Only a part's label: an ability, and a part the card doesn't have, keep theirs.
    const other: Limit = { kind: 'ability', what: 'focus', label: 'Focus', dimension: 'execution', by: 4 };
    const approach: Limit = { kind: 'preparation', what: 'approach', label: 'Rehearsing the way you chose to play it', dimension: 'execution', by: 2 };
    expect(withPartLabels({ limits: [other, approach] }, a).limits).toEqual([other, approach]);
  });

  it('a Table Work question and a skill, as a sentence names them', () => {
    expect(QUESTIONS.map((q) => questionWords(q))).toEqual(['the given circumstances', 'the relationship', 'your objective', 'the obstacle', 'the choice to play']);
    expect(SKILLS.every((s) => SKILL_WORDS[s.id] && SKILL_WORDS[s.id] === SKILL_WORDS[s.id].toLowerCase())).toBe(true);
    expect([SKILL_WORDS.screen, SKILL_WORDS.clown, SKILL_WORDS.voiceover, SKILL_WORDS.comedy]).toEqual(['on-camera work', 'clowning', 'voice-over work', 'comic timing']);
  });

  it('a scene’s place reads mid-sentence, and a name stays as it is', () => {
    expect(whereWords('Before the castle of Pentheus at Thebes, the Stranger brought in bound')).toBe('before the castle of Pentheus at Thebes, the Stranger brought in bound');
    expect(whereWords('Their late father’s apartment, half packed into boxes, a Saturday in 2012')).toBe('their late father’s apartment, half packed into boxes, a Saturday in 2012');
    expect(whereWords('A rented desk in a shared office, after everyone else has gone home, 2015')).toBe('a rented desk in a shared office, after everyone else has gone home, 2015');
    expect(whereWords('The one act, the Wright kitchen')).toBe('the one act, the Wright kitchen');
    expect(whereWords('Act Two, the garden')).toBe('Act Two, the garden');
    expect(whereWords('Episode Two, At Home')).toBe('Episode Two, At Home');
  });

  it('a part the School casts by size reads in lower case in a sentence, the Cabaret keeping its capital; a role keeps its name', () => {
    expect(partWords('A Leading Part In A New Play')).toBe('a leading part in a new play');
    expect(partWords('An Understudy In The Company')).toBe('an understudy in the company');
    expect(partWords(CABARET_RUN.part)).toBe('a part in a Cabaret show');
    expect(partWords('Konstantin')).toBe('Konstantin');
    expect(partWords('The Bride')).toBe('The Bride');
  });

  it('a classmate’s request for help is titled as the other moments are', () => {
    expect(MOMENT_TITLE.help).toBe('A Request For Help');
    expect(Object.values(MOMENT_TITLE).every((t) => /^(A|An) [A-Z]|^Run Lines Together\?$/.test(t))).toBe(true);
  });
});
