/**
 * The costume house — the table, the toile, and the four questions.
 *
 * A cutter talks like somebody who has to make the thing, not sell it. They
 * are specific about cloth, skeptical about ideas that will not hang, and
 * they say the awkward thing before you pay rather than after. Nothing here
 * refuses an order. It is a room where people are used to being told what
 * something will actually be like.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'costume';
const D = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'world', speaker: 'narrator', ...opts });

const LINES: DialogueLine[] = [
  // --- Coming in, a stranger ----------------------------------------------------------------------
  D('greeting', 'counter', 'stranger.1', 'A machine stops. {name} looks up over the top of it with three pins in their mouth and takes them out.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.2', 'The smell is steam and new cloth. {name} finishes a seam before coming over, which takes as long as it takes.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.3', 'Bolts to the ceiling on one wall, dress forms down the middle. {name} asks what you are after.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.4', 'Somebody is chalking a sleeve head on the big table and does not stop for you, which is correct.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.5', '{name} wipes their hands, looks at your shoulders for slightly too long, and says hello.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.6', 'There is chalk dust on everything and a radio on low. Nobody rushes you at {shop}.', { when: { flags: ['stranger'] } }),

  // --- Coming in, known ---------------------------------------------------------------------------
  D('greeting', 'counter', 'regular.1', '{name} says your name and then your measurements, in that order, from memory.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.2', '“You,” says {name}, and pulls your card out of the box without looking at the box.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.3', '{name} asks how the last one wore before asking what you want next.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.4', 'Your toile is still on a form in the corner. They kept it, because they always keep it.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.5', '{name} has a length of something put by for you. They will mention it at the end, not the start.', { when: { flags: ['regular'] } }),

  // --- A grand house, and a working room ----------------------------------------------------------
  D('greeting', 'counter', 'grand.1', '{shop} cuts for pictures. There are lock-ups down the corridor with a whole period in each one.', { when: { flags: ['grand'] } }),
  D('greeting', 'counter', 'grand.2', 'Two people are hand-finishing a coat that will be on screen for ninety seconds.', { when: { flags: ['grand'] } }),
  D('greeting', 'counter', 'grand.3', 'The pattern library at {shop} goes back forty years and somebody knows where everything in it is.', { when: { flags: ['grand'] } }),
  D('greeting', 'counter', 'workroom.1', 'One industrial machine, one overlocker, one steamer going constantly.', { when: { flags: ['workroom'] } }),
  D('greeting', 'counter', 'workroom.2', 'The cutting table has forty years of blade marks in it and is not being replaced.', { when: { flags: ['workroom'] } }),
  D('greeting', 'counter', 'workroom.3', 'Everything in here was made in here, and {shop} would like you to know that.', { when: { flags: ['workroom'] } }),
  D('greeting', 'counter', 'workroom.4', 'A kettle nobody turns off, and a jar of buttons older than the building.', { when: { flags: ['workroom'] } }),

  // --- Designing: what are we making --------------------------------------------------------------
  D('design', 'garment', 'ask.1', '{name} pulls a pad across the table. “Start with the thing. What is it?”'),
  D('design', 'garment', 'ask.2', '“Tell me the garment before you tell me the cloth. People always do it the other way round.”'),
  D('design', 'garment', 'ask.3', 'A tape measure comes off their neck and stays in their hand while you talk.'),
  D('design', 'garment', 'ask.4', '“What is it for? Not what is it — what is it for. Those are different questions.”'),
  D('design', 'garment', 'ask.5', 'They sketch three shapes on the back of a docket and turn it round.'),

  D('design', 'cloth', 'ask.1', '“And in what? That decides how it hangs and most of the price.”'),
  D('design', 'cloth', 'ask.2', 'Swatches come out in a fan. They rub two between finger and thumb before you touch anything.'),
  D('design', 'cloth', 'ask.3', '“Feel the weight. That is the whole conversation, really.”'),
  D('design', 'cloth', 'ask.4', 'They drape a length over the form so you can see how it falls instead of how it looks flat.'),
  D('design', 'cloth', 'ask.5', '“Everything hangs beautifully on the roll. That means nothing.”'),

  D('design', 'finish', 'ask.1', '“Now: how much of this is done by hand, and how much is the machine?”'),
  D('design', 'finish', 'ask.2', '“You cannot see the finishing. You can feel it, and so can everyone who hugs you.”'),
  D('design', 'finish', 'ask.3', 'They turn a jacket inside out on the form and show you the inside as if that were the point. It is.'),
  D('design', 'finish', 'ask.4', '“Fused is quicker and it is fine. Canvas is slower and it is not the same thing.”'),
  D('design', 'finish', 'ask.5', '“This is where the hours go, and the hours are what you are actually buying.”'),

  // --- The number ---------------------------------------------------------------------------------
  D('quote', 'counter', 'clean.1', '{name} works it out on the docket and turns it round. {total}, and {weeks} weeks.', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'clean.2', '“{total}. {weeks} weeks. I will not be faster and I will not be cheaper.”', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'clean.3', 'The number is {total}. They say it once and then wait, which is a kind of confidence.', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'clean.4', '“{total}, in about {weeks} weeks, and no surprises after that.”', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'caution.1', '{total}, and {weeks} weeks. Then {name} tells you the parts you were not going to like.', { when: { flags: ['caution'] } }),
  D('quote', 'counter', 'caution.2', '“{total}. Before you say yes, there are one or two things you should know.”', { when: { flags: ['caution'] } }),
  D('quote', 'counter', 'caution.3', 'They write {total} down, then put the pencil down. “Now the honest bit.”', { when: { flags: ['caution'] } }),
  D('quote', 'counter', 'caution.4', '“I will make it. I would rather you knew this first than found out in {weeks} weeks.”', { when: { flags: ['caution'] } }),

  // --- Fittings -----------------------------------------------------------------------------------
  D('fitting', 'stand', 'first.1', 'Calico, chalk and no sleeves yet. It looks like nothing and it is the most important one.'),
  D('fitting', 'stand', 'first.2', 'You stand still. They walk round you twice without saying anything and then start pinning.'),
  D('fitting', 'stand', 'first.3', '“Do not help. Stand how you actually stand, not how you think you should.”'),
  D('fitting', 'stand', 'second.1', 'In cloth now. It has stopped being a shape and started being a garment.'),
  D('fitting', 'stand', 'second.2', 'They take a quarter inch out of one shoulder and it changes everything about how it sits.'),
  D('fitting', 'stand', 'third.1', 'Hems pinned, buttons marked, and they will not let you look in the mirror yet.'),
  D('fitting', 'stand', 'third.2', 'Almost done. They spend eleven minutes on a sleeve length you would never have noticed.'),

  // --- Collecting ---------------------------------------------------------------------------------
  D('collect', 'counter', 'ready.1', 'It comes off the rail under a cover. They take the cover off in one movement, like a reveal, because it is one.'),
  D('collect', 'counter', 'ready.2', 'You put it on and it does the thing good clothes do, which is disappear.'),
  D('collect', 'counter', 'ready.3', '{name} watches you move in it and is looking at the shoulders, not your face.'),
  D('collect', 'counter', 'ready.4', 'There is a label in the neck. Somebody sewed that in by hand this morning.'),
  D('collect', 'counter', 'ready.5', 'Nobody else on earth has this, and it would not fit them if they did.'),

  // --- Leaving ------------------------------------------------------------------------------------
  D('leave', 'counter', 'out.1', 'You leave with chalk on your sleeve and nothing bought.'),
  D('leave', 'counter', 'out.2', 'The machine starts up again before the door has shut.'),
  D('leave', 'counter', 'out.3', '{name} says come back when you know what it is for.'),

  // --- Your own table -----------------------------------------------------------------------------
  D('make', 'table', 'start.1', 'You clear the table, weigh the pattern down, and cut. There is no undoing this part.'),
  D('make', 'table', 'start.2', 'The machine is threaded, the tension is tested on a scrap, and it is still wrong on the first seam.'),
  D('make', 'table', 'start.3', 'Four hours in you realize you have sewn a sleeve on inside out, and you unpick it, and you do it again.'),
  D('make', 'table', 'end.1', 'You press it, hang it, and stand back from it further than you need to.'),
  D('make', 'table', 'end.2', 'It is not perfect. You made it, which is a different thing from perfect.'),
];

export const CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'greeting', beat: 'counter', flags: ['stranger'] },
    { purpose: 'greeting', beat: 'counter', flags: ['regular'] },
    { purpose: 'greeting', beat: 'counter', flags: ['grand'] },
    { purpose: 'greeting', beat: 'counter', flags: ['workroom'] },
    { purpose: 'design', beat: 'garment' },
    { purpose: 'design', beat: 'cloth' },
    { purpose: 'design', beat: 'finish' },
    { purpose: 'quote', beat: 'counter', flags: ['clean'] },
    { purpose: 'quote', beat: 'counter', flags: ['caution'] },
    { purpose: 'fitting', beat: 'stand' },
    { purpose: 'collect', beat: 'counter' },
    { purpose: 'leave', beat: 'counter' },
    { purpose: 'make', beat: 'table' },
  ],
};
