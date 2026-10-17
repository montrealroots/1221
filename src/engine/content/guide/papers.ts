/**
 * SLATE — the guide's reference: papers (from 2026-10-12; `content/guide/types.ts`).
 *
 * Health cover, the doctor and the pharmacy, conditions and therapy, unemployment and SNAP, and the pensions, each read
 * from its system (`systems/health.ts`, `appointments.ts`, `clinics.ts`, `therapy.ts`, `unemployment.ts`,
 * `assistance.ts`, `socialsecurity.ts` and the other pensions). Every life begins at Yale and lives in New Haven, and
 * nothing moves it (`world/bootstrap.ts`, `newLifeConfig`), so the entries say what Connecticut's rules do, and say
 * plainly where a panel kept for Britain, Ireland, Canada or Mexico can't reach such a life.
 *
 * The tab ids are held in constants: `tools/title-case.mjs` and `tools/label-sweep.mjs` read a `tab: '...'` literal as
 * a label and would capitalize the section id the test needs lowercase.
 *
 * Corrected against the code later on 2026-10-12, after that day's fixes to health cover, therapy and SNAP. Until then
 * it said Enroll showed only once Yale Health had ended and a graduate went uncovered through August; that a plan
 * dropped or left unpaid opened 60 days to enroll; that HUSKY D's work test read last month's whole income; that Your
 * Cover called HUSKY D Medicaid; that Charity Taken Off marked a bill the charity took nothing off; that Yale's dental
 * plan ended with Yale Health and bought in August ran a few weeks; that picking The Town's First Practice again did
 * nothing; that a longer supply skipped what the bank couldn't pay and said it filled; that New Haven had no therapist
 * after Yale's, and a session missed away moved a week; that an enrolled student met SNAP's time limit; and it gave the
 * doctor's and the therapist's hours on a 24-hour clock. After that pass it still said Enroll showed at once after any
 * withdrawal and when a leave lapsed the cover, where a withdrawal by the fifteenth day of classes, or a leave, sets no
 * end ahead to enroll before (`yaleEndsAhead`) and waits for the next month's `lostAt`; quoted a refusal of Fill A
 * Longer Supply and one of Buy Dental that the screen never shows, since it hides each button then; paid a condition's
 * care "from your current account", naming neither the savings nor the overdraft `payFromCurrent` reaches; and said a
 * Yale dental plan bought "later" than September, which read as the autumn alone.
 *
 * Its worked examples were played on throwaway saves later on 2026-10-12 (`tests/guide-examples-papers.test.ts`). The
 * doctor's said a visit missed was booked again 24 days on, New Haven's wait; booked the day it was missed, a Thursday,
 * the wait ended on a Sunday, and the booking's slot (`slot` in `systems/appointments.ts`) moved it to the Monday, 25
 * days on. Nothing else in the example changed.
 *
 * Read again later on 2026-10-12, with Papers drawn over the overview's save. Its example said that afterward the save
 * was as it was; drawn, Tax Returns writes the empty records its readers make where none is kept (`returnsOf`,
 * `earningsOf`), which every reader takes for none, so the save's bytes changed and nothing in the world did. It says
 * the second now.
 *
 * Read again on 2026-10-13, after that day’s review. The doctor’s example said every booking was moved to the Monday when
 * its wait ended on a weekend, and the entry put the visit on a weekday; from that day `slot` moves a Saturday, a Sunday
 * or a public holiday where you live to the next working day, so a wait ending on Thanksgiving is booked for the Friday,
 * and the entry says so where it gives the weekday. Yale’s dental plan gave its deductible and maximum “a year”, where
 * from that day they’re kept by its plan year (`dentalYearOf`), and a plan bought in August or September has two of
 * each. An appeal won said only that what was paid over the share came back or came off the debt, where from that day a
 * debt it clears gives back what was paid past it and settles every bill that went to it. And the overview said the Tax
 * Returns tab held a return each February, where from that day a year with nothing owed or due back and income under
 * the standard deduction has none, unless it’s a student’s on an F-1 (`registerTaxReturn` in `systems/taxreturn.ts`).
 *
 * Read again on 2026-10-15, when New Haven gained Yale Health’s Student Health beside Fair Haven (`content/clinics.ts`).
 * Until then the doctor’s entry said New Haven kept one practice and drew no Your Doctor box; it says now that a Yale
 * student has two, what each takes, how soon each sees you and when Yale Health stops, and that Care And Its Bills says
 * what a plan paid. It said a prescription doesn’t run out in America without having read Connecticut’s rule; it gives
 * the rule now.
 */

import { formatMoney } from '../../core/money';
import { MS_DAY } from '../../core/time';
import { CHAPTER_FOR } from '../tutorial';
import { CONSULT_HOUR, CONSULT_MINUTES, US_DAYS, US_METRO_AVERAGE_DAYS } from '../appointments';
import { ED_MINUTES, US_PHARMACIES } from '../carevisits';
import { SUMMER_CABARET, YALE_DRAMA } from '../school';
import {
  BENCHMARK, CARE, CHARITY, CHRONIC, CONNECTICUT_ENROLLMENT, CONNECTICUT_UI, DENTAL_PLANS, ENROLLMENT, INSULIN, MEDICAL_CPI,
  MEDICAL_DEBT, NHS, PHARMACY, PLANS, POVERTY_LINE, PREMIUM_CREDIT, PUBLIC_COVER, byYear,
} from '../safetynet';
import { DENIALS, FILL, REVIEW_MONTHS, grown } from '../../systems/health';
import { REFERRAL_DAYS, REFERRAL_SHARE } from '../../systems/appointments';
import { DOCTOR_KINDS, clinicsIn } from '../../systems/clinics';
import { SESSION_HOUR, THERAPISTS, THERAPY } from '../../systems/therapy';
import { monetary } from '../../systems/unemployment';
import { SNAP, snapMonth } from '../../systems/assistance';
import { SOCIAL_SECURITY, claimFactor } from '../../systems/socialsecurity';
import { STATE_PENSION } from '../../systems/statepension';
import { BIENESTAR, IRISH_PENSION } from '../../systems/homepensions';
import { IMSS } from '../../systems/imss';
import type { GuideEntry } from './types';

// ---------------------------------------------------------------------------
// The words for a figure
// ---------------------------------------------------------------------------

const usd = (cents: number): string => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
const gbp = (pounds: number): string => formatMoney(Math.round(pounds * 100), 'GBP');
const pct = (share: number): string => `${Math.round(share * 1000) / 10}%`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayMonth = ([month, day]: readonly [number, number]): string => `${day} ${MONTHS[month - 1]}`;
const fullDay = (key: string): string => `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
/** An hour on the clock, 17 as 5:00 PM (from 2026-10-12: until then the appointment's and the session's read 10:00 and 17:00). */
const clock = (hour: number): string => `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
/**
 * Where a bill or a premium paid from the current account comes from (`payFromCurrent`): the primary account, then the
 * easy-access savings at its bank where Savings Covers The Current Account is On, then its overdraft. Until 2026-10-12
 * this said "its overdraft or linked savings", which named neither the bank nor the order.
 */
const FROM_CURRENT = 'your current account, then the easy-access savings at its bank where Savings Covers The Current Account is On, then its overdraft';

// ---------------------------------------------------------------------------
// Where, and the chapter that opens it
// ---------------------------------------------------------------------------

const CHAPTER = CHAPTER_FOR['ui.papers']!.title;
const ROUTE = '/workspace/papers';
const HEALTH = 'health';
const BENEFITS = 'benefits';
const NEW_HAVEN = YALE_DRAMA.cityId;

// ---------------------------------------------------------------------------
// The rules' figures, as Connecticut and New Haven read them
// ---------------------------------------------------------------------------

const [LINE_FROM, LINE_CENTS] = POVERTY_LINE[POVERTY_LINE.length - 1]!;
const LINE_YEAR = Number(LINE_FROM.slice(0, 4));
const HUSKY_TO = Math.round(((LINE_CENTS / 12) * PUBLIC_COVER.medicaidShare) / 100) * 100;
const COVERED_CT_TO = Math.round(((byYear(POVERTY_LINE, LINE_YEAR - 1) / 12) * PUBLIC_COVER.coveredCtShare) / 100) * 100;
// Every year the rules hold a benchmark for, not only the last: a life begun in 2026 pays 2026's first.
const BENCH_WORDS = BENCHMARK.ct.map(([from, cents], i) => `${usd(cents)} a month ${i === 0 ? 'in' : 'from'} ${from.slice(0, 4)}`).join(' and ');
const RENEW_CT = PUBLIC_COVER.renewMonthsCt;
const SILVER = PLANS['marketplace-ct']!;
const YALE_PLAN = PLANS.yale!;
const CT_CHARITY = CHARITY.connecticut;
const YALE_DENTAL = DENTAL_PLANS.yale;
const OPEN_FROM = dayMonth(CONNECTICUT_ENROLLMENT.openFrom);
const OPEN_UNTIL = dayMonth(CONNECTICUT_ENROLLMENT.openUntil);
const SPECIAL = ENROLLMENT.specialDays;
// After the degree Yale Health covers to 31 July (`yaleUntil`), and Enroll shows from the special days before its end
// (`mayEnroll`, from 2026-10-12): 2 June in any year.
const ENROLL_OPENS = new Date(Date.UTC(2029, 7, 1, 12) - SPECIAL * MS_DAY);
const ENROLL_OPENS_ON = `${ENROLL_OPENS.getUTCDate()} ${MONTHS[ENROLL_OPENS.getUTCMonth()]}`;
const MARKUP = CARE.uninsuredMarkup;

const HERE = clinicsIn(NEW_HAVEN);
const PRACTICES = HERE.filter((c) => DOCTOR_KINDS.includes(c.kind)).map((c) => c.name);
// The first practice that sees anybody is where a visit goes with nothing picked; Yale Health’s sees Yale students it covers.
const PRACTICE = HERE.find((c) => DOCTOR_KINDS.includes(c.kind) && c.members === null)?.name ?? 'the town’s first practice';
const YALE_PRACTICE = HERE.find((c) => c.members === 'yale')?.name ?? 'Yale Health';
const EMERGENCY_ROOM = HERE.find((c) => c.kind === 'emergency-department')?.name ?? 'the town’s hospital';
const WAIT = Math.round(US_DAYS[NEW_HAVEN] ?? US_METRO_AVERAGE_DAYS);
const YALE_WAIT = HERE.find((c) => c.members === 'yale')?.waitDays ?? WAIT;
const YALE_SOON = YALE_WAIT === 1 ? 'the next weekday' : `${YALE_WAIT} days on`;
// What the uninsured are billed for a visit in 2026 (`shareOf`): SLATE's price grown to the year, times the markup. It's
// what a Yale Health member's visit at Fair Haven costs from 2026-10-15, Fair Haven publishing no fee of its own.
const UNINSURED_VISIT = Math.round(grown(CARE.price.visit, 'visit', Date.UTC(2026, 6, 1)) * MARKUP);
const CHAINS = US_PHARMACIES.map((c) => `${c.name.replace(' Pharmacy', '')} ${usd(Math.round(c.generic * 100))}`).join(', ');
const WALMART = US_PHARMACIES.find((c) => c.id === 'walmart');
const LONGEST = FILL.holiday.us!;
const FILLS = Math.ceil(LONGEST / FILL.us);
const US_REFERRAL = REFERRAL_SHARE.us!;

