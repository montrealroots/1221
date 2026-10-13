/**
 * SLATE — the guide's reference: tax returns, payments and liens (from 2026-10-12; `content/guide/types.ts`).
 *
 * Every figure is the rule's own, imported: `RETURN` (`content/safetynet.ts`), the IRS's collection, plan, substitute,
 * amendment and lien (`systems/taxreturn.ts`), the ITIN's weeks (`systems/taxid.ts`), Connecticut's and Oregon's
 * rules (`content/statetax.ts`), and the federal standard deduction (`content/tax.ts`). The worked examples are figured
 * by the rules too: the late penalty by `latePenalty` itself, the least monthly payment by `leastMonthly`, the deadline
 * by `deadline`. Connecticut is the state written about because every life in SLATE studies, works and files from New
 * Haven.
 *
 * Six figures here are written as text because their rules don't export them, and are said so where they stand: the
 * worry a day of owing costs (`systems/spending.ts`, 4 stress and 2 morale), the five months the late-filing share runs
 * (`latePenalty`), the 30 days between plan payments, the IRS's and a state's (`startPlan`, `startStatePlan`), and a
 * 1040-NR's June 15 with no wages on it (`nonresidentDeadline`).
 *
 * Verified claim by claim against the code on 2026-10-12, and corrected where it said more than the code does: the late
 * penalty's five months were read as coming before the late-payment share, not beside it; refusals the screen never
 * shows (a button the code hides once it would be refused shows no reason) were listed as shown; the Papers line on
 * Home was linked to the Money entry; the accounts a payment reaches were "all your accounts", where the code reaches
 * the current account and its bank's savings.
 *
 * Corrected again later on 2026-10-12, after that day's fixes to the IRS's collection. Until then it said an amendment
 * showed only more or less tax, where one can show no change in the total; that the IRS's list read every offset as an
 * amended return's refund; that the late-payment penalty's 25% ran apart from the share charged with a late return; that
 * the IRS's lien withdrawal read the three years after the lien's; and it said nothing of a plan refused for its setup
 * fee, or of the IRS's letters starting again after a refusal. After that the return's short still gave the same
 * days for every refund, the IRS's and Connecticut's alike, where the IRS's on a 1040-NR filed without a Social Security number
 * waits on its ITIN too (`REFUND_WORDS`).
 *
 * Its worked examples were played on throwaway saves later on 2026-10-12 (`tests/guide-examples-papers.test.ts`). The
 * plan's said that on a return filed on time the penalty ran at the plan's quarter-point a month. Played, the later of
 * its two years was filed in February, before its due date, and the plan began then: `payLateRateAt` counted each month
 * or part of one the plan stood before the due date against the months past it, so that year's penalty charged nothing
 * for its first months past due, and the example was made to say so, with the setup saying when the later was filed.
 * The Costs, Reads and Interpret lines that give the plan's rate, and the Now line, weren't changed with it.
 *
 * The defect was the engine's (IRC 6651(h)), and later on 2026-10-12 `payLateRateAt` was corrected to charge the plan's
 * rate month by month, for each month that begins while the plan stands (`tests/plan-rate.test.ts`). The example now
 * says what that charges each year, the month already begun on the earlier one staying at the full rate, and the Costs,
 * Reads, Interpret and Now lines, which said the plan's rate ran while a plan stood, say it's each month that begins
 * under the plan.
 *
 * Corrected on 2026-10-13 by the guide’s audit of that day, after that day’s fixes to the return. Until then it said a
 * return was made each February 1 for a year with any income, where from that day a year with nothing owed or due back
 * and income under the standard deduction gets none (`registerTaxReturn`), and the short, the available line, the needs
 * and the reason File It is missing say so; it said the late-payment penalty counted from filing on a return filed late,
 * the count that charged the month filing fell in twice, where `payLateRateAt` counts from the due date less the months
 * charged with filing; and it said the filing share’s floor gave way to the whole balance where that was less, the
 * IRS’s part and a state’s together, where `latePenaltyAll` takes it against the IRS’s part alone.
 */

import { CHAPTER_FOR } from '../tutorial';
import { RETURN } from '../safetynet';
import { STATE_TAX } from '../statetax';
import { INCOME_TAX_RULES } from '../tax';
import { formatMoney } from '../../core/money';
import { MS_DAY, formatDate } from '../../core/time';
import { AMEND, COLLECTION, DEMAND_DAYS, FEDERAL_LIEN, PLAN, SUBSTITUTE, deadline, irsGrowth, latePenalty, leastMonthly } from '../../systems/taxreturn';
import { SSN } from '../../systems/taxid';
import type { GuideEntry } from './types';

const NEW_HAVEN = 'America/New_York';
const PAPERS = '/workspace/papers';
/** A Papers section's id: a parameter typed by its literal would read to `tools/title-case.mjs` as a label. */
type Section = 'returns';
const on = (section: Section, label: string) => ({ route: PAPERS, tab: section, label });

const usd = (cents: number): string => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
const pct = (x: number): string => `${+(x * 100).toFixed(2)}%`;
const day = (at: number): string => formatDate(at, NEW_HAVEN);

const CHAPTER = CHAPTER_FOR['tax.file']!.title;
/** A single filer’s federal standard deduction, the income under which a year with nothing either way has no return (`registerTaxReturn`). */
const US_DEDUCTION = INCOME_TAX_RULES.find((r) => r.jurisdictionCode === 'US')!.standardDeduction;
const CT = STATE_TAX['us-ct'];
const CT_LIEN = CT.lien!;
const CT_FLOOR = CT.nonFiler.adds?.find((a) => a.minPenalty !== undefined)?.minPenalty ?? 0;
const OREGON = STATE_TAX['us-or'].threeYear!;
const CA_CURE = STATE_TAX['us-ca'].plan.cure;
const CA_CURE_DAYS = CA_CURE.kind === 'notice' ? CA_CURE.days : 0;
const PART: Readonly<Record<string, string>> = { tax: 'the tax', penalty: 'the penalty', interest: 'the interest' };
const CT_ORDER = CT.order.map((p) => PART[p]).join(', then ');
/**
 * When a refund comes after filing, the IRS's and Connecticut's, each by its own rule, and the IRS's later on a 1040-NR
 * filed without a Social Security number, which waits on its ITIN (`SSN.itinWeeks`). Until later on 2026-10-12 it said
 * both came in the same days with no exception, though every F-1 student files a 1040-NR.
 */
