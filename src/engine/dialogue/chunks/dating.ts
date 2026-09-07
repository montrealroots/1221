/**
 * Dating — what is said across a table, at the door, and when they do not come.
 *
 * Every line here is an answer to something that has already happened: a
 * move that landed or did not, a check-in where they were there or late or
 * not coming, a way of ending the evening. Voice is a condition, not a
 * roll: a warm person, a dry one and a guarded one answer the same move
 * differently. Nothing here changes anything.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'dating';
const R = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'date', ...opts });

const reply = (move: string, result: 'good' | 'flat' | 'bad', n: number, text: string, tone?: ('warm' | 'dry' | 'guarded')[]): DialogueLine =>
  R('reply', 'table', `${move}.${result}.${n}`, text, { when: { move: [move], result: [result], ...(tone ? { tone } : {}) }, speaker: 'narrator' });

const LINES: DialogueLine[] = [
  // --- Ask about them ---------------------------------------------------------
  reply('ask', 'good', 1, 'They light up, and you get the long version.'),
  reply('ask', 'good', 2, 'Nobody has asked them that in a while. They tell you.'),
  reply('ask', 'good', 3, 'They answer properly, and then ask you the same thing back.'),
  reply('ask', 'good', 4, 'They talk with their hands about it. You had not seen that before.', ['warm']),
  reply('ask', 'good', 5, 'They give you the story with the good ending, then the true one.', ['dry']),
  reply('ask', 'good', 6, 'They check your face to see if you mean it, and then they tell you.', ['guarded']),
  reply('ask', 'flat', 1, 'They give you the short version.'),
  reply('ask', 'flat', 2, 'A polite answer. The subject does not catch.'),
  reply('ask', 'flat', 3, 'They tell you, and the conversation waits for the next thing.'),
  reply('ask', 'bad', 1, 'Wrong question. Something closes behind their eyes for a moment.'),
  reply('ask', 'bad', 2, 'They answer, and you can tell they have answered it too many times.'),
  reply('ask', 'bad', 3, '"Why do you ask?" It is not a question.', ['guarded']),

  // --- Tell them something about you -----------------------------------------
  reply('share', 'good', 1, 'They lean in. That was the right thing to give them.'),
  reply('share', 'good', 2, 'They laugh in the right place and remember a thing of their own.'),
  reply('share', 'good', 3, 'You can see them file it away. In a good way.'),
  reply('share', 'good', 4, '"I did not know that about you." They sound pleased to.', ['warm']),
  reply('share', 'good', 5, 'They raise an eyebrow and say "go on", and mean it.', ['dry']),
  reply('share', 'flat', 1, 'They nod. It lands somewhere, but not far.'),
  reply('share', 'flat', 2, 'A story that was better in your head.'),
  reply('share', 'flat', 3, 'They are listening; they are just not sure why you told them that.'),
  reply('share', 'bad', 1, 'Too much, too early. They look at their glass.'),
  reply('share', 'bad', 2, 'You hear it as you say it, and so do they.'),
  reply('share', 'bad', 3, 'They say "right", the way people say it when they have stopped listening.', ['dry']),

  // --- Let them talk -----------------------------------------------------------
  reply('listen', 'good', 1, 'They talk, and then talk some more, and then catch themselves and grin.'),
  reply('listen', 'good', 2, 'Given the room, they say something they had not planned to.'),
  reply('listen', 'good', 3, 'You learn three things. One of them matters.'),
  reply('listen', 'good', 4, 'They notice you have not interrupted, and say so, and keep going.', ['guarded']),
  reply('listen', 'flat', 1, 'They talk for a while about nothing in particular.'),
  reply('listen', 'flat', 2, 'A comfortable silence, then a small story.'),
  reply('listen', 'flat', 3, 'You listen. It is fine.'),
  reply('listen', 'bad', 1, 'They run out of things to say and you have nothing ready.'),
  reply('listen', 'bad', 2, 'The quiet gets long. They check the time.'),

  // --- Make them laugh ---------------------------------------------------------
  reply('joke', 'good', 1, 'They laugh — properly, head back.'),
  reply('joke', 'good', 2, 'They laugh and then say you should not have said that, and laugh again.'),
  reply('joke', 'good', 3, 'It lands. They steal the punchline for later.'),
  reply('joke', 'good', 4, 'They come back with a better one. It is going to be that kind of night.', ['dry']),
  reply('joke', 'flat', 1, 'A smile. Not a laugh.'),
  reply('joke', 'flat', 2, 'They get it. That is all.'),
  reply('joke', 'flat', 3, 'Half a laugh, out of kindness.', ['warm']),
  reply('joke', 'bad', 1, 'It does not land. The silence is the joke now.'),
  reply('joke', 'bad', 2, 'They do the face people do when they are deciding whether you meant it.'),

  // --- Flirt a little ----------------------------------------------------------
  reply('flirt', 'good', 1, 'They hold your eye a beat longer than they need to.'),
  reply('flirt', 'good', 2, 'They flirt back, better than you did.'),
  reply('flirt', 'good', 3, 'Something in the air changes and neither of you mentions it.'),
  reply('flirt', 'good', 4, 'They say "careful" and do not mean it at all.', ['dry']),
  reply('flirt', 'flat', 1, 'They smile and change the subject, gently.'),
  reply('flirt', 'flat', 2, 'Noted, not returned. Not refused either.'),
  reply('flirt', 'bad', 1, 'Too soon. They sit back a little.'),
  reply('flirt', 'bad', 2, 'They laugh it off and the temperature drops a degree.'),

  // --- Say something true ------------------------------------------------------
  reply('deep', 'good', 1, 'They go quiet, then say something true back. That is the evening now.'),
  reply('deep', 'good', 2, 'They put their glass down. "Say that again."'),
  reply('deep', 'good', 3, 'It lands where it was aimed. They take your hand for a second.'),
  reply('deep', 'good', 4, 'They do not answer for a while, and then they do, and it costs them something.', ['guarded']),
  reply('deep', 'flat', 1, 'They hear it. They are not ready to answer it.'),
  reply('deep', 'flat', 2, 'A long pause, then something safe.'),
  reply('deep', 'bad', 1, 'Too heavy for the table you are at. They look for the waiter.'),
  reply('deep', 'bad', 2, 'They say "wow", and not the good kind.'),

  // --- Talk about the work -----------------------------------------------------
  reply('work', 'good', 1, 'Turns out they have opinions about the business, and good ones.'),
  reply('work', 'good', 2, 'They ask the sharp question, and you realize you like being asked it.'),
  reply('work', 'good', 3, 'Shop talk, but the kind that turns into something else.'),
  reply('work', 'flat', 1, 'They ask a polite question about it. You answer. That is that.'),
  reply('work', 'flat', 2, 'They know the names. They do not care about the names.'),
  reply('work', 'bad', 1, 'You have been talking about work for eleven minutes. They have counted.'),
  reply('work', 'bad', 2, 'They glaze. Politely, but they glaze.'),

  // --- Another round -----------------------------------------------------------
  reply('order', 'good', 1, 'Another round, and the evening gets its second wind.'),
  reply('order', 'good', 2, 'They say they should not, and then they do.'),
  reply('order', 'flat', 1, 'Another round. The conversation carries on where it was.'),
  reply('order', 'flat', 2, 'Drinks arrive. Nothing changes but the glasses.'),
  reply('order', 'bad', 1, 'They cover their glass. "I am fine, actually."'),
  reply('order', 'bad', 2, 'One too many. You can feel the evening tilt.'),

  // --- Your phone ---------------------------------------------------------------
  reply('phone', 'good', 1, 'You glance down. They are gracious about it. Once.'),
  reply('phone', 'flat', 1, 'You check it. They wait. Something is spent.'),
  reply('phone', 'bad', 1, 'They see you look, and see you look again, and stop talking until you look up.'),
  reply('phone', 'bad', 2, '"Anything important?" It was not.'),

  // --- Color: a second sentence in their voice ---------------------------------
  R('colour', 'table', 'warm.good.1', 'They are easy to be with.', { when: { tone: ['warm'], result: ['good'] }, speaker: 'narrator' }),
  R('colour', 'table', 'warm.good.2', 'They make it easy.', { when: { tone: ['warm'], result: ['good'] }, speaker: 'narrator' }),
  R('colour', 'table', 'warm.flat.1', 'They are kind about it.', { when: { tone: ['warm'], result: ['flat'] }, speaker: 'narrator' }),
  R('colour', 'table', 'warm.bad.1', 'They are kind about it, which is worse.', { when: { tone: ['warm'], result: ['bad'] }, speaker: 'narrator' }),
  R('colour', 'table', 'dry.good.1', 'They have a line for it, and it is a good one.', { when: { tone: ['dry'], result: ['good'] }, speaker: 'narrator' }),
  R('colour', 'table', 'dry.good.2', 'They are funnier than you expected.', { when: { tone: ['dry'], result: ['good'] }, speaker: 'narrator' }),
  R('colour', 'table', 'dry.flat.1', 'A dry remark. Fair.', { when: { tone: ['dry'], result: ['flat'] }, speaker: 'narrator' }),
  R('colour', 'table', 'dry.bad.1', 'The remark they make about it is very dry indeed.', { when: { tone: ['dry'], result: ['bad'] }, speaker: 'narrator' }),
  R('colour', 'table', 'guarded.good.1', 'They open a door they usually keep shut.', { when: { tone: ['guarded'], result: ['good'] }, speaker: 'narrator' }),
  R('colour', 'table', 'guarded.good.2', 'That is more than they give most people.', { when: { tone: ['guarded'], result: ['good'] }, speaker: 'narrator' }),
  R('colour', 'table', 'guarded.flat.1', 'They keep something back.', { when: { tone: ['guarded'], result: ['flat'] }, speaker: 'narrator' }),
  R('colour', 'table', 'guarded.bad.1', 'The shutters come down, gently.', { when: { tone: ['guarded'], result: ['bad'] }, speaker: 'narrator' }),

  // --- The check-in ---------------------------------------------------------------
  R('checkin', 'door', 'there.1', '{first} is there first. {opener}', { when: { result: ['there'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'there.2', '{first} is at the table already, and has ordered you water. {opener}', { when: { result: ['there'], tone: ['warm'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'there.3', '{first} is there first and does not get up, and grins. {opener}', { when: { result: ['there'], tone: ['dry'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'late.1', '{first} is {late} minutes late and apologises twice. {opener}', { when: { result: ['late'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'late.2', '{first} arrives {late} minutes late, out of breath, with a story. {opener}', { when: { result: ['late'], tone: ['warm', 'dry'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'late.3', '{first} is {late} minutes late and says so once, flatly. {opener}', { when: { result: ['late'], tone: ['guarded'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'no_show.1', 'Half an hour. Then the message.', { when: { result: ['no_show'] }, speaker: 'narrator' }),
  R('checkin', 'door', 'no_show.2', 'Thirty minutes of looking at the door. Then your phone.', { when: { result: ['no_show'] }, speaker: 'narrator' }),
  R('checkin', 'message', 'no_show.1', 'I am so sorry. Something came up. Let me make it up to you.', { when: { result: ['no_show'] } }),
  R('checkin', 'message', 'no_show.2', 'I could not get away. I am sorry. Next one is on me, properly.', { when: { result: ['no_show'], tone: ['warm'] } }),
  R('checkin', 'message', 'no_show.3', 'Bad day. Not your fault. I owe you an evening.', { when: { result: ['no_show'], tone: ['dry', 'guarded'] } }),

  // --- The door ----------------------------------------------------------------------
  R('close', 'door', 'walk.1', '{first} walks slower than they need to.', { when: { move: ['walk'] }, speaker: 'narrator' }),
  R('close', 'door', 'walk.2', 'Twenty minutes of streets and neither of you hurries.', { when: { move: ['walk'] }, speaker: 'narrator' }),
  R('close', 'door', 'walk.3', 'At the door {first} says thank you like they mean it.', { when: { move: ['walk'] }, speaker: 'narrator' }),
  R('close', 'door', 'kiss.yes.1', 'They kiss you back.', { when: { move: ['kiss'], result: ['accepted'] }, speaker: 'narrator' }),
  R('close', 'door', 'kiss.yes.2', 'Yes. That answers that.', { when: { move: ['kiss'], result: ['accepted'] }, speaker: 'narrator' }),
  R('close', 'door', 'kiss.no.1', 'They turn their cheek, kindly. "Not tonight."', { when: { move: ['kiss'], result: ['declined'] }, speaker: 'narrator' }),
  R('close', 'door', 'kiss.no.2', 'A hand on your chest. "Not yet."', { when: { move: ['kiss'], result: ['declined'] }, speaker: 'narrator' }),
  R('close', 'door', 'call.1', '"Do." {first} means it.', { when: { move: ['call'] }, speaker: 'narrator' }),
  R('close', 'door', 'call.2', '"You had better."', { when: { move: ['call'] } }),
  R('close', 'door', 'call.3', '"I will believe it when the phone goes."', { when: { move: ['call'], tone: ['dry', 'guarded'] } }),
  R('close', 'door', 'again.1', '"I would like that." {first} lets you arrange it.', { when: { move: ['again'] }, speaker: 'narrator' }),
  R('close', 'door', 'again.2', '"Yes. You pick the place."', { when: { move: ['again'] } }),
  R('close', 'door', 'again.3', '"Somewhere with better lighting."', { when: { move: ['again'], tone: ['dry'] } }),
  R('close', 'door', 'night.1', 'You thank them. They thank you. A cab each.', { when: { move: ['night'] }, speaker: 'narrator' }),
  R('close', 'door', 'night.2', '{first} says goodnight at the curb.', { when: { move: ['night'] }, speaker: 'narrator' }),

];

export const DATING_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'reply', beat: 'table', move: ['ask', 'share', 'listen', 'joke', 'flirt', 'deep', 'work', 'order', 'phone'], result: ['good', 'flat', 'bad'] },
    { purpose: 'colour', beat: 'table', tone: ['warm', 'dry', 'guarded'], result: ['good', 'flat', 'bad'] },
    { purpose: 'checkin', beat: 'door', result: ['there', 'late', 'no_show'] },
    { purpose: 'checkin', beat: 'message', result: ['no_show'] },
    { purpose: 'close', beat: 'door', move: ['walk', 'call', 'again', 'night'] },
    { purpose: 'close', beat: 'door', move: ['kiss'], result: ['accepted', 'declined'] },
  ],
};
