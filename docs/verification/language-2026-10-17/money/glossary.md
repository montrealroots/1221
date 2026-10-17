# Brief 14, The Money Area: Its Terms

For `docs/GLOSSARY.md`, section Money, in its columns. The coordinator merges it. Terms another area also uses, or a Core
term this area thinks needs a change, are listed at the end for the coordinator to decide.

| Say | What It Means | Instead Of |
|---|---|---|
| **current account** | The everyday account wages are paid into and spending comes from (`kind: 'checking'`). A bank's own name for it is used beside it (Chase Total Checking, AktivKonto). | checking account in prose, "what you spend from" |
| **primary account** | The current account money comes from unless you say otherwise: the debit card's everyday purchases, cash from a machine, bills paid by hand, a new standing order or autopay (`primaryAccountId`, `PRIMARY_DOES`). Making another account primary moves nothing already set up. | "the account the day comes out of", "Primary." alone |
| **savings**, **easy-access savings** | A savings account at a bank where you keep a current account, one per bank. Easy-access, as against a term deposit. | "what you put aside" |
| **term deposit** (and the bank's own name: CD, Fixed-Term Savings) | Money locked away at a fixed rate for the bank's term (`category: 'term'`). | |
| **balance** | What an account holds now, added up from every payment in and out of it. An overdrawn balance is shown with a minus sign and the word Overdrawn, to the cent. | "the sum of the postings" |
| **available balance**, **posted balance** | Available is what you can spend now, card payments still pending already taken off. Posted counts only payments that have gone through. | "completed items", "held against the balance" |
| **pending** | A card payment that has been approved but hasn't posted; it says the day it posts. Never called available money's opposite: it already counts in the available balance. | |
| **overdrawn**, **overdraft** | Below zero. The overdraft is what the bank pays past zero, arranged or not, on its terms. | "under", "what's under" |
| **monthly fee**, **waived** | An account's fee and the conditions that cancel it in a month: "waived in any month you keep $1,500 in it all month". | "waived with keeping …", "unless that changes" |
| **minimum payment** | The least a card statement asks to be paid by its due date. | "the least a statement asks" |
| **statement**, **due date** | A card's monthly statement, and the date its payment is due. | |
| **late fee** | What paying less than the minimum by the due date costs. | "a payment short of the minimum costs" |
| **credit record**, **credit score** | The record each month's report keeps, scored 300 to 850; the score is its figure. | "your record" alone where the card's record could be meant |
| **charged off**, **collections** | A debt the bank stopped pursuing itself and sent to collections; on your record until paid. | |
| **payment plan** | On a card: part of what's owed paid off in equal months for a fee or a rate, or the hardship plan the bank sets. | "a plan" alone where it could be read as anything |
| **standing order**, **payment set for a date**, **autopay** | A monthly payment of your own into savings; a one-off payment on a day you choose; a card's automatic payment from a current account. | "scheduled payment" (kept as the notice's title) |
| **estimated** | A figure the game had to estimate because the bank doesn't publish it: said at the foot, in the Sources And Estimates line ("The debit card’s days are estimated: the bank doesn’t say."). | "SLATE’s estimate" mid-sentence |
| **the game’s exchange rate** | The fixed rate the game converts each currency at: an estimate, not a live market (`content/currency.ts`). | "SLATE’s rate" |
| **notice**, **notice period** | The months a German savings account needs before it closes, past what a month lets out; the days a bank needs to end a term deposit early. | "the notice ran out" |
| **dormant**, **reactivate** | An account unused for the bank's months is blocked until you press Reactivate. | "untouched … blocked until it’s used again" |

## For The Coordinator

- **"the game’s exchange rate"** replaced "SLATE’s rate" on my screens (an engine-speak pattern). The papers area's
  `systems/abroad.ts` and the start area's `ui/creation/CharacterCreation.tsx` still say "SLATE’s rate": one term for
  Core, I'd suggest this one.
- **"The Day’s Spending"** is kept as the How You Pay label: `systems/spending.ts` (mine) and the health area's
  `content/guide/body.ts` quote it, as they do "past its payment ceiling". Renaming it means the health area's guide
  too.
- **"available" and "pending" money** (Core) is right as written; the screens now say it the same way ("Posted payments
  only: what’s pending hasn’t posted yet"; a pending entry "already counts in your available balance").
