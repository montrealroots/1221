/**
 * Wellbeing — sleeping, washing, eating in, running, resting, and the days
 * where none of it takes.
 *
 * Nothing here is medical advice and nothing here diagnoses anything: it is
 * the narration of a body being looked after or not looked after. Every line
 * describes something a command has already decided.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'wellbeing';
const W = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'world', speaker: 'narrator', ...opts });

const LINES: DialogueLine[] = [
  // --- Sleep -----------------------------------------------------------------------------------------
  W('sleep', 'night', 'deep.1', 'Eight hours that go by in one piece, and a morning where the alarm is the first thing you have heard.'),
  W('sleep', 'night', 'deep.2', 'You are asleep before you have finished deciding to be. The room is dark when you wake and you do not know which dark.'),
  W('sleep', 'night', 'deep.3', 'Proper sleep, the kind with weather in it. You wake up on the other side of something.'),
  W('sleep', 'night', 'deep.4', 'The pillow was cold on both sides all night and you never once needed to turn it.'),
  W('sleep', 'night', 'ok.1', 'Six hours, broken once by nothing in particular, and then a long stretch you will take.'),
  W('sleep', 'night', 'ok.2', 'You sleep the way most people sleep: adequately, unmemorably, and forty minutes short.'),
  W('sleep', 'night', 'ok.3', 'Awake at three for no reason, asleep again by half past, and the whole thing gone by breakfast.'),
  W('sleep', 'night', 'poor.1', 'Four hours in instalments. Every one of them has a receipt and you will be paying tomorrow.'),
  W('sleep', 'night', 'poor.2', 'The ceiling gets a lot of attention. So does a conversation from nine days ago that you would now like to redo.'),
  W('sleep', 'night', 'poor.3', 'You watch the clock go from two to four in what feels like nine minutes and also all night.'),
  W('sleep', 'night', 'poor.4', 'Sleep the way a phone charges on a bad cable: on, off, on, and nothing to show for it.'),
  W('sleep', 'night', 'debt.1', 'The body sends the bill for the week. You sleep eleven hours and wake up feeling worse, which is how it works.'),
  W('sleep', 'night', 'debt.2', 'You go under at nine in the evening like somebody unplugged you.', { when: { flags: ['exhausted'] } }),
  W('sleep', 'night', 'debt.3', 'Nothing hurts specifically. Everything is just slightly further away than it should be.', { when: { flags: ['exhausted'] } }),
  W('sleep', 'night', 'nap.1', 'Twenty minutes on the sofa with your shoes on, and it works, which is annoying.', { when: { flags: ['nap'] } }),
  W('sleep', 'night', 'nap.2', 'A nap that goes eighty minutes and leaves you fogged and cross for an hour after.', { when: { flags: ['nap'] } }),
  W('sleep', 'night', 'hotel.1', 'A hotel bed, which is either the best sleep of the month or a night spent working out which pillow is the wrong one.', { when: { flags: ['away'] } }),
  W('sleep', 'night', 'hotel.2', 'Air conditioning cycling on and off, a corridor door, and somebody with an early flight.', { when: { flags: ['away'] } }),
  W('sleep', 'night', 'jetlag.1', 'Your body thinks it is the afternoon and is refusing to negotiate.', { when: { flags: ['jetlag'] } }),
  W('sleep', 'night', 'jetlag.2', 'Wide awake at two, ravenous at four, unconscious at eleven in the morning. Three days of this to go.', { when: { flags: ['jetlag'] } }),

  // --- Washing -----------------------------------------------------------------------------------------
  W('wash', 'bathroom', 'shower.1', 'Hot water, ten minutes, and the day gets sorted into things that matter and things that were never going to.'),
  W('wash', 'bathroom', 'shower.2', 'You stand under it longer than you meant to and have one genuinely useful idea, which you will forget.'),
  W('wash', 'bathroom', 'shower.3', 'A shower with the pressure of a polite cough. It does the job, technically.', { when: { flags: ['poor'] } }),
  W('wash', 'bathroom', 'shower.4', 'The good shower. The one with the rain head and the bench nobody sits on.', { when: { flags: ['luxury'] } }),
  W('wash', 'bathroom', 'shower.5', 'Two minutes, cold at the end because somebody told you it helps, and it might.'),
  W('wash', 'bathroom', 'bath.1', 'A bath so hot it takes four attempts to get into. Worth every one of them.', { when: { flags: ['bath'] } }),
  W('wash', 'bathroom', 'bath.2', 'You read six pages in the bath and drop the book in the water on page seven.', { when: { flags: ['bath'] } }),
  W('wash', 'bathroom', 'grooming.1', 'Shaved, cut, and looking like a person who has plans.'),
  W('wash', 'bathroom', 'grooming.2', 'The mirror gets a hard look and gives one back. Fine. Both of you can live with it.'),
  W('wash', 'bathroom', 'skipped.1', 'You do not wash. You know you have not washed. It follows you about like a small dog.', { when: { flags: ['skipped'] } }),

  // --- Eating in -------------------------------------------------------------------------------------------
  W('cook', 'kitchen', 'good.1', 'Everything hits the plate at the same temperature, which happens maybe one time in six.', { when: { result: ['good'] } }),
  W('cook', 'kitchen', 'good.2', 'You cook properly for one, which most people cannot be bothered to do and everybody should.', { when: { result: ['good'] } }),
  W('cook', 'kitchen', 'good.3', 'The kitchen smells like somebody lives here. It has not for a while.', { when: { result: ['good'] } }),
  W('cook', 'kitchen', 'good.4', 'Twenty minutes, one pan, and something that would be forty at a restaurant.', { when: { result: ['good'] } }),
  W('cook', 'kitchen', 'fine.1', 'It is fed rather than dinner, and there is no shame in fed.', { when: { result: ['fine'] } }),
  W('cook', 'kitchen', 'fine.2', 'Toast, an egg, and standing at the counter. Nobody is filming this.', { when: { result: ['fine'] } }),
  W('cook', 'kitchen', 'poor.1', 'You over-salt it, know you have over-salted it, and eat it anyway out of spite.', { when: { result: ['poor'] } }),
  W('cook', 'kitchen', 'poor.2', 'The pan was not hot enough and now everything is grey and correct about being grey.', { when: { result: ['poor'] } }),
  W('cook', 'kitchen', 'poor.3', 'Smoke, the alarm, a tea towel, the window, and dinner eventually.', { when: { result: ['poor'] } }),
  W('cook', 'kitchen', 'empty.1', 'You open the fridge, look at what is in it, close it, and open it again in case it has changed.', { when: { flags: ['empty'] } }),
  W('cook', 'kitchen', 'empty.2', 'Half an onion, three condiments and a lemon. Dinner is going to be a personality test.', { when: { flags: ['empty'] } }),
  W('cook', 'kitchen', 'guest.1', 'Cooking for somebody else, which is a different sport entirely and you are enjoying it more than you expected.', { when: { flags: ['guests'] } }),
  W('cook', 'kitchen', 'guest.2', 'Two of you in a kitchen built for one, and neither of you minds.', { when: { flags: ['guests'] } }),

  // --- Running ----------------------------------------------------------------------------------------------
  W('run', 'street', 'good.1', 'The first mile is a negotiation and the second is a conversation and the third is nothing at all, which is the point.', { when: { result: ['good'] } }),
  W('run', 'street', 'good.2', 'Legs turning over without asking permission. You go further than you planned because stopping would be rude to them.', { when: { result: ['good'] } }),
  W('run', 'street', 'good.3', 'Cold air, empty pavements, and the specific smugness of being out before the traffic.', { when: { result: ['good'] } }),
  W('run', 'street', 'good.4', 'You catch the light at every crossing, which never happens, and take it as a sign about nothing.', { when: { result: ['good'] } }),
  W('run', 'street', 'hard.1', 'Everything is heavy. You do the distance because you said you would, and it costs more than it should.', { when: { result: ['hard'] } }),
  W('run', 'street', 'hard.2', 'A stitch at twelve minutes and a long argument with yourself about whether walking counts.', { when: { result: ['hard'] } }),
  W('run', 'street', 'hard.3', 'You cut it short at the corner and tell yourself it was the hill. It was not the hill.', { when: { result: ['hard'] } }),
  W('run', 'street', 'rain.1', 'It starts raining in the first ten minutes and turns out to be the best part of the day.', { when: { flags: ['rain'] } }),
  W('run', 'street', 'rain.2', 'Soaked through by the halfway point, past caring by three quarters.', { when: { flags: ['rain'] } }),
  W('run', 'street', 'heat.1', 'Too hot, too bright, and the shade on the far side of the road becomes a strategy.', { when: { flags: ['heat'] } }),
  W('run', 'street', 'heat.2', 'You finish red-faced and dripping and stand in front of the open fridge like a man in a desert film.', { when: { flags: ['heat'] } }),
  W('run', 'street', 'park.1', 'A loop of the park, the same dog owners at the same corners, and a heron that has clearly not moved since Tuesday.', { when: { flags: ['park'] } }),
  W('run', 'street', 'park.2', 'Three laps. The third is where the good thinking happens, if any is going to.', { when: { flags: ['park'] } }),
  W('run', 'street', 'beach.1', 'Wet sand at the tideline, which gives just enough, and gulls that take your presence personally.', { when: { flags: ['beach'] } }),
  W('run', 'street', 'beach.2', 'Out and back along the water with the wind helping one way and charging you for it on the return.', { when: { flags: ['beach'] } }),
  W('run', 'street', 'record.1', 'You look at the watch at the end and look again, because that is a time you have not run before.', { when: { result: ['record'] } }),
  W('run', 'street', 'record.2', 'Somewhere in the last mile the arithmetic changed and you decided to find out. It held.', { when: { result: ['record'] } }),

  // --- Rest and the days off ----------------------------------------------------------------------------------
  W('rest', 'home', 'good.1', 'A day where nothing is required of you, taken properly, without checking anything.', { when: { result: ['good'] } }),
  W('rest', 'home', 'good.2', 'You read for three hours. Nobody dies, nothing burns down, and the world manages.', { when: { result: ['good'] } }),
  W('rest', 'home', 'good.3', 'The sofa, the good light, and a long afternoon that does not need to be about anything.', { when: { result: ['good'] } }),
  W('rest', 'home', 'restless.1', 'You rest badly, in the way people rest when they are secretly waiting for a phone call.', { when: { result: ['restless'] } }),
  W('rest', 'home', 'restless.2', 'Three hours of doing nothing and none of it lands. You end up cleaning a cupboard.', { when: { result: ['restless'] } }),
  W('rest', 'home', 'guilty.1', 'You take the afternoon off and spend most of it defending the decision to nobody.', { when: { flags: ['guilty'] } }),
  W('rest', 'home', 'guilty.2', 'Rest with the phone face up is not rest, and you know that, and the phone stays face up.', { when: { flags: ['guilty'] } }),

  // --- Stress and the state of things ---------------------------------------------------------------------------
  W('state', 'inside', 'calm.1', 'Something has unclenched that you did not know was clenched.', { when: { result: ['calm'] } }),
  W('state', 'inside', 'calm.2', 'The list is still long and it has stopped being frightening, which is most of the battle.', { when: { result: ['calm'] } }),
  W('state', 'inside', 'calm.3', 'You notice, walking, that you are not thinking about anything, and try not to ruin it by noticing.', { when: { result: ['calm'] } }),
  W('state', 'inside', 'wired.1', 'Everything is fine and your jaw is doing something it should not be.', { when: { result: ['wired'] } }),
  W('state', 'inside', 'wired.2', 'You reread the same message four times looking for the tone in it, which is not in it.', { when: { result: ['wired'] } }),
  W('state', 'inside', 'wired.3', 'Third coffee. It is not helping and you make a fourth.', { when: { result: ['wired'] } }),
  W('state', 'inside', 'flat.1', 'Not sad. Not anything. A grey that is not weather.', { when: { result: ['flat'] } }),
  W('state', 'inside', 'flat.2', 'You do the things in the right order and none of them register.', { when: { result: ['flat'] } }),
  W('state', 'inside', 'flat.3', 'The good news arrives and you note it, the way you note a bus going past.', { when: { result: ['flat'] } }),
  W('state', 'inside', 'good.1', 'A day where the body and the schedule are pointing the same direction. Rare. Use it.', { when: { result: ['strong'] } }),
  W('state', 'inside', 'good.2', 'You take the stairs without thinking about the stairs.', { when: { result: ['strong'] } }),
  W('state', 'inside', 'sore.1', 'Everything below the waist has a complaint to file and no interest in the process.', { when: { flags: ['sore'] } }),
  W('state', 'inside', 'sore.2', 'Sitting down is fine. Standing up is a project with several phases.', { when: { flags: ['sore'] } }),
  W('state', 'inside', 'hungry.1', 'You have not eaten since the morning and your judgement has quietly left the building.', { when: { flags: ['hungry'] } }),
  W('state', 'inside', 'hungry.2', 'Everything is annoying. It is not everything, it is that it is four o’clock and you skipped lunch.', { when: { flags: ['hungry'] } }),
  W('state', 'inside', 'ill.1', 'Something is coming. It is in the throat and in the way the light looks.', { when: { flags: ['ill'] } }),
  W('state', 'inside', 'ill.2', 'You are cold in a warm room, which is the body giving thirty-six hours notice.', { when: { flags: ['ill'] } }),
];

export const WELLBEING_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'sleep', beat: 'night' },
    { purpose: 'sleep', beat: 'night', flags: ['nap'] },
    { purpose: 'sleep', beat: 'night', flags: ['away'] },
    { purpose: 'sleep', beat: 'night', flags: ['jetlag'] },
    { purpose: 'wash', beat: 'bathroom' },
    { purpose: 'cook', beat: 'kitchen', result: ['good', 'fine', 'poor'] },
    { purpose: 'run', beat: 'street', result: ['good', 'hard', 'record'] },
    { purpose: 'rest', beat: 'home', result: ['good', 'restless'] },
    { purpose: 'state', beat: 'inside', result: ['calm', 'wired', 'flat', 'strong'] },
  ],
};
