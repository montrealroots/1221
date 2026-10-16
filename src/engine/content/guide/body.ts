/**
 * SLATE — the guide's reference: looking after yourself (from 2026-10-12; `content/guide/types.ts`).
 *
 * The figures are the rules' own, imported from `systems/life.ts` and the content it reads, and the worked example
 * for Look After Yourself is the menu's own arithmetic: `applyLookingAfter` and `readiness` on a new life's first
 * morning (`freshWellbeing`), worked out when the guide loads, so a change to a meal, a workout or readiness changes
 * what the example says. The sleep example is a measured night, said as one. The figures written as words are kept
 * where nothing can import them: a meal's 50, the 90 and 95 that refuse a meal and a shower, the 20 and 50 lines
 * of hunger and grime, the morning's 76 and 82 and a day without groceries' 40, the six hours under which a night adds
 * debt and the five of real rest a night must pass to mend, readiness's 5 to 100, Home's bars' 25 and 50, a French
 * debit card's last 30 days (a literal in `cardCeilingRoom`, `systems/lending.ts`), and a workout's 0.6 at readiness
 * 75 (`WORKOUT_FITNESS`). The Sleep dialog's hours were among them, as 1 to 14, until
 * 2026-10-12: they're 0.5 to 14 now, imported (`SHORTEST_SLEEP`, `LONGEST_NIGHT`).
 *
 * Checked against the code on 2026-10-12. Until then the menu's affordability counted an overdraft a meal couldn't
 * always use (`lookAfterRefusal` against `spend`), and the entry listed “The payment didn’t go through.” for that
 * meal. The menu and the command both ask `spendRefusal` now, the entry lists its refusals in the order it asks them,
 * and a meal is paid for as it's ordered, so nothing known reaches that failure and the entry no longer lists it.
 * Until then too the menu's Work Out preview read neither a repeat the same day nor the weather at the hour's end, and
 * the entry said both where the menu didn't; the preview reads both now (`lookAfterOptions`), and the entry says what
 * its line says. A trait on the Player Profile didn't open until that day either, and the entry said so. Until later
 * that day the entry said a meal could be had at a commitment, where `lookAfterRefusal` lets Eat A Meal alone through
 * and Order In waits with the rest.
 */

import { CHAPTER_BY_ID } from '../tutorial';
import { YALE_DRAMA } from '../school';
import { BODY as A_BODY, TRAINING_CLASS_NAMES } from '../body';
import { INJURY } from '../injury';
import { CHRONIC } from '../safetynet';
import { DEVELOPMENT } from '../abilities';
import {
  COASTING_ENERGY_CEILING, DEBT_HOLDS, DELIVERY, EMPTY, ENERGY_DRAIN_PER_HOUR, EVERYDAY_FITNESS, FINE, FITNESS,
  LONGEST_NIGHT, LOOKING_AFTER, NOURISHMENT_DRAIN_PER_HOUR, OVERWROUGHT, SHORTEST_SLEEP, SPENT, TRAINING,
  applyLookingAfter, freshWellbeing, readiness, workoutCosts, type LookAfter,
} from '../../systems/life';
import { ESTIMATE } from '../../systems/school';
import { chanceOver } from '../../systems/injury';
import { foodAt } from '../../systems/spending';
import { defaultPersonality } from '../../systems/personality';
import { formatMoney } from '../../core/money';
import { plural } from '../../core/text';
import type { Person } from '../../domain/model';
import type { GuideEntry } from './types';

/** A chapter's title, in quotes, as the guide names it. */
const chapter = (id: string): string => `“${CHAPTER_BY_ID[id]!.title}”`;

/** "a, b and c". */
const listed = (items: readonly string[]): string =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * A new life's first morning, with no trait to move it and the dispositions a new life is given (`defaultConfig`):
 * the body the examples start from. Until 2026-10-12 it had no dispositions, and its Unwind and Work Out came out a
 * tenth off what the menu shows a new life (4.6 and −4.8 against 4.7 and −4.7).
 */
