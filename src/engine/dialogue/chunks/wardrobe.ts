/**
 * Wardrobe — the room you are going to, the mirror, and what people noticed.
 *
 * The mirror is not a stylist and never gives an instruction. It says what it
 * sees, specifically, and lets you leave in whatever you like. Every line here
 * describes an outfit a command has already assembled.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'wardrobe';
const D = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'world', speaker: 'narrator', ...opts });

const LINES: DialogueLine[] = [
  // --- What the room expects ---------------------------------------------------------------------
  D('code', 'wardrobe', 'said.1', '{code}. {note}'),
  D('code', 'wardrobe', 'said.2', 'It says {code} on the invitation, which means: {note}'),
  D('code', 'wardrobe', 'said.3', '{code}, then. {note} Nobody will throw you out either way.'),
  D('code', 'wardrobe', 'said.4', 'You open the wardrobe with {code} in your head. {note}'),
  D('code', 'wardrobe', 'said.5', 'The room wants {code}. {note} You are allowed to disagree with it.'),

  // --- Standing there ----------------------------------------------------------------------------
  D('browse', 'wardrobe', 'open.1', 'The wardrobe, and the particular blankness of looking at everything you own and seeing nothing.'),
  D('browse', 'wardrobe', 'open.2', 'Three quarters of it you never wear and you keep all of it.'),
  D('browse', 'wardrobe', 'open.3', 'You reach for the same thing you always reach for, and stop, and think about it.'),
  D('browse', 'wardrobe', 'open.4', 'The good hanger is empty because the good thing is at the cleaner’s.'),
  D('browse', 'wardrobe', 'open.5', 'Everything in here was bought by somebody with a plan, and you cannot remember what it was.'),

  // --- The mirror, kindly ------------------------------------------------------------------------
  D('verdict', 'mirror', 'good.1', '{label}. The mirror has nothing to add and does not pretend otherwise.', { when: { result: ['good'] } }),
  D('verdict', 'mirror', 'good.2', 'You look at yourself for slightly too long, which is the tell. {label}.', { when: { result: ['good'] } }),
  D('verdict', 'mirror', 'good.3', '{label}. This is the version of you that gets remembered correctly.', { when: { result: ['good'] } }),
  D('verdict', 'mirror', 'good.4', 'Everything is doing its job and none of it is showing off. {label}.', { when: { result: ['good'] } }),
  D('verdict', 'mirror', 'good.5', '{label}. You will not think about your clothes again all evening, which is the whole point of getting them right.', { when: { result: ['good'] } }),
  D('verdict', 'mirror', 'fine.1', '{label}. It will do, and doing is most of what clothes are for.', { when: { result: ['fine'] } }),
  D('verdict', 'mirror', 'fine.2', 'Nothing wrong with it. Nothing much right with it either. {label}.', { when: { result: ['fine'] } }),
  D('verdict', 'mirror', 'fine.3', '{label}. You would change one thing if you had another ten minutes, and you do not.', { when: { result: ['fine'] } }),
  D('verdict', 'mirror', 'fine.4', 'Fine from the front, which is where most people will be. {label}.', { when: { result: ['fine'] } }),
  D('verdict', 'mirror', 'poor.1', '{label}. You know. You are going anyway.', { when: { result: ['poor'] } }),
  D('verdict', 'mirror', 'poor.2', 'The mirror is not on your side this morning. {label}.', { when: { result: ['poor'] } }),
  D('verdict', 'mirror', 'poor.3', '{label}. Somebody is going to be kind about it, which is worse.', { when: { result: ['poor'] } }),
  D('verdict', 'mirror', 'poor.4', 'You leave in it because leaving in it is faster than fixing it. {label}.', { when: { result: ['poor'] } }),

  // --- The specific complaints, said aloud --------------------------------------------------------
  D('note', 'mirror', 'shoes.1', 'It is the shoes. It is always the shoes.', { when: { flags: ['clash'] } }),
  D('note', 'mirror', 'shoes.2', 'Everything above the ankle is right.', { when: { flags: ['clash'] } }),
  D('note', 'mirror', 'colour.1', 'Two of these were bought on the same afternoon and it shows.', { when: { flags: ['clash'] } }),
  D('note', 'mirror', 'formal.1', 'You are going to be the least dressed person in the room, and you will know it in the first minute.', { when: { flags: ['under'] } }),
  D('note', 'mirror', 'formal.2', 'Overdressed, which is the better mistake, and still a mistake.', { when: { flags: ['over'] } }),
  D('note', 'mirror', 'weather.1', 'It looks right and it is going to be wrong by the time you get there.', { when: { flags: ['weather'] } }),
  D('note', 'mirror', 'weather.2', 'You will be carrying the coat rather than wearing it within the hour.', { when: { flags: ['weather'] } }),
  D('note', 'mirror', 'dirty.1', 'Close up, that has been worn once too often since it was washed.', { when: { flags: ['dirty'] } }),
  D('note', 'mirror', 'tired.1', 'It has been good and it is not good any more, and there is a difference you can see from across a room.', { when: { flags: ['tired'] } }),
  D('note', 'mirror', 'repeat.1', 'The same thing again. Fine, unless somebody was taking pictures last time.', { when: { flags: ['repeat'] } }),
  D('note', 'mirror', 'repeat.2', 'You have worn this to the last two of these. Nobody is counting. Somebody is counting.', { when: { flags: ['repeat'] } }),

  // --- What other people said ------------------------------------------------------------------------
  D('remark', 'out', 'good.1', '"You look well. Is that new?" — the highest compliment available and it is about a jacket.', { when: { result: ['good'] }, speaker: 'npc', role: 'friend' }),
  D('remark', 'out', 'good.2', 'Two separate people look for a second longer than they meant to.', { when: { result: ['good'] } }),
  D('remark', 'out', 'good.3', '"Where is that from?" Which is the question people ask when they mean it.', { when: { result: ['good'] }, speaker: 'npc', role: 'friend' }),
  D('remark', 'out', 'flat.1', 'Nobody says anything about what you are wearing, which is the correct outcome most days.', { when: { result: ['fine'] } }),
  D('remark', 'out', 'poor.1', '"Did you come straight from something?" No. You did not.', { when: { result: ['poor'] }, speaker: 'npc', role: 'friend' }),
  D('remark', 'out', 'poor.2', 'Somebody looks at your shoes and then very deliberately at your face.', { when: { result: ['poor'] } }),
  D('remark', 'out', 'press.1', 'A photographer gets four frames and one of them will be the one that runs.', { when: { flags: ['press'] } }),
  D('remark', 'out', 'press.2', 'The caption tomorrow will name the designer, correctly or otherwise.', { when: { flags: ['press'] } }),

  // --- The cleaner ------------------------------------------------------------------------------------
  D('clean', 'errand', 'in.1', '"Two days. Thursday after four."', { speaker: 'npc', role: 'world' }),
  D('clean', 'errand', 'in.2', 'A paper ticket with a number on it, and a rail of other people’s good coats.'),
  D('clean', 'errand', 'in.3', '"There is a mark on the cuff. I will do what I can and I am not promising."', { speaker: 'npc', role: 'world' }),
  D('clean', 'errand', 'home.1', 'The machine, forty minutes, and the specific optimism of hanging things up damp.'),
  D('clean', 'errand', 'home.2', 'You read the label, decide it is probably fine, and put it in anyway.'),
  D('clean', 'errand', 'out.1', 'Back on the hanger in plastic, smelling of nothing at all, which is the smell of clean.'),
];

export const WARDROBE_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'code', beat: 'wardrobe' },
    { purpose: 'browse', beat: 'wardrobe' },
    { purpose: 'verdict', beat: 'mirror', result: ['good', 'fine', 'poor'] },
    { purpose: 'note', beat: 'mirror', flags: ['clash'] },
    { purpose: 'note', beat: 'mirror', flags: ['weather'] },
    { purpose: 'note', beat: 'mirror', flags: ['repeat'] },
    { purpose: 'remark', beat: 'out', result: ['good', 'fine', 'poor'] },
    { purpose: 'clean', beat: 'errand' },
  ],
};
