/**
 * Property — what an agent says at the door, room by room, and when asked.
 *
 * The agent's voice is a condition: a warm one sells the light, a firm one
 * sells the square footage. What they say about the house follows its
 * condition; what they say about the seller follows what an agent would
 * actually tell you; what they say about other offers is the truth,
 * because the game knows it and would not let them lie.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'property';
const A = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'agent', ...opts });

const ROOMS = ['kitchen', 'living', 'bedroom', 'bathroom', 'outside'] as const;

const room = (kind: (typeof ROOMS)[number], band: 'worn' | 'fair' | 'good' | 'excellent', n: number, text: string): DialogueLine =>
  A('room', 'walk', `${kind}.${band}.${n}`, text, { when: { move: [kind], flags: [band] }, speaker: 'narrator' });

const LINES: DialogueLine[] = [
  // --- At the door --------------------------------------------------------------
  A('greet', 'door', 'first.1', '{first} is on the step with the keys already out. "Come in. Mind the light — it is the best thing about it."', { when: { flags: ['first_visit'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'first.2', '{first} opens the door and stands aside. "Have a look round. I will be here."', { when: { flags: ['first_visit'], tone: ['firm'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'first.3', '{first} shakes your hand on the path. "I have shown this one four times. It shows well."', { when: { flags: ['first_visit'], tone: ['warm'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'again.1', '{first} again, with a different set of keys. "Good to see you back. This one might be it."', { when: { flags: ['returning'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'again.2', '{first} nods. "You know the drill. Go where you like."', { when: { flags: ['returning'], tone: ['firm'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'missed.1', '{first} is polite about the time you did not come. It is in the politeness.', { when: { requires: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'missed.2', '{first} checks the time before saying hello. "You made it. Come in."', { when: { requires: ['missed'], tone: ['firm'] }, speaker: 'narrator' }),
  A('greet', 'door', 'missed.3', '{first} does not mention the showing you did not come to, and you both hear it not being mentioned.', { when: { requires: ['missed'], tone: ['warm'] }, speaker: 'narrator' }),

  // --- Room by room --------------------------------------------------------------
  room('kitchen', 'worn', 1, 'The kitchen has been cooked in for thirty years and it shows: worktops scored, a drawer that needs a lift to close.'),
  room('kitchen', 'worn', 2, 'Cupboard doors hang a little off. The extractor rattles when {first} turns it on to prove it works.'),
  room('kitchen', 'fair', 1, 'A kitchen that works. Nothing you would choose, nothing you would have to rip out this year.'),
  room('kitchen', 'fair', 2, 'Clean, plain, a decade old. The oven is newer than the rest.'),
  room('kitchen', 'good', 1, 'A good kitchen: stone, decent light, room for two people to be in it at once.'),
  room('kitchen', 'good', 2, 'Somebody spent money in here, and spent it well.'),
  room('kitchen', 'excellent', 1, 'The kitchen is the house. You could stop the viewing here and it would be a fair decision.'),
  room('kitchen', 'excellent', 2, 'Every surface in here has been thought about. {first} lets you have the silence.'),
  room('living', 'worn', 1, 'The living room carpet remembers a dog and a previous colour.'),
  room('living', 'worn', 2, 'A ceiling stain in the corner that {first} does not mention until you look at it.'),
  room('living', 'fair', 1, 'A living room that would look better with your things in it and nothing on the walls.'),
  room('living', 'fair', 2, 'Good proportions, tired paint. That is a weekend, not a builder.'),
  room('living', 'good', 1, 'The light lands where it should. You picture the sofa before you can stop yourself.'),
  room('living', 'good', 2, 'The floors are original and somebody has looked after them.'),
  room('living', 'excellent', 1, 'You stand in the middle of the living room longer than you meant to.'),
  room('living', 'excellent', 2, 'It is the kind of room people photograph. {first} knows it, and says nothing.'),
  room('bedroom', 'worn', 1, 'The bedroom window sticks. The wardrobe is built in and built badly.'),
  room('bedroom', 'worn', 2, 'Marks on the wall where a bed was, and where a bed will be again.'),
  room('bedroom', 'fair', 1, 'A bedroom. Square, quiet, a window onto something green.'),
  room('bedroom', 'fair', 2, 'Enough room for the bed you have and the one you want.'),
  room('bedroom', 'good', 1, 'The main bedroom is bigger than the last two flats you lived in.'),
  room('bedroom', 'good', 2, 'Morning light, and the road is on the other side of the house.'),
  room('bedroom', 'excellent', 1, 'You could sleep in this room tonight and wake up better.'),
  room('bedroom', 'excellent', 2, 'The bedroom has a view somebody paid for, and it will be in the price.'),
  room('bathroom', 'worn', 1, 'The bathroom grout has given up. {first} says "cosmetic", which is what they say.'),
  room('bathroom', 'worn', 2, 'A bathroom from a decade that liked that colour.'),
  room('bathroom', 'fair', 1, 'A bathroom that is fine. Water pressure is decent; you check.'),
  room('bathroom', 'fair', 2, 'Tiles that are not yours, plumbing that is sound.'),
  room('bathroom', 'good', 1, 'A good bathroom, recently done, done properly.'),
  room('bathroom', 'good', 2, 'Underfloor heating. {first} makes sure you notice.'),
  room('bathroom', 'excellent', 1, 'The bathroom is a small hotel. You would not change a tap.'),
  room('bathroom', 'excellent', 2, 'Stone, brass, a window. It is better than yours will ever be, unless this is yours.'),
  room('outside', 'worn', 1, 'Outside is a job: fencing down, a lawn that has been a meadow for a summer.'),
  room('outside', 'worn', 2, 'The garden has potential, which is the word for work.'),
  room('outside', 'fair', 1, 'A yard you could sit in, with a table you would have to buy.'),
  room('outside', 'fair', 2, 'Outside is tidy and unloved. It would take a year to be yours.'),
  room('outside', 'good', 1, 'A garden somebody has kept. There is a tree with a swing in it and a swing in the price.'),
  room('outside', 'good', 2, 'Outside is quiet, and the quiet is the thing you would be paying for.'),
  room('outside', 'excellent', 1, 'You walk to the end of the garden and turn round and the house looks like a house you own.'),
  room('outside', 'excellent', 2, 'Outside is the reason. {first} waits by the door and lets it work.'),

  // --- Asking the agent --------------------------------------------------------------
  A('answer', 'ask', 'market.1', '"Listed {days} days. That is about normal for this street."', { when: { move: ['market'] } }),
  A('answer', 'ask', 'market.2', '"{days} days. Enough that the seller is listening, not so many that something is wrong with it."', { when: { move: ['market'], tone: ['warm'] } }),
  A('answer', 'ask', 'market.3', '"{days} days on the market. I do not read anything into it and neither should you."', { when: { move: ['market'], tone: ['firm'] } }),
  A('answer', 'ask', 'why.keen.1', '"Between us, they need it gone. A job elsewhere. A fair offer this month gets a fair hearing."', { when: { move: ['why'], flags: ['keen'] } }),
  A('answer', 'ask', 'why.keen.2', '"They have somewhere to be. I would not wait to make an offer if you like it."', { when: { move: ['why'], flags: ['keen'], tone: ['firm'] } }),
  A('answer', 'ask', 'why.steady.1', '"No rush on their side. They will take the right number and not the first one."', { when: { move: ['why'], flags: ['steady'] } }),
  A('answer', 'ask', 'why.steady.2', '"They are moving up, not out. They can afford to wait, and they know it."', { when: { move: ['why'], flags: ['steady'], tone: ['warm'] } }),
  A('answer', 'ask', 'offers.quiet.1', '"Nothing on paper. I would tell you if there were; it helps me."', { when: { move: ['offers'], flags: ['quiet'] } }),
  A('answer', 'ask', 'offers.quiet.2', '"No offers yet. That will not be true for long at this price."', { when: { move: ['offers'], flags: ['quiet'], tone: ['warm'] } }),
  A('answer', 'ask', 'area.1', '"{hood}. You know it or you do not. Coffee is four minutes; the airport is forty."', { when: { move: ['area'] } }),
  A('answer', 'ask', 'area.2', '"{hood} is quiet at night and loud on Saturdays, and I would rather you heard it from me."', { when: { move: ['area'], tone: ['firm'] } }),
  A('answer', 'ask', 'area.3', '"I live two streets from here myself. {hood} is a good place to come home to."', { when: { move: ['area'], tone: ['warm'] } }),
  A('answer', 'ask', 'price.1', '"Asking is {asking}. What the seller takes is a different number, and I do not know it either."', { when: { move: ['price'] } }),
  A('answer', 'ask', 'price.2', '"{asking}. Offer what it is worth to you and let me do the talking upstairs."', { when: { move: ['price'], tone: ['warm'] } }),

  // --- The offer -----------------------------------------------------------------------
  A('offer', 'table', 'made.1', '{first} writes it down without a flicker. "I will take it to them tonight. You will hear within a day or two."', { speaker: 'narrator' }),
  A('offer', 'table', 'made.2', '{first} reads the number back to you, once. "Understood. I will call."', { when: { tone: ['firm'] }, speaker: 'narrator' }),
  A('offer', 'table', 'made.3', '{first} smiles at the number. "I think we can do something with that. Give me a day."', { when: { tone: ['warm'] }, speaker: 'narrator' }),
  A('offer', 'table', 'none.1', '{first} walks you to the door. "Sleep on it. It will still be here on Monday, probably."', { when: { move: ['none'] }, speaker: 'narrator' }),
  A('offer', 'table', 'none.2', '{first} takes the keys back. "No pressure. Call me when you know."', { when: { move: ['none'], tone: ['warm'] }, speaker: 'narrator' }),
];

export const PROPERTY_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'greet', beat: 'door', flags: ['first_visit'] },
    { purpose: 'greet', beat: 'door', flags: ['returning'] },
    { purpose: 'greet', beat: 'door', flags: ['first_visit'], facts: ['missed'] },
    ...ROOMS.map((kind) => ({ purpose: 'room', beat: 'walk', move: [kind], flags: ['worn'] })),
    ...ROOMS.map((kind) => ({ purpose: 'room', beat: 'walk', move: [kind], flags: ['fair'] })),
    ...ROOMS.map((kind) => ({ purpose: 'room', beat: 'walk', move: [kind], flags: ['good'] })),
    ...ROOMS.map((kind) => ({ purpose: 'room', beat: 'walk', move: [kind], flags: ['excellent'] })),
    { purpose: 'answer', beat: 'ask', move: ['market', 'area', 'price'] },
    { purpose: 'answer', beat: 'ask', move: ['why'], flags: ['keen'] },
    { purpose: 'answer', beat: 'ask', move: ['why'], flags: ['steady'] },
    { purpose: 'answer', beat: 'ask', move: ['offers'], flags: ['quiet'] },
    { purpose: 'offer', beat: 'table' },
    { purpose: 'offer', beat: 'table', move: ['none'] },
  ],
};