const YALE_COUNSELING = THERAPISTS.find((t) => t.yale)!;
// New Haven's private practice, which sees anybody at its own fee (from 2026-10-12, `systems/therapy.ts`).
const PRIVATE_THERAPIST = THERAPISTS.find((t) => t.cityId === NEW_HAVEN && !t.yale && !t.nhs)!;
const PRIVATE_SESSION = usd(Math.round(PRIVATE_THERAPIST.price * 100));
const LEFT = CHRONIC.untreated;

const [CT_FLOOR_FROM, CT_FLOOR] = CONNECTICUT_UI.floor[0]!;
const [CT_FLOOR_LATER_FROM, CT_FLOOR_LATER] = CONNECTICUT_UI.floor[CONNECTICUT_UI.floor.length - 1]!;
const CT_FLOOR_WORDS = CT_FLOOR_LATER === CT_FLOOR
  ? usd(CT_FLOOR)
  : `${usd(CT_FLOOR)} in ${CT_FLOOR_FROM.slice(0, 4)} and ${usd(CT_FLOOR_LATER)} from ${CT_FLOOR_LATER_FROM.slice(0, 4)}, estimated by the statute’s index,`;
// The floor a claim is filed at, by its year: a withdrawal can file in 2026, a graduate later.
const CT_FLOOR_SHORT = CT_FLOOR_LATER === CT_FLOOR ? usd(CT_FLOOR) : `${usd(CT_FLOOR)} (${usd(CT_FLOOR_LATER)} from ${CT_FLOOR_LATER_FROM.slice(0, 4)})`;
const PARTIAL = CONNECTICUT_UI.partialShare === 2 / 3 ? 'two-thirds' : pct(CONNECTICUT_UI.partialShare);
const STIPEND = SUMMER_CABARET.stipendWeekly;
// A summer with the company, as 2026's dates pay it: four Fridays' stipend in June, nine in July and August.
const JUNE_PAY = 4 * STIPEND;
const LATER_PAY = 9 * STIPEND;
const CLAIM = monetary('ct', [JUNE_PAY, LATER_PAY, 0, 0], 'USD', LINE_YEAR + 3);
const SNAP_NOW = SNAP.fy[SNAP.fy.length - 1]!;
const SNAP_FULL = snapMonth(0, 0, Date.parse(`${SNAP_NOW.from}T12:00:00Z`));

const SS = SOCIAL_SECURITY;
const AT_EARLIEST = claimFactor((SS.earliestAge - SS.fullAge) * 12);
const AT_LATEST = claimFactor((SS.latestAge - SS.fullAge) * 12);
const A_YEAR_LATE = claimFactor(12) - 1;
const SUMMER_CREDITS = Math.min(4, Math.floor((JUNE_PAY + LATER_PAY) / (SS.perCredit * 100)));
const SUMMER_WEEKS = (JUNE_PAY + LATER_PAY) / STIPEND;