const firstMorning = (): Person => ({ wellbeing: freshWellbeing(), personality: defaultPersonality(), personalityTraits: [] }) as unknown as Person;
const FIRST = freshWellbeing();
const READY_FIRST = readiness(firstMorning());
/** What a thing does alone to readiness, the time it takes aside: the menu's own figure (`lookAfterOptions`). */
function gainOf(action: LookAfter, training = 1): number {
  const after = firstMorning();
  applyLookingAfter(after, action, undefined, training);
  return Math.round((readiness(after) - READY_FIRST) * 10) / 10;
}
const signed = (n: number): string => `${n > 0 ? '+' : ''}${n.toFixed(1)}`;

const MEAL_HERE = foodAt(YALE_DRAMA.cityId, 'USD', Date.UTC(2026, 7, 24, 16)).meal;
const ORDER_HERE = Math.round(MEAL_HERE * DELIVERY.times);
const usd = (cents: number): string => formatMoney(cents, 'USD');
const RUN_MORE = Math.round((TRAINING.run / TRAINING.indoors - 1) * 100);
const RUN_RISK = (chanceOver(INJURY.perThousandHours.run, 1) * 100).toFixed(2);
const GYM_RISK = (chanceOver(INJURY.perThousandHours.gym, 1) * 100).toFixed(2);
const WORKOUT_ENERGY = Math.round(workoutCosts(firstMorning()));
/** The classes that count as a workout (`TRAINING_CLASSES`, from 2026-10-16), as a list. */
const CLASS_LIST = TRAINING_CLASS_NAMES.length < 2 ? TRAINING_CLASS_NAMES.join('') : `${TRAINING_CLASS_NAMES.slice(0, -1).join(', ')} or ${TRAINING_CLASS_NAMES.at(-1)}`;
const LABELS = Object.values(LOOKING_AFTER).map((one) => one.label);
const minutesOf = (action: LookAfter): string => plural(LOOKING_AFTER[action].minutes, 'minute');

