# Brief 15, The Money Area: The Batches

Each batch: the sources it read, what changed and what stayed, the changes where a rewrite could have changed what's
true and how each was checked, the interactions read whole, the tests and tool matchers updated, the checks with their
exits, and the screens read. The before-and-after pairs are in `examples.json`, a sample of what stayed in
`retained.md`, the defects in `defects.md`, the terms in `glossary.md`, the renamed labels in `renames.json`.

The standard is `docs/STYLE.md`, "Speak like a finished game", and the glossary's word for the everyday account is now
**checking account**. Every player-facing "current account" in these files became "checking account"; a bank's own
product name (Chase Total Checking, AktivKonto, Current Account Switch Service) stays.

## Batch 1: Moving Money, Payments, Opening And Closing Accounts

**Sources (51):** `src/engine/systems/banking.ts` (14), `src/engine/systems/bankmoves.ts` (17),
`src/engine/systems/payments.ts` (9), `src/engine/systems/routing.ts` (5), `src/ui/bank/BankMoves.tsx` (1),
`src/ui/bank/BankPayments.tsx` (2), `src/ui/looks/bank.tsx` (3). Rewritten 27, Retained 24.

**Interactions read whole, in order, across files:**
- *Moving money:* the Move Money panel (`BankWorkspace.tsx`), the From and To lists, each refusal of `bank.transfer`
  (same account, no amount, another currency, not enough available, a switch's debt, dormant, Germany's monthly
  allowance, the withdrawal fee, closing, Citi's limits), the toast, the On Its Way panel, the arrival, and the guide's
  Moving Money entry. The refusals now share one shape: what stopped it, "so nothing was moved", then the way out.
- *A pending payment:* the statement line's look (`looks/bank.tsx`) said a pending payment "already counts in your
  available balance". It now says it's "already taken off your available balance", the glossary's words, and Move
  Money's refusals say "has only … available", since `account.balance` is the available balance (`systems/pending.ts`:
  the posted balance is the balance less what's pending).
- *Opening and closing an account:* Open An Account At Another Bank (what the bank asks, the refusals, Apply, the
  toast, the bank's decision notice, the account's line under Your Banks), then Close It (each refusal, the fees line
  under it, the toast, the "… Closed" and "… Didn't Close" notices, the bank's own closing notice and its standing
  orders).
- *Standing orders and payments set for a date:* How You Pay's form and list, each refusal, the notice when one
  doesn't go through, the What Pays From Where panel, and the savings link (its button, the line above it, its
  refusal).

**What changed.**
- "Current account" became "checking account" in every refusal, subtitle and label here: "You already have a checking
  account at Chase.", "One checking account", **Savings Covers The Checking Account** (`renames.json`).
- The refusals that said what was wrong now also say what didn't happen and what to do: "It’s overdrawn by $15.00, and
  the bank only closes it once that’s paid off. Move money into it first."; "… is dormant, so nothing was moved.
  Reactivate it under Your Accounts Over Time, then try again."; "Move $0.06 into it first." for "Pay in €0.06 first.".
- A switch's blocked account, the reference's example 4, in this game's shape: "Barclays Bank Account is blocked, so
  nothing was moved. It was overdrawn when you switched banks, and it stays blocked until the overdraft is paid off.
  Move money into it to clear what it owes, and it closes once it’s repaid." The tics budget for a sentence opening on
  "Nothing" is zero, so the reference's "Nothing was moved." became a clause of the first sentence.
- The wages refusal is the reference table's: "Choose one of your open checking or savings accounts for your wages."
- The month-end statement notice was a fragment, "$3,025.00 at the close.". It now says "It ended the month with
  $3,025.00 in it. The statement is on Money, under Statements.", "the quarter" for a German account closed quarterly,
  and "It ended the month overdrawn by $3.30." below zero.
- German closing fees: "Closing it now charges its fees to the day, €3.12 ($3.39): October’s €6.90 for the 14 days of
  its 31 it’s been open, €3.12." became "Closing it now charges €3.12 ($3.39) in fees: €3.12 of October’s €6.90 fee,
  for the 14 days of its 31 the account has been open. Under German law, a month’s fee is charged only up to the day an
  account closes." Each variant (fees held for the quarter, ING's fee due on the 1st, the month just counted, a new
  account's free month, a waived month) reads as a sentence with the figure first.
