/**
 * SLATE — the guide's reference: the Career screen and the portfolio (from 2026-10-20, the owner's brief 19;
 * `content/guide/types.ts`).
 *
 * Every figure is the rule's own, imported from `systems/pro.ts`: a headshot session's time, price, hours and the age at
 * which headshots read as out of date; a résumé's hour; a reel's two hours, price and four pieces; the level a technique
 * goes on a résumé from; and the versions kept. Each of those is the game's estimate, and the entries say so. The
 * Bulletin's sentences (Equity at the degree, the filmed monologues posted at the end of the final term) are its own
 * (`docs/research/career-2026-10-20/yale.md`, B27 pp.24 and 33).
 *
 * From 2026-10-21 (brief 19's pay) three more, for the Work tab (`systems/propay.ts`): the pay, the commission and the
 * unions. Their figures are the rules' own too: the trust account's business days and the commission's rates
 * (`AGREEMENT`), the unions' fees (`UNIONS`), the thirty days (`UNIONS.sagAftra.joinWithinDays`), each said as a
 * published rule or an estimate as the code says it.
 */

import { CHAPTER_FOR } from '../tutorial';
import { SKILL_WORDS } from '../school';
import { formatMoney } from '../../core/money';
import { HEADSHOTS, NAME_MOST, REEL, RESUME, SESSION_HOURS, SKILL_LISTED_AT, SPECIAL_SKILLS, clockWords } from '../../systems/pro';
import { PAY, sagJoinUsd } from '../../systems/propay';
import { AGREEMENT, UNIONS } from '../careerwork';
import type { GuideEntry } from './types';

const CAREER = '/workspace/career';
/** A Career section's id: a parameter typed by its literals would read to `tools/title-case.mjs` as a label. */
type Section = 'overview' | 'portfolio' | 'work';
const on = (section: Section, label: string) => ({ route: CAREER, tab: section, label });

