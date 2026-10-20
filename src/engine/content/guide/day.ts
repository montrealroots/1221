/**
 * SLATE — the guide's reference: your day and the clock (from 2026-10-12; `content/guide/types.ts`).
 *
 * The figures are the rules' own, imported: the plan form's limits (`world/plans.ts`), the night a jump sleeps for
 * the player (`COASTING_ENERGY_CEILING`, `systems/life.ts`), the live clock's longest step (`core/realclock.ts`), what
 * a run asks of the weather (`FINE`, `TRAINING`), the flu's timing (`systems/seasons.ts`) and New Haven's thunder
 * (`content/thunder.ts`). The ones written as words are kept where nothing can import them, unexported or in a
 * screen: the Advance menu's hours and Skip To Event's fourteen (`ui/shell/TimeControls.tsx`), Home's six rows, the
 * decisions' 180 days and the world's look every 2 days (`world/world.ts`), the 500 notices kept
 * (`core/simulation.ts`), the hour a jump may move with the player still there (`LONGEST_STEP_WITH_THE_PLAYER`), the
 * stress a night alone leaves at least (`COASTING_STRESS_FLOOR`, 14) and the urgency stripe's 65 and 85
 * (`ui/screens/Home.tsx`).
 *
 * Checked against the code on 2026-10-12: the live clock's step is `MAX_STEP_MS`, half an hour, where this said an
 * hour; Play charges the dials as the clock passes, an immediate tie and not a scheduled one; and a plan is never
 * missed for being elsewhere, since nothing in the game writes `currentLocationId` after a life begins. Until later that
 * day The Calendar said everything the world booked had Go and Stand Here alone at its stop, and a rehearsal with a
 * classmate offers Call It Off there now (`DueNow`, `ui/shell/TimeControls.tsx`). From then the entry says too that a
 * commitment the player stands at stays at the top of Home's Calendar panel (`nextCommitmentItem`, `world/calendar.ts`).
 * Moving Time On's list of a stop's answers left Call It Off out until later still. The Weather said then too that the
 * Look After Yourself menu read the weather as you chose and the workout as its hour ended, so a wet spell inside the
 * hour made it a workout indoors unforeseen; the menu's line has read it as the hour ends since that day too
 * (`lookAfterOptions`, `systems/life.ts`), and the entry says so. And Your Own Plans said a meal could still be had at
 * a commitment, where `lookAfterRefusal` lets Eat A Meal alone through and Order In waits with the rest.
 *
 * Read again on 2026-10-13, after that day’s review made a plan due in hospital missed, as the doctor, therapy and the
 * School already read a stay (`world/plans.ts`). Until then The Calendar said being awake and in its town was all a
 * commitment asked, and Go put you there whatever else held. A hospital bed keeps you from every commitment but Yale
 * Health’s assessment, which counts it as there (`systems/leave.ts`), and an injury that lays you up from all but the
 * doctor, therapy, orientation and a plan of your own (`present` in `systems/school.ts` and `systems/health.ts`, and a
 * classmate’s own check in `systems/coursework.ts` and `systems/classmates.ts`). Your Own Plans named the ways a plan
 * is missed but the hospital’s, which sends no notice even after Go.
 *
 * Read again later on 2026-10-13: What Needs You said a question with no date went quiet 90 days after it was raised.
 * The world’s rule for it was still there (`expireDecisions`), but no raiser reached it, since every one dates its row
 * (a year’s return, a US status’s end, an idle account’s handover to the state), so the sentence went. The rule went
 * on 2026-10-14, the owner’s decision, and with it the keeping of a closed question to a date still to come, which no
 * raiser reached either: What Needs You said the save forgot a closed question 180 days on “or on its date if that’s
 * later” until then.
 */

import { CHAPTER_BY_ID } from '../tutorial';
import { CITIES } from '../geography';
import { CLIMATE_NAMES, climateTypeFor, toFahrenheit } from '../climate';
import { THUNDER_DAYS, thunderDaysFor } from '../thunder';
import { YALE_DRAMA } from '../school';
import { FURTHEST_AHEAD_DAYS, LONGEST_MINUTES, LONGEST_TITLE, PLAN_LENGTHS, SHORTEST_MINUTES } from '../../world/plans';
import { COASTING_ENERGY_CEILING, FINE, TRAINING } from '../../systems/life';
import { FLU_TIMING } from '../../systems/seasons';
import { MAX_STEP_MS } from '../../core/realclock';
import { plural } from '../../core/text';
import type { GuideEntry } from './types';

/** A chapter's title, in quotes, as the guide names it. */
const chapter = (id: string): string => `“${CHAPTER_BY_ID[id]!.title}”`;

/** "a, b and c". */
const listed = (items: readonly string[]): string =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const HAVEN = CITIES.require(YALE_DRAMA.cityId);
const HAVEN_CLIMATE = climateTypeFor(HAVEN);
const HAVEN_THUNDER = thunderDaysFor(HAVEN.id, HAVEN_CLIMATE);
const HAVEN_THUNDER_FROM = THUNDER_DAYS[HAVEN.id]
  ? `as published: ${THUNDER_DAYS[HAVEN.id]!.source}`
  : `estimated for a ${CLIMATE_NAMES[HAVEN_CLIMATE].toLowerCase()} climate, where no count is published`;
