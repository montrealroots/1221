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
 * From 2026-10-21 (brief 19's J1 to J5 and A3) four more: finding work and submitting, auditions and callbacks, offers
 * and booked work, and work while at the School. Their figures are the work loop's own (`systems/projobs.ts`): a
 * posting's week, the trip and the times, the School's fourteen days, ten working days, two class days and the dean's
 * week, each the game's estimate, said so; the Bulletin's sentences are its own (yale.md §4, B27 p.148).
 */

import { CHAPTER_FOR } from '../tutorial';
import { SKILL_WORDS } from '../school';
import { formatMoney } from '../../core/money';
import { HEADSHOTS, NAME_MOST, REEL, RESUME, SESSION_HOURS, SKILL_LISTED_AT, SPECIAL_SKILLS, clockWords } from '../../systems/pro';
import { OUTSIDE_WORK, WORK } from '../../systems/projobs';
import { BRIEF } from '../../systems/briefs';
import type { GuideEntry } from './types';

const CAREER = '/workspace/career';
/** A Career section's id: a parameter typed by its literals would read to `tools/title-case.mjs` as a label. */
type Section = 'overview' | 'portfolio' | 'opportunities';
const on = (section: Section, label: string) => ({ route: CAREER, tab: section, label });

const CHAPTER = CHAPTER_FOR['ui.career']!.title;
/** The work loop's chapter (from 2026-10-21, brief 19's J1 to J5 and A3). */
const WORK_CHAPTER = CHAPTER_FOR['pro.submit']!.title;
const STEPS = `${BRIEF.steps.read.label}, ${BRIEF.steps.lines.label} and ${BRIEF.steps.rehearse.label}`;
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
  {
    id: 'career.opportunities',
    title: 'Finding Work And Submitting',
    goal: 'career',
    covers: ['pro.submit'],
    synonyms: ['casting notice', 'find work', 'acting work', 'open call', 'submit myself', 'breakdown'],
    questions: ['How do I find acting work?', 'How do I submit for a role?', 'Why can’t I submit for this role?'],
    where: on('opportunities', 'Career, Opportunities, Open Calls'),
    available: `From the guide’s chapter “${WORK_CHAPTER}”.`,
    short: `The Opportunities tab lists the roles you can be seen for, every project, company and casting office invented for the game. New roles go up each Monday morning and take submissions for ${word(WORK.submitDays)} days.\n\nPress Submit Yourself on an open role to send your headshots and résumé, and a reel where casting asks for one. Some casting offices take actors only through an agent, and their roles reach you only while one represents you.`,
    steps: [
      'Open Career, then the Opportunities tab.',
      'Under Open Calls, read a role: the project, the part, what it asks, its dates and place, its pay and whether you can be seen for it.',
      'Press Submit Yourself. If it’s grayed out, the line under it says why.',
    ],
    needs: [
      'Headshots and a résumé, made on the Portfolio tab, and a reel where the casting office asks for one.',
      'A role that takes your own submission, before its window closes.',
      'The role’s playing ages, and Equity membership for an Equity open call.',
    ],
    costs: [{ label: 'Time', value: 'None: a submission is sent at once' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Materials', value: 'Your current headshots, résumé and reel, as What’s Missing reads them' },
      { label: 'Eligibility', value: 'The role’s playing ages, an open call’s union, and the days you’re already booked' },
    ],
    now: ['The role moves to In Progress, with what you sent and when each was made.'],
    later: [`${word(WORK.replyDays).charAt(0).toUpperCase()}${word(WORK.replyDays).slice(1)} days on, the casting office answers with an audition in person or a self-tape, and a notice says when and where.`],
    interpret: [
      'Open Calls are roles you can submit yourself for. Through An Agent shows the roles an agent brought, which only the agent submits.',
      'Each role says it’s fictional: no real production is casting.',
    ],
    unavailable: [
      'You have no headshots, and every submission starts with one.',
      'The casting office takes submissions only from agents.',
      'It’s an open call for Equity members, and you aren’t one yet.',
      'Submissions closed.',
    ],
    mistakes: ['Waiting to make headshots until a role you want is posted. A role’s window is a week; make them first.'],
    next: ['Prepare the sides once the casting office answers.'],
    related: ['career.auditions', 'career.overview', 'career.headshots'],
    connections: [
      { to: 'career.headshots', kind: 'prerequisite', why: 'A submission starts with your headshots: without them it can’t be sent.' },
      { to: 'career.auditions', kind: 'scheduled', why: 'A submission puts the casting office’s answer on the clock, and the answer sets an audition.' },
    ],
    example: {
      setup: 'A graduate with headshots and a résumé, and a student film posted on Monday.',
      steps: ['Open Career, then Opportunities.', 'Press Submit Yourself under the student film.'],
      result: 'The role moves to In Progress with your headshots and résumé listed as sent, and two days on a notice says when the director wants to see you.',
    },
  },
  {
    id: 'career.auditions',
    title: 'Auditions And Callbacks',
    goal: 'career',
    covers: ['pro.prepare', 'pro.tape_audition', 'pro.move_audition'],
    synonyms: ['audition', 'self-tape audition', 'callback', 'sides', 'another time', 'casting decision'],
    questions: ['How do I prepare for an audition?', 'Can I move my audition?', 'How does casting decide?'],
    where: on('opportunities', 'Career, Opportunities, In Progress'),
    available: `From the guide’s chapter “${WORK_CHAPTER}”, once a casting office has answered a submission.`,
    short: `An audition is in person, in New York or Providence at a set time, or a self-tape due by an evening. Prepare the sides first with ${STEPS}, as you would a practice brief. Then press Tape It, or be there when the clock stops for the audition and press Go.\n\nCasting decides from how the audition went, how well the role suits you and how many other actors it saw. Some roles call you back for a second audition first.`,
    steps: [
      'Open Career, then Opportunities, and find the role under In Progress.',
      `Press ${STEPS}, each as many times as it helps. Each says its time.`,
      'For a self-tape, press Tape It before it’s due. For an audition in person, press Go when the clock stops for it.',
      'If it clashes with something, press Ask For Another Time at least a day ahead.',
    ],
    needs: [
      'Free for each step’s time, and awake. Rehearsing on your feet needs some of the lines learned and the energy for it.',
      'For a self-tape, an hour free before it’s due.',
      `For a new time, a day’s notice, asked once.`,
    ],
    costs: [
      { label: 'Time', value: `${BRIEF.steps.read.minutes} minutes to ${BRIEF.steps.rehearse.minutes} minutes a step; an hour for a self-tape; an audition in person ${WORK.auditionMinutes} minutes, with the trip each way`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Your Audition', value: 'Your abilities and techniques, the sides’ preparation and the day’s condition, judged as every piece of work is' },
      { label: 'The Role’s Fit', value: 'How well you know its genre, and its techniques against yours' },
      { label: 'The Field', value: 'How many other actors that kind of work draws, estimated' },
    ],
    now: ['A step moves its part of the preparation on and the clock with it. A self-tape is judged at once and kept on your work record.'],
    later: ['A day after a first audition casting decides whether to call you back, and three days after the last whether to offer you the role. A notice says which.'],
    interpret: [
      'The band says how good the audition was. Casting’s chance reads the band, the fit and the field together, and even the best audition doesn’t make it certain.',
      'Why It Went This Way, under a settled role, shows each part of it.',
    ],
    unavailable: [
      'There are no sides yet: casting sends them with an audition.',
      'You’ve done all this step can do.',
      'There’s less than the hour a self-tape takes before it’s due.',
      'You’ve already asked once, and casting is keeping the time it gave.',
      'Casting has no other time clear of your calendar in the days it’s seeing actors.',
    ],
    mistakes: ['Missing an audition. Casting moves on without you, and the role lapses.'],
    next: ['Wait for casting’s word, then answer an offer under Offers.'],
    related: ['career.opportunities', 'career.offers', 'craft.brief-tape'],
    connections: [
      { to: 'career.offers', kind: 'evaluation', why: 'Casting reads your audition’s band, with the role’s fit and the field, when it decides whether to offer you the role.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'An audition in person goes on your calendar with its trip, and stops the clock when it comes.' },
    ],
    example: {
      setup: 'A self-tape asked for by Thursday at six, with the sides not yet prepared.',
      steps: ['Press Break It Down, Learn The Lines and Rehearse It On Your Feet until they can do no more.', 'Press Tape It.'],
      result: 'An hour on, the tape is judged and shown with its band, and the casting office decides on the Friday after it’s due.',
    },
  },
  {
    id: 'career.offers',
    title: 'Offers And Booked Work',
    goal: 'career',
    covers: ['pro.accept_offer', 'pro.decline_offer'],
    synonyms: ['offer', 'accept the offer', 'decline the offer', 'booked work', 'shoot day', 'work day'],
    questions: ['How do I accept an offer?', 'What happens if I miss a work day?', 'When am I paid for a job I booked?'],
    where: on('opportunities', 'Career, Opportunities, Offers'),
    available: `From the guide’s chapter “${WORK_CHAPTER}”, once casting makes you an offer.`,
    short: `An offer says the role, the pay, the dates and how long it stands, ${word(WORK.offerDays)} days. Press Accept The Offer to book it, or Decline The Offer. Accepting puts each work day on your calendar and promises the pay for each week of it.\n\nEach work day stops the clock: press Go to be there. Each is judged, and the part goes on your professional credits.`,
    steps: [
      'Open Career, then Opportunities, and read the offer under Offers, or under What Needs You on Home.',
      'Press Accept The Offer or Decline The Offer before it lapses.',
      'Under Booked Work, prepare the part with the same three steps as the sides.',
      'On each work day, press Go when the clock stops for it.',
    ],
    needs: [
      'Permission to work in the US for every day of it, as Papers shows it.',
      'No other booking on the same days, and in the summer no School call on them.',
    ],
    costs: [{ label: 'Time', value: 'Each work day’s hours, with the trip each way' }, { label: 'Money', value: 'None: the work pays you' }],
    reads: [
      { label: 'Permission To Work', value: 'Every day of the work, against the papers you hold' },
      { label: 'The Part', value: 'Its preparation, your abilities and techniques, and the day’s condition, judged as every piece of work is' },
    ],
    now: ['The work days go on your calendar, and the pay for each week is promised, due the Thursday after it. It isn’t paid yet.'],
    later: [
      'A stage part goes on your credits at its first night; a screen part when it’s shot, and as released once it comes out, when its footage can go on a reel.',
      'Miss a shoot day, or a second day of a run, and the production replaces you.',
    ],
    interpret: ['Promised pay is what the contract owes you, not money you have yet. A student film’s pay is deferred, so nothing is paid.'],
    unavailable: [
      'Your F-1 lets you work only on campus while you’re a student.',
      'You’re booked for another job on those days.',
      'The School holds you for one of its calls on those days.',
      'The offer lapsed.',
    ],
    mistakes: ['Sleeping through a work day. A missed day of a shoot ends the job.'],
    next: ['Update your résumé once the part is on your credits.'],
    related: ['career.auditions', 'career.outside-work', 'documents.work', 'career.resume'],
    connections: [
      { to: 'documents.work', kind: 'prerequisite', why: 'An offer can be accepted only where your permission to work covers every one of its days.' },
      { to: 'career.resume', kind: 'history', why: 'The part goes on your professional credits, and your résumé reads as behind until it has it.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'Accepting puts each work day on your calendar, and each stops the clock for you.' },
    ],
    example: {
      setup: 'An offer of a two-day shoot at $125.00 a day, estimated, standing three days.',
      steps: ['Press Accept The Offer.', 'Prepare the part, then press Go on each shoot day.'],
      result: 'Two shoot days go on your calendar and $250.00 is promised for that week. After the second day the part is on your credits as not yet released.',
    },
  },
  {
    id: 'career.outside-work',
    title: 'Work While You’re At The School',
    goal: 'career',
    covers: ['pro.request_outside_work'],
    synonyms: ['outside work', 'work in term', 'ask the school', 'dean approval', 'work without approval'],
    questions: ['Can I take acting work while I’m at the School?', 'How do I get the School’s approval?', 'What happens if I work without approval?'],
    where: on('opportunities', 'Career, Opportunities, Open Calls'),
    available: `From the guide’s chapter “${WORK_CHAPTER}”, while you’re a student and a role’s days fall in term.`,
    short: `The School’s Bulletin discourages outside work in term and approves it “In rare situations” for short, professionally meaningful work asked for in good time. Press Ask The School on a role whose days fall in term: the dean decides ${word(OUTSIDE_WORK.decisionDays)} days later.\n\nWork taken in term without approval brings an academic warning the first time and dismissal the second. Summer and the winter break are yours, unless the School holds you for one of its calls.`,
    steps: [
      'Open Career, then Opportunities, and find a role whose days fall in term.',
      'Read what the School looks at, under the role, and whether each condition holds.',
      'Press Ask The School, at least two weeks before the first day.',
    ],
    needs: [
      'Good standing at the School.',
      'A role whose days fall in term, not settled yet.',
      'Permission to work outside the School: on an F-1, there’s none while you’re a student.',
    ],
    costs: [{ label: 'Time', value: 'An hour to talk to the chair and write the proposal', estimate: true }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'In Good Time', value: `Asked ${OUTSIDE_WORK.aheadDays} days or more before the first day`, estimate: true },
      { label: 'Short', value: `${OUTSIDE_WORK.mostDays} working days or fewer`, estimate: true },
      { label: 'Class Time', value: `No School or Yale Rep call, and ${word(OUTSIDE_WORK.mostClassDays)} class days at most`, estimate: true },
    ],
    now: ['The request is with the chair and the dean, and the role says when the dean decides.'],
    later: ['A week on, the dean approves or refuses it, and the notice says each condition. Approved, the class days it takes are excused.'],
    interpret: ['The School’s rule is the Bulletin’s. The fourteen days, ten working days and two class days, and the dean’s week, are the game’s estimates of its words.'],
    unavailable: [
      'Only a student in good standing may ask for outside work.',
      'None of its days fall in term, so the School’s approval isn’t needed.',
      'Your F-1 doesn’t let you work for an employer outside the School while you’re a student.',
    ],
    mistakes: ['Accepting work in term before the dean decides. If the dean refuses, working it brings an academic warning.'],
    next: ['Submit for the role, and accept the offer once the dean has approved it.'],
    related: ['career.offers', 'school.standing'],
    connections: [
      { to: 'school.standing', kind: 'immediate', why: 'Work in term without approval moves your standing to academic warning, and a second time to dismissal.' },
      { to: 'career.offers', kind: 'prerequisite', why: 'An offer in term is accepted on the School’s approval, or against it with the warning said first.' },
    ],
    example: {
      setup: 'A first-year in good standing, and a two-day shoot in October posted five weeks ahead.',
      steps: ['Press Ask The School on the role.', 'A week later, read the dean’s answer.'],
      result: 'The chair recommends it and the dean approves it: two working days, asked well ahead, a paid professional role, no School call and at most two class days. Those class days are excused.',
    },
  },
];
