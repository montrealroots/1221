/**
 * The jeweler's — the counter, the loupe, and the five questions.
 *
 * A jeweler talks differently from a shop assistant. They are slower, they
 * are specific, and the good ones tell you the awkward thing before you pay
 * rather than after. Nothing here refuses an order or hurries a decision; it
 * is a room where people are used to somebody taking a month to make up their
 * mind about a great deal of money.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'jewellery';
const D = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'world', speaker: 'narrator', ...opts });

const LINES: DialogueLine[] = [
  // --- Coming in, a stranger ----------------------------------------------------------------------
  D('greeting', 'counter', 'stranger.1', 'A buzzer, then the door. {name} looks up from a cloth with something small on it and doesn’t put it away.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.2', 'It’s quieter inside than you expect. {name} finishes a sentence to somebody on the phone and comes over.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.3', 'Glass, felt, and a light that’s much better than the one in your bathroom. {name} asks if you are looking for anything in particular.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.4', '{name} says take your time, and then genuinely lets you, which not everybody in retail can do.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.5', 'Nobody comes at you. You get a nod from {name} and a full thirty seconds to look before anybody speaks.', { when: { flags: ['stranger'] } }),
  D('greeting', 'counter', 'stranger.6', 'The case runs the length of the room. {name} is at the far end of it, and is in no hurry to be at this end.', { when: { flags: ['stranger'] } }),

  // --- Coming in, known ---------------------------------------------------------------------------
  D('greeting', 'counter', 'regular.1', '{name} says your name before you say anything, which is the whole business model.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.2', '“You,” says {name}, and reaches under the counter for the tray they know you like.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.3', '{name} asks after the last piece before asking what you want today.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.4', 'The kettle goes on without anybody asking whether you want one.', { when: { flags: ['regular'] } }),
  D('greeting', 'counter', 'regular.5', '{name} has kept something back to show you. They won’t say so, but they have.', { when: { flags: ['regular'] } }),

  // --- A house, and a bench -----------------------------------------------------------------------
  D('greeting', 'counter', 'maison.1', 'Everything in {shop} is behind glass and lit from three directions. Nothing has a price on it.', { when: { flags: ['maison'] } }),
  D('greeting', 'counter', 'maison.2', 'There’s a chair. You’re meant to sit in it, and the sitting is part of the price.', { when: { flags: ['maison'] } }),
  D('greeting', 'counter', 'maison.3', 'Somebody takes your coat at {shop} before anybody discusses anything.', { when: { flags: ['maison'] } }),
  D('greeting', 'counter', 'bench.1', 'A workshop smell: flux, polish, and hot metal from somewhere behind a curtain.', { when: { flags: ['bench'] } }),
  D('greeting', 'counter', 'bench.2', 'There’s a bench in the back with a peg worn into a curve by somebody’s forearm.', { when: { flags: ['bench'] } }),
  D('greeting', 'counter', 'bench.3', 'The window has three repairs in it with tickets on, waiting for people who haven’t come back yet.', { when: { flags: ['bench'] } }),
  D('greeting', 'counter', 'bench.4', 'Nothing in here was made anywhere else, and {shop} would like you to know that.', { when: { flags: ['bench'] } }),

  // --- Designing: what are we making ---------------------------------------------------------------
  D('design', 'piece', 'ask.1', '{name} pulls a pad across the counter. “Start at the beginning. What is it?”'),
  D('design', 'piece', 'ask.2', 'A pencil comes out. Nothing gets typed into anything for a while yet.'),
  D('design', 'piece', 'ask.3', '“Tell me what it is before you tell me what is in it. The stone is the easy part.”'),
  D('design', 'piece', 'ask.4', '“People come in knowing the stone and not the piece. It’s always the wrong way round.”'),
  D('design', 'piece', 'ask.5', 'They draw three shapes without looking down and turn the pad towards you.'),

  D('design', 'metal', 'ask.1', '“And in what? That decides more than people think.”'),
  D('design', 'metal', 'ask.2', 'A tray of sample bands, all the same shape and none of them the same color.'),
  D('design', 'metal', 'ask.3', '“Try them against your hand. Half of this is what your skin does to the color.”'),
  D('design', 'metal', 'ask.4', '“Whatever you pick, I’ll tell you what it will do in ten years. That’s free.”'),
  D('design', 'metal', 'ask.5', '“Heavier isn’t better. It’s just heavier. It does last longer, though.”'),

  D('design', 'stone', 'ask.1', '“Right. What is going in it.”'),
  D('design', 'stone', 'ask.2', 'A folded paper packet comes out of a drawer, and then another one.'),
  D('design', 'stone', 'ask.3', '“There’s no wrong answer here, only answers with consequences I’ll explain.”'),
  D('design', 'stone', 'ask.4', '“Everybody says diamond. Ask me about sapphire before you decide.”'),
  D('design', 'stone', 'ask.5', 'They put three loose stones on the cloth and don’t say which is which.'),

  D('design', 'size', 'ask.1', '“How big, then. And be honest about what you’ll actually wear.”'),
  D('design', 'size', 'ask.2', '“{stone}. Everything from here is a question of how much of it.”'),
  D('design', 'size', 'ask.3', 'They set out cubic zirconia in ascending sizes so you can see what a number means on a hand.'),
  D('design', 'size', 'ask.4', '“The jump from one carat to two isn’t double the money. It’s rather more than double.”'),
  D('design', 'size', 'ask.5', '“A smaller stone cut properly beats a bigger one cut for weight. Every time.”'),

  D('design', 'cut', 'ask.1', '“Shape. This is the part people have an opinion about before they walk in.”'),
  D('design', 'cut', 'ask.2', '“Round throws the most light back at you and wastes the most rough getting there.”'),
  D('design', 'cut', 'ask.3', '“Step cuts have nowhere to hide. If you want an emerald cut, you buy a cleaner stone.”'),
  D('design', 'cut', 'ask.4', 'They tilt the tray so the light moves across it, which is the entire argument.'),
  D('design', 'cut', 'ask.5', '“Ignore what is fashionable. You’re keeping this longer than the fashion lasts.”'),

  D('design', 'colour', 'ask.1', '“Color next. D at the top, Z at the bottom, and almost nobody can tell D from F.”'),
  D('design', 'colour', 'ask.2', '“In yellow gold you can drop two grades and save real money without anybody knowing.”'),
  D('design', 'colour', 'ask.3', 'They lay a stone face down on white card, which is the only way the scale means anything.'),
  D('design', 'colour', 'ask.4', '“G is where I would spend. Above it you’re paying for a certificate.”'),
  D('design', 'colour', 'ask.5', '“Nobody has ever looked at a hand across a table and thought: that’s an H.”'),

  D('design', 'clarity', 'ask.1', '“Clarity. What matters is whether you can see it, not what the paper says.”'),
  D('design', 'clarity', 'ask.2', 'A loupe is put in your hand rather than held up for you.'),
  D('design', 'clarity', 'ask.3', '“Eye clean is the only grade that counts, and it isn’t on the scale.”'),
  D('design', 'clarity', 'ask.4', '“An inclusion isn’t damage. It’s how the stone proves it came out of the ground.”'),
  D('design', 'clarity', 'ask.5', '“I’ll show you the flaw. If you can’t find it without this, you’re paying for nothing above it.”'),

  D('design', 'setting', 'ask.1', '“Last question. How do we hold it.”'),
  D('design', 'setting', 'ask.2', '“This is the part that fails, years from now, and it fails on a Tuesday.”'),
  D('design', 'setting', 'ask.3', '“More metal, more safety, less light. That’s the whole trade and there’s no way round it.”'),
  D('design', 'setting', 'ask.4', 'They turn a finished ring upside down to show you the underneath, which is where the work is.'),
  D('design', 'setting', 'ask.5', '“Tell me what you do with your hands all day and I’ll tell you what setting you want.”'),

  // --- The number ------------------------------------------------------------------------------------
  D('quote', 'counter', 'clean.1', '{name} writes {total} on the pad, turns it round, and says nothing for a moment. {weeks} weeks.', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'clean.2', '“{total}, and {weeks} weeks. No, I can’t do it faster; the wait is somebody sitting at a bench.”', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'clean.3', 'The number is {total}. It’s said out loud, plainly, without any of the softening people do.', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'clean.4', '“{total} all in, {weeks} weeks, and nothing added at the end. I don’t do that.”', { when: { flags: ['clean'] } }),
  D('quote', 'counter', 'caution.1', '{total}, and {weeks} weeks. Then {name} says there are a couple of things you ought to hear first.', { when: { flags: ['caution'] } }),
  D('quote', 'counter', 'caution.2', '“{total}. Before you say yes, some of what you have picked will behave in ways you should know about.”', { when: { flags: ['caution'] } }),
  D('quote', 'counter', 'caution.3', 'The number goes on the pad — {total} — and underneath it, a short list they read out anyway.', { when: { flags: ['caution'] } }),
  D('quote', 'counter', 'caution.4', '“{weeks} weeks and {total}. I’ll still make it exactly as you asked. I’m telling you so you aren’t surprised in five years.”', { when: { flags: ['caution'] } }),

  // --- Looking, and leaving without buying -------------------------------------------------------------
  D('browse', 'case', 'look.1', 'Everything comes out one at a time and goes back before the next one appears. That’s deliberate.'),
  D('browse', 'case', 'look.2', 'The cloth is gray because everything looks better on gray, and everybody in the trade knows it.'),
  D('browse', 'case', 'look.3', 'You put something on, hold your hand out, and do the thing everybody does with their fingers spread.'),
  D('browse', 'case', 'look.4', 'The light in here is doing at least a third of the work and nobody pretends otherwise.'),
  D('browse', 'case', 'look.5', 'You ask the price of one thing and are shown three others in the same breath.'),

  D('leave', 'counter', 'nothing.1', 'You say you’ll think about it. {name} says everybody does, and means it.'),
  D('leave', 'counter', 'nothing.2', 'A card goes into your hand on the way out. No pressure with it, which is its own kind of pressure.'),
  D('leave', 'counter', 'nothing.3', 'The buzzer again, and the street, and everything outside looks slightly cheaper for a minute.'),
  D('leave', 'counter', 'nothing.4', 'Nothing bought. The thing you looked at will be in your head for a fortnight.'),

  // --- Collecting ----------------------------------------------------------------------------------------
  D('collect', 'counter', 'ready.1', 'It comes out in a box you weren’t expecting to feel anything about.'),
  D('collect', 'counter', 'ready.2', '{name} opens it facing you and then steps back, because this bit isn’t theirs.'),
  D('collect', 'counter', 'ready.3', 'It’s heavier than the drawing was. Everything made is heavier than the drawing was.'),
  D('collect', 'counter', 'ready.4', 'There’s a certificate, a receipt and a small cloth, and you’ll keep exactly one of the three.'),
  D('collect', 'counter', 'ready.5', 'You look at it for a long moment. Somebody made this, from nothing, because you asked.'),
];

export const CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'greeting', beat: 'counter', flags: ['stranger'] },
    { purpose: 'greeting', beat: 'counter', flags: ['regular'] },
    { purpose: 'greeting', beat: 'counter', flags: ['maison'] },
    { purpose: 'greeting', beat: 'counter', flags: ['bench'] },
    { purpose: 'design', beat: 'piece' },
    { purpose: 'design', beat: 'metal' },
    { purpose: 'design', beat: 'stone' },
    { purpose: 'design', beat: 'size' },
    { purpose: 'design', beat: 'cut' },
    { purpose: 'design', beat: 'colour' },
    { purpose: 'design', beat: 'clarity' },
    { purpose: 'design', beat: 'setting' },
    { purpose: 'quote', beat: 'counter', flags: ['clean'] },
    { purpose: 'quote', beat: 'counter', flags: ['caution'] },
    { purpose: 'browse', beat: 'case' },
    { purpose: 'leave', beat: 'counter' },
    { purpose: 'collect', beat: 'counter' },
  ],
};
