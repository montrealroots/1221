/** The before-and-after pairs that `examples.mjs` writes to examples.json, batch by batch. */
const SEC = { file: 'b1-security-changes.json', sourceFile: 'src/engine/content/security.ts' };
const SEEN = 'read on Your Cards, rendered/security.txt (render-panels.test.ts)';
const LIFE = { file: 'b2-accountlife-changes.json', sourceFile: 'src/engine/content/accountlife.ts' };
const PEND = { file: 'b3-pending-changes.json', sourceFile: 'src/engine/content/pending.ts' };
const CASHF = { file: 'b3-cash-changes.json', sourceFile: 'src/engine/content/cash.ts' };
const SEEN3 = 'read on Statements, rendered/statements.txt (render-panels.test.ts)';
const SEEN2 = 'read on Your Accounts Over Time with a term deposit and a dormant savings account, rendered/accountlife.txt (render-panels.test.ts)';
import { readFileSync } from 'node:fs';

/** A hand-kept file's change, by its key in the batch's change record: its before and after, verbatim. */
const fromText = (changes, file, key) => {
  const c = JSON.parse(readFileSync(new URL(changes, import.meta.url), 'utf8')).find((x) => x.file === file && x.key === key);
  if (!c) throw new Error(`no change ${key} in ${changes}`);
  return { source: `${file} (${key})`, before: c.before, after: c.after };
};

