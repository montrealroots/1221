/** Batch 4's second-pass statuses, in order: each country's banks Retained by pattern, then the ones changed Rewritten. */
const T = 'src/engine/content/banks-thirteen.ts';
const L = 'src/engine/content/banks-lending.ts';
const O = 'src/engine/content/bankopening.ts';
const R = (id, reason) => ({ id, status: 'Retained', reason });
const W = (id, evidence) => ({ id, status: 'Rewritten', evidence });
const ACCOUNTS = 'The Accounts tab drawn at each of the 60 banks by docs/verification/editorial-2026-10-19/money-data/render-panels.test.ts (rendered/accounts.txt), the source line read under Sources And Estimates';
const LENDING = 'Borrowing, term deposits and switching drawn at each bank by docs/verification/editorial-2026-10-19/money-data/render-panels.test.ts (rendered/lending.txt)';
const MOVES = 'Open An Account At Another Bank drawn at each bank by docs/verification/editorial-2026-10-19/money-data/render-panels.test.ts (rendered/moves.txt), its Sources And Estimates read';

export default [
  R(`${T}#THIRTEEN [us-*`, 'The US banks’ product names as each bank spells them (Chase Total Checking, Advantage Plus Banking, Citi Access Checking, 360 Checking and their savings), source lines naming the page each fee, waiver and APY was read on, and Citi’s and Capital One’s one-sentence overdraft notes, which say plainly that no fee is charged.'),
  R(`${T}#THIRTEEN [ca-*`, 'The Canadian banks’ product names as each bank spells them (RBC Signature No Limit Banking, TD Unlimited Chequing, Preferred Package and their savings), with source lines naming the page, the monthly fee and the balance that waives it, and canada.ca’s rule on a returned payment in its own figures.'),
  R(`${T}#THIRTEEN [mx-*`, 'The Mexican banks’ product names as they spell them (Libretón Básico Cuenta Digital, Cuenta Enlace Personal, Débito LikeU, Ahorro Fácil), and source lines that say what each page gives, a quoted “sin intereses”, the quiet-month fee with its VAT, and which page couldn’t be read.'),
  R(`${T}#THIRTEEN [gb-*`, 'The British banks’ product names as they spell them (Barclays Bank Account, Classic Account, FlexAccount and their savers), with short source lines that name the bank’s page, its AER and the day it applies from, at the foot of the Accounts tab.'),
  R(`${T}#THIRTEEN [ie-*`, 'Bank of Ireland’s and PTSB’s product names, Personal Current Account, Explore Account and Demand Deposit Account, as the banks spell them, with source lines giving each monthly fee and AER and, for PTSB, that there have been no waivers since 2023.'),
  R(`${T}#THIRTEEN [is-*`, 'Arion’s product names, Veltureikningur and Vöxtur, as the bank spells them, its rate table’s four tiers given in full in the source line, and its debit card’s price, per-purchase fee and age rule with the day the price list was read.'),
  R(`${T}#THIRTEEN [fr-*`, 'BNP Paribas’s Compte de dépôt and Livret A as the bank names them, with source lines giving its €2.60 account fee, free from 18 to 24, and the Livret A’s tax-free 1.7% paid once a year at the end of December, each with the page it comes from.'),
  R(`${T}#THIRTEEN [de-*`, 'The German banks’ product names as they spell them (AktivKonto, Giro plus, Girokonto, Giro Digital, Flexgeld, Extra-Konto), with source lines giving each fee, the condition that cuts or waives it, the day the price list was read, and the Sparkassen-Card’s yearly price and refund rule.'),
  R(`${T}#THIRTEEN [es-*`, 'The Spanish banks’ product names as they spell them (Cuenta Santander, Cuenta Online Sin Comisiones, Cuenta Ahorro Sabadell), with source lines giving each fee’s waiver in the bank’s own term, the nómina, and each account’s TIN and TAE.'),
  R(`${T}#THIRTEEN [jp-*`, 'The Japanese banks’ accounts named as the banks write them, 普通預金 and 通常貯金, each with its English in brackets, and source lines giving the rate now and the one from November, the months interest is paid, and the unused-account fees with what spares the game’s accounts.'),
  R(`${T}#THIRTEEN [kr-*`, 'The Korean banks’ accounts named as the banks write them, each with “everyday account” or “savings box” in English beside it, and source lines of a few words giving each rate, the page it’s from and that there’s no maintenance fee.'),
  R(`${T}#THIRTEEN [au-*`, 'The Australian banks’ product names as they spell them (Everyday Account Smart Access, Westpac Choice, NAB Classic Banking and their savers), with source lines giving the monthly fee, the deposit that waives it, and each saver’s base rate and the condition for its bonus month.'),
  R(`${T}#THIRTEEN [nz-*`, 'The New Zealand banks’ product names as they spell them (ANZ Go, ASB Streamline, YouMoney, Westpac Everyday, Free Up and their savers), with source lines of a few words naming the page and the rate it gives.'),
  R(`${T}#ARION_CARD_YEAR`, 'Arion’s card year in the words the screen shows: Reykjavík, Iceland’s Act on Payment Services, art. 57, and the reason the timing is estimated, that Arion’s price list and terms don’t say when in the year the fee is charged.'),
  R(`${T}#NOT_FOUND`, '“no published rate found” is read back by the Accounts tab, which tests a product’s source for /no published rate/ (BankWorkspace.tsx), so it’s a key, and the screen says it to the player in its own sentence.'),
  ...['us-wells-fargo', 'ca-scotiabank', 'ca-bmo', 'ca-cibc', 'gb-natwest', 'ie-aib', 'is-landsbankinn', 'is-islandsbanki', 'fr-societe-generale', 'fr-lcl', 'fr-credit-agricole', 'fr-la-banque-postale', 'de-commerzbank', 'es-caixabank', 'es-bankinter', 'kr-hana'].map((id) => W(`${T}#THIRTEEN [${id}]`, ACCOUNTS)),
  W(`${T}#THIRTEEN`, `${ACCOUNTS}; Iceland's interest-tax note read on Arion's and Landsbankinn's Accounts tab, and Mexico's and Germany's notes, which no screen shows, read in the file`),
  R(`${L}#LENDING *`, 'Each bank’s overdraft, personal loan and term deposit source line: the page or price list read, the rate, fee and limits in the bank’s own terms (EAR, APR, TAEG, TIN), and whether a figure is from another site, said once at the foot of Borrowing, with the bank’s own product names (CD, GIC, Festgeld).'),
  R(`${L}#*_LOAN`, 'The market averages used where a country’s banks publish no loan rate: the Banque de France’s, the ECB’s and the Banco de España’s, each named with its month, so Borrowing says whose figure it is.'),
  R(`${L}#*_TERM`, 'The market averages used where a country’s banks publish no term deposit rate, named as each country names the product (Dépôt à terme, Festgeld, Depósito a plazo fijo) with whose figure it is and its month.'),
  W(`${L}#LENDING [per_item]`, LENDING),
  W(`${L}#SWITCHING`, `${LENDING}; the Iceland scheme's name read in "Through the account-switching service of Act 5/2023" there and in rendered/moves.txt`),
  W(`${O}#OPENING`, MOVES),
  W(`${O}#TRANSFERS`, MOVES),
];