- Arion's card year: "This card year began August 25, 2026, paid in advance with 950 kr, and runs to August 24, 2027."
  became "The current card year runs from August 25, 2026 to August 24, 2027, and you paid 950 kr for it in advance.";
  "goes below zero" became "goes overdrawn"; "Estimated: Arion’s price list …" became "The timing is estimated: …",
  which says what's estimated (here and in the guide).
- The primary account's sentence was four clauses joined by semicolons. `PRIMARY_DOES` is now four noun phrases joined
  by `spokenList`: "… unless you choose otherwise: your debit card’s everyday purchases, cash from a machine, bills you
  pay by hand and any new standing order or autopay."
- "Move it first." and "Move them first." after a list of what uses an account became "Move that to another account
  first." and "Move those to another account first.": "it" pointed at the wages, a plural.
- A standing order or dated payment "didn’t go" now "didn’t go through", and a dated payment that couldn't be paid
  says "You can set it up again under How You Pay." (it's gone once it fails). The notice titles stay.
- The bank's look: "Chase is a bank in the United States, and keeps its accounts in USD." for "a United States bank"
  (`theCountry` gives the article, and "a Germany bank" was possible); the primary-account line no longer says "your
  pay" goes through it, which wasn't true once wages are paid elsewhere.

**Meaning-sensitive changes, and how each was checked.**
- *"available":* `bank.transfer` compares the amount with `from.balance`, the available balance (`pending.ts`,
  `postedBalance` is `balance - pendingOn`). The refusal's figure is that balance.
- *The German allowance:* "More than that takes three months’ notice." implied notice could be given for a withdrawal.
  The game gives notice only by closing the account (`bank.close_savings` schedules `SAVINGS_NOTICE_KIND` three months
  on). Now: "To take out more, you’d have to close the account, which takes three months’ notice."
- *The fee for customers abroad:* "Move money into it: once it holds enough, the bank takes the fee that night." The day
  rollover calls `chargeAbroadFee` for any account with `feeOwedHeld` (`banking.ts`, `bank.day`).
- *The overdrawn statement notice:* `balanceText` with the negated balance, and the held figure negated for an account
  kept in another currency; the overdrawn and quarterly variants are tested (`tests/editorial-money.test.ts`).
- *"after its pending card payments post":* only Citi keeps an account closing for pending items
  (`closeWithPendingDays`), and `pendingOn` counts card payments.
- *ING's fee:* "for last month, due on the 1st" was said only between 11 PM on the month's last day and midnight, when
  it's this month's fee. It now names the month: "the €4.90 for October, which would come off on the 1st".
- *Decision 4:* `bank.switch` (the blocked account) changed in words only; its behavior and status didn't move.

**Defects:** m1 (`defects.md`): two Move Money refusals stated a limit rounded to whole units, so they could name more
than the account lets out. Fixed, with `tests/editorial-money.test.ts` failing without the fix ("€2,000" for €1,999.50,
"C$99" for C$98.50).

**Tests and tool matchers updated** (assertions kept as exact, titles unchanged): bank-moves (one regex),
decisions-arion, defects-g16-1 (one regex), defects-r3b-1, defects-r6-1, evidence-g10-money, evidence-g11-money,
evidence-g12-money, evidence-g13-money, evidence-g14-money, evidence-g33-ui, evidence2-b05, evidence2-b12,
evidence3-home, home-account-abroad, home-account-screens, home-account-transfers, language-money,
remaining-09-banking, remaining-banking, scope-money. One negative assertion in decisions-arion moved from "of its debit
card’s" to "its debit card’s", which both new card-year variants contain: stricter, not looser. New:
`tests/editorial-money.test.ts` (the defect, the statement notice's variants, and four refusals no test read). The UI
tools hold none of these words: `tools/playthroughs-ui.mjs` checks Move Money's refusal by its figure.

**Checks:** `npx tsc -b --noEmit` 0; `npx eslint` on the changed files 0; the 24 test files above 0 (427 tests, then the
5 that first failed on matchers: 57 tests); title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0 (after
the "Nothing" sentences were folded), spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0 (581 of 581).
`text-inventory --check` 1: only on 8 sources of mine whose words changed so quotes stay true, the guide's entries
(`guide/money.ts`) and `accountlife.ts#cancelRefusal`, which batches 4 and 6 read and mark.

**Screens:** the Accounts and Payments And Cash tabs and the bank's look, rendered in the tests above; the built app is
read at the end of the area.

## Batch 2: Cards, Their Notices, And Statements

**Sources (49):** `src/engine/systems/credit.ts` (13), `src/engine/systems/cardlife.ts` (9),
`src/engine/systems/cardoffers.ts` (6), `src/engine/systems/statements.ts` (6), `src/ui/bank/BankCard.tsx` (5),
`src/ui/bank/BankCardOffers.tsx` (1), `src/ui/bank/BankStatements.tsx` (8), `src/ui/bank/feeWords.ts` (1). Rewritten 18,
Retained 31.

**Interactions read whole, in order:**
- *A card payment pending, then posted, and its statement:* the card's panel (Owed, Left To Spend, the rate, the
  interest and minimum lines), a purchase pending on Statements ("· Pending, posts …", Balance Now with "… of it
  pending"), its posting, the statement notice, the Statements tab's minimum line and the minimum-only warning.
- *A card's autopay short, the late fee and the notice:* the statement notice, the due date, the bounce notice, the
  late notice, the suspension two misses on, the default notice, the charge-off, the In Collections panel; and the
  way back (Your Card Works Again, The Penalty Rate Is Off).
- *A limit raised:* Ask For This Limit, the decline notice with the bank's three conditions, the automatic raise and its
  notice (Your Card Limit Went Up).
- *Applying for a card:* Another Card's lines, Apply For This Card, Card Approved or Card Application Declined, the
  arrival, and a balance moved from another bank's card.

**What changed.**
- *The statement notice* said what was owed and "At least $40.00 has to be paid by then." It now says the minimum
  payment, the glossary's term, and what autopay will do that day, which is what tells a player whether they have to
  act: "The statement comes to $270.00, due October 11, 2026. The minimum payment is $40.00. Autopay pays $40.00 from
  Chase Total Checking that day, if there’s enough in it." Autopay always pays something (the minimum, the whole
  statement or a plan's payment), so every variant has the sentence; "the whole $270.00" where autopay pays the lot,
  "The whole … is due" where the minimum is the whole statement (a charge card).
- *The bounce notice* named no card or account ("Autopay asked for $52.00, and the current account couldn’t cover
  it."). It now names both and gives the step: "The Chase Freedom Unlimited’s autopay of $52.00 didn’t go through,
  because Chase Total Checking couldn’t cover it. The payment is late now, and its late fee is the only fee you’re
  charged for it. Move money into Chase Total Checking, then pay the card on Money, under Cards."
- *The late notice:* "and only $0.00 was paid" became "and nothing was paid by the due date" at zero; the card is named;
  the record's two cases are two sentences; it ends with where to pay.
- *The card application:* declined for "your credit record isn’t strong enough" now gives the figure the game approves
  from, "your credit score is below 620, the lowest it approves", and every decline adds that applying still took a few
  points off the score; a debt in collections says where to pay it.
- *The charge-off:* see the defect below; the notice now says how long the mark stays, paid or not, that no card is
  approved while the debt is unpaid, and where to pay it.
- *Smaller:* the suspension notice says "two payments" and how it lifts, as the card's panel does; "Your Card Works
  Again" names the card; a balance transfer's notice names both cards and gives the rate as a rate with its end
  date ("It’s charged 0% until July 22, 2027, then 21.15%."), where it said "at 0.00%"; "The least you can pay is …"
  is "The minimum payment is …, due …"; a closed account's last period is "…, Until It Closed" for "…, To Its Closing";
  the low balance alert's field is **Any Checking Account Under**.
- *Provenance:* a card's rewards and plans were shown as "In the bank’s words:" and "The bank’s plans, in its words:".
  They're the research's summaries of the bank's terms, some with the researcher's notes ("percentage not readable on
  citi.com"), not the bank's words. They're now "Its published rewards:" and "The bank’s published plans:", and the
  notes are cleaned in batch 8 (the card data).
- *A capped rate* had the whole citation as its sentence's subject ("Criminal Code s. 347 (criminal rate: over 35% APR,
  since January 1, 2025); Quebec Consumer Protection Act … caps the rate at 35%"). It now says "The law here caps the
  rate at 35%, and the card is held to that.", and the citation goes in the Source line.

**Meaning-sensitive changes, and how each was checked.**
- *Autopay in the statement notice:* `autopayAsk` gives what autopay will ask (`asked`) and what the due date judges
  (`due`); the account is read as `autopaySource` reads it but without pinning it (`sourceOf`), because pinning at the
  statement would stop autopay following a primary account changed before the due date. "if there’s enough in it" is
  the bounce condition (`autopayReach`).
- *The bounce:* every card has a returned payment fee, its bank's or the estimate (`cardTerms`, `RETURNED_PAYMENT_USD`),
  so "The payment is late now" is reached only where a US card is short (`lateToo`). A third branch written first for
  a payment that wasn't late was unreachable and came out.
- *620:* `APPROVE_FROM` in `cardlife.ts`, the one figure the game approves from at every bank.
- *"applying still took a few points":* `credit.score -= INQUIRY` runs before the decision, approved or not.
- *The charge-off's years:* the mark just made, `markYears` of it (seven in the US). Paying a collections debt doesn't
  touch the record; only `marksFallOff` does, by years. An unpaid collections debt blocks a card application at any
  bank (`card.apply`'s `collections` check).
- *"Until It Closed":* the period ends at `account.closedAt`, in the past.

**Defects:** m2 (`defects.md`): the In Collections panel and the glossary say a charge-off is on the record "until
it’s paid"; the record keeps it for the country's years whether it's paid or not. The notice is right now; the panel is
batch 3's (it's `BankLending.tsx`), and the glossary row is the coordinator's.

**Tests and tool matchers updated:** evidence-g10-money, evidence-g11-money (one regex), evidence-g12-money,
evidence-g13-money, evidence-g14-money, evidence-g28-ui, evidence-g34-ui, evidence2-b04, evidence2-b05, evidence2-b11,
home-account-screens, hardship-plan-minimum, language-dynamic (one regex; the suspension loop now pairs each count with
its word), language-money, papers-complete, cross-journeys, statements (a filter that found due statements by their old
words now finds them by "The statement comes to"), statements-hardship. In evidence-g28-ui and evidence-g34-ui one
assertion held the same statement notice for two lives with different autopay settings; the notice now says what each
autopay pays, so each life has its own exact assertion: two exact assertions where there was one. New:
`tests/editorial-money-screens.test.ts` (the published plans, a charge card's line and a capped rate, the alert's
label) and six cases in `tests/editorial-money.test.ts` (the balance moved, the card working again, the declines, the
money transfer refusal, the charge-off). No UI tool matcher held these words.

**Checks:** tsc 0; eslint 0; the 21 test files (347 tests, then the 9 with matchers to move: 173, then 15) 0; the two new
files 0 (14 tests); title-case, label-sweep, plural-check, voice-check, tics, spelling, typos, doc-refs, deciders 0;
guide-quotes 0 (581 of 581, after two quotes in the guide moved with their refusals). `text-inventory --check` 1 on my
own guide entries and `cancelRefusal` only, as after batch 1.

**Screens:** the Cards and Statements tabs rendered in the tests above; the built app at the end.

## Batch 3: Borrowing, Overdrafts, Collections, Term Deposits And Switching

**Sources (35):** `src/engine/systems/lending.ts` (32), `src/ui/bank/BankLending.tsx` (2), and batch 2's
`src/engine/systems/credit.ts#statementWords`, a new source for the helper the statement notice's words moved into.
Rewritten 16, Retained 19.

**Interactions read whole:** *borrowing:* the Personal Loan panel's terms, the quote, each refusal of the quote and of
Borrow It, the toast, the loan's line, its due date, a missed payment's notice, Pay It Off; *an overdraft:* each kind's
paragraph (per item, tacit, unarranged, secured, arranged), the offer and its refusals, Arrange It, its fees on hold, the
French overrun's three letters, the 60-day close and its notices, In Collections and Pay It; *a term deposit:* Put It
Away, its refusals, the toast, its three endings; *switching* (decision 4): the panel, its refusals, the confirmations,
the outcomes, Past Switches.

**What changed.**
- *Score floors said as figures:* "Your credit record isn’t strong enough for the bank." became "Your credit score is
  below 580, and in the game a bank doesn’t lend below that." (and "… doesn’t arrange an overdraft below that."), and a
  bank publishing only its lowest rate lends "only with a credit score of 670 or more" for "only to a good credit
  record". Both floors are the game's (`ESTIMATE.scoreFloor`, `scoreGood`), so "in the game".
- *The payment-share refusal* gave no share and no figure to compare: "A payment of $176 a month is more than the bank
  lets a loan take of $138 of wages." Now: "… is more than the 35% of your wages a loan can take: $48 of the $138 paid in
  over the last 30 days."
- *A missed loan payment* named neither the loan nor the account, and said "there was only $0.00": now "Your Citi
  Personal Loan payment of $264.09 was due, and Chase Total Checking had nothing available to pay it."
- *A set-off with nothing closed* opened "It had been below zero …" with no account; it now names the account.
- *The French overrun letter* said "by €30.24 ($32.86) at 18.40% a year, with the charges each month brings", as if the
  rate were the overrun's; now "by €30.24 ($32.86). The bank charges 18.40% a year on what’s overdrawn, as well as its
  monthly charges."
- *Checking account* in every refusal here; "switch to a bank in the country you live in".
- *Toasts that were fragments:* "Put away." became "Your CD is open, locked until August 24, 2027."; "Borrowed." became
  "Your $2,000 loan is in Citi Access Checking."; "Paid off." became "Your loan is paid off.".
- *In Collections* (defect m2, fixed): "It’s on your record until it’s paid." became "The charge-off stays on your credit
  record for seven years, paid or not. While the debt is unpaid, no bank approves a card, and Chase won’t open an account
  for you." A debt owed to a bank abroad isn't on the record (`closeForOverdraft`'s `onRecord`), and the panel then says
  only what the debt blocks; Mexico's years go by the debt's size, so they aren't named there.
- *Kept:* the switch's outcome notices and refusals (decision 4: their words were already plain, each saying what
  moved, what stayed and the one step left), the term deposit's endings, every statement memo (two of them,
  "Charged off by " and "Charged off: ", are read back by `collectionsSource` and are keys).

**Meaning-sensitive changes, and how each was checked.**
- *35% and $48:* `ESTIMATE.loanShareOfPay` and `Math.floor(pay × share)`, whole dollars as the other figures in it;
  the comparison (`payment + existing > pay × share`) is unchanged.
- *"is below 580":* `score < ESTIMATE.scoreFloor`, for the overdraft and the loan alike.
- *m2:* `markRecord` keeps a mark until `marksFallOff` takes it after `MARK_YEARS`; `bank.pay_collections` posts the
  payment and closes the debt at zero, and touches no mark; `card.apply` declines with any collections debt, and
  `openRefusal` at the bank owed.
- *The term deposit's toast:* the command's own `maturesAt`; `lending.term.called` is the product's name ("CD").

**Defects:** m2 fixed (`defects.md`); the two In Collections tests in `tests/evidence-g10-money.test.ts` assert the new
sentence, and with the old one put back both fail (checked).

**Tests and tool matchers updated:** defects-g18-1, evidence-g10-money (and its `formatDate` import for the toast),
evidence-g11-money, evidence-g14-money, home-account-setoff, remaining-09-banking. New in
`tests/editorial-money.test.ts`: the overdraft's score floor, and Arrange It and Borrow It on a savings account. The
opening-word check failed once on `BankLending.tsx` (eight of 25 lines on "The" after the new toasts); two toasts open
on "Your" instead. No UI tool matcher held these words.

**Checks:** tsc 0; eslint 0; the affected tests 0 (128, then 40, then 53); title-case, label-sweep, plural-check,
voice-check, tics (after the toasts), spelling, typos, doc-refs, deciders 0; guide-quotes 0 (582 of 582, after six
quotes in the guide moved with their refusals). `text-inventory --check` 1 on my guide entries and `cancelRefusal`
only.

## Batch 4: Accounts Over Time, Card Security, Cash, Round-Ups And The Home Account

**Sources (51):** `src/engine/systems/accountlife.ts` (17, and the new `yearsWord`), `src/engine/systems/security.ts`
(10), `src/engine/systems/cash.ts` (5), `src/engine/systems/roundups.ts` (5), `src/engine/systems/homeaccount.ts` (7),
`src/ui/bank/BankAccountLife.tsx` (2), `src/ui/bank/BankSecurity.tsx` (2), `src/ui/bank/BankCash.tsx` (1),
`src/ui/bank/RoundUps.tsx` (1). Rewritten 19, Retained 32.

**Interactions read whole:** *opening and closing in the cooling-off period:* Your Accounts Over Time's Cancel It line,
its refusals (shared with Close It since batch 1), and what canceling gives back; *an account left unused:* inactive,
dormant and its notice, Reactivate, the bank's letter before the state takes it, Keep The Account, Unclaimed Money and
Claim It Back; *a term deposit's end:* the ends-soon notice, the end buttons, break early and its penalty; *a card
lost:* Lock It, Report It, the new card's day, a payment that wasn't yours and its refund; *cash:* the quote under Take
It Out, each refusal, Pay It In; *round-ups:* the form, its refusals, what's counted and moved; *the home account*
(creation's Before Yale): each refusal and what follows from keeping it.

**What changed.**
- *Checking account* in the term deposit's end ("is paid, with its interest, into your checking account"), the
  NatWest notice period's notice, the cash deposit refusal, the round-ups refusal, and security's three "You have no
  current account." refusals ("You don’t have a checking account."), and cash's "You need a bank account" ("a checking
  account": the account it reads is the primary checking account).
- "Your primary current account can’t be canceled." became "You can’t cancel your primary account. Make another
  account primary first."
- *Dormant, in cash:* the deposit refusal says what didn't happen ("…, so nothing was paid in. Reactivate it under Your
  Accounts Over Time, then try again."), as Move Money's does. The withdrawal's is read both before and after Take It
  Out is pressed (`withdrawalQuote`), so it gives the step and no "nothing was …": "… is dormant. Reactivate it under
  Your Accounts Over Time to take cash out of it."
- *Available:* a withdrawal its account can't cover says "has only … available" and "has nothing available", as Move
  Money's refusals do.
- *Numbers under ten in words:* the bank's letter before the state takes an account says "nearly three years", and the
  Unclaimed Money notice "for three years".
- *The card's French spending limit:* "Estimated: the lowest limit the bank sets." became "The limit shown is the lowest
  the bank sets, which is estimated.", a sentence that says what's estimated.
- *The home account (creation):* "before this life" (a life outside Yale) became "before you came here"; "You began
  living there after Yale began." became "You moved there after Yale began."; "There’s no research on what … does when
  a customer moves to America, so the game can’t offer it." became "The game doesn’t know what … does …, so it can’t
  offer this account."; the opening float leads with the figure ("opens with ¥10,200 from your savings, what its fees
  come to until you graduate in May 2029, or as much of that as there is. Move more in before it runs low."), where
  "as far as that goes: move more in" left the condition unclear.
- *Kept:* the fraud and new-card notices, the round-ups' refusals and reasons (Citi's Spend & Save notice already said
  "checking account", Citi's own word), the cash panel, the account-life panel's lines, the statement memos.

**Meaning-sensitive changes, and how each was checked.**
- *"or as much of that as there is":* `feesToGraduation` is the whole fees total; the opening moves it from savings as
  far as savings go, which the old "as far as that goes" meant.
- *"You can’t cancel your primary account":* the refusal runs where the account is the one `currentOf` returns, the
  primary checking account.
- *The quote's dormant line:* `withdrawalQuote` feeds the panel's line under the amount before anything is pressed and
  the command's refusal after; a sentence true in both.

**Tests and tool matchers updated:** accountlife (via the new test), editorial-money-refusals (brief 14's refusal shapes:
two variants to "available"), evidence-g10-money, evidence-g12-money, evidence2-b04, home-account-creation, roundups.
New in `tests/editorial-money.test.ts`: canceling the primary account, the unclaimed letter's years, a card locked or
reported, a new number and cash taken out with no checking account, and a life outside Yale's home account question;
in `tests/editorial-money-screens.test.ts`: the French card's limit line and TD's term deposit end. No UI tool matcher
held these words.

**Checks:** tsc 0; eslint 0; the 14 affected test files (249 tests) 0 after one cash assertion moved to "available"; the
new files 0 (17 and 8 tests); title-case, label-sweep, plural-check, voice-check, tics, spelling, typos, doc-refs,
deciders 0; guide-quotes 0 (582 of 582, after ten quotes in the guide moved). `text-inventory --check` 1 on my guide
entries only (`cancelRefusal` is marked now).

## Batch 5: The Bank Screen's Frame, The Money Looks, The Day's Spending And Payment Alerts

**Sources (43):** `src/ui/workspaces/BankWorkspace.tsx` (9), `src/ui/looks/money.tsx` (15),
`src/engine/systems/spending.ts` (10), `src/engine/systems/obligations.ts` (2), `src/engine/core/ledger.ts` (1),
`src/engine/core/money.ts` (1), `src/engine/content/currency.ts` (2), `src/engine/systems/banknumber.ts` (1),
`src/engine/systems/earnings.ts` (2). Rewritten 9, Retained 34.

**Interactions read whole, in order, across files:**
- *Moving money, done:* Move Money's subtitle, From and To, the hint under the fields (free withdrawals, Germany's
  allowance), the toast, and the guide's Moving Money example, which quotes the toast.
- *Closing savings:* the line beside Close It (`closingWords`), the toast, the notice line once notice is given.
- *The day's spending refused:* the meal and groceries refusals (`spendRefusal`), No Money For Food Today, and the guide's
  How You Pay entry, which tells the player when cash is spent.
- *Short For A Payment and Low Balance:* the alert, its remedy (`obligationsAhead`), and the guide's Keeping An Account
  entry.
- *The looks:* an account, net worth, what's owed and where it went, each in its variants (owed, overdrawn, empty,
  holding; one debt and several; no accounts).

