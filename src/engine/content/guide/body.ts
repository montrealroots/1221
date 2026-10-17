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
import { EVALUATION } from '../tasks';
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
    synonyms: ['energy', 'stress', 'readiness', 'wellbeing', 'morale', 'condition', 'fitness', 'stamina', 'nourishment', 'hygiene', 'traits', 'my own page'],
    questions: ['What is readiness?', 'Why is my energy so low?', 'What’s the difference between energy, condition and stamina?', 'What do the colors on the bars mean?', 'What does stress do?', 'Where are the rest of my measures?', 'What does a trait change?'],
    where: { route: '/home', label: 'Home, The How You Are Panel' },
    available: `It opens with ${chapter('body')}. Your traits also open on the Player Profile, from ${chapter('profile')}. Your own page, with all eight measures, opens from your name once you’ve read ${chapter('life')}.`,
    short: 'How You Are, on Home, shows how you’re doing today: a line that sums it up, then Energy, Stress and Readiness. Readiness is how sharp you’ll be at today’s work. Behind them are eight measures of your wellbeing, and four things are easy to mix up. Energy is what you have left for today, and only sleep brings it back. Condition is how sound your body is after illness, hunger, stress and short nights. Fitness is how trained your body is, and it’s the Stamina on your Player Profile. Your health, meaning illness, injury, long-term conditions, your care and your health cover, is on Papers, under Health Cover.',
    steps: [
      'On Home, read How You Are: the line at the top, then Energy, Stress and Readiness, each out of 100.',
      'Press Energy, Stress or Readiness to open it under the panel. It says where it stands and what that means, and Readiness names what’s holding you back most.',
      'Press the line at the top, the panel’s name or your name in the greeting to open your own page. It has all eight measures, Readiness, your traits, any long-term condition and any injury, and each one opens.',
      'On the Player Profile, your traits are listed under “Chosen at the start.”, and each opens there.',
    ],
    needs: [
      `The panel and its three bars open with ${chapter('body')}.`,
      `Your own page opens with ${chapter('life')}, the guide’s last chapter. Until then, Readiness names the measures holding you back and opens them, a trait opens only on the Player Profile, from ${chapter('profile')}, and a long-term condition can’t be opened.`,
      'A long-term condition opens only while you have it, and an injury only while it mends.',
    ],
    costs: [
      { label: 'Time', value: 'None. Opening the panel, or anything in it, doesn’t move the clock' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Energy', value: `Falls ${ENERGY_DRAIN_PER_HOUR} an hour while you’re awake, faster when you owe sleep, and only sleep brings it back. Under ${EMPTY}, stress starts to climb.` },
      { label: 'Stress', value: `Eases while you have energy left and climbs once you run out. Money you owe adds to it every day, and each hour over ${OVERWROUGHT} wears down your condition.` },
      { label: 'Readiness', value: 'Made of seven of the eight measures, all but fitness, from 5 to 100: how sharp you’d be at something right now' },
      { label: 'What Readiness Sets', value: `How much a class, a lab, a rehearsal, an hour of practice or a workout builds, along with how the hour suits an early riser or a night owl. Under ${EVALUATION.sufficientReadiness}, it also costs you in work that’s judged.` },
      { label: 'Condition', value: `How sound your body is. It sets how much energy a night puts back and how likely a year is to be your last. Under ${ESTIMATE.sickBelow}, staying home sick from classes is excused.` },
      { label: 'Fitness', value: `How trained your body is: the same figure as Stamina on the Player Profile. It sets how far rest can mend your condition and what a workout costs. Untrained, it falls toward ${EVERYDAY_FITNESS}, what everyday life keeps.` },
      { label: 'Health', value: 'Illness, injury, long-term conditions, your care and your health cover, all on Papers, under Health Cover. Illness and an emergency take from your condition and energy, and an injury adds to your stress and lowers your mood each day.' },
      { label: 'Traits', value: 'Each changes what it names: how good a night is, how fast stress clears, how far your mood moves, what food costs' },
    ],
    now: ['Opening a bar, a measure, a trait or a condition changes nothing. It shows the figure as it stands.'],
    later: [
      'The measures move every second the clock runs, by what a waking hour costs. A night, a meal, a shower, a workout and an hour unwinding move them back.',
      `Each midnight your body settles. Fitness falls ${FITNESS.perDay} if you haven’t trained in ${plural(FITNESS.heldDays, 'day')}, and condition drifts a little toward what your fitness lets rest mend it to.`,
      `A long-term condition left untreated takes from one measure each week: depression ${CHRONIC.untreated.moraleAWeek} from morale, arthritis ${CHRONIC.untreated.arthritisEnergyAWeek} from energy, diabetes ${CHRONIC.untreated.diabetesConditionAWeek} from condition. Kept up on Papers, it takes nothing.`,
      `An injury takes ${INJURY.weighs.morale} from morale and adds ${INJURY.weighs.stress} to stress each day until it mends.`,
    ],
    interpret: [
      `Energy turns red under ${EMPTY} and amber within 15 above it. Stress turns red over ${OVERWROUGHT} and amber within 15 below it. Those are the points where your body starts to pay.`,
      'Readiness turns red under 25 and amber under 50.',
      'The line at the top names the worst problem first: no energy left, then a lot of sleep owed, then very high stress, then hunger. With none of those, energy over 75 and stress under 30, it says you’re rested and ready.',
      'Readiness, opened, names up to three measures that each cost you more than a twentieth of it, worst first.',
      'A trait’s table shows each thing it changes as a percentage. “All told” is all your traits and dispositions taken together.',
    ],
    unavailable: [
      `Before you’ve read ${chapter('body')}, the panel shows Locked, with Read About It.`,
      `Your name, the panel’s name and the line at the top don’t open anything until you’ve read ${chapter('life')}.`,
      'A long-term condition you no longer have, or an injury that has mended, says so and opens no further.',
    ],
    mistakes: [
      'Taking a low Readiness as a verdict on your acting. It measures today alone, and a night’s sleep and a meal move it most.',
      'Working out to raise readiness on the day. A workout costs energy now, and readiness doesn’t count fitness, so train on a day you can spare the energy.',
      `Leaving stress over ${OVERWROUGHT}. Each hour there wears down your condition, which takes nights to come back. Unwind, or sleep.`,
      'Resting to build stamina. Rest brings back energy and condition, but only working out builds fitness, your Stamina.',
    ],
    next: [
      'Low on energy: press Sleep in the top bar.',
      'Hungry, grimy or stressed: open Look After Yourself in the top bar, where the line that helps most comes first.',
      'Ill or injured: go to Papers, then Health Cover, for your doctor, your care and its bills.',
    ],
    related: ['body.sleep', 'body.look-after', 'papers.conditions', 'craft.profile'],
    connections: [
      { to: 'body.sleep', kind: 'immediate', why: 'A night is what moves energy, sleep debt and condition most.' },
      { to: 'body.look-after', kind: 'immediate', why: 'A meal, a shower, a workout and an hour unwinding each move the measures they name, and the menu says by how much.' },
      { to: 'coursework.class', kind: 'evaluation', why: 'Readiness sets how much a class or a lab builds that day.' },
      { to: 'productions.nights', kind: 'evaluation', why: `A night on stage is judged with your readiness at curtain time: under ${EVALUATION.sufficientReadiness}, coming in tired costs you.` },
      { to: 'school.sick', kind: 'optional', why: `Under ${ESTIMATE.sickBelow} condition, calling in sick is excused.` },
      { to: 'papers.conditions', kind: 'history', why: 'Long-term conditions are kept up or let go on Papers, and your own page says which.' },
    ],
    example: {
      setup: `A new life’s first morning: energy ${FIRST.energy}, stress ${FIRST.stress}, nourishment ${FIRST.nourishment}, morale ${FIRST.morale}.`,
      steps: ['Press Readiness on How You Are.', 'Open Look After Yourself and press Eat A Meal.'],
      result: `Readiness is ${Math.round(READY_FIRST)}. The meal fills you up, and readiness rises by ${gainOf('eat').toFixed(1)} from the meal itself, less what its ${minutesOf('eat')} cost.`,
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
    available: `It opens with ${chapter('sleep')}.`,
    short: `Sleep asks how many hours, from ${SHORTEST_SLEEP} to ${LONGEST_NIGHT}. It suggests a number from when you’re next needed and how much sleep you owe, and says when you’d wake. Then the clock runs through the night at once. A night brings back energy, less the more sleep you owe. It clears stress and sleep debt, and it mends condition only with more than about five hours of real rest. Anything on the calendar in those hours happens without you.`,
    steps: [
      'Press Sleep in the top bar.',
      'Read the suggestion at the top: how many hours it suggests, and why.',
      'Set Hours with the slider, in half hours. “You’d wake at” changes with it.',
      'Read the warnings: your next commitment, whether this would count as tonight’s sleep, and anything you’d sleep through.',
      'Press Sleep and the hours, such as Sleep 8 Hours, or Not Yet to close it.',
    ],
    needs: [
      `It opens with ${chapter('sleep')}.`,
      'You can’t sleep in the middle of a commitment you went to. Sleep is gray then, and says until when.',
    ],
    costs: [
      { label: 'Time', value: 'The hours you choose. The clock moves straight to when you wake' },
      { label: 'Money', value: 'None' },
      { label: 'Food', value: 'Nourishment runs down through the night, a little slower than when you’re awake' },
    ],
    reads: [
      { label: 'How Good The Night Is', value: 'Your stress at bedtime, how deeply you sleep, and the hour. A night that starts between one and five in the morning is a worse one.' },
      { label: 'What You Owe', value: `Sleep debt. A full debt holds back up to ${Math.round(DEBT_HOLDS * 100)}% of the energy a night puts back.` },
      { label: 'Your Age', value: 'A night puts back less at sixty than at twenty' },
      { label: 'Condition And Fitness', value: 'A worn-down body gets up to a fifth less back, and rest mends condition only as far as your fitness allows' },
      { label: 'The Suggestion', value: 'The hours a normal night’s rest takes for you, or the time left before your next commitment, keeping an hour and a half to get up and get there' },
    ],
    now: [
      'The clock goes straight to when you wake, and everything due in those hours happens on the way, without you.',
      'Energy comes back with the hours and how well you slept, less for sleep owed, for age and for a worn-down body.',
      'Stress eases overnight, more when your mood is up.',
      'Sleep debt clears with a full night. A night under six hours adds to it.',
      'Condition mends with more than about five hours of real rest, up to what your fitness allows. With less, it falls.',
      'Your mood moves with the rest. A night of eight hours or more brings it about a third of the way back to where your body settles it.',
    ],
    later: [
      'A commitment you sleep through is missed: an absence from class, a missed call, an unpaid shift, a plan gone by. The next morning’s notice names each one.',
      'A sleep counts as the night of the day it ends in, so the game won’t put you to bed again that day.',
      'A short sleep that ends in the small hours counts as the whole night. You’re up from when it ends, and the dialog warns you first.',
    ],
    interpret: [
      'The suggestion says why it chose that number: a normal night, a clear calendar so you can sleep as long as you need, or the one thing that changes tonight, such as sleep owed, stress, being a light sleeper or a late hour. If a commitment is too soon for a full night, it says how far off it is. If the clock is at a commitment now, it says so, and that any sleep goes through it.',
      'A warning that this would be tonight’s sleep means you won’t sleep the rest of the night: the game won’t put you back to bed after it.',
      `With a commitment less than two and a half hours off, or one you’re at now, it suggests the shortest sleep there is: ${SHORTEST_SLEEP} hours on the figure, the slider and the button, and the button sleeps just that.`,
      'The morning after, Energy and Readiness on How You Are show what the night gave back.',
    ],
    unavailable: [
      `Sleep shows Locked until you’ve read ${chapter('sleep')}.`,
      'Sleep is gray while you’re in the middle of a commitment you went to, and it says where you are and until when.',
    ],
    mistakes: [
      'Taking the suggestion before an early call can mean a short night. It keeps an hour and a half to get there, and a sleep under six hours adds sleep debt. Go to bed earlier instead.',
      'Sleeping through a class because the hours ran over it. The dialog lists what you’d sleep through, so shorten the hours until the list is empty.',
      'A nap under six hours that ends in the small hours, before you’ve slept that night, counts as the whole night, and you’re up from when it ends.',
    ],
    next: [
      'In the morning, check Energy and Readiness on How You Are.',
      'If the morning’s notice says you slept through something, it names what was missed. Open it from What Needs You on Home.',
      'Still owing sleep? A large sleep debt can take more than one night to clear, so go to bed earlier the next night too.',
    ],
    related: ['body.how', 'day.advance', 'day.calendar', 'day.clock'],
    connections: [
      { to: 'body.how', kind: 'immediate', why: 'A night moves energy, stress, sleep debt, condition and morale by the time you wake.' },
      { to: 'day.calendar', kind: 'immediate', why: 'Anything that needs you during the night happens without you and is missed.' },
      { to: 'day.needs', kind: 'history', why: 'Commitments you slept through are named in a notice the next morning.' },
      { to: 'school.standing', kind: 'evaluation', why: 'Classes and calls you sleep through are absences the faculty weigh at the end of the term.' },
      { to: 'day.advance', kind: 'optional', why: `Skipping ahead through the night sleeps for you, but it’s a poorer night that stops at ${COASTING_ENERGY_CEILING} energy.` },
    ],
    example: {
      setup: 'Measured on a new life’s first day at Yale, after Registration at ten, at 11:00 PM: energy 35.5, stress 12, sleep debt 5.3 hours, condition 88 and readiness 46, with Meeting Your Class at ten the next morning.',
      steps: ['Press Sleep. The suggestion is 8 hours, “A normal night.”', 'Press Sleep 8 Hours.'],
      result: 'You wake at 7:00 AM with energy at 100, stress and sleep debt at 0, condition at 89.5, morale up from 62 to 69.6, and readiness at 96. Sleeping 5 hours that same evening instead wakes you at 4:00 AM and counts as the whole night: some sleep debt is left, and condition falls where 8 hours mended it.',
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
    available: `It opens with ${chapter('looking-after')}.`,
    short: `Look After Yourself holds what a day needs besides sleep: ${listed(LABELS)}. Each line says how long it takes, what it costs, why it’s where it is in the list and what it would do to your wellbeing. Whatever is costing you every hour comes first, marked Needed Now. Then come the rest, by how much readiness each gives back, and last what you can’t do right now. Each line waits for you to press it, and the clock then moves through the time it takes.`,
    steps: [
      'Press Look After Yourself in the top bar.',
      'Read each line: how long it takes, its price if it has one, and why it’s there. Under that are the measures it would change and the readiness it gives back.',
      'Press a line to do it. A note says when it’s done.',
      'A gray line says why you can’t do it now.',
    ],
    needs: [
      `It opens with ${chapter('looking-after')}.`,
      `Eat A Meal and Order In: nourishment under 90, and the money to pay. Shower: hygiene under 95. Work Out: energy at ${SPENT} or more, no injury beyond a cut or a knock, and no flu.`,
      'No commitment can start during the time it takes, and none of it can be done from a hospital bed.',
      'While you’re at a commitment, Eat A Meal is the only line you can use.',
    ],
    costs: [
      { label: LOOKING_AFTER.eat.label, value: `${minutesOf('eat')}, and a meal at the local price, before your traits change it: ${usd(MEAL_HERE)} in New Haven`, estimate: true },
      { label: LOOKING_AFTER.order.label, value: `${minutesOf('order')}, and about ${DELIVERY.times.toFixed(1)} times a meal at home: ${usd(ORDER_HERE)} in New Haven`, estimate: true },
      { label: LOOKING_AFTER.wash.label, value: `${minutesOf('wash')}, free` },
      { label: LOOKING_AFTER.exercise.label, value: `${minutesOf('exercise')}, free, and ${WORKOUT_ENERGY} energy at fitness ${FIRST.fitness}: more for a less fit body, less for a fitter one` },
      { label: LOOKING_AFTER.unwind.label, value: `${minutesOf('unwind')}, free` },
    ],
    reads: [
      { label: 'Your Wellbeing', value: 'Each line shows what it would do to you, and the readiness that would come of it' },
      { label: 'Hunger, Grime And Stress', value: `Under 20 nourishment, under 50 hygiene or over ${OVERWROUGHT} stress, the line that fixes it moves to the top and is marked Needed Now, because each hour like that costs condition or mood` },
      { label: 'Readiness', value: 'A workout builds more the readier you are, from 0.4 to 1.2 times its usual amount between readiness 0 and 100' },
      { label: 'The Weather', value: `A workout is a run when its hour ends dry, at ${FINE.runLowC}°C or warmer and feeling no hotter than ${FINE.highC}°C` },
      { label: 'Your Traits', value: 'How much a meal lifts you, how fast stress clears, how far your mood moves and what food costs' },
    ],
    now: [
      'A meal is paid for when you order it. Then its time passes and costs what any waking time does, and the line’s changes come on top of that.',
      'Eat A Meal: nourishment up by as much as 50, to 100 at most, and your mood up by as much as you needed it.',
      `Order In: the same, and a restaurant’s larger meal, ${A_BODY.eatenOut} calories more toward your weight.`,
      'Shower: hygiene to 100, and stress eased by a tenth of what it put back.',
      `Work Out: fitness, your Stamina, up 0.6 at readiness 75, ${RUN_MORE}% more on a run, never past what your age allows. Energy, nourishment and hygiene go down, stress eases and your mood lifts.`,
      `A second workout the same day builds ${Math.round(DEVELOPMENT.repeat * 100)}% of the first, and a third ${Math.round(DEVELOPMENT.repeat ** 2 * 100)}%. A class that trains the body as hard as a workout counts as one of them, and builds what a workout indoors does: ${CLASS_LIST}, attended.`,
      'Unwind: stress down and your mood up.',
    ],
    later: [
      `Fitness holds for ${plural(FITNESS.heldDays, 'day')} after a workout or one of those classes, then falls ${FITNESS.perDay} a day toward ${EVERYDAY_FITNESS}.`,
      `While you’re awake, nourishment falls ${NOURISHMENT_DRAIN_PER_HOUR} an hour. Each midnight the day’s groceries are bought at local prices, and the day starts with nourishment at 76 or more, or 40 if they can’t be paid for, and hygiene at 82 or more.`,
      'A skipped shower costs nothing past its day: each morning starts you at 82 hygiene or more, whatever the day before was.',
      `Your weight follows what you eat against what you burn, moving half the way to its new level in ${plural(A_BODY.halfLifeDays, 'day')}. Eat A Meal is part of the day’s eating and adds nothing extra. Order In adds its ${A_BODY.eatenOut} calories. A run burns ${A_BODY.met.run} METs against a workout indoors’ ${A_BODY.met.workout}, and you don’t eat any of it back.`,
      `An hour’s run risks an injury ${RUN_RISK}% of the time, and a workout indoors ${GYM_RISK}%. A sprain or a pulled muscle keeps you from training until it mends. A broken bone or a concussion keeps you from classes too.`,
    ],
    interpret: [
      'Needed Now on the first line: hunger, grime or stress past its limit is costing you every hour you leave it. Most Worth It: nothing is urgent, and this line gives back the most readiness, half a point or more.',
      'The readiness figure on Work Out can be below zero, because it costs energy today and readiness doesn’t count fitness.',
      `The Fitness arrow on Work Out is what the workout builds, counting the weather when its hour ends and any workouts earlier that day. The line says whether it will be a run in fine weather or a workout indoors, and on a second workout the same day, that it builds ${Math.round(DEVELOPMENT.repeat * 100)}% of a first.`,
      'The arrows go from now to after: Energy 82 → 72.',
    ],
    // In the order the menu asks (`lookAfterRefusal`), a meal's money in the order `spend` asks it (`spendRefusal`, from
    // 2026-10-12): the first that holds is the one a gray line says. A locked or stopped debit card's line holds only
    // where the bank could make up what the credit card and the cash lack, and the unspent cash's only where the debit
    // card is neither. Until later that day neither line said so, and with everything short the locked card's line,
    // listed first, wasn't the one the menu showed: that was “You can’t afford it.” From 2026-10-17 (brief 14) each is
    // said in its own words, not quoted, so a refusal reworded where it's written doesn't leave this one stale.
    unavailable: [
      `Look After Yourself shows Locked until you’ve read ${chapter('looking-after')}.`,
      'In hospital, nothing on the menu can be done.',
      'In the middle of a commitment, everything but Eat A Meal waits, Order In too, and the line says where you are and until when.',
      'Eat A Meal and Order In wait until you’re hungry: nourishment under 90.',
      'With your debit card locked, or stopped while a replacement or a new account’s first card is on its way, a meal can only go on the credit card or cash in hand. If those are short, the line says so, even when the bank could have paid the rest. With the bank short as well, it says you can’t afford it.',
      'You can’t afford it when your current account and any savings linked to it, any overdraft your bank lets a debit card use (at a US bank that asks, once you’ve opted in), your credit card and your cash in hand come to less than the meal.',
      'If the day is paid by card, the bank and the card are short, and your cash would make up the difference, the line tells you to set The Day’s Spending to In Cash, Then The Debit Card.',
      'A French debit card’s payment ceiling, for the month or the last 30 days, can leave too little for its part of the meal. If the credit card can’t take all of it, the line says so.',
      'Shower waits until hygiene is under 95.',
      `Work Out waits while your energy is under ${SPENT}: sleep first.`,
      'Work Out waits while an injury beyond a cut or a knock mends, and the line says how many days it has left.',
      'Work Out waits while you have the flu.',
      'Anything waits if something you’re expected at starts during the time it takes, and the line names it.',
    ],
    mistakes: [
      'Eating late in the evening, close to midnight. The day’s groceries lift nourishment to at least 76 at midnight anyway, so a late meal only adds what it puts above that. With money for one but not both, the meal is paid first and the groceries go unbought, with a notice that there’s no money for food: the next day starts on what the meal left, with no 76 under it.',
      'Working out just before a class or a performance. It costs energy, and readiness counts your energy now.',
      `Ordering in every meal. It costs about ${DELIVERY.times.toFixed(1)} times as much as eating at home, and adds a restaurant’s calories each time.`,
    ],
    next: [
      'Check Readiness on How You Are to see what the line did.',
      'Low on energy? Only sleep brings it back: press Sleep in the top bar.',
      `Building stamina: Work Out on a day you can spare the energy, at least once every ${plural(FITNESS.heldDays, 'day')} to keep your fitness from falling.`,
    ],
    related: ['body.how', 'body.sleep', 'day.weather', 'bank.payments'],
    connections: [
      { to: 'body.how', kind: 'immediate', why: 'Each line moves the measures it names, and readiness with them.' },
      { to: 'day.weather', kind: 'evaluation', why: 'Work Out checks the weather as its hour ends to decide whether it was a run.' },
      { to: 'bank.payments', kind: 'immediate', why: 'A meal is paid the way How You Pay pays the day’s spending: the debit card, the credit card or cash.' },
      { to: 'craft.profile', kind: 'history', why: 'The fitness a workout builds is your Stamina on the Player Profile.' },
      { to: 'papers.doctor', kind: 'scheduled', why: 'An injury from a run or a workout brings a doctor’s care, and a bill for it.' },
    ],
    example: {
      setup: `A new life’s first morning in New Haven: energy ${FIRST.energy}, stress ${FIRST.stress}, nourishment ${FIRST.nourishment}, hygiene ${FIRST.hygiene}.`,
      steps: ['Open Look After Yourself.', 'Eat A Meal is first, marked Most Worth It. Press it.'],
      result: `It takes ${minutesOf('eat')} and ${usd(MEAL_HERE)}. Nourishment goes to 100, and readiness moves ${signed(gainOf('eat'))} from the meal itself. Unwind would have moved it about ${signed(gainOf('unwind'))} and a Shower ${signed(gainOf('wash'))}. Work Out, last on the list, about ${signed(gainOf('exercise'))}, for the ${WORKOUT_ENERGY} energy it costs today.`,
    },
  },
];
