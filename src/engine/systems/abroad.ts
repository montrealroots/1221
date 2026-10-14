/**
 * SLATE — an account kept at home, operated from America, and money moved between countries (modules 4 and 5 of the
 * design of 2026-10-16, the owner's decision of that day: an eligible student keeps an account they held in the country
 * they lived in before Yale, beside the American one; nobody travels or moves).
 *
 * A bank decides by where its customer lives (`homeOf`), and a home account's bank is in another country. So, by the
 * bank's own words in the research (`content/homeaccounts.ts`):
 *
 * - **Nothing new from abroad** (`abroadRefusal`): savings, a term deposit, an overdraft, a loan, a debit card's
 *   overdraft or a credit card at a bank in another country are refused, in its words where the research quotes them.
 *   Wages can't be paid there either ("Yale pays into an account in America."), nor cash paid in, since its counters and
 *   machines are in its country.
 * - **Its charges, as it charges them**: a fee for a customer abroad on the bank's schedule (`nonResidentFeeDue`), its
 *   card's fee on a purchase in dollars (`cardFeeAbroad`) and at a machine here (`atmAbroad`), each in its own money
 *   exactly, and the country's tax at source on a non-resident's interest (`nonResidentTaxOn`).
 * - **Its closing** (`armHomeAccounts`, `HOME_CLOSES_KIND`): a bank that closes the account of a customer abroad, or of a
 *   US person where it says so, gives its notice on the first morning, with its date, and on that date settles the
 *   interest and fees, sends what's left to the American account by its own payment abroad and closes.
 * - **Payments abroad** (`abroadQuote`, `sendAbroad`): between banks in two countries, every move goes this way and none
 *   takes a domestic same-day path (`sendBetweenBanks` routes here first). Out now with the sending bank's fee; in on
 *   the day that's so many business days later in both countries, less the bank's margin on the exchange and the
 *   receiving bank's fee. A margin or a time the bank doesn't publish is SLATE's stated assumption
 *   (`ASSUMED_MARGIN`, `ASSUMED_DAYS`); a fee it doesn't publish refuses the payment.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import type { Person } from '../domain/model';
import type { ScheduledItem } from '../core/scheduler';
import { addDays, dateKey, formatDate, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { bankById, type Bank } from '../content/banks';
import { afterBusinessDaysIn, daysOfAccount } from '../content/bankdays';
import { ASSUMED_DAYS, ASSUMED_WORDS, abroadTermsOf, chargeOf, homeTerms, marginOf, noticeFor, NON_RESIDENT_TAX, type AbroadTerms } from '../content/homeaccounts';
import { homeOf } from './earnings';
import { isoOf, dropPaymentsFor, settleFees, settleInterest } from './banking';
import { ARRIVES_KIND, inTransitOf, usPerson } from './bankmoves';
import { checkingsOf } from './lending';
import { depositAccount, redirectAway } from './routing';
import { ageOn } from './mortality';

export const HOME_CLOSES_KIND = 'bank.home_closes';

const swap = (cents: Money, from: string, to: string): Money | undefined => exchange(cents, from, to);

/** The country a person lives in, ISO alpha-2. */
export function livesIn(person: Person): string | undefined {
  return isoOf(homeOf(person));
}

/** An account's own money: its `currency`, or the save's. */
export function moneyOf(sim: Simulation, account: Account): string {
  return account.currency ?? saveCurrency(sim.universe);
}

/** An amount in an account's own money, written. */
export function heldText(sim: Simulation, account: Account, amount: Money = heldOf(account)): string {
  return formatMoney(amount, moneyOf(sim, account));
}

/** What an account holds in its own money: `held` on an account in another currency, the balance otherwise. */
export const heldOf = (account: Account): Money => (account.currency ? account.held ?? 0 : account.balance);

