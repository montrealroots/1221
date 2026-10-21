/**
 * SLATE — the guide: every part of the game, in the order a life meets it.
 *
 * A new life starts with everything shut but the guide. Each chapter says
 * what one part of the game does, and reading it opens that part: its
 * commands in the engine (`world/tutorial.ts` refuses the rest), and its
 * buttons, panels and underlined words on screen. The chapters are read in
 * order, so nothing is opened before the thing it leans on has been said.
 *
 * `opens` is the coverage matrix. Every command the engine registers, every
 * kind of look and every gated control on screen belongs to exactly one
 * chapter, and `tests/tutorial.test.ts` fails a command, look or control
 * that no chapter opens, or a chapter that opens nothing.
 *
 * The ids in `opens` are of three kinds: a command's own kind
 * (`life.sleep`), `look.<kind>` for the underlined words that open a look,
 * and `ui.<name>` for a button or panel that runs no command itself.
 *
 * The chapters on the business, the industry, getting around, a car, land,
 * building a house, rent and a roof, people and the assistant went with
 * those parts of the game in the scope reset of 2026-10-09.
 *
 * From 2026-10-17 (the owner's brief 14) each chapter teaches the task it
 * opens, in the brief's order: what it's for, where to go, what to press,
 * what's needed first, what happens, what it affects, what to do next and
 * what if you can't, in the screen's own labels (`tools/tutorial-routes.mjs`
 * looks for each on the built app). The figures and the finer conditions
 * moved behind The Details (`more`). Until then each chapter was one run of
 * paragraphs, the figures among them, and a few said what the game no longer
 * did: “Looking After Yourself” said the menu marked something you loved,
 * which went with the interests on 2026-10-10, and “You As An Actor” sent the
 * player to a Practice button beside each ability, where the Practice column
 * names the exercise and Stamina's says Work Out.
 *
 * From 2026-10-20 (the owner's brief 16, section 8) no paragraph holds five
 * sentences or more: one that held several rules became two or three, and
 * each instruction names its control as the screen's JSX draws it, what
 * pressing it does at once, what happens by itself, what it needs first and
 * what to do when it's grayed out. Until then ten paragraphs ran to five
 * sentences (`tools/voices.ts --guide`) and twenty-three on the built app to
 * four or more (`tools/screen-text.mjs`), and “What’s Coming” said “It
 * happens the next time the clock moves” with nothing before it to say what.
 */

import { ABILITY_DEFS, MASTERED, TECHNIQUES } from './abilities';
import { bankById } from './banks';
import { ROUND_UPS } from './roundups';
import { PRACTICE } from './practice';
import { EVALUATION } from './tasks';
import { ENROLLMENT, PUBLIC_COVER, RETURN } from './safetynet';
import { EXTENDED_STUDY, SKILL_WORDS, SUMMER_CABARET, YALE_CABARET, YALE_DRAMA } from './school';
import { HEADSHOTS as PRO_HEADSHOTS, MATERIALS_KEPT as PRO_MATERIALS_KEPT, REEL as PRO_REEL, SESSION_HOURS as PRO_SESSION_HOURS, SKILL_LISTED_AT as PRO_SKILL_AT, SPECIAL_SKILLS as PRO_SKILLS } from '../systems/pro';
import { PAY as PRO_PAY, sagJoinUsd } from '../systems/propay';
import { AGREEMENT as PRO_AGREEMENT, UNIONS as PRO_UNIONS } from './careerwork';
import { COASTING_ENERGY_CEILING, LONGEST_NIGHT, SHORTEST_SLEEP } from '../systems/life';
import { BRIEF } from '../systems/briefs';
import { ESTIMATE } from '../systems/school';
import { ADVICE } from '../systems/advice';
import { LEARNING } from '../systems/learning';
import { STATUS_GRACE_DAYS } from '../systems/permission';
import { WORK_RULES } from './workrules';
import { PLAN_FREE_IN_INTRO } from '../systems/cardoffers';
import { COLLECTION, SUBSTITUTE } from '../systems/taxreturn';
import { SSN } from '../systems/taxid';
import { formatMoney } from '../core/money';
import { plural } from '../core/text';
import { MONTH_NAMES } from '../core/time';
import { PLAN_LENGTHS } from '../world/plans';

/** Hours as a chapter says them: half an hour, or the count. */
const hoursOf = (hours: number): string => (hours === 0.5 ? 'half an hour' : plural(hours, 'hour'));
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
/** A small count in words, past twelve the figure. */
const word = (n: number): string => WORDS[n] ?? String(n);
/** A count in words with its noun, agreeing with itself: one show, three shows. */
const counted = (n: number, one: string, many = `${one}s`): string => `${word(n)} ${n === 1 ? one : many}`;
/** Days as a chapter says them: whole weeks in words, or the count. */
const daysOf = (days: number): string => (days % 7 === 0 ? counted(days / 7, 'week') : plural(days, 'day'));
/** A share as a percentage: 0.005 is 0.5%. */
const pct = (x: number): string => `${+(x * 100).toFixed(2)}%`;
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
/** A month and day, month first, the way the game writes a date: [4, 30] is April 30. */
const monthDay = ([month, day]: readonly [number, number]): string => `${MONTH_NAMES[month - 1]} ${day}`;
/** The banks whose card plan costs nothing for its life when made while the introductory rate runs. */
const PLAN_FREE_AT = [...PLAN_FREE_IN_INTRO].map((id) => bankById(id)?.name ?? id);

