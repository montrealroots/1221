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
 * From 2026-10-21 the agent's four entries (`systems/proagent.ts`): his panel and the routes, his office's answers, Why
 * It Went This Way, and the agreement. Their times, the bar and the cooling-off times are the game's estimates,
 * imported from the rules; the agreement's figures are `AGREEMENT`'s; the agency's policy is quoted from its data, never
 * copied. The agent is named from `AGENTS`, so an entry names whichever agent the game holds.
 */

import { CHAPTER_FOR } from '../tutorial';
import { SKILL_WORDS } from '../school';
import { formatMoney } from '../../core/money';
import { HEADSHOTS, NAME_MOST, REEL, RESUME, SESSION_HOURS, SKILL_LISTED_AT, SPECIAL_SKILLS, clockWords } from '../../systems/pro';
import { AGENT_TIMES, COOLDOWN_WORDS, GATE, REFERRAL_BAND, TEN, TIME_WORDS, TRAVEL_MINUTES, tripWords } from '../../systems/proagent';
import { YALE_DRAMA } from '../school';
import { AGENTS, agencyOf } from '../agents';
import { AGREEMENT } from '../careerwork';
import { BAND_LABEL } from '../../systems/coursework';
import type { GuideEntry } from './types';

const CAREER = '/workspace/career';
/** A Career section's id: a parameter typed by its literals would read to `tools/title-case.mjs` as a label. */
type Section = 'overview' | 'portfolio' | 'representation';
const on = (section: Section, label: string) => ({ route: CAREER, tab: section, label });

