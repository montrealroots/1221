/**
 * Social — what the audience says back, a day after you posted.
 *
 * Comments are the crowd's, not a character's: short, in the register of
 * the platform they land on, and true to how the post did — a hit, fine,
 * or a flop. The game knows the numbers; the comments follow them and
 * never the other way round.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'social';
const C = (band: 'hit' | 'fine' | 'flop', vibe: 'video' | 'photo' | 'text' | 'any', n: number, text: string): DialogueLine =>
  line(S, 'comment', 'reactions', `${band}.${vibe}.${n}`, text, { role: 'audience', when: { result: [band], ...(vibe === 'any' ? {} : { flags: [vibe] }) } });

const settled = (band: 'hit' | 'fine' | 'flop', n: number, text: string): DialogueLine =>
  line(S, 'settled', 'reactions', `${band}.${n}`, text, { speaker: 'narrator', role: 'world', when: { result: [band] } });

const LINES: DialogueLine[] = [
  // --- A hit -------------------------------------------------------------------------
  C('hit', 'any', 1, 'ok this is the one'),
  C('hit', 'any', 2, 'why is nobody talking about this'),
  C('hit', 'any', 3, 'sent this to four people already'),
  C('hit', 'any', 4, 'the way I stopped what I was doing'),
  C('hit', 'video', 1, 'watched it twice and I never do that'),
  C('hit', 'video', 2, 'the cut at the end is unreal'),
  C('hit', 'video', 3, 'please do a part two, I’m begging'),
  C('hit', 'photo', 1, 'the light in this is doing something to me'),
  C('hit', 'photo', 2, 'framing is insane. who shot this'),
  C('hit', 'text', 1, 'this thread is better than most articles'),
  C('hit', 'text', 2, 'screenshotted. saved. quoting you at dinner'),

  // --- Fine -----------------------------------------------------------------------------
  C('fine', 'any', 1, 'nice'),
  C('fine', 'any', 2, 'good to see you posting again'),
  C('fine', 'any', 3, 'this is cool, more of this'),
  C('fine', 'any', 4, 'solid. not your best but solid'),
  C('fine', 'video', 1, 'audio is a bit low but I liked it'),
  C('fine', 'video', 2, 'the middle drags. the ending is worth it'),
  C('fine', 'photo', 1, 'pretty. where is this'),
  C('fine', 'photo', 2, 'good shot. crop it tighter next time'),
  C('fine', 'text', 1, 'fair point'),
  C('fine', 'text', 2, 'agree with about half of this'),

  // --- A flop ------------------------------------------------------------------------------
  C('flop', 'any', 1, 'who is this for'),
  C('flop', 'any', 2, 'ok and?'),
  C('flop', 'any', 3, 'posting for the sake of posting'),
  C('flop', 'any', 4, 'I liked your old stuff'),
  C('flop', 'video', 1, 'stopped watching at the intro'),
  C('flop', 'video', 2, 'what is the point of this. genuinely asking'),
  C('flop', 'photo', 1, 'blurry'),
  C('flop', 'photo', 2, 'filter is doing a lot of work here'),
  C('flop', 'text', 1, 'delete this'),
  C('flop', 'text', 2, 'this didn’t need to be a thread'),

  // --- The day after, in one line -----------------------------------------------------------
  settled('hit', 1, 'A day on, it’s still moving. The comments are the good kind.'),
  settled('hit', 2, 'It found people who weren’t looking for you. That’s the whole game.'),
  settled('fine', 1, 'It did what your posts do. The people who follow you saw it.'),
  settled('fine', 2, 'A day on, it has settled. Nobody is talking about it, nobody is unhappy.'),
  settled('flop', 1, 'A day on, it has sunk. The comments that came weren’t kind.'),
  settled('flop', 2, 'It didn’t land. The numbers say so, and so do the four people who replied.'),
];

export const SOCIAL_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'comment', beat: 'reactions', result: ['hit', 'fine', 'flop'] },
    { purpose: 'comment', beat: 'reactions', result: ['hit', 'fine', 'flop'], flags: ['video'] },
    { purpose: 'comment', beat: 'reactions', result: ['hit', 'fine', 'flop'], flags: ['photo'] },
    { purpose: 'comment', beat: 'reactions', result: ['hit', 'fine', 'flop'], flags: ['text'] },
    { purpose: 'settled', beat: 'reactions', result: ['hit', 'fine', 'flop'] },
  ],
};
