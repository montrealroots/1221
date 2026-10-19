/**
 * Batch 3: `content/pending.ts` and `content/cash.ts`. Statements shows each bank's `pendingWords` ("A card payment:
 * …"), `postingOrder` ("Overnight: …"), `valueDating` ("Value dates: …") and `source` (`ui/bank/BankStatements.tsx`,
 * `PendingTerms`); the card shows `paymentHoldWords` after "… on hold until …, while the payment clears from another
 * bank." (`ui/bank/BankCard.tsx`). Payments And Cash shows each bank's cash `source` (`ui/bank/BankCash.tsx`). Brief 14
 * rewrote most of these into plain words, and they stay; what changes is the research's notes to itself left in them,
 * a fragment with no subject ("Couldn't find a figure…"), a field's number with no field ("(31 is about 45 calendar
 * days in business days.)"), short months, "6pm", a German word spelled without its umlaut, and the source lines' bare
 * day, which says "read" now (`read-days.mjs`). Applied with `apply-gen.mjs`, once per file.
 */
import { readDaysFor } from './read-days.mjs';

const pending = {
  PENDING: {
    'ca-bmo': {
      pendingWords: 'BMO Canada’s own pages don’t give a figure: its Canadian help pages didn’t load when they were read. The 3- and 5-business-day debit holds that searches turn up are from BMO’s US site, so the game doesn’t use them.',
    },
    'mx-santander': {
      pendingWords: 'Santander México’s own pages don’t give a figure: its help pages returned errors when they were read, and the figures searches turn up are from other sites.',
    },
    'mx-banorte': {
      pendingWords: 'Banorte’s own pages don’t say how long a pending charge is held: its FAQ page didn’t load when it was read.',
    },
    'is-landsbankinn': {
      pendingWords: 'An authorization sets the amount aside for as long as it’s valid, and merchants must send each card payment for settlement without delay, and no later than three days after it’s made. Those three days are calendar days, the deadline Landsbankinn sets merchants in its terms for taking cards; it publishes no figure for cardholders.',
    },
    'is-arion': {
      pendingWords: 'Arion’s public pages and FAQs don’t say how long a card purchase stays pending, and its current card terms couldn’t be opened when they were read.',
      valueDating: 'Deposits generally earn interest from the moment the money is credited to the account, and the last interest day is the day before a withdrawal is debited. So incoming transfers are value-dated the day they arrive, and debits the day before they’re booked. This is from Arion’s deposit terms of March 2017, since replaced; the current version couldn’t be opened.',
    },
    'fr-bnp-paribas': {
      pendingWords: 'Card payments are debited once BNP Paribas receives them from the merchant’s bank through clearing, and it gives no number of days. On an immediate-debit card you need enough money in the account from the purchase until it’s debited. On a deferred-debit card, payments up to the 28th (or the next business day) are debited together on the last business day of the month, and they show in the meantime under upcoming operations. The deferred-debit dates are from a search summary of BNP Paribas’s page, which couldn’t be opened directly.',
    },
    'fr-lcl': {
      pendingWords: 'Payments are debited from the account immediately unless a monthly deferred debit has been agreed. A hotel or car-rental booking can set an amount aside that counts against the monthly spending limit without being debited. Deferred-debit card payments are debited in one go on the last business day of the month; in 2026 statements close a day earlier, for example on January 29 and February 26. LCL doesn’t say how many days a purchase stays pending.',
      valueDating: 'None of LCL’s terms that were read give a value-date schedule; the only 2026 tariff extract available was four pages long. French law (L133-14) says a credit can’t be value-dated later than the business day the bank receives the funds, and a debit can’t be value-dated earlier than the day it’s debited.',
    },
    'fr-la-banque-postale': {
      pendingWords: 'The bank told MoneyVox that an ordinary card payment in France, going through the standard clearing system, is cleared and received a day or two after the purchase, and that entries post to the online statement each evening around 10:30 to 11 p.m. Its help center says upcoming operations are shown only as a guide and may not go through, or may post on a different date.',
      valueDating: 'The 2026 tariff brochure only gives a value date for checks, which are credited the business day after the service center receives them. French law (L133-14) says card debits can’t be value-dated earlier than the day they’re debited, and incoming transfers no later than the day the funds arrive.',
    },
    'de-deutsche-bank': {
      valueDating: 'Statements carry a value date (Wertstellung). The price list sets debits (Belastungen) at the day of the debit and outgoing transfers at the day the bank executes them, and incoming transfers at the day the money reaches the bank, credited at most one business day after it arrives (instant transfers at once). Card payments follow the debit rule, so the value date is the day the charge is booked, not the day of purchase. Anything falling on a non-business day is value-dated the next business day. Deutsche Bank’s documents don’t cite section 675t BGB by name, but the rules match it.',
    },
    'de-commerzbank': {
      pendingWords: 'Commerzbank shows card payments and cash withdrawals in advance as “vorgemerkte Umsätze” in online banking and the app, and lists booked, outstanding and reserved amounts separately, but its pages don’t say how long a reservation lasts.',
      valueDating: 'Commerzbank’s own explainer says statements show both a booking date and a value date (Valuta), and the two needn’t match. Its example: a transfer executed on Friday, booked on Monday, carries a Tuesday value date; payments after the cut-off are processed the next business day. Its current price list leaves value dates to other documents and gives no rule for cards, and its pages don’t cite PSD2 or section 675t BGB.',
    },
    'de-postbank': {
      pendingWords: 'Postbank says a card payment stays among the reserved transactions (vorgemerkte Umsätze) until it’s posted to the checking account, and that it already counts against the balance. Its debit card terms say a blocked amount is released without delay once the exact amount is known or the payment order arrives. Postbank’s own pages don’t confirm a number of days.',
      valueDating: 'Statements carry a value date. Postbank’s price list (sec. 10) value-dates incoming transfers on the day the money arrives, cash deposits on the deposit day, and outgoing transfers, direct debits and checks on the day the money leaves the account. The credit card is a charge card: each monthly statement falls due when it’s issued and is debited in one sum from the linked checking account. Postbank doesn’t cite PSD2 or section 675t BGB.',
    },
    'de-ing': {
      valueDating: 'ING’s pages don’t give its value dates. They say a deposit that’s never collected, such as a hotel or rental-car hold, drops off the reserved list after a few days, and that foreign-currency and partly canceled payments can differ.',
    },
    'ie-bank-of-ireland': {
      valueDating: 'Bank of Ireland’s terms promise a record of every transaction showing its debit or credit value date. An incoming payment received on a banking day before cut-off, with no currency conversion, is credited the same banking day, and SEPA instant transfers are credited on any calendar day. Card purchases reduce the balance immediately but only reach the statement once fully processed; a lodged check shows on the statement the day it’s paid in even though it hasn’t cleared.',
    },
    'ie-ptsb': {
      valueDating: 'PTSB credits funds received before the cut-off on a business day to the account that day, and they start earning interest from the date received. Funds after cut-off count as the next business day. The cut-off is 6 p.m., or 5 p.m. for checks and 4 p.m. for international payments. PTSB’s full terms couldn’t be opened, so what its statement shows isn’t confirmed.',
    },
    'gb-natwest': {
      paymentHoldWords: 'NatWest says a payment to the credit card should update the balance within 15 minutes in the app and Online Banking. Between 6:30 p.m. and 2:30 a.m. a cleared pending transaction may briefly be left out of the balance and available spend.',
    },
    'nz-asb': {
      paymentHoldWords: 'A credit card payment made before 8:30 p.m. is processed overnight (after 8:30 p.m., the next night) and shows as pending until then; ASB doesn’t describe holding back the freed credit after that.',
    },
    'jp-mufg': {
      pendingWords: 'MUFG Debit takes the money at once, and when a purchase is canceled the refund depends on how the merchant processes it: up to about a month and a half for Visa debit and about two months for JCB debit. Until the merchant’s cancelation goes through, the amount can be taken twice, and the duplicate comes back within that same window.',
    },
    'jp-resona': {
      pendingWords: 'If a shop doesn’t send cancelation data, Resona’s Visa debit refunds the charge automatically about 45 days after the debit; the authorization lapses if no sales data arrives within 45 days. You can call to ask for an earlier refund, but it isn’t guaranteed.',
    },
    'jp-japan-post-bank': {
      pendingWords: 'Japan Post Bank refunds a Yucho Debit return once it receives the merchant’s refund data, and when a return or cancelation leaves a double debit, the duplicate comes back later and can take up to about two months depending on the merchant.',
    },
  },
};

const merge = (edits, file, exports) => {
  for (const [name, entries] of Object.entries(readDaysFor(file, exports))) {
    edits[name] ??= {};
    for (const [key, fields] of Object.entries(entries)) edits[name][key] = { ...edits[name][key], ...fields };
  }
  return edits;
};

/** `node apply-gen.mjs src/engine/content/pending.ts b3-pending.mjs …` applies this; `cash.ts` takes `b3-cash.mjs`. */
export default merge(pending, 'src/engine/content/pending.ts', { PENDING: [] });
export const cash = merge({}, 'src/engine/content/cash.ts', { CASH: [] });