export const BODY: readonly GuideEntry[] = [
  {
    id: 'body.how',
    title: 'How You Are',
    goal: 'body',
    covers: ['ui.how', 'look.dial', 'look.readiness', 'look.trait', 'look.condition', 'look.person'],
    synonyms: ['energy', 'stress', 'readiness', 'dials', 'wellbeing', 'morale', 'condition', 'fitness', 'nourishment', 'hygiene', 'traits', 'my own page'],
    questions: ['What is readiness?', 'Why is my energy so low?', 'What do the colors on the bars mean?', 'What does stress do?', 'Where are the other dials?', 'What does a trait change?'],
    where: { route: '/home', label: 'Home, The How You Are Panel' },
    available: `From ${chapter('body')}. The Player Profile, where your traits open too, comes with ${chapter('profile')}, and your own page, opened from your name, with ${chapter('life')}.`,
    short: 'How You Are keeps three bars in front of you, Energy, Stress and Readiness, under a line that says how you are. Each bar opens into what moves it. The other six dials, sleep debt, morale, condition, fitness, nourishment and hygiene, are on your own page with the traits you hold and the conditions you carry. Readiness is the figure most of your work reads.',
    steps: [
      'Read How You Are on Home: the line at the top, then Energy, Stress and Readiness, each out of a hundred.',
      'Press Energy, Stress or Readiness to open it under the panel: where it stands and what that level does, and for Readiness the dials costing you most.',
      'Press the line at the top, the panel’s name or your name in the greeting to open your own page: all eight dials, Readiness, the traits you hold, the conditions you carry and any injury, each one pressable.',
      'The Player Profile lists your traits under “Chosen at the start.”, and each opens there, under the line.',
    ],
    needs: [
      `The panel and its three bars open with ${chapter('body')}.`,
      `Your own page opens with ${chapter('life')}, the guide’s last chapter. Until then the other dials are reached through Readiness, which names the ones costing you, a trait opens only on the Player Profile, from ${chapter('profile')}, and a condition can’t be opened at all.`,
      'A condition opens only while you carry it, and an injury only while it mends.',
    ],
    costs: [
      { label: 'Time', value: 'None: the panel and what it opens move no clock' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Energy', value: `Falls ${ENERGY_DRAIN_PER_HOUR} an hour awake, faster when you owe sleep. Under ${EMPTY}, stress starts to climb.` },
      { label: 'Stress', value: `Eases while there’s energy left and climbs once it runs out. Each hour over ${OVERWROUGHT} costs condition, and money owed adds to it every day.` },
      { label: 'Readiness', value: 'Seven of the eight multiplied, all but fitness, held between 5 and 100: how well you’d do something right now' },
      { label: 'What Readiness Sets', value: 'How much a class, a lab, a rehearsal, an hour of practice or a workout builds, and the condition judged work meets you in, with the hour’s fit for an early riser or a night owl' },
      { label: 'Condition', value: `How much energy a night puts back, and how likely a year is to be your last. Under ${ESTIMATE.sickBelow}, staying home sick is excused.` },
      { label: 'Fitness', value: `How far rest can mend condition, and what a workout costs. Untrained, it falls toward ${EVERYDAY_FITNESS}, what an everyday life keeps.` },
      { label: 'Traits', value: 'Each multiplies what it names: how good a night is, how fast stress clears, how far the mood moves, what food costs' },
    ],
    now: ['Opening a bar, a dial, a trait or a condition changes nothing: it reads the figure as it stands.'],
    later: [
      'The dials move every second the clock runs, at what a waking hour charges. A night, a meal, a shower, a workout and an hour unwinding move them back.',
      `Each midnight the body settles: fitness falls ${FITNESS.perDay} if you haven’t trained in ${plural(FITNESS.heldDays, 'day')}, and condition drifts a little toward what your fitness lets rest mend it to.`,
      `A condition left alone takes from its dial each week: depression ${CHRONIC.untreated.moraleAWeek} morale, arthritis ${CHRONIC.untreated.arthritisEnergyAWeek} energy, diabetes ${CHRONIC.untreated.diabetesConditionAWeek} condition. Kept up on Papers, it takes none.`,
      `An injury takes ${INJURY.weighs.morale} from morale and adds ${INJURY.weighs.stress} to stress each day until it mends.`,
    ],
    interpret: [
      `Energy turns red under ${EMPTY} and amber within fifteen above it; Stress turns red over ${OVERWROUGHT} and amber within fifteen under it. Those are the lines where the body starts to pay.`,
      'Readiness turns red under 25 and amber under 50.',
      'The line at the top names the worst thing first: running on empty, then badly short on sleep, stretched thin, hungry. “Rested, steady and ready for a real day.” means energy over 75 and stress under 30.',
      'Readiness, opened, names up to three dials each costing you more than a twentieth of it, worst first.',
      'A trait’s table gives each thing it moves as a percentage; “with all you are” is every trait and disposition you hold, together.',
    ],
    unavailable: [
      `Before ${chapter('body')} is read the panel shows Locked, with Read About It.`,
      `Your name, the panel’s name and the line at the top stay plain until ${chapter('life')} is read.`,
      'A condition you no longer carry, or an injury that has mended, says so and opens no further.',
    ],
    mistakes: [
      'Reading a low Readiness as a verdict on your craft: it measures today alone, and a night and a meal move it most.',
      'Training to lift readiness on the day backfires: a workout costs energy now, and readiness doesn’t count fitness.',
      `Leaving stress over ${OVERWROUGHT}: each hour there costs condition, which takes nights to come back.`,
    ],
    related: ['body.sleep', 'body.look-after', 'papers.conditions', 'craft.profile'],
    connections: [
      { to: 'body.sleep', kind: 'immediate', why: 'A night is what moves energy, sleep debt and condition most.' },
      { to: 'body.look-after', kind: 'immediate', why: 'A meal, a shower, a workout and an hour unwinding each move named dials, and the menu says by how much.' },
      { to: 'coursework.class', kind: 'evaluation', why: 'Readiness sets how much a class or a lab builds that day.' },
      { to: 'productions.nights', kind: 'evaluation', why: 'A night on stage is judged with your readiness at its hour as the condition you came in.' },
      { to: 'school.sick', kind: 'optional', why: `Under ${ESTIMATE.sickBelow} condition, calling in sick is excused.` },
      { to: 'papers.conditions', kind: 'history', why: 'The conditions you carry are kept up or let go on Papers, and your page says which.' },
    ],
    example: {
      setup: `A new life’s first morning: energy ${FIRST.energy}, stress ${FIRST.stress}, nourishment ${FIRST.nourishment}, morale ${FIRST.morale}.`,
      steps: ['Press Readiness on How You Are.', 'Open Look After Yourself and press Eat A Meal.'],
      result: `Readiness reads ${Math.round(READY_FIRST)}. The meal fills you, and readiness rises by ${gainOf('eat').toFixed(1)} on what the meal does alone, less what its ${minutesOf('eat')} cost.`,
    },
  },
  {
    id: 'body.sleep',
    title: 'Sleep',
    goal: 'body',
    covers: ['ui.sleep', 'life.sleep'],
    synonyms: ['bed', 'nap', 'go to bed', 'sleep debt', 'wake up', 'tired', 'how long to sleep', 'bedtime'],
    questions: ['How long should I sleep?', 'What happens if I sleep through a class?', 'Why is the Sleep button gray?', 'Does a short night hurt?', 'What does sleep debt do?'],
    where: { route: '/home', label: 'The Top Bar’s Sleep Button' },
    available: `From ${chapter('sleep')}.`,
    short: `Sleep asks how many hours, from ${SHORTEST_SLEEP} to ${LONGEST_NIGHT}, suggests a number from when you’re next wanted and what you owe, and says when you’d wake. The clock then goes through the night at once. A night puts energy back, less the more sleep you owe, clears stress and sleep debt, and mends condition only with more than about five hours of real rest. Anything on the calendar in those hours happens without you.`,
    steps: [
      'Press Sleep in the top bar.',
      'Read the suggestion at the top: the hours it asks for, and why.',
      'Set Hours with the slider, by half hours; “You’d wake at” follows it.',
      'Read what it warns of: your next commitment, a sleep that would stand for tonight, and anything you’d sleep through.',
      'Press Sleep and the hours, or Not Yet.',
    ],
    needs: [
      `Opens with ${chapter('sleep')}.`,
      'Not in the middle of a commitment you went to: Sleep is gray then, and says until when.',
    ],
    costs: [
      { label: 'Time', value: 'The hours you choose: the clock moves straight to your wake' },
      { label: 'Money', value: 'None' },
      { label: 'Food', value: 'Nourishment runs down through the night, a little slower than awake' },
    ],
    reads: [
      { label: 'How Good The Night Is', value: 'Your stress at bedtime, how deeply you sleep, and the hour: a night begun between one and five in the morning is a worse one' },
      { label: 'What You Owe', value: `Sleep debt: a full debt holds back up to ${Math.round(DEBT_HOLDS * 100)}% of the energy a night puts back` },
      { label: 'Your Age', value: 'A night puts back less at sixty than at twenty' },
      { label: 'Condition And Fitness', value: 'A worn body gets up to a fifth less back, and rest mends condition only as far as your fitness allows' },
      { label: 'The Suggestion', value: 'The hours a normal night’s rest takes for you, or what’s left before your next commitment, keeping an hour and a half to get up and get there' },
    ],
    now: [
      'The clock goes straight to your wake, and everything due in those hours runs on the way, without you.',
      'Energy comes back by the hours times how well you slept, less for sleep owed, for age and for a worn body.',
      'Stress eases with the night, more when your mood is up.',
      'Sleep debt clears with the whole night; a night under six hours adds to it.',
      'Condition mends with more than about five hours of real rest, up to what your fitness lets it reach; with less, it falls.',
      'The mood moves with the rest, and a night of eight hours or more brings it about a third of the way back to where your body has it settle.',
    ],
    later: [
      'A commitment slept through is missed: an absence at classes, a missed call, an unpaid shift, a plan gone by. The morning’s notice names each one.',
      'A sleep counts as the night of the day it ends in, so no night of your character’s own follows it that day.',
      'A short sleep that ends in the small hours stands for the whole night: you’re up from its end, and the dialog warns you first.',
    ],
    interpret: [
      'The suggestion says why: “A normal night.”, “Your calendar’s clear, so sleep as long as you need.”, or the one thing stretching tonight, such as debt, stress, a light sleeper or a late hour. A commitment too soon for a full night says how far off it is. For one the clock is standing at, it’s “It’s time for …, and you’re standing at it. Any sleep goes through it.”, and the dialog says “Your next commitment is now, and you’re standing at it.”',
      '“This would be tonight’s sleep” means the rest of the night won’t be slept; the clock won’t put you back to bed after it.',
      `With something less than two and a half hours off, or standing at it, the suggestion is the shortest sleep there is: the figure, the slider and the button say ${SHORTEST_SLEEP}, and Sleep ${SHORTEST_SLEEP} Hours sleeps just that.`,
      'The morning after, Energy and Readiness on How You Are show what the night gave back.',
    ],
    unavailable: [
      `Sleep shows Locked until ${chapter('sleep')} is read.`,
      'Sleep is gray, with “You’re at … until …”, while you’re in the middle of a commitment you went to.',
    ],
    mistakes: [
      'Taking the suggestion before an early call is a short night: it keeps an hour and a half to get there, and a sleep under six hours adds debt. Going to bed earlier is the fix.',
      'Sleeping through a class because the hours ran over it: the dialog lists what you’d sleep through, so shorten the hours until the list is empty.',
      'A nap under six hours that ends in the small hours, of a night not yet slept, stands for the whole night, and you’re up from its end.',
    ],
    related: ['body.how', 'day.advance', 'day.calendar', 'day.clock'],
    connections: [
      { to: 'body.how', kind: 'immediate', why: 'A night moves energy, stress, sleep debt, condition and morale at the wake.' },
      { to: 'day.calendar', kind: 'immediate', why: 'Anything that wants you inside the night runs without you and is missed.' },
      { to: 'day.needs', kind: 'history', why: 'Commitments slept through are named in a notice the morning after.' },
      { to: 'school.standing', kind: 'evaluation', why: 'Classes and calls slept through are absences the faculty weigh at the term’s end.' },
      { to: 'day.advance', kind: 'optional', why: `A jump through the night sleeps for you, a poorer night that stops at ${COASTING_ENERGY_CEILING} energy.` },
    ],
    example: {
      setup: 'Measured on a new life’s first day at Yale, gone to Registration at ten and moved on to 11:00 PM: energy 35.5, stress 12, sleep debt 5.3 hours, condition 88, readiness 46, and Meeting Your Class at ten the next morning.',
      steps: ['Press Sleep. The suggestion is 8 hours, “A normal night.”', 'Press Sleep 8 Hours.'],
      result: 'At 7:00 AM energy is 100, stress and sleep debt are 0, condition is 89.5, morale has risen from 62 to 69.6, and readiness is 96. The same evening slept 5 hours wakes at 4:00 AM with the night counted as slept: some sleep debt stays on the books, and condition falls where 8 hours mended it.',
    },
  },
  {
    id: 'body.look-after',
    title: 'Looking After Yourself',
    goal: 'body',
    covers: ['ui.look-after', 'life.look_after'],
    synonyms: ['eat a meal', 'meal', 'order in', 'shower', 'work out', 'exercise', 'unwind', 'go for a run', 'food', 'hungry', 'weight', 'needed now'],
    questions: ['How do I eat?', 'Why is Work Out gray?', 'What does a shower do?', 'Does working out make me fitter?', 'Why did my weight go up?', 'What does Needed Now mean?'],
    where: { route: '/home', label: 'The Top Bar’s Look After Yourself Menu' },
    available: `From ${chapter('looking-after')}.`,
    short: `Look After Yourself holds what a day needs besides sleep: ${listed(LABELS)}. Each line says how long it takes, what it costs, why it stands where it does and what it would do to your dials. Whatever is costing you every hour comes first, with Needed Now on the top line, then the rest by the readiness each gives back, and what can’t be done now last. It does what you choose, when you choose it, and the clock moves through its time.`,
    steps: [
      'Press Look After Yourself in the top bar.',
      'Read each line: its time, its price if it has one and why it’s there, and under that the dials it would move and the readiness it gives back.',
      'Press a line to do it. A note says when it’s done.',
      'A gray line says why it can’t be done now.',
    ],
    needs: [
      `Opens with ${chapter('looking-after')}.`,
      `Eat A Meal and Order In: nourishment under 90 and the money to pay. Shower: hygiene under 95. Work Out: energy at ${SPENT} or more, no injury beyond a cut or a knock, and no flu.`,
      'No commitment may start inside the time it takes, and none of it can be done from a hospital bed.',
      'While you’re at a commitment, Eat A Meal is the one line that can be done.',
    ],
    costs: [
      { label: LOOKING_AFTER.eat.label, value: `${minutesOf('eat')}, and a meal at the town’s price before your traits: ${usd(MEAL_HERE)} in New Haven`, estimate: true },
      { label: LOOKING_AFTER.order.label, value: `${minutesOf('order')}, and about ${DELIVERY.times.toFixed(1)} times a meal at home: ${usd(ORDER_HERE)} in New Haven`, estimate: true },
      { label: LOOKING_AFTER.wash.label, value: `${minutesOf('wash')}, free` },
      { label: LOOKING_AFTER.exercise.label, value: `${minutesOf('exercise')}, free, and ${WORKOUT_ENERGY} energy at fitness ${FIRST.fitness}: more for a less fit body, less for a fitter one` },
      { label: LOOKING_AFTER.unwind.label, value: `${minutesOf('unwind')}, free` },
    ],
    reads: [
      { label: 'Your Dials', value: 'Each line is worked out on a copy of you: what it would do, and the readiness that comes of it' },
      { label: 'Hunger, Grime And Stress', value: `Under 20 nourishment, under 50 hygiene or over ${OVERWROUGHT} stress, the line that mends it moves to the top, and the top line wears Needed Now: each hour there costs condition or mood` },
      { label: 'Readiness', value: 'A workout builds more the readier you are, from 0.4 to 1.2 times its base between readiness 0 and 100' },
      { label: 'The Weather', value: `A workout is a run when its hour ends dry, at ${FINE.runLowC}°C or warmer and feeling no hotter than ${FINE.highC}°C` },
      { label: 'Your Traits', value: 'How much a meal lifts you, how fast stress clears, how far the mood moves and what food costs' },
    ],
    now: [
      'A meal is paid for as it’s ordered, before its time. Then the time is lived and charged as waking time, and the line’s figures come on top of it.',
      'Eat A Meal: nourishment up by as much as 50, to 100 at most, and the mood by as much as you needed it.',
      `Order In: the same, and a restaurant’s larger meal, ${A_BODY.eatenOut} calories more toward your weight.`,
      'Shower: hygiene to 100, and stress eased by a tenth of what it put back.',
      `Work Out: fitness up 0.6 at readiness 75, ${RUN_MORE}% more on a run, never past what your age allows; energy, nourishment and hygiene down, stress eased, the mood up.`,
      `A second workout the same day builds ${Math.round(DEVELOPMENT.repeat * 100)}% of the first, and a third ${Math.round(DEVELOPMENT.repeat ** 2 * 100)}%. A class that trains the body as hard as a workout counts as one of them, and builds what a workout indoors does: ${CLASS_LIST}, attended.`,
      'Unwind: stress down and the mood up.',
    ],
    later: [
      `Fitness holds for ${plural(FITNESS.heldDays, 'day')} after a workout or one of those classes, then falls ${FITNESS.perDay} a day toward ${EVERYDAY_FITNESS}.`,
      `Awake, nourishment falls ${NOURISHMENT_DRAIN_PER_HOUR} an hour. Each midnight the day’s groceries are bought at the town’s prices, and the day starts fed to at least 76 nourishment, or 40 if they can’t be paid for, and washed to at least 82 hygiene.`,
      'A shower skipped costs nothing past its day: the morning washes you to 82 whatever the day before was. That’s the owner’s decision, of 2026-10-14.',
      `Your weight follows the day’s eating against what you burn, half the way to its new level in ${plural(A_BODY.halfLifeDays, 'day')}. Eat A Meal is part of the day’s eating and adds nothing to it; Order In adds its ${A_BODY.eatenOut} calories. A run burns ${A_BODY.met.run} METs against a workout indoors’ ${A_BODY.met.workout}, and none of it is eaten back.`,
      `An hour’s run risks an injury ${RUN_RISK}% of the time and a workout indoors ${GYM_RISK}%. A sprain or a pulled muscle keeps you from training till it mends; a broken bone or a concussion keeps you from classes too.`,
    ],
    interpret: [
      'Needed Now on the first line: hunger, grime or stress past its line is costing you every hour it’s left. Most Worth It: nothing is urgent, and this gives back the most readiness, half a point or more.',
      'The readiness figure on Work Out can be below zero: it costs energy today, and readiness doesn’t count fitness.',
      `The Fitness arrow on Work Out is what the workout builds, with the weather as its hour ends and the day’s earlier workouts both in it. The line says which it’ll be, “A run in fine weather” or “Indoors, the weather being no good for a run”, and on a second the same day, “It’s workout 2 today, so it builds ${Math.round(DEVELOPMENT.repeat * 100)}% of a first.”`,
      'The arrows read from now to after: Energy 82 → 72.',
    ],
    // In the order the menu asks (`lookAfterRefusal`), a meal's money in the order `spend` asks it (`spendRefusal`, from
    // 2026-10-12): the first that holds is the one a gray line says. A locked or stopped debit card's line holds only
    // where the bank could make up what the credit card and the cash lack, and the unspent cash's only where the debit
    // card is neither. Until later that day neither line said so, and with everything short the locked card's line,
    // listed first, wasn't the one the menu showed: that was “You can’t afford it.”
    unavailable: [
      `Look After Yourself shows Locked until ${chapter('looking-after')} is read.`,
      '“Not from a hospital bed.”',
      '“You’re at … until ….” In the middle of a commitment, everything but Eat A Meal waits, Order In too.',
      '“You aren’t hungry.” Nourishment is at 90 or over.',
      '“Your debit card is locked, and there isn’t enough on the credit card or in cash.” Or stopped, while a replacement or a new account’s first card is on its way. The meal is left to the credit card and the cash in hand however the day is paid, and they’re short of it, though the bank could make up the rest. With the bank short too, it’s “You can’t afford it.”',
      '“You can’t afford it.” The current account and any savings linked to it, its overdraft where the bank lets a debit card purchase into it (at a US bank that asks, once you’ve opted in), the credit card and the cash in hand come to less than the meal.',
      '“The bank and the card can’t pay it. Cash in hand pays for the day where The Day’s Spending is In Cash, Then The Debit Card.” The debit card is neither locked nor stopped, the day is paid by card, the bank and the card are short of the meal, and the cash in hand would make up the difference.',
      '“Your debit card is past its payment ceiling, and there isn’t enough on the credit card.” A French debit card’s ceiling, for the month or for the last 30 days, has too little left for its part of the meal, and the credit card can’t take all of it.',
      '“You’re already clean.” Hygiene is at 95 or over.',
      `“You’re too tired to train. Sleep first.” Energy is under ${SPENT}.`,
      '“Not with a sprained ankle; it has 4 days yet to mend.” An injury beyond a cut or a knock, with the days it has yet to mend.',
      '“Not with the flu: rest until it passes.”',
      '“… is at …, and there isn’t time.” Something that wants you starts inside the time it takes.',
    ],
    mistakes: [
      'Eating late in the evening when midnight is close: the day’s groceries lift nourishment to at least 76 at midnight anyway, so a meal then buys only what it puts over that. With money for one and not both, the meal is paid as it’s ordered and the groceries at midnight are what go unbought, with “No Money For Food Today”: the day starts on what the meal left, with no 76 under it.',
      'Working out just before a class or a performance: it costs energy, and readiness reads energy now.',
      `Ordering in every meal: it costs about ${DELIVERY.times.toFixed(1)} times as much as eating at home, and adds a restaurant’s calories each time.`,
    ],
    related: ['body.how', 'body.sleep', 'day.weather', 'bank.payments'],
    connections: [
      { to: 'body.how', kind: 'immediate', why: 'Each line moves the dials it names, and readiness with them.' },
      { to: 'day.weather', kind: 'evaluation', why: 'Work Out reads the weather as its hour ends to decide whether it was a run.' },
      { to: 'bank.payments', kind: 'immediate', why: 'A meal is paid the way How You Pay pays the day’s spending: the debit card, the credit card or cash.' },
      { to: 'craft.profile', kind: 'history', why: 'A workout’s fitness is your Stamina on the Player Profile.' },
      { to: 'papers.doctor', kind: 'scheduled', why: 'An injury from a run or a workout brings its care, and its bill.' },
    ],
    example: {
      setup: `A new life’s first morning in New Haven: energy ${FIRST.energy}, stress ${FIRST.stress}, nourishment ${FIRST.nourishment}, hygiene ${FIRST.hygiene}.`,
      steps: ['Open Look After Yourself.', 'Eat A Meal is first, marked Most Worth It. Press it.'],
      result: `It takes ${minutesOf('eat')} and ${usd(MEAL_HERE)}: nourishment goes to 100, and readiness moves ${signed(gainOf('eat'))} on what the meal does alone. Unwind would have given about ${signed(gainOf('unwind'))} and a Shower ${signed(gainOf('wash'))}; Work Out, last, about ${signed(gainOf('exercise'))}, for the ${WORKOUT_ENERGY} energy it costs today.`,
    },
  },
];
