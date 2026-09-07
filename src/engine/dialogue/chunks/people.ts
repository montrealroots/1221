/**
 * People — friends, family, the ones you owe a call, and the small talk that
 * holds all of it together.
 *
 * Every person in a save is SLATE's own. These are the words relationships
 * are actually conducted in: the check-in, the favor, the apology, the row,
 * the long silence and the one who always answers.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'people';
const P = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'friend', ...opts });

const LINES: DialogueLine[] = [
  // --- Small talk ------------------------------------------------------------------------------------------
  P('smalltalk', 'open', 'warm.1', '"There you are. I was about to send a search party and then I remembered you never answer."', { when: { tone: ['warm'] } }),
  P('smalltalk', 'open', 'warm.2', '"You look well. Genuinely, not the thing people say."', { when: { tone: ['warm'] } }),
  P('smalltalk', 'open', 'warm.3', '"Sit down, I have got about nine things to tell you and one of them is important."', { when: { tone: ['warm'] } }),
  P('smalltalk', 'open', 'dry.1', '"Alive, then."', { when: { tone: ['dry'] } }),
  P('smalltalk', 'open', 'dry.2', '"I assumed you had moved. Nobody said. I just assumed."', { when: { tone: ['dry'] } }),
  P('smalltalk', 'open', 'guarded.1', '"Hello." A pause with a shape to it.', { when: { tone: ['guarded'] } }),
  P('smalltalk', 'open', 'guarded.2', 'They are pleased to see you and something is sitting behind it, unstated.', { when: { tone: ['guarded'] }, speaker: 'narrator' }),
  P('smalltalk', 'open', 'firm.1', '"Good. I wanted to talk to you anyway."', { when: { tone: ['firm'] } }),
  P('smalltalk', 'open', 'plain.1', '"How have you been? And the real answer, not the one for the room."', {}),
  P('smalltalk', 'open', 'plain.2', 'The first five minutes are weather and traffic, because that is what the first five minutes are for.', { speaker: 'narrator' }),
  P('smalltalk', 'open', 'plain.3', '"Right. Catch me up."', {}),
  P('smalltalk', 'open', 'long.1', '"It has been what, a year? Do not answer that."', { when: { requires: ['distant'] } }),
  P('smalltalk', 'open', 'long.2', 'You pick up in the middle of a conversation that stopped eight months ago, which is the whole test of a friendship.', { when: { requires: ['distant'] }, speaker: 'narrator' }),

  // --- Asking after --------------------------------------------------------------------------------------------
  P('ask', 'catch', 'work.1', '"Is it going? And do not do the thing where you say it is going."', {}),
  P('ask', 'catch', 'work.2', '"I saw the thing. I actually watched it, all of it, on purpose."', { when: { flags: ['public'] } }),
  P('ask', 'catch', 'work.3', '"Everyone keeps sending me pictures of you. It is a strange way to keep up with a friend."', { when: { flags: ['famous'], tone: ['dry'] } }),
  P('ask', 'catch', 'health.1', '"You look tired. That is not a criticism, it is a question."', {}),
  P('ask', 'catch', 'health.2', '"Are you sleeping? Actual sleeping, not lying down near a phone."', { when: { tone: ['warm'] } }),
  P('ask', 'catch', 'love.1', '"Is there anybody? You can say no, I am not going to do a face."', {}),
  P('ask', 'catch', 'love.2', 'They ask, and then they do the face.', { speaker: 'narrator', when: { tone: ['dry'] } }),
  P('ask', 'catch', 'money.1', '"Are you all right for money? I am asking properly."', { when: { tone: ['warm'] } }),
  P('ask', 'catch', 'money.2', '"I am not going to ask what you got paid. I am going to sit here until you tell me."', { when: { tone: ['dry'] } }),

  // --- The favor -------------------------------------------------------------------------------------------------
  P('favour', 'ask', 'small.1', '"Can I ask you something and you can absolutely say no?"', {}),
  P('favour', 'ask', 'small.2', '"Two hours on Saturday. That is the whole ask."', {}),
  P('favour', 'ask', 'big.1', 'They take a breath before they say it, which tells you the size of it before the words do.', { when: { flags: ['big'] }, speaker: 'narrator' }),
  P('favour', 'ask', 'big.2', '"I would not ask if there was anybody else I could ask."', { when: { flags: ['big'] } }),
  P('favour', 'ask', 'work.1', '"Would you read something? Ten pages. You can be brutal, I would prefer brutal."', { when: { flags: ['work'] } }),
  P('favour', 'ask', 'work.2', '"Could you put a name to it? Just the name, you do not have to do anything else."', { when: { flags: ['work'] } }),
  P('favour', 'yes', 'glad.1', '"Thank you. I mean it, and I will stop saying it now."', { when: { result: ['accepted'] } }),
  P('favour', 'yes', 'glad.2', 'The relief comes off them like heat.', { when: { result: ['accepted'] }, speaker: 'narrator' }),
  P('favour', 'no', 'fine.1', '"That is completely fine. I said you could say no and I meant it."', { when: { result: ['refused'], tone: ['warm'] } }),
  P('favour', 'no', 'fine.2', '"Right. No, that is fair." It is not entirely fair to them and both of you leave it there.', { when: { result: ['refused'] }, speaker: 'narrator' }),
  P('favour', 'no', 'cold.1', '"Sure." One syllable doing an enormous amount of work.', { when: { result: ['refused'], tone: ['guarded'] } }),

  // --- Owing and being owed ------------------------------------------------------------------------------------------
  P('owe', 'raise', 'gentle.1', '"You said you would call. You did not call. That is the entire complaint."', { when: { tone: ['warm'] } }),
  P('owe', 'raise', 'gentle.2', '"I am not upset. I am doing the thing where I say I am not upset."', { when: { tone: ['dry'] } }),
  P('owe', 'raise', 'sharp.1', '"You missed it. You knew the date and you missed it."', { when: { tone: ['firm'] } }),
  P('owe', 'raise', 'sharp.2', 'They do not raise their voice, which is worse.', { when: { tone: ['firm'] }, speaker: 'narrator' }),
  P('owe', 'raise', 'quiet.1', 'They mention it once, lightly, and then change the subject before you can answer, which means it mattered.', { speaker: 'narrator' }),
  P('sorry', 'repair', 'accept.1', '"All right. Do not do it again and we are fine."', { when: { result: ['accepted'] } }),
  P('sorry', 'repair', 'accept.2', 'A shrug, a top-up of the glass, and the subject genuinely closed.', { when: { result: ['accepted'] }, speaker: 'narrator' }),
  P('sorry', 'repair', 'accept.3', '"I know. I know you are. That was never the bit I was stuck on."', { when: { result: ['accepted'], tone: ['warm'] } }),
  P('sorry', 'repair', 'partial.1', '"Thank you for saying it." Which is not the same as it being over.', { when: { result: ['partial'] }, speaker: 'narrator' }),
  P('sorry', 'repair', 'partial.2', '"Give me a bit. Not for ever, just a bit."', { when: { result: ['partial'] } }),
  P('sorry', 'repair', 'refused.1', '"I do not want an apology, I want you to have done it differently, and you cannot give me that."', { when: { result: ['refused'], tone: ['firm'] } }),
  P('sorry', 'repair', 'refused.2', 'They hear you out and then say they have to go, and they did not have to go.', { when: { result: ['refused'] }, speaker: 'narrator' }),

  // --- The row --------------------------------------------------------------------------------------------------------
  P('row', 'argue', 'open.1', '"Say the thing you have been not saying for an hour."', { when: { tone: ['firm'] } }),
  P('row', 'argue', 'open.2', 'It starts over something with no weight in it at all, which is how these always start.', { speaker: 'narrator' }),
  P('row', 'argue', 'heat.1', '"That is not what I said and you know it is not what I said."', {}),
  P('row', 'argue', 'heat.2', 'Two people talking at once, neither listening, both entirely certain.', { speaker: 'narrator' }),
  P('row', 'argue', 'heat.3', '"Fine. Great. Brilliant." Three words, none of them meaning any of those things.', {}),
  P('row', 'argue', 'cool.1', 'The temperature drops and what is left is the actual disagreement, which is smaller and harder.', { speaker: 'narrator' }),
  P('row', 'argue', 'cool.2', '"I do not want to do this. Can we not do this."', { when: { tone: ['warm'] } }),
  P('row', 'argue', 'end.1', 'Nothing is resolved. Everybody is tired. That is the end of it for tonight.', { when: { result: ['unresolved'] }, speaker: 'narrator' }),
  P('row', 'argue', 'end.2', '"I am going to go before I say something I have to apologize for on Thursday."', { when: { result: ['unresolved'] } }),

  // --- Family ---------------------------------------------------------------------------------------------------------
  P('family', 'call', 'parent.1', '"You never ring. I am not complaining, I am observing."', { when: { flags: ['parent'] } }),
  P('family', 'call', 'parent.2', 'Forty minutes about a neighbor you have never met, and you would not trade it.', { when: { flags: ['parent'] }, speaker: 'narrator' }),
  P('family', 'call', 'parent.3', '"Are you eating? Properly, not out of a box."', { when: { flags: ['parent'], tone: ['warm'] } }),
  P('family', 'call', 'parent.4', '"Somebody at the shop said they saw you on the television. I said that will be him."', { when: { flags: ['parent', 'famous'] } }),
  P('family', 'call', 'sibling.1', '"You are going to have to talk to them, you know. Not me. You."', { when: { flags: ['sibling'] } }),
  P('family', 'call', 'sibling.2', '"I am not doing Christmas on my own again. That is all I am saying."', { when: { flags: ['sibling'], tone: ['dry'] } }),
  P('family', 'call', 'child.1', 'A drawing held up to a camera, upside down, of something you will guess wrong.', { when: { flags: ['child'] }, speaker: 'narrator' }),
  P('family', 'call', 'child.2', '"When are you coming back?" — asked in the way only somebody small can ask it.', { when: { flags: ['child'] } }),
  P('family', 'call', 'distance.1', 'Five time zones and a bad line, and neither of you willing to be the one who hangs up.', { when: { flags: ['away'] }, speaker: 'narrator' }),

  // --- Going ------------------------------------------------------------------------------------------------------------
  P('leave', 'goodbye', 'warm.1', '"Do not leave it so long. I am saying that as an instruction."', { when: { tone: ['warm'] } }),
  P('leave', 'goodbye', 'warm.2', 'A hug that goes on a second longer than the standard, which is the whole message.', { when: { tone: ['warm'] }, speaker: 'narrator' }),
  P('leave', 'goodbye', 'plain.1', '"Right. Go on, you will miss it."', {}),
  P('leave', 'goodbye', 'plain.2', 'You both say you will do this again soon and one of you will make it happen.', { speaker: 'narrator' }),
  P('leave', 'goodbye', 'cool.1', '"Safe home." Correct, complete, and about four degrees below where it started.', { when: { tone: ['guarded'] } }),
  P('leave', 'goodbye', 'cool.2', 'They wave from the door and are back inside before you have reached the gate.', { when: { tone: ['guarded'] }, speaker: 'narrator' }),
];

export const PEOPLE_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'smalltalk', beat: 'open' },
    { purpose: 'ask', beat: 'catch' },
    { purpose: 'favour', beat: 'ask' },
    { purpose: 'favour', beat: 'yes', result: ['accepted'] },
    { purpose: 'favour', beat: 'no', result: ['refused'] },
    { purpose: 'owe', beat: 'raise' },
    { purpose: 'sorry', beat: 'repair', result: ['accepted', 'partial', 'refused'] },
    { purpose: 'row', beat: 'argue' },
    { purpose: 'row', beat: 'argue', result: ['unresolved'] },
    ...['parent', 'sibling', 'child'].map((f) => ({ purpose: 'family', beat: 'call', flags: [f] })),
    { purpose: 'leave', beat: 'goodbye' },
  ],
};
