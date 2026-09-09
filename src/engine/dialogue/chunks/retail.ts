/**
 * Retail — the door, the floor, the fitting room, the counter.
 *
 * The assistant speaks to whether they know your face, to what you have
 * picked up, and to what the mirror said. Every chain in the game is SLATE's
 * own and no real shop is quoted here; these are the words the people on the
 * floor use, and the money is still the one purchase engine underneath.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'retail';
const R = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'assistant', ...opts });

const LINES: DialogueLine[] = [
  // --- The door ----------------------------------------------------------------------------------
  R('greet', 'door', 'first.1', '"Morning. Shout if you want anything down from the wall."', { when: { flags: ['first'] } }),
  R('greet', 'door', 'first.2', 'Somebody says hello from behind a rail of coats and goes back to what they were doing, which is the correct amount of attention.', { when: { flags: ['first'] }, speaker: 'narrator' }),
  R('greet', 'door', 'first.3', '"Have a look. The new things are on the left, the sale is at the back and it’s genuinely a sale."', { when: { flags: ['first'], tone: ['warm'] } }),
  R('greet', 'door', 'first.4', 'The door makes a noise designed by somebody who wanted you noticed. You’re noticed.', { when: { flags: ['first'] }, speaker: 'narrator', role: 'world' }),
  R('greet', 'door', 'regular.1', '"You. I put something aside, actually. Give me a second."', { when: { flags: ['regular'] } }),
  R('greet', 'door', 'regular.2', 'The assistant recognises you before the door has closed, and doesn’t pretend otherwise.', { when: { flags: ['regular'] }, speaker: 'narrator' }),
  R('greet', 'door', 'regular.3', '"How did the last one hold up? Honestly. I want to know."', { when: { flags: ['regular'], tone: ['warm'] } }),
  R('greet', 'door', 'buyer.1', '"Good to see you. Anything in particular, or are we browsing dangerously?"', { when: { flags: ['buyer'] } }),
  R('greet', 'door', 'browser.1', 'The assistant clocks you, remembers the last three times, and stays exactly where they are.', { when: { flags: ['browser'] }, speaker: 'narrator' }),
  R('greet', 'door', 'browser.2', '"Take your time." It’s said with a very slight edge.', { when: { flags: ['browser'], tone: ['dry'] } }),
  R('greet', 'door', 'luxury.1', '"Can I take your coat? There’s no hurry with any of this."', { when: { flags: ['luxury'] } }),
  R('greet', 'door', 'luxury.2', 'Nobody rushes you and nobody leaves you alone either. It’s a skill and it’s being used on you.', { when: { flags: ['luxury'] }, speaker: 'narrator' }),
  R('greet', 'door', 'plain.1', '"Hi. Give me a wave if you need a size."', {}),
  R('greet', 'door', 'plain.2', 'Music slightly too loud, lighting slightly too kind, and everything folded to within an inch of its life.', { speaker: 'narrator', role: 'world' }),

  // --- The floor ---------------------------------------------------------------------------------
  R('browse', 'floor', 'look.1', 'You work along the rail with the back of your hand, which is how everybody does it and nobody was taught.', { speaker: 'narrator', role: 'world' }),
  R('browse', 'floor', 'look.2', 'Half of it is for somebody else. A quarter of it is for a version of you that goes out more. The rest is worth picking up.', { speaker: 'narrator', role: 'world' }),
  R('browse', 'floor', 'look.3', 'You check a price, put it back, and then think about it from three rails away.', { speaker: 'narrator', role: 'world' }),
  R('browse', 'floor', 'look.4', 'The good stuff is at eye level and the shop knows exactly what it is doing.', { speaker: 'narrator', role: 'world' }),
  R('browse', 'floor', 'handle.1', '"That one is better on than it looks on the hanger. Most of them are the other way round."', {}),
  R('browse', 'floor', 'handle.2', '"We only got four of those in. Not a sales line, we genuinely only got four."', { when: { tone: ['firm'] } }),
  R('browse', 'floor', 'handle.3', 'The assistant appears at your elbow the moment you touch it, which is either service or surveillance.', { speaker: 'narrator' }),
  R('browse', 'floor', 'handle.4', '"Good eye. That’s the one I would take home."', { when: { tone: ['warm'] } }),
  R('browse', 'floor', 'featured.1', '"That’s the one everybody is asking about. It won’t be here Saturday."', { when: { flags: ['featured'] } }),
  R('browse', 'floor', 'featured.2', 'It’s on the front table, lit from above, and there’s a reason for both of those things.', { when: { flags: ['featured'] }, speaker: 'narrator', role: 'world' }),
  R('browse', 'floor', 'dear.1', '"It’s a lot. It’s also the last one you’ll need to buy for a decade."', { when: { flags: ['dear'] } }),
  R('browse', 'floor', 'dear.2', 'You look at the tag twice, in case it changes.', { when: { flags: ['dear'] }, speaker: 'narrator', role: 'world' }),

  // --- Advice ------------------------------------------------------------------------------------
  R('advise', 'floor', 'ask.1', '"What is it for? That changes the answer completely."', { when: { move: ['ask'] } }),
  R('advise', 'floor', 'ask.2', '"Depends what you already have. Nobody needs a fourth navy one."', { when: { move: ['ask'], tone: ['dry'] } }),
  R('advise', 'floor', 'ask.3', 'The assistant asks two good questions and stops talking, which is rarer than it should be.', { when: { move: ['ask'] }, speaker: 'narrator' }),
  R('advise', 'floor', 'ask.4', '"Take the plainer one. You’ll wear it twice as often and nobody will ever ask about it."', { when: { move: ['ask'], tone: ['firm'] } }),
  R('advise', 'floor', 'push.1', '"While you’re here — the {suggestion}. Same rail, half the noise."', { when: { move: ['suggest'] } }),
  R('advise', 'floor', 'push.2', '"If you like that, you’ll like the {suggestion} more, and I’ll lose a sale saying so."', { when: { move: ['suggest'], tone: ['warm'] } }),

  // --- The fitting room ----------------------------------------------------------------------------
  R('fitting', 'room', 'in.1', '"Room three. Shout the size out and I’ll find it."', {}),
  R('fitting', 'room', 'in.2', 'A curtain that doesn’t quite meet, a hook, a mirror that has been chosen very carefully.', { speaker: 'narrator', role: 'world' }),
  R('fitting', 'room', 'in.3', '"Take two sizes in. Ours run small and I’m tired of pretending they don’t."', { when: { tone: ['dry'] } }),
  R('fitting', 'room', 'yours.1', '"Right. That’s yours. I am not going to talk you into it because I don’t have to."', { when: { result: ['yours'] } }),
  R('fitting', 'room', 'yours.2', 'You come out, and the assistant does the small nod that means the argument is over.', { when: { result: ['yours'] }, speaker: 'narrator' }),
  R('fitting', 'room', 'yours.3', '"That’s a good day. Wear it out, if you want."', { when: { result: ['yours'], tone: ['warm'] } }),
  R('fitting', 'room', 'close.1', '"It works. It doesn’t sing. Your call, and I would think about it."', { when: { result: ['close'] } }),
  R('fitting', 'room', 'close.2', 'The mirror gives you the answer you were hoping to avoid: fine, and only fine.', { when: { result: ['close'] }, speaker: 'narrator', role: 'world' }),
  R('fitting', 'room', 'size.1', '"That’s the last one, and it isn’t your size. I can ring the other branch."', { when: { result: ['wrong_size'] } }),
  R('fitting', 'room', 'size.2', 'It fastens. That’s the most generous thing that can be said about it.', { when: { result: ['wrong_size'] }, speaker: 'narrator', role: 'world' }),
  R('fitting', 'room', 'no.1', '"No. And I would rather tell you now than have it back in a fortnight."', { when: { result: ['not_you'], tone: ['firm'] } }),
  R('fitting', 'room', 'no.2', 'You look like somebody wearing a costume of a person with a better weekend.', { when: { result: ['not_you'] }, speaker: 'narrator', role: 'world' }),
  R('fitting', 'room', 'no.3', '"It’s a lovely thing. It isn’t your lovely thing."', { when: { result: ['not_you'], tone: ['warm'] } }),

  // --- The counter -----------------------------------------------------------------------------------
  R('counter', 'till', 'pay.1', '"{total}. Do you want the bag or are you being good?"', { when: { result: ['paid'] } }),
  R('counter', 'till', 'pay.2', 'Tissue paper, a folded bag, a receipt in the bottom of it. {total}.', { when: { result: ['paid'] }, speaker: 'narrator' }),
  R('counter', 'till', 'pay.3', '"{total}. Thirty days with the receipt, and keep the tags on if you aren’t sure."', { when: { result: ['paid'], tone: ['firm'] } }),
  R('counter', 'till', 'pay.4', '"That’s {total}. Enjoy it, honestly. It’s a good one."', { when: { result: ['paid'], tone: ['warm'] } }),
  R('counter', 'till', 'big.1', 'The assistant takes their time wrapping it, and it’s the taking of time you’re paying for. {total}.', { when: { result: ['paid'], flags: ['big'] }, speaker: 'narrator' }),
  R('counter', 'till', 'big.2', '"{total}. I’ll write it in the book so we know it’s yours if anything happens."', { when: { result: ['paid'], flags: ['big'] } }),
  R('counter', 'till', 'regular.1', '"Same card? Right. {total}."', { when: { result: ['paid'], flags: ['regular'] } }),
  R('counter', 'till', 'short.1', '"It hasn’t gone through. Try it again, these things sulk."', { when: { result: ['declined'] } }),
  R('counter', 'till', 'short.2', 'The reader thinks about it for a long moment and then declines to help.', { when: { result: ['declined'] }, speaker: 'narrator' }),

  // --- Leaving -----------------------------------------------------------------------------------------
  R('farewell', 'door', 'bought.1', '"See you soon."', { when: { result: ['bought'] } }),
  R('farewell', 'door', 'bought.2', 'You’re out on the street holding a bag, and the good mood lasts as far as the corner, minimum.', { when: { result: ['bought'] }, speaker: 'narrator', role: 'world' }),
  R('farewell', 'door', 'empty.1', '"No worries at all. We’re here."', { when: { result: ['empty'] } }),
  R('farewell', 'door', 'empty.2', 'You leave with nothing, which is a decision, and a cheaper one than the alternative.', { when: { result: ['empty'] }, speaker: 'narrator', role: 'world' }),
  R('farewell', 'door', 'empty.3', 'The assistant is already refolding the thing you unfolded.', { when: { result: ['empty'], tone: ['dry'] }, speaker: 'narrator' }),
];

export const RETAIL_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'greet', beat: 'door' },
    { purpose: 'greet', beat: 'door', flags: ['first'] },
    { purpose: 'greet', beat: 'door', flags: ['regular'] },
    { purpose: 'greet', beat: 'door', flags: ['luxury'] },
    { purpose: 'browse', beat: 'floor' },
    { purpose: 'browse', beat: 'floor', flags: ['featured'] },
    { purpose: 'browse', beat: 'floor', flags: ['dear'] },
    { purpose: 'advise', beat: 'floor', move: ['ask'] },
    { purpose: 'advise', beat: 'floor', move: ['suggest'] },
    { purpose: 'fitting', beat: 'room' },
    { purpose: 'fitting', beat: 'room', result: ['yours', 'close', 'wrong_size', 'not_you'] },
    { purpose: 'counter', beat: 'till', result: ['paid'] },
    { purpose: 'counter', beat: 'till', result: ['declined'] },
    { purpose: 'farewell', beat: 'door', result: ['bought', 'empty'] },
  ],
};
