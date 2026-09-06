/**
 * Dining — the door, the wait, the table, the order, the bill.
 *
 * The host speaks to whether they know your face; the server speaks to what
 * you ordered and what you left. Nothing here is a real restaurant's line and
 * no room named in the game is quoted: the rooms come from `content/places`,
 * which says of every one whether it is a landmark on the record or SLATE's
 * own, and these are the words the people in them use.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'dining';
const D = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'server', ...opts });

const LINES: DialogueLine[] = [
  // --- The door: a table now -------------------------------------------------------------------
  D('greet', 'door', 'seat.first.1', '"Evening. Table for one? Follow me, I have something by the window."', { when: { result: ['seated'], flags: ['first'] }, role: 'host' }),
  D('greet', 'door', 'seat.first.2', 'The host looks at the book, looks at the room, and decides you are not a problem. "This way."', { when: { result: ['seated'], flags: ['first'] }, speaker: 'narrator', role: 'host' }),
  D('greet', 'door', 'seat.first.3', '"You have caught us at a good moment. Anywhere you like, honestly."', { when: { result: ['seated'], flags: ['first'], tone: ['warm'] }, role: 'host' }),
  D('greet', 'door', 'seat.first.4', '"Just yourself? Lovely. Give me one second and I will sort you out."', { when: { result: ['seated'], flags: ['first'] }, role: 'host' }),
  D('greet', 'door', 'seat.regular.1', '"There you are. Your table, or would you rather the terrace tonight?"', { when: { result: ['seated'], flags: ['regular'] }, role: 'host' }),
  D('greet', 'door', 'seat.regular.2', 'The host does not look at the book. "Come on through."', { when: { result: ['seated'], flags: ['regular'] }, speaker: 'narrator', role: 'host' }),
  D('greet', 'door', 'seat.regular.3', '"We were talking about you yesterday. Nothing bad. This way."', { when: { result: ['seated'], flags: ['regular'], tone: ['warm'] }, role: 'host' }),
  D('greet', 'door', 'seat.generous.1', '"Ah. Give me a moment, I would rather not put you at the back."', { when: { result: ['seated'], flags: ['generous'] }, role: 'host' }),
  D('greet', 'door', 'seat.cheap.1', 'The host checks the book longer than the room requires. "We can do you the one by the kitchen."', { when: { result: ['seated'], flags: ['cheap'] }, speaker: 'narrator', role: 'host' }),
  D('greet', 'door', 'seat.walked.1', '"You are back. We do have a table this time, if you can bear us."', { when: { result: ['seated'], flags: ['walked'], tone: ['dry'] }, role: 'host' }),
  D('greet', 'door', 'seat.plain.1', '"Table for you? Yes. Two minutes and it is yours."', { when: { result: ['seated'] }, role: 'host' }),
  D('greet', 'door', 'seat.plain.2', 'Somebody with an armful of menus finds you a table without breaking stride.', { when: { result: ['seated'] }, speaker: 'narrator', role: 'host' }),

  // --- The door: a wait ------------------------------------------------------------------------
  D('greet', 'door', 'wait.short.1', '"It will be about {wait}. You can stand at the bar, if you like."', { when: { result: ['waiting'] }, role: 'host' }),
  D('greet', 'door', 'wait.short.2', 'The host does the sum in their head and lands somewhere honest. "{wait}."', { when: { result: ['waiting'] }, speaker: 'narrator', role: 'host' }),
  D('greet', 'door', 'wait.short.3', '"{wait}, and I am not saying that to be nice. There are two tables about to go."', { when: { result: ['waiting'], tone: ['firm'] }, role: 'host' }),
  D('greet', 'door', 'wait.long.1', '"I can do you something in {wait}. I know. Fridays."', { when: { result: ['waiting'], flags: ['peak'] }, role: 'host' }),
  D('greet', 'door', 'wait.long.2', 'Every table has somebody at it and three groups are already standing. "{wait}," the host says, apologetically.', { when: { result: ['waiting'], flags: ['peak'] }, speaker: 'narrator', role: 'host' }),
  D('greet', 'door', 'wait.regular.1', '"For you, {wait}. For anybody else it is an hour."', { when: { result: ['waiting'], flags: ['regular'] }, role: 'host' }),
  D('greet', 'door', 'wait.walked.1', '"{wait}. I will hold it this time, if you are actually staying."', { when: { result: ['waiting'], flags: ['walked'], tone: ['dry'] }, role: 'host' }),

  // --- The counter -----------------------------------------------------------------------------
  D('greet', 'counter', 'first.1', '"What can I get you?"', { when: { flags: ['first'] }, role: 'counter' }),
  D('greet', 'counter', 'first.2', 'The person behind the counter finishes with the machine and turns round. "Hi. Go on."', { when: { flags: ['first'] }, speaker: 'narrator', role: 'counter' }),
  D('greet', 'counter', 'regular.1', '"The usual, or are we being adventurous?"', { when: { flags: ['regular'] }, role: 'counter' }),
  D('greet', 'counter', 'regular.2', 'The cup is already under the spout before you have said anything.', { when: { flags: ['regular'] }, speaker: 'narrator', role: 'counter' }),
  D('greet', 'counter', 'plain.1', '"Next. What are we having?"', { role: 'counter' }),
  D('greet', 'counter', 'plain.2', 'A queue behind you, a queue in front of you, and forty seconds of eye contact.', { speaker: 'narrator', role: 'counter' }),

  // --- Standing there --------------------------------------------------------------------------
  D('wait', 'door', 'stand.1', 'You stand where the door and the dining room disagree about temperature. Somebody squeezes past with three plates.', { speaker: 'narrator', role: 'world' }),
  D('wait', 'door', 'stand.2', 'The bar takes your order for one drink and forgets about you, which is fair, because so has everybody.', { speaker: 'narrator', role: 'world' }),
  D('wait', 'door', 'stand.3', 'Two tables leave. Neither of them is yours. A third is being wiped down with real intent.', { speaker: 'narrator', role: 'world' }),
  D('wait', 'door', 'stand.4', 'You read the specials board twice and change your mind twice, which is what it is for.', { speaker: 'narrator', role: 'world' }),
  D('wait', 'door', 'over.1', '"Sorry. Genuinely. The eight o\'clock table is having a wonderful time."', { when: { result: ['over'] }, role: 'host' }),
  D('wait', 'door', 'over.2', 'The quote was optimistic. The host avoids your eye, which is its own answer.', { when: { result: ['over'] }, speaker: 'narrator', role: 'host' }),

  // --- Sat down --------------------------------------------------------------------------------
  D('seat', 'table', 'window.1', '"Here you are. Best seat in the room, and nobody will bother you."', { when: { flags: ['good'] } }),
  D('seat', 'table', 'window.2', 'A table with a view of something other than the toilets. Small mercies, correctly weighted.', { when: { flags: ['good'] }, speaker: 'narrator', role: 'world' }),
  D('seat', 'table', 'bad.1', '"It is not the best table. It is the table I have."', { when: { flags: ['bad'], tone: ['dry'] } }),
  D('seat', 'table', 'bad.2', 'The kitchen door swings twice a minute, six inches from your shoulder.', { when: { flags: ['bad'] }, speaker: 'narrator', role: 'world' }),
  D('seat', 'table', 'plain.1', '"Water for the table? Still is fine, I am not going to sell you a bottle."', {}),
  D('seat', 'table', 'plain.2', 'Menus arrive, then bread, then the specials, in the order those things arrive.', { speaker: 'narrator', role: 'world' }),
  D('seat', 'table', 'regular.1', '"Same as always? I will bring it and you can pretend you chose."', { when: { flags: ['regular'], tone: ['warm'] } }),

  // --- Ordering --------------------------------------------------------------------------------
  D('order', 'table', 'take.1', '"Good. Good choices, both of them."', { when: { result: ['taken'] } }),
  D('order', 'take', 'take.2', 'The server writes nothing down, which is either confidence or a problem for later.', { when: { result: ['taken'] }, speaker: 'narrator' }),
  D('order', 'table', 'take.3', '"That is {items}. Anything you cannot eat I should know about?"', { when: { result: ['taken'] } }),
  D('order', 'table', 'take.4', '"{items}. Twenty minutes on the second one, is that all right?"', { when: { result: ['taken'], tone: ['firm'] } }),
  D('order', 'table', 'usual.1', '"The {usual} again. You know we do other things."', { when: { result: ['taken'], flags: ['usual'], tone: ['dry'] } }),
  D('order', 'table', 'usual.2', '"The {usual}. I did not need to ask, and I asked anyway, out of respect."', { when: { result: ['taken'], flags: ['usual'], tone: ['warm'] } }),
  D('order', 'table', 'push.1', '"If you are having that, have it with the {suggestion}. Trust me on this one."', { when: { move: ['recommend'] } }),
  D('order', 'table', 'push.2', 'The server glances at the kitchen, then leans in. "The {suggestion}. It is the only thing I would order tonight."', { when: { move: ['recommend'] }, speaker: 'narrator' }),
  D('order', 'table', 'push.3', '"Honestly? The {suggestion}. Everything else is fine. That is the one."', { when: { move: ['recommend'], tone: ['warm'] } }),

  // --- The food --------------------------------------------------------------------------------
  D('serve', 'table', 'good.1', 'It arrives hot and looking like the photograph nobody took. The first bite settles an argument you were having with the day.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  D('serve', 'table', 'good.2', '"Careful, the plate is hot. Enjoy."', { when: { result: ['good'] } }),
  D('serve', 'table', 'good.3', 'Somebody in this kitchen cares, and you can taste exactly where.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  D('serve', 'table', 'fine.1', 'It is what it said it was. That is not nothing.', { when: { result: ['fine'] }, speaker: 'narrator', role: 'world' }),
  D('serve', 'table', 'fine.2', '"There you go. Anything else, I am about."', { when: { result: ['fine'] } }),
  D('serve', 'table', 'poor.1', 'It is warm rather than hot, and it has been sitting under a light while something else was finished.', { when: { result: ['poor'] }, speaker: 'narrator', role: 'world' }),
  D('serve', 'table', 'poor.2', '"Sorry about the wait on that. Kitchen is drowning."', { when: { result: ['poor'] } }),
  D('serve', 'counter', 'quick.1', 'Your name, spelled generously, called out over the machine. It is ready before you have found a seat.', { speaker: 'narrator', role: 'counter' }),
  D('serve', 'counter', 'quick.2', '"That is yours. Sugar is on the end."', { role: 'counter' }),

  // --- The check-in ----------------------------------------------------------------------------
  D('check', 'table', 'ask.1', '"How is everything?" — asked at the exact moment your mouth is full, as is traditional.', { speaker: 'narrator' }),
  D('check', 'table', 'ask.2', '"Everything all right there?"', {}),
  D('check', 'table', 'ask.3', '"Good? Good. I will leave you to it."', { when: { tone: ['dry'] } }),

  // --- The bill --------------------------------------------------------------------------------
  D('bill', 'table', 'arrive.1', '"No rush at all." The little tray says otherwise, politely. {total}.', {}),
  D('bill', 'table', 'arrive.2', 'The bill comes folded, which is a way of saying a number without saying it. {total}.', { speaker: 'narrator' }),
  D('bill', 'table', 'arrive.3', '"{total}, and the service is on there already. Whatever you want to do beyond that is yours."', {}),
  D('bill', 'table', 'arrive.4', '"That is {total}. Card is fine, cash is better, and I did not say that."', { when: { tone: ['dry'] } }),
  D('bill', 'counter', 'now.1', '"{total}, please. Tap it whenever."', { role: 'counter' }),
  D('bill', 'counter', 'now.2', 'The card reader turns towards you before the sentence has finished. {total}.', { speaker: 'narrator', role: 'counter' }),

  // --- The tip ---------------------------------------------------------------------------------
  D('tip', 'table', 'good.1', 'The server looks at the slip, then at you, and the professional face slips for about a second. "Thank you. Really."', { when: { result: ['generous'] }, speaker: 'narrator' }),
  D('tip', 'table', 'good.2', '"That is very kind. Come back and ask for me."', { when: { result: ['generous'] } }),
  D('tip', 'table', 'good.3', '"You did not have to do that." They are already putting your name in the book for next time.', { when: { result: ['generous'], tone: ['warm'] }, speaker: 'narrator' }),
  D('tip', 'table', 'fair.1', '"Thank you. Have a good night."', { when: { result: ['fair'] } }),
  D('tip', 'table', 'fair.2', 'A nod, the machine, a receipt you fold into a pocket you will empty on Sunday.', { when: { result: ['fair'] }, speaker: 'narrator' }),
  D('tip', 'table', 'none.1', 'The server says thank you in the voice people use when they are counting something in their head.', { when: { result: ['nothing'] }, speaker: 'narrator' }),
  D('tip', 'table', 'none.2', '"Thanks." The tray goes away faster than it came.', { when: { result: ['nothing'], tone: ['dry'] } }),
  D('tip', 'table', 'none.3', 'Nothing on the line, and everybody in the room who does this for a living notices, because that is the job.', { when: { result: ['nothing'] }, speaker: 'narrator', role: 'world' }),

  // --- Leaving ---------------------------------------------------------------------------------
  D('farewell', 'door', 'out.1', '"Mind how you go."', { role: 'host' }),
  D('farewell', 'door', 'out.2', 'The door, the street, the cold, and the particular good mood of having eaten properly.', { speaker: 'narrator', role: 'world' }),
  D('farewell', 'door', 'regular.1', '"Same time next week, then."', { when: { flags: ['regular'] }, role: 'host' }),
  D('farewell', 'door', 'walkout.1', 'You leave before the table does. The host marks something in the book without looking up.', { when: { result: ['walked'] }, speaker: 'narrator', role: 'host' }),
  D('farewell', 'door', 'walkout.2', '"No problem at all." It very slightly is.', { when: { result: ['walked'], tone: ['dry'] }, role: 'host' }),
];

export const DINING_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'greet', beat: 'door', result: ['seated', 'waiting'] },
    { purpose: 'greet', beat: 'door', result: ['seated'], flags: ['first'] },
    { purpose: 'greet', beat: 'door', result: ['seated'], flags: ['regular'] },
    { purpose: 'greet', beat: 'counter' },
    { purpose: 'greet', beat: 'counter', flags: ['regular'] },
    { purpose: 'wait', beat: 'door' },
    { purpose: 'wait', beat: 'door', result: ['over'] },
    { purpose: 'seat', beat: 'table' },
    { purpose: 'seat', beat: 'table', flags: ['good'] },
    { purpose: 'seat', beat: 'table', flags: ['bad'] },
    { purpose: 'order', beat: 'table', result: ['taken'] },
    { purpose: 'order', beat: 'table', move: ['recommend'] },
    { purpose: 'serve', beat: 'table', result: ['good', 'fine', 'poor'] },
    { purpose: 'serve', beat: 'counter' },
    { purpose: 'check', beat: 'table' },
    { purpose: 'bill', beat: 'table' },
    { purpose: 'bill', beat: 'counter' },
    { purpose: 'tip', beat: 'table', result: ['generous', 'fair', 'nothing'] },
    { purpose: 'farewell', beat: 'door' },
    { purpose: 'farewell', beat: 'door', result: ['walked'] },
  ],
};
