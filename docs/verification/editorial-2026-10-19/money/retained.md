# Brief 15, The Money Area: A Sample Of What Stayed

Each source kept in the second pass has its reason in `docs/text/second-pass/money.json`. These are a sample, across the
files, each with its words and its reason, so the reasons can be judged as well as the rewrites.

## Batch 1

- **`src/engine/systems/bankmoves.ts#limitRefusal`:** "Citi lets you send $10,000 a day to other banks, and you’ve sent
  $9,500 today." Kept: it names Citi's own published limit, a day's or a month's, and what's already gone against it, so
  the player sees exactly why it stopped and can work out what's left. A "so nothing was moved" would read wrong in the
  two other places these words land, a standing order's notice ("didn’t go through" already says it) and opening an
  account.
- **`src/engine/systems/bankmoves.ts#registerBankMoves <world.day_rollover>`:** "The bank closed it because no money was
  paid into it within 60 days of opening." and "It sat at a zero balance for 90 days, so the bank closed it." Kept: each
  opens the bank's closing notice with the bank's own condition and its count of days, as the cause.
- **`src/engine/systems/payments.ts#registerPayments <bank.add_standing_order>`:** "A standing order can only go into one
  of your savings accounts.", "… is a term deposit, locked until its end. A standing order goes into easy-access
  savings.", "Enter how much to pay each month.", "Pick a day of the month, 1 to 31." Kept: each names exactly what the
  form needs, one thing per refusal, in the form's own terms.
- **`src/engine/systems/routing.ts#linkedTo`:** "A standing order pays from it on the 28th", "Citi Personal Loan’s
  payments come from it", "A payment set for a date uses it". Kept: each names one instruction that still uses the
  account, so Close It's refusal is a list of exactly what to move.
- **`src/engine/systems/bankmoves.ts#openApproved`:** "Your New Card Arrives". Kept: the calendar's entry for the day a
  new account's debit card comes, a Title Case event name that says what happens that day.
- **`src/ui/looks/bank.tsx#movedWords`:** "put $500.00 into Chase Savings", "took $41.10 off what you owe on Chase Freedom
  Unlimited". Kept: what a statement line did to each account, joined into the line's summary ("It took $500.00 out of
  Chase Total Checking and put $500.00 into Chase Savings, on …").
- **`src/engine/systems/banking.ts#payInterest`:** "Interest", "Tax On Interest". Kept: ledger account names the lending
  code reads back by name and The Year shows as row labels; they're keys as much as labels (`common.md`, known keys).

## Batch 2

- **`src/engine/systems/cardlife.ts#registerCardLife <card.request_limit>`:** "The bank kept your limit at $5,000. It
  raises a limit only with a credit score of 700 or more, no late payment in the last year, and money in the bank to
  repay it." Kept: it says what happened and the bank's three conditions, each something the player can check.
- **`src/engine/systems/cardoffers.ts#transferRefusal`:** "It would come with a $2,500 limit, and moving $3,000 needs
  $3,150 with its fee. Pay the old card down first." Kept: the figures that refuse it, and the one step that would
  change the answer.
- **`src/engine/systems/credit.ts#persistentDebt`:** "Over eighteen months, more of what you paid the Barclaycard went to
  interest and fees than to the balance. Paying more than the minimum would clear it sooner. If you can’t, press Ask For
  Help With Payments on the card." Kept: Britain's rule in plain words, what would help, and the button by its label.
- **`src/ui/bank/feeWords.ts#waiverWords`:** "waived in any month you have $500 of electronic deposits (wages, benefits
  or a tax refund) paid in, or keep $1,500 in it all month". Kept: each condition as something the player does in a
  month, the way a bank lists them.

## Batch 3

- **`src/engine/systems/lending.ts#completeSwitch`:** "Your Classic Account is open and your wages, standing orders
  and autopay move to it. Barclays Bank Account stays open with £120.00, as you asked. Move it and close the account on
  Money, under Your Banks, whenever you want." Kept: decision 4's notice for a partial switch from Barclays to Lloyds says what
  opened, what moved, what stayed and the one step left, in the order they matter. (Figures illustrative.)
