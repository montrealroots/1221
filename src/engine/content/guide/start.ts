/**
 * SLATE — the guide's reference: getting started (from 2026-10-12; `content/guide/types.ts`).
 */

import { CHAPTERS, CHAPTER_BY_ID } from '../tutorial';
import type { GuideEntry } from './types';

export const START: readonly GuideEntry[] = [
  {
    id: 'start.home',
    title: 'Home And Where You Are',
    goal: 'start',
    covers: ['ui.where', 'look.day', 'look.place', 'look.region', 'look.country', 'look.currency', 'look.season', 'look.daylight'],
    synonyms: ['home screen', 'location', 'town', 'city', 'time zone', 'local time', 'season', 'sunrise', 'sunset', 'currency', 'country'],
    questions: ['Where am I?', 'What time is it here?', 'What do the underlined words do?', 'What currency do I use?'],
    where: { route: '/home', label: 'Home, The Where You Are Panel' },
    available: `From the guide’s first chapter, “${CHAPTERS[0]!.title}”.`,
    short: 'Home is your day at a glance. The line under the greeting gives the time, your town, its time zone, the season and the sky; Where You Are names your town, its region and country, with the local time and the daylight. Every underlined word opens into what it names, with more to press inside.',
    steps: [
      'Open Home: the SLATE mark at top left, the Home line on the menu, or the H key.',
      'Read Where You Are: the town, the region and the country, then Local Time and Daylight. The season is in the line under the greeting.',
      'Press an underlined word to open it under its line. Press a word inside it to go deeper; Close, or the word again, folds it.',
    ],
    needs: ['Home is always there, from the first moment of a life.'],
    costs: [{ label: 'Time', value: 'None: reading Home and opening words moves no clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'The Town And Its Zone', value: 'The place your life is in, from the world’s gazetteer, with its time zone and daylight saving' },
      { label: 'The Day', value: 'The clock’s own moment, in the town’s local time' },
      { label: 'The Season And The Daylight', value: 'Calculated from the town’s latitude and the date' },
    ],
    now: ['The world stays as it was: Home and its words show it, they don’t move it.'],
    later: ['As the clock moves the time, the season and the daylight move with it.'],
    interpret: [
      // Until 2026-10-13 this said the line told home from away, and how far from home time: nothing has put a player
      // away from home since the scope of 2026-10-09, and Home’s away line went that day (`homeCityOf`).
      'The line under the town says Home, and what kind of place it is: the town you’re in is the one you live in.',
      'A word that isn’t underlined yet opens once its chapter of the guide has been read.',
    ],
    unavailable: ['A word stays plain text until the guide’s chapter that opens it has been read.'],
    mistakes: ['Pressing a word opens it in place: nothing on the screen behind it is lost, so there’s nothing to undo.'],
    next: [
      'Read the Calendar panel on Home for what’s coming, and the Weather panel for the sky.',
      'If a word or a panel is still Locked, read the next chapter in the guide.',
    ],
    related: ['start.guide', 'start.find', 'day.calendar', 'body.how'],
    connections: [
      { to: 'start.guide', kind: 'prerequisite', why: 'Each underlined word opens once the guide’s chapter for it has been read.' },
      { to: 'day.weather', kind: 'optional', why: 'The weather beside it shows the same town, hour by hour.' },
      { to: 'day.clock', kind: 'immediate', why: 'The local time shown is the clock’s moment, so it moves as the clock does.' },
    ],
    example: {
      setup: 'A student new at Yale, in New Haven, on an August evening.',
      steps: ['Open Home.', 'Press New Haven in Where You Are.', 'Inside it, press Connecticut, then United States.'],
      result: 'The town opens under the line with its facts, Connecticut opens inside it, and the country inside that, each with more to press; nothing in the save has changed.',
    },
  },
  {
    id: 'start.guide',
    title: 'The Guide And This Help',
    goal: 'start',
    covers: ['tutorial.read'],
    synonyms: ['tutorial', 'help', 'how this works', 'chapters', 'onboarding', 'locked', 'manual', 'reference'],
    questions: ['Why is a button locked?', 'How do I open the rest of the game?', 'Can I skip the guide?', 'Does reading help cost time?', 'How do I find out what something does?'],
    where: { route: '/home', label: 'Guide, How This Works, And ? Or / On Any Screen' },
    available: 'Always.',
    short: `Two things share one button. The guide’s ${CHAPTERS.length} chapters teach the game in order: each opens a part of it, and a part that isn’t open yet shows as Locked. The reference is everything else: an entry for each feature, opened by How This Works beside it, and searchable, with what it does, what it changes now and later, and what it affects. Reading either moves no clock, and changes nothing in your save but which chapters you’ve read.`,
    steps: [
      'To read the next chapter, press Guide in the top bar, or Read on the strip under it, and I’ve Read It at its end. What it opened is listed.',
      'For a part of the game you’re looking at, press How This Works on its panel.',
      'To look something up, press ? for the contents by what you’re trying to do, or / to search.',
      'Follow a link inside an entry to another; Back returns along the trail, and Close returns you to the screen exactly as you left it.',
    ],
    needs: ['The guide is always there. A life made with “I Know SLATE” at its creation has every part open from the start, and the chapters are there to read in any order.'],
    costs: [{ label: 'Time', value: 'None: the clock holds while a chapter or an entry is open' }, { label: 'Money', value: 'None' }],
    reads: [{ label: 'Which Chapters You’ve Read', value: 'The one thing the guide keeps in your save' }],
    now: ['Reading a chapter opens what it names: its buttons, its panels and its underlined words.', 'Opening the reference changes nothing.'],
    later: ['What a chapter opens stays open for the rest of the life.'],
    interpret: [
      'Locked on a button means its chapter hasn’t been read; pressing it opens the guide at that chapter.',
      'In an entry, an estimate is marked as one; every other figure is the rule the game runs on.',
    ],
    unavailable: ['A chapter can only be marked read when it’s the next one; any chapter can be opened and read at any time.'],
    mistakes: [
      'Closing the guide doesn’t lose your place: it opens again at the next unread chapter.',
      'Show Me Where in an entry takes you to the feature’s screen and tab; the reference’s trail is kept, and Back To Help returns to it.',
    ],
    next: [
      'Read the next chapter, then try what it opened.',
      'On any panel, press How This Works for its entry.',
    ],
    related: ['start.home', 'start.find'],
    connections: [
      { to: 'start.home', kind: 'immediate', why: 'Reading a chapter opens Home’s panels and the underlined words it names.' },
      { to: 'day.calendar', kind: 'immediate', why: '“What’s Coming” opens the calendar and the dialog that asks when a commitment comes round.' },
      { to: 'day.clock', kind: 'prerequisite', why: 'The clock starts paused on a guided life, and “The Clock” opens Play.' },
    ],
    // The menu's own button, Locked while its chapter is unread (`ui/shell/TimeControls.tsx`). Until 2026-10-12 this
    // pressed Rest in it, which the menu doesn't hold (`LOOKING_AFTER`, `systems/life.ts`).
    example: {
      setup: 'A guided life, two chapters read, pressing Look After Yourself.',
      steps: ['The button says Locked.', `Press it: the guide opens at “${CHAPTER_BY_ID['looking-after']!.title}”, and says “${CHAPTERS[2]!.title}” comes first.`, 'Read the chapters in order to it and press I’ve Read It.'],
      result: 'Look After Yourself opens. The clock didn’t move while the guide was open.',
    },
  },
  {
    id: 'start.find',
    title: 'Finding Your Way',
    goal: 'start',
    covers: [],
    synonyms: ['navigation', 'menu', 'rail', 'breadcrumbs', 'back', 'keyboard', 'shortcuts', 'link', 'address', 'search'],
    questions: ['How do I get back?', 'What are the keyboard shortcuts?', 'Can I link to a screen?', 'Where is the menu on a phone?'],
    where: { route: '/home', label: 'The Menu And The Breadcrumb' },
    available: 'Always; a destination joins the menu once its chapter is read.',
    short: 'The menu down the left lists every place the guide has opened, with Home at the top wearing the count of what’s waiting on you. Below a laptop’s width it folds behind Menu. The breadcrumbs above a screen go back along where you’ve been, and the browser’s Back and Forward move between screens. Every screen has an address, so a reload or a link opens it.',
    steps: [
      'Press a place on the menu to go there, or a breadcrumb to go back to it.',
      'Keys, anywhere but a text box: H for Home, C for the calendar, P for the Player Profile, ? for the guide’s contents, / to search it. None of them act while a dialog is open.',
      'Escape closes the dialog on top, and the menu drawer on a phone.',
    ],
    needs: ['A screen whose chapter hasn’t been read opens as Locked, with the chapter that opens it.'],
    costs: [{ label: 'Time', value: 'None' }, { label: 'Money', value: 'None' }],
    reads: [{ label: 'The Chapters Read', value: 'Which places the menu lists' }],
    now: ['Moving between screens changes nothing in the world. A screen keeps its tab while you’re elsewhere.'],
    later: [],
    interpret: ['The number beside Home is the notices and questions waiting in What Needs You.'],
    unavailable: ['A place stays off the menu until its chapter is read.'],
    mistakes: ['Leaving a screen with a form half filled in loses what was typed in it; opening help over it doesn’t.'],
    next: ['Press ? anywhere for the guide’s contents, grouped by what you want to do.'],
    related: ['start.guide', 'start.home', 'day.needs'],
    connections: [
      { to: 'start.guide', kind: 'prerequisite', why: 'A place joins the menu once its chapter is read.' },
      { to: 'day.needs', kind: 'optional', why: 'Go There on a notice takes you to its screen and tab.' },
    ],
    example: {
      setup: 'On the School screen’s Coursework tab, then Home.',
      steps: ['Press H.', 'Press the School breadcrumb.'],
      result: 'School opens on Coursework, the tab it was left on.',
    },
  },
];