/** Whether an account's bank is in another country than the one its owner lives in. */
export function heldFromAbroad(sim: Simulation, account: Account): boolean {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  const owner = sim.universe.people[account.ownerId];
  if (!bank || !owner) return false;
  const here = livesIn(owner);
  return here !== undefined && bank.iso !== here;
}

/** An amount in the save's money from an account's own, and back. */
function toSave(sim: Simulation, amount: Money, currency: string): Money {
  const save = saveCurrency(sim.universe);
  return currency === save ? amount : swap(amount, currency, save) ?? amount;
}
function fromSave(sim: Simulation, amount: Money, currency: string): Money {
  const save = saveCurrency(sim.universe);
  return currency === save ? amount : swap(amount, save, currency) ?? amount;
}

/**
 * Why a bank in another country opens nothing new for this person, or nothing where it's a bank where they live: in
 * its words where the research quotes them, and where it doesn't, that the research found no way to. Only a bank the
 * research reads as one a student keeps from home (`homeTerms`) is held to it: a Toronto life borrowing from Citi, which
 * no home account reaches, is lent to as it was before 2026-10-16.
 */
export function abroadRefusal(person: Person, bank: Bank | undefined): string | undefined {
  const here = livesIn(person);
  const terms = bank ? homeTerms(bank.id) : undefined;
  if (!bank || !terms || here === undefined || bank.iso === here) return undefined;
  return terms.abroad.opening ?? `The research found no way to open anything new at ${bank.name} from America, so SLATE takes it there’s none.`;
}

/**
 * The share the bank's country takes from a non-resident's interest, where the account's owner lives outside that
 * country; nothing where they live in it. The rate is the country's for a customer abroad (`NON_RESIDENT_TAX`): a bank in
 * Britain takes nothing, one in Japan 15.315%.
 */
export function nonResidentTaxOn(sim: Simulation, account: Account): number | undefined {
  if (!heldFromAbroad(sim, account)) return undefined;
  const bank = bankById(account.bankId!)!;
  return NON_RESIDENT_TAX[bank.iso]?.rate ?? 0;
}

/**
 * The bank's fee for a customer abroad, due at a month's end on the current account at the bank, in its own money and
 * the save's: monthly every month, quarterly at the calendar quarter's end, and every two years from the first month
 * after they left (the certificate Sabadell asks for on leaving, then again), not under the age it's spared at.
 */
export function nonResidentFeeDue(sim: Simulation, account: Account, at: Instant): { fee: Money; native: Money } | undefined {
  if (account.kind !== 'checking' || !heldFromAbroad(sim, account)) return undefined;
  const fee = homeTerms(account.bankId!)?.nonResidentFee;
  const owner = sim.universe.people[account.ownerId];
  if (!fee || !owner) return undefined;
  if (fee.ageBelow !== undefined && ageOn(sim, owner, at) < fee.ageBelow) return undefined;
  const p = zonedParts(at, sim.homeZone);
  if (fee.months === 3 && p.month % 3 !== 0) return undefined;
  if (fee.months > 3) {
    const left = zonedParts(account.lastUsedBefore ?? account.openedAt, sim.homeZone);
    const months = (p.year - left.year) * 12 + (p.month - left.month);
    if (months % fee.months !== 0) return undefined;
  }
  const currency = bankById(account.bankId!)!.currency;
  return { native: fee.amount, fee: toSave(sim, fee.amount, currency) };
}

/** Why a bank's card can't be the one used here, or nothing. */
export function cardAbroadRefusal(bank: Bank): string | undefined {
  const terms = abroadTermsOf(bank.id);
  if (terms?.cardRefused) return terms.cardRefused;
  if (!terms?.card) return `SLATE has no research on what ${bank.name} charges for a purchase in dollars on its card, so it can’t be your everyday card here.`;
  return undefined;
}

