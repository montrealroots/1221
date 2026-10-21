/**
 * SLATE — the guide's reference: the Career screen and the portfolio (from 2026-10-20, the owner's brief 19;
 * `content/guide/types.ts`).
 *
 * Every figure is the rule's own, imported from `systems/pro.ts`: a headshot session's time, price, hours and the age at
 * which headshots read as out of date; a résumé's hour; a reel's two hours, price and four pieces; the level a technique
 * goes on a résumé from; and the versions kept. Each of those is the game's estimate, and the entries say so. The
 * Bulletin's sentences (Equity at the degree, the filmed monologues posted at the end of the final term) are its own
 * (`docs/research/career-2026-10-20/yale.md`, B27 pp.24 and 33).
 */

import { CHAPTER_FOR } from '../tutorial';
import { SKILL_WORDS } from '../school';
import { formatMoney } from '../../core/money';
import { HEADSHOTS, NAME_MOST, REEL, RESUME, SESSION_HOURS, SKILL_LISTED_AT, SPECIAL_SKILLS, clockWords } from '../../systems/pro';
import type { GuideEntry } from './types';

const CAREER = '/workspace/career';
/** A Career section's id: a parameter typed by its literals would read to `tools/title-case.mjs` as a label. */
type Section = 'overview' | 'portfolio';
const on = (section: Section, label: string) => ({ route: CAREER, tab: section, label });

const CHAPTER = CHAPTER_FOR['ui.career']!.title;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const word = (n: number): string => WORDS[n] ?? String(n);
const hours = (minutes: number): string => (minutes === 60 ? 'an hour' : `${word(minutes / 60)} hours`);
const usd = (cents: number): string => formatMoney(cents, 'USD');
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const SKILLS = andList(SPECIAL_SKILLS.map((s) => SKILL_WORDS[s]));

