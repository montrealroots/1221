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
