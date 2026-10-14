# A Bank Account Kept At Home: The Open Defects

Modules 6 and 7 (`module-6-7.md`) left five things open. This record covers what was done with each on 2026-10-16,
in the work plan's dating (the commits are dated 2026-10-14 by the clock), and four defects found while doing it.

## What Was Wrong, And What Changed

**SMBC's ¥220 overdrew an empty account, and the overdraft's set-off then paid interest early.** A home account at
SMBC opens its current account at nothing and puts the savings in a second ordinary deposit. The month's end posted the
¥220 on the current account whatever it held, so it went ¥220 below zero a month. Played to February, it was worse than
the record said: at 60 days the overdraft's set-off (`closeForOverdraft`) settled the savings' interest "on closing",
moved ¥441 out of the savings to cover ¥440, and told the player "SMBC Closed An Account" while nothing closed, every
second month. The tax test's 472¢ and 589¢ of 2026 interest were those early settlements: SMBC pays in February and
August.

SMBC's own words, in the research: "If the fee cannot be debited, transfers and some other services stop." A Japanese
ordinary deposit has no overdraft. So (`systems/abroad.ts` `chargeAbroadFee`, `content/homeaccounts.ts`
`NonResidentFee.unpaid`):

- At a bank marked `unpaid`, the fee comes from the current account where it holds the whole, else from the savings at
  the bank that does. Both are the same ordinary deposit in SLATE, where SMBC's books debit one representative account:
  SLATE's reading.
- Where neither holds it, nothing is charged and it's owed (`Account.feeOwedHeld`, in yen, on the current account),
  taken the first night either holds it (`systems/banking.ts`, the day's rollover). Meanwhile the bank sends nothing
  abroad, in its words (`abroadQuote`), and the account can't be closed (`closeRefusal`), as an overdrawn one can't.
- MUFG publishes nothing on a fee it can't take. It's marked the same, and its words say that's SLATE's assumption
  from SMBC's rule.
- The French banks' fees still overdraw an empty account: a French bank debits into an unarranged overdraft, and
  France's letters follow.

**The set-off lost a yen.** Between two accounts in a currency not the save's, each side worked out its own figure from
the dollars. The bank's own figure now goes on both sides, so each clears exactly in both (`closeForOverdraft`).

**The set-off's notice and France's said what didn't happen.** Where the money held at the bank covered the debt, the
notice said the bank had "closed it", and closed only other accounts that ran below zero, never the current account.
BNP Paribas' French notice said the account "closes … on December 29, 2026, unless it's back within it", and it never
closed. Now the current account closes where the life keeps a current account at another bank in the country they live
in, and the wages and the primary move there, as the charged-off branch already did. An account kept at home abroad
doesn't count, since Yale pays only into an American one. Otherwise it stays open. The notice names what closed and what
stays open ("BNP Paribas Took What It Was Owed" where nothing closed). The interest settled first on an account that
stays open says "before the set-off", not "on closing".

**France's overrun letters quoted a euro account in dollars.** Module 7 put every screen in the account's own money, and
missed these. They're in euros now, the dollars beside, the amount past the limit being the bank's own figure exactly.

**A home savings account listed every empty month back to 2018.** `periodsOf` started at `openedAt`. An account held
from before the life began now starts at the month the life began: SLATE has nothing from before.

**Your Banks named Chase's autopay only after a reload, and named a closed card's.** `linkedTo` read only a pinned
`autopayFrom`, and a card's is pinned the first time anything asks for it. Before the first ask, the line was missing,
though the autopay pays from the primary account. A closed card's pinned autopay was named too, so closing the current
account it had paid from was refused until a card that no longer existed had its autopay moved. `linkedTo` now reads an
open card's autopay as it pays: pinned, or the primary account.

## Left As They Were

- **A term deposit's interest isn't tagged with its country.** No home account can open one (`abroadRefusal`), so no
  played life has a term deposit at a bank abroad.
- **The conditions an account is kept on are taken as met.** That's the owner's design of 2026-10-16, and
  `docs/UNBITTEN.md` says so.
- **A peak is the day's end.** Unchanged from module 6.

## How It Was Proved

Each life was made with `createSave` on `newLifeConfig` with Before Yale's fields, and played on the clock:

- `tests/home-account-abroad.test.ts`: SMBC's ¥220 taken from the savings on 31 August, and the current account left at
  ¥0. With no savings kept at home, it's owed (¥220, then ¥440 a month later), and an $11 payment from Chase lands under
  what's owed (¥1,650 less the margin and SMBC's ¥1,500 for receiving it). Then a payment from SMBC is refused in its
  words with ¥440 named, Close It is refused, and $100 more is let in. That night both months are taken together (‑293¢,
  ‑¥440), and ¥5,000 goes out again. Savings drained to ¥100 by a payment to Chase aren't taken below zero, and the fee
  is owed. MUFG's ¥300 is owed the same way. HSBC UK's savings, opened before 2026, list September and August 2026 only,
  as Chase's do. Chase's autopay line is there before a reload and after, and is gone once the card has closed.
