/**
 * Vehicles — what is said on the lot and across the desk.
 *
 * The salesperson's voice is a condition: warm ones meet you part of the
 * way in words, firm ones tell you the number and stop. What they say
 * about you depends on what they know — that you bought here, that you
 * walked away, that you drove the car — and never on what they could not.
 * Every line answers a thing the deal has already decided.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'vehicles';
const V = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'salesperson', ...opts });

const LINES: DialogueLine[] = [
  // --- The greeting on the lot ----------------------------------------------------
  V('greet', 'lot', 'first.1', '{first} comes over, hand out. "Anything in particular, or just looking?"', { when: { flags: ['first_visit'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'first.2', '{first} appears from between two cars. "Take your time. I am here when you want me."', { when: { flags: ['first_visit'], tone: ['warm'], forbids: ['bike', 'boat', 'jet'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'first.bike', '{first} looks up from a bike on the lift. "Have a sit on anything. Just do not drop it."', { when: { flags: ['first_visit'], requires: ['bike'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'first.boat', '{first} walks up the pontoon wiping their hands. "Looking for something for the weekends, or something to live on?"', { when: { flags: ['first_visit'], requires: ['boat'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'first.jet', '{first} meets you at the terminal door with a folder under one arm. "Everything on the ramp has its logbooks in here. Where do you want to start?"', { when: { flags: ['first_visit'], requires: ['jet'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'first.3', '{first} nods from the office door. "Prices are on the screens. Ask when you are ready."', { when: { flags: ['first_visit'], tone: ['firm'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'again.1', '{first} again. "Back for another look?"', { when: { forbids: ['bought', 'walked', 'drove'], flags: ['returning'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'bought.1', '{first} is out of the office before you have parked. "How is it treating you? Looking for a second one?"', { when: { requires: ['bought'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'bought.2', '{first} waves you in like family. "The one we sold you still running? Good. Come and see what came in."', { when: { requires: ['bought'], tone: ['warm'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'bought.boat', '{first} spots you from the office window and comes down. "Still afloat? Good. There is something on the end berth you should see."', { when: { requires: ['bought', 'boat'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'bought.jet', '{first} has your coffee order remembered. "How are the hours going? I have one on the ramp with a bigger cabin, if that is where you are heading."', { when: { requires: ['bought', 'jet'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'walked.1', '{first} recognises you. "Thought you might be back. It is still here."', { when: { requires: ['walked'], forbids: ['bought'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'walked.2', '{first} raises an eyebrow. "The number has not changed since you left. Neither has the car."', { when: { requires: ['walked'], forbids: ['bought'], tone: ['firm'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'drove.1', '{first} remembers you. "You drove the {car}. Still thinking about it?"', { when: { requires: ['drove'], forbids: ['bought', 'walked', 'boat', 'jet'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'drove.boat', '{first} remembers you. "You took the {car} out. It has not stopped being the right boat."', { when: { requires: ['drove', 'boat'], forbids: ['bought', 'walked'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'drove.jet', '{first} remembers you. "You flew in the {car}. The crew asked after you."', { when: { requires: ['drove', 'jet'], forbids: ['bought', 'walked'] }, speaker: 'narrator' }),
  V('greet', 'lot', 'none.1', 'Somebody comes over from the office before you have shut the door.', { when: { flags: ['nobody'] }, speaker: 'narrator' }),

  // --- Opening a car -------------------------------------------------------------------
  V('open', 'car', 'first.1', '{first} walks you over. "The {car}. {ask} on the screen, and I can tell you everything about it."', { when: { flags: ['first_visit'], forbids: ['boat', 'jet'] }, speaker: 'narrator' }),
  V('open', 'car', 'first.2', '{first} pats the roof. "{car}. {ask}. Sit in it before you decide anything."', { when: { flags: ['first_visit'], tone: ['warm'], forbids: ['bike', 'boat', 'jet'] }, speaker: 'narrator' }),
  V('open', 'car', 'first.bike', '{first} pulls it off the side stand for you. "{car}. {ask}. Throw a leg over and see how it sits."', { when: { flags: ['first_visit'], requires: ['bike'] }, speaker: 'narrator' }),
  V('open', 'car', 'first.boat', '{first} steps aboard first and holds out a hand. "The {car}. {ask} as she sits, and everything on her works."', { when: { flags: ['first_visit'], requires: ['boat'] }, speaker: 'narrator' }),
  V('open', 'car', 'first.jet', '{first} lowers the airstair. "The {car}. {ask}, on program, with the logbooks complete. After you."', { when: { flags: ['first_visit'], requires: ['jet'] }, speaker: 'narrator' }),
  V('open', 'car', 'again.1', '{first} remembers you. "Back for another look? The {car} is {ask}."', { when: { flags: ['returning'] }, speaker: 'narrator' }),
  V('open', 'car', 'again.boat', '{first} remembers you. "She is still here. {ask}, and I have not moved on that since you left."', { when: { flags: ['returning'], requires: ['boat'] }, speaker: 'narrator' }),

  // --- Looking it over --------------------------------------------------------------------
  V('inspect', 'car', 'levers.1', '{first} watches you look. "Nothing you would not expect at the price."', { when: { flags: ['levers'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'levers.2', '{first} folds their arms while you crouch by the wheel. "Go on. Ask."', { when: { flags: ['levers'], tone: ['firm'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'levers.3', '{first} winces a little at what you find. "We would have sorted that before it went out."', { when: { flags: ['levers'], tone: ['warm'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'clean.1', '{first} lets you look. "Take your time. It speaks for itself."', { when: { flags: ['clean'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'clean.2', '{first} does not even come over. It is that kind of car.', { when: { flags: ['clean'], forbids: ['bike', 'boat', 'jet'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'clean.boat', '{first} lifts a hatch you had not noticed so you can see the bilge is dry. "Nothing to hide down there."', { when: { flags: ['clean'], requires: ['boat'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'clean.jet', '{first} opens the logbooks on the table without being asked. "Every hour is in there. Take as long as you like."', { when: { flags: ['clean'], requires: ['jet'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'levers.boat', '{first} watches you find it and does not argue. "Boats. There is always something. Tell me what it is worth to you."', { when: { flags: ['levers'], requires: ['boat'] }, speaker: 'narrator' }),
  V('inspect', 'car', 'levers.jet', '{first} nods at what you found. "It is in the pre-buy. I would rather you saw it now than at the inspection."', { when: { flags: ['levers'], requires: ['jet'] }, speaker: 'narrator' }),

  // --- Back from the drive ------------------------------------------------------------------
  V('drive', 'back', 'so.1', 'Back on the lot. "So?"', { when: { forbids: ['boat', 'jet'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.2', '{first} is waiting with the keys held out for you to hand back. "Well?"', { when: { forbids: ['boat', 'jet'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.3', '{first} does not ask. {first} just watches you get out slowly.', { when: { tone: ['firm'], forbids: ['bike', 'boat', 'jet'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.bike', '{first} takes the helmet back and looks at your face before you have said anything. "That grin is the answer."', { when: { requires: ['bike'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.boat', 'Back alongside. {first} throws the line and steps off. "Well? Tell me on the pontoon."', { when: { requires: ['boat'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.boat2', '{first} makes the boat fast and says nothing until the engines are off. "That is the boat. You know it is."', { when: { requires: ['boat'], tone: ['warm'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.jet', 'The airstair comes down on the ramp. {first} is waiting at the bottom of it. "An hour. What did you think?"', { when: { requires: ['jet'] }, speaker: 'narrator' }),
  V('drive', 'back', 'so.jet2', '{first} lets the pilots leave before saying anything. "There is no better cabin for the money. You have sat in it now."', { when: { requires: ['jet'], tone: ['firm'] }, speaker: 'narrator' }),

  // --- The numbers ------------------------------------------------------------------------------
  V('counter', 'numbers', 'warm.1', 'I can meet you part of the way. {ask}.', { when: { tone: ['warm'] } }),
  V('counter', 'numbers', 'warm.2', 'Let me see what I can do. Say {ask}.', { when: { tone: ['warm'] } }),
  V('counter', 'numbers', 'warm.3', 'That is fair of you to ask. {ask} and we are close.', { when: { tone: ['warm'] } }),
  V('counter', 'numbers', 'warm.4', 'I want you in this car. {ask}, and that is me leaning.', { when: { tone: ['warm'], forbids: ['bike', 'boat', 'jet'] } }),
  V('counter', 'numbers', 'warm.boat', 'I want you on this boat. {ask}, and the yard bill is mine.', { when: { tone: ['warm'], requires: ['boat'] } }),
  V('counter', 'numbers', 'warm.jet', 'I want this airplane in your hangar. {ask}, and I will carry the pre-buy.', { when: { tone: ['warm'], requires: ['jet'] } }),
  V('counter', 'numbers', 'warm.bike', 'I want to see you ride out on it. {ask}, and I will throw in the first service.', { when: { tone: ['warm'], requires: ['bike'] } }),
  V('counter', 'numbers', 'firm.1', '{ask}. That is me moving.', { when: { tone: ['firm'] } }),
  V('counter', 'numbers', 'firm.2', 'I will not insult you with a number. {ask}.', { when: { tone: ['firm'] } }),
  V('counter', 'numbers', 'firm.3', 'I have got a manager to answer to. {ask}.', { when: { tone: ['firm'] } }),
  V('counter', 'numbers', 'firm.4', '{ask}. Write it down if you like; it will say the same thing tomorrow.', { when: { tone: ['firm'] } }),
  V('refuse', 'numbers', 'warm.1', 'I would love to, and I cannot. Come up and we will talk.', { when: { tone: ['warm'] } }),
  V('refuse', 'numbers', 'warm.2', 'That is not a number I can take upstairs.', { when: { tone: ['warm'] } }),
  V('refuse', 'numbers', 'warm.3', 'You are a long way off, and I say that as somebody who wants to sell you this car.', { when: { tone: ['warm'], forbids: ['bike', 'boat', 'jet'] } }),
  V('refuse', 'numbers', 'warm.boat', 'You are a long way off. Boats do not go for what people hope they go for, in either direction.', { when: { tone: ['warm'], requires: ['boat'] } }),
  V('refuse', 'numbers', 'warm.jet', 'That is not a number the owner will hear. They know what this airframe is worth to the hour.', { when: { tone: ['warm'], requires: ['jet'] } }),
  V('refuse', 'numbers', 'firm.1', 'No. That is not a serious offer.', { when: { tone: ['firm'] } }),
  V('refuse', 'numbers', 'firm.2', 'You know what it is worth. So do I.', { when: { tone: ['firm'] } }),
  V('refuse', 'numbers', 'firm.3', 'I heard you. The answer is the screen.', { when: { tone: ['firm'] } }),
  V('accept', 'numbers', 'any.1', '{price}. Done. Let me get the paperwork.'),
  V('accept', 'numbers', 'any.2', 'You have got a deal at {price}.'),
  V('accept', 'numbers', 'any.3', '{price} it is. Shake on it.'),
  V('accept', 'numbers', 'warm.1', '{price}. You drive a hard bargain and I like you for it.', { when: { tone: ['warm'] } }),
  V('accept', 'numbers', 'firm.1', '{price}. Do not tell anyone.', { when: { tone: ['firm'] } }),
  V('final', 'numbers', 'warm.1', '{ask} is the best I can do, honestly. That is where it stays.', { when: { tone: ['warm'] } }),
  V('final', 'numbers', 'warm.2', 'I have gone as far as I can go. {ask}. I hope you take it.', { when: { tone: ['warm'] } }),
  V('final', 'numbers', 'firm.1', '{ask}. That is the number. It does not move again.', { when: { tone: ['firm'] } }),
  V('final', 'numbers', 'firm.2', '{ask}. We are done talking about the price.', { when: { tone: ['firm'] } }),

  // --- The terms ------------------------------------------------------------------------------------
  V('terms', 'numbers', 'deliver.1', 'We can bring it to you. Give us a few days to get it ready.', { when: { move: ['deliver'] } }),
  V('terms', 'numbers', 'deliver.2', 'Delivery is fine. It goes through the workshop first and comes to you clean.', { when: { move: ['deliver'], tone: ['warm'] } }),
  V('terms', 'numbers', 'collect.1', 'Collecting it? It will be washed and out front.', { when: { move: ['collect'] } }),
  V('terms', 'numbers', 'collect.2', 'Collect it, then. Bring your license.', { when: { move: ['collect'], tone: ['firm'] } }),
  V('terms', 'numbers', 'tradein.1', '{first} walks round your {trade} twice. "I can allow {value} against it."', { when: { move: ['tradein'] }, speaker: 'narrator' }),
  V('terms', 'numbers', 'tradein.2', '{first} opens the door of your {trade}, closes it, listens to it. "{value}. I am being generous."', { when: { move: ['tradein'], tone: ['firm'] }, speaker: 'narrator' }),
  V('terms', 'numbers', 'tradein.3', '{first} likes your {trade} more than they let on. "{value} against it. That is fair."', { when: { move: ['tradein'], tone: ['warm'] }, speaker: 'narrator' }),
  V('terms', 'numbers', 'repairs.1', '{repairs} — fine. But that comes off what I can do on the price.', { when: { move: ['repairs'] } }),
  V('terms', 'numbers', 'repairs.2', 'We will do {repairs}. It goes on the sheet, and it comes out of my room.', { when: { move: ['repairs'], tone: ['firm'] } }),

  // --- The signature, the call -----------------------------------------------------------------------
  V('sign', 'desk', 'any.1', '{first} shakes your hand. "Enjoy it."', { speaker: 'narrator' }),
  V('sign', 'desk', 'warm.1', '{first} shakes your hand with both of theirs. "Drive it like you mean it. And come back and tell me."', { when: { tone: ['warm'] }, speaker: 'narrator' }),
  V('sign', 'desk', 'firm.1', '{first} slides the keys across. "Service is due at the number on the sheet. Do not miss it."', { when: { tone: ['firm'], forbids: ['boat', 'jet'] }, speaker: 'narrator' }),
  V('sign', 'desk', 'bike.1', '{first} hands over the keys and a helmet bag. "Ride it in gently for the first few hundred. Then do not."', { when: { requires: ['bike'] }, speaker: 'narrator' }),
  V('sign', 'desk', 'boat.1', '{first} hands you the keys and the documentation folder. "She is yours. Berth fees start next month; the yard will want to see her every hundred hours."', { when: { requires: ['boat'] }, speaker: 'narrator' }),
  V('sign', 'desk', 'jet.1', '{first} shakes your hand and hands over a folder as thick as a phone book. "The registration transfers this week. The crew are on standby from tomorrow, and the hangar is yours from today."', { when: { requires: ['jet'] }, speaker: 'narrator' }),
  V('callback', 'phone', 'any.1', '{first} called. They will do {price} if you come in this week.', { speaker: 'narrator' }),
  V('callback', 'phone', 'warm.1', '{first} called, sounding pleased with themselves. "{price}. I fought for that. This week."', { when: { tone: ['warm'] }, speaker: 'narrator' }),
  V('callback', 'phone', 'firm.1', 'A message from {first}: "{price}. Until Friday. Then it goes back on the screen."', { when: { tone: ['firm'] }, speaker: 'narrator' }),
];

export const VEHICLES_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'greet', beat: 'lot', flags: ['first_visit'] },
    { purpose: 'greet', beat: 'lot', flags: ['first_visit'], facts: ['bike'] },
    { purpose: 'greet', beat: 'lot', flags: ['first_visit'], facts: ['boat'] },
    { purpose: 'greet', beat: 'lot', flags: ['first_visit'], facts: ['jet'] },
    { purpose: 'open', beat: 'car', flags: ['first_visit'], facts: ['boat'] },
    { purpose: 'open', beat: 'car', flags: ['first_visit'], facts: ['jet'] },
    { purpose: 'inspect', beat: 'car', flags: ['clean'], facts: ['boat'] },
    { purpose: 'drive', beat: 'back', facts: ['boat'] },
    { purpose: 'drive', beat: 'back', facts: ['jet'] },
    { purpose: 'drive', beat: 'back', facts: ['bike'] },
    { purpose: 'sign', beat: 'desk', facts: ['boat'] },
    { purpose: 'sign', beat: 'desk', facts: ['jet'] },
    { purpose: 'open', beat: 'car', flags: ['first_visit'] },
    { purpose: 'open', beat: 'car', flags: ['returning'] },
    { purpose: 'inspect', beat: 'car', flags: ['levers'] },
    { purpose: 'inspect', beat: 'car', flags: ['clean'] },
    { purpose: 'drive', beat: 'back' },
    { purpose: 'counter', beat: 'numbers', tone: ['warm', 'firm'] },
    { purpose: 'refuse', beat: 'numbers', tone: ['warm', 'firm'] },
    { purpose: 'accept', beat: 'numbers' },
    { purpose: 'final', beat: 'numbers', tone: ['warm', 'firm'] },
    { purpose: 'terms', beat: 'numbers', move: ['deliver', 'collect', 'tradein', 'repairs'] },
    { purpose: 'sign', beat: 'desk' },
    { purpose: 'callback', beat: 'phone' },
  ],
};