export const CAREER_GUIDE: readonly GuideEntry[] = [
  {
    id: 'career.overview',
    title: 'The Career Screen',
    goal: 'career',
    covers: ['ui.career'],
    synonyms: ['career', 'professional actor', 'where I stand', 'portfolio missing', 'what my portfolio needs'],
    questions: ['Where do I stand as a professional?', 'What is my portfolio missing?', 'What should I do next for my career?'],
    where: on('overview', 'Career, Overview'),
    available: `From the guide’s chapter “${CHAPTER}”. Career is in the menu under Your Work.`,
    short: 'Career shows where you stand as a professional actor and what your portfolio holds. Overview says what training you have, when you’re free for work, whether you can work in the US, your unions, and what your portfolio is missing, with what to do next.\n\nEverything on it is read from your record as it is now, so it changes as your record does.',
    steps: [
      'Press Career in the menu, under Your Work.',
      'On Overview, read Where You Stand: your training, your availability, where you’re based, your permission to work and your unions.',
      'Under What’s Missing, read what your portfolio needs. Needed For Any Submission comes first, then Worth Doing.',
      'Press Go To Portfolio to make or update what’s missing.',
    ],
    needs: ['Its chapter in the guide, read: the screen opens with it.'],
    costs: [{ label: 'Time', value: 'None: reading it moves no clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Training', value: 'Your School record: the degree completed and its year, your year as a candidate, or the terms you studied and left' },
      { label: 'Permission To Work', value: 'The papers you hold, the same ones Papers shows under Permission To Work' },
      { label: 'What’s Missing', value: 'Your headshots, résumé and reel, measured against your record now' },
    ],
    now: ['The screen shows your record and doesn’t move it.'],
    later: ['What’s Missing changes as you make materials, and as your record moves on past them: a new credit, a new skill or new recorded work.'],
    interpret: [
      'Needed For Any Submission is what a submission can’t go without: headshots and a résumé.',
      'Worth Doing is what would help: a reel, newer headshots, or a résumé brought up to date.',
      'The Way You’re On says whether you’re completing the degree, have graduated, or left without it. The School’s Bulletin lets the faculty shorten the residency only on rare occasions, never below two years, and publishes no way to ask, so the game offers no early degree.',
    ],
    unavailable: ['Career is Locked until you’ve read its chapter in the guide.'],
    mistakes: ['Reading Availability as permission to work. Availability is when you’re free; Permission To Work is whether you may work for an employer in the US.'],
    next: ['Press Go To Portfolio and start with the first thing What’s Missing names.'],
    related: ['career.profile', 'career.headshots', 'career.resume', 'career.reel', 'documents.work'],
    connections: [
      { to: 'career.headshots', kind: 'optional', why: 'What’s Missing names headshots first when you have none, since every submission starts with one.' },
      { to: 'documents.work', kind: 'prerequisite', why: 'Permission To Work on the Overview is the same permission Papers shows under Permission To Work.' },
    ],
    example: {
      setup: 'A first-year student who has made nothing for a portfolio yet.',
      steps: ['Open Career.', 'Read What’s Missing.'],
      result: 'Needed For Any Submission lists headshots and a résumé. Worth Doing says there’s no reel and nothing recorded to cut one from yet.',
    },
  },
  {
    id: 'career.profile',
    title: 'Your Professional Profile',
    goal: 'career',
    covers: ['pro.set_name'],
    synonyms: ['professional name', 'stage name', 'change my name', 'school credits', 'professional credits', 'special skills'],
    questions: ['Can I work under another name?', 'Why isn’t my self-tape a credit?', 'Which skills go on my résumé?'],
    where: on('portfolio', 'Career, Portfolio, Your Profile'),
    available: `From the guide’s chapter “${CHAPTER}”.`,
    short: 'Your Profile is what a submission says about you: the name you work under, your training, your School credits and professional credits kept apart, your special skills, when you’re free, where you’re based and whether you can work in the US.\n\nYou set one thing here: your professional name. Everything else is read from your record.',
    steps: [
      'Open Career, then the Portfolio tab.',
      'Under Professional Name, type the name you want to work under.',
      'Press Use This Name.',
      'To go back to your own name, leave the field blank, or type your own name, and press Use This Name.',
    ],
    needs: [`A name of letters, with spaces, hyphens, apostrophes and periods between them, ${NAME_MOST} characters at most.`],
    costs: [{ label: 'Time', value: 'None' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'School Credits', value: 'The parts you played at the School once each run has closed, as your Player Profile’s School Journey lists them' },
      { label: 'Special Skills', value: `A technique at ${SKILL_LISTED_AT} or more among ${SKILLS}`, estimate: true },
    ],
    now: ['Your profile shows the new name at once.'],
    later: ['A résumé made under your old name reads as behind, and Update Your Résumé makes one under the new name.'],
    interpret: [
      'Professional credits are paid work and student films, kept for good. Practice, practice briefs and self-tapes are never credits.',
      'A special skill marked mastered is at its technique’s top, where no piece asks more of it.',
    ],
    unavailable: [
      'That’s already your professional name.',
      'You’re already working under your own name.',
      `A professional name is ${NAME_MOST} characters at most.`,
    ],
    mistakes: ['Changing your name after making your résumé, and sending the old one. Update it after a change.'],
    next: ['Make your résumé, or update it, so it carries the name.'],
    related: ['career.resume', 'craft.profile'],
    connections: [
      { to: 'career.resume', kind: 'immediate', why: 'Your résumé uses your professional name, and one made under another name reads as behind.' },
      { to: 'craft.profile', kind: 'history', why: 'Your special skills are your techniques on the Player Profile, at the level it shows.' },
    ],
    example: {
      setup: 'Ada Cole would rather work as Ada Lynn Cole.',
      steps: ['Type Ada Lynn Cole under Professional Name.', 'Press Use This Name.'],
      result: 'Your Profile says you work as Ada Lynn Cole, and a résumé made earlier reads as behind until it’s updated.',
    },
  },
  {
    id: 'career.headshots',
    title: 'Headshots',
    goal: 'career',
    covers: ['pro.headshots'],
    synonyms: ['headshot', 'photographer', 'photo session', 'new headshots', 'old headshots'],
    questions: ['How do I get headshots?', 'How much do headshots cost?', 'When are my headshots out of date?'],
    where: on('portfolio', 'Career, Portfolio, Headshots'),
    available: `From the guide’s chapter “${CHAPTER}”.`,
    short: `Headshots are the photographs every submission starts with. A session with a photographer takes ${hours(HEADSHOTS.minutes)} and costs about ${usd(HEADSHOTS.cost)}, both estimated, paid from your bank.\n\nThe panel says when yours were taken, where they came from and what’s in them. Headshots more than two years old read as out of date, which is estimated too.`,
    steps: [
      'Open Career, then the Portfolio tab.',
      'Under Headshots, read the session’s time and price on the button.',
      'Press Book A Headshot Session. The clock moves on while it runs, and the price comes out of your bank.',
    ],
    needs: [
      `Free for the session’s ${hours(HEADSHOTS.minutes)}, with nothing on your calendar in that time.`,
      `Daytime: a session starts ${SESSION_HOURS}.`,
      'Enough in your bank for the price.',
    ],
    costs: [{ label: 'Time', value: hours(HEADSHOTS.minutes), estimate: true }, { label: 'Money', value: usd(HEADSHOTS.cost), estimate: true }],
    reads: [{ label: 'Out Of Date', value: 'Headshots taken more than two years before', estimate: true }],
    now: ['The clock moves on by the session, the price comes out of your bank as a work cost, and your new headshots are on the panel, dated today.'],
    later: ['Two years on, they read as out of date, and What’s Missing says so.'],
    interpret: ['Current means they were taken within two years. Out of date means they may not look like you now.'],
    unavailable: [
      `Photographers work by day: a session starts ${SESSION_HOURS}.`,
      'Your bank can’t cover the session.',
      'You’re busy then, or something on your calendar starts before the session would end.',
    ],
    mistakes: [`Booking one late in the day. A session has to start by ${clockWords(HEADSHOTS.until)}.`],
    next: ['Make your résumé: a submission sends both.'],
    related: ['career.resume', 'career.overview'],
    connections: [
      { to: 'career.overview', kind: 'immediate', why: 'Once you have headshots, What’s Missing stops asking for them, until they’re more than two years old.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'The session’s price comes out of your bank as a work cost.' },
    ],
    example: {
      setup: `A free afternoon at ${clockWords(13)}, with ${usd(HEADSHOTS.cost)} or more in the bank.`,
      steps: ['Open Career, then Portfolio.', 'Press Book A Headshot Session.'],
      result: `The clock moves to ${clockWords(13 + HEADSHOTS.minutes / 60)}, ${usd(HEADSHOTS.cost)} comes out of your bank, and Headshots shows them taken today, current.`,
    },
  },
  {
    id: 'career.resume',
    title: 'Your Résumé',
    goal: 'career',
    covers: ['pro.update_resume'],
    synonyms: ['resume', 'CV', 'update my resume', 'credits list', 'resume behind'],
    questions: ['How do I make a résumé?', 'Why is my résumé behind?', 'What goes on my résumé?'],
    where: on('portfolio', 'Career, Portfolio, Résumé'),
    available: `From the guide’s chapter “${CHAPTER}”.`,
    short: `Your résumé is made from your record: your name, your unions, your training, your professional credits, your School credits and your special skills. Making it takes ${hours(RESUME.minutes)} at your own desk, estimated, and costs nothing.\n\nOnce something new is on your record, it reads as behind, and the panel names what it’s missing.`,
    steps: [
      'Open Career, then the Portfolio tab.',
      'Under Résumé, press Make Your Résumé, or Update Your Résumé once you have one.',
      'Open What It Says to read it line by line.',
    ],
    needs: [`Free for ${hours(RESUME.minutes)}.`, 'Something on your record it doesn’t have yet, for an update.'],
    costs: [{ label: 'Time', value: hours(RESUME.minutes), estimate: true }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Training', value: 'As your record has it: the degree and its year, a candidate’s year, or the terms studied without the degree' },
      { label: 'Credits', value: 'Professional credits and School credits, apart' },
      { label: 'Unions', value: 'Equity from the degree, as the School’s Bulletin says, and SAG-AFTRA when your record has it' },
    ],
    now: ['The clock moves on an hour, and the new résumé is on the panel with what it says.'],
    later: ['A part played, a skill grown, a new name, the degree or a union makes it behind, and What’s Missing names what’s new.'],
    interpret: ['Up To Date means it has everything on your record. Behind names what it’s missing.'],
    unavailable: ['Your résumé already has everything on your record.', 'You’re busy then.'],
    mistakes: ['Updating it before a run has closed. A School part goes on it once the run’s last night is played.'],
    next: ['Cut a reel if you have recorded work, or book headshots if you haven’t.'],
    related: ['career.profile', 'career.reel'],
    connections: [
      { to: 'career.overview', kind: 'immediate', why: 'Once you have a résumé, What’s Missing stops asking for one, until your record moves on past it.' },
      { to: 'productions.nights', kind: 'history', why: 'A School production’s part goes on your résumé once its run has closed.' },
    ],
    example: {
      setup: 'A second-year student who played a part in a School production last term, with a résumé made before it.',
      steps: ['Open Career, then Portfolio.', 'Read Résumé’s Standing, then press Update Your Résumé.'],
      result: 'Before, it says it’s behind and names the part. After an hour, it’s up to date and lists the part under School credits.',
    },
  },
  {
    id: 'career.reel',
    title: 'Your Reel',
    goal: 'career',
    covers: ['pro.cut_reel'],
    synonyms: ['reel', 'demo reel', 'cut a reel', 'recorded work', 'filmed monologues'],
    questions: ['How do I make a reel?', 'What can go on my reel?', 'Why can’t my voice tape go on my reel?'],
    where: on('portfolio', 'Career, Portfolio, Reel'),
    available: `From the guide’s chapter “${CHAPTER}”.`,
    short: `A reel is short recorded work that shows you on camera. It’s cut only from what was recorded: your self-tapes of practice briefs, the School’s filmed monologues once they’re posted at the end of your last term, and screen work once it’s released. An editor cuts up to ${word(REEL.most)} pieces in ${hours(REEL.minutes)} for about ${usd(REEL.cost)}, both estimated.`,
    steps: [
      'Open Career, then the Portfolio tab.',
      `Under Recorded Work To Cut From, tick up to ${word(REEL.most)} pieces. Each shows how it was judged and when.`,
      'Press Cut A Reel.',
    ],
    needs: ['Something recorded: tape a practice brief on the Player Profile first.', `Free for ${hours(REEL.minutes)}.`, 'Enough in your bank for the edit.'],
    costs: [{ label: 'Time', value: hours(REEL.minutes), estimate: true }, { label: 'Money', value: usd(REEL.cost), estimate: true }],
    reads: [
      { label: 'Self-Tapes', value: 'The tapes of each brief you keep, with their bands' },
      { label: 'Filmed Monologues', value: 'Taming The Cyclops passed in your last term: the School posts them at the end of it, as its Bulletin says' },
    ],
    now: ['The clock moves on two hours, the edit comes out of your bank, and the reel shows what’s on it, a line a piece.'],
    later: ['New recorded work after it shows under What’s Missing as worth adding.'],
    interpret: [
      'A reel of self-tapes only says so: filmed School work or screen work shows more.',
      'A night on stage and a class piece aren’t recorded, so they never appear here.',
    ],
    unavailable: [
      'You have nothing recorded to cut a reel from.',
      `A reel holds ${word(REEL.most)} pieces at most.`,
      'A voice brief is a sound recording with no picture, so it can’t go on a reel.',
      'Your reel already holds exactly these pieces.',
    ],
    mistakes: ['Expecting a production’s nights on it. Only recorded work can be.'],
    next: ['Check What’s Missing on the Overview.'],
    related: ['career.overview', 'craft.brief-tape'],
    connections: [
      { to: 'craft.brief-tape', kind: 'prerequisite', why: 'A self-tape of a practice brief is the first recorded work a reel can be cut from.' },
      { to: 'career.overview', kind: 'immediate', why: 'Once you have a reel, What’s Missing stops asking for one, and says when newer work came after it.' },
    ],
    example: {
      setup: 'Three self-tapes of camera briefs taped, one of them Strong.',
      steps: ['Tick the Strong tape and one other.', 'Press Cut A Reel.'],
      result: `Two hours on, ${usd(REEL.cost)} comes out of your bank, and Reel lists the two pieces with their bands. What’s Missing says it holds only self-tapes.`,
    },
  },
];