**What changed.**
- "Current account" became "checking account": the account look's kind, **Checking Account** (`renames.json`, from the
  frame area's report), savings' tail ("pays what the checking account can’t"), and Move Money's two fallbacks ("moves
  to your checking account then").
- Move Money's confirmation names where the money went: "Moved $25 to Chase Savings.", "Sent £1,000.00 to Chase Total
  Checking. It arrives September 2, 2026." The guide's example quotes it.
- Defect m1's third instance: the hint "You can take out €2,000 more this month without notice." with €1,999.50 left
  now gives €1,999.50 (`defects.md`).
- Other Charges says what's estimated: "The timing is estimated: Arion’s price list and terms don’t say when in the year
  it’s charged.", as the account panel's card year line does since batch 1.
- The looks' provenance lines no longer show the bookkeeping: "It’s added up from all your accounts each time you look,
  so it’s right to the cent." for "Added up from your accounts each time you look, and stored nowhere. Every payment
  behind it has a matching entry on the other side, and the books balance to the cent."; "The balance is the sum of
  every payment into and out of the account." for "…, not a figure anybody typed in."
- Credit Used: "takes points off your credit score, and the more you use, the more it takes." for "takes points off
  your record, and more the more you use."
- The day's spending with cash unspent: "Your bank and card can’t cover it. Your cash in hand would, but it isn’t spent
  while The Day’s Spending is on a card. Set it to In Cash, Then The Debit Card, under How You Pay." It says what
  failed, why the cash didn't help and where the setting is.