export const PICKS = [
  // Batch 1: security.ts
  { ...SEC, export: 'FRAUD_LAW', key: 'US', field: 'debitWords', kind: 'official', meaningSensitive: true,
    why: 'The law the most players read, said as what you pay and when, with the citation at the end. Every figure and both clocks kept: $50 within two business days of finding out, $500 after, and all of it after 60 days from the statement.',
    verified: `${SEEN}, Chase; tests/language-money.test.ts asserts its opening; the tiers checked against FRAUD_LAW.US.debitTiers (2 business days, $50; 60 days from the statement, $500; then none)` },
  { ...SEC, export: 'FRAUD_LAW', key: 'US', field: 'refundWords', kind: 'official', meaningSensitive: true,
    why: 'Plain words for "provisionally credit". "Out-of-state" misread Regulation E, whose 90 days are for a transfer not initiated within a state, that is, from outside the US: said so (defects.md, 1).',
    verified: `${SEEN}, Chase; 12 CFR 1005.11(c)(3) read on consumerfinance.gov/rules-policy/regulations/1005/11/ on October 19, 2026: 20 business days for a transfer within 30 days of the first deposit; 90 days for one "not initiated within a state", from a point-of-sale debit card transaction, or within 30 days of the first deposit` },
  { ...SEC, export: 'SECURITY', key: 'ie-bank-of-ireland', field: 'lostCardWords', kind: 'official', meaningSensitive: true,
    why: 'A code name, "(standardDays is the upper bound)", reached the screen. It now says what the game does with the bank\'s range: it takes 7 working days.',
    verified: `${SEEN}, Bank of Ireland; SECURITY['ie-bank-of-ireland'].standardDays is 7` },
  { ...SEC, export: 'SECURITY', key: 'jp-mufg', field: 'replaceWords', kind: 'official', meaningSensitive: true,
    why: '"standardDays = 8 business days" was the research\'s note to itself. It becomes the game\'s assumption, labelled as the game\'s; yen written as the game writes them.',
    verified: 'SECURITY[\'jp-mufg\'].standardDays is 8; read in the file (both of MUFG\'s fees are listed, so the panel shows its own figures, not these words)' },
  { ...SEC, export: 'SECURITY', key: 'ca-td', field: 'suspectWords', kind: 'official', meaningSensitive: false,
    why: 'Spoken to the player, not about "the credit cardholder", and one long semicolon chain made three steps: what TD does, what each reply does, and what it doesn\'t cover.',
    verified: `${SEEN}, TD` },
  { ...SEC, export: 'SECURITY', key: 'de-deutsche-bank', field: 'lostCardWords', kind: 'official', meaningSensitive: false,
    why: '"The customer blocks" became an instruction to the player; an app path written with ">" arrows became words, as the game names a place on screen; "no self-service temporary freeze was found" became what the bank does and doesn\'t describe.',
    verified: `${SEEN}, Deutsche Bank` },
  { ...SEC, export: 'SECURITY', key: 'es-santander', field: 'suspectWords', kind: 'official', meaningSensitive: false,
    why: 'It opened on a fragment, "Not found on Santander Spain\'s own pages.", that left the player guessing what wasn\'t found.',
    verified: `${SEEN}, Santander (Spain)` },
  { ...SEC, export: 'SECURITY', key: 'kr-kb-kookmin', field: 'replaceWords', kind: 'official', meaningSensitive: true,
    why: 'Shown only under the credit card (the debit card\'s fee is listed), it spoke only of the check card, then "The game charges nothing for it." It now starts with the card it sits under.',
    verified: `${SEEN}, KB Kookmin, under the KB국민 credit card; SECURITY['kr-kb-kookmin'] lists replaceFeeDebit and no replaceFeeCredit` },
  { ...SEC, export: 'SECURITY', key: 'fr-bnp-paribas', field: 'replaceWords', kind: 'official', meaningSensitive: true,
    why: '"The credit figure is the deferred-debit Visa Classic, which falls under the same line" was how the research took a figure. It now says what the game does: it prices the credit card as that card.',
    verified: 'read in the file; both fees are listed (€15), so the panel shows the figure, and these words only where a fee is missing' },
  { ...SEC, export: 'SECURITY', key: 'gb-barclays', field: 'lostCardWords', kind: 'official', meaningSensitive: false,
    why: 'Second person, the steps in the order the player meets them, and "others must be told by the customer" said as what the player has to do.',
    verified: `${SEEN}, Barclays` },
  { ...SEC, export: 'SECURITY', key: 'us-wells-fargo', field: 'rushUnpublished', kind: 'official', meaningSensitive: false,
    why: 'The bank\'s sentence stays a quotation, word for word, in its marks; the game\'s words around it are now a plain statement of what the bank offers and what it doesn\'t price.',
    verified: `${SEEN}, Wells Fargo; tests/evidence2-b04.test.ts asserts the whole sentence, with the screen's "With no fee published, the game doesn’t offer a rushed card." after it` },
  { ...SEC, export: 'SECURITY', key: 'mx-banorte', field: 'source', kind: 'label', meaningSensitive: false,
    why: 'A source line printed ".," where a note on the live site met the next part. The note now joins the reading it explains.',
    verified: `${SEEN}, Banorte's Sources And Estimates` },

  // Batch 2: accountlife.ts
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'us-chase', field: 'penaltyWords', kind: 'official', meaningSensitive: true,
    why: 'A list of terms in shorthand ("term under 6 months, 90 days\' interest…; …: at least 7 days\' interest") became sentences about the amount you take out, in the order a player asks: what it costs, the limit, the first-week rule, where it comes from.',
    verified: `${SEEN2}, Chase; each band against ACCOUNT_LIFE['us-chase'].penaltyDays (6 months 90, 24 months 180, then 365), penaltyCapped and penaltyFirstWeekDays 7` },
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'ie-ptsb', field: 'penaltyWords', kind: 'official', meaningSensitive: true,
    why: 'The charge was printed as a formula with letters ("1% x A x T/365 or A x T x D%/365 (A = …)"). The same two charges in words, the greater of them, and the €20 floor.',
    verified: `${SEEN2}, PTSB; 1% x A x T/365 is 1% a year on the amount for the days left, A x T x D%/365 the rate difference a year on it` },
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'mx-banorte', field: 'dormancyWords', kind: 'official', meaningSensitive: true,
    why: 'A semicolon chain in parentheses became the three things a player needs in order: when the bank moves it, that it\'s still theirs there, and when it goes for good. Shared by Mexico\'s four banks.',
    verified: `${SEEN2}, Banorte; the 3 and 3 years against UNCLAIMED.MX.years (6) and dormantMonths (36)` },
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'kr-kb-kookmin', field: 'maturityWords', kind: 'official', meaningSensitive: true,
    why: 'Korean terms left untranslated (만기후이율) and "base x50%" shorthand. The Korean stays beside its English, once, so a player can find it on the bank\'s page.',
    verified: `${SEEN2}, KB Kookmin` },
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'jp-smbc', field: 'dormancyWords', kind: 'official', meaningSensitive: true,
    why: 'Japanese terms with no English, "≥ ¥10,000", "Then:" and a note on where the research found the rule ("rule cited from Japan Post Bank\'s page") became sentences; the provenance is kept, said as the game\'s note.',
    verified: `${SEEN2}, SMBC` },
  { ...LIFE, export: 'UNCLAIMED', key: 'MX', field: 'to', kind: 'notification', meaningSensitive: true,
    why: 'The field is a destination, printed as "… went to <it> after years unused." and in the bank\'s question and notice. A clause had been put there, so the screen read "went to after 3 years without movement the balance goes to …". It names the recipient now; the steps moved to claimBack.',
    verified: `${SEEN2}, Banorte's unclaimed line; systems/accountlife.ts prints it in "it goes to … as unclaimed money" and "… went to …"` },
  { ...LIFE, export: 'UNCLAIMED', key: 'CA', field: 'claimBack', kind: 'notification', meaningSensitive: false,
    why: 'Printed after a full stop, it began "yes, claim from …", in lower case. Every country\'s now reads as sentences after "… went to … after years unused."',
    verified: `${SEEN2}, RBC's unclaimed line` },
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'us-citi', field: 'source', kind: 'label', meaningSensitive: false,
    why: 'A bare day after a web address read as the page\'s date. It\'s the day the page was read, as the glossary\'s Source line says it.',
    verified: `${SEEN2}, Citi: "Source: the bank’s terms, https://online.citi.com/JRS/popups/ao/CDAA.pdf, read September 26, 2026."` },
  { ...LIFE, export: 'ACCOUNT_LIFE', key: 'jp-mufg', field: 'penaltyWords', kind: 'official', meaningSensitive: true,
    why: 'A rate table in shorthand ("<6 months = …; 6m-1y = … ×70%") said as bands in words, with the product\'s Japanese name kept as the bank writes it and glossed once.',
    verified: `${SEEN2}, MUFG; the bands against EARLY_RATE['jp-mufg'] (systems/accountlife.ts: under 6 months the ordinary rate, then 70%)` },

  // Batch 3: pending.ts and cash.ts
  { ...PEND, export: 'PENDING', key: 'ca-bmo', field: 'pendingWords', kind: 'official', meaningSensitive: false,
    why: 'After "A card payment:", it opened on a fragment with no subject, "Couldn\'t find a figure…", the research talking to itself. It now says what BMO\'s pages do and don\'t give, and why the game doesn\'t use the US figures.',
    verified: `${SEEN3}, BMO, followed by the screen's "How long a card payment stays pending is estimated: the bank doesn’t say."` },
  { ...PEND, export: 'PENDING', key: 'jp-mufg', field: 'pendingWords', kind: 'official', meaningSensitive: true,
    why: 'It ended "(31 is about 45 calendar days in business days.)": a note on a number that isn\'t in the data any more (MUFG\'s pendingDays is 0) and that the player never sees.',
    verified: `${SEEN3}, MUFG; PENDING['jp-mufg'] holds pendingDays 0 and no 31` },
  { ...PEND, export: 'PENDING', key: 'ie-bank-of-ireland', field: 'valueDating', kind: 'official', meaningSensitive: false,
    why: 'Shown after "Value dates:", it began "Yes.", the answer to a question the player was never asked.',
    verified: `${SEEN3}, Bank of Ireland` },
  { ...PEND, export: 'PENDING', key: 'de-commerzbank', field: 'pendingWords', kind: 'official', meaningSensitive: false,
    why: 'The German the screen shows as Commerzbank\'s own words is spelled as the bank spells it, "vorgemerkte Umsätze", not "Umsaetze".',
    verified: `${SEEN3}, Commerzbank` },
  { ...PEND, export: 'PENDING', key: 'ie-ptsb', field: 'valueDating', kind: 'official', meaningSensitive: false,
    why: '"6pm" as the game writes a time in a sentence, and "PTSB\'s full terms PDF was blocked" said as what the player needs: the terms couldn\'t be opened, so what the statement shows isn\'t confirmed.',
    verified: `${SEEN3}, PTSB` },
  { ...PEND, export: 'PENDING', key: 'fr-lcl', field: 'pendingWords', kind: 'official', meaningSensitive: false,
    why: '"Jan 29 and Feb 26" in the game\'s date form; the dates step reads only a short month with a year, so these were left.',
    verified: `${SEEN3}, LCL` },
  { ...PEND, export: 'PENDING', key: 'is-landsbankinn', field: 'pendingWords', kind: 'official', meaningSensitive: true,
    why: '"The 3 is the bank\'s deadline for merchants in its acquiring terms" named a number by its digit and a contract by its trade name. It says what the three days are, whose deadline they are, and that they\'re calendar days.',
    verified: `${SEEN3}, Landsbankinn` },
  { ...PEND, export: 'PENDING', key: 'us-wells-fargo', field: 'source', kind: 'label', meaningSensitive: false,
    why: 'Two days ended the source line, the agreement\'s and a bare one; the second is the day the page was read, and says so.',
    verified: `${SEEN3}, Wells Fargo: "…active-cash-agreement/), read September 26, 2026."` },
  { ...CASHF, export: 'CASH', key: 'us-chase', field: 'source', kind: 'label', meaningSensitive: false,
    why: 'The fee guide\'s address then a bare day read as the guide\'s date; it\'s the day it was read.',
    verified: 'read on Payments And Cash, rendered/cash.txt; tests/language-data-dates.test.ts holds it to /, read September 26, 2026$/ and to the screen' },

  // Batch 4: banks-thirteen.ts, banks-lending.ts, bankopening.ts (hand-kept; picked by key from b4-banks-changes.json)
  ...[
    ['us-wells-fargo.current.source', 'src/engine/content/banks-thirteen.ts', true, '"(kept here as an average)" and "has no one to apply to" were the research speaking about the game. Both say what the game does: it takes the linked balance as an average, and the military waiver applies to no one in it.', 'rendered/accounts.txt, Wells Fargo’s Everyday Checking under Sources And Estimates; waiver.linkedAverageAtLeast in the data is the average'],
    ['ca-cibc.savings.source', 'src/engine/content/banks-thirteen.ts', true, '"applied here … not modeled" said as the game\'s: it applies the tier\'s rate to the whole balance and leaves out the bonus and top-up.', 'rendered/accounts.txt, CIBC; tiers: [{ from: 100_000_00, rate: 0.006 }] in the data applies to the whole balance'],
    ['fr-societe-generale.current.source', 'src/engine/content/banks-thirteen.ts', true, '"(€2.55 a month here)" left the player to guess where "here" was. It\'s the game\'s monthly share of a quarterly fee, and says so.', 'rendered/accounts.txt, SG; monthlyFee 2_55 is €7.65 / 3'],
    ['is-landsbankinn.current.source', 'src/engine/content/banks-thirteen.ts', false, '"the current account" in the game\'s own words is the glossary\'s checking account from this brief; "fees not found" became a sentence.', 'rendered/accounts.txt, Landsbankinn'],
    ['kr-hana.current.source', 'src/engine/content/banks-thirteen.ts', false, '"not modeled" at the end of a clause said as what the game leaves out.', 'rendered/accounts.txt, Hana Bank'],
    ['SWITCHING.IS.scheme', 'src/engine/content/banks-lending.ts', false, 'The screen prints it after "Through the" and "The": "Through the account switching under Act 5/2023" didn\'t read as the name of anything. It names a service now.', 'rendered/lending.txt and rendered/moves.txt, Arion: "Through the account-switching service of Act 5/2023: 12 working days, …"'],
    ['SWITCHING.ES.source', 'src/engine/content/banks-lending.ts', true, '"13 is the steps added up, not a single stated limit" said as the game\'s figure and why: the law gives the steps, not a total.', 'rendered/lending.txt, Santander (Spain); workingDays: 13 is 2 + 5 + 6'],
    ['fr-bnp-paribas.overdraft.source', 'src/engine/content/banks-lending.ts', false, '"15.90% and 2.50 more" left "more" without a unit: it\'s percentage points.', 'rendered/lending.txt, BNP Paribas'],
    ['TRANSFERS.GB.source', 'src/engine/content/bankopening.ts', false, '"… isn\'t kept" is the research\'s phrase for what the game leaves out, and says so now.', 'rendered/moves.txt, a British bank’s Sources And Estimates'],
  ].map(([key, file, ms, why, seen]) => ({ ...fromText('b4-banks-changes.json', file, key), kind: 'label', meaningSensitive: ms, why, verified: `read on ${seen}` })),

  // Batch 5: the world's banks (hand-kept; picked by key from b5-world-changes.json), and the generated files' diagnostics
  ...[
    ['DK.Danske', 'src/engine/content/banks-world-sheets.ts', true, '"shown as monthly" was the research describing the game in the passive; the game charges a quarter\'s fee as a month\'s share, and says so.', 'rendered/accounts-world.txt, Danske Bank; monthlyFee 3500 is DKK 105 / 3'],
    ['KZ.Kaspi', 'src/engine/content/banks-world-sheets.ts', true, '"shown here as 1,995/12" put a formula where a sentence belongs.', 'rendered/accounts-world.txt, Kaspi Bank; monthlyFee is 1,995 / 12'],
    ['BH.NBB', 'src/engine/content/banks-world-sheets.ts', false, '">=" in a sentence the player reads is a symbol standing for words.', 'rendered/accounts-world.txt, National Bank of Bahrain'],
    ['PK.HBL', 'src/engine/content/banks-world-sheets.ts', false, '"/month" and "<" written out, and the balance given its article.', 'rendered/accounts-world.txt, HBL'],
    ['worldBanking.current.source', 'src/engine/content/banks-world.ts', false, '"no product sheet on record; the bank from <address>" named the research\'s files and left "from" hanging. It says what wasn\'t researched, what the game does about it, and where the bank was found.', 'rendered/accounts-world.txt, a bank with no sheet in each country (Afghanistan International Bank, and the rest)'],
    ['GU|Bank of Guam', 'src/engine/content/banks-world-fees.ts', false, '"e-Statements are taken as chosen" said who takes them so: the game.', 'rendered/accounts-world.txt, Bank of Guam'],
  ].map(([key, file, ms, why, seen]) => ({ ...fromText('b5-world-changes.json', file, key), kind: 'label', meaningSensitive: ms, why, verified: `read on ${seen}` })),
  { file: 'b5-diagnostics-pending-changes.json', sourceFile: 'src/engine/content/pending.ts', export: 'PENDING', key: 'es-bankinter', field: 'source', kind: 'label', meaningSensitive: false,
    why: 'A web server\'s status code, "(HTTP 403)", is a diagnostic, not a source; and the line ended on a stop before the day, so the screen read "dates., read …".',
    verified: 'read on Statements, rendered/statements.txt, Bankinter' },
  { file: 'b5-diagnostics-security-changes.json', sourceFile: 'src/engine/content/security.ts', export: 'SECURITY', key: 'ie-ptsb', field: 'source', kind: 'label', meaningSensitive: false,
    why: '"as ptsb.ie returns 403" said as what it means: the bank\'s site couldn\'t be opened, so the archive was read.',
    verified: 'read on Your Cards, rendered/security.txt, PTSB' },

  // Batch 6: round-ups and rents (hand-kept; picked by key from b6-changes.json)
  ...[
    ['DROPPED_UNSAID', 'src/engine/content/roundups.ts', true, 'After "When the account is short:", "nothing moves that day, all or nothing, … and what was counted is dropped" said one thing twice and ended in the passive. It says what doesn\'t move, that it isn\'t partial or overdrawn, and that it\'s dropped, with the bank\'s silence last.', 'rendered/roundups.txt, at the seven banks that share it (BBVA México, Santander México, Santander, Sabadell, Bankinter, ANZ, and others); systems/roundups.ts: "all or nothing, and never into an overdraft; what couldn’t move is dropped"'],
    ['kr-kakaobank.words', 'src/engine/content/roundups.ts', false, '"the day before\'s closing balance under 1,000원" read as a possessive on a day; the won in the game\'s form, ₩1,000, as Your Cards and the rest of Money write it.', 'rendered/roundups.txt, KakaoBank'],
    ['mx-santander.open', 'src/engine/content/roundups.ts', true, '"… is inferred, not stated" was the research\'s note in the passive, and "the current account" the old word. It says what Santander doesn\'t say and what the game does.', 'rendered/roundups.txt, Santander México'],
    ['newyork (order)', 'src/engine/content/rents.ts', true, 'The place look prints "<measure>, <period>; source: …", so the room\'s provenance in the measure put the one-bedroom\'s "FY2026" after it. Each date now follows what it dates, in words.', 'rendered/places.txt, New York: "HUD’s Fair Market Rent, the 40th percentile rent, utilities included, fiscal year 2026; the room’s rent is SpareRoom’s, for the second quarter of 2026; source: …"'],
    ['seoul', 'src/engine/content/rents.ts', false, '"normalized to a 10 million won deposit" said plainly, with the won as the game writes them.', 'rendered/places.txt, Seoul'],
    ['mosfellsbr (span)', 'src/engine/content/rents.ts', false, 'A span of months in the glossary\'s form, "to", not an en dash.', 'rendered/places.txt, Mosfellsbær'],
    ['kr-kakaobank.short', 'src/engine/content/roundups.ts', false, 'After "When the account is short:", a fragment with no subject ("Skipped when …, never partial and never overdrawn") became a sentence about the sweep.', 'rendered/roundups.txt, KakaoBank'],
    ['berlin', 'src/engine/content/rents.ts', true, '"warm" is German renting\'s word for a rent with heating; the English says so, and keeps the word in brackets for a player who meets it on a listing.', 'rendered/places.txt, Berlin'],
    ['sydney', 'src/engine/content/rents.ts', false, '"700 a week" gave a figure with no currency, in a look the player may read in dollars of another country; it\'s A$700.', 'rendered/places.txt, Sydney'],
  ].map(([key, file, ms, why, seen]) => ({ ...fromText('b6-changes.json', file, key), kind: key.includes('DROPPED') ? 'feedback' : 'label', meaningSensitive: ms, why, verified: `read on ${seen}` })),
];