/** What a debit card purchase here, of an amount in the save's money, costs on a card from a bank abroad: its fee, both ways. */
export function cardFeeAbroad(sim: Simulation, account: Account, paid: Money): { fee: Money; native: Money } | undefined {
  if (paid <= 0 || !heldFromAbroad(sim, account)) return undefined;
  const bank = bankById(account.bankId!)!;
  const terms = abroadTermsOf(bank.id);
  if (!terms?.card) return undefined;
  const currency = moneyOf(sim, account);
  let native = fromSave(sim, paid, currency);
  // BBVA lets the month's first €300 of purchases abroad through free.
  if (terms.cardFreeMonthly !== undefined) {
    const before = spentAbroadThisMonth(sim, account) - native;
    native = Math.max(0, native - Math.max(0, terms.cardFreeMonthly - before));
  }
  if (native <= 0) return undefined;
  const fee = chargeOf(terms.card, native, currency, swap);
  return fee > 0 ? { native: fee, fee: toSave(sim, fee, currency) } : undefined;
}

/** What the card at a bank abroad has paid for purchases this month, in its money, the purchase just made among them. */
function spentAbroadThisMonth(sim: Simulation, account: Account): Money {
  const p = zonedParts(sim.now, sim.homeZone);
  const since = instantFromZoned({ year: p.year, month: p.month, day: 1, hour: 0 }, sim.homeZone);
  let total = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0 && list[i]!.at >= since; i -= 1) {
    const t = list[i]!;
    if (t.category !== 'food') continue;
    for (const q of t.postings) if (q.accountId === account.id && q.amount < 0) total -= q.native ?? q.amount;
  }
  return total;
}

/**
 * Cash from a machine here on a card from a bank abroad: refused at its own machines and counters, which are in its
 * country, and where it publishes nothing or says its card doesn't work abroad; otherwise its fee, both ways.
 */
export function atmAbroad(sim: Simulation, account: Account, amount: Money, from: string): { fee: Money; native: Money } | { refused: string } | undefined {
  if (!heldFromAbroad(sim, account)) return undefined;
  const bank = bankById(account.bankId!)!;
  if (from !== 'other_atm') return { refused: `${bank.name}’s own machines and counters are in its country; here its card works at another bank’s machine.` };
  const terms = abroadTermsOf(bank.id);
  if (terms?.atmRefused) return { refused: terms.atmRefused };
  if (!terms?.atm) return { refused: `SLATE has no research on what ${bank.name} charges for cash from a machine abroad.` };
  const currency = moneyOf(sim, account);
  const native = chargeOf(terms.atm, fromSave(sim, amount, currency), currency, swap);
  return { native, fee: toSave(sim, native, currency) };
}

/** A payment between countries, worked out before it's made: what goes, what it costs, what arrives and when. */
export interface AbroadQuote {
  from: Bank;
  to: Bank;
  /** What leaves, in the sending account's money, and in the save's. */
  sent: Money;
  sentIn: string;
  worth: Money;
  /** The sending bank's fee, in its money and the save's. */
  fee: Money;
  feeSave: Money;
  /** The margin on the exchange: its rate, whether it's SLATE's assumption, and what it takes in the save's money. */
  margin: number;
  marginAssumed: boolean;
  marginSave: Money;
  /** The receiving bank's fee, in its money and the save's. */
  incoming: Money;
  incomingSave: Money;
  /** What arrives, in the receiving account's money, and in the save's. */
  received: Money;
  receivedIn: string;
  receivedSave: Money;
  arrives: Instant;
  days: number;
  daysAssumed: boolean;
}

/** What the holder's accounts at a bank have sent abroad since a moment, in its money. */
function sentAbroadSince(sim: Simulation, person: Person, bankId: string, since: Instant): Money {
  // Found, not opened: a quote is read on the screen, and opens nothing.
  const transit = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'escrow' && a.category === 'in_transit' && !a.closedAt)?.id;
  if (!transit) return 0;
  const atBank = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && a.bankId === bankId).map((a) => a.id));
  let total = 0;
  const list = sim.universe.transactions;
  for (let k = list.length - 1; k >= 0 && list[k]!.at >= since; k -= 1) {
    const t = list[k]!;
    if (t.category !== 'transfer' || !t.postings.some((p) => p.accountId === transit)) continue;
    for (const p of t.postings) if (atBank.has(p.accountId) && p.amount < 0) total -= p.native ?? p.amount;
  }
  return total;
}

