# A Bank Account Kept At Home: Modules 4 And 5, Operating From Abroad And Payments Between Countries

On 2026-10-16 the owner decided that an eligible Yale student keeps an account they held in the country they lived in
before Yale, beside the American one, under that bank's real rules, with nobody traveling or moving. Module 1
(`module-1-ledger.md`) gave an account in another currency its own exact figure; modules 2 and 3 (`module-2-3.md`) the
research as data, the rule and the opening. This record covers module 4, the account operated from America, and module
5, money moved between the two countries.

## What Was Wrong

When modules 2 and 3 were finished, creation said what followed from keeping the account and nothing carried it out:
Barclays' closing, every charge for a customer abroad, and the conditions (`docs/UNBITTEN.md`). A home account was a
second current account in every other way, so Your Banks offered savings, overdrafts, loans and wages there; its card
paid here for nothing; and a payment from Barclays to Chase would have taken Britain's Faster Payments and landed at
once, free. Interest at a home bank was taxed at its country's resident rate (Japan's 20.315%, Germany's 26.375% over the
allowance), and a fee in yen or won drifted from the bank's figure, since only the dollars were passed.

## What Changed

- `tools/build-home-accounts.mjs` copied each bank's card, cash machine, payment, opening, identification and tax at
  source fields as `abroad`, each country's tax at source on a non-resident (`countries`) and America's rules on a
  student's account abroad (`us`) into `src/engine/content/home-accounts.json`.
- `src/engine/content/homeaccounts.ts` read them by hand into `AbroadTerms` (each bank's `abroad`): its debit card's fee
  on a purchase in another currency, its fee at a machine abroad, its fee and margin on a payment abroad and its days,
  its fee on one received, its limits, and its own words for opening nothing new for a customer abroad. A figure the
  research found only on an aggregator or a blog, or found unpublished, was left out; what needs it was refused in words.
  The margin and the days, which almost no bank publishes, took SLATE's stated assumption where unpublished: the FSB's
  2024 average cost of a payment abroad, 2.6% (the research's calibration), and three business days (the middle of the
  one to five the publishing banks give). `US_WIRES` held the five American banks' wires; `NON_RESIDENT_TAX` each
  country's rate on a customer abroad, with no treaty rate where the research says it must be claimed by form (Japan
  15.315%, Korea 22%, Iceland 12%), and New Zealand's treaty 10%, which its banks apply themselves.
- `src/engine/systems/abroad.ts` (new): `abroadRefusal`, `nonResidentTaxOn`, `nonResidentFeeDue`, `cardFeeAbroad`,
  `cardAbroadRefusal`, `atmAbroad`, `abroadQuote`, `sendAbroad`, `arriveFromAbroad`, `armHomeAccounts` and the closing
  (`HOME_CLOSES_KIND`).
- `src/engine/systems/bankmoves.ts`: `sendBetweenBanks` sent any payment between two countries abroad before the
  sending country's same-day path, so transfers, savings and current accounts closing, opening deposits and a bank's
  closing all went that way; the arrival handler landed one less its margin and fee, once, or sent it back less them;
  `bank.redirect_deposits` refused a home account ("Yale pays into an account in America."); `bank.set_primary` refused
  a home card the bank cancels (SMBC) or whose fee the research hasn't.
- `src/engine/systems/banking.ts`: `feeFor` gave the bank's own figure (`native`) on an account in another currency, and
  the month's end and the quarterly closing passed it (with `feesDueHeld`, `src/engine/core/ledger.ts`, beside
  `feesDue`); the fee for a customer abroad was charged on its schedule; `interestTaxOn` took the non-resident's rate
  where the holder lives outside the bank's country, with no resident's allowance; `bank.open_savings` was gated;
  `bank.transfer` took `in`, the sending account's own money.
- `src/engine/systems/lending.ts`: the abroad gate on `bank.open_term`, `bank.borrow`, `bank.arrange_overdraft` and
  `bank.debit_overdraft`; `chargeForPurchase` charged a home card's foreign fee on what it paid, in the bank's money; a
  charge-off re-banked them at a bank where they live and left a home account alone. `src/engine/systems/cardlife.ts`
  gated `card.apply`; `src/engine/systems/spending.ts` passed what the debit card paid.