const ITIN_REFUND_DAYS = RETURN.refundDays + SSN.itinWeeks * 7;
const REFUND_WORDS = CT.refundDays === RETURN.refundDays
  ? `${RETURN.refundDays} days later, the IRS’s and Connecticut’s alike, though the IRS’s takes ${ITIN_REFUND_DAYS} on a 1040-NR filed without a Social Security number`
  : `${RETURN.refundDays} days later from the IRS, or ${ITIN_REFUND_DAYS} on a 1040-NR filed without a Social Security number, and ${CT.refundDays} from Connecticut`;

/** Filing to the IRS's levy: its notices so many weeks apart, then its final notice's days. */
const IRS_LEVY_DAYS = COLLECTION.notices.length * COLLECTION.noticeWeeks * 7 + COLLECTION.finalDays;
/** Filing to Connecticut's levy: its bill, its notice of intent, then the levy's days. */
const CT_LEVY_DAYS = CT.notices.reduce((sum, n) => sum + n.days, 0) + CT.levy.afterDays;

// A return's worked example: the IRS's part of a 2026 return, filed on its day or late, figured by the rule.
const DUE = deadline(2026);
const LATE_DAYS = 85;
const LATE_AT = DUE + LATE_DAYS * MS_DAY;
const OWED = 400_00;
const LATE_PENALTY = latePenalty(OWED, DUE, LATE_AT);
// Its two shares, as `latePenalty` adds them: paying late's half-point a month begun, and filing late's the rest.
const LATE_MONTHS = Math.ceil(LATE_DAYS / 30.4375);
const LATE_PAY_PART = Math.round(Math.min(RETURN.lateCap, RETURN.payLateMonthly * LATE_MONTHS) * OWED);
const LATE_FILE_PART = LATE_PENALTY - LATE_PAY_PART;
const LATE_FLOOR = LATE_DAYS > RETURN.lateMinimumAfterDays ? Math.min(RETURN.lateMinimum, OWED) : 0;
// Interest from the due date on the balance and on the filing share, as `lateInterest` charges it (IRC 6601(e)(2)(B)):
// until 2026-10-13 on the balance alone, as the engine charged it until then. Counted as the IRS counts a year’s days
// (`irsGrowth`): until later that day over 365 whatever the year, which 2027’s 85 days don’t change.
const LATE_INTEREST = Math.round((OWED + LATE_FILE_PART) * (irsGrowth(DUE, LATE_AT) - 1));

// Paying: a part to the IRS, and a part to Connecticut in Connecticut's order, both inside the first month past the due
// date, so each has charged one month.
const PAID_AT = DUE + 25 * MS_DAY;
const IRS_PART = 150_00;
const CT_TAX = 200_00;
const CT_PARTS: Record<string, number> = { tax: CT_TAX, penalty: Math.round(CT_TAX * CT.payLate.once), interest: Math.round(CT_TAX * (CT.interest.yearly / 12)) };
const CT_PAID = 100_00;
const CT_TOOK: Record<string, number> = { tax: 0, penalty: 0, interest: 0 };
{
  let left = CT_PAID;
  for (const p of CT.order) { CT_TOOK[p] = Math.min(left, CT_PARTS[p]!); left -= CT_TOOK[p]!; }
}

// A plan: what's owed, and the least a month.
const PLAN_OWED = 1_800_00;
const PLAN_LEAST = leastMonthly(PLAN_OWED);

// A lien: Connecticut's balance left unpaid at filing, its bill, its notice and lien, and their amount by then.
const LIEN_TAX = 600_00;
const LIEN_FILED = Date.UTC(2027, 2, 1, 17);
const LIEN_BILL = LIEN_FILED + CT.notices[0]!.days * MS_DAY;
const LIEN_AT = LIEN_BILL + CT.notices[1]!.days * MS_DAY;
const LIEN_MONTHS = Math.max(0, Math.ceil((LIEN_AT - DUE) / (30.4375 * MS_DAY)));
const LIEN_AMOUNT = LIEN_TAX + (LIEN_AT > DUE ? Math.round(LIEN_TAX * CT.payLate.once) + Math.round(LIEN_TAX * (CT.interest.yearly / 12) * LIEN_MONTHS) : 0);

