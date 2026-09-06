/**
 * Fitness — the desk, the floor, the bar, the trainer, the class, the walk out.
 *
 * Nothing here is medical or coaching advice: it is what people in a gym
 * actually say to each other. The front desk speaks to your membership; the
 * trainer speaks to the set you just did and to the goal you told them; the
 * room speaks to the hour. Every gym chain named in the game is either public
 * record or SLATE's own, and the places file says which.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'fitness';
const F = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'trainer', ...opts });

const LINES: DialogueLine[] = [
  // --- The front desk ------------------------------------------------------------------------------
  F('desk', 'entry', 'member.1', '"Morning. Scan when you are ready; the barcode has stopped working for everybody, not just you."', { when: { flags: ['member'] }, role: 'reception' }),
  F('desk', 'entry', 'member.2', 'The turnstile takes your card on the second go, which is its habit.', { when: { flags: ['member'] }, speaker: 'narrator', role: 'reception' }),
  F('desk', 'entry', 'member.3', '"You are in. Squat racks are all free, which will not last."', { when: { flags: ['member'] }, role: 'reception' }),
  F('desk', 'entry', 'member.4', '"Back again. At this rate we will have to put your name on something."', { when: { flags: ['member'], requires: ['regular'] }, role: 'reception' }),
  F('desk', 'entry', 'daypass.1', '"Just today? That is {pay}. Towel is two more and worth it."', { when: { flags: ['daypass'] }, role: 'reception' }),
  F('desk', 'entry', 'daypass.2', 'A day pass, a wristband and a locker key with a number rubbed almost off. {pay}.', { when: { flags: ['daypass'] }, speaker: 'narrator', role: 'reception' }),
  F('desk', 'entry', 'daypass.3', '"{pay} for the day. If you come back inside a month we knock it off the joining fee."', { when: { flags: ['daypass'] }, role: 'reception' }),
  F('desk', 'entry', 'lapsed.1', '"Your card is showing lapsed. I can take it as a day pass and sort the rest out after."', { when: { flags: ['lapsed'] }, role: 'reception' }),
  F('desk', 'entry', 'lapsed.2', 'The screen goes red. The person behind the desk has clearly had this conversation four times today.', { when: { flags: ['lapsed'] }, speaker: 'narrator', role: 'reception' }),
  F('desk', 'entry', 'join.1', '"First time? I will walk you round. It takes four minutes and everybody says no and then gets lost."', { when: { flags: ['first'] }, role: 'reception' }),
  F('desk', 'entry', 'join.2', 'Nobody looks up. You work out where the changing rooms are by following somebody who looks like they know.', { when: { flags: ['first'] }, speaker: 'narrator', role: 'world' }),
  F('desk', 'entry', 'peak.1', '"Fair warning, it is chest day and it is six o’clock. Cardio floor is emptier."', { when: { flags: ['busy'] }, role: 'reception' }),
  F('desk', 'entry', 'quiet.1', '"You have got the place to yourself. Enjoy it."', { when: { flags: ['quiet'] }, role: 'reception' }),
  F('desk', 'entry', 'quiet.2', 'Six in the morning and the only sound is a treadmill somebody left on and the hum of the lights.', { when: { flags: ['quiet'] }, speaker: 'narrator', role: 'world' }),

  // --- The room ------------------------------------------------------------------------------------
  F('room', 'floor', 'busy.1', 'Every bench is taken and two men are standing near one, doing that thing where they pretend not to be waiting.', { when: { flags: ['busy'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'busy.2', 'The dumbbell rack has been reorganised by somebody with strong feelings and no system.', { when: { flags: ['busy'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'busy.3', 'You wait for a rack behind somebody who is on their phone between sets, which is fine, and has been for eleven minutes, which is not.', { when: { flags: ['busy'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'quiet.1', 'Chalk dust in a shaft of light, and a stereo playing something the night staff chose.', { when: { flags: ['quiet'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'quiet.2', 'You get the good rack, the one under the fan, and nobody is going to ask you how many sets you have left.', { when: { flags: ['quiet'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'plain.1', 'Rubber, iron, disinfectant and somebody’s aftershave losing a fight with all three.', { speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'plain.2', 'A whiteboard by the door with today’s class times and a motivational line nobody has rubbed off since March.', { speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'plain.3', 'The mirrors are honest in a way you have not asked them to be.', { speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'luxury.1', 'Eucalyptus in the changing room, folded towels in a pyramid, and a water station with cucumber in it.', { when: { flags: ['luxury'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'luxury.2', 'Everything here is matte black and nobody grunts. There is a rule about it, unwritten and absolute.', { when: { flags: ['luxury'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'rough.1', 'A basement with a low ceiling, four platforms and a sign that says CHALK IS ALLOWED HERE, which tells you everything.', { when: { flags: ['hardcore'] }, speaker: 'narrator', role: 'world' }),
  F('room', 'floor', 'rough.2', 'Nobody in here is looking at anybody else, which is the most polite room in the city.', { when: { flags: ['hardcore'] }, speaker: 'narrator', role: 'world' }),

  // --- Warming up ------------------------------------------------------------------------------------
  F('warmup', 'floor', 'cold.1', 'The first ten minutes are a negotiation with a body that would rather be anywhere else.', { speaker: 'narrator', role: 'world' }),
  F('warmup', 'floor', 'cold.2', 'Bike, five minutes, nothing heroic. The knees stop complaining somewhere in the third.', { speaker: 'narrator', role: 'world' }),
  F('warmup', 'floor', 'cold.3', 'Empty bar, twelve reps, and the specific indignity of that being genuinely hard today.', { speaker: 'narrator', role: 'world' }),
  F('warmup', 'floor', 'sore.1', 'Yesterday is still in your legs. You find out exactly where on the first rep.', { when: { flags: ['sore'] }, speaker: 'narrator', role: 'world' }),
  F('warmup', 'floor', 'sore.2', '"Take the warm up seriously today. You are moving like a man carrying a piano."', { when: { flags: ['sore'], tone: ['dry'] } }),
  F('warmup', 'floor', 'fresh.1', 'Everything moves. Some days it just does, and there is no lesson in it.', { when: { flags: ['fresh'] }, speaker: 'narrator', role: 'world' }),
  F('warmup', 'floor', 'fresh.2', '"You have got something today. I can see it in the second warm up set. Do not waste it."', { when: { flags: ['fresh'], tone: ['warm'] } }),

  // --- The set ------------------------------------------------------------------------------------------
  F('set', 'lift', 'good.1', '"That is the one. That speed, that bar path, every rep."', { when: { result: ['good'] } }),
  F('set', 'lift', 'good.2', 'The bar goes up like it is lighter than the number on it, which is the only feeling worth paying a membership for.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  F('set', 'lift', 'good.3', '"Clean. Do not celebrate, do it again."', { when: { result: ['good'], tone: ['firm'] } }),
  F('set', 'lift', 'good.4', 'Five reps, the fifth as good as the first. You rack it and permit yourself the smallest nod.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  F('set', 'lift', 'good.5', '"Whatever you did last night, do it again tonight."', { when: { result: ['good'], tone: ['warm'] } }),
  F('set', 'lift', 'hard.1', '"Two more. I know. Two more."', { when: { result: ['hard'], tone: ['firm'] } }),
  F('set', 'lift', 'hard.2', 'The fourth rep takes as long as the first three together and you are not entirely present for it.', { when: { result: ['hard'] }, speaker: 'narrator', role: 'world' }),
  F('set', 'lift', 'hard.3', '"Breathe at the top. You are holding it and then wondering why the last one is hard."', { when: { result: ['hard'] } }),
  F('set', 'lift', 'hard.4', 'You rack the bar a rep earlier than the plan and stand there with your hands on your knees, doing arithmetic about your life.', { when: { result: ['hard'] }, speaker: 'narrator', role: 'world' }),
  F('set', 'lift', 'fail.1', '"Nope. Down. That is enough of that one."', { when: { result: ['failed'], tone: ['firm'] } }),
  F('set', 'lift', 'fail.2', 'It stops halfway and stays there, and then the spotter’s hands are under the bar and it is over.', { when: { result: ['failed'] }, speaker: 'narrator', role: 'world' }),
  F('set', 'lift', 'fail.3', '"Everybody misses. The ones who quit are the ones who take it personally."', { when: { result: ['failed'], tone: ['warm'] } }),
  F('set', 'lift', 'pr.1', '"That is a best. Write it down before you talk yourself out of believing it."', { when: { result: ['record'] } }),
  F('set', 'lift', 'pr.2', 'A number you have never done, done. The room does not notice and it does not matter.', { when: { result: ['record'] }, speaker: 'narrator', role: 'world' }),
  F('set', 'lift', 'pr.3', '"New number. Now we build the next twelve weeks off it."', { when: { result: ['record'], tone: ['firm'] } }),

  // --- Form ----------------------------------------------------------------------------------------------
  F('form', 'lift', 'fix.1', '"Knees are caving on the way up. Push them out and it will feel a hundred kilos lighter."', {}),
  F('form', 'lift', 'fix.2', '"You are pulling with your arms. Lats first, then arms, or you will find out about it in your elbows."', {}),
  F('form', 'lift', 'fix.3', '"Bar is drifting forward. Think about dragging it up your shirt."', {}),
  F('form', 'lift', 'fix.4', '"Stop looking at the ceiling. Chin down, eyes on a spot four feet in front."', { when: { tone: ['firm'] } }),
  F('form', 'lift', 'fix.5', 'The trainer moves your hand two inches along the bar and the whole thing suddenly makes sense.', { speaker: 'narrator' }),
  F('form', 'lift', 'fix.6', '"Slow the way down. That is where the work is, and you are giving it away for free."', {}),
  F('form', 'lift', 'praise.1', '"Do not change anything. That is textbook and I want you to remember what it felt like."', { when: { result: ['good'], tone: ['warm'] } }),

  // --- The trainer, over time -----------------------------------------------------------------------------------
  F('coach', 'plan', 'goal.1', '"So tell me the actual goal. Not the one you think I want to hear."', { when: { flags: ['first'] } }),
  F('coach', 'plan', 'goal.2', '"Twelve weeks. Three days a week. If you can only do two, tell me now and I will write two."', { when: { flags: ['first'], tone: ['firm'] } }),
  F('coach', 'plan', 'goal.3', '{first} writes nothing down for the first ten minutes and just watches you move.', { when: { flags: ['first'] }, speaker: 'narrator' }),
  F('coach', 'plan', 'known.1', '"Last time you said the shoulder was grumbling. Grumbling or talking?"', { when: { requires: ['met'] } }),
  F('coach', 'plan', 'known.2', '"You have hit every session for a month. I am putting weight on the bar."', { when: { requires: ['consistent'] } }),
  F('coach', 'plan', 'known.3', '"Two weeks off. I am not going to lecture you; I am going to load it lighter and you are going to hate that instead."', { when: { requires: ['missed'], tone: ['dry'] } }),
  F('coach', 'plan', 'known.4', '"You told me the goal was the fight scene in week nine. Week nine is in three weeks."', { when: { requires: ['goal'], tone: ['firm'] } }),
  F('coach', 'plan', 'known.5', '"Same as last week, one more set. That is the whole plan and it is going to work."', { when: { requires: ['met'] } }),
  F('coach', 'plan', 'push.1', '"You have got another two in you and we both know it."', { when: { move: ['push'] } }),
  F('coach', 'plan', 'push.2', '"I am going to ask for one more and you are allowed to say no. Once."', { when: { move: ['push'], tone: ['dry'] } }),
  F('coach', 'plan', 'hold.1', '"We are stopping there. Nothing good happens in the last set of a bad day."', { when: { move: ['hold'] } }),
  F('coach', 'plan', 'hold.2', '"Sleep is the session. Go home."', { when: { move: ['hold'], tone: ['firm'] } }),

  // --- The class -----------------------------------------------------------------------------------------------------
  F('class', 'room', 'start.1', '"Grab a mat, grab a partner, and if you are new, stand where I can see you."', { role: 'instructor' }),
  F('class', 'room', 'start.2', 'Twenty people in a room built for fourteen, and a playlist that starts at a hundred and forty beats a minute.', { speaker: 'narrator', role: 'world' }),
  F('class', 'room', 'start.3', '"Forty five minutes. You can do anything for forty five minutes."', { role: 'instructor' }),
  F('class', 'room', 'mid.1', '"Halfway. This is the part where your brain starts negotiating. Do not take the deal."', { role: 'instructor' }),
  F('class', 'room', 'mid.2', 'Somebody at the back stops and pretends to fix a shoelace. Everybody understands.', { speaker: 'narrator', role: 'world' }),
  F('class', 'room', 'mid.3', '"Match the person next to you, not the person at the front. I do this for a living."', { role: 'instructor', when: { tone: ['warm'] } }),
  F('class', 'room', 'end.1', '"Down. Breathe. Well done, all of you, including the two who nearly left."', { role: 'instructor' }),
  F('class', 'room', 'end.2', 'The lights come up and everybody is suddenly self-conscious again.', { speaker: 'narrator', role: 'world' }),
  F('class', 'room', 'yoga.1', '"Where the breath goes, the body follows. Nothing you do here needs to look like anything."', { when: { flags: ['yoga'] }, role: 'instructor' }),
  F('class', 'room', 'yoga.2', 'Somebody’s stomach rumbles in the silence and nobody acknowledges it, which is its own kind of grace.', { when: { flags: ['yoga'] }, speaker: 'narrator', role: 'world' }),
  F('class', 'room', 'spin.1', '"Turn it right. If you can hear your own legs you have not turned it far enough."', { when: { flags: ['spin'] }, role: 'instructor' }),
  F('class', 'room', 'spin.2', 'Forty five minutes of going nowhere very fast in the dark, and the strange sincerity of loving it.', { when: { flags: ['spin'] }, speaker: 'narrator', role: 'world' }),
  F('class', 'room', 'boxing.1', '"Hands up. Chin down. Stop leaning back, you cannot punch from there."', { when: { flags: ['boxing'] }, role: 'instructor' }),
  F('class', 'room', 'boxing.2', 'Your shoulders learn something about round three that no amount of reading would have taught them.', { when: { flags: ['boxing'] }, speaker: 'narrator', role: 'world' }),
  F('class', 'room', 'pilates.1', '"Small movement. Smaller. That is it. Now hold it and stop shaking at me."', { when: { flags: ['pilates'] }, role: 'instructor' }),
  F('class', 'room', 'pilates.2', 'Nothing visible is happening and everything is on fire.', { when: { flags: ['pilates'] }, speaker: 'narrator', role: 'world' }),

  // --- Afterwards -----------------------------------------------------------------------------------------------------
  F('finish', 'exit', 'good.1', 'You walk out lighter than you walked in, which is not how the arithmetic should work.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  F('finish', 'exit', 'good.2', '"Same time Thursday. Bring the same attitude."', { when: { result: ['good'] } }),
  F('finish', 'exit', 'good.3', 'The shower is too hot and you stand in it anyway, working out how to describe the session to somebody who will not care.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  F('finish', 'exit', 'flat.1', 'Not every session is a story. This one was a tax you paid.', { when: { result: ['flat'] }, speaker: 'narrator', role: 'world' }),
  F('finish', 'exit', 'flat.2', '"Rubbish session. Good. They are the ones that count towards something."', { when: { result: ['flat'], tone: ['dry'] } }),
  F('finish', 'exit', 'hurt.1', '"Ice it, and if it is still like that on Friday you see somebody about it, not me."', { when: { result: ['hurt'], tone: ['firm'] } }),
  F('finish', 'exit', 'hurt.2', 'Something in the lower back has an opinion now, and it will be louder in the morning.', { when: { result: ['hurt'] }, speaker: 'narrator', role: 'world' }),
  F('finish', 'exit', 'spotted.1', 'Somebody by the water fountain works out where they know you from, decides against saying anything, and then says something.', { when: { flags: ['recognised'] }, speaker: 'narrator', role: 'world' }),
  F('finish', 'exit', 'spotted.2', '"Sorry, I have to ask. Are you filming near here?"', { when: { flags: ['recognised'] }, role: 'world' }),
];

export const FITNESS_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'desk', beat: 'entry', flags: ['member'] },
    { purpose: 'desk', beat: 'entry', flags: ['daypass'] },
    { purpose: 'desk', beat: 'entry', flags: ['lapsed'] },
    { purpose: 'desk', beat: 'entry', flags: ['first'] },
    { purpose: 'room', beat: 'floor' },
    { purpose: 'room', beat: 'floor', flags: ['busy'] },
    { purpose: 'room', beat: 'floor', flags: ['quiet'] },
    { purpose: 'warmup', beat: 'floor' },
    { purpose: 'set', beat: 'lift', result: ['good', 'hard', 'failed', 'record'] },
    { purpose: 'form', beat: 'lift' },
    { purpose: 'coach', beat: 'plan', flags: ['first'] },
    { purpose: 'coach', beat: 'plan', move: ['push', 'hold'] },
    { purpose: 'class', beat: 'room' },
    ...['yoga', 'spin', 'boxing', 'pilates'].map((k) => ({ purpose: 'class', beat: 'room', flags: [k] })),
    { purpose: 'finish', beat: 'exit', result: ['good', 'flat', 'hurt'] },
  ],
};
