# Brief 20, The Money Area

Written down by the coordinator from the money area's report as it returned it (2026-10-22): the harness wouldn't let the
area write this file itself, and it didn't work round that. The words are the area's but for this note.

**Clone:** `b20-money`, from `12c04ee1`. The last commit that changes `src` is `bf632759`, and every row says
`readAt: bf632759`.

## Commits

- `4928bf7e`: the comparison tests and the clock-risk tests; repairs for defects 1 and 2.
- `b79e10d9`: the round-ups guide promise corrected (defect 4); five promises that no test held now have tests.
- `bf632759`: repair for defect 3; a test holding the money looks to the ledger.
- `bcadde53`: every row and promise read against the code; the 22 mutations; one test made stronger.
- `08b06438`: two rows had evidence-g11's Regulation E figures the wrong way round; corrected.

## Rows And Promises (`effects/money.json`)

`node tools/effects.mjs --todo money` lists nothing; the full check names no problem in `money.json`.

| | Implemented And Verified | Implemented, Verification Incomplete | Total |
|---|---|---|---|
| Rows | 81 | 15 | 96 |
| Promises | 57 | 6 | 63 |

- **96 rows:** the 95 seeded rows and `bank.transfer_arrives`, given a row of kind `other` because the tools missed it
  (Outside The Area).
- **Verified once read again:** `bank.application`, `bank.current_closes` and `bank.home_closes` (a London-raised student
  keeping a Barclays account at home reaches `bank.home_closes` from creation), and the six money looks.
- **The 15 still incomplete:**
  - 13 no current life reaches, each read again on `bf632759` and not made reachable: `bank.arrange_overdraft`,
    `bank.take_overrun_loan`, `bank.switch`, `bank.cancel_switch`, `bank.stop_balance_transfer`, `bank.switch_complete`,
    `bank.switch_review`, `bank.switch_debt`, `bank.cancel_new`, `card.money_transfer`, `bank.term_notice`,
    `credit#persistentDebt` and `lending#completeSwitch`;
  - `lending#refundInterestTax`, a resident's refund, where no life lives in Iceland;
  - `security#attemptOnNumber`, whose only test passes the day's draw in by hand rather than running the clock.
- **The 6 promises still incomplete:** tax owed worries you and Owed leaves it out (no test reads either); Move Money
  appears once there are two accounts (two promises: no test renders the tab); The Card's Offers sits beside the card (no
  test renders it); a cooling-off cancel (the US has none); and a money transfer (unreachable, above).

## The Comparisons

Each is a test the gate runs, a pair of lives from one seed alike but for one input, nothing set by hand.

- **A card payment the account can't cover** (`tests/b20-money-funds.test.ts`, Capital One). One twin moves its checking
  into savings around two due dates.
  - The first miss: a $25 late fee, not yet on the record.
  - The carried statement then charged $13.43 interest on 20 October and $19.11 on 20 November.
  - The second miss: on the record, a score of 745 against the twin's 801; the limit cut from $65,217 to $45,652; the card
    suspended.
  - A Chase card applied for the next day was priced at 20.83%, against the twin's 18.41%.
  - No leak: the savings interest the same at four month ends, and the School's tally the same.
- **A bill the account can't pay** (Chase): the $1,882 Yale Health plan was recorded as owed; the next midnight repaid it
  from savings, and the bank paid $1,882 once in each twin.
- **A purchase the account can't pay** (Chase, the card locked in both twins): the groceries declined and the day unfed,
  with no overdraft and no fee; the twin's were bought.
- **A card carried against one paid in full** (Capital One at 28.99%): paying the minimum, interest of $13.23, $17.78,
  $24.38 and $32.79, rising each month; paying in full, none. No leak: the same score, limit, savings interest and School.
- **Autopay against paying by hand:** the same (no interest, no fee, the same score). SLATE has no way to turn autopay off.
- **A savings rate:** $50,000 moved into savings at 3.00% on 1 September earned $119.18 more in September, 29 days ×
  $50,000 × 3% ÷ 365 worked by hand. No leak into the card or the School.
- **Which bank holds the money:** a Chase life and a Capital One life end the fall term with the same School record, craft
  and body, to the byte.

## The Twelve Kinds

- **Counted twice, or an obligation skipped:** one life played with the clock moved an hour, a day, a week and a month at
  a time posts the same ledger, medical transactions aside.