const RUN_MORE = Math.round((TRAINING.run / TRAINING.indoors - 1) * 100);
const STEP_MINUTES = Math.round(MAX_STEP_MS / 60_000);
const LENGTHS = PLAN_LENGTHS.map((l) => l.label);
const RUN_COLD = `${FINE.runLowC}°C (${toFahrenheit(FINE.runLowC)}°F)`;
const RUN_HOT = `${FINE.highC}°C (${toFahrenheit(FINE.highC)}°F)`;

export const DAY: readonly GuideEntry[] = [
  {
    id: 'day.calendar',
    title: 'The Calendar',
    goal: 'day',
    covers: ['ui.calendar', 'ui.go', 'calendar.skip', 'look.entry'],
    synonyms: ['commitment', 'what’s coming', 'go button', 'skip it', 'stand here', 'clock stopped', 'wanted you', 'upcoming', 'due now'],
    questions: ['Why did the clock stop?', 'What happens if I don’t go?', 'What does Stand Here do?', 'Can I walk away from a class?', 'What’s coming up next?'],
    where: { route: '/home', label: 'Home, The Calendar Panel, Open Calendar' },
    available: `From ${chapter('calendar')}: the panel, Go, Skip It and the entries. Play, which moves the clock to a commitment, opens with ${chapter('clock')}.`,
    short: 'The Calendar panel at the top of Home shows what’s coming: the next thing you need to be at, how long until it, and up to five more after it.\n\nWhen the clock reaches a commitment, it stops and asks what to do: press Go to be there, or Stand Here to wait. A plan of your own also offers Skip It, and a rehearsal with a classmate Call It Off.',
    steps: [
      'Read the Calendar panel on Home: the next thing you need to be at, how long until it, its date and time, and under it up to five more things coming, such as a card statement or a birthday.',
      'Press an entry’s name or its time to open it under the panel: what it is, when, how long it runs, and what missing it costs.',
      'When the clock stops at something, a dialog named for it says the time and how long going takes. Press Go to be there.',
      'For a plan of your own, you can press Skip It instead, and for a rehearsal with a classmate, Call It Off. Stand Here closes the dialog and leaves the clock paused at the commitment.',
    ],
    needs: [
      `The panel, Go, Skip It and the entries open with ${chapter('calendar')}.`,
      `Only a plan you made offers Skip It. A rehearsal with a classmate offers Call It Off, which opens with ${chapter('school')}. Anything else, such as a class or an appointment, has only Go and Stand Here.`,
      'To count as there, you need to be awake, out of hospital and in the commitment’s town when it runs. Yale Health’s assessment is the only commitment you can be at from a hospital bed. An injury that lays you up keeps you from everything else except the doctor, therapy, orientation and your own plans. The game never moves you to another town, and a plan is in the town where you made it.',
    ],
    costs: [
      { label: 'Time', value: 'Reading the panel and opening entries doesn’t move the clock. Go spends the commitment’s own length, the figure its dialog gives.' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'What Needs You There', value: 'Anything booked for you to attend: classes, labs, rehearsal and performance calls, work-study shifts, orientation, the doctor, therapy, a partner’s rehearsal or lines with a classmate, and your own plans' },
      { label: 'Whether You’re There', value: 'When it runs, the game checks that you’re awake, out of hospital and in its town. In hospital, you were at nothing but Yale Health’s assessment. Asleep, you weren’t there' },
      { label: 'Where The Clock Was Headed', value: 'Go carries on the move the stop broke off, so a jump to the morning still ends in the morning' },
    ],
    now: [
      'Go: the commitment runs at once, with you there unless a hospital bed or an injury keeps you from it, and the clock moves through its hours, on to where it was headed if that’s later.',
      'Skip It: your plan is marked missed, a notice says you didn’t go, and the clock carries on to where it was headed.',
      'Call It Off, on a rehearsal with a classmate: it’s called off at short notice, which costs their trust and stays with them, and the clock stays paused where it stopped.',
      'Stand Here: the dialog closes and the clock stays paused at the commitment, which stays at the top of the Calendar panel, marked now. The commitment starts the next time the clock moves, and you’re there if you’re awake, in its town, and not kept away by a hospital bed or an injury.',
      'Any stop pauses the clock, so press Play again afterwards.',
    ],
    later: [
      'A commitment missed costs what its own kind costs: classes an unexcused absence, a rehearsal call one counted against you, a performance a grave breach, a work-study shift its pay. An entry, opened, says which. The faculty weigh attendance at the end of each term’s classes.',
      'A plan of your own you walked away from costs nothing beyond the plan.',
    ],
    interpret: [
      'The time above the next commitment’s name counts down from now: “in 2h 30m” is two and a half hours away.',
      'An entry, opened, says A Commitment or Happens Without You. The second, a card statement or the start of a term, runs whether you’re there or not.',
      'A stop dialog with neither Skip It nor Call It Off is one you can go to or wait at, but not walk away from.',
    ],
    unavailable: [
      `Go, Skip It and the entries show Locked until ${chapter('calendar')} is read; pressing one opens the guide there.`,
      'Skip It before the plan starts: “It hasn’t started yet. To drop it, open it on the Calendar and press Call It Off.”',
      'Skip It on something the world booked: “Only a plan you made yourself can be skipped.”',
      'Skip It on something already done or missed: “That’s already over: it was kept, missed or called off.”',
    ],
    mistakes: [
      'Stand Here and then Sleep sleeps through the commitment: it runs while you’re asleep and counts as missed.',
      'Pressing Play after Stand Here skips nothing. The commitment runs at once, and you’re there for it live, hour by hour.',
      'A commitment can’t be undone once it has run. Before it starts, you can call off a plan of your own on the Calendar screen.',
    ],
    next: [
      'Answer each stop as it comes: Go to be there, or Stand Here to wait.',
      'To put a plan of your own on the calendar, press Open Calendar on Home.',
    ],
    related: ['day.clock', 'day.advance', 'day.plans', 'day.needs', 'school.standing'],
    connections: [
      { to: 'day.clock', kind: 'prerequisite', why: 'A commitment only arrives as the clock moves, and Play opens with the chapter after this one.' },
      { to: 'day.advance', kind: 'immediate', why: 'Every move of the clock, Advance and Choose An Event among them, stops here at each commitment.' },
      { to: 'day.plans', kind: 'optional', why: 'The plans you put on the calendar yourself are the commitments Skip It works on.' },
      { to: 'school.standing', kind: 'evaluation', why: 'Classes, calls and shifts you went to or missed are counted at the end of each term’s classes.' },
      { to: 'school.sick', kind: 'optional', why: 'Calling in sick before a school day begins excuses the commitments you’d otherwise miss.' },
      { to: 'coursework.partners', kind: 'optional', why: 'A rehearsal with a classmate stops the clock like any commitment, and its dialog offers Call It Off, at a cost to their trust.' },
    ],
    example: {
      setup: 'Your first morning at Yale, at 7:30 AM, with Registration And Your Account at ten.',
      steps: [
        'Press Advance, then Tomorrow Morning.',
        'On The Way says the move passes one commitment; press Advance.',
        'The clock stops at 10:00 AM, and a dialog named Registration And Your Account says going takes 2 hours. Press Go.',
      ],
      result: `Registration runs with you there, and the clock carries on through the night to 7:00 AM, where the jump was headed. A night you didn’t choose was slept on the way, so energy stands at ${COASTING_ENERGY_CEILING}.`,
    },
  },
  {
    id: 'day.clock',
    title: 'The Clock: Play And Pause',
    goal: 'day',
    covers: ['ui.play', 'world.set_preferences'],
    synonyms: ['pause', 'play button', 'live clock', 'real time', 'time speed', 'stop the clock', 'resume time', 'pause time'],
    questions: ['How fast does time pass?', 'Does time pass while I’m away?', 'Does reading the guide cost time?', 'Why did the clock pause by itself?', 'What happens if I leave it running overnight?'],
    where: { route: '/home', label: 'The Top Bar’s Play Or Pause Button' },
    available: `From ${chapter('clock')}.`,
    short: 'Press Play at the top of the screen to start the clock, and Pause to stop it. While it runs, a minute passes in the game for every real minute: you get tired and hungry, what’s on your calendar happens, and the clock pauses itself at each commitment. It waits while the guide or this help is open.',
    steps: [
      'Press Play in the top bar. The button then reads Pause.',
      'Leave it running, and the day goes on around you a second at a time.',
      'Press Pause to stop it where it is.',
      'When it stops at a commitment, answer the dialog, then press Play again.',
    ],
    needs: [
      'A new life begins paused, guided or made with “I Know SLATE”, so the world waits until you’re ready.',
      `Play opens with ${chapter('clock')}. Pausing is never refused, and the world pauses itself at every stop.`,
    ],
    costs: [
      { label: 'Time', value: 'One world second for each real second, while it runs' },
      { label: 'Money', value: 'None for the button. What the hours bring is charged as they pass, the day’s groceries at midnight among it.' },
    ],
    reads: [
      { label: 'The Wall Clock', value: 'Your device’s own clock, so a slow browser tab loses no time' },
      { label: 'Time Owed', value: `Time that passed while the tab was hidden or the device slept, paid out in steps of up to ${plural(STEP_MINUTES, 'minute')}` },
      { label: 'What Needs You There', value: 'Anything on the calendar you need to be at: the live clock stops there and pauses' },
      { label: 'Open Help', value: 'While the guide or this help is open, the clock waits, and the minutes you spend reading are never counted' },
    ],
    now: [
      'Play: the clock runs from now, one to one. Pause: it stops where it is.',
      'The setting is saved with the life, so Continue brings it back running or paused as you left it.',
    ],
    later: [
      'Each second costs what a waking second costs: energy and food run down, sleep debt builds, and what’s scheduled runs as its moment comes.',
      `Past midnight with the clock running, your character stays up with you: the running clock moves at most ${plural(STEP_MINUTES, 'minute')} at a step, and a night is only slept for you on a move of more than an hour. Press Sleep, or jump more than an hour with Advance, to sleep the night.`,
      'Left on Play while the device sleeps, the world keeps counting. Back on screen it catches up through every minute, stopping at the first commitment.',
      'Save & Exit, or closing the tab, stops the world at that moment until you Continue.',
    ],
    interpret: [
      'The button says what pressing it does: Play while the clock is stopped, Pause while it runs.',
      'Reading Play when you didn’t pause means the clock stopped itself at a commitment, and the dialog for it names which.',
    ],
    unavailable: [
      `Play shows Locked until ${chapter('clock')} is read, and pressing it opens the guide at that chapter.`,
      'A life that has ended keeps its clock where it stopped, and Play moves it no further.',
    ],
    mistakes: [
      'Leaving Play running overnight keeps your character up all night: energy keeps falling and no night is slept. Press Sleep before bed, or Pause.',
      'A dialog you’re reading, such as the Sleep dialog or a plan’s form, doesn’t stop the clock. Only the guide and this help do, so press Pause first if you want time to think.',
      'Pausing doesn’t put a commitment off. It waits at its moment, however long the clock is stopped.',
    ],
    next: [
      'Press Play to start the day, and Pause when you step away.',
      'To skip hours you don’t want to wait through, press Advance.',
    ],
    related: ['day.calendar', 'day.advance', 'body.sleep', 'start.guide'],
    connections: [
      { to: 'day.calendar', kind: 'immediate', why: 'The live clock stops and pauses at each commitment on the calendar, and asks.' },
      { to: 'body.how', kind: 'immediate', why: 'Every second the clock runs is charged to your energy, food and the rest of your wellbeing as waking time, as it passes.' },
      { to: 'day.advance', kind: 'optional', why: 'For hours you don’t want to wait through, Advance jumps them.' },
      { to: 'body.sleep', kind: 'optional', why: 'A live clock keeps you up past midnight; Sleep is how the night gets slept.' },
    ],
    example: {
      setup: 'A class day at 8:30 AM, paused, with Classes at nine.',
      steps: ['Press Play.', 'Wait half an hour of real time.'],
      result: 'At 9:00 AM the clock stops by itself, the Classes dialog asks, and the button reads Play again. The half hour was charged to your energy and food on the way.',
    },
  },
  {
    id: 'day.advance',
    title: 'Moving Time On',
    goal: 'day',
    covers: ['ui.advance', 'ui.skip'],
    synonyms: ['advance', 'skip ahead', 'jump ahead', 'fast forward', 'next event', 'tomorrow morning', 'choose an event', 'skip to event', 'one week'],
    questions: ['How do I skip to tomorrow?', 'What happens to things on the way?', 'Do I sleep if I skip the night?', 'Why did my jump stop early?', 'Can I go back in time?'],
    where: { route: '/home', label: 'The Top Bar’s Advance Menu' },
    available: `From ${chapter('advance')}.`,
    short: 'Press Advance in the top bar to move the clock ahead when you don’t want to wait: an hour, to this evening or tomorrow morning, to the next event, a week on, or to an event you choose. Everything on the way happens in order, and the clock stops at each commitment to ask what you want to do. A jump of more than an hour through the night means your character sleeps that night on their own.',
    steps: [
      'Press Advance in the top bar and pick a line: One Hour, This Evening (6:00 PM), Tonight (10:00 PM), Tomorrow Morning (7:00 AM), Next Event, Next Monday (9:00 AM) or One Week. Each says where it lands.',
      'If the move passes a commitment, On The Way lists it first: press Advance to go on, or Cancel.',
      'Or pick Choose An Event… for the next fourteen things on the calendar. Skip To Event shows what each jump crosses; press Skip To and the event’s name.',
      'At each stop, answer the dialog: Go, Stand Here, Skip It on a plan of yours, or Call It Off on a rehearsal with a classmate.',
    ],
    needs: [
      `Advance and Choose An Event… open with ${chapter('advance')}.`,
      'Next Event is gray when there’s nothing on the calendar ahead.',
    ],
    costs: [
      { label: 'Time', value: 'The jump’s own length: an hour to a week from the menu, and as far as the event you choose' },
      { label: 'Money', value: 'None for the jump. What falls due on the way is paid as it falls due.' },
    ],
    reads: [
      { label: 'Where It Lands', value: 'The line’s time, on your town’s clock' },
      { label: 'What’s On The Way', value: 'Everything on the calendar between now and then, run in order at its moment' },
      { label: 'How Far You Jump', value: 'More than an hour through the night, and your character sleeps from midnight on their own. An hour or less, and they stay up with you' },
    ],
    now: [
      'The clock moves to the line’s time, or to the first commitment on the way, where it stops, pauses and asks.',
      'Everything due on the way runs in order: the day’s groceries at midnight, a card statement, a payday.',
    ],
    later: [
      `A night slept on its own is a poorer one than a night you choose. It never lifts energy above ${COASTING_ENERGY_CEILING} or brings stress under 14, it lasts as long as your stress and your sleep allow, and it clears less sleep debt.`,
      'A jump stopped by a commitment in the first hour of the night and carried on with Go is still the same jump, and the night comes as it would have.',
    ],
    interpret: [
      'The gray detail on each line is where it lands; on Next Event, it names the thing.',
      'In Skip To Event, “3 on the way” means the clock will stop three times before it gets there.',
      'The count of things on your calendar on the way includes ones that don’t need you, such as a card statement.',
    ],
    unavailable: [
      `Advance shows Locked until ${chapter('advance')} is read, and pressing it opens the guide there.`,
      'Time only runs forwards: no line moves the clock back.',
      'A life that has ended doesn’t move.',
    ],
    mistakes: [
      'After midnight, Tomorrow Morning means seven on the next date, a whole day on. For this morning, use Next Event or One Hour.',
      'One Hour at a time through the night keeps your character up: an hour is short enough to count as you being there. Sleep, or a longer jump, gives the night.',
      'A jump never runs over a commitment. If it stops early, that’s the thing you need to be at; go on from it with Go.',
    ],
    next: [
      'Before a long jump through the night, press Sleep instead: a night you choose puts back more.',
      'Answer each stop on the way as it comes.',
    ],
    related: ['day.clock', 'day.calendar', 'body.sleep'],
    connections: [
      { to: 'day.calendar', kind: 'immediate', why: 'Every jump stops at each commitment on the way, and the stop’s dialog asks whether you go.' },
      { to: 'body.sleep', kind: 'immediate', why: `A jump of more than an hour through the night sleeps your character from midnight, a night that stops at ${COASTING_ENERGY_CEILING} energy.` },
      { to: 'body.look-after', kind: 'scheduled', why: 'Each midnight crossed buys the day’s groceries and tops up nourishment and hygiene.' },
      { to: 'day.clock', kind: 'optional', why: 'The hours you’d rather live than skip, the live clock runs one to one.' },
    ],
    example: {
      setup: 'A weekday at 9:30 PM, with nothing booked until classes at nine the next morning.',
      steps: ['Press Advance, then Tomorrow Morning (7:00 AM).', 'The clock runs through the night with no stop.'],
      result: `At 7:00 AM your character has slept the night on their own from midnight, and stands at ${COASTING_ENERGY_CEILING} energy, or at what they had at midnight if that was more. A Sleep chosen at eleven would have put back more.`,
    },
  },
  {
    id: 'day.needs',
    title: 'What Needs You',
    goal: 'day',
    covers: ['ui.needs', 'world.mark_read', 'world.take_decision_action', 'world.dismiss_decision', 'look.notification', 'look.decision'],
    synonyms: ['notifications', 'notices', 'decisions', 'mark read', 'dismiss', 'inbox', 'all clear', 'badge', 'unread', 'go there'],
    questions: ['What is the number beside Home?', 'How do I clear my notices?', 'What happens if I dismiss a question?', 'Does a question go away on its own?', 'Why didn’t pressing an answer work?'],
    where: { route: '/home', label: 'Home, The What Needs You Panel' },
    available: `From ${chapter('needs')}.`,
    short: 'What Needs You, on Home, holds the questions you need to answer and the notices that tell you what happened. A question has its answers as buttons, such as File It or Keep The Account, and Dismiss. A notice says what happened: groceries you couldn’t pay for, a commitment you slept through, a welcome to the school. The number beside Home on the menu counts both.',
    steps: [
      'Open Home and read What Needs You: questions first, then notices.',
      'Press one of a question’s answers to act on it from What Needs You, without opening its screen. An answer does what the same action does on the question’s own screen: File It, on your tax return’s question, files the return just as File It on Papers does.',
      'Press Go There to open the screen a question or a notice is about.',
      'Press Dismiss to take a question off the list without answering it.',
      'Press Mark N Read, at the top of the panel, to mark every unread notice read at once.',
      'Press Show All N, under the notices, to see every unread one before you do: the panel draws the six most important first, and Show The Six Most Important goes back to them.',
      'Press a question’s or a notice’s title to open it: how urgent or important it is, when it closes, and where it sits in the list.',
    ],
    needs: [
      `The panel, Mark Read, the answers and Dismiss open with ${chapter('needs')}.`,
      'An answer does what the same button does on its own screen, so that screen’s chapter has to have been read too.',
    ],
    costs: [
      { label: 'Time', value: 'None: reading, dismissing and marking read move no clock' },
      { label: 'Money', value: 'None for the panel. An answer costs what the same button costs on its own screen, a fee or a payment.' },
    ],
    reads: [
      { label: 'A Question’s Urgency', value: 'Out of a hundred. Overdue ones come first, then the most urgent, then the soonest due.' },
      { label: 'A Notice’s Importance', value: 'Out of a hundred. The most important unread come first, then the newest.' },
      { label: 'An Answer’s Own Lock', value: 'An answer opens with the same guide chapter as the button on its own screen' },
    ],
    now: [
      'An answer does what its button does on its own screen. Done, the question closes; if it can’t be done, the question stays open and the reason shows.',
      'Dismiss closes the question unanswered. What it was about stands: a return still falls due, and can still be filed from its screen.',
      'Mark Read marks every unread notice read, and the count beside Home falls by that many.',
    ],
    later: [
      'Every question has a date. If you don’t answer it, it closes by itself within two days after that date.',
      'You can still open a closed question for 180 days after it closes, and SLATE keeps your latest 500 notices.',
      'The same thing raised again after you dismissed it comes back as a new question.',
      'A notice said again word for word while the last is still unread takes the new time, and isn’t added twice.',
    ],
    interpret: [
      'The stripe beside a question turns amber at an urgency of 65 and red at 85.',
      'Overdue, in red, means a question’s date has passed, and it closes within two days.',
      'All Clear means every question is answered and every notice read, nothing is owed past due, the bank and the card are in order, and the calendar has no clash for a month. No Questions Waiting lists what still weighs: money owed, an overdrawn account, a card near its limit or behind, a late return, a clash.',
      // Until 2026-10-17 this said the notices past the sixth moved up as those above them cleared, where Mark N Read
      // cleared them all at once and a notice past the sixth was on no screen (found by brief 13's interface playthroughs).
      'Home shows six questions, with “N more waiting.” for the rest, and the six most important unread notices, with “N more unread.” and Show All N for the rest. A question moves up as those above it clear. Mark N Read marks every unread notice read, shown or not.',
    ],
    unavailable: [
      `Before ${chapter('needs')} is read, the panel shows Locked, with Read About It.`,
      `An answer whose own chapter hasn’t been read says which chapter to read first: File It waits for ${chapter('papers')}.`,
      '“That question is already settled: it was answered, or its date passed.” A question answered once can’t be answered again.',
      'An answer that can’t be done keeps the question open, with the reason on screen: a payment the bank can’t cover, say.',
    ],
    mistakes: [
      'Dismiss doesn’t answer anything. Go to the question’s screen and do it there, before its date.',
      'Mark Read clears every unread notice at once, and Home lists only the unread, so read a notice before marking it.',
      'Opening a notice by its title doesn’t mark it read; only Mark Read does.',
    ],
    next: [
      'Answer or dismiss each question before its date.',
      'Press Go There to deal with a notice on its own screen, then Mark N Read.',
    ],
    related: ['day.calendar', 'taxes.return', 'start.find', 'documents.work'],
    connections: [
      { to: 'taxes.return', kind: 'immediate', why: 'Your return’s question carries File It, which files the year’s return as Papers would.' },
      { to: 'documents.work', kind: 'immediate', why: 'When your US status is ending, its question carries Apply For OPT while that can still be applied for.' },
      { to: 'bank.upkeep', kind: 'immediate', why: 'Before a long-untouched account goes to the state, the bank’s question carries Keep The Account.' },
      { to: 'body.sleep', kind: 'history', why: 'A Sleep that ran over commitments leaves a notice naming each one it slept through.' },
      { to: 'start.find', kind: 'optional', why: 'Go There takes you to the screen a notice or a question is about.' },
    ],
    example: {
      setup: 'February, for a student from abroad, who files a US return every year: Your 2026 Tax Return waiting under File It and Dismiss, and two unread notices.',
      steps: ['Press Dismiss on Your 2026 Tax Return.', 'Press Mark 2 Read.'],
      result: 'The question and both notices leave the panel, and the count beside Home falls by three. The return is still due on its date, and Papers still files it.',
    },
  },
  {
    id: 'day.plans',
    title: 'Your Own Plans',
    goal: 'day',
    covers: ['ui.open-calendar', 'calendar.schedule', 'calendar.cancel', 'look.plans', 'look.stretch'],
    synonyms: ['make a plan', 'schedule something', 'put something on it', 'call it off', 'cancel a plan', 'month view', 'clash', 'open calendar', 'next thirty days'],
    questions: ['How do I put something on my calendar?', 'How do I cancel a plan?', 'What happens if two things clash?', 'Does keeping a plan do anything?', 'How far ahead can I plan?'],
    where: { route: '/workspace/calendar', label: 'The Calendar Screen, From Open Calendar On Home' },
    available: `From ${chapter('plans')}. The Calendar screen itself opens with ${chapter('calendar')}.`,
    short: 'To put a plan of your own on the calendar, press Open Calendar on Home, pick a day and press Put Something On It. Give it a name, a start time on the half hour and a length from half an hour to all day. The clock stops at your plan like any commitment, and Call It Off takes it off before it starts. A plan costs no money and changes nothing in your wellbeing beyond the hours it takes.',
    steps: [
      'Press Open Calendar on Home’s Calendar panel, or C anywhere.',
      'Page the months with ‹ and ›, or Today, and press a day to open it under the month.',
      'Press Put Something On It. Fill in What Is It, When It Starts and How Long It Takes, then press Put It On.',
      'To take a plan off, press it on its day or in Next Thirty Days, then Call It Off.',
      'Press a plan’s name on Home to open it, and from there its hours and the rest of your plans.',
    ],
    needs: [
      'A day that hasn’t ended: a past day has no Put Something On It.',
      `A name, up to ${plural(LONGEST_TITLE, 'character')}; Put It On stays gray until it has one.`,
      'To call it off, a plan of yours whose start is still ahead.',
    ],
    costs: [
      { label: 'Time', value: 'Making or calling off a plan moves no clock. Going to one spends its length.' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Where You Are', value: 'A plan is in the town you’re in when you make it, and no move in the game takes you out of it' },
      { label: 'Its Hours', value: 'From its start to its end, checked for a clash against everything else you need to be at' },
      { label: 'Its Limits', value: `At least ${plural(SHORTEST_MINUTES, 'minute')}, at most ${plural(LONGEST_MINUTES / 60, 'hour')}, and no more than ${plural(FURTHEST_AHEAD_DAYS / 365, 'year')} ahead` },
      { label: 'The Lengths Offered', value: listed(LENGTHS) },
    ],
    now: [
      'Put It On: the plan joins the calendar at once, on its day and in Next Thirty Days, and on Home once it’s among the next few things coming. A clash with anything else you need to be at is marked Clash, and allowed.',
      'Call It Off: it leaves the calendar, and its hours are free again.',
    ],
    later: [
      'When the clock reaches it, the clock stops and asks: Go spends its length, and Skip It marks it missed, with a notice.',
      'Inside a Sleep you chose, it comes while you’re asleep and is missed, and the morning’s notice names it.',
      'In hospital when it comes, it’s missed even if you press Go, and no notice says so.',
      'Before it begins, it keeps its time free: you can’t start an hour of practice, or anything in Look After Yourself, that would run into it, and the reason says what’s coming and when.',
      'While you’re at it, Sleep and everything in Look After Yourself but Eat A Meal wait until it ends.',
    ],
    interpret: [
      'Clash marks two things you need to be at, at the same time; the red box at the top of the screen counts the clashes in the next month.',
      'You, beside an entry in Next Thirty Days, means you need to be there.',
      'A plan’s status reads Pending, Completed, Missed or Canceled.',
      'Your Own Plans counts what’s Waiting, Called Off and Gone By.',
      'A plan’s hours, opened, give the temperature across them and how much of them is dark or wet.',
    ],
    unavailable: [
      `Open Calendar, Put Something On It and Call It Off show Locked until ${chapter('plans')} is read.`,
      '“That time has already passed. Pick a time that’s still to come.” The clock passed the start while the form was open.',
      '“The calendar takes plans up to … years ahead. Pick an earlier day.” The day is past the furthest the calendar takes a plan.',
      '“It’s already started, so it can’t be called off now.” Call It Off after the plan’s start has come.',
    ],
    mistakes: [
      'The clock keeps running while the form is open, so on a live clock a start can pass before you press Put It On. Pause first.',
      'A plan made a few minutes ahead stops the clock almost at once.',
      'Call It Off before it begins leaves it Called Off and nothing more. Skip It once the clock stands at it counts it Gone By, with a notice.',
    ],
    next: ['When the clock reaches your plan, press Go, or Skip It if you aren’t going.'],
    related: ['day.calendar', 'day.weather', 'day.needs', 'body.sleep'],
    connections: [
      { to: 'day.calendar', kind: 'scheduled', why: 'A plan is a commitment: when the clock reaches it, the clock stops and asks Go or Skip It.' },
      { to: 'body.sleep', kind: 'immediate', why: 'The Sleep dialog lists a plan inside its hours as one you’d sleep through, and sleeping through misses it.' },
      { to: 'body.look-after', kind: 'immediate', why: 'A plan about to begin refuses anything in Look After Yourself that would run into it.' },
      { to: 'craft.practice', kind: 'immediate', why: 'An hour of practice that would run into a plan is refused until the plan has passed.' },
      { to: 'day.needs', kind: 'history', why: 'Skipping a plan, or sleeping through one, leaves a notice in What Needs You.' },
      { to: 'day.weather', kind: 'optional', why: 'A plan’s hours open onto the sky over each of them.' },
    ],
    example: {
      setup: `A free evening in ${HAVEN.name}, at 7:00 AM.`,
      steps: [
        'Press C, then today’s date.',
        'Press Put Something On It. What Is It: Dinner With Sam. When It Starts: 8:00 PM. How Long It Takes: Two Hours.',
        'Press Put It On.',
      ],
      result: `Dinner With Sam is on the calendar from 8:00 to 10:00 PM, in ${HAVEN.name}. At eight the clock stops and asks, and Go takes the clock to ten, or on to where it was headed if that’s later. Called off before eight, it counts as Called Off in Your Own Plans, and that’s all it leaves.`,
    },
  },
  {
    id: 'day.weather',
    title: 'The Weather',
    goal: 'day',
    covers: ['ui.weather', 'look.weather', 'look.forecastday', 'look.hours', 'look.skyhour', 'look.skyweek'],
    synonyms: ['forecast', 'temperature', 'rain', 'snow', 'thunderstorm', 'humidity', 'wind', 'hour by hour', 'week ahead', 'climate'],
    questions: ['What’s the weather doing?', 'Does the weather change anything?', 'Will it rain tomorrow?', 'Why is it the same every time I look?', 'When does the flu come round?'],
    where: { route: '/home', label: 'Home, The Weather Panel' },
    available: `From ${chapter('weather')}.`,
    short: 'The Weather panel on Home shows the weather in your town: now, today’s high and low, humidity and wind, and the next five days. Press any figure for more: a day opens into its hours, and the sky into the week ahead. The weather changes one thing in the game: whether a workout is a run. It comes from your town’s climate, the season and a little chance, and it’s the same every time you look.',
    steps: [
      'Read the Weather panel on Home: the temperature now and the condition, the high and the low, humidity, wind and the climate, and five days after today.',
      'Press the temperature or the condition to open the sky: the wind, the humidity, how the day sits against the date’s normal, and What It’s Usually Like.',
      'From the sky, press The Rest Of Today for each hour left to midnight, Tomorrow, or The Week Ahead.',
      'Press a day in the strip for its high, low and wind, then Hour By Hour, then any hour.',
    ],
    needs: [`The panel and its figures open with ${chapter('weather')}.`],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Your Town', value: 'Its climate, its latitude and the date’s usual high, low, chance of a wet day and cloud' },
      { label: 'The Day’s Luck', value: 'A random draw, fixed for each town and day in your save: its warmth blended with the two days before it and its wet with the day before, so a cold snap lasts and a wet spell lingers' },
      { label: `Thunder In ${HAVEN.name}`, value: `About ${plural(HAVEN_THUNDER, 'day')} a year, ${HAVEN_THUNDER_FROM}`, estimate: true },
    ],
    now: ['Opening the sky, a day or an hour changes nothing: the weather is calculated as you look, and never stored.'],
    later: [
      `Work Out checks the weather as its hour ends. Dry, at ${RUN_COLD} or warmer and feeling no hotter than ${RUN_HOT} with the humidity, it was a run, which builds ${RUN_MORE}% more fitness than a workout indoors.`,
      `The flu comes in the weeks your town’s climate brings it: its coldest weeks where the coldest month averages ${FLU_TIMING.coldDryBelowC}°C or less, its wettest where that month averages ${FLU_TIMING.humidRainyFromC}°C or more, and a blend between. That goes by the climate’s usual year, never the day on the panel.`,
    ],
    interpret: [
      'Against Usual is how far the day sits from the date’s normal, in the degrees on show.',
      'The high comes around 3 PM and the low around 3 AM. A wet day rains for a spell of three to nine hours and is overcast either side of it.',
      'Fahrenheit and miles an hour in the United States and the few other countries that read Fahrenheit; Celsius and kilometers an hour elsewhere.',
      'The weather is estimated from a climate model of the town, so a day ahead is as fixed as today: what it shows for Thursday is what Thursday brings.',
    ],
    unavailable: [`The panel and its figures stay plain until ${chapter('weather')} is read.`],
    mistakes: [
      'Expecting rain to call off a class or a shift: it changes neither. The one thing it changes is whether a workout is a run.',
      'Judging a run by the sky now: a workout checks the weather as its hour ends, and so does its line in Look After Yourself, which tells you before you press it whether it’ll be a run.',
    ],
    next: ['For a run, choose Work Out in Look After Yourself on a dry, mild day: its line says whether it’ll be a run.'],
    related: ['body.look-after', 'start.home', 'day.plans', 'school.sick'],
    connections: [
      { to: 'body.look-after', kind: 'evaluation', why: 'Work Out checks the weather as it ends: dry and mild, it was a run, building more fitness and burning more.' },
      { to: 'start.home', kind: 'optional', why: 'The weather is the same town’s, beside its time, season and daylight on Home.' },
      { to: 'school.sick', kind: 'optional', why: 'The flu comes in your town’s climate’s weeks for it, and a day with the flu is one to call in sick.' },
    ],
    example: {
      setup: `A mild, dry morning in ${HAVEN.name}, with an hour free for Work Out.`,
      steps: [
        'Press the temperature on Home to open the sky, then The Rest Of Today.',
        'Check the next hour is dry, and not freezing or sweltering.',
        'Open Look After Yourself and press Work Out.',
      ],
      result: `The hour was a run: ${RUN_MORE}% more fitness than the same hour indoors, for more calories burned and a run’s higher chance of an injury. The Work Out line had said so before you pressed it, opening “A run in fine weather”.`,
    },
  },
];
