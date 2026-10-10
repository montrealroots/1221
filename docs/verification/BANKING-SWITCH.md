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
