/**
 * SLATE — the guide's reference: money and the bank (from 2026-10-12; `content/guide/types.ts`).
 *
 * The figures are the rules' own, imported: the bank tables (`content/banks.ts`, `content/cards.ts`,
 * `content/banks-lending.ts`, `content/bankopening.ts`, `content/cash.ts`, `content/security.ts`,
 * `content/accountlife.ts`) and the systems' constants. The worked examples bank at Chase, the first bank a life in the
 * United States opens at unless another is chosen (`startingBank`), and at the Modest means a life can start with
 * (`wealthIn`). A few numbers the systems keep to themselves are written as text: the record's monthly moves and the
 * card's limits (`systems/credit.ts`, `systems/cardlife.ts`), the day's worry (`systems/spending.ts`) and the hours a
 * standing order, a statement and the month's end run at.
 *
 * The screen's tabs are named through constants: the title-case sweep reads a `tab` property written as a literal as a
 * label, and an id isn't one.
 */

import { formatMoney } from '../../core/money';
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
import { MARK_GONE_GIVES, MARK_YEARS, MIN_CYCLE_DAYS, NO_CARD, priceWithin } from '../../systems/credit';
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
    available: `From the guide’s chapter “${chapter('ui.money')}”; the button to your bank from “${chapter('ui.bank')}”.`,
    short: 'The Money line in Your Affairs on Home is your money in one sentence: your primary account and its balance, what you’re worth, and how much of that is owed. Press Your Affairs for your net worth and where your spending went; inside it, press an account’s name for that account, and Owed for each debt with what a year of its interest would cost. Every figure is added up from the ledger as you look, so it can’t drift from the money behind it.',
    steps: [
      'On Home, read the Money line in Your Affairs: your primary account’s name and balance, then Worth, and how much of it is owed. “Your account is overdrawn.” shows under it while the primary account is below zero.',
      'Press the Your Affairs heading to open Net Worth: In The Bank (In The Bank And In Hand while you hold cash), Owed and Net, and Where It Went, what you spent over the last 30 days, by kind.',
      'Inside Net Worth, press an account for its Balance or what’s Owed on it, Still Free on a card, its Rate, and the last four digits it Ends In.',
      'Press Owed, offered while anything is owed, for each debt with its rate, A Year Of Interest, and Credit Used across your cards. A card in its introductory months is named with the day that rate ends and the rate after it.',
      'Press the button named for your bank, at the end of the Money line, to open your bank.',
    ],
    needs: [
      'Every life opens a current account at a bank where it begins, with savings where it begins with some, so the line is there from the first day.',
      'Owed opens only while something is owed: a card, a loan, a bill gone unpaid, a medical bill or a debt in collections.',
    ],
    costs: [
      { label: 'Time', value: 'None: reading the line and opening its figures moves no clock' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'In The Bank', value: 'Every account of yours that isn’t a debt: current, savings, term deposits and cash in hand. While you hold cash it reads In The Bank And In Hand, and the sentence says “in the bank or in hand”' },
      { label: 'Held', value: 'Money on its way between two of your banks, and SNAP waiting on an EBT card. The sentence names each part: “on its way between your banks” and “in SNAP on your EBT card”' },
      { label: 'A Pension', value: 'Counted apart, locked until you retire, where a save holds a pension account from before. No part of play opens one now' },
      { label: 'Owed', value: 'What each card, loan, unpaid bill, medical bill and debt in collections stands at' },
      { label: 'Rates', value: 'A card’s as its terms charge it today, an introductory or penalty rate included, and in its introduction the day that ends and the rate after it; an overdrawn current account’s overdraft rate; a loan’s own' },
      { label: 'Credit Used', value: 'What all your cards owe against all their limits. Past 30%, each month’s report takes 2 points off your record for each tenth past it', estimate: true },
    ],
    now: ['Reading changes nothing. Each balance is the sum of the postings against it, and net worth is added up from them again each time you look.'],
    later: [
      'The line moves as the money does: wages paid in, the day’s groceries each morning, fees and interest at the month’s end.',
      'Each day something weighs on you (the primary account overdrawn, a bill unpaid, a card nine-tenths used or behind, a medical bill, a debt in collections, tax owed or a return late), the day’s turn adds 4 stress and takes 2 morale, more or less by your nature.',
    ],
    interpret: [
      'Worth is what you hold less what you owe. Below zero, you owe more than you have.',
      'A Year Of Interest is what the balances would cost over a year at today’s rates if none of it were paid. A card paid in full each month is charged none of it.',
      'Owed calls the dearest debt charged above 0% “the expensive one”; a card at 0% in its introduction is never it. “They’re charged no interest today.” means none of it draws interest now, though a card’s fees can still come; the line after it says when an introductory rate ends.',
      'Credit Used turns to a warning past 30%. It reads every open card’s limit, a card with nothing on it included.',
      'The line’s balance is the primary account’s alone; your other accounts are in Net Worth.',
    ],
    unavailable: [
      `The Money line shows Locked until “${chapter('ui.money')}” is read, and the bank’s button until “${chapter('ui.bank')}” is.`,
      'Owed isn’t offered while nothing is owed: “You don’t owe anybody anything, so there’s nothing standing against your name to look at.”',
      'A closed account no longer opens: “That account is closed. Whatever was in it went somewhere else a while ago.”',
    ],
    mistakes: [
      'Counting a term deposit as money to spend: it’s in your worth, and locked until its end.',
      'Mistaking money on its way between your banks for money lost: it’s counted as held until the day it lands, then as in the bank again. Where the banks pay at once, it lands as it’s sent.',
      'Letting a card run past nine-tenths of its limit: it weighs on you every day, and the month’s report takes points for each tenth past 30%.',
    ],
    related: ['bank.accounts', 'bank.card', 'bank.borrowing', 'bank.transfer'],
    connections: [
      { to: 'bank.accounts', kind: 'optional', why: 'The button at the end of the Money line opens your bank, where each account is run.' },
      { to: 'bank.card', kind: 'evaluation', why: 'Credit Used, read across every card’s limit, is what each card’s monthly report scores your record on.' },
      { to: 'body.how', kind: 'scheduled', why: 'Each day something here weighs on you, the day’s turn adds stress and takes morale.' },
      { to: 'taxes.pay', kind: 'optional', why: 'Tax owed weighs on you each day like a debt, though Papers holds it and Owed leaves it out.' },
    ],
    example: {
      setup: `A life begun in New Haven with Modest means, at Chase: ${usd(MODEST.checking)} in ${CHECKING.name}, ${usd(MODEST.savings)} in ${SAVINGS.name}, and ${usd(OWED)} owed on the ${CHASE_CARD.name} against a ${usd(MODEST.cardLimit)} limit.`,
      steps: ['Read the Money line on Home.', 'Press Your Affairs, then Owed.'],
      result: `The line reads “${CHECKING.name}: ${formatMoney(MODEST.checking, 'USD')}. Worth ${formatMoney(WORTH, 'USD', { cents: false })}, ${formatMoney(OWED, 'USD', { cents: false })} of it owed.” The card is still in its introductory months, so Owed says they’re charged no interest today, and that the card is at ${pct(CHASE_CARD.introApr ?? 0)} until the day they end, then ${pct(CHASE_RATE)}: about ${usd(Math.round((OWED * CHASE_RATE) / 100) * 100)} a year from then if none of it were paid. Credit Used is ${Math.round((OWED / MODEST.cardLimit) * 100)}%, under the 30% your record starts to pay for.`,
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
    available: `From the guide’s chapter “${chapter('ui.bank')}”.`,
    short: 'Your bank opens from the button named for it on Home’s Money line, or Money on the menu. It’s headed by the bank your primary account is at, in five tabs. Accounts shows each current and savings account under the bank’s own name for it, with its number written the country’s way, its balance, what it pays, what it costs and how this month’s fee stands. Open or close savings here, and choose which current account is primary.',
    steps: [
      'Open your bank: the button named for it on Home’s Money line, or Money on the menu. Its tabs are Accounts, Cards, Payments And Cash, Borrowing and Statements.',
      'On Accounts, each account’s panel shows its Balance, what it pays a year with its APY, and its monthly fee with how this month stands so far.',
      `At each bank where you keep a current account and no easy-access savings, press Open A and that bank’s savings name (Open A ${SAVINGS.name} at Chase). On a savings panel, Close It closes it, and the line beside it says where its money goes.`,
      'With current accounts at two banks, press Make Primary in Your Banks on the one the day should come out of.',
      'Press the bank’s name at the top for what it holds for you and the latest money through it. On Statements, choose an Account and a Period, and press any line for the accounts it moved between and the day it went through.',
    ],
    needs: [
      'Savings opens beside a current account of yours at the same bank, one savings account at each bank.',
      'Closing savings needs a current account to take what it holds.',
      'Make Primary needs a second open current account, at another bank.',
    ],
    costs: [
      { label: 'Time', value: 'None: each is done at once' },
      { label: 'Opening Savings', value: 'Free' },
      { label: CHECKING.name, value: `${usd(CHECKING.monthlyFee ?? 0)} a month, waived with ${usd(CHECKING.waiver?.depositsAtLeast ?? 0)} of electronic deposits paid in, by keeping ${usd(CHECKING.waiver?.balanceAtLeast ?? 0)} in it all month, or with a ${usd(CHECKING.waiver?.linkedAverageAtLeast ?? 0)} average across your Chase accounts` },
      { label: SAVINGS.name, value: `${usd(SAVINGS.monthlyFee ?? 0)} a month, waived by keeping ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)} in it all month; it pays ${pct(SAVINGS.rate ?? 0)} a year` },
    ],
    reads: [
      { label: 'Interest', value: 'Built each day on the day’s closing balance, past any floor, up to any cap, at the tier the balance reaches; paid on the month’s last day or in the bank’s own months, less any tax the country has the bank take first' },
      { label: 'The Monthly Fee', value: 'Charged at 11 PM on the month’s last day unless the month met a waiver: deposits paid in, the month’s lowest balance, its average, an average across your accounts at the bank, your age, card purchases, or the first months after opening. Short of a waiver, a bank that sets a lower fee charges that where the month met its condition' },
      { label: 'The Primary Account', value: `${PRIMARY_DOES.join('. ')}.` },
      { label: 'A Statement', value: 'Every entry on each account you’ve held, month by month (by the quarter in Germany), with the balance after each' },
    ],
    now: [
      'Opening savings: a new account at nothing, with its own number, beside your current account at that bank.',
      'Close It: this month’s interest so far is paid, less any tax (a German account’s fees so far come off with it), and what it holds moves to the current account at the same bank at once, or with none there to your primary account in the bank’s days. Standing orders into it, and payments set for a date to or from it, are called off.',
      'Make Primary: your debit purchases, cash from a machine, bills you pay by hand and anything new you set up use it from now, and the screen is headed by its bank. Wages, standing orders, card autopay and loan payments stay where they were set up.',
    ],
    later: [
      'At 11 PM on the month’s last day: interest paid, the fee charged or waived, and the current account’s statement written. Germany’s banks settle at each quarter’s end.',
      `In Germany, savings holding more than the ${GERMAN_MONTH} a month lets out takes three months’ notice to close, and closes then.`,
    ],
    interpret: [
      '“This month is waived so far” means a waiver is met up to now. One met by the balance can still be lost if the balance falls before the month ends.',
      'A rate the bank doesn’t publish is SLATE’s estimate and says so; “Its rate wasn’t found, so SLATE pays none on it” means just that.',
      'On a statement, Available Now takes pending card payments off; Posted Balance is what has gone through. A line marked Pending posts on the date beside it.',
      'The Year adds up Interest Earned before tax, Tax Taken Off It, Bank Fees, Card Fees and Card Interest Paid, and lists each fee by kind.',
    ],
    unavailable: [
      '“Savings opens beside a current account of yours at that bank.”',
      '“You already have a savings account at” that bank. Open A … shows for each bank where you keep a current account and no easy-access savings yet; a term deposit there doesn’t hide it.',
      '“There’s no current account to move the money into.”',
      '“Notice is given: … closes on ….” A German savings account on notice closes on its date.',
      '“… is primary already.” and “… is closing.”',
      `The screen shows Locked until the guide’s chapter “${chapter('ui.bank')}” is read.`,
    ],
    mistakes: [
      `Opening a savings account with a fee and leaving it short: ${SAVINGS.name} with nothing in it is charged ${usd(SAVINGS.monthlyFee ?? 0)} at the month’s end. Fund it the day you open it, and keep ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)} in it all month.`,
      'Expecting Make Primary to move your wages: it moves neither them nor anything else already set up. Have Wages Paid Here does, and Pay From There moves each standing order and autopay.',
      'Closing savings a standing order pays into: the order goes with it. Set one up again into the savings you keep.',
    ],
    related: ['money.affairs', 'bank.transfer', 'bank.payments', 'bank.other-banks', 'bank.term', 'bank.upkeep'],
    connections: [
      { to: 'money.affairs', kind: 'immediate', why: 'Every balance here counts in your net worth, and the primary account’s is the first figure on Home’s Money line.' },
      { to: 'bank.payments', kind: 'prerequisite', why: 'Standing orders need a savings account to point at, and Savings Covers The Current Account draws on easy-access savings at the bank of each current account a payment comes from.' },
      { to: 'bank.transfer', kind: 'optional', why: 'Move Money appears on this tab once you hold two accounts.' },
      { to: 'bank.borrowing', kind: 'immediate', why: 'The primary account’s bank runs the overdraft the day’s spending can run into.' },
      { to: 'bank.cash', kind: 'immediate', why: 'Cash comes out of the primary account, at its bank’s machines and fees.' },
      { to: 'bank.upkeep', kind: 'scheduled', why: 'An account left untouched goes inactive, then dormant, and after the country’s years its money goes to the state.' },
    ],
    example: {
      setup: `A student at Chase with ${usd(900_00)} in ${CHECKING.name}, no savings, and no wages paid in this month.`,
      steps: [`Press Open A ${SAVINGS.name}.`, `In Move Money, move ${usd(350_00)} from ${CHECKING.name} into it the same day.`, 'Leave both alone to the month’s end.'],
      result: `${SAVINGS.name} never ends a day under ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)}, so its ${usd(SAVINGS.monthlyFee ?? 0)} fee is waived, and at ${pct(SAVINGS.rate ?? 0)} its ${usd(350_00)} earns ${SAVINGS_MONTH > 0 ? usd(SAVINGS_MONTH) : 'less than a cent'} a month. ${CHECKING.name}, with about ${usd(550_00)} and nothing paid in, meets none of its waivers, so its ${usd(CHECKING.monthlyFee ?? 0)} comes off at 11 PM on the month’s last day.`,
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
    available: `From the guide’s chapter “${chapter('bank.transfer')}”, once you hold two accounts.`,
    short: `Move Money moves money between your own current and savings accounts. Between two at one bank it’s there at once. To your account at another bank it leaves now and sits in neither account until it lands, by the sending bank’s own rule (${CHASE_OPEN.sendDays} business days from Chase), or where the bank sets none, as the country’s banks pay: at once in most countries, the same business day before ${hour(JAPAN.sameDayBefore ?? 0)} in Japan, and in ${businessDays(CANADA.days ?? 0)} in Canada. Where neither says, SLATE takes ${businessDays(ESTIMATE_SEND_DAYS)}. A move out of savings may cost the bank’s fee past its free withdrawals, and a German savings account lets only ${GERMAN_MONTH} a month out without notice.`,
    steps: [
      'On the Accounts tab, find Move Money. It shows once you hold two current or savings accounts.',
      'Choose From, listed with each balance and the fullest last, and To.',
      'Type the Amount in your money, not in cents (250 at a US bank is $250), and press Move It.',
      'Under the fields, a note says whether a withdrawal from savings is free this time, and how much more the month lets out where it limits that.',
    ],
    needs: [
      'Two open accounts of yours, current or savings. A term deposit can’t be one of them; it’s locked until its end.',
      'The amount in the From account, with any withdrawal fee beside it.',
    ],
    costs: [
      { label: 'Time', value: 'None to make it; between banks, the sending bank’s own days or cut-off to arrive, or where it sets none, the country’s' },
      { label: 'At One Bank', value: 'Free, and at once' },
      { label: 'Between US Banks', value: `Chase ${CHASE_OPEN.sendDays} business days, Wells Fargo ${WF_OPEN.sendDays}; Citi the same business day before ${hour(CITI_OPEN.sameDayBefore ?? 12)}, the next after` },
      { label: 'Where Neither The Bank Nor The Country Says', value: `${businessDays(ESTIMATE_SEND_DAYS)}, as from Bank of America`, estimate: true },
      { label: 'Where Banks Pay At Once', value: 'Britain, Ireland, France, Germany, Spain, Iceland, Korea, Mexico, Australia and New Zealand: it lands as it’s sent' },
      { label: 'Japan', value: `By ${JAPAN.scheme}: the same business day, sent before ${hour(JAPAN.sameDayBefore ?? 0)}; the next business day, sent after` },
      { label: 'Canada', value: `By ${CANADA.scheme}: ${businessDays(CANADA.days ?? 0)}` },
      { label: 'Savings Withdrawals', value: 'Free, or past the bank’s free number a month, its fee each, as Canada’s and New Zealand’s banks charge' },
    ],
    reads: [
      { label: 'The Two Accounts', value: 'The From account’s balance, whether either account is dormant or closing, and whether the From account is held in debt by a switch' },
      { label: 'Free Withdrawals', value: 'Every payment out of savings this month counts, one savings makes for you included; interest and fees don’t' },
      { label: 'Germany’s Allowance', value: `${GERMAN_MONTH} a calendar month out of savings without notice, where the bank sets it` },
      { label: 'Citi’s Limits', value: `${usd(CITI_OPEN.limits?.outDay ?? 0)} a day and ${usd(CITI_OPEN.limits?.outMonth ?? 0)} a month out to other banks` },
    ],
    now: [
      'At one bank: out of one and into the other at once, a line on each statement.',
      'To another bank, where the banks don’t pay at once: out now into Money In Transit, listed under On Its Way with the day it lands. The message says when.',
      'A withdrawal fee, where one is due, comes out of savings as a line of its own.',
    ],
    later: [
      'On the day, at the other bank: it lands in the account it was sent to. If that account has closed, it comes back to the one it left, and What Needs You says so.',
      'A move counts as using both accounts, and keeps them from going inactive.',
    ],
    interpret: [
      'A message beginning “Moved” means the money is there now; one beginning “Sent” gives the day it arrives.',
      'Money in transit counts in your worth, and in neither account.',
      '“The month’s free withdrawals are used: this one costs …” is the fee the next move out of savings will take.',
    ],
    unavailable: [
      '“Money moves here between your own current and savings accounts.”',
      '“That’s the same account.” and “Say how much to move.”',
      '“… holds …”: the From account has less than the amount.',
      '“… is dormant; use Reactivate first.”',
      '“… can let … out, with the … withdrawal fee.”',
      '“… lets … more out this month without notice; more takes three months’ notice.” (a German savings account)',
      '“… is closing.” and “… is blocked to everything but paying off what it owes, since the switch.”',
      `At Citi: “Citi lets ${usd(CITI_OPEN.limits?.outDay ?? 0)} a day out to other banks, and … has gone today.” or “Citi lets ${usd(CITI_OPEN.limits?.outMonth ?? 0)} a month out to other banks, and … has gone this month.”`,
    ],
    mistakes: [
      `Emptying an account a standing order or a card’s autopay pays from just before its day: the order doesn’t go, and the autopay bounces unless linked savings at that account’s bank covers it. Short For A Payment warns you ${LOOKAHEAD_DAYS} days ahead.`,
      'Sending money between banks late in the week: business days skip the weekend and the country’s bank holidays.',
      `Topping savings up mid-month to meet a balance waiver: Chase reads the month’s lowest balance, so a month that dipped under ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)} pays the fee anyway, and the fee itself can take it under again.`,
    ],
    related: ['bank.accounts', 'bank.payments', 'bank.other-banks', 'bank.upkeep'],
    connections: [
      { to: 'bank.accounts', kind: 'prerequisite', why: 'Move Money appears only once you hold two accounts.' },
      { to: 'bank.other-banks', kind: 'scheduled', why: `Money sent to your account at another bank lands on the day the sending bank’s rule sets, or where it sets none, its country’s, and where neither says, in SLATE’s estimate of ${businessDays(ESTIMATE_SEND_DAYS)}.` },
      { to: 'bank.upkeep', kind: 'immediate', why: 'A move uses both accounts, keeping them from going inactive; a dormant one refuses it until reactivated.' },
      { to: 'bank.payments', kind: 'optional', why: 'A standing order or a payment set for a date makes the same move on a day you choose.' },
    ],
    example: {
      setup: `${CHECKING.name} holds ${usd(800_00)}, and ${SAVINGS.name} has held ${usd(100_00)} all month.`,
      steps: [`In Move Money, choose ${CHECKING.name} as From and ${SAVINGS.name} as To.`, 'Type 250 and press Move It.'],
      result: `“Moved ${usd(250_00)}.” Checking holds ${usd(550_00)} and savings ${usd(350_00)} at once. Savings stood at ${usd(100_00)} earlier this month, so this month’s ${usd(SAVINGS.monthlyFee ?? 0)} fee still comes off at the month’s end and leaves ${usd(350_00 - (SAVINGS.monthlyFee ?? 0))}; that’s over ${usd(SAVINGS.waiver?.balanceAtLeast ?? 0)}, so next month’s is waived if it’s left there.`,
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
    available: `From the guide’s chapter “${chapter('bank.open_term')}”.`,
    short: `A term deposit locks money away at a fixed rate for the bank’s term: Chase’s ${CHASE_TERM.called} is ${CD_MONTHS} months at ${pct(CHASE_TERM.rate)}. Its interest builds each day. At the end it does what the bank does unless you chose another way the bank allows: renewed for the same term at the bank’s rate on the day, moved into the bank’s easy-access savings, or paid into your current account. Breaking one early, where the bank allows it, costs the bank’s penalty, shown before you press.`,
    steps: [
      `On Accounts, find your bank’s term deposit panel (${CHASE_TERM.called} at Chase), type the Term Deposit Amount and press Put It Away. It comes from your current account at that bank.`,
      'Under Your Accounts Over Time, read what it does on its end date and what breaking it now would cost.',
      'To change the end, press Renew It At The End, Move It To Savings At The End or Pay It Out At The End, as your bank allows.',
      `To end it now, press Break It Early; at NatWest, Give ${BREAK_NOTICE['gb-natwest']} Days’ Notice. Where the bank pays interest during the term, Take The Interest So Far moves what it has earned to your current account.`,
    ],
    needs: [
      'A current account at the bank holding the amount, and any minimum the bank sets.',
      'A bank with a term deposit rate on record; the panel says when there’s none.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'The amount, locked away until its end' },
      { label: 'Breaking A Chase CD Early', value: `${CHASE_BANDS}, never more than the interest earned, and at least ${CHASE_LIFE.penaltyFirstWeekDays} days’ interest in its first week` },
      { label: 'Where A Bank Words It Otherwise', value: 'The interest built so far', estimate: true },
    ],
    reads: [
      { label: 'The Rate', value: 'Fixed the day it opens; a renewal takes the bank’s rate on the day' },
      { label: 'The End', value: 'Your choice where the bank gives one, else the bank’s own way' },
      { label: 'Notice', value: 'Some banks need days’ notice to change the end, or to close one early' },
      { label: 'Interest So Far', value: 'Built each day on the deposit at its fixed rate, without compounding' },
    ],
    now: [
      'Put It Away: a new account named for the bank’s product, with its own number, holding the amount from your current account there. Move Money, cash and payments can’t reach it.',
      'An end you choose is kept, and the panel says what it will do.',
      'Break It Early: it closes now, and the deposit with its interest, less the penalty and any tax, goes into your primary current account. A penalty larger than the interest comes out of the deposit.',
      'Take The Interest So Far: what it has earned, less any tax, goes into your primary current account, and the deposit keeps earning to its end.',
    ],
    later: [
      'The bank writes to What Needs You a month before the end, or two weeks before its last day to change the end where that comes earlier.',
      `On the end date it’s renewed, its interest added, for the same term at the bank’s rate on the day, with any days’ grace to take it whole (Chase’s ${CHASE_LIFE.graceDays}); or moved into savings at the bank, opened for it if you have none there; or paid into your current account at that bank.`,
      'With notice given to close early, it closes when the notice runs out, at the penalty then.',
    ],
    interpret: [
      '“Broken now it costs …” is today’s penalty. “Broken now it comes out whole” means a grace window after renewal or a cooling-off period is running, or that the bank caps its penalty at the interest earned and there’s none yet.',
      '“Too near its end to change: the bank needs … days’ notice.” means the end stands as shown.',
      '“Renewed: until … it can be taken whole.” is the grace window after a renewal.',
      'A penalty followed by “SLATE’s estimate of the bank’s penalty” means the interest so far, used where the bank words its penalty another way.',
    ],
    unavailable: [
      '“… publishes no term deposit rate SLATE has.”',
      '“A term deposit at … is funded from your current account there: open one first.”',
      '“It takes … or more.” and “… holds ….”',
      '“… doesn’t let a term deposit end that way.” and “… needs … days’ notice before the end to change it.”',
      '“… doesn’t let a term deposit be broken before its end.” and “It closes on …, on the notice given.”',
      '“… pays a term deposit’s interest at its end.” and “It hasn’t earned anything to take yet.”',
      '“You need a current account for the money.”',
    ],
    mistakes: [
      'Putting away money you’ll need before the end: read the quote under Your Accounts Over Time first, and leave enough in the current account for the term.',
      `Letting it renew when you wanted it back: choose Pay It Out At The End before the bank’s notice runs out. Renewed anyway, it can still be taken whole in the grace days (Chase’s ${CHASE_LIFE.graceDays}).`,
      `Breaking it in its first week: Chase charges at least ${CHASE_LIFE.penaltyFirstWeekDays} days’ interest then, past its cap.`,
    ],
    related: ['bank.accounts', 'bank.upkeep', 'money.affairs'],
    connections: [
      { to: 'bank.accounts', kind: 'prerequisite', why: 'A term deposit is funded from your current account at the same bank.' },
      { to: 'money.affairs', kind: 'immediate', why: 'What it holds counts in your worth from the day it opens, though it can’t be spent.' },
      { to: 'day.needs', kind: 'scheduled', why: 'The bank’s letter before the end, and the renewal or payout on the day, come to What Needs You.' },
      { to: 'bank.upkeep', kind: 'optional', why: 'Where the country gives a cooling-off period, a new term deposit can be canceled in it with its money back whole.' },
    ],
    example: {
      setup: `A student at Chase puts ${usd(CD)} into the ${CHASE_TERM.called}, ${CD_MONTHS} months at ${pct(CHASE_TERM.rate)}.`,
      steps: ['Type 1000 and press Put It Away.', 'Sixty days later, read the quote under Your Accounts Over Time.', 'Press Break It Early.'],
      result: `After 60 days it has earned ${usd(CD_EARNED_60)}. A ${CD_MONTHS}-month term’s penalty is ${CD_PENALTY_DAYS} days’ interest, ${usd(CD_PENALTY)}, capped at what it has earned, so the penalty is the ${usd(CD_EARNED_60)} and ${usd(CD)} goes back to the current account. Left to its end it would have earned about ${usd(CD_FULL)}, and then it ${END_WORDS[CHASE_LIFE.atEnd ?? 'paid_out']}.`,
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
    available: `From the guide’s chapter “${chapter('bank.set_alerts')}”.`,
    short: `Accounts change over time, and the bank tells you things. An account left untouched goes inactive, then dormant and blocked, and after the country’s years its money goes to the state, to be claimed back. Where the country gives a cooling-off period, a new savings account, term deposit or card can be canceled in it. Alerts tell you when an account runs low, a large payment goes out, a statement is ready, or an account is short for a payment due.`,
    steps: [
      'On Accounts, find Your Accounts Over Time. It shows only when it has something to show: a term deposit, round-ups your bank offers, an idle account, something new enough to cancel, money to claim back, or savings withdrawal fees.',
      'A dormant account shows Reactivate, something new enough shows Cancel It, and money handed to the state shows Claim It Back.',
      'When the bank writes that it’s about to hand an account to the state, What Needs You offers Keep The Account.',
      'On Statements, under Alerts, type Any Current Account Under and A Payment Over (blank turns one off) and press Save Alerts. Statement Ready and Short For A Payment turn On or Off with a press.',
    ],
    needs: [
      `Cancel It: a country with a cooling-off period, ${UNCLAIMED.CA?.coolingOffDays} days in Canada, Britain, Ireland, Iceland, Korea, France, Germany and Spain and ${UNCLAIMED.MX?.coolingOffDays} in Mexico. The US, Japan, Australia and New Zealand have none, and Britain leaves out fixed-rate deposits.`,
      'Claim It Back: money of yours handed over as unclaimed, and a current account to take it.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None' },
      { label: 'An Idle Account', value: 'Some banks charge a yearly fee for an account left untouched, said under Other Charges' },
    ],
    reads: [
      { label: 'Idle', value: 'Months since you last moved money in or out yourself; interest, the bank’s fees and a tax refund don’t count' },
      { label: 'Chase’s Months', value: `Inactive after ${CHASE_LIFE.inactiveMonths} months untouched, dormant after ${CHASE_LIFE.dormantMonths}` },
      { label: 'Unclaimed', value: `In the US, ${US_IDLE.years} years untouched, then the state’s unclaimed-property office` },
      { label: 'The Bank’s Letter', value: `On the first of a month within the ${ESCHEAT_NOTICE_DAYS} days before it hands the money over`, estimate: true },
      { label: 'Low Balance', value: 'Each current account’s balance at the day’s end, told once until it’s back above the line' },
      { label: 'Short For A Payment', value: `Each standing order, payment set for a date, card autopay and loan payment due in the next ${LOOKAHEAD_DAYS} days, against what its account holds`, estimate: true },
      { label: 'A Payment Over', value: 'Every payment out of a current account, savings or a card at or over the line, moves between your own accounts left out' },
    ],
    now: [
      'Reactivate: the account is unblocked at once, and its idle months count again from today.',
      'Cancel It: a savings account or term deposit closes with its money back whole into your primary account, without interest or penalty; a card closes to anything new, with what was spent on it still to repay.',
      'Claim It Back: all of it comes back into your primary current account.',
      'Save Alerts: the lines are kept, and checked from the day’s end on.',
    ],
    later: [
      'Idle: on the first of each month the bank looks again. A dormant account refuses Move Money, into it or out of it, and a dormant primary account refuses cash taken out, until it’s reactivated; at Bank of America and Capital One it stops earning interest.',
      `Unclaimed: on the first of a month within the ${ESCHEAT_NOTICE_DAYS} days before the country’s years run out, the bank writes and What Needs You asks. Left past them, on the first of the month the balance goes to the state and the account closes, with the standing orders into it. Your primary account is never handed over.`,
      'Alerts arrive in What Needs You at the day’s end.',
    ],
    interpret: [
      '“… is inactive, untouched for months” is a warning: using it wakes it.',
      '“… is dormant, blocked until it’s used again.” Reactivate unblocks it.',
      '“… went to … after years untouched.” says where the money is; Claim It Back brings it home.',
      'Short For A Payment names the account, the payment, its date and what the account holds, with what to do.',
    ],
    unavailable: [
      '“That account isn’t dormant.”',
      '“Its cooling-off period has passed, or there isn’t one here for it.”',
      '“Your primary current account can’t be canceled. Make another primary first.”',
      '“No money of yours is held as unclaimed.”',
      '“Set the low balance as an amount, or turn it off.”',
    ],
    mistakes: [
      'Leaving savings untouched for years: interest and fees don’t count as using it. A small move in or out keeps it awake.',
      'Turning Short For A Payment off: it’s the one alert on from the start, and the only warning before an autopay bounces.',
      'Setting A Payment Over too high: a stranger’s charge under it is found only on the statement.',
    ],
    related: ['bank.accounts', 'bank.term', 'bank.round-ups', 'bank.card-security', 'bank.payments'],
    connections: [
      { to: 'bank.card-security', kind: 'immediate', why: `A Payment Over set at or under a stranger’s charge tells you the day it happens, and you’ve learned of it then: in the US, a debit card charge reported within ${clockOf(DEBIT_PROMPT, 'of')} leaves you at most ${usd(DEBIT_PROMPT.max ?? 0)}.` },
      { to: 'bank.payments', kind: 'optional', why: `Short For A Payment watches each standing order and payment set for a date, ${LOOKAHEAD_DAYS} days ahead.` },
      { to: 'bank.card', kind: 'optional', why: 'Short For A Payment watches each card’s autopay against the account it pays from.' },
      { to: 'day.needs', kind: 'scheduled', why: 'Alerts, the dormancy notice and the bank’s letter before it hands money over come to What Needs You.' },
      { to: 'bank.term', kind: 'optional', why: 'A term deposit’s end and its early break are run from the same panel.' },
      { to: 'bank.round-ups', kind: 'optional', why: 'Round-ups are set on the same panel, where your bank offers them.' },
    ],
    example: {
      setup: `A life with Modest means leaves ${usd(MODEST.savings)} in ${SAVINGS.name} and never touches it.`,
      steps: [
        `At ${CHASE_LIFE.inactiveMonths} months, Your Accounts Over Time says it’s inactive.`,
        `At ${CHASE_LIFE.dormantMonths}, Chase makes it dormant, with Reactivate beside it.`,
        `On the first of a month within ${ESCHEAT_NOTICE_DAYS} days of ${US_IDLE.years} years, What Needs You asks, with Keep The Account.`,
      ],
      result: `Keep The Account or Reactivate counts as using it, and its months start again. Ignored, on the first of the month after ${US_IDLE.years} years its ${usd(MODEST.savings)} and the interest it built go to the state’s unclaimed-property office and the account closes; Claim It Back puts it all into your primary account.`,
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
    available: `From the guide’s chapter “${chapter('bank.set_round_ups')}”, at a bank that offers them: ${ROUND_ALL.length} of SLATE’s banks.`,
    short: `Round-ups move money from your current account into savings at the same bank as you spend, each bank its own way: the change to the next unit you choose, times a multiplier at NatWest, a set amount a purchase (Wells Fargo’s ${usd(WF_FLAT)}, TD’s from ${roundUpMoney('ca-td', TD_RANGE.min)} to ${roundUpMoney('ca-td', TD_RANGE.max)}), or at KakaoBank the remainder of the day’s balance. Each moves on its bank’s day, and never into an overdraft. A choice the bank leaves to you has to be made before it starts: nothing is filled in.`,
    steps: [
      'On Accounts, under Your Accounts Over Time, find Round-Ups: what your bank’s feature does, and its choices.',
      'Make the choices it asks for: How It Counts, Round Up To, Multiplier, Each Purchase, Amount, How Often or Minimum Balance, whichever your bank has.',
      'Press Round-Ups: Off to turn them on. Changing a choice while they’re on shows Save The Choices.',
      'Pay for the day by debit card (How You Pay). The panel shows what’s counted and not yet moved, and what came of the last transfer.',
    ],
    needs: [
      `A bank that offers them at your primary current account: ${andList(ROUND_ALL)}. Chase, Capital One and the rest don’t.`,
      'Easy-access savings at the same bank, where they go.',
      'The choices your bank leaves to you, made: where it states no default, SLATE fills none in.',
      'Purchases on the debit card: the day’s food is SLATE’s one purchase. Citi, BBVA México and Santander México count their own credit card’s purchases too.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None: they move your own money into your savings' },
    ],
    reads: [
      { label: 'A Purchase’s Round-Up', value: `The change to the next multiple of the unit you chose: a purchase already at one moves nothing, except at BBVA México, where it moves a whole unit. NatWest multiplies the change by the 1 to ${NATWEST_MOST} you pick. A set amount moves the same whatever the purchase. Bankinter moves the change to the next euro and the rest of the €1 or €2 you choose` },
      { label: 'When It Moves', value: `At the day’s start, the day before’s: every day at most banks; at a business day’s end at ${andList(roundBanks((r) => r.when === 'business'))}; at the next business day’s start at ${andList(roundBanks((r) => r.when === 'next-business'))}; overnight into Saturday at ${andList(roundBanks((r) => r.when === 'friday-night'))}; on the 1st and the 16th at ${andList(roundBanks((r) => r.when === 'half-month'))}; Monday to Friday at ${andList(roundBanks((r) => r.when === 'weekdays'))}; as often as you choose at ${andList(roundBanks((r) => Boolean(r.every)))}` },
      { label: 'The 1st And The 16th', value: 'LCL’s terms say twice a month without the days', estimate: true },
      { label: 'When It’s Short', value: `All or nothing, never into an overdraft: what was counted isn’t moved, stays in your current account, and isn’t counted again. At Citi a transfer waits for your minimum balance, at least ${usd((CITI.minimumAtLeast ?? 0) * 100)}, two more days, and after three below it Citi turns Spend & Save off; at most ${usd((CITI.perTransfer ?? 0) * 100)} moves a time, the rest carried. ING counts nothing while the account holds under ${ING_FLOOR} €` },
      { label: 'Where A Bank Is Silent', value: 'Each bank’s panel lists what its sources leave open and what SLATE does there, and what the bank does that SLATE doesn’t, with the source and the day it was read', estimate: true },
    ],
    now: [
      'Round-Ups: On, with the choices made: each purchase from then on counts toward savings, to move on the bank’s day.',
      'Off: nothing counts, and what was counted and hadn’t moved is dropped. It was never taken from your current account.',
    ],
    later: [
      'On the bank’s day, what was counted moves from your current account to easy-access savings at the same bank, one transfer, Round-ups in your history.',
      'A day the account can’t cover it, nothing moves, and the panel says what didn’t and why.',
      'Making another bank’s account your primary one, or closing the savings it goes into, turns them off.',
    ],
    interpret: [
      '“Counted, not yet moved” is waiting for the bank’s day; at Wells Fargo and Lloyds, what’s “to move at the next business day’s start” has been counted already.',
      '“Last moved: … into savings” is the last transfer. “Not moved: …, because …” says why one didn’t happen.',
      '“Not counting: …” under Round-Ups: On names a choice still to make, as a save from before 2026-10-13 can have.',
    ],
    unavailable: [
      '“… doesn’t round purchases up into savings.”',
      '“Round-ups go into savings at …: open easy-access savings there first.”',
      '“Choose what to round up to: …” and the other choices, until they’re made.',
      '“Round-ups at … run from a … current account made your primary one.”',
    ],
    mistakes: [
      'Expecting a round-up on a whole purchase: most banks move nothing on one.',
      'Running the current account near zero: a day it can’t cover the round-ups, they don’t move, and they aren’t made up later.',
      'Switching your primary account to another bank and expecting them to follow: they’re set up at a bank, and stop there.',
    ],
    related: ['bank.upkeep', 'bank.accounts', 'bank.payments'],
    connections: [
      { to: 'bank.payments', kind: 'immediate', why: 'Only what the debit card pays rounds up: How You Pay sets whether the day goes on the debit card, the credit card or in cash.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Each transfer is a move from your current account into savings at the same bank, on the bank’s day.' },
      { to: 'bank.upkeep', kind: 'optional', why: 'Round-ups are set on Your Accounts Over Time, with the term deposits and idle accounts.' },
    ],
    example: {
      setup: `A life in London at NatWest, with savings there and money in the current account.`,
      steps: [
        'On Round-Ups, choose a Multiplier of ×3 and press Round-Ups: Off to turn them on.',
        `A purchase of ${gbp(230)} is paid by debit card.`,
        'The day ends.',
      ],
      result: `The purchase counts ${gbp(210)}, its change of ${gbp(70)} three times, as NatWest’s own example has it. At the next day’s start ${gbp(210)} moves from the current account to savings in one transfer, and the panel says “Last moved: ${gbp(210)} into savings”.`,
    },
  },
  {
    id: 'bank.payments',
    title: 'How You Pay',
    goal: 'money',
    covers: ['bank.set_payments', 'bank.add_standing_order', 'bank.cancel_standing_order', 'bank.schedule_payment', 'bank.cancel_scheduled', 'bank.set_order_source', 'bank.redirect_deposits'],
    synonyms: ['debit or credit', 'pay in cash', 'standing order', 'scheduled payment', 'overdraft protection', 'link savings', 'direct deposit', 'where wages are paid', 'pay from there'],
    questions: ['How do I pay for groceries by card?', 'How do I save a set amount each month?', 'How do I have my wages paid into another account?', 'Why didn’t my standing order go?', 'Can savings cover my current account?'],
    where: { route: BANK, tab: PAYMENTS, label: 'Your Bank, Payments And Cash, How You Pay' },
    available: `From the guide’s chapter “${chapter('bank.set_payments')}”.`,
    short: 'How You Pay sets how the day’s groceries and meals are paid: on the debit card, on the credit card, or in cash first. It links savings to cover each current account a payment comes from, sets standing orders into savings on a day each month, and sets one-off payments between your accounts for a date. On the Accounts tab, Your Banks says where wages are paid, and What Pays From Where moves the account each standing order and card autopay pays from.',
    steps: [
      'On Payments And Cash, choose The Day’s Spending: In Cash, Then The Debit Card; On The Credit Card; or On The Debit Card. It’s kept as you choose.',
      'Read the line above Savings Covers The Current Account: which savings covers which current account, and what each of those accounts pays. Press it to turn it On or Off.',
      'Under Standing Orders, type Each Month and On The Day (1 to 31), choose Into where you have two savings accounts, and press Set Up A Standing Order Into Savings. Cancel stops one.',
      'Under Payments Set For A Date, choose From and To, type Amount and On, and press Set The Payment. Cancel calls one off.',
      'On Accounts, press Have Wages Paid Here on the account wages should go to. With two current accounts, What Pays From Where moves a standing order: choose the account and press Pay From There.',
    ],
    needs: [
      'Savings Covers The Current Account: easy-access savings at the bank of a current account a payment comes from (the primary, an account a card’s autopay is set on, or a loan’s repayment account). It shows then, and while it’s On.',
      'Standing orders: an easy-access savings account at any bank; they show once you hold one.',
      'Two current or easy-access savings accounts, for a payment set for a date; two current accounts, for What Pays From Where.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None to set; a payment out of savings costs its withdrawal fee past the bank’s free ones' },
      { label: 'Wages To A New Account', value: `Yale’s payroll pays there from ${PAYER_LEAD['yale-payroll']} days on, about one of its weekly pay cycles` },
      { label: 'Other Payers', value: `From ${DEPOSIT_LEAD.days} days on, one pay cycle of two weeks`, estimate: true },
    ],
    reads: [
      { label: 'The Day’s Spending', value: 'Read when the day’s groceries are bought each morning, and when you pay for Eat A Meal or have one delivered' },
      { label: 'The Order Of Paying', value: 'Cash first where you chose it, or the credit card first where you chose that; then the primary account, savings at its bank where linked, its overdraft where the bank pays one, and the everyday card for the rest' },
      { label: 'Savings Covers The Current Account', value: 'Easy-access savings at the bank of the current account a payment comes from: the primary’s for the day’s spending, the account a card’s autopay is set on for that autopay, and a loan’s repayment account for the loan' },
      { label: 'A Standing Order', value: 'The whole amount in the account it pays from, at 9 AM on its day' },
      { label: 'A Payment Set For A Date', value: 'The amount in the From account at 9 AM that day; from savings, with its withdrawal fee and any monthly allowance' },
    ],
    now: [
      'The Day’s Spending and the savings link are kept at once, and read from the next payment.',
      'A standing order is set for its next date at 9 AM; a payment set for a date waits on the calendar.',
      'Cancel takes either off the calendar.',
      'Pay From There: the standing order pays from that account from its next date.',
      `Have Wages Paid Here: payers are asked to pay there. Yale’s payroll does from ${PAYER_LEAD['yale-payroll']} days on and other payers from ${DEPOSIT_LEAD.days}; a payment before then goes where it always did.`,
    ],
    later: [
      'On a standing order’s day, the whole amount moves if the account it pays from holds it. If it’s short, if either account is dormant or closing, if the one it pays from is blocked by a switch’s debt, or if it pays into a term deposit, where a save holds such an order from before, none of it goes: What Needs You says “A Standing Order Didn’t Go” and why, and it tries again next month.',
      'An order on the 29th, 30th or 31st goes on the last day of a shorter month.',
      'On a payment’s date it moves if the From account holds it, from savings with its withdrawal fee and any monthly allowance. If it’s short, if either account is closed, dormant or closing, if the From account is blocked by a switch’s debt, or if either is a term deposit, where a save holds such a payment from before, it doesn’t go, and “A Scheduled Payment Didn’t Go” says why.',
      'Between two of your banks, a standing order or a payment set for a date leaves on its day and lands as Move Money’s would, in Money In Transit until then. Sent from Citi, it’s held to Citi’s daily and monthly limits, and one they refuse doesn’t go.',
      'With savings linked, a payment a current account can’t make takes the rest from easy-access savings at that account’s bank, as far as savings lets out, with any withdrawal fee: the primary’s bank for the day’s spending, the bank of the account a card’s autopay is set on for that autopay, and a loan’s repayment account’s bank for the loan.',
    ],
    interpret: [
      'In Cash, Then The Debit Card pays from cash in hand first, and the debit card for what cash can’t.',
      'On The Credit Card puts the day on the everyday card while it has room, then the debit card.',
      'Make Primary moves the day’s spending, and the savings the link draws on for it, to the new primary’s bank. A card’s autopay and a loan’s repayment stay on the accounts they were set on, and the link keeps drawing on savings at those accounts’ banks for them.',
      'The line above the link names, for each current account a payment comes from, the savings that covers it and what it pays: “… covers …, which pays ….” One that says “… has no easy-access savings at … to draw on.” isn’t covered.',
      '“There’s no easy-access savings at … for it to draw on, so On covers nothing until there is.” means no current account a payment comes from has savings at its bank.',
    ],
    unavailable: [
      '“Everyday spending goes in cash, on the debit card or on the credit card.”',
      '“There’s no savings account at … to cover the current account.”, or with more than one paying account, “… to cover the current accounts your payments come from.”',
      '“A standing order of your own goes into one of your savings accounts.” and “… is a term deposit, locked until its end: a standing order goes into easy-access savings.”',
      '“Say how much each month.” and “Pick a day of the month, 1 to 31.”',
      '“There’s no standing order by that name.” and “There’s no payment waiting by that name.”',
      '“A scheduled payment goes between two of your own accounts.”, “… is a term deposit, locked until its end: a payment set for a date goes between your current and easy-access savings accounts.”, “Say how much.” and “Pick a day ahead.”',
      '“A standing order pays from an open current account of yours.” and “It pays into that account.”',
      '“Wages are paid into an open current or savings account of yours.” and “… is closing.”',
    ],
    mistakes: [
      'On The Credit Card with autopay on The Minimum: the day’s groceries carry at the card’s rate once its introductory months are over.',
      'In Cash with nothing in hand: the debit card pays, so take cash out first under Cash.',
      'On The Debit Card or On The Credit Card when the bank and the card can’t pay: cash in hand isn’t spent unless the debit card is locked or stopped, so the groceries or a meal they can’t pay for goes unbought. Choose In Cash, Then The Debit Card to spend it.',
      'A standing order bigger than the account holds on its day: none of it goes. Move money in first, or lower it.',
      'Pressing Make Primary to move your wages: Have Wages Paid Here moves them.',
    ],
    related: ['bank.cash', 'bank.card', 'bank.accounts', 'bank.borrowing', 'bank.upkeep'],
    connections: [
      { to: 'bank.cash', kind: 'prerequisite', why: 'Paying the day in cash first needs cash in hand, taken out under Cash on the same tab.' },
      { to: 'bank.card', kind: 'immediate', why: 'On The Credit Card puts each day’s groceries on the everyday card, and its statement and your record move with them.' },
      { to: 'bank.borrowing', kind: 'immediate', why: 'A debit purchase the account can’t cover runs into the overdraft only where the bank allows it; Chase asks you to opt in.' },
      { to: 'body.look-after', kind: 'immediate', why: 'A meal you pay for or have delivered is paid the way The Day’s Spending says.' },
      { to: 'school.shifts', kind: 'scheduled', why: `Have Wages Paid Here reaches Yale’s payroll after ${PAYER_LEAD['yale-payroll']} days, and your shift pay lands there from then.` },
      { to: 'bank.upkeep', kind: 'optional', why: `Short For A Payment warns ${LOOKAHEAD_DAYS} days ahead when an account can’t cover a standing order or a payment set for a date.` },
    ],
    example: {
      setup: `A student at Chase sets a ${usd(50_00)} standing order into ${SAVINGS.name} on the 1st, and ${CHECKING.name} holds ${usd(30_00)} that morning.`,
      steps: ['Under Standing Orders, type 50 and 1, and press Set Up A Standing Order Into Savings.', 'Let the 1st come with the account short.'],
      result: `At 9 AM on the 1st the order doesn’t go: ${usd(30_00)} is short of ${usd(50_00)}, and an order goes whole or not at all. What Needs You says “A Standing Order Didn’t Go”, and it’s set again for the 1st of next month. Short For A Payment would have said so up to ${LOOKAHEAD_DAYS} days before.`,
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
    available: `From the guide’s chapter “${chapter('cash.withdraw')}”.`,
    short: 'Cash takes money out of your primary current account at your bank’s ATM, another bank’s, the counter, or in Britain the Post Office where your bank allows it, or as a cash advance on the card. Each costs the bank’s own fee, shown before you press, and the machines let out no more in a day than the bank allows. Cash in hand pays the day first when How You Pay says so, and Pay It In puts it back into an account.',
    steps: [
      'On Payments And Cash, find Cash. Its subtitle is what you have in hand.',
      'Type Take Out, choose From (Your Bank’s ATM, Another Bank’s ATM, The Counter, The Post Office where offered, or A Cash Advance On The Card), read the line under it, and press Take It Out.',
      'With cash in hand, type Pay In, choose Into and At, and press Pay It In.',
    ],
    needs: [
      'A current account. A machine needs its debit card here and unlocked; the counter pays out without it.',
      'The amount and its fees in the primary account, inside the bank’s daily limit for machines.',
      'For a cash advance: room on the everyday card for it and its fee, inside any cash limit the card sets.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Chase’s ATMs', value: `${Fee(CHASE_CASH.own)} at its own; ${fee(CHASE_CASH.other)} at another bank’s, and ${usd(OWNER)} more to the machine’s owner, the US average` },
      { label: 'Chase’s Counter', value: Fee(CHASE_CASH.teller) },
      { label: 'Chase’s Machines In A Day', value: `${usd(CHASE_CASH.daily ?? 0)} at most` },
      { label: 'A Chase Cash Advance', value: `${pct(CHASE_CARD.cashFeeShare ?? 0)} or ${usd(CHASE_CARD.cashFeeMin ?? 0)}, whichever is more, at ${pct(CHASE_CARD.cashApr ?? 0)} a year from the day it’s taken` },
      { label: 'Paying In', value: 'Free' },
    ],
    reads: [
      { label: 'The Bank’s Fees', value: 'Its own ATM, another bank’s, the counter and the Post Office, each its own' },
      { label: 'The Day’s Machine Total', value: 'What has come out of ATMs and the Post Office today, against the daily limit' },
      { label: 'The Machine’s Owner', value: `The US average of ${usd(OWNER)} and Australia’s of ${formatMoney(OWNER_SURCHARGE.AU?.fee ?? 0, 'AUD')} are charged; elsewhere a fee may come on top that SLATE doesn’t know` },
      { label: 'The Card’s Cash Terms', value: 'Its cash fee, its cash rate and any cash limit' },
    ],
    now: [
      'Take It Out: the amount moves from the primary account into Cash In Hand, with the bank’s fee and any owner’s fee as lines of their own.',
      'A cash advance: the amount goes on the everyday card with its fee, and counts as cash owed.',
      'Pay It In: the amount moves from Cash In Hand into the account you name.',
    ],
    later: [
      'A cash advance draws the card’s cash rate every day from the day it’s taken, with no grace period, charged at each statement.',
      'A payment to the card goes to its dearest balance first. On a US card the minimum goes to the cheapest first, and only what you pay above it reaches the dearest.',
      'Cash in hand pays for the day first where The Day’s Spending is In Cash, Then The Debit Card.',
    ],
    interpret: [
      '“Free” under Take Out means no fee. A line naming the machine’s owner adds what it charges, or says a fee may come that SLATE can’t know.',
      'A cash advance line adds the rate it draws from today.',
      'Cash in hand counts in your worth with what’s in the bank.',
    ],
    unavailable: [
      '“You need a bank account to take cash out of.”',
      '“… is dormant; use Reactivate first.”',
      '“Your debit card hasn’t arrived yet; the counter can still pay out.”, “Your debit card is stopped; the counter can still pay out.” or “Your debit card is locked.”',
      '“… customers can’t use the Post Office for cash.”',
      '“… lets … out of machines in a day, and … has come out today.”',
      '“… holds …”: less than the amount and its fees.',
      'On the card: “The card has … free, and this takes … with its fee.” or “The card lets … out as cash, and … is out already.”',
      'Paying in: “You have … in cash.”, “Cash goes into your current account or savings.” or “… customers can’t pay cash in at the Post Office.”',
    ],
    mistakes: [
      `Taking cash at another bank’s machine in the US: at Chase that’s ${fee(CHASE_CASH.other)} and about ${usd(OWNER)} more, ${usd((CHASE_CASH.other ?? 0) + OWNER)} for one withdrawal, where Chase’s own machine is ${fee(CHASE_CASH.own)}.`,
      `A cash advance to pay a bill: on the ${CHASE_CARD.name} it costs at least ${usd(CHASE_CARD.cashFeeMin ?? 0)} and draws ${pct(CHASE_CARD.cashApr ?? 0)} from the first day.`,
    ],
    related: ['bank.payments', 'bank.card', 'bank.card-security'],
    connections: [
      { to: 'bank.payments', kind: 'optional', why: 'In Cash, Then The Debit Card spends cash in hand on the day first.' },
      { to: 'bank.card', kind: 'immediate', why: 'A cash advance goes on the everyday card at once, and draws its cash rate from the day it’s taken.' },
      { to: 'bank.card-security', kind: 'prerequisite', why: 'A machine needs the debit card here and unlocked; a locked, stopped or new card leaves only the counter.' },
      { to: 'money.affairs', kind: 'immediate', why: 'Cash in hand counts in your worth, with what’s in the bank.' },
    ],
    example: {
      setup: `A student at Chase needs ${usd(60_00)} in cash, and the nearest machine is another bank’s.`,
      steps: ['Type 60 in Take Out and choose Another Bank’s ATM.', 'Read the line, then switch From to Your Bank’s ATM.', 'Press Take It Out.'],
      result: `The other bank’s machine would cost ${fee(CHASE_CASH.other)} to Chase and ${usd(OWNER)} to its owner, ${usd(60_00 + (CHASE_CASH.other ?? 0) + OWNER)} out of checking in all. Chase’s own is ${fee(CHASE_CASH.own)}: ${usd(60_00)} out, ${usd(60_00)} in hand. A cash advance on the ${CHASE_CARD.name} would cost ${usd(ADVANCE_FEE)} at once and ${pct(CHASE_CARD.cashApr ?? 0)} a year from today.`,
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
    available: `From the guide’s chapter “${chapter('card.apply')}”.`,
    short: 'A credit card is a bank’s own, on its own terms: a rate set by your record when it opens and held there, any yearly fee, the minimum, the late fee and the days to the due date. A statement comes on its statement day, the 20th unless you move it, and the payment is due the bank’s days later. Autopay asks your account for the whole statement or only the minimum, and a statement paid in full draws no interest. You can apply at any bank where you live, one card from each.',
    steps: [
      'On the Cards tab, each card has a panel: Owed, Left To Spend of its limit, and its Rate, then its terms line by line.',
      'Press Pay Card In Full to pay it now from your primary account and its savings; it reads Pay What You Can when they hold less than is owed.',
      'Press Autopay to switch between The Whole Statement and The Minimum. With two current accounts, What Pays From Where on the Accounts tab sets the account it pays from: choose one and press Pay From There.',
      'Choose a Statement Day and press Move It; type A Different Limit and press Ask For It.',
      'Press Raise My Limit Unasked, or Going Over The Limit on a US card, to switch it. Make It The Everyday Card, Close The Card, Send The Credit To My Account and Ask For Help With Payments show when they apply.',
      'Under Another Card (Credit Card while you hold none), choose a Bank and press Apply For Its Card.',
    ],
    needs: [
      'A credit record: every life starts with one.',
      'To apply: a bank in the country you bank in that issues a card, one whose card you don’t hold, and no other card on its way.',
      'Going Over The Limit is a US card’s choice; Ask For Help With Payments is for a balance your accounts can’t clear today.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Applying', value: `${INQUIRY} points off your record, approved or not`, estimate: true },
      { label: `The ${CHASE_CARD.name}`, value: `${pct(CHASE_CARD.aprFrom ?? 0)} to ${pct(CHASE_CARD.aprTo ?? 0)} by your record, ${CHASE_CARD.annualFee ? `${usd(CHASE_CARD.annualFee)} a year` : 'no yearly fee'}; the minimum ${pct(CHASE_CARD.minimumShare ?? 0)} of the statement plus the month’s interest, or ${usd(CHASE_CARD.minimumFloor ?? 0)} if that’s more, with any plan’s month on top, and never more than the statement; due ${CHASE_CARD.graceDays} days after the statement` },
      { label: 'A US Late Fee', value: `The card’s own, held to ${usd(US_SAFE_HARBOR.first)} the first time and ${usd(US_SAFE_HARBOR.repeat)} again within ${US_SAFE_HARBOR.withinPeriods} billing periods, never more than the minimum: at Chase ${usd(CHASE_LATE_FIRST)}, then ${usd(CHASE_LATE_AGAIN)}` },
      { label: 'Interest', value: 'Built each day on what’s owed, the day’s interest included, once a statement isn’t paid in full' },
    ],
    reads: [
      { label: 'Your Record', value: `Kept on the US scale, 300 to 850; a bank approves a card from ${APPROVE_FROM}`, estimate: true },
      { label: 'The Opening Limit', value: '$5,000 for a record of 740 or more, $2,500 from 670, and $1,000 below that, in your money', estimate: true },
      { label: 'Means To Repay', value: 'Anything in your current and savings accounts at every bank; in the US under 21, money of your own' },
      { label: 'A Month On The Record', value: '3 points for a month paid as agreed, shared among your cards; 50 off for a late payment once it’s reported; 2 a month for each tenth of all your limits used past 30%', estimate: true },
      { label: 'A Limit Review', value: 'Every six months: a fifth more for a record of 700 or more with nothing late in a year, unless you said never to raise it unasked', estimate: true },
      { label: 'With No Card Open', value: `${NO_CARD.aging} points a month back, on the 1st, while no payment has been late in a year and no debt is in collections, up to ${NO_CARD.ceiling}`, estimate: true },
      { label: 'A Mark’s Years', value: `A mark leaves the record after ${MARK_YEARS.us} years in the US, ${MARK_YEARS.uk} in Britain, ${MARK_YEARS.ca} in Canada and ${MARK_YEARS.ie} in Ireland, and gives back ${MARK_GONE_GIVES} points` },
    ],
    now: [
      `Apply: ${INQUIRY} points off the record at once. Approved, What Needs You gives the limit and the card arrives in a week; declined, it says why.`,
      'Pay Card In Full: from your primary account, then savings at its bank, as much as is owed or as you have. Paid from another bank, some banks hold the room it frees for days while it clears.',
      'Autopay, Statement Day, Raise My Limit Unasked and Going Over The Limit are kept at once.',
      'Ask For It: a lower limit is granted at once, never under what’s owed; a higher one for a record of 700 or more, nothing late in a year, a card not suspended and money in the bank, up to a fifth more than now.',
      'Make It The Everyday Card: the day’s spending goes on it from now.',
      'Close The Card: nothing new goes on it, and with nothing owed it closes at once.',
      'Send The Credit To My Account: a credit balance moves to your primary account.',
      'Ask For Help With Payments: the interest stops, a payment that clears it in 48 months is set, and the card can’t be used until it’s paid.',
    ],
    later: [
      'On its statement day at 9 AM: interest charged where the last statement wasn’t paid in full, any yearly fee in the month the card opened, and the statement written. With nothing owed, the month is reported paid as agreed.',
      'On the due date at noon, autopay asks the account it’s set on for its amount, with easy-access savings at that account’s bank where savings is linked. Short of all of it there, it comes back unpaid, and unless the minimum was paid by hand, the payment is late; a returned payment fee is charged, except on a US card when the late fee covers the same miss.',
      'Less than the minimum paid: the late fee. Outside the US it goes on your record at once and the limit is cut to 70%, never under what’s owed; in the US, at the next due date still short, thirty days past due.',
      'Two due dates missed in a row: the card is suspended until a payment is on time. Five: a default notice. Six: it’s charged off to collections and closed, and 100 points come off your record.',
      'On a US card with a penalty rate, sixty days late brings 45 days’ notice and then that rate, until six payments in a row are on time; sixty days late also ends any introductory rate.',
      `A moved statement day: the next statement comes no sooner than ${MIN_CYCLE_DAYS} days after the last, and the day moves once a statement cycle, SLATE’s reading of the issuers’ limit: asked again before the next statement, Move It is refused.`,
      'Going Over The Limit allowed on a US card: spending can run a tenth past the limit, and a card with an over-limit fee charges it at a statement that finds the card over, three statements in a row at most.',
      'A credit balance left six months on a US card is sent back to your account.',
      'A card you closed with something owed closes at the first statement after it’s paid off.',
    ],
    interpret: [
      'Left To Spend is the limit less what’s owed and any payment held while it clears, with a tenth more on a US card allowed to go over the limit. While the card is locked, stopped, suspended or closing, there’s none.',
      '“A record today would get …” is what the bank would price a new card at for your record now; your card keeps the rate it opened at.',
      'A statement on the Statements tab gives the least to pay and, paying only the minimum and spending nothing more, how long it takes and what it costs in all, beside what clears it in three years.',
      'Terms marked as SLATE’s estimate are a typical US card’s, used where the bank’s weren’t found.',
      'The record’s own figure shows only when a life is made: a number in the US and Canada, a word elsewhere. In play you read it in what the banks do: approvals, limits, and the rate after “A record today would get”.',
    ],
    unavailable: [
      '“You have no credit record to apply with.”, “A card is already on its way.” or “You need a bank to apply to.”',
      '“A card is applied for in the country you bank in; … is elsewhere.”, “… doesn’t issue a credit card.” or “You hold …’s card already.”',
      `Declined in What Needs You: a record under ${APPROVE_FROM}, a debt in collections, nothing in your accounts to repay from, or in the US under 21 without money of your own.`,
      '“You don’t have a card.”, “You don’t owe anything on it.” or “There’s nothing in the bank to pay it with.”',
      '“… takes the whole statement from your account each month; the … can’t carry a balance.” on a charge card’s autopay.',
      '“Pick a day from the 1st to the 28th.”, “Say the limit you want.” or “Opting in to going over the limit is a US card’s choice.”',
      '“You’re on a plan already.”, “The card owes nothing.” or “You could pay it off today: a hardship plan is for when you can’t.”',
      '“It’s already being closed.”, “The card holds no credit to send back.” or “Autopay pays from an open current account of yours.”',
    ],
    mistakes: [
      'Autopay on The Minimum: the rest carries at the card’s rate, and each statement charges interest on it until one is paid in full.',
      `Leaving the account autopay pays from short on the due date, with no linked savings at its bank to make up the rest: the whole payment bounces, though part of it was there. Short For A Payment warns ${LOOKAHEAD_DAYS} days ahead.`,
      `Applying at bank after bank: each costs ${INQUIRY} points, yes or no.`,
      'Using more than 30% of all your limits: the record pays for every month it lasts. Paying it down before the due date lowers it.',
      'Closing your only card: with no card the record climbs only slowly, and stops at a ceiling.',
    ],
    related: ['bank.card-offers', 'bank.card-security', 'bank.payments', 'money.affairs'],
    connections: [
      { to: 'money.affairs', kind: 'immediate', why: 'What a card owes counts against your worth at once, and Owed shows its rate and Credit Used.' },
      { to: 'bank.payments', kind: 'optional', why: 'On The Credit Card in How You Pay puts each day’s groceries on the everyday card.' },
      { to: 'bank.card-offers', kind: 'optional', why: 'Its introductory rate, rewards, a money transfer and a plan are under The Card’s Offers on the same tab.' },
      { to: 'bank.card-security', kind: 'immediate', why: 'A card locked or reported has nothing Left To Spend until it’s unlocked or the new one arrives.' },
      { to: 'bank.borrowing', kind: 'evaluation', why: 'The record your card payments build is what a bank reads to arrange an overdraft or lend, and at what rate.' },
      { to: 'day.needs', kind: 'scheduled', why: 'A statement with a payment due, a late payment, a bounced autopay and a raised limit all come to What Needs You.' },
    ],
    example: {
      setup: `A student at Chase with a record of ${RECORD}, holding the ${CHASE_CARD.name}, applies for the ${WF_CARD.name}.`,
      steps: ['Under Another Card, choose Wells Fargo and press Apply For Its Card.', 'A week later it arrives; press Make It The Everyday Card on it.', `Its first statement asks for ${usd(WF_STATEMENT)}, with Autopay on The Whole Statement.`],
      result: `The record drops ${INQUIRY} points to ${AFTER_APPLYING}, still over the ${APPROVE_FROM} a bank approves at, and the card comes with a $2,500 limit at ${pct(WF_RATE)}, ${pct(WF_CARD.introApr ?? 0)} on purchases for its first ${WF_CARD.introMonths} months. The statement’s minimum is ${usd(WF_MINIMUM)}: ${pct(WF_CARD.minimumShare ?? 0)} of ${usd(WF_STATEMENT)} is ${usd(WF_SHARE)}, with no interest to add in the introductory months, and the card’s floor is ${usd(WF_CARD.minimumFloor ?? 0)}. It’s due ${WF_CARD.graceDays} days later, when autopay takes the whole ${usd(WF_STATEMENT)} and the month goes on the record as paid on time.`,
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
    available: `From the guide’s chapter “${chapter('card.plan')}”.`,
    short: `Some cards come with offers, shown under The Card’s Offers: an introductory rate on purchases for months from opening, rewards on what you buy, a money transfer that lends into your current account for a fee, and a plan that pays part of what purchases owe in equal months for a monthly fee in place of interest, the fee set when it’s made${PLAN_FREE_AT.length ? ` (none for its life on a plan made at ${andList(PLAN_FREE_AT)} while the card’s introductory rate runs)` : ''}. A balance from a card at another bank moves when you apply for the new card.`,
    steps: [
      'On the Cards tab, The Card’s Offers shows each card’s introductory rate and its end, each transfer and plan with what’s left, and the rewards waiting.',
      'Press Redeem Onto The Card to take your rewards off what the card owes.',
      'Where the card offers a money transfer, type A Money Transfer To Your Account and press Move It, its fee in its name.',
      `For a plan, type Into A Plan, choose Over (${orList(PLAN_MONTHS)} months, or the bank’s own lengths) and press Make The Plan.`,
      'To move a balance, apply under Another Card for another bank’s card, choose the card under Move A Balance From, and press Apply And Move The Balance. It moves when the new card arrives, and the old card takes nothing new meanwhile.',
    ],
    needs: [
      'A card whose terms carry the offer: the panel shows only what a card has.',
      'A money transfer: a card that offers one (NatWest’s, Santander Spain’s and Bankinter’s), a current account to receive it, and room on the card for it and its fee.',
      'A plan: what purchases owe, past cash advances, transfers and plans already made.',
      'A balance transfer: a card at another bank owing something, and a new card whose limit takes that balance with its fee.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: `The ${CHASE_CARD.name}’s Offers`, value: `${pct(CHASE_CARD.introApr ?? 0)} on purchases for its first ${CHASE_CARD.introMonths} months; a balance moved onto it ${pct(CHASE_CARD.transfer?.feeShare ?? 0)} or ${usd(CHASE_CARD.transfer?.feeMin ?? 0)}, at ${pct(CHASE_CARD.transfer?.introApr ?? 0)} for ${CHASE_CARD.transfer?.introMonths} months; ${PLAN_FREE_IN_INTRO.has(CHASE.id) ? `a plan made in its introductory months free for its life, and one made after ${pct(CHASE_CARD.planFeeShare ?? 0)} of it a month` : `a plan ${pct(CHASE_CARD.planFeeShare ?? 0)} of it a month`}; ${pct(CHASE_CARD.rewardsRate ?? 0)} back` },
      { label: 'A Money Transfer', value: 'The card’s fee as a share of it, then its transfer rate from the day it’s made' },
      { label: 'Rewards', value: 'Earned on purchases only; cash, transfers, fees and interest earn none' },
    ],
    reads: [
      { label: 'The Introductory Rate', value: 'Runs for the card’s months from the day it opened; on a US card a payment sixty days late ends it, and at Barclaycard one missed minimum does' },
      { label: 'A Payment’s Order', value: 'To the dearest balance first and a plan’s balance last; on a US card the minimum to the cheapest first' },
      { label: 'A Plan’s Fee', value: `Set when the plan is made, at the most the bank says it charges, and kept to its last month${PLAN_FREE_AT.length ? `; none on a plan made at ${andList(PLAN_FREE_AT)} while the card’s introductory rate runs, unless a payment sixty days late has ended it` : ''}` },
      { label: 'Bonus Categories', value: 'Groceries earn a grocery bonus, to its cap where it has one, on the cards of Bank of America, RBC, TD, Scotiabank, BMO, CIBC and Santander Mexico. The rest earns the card’s base rate, or the bank’s own rate for it where it sets one' },
    ],
    now: [
      'A money transfer: the amount goes into your primary current account, and the card owes it and its fee as a transfer of its own.',
      `Make The Plan: that much of what purchases owe becomes a plan, paid in equal months. A plan for a fee (Chase’s, Bank of America’s) adds the fee it was made with each month to its end and draws no interest${PLAN_FREE_AT.length ? `, and one made at ${andList(PLAN_FREE_AT)} in the card’s introductory months has none` : ''}; one the bank charges as interest (Bank of Ireland’s, Scotiabank’s, CaixaBank’s) draws the plan’s own rate in place of the card’s.`,
      'Redeem Onto The Card: the rewards come off what the card owes, as a credit.',
    ],
    later: [
      'At each statement: a transfer’s interest charged at its own rate, each plan’s month and the fee it was made with added to what’s due and to the minimum, and the cycle’s purchases counted for rewards.',
      'When the introductory months end, purchases draw the card’s own rate.',
      'A balance transfer, the day the new card arrives: the old card’s balance moves onto it with the transfer fee, at the transfer’s introductory rate for its months where it has one, and the old card closes.',
    ],
    interpret: [
      '“… on purchases until …, then ….” is the introductory rate and what follows it.',
      '“A plan: … left, … a month for … more months, and … a month in place of interest.” is each plan as it stands, with the fee it was made with; a free plan’s fee reads as zero.',
      '“One made while the introductory rate runs, until …, is free to its last month; one made after costs … of it a month” shows while a plan made today would be free.',
      '“… to redeem” is the rewards waiting; Redeem Onto The Card is grayed out while there are none.',
    ],
    unavailable: [
      '“The … doesn’t offer money transfers.”, “You need a current account for the money.” or “Say how much.”',
      '“The card has … free, and this takes … with its fee.”',
      `“The … has no plan SLATE has terms for.”, “A plan runs ${PLAN_MONTHS.join(', ')} months.”, “Purchases owe … that can go into a plan.” or “A plan takes … at least.”`,
      '“The card has no rewards to redeem.”',
      'Moving a balance: “A balance moves onto a card at another bank.” or “It would come with a … limit, and moving … takes … with its fee. Pay the old card down first.”',
    ],
    mistakes: [
      `Making a plan at Bank of America while purchases are still at 0%: its fee is charged from the first month, where interest would have cost you nothing.${PLAN_FREE_AT.length ? ` A plan made at ${andList(PLAN_FREE_AT)} in those months costs nothing.` : ''}`,
      'Taking a plan’s fee for interest: it’s charged on the whole plan amount every month, the last month as much as the first.',
      'A money transfer for spending: its fee comes off at once, and it draws its rate from the first day.',
    ],
    related: ['bank.card', 'money.affairs'],
    connections: [
      { to: 'bank.card', kind: 'prerequisite', why: 'Offers come with a card, and a balance from another bank’s card moves when you apply for the new one.' },
      { to: 'money.affairs', kind: 'immediate', why: 'A money transfer adds to what the card owes and to your current account at once.' },
    ],
    // Until 2026-10-12 the setup had nothing else on the card and said nothing of autopay. Played that way
    // (`tests/guide-examples-money.test.ts`), the plan didn't run its six statements: on The Whole Statement autopay paid
    // it off at its first due date, with one fee, and on The Minimum with nothing else owed, the minimum's floor, asked
    // beside the plan's month, paid the plan down, so it ended at the fifth statement with five fees. The result's
    // figures hold with the day's spending on the card and autopay on the minimum, and the setup says so now.
    example: {
      setup: `Purchases owe ${usd(PLAN)} on the ${CHASE_CARD.name}, past its introductory months, at ${pct(CHASE_RATE)}. The Day’s Spending is On The Credit Card, and Autopay is on The Minimum.`,
      steps: ['Type 600 in Into A Plan, choose 6 months, and press Make The Plan.'],
      result: `Each statement asks ${usd(PLAN / 6)} of the plan and its ${usd(PLAN_FEE)} fee, ${usd(PLAN / 6 + PLAN_FEE)} beside the rest’s minimum, for 6 statements: ${usd(PLAN_FEE * 6)} in fees. Paid down by the same ${usd(PLAN / 6)} a month at ${pct(CHASE_RATE)}, the interest would come to about ${usd(PLAN_INTEREST)}.`,
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
    available: `From the guide’s chapter “${chapter('card.lock')}”.`,
    short: 'Your Cards lists the debit card on each current account and every credit card, with its last four digits and expiry. Lock one and nothing new goes on it. Report one lost, stolen or damaged and it stops at once, with a new card and a new number in the bank’s days. A stranger may use a card, as often as the country’s official figures say it happens; reported in time, the law decides what you carry and the rest comes back. Where the bank does it, you can move your current account to a new number.',
    steps: [
      'On the Cards tab, find Your Cards: each card ending in its last four, and the day it expires.',
      'Press Lock It to stop new spending on a card, and Unlock It to undo it.',
      'Choose Why (Damaged, Lost or Stolen) and press Report It, or Report It, Rush The New One where the bank rushes one for a fee.',
      'A payment you didn’t make shows as its amount, the card and the date, asking “not yours?”: press Report It As Not Mine.',
      'Where your bank offers it, press Move My Account To A New Number.',
    ],
    needs: [
      'A card: a current account’s debit card, or a credit card.',
      'Locking needs a bank that locks in its app; one that locks only by phone refuses.',
      `Report It As Not Mine needs the payment found, by an alert or the statement, and in the US reported within ${US_LAW.claimDays} days of the statement it was on.`,
      'A new number needs a primary account at a bank that moves accounts: Bank of America, Citi and Capital One do, and Chase and Wells Fargo don’t.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'A New Chase Card', value: `${Fee(CHASE_SAFE.replaceFeeDebit)} for a debit card, in ${CHASE_SAFE.standardDays} business days, or ${usd(CHASE_SAFE.rushFee ?? 0)} more rushed, in ${CHASE_SAFE.rushDays}; Chase lists no fee for a credit card, so none is charged` },
      { label: 'Where A Bank Doesn’t Say', value: `A new card in ${ESTIMATE_DAYS} business days, ${ESTIMATE_RUSH_DAYS} rushed; a card lasts ${ESTIMATE_YEARS} years`, estimate: true },
      { label: 'Reported As Not Yours', value: 'The card it was used on is replaced free' },
    ],
    reads: [
      { label: 'How Often', value: `In the US, ${pct(US_LAW.fraudRate ?? 0)} a year, the share of people whose existing credit card was misused (BJS, 2021), drawn a day at a time on the everyday credit card or the primary account’s debit card` },
      { label: 'How Much', value: `From a quarter to seven quarters of the country’s average case, ${usd(US_LAW.avgLoss ?? 0)} in the US`, estimate: true },
      { label: 'Stopped By The Bank', value: 'The share its country’s banks stop; in the US, none is on record, so every charge goes through' },
      { label: 'What You Carry On A Debit Card', value: `In the US, at most ${usd(DEBIT_PROMPT.max ?? 0)} reported within ${clockOf(DEBIT_PROMPT, 'of')}, and ${usd(DEBIT_LATER.max ?? 0)} within ${clockOf(DEBIT_LATER, 'of')}. Past the ${US_LAW.claimDays} days from the statement it can’t be reported, and all of it is yours` },
      { label: 'A Debit Made With The Account Number', value: `In the US you carry none of it, reported within the ${US_LAW.claimDays} days from the statement` },
      { label: 'What You Carry On A Credit Card', value: `At most ${usd(US_LAW.creditMax ?? 0)} in the US` },
      { label: 'The Refund', value: `In ${US_LAW.refundDays} business days in the US` },
      { label: 'Where The Law Names No Days', value: `A refund in ${ESTIMATE_REFUND_DAYS} business days`, estimate: true },
      { label: 'When You Learn Of It', value: 'The day it happens if A Payment Over catches it, otherwise at the statement' },
    ],
    now: [
      'Lock It: nothing new goes on the card until you unlock it, a stranger’s use included. A locked debit card leaves the day’s groceries to the credit card or cash.',
      'Report It: the card stops at once, the bank’s fee is charged (a debit card’s from its account, a credit card’s onto the card), and the new card is on its way.',
      'Report It As Not Mine: what the law leaves you is worked out now, the rest is set to come back, and the card it was used on is stopped and replaced free.',
      'Move My Account To A New Number: the current account’s number changes at once, and its debit card is replaced.',
    ],
    later: [
      'The new card arrives in the bank’s business days, unlocked, with a new last four; What Needs You says so.',
      'The refund lands on its day, less what the law leaves you.',
      'A month before a card expires, a new one with the same number is sent.',
      `A debit card a stranger used, at a bank that moves accounts, leaves the account’s number exposed for ${EXPOSURE.days} days: debits may be tried on it, and once it has moved they’re declined.`,
    ],
    interpret: [
      '“Locked: nothing new goes on it.” is a locked card; “Lost: stopped. A new one arrives …” is a reported one.',
      '“A new account’s first card … arrives …” is a new account’s first debit card on its way.',
      '“The law gives … days from the statement to report it, and they’ve passed.” beside a payment means it’s yours to carry.',
      'Your account number “isn’t known to be exposed” until a stranger has used the debit card at a bank that moves accounts; a new number then shuts the old one to debits.',
    ],
    unavailable: [
      '“You have no current account.” or “You don’t have a card.”',
      '“… locks a card only by phone.”',
      '“That card is stopped; a new one is on its way.” and “That card is stopped already; a new one is on its way.”',
      '“… has no rush replacement SLATE knows of.”',
      '“… doesn’t say it moves an account to a new number; closing it and opening another does.”',
      '“You’ve reported it already.” and “The law gives … days from the statement to report it, and they’ve passed.”',
    ],
    mistakes: [
      'Locking your only way to pay: with the debit card locked, no credit card and no cash, the day’s groceries aren’t bought.',
      `Waiting to report a stranger’s debit card charge: past ${clockOf(DEBIT_PROMPT, 'from')}, US law leaves you up to ${usd(DEBIT_LATER.max ?? 0)}, and past ${clockOf(DEBIT_LATER, 'from')}, the charge can’t be reported and all of it is yours.`,
      'Reporting a card lost when locking would do: a report can’t be undone, and the new card takes the bank’s days.',
    ],
    related: ['bank.upkeep', 'bank.card', 'bank.cash'],
    connections: [
      { to: 'bank.upkeep', kind: 'optional', why: 'A Payment Over, set low enough, tells you of a stranger’s charge the day it happens.' },
      { to: 'bank.card', kind: 'immediate', why: 'A credit card locked or reported has nothing Left To Spend until it’s unlocked or replaced.' },
      { to: 'bank.payments', kind: 'immediate', why: 'With the debit card locked or stopped, the day’s groceries go on the credit card or in cash.' },
      { to: 'bank.cash', kind: 'immediate', why: 'A machine needs the debit card; while it’s locked, stopped or not yet here, only the counter pays out.' },
    ],
    example: {
      setup: `A stranger spends ${usd(US_LAW.avgLoss ?? 0)}, the US average case, on a Chase debit card. A Payment Over is set at ${usd(500_00)}.`,
      steps: ['What Needs You says “A Large Payment” the same day.', 'The next morning, press Report It As Not Mine beside it.'],
      result: `Reported a day after you learned of it, US law leaves you at most ${usd(DEBIT_PROMPT.max ?? 0)}, and ${usd((US_LAW.avgLoss ?? 0) - (DEBIT_PROMPT.max ?? 0))} comes back within ${US_LAW.refundDays} business days. The card is stopped, and a new one with a new number arrives in ${CHASE_SAFE.standardDays} business days, free.`,
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
    available: `From the guide’s chapter “${chapter('bank.borrow')}”.`,
    short: `Borrowing shows how your bank runs an overdraft, what it lends, and any debt in collections. A US bank like Chase pays an item the account can’t cover for a fee each (${usd(CHASE_OD.fee)}, at most ${CHASE_OD.maxPerDay} a day, none while it’s ${usd(CHASE_OD.graceUpTo ?? 0)} or less under), and pays an everyday debit card purchase that way only if you opt in. Most banks elsewhere arrange one to a limit, at a rate, and the tab says how yours runs it. A personal loan is lent at the rate your record earns and repaid in equal months. An account left below zero for ${ESTIMATE.closeAfterDays} days is closed, and what it owes goes to collections.`,
    steps: [
      'Open the Borrowing tab. With current accounts at two banks, Borrow At chooses the bank.',
      'Under Overdraft, read how the bank runs one. Where it asks, press Opt In To Debit Card Overdrafts, or Opt Out Of Debit Card Overdrafts.',
      'Where it arranges one, type Overdraft Limit, tick Pay Per Use where offered, and press Arrange It; Close The Overdraft ends it.',
      'Under Personal Loan, type Loan Amount, choose Over and, where asked, For; the rate and the monthly payment show. Choose Paid Into and Repaid From, and press Borrow It.',
      'With a loan, Repay From There moves its payments to another current account, and Pay It Off clears it. Under In Collections, type Pay Toward It and press Pay It. In France, A Loan For The Overrun offers Take The Loan.',
    ],
    needs: [
      `A record of ${ESTIMATE.scoreFloor} or more for an arranged overdraft or a loan, and ${ESTIMATE.scoreGood} where a bank publishes only its lowest rate.`,
      'Wages paid into your accounts in the last 30 days: a bank arranges an overdraft, and lends, against them.',
      `A loan from a bank whose customer you are, for as long as it asks (Wells Fargo’s ${WF_LOAN.customerMonths} months). Citi lends a new customer up to ${usd(CITI_LOAN.newCustomerMax ?? 0)}, and Capital One up to ${usd(CAPITAL_ONE_LOAN.newCustomerMax ?? 0)}, through ${CAPITAL_ONE_LOAN.lender}, which asks for a Social Security number and ${usd(CAPITAL_ONE_LOAN.minIncome ?? 0)} a year of income.`,
      'Chase publishes no personal loan, so a Chase customer borrows at another bank.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Chase’s Overdraft', value: `${usd(CHASE_OD.fee)} an item, at most ${CHASE_OD.maxPerDay} a day; none if it’s ${usd(CHASE_OD.graceUpTo ?? 0)} or less under by the end of the next business day, and none on an item of ${usd(CHASE_OD.smallItemsFree ?? 0)} or less` },
      { label: 'How Far A US Bank Pays', value: `About ${usd(ESTIMATE.perItemCover)} below zero; the banks publish no limit`, estimate: true },
      { label: 'An Arranged Overdraft', value: 'Up to a month of your wages paid in, within the bank’s range', estimate: true },
      { label: 'A Loan’s Payment', value: `At most ${pct(ESTIMATE.loanShareOfPay)} of a month’s wages paid in, every loan you hold counted`, estimate: true },
      { label: 'A Second-Chance Account', value: `${usd(CHEX.secondChanceFee)} a month, and no overdraft`, estimate: true },
    ],
    reads: [
      { label: 'Your Record', value: `Where in its range a bank prices you: the bottom at ${ESTIMATE.scoreBest}, the top at ${ESTIMATE.scoreFloor}`, estimate: true },
      { label: 'Wages In The Last 30 Days', value: 'What an overdraft is arranged against, and what a loan’s payment is held to' },
      { label: 'Opted In Or Not', value: 'Whether a US bank pays an everyday debit card purchase into the overdraft' },
      { label: 'Days Below Zero', value: `Counted past any arranged limit; at ${ESTIMATE.closeAfterDays} the bank closes the account, and in France ${FRANCE.closingNoticeDays} days’ notice comes after that`, estimate: true },
    ],
    now: [
      'Opt In: an everyday debit card purchase the account can’t cover is paid into the overdraft, with its fee. Opted out, it goes on the card or is declined, and costs no fee.',
      'Arrange It: the limit and the rate your record earns are set, with the bank’s set-up or yearly fee where it charges one.',
      'Borrow It: the amount is in the account you chose at once, and the first payment is a month away.',
      'Pay It Off: what’s owed and the month’s interest so far leave the repayment account (with easy-access savings at its bank where savings is linked, and its overdraft), and the loan closes.',
      'Repay From There: the next payment comes from that account.',
      'Pay It: that much leaves your primary account toward the debt, and paid in full, the debt closes.',
      `Take The Loan: the overrun becomes a loan over ${FRANCE.offerMonths} months, paid into the account.`,
    ],
    later: [
      'Overdrawn: interest builds each day where the bank charges it, and is charged on the 1st. Chase holds an item’s fee to the end of the next business day and lets it go if the account is back by then.',
      'A loan’s payment, the same day each month: the month’s interest, then the payment from the repayment account, easy-access savings at its bank where savings is linked, and its overdraft. Short, the bank charges its returned payment fee where it has one, 50 points come off your record, and what’s left is still owed.',
      `Below zero past any arranged limit for ${ESTIMATE.closeAfterDays} days: the bank takes what your other accounts there hold toward it, charges off the rest to collections and closes the account, and ${ESTIMATE.chargeOffHit} points come off your record. A US bank reports it to ChexSystems for ${CHEX.years} years, and the next US bank turns you away about ${pct(CHEX.declines.unpaid)} of the time while it’s unpaid, ${pct(CHEX.declines.paid)} once it’s paid.`,
      `In France: a letter ${FRANCE.informAfterDays} days past the limit, and a loan for the overrun offered at ${FRANCE.offerAfterDays}.`,
    ],
    interpret: [
      '“It covers up to about …, SLATE’s estimate” is how far the bank pays items before declining them.',
      '“… overdraft fee is held …: each comes off after the end of … unless the account is back to …” is a fee you can still save.',
      'A loan’s quote, “…% a year: … a month for … months”, is its rate for your record and its equal payment.',
      '“Every loan you hold, at any bank, counts against the same wages.” means a second loan is held to what the first leaves.',
    ],
    unavailable: [
      '“Your bank doesn’t ask you this.” and “… never pays a debit card purchase into an overdraft.”',
      '“… doesn’t offer an overdraft SLATE has terms for.” and “… doesn’t arrange one: it runs overdrafts its own way, and the bank screen says how.”',
      '“The bank turns down a credit record this poor.”',
      '“The bank arranges one against wages paid in, and not enough has been paid in this month.” and “The bank arranges between … and ….”',
      '“You’re overdrawn by more than that already.” and “Pay the overdraft back before closing it.”',
      '“… lends to its customers: open a current account there first.” and “… lends to customers of … months or more; …”',
      '“… publishes only its lowest rate, and SLATE lends at it only to a good record.”',
      '“The bank lends over … to … months.”, “The bank lends … or more.” and “The bank lends up to ….”',
      '“The bank lends against wages paid in, and none has been paid in this month.” and “A payment of … a month is more than the bank lets a loan take of … of wages.”',
      '“You already have a loan with ….”, “… doesn’t lend for a post-secondary education expense.” and “… asks for a Social Security number.”',
      '“Paying it off takes …, and the bank can’t cover it all.”, “You don’t owe anything in collections.” and “There’s nothing in the account to pay it with.”',
    ],
    mistakes: [
      'Opting in to debit card overdrafts to keep buying groceries: each purchase that overdraws the account costs the item fee.',
      `Leaving an account overdrawn: past ${ESTIMATE.closeAfterDays} days it’s closed and charged off, and a US bank’s report follows you for ${CHEX.years} years.`,
      'Asking for a loan with no wages paid in: a bank lends against the last 30 days’ wages, and money in savings doesn’t count.',
    ],
    related: ['bank.card', 'bank.payments', 'money.affairs', 'bank.other-banks'],
    connections: [
      { to: 'money.affairs', kind: 'history', why: 'A debt charged off stays in Owed as collections until it’s paid.' },
      { to: 'bank.card', kind: 'evaluation', why: 'Your record decides whether a bank arranges an overdraft or lends, and at what rate; a charge-off and a missed loan payment take from it.' },
      { to: 'bank.other-banks', kind: 'scheduled', why: 'An account closed for being overdrawn moves your money to another bank, and a ChexSystems report can turn the next one away.' },
      { to: 'bank.payments', kind: 'immediate', why: 'How You Pay decides what reaches the overdraft: a bill always may, a debit card purchase only where the bank allows it.' },
      { to: 'body.how', kind: 'scheduled', why: 'Each day the primary account is overdrawn or a debt sits in collections, it weighs on you.' },
    ],
    example: {
      setup: `${CHECKING.name} holds ${usd(20_00)} when a ${usd(100_00)} medical bill is paid from it, and you haven’t opted in.`,
      steps: ['The bill is paid, and the account stands at −$80.', `By the end of the next business day, money paid in or moved across brings it back to −${usd(CHASE_OD.graceUpTo ?? 0)} or better.`],
      result: `Chase paid the bill into the overdraft, as it does a bill whether or not you opted in. At −$80 it’s past the ${usd(CHASE_OD.graceUpTo ?? 0)} grace, so a ${usd(CHASE_OD.fee)} fee is held, and brought back by the end of the next business day, the fee is let go. Left there, the fee comes off, and ${ESTIMATE.closeAfterDays} days below zero would close the account.`,
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
    available: `From the guide’s chapter “${chapter('bank.open_current')}”.`,
    short: `You can keep current accounts at more than one bank where you live. Apply opens one at another bank, at once or after its review, at nothing, with any opening deposit sent from an account you hold. In the US there’s no switching service, so moving banks is steps you take: open the account, have wages paid there, move each standing order, autopay and loan repayment, move the money, make it primary, and close the old one. Where a country runs a switching service, Switch Bank does it on a date: Britain’s takes ${GB_SWITCH.workingDays} working days, and once it’s past its last day to be called off, its balance transfer alone can be stopped, to keep the balance where it is.`,
    steps: [
      'On Accounts, under Open An Account At Another Bank, choose the Bank, and where it asks for an opening deposit, Opening Deposit From and the Amount. Read what it takes, then press Apply.',
      'In Your Banks, press Have Wages Paid Here and Make Primary on the new account, and under What Pays From Where, Pay From There for each standing order and card autopay. On Borrowing, Repay From There moves a loan’s payments.',
      'Move the money across with Move Money.',
      'On the old account, choose where What It Holds Goes To and press Close It. While something still uses it, the button is grayed out and the line under it says what.',
      'Where Switch Bank shows, choose Switch To and, if you like, a date On, and press Switch. While it can still be called off, Call Off The Switch… then Call It Off stops it.',
      'In Britain, once a switch is past its last day to be called off, Switch Bank shows Stop The Balance Transfer…; press it, read what keeping the balance does, and press Keep The Balance There, or Move It As Planned to leave it.',
    ],
    needs: [
      'A photo ID in force: a passport, a license or an ID card. Papers has each.',
      `The bank’s age, ${CHASE_OPEN.minimumAge} at Chase, Bank of America, Wells Fargo and Citi; and for Capital One and Citi, US citizenship or a green card.`,
      'Without a Social Security number, Chase, Bank of America and Wells Fargo open an account only in a branch where you live.',
      'No charged-off debt owed to that bank, and no ChexSystems report it turns you away on.',
      'To close a current account: another current account, and this one not primary, not overdrawn, with no money on its way, nothing paying from or into it, no savings beside it, and no card payments pending.',
      'Keep The Balance There: a British switch under way, past its last day to be called off and not a partial one, up to close of business on the working day before its date.',
    ],
    costs: [
      { label: 'Time', value: 'None online' },
      { label: 'In A Branch', value: `${BRANCH_MINUTES} minutes, without a Social Security number`, estimate: true },
      { label: 'Opening Deposits', value: `Bank of America ${usd(BOA_OPEN.minimumDeposit ?? 0)} and Wells Fargo ${usd(WF_OPEN.minimumDeposit ?? 0)}; Chase, Citi and Capital One none` },
      // Until 2026-10-12 this said Bank of America sent its card in its 6 business days, a digital card meanwhile. The
      // engine sends none after a digital card: `cardArrival` (`systems/bankmoves.ts`) works out the day from those days,
      // and `openApproved` drops it, so the card works from the day the account opens and nothing comes after it.
      { label: 'Decisions And Cards', value: `Bank of America decides in ${BOA_OPEN.reviewDays} business days, and its digital debit card works from the day the account opens; Chase opens at once, its card in ${CHASE_OPEN.card?.days} days` },
      // Until later on 2026-10-12 this said a debit card came in SLATE's own days wherever a bank gave none for a new
      // account; `cardArrival` (`systems/bankmoves.ts`) takes the bank's replacement card's days first, and only then SLATE's.
      { label: 'Where A Bank Doesn’t Say', value: `A debit card in the bank’s replacement card’s days, or ${ESTIMATE_CARD_DAYS} business days where it gives none`, estimate: true },
    ],
    reads: [
      { label: 'The New Bank’s Rules', value: `Its review days, opening deposit and card days, whether it closes an account left unfunded or at zero, and how money it sends to another bank arrives: by its own days or cut-off, else by the country’s scheme, else in SLATE’s estimate of ${businessDays(ESTIMATE_SEND_DAYS)}` },
      { label: 'What Uses The Old Account', value: 'Wages paid into it, standing orders, card autopay, loan payments and payments set for a date' },
      { label: 'Britain’s Switch', value: `${GB_SWITCH.workingDays} working days; called off up to ${GB_SWITCH.cancelBeforeDays} working days before its date, and its balance transfer alone stopped up to the working day before` },
    ],
    now: [
      'Apply, decided at once: the account opens at nothing and its card is on its way. Under review, the bank decides on its day. Any opening deposit leaves your account now.',
      `Close It: interest and fees settled, what it holds sent to the account you named, at once at the same bank or otherwise in the bank’s days, and the account closed with its history kept. Citi keeps one open, restricted, while card payments post, up to ${CITI_OPEN.closeWithPendingDays} days.`,
      'Switch: set for its date, and the new bank looks at the application the next day.',
      'Call It Off: the switch is canceled, and your accounts and payments stay where they are.',
      'Keep The Balance There: the switch goes ahead on its date and your payments move, but the balance stays in the old account, which stays open.',
    ],
    later: [
      'On the decision day: opened, or turned down with the reason; a deposit sent comes back to the account it left.',
      `${CAPITAL_ONE_OPEN.fundWithinDays !== undefined ? `Capital One closes an account not funded in ${CAPITAL_ONE_OPEN.fundWithinDays} days` : 'A bank may close an account left unfunded'}, and Citi one left at zero for ${CITI_OPEN.closesAtZeroAfterDays}.`,
      'On a switch’s date: the new accounts open, and balances, wages, standing orders, autopay, loan repayments and payments set for a date move as the old account closes. With its balance transfer stopped, or on a partial switch, the payments move and the old account stays open with its balance. Overdrawn on the day, the old one stays open, blocked to all but paying in, until it’s repaid.',
    ],
    interpret: [
      '“Applied: … decides by ….” is a review under way; “Opened at ….” is an account open now, with its card’s day.',
      '“Waiting for its opening deposit” means money is still on its way to it.',
      '“To close it: …” lists what still uses the old account.',
      'Past Switches lists each switch and how it ended.',
    ],
    unavailable: [
      '“That isn’t a bank where you live.” and “You already keep a current account at ….”',
      '“… is still reviewing your application.”',
      'A bank you owe a charged-off debt won’t open an account for you, and one that turned you away on a ChexSystems report says until when the report stands.',
      '“… asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.”',
      '“… opens an account on your own from ….” and “… opens this account for US citizens and permanent residents; on an F-1 you’re neither.”',
      '“Without a Social Security number, … opens your account in a branch where you live.” In a branch, “Not from a hospital bed.”, “You’re at … until ….” or “… starts at …: there isn’t the time before it.”',
      '“… asks for an opening deposit of …, sent from another of your accounts.” and “That account is at … already.”',
      'Closing: “It’s your only current account.”, “It’s your primary account. Make another primary first.”, “It’s overdrawn by ….”, “Money is on its way into or out of it.”, a list of what still uses it, “… is open beside it. Close it first.”, or “Card payments are still pending on it.”',
      'Switching, in the US: “There’s no switching service here: …” Elsewhere: “A switch is already under way.”, “Clear the overdraft before switching; the new bank won’t take it on.” or “A partial switch is a Current Account Switch Service step, in Britain only.”',
      'Calling it off: “This country’s switching service publishes no right to call a switch off: it runs to its date.” or “It could be called off until …”',
      'Keep The Balance There: “No switch is under way.”, “This country’s switching service publishes no such step.”, “Its balance transfer is stopped already.” or “The transfer could be stopped until close of business ….”',
    ],
    mistakes: [
      'Closing the old account first: wages, standing orders, autopay and loan payments still point at it, and Close It says so. Move each, then close it.',
      'Expecting Make Primary to move wages: Have Wages Paid Here does, after the payer’s lead time.',
      `Applying without the opening deposit in another account: Bank of America asks ${usd(BOA_OPEN.minimumDeposit ?? 0)}, sent from one of yours.`,
    ],
    related: ['bank.accounts', 'bank.payments', 'bank.transfer', 'bank.borrowing'],
    connections: [
      { to: 'documents.passport-id', kind: 'prerequisite', why: 'A new bank asks for a photo ID in force: a passport, a license or an ID card.' },
      { to: 'bank.payments', kind: 'prerequisite', why: 'Before the old account closes, wages, standing orders, autopay and loan payments have to be moved off it, and payments set for a date to or from it called off.' },
      { to: 'bank.transfer', kind: 'scheduled', why: `Money between your banks lands by the sending bank’s own days or cut-off, or where it sets none, by its country’s scheme, and where neither says, in SLATE’s estimate of ${businessDays(ESTIMATE_SEND_DAYS)}.` },
      { to: 'bank.accounts', kind: 'immediate', why: 'Make Primary on the new account heads the bank screen with its bank, and the day comes out of it.' },
      { to: 'bank.borrowing', kind: 'optional', why: 'A second bank lends or arranges an overdraft on its own terms; Borrow At chooses it.' },
    ],
    // Until 2026-10-12 the result said its debit card came in Bank of America's 6 business days, a digital one
    // meanwhile. Played (`tests/guide-examples-money.test.ts`), the card works from the day the account opens and nothing
    // arrives after it, as the costs above say now.
    example: {
      setup: `A student at Chase with ${usd(2_000_00)} in ${CHECKING.name} opens an account at Bank of America, which asks for ${usd(BOA_OPEN.minimumDeposit ?? 0)}.`,
      steps: [`Choose Bank of America, Opening Deposit From ${CHECKING.name}, Amount ${(BOA_OPEN.minimumDeposit ?? 0) / 100}, and press Apply.`, `When it opens, press Have Wages Paid Here and Make Primary on its ${BOA.current.name}.`],
      result: `The ${usd(BOA_OPEN.minimumDeposit ?? 0)} leaves Chase now and lands in Chase’s ${CHASE_OPEN.sendDays} business days. Bank of America decides in ${BOA_OPEN.reviewDays}, opens the account at nothing, and its digital debit card works from the day it opens. Yale’s payroll pays there from ${PAYER_LEAD['yale-payroll']} days on, and ${CHECKING.name} can close once nothing pays from it or into it and no savings sits beside it at Chase, its money sent across in ${CHASE_OPEN.sendDays} business days.`,
    },
  },
];