- **A save and a load in the middle of a cycle:** saved and opened at each risky moment (a statement cut with its due date
  pending, a card on its way, money in transit between banks, a payment set for a date, just after a month's end), against
  the same life played straight: the same to the byte.
- **Month ends and weekends:** the month's ends on Saturday 31 October 2026 and on Memorial Day pay interest and standing
  orders once each; a due date on a Sunday is paid that day.
- **Balances:** every balance the sum of its postings after half a year of play.
- **Values never read:** every field of an account's and a card's state read fewer than twice was followed to a reader;
  none is unread.
- **Choices that change nothing, success with nothing changed, effects never applied, a control wired to the wrong
  command, an opportunity offered twice:** none found.
- **Notices describing behaviour that isn't there:** two, defects 1 and 4.
- **Impossible scheduling:** defect 2. A card's due day also moves with the month's length, for the owner.
- **Reachable only by a test:** the 15 rows above.

## Defects Found And Repaired

Each has its test, in `tests/b20-money-defects.test.ts` or `tests/b20-money-promises.test.ts`; three failed before their
repair.

1. **Short For A Payment gave a false alarm** (`systems/obligations.ts`): it told the player to move money into checking
   for a card's autopay or a loan payment that their linked savings then paid. Failing before: `expected [ { id:
   'notice_000023' … } ] to deeply equal []`. The alert counts what the payment would draw now. Mutation B20-MONEY-1.
2. **A loan's payment day drifted** (`systems/lending.ts`, `scheduleLoan`): a loan taken on 31 October was paid on the
   28th from February on. Failing before: `expected [ …, 1798642800000, … ] to deeply equal [ …, 1798729200000, … ]`.
   Each payment falls on the day the loan was taken, or the last day of a shorter month. Mutation B20-MONEY-2.
3. **Iceland refunded tax a customer abroad never paid** (`refundInterestTax`): a Reykjavík-raised student keeping her
   Arion account from New Haven has 12% withheld, and the 1 June assessment refunded 22% of the first 300,000 kr: 66,000
   kr, or $478.26. Failing before: `expected [ { id: 'txn_00009m' … } ] to deeply equal []`. No refund for a customer
   abroad now, as `interestAllowanceLeft` already treated them; residents are unchanged. Mutation B20-MONEY-3.
4. **The round-ups guide promise was wrong** (`content/guide/money.ts`): it said only the debit card rounds up, but Citi,
   BBVA México and Santander México count their own credit card too, as the code does. The guide's words were corrected,
   not the code, and both text sources marked again in the second pass (`docs/text/second-pass/money.json`, by `money`).
   No earlier test read those words; `tests/b20-money-promises.test.ts` holds what the corrected words say. Mutation
   B20-MONEY-15.

## Mutations

22, in `../../mutations/money.json`, across credit, banking, lending, payments, spending, obligations, accountlife,
roundups, cardlife and finance; results in `../../mutations/money.txt`. The first run killed 21 by an assertion. B20-MONEY-14
(the bank never writes before handing the money to the state) broke its test with a TypeError instead, a SETUP ERROR. The
test now asserts the bank's letter is there before reading it, and the rerun killed B20-MONEY-14 too. All 22 killed by an
assertion.

## Outside The Area

- **The credit limit**, left alone as asked: on the area's clone, `card.request_limit` asked six times in a row on 24
  August 2026 raised $65,217 to $194,736 at once, and the review had no ceiling. The `card.statement` and
  `card.request_limit` rows were read before the coordinator's `c4832549` and say so.
- **The unclaimed savings** (the coordinator's question): the dormancy rule as built. The player is told twice first (a
  dormant notice on 1 March 2029, and the bank's letter on 1 June 2029 with Keep The Account); the bank's own interest
  isn't the owner's activity, as Conn. Gen. Stat. §3-57a has it; Claim It Back returns it exactly.
  `tests/b20-money-clock.test.ts` holds all three, with mutations 13 and 14.
- **The tools miss `bank.transfer_arrives`:** `tools/inventory.mjs` and `tools/effects.mjs` looked a kind constant up by
  its name across every file, so `cardlife.ts`'s `ARRIVES_KIND` (`card.arrives`) stood for `bankmoves.ts`'s
  (`bank.transfer_arrives`), and the scheduled kind was in neither. (The coordinator fixed the inventory: each name is read
  in its own file, and two more kinds came to light, `health.appeal_decided` and `pro.agent_reply`.)
- **`tools/effects.mjs` read a promise's tests from `evidence.tests`,** where INSTRUCTIONS.md says `tests`. Each money
  promise has both. (Fixed by the coordinator: both are read.)
- **The life area:** a life moved one hour at a time and never put to bed ends at stress 100 and condition 1.82. Its money
  was unaffected.
- **The area's own slip:** it ran `git stash list` once, which only reads, where INSTRUCTIONS.md says never to run any form
  of `git stash`. Nothing was stashed or popped.

## For The Owner, Not Changed

- Autopay can't be turned off.
- A card's due day moves with the month (Chase: the 11th, 10th, 11th), where Reg Z §1026.7(b)(11) asks the same day each
  month.
- Savings rates published as an APY are run as nominal rates: Capital One's "3.00% APY" pays 3.04% APY in the game.
- The penalty rate at 30 days late, not 60, and the charge-off at 150 days, not 180, which `credit.ts` already gives the
  owner.
- A standing order due on a weekend is paid that day.
- The rows no life reaches wait on the owner's banking decisions.

## Checks

The area's six test files, 22 of 22 on one worker (the slowest 33 seconds); with the guide's and the money editorial tests,
113 of 113. After the repairs, the loan and alert tests (23 files, 353 tests), the Iceland tests (bank-fees,
decisions-arion, home-account-tax, home-account-ledger) and `module-load-order` pass. `npx tsc --noEmit -p
tsconfig.app.json` exit 0; eslint on every changed file exit 0; the text-inventory and surfaces checks exit 0. No journeys
and no built-app walk were run in this area.
