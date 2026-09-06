/**
 * Work — the agent, the room, the set, the note, the call that comes after.
 *
 * Every studio, network and award body named in the game is real and named as
 * public record; every project, every meeting and every line in this file is
 * SLATE's own. Nobody real is quoted and nothing here reports a real person's
 * conduct. These are the words the industry uses, not the words anybody said.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'work';
const K = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'industry', ...opts });

const LINES: DialogueLine[] = [
  // --- The agent -----------------------------------------------------------------------------------------
  K('agent', 'call', 'good.1', '"They came back. They came back fast, which is the part I want you to hear."', { when: { result: ['good'] } }),
  K('agent', 'call', 'good.2', '"Offer. No audition, no chemistry read, straight offer. Sit down."', { when: { result: ['good'] } }),
  K('agent', 'call', 'good.3', 'Your agent rings at ten past seven in the morning, which they only do for one reason.', { when: { result: ['good'] }, speaker: 'narrator' }),
  K('agent', 'call', 'good.4', '"I am going to read you the number and then I am going to be quiet for a second."', { when: { result: ['good'], tone: ['dry'] } }),
  K('agent', 'call', 'good.5', '"They loved you. Genuinely loved you. Now the boring part starts."', { when: { result: ['good'], tone: ['warm'] } }),
  K('agent', 'call', 'flat.1', '"Nothing today. That is not a bad thing, it is a Tuesday."', { when: { result: ['flat'] } }),
  K('agent', 'call', 'flat.2', '"Still out. I have chased twice and I am not chasing a third time this week."', { when: { result: ['flat'] } }),
  K('agent', 'call', 'flat.3', '"Two things I like, one thing I do not, and a conversation I want to have in person."', { when: { result: ['flat'] } }),
  K('agent', 'call', 'bad.1', '"They went another way. They will not say which way and I am not going to ask."', { when: { result: ['bad'] } }),
  K('agent', 'call', 'bad.2', '"It is a no. It is a no on the shape of the part, not on you, and I know how that sounds."', { when: { result: ['bad'], tone: ['warm'] } }),
  K('agent', 'call', 'bad.3', '"Passed. Next one is Thursday. That is the whole conversation."', { when: { result: ['bad'], tone: ['firm'] } }),
  K('agent', 'call', 'bad.4', 'Nobody rings. That is the answer, and it arrives over about four days.', { when: { result: ['bad'] }, speaker: 'narrator' }),
  K('agent', 'call', 'warn.1', '"Before you say yes: read the third act again and then tell me you still want it."', { when: { move: ['warn'] } }),
  K('agent', 'call', 'warn.2', '"The money is very good and there is a reason the money is very good."', { when: { move: ['warn'], tone: ['dry'] } }),
  K('agent', 'call', 'warn.3', '"You can do this one. I am asking whether you should."', { when: { move: ['warn'] } }),
  K('agent', 'call', 'push.1', '"Take the meeting. You do not have to take the job, you have to take the meeting."', { when: { move: ['push'] } }),
  K('agent', 'call', 'push.2', '"This is the one that makes the next three possible. That is my whole argument."', { when: { move: ['push'], tone: ['firm'] } }),

  // --- The room -------------------------------------------------------------------------------------------
  K('room', 'audition', 'open.1', '"Whenever you are ready. Take your time; the camera has all day."', { role: 'casting' }),
  K('room', 'audition', 'open.2', 'Three people behind a table, one of whom is definitely reading email.', { speaker: 'narrator', role: 'casting' }),
  K('room', 'audition', 'open.3', '"Tell me nothing about it. Just do it and we will talk after."', { role: 'casting' }),
  K('room', 'audition', 'open.4', 'A folding chair, a taped X, and a reader with the emotional range of a parking notice.', { speaker: 'narrator', role: 'casting' }),
  K('room', 'audition', 'note.1', '"Same again, but she already knows what he is going to say."', { role: 'casting' }),
  K('room', 'audition', 'note.2', '"Half of that. You are playing the ending in the first line."', { role: 'casting', when: { tone: ['firm'] } }),
  K('room', 'audition', 'note.3', '"Try it like the funniest thing in the world has just happened somewhere off screen."', { role: 'casting' }),
  K('room', 'audition', 'note.4', '"Do not act the exhaustion. Be exhausted and then try to hide it."', { role: 'casting' }),
  K('room', 'audition', 'note.5', 'They ask for it faster. It is not about faster and both of you know that.', { speaker: 'narrator', role: 'casting' }),
  K('room', 'audition', 'good.1', '"That is what we have been waiting all day for. Thank you."', { when: { result: ['good'] }, role: 'casting' }),
  K('room', 'audition', 'good.2', 'Somebody at the table writes something down properly, with intent, and underlines it.', { when: { result: ['good'] }, speaker: 'narrator', role: 'casting' }),
  K('room', 'audition', 'good.3', '"Can you stay ten minutes? I want the director to see that."', { when: { result: ['good'] }, role: 'casting' }),
  K('room', 'audition', 'flat.1', '"Great, thank you so much." The most information-free sentence in the industry.', { when: { result: ['flat'] }, speaker: 'narrator', role: 'casting' }),
  K('room', 'audition', 'flat.2', '"Lovely. We have got everything we need."', { when: { result: ['flat'] }, role: 'casting' }),
  K('room', 'audition', 'bad.1', 'The reader looks at the page when there is no line on the page. You lost it in the second beat and you know exactly where.', { when: { result: ['bad'] }, speaker: 'narrator', role: 'casting' }),
  K('room', 'audition', 'bad.2', '"Thanks. Send in whoever is next."', { when: { result: ['bad'], tone: ['guarded'] }, role: 'casting' }),
  K('room', 'audition', 'self_tape.1', 'Fourteen takes. You send the second one.', { when: { flags: ['self_tape'] }, speaker: 'narrator' }),
  K('room', 'audition', 'self_tape.2', 'A bedsheet on a wall, a lamp from the hall, and a friend reading opposite you badly and lovingly.', { when: { flags: ['self_tape'] }, speaker: 'narrator' }),

  // --- The meeting -------------------------------------------------------------------------------------------
  K('meeting', 'office', 'general.1', '"We do not have anything for you. We wanted to be in a room with you, which is worth more."', { role: 'executive' }),
  K('meeting', 'office', 'general.2', 'Water in a glass bottle, a bowl of things nobody eats, and forty minutes of being liked.', { speaker: 'narrator', role: 'executive' }),
  K('meeting', 'office', 'general.3', '"What do you want to make? Not what do you think we want. What keeps you up."', { role: 'executive' }),
  K('meeting', 'office', 'pitch.1', '"Give me the version in one sentence, and then give me the version in ten minutes."', { role: 'executive', when: { move: ['pitch'] } }),
  K('meeting', 'office', 'pitch.2', 'You get to the second act turn and somebody uncrosses their legs and leans in.', { when: { move: ['pitch'], result: ['good'] }, speaker: 'narrator', role: 'executive' }),
  K('meeting', 'office', 'pitch.3', '"I love it. I cannot buy it. Both of those are true and I am sorry about the second one."', { when: { move: ['pitch'], result: ['flat'] }, role: 'executive' }),
  K('meeting', 'office', 'pitch.4', '"Who else is out with this?" Which is a question about time, not about the film.', { when: { move: ['pitch'], result: ['good'] }, role: 'executive' }),
  K('meeting', 'office', 'pitch.5', 'Somebody checks their phone at the eight minute mark and it is over, whatever gets said after.', { when: { move: ['pitch'], result: ['bad'] }, speaker: 'narrator', role: 'executive' }),
  K('meeting', 'office', 'note.1', '"One note. Not a small one. The whole thing hangs on a decision she makes off screen and we never see her make it."', { role: 'executive' }),
  K('meeting', 'office', 'note.2', '"Can she be more likeable?" — the note that has ended more good scripts than any other.', { speaker: 'narrator', role: 'executive' }),
  K('meeting', 'office', 'note.3', '"Cheaper. Not smaller. Cheaper."', { role: 'executive', when: { tone: ['firm'] } }),
  K('meeting', 'office', 'note.4', '"We are going to need a name in one of these two parts and I think you know which."', { role: 'executive' }),

  // --- On the day -------------------------------------------------------------------------------------------
  K('set', 'day', 'call.1', 'Five in the morning, a paper cup, and a base camp in a car park with a view of a retail unit.', { speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'call.2', '"You are in the chair at half five and on set at seven. It will be eight."', { role: 'crew' }),
  K('set', 'day', 'call.3', 'The second AD finds you before you have finished the first coffee, which is their whole gift.', { speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'rehearse.1', '"Let us walk it once for the camera and once for us, and they are different walks."', { role: 'director' }),
  K('set', 'day', 'rehearse.2', 'The director watches the rehearsal from beside the lens rather than the monitor, which tells you what kind of day it is.', { speaker: 'narrator', role: 'director' }),
  K('set', 'day', 'take.1', '"Lovely. Again, and this time do not help me."', { when: { result: ['good'] }, role: 'director' }),
  K('set', 'day', 'take.2', '"That is the take. We will do one more for the insurance and then move on."', { when: { result: ['good'] }, role: 'director' }),
  K('set', 'day', 'take.3', 'Something lands in the fourth take that was not in the first three and everybody on the floor feels it at once.', { when: { result: ['good'] }, speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'take.4', '"Going again. Sound had a plane."', { when: { result: ['flat'] }, role: 'crew' }),
  K('set', 'day', 'take.5', 'Take eleven. Nobody has said why. The gaffer is looking at the sky.', { when: { result: ['flat'] }, speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'take.6', '"Let us try one where you do not do the thing with your hand."', { when: { result: ['bad'] }, role: 'director' }),
  K('set', 'day', 'take.7', 'Fourteen takes on a line of six words, and by the ninth it has stopped meaning anything to anybody.', { when: { result: ['bad'] }, speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'wait.1', 'Two hours in a trailer that smells of new carpet, learning tomorrow’s pages you will not shoot.', { when: { flags: ['waiting'] }, speaker: 'narrator', role: 'world' }),
  K('set', 'day', 'wait.2', '"Turning around. It is a big turnaround. Go and have your lunch."', { when: { flags: ['waiting'] }, role: 'crew' }),
  K('set', 'day', 'wrap.1', '"That is a wrap on the day. Thank you, everybody, genuinely."', { when: { result: ['wrapped'] }, role: 'crew' }),
  K('set', 'day', 'wrap.2', 'Somebody claps and everybody else joins in a beat late, and it means it anyway.', { when: { result: ['wrapped'] }, speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'wrap.3', '"That is a wrap on you." A hundred people applaud and you have to say something and you have not thought of it.', { when: { result: ['wrapped'], flags: ['final'] }, role: 'crew' }),
  K('set', 'day', 'night.1', 'Night shoots, day four, and the crew have started communicating mostly in gesture.', { when: { flags: ['nights'] }, speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'night.2', 'The sun is coming up and there are two more setups and everybody is doing sums.', { when: { flags: ['nights'] }, speaker: 'narrator', role: 'crew' }),
  K('set', 'day', 'weather.1', 'Rain that is not in the script. The whole unit moves indoors in eleven minutes, which is genuinely impressive.', { when: { flags: ['weather'] }, speaker: 'narrator', role: 'crew' }),

  // --- The aftermath ---------------------------------------------------------------------------------------------
  K('after', 'cut', 'good.1', '"It is working. I am not going to say more than that until you have seen it."', { when: { result: ['good'] }, role: 'director' }),
  K('after', 'cut', 'good.2', 'You watch yourself for ninety minutes and forget it is you twice, which is the highest score available.', { when: { result: ['good'] }, speaker: 'narrator' }),
  K('after', 'cut', 'flat.1', '"It is fine. Fine is the problem."', { when: { result: ['flat'], tone: ['dry'] }, role: 'director' }),
  K('after', 'cut', 'flat.2', 'The scene you were proudest of is gone. Nobody mentions it and you are not going to be the one who does.', { when: { result: ['flat'] }, speaker: 'narrator' }),
  K('after', 'cut', 'bad.1', '"They have recut it. I do not know what to tell you."', { when: { result: ['bad'] }, role: 'industry' }),
  K('after', 'cut', 'bad.2', 'A test screening card in somebody’s hand, face down, being deliberately not shown to you.', { when: { result: ['bad'] }, speaker: 'narrator' }),
  K('after', 'press', 'junket.1', 'Forty interviews in a day, the same four questions, and by lunchtime you have three answers you are proud of and one you are not.', { speaker: 'narrator' }),
  K('after', 'press', 'junket.2', '"Last one, and then they want you for the international feed."', { role: 'crew' }),
  K('after', 'press', 'premiere.1', 'A line of photographers, all shouting one syllable, and a publicist steering you by the elbow at exactly the right speed.', { speaker: 'narrator' }),
  K('after', 'press', 'premiere.2', 'The film plays and the laugh you were unsure about lands, and you hear yourself exhale.', { speaker: 'narrator' }),
  K('after', 'press', 'review.1', 'Two paragraphs about the film and one sentence about you, and you read the sentence eleven times.', { speaker: 'narrator' }),
  K('after', 'press', 'review.2', '"Do not read them. You are going to read them. Read them on Thursday, not tonight."', { role: 'industry' }),
];

export const WORK_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'agent', beat: 'call', result: ['good', 'flat', 'bad'] },
    { purpose: 'agent', beat: 'call', move: ['warn', 'push'] },
    { purpose: 'room', beat: 'audition' },
    { purpose: 'room', beat: 'audition', result: ['good', 'flat', 'bad'] },
    { purpose: 'room', beat: 'audition', flags: ['self_tape'] },
    { purpose: 'meeting', beat: 'office' },
    { purpose: 'meeting', beat: 'office', move: ['pitch'] },
    { purpose: 'set', beat: 'day' },
    { purpose: 'set', beat: 'day', result: ['good', 'flat', 'bad', 'wrapped'] },
    { purpose: 'after', beat: 'cut', result: ['good', 'flat', 'bad'] },
    { purpose: 'after', beat: 'press' },
  ],
};
