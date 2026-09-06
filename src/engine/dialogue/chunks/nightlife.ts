/**
 * Nightlife — the bar, the door, the party, the corner booth and the taxi home.
 *
 * Where the industry actually does its business, and where it does damage to
 * itself. Every venue in the game is either a real landmark on the record or
 * SLATE's own, and the places file says which; every line here is SLATE's.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'nightlife';
const N = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'world', ...opts });

const LINES: DialogueLine[] = [
  // --- The door -----------------------------------------------------------------------------------------
  N('door', 'arrive', 'in.1', 'A clipboard, a name found on the second scan, and a rope moved about eight inches.', { when: { result: ['in'] }, speaker: 'narrator' }),
  N('door', 'arrive', 'in.2', '"Go on through. Straight ahead, then left, then it gets loud."', { when: { result: ['in'] }, speaker: 'npc', role: 'door' }),
  N('door', 'arrive', 'in.3', 'The door person looks at you, looks at nothing in particular, and unclips the rope without a word.', { when: { result: ['in'] }, speaker: 'narrator' }),
  N('door', 'arrive', 'in.4', '"Evening. They are expecting you upstairs."', { when: { result: ['in'], flags: ['known'] }, speaker: 'npc', role: 'door' }),
  N('door', 'arrive', 'wait.1', '"Fifteen minutes. I know what you are going to say and it is still fifteen minutes."', { when: { result: ['wait'] }, speaker: 'npc', role: 'door' }),
  N('door', 'arrive', 'wait.2', 'A queue along the wall of people all doing the same calculation about whether to stay.', { when: { result: ['wait'] }, speaker: 'narrator' }),
  N('door', 'arrive', 'no.1', '"Not tonight. Nothing personal and I am not going to explain it."', { when: { result: ['refused'] }, speaker: 'npc', role: 'door' }),
  N('door', 'arrive', 'no.2', 'The rope stays where it is. Somebody behind you gets waved through and you both pretend not to notice.', { when: { result: ['refused'] }, speaker: 'narrator' }),
  N('door', 'arrive', 'member.1', '"Card, and is anybody signing in with you?"', { when: { flags: ['members'] }, speaker: 'npc', role: 'door' }),
  N('door', 'arrive', 'member.2', 'No sign outside. A brass plate, a keypad and somebody who has been doing this for thirty years.', { when: { flags: ['members'] }, speaker: 'narrator' }),

  // --- The bar --------------------------------------------------------------------------------------------
  N('bar', 'order', 'quick.1', '"What are we having?" — asked over a shoulder while pouring something else.', { speaker: 'npc', role: 'bartender' }),
  N('bar', 'order', 'quick.2', 'Two minutes to catch an eye, four seconds to order, and a drink that arrives correct.', { speaker: 'narrator' }),
  N('bar', 'order', 'quick.3', '"Same again?" Which is either service or a comment, depending on the hour.', { speaker: 'npc', role: 'bartender', when: { tone: ['dry'] } }),
  N('bar', 'order', 'slow.1', 'Three deep at the bar and one person serving, doing their level best and losing.', { speaker: 'narrator' }),
  N('bar', 'order', 'slow.2', 'You get served out of turn and the man who was there first says nothing, and means several things.', { speaker: 'narrator' }),
  N('bar', 'order', 'craft.1', '"It is stirred, not shaken, and if you want it shaken I will do it and think less of both of us."', { speaker: 'npc', role: 'bartender', when: { flags: ['cocktails'] } }),
  N('bar', 'order', 'craft.2', 'Ice cut from a block with something that looks like a chisel, and a garnish that took longer than the drink.', { speaker: 'narrator', when: { flags: ['cocktails'] } }),
  N('bar', 'order', 'craft.3', '"Tell me a flavour and a mood and I will build you something."', { speaker: 'npc', role: 'bartender', when: { flags: ['cocktails'] } }),
  N('bar', 'order', 'pub.1', 'A pint pulled properly, a beer mat, and no further conversation required by anybody.', { speaker: 'narrator', when: { flags: ['pub'] } }),
  N('bar', 'order', 'pub.2', '"Sit anywhere that is not that table, he has been there since four."', { speaker: 'npc', role: 'bartender', when: { flags: ['pub'] } }),
  N('bar', 'order', 'none.1', '"Just the soda water. No, honestly, just the soda water."', { when: { flags: ['sober'] }, speaker: 'npc' }),
  N('bar', 'order', 'none.2', 'Nobody comments, which is the correct handling and rarer than it should be.', { when: { flags: ['sober'] }, speaker: 'narrator' }),

  // --- The room ---------------------------------------------------------------------------------------------
  N('room', 'inside', 'loud.1', 'Loud enough that everything becomes a series of shouted headlines with no supporting text.', { when: { flags: ['loud'] }, speaker: 'narrator' }),
  N('room', 'inside', 'loud.2', 'You lose the thread of a conversation three times and give up and just nod, which appears to be working.', { when: { flags: ['loud'] }, speaker: 'narrator' }),
  N('room', 'inside', 'quiet.1', 'Low light, low ceiling, and a room designed so that four people can talk without a fifth hearing.', { when: { flags: ['quiet'] }, speaker: 'narrator' }),
  N('room', 'inside', 'quiet.2', 'A corner booth, a candle, and the specific privacy of a place with no phones out.', { when: { flags: ['quiet'] }, speaker: 'narrator' }),
  N('room', 'inside', 'industry.1', 'Half the room is in the business and the other half is with somebody who is.', { when: { flags: ['industry'] }, speaker: 'narrator' }),
  N('room', 'inside', 'industry.2', 'Two tables away, a deal is being done badly and loudly, and everybody is listening while appearing not to.', { when: { flags: ['industry'] }, speaker: 'narrator' }),
  N('room', 'inside', 'industry.3', '"Do not look now. Left, by the pillar. That is the whole reason I picked this place."', { when: { flags: ['industry'] }, speaker: 'npc' }),
  N('room', 'inside', 'empty.1', 'A Tuesday. Six people, a bartender restocking, and a jukebox playing to nobody.', { when: { flags: ['empty'] }, speaker: 'narrator' }),
  N('room', 'inside', 'any.1', 'Warm air, a coat check with a numbered ticket, and the particular optimism of walking into a room at nine.', { speaker: 'narrator' }),
  N('room', 'inside', 'any.2', 'Somebody has claimed the best table by putting three coats on it and leaving.', { speaker: 'narrator' }),
  N('room', 'inside', 'any.3', 'A room where everybody is slightly better dressed than they need to be, which is a good sign.', { speaker: 'narrator' }),

  // --- The conversation that matters ------------------------------------------------------------------------------
  N('talk', 'booth', 'work.1', '"I am going to say a name and you are going to tell me what you have heard."', { speaker: 'npc', role: 'industry' }),
  N('talk', 'booth', 'work.2', '"Nothing about this is official. Nothing about this is even a conversation."', { speaker: 'npc', role: 'industry', when: { tone: ['guarded'] } }),
  N('talk', 'booth', 'work.3', 'The real business of the evening happens in nine minutes, near the end, on the way to the coats.', { speaker: 'narrator', role: 'industry' }),
  N('talk', 'booth', 'work.4', '"Send it to me at home. Not the office."', { speaker: 'npc', role: 'industry' }),
  N('talk', 'booth', 'honest.1', 'Somewhere after the second drink the conversation stops being performance and starts being true.', { speaker: 'narrator' }),
  N('talk', 'booth', 'honest.2', '"Can I tell you something I have not said out loud?"', { speaker: 'npc' }),
  N('talk', 'booth', 'honest.3', 'They say the thing, and it costs them, and you both sit with it for a second.', { speaker: 'narrator' }),
  N('talk', 'booth', 'gossip.1', '"It is not out yet. It is going to be out by Friday."', { speaker: 'npc', role: 'industry' }),
  N('talk', 'booth', 'gossip.2', 'Three stories, two of them true, and no way to tell which two.', { speaker: 'narrator', role: 'industry' }),

  // --- Later than intended --------------------------------------------------------------------------------------------
  N('late', 'night', 'good.1', 'It is one in the morning and nobody is doing the thing where they look at the time.', { when: { result: ['good'] }, speaker: 'narrator' }),
  N('late', 'night', 'good.2', 'The last hour is the best hour, and everybody knows it while it is happening, which almost never happens.', { when: { result: ['good'] }, speaker: 'narrator' }),
  N('late', 'night', 'good.3', '"One more and then I genuinely have to go." Said at eleven, and again at midnight, and again.', { when: { result: ['good'] }, speaker: 'npc' }),
  N('late', 'night', 'messy.1', 'Somewhere past the fourth drink the room tilts about a degree and stays there.', { when: { result: ['messy'] }, speaker: 'narrator' }),
  N('late', 'night', 'messy.2', 'You say something you would not have said at nine and watch it land badly in real time.', { when: { result: ['messy'] }, speaker: 'narrator' }),
  N('late', 'night', 'messy.3', '"Right, you are done. I am getting you a car and I am not arguing about it."', { when: { result: ['messy'] }, speaker: 'npc' }),
  N('late', 'night', 'messy.4', 'A phone comes up somewhere across the room and you do not see it and you will hear about it.', { when: { result: ['messy'], flags: ['famous'] }, speaker: 'narrator' }),
  N('late', 'night', 'early.1', 'You leave at ten, which is the correct decision, and feel about eleven percent worse for making it.', { when: { result: ['early'] }, speaker: 'narrator' }),
  N('late', 'night', 'early.2', '"You are going? Already?" Asked with genuine grief, by somebody who will not remember asking.', { when: { result: ['early'] }, speaker: 'npc' }),

  // --- Home ------------------------------------------------------------------------------------------------------------
  N('home', 'leave', 'cab.1', 'A cab, a window down two inches, and the city going past at the speed of a good ending.', { speaker: 'narrator' }),
  N('home', 'leave', 'cab.2', 'The driver has the radio on low and does not want to talk, and that is the best possible outcome.', { speaker: 'narrator' }),
  N('home', 'leave', 'walk.1', 'You walk it. Twenty five minutes, cold, and worth every one of them.', { speaker: 'narrator' }),
  N('home', 'leave', 'walk.2', 'Chips on the way home, eaten standing up, and no regrets available until morning.', { speaker: 'narrator' }),
  N('home', 'leave', 'tomorrow.1', 'You set an alarm you already know you are going to fight.', { speaker: 'narrator' }),
  N('home', 'leave', 'tomorrow.2', 'A glass of water by the bed, which is either wisdom or superstition, and works either way.', { speaker: 'narrator' }),
  N('home', 'leave', 'morning.1', 'The morning arrives with a full accounting and no interest in mitigation.', { when: { result: ['messy'] }, speaker: 'narrator' }),
  N('home', 'leave', 'morning.2', 'Eleven notifications and none of them are good news, and one of them is a photograph.', { when: { result: ['messy'], flags: ['famous'] }, speaker: 'narrator' }),
];

export const NIGHTLIFE_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'door', beat: 'arrive', result: ['in', 'wait', 'refused'] },
    { purpose: 'door', beat: 'arrive', flags: ['members'] },
    { purpose: 'bar', beat: 'order' },
    { purpose: 'bar', beat: 'order', flags: ['cocktails'] },
    { purpose: 'bar', beat: 'order', flags: ['sober'] },
    { purpose: 'room', beat: 'inside' },
    { purpose: 'room', beat: 'inside', flags: ['industry'] },
    { purpose: 'talk', beat: 'booth' },
    { purpose: 'late', beat: 'night', result: ['good', 'messy', 'early'] },
    { purpose: 'home', beat: 'leave' },
  ],
};
