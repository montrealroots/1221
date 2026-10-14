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
 */

import { ABILITY_DEFS, MASTERED, TECHNIQUES } from './abilities';
import { bankById } from './banks';
import { ROUND_UPS } from './roundups';
import { PRACTICE } from './practice';
import { ENROLLMENT, PUBLIC_COVER, RETURN } from './safetynet';
import { EXTENDED_STUDY, SUMMER_CABARET, YALE_CABARET } from './school';
import { COASTING_ENERGY_CEILING, LONGEST_NIGHT, SHORTEST_SLEEP } from '../systems/life';
import { BRIEF } from '../systems/briefs';
import { PLAN_FREE_IN_INTRO } from '../systems/cardoffers';
import { COLLECTION, SUBSTITUTE } from '../systems/taxreturn';
import { SSN } from '../systems/taxid';
import { formatMoney } from '../core/money';
import { plural } from '../core/text';
import { MONTH_NAMES } from '../core/time';

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
  /** What the part of the game does, a paragraph at a time. */
  body: readonly string[];
  /** What reading it opens, said the way the screen names it. */
  names: readonly string[];
  /** The same, by id: commands, `look.*` and `ui.*`. */
  opens: readonly string[];
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'welcome',
    title: 'Your Life, Hour By Hour',
    lead: 'What SLATE is, and how Home is read.',
    body: [
      'SLATE is one life, lived on a real clock in a real town. Everything you see is worked out from where you are and what day it is: the local time, the season, the money, the prices and the law.',
      'Home is the day you’re standing in. The line under your name says the time, the town, its time zone, the season and the sky.',
      'An underlined word opens. Press one and what it names unfolds under it, with more to press inside: a day, a town, a country, its currency. A word opens once its chapter here has been read, and until then it’s plain text.',
      'Save & Exit is always there, top right. It writes the save and takes you back to the slots, and Continue brings you back to the same moment.',
      'Every place in your life opens from Home, or from the menu down the left once its chapter is read. How This Works, on a panel, says what it does and what it’s connected to; ? anywhere opens that reference by what you’re trying to do, and / searches it. Reading it moves no clock.',
    ],
    names: ['Where You Are', 'The day, the town, the region, the country, the currency, the season and the daylight, when you press them'],
    opens: ['ui.where', 'look.day', 'look.place', 'look.region', 'look.country', 'look.currency', 'look.season', 'look.daylight'],
  },
  // Until 2026-10-13 this chapter said a commitment the clock ran had you there if you were awake and in its town. From
  // that day a plan that comes while you’re in hospital is missed (`world/plans.ts`), as care counts anyone in hospital
  // absent (`presentForCare`); found by the guide’s audit of that day.
  {
    id: 'calendar',
    title: 'What’s Coming',
    lead: 'Commitments, and the moment one wants you.',
    body: [
      'The Calendar panel at the top of Home is what’s coming: the next thing that wants you, and the few after it.',
      'A commitment is something you’re expected at, like a plan you made. When the clock reaches one, it stops and asks.',
      'Go spends the hours it takes, and the clock goes through them. Skip It walks away from a plan of your own. Stand Here closes the question and leaves the clock paused at the commitment; whatever moves it next runs the commitment, with you there if you’re awake, out of hospital and in its town.',
      'The clock hasn’t moved yet, so nothing has come due. The next chapter starts it.',
    ],
    names: ['Calendar', 'Go', 'Skip It', 'The entries on it, when you press them'],
    opens: ['ui.calendar', 'ui.go', 'calendar.skip', 'look.entry'],
  },
  {
    id: 'clock',
    title: 'The Clock',
    lead: 'Time runs a minute a minute, and stops when you say.',
    body: [
      'The clock at the top runs one to one with real time: a minute here is a minute there. A new life starts with it paused, so nothing happens before you’re ready.',
      'Play starts it and Pause stops it. The world goes on around you while it runs: hours pass, you tire and get hungry, and what’s due comes due.',
      'Play, Advance and Choose An Event stop at anything that wants you, and wait for your answer. Sleep doesn’t: it runs on through anything in its hours, and the Sleep dialog says what that will be.',
    ],
    names: ['Play and Pause'],
    opens: ['ui.play', 'world.set_preferences'],
  },
  {
    id: 'advance',
    title: 'Moving Time On',
    lead: 'Jumping ahead, and what happens on the way.',
    body: [
      'Advance moves the clock ahead on purpose, when you don’t want to wait: One Hour, This Evening at six, Tonight at ten, Tomorrow Morning at seven, the Next Event, Next Monday at nine, One Week, or Choose An Event from the next fourteen things on the calendar.',
      'Everything on the way happens, in order. The clock stops at each commitment and asks, the way it does at any other. If a jump crosses some, it says how many first.',
      `A jump of more than an hour through the night is a night your character sleeps on their own, from midnight: a poorer night than one you choose, and one that never takes energy above ${COASTING_ENERGY_CEILING}. Live, or an hour at a time, they stay up with you. Time only runs forwards.`,
    ],
    names: ['Advance', 'Choose An Event'],
    opens: ['ui.advance', 'ui.skip'],
  },
  {
    id: 'needs',
    title: 'What Needs You',
    lead: 'What happened while you weren’t looking.',
    body: [
      'What Needs You is where the world tells you things: groceries you couldn’t pay for, a late card payment, a birthday. The number beside Home in the menu is how many are waiting.',
      'Mark Read clears them once you’ve seen them. Go There, where it shows, takes you to the screen for it.',
      'A question the world needs you to answer shows here too, with its answers as buttons. Dismiss takes it off the list without answering it, and what it asked still runs out when it would.',
    ],
    names: ['What Needs You', 'Mark Read', 'A question’s answers, and Dismiss', 'A notice or a question, when you press it'],
    opens: ['ui.needs', 'world.mark_read', 'world.take_decision_action', 'world.dismiss_decision', 'look.notification', 'look.decision'],
  },
  // Until 2026-10-12 this chapter called the other dials “one press away” and sent the player to “your own page” for the
  // traits and the conditions, though your own page (`look.person`) opens with “A Whole Life”, the last chapter, and
  // before it Readiness, naming at most three dials, is the only way to another. A trait is pressed on the Player
  // Profile, which opens with “You As An Actor”, and a condition only on your own page: those two chapters say so, and
  // this one names neither page, so nothing here points ahead. Until 2026-10-12 it also said the traits and the
  // conditions each opened when pressed, and named them among what it opened, though nothing on screen shows a trait
  // to press before “You As An Actor”, or a condition before “A Whole Life”. It says what they do, and the two looks it
  // opens are first reached from those chapters' pages.
  {
    id: 'body',
    title: 'How You Are',
    lead: 'The dials a body runs on.',
    body: [
      'How You Are keeps three dials in front of you. Energy runs down every waking hour and faster on a short night. Stress eases while you have energy left and climbs once it runs out, and owing money adds to it every day. Readiness is how well you’d do something right now, out of all the rest.',
      'Behind them are the others: morale, condition, fitness, nourishment and hygiene, and the sleep you owe. Readiness opens onto the dials costing it most, up to three, and each dial says where it stands and what that does.',
      'Age sets how high condition and fitness can go. A body in its twenties barely loses a point a year; one in its seventies loses more than a point a year.',
      'The traits you hold and the conditions you carry weigh on how you are too: a trait that bears on it by its own amount, and a condition by what it does when it’s left alone.',
    ],
    names: ['How You Are', 'Each dial, and readiness, when you press them'],
    opens: ['ui.how', 'look.dial', 'look.readiness', 'look.trait', 'look.condition'],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    lead: 'The night, and what it gives back.',
    body: [
      // The dialog's own limits (from 2026-10-12: until then this said "between one and fourteen", and the slider began at one).
      `Sleep asks how many hours, from ${hoursOf(SHORTEST_SLEEP)} to ${hoursOf(LONGEST_NIGHT)}, and suggests a number from when you’re next wanted and what you owe. It says when you’d wake.`,
      'A night puts energy back, less of it the more sleep you owe. It mends condition as far as your fitness and age allow, but only with more than about five hours of real rest; less, and condition falls. A night under six hours adds to what you owe.',
      'The world keeps going while you sleep. Anything on the calendar in those hours happens without you, and the dialog says what you’d sleep through.',
    ],
    names: ['Sleep'],
    opens: ['ui.sleep', 'life.sleep'],
  },
  {
    id: 'looking-after',
    title: 'Looking After Yourself',
    lead: 'Eating, washing, working out and unwinding.',
    body: [
      'Look After Yourself holds what a day needs besides sleep, each with how long it takes, what it costs and what it would do to your dials. It’s in the order of what it’s worth now: first whatever is costing you every hour it’s left (hunger, going unwashed, stress past its line), marked Needed Now, then by how much readiness it gives back. It does what you choose, when you choose it, and only then.',
      'The day’s groceries are bought every morning, at the town’s prices, and eaten across the day. Eat A Meal feeds you and lifts the mood by as much as you needed it; Order In does it without the cooking, at what delivery costs. A Shower is clean again and calmer. Unwinding takes the edge off stress.',
      'Work Out builds fitness and eases stress, and costs energy, food and a shower: a little more on a run on a dry, mild day than indoors.',
      'Your weight follows what you eat against what you do: the meals that fill you at what your body burns, a meal ordered in a restaurant’s larger one, and a workout or a show burning more. Years on, the same eating puts weight on, as a slowing body burns less. A heavier body is likelier to meet diabetes, high blood pressure and arthritis, and to die sooner. A run, a workout or a stage can hurt you, and so can an ordinary day: a sprain or a pulled muscle keeps you from training till it mends, and a broken bone or a concussion keeps you from classes too, as a stay in hospital does.',
      'Something you love lifts you more: the menu says so beside it. When one can’t be done, it’s gray, with the reason.',
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
      'Open Calendar is the month. Pick a day and Put Something On It: a name, a start time and how long, from half an hour to all day. It wants you in the town you’re in when you make it, and no move in the game takes you out of that town.',
      'A plan is a commitment. The clock stops at it, and you choose Go or Skip It. Two things that want you at once are marked as a clash.',
      'Call It Off takes a plan off before it comes. A plan you sleep through, or one that comes while you’re in hospital, is missed, not kept.',
    ],
    names: ['Open Calendar', 'Put Something On It and Call It Off', 'Your plans and the stretches between them, when you press them'],
    opens: ['ui.open-calendar', 'calendar.schedule', 'calendar.cancel', 'look.plans', 'look.stretch'],
  },
  {
    id: 'weather',
    title: 'Weather',
    lead: 'The sky over wherever you are.',
    body: [
      'The weather is the town’s own: its climate, its season and today’s luck, the same every time you look. The panel shows now and the days ahead, and each day opens hour by hour.',
      'Thunder comes as often as published counts say for the big cities that have them, and as SLATE estimates for the town’s climate everywhere else, mostly on hot days. The weather also sets the weeks the flu comes round, and whether a workout is a run.',
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
  {
    id: 'school',
    title: 'Drama School',
    lead: 'Where your life as an actor begins.',
    body: [
      'You begin as a first-year in the MFA in Acting at the David Geffen School of Drama at Yale University, in New Haven: one of the sixteen actors admitted this year, among the strongest of them but not ahead of everyone. You arrive on the first day of the fall term, for registration and orientation, and classes begin a week later.',
      'Tuition is met for every student by the tuition scholarship. Yale’s aid for living costs goes by need, and your family’s means rule it out, so the Yale Health plan, billed each term, and the cost of living come from your bank.',
      'Your craft is 21 skills, listed on the School screen in alphabetical order: Accents And Dialects, Audition Technique, Character Work, Classical Text, Clown And Mask, Cold Reading, Comedy, Dance, Emotional Depth, Improvisation, Intimacy, Memory, On Camera, Physical Expression, Scene Study, Script Analysis, Singing, Speech, Stage Combat, Vocal Expression and Voice-Over. Four of them, Emotional Depth, Memory, Physical Expression and Vocal Expression, are abilities as well, each kept in one place. Acting, the row below them, is scene study twice with character work and emotional depth, and it’s what a Yale Rep role reads most. A part is cast on the skills its play needs: a voice and speech that carry and the body, and the classics and a fight where the play asks them. The work you do grows what it reads.',
      'Classes run nine to three on the class days: the year’s courses, each training one of those skills. Be there, in New Haven and awake, and your craft grows, more when you come rested. You began among the class’s strongest, not ahead of everyone: your fifteen classmates grow too, each at their own pace, and you’re cast beside and against them. Unwell or down with the flu, Call In Sick on any day with something at school, before it begins (on a class day, at the latest when the clock stops at the classes at nine), and the day’s classes, labs, rehearsal calls and work-study shift are excused, and a partner rehearsal missed ill isn’t held against you. A day in hospital is excused of itself. Staying away when you’re well is an absence.',
      'The first fall has Drama 50, three weeks of afternoon labs, and the first spring the New Play Lab, three weeks workshopping the first-year playwrights’ new plays; the last spring opens with your own solo piece, You Are The Creator. They’re calls like rehearsals.',
      'Every student works: six hours on the Saturdays of the class weeks, to 150 hours a year, and at least 50 more of elective evenings front of house at Yale Rep while the term runs, when you Take An Elective Shift. Hours are paid on Fridays.',
      'From the spring the chair casts you each term in one of the School’s productions: the Carlotta Festival as a first-year; a directors’ thesis or the Langston Hughes Festival in a fall after that, and a thesis or the Carlotta Festival in the second spring; a Shakespeare Repertory Project in your last spring. Once a year, in good standing, you’re at Yale Rep too, most often understudying. On call, the Rep calls three hours before each curtain, at five for an evening and at eleven for a Sunday matinee: be in New Haven then, and the evening is yours unless you’re needed, when you’re told and the performance goes on your calendar. Every understudy plays one run-through for the director. The chair reads every student the same way for each play: your fit for it, what a night of it would come to from your abilities and the techniques it asks, its kinds of play’s demands among them; a fifth of that by how much of yourself you delivered in your last run; and a lead counts against your next lead and a small part for it. The best read takes the biggest part written for them, and Why This Cast, under Casting, shows the reads. Each night is judged: the part’s techniques and the abilities a night asks, the lines, blocking and notes your calls and your own work made, and how rested you come. It’s off, solid, strong or remarkable at LAMDA’s pass, merit and distinction, and the director gives a note at the end of the run. Miss two calls in a term, labs and rehearsals together, and you’re out of the casting pool until a good evaluation. A missed performance, or not being in New Haven when you’re called to go on, is a grave breach: it puts you on academic warning at once, and on warning it dismisses you.',
      `The Yale Cabaret is the students’ own theater: Join A Cabaret Show puts you in a show at least ${daysOf(YALE_CABARET.leadDays)} off, one a term, its week clear of your days off, casting calls, nights on call, labs and work-study shifts, unless you’re on academic warning, on a leave, or cast in two productions at once. In the spring of your first and second years, in good standing, not on a leave and by ${monthDay(SUMMER_CABARET.applyBy)}, Join The Summer Company puts you in the Yale Summer Cabaret for the summer: ${counted(SUMMER_CABARET.runs.length, 'show')} and a weekly stipend. A day called in sick, in hospital or kept off by an injury excuses a Cabaret or Summer Cabaret call; miss a Summer Cabaret performance otherwise and the company goes on without you.`,
      `At the end of each term’s classes the faculty weigh your attendance at classes, calls and assigned shifts, your growth against the class, your work on stage, and your coursework, where a piece not shown counts as unready. Fall short on any and your standing drops a step: good to concern, concern to warning, warning to dismissal. Meet them all and you’re back in good standing and back in the casting pool. After the program’s six terms, in good standing or with a concern and every course passed, the MFA; the last term ending on academic warning, the faculty don’t recommend it. A course not passed leaves ${plural(EXTENDED_STUDY.requestDays, 'day')} to ask to repeat the year or for an additional term, where either is open to you, before the degree is withheld, and an Incomplete still open holds the degree until it’s made up.`,
      'Each course sets work at a meeting: a scene, a song, a movement score. Under Coursework, prepare it a step at a time, answer its questions at the table (where the text supports more than one reading, each is right), and choose how you’ll play it. A scene pairs you with a classmate: Ask them to rehearse an evening they’re free, and a rehearsal kept moves the scene’s partner part and their trust. A showing is judged twice over: your own work, which the band reads, and the scene together, with what your partner brought, which moves the bond between you. The teacher’s note names what held it back most.',
      'Work It Through, on a scene or a part, names the problems its forecast shows: a part of it that isn’t secure, a turn not worked, stamina going late, an ability holding it back. Pick one, try a way at it, and the figure before and after is shown; a change of how a part of it is played is kept or put back, and what you keep every later rehearsal and performance reads. Between a production’s calls the director names one of these too, somewhere in the play (what you want, listening, pacing, the physical life, a change, a relationship), with the ways at it: Work On The Note one way, and the next call says whether it was answered.',
      'Plays To Read, under Coursework, are twenty-nine plays first staged since 2000: Read It with the Haas Arts Library’s copy, and Research It once read.',
      'The School line in Your Affairs on Home shows your year, standing, place in the class and what’s next, and its button, named for the school, opens it all, tab by tab.',
      'On the School screen the school’s name, each course and each skill open where they stand: the school into this year’s courses and the town, a course into the skills it trains and the next day it meets, a skill into where you stand in it against the class.',
      'Beside the craft is composure, on the School screen. Nerves add stress before every performance, less the more composure you have, and every performance grows it; a night’s consistency reads it.',
    ],
    names: ['School', 'Your school, from its line on Home', 'Call In Sick', 'Take An Elective Shift', 'Join A Cabaret Show', 'Join The Summer Company', 'Coursework: preparing, the table, how you’ll play it, and asking your partner', 'Work It Through: name a problem, try a way, keep it or put it back', 'Learn The Part, Catch Up The Blocking and Work On The Note', 'Plays To Read: Read It and Research It'],
    opens: ['ui.school', 'school.call_in_sick', 'school.withdraw', 'school.request_leave', 'school.cancel_leave', 'school.return_notice', 'school.buy_affiliate', 'school.reregister', 'school.request_repeat', 'school.cancel_repeat', 'school.appeal_leave', 'school.request_extra_term', 'school.request_aid_review', 'school.pay_balance', 'school.request_conversion', 'school.make_up', 'school.extend_incomplete', 'school.take_shift', 'school.cabaret', 'school.summer_cabaret', 'school.orientation', 'school.prepare', 'school.choose', 'school.read_feedback', 'school.ask_partner', 'school.answer_partner', 'school.respond', 'school.make_amends', 'school.buy_ppe', 'school.approach', 'school.choose_playing', 'school.choose_part_playing', 'school.cancel_rehearsal', 'school.learn_part', 'school.review_blocking', 'school.work_note', 'work.identify', 'work.try', 'work.settle', 'plays.read', 'plays.research', 'look.school', 'look.course', 'look.skill', 'look.assignment', 'look.classmate'],
  },
  // The traits on the Player Profile are said here from 2026-10-12, where the Profile itself opens: until then only
  // “How You Are” spoke of them, and sent the player to a page that opened chapters later. Work It Through on a brief
  // is said here too, where the brief is, and not in “Drama School”, which opens its commands a chapter before the brief.
  {
    id: 'profile',
    title: 'You As An Actor',
    lead: 'Your abilities, your practice, and the genres you work in.',
    body: [
      `The Player Profile, at the foot of the rail or under your name, is you as an actor, and holds your ${word(ABILITY_DEFS.length)} abilities: Emotional Depth, Presence, Listening And Responsiveness, Imagination, Focus, Memory, Adaptability, Composure, Vocal Expression, Physical Expression, and beside them Discipline and Stamina. Each is kept in one place, 0 to 100, and each opens onto what it is, what grows it and which work reads it. The ${TECHNIQUES.length} techniques beside them are the methods of one kind of work, mastered at ${MASTERED}. The traits you chose at the start are on it too, each opening into what it moves.`,
      `Classes, coursework, rehearsals and nights grow what they train, toward the reach the classes level off at. Practice, an hour on one exercise, goes past it to full: Practice beside each one. The same exercise again the same day gives half, and past ${PRACTICE.dailyHours} hours a day practice stops counting. Discipline grows with each day you practice; stamina is your fitness, built by a workout.`,
      'Finished work, a showing, a night or a self-tape, is judged on its own dimensions: believability, interpretation, connection, execution, consistency and responsiveness, as the work asks. Every ability it reads at full, every technique mastered, the preparation complete and you rested and well, it’s 100. Short of that, each piece of work says what held it back, and by how much.',
      `Study It reads a play of a genre or watches a film of the kind. Every genre has a practice brief, an original scene written for SLATE: Open Its Brief to read where and when it is, who the two of you are, what you want, what’s in the way and where it turns. Break It Down, Learn The Lines and Rehearse It On Your Feet prepare it; choose a reading and how to play it, and from then Work It Through works on it as on a scene; then Tape It. A take asks you to know the genre too: the better of what you’ve studied and what you’ve worked in it, complete at ${Math.round(BRIEF.complete.genre * 100)}. What a genre asks of an actor, where the research established it, is a technique its brief stages, shown before you begin. A take is judged beat by beat: each beat’s rehearsal, how far into the take it falls, where stamina tells, and a slip in the beat before, which composure and adaptability recover from. Read With chooses who reads opposite you: a recording, or a classmate who learns it as you rehearse together. Your own take is yours either way; the take with the reader is what a casting office would see, and a Strong one earns a callback: a harder pitch with a note on how to play it, answered only by a take played that way. Loving a genre makes a rehearsal or a night of a play of its kind a better day, never better work.`,
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
  // return on a June 1040-NR was due in April: each found by the current scope’s acceptance of that day.
  {
    id: 'papers',
    title: 'Cover, Benefits And Returns',
    lead: 'Health cover, benefits, pensions and the return.',
    body: [
      `Yale’s health plan covers you to the end of July after school. From ${ENROLLMENT.specialDays} days before it ends, Enroll takes you into Medicaid (Medi-Cal in California, HUSKY D in Connecticut), New York’s Essential Plan or Covered Connecticut whenever last month’s income is low enough, with no premium, from the first of the next month or as Yale’s ends if that’s later. From 2027 Medicaid asks ${PUBLIC_COVER.workHours} hours’ work, ${formatMoney(PUBLIC_COVER.workEarnings, 'USD', { cents: false })} earned or school at least half-time in the month before, of anyone applying as of anyone renewing; Covered Connecticut asks an income at least the poverty line, and from 2027 a citizen’s or green card’s status, and ends once Yale Health covers you again. A program is checked again at renewal, every six months from 2027: where last month’s income now fits the other program it moves you there with no gap, and it ends if you fit neither, fail the work, or move out of the state. Otherwise Enroll buys the marketplace’s plan in New York, California or Connecticut, starting the same way, in open enrollment, in those ${ENROLLMENT.specialDays} days before Yale Health ends, or within ${ENROLLMENT.specialDays} days of losing cover; a plan you drop or leave unpaid opens no such window. Drop The Plan ends whichever plan of your own you hold. Each month you live in California without cover adds California’s penalty to your return.`,
      'Between jobs, File A Claim opens unemployment insurance where you live, in New York, California or Connecticut, if your base period’s wages qualify. New York and California don’t pay the first week that would pay; Connecticut does. A week with work pays less, or nothing, and a week abroad pays nothing. Living in Britain as a British or Irish citizen, File A Claim is Universal Credit: a month assessed at a time and paid a week after, the standard allowance, less 55p of each pound earned and something for savings over £6,000, none over £16,000. In Ireland it’s Jobseeker’s Allowance, €254 a week for the days out of work, less something for savings over €20,000. A state pension is claimed under Unemployment once your record and your age allow: Claim Social Security, or Claim It for the UK’s or Ireland’s State Pension, the IMSS pension or the Pensión para el Bienestar.',
      'Illness comes at a young adult’s rates, and the flu more often when you’re short of sleep or stressed, in the weeks the town’s climate brings it; and each piece of care brings a bill for what your plan leaves you; unpaid, it’s a medical debt, and Pay It Off settles it. A Connecticut hospital’s charity comes off an uninsured patient’s bill at once; with insurance, Apply For Assistance puts the bill in before it’s due, free to 250% of the poverty line and 67% off to 550%. A condition you carry costs its care each month: Let It Go stops it, Keep It Up starts it again. Buy Dental adds a dental plan of your own where your health plan pays nothing for the dentist, in New York or beside a Covered California plan; Drop Dental ends it, though Yale’s, paid for the year, runs to its end.',
      `Each February a year’s return is ready where it owes or is owed anything or its income reached the standard deduction, and every year on an F-1: File It by mid-April, or by June 15 on a 1040-NR with no wages on it, though Connecticut’s return on it is still due in mid-April. A UK tax year’s is settled on its own, by the next 31 January. A balance comes from your bank, savings included, and filing late with a balance costs penalties. The IRS’s refund comes ${RETURN.refundDays} days after filing, ${SSN.itinWeeks} weeks later on a 1040-NR filed without a Social Security number, and a state’s on the state’s own day. What the bank couldn’t pay grows by the IRS’s ${pct(COLLECTION.interest)} a year in interest and a penalty of ${pct(RETURN.payLateMonthly)} a month, to ${pct(RETURN.lateCap)} of it, until Pay settles it; left alone, the IRS writes every ${counted(COLLECTION.noticeWeeks, 'week')}, its last letter a final notice, and ${plural(COLLECTION.finalDays, 'day')} on takes it from your bank accounts. A return never filed that owes, the IRS files for you ${plural(SUBSTITUTE.afterDays, 'day')} after it was due, from what your employers and banks reported. Your own, filed within ${SUBSTITUTE.answerDays} days, replaces it before any of it is assessed; filed after, it makes the tax what your return says, and the penalty and interest fall in proportion. A pension has federal tax withheld from each month.`,
      'A doctor’s visit is an appointment where the place publishes how long one is waited for: England’s spread from the same day to five weeks, New York’s four days and Los Angeles’s thirteen, Canada’s next day for about a quarter, IMSS’s twenty-nine days for a Mexican. In New Haven, Your Doctor chooses the practice: Yale Health Center sees a student it covers the next weekday, at no charge, and its plan pays for a visit only there; Fair Haven Community Health Care sees anyone, and publishes no wait, so it books after New Haven’s, fifteen American cities’ average of twenty-four days, and bills a Yale Health member as uninsured. Kept, it’s seen and billed; missed, it isn’t, and Book An Appointment books again. Ireland publishes no wait, and a visit there comes when it comes. A visit kept can end in a referral, as often as doctors there refer, and the specialist is seen after the published wait: a month in America, twelve weeks in England, eleven in Ontario and twenty in British Columbia. In England a prescription is £9.90 an item under 60, and a prepayment certificate, £32.05 for three months or £114.50 for a year, makes every one free while it runs.',
      'An emergency keeps you in the department its median time where you live, New York’s 204 minutes or Ireland’s nearly six hours, and you miss what that time held. In America, Your Pharmacy fills a generic at its own cash price, your plan’s copay never more, Walmart’s $4 against the $40 median.',
      'Report Stolen as well as Report Lost. File A Police Report online where the police take one that way.',
      'A marketplace plan may deny a claim, as KFF finds one in five are: it’s billed as if you were uninsured, and Appeal It within 180 days to have it decided in 60. A long-term condition is reviewed at NICE’s interval, a doctor’s visit booked for it.',
      'A condition’s medicine is a supply filled where you live with a week left, 28 days in England and 30 in America; Fill A Longer Supply takes up to 56 days in England, 90 in America, 100 in Ontario.',
      'Depression can be lifted by a course of CBT: choose a Therapist where you live and Begin A Course Of 8, NICE’s weekly sessions at the practice’s own price, or free on the NHS in England after its six weeks. Done, it lifts at the published rate, NHS Talking Therapies’ 48.5% or a private course’s 36%, and no longer weighs on you.',
    ],
    names: ['Papers', 'Therapist', 'Report Stolen', 'File A Police Report', 'Appeal It', 'Fill A Longer Supply', 'Apply For', 'Book An Appointment', 'Prepay A Year', 'Prepay Three Months', 'Enroll', 'Drop The Plan', 'Pay It Off', 'Apply For Assistance', 'Keep It Up', 'Let It Go', 'Buy Dental', 'Drop Dental', 'File A Claim', 'Claim Social Security', 'Claim It', 'File It', 'Pay', 'Your Pharmacy'],
    opens: ['ui.papers', 'health.therapy', 'documents.police_report', 'health.appeal', 'health.extra_supply', 'health.enroll', 'health.drop', 'health.pay_bill', 'health.apply_aid', 'health.treat', 'health.dental', 'health.choose_clinic', 'health.book', 'health.cancel_appointment', 'health.prepay', 'benefits.claim', 'benefits.ei_register', 'benefits.assistance', 'pension.social_security', 'pension.state', 'pension.ie_state', 'pension.imss', 'pension.bienestar', 'tax.file', 'tax.pay', 'tax.amend', 'tax.apply_plan', 'tax.catch_up_plan', 'tax.revise_plan', 'tax.pay_state', 'tax.apply_state_plan', 'tax.catch_up_state_plan', 'tax.lien_release', 'tax.lien_dispute', 'tax.federal_lien_withdraw', 'tax.request_waiver', 'health.choose_pharmacy'],
  },
  // Until 2026-10-12 this chapter's lead offered a border to cross, though nothing has traveled since 2026-10-09; it said a
  // new passport took whatever was issued on the old one, though only a travel authorization goes (`issuePassport`);
  // it said Report Lost canceled anything you held, though only a passport, a license, an international driving permit
  // and an ID card are lost, an F-1 refused (`LOSABLE`, `systems/documents.ts`); and it said a lost license was
  // replaced only where it was issued for someone living there, though from 2026-10-10 New York sends one out of state
  // by mail (`licenseReplaceRefusal`, `systems/identity.ts`).
  {
    id: 'documents',
    title: 'Passports And ID',
    lead: 'A passport, what each country asks to let you in, an ID card and a student’s status.',
    body: [
      'A passport comes from the country you’re a citizen of, at its office’s fee and in its office’s time; Apply For One, or Renew It, and where the office sells a faster service, Apply Faster. The new one cancels the old, and a travel authorization issued on the old one goes with it. Report Lost cancels a passport, a license, an international driving permit or an ID card. A lost passport takes what was issued on it with it, all but an F-1.',
      'Each country has its own rule for your citizenship: free to enter, a travel authorization first, or a visa. Pick a country under Going Abroad to see what it asks and what you’re missing: there’s no travel, so it’s the rule to read, not a form. Some ask your passport to last months past the day you leave. A visit is a visit: staying, or working, is a different permission.',
      'Your ID is the state’s ID card where you live: Get one at its fee. A new bank asks for a photo ID in force, a passport, a license or an ID card, before it takes you on. A lost license is replaced where it was issued for someone living there, or by mail from out of state where the issuer sends one, as New York does, and in New York free if it was stolen and the police have your report: File A Police Report, online where the police take one, New Haven’s among them. A lost ID card, reported lost, is replaced where it was issued for someone living there, Replace It at the issuer’s fee: New York’s $8, Connecticut’s $30, California’s $40 and free from 62, Ontario’s $10, British Columbia’s $15, the INE free, Ireland’s passport card €35; it comes after the issuer’s published weeks.',
      'A student on an F-1 holds US status while they study and for sixty days after the program ends. After the degree, Apply For OPT: twelve months to work in the field, lost after 90 days in all without work. Residence Abroad says what another country asks to make a home there.',
      'Each paper you hold opens where it’s listed: who issued it, the last digits of its number, when it was issued and runs out, what it lets you do today, and the country it’s from or for.',
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
      'Your money is kept in the currency of the country you started in. The Money line in Your Affairs on Home shows your current account and your net worth (the bank and cash in hand and a pension from before, less what you owe on the card, loans, what went unpaid, medical bills and collections), and how much of it is owed.',
      'Your credit record rises with each card payment made on time, and slowly with no card at all while nothing is late or in collections. It falls with a card used past 30% of its limit, a late payment, a missed loan payment, applying for a card, a medical debt left unpaid a year, and a debt charged off to collections. It decides whether the bank gives you a card, an overdraft or a loan, and at what rate where the bank prices by it; and the card’s limit and whether it’s raised. Its own figure shows only when a life is made, as a number in the United States and Canada and a word elsewhere; in play you read it in what the banks do.',
      'The accounts and the card are your bank’s, and the next chapter opens them.',
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
  // sixty days starting again after Take The Loan; found by the current scope’s acceptance of that day.
  {
    id: 'bank',
    title: 'Your Bank',
    lead: 'A real bank where you live, and what it does with your money.',
    body: [
      'Your money is kept at a real bank in the country you live in, under the names that bank gives its accounts, and each account has a number written the way the country writes one. The Money line in Your Affairs on Home has a button named for your bank, which opens it.',
      'An account that earns interest builds it each day on what it holds and is paid on the last day of the month, or in the months its bank pays: Germany’s at each quarter’s end, Japan’s in February and August, a Livret A in December. Where the country has the bank take tax off interest first, it does. Where a bank publishes no rate, the one shown is SLATE’s estimate and says so.',
      'A current account that charges a monthly fee takes it on the last day of the month, or with Germany’s banks at the quarter’s closing, unless the month met one of the bank’s waivers, such as enough paid in, enough kept in it, enough card purchases, or your age. The bank screen says how this month stands.',
      'Your credit card is the bank’s own, under its own name and terms: the rate, or the range it prices a record within; any yearly fee; the minimum; the late fee; and the days to the due date, held to the law’s caps. A statement comes on the 20th. Autopay asks for the whole statement, or only the minimum if you choose, from the current account it’s set on, and from easy-access savings at that account’s bank if you’ve linked savings; if they can’t cover all of it, the payment comes back unpaid, and unless the minimum was paid by hand it counts as missed; the card charges a returned-payment fee for it, except on a US card when the late fee covers the same miss. A statement paid in full is charged no interest, unless the one before it wasn’t, when the interest built up to the day you cleared it comes on the next statement. Paying less than the minimum is late and costs a fee; outside the US it also goes on your record and lowers your limit, and in the US that happens only if the payment is still short at the next due date, thirty days on. Some banks, much of Europe’s among them, issue a card that takes the whole statement every month and can’t carry a balance. Pay Card In Full pays it off now, or as much as you have. Where the bank’s card wasn’t found, its terms are SLATE’s estimate, and the screen says so.',
      'Apply for a card at any bank in the country that issues one, yours or another: it reads your record and what you have to repay from, and a card comes in about a week. You can hold one card from each bank. The day’s spending goes on the everyday card, and Make It The Everyday Card moves it to another; each card has its own statement, due date and minimum, and your record reads what’s used of all their limits together. Move the statement day and the due date moves with it. Ask for a higher limit or a lower one, and say whether the bank may raise it unasked. In the US, opt in to going over the limit or not. Close the card and it takes nothing new while what’s owed is paid down. Miss two payments in a row and the card is suspended; six, and it’s charged off to collections. When what’s in your current accounts and savings can’t clear the card, ask for help with payments: the bank freezes the interest, sets a payment that clears it in four years, and suspends the card until the first statement or due date after it’s paid off.',
      'Interest builds each day on what the card owes, once a statement isn’t paid in full, and a statement paid in full keeps new spending interest-free. The rate is set by your record when the card opens and held there; in the US a payment sixty days late ends any introductory rate, and where the card has a penalty rate it applies after 45 days’ notice, until six payments in a row are on time. Pay more than you owe and the card holds your credit; Send The Credit To My Account moves it back.',
      'Statements, on a tab of their own, show every entry on each account you’ve held, month by month (quarter by quarter in Germany, whose banks close an account each quarter), with the balance after each, and for the card what the statement asked and what paying only the minimum would take. The Year adds up the interest, the tax taken off it and every fee. Alerts tell you when the current account ends a day under a line you set, when a payment goes over one, and when a statement is ready.',
      'How You Pay sets how the day’s spending is paid: on the debit card, the credit card or in cash. A purchase the way you pay can’t cover isn’t made, and nothing is owed for it. Savings Covers The Current Account, turned on, pays what a current account can’t from easy-access savings at the same bank, for whatever that account pays: the day’s spending from the primary account, a card’s autopay from the account it’s set on, a loan’s payment from its repayment account. Standing orders move money into savings on a day each month, and a payment can be set for a date.',
      'Cash takes money out at your bank’s ATM, another bank’s, the counter, or in Britain the Post Office where your bank allows it, each for the bank’s own fee, and the machines no more in a day than it lets out; another machine’s owner may add a fee of its own. A cash advance on the card costs its fee and draws its rate from the day it’s taken, with no grace period, and a payment to the card goes to the dearer balance first; in the US, only what you pay above the minimum does. Cash can be paid back in, and the day’s groceries paid in cash. At a German bank that sets it, a savings account lets out €2,000 a month without notice, whether as cash, moved, or paid out for you, and no more.',
      'A card can be locked, and nothing new goes on it, and unlocked. Reported lost, stolen or damaged, it stops at once and a new one with a new number follows in the bank’s days, for its fee, and a card nears its expiry with a new one sent ahead. Somebody else may use a card, as often as the country’s official figures say it happens: the bank stops some of it and asks, and the rest shows up in an alert or on the statement. Report it as not yours in time and the law decides what you carry and how fast the rest comes back. Where the bank does it, Move My Account To A New Number gives the current account a new number and a new debit card.',
      `Some cards open at an introductory rate for months, pay rewards on what goes on them, lend into your account for a money transfer, or put part of what purchases owe into a plan paid off in equal months, at the plan’s own fee or rate in place of the card’s interest${PLAN_FREE_AT.length ? `; at ${andList(PLAN_FREE_AT)}, a plan made while the card’s introductory rate runs costs nothing` : ''}. A card applied for at another bank can take the balance of one you hold, for its fee and at its transfer rate, and the old card closes once it’s moved.`,
      `A term deposit ends as its bank ends it unless you choose another way the bank allows, in time for any notice it needs: renewed for the same term, with any days’ grace to take it whole; moved into easy-access savings; or paid out. The bank writes before the end. Where the bank allows it, Break It Early costs the bank’s penalty, shown before you do, and out of the deposit itself if the interest won’t cover it; some banks need notice first. Some banks let the interest be taken during the term, or charge for savings withdrawals past a free number a month. ${Object.keys(ROUND_UPS).length} banks move money into savings at the same bank as you spend, each its own way: the change to the next unit you choose, a set amount a purchase, or KakaoBank’s remainder of the day’s balance, on the bank’s own day and never into an overdraft. A choice the bank leaves to you, such as the unit or the amount, is yours to make before they start. An account left untouched goes inactive and then dormant, blocked until reactivated, and after the country’s years its money goes to the state, to be claimed back. Where the country has a cooling-off period, a new account or card other than your primary can be canceled within it: in Korea a card alone, in Canada no card, in Britain no fixed-rate deposit, and in Mexico only one not yet used.`,
      'Move Money moves it between your own accounts: at once between two at one bank, and to another bank in the sending bank’s time, or its country’s where the bank sets none: at once where the country’s banks pay instantly, and otherwise held as Money In Transit until it lands. A savings account can be opened, or closed with its money moved back; where Germany’s monthly limit holds and it holds more than the month lets out, closing it gives three months’ notice, and it closes then. Past the bank’s free withdrawals in a month, each one out of savings costs its fee, a payment savings makes for you included.',
      'Where the bank runs an overdraft, the account can go below zero its way: arranged to a limit, with interest and any fee, or paid item by item with a fee for each. A US bank won’t pay an everyday debit card purchase into an overdraft unless you’ve opted in. An account left below zero past any arranged limit for sixty days is closed (in France, two months after the bank gives notice): the bank charges off what it can’t recover, the debt goes to collections and onto your record, and your money moves to another bank. In the US the bank reports it to ChexSystems for five years, and the next bank may turn you away (most do while the debt is unpaid, about half once it’s paid), leaving a second-chance account with a monthly fee and no overdraft. Pay It, under In Collections, pays the debt down. A French bank writes after a month past your overdraft and offers a loan for it at three: Take The Loan takes it, and once the account is back within its limit the sixty days start again. A term deposit locks money away at a fixed rate for its term, and ends the way its bank ends it. A personal loan is repaid in equal monthly payments; one the account can’t cover in full takes what’s there and goes on your record as missed, with the bank’s fee where it charges one, and the rest stays owed. And you can move to another bank where you live. Your card stays with the bank that issued it, as loans and term deposits do.',
      'The bank’s name, each account’s name and every line on a statement open where they stand: the bank into the accounts it holds for you and the latest money through them, a line into the accounts it moved between and the day it went through.',
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
      'Your name on Home, and the line at the top of How You Are, open your own page: all eight dials and readiness, the traits you hold, the conditions you carry and any injury, each of them pressable.',
      'Your birthday comes every year, at nine in the morning wherever you are, and the age you turn changes what your body can reach and how much a night gives back.',
      'A life ends. Each year carries the chance a real year at your age carries, from the US life table, made lighter or heavier by the life expectancy where you live for the fourteen countries SLATE has it for, heavier for a body worn down and lighter for one kept well. The game never says when.',
      'When it ends, the clock stops for good, and the save shows who you were, what you earned and what you left behind. It stays in its slot until you delete it.',
      'That’s every part of the game. The guide stays at the top whenever you want to read any of it again.',
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
