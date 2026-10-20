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
 *
 * Corrected on 2026-10-16 with the IRS's letters (`nextNotice`, `billed`): until then it said a balance left owing
 * started them five weeks after filing, and that the IRS levied 170 days after filing, as the engine then sent them,
 * before the due date on a return filed early. From that day the bill, Notice CP14, comes at filing, and the reminders,
 * the notice of intent and the final notice count from the due date, or from filing where that's later. The same day
 * the lien's Ask For Its Withdrawal As Filed In Error, which it said stayed grayed out on Connecticut's lien, came to
 * show only on a lien filed in error (`ui/components/LienPanels.tsx`), and A Tax Lien says what shows in its place.
 */

import { CHAPTER_FOR } from '../tutorial';
import { RETURN } from '../safetynet';
import { STATE_TAX } from '../statetax';
import { usStandardDeduction } from '../tax';
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
/** A number under ten in words, as prose writes one (from 2026-10-19, brief 15: until then "5 weeks", "7 weeks", "2 payments’ worth"). */
const said = (n: number): string => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n);
const pct = (x: number): string => `${+(x * 100).toFixed(2)}%`;
const day = (at: number): string => formatDate(at, NEW_HAVEN);

const CHAPTER = CHAPTER_FOR['tax.file']!.title;
/**
 * A single filer’s federal standard deduction for the year, the income under which a year with nothing either way has no
 * return (`registerTaxReturn`), said for 2026, the first year a life begun in 2026 files. Until 2026-10-14 the guide said
 * $14,600, 2024’s, the one figure the tax table then held for every year.
 */
const US_DEDUCTION = (year: number) => usd(usStandardDeduction(Date.UTC(year, 6, 1)));
const DEDUCTIONS = `${US_DEDUCTION(2026)} for 2026`;
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

/**
 * The due date, or filing where that's later, to the IRS's levy: its notices so many weeks apart, then its final notice's
 * days. Until 2026-10-16 counted from filing, as the letters were (`nextNotice`).
 */
