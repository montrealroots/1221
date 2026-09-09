/**
 * Health — the desk, the wait, the room, the verdict, the desk again.
 *
 * Simulated care, not medical advice: nothing here diagnoses anything. The
 * receptionist speaks to your card; the doctor speaks to what you said
 * brought you in and to what the exam decided; the pharmacist speaks to
 * the bag. Every provider is SLATE's own.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'health';
const H = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'clinician', ...opts });

const ask = (spec: string, n: number, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  H('ask', 'room', `${spec}.${n}`, text, { ...opts, when: { ...(opts.when ?? {}), flags: [spec, ...(opts.when?.flags ?? [])] } });

const LINES: DialogueLine[] = [
  // --- The desk ------------------------------------------------------------------------------
  H('reception', 'desk', 'in.1', 'The receptionist takes your card, types, and hands it back. "You’re covered here. Take a seat; it won’t be long."', { when: { flags: ['in'] }, speaker: 'narrator', role: 'reception' }),
  H('reception', 'desk', 'in.2', '"Card, please. Lovely. That’s {pay} today and we bill the rest. Have a seat."', { when: { flags: ['in'] }, role: 'reception' }),
  H('reception', 'desk', 'out.1', 'The receptionist looks at your card longer than is comfortable. "We don’t take {carrier}. Today is {pay}, and you can claim it back yourself, sometimes."', { when: { flags: ['out'] }, speaker: 'narrator', role: 'reception' }),
  H('reception', 'desk', 'out.2', '"I’m sorry, we aren’t in network with {carrier}. It’s the full {pay}. Do you still want to be seen?"', { when: { flags: ['out'] }, role: 'reception' }),
  H('reception', 'desk', 'none.1', '"No insurance? That’s fine. It’s {pay} today, at the desk, before or after. Have a seat."', { when: { flags: ['none'] }, role: 'reception' }),
  H('reception', 'desk', 'none.2', 'No card to hand over. The receptionist writes the number down without looking up: {pay}.', { when: { flags: ['none'] }, speaker: 'narrator', role: 'reception' }),
  H('reception', 'desk', 'returning.1', '"Welcome back. Same details? Take a seat."', { when: { requires: ['met'] }, role: 'reception' }),

  // --- The wait -------------------------------------------------------------------------------
  H('wait', 'room', 'wait.1', 'A waiting room like every waiting room: a fish tank, a magazine from a different year, a child who doesn’t want to be here either.', { speaker: 'narrator', role: 'world' }),
  H('wait', 'room', 'wait.2', 'Fifteen minutes on a chair designed by somebody who has never sat in one. Then your name, pronounced almost right.', { speaker: 'narrator', role: 'world' }),
  H('wait', 'room', 'wait.3', 'You read the posters twice. One of them is about you, but you don’t know which.', { speaker: 'narrator', role: 'world' }),

  // --- The room: what brought you in ----------------------------------------------------------
  ask('primary', 1, '"So. What brings you in?"'),
  ask('primary', 2, '{first} looks at the screen, then at you, which is the right order. "What can I do for you today?"', { speaker: 'narrator' }),
  ask('primary', 3, '"Good to see you again. What are we looking at?"', { when: { requires: ['met'] } }),
  ask('dentist', 1, '"Have a seat. Open up in a minute; first, tell me what is bothering you."'),
  ask('dentist', 2, '{first} snaps on gloves. "Anything hurting, or just the six-month visit you keep meaning to make?"', { speaker: 'narrator' }),
  ask('optometrist', 1, '"Chin here. Before we start, what have you noticed?"'),
  ask('optometrist', 2, '"Tell me about the eyes. Distance, close, screens?"'),
  ask('chiropractor', 1, '"Where is it, and how long has it been there?"'),
  ask('chiropractor', 2, '{first} watches you sit down before saying anything. "Tell me what you do all day, and then tell me where it hurts."', { speaker: 'narrator' }),
  ask('physical_therapy', 1, '"Show me the movement that isn’t working."'),
  ask('physical_therapy', 2, '"Walk to the wall and back for me. Then tell me what happened."'),
  ask('specialist', 1, '"Your doctor sent a note. I want to hear it from you."'),
  ask('specialist', 2, '{first} has read the file and closes it. "In your own words."', { speaker: 'narrator' }),
  ask('urgent_care', 1, '"Right. What has happened?"'),
  ask('urgent_care', 2, '"Sit. Talk. We’ll get to the paperwork."'),
  ask('emergency', 1, '"Okay. Look at me. What is going on?"'),
  ask('emergency', 2, 'Everything in the room is moving except {first}, who is looking at you. "Tell me."', { speaker: 'narrator' }),
  ask('counseling', 1, '"Take your time. What made you book this?"'),
  ask('counseling', 2, '{first} doesn’t have a screen. "Start anywhere."', { speaker: 'narrator' }),
  ask('counseling', 3, '"Last time we talked about the pressure. Where is it today?"', { when: { requires: ['met'] } }),

  // --- The exam, and the verdict ---------------------------------------------------------------
  H('exam', 'verdict', 'fine.1', '"Nothing here I would worry about. Come back if it changes, and come back anyway in a while."', { when: { result: ['fine'] } }),
  H('exam', 'verdict', 'fine.2', '{first} finishes writing and turns the screen away. "You’re fine. Genuinely. Go and be busy."', { when: { result: ['fine'] }, speaker: 'narrator' }),
  H('exam', 'verdict', 'fine.3', '"I have looked, and I have looked properly. It’s nothing. That’s allowed."', { when: { result: ['fine'], tone: ['warm'] } }),
  H('exam', 'verdict', 'tests.1', '"I want to run some tests. Not because I’m worried; because I would rather know. Two days."', { when: { result: ['tests'] } }),
  H('exam', 'verdict', 'tests.2', '{first} orders bloods and something with a longer name. "Results in a couple of days. We’ll call either way."', { when: { result: ['tests'] }, speaker: 'narrator' }),
  H('exam', 'verdict', 'tests.3', '"Tests. I would rather have the picture than the guess."', { when: { result: ['tests'], tone: ['firm'] } }),
  H('exam', 'verdict', 'treat.1', '"I’m writing you something. Take it as it says on the box, not as you feel like it."', { when: { result: ['treat'] } }),
  H('exam', 'verdict', 'treat.2', '{first} types, prints, signs. "Any pharmacy. Finish the course even when you feel better; especially then."', { when: { result: ['treat'] }, speaker: 'narrator' }),
  H('exam', 'verdict', 'treat.3', '"A short course and some sense. The sense is the part people skip."', { when: { result: ['treat'], tone: ['firm'] } }),
  H('exam', 'verdict', 'wrongdoor.1', '"This isn’t really my corner. I’ll do what I can today and point you at who you actually need."', { when: { flags: ['wrongdoor'] } }),

  // --- The desk again ----------------------------------------------------------------------------
  H('farewell', 'desk', 'paid.1', 'The card goes through. {pay}, a receipt you’ll lose, and the door.', { when: { result: ['paid'] }, speaker: 'narrator', role: 'reception' }),
  H('farewell', 'desk', 'paid.2', '"{pay}. Thank you. Mind the step."', { when: { result: ['paid'] }, role: 'reception' }),
  H('farewell', 'desk', 'free.1', 'Nothing to pay at the desk; the card did the work. You’re out before the child is in.', { when: { result: ['free'] }, speaker: 'narrator', role: 'reception' }),
  H('farewell', 'desk', 'billed.1', '"We’ll send it on. {pay}. It doesn’t go away, but it can wait a little."', { when: { result: ['billed'] }, role: 'reception' }),
  H('farewell', 'desk', 'billed.2', 'The receptionist writes your address on an envelope while you watch. {pay}, owed.', { when: { result: ['billed'] }, speaker: 'narrator', role: 'reception' }),

  // --- The pharmacy ------------------------------------------------------------------------------
  H('pharmacy', 'counter', 'fill.1', 'The pharmacist reads the script, reads it again, and puts a white bag on the counter. "{medication}. As it says on the label."', { speaker: 'narrator', role: 'pharmacist' }),
  H('pharmacy', 'counter', 'fill.2', '"{medication}. {pay} today. Any questions, ask; nobody does."', { role: 'pharmacist' }),
  H('pharmacy', 'counter', 'fill.3', 'A queue, a number, a bag with your name spelled almost right. {medication}.', { speaker: 'narrator', role: 'world' }),

  // --- Results ------------------------------------------------------------------------------------
  H('results', 'call', 'clear.1', '"All clear. Nothing on any of it. Have a good week."', { when: { result: ['clear'] } }),
  H('results', 'call', 'clear.2', 'A voicemail with {first}\'s name at the end of it: clear, clear, clear.', { when: { result: ['clear'] }, speaker: 'narrator' }),
  H('results', 'call', 'follow.1', '"There’s one thing I would like to look at again. Not an emergency. Can you come in?"', { when: { result: ['follow_up'] } }),
  H('results', 'call', 'follow.2', '{first} calls in person, which tells you something before the words do. "Come back in. We’ll talk properly."', { when: { result: ['follow_up'] }, speaker: 'narrator' }),
];

export const HEALTH_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'reception', beat: 'desk', flags: ['in'] },
    { purpose: 'reception', beat: 'desk', flags: ['out'] },
    { purpose: 'reception', beat: 'desk', flags: ['none'] },
    { purpose: 'wait', beat: 'room' },
    ...['primary', 'dentist', 'optometrist', 'chiropractor', 'physical_therapy', 'specialist', 'urgent_care', 'emergency', 'counseling'].map((spec) => ({ purpose: 'ask', beat: 'room', flags: [spec] })),
    { purpose: 'exam', beat: 'verdict', result: ['fine', 'tests', 'treat'] },
    { purpose: 'exam', beat: 'verdict', flags: ['wrongdoor'] },
    { purpose: 'farewell', beat: 'desk', result: ['paid', 'free', 'billed'] },
    { purpose: 'pharmacy', beat: 'counter' },
    { purpose: 'results', beat: 'call', result: ['clear', 'follow_up'] },
  ],
};