/**
 * A payment from one of the holder's accounts to their account at a bank in another country, quoted: the sending bank's
 * fee and margin (or SLATE's stated margin where it publishes none), the receiving bank's fee, what arrives and the day
 * it does, or why it can't be made, in words. `sent` is in the sending account's money. A payment the bank makes itself
 * (`byTheBank`, a closing) isn't held to the holder's limits, and its fee comes out of what it sends.
 */
export function abroadQuote(sim: Simulation, person: Person, from: Account, to: Account | undefined, sent: Money, toBankId = to?.bankId, byTheBank = false): AbroadQuote | { refused: string } {
  const fromBank = from.bankId ? bankById(from.bankId) : undefined;
  const toBank = toBankId ? bankById(toBankId) : undefined;
  if (!fromBank || !toBank) return { refused: 'Money moves abroad between your own accounts at banks SLATE knows.' };
  const out = abroadTermsOf(fromBank.id);
  const into = abroadTermsOf(toBank.id);
  if (out?.outRefused) return { refused: out.outRefused };
  if (!out?.out) return { refused: `SLATE has no research on what ${fromBank.name} charges to send a payment abroad.` };
  if (!into?.incoming) return { refused: `SLATE has no research on what ${toBank.name} charges for a payment received from abroad.` };
  if (!(sent > 0)) return { refused: 'Say how much to send.' };
  const save = saveCurrency(sim.universe);
  const sentIn = moneyOf(sim, from);
  const has = heldOf(from);
  let fee = chargeOf(out.out, sent, sentIn, swap);
  if (sent + fee > has) {
    if (!byTheBank) return { refused: `${from.name} holds ${formatMoney(Math.max(0, has), sentIn)}, and this takes ${formatMoney(sent + fee, sentIn)} with the bank’s fee.` };
    // The bank's own payment of what's left: its fee comes out of it.
    sent = has - fee;
    if (sent <= 0) { fee = has; sent = 0; }
  }
  if (!byTheBank) {
    const limits = limitRefusal(sim, person, fromBank, out, sent, sentIn);
    if (limits) return { refused: limits };
  }
  const worth = sent === has && from.currency ? from.balance : toSave(sim, sent, sentIn);
  const feeSave = toSave(sim, fee, sentIn);
  const { rate, assumed } = marginOf(out, sent);
  const marginSave = Math.round(worth * rate);
  const receivedIn = to ? moneyOf(sim, to) : toBank.currency === save ? save : toBank.currency;
  const arriving = fromSave(sim, worth - marginSave, receivedIn);
  const incoming = chargeOf(into.incoming, arriving, receivedIn, swap);
  const incomingSave = toSave(sim, incoming, receivedIn);
  const receivedSave = worth - marginSave - incomingSave;
  const received = receivedIn === save ? receivedSave : arriving - incoming;
  if (receivedSave <= 0 && !byTheBank) return { refused: 'That wouldn’t cover the margin on the exchange and the fee for receiving it.' };
  const days = out.days ?? ASSUMED_DAYS;
  const places = [daysOfAccount(from, person), daysOfAccount(to ?? { bankId: toBank.id }, person)];
  const arrives = afterBusinessDaysIn(sim.now, days, places, sim.homeZone);
  return {
    from: fromBank, to: toBank, sent, sentIn, worth, fee, feeSave, margin: rate, marginAssumed: assumed, marginSave,
    incoming, incomingSave, received, receivedIn, receivedSave, arrives, days, daysAssumed: out.days === undefined,
  };
}

