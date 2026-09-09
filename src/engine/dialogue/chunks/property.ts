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
  A('greet', 'door', 'first.1', '{first} is on the step with the keys already out. "Come in. Mind the light — it’s the best thing about it."', { when: { flags: ['first_visit'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'first.2', '{first} opens the door and stands aside. "Have a look round. I’ll be here."', { when: { flags: ['first_visit'], tone: ['firm'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'first.3', '{first} shakes your hand on the path. "I have shown this one four times. It shows well."', { when: { flags: ['first_visit'], tone: ['warm'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'again.1', '{first} again, with a different set of keys. "Good to see you back. This one might be it."', { when: { flags: ['returning'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'again.2', '{first} nods. "You know the drill. Go where you like."', { when: { flags: ['returning'], tone: ['firm'], forbids: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'missed.1', '{first} is polite about the time you didn’t come. It’s in the politeness.', { when: { requires: ['missed'] }, speaker: 'narrator' }),
  A('greet', 'door', 'missed.2', '{first} checks the time before saying hello. "You made it. Come in."', { when: { requires: ['missed'], tone: ['firm'] }, speaker: 'narrator' }),
  A('greet', 'door', 'missed.3', '{first} doesn’t mention the showing you didn’t come to, and you both hear it not being mentioned.', { when: { requires: ['missed'], tone: ['warm'] }, speaker: 'narrator' }),

  // --- Room by room --------------------------------------------------------------
  room('kitchen', 'worn', 1, 'The kitchen has been cooked in for thirty years and it shows: worktops scored, a drawer that needs a lift to close.'),
  room('kitchen', 'worn', 2, 'Cupboard doors hang a little off. The extractor rattles when {first} turns it on to prove it works.'),
  room('kitchen', 'fair', 1, 'A kitchen that works. Nothing you’d choose, nothing you’d have to rip out this year.'),
  room('kitchen', 'fair', 2, 'Clean, plain, a decade old. The oven is newer than the rest.'),
  room('kitchen', 'good', 1, 'A good kitchen: stone, decent light, room for two people to be in it at once.'),
  room('kitchen', 'good', 2, 'Somebody spent money in here, and spent it well.'),
  room('kitchen', 'excellent', 1, 'The kitchen is the house. You could stop the viewing here and it would be a fair decision.'),
  room('kitchen', 'excellent', 2, 'Every surface in here has been thought about. {first} lets you have the silence.'),
  room('living', 'worn', 1, 'The living room carpet remembers a dog and a previous color.'),
  room('living', 'worn', 2, 'A ceiling stain in the corner that {first} doesn’t mention until you look at it.'),
  room('living', 'fair', 1, 'A living room that would look better with your things in it and nothing on the walls.'),
  room('living', 'fair', 2, 'Good proportions, tired paint. That’s a weekend, not a builder.'),
  room('living', 'good', 1, 'The light lands where it should. You picture the sofa before you can stop yourself.'),
  room('living', 'good', 2, 'The floors are original and somebody has looked after them.'),
  room('living', 'excellent', 1, 'You stand in the middle of the living room longer than you meant to.'),
  room('living', 'excellent', 2, 'It’s the kind of room people photograph. {first} knows it, and says nothing.'),
  room('bedroom', 'worn', 1, 'The bedroom window sticks. The wardrobe is built in and built badly.'),
  room('bedroom', 'worn', 2, 'Marks on the wall where a bed was, and where a bed will be again.'),
  room('bedroom', 'fair', 1, 'A bedroom. Square, quiet, a window onto something green.'),
  room('bedroom', 'fair', 2, 'Enough room for the bed you have and the one you want.'),
  room('bedroom', 'good', 1, 'The main bedroom is bigger than the last two flats you lived in.'),
  room('bedroom', 'good', 2, 'Morning light, and the road is on the other side of the house.'),
  room('bedroom', 'excellent', 1, 'You could sleep in this room tonight and wake up better.'),
  room('bedroom', 'excellent', 2, 'The bedroom has a view somebody paid for, and it will be in the price.'),
  room('bathroom', 'worn', 1, 'The bathroom grout has given up. {first} says "cosmetic", which is what they say.'),
  room('bathroom', 'worn', 2, 'A bathroom from a decade that liked that color.'),
  room('bathroom', 'fair', 1, 'A bathroom that’s fine. Water pressure is decent; you check.'),
  room('bathroom', 'fair', 2, 'Tiles that aren’t yours, plumbing that’s sound.'),
  room('bathroom', 'good', 1, 'A good bathroom, recently done, done properly.'),
  room('bathroom', 'good', 2, 'Underfloor heating. {first} makes sure you notice.'),
  room('bathroom', 'excellent', 1, 'The bathroom is a small hotel. You wouldn’t change a tap.'),
  room('bathroom', 'excellent', 2, 'Stone, brass, a window. It’s better than yours will ever be, unless this is yours.'),
  room('outside', 'worn', 1, 'Outside is a job: fencing down, a lawn that has been a meadow for a summer.'),
  room('outside', 'worn', 2, 'The garden has potential, which is the word for work.'),
  room('outside', 'fair', 1, 'A yard you could sit in, with a table you’d have to buy.'),
  room('outside', 'fair', 2, 'Outside is tidy and unloved. It would take a year to be yours.'),
  room('outside', 'good', 1, 'A garden somebody has kept. There’s a tree with a swing in it and a swing in the price.'),
  room('outside', 'good', 2, 'Outside is quiet, and the quiet is the thing you’d be paying for.'),
  room('outside', 'excellent', 1, 'You walk to the end of the garden and turn round and the house looks like a house you own.'),
  room('outside', 'excellent', 2, 'Outside is the reason. {first} waits by the door and lets it work.'),

  // --- Asking the agent --------------------------------------------------------------
  A('answer', 'ask', 'market.1', '"Listed {days} days. That’s about normal for this street."', { when: { move: ['market'] } }),
  A('answer', 'ask', 'market.2', '"{days} days. Enough that the seller is listening, not so many that something is wrong with it."', { when: { move: ['market'], tone: ['warm'] } }),
  A('answer', 'ask', 'market.3', '"{days} days on the market. I don’t read anything into it and neither should you."', { when: { move: ['market'], tone: ['firm'] } }),
  A('answer', 'ask', 'why.keen.1', '"Between us, they need it gone. A job elsewhere. A fair offer this month gets a fair hearing."', { when: { move: ['why'], flags: ['keen'] } }),
  A('answer', 'ask', 'why.keen.2', '"They have somewhere to be. I wouldn’t wait to make an offer if you like it."', { when: { move: ['why'], flags: ['keen'], tone: ['firm'] } }),
  A('answer', 'ask', 'why.steady.1', '"No rush on their side. They’ll take the right number and not the first one."', { when: { move: ['why'], flags: ['steady'] } }),
  A('answer', 'ask', 'why.steady.2', '"They’re moving up, not out. They can afford to wait, and they know it."', { when: { move: ['why'], flags: ['steady'], tone: ['warm'] } }),
  A('answer', 'ask', 'offers.quiet.1', '"Nothing on paper. I would tell you if there were; it helps me."', { when: { move: ['offers'], flags: ['quiet'] } }),
  A('answer', 'ask', 'offers.quiet.2', '"No offers yet. That won’t be true for long at this price."', { when: { move: ['offers'], flags: ['quiet'], tone: ['warm'] } }),
  A('answer', 'ask', 'area.1', '"{hood}. You know it or you don’t. Coffee is four minutes; the airport is forty."', { when: { move: ['area'] } }),
  A('answer', 'ask', 'area.2', '"{hood} is quiet at night and loud on Saturdays, and I would rather you heard it from me."', { when: { move: ['area'], tone: ['firm'] } }),
  A('answer', 'ask', 'area.3', '"I live two streets from here myself. {hood} is a good place to come home to."', { when: { move: ['area'], tone: ['warm'] } }),
  A('answer', 'ask', 'price.1', '"Asking is {asking}. What the seller takes is a different number, and I don’t know it either."', { when: { move: ['price'] } }),
  A('answer', 'ask', 'price.2', '"{asking}. Offer what it is worth to you and let me do the talking upstairs."', { when: { move: ['price'], tone: ['warm'] } }),

  // --- The call: the seller came back -------------------------------------------------
  A('call', 'counter', 'open.1', '{first} calls before you have finished your coffee. "They came back. {counter}. I think that’s a real number, not a first one."', { when: { result: ['open'] }, speaker: 'narrator' }),
  A('call', 'counter', 'open.2', '"It’s {first}. Good news and a number: {counter}. They aren’t far from you."', { when: { result: ['open'], tone: ['warm'] } }),
  A('call', 'counter', 'open.3', '"{first}. Counter is {counter}. Take it, come back, or leave it. I wouldn’t leave it."', { when: { result: ['open'], tone: ['firm'] } }),
  A('call', 'counter', 'again.1', '"{first} again. Second time back: {counter}. That’s as far as they go, in my experience."', { when: { result: ['open'], flags: ['second'] } }),
  A('call', 'counter', 'accepted.1', '"Done. I’ll tell them tonight. Inspection in five days, closing in a month. Congratulations, I think."', { when: { result: ['accepted'] } }),
  A('call', 'counter', 'accepted.2', '"Good. That’s a house, then. I’ll send the dates."', { when: { result: ['accepted'], tone: ['firm'] } }),
  A('call', 'counter', 'accepted.3', '"Oh, I’m pleased. I’ll call them now. Go and stand outside it tonight; people do."', { when: { result: ['accepted'], tone: ['warm'] } }),
  A('call', 'counter', 'countered.1', '"{amount}. I’ll put it to them. Give it a day or two; they don’t answer quickly, but they answer."', { when: { result: ['countered'] } }),
  A('call', 'counter', 'countered.2', '"{amount}. Fine. I’ll take it up. Don’t fall in love with it while you wait."', { when: { result: ['countered'], tone: ['firm'] } }),
  A('call', 'counter', 'countered.3', '"{amount}. I can work with that. Let me ring them before they go out for dinner."', { when: { result: ['countered'], tone: ['warm'] } }),
  A('call', 'counter', 'walked.1', '"Understood. Deposit goes back to you in a day or so. There will be another house."', { when: { result: ['walked'] } }),
  A('call', 'counter', 'walked.2', '"Your call. I’ll tell them. If they come down later I’ll let you know, and they sometimes do."', { when: { result: ['walked'], tone: ['warm'] } }),

  // --- The inspection, room by room with the inspector -------------------------------------
  A('inspect', 'meet', 'kerb.1', '{first} is at the curb with a clipboard and a torch, and has already been under the house. "Walk with me. I’ll show you what I wrote down."', { when: { flags: ['work'] }, speaker: 'narrator', role: 'inspector' }),
  A('inspect', 'meet', 'kerb.2', '{first} has the report in a folder and the look of somebody who has seen worse. "None of this is a surprise for a house this age. Come and see."', { when: { flags: ['work'] }, speaker: 'narrator', role: 'inspector' }),
  A('inspect', 'meet', 'clean.1', '{first} is leaning on the van with the report already signed. "Short list. You bought well, or you got lucky."', { when: { flags: ['clean'] }, speaker: 'narrator', role: 'inspector' }),
  A('inspect', 'meet', 'clean.2', '{first} hands you two pages where there are usually six. "Nothing I would lose sleep over. I looked hard."', { when: { flags: ['clean'] }, speaker: 'narrator', role: 'inspector' }),
  A('inspect', 'meet', 'report.1', 'You read the report at the kitchen table with the coffee going cold. {count} items, in {first}\'s careful hand.', { when: { flags: ['report'] }, speaker: 'narrator', role: 'world' }),
  A('inspect', 'walk', 'minor.1', '"{item}. Minor. About {estimate}. I would do it in the first year and not lose sleep."', { when: { flags: ['minor'] }, role: 'inspector' }),
  A('inspect', 'walk', 'minor.2', '"{item}. That’s a weekend and {estimate}, or a phone call and a little more."', { when: { flags: ['minor'] }, role: 'inspector' }),
  A('inspect', 'walk', 'moderate.1', '"{item}. I would call that moderate: {estimate} if you do it now, more if you wait. Get a second quote."', { when: { flags: ['moderate'] }, role: 'inspector' }),
  A('inspect', 'walk', 'moderate.2', '"{item}. Not dangerous, not cheap. Budget {estimate} and be pleasantly surprised."', { when: { flags: ['moderate'] }, role: 'inspector' }),
  A('inspect', 'walk', 'major.1', '"{item}. This is the one. About {estimate}, and I would want it in the price or done before you move in."', { when: { flags: ['major'] }, role: 'inspector' }),
  A('inspect', 'walk', 'major.2', '{first} stops and puts the torch on it. "{item}. Major. {estimate}, and that’s if nothing else is behind it."', { when: { flags: ['major'] }, speaker: 'narrator', role: 'inspector' }),
  A('inspect', 'verdict', 'clean.1', '"That’s everything. If you want my opinion, which you are paying for: proceed."', { when: { flags: ['clean'] }, role: 'inspector' }),
  A('inspect', 'verdict', 'work.1', '"That’s the list. It’s a house, not a problem; but it is a house with a list. Ask for money or ask for the work."', { when: { flags: ['work'] }, role: 'inspector' }),
  A('inspect', 'verdict', 'work.2', '"I have seen buyers walk from less and buyers close on more. Decide with the numbers, not the kitchen."', { when: { flags: ['work'] }, role: 'inspector' }),
  A('inspect', 'verdict', 'reduced.1', '{first} hears the seller agreed to the reduction and nods once. "Good. That’s what the report is for."', { when: { flags: ['reduced'] }, speaker: 'narrator', role: 'inspector' }),
  A('inspect', 'verdict', 'refused.1', '"They said no to the money. It happens. The list is still the list; you know what you are buying."', { when: { flags: ['refused'] }, role: 'inspector' }),
  A('inspect', 'verdict', 'walked.1', '"Fair enough. Better a week of looking than a year of paying. Keep the report; it’s yours."', { when: { flags: ['walked'] }, role: 'inspector' }),

  // --- Closing day, at the table -------------------------------------------------------------
  A('closing', 'table', 'open.1', '{first} slides the folder across. "Everything in here you have seen. Sign where the tabs are and it’s yours by the time you reach the car."', { when: { result: ['open'] }, speaker: 'narrator', role: 'closer' }),
  A('closing', 'table', 'open.2', '"{first}, escrow. The numbers on page one are the numbers. If they aren’t what you expected, say so before the pen."', { when: { result: ['open'] }, role: 'closer' }),
  A('closing', 'table', 'open.3', '{first} has three copies and a pen that works. "This is the boring part. The boring part is the part that matters."', { when: { result: ['open'] }, speaker: 'narrator', role: 'closer' }),
  A('closing', 'table', 'short.1', '"We’re short at the table. {shortfall}. I can’t record without it. Wire it today or we reschedule."', { when: { result: ['open'], flags: ['short'] }, role: 'closer' }),
  A('closing', 'table', 'short.2', '{first} taps the line. "You’re {shortfall} light. It happens more than you’d think. It doesn’t happen twice."', { when: { result: ['open'], flags: ['short'] }, speaker: 'narrator', role: 'closer' }),
  A('closing', 'table', 'signed.1', '{first} stacks the pages, checks a signature, and puts a key on the table. "Recorded. Congratulations."', { when: { result: ['signed'] }, speaker: 'narrator', role: 'closer' }),
  A('closing', 'table', 'signed.2', '"That’s recorded. The keys are yours; the mortgage is also yours. Both of those are true from now."', { when: { result: ['signed'], flags: ['financed'] }, role: 'closer' }),
  A('closing', 'table', 'signed.3', '"Cash closes clean. Recorded. Go and stand in it."', { when: { result: ['signed'], flags: ['cash'] }, role: 'closer' }),
  A('closing', 'table', 'postponed.1', '"Three days. I’ll tell the seller. They won’t love it, but they’ll wait once."', { when: { result: ['postponed'] }, role: 'closer' }),
  A('closing', 'table', 'postponed.2', '{first} closes the folder without a sigh, which is professional of them. "Same table, three days. Bring the money."', { when: { result: ['postponed'] }, speaker: 'narrator', role: 'closer' }),
  A('closing', 'table', 'walked.1', '{first} caps the pen. "Then we’re done, and the deposit stays with them. I’m sorry. It’s in the contract you signed."', { when: { result: ['walked'] }, speaker: 'narrator', role: 'closer' }),
  A('closing', 'table', 'failed.1', '"The lender pulled it this morning. I’m sorry. Your deposit comes back; the house doesn’t."', { when: { result: ['failed'] }, role: 'closer' }),
  A('closing', 'table', 'failed.2', '"We can’t record without the funds. Your deposit will be returned. I wish it were different."', { when: { result: ['failed'] }, role: 'closer' }),

  // --- Moving in: the empty rooms ------------------------------------------------------------
  A('movein', 'door', 'first.1', 'The key turns like it has been waiting. The house is empty and louder for it; every step comes back to you.', { when: { flags: ['first'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'door', 'first.2', 'Boxes in the hall, light on the floor, nothing on the walls. It smells of somebody else for one more day.', { when: { flags: ['first'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'door', 'again.1', 'Your key, your door, your rooms. Some of them are still waiting for you.', { when: { flags: ['returning'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'door', 'again.2', 'Home, with the boxes gone and a few rooms still echoing. You know which ones.', { when: { flags: ['returning'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'room', 'bare.1', 'You leave it as it is. A room can wait; the floor is clean and the light is good.', { when: { flags: ['bare'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'room', 'bare.2', 'Nothing in here yet. You stand in the middle of it and decide it will be the last room you do.', { when: { flags: ['bare'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'room', 'comfortable.1', 'Enough to live in: the pieces you need, delivered by people who know which way a sofa goes through a door.', { when: { flags: ['comfortable'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'room', 'comfortable.2', 'By evening it’s a room. Not finished; a room.', { when: { flags: ['comfortable'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'room', 'proper.1', 'Done properly: the good pieces, the rug that changes the sound of the room, a lamp in the corner that makes the evening.', { when: { flags: ['proper'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'room', 'proper.2', 'It looks like the photographs of somebody else\'s house, and it’s yours.', { when: { flags: ['proper'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'done', 'night.1', 'The first night in a new house is never quiet. You lie there and listen to it learn you.', { when: { flags: ['first'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'done', 'night.2', 'You sleep in it. That’s what makes it yours, more than the papers did.', { when: { flags: ['first'] }, speaker: 'narrator', role: 'world' }),
  A('movein', 'done', 'again.1', 'Another room done. The house is catching up with the idea of you.', { when: { flags: ['returning'] }, speaker: 'narrator', role: 'world' }),

  // --- The offer -----------------------------------------------------------------------
  A('offer', 'table', 'made.1', '{first} writes it down without a flicker. "I’ll take it to them tonight. You’ll hear within a day or two."', { speaker: 'narrator' }),
  A('offer', 'table', 'made.2', '{first} reads the number back to you, once. "Understood. I’ll call."', { when: { tone: ['firm'] }, speaker: 'narrator' }),
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
    { purpose: 'call', beat: 'counter', result: ['open', 'accepted', 'countered', 'walked'] },
    { purpose: 'call', beat: 'counter', result: ['open'], flags: ['second'] },
    { purpose: 'inspect', beat: 'meet', flags: ['work'] },
    { purpose: 'inspect', beat: 'meet', flags: ['clean'] },
    { purpose: 'inspect', beat: 'meet', flags: ['report'] },
    { purpose: 'inspect', beat: 'walk', flags: ['minor'] },
    { purpose: 'inspect', beat: 'walk', flags: ['moderate'] },
    { purpose: 'inspect', beat: 'walk', flags: ['major'] },
    { purpose: 'inspect', beat: 'verdict', flags: ['clean'] },
    { purpose: 'inspect', beat: 'verdict', flags: ['work'] },
    { purpose: 'inspect', beat: 'verdict', flags: ['reduced'] },
    { purpose: 'inspect', beat: 'verdict', flags: ['refused'] },
    { purpose: 'inspect', beat: 'verdict', flags: ['walked'] },
    { purpose: 'closing', beat: 'table', result: ['open', 'signed', 'postponed', 'walked', 'failed'] },
    { purpose: 'closing', beat: 'table', result: ['open'], flags: ['short'] },
    { purpose: 'closing', beat: 'table', result: ['signed'], flags: ['financed'] },
    { purpose: 'closing', beat: 'table', result: ['signed'], flags: ['cash'] },
    { purpose: 'movein', beat: 'door', flags: ['first'] },
    { purpose: 'movein', beat: 'door', flags: ['returning'] },
    { purpose: 'movein', beat: 'room', flags: ['bare'] },
    { purpose: 'movein', beat: 'room', flags: ['comfortable'] },
    { purpose: 'movein', beat: 'room', flags: ['proper'] },
    { purpose: 'movein', beat: 'done', flags: ['first'] },
    { purpose: 'movein', beat: 'done', flags: ['returning'] },
  ],
};
