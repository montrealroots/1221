/**
 * SLATE — the guide's reference: the Actor Showcase, DRAM 793b, in the last term (from 2026-10-21, the owner's brief 19;
 * `systems/proshowcase.ts`, `content/guide/types.ts`).
 *
 * Its figures are the rule's own, imported: the two scenes, the four offered, the rehearsal calls' hours, the fourth
 * week. The dates are said by their pattern, never a year's, since every year's are worked out from its calendar. The
 * Bulletin's words are its own (`docs/research/career-2026-10-20/yale.md`, B27 pp.21, 26 and 33); what the game makes of
 * them is said as the game's.
 */

import { CHAPTER_FOR } from '../tutorial';
import { SHOWCASE } from '../../systems/proshowcase';
import type { GuideEntry } from './types';

const CHAPTER = CHAPTER_FOR['school.choose_showcase']!.title;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n: number): string => WORDS[n] ?? String(n);
const hours = (minutes: number): string => `${word(minutes / 60)} hours`;
/** The week the Incompletes are read in, as prose says it: the fourth. */
const WEEK = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][SHOWCASE.checkWeek - 1] ?? `${SHOWCASE.checkWeek}th`;
const [NY1, NY2] = SHOWCASE.days;

export const SHOWCASE_GUIDE: readonly GuideEntry[] = [
  {
    id: 'coursework.showcase',
    title: 'The Actor Showcase',
    goal: 'coursework',
    covers: ['school.choose_showcase'],
    synonyms: ['showcase', 'DRAM 793b', 'showcase scenes', 'New York showcase', 'Los Angeles showcase', 'choose my scenes', 'last term'],
    questions: ['When is the showcase?', 'How do I choose my showcase scenes?', 'Can an Incomplete keep me out of the showcase?', 'What happens if I miss a showcase day?'],
    where: { route: '/workspace/school', tab: 'coursework', label: 'School, Coursework, The Actor Showcase' },
    available: `In your last spring term, from its first day, once you’ve read the guide’s chapter “${CHAPTER}”.`,
    short: `Your last term ends with the Actor Showcase (DRAM 793b): ${word(SHOWCASE.scenes)} scenes you choose, played in New York on the Monday and Tuesday after classes end, and in Los Angeles the Tuesday after. The Bulletin says the showcase is presented to agents, managers and casting directors.\n\nYou choose your scenes from the faculty’s options, prepare them as you prepare any piece, and play them at each showcase day. Each day judges both scenes, and the record keeps how each one went.`,
    steps: [
      'In your last term, open School, then the Coursework tab.',
      'Under The Actor Showcase, read the faculty’s note on each scene: its genre, its forecast fully prepared, and any part you’ve played in it before.',
      `Tick ${word(SHOWCASE.scenes)} scenes, each in one of its parts, and press Choose These Scenes.`,
      'Prepare each on its card below, Actor Showcase: Your Showcase Scene, with its steps, its Table Work and your partner.',
      'Go to the rehearsal calls in the last two weeks of classes, and to each showcase day when the clock stops at it.',
    ],
    needs: [
      'To be in your last spring term, enrolled in it: not on leave, and not in an additional term.',
      `Every Incomplete made up by the end of the term’s ${WEEK} week, its Friday at five. One still open then keeps you out.`,
      `${word(SHOWCASE.scenes).replace(/^\w/, (c) => c.toUpperCase())} different scenes from the options, each in one of its parts.`,
    ],
    costs: [
      { label: 'Time', value: `None to choose. Each rehearsal call takes ${hours(SHOWCASE.rehearsal.minutes)}; New York’s days ${hours(NY1!.minutes)} and ${hours(NY2!.minutes)}, and Los Angeles’s a day and a night, each with its trip`, estimate: true },
      { label: 'Money', value: 'None: the School takes you' },
    ],
    reads: [
      { label: 'The Faculty’s Options', value: `${word(SHOWCASE.offered).replace(/^\w/, (c) => c.toUpperCase())} scenes, each in either part, ranked by how each would come out for you fully prepared, then by the genres you know and the scenes you’ve done well with`, estimate: true },
      { label: 'Each Showcase Day', value: 'Each scene’s preparation, how you are that day, and what the scene asks' },
      { label: 'Taking Part', value: `Your course records: any course still Incomplete at the end of the term’s ${WEEK} week` },
    ],
    now: ['Your two scenes become pieces of Actor Showcase’s coursework, due in New York, each with a partner from your class.'],
    later: [
      `At the end of the term’s ${WEEK} week, the School reads your Incompletes. With none, you’re in, and the faculty choose two scenes for you if you haven’t.`,
      'At the first showcase day, each scene is shown and gets the faculty’s note. It’s played again the next day, and in Los Angeles it’s shown again with the note taken.',
      'Actor Showcase is settled after Los Angeles, not at the term review. A course with half its pieces not shown isn’t passed, and the degree needs every course passed.',
    ],
    interpret: [
      'A forecast is what a scene would come to fully prepared on a good day. It’s a forecast, not a result.',
      'Each day’s band is how that scene came out that day: Unready, Working, Strong or Exceptional, with its score of 100.',
      'A showcase day missed counts as a missed call and an unexcused absence from Actor Showcase, and your scenes aren’t seen there. Ill, you’re excused.',
    ],
    unavailable: [
      'The Actor Showcase is in your last spring term.',
      `You can’t take part in the Actor Showcase while a course you were given an Incomplete in was still incomplete at the end of the term’s ${WEEK} week.`,
      'Choose two scenes, and two different ones.',
      'Your scenes are already chosen.',
    ],
    mistakes: [
      'Choosing without reading the notes. A scene whose forecast is low for you stays low, however well you prepare it.',
      `Leaving an Incomplete for later. Make it up by the end of the term’s ${WEEK} week, or you’re out of the showcase.`,
    ],
    next: ['Prepare both scenes on their cards, and answer your partners when they ask to rehearse.'],
    related: ['coursework.prepare', 'coursework.feedback', 'school.repeat', 'career.overview'],
    connections: [
      { to: 'coursework.prepare', kind: 'immediate', why: 'Your two scenes become pieces of coursework, each prepared with its own steps.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'Each scene’s note comes at its first showcase day, and Los Angeles shows whether you took it.' },
      { to: 'school.repeat', kind: 'prerequisite', why: `An Incomplete still open at the end of the term’s ${WEEK} week keeps you out of the showcase.` },
      { to: 'career.overview', kind: 'history', why: 'How each scene went at each showcase day stays on your professional record.' },
    ],
    example: {
      setup: 'Ada Cole is in her last spring term, with no Incomplete outstanding.',
      steps: ['Under The Actor Showcase, tick Nina in The Seagull and Gwendolen in The Importance of Being Earnest.', 'Press Choose These Scenes.', 'Prepare both on their cards, and go to the rehearsal calls and each showcase day.'],
      result: 'Both scenes are judged in New York on the Monday and Tuesday after classes end and in Los Angeles the Tuesday after, and the showcase’s record keeps each day’s band.',
    },
  },
];
