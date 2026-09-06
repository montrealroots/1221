/**
 * Travel — packing, the airport, the desk, the gate, the air, the carousel,
 * the hotel desk.
 *
 * The narrator carries most of it: an airport is a place where nobody
 * speaks to you until they have to. The desk agent speaks to the seat, the
 * gate speaks to the board, and the hotel speaks to whether the room is
 * ready. Airlines, hotel brands and airports are real names; every route,
 * fare and room is SLATE's own.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'travel';
const N = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { speaker: 'narrator', role: 'world', ...opts });

const LINES: DialogueLine[] = [
  // --- Packing --------------------------------------------------------------------------------
  N('pack', 'home', 'domestic.1', 'A bag on the bed, the same things as last time, and a boarding pass on the phone. Domestic. Identification and a coffee.', { when: { flags: ['domestic'] } }),
  N('pack', 'home', 'domestic.2', 'You pack in twenty minutes because you have done it a hundred times. Charger. Charger. The other charger.', { when: { flags: ['domestic'] } }),
  N('pack', 'home', 'international.1', 'The passport is where you left it, which is the first relief of the day. {passport}. You check the photograph is still you.', { when: { flags: ['international'] } }),
  N('pack', 'home', 'international.2', 'A border today. The passport goes in the pocket you always use, and you check that pocket three more times before the door.', { when: { flags: ['international'] } }),
  N('pack', 'home', 'checked.1', 'The big bag, then. Zipped, weighed by feel, and {fee} at the desk for the privilege of not carrying it.', { when: { flags: ['checked'] } }),
  N('pack', 'home', 'checked.2', 'You check a bag and accept the small bet that comes with it: that it lands where you do.', { when: { flags: ['checked'] } }),
  N('pack', 'home', 'carry.1', 'Carry-on only. Everything you need in a bag that fits under the seat in front, which is a kind of freedom.', { when: { flags: ['carry_on'] } }),
  N('pack', 'home', 'carry.2', 'One bag, nothing in the hold, nothing to wait for on the other side.', { when: { flags: ['carry_on'] } }),

  // --- The run to the airport --------------------------------------------------------------------
  N('run', 'road', 'taxi.1', 'The cab knows the airport the way cabs do: fast, then not, then fast. {minutes} minutes and the meter to show for it.', { when: { flags: ['taxi'] } }),
  N('run', 'road', 'taxi.2', 'A driver who does not talk, a road that does. The terminal comes up on the right, all glass.', { when: { flags: ['taxi'] } }),
  N('run', 'road', 'transit.1', 'The train stops everywhere it can before the airport. You watch the minutes go by against the departure time.', { when: { flags: ['transit'] } }),
  N('run', 'road', 'transit.2', 'A platform, a wait, a carriage full of people with the same bag as you. Then the long walkway.', { when: { flags: ['transit'] } }),
  N('run', 'road', 'drive.1', 'You drive yourself and pay for the privilege twice: fuel there, parking after. The car will be where you left it, probably.', { when: { flags: ['drive'] } }),
  N('run', 'road', 'drive.2', 'Long-term parking is a field with a shuttle. The shuttle comes when it comes.', { when: { flags: ['drive'] } }),
  N('run', 'road', 'late.1', 'You reach the desk with the gate already closed. The agent is sorry in the way that changes nothing.', { when: { flags: ['late'] } }),

  // --- The desk -----------------------------------------------------------------------------------
  N('desk', 'checkin', 'economy.1', 'The desk agent looks at the screen longer than the screen deserves. "{seat}. Boarding at the gate on the board."', { when: { flags: ['economy'] } }),
  N('desk', 'checkin', 'economy.2', '"Any bags to check? Lovely. {seat}. Gate is that way, and then a long way that way."', { when: { flags: ['economy'] } }),
  N('desk', 'checkin', 'premium_economy.1', '"{seat}, a little more room. Enjoy the flight." They almost mean it.', { when: { flags: ['premium_economy'] } }),
  N('desk', 'checkin', 'business.1', 'A shorter queue, a warmer voice. "{seat}. The lounge is upstairs and the flight is on time."', { when: { flags: ['business'] } }),
  N('desk', 'checkin', 'first.1', 'Somebody appears at your elbow before you reach the desk. "{seat}. We will come and find you when it is time."', { when: { flags: ['first'] } }),
  N('desk', 'checkin', 'legroom.1', 'You pay for the exit row and the agent nods like you have made a sensible decision, which is rare.', { when: { flags: ['legroom'] } }),

  // --- The gate -----------------------------------------------------------------------------------
  N('gate', 'board', 'ontime.1', 'The board says on time and, for once, the board is right. They call your group and you go.', { when: { result: ['ontime'] } }),
  N('gate', 'board', 'ontime.2', 'The gate fills, the gate empties, and you are in the tube with the cold air and the small window.', { when: { result: ['ontime'] } }),
  N('gate', 'board', 'delayed.1', 'The board changes while you watch it. {delay} minutes, then another announcement that says the same thing in more words.', { when: { result: ['delayed'] } }),
  N('gate', 'board', 'delayed.2', 'Delayed. A gate full of people learning to sit on the floor. {delay} minutes that become a coffee, then a second one.', { when: { result: ['delayed'] } }),
  N('gate', 'board', 'cancelled.1', 'Cancelled. The word goes up on the board and a queue forms at the desk before the announcement finishes.', { when: { result: ['cancelled'] } }),
  N('gate', 'board', 'cancelled.2', 'The gate agent has the look of somebody who will be saying the same sentence two hundred times. The flight is not going.', { when: { result: ['cancelled'] } }),

  // --- The air ------------------------------------------------------------------------------------
  N('air', 'cabin', 'economy.sleep.1', 'You fold yourself into the seat and sleep the way you sleep on planes: badly, and gratefully.', { when: { flags: ['economy', 'sleep'] } }),
  N('air', 'cabin', 'economy.work.1', 'The tray table, the laptop at an angle, the elbow of a stranger. You get more done than you expected and less than you hoped.', { when: { flags: ['economy', 'work'] } }),
  N('air', 'cabin', 'economy.watch.1', 'Three films you would not have chosen on the ground. You watch two and a half of them.', { when: { flags: ['economy', 'watch'] } }),
  N('air', 'cabin', 'premium_economy.sleep.1', 'Enough recline to pretend. You sleep in the way that leaves a mark on your cheek.', { when: { flags: ['premium_economy', 'sleep'] } }),
  N('air', 'cabin', 'premium_economy.work.1', 'A wider tray table is the whole difference, and it is a difference.', { when: { flags: ['premium_economy', 'work'] } }),
  N('air', 'cabin', 'premium_economy.watch.1', 'A bigger screen and a smaller person beside you. Two films and the credits of a third.', { when: { flags: ['premium_economy', 'watch'] } }),
  N('air', 'cabin', 'business.sleep.1', 'The seat goes flat and so do you. You wake somewhere over an ocean with no idea which.', { when: { flags: ['business', 'sleep'] } }),
  N('air', 'cabin', 'business.work.1', 'A desk in the sky with a glass of something beside it. You work because the seat makes it feel like a choice.', { when: { flags: ['business', 'work'] } }),
  N('air', 'cabin', 'business.watch.1', 'A screen the size of a small television and a blanket somebody folded. You watch one film properly.', { when: { flags: ['business', 'watch'] } }),
  N('air', 'cabin', 'first.sleep.1', 'A door, a bed, pyjamas that are not yours. You sleep like the cabin is a room, because it is.', { when: { flags: ['first', 'sleep'] } }),
  N('air', 'cabin', 'first.work.1', 'You work at a table with a cloth on it, and somebody takes the cup away before it is empty.', { when: { flags: ['first', 'work'] } }),
  N('air', 'cabin', 'first.watch.1', 'You watch a film in a seat that was built for exactly that, and it is the best the film has ever looked.', { when: { flags: ['first', 'watch'] } }),
  N('air', 'cabin', 'private.sleep.1', 'A cabin with nobody in it but you and the people you brought. You sleep across three seats without asking.', { when: { flags: ['private', 'sleep'] } }),
  N('air', 'cabin', 'private.work.1', 'A table, a phone that works, and the whole flight to yourself. It is an office with a better view.', { when: { flags: ['private', 'work'] } }),
  N('air', 'cabin', 'private.watch.1', 'The screen is yours and so is the remote. Nobody asks you to lower the blind.', { when: { flags: ['private', 'watch'] } }),

  // --- The carousel ---------------------------------------------------------------------------------
  N('land', 'carousel', 'carry.1', 'Off the plane and past the carousel without stopping, the small pleasure of the carry-on.', { when: { result: ['carry_on'] } }),
  N('land', 'carousel', 'ok.1', 'The belt starts. Yours is not first and it is not last. You take it and you are done.', { when: { result: ['ok'] } }),
  N('land', 'carousel', 'ok.2', 'Twenty-five minutes of watching other people\'s bags go round. Then yours, with a new scuff.', { when: { result: ['ok'] } }),
  N('land', 'carousel', 'lost.1', 'The belt stops. It starts again. It stops. A woman at the desk takes your details and gives you a card with a number on it.', { when: { result: ['lost'] } }),
  N('land', 'carousel', 'lost.2', 'Yours does not come. Everyone else has gone. The desk says two days and says it kindly, which does not help.', { when: { result: ['lost'] } }),

  // --- Into town ------------------------------------------------------------------------------------
  N('hotel', 'desk', 'ready.1', '"Welcome. Your room is ready." Four words that are worth the price of the room.', { when: { result: ['ready'] } }),
  N('hotel', 'desk', 'ready.2', 'A key card, a floor number, a lift that smells of somebody else\'s perfume. The room is ready and the curtains are open.', { when: { result: ['ready'] } }),
  N('hotel', 'desk', 'early.1', '"Check-in is at {ready}. We can hold your bags." The lobby has a chair for exactly this.', { when: { result: ['early'] } }),
  N('hotel', 'desk', 'early.2', 'Too early for the room. You leave the bag with a man in a hat and walk into a city you have not slept in yet.', { when: { result: ['early'] } }),
  N('hotel', 'desk', 'none.1', 'No hotel booked. The city takes you in the way cities do: without noticing.', { when: { result: ['none'] } }),
  N('hotel', 'desk', 'none.2', 'Nowhere to check into, which is either freedom or a mistake. You will know by tonight.', { when: { result: ['none'] } }),

  // --- Missed -----------------------------------------------------------------------------------------
  N('missed', 'gate', 'missed.1', 'The plane is a shape on the far side of the glass, and you are on this side of it.', {}),
  N('missed', 'gate', 'missed.2', 'You missed it. The board already knows and has moved on to other people\'s flights.', {}),
];

export const TRAVEL_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'pack', beat: 'home', flags: ['domestic'] },
    { purpose: 'pack', beat: 'home', flags: ['international'] },
    { purpose: 'pack', beat: 'home', flags: ['checked'] },
    { purpose: 'pack', beat: 'home', flags: ['carry_on'] },
    { purpose: 'run', beat: 'road', flags: ['taxi'] },
    { purpose: 'run', beat: 'road', flags: ['transit'] },
    { purpose: 'run', beat: 'road', flags: ['drive'] },
    { purpose: 'run', beat: 'road', flags: ['late'] },
    ...['economy', 'premium_economy', 'business', 'first'].map((cabin) => ({ purpose: 'desk', beat: 'checkin', flags: [cabin] })),
    { purpose: 'desk', beat: 'checkin', flags: ['legroom'] },
    { purpose: 'gate', beat: 'board', result: ['ontime', 'delayed', 'cancelled'] },
    ...['economy', 'premium_economy', 'business', 'first', 'private'].flatMap((cabin) => ['sleep', 'work', 'watch'].map((activity) => ({ purpose: 'air', beat: 'cabin', flags: [cabin, activity] }))),
    { purpose: 'land', beat: 'carousel', result: ['carry_on', 'ok', 'lost'] },
    { purpose: 'hotel', beat: 'desk', result: ['ready', 'early', 'none'] },
    { purpose: 'missed', beat: 'gate' },
  ],
};