- `src/engine/systems/cash.ts`: a home card at another bank's machine here paid its fee abroad in its money and the
  machine owner's American $3.22; its own machines, its counters and the Post Office were refused, and cash paid into a
  home account too.
- `src/engine/content/bankdays.ts`: `afterBusinessDaysIn`, the days both countries keep, from the day after, at five.
- `src/engine/index.ts`: `registerAbroad`, and `armHomeAccounts` on the first morning and on every load.
- `src/ui/workspaces/BankWorkspace.tsx`: Move Money took the amount in the sending account's money ("Amount (GBP)"),
  listed a home account by what it holds in its money, drew the quote's line from `abroadQuote` under the amount, and
  its toast said the pounds sent and the day they arrive.
- `src/engine/content/guide/money.ts`: `bank.home-account` said what happens from then, its figures from the terms.

`Account.peak` wasn't added: nothing in these modules read it, and module 6 is where America's reporting thresholds
would. No schema version changed: `feesDueHeld` and the scheduled items' payload fields were optional, and no older save
had a home account.

## How It Was Proved

`tests/home-account-abroad.test.ts`, 10 tests, and `tests/home-account-transfers.test.ts`, 8 tests, all passing. Each
life was made with `createSave` on `newLifeConfig` and Before Yale's fields, and played through commands, the clock and
the rendered Move Money panel. Every figure was worked by hand from `content/currency.ts`, as each file's header shows:

- Refusals in the bank's words at HSBC UK (savings, a term deposit, a loan, an overdraft, a credit card, cash paid in),
  Yale's for wages, Barclays' for savings; Chase opened savings the same day.
- SMBC's ¥220 on 31 August (22,000 sen, 147¢); BNP Paribas' €15 on 31 August and 30 September (1,500 cents, 1,630¢); SG's
  €75 at 30 September for a holder of 26 (7,500 cents, 8,152¢) and nothing for one of 24; Deutsche Bank's two months of
  €6.90 at its quarterly closing, 1,380 cents and 1,500¢, and no tax on the Flexgeld's interest.
- SMBC's savings earned 54¢ to 31 August and Japan took 8¢, its non-resident's 15.315%, not the 11¢ of a resident's.
- Barclays' notice on the first morning with October 23, 2026, once through a reload; on that day both accounts closed
  at nothing in both figures, the October interest settled, the whole sent; it landed on Tuesday October 27 at five less
  2.75% and $15, and "Barclays Closed Your Account" was said once. An F-1 at HSBC UK kept it. A US citizen at a test bank
  that closes a US person's account had the notice and an F-1 at the same bank didn't.
- HSBC UK's card as the primary paid 2.75% of each day's food in pence; another bank's machine, $100, cost 392p and the
  owner's $3.22; its own machine and a credit card were refused, and SMBC's card as the primary.
- Barclays to Chase, £1,000 on Friday 28 August: 121,601¢ arrived on Wednesday 2 September over England's summer bank
  holiday, the margin 3,481¢ and Chase's 1,500¢ posted, nothing across at once; the same on Friday 4 September landed
  Wednesday 9 September over Labor Day. SMBC to Chase, ¥100,000 on Friday 18 September for ¥3,500 and its ¥1 a dollar:
  64,723¢ on Monday 28 September, past Japan's Silver Week. Chase to HSBC UK, $1,000: $5, SLATE's 2.6%, HSBC UK's £5,
  76,446p exact on Thursday 3 September. Reloaded with it on its way, it arrived once. Sent to Barclays two days before it
  closed, it came back to Chase less 1,300¢ and 759¢.
- Refusals in words: an empty account, Mizuho's own reason, ASB's unpublished fee for sending, PTSB's for receiving, and
  SMBC's fee beside the whole of its savings.
- The Move Money panel rendered "Amount (GBP)" and the quote's sentence; Move It sent the pounds and the toast said
  "Sent £1,000.00: it arrives September 2, 2026."
- Barclays and HSBC UK lives, with payments both ways and a month played: `audit` and `breaches` empty, nothing
  inactive.

Each mutation was applied, run against the new tests, and restored byte for byte (compared with its copy):

