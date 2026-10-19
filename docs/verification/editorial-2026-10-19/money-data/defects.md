# Defects Found In The Money Data

Functional defects found while reading, apart from the writing. A wrong statement on screen is one. Each says what, where,
how it was found, and whether it was fixed here or is left to the coordinator.

## 1. The US refund law said "out-of-state" for "not initiated within a state" (fixed, in words)

- **Where:** `content/security.ts`, `FRAUD_LAW.US.refundWords`, on Your Cards for every US bank.
- **What:** it said Regulation E gives the bank 90 days for "point-of-sale debit card, out-of-state or new-account
  transfers". 12 CFR 1005.11(c)(3)(ii) gives 90 days for a transfer that "was not initiated within a state", which is
  one from outside the US, not one from another state.
- **How found:** reading the sentence against the regulation, on consumerfinance.gov/rules-policy/regulations/1005/11/,
  October 19, 2026.
- **Fixed:** the words now say "a payment made from outside the US". Nothing in the game reads the 90 days (`refundDays`
  is 10), so no behavior changes.

## 2. Field names on the screen (fixed, in words)

- **Where:** `content/security.ts`. `lostCardWords` of Bank of Ireland and PTSB ended "(standardDays is the upper
  bound)", on Your Cards for those banks. `replaceWords` of Resona and Japan Post Bank, shown under their credit cards,
  said "so standardDays = 10 business days". MUFG's, SMBC's and Mizuho's said the same, where both fees are listed, so
  the panel doesn't show them today.
- **How found:** reading every shown field; the walk of the built app never opens a Japanese or Irish bank.
- **Fixed:** each says what the game does with the bank's range ("so the game uses 10 business days", "and the game
  takes 7").

## 3. Card replacement fees where the bank's own words, in the same data, say otherwise (left to the coordinator)

The game charges `replaceFeeDebit` or `replaceFeeCredit` unless the reason is in `freeFor` (`systems/security.ts`,
`card.report`). In these banks the research's own words say a reason is free, or a fee is only sometimes due, and the
numbers don't follow:

| Bank | The bank's words in the data | What the game charges |
|---|---|---|
| BBVA Mexico | free for damage or renewal | 169.50 pesos for a damaged debit card (`freeFor` has no `damaged`) |
| KakaoBank | charged only when lost or damaged | ₩2,000 for a stolen card too |
| ING (Germany) | its help page: free after theft, loss or misuse; its price list: €10 only if you're responsible | €10 for any reason |
| PTSB, Landsbankinn | no fee listed for a damaged card | €5.00, and 1,900 kr, for a damaged card |
| Arion, Íslandsbanki | a faulty credit card is replaced free | the fee for a damaged card (faulty isn't one of the game's reasons) |
| RBC, KB Kookmin | the first replacement (RBC) or the first three (KB) in a year free, then C$5.00 or ₩2,000 | nothing, ever |
| BBVA, Santander, Banamex, Banorte (Mexico) | fees "before 16% IVA" | the fee without the IVA |

- **How found:** reading `replaceWords` and `lostCardWords` beside each bank's numbers, as `dump-sec.mjs` (in this
  folder) prints them.
- **Not fixed here:** each changes a fee the game charges, and some need a choice (does a faulty card count as
  damaged? does the game add IVA?). The words say what the bank says, and RBC's adds "The game charges nothing for any
  of them." so the panel and the bank's terms don't contradict each other unexplained. The certain ones are BBVA
  Mexico (`freeFor: ['damaged']`) and KakaoBank (`freeFor: ['stolen']`).

## 4. A rush that costs nothing is said as costing nothing more (the money area's screen)

- **Where:** `ui/bank/BankSecurity.tsx`, the fee sentence: `rushFee` of 0 prints "A rushed one costs $0.00 more." (Citi)
  and "A rushed one costs ¥0 more." (Resona), `rendered/security.txt`.