/** Why the sending bank's own limits on payments abroad refuse one, in its money. */
function limitRefusal(sim: Simulation, person: Person, bank: Bank, terms: AbroadTerms, sent: Money, currency: string): string | undefined {
  if (terms.limitDay === undefined && terms.limitMonth === undefined) return undefined;
  const p = zonedParts(sim.now, sim.homeZone);
  const today = sentAbroadSince(sim, person, bank.id, instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 0 }, sim.homeZone));
  const month = sentAbroadSince(sim, person, bank.id, instantFromZoned({ year: p.year, month: p.month, day: 1, hour: 0 }, sim.homeZone));
  if (terms.limitDay !== undefined && today + sent > terms.limitDay) return `${bank.name} lets ${formatMoney(terms.limitDay, currency, { cents: false })} a day go abroad, and ${formatMoney(today, currency, { cents: false })} has gone today.`;
  if (terms.limitMonth !== undefined && month + sent > terms.limitMonth) return `${bank.name} lets ${formatMoney(terms.limitMonth, currency, { cents: false })} a month go abroad, and ${formatMoney(month, currency, { cents: false })} has gone this month.`;
  return undefined;
}

const percent = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;

/** A quote in a sentence, for Move Money and the guide. */
export function quoteWords(sim: Simulation, q: AbroadQuote): string {
  const fee = q.fee > 0 ? `for a ${formatMoney(q.fee, q.sentIn)} fee` : 'for no fee';
  const margin = q.marginAssumed
    ? `At ${percent(q.margin)} under SLATE’s rate (${ASSUMED_WORDS.margin})`
    : `At its rate, ${percent(q.margin)} under SLATE’s`;
  const incoming = q.incoming > 0 ? ` after its ${formatMoney(q.incoming, q.receivedIn)} fee for a payment from abroad` : '';
  const days = q.daysAssumed ? ` (${ASSUMED_WORDS.days})` : '';
  return `${q.from.name} sends ${formatMoney(q.sent, q.sentIn)} ${fee}. ${margin}, ${q.to.name} receives ${formatMoney(q.received, q.receivedIn)}${incoming}, on ${formatWeekdayDate(q.arrives, sim.zone)}${days}.`;
}

/**
 * Sends a payment abroad now: out of the account, its fee beside it, into the money in transit; in on the day the quote
 * gave, less the margin and the receiving bank's fee (`arriveFromAbroad`). Throws the quote's refusal.
 */
export function sendAbroad(sim: Simulation, person: Person, from: Account, to: Account | undefined, sent: Money, toBankId = to?.bankId, byTheBank = false): Instant {
  const q = abroadQuote(sim, person, from, to, sent, toBankId, byTheBank);
  if ('refused' in q) throw new CommandError(q.refused);
  const transit = inTransitOf(sim, person);
  const foreign = from.currency !== undefined;
  if (q.sent > 0) {
    sim.post({
      memo: `To ${q.to.name}${to ? `: ${to.name}` : ''}, abroad`, category: 'transfer',
      postings: [{ accountId: from.id, amount: -q.worth, ...(foreign ? { native: -q.sent } : {}) }, { accountId: transit.id, amount: q.worth }],
    });
  }
  if (q.fee > 0) {
    // Where the fee is the last of what it held, the last of its balance too, so it's empty in both figures.
    const feeSave = foreign && from.held === q.fee ? from.balance : q.feeSave;
    sim.post({
      memo: 'International payment fee', category: 'bank_fee',
      postings: [{ accountId: from.id, amount: -feeSave, ...(foreign ? { native: -q.fee } : {}) }, { accountId: sim.nominalAccount('expense', 'Bank Fees').id, amount: feeSave }],
    });
  }
  if (q.sent <= 0) return sim.now;
  sim.schedule({
    at: q.arrives, kind: ARRIVES_KIND, label: 'Money Arrives From Abroad', category: 'home', priority: 37,
    payload: {
      personId: person.id, fromId: from.id, ...(to ? { toId: to.id } : {}), toBankId: q.to.id, amount: q.worth,
      abroad: true, margin: q.marginSave, incoming: q.incomingSave, received: q.received, receivedIn: q.receivedIn,
    },
  });
  return q.arrives;
}