export const TAXES: readonly GuideEntry[] = [
  {
    id: 'taxes.return',
    title: 'Your Tax Return',
    goal: 'papers',
    covers: ['tax.file', 'tax.amend'],
    synonyms: ['tax return', 'file a return', 'tax refund', 'tax deadline', 'Form 1040', 'Form 1040-NR', 'Form 8843', 'late filing penalty', 'amended return', 'Form 1040-X', 'substitute for return', 'Notice CP2566'],
    questions: ['When is my tax return due?', 'What happens if I file late?', 'When does my refund come?', 'Why does the IRS say it filed my return?', 'How do I amend a return?'],
    where: on('returns', 'Papers, Tax Returns, Each Year’s Return Panel'),
    available: `From the guide’s chapter “${CHAPTER}”. A year’s return is ready on February 1 of the year after, where there’s one to file.`,
    short: `Each February 1 the year before gets a return on Papers where it owes or is owed anything, or its income reached the standard deduction (every year, on an F-1), worked out line by line from what you earned, what was withheld and where you lived. File It settles it: each authority’s balance is taken from your bank at once where the bank can cover it, and a refund comes ${REFUND_WORDS}. Filed by its deadline, April 15 or the next business day (June 15 for a 1040-NR with no wages on it), it costs no more than the tax. Filed late with a balance, the IRS adds penalties and interest, and a return that owes and is never filed is filed by the IRS without you.`,
    steps: [
      'Open Papers and its Tax Returns tab. Each year has a panel headed with the year, saying Due with its date, or Filed once it’s in.',
      'Read its lines: wages, interest and any scholarship for living costs, the tax on them, what was withheld, and at the foot You Owe or Comes Back To You.',
      'Press File It, on the panel or on the year’s question in What Needs You. Where the IRS has filed one for you, the button reads File Your Own In Its Place.',
      'To correct a year you filed, press Amend The Return…, then File The Amendment; Not Now leaves it.',
    ],
    needs: [
      `A return for the year. One is made each February 1 for a year that left anything owed or due back, Canada’s refund among it, or income of ${usd(US_DEDUCTION)}, a single filer’s standard deduction, or more; a student on an F-1 has one every year they’re here, for Form 8843.`,
      'To pay a balance at filing, enough in your current account and savings for each authority’s part: the IRS’s and each state’s are taken apart, each whole or not at all.',
      `To amend: a return you filed yourself, within ${AMEND.years} years of filing or ${AMEND.paidYears} of your last payment on it, with no amendment already being processed.`,
    ],
    costs: [
      { label: 'Time', value: 'None: filing and amending move no clock' },
      { label: 'A Balance', value: 'Taken from your current account when you file, then from savings at the same bank, each authority’s part all or none' },
      { label: 'Filing Late With A Balance', value: `${pct(RETURN.lateMonthly)} of the IRS’s part for each month or part of one through the fifth, ${pct(RETURN.payLateMonthly)} of it for paying late and the rest for filing late; after that ${pct(RETURN.payLateMonthly)} a month for paying late alone, until that share reaches ${pct(RETURN.lateCap)}; past ${RETURN.lateMinimumAfterDays} days the filing share is at least ${usd(RETURN.lateMinimum)}, or the IRS’s whole part where that’s less`, estimate: false },
      // Until 2026-10-13 this said interest ran from the due date on what was owed alone; the filing share of the penalty
      // draws it from then too (`lateInterest`, `systems/taxreturn.ts`).
      { label: 'Interest', value: `${pct(COLLECTION.interest)} a year, compounded daily, from the due date, on the IRS’s part and on the filing-late share of the penalty` },
      { label: 'An Amendment', value: 'No fee' },
      { label: 'An Amendment’s Wait', value: `${AMEND.weeks} weeks before the IRS processes it, where it says eight to twelve`, estimate: true },
    ],
    reads: [
      { label: 'The Year’s Record', value: 'Wages and what was withheld from them, bank interest, any taxable scholarship, unemployment insurance and a pension, as kept through the year' },
      { label: 'Where You Lived', value: 'The town you last lived in that year, for the state’s tax and any city’s' },
      { label: 'Your Citizenship', value: 'A student on an F-1 files Form 1040-NR with Form 8843, on income from the US only, so bank interest goes untaxed' },
      { label: 'Your Health Cover', value: 'Marketplace months, for the premium tax credit and Connecticut’s premium assistance' },
      { label: 'A Social Security Number', value: `On a 1040-NR filed without one, an ITIN application holds the refund ${SSN.itinWeeks} weeks longer` },
    ],
    now: [
      'The panel reads Filed with the day, and the year’s question in What Needs You is answered.',
      'A balance your current account and savings can cover is paid at once, to the IRS and to each state apart. One they can’t cover is owed, and the panel shows what’s still owed to each.',
      'Filed late with a balance owed to the IRS, a Late Penalties line shows what filing late added; a state’s own late penalty is in its Penalties under Owed To.',
      'An IRS refund shows as Refund Arrives, with its date; a state’s shows under Who It’s Owed To.',
      'An amendment shows on the panel as its form, the day you filed it, how much more or less tax in all, or “no change in the total” with each side that moved, and SLATE’s estimate of the day the IRS processes it. Processed, the same line gives the day, with any refund and its interest.',
    ],
    later: [
      `An IRS refund is paid into your current account ${RETURN.refundDays} days after filing, or ${ITIN_REFUND_DAYS} days on a 1040-NR filed without a Social Security number. The IRS first takes from it anything you owe on another year, then a state’s past-due tax.`,
      `A balance left owing starts the IRS’s letters ${COLLECTION.noticeWeeks} weeks after filing, and Connecticut’s bill ${CT.notices[0]!.days} days after: see Paying Tax Owed. With an IRS plan in force, a new IRS balance goes to the plan instead.`,
      'Still unfiled on the deadline, a notice says the return is late.',
      `Unfiled and owing the IRS, Notice CP2566 comes ${SUBSTITUTE.afterDays} days after the deadline (SLATE’s estimate of when) with the IRS’s own figures, leaving out the foreign tax credit and the premium tax credit only your return claims. ${SUBSTITUTE.answerDays} days on it’s assessed, with its penalty and interest, and collected.`,
      'Past its deadline, unfiled with a balance, it weighs on you each day as tax owed does: see Paying Tax Owed.',
      `Owing Connecticut, DRS acts on its own part: its notice that it made your return comes ${CT.nonFiler.firstDays} days after the deadline${CT.nonFiler.firstAssumed ? ' (SLATE’s days, since DRS doesn’t say when it acts)' : ''}, and ${CT.nonFiler.letters[0]!.days} days later it’s assessed, with a penalty of at least ${usd(CT_FLOOR)}.`,
      `An amendment is processed ${AMEND.weeks} weeks after you file it. More tax is added with interest from the due date; less comes off what’s owed, and the rest is refunded with the IRS’s interest.`,
    ],
    interpret: [
      'The You Owe or Comes Back To You line covers the whole year, the IRS and the state together. Once it’s filed, Who It’s Owed To splits it: the IRS’s line, then each state’s.',
      'A balance on a return filed on time means the year’s withholding and credits fell short of the tax; a refund means they came to more.',
      'Filed by the IRS in the heading means it was assessed without you. Your own return in its place makes the tax yours, its penalty and interest fall in proportion, and anything you paid past your own return’s tax comes back at once.',
      'Late Penalties is what filing late added on the day you filed. What the IRS charges after that grows under Penalties in Owed To The IRS.',
    ],
    unavailable: [
      `A year with nothing owed or due back and income under the standard deduction, ${usd(US_DEDUCTION)}, has no return, and so no File It; a student on an F-1 always has one.`,
      'File It shows only on a year not yet filed, or one the IRS filed, where it reads File Your Own In Its Place. A year you’ve filed is changed by amending it.',
      'Amend The Return… is grayed out with its reason beside it: “An amended return for the year is with the IRS.”, or the date the time to amend it ran out. A year the IRS filed shows no Amend The Return…: file your own in its place first.',
      'File The Amendment: “Your return as filed matches what’s on record: there’s nothing to amend.” The year hasn’t changed since you filed.',
      `Until the guide’s chapter “${CHAPTER}” is read, File It shows as Locked.`,
    ],
    mistakes: [
      `Waiting past the deadline because the bank is short. Past ${RETURN.lateMinimumAfterDays} days late the IRS’s filing share is at least ${usd(RETURN.lateMinimum)}, or its part itself where that’s less, and a state charges its own. File on time anyway: what goes unpaid then grows only by the late-payment share and the interest.`,
      'Looking for the question in What Needs You after the deadline: it lapses on the day, and File It stays on the Papers panel for as long as the year is unfiled.',
      'Leaving the IRS’s own return in place: it leaves out the foreign tax credit and the premium tax credit. File Your Own In Its Place replaces it even after it’s assessed.',
    ],
    related: ['taxes.pay', 'taxes.plan', 'papers.overview', 'papers.health-cover', 'school.shifts', 'day.needs'],
    connections: [
      { to: 'bank.accounts', kind: 'immediate', why: 'Filing takes a balance from your accounts at once, the current account first and then savings.' },
      { to: 'day.needs', kind: 'immediate', why: 'Filing answers the year’s question in What Needs You.' },
      { to: 'taxes.pay', kind: 'scheduled', why: `A balance the bank couldn’t pay at filing is owed, and the IRS’s first letter comes ${COLLECTION.noticeWeeks} weeks later.` },
      { to: 'bank.accounts', kind: 'scheduled', why: `A refund is paid into your current account ${RETURN.refundDays} days after filing, or ${ITIN_REFUND_DAYS} on a 1040-NR filed without a Social Security number.` },
      { to: 'papers.overview', kind: 'immediate', why: 'The Papers line on Home says when an unfiled return is due, what filing it would pay with any late penalty in it, and the tax owed.' },
      { to: 'documents.work', kind: 'optional', why: `On a 1040-NR, a Social Security number held before filing saves the ${SSN.itinWeeks} weeks an ITIN application holds the refund.` },
    ],
    example: {
      setup: `Your 2026 return leaves ${usd(OWED)} owed to the IRS, due ${day(DUE)}, and your accounts can cover what filing takes.`,
      steps: [`Press File It by ${day(DUE)}.`, `Or wait, and press it ${LATE_DAYS} days late, on ${day(LATE_AT)}.`],
      result: `On time, it costs the ${usd(OWED)} and no more. On ${day(LATE_AT)} the IRS adds ${usd(LATE_PENALTY)} of late penalties, ${usd(LATE_FILE_PART)} for filing late and ${usd(LATE_PAY_PART)} for paying late${LATE_FLOOR > 0 && LATE_FILE_PART <= LATE_FLOOR ? ` (past ${RETURN.lateMinimumAfterDays} days the filing share is at least ${usd(LATE_FLOOR)}${LATE_FLOOR < RETURN.lateMinimum ? `, the whole balance, since that’s under ${usd(RETURN.lateMinimum)}` : ''})` : ''}, and about ${usd(LATE_INTEREST)} of interest: ${usd(OWED + LATE_PENALTY + LATE_INTEREST)} in all.`,
    },
  },
  {
    id: 'taxes.pay',
    title: 'Paying Tax Owed',
    goal: 'papers',
    covers: ['tax.pay', 'tax.pay_state'],
    synonyms: ['pay the IRS', 'tax owed', 'back taxes', 'IRS letters', 'Notice CP501', 'Notice CP504', 'final notice before levy', 'IRS levy', 'pay Connecticut', 'DRS bill', 'part payment of tax'],
    questions: ['How do I pay tax I owe?', 'Can I pay part of it?', 'What happens if I don’t pay?', 'Why did the IRS take money from my account?', 'Where does a part payment go first?'],
    where: on('returns', 'Papers, Tax Returns, Owed To The IRS And Owed To A State'),
    available: `From the guide’s chapter “${CHAPTER}”, once a filed year has a balance left owing.`,
    short: `A balance the bank couldn’t pay when you filed stays owed in three parts, the tax, the penalties and the interest, and the last two grow by each authority’s rule. Pay takes any part of it from your bank now, or all of it with the box left blank. Left alone, the IRS levies your accounts ${IRS_LEVY_DAYS} days after filing, and Connecticut ${CT_LEVY_DAYS} days after.`,
    steps: [
      'Open Papers, Tax Returns, and the year’s panel. Owed To The IRS shows Tax Unpaid, Penalties and Interest as of now.',
      'Type an amount in Pay (Blank Pays It All), or leave it blank, and press Pay.',
      'A state has its own box under Owed To and its agency’s name, such as Pay Connecticut (Blank Pays It All), with its own Pay.',
      'Payments On The Year, and Payments To each state, list every payment, levy and refund offset with how it was split.',
    ],
    needs: [
      'A filed year with a balance still owed to that authority, or a year a state assessed without your return.',
      'The amount in your current account and savings: a payment is taken whole or not at all, from the current account and then savings.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'What you choose to pay, up to what’s owed now' },
      // Until 2026-10-13 this said all of it drew interest from the due date. A late return’s paying-late share draws none
      // until it’s filed or assessed (`lateInterest`, `systems/taxreturn.ts`), as the engine charged it then too. Later
      // that day it said that share drew it from filing; it draws it only once unpaid 21 days after the filing or
      // the assessment, then from that day (IRC 6601(e)(2)(A), `demanded`).
      { label: 'The IRS’s Interest', value: `${pct(COLLECTION.interest)} a year, compounded daily (a 366th of it a day in a leap year) on the tax, the penalties and the interest: from the due date on the tax and a late return’s filing-late share; on that return’s paying-late share only once it’s unpaid ${DEMAND_DAYS} days after the filing or the IRS’s assessment, and then from that day; and on each month’s penalty after, from when it’s added` },
      { label: 'The IRS’s Late-Payment Penalty', value: `${pct(RETURN.payLateMonthly)} of the tax unpaid for each month or part since the due date, to ${pct(RETURN.lateCap)} in all; on a return filed late, the months to its filing, the month it fell in among them, are charged with filing, count toward the ${pct(RETURN.lateCap)}, and aren’t charged again; ${pct(PLAN.reducedRate)} for each month that begins while a payment plan stands, on a return filed on time` },
      { label: 'Connecticut’s Penalty', value: `${pct(CT.payLate.once)} of the tax unpaid past the due date, once` },
      { label: 'Connecticut’s Interest', value: `${pct(CT.interest.yearly / 12)} a month or part, on the tax alone` },
    ],
    reads: [
      { label: 'Where A Part Goes', value: `To the IRS: the tax, then the penalties, then the interest. To Connecticut DRS: ${CT_ORDER}, as its statute says` },
      { label: 'What’s Owed Now', value: 'Brought up to the minute you pay, its interest and penalty included' },
      { label: 'Your Accounts', value: 'Your current account, and your savings at the same bank as far as it lets money out' },
    ],
    now: [
      'The amount leaves your bank, and a message says how it split: to the tax, to penalties, to interest, and what’s still owed.',
      'A lower tax lowers every later month of the IRS’s penalty, a share of the tax still unpaid.',
      'Paid in full, the year’s letters to come are canceled, and a lien on it reads Paid: Release To Come.',
      'Everything owed to a state paid off outside its plan ends the plan as paid.',
    ],
    later: [
      `Left owing, Notice CP501 comes ${COLLECTION.noticeWeeks} weeks after filing, then CP503, CP504 and the LT11 final notice, each ${COLLECTION.noticeWeeks} weeks after the last. ${COLLECTION.finalDays} days after the LT11 the IRS levies your current account and savings for what they hold, and again every ${COLLECTION.againDays} days while anything is owed (SLATE’s estimate of how often).`,
      `Connecticut sends “${CT.notices[0]!.title}” ${CT.notices[0]!.days} days after filing and “${CT.notices[1]!.title}” ${CT.notices[1]!.days} days after that, filing its lien then; ${CT.levy.afterDays} days on it levies, and again every ${CT.levy.againDays} days${CT.timingAssumed ? ' (SLATE’s days, since DRS doesn’t publish its own)' : ''}.`,
      `Owing the IRS ${usd(FEDERAL_LIEN.threshold)} or more on the year at its final notice brings a Notice Of Federal Tax Lien: see A Tax Lien.`,
      'A federal refund from another year goes first to what’s owed to the IRS, then to a state’s past-due tax; a Connecticut refund goes first to what’s owed to Connecticut.',
      'While tax is owed, or a return is past its deadline unfiled with a balance, the day ends with 4 more points of stress and 2 fewer of morale, scaled by your temperament. It’s the same worry any money trouble brings, felt once a day however many there are.',
    ],
    interpret: [
      'Tax Unpaid, Penalties and Interest are as of now; the Still Owed line in the year’s table is their sum.',
      `The note under Penalties gives the rate running: ${pct(RETURN.payLateMonthly)} a month, or ${pct(PLAN.reducedRate)} for each month that begins while an IRS plan stands on a return filed on time. A state’s note gives its own rule.`,
      'A state whose notes read “None added: unresearched” keeps its balance with no penalty or interest, since SLATE hasn’t researched its collection.',
      'In a list of payments, “taken by levy” is a levy, and “from a refund” is a refund kept for what’s owed, another year’s or an amended return’s, in the IRS’s list and a state’s alike. A state’s list also reads “by its plan” for its plan’s payments.',
    ],
    unavailable: [
      'Pay shows only while something is owed to that authority on the year.',
      '“Pay something.” for nothing or less.',
      'An amount over what’s owed: “… is owed; pay that or less.”',
      '“… is more than the bank can cover.”: your current account and savings together hold less than the amount. Pay a smaller part.',
    ],
    mistakes: [
      'Waiting for the levy: it takes what your current account and savings hold on the day, up to everything owed, whatever that money was for.',
      `Watching only the IRS: Connecticut levies sooner, ${CT_LEVY_DAYS} days after filing against the IRS’s ${IRS_LEVY_DAYS}.`,
      'Holding back because a part won’t clear it: a part to the IRS cuts the tax first, and its penalty is a share of the tax left. Connecticut takes its penalty and interest first, so there a part shrinks the tax last.',
      'Can’t pay it soon? A payment plan stops the letters and the levy: see Payment Plans And Waivers.',
    ],
    related: ['taxes.return', 'taxes.plan', 'taxes.lien', 'bank.accounts', 'papers.overview'],
    connections: [
      { to: 'taxes.return', kind: 'prerequisite', why: 'A balance is owed only on a filed return, or on one the IRS or a state assessed without you.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'Each payment leaves your accounts at once, the current account first and then savings.' },
      { to: 'taxes.lien', kind: 'immediate', why: 'Paying a year in full moves its lien to Paid: Release To Come.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Left owing, a levy takes what your accounts hold on its day.' },
      { to: 'body.how', kind: 'immediate', why: 'Tax owed weighs on you: each day ends with more stress and less morale until it’s paid.' },
      { to: 'taxes.plan', kind: 'optional', why: 'When you can’t pay at once, a plan stops collection for as long as you keep it up.' },
    ],
    example: {
      setup: `Your 2026 return, filed on time, left ${usd(OWED)} of tax owed to the IRS and ${usd(CT_TAX)} to Connecticut; the bank couldn’t pay either.`,
      steps: [`On ${day(PAID_AT)}, type ${IRS_PART / 100} in Pay (Blank Pays It All) and press Pay.`, `Type ${CT_PAID / 100} in Pay Connecticut (Blank Pays It All) and press Pay.`],
      result: `All ${usd(IRS_PART)} goes to the IRS’s tax, leaving ${usd(OWED - IRS_PART)}, so each month’s penalty from then is ${usd((OWED - IRS_PART) * RETURN.payLateMonthly)} where it was ${usd(OWED * RETURN.payLateMonthly)}. Connecticut has added ${usd(CT_PARTS.penalty!)} of penalty and ${usd(CT_PARTS.interest!)} of interest by then; its ${usd(CT_PAID)} pays ${CT_ORDER}: ${usd(CT_TOOK.penalty!)}, ${usd(CT_TOOK.interest!)} and ${usd(CT_TOOK.tax!)}, leaving ${usd(CT_TAX - CT_TOOK.tax!)} of tax.`,
    },
  },
  {
    id: 'taxes.plan',
    title: 'Payment Plans And Waivers',
    goal: 'papers',
    covers: ['tax.apply_plan', 'tax.catch_up_plan', 'tax.revise_plan', 'tax.apply_state_plan', 'tax.catch_up_state_plan', 'tax.request_waiver'],
    synonyms: ['installment agreement', 'IRS payment plan', 'Simple Payment Plan', 'short-term payment plan', 'Form 9465', 'Notice CP523', 'revise the plan', 'catch up on a plan', 'state payment plan', 'three-year penalty', 'penalty waiver'],
    questions: ['Can I pay my taxes monthly?', 'What does a payment plan cost?', 'What happens if I miss a plan payment?', 'Does a plan stop the levy?', 'Can a state’s penalty be waived?'],
    where: on('returns', 'Papers, Tax Returns, IRS Payment Plan And Each State’s Plan'),
    available: `From the guide’s chapter “${CHAPTER}”. The plan panels show while anything is owed, or once a plan has a history.`,
    short: `A plan spreads what you owe over time and stops collection while you keep it up. The IRS Payment Plan takes every year owed to the IRS together: monthly payments on up to ${usd(PLAN.longMax)}, or everything paid within ${PLAN.shortDays} days with no fee. Each state has its own plan apart from the IRS’s; Connecticut’s ${CT.plan.name} runs ${CT.plan.minMonths} to ${CT.plan.maxMonths} months on up to ${usd(CT.plan.max!)}. Interest goes on under every plan.`,
    steps: [
      `On Tax Returns, find the IRS Payment Plan panel. Under Plan, choose Monthly Payments or Paid Within ${PLAN.shortDays} Days.`,
      'For monthly payments, type Each Month (USD) or leave the least shown, leave By Direct Debit ticked or clear it, read the setup fee beneath, and press Apply.',
      `For a state, on its own panel, such as Connecticut DRS ${CT.plan.name}, choose the months under Over and press Ask For The Plan.`,
      'Behind on a payment, press Catch Up on the plan’s panel. To change a monthly IRS plan, type a New Monthly Payment (USD) and press Revise The Plan.',
      'Under a year with Oregon’s three-year penalty, press Ask For Its Waiver.',
    ],
    needs: [
      'Something owed to that authority, and every return past its due date filed.',
      `For the IRS: less than ${usd(PLAN.shortMax)} for the short-term plan, ${usd(PLAN.longMax)} or less for monthly payments, and each month at least what’s owed over ${PLAN.leastMonths} months.`,
      `For Connecticut: up to ${usd(CT.plan.max!)}, and an account it hasn’t levied yet.`,
      'To catch up, a plan behind on a payment; to revise, a monthly IRS plan in force or behind.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'IRS Setup Fee, Monthly', value: `${usd(PLAN.fee.onlineDebit)} by direct debit, ${usd(PLAN.fee.online)} without; where your latest year’s return shows income of at most ${PLAN.lowIncomeShare * 100}% of that year’s poverty line, or there’s no return yet, ${usd(PLAN.fee.lowIncomeDebit)} by direct debit or ${usd(PLAN.fee.lowIncome)} without` },
      { label: 'IRS Short-Term Plan', value: 'No fee' },
      { label: 'Revising An IRS Plan', value: usd(PLAN.reviseFee) },
      { label: 'Connecticut’s Plan', value: CT.plan.fee ? usd(CT.plan.fee) : 'No fee' },
      { label: 'The IRS’s Least A Month', value: `What’s owed over ${PLAN.leastMonths} months`, estimate: true },
      { label: 'How Often A Payment Is Taken', value: 'Every 30 days from approval, from your accounts', estimate: false },
    ],
    reads: [
      { label: 'A Social Security Number', value: `With one, the IRS decides an application online within the minute; without, Form 9465 goes by mail and is answered in ${PLAN.mailDays} days` },
      { label: 'Your Latest Year’s Return', value: 'Its income, for the IRS’s low-income fee' },
      { label: 'Every Year Owed', value: 'One IRS plan covers them all, the oldest paid first' },
      { label: 'When Each Return Was Filed', value: `The IRS’s late-payment penalty falls to ${pct(PLAN.reducedRate)} for each month that begins under a plan only on a return filed on time` },
      { label: 'Oregon’s Waiver Schedule', value: `${pct(OREGON.waiver.beforeNotice)} of the penalty when your return came before any notice, ${pct(OREGON.waiver.afterDemand)} after a demand, ${pct(OREGON.waiver.afterAssessment)} after an assessment` },
    ],
    now: [
      'Applied for, a plan reads With the IRS and the IRS’s letters stop.',
      `Approved, the setup fee leaves your bank, and on a return filed on time each month of the late-payment penalty that begins from then is charged ${pct(PLAN.reducedRate)}; the month already begun stays at ${pct(RETURN.payLateMonthly)}.`,
      'Connecticut decides at once and stops its letters, and files no lien while the plan stands.',
      'Catch Up pays the missed payment now (everything owed, on a short-term plan) and puts the plan back in force.',
      `Revise The Plan pays its ${usd(PLAN.reviseFee)} fee and sets the new monthly payment on everything owed.`,
      'A waiver takes its share off the three-year penalty, or refunds it where the year is paid.',
    ],
    later: [
      `A monthly plan takes its payment every 30 days, the oldest year first; a short-term plan takes everything owed on its ${PLAN.shortDays}th day.`,
      `A payment the bank can’t cover brings Notice CP523 and ${PLAN.defaultDays} days to catch up. After that the plan ends, and ${COLLECTION.noticeWeeks} weeks on the IRS sends its final notice before a levy.`,
      `New tax while a monthly plan stands joins it if it’s no more than ${PLAN.addedPayments} payments’ worth; more brings Notice CP523 and ${PLAN.defaultDays} days to revise the plan before it ends.`,
      `Connecticut ends its plan at the first missed payment, SLATE’s reading since DRS publishes no rule, and ${CT.notices[1]!.days} days on sends “${CT.notices[1]!.title}” and files its lien. New York allows until the next due date and California a ${CA_CURE_DAYS}-day notice: there Catch Up appears.`,
      'Paid off, a plan ends as Paid in full.',
      'Refused on the IRS’s decision, a plan reads Refused, a notice says why, and the IRS’s letters on what’s still owed start again from the step they had reached.',
    ],
    interpret: [
      'The panel’s subtitle is the plan’s standing: the IRS’s With the IRS, In force, A payment missed, Ended, Paid in full or Refused; a state’s Being decided, In force, A payment missed, Ended, Paid in full or Declined.',
      'Covers is what the plan took in when it began, or when it was last revised; Each Month and Next Payment are what it takes and when.',
      'By Direct Debit changes the setup fee and the words beside Each Month. Either way SLATE takes every plan payment from your accounts on its day.',
      'The Plan’s History lists every payment, miss and change.',
      'Under a plan a year’s balance still grows by its interest, so a longer plan costs more in all.',
      'A Connecticut plan has no Catch Up, and Oregon’s waiver is for a year that owed Oregon: a life lived in New Haven files in Connecticut, so it meets neither.',
    ],
    unavailable: [
      'Apply shows while you owe the IRS and have no IRS plan being decided, in force or behind.',
      'Apply, for monthly payments: “The … setup fee is more than the bank can cover.” Applied for by mail, a plan is refused on its decision day if the bank can’t pay the fee then.',
      '“The IRS asks every return filed first”, naming the year that isn’t.',
      `A short-term plan for ${usd(PLAN.shortMax)} or more: “A short-term plan is for less than …”. A Simple Payment Plan over ${usd(PLAN.longMax)}: more needs a financial statement SLATE doesn’t model.`,
      `“The least a month is …, what’s owed over ${PLAN.leastMonths} months.”`,
      'For a state: “Connecticut DRS asks every return filed first”, more than its limit, months outside its range, or an account it has levied.',
      'Catch Up shows only while a plan is behind, and the bank has to cover the payment.',
      `Revise The Plan shows only on a monthly IRS plan in force or behind. It refuses a payment under the least a month, more than ${usd(PLAN.longMax)} owed now, or a ${usd(PLAN.reviseFee)} fee the bank can’t cover.`,
      'Ask For Its Waiver: “There’s no three-year penalty on that year.”, “Its waiver has been decided.”, “File your own return for the year first.”, or a year passed since full payment.',
    ],
    mistakes: [
      'A monthly payment your accounts can’t keep: a missed one brings CP523 at once. Keep the payment in your current account or savings on its day.',
      `Applying with no Social Security number and paying nothing meanwhile: the IRS answers a mailed Form 9465 in ${PLAN.mailDays} days, and interest runs all the while.`,
      'Taking the IRS’s plan for a state’s: it covers federal tax alone. Ask Connecticut for its own.',
      `Missing a Connecticut payment: its plan ends at once, where the IRS gives ${PLAN.defaultDays} days. Pay the year off with Pay if you can.`,
    ],
    related: ['taxes.pay', 'taxes.return', 'taxes.lien', 'documents.work', 'bank.accounts'],
    connections: [
      { to: 'taxes.return', kind: 'prerequisite', why: 'Every return past its due date has to be filed before the IRS or a state sets up a plan.' },
      { to: 'taxes.pay', kind: 'immediate', why: 'A plan pending or in force stops the letters and the levy on what’s owed.' },
      { to: 'taxes.lien', kind: 'immediate', why: 'While a state plan stands, no lien is filed, and one only noticed comes to nothing.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Each plan payment is taken from your accounts on its day, every 30 days.' },
      { to: 'documents.work', kind: 'optional', why: `A Social Security number gets an IRS plan decided within the minute; without one it takes ${PLAN.mailDays} days.` },
    ],
    example: {
      setup: `You owe the IRS ${usd(PLAN_OWED)} across two years, every return filed, the later one in February before it’s due, with a Social Security number and your latest return’s income under ${PLAN.lowIncomeShare * 100}% of the poverty line.`,
      steps: ['Choose Monthly Payments, leave Each Month at its least and By Direct Debit ticked, and press Apply.', 'Keep the payment in your current account each month.'],
      result: `Approved within the minute${PLAN.fee.lowIncomeDebit ? `, for a ${usd(PLAN.fee.lowIncomeDebit)} setup fee` : ', with no setup fee at the low-income rate'}: ${usd(PLAN_LEAST)} a month, the ${usd(PLAN_OWED)} over ${PLAN.leastMonths} months, the first 30 days on. The IRS’s letters stop. On both years’ returns, filed on time, each month of the penalty that begins under the plan is charged ${pct(PLAN.reducedRate)} where it would be ${pct(RETURN.payLateMonthly)}: on the earlier year’s from its next month, the month already begun staying at ${pct(RETURN.payLateMonthly)}, and on the later one from its first month past its due date. Interest goes on, so paying more with Pay shortens it.`,
    },
  },
  {
    id: 'taxes.lien',
    title: 'A Tax Lien',
    goal: 'papers',
    covers: ['tax.lien_release', 'tax.lien_dispute', 'tax.federal_lien_withdraw'],
    synonyms: ['tax lien', 'Notice Of Federal Tax Lien', 'Connecticut Tax Lien', 'lien release', 'Form 12277', 'Letter 3172', 'lien filed in error', 'tax warrant', 'lien withdrawal'],
    questions: ['Why was a lien filed?', 'How do I get a tax lien released?', 'Does a tax lien hurt my credit?', 'What if a lien was filed in error?'],
    where: on('returns', 'Papers, Tax Returns, Under The Year A Lien Secures'),
    available: `From the guide’s chapter “${CHAPTER}”. A lien shows under the year it secures once one is on record.`,
    short: `When a balance stays unpaid deep into collection, the authority files a lien: Connecticut DRS with its notice of intent to levy, the IRS at its final notice when ${usd(FEDERAL_LIEN.threshold)} or more is owed on the year. It shows under the year it secures, with where it’s recorded and its history. Paying in full is what releases it; the buttons ask for a release where the authority wants asking, or a withdrawal: the IRS’s once it has released its lien, or any lien filed in error. In SLATE a lien changes its own record and no other: no credit record or bank reads it.`,
    steps: [
      'Open the year’s panel on Tax Returns. A lien shows as The IRS’s Lien or Connecticut DRS’s Lien, with its standing and The Lien’s History.',
      'Pay the year in full with Pay. The lien reads Paid: Release To Come.',
      'For Connecticut, then press Ask For Its Release.',
      'Once the IRS has released its lien, press Ask For Its Withdrawal (Form 12277). Where it was filed in error, the button reads Ask For Its Release As Erroneous and can be pressed at once.',
      'A state lien on an assessment your own return later showed was already paid: press Ask For Its Withdrawal As Filed In Error.',
    ],
    needs: [
      'A lien on the year.',
      'For a release, the balance it secures paid in full.',
      'For the IRS’s withdrawal, its lien released, and none of the returns for the last three tax years before this one left unfiled past its due date with a balance.',
      'For an error, your own return having replaced an assessment, showing no more owed than was paid before the lien was filed.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: `${CT_LIEN.fee ? `Connecticut adds its ${usd(CT_LIEN.fee)} recording fee to what’s owed` : 'Connecticut charges no fee for its lien'}; the IRS’s recording fees aren’t published, so SLATE charges none` },
      { label: 'The IRS’s Release', value: `${FEDERAL_LIEN.releaseDays} days after payment in full, or ${FEDERAL_LIEN.errorDays} days after it’s asked for as erroneous` },
      { label: 'The IRS’s Withdrawal', value: `Decided ${FEDERAL_LIEN.withdrawDays} days after Form 12277 goes in`, estimate: FEDERAL_LIEN.withdrawAssumed },
      { label: 'Connecticut’s Days', value: `Released ${CT_LIEN.releaseDays} days after you ask; withdrawn in error ${CT_LIEN.error.days} days after you ask`, estimate: CT_LIEN.releaseAssumed || CT_LIEN.error.daysAssumed },
    ],
    reads: [
      { label: 'The Balance When Filed', value: 'Everything owed on the year that day, the amount the lien secures' },
      { label: 'Payments Before It Was Filed', value: 'For an error: the tax paid on the year before the lien went on record' },
      { label: 'Your Last Three Years’ Returns', value: 'For the IRS’s withdrawal after release: the three tax years before this one, whichever year the lien is on, each filed if it’s past due with a balance' },
    ],
    now: [
      'Asked for its release, Connecticut’s lien gets the date it’s released by.',
      'Asked for a withdrawal, a lien reads Asked To Be Withdrawn, with the date it’s decided.',
      'Your money and every other record stay as they were.',
    ],
    later: [
      `Paid in full, the IRS’s lien is released ${FEDERAL_LIEN.releaseDays} days later on its own, and a notice says you can then ask for its withdrawal.`,
      `Connecticut’s is released ${CT_LIEN.releaseDays} days after you ask, recorded with ${CT_LIEN.recordedAt}.`,
      'A withdrawal is decided on its date and the lien reads Withdrawn; the IRS’s notice says it’s as if it had never been filed, and a state gives back any fee it charged for it.',
      'Collection on the year goes on while a lien stands. The lien itself takes no money.',
    ],
    interpret: [
      'Its standing: Notice Of Intent Sent, Filed, Paid: Release To Come, Released, Asked To Be Withdrawn, Withdrawn, or Not Filed.',
      '“Filed as its collection reached that step” or “Filed as its payment plan asks” says why it went on record.',
      `The effect line is the authority’s own words: Connecticut’s says “${CT_LIEN.effect}”; the IRS’s says it may limit your ability to get credit.`,
      'SLATE’s credit record and banks read no lien, so its standing is all that changes.',
    ],
    unavailable: [
      'A lien’s buttons show only under a year that has one, each grayed out with its reason beside it until it can be pressed.',
      '“It’s been released.” or “It’s been withdrawn.”, or one asked already, with the date it’s decided by.',
      '“It’s released once the balance it secures is paid in full.”',
      'For a state that releases without being asked, “It’s released on its own”, with its days.',
      'For the IRS: “A withdrawal after payment comes once it’s released, within 30 days of payment in full; one filed in error can be withdrawn now.”',
      '“The IRS withdraws one after payment only with the last three years’ returns filed”, naming the year that isn’t.',
      'Filed in error: refused where the lien secured tax you owed when it was filed.',
    ],
    mistakes: [
      'Asking for a withdrawal on a lien that secured tax you owed: refused. Pay it, and it’s released.',
      'Paying Connecticut in full and stopping there: DRS releases its lien only when asked, so press Ask For Its Release.',
      'Leaving one of the last three tax years unfiled with a balance: the IRS’s Form 12277 waits on those returns.',
    ],
    related: ['taxes.pay', 'taxes.plan', 'taxes.return'],
    connections: [
      { to: 'taxes.pay', kind: 'prerequisite', why: 'A lien is released only once the balance it secures is paid in full.' },
      { to: 'taxes.return', kind: 'prerequisite', why: 'A lien is withdrawn as filed in error only after your own return has replaced the assessment it secured.' },
      { to: 'taxes.plan', kind: 'optional', why: 'While a state plan stands, no lien is filed: Connecticut files its lien at its second notice.' },
    ],
    example: {
      setup: `You filed your 2026 return on ${day(LIEN_FILED)} with ${usd(LIEN_TAX)} owed to Connecticut that your bank couldn’t pay.`,
      steps: [
        `${day(LIEN_BILL)}: “${CT.notices[0]!.title}”.`,
        `${day(LIEN_AT)}: “${CT.notices[1]!.title}”, and its lien is filed for ${usd(LIEN_AMOUNT)}, the tax with its penalty and interest by then.`,
        'Pay it all with Pay Connecticut (Blank Pays It All), then press Ask For Its Release.',
      ],
      result: `The lien reads Paid: Release To Come, then gets a date ${CT_LIEN.releaseDays} days on, when it reads Released. Paid before ${day(LIEN_AT)}, it would never have been filed; left unpaid, the levy follows ${CT.levy.afterDays} days after it.`,
    },
  },
];
