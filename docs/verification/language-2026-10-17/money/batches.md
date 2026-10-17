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

## Batch 3: Borrowing, Statements, Your Accounts Over Time, And The Money Looks

**Sources (27):** `src/ui/bank/BankLending.tsx` (2), `BankStatements.tsx` (8), `BankAccountLife.tsx` (2),
`src/ui/looks/money.tsx` (15). Rewritten And Verified 16, Reviewed And Retained 11.

**What changed.**
- Borrowing: every "SLATE’s estimate" (nine engine-speak hits in this file) moved to the sources line ("How far the bank
  lets the account go below zero is estimated: it publishes no limit."), and "… publishes no … SLATE found" became "No
  … was found for Chase." Two mentions of removed systems went: the opt-in line said "Bills and checks go into the
  overdraft either way" (now "Other payments, like autopay and standing orders"), and the no-overdraft line said "a bill
  or the rent comes back unpaid". The German switch's "€2,000" is read from the bank's own rule, where it was typed.
- Statements: "The least you can pay is …", interest "charged" for "draws", the plan's callout in two sentences, the
  Alerts subtitle saying its own alert is the game's (where it said "(SLATE’s design)") with its days read from
  `LOOKAHEAD_DAYS`, and every figure tile's control named with a space between its label, figure and note.
- Your Accounts Over Time: "Breaking it now costs $10.48." / "costs nothing.", the estimated penalty said with its
  reason, and a dormant account names the next step.
- The looks: each account's kind is its plain name ("Current Account", "Savings Account", "Credit Card"), its sentence
  says what's in it and what it's for in separate sentences, an overdrawn account "can cost you" (an overdraft in its
  grace costs nothing), and the provenances say "added up from every payment in and out" for "the sum of the postings".

**Kept, and why:** Past Switches' outcomes, the statement's column heads, `yearsAndMonths`, the term deposit's end
buttons, the looks' month and category words, `HELD_AS` and the spending facet, each plain already.

**Meaning-sensitive changes:** the removed bills, checks and rent (above, read against the scope reset's notes in
`BankPayments.tsx` and `looks/money.tsx`); "every day it stays under costs you" became "can cost you"; "Broken now it
comes out whole" became "Breaking it now costs nothing" (the quote's penalty is 0 in both its cases: a grace window, or
a cap at the interest earned with none earned); and "Pending" kept apart from posted ("Posted payments only: what’s
pending hasn’t posted yet").

**Tests updated:** defects-g13-1, evidence-g10-money, evidence-g11-money, evidence-g13-money, evidence-g14-money,
evidence2-b04, guide-examples-money (the year's-interest pattern), hardship-plan-minimum, home-account-screens,
money-plan-interest, scope-money, statements-hardship; `tests/language-money.test.ts` gained four cases (Borrowing, the
Alerts panel, the account looks in each balance's variant, an empty card statement).

**Checks:** tsc 0; eslint 0; title-case 0; label-sweep 0; plural-check 0; voice-check 0; tics 1, then 0 (two empty
statements opened on "Nothing"); spelling 0; typos 0; text-inventory --check 0; doc-refs 0; deciders 0. Vitest: the 22
files rendering these panels, 5 failures at first (old words), then all; `language-money` 17 of 17.

**Screens read:** a fresh build, `text-walk.mjs` on the missed-plan, round-ups and lien saves at 1440 and 390
(`walk-b3-*`), then `text-render-check.mjs`: the money faults the before-walk found are gone ("−$3.30", "Balance
−$3.30"); the one left, "Sleep owed 1 hours", is the profile area's. The Statements tab reads "Posted payments only:
what’s pending hasn’t posted yet" under Posted Balance, and Borrowing reads as the test asserts.

## Batch 4a: Move Money, Savings, Payments, Alerts, Cash And The Account's Life (Engine)

**Sources (60):** `src/engine/systems/banking.ts` (14), `accountlife.ts` (17), `payments.ts` (9), `statements.ts` (6),
`cash.ts` (4), `spending.ts` (10). Rewritten And Verified 27, Reviewed And Retained 33.

**What changed.**
- Every refusal now says what's in the way and, where there is one, the next step: "That’s the same account." became
  "From and To are the same account. Choose another account to move it to."; "… holds $93,391." became "… only has
  $93,391 in it."; "… is dormant; use Reactivate first." became "… is dormant. Reactivate it first, under Your Accounts
  Over Time."; "Say how much." became "Enter an amount."; "Pick a day ahead." became "Choose a date in the future.".
- Notices lead with what happened: "$50.00 to Chase Savings: It wasn’t in Chase Total Checking on the day, so the bank
  didn’t make it." became "Your $50.00 standing order to Chase Savings didn’t go. There wasn’t enough in Chase Total
  Checking on the day. Move money into it before the order’s next date."; "Untouched for 24 months. … has blocked it
  until you use it again." became "It hasn’t been used for 24 months, so … has blocked it. Reactivate it on Money, under
  Your Accounts Over Time, to use it again." (Reactivate is what unblocks it; using it is refused while it's dormant).
- A savings account's notice: "The notice ran out" became "Its notice period ended"; a standing order that ended with
  its account is named "on the 28th" (it said "on the 28") and says where to set it up again.
- Arion's card year: "paid ahead" became "paid in advance", the over-the-balance case a plain conditional.
- The cash refusals at a machine say "You can still take cash out at the counter." (or pay it in), and the daily limit
  says "you’ve taken … today".
- "SLATE takes the three years for every state" in the unclaimed-property source line became "the game uses …".

**Kept, and why:** statement memos and the nominal accounts' names (Bank Fees, Interest, Tax On Interest, Food, Cash In
Hand, Bills Owed: matched by name in code); the German closing-fee sentence, plain and read from `closingFeesDue`; the
`END_WORDS`; and all of `spending.ts`, whose words the health area's guide (`content/guide/body.ts`) quotes verbatim.
I changed "payment ceiling" to "spending limit" there and put it back for that reason: it's in For The Coordinator.

**Meaning-sensitive changes:** the dormant notice now names Reactivate, where it said the account was blocked "until you
use it again" (a dormant account refuses Move Money and cash until it's reactivated, `systems/banking.ts`,
`systems/cash.ts`); the escheat question says "tell the bank to keep the account" where it said "get in touch", which is
what its one action, Keep The Account, does.

**Tests updated:** accountlife, bank-moves, cash, decisions-arion, defects3-bank, evidence-g10/g11/g12/g13-money,
evidence2-b04, evidence2-b05, home-account-abroad, home-account-transfers, integration-savings-notice,
remaining-banking, scope-money: old words to new, every assertion as narrow as it was (four regexes moved to the new
words: /Notice is given/, /holds/, /in a day/, and HSBC's abroad "only has £… ($…) in it."). `tests/language-money.test.ts`
gained two cases: a refused move, savings and standing order (balances unchanged), and a refused payment set for a
date, alert, term command and cash, each to its exact words.

**Checks:** tsc 0; eslint 0; title-case 0; label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0;
text-inventory --check 0; doc-refs 0; deciders 0. Vitest: the 64 files that assert these words, 4 failures at first (an
abroad cash refusal I'd missed in `cash.ts`, and three regexes on old words), then those 4 files 67 of 67;
`language-money` 19 of 19.

**Screens:** these are refusals and notices; the ones a screen shows (Move Money's notes, the What Needs You notices)
are read in the after-walk with the guide batch.

## Batch 4b: Cards, Card Security, Round-Ups, Borrowing, Switching And The Bank At Home (Engine)

**Sources (82):** `src/engine/systems/credit.ts` (13), `cardlife.ts` (9), `cardoffers.ts` (6), `security.ts` (10),
`roundups.ts` (5), `lending.ts` (32), `homeaccount.ts` (7). Rewritten And Verified 46, Reviewed And Retained 36.

**What changed.**
- Every "SLATE" in these refusals went, each said as what was or wasn't found: "The Chase Freedom Unlimited has no
  plan SLATE has terms for." became "No payment plan terms were found for the Chase Freedom Unlimited."; "SLATE has no
  research on what … does when a customer moves to America." became "There’s no research on what … does when a
  customer moves to America, so the game can’t offer it."
- Notices lead with what happened and point to the real place to act: "pay it from Your Bank" became "You can pay it on
  Money, under Borrowing."; a stranger's charge says "report it on Money, under Cards."; the French overrun's notices
  start "Your account has been past its overdraft limit for …"; a missed loan payment says "there was only … to pay it
  with"; a declined switch no longer opens on "Nothing" ("Your accounts and payments haven’t changed.").
- Card notices are sentences: "Ending 3003." became "The new card ends in 3003, and you can use it now."; "The minimum
  was $40.00 and only $0.00 went in. A $30.00 fee, …" became "The minimum payment was $40.00, and only $0.00 was paid.
  That costs a $30.00 late fee, …".
- Decision 4's switch, cancel-switch, balance-transfer, overdraft and overrun-loan items: words only ("You could call
  it off until …, and it’s under way now. You can still stop its balance transfer until the working day before.");
  every check, date and status is as it was.
- Spend & Save turned off now says the money it had counted stays in checking (it was never taken) and where to turn
  it on again.

**Kept, and why:** memos and nominal account keys (Card Interest, Card Fees, Overdraft Interest, Tax On Interest, Loan
Interest, Bank Fees, the collections accounts' names), matched by name in code; the calendar labels of system events;
FICO's band names; the refusals already plain ("You don’t have a card.", "That isn’t an open loan of yours.").

**Meaning-sensitive changes:** the limit-increase refusal names what the code checks: "means to repay" became "money in
the bank to repay it" (`heldInBanks(s, person) > 0`); "Wages and bills go through it" became "Your wages and payments"
(the switch moves wages, standing orders, autopay, loan repayments and payments set for a date); "Paying it off takes
…, and the bank can’t cover it all" became "the repayment account can’t cover it all" (`payFromBank` on the repayment
account, its linked savings and its overdraft); the loan's income test says "the last 30 days’ wages" where it said
"last month’s" (`wagesLastMonth` counts thirty days).

**Tests updated:** banking-complete, bank-lifecycle, cardoffers, defects-g4-2, defects-g21-1, defects-r3b-1,
evidence-g10/g11/g12/g13-money, evidence-g17-papers (the papers area's file: a Discover loan refusal it asserts),
evidence2-b04, evidence2-b05, evidence2-b06, evidence2-b11, finance-paths, home-account-creation, home-account-setoff,
journey-money, lending, money-fixes, remaining-banking, scope-money, security: old words to new, as narrow as they
were (nine regexes moved to the new words; one, "being closed", narrowed to the full sentence); evidence-g12 gained the
card's arrival notice in full.

**Checks:** tsc 0; eslint 0; title-case 0; label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0;
text-inventory --check 0; doc-refs 0; deciders 0. Vitest: 72 files with this batch, the guide's and batch 6's: 28
failures at first (old words, and a ", and" my own test edit had doubled), then the 19 files rerun, 2 more old words,
then those 2: all pass.

## Batch 5: The Money Guide (How This Works)

**Sources (26):** `src/engine/content/guide/money.ts`, its fourteen entries, the connection groups and six helpers,
about 18,000 words: one file, rewritten entry by entry. Rewritten And Verified 20, Reviewed And Retained 6.

**What changed.** Each entry now answers the brief's eight questions in order, by the screens' own labels:
- `short` is a plain overview of what it's for, two or three sentences where it was a paragraph of every rule ("Money
  is your bank. The Accounts tab shows each of your current and savings accounts: …").
- `steps` give the real controls, checked against the code and the text walk: Change The Day, New Limit and Ask For
  This Limit, Raise My Limit Automatically, Apply For This Card, Pay From This Account, Repay From This Account, Send
  What It Holds To, Amount To Take Out, Amount For The Plan, Transfer It, Report It And Rush The New One, Save These
  Choices: every one the guide named by an old label since batches 1 to 3.
- every entry has `next`: what to do once it's done (two or three each).
- `available` says when it opens ("Once you’ve read “…” in the guide.").
- refusals are quoted in their new words (batches 1 to 4b); "SLATE’s estimate", "the ledger", "the sum of the
  postings", "draws on" and "worked out from" are gone, the estimates marked as such among the figures and in the
  Sources And Estimates line, not mid-sentence; three new figure lines carry what the prose used to estimate inline
  (moving the statement day, going over the limit, the exchange between a home account and an American one).
- Upkeep's one-paragraph "Cancel It" became five plain lines (what closes, interest, fees, an older save's term
  interest, a card), every condition kept.

**Kept:** ids, `covers`, `opens`, goals, questions, synonyms, `related`, connection targets and kinds, every figure read
from the rules' constants, and the Before Yale labels (the start area's screen).

**Meaning-sensitive changes:** none intended; two found and fixed in review: Berliner Sparkasse's account price
doesn't include its card (my first draft said "comes with"), and "paying the card down before the due date" kept as
the original said it.

**Tests updated:** guide-examples-money: its parsers read the worked examples' new wording (27 fragments, each the
same number in the new sentence); it plays every example and checks each figure against the simulation: 16 of 16.

**Checks:** as batch 4b; tics 2 over at first ("Nothing" openers, ", which is" clauses), spelling 5 (canceled spelled the British way, with two l’s),
engine-speak 3 ("worked out from", a refusal with no reason), all fixed; money's engine-speak 45 to 11.

## Batch 6: The Banks' Data

**Sources (520):** `src/engine/content/cards.ts` (2), `security.ts` (2), `accountlife.ts` (2), `pending.ts` (1),
`cash.ts` (1), `banks-world.ts` (2), `banks-world-sheets.ts` (208), `banks-thirteen.ts` (63), `banks-lending.ts` (52),
`banks-world-iban.ts` (83), `homeaccounts.ts` (7), `bankopening.ts` (2), `banks-world-fees.ts` (1), `rents.ts` (1),
`currency.ts` (2), `core/ledger.ts` (1), `core/money.ts` (1), `systems/earnings.ts` (2), `systems/banknumber.ts` (1),
`systems/obligations.ts` (2). Rewritten And Verified 16, Reviewed And Retained 504.

**What changed:** every "SLATE" in a string a screen shows: the Source lines of loans, account opening, transfers and
MUFG's and SMBC's accounts, a home account's conditions and fee notes, the three withholding notes, the confidence
lines, the margin and days estimates ("an estimate: the bank publishes no margin, so the game uses …"), and
`RATES_NOTE` ("Exchange rates are the game’s estimates, not a live market."). Research file names went from seven
Source lines ("(research-tax-switch-lending.json, 2026-10-10)" became "(read 2026-10-10)"). Printed as they render in
`printed-data.txt`.

**Kept, and why:** the banks' own terms (cards' rewards and plans, lost cards, dormancy, term ends, pending holds, the
law on fraud) are shown as the bank's or the law's words ("The bank’s terms: …", "In the bank’s words: …") with
their source and date; rewriting them would make them stop matching what they cite. Each was read by script for
"SLATE" (none), engine-speak (only the citations' URLs flag) and very long sentences, and the US, NatWest and ING
entries by eye. The world banks' sheets, fees and IBAN codes aren't shown in play: no life can hold an account at a
world bank (every life begins at Yale with a US bank, and a home account is offered only at the thirteen countries'
researched banks), so they're Reviewed And Retained with that reason.

**Tests updated:** home-account-creation and home-account-transfers (the confidence line, Japan Post Bank, the margin
and days estimates in Move Money's line).

## The Built App, After

A fresh build of `afa821b7`, served on 4205; `text-walk.mjs` on all fourteen scenario saves at 1440 and 390
(`after-1440/`, `after-390/`), then `text-render-check.mjs` (`render-check.txt`): 129,028 strings, 2 distinct faults,
neither money's ("Sleep owed 1 hours" on the Profile, "rehearsed together 1 times" on Coursework). On the Money
screens of every save, "SLATE" appeared 85 times before this pass (`l14/walk-before-1440`) and 0 times after; the
missed-plan save's "Its -$3, moves to Chase Total Checking." and "Balance-$3" read "It’s overdrawn by $3.30. Closing it
takes $3.30 from Chase Total Checking to clear it." and "Balance −$3.30 Overdrawn". The Money tabs read a little
longer (Accounts 590 to 656 words on the missed-plan save, Cards 888 to 973), from the next steps and the fee
sentences said in full; Borrowing slightly shorter.

The walk doesn't open How This Works for the money entries, so the guide is verified by its played examples and the
label check above, not by a walked screen.

## A Manual Route For The Owner

On the missed-plan save: Money, Accounts (the savings at −$3.30 and what Close It would do; the fee lines), Move Money
with 0 typed (Enter how much to move.), Cards (the card's terms, Your Cards, The Card’s Offers), Payments And Cash,
Borrowing (Chase's overdraft and its estimated reach at the foot), Statements (Posted Balance under Available Now,
Alerts). Then How This Works beside Your Accounts, A Credit Card and Overdrafts And Loans: each opens with what it's
for, then the steps by the labels just seen, and ends with what to do next.

## The Coordinator's Note: Rates Said As Estimated

The coordinator asked (from the frame area's review) that exchange rates be said as estimated, as the frame area writes
them ("About 1.53 to the US dollar, estimated"), and that the missed-plan save's "-$3" stop being written four ways.

- `RATES_NOTE` went from "Exchange rates are SLATE's calibrated estimates, not a live market." (at the pass's start) to
  "Exchange rates are estimated, not live market rates."
- A home account's balance note, "$126.58 in dollars, at SLATE’s rate" at the start and "… at the game’s exchange
  rate" after batch 1, is now "About $126.58 at an estimated exchange rate"; its statement's line, and the guide's
  three mentions, say "at an estimated exchange rate".
- The "-$3": batch 1 made it one figure. The after-walk of the missed-plan save, at 1440 and 390, writes it as
  "−$3.30" in the balance tile (with "Overdrawn"), the From list ("Chase Savings ···3136, Chase (−$3.30)") and
  nowhere else, and as "overdrawn by $3.30" in the sentence under Close It.

Tests: home-account-screens (both lines), and `tools/acceptance-ui.mjs`'s home-account matcher. home-account-screens,
language-money, guide-examples-money and decisions-arion: 55 of 55. tsc 0, eslint 0, text-inventory --check 0.

## The Whole Suite, And The Acceptance Runs

`npx vitest run` on `afa821b7` (`full-suite.txt`): 377 files, 4,607 tests, 4 failed, exit 1. Each was mine and is fixed
in `c9b3e927`: two stale-claims checks read "that interest" in two guide sentences as naming the removed interests
(the sentences say "the interest" and "It’s never refunded." now); decisions-arion quoted the Arion sentence as the
guide said it before batch 5; home-account-screens ran while I was changing the rate's words under it. The four files
rerun on `c9b3e927` (`full-suite-rerun.txt`): 45 of 45, exit 0.

`tools/acceptance-ui.mjs` on the built app: at 390, 77 passed and 0 failed with 0 overflows (`acceptance-390.log`), and
at 1440 the same (`acceptance-1440.log`), after its two money matchers learned this pass's words ("only has" for a
refused move, "Sent $100. It arrives …" for the toast). The first runs failed those two steps on the words alone.
The walk and the acceptance runs were of the build before the rate's last wording; that wording is checked by
home-account-screens.
