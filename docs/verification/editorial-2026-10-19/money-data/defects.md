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