- **Suggested:** when `rushFee` is 0, "A rushed one is free." The file is the money area's.

## 5. A bank's note about its debit card shown under its credit card (the money area's screen)

- **Where:** `ui/bank/BankSecurity.tsx` shows `replaceWords` under every card whose own fee isn't listed. Barclays'
  ("…no fee for a standard replacement debit card…") shows under the Barclaycard too, then "The game charges nothing
  for it."
- **Here:** the notes shown only under one card now start with that card (batches.md, batch 1). A field per card would
  settle it; that's a change to the data's shape, so it's left.

## 6. Unclaimed money's destination printed as a clause (fixed, in words)

- **Where:** `content/accountlife.ts`, `UNCLAIMED.<country>.to` and `claimBack`, printed in "… went to <to> after years
  unused. <claimBack>" (`ui/bank/BankAccountLife.tsx`), in the bank's question and notice and in two ledger lines
  (`systems/accountlife.ts`).
- **What:** Mexico's read "went to after 3 years without movement the balance goes to the bank's 'cuenta global' …",
  Iceland's "went to no state unclaimed-money scheme found; …", and every `claimBack` began "yes, …" after a full stop.
- **How found:** reading each field in the sentence that prints it, then drawing the panel with money unclaimed
  (`rendered/accountlife.txt`).
- **Fixed:** each `to` is the recipient; its conditions moved whole into `claimBack`, which reads as sentences.

## 7. Claim It Back where the country's law says the money can't be claimed (left to the coordinator)

- **Where:** `systems/accountlife.ts`, `bank.claim_unclaimed`, and its button on Your Accounts Over Time.
- **What:** the command gives back any money held as unclaimed, in every country. The data's own words say Mexico's
  can't be claimed once it reaches the Beneficencia Pública, Spain's has no route back, and Iceland's claim is gone
  once it lapses. The words say so beside a button that does it anyway.
- **How found:** reading `claimBack` beside the command it sits by.
- **Not fixed:** a change to what the command does, outside this area's files.

## 8. Australia's unclaimed money: any balance goes, where the law takes A$500 or more (left)

- **Where:** `systems/accountlife.ts`, `idleAccounts`: after `years`, any balance over 0 goes. `UNCLAIMED.AU` (and
  ANZ's and Westpac's own words) say the Commonwealth takes a balance of A$500 or more; ANZ may close a smaller one.
- **Not fixed:** a rule change; the words say A$500.

## 9. Term deposit penalties estimated where the bank publishes a rule (left)

- **Where:** `systems/accountlife.ts`, `breakQuote`. A bank with no `penaltyDays` and no `EARLY_RATE` is charged the
  interest earned so far, and the screen calls it estimated. Several of those banks publish their rule, which the
  screen shows beside the estimate: Landsbankinn's 2% of the amount, CommBank's, Westpac's, NAB's and ANZ's cuts by
  the share of the term, plus A$30 at CommBank and ANZ; PTSB's charge; Sabadell's 1% a year; BBVA's.
- **Not fixed:** the screen labels the figure as estimated, so nothing is said that isn't true. Modelling each is a
  change to the rules.

## 10. BMO's notice for a change at the end may be the other way round (a question)

- **Where:** `ACCOUNT_LIFE['ca-bmo']`: `endNoticeDays: 21`, which the screen reads as "the bank needs 21 days' notice"
  (no change in the last 21 days). The bank's words in the data: instructions "can be changed only in writing within 21
  days before maturity", which can be read as only in the last 21 days.
- **Not changed:** the words keep the bank's phrase; which reading BMO's terms mean needs its terms read again.

## 11. "Current account" in the game's sentence about a term deposit's end (the money area's)

- **Where:** `systems/accountlife.ts`, `END_WORDS.paid_out`: "it is paid, with its interest, into your current
  account." (`rendered/accountlife.txt`, Arion).
- **Suggested:** "it’s paid, with its interest, into your checking account." (the glossary's word from brief 15).
