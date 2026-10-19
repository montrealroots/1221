/**
 * SLATE — the guide's reference: money and the bank (from 2026-10-12; `content/guide/types.ts`).
 *
 * The figures are the rules' own, imported: the bank tables (`content/banks.ts`, `content/cards.ts`,
 * `content/banks-lending.ts`, `content/bankopening.ts`, `content/cash.ts`, `content/security.ts`,
 * `content/accountlife.ts`) and the systems' constants. The worked examples bank at Chase, the first bank a life in the
 * United States opens at unless another is chosen (`startingBank`), and at the Modest means a life can start with
 * (`wealthIn`). A few numbers the systems keep to themselves are written as text: the record's monthly moves and the
 * card's opening limits and the fifth a raise adds (`systems/credit.ts`, `systems/cardlife.ts`), the day's worry
 * (`systems/spending.ts`) and the hours a standing order, a statement and the month's end run at. The score a raise
 * needs was text too until 2026-10-17; it's the rule's own now (`RAISE_FROM`).
 *
 * The screen's tabs are named through constants: the title-case sweep reads a `tab` property written as a literal as a
 * label, and an id isn't one.
 */

import { formatMoney } from '../../core/money';
import { spokenList } from '../../core/text';
import { bankById } from '../banks';
import { CARDS, type CardProduct } from '../cards';
import { CASH } from '../cash';
import { LENDING, SWITCHING } from '../banks-lending';
import { ESTIMATE_CARD_DAYS, ESTIMATE_SEND_DAYS, OPENING, TRANSFERS } from '../bankopening';
import { FRAUD_LAW, SECURITY, type DebitTier } from '../security';
import { ACCOUNT_LIFE, UNCLAIMED } from '../accountlife';
import { ROUND_UPS, type RoundUpRule } from '../roundups';
import { US_SAFE_HARBOR } from '../latefees';
import { CHAPTER_FOR } from '../tutorial';
import { APPROVE_FROM, INQUIRY } from '../../systems/cardlife';
import { MARK_GONE_GIVES, MARK_YEARS, MIN_CYCLE_DAYS, NO_CARD, RAISE_FROM, priceWithin } from '../../systems/credit';
import { PLAN_FREE_IN_INTRO, PLAN_MONTHS } from '../../systems/cardoffers';
import { OWNER_SURCHARGE } from '../../systems/cash';
import { CHEX, ESTIMATE, FRANCE } from '../../systems/lending';
import { BRANCH_MINUTES, PRIMARY_DOES } from '../../systems/bankmoves';
import { DEPOSIT_LEAD, PAYER_LEAD } from '../../systems/routing';
import { ESTIMATE_DAYS, ESTIMATE_REFUND_DAYS, ESTIMATE_RUSH_DAYS, ESTIMATE_YEARS, EXPOSURE } from '../../systems/security';
import { BREAK_NOTICE, END_WORDS, ESCHEAT_NOTICE_DAYS } from '../../systems/accountlife';
import { roundUpMoney } from '../../systems/roundups';
import { LOOKAHEAD_DAYS } from '../../systems/obligations';
import { wealthIn } from '../../world/bootstrap';
import { ASSUMED_DAYS, ASSUMED_MARGIN, ASSUMED_OPENING_AGE, NON_RESIDENT_TAX, RETENTION_CONFIDENCE, US_REPORTS, US_WIRES, allHomeTerms, homeTerms } from '../homeaccounts';
import { splitOf } from '../../systems/homeaccount';
import type { GuideEntry } from './types';

// --- the screen -------------------------------------------------------------------------------------------------------

const BANK = '/workspace/bank';
const ACCOUNTS = 'accounts';
const CARDS_TAB = 'cards';
const PAYMENTS = 'payments';
const BORROWING = 'borrowing';

// --- how a figure is written ------------------------------------------------------------------------------------------

