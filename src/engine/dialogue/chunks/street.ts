/**
 * The street — the city between the places you were going.
 *
 * Weather, traffic, the walk, the cab, the queue, and being recognized or
 * not being recognized. Every real landmark named in the game is public
 * record; the streets around it are SLATE's own, and the places file says so.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'street';
const T = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'world', speaker: 'narrator', ...opts });

const LINES: DialogueLine[] = [
  // --- Weather ------------------------------------------------------------------------------------------
  T('weather', 'outside', 'clear.1', 'One of those days the city puts on to make you forget the other ones.', { when: { flags: ['clear'] } }),
  T('weather', 'outside', 'clear.2', 'Sun on the west side of everything and shadows sharp enough to cut yourself on.', { when: { flags: ['clear'] } }),
  T('weather', 'outside', 'clear.3', 'Cloudless, and everybody has decided to have their meeting outside.', { when: { flags: ['clear'] } }),
  T('weather', 'outside', 'rain.1', 'Rain that arrived without being forecast, and a street full of people pretending they are not hurrying.', { when: { flags: ['rain'] } }),
  T('weather', 'outside', 'rain.2', 'The kind of rain that soaks one trouser leg only, for reasons nobody has ever explained.', { when: { flags: ['rain'] } }),
  T('weather', 'outside', 'rain.3', 'Everybody is under the same three awnings, being polite about it.', { when: { flags: ['rain'] } }),
  T('weather', 'outside', 'cold.1', 'Cold enough that the first breath outside is a decision.', { when: { flags: ['cold'] } }),
  T('weather', 'outside', 'cold.2', 'Your ears go first, then your hands, then any interest you had in walking the long way.', { when: { flags: ['cold'] } }),
  T('weather', 'outside', 'heat.1', 'Heat coming up off the pavement as well as down onto it, which is the worst arrangement.', { when: { flags: ['heat'] } }),
  T('weather', 'outside', 'heat.2', 'Everybody is walking on the shaded side and the sunny side is empty, like a river with a current.', { when: { flags: ['heat'] } }),
  T('weather', 'outside', 'wind.1', 'Wind funnelling between two towers at a speed neither of them intended.', { when: { flags: ['wind'] } }),
  T('weather', 'outside', 'fog.1', 'Fog to the third floor. The city above that is somebody else’s problem this morning.', { when: { flags: ['fog'] } }),
  T('weather', 'outside', 'night.1', 'Dark by five, and every window on the street is a small lit stage with somebody in it.', { when: { flags: ['night'] } }),
  T('weather', 'outside', 'night.2', 'The pavement is still warm and the bars have put their tables out.', { when: { flags: ['night'] } }),

  // --- Traffic and getting about --------------------------------------------------------------------------------
  T('traffic', 'drive', 'clear.1', 'Green all the way down, which the city allows about twice a year.', { when: { result: ['clear'] } }),
  T('traffic', 'drive', 'clear.2', 'You make it across town in the time the map optimistically promised.', { when: { result: ['clear'] } }),
  T('traffic', 'drive', 'slow.1', 'Four lanes doing eight miles an hour and everybody in them convinced the other three are moving.', { when: { result: ['slow'] } }),
  T('traffic', 'drive', 'slow.2', 'A junction that has failed. Somebody is out of their car and pointing at a light.', { when: { result: ['slow'] } }),
  T('traffic', 'drive', 'slow.3', 'You get very familiar with the back of a delivery van and its opinions on tailgating.', { when: { result: ['slow'] } }),
  T('traffic', 'drive', 'jam.1', 'Nothing moves for eleven minutes. Then everything does, for eighty yards.', { when: { result: ['jam'] } }),
  T('traffic', 'drive', 'jam.2', 'You take the diversion, and the diversion has had the same idea about you.', { when: { result: ['jam'] } }),
  T('traffic', 'drive', 'park.1', 'A space, right outside, on the correct side. Days are made of smaller things than this.', { when: { flags: ['parked'] } }),
  T('traffic', 'drive', 'park.2', 'Four circuits of the block and then a garage that charges by the fifteen minutes.', { when: { flags: ['nowhere'] } }),
  T('traffic', 'walk', 'good.1', 'Twenty minutes on foot, and the city rearranges itself into something you could like.'),
  T('traffic', 'walk', 'good.2', 'You take the back way, past the launderette and the good bakery, and it is longer and better.'),
  T('traffic', 'walk', 'good.3', 'Somebody is playing something decent on a corner and you slow down without deciding to.'),
  T('traffic', 'walk', 'bad.1', 'Roadworks, a diversion, and a pavement narrowed to one person at a time.', { when: { flags: ['obstructed'] } }),
  T('traffic', 'walk', 'bad.2', 'Every crossing is against you. All of them. There is no explanation and there is no appeal.', { when: { flags: ['obstructed'] } }),
  T('traffic', 'transit', 'good.1', 'The train is there when you get to the platform, which the day did not owe you.', { when: { result: ['clear'] } }),
  T('traffic', 'transit', 'bad.1', 'Signal failure. Everybody looks at the board and then at each other and then at the board again.', { when: { result: ['jam'] } }),
  T('traffic', 'transit', 'bad.2', 'A carriage at the density where nobody can reach their phone, which improves everybody.', { when: { result: ['slow'] } }),
  T('traffic', 'taxi', 'good.1', 'A cab in ninety seconds and a driver who takes the route you would have taken.'),
  T('traffic', 'taxi', 'chat.1', 'The driver has a theory about the film industry. It is not entirely wrong, which is the worrying part.'),
  T('traffic', 'taxi', 'chat.2', 'Radio phone-in, an argument about a football decision, and neither of you says a word the whole way.'),
  T('traffic', 'taxi', 'surge.1', 'The app wants nearly double and there is not a black cab in sight.', { when: { flags: ['surge'] } }),

  // --- Queues, doors and the small frictions --------------------------------------------------------------------------
  T('friction', 'queue', 'short.1', 'Two people ahead of you, both of them decisive. It is over before it starts.'),
  T('friction', 'queue', 'long.1', 'A queue with a bend in it, which is the worst kind, because you cannot see the end to judge it.'),
  T('friction', 'queue', 'long.2', 'The person at the front is having a whole conversation. Behind you, somebody sighs theatrically on everybody’s behalf.'),
  T('friction', 'queue', 'long.3', 'Twelve minutes of shuffling and a growing certainty that the other queue is faster.'),
  T('friction', 'door', 'closed.1', 'Shut. A handwritten sign, no date on it, and nothing on the internet either.'),
  T('friction', 'door', 'closed.2', 'The hours on the door and the hours in reality are two different documents.'),
  T('friction', 'door', 'card.1', 'The card reader thinks about it for four seconds, which is three seconds too many in public.'),
  T('friction', 'door', 'card.2', 'Cash only, and the machine round the corner charges you for the privilege.'),

  // --- Being seen -----------------------------------------------------------------------------------------------------
  T('seen', 'public', 'none.1', 'Nobody looks twice. It is a good feeling and it will not always be available.', { when: { result: ['unnoticed'] } }),
  T('seen', 'public', 'none.2', 'You buy coffee as a private citizen, which is a thing you should probably enjoy more consciously.', { when: { result: ['unnoticed'] } }),
  T('seen', 'public', 'maybe.1', 'Somebody clocks you, works through it, and decides they are wrong. They are not wrong.', { when: { result: ['almost'] } }),
  T('seen', 'public', 'maybe.2', 'A double take across the road, then a very deliberate looking at a phone.', { when: { result: ['almost'] } }),
  T('seen', 'public', 'yes.1', '"Sorry — I know you are not working, I just wanted to say the thing you did last year got me through something."', { when: { result: ['recognised'] }, speaker: 'npc' }),
  T('seen', 'public', 'yes.2', 'Two teenagers, a phone, and a request delivered with the specific bravery of somebody who has been dared.', { when: { result: ['recognised'] } }),
  T('seen', 'public', 'yes.3', '"My wife will not believe me. Would you mind?"', { when: { result: ['recognised'] }, speaker: 'npc' }),
  T('seen', 'public', 'yes.4', 'Somebody says your name like a question and then apologises for it four times.', { when: { result: ['recognised'] } }),
  T('seen', 'public', 'crowd.1', 'Three of them, then six, and the arithmetic of the exit becomes the only thing on your mind.', { when: { result: ['mobbed'] } }),
  T('seen', 'public', 'crowd.2', 'A phone goes up, then a dozen, and the street reorganises itself around you in about nine seconds.', { when: { result: ['mobbed'] } }),
  T('seen', 'public', 'press.1', 'A man with a long lens on the far pavement, being extremely casual about a camera the size of a marrow.', { when: { flags: ['press'] } }),
  T('seen', 'public', 'press.2', 'Two of them now, and one has started walking backwards, which is the tell.', { when: { flags: ['press'] } }),
  T('seen', 'public', 'industry.1', 'Somebody you were in a room with two years ago, coming the other way, both of you deciding at the same moment to stop.', { when: { flags: ['industry'] } }),
  T('seen', 'public', 'industry.2', 'An agent you do not have, being extremely pleased to see you.', { when: { flags: ['industry'] } }),

  // --- The city itself -------------------------------------------------------------------------------------------------
  T('city', 'about', 'la.1', 'Nobody walks here and everybody is walking somewhere. Both of these are true at once.', { when: { flags: ['la'] } }),
  T('city', 'about', 'la.2', 'Palm trees, a billboard for something that has not come out yet, and traffic in both directions at eleven in the morning.', { when: { flags: ['la'] } }),
  T('city', 'about', 'ny.1', 'Steam from somewhere under the road, and four separate conversations happening at you as you cross.', { when: { flags: ['ny'] } }),
  T('city', 'about', 'ny.2', 'You walk twenty blocks because the numbers make it sound like nothing, and it is not nothing.', { when: { flags: ['ny'] } }),
  T('city', 'about', 'london.1', 'Gray light, a bus, and a pub older than several countries.', { when: { flags: ['london'] } }),
  T('city', 'about', 'london.2', 'Three routes to the same place, all of them fifteen minutes, all of them wrong.', { when: { flags: ['london'] } }),
  T('city', 'about', 'paris.1', 'A street that has decided the pavement is for tables and pedestrians can manage.', { when: { flags: ['paris'] } }),
  T('city', 'about', 'tokyo.1', 'A crossing where four hundred people move through each other and not one of them touches.', { when: { flags: ['tokyo'] } }),
  T('city', 'about', 'small.1', 'A town where the same three cars keep going past and you have started recognizing them.', { when: { flags: ['small'] } }),
  T('city', 'about', 'small.2', 'The high street has a butcher, a charity shop and an optimist who opened a coffee place.', { when: { flags: ['small'] } }),
  T('city', 'about', 'new.1', 'You do not know which way anything is yet, and there is a specific pleasure in that lasting another day.', { when: { flags: ['new'] } }),
  T('city', 'about', 'home.1', 'You know this street well enough to walk it thinking about something else entirely.', { when: { flags: ['home'] } }),
  T('city', 'about', 'any.1', 'A city doing what cities do: getting on with it, loudly, without reference to you.'),
  T('city', 'about', 'any.2', 'Scaffolding on one side, a hoarding on the other, and something being replaced by something taller.'),
  T('city', 'about', 'any.3', 'Someone is unloading a van into a doorway and the whole street has agreed to work around it.'),
  T('city', 'about', 'any.4', 'The same four shops as everywhere else, and then one that has been there ninety years and sells one thing.'),
];

export const STREET_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    ...['clear', 'rain', 'cold', 'heat', 'night'].map((f) => ({ purpose: 'weather', beat: 'outside', flags: [f] })),
    { purpose: 'traffic', beat: 'drive', result: ['clear', 'slow', 'jam'] },
    { purpose: 'traffic', beat: 'walk' },
    { purpose: 'traffic', beat: 'transit', result: ['clear', 'slow', 'jam'] },
    { purpose: 'traffic', beat: 'taxi' },
    { purpose: 'friction', beat: 'queue' },
    { purpose: 'friction', beat: 'door' },
    { purpose: 'seen', beat: 'public', result: ['unnoticed', 'almost', 'recognised', 'mobbed'] },
    { purpose: 'city', beat: 'about' },
  ],
};
