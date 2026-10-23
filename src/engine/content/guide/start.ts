/**
 * SLATE — the guide's reference: getting started (from 2026-10-12; `content/guide/types.ts`).
 *
 * Until 2026-10-20 (brief 17) Finding Your Way called the ? key's page "the guide's contents": it's How This Works'
 * contents, as the first chapter and `docs/GLOSSARY.md` name it, and the guide is the seventeen chapters.
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
    where: { route: '/home', label: 'Home, The Line Under The Greeting' },
    available: `From the guide’s first chapter, “${CHAPTERS[0]!.title}”.`,
    short: 'Home is your day at a glance. The line under the greeting shows the time, your town and its region, its time zone, the season and the daylight, and the weather is beside it. Press any underlined word to see more about it: your town opens into its country, its money and its people.',
    steps: [
      'Open Home: press the SLATE mark at the top left, Home on the menu, or the H key.',
      'Read the line under the greeting: the time, the town and its region, the time zone, the season, and Daylight, today’s sunrise and sunset. Press the town for its country, its money and how many people live there.',
      'Press an underlined word to open it under its line, and a word inside it to go deeper. Press Close, or the word again, to fold it away.',
    ],
    needs: ['Home is there from your first moment in the game.'],
    costs: [{ label: 'Time', value: 'None: reading Home and opening words doesn’t move the clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'The Town And Its Zone', value: 'Where you live, with its time zone and daylight saving time' },
      { label: 'The Day', value: 'The game’s clock, in your town’s local time' },
      { label: 'The Season And The Daylight', value: 'Calculated from the town’s latitude and the date' },
    ],
    now: ['Home only shows the world. Reading it changes nothing.'],
    later: ['As the clock moves the time, the season and the daylight move with it.'],
    interpret: [
      // Until 2026-10-13 this said the line told home from away, and how far from home time: nothing has put a player
      // away from home since the scope of 2026-10-09, and Home’s away line went that day (`homeCityOf`).
      'Your town, pressed, says it’s your home, and how many people live there.',
      'Daylight gives today’s sunrise and sunset, and how many hours of daylight that makes.',
    ],
    unavailable: ['Some words only become links once you’ve read the guide chapter that covers them.'],
    mistakes: ['Pressing a word opens it in place: nothing on the screen behind it is lost, so there’s nothing to undo.'],
    next: [
      'Read Up Next on Home for what’s coming, and the weather beside the greeting for the sky.',
      'If a word or a panel is still Locked, read the next chapter in the guide.',
    ],
    related: ['start.guide', 'start.find', 'day.calendar', 'body.how'],
    connections: [
      { to: 'start.guide', kind: 'prerequisite', why: 'A word becomes a link once you’ve read the guide chapter that covers it.' },
      { to: 'day.weather', kind: 'optional', why: 'The weather beside it shows the same town, hour by hour.' },
      { to: 'day.clock', kind: 'immediate', why: 'The local time is the game’s clock, so it moves when the clock does.' },
    ],
    example: {
      setup: 'A student new at Yale, in New Haven, on an August evening.',
      steps: ['Open Home.', 'Press New Haven, in the line under the greeting.', 'Inside it, press Connecticut, then United States.'],
      result: 'New Haven opens under its line with its facts, Connecticut opens inside it, and United States inside that, each with more to press. Your save is just as it was.',
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
    short: `SLATE has two kinds of help. The guide’s ${CHAPTERS.length} chapters teach the game in order, and each one opens a part of it: a part you haven’t opened yet shows as Locked. How This Works has an entry for every feature, saying what it does, what it changes now and later, and what it affects. Reading either doesn’t move the clock, and the only thing it changes in your save is which chapters you’ve read.`,
    steps: [
      'To read the next chapter, press Guide in the top bar, or Read on the strip under it. Press I’ve Read It at the end, and the chapter lists what it opened.',
      'For a part of the game you’re looking at, press How This Works on its panel.',
      'To look something up, press ? for the contents by what you’re trying to do, or / to search.',
      'Press a link in an entry to open another. Back goes back the way you came, and Close returns you to the screen exactly as you left it.',
    ],
    needs: ['The guide is always there. If you chose “I Know SLATE” when you made your character, everything is open from the start, and you can read the chapters in any order.'],
    costs: [{ label: 'Time', value: 'None: the clock waits while a chapter or an entry is open' }, { label: 'Money', value: 'None' }],
    reads: [{ label: 'Which Chapters You’ve Read', value: 'The one thing the guide keeps in your save' }],
    now: ['Reading a chapter opens what it names: its buttons, its panels and its underlined words.', 'Opening How This Works changes nothing.'],
    later: ['What a chapter opens stays open from then on.'],
    interpret: [
      'Locked on a button means you haven’t read its chapter yet. Press it to open the guide at that chapter.',
      'In an entry, an estimate says it’s estimated. Every other figure is the rule the game uses.',
    ],
    unavailable: ['You can open and read any chapter at any time, but I’ve Read It only works on the next one.'],
    mistakes: [
      'Closing the guide doesn’t lose your place: it opens again at the next unread chapter.',
      'Show Me Where takes you to the feature’s screen and tab, and Back To Help brings you back to the help where you were.',
    ],
    next: [
      'Read the next chapter, then try what it opened.',
      'On any panel, press How This Works for its entry.',
    ],
    related: ['start.home', 'start.find'],
    connections: [
      { to: 'start.home', kind: 'immediate', why: 'Reading a chapter opens Home’s panels and the underlined words it names.' },
      { to: 'day.calendar', kind: 'immediate', why: '“What’s Coming” opens the calendar, and the dialog that asks what to do when a commitment comes up.' },
      { to: 'day.clock', kind: 'prerequisite', why: 'With the guide, the clock starts paused, and reading “The Clock” opens Play.' },
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
    available: 'Always. A place joins the menu once you’ve read its chapter.',
    short: 'The menu down the left lists every place the guide has opened, with Home at the top and the number of things waiting for you beside it. On a screen narrower than a laptop’s, the menu folds away behind Menu.\n\nThe breadcrumbs above a screen take you back along where you’ve been, and the browser’s Back and Forward buttons work too. Every screen has its own address, so a reload or a link opens it.',
    steps: [
      'Press a place on the menu to go there, or a breadcrumb to go back to it.',
      'Keys, anywhere but a text box: H for Home, C for the calendar, P for the Player Profile, ? for How This Works’ contents, / to search it. None of them act while a dialog is open.',
      'Escape closes the dialog on top, and the menu drawer on a phone.',
    ],
    needs: ['A screen whose chapter you haven’t read opens as Locked, and names the chapter to read.'],
    costs: [{ label: 'Time', value: 'None' }, { label: 'Money', value: 'None' }],
    reads: [{ label: 'The Chapters Read', value: 'Which places the menu lists' }],
    now: ['Moving between screens changes nothing in the world. A screen keeps its tab while you’re elsewhere.'],
    later: [],
    interpret: ['The number beside Home is the questions waiting in What Needs You. Recent Updates, on Home, says how many notices you haven’t read.'],
    unavailable: ['A place isn’t on the menu until you’ve read its chapter.'],
    mistakes: ['Leaving a screen with a form half filled in loses what was typed in it; opening help over it doesn’t.'],
    next: ['Press ? anywhere for How This Works’ contents, grouped by what you want to do.'],
    related: ['start.guide', 'start.home', 'day.needs'],
    connections: [
      { to: 'start.guide', kind: 'prerequisite', why: 'A place joins the menu once you’ve read its chapter.' },
      // Until 2026-10-21 (the owner's brief 20, C3) this said Go There took you to a notice's screen and tab, though
      // most notices name only their screen (`route`), which opens at the tab it was left on: a notice names its tab
      // only where its route carries one (`?tab=`, read by `moved` in `app/game-context.tsx`), as the pay's do.
      { to: 'day.needs', kind: 'optional', why: 'Go There on a notice takes you to its screen, and to its tab where the notice names one.' },
    ],
    // Until 2026-10-20 (brief 17, section 9) this pressed H and then a School breadcrumb on Home, which Home never shows:
    // going to a screen already in the breadcrumbs cuts them back to it, and Home is always the first, so on Home there
    // are none (`moved`, `app/game-context.tsx`). Followed on the built app that day
    // (`docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs`), and held by `tests/help-mechanics.test.ts`.
    example: {
      setup: 'On the School screen’s Coursework tab.',
      steps: ['Press P for the Player Profile.', 'Press School in the breadcrumbs above it.'],
      result: 'School opens on Coursework, the tab it was left on. H instead goes to Home, the first breadcrumb, and the breadcrumbs start again from there.',
    },
  },
];