const IRS_LEVY_DAYS = COLLECTION.notices.length * COLLECTION.noticeWeeks * 7 + COLLECTION.finalDays;
/**
 * Connecticut's levy: its bill, its notice of intent, then the levy's days, from its due date, or from filing where that's
 * later. Until 2026-10-15 they ran from filing however early, as the engine ran them (`stateNextNotice`). Its due date is
 * mid-April on a 1040-NR too (`stateDueOf`): until 2026-10-15 a 1040-NR due in June moved it there.
 */
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
const LIEN_BILL = Math.max(LIEN_FILED, DUE) + CT.notices[0]!.days * MS_DAY;
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
    available: `From the guide’s chapter “${CHAPTER}”. Each year’s return is ready on February 1 of the next year, if there’s one to file.`,
    short: `Your tax return settles a year’s income tax with the IRS and your state. The game prepares it for you each February 1 from what you earned, what was withheld and where you lived, and you send it with File It.\n\nFiled by the deadline, April 15 or the next business day (June 15 for a 1040-NR with no wages on it), it costs only the tax; filed late with tax owed, the IRS adds penalties and interest. A refund comes ${REFUND_WORDS}.`,
    steps: [
      'Open Papers, then the Tax Returns tab. Each year has a panel headed with the year, showing Due and its date, or Filed once it’s in.',
      'Read its lines: your wages, interest and any scholarship for living costs, the tax on them and what was withheld. The last line says You Owe or Your Refund.',
      'Press File It, on the panel or on the year’s item in What Needs You. If the IRS has filed one for you, the button reads File Your Own In Its Place.',
      'To correct a year you’ve filed, press Amend The Return…, then File The Amendment. Not Now leaves it as it is.',
    ],
    needs: [
      `A return for the year. You get one each February 1 for a year where you owe tax, are due a refund (including Canada’s), or had income of at least a single filer’s standard deduction (${DEDUCTIONS}). A student on an F-1 gets one every year they’re here, for Form 8843.`,
      'To pay a balance when you file, enough in your checking account and savings for each authority’s part. The IRS’s part and each state’s are taken separately, each whole or not at all.',
      `To amend: a return you filed yourself, within ${AMEND.years} years of filing or ${AMEND.paidYears} of your last payment on it, with no amendment already being processed.`,
    ],
    costs: [
      { label: 'Time', value: 'None: filing and amending don’t move the clock' },
      { label: 'A Balance', value: 'Taken from your checking account when you file, then from savings at the same bank. Each authority’s part is paid in full or not at all' },
      { label: 'Filing Late With A Balance', value: `${pct(RETURN.lateMonthly)} of the IRS’s part for each month or part of a month, for the first five months: ${pct(RETURN.payLateMonthly)} of it for paying late and the rest for filing late. After that, ${pct(RETURN.payLateMonthly)} a month for paying late alone, until that share reaches ${pct(RETURN.lateCap)}. After ${RETURN.lateMinimumAfterDays} days the filing share is at least ${usd(RETURN.lateMinimum)}, or the IRS’s whole part if that’s less`, estimate: false },
      // Until 2026-10-13 this said interest ran from the due date on what was owed alone; the filing share of the penalty
      // draws it from then too (`lateInterest`, `systems/taxreturn.ts`).
      { label: 'Interest', value: `${pct(COLLECTION.interest)} a year, compounded daily, from the due date, on the IRS’s part and on the filing-late share of the penalty` },
      { label: 'An Amendment', value: 'No fee' },
      { label: 'An Amendment’s Wait', value: `${AMEND.weeks} weeks before the IRS processes it (the IRS says eight to twelve)`, estimate: true },
    ],
    reads: [
      { label: 'Your Year’s Record', value: 'Wages and what was withheld from them, bank interest, any taxable scholarship, unemployment insurance and a pension, as recorded through the year' },
      { label: 'Where You Lived', value: 'The town you last lived in that year decides the state’s tax and any city’s' },
      { label: 'Your Citizenship', value: 'A student on an F-1 files Form 1040-NR with Form 8843, on US income only, so bank interest isn’t taxed' },
      { label: 'Your Health Cover', value: 'Months on a marketplace plan count toward the premium tax credit and Connecticut’s premium assistance' },
      { label: 'A Social Security Number', value: `On a 1040-NR filed without one, an ITIN application holds up the refund for ${said(SSN.itinWeeks)} weeks more` },
    ],
    now: [
      'The panel reads Filed with the date, and the year’s item in What Needs You is answered.',
      'Any balance your checking account and savings can cover is paid at once, to the IRS and to each state separately. A part they can’t cover stays owed, and the panel shows what you still owe each one.',
      'Filed late with a balance owed to the IRS, a Late Penalties line shows what filing late added. A state’s own late penalty is under its Penalties, in Owed To and the state’s agency.',
      'An IRS refund shows as Refund Arrives, with its date. A state refund shows under Who It’s Owed To.',
      'An amendment shows on the panel with its form, the date you filed it, how much more or less tax it means (or “no change in the total”, with each side that moved), and an estimate of when the IRS will process it. Once processed, the same line gives the date, with any refund and its interest.',
    ],
    later: [
      `An IRS refund is paid into your checking account ${RETURN.refundDays} days after filing, or ${ITIN_REFUND_DAYS} days on a 1040-NR filed without a Social Security number. The IRS first takes from it anything you owe for another year, then any past-due tax you owe a state.`,
      `If you leave a balance owing, the IRS’s bill, Notice CP14, comes when you file, and its reminders start ${said(COLLECTION.noticeWeeks)} weeks after the deadline, or after filing if that’s later. With an IRS plan in force, a new IRS balance goes into the plan instead. See Paying Tax Owed.`,
      `If you still owe Connecticut once you’ve filed, its bill comes ${CT.notices[0]!.days} days after its deadline, or after filing if that’s later. Connecticut’s deadline is mid-April, even on a 1040-NR the IRS takes in June.`,
      'If it’s still unfiled on the deadline, a notice tells you the return is late.',
      `If it’s unfiled and you owe the IRS, Notice CP2566 comes ${SUBSTITUTE.afterDays} days after the deadline (when is estimated) with the IRS’s own figures, which leave out the foreign tax credit and the premium tax credit that only your return can claim. ${SUBSTITUTE.answerDays} days later it’s assessed, with its penalty and interest, and collected.`,
      'Past its deadline and unfiled with a balance, it weighs on you each day, the way tax owed does. See Paying Tax Owed.',
      `If you owe Connecticut, DRS acts on its own part: its notice that it made your return comes ${CT.nonFiler.firstDays} days after the deadline${CT.nonFiler.firstAssumed ? ' (estimated, since DRS doesn’t say when it acts)' : ''}, and ${CT.nonFiler.letters[0]!.days} days later it’s assessed, with a penalty of at least ${usd(CT_FLOOR)}.`,
      `An amendment is processed ${AMEND.weeks} weeks after you file it. More tax is added, with interest from the due date. Less tax comes off what you owe, and the rest is refunded with the IRS’s interest.`,
    ],
    interpret: [
      'The You Owe or Your Refund line covers the whole year, the IRS and the state together. Once it’s filed, Who It’s Owed To splits it: the IRS’s line, then each state’s.',
      'A balance on a return filed on time means the year’s withholding and credits fell short of the tax. A refund means they came to more.',
      'Filed by the IRS in the heading means the IRS assessed the year without you. If you file your own return instead, the tax becomes what your return says, the penalty and interest fall in proportion, and anything you paid beyond your own return’s tax comes back at once.',
      'Late Penalties is what filing late added on the day you filed. What the IRS charges after that grows under Penalties in Owed To The IRS.',
    ],
    next: [
      'If the panel shows a balance still owed, pay it or set up a plan: see Paying Tax Owed and Payment Plans And Waivers.',
      'If a refund is coming, watch for Refund Arrives on the panel and the money in your checking account.',
      'On an F-1 without a Social Security number, apply for one before next year’s return: see Permission To Work.',
    ],
    unavailable: [
      `A year with nothing owed or due back, and income under the year’s standard deduction (${DEDUCTIONS}), has no return and so no File It. A student on an F-1 always has one.`,
      'File It shows only on a year you haven’t filed, or one the IRS filed, where it reads File Your Own In Its Place. To change a year you’ve filed, amend it.',
      'Amend The Return… is grayed out with its reason beside it: “An amended return for this year is already with the IRS.”, or the date the time to amend it ran out. A year the IRS filed shows no Amend The Return…: file your own return in its place first.',
      'File The Amendment: “Your return as filed matches what’s on record, so there’s nothing to amend.” Nothing about the year has changed since you filed.',
      `Until you’ve read the guide’s chapter “${CHAPTER}”, File It shows as Locked.`,
    ],
    mistakes: [
      `Waiting past the deadline because your bank is short. After ${RETURN.lateMinimumAfterDays} days the IRS’s filing share is at least ${usd(RETURN.lateMinimum)}, or the whole IRS part if that’s less, and a state charges its own. File on time anyway: what goes unpaid then grows only by the late-payment share and interest.`,
      'Looking for the item in What Needs You after the deadline: it lapses on the day, but File It stays on the Papers panel for as long as the year is unfiled.',
      'Leaving the IRS’s own return in place: it leaves out the foreign tax credit and the premium tax credit. File Your Own In Its Place replaces it, even after it’s been assessed.',
    ],
    related: ['taxes.pay', 'taxes.plan', 'papers.overview', 'papers.health-cover', 'school.shifts', 'day.needs'],
    connections: [
      { to: 'bank.accounts', kind: 'immediate', why: 'Filing takes any balance from your accounts at once, the checking account first and then savings.' },
      { to: 'day.needs', kind: 'immediate', why: 'Filing answers the year’s item in What Needs You.' },
      { to: 'taxes.pay', kind: 'scheduled', why: `A balance your bank couldn’t pay at filing stays owed: the IRS’s bill comes at once, and its first reminder ${said(COLLECTION.noticeWeeks)} weeks after the deadline, or after filing if that’s later.` },
      { to: 'bank.accounts', kind: 'scheduled', why: `A refund is paid into your checking account ${RETURN.refundDays} days after filing, or ${ITIN_REFUND_DAYS} days on a 1040-NR filed without a Social Security number.` },
      { to: 'papers.overview', kind: 'immediate', why: 'The Papers line on Home says when an unfiled return is due, what filing it would pay (including any late penalty), and the tax you owe.' },
      { to: 'documents.work', kind: 'optional', why: `On a 1040-NR, having a Social Security number before you file saves the ${said(SSN.itinWeeks)} weeks an ITIN application holds up the refund.` },
    ],
    example: {
      setup: `Your 2026 return leaves ${usd(OWED)} owed to the IRS, due ${day(DUE)}, and your accounts can cover what filing takes.`,
      steps: [`Press File It by ${day(DUE)}.`, `Or wait, and press it ${LATE_DAYS} days late, on ${day(LATE_AT)}.`],
      result: `On time, it costs the ${usd(OWED)} and nothing more. On ${day(LATE_AT)}, the IRS adds ${usd(LATE_PENALTY)} of late penalties, ${usd(LATE_FILE_PART)} for filing late and ${usd(LATE_PAY_PART)} for paying late${LATE_FLOOR > 0 && LATE_FILE_PART <= LATE_FLOOR ? ` (after ${RETURN.lateMinimumAfterDays} days the filing share is at least ${usd(LATE_FLOOR)}${LATE_FLOOR < RETURN.lateMinimum ? `, the whole balance, since that’s under ${usd(RETURN.lateMinimum)}` : ''})` : ''}, and about ${usd(LATE_INTEREST)} of interest: ${usd(OWED + LATE_PENALTY + LATE_INTEREST)} in all.`,
    },
  },
  {
    id: 'taxes.pay',
    title: 'Paying Tax Owed',
    goal: 'papers',
    covers: ['tax.pay', 'tax.pay_state'],
    synonyms: ['pay the IRS', 'tax owed', 'back taxes', 'IRS letters', 'IRS bill', 'Notice CP14', 'Notice CP501', 'Notice CP504', 'final notice before levy', 'IRS levy', 'pay Connecticut', 'DRS bill', 'part payment of tax'],
    questions: ['How do I pay tax I owe?', 'Can I pay part of it?', 'What happens if I don’t pay?', 'Why did the IRS take money from my account?', 'Where does a part payment go first?'],
    where: on('returns', 'Papers, Tax Returns, Owed To The IRS And Owed To A State'),
    available: `From the guide’s chapter “${CHAPTER}”, once a filed year has a balance left owing.`,
    short: `If your bank couldn’t pay all your tax when you filed, the rest stays owed in three parts: the tax, the penalties and the interest. The last two keep growing by each authority’s rules. Pay takes any part of it from your bank now, or all of it if you leave the box blank. If you don’t pay, the IRS levies your accounts ${IRS_LEVY_DAYS} days after the deadline, and Connecticut ${CT_LEVY_DAYS} days after it, each counted from filing if that’s later.`,
    steps: [
      'Open Papers, then Tax Returns, and find the year’s panel. Owed To The IRS shows Tax Unpaid, Penalties and Interest as of now.',
      'Type an amount in Pay (Blank Pays It All), or leave it blank, and press Pay.',
      'A state has its own box under Owed To and its agency’s name, such as Pay Connecticut (Blank Pays It All), with its own Pay.',
      'Payments On The Year, and Payments To each state, list every payment, levy and refund offset with how it was split.',
    ],
    needs: [
      'A filed year with a balance still owed to that authority, or a year a state assessed without your return.',
      'The amount in your checking account and savings. A payment is taken whole or not at all, from the checking account first and then savings.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'Whatever you choose to pay, up to what you owe now' },
      // Until 2026-10-13 this said all of it drew interest from the due date. A late return’s paying-late share draws none
      // until it’s filed or assessed (`lateInterest`, `systems/taxreturn.ts`), as the engine charged it then too. Later
      // that day it said that share drew it from filing; it draws it only once unpaid 21 days after the filing or
      // the assessment, then from that day (IRC 6601(e)(2)(A), `demanded`).
      { label: 'The IRS’s Interest', value: `${pct(COLLECTION.interest)} a year, compounded daily (a 366th of it a day in a leap year), on the tax, the penalties and the interest. It runs from the due date on the tax and on a late return’s filing-late share. On that return’s paying-late share it runs only once that share is still unpaid ${DEMAND_DAYS} days after the filing or the IRS’s assessment, and then from that day. On each month’s penalty after that, it runs from when the penalty is added` },
      { label: 'The IRS’s Late-Payment Penalty', value: `${pct(RETURN.payLateMonthly)} of the unpaid tax for each month or part of a month since the due date, up to ${pct(RETURN.lateCap)} in all. On a return filed late, the months up to filing (including the month it was filed) are charged with filing, count toward the ${pct(RETURN.lateCap)}, and aren’t charged again. On a return filed on time, it’s ${pct(PLAN.reducedRate)} for each month that begins while a payment plan is in force` },
      // Its own due date, mid-April, on a 1040-NR due in June too (`stateDueOf`, from 2026-10-15); each month's interest
      // to the cent from the same day.
      { label: 'Connecticut’s Penalty', value: `${pct(CT.payLate.once)} of the tax still unpaid after its due date, charged once. The due date is mid-April, even on a 1040-NR due in June` },
      { label: 'Connecticut’s Interest', value: `${pct(CT.interest.yearly / 12)} for each month or part of a month from that date, worked out to the cent each month, on the tax alone` },
    ],
    reads: [
      { label: 'Where A Partial Payment Goes', value: `To the IRS: the tax, then the penalties, then the interest. To Connecticut DRS: ${CT_ORDER}, as its statute says` },
      { label: 'What You Owe Now', value: 'Brought up to date the minute you pay, with its interest and penalty included' },
      { label: 'Your Accounts', value: 'Your checking account, and your savings at the same bank, as far as that bank lets money out' },
    ],
    now: [
      'The amount leaves your bank, and a message says how it was split between the tax, penalties and interest, and what you still owe.',
      'The IRS’s monthly penalty is a share of the tax still unpaid, so paying down the tax lowers every later month of it.',
      'Paid in full, the year’s remaining letters are canceled, and any lien on it reads Paid: Release To Come.',
      'If you pay off everything you owe a state outside its plan, the plan ends as paid.',
    ],
    later: [
      `If you left a balance at filing, the IRS’s bill, Notice CP14, comes at once. On a return filed before the deadline it names the deadline, and nothing is added before then. Notice CP501 comes ${said(COLLECTION.noticeWeeks)} weeks after the deadline, or after filing if that’s later, then CP503, CP504 and the LT11 final notice, each ${said(COLLECTION.noticeWeeks)} weeks after the one before. ${COLLECTION.finalDays} days after the LT11, the IRS levies your checking account and savings for what they hold, and again every ${COLLECTION.againDays} days while you owe anything (how often is estimated).`,
      `Connecticut sends “${CT.notices[0]!.title}” ${CT.notices[0]!.days} days after the deadline, or after filing if that’s later (its deadline is mid-April, even on a 1040-NR the IRS takes in June), and “${CT.notices[1]!.title}” ${CT.notices[1]!.days} days after that, filing its lien then. ${CT.levy.afterDays} days later it levies, and again every ${CT.levy.againDays} days${CT.timingAssumed ? ' (these timings are estimated, since DRS doesn’t publish its own)' : ''}.`,
      `If you owe the IRS ${usd(FEDERAL_LIEN.threshold)} or more on the year at its final notice, it files a Notice Of Federal Tax Lien. See A Tax Lien.`,
      'A federal refund from another year goes first to what you owe the IRS, then to past-due tax you owe a state. A Connecticut refund goes first to what you owe Connecticut.',
      'While you owe tax, or a return is past its deadline and unfiled with a balance, each day ends with 4 more points of stress and 2 fewer of morale, scaled by your temperament. It’s the same worry any money trouble brings, felt once a day however many troubles there are.',
    ],
    interpret: [
      'Tax Unpaid, Penalties and Interest are as of now. The Still Owed line in the year’s table is their total.',
      `The note under Penalties gives the rate running: ${pct(RETURN.payLateMonthly)} a month, or ${pct(PLAN.reducedRate)} for each month that begins while an IRS plan is in force on a return filed on time. A state’s note gives its own rule.`,
      'A state whose notes read “None added: the game doesn’t have this state’s rules” keeps its balance with no penalty or interest, because its collection rules aren’t in the game.',
      'In a list of payments, “taken by levy” is a levy, and “kept from a refund” is a refund kept for what you owe, whether another year’s or an amended return’s, in the IRS’s list and a state’s alike. A state’s list also reads “paid through the payment plan” for its plan’s payments.',
    ],
    next: [
      'If you can’t pay it all soon, apply for a payment plan to stop the letters and the levy: see Payment Plans And Waivers.',
      'Once a year is paid in full, check for a lien under it and ask for its release if the authority needs asking: see A Tax Lien.',
    ],
    unavailable: [
      'Pay shows only while you owe that authority something on the year.',
      '“Enter an amount above zero.” for nothing or less.',
      'An amount over what you owe: “You owe …. Pay that amount or less.”',
      '“Your bank can’t cover …, so nothing was paid.”: your checking account and savings together hold less than the amount. Pay a smaller part.',
    ],
    mistakes: [
      'Waiting for the levy: it takes whatever your checking account and savings hold on the day, up to everything you owe, whatever that money was for.',
      `Watching only the IRS: Connecticut levies ${CT_LEVY_DAYS} days after the deadline, or after filing if that’s later, against the IRS’s ${IRS_LEVY_DAYS}, so Connecticut levies first.`,
      'Holding back because a part won’t clear it: a part paid to the IRS cuts the tax first, and its penalty is a share of the tax left. Connecticut takes its penalty and interest first, so there a part shrinks the tax last.',
    ],
    related: ['taxes.return', 'taxes.plan', 'taxes.lien', 'bank.accounts', 'papers.overview'],
    connections: [
      { to: 'taxes.return', kind: 'prerequisite', why: 'You owe a balance only on a filed return, or on one the IRS or a state assessed without you.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'Each payment leaves your accounts at once, the checking account first and then savings.' },
      { to: 'taxes.lien', kind: 'immediate', why: 'Paying a year in full moves its lien to Paid: Release To Come.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'If you leave it owing, a levy takes what your accounts hold on its day.' },
      { to: 'body.how', kind: 'immediate', why: 'Tax owed weighs on you: each day ends with more stress and less morale until it’s paid.' },
      { to: 'taxes.plan', kind: 'optional', why: 'When you can’t pay at once, a plan stops collection for as long as you keep it up.' },
    ],
    example: {
      setup: `Your 2026 return, filed on time, left ${usd(OWED)} of tax owed to the IRS and ${usd(CT_TAX)} to Connecticut, and your bank couldn’t pay either.`,
      steps: [`On ${day(PAID_AT)}, type ${IRS_PART / 100} in Pay (Blank Pays It All) and press Pay.`, `Type ${CT_PAID / 100} in Pay Connecticut (Blank Pays It All) and press Pay.`],
      result: `All ${usd(IRS_PART)} goes to the IRS’s tax, leaving ${usd(OWED - IRS_PART)}, so each month’s penalty from then on is ${usd((OWED - IRS_PART) * RETURN.payLateMonthly)} instead of ${usd(OWED * RETURN.payLateMonthly)}. By then Connecticut has added ${usd(CT_PARTS.penalty!)} of penalty and ${usd(CT_PARTS.interest!)} of interest. Its ${usd(CT_PAID)} pays ${CT_ORDER}: ${usd(CT_TOOK.penalty!)}, ${usd(CT_TOOK.interest!)} and ${usd(CT_TOOK.tax!)}, leaving ${usd(CT_TAX - CT_TOOK.tax!)} of tax.`,
    },
  },
  {
    id: 'taxes.plan',
    title: 'Payment Plans And Waivers',
    goal: 'papers',
    covers: ['tax.apply_plan', 'tax.catch_up_plan', 'tax.revise_plan', 'tax.apply_state_plan', 'tax.catch_up_state_plan', 'tax.request_waiver'],
    synonyms: ['installment agreement', 'IRS payment plan', 'Simple Payment Plan', 'short-term payment plan', 'Form 9465', 'Notice CP523', 'revise the plan', 'catch up on a plan', 'state payment plan', 'three-year penalty', 'penalty waiver'],
    questions: ['Can I pay my taxes monthly?', 'What does a payment plan cost?', 'What happens if I miss a plan payment?', 'Does a plan stop the levy?', 'Can a state’s penalty be waived?'],
    where: on('returns', 'Papers, Tax Returns, IRS Payment Plan And Connecticut DRS Installment Agreement'),
    available: `From the guide’s chapter “${CHAPTER}”. The plan panels show while you owe anything, or once a plan has a history.`,
    short: `A payment plan spreads what you owe over time and stops collection for as long as you keep it up. The IRS Payment Plan covers every year you owe the IRS: monthly payments on up to ${usd(PLAN.longMax)}, for a setup fee of up to ${usd(Math.max(...Object.values(PLAN.fee)))}, or everything paid within ${PLAN.shortDays} days with no fee.\n\nEach state has its own plan, separate from the IRS’s: Connecticut’s ${CT.plan.name} runs ${CT.plan.minMonths} to ${CT.plan.maxMonths} months on up to ${usd(CT.plan.max!)}. Interest keeps adding up under every plan.`,
    steps: [
      `On Tax Returns, find the IRS Payment Plan panel. Under Plan Type, choose Monthly Payments or Paid Within ${PLAN.shortDays} Days.`,
      'For monthly payments, type an amount in Each Month (USD) or leave the lowest one shown, leave By Direct Debit ticked or clear it, read the setup fee below, and press Apply.',
      `For a state, use its own panel, such as Connecticut DRS ${CT.plan.name}: choose the months under Pay Over and press Apply For The Plan.`,
      'If you miss a payment, press Catch Up on the plan’s panel. To change a monthly IRS plan, type a New Monthly Payment (USD) and press Revise The Plan.',
      'Under a year with Oregon’s three-year penalty, press Ask For Its Waiver.',
    ],
    needs: [
      'Something owed to that authority, and every return past its due date filed.',
      `For the IRS: less than ${usd(PLAN.shortMax)} for the short-term plan, or ${usd(PLAN.longMax)} or less for monthly payments, with each month at least what you owe spread over ${PLAN.leastMonths} months.`,
      `For Connecticut: up to ${usd(CT.plan.max!)}, over ${CT.plan.minMonths} to ${CT.plan.maxMonths} months, with no year it has levied still owed. A year a levy paid off doesn’t count.`,
      'To catch up, a plan with a missed payment. To revise, a monthly IRS plan that’s in force or behind.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'IRS Setup Fee, Monthly', value: `${usd(PLAN.fee.onlineDebit)} by direct debit, ${usd(PLAN.fee.online)} without. If your latest return shows income of at most ${PLAN.lowIncomeShare * 100}% of that year’s poverty line, or you have no return yet, ${usd(PLAN.fee.lowIncomeDebit)} by direct debit or ${usd(PLAN.fee.lowIncome)} without` },
      { label: 'IRS Short-Term Plan', value: 'No fee' },
      { label: 'Revising An IRS Plan', value: usd(PLAN.reviseFee) },
      { label: 'Connecticut’s Plan', value: CT.plan.fee ? usd(CT.plan.fee) : 'No fee' },
      { label: 'The IRS’s Lowest Monthly Payment', value: `What you owe spread over ${PLAN.leastMonths} months`, estimate: true },
      { label: 'How Often A Payment Is Taken', value: 'Every 30 days from approval, from your accounts', estimate: false },
    ],
    reads: [
      { label: 'A Social Security Number', value: `With one, the IRS decides an online application within a minute. Without one, Form 9465 goes by mail and is answered in ${PLAN.mailDays} days` },
      { label: 'Your Latest Return', value: 'Its income decides whether you pay the IRS’s low-income fee' },
      { label: 'Every Year Owed', value: 'One IRS plan covers them all, paying the oldest first' },
      { label: 'When Each Return Was Filed', value: `The IRS’s late-payment penalty falls to ${pct(PLAN.reducedRate)} for each month that begins under a plan only on a return filed on time` },
      { label: 'Oregon’s Waiver Schedule', value: `${pct(OREGON.waiver.beforeNotice)} of the penalty if your return came before any notice, ${pct(OREGON.waiver.afterDemand)} after a demand, and ${pct(OREGON.waiver.afterAssessment)} after an assessment` },
    ],
    now: [
      'Once you apply, the IRS plan reads Being decided, and the IRS’s letters stop.',
      `Once it’s approved, the setup fee leaves your bank. On a return filed on time, each month of late-payment penalty that begins from then on is ${pct(PLAN.reducedRate)}; the month already begun stays at ${pct(RETURN.payLateMonthly)}.`,
      'Connecticut decides at once, stops its letters, and files no lien while the plan is in force.',
      'Catch Up pays the missed payment now (everything you owe, on a short-term plan) and puts the plan back in force.',
      `Revise The Plan pays its ${usd(PLAN.reviseFee)} fee and sets the new monthly payment on everything you owe. A plan that was behind is back in force, the missed payment left in what you owe, and its next payment comes 30 days later.`,
      'A waiver takes its share off the three-year penalty, or refunds it if the year is already paid.',
    ],
    later: [
      `A monthly plan takes its payment every 30 days, oldest year first. A short-term plan takes everything you owe on its ${PLAN.shortDays}th day.`,
      `If your bank can’t cover a payment, Notice CP523 gives you ${PLAN.defaultDays} days to catch up. After that the plan ends, and ${said(COLLECTION.noticeWeeks)} weeks later the IRS sends its final notice before a levy.`,
      `New tax while a monthly plan is in force joins it if it’s no more than ${said(PLAN.addedPayments)} payments’ worth. More than that brings Notice CP523 and ${PLAN.defaultDays} days to revise the plan before it ends.`,
      `Connecticut ends its plan at the first missed payment. DRS publishes no rule for this, so that part is the game’s. ${CT.notices[1]!.days} days later it sends “${CT.notices[1]!.title}” and files its lien. New York allows until the next due date and California gives a ${CA_CURE_DAYS}-day notice, and for those Catch Up appears.`,
      'Paid off, a plan ends as Paid in full.',
      'If the IRS declines a plan, it reads Declined, a notice says why, and the IRS’s letters on what you still owe start again from the step they had reached.',
    ],
    interpret: [
      'The panel’s subtitle is the plan’s status: Being decided, In force, A payment missed, Ended, Paid in full or Declined, for the IRS’s plan and a state’s alike.',
      'Covers is what the plan took in when it began, or when it was last revised. Each Month and Next Payment are what it takes and when. While a plan is being decided, Answered By gives the day you’ll hear.',
      'By Direct Debit changes the setup fee and the words beside Each Month. Either way, every plan payment is taken from your accounts on its day.',
      'The Plan’s History lists every payment, missed payment and change.',
      'Under a plan, a year’s balance still grows by its interest, so a longer plan costs more in total.',
      'A Connecticut plan has no Catch Up, and Oregon’s waiver is only for a year you owed Oregon. A life lived in New Haven files in Connecticut, so it meets neither.',
    ],
    next: [
      'Keep each payment in your checking account or savings on its day, every 30 days.',
      'If you can pay more, use Pay on the year’s panel to finish sooner: interest keeps adding up while the plan runs.',
      'Once a year is paid off, check for a lien under it: see A Tax Lien.',
    ],
    unavailable: [
      'Apply shows while you owe the IRS and have no IRS plan being decided, in force or behind.',
      'Apply, for monthly payments: “Your bank can’t cover the … setup fee, so you haven’t applied and nothing was charged.” Applied for by mail, a plan is declined on its decision day if your bank can’t pay the fee then.',
      '“The IRS needs every return filed first, and your … return isn’t. File it first.”',
      `A short-term plan for ${usd(PLAN.shortMax)} or more: “A short-term plan is for less than ….” A Simple Payment Plan over ${usd(PLAN.longMax)}: a larger balance needs a financial statement, which the game doesn’t offer.`,
      `“The lowest monthly payment is …: what you owe, spread over ${PLAN.leastMonths} months.”`,
      'For a state, each refusal names its agency, such as Connecticut DRS: “… needs every return filed first, and your … return isn’t. File it first.”, a balance over its limit, months outside its range (“… sets up a plan over 2 to 12 months.”), a plan already applied for or in force (“You already have a plan with ….”), or a year it has levied that’s still owed.',
      'Catch Up shows only while a plan is behind, and your bank has to cover the payment: “Your bank can’t cover …, so nothing was paid.” On a plan that isn’t behind: “Your plan isn’t behind, so there’s nothing to catch up.”, or for a state’s plan, which Connecticut ends rather than lets fall behind, “That plan isn’t behind, so there’s nothing to catch up.”',
      `Revise The Plan shows only on a monthly IRS plan in force or behind. It refuses a payment under the lowest monthly payment, more than ${usd(PLAN.longMax)} owed now, or a ${usd(PLAN.reviseFee)} fee your bank can’t cover.`,
      'Ask For Its Waiver: “There’s no three-year penalty on that year.”, “Its waiver has already been decided.”, “File your own return for the year first.”, or more than a year since full payment.',
    ],
    mistakes: [
      'Setting a monthly payment your accounts can’t keep: a missed one brings CP523 at once. Keep the payment in your checking account or savings on its day.',
      `Applying with no Social Security number and paying nothing meanwhile: the IRS answers a mailed Form 9465 in ${PLAN.mailDays} days, and interest runs the whole time.`,
      'Taking the IRS’s plan for a state’s: it covers federal tax only. Apply to Connecticut for its own.',
      `Missing a Connecticut payment: its plan ends at once, where the IRS gives you ${PLAN.defaultDays} days. Pay the year off with Pay if you can.`,
    ],
    related: ['taxes.pay', 'taxes.return', 'taxes.lien', 'documents.work', 'bank.accounts'],
    connections: [
      { to: 'taxes.return', kind: 'prerequisite', why: 'Every return past its due date has to be filed before the IRS or a state sets up a plan.' },
      { to: 'taxes.pay', kind: 'immediate', why: 'A plan being decided or in force stops the letters and the levy on what you owe.' },
      { to: 'taxes.lien', kind: 'immediate', why: 'While a state plan is in force, no lien is filed, and one that was only announced comes to nothing.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Each plan payment is taken from your accounts on its day, every 30 days.' },
      { to: 'documents.work', kind: 'optional', why: `A Social Security number gets an IRS plan decided within a minute. Without one it takes ${PLAN.mailDays} days.` },
    ],
    example: {
      setup: `You owe the IRS ${usd(PLAN_OWED)} across two years. Every return is filed, the later one in February before it was due. You have a Social Security number, and your latest return’s income is under ${PLAN.lowIncomeShare * 100}% of the poverty line.`,
      steps: ['Choose Monthly Payments, leave Each Month at its lowest and By Direct Debit ticked, and press Apply.', 'Keep the payment in your checking account each month.'],
      result: `It’s approved within a minute${PLAN.fee.lowIncomeDebit ? `, for a ${usd(PLAN.fee.lowIncomeDebit)} setup fee` : ', with no setup fee at the low-income rate'}: ${usd(PLAN_LEAST)} a month, the ${usd(PLAN_OWED)} over ${PLAN.leastMonths} months, with the first payment 30 days later. The IRS’s letters stop. On both years’ returns, filed on time, each month of penalty that begins under the plan is ${pct(PLAN.reducedRate)} instead of ${pct(RETURN.payLateMonthly)}: on the earlier year from its next month (the month already begun stays at ${pct(RETURN.payLateMonthly)}), and on the later year from its first month past its due date. Interest keeps adding up, so paying more with Pay shortens the plan.`,
    },
  },
  {
    id: 'taxes.lien',
    title: 'A Tax Lien',
    goal: 'papers',
    covers: ['tax.lien_release', 'tax.lien_dispute', 'tax.federal_lien_withdraw'],
    synonyms: ['tax lien', 'Notice Of Federal Tax Lien', 'Connecticut Tax Lien', 'lien release', 'Form 12277', 'Letter 3172', 'lien filed in error', 'tax warrant', 'lien withdrawal'],
    questions: ['Why was a lien filed?', 'How do I get a tax lien released?', 'Does a tax lien hurt my credit?', 'What if a lien was filed in error?'],
    where: on('returns', 'Papers, Tax Returns, The Year’s Return, The IRS’s Lien Or Connecticut DRS’s Lien'),
    available: `From the guide’s chapter “${CHAPTER}”. A lien shows under the year it was filed for once one is on record.`,
    short: `A lien is a public claim an authority files when a balance stays unpaid deep into collection: Connecticut DRS with its notice of intent to levy, and the IRS at its final notice if you owe ${usd(FEDERAL_LIEN.threshold)} or more on the year. In the game a lien changes only its own record: no credit record or bank reads it.\n\nPaying in full is what gets it released. The buttons under it ask for a release where the authority needs asking, or a withdrawal: the IRS’s once it has released its lien, or any lien filed in error.`,
    steps: [
      'Open the year’s panel on Tax Returns. A lien shows as The IRS’s Lien or Connecticut DRS’s Lien, with its status and The Lien’s History.',
      'Pay the year in full with Pay. The lien reads Paid: Release To Come.',
      'For Connecticut, then press Ask For Its Release.',
      'Once the IRS has released its lien, press Ask For Its Withdrawal (Form 12277). If it was filed in error, the button reads Ask For Its Release As Erroneous, and you can press it at once.',
      'For a state lien on an assessment that your own return later showed was already paid, Ask For Its Withdrawal As Filed In Error shows on that lien alone. Press it.',
    ],
    needs: [
      'A lien on the year.',
      'For a release, what it was filed for paid in full.',
      'For the IRS’s withdrawal, its lien released, and none of your returns for the three tax years before this one left unfiled past its due date with a balance.',
      'For an error, your own return having replaced an assessment, and showing no more owed than you’d paid before the lien was filed.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: `${CT_LIEN.fee ? `Connecticut adds its ${usd(CT_LIEN.fee)} recording fee to what you owe` : 'Connecticut charges no fee for its lien'}. The IRS’s recording fees aren’t published, so the game charges none` },
      { label: 'The IRS’s Release', value: `${FEDERAL_LIEN.releaseDays} days after payment in full, or ${FEDERAL_LIEN.errorDays} days after you ask for it as erroneous` },
      { label: 'The IRS’s Withdrawal', value: `Decided ${FEDERAL_LIEN.withdrawDays} days after Form 12277 goes in`, estimate: FEDERAL_LIEN.withdrawAssumed },
      { label: 'Connecticut’s Days', value: `Released ${CT_LIEN.releaseDays} days after you ask; withdrawn as filed in error ${CT_LIEN.error.days} days after you ask`, estimate: CT_LIEN.releaseAssumed || CT_LIEN.error.daysAssumed },
    ],
    reads: [
      { label: 'The Balance When Filed', value: 'Everything owed on the year that day: the amount the lien was filed for' },
      { label: 'Payments Before It Was Filed', value: 'For an error: the tax you’d paid on the year before the lien went on record' },
      { label: 'Your Last Three Years’ Returns', value: 'For the IRS’s withdrawal after release: the three tax years before this one, whichever year the lien is on, each filed if it’s past due with a balance' },
    ],
    now: [
      'Once you ask for its release, Connecticut’s lien shows the date it’s to be released by.',
      'Once you ask for a withdrawal, a lien reads Asked To Be Withdrawn, with the date a decision is due.',
      'Your money and every other record stay as they were.',
    ],
    later: [
      `Paid in full, the IRS’s lien is released ${FEDERAL_LIEN.releaseDays} days later on its own, and a notice says you can then ask for it to be withdrawn.`,
      `Connecticut’s is released ${CT_LIEN.releaseDays} days after you ask, recorded in ${CT_LIEN.recordedAt}.`,
      'A withdrawal is decided on its date, and the lien reads Withdrawn. The IRS’s notice says a withdrawn notice is treated as if it had never been filed, and a state refunds any fee it charged for the lien.',
      'Collection on the year continues while a lien stands. The lien itself takes no money.',
    ],
    interpret: [
      'Its status is one of: Notice Of Intent Sent, Filed, Paid: Release To Come, Released, Asked To Be Withdrawn, Withdrawn, or Not Filed.',
      '“when collection reached that stage” or “because the payment plan requires one” says why it went on record.',
      `The line about its effect is in the authority’s own words. Connecticut’s says “${CT_LIEN.effect}” The IRS’s says it may limit your ability to get credit.`,
      'In the game, no credit record or bank reads a lien, so its status is all that changes.',
      'On a lien filed for tax you owed, the panel says so instead of offering Ask For Its Withdrawal As Filed In Error: “It was filed for tax you owed, so it wasn’t filed in error. It’s released once that’s paid, not withdrawn.” Connecticut’s always does, because it takes a payment to its penalty and interest before its tax and files its lien only while something is owed. Your own return in place of its assessment leaves the tax as it was, since DRS assessed it from the same figures.',
      `A student’s year never owes the IRS ${usd(FEDERAL_LIEN.threshold)}: a year of a living-cost scholarship and work-study owes it less than two thousand dollars. The IRS’s lien and its Form 12277 are for much bigger balances.`,
    ],
    next: [
      'If a lien is filed, pay the year in full as soon as you can: see Paying Tax Owed.',
      'After paying Connecticut, press Ask For Its Release, because DRS releases its lien only when asked.',
      'After the IRS releases its lien, you can ask for it to be withdrawn on Form 12277.',
    ],
    unavailable: [
      'A lien’s buttons show only under a year that has one. Ask For Its Release, and the IRS’s withdrawal, are grayed out with the reason beside them until you can press them. Ask For Its Withdrawal As Filed In Error shows only on a lien that was filed in error.',
      '“The lien has already been released.” or “The lien has already been withdrawn.”, or that you’ve already asked, with the date a decision is due.',
      '“You can ask for its release once what it was filed for is paid in full.”',
      'For a state that releases without being asked: “There’s nothing to ask: it’s released on its own”, with its days.',
      `For the IRS: “You can ask for a withdrawal once the lien is released, which happens within ${FEDERAL_LIEN.releaseDays} days of paying in full. Only a lien filed in error can be withdrawn sooner, and this one wasn’t.”`,
      '“The IRS withdraws a lien after payment only if your last three years’ returns are filed”, naming the year that isn’t.',
      'Filed in error: not offered where the lien was filed for tax you owed, and the panel says so.',
    ],
    mistakes: [
      'Asking for a withdrawal on a lien filed for tax you owed: it’s refused. Pay it, and it’s released.',
      'Paying Connecticut in full and stopping there: DRS releases its lien only when you ask, so press Ask For Its Release.',
      'Leaving one of the last three tax years unfiled with a balance: the IRS’s Form 12277 waits on those returns.',
    ],
    related: ['taxes.pay', 'taxes.plan', 'taxes.return'],
    connections: [
      { to: 'taxes.pay', kind: 'prerequisite', why: 'A lien is released only once what it was filed for is paid in full.' },
      { to: 'taxes.return', kind: 'prerequisite', why: 'A lien is withdrawn as filed in error only after your own return has replaced the assessment it was filed on.' },
      { to: 'taxes.plan', kind: 'optional', why: 'While a state plan is in force, no lien is filed. Connecticut files its lien at its second notice.' },
    ],
    example: {
      setup: `You filed your 2026 return on ${day(LIEN_FILED)}, with ${usd(LIEN_TAX)} owed to Connecticut that your bank couldn’t pay.`,
      steps: [
        `${day(LIEN_BILL)}: “${CT.notices[0]!.title}”.`,
        `${day(LIEN_AT)}: “${CT.notices[1]!.title}”, and its lien is filed for ${usd(LIEN_AMOUNT)}, the tax with its penalty and interest by then.`,
        'Pay it all with Pay Connecticut (Blank Pays It All), then press Ask For Its Release.',
      ],
      result: `The lien reads Paid: Release To Come, then shows a date ${CT_LIEN.releaseDays} days later, when it reads Released. Paid before ${day(LIEN_AT)}, it would never have been filed. Left unpaid, the levy follows ${CT.levy.afterDays} days after it.`,
    },
  },
];