const CHAPTER = CHAPTER_FOR['ui.career']!.title;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const word = (n: number): string => WORDS[n] ?? String(n);
const hours = (minutes: number): string => (minutes === 60 ? 'an hour' : `${word(minutes / 60)} hours`);
const usd = (cents: number): string => formatMoney(cents, 'USD');
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const SKILLS = andList(SPECIAL_SKILLS.map((s) => SKILL_WORDS[s]));
const AGENT = AGENTS[0]!;
const AGENCY = agencyOf(AGENT);
const REP_CHAPTER = CHAPTER_FOR['pro.agent_notice']!.title;
const weeks = (days: number): string => `${word(days / 7)} ${days === 7 ? 'week' : 'weeks'}`;
const BAR = BAND_LABEL[REFERRAL_BAND];
/** The agreement's two ending buttons, as the Representation tab names them. */
const NO_OFFER = `End It: No Offer In ${AGREEMENT.noOfferDays} Days`;
const TOO_LITTLE = `End It: Under ${TEN.charAt(0).toUpperCase()}${TEN.slice(1)} Days’ Work`;

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
    id: 'career.agent',
    title: 'The Agent And How To Reach Him',
    goal: 'career',
    covers: ['pro.agent_notice', 'pro.agent_check', 'pro.ask_referral', 'pro.send_materials'],
    synonyms: ['agent', 'representation', AGENT.name, AGENCY.name, 'referral', 'send my materials', 'unsolicited submission'],
    questions: ['How do I get an agent?', 'Why was my submission refused?', 'How do I get a referral?'],
    where: on('representation', 'Career, Representation'),
    available: `From the guide’s chapter “${REP_CHAPTER}”.`,
    short: `The Representation tab holds the game’s one agent, ${AGENT.name}, an agent in ${AGENCY.name}’s ${AGENCY.office.city} ${AGENCY.department.called.toLowerCase()} department. He’s a real person, and everything he says and decides in the game is invented: his panel says so first, before anything else.\n\n${AGENCY.name}’s page for ${AGENCY.office.city} ${AGENCY.department.called.toLowerCase()} submissions says “${AGENCY.policy.quote}”, and the game keeps to it. His office takes your materials only through the School’s follow-up after the showcase, or a referral from someone you’ve worked with. He never gets in touch first.`,
    steps: [
      'Open Career, then the Representation tab.',
      'Read the notice at the top of his panel, then press I’ve Read This.',
      'Under Your Materials For Him, press Check Your Materials. If something’s missing, the line under it says what, and where to make it.',
      'Under How To Reach Him, press Ask For A Referral beside a finished job, or wait for the School’s follow-up after the showcase.',
      'Press Send Your Materials.',
    ],
    needs: [
      'The notice read.',
      'Headshots and a résumé: a check refuses without them.',
      `For a referral, a finished professional job whose work was judged ${BAR} or better, once for each job.`,
      'For a send, an introduction: the School’s follow-up or a referral.',
    ],
    costs: [{ label: 'Time', value: 'None' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Your Materials For Him', value: 'Your headshots, résumé and reel, checked as a submission would be' },
      { label: 'A Referral', value: `A finished job’s work, judged ${BAR} or better`, estimate: true },
      { label: 'An Answer', value: `Usually within ${TIME_WORDS.reply}; no answer in ${TIME_WORDS.silence} counts as no`, estimate: true },
    ],
    now: ['Sending moves Where You Stand With Him to Materials Sent, and his office’s answer is on the way.'],
    later: [
      `His office answers in about ${TIME_WORDS.reply}: a request for more, a meeting or a pass, each as a notice. Or no answer comes, and after ${TIME_WORDS.silence} that counts as no.`,
      `After a pass, his office looks again only after ${COOLDOWN_WORDS.pass}; after no answer or a declined offer, ${COOLDOWN_WORDS.silence}. Then it looks only at something new: a new credit, a better reel or a referral.`,
    ],
    interpret: [
      'Where You Stand With Him names the step you’re at, and What’s Next says what to do about it.',
      'A referral comes from the casting office of a job you’ve finished, never from him, and he never writes to you first.',
    ],
    unavailable: [
      `Stewart Talent’s page for New York legit submissions says: “${AGENCY.policy.quote}”`,
      'Check your materials first: a referral passes them on.',
      `A referral needs work judged ${BAR} or better in the game.`,
      'In the game a new approach needs something new for it to consider: a new credit, a better reel or a referral.',
    ],
    mistakes: ['Sending again too soon after a pass. The refusal says the date his office looks again from, and what it would look at.'],
    next: ['Keep your materials current while you wait: his office may ask for more.'],
    related: ['career.agent-answers', 'career.reasons', 'career.agreement', 'career.headshots', 'career.resume'],
    connections: [
      { to: 'career.headshots', kind: 'prerequisite', why: 'A check refuses an approach with no headshots, since every submission starts with one.' },
      { to: 'career.resume', kind: 'prerequisite', why: 'A check refuses an approach with no résumé, and a résumé behind your record is one thing his office can ask for.' },
      { to: 'career.agent-answers', kind: 'scheduled', why: `Sending your materials puts his office’s answer on the way, about ${TIME_WORDS.reply} on.` },
    ],
    example: {
      setup: `A graduate with headshots and a résumé, and a finished job judged ${BAR}.`,
      steps: ['Press I’ve Read This, then Check Your Materials.', 'Press Ask For A Referral beside the job.', 'Press Send Your Materials.'],
      result: `The job’s casting office refers you, your materials go to his office, and its answer comes about ${TIME_WORDS.reply} later.`,
    },
  },
  {
    id: 'career.agent-answers',
    title: 'His Office’s Answers And The Meeting',
    goal: 'career',
    covers: ['pro.supply_material', 'pro.ask_to_move'],
    synonyms: ['agent meeting', 'move the meeting', 'asked for more', 'send what was asked', 'no answer', 'pass'],
    questions: ['What happens after I send my materials?', 'Can I move the meeting?', 'What if I miss the meeting?'],
    where: on('representation', 'Career, Representation, The Meeting'),
    available: `From the guide’s chapter “${REP_CHAPTER}”.`,
    short: `His office answers an approach in one of four ways: it asks for more, asks to meet, passes, or doesn’t answer. Each answer comes as a notice, and History With His Office keeps every step.\n\nA meeting is on your calendar at ${clockWords(AGENT_TIMES.meetingHour)}, at the agency’s ${AGENCY.office.city} office or by video, and the clock stops at it like any commitment. You can move it once, ${TIME_WORDS.move} on.`,
    steps: [
      'When his office asks for more, make what it asked for on the Portfolio tab, then press Send What His Office Asked For.',
      'When it asks to meet, be there: press Go when the clock stops at it.',
      'If you can’t make it, press Ask To Move on the Representation tab, or at the stop.',
    ],
    needs: ['For a request, what it asked for made by its date.', 'For a move, a meeting not moved before, and not yet started.'],
    costs: [{ label: 'Time', value: `The meeting’s hour, and the trip: ${tripWords(TRAVEL_MINUTES[YALE_DRAMA.cityId]!)} from New Haven`, estimate: true }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'A Request', value: `What’s missing: a reel, newer headshots or a résumé brought up to date, due in ${TIME_WORDS.request}`, estimate: true },
      { label: 'A Move', value: `Once, ${TIME_WORDS.move} on`, estimate: true },
    ],
    now: [`What you send goes to his office, and its answer comes about ${TIME_WORDS.afterSupply} later.`, 'A moved meeting is on your calendar at its new time.'],
    later: [`After a meeting you keep, his office tells you its decision ${word(AGENT_TIMES.decisionDays)} days later: an offer or a pass.`, 'A meeting you miss closes the approach, since a meeting comes before an offer in the game.'],
    interpret: ['Material sent when asked, and meetings kept, count for you under Reliability; a missed one counts against you.'],
    unavailable: ['His office hasn’t asked you for anything.', 'You haven’t cut a reel yet.', 'In the game his office moves a meeting once.'],
    mistakes: ['Sleeping through the meeting. A commitment slept through is missed.'],
    next: ['After a meeting, wait for the decision, then read the agreement if one comes.'],
    related: ['career.agent', 'career.reasons', 'career.agreement', 'day.clock'],
    connections: [
      { to: 'career.reasons', kind: 'evaluation', why: 'A meeting kept or missed, and material sent when asked, are read under Reliability.' },
      { to: 'day.clock', kind: 'scheduled', why: 'A meeting stops the clock like any commitment, and offers Ask To Move at the stop.' },
    ],
    example: {
      setup: 'His office asked for a reel, and you have a self-tape to cut one from.',
      steps: ['Cut a reel on the Portfolio tab.', 'Press Send What His Office Asked For.'],
      result: `The reel goes to his office, and its answer comes about ${TIME_WORDS.afterSupply} later, as a notice.`,
    },
  },
  {
    id: 'career.reasons',
    title: 'Why It Went This Way',
    goal: 'career',
    covers: ['ui.career-reasons'],
    synonyms: ['why did the agent pass', 'agent decision', 'factors', 'room on his list', 'reliability'],
    questions: ['Why did his office pass?', 'What does his office consider?', 'Does better work guarantee an agent?'],
    where: on('representation', 'Career, Representation, Why It Went This Way'),
    available: `From the guide’s chapter “${REP_CHAPTER}”.`,
    short: `Why It Went This Way gives the game’s reasons for his office’s last decision, and where they stand now. There are seven, each set apart: your work, stage and screen, training and experience, fit with his department, availability, room on his list, and reliability. Each is short of a bar the game sets, near it, at it or beyond it.\n\nAn approach goes further only with ${word(GATE)} of them at the bar or beyond, and then against the year’s other actors. Better work raises the chance, and nothing makes it certain.`,
    steps: ['Open Career, then the Representation tab.', 'Under Why It Went This Way, press Show The Reasons.'],
    needs: ['The notice read.'],
    costs: [{ label: 'Time', value: 'None: reading it moves no clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Your Work', value: 'The best judged band of the work his office has: your showcase scenes once the School follows them up, your reel, a referring job' },
      { label: 'Room On His List', value: 'One to three openings a year, by billing and age, drawn for each year', estimate: true },
      { label: 'The Bar', value: `${word(GATE)} of the seven at it or beyond`, estimate: true },
    ],
    now: ['The table opens, and closes with Hide The Reasons.'],
    later: ['As Things Stand Now changes with your record: a new credit, a better reel, the degree, a meeting kept.'],
    interpret: ['None of it is his. The bar and the chances are the game’s own, and Room On His List is assumed.', 'At The Last Decision is kept as it was, so it reads the same after your record moves on.'],
    unavailable: ['The reasons are there once you’ve read the notice about him.'],
    mistakes: ['Reading one factor as the decision. It takes enough of them at the bar, and then the competition.'],
    next: ['Work on what’s short: a reel, newer work, a credit.'],
    related: ['career.agent', 'career.agent-answers', 'career.reel'],
    connections: [
      { to: 'career.reel', kind: 'evaluation', why: 'Your reel’s best band is part of Your Work, and a reel is part of Stage And Screen.' },
      { to: 'career.agent', kind: 'history', why: 'Each answer his office gives keeps its reasons here.' },
    ],
    example: {
      setup: `A graduate with one job judged ${BAR} and no reel.`,
      steps: ['Press Show The Reasons.'],
      result: `Your Work is At The Bar and Stage And Screen Near The Bar, until a reel shows screen work too.`,
    },
  },
  {
    id: 'career.agreement',
    title: 'The Agreement',
    goal: 'career',
    covers: ['pro.accept_agreement', 'pro.decline_agreement', 'pro.end_agreement'],
    synonyms: ['agency agreement', 'sign with an agent', 'commission', 'end representation', 'terminate the agreement'],
    questions: ['What does the agreement say?', 'How much commission does he take?', 'How do I end the agreement?'],
    where: on('representation', 'Career, Representation, The Agreement'),
    available: `From the guide’s chapter “${REP_CHAPTER}”.`,
    short: `When he offers to represent you, The Agreement shows every term before you answer, each marked A Published Rule or The Game’s Own Term. It runs a year from the day you sign it, and the offer stands ${word(AGREEMENT.offerStandsDays / 7)} weeks.\n\nSigning changes nothing at the School and gives no permission to work. It can end by agreement at any time, or under Equity’s or SAG-AFTRA’s rules, or when its year is up.`,
    steps: [
      'Read every term under The Agreement.',
      'Press Accept The Agreement, or Decline The Agreement.',
      `While it runs, press End It By Agreement, ${NO_OFFER} or ${TOO_LITTLE}. A grayed one says when it can.`,
    ],
    needs: [
      'For Accept or Decline, an offer still standing.',
      `For ${NO_OFFER}, ${AGREEMENT.noOfferDays} days with no real offer of covered work through him, and not while you’re working.`,
      `For ${TOO_LITTLE}, ${AGREEMENT.sag.waitDays} days from signing, and fewer than ${TEN} days of covered work in the last ${AGREEMENT.sag.windowDays}.`,
    ],
    costs: [{ label: 'Time', value: 'None' }, { label: 'Money', value: `Commission on covered work: ${Math.round(AGREEMENT.commission * 100)}% of gross pay, or ${Math.round(AGREEMENT.equityLowTier.rate * 100)}% on an Equity contract paying ${usd(AGREEMENT.equityLowTier.weeklyAtOrBelow)} a week or less` }],
    reads: [
      { label: 'How Long', value: 'One year from signing', estimate: true },
      { label: 'Ending It', value: `Equity’s ${AGREEMENT.noOfferDays} days and SAG-AFTRA’s ${AGREEMENT.sag.waitDays} and ${AGREEMENT.sag.windowDays} days, from their published rules` },
    ],
    now: ['Accepting makes him your agent from today. Declining closes the approach.'],
    later: [`An offer you don’t answer lapses after its ${weeks(AGREEMENT.offerStandsDays)}.`, 'When it ends, commission stays owed on contracts you made while it ran, and The Agreement says which.'],
    interpret: ['A Published Rule follows the unions’ or New York’s published rules. The Game’s Own Term is the game’s: his own agreement isn’t published.'],
    unavailable: ['He hasn’t offered you an agreement.', 'You’re not represented by him.', `Equity’s rule lets you end it once ${AGREEMENT.noOfferDays} days go by with no real offer of covered work through him.`],
    mistakes: ['Ending it while a contract made in the term is still to be paid, and expecting no commission. It stays owed.'],
    next: ['Keep your availability and your materials current: covered work comes through him.'],
    related: ['career.agent', 'career.reasons', 'documents.work'],
    connections: [
      { to: 'documents.work', kind: 'optional', why: 'Signing with him gives no permission to work: Papers, under Permission To Work, still says what you may do.' },
      { to: 'career.agent', kind: 'history', why: 'Accepting, declining and the agreement’s end each go in History With His Office.' },
    ],
    example: {
      setup: 'An offer standing, read in full.',
      steps: ['Press Accept The Agreement.'],
      result: 'Where You Stand With Him reads Represented, and The Agreement gives the day it ends and the three ways to end it sooner.',
    },
  },
];