export interface Chapter {
  id: string;
  title: string;
  /** One line: what the chapter is about. */
  lead: string;
  /**
   * What the part of the game is for and how to use it, a paragraph at a time, in the order of the owner's brief 14:
   * what it's for, where to go, what to press, what's needed first, what happens, what it affects, what to do next and
   * what if you can't, as far as each applies.
   */
  body: readonly string[];
  /** The figures and the finer conditions, behind The Details (from 2026-10-17), for a player who wants them. */
  more?: readonly string[];
  /** What reading it opens, said the way the screen names it. */
  names: readonly string[];
  /** The same, by id: commands, `look.*` and `ui.*`. */
  opens: readonly string[];
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'welcome',
    title: 'Your Life, Hour By Hour',
    lead: 'How SLATE works, and how to read Home.',
    body: [
      'In SLATE you live one life, hour by hour, in a real town with its own time, seasons, weather, prices, money and laws. This guide shows you how, one part at a time, and each chapter you read opens the part of the game it explains.',
      'You start on Home. The line under the greeting shows the time, the town, its time zone, the season and the weather. Where You Are, further down, tells you more about the town.',
      'Underlined words are links: press one to see more. Press the town’s name and its details open just below, with more links inside for its region, its country and its money. The date, the season and the daylight work the same way.',
      'Some words only become links once you’ve read the guide chapter that covers them. A panel you can’t use yet says Locked and names the chapter to read. Press its Read About It button to go straight there.',
      'When you’ve read a chapter, press I’ve Read It at its foot to open what it covers, listed under What It Opens. Then press Next, which names the chapter after it, to read on, or Try It to close the guide and use what just opened. Later closes the guide without opening anything, and the line at the top of the screen keeps a Read button for the next chapter.',
      'Once you’ve read its chapter, you can open each part of your life from Home and from the menu down the left. On a small screen, press Menu to see the menu.',
      'Each panel has a How This Works button that explains what the panel does and how it connects to the rest of the game. Press the ? key anywhere for the help’s contents, or the / key to search it. The clock waits while you read the help or this guide.',
      'Save & Exit, in the top bar, saves your life and takes you back to the save slots. Press Continue there to pick up at the same moment.',
      'A new life starts with the clock paused, so nothing happens until you’re ready. Read “What’s Coming” next to open the Calendar panel.',
    ],
    names: ['Where You Are', 'The date, the town, its region and country, its money, the season and the daylight, when you press them'],
    opens: ['ui.where', 'look.day', 'look.place', 'look.region', 'look.country', 'look.currency', 'look.season', 'look.daylight'],
  },
  // Until 2026-10-13 this chapter said a commitment the clock ran had you there if you were awake and in its town. From
  // that day a plan that comes while you’re in hospital is missed (`world/plans.ts`), as care counts anyone in hospital
  // absent (`presentForCare`); found by the guide’s audit of that day. Until 2026-10-20 (brief 16) the paragraph on
  // Stand Here said “It happens the next time the clock moves” after a sentence about pressing Go, so nothing said what
  // happened; it names the commitment now, and that an injury that lays you up keeps you from anything but your own care
  // (`present` in `systems/school.ts` and `systems/health.ts`: classes, calls, labs, shifts, the Cabaret, the paper
  // offices; your doctor and your therapist ask only `presentForCare`), which it left out. The first rewrite that day said
  // "for anything at school"; the coordinator traced `present` to the paper offices too. Until 2026-10-20 (brief 17,
  // section 9) that paragraph said all of it in one sentence, “for anything but your own care, in its town and not laid up
  // by an injury”, which kept a plan of your own and orientation from someone laid up, though neither asks it
  // (`world/plans.ts` and the orientation's own check in `systems/coursework.ts` ask only that you're awake and out of
  // hospital): the injury has a sentence of its own now, with what it keeps you from and what it doesn't.
  {
    id: 'calendar',
    title: 'What’s Coming',
    lead: 'What’s coming up, and what to do when the clock stops for it.',
    body: [
      'The Calendar panel at the top of Home shows what’s coming up: the next thing you need to be at, how soon it is, and up to five more after it.',
      'Press an entry’s name or its time to see when it starts, how long it lasts, where it is and what missing it would cost.',
      'Anything you need to be at is a commitment: a class, a rehearsal call, a work-study shift, an appointment, a plan of your own. When the clock reaches one, it stops, and a dialog with the commitment’s name asks what you want to do.',
      'Press Go to be there. Going takes as long as the commitment lasts, and the clock runs on through it. Stand Here closes the dialog and keeps the clock paused at the commitment.',
      'You can only skip a plan of your own, so there’s no Skip It button for a class or an appointment. Skip It marks your plan missed and carries the clock on, as Go does. If you press Stand Here, the commitment starts the next time the clock moves, whether you press Play, Advance or Sleep.',
      'You miss a commitment if you’re asleep or in hospital when it starts. An injury that lays you up also keeps you from classes, calls, performances, work-study shifts and an office appointment for your papers, though not from your doctor, your therapist, orientation or a plan of your own.',
      'The clock hasn’t moved yet, so nothing has come due. Read “The Clock” next: it opens Play, which starts the clock.',
    ],
    names: ['Calendar', 'Go', 'Skip It', 'The entries on it, when you press them'],
    opens: ['ui.calendar', 'ui.go', 'calendar.skip', 'look.entry'],
  },
  {
    id: 'clock',
    title: 'The Clock',
    lead: 'Starting and stopping time.',
    body: [
      'Press Play, in the top bar, to start the clock, and Pause to stop it. The button always shows what pressing it will do. A new life starts with the clock paused.',
      'The clock runs in real time: a minute in the game is a minute for you. While it runs, life goes on around you. Hours pass, you get tired and hungry, and anything that’s due happens.',
      'The clock stops by itself at every commitment and waits for your answer, as “What’s Coming” explained. Sleep is the exception: it runs straight through everything in those hours, so the Sleep dialog lists what you’d sleep through before you start. The clock also waits while the Sleep, On The Way or Skip To Event dialog is open, so nothing moves while you decide.',
      'If you don’t want to wait, read “Moving Time On” next to jump ahead.',
    ],
    names: ['Play and Pause'],
    opens: ['ui.play', 'world.set_preferences'],
  },
  // Until 2026-10-20 (brief 17, the frame editor's finding) the chapter said the clock stops at each commitment on the
  // way and not what the stop's answers do to the jump: Go carries it on, and Stand Here ends it there with the clock
  // paused (`onGo` and `clearStandingAt` in `ui/shell/TimeControls.tsx`, `halt` in `app/game-context.tsx`). From later
  // that day (the owner's brief 19, D1, D2 and D5) it says Skip It and Call It Off carry the jump on too (`carryOnTo`,
  // `world/clock.ts`), that each line gives the day it lands (Tomorrow Morning after midnight is that date's seven,
  // `nextAtHour`), and that On The Way lists what isn't on the calendar yet (`onTheWay`, `foresight.ts`).
  {
    id: 'advance',
    title: 'Moving Time On',
    lead: 'Jumping ahead, and what happens on the way.',
    body: [
      'To jump ahead instead of waiting, press Advance in the top bar and choose how far: One Hour, This Evening (6 p.m.), Tonight (10 p.m.), Tomorrow Morning (7 a.m.), Next Event, Next Monday (9 a.m.) or One Week. Each line shows the day and the time it lands. Choose An Event opens Skip To Event: pick one of the next fourteen things on your calendar and press Skip To with its name.',
      'Everything on the way happens, in order. If the jump would pass any commitments, a dialog called On The Way first says how many: press Advance there to go on, or Cancel to stay where you are. The clock still stops at each commitment to ask what you want to do: Go takes you to it and carries the jump on afterwards, and Stand Here ends the jump there, with the clock paused.',
      'Skip It, on a plan of your own, and Call It Off, on a rehearsal with a partner, carry the jump on too. On The Way also lists what isn’t on your calendar yet but will be by then, such as next week’s classes.',
      'Time only moves forward, so you can’t undo a jump.',
      'Read “What Needs You” next: it’s where you find out what happened.',
    ],
    more: [
      `If you jump more than an hour through the night, your character goes to bed by themselves from midnight. That’s a poorer night than one you choose with Sleep, and it never brings your energy above ${COASTING_ENERGY_CEILING}. If you let the clock run, or jump an hour at a time, they stay up with you.`,
    ],
    names: ['Advance', 'Choose An Event'],
    opens: ['ui.advance', 'ui.skip'],
  },
  {
    id: 'needs',
    title: 'What Needs You',
    lead: 'What happened while you weren’t looking, and what’s waiting on you.',
    body: [
      'What Needs You, on Home, is where you find out what’s happened and what’s waiting for you: groceries you couldn’t pay for, a late card payment, a teacher’s note on your work, a birthday. The number beside Home in the menu counts the notices and questions waiting.',
      'Press a notice’s title to read it in full. If it has a Go There button, that takes you to the screen it’s about. Once you’ve seen them, press the button that counts them, such as Mark 3 Read, to clear them from the panel.',
      'Some notices are questions, with their answers on buttons. Pressing an answer does it straight away and closes the question; if it can’t be done, a message says why and the question stays. Dismiss takes a question off the list without answering it, but what it was about still stands: a tax return is still due, and you can still deal with it on its own screen.',
      'When nothing is waiting, the panel tells you about anything that still needs your attention, such as money you owe or two commitments at the same time.',
      'Read “How You Are” next, about your energy, stress and readiness.',
    ],
    names: ['What Needs You', 'Mark Read, which counts the notices it clears', 'A question’s answers, and Dismiss', 'A notice or a question, when you press it'],
    opens: ['ui.needs', 'world.mark_read', 'world.take_decision_action', 'world.dismiss_decision', 'look.notification', 'look.decision'],
  },
  // Until 2026-10-12 this chapter called the other dials “one press away” and sent the player to “your own page” for the
  // traits and the conditions, though your own page (`look.person`) opens with “A Whole Life”, the last chapter, and
  // before it Readiness, naming at most three dials, is the only way to another. A trait is pressed on the Player
  // Profile, which opens with “You As An Actor”, and a condition only on your own page: those two chapters say so, and
  // this one names neither page, so nothing here points ahead. Until 2026-10-12 it also said the traits and the
  // conditions each opened when pressed, and named them among what it opened, though nothing on screen shows a trait
  // to press before “You As An Actor”, or a condition before “A Whole Life”. It says what they do, and the two looks it
  // opens are first reached from those chapters' pages. Until 2026-10-19 (brief 15) it said condition came "after
  // illness, injury and rest", though an injury moves stress and morale and leaves condition as it was (`mayHurt`);
  // `tests/guide-chapter-facts.test.ts` holds it. The age ceiling and the traits went behind The Details that day.
  {
    id: 'body',
    title: 'How You Are',
    lead: 'Energy, stress, readiness, and the rest of your wellbeing.',
    body: [
      'How You Are, on Home, shows three numbers: energy, stress and readiness. Energy is what you have left for today. It runs down every hour you’re awake, faster when you owe sleep, and only sleep brings it back.',
      'Stress eases while you still have energy and climbs once it runs out, and money you owe adds to it every day. Readiness is how sharp you’d be for work right now.',
      'Behind those three is the rest of your wellbeing: morale, condition, fitness, nourishment, hygiene and the sleep you owe. Readiness comes from your energy, your stress and all of these but fitness. Press Readiness to see the ones costing it most, up to three, and press any of those to see where it stands and what it does to you.',
      'Condition is how sound your body is. Illness, going hungry, heavy stress and short nights wear it down, and a night of real rest mends it.',
      'Fitness is the same as your Stamina, the ability that keeps you going through a long scene or a night on stage. Neither condition nor fitness is your energy or your health: illness, injury, care and health cover are on Papers.',
      'Read “Sleep” next, about how your energy comes back.',
    ],
    more: [
      'Age sets how high condition and fitness can go. A body in its twenties barely loses a point a year from its best, and one in its seventies loses more than a point a year.',
      'The traits you chose at the start each change how you are by their own amount. So does a long-term condition such as diabetes, if it goes untreated.',
    ],
    names: ['How You Are', 'Energy, stress, readiness and the rest of your wellbeing, when you press them'],
    opens: ['ui.how', 'look.dial', 'look.readiness', 'look.trait', 'look.condition'],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    lead: 'Going to sleep, and getting your energy back.',
    body: [
      // The dialog's own limits (from 2026-10-12: until then this said "between one and fourteen", and the slider began at one).
      `Sleep is how you get your energy back. Press Sleep in the top bar, and the Sleep dialog asks how many hours, from ${hoursOf(SHORTEST_SLEEP)} to ${hoursOf(LONGEST_NIGHT)}. It suggests a number, from how much sleep you owe, whether you’ve already slept since midnight and when you next need to be somewhere, and shows when you’d wake.`,
      'Press the button with the hours on it, such as Sleep 8 Hours, and the clock runs on to when you wake. Not Yet closes the dialog. The clock waits while it’s open, so Not Yet leaves it where it was.',
      'A night’s sleep gives you energy back, though less the more sleep you owe. More than about five hours of real rest also mends your condition, as far as your fitness and age allow, and less than that wears it down. A night under six hours adds to the sleep you owe.',
      'Life goes on while you sleep, and you miss any commitment in those hours. The dialog lists them before you press.',
      'While you’re at a commitment, Sleep is grayed out, and the top bar says when you’ll be free.',
      'Read “Looking After Yourself” next, about eating, washing, working out and unwinding.',
    ],
    names: ['Sleep'],
    opens: ['ui.sleep', 'life.sleep'],
  },
  {
    id: 'looking-after',
    title: 'Looking After Yourself',
    lead: 'Eating, washing, working out and unwinding.',
    body: [
      'Press Look After Yourself, in the top bar, for everything a day needs besides sleep: Eat A Meal, Order In, Shower, Work Out and Unwind. Each line shows, before you press it, how long it takes, what it costs and what it would change. Pressing one moves the clock on by that long, and a message says when it was done.',
      'What matters most right now is at the top. Anything that costs you more every hour you leave it comes first (hunger, going unwashed, stress past its limit), then whatever would do most for your readiness. The top line is marked Needed Now or Most Worth It.',
      'Your groceries are bought for you at the start of each day, at your town’s prices, and you eat through them during the day. If there’s no money for them, a notice in What Needs You says so, and you don’t eat enough that day.',
      'Eat A Meal feeds you and lifts your morale, more the hungrier you were. Order In does the same without the cooking, at the price of a delivery.',
      'Shower gets you clean and eases stress. Unwind eases stress and lifts your morale.',
      'Work Out builds fitness (your Stamina) and eases stress. It costs energy, uses up some of what you’ve eaten and leaves you needing a shower. On a dry, mild day it’s a run, which builds a little more than a workout indoors.',
      'If you can’t do something right now, it’s grayed out with the reason.',
      'Read “Your Own Plans” next, to put something of your own on the calendar.',
    ],
    more: [
      'Your weight follows what you eat against what your body burns. A meal ordered in counts as a restaurant’s larger one, and a workout or a show burns more. As the years go by your body burns less, so the same meals put weight on. A heavier body is more likely to develop diabetes, high blood pressure or arthritis, and to die sooner.',
      'You can get hurt on a run, in a workout or on stage, or on an ordinary day. A sprain or a pulled muscle stops you training until it heals. A broken bone or a concussion keeps you out of classes too, as a stay in hospital does.',
    ],
    names: ['Look After Yourself'],
    opens: ['ui.look-after', 'life.look_after'],
  },
  // Until 2026-10-12 this chapter named a Cancel button the Calendar doesn't have (it's Call It Off), said a plan was
  // missed if you were somewhere else when it came, though nothing in the game has moved you since a life begins
  // (`currentLocationId`), and said only plans slept through on your own were missed, though one inside a Sleep you
  // choose is missed too (`world/plans.ts`). Until 2026-10-13 it named sleep alone, rightly then: from that day a plan
  // that comes while you’re in hospital is missed too, where until then it was kept.
  {
    id: 'plans',
    title: 'Your Own Plans',
    lead: 'Putting something of your own on the calendar.',
    body: [
      `Press Open Calendar, on Home’s Calendar panel, to see the whole month. Press a day, then Put Something On It. Fill in What Is It, When It Starts and How Long It Takes, from ${PLAN_LENGTHS[0]!.label.toLowerCase()} to ${PLAN_LENGTHS[PLAN_LENGTHS.length - 1]!.label.toLowerCase()}, and press Put It On: the plan goes on your calendar, or the form says why it can’t.`,
      'A plan of your own works like any other commitment: the clock stops at it, and you choose Go or Skip It. You can have two commitments at the same time, and the calendar marks them Clash.',
      'To take a plan off before it starts, press it on the Calendar screen, then Call It Off. If you sleep through a plan, or it comes while you’re in hospital, you miss it.',
      'A plan happens in the town where you make it, and nothing in the game takes you away from that town.',
      'Read “Weather” next to see the weather in your town.',
    ],
    names: ['Open Calendar', 'Put Something On It and Call It Off', 'Your plans and the stretches between them, when you press them'],
    opens: ['ui.open-calendar', 'calendar.schedule', 'calendar.cancel', 'look.plans', 'look.stretch'],
  },
  {
    id: 'weather',
    title: 'Weather',
    lead: 'The weather in your town, today and the days ahead.',
    body: [
      'The Weather panel on Home shows the weather now and for the next few days. Press today’s weather, or any day, to see more: the week, each day and each hour.',
      'The weather comes from your town’s climate and the season, with some day-to-day luck, and it stays the same however often you look.',
      'It affects two things: whether a workout is a run outdoors, and the weeks when the flu goes around.',
      'Read “Drama School” next: it’s where your life as an actor begins.',
    ],
    more: [
      'Thunderstorms come as often as published counts say for the big cities that have them. Everywhere else they’re estimated from the town’s climate, and they come mostly on hot days.',
    ],
    names: ['Weather', 'The sky, the week, each day and each hour, when you press them'],
    opens: ['ui.weather', 'look.weather', 'look.forecastday', 'look.hours', 'look.skyhour', 'look.skyweek'],
  },
  // Until 2026-10-12 this chapter sent the player to the Player Profile, which the next chapter opens, for the
  // abilities; gave academic warning as the only bar to a Cabaret show and left a leave out of both the Cabaret's and
  // the Summer Cabaret's (`cabaretRefusal`, `summerRefusal`); said a Summer Cabaret performance missed lost you the
  // company, though one missed called in sick, in hospital or laid up is excused (`systems/school.ts`); and named the
  // School panel, a line in Your Affairs since 986ac341. Until 2026-10-13 it said six terms in good standing or with a
  // concern brought the MFA, though the degree needs every course passed (`degreeShortfall`), a course not passed at the
  // last evaluation leaving the days to ask for a repeat or an additional term (`offerRepeat`), and an open Incomplete
  // holds it (`conferIfReady`); found by the guide’s audit of that day.
  // From 2026-10-16 it names Run It With A Reader, the partner part worked without the partner (`READER`).
  // From later on 2026-10-16 (the school's integration items, docs/verification/remaining/school-checklist.json): a piece
  // missed counts as due and Unready, and toward its course's pass; Coursework This Term counts the term as the review
  // will; the evaluation's floors and steps are said to be SLATE's reading of the Bulletin; and the teacher's note is said
  // to be the game's words. Until then the chapter said a piece not shown counts as unready and nothing of the course.
  // From 2026-10-19 (brief 15) work-study comes before casting, as a first term meets them, and the tuition went behind
  // The Details; the casting paragraph names what a play asks, from `content/plays.ts`, where it had said "a voice and
  // speech that carry and the body" of every play.
  // Until 2026-10-20 (brief 17, section 9) the note was said to be "under Feedback on the piece", which a card shows only
  // for a piece the course revises (`FeedbackBlock`); the rest are under Work Shown. And nothing said how a note is put
  // right: a later showing with its part at `LEARNING.enough`, in any course, since the ledger is kept by part
  // (`resolveNote` in `show`), or a later answer the text supports for a note on the table work; and, for a piece the
  // course revises, its showing again, which takes the note by `noteTaken`'s own marks.
  {
    id: 'school',
    title: 'Drama School',
    lead: 'Classes, coursework, casting and your degree at Yale.',
    body: [
      'You start as a first-year in the MFA in Acting at the David Geffen School of Drama at Yale University, in New Haven: one of the sixteen actors admitted this year, among the strongest of them but not ahead of everyone. You arrive on the first day of the fall term for registration and orientation, and classes start a week later.',
      `The school is where you train, get cast and earn your degree. To open it, press the ${YALE_DRAMA.short} button on the School line in Your Affairs on Home, or choose School in the menu.`,
      'The School line shows your year, your standing, your place in the class and what’s next. The School screen’s tabs are Standing And Craft, Classes, Coursework, Casting, Shifts And Pay, and Terms And Award.',
      'Classes run from nine to three on class days. Go to them, awake and in New Haven, and your craft grows, more if you arrive rested. Your fifteen classmates improve too, each at their own pace, and you’re cast alongside them and against them.',
      `If you’re unwell, press Call In Sick, on Classes, before the day’s first commitment starts (on a class day, at the latest when the clock stops at nine for your classes). You count as unwell with the flu, an injury that limits your work, or condition under ${ESTIMATE.sickBelow}. If you’re well, the button is grayed out and says why.`,
      'Calling in sick excuses the day’s classes, labs, rehearsal calls and work-study shift, and a partner rehearsal you miss while you’re ill isn’t held against you. A day in hospital is excused without asking. Staying away when you’re well counts as an absence.',
      `Your craft, on Standing And Craft, is the ${TECHNIQUES.length} techniques the school trains and four of your abilities: Emotional Depth, Memory, Physical Expression and Vocal Expression. A technique is a skill a class trains. An ability is something about you, and your Player Profile shows all twelve.`,
      'Composure, shown beside your craft, eases the nerves that add stress before every performance, and every performance builds it.',
      'Each course sets pieces in class: a scene, a song, a movement score. On Coursework, prepare each piece with its steps, such as Read The Scene, Learn Lines and Rehearse Alone. Each step takes time on the clock, and a message says how long it took and what it added.',
      'Once you’ve read the text, choose an answer to each question under Table Work; until then, they’re grayed out. Where the text supports more than one answer to a question, any of them is right.',
      'On a piece you perform, choose how to play it under How You’ll Play It (its pace, its scale, its structure), and press Play It This Way. Choosing how to play a scene isn’t the same as rehearsing it: the choice only pays off once you’ve rehearsed it on your feet.',
      'A scene pairs you with a classmate. To rehearse together, choose a Day and a Time under Rehearsing With, at least two hours ahead, and press Ask with their name, such as Ask Zoe. They answer at once, and if they say yes, the rehearsal goes on your calendar.',
      'A rehearsal that goes ahead builds your scene together and their trust in you. Your partner may ask you too: answer with Say Yes or Say No by the time they give, since leaving them without an answer costs a little of their trust.',
      'If they say no or don’t turn up, press Run It With A Reader to work your side of the scene with someone reading their lines. It’s slower, and your partner’s side stays where it was.',
      'Shown Today, on each piece, tells you where it stands now: what it would come to if you showed it today, which parts are still short, and the steps that would fix them. It’s a forecast, not a result.',
      'On its due date, the piece is shown at that day’s class if you’re there. If you’re excused, it moves to the course’s next class, or with none left isn’t held against you. Miss the class without an excuse and it can’t be shown later, so it counts as Unready.',
      'When a piece is shown, your own work is judged, and so is the scene as a whole, with what your partner brought, which also changes the bond between you. Your teacher’s note says what held it back most. The note is the game’s, written as your course’s teachers would say it.',
      'The note comes as a notice, and stays under Work Shown on Coursework. A piece the course wants to see again keeps it under Feedback on its card: work on the note before its next class, with Work On The Note or the steps for that part, so that showing it again takes the note.',
      `Otherwise, a note stays open until a later piece, in any course, is shown with the part it named at ${Math.round(LEARNING.enough * 100)}% or more, or, for a note on an answer at the table, answers that question the way the text supports. Your Notes, on Coursework, shows where each note stands.`,
      'If too many of a term’s pieces are coming out Unready, you’ll get a notice during the term, A Word On Your Coursework, with the date the faculty review it. That’s a warning, not the review itself: the review comes at the end of the term’s classes.',
      'At the term review, the faculty look at your attendance at classes, calls and assigned shifts, how you’ve grown compared with the class, your work on stage and your coursework. Coursework This Term, on Standing And Craft, counts the term the way the review will.',
      'Fall short on any of them and you drop a step: from good standing to academic concern, from concern to academic warning, and from warning to dismissal. Meet them all and you’re back in good standing.',
      'Every student works: six hours on the Saturdays of class weeks, and at least 50 more hours of evening shifts front of house at Yale Rep during the term. Each press of Take An Elective Shift, on Shifts And Pay, books the next free evening, seven to eleven, and says which. You’re paid for your hours on Fridays.',
      'From your first spring, the chair casts you in one of the School’s productions each term, and once a year, if you’re in good standing, you’re at Yale Rep too, usually as an understudy, ready to go on if an actor can’t. Casting shows your part and Why This Cast. Between rehearsal calls, Learn The Part, Catch Up The Blocking and Work On The Note prepare your part. Blocking is where you move on stage, set at the early calls.',
      'Missing two calls in a term, labs and rehearsals together, takes you out of the casting pool until a term review finds you in good standing. Missing a performance, or not being in New Haven when you’re called to go on, is a serious breach: it puts you on academic warning straight away, and if you’re already on warning, you’re dismissed.',
      'Work It Through, on a scene or a part, lists the problems its forecast shows, worst first. Press one, then a way of working on it: it takes the minutes on its button and shows the figure before and after. Then press Keep It or Put It Back.',
      'The Yale Cabaret is the students’ own theater: Join A Cabaret Show, on Casting, puts you in one of its shows, one a term, and says the week it plays. In the spring of your first and second years, Join The Summer Company, on Casting too, puts you in the Yale Summer Cabaret for the summer, with a weekly stipend. When you can’t join, the panel says why where the button would be.',
      'Plays To Read, on Coursework, lists plays first staged since 2000. Press Read It to read the Haas Arts Library’s copy, and once you’ve read it, Research It.',
      'Read “You As An Actor” next. It opens your Player Profile: your abilities, your practice and the genres you work in.',
    ],
    more: [
      'Your craft, in the order the School screen lists it: Accents And Dialects, Audition Technique, Character Work, Classical Text, Clown And Mask, Cold Reading, Comedy, Dance, Emotional Depth, Improvisation, Intimacy, Memory, On Camera, Physical Expression, Scene Study, Script Analysis, Singing, Speech, Stage Combat, Vocal Expression and Voice-Over. Acting, the row below them, counts scene study twice, with character work and emotional depth, and it’s what a Yale Rep part asks for most. A part is cast on the techniques its play asks for, which differ from play to play: Shakespeare asks most for classical text, with voice and speech, and Macbeth and Julius Caesar for stage combat too. Whatever work you do builds the techniques it trains.',
      'The first fall has Drama 50, three weeks of afternoon labs, and the first spring the New Play Lab, three weeks workshopping the first-year playwrights’ new plays. The last spring opens with your own solo piece, You Are The Creator. Each is a call, like a rehearsal. Work-study comes to 150 hours a year.',
      'The productions are the Carlotta Festival as a first-year; a directors’ thesis or the Langston Hughes Festival in a later fall, and a thesis or the Carlotta Festival in your second spring; and a Shakespeare Repertory Project in your last spring. When you’re on call at Yale Rep, the Rep calls three hours before each curtain, at five for an evening show and at eleven for a Sunday matinee. Be in New Haven then. The evening is yours unless you’re needed; if you are, you’re told, and the performance goes on your calendar. Every understudy plays one run-through for the director.',
      'For each play, the chair weighs every student the same way: how well you fit it, meaning what a night of it would come to from your abilities and the techniques it asks for, including what its kind of play demands. A fifth of that rides on how much of yourself you gave in your last run. A lead last time counts a little against another lead, and a small part a little for one. The best fit gets the biggest part written for them. Why This Cast, on Casting, shows where each student stood.',
      'Each night is judged on the techniques and abilities the part asks for, the lines, blocking and notes your calls and your own work have given you, and how rested you are. A performance takes the play’s running time and tires you according to its workload: how long it runs, how much of it you’re on stage, and what it asks of your body and voice, a little less with an interval. Your stamina carries you through the late scenes and saves up to half the energy it costs, and The Evening’s Workload, under A Night Now, shows it before the curtain. A night comes out as an off night, Solid, Strong or Remarkable, the last three starting at LAMDA’s pass, merit and distinction, and the director gives you a note at the end of the run.',
      `Join A Cabaret Show puts you in a show at least ${daysOf(YALE_CABARET.leadDays)} away, in a week clear of your days off, casting calls, nights on call, labs and work-study shifts. You can’t join one while you’re on academic warning or on leave, or while you’re cast in two productions at once. Join The Summer Company needs good standing, no leave, and your name in by ${monthDay(SUMMER_CABARET.applyBy)}; the summer has ${counted(SUMMER_CABARET.runs.length, 'show')}. A day you called in sick, spent in hospital or were kept off by an injury excuses a Cabaret or Summer Cabaret call. Miss a Summer Cabaret performance for any other reason and the company goes on without you.`,
      'At the review, a piece you missed without an excuse counts as due and Unready, and a course where half the pieces due weren’t shown isn’t passed. The standings come from the Yale Bulletin, which has the faculty evaluate students regularly. One review a term, the marks it asks for and its one-step drops are estimated.',
      `After the program’s six terms, you’re awarded the MFA if you’re in good standing or on academic concern and have passed every course. If the last term ends on academic warning, the faculty don’t recommend the degree. A course not passed leaves you ${plural(EXTENDED_STUDY.requestDays, 'day')} to ask to repeat the year or for an additional term, where either is open to you; after that, the faculty don’t recommend the degree. An Incomplete still open holds the degree up until you make it up.`,
      'The problems Work It Through can name are a part of the scene that isn’t secure, a turn you haven’t worked, stamina running out late, or an ability holding it back. You keep or put back each change to how a part of the scene is played, and what you keep carries into every later rehearsal and performance. Between a production’s calls, the director names one of these too, somewhere in the play (what you want, listening, pacing, the physical life, a change, a relationship), with ways to work on it: press Work On The Note with one of them, and the next call says whether you answered it.',
      'On the School screen, the school’s name, each course and each technique are links. The school opens onto this year’s courses and the town, a course onto the techniques it trains and the next day it meets, and a technique onto where you stand in it compared with the class.',
      'The tuition scholarship pays every student’s tuition. Yale’s help with living costs depends on need, and your family’s means rule it out, so the Yale Health plan, billed each term, and your living costs come out of your bank account.',
    ],
    names: ['School', 'Your school, from its line on Home', 'Call In Sick', 'Take An Elective Shift', 'Join A Cabaret Show', 'Join The Summer Company', 'Coursework: preparing, the table, how you’ll play it, asking your partner, and Run It With A Reader', 'Work It Through: name a problem, try a way, keep it or put it back', 'Learn The Part, Catch Up The Blocking and Work On The Note', 'Plays To Read: Read It and Research It'],
    opens: ['ui.school', 'school.call_in_sick', 'school.withdraw', 'school.request_leave', 'school.cancel_leave', 'school.return_notice', 'school.buy_affiliate', 'school.reregister', 'school.request_repeat', 'school.cancel_repeat', 'school.appeal_leave', 'school.request_extra_term', 'school.request_aid_review', 'school.pay_balance', 'school.request_conversion', 'school.make_up', 'school.extend_incomplete', 'school.take_shift', 'school.cabaret', 'school.summer_cabaret', 'school.orientation', 'school.prepare', 'school.choose', 'school.read_feedback', 'school.ask_partner', 'school.answer_partner', 'school.respond', 'school.make_amends', 'school.buy_ppe', 'school.approach', 'school.choose_playing', 'school.choose_part_playing', 'school.cancel_rehearsal', 'school.learn_part', 'school.review_blocking', 'school.work_note', 'work.identify', 'work.try', 'work.settle', 'plays.read', 'plays.research', 'look.school', 'look.course', 'look.skill', 'look.assignment', 'look.classmate'],
  },
  // From 2026-10-16 it says the same day's halving and discipline's lift reach every growth (`grown`), the hour's gain is
  // said before it, the abilities that speed a step, and that a technique past mastery moves no result.
  // The traits on the Player Profile are said here from 2026-10-12, where the Profile itself opens: until then only
  // “How You Are” spoke of them, and sent the player to a page that opened chapters later. Work It Through on a brief
  // is said here too, where the brief is, and not in “Drama School”, which opens its commands a chapter before the brief.
  // From 2026-10-16 each genre's register (`content/genre-register.ts`) is said here too, where its brief is.
  // From later that day, how a way of playing suits the scene (`systems/interpretation.ts`) and the forecast advice (`systems/advice.ts`).
  // Until 2026-10-17 What To Work On was said to forecast an hour of practice, where it forecast twenty sessions from brief
  // 10; that day (brief 11) it came to say preparation's figure apart, and, given again, how long it had stood and what moved.
  // Later that day (brief 12) it came to say what its forecast assumes, whether preparation or training deserves attention,
  // and what moved a forecast in parts.
  // From 2026-10-20 (brief 16) it names the Profile's What To Work On Next and Why This Recommendation, where the advice's
  // reasons went that day (`AdviceCard`), and calls the figure an estimate, as the card does.
  // Until later that day (brief 17, section 9) it said practice past four hours a day "stops counting", where the fifth
  // hour is refused and Practice An Hour grayed out with the reason under it (`practiceRefusal`).
  // Brief 17's material editor found terms a new player meets unexplained: a self-tape and a brief's beats are said in
  // plain words where this chapter first names them, from that day, and blocking and an understudy in “Drama School”.
  {
    id: 'profile',
    title: 'You As An Actor',
    lead: 'Your abilities, your practice, and the genres you work in.',
    body: [
      'The Player Profile shows you as an actor. Open it with Player Profile in the menu, or press your name at the bottom of the menu.',
      `Attributes And Craft lists your ${word(ABILITY_DEFS.length)} abilities: the acting abilities Emotional Depth, Presence, Listening And Responsiveness, Imagination, Focus, Memory, Adaptability, Composure, Vocal Expression and Physical Expression, and beside them Discipline and Stamina. Each runs from 0 to 100. Press one to see what it is, how it grows and where it counts.`,
      `Techniques, below it, lists your ${TECHNIQUES.length} techniques, the skills the school trains, and each is Mastered at ${MASTERED}. The traits you chose at the start are under Identity And Background, at the top: press one to see what it changes.`,
      'Four different things make you better: your abilities, your techniques, your genre knowledge and practice. Your abilities are part of you: how you listen, how you hold your nerve. Your techniques are skills a class trains. Your genre knowledge is how well you know a kind of play or film.',
      'Practice is work you set yourself, outside class. Classes, coursework, rehearsals and nights on stage build what they train, up to the level classes reach. Practice takes you further, all the way to the top.',
      'To practice, press the exercise in the Practice column beside an ability or a technique, such as Comic Timing, choose a Tier and a Focus, and press Practice An Hour. Before you press it, the line above the button says about how much the hour will add, and why. The hour moves the clock on, and what it found shows under the button.',
      `Doing the same work again on the same day builds only half as much, whether it’s a class, a night or an exercise. After ${word(PRACTICE.dailyHours)} hours of practice in a day, more stops helping, so Practice An Hour is grayed out until tomorrow, with the reason under it. A technique past ${MASTERED} improves no result, because no piece asks more of it.`,
      'A finished piece, whether a showing, a night on stage or a self-tape (a scene you record yourself, as an actor does for a casting), is judged on the qualities your teacher looks for: believability, interpretation, connection, execution, consistency and responsiveness, as each piece calls for them. Each piece says what held it back and by how much. Your Work So Far looks across all your pieces: what they show most, and what keeps holding them back.',
      'Under Genres, Study It reads a play or watches a film of that genre, which builds your Familiarity with it. Every genre also has a practice brief, an original scene written for SLATE. Press Open Its Brief to read where and when it’s set, who the two of you are, what you want, what’s in the way, and its beats, the moments where the scene turns.',
      'On the brief, prepare it with Break It Down, Learn The Lines and Rehearse It On Your Feet, each with its minutes on the button. Under Your Reading, choose what you take the scene to be about and press Read It This Way.',
      'Then choose how to play it under How You’ll Play It and press Play It This Way. Once you have, Work It Through works on it as it does on a class scene.',
      'Under Read With, choose who reads the other part, a recording or a classmate who learns it as you rehearse together, and press Read With Them. When you’re ready, press Tape It: it takes an hour, and a message gives the tape’s result.',
      `A self-tape also asks you to know its genre. Your genre knowledge is the better of your Familiarity and your Work In It (your nights on stage and self-tapes in that genre), and it counts as complete at ${Math.round(BRIEF.complete.genre * 100)}. A genre you’ve never met costs you at most ${Math.round((1 - EVALUATION.partFloor.genre!) * 100)}% of a tape’s interpretation.`,
      `What To Work On Next, on the Player Profile, names what’s most worth training now, and a brief has its own What To Work On. Each estimates what ${word(ADVICE.sessions)} hours of practice, an hour a day, would add to your recent work. It’s an estimate, not a result.`,
      'Press Why This Recommendation, under it, to see what the estimate assumes and what else is worth your time. What finishing a piece’s own preparation would bring is said there apart from training, so you can tell how ready a piece is now from how ready it could be.',
      'A way of playing a scene can suit it or work against it, depending on the scene: its genre, its reader, its tones, its turns and the reading you’ve chosen. One that suits the scene is easier to make work and quicker to rehearse, and one that works against it is harder. Either can make the better tape if it plays to your strengths, and the tape tells you which did.',
      'Your tape with your reader is what a casting office would see. A Strong tape earns a callback: a harder version of the scene with a note on how to play it, which only a tape played that way answers.',
      'Loving a genre makes a rehearsal or a night in a play of that kind a better day for you, but it never makes the performance better.',
      // Until 2026-10-20 this sent the player to Papers' chapter; “Your Career” comes between them from brief 19.
      'Read “Your Career” next. It opens the Career screen: your profile, headshots, résumé and reel.',
    ],
    more: [
      'Discipline grows with each day you practice and each call you keep, and it makes everything classes, nights, preparation steps and practice build count a little more, or a little less. Practice doesn’t train Stamina: Stamina is your fitness, built by Work Out, under Look After Yourself, and by a class that works the body as hard, Movement Invention or stage combat. Some abilities make a session get more done: memory when you learn lines, imagination at the table and in a brief’s breakdown, focus when you get to know a scene, listening when you rehearse with a partner or a reader or rehearse a brief with its reader, and adaptability when you revise after a note or work on a director’s note about the blocking.',
      'Which abilities count most depends on the piece. A long text calls on memory, high stakes on composure, little of a partner to play off on presence, many beats on discipline, a grave piece on emotional depth, a comic one on focus, and an invented world on imagination. A night in front of an audience calls on presence, memory, composure and discipline as well, and on stamina according to how long and hard it is. With every ability at full, every technique mastered, the preparation complete and you rested and well, a piece comes to 100.',
      `A self-tape counts toward your Work In It for its genre according to how prepared it was: one taped cold counts ${Math.round(BRIEF.practiceUnprepared * 100)}% as much as a prepared one. Where research has established what a genre asks of an actor, its brief stages that technique, and the brief shows it before you begin. Each genre is played in its own register, one or two concerns such as feeling held in, comic rhythm or belief in what isn’t there. The Genre Asks names them on its brief; each pulls the tape toward what it asks for, and a tape held back by an ability one of them calls on says so.`,
      'What To Work On can recommend something other than what held your last tape back most, and it says when two things are about as useful. Under Why This Recommendation, it says what its estimate assumes about your tapes and their genres, names any it counts as fully prepared, and says whether preparation, training or both are worth your time now. When you come back to it, it says how long its recommendation has stood, what has changed since and what changed it, and what to do next.',
      'A tape is judged beat by beat: how well each beat is rehearsed, how far into the tape it comes, where your stamina starts to show, and any slip in the beat before, which composure and adaptability help you recover from. Your own result is yours alone, whoever reads with you.',
    ],
    names: ['Player Profile', 'Practice', 'Study It', 'Open Its Brief', 'Break It Down, Learn The Lines, Rehearse It On Your Feet', 'Read It This Way', 'Read With', 'Tape It', 'Your Work So Far', 'An ability, a genre and a piece of work, when you press them'],
    opens: ['ui.profile', 'practice.exercise', 'genre.study', 'brief.prepare', 'brief.choose', 'brief.reader', 'practice.self_tape', 'look.ability', 'look.genre', 'look.work'],
  },
  // From 2026-10-20 (the owner's brief 19): the professional record's portfolio (`systems/pro.ts`), after the Player
  // Profile it builds on, since a reel is cut from the self-tapes taped there.
  {
    id: 'career',
    title: 'Your Career',
    lead: 'Your professional profile, the headshots, résumé and reel a submission sends, and your work’s pay and unions.',
    body: [
      'Career, in the menu under Your Work, shows where you stand as a professional actor. Its Overview says what training you have, when you’re free for work, whether you can work in the US, and what your portfolio is missing.',
      'The Portfolio tab holds what a submission sends: your profile, headshots, a résumé and a reel. Each says where it came from, when it was made and what’s in it. Each button says its time and cost before you press it.',
      'Your Profile shows the name you work under. To change it, type a name under Professional Name and press Use This Name. Leave it blank and press it to go back to your own name. Your résumé uses the name you choose.',
      `Book A Headshot Session takes ${counted(PRO_HEADSHOTS.minutes / 60, 'hour')} and costs about ${formatMoney(PRO_HEADSHOTS.cost, 'USD')}, both estimated. Photographers work by day, so a session starts ${PRO_SESSION_HOURS}. Headshots more than two years old read as out of date.`,
      'Make Your Résumé takes an hour. It lists your name, training, unions, credits and special skills from your record, with School credits and professional credits apart. Practice, practice briefs and self-tapes are never credits.',
      'Once something new is on your record, such as a part played or a skill grown, your résumé reads as behind. Press Update Your Résumé to bring it up to date.',
      `A reel is cut only from recorded work: self-tapes of practice briefs, the School’s filmed monologues once they’re posted at the end of your last term, and screen work once it’s released. Choose up to ${word(PRO_REEL.most)} pieces under Recorded Work To Cut From and press Cut A Reel. It takes two hours and about ${formatMoney(PRO_REEL.cost, 'USD')}, both estimated.`,
      'A night on stage and a class piece aren’t recorded, so they can’t go on a reel. A voice brief is a sound recording, so it can’t either.',
      // From 2026-10-21 (brief 19's pay): the Work tab, its pay, commission, permission to work and the unions
      // (`systems/propay.ts`), opening Join SAG-AFTRA.
      `The Work tab lists work you’ve booked: its dates, its calls on your calendar and its pay. Pay is promised when you accept the work, and paid the Thursday after each week of it with tax withheld. If you’re represented, it goes through your agency, which takes its commission and passes the rest on within ${word(PRO_PAY.trustBusinessDays)} business days. Each payment says what was taken and what reached you, and Money shows it land.`,
      'Your permission to work is read for each date of the work when you book it, and signing with an agency changes none of it. On an F-1 while you’re a student, outside acting work isn’t open to you. On OPT after your degree, each day of work counts as a day worked.',
      `Your degree makes you a member of Actors’ Equity, and ${formatMoney(PRO_UNIONS.equity.down, 'USD')} of its initiation fee is taken then. A SAG-AFTRA role on a TV show or a theatrical or Low Budget film lets you join SAG-AFTRA. From the ${PRO_UNIONS.sagAftra.joinWithinDays}th day after that work began, SAG-AFTRA work needs you to be a member: press Join SAG-AFTRA on the Work tab first.`,
      'If a button is grayed out, the line under it says why: you’re busy then, your bank can’t cover it, or your résumé already has everything on your record.',
      'Read “Cover, Benefits And Returns” next. It opens Papers: your health cover, benefits and tax returns.',
    ],
    more: [
      `A technique goes on your résumé as a special skill once it reaches ${PRO_SKILL_AT}: ${andList(PRO_SKILLS.map((s) => SKILL_WORDS[s]))}. Once it’s mastered, the résumé says so.`,
      'When you graduate, the degree makes you a member of Actors’ Equity, as the School’s Bulletin says, and your profile and résumé show it from that day.',
      `Your record keeps the last ${word(PRO_MATERIALS_KEPT)} of each kind of material you make, and every credit for good.`,
      `Commission is taken only on work you contracted while represented: ${pct(PRO_AGREEMENT.commission)} at most, ${pct(PRO_AGREEMENT.equityLowTier.rate)} on an Equity contract paying ${formatMoney(PRO_AGREEMENT.equityLowTier.weeklyAtOrBelow, 'USD')} a week or less, and on SAG-AFTRA work only what’s paid over scale. A contract made while an agreement ran still carries it after the agreement ends.`,
      `Equity’s initiation fee is ${formatMoney(PRO_UNIONS.equity.initiation, 'USD')}, paid within three years, and its basic dues ${formatMoney(PRO_UNIONS.equity.yearlyDues / 2, 'USD')} each May and November. Joining SAG-AFTRA costs about ${formatMoney(sagJoinUsd(), 'USD')}, read from a search engine’s copy of its pages. Each union takes working dues from union pay.`,
    ],
    names: ['Career', 'Overview', 'Portfolio', 'Work', 'Use This Name', 'Book A Headshot Session', 'Make Your Résumé and Update Your Résumé', 'Cut A Reel', 'Join SAG-AFTRA'],
    opens: ['ui.career', 'pro.set_name', 'pro.headshots', 'pro.update_resume', 'pro.cut_reel', 'pro.join_sag'],
  },
  // Until 2026-10-12 this chapter opened enrollment only after Yale Health had ended, with a gap before the new cover,
  // and counted a plan dropped or left unpaid as cover lost (`mayEnroll`, `healthMonth`); offered Mexico City's Seguro de
  // Desempleo, which has taken no new claim since 2026-10-09 (`desempleoRefusal`); gave mid-April as every return's day,
  // though a 1040-NR with no wages is due June 15 (`nonresidentDeadline`), and 21 days for every refund; and said a
  // substitute return the IRS filed stood, with its penalties, unless your own came within its 120 days, though one
  // filed after it is reconsidered from 2026-10-10 (`systems/taxreturn.ts`). Until 2026-10-13 it said every February
  // brought a year’s return, though from that day a year with nothing owed or due back and income under the standard
  // deduction has none (`registerTaxReturn`); found by the guide’s audit of that day. Until 2026-10-15 it said nothing
  // of New Haven’s two practices or of Yale Health paying only at its own; that Enroll asked a program’s income and
  // nothing more, though from 2027 HUSKY D asks the work of an applicant too, and Covered Connecticut a status with the
  // premium tax credit; that a program only ended at renewal, where it now moves to the other; and that Connecticut’s
  // return on a June 1040-NR was due in April: each found by the current scope’s acceptance of that day. Until 2026-10-16
  // it said Medicaid asked $580 earned in the month before of anyone renewing, though a renewal reads six months, income
  // of any kind meets it and some are excepted; that a program ended at renewal at once, though a notice and thirty days
  // come first and an ending is said ten days ahead; and that Covered Connecticut took any income from the poverty line.
  // Until 2026-10-16 too it said the IRS wrote every five weeks from filing, as it did then, before the due date on a
  // return filed early, with no bill first; from that day its bill (Notice CP14) comes at filing and its letters count
  // from the due date (`nextNotice`, `billed`; the integration pass's tax item 1). Until 2026-10-17 it said Medicaid asked
  // 80 hours' work first, which nobody off the School can do in SLATE, and school at least half-time (brief 12).
  // Until 2026-10-19 (brief 15) it said to see a doctor by choosing a practice and pressing Book An Appointment, though
  // that button books only a visit owed, missed or called off, and the game books the rest itself (`health.book`,
  // `systems/health.ts`); `tests/guide-chapter-facts.test.ts` holds it. That day it also named SNAP, which it opens, and
  // said a Connecticut claim pays only once you've left school.
  {
    id: 'papers',
    title: 'Cover, Benefits And Returns',
    lead: 'Health cover, benefits, pensions and tax returns.',
    body: [
      'Papers holds your health cover, your benefits and pension, your tax returns and your documents. To open it, press the Papers button on the Papers line in Your Affairs on Home, or choose Papers in the menu.',
      'The Papers line shows what covers you, any unemployment pay, and anything that needs doing, such as a tax return that’s due. The Papers screen’s tabs are Tax Returns, Health Cover, Unemployment, Passport And ID, and Permission To Work.',
      'While you’re at school, the Yale Health plan covers you. It’s billed each term, and it pays for a doctor’s visit only at Yale Health Center. Your Cover, on Health Cover, shows what covers you and what it costs.',
      'You don’t book a doctor whenever you like. When you’re ill enough to need one, or a long-term condition is due for its review, you get an appointment at your practice after its usual wait, and it goes on your calendar. Where more than one practice would see you, choose yours under Your Doctor, on Health Cover.',
      'In New Haven, Yale Health Center sees a student it covers the next weekday, at no charge. When the clock stops at the appointment, press Go to be seen. If you miss it or press Call It Off beside it, you aren’t seen, and Book An Appointment, beside the visit you’re owed, books it again.',
      'Each piece of care brings a bill for your share, the part your plan doesn’t pay, under Care And Its Bills. On its due date it’s taken from your checking account, and if there isn’t enough, it becomes medical debt, which Pay It Off settles. If you have insurance, Apply For Assistance puts a Connecticut hospital bill in for the hospital’s financial assistance before it’s due.',
      `After school, Yale’s plan covers you to the end of July. From ${ENROLLMENT.specialDays} days before it ends, press Enroll, under The Marketplace on Health Cover, to join the cover you qualify for: Medicaid or a state program if your income is low enough, or a marketplace plan.`,
      'Enrolling isn’t the same as being covered: you’re covered only from the plan’s start date, usually the first of the next month. Drop The Plan ends a plan of your own.',
      'A long-term condition such as asthma needs care each month, which you pay for under Your Long-Term Conditions, on Health Cover. Let It Go stops the care, and Keep It Up starts it again. Depression can be lifted by a course of therapy: choose a Therapist where you live and press Begin A Course Of 8 Sessions.',
      'If you’re out of paid work, press File A Claim, on Unemployment, to claim unemployment insurance where you live, if your past wages qualify; in Connecticut a claim pays only once you’ve left school. SNAP, on the same tab, puts food assistance on an EBT card for groceries; press its Apply button to ask for it. You claim a state pension on Unemployment too, once your work record and your age allow.',
      'Each February, the year’s tax return is ready on Tax Returns if you owe tax, are owed a refund or earned at least the standard deduction, and every year on an F-1. Press File It by mid-April.',
      'When you file, any balance is paid from your bank, savings included, and filing late with a balance costs penalties. Whatever your bank couldn’t pay grows until you settle it with Pay.',
      'After you report a document lost or stolen, File A Police Report, beside it on Passport And ID, files a report online where the police take reports that way. Report Lost itself opens with the next chapter.',
      'Read “Passports And ID” next, about your passport, your ID, and your permission to study and work.',
    ],
    more: [
      `Enroll takes you into Medicaid (Medi-Cal in California, HUSKY D in Connecticut), New York’s Essential Plan or Covered Connecticut, with no premium, whenever last month’s income is low enough. Cover starts on the first of the next month (HUSKY D on the first of the month you enroll), or when Yale’s ends, if that’s later. From 2027 Medicaid asks for a month spent partly at the School, or a month with ${formatMoney(PUBLIC_COVER.workEarnings, 'USD', { cents: false })} of income (pay, interest or a benefit counts), unless you’re 65 or over, on SNAP under its work rules or, if you ask, in hospital that month. In Connecticut that’s the month before you apply, or any one of the ${PUBLIC_COVER.workLookBack.ct.renew} months before a renewal. If you fall short, Apply For HUSKY D brings a notice giving you ${PUBLIC_COVER.answerDays} days from receiving it to answer, and at renewal the notice keeps you covered meanwhile. Request A Hardship Exception answers it with a stay in hospital.`,
      `Covered Connecticut is for an income over HUSKY D’s line and at least at the poverty line, and from 2027 for a citizen or a green card holder; it ends once Yale Health covers you again. Your program is checked again at renewal, every six months from 2027. If last month’s income now fits the other program, you’re moved there with no gap. If you fit neither, or don’t meet its work rules, it ends at the end of a month, with at least ${PUBLIC_COVER.advanceNoticeDays} days’ notice, and it also ends if you move out of the state.`,
      `Otherwise, Enroll buys the marketplace plan in New York, California or Connecticut, starting the same way. You can enroll during open enrollment, in the ${ENROLLMENT.specialDays} days before Yale Health ends, or within ${ENROLLMENT.specialDays} days of losing cover; dropping a plan or leaving it unpaid doesn’t open that window. Each month you live in California without cover adds California’s penalty to your tax return. A marketplace plan may deny a claim (KFF finds one in five are denied): the care is then billed as if you were uninsured, and Appeal It within 180 days gets a decision within 60.`,
      'New York and California don’t pay the first week of a claim, and Connecticut does. A week with some work pays less, or nothing, and a week abroad pays nothing. If you live in Britain as a British or Irish citizen, File A Claim is for Universal Credit: assessed a month at a time and paid a week later, it’s the standard allowance, less 55p for each pound earned and something for savings over £6,000, and nothing with savings over £16,000. In Ireland it’s Jobseeker’s Allowance, €254 a week for the days out of work, less something for savings over €20,000. You claim a state pension under Unemployment: Claim Social Security, or Claim It for the UK’s or Ireland’s State Pension, the IMSS pension or the Pensión para el Bienestar. A pension has federal tax withheld each month.',
      'You get ill at a young adult’s rates, and catch the flu more often when you’re short of sleep or stressed, in the weeks your town’s climate brings it. A Connecticut hospital takes its financial assistance off an uninsured patient’s bill straight away. With insurance, Apply For Assistance makes the bill free if your income is up to 250% of the poverty line, and 67% off up to 550%. Buy Dental adds a dental plan of your own where your health plan pays nothing for the dentist, in New York or alongside a Covered California plan; Drop Dental ends it, though Yale’s, paid for the year, runs to its end.',
      `On a 1040-NR with no wages, the return is due by June 15, though Connecticut’s return is still due in mid-April. UK tax is settled separately for each UK tax year, by the next January 31. The IRS pays a refund ${RETURN.refundDays} days after you file, ${SSN.itinWeeks} weeks later on a 1040-NR filed without a Social Security number, and a state pays on its own schedule. What your bank couldn’t pay grows from the due date, by the IRS’s ${pct(COLLECTION.interest)} a year in interest and a penalty of ${pct(RETURN.payLateMonthly)} a month, up to ${pct(RETURN.lateCap)} of it. The IRS bills it when you file. If you leave it, the IRS writes every ${counted(COLLECTION.noticeWeeks, 'week')} from the due date, the last letter a final notice, and ${plural(COLLECTION.finalDays, 'day')} after that it takes the balance from your bank accounts.`,
      `If you never file a return that owes tax, the IRS files one for you ${plural(SUBSTITUTE.afterDays, 'day')} after it was due, from what your employers and banks reported. If you file your own within ${SUBSTITUTE.answerDays} days, it replaces the IRS’s before any of it is assessed; if you file later, the tax becomes what your return says, and the penalty and interest fall in proportion.`,
      'Where a place publishes how long people wait to see a doctor, your appointment comes after that wait: in England anywhere from the same day to five weeks, four days in New York and thirteen in Los Angeles, the next day for about a quarter of people in Canada (a week otherwise, estimated), and twenty-nine days at IMSS for a Mexican. Fair Haven Community Health Care, in New Haven, sees anyone and publishes no wait, so it books after the average for fifteen American cities, twenty-four days, and bills a Yale Health member as uninsured. Ireland publishes no wait, so a visit there isn’t booked ahead. A visit can end in a referral, as often as doctors there refer, and you see the specialist after the published wait: a month in America, twelve weeks in England, eleven in Ontario and twenty in British Columbia.',
      'In England a prescription costs £9.90 an item if you’re under 60, and a prepayment certificate, £32.05 for three months or £114.50 for a year, makes every one free while it lasts: press Prepay Three Months or Prepay A Year. An emergency keeps you in the department for the median time where you live, 204 minutes in New York or nearly six hours in Ireland, and you miss whatever was on in that time. In America, Your Pharmacy fills a generic at its own cash price, never more than your plan’s copay: $4 at Walmart against a $40 median.',
      'A long-term condition is reviewed at NICE’s interval, with a doctor’s visit booked for it. Its medicine is refilled where you live when a week of the supply is left, 28 days’ worth in England and 30 in America; Fill A Longer Supply gets up to 56 days in England, 90 in America and 100 in Ontario. A course of CBT is NICE’s eight weekly sessions at the practice’s own price, or free on the NHS in England, its first session six weeks away. Once it’s finished, it lifts depression as often as published figures say, 48.5% of the time for NHS Talking Therapies and 36% for a private course, and a lifted depression no longer weighs on you.',
    ],
    names: ['Papers', 'Your Doctor, Book An Appointment and Your Pharmacy', 'Pay It Off and Apply For Assistance', 'Enroll, Apply For HUSKY D, Request A Hardship Exception and Drop The Plan', 'Appeal It', 'Keep It Up, Let It Go and Fill A Longer Supply', 'A Therapist, and Begin A Course Of 8 Sessions', 'Prepay Three Months and Prepay A Year', 'Buy Dental and Drop Dental', 'File A Claim, and Apply under SNAP', 'Claim Social Security and Claim It', 'File It and Pay, on Tax Returns', 'File A Police Report and Report Stolen'],
    opens: ['ui.papers', 'health.therapy', 'documents.police_report', 'health.appeal', 'health.extra_supply', 'health.enroll', 'health.drop', 'health.pay_bill', 'health.apply_aid', 'health.treat', 'health.dental', 'health.choose_clinic', 'health.book', 'health.cancel_appointment', 'health.prepay', 'health.apply', 'health.request_hardship', 'benefits.claim', 'benefits.ei_register', 'benefits.assistance', 'pension.social_security', 'pension.state', 'pension.ie_state', 'pension.imss', 'pension.bienestar', 'tax.file', 'tax.pay', 'tax.amend', 'tax.apply_plan', 'tax.catch_up_plan', 'tax.revise_plan', 'tax.pay_state', 'tax.apply_state_plan', 'tax.catch_up_state_plan', 'tax.lien_release', 'tax.lien_dispute', 'tax.federal_lien_withdraw', 'tax.request_waiver', 'health.choose_pharmacy'],
  },
  // Until 2026-10-12 this chapter's lead offered a border to cross, though nothing has traveled since 2026-10-09; it said a
  // new passport took whatever was issued on the old one, though only a travel authorization goes (`issuePassport`);
  // it said Report Lost canceled anything you held, though only a passport, a license, an international driving permit
  // and an ID card are lost, an F-1 refused (`LOSABLE`, `systems/documents.ts`); and it said a lost license was
  // replaced only where it was issued for someone living there, though from 2026-10-10 New York sends one out of state
  // by mail (`licenseReplaceRefusal`, `systems/identity.ts`). From 2026-10-16 (brief 09's journeys) the ID card's sentence
  // says what a license run out leaves: until then nothing here or on its row did, and nothing in SLATE renews one. From
  // 2026-10-17 it says Connecticut mails the card (`ID_CARDS`): until then it was in force at the counter, and this said
  // nothing of when it came. Later that day (brief 12) it says where a fee or a term is SLATE's assumption, and that the
  // screen says so: until then nothing here did. Until 2026-10-20 (brief 17) the F-1's sixty days, OPT's twelve months and
  // its ninety days without work were typed here; they're read from `STATUS_GRACE_DAYS` and `WORK_RULES.opt` now.
  {
    id: 'documents',
    title: 'Passports And ID',
    lead: 'Your passport and ID, what other countries ask of you, and your student status.',
    body: [
      'Your passport and ID are on Papers, under Passport And ID, and your student status and what follows it are under Permission To Work. Press any document you hold to see who issued it, the last digits of its number, when it was issued and when it runs out, and what it lets you do today.',
      'A passport comes from the country you’re a citizen of, at its passport office’s fee and in its office’s time. Under Your Passport, press Apply For One, or Renew It if you have one, and, where the office sells a faster service, Apply Faster or Renew It Faster.',
      'Applying pays the fee, and a message says when the passport should arrive. You hold the new passport only once it’s issued, and it cancels the old one, along with any travel authorization issued on it.',
      'Your ID is the ID card of the state you live in. Under Your ID, press Get with the card’s name to apply for one at its fee. Connecticut mails it: a message says the day it comes, and you can use it as photo ID once it arrives.',
      'A new bank asks to see valid photo ID (a passport, a license or an ID card) before it takes you on. A license that runs out can’t be renewed in the game, so use an ID card or a passport instead.',
      'To report a passport, a license, an international driving permit or an ID card lost, press Report Lost beside it, or Report Stolen if it was stolen, then Cancel It. It’s canceled for good, even if it turns up. A lost passport cancels whatever was issued on it too, except an F-1.',
      'Replace It, beside a lost license, gets a new one from the state that issued it if you’re living there, or by mail from out of state where the issuer sends one, as New York does. In New York a replacement is free if the license was stolen and the police have your report: use File A Police Report, online where the police take reports that way, as New Haven’s do.',
      'Replace It, beside a lost ID card, gets a new one from the state that issued it, if you live there, at its fee, and it arrives after the issuer’s published wait.',
      'Going Abroad shows what each country asks of someone with your citizenship: whether you can just go, need a travel authorization first, or need a visa. Choose a Country to see what it asks for and what you’re missing.',
      'You can’t travel in the game, so this is information, not a form to fill in. A visa or a travel authorization covers a visit only: staying, or working, needs a different permission.',
      `On an F-1, you’re in US status while you study and for ${STATUS_GRACE_DAYS.f1} days after your program ends. After the degree, Apply For OPT, on Permission To Work, asks for ${word(WORK_RULES.opt.months)} months’ permission to work in your field, which you lose after ${WORK_RULES.opt.unemploymentDays} days in all without work. Residence Abroad says what another country asks before you can make a home there.`,
      'Read “Money” next, about everything you have and owe.',
    ],
    more: [
      'Some countries want your passport to be valid for some months past the day you leave. Where an office’s fee from abroad couldn’t be found, as with New Zealand’s GST, the fine print says so and the fee is estimated. For anyone who isn’t a citizen, an ID card’s term is estimated too, since the state doesn’t publish one, and Your ID says so.',
      'Replacing a lost ID card costs the issuer’s fee: $8 in New York, $30 in Connecticut, $40 in California (free from 62), $10 in Ontario, $15 in British Columbia, nothing at the INE, and €35 for Ireland’s passport card.',
    ],
    names: ['Passport And ID', 'Apply For One, Renew It and Apply Faster', 'Get, for the state’s ID card', 'Report Lost and Replace It', 'File A Police Report', 'Permission To Work and Apply For OPT', 'Residence Abroad'],
    opens: ['documents.apply_passport', 'documents.replace_idcard', 'documents.report_lost', 'documents.apply_idcard', 'documents.replace_license', 'documents.apply_opt', 'documents.apply_ssn', 'documents.residence', 'documents.settle', 'documents.renew_residence', 'documents.naturalize', 'look.document'],
  },
  // Until 2026-10-12 this chapter said Money showed your card and your credit record, and that the record showed as a
  // number or a word: Home's card-and-record panel (`CardSummary`) went when Home's affairs became a line each
  // (986ac341, committed 2026-10-09), and the record's own figure shows only when a life is made
  // (`ui/creation/CharacterCreation.tsx`).
  {
    id: 'money',
    title: 'Money',
    lead: 'Everything you have and owe, at a glance.',
    body: [
      'The Money line in Your Affairs on Home shows your primary checking account and your net worth (what you have, less what you owe), and, if you owe anything, how much. Your money is kept in the currency of the country you started in.',
      'Press Your Affairs, the panel’s title, to see what you’re worth, and from there each account and each debt.',
      'Your credit score decides whether a bank gives you a card, an overdraft or a loan, at what rate where the bank prices by it, and how high a card’s limit is and whether it’s raised.',
      'Your score rises with each card payment made on time, and slowly with no card at all while nothing is late or in collections. It falls when you use a card past 30% of its limit, pay late, miss a loan payment, apply for a card, leave a medical debt unpaid for a year, or have a debt charged off to collections.',
      'You see the score only when a life is made, as a number in the United States and Canada and as a word elsewhere. After that, you can tell it from what banks will do for you.',
      'Your accounts and your card are at your bank. Read “Your Bank” next to open them.',
    ],
    more: [
      'Your net worth is what you have in the bank, in cash and in a pension from before, less what you owe on cards and loans, in unpaid bills, medical bills and collections.',
    ],
    names: ['Money', 'Your accounts, net worth and debts, when you press them'],
    opens: ['ui.money', 'look.account', 'look.networth', 'look.debt'],
  },
  // Until 2026-10-12 this chapter put Statements “under the accounts”, though they had had a tab of their own since the
  // bank went into five tabs (f4350bbc, 2026-09-26); said Move Money moved money at once, though from 2026-10-10 a move
  // to another bank lands in the sending bank's time (`systems/bankmoves.ts`); said asking for help with payments got the
  // plan, though from 2026-10-10 the bank refuses anyone whose current accounts and savings could clear the card
  // (`systems/cardlife.ts`); said a payment the current account couldn't make came back unpaid and owed, though a
  // purchase that can't be paid isn't made (`spendRefusal`), and what comes back is a loan's payment or a card's
  // autopay; said autopay drew on any savings linked, though the link reaches easy-access savings at the bank of the
  // account each payment comes from; and put a fee on every card plan, though Chase's made in its introduction costs
  // nothing (`PLAN_FREE_IN_INTRO`). Until 2026-10-13 it said an autopay that bounced always charged the returned-payment
  // fee and counted as missed, though a US card charges only the late fee for a bounce that leaves the minimum unpaid,
  // and a minimum already paid by hand isn’t missed (`DUE_KIND`, `systems/credit.ts`); and that a hardship plan’s card
  // was suspended until it was paid off, though the plan, and the suspension with it, ends only at the first statement
  // or due date after; both found by the guide’s audit of that day. Until 2026-10-15 it named no current account among
  // what a cooling-off period cancels, no country that keeps cards or deposits out of one, and said nothing of the
  // sixty days starting again after Take The Loan; found by the current scope’s acceptance of that day. Until 2026-10-16
  // it said nothing of an account kept at home, which creation had opened since that day’s module 3 (`systems/abroad.ts`).
  // Until 2026-10-20 (brief 17) The Details said a US card's introductory rate ended, and its penalty rate came, with "a
  // payment sixty days late": both come at the second due date missed in a row (`credit.missed >= 2`), which the late
  // notice calls thirty days late, and it says that now (the money editor's finding).
  {
    id: 'bank',
    title: 'Your Bank',
    lead: 'Your accounts, cards, payments and borrowing, at a real bank where you live.',
    body: [
      'Your money is at a real bank in the country you live in, in accounts with that bank’s own names and with numbers written the way that country writes them. To open the bank, press the button with its name on the Money line in Your Affairs on Home, or choose Money in the menu. Its tabs are Accounts, Cards, Payments And Cash, Borrowing, and Statements.',
      'With two accounts or more, Move Money, on Accounts, moves money between them: choose From, To and the Amount, and press Move It. Between two accounts at the same bank, it moves at once.',
      'To another bank, Move Money takes the sending bank’s time, or its country’s where the bank doesn’t set one, unless the country’s banks pay instantly. A message says the day it arrives, and until then On Its Way, on Accounts, lists it. That money is pending: it has left one account and isn’t in the other yet, so you can’t spend it.',
      'An account that earns interest builds it each day, and the bank pays it at the end of the month, or in the months it pays interest. A checking account with a monthly fee takes the fee at the month’s end, unless that month met one of the bank’s conditions for waiving it, such as enough paid in, enough kept in the account, enough card purchases, or your age. Each account’s panel, on Accounts, says whether this month’s fee is waived so far.',
      'Your credit card, on Cards, is the bank’s own, with its own name and terms. Its statement comes on the 20th, or the day you set under Statement Day. Pay each statement in full and you’re charged no interest on it, unless the one before wasn’t paid in full.',
      'Autopay pays the whole statement, or only the minimum, from the checking account it’s set on: its button says which, and pressing it switches. Pay Card In Full pays the card off now; when you can’t cover all of it, the button says Pay What You Can and pays what you have.',
      'If there isn’t enough to cover autopay, the payment comes back unpaid, and unless you’ve paid the minimum yourself, it counts as missed. Paying less than the minimum is late and costs a late fee. Miss two payments in a row and the card is suspended; miss six and it’s charged off to collections.',
      'If your checking accounts and savings together can’t clear the card, press Ask For Help With Payments, on Cards: the bank freezes the interest, sets a payment that clears the balance in four years, and suspends the card until the first statement or due date after it’s paid off.',
      'To apply for a card at any bank in the country that issues one, yours or another, choose the Bank under Credit Card, on Cards (Another Card once you hold one), and press Apply For This Card. The bank looks at your credit score and what you have to repay it from. If it says yes, the card comes in about a week.',
      'You can hold one card from each bank. The day’s spending goes on your everyday card, and Make It The Everyday Card moves it to another.',
      'Statements, on their own tab, show every entry on each account you’ve held, month by month, with the balance after each. The Year adds up the interest, the tax taken off it and every fee. Alerts tell you, in What Needs You, when a checking account ends a day below an amount you set, when a payment is over an amount you set, when a statement is ready, and, unless you turn it off, when an account can’t cover a payment due in the next few days.',
      'How You Pay, on Payments And Cash, sets how the day’s spending is paid: by debit card, by credit card or in cash. If that way can’t cover a purchase, it isn’t made, and you owe nothing for it. Under Cash, on the same tab, Take It Out takes money out at a machine or the counter, for the bank’s fee, and Pay It In pays cash back in.',
      'Under Your Cards, on Cards, Lock It stops anything new going on a card, and Unlock It undoes that. To stop a card lost, stolen or damaged, choose which and press Report It: it stops working at once, and a new card with a new number follows. If a charge isn’t yours, press Report It As Not Mine beside it in time: the law decides how much of it you pay and how soon the rest comes back.',
      'If your bank offers one, Overdraft, on Borrowing, lets your account go below zero, with interest and any fee. Personal Loan, on Borrowing, lends you money repaid in equal monthly payments.',
      'To bank somewhere else where you live, choose the Bank under Open An Account At Another Bank, on Accounts, and press Apply. Where the country has a switching service, Switch Bank moves everything there for you.',
      'Read “A Whole Life” next: your own page, birthdays and the end.',
    ],
    more: [
      'Interest is paid on the last day of the month, or in the months the bank pays it: at each quarter’s end in Germany, in February and August in Japan, and in December on a Livret A. Where the country has banks take tax off interest first, yours does. Where a bank publishes no rate, the rate shown is estimated, and the screen says so.',
      // From 2026-10-16 (brief 09's follow-up): each German bank's fee on its own day (`feesPostAt`); until then this said
      // every German bank took it at the quarter's closing.
      'Deutsche Bank, Postbank and Berliner Sparkasse take a checking account’s monthly fee at the quarter’s closing, and ING on the 1st of the month after.',
      'A card’s terms are its rate, or the range of rates it sets by credit score; any yearly fee; the minimum payment; the late fee; and the days to the due date, all within the law’s caps. Autopay also takes from easy-access savings at the same bank as its account, if you’ve linked them. If they can’t cover all of it, the card charges a returned-payment fee for the miss, except on a US card, where the late fee covers the same miss. If a statement isn’t paid in full, the interest built up until the day you clear it comes on the next statement. Outside the US, paying less than the minimum also goes on your credit record and lowers your limit; in the US that happens only if the payment is still short at the next due date, thirty days later. Some banks, many in Europe among them, issue a card that takes the whole statement every month and can’t carry a balance. Where a bank’s card terms couldn’t be found, they’re estimated, and the screen says so.',
      'Each card has its own statement, due date and minimum, and your credit record looks at how much of all their limits you’ve used together. Move the statement day and the due date moves with it. You can ask for a higher or lower limit, and say whether the bank may raise it without asking. In the US you can opt in to going over the limit, or not. Close a card and nothing new goes on it while what you owe is paid down.',
      'Once a statement isn’t paid in full, interest builds each day on what the card owes; paying a statement in full keeps new spending interest-free. Your credit score sets the rate when the card opens, and it stays there. In the US two payments missed in a row end any introductory rate, and where the card has a penalty rate, it applies after 45 days’ notice until six payments in a row are on time. Pay more than you owe and the card holds the credit; Send The Credit To My Account moves it back to you.',
      'In Germany, whose banks close an account each quarter, statements run quarter by quarter. A card’s statement says what it asked for and what paying only the minimum would take. Turned on, Savings Covers The Checking Account pays what a checking account can’t from easy-access savings at the same bank, for anything that account pays: the day’s spending from your primary account, a card’s autopay from the account it’s set on, and a loan’s payment from its repayment account. A standing order moves money into savings on a set day each month, and you can set a payment for a date.',
      'You can take cash from your bank’s ATM, another bank’s, the counter, or in Britain the Post Office where your bank allows it, each for the bank’s own fee, and from the machines no more in a day than the bank allows; another machine’s owner may add a fee of its own. A cash advance on the card costs its fee and charges its rate from the day you take it, with no grace period, and a payment to the card goes to the more expensive balance first (in the US, only what you pay above the minimum does). You can pay for the day’s groceries in cash. At a German bank that sets a limit, a savings account lets out €2,000 a month without notice, whether as cash, as a move or as a payment, and no more.',
      'After you report a card, the new one arrives in the bank’s usual time, for its fee, and a card about to expire has its replacement sent ahead. Someone else may use your card, as often as the country’s official figures say it happens: the bank stops some of it and asks you, and the rest shows up in an alert or on your statement. Where the bank offers it, Move My Account To A New Number gives your checking account a new number and a new debit card.',
      `Some cards start with an introductory rate for some months, pay rewards on your spending, lend money into your account as a money transfer, or let you put part of what you owe on purchases into a plan paid off in equal monthly amounts, at the plan’s own fee or rate instead of the card’s interest${PLAN_FREE_AT.length ? `; at ${andList(PLAN_FREE_AT)}, a plan made during the card’s introductory rate costs nothing` : ''}. A card you apply for at another bank can take over the balance of one you already hold, for its fee and at its transfer rate, and the old card closes once the balance has moved.`,
      `A term deposit locks money away at a fixed rate for its term. At the end, the bank does what it does by default unless you choose another option it allows, in time for any notice it needs: renew it for the same term, with any grace days to take it all out; move it into easy-access savings; or pay it out. The bank writes to you before the end. Where the bank allows it, Break It Early costs the bank’s penalty, which you see before you press it, and it comes out of the deposit itself if the interest won’t cover it; some banks need notice first. Some banks let you take the interest during the term, or charge for savings withdrawals past a number of free ones a month.`,
      `${Object.keys(ROUND_UPS).length} banks move money into savings at the same bank as you spend, each in its own way: rounding up to the next unit you choose, a set amount per purchase, or, at KakaoBank, the leftover of the day’s balance, on the bank’s own day and never into an overdraft. Where the bank leaves a choice to you, such as the unit or the amount, you make it before round-ups start. An account you leave unused goes inactive and then dormant, blocked until you press Reactivate, and after the country’s set number of years its money goes to the state, which you can claim back. Where the country has a cooling-off period, you can cancel a new account or card other than your primary account within it: in Korea only a card, in Canada anything but a card, in Britain anything but a fixed-rate deposit, and in Mexico only one you haven’t used.`,
      'You can open a savings account, or close it and move its money back. Where Germany’s monthly limit applies and the account holds more than a month lets out, closing it means giving three months’ notice, and it closes then. Past the bank’s free withdrawals in a month, each one out of savings costs its fee, including a payment savings makes for you.',
      // From 2026-10-16 (brief 09): Close It on it at a German bank charges this month's fee only to the day, said under the
      // button first (`closingFeesDue`, `closingFeesWords`); until then the whole month, and nothing said it beforehand.
      'An account you kept in the country you lived in before Yale stays at its bank, shown in its own money with the dollar amount beside it. The bank won’t open anything new for you while you’re abroad, it charges its fee for customers abroad and its card’s fee on purchases in dollars, and where the bank closes such accounts, it closes on the day it says. Money moves in or out only as a payment abroad, less its fees and the exchange. If you close it with Close It, a German bank charges this month’s fee only for the days it’s been open, and shows the figure under the button before you press it. Its country takes its tax from the interest. On an F-1 the US doesn’t tax it; a US citizen reports it, with the foreign tax credited, and one whose accounts abroad passed $10,000 is told about the FBAR, and about Form 8938 past its own thresholds, with the tax return.',
      // From 2026-10-16 an account closed charges the overdraft interest built since the 1st, and the bank's own close the
      // fees owed to the day and ends a standing order from or into the account (`settleOverdraftInterest`,
      // `closeForOverdraft`, `endOrdersOf`); until then both were dropped with the account, and the order failed monthly.
      'An overdraft is either arranged up to a limit, with interest and any fee, or paid item by item with a fee for each; its interest is charged on the 1st, or when the account closes. A US bank won’t pay an everyday debit card purchase into an overdraft unless you’ve opted in. An account left below zero, past any arranged limit, for sixty days is closed (in France, two months after the bank gives notice). The bank charges off what it can’t recover, with the interest and fees owed to that day; the debt goes to collections and onto your credit record; any standing order from or into the account ends; and your money moves to another bank.',
      'In the US the bank reports a closing like that to ChexSystems for five years, and the next bank may turn you away (most do while the debt is unpaid, about half once it’s paid), which leaves a second-chance account with a monthly fee and no overdraft. Pay It, under In Collections, pays the debt down. A French bank writes to you after a month past your overdraft, and after three offers a loan to cover it: Take The Loan accepts it, and once the account is back within its limit, the sixty days start again.',
      'If the account can’t cover a personal loan payment in full, the bank takes what’s there, the payment goes on your credit record as missed, with the bank’s fee where it charges one, and the rest stays owed. When you switch to another bank, your card stays with the bank that issued it, as loans and term deposits do. The bank’s name, each account’s name and every line on a statement are links: the bank opens onto the accounts it holds for you and the latest money through them, and a statement line onto the accounts it moved between and the day it went through.',
    ],
    names: ['Your bank, from the Money line on Home', 'Your credit card, Pay Card In Full and Autopay', 'Apply, several cards and the everyday one, close, the statement day, the limit, going over it, and help with payments', 'Statements, The Year and Alerts', 'Cash: taking it out and paying it in', 'The card’s offers: its introductory rate, a balance or money transfer, a plan, and rewards', 'Your cards: locking one, reporting it lost or stolen, and payments that weren’t yours', 'Term deposits, round-ups, dormant and unclaimed accounts, and canceling something new', 'How You Pay, standing orders and payments set for a date', 'Move Money', 'Open and close a savings account', 'Arrange an overdraft', 'Put money in a term deposit', 'Borrow, and pay a loan off', 'Opt in or out of debit card overdrafts', 'Pay a debt in collections', 'Switch bank'],
    opens: ['ui.bank', 'finance.pay_card', 'finance.set_autopay', 'card.apply', 'card.money_transfer', 'card.plan', 'card.redeem_rewards', 'card.lock', 'card.report', 'card.dispute', 'bank.new_number', 'card.close', 'card.refund_credit', 'card.set_statement_day', 'card.request_limit', 'card.set_auto_raise', 'card.set_over_limit', 'card.set_everyday', 'card.request_hardship', 'bank.set_alerts', 'cash.withdraw', 'cash.deposit', 'bank.set_term_end', 'bank.break_term', 'bank.take_term_interest', 'bank.set_round_ups', 'bank.reactivate', 'bank.cancel_new', 'bank.claim_unclaimed', 'bank.set_payments', 'bank.add_standing_order', 'bank.cancel_standing_order', 'bank.schedule_payment', 'bank.cancel_scheduled', 'bank.transfer', 'bank.open_savings', 'bank.close_savings', 'bank.arrange_overdraft', 'bank.open_term', 'bank.borrow', 'bank.repay_loan', 'bank.debit_overdraft', 'bank.pay_collections', 'bank.take_overrun_loan', 'bank.switch', 'bank.open_current', 'bank.set_primary', 'bank.redirect_deposits', 'bank.set_order_source', 'card.set_autopay_from', 'bank.close_current', 'bank.cancel_switch', 'bank.stop_balance_transfer', 'bank.set_loan_repayment', 'look.bank', 'look.transaction'],
  },
  {
    id: 'life',
    title: 'A Whole Life',
    lead: 'Your own page, birthdays, age, and the end.',
    body: [
      // Said here from 2026-10-12, where your own page opens: until then “How You Are” sent the player to it.
      'Press your name on Home, or the line at the top of How You Are, to open your own page. It shows your whole wellbeing and your readiness, your traits, any long-term condition and any injury, and you can press each of them for more.',
      'Your birthday comes every year, at nine in the morning. The age you turn changes how far your body can go and how much a night’s sleep gives back.',
      'Every life ends. Each year carries the same chance of death as a real year at your age, from the US life table, adjusted for life expectancy where you live (known for fourteen countries), higher for a worn-down body and lower for one kept well. The game never tells you when.',
      'When it ends, the clock stops for good, and the save shows who you were, what you earned and what you left behind. It stays in its slot until you delete it.',
      'That’s every part of the game. To read any chapter again, press Guide at the top of the screen.',
    ],
    names: ['You, when you press your name'],
    opens: ['look.person'],
  },
];

export const CHAPTER_BY_ID: Readonly<Record<string, Chapter>> = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

/** The chapter that opens a feature, by the feature's id. */
export const CHAPTER_FOR: Readonly<Record<string, Chapter>> = Object.fromEntries(
  CHAPTERS.flatMap((chapter) => chapter.opens.map((feature) => [feature, chapter] as const)),
);