/** Dollars as a US bank writes them: whole where the sum is whole, with its cents where it isn't. */
const usd = (cents: number): string => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
/** A share as the guide writes it: 2.75%, 15.315%. */
const percentOf = (rate: number): string => `${Number((rate * 100).toFixed(3))}%`;
/** A fee, or "free" for none. */
const fee = (cents: number | undefined): string => (cents ? usd(cents) : 'free');
/** The same, opening a sentence. */
const Fee = (cents: number | undefined): string => (cents ? usd(cents) : 'Free');
/** A rate as a percent, to two places at most. */
const pct = (rate: number): string => `${Number((rate * 100).toFixed(2))}%`;
/** An hour of the bank's day, 12.5 as 12:30 PM. */
const hour = (h: number): string => {
  const whole = Math.floor(h);
  return `${whole % 12 === 0 ? 12 : whole % 12}:${String(Math.round((h - whole) * 60)).padStart(2, '0')} ${whole < 12 ? 'AM' : 'PM'}`;
};
/** "3, 6 or 12". */
const orList = (items: readonly (string | number)[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`);
/** "Chase and Bank of America". */
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
/** "1 business day", "3 business days". */
const businessDays = (n: number): string => `${n} business day${n === 1 ? '' : 's'}`;
/** The chapter of the guide that opens a feature. */
const chapter = (feature: string): string => CHAPTER_FOR[feature]?.title ?? 'its chapter';
const card = (id: string): CardProduct => { const found = CARDS[id]; return found && !('none' in found) ? found : { name: 'Its Card', kind: 'revolving', source: '', asOf: '' }; };

// --- the banks the examples use ---------------------------------------------------------------------------------------

const CHASE = bankById('us-chase')!;
const CHECKING = CHASE.current;
const SAVINGS = CHASE.savings;
const CHASE_CARD = card('us-chase');
const WF_CARD = card('us-wells-fargo');
const CHASE_CASH = CASH['us-chase']!;
const CHASE_SAFE = SECURITY['us-chase']!;
const CHASE_LIFE = ACCOUNT_LIFE['us-chase']!;
const CHASE_OPEN = OPENING['us-chase']!;
const BOA_OPEN = OPENING['us-bank-of-america']!;
const WF_OPEN = OPENING['us-wells-fargo']!;
const CITI_OPEN = OPENING['us-citi']!;
const CAPITAL_ONE_OPEN = OPENING['us-capital-one']!;
const BOA = bankById('us-bank-of-america')!;
const CHASE_TERM = LENDING['us-chase']!.term!;
const chaseOverdraft = LENDING['us-chase']?.overdraft;
const CHASE_OD = chaseOverdraft?.kind === 'per_item' ? chaseOverdraft : { fee: 0, maxPerDay: 0, graceUpTo: 0, smallItemsFree: 0 };
const WF_LOAN = LENDING['us-wells-fargo']!.loan!;
const CITI_LOAN = LENDING['us-citi']!.loan!;
const CAPITAL_ONE_LOAN = LENDING['us-capital-one']!.loan!;
const US_LAW = FRAUD_LAW.US!;
const US_IDLE = UNCLAIMED.US!;
const GB_SWITCH = SWITCHING.GB!;
const GERMAN_MONTH = formatMoney(CASH['de-deutsche-bank']?.savingsMonthly ?? 0, 'EUR', { cents: false });
const [DEBIT_PROMPT, DEBIT_LATER] = [US_LAW.debitTiers[0]!, US_LAW.debitTiers[1]!];
/** A debit tier's clock, from where the law starts it: "2 business days of learning of it", "60 days of the statement that showed it". */
const clockOf = (tier: DebitTier, word: 'of' | 'from'): string => `${tier.withinDays} ${tier.business ? 'business ' : ''}days ${word} ${tier.from === 'statement' ? 'the statement that showed it' : 'learning of it'}`;
/** Japan's and Canada's schemes, the two where money between banks neither lands at once nor waits on a bank's own days. */
const JAPAN = TRANSFERS.JP!;
const CANADA = TRANSFERS.CA!;
/** Round-ups, bank by bank (`content/roundups.ts`): the banks a rule picks out, by name, and Wells Fargo's and NatWest's figures. */
const roundBanks = (keep: (rule: RoundUpRule) => boolean): string[] => Object.entries(ROUND_UPS).filter(([, rule]) => keep(rule)).map(([id]) => bankById(id)?.name ?? id);
const ROUND_ALL = roundBanks(() => true);
const WF_RULE = ROUND_UPS['us-wells-fargo']!.ways[0]!;
const WF_FLAT = WF_RULE.kind === 'flat' ? Math.round((WF_RULE.amounts?.[0] ?? 0) * 100) : 0;
const NATWEST_RULE = ROUND_UPS['gb-natwest']!.ways[0]!;
const NATWEST_MOST = NATWEST_RULE.kind === 'change' ? NATWEST_RULE.multipliers?.at(-1) ?? 1 : 1;
const CITI = ROUND_UPS['us-citi']!;
const TD_WAY = ROUND_UPS['ca-td']!.ways[0]!;
const TD_RANGE = TD_WAY.kind === 'flat' && TD_WAY.range ? TD_WAY.range : { min: 0, max: 0 };
const ING_FLOOR = ROUND_UPS['de-ing']!.pausedUnder ?? 0;
/** Pounds as NatWest writes them: pence under a pound, else pounds and pence. */
const gbp = (pence: number): string => (pence < 100 ? `${pence}p` : formatMoney(pence, 'GBP'));
/** The banks whose plan made in the card's introductory months costs nothing for its life. */
const PLAN_FREE_AT = [...PLAN_FREE_IN_INTRO].map((id) => bankById(id)?.name ?? id);

/** A life with Modest means, the third of six a new life can start with. */
const MODEST = wealthIn('modest', 'USD');
const RECORD = MODEST.creditScore;
const OWED = -MODEST.cardBalance;
// A bank kept at home (from 2026-10-16): the research's banks and countries, and a Modest family's money kept at Barclays.
const HOME_BANKS = allHomeTerms().filter((t) => !t.unusable).length;
const HOME_COUNTRIES = new Set(allHomeTerms().map((t) => bankById(t.bankId)?.iso)).size;
const BARCLAYS = bankById('gb-barclays')!;
const SPARKASSE = bankById('de-berliner-sparkasse')!;
// Arion's debit card, its amount and age from its price list and its timing SLATE's simulation (from brief 10, 2026-10-16).
const ARION = bankById('is-arion')!;
const ARION_YEAR = ARION.card!.year!;
const LONDON_SPLIT = splitOf(MODEST, 'USD', BARCLAYS, true);
const WORTH = MODEST.checking + MODEST.savings - OWED;
const CHASE_RATE = priceWithin(CHASE_CARD.aprFrom ?? 0, CHASE_CARD.aprTo ?? 0, RECORD);
const AFTER_APPLYING = RECORD - INQUIRY;
const WF_RATE = priceWithin(WF_CARD.aprFrom ?? 0, WF_CARD.aprTo ?? 0, AFTER_APPLYING);
/** A $300 first statement on the Wells Fargo card, in its 0% months: its share, and the minimum the floor makes it. */
const WF_STATEMENT = 300_00;
const WF_SHARE = Math.round(WF_STATEMENT * (WF_CARD.minimumShare ?? 0));
const WF_MINIMUM = Math.min(WF_STATEMENT, Math.max(WF_CARD.minimumFloor ?? 0, WF_SHARE));
const CHASE_LATE_FIRST = Math.min(CHASE_CARD.lateFee ?? 0, US_SAFE_HARBOR.first);
const CHASE_LATE_AGAIN = Math.min(CHASE_CARD.lateFee ?? 0, US_SAFE_HARBOR.repeat);

/** A $1,000 CD at Chase, broken after sixty days, and run to its end. */
const CD = 1_000_00;
const CD_MONTHS = CHASE_TERM.months;
const CD_BAND = (CHASE_LIFE.penaltyDays ?? []).find((b) => b.underMonths === undefined || CD_MONTHS < b.underMonths);
const CD_PENALTY_DAYS = CD_BAND?.days ?? 0;
const CD_EARNED_60 = Math.floor((CD * CHASE_TERM.rate * 60) / 365);
const CD_PENALTY = Math.round((CD * CHASE_TERM.rate * CD_PENALTY_DAYS) / 365);
const CD_FULL = Math.floor((CD * CHASE_TERM.rate * Math.round(CD_MONTHS * 30.44)) / 365);
const CHASE_BANDS = (CHASE_LIFE.penaltyDays ?? []).map((b) => (b.underMonths !== undefined ? `${b.days} days’ interest on a term under ${b.underMonths} months` : `${b.days} for a longer one`)).join(', ');

/** $350 in Chase Savings for a month, at its rate. */
const SAVINGS_MONTH = Math.floor((350_00 * (SAVINGS.rate ?? 0) * 31) / 365);

/** A $600 plan over six months on the Chase card, and the interest the same payments would draw. */
const PLAN = 600_00;
const PLAN_FEE = Math.round(PLAN * (CHASE_CARD.planFeeShare ?? 0));
const PLAN_INTEREST = Math.round(([6, 5, 4, 3, 2, 1].reduce((sum, n) => sum + n, 0) * 100_00 * CHASE_RATE) / 12);

/** $60 of cash, and what each way of taking it costs at Chase. */
const OWNER = OWNER_SURCHARGE.US?.fee ?? 0;
const ADVANCE_FEE = Math.max(CHASE_CARD.cashFeeMin ?? 0, Math.round(60_00 * (CHASE_CARD.cashFeeShare ?? 0)));

export const MONEY: readonly GuideEntry[] = [
  {
    id: 'money.affairs',
    title: 'Your Affairs And What You’re Worth',
    goal: 'money',
    covers: ['ui.money', 'look.account', 'look.networth', 'look.debt'],
    synonyms: ['net worth', 'money line', 'account balance', 'what I owe', 'debts', 'credit used', 'a year of interest', 'where it went', 'spending by category'],
    questions: ['How much am I worth?', 'How much do I owe?', 'Where did my money go this month?', 'What does a debt cost me a year?', 'What counts in my net worth?'],
    where: { route: '/home', label: 'Home, Your Affairs, The Money Line' },
    available: `Once you’ve read “${chapter('ui.money')}” in the guide. The button to your bank opens once you’ve read “${chapter('ui.bank')}”.`,
    short: 'The Money line in Your Affairs on Home sums up your money: your primary account and its balance, what you’re worth, and how much of that you owe. Press Your Affairs for the detail behind it.',
    steps: [
      'On Home, find Money in Your Affairs. It names your primary account and its balance, then Worth, and how much of it you owe. While the primary account is below zero, “Your account is overdrawn.” shows under it.',
      'Press the Your Affairs heading to open Net Worth. It shows In The Bank (In The Bank And In Hand while you carry cash), Owed and Net, and Where It Went: what you spent over the last 30 days, by kind.',
      'In Net Worth, press an account to see its Balance (or what’s Owed on it), Left To Spend on a card, its Rate, and the last four digits it Ends In.',
      'Press Owed, shown while you owe anything, to see each debt with its rate, A Year Of Interest, and Credit Used across your cards. A card in its introductory months shows the day that rate ends and the rate after it.',
      'Press the button named for your bank, at the end of the Money line, to open Money.',
    ],
    needs: [
      'There’s nothing to set up: every life opens a checking account at a bank where it begins, and savings if it begins with some, so the line is there from the first day.',
      'Owed opens only while you owe something: a card, a loan, an unpaid bill, a medical bill or a debt in collections.',
    ],
    costs: [
      { label: 'Time', value: 'None. Reading the line and opening its figures doesn’t move the clock' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'In The Bank', value: 'Every account of yours that isn’t a debt: checking, savings, term deposits and cash in hand. While you carry cash it reads In The Bank And In Hand, and the sentence says “in the bank or in hand”' },
      { label: 'Held', value: 'Money on its way between two of your banks, and SNAP waiting on an EBT card. The sentence names each part: “on its way between your banks” and “in SNAP on your EBT card”' },
      { label: 'A Pension', value: 'Counted separately and locked until you retire, where a save has a pension account from before. You can’t open one in play now' },
      { label: 'Owed', value: 'What you owe on each card, loan, unpaid bill, medical bill and debt in collections' },
      { label: 'Rates', value: 'A card’s rate as its terms charge it today, including an introductory or penalty rate, and during an introduction the day it ends and the rate after it; an overdrawn checking account’s overdraft rate; a loan’s own rate' },
      { label: 'Credit Used', value: 'What all your cards owe against all their limits. Past 30%, each month’s credit report takes 2 points off your score for each tenth over it', estimate: true },
    ],
    now: ['Looking changes nothing. Each balance is added up from every payment into and out of the account, and your net worth is added up again each time you look.'],
    later: [
      'The line moves as your money does: wages paid in, each morning’s groceries, and fees and interest at the month’s end.',
      'Each day something here worries you (the primary account overdrawn, a bill unpaid, a card nine-tenths used or behind, a medical bill, a debt in collections, tax owed or a return late), it adds 4 stress and takes 2 morale, more or less depending on your personality.',
    ],
    interpret: [
      'Worth is what you have minus what you owe. Below zero, you owe more than you have.',
      'A Year Of Interest is what your debts would cost over a year at today’s rates if you paid none of them off. A card you pay in full each month is charged none of it.',
      'Owed calls the debt with the highest rate above 0% “the expensive one”. A card at 0% during its introduction is never the expensive one. “They’re charged no interest today.” means none of it is charged interest now, though a card can still charge fees; the line after it says when an introductory rate ends.',
      'Credit Used turns into a warning past 30%. It counts every open card’s limit, including a card with nothing on it.',
      'The balance on the line is your primary account’s alone. Your other accounts are in Net Worth.',
    ],
    unavailable: [
      `The Money line shows Locked until you’ve read “${chapter('ui.money')}” in the guide, and the bank’s button until you’ve read “${chapter('ui.bank')}”.`,
      'Owed isn’t shown while you owe nothing: “You don’t owe anyone anything, so there’s nothing to show here.”',
      'A closed account no longer opens: “That account is closed. What was in it went elsewhere when it closed.”',
    ],
    mistakes: [
      'Counting a term deposit as money to spend. It’s part of your worth, but locked until its term ends.',
      'Thinking money on its way between your banks is lost. It’s counted as held until the day it arrives, then it’s in the bank again. Where the banks pay instantly, it arrives as soon as it’s sent.',
      'Letting a card go past nine-tenths of its limit. It worries you every day, and each month’s credit report takes points for each tenth past 30%.',
    ],
    next: [
      'Press the button for your bank to see each account, its fees and how this month stands.',
      'If Credit Used is past 30%, pay the card down on Money, under Cards.',
      'If you owe on more than one thing, pay the expensive one off first.',
    ],
    related: ['bank.accounts', 'bank.card', 'bank.borrowing', 'bank.transfer'],
    connections: [
      { to: 'bank.accounts', kind: 'optional', why: 'The button at the end of the Money line opens Money, where you manage each account.' },
      { to: 'bank.card', kind: 'evaluation', why: 'Each card’s monthly credit report scores your record on Credit Used, counted across every card’s limit.' },
      { to: 'body.how', kind: 'scheduled', why: 'Each day something here worries you, it adds stress and takes morale.' },
      { to: 'taxes.pay', kind: 'optional', why: 'Tax owed worries you each day like a debt, though it’s on Papers and Owed leaves it out.' },
    ],
    example: {
      setup: `A life begun in New Haven with Modest means, at Chase: ${usd(MODEST.checking)} in ${CHECKING.name}, ${usd(MODEST.savings)} in ${SAVINGS.name}, and ${usd(OWED)} owed on the ${CHASE_CARD.name} against a ${usd(MODEST.cardLimit)} limit.`,
      steps: ['Read the Money line on Home.', 'Press Your Affairs, then Owed.'],
      result: `The line reads “${CHECKING.name}: ${formatMoney(MODEST.checking, 'USD')}. Worth ${formatMoney(WORTH, 'USD', { cents: false })}, after ${formatMoney(OWED, 'USD', { cents: false })} owed.” The card is still in its introductory months, so Owed says it’s charged no interest today, and that the card is at ${pct(CHASE_CARD.introApr ?? 0)} until the day they end, then ${pct(CHASE_RATE)}: about ${usd(Math.round((OWED * CHASE_RATE) / 100) * 100)} a year from then if none of it were paid. Credit Used is ${Math.round((OWED / MODEST.cardLimit) * 100)}%, under the 30% where your score starts to suffer.`,
    },
  },
  {
    id: 'bank.accounts',
    title: 'Your Accounts',
    goal: 'money',
    covers: ['ui.bank', 'look.bank', 'look.transaction', 'bank.open_savings', 'bank.close_savings', 'bank.set_primary'],
    synonyms: ['bank screen', 'current account', 'checking account', 'savings account', 'open savings', 'close savings', 'monthly fee', 'fee waiver', 'primary account', 'statements', 'interest rate'],
    questions: ['Where is my bank?', 'How do I open a savings account?', 'Why was I charged a monthly fee?', 'How do I avoid the monthly fee?', 'What does my savings pay?', 'Which account does the day come out of?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, The Accounts Tab' },
    available: `Once you’ve read “${chapter('ui.bank')}” in the guide.`,
    short: 'Money is your bank. The Accounts tab shows each of your checking and savings accounts: its number, its balance, what it pays, what it costs and whether this month’s fee is waived so far. Open or close savings here, and choose which checking account is your primary account.',
    steps: [
      'Open Money: press Money on the menu, or the button named for your bank at the end of Home’s Money line. Its tabs are Accounts, Cards, Payments And Cash, Borrowing and Statements.',
      'On Accounts, each account’s panel shows its Balance, what it pays a year with its APY, and its monthly fee with how this month stands so far.',
      `To open savings, press Open A and the bank’s name for it (Open A ${SAVINGS.name} at Chase). It’s shown at each bank where you have a checking account and no easy-access savings.`,
      'To close savings, press Close It on its panel. The line beside the button says where its money will go.',
      'With checking accounts at two banks, press Make Primary, under Your Banks, on the one your day-to-day spending should come from.',
      'Press the bank’s name at the top for everything you hold there and the latest money through it. On Statements, choose an Account and a Period, and press any line to see which accounts it moved between and the day it went through.',
    ],
    needs: [
      'Savings opens beside a checking account of yours at the same bank: one savings account at each bank.',
      'Closing savings needs a checking account to take what it holds.',
      'Make Primary needs a second open checking account, at another bank.',
    ],
    costs: [
      { label: 'Time', value: 'None. Each happens at once' },
      { label: 'Opening Savings', value: 'Free' },
      { label: CHECKING.name, value: `${usd(CHECKING.monthlyFee ?? 0)} a month, waived in any month you have ${usd(CHECKING.waiver?.depositsAtLeast ?? 0)} of electronic deposits paid in, or keep ${usd(CHECKING.waiver?.balanceAtLeast ?? 0)} in it all month, or keep an average of ${usd(CHECKING.waiver?.linkedAverageAtLeast ?? 0)} across your accounts at Chase` },
      { label: SAVINGS.name, value: `${usd(SAVINGS.monthlyFee ?? 0)} a month, waived in any month you keep ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)} in it all month. It pays ${pct(SAVINGS.rate ?? 0)} a year` },
    ],
    reads: [
      { label: 'Interest', value: 'Earned each day on the day’s closing balance (above any floor, up to any cap, at the rate for the tier the balance reaches) and paid on the month’s last day, or on the bank’s own schedule. Where the country has the bank take tax first, it’s taken off before it’s paid' },
      // The month an account opens, from 2026-10-16 (Deutsche Bank's price list, `Product.waiver.openingMonth`); and each
      // German bank's own day for it later that day (`feesPostAt`): until then every German bank's went to the quarter's closing.
      { label: 'The Monthly Fee', value: 'Charged at 11 PM on the month’s last day unless the month met one of the account’s waivers: deposits paid in, the month’s lowest balance, its average balance, an average across your accounts at the bank, your age, card purchases, the first months after opening, or at Deutsche Bank the month the account opens. If no waiver is met, a bank that sets a lower fee for a condition charges that instead when the month met it. Deutsche Bank, Postbank and Berliner Sparkasse charge it at the quarter’s close, and ING on the 1st of the next month' },
      { label: 'The Primary Account', value: `Unless you choose otherwise, money comes from it for ${spokenList(PRIMARY_DOES)}.` },
      { label: 'A Statement', value: 'Every payment into and out of each account you’ve held, month by month (by the quarter in Germany), with the balance after each' },
    ],
    now: [
      'Opening savings: a new account with nothing in it and its own number, beside your checking account at that bank.',
      'Close It: this month’s interest so far is paid, minus any tax (a German account’s fees so far are taken with it), and what it holds moves to your checking account at the same bank at once. With no checking account there, it goes to your primary account, in the bank’s usual days. Standing orders into it, and payments set for a date to or from it, are canceled.',
      'Make Primary: from now on, your debit card purchases, cash from a machine, bills you pay by hand and anything new you set up use it, and Money is headed by its bank. Wages, standing orders, card autopay and loan payments stay where they were set up.',
    ],
    later: [
      // Until 2026-10-16 this said Germany's banks settled the fee too at each quarter's end; Commerzbank's and ING's
      // don't since (`feesPostAt`).
      'At 11 PM on the month’s last day, interest is paid, the fee is charged or waived, and the checking account’s statement is written. Germany’s banks pay interest at each quarter’s close, and Deutsche Bank, Postbank and Berliner Sparkasse charge the fee then too. ING charges the month’s fee on the 1st of the next month.',
      // “… Closed” named the primary account wherever the money went until 2026-10-15 (`systems/banking.ts`).
      `In Germany, closing a savings account that holds more than the ${GERMAN_MONTH} you can take out each month takes three months’ notice. It closes when the notice ends, and its money goes to the checking account at its bank, or to your primary account if there’s none there. The notice that it closed names the account the money went to and, if it had to be sent, the day it arrives.`,
    ],
    interpret: [
      '“It’s waived this month so far” means a waiver is met up to today. One met by keeping a balance can still be lost if the balance falls before the month ends.',
      'A rate the bank doesn’t publish is estimated, and Sources And Estimates says so. “No published rate was found for it, so it earns no interest in the game.” means exactly that.',
      'On a statement, Available Now already takes pending card payments off. Posted Balance counts only what has gone through. A line marked Pending posts on the date beside it.',
      'The Year adds up Interest Earned before tax, Tax Taken Off It, Bank Fees, Card Fees and Card Interest Paid, and lists each fee by kind.',
    ],
    unavailable: [
      '“You can only open savings at a bank where you have a checking account.”',
      '“You already have a savings account at” that bank. Open A … shows at each bank where you have a checking account and no easy-access savings yet. A term deposit there doesn’t count as savings.',
      '“You don’t have a checking account to move the money into.”',
      '“You’ve already given notice: … closes on ….” A German savings account under notice closes on that date.',
      '“… is already your primary account.” and “… is closing, so it can’t be your primary account.”',
      `Money shows Locked until you’ve read “${chapter('ui.bank')}” in the guide.`,
    ],
    mistakes: [
      `Opening a savings account with a fee and leaving it short. ${SAVINGS.name} with nothing in it is charged ${usd(SAVINGS.monthlyFee ?? 0)} at the month’s end. Move money in the day you open it, and keep ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)} in it all month.`,
      'Expecting Make Primary to move your wages. It doesn’t move them or anything else already set up. Have Wages Paid Here moves your wages, and Pay From This Account moves each standing order and autopay.',
      'Closing a savings account that a standing order pays into. The order is canceled with it, so set it up again into the savings you keep.',
    ],
    next: [
      'Move money into new savings the same day, on Accounts under Move Money, so its fee is waived.',
      'Set up a standing order into savings on Payments And Cash.',
      'Check each account’s fee line before the month’s end, and move money if a waiver isn’t met yet.',
    ],
    related: ['money.affairs', 'bank.transfer', 'bank.payments', 'bank.other-banks', 'bank.term', 'bank.upkeep'],
    connections: [
      { to: 'money.affairs', kind: 'immediate', why: 'Every balance here counts in your net worth, and your primary account’s balance is the first figure on Home’s Money line.' },
      { to: 'bank.payments', kind: 'prerequisite', why: 'A standing order needs a savings account to pay into, and Savings Covers The Checking Account uses easy-access savings at the same bank as the checking account a payment comes from.' },
      { to: 'bank.transfer', kind: 'optional', why: 'Move Money appears on this tab once you have two accounts.' },
      { to: 'bank.borrowing', kind: 'immediate', why: 'Your primary account’s bank runs the overdraft your day-to-day spending can run into.' },
      { to: 'bank.cash', kind: 'immediate', why: 'Cash comes out of your primary account, at its bank’s machines and fees.' },
      { to: 'bank.upkeep', kind: 'scheduled', why: 'An account you don’t use becomes inactive, then dormant, and after the country’s number of years its money goes to the state.' },
    ],
    example: {
      setup: `A student at Chase with ${usd(900_00)} in ${CHECKING.name}, no savings, and no wages paid in this month.`,
      steps: [`Press Open A ${SAVINGS.name}.`, `In Move Money, move ${usd(350_00)} from ${CHECKING.name} into it the same day.`, 'Leave both alone until the month’s end.'],
      result: `${SAVINGS.name} never ends a day under ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)}, so its ${usd(SAVINGS.monthlyFee ?? 0)} fee is waived, and at ${pct(SAVINGS.rate ?? 0)} its ${usd(350_00)} earns ${SAVINGS_MONTH > 0 ? usd(SAVINGS_MONTH) : 'less than a cent'} a month. ${CHECKING.name}, with about ${usd(550_00)} and nothing paid in, meets none of its waivers, so its ${usd(CHECKING.monthlyFee ?? 0)} fee is charged at 11 PM on the month’s last day.`,
    },
  },
  {
    id: 'bank.transfer',
    title: 'Moving Money',
    goal: 'money',
    covers: ['bank.transfer'],
    synonyms: ['move money', 'transfer between accounts', 'move to savings', 'money in transit', 'on its way', 'send to another bank'],
    questions: ['How do I move money into savings?', 'How long does a transfer to another bank take?', 'Why was my transfer refused?', 'Does moving money cost anything?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, The Accounts Tab, Move Money' },
    available: `Once you’ve read “${chapter('bank.transfer')}” in the guide and have two accounts.`,
    short: `Move Money, on the Accounts tab, moves money between your own checking and savings accounts: choose From and To, type the amount and press Move It. Within one bank it arrives at once. To another bank it takes as long as the sending bank takes (${CHASE_OPEN.sendDays} business days from Chase), and it’s in neither account until it arrives. Taking money out of savings can cost a fee once the month’s free withdrawals are used, and a German savings account lets only ${GERMAN_MONTH} a month out without notice.`,
    steps: [
      'On the Accounts tab, find Move Money. It shows once you have two checking or savings accounts.',
      'Choose the account in From (each is listed with its balance) and the account in To.',
      'Type the Amount as you’d write it, not in cents (250 at a US bank is $250, and 12.50 is $12.50), and press Move It.',
      'Under the fields, a note says whether this withdrawal from savings is free, and how much more you can take out this month where the bank sets a limit.',
    ],
    needs: [
      'Two open accounts of yours, checking or savings. A term deposit can’t be one of them: it’s locked until its term ends.',
      'Enough in the From account for the amount, plus any withdrawal fee.',
    ],
    costs: [
      { label: 'Time', value: 'None to send it. Between banks, it arrives in the sending bank’s own days or by its cut-off time, or where the bank sets none, the country’s' },
      { label: 'At One Bank', value: 'Free, and at once' },
      { label: 'Between US Banks', value: `Chase ${CHASE_OPEN.sendDays} business days, Wells Fargo ${WF_OPEN.sendDays}; Citi the same business day if sent before ${hour(CITI_OPEN.sameDayBefore ?? 12)}, or the next business day if later` },
      { label: 'Where Neither The Bank Nor The Country Says', value: `${businessDays(ESTIMATE_SEND_DAYS)}, as from Bank of America`, estimate: true },
      { label: 'Where Banks Pay At Once', value: 'Britain, Ireland, France, Germany, Spain, Iceland, Korea, Mexico, Australia and New Zealand: it arrives as soon as it’s sent' },
      { label: 'Japan', value: `By ${JAPAN.scheme}: the same business day if sent before ${hour(JAPAN.sameDayBefore ?? 0)}, or the next business day if later` },
      { label: 'Canada', value: `By ${CANADA.scheme}: ${businessDays(CANADA.days ?? 0)}` },
      { label: 'Savings Withdrawals', value: 'Free, or, once the bank’s free number for the month is used, its fee for each one, as Canada’s and New Zealand’s banks charge' },
    ],
    reads: [
      { label: 'The Two Accounts', value: 'The From account’s balance, whether either account is dormant or closing, and whether the From account is blocked after a switch because it owes money' },
      { label: 'Free Withdrawals', value: 'Every payment out of savings this month counts, including one your savings makes automatically. Interest and fees don’t' },
      { label: 'Germany’s Allowance', value: `${GERMAN_MONTH} a calendar month out of savings without notice, where the bank sets it` },
      { label: 'Citi’s Limits', value: `${usd(CITI_OPEN.limits?.outDay ?? 0)} a day and ${usd(CITI_OPEN.limits?.outMonth ?? 0)} a month sent to other banks` },
    ],
    now: [
      'Within one bank: the money leaves one account and arrives in the other at once, with a line on each statement.',
      'To another bank, where banks don’t pay at once: it leaves now and shows under On Its Way, on the Accounts tab, with the day it arrives. The message says when.',
      'A withdrawal fee, where one is due, comes out of the savings as a separate line.',
    ],
    later: [
      'On the day, it arrives in the account it was sent to. If that account has closed, it comes back to the account it left, and What Needs You, on Home, tells you.',
      'A move counts as using both accounts, which keeps them from becoming inactive.',
    ],
    interpret: [
      'A message beginning “Moved” means the money is there now. One beginning “Sent” gives the day it arrives.',
      'Money on its way counts in your worth, but in neither account.',
      '“You’ve used this month’s free withdrawals, so this one costs …” is the fee your next move out of savings will cost.',
    ],
    unavailable: [
      '“Move Money only moves money between your own checking and savings accounts.”',
      '“From and To are the same account.” and “Enter how much to move.”',
      '“… has only … available, so nothing was moved.”: the From account has less available than the amount.',
      '“… is dormant, so nothing was moved. Reactivate it under Your Accounts Over Time, then try again.”',
      '“With the … withdrawal fee, you can move at most … out of …, so nothing was moved.”',
      '“You can take only … more out of … this month without notice, so nothing was moved.” (a German savings account)',
      '“… is closing, so money can’t move into or out of it.” and “… is blocked, so nothing was moved. It was overdrawn when you switched banks, and it stays blocked until the overdraft is paid off.”',
      `At Citi: “… lets you send ${usd(CITI_OPEN.limits?.outDay ?? 0)} a day to other banks, and you’ve sent … today.” or “… lets you send ${usd(CITI_OPEN.limits?.outMonth ?? 0)} a month to other banks, and you’ve sent … this month.”, naming Citi.`,
    ],
    mistakes: [
      `Emptying an account just before a standing order or a card’s autopay is due from it. The order doesn’t go, and the autopay fails unless linked savings at that bank covers it. Short For A Payment warns you ${LOOKAHEAD_DAYS} days ahead.`,
      'Sending money between banks late in the week. Business days skip weekends and the country’s bank holidays.',
      `Topping up savings mid-month to meet a balance waiver. Chase looks at the month’s lowest balance, so a month that dipped under ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)} is charged the fee anyway, and the fee itself can take it under again.`,
    ],
    next: [
      'To move money into savings every month without thinking about it, set up a standing order on Payments And Cash.',
      'Watch On Its Way for the day money between banks arrives.',
    ],
    related: ['bank.accounts', 'bank.payments', 'bank.other-banks', 'bank.upkeep'],
    connections: [
      { to: 'bank.accounts', kind: 'prerequisite', why: 'Move Money appears only once you have two accounts.' },
      { to: 'bank.other-banks', kind: 'scheduled', why: `Money sent to your account at another bank arrives on the day the sending bank’s own rule sets, or where it sets none, its country’s. Where neither says, the game estimates ${businessDays(ESTIMATE_SEND_DAYS)}.` },
      { to: 'bank.upkeep', kind: 'immediate', why: 'A move counts as using both accounts, which keeps them from becoming inactive. A dormant account refuses it until you reactivate it.' },
      { to: 'bank.payments', kind: 'optional', why: 'A standing order or a payment set for a date makes the same move on a day you choose.' },
    ],
    example: {
      setup: `${CHECKING.name} holds ${usd(800_00)}, and ${SAVINGS.name} has held ${usd(100_00)} all month.`,
      steps: [`In Move Money, choose ${CHECKING.name} in From and ${SAVINGS.name} in To.`, 'Type 250 and press Move It.'],
      result: `“Moved ${usd(250_00)} to ${SAVINGS.name}.” Checking holds ${usd(550_00)} and savings ${usd(350_00)} at once. Savings was at ${usd(100_00)} earlier this month, so this month’s ${usd(SAVINGS.monthlyFee ?? 0)} fee is still charged at the month’s end, leaving ${usd(350_00 - (SAVINGS.monthlyFee ?? 0))}. That’s over ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)}, so next month’s fee is waived if you leave it there.`,
    },
  },
  {
    id: 'bank.term',
    title: 'Term Deposits',
    goal: 'money',
    covers: ['bank.open_term', 'bank.set_term_end', 'bank.break_term', 'bank.take_term_interest'],
    synonyms: ['cd', 'certificate of deposit', 'fixed deposit', 'gic', 'break early', 'early withdrawal penalty', 'maturity', 'renew a deposit', 'lock money away'],
    questions: ['How do I put money away at a fixed rate?', 'What does breaking a CD early cost?', 'What happens when a term deposit ends?', 'Can I take the interest before the end?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, The Accounts Tab, The Term Deposit Panel' },
    available: `Once you’ve read “${chapter('bank.open_term')}” in the guide.`,
    short: `A term deposit locks money away at a fixed rate for the bank’s term: Chase’s ${CHASE_TERM.called} is ${CD_MONTHS} months at ${pct(CHASE_TERM.rate)}. To open one, type the amount on its panel, on the Accounts tab, and press Put It Away. At the end it renews, moves into savings or is paid into your checking account, as you choose where the bank lets you. Breaking one early, where the bank allows it, costs a penalty that’s shown before you press.`,
    // Until 2026-10-13 the first step named “your bank’s” one panel, and the needs said the panel told you when a bank had
    // no rate. From that day `TermDeposits` (`ui/bank/BankLending.tsx`) draws one for each other bank kept with a current
    // account that has a rate, and none for one without; found by the guide’s audit of that day.
    steps: [
      `On Accounts, find the term deposit panel for the bank you want (${CHASE_TERM.called} at Chase). There’s one for your primary account’s bank, and one for each other bank where you have a checking account and a rate was found, with the bank’s name beside the term.`,
      'Type the Term Deposit Amount and press Put It Away. The money comes from your checking account at that bank.',
      'Under Your Accounts Over Time, read what it does on its end date and what breaking it now would cost.',
      'To change what happens at the end, press Renew It At The End, Move It To Savings At The End or Pay It Out At The End, as your bank allows.',
      `To end it now, press Break It Early (at NatWest, Give ${BREAK_NOTICE['gb-natwest']} Days’ Notice). Where the bank pays interest during the term, Take The Interest So Far moves what it has earned to your checking account.`,
    ],
    needs: [
      'A checking account at that bank with the amount in it, and any minimum the bank sets.',
      'A bank with a term deposit rate the game has found. Your primary account’s bank’s panel says when there’s none, and another bank without one shows no panel.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'The amount, locked away until its end' },
      { label: 'Breaking A Chase CD Early', value: `${CHASE_BANDS}, never more than the interest earned, and at least ${CHASE_LIFE.penaltyFirstWeekDays} days’ interest in its first week` },
      { label: 'Where A Bank Words It Differently', value: 'The interest earned so far', estimate: true },
    ],
    reads: [
      { label: 'The Rate', value: 'Fixed on the day it opens. A renewal gets the bank’s rate on the day it renews' },
      { label: 'The End', value: 'Your choice, where the bank gives one; otherwise the bank’s own way' },
      { label: 'Notice', value: 'Some banks need some days’ notice to change the end, or to close one early' },
      { label: 'Interest So Far', value: 'Earned each day on the deposit at its fixed rate, without compounding' },
    ],
    now: [
      'Put It Away: a new account with the bank’s name for the product and its own number, holding the amount from your checking account there. Move Money, cash and payments can’t reach it.',
      'An end you choose is kept, and the panel says what it will do.',
      // Until 2026-10-13 this said a deposit broken early went into your primary current account. `breakTerm`
      // (`systems/accountlife.ts`) pays it into the current account at the deposit’s own bank from that day, and sends it
      // to the primary one in the bank’s days only where there’s none; found by the guide’s audit of that day.
      'Break It Early: it closes now, and the deposit with its interest, minus the penalty and any tax, goes into your checking account at the same bank. With no checking account there, it goes to your primary account, in the bank’s usual days. A penalty larger than the interest comes out of the deposit itself.',
      'Take The Interest So Far: what it has earned, minus any tax, goes into your primary account, and the deposit keeps earning until its end.',
    ],
    later: [
      'The bank sends a notice to What Needs You a month before the end, or two weeks before the last day to change the end, if that’s earlier.',
      `On the end date it renews, with its interest added, for the same term at the bank’s rate that day, with any grace days to take it out whole (Chase gives ${CHASE_LIFE.graceDays}). Or it moves into savings at the bank (opened for it if you have none there), or it’s paid into your checking account at that bank.`,
      'If you gave notice to close it early, it closes when the notice ends, with the penalty as it stands then.',
    ],
    interpret: [
      '“Breaking it now costs …” is today’s penalty. “Breaking it now costs nothing.” means a grace period after renewal or a cooling-off period is running, or the bank limits its penalty to the interest earned and there’s none yet.',
      '“It’s too near its end to change: the bank needs … days’ notice.” means the end stays as shown.',
      '“It renewed, and until … you can take it out whole, with no penalty.” is the grace period after a renewal.',
      '“The penalty is estimated as the interest so far” appears where the bank words its penalty in a way the game can’t work out exactly.',
    ],
    unavailable: [
      '“No term deposit rate was found for ….” A bank without a rate can’t take a term deposit in the game.',
      '“A term deposit at … is paid for from your checking account there. Open a checking account at … first.”',
      '“A term deposit there needs at least ….” and “… has only …, so no term deposit was opened.”',
      '“… doesn’t let a term deposit end that way.” and “… needs … days’ notice before the end to change it.”',
      '“… doesn’t let a term deposit be broken before its end.” and “It already closes on …, on the notice you gave.”',
      '“… pays a term deposit’s interest at its end.” and “It hasn’t earned anything to take yet.”',
      // Until 2026-10-13 this list ended with “You need a current account for the money.”, Break It Early’s refusal for a
      // life without one. Every life holds a primary account it can’t close, so nothing reached it, and it went from
      // `bank.break_term` (`systems/accountlife.ts`) that day.
    ],
    mistakes: [
      'Putting away money you’ll need before the end. Read the quote under Your Accounts Over Time first, and leave enough in the checking account to get through the term.',
      `Letting it renew when you wanted the money back. Choose Pay It Out At The End before the bank’s notice period starts. If it renews anyway, you can still take it out whole during the grace days (Chase gives ${CHASE_LIFE.graceDays}).`,
      `Breaking it in its first week. Chase charges at least ${CHASE_LIFE.penaltyFirstWeekDays} days’ interest then, even past its usual limit.`,
    ],
    next: [
      'Choose what happens at the end now, under Your Accounts Over Time, so it doesn’t renew by default.',
      'Keep enough in your checking account for the term, so you don’t have to break the deposit early.',
    ],
    related: ['bank.accounts', 'bank.upkeep', 'money.affairs'],
    connections: [
      { to: 'bank.accounts', kind: 'prerequisite', why: 'A term deposit is paid for from your checking account at the same bank.' },
      { to: 'money.affairs', kind: 'immediate', why: 'What it holds counts in your worth from the day it opens, though you can’t spend it.' },
      { to: 'day.needs', kind: 'scheduled', why: 'The bank’s notice before the end, and the renewal or payout on the day, come to What Needs You.' },
      { to: 'bank.upkeep', kind: 'optional', why: 'Where the country gives a cooling-off period, you can cancel a new term deposit during it without a penalty.' },
    ],
    example: {
      setup: `A student at Chase puts ${usd(CD)} into the ${CHASE_TERM.called}, ${CD_MONTHS} months at ${pct(CHASE_TERM.rate)}.`,
      steps: ['Type 1000 and press Put It Away.', 'Sixty days later, read the quote under Your Accounts Over Time.', 'Press Break It Early.'],
      result: `After 60 days it has earned ${usd(CD_EARNED_60)}. A ${CD_MONTHS}-month term’s penalty is ${CD_PENALTY_DAYS} days’ interest, ${usd(CD_PENALTY)}, but never more than what it has earned, so the penalty is the ${usd(CD_EARNED_60)} and ${usd(CD)} goes back to the checking account. Left to its end it would have earned about ${usd(CD_FULL)}, and then it ${END_WORDS[CHASE_LIFE.atEnd ?? 'paid_out']}.`,
    },
  },
  {
    id: 'bank.upkeep',
    title: 'Keeping An Account',
    goal: 'money',
    covers: ['bank.reactivate', 'bank.cancel_new', 'bank.claim_unclaimed', 'bank.set_alerts'],
    synonyms: ['dormant account', 'inactive account', 'unclaimed money', 'escheat', 'cooling-off', 'low balance alert', 'large payment alert', 'statement ready', 'short for a payment'],
    questions: ['Why is my account blocked?', 'Where did my untouched savings go?', 'Can I cancel an account I just opened?', 'How do I get told when my balance is low?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, Accounts, Your Accounts Over Time; Statements, Alerts' },
    available: `Once you’ve read “${chapter('bank.set_alerts')}” in the guide.`,
    short: 'Two panels look after your accounts between payments: Your Accounts Over Time, on Accounts, and Alerts, on Statements. An account you don’t use becomes inactive, then dormant and blocked, and after the country’s number of years its money goes to the state, where you can claim it back. In some countries you can cancel a new account or card during a cooling-off period. Alerts tell you when an account runs low, a large payment goes out, a statement is ready, or an account is short for a payment that’s due.',
    steps: [
      'On Accounts, find Your Accounts Over Time. It only shows when it has something to show: a term deposit, round-ups your bank offers, an unused account, something new enough to cancel, money to claim back, or savings withdrawal fees.',
      'A dormant account shows Reactivate, something new enough to cancel shows Cancel It, and money handed to the state shows Claim It Back.',
      'When the bank writes that it’s about to hand an account to the state, What Needs You offers Keep The Account.',
      'On Statements, under Alerts, type amounts in Any Checking Account Under and A Payment Over (leave one blank to turn it off) and press Save Alerts. Press Statement Ready or Short For A Payment to turn it On or Off.',
    ],
    needs: [
      // Until 2026-10-15 this named Korea among the fourteen days for every account. Korea's rule (청약철회) gives none for a
      // deposit (`inCoolingOff`), so it's named for cards alone. Until that day's recheck it counted Canada's and Mexico's
      // in calendar days and gave a Canadian card them (`coolingOffEnds`, `inCoolingOff`). Until that day's second
      // recheck the period ended at the hour the account opened on its last day; it runs to that day's end now.
      `Cancel It needs a country with a cooling-off period, which runs to the end of its last day: ${UNCLAIMED.GB?.coolingOffDays} days in Britain, Ireland, Iceland, France, Germany and Spain; ${UNCLAIMED.CA?.coolingOffDays} business days in Canada, for anything but a card; ${UNCLAIMED.MX?.coolingOffDays} days in Mexico, for an account or card not yet used (any payment out of it counts as use); and ${UNCLAIMED.KR?.coolingOffDays} days in Korea, for a card only. The US, Japan, Australia and New Zealand have none, and Britain’s doesn’t cover fixed-rate deposits. Your primary account can’t be canceled.`,
      'Claim It Back needs money of yours handed over as unclaimed, and a checking account to take it.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None' },
      { label: 'An Unused Account', value: 'Some banks charge a yearly fee for an account left unused. It’s listed under Other Charges' },
    ],
    reads: [
      { label: 'Unused', value: 'Months since you last moved money in or out yourself. Interest, the bank’s fees and a tax refund don’t count' },
      { label: 'Chase’s Months', value: `Inactive after ${CHASE_LIFE.inactiveMonths} months unused, dormant after ${CHASE_LIFE.dormantMonths}` },
      { label: 'Unclaimed', value: `In the US, after ${US_IDLE.years} years unused, it goes to the state’s unclaimed-property office` },
      { label: 'The Bank’s Letter', value: `On the 1st of a month within the ${ESCHEAT_NOTICE_DAYS} days before it hands the money over`, estimate: true },
      { label: 'Low Balance', value: 'Each checking account’s balance at the end of the day. You’re told once, until it’s back above the amount' },
      { label: 'Short For A Payment', value: `Each standing order, payment set for a date, card autopay and loan payment due in the next ${LOOKAHEAD_DAYS} days, against what its account has available`, estimate: true },
      { label: 'A Payment Over', value: 'Every payment out of a checking account, savings or a card at or over the amount, except moves between your own accounts' },
    ],
    now: [
      'Reactivate: the account is unblocked at once, and its unused months start again from today.',
      // Until 2026-10-15 this said a savings account's money went back into the primary account, which it hadn't since
      // 2026-10-13, and said nothing of a current account, which the panel didn't offer until then.
      // Until 2026-10-15 this said a current account closed the same way as savings, which it did only in where its money
      // went: it closed with no interest paid and no fees charged, where Close It settles both.
      // Until 2026-10-15 this said a savings account or term deposit came back whole, without interest, in every country,
      // and a current account was paid its interest in every country. Until that day's recheck Canada's refund took
      // overdraft interest with the charges, which its rule leaves out, and this said nothing of it. Until that day's
      // second recheck it left out the machine owner's fee, which isn't the bank's and isn't refunded (`chargesBackOf`).
      // From 2026-10-16: the overdraft interest built since the 1st charged (`settleOverdraftInterest`), and a term's interest
      // taken before 2026-10-15 found in an older save (`findTermInterest`); until then canceling dropped the one and missed
      // the other.
      'Cancel It on a savings account, term deposit or checking account: it closes without a penalty, and its money goes to the checking account at its bank, or to your primary account in the bank’s usual days if there’s none there.',
      'Interest when you cancel: in Britain and Canada you keep the interest it earned. In Europe and Mexico the interest goes back, including any already paid into it, because their rules return what each side received.',
      'Fees when you cancel: in Canada and Mexico, the bank’s fees charged while it was open are refunded, but not overdraft interest or a machine owner’s fee. Elsewhere a checking account is charged the fees it owes, as Close It would; in Germany, this month’s fee only up to the day, as the line under Cancel It says. Everywhere, a checking account is charged the overdraft interest built up since the 1st. It’s never refunded.',
      'In a save made before October 15, 2026, interest a term deposit paid out during its term is found once when the save opens and goes back the same way. Where the save’s records can’t say which deposit paid it, it stays paid.',
      'Cancel It on a card: nothing new can go on it, and what you spent on it is still yours to repay.',
      'Claim It Back: all of it comes back into your primary account.',
      'Save Alerts: the amounts are kept, and checked at the end of each day from then on.',
    ],
    later: [
      // Cash paid in is among what a dormant account refuses from 2026-10-13, when `cash.deposit` (`systems/cash.ts`)
      // began refusing it; until then cash went in and the account stayed dormant, and this line, rightly, left it out.
      'On the 1st of each month the bank checks again. Until it’s reactivated, a dormant account refuses Move Money into or out of it and cash paid into it, and a dormant primary account refuses cash taken out. At Bank of America and Capital One it also stops earning interest.',
      `On the 1st of a month within the ${ESCHEAT_NOTICE_DAYS} days before the country’s number of years runs out, the bank writes and What Needs You asks you. If you leave it, then on the 1st of the month after, the balance goes to the state and the account closes, and standing orders into it are canceled. Your primary account is never handed over.`,
      'Alerts arrive in What Needs You at the end of the day.',
    ],
    interpret: [
      '“… is inactive: it hasn’t been used for months” is a warning. Using it makes it active again.',
      '“… is dormant: the bank has blocked it until you reactivate it.” Press Reactivate to unblock it.',
      '“… left unused in … for … went to ….” says where the money is. Claim It Back brings it back.',
      'Under a German checking account, the line about canceling says what canceling would charge now, as Close It would.',
      'Short For A Payment names the payment, its amount, the account and its date, what the account has available, and what to do about it.',
    ],
    unavailable: [
      '“That account isn’t dormant.”',
      '“Its cooling-off period has passed, or there isn’t one here for it.”',
      '“You can’t cancel your primary account. Make another account primary first.”',
      'A checking account can be refused for the same reasons as Close It, shown under it with Cancel It grayed out: “It’s overdrawn by …, and the bank only closes it once that’s paid off. Move money into it first.”, “Money is on its way into or out of it. Wait until it arrives.”, a list of what still uses it, “… is still open at the same bank. Close that first.”, “Card payments are still pending on it. You can close it once they’ve posted.”, or, where its fees, with any overdraft interest, come to more than its balance, a sentence naming each that ends “… more than it holds. Move … into it first.”',
      'Any account whose interest goes back when it holds less: “The interest it was paid, …, goes back, …”, or with its fees, “Its fees, …, and the interest it was paid, …”, each ending “… more than it holds. Move … into it first.”',
      // From 2026-10-15's recheck: a term's interest taken during the term went back out of the primary account unasked.
      'A term deposit whose interest was paid into another account that now holds less: “Canceling takes back the … of interest it paid into …, which holds less than that. Move … into … first.”',
      '“No money of yours is held as unclaimed.”',
      '“Enter the … alert as an amount, or leave it blank to turn it off.”, naming the low balance or large payment alert.',
    ],
    mistakes: [
      'Leaving savings unused for years. Interest and fees don’t count as using it, but a small move in or out does.',
      'Turning Short For A Payment off. It’s the one alert that starts on, and the only warning before an autopay fails.',
      'Setting A Payment Over too high. A stranger’s charge under it only shows up on the statement.',
    ],
    next: [
      'Set A Payment Over low enough to catch a charge you didn’t make, and press Save Alerts.',
      'Move a little money in or out of any account you want to keep, at least once within the bank’s months.',
    ],
    related: ['bank.accounts', 'bank.term', 'bank.round-ups', 'bank.card-security', 'bank.payments'],
    connections: [
      { to: 'bank.card-security', kind: 'immediate', why: `A Payment Over set at or under a stranger’s charge tells you the day it happens, so you know of it from then: in the US, a debit card charge reported within ${clockOf(DEBIT_PROMPT, 'of')} costs you at most ${usd(DEBIT_PROMPT.max ?? 0)}.` },
      { to: 'bank.payments', kind: 'optional', why: `Short For A Payment watches each standing order and payment set for a date, ${LOOKAHEAD_DAYS} days ahead.` },
      { to: 'bank.card', kind: 'optional', why: 'Short For A Payment watches each card’s autopay against the account it pays from.' },
      { to: 'day.needs', kind: 'scheduled', why: 'Alerts, the dormancy notice and the bank’s letter before it hands money over come to What Needs You.' },
      { to: 'bank.term', kind: 'optional', why: 'A term deposit’s end and breaking it early are handled on the same panel.' },
      { to: 'bank.round-ups', kind: 'optional', why: 'Round-ups are set on the same panel, where your bank offers them.' },
    ],
    example: {
      setup: `A life with Modest means leaves ${usd(MODEST.savings)} in ${SAVINGS.name} and never uses it.`,
      steps: [
        `At ${CHASE_LIFE.inactiveMonths} months, Your Accounts Over Time says it’s inactive.`,
        `At ${CHASE_LIFE.dormantMonths}, Chase makes it dormant, with Reactivate beside it.`,
        `On the 1st of a month within ${ESCHEAT_NOTICE_DAYS} days of ${US_IDLE.years} years, What Needs You asks you, with Keep The Account.`,
      ],
      result: `Keep The Account or Reactivate counts as using it, and its months start again. If you ignore it, on the 1st of the month after ${US_IDLE.years} years its ${usd(MODEST.savings)} and the interest it earned go to the state’s unclaimed-property office and the account closes. Claim It Back puts it all into your primary account.`,
    },
  },
  {
    id: 'bank.round-ups',
    title: 'Round-Ups',
    goal: 'money',
    covers: ['bank.set_round_ups'],
    synonyms: ['round-ups', 'keep the change', 'save the change', 'spare change', 'save as you go', 'simply save', 'bank the rest', 'kleingeld', 'redondeo', 'coin box'],
    questions: ['What are round-ups?', 'Why aren’t my round-ups moving?', 'Why can’t I turn round-ups on?', 'Which banks round up?', 'Where did my round-ups go?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, Accounts, Your Accounts Over Time, Round-Ups' },
    available: `Once you’ve read “${chapter('bank.set_round_ups')}” in the guide, at a bank that offers them (${ROUND_ALL.length} of the game’s banks do).`,
    short: `Round-ups save as you spend: each debit card purchase moves a little from your checking account into savings at the same bank. Turn them on under Your Accounts Over Time, on the Accounts tab, where your bank offers them. Each bank does it its own way, such as the change up to the next unit you choose (times a multiplier at NatWest), or a set amount a purchase (Wells Fargo’s ${usd(WF_FLAT)}, TD’s from ${roundUpMoney('ca-td', TD_RANGE.min)} to ${roundUpMoney('ca-td', TD_RANGE.max)}). Any choice the bank leaves to you has to be made before they start: the game doesn’t pick one for you.`,
    steps: [
      'On Accounts, under Your Accounts Over Time, find Round-Ups. It says what your bank’s feature does, and shows its choices.',
      'Make the choices it asks for: How It Counts, Round Up To, Multiplier, Each Purchase, Amount, How Often or Minimum Balance, whichever your bank has.',
      'Press Round-Ups: Off to turn them on. If you change a choice while they’re on, press Save These Choices.',
      'Pay for the day by debit card (on Payments And Cash, under How You Pay). The panel shows what’s been counted but not moved yet, and what happened at the last transfer.',
    ],
    needs: [
      `A bank that offers them, at your primary account: ${andList(ROUND_ALL)}. Chase, Capital One and the others don’t.`,
      'Easy-access savings at the same bank, where the money goes.',
      'The choices your bank leaves to you. Where the bank states no default, the game doesn’t choose one for you.',
      'Purchases on the debit card: the day’s food is the only purchase in the game. Citi, BBVA México and Santander México count their own credit card’s purchases too.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None. They move your own money into your savings' },
    ],
    reads: [
      { label: 'A Purchase’s Round-Up', value: `The change up to the next multiple of the unit you chose. A purchase that’s already a multiple moves nothing, except at BBVA México, where it moves a whole unit. NatWest multiplies the change by the 1 to ${NATWEST_MOST} you pick. A set amount moves the same whatever the purchase. Bankinter moves the change to the next euro and the rest of the €1 or €2 you choose` },
      { label: 'When It Moves', value: `At the start of the day, for the day before: every day at most banks; at the end of a business day at ${andList(roundBanks((r) => r.when === 'business'))}; at the start of the next business day at ${andList(roundBanks((r) => r.when === 'next-business'))}; overnight into Saturday at ${andList(roundBanks((r) => r.when === 'friday-night'))}; on the 1st and the 16th at ${andList(roundBanks((r) => r.when === 'half-month'))}; Monday to Friday at ${andList(roundBanks((r) => r.when === 'weekdays'))}; and as often as you choose at ${andList(roundBanks((r) => Boolean(r.every)))}` },
      { label: 'The 1st And The 16th', value: 'LCL’s terms say twice a month without naming the days', estimate: true },
      { label: 'When The Account Is Short', value: `All or nothing, and never into an overdraft: if the account can’t cover it, what was counted isn’t moved, stays in your checking account, and isn’t counted again. At Citi a transfer waits two more days for your minimum balance (at least ${usd((CITI.minimumAtLeast ?? 0) * 100)}), and after three days below it Citi turns Spend & Save off. Citi moves at most ${usd((CITI.perTransfer ?? 0) * 100)} at a time and carries the rest. ING counts nothing while the account holds under ${formatMoney(ING_FLOOR * 100, 'EUR', { cents: false })}` },
      { label: 'Where A Bank Doesn’t Say', value: 'Each bank’s panel lists what its sources leave open and what the game does there, and what the bank does that the game doesn’t, with the source and the day it was checked', estimate: true },
    ],
    now: [
      'Round-Ups: On, with the choices made: each purchase from then on is counted toward savings, to move on the bank’s day.',
      'Off: nothing is counted, and anything counted but not yet moved is dropped. It was never taken from your checking account.',
    ],
    later: [
      'On the bank’s day, what was counted moves from your checking account to easy-access savings at the same bank, in one transfer, shown as Round-ups in your statements.',
      'On a day the account can’t cover it, nothing moves, and the panel says what didn’t move and why.',
      'Making an account at another bank your primary account, or closing the savings they go into, turns them off.',
    ],
    interpret: [
      '“Counted but not moved yet” is waiting for the bank’s day. At Wells Fargo and Lloyds, what “moves at the start of the next business day” has already been counted.',
      '“Last moved to savings: …” is the last transfer. “Not moved on …: …, because …” says why one didn’t happen.',
      // The panel’s count of whole purchases (`ui/bank/RoundUps.tsx`, `wholePurchase`), said here from 2026-10-13: until
      // then the panel showed it and this list didn’t say what it was.
      '“… purchases since the last transfer were already a multiple of …, so they added nothing.” counts the purchases that moved nothing because they were already whole. It starts again at each transfer that moves money, and when round-ups stop.',
      '“Round-ups aren’t counting right now.” under Round-Ups: On names a choice still to make, as a save from before October 13, 2026 can have.',
    ],
    unavailable: [
      '“… doesn’t round purchases up into savings.”',
      '“Round-ups go into savings at …. Open easy-access savings there first.”',
      '“Choose what to round up to: …” and the other choices, until they’re made.',
      '“Round-ups at … only work when a … checking account is your primary account.”',
    ],
    mistakes: [
      'Expecting a round-up on a whole purchase. Most banks move nothing on one.',
      'Keeping the checking account near zero. On a day it can’t cover the round-ups, they don’t move, and they aren’t made up later.',
      'Making an account at another bank your primary account and expecting round-ups to follow. They’re set up at one bank and stop there.',
    ],
    next: [
      'Check How You Pay puts the day on the debit card, since only debit card purchases round up.',
      'Keep enough in your checking account for each day’s round-ups to move.',
    ],
    related: ['bank.upkeep', 'bank.accounts', 'bank.payments'],
    connections: [
      { to: 'bank.payments', kind: 'immediate', why: 'Only what the debit card pays rounds up: How You Pay sets whether the day goes on the debit card, the credit card or in cash.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Each transfer is a move from your checking account into savings at the same bank, on the bank’s day.' },
      { to: 'bank.upkeep', kind: 'optional', why: 'Round-ups are set under Your Accounts Over Time, with term deposits and unused accounts.' },
    ],
    example: {
      setup: `A life in London at NatWest, with savings there and money in the checking account.`,
      steps: [
        'On Round-Ups, choose a Multiplier of ×3 and press Round-Ups: Off to turn them on.',
        `A purchase of ${gbp(230)} is paid by debit card.`,
        'The day ends.',
      ],
      result: `The purchase counts ${gbp(210)}: its change of ${gbp(70)}, three times, as in NatWest’s own example. At the start of the next day ${gbp(210)} moves from the checking account to savings in one transfer, and the panel says “Last moved to savings: ${gbp(210)}”.`,
    },
  },
  {
    id: 'bank.payments',
    title: 'How You Pay',
    goal: 'money',
    covers: ['bank.set_payments', 'bank.add_standing_order', 'bank.cancel_standing_order', 'bank.schedule_payment', 'bank.cancel_scheduled', 'bank.set_order_source', 'bank.redirect_deposits'],
    synonyms: ['debit or credit', 'pay in cash', 'standing order', 'scheduled payment', 'overdraft protection', 'link savings', 'direct deposit', 'where wages are paid', 'pay from there'],
    questions: ['How do I pay for groceries by card?', 'How do I save a set amount each month?', 'How do I have my wages paid into another account?', 'Why didn’t my standing order go?', 'Can savings cover my checking account?'],
    where: { route: BANK, tab: PAYMENTS, label: 'Your Bank, Payments And Cash, How You Pay' },
    available: `Once you’ve read “${chapter('bank.set_payments')}” in the guide.`,
    short: 'How You Pay sets how your daily groceries and meals are paid: by debit card, by credit card, or in cash first. Here you can also let savings cover a checking account that runs short, save a set amount each month with a standing order, and set a one-off payment between your accounts for a date.',
    steps: [
      'On Payments And Cash, choose The Day’s Spending: In Cash, Then The Debit Card; On The Credit Card; or On The Debit Card. Your choice is kept.',
      'Read the line above Savings Covers The Checking Account: which savings covers which checking account, and what each of those accounts pays. Press the button to turn it On or Off.',
      'Under Standing Orders, type Each Month and Day Of The Month (1 to 31), choose Into if you have two savings accounts, and press Set Up A Standing Order Into Savings. Cancel stops one.',
      'Under Payments Set For A Date, choose From and To, type the Amount and the date On, and press Set The Payment. Cancel stops one.',
      'To have your wages paid into another account, go to Accounts and press Have Wages Paid Here on it. With two checking accounts, What Pays From Where moves a standing order or a card’s autopay: choose the account and press Pay From This Account.',
    ],
    needs: [
      'Savings Covers The Checking Account: easy-access savings at the bank of a checking account a payment comes from (your primary account, the account a card’s autopay is set on, or a loan’s repayment account). The button shows then, and while it’s On.',
      'Standing orders: an easy-access savings account at any bank. They show once you have one.',
      'A payment set for a date: two checking or easy-access savings accounts. What Pays From Where: two checking accounts.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None to set up. A payment out of savings costs its withdrawal fee once the bank’s free ones are used' },
      { label: 'Wages To A New Account', value: `Yale’s payroll pays there after ${PAYER_LEAD['yale-payroll']} days, about one of its weekly pay cycles` },
      { label: 'Other Payers', value: `After ${DEPOSIT_LEAD.days} days, one pay cycle of two weeks`, estimate: true },
    ],
    reads: [
      { label: 'The Day’s Spending', value: 'Used when the day’s groceries are bought each morning, and when you pay for Eat A Meal or have a meal delivered' },
      { label: 'The Order Of Paying', value: 'Cash first if you chose it, or the credit card first if you chose that; then your primary account, savings at its bank if linked, its overdraft where the bank allows one, and the everyday card for the rest' },
      { label: 'Savings Covers The Checking Account', value: 'Easy-access savings at the bank of the checking account a payment comes from: your primary account’s for the day’s spending, the account a card’s autopay is set on for that autopay, and a loan’s repayment account for the loan' },
      { label: 'A Standing Order', value: 'The whole amount must be in the account it pays from at 9 AM on its day' },
      { label: 'A Payment Set For A Date', value: 'The amount must be in the From account at 9 AM that day; from savings, with its withdrawal fee and within any monthly allowance' },
    ],
    now: [
      'The Day’s Spending and the savings link are saved at once, and used from the next payment.',
      'A standing order is set for 9 AM on its next date. A payment set for a date waits on the calendar.',
      'Cancel removes either from the calendar.',
      'Pay From This Account: the standing order or autopay pays from that account from its next date.',
      `Have Wages Paid Here: your payers are told to pay there. Yale’s payroll does after ${PAYER_LEAD['yale-payroll']} days and other payers after ${DEPOSIT_LEAD.days}. A payment before then goes where it always did.`,
    ],
    later: [
      'On a standing order’s day, the whole amount moves if the account it pays from has it. If none of it can go, What Needs You says “A Standing Order Didn’t Go” and why, and it tries again next month. That happens when the account is short, either account is dormant or closing, the account it pays from is blocked after a switch because it owes money, or (in a save from before this was ruled out) it pays into a term deposit.',
      'An order on the 29th, 30th or 31st goes on the last day of a shorter month.',
      'On a payment’s date it moves if the From account has it, and from savings with its withdrawal fee and within any monthly allowance. It doesn’t go, and “A Scheduled Payment Didn’t Go” says why, when the account is short, either account is closed, dormant or closing, the From account is blocked after a switch because it owes money, or (in an older save) either is a term deposit.',
      'Between two of your banks, a standing order or a payment set for a date leaves on its day and arrives as Move Money’s would, shown under On Its Way until then. Sent from Citi, it has to fit Citi’s daily and monthly limits, and doesn’t go if it doesn’t.',
      'With savings linked, a payment a checking account can’t make takes the rest from easy-access savings at that account’s bank, as far as the savings allows, with any withdrawal fee: your primary account’s bank for the day’s spending, the bank of the account a card’s autopay is set on for that autopay, and a loan’s repayment account’s bank for the loan.',
    ],
    interpret: [
      'In Cash, Then The Debit Card pays from your cash first, and by debit card for whatever cash can’t cover.',
      'On The Credit Card puts the day on your everyday card while it has room, then the debit card.',
      'Make Primary moves the day’s spending, and the savings that cover it, to the new primary account’s bank. A card’s autopay and a loan’s repayment stay on the accounts they were set up on, and the link keeps using savings at those accounts’ banks for them.',
      'The line above the link names, for each checking account a payment comes from, the savings that covers it and what it pays: “… covers …, which pays ….” One that says “… has no easy-access savings at … to cover it.” isn’t covered.',
      '“You don’t have easy-access savings at …, so turning this on covers nothing until you open some there.” means no checking account a payment comes from has savings at its bank.',
    ],
    unavailable: [
      '“Everyday spending goes in cash, on the debit card or on the credit card.”',
      '“There’s no savings account at … to cover …”, ending “your checking account”, or, with more than one paying account, “the checking accounts your payments come from”.',
      '“A standing order can only go into one of your savings accounts.” and “… is a term deposit, locked until its end. A standing order goes into easy-access savings.”',
      '“Enter how much to pay each month.” and “Pick a day of the month, 1 to 31.”',
      '“That standing order no longer exists.” and “That payment is no longer scheduled.”',
      '“A payment set for a date goes between two of your own accounts.”, “… is a term deposit, locked until its end. A payment set for a date goes between your checking and easy-access savings accounts.”, “Enter an amount.” and “Choose a date in the future.”',
      // Until 2026-10-13 this quoted “It pays into that account.” beside it too, `bank.set_order_source`’s refusal of the
      // account an order paid into; an order goes only into savings, so nothing reached it, and it went that day.
      '“A standing order has to pay from one of your open checking accounts.”',
      '“Choose one of your open checking or savings accounts for your wages.” and “… is closing, so wages can’t be paid into it.”',
    ],
    mistakes: [
      'Choosing On The Credit Card with autopay set to The Minimum. Once the card’s introductory months are over, the day’s groceries are charged the card’s interest rate.',
      'Choosing In Cash with no cash. The debit card pays instead, so take cash out first, under Cash.',
      'Choosing On The Debit Card or On The Credit Card when neither the bank nor the card can pay. Cash you carry isn’t spent unless the debit card is locked or stopped, so groceries or a meal they can’t pay for go unbought. Choose In Cash, Then The Debit Card to spend it.',
      'A standing order bigger than the account holds on its day. None of it goes. Move money in first, or lower the amount.',
      'Pressing Make Primary to move your wages. Have Wages Paid Here moves them.',
    ],
    next: [
      'Check Short For A Payment is On, on Statements under Alerts, so you’re warned before a standing order or autopay is due.',
      'If you chose In Cash, take some cash out under Cash, on the same tab.',
      'Turn on Savings Covers The Checking Account if you keep savings at the same bank.',
    ],
    related: ['bank.cash', 'bank.card', 'bank.accounts', 'bank.borrowing', 'bank.upkeep'],
    connections: [
      { to: 'bank.cash', kind: 'prerequisite', why: 'Paying the day in cash first needs cash, taken out under Cash on the same tab.' },
      { to: 'bank.card', kind: 'immediate', why: 'On The Credit Card puts each day’s groceries on your everyday card, and its statement and your credit record move with them.' },
      { to: 'bank.borrowing', kind: 'immediate', why: 'A debit card purchase the account can’t cover goes into the overdraft only where the bank allows it. Chase asks you to opt in.' },
      { to: 'body.look-after', kind: 'immediate', why: 'A meal you pay for or have delivered is paid the way The Day’s Spending says.' },
      { to: 'school.shifts', kind: 'scheduled', why: `Have Wages Paid Here reaches Yale’s payroll after ${PAYER_LEAD['yale-payroll']} days, and your shift pay goes there from then.` },
      { to: 'bank.upkeep', kind: 'optional', why: `Short For A Payment warns you ${LOOKAHEAD_DAYS} days ahead when an account can’t cover a standing order or a payment set for a date.` },
    ],
    example: {
      setup: `A student at Chase sets up a ${usd(50_00)} standing order into ${SAVINGS.name} on the 1st, and ${CHECKING.name} holds ${usd(30_00)} that morning.`,
      steps: ['Under Standing Orders, type 50 and 1, and press Set Up A Standing Order Into Savings.', 'Let the 1st come with the account short.'],
      result: `At 9 AM on the 1st the order doesn’t go: ${usd(30_00)} is short of ${usd(50_00)}, and an order goes in full or not at all. What Needs You says “A Standing Order Didn’t Go”, and it’s set again for the 1st of next month. Short For A Payment would have warned you up to ${LOOKAHEAD_DAYS} days before.`,
    },
  },
  {
    id: 'bank.cash',
    title: 'Cash',
    goal: 'money',
    covers: ['cash.withdraw', 'cash.deposit'],
    synonyms: ['atm', 'cash machine', 'withdraw cash', 'cash advance', 'deposit cash', 'post office', 'teller', 'cash in hand', 'atm fee'],
    questions: ['How do I take cash out?', 'What does an ATM cost?', 'How do I pay cash back in?', 'What does a cash advance cost?'],
    where: { route: BANK, tab: PAYMENTS, label: 'Your Bank, Payments And Cash, Cash' },
    available: `Once you’ve read “${chapter('cash.withdraw')}” in the guide.`,
    short: 'Cash takes money out of your primary account, at your bank’s ATM, another bank’s, the counter, or in Britain the Post Office where your bank allows it, or as a cash advance on your card. Each has the bank’s own fee, shown before you press. Pay It In puts cash back into an account.',
    steps: [
      'On Payments And Cash, find Cash. Its subtitle says how much cash you have.',
      'Type the Amount To Take Out, choose From (Your Bank’s ATM, Another Bank’s ATM, The Counter, The Post Office where offered, or A Cash Advance On The Card), read the line under it, and press Take It Out.',
      'With cash on you, type the Amount To Pay In, choose Into and At, and press Pay It In.',
    ],
    // Until 2026-10-13 the needs spoke of a machine only for paying out, and the paying-in refusals left out a dormant
    // account and the debit card at an ATM, which `cash.deposit` (`systems/cash.ts`) refuses from that day.
    needs: [
      'A checking account. A machine needs your debit card, arrived and unlocked, to take cash out or pay it in. The counter does either without it.',
      'The amount and its fees in your primary account, within the bank’s daily limit for machines.',
      'For a cash advance: room on your everyday card for it and its fee, within any cash limit the card sets.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Chase’s ATMs', value: `${Fee(CHASE_CASH.own)} at its own; ${fee(CHASE_CASH.other)} at another bank’s, plus ${usd(OWNER)} to the machine’s owner, the US average` },
      { label: 'Chase’s Counter', value: Fee(CHASE_CASH.teller) },
      { label: 'Chase’s Machines In A Day', value: `${usd(CHASE_CASH.daily ?? 0)} at most` },
      { label: 'A Chase Cash Advance', value: `${pct(CHASE_CARD.cashFeeShare ?? 0)} or ${usd(CHASE_CARD.cashFeeMin ?? 0)}, whichever is more, and ${pct(CHASE_CARD.cashApr ?? 0)} a year from the day you take it` },
      { label: 'Paying In', value: 'Free' },
    ],
    reads: [
      { label: 'The Bank’s Fees', value: 'Its own ATM, another bank’s, the counter and the Post Office each have their own fee' },
      { label: 'Today’s Machine Total', value: 'What you’ve taken out of ATMs and the Post Office today, against the daily limit' },
      { label: 'The Machine’s Owner', value: `The US average of ${usd(OWNER)} and Australia’s of ${formatMoney(OWNER_SURCHARGE.AU?.fee ?? 0, 'AUD')} are charged. Elsewhere the owner may add a fee the game doesn’t know, so it isn’t charged` },
      { label: 'The Card’s Cash Terms', value: 'Its cash advance fee, its cash rate and any cash limit' },
    ],
    now: [
      'Take It Out: the amount moves from your primary account into your cash, with the bank’s fee and any owner’s fee as separate lines.',
      'A cash advance: the amount and its fee go on your everyday card, and count as cash owed.',
      'Pay It In: the amount moves from your cash into the account you chose.',
    ],
    later: [
      'A cash advance is charged the card’s cash rate every day from the day you take it, with no interest-free period, and the interest is added at each statement.',
      'A payment to the card pays off its highest-rate balance first. On a US card the minimum payment goes to the lowest-rate balance first, and only what you pay above it reaches the highest-rate one.',
      'Cash you carry pays for the day first when The Day’s Spending is In Cash, Then The Debit Card.',
    ],
    interpret: [
      '“It’s free” under the amount means there’s no fee. A line about the machine’s owner adds what it charges, or says the owner may add a fee the game doesn’t know.',
      'For a cash advance, the line adds the rate it’s charged from today.',
      'Cash you carry counts in your worth, with what’s in the bank.',
    ],
    unavailable: [
      '“You need a checking account to take cash out of.”',
      '“… is dormant. Reactivate it under Your Accounts Over Time to take cash out of it.”',
      '“Your debit card hasn’t arrived yet. You can still take cash out at the counter.”, “Your debit card is stopped. You can still take cash out at the counter.” or “Your debit card is locked. Unlock it under Your Cards, or take cash out at the counter.”',
      '“…’s customers can’t use the Post Office for cash.”',
      '“… lets you take … a day out of machines, and you’ve taken … today.”',
      '“… has only … available.” or “… has nothing available.”, or, where the fees push it over, “… has only … available, and … in cash with its fees comes to ….”',
      'On the card: “The card has … of its limit left, and this needs … with its fee.” or “The card lets you take … out as cash, and … is out already.”',
      'Paying in: “You have only … in cash, so nothing was paid in.”, “Cash goes into your checking account or savings.”, “…’s customers can’t pay cash in at the Post Office.” or “… is dormant, so nothing was paid in. Reactivate it under Your Accounts Over Time, then try again.” At an ATM: “Your debit card is locked.”, “Your debit card is stopped.” or “Your debit card hasn’t arrived yet.”, each with “You can still pay cash in at the counter.”',
    ],
    mistakes: [
      `Taking cash from another bank’s machine in the US. At Chase that’s ${fee(CHASE_CASH.other)} plus about ${usd(OWNER)} to the owner, ${usd((CHASE_CASH.other ?? 0) + OWNER)} for one withdrawal, where Chase’s own machine is ${fee(CHASE_CASH.own)}.`,
      `Taking a cash advance to pay a bill. On the ${CHASE_CARD.name} it costs at least ${usd(CHASE_CARD.cashFeeMin ?? 0)} and is charged ${pct(CHASE_CARD.cashApr ?? 0)} from the first day.`,
    ],
    next: [
      'To spend your cash on the day first, choose In Cash, Then The Debit Card under How You Pay.',
      'Pay any cash you won’t spend back in with Pay It In.',
    ],
    related: ['bank.payments', 'bank.card', 'bank.card-security'],
    connections: [
      { to: 'bank.payments', kind: 'optional', why: 'In Cash, Then The Debit Card spends your cash on the day first.' },
      { to: 'bank.card', kind: 'immediate', why: 'A cash advance goes on your everyday card at once, and is charged its cash rate from the day you take it.' },
      { to: 'bank.card-security', kind: 'prerequisite', why: 'A machine needs your debit card, arrived and unlocked. With a locked, stopped or new card, only the counter works.' },
      { to: 'money.affairs', kind: 'immediate', why: 'Cash you carry counts in your worth, with what’s in the bank.' },
    ],
    example: {
      setup: `A student at Chase needs ${usd(60_00)} in cash, and the nearest machine is another bank’s.`,
      steps: ['Type 60 in Amount To Take Out and choose Another Bank’s ATM.', 'Read the line, then change From to Your Bank’s ATM.', 'Press Take It Out.'],
      result: `The other bank’s machine would cost ${fee(CHASE_CASH.other)} to Chase and ${usd(OWNER)} to its owner, ${usd(60_00 + (CHASE_CASH.other ?? 0) + OWNER)} out of checking in all. Chase’s own is ${fee(CHASE_CASH.own)}: ${usd(60_00)} out, ${usd(60_00)} in your hand. A cash advance on the ${CHASE_CARD.name} would cost ${usd(ADVANCE_FEE)} at once and ${pct(CHASE_CARD.cashApr ?? 0)} a year from today.`,
    },
  },
  {
    id: 'bank.card',
    title: 'A Credit Card',
    goal: 'money',
    covers: ['card.apply', 'finance.pay_card', 'finance.set_autopay', 'card.set_autopay_from', 'card.set_statement_day', 'card.request_limit', 'card.set_auto_raise', 'card.set_over_limit', 'card.set_everyday', 'card.close', 'card.refund_credit', 'card.request_hardship'],
    synonyms: ['credit card', 'apply for a card', 'autopay', 'minimum payment', 'statement day', 'due date', 'credit limit', 'credit record', 'credit score', 'late fee', 'everyday card', 'hardship plan', 'pay card in full'],
    questions: ['How do I pay my card?', 'What happens if I only pay the minimum?', 'Why was my card application declined?', 'How do I raise my limit?', 'What does a late payment cost?', 'How does my credit record change?', 'Can I hold more than one card?'],
    where: { route: BANK, tab: CARDS_TAB, label: 'Your Bank, The Cards Tab, Each Card’s Panel' },
    available: `Once you’ve read “${chapter('card.apply')}” in the guide.`,
    short: 'A credit card lets you spend now and pay later. Each month a statement comes, and you pay at least the minimum payment by the due date. Pay the whole statement every month and you’re never charged interest. Autopay pays it for you from your checking account. Each card has a panel on the Cards tab with its bank’s own terms, and you can hold one card from each bank where you live.',
    steps: [
      'On the Cards tab, each card has a panel: Owed, Left To Spend of its limit, and its Rate, then its terms line by line.',
      'Press Pay Card In Full to pay it now from your primary account and its savings. It reads Pay What You Can when they hold less than you owe.',
      'Press Autopay to switch between The Whole Statement and The Minimum. With two checking accounts, What Pays From Where, on the Accounts tab, sets the account it pays from: choose one and press Pay From This Account.',
      'To move your statement date, choose a Statement Day and press Change The Day. To change your limit, type a New Limit and press Ask For This Limit.',
      'Press Raise My Limit Automatically, or Going Over The Limit on a US card, to switch it. Make It The Everyday Card, Close The Card, Send The Credit To My Account and Ask For Help With Payments show when they apply.',
      'To apply for a card, go to Another Card (Credit Card while you have none), choose a Bank and press Apply For This Card.',
    ],
    needs: [
      'A credit record. Every life starts with one.',
      'To apply: a bank in the country you bank in that issues a card, whose card you don’t already have, and no other card on its way.',
      'Going Over The Limit is only for a US card. Ask For Help With Payments is for a balance your accounts can’t pay off today.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Applying', value: `${INQUIRY} points off your credit score, approved or not`, estimate: true },
      { label: `The ${CHASE_CARD.name}`, value: `${pct(CHASE_CARD.aprFrom ?? 0)} to ${pct(CHASE_CARD.aprTo ?? 0)}, depending on your credit record, and ${CHASE_CARD.annualFee ? `${usd(CHASE_CARD.annualFee)} a year` : 'no yearly fee'}. The minimum payment is ${pct(CHASE_CARD.minimumShare ?? 0)} of the statement plus the month’s interest, or ${usd(CHASE_CARD.minimumFloor ?? 0)} if that’s more, plus any plan’s monthly amount, and never more than the statement. It’s due ${CHASE_CARD.graceDays} days after the statement` },
      { label: 'A US Late Fee', value: `The card’s own, limited to ${usd(US_SAFE_HARBOR.first)} the first time and ${usd(US_SAFE_HARBOR.repeat)} for another within ${US_SAFE_HARBOR.withinPeriods} billing periods, and never more than the minimum payment. At Chase: ${usd(CHASE_LATE_FIRST)}, then ${usd(CHASE_LATE_AGAIN)}` },
      { label: 'Interest', value: 'Charged each day on what you owe, including earlier interest, once a statement isn’t paid in full' },
    ],
    reads: [
      { label: 'Your Credit Score', value: `Kept on the US scale, 300 to 850. A bank approves a card from ${APPROVE_FROM}`, estimate: true },
      { label: 'The Opening Limit', value: '$5,000 for a score of 740 or more, $2,500 from 670, and $1,000 below that, in your currency', estimate: true },
      { label: 'Money To Repay', value: 'Anything in your checking and savings accounts at every bank; in the US under 21, money of your own' },
      { label: 'A Month On Your Record', value: '3 points for a month paid as agreed, shared among your cards; 50 off for a late payment once it’s reported; 2 a month for each tenth of all your limits used past 30%', estimate: true },
      { label: 'A Limit Review', value: `Every six months: a fifth more for a score of ${RAISE_FROM} or more with no late payment in a year, unless you turned Raise My Limit Automatically off`, estimate: true },
      { label: 'With No Card Open', value: `${NO_CARD.aging} points a month back, on the 1st, while no payment has been late in a year and no debt is in collections, up to ${NO_CARD.ceiling}`, estimate: true },
      { label: 'How Long A Mark Lasts', value: `A mark leaves your record after ${MARK_YEARS.us} years in the US, ${MARK_YEARS.uk} in Britain, ${MARK_YEARS.ca} in Canada and ${MARK_YEARS.ie} in Ireland, and gives back ${MARK_GONE_GIVES} points` },
      { label: 'Moving The Statement Day', value: `Once a statement cycle, and the next statement comes no sooner than ${MIN_CYCLE_DAYS} days after the last`, estimate: true },
      { label: 'Going Over The Limit', value: 'Up to a tenth past the limit, with no fee, since no card here publishes one', estimate: true },
    ],
    now: [
      `Apply: ${INQUIRY} points come off your score at once. If you’re approved, What Needs You gives the limit and the card arrives in a week. If you’re declined, it says why.`,
      'Pay Card In Full: from your primary account, then savings at its bank, as much as you owe or as much as you have. Paid from another bank, some banks hold back the room it frees for a few days while it clears.',
      'Autopay, Statement Day, Raise My Limit Automatically and Going Over The Limit are saved at once.',
      `Ask For This Limit: a lower limit is granted at once, but never below what you owe. A higher one, up to a fifth more than now, needs a credit score of ${RAISE_FROM} or more, no late payment in a year, a card that isn’t suspended, and money in the bank.`,
      'Make It The Everyday Card: the day’s spending goes on it from now.',
      'Close The Card: nothing new can go on it, and if you owe nothing it closes at once.',
      'Send The Credit To My Account: a credit balance on the card moves to your primary account.',
      // Until 2026-10-13 this said the card could be used again once it was paid. A plan ends, and its suspension with
      // it, only at a statement that finds nothing owed or a due date met with nothing owed (`systems/credit.ts`); and
      // the late fee’s line below said “the minimum” where on a plan the due date judges the plan’s payment
      // (`autopayAsk`). Both found by the guide’s audit of that day.
      'Ask For Help With Payments: interest stops, and a payment that clears the balance in 48 months is set, which each statement asks for instead of the minimum. You can’t use the card until the first statement or due date after it’s paid off, when the plan ends.',
    ],
    later: [
      'On its statement day at 9 AM: interest is charged if the last statement wasn’t paid in full, any yearly fee is charged in the month the card opened, and the statement is written. With nothing owed, the month is reported as paid as agreed.',
      'On the due date at noon, autopay takes its amount from the account it’s set on, and from easy-access savings at that bank if savings is linked. If that isn’t enough for all of it, the payment comes back unpaid, and unless you paid the minimum yourself, the payment is late. A returned payment fee is charged, except on a US card, where the late fee covers the same missed payment.',
      'If you pay less than the minimum (on a hardship plan, the plan’s payment), you’re charged the late fee. Outside the US it goes on your credit record at once, and the limit is cut to 70%, but never below what you owe. In the US it goes on your record if it’s still short at the next due date, thirty days late.',
      'Two due dates missed in a row: the card is suspended until a payment is on time. Five: a default notice. Six: it’s charged off to collections and closed, and 100 points come off your score.',
      'On a US card with a penalty rate, a payment sixty days late brings 45 days’ notice and then that rate, until six payments in a row are on time. Sixty days late also ends any introductory rate.',
      'After you move the statement day, the next statement comes on the new day, as long as that’s far enough after the last one. You can’t change it again before the next statement.',
      'With Going Over The Limit allowed on a US card, spending can go a little past the limit, with no fee.',
      'A credit balance left on a US card for six months is sent back to your account.',
      'A card you closed while you still owed something closes at the first statement after it’s paid off.',
    ],
    interpret: [
      'Left To Spend is the limit minus what you owe and any payment held while it clears, plus a tenth more on a US card allowed to go over the limit. While the card is locked, stopped, suspended or closing, there’s nothing left to spend.',
      'The rate line says the range the bank sets a new card’s rate in, from your credit record when it opens, and the rate yours was set at. The bank doesn’t reprice your card later.',
      // Until 2026-10-13 a hardship plan’s statement said what paying the card’s minimum would take, at a rate the plan
      // doesn’t charge; from that day it says what the plan’s payment takes (`ui/bank/BankStatements.tsx`).
      'A statement on the Statements tab gives the minimum payment and its due date and, if you pay only the minimum and spend nothing more, how long it takes and what it costs in all, beside what clears it in three years. On a hardship plan it gives the plan’s payment instead, and how long that takes to clear it, with no interest.',
      'Terms marked as estimated, in the line at the foot of the panel, are a typical US card’s, used where the bank’s own weren’t found.',
      'Your credit score is only shown when you create a life: a number in the US and Canada, a word elsewhere. In play you see it in what banks do: approvals, limits and the rate a new card gets.',
    ],
    unavailable: [
      '“You have no credit record to apply with.”, “A card is already on its way.” or “You need a bank to apply to.”',
      '“You can only apply for a card in the country you bank in, and … is elsewhere.”, “… doesn’t issue a credit card.” or “You already have …’s card.”',
      `Declined, in What Needs You: a credit score under ${APPROVE_FROM}, a debt in collections, no money in your accounts to repay it from, or in the US under 21 without money of your own.`,
      '“You don’t have a card.”, “You don’t owe anything on it.” or “Your bank accounts have nothing available to pay it with, so nothing was paid.”',
      '“… takes the whole statement from your account each month. The … can’t carry a balance.” for a charge card’s autopay.',
      '“Pick a day from the 1st to the 28th.”, “Enter the limit you want.” or “Only a US card lets you opt in to going over the limit.”',
      '“You’re already on a payment plan.”, “You don’t owe anything on the card.” or “You could pay it off today. A hardship plan is for when you can’t.”',
      '“It’s already being closed.”, “The card holds no credit to send back.” or “Autopay has to pay from one of your open checking accounts.”',
    ],
    mistakes: [
      'Setting autopay to The Minimum. The rest is charged the card’s interest rate, and each statement charges interest on it until one is paid in full.',
      `Leaving the account autopay pays from short on the due date, with no linked savings at its bank to make up the rest. The whole payment fails, even if part of it was there. Short For A Payment warns you ${LOOKAHEAD_DAYS} days ahead.`,
      `Applying at bank after bank. Each application costs ${INQUIRY} points, approved or not.`,
      'Using more than 30% of all your limits. Your score suffers every month it lasts. Paying the card down before the due date lowers it.',
      'Closing your only card. With no card your score climbs only slowly, and stops at a ceiling.',
    ],
    next: [
      'Set Autopay to The Whole Statement, so you’re never charged interest or a late fee.',
      'Make sure the account autopay pays from has enough in it on the due date.',
      'Look at The Card’s Offers on the same tab for an introductory rate or rewards.',
    ],
    related: ['bank.card-offers', 'bank.card-security', 'bank.payments', 'money.affairs'],
    connections: [
      { to: 'money.affairs', kind: 'immediate', why: 'What you owe on a card counts against your worth at once, and Owed shows its rate and Credit Used.' },
      { to: 'bank.payments', kind: 'optional', why: 'On The Credit Card, in How You Pay, puts each day’s groceries on your everyday card.' },
      { to: 'bank.card-offers', kind: 'optional', why: 'Its introductory rate, rewards, money transfers and payment plans are under The Card’s Offers on the same tab.' },
      { to: 'bank.card-security', kind: 'immediate', why: 'A card that’s locked or reported has nothing Left To Spend until it’s unlocked or the new one arrives.' },
      { to: 'bank.borrowing', kind: 'evaluation', why: 'The credit record your card payments build is what a bank looks at to arrange an overdraft or lend to you, and at what rate.' },
      { to: 'day.needs', kind: 'scheduled', why: 'A statement with a payment due, a late payment, a failed autopay and a raised limit all come to What Needs You.' },
    ],
    example: {
      setup: `A student at Chase with a credit score of ${RECORD}, holding the ${CHASE_CARD.name}, applies for the ${WF_CARD.name}.`,
      steps: ['Under Another Card, choose Wells Fargo and press Apply For This Card.', 'A week later it arrives; press Make It The Everyday Card on it.', `Its first statement asks for ${usd(WF_STATEMENT)}, with Autopay on The Whole Statement.`],
      result: `The score drops ${INQUIRY} points to ${AFTER_APPLYING}, still over the ${APPROVE_FROM} a bank approves at, and the card comes with a $2,500 limit at ${pct(WF_RATE)}, and ${pct(WF_CARD.introApr ?? 0)} on purchases for its first ${WF_CARD.introMonths} months. The statement’s minimum payment is ${usd(WF_MINIMUM)}: ${pct(WF_CARD.minimumShare ?? 0)} of ${usd(WF_STATEMENT)} is ${usd(WF_SHARE)}, with no interest to add in the introductory months, and the card’s floor is ${usd(WF_CARD.minimumFloor ?? 0)}. It’s due ${WF_CARD.graceDays} days later, when autopay pays the whole ${usd(WF_STATEMENT)} and the month goes on your record as paid on time.`,
    },
  },
  {
    id: 'bank.card-offers',
    title: 'A Card’s Offers',
    goal: 'money',
    // Until 2026-10-12 this entry covered `bank.stop_balance_transfer` too, with its step, need, refusals and Keep The
    // Balance There, so the How It Works beside that control on Switch Bank opened a card's offers. It's Another Bank's
    // (`bank.other-banks`), the panel's own entry.
    covers: ['card.money_transfer', 'card.plan', 'card.redeem_rewards'],
    synonyms: ['introductory rate', 'zero percent', 'balance transfer', 'money transfer', 'pay over time', 'installment plan', 'rewards', 'cash back', 'redeem rewards'],
    questions: ['How long does my 0% rate last?', 'How do I move a balance to a new card?', 'What does a plan cost?', 'How do I use my rewards?', 'Is a plan free in the introductory months?'],
    where: { route: BANK, tab: CARDS_TAB, label: 'Your Bank, The Cards Tab, The Card’s Offers' },
    available: `Once you’ve read “${chapter('card.plan')}” in the guide.`,
    short: `Some cards come with offers, shown under The Card’s Offers: a low introductory rate on purchases for the first months, rewards on what you buy, a money transfer into your checking account for a fee, and a payment plan that pays off part of your purchases in equal monthly amounts for a fixed monthly fee instead of interest${PLAN_FREE_AT.length ? ` (free for its whole life on a plan made at ${andList(PLAN_FREE_AT)} while the card’s introductory rate lasts)` : ''}. You can also move a balance from another bank’s card when you apply for a new one.`,
    steps: [
      'On the Cards tab, The Card’s Offers shows each card’s introductory rate and when it ends, each transfer and plan with what’s left, and the rewards waiting.',
      'Press Redeem Onto The Card to take your rewards off what you owe on the card.',
      'Where the card offers a money transfer, type the Money Transfer To Your Account and press Transfer It, which shows its fee.',
      `For a plan, type the Amount For The Plan, choose Over (${orList(PLAN_MONTHS)} months, or the bank’s own lengths) and press Make The Plan.`,
      'To move a balance, apply for another bank’s card under Another Card, choose the card in Move A Balance From, and press Apply And Move The Balance. It moves when the new card arrives, and nothing new can go on the old card in the meantime.',
    ],
    needs: [
      'A card whose terms include the offer. The panel shows only what a card has.',
      'A money transfer: a card that offers one (NatWest’s, Santander Spain’s and Bankinter’s), a checking account to receive it, and room on the card for it and its fee.',
      'A plan: money owed for purchases, not counting cash advances, transfers and plans already made.',
      'A balance transfer: a card at another bank with something owed on it, and a new card whose limit can take that balance and its fee.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: `The ${CHASE_CARD.name}’s Offers`, value: `${pct(CHASE_CARD.introApr ?? 0)} on purchases for its first ${CHASE_CARD.introMonths} months. A balance moved onto it costs ${pct(CHASE_CARD.transfer?.feeShare ?? 0)} or ${usd(CHASE_CARD.transfer?.feeMin ?? 0)}, at ${pct(CHASE_CARD.transfer?.introApr ?? 0)} for ${CHASE_CARD.transfer?.introMonths} months. ${PLAN_FREE_IN_INTRO.has(CHASE.id) ? `A plan made in its introductory months is free for its whole life, and one made after costs ${pct(CHASE_CARD.planFeeShare ?? 0)} of the plan a month` : `A plan costs ${pct(CHASE_CARD.planFeeShare ?? 0)} of the plan a month`}. ${pct(CHASE_CARD.rewardsRate ?? 0)} back on purchases` },
      { label: 'A Money Transfer', value: 'The card’s fee, a share of the amount, then its transfer rate from the day it’s made' },
      { label: 'Rewards', value: 'Earned on purchases only. Cash advances, transfers, fees and interest earn none' },
    ],
    reads: [
      { label: 'The Introductory Rate', value: 'Lasts for the card’s number of months from the day it opened. On a US card a payment sixty days late ends it, and at Barclaycard one missed minimum payment does' },
      { label: 'Where A Payment Goes', value: 'To the highest-rate balance first and a plan’s balance last. On a US card, the minimum payment goes to the lowest-rate balance first' },
      { label: 'A Plan’s Fee', value: `Set when the plan is made, at the most the bank says it charges, and kept to its last month${PLAN_FREE_AT.length ? `. There’s none on a plan made at ${andList(PLAN_FREE_AT)} while the card’s introductory rate lasts, unless a payment sixty days late has ended it` : ''}` },
      { label: 'Bonus Categories', value: 'Groceries earn a grocery bonus, up to its cap where it has one, on the cards of Bank of America, RBC, TD, Scotiabank, BMO, CIBC and Santander Mexico. Everything else earns the card’s base rate, or the bank’s own rate for it where it sets one' },
    ],
    now: [
      'A money transfer: the amount goes into your primary account, and you owe it and its fee on the card as a separate transfer.',
      `Make The Plan: that much of what you owe for purchases becomes a plan, paid in equal monthly amounts. A plan with a fee (Chase’s, Bank of America’s) adds the fee it was made with every month until it ends, and isn’t charged interest${PLAN_FREE_AT.length ? `; one made at ${andList(PLAN_FREE_AT)} during the card’s introductory months has no fee` : ''}. A plan the bank charges as interest (Bank of Ireland’s, Scotiabank’s, CaixaBank’s) is charged the plan’s own rate instead of the card’s.`,
      'Redeem Onto The Card: the rewards come off what you owe on the card, as a credit.',
    ],
    later: [
      'At each statement: a transfer’s interest is charged at its own rate, each plan’s monthly amount and fee are added to what’s due and to the minimum, and the month’s purchases are counted for rewards.',
      'When the introductory months end, purchases are charged the card’s own rate.',
      'A balance transfer, on the day the new card arrives: the old card’s balance moves onto it with the transfer fee, at the transfer’s introductory rate for its months where it has one, and the old card closes.',
    ],
    interpret: [
      '“… on purchases until …, then ….” is the introductory rate and the rate after it.',
      '“A payment plan: … left, paid at … a month for …” is each plan as it stands: the months still to pay, then “with a … monthly fee instead of interest”, or for a free plan “with no fee and no interest”.',
      '“A plan made while the introductory rate lasts, until …, is free for its whole life.” shows while a plan made today would be free.',
      '“You have … to redeem” is the rewards waiting. Redeem Onto The Card is grayed out while there are none.',
    ],
    unavailable: [
      '“The … doesn’t offer money transfers.”, “You need a checking account for the money to go into.” or “Enter an amount.”',
      '“The card has … of its limit left, and this needs … with its fee.”',
      '“No payment plan terms were found for the ….”, “A plan runs for … months.”, “Only … of purchases can go into a plan.” or “A plan needs at least ….”',
      '“The card has no rewards to redeem.”',
      'Moving a balance: “A balance can only move onto a card at another bank.” or “It would come with a … limit, and moving … needs … with its fee. Pay the old card down first.”',
    ],
    mistakes: [
      `Making a plan at Bank of America while purchases are still at 0%. Its fee is charged from the first month, where interest would have cost you nothing.${PLAN_FREE_AT.length ? ` A plan made at ${andList(PLAN_FREE_AT)} in those months costs nothing.` : ''}`,
      'Thinking a plan’s fee works like interest. It’s charged on the whole plan amount every month, as much in the last month as in the first.',
      'Taking a money transfer to spend. Its fee is charged at once, and it’s charged interest from the first day.',
    ],
    next: [
      'Note the day the introductory rate ends, and pay off what you can before then.',
      'Redeem your rewards once they’ve built up.',
    ],
    related: ['bank.card', 'money.affairs'],
    connections: [
      { to: 'bank.card', kind: 'prerequisite', why: 'Offers come with a card, and a balance from another bank’s card moves when you apply for the new one.' },
      { to: 'money.affairs', kind: 'immediate', why: 'A money transfer adds to what you owe on the card and to your checking account at once.' },
    ],
    // Until 2026-10-12 the setup had nothing else on the card and said nothing of autopay. Played that way
    // (`tests/guide-examples-money.test.ts`), the plan didn't run its six statements: on The Whole Statement autopay paid
    // it off at its first due date, with one fee, and on The Minimum with nothing else owed, the minimum's floor, asked
    // beside the plan's month, paid the plan down, so it ended at the fifth statement with five fees. The result's
    // figures hold with the day's spending on the card and autopay on the minimum, and the setup says so now.
    example: {
      setup: `You owe ${usd(PLAN)} for purchases on the ${CHASE_CARD.name}, after its introductory months, at ${pct(CHASE_RATE)}. The Day’s Spending is On The Credit Card, and Autopay is on The Minimum.`,
      steps: ['Type 600 in Amount For The Plan, choose 6 months, and press Make The Plan.'],
      result: `Each statement asks for ${usd(PLAN / 6)} of the plan and its ${usd(PLAN_FEE)} fee, ${usd(PLAN / 6 + PLAN_FEE)} on top of the minimum for the rest, for 6 statements: ${usd(PLAN_FEE * 6)} in fees. Paying it down by the same ${usd(PLAN / 6)} a month at ${pct(CHASE_RATE)} would cost about ${usd(PLAN_INTEREST)} in interest.`,
    },
  },
  {
    id: 'bank.card-security',
    title: 'Card Security',
    goal: 'money',
    covers: ['card.lock', 'card.report', 'card.dispute', 'bank.new_number'],
    synonyms: ['lock card', 'lost card', 'stolen card', 'damaged card', 'replacement card', 'fraud', 'unauthorized payment', 'not mine', 'new account number', 'card expiry'],
    questions: ['What do I do if my card is lost or stolen?', 'How do I lock my card?', 'What if a payment wasn’t me?', 'How much of a fraudulent charge do I pay?', 'When does my card expire?'],
    where: { route: BANK, tab: CARDS_TAB, label: 'Your Bank, The Cards Tab, Your Cards' },
    available: `Once you’ve read “${chapter('card.lock')}” in the guide.`,
    short: 'Your Cards lists your debit and credit cards. Lock a card to stop anything new going on it, report it lost, stolen or damaged to stop it and get a new one, or report a payment you didn’t make. Someone else may use one of your cards, about as often as the country’s official figures say it happens; if you report it in time, the law limits what you pay and the rest comes back.',
    steps: [
      'On the Cards tab, find Your Cards: each card, ending in its last four digits, with the date it expires.',
      'Press Lock It to stop new spending on a card, and Unlock It to undo it.',
      // Until 2026-10-13 this said a bank rushed one for a fee; Capital One lists rush days and no fee, and `card.report`
      // (`systems/security.ts`) rushes Capital One’s for nothing from that day. Wells Fargo’s was rushed for nothing too until later
      // that day: it charges for a rush and doesn’t say what, and none is sent (`rushUnpublished`).
      'To replace a card, choose why (Damaged, Lost or Stolen) and press Report It, or Report It And Rush The New One where the bank rushes one, for its fee where it lists one.',
      'A payment you didn’t make shows with its amount, the card and the date, and asks “Wasn’t this you?”. Press Report It As Not Mine.',
      'Where your bank offers it, press Move My Account To A New Number.',
    ],
    needs: [
      'A card: a checking account’s debit card, or a credit card.',
      // Until 2026-10-13 this said locking needed a bank that locked in its app, and the unavailable list below quoted the
      // refusal of one that locked only by phone. No researched bank is one; the refusal went from `card.lock` that day.
      `Report It As Not Mine needs you to have found the payment, through an alert or on a statement, and in the US to report it within ${US_LAW.claimDays} days of the statement it was on.`,
      'A new number needs a primary account at a bank that moves accounts to a new number: Bank of America, Citi and Capital One do, and Chase and Wells Fargo don’t.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'A New Chase Card', value: `${Fee(CHASE_SAFE.replaceFeeDebit)} for a debit card, in ${CHASE_SAFE.standardDays} business days, or ${usd(CHASE_SAFE.rushFee ?? 0)} more rushed, in ${CHASE_SAFE.rushDays}. Chase lists no fee for a new credit card, so none is charged` },
      { label: 'Where A Bank Doesn’t Say', value: `A new card in ${ESTIMATE_DAYS} business days, ${ESTIMATE_RUSH_DAYS} rushed; a card lasts ${ESTIMATE_YEARS} years`, estimate: true },
      { label: 'Reported As Not Yours', value: 'The card it was used on is replaced free' },
    ],
    reads: [
      // Until 2026-10-13 a locked debit card took its half of the days with it; the rate is a person’s, and falls on the
      // card that works (`fraudOn`).
      { label: 'How Often', value: `In the US, ${pct(US_LAW.fraudRate ?? 0)} a year, the share of people whose existing credit card was misused (BJS, 2021). It falls a day at a time on your everyday credit card or your primary account’s debit card, half each, or all on one when the other is locked or stopped` },
      { label: 'How Much', value: `From a quarter to seven quarters of the country’s average case, ${usd(US_LAW.avgLoss ?? 0)} in the US`, estimate: true },
      { label: 'Stopped By The Bank', value: 'The share its country’s banks stop. In the US none is on record, so every charge goes through' },
      { label: 'What You Pay On A Debit Card', value: `In the US, at most ${usd(DEBIT_PROMPT.max ?? 0)} if reported within ${clockOf(DEBIT_PROMPT, 'of')}, and ${usd(DEBIT_LATER.max ?? 0)} within ${clockOf(DEBIT_LATER, 'of')}. After ${US_LAW.claimDays} days from the statement it can’t be reported, and you pay all of it` },
      { label: 'A Debit Made With The Account Number', value: `In the US you pay none of it, if reported within ${US_LAW.claimDays} days of the statement` },
      { label: 'What You Pay On A Credit Card', value: `At most ${usd(US_LAW.creditMax ?? 0)} in the US` },
      { label: 'The Refund', value: `Within ${US_LAW.refundDays} business days in the US` },
      { label: 'Where The Law Names No Days', value: `A refund in ${ESTIMATE_REFUND_DAYS} business days`, estimate: true },
      { label: 'When You Find Out', value: 'The day it happens if A Payment Over catches it, otherwise at the statement' },
    ],
    now: [
      'Lock It: nothing new goes on the card until you unlock it, including a stranger’s use. With the debit card locked, the day’s groceries go on the credit card or are paid in cash.',
      'Report It: the card stops at once, the bank’s fee is charged (for a debit card from its account, for a credit card onto the card), and a new card is on its way.',
      'Report It As Not Mine: what the law leaves you to pay is worked out now, the rest is set to come back, and the card it was used on is stopped and replaced free.',
      'Move My Account To A New Number: the checking account’s number changes at once, and its debit card is replaced.',
    ],
    later: [
      'The new card arrives in the bank’s business days, unlocked, with new last four digits, and What Needs You tells you.',
      'The refund arrives on its day, minus what the law leaves you to pay.',
      'A month before a card expires, a new one with the same number is sent.',
      `If a stranger used your debit card at a bank that moves accounts to a new number, the account’s number stays exposed for ${EXPOSURE.days} days: debits may be tried on it, and once the account has moved they’re declined.`,
    ],
    interpret: [
      '“Locked: nothing new can go on it until you unlock it.” is a locked card. A card you reported says why it was stopped, as in “Lost: stopped.”, and the day a new one arrives.',
      '“This is a new account’s first card”, with the day it arrives, is a new account’s first debit card on its way.',
      '“The law gives … days from the statement to report it, and they’ve passed.” beside a payment means you pay all of it.',
      '“Your account number isn’t known to be exposed” until a stranger has used the debit card at a bank that moves accounts. A new number then closes the old one to debits.',
    ],
    unavailable: [
      '“You don’t have a checking account.” or “You don’t have a card.”',
      '“That card is stopped, and a new one is on its way.” and “That card is already stopped, and a new one is on its way.”',
      '“No rushed replacement was found for ….” and “… doesn’t publish what it charges to rush a card, so the game can’t send a rushed one.”',
      '“… doesn’t offer to move an account to a new number. Closing it and opening another account does the same.”',
      '“You’ve reported it already.” and “The law gives … days from the statement to report it, and they’ve passed.”',
    ],
    mistakes: [
      'Locking your only way to pay. With the debit card locked, no credit card and no cash, the day’s groceries aren’t bought.',
      `Waiting to report a stranger’s debit card charge. After ${clockOf(DEBIT_PROMPT, 'from')}, US law leaves you to pay up to ${usd(DEBIT_LATER.max ?? 0)}, and after ${clockOf(DEBIT_LATER, 'from')}, the charge can’t be reported and you pay all of it.`,
      'Reporting a card lost when locking it would do. A report can’t be undone, and the new card takes the bank’s days to arrive.',
    ],
    next: [
      'Set A Payment Over on Statements, under Alerts, so you hear about a stranger’s charge the day it happens.',
      'Until a new card arrives, pay for the day in cash or on another card under How You Pay.',
    ],
    related: ['bank.upkeep', 'bank.card', 'bank.cash'],
    connections: [
      { to: 'bank.upkeep', kind: 'optional', why: 'A Payment Over, set low enough, tells you about a stranger’s charge the day it happens.' },
      { to: 'bank.card', kind: 'immediate', why: 'A credit card that’s locked or reported has nothing Left To Spend until it’s unlocked or replaced.' },
      { to: 'bank.payments', kind: 'immediate', why: 'With the debit card locked or stopped, the day’s groceries go on the credit card or are paid in cash.' },
      { to: 'bank.cash', kind: 'immediate', why: 'A machine needs the debit card. While it’s locked, stopped or hasn’t arrived, only the counter pays out.' },
    ],
    example: {
      setup: `A stranger spends ${usd(US_LAW.avgLoss ?? 0)}, the US average case, on a Chase debit card. A Payment Over is set at ${usd(500_00)}.`,
      steps: ['What Needs You says “A Large Payment” the same day.', 'The next morning, press Report It As Not Mine beside it.'],
      result: `Reported a day after you found out, US law leaves you to pay at most ${usd(DEBIT_PROMPT.max ?? 0)}, and ${usd((US_LAW.avgLoss ?? 0) - (DEBIT_PROMPT.max ?? 0))} comes back within ${US_LAW.refundDays} business days. The card is stopped, and a new one with a new number arrives in ${CHASE_SAFE.standardDays} business days, free.`,
    },
  },
  {
    id: 'bank.borrowing',
    title: 'Overdrafts And Loans',
    goal: 'money',
    covers: ['bank.arrange_overdraft', 'bank.borrow', 'bank.repay_loan', 'bank.debit_overdraft', 'bank.take_overrun_loan', 'bank.set_loan_repayment', 'bank.pay_collections'],
    synonyms: ['overdraft', 'overdrawn', 'overdraft fee', 'debit card overdraft', 'personal loan', 'borrow money', 'pay off a loan', 'collections', 'charged off', 'chexsystems', 'second-chance account'],
    questions: ['What happens if my account goes below zero?', 'Should I opt in to debit card overdrafts?', 'How do I borrow money?', 'Why was my loan refused?', 'How do I pay a debt in collections?', 'What happens if I stay overdrawn?'],
    where: { route: BANK, tab: BORROWING, label: 'Your Bank, The Borrowing Tab' },
    available: `Once you’ve read “${chapter('bank.borrow')}” in the guide.`,
    short: `Borrowing shows how your bank handles an overdraft, what it lends, and any debt in collections. A US bank like Chase pays a payment the account can’t cover for a fee each time (${usd(CHASE_OD.fee)}), and pays a debit card purchase that way only if you opt in. Most banks elsewhere arrange an overdraft up to a limit, at an interest rate. A personal loan is lent at the rate your credit record earns and repaid in equal monthly payments. An account left below zero for ${ESTIMATE.closeAfterDays} days is closed, and what it owes goes to collections.`,
    steps: [
      'Open the Borrowing tab. With checking accounts at two banks, choose the bank in Borrow At.',
      'Under Overdraft, read how the bank handles one. Where it asks, press Opt In To Debit Card Overdrafts, or Opt Out Of Debit Card Overdrafts.',
      'Where the bank arranges one, type the Overdraft Limit, tick Pay Per Use where offered, and press Arrange It. Close The Overdraft ends it.',
      'Under Personal Loan, type the Loan Amount, choose Over and, where asked, For. The rate and the monthly payment show. Choose Paid Into and Repaid From, and press Borrow It.',
      'With a loan, Repay From This Account moves its payments to another checking account, and Pay It Off clears it. Under In Collections, type Pay Toward It and press Pay It. In France, A Loan For The Overrun offers Take The Loan.',
    ],
    needs: [
      `A credit score of ${ESTIMATE.scoreFloor} or more for an arranged overdraft or a loan, and ${ESTIMATE.scoreGood} where a bank publishes only its lowest rate.`,
      'Wages paid into your accounts in the last 30 days. A bank arranges an overdraft, and lends, against them.',
      `For a loan, being the bank’s customer for as long as it asks (Wells Fargo: ${WF_LOAN.customerMonths} months). Citi lends a new customer up to ${usd(CITI_LOAN.newCustomerMax ?? 0)}, and Capital One up to ${usd(CAPITAL_ONE_LOAN.newCustomerMax ?? 0)}, through ${CAPITAL_ONE_LOAN.lender}, which asks for a Social Security number and ${usd(CAPITAL_ONE_LOAN.minIncome ?? 0)} a year of income.`,
      'Chase publishes no personal loan, so a Chase customer has to borrow at another bank.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Chase’s Overdraft', value: `${usd(CHASE_OD.fee)} a payment, at most ${CHASE_OD.maxPerDay} a day. None if the account is ${usd(CHASE_OD.graceUpTo ?? 0)} or less overdrawn by the end of the next business day, and none on a payment of ${usd(CHASE_OD.smallItemsFree ?? 0)} or less` },
      { label: 'How Far A US Bank Pays', value: `About ${usd(ESTIMATE.perItemCover)} below zero. The banks publish no limit`, estimate: true },
      { label: 'An Arranged Overdraft', value: 'Up to a month of your wages paid in, within the bank’s range', estimate: true },
      { label: 'A Loan’s Payment', value: `At most ${pct(ESTIMATE.loanShareOfPay)} of a month’s wages paid in, counting every loan you have`, estimate: true },
      { label: 'A Second-Chance Account', value: `${usd(CHEX.secondChanceFee)} a month, and no overdraft`, estimate: true },
    ],
    reads: [
      { label: 'Your Credit Score', value: `Where in its range a bank prices you: the lowest rate at ${ESTIMATE.scoreBest}, the highest at ${ESTIMATE.scoreFloor}`, estimate: true },
      { label: 'Wages In The Last 30 Days', value: 'What an overdraft is arranged against, and what limits a loan’s payment' },
      { label: 'Opted In Or Not', value: 'Whether a US bank pays an everyday debit card purchase into the overdraft' },
      { label: 'Days Below Zero', value: `Counted past any arranged limit. At ${ESTIMATE.closeAfterDays} the bank closes the account, and in France ${FRANCE.closingNoticeDays} days’ notice comes after that`, estimate: true },
    ],
    now: [
      'Opt In: an everyday debit card purchase the account can’t cover is paid into the overdraft, with its fee. Opted out, it goes on the credit card or is declined, with no fee.',
      'Arrange It: the limit and the rate your credit record earns are set, with the bank’s set-up or yearly fee where it charges one.',
      'Borrow It: the amount is in the account you chose at once, and the first payment is a month away.',
      'Pay It Off: what you owe and this month’s interest so far leave the repayment account (with easy-access savings at its bank where savings is linked, and its overdraft), and the loan closes.',
      'Repay From This Account: the next payment comes from that account.',
      'Pay It: that much leaves your primary account toward the debt, and once it’s paid in full the debt closes.',
      // The days toward closing start again from 2026-10-15: until then they ran on from the overrun's first day.
      `Take The Loan: the amount over the limit becomes a loan over ${FRANCE.offerMonths} months, paid into the account, with its first payment a month away. Back within its limit, the count of days toward closing the account starts again.`,
    ],
    later: [
      'While overdrawn: interest builds up each day where the bank charges it, and is charged on the 1st. Chase holds a payment’s fee until the end of the next business day, and drops it if the account is back by then.',
      'A loan’s payment, on the same day each month: the month’s interest, then the payment from the repayment account, easy-access savings at its bank where savings is linked, and its overdraft. If that falls short, the bank charges its returned payment fee where it has one, 50 points come off your credit score, and what’s left is still owed.',
      // From 2026-10-16 the debt is all of it to the day, and a standing order from or into an account it closes ends with it:
      // until then the overdraft interest built since the 1st and Germany's quarter of fees were dropped with the account,
      // and the order failed every month.
      `Below zero past any arranged limit for ${ESTIMATE.closeAfterDays} days: the bank takes what your other accounts there hold toward it, with the overdraft interest built up since the 1st and any fees owed to the day, sends the rest to collections, and closes the account, and ${ESTIMATE.chargeOffHit} points come off your score. The charge-off stays on your credit record for ${MARK_YEARS.us} years in the US, paid or not, and while the debt is unpaid no bank approves a card and the bank owed won’t open an account for you. A standing order paying from or into an account it closes ends with it, as its notice says. A US bank reports it to ChexSystems for ${CHEX.years} years, and while it’s unpaid the next US bank turns you away about ${pct(CHEX.declines.unpaid)} of the time, and ${pct(CHEX.declines.paid)} once it’s paid.`,
      `In France: a letter ${FRANCE.informAfterDays} days past the limit, and a loan for the overrun offered at ${FRANCE.offerAfterDays}.`,
    ],
    interpret: [
      '“It covers up to about …” is how far the bank pays payments before declining them. That figure is estimated, as the line at the foot of the panel says.',
      'The line under the overdraft that counts the overdraft fees on hold, each “charged after the end of” a day “unless the account is back to” zero or better (or to the small overdraft the bank lets go), is about fees you can still avoid.',
      'A loan’s quote, “…% a year: … a month for … months”, is its rate for your credit record and its equal monthly payment.',
      '“Every loan you hold, at any bank, counts against the same wages.” means a second loan is limited by what the first leaves.',
    ],
    unavailable: [
      '“Your bank doesn’t offer this choice.” and “… never pays a debit card purchase into an overdraft.”',
      '“No overdraft terms were found for ….” and “… doesn’t arrange overdrafts. It handles them its own way, as the Overdraft panel says.”',
      '“Your credit score is below …, and in the game a bank doesn’t arrange an overdraft below that.”',
      '“The bank arranges an overdraft against wages paid in over the last 30 days, and not enough has been paid in.” and “The bank arranges an overdraft of … to ….”',
      '“You’re overdrawn by more than that already.”, “No overdraft is arranged on it.” and “Pay the overdraft back before closing it.”',
      '“… only lends to its customers. Open a checking account there first.” and “… lends to customers of … months or more, and your account there opened ….”',
      '“Your credit score is below …, and in the game a bank doesn’t lend below that.” and “… publishes only its lowest rate, so in the game it lends only with a credit score of … or more.”',
      '“The bank lends for … to … months.”, “The bank lends at least ….” and “The bank lends up to ….”',
      '“The bank lends against wages paid in over the last 30 days, and none has been paid in.” and “A payment of … a month is more than the … of your wages a loan can take: … of the … paid in over the last 30 days.”',
      '“You already have a loan with ….”, “… doesn’t lend for a post-secondary education expense.” and “… asks for a Social Security number.”',
      '“… can’t cover the … it takes to pay it off, so nothing was paid.”, “You don’t owe anything in collections.” and “… has nothing available to pay it with, so nothing was paid.”',
      '“Your bank has offered no loan for an overrun.”',
    ],
    mistakes: [
      'Opting in to debit card overdrafts to keep buying groceries. Each purchase that overdraws the account costs the fee.',
      `Leaving an account overdrawn. After ${ESTIMATE.closeAfterDays} days it’s closed and the debt goes to collections, and a US bank’s report follows you for ${CHEX.years} years.`,
      'Asking for a loan with no wages paid in. A bank lends against the last 30 days’ wages, and money in savings doesn’t count.',
    ],
    next: [
      'If you’re overdrawn, move money in with Move Money on Accounts before the end of the next business day.',
      'Pay a debt in collections under In Collections. Once it’s paid, a bank can approve you for a card again, it stops worrying you, and the next US bank is less likely to turn you away.',
    ],
    related: ['bank.card', 'bank.payments', 'money.affairs', 'bank.other-banks'],
    connections: [
      { to: 'money.affairs', kind: 'history', why: 'A debt sent to collections stays in Owed until it’s paid.' },
      { to: 'bank.card', kind: 'evaluation', why: 'Your credit record decides whether a bank arranges an overdraft or lends, and at what rate. A debt sent to collections and a missed loan payment lower it.' },
      { to: 'bank.other-banks', kind: 'scheduled', why: 'An account closed for being overdrawn sends your money to another account of yours, and a ChexSystems report can make the next bank turn you away.' },
      { to: 'bank.payments', kind: 'immediate', why: 'How You Pay decides what can reach the overdraft: a bill always can, a debit card purchase only where the bank allows it.' },
      { to: 'body.how', kind: 'scheduled', why: 'Each day your primary account is overdrawn or a debt is in collections, it worries you.' },
    ],
    example: {
      setup: `${CHECKING.name} holds ${usd(20_00)} when a ${usd(100_00)} medical bill is paid from it, and you haven’t opted in.`,
      steps: ['The bill is paid, and the account is at −$80.', `By the end of the next business day, money paid in or moved across brings it back to −${usd(CHASE_OD.graceUpTo ?? 0)} or better.`],
      result: `Chase paid the bill into the overdraft, as it does a bill whether or not you opted in. At −$80 it’s past the ${usd(CHASE_OD.graceUpTo ?? 0)} Chase allows, so a ${usd(CHASE_OD.fee)} fee is put on hold, and because the account is back by the end of the next business day, the fee is dropped. Left overdrawn, the fee is charged, and ${ESTIMATE.closeAfterDays} days below zero would close the account.`,
    },
  },
  {
    id: 'bank.other-banks',
    title: 'Another Bank',
    goal: 'money',
    // `bank.stop_balance_transfer` from 2026-10-12, later the same day: until then A Card's Offers covered it.
    covers: ['bank.open_current', 'bank.switch', 'bank.cancel_switch', 'bank.stop_balance_transfer', 'bank.close_current'],
    synonyms: ['open an account', 'second bank', 'switch bank', 'change banks', 'close an account', 'switching service', 'opening deposit', 'current account switch service', 'stop the balance transfer', 'keep the balance there'],
    questions: ['How do I open an account at another bank?', 'How do I move to a new bank?', 'Why can’t I close my old account?', 'How long does a bank take to open an account?', 'Can I call off a switch?', 'Can I keep my balance at the old bank when I switch?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, Accounts, Your Banks And Another Bank' },
    available: `Once you’ve read “${chapter('bank.open_current')}” in the guide.`,
    short: `You can have checking accounts at more than one bank where you live. Open one at another bank with Apply, under Open An Account At Another Bank. In the US there’s no switching service, so moving banks is a few steps you take yourself: open the new account, have your wages paid into it, move each standing order, autopay and loan repayment, move the money, make it primary, and close the old account. Where a country has a switching service, Switch Bank does it all on a date: Britain’s takes ${GB_SWITCH.workingDays} working days.`,
    steps: [
      'On Accounts, under Open An Account At Another Bank, choose the Bank and, where it asks for an opening deposit, the account in Opening Deposit From and the Amount. Read what it needs, then press Apply.',
      'Under Your Banks, press Have Wages Paid Here and Make Primary on the new account, and under What Pays From Where, press Pay From This Account for each standing order and card autopay. On Borrowing, Repay From This Account moves a loan’s payments.',
      'Move the money across with Move Money.',
      'On the old account, choose an account in Send What It Holds To and press Close It. While something still uses it, the button is grayed out and the line under it says what.',
      'Where Switch Bank shows, choose Switch To and, if you like, a date in On (Optional), and press Switch. While it can still be called off, press Call Off The Switch… and then Call It Off to stop it.',
      'In Britain, once a switch can no longer be called off, Switch Bank shows Stop The Balance Transfer…. Press it, read what keeping the balance does, and press Keep The Balance There, or Move It As Planned to leave it.',
    ],
    needs: [
      'A valid photo ID: a passport, a driver’s license or an ID card. You can apply for each on Papers.',
      `The bank’s minimum age (${CHASE_OPEN.minimumAge} at Chase, Bank of America, Wells Fargo and Citi), and for Capital One and Citi, US citizenship or a green card.`,
      'Without a Social Security number, Chase, Bank of America and Wells Fargo only open an account in a branch where you live.',
      'No debt owed to that bank that it has sent to collections, and no ChexSystems report it turns you away for.',
      // Until 2026-10-15 a German account's fees closing would charge weren't among these, and Close It closed it overdrawn.
      // Until 2026-10-16 the overdraft interest built since the 1st wasn't either: closing dropped it.
      'To close a checking account: another checking account, and this one not primary, not overdrawn, with no money on its way, nothing paying from or into it, no savings beside it, no card payments pending, and enough in it for the overdraft interest built up since the 1st and, in Germany, the fees closing charges.',
      'Keep The Balance There: a British switch under way, past its last day to be called off and not a partial one, up to close of business on the working day before its date.',
    ],
    costs: [
      { label: 'Time', value: 'None online' },
      { label: 'In A Branch', value: `${BRANCH_MINUTES} minutes, without a Social Security number`, estimate: true },
      { label: 'Opening Deposits', value: `Bank of America ${usd(BOA_OPEN.minimumDeposit ?? 0)} and Wells Fargo ${usd(WF_OPEN.minimumDeposit ?? 0)}; Chase, Citi and Capital One none` },
      // Until 2026-10-12 this said Bank of America sent its card in its 6 business days, a digital card meanwhile. The
      // engine sends none after a digital card: `cardArrival` (`systems/bankmoves.ts`) works out the day from those days,
      // and `openApproved` drops it, so the card works from the day the account opens and nothing comes after it.
      { label: 'Decisions And Cards', value: `Bank of America decides in ${BOA_OPEN.reviewDays} business days, and its digital debit card works from the day the account opens. Chase opens at once, and its card arrives in ${CHASE_OPEN.card?.days} days` },
      // Until later on 2026-10-12 this said a debit card came in SLATE's own days wherever a bank gave none for a new
      // account; `cardArrival` (`systems/bankmoves.ts`) takes the bank's replacement card's days first, and only then SLATE's.
      { label: 'Where A Bank Doesn’t Say', value: `A debit card in the bank’s days for a replacement card, or ${ESTIMATE_CARD_DAYS} business days where it gives none`, estimate: true },
    ],
    reads: [
      // Its monthly fee from 2026-10-16, when the panel began to say it before Apply (`ui/bank/BankMoves.tsx`).
      { label: 'The New Bank’s Rules', value: `Its review days, opening deposit and card days, whether it closes an account left empty, how long money it sends to another bank takes (its own days or cut-off time, otherwise the country’s system, otherwise an estimated ${businessDays(ESTIMATE_SEND_DAYS)}), and its checking account’s monthly fee and how it’s waived` },
      { label: 'What Uses The Old Account', value: 'Wages paid into it, standing orders, card autopay, loan payments and payments set for a date' },
      { label: 'Britain’s Switch', value: `${GB_SWITCH.workingDays} working days. You can call it off up to ${GB_SWITCH.cancelBeforeDays} working days before its date, and stop just its balance transfer up to the working day before` },
    ],
    now: [
      'Apply, decided at once: the account opens empty and its card is on its way. Under review, the bank decides on its day. Any opening deposit leaves your account now.',
      // From 2026-10-16 the overdraft interest built since the 1st is settled with them (`settleOverdraftInterest`).
      // Germany's month to the day from 2026-10-16 (`closingFeesDue`): until then the whole month on any day of it.
      `Close It: interest, any overdraft interest built up since the 1st and fees are settled, what it holds goes to the account you chose (at once at the same bank, otherwise in the bank’s days), and the account closes with its history kept. In Germany the fees are those held over for the quarter’s closing plus this month’s fee only for the days it’s been open, because German law charges a month’s fee only up to the day an account closes. The line under Close It gives the figure before you press it. Citi keeps an account open, restricted, while card payments post, for up to ${CITI_OPEN.closeWithPendingDays} days.`,
      'Switch: it’s set for its date, and the new bank looks at the application the next day.',
      'Call It Off: the switch is canceled, and your accounts and payments stay where they are.',
      'Keep The Balance There: the switch goes ahead on its date and your payments move, but the balance stays in the old account, which stays open.',
    ],
    later: [
      'On the decision day, the account opens, or the bank turns you down and says why. A deposit you sent comes back to the account it left.',
      // From 2026-10-16 such a close settles first (`closedByBank`): until then it closed and settled after.
      `${CAPITAL_ONE_OPEN.fundWithinDays !== undefined ? `Capital One closes an account no money is paid into within ${CAPITAL_ONE_OPEN.fundWithinDays} days` : 'A bank may close an account no money is paid into'}, and Citi one left at zero for ${CITI_OPEN.closesAtZeroAfterDays} days, if closing leaves nothing owed. Any interest it earned goes to your primary account, and a standing order paying from it ends with it, as the bank’s notice says. If its fees would take it below zero, it stays open and they’re charged when due.`,
      'On a switch’s date, the new accounts open, and balances, wages, standing orders, autopay, loan repayments and payments set for a date move as the old account closes. With its balance transfer stopped, or on a partial switch, the payments move and the old account stays open with its balance. If the old account is overdrawn on the day, it stays open, blocked to everything but paying in, until it’s repaid.',
    ],
    interpret: [
      '“Application sent. … decides by ….” means a review is under way. “Your account at … is open.” means it’s open now, and the line under it gives the card’s day.',
      'A new account that’s waiting for its first deposit, or for an opening deposit of a set amount, hasn’t had the money arrive yet. Where a date is given, the bank closes it if nothing has arrived by then.',
      // The day from 2026-10-16 (`closeHold`): until then it said only that the wages were paid in, and to move them.
      'Under Close It, a list of what still uses the old account. If its wages are already on their way elsewhere, it gives the day each payer moves and the day you can close it.',
      '“… it now charges … in fees: …”, after Closing or Canceling, is what closing a German account would charge now: the fees held over for the quarter’s closing, and this month’s fee for the days the account has been open, rounded to the cent. After 11 PM on a month’s last day, that month is counted with the quarter’s.',
      'Past Switches lists each switch and how it ended.',
    ],
    unavailable: [
      '“You can only open an account at a bank in the country you live in.” and “You already have a checking account at ….”',
      '“… is still reviewing your application.”',
      '“… won’t open an account for you while you owe it a debt it has charged off.” and “… won’t open an account for you because of the ChexSystems report … filed, which stays on your record until ….”',
      '“… needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.”',
      '“… only opens an account in your own name from age ….” and “… only opens this account for US citizens and permanent residents, and on an F-1 visa you’re neither.”',
      // Until 2026-10-13 this began with “Without a Social Security number, … opens your account in a branch where you
      // live.”, a refusal for a life away from home; nothing has moved a life from where it lives since travel went in the
      // scope reset of 2026-10-09, and it went from `openRefusal` (`systems/bankmoves.ts`) that day.
      'Without a Social Security number, a branch visit is refused while you’re in hospital, while you’re busy elsewhere, or when something starts before the visit would end.',
      '“… asks for an opening deposit of …, sent from another of your accounts.” and “That account is already at …. Pay the deposit from an account at another bank.”',
      'Closing: “It’s your only checking account, and you always need one for your wages to be paid into. Open another one first.”, “It’s your primary account. Make another account primary first.”, “It’s overdrawn by …, and the bank only closes it once that’s paid off. Move money into it first.”, “Money is on its way into or out of it. Wait until it arrives.”, a list of what still uses it, “… is still open at the same bank. Close that first.”, “Card payments are still pending on it. You can close it once they’ve posted.”, or, where its fees, with any overdraft interest, come to more than its balance, a sentence naming each that ends “… more than it holds. Move … into it first.”',
      'Switching, in the US: “There’s no switching service here: …” Elsewhere: “A switch is already under way.”, “Clear the overdraft before switching. The new bank won’t take it on.” or “A partial switch is only available through Britain’s Current Account Switch Service.”',
      'Calling it off: “This country’s switching service doesn’t let you call a switch off. It goes ahead on its date.” or “You could call it off until …”',
      'Keep The Balance There: “No switch is under way.”, “This country’s switching service has no such step.”, “Its balance transfer is already stopped.” or “The transfer could be stopped until close of business ….”',
    ],
    mistakes: [
      'Closing the old account first. Wages, standing orders, autopay and loan payments still use it, and Close It says so. Move each one, then close it.',
      'Expecting Make Primary to move your wages. Have Wages Paid Here does, after the payer’s lead time.',
      `Applying without the opening deposit in another account. Bank of America asks for ${usd(BOA_OPEN.minimumDeposit ?? 0)}, sent from one of your accounts.`,
    ],
    next: [
      'Once the new account opens, press Have Wages Paid Here on it, then move each payment with Pay From This Account.',
      'When nothing uses the old account any more, close it with Close It.',
    ],
    related: ['bank.accounts', 'bank.payments', 'bank.transfer', 'bank.borrowing'],
    connections: [
      { to: 'documents.passport-id', kind: 'prerequisite', why: 'A new bank asks for a valid photo ID: a passport, a driver’s license or an ID card.' },
      { to: 'bank.payments', kind: 'prerequisite', why: 'Before the old account closes, wages, standing orders, autopay and loan payments have to be moved off it, and payments set for a date to or from it canceled.' },
      { to: 'bank.transfer', kind: 'scheduled', why: `Money between your banks arrives in the sending bank’s own days or by its cut-off time, or where it sets none, by its country’s system. Where neither says, the game estimates ${businessDays(ESTIMATE_SEND_DAYS)}.` },
      { to: 'bank.accounts', kind: 'immediate', why: 'Make Primary on the new account puts its bank at the top of Money, and your day-to-day spending comes out of it.' },
      { to: 'bank.borrowing', kind: 'optional', why: 'A second bank lends or arranges an overdraft on its own terms. Choose it in Borrow At.' },
    ],
    // Until 2026-10-12 the result said its debit card came in Bank of America's 6 business days, a digital one
    // meanwhile. Played (`tests/guide-examples-money.test.ts`), the card works from the day the account opens and nothing
    // arrives after it, as the costs above say now.
    example: {
      setup: `A student at Chase with ${usd(2_000_00)} in ${CHECKING.name} opens an account at Bank of America, which asks for ${usd(BOA_OPEN.minimumDeposit ?? 0)}.`,
      steps: [`Choose Bank of America, Opening Deposit From ${CHECKING.name}, Amount ${(BOA_OPEN.minimumDeposit ?? 0) / 100}, and press Apply.`, `When it opens, press Have Wages Paid Here and Make Primary on its ${BOA.current.name}.`],
      result: `The ${usd(BOA_OPEN.minimumDeposit ?? 0)} leaves Chase now and arrives in Chase’s ${CHASE_OPEN.sendDays} business days. Bank of America decides in ${BOA_OPEN.reviewDays}, opens the account empty, and its digital debit card works from the day it opens. Yale’s payroll pays into it after ${PAYER_LEAD['yale-payroll']} days, and ${CHECKING.name} can close once nothing pays from it or into it and there’s no savings beside it at Chase, its money sent across in ${CHASE_OPEN.sendDays} business days.`,
    },
  },
  {
    id: 'bank.home-account',
    title: 'A Bank At Home',
    goal: 'money',
    covers: [],
    synonyms: ['home bank', 'bank account abroad', 'foreign account', 'before yale', 'where you lived', 'account kept at home', 'pounds', 'non-resident'],
    questions: ['Can I keep my bank account from home?', 'Why does creation ask where I lived before Yale?', 'Why can’t I choose my bank there?', 'Why are my savings in pounds?'],
    where: { route: BANK, tab: ACCOUNTS, label: 'Your Bank, The Accounts Tab; made on creation’s Starting Point, Before Yale' },
    available: 'Chosen when you create a life that begins at Yale, under Before Yale on Starting Point.',
    short: `If you lived outside America before Yale, you can keep your bank account from there. Before Yale, on Starting Point, asks where you lived, since when, and whether you kept an account. Where you lived decides it, not where you were born. The game offers only the ${HOME_BANKS} banks in ${HOME_COUNTRIES} countries with research on what they do when a customer moves to America. If you keep one, your savings can stay there in its currency, and your everyday money is in your American account.`,
    steps: [
      'On Starting Point, under Before Yale, tick I Lived Where I Was Born, or choose the town in Where You Lived, then the month and year in Since.',
      'Tick I Kept An Account There and choose Your Bank There. A bank the game can’t offer is grayed out, with the reason under the list.',
      'Read what keeping it means, then choose Your Savings: Kept At the bank there, or Moved To your American bank.',
      'Review lists Before Yale and Home Bank. Begin opens both accounts.',
    ],
    needs: [
      'A life that begins at Yale, and a place outside America you lived in before it.',
      'A bank there with research behind it, whose own terms let you keep the account.',
      `The account open before Yale: from the later of the month you began living there and the bank’s minimum opening age (${ASSUMED_OPENING_AGE} where the research found none).`,
    ],
    costs: [
      { label: 'Time', value: 'None. It’s set up with the life' },
      { label: 'Money', value: 'No extra money. Your family’s money is split between the accounts, not added to' },
    ],
    reads: [
      { label: 'Where You Lived', value: 'Its country, and the region whose public holidays the bank follows for you' },
      { label: 'The Bank’s Terms', value: 'Whether it keeps an account for a customer abroad, on what conditions, how sure the research was, any fee for a customer abroad, and its notice if it closes one' },
      { label: 'Your Citizenship', value: 'Checked only where a bank never opens an account for a US citizen. It never makes you eligible' },
      { label: 'Exchange Between The Accounts', value: `Where a bank publishes no margin, ${percentOf(ASSUMED_MARGIN)}; where it publishes no time, ${ASSUMED_DAYS} business days`, estimate: true },
    ],
    now: [
      // From 2026-10-16: until then the current account opened at nothing, and at 21 of the 54 banks its fees overdrew it.
      'Kept: the bank’s checking account opens with what its own fees will come to until you graduate, and its savings with the rest, in whole units of its currency at an estimated exchange rate. Anything left over joins your American checking. Together they add up to your family’s money, to the cent.',
      'Moved: your American accounts open as if nothing were kept, minus what the checking account at home opens with to cover its fees until you graduate. A bank that charges nothing keeps it empty.',
      'Each account at the bank at home keeps its balance in its own currency, shown beside what it’s worth in dollars, and counts as used on the morning you arrive.',
    ],
    later: [
      'Its savings earns the bank’s interest, and the bank charges its own monthly fee as it would at home, plus any fee it charges a customer abroad on its own schedule, in its currency.',
      // From 2026-10-16: until then a Japanese bank's fee overdrew the empty current account (`chargeAbroadFee`).
      'A Japanese bank’s checking account can’t go below zero. SMBC and MUFG take their fee from whichever of your accounts there holds enough. Where neither does, it’s owed and taken the first night one does, and the bank sends nothing abroad in the meantime.',
      `Its country takes tax on a customer abroad from the interest: nothing in Britain, Germany or France, ${percentOf(NON_RESIDENT_TAX.JP!.rate)} in Japan.`,
      // From 2026-10-16: a German account closed with Close It owes this month's fee to the day (`closingFeesDue`), and a
      // close tried again after its notice charges no more fees (`feesEndedAt`).
      `A bank that closes the account of a customer abroad tells you on the first morning, with the date. On that day it settles the interest and fees and sends what’s left to your American account as a payment abroad, and its fees stop. If the account is overdrawn then, it tries again each day until it’s paid. Barclays does this, with ${homeTerms('gb-barclays')?.closeNoticeDays} days’ notice.`,
      'Close It on its checking account, once its savings there are closed, closes it as described under Another Bank. At a German bank it charges the fees held over for the quarter’s closing and this month’s fee only for the days it’s been open, and the line under Close It gives the figure first.',
      // From 2026-10-16 (brief 09's follow-up, `Bank.card.ahead`, `Bank.card.year` from brief 10): until then SLATE charged
      // nothing for the card.
      `Berliner Sparkasse’s Giro Digital price doesn’t include its Sparkassen-Card, which costs ${formatMoney(SPARKASSE.card?.yearly ?? 0, 'EUR')} a year, paid in advance: on the first night and each year after. If you close the account, the unused days of that year are refunded, and the line under Close It says so first.`,
      // From brief 10 (2026-10-16, `ARION_CARD_YEAR`): until then Arion's year was charged on each anniversary of the
      // account or its last charge, 365 days apart, a close neither refunded nor charged it, and the guide didn't say it.
      `Arion’s debit card costs ${formatMoney(ARION.card?.yearly ?? 0, 'ISK')} a year from age ${ARION.card?.freeUnder}, and nothing at ${(ARION.card?.freeUnder ?? 0) - 1} and under, as its price list says. ${ARION_YEAR.paid === 'ahead' ? 'It’s charged in advance, on the first night and on that date each year after' : 'It’s charged at the end of each card year, the first a year after the first night'}, by ${ARION_YEAR.place}’s calendar. If you close the account, the days of that year ${ARION_YEAR.paid === 'ahead' ? 'left are refunded' : 'used are charged'} in proportion, as ${ARION_YEAR.law}, has it. The account’s panel and the line under Close It say so first.${ARION_YEAR.simulated ? ` The timing is estimated: ${ARION_YEAR.simulated}.` : ''}`,
      `Move Money sends money between it and your American account as a payment abroad, typed in the sending account’s currency. It leaves at once with the sending bank’s fee, and arrives after its business days in both countries, minus the bank’s margin on the exchange and the receiving bank’s fee. Barclays charges nothing online and takes up to ${percentOf(homeTerms('gb-barclays')!.abroad.margin!)}; Chase charges ${usd(US_WIRES['us-chase']!.incoming!.fixed!)} for a payment from abroad. Where a bank publishes no margin or no time, the game estimates them, and the line under the amount says so.`,
      'Make Primary on its checking account makes its debit card your everyday card here, for its own fee on every purchase in dollars, where its card works abroad and the research has the fee.',
      // From 2026-10-16, module 6: the return reads the interest by its bank's country (`figuresFor`), and the accounts' figures each night (`Account.peak`).
      'On an F-1, its interest is foreign income America doesn’t tax: it stays off your 1040-NR and Connecticut’s return. A US citizen reports it on the 1040 and Connecticut’s return, and the tax its country took is credited against the US tax on the interest, up to that tax.',
      `A US citizen whose accounts abroad together held over ${usd(US_REPORTS.fbar.over)} at any time in a year is told once, with the next February’s return, that FinCEN’s FBAR is due April 15, extended to October 15, and, past ${usd(US_REPORTS.form8938.yearEnd)} at the year’s end or ${usd(US_REPORTS.form8938.anyTime)} at any time, that Form 8938 is due with a return. The game files neither, charges no penalty, and converts at an estimated exchange rate.`,
    ],
    interpret: [
      '“Kept At …: £… In …” is the balance the bank holds, in its currency.',
      `What keeping it means says how sure the research was: ${RETENTION_CONFIDENCE.H.toLowerCase().replace(/\.$/, '')}; or only partly; or the bank publishes nothing and the game assumes it.`,
      'Move Money’s line under the amount says what the bank sends, for what fee, at what margin, what arrives after the receiving bank’s fee, and on what day.',
      'Each account there shows its balance in its currency, Held From Abroad beside its number, and its value in dollars at an estimated exchange rate under it, with the bank’s fee for a customer abroad, its card’s fees here, and its closing date if it’s closing. Its statements, Home’s Money line and the alerts give it in its currency too.',
    ],
    unavailable: [
      '“You lived in … before …, so your account is the one here.”: you lived in America before Yale.',
      '“The game doesn’t know what … does when a customer moves to America, so it can’t offer this account.”',
      '“… opens an account from age …, and you left at ….” and “You moved there after Yale began.”',
      'Savings, a term deposit, a loan, an overdraft or a card at the bank there are refused, each in its own words: it opens nothing new for a customer abroad.',
      '“Yale only pays wages into an account in America.”',
      'Where a bank’s fee for sending or receiving a payment abroad isn’t published, Move Money says so and doesn’t send it.',
      '“SMBC stops its payments abroad while the Global Service fee can’t be taken.”, with what’s owed. Pay into either account there and it’s taken that night.',
    ],
    mistakes: ['Choosing where you were born when you grew up somewhere else. The bank keeps the account of a customer who lived in its country, so choose where you lived.'],
    next: [
      'Once you’re playing, check the account’s panel on Money for its fees and any closing date.',
      'Move money home or back with Move Money, reading the line under the amount for the fee and the day it arrives.',
    ],
    related: ['bank.accounts', 'bank.other-banks'],
    connections: [
      { to: 'bank.accounts', kind: 'immediate', why: 'Your accounts at home are among your accounts from the first morning, beside the American ones.' },
      { to: 'bank.upkeep', kind: 'scheduled', why: 'The bank there pays its interest and charges its own fee at the month’s end, as any bank does.' },
      { to: 'bank.transfer', kind: 'optional', why: 'Money moves between it and your American account as a payment abroad, counting both countries’ business days.' },
      { to: 'taxes.return', kind: 'scheduled', why: 'Each February’s return reports its interest by its country, and a US citizen is told there about the FBAR and Form 8938.' },
    ],
    example: {
      setup: `A student who grew up in London in a family of Modest means, banking at ${BARCLAYS.name}, with Chase in New Haven.`,
      steps: ['Under Before Yale, choose London and Since, tick I Kept An Account There and choose Barclays.', 'Leave Your Savings at Kept At Barclays and press Begin.'],
      result: `${BARCLAYS.savings.name} opens with ${formatMoney(LONDON_SPLIT.homeSavingsHeld, 'GBP')}, worth ${usd(LONDON_SPLIT.homeSavings)}, and Chase’s ${CHECKING.name} with ${usd(LONDON_SPLIT.checking)}: together ${usd(MODEST.checking + MODEST.savings)}, the family’s money to the cent. Barclays closes the account of a customer who lives outside Britain, with ${homeTerms('gb-barclays')?.closeNoticeDays} days’ notice, and the screen says when.`,
    },
  },
];
