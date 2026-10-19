# Brief 15: The Money Data Area

The record of `prompts/money-data.md`, on the branch `ed15-money-data`, from `6d111b49`. 522 sources in 15 files, every
one Pending in the second pass at the start. Each batch below says what was read, what changed and what stayed, how the
meaning was checked, and what ran.

## How The Data Is Changed And Read

- **The five generated files** (`security.ts`, `accountlife.ts`, `pending.ts`, `cash.ts`, and `cards.ts`, which isn't
  this area's) hold their data as `JSON.parse("…")` of a generator's output, and the generators were never in the
  repository. `apply-gen.mjs` rewrites a field in the generator's own form, as `tools/research-dates.mjs --write` does,
  and refuses a field that doesn't exist, so an edit can't add one. Each batch's edits are a module
  (`b1-security.mjs`, …), and each change's before and after is kept (`b1-security-changes.json`, …).
  `node tools/research-dates.mjs` exits 0 after every batch: no date left in a form the game doesn't write.
- **The screens.** `render-panels.test.ts`, run alone with `render.config.mts` (never in the suite), makes a life at
  each of the 60 banks in a city of its country (a New York student for a US bank) and draws the bank's panels as the
  player has them, with react-dom/server, as `tests/language-data-dates.test.ts` does. The words go to `rendered/`.
  That's where each rewrite was read in place, with the screen's own words around it.
- **What a screen shows** was found by grepping `src/ui` and `src/engine/systems` for each field's name. Each batch
  names the fields and their readers.

## Batch 1: `content/security.ts` (2 sources, 14,968 words)

### What the screen shows

Your Cards (`ui/bank/BankSecurity.tsx`), for the bank whose screen it is:
- `lostCardWords` and `suspectWords`, unlabelled, under the cards;
- `replaceWords`, as "The bank’s terms: … The game charges nothing for it.", under a card whose replacement fee the bank
  doesn't list;
- `rushUnpublished`, before "With no fee published, the game doesn’t offer a rushed card.";
- each country's `debitWords`, `creditWords` and `refundWords`, after "The law on the debit card:", "The law on the
  credit card:" and "The law on a payment you report as not yours:";
- `source`, both exports', joined in the Sources And Estimates line.

Not shown: `fraudBasis`, `avgLossBasis`, `preventedBasis` (no reader in `src/`, `grep -rn` of each name);
`avgLossCurrency` and every number, which the engine reads (`systems/security.ts`) and the guide prints through its own
words (`content/guide/money.ts`).

### What changed and what stayed

188 fields rewritten, 10 kept:
- **Written to the player.** Most of the banks' notes spoke of "the customer" or "the cardholder" in the third person,
  as research notes do, on a screen the player reads about their own cards. They now say "you", with the bank as the
  subject, and keep every number, phone line, app path and day count.
- **The engine's own notes, off the screen.** "(standardDays is the upper bound)" (Bank of Ireland, PTSB),
  "standardDays = 10 business days" (SMBC, Mizuho, Resona, Japan Post Bank, and MUFG's 8), "the credit figure applies
  the same card-replacement line to it" (Société Générale, LCL), "the credit figure is the deferred-debit Visa Classic"
  (BNP Paribas, Crédit Agricole, La Banque Postale): each now says what the game does, as the game's, in plain words
  ("so the game uses 10 business days", "the game prices its credit card as the deferred-debit Visa Classic").
- **The research's search, said as what the bank says.** "The pages read don't say…", "wasn't found on a page read",
  "Not found on Santander Spain's own pages." became "BNZ doesn't say whether it texts or calls you", "Santander
  Spain's own pages don't say how it flags a suspicious payment": the same limit on what's known, as a statement about
  the bank. Where only a search was made, it says so ("No fee was found for a new KB Kookmin credit card").
- **The laws** lead with what the player pays and when, and end with the citation. Every limit, clock, exception and
  citation stayed. "Strong customer authentication" is glossed once per law as "a second check, such as a code sent to
  your phone".
- **Under the card it sits under.** `replaceWords` shows only under a card whose fee isn't listed (BankSecurity.tsx).
  Where that's only the credit card (NatWest, AIB, Commerzbank, Resona, Japan Post Bank, KB Kookmin, Shinhan, KakaoBank)
  or only the debit card (Bankinter), the note now starts with that card. KB Kookmin's, Shinhan's and KakaoBank's spoke
  only of the check card, then said "The game charges nothing for it." under the credit card.
- **Currencies** as the game writes them (`formatMoney`): €15 not "15 EUR", 1,900 kr not "ISK 1,900", ¥1,100, ₩2,000,
  C$5.00, A$20, NZ$5; pesos as "169.50 pesos", since MX$ isn't how a Mexican bank's terms read in English.
- **Kept, with their reasons in the status and `retained.md`:** Bank of America's, Citi's, Bank of Ireland's and
  Westpac Australia's `suspectWords`, CommBank's and NAB's `lostCardWords`, Lloyds' `replaceWords`, Japan's
  `refundWords`, and 72 of the 73 source lines (citations: the documents and pages read, with the day). Banorte's source
  printed ".," where a note on the live site met the next part, and was mended.
- **Names as the game spells them elsewhere.** Banamex's and Banorte's "Clasica" stay unaccented, as the card's name is
  on the Cards tab (`content/cards.ts`, the money area's), so one card has one name on screen; the banks write
  "Clásica" (report). "Línea BBVA" is accented, as BBVA writes it, since nothing else names it.

### Meaning-sensitive changes, and how each was checked

- **The US debit card law.** Each tier against `FRAUD_LAW.US.debitTiers`: two business days from learning of it, $50;
  60 days from the statement, $500; then none. The words keep the law's own reading of the third tier (what's taken
  after the 60 days), not the game's.
- **The US refund law.** "Out-of-state" misread 12 CFR 1005.11(c)(3)(ii), whose 90 days are for a transfer "not
  initiated within a state", one from outside the US: read on consumerfinance.gov on October 19, 2026, and said so
  (defects.md, 1). The 20 business days are for a transfer within 30 days of the first deposit, as the words say.
- **Each "the game uses N" or "the game takes N"** against the bank's `standardDays` or `rushDays`: Bank of Ireland 7,
  PTSB 7, Landsbankinn 10 and 3, MUFG 8, SMBC, Mizuho, Resona and Japan Post Bank 10.
- **RBC's** "The game charges nothing for any of them." against `replaceFeeDebit: 0`: the bank charges C$5.00 from the
  second replacement in a year, and the game charges nothing for any, so the words now say so rather than letting the
  panel's "A new card is free." and the bank's fee stand side by side unexplained (defects.md, 3).
- **KB Kookmin's "60 days around the report"** became "the 60 days before your report": after the report the card
  can't be used at all, and the country's law (`creditWords`) counts the 60 days before. The only reading of "around"
  that has anything in it.
- **"Damaged" for "defective" or "faulty".** Kept apart. Arion's and Íslandsbanki's terms replace a faulty (defective)
  card free; the game's reasons are lost, stolen and damaged (`WHY_WORDS`), and a damaged card isn't a faulty one, so
  the words say faulty.
- **"Personalized" and "unpersonalized" cards** (Santander Mexico) became a card "with your name on it" and one
  "without your name": what the words mean on a card.
- No number, id or key moved: `apply-gen.mjs` writes only the named string fields, and `tests/security.test.ts`,
  `defects-g17-1`, `evidence-g11/12/13-money` and the rest, which play the fees, tiers and clocks, pass unchanged.

### Interactions read whole

Your Cards at each bank, top to bottom (`rendered/security.txt`): the panel's subtitle; each card's line and its fee
sentence (the money area's words) with the bank's terms where they show; Lock It, Report It and Report It And Rush The
New One; the new-number paragraph; then the bank's notes, the three laws and the sources. With them:
- the guide's Your Cards entry (`content/guide/money.ts`, `bank.card-security`), whose figures come from the same data
  through its own words;
- the refusals and the toast in `systems/security.ts` and BankSecurity.tsx.

The bank's notes now speak to the player as the panel above them does. The laws follow the same order the guide's
"What You Pay On A Debit Card" does: what you pay, then when.

### Tests and tool matchers

- `tests/language-money.test.ts`: "The law on the debit card: Under the Electronic Fund Transfer Act" became "The law
  on the debit card: If you report a lost or stolen debit card within two business days", the same `toContain` on the
  law's opening.
- `tests/evidence2-b04.test.ts`: Wells Fargo's rush sentence, the whole of it, as before, in its new words.
- No tool matcher held these words.

### Checks

- `npx tsc -b --noEmit`: exit 0 (`b1-tsc.txt`).
- `npx eslint` on the three changed files: exit 0 (`b1-eslint.txt`).
- `npx vitest run` on the 14 test files that touch the security data or Your Cards: 176 of 176, exit 0
  (`b1-tests.txt`).
- title-case, label-sweep, plural-check, voice-check, tics, spelling, typos, doc-refs, deciders, guide-quotes and
  research-dates: exit 0 each. text-inventory: exit 1 before the mark, on the two sources Pending; exit 0 once marked.
  Engine-speak stayed at 332 (`b1-checks.txt`).

### Screens verified

Your Cards at all 60 banks, `rendered/security.txt`, scanned for a field name, `undefined`, a doubled stop and a space
before punctuation: none.

## Batch 2: `content/accountlife.ts` (2 sources, 10,567 words), and the laws' source lines

### What the screen shows

Your Accounts Over Time (`ui/bank/BankAccountLife.tsx`), for the bank whose screen it is:
- `penaltyWords`, after what breaking a term deposit costs: "The bank’s terms: …" (`breakQuote`, `systems/accountlife.ts`);
- `maturityWords`, under a term deposit: "The bank’s terms at the end: …";
- `dormancyWords`, beside an inactive or dormant account: "The bank’s terms: …";
- `source`: "Source: the bank’s terms, …."

And each country's (`UNCLAIMED`, through `unclaimedLaw`):
- `to`, in "… went to <to> after years unused.", in the bank's question ("Unless you tell the bank to keep the account by
  …, it goes to <to> as unclaimed money.") and in the ledger's lines ("Unclaimed, to <to>", "Unclaimed money returned
  from <to>");
- `claimBack`, after the first and in the notice;
- `source`: "The country’s rules: …."

Not shown:
- the US's `to`, `claimBack` and `source`, which `unclaimedLaw` replaces with words about any state;
- Germany's `to` and `claimBack`, since with no `years` nothing moves (`idleAccounts`);
- `atEnd`, `endChoices` and the numbers, which the engine reads and the screen says in its own words (`END_WORDS`).

### What changed and what stayed

270 fields rewritten, 1 kept (ASB's `dormancyWords`), and the US's and Germany's unshown fields left:
- **Shorthand to sentences.** The research's notes ("term under 6 months, 90 days' interest; …", "<6m = ordinary
  savings rate; 6m-1y = … ×70%", "1% x A x T/365 (A = amount withdrawn …)", "≥ ¥10,000", "Then: 10 years …") became
  sentences about the player's deposit, with every band, rate, floor, cap and day kept, in the order a player asks: what
  it costs, the limits, then the exceptions.
- **Japanese and Korean terms** that stood alone ("만기후이율", "休眠預金等活用法", "거래중지계좌") are glossed in English,
  with the term kept once beside it so a player can find it on the bank's own page. Product names stay as the banks
  write them (スーパー定期, KB Star 정기예금, Fastvaxtareikningur, Festgeld).
- **Quotations** stay word for word in their marks ("cannot be redeemed before its maturity date", “la regulación
  aplicable no permite la cancelación anticipada”), with the game's English beside a Spanish or Japanese one, as the
  game's.
- **Sources outside the bank** said as such: "third-party press report", "(third-party)" and "unverified" became "by a
  press report from outside the bank", "a guide from outside the bank … that couldn't be checked against Santander's
  own terms".
- **A destination is a destination.** `UNCLAIMED.to` is printed as a noun in three sentences and two ledger lines, but
  the research had put a clause there: Mexico's read "went to after 3 years without movement the balance goes to the
  bank's 'cuenta global' …", Iceland's "went to no state unclaimed-money scheme found; …". Each `to` names the
  recipient now (the Beneficencia Pública, the bank, the Caisse des Dépôts, Inland Revenue). The conditions moved
  whole into `claimBack`, which had begun "yes, …" in lower case after a full stop and now reads as sentences.
- **Source lines say which day.** Each bank's and country's source line ended on a bare day after a web address
  ("…/CDAA.pdf, September 26, 2026"), and read as the page's own date. It's the day the research read it, so it now
  says "read September 26, 2026", as the glossary's Source line does (`read-days.mjs`). The 13 laws' source lines on
  Your Cards had the same bare day, and were changed with them (`b1-security.mjs`, the FRAUD_LAW source re-marked).
- "Chequing", "current account" and "sight account" in the game's own words are "checking account". A bank's product
  name keeps its own (Personal Current Account, Guide to your Current Account).

### Meaning-sensitive changes, and how each was checked

- **Each penalty band** against the bank's numbers where the engine reads them: Chase's `penaltyDays` (6 months 90,
  24 months 180, then 365; capped; first week 7), Bank of America's, Wells Fargo's, Citi's, Capital One's, Lloyds' (12
  months 90, 24 months 180), NatWest's and HSBC's (90, capped), and MUFG's against `EARLY_RATE` (under 6 months the
  ordinary rate, then 70%). The words keep the bank's own wider rules; the engine's figure is the screen's sentence
  above them.
- **PTSB's formula**: 1% x A x T/365 is 1% a year on the amount for the days left; A x T x D%/365 is the rate
  difference a year on it. The greater, at least €20. Said so.
- **"Remaining" against "elapsed".** NAB's and BNZ's cuts run on the share of the term still to run, CommBank's,
  Westpac's and ANZ's on the share that has run. Each says which, as its research did in capitals.
- **Each `to`** keeps its recipient exactly, and nothing of the old clause was dropped: each condition is in `claimBack`
  (Canada's "for federally regulated banks", Britain's "if the bank chooses to transfer", Ireland's September 30 and
  March 31, France's 3 years after a death and 27 years, Japan's January 1, 2009, Korea's lapse at 5 years, Australia's
  A$500, New Zealand's "in limited cases less").
- **Iceland's** `to` is "the bank": with no state scheme, a lapsed claim leaves the money where it is, which the
  claim-back sentence says.
- **The PTSB sentence** was first written "For an Interest First account": `tests/evidence3-person.test.ts`'s
  i-stale-claims check reads "an interest" as the removed interests and failed it. It says "On Interest First
  accounts", as the research did, and the check passes.
- No number, id or key moved: `apply-gen.mjs` writes only the named string fields, and the tests that play the
  penalties, notices, dormancy and unclaimed money pass unchanged.

### Interactions read whole

Your Accounts Over Time at each bank with a term deposit opened through `bank.open_term` and its savings dormant
(`rendered/accountlife.txt`): the term's line and the game's sentence about its end, then the bank's terms at the end;
what breaking it costs, then the bank's terms; the end buttons; the round-ups; the dormant account and Reactivate; the
cancel lines; the unclaimed line and Claim It Back; the source line. With them, the bank's question before the money
goes and the notice after it (`systems/accountlife.ts`), and the guide's Your Accounts Over Time entries
(`content/guide/money.ts`, the money area's), which take their figures from the same data.

### Tests and tool matchers

- `tests/evidence-g10-money.test.ts`: Citi's penalty words ("The bank’s terms: The penalty is simple interest on the
  amount you take out: 90 days’ for a CD of 1 year or less") and Capital One's dormancy words ("The bank’s terms: An
  account goes dormant after 24 months with no transactions."), each the same `toContain`.
- No tool matcher held these words.

### Checks

- `npx tsc -b --noEmit`: exit 0 (`b2-tsc.txt`). `npx eslint` on the changed files: exit 0 (`b2-eslint.txt`).
- `npx vitest run` on the 15 test files that touch the account-life data, Your Accounts Over Time or Your Cards: 258 of
  258, exit 0 (`b2-tests.txt`), after the one failure above was put right.
- The text checks (`checks.sh`): exit 0 each (`b2-checks.txt`); typos first failed on a doubled word in a
  comment of this folder's, mended. Engine-speak stayed at 332.

### Screens verified

Your Accounts Over Time at all 60 banks (`rendered/accountlife.txt`) and Your Cards again (`rendered/security.txt`),
both with the new source lines.

## Batch 3: `content/pending.ts` (1 source, 7,006 words) and `content/cash.ts` (1 source, 1,540 words)

### What the screen shows

- **Statements** (`ui/bank/BankStatements.tsx`, `PendingTerms`), under a checking or savings account at the bank:
  `pendingWords` ("A card payment: …"), `postingOrder` ("Overnight: …"), `valueDating` ("Value dates: …") and `source`
  ("Source: …."), then the screen's "How long a card payment stays pending is estimated: the bank doesn’t say." where
  `pendingDays` is missing.
- **The card** (`ui/bank/BankCard.tsx`): `paymentHoldWords` after "… of the credit your payment freed up is on hold
  until …, while the payment clears from another bank."
- **Payments And Cash** (`ui/bank/BankCash.tsx`): the cash `source` only ("Source: …."). Its other fields are numbers
  the engine reads and the panel says in its own words.

### What changed and what stayed

Brief 14 had written these as plain sentences, and most of them stay: Chase's hold, the five US banks' overnight
posting orders, the Canadian, Australian and New Zealand holds, and most of the European value dates were read and kept.
What changed (84 fields in `pending.ts`, 60 in `cash.ts`):
- **The research's notes to itself.** "Couldn't find a figure on BMO Canada's own pages", "Couldn't find a figure from
  Santander México itself", "Couldn't find a hold length … from Banorte itself" opened with no subject after "A card
  payment:". "(31 is about 45 calendar days in business days.)" (MUFG, Resona) and "(42 is …)" (Japan Post Bank)
  explained a number the data no longer holds (their `pendingDays` is 0). "Not stated on the ING pages read.", "Yes."
  (Bank of Ireland's value dates), "PDFs weren't reachable (404)", "blocked a direct fetch", "PTSB's full terms PDF was
  blocked". Each now says what the bank's pages give and don't, in a sentence with the bank as its subject.
- **Forms the game writes another way:** "Jan 29 and Feb 26" (the dates step reads a short month only with a year),
  "6pm" and "8:30pm" ("6 p.m."), "(J+1 to J+2)" French clearing notation beside the words that already said it,
  "vorgemerkte Umsaetze" (the bank writes "Umsätze").
- **Every source line** of both files ends "read September 26, 2026" (`read-days.mjs`), not on a bare day after an
  address.

### Meaning-sensitive changes, and how each was checked

- **The removed "(31 is …)" notes.** `PENDING['jp-mufg']`, `['jp-resona']` and `['jp-japan-post-bank']` hold
  `pendingDays: 0` and no 31 or 42 anywhere (`dump-gen.mjs`); the sentences before the notes keep their 45 days and two
  months.
- **Landsbankinn's three days** stay three calendar days, the merchants' deadline, and the words say so; the game holds
  a pending payment 3 days (`pendingDays: 3`).
- **BMO's** US figures stay excluded, as the research excluded them, and the words now say the game doesn't use them,
  which the screen's estimate line after them confirms.

### Interactions read whole

Statements at each bank: the period's lines with their pending payments ("Groceries · Pending, posts …"), Available
Now and Posted Balance, then the bank's terms and source, then the estimate line. The card with a payment from another
bank on hold: the hold sentence and the bank's words after it. Payments And Cash: the withdrawal's cost and its source.

### Tests and tool matchers

- `tests/language-data-dates.test.ts`: Chase's cash source line held to `/, read September 26, 2026$/`, as exactly as
  `/, September 26, 2026$/` held it.
- No tool matcher held these words.

### Checks

- `npx tsc -b --noEmit`: exit 0 (`b3-tsc.txt`). `npx eslint` on the changed files: exit 0 (`b3-eslint.txt`).
- `npx vitest run` on the 33 test files that touch pending payments, cash, Statements or Payments And Cash: 422 of
  422, exit 0 (`b3-tests.txt`).
- The text checks (`checks.sh`): exit 0 each (`b3-checks.txt`). Engine-speak stayed at 332.

### Screens verified

Statements, the card with a payment hold, and Payments And Cash at all 60 banks (`rendered/statements.txt`,
`rendered/card.txt`, `rendered/cash.txt`).