| Mutation | Result |
|---|---|
| The abroad gate never refusing | Killed: 2 tests (HSBC UK's refusals, its credit card) |
| `sendBetweenBanks` not routing to `sendAbroad` | Killed: 7 of 8 transfer tests |
| The sender's country's days alone | Killed: 2 tests (Labor Day's Wednesday, Chase to HSBC UK's Thursday) |
| The receiver's country's days alone | Killed: 3 tests (England's bank holiday, Japan's Silver Week, the panel's date) |
| The closing's notice armed again on every load | Killed: the notice said twice after a reload |
| The non-resident's tax branch dropped | Killed: 2 tests (Japan's 8¢ became 11¢, Germany's Flexgeld taxed) |

A first run of these mutations lost its copies: the scratchpad's `bak` was a directory another session keeps, so `cp`
put the copies inside it and the restore failed, leaving three mutations in place. They were restored by hand from those
copies and the three lines rewritten, the copies taken out of that directory, `tsc` and both new files rerun green, and
the mutations run again with copies of their own, as above.

Each of these files was run alone (VITEST_MAX_FORKS=1), and every test in it passed: acceptance-contract, accountlife,
arrears, bank-fees, bank-lifecycle, bank-moves-card-line, bank-moves, bankdays, banking-complete, banking, banknumbers,
base44-adapter, base44-contract, cardlife, cardoffers, cards, cash, citizenship, cohesion, coverage-gaps-statements,
creation, cross-journeys, defects3-bank, the five evidence money files, guide-examples-money, guide-examples-papers,
guide-examples-school, guide-examples-start-day-body, guide, the four home-account files, integrity, journey-life,
journey-money, lending, migration-92, migration-94, money-fixes, money-plan-interest, money, pending, persistence,
roundups, save-migration, the six scope files, security, server-guards, several-cards, simulation, smoke,
socialsecurity, statements-hardship, statements, tutorial.

defects3-bank failed once: a Toronto life borrowing from Citi was refused by the abroad gate, which then held every bank
in another country. A home account is the only way a life holds one, so the gate was narrowed to a bank the research
reads as kept from home (`homeTerms`), and the Toronto life was lent to as before. The coursework and production guide
examples and journey-three-students weren't run: another session was editing what they read at the time.

`tsc -b --noEmit` and ESLint on every changed file were clean. title-case, label-sweep, plural-check, voice-check, tics,
doc-refs, wired, spelling and typos passed. The full gate wasn't run.

## What Modules 6 And 7 Must Know

- Module 6, tax. `payInterest` still called `recordInterest(owner, at, zone, earned)` with the gross interest in the
  save's dollars and no country: a home bank's interest was recorded as ordinary interest. The withholding taken at
  source is posted to "Tax On Interest" by the same transaction, at `NON_RESIDENT_TAX[bank.iso]`, so `recordInterest`
  can be given `{ iso, withheld }` from `nonResidentTaxOn(sim, account)` and the posting. An F-1's foreign interest is
  already left out by `nonresidentFor`; a US citizen's must go into `y.interest` with the withholding credited
  (`RESEARCH.us.usPersons`). FBAR and Form 8938 for a US person need `Account.peak`, which wasn't added: nothing here read
  it. `heldFromAbroad(sim, account)` tells which accounts are foreign; `usPerson` (`systems/bankmoves.ts`) who is a US
  person. The thresholds are quoted in `RESEARCH.us.fbar` and `RESEARCH.us.form8938`.
- Module 7, screens. Only Move Money shows a home account in its own money (`heldText`, `heldOf` in
  `systems/abroad.ts`); every other line, each account panel's Balance, its fee and interest words, statements
  (`statementReady`'s "at the close" is in dollars), Home's money line and the tutorial, still formats `account.balance`
  in the save's money. The closing notice and the quote's words already use the bank's money. The account panel could
  say a home account's card fee and the fee for a customer abroad from `homeTerms(id).abroad` and `nonResidentFee`.
- Simplifications stated here and not modeled: a payment returned from a closed account comes back less the margin and
  the receiving bank's fee as if it had landed; payments by hand and standing orders from a home primary aren't charged
  the card's foreign fee (only the debit card's purchases are); BBVA's €300 a month free counts that month's purchases;
  Mexico's IVA was taken at 16% and Korea's dollar steps at 1,350 won; conditional retention is taken as met.
