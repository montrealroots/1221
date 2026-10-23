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
 * From 2026-10-21 (brief 19's pay) three more, for the Work tab (`systems/propay.ts`): the pay, the commission and the
 * unions. Their figures are the rules' own too: the trust account's business days and the commission's rates
 * (`AGREEMENT`), the unions' fees (`UNIONS`), the thirty days (`UNIONS.sagAftra.joinWithinDays`), each said as a
 * published rule or an estimate as the code says it.
 * From 2026-10-21 (brief 19's J1 to J5 and A3) four more: finding work and submitting, auditions and callbacks, offers
 * and booked work, and work while at the School. Their figures are the work loop's own (`systems/projobs.ts`): a
 * posting's week, the trip and the times, the School's fourteen days, ten working days, two class days and the dean's
 * week, each the game's estimate, said so; the Bulletin's sentences are its own (yale.md §4, B27 p.148).
 */

import { CHAPTER_FOR } from '../tutorial';
import { SKILL_WORDS } from '../school';
import { formatMoney } from '../../core/money';
import { HEADSHOTS, NAME_MOST, REEL, RESUME, SESSION_HOURS, SKILL_LISTED_AT, SPECIAL_SKILLS, clockWords } from '../../systems/pro';
import { AGENT_TIMES, COOLDOWN_WORDS, GATE, REFERRAL_BAND, TEN, TIME_WORDS, TRAVEL_MINUTES, tripWords } from '../../systems/proagent';
import { YALE_DRAMA } from '../school';
import { AGENTS, agencyOf } from '../agents';
import { AGREEMENT, AUDITION_TOWNS, UNIONS } from '../careerwork';
import { BAND_LABEL } from '../../systems/coursework';
import { ESTIMATE } from '../../systems/school';
import { PAY, sagJoinUsd } from '../../systems/propay';
import { OUTSIDE_WORK, WORK } from '../../systems/projobs';
import { TRIP, routeSourceWords } from '../../systems/worktrip';
import { JURISDICTIONS } from '../jurisdictions';
import { BRIEF } from '../../systems/briefs';
import type { GuideEntry } from './types';

const CAREER = '/workspace/career';
/** A Career section's id: a parameter typed by its literals would read to `tools/title-case.mjs` as a label. */
type Section = 'overview' | 'portfolio' | 'representation' | 'opportunities' | 'work';
const on = (section: Section, label: string) => ({ route: CAREER, tab: section, label });

const CHAPTER = CHAPTER_FOR['ui.career']!.title;
/** The work loop's chapter (from 2026-10-21, brief 19's J1 to J5 and A3). */
const WORK_CHAPTER = CHAPTER_FOR['pro.submit']!.title;
/** Australia's 408, the route the Work Abroad entry teaches (`content/jurisdictions.ts`). */
const AU = JURISDICTIONS.au!.routes.find((r) => r.id === 'au-408-entertainment')!;
/** How long before the first call the flight out lands, at least: the trip's own rule (`TRIP`). */
const AHEAD = TRIP.arriveBeforeHours % 24 === 12 ? `${TRIP.arriveBeforeHours === 36 ? 'a day and a half' : `${(TRIP.arriveBeforeHours - 12) / 24} and a half days`}` : `${TRIP.arriveBeforeHours} hours`;
const STEPS = `${BRIEF.steps.read.label}, ${BRIEF.steps.lines.label} and ${BRIEF.steps.rehearse.label}`;
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
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const COMMISSION = pct(AGREEMENT.commission);
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
    id: 'career.agent',
    title: 'The Agent And How To Reach Him',
    goal: 'career',
    covers: ['pro.agent_notice', 'pro.agent_check', 'pro.ask_referral', 'pro.send_materials'],
    synonyms: ['agent', 'representation', AGENT.name, AGENCY.name, 'referral', 'send my materials', 'unsolicited submission'],
    questions: ['How do I get an agent?', 'Why was my submission refused?', 'How do I get a referral?'],
    where: on('representation', 'Career, Representation'),
    available: `From the guide’s chapter “${REP_CHAPTER}”.`,
    short: `The Representation tab holds the game’s one agent, ${AGENT.name}, an agent in ${AGENCY.name}’s ${AGENCY.office.city} ${AGENCY.department.called.toLowerCase()} department. He and the agency are invented for the game: his panel says so first, before anything else.\n\n${AGENCY.policy.words} It takes your materials only through the School’s follow-up after the showcase, or a referral from someone you’ve worked with. He never gets in touch first.`,
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
      `${AGENCY.policy.words} It sees your materials only through the School’s follow-up after the showcase, or a referral from someone you’ve worked with.`,
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
      `For ${NO_OFFER}, ${AGREEMENT.noOfferDays} days with no real offer of covered work through him, the days you’re employed on covered work not counted, and not while you’re working.`,
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
    needs: ['Work you’ve booked. A student film’s pay is deferred: it’s paid only if the film earns money later, and no film in the game does, so it’s listed and never paid.'],
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
      'Deferred pay is shown and never paid: a student film pays its actors only if it earns money later, and no film in the game does.',
      'On an F-1 while you’re a student, outside acting work isn’t open to you: Yale grants CPT only for training the whole program requires, and Acting has none. On OPT after your degree, every day from a job’s first day to its last counts as a day with work, and the days before a booked job begins count as days without work. If your permission to work ends with work still booked, the company releases you: the days you worked are still paid, and the rest are called off.',
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
    short: `Your agency takes commission only on covered work, stage, film and television in the US, that you contracted while your agreement was in force. It’s taken when your pay passes through its client trust account, and shown on its own line on the Work tab and in the deposit’s line in Money.\n\nThe rate is the unions’ and the law’s: ${COMMISSION} at most, ${FIVE} on an Equity contract paying ${LOW} a week or less, and on SAG-AFTRA work only what you’re paid over scale.`,
    steps: [
      'Open Career, then the Work tab.',
      'Under each payment, read Commission: for one to come, what’s expected and why; for one received, what was taken.',
      'If your agreement has ended, read Still Owed After An Agreement Ended for the payments that still carry it.',
    ],
    needs: ['An agreement in force when you made the contract, or an offer your agency passed on in its term that you accepted within 60 days after it ended.'],
    costs: [
      { label: 'Covered Work', value: `${COMMISSION} of the gross, the most New York lets an agency take for an engagement` },
      { label: 'Equity', value: `${FIVE} on a weekly salary of ${LOW} or less, ${COMMISSION} above it` },
      { label: 'SAG-AFTRA', value: `Only what’s over scale, up to ${COMMISSION}: at scale plus ten percent you keep scale and your agency takes the ten` },
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
    short: `Your degree makes you a member of Actors’ Equity, as the School’s Bulletin says, or your first day under an Equity contract does, if that comes first. Its initiation fee is ${usd(UNIONS.equity.initiation)}, paid within three years with ${usd(UNIONS.equity.down)} down, and basic dues are ${usd(UNIONS.equity.yearlyDues)} a year, billed each May and November.\n\nA SAG-AFTRA principal role on a TV show or a theatrical or Low Budget film makes you eligible to join SAG-AFTRA. From the ${SAG_DAYS}th day after that job began, SAG-AFTRA work needs you to be a member: press Join SAG-AFTRA, about ${JOIN}.`,
    steps: [
      'Open Career, then the Work tab.',
      'Under Your Unions, read Equity’s bills: each paid, owed or due, with its date.',
      'Once SAG-AFTRA says you can join, press Join SAG-AFTRA before you take SAG-AFTRA work past its 30 days.',
    ],
    needs: ['For Equity: the degree, or a first day of work under an Equity contract.', 'For SAG-AFTRA: a SAG-AFTRA principal role worked, and the fee in your bank.'],
    costs: [
      { label: 'Equity’s Initiation Fee', value: `${usd(UNIONS.equity.initiation)} within three years: ${usd(UNIONS.equity.down)} when you join, then two parts a year apart. The two parts’ dates are estimated` },
      { label: 'Equity’s Dues', value: `${usd(UNIONS.equity.yearlyDues / 2)} each May and November, and 2.5% of Equity pay, taken from it. Taking it from the pay is estimated` },
      { label: 'Joining SAG-AFTRA', value: `About ${JOIN}: the initiation fee and half a year’s base dues, then half a year’s dues each May and November, and 1.575% of SAG-AFTRA pay. Read from a search engine’s copy of its pages`, estimate: true },
    ],
    reads: [
      { label: 'The Degree Or An Equity Contract', value: 'Equity’s membership date, the degree’s or a first day of work under an Equity contract’s, which its first bill reads' },
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
      'Under Open Calls, read a role: the project, the part, who it’s written for, what it asks, its dates and place, its pay and whether you can be seen for it. Each part is written for an actor, an actress or either, and you’re posted only the ones written for you or for either.',
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
      'A part comes round again only once the work it was cast for is over, as a new casting of the part, and its card says what came of it the last time. A part you’ve been booked for doesn’t come round again.',
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
    short: `An audition is in person, in ${AUDITION_TOWNS} at a set time, or a self-tape due by an evening. Prepare the sides first with ${STEPS}, the way you prepare a practice brief. Then press Tape It, or be there when the clock stops for the audition and press Go.\n\nCasting decides from how the audition went, how well the role suits you and how many other actors it saw. Some roles call you back for a second audition first.`,
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
      { label: 'Your Audition', value: 'Your abilities and techniques, the sides’ preparation, how well you know the project’s genres and the day’s condition, judged as every piece of work is' },
      { label: 'The Role’s Fit', value: 'How well you know its genres, each by its share as Genres explains, and its techniques against yours' },
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
    costs: [{ label: 'Time', value: 'Each work day’s hours, with the trip each way' }, { label: 'Energy', value: `${ESTIMATE.energy.rehearsal} a work day, as a School rehearsal call takes, on top of its hours awake`, estimate: true }, { label: 'Money', value: 'None: the work pays you' }],
    reads: [
      { label: 'Permission To Work', value: 'Every day of the work, against the papers you hold' },
      { label: 'The Part', value: 'Its preparation, how well you know the project’s genres, your abilities and techniques, and the day’s condition, judged as every piece of work is. A rehearsal day learns the lines faster in genres you know' },
    ],
    now: ['The work days go on your calendar, and the pay for each week is promised, due the Thursday after it. It isn’t paid yet.'],
    later: [
      'A stage part goes on your credits at its first night; a screen part when it’s shot, and as released once it comes out, when its footage can go on a reel.',
      'Miss a shoot day, or a second day of a run, and the production replaces you.',
    ],
    interpret: ['Promised pay is what the contract owes you, not money you have yet. A student film’s pay is deferred: it’s paid only if the film earns money later, and no film in the game does, so nothing is paid.'],
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
  // From 2026-10-23 (the owner's brief 25): work abroad, Sydney first, its visa and its trip (`systems/worktrip.ts`).
  {
    id: 'career.work-abroad',
    title: 'Work Abroad',
    goal: 'career',
    covers: ['pro.apply_work_visa'],
    synonyms: ['work abroad', 'work visa', '408 visa', 'filming overseas', 'flight to sydney', 'travel for work'],
    questions: ['Can I take work in another country?', 'How do I get a visa to work in Australia?', 'What happens if my visa isn’t ready?'],
    where: on('work', 'Career, Work, Your Engagements'),
    available: `From the guide’s chapter “${WORK_CHAPTER}”, once you’ve accepted work in another country.`,
    short: `Some roles are abroad: Harbor Line shoots in Sydney. Accepting one is the contract, not permission to work there. Work in Australia needs ${AU.name}, which the production supports and you apply for once you’ve accepted. Press Apply For The Visa on the engagement under Career, Work.\n\nThe production books your flights, the cars and a hotel. You land ${AHEAD} or more before your first call and home the day after your last.`,
    steps: [
      'Accept the offer, after reading what it says about the visa and the dates you’d be away.',
      'Open Career, then Work, and press Apply For The Visa on the engagement.',
      'When the clock stops for the car to the airport, press Go.',
    ],
    needs: [
      'A booking in another country whose rules are in the game: so far, Australia.',
      'A passport in force until you’re home. Papers shows yours.',
      'Not an Australian or a New Zealand citizen: an Australian needs no visa, and a New Zealander is granted one on arrival.',
    ],
    costs: [{ label: 'Time', value: `${AU.decisionDays} days for the department’s decision`, estimate: true }, { label: 'Money', value: 'None. The visa’s charge isn’t in the department’s page, and the production pays for the trip.', estimate: true }],
    reads: [
      { label: 'The Contract', value: 'The booking you’ve accepted' },
      { label: 'Your Supporter', value: 'The production’s company in Australia' },
      { label: 'Your Passport', value: 'In force until you’re home' },
    ],
    now: ['The visa is pending in Papers, under Permission To Work, tied to this work.'],
    later: [`${AU.decisionDays} days on, the department grants it, to ${AU.graceDays} days after your last work day. At the first flight, without it, you don’t go, and the production releases you with nothing owed.`],
    interpret: [`The 408’s conditions come from the department’s page: ${routeSourceWords(AU).replace(/^From the department’s page as /, '').replace(/\.$/, '')}. Its ${word(AU.decisionDays ?? 0)} days and the hotel paid by the production are estimated, and so are the flight times, from the distances.`],
    unavailable: [
      'You’ve applied already.',
      'You need a passport in force until you’re home.',
      'The rules for working there aren’t in the game.',
    ],
    mistakes: [`Applying too late. The decision takes ${word(AU.decisionDays ?? 0)} days, and you land ${AHEAD} or more before the first call.`],
    next: ['Prepare the part under Booked Work, and be awake for the car to the airport.'],
    related: ['career.offers', 'documents.work'],
    connections: [
      { to: 'documents.work', kind: 'immediate', why: 'The visa is a permission to work in Papers, pending until the department decides.' },
      { to: 'career.offers', kind: 'prerequisite', why: 'You apply for it once you’ve accepted the work abroad.' },
    ],
    example: {
      setup: 'An American graduate accepts Dana Kell in Harbor Line, eight shoot days in Sydney.',
      steps: ['Press Apply For The Visa on the engagement.', `Read the department’s answer when it comes, ${word(AU.decisionDays ?? 0)} days later, then press Go for the car to the airport.`],
      result: 'The visa is granted, the flights go through Los Angeles, and two calendar days after leaving New York the car takes you to the hotel in Sydney. The eight shoot days are paid as wages earned in Australia, with no commission.',
    },
  },
];