- No Money For Food Today ends "You’re eating what’s left in the cupboard today, and it isn’t enough." for "It’s what’s
  in the cupboard today, and not enough of it."
- Short For A Payment: "…, and it has $12.00 available." for "and it holds $12.00", the available balance being what
  the payment can take.
- *Kept:* the fee and waiver lines, the interest sentence, the sources line, the head line's sums, the account numbers in
  each country's format, the currency symbols, the spending categories, the ledger's integrity errors (never shown in
  play), the locale and time zone codes.

**Meaning-sensitive changes, and how each was checked.**
- *"isn’t spent while The Day’s Spending is on a card":* `spendRefusal` returns these words only where the debit card
  works, the day isn't paid in cash, and cash would cover what the bank and card can't. A locked or stopped debit card
  spends the cash too, but has its own words before these, so "only spent when …" would have overstated it.
- *"has … available":* `accountAlerts` compares the payment with `inReach(account)`; the figure is `balanceText`, the
  account's available balance.
- *The credit score sentence:* `credit.ts` takes points by tenths of utilization past 30%; the words give no figure.

**Tests and tool matchers updated:** defects-r1-1 (cash unspent, the cupboard sentence), evidence-g10-money and
evidence-g12-money (the same), guide-examples-money (the Moved quote, now with the account), home-account-transfers (the
Sent toast), language-dynamic (Short For A Payment), language-money (Arion's timing, the savings look, the net worth
provenance). Added: remaining-banking's one-press Move Money test now reads the toast; a new m1 test in
`tests/editorial-money-screens.test.ts` renders Move Money with From on Deutsche Bank's Flexgeld after €0.50 out and
fails with the old figure. No UI tool matcher held these words.

**Checks:** tsc 0; eslint 0 on the changed files; the affected test files 0 (149 tests, then 31 and 60 on reruns);
title-case, label-sweep, plural-check, voice-check, tics, spelling, typos, doc-refs, deciders 0; guide-quotes 0 (582 of
582). `text-inventory --check` 1 on my guide entries only, which batch 6 reads.
