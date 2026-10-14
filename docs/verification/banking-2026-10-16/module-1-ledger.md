# A Bank Account Kept At Home: Module 1, The Ledger

On 2026-10-16 the owner decided that an eligible Yale student may keep a bank account they already held in the country
they lived in before Yale, beside the American one. This record covers the first module of that work, the ledger, and
only it. Nothing in play opened such an account when this module was finished; eligibility and creation are module 3.

## What Was Wrong

Every save kept its money in one currency, and a bank's own figures were converted into it (`inSaveMoney`,
`systems/banking.ts`). For an account at a bank in another currency that isn't exact, because a sum of conversions
isn't the conversion of the sum: at SLATE's 0.79 pounds to the dollar, five postings of 1¢ are 1p each at the bank, 5p,
and 5¢ converted is 4p; and £10,000 a bank sold for $12,700 reads £10,033.00 converted back.

The design's own example, £10,000 in and £1,000 out reading £8,999.99, was rechecked and was wrong: 1,139,241¢ × 0.79
is 900,000.39, so £9,000.00. A cent is finer than a penny, so pence typed, turned into cents and back come home exact;
the figures part only where small conversions add up or a bank's own rate was used.

## What Changed

- `src/engine/core/ledger.ts`: an account gained `currency` (only where it isn't the save's), `held` (the bank's figure
  in its own minor units) and `lastUsedBefore`; a posting gained `native`. `post` filled a missing `native` on a posting
  to a currency account with the exchange from the save's currency, through a converter the ledger was handed, and kept
  `held` as the sum of the natives. A posting of exactly the account's negative balance took exactly its negative
  `held`, so an account emptied was empty in both figures. A caller's own `native` was kept as given; a `native` on an
  account kept in the save's money was refused, and nothing moved. `recomputeHeld` and `audit` gained the law: `held`
  is the sum of the natives on a currency account, every posting to one carries a native, and no other posting does.
- `src/engine/core/simulation.ts`: the ledger was given SLATE's rates (`exchange`, `content/currency.ts`) from the
  save's currency, and `post` passed a `native` through.
- `src/engine/core/invariants.ts`: `breaches` gained the same law, as "held not the sum of its postings", "posting in
  another currency without its figure" and "figure in another currency on an account kept in the save’s".
- `src/engine/systems/lending.ts`: `lastUsed` read no earlier than `lastUsedBefore`. Until then an account nothing had
  posted to counted as untouched since it opened, so one opened years before the save would have gone inactive at its
  first month's end. The design named two `lastUsed` implementations; the tree held one. `idleAccounts` in
  `systems/accountlife.ts` took it as an argument and was left as it was, since a second reading there would have been
  a guard nothing could fail.

A transaction still balanced in the save's cents, so conservation, every balance, net worth and the server's sums were
as they had been. Rates don't move in SLATE, so there was no gain or loss on exchange to post.

## What Was Decided

- No schema version change. Every new field was optional and written only on a currency account, and no save before
  this one had any, so an older save loaded and behaved as before. `SAVE_SCHEMA_VERSION` and
  `SUPPORTED_SCHEMA_VERSION` stayed at 94.
- `base44/shared/guard.js` was read and left alone. Its sums were in the save's cents, which still summed to zero; a
  native has no counterpart to sum against.
- `Account.peak`, which the design named for America's reporting thresholds, wasn't added. Nothing in this module would
  have written or read it, and a field nothing reads is worse than none. It belongs to the module that updates it daily.

## How It Was Proved

`tests/home-account-ledger.test.ts` opened a pound account at HSBC UK directly in a Yale save, labeled as test setup,
since nothing in play made one. Its figures were worked by hand from the rates: $123.45 filled in as 9,753p; a caller's
7,800p for $100 kept over the 7,900p conversion; £10,000 in, £1,000 out (filled in as 100,000p), and the rest closed
to 0 in both figures; five 1¢ postings (5p) closed with −5p, not the −4p the conversion gives; £10,000 bought for
$12,700, £1,000 out, and the rest closed with −900,000p, not the −903,300p the conversion gives; a native refused on a
dollar account with nothing moved; a tampered `held` and a native on a dollar posting each caught by `audit` and
`breaches`; `held` and the natives kept through a save and a load; and an account opened five years before the save,
nothing posted, kept active through its first month's end by `lastUsedBefore`, beside one without it that went
inactive at HSBC UK's 24 months.

Nine tests passed. Each file below was run alone, and every test in it passed unchanged: money 16, integrity 20,
simulation 126, persistence 14, save-migration 4, base44-contract 22, base44-adapter 11, server-guards 23, accountlife
30, lending 19, banking 19, banking-complete 3, bank-fees 32, bank-lifecycle 6, bank-moves 11, bank-moves-card-line 6,
bankdays 3, defects3-bank 5, money-fixes 4, journey-money 1, statements 17, smoke 13. `tsc -b --noEmit` and ESLint on
the changed files were clean. The full gate wasn't run for this module.

Each mutation was applied, run against the new tests, and restored byte for byte:

| Mutation | Result |
|---|---|
| The closing exception dropped | Killed: the 1¢ case closed with −4p, the bank's-rate case with −903,300p |
| The auto-fill dropped | Killed: six tests failed |
| The law dropped from `breaches` | Killed: a tampered `held` went unreported |
| `lastUsed` reading `openedAt` alone | Killed: the account brought in went inactive |

The first run of the closing-exception mutation survived, because the design's example closes exactly either way; the
two drift cases were added for that reason.
