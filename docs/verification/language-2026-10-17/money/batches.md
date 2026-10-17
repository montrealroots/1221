# Brief 14, The Money Area: The Batches

Each batch: the sources it read, what changed and what stayed, the changes where a rewrite could have changed what's
true and how that was checked, the tests and tools it updated, the checks with their exits, and the screens read. The
before-and-after pairs are in `examples.json`, the defects in `defects.md`, the terms in `glossary.md`.

## Batch 1: Accounts, The Bank's Look, Opening And Closing Accounts

**Sources (36):** `src/ui/workspaces/BankWorkspace.tsx` (9), `src/ui/bank/BankMoves.tsx` (1), `src/ui/bank/feeWords.ts`
(1), `src/ui/looks/bank.tsx` (3), `src/engine/systems/bankmoves.ts` (17), `src/engine/systems/routing.ts` (5). Rewritten
And Verified 23, Reviewed And Retained 13. Along with them, the refusals of `bank.switch` and `bank.open_term` in
`src/engine/systems/lending.ts` that repeat `openRefusal`'s words were given the same words, and the Arion "simulated"
label in `src/engine/systems/banking.ts` and `src/engine/content/guide/money.ts` became "Estimated: …" (those files'
sources are counted in later batches).

**What changed.**
- The Accounts tab: every fee sentence says each condition as something done in a month ("waived in any month you keep
  $1,500 in it all month"), and the month so far plainly ("It isn’t waived this month so far. Unless one of those
  conditions is met, it’s due March 31, 2027."), where it said "unless that changes". Interest says "Interest builds up
  daily", the tax "The bank keeps back 26.375% for tax", the second-chance account's fee and the debit card's timing
  are called estimated at the foot. "SLATE’s rate" became "the game’s exchange rate".
- Closing savings, the defect the before-walk found: "Its -$3, moves to Chase Total Checking." It says each variant to
  the cent: "Closing it moves its $1,234.56 to …", "It’s empty, so closing it moves nothing.", and overdrawn, "It’s
  overdrawn by $3.30. Closing it takes $3.30 from Chase Total Checking to clear it."
- The balance tile's control was named "Balance-$3" by the text walk and a screen reader: a space now sits between the
  label and the figure.
- Opening an account at another bank: every estimate ("SLATE’s estimate: the bank doesn’t say", four of them) moved out
  of its sentence into the Sources And Estimates line at the panel's foot. The cut-off lines say the condition in full.
- The bank's look and a statement line's look: familiar kinds ("Your Everyday Bank", "An Entry On A Statement"), the
  pending line said in the statement's own terms (it counts in the available balance, and posts on its day).
- Refusals say the obstacle and the next step: the photo ID names where to get one ("on Papers, under Passport And
  ID"), ChexSystems says why and until when, the four "X is closing." refusals each say what they refused.

**Kept, and why** (each in its status): month names; the other-banks clause; "Borrow At"; the tab list's name; the
standing and moved-words fragments of the looks; memos and calendar titles stored on saves ("Money In Transit",
"Interest: …, on closing", "Your New Card Arrives"); `PRIMARY_DOES`, four sentences the guide joins and a test compares;
the payer and deposit-change lines already plain.

**Meaning-sensitive changes, and how each was checked.**
- The overdrawn savings close: `closeSavings` posts the shortfall from the current account; the new test presses Close
  It and finds checking $3.30 lower.
- A returned payment's fee "none on a payment under $10" became "nothing when the account is less than $10 short":
  `lending.ts` waives it when `short < ifShortAtLeast`, the shortfall, not the payment (defects.md, d1).
- The "… Closed" notice after a pending close now reads `closeNow`'s arrival: "on its way … and arrives …" only when
  it went to another bank, "now in …" when it moved at once, and "It held nothing." when the account was empty
  (defects.md, d2). The assembly changed; nothing the close does changed.
- "Card payments are still pending on it. Chase closes it once they’ve posted." became "You can close it once they’ve
  posted.": the refusal stands until they post, and then Close It can be pressed again; the bank doesn't close it on
  its own.
- "The debit card costs … free under 24" became "or nothing at 23 and under": `freeUnder` is an age (`banking.ts`).
- The fee's month: "Unless one of those conditions is met" for "unless that changes": `feeFor` reads the month as it
  stands at its end.

**Tests and tool matchers updated, assertions kept as narrow:** bank-lifecycle, bank-moves, bank-moves-card-line (its
card-line helper reads "arrives in N (business) days"; the estimate is now asserted at the foot, an assertion added,
none removed), commands-kept, decisions-arion (its LABEL), defects-g14-1, defects-g16-1, defects-g20-1, defects-r5-1,
evidence-g10-money, evidence-g14-money, evidence-g15-papers, evidence-g16-papers, evidence-g33-ui, evidence2-b05 (its
tally's two refusals), evidence2-b12, evidence3-home, guide-examples-money, guide-examples-papers, home-account-abroad,
home-account-screens, home-account-transfers, integration-savings-notice, remaining-09-banking, remaining-09-journeys,
remaining-banking, remaining-papers, scope-money. `tools/acceptance-ui.mjs`: the home account's panel matcher, "in
dollars, at the game’s exchange rate". New: `tests/language-money.test.ts`, nine cases rendering the screens, the looks
and the refusals in their variants (positive, zero and negative balances; both confidence levels; four banks' other
charges; a pending close).

**Checks:** `npx tsc -b --noEmit` 0; `npx eslint` (the changed files) 0; title-case 0; label-sweep 0; plural-check 0;
voice-check 0; tics 1, then 0 (two new sentences opened on "Nothing", over its budget of none: turned round); spelling
0; typos 0; text-inventory --check 0; doc-refs 0; deciders 0. Vitest: the 79 files touching the batch's code, 22
failures at first, each an assertion of old words my first pass missed or a duplicate refusal in `lending.ts`, then
those files 141 of 141 and `tests/language-money.test.ts` 9 of 9.

**Screens read:** the built app, Money's five tabs on the missed-plan and round-ups saves, at 1440 and 390
(`walk-b1-1440`, `walk-b1-390` in the scratch folder): see the batch 1 walk note below.

**Batch 1 walk note.** `text-walk.mjs` on the built app (missed-plan and round-ups saves, 1440 and 390), then
`text-render-check.mjs`: the Accounts tab reads as above, the balance control is "Balance -$3", and the closing line is
"It’s overdrawn by $3.30. Closing it takes $3.30 from Chase Total Checking to clear it." The check still found "money
written oddly" in "-$3" (the tile and the From list): batch 2 shows an overdrawn balance as "−$3.30", with "Overdrawn"
under it. Its other finding, "Sleep owed 1 hours", is the profile area's.

## Batch 2: Cards, Card Offers, Card Security, How You Pay, Cash, Round-Ups

**Sources (12):** `src/ui/bank/BankCard.tsx` (4), `BankCardOffers.tsx` (1), `BankSecurity.tsx` (2), `BankPayments.tsx`
(2), `BankCash.tsx` (1), `RoundUps.tsx` (1), and `BankWorkspace.tsx#BankWorkspace` again (the overdrawn balance).
Rewritten And Verified 9 (with the re-marked one, 10), Reviewed And Retained 3.

**What changed.**
- The card panel speaks to the holder: "Statements come on the 20th, and payment is due 21 days after each one.", "The
  minimum payment is …", "Paying less than the minimum by the due date costs $30 the first time, and $40 if it happens
  again within 6 billing periods, but never more than the minimum itself." The plan, the penalty rate, the persistent
  debt and the suspension lines say who does what and when. The over-limit estimate and the estimated terms went to the
  foot. Buttons say what they change: Change The Day (was Move It, also Move Money's label), Ask For This Limit, New
  Limit, Raise My Limit Automatically: Off.
- Card offers: a payment plan "pays off part of what you owe for purchases in equal monthly amounts"; a plan with no fee
  says "with no fee and no interest"; nothing to put in a plan says so, where it said "$0 can go into one". A money
  transfer (decision 4's `card.money_transfer`, its words only) is Transfer It, "Transferred to your account, for a … fee."
- Security: the rush and replacement lines are sentences ("A rushed one costs $15.00 more."), each law line is "The law
  on …", and the estimates are said as estimates.
- How You Pay keeps the label "The Day’s Spending", which `systems/spending.ts` and the health area's guide quote; the
  savings link reads "When this is on, a payment a current account can’t cover is taken from easy-access savings …".
- Cash: "You have $0.00 in cash.", field labels that say what goes in, the cash advance's interest said plainly, and
  the machine owner's unknown fee said as not charged.
- Round-ups: "Last moved to savings: …", "Not in the game: …", the source line in the house form; the guide's quote of
  the panel ("Last moved to savings: £2.10") moved with it.

**Kept, and why:** the card's month names, `TERM_WORDS` and `WHY_WORDS` (plain nouns read into sentences).

**Meaning-sensitive changes, and how each was checked.**
- The card's rate line said "yours opened at this" of the rate charged today, which in the introductory months is 0%
  (defects.md, d5). It now reads `card.apr`, the rate set at opening, and says the introductory rate's end. The test
  computes the figure from the card.
- "The card comes in about a week": `ARRIVES_IN` is seven days exactly; "the card arrives a week later".
- The machine owner's fee where it isn't known: `withdrawalQuote` charges only an owner's charge it knows
  (`ownerCharge`), so "That fee isn’t known, so the game doesn’t charge it."
- The rewards line showed a development date ("since 2026-10-09", defects.md, d6).

**Tests and tool matchers updated:** defects-g15-1, defects-r3b-1, defects-r6-1, evidence-g10-money, evidence-g11-money,
evidence-g12-money, evidence-g13-money, evidence2-b04, guide-examples-money (the round-ups quote's pattern),
hardship-plan-minimum, roundups, scope-money (Transfer It), and `tests/language-money.test.ts` (four new cases: the card
panel, its offers, security and How You Pay with Cash). `tools/acceptance-ui.mjs`: the round-ups matchers "Last moved to
savings: $…" and "… so they added nothing."

**Checks:** tsc 0; eslint 0; title-case 0; label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0;
text-inventory --check 0 (the two "to draw on" hits in `coverText` were said another way); doc-refs 0; deciders 0.
Vitest: the 28 files rendering these panels, 4 failures at first (old words my first pass missed), then 385 of 385, and
`tests/language-money.test.ts` 13 of 13.
