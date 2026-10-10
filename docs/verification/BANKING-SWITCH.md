# Switching Banks: The Defect As Found

Reproduced on 2026-10-10 against `main` at `a2bf025d`, through the commands, before any fix. The player is a New Haven student whose first bank is Chase.

## The paths there were

| What the player wants | How the game offered it | What it did |
|---|---|---|
| Choose a bank at creation | Starting Point, Your Bank | Opens a current and a savings account there, with the starting money. |
| Open an account at another bank | None | Only `bank.switch` reached another bank. |
| Keep accounts at two banks | None | Every route to a second bank closed the first. |
| Change the primary account | None, except by switching | `primaryAccountId` was set only by creation and `completeSwitch`. |
| Move money to another bank | None | `bank.transfer` moves money only between accounts at the same bank, and does so at once. |
| Replace the account number | `bank.new_number` | Same account, new number (fixed earlier today to protect against debits tried on the old number). |
| Close or cancel an account | `bank.close_savings`, `bank.cancel_new` | Savings only; a current account could only close by switching away from it. |
| Redirect incoming payments | None | Every incoming payment (`payeeAccount`) went to whichever account was primary on the day it arrived. |
| Manage standing orders and scheduled payments | Payments And Cash | A standing order paid from whichever account was primary on its day; a scheduled payment from the account it was set on. |
| Card autopay | The card's panel | Paid from whichever account was primary on the due date. |

## `bank.switch` in a country without a switching service

That covers the United States, so every New Haven student. `bank.switch` called `completeSwitch` at once. With no time passing, it:
1. opened a new current account and savings account at the chosen bank, with no application, identity check or approval beyond a photo ID in force;
2. paid each old account's interest, settled its fees, and moved its whole balance across in a ledger posting, as if no interbank transfer took time;
3. closed both old accounts;
4. pointed the primary account at the new one;
5. repointed standing orders and scheduled payments, as a switching service would. No US service does this.

The screen promised "You open the new accounts and move the money yourself, the same day." The engine did both, instantly.

## Measured

`tests/zz-probe.test.ts`, run once and deleted: Chase → Bank of America → Chase → Wells Fargo → Chase, in the same instant.

- Every switch was accepted. $92,391.00 and $413,043.00 crossed four banks with no time passing; eight postings named "Moved to …".
- The run left eight closed accounts and two open ones, each newly opened. Every switch reset the account's age (`openedAt`), which restarts any new-account fee waiver (`firstMonths`) and dormancy.
- No debit card was issued at the new bank: none was modelled at opening.
- The Chase credit card stayed open throughout, correctly.
- Pending card statements and month-end work were unaffected.

## What was wrong

- A preference (which account is primary) and a whole banking relationship (opening, funding, moving payments, closing) were one instant action.
- Money moved between institutions with no transfer time.
- Opening another bank's account was impossible without closing the first, so keeping two banks wasn't possible.
- Every incoming payment and every standing order followed whichever account was primary when it ran.
- The screen's sentence described a process the player didn't carry out.

## What happens now (from 2026-10-10)

Each step is its own command, in `systems/bankmoves.ts` and `systems/routing.ts`, with the banks' own terms in `content/bankopening.ts` (sources: `docs/research/world/research-banking.json` and `research-banking-intl.json`).

| Step | Command | What it does | What it doesn't |
|---|---|---|---|
| Open | `bank.open_current` | Applies at one bank where you live, which checks screening, debts owed to it, photo ID, age (18 at the four US banks that say so) and, at Citi online, US citizenship or residence. Opens at once, or after Bank of America's 1–2 business-day review. The account opens at $0 with its own number, date and history. Where the bank asks (Bank of America $100, Wells Fargo $25), the opening deposit comes from another of your accounts. The debit card arrives in the bank's own days; Bank of America's digital card works meanwhile. | It gives the new account no money or history, and closes nothing. |
| Move money | `bank.transfer` across banks | Leaves the source at once, is held as Money In Transit (still yours, in no account), and arrives after the sending bank's days: Chase 3, Wells Fargo 2, Capital One 3, Citi same day before 12:30 and next day after, Bank of America unpublished (SLATE estimates 3). Instant in Britain, the euro countries, Iceland, Korea, Mexico, Australia and New Zealand. Citi's $10,000 a day and $15,000 a month apply. If the destination has closed, the money comes back. | It doesn't arrive early, and nothing is counted twice. |
| Primary | `bank.set_primary` | Sets where debit-card purchases, ATM cash and bills paid by hand come from, and the default for anything new. | It moves nothing already set up. Everything not yet pinned is pinned first. |
| Wages | `bank.redirect_deposits` | Changes where wages, the scholarship, benefits and refunds are paid, from 14 days on (`DEPOSIT_LEAD`, SLATE's estimate; employers say one to two pay cycles). | Anything paid before then still goes where it was going. |
| Orders and autopay | `bank.set_order_source`, `card.set_autopay_from` | Each pays from the account it was set up on until you move it. | |
| Close | `bank.close_current` | Refused while it's the only or primary current account, overdrawn, has money on the way in or out, has anything still linked to it, or has savings open beside it. Pending card payments are refused too, except at Citi, which keeps the account open and restricted for up to 21 days. Interest and fees are settled. The balance goes by transfer to the account you name. The account's history stays. | It doesn't reroute or erase anything silently. |
| Bank closes it | daily check | Capital One closes an account unfunded after 60 days; Citi one at a zero balance for 90. Payments into it are redirected; orders from it fail and say so. | Chase's and Wells Fargo's discretionary closings aren't kept: neither gives a fixed day count. |
| Switching service | `bank.switch` | Runs only where a service exists: Britain 7 working days, Ireland 10, Germany 12, France 22, Spain 13, Iceland 12 and New Zealand 5. Wages, standing orders and autopay move with it. | In the US, Canada, Australia, Japan, Korea and Mexico it's refused, and the steps above are offered instead. |

Measured in `tests/bank-moves.test.ts` (11 tests, labelled player journeys and fixtures, with save and reload between steps). Two mutations were tried, and the tests caught both. Without the pinning in `bank.set_primary`, three tests fail. With instant transfers, three tests fail.
