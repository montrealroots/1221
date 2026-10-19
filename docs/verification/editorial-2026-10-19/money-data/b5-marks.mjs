/** Batch 5's second-pass statuses, and the three generated sources batch 5's source-line fix changed again. */
import { readFileSync } from 'node:fs';

const RENDER = 'docs/verification/editorial-2026-10-19/money-data/render-panels.test.ts';
const WORLD = `The Accounts tab drawn at each world bank with a product sheet, and one without in each country, by ${RENDER} with BANKS=world (rendered/accounts-world.txt), the source line read under Sources And Estimates`;
const changed = readFileSync(new URL('b5-changed-sources.txt', import.meta.url), 'utf8').trim().split('\n').filter((id) => id.includes('#SHEETS'));

export default [
  { id: 'src/engine/content/security.ts#SECURITY', status: 'Rewritten', evidence: `Your Cards drawn at each of the 60 banks by ${RENDER} (rendered/security.txt); tests/evidence2-b04.test.ts asserts Wells Fargo's rush words on the screen` },
  { id: 'src/engine/content/accountlife.ts#ACCOUNT_LIFE', status: 'Rewritten', evidence: `Your Accounts Over Time drawn at all 60 banks with a term deposit and a dormant savings account by ${RENDER} (rendered/accountlife.txt); tests/evidence-g10-money.test.ts asserts Citi's penalty and Capital One's dormancy words on the screen` },
  { id: 'src/engine/content/pending.ts#PENDING', status: 'Rewritten', evidence: `Statements drawn at all 60 banks, and the card with a payment hold, by ${RENDER} (rendered/statements.txt, rendered/card.txt); tests/language-data-dates.test.ts asserts Chase's source on Statements` },
  { id: 'src/engine/content/banks-world.ts#ROWS', status: 'Retained', reason: 'The world’s banks by the names their customers use, with the abbreviation in brackets where the bank goes by one (BKT, BNA, BIC-Comores), and the page each was found on: real names, which the game shows as they are spelled.' },
  { id: 'src/engine/content/banks-world.ts#worldBanking', status: 'Rewritten', evidence: WORLD },
  { id: 'src/engine/content/banks-world-fees.ts#WORLD_FEES', status: 'Rewritten', evidence: WORLD },
  { id: 'src/engine/content/banks-world-iban.ts#*', status: 'Retained', reason: 'IBAN structures in the IBAN Registry’s own notation (“3!n11!n”) and each bank’s code inside its IBANs, which banks.ts reads to build an account number; no screen prints these strings, only the number built from them.' },
  { id: 'src/engine/content/banks-world-sheets.ts#SHEETS *', status: 'Retained', reason: 'Each country’s banks’ product names as the banks sell them, and source lines that cite the bank’s own page with a short note of the fee, rate or condition read there, at the foot of the Accounts tab; the interest-tax notes no screen shows, since the tab prints a note only for a tax that comes back.' },
  ...changed.map((id) => ({ id, status: 'Rewritten', evidence: WORLD })),
];