const CHAPTER = CHAPTER_FOR['ui.career']!.title;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const word = (n: number): string => WORDS[n] ?? String(n);
const hours = (minutes: number): string => (minutes === 60 ? 'an hour' : `${word(minutes / 60)} hours`);
const usd = (cents: number): string => formatMoney(cents, 'USD');
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const SKILLS = andList(SPECIAL_SKILLS.map((s) => SKILL_WORDS[s]));
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const TEN = pct(AGREEMENT.commission);
const FIVE = pct(AGREEMENT.equityLowTier.rate);
const LOW = usd(AGREEMENT.equityLowTier.weeklyAtOrBelow);
const TRUST_DAYS = word(PAY.trustBusinessDays);
const JOIN = usd(sagJoinUsd());
const SAG_DAYS = UNIONS.sagAftra.joinWithinDays;

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
  {
    id: 'career.pay',
    title: 'Your Work And Its Pay',
    goal: 'career',
    covers: [],
    synonyms: ['pay', 'paycheck', 'wages', 'payday', 'engagement', 'when do I get paid', 'promised pay', 'trust account', 'deferred pay', 'permission to work for a job'],
    questions: ['When do I get paid for work?', 'Why isn’t my pay in my account yet?', 'Where does my pay go when I’m represented?', 'What was taken out of my pay?', 'Can I work on an F-1?'],
    where: on('work', 'Career, Work, Your Engagements'),
    available: `From the guide’s chapter “${CHAPTER}”. The Work tab lists work once you’ve booked some.`,
    short: `The Work tab lists each engagement you’ve booked: who it’s for, where, its dates, its calls on your calendar, what your permission to work said for its dates, and its pay, a payment for each week’s work.\n\nPay is promised when you accept the work, and reaches your accounts only when it’s paid, on the Thursday after each week’s work. Represented, it goes to your agency’s client trust account first and comes on to you within ${TRUST_DAYS} business days, less commission. Unrepresented, it comes straight to you.`,
    steps: [
      'Open Career, then the Work tab.',
      'Under Your Engagements, read each payment: what’s promised, by whom, and when it’s due.',
      'After its payday, the payment says what was withheld for tax, any union dues, the commission and what reached you.',
      'Open Money to see it land, with its line on your account’s statement.',
    ],
    needs: ['Work you’ve booked. A student film’s pay is deferred, so it’s listed and never paid.'],
    costs: [
      { label: 'Tax', value: 'Withheld from each payment as a paycheck’s is: federal income tax, Social Security and Medicare, and the tax of the state the work is in' },
      { label: 'When It’s Paid', value: 'The Thursday after each week’s work, as SAG-AFTRA’s rules give it, for all professional work', estimate: true },
      { label: 'Through Your Agency', value: `Within ${TRUST_DAYS} business days of the payday, as SAG-AFTRA’s rules give it for TV and film, for stage work too`, estimate: true },
    ],
    reads: [
      { label: 'Representation', value: 'Whether you had an agreement in force on the day you made the contract, not on the payday' },
      { label: 'Where The Work Is', value: 'The town it’s done in, which your tax return reads: a New Haven resident’s New York work is taxed by New York, with Connecticut’s credit for it' },
      { label: 'Permission To Work', value: 'Read for each of its dates when you book it, and kept: the same permission Papers shows under Permission To Work' },
    ],
    now: ['Accepting work puts each payment on the Work tab as promised. Your accounts don’t change yet.'],
    later: [
      'On its payday, unrepresented, the pay less tax and dues goes into your account, and a notice says so.',
      `Represented, it goes into your agency’s client trust account, shown in what you’re worth as held for you, and ${TRUST_DAYS} business days later comes on to your account less commission.`,
      'Each payment counts on your tax return as wages, with what was withheld, the commission and the dues.',
    ],
    interpret: [
      'Promised means it’s owed and not yet paid. In Trust means the production has paid and your agency holds it. Received gives the figures as they were posted.',
      'Deferred pay is shown and never paid.',
      'On an F-1 while you’re a student, outside acting work isn’t open to you: Yale grants CPT only for training the whole program requires, and Acting has none. On OPT after your degree, each day of an engagement counts as a day worked.',
    ],
    unavailable: ['“No work booked. Work you accept appears here with its dates, its calls, its pay and any commission.”'],
    mistakes: [
      'Counting promised pay as money you have. It isn’t in your accounts until its payday, or until your agency passes it on.',
      'Thinking signing with an agent lets you work. Permission to work is your papers’, and an agreement changes nothing of it.',
    ],
    next: ['Read Commission, to see what your agency takes and when.'],
    related: ['career.commission', 'career.unions', 'documents.work', 'taxes.return'],
    connections: [
      { to: 'bank.accounts', kind: 'scheduled', why: 'Each payment lands in your account on its payday, or from your agency’s trust account a few business days later.' },
      { to: 'taxes.return', kind: 'evaluation', why: 'Your tax return reads each payment’s wages, withholding, commission, dues and the town the work was done in.' },
      { to: 'documents.work', kind: 'prerequisite', why: 'Each engagement’s dates are read against your permission to work when you book it.' },
    ],
    example: {
      setup: 'An unrepresented graduate living in New Haven, booked for three weeks Off-Broadway at $1,051 a week from Monday, September 14, 2026.',
      steps: ['Open Career, then Work.', 'Read the three payments, each promised and due a Thursday.', 'Move the clock past Thursday, September 24.'],
      result: 'The first week is paid that Thursday at noon: tax and Equity’s working dues withheld, the rest into checking, and the year’s wages count it as New York work.',
    },
  },
  {
    id: 'career.commission',
    title: 'Commission',
    goal: 'career',
    covers: [],
    synonyms: ['commission', 'agent’s cut', 'scale plus ten', 'continuing commission', 'what my agency takes', '10 percent'],
    questions: ['How much commission does my agency take?', 'Why was no commission taken?', 'Do I owe commission after my agreement ends?', 'What is scale plus ten?'],
    where: on('work', 'Career, Work, each payment’s Commission'),
    available: `From the guide’s chapter “${CHAPTER}”. Commission is owed only on work you contracted while represented.`,
    short: `Your agency takes commission only on covered work, stage, film and television in the US, that you contracted while your agreement was in force. It’s taken when your pay passes through its client trust account, and shown on its own line on the Work tab and in the deposit’s line in Money.\n\nThe rate is the unions’ and the law’s: ${TEN} at most, ${FIVE} on an Equity contract paying ${LOW} a week or less, and on SAG-AFTRA work only what you’re paid over scale.`,
    steps: [
      'Open Career, then the Work tab.',
      'Under each payment, read Commission: for one to come, what’s expected and why; for one received, what was taken.',
      'If your agreement has ended, read Still Owed After An Agreement Ended for the payments that still carry it.',
    ],
    needs: ['An agreement in force when you made the contract, or an offer your agency passed on in its term that you accepted within 60 days after it ended.'],
    costs: [
      { label: 'Covered Work', value: `${TEN} of the gross, the most New York lets an agency take for an engagement` },
      { label: 'Equity', value: `${FIVE} on a weekly salary of ${LOW} or less, ${TEN} above it` },
      { label: 'SAG-AFTRA', value: `Only what’s over scale, up to ${TEN}: at scale plus ten percent you keep scale and your agency takes the ten` },
    ],
    reads: [
      { label: 'The Contract’s Date', value: 'The day you accepted the work, against your agreement’s dates' },
      { label: 'The Union', value: 'Equity’s tiers by the weekly salary, SAG-AFTRA’s scale by the rate' },
    ],
    now: ['Accepting work shows the commission it will carry, as expected, under each payment.'],
    later: [
      `When the pay passes through the trust account, the commission comes off it and your account gets the rest, ${TRUST_DAYS} business days after the payday.`,
      'After your agreement ends, a contract you made while it ran still carries commission, whoever represents you then.',
    ],
    interpret: [
      'No commission: you weren’t represented when you made the contract, or the work isn’t covered, or it pays SAG-AFTRA scale and nothing over it.',
      'Commission is part of what your tax return counts as the cost of your work.',
    ],
    unavailable: ['“No commission: you weren’t represented when you made this contract.”'],
    mistakes: ['Expecting an agreement signed after you accepted some work to take commission on it. Only contracts made while it’s in force carry it.'],
    next: ['Read Your Unions, for the dues taken from union pay.'],
    related: ['career.pay', 'career.unions'],
    connections: [
      { to: 'career.pay', kind: 'immediate', why: 'Commission comes off your pay as it passes through your agency’s trust account.' },
      { to: 'taxes.return', kind: 'evaluation', why: 'The year’s commission counts toward the performing artist’s deduction the return works out.' },
    ],
    example: {
      setup: 'Represented, you book two days on a network drama at scale plus ten, $1,411.30 a day.',
      steps: ['Read the payment’s Commission on the Work tab.', 'Move the clock past its payday and three business days.'],
      result: 'Commission is $256.60, what the $2,822.60 is over scale, so you keep the $2,566.00 scale before tax.',
    },
  },
  {
    id: 'career.unions',
    title: 'Your Unions',
    goal: 'career',
    covers: ['pro.join_sag'],
    synonyms: ['union', 'Equity', 'Actors’ Equity', 'SAG-AFTRA', 'SAG', 'dues', 'initiation fee', 'Taft-Hartley', 'join the union'],
    questions: ['When do I join Equity?', 'What does Equity cost?', 'When can I join SAG-AFTRA?', 'Do I have to join SAG-AFTRA?', 'Why was money taken for dues?'],
    where: on('work', 'Career, Work, Your Unions'),
    available: `From the guide’s chapter “${CHAPTER}”. Join SAG-AFTRA opens once you’ve worked a SAG-AFTRA principal role.`,
    short: `Your degree makes you a member of Actors’ Equity, as the School’s Bulletin says. Its initiation fee is ${usd(UNIONS.equity.initiation)}, paid within three years with ${usd(UNIONS.equity.down)} down, and basic dues are ${usd(UNIONS.equity.yearlyDues)} a year, billed each May and November.\n\nA SAG-AFTRA principal role on a TV show or a theatrical or Low Budget film makes you eligible to join SAG-AFTRA. From the ${SAG_DAYS}th day after that job began, SAG-AFTRA work needs you to be a member: press Join SAG-AFTRA, about ${JOIN}.`,
    steps: [
      'Open Career, then the Work tab.',
      'Under Your Unions, read Equity’s bills: each paid, owed or due, with its date.',
      'Once SAG-AFTRA says you can join, press Join SAG-AFTRA before you take SAG-AFTRA work past its 30 days.',
    ],
    needs: ['For Equity: the degree.', 'For SAG-AFTRA: a SAG-AFTRA principal role worked, and the fee in your bank.'],
    costs: [
      { label: 'Equity’s Initiation Fee', value: `${usd(UNIONS.equity.initiation)} within three years: ${usd(UNIONS.equity.down)} at the degree, then two parts a year apart. The two parts’ dates are estimated` },
      { label: 'Equity’s Dues', value: `${usd(UNIONS.equity.yearlyDues / 2)} each May and November, and 2.5% of Equity pay, taken from it. Taking it from the pay is estimated` },
      { label: 'Joining SAG-AFTRA', value: `About ${JOIN}: the initiation fee and half a year’s base dues, then half a year’s dues each May and November, and 1.575% of SAG-AFTRA pay. Read from a search engine’s copy of its pages`, estimate: true },
    ],
    reads: [
      { label: 'The Degree', value: 'Equity’s membership date, which its first bill reads' },
      { label: 'Your First SAG-AFTRA Role', value: `Its first day, from which you can join and after ${SAG_DAYS} days must, by federal law’s limit for a union contract` },
    ],
    now: ['Join SAG-AFTRA takes its fee from your bank and makes you a member today. Your next SAG-AFTRA work takes its working dues.'],
    later: [
      'Each union bill is taken from your bank on its day. If the bank can’t cover it, it’s owed under Bills Owed and paid off the first day there’s money.',
      'Union pay has its working dues taken before it reaches you.',
    ],
    interpret: [
      'A bill marked owed is a debt: it’s paid off when money comes in.',
      'Ultra Low Budget films and student films don’t count toward SAG-AFTRA eligibility in the game.',
    ],
    unavailable: [
      '“You can join SAG-AFTRA once you’ve worked a SAG-AFTRA principal role: a TV, theatrical or Low Budget film part. Ultra Low Budget and student films don’t count toward it.”',
      '“You’re already a member of SAG-AFTRA, since …”',
      'Your bank can’t cover the fee.',
    ],
    mistakes: [`Booking SAG-AFTRA work past the ${SAG_DAYS} days without joining first. The work is refused until you join.`],
    next: ['Check Money for the bills on their days.'],
    related: ['career.pay', 'career.commission', 'career.resume'],
    connections: [
      { to: 'bank.accounts', kind: 'scheduled', why: 'Each union bill comes out of your bank on its day.' },
      { to: 'career.resume', kind: 'history', why: 'Your résumé lists your unions once you’re a member.' },
      { to: 'taxes.return', kind: 'evaluation', why: 'Dues count toward the cost of your work on the year’s return.' },
    ],
    example: {
      setup: 'A graduate whose degree was conferred on September 3, 2026.',
      steps: ['Open Career, then Work.', 'Read Your Unions.'],
      result: 'Equity’s $600.00 down was taken that day; $600.00 is due on September 3, 2027 and again on September 3, 2028; and $88.00 basic dues come on November 1, 2026.',
    },
  },
];
