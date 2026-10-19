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