export const PAPERS: readonly GuideEntry[] = [
  {
    id: 'papers.overview',
    title: 'Papers',
    goal: 'papers',
    covers: ['ui.papers'],
    synonyms: ['paperwork', 'your affairs', 'forms', 'papers screen', 'papers tabs'],
    questions: ['Where are my tax returns?', 'Where do I see my health cover?', 'Where do I claim unemployment or SNAP?', 'Where are my passport and ID?', 'Why is Papers locked?'],
    where: { route: ROUTE, label: 'Papers, Your Affairs On Home, Or The Menu' },
    available: `From the guide’s chapter “${CHAPTER}”.`,
    short: 'Papers is where your official paperwork lives: each year’s tax return, your health cover and the bills for your care, unemployment, SNAP and pensions, your passport and ID, and your permission to work. Its five tabs are Tax Returns, Health Cover, Unemployment, Passport And ID and Permission To Work. You reach it from the Papers button on the Papers line in Your Affairs on Home, from Papers on the menu, or from Go There on a notice about any of these.',
    steps: [
      `Read “${CHAPTER}” in the guide and press I’ve Read It. Papers joins the menu, and the Papers line in Your Affairs on Home gets its Papers button.`,
      'Press Papers on that line, or on the menu.',
      'Pick a tab. Papers opens on Tax Returns the first time. After that, while the game stays open, it opens on the tab you left it on. The tab is remembered on screen, not in your save.',
      'With a tab focused, the arrow keys move between tabs, and Home and End jump to the first and the last.',
    ],
    needs: [`Your Affairs shows the Papers line from a school life’s first day. Until you’ve read “${CHAPTER}”, the line is a locked panel with Read About It.`],
    costs: [{ label: 'Time', value: 'None: opening Papers and moving between its tabs doesn’t move the clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'The Papers Line On Home', value: 'What covers you this month and an open unemployment claim’s weekly amount, with an alert for no cover, a return due and tax owed' },
      { label: 'Each Tab', value: 'Read from the rules behind it the moment you look: your returns, your cover and bills, your claims and pensions, your documents' },
    ],
    now: ['Opening the screen and its tabs changes nothing in the game. Each button on it does what its own entry says.'],
    later: [],
    interpret: [
      // Until 2026-10-13 this said tax owed grew each month whenever it was owed; Home’s alert says so only once a
      // return’s due date has passed, from which interest and the late-payment penalty run (`growing`, ui/screens/Home.tsx).
      'The Papers line on Home shows what needs doing as an alert: “You have no health cover.”, a return that’s due with what filing it would pay, and tax owed, with its interest and a late penalty growing each month once its return’s due date has passed.',
      'Cover on the line names what covers you this month: Yale Health, HUSKY D, Covered Connecticut or Marketplace Plan, or none. A program shows by its own name, as Your Cover shows it.',
    ],
    next: [
      'Start with whatever the Papers line on Home flags: a return due, tax owed, or no health cover.',
      'Each tab’s panels have their own How This Works, which explains that part in detail.',
    ],
    unavailable: [`Until you’ve read “${CHAPTER}”, Papers is off the menu, and Home’s Papers line is a panel marked Locked. Its Read About It opens the guide at that chapter.`],
    mistakes: [
      'Each tab is a view: moving between tabs files, pays and claims nothing, so there’s nothing to undo.',
      'Leaving Papers, or switching to another of its tabs, with an amount half typed in a payment box loses it: only the tab showing is kept on screen. Opening How This Works over it doesn’t lose it.',
    ],
    related: ['papers.health-cover', 'papers.benefits', 'papers.pensions', 'taxes.return', 'documents.passport-id', 'documents.work'],
    connections: [
      { to: 'start.guide', kind: 'prerequisite', why: `“${CHAPTER}” in the guide opens Papers and every button on it.` },
      { to: 'papers.health-cover', kind: 'optional', why: 'The Health Cover tab holds your cover, your doctor, your conditions and your medical bills.' },
      { to: 'taxes.return', kind: 'optional', why: 'The Tax Returns tab holds each year’s return, ready each February for a year where you owe tax or are due a refund, or had income of the standard deduction or more, and every year for a student on an F-1.' },
      { to: 'day.needs', kind: 'optional', why: 'Notices about your cover, a bill, an appointment, a claim or a document carry Go There, which opens Papers.' },
    ],
    example: {
      setup: `A first-year in New Haven, the day “${CHAPTER}” is read.`,
      steps: ['Press Papers on the Papers line in Your Affairs.', 'Open the Health Cover tab.', 'Press H for Home, then Papers on the menu.'],
      result: 'Papers opens on Tax Returns; Health Cover shows Yale Health under Your Cover, This Month; back from Home, the screen is on Health Cover, where you left it. The clock didn’t move, and nothing in the world changed.',
    },
  },
  {
    id: 'papers.health-cover',
    title: 'Health Cover',
    goal: 'papers',
    covers: ['health.enroll', 'health.apply', 'health.request_hardship', 'health.drop', 'health.appeal', 'health.apply_aid', 'health.prepay', 'health.pay_bill', 'health.dental'],
    synonyms: ['medicaid', 'husky d', 'covered connecticut', 'marketplace', 'access health ct', 'yale health', 'enroll', 'premium', 'medical bill', 'medical debt', 'claim denied', 'charity care', 'dental plan', 'prescription prepayment certificate'],
    questions: ['What covers me after Yale?', 'How do I get HUSKY D?', 'When can I enroll in the marketplace?', 'Why was my claim denied?', 'What happens if I don’t pay a medical bill?', 'Can a hospital bill be reduced?', 'Do I need a dental plan?'],
    where: { route: ROUTE, tab: HEALTH, label: 'Papers, Health Cover: Your Cover, The Marketplace, A Dental Plan, Care And Its Bills' },
    available: `From the guide’s chapter “${CHAPTER}”. Enroll shows when you may enroll. While Yale Health covers you, that’s only in its last ${SPECIAL} days, once its end is set.`,
    short: `Health cover pays for your care. Yale Health covers you while you’re at the School, and the School bills it each term. From ${SPECIAL} days before it ends, Enroll on The Marketplace takes you into HUSKY D or Covered Connecticut, with no premium, whenever last month’s income is low enough. Otherwise it buys Access Health CT’s silver plan, in open enrollment, in those ${SPECIAL} days, or within ${SPECIAL} days of losing cover. Each piece of care brings a bill for what your plan leaves you to pay, due in ${MEDICAL_DEBT.dueDays} days. Care And Its Bills is where you appeal a denied claim, ask a Connecticut hospital for its charity care and pay off anything that went to medical debt.`,
    steps: [
      'Open Papers, then Health Cover. Your Cover says what covers you This Month.',
      'Read the line under The Marketplace: it says whether you may enroll now, and why. When Enroll shows beside the title, press it. The toast names what you’re enrolled in and the day it starts.',
      'Once you’re enrolled, Drop The Plan, in the same place, ends a plan of your own at the end of the month.',
      'In Care And Its Bills, each row has its care, its date, Your Share and Due. In the Assistance column, Appeal It answers a denied claim, and Apply For Assistance asks a Connecticut hospital to apply its financial assistance to a bill.',
      'When a bill has gone to medical debt, Pay It Off beside the panel’s title pays all of it.',
      'While Yale Health covers you, A Dental Plan offers Buy Dental: Yale Delta Dental Basic, paid once for Yale’s plan year, to 30 September.',
    ],
    needs: [
      `Enroll: no plan of your own already, and Yale Health ended, in its last ${SPECIAL} days once its end is set, or lapsed on a personal leave without Affiliate cover.`,
      // Until 2026-10-16 this said HUSKY D asked $580 of pay in the month before, and Covered Connecticut any income from the
      // poverty line: income of any kind meets the work rules, a renewal reads six months, and an income HUSKY D's line
      // takes isn't Covered Connecticut's. Until 2026-10-17 it named 80 hours' work first, which nobody off the School can
      // do in SLATE and SLATE stopped reading that day (brief 12), and "school at least half-time" for the School.
      `HUSKY D: last month’s income at or under ${pct(PUBLIC_COVER.medicaidShare)} of the poverty line, ${usd(HUSKY_TO)} a month in ${LINE_YEAR}, and from 1 October 2026 US citizenship or a green card held five years. From ${fullDay(PUBLIC_COVER.workFrom)}, some of the month before you enroll spent at the School, or ${usd(PUBLIC_COVER.workEarnings)} of income of any kind in it, or an exception: 65 or over, SNAP received under its work rules, or a stay in hospital you ask for.`,
      `Covered Connecticut: last month’s income over HUSKY D’s line and at or under ${pct(PUBLIC_COVER.coveredCtShare)} of the year before’s poverty line, ${usd(COVERED_CT_TO)} a month in ${LINE_YEAR}, and at least 100% of it, since it comes with the premium tax credit; an income HUSKY D’s line takes isn’t Covered Connecticut’s, whatever your status. For a citizen or anyone lawfully present, and from 1 January 2027 for a citizen or a green card holder, not a student in F-1 status or a graduate on OPT.`,
      `Apply For HUSKY D: HUSKY D’s income and status met, and its work rules not shown in the month before, with no application of yours waiting. Request A Hardship Exception: a notice of noncompliance waiting on its answer, and a stay in hospital in a month it assessed.`,
      `The marketplace: Connecticut’s open enrollment, ${OPEN_FROM} to ${OPEN_UNTIL}; the ${SPECIAL} days before Yale Health’s cover ends, once its end is set by the degree, a withdrawal or a dismissal; or within ${SPECIAL} days of losing cover, which a plan you dropped or left unpaid isn’t. And not having stayed past your US status.`,
      `Appeal It: a denied claim, within ${DENIALS.appealDays} days of the care. Apply For Assistance: a Connecticut hospital’s bill for an emergency or a stay, before it’s due.`,
    ],
    costs: [
      { label: 'Yale Health', value: `Billed by the School each term: your living-expense scholarship meets it where Yale finds need, and otherwise it’s taken from your bank. It leaves you $0 for a visit or urgent care, ${usd(YALE_PLAN.emergency)} for the emergency room and ${usd(YALE_PLAN.stayCopay ?? 0)} an admission to ${usd(YALE_PLAN.stayCopayCap ?? 0)} a year, ${usd(YALE_PLAN.outOfPocket)} a year at most` },
      { label: 'HUSKY D And Covered Connecticut', value: 'No premium, and $0 for a visit, urgent care, the emergency room, a stay and a prescription' },
      { label: 'The Marketplace Premium', value: `The benchmark silver plan, ${BENCH_WORDS}, taken in full on the first of each month`, estimate: true },
      { label: 'Access Health CT Standard Silver', value: `${usd(SILVER.visit)} a visit, ${usd(SILVER.urgent)} urgent care, ${usd(SILVER.emergency)} the emergency room, a stay ${usd(SILVER.stayCopay ?? 0)} after a ${usd(SILVER.deductible)} deductible, ${usd(SILVER.outOfPocket)} a year at most` },
      { label: 'Uninsured', value: `The commercial price times ${MARKUP}: a visit ${usd(CARE.price.visit * MARKUP)} at ${MEDICAL_CPI.base.visit[0]}’s prices and an emergency ${usd(CARE.price.emergency * MARKUP)} at ${MEDICAL_CPI.base.emergency[0]}’s, each grown since by its price index. An emergency or a stay at a Connecticut hospital has its financial assistance taken off as it’s billed: free to ${pct(CT_CHARITY.freeTo)} of the poverty line, ${pct(CT_CHARITY.discount)} off to ${pct(CT_CHARITY.discountTo)}`, estimate: true },
      { label: 'Yale Delta Dental Basic', value: `${usd(YALE_DENTAL.premium)} for Yale’s plan year, paid at once and covering from that day: bought in August or September, to 30 September a year on; bought from October to July, to the next 30 September. Cleanings in full, and ${pct(YALE_DENTAL.basic)} of a filling paid by the plan after a ${usd(YALE_DENTAL.deductible)} deductible, to ${usd(YALE_DENTAL.max)}, both kept by Yale’s plan year, 1 October to 30 September: bought in August or September, the weeks before 1 October are the plan year then ending, with a deductible and a maximum of their own` },
      { label: 'Time', value: 'None: enrolling, appealing, applying and paying move no clock' },
    ],
    reads: [
      { label: 'Last Month’s Income', value: 'All the income your record holds for the calendar month before, against the poverty line: wages and work-study’s pay, and the unemployment benefit, interest and pensions paid that month too' },
      // Until later on 2026-10-15 this said being at the School, enrolled and not on leave, passed: the School was read at
      // the moment asked, not over the month (`enrolledIn`).
      // Until 2026-10-16 this read the month before alone, at renewal too, and said a benefit, interest or a pension didn't
      // count: CMS's rule of 3 June 2026 reads the month's income of any kind.
      // Until 2026-10-17 it said a month met them with 80 hours of work paid in it, first: nobody off the School can work
      // in SLATE, and the hours were read no more from that day (brief 12). Later that day its label, Last Month’s Work,
      // went too: it headed a rule that reads no work (the second reader’s check, brief12-health.json).
      { label: 'The Work Rules’ Months', value: `For HUSKY D’s work rules: the calendar month before you enroll, and at renewal any one of the ${PUBLIC_COVER.workLookBack.ct.renew} calendar months before the renewal’s. A month meets them with any of it spent at the School (the month you leave it, on a leave, by withdrawing or with the degree, counts whole, and so does the month you come back), ${usd(PUBLIC_COVER.workEarnings)} of income of any kind (pay, an unemployment benefit, interest or a pension), being 65 or over for any of it, SNAP received in it while you were under SNAP’s work rules (out of school, no unemployment claim, 18 to 64), or a stay in hospital in it, if you ask` },
      { label: 'Your Status', value: 'US citizenship or five years with a green card for HUSKY D from 1 October 2026; lawful presence for the marketplace, and for Covered Connecticut until 2027, when it’s a citizen’s or a green card holder’s', estimate: false },
      { label: 'A Denied Claim', value: `${pct(DENIALS.rate)} of a marketplace plan’s claims, billed as if you were uninsured; insurers uphold ${pct(DENIALS.upheld)} of appeals`, estimate: true },
      { label: 'The Hospital’s Financial Assistance', value: `Your last twelve months’ income against the poverty line: free to ${pct(CT_CHARITY.freeTo)}, ${pct(CT_CHARITY.discount)} off to ${pct(CT_CHARITY.discountTo)}` },
      { label: 'Medical Debt On Your Record', value: `${usd(MEDICAL_DEBT.reportAt)} or more, unpaid ${MEDICAL_DEBT.reportAfterDays} days, and you living outside New York and California` },
    ],
    now: [
      // From 2026-10-16 (brief 09's journeys): until then HUSKY D, too, started on the first of next month.
      'Enroll: HUSKY D starts on the first of the month you enroll, and reaches back to the first of an earlier month in which you had care with nothing covering you and HUSKY D would have taken you, three months back for an application in 2026 and one from 2027, the care since priced again as HUSKY D’s; another program or a plan starts on the first of next month. Enrolled before Yale Health’s cover ends, each starts on the first of the month on or after its end, so a graduate’s starts 1 August with no gap. The toast names it and its day.',
      // From 2026-10-16 (brief 09's journeys): until then a renewal's notice stayed after a drop, and its hardship was said
      // granted while nothing was renewed; and Drop The Plan stayed for a second press.
      'Drop The Plan: it ends on the first of next month, and no later premium is taken. The toast says “Your plan ends at the end of the month. Dropping it doesn’t open a special enrollment period.”, and the panel says “Dropped: it ends on …” instead of the button. A renewal’s notice of noncompliance waiting on an answer goes with the program it would renew, and so does its decision.',
      `Apply For HUSKY D: the notice “A Notice Of Noncompliance” comes at once, naming the month read, the day to answer by (${PUBLIC_COVER.noticeReceivedDays} days for it to reach you, then ${PUBLIC_COVER.answerDays} more) and what follows. Applying isn’t being covered: you aren’t covered by HUSKY D yet, and you can still buy a marketplace plan.`,
      'Request A Hardship Exception: decided at once. A renewal is renewed, with “Your Public Cover Is Renewed” or, moving from Covered Connecticut, “Your Public Cover Changed At Renewal”; an application is approved, “Public Cover Approved”, from the first of the month you applied in, or of an earlier month with care in it as Enroll reaches back, and a marketplace plan bought meanwhile ends as it begins.',
      `Appeal It: the bill reads Appealed, and its answer comes ${DENIALS.decideDays} days on.`,
      `Apply For Assistance: decided at once. Free Care clears the bill, ${pct(CT_CHARITY.discount)} Off cuts it, and Over The Limit leaves it as it was. The toast for a bill helped says “The hospital applied its financial assistance to this bill.”`,
      'Pay It Off: the whole debt is paid from your current account, and every bill that went to it reads Settled.',
      'Buy Dental: Yale’s year is paid at once, and the dentist is covered from today.',
    ],
    later: [
      `On the first of each month the marketplace premium is taken from ${FROM_CURRENT}. If it can’t be paid, the plan ends that day, and a plan left unpaid opens no special enrollment.`,
      // Until 2026-10-16 this said a renewal read last month's work, and ended cover at once over every line or short of the
      // work, with the notice “Your Public Cover Ended At Renewal”; and a renewal kept said nothing.
      `A program comes up for renewal: in Connecticut every ${RENEW_CT[0]![1]} months, and from ${fullDay(RENEW_CT[RENEW_CT.length - 1]![0])} every ${RENEW_CT[RENEW_CT.length - 1]![1]}. It’s checked on last month’s income again and, for HUSKY D from ${fullDay(PUBLIC_COVER.workFrom)}, on its work rules in any one of the ${PUBLIC_COVER.workLookBack.ct.renew} months before. Kept, the notice “Your Public Cover Is Renewed” says to when, and which month met its work rules, and how. Where last month’s income now places you in the other program, under HUSKY D’s line from Covered Connecticut or over it and within Covered Connecticut’s from HUSKY D, you’re renewed into that one from the same day, with no gap and no premium, and the notice “Your Public Cover Changed At Renewal” says so; into HUSKY D its work rules are asked first. Over every line, or out of the status it asks, it ends at the end of the month at least ${PUBLIC_COVER.advanceNoticeDays} days on, with the notice “Your Public Cover Ends” naming the day.`,
      `Short of HUSKY D’s work rules at a renewal, or on Apply For HUSKY D, “A Notice Of Noncompliance” comes: you have ${PUBLIC_COVER.noticeReceivedDays} days for it to reach you and ${PUBLIC_COVER.answerDays} more to answer, and a member stays covered meanwhile. Request A Hardship Exception answers it where a month it read had a stay in hospital. Unanswered, it’s decided the day after: a renewal’s cover ends at the end of the month at least ${PUBLIC_COVER.advanceNoticeDays} days on, with “Your Public Cover Ends”; an application is denied, with “Public Cover Denied”. Either way you can apply again in any month after one that meets the rules, and the marketplace sells to you, without the premium tax credit while HUSKY D would take you but for its work rules.`,
      // Until 2026-10-15 a renewal that found her income in the other program ended her cover, and this said only that
      // failing either test ended it.
      // Until 2026-10-15 Covered Connecticut ran on into 2027 for a student in F-1 status, and beside Yale Health once a
      // student was back from a leave (`healthMonth`).
      'Covered Connecticut held by a student in F-1 status or a graduate on OPT ends on 1 January 2027, with the notice “Your Public Cover Has Ended”: from then the premium tax credit it comes with is a citizen’s or a green card holder’s. The marketplace still sells to you, with no credit.',
      'Back at the School from a leave, with Yale Health’s student cover again, Covered Connecticut ends at the next month’s start, with the notice “Your Public Cover Has Ended”: it’s for a person with no other cover that counts. HUSKY D stays beside Yale Health, which pays first.',
      // Until 2026-10-13 Covered Connecticut ran to its renewal out of status, and this said it ended there with a notice
      // naming the status; from that day it ends with the month, as a marketplace plan does (`healthMonth`). Until
      // 2026-10-14 a marketplace plan enrolled ahead was said to have ended too.
      'Stay past your US status and, at the next month’s start, a marketplace plan ends with the notice “Your Marketplace Plan Has Ended”, and Covered Connecticut with “Your Public Cover Has Ended”, or, where you enrolled ahead, “Your Marketplace Plan Won’t Begin” and “Your Public Cover Won’t Begin”.',
      `A bill still open on its due date, ${MEDICAL_DEBT.dueDays} days on, is taken from ${FROM_CURRENT}, if between them they can cover all of it. If not, it’s medical debt, owed to Your Providers, with the notice “A Medical Bill Went Unpaid”.`,
      `A medical debt of ${usd(MEDICAL_DEBT.reportAt)} or more, ${MEDICAL_DEBT.reportAfterDays} days after its first bill went unpaid, is reported to your credit record once, at the next month’s start, since you live in Connecticut. The notice is “A Medical Debt Is On Your Record”.`,
      `An appeal is decided ${DENIALS.decideDays} days on. Overturned, you owe only the plan’s share: what you paid over it comes back into the account your payments go to, what went to debt over it comes off the debt, and what you’d paid toward that debt past what’s left of it comes back too; a debt it clears settles every bill that went to it. Upheld, the bill stands.`,
      `Each Monday may bring care at an adult’s rates: about ${CARE.perYear.visit} doctor’s visits a year, ${CARE.perYear.emergency} emergency visits, a stay in hospital one year in ${Math.round(1 / CARE.perYear.stay)} (${CARE.stayDays} days), and the flu about one year in ${Math.round(1 / CARE.flu)}, likelier when you’re short of sleep or stressed.`,
      // Until 2026-10-16 this said the 60 days ran from that first of the month for Yale Health's end too, weeks after a
      // withdrawal's: the window ran from the month's look, not the loss (45 CFR 155.420(c)(1)), and the notice said “You have
      // 60 days” whenever it came. Found playing a withdrawal, brief 09's journeys.
      `On the first of a month that finds you without cover, a notice says “Your Health Cover Ended”, beginning “You’re uncovered from …” and the day your last cover ended. Your ${SPECIAL} days to enroll run from that day: Yale Health’s own end, after the degree 1 August, after a withdrawal thirty days from it, which can be weeks before the notice; a program’s at its renewal, at a month’s end; and Yale Health canceled back in time, by a withdrawal by the fifteenth day of classes or a leave begun before them, from the day it was canceled. Told on the day, the notice says “You have ${SPECIAL} days to enroll in the marketplace”; told later, it names the last day, “You can enroll in the marketplace until …”; and where last month’s income qualifies you for HUSKY D or Covered Connecticut, that it takes you at any time, with no premium. A plan you dropped or left unpaid opens no such days, and the notice says the way back is open enrollment, or a month’s income that qualifies you for HUSKY D or Covered Connecticut. Out of status, it says neither the marketplace nor Covered Connecticut will take you.`,
      'Yale Delta Dental Basic runs to its 30 September whatever happens to Yale Health, through August and September after the degree too. Paid for the year, it can’t be dropped.',
    ],
    interpret: [
      'Your Cover, This Month, reads None, in amber, when nothing covers you.',
      'The subtitle of Care And Its Bills shows what you’ve paid this year toward the year’s most; past it, your plan leaves you nothing more for care. HUSKY D and Covered Connecticut have no most: care costs you nothing on them, a prescription costs only its copay where the program has one, and the subtitle says only what you’ve paid.',
      // From 2026-10-16 a prescription filled in a lapse is priced again with the care (brief 09's journeys): until then it kept
      // the pharmacy's cash price after Affiliate cover was bought back to the lapse's start.
      `In the bills table, Due shows a date, Settled, Owed As Debt or Credited. A change of cover back in time, a withdrawal by the fifteenth day of classes or Affiliate cover bought on a leave, leaves each bill as it was issued and adds a line of its own: more owed is billed on it; less owed reads below nothing, Credited, and comes off the bill still open first, which then shows what’s left of the share it was issued at; and Plan Paid on the line is the plan’s change, below nothing where the plan took its part back. A prescription filled in that time is priced again the same way, its line Credited with what comes back to the account your payments go to, or billed with what more is owed. In Assistance, Assistance Taken Off means the hospital screened an uninsured bill when it was billed and took something off it; over ${pct(CT_CHARITY.discountTo)} of the poverty line it took off nothing, and the bill reads Over The Limit.`,
      'The toast after Enroll, Your Cover and the subtitle of Care And Its Bills each name a program by its own name, HUSKY D or Covered Connecticut. The marketplace’s plan reads Marketplace Plan in Your Cover, and Access Health CT Standard Silver over the bills.',
      // Until 2026-10-16 this said interest, a benefit or a pension counted toward neither, and that the credit was only
      // over 138%, and none on a 1040-NR. Until 2026-10-17 it said Medicaid asked 80 hours' work first (brief 12).
      `The Marketplace says Medicaid’s work rules, HUSKY D’s here, are met from 2027 by a month you spend any of at the School, or one with ${usd(PUBLIC_COVER.workEarnings)} of income: the one before you apply, and any of the ${PUBLIC_COVER.workLookBack.ct.renew} before a renewal. Income of any kind counts toward the ${usd(PUBLIC_COVER.workEarnings)}, interest, a benefit and a pension as pay does.`,
      `A marketplace premium is paid in full. The return gives back what’s over your share of income, for an income over ${pct(PUBLIC_COVER.medicaidShare)}, or from 100% where your status keeps you from HUSKY D, and up to ${pct(PREMIUM_CREDIT.cutoff)} of the poverty line; on a 1040-NR too, in 2026, and from 2027 only for a citizen or a green card holder.`,
    ],
    unavailable: [
      '“You’re already enrolled.”, or “You’re already enrolled, from ….”: one plan at a time.',
      '“Yale Health covers you while you’re at the School.”: Enroll stays off the screen while you study, unless a personal leave without Affiliate cover lapses it.',
      `“Yale Health covers you until …. You can enroll from …, ${SPECIAL} days before that cover ends.”`,
      `“It’s outside open enrollment, … to …, and you haven’t lost cover in the last ${SPECIAL} days.”`,
      'Stayed past your US status: the marketplace sells only to a citizen or a person lawfully present.',
      // From 2026-10-15: until then Enroll asked no work of somebody applying for HUSKY D.
      // Until 2026-10-16 the sentence said “of earnings” and nothing of an exception, and it was the end of it: Apply For
      // HUSKY D takes the application on its notice since. Until 2026-10-17 it began “80 hours’ work” (brief 12).
      `HUSKY D, its work rules not shown: “From January 1, 2027, … asks for … in the month before you apply, and last month had none of them.”, naming HUSKY D and what it asks: ${formatMoney(PUBLIC_COVER.workEarnings, 'USD')} of income, time at the School or an exception. The line goes on to say whether the marketplace is open to you, and Enroll shows only where it is, and buys its plan; Apply For HUSKY D, beside it, takes the application on a notice.`,
      '“Your application waits on its notice: answer it by …”: one application at a time. “Last month meets its work rules, so press Enroll instead.”: Apply For HUSKY D is for a month that doesn’t.',
      '“There’s no notice of noncompliance waiting for an answer.”, “The … days to answer ended on ….” or “None of the months it checked, …, had a stay in hospital, the one hardship the game counts.”: Request A Hardship Exception doesn’t show, and the notice’s line says which.',
      '“You have no plan of your own to drop.”, or, dropped already, “It’s already dropped, and it ends on ….”',
      '“…, so there’s no renewal left to answer.”, saying the program has ended or the day it ends: a renewal’s notice whose program has ended some other way, and Request A Hardship Exception doesn’t show.',
      `“That claim wasn’t denied.”, “It’s been appealed.” or “An appeal has to be filed within ${DENIALS.appealDays} days of the denial, and that time has passed.”: Appeal It doesn’t show.`,
      '“Only a Connecticut hospital’s bill can be put in for its financial assistance.”, “It’s already settled or past its due date.”, “The hospital’s financial assistance has already come off it.” or “It’s already been put in for the hospital’s financial assistance.”, for a bill applied for or screened over the limit at billing: Apply For Assistance doesn’t show.',
      // Until 2026-10-16 the last was “… can’t cover it.”, which said nothing of what to do.
      '“You owe nothing for care.”, or, when your current account holds less than the debt, “… holds … of the …: move money into it first, on your bank’s Move Money.” (“… has nothing to pay it with: …” where it holds nothing).',
      'A Dental Plan shows only while Yale Health covers you or a Yale plan you bought runs: once Yale Health ends, New Haven sells none. Pressed, Buy Dental says “The year costs …, more than your bank can cover.” when the bank can’t pay the year.',
      `Prepay Three Months and Prepay A Year are England’s, for its ${gbp(NHS.prescription)} prescription charge: “The prepayment certificate is only for England’s prescription charge.” A life in New Haven never sees them.`,
    ],
    next: [
      'Before Yale Health ends, enroll ahead so your new cover starts the day after it, with no gap.',
      'Keep enough in your current account on the first of each month for a marketplace premium.',
      'If a claim is denied or a hospital bill comes, use Appeal It or Apply For Assistance before its due date.',
    ],
    mistakes: [
      `Waiting for Yale’s cover to end before enrolling: after the degree Yale Health runs to 31 July, and Enroll shows from ${ENROLL_OPENS_ON}. Enrolled by 31 July, cover begins 1 August with no gap; enrolled on 1 August or later, a plan begins the first of the next month, and August goes uncovered, where HUSKY D, if last month’s income and its work rules take you, begins on 1 August all the same.`,
      `Letting the current account run dry before the first: the premium isn’t taken, the plan ends, and a plan left unpaid opens no special enrollment. Unless a month’s income qualifies you for HUSKY D or Covered Connecticut, you wait for open enrollment, ${OPEN_FROM} to ${OPEN_UNTIL}.`,
      'Leaving a bill to its due date with too little in the bank: it goes to medical debt. Pay It Off takes the whole debt from your current account at once, so wait until it holds all of it.',
      `Missing a denial: “A Claim Denied” comes as a notice, and an appeal is filed within ${DENIALS.appealDays} days of the care.`,
      `Dropping cover to save the premium: care uninsured is billed at ${MARKUP} times the commercial price, less a Connecticut hospital’s financial assistance for an emergency or a stay, and a marketplace plan dropped can’t be bought again until open enrollment.`,
      'Buying Yale’s dental plan late in its year: bought from October to July, it runs only to the next 30 September, so bought in June or July the full year’s premium buys a summer. Bought in August or September, it runs from that day to 30 September a year on.',
    ],
    related: ['papers.doctor', 'papers.conditions', 'school.leave', 'school.money', 'taxes.return', 'money.affairs'],
    connections: [
      { to: 'school.leave', kind: 'prerequisite', why: `Yale Health covers you while you’re at the School; the degree, a withdrawal, a dismissal or a personal leave without Affiliate cover ends it. A withdrawal by the fifteenth day of a term’s classes, or such a leave, ends the cover then or back to its insurance term’s start, and Enroll waits for the first of the next month, unless it’s open enrollment or last month’s income qualifies you for HUSKY D or Covered Connecticut. Otherwise Enroll shows from ${SPECIAL} days before the cover’s end: at once after a dismissal or any other withdrawal.` },
      { to: 'school.money', kind: 'history', why: 'The Yale Health plan is billed each term with the School’s charges: the living-expense scholarship meets it where need is found, and your bank pays it where none is.' },
      { to: 'papers.doctor', kind: 'evaluation', why: 'Your cover is read each time care is had: a visit, urgent care, an emergency or a stay is billed at what it leaves you.' },
      { to: 'papers.conditions', kind: 'evaluation', why: 'A condition’s month of care and each fill of its medicine are priced at your plan’s copays.' },
      { to: 'taxes.return', kind: 'history', why: 'Each marketplace premium paid is kept for the year’s premium tax credit, which the return works out.' },
      { to: 'money.affairs', kind: 'scheduled', why: `A bill unpaid at its due date goes to Owed For Medical Care, a debt your net worth counts; at ${usd(MEDICAL_DEBT.reportAt)} or more, ${MEDICAL_DEBT.reportAfterDays} days on, it marks your credit record.` },
      { to: 'school.sick', kind: 'optional', why: 'A stay in hospital excuses you from school of itself; down with the flu, Call In Sick excuses the day.' },
    ],
    // Until 2026-10-15 this example's graduate was given HUSKY D from 1 September: Enroll asked no work of somebody
    // applying, which from 2027 Medicaid does (`mayEnroll`). Until 2026-10-17 its line began “80 hours’ work” (brief 12).
    example: {
      setup: 'A US citizen in New Haven who graduated in the spring of 2027, with no pay in July.',
      steps: [
        'On 1 August a notice says “Your Health Cover Ended”.',
        `Open Papers, Health Cover. Under The Marketplace: “From January 1, 2027, HUSKY D asks for ${formatMoney(PUBLIC_COVER.workEarnings, 'USD')} of income, time at the School or an exception in the month before you apply, and last month had none of them. The marketplace is open to you, because you’re within ${SPECIAL} days of losing cover.”`,
        'Press Enroll.',
      ],
      result: `The toast says “Enrolled in the marketplace, from September 1, …”. From 1 September its premium is taken on each month’s first, and a visit costs ${usd(SILVER.visit)}. Care in August, uncovered, is billed at the uninsured price, less the hospital’s financial assistance on an emergency or a stay. Enrolled ahead, from ${ENROLL_OPENS_ON} while Yale Health still covered them, their cover would have begun 1 August.`,
    },
  },
  {
    id: 'papers.doctor',
    title: 'The Doctor And The Pharmacy',
    goal: 'papers',
    covers: ['health.choose_clinic', 'health.book', 'health.cancel_appointment', 'health.choose_pharmacy', 'health.extra_supply'],
    synonyms: ['doctor’s appointment', 'gp', 'clinic', 'referral', 'specialist', 'urgent care', 'pharmacy', 'generic', 'walmart', 'longer supply', 'missed the doctor', 'book an appointment'],
    questions: ['How do I see a doctor?', 'How long is the wait for a doctor?', 'Why did I miss my appointment?', 'How do I book again after missing the doctor?', 'Which pharmacy is cheapest?', 'What does a referral do?'],
    where: { route: ROUTE, tab: HEALTH, label: 'Papers, Health Cover, Your Doctor' },
    available: `From the guide’s chapter “${CHAPTER}”. Your Pharmacy is America’s; Fill A Longer Supply shows while you keep a condition up.`,
    short: `A doctor’s visit comes up when a week brings one, about ${CARE.perYear.visit} a year, and the game books it for you at your doctor’s practice, after its wait: in New Haven, while Yale Health covers you, ${YALE_SOON} at ${YALE_PRACTICE} for $0, unless you pick ${PRACTICE}, ${WAIT} days on at the uninsured price; once it doesn’t, ${WAIT} days on at ${PRACTICE}; at ${clock(CONSULT_HOUR)} on a weekday that isn’t a public holiday there. Keep it and you’re seen and billed at what your plan leaves you to pay. Miss it and you aren’t seen, and Book An Appointment books it again. Your Pharmacy sets the cash price a generic is filled at, Walmart’s ${usd(Math.round((WALMART?.generic ?? 0) * 100))} against the ${usd(PHARMACY.price.generic)} median of ${MEDICAL_CPI.base.rx[0]}, grown since, and your plan’s copay is never more than that price.`,
    steps: [
      'Open Papers, Health Cover. Your Doctor names where a doctor’s visit, urgent care and an emergency are had where you live, and what each would cost you now.',
      // Your Doctor's box shows only where the town keeps two practices or more (from 2026-10-13: until then New Haven's
      // one was offered beside The Town's First Practice, the same place, and this step told a New Haven life to pick).
      // From 2026-10-15 New Haven keeps two: until then this said it kept one and drew no box. Later that day a visit with
      // nothing picked went where Yale Health sends its members: until then this said it went to Fair Haven.
      `The Your Doctor box picks the practice a visit is booked at; it shows where two practices or more would see you, each with what a visit there costs you and how soon it’s booked. A Yale student Yale Health covers picks between ${YALE_PRACTICE}, $0 and ${YALE_SOON}, and ${PRACTICE}, ${usd(UNINSURED_VISIT)} in 2026 and ${WAIT} days on. Until you pick, The Practice Your Cover Uses sends a visit to ${YALE_PRACTICE}. Once Yale Health no longer covers you there’s one practice for you, ${PRACTICE}, and the line names it.`,
      'The Your Pharmacy box, in America, picks the chain whose cash price fills a generic.',
      'A booked appointment shows below with its date. When the clock reaches it, it stops and asks; be awake and out of hospital at the hour.',
      'Call It Off cancels an appointment. The visit stays owed, and Book An Appointment books it again.',
      `Fill A Longer Supply, ${LONGEST} Days, under Your Conditions, fills the medicine of every condition you keep up for that long at once, paid ahead. Where the bank can’t cover every condition’s fill, none is filled.`,
    ],
    needs: [
      `Your Doctor: a practice in the town you live in that would see you, two or more of them. In New Haven the game has ${PRACTICES.join(' and ')}; ${YALE_PRACTICE} sees only Yale students Yale Health covers: while you’re at the School, thirty days after a withdrawal past the fifteenth day of classes, not after one by it, and to 31 July after the degree.`,
      'Book An Appointment: a visit owed, missed or called off, and no appointment booked.',
      'Your Pharmacy: living in America.',
      'Fill A Longer Supply: a condition you keep up, its row showing Let It Go, and the bank able to pay every condition’s fill.',
    ],
    costs: [
      { label: 'A Visit', value: `Your plan’s copay: $0 on Yale Health at ${YALE_PRACTICE}, HUSKY D and Covered Connecticut, ${usd(SILVER.visit)} on Access Health CT’s silver plan; uninsured, the commercial price times ${MARKUP}, ${usd(UNINSURED_VISIT)} in 2026. On Yale Health a visit at ${PRACTICE} is billed at that uninsured price: Yale Health pays for a member’s care at its own Health Center, except in an emergency` },
      { label: 'Time On The Calendar', value: `${CONSULT_MINUTES} minutes, at ${clock(CONSULT_HOUR)} local time on a weekday that isn’t a public holiday where you live`, estimate: true },
      { label: 'A Generic, Uninsured', value: `${CHAINS}; at any pharmacy, the ${usd(PHARMACY.price.generic)} median of ${MEDICAL_CPI.base.rx[0]}, grown by the drug price index`, estimate: true },
      { label: 'A Longer Supply', value: `Up to ${LONGEST} days at once in America, at ${FILLS} fills’ share, paid then`, estimate: true },
    ],
    reads: [
      { label: 'The Wait Where You Live', value: `${US_DAYS['us-ny-newyork']} days in New York, ${US_DAYS['us-ca-losangeles']} in Los Angeles, ${WAIT} in New Haven: the average of fifteen metros, for a town the survey left out`, estimate: true },
      { label: 'A Practice’s Own Wait', value: `${YALE_PRACTICE} offers a same-day or next-day appointment, and the game books the next weekday; ${PRACTICE} publishes none, and New Haven’s ${WAIT} days stand there` },
      { label: 'Being There', value: 'Awake and out of hospital at its hour. An injury that keeps you from class doesn’t keep you from the doctor.' },
      { label: 'A Referral', value: `${pct(US_REFERRAL)} of the visits kept in America end in one, and the specialist is seen ${REFERRAL_DAYS.us} days on`, estimate: true },
      { label: 'An Emergency', value: `Keeps you in the department its median time: ${ED_MINUTES['us-ct']} minutes in Connecticut, at ${EMERGENCY_ROOM}`, estimate: true },
    ],
    now: [
      'Choosing a doctor or a pharmacy sets it at once, and the toast names it: “… is now your doctor.” or “… is now your pharmacy.”',
      'Book An Appointment puts it on the calendar; the toast gives its date, and a notice names the practice.',
      'Call It Off takes it off the calendar, with no toast, and leaves the visit owed: the panel reads “…: not yet seen”.',
      `Fill A Longer Supply pays at once from ${FROM_CURRENT}, moves each Medicine until date on by the days filled, and the toast says “${LONGEST} days of medicine filled.” Where the bank can’t cover every condition’s fill, it’s refused whole, “It costs more than your bank can cover.”, and nothing is filled or paid.`,
    ],
    later: [
      `At the hour, kept: “A Doctor’s Visit” comes as a notice, and what your cover leaves you is billed, due in ${MEDICAL_DEBT.dueDays} days, under the practice it was booked at; on Yale Health at ${YALE_PRACTICE}, HUSKY D or Covered Connecticut that’s $0, and no bill is made. On Yale Health at ${PRACTICE} it’s ${usd(UNINSURED_VISIT)} in 2026, and the notice says Yale Health pays for a visit at its own Health Center. On Access Health CT’s silver plan it’s the ${usd(SILVER.visit)} copay, with no deductible, and Care And Its Bills gives what the plan paid of the visit’s price under Plan Paid. Your prescriptions are renewed, a review visit marks its condition reviewed, and the visit may end in a referral, booked for the specialist’s wait.`,
      `At the hour, booked at ${YALE_PRACTICE} after Yale Health’s cover has ended: “Not Seen At Your Practice” comes as a notice, the visit goes unbilled and stays owed, and Book An Appointment books it at ${PRACTICE}, for its wait.`,
      'At the hour, missed: “Missed The Doctor” comes as a notice, the visit goes unbilled, and it stays owed until you book, or until a Monday brings another visit, which books the one owed.',
      // From 2026-10-16 (brief 09's journeys): until then only the visit's bill said so.
      `Booked at ${PRACTICE} while Yale Health didn’t cover you, and Yale Health covering you again before its day (Affiliate cover bought on a leave, or back from the leave): it stays where it was booked, “Your Appointment Is Outside Yale Health” comes as a notice, and its line under Your Doctor says to call it off and Book An Appointment, to be seen at ${YALE_PRACTICE}. Kept, it’s billed at ${PRACTICE}’s uninsured price.`,
      `Each Monday, a condition’s medicine with ${FILL.refillDays} days or fewer left is refilled for ${FILL.us} days: a generic at your pharmacy’s price, a brand at the median.`,
      // From 2026-10-13: until then a visit owed dropped every visit a Monday drew, as an appointment booked does.
      'While an appointment is booked, a new doctor’s visit drawn on a Monday is dropped, never billed, and no condition review is booked. While a visit is owed, no condition review is booked, and the next visit a Monday draws books the one owed, one appointment for both.',
    ],
    interpret: [
      '“What it would cost you here now” is your share under today’s cover, for a visit, urgent care and an emergency.',
      // From 2026-10-13 (`shareOf`): until then the NHS paid a visit at Bupa's pay-as-you-go GP, picked as one's doctor.
      'Elsewhere, a practice picked that publishes its own price, as Bupa’s pay-as-you-go GP in London does, bills a visit at that price: a public system pays its own practices, not a private GP. A life in New Haven never meets one.',
      'A visit you keep doesn’t change your wellbeing by itself. It renews prescriptions, records a review and may bring a referral. Connecticut sets no date after which a prescription for a medicine that isn’t controlled can no longer be filled (its pharmacy statutes, read on 15 October 2026), so in New Haven a renewal changes no fill, and the visit is mostly its bill.',
      // From 2026-10-15, when Yale Health's rule that a member's care is had at its Health Center was kept: until then this
      // said picking Yale Health changed how soon a student was seen, not what a visit cost, both being $0 on Yale Health.
      `In New Haven the game has ${PRACTICES.length} practices. On Yale Health, picking ${PRACTICE} changes both how soon you’re seen and what a visit costs: ${WAIT} days on and ${usd(UNINSURED_VISIT)} in 2026, against ${YALE_SOON} and $0 at ${YALE_PRACTICE}, since Yale Health pays for a member’s care at its own Health Center. Fair Haven keeps a sliding fee for the uninsured, but publishes none of its amounts, so the game bills the uninsured price there. An emergency is paid wherever it’s had.`,
      // From 2026-10-15, the recheck: until then such a booking stayed at Fair Haven played straight through and moved to
      // Yale Health on a reload (`followTheCover`).
      `An appointment is had where it was booked. One booked at ${PRACTICE} while Yale Health didn’t cover you, on a leave, is kept there and billed the uninsured price even if Yale Health covers you again before the day; Call It Off and Book An Appointment, and it’s at ${YALE_PRACTICE}.`,
    ],
    unavailable: [
      '“There’s nothing to see a doctor about.”: no visit is owed.',
      '“You have an appointment already.”',
      '“No waiting time is published where you live, so there’s nothing to book: you’re seen when you need care.”: Ireland’s way, where a visit comes unbooked.',
      '“Your doctor has to be in the town you live in.” or “That isn’t a doctor’s practice.”',
      '“Yale Health sees Yale students it covers, and it doesn’t cover you now.”: Yale Health’s practice sent once its cover has ended; the box doesn’t offer it then.',
      '“You can choose a pharmacy only in the United States.”',
      'Pressed, Fill A Longer Supply says “It costs more than your bank can cover.” when the bank can’t pay every condition’s fill.',
      'Before the chapter is read, the boxes, Call It Off and Book An Appointment are grayed, their tooltip naming the chapter.',
    ],
    next: [
      'If a visit is owed, press Book An Appointment and keep the hour free on its day.',
      'In America, pick the cheapest pharmacy under Your Pharmacy if you fill generics.',
    ],
    mistakes: [
      'Looking to go back to The Practice Your Cover Uses, The First Practice In Town or Any Pharmacy, At The Typical Price: each shows only until you pick, so you can change a choice to another practice or chain, but not undo it.',
      `Picking ${PRACTICE} while Yale Health covers you: each visit there is billed ${usd(UNINSURED_VISIT)} in 2026, where ${YALE_PRACTICE} costs $0. Picking ${YALE_PRACTICE} again puts it right for the next visit booked.`,
      `Sleeping through ${clock(CONSULT_HOUR)} on the day: the appointment is missed. Book An Appointment books again, for the full wait.`,
      'Calling an appointment off and leaving it: the visit stays owed, and no condition review is booked, until you book it or a Monday brings another visit.',
      `Filling a longer supply to save: it charges ${FILLS} fills’ share at once, the same as ${FILLS} ordinary fills. What it buys is medicine paid ahead, which lasts through a month the bank runs too low for Monday’s refill.`,
    ],
    related: ['papers.health-cover', 'papers.conditions', 'day.calendar', 'day.needs'],
    connections: [
      { to: 'day.calendar', kind: 'scheduled', why: `A booked appointment is a commitment on the calendar, ${CONSULT_MINUTES} minutes at ${clock(CONSULT_HOUR)} on a weekday that isn’t a public holiday, and the clock stops at it.` },
      { to: 'papers.health-cover', kind: 'immediate', why: `A visit kept is billed at once at what your cover leaves you, and its bill joins Care And Its Bills, due in ${MEDICAL_DEBT.dueDays} days.` },
      { to: 'papers.conditions', kind: 'evaluation', why: 'Your Pharmacy’s cash price is read for every generic fill of a condition’s medicine.' },
      { to: 'day.needs', kind: 'scheduled', why: 'Booking sends “A Doctor’s Appointment” to What Needs You, a missed one “Missed The Doctor”, and a referral “A Referral”.' },
    ],
    example: {
      setup: 'A student on Yale Health in New Haven, whose Monday brought a doctor’s visit.',
      steps: [
        // From 2026-10-15: until then the visit was booked at Fair Haven, 24 days on, a student on Yale Health being given
        // the town's first practice with nothing picked.
        `A notice: “A doctor’s visit: booked at ${YALE_PRACTICE} for …, the wait where you live.”, ${YALE_SOON}.`,
        `On the day you sleep past ${clock(CONSULT_HOUR)}, and “Missed The Doctor” follows.`,
        'Open Papers, Health Cover, and press Book An Appointment beside “A doctor’s visit: not yet seen”.',
      ],
      result: `It’s booked again for ${YALE_SOON} at ${YALE_PRACTICE}, moved to the next working day when that’s a Saturday, a Sunday or a public holiday where you live, as every booking is. Kept, it costs $0 on Yale Health, renews your prescriptions, and about one time in ${Math.round(1 / US_REFERRAL)} ends in a referral to a specialist ${REFERRAL_DAYS.us} days later.`,
    },
  },
  {
    id: 'papers.conditions',
    title: 'Conditions And Therapy',
    goal: 'papers',
    covers: ['health.treat', 'health.therapy'],
    synonyms: ['depression', 'asthma', 'high blood pressure', 'diabetes', 'arthritis', 'chronic condition', 'insulin', 'keep it up', 'let it go', 'therapy', 'cbt', 'counseling', 'therapist'],
    questions: ['What does Let It Go do?', 'How do I treat depression?', 'What happens if I stop my medicine?', 'How much does my condition cost a month?', 'Can therapy lift depression for good?'],
    where: { route: ROUTE, tab: HEALTH, label: 'Papers, Health Cover, Your Conditions' },
    available: `From the guide’s chapter “${CHAPTER}”. Your Conditions shows when you carry a condition or wear lenses, and Therapist when you carry depression.`,
    short: `A condition is a long-term illness you carry, and this is where you keep it treated or not. A life may begin with one, at the rates for adults 18 to 34: depression ${pct(CHRONIC.share.depression)}, asthma ${pct(CHRONIC.share.asthma)}, high blood pressure ${pct(CHRONIC.share.hypertension)}, diabetes ${pct(CHRONIC.share.diabetes)} and arthritis ${pct(CHRONIC.share.arthritis)}; diabetes, high blood pressure and arthritis can also begin later, likelier in a heavier body. Kept up, each costs its month of care and its medicine at what your plan leaves you to pay. Let It Go stops both, and from then the condition takes its toll each week. A course of ${THERAPY.sessions} therapy sessions can lift depression for good.`,
    steps: [
      'Open Papers, Health Cover, Your Conditions. Each row reads Kept Up, Left Alone, Out Of Medicine, or Kept Up, But This Month’s Care Went Unpaid, with the date your medicine lasts to.',
      'Let It Go stops a condition’s care and its medicine. Keep It Up starts them again.',
      `With depression, pick a Therapist where you live and press Begin A Course Of ${THERAPY.sessions} Sessions. In New Haven that’s ${YALE_COUNSELING.name}, Free With Yale Health, or ${PRIVATE_THERAPIST.name}, ${PRIVATE_SESSION} A Session.`,
      `While the course runs, the panel reads “Therapy with …: 2 of ${THERAPY.sessions} sessions”, naming ${YALE_COUNSELING.name}, and so on. Each session is a commitment the clock stops at.`,
    ],
    needs: [
      'A condition you carry: drawn once when a life begins; one that begins later comes with a “Diagnosed” notice and is kept up from the start.',
      `Begin A Course Of ${THERAPY.sessions} Sessions: depression, no course running, a therapist in the town you’re in, and for ${YALE_COUNSELING.name}, Yale Health covering you.`,
    ],
    costs: [
      { label: 'Depression, A Month', value: `${CHRONIC.therapyPerMonth} therapy sessions at your plan’s visit copay ($0 on Yale Health, ${usd(SILVER.visit * CHRONIC.therapyPerMonth)} a month on Access Health CT silver; uninsured, ${usd(CHRONIC.therapy.other)} a session at ${MEDICAL_CPI.base.therapy[0]}’s price), and a generic each fill`, estimate: true },
      { label: 'Asthma', value: 'A brand inhaler each fill, and a visit’s copay in about two months of twelve', estimate: true },
      { label: 'High Blood Pressure', value: 'A generic each fill' },
      { label: 'Diabetes', value: `Type 1: insulin, never more than ${usd(INSULIN.cashCap)} a fill (${usd(INSULIN.connecticutCap)} on Access Health CT’s silver plan, which Connecticut regulates, and $0 on HUSKY D and Covered Connecticut), and a glucose monitor, never more than ${usd(INSULIN.monitor.program)}. Type 2: a generic. A visit’s copay each January, April, July and October.`, estimate: false },
      { label: 'Arthritis', value: 'A generic each fill, and a visit’s copay in about two months of twelve', estimate: true },
      { label: 'A Course Of Therapy', value: `${THERAPY.sessions} weekly sessions: ${YALE_COUNSELING.minutes} minutes at ${YALE_COUNSELING.name}, free to a student Yale Health covers; or ${PRIVATE_THERAPIST.minutes} minutes at ${PRIVATE_THERAPIST.name}, ${PRIVATE_SESSION} a session whatever your cover, its full fee, paid from your bank as each is held, and billed as care where the bank can’t` },
      { label: 'Time', value: `Each session on the calendar at ${clock(SESSION_HOUR)} on a weekday`, estimate: true },
    ],
    reads: [
      { label: 'Kept Up', value: 'Treated, with this month’s care paid and the medicine not run out: all three at once' },
      { label: 'Left Alone, Each Week', value: `Depression takes ${LEFT.moraleAWeek} morale, diabetes ${LEFT.diabetesConditionAWeek} condition, arthritis ${LEFT.arthritisEnergyAWeek} energy; asthma makes an emergency ${LEFT.asthmaEmergencies} times as likely, and type 1 diabetes ${LEFT.diabetesEmergencies} times; high blood pressure does nothing a year shows`, estimate: true },
      { label: 'A Course’s Chance', value: `${pct(THERAPY.recovery.private)} for a private course or Yale’s, ${pct(THERAPY.recovery.nhs)} for NHS Talking Therapies`, estimate: true },
      { label: 'Reviews', value: `A doctor’s visit booked for a condition kept up: high blood pressure and asthma every ${REVIEW_MONTHS.hypertension} months, diabetes every ${REVIEW_MONTHS.diabetes}` },
    ],
    now: [
      `Keep It Up: this month’s care is paid at once from ${FROM_CURRENT}. If it can’t be, the row says the care went unpaid. The toast says “Kept up from this month.”`,
      'Let It Go: care and refills stop at once, and the toast says “Left alone.”',
      `Begin A Course Of ${THERAPY.sessions} Sessions: the first session is set a week later, at ${clock(SESSION_HOUR)} on a weekday, and the toast gives its date. While it runs, depression’s monthly therapy charge stops; each session is paid as it’s held.`,
    ],
    later: [
      'On the first of each month, each kept-up condition’s care is paid. If the bank can’t cover it, the condition goes without and counts as left alone until the next month.',
      `Each Monday, medicine with ${FILL.refillDays} days or fewer left is refilled for ${FILL.us} days, and a condition left alone or out of medicine takes its toll.`,
      'Each session at its hour: awake and out of hospital, it’s held, and paid or billed; asleep or in hospital, it moves to the next week. After the last, the depression lifts at the course’s rate or stays, and another course can be had.',
      `${YALE_COUNSELING.name} sees students Yale Health covers: if that cover ends mid-course, the course ends with it, and the sessions had stay had. ${PRIVATE_THERAPIST.name} can then begin a new course of ${THERAPY.sessions}, at its fee.`,
    ],
    interpret: [
      '“The Depression Has Lifted” takes it off your record: no more care, medicine or weekly loss of morale. “The Course Is Done” means it stayed.',
      'Out Of Medicine means the supply ran out: the condition counts as left alone until Monday’s fill.',
      'Care and medicine for a condition are paid straight from your bank, so they show on your statements, not as rows in Care And Its Bills.',
    ],
    unavailable: [
      '“You don’t have that.”: a condition you don’t carry.',
      '“Choose a therapist where you live.”, “A course of therapy here is for depression.” or “You’re in a course already.”',
      `“${YALE_COUNSELING.name} sees students Yale Health covers.” After Yale Health, ${PRIVATE_THERAPIST.name} takes a course in New Haven, at ${PRIVATE_SESSION} a session.`,
    ],
    next: [
      'Keep enough in your current account on the first of each month for each condition’s care.',
      'With depression, begin a course of therapy early in your time at the School, while Yale Health covers it.',
    ],
    mistakes: [
      `Letting a condition go to save money: the weekly toll keeps coming, and type 1 diabetes left alone makes the emergency room ${LEFT.diabetesEmergencies} times as likely, each visit billed.`,
      'Missing sessions: each one missed asleep or in hospital moves the course a week.',
      `Starting late in your last year: if Yale Health ends before the last session, the course at Yale ends there, and finishing means a new course of ${THERAPY.sessions} at ${PRIVATE_THERAPIST.name}, at ${PRIVATE_SESSION} a session. Begin early.`,
    ],
    related: ['papers.health-cover', 'papers.doctor', 'body.how', 'day.calendar'],
    connections: [
      { to: 'body.how', kind: 'scheduled', why: 'Each Monday a condition left alone takes its toll: depression lowers morale, diabetes condition, arthritis energy.' },
      { to: 'day.calendar', kind: 'scheduled', why: `Begin A Course Of ${THERAPY.sessions} Sessions puts a session on the calendar each week, a commitment the clock stops at.` },
      { to: 'papers.doctor', kind: 'scheduled', why: 'A condition kept up books its review as a doctor’s appointment when it falls due.' },
      { to: 'bank.accounts', kind: 'immediate', why: `Keep It Up pays the month’s care at once from ${FROM_CURRENT}; later months and each fill are paid the same way.` },
    ],
    example: {
      setup: 'A first-year on Yale Health who carries depression.',
      steps: [
        'Open Papers, Health Cover. Depression reads Kept Up, with its medicine’s date.',
        `Choose ${YALE_COUNSELING.name}, Free With Yale Health, and press Begin A Course Of ${THERAPY.sessions} Sessions.`,
        `Be awake and out of hospital at ${clock(SESSION_HOUR)} on each session’s day.`,
      ],
      result: `Each session costs $0. After the last, ${pct(THERAPY.recovery.private)} of the time a notice says “The Depression Has Lifted”, and depression is gone from Your Conditions; otherwise “The Course Is Done”, and another course can begin.`,
    },
  },
  {
    id: 'papers.benefits',
    title: 'Unemployment And Assistance',
    goal: 'papers',
    covers: ['benefits.claim', 'benefits.ei_register', 'benefits.assistance'],
    synonyms: ['unemployment insurance', 'file a claim', 'snap', 'ebt card', 'food stamps', 'waiting week', 'base period', 'universal credit', 'jobseekers allowance', 'employment insurance'],
    questions: ['Can I claim unemployment as a student?', 'How much unemployment would I get?', 'When is unemployment paid?', 'How do I get SNAP?', 'Why was my SNAP case closed?'],
    where: { route: ROUTE, tab: BENEFITS, label: 'Papers, Unemployment: SNAP And Your Claim' },
    available: `From the guide’s chapter “${CHAPTER}”.`,
    short: `Unemployment insurance pays you each week when you’re out of work, and SNAP helps pay for food. File A Claim opens a claim with Connecticut, where a New Haven life’s wages are earned. A week’s benefit is your two highest quarters’ average over 26, from ${CT_FLOOR_SHORT} to ${usd(CONNECTICUT_UI.maximum)}, for up to ${CONNECTICUT_UI.weeks} weeks, with no waiting week. Connecticut doesn’t pay a full-time student, so a claim waits until you’ve left school. Apply, on the SNAP panel, puts up to ${usd(SNAP_FULL)} a month of food assistance on an EBT card, and each day’s groceries are paid from it first.`,
    steps: [
      'Open Papers, then Unemployment.',
      'The claim panel, No Claim Open, says what filing now would pay, or why it wouldn’t. File A Claim shows beside its title only when a claim would pay.',
      'Once filed, the panel is A Connecticut Claim: A Week, Paid, and At Most, with the date the claim ends.',
      'On the SNAP panel, press Apply when it shows. Claim, At Most and On The EBT Card follow the case.',
    ],
    needs: [
      `A claim: covered wages in your base period, at least ${CONNECTICUT_UI.totalTimesWeekly} times the weekly benefit (the Summer Cabaret’s stipend counts; work-study never does); no claim open; out of school; and US citizenship or permission to work, such as OPT.`,
      `SNAP: US citizenship, being an adult, and no case open; in the summer recess while you’re at school, ${SNAP.studentHours} hours of work in the last 30 days.`,
    ],
    costs: [
      { label: 'Time', value: 'None: filing and applying move no clock' },
      { label: 'Money', value: 'None. What a claim pays is income on your return.' },
    ],
    reads: [
      { label: 'The Base Period', value: 'The first four of the last five completed quarters, or, where those fall short, the last four' },
      { label: 'Connecticut’s Week', value: `The two highest quarters’ average over 26, down to the dollar, at least ${CT_FLOOR_WORDS} and at most ${usd(CONNECTICUT_UI.maximum)}; ${CONNECTICUT_UI.weeks} weeks’ worth at most, or a year from filing` },
      { label: 'A Week With Work', value: `The benefit less ${PARTIAL} of the week’s pay, rounded up to the dollar: nothing once the pay reaches one and a half times the benefit` },
      // Until 2026-10-13 the 30% wasn’t rounded, and the month was paid to the cent (`snapMonth`, systems/assistance.ts);
      // and a graduate drawing unemployment met the time limit, which exempts a claimant (7 CFR 273.7(b)(1)(v)).
      { label: 'SNAP’s Month', value: `Up to ${usd(SNAP_FULL)} from ${fullDay(SNAP_NOW.from)}, less ${pct(SNAP.share)} of net income rounded up to the dollar: last month’s wages and unearned income, less ${pct(SNAP.earnedDeduction)} of the wages and a ${usd(SNAP_NOW.standard * 100)} deduction. Work-study pay isn’t counted. Under the state’s gross limit, never less than ${usd(SNAP_NOW.least * 100)} after the first month.` },
      { label: 'SNAP’s Time Limit', value: `Out of school, aged ${SNAP.abawd.from} to ${SNAP.abawd.to}, with under ${SNAP.abawd.hours} hours’ work in the last 30 days: ${SNAP.abawd.months} months in ${SNAP.abawd.window}. A student at school is exempt, through the summer recess too, and so is anyone with an unemployment claim open`, estimate: false },
    ],
    now: [
      'File A Claim: the claim opens, the toast says “Claim filed: …” with its weekly amount, and the first week is certified the coming Sunday.',
      'Apply: the SNAP case opens, and the toast gives the day the first month comes.',
    ],
    later: [
      // Until 2026-10-13 this said the hospital and an injury were read at the certification alone (`ableOnMost`).
      `Each Sunday at 8 in the evening the week is certified. In the US, out of school, allowed to work, and out of hospital and not laid up for most of the week’s days, you’re paid the benefit less ${PARTIAL} of the week’s pay, into the account your payments go to.`,
      'The claim closes when it has paid its most, or a year after filing, with the notice “Your Unemployment Claim Ended”.',
      // Until 2026-10-13 this said a month whose income left nothing due paid nothing. `snapMonth` (`systems/assistance.ts`)
      // pays an eligible household of one SNAP’s least from that day, except in its first month.
      `SNAP’s month is worked out a week after applying, then every 30 days, and what’s due goes onto the EBT card with the notice “SNAP Paid”. Under the state’s gross limit every month but the first pays at least SNAP’s least, ${usd(SNAP_NOW.least * 100)} from ${fullDay(SNAP_NOW.from)}; the first, or a month over the limit, whose income leaves nothing due pays nothing and says nothing.`,
      'A student in the summer recess without the hours has the case closed, with a notice; apply again once that changes.',
      'Out of school and past the time limit, SNAP pays nothing, and says so each month, until you work the hours. While you’re at school, or while an unemployment claim is open, the time limit doesn’t apply.',
    ],
    interpret: [
      'A Week is the claim’s benefit, Paid what it has paid, and At Most where it stops, with the date it ends.',
      `For a sense of size: a summer with the company paying ${usd(JUNE_PAY)} in June and ${usd(LATER_PAY)} in July and August makes a week’s benefit of ${usd(CLAIM.weekly)}, and ${usd(CLAIM.maxTotal)} at most.`,
      'On The EBT Card is what’s left for groceries: each morning’s groceries come off it before your bank.',
      'Past Claims keeps each closed claim, its base period and what it paid.',
    ],
    unavailable: [
      '“Connecticut treats a full-time student as not available for work (CGS 31-235(b)), so a claim pays only once you’ve left school.”',
      '“Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).”',
      `“Connecticut asks for base-period wages of ${CONNECTICUT_UI.totalTimesWeekly} times the weekly benefit: …”, followed by what your base period’s quarters paid.`,
      '“You already have a claim open.”',
      '“In the game, SNAP is only for US citizens, because a noncitizen’s eligibility depends on immigration details the game doesn’t track.”',
      '“A student in the summer without work-study or 20 hours of work a week isn’t eligible for SNAP (7 CFR 273.5).”',
      'Universal Credit, Jobseeker’s Allowance, EI Special Benefits with its Register, Ontario Works and Income Assistance show only for a life living in Britain, Ireland or Canada, and the Seguro De Desempleo takes no new claim at all. A life begun now lives in New Haven, so their panels don’t show.',
    ],
    next: [
      'Once a claim is open, stay in New Haven and out of hospital on Sundays, when each week is certified.',
      'In the summer recess, keep 20 hours of work a week if you want SNAP to stay open.',
    ],
    mistakes: [
      'Counting on work-study to qualify a claim: Yale’s pay to its own student is outside the base period. The Summer Cabaret’s stipend is what counts.',
      'Filing while still enrolled: Connecticut refuses it. File once you’ve graduated, withdrawn or been dismissed.',
      'Spending the summer recess without work: a student’s SNAP case closes. Join The Summer Company, or apply again in the fall.',
      // Until 2026-10-13 this was being in hospital at 8 on a Sunday evening, which then cost the week whatever the days before.
      'Being in hospital or laid up for most of a week: that week pays nothing.',
    ],
    related: ['papers.pensions', 'taxes.return', 'productions.cabaret', 'school.shifts', 'body.look-after'],
    connections: [
      { to: 'productions.cabaret', kind: 'prerequisite', why: 'The Summer Cabaret’s stipend is the pay a claim counts: its quarters are your base period’s wages.' },
      { to: 'school.standing', kind: 'prerequisite', why: 'A Connecticut claim pays only once you’ve left school: graduated, withdrawn or dismissed.' },
      { to: 'taxes.return', kind: 'history', why: 'What a claim pays is kept as the year’s unemployment insurance, income on your return.' },
      { to: 'body.look-after', kind: 'scheduled', why: 'Each month’s SNAP goes onto the EBT card, and each morning’s groceries are paid from it first.' },
      { to: 'school.shifts', kind: 'evaluation', why: `In the summer recess, a student’s hours of work in the last 30 days, work-study’s among them, are read against SNAP’s ${SNAP.studentHours}; work-study’s pay isn’t counted as income, and at school SNAP’s time limit doesn’t apply.` },
    ],
    example: {
      setup: `A US citizen who graduated in the spring, whose base period holds a summer with the Summer Cabaret: ${usd(JUNE_PAY)} in June and ${usd(LATER_PAY)} in July and August.`,
      steps: [
        'Open Papers, Unemployment. No Claim Open reads “Filed now, your base period, …, pays …”.',
        'Press File A Claim.',
        'Stay in New Haven, out of hospital, through Sunday evening.',
      ],
      result: `The toast says “Claim filed: ${formatMoney(CLAIM.weekly, 'USD')} a week.” Each Sunday ${usd(CLAIM.weekly)} goes into your account, with no waiting week first, until ${usd(CLAIM.maxTotal)} has been paid or a year has passed; it’s income on your return.`,
    },
  },
  {
    id: 'papers.pensions',
    title: 'Pensions',
    goal: 'papers',
    covers: ['pension.social_security', 'pension.state', 'pension.ie_state', 'pension.imss', 'pension.bienestar'],
    synonyms: ['social security', 'retirement', 'state pension', 'credits', 'claim social security', 'full retirement age', 'national insurance', 'imss pension', 'bienestar'],
    questions: ['When can I claim Social Security?', 'How many credits do I need?', 'Does work-study count toward Social Security?', 'What if I claim early?', 'Can I get a pension from another country?'],
    where: { route: ROUTE, tab: BENEFITS, label: 'Papers, Unemployment: Social Security And The State Pensions' },
    available: `From the guide’s chapter “${CHAPTER}”. Social Security’s panel shows once your US work has earned a credit.`,
    short: `Social Security pays a monthly benefit on your US earnings record: ${SS.creditsNeeded} credits qualify, one for each ${usd(SS.perCredit * 100)} of covered wages, four a year at most. Claim Social Security from ${SS.earliestAge} for a cut benefit, ${pct(AT_EARLIEST)} of it at ${SS.earliestAge}, the full one at ${SS.fullAge}, or more by waiting, ${pct(AT_LATEST)} at ${SS.latestAge}. At school, your only covered work is the Summer Cabaret, a credit or two a summer, so your record grows only that far. Britain’s, Ireland’s and Mexico’s pensions have panels of their own, shown only if your record or citizenship qualifies for them.`,
    steps: [
      'Open Papers, then Unemployment. The pension panels sit above the claim panel.',
      `Social Security shows Credits, At 67, A Month (with what ${SS.earliestAge} and ${SS.latestAge} would pay) and Claimed.`,
      'Claim Social Security shows beside its title once you can claim. The toast gives the monthly amount and its share of the full benefit.',
      'Each other pension has its own panel and Claim It: State Pension, State Pension (Ireland), IMSS Pension and Pensión Para El Bienestar.',
    ],
    needs: [
      `Social Security: ${SS.earliestAge} or older, ${SS.creditsNeeded} credits, and not drawing it.`,
      `State Pension, the UK’s: State Pension age, 68 for anyone born after 5 April 1978, and ${STATE_PENSION.yearsForAny} qualifying years on your National Insurance record.`,
      `State Pension (Ireland): ${IRISH_PENSION.age}, and ${IRISH_PENSION.paidNeeded} paid contributions, or living in Ireland with means under the non-contributory pension’s.`,
      `IMSS Pension: ${IMSS.age}, and the year’s weeks of IMSS contributions, ${IMSS.weeks2026} in 2026 and ${IMSS.weeksStep} more each year to ${IMSS.weeksMax.toLocaleString('en-US')}.`,
      `Pensión Para El Bienestar: a Mexican citizen of ${BIENESTAR.age} or over, living in Mexico.`,
    ],
    costs: [
      { label: 'Time', value: 'None: claiming moves no clock' },
      { label: 'Money', value: 'None to claim. A claim stands for life: it can’t be taken back or made again.' },
    ],
    reads: [
      { label: 'Covered Wages', value: 'Each year’s US wages to its taxable maximum, less work-study, which pays no FICA; a year as a nonresident on an F-1 counts nothing. The Summer Cabaret’s stipend counts.' },
      { label: 'The Benefit At 67', value: `Your best ${SS.bestYears} years, indexed to the year you turn 60 and averaged a month, then ${pct(SS.rates[0])}, ${pct(SS.rates[1])} and ${pct(SS.rates[2])} across ${usd(SS.bends[0] * 100)} and ${usd(SS.bends[1] * 100)}` },
      { label: 'Early Or Late', value: `Cut 5/9 of 1% a month for the first 36 months early and 5/12 of 1% after; raised ${pct(A_YEAR_LATE)} a year to ${SS.latestAge}`, estimate: false },
      { label: 'After 2026', value: 'Where SSA hasn’t published the wage index, the maximum, the bend points or the credit yet, the game uses its latest figures', estimate: true },
    ],
    now: [
      'Claim Social Security: the month’s amount is fixed from your record and your age that day, and the toast says it.',
      'Claim It on another pension: claimed from today, and the toast gives its week, month or two months.',
    ],
    later: [
      'Social Security is paid a month after claiming and every month after, into the account your payments go to, with a notice. It’s income on your return.',
      'The UK’s State Pension comes every four weeks, Ireland’s every week, the IMSS pension every month, and the Pensión para el Bienestar every two months while you live in Mexico.',
    ],
    interpret: [
      `Credits says “You need forty to qualify, and years at school earn only a few”. At ${usd(STIPEND)} a week, a summer’s stipend of about ${SUMMER_WEEKS} weeks earns ${SUMMER_CREDITS}; four a year is the most any year can earn.`,
      'At 67, A Month is what today’s record would pay; a later, better year replaces a lower one among your best 35.',
      'A life born in Mexico, a Mexican citizen by its Place Of Birth, sees the Pensión Para El Bienestar panel, and living in New Haven it reads “It’s only for Mexican citizens living in Mexico.”',
    ],
    unavailable: [
      `“You can claim it from ${SS.earliestAge}. It’s full at ${SS.fullAge}, and more if you wait until ${SS.latestAge}.”`,
      '“It takes forty credits to qualify, and your US work has earned …”',
      '“You’ve already claimed it.”',
      'The UK’s, Ireland’s and the IMSS panels show only with a record there: UK earnings, Irish contributions, IMSS days. A life begun now works only in New Haven, so they stay hidden.',
    ],
    next: [],
    mistakes: [
      `Claiming at ${SS.earliestAge} when you could wait: the cut lasts for life. At ${SS.earliestAge} you keep ${pct(AT_EARLIEST)} of the full benefit; at ${SS.latestAge}, ${pct(AT_LATEST)}.`,
      'Counting work-study toward credits: a student working for their own school pays no FICA, and earns none.',
    ],
    related: ['papers.benefits', 'taxes.return', 'productions.cabaret', 'documents.work'],
    connections: [
      { to: 'productions.cabaret', kind: 'prerequisite', why: 'The Summer Cabaret’s stipend, with FICA withheld, is the work that earns a school life its credits.' },
      { to: 'taxes.return', kind: 'history', why: 'A pension paid is kept as the year’s pension income, and Social Security is taxed on the return as IRC 86 says.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Once claimed, each payment goes into the account your payments go to, on its own day.' },
      { to: 'documents.work', kind: 'evaluation', why: 'A year as a nonresident on an F-1 earns no credit: your status is read for each year of your record.' },
    ],
    example: {
      setup: 'A US citizen in the fall of their third year, after two summers with the Summer Cabaret.',
      steps: ['Open Papers, Unemployment.', 'Read the Social Security panel.'],
      result: `Credits reads ${2 * SUMMER_CREDITS}, against the ${SS.creditsNeeded} that qualify, and Claimed reads Not Yet, with “You can claim it from ${SS.earliestAge}. It’s full at ${SS.fullAge}, and more if you wait until ${SS.latestAge}.” under it. With no covered work after school in the game, the record stops near there, and Claim Social Security never shows for this life.`,
    },
  },
];
