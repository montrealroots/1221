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
 */

import { ABILITY_DEFS, MASTERED, TECHNIQUES } from './abilities';
import { bankById } from './banks';
import { ROUND_UPS } from './roundups';
import { PRACTICE } from './practice';
import { EVALUATION } from './tasks';
import { ENROLLMENT, PUBLIC_COVER, RETURN } from './safetynet';
import { EXTENDED_STUDY, SUMMER_CABARET, YALE_CABARET, YALE_DRAMA } from './school';
import { COASTING_ENERGY_CEILING, LONGEST_NIGHT, SHORTEST_SLEEP } from '../systems/life';
import { BRIEF } from '../systems/briefs';
import { ADVICE } from '../systems/advice';
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
  // absent (`presentForCare`); found by the guide’s audit of that day.
  {
    id: 'calendar',
    title: 'What’s Coming',
    lead: 'What’s coming up, and what to do when the clock stops for it.',
    body: [
      'The Calendar panel at the top of Home shows what’s coming up: the next thing you need to be at, how soon it is, and up to five more after it.',
      'Press an entry’s name or its time to see when it starts, how long it lasts, where it is and what missing it would cost.',
      'Anything you need to be at is a commitment: a class, a rehearsal call, a work-study shift, an appointment, a plan of your own. When the clock reaches one, it stops, and a dialog with the commitment’s name asks what you want to do.',
      'Press Go to be there. Going takes as long as the commitment lasts, and the clock runs on through it. Stand Here closes the dialog and keeps the clock paused at the commitment.',
      'Only a plan of your own has a Skip It button, which lets you walk away from it. You can’t skip a class or any other commitment, so press Go, or Stand Here to wait. It happens the next time the clock moves: you’re there if you’re awake, out of hospital and in its town, and if not, you miss it.',
      'The clock hasn’t moved yet, so nothing has come due. Read “The Clock” next to start it.',
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
      'The clock stops by itself at every commitment and waits for your answer, as “What’s Coming” explained. Sleep is the exception: it runs straight through everything in those hours, so the Sleep dialog lists what you’d sleep through before you start.',
      'If you don’t want to wait, read “Moving Time On” next to jump ahead.',
    ],
    names: ['Play and Pause'],
    opens: ['ui.play', 'world.set_preferences'],
  },
  {
    id: 'advance',
    title: 'Moving Time On',
    lead: 'Jumping ahead, and what happens on the way.',
    body: [
      'To jump ahead instead of waiting, press Advance in the top bar and choose how far: One Hour, This Evening (6 p.m.), Tonight (10 p.m.), Tomorrow Morning (7 a.m.), Next Event, Next Monday (9 a.m.) or One Week. Choose An Event lets you pick from the next fourteen things on your calendar.',
      'Everything on the way happens, in order. If the jump would pass any commitments, a dialog called On The Way first says how many, and the clock still stops at each one to ask what you want to do.',
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
      'Press a notice’s title to read it in full. If it has a Go There button, that takes you to the screen it’s about. Once you’ve seen them, press Mark Read, which shows how many are unread, to clear them from the panel.',
      'Some notices are questions, with their answers on buttons. Dismiss takes a question off the list without answering it, but what it was about still stands: a tax return is still due, and you can still deal with it on its own screen.',
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
      'How You Are, on Home, shows three numbers. Energy is what you have left for today. It runs down every hour you’re awake, faster when you owe sleep, and only sleep brings it back. Stress eases while you still have energy and climbs once it runs out, and money you owe adds to it every day. Readiness is how sharp you’d be for work right now, and it comes from all the rest.',
      'Behind those three is the rest of your wellbeing: morale, condition, fitness, nourishment, hygiene and the sleep you owe. Press Readiness to see the ones costing it most, up to three, and press any of those to see where it stands and what it does to you.',
      'Condition is how sound your body is. Illness, going hungry, heavy stress and short nights wear it down, and a night of real rest mends it. Fitness is the same as your Stamina, the ability that keeps you going through a long scene or a night on stage. Neither is your energy, and neither is your health: illness, injury, care and health cover are on Papers.',
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
      `Sleep is how you get your energy back. Press Sleep in the top bar, and the Sleep dialog asks how many hours, from ${hoursOf(SHORTEST_SLEEP)} to ${hoursOf(LONGEST_NIGHT)}. It suggests a number, from when you next need to be somewhere and how much sleep you owe, and shows when you’d wake.`,
      'Press the button with the hours on it, such as Sleep 8 Hours, to go to sleep, or Not Yet to close the dialog.',
      'A night’s sleep gives you energy back, though less the more sleep you owe. More than about five hours of real rest also mends your condition, as far as your fitness and age allow, and less than that wears it down. A night under six hours adds to the sleep you owe.',
      'Life goes on while you sleep. Anything on your calendar in those hours happens without you, and the dialog lists it before you press.',
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
      'Press Look After Yourself, in the top bar, for everything a day needs besides sleep: Eat A Meal, Order In, Shower, Work Out and Unwind. Each line shows, before you press it, how long it takes, what it costs and what it would change.',
      'What matters most right now is at the top. Anything that costs you more every hour you leave it comes first (hunger, going unwashed, stress past its limit), then whatever would do most for your readiness. The top line is marked Needed Now or Most Worth It.',
      'Your groceries are bought each day at your town’s prices, and you eat through them during the day. Eat A Meal feeds you and lifts your morale, more the hungrier you were. Order In does the same without the cooking, at the price of a delivery. Shower gets you clean and eases stress. Unwind eases stress and lifts your morale.',
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
      `Press Open Calendar, on Home’s Calendar panel, to see the whole month. Press a day, then Put Something On It. Say what it is, when it starts and how long it lasts, from ${PLAN_LENGTHS[0]!.label.toLowerCase()} to ${PLAN_LENGTHS[PLAN_LENGTHS.length - 1]!.label.toLowerCase()}, then press Put It On.`,
      'A plan of your own works like any other commitment: the clock stops at it, and you choose Go or Skip It. You can have two commitments at the same time, and the calendar marks them as a clash.',
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
  {
    id: 'school',
    title: 'Drama School',
    lead: 'Where your life as an actor begins.',
    body: [
      'You begin as a first-year in the MFA in Acting at the David Geffen School of Drama at Yale University, in New Haven. You’re one of the sixteen actors admitted this year, among the strongest of them but not ahead of everyone. You arrive on the first day of the fall term for registration and orientation, and classes begin a week later.',
      `The school is where you train, get cast and earn your degree. Open it with the ${YALE_DRAMA.short} button on the School line in Your Affairs on Home, or from School in the menu. The School line shows your year, your standing, your place in the class and what’s next. The screen’s tabs are Standing And Craft, Classes, Coursework, Casting, Shifts And Pay, and Terms And Award.`,
      'Classes run from nine to three on class days. Be there, in New Haven and awake, and your craft grows, more when you come rested. Your fifteen classmates grow too, each at their own pace, and you’re cast beside and against them.',
      'If you’re unwell, press Call In Sick on Classes before the day’s first commitment begins (on a class day, at the latest when the clock stops at the classes at nine). The day’s classes, labs, rehearsal calls and work-study shift are excused, and a partner rehearsal you miss while ill isn’t held against you. A day in hospital is excused on its own. Staying away when you’re well is an absence.',
      `Your craft, on Standing And Craft, is the ${TECHNIQUES.length} techniques the school trains and four of your abilities: Emotional Depth, Memory, Physical Expression and Vocal Expression, each kept in one place. A technique is a skill a class trains, and an ability is something about you, kept on your Player Profile. Composure, beside your craft, eases the nerves that add stress before every performance, and every performance grows it.`,
      'Each course sets work at its meetings: a scene, a song, a movement score. On Coursework, prepare each piece a step at a time, answer its questions at the table, and choose how you’ll play it. Where the text supports more than one answer at the table, each is right. Choosing how to play a scene isn’t the same as rehearsing it: the choice pays off once you’ve rehearsed it on your feet.',
      'A scene pairs you with a classmate. Pick an evening they’re free and press Ask with their name, such as Ask Zoe. A rehearsal kept builds your scene together and their trust in you. If they won’t come or don’t turn up, Run It With A Reader works your side of it with someone feeding you their lines. It’s slower, and it leaves your partner as they were.',
      'Shown Today, on each piece, is its readiness now: what it would come to if it were shown today, which parts are short, and the steps that would answer them. When a piece is shown, your own work is judged, and so is the scene together, with what your partner brought, which also moves the bond between you. Your teacher’s note says what held it back most. The note is the game’s, written as your course’s teachers would say it.',
      'If too many of a term’s pieces are coming out Unready, a notice, A Word On Your Coursework, says so during the term, with the day the faculty review it. That’s a warning, not the review itself: the review comes at the end of the term’s classes.',
      'At the review, the faculty look at your attendance at classes, calls and assigned shifts, your growth against the class, your work on stage and your coursework. Coursework This Term, on Standing And Craft, counts the term the way the review will. Fall short on any of them and you drop a step: from good standing to academic concern, from concern to academic warning, and from warning to dismissal. Meet them all and you’re back in good standing.',
      'From your first spring, the chair casts you each term in one of the School’s productions, and once a year, in good standing, you’re at Yale Rep too, most often as an understudy. Casting shows your part and Why This Cast. Between rehearsal calls, Learn The Part, Catch Up The Blocking and Work On The Note work on your part.',
      'Missing two calls in a term, labs and rehearsals together, takes you out of the casting pool until a good review. A missed performance, or not being in New Haven when you’re called to go on, is a grave breach: it puts you on academic warning at once, and if you’re already on warning, it dismisses you.',
      'Work It Through, on a scene or a part, names the problems its forecast shows. Pick one, try a way at it and see the figure before and after, then keep the change or put it back.',
      'Every student works: six hours on the Saturdays of class weeks, and at least 50 more hours of elective evenings front of house at Yale Rep during the term, which you sign up for with Take An Elective Shift on Shifts And Pay. Hours are paid on Fridays.',
      'The Yale Cabaret is the students’ own theater: Join A Cabaret Show, on Casting, puts you in a show, one a term. In the spring of your first and second years, Join The Summer Company puts you in the Yale Summer Cabaret for the summer, with a weekly stipend.',
      'Plays To Read, on Coursework, are plays first staged since 2000. Read It with the Haas Arts Library’s copy, and once it’s read, Research It.',
      'Tuition is paid for every student by the tuition scholarship. Yale’s help with living costs goes by need, and your family’s means rule it out, so the Yale Health plan, billed each term, and your living costs come from your bank.',
      'Next, “You As An Actor” opens your Player Profile: your abilities, your practice and the genres you work in.',
    ],
    more: [
      'The craft, in the order the School screen lists it: Accents And Dialects, Audition Technique, Character Work, Classical Text, Clown And Mask, Cold Reading, Comedy, Dance, Emotional Depth, Improvisation, Intimacy, Memory, On Camera, Physical Expression, Scene Study, Script Analysis, Singing, Speech, Stage Combat, Vocal Expression and Voice-Over. Acting, the row under them, counts scene study twice, with character work and emotional depth, and it’s what a Yale Rep part asks most. A part is cast on the techniques its play needs: a voice and speech that carry and the body, and the classics and a fight where the play asks for them. The work you do grows what it trains.',
      'The first fall has Drama 50, three weeks of afternoon labs, and the first spring the New Play Lab, three weeks workshopping the first-year playwrights’ new plays. The last spring opens with your own solo piece, You Are The Creator. Each is a call, like a rehearsal. Work-study comes to 150 hours a year.',
      'The productions: the Carlotta Festival as a first-year; a directors’ thesis or the Langston Hughes Festival in a fall after that, and a thesis or the Carlotta Festival in the second spring; a Shakespeare Repertory Project in your last spring. On call at Yale Rep, the Rep calls three hours before each curtain, at five for an evening and at eleven for a Sunday matinee. Be in New Haven then, and the evening is yours unless you’re needed, when you’re told and the performance goes on your calendar. Every understudy plays one run-through for the director.',
      'The chair weighs every student the same way for each play: how well you fit it, what a night of it would come to from your abilities and the techniques it asks, its kind of play’s demands among them; a fifth of that by how much of yourself you gave in your last run; and a lead counting against your next lead and a small part for it. The best fit takes the biggest part written for them. Why This Cast, on Casting, shows how each student stood.',
      'Each night is judged on the techniques and abilities the part asks, the lines, blocking and notes your calls and your own work have made, and how rested you come. A performance holds the clock for its play’s running time and tires you by its workload: how long it plays, how much of it your part is on stage, and what it asks of your body and voice, less after an interval. Your stamina carries the late scenes and spares up to half the energy it costs, and The Evening’s Workload, under A Night Now, says it before the curtain. A night comes out off, solid, strong or remarkable, at LAMDA’s pass, merit and distinction, and the director gives a note at the end of the run.',
      `Join A Cabaret Show puts you in a show at least ${daysOf(YALE_CABARET.leadDays)} off, its week clear of your days off, casting calls, nights on call, labs and work-study shifts. It isn’t open on academic warning, on a leave, or cast in two productions at once. Join The Summer Company needs good standing, no leave, and your name in by ${monthDay(SUMMER_CABARET.applyBy)}; the summer is ${counted(SUMMER_CABARET.runs.length, 'show')}. A day called in sick, in hospital or kept off by an injury excuses a Cabaret or Summer Cabaret call. Miss a Summer Cabaret performance otherwise and the company goes on without you.`,
      'At the review, a piece missed without an excuse counts as due and unready, and a course with half its pieces due not shown isn’t passed. The standings come from the Yale Bulletin. The Bulletin has the faculty evaluate students regularly; one review a term, and its floors and its steps, are estimated.',
      `After the program’s six terms, in good standing or on academic concern with every course passed, you’re awarded the MFA. If the last term ends on academic warning, the faculty don’t recommend it. A course not passed leaves ${plural(EXTENDED_STUDY.requestDays, 'day')} to ask to repeat the year or for an additional term, where either is open to you, before the degree is withheld, and an Incomplete still open holds the degree until it’s made up.`,
      'Work It Through’s problems are a part of the scene that isn’t secure, a turn not worked, stamina going late, or an ability holding it back. A change to how a part of the scene is played is kept or put back, and what you keep carries into every later rehearsal and performance. Between a production’s calls the director names one of these too, somewhere in the play (what you want, listening, pacing, the physical life, a change, a relationship), with ways at it: Work On The Note one way, and the next call says whether it was answered.',
      'On the School screen, the school’s name, each course and each technique open where they stand: the school into this year’s courses and the town, a course into the techniques it trains and the next day it meets, and a technique into where you stand in it against the class.',
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
  {
    id: 'profile',
    title: 'You As An Actor',
    lead: 'Your abilities, your practice, and the genres you work in.',
    body: [
      `The Player Profile is you as an actor. Open it from Player Profile in the menu, or by pressing your name at the menu’s foot. It holds your ${word(ABILITY_DEFS.length)} abilities: Emotional Depth, Presence, Listening And Responsiveness, Imagination, Focus, Memory, Adaptability, Composure, Vocal Expression, Physical Expression, and beside them Discipline and Stamina. Each runs from 0 to 100, and opens onto what it is, what grows it and where it matters.`,
      `Beside them are your ${TECHNIQUES.length} techniques, the skills the school trains, each mastered at ${MASTERED}. The traits you chose at the start are there too, each opening onto what it changes.`,
      'Four things make you better, and they aren’t the same. Your abilities are you: how you listen, how you hold your nerve. Your techniques are skills a class trains. Your genre knowledge is how well you know a kind of play or film. Practice is work you set yourself, outside class.',
      'Classes, coursework, rehearsals and nights on stage grow what they train, up to the level the classes reach. Practice takes you further, all the way to the top. In the Practice column, press the exercise beside an ability or a technique, such as Comic Timing, pick a tier and a focus, and press Practice An Hour. Before the hour, it says about how much it will add, and why.',
      `The same growth from the same work again on the same day gives half, whether it’s a class, a night or an exercise, and past ${PRACTICE.dailyHours} hours a day practice stops counting. A technique past ${MASTERED} improves no result, because no work asks more of it.`,
      'Finished work, a showing, a night or a self-tape, is judged on what your teacher looks for: believability, interpretation, connection, execution, consistency and responsiveness, as the work asks. Each piece says what held it back, and by how much, and Your Work So Far says what your work shows most and what keeps holding it back.',
      'Under Genres, Study It reads a play of a genre or watches a film of the kind. Every genre also has a practice brief, an original scene written for SLATE: Open Its Brief to read where and when it is, who the two of you are, what you want, what’s in the way and where it turns.',
      'On the brief, Break It Down, Learn The Lines and Rehearse It On Your Feet prepare it. Read It This Way chooses a reading, and you choose how to play it; from then on Work It Through works on it as on a scene. Read With chooses who reads opposite you: a recording, or a classmate who learns it as you rehearse together. Then Tape It.',
      `A self-tape asks you to know its genre too: the better of what you’ve studied and what you’ve worked in it, complete at ${Math.round(BRIEF.complete.genre * 100)}. A genre you’ve never met costs at most ${Math.round((1 - EVALUATION.partFloor.genre!) * 100)}% of a tape’s interpretation.`,
      `What To Work On forecasts what ${word(ADVICE.sessions)} sessions of practice, a day apart, would bring on each thing your work depends on. It’s a forecast, not a result, and it says what it assumes. What finishing a piece’s own preparation would bring is shown apart from it, so you can tell how ready a piece is now from how ready it could be.`,
      'How you play a scene can suit it or go against it, by what the scene is: its genre, its reader, its tones, its turns and the reading you’ve chosen. A way that suits the scene is easier to make work and quicker to rehearse, and one against it is harder. Either can make the better tape if it plays to what you do well, and the tape says which.',
      'The tape with your reader is what a casting office would see. A Strong one earns a callback: a harder version with a note on how to play it, answered only by a tape played that way.',
      'Loving a genre makes a rehearsal or a night of a play of its kind a better day, but never better work.',
      'Next, “Cover, Benefits And Returns” opens Papers: your health cover, benefits and tax returns.',
    ],
    more: [
      'Discipline grows with each day you practice and each call you keep, and it makes what classes, nights, steps and practice grow count a little more, or less. Practice doesn’t train Stamina: it’s your fitness, built by Work Out, under Look After Yourself, and by a class that trains the body as hard, Movement Invention or stage combat. Memory makes learning lines go further, imagination the table work and a brief’s breakdown, focus getting to know a scene, listening an evening rehearsing with a partner or a reader and a brief rehearsed against its reader, and adaptability a revision after a note and a director’s note on the blocking.',
      'Which abilities count most depends on the piece: a long text asks memory, a lot riding on it composure, little of a partner to play off presence, many beats discipline, a grave piece emotional depth, a comic one focus, and an invented world imagination. A night in front of an audience asks presence, memory, composure and discipline of its own, and stamina by how long and how hard it is. With every ability at full, every technique mastered, the preparation complete and you rested and well, a piece comes to 100.',
      `A self-tape counts as practice in its genre by how prepared it was: one taped cold counts ${Math.round(BRIEF.practiceUnprepared * 100)}% of a prepared one. What a genre asks of an actor, where research established it, is a technique its brief stages, shown before you begin. Every genre’s scenes are played in its own register, one or two concerns such as feeling held in, comic rhythm or belief in what isn’t there. The Genre Asks names them on its brief, each pulls the tape toward what it asks, and a tape held back by an ability one of them asks for says so.`,
      'What To Work On can name something other than what held your last tape back most, and says when two things are about as useful. It says what its forecast assumes of your tapes and their genres, naming any it treats as if fully prepared, and whether preparation, training or both deserve your attention now. Asked again, it says how long its advice has stood, what has moved since and what moved it, and what to do next.',
      'A tape is judged beat by beat: each beat’s rehearsal, how far into the tape it falls, where stamina tells, and a slip in the beat before, which composure and adaptability help you recover from. Your own tape is yours, whoever reads with you.',
    ],
    names: ['Player Profile', 'Practice', 'Study It', 'Open Its Brief', 'Break It Down, Learn The Lines, Rehearse It On Your Feet', 'Read It This Way', 'Read With', 'Tape It', 'Your Work So Far', 'An ability, a genre and a piece of work, when you press them'],
    opens: ['ui.profile', 'practice.exercise', 'genre.study', 'brief.prepare', 'brief.choose', 'brief.reader', 'practice.self_tape', 'look.ability', 'look.genre', 'look.work'],
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
  {
    id: 'papers',
    title: 'Cover, Benefits And Returns',
    lead: 'Health cover, benefits, pensions and the return.',
    body: [
      'Papers holds your health cover, your benefits and pension, and your tax returns. Open it with the Papers button on the Papers line in Your Affairs on Home, or from Papers in the menu. The Papers line shows what covers you, any unemployment you’re paid, and anything that needs doing, such as a return that’s due. Its tabs are Tax Returns, Health Cover, Unemployment, Passport And ID, and Permission To Work.',
      'While you’re at school, the Yale Health plan covers you, billed each term, and it pays for a doctor’s visit only at Yale Health Center. Your Cover, on Health Cover, says what covers you and what it costs.',
      'To see a doctor, choose a practice under Your Doctor on Health Cover, then press Book An Appointment. In New Haven, Yale Health Center sees a student it covers the next weekday, at no charge. A visit you keep is seen and billed; one you miss isn’t, and you can book again.',
      'Each piece of care brings a bill for what your plan doesn’t pay, under Care And Its Bills. Left unpaid, it becomes a medical debt, and Pay It Off settles it. With insurance, Apply For Assistance puts a Connecticut hospital bill in for the hospital’s financial assistance before it’s due.',
      `Yale’s plan covers you to the end of July after school. From ${ENROLLMENT.specialDays} days before it ends, Enroll, under The Marketplace on Health Cover, takes you into the cover you qualify for: Medicaid or a state program where your income is low enough, or a marketplace plan. Enrolling starts it, but you’re covered only from its start date, usually the first of the next month. Drop The Plan ends a plan of your own.`,
      'A long-term condition you carry, such as asthma, costs its care each month, under Your Conditions: Let It Go stops the care, and Keep It Up starts it again. Depression can be lifted by a course of therapy: choose a Therapist where you live and press Begin A Course Of 8.',
      'Out of paid work, File A Claim, on Unemployment, opens unemployment insurance where you live, if your wages qualify. A state pension is claimed there too, once your record and your age allow.',
      'Each February, a year’s tax return is ready on Tax Returns if it owes or is owed anything or its income reached the standard deduction, and every year on an F-1. Press File It by mid-April. A balance is paid from your bank, savings included, and filing late with a balance costs penalties. Whatever the bank couldn’t pay grows until you settle it with Pay.',
      'A police report belongs to a paper you’ve reported lost or stolen: File A Police Report, beside it on Passport And ID, files one online where the police take reports that way. Reporting a paper lost opens with the next chapter.',
      'Next, “Passports And ID” covers your passport, your ID, and your permission to study and work.',
    ],
    more: [
      `Enroll takes you into Medicaid (Medi-Cal in California, HUSKY D in Connecticut), New York’s Essential Plan or Covered Connecticut whenever last month’s income is low enough, with no premium. Cover starts from the first of the next month, HUSKY D from the first of the month you enroll, or as Yale’s ends if that’s later. From 2027 Medicaid asks for a month spent partly at the School, or one with ${formatMoney(PUBLIC_COVER.workEarnings, 'USD', { cents: false })} of income (pay, interest or a benefit counts), unless you’re 65 or over, on SNAP under its work rules or, if you ask, in hospital that month: in Connecticut the month before you apply, and any one of the ${PUBLIC_COVER.workLookBack.ct.renew} before a renewal. Short of it, Apply For HUSKY D sends a notice giving ${PUBLIC_COVER.answerDays} days from its receipt to answer, and a renewal’s notice keeps you covered meanwhile; Request A Hardship Exception answers it with a stay in hospital.`,
      `Covered Connecticut asks an income over HUSKY D’s line and at least the poverty line, and from 2027 a citizen’s or green card’s status, and ends once Yale Health covers you again. A program is checked again at renewal, every six months from 2027. Where last month’s income now fits the other program, it moves you there with no gap. If you fit neither, or its work rules aren’t met, it ends at a month’s end, with ${PUBLIC_COVER.advanceNoticeDays} days’ notice or more, and it ends if you move out of the state.`,
      `Otherwise Enroll buys the marketplace’s plan in New York, California or Connecticut, starting the same way: in open enrollment, in the ${ENROLLMENT.specialDays} days before Yale Health ends, or within ${ENROLLMENT.specialDays} days of losing cover. A plan you drop or leave unpaid opens no such window. Each month you live in California without cover adds California’s penalty to your return. A marketplace plan may deny a claim, as KFF finds one in five are: it’s billed as if you were uninsured, and Appeal It within 180 days has it decided in 60.`,
      'New York and California don’t pay the first week of a claim that would pay; Connecticut does. A week with work pays less, or nothing, and a week abroad pays nothing. Living in Britain as a British or Irish citizen, File A Claim is Universal Credit: a month assessed at a time and paid a week after, the standard allowance, less 55p of each pound earned and something for savings over £6,000, none over £16,000. In Ireland it’s Jobseeker’s Allowance, €254 a week for the days out of work, less something for savings over €20,000. A state pension is claimed under Unemployment: Claim Social Security, or Claim It for the UK’s or Ireland’s State Pension, the IMSS pension or the Pensión para el Bienestar. A pension has federal tax withheld from each month.',
      'Illness comes at a young adult’s rates, and the flu more often when you’re short of sleep or stressed, in the weeks your town’s climate brings it. A Connecticut hospital’s financial assistance comes off an uninsured patient’s bill at once; with insurance, Apply For Assistance is free to 250% of the poverty line and 67% off to 550%. Buy Dental adds a dental plan of your own where your health plan pays nothing for the dentist, in New York or beside a Covered California plan; Drop Dental ends it, though Yale’s, paid for the year, runs to its end.',
      `On a 1040-NR with no wages, the return is due by June 15, though Connecticut’s return on it is still due in mid-April. A UK tax year’s is settled on its own, by the next January 31. The IRS’s refund comes ${RETURN.refundDays} days after filing, ${SSN.itinWeeks} weeks later on a 1040-NR filed without a Social Security number, and a state’s on the state’s own day. What the bank couldn’t pay grows from the due date by the IRS’s ${pct(COLLECTION.interest)} a year in interest and a penalty of ${pct(RETURN.payLateMonthly)} a month, to ${pct(RETURN.lateCap)} of it. The IRS bills it at filing; left alone, from the due date it writes every ${counted(COLLECTION.noticeWeeks, 'week')}, its last letter a final notice, and ${plural(COLLECTION.finalDays, 'day')} on it takes the balance from your bank accounts.`,
      `A return never filed that owes, the IRS files for you ${plural(SUBSTITUTE.afterDays, 'day')} after it was due, from what your employers and banks reported. Your own, filed within ${SUBSTITUTE.answerDays} days, replaces it before any of it is assessed; filed after, it makes the tax what your return says, and the penalty and interest fall in proportion.`,
      'A doctor’s visit is an appointment where the place publishes how long one is waited for: England’s spread from the same day to five weeks, New York’s four days and Los Angeles’s thirteen, Canada’s next day for about a quarter, IMSS’s twenty-nine days for a Mexican. Fair Haven Community Health Care, in New Haven, sees anyone and publishes no wait, so it books after New Haven’s, fifteen American cities’ average of twenty-four days, and bills a Yale Health member as uninsured. Ireland publishes no wait, and a visit there comes when it comes. A visit kept can end in a referral, as often as doctors there refer, and the specialist is seen after the published wait: a month in America, twelve weeks in England, eleven in Ontario and twenty in British Columbia.',
      'In England a prescription is £9.90 an item under 60, and a prepayment certificate, £32.05 for three months or £114.50 for a year, makes every one free while it runs: Prepay Three Months or Prepay A Year. An emergency keeps you in the department its median time where you live, New York’s 204 minutes or Ireland’s nearly six hours, and you miss what that time held. In America, Your Pharmacy fills a generic at its own cash price, your plan’s copay never more: Walmart’s $4 against the $40 median.',
      'A long-term condition is reviewed at NICE’s interval, with a doctor’s visit booked for it. Its medicine is a supply filled where you live with a week left, 28 days in England and 30 in America; Fill A Longer Supply takes up to 56 days in England, 90 in America and 100 in Ontario. A course of CBT is NICE’s eight weekly sessions at the practice’s own price, or free on the NHS in England after its six weeks. Done, it lifts depression at the published rate, NHS Talking Therapies’ 48.5% or a private course’s 36%, and it no longer weighs on you.',
    ],
    names: ['Papers', 'Therapist', 'Report Stolen', 'File A Police Report', 'Appeal It', 'Fill A Longer Supply', 'Apply For', 'Book An Appointment', 'Prepay A Year', 'Prepay Three Months', 'Enroll', 'Request A Hardship Exception', 'Drop The Plan', 'Pay It Off', 'Apply For Assistance', 'Keep It Up', 'Let It Go', 'Buy Dental', 'Drop Dental', 'File A Claim', 'Claim Social Security', 'Claim It', 'File It', 'Pay', 'Your Pharmacy'],
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
  // screen says so: until then nothing here did.
  {
    id: 'documents',
    title: 'Passports And ID',
    lead: 'A passport, what each country asks to let you in, an ID card and a student’s status.',
    body: [
      'Passport And ID, on Papers, keeps your passport and your ID, and Permission To Work keeps your student status and what comes after it. Each paper you hold opens where it’s listed: who issued it, the last digits of its number, when it was issued and when it runs out, and what it lets you do today.',
      'A passport comes from the country you’re a citizen of, at its office’s fee and in its office’s time. Under Your Passport, press Apply For One, or Renew It, and where the office sells a faster service, Apply Faster. Applying starts it: you hold the new passport only once it’s issued, and it cancels the old one, with any travel authorization issued on it.',
      'Your ID is the state’s ID card where you live. Under Your ID, press Get with the card’s name to apply for one at its fee. Connecticut mails it, and it’s a photo ID once it arrives. A new bank asks for a photo ID in force, a passport, a license or an ID card, before it takes you on. A license that runs out isn’t renewed in SLATE, so an ID card or a passport takes its place.',
      'Report Lost cancels a passport, a license, an international driving permit or an ID card, and Report Stolen does the same for one that was stolen. A lost passport takes what was issued on it with it, all but an F-1.',
      'A lost license is replaced where it was issued for someone living there, or by mail from out of state where the issuer sends one, as New York does. In New York it’s free if it was stolen and the police have your report: File A Police Report, online where the police take one, New Haven’s among them. A lost ID card is replaced with Replace It where it was issued, for someone living there, at the issuer’s fee, and it comes after the issuer’s published weeks.',
      'Going Abroad says what each country asks of your citizenship: free to enter, a travel authorization first, or a visa. Pick a country to see what it asks and what you’re missing. There’s no travel in SLATE, so it’s a rule to read, not a form to fill in. A visit is only a visit: staying, or working, needs a different permission.',
      'A student on an F-1 holds US status while they study and for sixty days after the program ends. After the degree, Apply For OPT, on Permission To Work, gives you twelve months to work in your field, lost after 90 days in all without work. Residence Abroad says what another country asks before you can make a home there.',
      'Next, “Money” shows everything you have and owe.',
    ],
    more: [
      'Some countries ask your passport to last months past the day you leave. Where an office’s own fee from abroad couldn’t be found, as with New Zealand’s GST, the fine print says so and the fee is estimated. For anyone not a citizen, an ID card’s term is estimated too, since the state publishes none, and Your ID says so.',
      'Replacing a lost ID card costs the issuer’s fee: New York’s $8, Connecticut’s $30, California’s $40 and free from 62, Ontario’s $10, British Columbia’s $15, the INE’s nothing, and €35 for Ireland’s passport card.',
    ],
    names: ['Passport And ID', 'Permission To Work', 'Apply For OPT', 'Apply For One', 'Renew It', 'Apply Faster', 'Report Lost', 'Replace It', 'File A Police Report', 'Residence Abroad'],
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
      'The Money line in Your Affairs on Home shows your current account and your net worth (what you have, less what you owe), and how much of it is owed. Your money is kept in the currency of the country you started in.',
      'Press Your Affairs, the panel’s title, to open what you’re worth, and from there each account and each debt.',
      'Your credit record decides whether a bank gives you a card, an overdraft or a loan, at what rate where the bank prices by it, and how high the card’s limit is and whether it’s raised. It rises with each card payment made on time, and slowly with no card at all while nothing is late or in collections. It falls with a card used past 30% of its limit, a late payment, a missed loan payment, applying for a card, a medical debt left unpaid a year, and a debt charged off to collections.',
      'You see its figure only when a life is made, as a number in the United States and Canada and a word elsewhere. In play, you read it in what the banks do.',
      'The accounts and the card are your bank’s: the next chapter, “Your Bank”, opens them.',
    ],
    more: [
      'Your net worth is what’s in the bank and in cash, and a pension from before, less what you owe on the card, loans, what went unpaid, medical bills and collections.',
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
  {
    id: 'bank',
    title: 'Your Bank',
    lead: 'A real bank where you live, and what it does with your money.',
    body: [
      'Your money is kept at a real bank in the country you live in, under the names that bank gives its accounts, and each account has a number written the way the country writes one. Open the bank with the button named for it on the Money line in Your Affairs on Home, or from Money in the menu. Its tabs are Accounts, Cards, Payments And Cash, Borrowing, and Statements.',
      'Move Money, on Accounts, moves money between your own accounts. Between two at the same bank it moves at once. To another bank it takes the sending bank’s time, or its country’s where the bank sets none, and it shows as Money In Transit until it lands; where the country’s banks pay instantly, that’s straight away. Money in transit is pending: it has left one account and isn’t in the other yet, so it isn’t available to spend.',
      'An account that earns interest builds it each day and is paid at the end of the month, or in the months its bank pays. A current account with a monthly fee takes it at the month’s end, unless the month met one of the bank’s waivers, such as enough paid in, enough kept in it, enough card purchases, or your age. The bank screen says how this month stands.',
      'Your credit card, on Cards, is the bank’s own, under its own name and terms. A statement comes on the 20th. Autopay pays the whole statement, or only the minimum if you choose, from the current account it’s set on, and Pay Card In Full pays the card off now, or as much as you have. Pay each statement in full and you’re charged no interest on it, unless the one before it wasn’t paid in full.',
      'If autopay can’t cover the payment, it comes back unpaid, and unless you paid the minimum by hand it counts as missed. Paying less than the minimum is late and costs a fee. Miss two payments in a row and the card is suspended; miss six, and it’s charged off to collections.',
      'When what’s in your current accounts and savings can’t clear the card, ask for help with payments: the bank freezes the interest, sets a payment that clears it in four years, and suspends the card until the first statement or due date after it’s paid off.',
      'Apply for a card at any bank in the country that issues one, yours or another. The bank looks at your credit record and what you have to repay from, and a card comes in about a week. You can hold one card from each bank. The day’s spending goes on the everyday card, and Make It The Everyday Card moves it to another.',
      'Statements, on a tab of their own, show every entry on each account you’ve held, month by month, with the balance after each. The Year adds up the interest, the tax taken off it and every fee. Alerts tell you when the current account ends a day under a line you set, when a payment goes over one, and when a statement is ready.',
      'How You Pay, on Payments And Cash, sets how the day’s spending is paid: on the debit card, the credit card or in cash. A purchase that way can’t cover isn’t made, and nothing is owed for it. Cash takes money out at a machine or the counter, for the bank’s fee, and pays cash back in.',
      'A card can be locked, so nothing new goes on it, and unlocked. Report one lost, stolen or damaged and it stops at once, and a new one with a new number follows. If a charge isn’t yours, report it in time, and the law decides what you carry and how fast the rest comes back.',
      'Where your bank runs one, an overdraft lets the account go below zero, with interest and any fee. A personal loan, on Borrowing, is repaid in equal monthly payments. You can open accounts at another bank where you live, and move to it.',
      'Next, “A Whole Life”: your own page, birthdays, and the end.',
    ],
    more: [
      'Interest is paid on the last day of the month, or in the months its bank pays: Germany’s at each quarter’s end, Japan’s in February and August, a Livret A in December. Where the country has the bank take tax off interest first, it does. Where a bank publishes no rate, the rate shown is estimated, and the screen says so.',
      // From 2026-10-16 (brief 09's follow-up): each German bank's fee on its own day (`feesPostAt`); until then this said
      // every German bank took it at the quarter's closing.
      'Deutsche Bank, Postbank and Berliner Sparkasse take a current account’s monthly fee at the quarter’s closing, and ING on the 1st of the month after.',
      'A card’s terms are its rate, or the range it prices a credit record within; any yearly fee; the minimum; the late fee; and the days to the due date, held to the law’s caps. Autopay also takes from easy-access savings at its account’s bank if you’ve linked savings. If they can’t cover all of it, the card charges a returned-payment fee for the miss, except on a US card when the late fee covers the same miss. If a statement isn’t paid in full, the interest built up to the day you cleared it comes on the next statement. Outside the US, paying less than the minimum also goes on your record and lowers your limit; in the US that happens only if the payment is still short at the next due date, thirty days on. Some banks, much of Europe’s among them, issue a card that takes the whole statement every month and can’t carry a balance. Where the bank’s card wasn’t found, its terms are estimated, and the screen says so.',
      'Each card has its own statement, due date and minimum, and your record looks at what’s used of all their limits together. Move the statement day and the due date moves with it. Ask for a higher limit or a lower one, and say whether the bank may raise it unasked. In the US, opt in to going over the limit or not. Close the card and it takes nothing new while what’s owed is paid down.',
      'Interest builds each day on what the card owes once a statement isn’t paid in full, and a statement paid in full keeps new spending interest-free. The rate is set by your record when the card opens, and held there. In the US a payment sixty days late ends any introductory rate, and where the card has a penalty rate it applies after 45 days’ notice, until six payments in a row are on time. Pay more than you owe and the card holds your credit; Send The Credit To My Account moves it back.',
      'Statements run quarter by quarter in Germany, whose banks close an account each quarter, and for the card they say what the statement asked and what paying only the minimum would take. Savings Covers The Current Account, turned on, pays what a current account can’t from easy-access savings at the same bank, for whatever that account pays: the day’s spending from the primary account, a card’s autopay from the account it’s set on, a loan’s payment from its repayment account. Standing orders move money into savings on a day each month, and a payment can be set for a date.',
      'Cash comes from your bank’s ATM, another bank’s, the counter, or in Britain the Post Office where your bank allows it, each for the bank’s own fee, and from the machines no more in a day than it lets out; another machine’s owner may add a fee of its own. A cash advance on the card costs its fee and draws its rate from the day it’s taken, with no grace period, and a payment to the card goes to the dearer balance first; in the US, only what you pay above the minimum does. The day’s groceries can be paid in cash. At a German bank that sets it, a savings account lets out €2,000 a month without notice, whether as cash, moved, or paid out for you, and no more.',
      'A new card after a report follows in the bank’s days, for its fee, and a card nearing its expiry has a new one sent ahead. Someone else may use a card, as often as the country’s official figures say it happens: the bank stops some of it and asks, and the rest shows up in an alert or on the statement. Where the bank does it, Move My Account To A New Number gives the current account a new number and a new debit card.',
      `Some cards open at an introductory rate for months, pay rewards on what goes on them, lend into your account for a money transfer, or put part of what purchases owe into a plan paid off in equal months, at the plan’s own fee or rate in place of the card’s interest${PLAN_FREE_AT.length ? `; at ${andList(PLAN_FREE_AT)}, a plan made while the card’s introductory rate runs costs nothing` : ''}. A card applied for at another bank can take the balance of one you hold, for its fee and at its transfer rate, and the old card closes once it’s moved.`,
      `A term deposit locks money away at a fixed rate for its term, and ends as its bank ends it unless you choose another way the bank allows, in time for any notice it needs: renewed for the same term, with any days’ grace to take it whole; moved into easy-access savings; or paid out. The bank writes before the end. Where the bank allows it, Break It Early costs the bank’s penalty, shown before you do it, and comes out of the deposit itself if the interest won’t cover it; some banks need notice first. Some banks let the interest be taken during the term, or charge for savings withdrawals past a free number a month.`,
      `${Object.keys(ROUND_UPS).length} banks move money into savings at the same bank as you spend, each its own way: the change to the next unit you choose, a set amount a purchase, or KakaoBank’s remainder of the day’s balance, on the bank’s own day and never into an overdraft. A choice the bank leaves to you, such as the unit or the amount, is yours to make before they start. An account left untouched goes inactive and then dormant, blocked until it’s reactivated, and after the country’s years its money goes to the state, to be claimed back. Where the country has a cooling-off period, a new account or card other than your primary can be canceled within it: in Korea a card alone, in Canada no card, in Britain no fixed-rate deposit, and in Mexico only one not yet used.`,
      'A savings account can be opened, or closed with its money moved back. Where Germany’s monthly limit holds and it holds more than the month lets out, closing it gives three months’ notice, and it closes then. Past the bank’s free withdrawals in a month, each one out of savings costs its fee, a payment savings makes for you included.',
      // From 2026-10-16 (brief 09): Close It on it at a German bank charges this month's fee only to the day, said under the
      // button first (`closingFeesDue`, `closingFeesWords`); until then the whole month, and nothing said it beforehand.
      'An account you kept in the country you lived in before Yale stays at its bank, shown in its own money with the dollars beside. It opens nothing new for you from abroad, takes its fee for a customer abroad and its card’s fee on purchases in dollars, closes on the day it says where its bank closes one, and sends and receives money only as a payment abroad, less its fees and the exchange. Closed with Close It, a German bank charges this month’s fee only for the days it’s been open, the figure said under the button before you press it. Its country takes its tax from the interest. On an F-1 the US doesn’t tax the interest; a US citizen reports it with the tax credited, and one whose accounts abroad passed $10,000 is told of the FBAR, and of Form 8938 past its own lines, with the return.',
      // From 2026-10-16 an account closed charges the overdraft interest built since the 1st, and the bank's own close the
      // fees owed to the day and ends a standing order from or into the account (`settleOverdraftInterest`,
      // `closeForOverdraft`, `endOrdersOf`); until then both were dropped with the account, and the order failed monthly.
      'An overdraft is arranged to a limit, with interest and any fee, or paid item by item with a fee for each, its interest charged on the 1st or when the account closes. A US bank won’t pay an everyday debit card purchase into an overdraft unless you’ve opted in. An account left below zero past any arranged limit for sixty days is closed (in France, two months after the bank gives notice): the bank charges off what it can’t recover, with the interest and fees owed to the day, the debt goes to collections and onto your record, a standing order from or into the account ends with it, and your money moves to another bank.',
      'In the US the bank reports such a closing to ChexSystems for five years, and the next bank may turn you away (most do while the debt is unpaid, about half once it’s paid), leaving a second-chance account with a monthly fee and no overdraft. Pay It, under In Collections, pays the debt down. A French bank writes after a month past your overdraft and offers a loan for it at three: Take The Loan takes it, and once the account is back within its limit the sixty days start again.',
      'A personal loan payment the account can’t cover in full takes what’s there and goes on your record as missed, with the bank’s fee where it charges one, and the rest stays owed. When you move to another bank, your card stays with the bank that issued it, as loans and term deposits do. The bank’s name, each account’s name and every line on a statement open where they stand: the bank into the accounts it holds for you and the latest money through them, and a line into the accounts it moved between and the day it went through.',
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
      'Press your name on Home, or the line at the top of How You Are, to open your own page: your whole wellbeing and your readiness, the traits you hold, any long-term condition you carry and any injury, each of them pressable.',
      'Your birthday comes every year, at nine in the morning wherever you are. The age you turn changes how far your body can go and how much a night gives back.',
      'A life ends. Each year carries the chance a real year at your age carries, from the US life table, made lighter or heavier by the life expectancy where you live, for the fourteen countries it’s known for, heavier for a body worn down and lighter for one kept well. The game never says when.',
      'When it ends, the clock stops for good, and the save shows who you were, what you earned and what you left behind. It stays in its slot until you delete it.',
      'That’s every part of the game. Guide, at the top of the screen, opens any chapter again whenever you want it.',
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