- **`src/engine/systems/lending.ts#registerLending <world.day_rollover>`:** "It moved, with its interest, into your
  easy-access savings at the same bank, where it can be taken any time." Kept: where the money is now and what that
  means, the two things the end of a term deposit has to say.
- **`src/engine/systems/lending.ts#registerLending <bank.repay_loan>`:** "Citi Access Checking can’t cover the $1,912.40
  it takes to pay it off, so nothing was paid." Kept: the house's refusal shape for money that isn't there, the account,
  the figure and what didn't happen.

## Batch 4

- **`src/engine/systems/security.ts#somebodyElse`:** "Somebody tried to spend $412.00 on your debit card ending 0146. Chase
  declined it and asked you about it. It wasn’t you, so the card is blocked, and a free replacement is on its way." Kept:
  what happened, what the bank did, what it means for the card, in the order a bank's text message gives them.
- **`src/engine/systems/roundups.ts#moveRoundUps`:** "Your checking account was under the minimum balance you set three
  days running, so Citi turned Spend & Save off. What it had counted but not yet moved stays in your checking account.
  Turn it on again under Your Accounts Over Time." Kept: the cause, what happened to the money, and how to undo it.
- **`src/ui/bank/BankAccountLife.tsx#END_BUTTON`:** "Renew It At The End", "Move It To Savings At The End", "Pay It Out At
  The End". Kept: three buttons that each name the action and when it happens, distinct from each other.

## Batch 5

- **`src/ui/workspaces/BankWorkspace.tsx#closingWords`:** "It holds more than the €1,999.50 you can take out this month
  without notice, so closing it gives three months’ notice, as the law requires. The money moves to AktivKonto then."
  Kept: why closing takes notice, the figure to the cent, and where the money goes, in one panel line beside Close It.
- **`src/ui/workspaces/BankWorkspace.tsx#interestWords`:** "Pays 0.5% a year (0.501% APY). Interest builds up daily and
  is paid at each quarter’s close: the end of March, June, September and December. The bank keeps back 26.375% for tax
  on interest past the first €1,000 each year, and €1,000 of that allowance is left this year." Kept: the rate as the
  bank's terms state it, when it's paid, and the tax with what's left of the allowance.
- **`src/ui/looks/money.tsx#accountSentence`:** "You owe $41.10 on it at Chase, which leaves $458.90 of its $500.00
  limit free to use." Kept: what's owed and what's left to use, the two figures a card's look is opened for.
- **`src/engine/systems/obligations.ts#obligationsAhead`:** "Move money into it, pay the card by hand, or have autopay pay
  from another account." Kept: the three ways out of Short For A Payment for a card's autopay, each a control the
  player has.
- **`src/engine/core/ledger.ts#Ledger`:** "Transaction … doesn’t balance: postings sum to … cents, expected 0." Kept: the
  ledger's integrity errors are thrown only on a bug in the game, never in play; a player doesn't read them.

## Batch 6

- **`src/engine/content/guide/money.ts#MONEY [history]`:** "A debt sent to collections stays in Owed until it’s paid."
  Kept: Owed lists it until it's paid, which is all the connection says; the record's years are in the entry's later
  field now (m2).
- **`src/engine/content/guide/money.ts#MONEY [evaluation]`:** "The credit record your card payments build is what a bank
  looks at to arrange an overdraft or lend to you, and at what rate." Kept: what the card's record decides elsewhere,
  once, with the two things it decides.
- **`src/engine/content/guide/money.ts#CHASE_BANDS`:** "90 days’ interest on a term under 6 months, 180 days’
  interest on a term under 24 months, 365 for a longer one". Kept: the penalty as the bank's own table puts it.

## Batch 7

- **`src/engine/content/cards.ts#CARD_LAW`:** "Criminal Code s. 347 (criminal rate: over 35% APR, since January 1, 2025);
  Quebec Consumer Protection Act (minimum payment); …" Kept: the law as it names itself, cited in the cap line's Source
  with the page it was read on; a citation, not the game's own words.
- **`src/engine/content/cards.ts#CARDS` (us-chase, planWords):** "Chase Pay Over Time (formerly My Chase Plan): a fixed
  monthly fee instead of interest; 0% during the 15-month intro period, then up to 1.72% of the plan amount per month".
  Kept: already a plain sentence with the bank's product names and its figures.