/**
 * A payment abroad arriving: into the account it was sent to, less the margin on the exchange and the receiving bank's
 * fee, with its own figure exact; or, where that account has closed, back to the one it left, less the same.
 */
export function arriveFromAbroad(sim: Simulation, item: ScheduledItem, person: Person, to: Account | undefined): void {
  const amount = Number(item.payload.amount);
  const margin = Number(item.payload.margin ?? 0);
  const incoming = Number(item.payload.incoming ?? 0);
  const transit = inTransitOf(sim, person);
  const source = sim.universe.accounts[String(item.payload.fromId)];
  const lands = to ?? (source && !source.closedAt ? source : depositAccount(sim, person) ?? checkingsOf(sim, person)[0]);
  if (!lands) return;
  const net = amount - margin - incoming;
  const exact = to && to.currency !== undefined && item.payload.receivedIn === to.currency ? { native: Number(item.payload.received) } : {};
  const postings: { accountId: string; amount: Money; native?: Money }[] = [{ accountId: transit.id, amount: -amount }, { accountId: lands.id, amount: net, ...exact }];
  if (margin > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Exchange Margin').id, amount: margin });
  if (incoming > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Bank Fees').id, amount: incoming });
  const fromName = source ? `${source.name} at ${source.institution ?? 'your other bank'}` : 'your bank abroad';
  sim.post({ memo: to ? `From ${fromName}, abroad` : 'Returned from abroad, less the exchange and the fee: the account it was sent to isn’t open', category: 'transfer', postings });
  if (person.id !== sim.universe.playerId) return;
  sim.notify(to
    ? { category: 'bank', title: 'Money Arrived From Abroad', body: `${heldText(sim, lands, exact.native ?? net)} reached ${lands.name} from ${fromName}.`, importance: 45, route: '/workspace/bank' }
    : { category: 'bank', title: 'A Payment Abroad Came Back', body: `The account it was sent to isn’t open, so ${formatMoney(net, saveCurrency(sim.universe))} came back to ${lands.name}, less the exchange and the fee.`, importance: 50, route: '/workspace/bank' });
}

/** The home banks that close this person's account, by bank: Barclays for anybody abroad, or a bank that closes a US person's. */
function closingBanks(sim: Simulation, person: Person): { bank: Bank; accounts: Account[]; why: string }[] {
  const out: { bank: Bank; accounts: Account[]; why: string }[] = [];
  const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.closedAt && !a.nominal && (a.kind === 'checking' || a.kind === 'savings') && heldFromAbroad(sim, a));
  for (const bankId of new Set(mine.map((a) => a.bankId!))) {
    const terms = homeTerms(bankId);
    const bank = bankById(bankId);
    if (!terms || !bank) continue;
    if (terms.nonResident === 'closes') out.push({ bank, accounts: mine.filter((a) => a.bankId === bankId), why: 'whose holder lives outside its country' });
    else if (terms.usPersons === 'closes' && usPerson(person, sim.now)) out.push({ bank, accounts: mine.filter((a) => a.bankId === bankId), why: 'held by a US citizen' });
  }
  return out;
}

/**
 * Gives a closing bank's notice, once: on the first morning (and on loading a save made before this), it schedules the
 * closing on the day its notice runs out, counted from the morning they arrived, and says so. A save that already has
 * the closing scheduled, done or not, is left alone, so a reload never says it twice.
 */
export function armHomeAccounts(sim: Simulation): void {
  const person = sim.universe.people[sim.universe.playerId];
  if (!person) return;
  for (const { bank, accounts, why } of closingBanks(sim, person)) {
    if (sim.universe.scheduled.some((i) => i.kind === HOME_CLOSES_KIND && i.payload.personId === person.id && i.payload.bankId === bank.id)) continue;
    const opened = Math.min(...accounts.map((a) => a.openedAt));
    const days = noticeFor(homeTerms(bank.id)!, dateKey(opened, sim.homeZone));
    if (days === undefined) continue;
    const arrived = accounts[0]!.lastUsedBefore ?? sim.now;
    const at = addDays(arrived, days, sim.homeZone);
    sim.schedule({ at, kind: HOME_CLOSES_KIND, label: `${bank.name} Closes Your Account`, category: 'home', priority: 36, payload: { personId: person.id, bankId: bank.id } });
    const into = checkingsOf(sim, person).find((a) => !heldFromAbroad(sim, a));
    sim.notify({
      category: 'bank', title: `${bank.name} Is Closing Your Account`,
      body: `${bank.name} closes an account ${why}. It gives ${days} days’ notice, so your accounts there close on ${formatDate(at, sim.zone)}, and what they hold then is sent to ${into ? `${into.name} at ${into.institution}` : 'your account here'} by the bank’s own payment abroad.`,
      importance: 70, route: '/workspace/bank',
    });
  }
}

/** The closing on its day: interest and fees settled, everything gathered on the current account and sent here, closed. */
function homeCloses(sim: Simulation, item: ScheduledItem): void {
  const person = sim.universe.people[String(item.payload.personId)];
  const bank = bankById(String(item.payload.bankId));
  if (!person || !bank) return;
  const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.closedAt && a.bankId === bank.id && (a.kind === 'checking' || a.kind === 'savings'));
  if (mine.length === 0) return;
  for (const account of mine) { settleInterest(sim, account, `Interest: ${account.name}, on closing`); settleFees(sim, account); }
  const current = mine.find((a) => a.kind === 'checking') ?? mine[0]!;
  for (const account of mine) {
    if (account.id === current.id || account.balance === 0) continue;
    sim.post({ memo: `Closed ${account.name}`, category: 'transfer', postings: [{ accountId: account.id, amount: -account.balance, ...(account.currency ? { native: -(account.held ?? 0) } : {}) }, { accountId: current.id, amount: account.balance, ...(current.currency ? { native: account.held ?? 0 } : {}) }] });
  }
  const mineNow = person.id === sim.universe.playerId;
  if (current.balance < 0) {
    if (mineNow) sim.notify({ category: 'bank', title: `${bank.name} Didn’t Close Your Account`, body: `It’s overdrawn by ${heldText(sim, current, -heldOf(current))}, and the bank closes it only once that’s paid.`, importance: 60, route: '/workspace/bank' });
    return;
  }
  const into = checkingsOf(sim, person).find((a) => !heldFromAbroad(sim, a));
  for (const account of mine) {
    if (!into) break;
    if (person.primaryAccountId === account.id) person.primaryAccountId = into.id;
    redirectAway(sim, person, account.id, into.id);
  }
  const held = heldOf(current);
  let arrives: Instant | undefined;
  if (held > 0 && into) arrives = sendAbroad(sim, person, current, into, held, into.bankId, true);
  for (const account of mine) {
    account.accrued = 0;
    account.closedAt = sim.now;
    account.overdraftLimit = undefined;
    dropPaymentsFor(sim, person, account);
  }
  if (mineNow) {
    sim.notify({
      category: 'bank', title: `${bank.name} Closed Your Account`,
      body: arrives !== undefined && into ? `Its notice ran out. ${heldText(sim, current, held)} is on its way to ${into.name}, arriving ${formatDate(arrives, sim.zone)}, less the payment’s costs.` : 'Its notice ran out, and it held nothing to send.',
      importance: 70, route: '/workspace/bank',
    });
  }
}

export function registerAbroad(sim: Simulation): void {
  sim.onSchedule(HOME_CLOSES_KIND, (item, s) => homeCloses(s, item));
}