- `tests/home-account-setoff.test.ts`, new, 4 tests: BNP Paribas' letters in euros, €30.24 ($32.86) on 1 October (€15
  twice and 24 cents of interest) and €45.72 ($49.68) on 30 November, whose twelve payments at 6.07% are $4.2774, so
  $4.28, €3.94. The Livret A sets off in the same euros on both sides, the Compte de dépôt closes, the Livret A stays
  open and says "before the set-off", and Chase stays primary. A Livret A drained to €20 gives the whole of itself in
  euros, and the rest is charged off. A New Haven student with Chase savings that cover a $3,000 overdraft (TEST SETUP)
  and a Bank of America current account beside it: Chase's current account closes, and the primary and the wages
  (`depositTo`) move to Bank of America. A Londoner with Chase savings and only HSBC UK besides: Chase's stays open, and
  "Chase Took What It Was Owed" says so.
- `tests/home-account-tax.test.ts`, the figures reworked by hand, as its header shows. The F-1 at SMBC: August's 54¢,
  Japan's 8¢. The wealthy citizen: 3,168¢ and 485¢. With $30,000 of wages that's 3,168,768¢ of income, 1,558,768¢ taxed,
  162,252¢ before the credit, and a credit of the lesser of 485¢ and 162,252 × 3,168 / 3,168,768 = 162.21, so 162¢. With
  $250,000, the whole 485¢. Form 8938: ¥61,960,254.50 at most is $413,068, and the ¥61,959,374.50 on 31 December, four
  of SMBC's ¥220 later, is 41,306,249.67¢, held to the cent as 41,306,250, so $413,063.

Mutations, each applied to the file and restored from a copy of its own, compared with `cmp`, identical each time:

| Mutation | Result |
|---|---|
| No `unpaid` rule (every fee overdraws) | Killed: 5 tests |
| No fall-back to the savings | Killed: 3 tests |
| Savings taken whatever they hold | Killed: the savings drained to ¥100 |
| What's owed not added to the month's fee | Killed: the owed case |
| Payments abroad not stopped | Killed: the owed case |
| What's owed never taken | Killed: the owed case |
| Close It not refused | Killed: the owed case |
| The nightly take skipping a closed account | Survived: no account with a fee owed can close (Close It refuses it, and only Citi closes one idle at zero). The guard was removed. |
| The set-off without the bank's own figure | Killed: BNP Paribas |
| The current account never closing | Killed: BNP Paribas |
| An account abroad counted as somewhere to bank | Killed: the Londoner at Chase |
| Every settlement called "on closing" | Killed: BNP Paribas |
| The wages not moved | Killed: Bank of America |
| The primary not moved | Killed: Bank of America |
| The whole debt taken whatever the savings hold | Killed: the drained Livret A |
| The redirect without its guard | Survived: kept, with a comment saying no played life reaches it (a savings account can't go below zero since 2026-09-27) |
| France's letters in dollars | Killed: BNP Paribas |
| France's figure converted instead of exact | Killed: €30.23 for €30.24 |
| Statements back to the opening | Killed: HSBC UK's savings |
| Only a pinned autopay named | Killed: Chase before the reload |
| A closed card's autopay named | Killed: the closed card |

The seventeen checks: devmap and traceability failed until their maps were written (`--write`) for the new tests, then
all seventeen exit 0, each read from a file. The full gate on the committed revision is in the work plan.
